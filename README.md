# visio
Ultra fast live streaming raw h264 from Raspberry Pi to multiple browser
clients with Node, websockets and
[Broadway](https://github.com/mbebenita/Broadway). The latency on LAN at 25fps
is about 4 frames or 160ms.

## Installation
```
npm install
```
If you are going to use UDP, also install socat.
```
apt install socat
```
Tested on RPI1, raspbian jessie and node v7.4.0.

## Server
Receives h264 stream from raspivid and serves it to websocket clients.
Start with ```node index.js --udpport 8000 --wsport 8081``` for UDP mode
or ```node index.js --tcpport 8000 --wsport 8081``` for TCP mode.

## Streamer
Streams live h264 from raspivid (or gstreamer) to the server. Check raspi.sh
and start with ```./raspi.sh```. You could use something like
```ffmpeg -re -i foo.mp4 -c:v copy -f h264 udp://localhost:8000```
to stream anything, just remember Broadway only supports h264 baseline and
no audio.

## HTTP-server
You should get one. Tested with ```http-server``` from npm.

## Client
Minimal client is now running at ```http://server-ip:8080/```.
Works on most things with canvas and websockets.
