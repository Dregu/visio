#!/bin/sh

# TCP mode
#raspivid -w 848 -h 480 -t 0 -fps 25 -g 50 -ih -b 600000 -pf baseline -o - | nc localhost 8000

# UDP mode
raspivid -w 848 -h 480 -t 0 -fps 25 -g 50 -ih -b 600000 -pf baseline -o - | socat - udp4-datagram:localhost:8000,shut-none,reuseaddr
