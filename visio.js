class Visio {

  requestFullScreen(elt) {
    if (elt.requestFullscreen) {
      elt.requestFullscreen();
    } else if (elt.msRequestFullscreen) {
      elt.msRequestFullscreen();
    } else if (elt.mozRequestFullScreen) {
      elt.mozRequestFullScreen();
    } else if (elt.webkitRequestFullscreen) {
      elt.webkitRequestFullscreen();
    }
  }

  concatTypedArrays(a, b) {
    var c = new (a.constructor)(a.length + b.length);
    c.set(a, 0);
    c.set(b, a.length);
    return c;
  }

  concatBuffers(a, b) {
    return concatTypedArrays(
      new Uint8Array(a.buffer || a),
      new Uint8Array(b.buffer || b)
    ).buffer;
  }

  concatBytes(ui8a, byte) {
    var b = new Uint8Array(1);
    b[0] = byte;
    return concatTypedArrays(ui8a, b);
  }

  constructor(wsURI = 'ws://'+window.location.hostname+':8081', options = { node: 'visio', mode: 'video', flushingTime: 0.5 }) {
    this.element = document.getElementById(options && options.node ? options.node:'visio')
    this.wsURI = wsURI;
    this.options = options;
    this.interval;
    this.videobuffer = new Uint8Array();
    this.audiobuffer = new Uint8Array();
    this.jmuxer;
    this.ws;
    this.last;
    this.on = false;
    this.start();
  }

  start() {
    if(this.on) return;
    var t = this;
    this.on = true;
    this.jmuxer = new JMuxer(this.options);
    this.ws = new WebSocket(this.wsURI);
    this.videobuffer = new Uint8Array();
    this.audiobuffer = new Uint8Array();
    this.ws.binaryType = 'arraybuffer';
    this.ws.addEventListener('message', function(event) {
      var data = new Uint8Array(event.data)
      if(document.visibilityState == 'visible' && data[0] == 0) {
        t.videobuffer = t.concatTypedArrays(t.videobuffer, data);
      } else if(data[0] != 0) {
        t.audiobuffer = t.concatTypedArrays(t.audiobuffer, data);
      }
    });
    this.ws.onclose = function() {
      clearInterval(t.interval);
      if (t.on) setTimeout(function() { t.start() }, 5000);
    }
    this.element.ondblclick = function(e) {
      t.requestFullScreen(t.element);
    }
    this.interval = setInterval(function() { t.update(); }, Math.round(this.options.flushingTime*1000));
    this.last = +new Date;
  }

  stop() {
    this.on = false;
    clearInterval(this.interval);
    if (this.jmuxer) this.jmuxer.destroy();
    if (this.ws) this.ws.close();
  }

  update() {
    var now = +new Date;
    var duration = now - this.last;
    this.last = now;
    if(this.options.mode == 'video' && document.visibilityState == 'visible' && this.videobuffer.length > 0) {
      this.jmuxer.feed({video: this.videobuffer, duration: duration});
    } else if(this.options.mode == 'audio' && this.audiobuffer.length > 0) {
      this.jmuxer.feed({audio: this.audiobuffer, duration: duration});
    } else if(this.options.mode == 'both' && this.audiobuffer.length > 0 && this.videobuffer.length > 0) {
      this.jmuxer.feed({audio: this.audiobuffer, video: this.videobuffer, duration: duration});
    }
    this.audiobuffer = new Uint8Array();
    this.videobuffer = new Uint8Array();
  }
}
