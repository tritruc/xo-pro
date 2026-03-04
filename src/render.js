export class BoardRenderer {
  constructor(cv) {
    this.cv = cv;
    this.ctx = cv.getContext('2d');
    this.cx = 0;
    this.cy = 0;
    this.scale = 56; // bigger default for mobile tap
  }

  cell(sx, sy) {
    return [
      Math.floor((sx - this.cv.width / 2) / this.scale + this.cx + 0.5),
      Math.floor((sy - this.cv.height / 2) / this.scale + this.cy + 0.5),
    ];
  }

  draw(board) {
    const { ctx, cv } = this;
    ctx.clearRect(0, 0, cv.width, cv.height);

    const cols = Math.ceil(cv.width / this.scale) + 2;
    const rows = Math.ceil(cv.height / this.scale) + 2;
    const startX = Math.floor(this.cx - cols / 2);
    const startY = Math.floor(this.cy - rows / 2);

    // draw cell blocks instead of only lines (easier to see/click)
    for (let j = 0; j <= rows; j++) {
      for (let i = 0; i <= cols; i++) {
        const gx = startX + i;
        const gy = startY + j;
        const px = (gx - this.cx) * this.scale + cv.width / 2;
        const py = (gy - this.cy) * this.scale + cv.height / 2;
        const size = this.scale * 0.92;
        const x = px - size / 2;
        const y = py - size / 2;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
        ctx.strokeStyle = 'rgba(148,163,184,0.22)';
        ctx.lineWidth = 1;
        const r = Math.max(4, this.scale * 0.08);

        roundRect(ctx, x, y, size, size, r);
        ctx.fill();
        ctx.stroke();
      }
    }

    // pieces
    for (const [k, v] of board.entries()) {
      const [x, y] = k.split(',').map(Number);
      const px = (x - this.cx) * this.scale + cv.width / 2;
      const py = (y - this.cy) * this.scale + cv.height / 2;

      if (v === 'X') {
        ctx.strokeStyle = 'rgba(34,211,238,.98)';
        ctx.lineWidth = Math.max(3, this.scale * 0.09);
        ctx.beginPath();
        ctx.moveTo(px - this.scale * 0.26, py - this.scale * 0.26);
        ctx.lineTo(px + this.scale * 0.26, py + this.scale * 0.26);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(px + this.scale * 0.26, py - this.scale * 0.26);
        ctx.lineTo(px - this.scale * 0.26, py + this.scale * 0.26);
        ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(251,113,133,.98)';
        ctx.lineWidth = Math.max(3, this.scale * 0.08);
        ctx.beginPath();
        ctx.arc(px, py, this.scale * 0.28, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
