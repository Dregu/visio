const net = require('net')
const WSServer = require('ws').Server
const Split = require('stream-split')
const NALSeparator = new Buffer([0,0,0,1])

var c = require('nconf')
c.argv().env()

function broadcast(data) {
	wsServer.clients.forEach(function(ws) {
		if (ws.readyState == 1) {
			ws.send(data, { binary: true }, (e) => {})
		}
	})
}

const tcpServer = net.createServer((c) => {
	console.log('streamer connected')
	c.on('end', () => {
		console.log('streamer disconnected')
	})
	const NALSplitter = new Split(NALSeparator)
	NALSplitter.on('data', (data) => {
		data = Buffer.concat([NALSeparator, data])
		broadcast(data)
	}).on('error', (e) => {
		console.log('splitter error '+e)
		process.exit(0)
	})
	c.pipe(NALSplitter)
})

const wsServer = new WSServer({ port: c.get('wsport') })
console.log('WS server listening on '+c.get('wsport'))
wsServer.on('connection', (ws) => {
	console.log('client connected, watching '+wsServer.clients.length)
	ws.on('close', (ws, id) => {
		console.log('client disconnected, watching '+wsServer.clients.length)
	})
})

tcpServer.listen(c.get('tcpport'))
console.log('TCP server listening on '+c.get('tcpport'))

