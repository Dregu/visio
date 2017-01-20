# visio
Ultra fast live streaming raw h264 from Raspberry Pi to multiple browser
clients with Node, websockets and Broadway. The latency on LAN at 25fps
is about 4 frames or 160ms.

## Server
Receives h264 stream from raspivid and serves it to websocket clients.
Start with ```node index.js --udpport 8000 --wsport 8081``` for UDP mode
or ```node index.js --tcpport 8000 --wsport 8081``` for TCP mode.

## Streamer
Streams live h264 from raspivid to the server. Check raspi.sh and start
with ```./raspi.sh```. Uses socat for UDP datagrams.
You could use something like
```ffmpeg -re -i foo.mp4 -c:v copy -f h264 udp://localhost:8000```
to stream anything, but remember this only supports h264 baseline and no audio.

## HTTP-server
You should get one. Tested with ```http-server```.

## Client
Minimal client is now running at ```http://server-ip:8080/```.
Works on most things with canvas and websockets.
