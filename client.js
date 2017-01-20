startStream('container', 'ws://10.0.0.16:8081', true, 'auto', 2000)

function startStream(playerElement, wsUri, useWorker, webgl, reconnectMs) {
	if (!window.player) {
		window.player = new Player({ useWorker: useWorker, webgl: webgl })
		document.getElementById(playerElement).appendChild(window.player.canvas)
		window.debugger = new debug(playerElement) //show statistics, you can remove me if you dont need stats
	}
	var ws = new WebSocket(wsUri)
	ws.binaryType = 'arraybuffer'
	ws.onopen = function (e) {
		console.log('websocket connected')
		ws.onmessage = function (msg) {
			window.player.decode(new Uint8Array(msg.data))
			if(window.debugger) window.debugger.nal(msg.data.byteLength)
		}
	}
	ws.onclose = function (e) {
		console.log('websocket disconnected')
		if (reconnectMs > 0) {
			var el = playerElement, uri = wsUri
			setTimeout(function() { startStream(el, uri) }, reconnectMs)
		}
	}

}

// debugger stuff
function avgFPS(length) {
	this.index = 0
	this.sum = 0
	this.length = length
	this.buffer = Array.apply(null, Array(length)).map(Number.prototype.valueOf,0);
	this.tick = function(tick) {
		this.sum -= this.buffer[this.index]
		this.sum += tick
		this.buffer[this.index] = tick
		if (++this.index == this.length) this.index = 0
		return Math.floor(this.sum/this.length)
	}
	this.avg = function() {
		return Math.floor(this.sum/this.length)
	}
	return this
}

function debug(playerElement) {
	this.started = +new Date()
	this.fps = new avgFPS(50)
	this.last = +new Date()
	this.nals = 0
	this.frames = 0
	this.total = 0
	this.secondTotal = 0
	this.statsElement = document.createElement('div')
	document.getElementById(playerElement).appendChild(this.statsElement)
	window.player.onPictureDecoded = function(buffer, width, height, infos) {
		window.debugger.frame()
		window.debugger.playerWidth = width
		window.debugger.playerHeight = height
	}
	this.nal = function(bytes) {
		this.nals++
		this.total += bytes
		this.secondTotal += bytes
	}
	this.frame = function() {
		this.frames++
		var now = +new Date(), delta = now - window.debugger.last
		this.fps.tick(delta)
		this.last = now
	}
	setInterval(function() {
		var mib = (window.debugger.total/1048576).toFixed(2)
		var date = new Date(null)
		date.setSeconds((+new Date()-window.debugger.started)/1000)
		var dur = date.toISOString().substr(11, 8)
		window.debugger.statsElement.innerHTML = window.debugger.playerWidth+'x'+window.debugger.playerHeight+', '+Math.floor(1/window.debugger.fps.avg()*1000)+' fps, '+(window.debugger.secondTotal/1024).toFixed(2)+' KiB/s, total '+mib+' MiB, '+window.debugger.nals+' NAL units, '+window.debugger.frames+' frames in '+dur
		window.debugger.secondTotal = 0
	}, 1000)
}
