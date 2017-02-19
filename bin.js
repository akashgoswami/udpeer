#!/usr/bin/env node


var SimplePeer = require('simple-peer');
var wrtc = require('wrtc');
var minimist = require('minimist');
var signalhub = require('signalhub')
const dgram = require('dgram');
const UDPServer = dgram.createSocket('udp4');
var minimist = require('minimist');
var peerName = undefined;

var argv = minimist(process.argv.slice(2), {
    boolean: [ 'init' ],
    string: [ 'ports' ],    
    alias: {
        i: 'init',
        m: 'myName',
        c: 'channel',        
        s: 'signal',                
        h: 'help',
        v: 'version',
        l: 'localhost',
        p: 'ports'
    }
});


if (argv.help) printHelp();

function printHelp()
{

    console.log("UDPeer: Enable bidirectional UDP communication over webrtc");
    console.log("        Enables client server behind NAT/firewalls to communicate as long as they");    
    console.log("        could talk over webrtc");    

    console.log("Usage:");        
    console.log("udpeer [-i] [--channel=channelID] --ports=proxy:client");
    console.log("  -i --init      = should be true only for initiator of the connection (only one of the two parties)");
    console.log("  -m --my        = A unique node name for your machine, if you want to override");
    console.log("  -c --channel   = The channel where two nodes will communicate. Must be unique");        
    console.log("                   If you don't specify, it will be generated, which needs to be shared with your peer.");            
    console.log("  -s --signal    = Your own private signaling URLs, seperated by comma. e.g. https://url.com,https://url2.com");            
    console.log("  -p --ports     = The local ports in the form proxy:local");    
    console.log("  -l --localhost = Localhost IP (127.0.0.1 by default) ");         
    console.log("  -v --version   = Version");            
    console.log("  -h --help      = print this message");    
    var ch = generator(16, '123456789ABCDEFGHJKLMNOPQRSTUVWXYZ#!?');
    console.log("");            
    console.log("Example. Machine 1");            
    console.log("udpeer -c"+ch+" -p 5000:5001");            
    console.log("At Machine 2");            
    console.log("udpeer -c"+ch+" -p 6000:6001");                
    console.log("");       
    process.exit(0);
};

if (argv.version) {
  console.log(require('./package.json').version)
  process.exit(0);
}


function generator(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

        

var connected = false;
var initiator = argv.init || false;
// Generate a unique name
var myName = argv.myName || generator(10+Math.floor(Math.random()*10), '0123456789abcdefghijklmnopqrstuvwxyz');
var channel = argv.channel || generator(24, '123456789ABCDEFGHJKLMNOPQRSTUVWXYZ#!?');
var signalURLs = argv.signal || 'https://signalhub.mafintosh.com';
var ports = [];
var localProxyPort = 0;
var localPeerPort =  0;
var localhost = argv.localhost || '127.0.0.1'; // change to 0.0.0.0 in case your client/server are bound to interfaces

if (!argv.ports) {
    console.log("Ports parameter required");
    printHelp();
    process.exit(0);
}

if (argv.ports.indexOf(':') != -1){
  ports = argv.ports.split(':');  
  localProxyPort = parseInt(ports[0]);
  localPeerPort =  parseInt(ports[1]);
}
else {
  localProxyPort = parseInt(argv.ports);
  localPeerPort = 65533;
}

if (isNaN(localProxyPort) || isNaN(localPeerPort) || (localProxyPort>65534) || (localPeerPort>65534)){
    console.log("Error");
    console.log("Local ports Incorrect. Proxy port", localProxyPort, "local port", localPeerPort);
    console.log("");
    printHelp();
    process.exit(0);
}
else
{

  
}


if(!argv.channel){
  console.log("You have not specified any channel. Generating a unique channel");
  console.log("==============================================================");
  console.log("Your channel ID:",channel);  
  console.log("==============================================================");
  console.log("Please share above channel ID with your peer.\n");    
}



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
  console.log("UDP proxy Listening on",address.address+":"+address.port+" -> "+localPeerPort);  

  if (peer === undefined)  {
        createPeer();
  }  
});


UDPServer.bind(localProxyPort, localhost);
console.log("Connecting on Channel:", channel);
console.log("Your Identity:", myName);
var hub = signalhub(channel, signalURLs);

UDPServer.on('message', (msg, rinfo) => {
  //console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
  localPeerPort = rinfo.port;
  //debug('got a message of length '+ msg.length+ 'from Local port' + localPeerPort);  

  if (connected){
    try{
      peer.send(msg);
    }
    catch(e)
    {
      console.error("Failed to send message to peer. ",e.reason);
    }
  }
});


function createPeer()
{
    var subscription = hub.subscribe("*")
      .on('data', function (message) {
          if (peer && message.sender != myName){

            console.log("WebRTC-",message.data.type);
            if (message.data.type == 'offer' && retryHandle){
              // Received an offer, can't send offer again. 
              clearInterval(retryHandle);
              retryHandle = undefined;
            }
            try{
              peer.signal(message.data);
            }
            catch(e){
              console.error("Unable to signal peer", e.reason);
            }
            if (peerName != undefined && peerName != message.sender){
              console.log("Received a message from",message.sender, "along with",peerName);
              console.log("Are you sure that only 2 peers are on this channel?");              
            }
            peerName = message.sender;
          }
    })

    peer = new SimplePeer({ initiator: initiator, wrtc: wrtc, trickle: false , objectMode: true, reconnectTimer: true });    
    
    peer.on('signal', function (msg) {
        // when peer1 has signaling data, give it to peer2 somehow
        //var signal = Buffer(JSON.stringify(data)).toString('base64');    
        hub.broadcast("*", { sender: myName, data: msg});    
        
        if (initiator && !connected && retryHandle === undefined){
            retryHandle = setInterval(function(){
                hub.broadcast("*", { sender: myName, data: msg});        
            },10000);
        }
    })
    
    peer.on('connect', function () {
      // wait for 'connect' event before using the data channel
      console.log("Client connected with", peerName, "on channel",channel);
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
      peerName = undefined;
      createPeer();
    })
}


    
