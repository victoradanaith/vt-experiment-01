(() => {
'use strict';
const $ = (s) => document.querySelector(s);
const stage = $('#stage'), svg = $('#scene'), wordEl = $('#word'), h1 = $('#h1'), h2 = $('#h2'), disc = $('#disc');
const rm = matchMedia('(prefers-reduced-motion: reduce)');
let RM = rm.matches || /[?&]rm=1/.test(location.search);
rm.addEventListener && rm.addEventListener('change', () => { RM = rm.matches; });

// five states: word, colours, circle (offset in units of its radius-base, size, split angle), word placement
const S = [
  { w: 'STILL', bg: '#ecece8', ink: '#0a0a0a', c: '#0a0a0a', dx: 0,   dy: 0,   r: 1,   a: 0,  wy: .74, wr: 0 },
  { w: 'SLIDE', bg: '#f2ecdf', ink: '#0a0a0a', c: '#ff5a14', dx: .3,  dy: -.2, r: .8,  a: 0,  wy: .3,  wr: 0 },
  { w: 'TURN',  bg: '#0a0a0a', ink: '#f1eee4', c: '#2c4bff', dx: 0,   dy: .05, r: 1.1, a: 45, wy: .58, wr: -8 },
  { w: 'OPEN',  bg: '#ecece8', ink: '#0a0a0a', c: '#ffc400', dx: -.25, dy: .2, r: .9,  a: 90, wy: .78, wr: 0 },
  { w: 'FALL',  bg: '#f2ecdf', ink: '#0a0a0a', c: '#0a0a0a', dx: .35, dy: .45, r: .55, a: 0,  wy: .26, wr: 12 }
];
const N = S.length;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const hex = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return 'rgb(' + A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',') + ')'; };
const ease = (f) => (f <= 0 || f >= 1) ? f : f * f * (3 - 2 * f);

let W = 0, H = 0, desk = false, base = 0, cx = 0, cy = 0;
function size() {
  W = innerWidth; H = innerHeight; desk = W >= 900 && W > H;
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  base = desk ? H * .3 : W * .3;
  cx = desk ? W * .62 : W * .5; cy = desk ? H * .5 : H * .42;
  wordEl.setAttribute('font-size', desk ? H * .5 : W * .5);
}

// two axes, each a mass on a spring
const mk = (max) => ({ x: 0, v: 0, t: 0, max, drag: false });
const dial = mk(N - 1), open = mk(1);
const K = 140, C = 17;
let running = false, last = 0, interacted = false;
function step(a, dt) {
  if (a.drag) return true;
  if (RM) { const m = a.x !== a.t; a.x = a.t; a.v = 0; return m; }
  a.v += (-K * (a.x - a.t) - C * a.v) * dt; a.x += a.v * dt;
  if (Math.abs(a.x - a.t) < .0008 && Math.abs(a.v) < .004) { a.x = a.t; a.v = 0; return false; }
  return true;
}
function tick(now) {
  const dt = Math.min(.033, (now - last) / 1000 || .016); last = now;
  const m = step(dial, dt) | step(open, dt);
  render();
  if (m) requestAnimationFrame(tick); else running = false;
}
const kick = () => { if (!running) { running = true; last = performance.now(); requestAnimationFrame(tick); } };

const half = (r, flip) => { const s = flip ? -1 : 1; return 'M0 ' + (-r) + 'A' + r + ' ' + r + ' 0 0 ' + (flip ? 0 : 1) + ' 0 ' + r + 'Z'; };
function render() {
  const p = clamp(dial.x, -.3, N - 1 + .3), i = clamp(Math.floor(p), 0, N - 2), f = p - i, e = ease(f);
  const A = S[i], B = S[i + 1], ee = clamp(e, 0, 1);
  const bg = mix(A.bg, B.bg, ee), ink = mix(A.ink, B.ink, ee);
  stage.style.background = bg; stage.style.color = ink; stage.style.setProperty('--bg', bg);
  document.body.style.background = bg;
  // word: swaps at the midpoint, fades through it
  wordEl.textContent = (f < .5 ? A : B).w;
  const dip = Math.pow(Math.abs(2 * f - 1), .8);
  wordEl.setAttribute('opacity', (f < 0 || f > 1 ? 1 : dip).toFixed(2));
  const wy = lerp(A.wy, B.wy, e) * H, wr = lerp(A.wr, B.wr, e);
  wordEl.setAttribute('transform', 'translate(' + (desk ? W * .38 : W * .5).toFixed(1) + ' ' + wy.toFixed(1) + ') rotate(' + wr.toFixed(2) + ')');
  // circle: two halves that slide apart when opened
  const r = lerp(A.r, B.r, e) * base, ox = lerp(A.dx, B.dx, e) * base, oy = lerp(A.dy, B.dy, e) * base;
  const ang = lerp(A.a, B.a, e) + clamp(dial.v, -6, 6) * 3;
  const gap = clamp(open.x, -.15, 1.15) * r * .55;
  const col = mix(A.c, B.c, ee);
  disc.setAttribute('transform', 'translate(' + (cx + ox).toFixed(1) + ' ' + (cy + oy).toFixed(1) + ') rotate(' + ang.toFixed(2) + ')');
  h1.setAttribute('d', half(r, false)); h2.setAttribute('d', half(r, true));
  h1.setAttribute('transform', 'translate(' + gap.toFixed(1) + ' 0)'); h2.setAttribute('transform', 'translate(' + (-gap).toFixed(1) + ' 0)');
  h1.setAttribute('fill', col); h2.setAttribute('fill', col);
  const cur = clamp(Math.round(dial.x), 0, N - 1);
  if (cur !== shown) { shown = cur; dots.forEach((b, k) => { if (k === cur) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); }); }
}
let shown = -1;

// controls
const dotsBox = $('#dots'), openB = $('#open');
const dots = S.map((s, k) => { const b = document.createElement('button'); b.type = 'button'; b.innerHTML = '<span>' + String(k + 1).padStart(2, '0') + '</span>'; b.setAttribute('aria-label', 'Word ' + (k + 1) + ': ' + s.w); b.onclick = () => { used(); go(k); }; dotsBox.appendChild(b); return b; });
const snap = (a, t) => { a.t = clamp(Math.round(t), 0, a.max); };
let lastMsg = '';
function say() { const m = S[dial.t].w + ', ' + (open.t ? 'open' : 'closed'); if (m !== lastMsg) { lastMsg = m; $('#live').textContent = m; openB.setAttribute('aria-pressed', !!open.t); $('#ico').setAttribute('d', open.t ? 'M2 8h12' : 'M2 8h12M8 2v12'); try { navigator.vibrate && !RM && navigator.vibrate(6); } catch (e) {} } }
const go = (k) => { snap(dial, k); say(); kick(); };
const setOpen = (k) => { snap(open, k); say(); kick(); };
function used() { if (!interacted) { interacted = true; $('#hint').classList.add('gone'); } nudges.forEach(clearTimeout); }
openB.onclick = () => { used(); setOpen(open.t ? 0 : 1); };
const rub = (v, m) => v < 0 ? v * .35 : v > m ? m + (v - m) * .35 : v;

// gestures: the dominant direction wins, then locks for that swipe
let G = null;
stage.addEventListener('pointerdown', (e) => {
  if (e.target.closest('.pad')) return;
  stage.setPointerCapture(e.pointerId);
  G = { id: e.pointerId, x0: e.clientX, y0: e.clientY, lt: e.timeStamp, axis: null, bx: dial.x, by: open.x, v: 0 };
  used();
});
stage.addEventListener('pointermove', (e) => {
  if (!G || e.pointerId !== G.id) return;
  const dx = e.clientX - G.x0, dy = e.clientY - G.y0;
  if (!G.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 8) { G.axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y'; (G.axis === 'x' ? dial : open).drag = true; kick(); }
  if (!G.axis) return;
  const a = G.axis === 'x' ? dial : open, dt = Math.max(1, e.timeStamp - G.lt) / 1000;
  const nx = G.axis === 'x' ? rub(G.bx - dx / (desk ? 230 : 150), a.max) : rub(G.by - dy / (desk ? 200 : 180), a.max);
  G.v = clamp(lerp(G.v, (nx - a.x) / dt, .35), -12, 12); a.x = nx; a.v = G.v; G.lt = e.timeStamp;
});
function end(e) {
  if (!G || e.pointerId !== G.id) return;
  const g = G; G = null;
  if (!g.axis) return;
  const a = g.axis === 'x' ? dial : open; a.drag = false;
  a.v = RM || e.timeStamp - g.lt > 90 ? 0 : g.v;
  const from = Math.round(g.axis === 'x' ? g.bx : g.by);
  snap(a, clamp(Math.round(a.x + a.v * .22), from - 2, from + 2));
  say(); kick();
}
stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
stage.addEventListener('wheel', (e) => { e.preventDefault(); used(); const h = Math.abs(e.deltaX) > Math.abs(e.deltaY), a = h ? dial : open; a.drag = true; a.x = rub(a.x + (h ? e.deltaX / 700 : -e.deltaY / 600), a.max); a.v = 0; kick(); clearTimeout(wt); wt = setTimeout(() => { dial.drag = open.drag = false; snap(dial, dial.x); snap(open, open.x); say(); kick(); }, 140); }, { passive: false });
let wt = 0;
addEventListener('keydown', (e) => {
  const k = e.key; let ok = true;
  if (k === 'ArrowLeft') go(dial.t - 1); else if (k === 'ArrowRight') go(dial.t + 1);
  else if (k === 'ArrowUp') setOpen(1); else if (k === 'ArrowDown') setOpen(0);
  else if (/^[1-5]$/.test(k)) go(+k - 1); else ok = false;
  if (ok) { used(); e.preventDefault(); }
});

// a one-time self-playing nudge shows what the gestures do (never with reduced motion)
const nudges = [];
if (!RM) { nudges.push(setTimeout(() => { if (!interacted) { dial.v = 2.2; kick(); } }, 1000)); nudges.push(setTimeout(() => { if (!interacted) { open.v = 2.4; kick(); } }, 2600)); }

addEventListener('resize', () => { size(); render(); });
size(); say(); render(); kick();
window.__v2 = { dial, open, go, setOpen };
})();
