# visio
Barebones live streaming h264 from raspivid to browser with node and broadway

## Server
Receives h264 stream from raspivid and serves it to websocket clients.
Start with ```node index.js --tcpport 8000 --wsport 8081```

## Streamer
Streams h264 from raspivid to the server. Start with ```./raspi.sh```

## HTTP-server
You should get one. Tested with ```http-server```

## Client
Minimal client is now running at ```http://server-ip:8080/```. Works on most things.
