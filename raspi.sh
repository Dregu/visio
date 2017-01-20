#!/bin/sh

# UDP mode
raspivid -w 848 -h 480 -t 0 -fps 25 -g 50 -ih -b 700000 -pf baseline -o - | pv | socat - udp4-datagram:localhost:8000,shut-none,reuseaddr

# TCP mode
#raspivid -w 848 -h 480 -t 0 -fps 25 -g 50 -ih -b 700000 -pf baseline -o - | nc localhost 8000

# We can even do 1080p30 if we want
#raspivid -w 1920 -h 1080 -t 0 -fps 30 -g 60 -ih -b 2000000 -pf baseline -o - | nc localhost 8000
