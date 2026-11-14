(() => {
'use strict';
const $ = (s) => document.querySelector(s);
const NS = 'http://www.w3.org/2000/svg';
const stage = $('#stage'), bg = $('#bg'), itemsEl = $('#items'), info = $('#info'), det = $('#detail');
const rmq = matchMedia('(prefers-reduced-motion: reduce)');
const forced = /[?&]rm=1/.test(location.search);
let RM = rmq.matches || forced;
document.documentElement.classList.toggle('rm', RM);
rmq.addEventListener && rmq.addEventListener('change', () => { RM = rmq.matches || forced; document.documentElement.classList.toggle('rm', RM); if (RM) snapAll(); });

/* eight bodies. figures are rounded public values; the notes are short and invented for the prototype. */
const D = [
  { n: 'Mercury', au: .39, per: '88 d', dist: '0.39 AU', dia: '4,879 km', yr: '0.24', note: 'The shortest year of the eight: 88 Earth days.' },
  { n: 'Venus', au: .72, per: '225 d', dist: '0.72 AU', dia: '12,104 km', yr: '0.62', note: 'A day on Venus is longer than its year.' },
  { n: 'Earth', au: 1, per: '365.25 d', dist: '1.00 AU', dia: '12,742 km', yr: '1.00', note: 'The reference: one year, one orbit, one AU.' },
  { n: 'Mars', au: 1.52, per: '687 d', dist: '1.52 AU', dia: '6,779 km', yr: '1.88', note: 'Its year is nearly twice as long as Earth’s.' },
  { n: 'Jupiter', au: 5.2, per: '11.86 y', dist: '5.20 AU', dia: '139,820 km', yr: '11.86', note: 'About eleven Earths would fit across its diameter.' },
  { n: 'Saturn', au: 9.58, per: '29.45 y', dist: '9.58 AU', dia: '116,460 km', yr: '29.45', note: 'Its rings are thin, but far wider than the planet.' },
  { n: 'Uranus', au: 19.2, per: '84 y', dist: '19.2 AU', dia: '50,724 km', yr: '84.0', note: 'It turns on its side, tilted about 98 degrees.' },
  { n: 'Neptune', au: 30.1, per: '164.8 y', dist: '30.1 AU', dia: '49,244 km', yr: '164.8', note: 'One of its years lasts about 165 Earth years.' }
];
const N = D.length; let GAP = .4;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const pad2 = (n) => String(n).padStart(2, '0');

/* geometry. the arc is a huge circle whose centre is off-screen to the right; the list runs along its left edge. */
const probe = document.createElement('div');
probe.style.cssText = 'position:fixed;left:0;top:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom) 0';
document.body.appendChild(probe);
let W = 0, H = 0, desk = false, R = 0, S0 = 0, apexX = 0, yA = 0, fsA = 0, safeT = 0, safeB = 0, ox = 0, oy = 0, Rm = 0, topLim = 0, botLim = 0;
function measure() {
  W = innerWidth; H = innerHeight; desk = W >= 900 && W > H;
  const cs = getComputedStyle(probe); safeT = parseFloat(cs.paddingTop) || 0; safeB = parseFloat(cs.paddingBottom) || 0;
  topLim = safeT + 40; botLim = H - safeB - 66;
  const avail = botLim - topLim;
  R = (desk ? 1.2 : 1.05) * H;
  S0 = desk ? clamp(avail * .165, 84, 130) : clamp(avail * .165, 84, 124);
  apexX = desk ? W * .06 : W * .07;
  yA = topLim + avail * (desk ? .36 : .33);
  fsA = desk ? clamp(H * .085, 56, 84) : clamp(Math.min(W * .14, avail * .075), 38, 58);
  ox = desk ? W * .74 : W * .9; oy = desk ? H * .52 : H * .62;
  Rm = desk ? H * .44 : Math.min(ox - 48, H * .46);
  const need = fsA * .5 + 8 + 3 * 26 + 22 + 12 + fsA * .22;      // room the active item's data needs before the next item
  GAP = clamp(need / S0 - 1, .4, .9);
}
const eff = (d) => d + GAP * clamp(d, -1, 1);                      // active item gets extra room: neighbours are pushed away
function pos(d) {
  const ang = eff(d) * S0 / R;
  return { x: apexX + R * (1 - Math.cos(ang)), y: yA + R * Math.sin(ang), ang };
}
const sizeAt = (d) => { const a = Math.abs(d); return a <= 1 ? lerp(fsA, fsA * .5, a) : lerp(fsA * .5, fsA * .4, Math.min(1, a - 1)); };
const opAt = (d) => { const a = Math.abs(d); return a <= 1 ? lerp(1, .62, a) : a <= 2 ? lerp(.62, .4, a - 1) : a <= 3 ? lerp(.4, .22, a - 2) : lerp(.22, 0, clamp(a - 3, 0, 1)); };

/* build */
let items = [], rings = [], dRings = [], ringG, arcEl, tickEl, dotEl, spokeEl;
function build() {
  measure();
  bg.replaceChildren(); itemsEl.replaceChildren(); items = []; rings = [];
  bg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  ringG = document.createElementNS(NS, 'g'); bg.appendChild(ringG);
  D.forEach((d) => { const c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', ox); c.setAttribute('cy', oy); c.setAttribute('r', Rm * Math.log(1 + d.au) / Math.log(31.1)); ringG.appendChild(c); rings.push(c); });
  spokeEl = document.createElementNS(NS, 'line'); spokeEl.setAttribute('stroke', '#ff4d1c'); spokeEl.setAttribute('stroke-width', '.8'); bg.appendChild(spokeEl);
  dotEl = document.createElementNS(NS, 'circle'); dotEl.setAttribute('r', 5); dotEl.style.fill = '#ff4d1c'; dotEl.style.stroke = 'none'; bg.appendChild(dotEl);
  arcEl = document.createElementNS(NS, 'circle'); arcEl.setAttribute('cx', apexX + R); arcEl.setAttribute('cy', yA); arcEl.setAttribute('r', R); arcEl.setAttribute('stroke-width', '1'); bg.appendChild(arcEl);
  tickEl = document.createElementNS(NS, 'path'); tickEl.setAttribute('stroke-width', '1'); bg.appendChild(tickEl);
  D.forEach((d, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'item'; b.setAttribute('role', 'listitem');
    b.innerHTML = `<span class="n">${pad2(i + 1)}</span><span class="nm">${d.n}</span>`;
    b.setAttribute('aria-label', `${pad2(i + 1)} ${d.n}`);
    b.onclick = () => { used(); if (i === Math.round(P.t) && Math.abs(P.x - i) < .3) openDetail(); else go(i); };
    itemsEl.appendChild(b); items.push(b);
  });
  const ds = $('#dsvg'); ds.replaceChildren(); ds.setAttribute('viewBox', `0 0 ${W} ${H}`);
  dRings = D.map((d) => { const c = document.createElementNS(NS, 'circle'); const dcx = desk ? W * .74 : W * .8, dcy = desk ? H * .55 : H * .86, dr = desk ? H * .4 : Math.min(W * .72, H * .3); c.setAttribute('cx', dcx); c.setAttribute('cy', dcy); c.setAttribute('r', dr * Math.log(1 + d.au) / Math.log(31.1)); ds.appendChild(c); return c; });
  shown = -1; shownMode = '';
  render();
}

/* two axes: the turn of the arc (0..7) and the opening of the detail (0..1). each is a mass on a spring. */
const mk = (max, k, c) => ({ x: 0, v: 0, t: 0, max, drag: false, k, c });
const P = mk(N - 1, 140, 17), Dd = mk(1, 170, 22);
let running = false, last = 0, interacted = false;
function step(a, dt) {
  if (a.drag) return true;
  if (RM) { const m = a.x !== a.t; a.x = a.t; a.v = 0; return m; }
  a.v += (-a.k * (a.x - a.t) - a.c * a.v) * dt; a.x += a.v * dt;
  if (Math.abs(a.x - a.t) < .0008 && Math.abs(a.v) < .004) { a.x = a.t; a.v = 0; return false; }
  return true;
}
function tick(now) {
  const dt = Math.min(.033, (now - last) / 1000 || .016); last = now;
  const m = step(P, dt) | step(Dd, dt);
  render();
  if (m) requestAnimationFrame(tick); else running = false;
}
const kick = () => { if (!running) { running = true; last = performance.now(); requestAnimationFrame(tick); } };
function snapAll() { P.x = P.t; Dd.x = Dd.t; P.v = Dd.v = 0; kick(); }

let shown = -1, shownMode = '', infoIdx = -1, ox0 = 0, oy0 = 0;
function render() {
  const p = clamp(P.x, -.45, N - 1 + .45), dd = clamp(Dd.x, 0, 1.05);
  const act = clamp(Math.round(p), 0, N - 1);
  /* arc + ticks: every tick uses the same mapping as the items, so the stretch around the active item is visible */
  let t = '';
  for (let u = Math.floor(p - 4.5) * 4; u <= (p + 4.5) * 4; u++) {
    const it = u / 4, d = it - p; if (Math.abs(d) > 4.4) continue;
    const q = pos(d), len = u % 4 === 0 ? 16 : u % 2 === 0 ? 10 : 6;
    t += `M${q.x.toFixed(1)} ${q.y.toFixed(1)}l${(Math.cos(q.ang) * len).toFixed(1)} ${(-Math.sin(q.ang) * len).toFixed(1)}`;
  }
  tickEl.setAttribute('d', t);
  /* items: upright text that travels along the arc; the active one grows, the others shrink and fade */
  let activePos = null;
  items.forEach((b, i) => {
    const d = i - p, q = pos(d), fs = sizeAt(d);
    let op = opAt(d) * clamp((q.y - (topLim + 4)) / 36, 0, 1) * clamp((botLim - 6 - q.y) / 36, 0, 1);
    const h = Math.max(44, fs * 1.15), tx = q.x + 16, wd = Math.max(60, W - tx - 8);
    b.style.transform = `translate3d(${tx.toFixed(1)}px,${(q.y - h / 2).toFixed(1)}px,0)`;
    b.style.height = h + 'px'; b.style.width = wd + 'px';
    b.style.opacity = (op * (1 - clamp(dd * 1.6, 0, 1))).toFixed(2);
    b.style.visibility = op < .03 || dd > .6 ? 'hidden' : 'visible';
    b.firstChild.style.left = '0px'; b.lastChild.style.left = '26px'; b.lastChild.style.fontSize = fs.toFixed(1) + 'px';
    if (i === act) { activePos = { x: tx, y: q.y, fs, d, h }; }
    b.tabIndex = (op >= .03 && dd < .5) ? 0 : -1;
    if (i === act) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
  });
  /* compact data follows the active item and swaps as the arc passes the halfway point */
  if (activePos) {
    if (infoIdx !== act) { infoIdx = act; fillInfo(act); }
    const a = Math.abs(activePos.d), top = activePos.y + activePos.fs * .5 + 8;
    info.style.transform = `translate3d(${(activePos.x + 26).toFixed(1)}px,${top.toFixed(1)}px,0)`;
    info.style.width = Math.max(150, Math.min(W - activePos.x - 34, desk ? 360 : 300)) + 'px';
    info.style.opacity = (clamp(1 - a * 2, 0, 1) * (1 - clamp(dd * 1.8, 0, 1))).toFixed(2);
  }
  /* orbit rings: the ring of the item near the arc's apex is emphasised, a marker slides outward as you turn */
  rings.forEach((c, i) => { const w = Math.max(0, 1 - Math.abs(i - p)); c.setAttribute('stroke-opacity', (.16 + .7 * w).toFixed(2)); c.setAttribute('stroke-width', (.8 + .8 * w).toFixed(2)); });
  const r = (i) => Rm * Math.log(1 + D[clamp(i, 0, N - 1)].au) / Math.log(31.1);
  const i0 = clamp(Math.floor(p), 0, N - 2), f = clamp(p - i0, 0, 1), rr = lerp(r(i0), r(i0 + 1), f), phi = 200 * Math.PI / 180;
  const dx = ox + Math.cos(phi) * rr, dy = oy + Math.sin(phi) * rr;
  dotEl.setAttribute('cx', dx.toFixed(1)); dotEl.setAttribute('cy', dy.toFixed(1));
  spokeEl.setAttribute('x1', ox); spokeEl.setAttribute('y1', oy); spokeEl.setAttribute('x2', dx.toFixed(1)); spokeEl.setAttribute('y2', dy.toFixed(1));
  /* detail: the inside of the instrument opens as a circle that grows from the tapped item */
  const maxR = Math.hypot(W, H) * 1.05;
  det.hidden = dd <= .001;
  det.style.clipPath = `circle(${(dd * maxR).toFixed(1)}px at ${ox0.toFixed(1)}px ${oy0.toFixed(1)}px)`;
  det.querySelector('.dbody').style.opacity = clamp((dd - .5) / .4, 0, 1).toFixed(2);
  det.querySelector('.dsvg').style.opacity = clamp((dd - .5) / .4, 0, 1).toFixed(2);
  det.querySelector('.dnum').style.opacity = clamp((dd - .5) / .4, 0, 1).toFixed(2);
  const bk = $('#back'); bk.style.opacity = clamp((dd - .6) / .3, 0, 1).toFixed(2); bk.style.pointerEvents = dd > .6 ? 'auto' : 'none'; bk.tabIndex = dd > .6 ? 0 : -1;
  det.inert = dd < .6;
  stage.style.setProperty('--ui', dd > .45 ? 'var(--paper)' : 'var(--ink)'); stage.style.setProperty('--uibg', dd > .45 ? 'var(--ink)' : 'var(--paper)');
  if (act !== shown) { shown = act; $('#cnum').textContent = pad2(act + 1); fillDetail(act); }
  const mode = Dd.t ? 'd' : 'i';
  if (mode !== shownMode) { shownMode = mode; setCue(mode); }
}
function fillInfo(i) { const d = D[i]; $('#irows').innerHTML = `<div><dt>Period</dt><dd>${d.per}</dd></div><div><dt>Distance</dt><dd>${d.dist}</dd></div><div><dt>Diameter</dt><dd>${d.dia}</dd></div>`; }
function fillDetail(i) {
  const d = D[i];
  $('#dk').textContent = `${pad2(i + 1)} / 08`; $('#dname').textContent = d.n.toUpperCase(); $('#dnote').textContent = d.note; $('#dnum').textContent = pad2(i + 1);
  dRings.forEach((c, k) => { c.setAttribute('stroke-opacity', k === i ? 1 : .22); c.setAttribute('stroke-width', k === i ? 2.4 : .8); c.style.stroke = k === i ? '#ff4d1c' : ''; });
  $('#drows').innerHTML = [['Orbital period', d.per], ['Distance from the Sun', d.dist], ['Diameter', d.dia], ['Order from the Sun', `${i + 1} of 8`], ['Year in Earth years', d.yr]].map(r => `<div><dt>${r[0]}</dt><dd>${r[1]}</dd></div>`).join('');
}
function setCue(mode) {
  $('#cue').innerHTML = mode === 'd' ? '↑ ↓ next item<br>← back · esc' : '↕ drag the arc<br>tap active to open';
  $('#openl').textContent = mode === 'd' ? 'back' : 'open';
  $('#openp').setAttribute('d', mode === 'd' ? 'M11 2 5 8l6 6' : 'M5 3h8v8M13 3 3 13');
  $('#prev').disabled = P.t === 0; $('#next').disabled = P.t === N - 1;
}

/* actions: each has a button and a key. the detail never traps; back is always visible and Esc works. */
const snap = (a, t) => { a.t = clamp(Math.round(t), 0, a.max); };
let lastMsg = '';
function say() { const m = `${pad2(P.t + 1)} of 08, ${D[P.t].n}. ${Dd.t ? 'Detail open.' : ''}`; if (m !== lastMsg) { lastMsg = m; $('#live').textContent = m; try { if (interacted && navigator.vibrate && !RM) navigator.vibrate(5); } catch (e) {} } shownMode = ''; }
function used() { if (!interacted) { interacted = true; clearTimeout(nudge); } }
function go(k) { snap(P, k); say(); kick(); }
function openDetail() {
  const d = pos(P.t - P.x); ox0 = d.x + 16 + 40; oy0 = d.y;
  snap(Dd, 1); say(); kick();
  setTimeout(() => { if (Dd.t) $('#back').focus({ preventScroll: true }); }, RM ? 0 : 320);
}
function closeDetail() { snap(Dd, 0); say(); kick(); const b = items[P.t]; setTimeout(() => { try { b.focus({ preventScroll: true }); } catch (e) {} }, RM ? 0 : 320); }
$('#prev').onclick = () => { used(); go(P.t - 1); };
$('#next').onclick = () => { used(); go(P.t + 1); };
$('#open').onclick = () => { used(); Dd.t ? closeDetail() : openDetail(); };
$('#back').onclick = () => { used(); closeDetail(); };
const rub = (v, m) => v < 0 ? v * .35 : v > m ? m + (v - m) * .35 : v;

/* gestures: drag along the arc. the pointer is captured only once a drag starts, so taps still reach the items. */
let G = null;
stage.addEventListener('pointerdown', (e) => {
  if (e.target.closest('.bar, .back')) return;
  used();
  G = { id: e.pointerId, x0: e.clientX, y0: e.clientY, lt: e.timeStamp, started: false, bp: P.x, v: 0, moved: 0, dx: 0, dy: 0 };
});
stage.addEventListener('pointermove', (e) => {
  if (!G || e.pointerId !== G.id) return;
  const dx = e.clientX - G.x0, dy = e.clientY - G.y0; G.moved = Math.max(G.moved, Math.abs(dx), Math.abs(dy)); G.dx = dx; G.dy = dy;
  if (Dd.t || Dd.x > .05) return;                      // in detail a swipe right / down just goes back (on release)
  if (!G.started && G.moved > 8) { G.started = true; P.drag = true; stage.classList.add('drag'); try { stage.setPointerCapture(e.pointerId); } catch (_) {} kick(); }
  if (!G.started) return;
  const dt = Math.max(1, e.timeStamp - G.lt) / 1000;
  const along = Math.abs(dy) >= Math.abs(dx) * .6 ? dy : dx * .8;        // vertical is the arc; sideways works too as a fallback
  const nx = rub(G.bp - along / (S0 * 1.15), P.max);
  G.v = clamp(lerp(G.v, (nx - P.x) / dt, .35), -16, 16); P.x = nx; P.v = G.v; G.lt = e.timeStamp;
});
function end(e) {
  if (!G || e.pointerId !== G.id) return;
  const g = G; G = null; stage.classList.remove('drag');
  if (Dd.t) { if (g.moved > 36 && (g.dx > 30 || g.dy > 30)) closeDetail(); return; }
  if (!g.started) return;
  P.drag = false;
  P.v = RM || e.timeStamp - g.lt > 90 ? 0 : g.v;
  const from = Math.round(g.bp);
  snap(P, clamp(Math.round(P.x + P.v * .2), from - 3, from + 3));
  say(); kick();
}
stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
let wt = 0;
stage.addEventListener('wheel', (e) => {
  e.preventDefault(); used();
  if (Dd.t) { if (Math.abs(e.deltaY) + Math.abs(e.deltaX) > 30) { if (e.deltaY > 0) go(P.t + 1); else if (e.deltaY < 0) go(P.t - 1); } return; }
  P.drag = true; P.x = rub(P.x + (Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX) / (S0 * 2.2), P.max); P.v = 0; kick();
  clearTimeout(wt); wt = setTimeout(() => { P.drag = false; snap(P, P.x); say(); kick(); }, 140);
}, { passive: false });
addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key; let ok = true;
  if (k === 'Escape') { if (Dd.t) closeDetail(); else ok = false; }
  else if (k === 'ArrowDown' || k === 'ArrowRight') go(P.t + 1);
  else if (k === 'ArrowUp' || k === 'ArrowLeft') { if (Dd.t && k === 'ArrowLeft') closeDetail(); else go(P.t - 1); }
  else if (k === 'Home') go(0); else if (k === 'End') go(N - 1);
  else if (/^[1-8]$/.test(k)) go(+k - 1);
  else if (k === 'Enter' && !(e.target.closest && e.target.closest('button'))) { Dd.t ? closeDetail() : openDetail(); }
  else ok = false;
  if (ok) { used(); e.preventDefault(); }
});

/* one-time cue: the arc nudges itself so the drag is discoverable (never with reduced motion) */
let nudge = 0;
if (!RM) nudge = setTimeout(() => { if (!interacted) { P.v = 4.5; kick(); } }, 1100);
addEventListener('resize', () => { build(); });
P.t = P.x = 2;                       // start on Earth, the middle of the list
build(); say(); kick();
window.__v6 = { P, Dd, go, openDetail, closeDetail, items: () => items, dims: () => ({ W, H, R, S0, apexX, yA, fsA, topLim, botLim }) };
})();
