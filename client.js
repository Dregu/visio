var player = new Player({ useWorker: true, webgl: 'auto' })
document.getElementById('container').appendChild(player.canvas)

var ws = new ReconnectingWebSocket('ws://10.0.0.16:8081/')
ws.binaryType = 'arraybuffer'
ws.onopen = function (e) {
	console.log('websocket connected')
	ws.onmessage = function (msg) {
		player.decode(new Uint8Array(msg.data))
	}
}
