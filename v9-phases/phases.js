(() => {
'use strict';
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const root = document.documentElement;
if (/[?&]rm=1/.test(location.search)) root.classList.add('rm');
const RM = () => root.classList.contains('rm') || matchMedia('(prefers-reduced-motion: reduce)').matches;
const INK = '#ece8dd', ACC = '#f2a516';

/* seven phases of the egg, each paired with a business / automation step (illustrative, no results claimed) */
const STEPS = [
  { v: 'COLD STORE', tag: 'INBOX', biz: 'Requests, files and records wait in one place, in one agreed shape.' },
  { v: 'PREP', tag: 'VALIDATE', biz: 'Check what came in: missing fields, duplicates, wrong formats.' },
  { v: 'CRACK', tag: 'TRIGGER', biz: 'A new form, email or order starts the process without being asked.' },
  { v: 'FRY', tag: 'RULES', biz: 'Route, calculate, approve. Rules written once, applied to every item.' },
  { v: 'PLATE', tag: 'FORMAT', biz: 'Shape the result the way the next person or system expects it.' },
  { v: 'SERVE', tag: 'DELIVER', biz: 'Send it onward: a message, an update, a handover with a receipt.' },
  { v: 'WASH UP', tag: 'LOG + FIX', biz: 'Record what happened, flag exceptions, archive. Ready for the next batch.' }
];
const NS = STEPS.length;
const GS = [1, 2, 4, 8, 16];           // egg grid side per scale: 1, 4, 16, 64, 256 eggs
const LAG = [0, .6, 1.4, 2.4, 3.6];    // how far the last egg trails behind when it is done by hand
let cur = 0, auto = false, interacted = false;
const pages = [];

/* ---- one egg as a pixel circle; the state is the phase it is in ---- */
function egg(c, x, y, R, st) {
  c.lineWidth = 1; c.strokeStyle = INK; c.fillStyle = INK;
  const arc = (xx, yy, r, a0, a1, fill) => { c.beginPath(); c.arc(xx, yy, r, a0, a1); fill ? c.fill() : c.stroke(); };
  const disc = (yy, r, a) => { c.globalAlpha = a; arc(x, yy, r, 0, 6.2832, true); };
  const yolk = (yy, r, a) => { c.globalAlpha = a; c.fillStyle = ACC; arc(x, yy, r, 0, 6.2832, true); c.fillStyle = INK; };
  switch (st) {
    case 0: c.globalAlpha = .45; arc(x, y, R, 0, 6.2832); break;
    case 1: disc(y, R, .95); break;
    case 2: c.globalAlpha = .95; arc(x - R * .14, y - R * .22, R, Math.PI * 1.08, Math.PI * 2, true); arc(x + R * .12, y + R * .2, R, Math.PI * .08, Math.PI, true); break;
    case 3: disc(y, R, .95); yolk(y, R * .46, 1); break;
    case 4: disc(y, R * .78, .95); yolk(y, R * .34, 1); c.globalAlpha = .8; arc(x, y, R * 1.3, 0, 6.2832); break;
    case 5: disc(y - R * .35, R * .78, .5); yolk(y - R * .35, R * .34, .6); c.globalAlpha = .6; arc(x, y, R * 1.3, 0, 6.2832); break;
    default: c.globalAlpha = .6; c.setLineDash([2, 2.5]); arc(x, y, R * 1.15, 0, 6.2832); c.setLineDash([]);
  }
  c.globalAlpha = 1;
}
const stateOf = (r, k, n, ci) => auto || n < 2 ? r : clamp(Math.round(r - (k / (n - 1)) * LAG[ci]), 0, NS - 1);

/* ---- layout of the five scales on one page. 'stack' (tall stages): the four small scales sit in a row,
        growing left to right, above the biggest. 'row' (wide stages): all five in one growing row. ---- */
function plan(w, h) {
  const LH = 14, gv = 12;
  // stack
  let p1 = Math.min(w / 16, (h - 2 * LH - gv) / 24), g1 = p1 / 3;
  // row
  const gr = 12; let p2 = Math.min((w - 4 * gr) / 31, (h - LH) / 16);
  if (p1 >= p2) {
    const big = 16 * p1, y1 = LH + 8 * p1 + gv + LH;           // top of the biggest
    const rects = []; let x = (w - 16 * p1) / 2; const rowBottom = LH + 8 * p1;
    [0, 1, 2, 3].forEach(i => { const s = GS[i] * p1; rects.push({ i, x, y: rowBottom - s, s, p: p1, ly: rowBottom - s - 4 }); x += s + g1; });
    rects.push({ i: 4, x: (w - big) / 2, y: y1, s: big, p: p1, ly: y1 - 4 });
    return { mode: 'stack', p: p1, rects, used: y1 + big };
  }
  const total = 31 * p2 + 4 * gr, rowBottom = LH + 16 * p2, rects = []; let x = (w - total) / 2;
  GS.forEach((g, i) => { const s = g * p2; rects.push({ i, x, y: rowBottom - s, s, p: p2, ly: rowBottom - s - 4 }); x += s + gr; });
  return { mode: 'row', p: p2, rects, used: rowBottom };
}

function drawPage(pg) {
  const { cv, stage, r } = pg;
  cv.style.width = '0px'; cv.style.height = '0px';
  const w = Math.floor(stage.clientWidth), h = Math.floor(stage.clientHeight);
  if (w < 20 || h < 20) return;
  const dpr = Math.min(3, devicePixelRatio || 1);
  cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + 'px'; cv.style.height = h + 'px';
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
  const L = plan(w, h), dy = Math.max(0, (h - L.used) / 2); pg.lay = L; pg.dy = dy; pg.size = { w, h };
  c.font = '10px ui-monospace, Menlo, monospace'; c.textBaseline = 'alphabetic';
  L.rects.forEach(R => {
    const y0 = R.y + dy, n = GS[R.i] ** 2, g = GS[R.i];
    c.strokeStyle = 'rgba(236,232,221,.22)'; c.lineWidth = 1; c.strokeRect(R.x + .5, y0 + .5, R.s - 1, R.s - 1);
    c.fillStyle = 'rgba(236,232,221,.6)'; c.fillText('×' + n, R.x, R.ly + dy);
    for (let k = 0; k < n; k++) egg(c, R.x + ((k % g) + .5) * R.p, y0 + (((k / g) | 0) + .5) * R.p, R.p * .36, stateOf(r, k, n, R.i));
  });
}

/* ---- build the seven pages ---- */
const pad2 = n => String(n).padStart(2, '0');
function build() {
  const host = $('#pages'); host.textContent = ''; pages.length = 0; $('#rail').textContent = '';
  STEPS.forEach((S, r) => {
    const sec = document.createElement('section'); sec.className = 'page'; sec.setAttribute('aria-label', `Phase ${r + 1} of ${NS}: ${S.v}`);
    sec.innerHTML = `<div class="head"><span class="n">${pad2(r + 1)}</span><h2 class="v">${S.v}</h2><span class="tag">${S.tag}</span></div>` +
      `<div class="stage"><canvas aria-hidden="true"></canvas></div><div class="cap"><p class="biz">${S.biz}</p><p class="scl"></p></div>`;
    host.appendChild(sec);
    pages.push({ sec, r, stage: sec.querySelector('.stage'), cv: sec.querySelector('canvas'), scl: sec.querySelector('.scl') });
    if (window.ResizeObserver) { const pgx = pages[pages.length - 1]; new ResizeObserver(() => drawPage(pgx)).observe(pgx.stage); }
    const li = document.createElement('li'); $('#rail').appendChild(li);
  });
  layoutAll(); sclText(); sync(true);
}
function layoutAll() { pages.forEach(drawPage); }
function sclText() {
  pages.forEach(pg => {
    pg.scl.textContent = auto ? 'Auto: one rule for this phase covers every egg, at any scale. (Illustration, not data.)'
      : 'By hand: one touch per egg, so ×256 means 256 touches in this phase alone, and the last eggs trail behind. (Illustration, not data.)';
  });
}

/* ---- navigation: native vertical scroll-snap; one phase per page ---- */
const pagesEl = $('#pages');
const beh = () => RM() ? 'auto' : 'smooth';
function used() { if (!interacted) { interacted = true; $('#ph').classList.remove('cuetxt'); $('#ph').textContent = `${STEPS[cur].v} · ${STEPS[cur].tag}`; } }
function goPhase(i) {
  used(); i = clamp(Math.round(i), 0, NS - 1);
  pagesEl.scrollTo({ top: i * pagesEl.clientHeight, behavior: beh() });
  sync(false, i);
}
function sync(force, to) {
  const h = pagesEl.clientHeight || 1, i = to !== undefined ? to : clamp(Math.round(pagesEl.scrollTop / h), 0, NS - 1);
  if (i === cur && !force) return;
  cur = i;
  $('#cnt').textContent = `${pad2(i + 1)} / ${pad2(NS)}`;
  if (interacted) $('#ph').textContent = `${STEPS[i].v} · ${STEPS[i].tag}`;
  [...$('#rail').children].forEach((li, k) => li.classList.toggle('on', k === i));
  $('#b-up').disabled = i === 0; $('#b-down').disabled = i === NS - 1;
  clearTimeout(sync.t);
  sync.t = setTimeout(() => { $('#live').textContent = `Phase ${i + 1} of ${NS}: ${STEPS[i].v}, ${STEPS[i].tag}. ${auto ? 'Auto' : 'By hand'}.`; }, 300);
}
pagesEl.addEventListener('scroll', () => { sync(false); if (pagesEl.scrollTop > 20) used(); }, { passive: true });
function setAuto(v) { used(); auto = v; $('#b-auto').setAttribute('aria-pressed', auto); layoutAll(); sclText(); sync(true); }

$('#b-up').onclick = () => goPhase(cur - 1);
$('#b-down').onclick = () => goPhase(cur + 1);
$('#b-auto').onclick = () => setAuto(!auto);
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key;
  if (k === 'ArrowDown' || k === 'PageDown') { e.preventDefault(); goPhase(cur + 1); }
  else if (k === 'ArrowUp' || k === 'PageUp') { e.preventDefault(); goPhase(cur - 1); }
  else if (k === 'a' || k === 'A') setAuto(!auto);
  else if (/^[1-7]$/.test(k)) goPhase(+k - 1);
  else if (k === 'Home') { e.preventDefault(); goPhase(0); }
  else if (k === 'End') { e.preventDefault(); goPhase(NS - 1); }
});
/* mouse: drag up/down to change phase (touch uses native scrolling with snap) */
let md = null;
pagesEl.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button === 0) md = { y: e.clientY, x: e.clientX, id: e.pointerId, done: false }; });
pagesEl.addEventListener('pointermove', e => {
  if (!md || e.pointerId !== md.id || md.done) return;
  const dy = e.clientY - md.y, dx = e.clientX - md.x;
  if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx) * 1.3) { md.done = true; goPhase(cur + (dy < 0 ? 1 : -1)); }
});
addEventListener('pointerup', () => { md = null; });
let rz = 0;
const redo = () => { clearTimeout(rz); rz = setTimeout(() => { const t = cur * pagesEl.clientHeight; layoutAll(); pagesEl.scrollTo({ top: t, behavior: 'auto' }); sync(true); }, 100); };
addEventListener('resize', redo);
if (window.ResizeObserver) new ResizeObserver(() => redo()).observe($('#pages'));

build();
if (!interacted) { $('#ph').classList.add('cuetxt'); $('#ph').textContent = '↑ swipe up · next phase'; }
window.__v9p = { goPhase, setAuto, get phase() { return cur; }, get auto() { return auto; }, pages, pagesEl };
})();
