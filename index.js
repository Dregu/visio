"use strict";

const net = require('net')
const dgram = require('dgram')
const WSServer = require('uws').Server
const Split = require('stream-split')
const express = require('express')
const systemd = require('systemd')
const app = express()

var wsServer, conf = require('nconf'), headers = [], Separator = new Buffer([0, 0, 0, 1]), httpClients = []

conf.argv().defaults({
  tcpport: 8000,
  udpport: 8000,
  httpport: 8080,
  wsport: 8081,
  limit: 150,
  separator: false
})

if (conf.get('separator')) {
  Separator = new Buffer(conf.get('separator').split(','))
}

if (conf.get('httpport')) {
  app.get('/', (req, res) => {
    if (wsServer.clients.length+httpClients.length >= conf.get('limit')) {
      console.log('http client rejected, limit reached')
      res.sendStatus(503)
      return
    }
    res.writeHead(200, {'Content-Type': 'video/h264', 'Connection': 'Close'})
    res.flushHeaders()
    httpClients.push(res)
    console.log('http client connected, watching ' + httpClients.length)
  })
  app.get('/stats', (req, res) => {
    var count = 0
    wsServer.clients.forEach((ws) => {
      if (ws.readyState == 1) {
        count++
      }
    })
    res.set('Content-type', 'text/plain')
    res.send(count.toString())
  })
  app.listen(conf.get('httpport'))
}

function broadcast(data) {
  var chunk = new Buffer(data.length + Separator.length);
  chunk.set(Separator, 0);
  chunk.set(data, 4);
  wsServer.clients.forEach((ws) => {
    if (ws.readyState === 1) {
      ws.send(chunk, { binary: true })
    }
  })
  if (httpClients.length > 0) {
    httpClients = httpClients.filter(res => !res.socket.destroyed)
    httpClients.forEach((res) => {
      res.write(chunk)
    })
  }
}

if (conf.get('tcpport')) {
  const tcpServer = net.createServer((socket) => {
    console.log('streamer connected')
    socket.on('end', () => {
      console.log('streamer disconnected')
    })
    headers = []
    const Splitter = new Split(Separator)
    Splitter.on('data', (data) => {
      if ((wsServer && wsServer.clients.length > 0) || (httpClients.length > 0)) {
        if (headers.length < 3) headers.push(data)
        broadcast(data)
      }
    }).on('error', (e) => {
      console.log('splitter error ' + e)
      process.exit(0)
    })
    socket.pipe(Splitter)
  })
  tcpServer.listen(conf.get('tcpport'))
  if (conf.get('tcpport') == 'systemd') {
    console.log('TCP server listening on systemd socket')
  } else {
    var address = tcpServer.address()
    if (address) console.log(
      `TCP server listening on ${address.address}:${address.port}`)
  }
}

if (conf.get('udpport')) {
  const udpServer = dgram.createSocket('udp4')
  udpServer.on('listening', () => {
    var address = udpServer.address()
    console.log(
      `UDP server listening on ${address.address}:${address.port}`)
  })
  const Splitter = new Split(Separator)
  Splitter.on('data', (data) => {
    if ((wsServer && wsServer.clients.length > 0) || (httpClients.length > 0)) {
      broadcast(data)
    }
  }).on('error', (e) => {
    console.log('splitter error ' + e)
    process.exit(0)
  })
  udpServer.on('message', (msg, rinfo) => {
    Splitter.write(msg)
  })
  udpServer.bind(conf.get('udpport'))
}

if (conf.get('wsport')) {
  wsServer = new WSServer({ port: conf.get('wsport') })
  console.log(
    `WS server listening on`, conf.get('wsport')
  )
  wsServer.on('connection', (ws) => {
    if (wsServer.clients.length+httpClients.length >= conf.get('limit')) {
      console.log('client rejected, limit reached')
      ws.close()
      return
    }
    console.log('client connected, watching ' + wsServer.clients.length)
    for (let i in headers) {
      ws.send(headers[i])
    }
    ws.on('close', (ws, id) => {
      console.log('client disconnected, watching ' + wsServer.clients.length)
    })
  })
}
