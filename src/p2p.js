const hostId = (room) => `xo-pro-${String(room).replace(/[^a-zA-Z0-9_-]/g, '')}`;

function waitOpen(peer, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('open-timeout')), timeoutMs);
    peer.once('open', () => {
      clearTimeout(t);
      resolve();
    });
    peer.once('error', (e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

export class P2PRoom {
  constructor(onData, onStatus) {
    this.peer = null;
    this.conn = null;
    this.onData = onData;
    this.onStatus = onStatus;
    this.currentMode = null;
  }

  async reset() {
    try {
      if (this.conn) this.conn.close();
    } catch {}
    this.conn = null;

    try {
      if (this.peer) this.peer.destroy();
    } catch {}
    this.peer = null;
    this.currentMode = null;
  }

  bindConn(conn, openMessage) {
    this.conn = conn;
    conn.on('open', () => this.onStatus(openMessage));
    conn.on('data', (d) => this.onData(d));
    conn.on('close', () => this.onStatus('⚠️ Kết nối phòng đã đóng'));
    conn.on('error', (e) => this.onStatus(`❌ Lỗi kết nối phòng: ${e?.type || e?.message || 'unknown'}`));
  }

  async host(room) {
    await this.reset();
    this.currentMode = 'host';

    const id = hostId(room);
    this.onStatus('⏳ Đang tạo phòng...');

    this.peer = new Peer(id);
    this.peer.on('error', (e) => {
      if (e?.type === 'unavailable-id') {
        this.onStatus('❌ Số phòng đã có người host. Hãy đổi số khác.');
      } else {
        this.onStatus(`❌ Host lỗi: ${e?.type || e?.message || 'unknown'}`);
      }
    });

    await waitOpen(this.peer);
    this.onStatus(`✅ Host phòng ${room}. Chờ người vào...`);

    this.peer.on('connection', (c) => {
      this.bindConn(c, `🎉 Người chơi đã vào phòng ${room}`);
    });
  }

  async join(room) {
    await this.reset();
    this.currentMode = 'join';

    const id = hostId(room);
    this.onStatus('⏳ Đang kết nối phòng...');

    this.peer = new Peer();
    this.peer.on('error', (e) => {
      this.onStatus(`❌ Peer lỗi: ${e?.type || e?.message || 'unknown'}`);
    });

    await waitOpen(this.peer);

    const conn = this.peer.connect(id, { reliable: true });
    this.bindConn(conn, `🎉 Đã vào phòng ${room}`);
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
