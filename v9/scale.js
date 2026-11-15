(() => {
'use strict';
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const root = document.documentElement;
if (/[?&]rm=1/.test(location.search)) root.classList.add('rm');
const RM = () => root.classList.contains('rm') || matchMedia('(prefers-reduced-motion: reduce)').matches;
const INK = '#ece8dd', ACC = '#f2a516';

/* seven steps of the egg, each paired with a business / automation step (illustrative, no results claimed) */
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
const GS = [1, 2, 4, 8, 16];            // side of the egg grid in each column: 1, 4, 16, 64, 256 eggs
const LAG = [0, .6, 1.4, 2.4, 3.6];     // how far the last egg of a batch trails behind when done by hand
let sel = 0, ci = 0, auto = false, interacted = false;
let p = 18, pad = 6, cg = 36;
const cols = [];

/* ---- one egg as a pixel circle. the state is the step it is in ---- */
function egg(c, x, y, R, st) {
  c.lineWidth = 1; c.strokeStyle = INK; c.fillStyle = INK;
  const disc = (yy, r, a) => { c.globalAlpha = a; c.beginPath(); c.arc(x, yy, r, 0, 6.2832); c.fill(); };
  const yolk = (yy, r, a) => { c.globalAlpha = a; c.fillStyle = ACC; c.beginPath(); c.arc(x, yy, r, 0, 6.2832); c.fill(); c.fillStyle = INK; };
  switch (st) {
    case 0: c.globalAlpha = .45; c.beginPath(); c.arc(x, y, R, 0, 6.2832); c.stroke(); break;                 // cold: hollow
    case 1: disc(y, R, .95); break;                                                                               // prep: clean, solid
    case 2: {                                                                                                     // crack: two halves
      c.globalAlpha = .95;
      c.beginPath(); c.arc(x - R * .14, y - R * .22, R, Math.PI * 1.08, Math.PI * 2.0); c.fill();
      c.beginPath(); c.arc(x + R * .12, y + R * .2, R, Math.PI * .08, Math.PI * 1.0); c.fill(); break;
    }
    case 3: disc(y, R, .95); yolk(y, R * .46, 1); break;                                                          // fry: yolk appears
    case 4: disc(y, R * .78, .95); yolk(y, R * .34, 1); c.globalAlpha = .8; c.beginPath(); c.arc(x, y, R * 1.3, 0, 6.2832); c.stroke(); break; // plate: ring
    case 5: disc(y - R * .35, R * .78, .5); yolk(y - R * .35, R * .34, .6); c.globalAlpha = .6; c.beginPath(); c.arc(x, y, R * 1.3, 0, 6.2832); c.stroke(); break; // serve: lifted off
    default: c.globalAlpha = .6; c.setLineDash([2, 2.5]); c.beginPath(); c.arc(x, y, R * 1.15, 0, 6.2832); c.stroke(); c.setLineDash([]); // wash: empty, dashed
  }
  c.globalAlpha = 1;
}
const stateOf = (r, k, n, c) => auto || n < 2 ? r : clamp(Math.round(r - (k / (n - 1)) * LAG[c]), 0, NS - 1);

function drawCol(c) {
  const { g, cv, w } = cols[c], dpr = Math.min(3, devicePixelRatio || 1), ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, w * NS);
  const R = p * .36;
  for (let r = 0; r < NS; r++) {
    const y0 = r * w;
    if (r === sel) { ctx.fillStyle = 'rgba(242,165,22,.12)'; ctx.fillRect(0, y0, w, w); ctx.fillStyle = ACC; ctx.fillRect(0, y0, w, 1); ctx.fillRect(0, y0 + w - 1, w, 1); }
    else { ctx.fillStyle = 'rgba(236,232,221,.16)'; ctx.fillRect(0, y0 + w - 1, w, 1); }
    for (let k = 0; k < g * g; k++) {
      const ix = k % g, iy = (k / g) | 0;
      egg(ctx, pad + (ix + .5) * p, y0 + pad + (iy + .5) * p, R, stateOf(r, k, g * g, c));
    }
  }
}
const drawAll = () => cols.forEach((_, c) => drawCol(c));

/* ---- build ---- */
function build() {
  p = innerWidth < 900 ? 18 : 24; pad = innerWidth < 900 ? 6 : 8; cg = innerWidth < 900 ? 36 : 56;
  root.style.setProperty('--cg', cg + 'px');
  const inner = $('#inner'), labs = $('#labs'); inner.textContent = ''; labs.textContent = ''; cols.length = 0;
  const dpr = Math.min(3, devicePixelRatio || 1);
  GS.forEach((g, c) => {
    const w = g * p + 2 * pad, n = g * g;
    const col = document.createElement('div'); col.className = 'col';
    const cv = document.createElement('canvas'); cv.width = w * dpr; cv.height = w * NS * dpr; cv.style.width = w + 'px'; cv.style.height = w * NS + 'px';
    cv.setAttribute('aria-hidden', 'true'); col.appendChild(cv); inner.appendChild(col);
    const lab = document.createElement('span'); lab.style.width = w + 'px'; lab.textContent = '×' + n; labs.appendChild(lab);
    cols.push({ g, n, w, col, cv, lab });
    attachTap(cv, c);
  });
  drawAll(); onScroll(); text();
}

/* ---- tap a row to choose a step; mouse can drag to pan (touch pans natively) ---- */
const field = $('#field');
function attachTap(cv, c) {
  let d = null;
  cv.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button !== 0) return; d = { x: e.clientX, y: e.clientY, sl: field.scrollLeft, st: field.scrollTop, t: e.timeStamp, mouse: e.pointerType === 'mouse', moved: false, id: e.pointerId }; });
  cv.addEventListener('pointermove', e => {
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.hypot(dx, dy) > 6) d.moved = true;
    if (d.mouse && d.moved) { field.scrollLeft = d.sl - dx; field.scrollTop = d.st - dy; }
  });
  cv.addEventListener('pointerup', e => {
    if (!d || e.pointerId !== d.id) return;
    const dd = d; d = null;
    if (dd.moved || e.timeStamp - dd.t > 500) return;
    const r = cv.getBoundingClientRect(), row = Math.floor((e.clientY - r.top) / cols[c].w);
    if (row >= 0 && row < NS) pick(row, c);
  });
  cv.addEventListener('pointercancel', () => { d = null; });
}
function pick(row, c) { used(); sel = row; drawAll(); text(); }

/* ---- navigation ---- */
function used() { if (!interacted) { interacted = true; $('#cue').classList.add('gone'); } }
const beh = () => RM() ? 'auto' : 'smooth';
function goStep(i) {
  used(); sel = clamp(Math.round(i), 0, NS - 1); drawAll(); text();
  const c = cols[ci], top = c.col.offsetTop + (sel + .5) * c.w - field.clientHeight / 2;
  field.scrollTo({ top: Math.max(0, top), behavior: beh() });
}
function goCol(i) {
  used(); i = clamp(Math.round(i), 0, GS.length - 1);
  const c = cols[i], top = c.col.offsetTop + (sel + .5) * c.w - field.clientHeight / 2;
  field.scrollTo({ left: Math.max(0, c.col.offsetLeft - parseFloat(getComputedStyle(root).getPropertyValue('--g'))), top: Math.max(0, top), behavior: beh() });
  ci = i; text();
}
function setAuto(v) { used(); auto = v; drawAll(); text(); }

function onScroll() {
  const mid = field.scrollLeft + field.clientWidth * .5; let best = 0, bd = 1e9;
  cols.forEach((c, i) => { const d = Math.abs(c.col.offsetLeft + c.w / 2 - mid); if (d < bd) { bd = d; best = i; } });
  // at the far right edge the biggest column is the one in view
  if (field.scrollLeft + field.clientWidth >= field.scrollWidth - 2) best = cols.length - 1;
  if (field.scrollLeft < 2) best = 0;
  if (best !== ci) { ci = best; text(); }
  if (field.scrollLeft > 30 || field.scrollTop > 30) used();
}
field.addEventListener('scroll', onScroll, { passive: true });

/* ---- caption ---- */
const pad2 = n => String(n).padStart(2, '0');
function text() {
  const S = STEPS[sel], n = cols[ci].n;
  $('#n').textContent = pad2(sel + 1); $('#v').textContent = S.v; $('#tag').textContent = S.tag; $('#biz').textContent = S.biz;
  $('#cnt').textContent = `${pad2(sel + 1)} / ${pad2(NS)}`;
  $('#q').textContent = '×' + n;
  cols.forEach((c, i) => c.lab.classList.toggle('on', i === ci));
  $('#scl').textContent = n < 2
    ? '×1: one egg, seven steps. A hand is enough. (Illustration, not data.)'
    : `×${n}: ${n} eggs through 7 steps. ` + (auto ? `Auto: ${NS} rules set once move every egg together.` : `By hand: ${n * NS} touches, and the last eggs trail behind.`) + ' (Illustration, not data.)';
  $('#b-auto').setAttribute('aria-pressed', auto);
  clearTimeout(text.t);
  text.t = setTimeout(() => { $('#live').textContent = `Step ${sel + 1} of ${NS}: ${S.v}, ${S.tag}. Scale ×${n}. ${auto ? 'Auto' : 'By hand'}.`; }, 300);
}

$('#b-up').onclick = () => goStep(sel - 1);
$('#b-down').onclick = () => goStep(sel + 1);
$('#b-left').onclick = () => goCol(ci - 1);
$('#b-right').onclick = () => goCol(ci + 1);
$('#b-auto').onclick = () => setAuto(!auto);
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key;
  if (k === 'ArrowDown') { e.preventDefault(); goStep(sel + 1); }
  else if (k === 'ArrowUp') { e.preventDefault(); goStep(sel - 1); }
  else if (k === 'ArrowRight') { e.preventDefault(); goCol(ci + 1); }
  else if (k === 'ArrowLeft') { e.preventDefault(); goCol(ci - 1); }
  else if (k === 'a' || k === 'A') setAuto(!auto);
  else if (/^[1-7]$/.test(k)) goStep(+k - 1);
  else if (k === 'Home') { e.preventDefault(); goStep(0); }
  else if (k === 'End') { e.preventDefault(); goStep(NS - 1); }
});
let rz = 0; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(build, 120); });

build();
window.__v9 = { goStep, goCol, setAuto, pick, get step() { return sel; }, get col() { return ci; }, get auto() { return auto; }, cols, field };
})();
