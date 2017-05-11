#!/bin/bash

# UDP mode, with extra options for my halogen lighting. Don't worry about it...
#raspivid -w 848 -h 480 -t 0 -fps 25 -ih -b 700000 -pf baseline -mm average -ISO 800 -awb off -awbg 1.0,2.5 -ex fixedfps -ev 0 -co 50 -br 65 -o - |\
#socat - udp-sendto:localhost:8000,shut-none

# TCP mode, minimal setup
#raspivid -w 848 -h 480 -t 0 -fps 25 -ih -b 700000 -pf baseline -o - | nc localhost 8000

# GStreamer kinda works, but the OMX encoder doesn't use inline headers.
# Our server however saves the SPS/PPS headers in TCP mode and sends them to every new client.
#modprobe bcm2835-v4l2
#gst-launch-1.0 v4l2src ! video/x-raw,width=848,height=480,framerate=25/1 ! omxh264enc control-rate=2 target-bitrate=700000 ! video/x-h264,width=848,height=480,framerate=25/1,stream-format=byte-stream,profile=baseline ! tcpclientsink host=localhost port=8000

# Test stream for swarm mode
# You can duplicate the actual raspivid stream on the server with socat and tee

#gst-launch-1.0 videotestsrc ! video/x-raw,width=848,height=480,framerate=25/1 ! x264enc bitrate=700 ! video/x-h264,width=848,height=480,framerate=25/1,stream-format=byte-stream,profile=baseline ! tee name=t\
# t. ! queue ! tcpclientsink host=172.18.0.3 port=8000 \
# t. ! queue ! tcpclientsink host=172.18.0.4 port=8000 \
# t. ! queue ! tcpclientsink host=172.18.0.5 port=8000 \
# t. ! queue ! tcpclientsink host=172.18.0.6 port=8000

# TODO socat and tee example
