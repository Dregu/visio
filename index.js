"use strict";

const net = require('net')
const dgram = require('dgram')
const WSServer = require('ws').Server
const Split = require('stream-split')
const NALSeparator = new Buffer([0,0,0,1])
const express = require('express')
const systemd = require('systemd')
const app = express()

var wsServer, conf = require('nconf'), headers = []
conf.argv().defaults({
	tcpport: false,
	udpport: false,
	wsport: false,
	queryport: false
})
if (conf.get('tcpport') && conf.get('udpport')) throw new Error('dont use tcp and udp together')

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
				//data = Buffer.concat([NALSeparator, data])
				if (headers.length < 3) headers.push(data)
				broadcast(data)
			}
		}).on('error', (e) => {
			console.log('splitter error '+e)
			process.exit(0)
		})
		socket.pipe(NALSplitter)
	})
	tcpServer.listen(conf.get('tcpport'))
	if (conf.get('tcpport') == 'systemd') {
		console.log('TCP server listening on systemd socket')
	} else {
		var address = tcpServer.address()
		if (address) console.log(`TCP server listening on ${address.address}:${address.port}`)
	}
}

if (conf.get('udpport')) {
	const udpServer = dgram.createSocket('udp4')
	udpServer.on('listening', () => {
		var address = udpServer.address()
		console.log(`UDP server listening on ${address.address}:${address.port}`)
	})
	const NALSplitter = new Split(NALSeparator)
	NALSplitter.on('data', (data) => {
		if (wsServer && wsServer.clients.length > 0) {
			//data = Buffer.concat([NALSeparator, data])
			broadcast(data)
		}
	}).on('error', (e) => {
		console.log('splitter error '+e)
		process.exit(0)
	})
	udpServer.on('message', (msg, rinfo) => {
		NALSplitter.write(msg)
	})
	udpServer.bind(conf.get('udpport'))
}

if (conf.get('wsport')) {
	wsServer = new WSServer({ port: conf.get('wsport') })
	console.log(`WS server listening on ${wsServer.options.host}:${wsServer.options.port}`)
	wsServer.on('connection', (ws) => {
		console.log('client connected, watching '+wsServer.clients.length)
		for(let i in headers) {
			ws.send(headers[i])
		}
		ws.on('close', (ws, id) => {
			console.log('client disconnected, watching '+wsServer.clients.length)
		})
	})
}


