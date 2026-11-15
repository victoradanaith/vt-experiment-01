(() => {
'use strict';
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const root = document.documentElement;
if (/[?&]rm=1/.test(location.search)) root.classList.add('rm');
const RM = () => root.classList.contains('rm') || matchMedia('(prefers-reduced-motion: reduce)').matches;
const INK = '#ece8dd', ACC = '#f2a516';

/* seven phases of the egg. One word each; the picture carries the rest. The second word is the business step it stands for. */
const STEPS = [
  { v: 'COLD', tag: 'INBOX' }, { v: 'PREP', tag: 'VALIDATE' }, { v: 'CRACK', tag: 'TRIGGER' }, { v: 'FRY', tag: 'RULES' },
  { v: 'PLATE', tag: 'FORMAT' }, { v: 'SERVE', tag: 'DELIVER' }, { v: 'WASH', tag: 'LOG' }
];
const NS = STEPS.length, NL = 6;                // 6 scales: the pitch halves each time, so the eggs fill the page more densely
const LAGK = [0, .5, 1.1, 1.9, 2.9, 4];         // how far the last egg trails behind when it is done by hand, per scale
let cur = 0, auto = false, interacted = false;
const L = { x: 0, v: 0, t: 0, drag: false };    // scale position, 0..5 (continuous while swiping)
const pages = [];
let GA = 1;                                     // global alpha multiplier for cross-fading scales

/* ---- one egg as a pixel circle; the state is the phase it is in ---- */
function egg(c, x, y, R, st) {
  c.lineWidth = clamp(R * .07, 1, 3); c.strokeStyle = INK; c.fillStyle = INK;
  const A = a => { c.globalAlpha = a * GA; };
  const arc = (xx, yy, r, a0, a1, fill) => { c.beginPath(); c.arc(xx, yy, r, a0, a1); fill ? c.fill() : c.stroke(); };
  const dot = (yy, r, a) => { A(a); c.fillStyle = ACC; arc(x, yy, r, 0, 6.2832, true); c.fillStyle = INK; };
  switch (st) {
    case 0: A(.5); arc(x, y, R, 0, 6.2832); break;                                                          // waiting: hollow
    case 1: A(.95); arc(x, y, R, 0, 6.2832, true); break;                                                   // ready: solid
    case 2: A(.95); arc(x - R * .14, y - R * .22, R, Math.PI * 1.08, Math.PI * 2, true); arc(x + R * .12, y + R * .2, R, Math.PI * .08, Math.PI, true); break; // opened
    case 3: A(.8); arc(x, y, R, 0, 6.2832); dot(y, R * .46, 1); break;                                      // heat: ring + yolk
    case 4: A(.8); arc(x, y, R, 0, 6.2832); A(.5); arc(x, y, R * 1.32, 0, 6.2832); dot(y, R * .4, 1); break;  // placed: ring in ring
    case 5: A(.25); arc(x, y, R, 0, 6.2832); dot(y - R * .4, R * .34, .75); break;                           // delivered: the dot leaves
    default: A(.6); c.setLineDash([R * .3, R * .35]); arc(x, y, R * 1.1, 0, 6.2832); c.setLineDash([]);     // cleared: dashed, empty
  }
  c.globalAlpha = 1;
}
const stateOf = (r, k, n, lv) => auto || n < 2 ? r : clamp(Math.round(r - (k / (n - 1)) * LAGK[lv]), 0, NS - 1);

/* ---- grid for one scale: the pitch halves per level; the grid fills the page edge to edge ---- */
function grid(w, h, lv) {
  const base = Math.min(w, h), p = base / 2 ** lv;
  const cols = Math.max(1, Math.floor(w / p + .001)), rows = Math.max(1, Math.floor(h / p + .001));
  return { p, cols, rows, n: cols * rows, x0: (w - cols * p) / 2, y0: (h - rows * p) / 2 };
}
function drawLevel(c, pg, lv, r, alpha, sc) {
  const { w, h } = pg.size, G = grid(w, h, lv);
  c.save(); c.translate(w / 2, h / 2); c.scale(sc, sc); c.translate(-w / 2, -h / 2); GA = alpha;
  const R = G.p * .36;
  for (let k = 0; k < G.n; k++) egg(c, G.x0 + ((k % G.cols) + .5) * G.p, G.y0 + (((k / G.cols) | 0) + .5) * G.p, R, stateOf(r, k, G.n, lv));
  c.restore(); GA = 1;
}
function drawPage(pg) {
  const { cv, stage } = pg;
  const w = Math.floor(stage.clientWidth), h = Math.floor(stage.clientHeight);
  if (w < 20 || h < 20) return;
  const dpr = Math.min(3, devicePixelRatio || 1);
  if (pg.size.w !== w || pg.size.h !== h) { cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + 'px'; cv.style.height = h + 'px'; pg.size = { w, h }; }
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
  const k0 = Math.floor(L.x + 1e-6), f = clamp(L.x - k0, 0, 1);
  if (f < .001) drawLevel(c, pg, k0, pg.r, 1, 1);
  else { drawLevel(c, pg, k0, pg.r, 1 - f, 1 + f * .45); drawLevel(c, pg, Math.min(NL - 1, k0 + 1), pg.r, f, .7 + .3 * f); }
  pg.drawnAt = L.x;
}

/* ---- build ---- */
const pad2 = n => String(n).padStart(2, '0');
function build() {
  const host = $('#pages'); host.textContent = ''; pages.length = 0; $('#rail').textContent = '';
  STEPS.forEach((S, r) => {
    const sec = document.createElement('section'); sec.className = 'page'; sec.setAttribute('aria-label', `Phase ${r + 1} of ${NS}: ${S.v}, ${S.tag}`);
    sec.innerHTML = `<div class="head"><span class="n">${pad2(r + 1)}</span><h2 class="v">${S.v}</h2><span class="tag">${S.tag}</span></div><div class="stage"><canvas aria-hidden="true"></canvas></div>`;
    host.appendChild(sec);
    const pg = { sec, r, stage: sec.querySelector('.stage'), cv: sec.querySelector('canvas'), size: { w: 0, h: 0 }, drawnAt: -1 };
    pages.push(pg);
    if (window.ResizeObserver) new ResizeObserver(() => { pg.size = { w: 0, h: 0 }; drawPage(pg); }).observe(pg.stage);
    $('#rail').appendChild(document.createElement('li'));
  });
  $('#ticks').textContent = ''; for (let i = 0; i < NL; i++) $('#ticks').appendChild(document.createElement('i'));
  drawVisible(true); sync(true);
}
function drawVisible(all) { pages.forEach(pg => { if (all || Math.abs(pg.r - cur) <= 1) { if (all || pg.drawnAt !== L.x) drawPage(pg); } }); }

/* ---- scale: spring toward an integer level, or follow the finger ---- */
const K = 150, C = 18; let raf = 0, last = 0;
function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }
function tick(now) {
  const dt = Math.min(.033, (now - last) / 1000); last = now;
  let busy = L.drag;
  if (!L.drag) { L.v += ((L.t - L.x) * K - L.v * C) * dt; L.x += L.v * dt; if (Math.abs(L.t - L.x) > .002 || Math.abs(L.v) > .01) busy = true; else { L.x = L.t; L.v = 0; } }
  drawVisible(false); labels();
  raf = busy ? requestAnimationFrame(tick) : 0;
  if (!busy) drawVisible(true);
}
function used() { if (!interacted) { interacted = true; $('#hint').classList.add('gone'); } }
function setScale(i) {
  used(); L.t = clamp(Math.round(i), 0, NL - 1);
  if (RM()) { L.x = L.t; L.v = 0; drawVisible(true); labels(); } else kick();
  labels(true);
}
function eggCount(lv) { const pg = pages[cur]; return grid(pg.size.w || 300, pg.size.h || 400, lv).n; }
let lastLv = -1;
function labels(force) {
  const lv = clamp(Math.round(force ? L.t : L.x), 0, NL - 1);
  if (lv === lastLv && !force) return;
  lastLv = lv; const n = eggCount(lv);
  $('#q').textContent = '×' + n; $('#eggs').textContent = n === 1 ? '1 egg' : n + ' eggs';
  [...$('#ticks').children].forEach((t, i) => t.classList.toggle('on', i === lv));
  clearTimeout(labels.t); labels.t = setTimeout(announce, 350);
}
function announce() { $('#live').textContent = `Phase ${cur + 1} of ${NS}: ${STEPS[cur].v}, ${STEPS[cur].tag}. ${$('#eggs').textContent}. ${auto ? 'Auto' : 'By hand'}.`; }

/* ---- phases: native vertical scroll-snap ---- */
const pagesEl = $('#pages');
const beh = () => RM() ? 'auto' : 'smooth';
function goPhase(i) { used(); i = clamp(Math.round(i), 0, NS - 1); pagesEl.scrollTo({ top: i * pagesEl.clientHeight, behavior: beh() }); sync(false, i); }
function sync(force, to) {
  const h = pagesEl.clientHeight || 1, i = to !== undefined ? to : clamp(Math.round(pagesEl.scrollTop / h), 0, NS - 1);
  if (i === cur && !force) return;
  cur = i;
  $('#cnt').textContent = `${pad2(i + 1)} / ${pad2(NS)}`;
  [...$('#rail').children].forEach((li, k) => li.classList.toggle('on', k === i));
  $('#b-up').disabled = i === 0; $('#b-down').disabled = i === NS - 1;
  drawVisible(false); lastLv = -1; labels(true);
}
pagesEl.addEventListener('scroll', () => { sync(false); if (pagesEl.scrollTop > 20) used(); }, { passive: true });
function setAuto(v) { used(); auto = v; $('#b-auto').setAttribute('aria-pressed', auto); drawVisible(true); announce(); }

/* ---- gestures: touch scrolls vertically by itself; sideways drag follows the finger as scale ---- */
let g = null;
pagesEl.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button !== 0) return; g = { id: e.pointerId, x: e.clientX, y: e.clientY, l0: L.x, axis: null, s: [{ t: e.timeStamp, x: e.clientX }], mouse: e.pointerType === 'mouse', done: false }; });
pagesEl.addEventListener('pointermove', e => {
  if (!g || g.id !== e.pointerId) return;
  const dx = e.clientX - g.x, dy = e.clientY - g.y;
  g.s.push({ t: e.timeStamp, x: e.clientX }); if (g.s.length > 10) g.s.shift();
  if (!g.axis) {
    if (Math.hypot(dx, dy) < 10) return;
    g.axis = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'x' : 'y';
    if (g.axis === 'x') { try { pagesEl.setPointerCapture(g.id); } catch (_) {} used(); L.drag = true; L.v = 0; kick(); }
  }
  if (g.axis === 'x') { const W = pagesEl.clientWidth || 360; const raw = g.l0 - dx / (W * .55); L.x = raw < 0 ? raw * .35 : raw > NL - 1 ? NL - 1 + (raw - (NL - 1)) * .35 : raw; kick(); }
  else if (g.mouse && !g.done && Math.abs(dy) > 60) { g.done = true; goPhase(cur + (dy < 0 ? 1 : -1)); }
});
function endG(e, cancel) {
  if (!g || g.id !== e.pointerId) return; const gg = g; g = null;
  if (gg.axis !== 'x') return;
  const a = gg.s[0], b = gg.s[gg.s.length - 1]; let v = 0;
  if (!cancel && b.t - a.t > 10 && e.timeStamp - b.t < 120) v = clamp(-(b.x - a.x) / ((pagesEl.clientWidth || 360) * .55) / ((b.t - a.t) / 1000), -8, 8);
  L.drag = false; L.t = clamp(Math.round(L.x + v * .15), 0, NL - 1);
  if (RM()) { L.x = L.t; L.v = 0; drawVisible(true); } else { L.v = v * .6; kick(); }
  labels(true);
}
pagesEl.addEventListener('pointerup', e => endG(e, false)); pagesEl.addEventListener('pointercancel', e => endG(e, true));

$('#b-up').onclick = () => goPhase(cur - 1);
$('#b-down').onclick = () => goPhase(cur + 1);
$('#b-less').onclick = () => setScale(L.t - 1);
$('#b-more').onclick = () => setScale(L.t + 1);
$('#b-auto').onclick = () => setAuto(!auto);
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key;
  if (k === 'ArrowDown' || k === 'PageDown') { e.preventDefault(); goPhase(cur + 1); }
  else if (k === 'ArrowUp' || k === 'PageUp') { e.preventDefault(); goPhase(cur - 1); }
  else if (k === 'ArrowRight') { e.preventDefault(); setScale(L.t + 1); }
  else if (k === 'ArrowLeft') { e.preventDefault(); setScale(L.t - 1); }
  else if (k === 'a' || k === 'A') setAuto(!auto);
  else if (/^[1-7]$/.test(k)) goPhase(+k - 1);
  else if (k === 'Home') { e.preventDefault(); goPhase(0); }
  else if (k === 'End') { e.preventDefault(); goPhase(NS - 1); }
});
let rz = 0;
addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { const t = cur * pagesEl.clientHeight; pagesEl.scrollTo({ top: t, behavior: 'auto' }); pages.forEach(p => { p.size = { w: 0, h: 0 }; }); drawVisible(true); sync(true); }, 100); });

build();
if (!RM()) setTimeout(() => { if (!interacted && !L.drag) { L.v = 3.2; kick(); } }, 1200);   // a small nudge toward "more eggs"
window.__vf = { goPhase, setScale, setAuto, grid, get phase() { return cur; }, get level() { return L.x; }, get target() { return L.t; }, get auto() { return auto; }, pages, pagesEl, NL };
})();
