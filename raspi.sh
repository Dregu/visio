#!/bin/bash

# UDP mode, with extra options for my halogen lighting. Don't worry about it...
#raspivid -w 848 -h 480 -t 0 -fps 25 -ih -b 700000 -pf baseline -mm average -ISO 800 -awb off -awbg 1.0,2.5 -ex fixedfps -ev 0 -co 50 -br 65 -o - |\
raspivid -w 960 -h 544 -t 0 -fps 25 -ih -g 50 -b 1000000 -pf baseline -mm average -ISO 400 -awb off -awbg 1.0,2.5 -ex fixedfps -ev 0 -co 50 -br 58 -roi 0,0,1,1 -o - |\
 nc stream.wappuradio.fi 15000
 #socat - tcp:stream.wappuradio.fi:15000,shut-none

#  gst-launch-1.0 fdsrc ! h264parse ! rtph264pay config-interval=1 ! udpsink host=stream.wappuradio.fi port=7000
#  tee >(socat - tcp:stream.wappuradio.fi:9000,shut-none,reuseaddr) |


#  tee >(socat - tcp:stream.wappuradio.fi:7000,shut-none,reuseaddr) |\
#  socat - tcp:stream.wappuradio.fi:9000,shut-none,reuseaddr

# TCP mode, minimal setup
#raspivid -w 848 -h 480 -t 0 -fps 25 -ih -b 700000 -pf baseline -o - | nc localhost 8000

# We can do 1080p30 if we really want
#raspivid -w 1920 -h 1080 -t 0 -fps 30 -g 60 -ih -b 1200000 -pf baseline -o - | nc localhost 8000

# GStreamer kinda works, but the OMX encoder doesn't use inline headers.
# Our server however saves the SPS/PPS headers in TCP mode and sends them to every new client.
#modprobe bcm2835-v4l2
#gst-launch-1.0 v4l2src ! video/x-raw,width=848,height=480,framerate=25/1 ! omxh264enc control-rate=2 target-bitrate=700000 ! video/x-h264,width=848,height=480,framerate=25/1,stream-format=byte-stream,profile=baseline ! tcpclientsink host=localhost port=8000
