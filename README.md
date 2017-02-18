# UDPeer

## Description

  UDPeer (U-dee-peer) is a simple UDP peer 2 peer communication framework, built upon the hardwork by webrtc and various other awesome Nodejs contributors. 
  
  The basic idea is as follows:
  Currently, nasty firewall rules don't allow software to communicate behind firwalls. However, if two machines could talk via WebRTC, they should also be able to exchange UDP. This is what this project is about.
  
## Prerequisites 

In order to avoid some crashes in webrtc package, following are the prerequisites on Ubuntu/debian packages.
`
sudo apt-get install python2.7 git-all pkg-config libncurses5-dev libssl-dev libnss3-dev libexpat-dev
`
## Overview

You will need to run seperate instances of udpeer proxy on client and server side. They will establish a communicatîon channel with each other using WebRTC which punches through firewalls. webrtc requirs signalling between nodes, which is done using Signalhub (https://github.com/mafintosh/signalhub) a simple websocket based server. You could run your own public server and specify the URL there. 

Once the proxies establish a communication channel, they will expose a UDP local port on localhost. The client and sever will talk to these local ports instead of talking to each other. 
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
`
## How to run

Before you could begin:- 

##Step1 

Decide a unique identity for your machine (called ClientIdentity), for the server (ServerIdentity) and the name of common channel (called Ourchannel) where you would exchange messages. The name doesn't need to be very long, but sufficiently unique. 

##Step2

Find which UDP port your client application is bound to and which server port it is using. If your UDP client uses a dynamic port every time, no problem.  The code will automatically update the client port once it connects to us. 

##Step3

Allocate one proxy UDP port on each of the machine. Let's call it Client proxy port (CProxy) and Server proxy port (SProxy)

That's it. 

clone the github repo into a local folder. On local client
`
npm install .
node index.js -i -m ClientIdentity -r ServerIdentity -c Ourchannel -p CProxy:C
`

On the server Side
`
npm install 
node index.js -i -m ServerIdentity -r ClientIdentity -c Ourchannel -p SProxy:S
`

If everything works well, after a while the server and client proxy shall connect via webrtc and you will see a message e.g.

`Client connected with  node1  on channel  udpeer`

##Modifying client configuration

You could then change your server IP addresses in the client to talk to localhost proxy ports instead of remote Addresses.

E.g. if your server configuration in the client was 12.131.121.14:3456
Then it will become 0.0.0.0:7890 (if you chose 7890 as CProxy in previous example)


Note: The current code doesn't encrypt the communication. Please use at your own risk. Please follow any guidelines your IT staff has provided regarding basic port security. 
