var startStream = function(playerElement, wsUri) {
	if (!window.player) {
		window.player = new Player({ useWorker: true, webgl: 'auto' })
		document.getElementById(playerElement).appendChild(window.player.canvas)
	}

	var ws = new WebSocket(wsUri)
	ws.binaryType = 'arraybuffer'
	ws.onopen = function (e) {
		console.log('websocket connected')
		ws.onmessage = function (msg) {
			window.player.decode(new Uint8Array(msg.data))
		}
	}
	ws.onclose = function (e) {
		console.log('websocket disconnected')
		var el = playerElement, uri = wsUri
		setTimeout(function() { startStream(el, uri) }, 2000)
	}
}

startStream('container', 'ws://10.0.0.16:8081')
