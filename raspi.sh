#!/bin/sh

# UDP mode, with extra options for my halogen lighting. Don't worry about it...
raspivid -w 848 -h 480 -t 0 -fps 25 -ih -b 700000 -pf baseline -mm average -ISO 800 -awb off -awbg 1.0,2.5 -ex fixedfps -ev 10 -co 50 -br 65 -o - | socat - udp4-datagram:localhost:8000,shut-none,reuseaddr

# TCP mode, minimal setup
#raspivid -w 848 -h 480 -t 0 -fps 25 -ih -b 700000 -pf baseline -o - | nc localhost 8000

# We can do 1080p30 if we really want
#raspivid -w 1920 -h 1080 -t 0 -fps 30 -g 60 -ih -b 1200000 -pf baseline -o - | nc localhost 8000

# GStreamer kinda works, but the OMX encoder doesn't use inline headers.
# Our server however saves the SPS/PPS headers in TCP mode and sends them to every new client.
#modprobe bcm2835-v4l2
#gst-launch-1.0 v4l2src ! video/x-raw,width=848,height=480,framerate=25/1 ! omxh264enc control-rate=2 target-bitrate=700000 ! video/x-h264,width=848,height=480,framerate=25/1,stream-format=byte-stream,profile=baseline ! tcpclientsink host=localhost port=8000
