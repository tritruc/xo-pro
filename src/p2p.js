const hostId = (room) => `xo-pro-${String(room).replace(/[^a-zA-Z0-9_-]/g, '')}`;

export class P2PRoom {
  constructor(onData, onStatus) {
    this.peer = null;
    this.conn = null;
    this.onData = onData;
    this.onStatus = onStatus;
    this._boundOpen = false;
  }

  ensurePeer() {
    if (this.peer) return;
    this.peer = new Peer();
    this.peer.on('error', (e) => this.onStatus(`❌ Peer lỗi: ${e?.type || e?.message || 'unknown'}`));
  }

  host(room) {
    const id = hostId(room);
    this.ensurePeer();

    const bindHost = () => {
      if (this._boundOpen) return;
      this._boundOpen = true;
      this.peer.on('open', () => {
        this.peer.destroy();
        this.peer = new Peer(id);
        this.peer.on('open', () => this.onStatus(`✅ Host phòng ${room}. Chờ người vào...`));
        this.peer.on('connection', (c) => this.bindConn(c, `🎉 Có người vào phòng ${room}`));
        this.peer.on('error', (e) => this.onStatus(`❌ Host lỗi: ${e?.type || e?.message || 'unknown'}`));
      });
    };

    bindHost();
  }

  join(room) {
    const id = hostId(room);
    this.ensurePeer();

    this.peer.on('open', () => {
      const c = this.peer.connect(id, { reliable: true });
      this.bindConn(c, `🎉 Đã vào phòng ${room}`);
    });
  }

  bindConn(c, openMsg) {
    this.conn = c;
    c.on('open', () => this.onStatus(openMsg));
    c.on('data', (d) => this.onData(d));
    c.on('close', () => this.onStatus('⚠️ Kết nối phòng đã đóng'));
    c.on('error', () => this.onStatus('❌ Lỗi kết nối phòng'));
  }

  send(payload) {
    try {
      if (this.conn?.open) this.conn.send(payload);
    } catch {}
  }

  isConnected() {
    return !!(this.conn && this.conn.open);
  }
}
