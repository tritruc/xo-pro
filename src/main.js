import { GameEngine } from './game.js';
import { BoardRenderer } from './render.js';
import { SoundFx } from './sound.js';
import { P2PRoom } from './p2p.js';

const $ = (s) => document.querySelector(s);

const game = new GameEngine();
const renderer = new BoardRenderer($('#board'));
const sound = new SoundFx();

let mode = 'ai';
let myRole = 'X';
let dragging = false;
let moved = false;
let lx = 0;
let ly = 0;
let activePointerId = null;
const DRAG_THRESHOLD = 8;

const statusEl = $('#statusText');
const roleEl = $('#roleText');
const roomStatusEl = $('#roomStatus');
const roomPanelEl = $('#roomPanel');
const canvas = $('#board');

function setStatus(text) {
  statusEl.textContent = text;
}

function setRole(text) {
  roleEl.textContent = text;
}

function draw() {
  renderer.draw(game.board);
}

function canvasScale() {
  const rect = canvas.getBoundingClientRect();
  return {
    sx: canvas.width / rect.width,
    sy: canvas.height / rect.height,
    rect,
  };
}

const room = new P2PRoom(onRemoteData, (msg) => {
  roomStatusEl.textContent = msg;
  if (room.isConnected()) {
    room.send({ type: 'sync-request' });
    sendFullState();
  }
});

function sendFullState() {
  room.send({
    type: 'state',
    board: [...game.board.entries()],
    turn: game.turn,
    winner: game.winner,
  });
}

function resetGame(emit = true) {
  game.reset();
  setStatus('Lượt: X');
  draw();
  if (emit && mode === 'online') room.send({ type: 'reset' });
}

function canPlace() {
  if (game.winner) return false;
  if (mode !== 'online') return true;
  if (!room.isConnected()) return false;
  return game.turn === myRole;
}

function placeAt(x, y, emit = true) {
  if (!canPlace()) return;
  if (game.get(x, y)) return;

  const symbol = game.turn;
  const ok = game.place(x, y, symbol);
  if (!ok) return;

  symbol === 'X' ? sound.x() : sound.o();

  if (game.winner) {
    setStatus(`🏆 ${game.winner} thắng!`);
    sound.win();
  } else {
    setStatus(`Lượt: ${game.turn}`);
  }

  draw();

  if (emit && mode === 'online') {
    room.send({ type: 'move', x, y, symbol, turn: game.turn, winner: game.winner });
  }

  if (mode === 'ai' && !game.winner && game.turn === 'O') {
    setTimeout(() => {
      const [ax, ay] = game.ai();
      placeAt(ax, ay, false);
    }, 260);
  }
}

function onRemoteData(msg) {
  if (!msg || typeof msg !== 'object') return;

  if (msg.type === 'reset') {
    resetGame(false);
    return;
  }

  if (msg.type === 'sync-request') {
    sendFullState();
    return;
  }

  if (msg.type === 'state') {
    game.board = new Map(msg.board || []);
    game.turn = msg.turn || 'X';
    game.winner = msg.winner || null;
    setStatus(game.winner ? `🏆 ${game.winner} thắng!` : `Lượt: ${game.turn}`);
    draw();
    return;
  }

  if (msg.type === 'move') {
    if (game.get(msg.x, msg.y)) return;
    game.place(msg.x, msg.y, msg.symbol);
    game.turn = msg.turn ?? game.turn;
    game.winner = msg.winner ?? game.winner;
    setStatus(game.winner ? `🏆 ${game.winner} thắng!` : `Lượt: ${game.turn}`);
    draw();
  }
}

$('#mode').onchange = async (e) => {
  mode = e.target.value;
  roomPanelEl.hidden = mode !== 'online';
  myRole = 'X';
  setRole('Bạn: X');
  await room.reset();
  roomStatusEl.textContent = mode === 'online' ? 'Chưa kết nối phòng.' : 'Chế độ đấu máy.';
  resetGame(false);
};

$('#resetBtn').onclick = () => resetGame(true);

$('#soundBtn').onclick = () => {
  const on = sound.toggle();
  $('#soundBtn').textContent = on ? '🔊 Sound' : '🔇 Sound';
};

$('#zoomIn').onclick = () => {
  renderer.scale = Math.min(84, renderer.scale + 4);
  draw();
};

$('#zoomOut').onclick = () => {
  renderer.scale = Math.max(44, renderer.scale - 4);
  draw();
};

$('#centerBtn').onclick = () => {
  renderer.cx = 0;
  renderer.cy = 0;
  draw();
};

$('#hostBtn').onclick = async () => {
  const roomId = ($('#roomInput').value || '').trim();
  if (!/^\d{3,8}$/.test(roomId)) {
    alert('Số phòng phải từ 3 đến 8 chữ số.');
    return;
  }
  try {
    await room.host(roomId);
    myRole = 'X';
    setRole('Bạn: X (Host)');
  } catch {
    roomStatusEl.textContent = '❌ Không tạo được phòng. Kiểm tra mạng rồi thử lại.';
  }
};

$('#joinBtn').onclick = async () => {
  const roomId = ($('#roomInput').value || '').trim();
  if (!/^\d{3,8}$/.test(roomId)) {
    alert('Số phòng phải từ 3 đến 8 chữ số.');
    return;
  }
  try {
    await room.join(roomId);
    myRole = 'O';
    setRole('Bạn: O (Guest)');
  } catch {
    roomStatusEl.textContent = '❌ Không vào được phòng. Kiểm tra số phòng hoặc mạng.';
  }
};

canvas.addEventListener('pointerdown', (e) => {
  activePointerId = e.pointerId;
  dragging = true;
  moved = false;
  lx = e.clientX;
  ly = e.clientY;
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove', (e) => {
  if (!dragging || e.pointerId !== activePointerId) return;
  const { sx, sy } = canvasScale();
  const dx = (e.clientX - lx) * sx;
  const dy = (e.clientY - ly) * sy;

  if (Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD) moved = true;

  renderer.cx -= dx / renderer.scale;
  renderer.cy -= dy / renderer.scale;
  lx = e.clientX;
  ly = e.clientY;
  draw();
});

canvas.addEventListener('pointerup', (e) => {
  if (e.pointerId !== activePointerId) return;
  const wasMoved = moved;
  dragging = false;

  if (!wasMoved) {
    const { sx, sy, rect } = canvasScale();
    const px = (e.clientX - rect.left) * sx;
    const py = (e.clientY - rect.top) * sy;
    const [x, y] = renderer.cell(px, py);
    placeAt(x, y, true);
  }

  moved = false;
  activePointerId = null;
});

canvas.addEventListener('pointercancel', () => {
  dragging = false;
  moved = false;
  activePointerId = null;
});

roomStatusEl.textContent = 'Chế độ đấu máy.';
setStatus('Lượt: X');
setRole('Bạn: X');
draw();
