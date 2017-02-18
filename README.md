# UDPeer

## Description

  A simple UDP peer 2 peer communication framework. 
  
  If two machines could talk via WebRTC, they should also be able to exchange UDP. This is what this project is about.
  Detailed documnetation coming soon.
  
## Prerequisites  (avoid crash due to Webrtc package)

sudo apt-get install python2.7 git-all pkg-config libncurses5-dev libssl-dev libnss3-dev libexpat-dev
  
## How to run

Step1: Decide a unique identity for your machine (ClientIdentity), for server(ServerIdentity) and the name of common channel(Ourchannel) where you would exchange messages. Unique names should be very helpful for all 3 terms.

Step2: Find which UDP port your client is running over and which server port it is using. Lets call them C and S

Step3: Decide one proxy UDP port on each machine. Client proxy port is CProxy and Server proxy port is SProxy.

That's it. 

clone the github, npm install and run following on client

node index.js -i -m ClientIdentity -r ServerIdentity -c Ourchannel -p CProxy:C

On the server Side

node index.js -i -m ServerIdentity -r ClientIdentity -c Ourchannel -p SProxy:S

After a while the server and node proxy shall connect via webrtc and you will see message e.g.

`Client connected with  node1  on channel  udpeer`

You could then change your server IP addresses to talk to localhost proxy ports instead of remote Addresses.

E.g. if your server configuration in the client was 12.131.121.14:3456
Then it will become 0.0.0.0:7890 (if you chose 7890 as CProxy in previous example)


Note: The current code doesn't encrypt the communication. Please use at your own risk.
