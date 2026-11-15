(() => {
'use strict';
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t * t * (3 - 2 * t);
const root = document.documentElement;
if (/[?&]rm=1/.test(location.search)) root.classList.add('rm');
const RM = () => root.classList.contains('rm') || matchMedia('(prefers-reduced-motion: reduce)').matches;
const INK = '#ece8dd', ACC = '#f2a516';

/* seven states of one egg. One word each; the second word is the business step it stands for. */
const STEPS = [
  { v: 'COLD', tag: 'INBOX' }, { v: 'PREP', tag: 'VALIDATE' }, { v: 'CRACK', tag: 'TRIGGER' }, { v: 'FRY', tag: 'RULES' },
  { v: 'PLATE', tag: 'FORMAT' }, { v: 'SERVE', tag: 'DELIVER' }, { v: 'WASH', tag: 'LOG' }
];
const NS = STEPS.length;
const COUNT_LABEL = ['1 egg', '3 eggs', '9 eggs', '36 eggs', 'endless'];
const Q_LABEL = ['×1', '×3', '×9', '×36', '∞'];
const NL = 5, LAGK = [0, .5, 1.3, 2.3, 3.4];    // how far the last egg trails behind when everything is done by hand, per zoom level
let auto = false, interacted = false, W = 360, H = 400;
const S = { x: 0, v: 0, t: 0, drag: false, max: NS - 1 };   // state position, continuous: the egg morphs in place between states
const Z = { x: 0, v: 0, t: 0, drag: false, max: NL - 1 };   // zoom position, continuous: 1 -> 3 -> 9 -> 36 -> endless

/* ---- one egg, continuous between states. Components are cross-faded; nothing moves out of its circle. ---- */
// ringA, discA, split, yolkA, yolkR, yolkY, ring2A, dashA
const KEYS = [
  [.5, 0, 0, 0, .46, 0, 0, 0],      // 0 cold: hollow
  [0, .95, 0, 0, .46, 0, 0, 0],     // 1 prep: solid
  [0, .95, 1, 0, .46, 0, 0, 0],     // 2 crack: opens
  [.8, 0, 0, 1, .46, 0, 0, 0],      // 3 fry: ring + yolk
  [.8, 0, 0, 1, .4, 0, .5, 0],      // 4 plate: ring in ring
  [.25, 0, 0, .75, .34, -.4, 0, 0], // 5 serve: the yolk leaves
  [0, 0, 0, 0, .34, -.4, 0, .6]     // 6 wash: dashed, empty
];
const P = new Array(8);
function morph(c, x, y, R, s, alpha) {
  const a = clamp(Math.floor(s), 0, NS - 2), t = ease(clamp(s - a, 0, 1)), A = KEYS[a], B = KEYS[a + 1];
  for (let i = 0; i < 8; i++) P[i] = lerp(A[i], B[i], t);
  c.lineWidth = clamp(R * .07, 1, 3);
  if (P[1] > .01) {
    c.globalAlpha = P[1] * alpha; c.fillStyle = INK;
    const g = R * .2 * P[2];
    if (P[2] > .001) { c.save(); c.translate(x, y); c.rotate(-.18 * P[2]); c.beginPath(); c.arc(0, -g, R, Math.PI, 0); c.fill(); c.beginPath(); c.arc(0, g, R, 0, Math.PI); c.fill(); c.restore(); }
    else { c.beginPath(); c.arc(x, y, R, 0, 6.2832); c.fill(); }
  }
  c.strokeStyle = INK;
  if (P[0] > .01) { c.globalAlpha = P[0] * alpha; c.beginPath(); c.arc(x, y, R, 0, 6.2832); c.stroke(); }
  if (P[6] > .01) { c.globalAlpha = P[6] * alpha; c.beginPath(); c.arc(x, y, R * 1.32, 0, 6.2832); c.stroke(); }
  if (P[7] > .01) { c.globalAlpha = P[7] * alpha; c.setLineDash([R * .3, R * .35]); c.beginPath(); c.arc(x, y, R * 1.1, 0, 6.2832); c.stroke(); c.setLineDash([]); }
  if (P[3] > .01) { c.globalAlpha = P[3] * alpha; c.fillStyle = ACC; c.beginPath(); c.arc(x, y + P[5] * R, P[4] * R, 0, 6.2832); c.fill(); }
  c.globalAlpha = 1;
}

/* ---- the lattice: eggs live on one fixed grid; zooming out only reveals more of it ---- */
let LV = [];
function levels() {
  const m = Math.min(W, H);
  const p = [m * .8, Math.min(W / 3, H), m / 3.2, m / 6.4, clamp(m / 36, 6, 14)];
  const half = (n, pp) => Math.ceil(n / pp / 2) + 1;
  LV = [
    { p: p[0], cx: 0, cy: 0, i0: 0, i1: 0, j0: 0, j1: 0 },
    { p: p[1], cx: 0, cy: 0, i0: -1, i1: 1, j0: 0, j1: 0 },
    { p: p[2], cx: 0, cy: 0, i0: -1, i1: 1, j0: -1, j1: 1 },
    { p: p[3], cx: -.5, cy: -.5, i0: -3, i1: 2, j0: -3, j1: 2 },
    { p: p[4], cx: -.5, cy: -.5, i0: -half(W, p[4]), i1: half(W, p[4]), j0: -half(H, p[4]), j1: half(H, p[4]) }
  ];
  LV.forEach(l => { l.cols = l.i1 - l.i0 + 1; l.rows = l.j1 - l.j0 + 1; });
}
let cvEl, ctx, dpr = 1, lastDrawn = '';
function size() {
  const st = $('#stage'), w = Math.floor(st.clientWidth), h = Math.floor(st.clientHeight);
  if (w < 20 || h < 20) return false;
  W = w; H = h; dpr = Math.min(3, devicePixelRatio || 1);
  cvEl.width = w * dpr; cvEl.height = h * dpr; cvEl.style.width = w + 'px'; cvEl.style.height = h + 'px';
  levels(); return true;
}
let drawn = 0;
function draw() {
  if (!LV.length) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
  const rm = RM();
  const zl = rm ? Math.round(Z.x) : Z.x, sl = rm ? Math.round(S.x) : S.x;
  const k0 = clamp(Math.floor(zl + 1e-6), 0, NL - 1), f = clamp(zl - k0, 0, 1), k1 = Math.min(NL - 1, k0 + 1), e = ease(f);
  const A = LV[k0], B = LV[k1], win = f < .001 ? A : B;
  const p = Math.exp(lerp(Math.log(A.p), Math.log(B.p), e)), cx = lerp(A.cx, B.cx, e), cy = lerp(A.cy, B.cy, e);
  const colsW = lerp(A.cols, B.cols, e), rowsW = lerp(A.rows, B.rows, e);
  const lag = auto || rm ? 0 : lerp(LAGK[k0], LAGK[k1], e);
  const R = p * .36, hx = W / 2, hy = H / 2; let n = 0;
  for (let j = win.j0; j <= win.j1; j++) {
    const sy = hy + (j - cy) * p; if (sy < -p || sy > H + p) continue;
    const jt = clamp((j - (cy - (rowsW - 1) / 2)) / Math.max(1, rowsW - 1), 0, 1);
    for (let i = win.i0; i <= win.i1; i++) {
      const sx = hx + (i - cx) * p; if (sx < -p || sx > W + p) continue;
      const inA = i >= A.i0 && i <= A.i1 && j >= A.j0 && j <= A.j1;
      const it = clamp((i - (cx - (colsW - 1) / 2)) / Math.max(1, colsW - 1), 0, 1);
      const u = jt * .85 + it * .15;
      morph(ctx, sx, sy, R, clamp(sl - lag * u, 0, NS - 1), inA ? 1 : e); n++;
    }
  }
  drawn = n;
}

/* ---- springs ---- */
const K = 150, C = 18; let raf = 0, last = 0;
function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }
function tick(now) {
  const dt = Math.min(.033, (now - last) / 1000); last = now; let busy = false;
  for (const o of [S, Z]) {
    if (o.drag) { busy = true; continue; }
    o.v += ((o.t - o.x) * K - o.v * C) * dt; o.x += o.v * dt;
    if (Math.abs(o.t - o.x) > .002 || Math.abs(o.v) > .01) busy = true; else { o.x = o.t; o.v = 0; }
  }
  draw(); ui();
  raf = busy ? requestAnimationFrame(tick) : 0;
}
function snap(o) { o.x = o.t; o.v = 0; draw(); ui(); }
function used() { if (!interacted) { interacted = true; $('#hint').classList.add('gone'); } }
function goState(i) { used(); S.t = clamp(Math.round(i), 0, NS - 1); if (RM()) snap(S); else kick(); ui(true); }
function goZoom(i) { used(); Z.t = clamp(Math.round(i), 0, NL - 1); if (RM()) snap(Z); else kick(); ui(true); }
function setAuto(v) { used(); auto = v; $('#b-auto').setAttribute('aria-pressed', auto); draw(); announce(); }

/* ---- readout ---- */
const pad2 = n => String(n).padStart(2, '0');
let shownS = -1, shownZ = -1;
function ui(force) {
  $('#b-up').disabled = S.t === 0; $('#b-down').disabled = S.t === NS - 1; $('#b-less').disabled = Z.t === 0; $('#b-more').disabled = Z.t === NL - 1;
  const si = clamp(Math.round(force ? S.t : S.x), 0, NS - 1), zi = clamp(Math.round(force ? Z.t : Z.x), 0, NL - 1);
  if (si !== shownS) {
    shownS = si;
    $('#n').textContent = pad2(si + 1); $('#v').textContent = STEPS[si].v; $('#tag').textContent = STEPS[si].tag; $('#cnt').textContent = `${pad2(si + 1)} / ${pad2(NS)}`;
    [...$('#rail').children].forEach((li, k) => li.classList.toggle('on', k === si));
    if (!RM()) { const h = $('.head'); h.classList.remove('sw'); void h.offsetWidth; h.classList.add('sw'); }
    queue();
  }
  if (zi !== shownZ) {
    shownZ = zi; $('#q').textContent = Q_LABEL[zi]; $('#eggs').textContent = COUNT_LABEL[zi];
    [...$('#ticks').children].forEach((t, k) => t.classList.toggle('on', k === zi));
    queue();
  }
}
let qt = 0; const queue = () => { clearTimeout(qt); qt = setTimeout(announce, 350); };
function announce() { $('#live').textContent = `State ${shownS + 1} of ${NS}: ${STEPS[shownS].v}, ${STEPS[shownS].tag}. ${COUNT_LABEL[shownZ]}. ${auto ? 'Auto' : 'By hand'}.`; }

/* ---- gestures: the finger drives whichever axis it moves along; release springs to the nearest step ---- */
const stage = $('#stage'); let g = null;
const rub = (v, hi) => v < 0 ? v * .35 : v > hi ? hi + (v - hi) * .35 : v;
stage.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button !== 0) return; g = { id: e.pointerId, x: e.clientX, y: e.clientY, s0: S.x, z0: Z.x, axis: null, s: [{ t: e.timeStamp, x: e.clientX, y: e.clientY }] }; });
stage.addEventListener('pointermove', e => {
  if (!g || g.id !== e.pointerId) return;
  const dx = e.clientX - g.x, dy = e.clientY - g.y;
  g.s.push({ t: e.timeStamp, x: e.clientX, y: e.clientY }); if (g.s.length > 10) g.s.shift();
  if (!g.axis) {
    if (Math.hypot(dx, dy) < 10) return;
    g.axis = Math.abs(dx) > Math.abs(dy) * 1.1 ? 'x' : 'y';
    try { stage.setPointerCapture(g.id); } catch (_) {}
    stage.classList.add('drag'); used();
    const o = g.axis === 'x' ? Z : S; o.drag = true; o.v = 0; kick();
  }
  if (g.axis === 'y') S.x = rub(g.s0 - dy / clamp(H / 3.2, 110, 200), S.max);
  else Z.x = rub(g.z0 - dx / clamp(W * .5, 150, 320), Z.max);
  kick();
});
function endG(e, cancel) {
  if (!g || g.id !== e.pointerId) return; const gg = g; g = null; stage.classList.remove('drag');
  if (!gg.axis) return;
  const o = gg.axis === 'x' ? Z : S, unit = gg.axis === 'x' ? clamp(W * .5, 150, 320) : clamp(H / 3.2, 110, 200);
  const a = gg.s[0], b = gg.s[gg.s.length - 1]; let v = 0;
  if (!cancel && b.t - a.t > 10 && e.timeStamp - b.t < 120) { const d = gg.axis === 'x' ? -(b.x - a.x) : -(b.y - a.y); v = clamp(d / unit / ((b.t - a.t) / 1000), -9, 9); }
  o.drag = false; o.t = clamp(Math.round(o.x + v * .15), 0, o.max);
  if (RM()) snap(o); else { o.v = v * .6; kick(); }
  ui(true);
}
stage.addEventListener('pointerup', e => endG(e, false)); stage.addEventListener('pointercancel', e => endG(e, true));

/* wheel: one step per gesture, vertical = state, horizontal = zoom */
let wl = false, wt = 0;
stage.addEventListener('wheel', e => {
  e.preventDefault(); clearTimeout(wt); wt = setTimeout(() => { wl = false; }, 160); if (wl) return;
  const ax = Math.abs(e.deltaX) > Math.abs(e.deltaY), d = ax ? e.deltaX : e.deltaY; if (Math.abs(d) < 6) return;
  wl = true; if (ax) goZoom(Z.t + Math.sign(d)); else goState(S.t + Math.sign(d));
}, { passive: false });

$('#b-up').onclick = () => goState(S.t - 1);
$('#b-down').onclick = () => goState(S.t + 1);
$('#b-less').onclick = () => goZoom(Z.t - 1);
$('#b-more').onclick = () => goZoom(Z.t + 1);
$('#b-auto').onclick = () => setAuto(!auto);
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key;
  if (k === 'ArrowDown') { e.preventDefault(); goState(S.t + 1); }
  else if (k === 'ArrowUp') { e.preventDefault(); goState(S.t - 1); }
  else if (k === 'ArrowRight') { e.preventDefault(); goZoom(Z.t + 1); }
  else if (k === 'ArrowLeft') { e.preventDefault(); goZoom(Z.t - 1); }
  else if (k === 'a' || k === 'A') setAuto(!auto);
  else if (/^[1-7]$/.test(k)) goState(+k - 1);
  else if (k === 'Home') { e.preventDefault(); goState(0); }
  else if (k === 'End') { e.preventDefault(); goState(NS - 1); }
});

cvEl = $('#cv'); ctx = cvEl.getContext('2d');
for (let i = 0; i < NS; i++) $('#rail').appendChild(document.createElement('li'));
for (let i = 0; i < NL; i++) $('#ticks').appendChild(document.createElement('i'));
let rz = 0;
const resize = () => { if (size()) { draw(); } };
addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(resize, 80); });
if (window.ResizeObserver) new ResizeObserver(() => { clearTimeout(rz); rz = setTimeout(resize, 40); }).observe(stage);
size(); draw(); ui(true);
if (!RM()) setTimeout(() => { if (!interacted && !Z.drag) { Z.v = 3; kick(); } }, 1200);   // a small nudge toward "zoom out"
window.__vm = { goState, goZoom, setAuto, redraw: draw, get state() { return S.x; }, get zoom() { return Z.x; }, get sT() { return S.t; }, get zT() { return Z.t; }, get auto() { return auto; }, get drawn() { return drawn; }, get LV() { return LV; }, get dims() { return { W, H }; }, NL, NS };
})();
