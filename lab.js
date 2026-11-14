(() => {
'use strict';
const NS = 'http://www.w3.org/2000/svg';
const $ = (s) => document.querySelector(s);
const root = document.documentElement;
const stage = $('#stage'), svg = $('#scene');
const spotEls = [...document.querySelectorAll('.spot')];

/* ---------- reduced motion (OS setting, or ?rm=1 to force for testing) ---------- */
const mq = matchMedia('(prefers-reduced-motion: reduce)');
let RM = mq.matches || /[?&]rm=1/.test(location.search);
const syncRM = () => { RM = mq.matches || /[?&]rm=1/.test(location.search); root.classList.toggle('rm', RM); if (RM) snapNow(); };
mq.addEventListener && mq.addEventListener('change', syncRM);
root.classList.toggle('rm', RM);

/* ---------- content: five states ---------- */
const OR = '#ff5a14', YE = '#ffc400', BL = '#2c4bff';
const sec = (a0, a1, r, ri, ox, oy) => ({ a0, a1, r, ri, ox, oy });
const d45 = (j, m) => [Math.cos((45 + j * 90) * Math.PI / 180) * m, Math.sin((45 + j * 90) * Math.PI / 180) * m];
const S = [
  { name: 'Rest', word: 'REST', bg: '#e6e6e2', ink: '#0a0a0a', rot: 0, ringR: 1.34, note: 'One body. Four quarters held at rest.',
    sec: [0,1,2,3].map(j => sec(j*90, j*90+90, 1, 0, 0, 0)),
    sq: { x: 0, y: 0, s: 0, rot: 0, fa: 0 },
    spots: [[YE,0,.3,1.7],[OR,.35,-.1,1.5],[BL,-.9,-1.4,1.2]] },
  { name: 'Drift', word: 'DRIFT', bg: '#f1eadb', ink: '#0d0d0c', rot: 14, ringR: 1.7, note: 'Quarters pull apart along the diagonal.',
    sec: [0,1,2,3].map(j => sec(j*90, j*90+90, [1,.92,1,.84][j], 0, ...d45(j, .17))),
    sq: { x: .95, y: -.95, s: .5, rot: 14, fa: 0 },
    spots: [[OR,-.6,.5,1.6],[BL,.5,.3,1.4],[YE,1,-1.5,1.3]] },
  { name: 'Orbit', word: 'ORBIT', bg: '#0a0a0a', ink: '#f1eee4', rot: -20, ringR: 2.1, note: 'The disc thins into four orbits.',
    sec: [sec(200,340,.55,.5,0,0), sec(10,170,.8,.73,0,0), sec(100,220,1.05,.96,0,0), sec(290,400,1.3,1.2,0,0)],
    sq: { x: 0, y: 0, s: .3, rot: 45, fa: 1 },
    spots: [[BL,0,.2,1.8],[OR,-.4,.2,1.2],[YE,.6,-.6,1]] },
  { name: 'Split', word: 'SPLIT', bg: '#efe8d8', ink: '#0d0d0c', rot: 0, ringR: 1, note: 'A halved form, sheared along its axis.',
    sec: [sec(90,270,1,0,-.3,0), sec(270,450,1,0,.3,0), sec(0,.1,0,0,0,0), sec(0,.1,0,0,0,0)],
    sq: { x: 0, y: 0, s: 1.6, rot: 0, fa: 0 },
    spots: [[YE,.4,.6,1.5],[OR,-.7,-.2,1.5],[BL,.9,.4,1.4]] },
  { name: 'Fall', word: 'FALL', bg: '#dcdcd8', ink: '#0a0a0a', rot: 0, ringR: 2.6, note: 'The mass falls into fragments.',
    sec: [sec(0,359.9,.2,0,-.95,-1), sec(0,359.9,.32,0,-.35,-.25), sec(0,359.9,.46,0,.3,.5), sec(0,359.9,.62,0,1,1.25)],
    sq: { x: 1.1, y: -1.3, s: .4, rot: 25, fa: 1 },
    spots: [[BL,-.3,0,1.5],[YE,1,1.2,1.3],[OR,-1,-1.1,1.4]] }
];
const N = S.length, MAXL = 2;

/* ---------- helpers ---------- */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const hex = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mixHex = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',')})`; };
const rgbOf = (a, b, t) => { const A = hex(a), B = hex(b); return A.map((v, i) => Math.round(lerp(v, B[i], t))); };
const ease = (f) => (f <= 0 || f >= 1) ? f : f * f * (3 - 2 * f);
const el = (tag, attrs = {}, parent = svg) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
const rad = (d) => d * Math.PI / 180;
const pad2 = (n) => String(n).padStart(2, '0');

/* ---------- layout (recomputed on resize; portrait vs desktop are composed differently) ---------- */
let L = {};
function layout() {
  const W = innerWidth, H = innerHeight;
  const desk = W >= 900 && W > H;
  L = desk
    ? { W, H, desk, cx: W * .74, cy: H * .5, R: H * .95, act: 180, step: 13, S: H * .24, F: H * .36, X0: W * .29, XW: W * .45, pxX: 230, pxY: 190 }
    : { W, H, desk, cx: W * .5, cy: H * .64, R: H * .44, act: -90, step: 19, S: Math.min(W * .27, H * .13), F: W * .5, X0: 0, XW: W, pxX: 150, pxY: 170 };
  buildStatic();
}

/* ---------- static SVG scaffolding ---------- */
let g = {};
function buildStatic() {
  svg.replaceChildren();
  svg.setAttribute('viewBox', `0 0 ${L.W} ${L.H}`);
  g = {};
  // construction grid (fine, fixed)
  const grid = el('g', { stroke: 'var(--ink)', 'stroke-width': .5, opacity: .09 });
  const gs = L.desk ? 72 : 48;
  for (let x = (L.W % gs) / 2; x < L.W; x += gs) el('line', { x1: x, y1: 0, x2: x, y2: L.H }, grid);
  for (let y = (L.H % gs) / 2; y < L.H; y += gs) el('line', { x1: 0, y1: y, x2: L.W, y2: y }, grid);

  // dial: rings + ticks
  g.dial = el('g', { fill: 'none', stroke: 'var(--ink)' });
  el('circle', { cx: L.cx, cy: L.cy, r: L.R, 'stroke-width': .8 }, g.dial);
  el('circle', { cx: L.cx, cy: L.cy, r: L.R * .86, 'stroke-width': .5, 'stroke-dasharray': '2 6', opacity: .5 }, g.dial);
  g.ticks = el('g', { stroke: 'var(--ink)', 'stroke-width': .8 }, g.dial);
  const per = 6, sub = L.step / per;
  for (let t = -4 * per; t <= (N + 3) * per; t++) {
    const major = t % per === 0, half = t % (per / 2) === 0;
    const len = major ? 24 : half ? 13 : 7;
    const a = rad(t * sub);
    el('line', { x1: L.cx + Math.cos(a) * L.R, y1: L.cy + Math.sin(a) * L.R, x2: L.cx + Math.cos(a) * (L.R - len), y2: L.cy + Math.sin(a) * (L.R - len), opacity: major ? 1 : .7 }, g.ticks);
  }
  // crosshair + big thin ring (behind geometry)
  g.back = el('g', { fill: 'none', stroke: 'var(--ink)' });
  g.bigRing = el('circle', { cx: 0, cy: 0, 'stroke-width': .6, opacity: .55 }, g.back);
  g.cross = el('g', { 'stroke-width': .5, opacity: .35 }, g.back);
  el('line', { x1: -L.W * 2, y1: 0, x2: L.W * 2, y2: 0 }, g.cross);
  el('line', { x1: 0, y1: -L.H * 2, x2: 0, y2: L.H * 2 }, g.cross);

  // typography (behind geometry layers)
  g.letters = [...Array(5)].map(() => {
    const t = el('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-weight': 800, 'font-size': 100, 'letter-spacing': '-0.04em', stroke: 'var(--ink)', 'stroke-linejoin': 'round' });
    t.textContent = '·';
    return t;
  });

  // geometry
  g.geo = el('g', {});
  g.secs = [0, 1, 2, 3].map(() => el('path', { fill: 'var(--ink)', stroke: 'var(--ink)', 'stroke-width': .8, 'stroke-linejoin': 'round' }, g.geo));
  g.sq = el('rect', { stroke: 'var(--ink)', 'stroke-width': .9 }, g.geo);

  // annotations (exploded level)
  g.ann = el('g', { opacity: 0 });
  g.annItems = [0, 1, 2, 3, 4].map(() => ({
    line: el('line', { stroke: 'var(--ink)', 'stroke-width': .6 }, g.ann),
    dot: el('circle', { r: 2, fill: 'var(--ink)' }, g.ann),
    txt: el('text', { class: 'mono', 'font-size': 9, 'dominant-baseline': 'central' }, g.ann)
  }));

  // dial labels (on top)
  g.labels = S.map((s, i) => {
    const grp = el('g', {});
    const n = el('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-weight': 700, 'letter-spacing': '-0.03em' }, grp);
    n.textContent = pad2(i + 1);
    const nm = el('text', { class: 'mono', 'text-anchor': 'middle', 'font-size': 9, 'dominant-baseline': 'central' }, grp);
    nm.textContent = s.name.toUpperCase();
    return { grp, n, nm };
  });
  render(true);
}

/* ---------- physics: two axes, each a mass on a spring with inertia ---------- */
const mkAxis = (max) => ({ x: 0, v: 0, t: 0, max, drag: false });
const dial = mkAxis(N - 1), lay = mkAxis(MAXL);
let running = false, last = 0, interacted = false;
const K = 140, C = 17;

function stepAxis(a, dt) {
  if (a.drag) return false;
  if (RM) { const moved = a.x !== a.t; a.x = a.t; a.v = 0; return moved; }
  const acc = -K * (a.x - a.t) - C * a.v;
  a.v += acc * dt; a.x += a.v * dt;
  if (Math.abs(a.x - a.t) < .0008 && Math.abs(a.v) < .004) { a.x = a.t; a.v = 0; return false; }
  return true;
}
function tick(now) {
  const dt = Math.min(.033, (now - last) / 1000 || .016); last = now;
  const m1 = stepAxis(dial, dt), m2 = stepAxis(lay, dt);
  render();
  if (m1 || m2 || dial.drag || lay.drag) requestAnimationFrame(tick); else running = false;
}
function kick() { if (!running) { running = true; last = performance.now(); requestAnimationFrame(tick); } }
function snapNow() { dial.x = dial.t; lay.x = lay.t; dial.v = lay.v = 0; kick(); }

function setTarget(a, t) { a.t = clamp(Math.round(t), 0, a.max); }
let lastAnn = '';
function announce() {
  const msg = `State ${dial.t + 1} of ${N}, ${S[dial.t].name}. Layer level ${lay.t + 1} of ${MAXL + 1}.`;
  if (msg !== lastAnn) { lastAnn = msg; $('#live').textContent = msg; try { navigator.vibrate && !RM && navigator.vibrate(6); } catch (e) {} }
}
function goState(i) { setTarget(dial, i); announce(); kick(); }
function goLayer(i) { setTarget(lay, i); announce(); kick(); }
const rubber = (v, max) => v < 0 ? v * .35 : v > max ? max + (v - max) * .35 : v;

/* ---------- gesture ---------- */
let G = null;
stage.addEventListener('pointerdown', (e) => {
  if (e.target.closest('.pad, .info')) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  stage.setPointerCapture(e.pointerId);
  G = { id: e.pointerId, x0: e.clientX, y0: e.clientY, lx: e.clientX, ly: e.clientY, lt: e.timeStamp, axis: null, bx: dial.x, by: lay.x, vx: 0, vy: 0 };
  stopNudge(); markInteracted();
});
stage.addEventListener('pointermove', (e) => {
  if (!G || e.pointerId !== G.id) return;
  const dx = e.clientX - G.x0, dy = e.clientY - G.y0;
  if (!G.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 8) {
    G.axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
    (G.axis === 'x' ? dial : lay).drag = true; stage.classList.add('drag');
    kick();
  }
  const dt = Math.max(1, e.timeStamp - G.lt) / 1000;
  if (G.axis === 'x') {
    const raw = G.bx - dx / L.pxX;
    const nx = rubber(raw, dial.max);
    const inst = (nx - dial.x) / dt; G.vx = clamp(lerp(G.vx, inst, .35), -12, 12); dial.x = nx;
  } else if (G.axis === 'y') {
    const raw = G.by - dy / L.pxY;
    const ny = rubber(raw, lay.max);
    const inst = (ny - lay.x) / dt; G.vy = clamp(lerp(G.vy, inst, .35), -12, 12); lay.x = ny;
  }
  G.lx = e.clientX; G.ly = e.clientY; G.lt = e.timeStamp;
  if (G.axis) { dial.v = G.axis === 'x' ? G.vx : dial.v; lay.v = G.axis === 'y' ? G.vy : lay.v; }
});
function endGesture(e, cancelled) {
  if (!G || e.pointerId !== G.id) return;
  const gg = G; G = null; stage.classList.remove('drag');
  if (!gg.axis) { // a tap: hit-test dial numerals
    if (!cancelled) tapAt(e.clientX, e.clientY);
    return;
  }
  const a = gg.axis === 'x' ? dial : lay, v = gg.axis === 'x' ? gg.vx : gg.vy;
  a.drag = false;
  const fresh = e.timeStamp - gg.lt < 90;           // finger stopped before lifting → no fling
  const vel = fresh ? v : 0;
  a.v = RM ? 0 : clamp(vel, -9, 9);
  const from = Math.round(gg.axis === 'x' ? gg.bx : gg.by);
  const proj = a.x + (RM ? 0 : a.v * .22);
  setTarget(a, clamp(Math.round(proj), from - 2, from + 2));
  announce(); kick();
}
stage.addEventListener('pointerup', (e) => endGesture(e, false));
stage.addEventListener('pointercancel', (e) => endGesture(e, true));

function tapAt(px, py) {
  let best = -1, bd = 40;
  labelPts.forEach((p, i) => { const d = Math.hypot(p.x - px, p.y - py); if (d < bd) { bd = d; best = i; } });
  if (best >= 0) goState(best);
}

/* wheel (desktop): accumulates into the dominant axis, snaps when it stops */
let wheelT = 0;
stage.addEventListener('wheel', (e) => {
  e.preventDefault(); markInteracted(); stopNudge();
  const horiz = Math.abs(e.deltaX) > Math.abs(e.deltaY);
  const a = horiz ? dial : lay, d = horiz ? e.deltaX / (L.pxX * 3) : -e.deltaY / (L.pxY * 3);
  a.drag = true; a.x = rubber(a.x + (horiz ? d : d), a.max); a.v = 0; kick();
  clearTimeout(wheelT);
  wheelT = setTimeout(() => { dial.drag = lay.drag = false; setTarget(dial, dial.x); setTarget(lay, lay.x); announce(); kick(); }, 140);
}, { passive: false });

/* keyboard + buttons */
const nav = {
  prev: () => goState(dial.t - 1), next: () => goState(dial.t + 1),
  up: () => goLayer(lay.t + 1), down: () => goLayer(lay.t - 1)
};
$('#b-prev').onclick = () => { markInteracted(); stopNudge(); nav.prev(); };
$('#b-next').onclick = () => { markInteracted(); stopNudge(); nav.next(); };
$('#b-up').onclick = () => { markInteracted(); stopNudge(); nav.up(); };
$('#b-down').onclick = () => { markInteracted(); stopNudge(); nav.down(); };
const infoB = $('#b-info'), info = $('#info');
infoB.onclick = () => { const open = info.hidden; info.hidden = !open; infoB.setAttribute('aria-expanded', open); markInteracted(); };
addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key; let used = true;
  if (k === 'ArrowLeft') nav.prev(); else if (k === 'ArrowRight') nav.next();
  else if (k === 'ArrowUp') nav.up(); else if (k === 'ArrowDown') nav.down();
  else if (k === 'Home') goState(0); else if (k === 'End') goState(N - 1);
  else if (/^[1-5]$/.test(k)) goState(+k - 1);
  else if (k === 'Escape' && !info.hidden) { info.hidden = true; infoB.setAttribute('aria-expanded', false); }
  else used = false;
  if (used) { markInteracted(); stopNudge(); if (document.activeElement && document.activeElement.tagName === 'BUTTON' && k.startsWith('Arrow')) e.preventDefault(); else if (k.startsWith('Arrow')) e.preventDefault(); }
});

/* ---------- discoverability: a self-playing nudge (never under reduced motion) ---------- */
let nudgeTimers = [];
function markInteracted() { if (!interacted) { interacted = true; $('#hint').classList.add('gone'); } }
function stopNudge() { nudgeTimers.forEach(clearTimeout); nudgeTimers = []; }
function startNudge() {
  if (RM) return;
  nudgeTimers.push(setTimeout(() => { if (!interacted) { dial.v = 2.2; kick(); } }, 1100));
  nudgeTimers.push(setTimeout(() => { if (!interacted) { lay.v = 2.4; kick(); } }, 2800));
}

/* ---------- render ---------- */
let labelPts = [];
let lastNote = -1, lastCount = '';
function seg(p) {
  const i = clamp(Math.floor(p), 0, N - 2); let f = p - i;
  return { i, f, e: (f < 0 || f > 1) ? f : ease(f) };
}
function polar(a, r) { return { x: L.cx + Math.cos(rad(a)) * r, y: L.cy + Math.sin(rad(a)) * r }; }

function sectorPath(r, ri, a0, a1) {
  if (r < .004) return '';
  const p = (rr, a) => [(Math.cos(rad(a)) * rr).toFixed(2), (Math.sin(rad(a)) * rr).toFixed(2)];
  const laf = Math.abs(a1 - a0) > 180 ? 1 : 0;
  const [x0, y0] = p(r, a0), [x1, y1] = p(r, a1), [x2, y2] = p(ri, a1), [x3, y3] = p(ri, a0);
  return `M${x0} ${y0}A${r.toFixed(2)} ${r.toFixed(2)} 0 ${laf} 1 ${x1} ${y1}L${x2} ${y2}A${ri.toFixed(2)} ${ri.toFixed(2)} 0 ${laf} 0 ${x3} ${y3}Z`;
}
function mixSec(A, B, e) {
  return { a0: lerp(A.a0, B.a0, e), a1: lerp(A.a1, B.a1, e), r: lerp(A.r, B.r, e), ri: lerp(A.ri, B.ri, e), ox: lerp(A.ox, B.ox, e), oy: lerp(A.oy, B.oy, e) };
}
const ISO = { x: .5, y: -.78 };

function render(force) {
  const p = clamp(dial.x, -.4, N - 1 + .4), ev = clamp(lay.x, -.25, MAXL + .25), v = dial.v;
  const { i, f, e } = seg(p);
  const A = S[i], B = S[i + 1];
  const Ssz = L.S;

  /* colour: background / ink */
  root.style.setProperty('--bg', mixHex(A.bg, B.bg, clamp(e, 0, 1)));
  root.style.setProperty('--ink', mixHex(A.ink, B.ink, clamp(e, 0, 1)));
  const ir = rgbOf(A.ink, B.ink, clamp(e, 0, 1));
  root.style.setProperty('--line', `rgba(${ir.join(',')},.35)`);

  /* dial */
  g.ticks.setAttribute('transform', `rotate(${L.act - p * L.step} ${L.cx} ${L.cy})`);
  g.dial.setAttribute('opacity', 1);
  labelPts = S.map((s, k) => {
    const ang = L.act + (k - p) * L.step;
    const w = Math.max(0, 1 - Math.abs(k - p)), ww = w * w;
    const fs = 11 + 74 * ww;
    const pt = polar(ang, L.R - 34 - fs * .5);
    const rot = (ang - L.act) * 1;
    const lb = g.labels[k];
    lb.grp.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)}) rotate(${rot.toFixed(2)})`);
    lb.n.setAttribute('font-size', fs.toFixed(1));
    lb.n.setAttribute('opacity', (.45 + .55 * ww).toFixed(2));
    lb.nm.setAttribute('y', (fs * .55 + 12).toFixed(1));
    lb.nm.setAttribute('opacity', (ww).toFixed(2));
    return pt;
  });
  const actPt = polar(L.act, L.R - 34 - 37);

  /* geometry (shared transform: rotation leans with angular velocity = weight made visible) */
  const rot = lerp(A.rot, B.rot, e) + clamp(v, -6, 6) * 2.2;
  g.geo.setAttribute('transform', `translate(${L.cx} ${L.cy})`);
  g.back.setAttribute('transform', `translate(${L.cx} ${L.cy}) rotate(${(rot * .6 + p * 9).toFixed(2)})`);
  g.bigRing.setAttribute('r', (lerp(A.ringR, B.ringR, e) * Ssz).toFixed(1));

  const lvl = clamp(ev, 0, MAXL), l1 = Math.min(lvl, 1), l2 = Math.max(0, lvl - 1);
  const layerOff = (k) => ({ x: ISO.x * Ssz * .26 * k * lvl, y: ISO.y * Ssz * .26 * k * lvl });
  const annData = [];
  for (let j = 0; j < 4; j++) {
    const s = mixSec(A.sec[j], B.sec[j], e);
    const off = layerOff(j);
    const path = g.secs[j];
    path.setAttribute('d', sectorPath(s.r * Ssz, s.ri * Ssz, s.a0, s.a1));
    path.setAttribute('transform', `translate(${off.x.toFixed(1)} ${off.y.toFixed(1)}) rotate(${rot.toFixed(2)}) translate(${(s.ox * Ssz).toFixed(1)} ${(s.oy * Ssz).toFixed(1)})`);
    path.setAttribute('fill-opacity', (1 - l1 * (.1 + .2 * j) - l2 * .1).toFixed(2));
    path.setAttribute('stroke-opacity', (.35 + l1 * .65).toFixed(2));
    // annotation anchor
    const am = rad((s.a0 + s.a1) / 2 + rot), rm = ((s.r + s.ri) / 2) * Ssz * .85;
    const lx = Math.cos(am) * rm + Math.cos(rad(rot)) * s.ox * Ssz - Math.sin(rad(rot)) * s.oy * Ssz;
    const ly = Math.sin(am) * rm + Math.sin(rad(rot)) * s.ox * Ssz + Math.cos(rad(rot)) * s.oy * Ssz;
    annData.push({ x: lx + off.x, y: ly + off.y, on: s.r > .05, txt: `L${j + 1} r${s.r.toFixed(2)} ${pad2(Math.round(Math.abs(s.a1 - s.a0) % 360))}°` });
  }
  const sqA = A.sq, sqB = B.sq;
  const sqs = lerp(sqA.s, sqB.s, e) * Ssz, sqo = layerOff(4);
  g.sq.setAttribute('x', -sqs / 2); g.sq.setAttribute('y', -sqs / 2);
  g.sq.setAttribute('width', Math.max(0, sqs)); g.sq.setAttribute('height', Math.max(0, sqs));
  const sqx = lerp(sqA.x, sqB.x, e) * Ssz + sqo.x, sqy = lerp(sqA.y, sqB.y, e) * Ssz + sqo.y;
  g.sq.setAttribute('transform', `translate(${sqx.toFixed(1)} ${sqy.toFixed(1)}) rotate(${(lerp(sqA.rot, sqB.rot, e) + rot).toFixed(1)})`);
  const fa = lerp(sqA.fa, sqB.fa, e);
  g.sq.setAttribute('fill', 'var(--ink)'); g.sq.setAttribute('fill-opacity', (fa * (1 - l1 * .45)).toFixed(2));
  g.sq.setAttribute('stroke-opacity', sqs > 1 ? 1 : 0);
  annData.push({ x: sqx, y: sqy, on: sqs > 2, txt: `SQ ${Math.round(sqs)}px` });

  /* annotations: only on the exploded level */
  const annA = clamp(ev - .55, 0, 1);
  g.ann.setAttribute('opacity', annA.toFixed(2));
  if (annA > 0) {
    const colX = L.desk ? L.cx + Ssz * 2.3 : L.W - 16;
    annData.forEach((a, k) => {
      const it = g.annItems[k];
      const ax = L.cx + a.x, ay = L.cy + a.y;
      const ty = ay + (k - 2) * 0;
      it.line.setAttribute('x1', ax); it.line.setAttribute('y1', ay); it.line.setAttribute('x2', colX - 4); it.line.setAttribute('y2', ay);
      it.dot.setAttribute('cx', ax); it.dot.setAttribute('cy', ay);
      it.txt.setAttribute('x', colX - 8); it.txt.setAttribute('y', ay - 8); it.txt.setAttribute('text-anchor', 'end');
      it.txt.textContent = a.txt;
      const vis = a.on ? 1 : 0;
      it.line.setAttribute('opacity', vis); it.dot.setAttribute('opacity', vis); it.txt.setAttribute('opacity', vis);
    });
  }

  /* typography: layout lerps between states, glyph swaps at the midpoint */
  const showB = f >= .5 && f <= 1 || f > 1;
  const word = (showB ? B : A).word, wA = A.word, wB = B.word;
  const dip = (f < 0 || f > 1) ? 1 : Math.pow(Math.abs(2 * f - 1), .8);
  let firstPos = { x: L.cx, y: L.cy };
  g.letters.forEach((t, k) => {
    const la = letterLayout(i, k, wA.length), lb = letterLayout(i + 1, k, wB.length);
    const lx = lerp(la.x, lb.x, e), ly = lerp(la.y, lb.y, e), fs = lerp(la.fs, lb.fs, e), lr = lerp(la.rot, lb.rot, e);
    const al = lerp(la.a, lb.a, e) * dip;
    const spread = (k - 2) * lvl * L.F * .06;
    const ox = lx + spread + ISO.x * L.F * .04 * k * lvl, oy = ly + ISO.y * L.F * .04 * k * lvl;
    if (k === 0) firstPos = { x: ox, y: oy };
    t.textContent = word[k] || ' ';
    t.setAttribute('transform', `translate(${ox.toFixed(1)} ${oy.toFixed(1)}) rotate(${lr.toFixed(2)}) scale(${(fs / 100).toFixed(4)})`);
    t.setAttribute('fill-opacity', (1 - l1 * .96).toFixed(2));
    t.setAttribute('stroke-width', (1.1 * 100 / fs).toFixed(2));
    t.setAttribute('stroke-opacity', (.12 + l1 * .88).toFixed(2));
    t.setAttribute('opacity', al.toFixed(2));
  });

  /* localized gradient spots: each tied to something (label / geometry / first letter) */
  const anchors = [actPt, { x: L.cx + ISO.x * Ssz * .5 * lvl, y: L.cy + ISO.y * Ssz * .5 * lvl }, firstPos];
  const smear = 1 + Math.min(.9, Math.abs(v) * .22);
  spotEls.forEach((s, k) => {
    const sa = A.spots[k], sb = B.spots[k], ee = clamp(e, 0, 1);
    const dx = lerp(sa[1], sb[1], ee) * Ssz, dy = lerp(sa[2], sb[2], ee) * Ssz, sz = lerp(sa[3], sb[3], ee) * Ssz * 1.9;
    const c = rgbOf(sa[0], sb[0], ee);
    s.style.width = s.style.height = sz.toFixed(0) + 'px';
    s.style.background = `radial-gradient(circle, rgb(${c.join(',')}) 0%, rgba(${c.join(',')},0) 68%)`;
    s.style.transform = `translate3d(${(anchors[k].x + dx - sz / 2).toFixed(1)}px,${(anchors[k].y + dy - sz / 2).toFixed(1)}px,0) scaleX(${smear.toFixed(3)})`;
    s.style.opacity = (A.ink === B.ink ? (A.bg === '#0a0a0a' ? .7 : .85) : .78).toFixed(2);
  });

  /* chrome */
  const cur = clamp(Math.round(dial.x), 0, N - 1);
  const cnt = pad2(cur + 1);
  if (cnt !== lastCount) { lastCount = cnt; $('#c-now').textContent = cnt; }
  if (cur !== lastNote) { lastNote = cur; $('#note').textContent = S[cur].note; }
  $('#t-th').textContent = (p * L.step).toFixed(1).padStart(5, '0');
  $('#t-v').textContent = Math.abs(v).toFixed(2);
  $('#t-l').textContent = lvl.toFixed(1);
}

function letterLayout(si, k, len) {
  si = clamp(si, 0, N - 1);
  const { W, H, F, X0, XW, desk } = L;
  const X = (u) => X0 + XW * u;
  const has = k < len ? 1 : 0;
  switch (si) {
    case 0: return { x: X0 + F * .3 + k * F * .58, y: H * (desk ? .5 : .45), fs: F, rot: 0, a: has };
    case 1: return { x: X0 + F * .2 + k * F * .42 * (desk ? .9 : 1), y: H * (desk ? .25 + .1 * k : .36 + .06 * k), fs: F * (.95 - .08 * k), rot: -5, a: has };
    case 2: { const ang = L.act + (k - 2) * (desk ? 11 : 30) + (desk ? 0 : 15), r = L.R * (desk ? .76 : .6); const pt = polar(ang, r); return { x: pt.x, y: pt.y, fs: F * .5, rot: ang - L.act, a: has }; }
    case 3: return k < 3
      ? { x: X0 + F * .25 + k * F * .5, y: H * (desk ? .3 : .41), fs: F * .8, rot: 0, a: has }
      : { x: (desk ? X0 + XW : W) - F * .1 - (4 - k) * F * .5, y: H * (desk ? .7 : .55), fs: F * .8, rot: 0, a: has };
    default: return { x: X(.12 + .17 * k), y: H * (desk ? .18 + .14 * k : .37 + .085 * k), fs: F * (.45 + .14 * k), rot: 8 * k, a: has };
  }
}

/* ---------- boot ---------- */
let rzT = 0;
addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(() => { layout(); kick(); }, 60); });
layout();
announce();
kick();
syncRM();
startNudge();
window.__lab = { dial, lay, goState, goLayer };   // test hook
})();
