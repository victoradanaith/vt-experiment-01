(() => {
'use strict';
const $ = (s) => document.querySelector(s);
const stage = $('#stage'), bgs = $('#bgs'), tex = $('#tex');
const w1 = $('#w1'), w2 = $('#w2'), det = $('#detail');
const rmq = matchMedia('(prefers-reduced-motion: reduce)');
let RM = rmq.matches || /[?&]rm=1/.test(location.search);
document.documentElement.classList.toggle('rm', RM);
rmq.addEventListener && rmq.addEventListener('change', () => { RM = rmq.matches || /[?&]rm=1/.test(location.search); document.documentElement.classList.toggle('rm', RM); });

const D = [
  { n: 'Light', c1: '#ffe9a8', c2: '#ff8a3d', a: 160, ink: '#17120a', tag: 'Fast, straight, and easily bent.', body: 'Light travels in straight lines until something changes its path: glass, water, a surface.', f: [['Speed', '299,792 km/s'], ['Visible band', '380–750 nm'], ['Sun to Earth', '≈ 8 min 20 s']] },
  { n: 'Sound', c1: '#7d92ff', c2: '#1d2bd4', a: 200, ink: '#f4f5ff', tag: 'A pressure wave that needs a medium.', body: 'Sound is vibration passed from molecule to molecule. With no air, water or solid to carry it, there is nothing to hear.', f: [['In air, 20 °C', '343 m/s'], ['Human hearing', '20 Hz – 20 kHz'], ['In a vacuum', 'silence']] },
  { n: 'Water', c1: '#e2f6f1', c2: '#38b2a2', a: 120, ink: '#052019', tag: 'Common, odd, and essential.', body: 'Water is densest at about 4 °C, so ice floats and lakes freeze from the top down.', f: [['Earth’s surface', '≈ 71 %'], ['Freezes', '0 °C'], ['Boils, sea level', '100 °C']] },
  { n: 'Stone', c1: '#ece8df', c2: '#8a8478', a: 230, ink: '#141414', tag: 'Slow time, made solid.', body: 'Rock records how it formed: cooled from magma, pressed from sediment, or changed by heat and pressure.', f: [['Hardest (Mohs)', 'diamond, 10'], ['Softest (Mohs)', 'talc, 1'], ['Three families', 'ign · sed · meta']] },
  { n: 'Wind', c1: '#ffd9e4', c2: '#c43a6c', a: 180, ink: '#2a0714', tag: 'Air on the move.', body: 'Wind comes from differences in air pressure, and is named for the direction it blows from.', f: [['Beaufort scale', '0 – 12'], ['Hurricane force', 'from 118 km/h'], ['A westerly', 'blows from the west']] }
];
const N = D.length;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const hex = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => 'rgb(' + hex(a).map((v, i) => Math.round(lerp(v, hex(b)[i], t))).join(',') + ')';
const ease = (f) => (f <= 0 || f >= 1) ? f : f * f * (3 - 2 * f);

/* backgrounds: one gradient layer per category, cross-faded (opacity only: cheap) */
const layers = D.map((d) => { const e = document.createElement('div'); e.style.background = 'linear-gradient(' + d.a + 'deg,' + d.c1 + ',' + d.c2 + ')'; bgs.appendChild(e); return e; });

/* texture: random shapes per category, revealed one by one as you go deeper */
const NS = 'http://www.w3.org/2000/svg';
const rnd = (a, b) => a + Math.random() * (b - a);
const groups = D.map(() => {
  const g = document.createElementNS(NS, 'g'); g.style.opacity = 0; tex.appendChild(g);
  const items = [];
  for (let k = 0; k < 34; k++) {
    const t = Math.floor(Math.random() * 6), x = rnd(0, 1000), y = rnd(0, 1000), s = rnd(14, 90), e = document.createElementNS(NS, t === 0 ? 'circle' : t === 1 ? 'circle' : t === 2 ? 'polygon' : t === 3 ? 'rect' : t === 4 ? 'path' : 'line');
    if (t === 0) { e.setAttribute('cx', x); e.setAttribute('cy', y); e.setAttribute('r', s / 2); e.setAttribute('class', 'f'); }
    else if (t === 1) { e.setAttribute('cx', x); e.setAttribute('cy', y); e.setAttribute('r', s); }
    else if (t === 2) e.setAttribute('points', x + ',' + (y - s) + ' ' + (x + s) + ',' + (y + s) + ' ' + (x - s) + ',' + (y + s));
    else if (t === 3) { e.setAttribute('x', x); e.setAttribute('y', y); e.setAttribute('width', s); e.setAttribute('height', s); e.setAttribute('transform', 'rotate(' + rnd(0, 90).toFixed(0) + ' ' + x + ' ' + y + ')'); }
    else if (t === 4) e.setAttribute('d', 'M' + (x - s / 2) + ' ' + y + 'h' + s + 'M' + x + ' ' + (y - s / 2) + 'v' + s);
    else { e.setAttribute('x1', x); e.setAttribute('y1', y); e.setAttribute('x2', x + rnd(-160, 160)); e.setAttribute('y2', y + rnd(-160, 160)); }
    g.appendChild(e); items.push({ e, th: Math.random() * .75, last: -1 });
  }
  return { g, items };
});

/* layout */
let W = 0, H = 0, desk = false, F = 0;
function size() {
  W = innerWidth; H = innerHeight; desk = W >= 900 && W > H;
  F = desk ? H * .26 : Math.min(W * .34, H * .17);
  [w1, w2].forEach(w => w.style.fontSize = F + 'px');
  const pad = desk ? 40 : 20;
  det.style.top = desk ? (H * .3) + 'px' : (H * .3) + 'px';
  det.style.bottom = 'auto';
  document.documentElement.style.setProperty('--pad', pad + 'px');
}

/* physics: two axes, each a mass on a spring */
const mk = (max) => ({ x: 0, v: 0, t: 0, max, drag: false });
const cat = mk(N - 1), dep = mk(1);
const K = 140, C = 17;
let running = false, last = 0;
function step(a, dt) {
  if (a.drag) return true;
  if (RM) { const m = a.x !== a.t; a.x = a.t; a.v = 0; return m; }
  a.v += (-K * (a.x - a.t) - C * a.v) * dt; a.x += a.v * dt;
  if (Math.abs(a.x - a.t) < .0008 && Math.abs(a.v) < .004) { a.x = a.t; a.v = 0; return false; }
  return true;
}
function tick(now) {
  const dt = Math.min(.033, (now - last) / 1000 || .016); last = now;
  const m = step(cat, dt) | step(dep, dt);
  render();
  if (m) requestAnimationFrame(tick); else running = false;
}
const kick = () => { if (!running) { running = true; last = performance.now(); requestAnimationFrame(tick); } };

let shownCat = -1, shownDet = -1, lastDepth = -1;
function render() {
  const p = clamp(cat.x, -.3, N - 1 + .3), v = clamp(dep.x, -.15, 1.1), dv = clamp(v, 0, 1);
  const i = clamp(Math.floor(p), 0, N - 2), f = p - i, e = ease(f), ee = clamp(e, 0, 1);
  const A = D[i], B = D[i + 1];
  /* gradient layers + ink */
  layers.forEach((l, k) => { l.style.opacity = clamp(1 - Math.abs(p - k), 0, 1).toFixed(3); });
  stage.style.color = mix(A.ink, B.ink, ee);
  document.body.style.background = mix(A.c1, B.c1, ee);
  /* the big word slides with the swipe */
  const slide = W * 1.15, fs = clamp(f, 0, 1);
  const sc = lerp(1, desk ? .55 : .5, dv), y = lerp(desk ? H * .34 : H * .3, desk ? H * .1 : H * .09, dv);
  const cur = D[Math.round(clamp(p, 0, N - 1))];
  w1.textContent = A.n; w2.textContent = B.n;
  w1.style.transform = 'translate3d(' + (-fs * slide).toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) scale(' + sc.toFixed(3) + ')';
  w2.style.transform = 'translate3d(' + ((1 - fs) * slide).toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) scale(' + sc.toFixed(3) + ')';
  w1.style.opacity = (1 - fs * .8).toFixed(2); w2.style.opacity = (.2 + fs * .8).toFixed(2);
  if (f < 0) { w2.style.opacity = 0; w1.style.opacity = 1; w1.style.transform = 'translate3d(' + (-f * slide * -1).toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) scale(' + sc.toFixed(3) + ')'; }
  /* texture appears gradually with depth */
  groups.forEach((g, k) => {
    const wgt = clamp(1 - Math.abs(p - k), 0, 1);
    g.g.style.opacity = wgt.toFixed(3);
    if (wgt > 0 && Math.abs(dv - lastDepth) > .002 || (wgt > 0 && lastDepth < 0)) g.items.forEach((it) => { const o = clamp((dv - it.th) / .22, 0, 1) * .4; const q = Math.round(o * 40); if (q !== it.last) { it.last = q; it.e.style.opacity = (q / 40).toFixed(3); } });
  });
  lastDepth = dv;
  /* detail text */
  const idx = Math.round(clamp(p, 0, N - 1)), dip = (f < 0 || f > 1) ? 1 : Math.pow(Math.abs(2 * f - 1), .8);
  if (idx !== shownCat) { shownCat = idx; fillDetail(idx); }
  det.style.opacity = (clamp((dv - .35) / .5, 0, 1) * dip).toFixed(2);
  det.style.transform = 'translateY(' + ((1 - dv) * 28).toFixed(1) + 'px)';
  det.style.pointerEvents = dv > .7 ? 'auto' : 'none';
  /* cues */
  const open = dep.t === 1;
  if (shownDet !== (open ? 1 : 0) || nav.lastIdx !== idx) { shownDet = open ? 1 : 0; nav.lastIdx = idx; updateNav(idx, open); }
}
const nav = { lastIdx: -1 };
function fillDetail(i) {
  const d = D[i]; $('#d-tag').textContent = d.tag; $('#d-body').textContent = d.body;
  $('#d-facts').innerHTML = d.f.map(r => '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>').join('');
  $('#cnum').textContent = String(i + 1).padStart(2, '0');
}
function updateNav(i, open) {
  const pv = $('#prev'), nx = $('#next');
  pv.hidden = i === 0; nx.hidden = i === N - 1;
  $('#prevl').textContent = i > 0 ? D[i - 1].n : ''; $('#nextl').textContent = i < N - 1 ? D[i + 1].n : '';
  $('#deepl').textContent = open ? 'back' : 'detail';
  $('#deeppath').setAttribute('d', open ? 'M12 46V4M4 12l8-8 8 8' : 'M12 2v42M4 36l8 8 8-8');
  $('#deep').setAttribute('aria-label', open ? 'Back to category' : 'Show detail');
}

/* controls */
const snap = (a, t) => { a.t = clamp(Math.round(t), 0, a.max); };
let lastMsg = '';
function say() { const m = D[cat.t].n + ', ' + (dep.t ? 'detail' : 'overview'); if (m !== lastMsg) { lastMsg = m; $('#live').textContent = m; try { navigator.vibrate && !RM && navigator.vibrate(6); } catch (e) {} } }
const go = (k) => { snap(cat, k); say(); kick(); };
const deep = (k) => { snap(dep, k); say(); kick(); };
$('#prev').onclick = () => go(cat.t - 1);
$('#next').onclick = () => go(cat.t + 1);
$('#deep').onclick = () => deep(dep.t ? 0 : 1);
const rub = (v, m) => v < 0 ? v * .35 : v > m ? m + (v - m) * .35 : v;

/* gestures: swipe left = next category, swipe up = deeper. The dominant direction wins, then locks. */
let G = null;
stage.addEventListener('pointerdown', (e) => {
  if (e.target.closest('.bar')) return;
  stage.setPointerCapture(e.pointerId);
  G = { id: e.pointerId, x0: e.clientX, y0: e.clientY, lt: e.timeStamp, axis: null, bx: cat.x, by: dep.x, v: 0 };
});
stage.addEventListener('pointermove', (e) => {
  if (!G || e.pointerId !== G.id) return;
  const dx = e.clientX - G.x0, dy = e.clientY - G.y0;
  if (!G.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 8) { G.axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y'; (G.axis === 'x' ? cat : dep).drag = true; kick(); }
  if (!G.axis) return;
  const a = G.axis === 'x' ? cat : dep, dt = Math.max(1, e.timeStamp - G.lt) / 1000;
  const nx = G.axis === 'x' ? rub(G.bx - dx / (desk ? 320 : 220), a.max) : rub(G.by - dy / (desk ? 260 : 300), a.max);
  G.v = clamp(lerp(G.v, (nx - a.x) / dt, .35), -12, 12); a.x = nx; a.v = G.v; G.lt = e.timeStamp;
});
function end(e) {
  if (!G || e.pointerId !== G.id) return;
  const g = G; G = null; if (!g.axis) return;
  const a = g.axis === 'x' ? cat : dep; a.drag = false;
  a.v = RM || e.timeStamp - g.lt > 90 ? 0 : g.v;
  const from = Math.round(g.axis === 'x' ? g.bx : g.by);
  const proj = a.x + a.v * (g.axis === 'x' ? .2 : .12);
  snap(a, clamp(Math.round(proj), from - 1, from + 1));
  say(); kick();
}
stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
let wt = 0;
stage.addEventListener('wheel', (e) => {
  e.preventDefault();
  const h = Math.abs(e.deltaX) > Math.abs(e.deltaY), a = h ? cat : dep;
  a.drag = true; a.x = rub(a.x + (h ? e.deltaX / 900 : e.deltaY / 700), a.max); a.v = 0; kick();
  clearTimeout(wt); wt = setTimeout(() => { cat.drag = dep.drag = false; snap(cat, cat.x); snap(dep, dep.x); say(); kick(); }, 140);
}, { passive: false });
addEventListener('keydown', (e) => {
  const k = e.key; let ok = true;
  if (k === 'ArrowRight') go(cat.t + 1); else if (k === 'ArrowLeft') go(cat.t - 1);
  else if (k === 'ArrowDown') deep(1); else if (k === 'ArrowUp') deep(0);
  else if (/^[1-5]$/.test(k)) go(+k - 1); else ok = false;
  if (ok) e.preventDefault();
});
addEventListener('resize', () => { size(); render(); });
size(); say(); render(); kick();
window.__v3 = { cat, dep, go, deep };
})();
