(() => {
'use strict';
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (s, a, b) => clamp((s - a) / (b - a), 0, 1);
const ease = t => t * t * (3 - 2 * t);
const root = document.documentElement;
if (/[?&]rm=1/.test(location.search)) root.classList.add('rm');
const RM = () => root.classList.contains('rm') || matchMedia('(prefers-reduced-motion: reduce)').matches;
const NS = 'http://www.w3.org/2000/svg';
const ACC = '#f2a516', INK = '#ece8dd';

/* ---- story: egg step -> business / automation step. Illustrative, no results claimed ---- */
const STEPS = [
  { v: 'COLD STORE', tag: 'INBOX', egg: 'Eggs wait, cold and untouched, until someone needs them.', biz: 'Requests, files and records wait in one place, in one agreed shape.' },
  { v: 'PREP', tag: 'VALIDATE', egg: 'Wipe the shell. Check for cracks before they cost you.', biz: 'Check what came in: missing fields, duplicates, wrong formats.' },
  { v: 'CRACK', tag: 'TRIGGER', egg: 'One clean break and everything starts.', biz: 'A new form, email or order starts the process without being asked.' },
  { v: 'FRY', tag: 'RULES', egg: 'Same heat, same timing, every egg.', biz: 'Route, calculate, approve. Rules written once, applied to every item.' },
  { v: 'PLATE', tag: 'FORMAT', egg: 'Same plate, same shape, every time.', biz: 'Shape the result the way the next person or system expects it.' },
  { v: 'SERVE', tag: 'DELIVER', egg: 'It reaches the table while it still counts.', biz: 'Send it onward: a message, an update, a handover with a receipt.' },
  { v: 'WASH UP', tag: 'LOG + FIX', egg: 'The step nobody photographs. The pan has to be ready again.', biz: 'Record what happened, flag exceptions, archive. Ready for the next batch.' }
];
const NSTEP = STEPS.length, QTY = [1, 3, 6, 12], MAXT = NSTEP * 12;

/* ---- state ---- */
let qi = 1, auto = false, sh = 500, s = 0, k = 0, interacted = false;
const st = { w: 360, h: 300 };
let eggs = [], u = 100, vsc = 82;

/* ---- egg geometry (unit space, origin = egg centre) ---- */
const EGG = 'M0,-.42 C.28,-.42 .34,-.06 .34,.08 C.34,.28 .19,.42 0,.42 C-.19,.42 -.34,.28 -.34,.08 C-.34,-.06 -.28,-.42 0,-.42Z';
const ZZ = [[.23, 0], [.12, .08], [0, 0], [-.12, .08], [-.23, 0]];
const zz = (rev) => (rev ? ZZ.slice().reverse() : ZZ).map(p => `L${p[0]},${p[1]}`).join('');
const TOP = `M-.34,.04 C-.34,-.12 -.28,-.42 0,-.42 C.28,-.42 .34,-.12 .34,.04 ${zz(false)} L-.34,.04Z`;
const BOT = `M.34,.04 C.34,.28 .19,.42 0,.42 C-.19,.42 -.34,.28 -.34,.04 ${zz(true)} L.34,.04Z`;
const BLOB = (() => { const r = [1, .86, .98, .8, 1, .88, .96, .84]; return r.map((k, i) => { const a = Math.PI * 2 * i / r.length; return [Math.cos(a) * .36 * k, Math.sin(a) * .3 * k]; }); })();
const blobPath = (() => { const P = BLOB, n = P.length; let d = `M${(P[0][0] + P[n - 1][0]) / 2},${(P[0][1] + P[n - 1][1]) / 2}`; for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n]; d += ` Q${a[0]},${a[1]} ${(a[0] + b[0]) / 2},${(a[1] + b[1]) / 2}`; } return d + 'Z'; })();
const PLATE_R = .46, PLATE_C = 2 * Math.PI * PLATE_R;

function el(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k2 in attrs) e.setAttribute(k2, attrs[k2]); if (parent) parent.appendChild(e); return e; }

/* ---- layout: pick the column count that makes the eggs largest ---- */
function layout() {
  const svg = $('#svg'); svg.textContent = '';
  const N = QTY[qi], padT = 18, padB = 22, W = st.w, H = Math.max(80, st.h - padT - padB);
  let best = null;
  for (let c = 1; c <= N; c++) { const r = Math.ceil(N / c), uu = Math.min(W / c, H / r); if (!best || uu > best.u + 0.5) best = { c, r, u: uu }; }
  u = Math.min(best.u, 190); vsc = u * 0.8;
  const gw = best.c * u, gh = best.r * u, x0 = (W - gw) / 2, y0 = padT + (H - gh) / 2;
  svg.setAttribute('viewBox', `0 0 ${W} ${st.h}`);
  eggs = [];
  const auto0 = el('g', { class: 'autoL' }, svg);
  const line = el('path', { d: `M${x0 + 4},${padT - 8} H${x0 + gw - 4}`, stroke: ACC, 'stroke-width': 1.2, fill: 'none' }, auto0);
  el('circle', { cx: x0 + 4, cy: padT - 8, r: 4, fill: ACC }, auto0);
  for (let i = 0; i < N; i++) {
    const r = Math.floor(i / best.c), inRow = r === best.r - 1 ? N - r * best.c : best.c;
    const col = i - r * best.c, cx = (W - inRow * u) / 2 + (col + .5) * u, cy = y0 + (r + .5) * u;
    if (r === 0) el('path', { d: `M${cx},${padT - 8} v6`, stroke: ACC, 'stroke-width': 1.2, fill: 'none' }, auto0);
    const dot = el('circle', { cx, cy: cy - u / 2 + 7, r: 3.6, 'stroke-width': 1.2, stroke: ACC, fill: 'none', class: 'dot' }, svg);
    const g = el('g', { transform: `translate(${cx} ${cy}) scale(${vsc})`, stroke: INK, 'stroke-width': 1.2 / vsc, fill: 'none', 'stroke-linejoin': 'round' }, svg);
    const e = { g, dot, lag: 0 };
    e.frost = el('circle', { r: .5, 'stroke-dasharray': `${.01} ${.07}`, 'stroke-linecap': 'round', 'stroke-width': 2.4 / vsc }, g);
    e.plate = el('circle', { r: PLATE_R, 'stroke-dasharray': PLATE_C, 'stroke-dashoffset': PLATE_C, transform: 'rotate(-90)' }, g);
    e.smear = el('circle', { r: .26, 'stroke-dasharray': `${.06} ${.12}`, 'stroke-linecap': 'round', 'stroke-width': 2.4 / vsc, opacity: 0 }, g);
    e.heat = el('g', { opacity: 0 }, g);
    [-.18, 0, .18].forEach(x => el('path', { d: `M${x - .05},.5 q.025,-.06 .05,0 t.05,0`, 'stroke-width': 1 / vsc }, e.heat));
    e.cont = el('g', {}, g);
    e.white = el('path', { d: blobPath, fill: INK, stroke: 'none', opacity: 0 }, e.cont);
    e.yolk = el('circle', { r: .12, fill: ACC, stroke: 'none', opacity: 0 }, e.cont);
    e.whole = el('path', { d: EGG, fill: INK, 'fill-opacity': .08 }, g);
    e.top = el('path', { d: TOP, fill: INK, 'fill-opacity': .92, opacity: 0 }, g);
    e.bot = el('path', { d: BOT, fill: INK, 'fill-opacity': .92, opacity: 0 }, g);
    e.ping = el('circle', { r: .3, stroke: ACC, opacity: 0 }, g);
    e.tick = el('path', { d: 'M-.1,.02 L-.02,.1 L.12,-.08', stroke: ACC, opacity: 0, 'stroke-width': 1.6 / vsc }, g);
    eggs.push(e);
  }
  eggs.forEach((e, i) => { e.i = i; });
  paint();
}

/* ---- draw every egg for scroll position s ---- */
function eggAt(e, si) {
  const A = (n, a, v) => n.setAttribute(a, v);
  A(e.frost, 'opacity', (1 - ease(seg(si, .5, 1.2))) * .9);
  A(e.whole, 'fill-opacity', lerp(.08, .92, ease(seg(si, .5, 1.3))));
  const wh = 1 - seg(si, 1.85, 2.0), hv = seg(si, 1.85, 2.0) * (1 - seg(si, 2.7, 3.0));
  A(e.whole, 'opacity', wh);
  A(e.top, 'opacity', hv); A(e.bot, 'opacity', hv);
  const sp = ease(seg(si, 2.0, 2.8));
  A(e.top, 'transform', `translate(${-.1 * sp} ${-.12 * sp}) rotate(${-26 * sp})`);
  A(e.bot, 'transform', `translate(${.07 * sp} ${.08 * sp}) rotate(${14 * sp})`);
  const yy = lerp(-.12, .04, ease(seg(si, 2.0, 2.6)));
  A(e.yolk, 'cy', yy); A(e.yolk, 'opacity', seg(si, 2.0, 2.3));
  const ws = lerp(.2, 1, ease(seg(si, 2.3, 3.2)));
  A(e.white, 'transform', `scale(${ws})`); A(e.white, 'opacity', seg(si, 2.3, 2.6));
  const heat = Math.min(seg(si, 2.5, 2.9), 1 - seg(si, 3.5, 3.9));
  A(e.heat, 'opacity', heat * .8);
  A(e.plate, 'stroke-dashoffset', PLATE_C * (1 - ease(seg(si, 3.3, 4.0))));
  const lift = ease(seg(si, 4.8, 5.5)), cs = lerp(1, .78, ease(seg(si, 3.4, 4.0))) * (1 - .35 * lift);
  A(e.cont, 'transform', `translate(0 ${-.25 * lift}) scale(${cs})`);
  A(e.cont, 'opacity', 1 - ease(seg(si, 5.2, 5.6)));
  const pg = seg(si, 5.0, 5.8);
  A(e.ping, 'r', lerp(.3, .5, pg)); A(e.ping, 'opacity', Math.sin(Math.PI * pg) * .9);
  A(e.smear, 'opacity', seg(si, 5.0, 5.5) * (1 - seg(si, 5.8, 6.0)) * .8);
  A(e.smear, 'transform', `rotate(${si * 120})`);
  A(e.tick, 'opacity', seg(si, 5.8, 6.0));
}
function paint() {
  const N = eggs.length, rm = RM();
  const se = rm ? Math.round(s) : s;
  const lag = auto || rm ? 0 : Math.min(.3, 1.5 / Math.max(1, N - 1));
  const kk = clamp(Math.round(se), 0, NSTEP - 1);
  eggs.forEach((e, i) => {
    const si = clamp(se - lag * i, 0, NSTEP - 1);
    eggAt(e, si);
    const done = si >= kk - .02;
    e.dot.setAttribute('fill', done ? ACC : 'none');
    e.dot.style.display = auto ? 'none' : '';
  });
  const al = $('#svg .autoL'); if (al) al.style.display = auto ? '' : 'none';
  if (kk !== k) { k = kk; text(true); }
}

/* ---- text panel ---- */
function pad(n) { return String(n).padStart(2, '0'); }
function text(anim) {
  const S = STEPS[k], N = QTY[qi];
  $('#n').textContent = pad(k + 1); $('#v').textContent = S.v; $('#tag').textContent = S.tag;
  $('#egg').textContent = S.egg; $('#biz').textContent = S.biz;
  $('#cnt').textContent = `${pad(k + 1)} / ${pad(NSTEP)}`;
  const touches = auto ? k + 1 : N * (k + 1);
  $('#tcl').textContent = auto ? 'SET-UP TOUCHES, ONCE FOR ALL EGGS' : `HAND TOUCHES, ${k + 1} STEPS × ${N} EGG${N > 1 ? 'S' : ''}`;
  $('#tcn').textContent = touches;
  $('#tcb').style.width = (touches / MAXT * 100) + '%';
  $('#q').textContent = '×' + N;
  $('#b-auto').setAttribute('aria-pressed', auto);
  if (anim && !RM()) { const p = $('.panel'); p.classList.remove('sw'); void p.offsetWidth; p.classList.add('sw'); }
  clearTimeout(text.t);
  text.t = setTimeout(() => { $('#live').textContent = `Step ${k + 1} of ${NSTEP}: ${S.v}. Automation: ${S.tag}. ${auto ? 'Auto on' : 'Manual'}, ${N} egg${N > 1 ? 's' : ''}, ${touches} touches.`; }, 300);
}

/* ---- scroll plumbing ---- */
function measure() {
  sh = Math.max(240, Math.round(innerHeight * .7));
  $('#track').style.height = (sh * (NSTEP - 1) + innerHeight) + 'px';
  document.querySelectorAll('.snap').forEach(n => n.remove());
  for (let i = 0; i < NSTEP; i++) { const d = document.createElement('i'); d.className = 'snap'; d.style.top = (i * sh) + 'px'; $('#track').appendChild(d); }
  const r = $('#stage').getBoundingClientRect(); st.w = Math.max(120, r.width); st.h = Math.max(120, r.height);
  s = clamp(scrollY / sh, 0, NSTEP - 1);
  layout();
}
let ticking = false;
addEventListener('scroll', () => {
  if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; s = clamp(scrollY / sh, 0, NSTEP - 1); if (scrollY > 24) used(); paint(); }); }
}, { passive: true });
function used() { if (!interacted) { interacted = true; $('#cue').classList.add('gone'); } }
function goStep(i) {
  used(); i = clamp(Math.round(i), 0, NSTEP - 1);
  scrollTo({ top: i * sh, behavior: RM() ? 'auto' : 'smooth' });
}
function setQty(n) { used(); qi = clamp(n, 0, QTY.length - 1); layout(); text(false); }
function setAuto(v) { used(); auto = v; paint(); text(false); }

$('#b-prev').onclick = () => goStep(k - 1);
$('#b-next').onclick = () => goStep(k + 1);
$('#b-less').onclick = () => setQty(qi - 1);
$('#b-more').onclick = () => setQty(qi + 1);
$('#b-auto').onclick = () => setAuto(!auto);

/* horizontal swipe on the stage = more / fewer eggs (vertical stays native scroll) */
let g = null;
const stage = $('#stage');
stage.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button !== 0) return; g = { id: e.pointerId, x: e.clientX, y: e.clientY, done: false }; });
stage.addEventListener('pointermove', e => {
  if (!g || g.id !== e.pointerId || g.done) return;
  const dx = e.clientX - g.x, dy = e.clientY - g.y;
  if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.6) { g.done = true; setQty(qi + (dx < 0 ? 1 : -1)); }
});
const endG = () => { g = null; };
stage.addEventListener('pointerup', endG); stage.addEventListener('pointercancel', endG);

document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const kk = e.key, onBtn = e.target.closest && e.target.closest('button');
  if (kk === 'ArrowDown' || kk === 'PageDown') { e.preventDefault(); goStep(k + 1); }
  else if (kk === 'ArrowUp' || kk === 'PageUp') { e.preventDefault(); goStep(k - 1); }
  else if (kk === 'ArrowRight') { e.preventDefault(); setQty(qi + 1); }
  else if (kk === 'ArrowLeft') { e.preventDefault(); setQty(qi - 1); }
  else if (kk === 'a' || kk === 'A') { setAuto(!auto); }
  else if (/^[1-7]$/.test(kk)) { goStep(+kk - 1); }
  else if (kk === 'Home') { e.preventDefault(); goStep(0); }
  else if (kk === 'End') { e.preventDefault(); goStep(NSTEP - 1); }
  else if (kk === ' ' && !onBtn) { e.preventDefault(); goStep(k + (e.shiftKey ? -1 : 1)); }
});

let rz = 0;
addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(measure, 80); });
if (window.ResizeObserver) new ResizeObserver(() => { const r = stage.getBoundingClientRect(); if (Math.abs(r.width - st.w) > 1 || Math.abs(r.height - st.h) > 1) { clearTimeout(rz); rz = setTimeout(measure, 40); } }).observe(stage);

measure(); k = -1; paint(); text(false);

window.__v8 = { refresh() { s = clamp(scrollY / sh, 0, NSTEP - 1); paint(); }, goStep, setQty, setAuto, get s() { return s; }, get step() { return k; }, get qty() { return QTY[qi]; }, get auto() { return auto; }, get sh() { return sh; }, st, get u() { return u; } };
})();
