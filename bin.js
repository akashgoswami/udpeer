#!/usr/bin/env node


var SimplePeer = require('simple-peer');
var wrtc = require('wrtc');
var minimist = require('minimist');
var signalhub = require('signalhub')
const dgram = require('dgram');
const UDPServer = dgram.createSocket('udp4');
var minimist = require('minimist');


var argv = minimist(process.argv.slice(2), {
    boolean: [ 'init' ],
    alias: {
        m: 'my',
        r: 'remote',        
        c: 'channel',        
        s: 'signal',                
        h: 'help',
        p: 'ports'
    }
});


if (argv.help){
    
    console.log("node index.js --init true --myName=[Your unique name] --remote=[Peer unique name] --channel=[Channel] --ports=proxy:client");
    console.log("  -i --init      = should be true only for initiator of the connection (only one of the two)");
    console.log("  -m --my        = A unique node name for your machine.");
    console.log("  -r --remote    = A unique node name for your peer. ");    
    console.log("  -c --channel   = The channel where two nodes will communicate");        
    console.log("  -s --signal    = Your own private signaling URLs, seperated by comma. e.g. https://url.com,https://url2.com");            
    console.log("  -p --ports     = The local proxy port, followed by the client port");            
    console.log("  -v --version   = Version");            
    console.log("  -h --help      = print this message");    
    
    console.log("");            
    console.log("Example. Machine 1");            
    console.log("node index.js -m alpha -r beta -c letsplay -p 5000:5001");            
    console.log("At Machine 2");            
    console.log("node index.js -m beta -r alpha -c letsplay -p 6000:6001");                

    process.exit(0);
}

if (argv.version) {
  console.log(require('./package.json').version)
  process.exit(0);
}


var connected = false;
var initiator = argv.init || false;
var myName = argv.my ||  'node-1';
var peerName = argv.remote || 'node-2';
var channel = argv.channel || 'udpeer-1';
var signalURLs = argv.signal || 'https://signalhub.mafintosh.com';
var ports = (argv.ports || '5555:4444').split(':');
const localhost = '127.0.0.1'; // change to 0.0.0.0 in case your client/server are bound to interfaces


var localProxyPort = parseInt(ports[0]);
var localPeerPort =  parseInt(ports[1]);

var peer = undefined;
var subscription = undefined;
var retryHandle = undefined;

UDPServer.on('error', function(err) {
  console.error(`UDP server Unable to bind. error:\n${err.stack}`);
  UDPServer.close();
  process.exit(1);
});


UDPServer.on('listening', () => {
  var address = UDPServer.address();
  console.info(`UDP server listening at ${address.address}:${address.port}`);
  if (peer === undefined)  {
        createPeer();
  }  
});


UDPServer.bind(localProxyPort);

var hub = signalhub(channel, signalURLs);

UDPServer.on('message', (msg, rinfo) => {
  //console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
  localPeerPort = rinfo.port;
  //debug('got a message of length '+ msg.length+ 'from Local port' + localPeerPort);  

  if (connected){
    peer.send(msg);
  }
});



function createPeer()
{
    var subscription = hub.subscribe(myName)
      .on('data', function (message) {
          if (peer){
            peer.signal(message);
          }
          if (retryHandle){
            clearInterval(retryHandle);
            retryHandle = undefined;
          }    
    })

    peer = new SimplePeer({ initiator: initiator, wrtc: wrtc, trickle: false , objectMode: true, reconnectTimer: true });    
    
    peer.on('signal', function (data) {
        // when peer1 has signaling data, give it to peer2 somehow
        //var signal = Buffer(JSON.stringify(data)).toString('base64');    
        hub.broadcast(peerName, data);    
        
        if (initiator && !connected && retryHandle === undefined){
            retryHandle = setInterval(function(){
                hub.broadcast(peerName, data);        
            },5000);
        }
    })
    
    peer.on('connect', function () {
      // wait for 'connect' event before using the data channel
      console.log("Client connected with ", peerName, " on channel ",channel);
      connected = true;
      if (retryHandle){
        clearInterval(retryHandle);
        retryHandle = undefined;
      }
      subscription.destroy();
      subscription = undefined;
      
    })
    
    peer.on('data', function (data) {
      // got a data channel message
      //debug('got a message of length '+ data.length+ 'from peer1: ' + peerName);
      UDPServer.send( data, 0, data.length, localPeerPort, localhost); 
      
    });
    
    peer.on('close', function () {
      console.log("Peer ", peerName, " Disconnected");
      connected = false;
      peer.destroy();
      peer = undefined;
      createPeer();
    })
}


    
