# UDPeer

## Description

UDPeer (you-dee-peer) is a simple UDP peer 2 peer communication framework, built on top of the hardwork done by webrtc developers and various other awesome Nodejs contributors. 

  
**The basic idea is as follows:**

If two machines could talk via WebRTC over NAT and firewalls, they should also be able to exchange UDP packets. This is what this project is all about.
UDPeer is a simple UDP proxy running on both sides to provide a bidirectional UDP channel.  
  
## Prerequisites 

This proxy will only work if your client and server could communicate over webRTC using public internet. 
Usually it works without any problem as long as you have outgoing internet connections, but just to verify you could also test this out at various sites such as https://simplewebrtc.com/demo.html

## Installation

Really simple. 

`npm install -g udpeer
`

## Overview
You will need to run seperate instances of udpeer proxy on client and server side. They will establish a communicatîon channel with each other using WebRTC which punches through firewalls. 
webrtc requirs signalling between nodes, which is done using Signalhub (https://github.com/mafintosh/signalhub) a simple websocket based server. 
Ideally you should setup your own signalling server and specify the URL there. 

Once the proxies establish a communication channel, they will expose a UDP local port on localhost. The client and sever programs will talk to these local ports instead of talking to each other. 

>```
>
>                 +--------+                            +--------+
>                 |        |                            |        |
> +----------+    |        |       WEBRTC               |        |      +----------+
> | Client   +----+ Node 1 +----------------------------+ Node 2 +------+ Server   |
> +----------+    |        |                            ^        |      +----------+
>                 |        |                            |        |
>                 |        |                            |        |
>                 +----+---+                            +----+---+
>                      |            +-----------+            |
>                      |            |          ||            |
>                      +------------+ SIGNALHUB|-------------+
>                          WebSocket|          ||  Websocket
>                                   +-----------+
>


## How to run

Agree upon a unique common channel name between two parties. It is simply a large string. If you are unsure, run UDPeer without a channel name and it will generate one for you. Pass this on to other party. 
Allocate one proxy UDP port on each of the machine. Let's call it Client proxy port (CProxy) and Server proxy port (SProxy).

That's it. Install UDPeer on both machines. 

`npm install -g udpeer
`

On client side 

`udpeer -i -c channelId -p CProxy:C
`

On the server Side

`udpeer -c Ourchannel -p SProxy:S
`

Usage
```
Usage:
udpeer [-i] [--channel=channelID] --ports=proxy:client
  -i --init      = should be true only for initiator of the connection (only one of the two parties)
  -m --my        = A unique node name for your machine, if you want to override
  -c --channel   = The channel where two nodes will communicate. Must be unique
                   If you don't specify, it will be generated, which needs to be shared with your peer.
  -s --signal    = Your own private signaling URLs, seperated by comma. e.g. https://url.com,https://url2.com
  -p --ports     = The local ports in the form proxy:local
  -l --localhost = Localhost IP (127.0.0.1 by default) 
  -v --version   = Version
  -h --help      = print this message

Example. Machine 1
udpeer -cFQBLA7?H8N5ZHP65 -p 5000:5001
At Machine 2 (As initiator)
udpeer -i -cFQBLA7?H8N5ZHP65 -p 6000:6001
```  

If everything works well, after a while the server and client proxy shall connect via webrtc and you will see a message on console. 

##Modifying client configuration

Once the proxy is setup, you could then change your server IP addresses in the client settings to talk to localhost proxy ports instead of remote Addresses.

E.g. if your server configuration in the client was 12.131.121.14:3456
Then it will become 0.0.0.0:7890 (if you chose 7890 as CProxy in previous example)

*What if my my client doesn't uses fixed source port for communication?
Don't worry, we have got this covered. As soon as the client connects to proxy, the proxy will save the client source port and reply back to the same next time. 

**Note: The current code doesn't encrypt the communication. Please use at your own risk. Please follow any guidelines your IT staff has provided regarding basic port security.** 

##Crash Due to  WebRTC

In order to avoid some crashes in webrtc package in Ubuntu, following are the prerequisites on Ubuntu/debian packages. 
Please note that these are dependencies for Node.js webrtc package, not UDPeer directly. Please give it a try
`
sudo apt-get install python2.7 git-all pkg-config libncurses5-dev libssl-dev libnss3-dev libexpat-dev
`

## Acknowledgement

This package is possible, thanks to the hard work of

https://github.com/mafintosh/signalhub
https://github.com/js-platform/node-webrtc
