import {GameEngine} from './game.js'; import {BoardRenderer} from './render.js'; import {SoundFx} from './sound.js'; import {P2PRoom} from './p2p.js';
const $=s=>document.querySelector(s), g=new GameEngine(), r=new BoardRenderer($('#board')), sfx=new SoundFx(); let mode='ai', my='X', drag=false,lx=0,ly=0,moved=false; const DRAG_THRESHOLD=6;
const room=new P2PRoom(onRemote,t=>$('#roomStatus').textContent=t);
const st=t=>$('#statusText').textContent=t, role=t=>$('#roleText').textContent=t, draw=()=>r.draw(g.board);
function reset(emit=true){g.reset();st('Lượt: X');draw();if(emit&&mode==='online')room.send({type:'reset'})}
function place(x,y){if(g.winner||g.get(x,y))return;if(mode==='online'&&room.ok()&&g.turn!==my)return;const p=g.turn;if(!g.place(x,y,p))return;p==='X'?sfx.x():sfx.o();if(g.winner){st(`🏆 ${g.winner} thắng!`);sfx.win()}else st(`Lượt: ${g.turn}`);draw();if(mode==='online')room.send({type:'move',x,y,p,turn:g.turn,winner:g.winner});if(mode==='ai'&&!g.winner&&g.turn==='O')setTimeout(()=>{const[a,b]=g.ai();place(a,b)},220)}
function onRemote(m){if(m.type==='reset'){reset(false);return}if(m.type==='move'&&!g.get(m.x,m.y)){g.place(m.x,m.y,m.p); if(m.winner)g.winner=m.winner; else g.turn=m.turn; if(g.winner){st(`🏆 ${g.winner} thắng!`);sfx.win()} else st(`Lượt: ${g.turn}`); draw();}}
$('#mode').onchange=e=>{mode=e.target.value;$('#roomPanel').hidden=mode!=='online';my='X';role('Bạn: X');reset(false)};
$('#resetBtn').onclick=()=>reset(true); $('#soundBtn').onclick=()=>$('#soundBtn').textContent=sfx.toggle()?'🔊 Sound':'🔇 Sound';
$('#zoomIn').onclick=()=>{r.scale=Math.min(68,r.scale+4);draw()}; $('#zoomOut').onclick=()=>{r.scale=Math.max(26,r.scale-4);draw()}; $('#centerBtn').onclick=()=>{r.cx=0;r.cy=0;draw()};
$('#hostBtn').onclick=()=>{const v=$('#roomInput').value.trim(); if(!v)return alert('Nhập số phòng'); room.host(v); my='X'; role('Bạn: X (Host)')};
$('#joinBtn').onclick=()=>{const v=$('#roomInput').value.trim(); if(!v)return alert('Nhập số phòng'); room.join(v); my='O'; role('Bạn: O (Guest)')};
const cv=$('#board');
cv.addEventListener('pointerdown',e=>{drag=true; moved=false; lx=e.clientX; ly=e.clientY; cv.setPointerCapture(e.pointerId)});
cv.addEventListener('pointermove',e=>{
  if(!drag) return;
  const dx=e.clientX-lx, dy=e.clientY-ly;
  if(Math.abs(dx)+Math.abs(dy) > DRAG_THRESHOLD) moved=true;
  r.cx -= dx/r.scale; r.cy -= dy/r.scale;
  lx=e.clientX; ly=e.clientY;
  draw();
});
cv.addEventListener('pointerup',()=>{ drag=false; });
cv.addEventListener('click',e=>{
  if(moved) return;
  const b=cv.getBoundingClientRect(), [x,y]=r.cell(e.clientX-b.left,e.clientY-b.top);
  place(x,y);
});
draw();
