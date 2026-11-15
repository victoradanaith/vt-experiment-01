(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const root = document.documentElement;
if (/[?&]rm=1/.test(location.search)) root.classList.add('rm');
const RM = () => root.classList.contains('rm') || matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- dummy content: a core sample, five layers x three angles ---- */
const S = [
  { n: 'HUMUS', bg: '#1b1a17', fg: '#ece8dd',
    v: [
      { k: 'WHERE', big: '0–0.4 m', sub: 'Loose, dark and root-bound.', rows: [['Thickness', '0.4 m'], ['Moisture', '28%'], ['Roots', 'Dense']] },
      { k: 'WHEN', big: '≈ 90 yr', sub: 'Rebuilt every few decades.', rows: [['Laid down', 'Seasonal'], ['Rate', '4 mm / yr'], ['Marker', 'Leaf litter']] },
      { k: 'WHAT', big: '41% organic', sub: 'Mostly decayed plant matter.', rows: [['Organic', '41%'], ['Silt', '34%'], ['Sand', '25%']] }],
    note: ['The thinnest layer and the busiest. Everything above it is weather; everything below it is patience.', 'Dummy values written for this lab. Not survey data.'] },
  { n: 'CLAY', bg: '#d6cfbc', fg: '#141414',
    v: [
      { k: 'WHERE', big: '0.4–1.9 m', sub: 'Dense, sticky, holds water.', rows: [['Thickness', '1.5 m'], ['Moisture', '36%'], ['Roots', 'Sparse']] },
      { k: 'WHEN', big: '≈ 8,000 yr', sub: 'Slow silt from a vanished lake.', rows: [['Laid down', 'Still water'], ['Rate', '0.2 mm / yr'], ['Marker', 'Thin varves']] },
      { k: 'WHAT', big: '58% clay', sub: 'Fine grains packed flat.', rows: [['Clay', '58%'], ['Silt', '31%'], ['Sand', '11%']] }],
    note: ['A grey-brown seal. Water stops here, so everything above is damp and everything below stays dry.', 'Dummy values written for this lab. Not survey data.'] },
  { n: 'CHALK', bg: '#f1eee5', fg: '#141414',
    v: [
      { k: 'WHERE', big: '1.9–4.2 m', sub: 'Pale, soft, easy to scratch.', rows: [['Thickness', '2.3 m'], ['Moisture', '12%'], ['Roots', 'None']] },
      { k: 'WHEN', big: '≈ 80 Ma', sub: 'A warm shallow sea, long gone.', rows: [['Laid down', 'Seabed ooze'], ['Rate', '2 cm / 1000 yr'], ['Marker', 'Flint bands']] },
      { k: 'WHAT', big: '94% calcite', sub: 'Shells of tiny sea plants.', rows: [['Calcite', '94%'], ['Silica', '4%'], ['Clay', '2%']] }],
    note: ['The brightest band in the column. Flint seams run through it like ruled lines.', 'Dummy values written for this lab. Not survey data.'] },
  { n: 'SANDSTONE', bg: '#c4bba3', fg: '#141414',
    v: [
      { k: 'WHERE', big: '4.2–9.0 m', sub: 'Banded, gritty, cuts cleanly.', rows: [['Thickness', '4.8 m'], ['Moisture', '9%'], ['Fractures', 'Vertical']] },
      { k: 'WHEN', big: '≈ 210 Ma', sub: 'Dunes in a dry basin.', rows: [['Laid down', 'Wind drift'], ['Rate', '1 mm / yr'], ['Marker', 'Cross-bedding']] },
      { k: 'WHAT', big: '72% quartz', sub: 'Rounded grains, iron stained.', rows: [['Quartz', '72%'], ['Feldspar', '18%'], ['Iron', '10%']] }],
    note: ['Rust-coloured and cross-bedded. You can read the wind direction from the stripes.', 'Dummy values written for this lab. Not survey data.'] },
  { n: 'BASALT', bg: '#141414', fg: '#ece8dd',
    v: [
      { k: 'WHERE', big: '9.0–14 m', sub: 'Hard, dark, cooled in columns.', rows: [['Thickness', '5 m+'], ['Moisture', '2%'], ['Fractures', 'Hexagonal']] },
      { k: 'WHEN', big: '≈ 58 Ma', sub: 'A single pour of lava.', rows: [['Laid down', 'Lava flow'], ['Rate', 'Hours to days'], ['Marker', 'Glassy crust']] },
      { k: 'WHAT', big: '50% silica', sub: 'Dense, iron-rich rock.', rows: [['Silica', '50%'], ['Iron', '12%'], ['Magnesium', '8%']] }],
    note: ['The floor of this sample. It stopped the drill and ended the column.', 'Dummy values written for this lab. Not survey data.'] }
];
const N = S.length, NV = 3;
S.forEach((s, i) => {
  const dark = i === 0 || i === N - 1;
  s.ln = dark ? 'rgba(236,232,221,.2)' : 'rgba(20,20,20,.2)';
  s.sh = dark ? 'rgba(236,232,221,.38)' : 'rgba(20,20,20,.36)';
});

/* ---- abstract shapes: one 100x160 tile per layer, repeated, thin non-scaling strokes ---- */
function tile(t, x) {
  const c = x + 50;
  switch (t) {
    case 0: return `<circle cx="${c}" cy="80" r="16"/><circle cx="${c}" cy="80" r="34" stroke-dasharray="2 5"/><circle cx="${c}" cy="80" r="56"/><circle class="dot" cx="${c}" cy="80" r="2.6"/>`;
    case 1: return [34, 66, 98, 130].map(y => `<path d="M${x} ${y} q25 -14 50 0 t50 0"/>`).join('') + `<circle class="dot" cx="${c}" cy="66" r="2.6"/>`;
    case 2: return `<path d="M${x} 160 L${x + 100} 0 M${x + 30} 160 L${x + 130} 0 M${x - 30} 160 L${x + 70} 0"/><rect x="${x + 20}" y="34" width="60" height="92"/><circle class="dot" cx="${x + 20}" cy="34" r="2.6"/>`;
    case 3: return `<path d="M${x} 160 a50 50 0 0 1 100 0 M${x + 16} 160 a34 34 0 0 1 68 0 M${x + 32} 160 a18 18 0 0 1 36 0 M${x} 0 a50 50 0 0 0 100 0 M${x + 16} 0 a34 34 0 0 0 68 0"/><circle class="dot" cx="${c}" cy="104" r="2.6"/>`;
    default: {
      const hex = r => Array.from({ length: 6 }, (_, k) => { const a = Math.PI / 3 * k + Math.PI / 6; return (c + r * Math.cos(a)).toFixed(1) + ',' + (80 + r * Math.sin(a)).toFixed(1); }).join(' ');
      return `<polygon points="${hex(44)}"/><polygon points="${hex(26)}"/><circle class="dot" cx="${c}" cy="80" r="2.6"/>`;
    }
  }
}
const shapeSVG = t => {
  let g = '';
  for (let k = -3; k <= 7; k++) g += tile(t, k * 100);
  return `<svg class="shape" viewBox="0 0 400 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><g>${g}</g></svg>`;
};

/* ---- build ---- */
const app = $('#app'), field = $('#field');
const bands = S.map((s, i) => {
  const el = document.createElement('section');
  el.className = 'band';
  el.style.cssText = `--bg:${s.bg};--fg:${s.fg};--ln:${s.ln};--sh:${s.sh}`;
  const panels = s.v.map((v, j) => {
    const rows = v.rows.map(r => {
      const bar = j === 2 ? `<span class="meter" aria-hidden="true"><i style="--v:${parseInt(r[1], 10)}%"></i></span>` : '';
      return `<div><dt>${r[0]}</dt><dd>${j === 2 ? '<span>' + r[1] + '</span>' + bar : r[1]}</dd></div>`;
    }).join('');
    return `<div class="pan"><p class="kick">0${j + 1} · ${v.k}</p><p class="big">${v.big}</p><p class="sub">${v.sub}</p><dl class="rows">${rows}</dl><p class="note">${s.note[0]}</p></div>`;
  }).join('');
  el.innerHTML = shapeSVG(i) + '<i class="grid"></i><i class="mark"></i>' +
    `<button type="button" class="head"><span class="num">0${i + 1}</span><span class="ttl">${s.n}</span><span class="val"><span class="vt">${s.v.map(v => `<b>${v.big}</b>`).join('')}</span></span></button>` +
    `<div class="body"><div class="trk">${panels}</div></div>`;
  field.appendChild(el);
  return {
    el, head: $('.head', el), ttl: $('.ttl', el), val: $('.val', el), vt: $('.vt', el),
    body: $('.body', el), trk: $('.trk', el), g: $('.shape g', el), f: 52 + i * 11, s: 2, HH: 90
  };
});

/* ---- geometry ---- */
let W = 390, Hf = 600, ch = 56, A = 380, fs = 26, gut = 16, bw = 358, unitY = 150, unitX = 300;
function measure() {
  W = field.clientWidth; Hf = field.clientHeight;
  gut = Math.max(16, (W - 1080) / 2);
  ch = clamp(Hf * 0.095, 48, 76);
  A = Hf - (N - 1) * ch;
  fs = clamp(ch * 0.46, 22, 34);
  const smax = W >= 900 ? 2.5 : 2.05;
  bw = Math.min(W - 2 * gut, 560);
  app.style.setProperty('--gut', gut + 'px');
  app.style.setProperty('--ch', ch + 'px');
  app.style.setProperty('--fs', fs + 'px');
  unitY = clamp(Hf / 3.5, 120, 200);
  unitX = clamp(W * 0.8, 260, 560);
  bands.forEach(b => {
    const w0 = b.ttl.offsetWidth || 120;
    b.s = Math.min(smax, (W - 2 * gut) / w0);
    b.HH = 24 + fs * b.s + 10;
    const bh = Math.max(120, A - b.HH - 12);
    b.bh = bh;
    b.body.style.width = bw + 'px';
    b.body.style.height = bh + 'px';
    b.trk.style.width = bw * NV + 'px';
    b.trk.querySelectorAll('.pan').forEach(p => { p.style.width = bw + 'px'; });
    const tight = bh < 262;
    b.body.classList.toggle('tight', tight);
    b.body.style.setProperty('--rh', clamp((bh - (tight ? 100 : 160)) / 3, 24, tight ? 40 : 46) + 'px');
    b.val.style.top = (ch - 8 - 16) + 'px';
    b.vt.parentNode.style.width = '124px';
  });
  render();
}

/* ---- springs ---- */
const K = 150, C = 18;
const P = { x: 0, v: 0, t: 0, drag: false, max: N - 1 };
const V = { x: 0, v: 0, t: 0, drag: false, max: NV - 1 };
let raf = 0, last = 0, idx = -1, vw = -1, interacted = false;
function spring(o, dt) { const f = (o.t - o.x) * K - o.v * C; o.v += f * dt; o.x += o.v * dt; }
function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }
function tick(now) {
  const dt = Math.min(0.033, (now - last) / 1000); last = now;
  let busy = false;
  for (const o of [P, V]) {
    if (o.drag) { busy = true; continue; }
    spring(o, dt);
    if (Math.abs(o.t - o.x) > 0.0008 || Math.abs(o.v) > 0.004) busy = true; else { o.x = o.t; o.v = 0; }
  }
  render();
  raf = busy ? requestAnimationFrame(tick) : 0;
}

/* ---- render: all state is two numbers, layer position P and angle position V ---- */
function render() {
  let y = 0;
  const hs = bands.map((b, i) => Math.max(0, 1 - Math.abs(i - P.x)));
  let tot = 0;
  const hh = hs.map(w => { const h = lerp(ch, A, w); tot += h; return h; });
  hh[N - 1] += Hf - tot; // last band absorbs rubber-band slack
  bands.forEach((b, i) => {
    const w = hs[i], h = hh[i];
    b.el.style.transform = `translate3d(0,${y}px,0)`;
    b.el.style.height = h + 'px';
    b.el.style.setProperty('--w', w.toFixed(3));
    y += h;
    const hdH = lerp(ch, b.HH, w);
    b.head.style.height = hdH + 'px';
    const ty = lerp(ch - fs - 8, 24, w), sc = lerp(1, b.s, w);
    b.ttl.style.transform = `translate3d(0,${ty}px,0) scale(${sc.toFixed(4)})`;
    b.val.style.opacity = clamp(1 - w * 1.8, 0, 1);
    b.vt.style.transform = `translate3d(${-V.x * 124}px,0,0)`;
    const bo = clamp((w - 0.55) / 0.45, 0, 1);
    b.body.style.transform = `translate3d(0,${hdH}px,0)`;
    b.body.style.opacity = bo;
    b.body.style.visibility = bo > 0.01 ? 'visible' : 'hidden';
    b.trk.style.transform = `translate3d(${-V.x * bw}px,0,0)`;
    b.g.setAttribute('transform', `translate(${(-V.x * b.f).toFixed(2)} 0)`);
  });
  const ni = clamp(Math.round(P.x), 0, N - 1), nv = clamp(Math.round(V.x), 0, NV - 1);
  if (ni !== idx || nv !== vw) sync(ni, nv);
}

/* ---- state sync (header, aria, live) ---- */
let liveT = 0;
function sync(ni, nv) {
  const layerChanged = ni !== idx;
  idx = ni; vw = nv;
  $('#cnt').textContent = `0${idx + 1} / 0${N}`;
  [...$('#views').children].forEach((e, k) => e.classList.toggle('on', k === vw));
  bands.forEach((b, i) => {
    const on = i === idx;
    b.el.setAttribute('aria-current', on ? 'true' : 'false');
    b.body.inert = !on;
    b.head.setAttribute('aria-label', `Layer ${i + 1} of ${N}, ${S[i].n}, ${S[i].v[vw].k.toLowerCase()} ${S[i].v[vw].big}` + (on ? '. Open detail' : '. Select'));
  });
  $('#b-open').setAttribute('aria-label', `Open ${S[idx].n} detail`);
  clearTimeout(liveT);
  liveT = setTimeout(() => { $('#live').textContent = `Layer ${idx + 1} of ${N}: ${S[idx].n}. ${S[idx].v[vw].k}: ${S[idx].v[vw].big}`; }, 260);
  if (detailOpen && layerChanged) fillDetail();
}

/* ---- navigation ---- */
function used() { if (!interacted) { interacted = true; $('#cue').classList.add('gone'); } }
function goLayer(i) {
  used(); P.t = clamp(Math.round(i), 0, N - 1);
  if (RM()) { P.x = P.t; P.v = 0; render(); } else kick();
}
function goView(j) {
  used(); V.t = clamp(Math.round(j), 0, NV - 1);
  if (RM()) { V.x = V.t; V.v = 0; render(); } else kick();
}
$('#b-up').onclick = () => goLayer(P.t - 1);
$('#b-down').onclick = () => goLayer(P.t + 1);
$('#b-left').onclick = () => goView(V.t - 1);
$('#b-right').onclick = () => goView(V.t + 1);
$('#b-open').onclick = () => openDetail();
bands.forEach((b, i) => b.head.addEventListener('click', () => { if (i === Math.round(P.t)) openDetail(); else goLayer(i); }));

/* ---- pointer gestures: direction lock, finger-tracked, inertia on release ---- */
let g = null, swallow = false;
const rub = (v, lo, hi) => v < lo ? lo + (v - lo) * 0.35 : v > hi ? hi + (v - hi) * 0.35 : v;
field.addEventListener('pointerdown', e => {
  if (detailOpen || (e.pointerType === 'mouse' && e.button !== 0)) return;
  g = { id: e.pointerId, sx: e.clientX, sy: e.clientY, axis: null, p0: P.x, v0: V.x, s: [{ t: e.timeStamp, x: e.clientX, y: e.clientY }] };
});
field.addEventListener('pointermove', e => {
  if (!g || e.pointerId !== g.id) return;
  const dx = e.clientX - g.sx, dy = e.clientY - g.sy;
  g.s.push({ t: e.timeStamp, x: e.clientX, y: e.clientY });
  if (g.s.length > 12) g.s.shift();
  if (!g.axis) {
    if (Math.hypot(dx, dy) < 8) return;
    g.axis = Math.abs(dx) > Math.abs(dy) * 1.1 ? 'x' : 'y';
    try { field.setPointerCapture(g.id); } catch (_) {}
    field.classList.add('drag');
    used();
    const o = g.axis === 'x' ? V : P; o.drag = true; o.v = 0; kick();
  }
  if (g.axis === 'y') P.x = rub(g.p0 - dy / unitY, 0, N - 1);
  else V.x = rub(g.v0 - dx / unitX, 0, NV - 1);
  kick();
});
function endDrag(e, cancel) {
  if (!g || e.pointerId !== g.id) return;
  const gg = g; g = null;
  field.classList.remove('drag');
  if (!gg.axis) return;
  swallow = true; setTimeout(() => { swallow = false; }, 0);
  const o = gg.axis === 'x' ? V : P, unit = gg.axis === 'x' ? unitX : unitY;
  const a = gg.s[0], b = gg.s[gg.s.length - 1];
  let v = 0;
  if (!cancel && b.t - a.t > 10 && e.timeStamp - b.t < 120) {
    const d = gg.axis === 'x' ? -(b.x - a.x) : -(b.y - a.y);
    v = clamp(d / unit / ((b.t - a.t) / 1000), -9, 9);
  }
  o.drag = false;
  o.t = clamp(Math.round(o.x + v * 0.16), 0, o.max);
  if (RM()) { o.x = o.t; o.v = 0; render(); } else { o.v = v * 0.7; kick(); }
}
field.addEventListener('pointerup', e => endDrag(e, false));
field.addEventListener('pointercancel', e => endDrag(e, true));
field.addEventListener('click', e => { if (swallow) { e.stopPropagation(); e.preventDefault(); } }, true);

/* desktop wheel: one step per gesture */
let wheelLock = false, wheelT = 0;
field.addEventListener('wheel', e => {
  if (detailOpen) return;
  e.preventDefault();
  clearTimeout(wheelT); wheelT = setTimeout(() => { wheelLock = false; }, 160);
  if (wheelLock) return;
  const ax = Math.abs(e.deltaX) > Math.abs(e.deltaY), d = ax ? e.deltaX : e.deltaY;
  if (Math.abs(d) < 6) return;
  wheelLock = true;
  if (ax) goView(V.t + Math.sign(d)); else goLayer(P.t + Math.sign(d));
}, { passive: false });

/* ---- detail ---- */
let detailOpen = false, opener = null;
const detail = $('#detail');
function fillDetail() {
  const s = S[idx];
  $('#d-cnt').textContent = `CORE NOTE 0${idx + 1} / 0${N}`;
  const t = $('#d-title'); t.textContent = s.n; t.style.fontSize = '100px';
  const avail = Math.min(W, 1080 + 2 * gut) - 2 * gut;
  t.style.fontSize = Math.min(avail > 600 ? 150 : 96, 100 * avail / t.scrollWidth) + 'px';
  $('#d-txt').innerHTML = s.note.map(p => `<p>${p}</p>`).join('');
  $('#d-grid').innerHTML = s.v.map(v => `<div><h3>${v.k}</h3><p class="gb">${v.big}</p><ul>${v.rows.map(r => `<li><span>${r[0]}</span>${r[1]}</li>`).join('')}</ul></div>`).join('');
  const strip = $('#d-strip');
  if (!strip.children.length) {
    const grow = [0.4, 1.5, 2.3, 4.8, 5];
    S.forEach((x, i) => {
      const b = document.createElement('button'); b.type = 'button';
      b.style.cssText = `--g:${grow[i]};background:${x.bg};color:${x.fg}`;
      b.innerHTML = `<span>0${i + 1} ${x.n}</span><span>${x.v[0].big}</span>`;
      b.setAttribute('aria-label', `Layer ${i + 1}, ${x.n}, ${x.v[0].big}`);
      b.onclick = () => goLayer(i); strip.appendChild(b);
    });
  }
  [...strip.children].forEach((b, i) => b.setAttribute('aria-current', i === idx ? 'true' : 'false'));
}
function openDetail() {
  if (detailOpen) return;
  used(); opener = document.activeElement;
  detailOpen = true; fillDetail();
  detail.inert = false; detail.classList.add('open');
  [$('.hdr'), field, $('#bar')].forEach(n => { n.inert = true; });
  $('#d-back').focus({ preventScroll: true });
}
function closeDetail() {
  if (!detailOpen) return;
  detailOpen = false; detail.classList.remove('open'); detail.inert = true;
  [$('.hdr'), field, $('#bar')].forEach(n => { n.inert = false; });
  const back = opener && document.contains(opener) ? opener : bands[idx].head;
  back.focus({ preventScroll: true });
}
$('#d-back').onclick = closeDetail;

/* ---- keyboard ---- */
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key, onBtn = e.target.closest && e.target.closest('button');
  if (k === 'Escape') { if (detailOpen) { e.preventDefault(); closeDetail(); } return; }
  if (k === 'ArrowUp') { e.preventDefault(); goLayer(P.t - 1); }
  else if (k === 'ArrowDown') { e.preventDefault(); goLayer(P.t + 1); }
  else if (k === 'ArrowLeft') { if (detailOpen) return; e.preventDefault(); goView(V.t - 1); }
  else if (k === 'ArrowRight') { if (detailOpen) return; e.preventDefault(); goView(V.t + 1); }
  else if (/^[1-5]$/.test(k)) { goLayer(+k - 1); }
  else if (k === 'Home') { e.preventDefault(); goLayer(0); }
  else if (k === 'End') { e.preventDefault(); goLayer(N - 1); }
  else if ((k === 'Enter' || k === ' ') && !onBtn && !detailOpen) { e.preventDefault(); openDetail(); }
});

/* ---- boot ---- */
addEventListener('resize', () => { measure(); if (detailOpen) fillDetail(); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
measure(); sync(0, 0);
if (!RM()) setTimeout(() => { if (!interacted && !V.drag) { V.v = 4.6; kick(); } }, 1100);

window.__v7 = { goLayer, goView, openDetail, closeDetail,
  get P() { return P.x; }, get V() { return V.x; }, get idx() { return idx; }, get vw() { return vw; },
  get open() { return detailOpen; }, get dims() { return { W, Hf, ch, A, fs, gut, bw }; }, S };
})();
