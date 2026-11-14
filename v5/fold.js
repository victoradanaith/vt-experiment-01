(() => {
'use strict';
const $ = (s) => document.querySelector(s);
const stage = $('#stage'), host = $('#sheets'), cue = $('#cue');
const rmq = matchMedia('(prefers-reduced-motion: reduce)');
const forced = /[?&]rm=1/.test(location.search);
let RM = rmq.matches || forced;
rmq.addEventListener && rmq.addEventListener('change', () => { RM = rmq.matches || forced; if (RM) { snapAll(); } });

/* dummy editorial content: short, invented, nothing real */
const D = [
  { w: 'FOLD', cap: 'A plane, bent once.', p: 'Paper remembers where it was folded. The crease is the only part of the sheet that has a history.', h: 'Memory', f: [['Creases', '1'], ['Planes', '2'], ['Angle', '180° → 0°']] },
  { w: 'LAYER', cap: 'Four sheets, one stack.', p: 'Each sheet sits on the one below. Moving sideways reveals the next without losing the order.', h: 'Order', f: [['Sheets', '4'], ['Offset', '10 px'], ['Depth', 'stacked']] },
  { w: 'CREASE', cap: 'The line that decides.', p: 'Everything that moves on this page moves around one line. Remove it and the sheet is only a rectangle.', h: 'Hinge', f: [['Axis', 'horizontal'], ['Position', '58 %'], ['Shadow', 'follows angle']] },
  { w: 'EDGE', cap: 'Where the sheet ends.', p: 'A corner turned back shows what is underneath. The page is thin, so the underside is always close.', h: 'Underside', f: [['Corner', 'top right'], ['Fold', 'diagonal'], ['Beneath', 'charcoal']] }
];
const N = D.length, R = .58;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const pad2 = (n) => String(n).padStart(2, '0');

/* geometry */
let W = 0, H = 0, desk = false, sw = 0, sh = 0, yc = 0, fh = 0, sx = 0, topY = 0, availH = 0;
function measure() {
  W = innerWidth; H = innerHeight; desk = W >= 900 && W > H;
  const top = desk ? 48 : 56, bottom = H - (desk ? 130 : 150);
  availH = bottom - top; topY = top;
  sw = desk ? Math.min(500, W * .34) : Math.min(W - 44, 360);
  sh = Math.min(availH, sw * 1.5);
  yc = Math.round(R * sh); fh = sh - yc;
  sx = desk ? W * .62 - sw / 2 : (W - sw) / 2;
}

/* one printed page, drawn once at full size; the two halves show different parts of it */
function face(d, i) {
  const m = 20, c = 'rgba(25,25,24,.16)', cb = '#2147ff', ch = '#191918';
  const mark = (x, y) => `<path d="M${x - 6} ${y}h12M${x} ${y - 6}v12" stroke="${c}" fill="none"/>`;
  return `<svg width="${sw}" height="${sh}" viewBox="0 0 ${sw} ${sh}" aria-hidden="true">
  <g stroke="${c}" fill="none"><path d="M${m} 0V${sh}M${sw - m} 0V${sh}M0 ${m}H${sw}M0 ${sh - m}H${sw}"/></g>
  ${mark(m, m)}${mark(sw - m, m)}${mark(m, sh - m)}${mark(sw - m, sh - m)}
  <circle cx="${sw * .1}" cy="${yc}" r="${sw * .62}" fill="none" stroke="${cb}" stroke-width="1"/>
  <path d="M${sw} ${sh - sw * .34}A${sw * .34} ${sw * .34} 0 0 0 ${sw - sw * .34} ${sh}H${sw}Z" fill="${cb}"/>
  <text x="${-sw * .05}" y="${sw * .64 + 22}" font-family="Helvetica Neue, Arial Narrow, Arial, sans-serif" font-weight="800" font-size="${sw * .88}" letter-spacing="${-sw * .06}" fill="${ch}">${pad2(i + 1)}</text>
  <text x="${sw - m - 8}" y="${m + 12}" text-anchor="end" font-family="ui-monospace, Menlo, monospace" font-size="10" letter-spacing=".8" fill="${ch}">${pad2(i + 1)} / 04</text>
  <path d="M0 ${yc}h10M${sw - 10} ${yc}h10" stroke="${ch}" stroke-width="1.2"/>
  <text x="${m + 8}" y="${yc - 20}" font-family="ui-monospace, Menlo, monospace" font-size="10" letter-spacing=".8" fill="${ch}">${d.cap.toUpperCase()}</text>
  <foreignObject x="${m + 8}" y="${yc + 36}" width="${sw - 2 * m - 16}" height="${fh * .5}"><div xmlns="http://www.w3.org/1999/xhtml" style="font:400 ${sw > 400 ? 17 : 15}px/1.45 Helvetica Neue,Arial,sans-serif;color:${ch};text-transform:none;letter-spacing:0">${d.p}</div></foreignObject>
  </svg>`;
}
function backFace(d) {
  const ch = '#191918';
  return `<svg width="${sw}" height="${fh}" viewBox="0 0 ${sw} ${fh}" aria-hidden="true">
  <path d="M20 0V${fh}M${sw - 20} 0V${fh}" stroke="rgba(25,25,24,.16)" fill="none"/>
  <text x="${-sw * .02}" y="${fh * .56}" font-family="Helvetica Neue, Arial Narrow, Arial, sans-serif" font-weight="800" font-size="${Math.min(sw * .5, fh * .8)}" letter-spacing="${-sw * .03}" fill="${ch}">${d.w}</text>
  <rect x="28" y="${fh - 46}" width="10" height="10" fill="#2147ff"/>
  <text x="46" y="${fh - 37}" font-family="ui-monospace, Menlo, monospace" font-size="10" letter-spacing=".8" fill="${ch}">PULL DOWN TO UNFOLD</text>
  </svg>`;
}

/* build sheets */
let S = [];
function build() {
  measure();
  host.replaceChildren(); S = [];
  D.forEach((d, i) => {
    const el = document.createElement('div'); el.className = 'sheet'; el.style.width = sw + 'px'; el.style.height = sh + 'px';
    el.innerHTML = `
    <div class="part top" style="width:${sw}px;height:${yc}px">${face(d, i)}<div class="shade"></div></div>
    <div class="part flap" style="top:${yc}px;width:${sw}px;height:${fh}px">
      <div class="face front"><div style="position:absolute;left:0;top:${-yc}px">${face(d, i)}</div><div class="shade"></div></div>
      <div class="face back">${backFace(d)}</div>
    </div>
    <div class="det" style="width:${sw}px">
      <div class="bg"></div>
      <div class="body"><h3>${d.h}</h3><p>${d.p}</p><dl>${d.f.map(r => `<div><dt>${r[0]}</dt><dd>${r[1]}</dd></div>`).join('')}</dl></div>
      <svg class="flapsvg" aria-hidden="true"><polygon class="sh" fill="rgba(0,0,0,.5)"/><polygon class="fp" fill="#2147ff"/></svg>
    </div>
    <button type="button" class="ear" aria-label="Open detail for sheet ${i + 1}: ${d.w}"></button>
    <button type="button" class="close" aria-label="Close detail"><svg viewBox="0 0 16 16"><path d="M10 2 4 8l6 6"/></svg></button>`;
    host.appendChild(el);
    const q = (s) => el.querySelector(s);
    const o = { el, top: q('.top'), flap: q('.flap'), tsh: q('.top .shade'), fsh: q('.flap .face.front .shade'), det: q('.det'), bg: q('.det .bg'), body: q('.det .body'), sp: q('.flapsvg .sh'), fp: q('.flapsvg .fp'), ear: q('.ear'), back: q('.close') };
    o.ear.onclick = () => { used(); openDetail(i); };
    o.back.onclick = () => { used(); closeDetail(); };
    o.ear.addEventListener('pointerdown', (e) => e.stopPropagation());
    S.push(o);
  });
  render();
}

/* three axes: sheet position, fold openness, detail peel. Each is a mass on a spring. */
const mk = (max) => ({ x: 0, v: 0, t: 0, max, drag: false });
const P = mk(N - 1), O = mk(1), Dd = mk(1);
const K = 150, C = 18;
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
  const m = step(P, dt) | step(O, dt) | step(Dd, dt);
  render();
  if (m) requestAnimationFrame(tick); else running = false;
}
const kick = () => { if (!running) { running = true; last = performance.now(); requestAnimationFrame(tick); } };
function snapAll() { P.x = P.t; O.x = O.t; Dd.x = Dd.t; P.v = O.v = Dd.v = 0; kick(); }

/* half-plane clip of the page rectangle: (sw - x) + y <= a is the corner that has been turned back */
function corner(a, Hv) {
  let poly = [[0, 0], [sw, 0], [sw, Hv], [0, Hv]];
  const f = (p) => a - ((sw - p[0]) + p[1]);
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const A = poly[i], B = poly[(i + 1) % poly.length], fa = f(A), fb = f(B);
    if (fa >= 0) out.push(A);
    if ((fa >= 0) !== (fb >= 0)) { const t = fa / (fa - fb); out.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t]); }
  }
  return out;
}
const reflect = (p, a) => { const k = Math.SQRT1_2, n = [k, -k], c = (sw - a) * k; const dd = (p[0] * n[0] + p[1] * n[1]) - c; return [p[0] - 2 * dd * n[0], p[1] - 2 * dd * n[1]]; };
const pts = (poly) => poly.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
const cp = (poly) => 'polygon(' + poly.map(p => p[0].toFixed(1) + 'px ' + p[1].toFixed(1) + 'px').join(',') + ')';

let shownIdx = -1, shownMode = '';
function render() {
  const p = clamp(P.x, -.35, N - 1 + .35), o = O.x, oc = clamp(o, 0, 1), d = clamp(Dd.x, 0, 1);
  const theta = Math.acos(2 * oc - 1) * 180 / Math.PI;      // 180° folded over -> 0° flat
  const s = Math.sin(theta * Math.PI / 180);
  const vis = yc + fh * Math.max(0, 2 * oc - 1);              // visible paper height
  const base = topY + (availH - vis) / 2;
  const act = clamp(Math.round(p), 0, N - 1);
  S.forEach((sh_, i) => {
    const k = i - p;
    let tx = sx, ty = base, sc = 1, rot = 0, op = 1, z;
    if (k < 0) { tx = sx + k * (sw + 70); rot = k * 5; op = clamp(1 + k * 1.1, 0, 1); z = 120; }
    else { tx = sx + k * 11; ty = base - k * 10; sc = 1 - k * .035; op = k > 3.2 ? 0 : 1; z = 100 - Math.round(k * 10); }
    sh_.el.style.transform = `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
    sh_.el.style.opacity = op.toFixed(2); sh_.el.style.zIndex = z;
    sh_.flap.style.transform = `rotateX(${theta.toFixed(2)}deg) translateZ(-.5px)`;
    sh_.tsh.style.opacity = (.75 * s).toFixed(3);
    sh_.fsh.style.opacity = (.6 * s).toFixed(3);
    /* detail peel: only the front sheet is ever peeled */
    const di = i === act ? d : 0, a = lerp(36, sw + vis + 6, di), poly = corner(a, vis);
    sh_.det.style.height = vis + 'px';
    sh_.bg.style.clipPath = cp(poly);
    const fl = poly.map(q => reflect(q, a));
    sh_.fp.setAttribute('points', pts(fl)); sh_.sp.setAttribute('points', pts(fl.map(q => [q[0] + 5, q[1] + 6])));
    sh_.fp.style.opacity = sh_.sp.style.opacity = di > .985 ? 0 : 1;
    sh_.body.style.opacity = i === act ? clamp((d - .45) / .45, 0, 1).toFixed(2) : 0;
    const peeled = i === act && d > .15;
    sh_.back.style.opacity = i === act ? clamp((d - .6) / .3, 0, 1).toFixed(2) : 0;
    sh_.back.style.pointerEvents = i === act && d > .6 ? 'auto' : 'none';
    sh_.det.style.pointerEvents = peeled ? 'auto' : 'none';
    sh_.ear.disabled = i !== act || d > .05; sh_.ear.tabIndex = (i === act && d <= .05) ? 0 : -1;
    sh_.ear.style.transform = `translate(${(tx - sx) * 0}px,0)`;
    sh_.back.tabIndex = (i === act && d > .6) ? 0 : -1;
    sh_.el.inert = (i !== act);
    const ex = sw - 48;
    sh_.ear.style.left = ex + 'px'; sh_.ear.style.right = 'auto';
  });
  if (act !== shownIdx) { shownIdx = act; $('#cnum').textContent = pad2(act + 1); $('#bigidx').textContent = pad2(act + 1); }
  const mode = d > .5 ? 'd' : (O.t ? 'o' : 'f') + (act === 0 ? 'a' : act === N - 1 ? 'z' : 'm');
  if (mode !== shownMode) { shownMode = mode; setCue(mode); }
}
function setCue(mode) {
  let l1, l2 = '← → sheets · ↗ corner for detail';
  if (mode === 'd') { l1 = '← back to the sheet · esc'; l2 = '&nbsp;'; }
  else if (mode[0] === 'o') l1 = '↑ push up to fold';
  else l1 = '↓ pull down to unfold';
  cue.innerHTML = l1 + '<br>' + l2;
  const f = O.t === 1;
  $('#foldl').textContent = f ? 'fold' : 'unfold';
  $('#foldp').setAttribute('d', f ? 'M8 14V2M3 7l5-5 5 5' : 'M8 2v12M3 9l5 5 5-5');
  $('#fold').setAttribute('aria-pressed', f);
  $('#prev').disabled = P.t === 0; $('#next').disabled = P.t === N - 1;
  $('#prev').style.opacity = P.t === 0 ? .35 : 1; $('#next').style.opacity = P.t === N - 1 ? .35 : 1;
}

/* actions: every one has a button and a key. Detail never traps: any navigation just closes it first. */
const snap = (a, t) => { a.t = clamp(Math.round(t), 0, a.max); };
let lastMsg = '';
function say() { const m = `Sheet ${P.t + 1} of ${N}, ${D[P.t].w}. ${Dd.t ? 'Detail open.' : O.t ? 'Unfolded.' : 'Folded.'}`; if (m !== lastMsg) { lastMsg = m; $('#live').textContent = m; try { navigator.vibrate && !RM && navigator.vibrate(5); } catch (e) {} } shownMode = ''; }
function used() { if (!interacted) { interacted = true; clearTimeout(nudge); } }
function go(k) { if (Dd.t) { closeDetail(); return; } snap(P, k); say(); kick(); }
function fold(v) { if (Dd.t) { closeDetail(); return; } snap(O, v); say(); kick(); }
function openDetail() { snap(Dd, 1); say(); kick(); }
function closeDetail() { snap(Dd, 0); say(); kick(); }
$('#prev').onclick = () => { used(); go(P.t - 1); };
$('#next').onclick = () => { used(); go(P.t + 1); };
$('#fold').onclick = () => { used(); fold(O.t ? 0 : 1); };
const rub = (v, m) => v < 0 ? v * .35 : v > m ? m + (v - m) * .35 : v;

/* gestures */
let G = null;
stage.addEventListener('pointerdown', (e) => {
  if (e.target.closest('button')) return;
  stage.setPointerCapture(e.pointerId); used();
  G = { id: e.pointerId, x0: e.clientX, y0: e.clientY, lt: e.timeStamp, axis: null, bp: P.x, bo: O.x, v: 0, moved: 0 };
});
stage.addEventListener('pointermove', (e) => {
  if (!G || e.pointerId !== G.id) return;
  const dx = e.clientX - G.x0, dy = e.clientY - G.y0; G.moved = Math.max(G.moved, Math.abs(dx), Math.abs(dy));
  if (Dd.t || Dd.x > .05) return;                 // in detail: a swipe only means "go back" (handled on release)
  if (!G.axis && G.moved > 8) { G.axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y'; (G.axis === 'x' ? P : O).drag = true; stage.classList.add('drag'); kick(); }
  if (!G.axis) return;
  const a = G.axis === 'x' ? P : O, dt = Math.max(1, e.timeStamp - G.lt) / 1000;
  const nx = G.axis === 'x' ? rub(G.bp - dx / (desk ? sw * .8 : sw * .7), a.max) : rub(G.bo + dy / (sh * .72), a.max);   // pull down = unfold, finger follows the free edge
  G.v = clamp(lerp(G.v, (nx - a.x) / dt, .35), -14, 14); a.x = nx; a.v = G.v; G.lt = e.timeStamp;
});
function end(e) {
  if (!G || e.pointerId !== G.id) return;
  const g = G; G = null; stage.classList.remove('drag');
  if (Dd.t) { if (g.moved > 28) closeDetail(); return; }
  if (!g.axis) return;
  const a = g.axis === 'x' ? P : O; a.drag = false;
  a.v = RM || e.timeStamp - g.lt > 90 ? 0 : g.v;
  const from = Math.round(g.axis === 'x' ? g.bp : g.bo);
  snap(a, clamp(Math.round(a.x + a.v * (g.axis === 'x' ? .2 : .14)), from - 1, from + 1));
  say(); kick();
}
stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
let wt = 0;
stage.addEventListener('wheel', (e) => {
  e.preventDefault(); used();
  if (Dd.t) { if (Math.abs(e.deltaX) + Math.abs(e.deltaY) > 30) closeDetail(); return; }
  const h = Math.abs(e.deltaX) > Math.abs(e.deltaY), a = h ? P : O;
  a.drag = true; a.x = rub(a.x + (h ? e.deltaX / 700 : e.deltaY / (sh * .9)), a.max); a.v = 0; kick();
  clearTimeout(wt); wt = setTimeout(() => { P.drag = O.drag = false; snap(P, P.x); snap(O, O.x); say(); kick(); }, 140);
}, { passive: false });
addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key; let ok = true;
  if (k === 'Escape') closeDetail();
  else if (k === 'ArrowRight') go(P.t + 1); else if (k === 'ArrowLeft') go(P.t - 1);
  else if (k === 'ArrowDown') fold(1); else if (k === 'ArrowUp') fold(0);
  else if (/^[1-4]$/.test(k)) go(+k - 1);
  else if (k === 'd' || k === 'D') { Dd.t ? closeDetail() : openDetail(); }
  else ok = false;
  if (ok) { used(); e.preventDefault(); }
});

/* one-time cue: the flap lifts a little by itself so the fold is discoverable (never with reduced motion) */
let nudge = 0;
if (!RM) nudge = setTimeout(() => { if (!interacted) { O.v = 3.2; kick(); } }, 1200);

addEventListener('resize', () => { build(); });
build(); say(); kick();
window.__v5 = { P, O, Dd, go, fold, openDetail, closeDetail, S: () => S };
})();
