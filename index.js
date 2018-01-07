"use strict";

const net = require('net')
const dgram = require('dgram')
const WSServer = require('uws').Server
const Split = require('stream-split')
const NALSeparator = new Buffer([0, 0, 0, 1])
const AACSeparator = new Buffer([255, 241])
const express = require('express')
const systemd = require('systemd')
const app = express()

var wsServer, awsServer, conf = require('nconf'),
  headers = []
conf.argv().defaults({
  tcpport: 8000,
  udpport: 8000,
  atcpport: 8001,
  audpport: 8001,
  wsport: 8081,
  awsport: 8082,
  queryport: false,
  limit: 150,
  alimit: 150
})

if (conf.get('queryport')) {
  app.get('/', (req, res) => {
    var count = 0
    wsServer.clients.forEach((ws) => {
      if (ws.readyState == 1) {
        count++
      }
    })
    res.set('Content-type', 'text/plain')
    res.send(count.toString())
  })
  app.listen(conf.get('queryport'))
}

function broadcast(data) {
  wsServer.clients.forEach((ws) => {
    if (ws.readyState === 1) {
      ws.send(data, { binary: true })
    }
  })
}

function abroadcast(data) {
  awsServer.clients.forEach((aws) => {
    if (aws.readyState === 1) {
      aws.send(data, { binary: true })
    }
  })
}

if (conf.get('tcpport')) {
  const tcpServer = net.createServer((socket) => {
    console.log('streamer connected')
    socket.on('end', () => {
      console.log('streamer disconnected')
    })
    headers = []
    const NALSplitter = new Split(NALSeparator)
    NALSplitter.on('data', (data) => {
      if (wsServer && wsServer.clients.length > 0) {
        if (headers.length < 3) headers.push(data)
        broadcast(data)
      }
    }).on('error', (e) => {
      console.log('splitter error ' + e)
      process.exit(0)
    })
    socket.pipe(NALSplitter)
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

if (conf.get('atcpport')) {
  const atcpServer = net.createServer((socket) => {
    console.log('streamer connected')
    socket.on('end', () => {
      console.log('streamer disconnected')
    })
    headers = []
    const AACSplitter = new Split(AACSeparator)
    AACSplitter.on('data', (data) => {
      if (awsServer && awsServer.clients.length > 0) {
        if (headers.length < 3) headers.push(data)
        abroadcast(data)
      }
    }).on('error', (e) => {
      console.log('splitter error ' + e)
      process.exit(0)
    })
    socket.pipe(AACSplitter)
  })
  atcpServer.listen(conf.get('atcpport'))
  if (conf.get('atcpport') == 'systemd') {
    console.log('TCP server listening on systemd socket')
  } else {
    var address = atcpServer.address()
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
  const NALSplitter = new Split(NALSeparator)
  NALSplitter.on('data', (data) => {
    if (wsServer && wsServer.clients.length > 0) {
      broadcast(data)
    }
  }).on('error', (e) => {
    console.log('splitter error ' + e)
    process.exit(0)
  })
  udpServer.on('message', (msg, rinfo) => {
    NALSplitter.write(msg)
  })
  udpServer.bind(conf.get('udpport'))
}

if (conf.get('audpport')) {
  const audpServer = dgram.createSocket('udp4')
  audpServer.on('listening', () => {
    var address = audpServer.address()
    console.log(
      `UDP server listening on ${address.address}:${address.port}`)
  })
  const AACSplitter = new Split(AACSeparator)
  AACSplitter.on('data', (data) => {
    if (awsServer && awsServer.clients.length > 0) {
      abroadcast(data)
    }
  }).on('error', (e) => {
    console.log('splitter error ' + e)
    process.exit(0)
  })
  audpServer.on('message', (msg, rinfo) => {
    AACSplitter.write(msg)
  })
  audpServer.bind(conf.get('audpport'))
}

if (conf.get('wsport')) {
  wsServer = new WSServer({ port: conf.get('wsport') })
  console.log(
    `WS server listening on`, conf.get('wsport')
  )
  wsServer.on('connection', (ws) => {
    if (wsServer.clients.length >= conf.get('limit')) {
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

if (conf.get('awsport')) {
  awsServer = new WSServer({ port: conf.get('awsport') })
  console.log(
    `AWS server listening on`, conf.get('awsport')
  )
  awsServer.on('connection', (aws) => {
    if (awsServer.clients.length >= conf.get('alimit')) {
      console.log('client rejected, limit reached')
      aws.close()
      return
    }
    /*console.log('client connected, listening ' + awsServer.clients.length)
    for (let i in headers) {
      aws.send(headers[i])
    }
    aws.on('close', (aws, id) => {
      console.log('client disconnected, listening ' + awsServer.clients.length)
    })*/
  })
}
