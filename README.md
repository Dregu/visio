# visio
Barebones live streaming h264 from raspivid to browser with node and broadway

## Server
Receives h264 stream from raspivid and serves it to websocket clients
Start with ```node index.js --tcpport 8000 --wsport 8081```

## Streamer
Streams h264 from raspivid to the server. Start with ```./raspi.sh```

## HTTP-server
Has none. Tested with ```npm i -g http-server && http-server```
