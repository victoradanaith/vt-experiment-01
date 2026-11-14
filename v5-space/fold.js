(() => {
'use strict';
const $ = (s) => document.querySelector(s);
const stage = $('#stage'), host = $('#sheets'), idxEl = $('#index'), cue = $('#cue');
const rmq = matchMedia('(prefers-reduced-motion: reduce)');
const forced = /[?&]rm=1/.test(location.search);
let RM = rmq.matches || forced;
rmq.addEventListener && rmq.addEventListener('change', () => { RM = rmq.matches || forced; if (RM) snapAll(); });

/* dummy editorial content: short, invented, nothing real.
   cover (folded) = title, caption, three key facts.  inside (unfolded) = the reading.  detail (corner) = specs. */
const D = [
  { w: 'FOLD', cap: 'A plane, bent once.', f: [['Creases', '1'], ['Planes', '2'], ['Angle', '180° → 0°']], p: 'Paper remembers where it was folded. The crease is the only part of the sheet that has a history.', p2: 'Open it slowly and the history shows: a line that is invisible when flat and sharp when closed.', h: 'Memory', dp: 'Every fold is a decision stored in the material. This sheet keeps exactly one.', s: [['Axis', 'horizontal'], ['Hinge', '50 %'], ['Faces', 'front · back'], ['Resting state', 'folded']] },
  { w: 'LAYER', cap: 'Four sheets, one stack.', f: [['Sheets', '4'], ['Offset', '4 px'], ['Order', 'fixed']], p: 'Each sheet sits on the one below. Moving sideways reveals the next without losing the order.', p2: 'The stack never reshuffles: the sheet you leave is the sheet you can come back to.', h: 'Order', dp: 'Layers make sequence visible. The edge of the next sheet is always a hint of what follows.', s: [['Visible', '1 + 3 edges'], ['Gesture', 'swipe sideways'], ['Return', 'swipe back'], ['State kept', 'fold level']] },
  { w: 'CREASE', cap: 'The line that decides.', f: [['Axis', 'horizontal'], ['Position', '50 %'], ['Shadow', 'follows angle']], p: 'Everything that moves on this page moves around one line. Remove it and the sheet is only a rectangle.', p2: 'The shadow is the proof the line is real: dark while it bends, gone when it lies flat.', h: 'Hinge', dp: 'A hinge allows movement in one direction only, which is why the gesture is easy to learn.', s: [['Freedom', '1 degree'], ['Range', '0° – 180°'], ['Snap', 'open / closed'], ['Ends', 'rubber band']] },
  { w: 'EDGE', cap: 'Where the sheet ends.', f: [['Corner', 'top right'], ['Fold', 'diagonal'], ['Beneath', 'charcoal']], p: 'A corner turned back shows what is underneath. The page is thin, so the underside is always close.', p2: 'Tap the corner and the sheet peels along a diagonal until nothing is left covering the page.', h: 'Underside', dp: 'The back of a page is the one place a design can be honest about being paper.', s: [['Trigger', 'tap corner'], ['Peel', 'diagonal'], ['Back', 'button · esc · swipe'], ['Layer', 'above sheet']] }
];
const N = D.length, R = .5;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const pad2 = (n) => String(n).padStart(2, '0');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/* geometry: the sheet is as wide and as tall as the screen allows; folded, the cover is half of it and the index fills the rest */
const probe = document.createElement('div');
probe.style.cssText = 'position:fixed;left:0;top:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom) 0';
document.body.appendChild(probe);
let W = 0, H = 0, desk = false, sw = 0, sh = 0, yc = 0, fh = 0, sx = 0, topY = 0, availH = 0, rh = 52;
function measure() {
  W = innerWidth; H = innerHeight; desk = W >= 900 && W > H;
  const cs = getComputedStyle(probe), safeT = parseFloat(cs.paddingTop) || 0, safeB = parseFloat(cs.paddingBottom) || 0;
  topY = safeT + (desk ? 44 : 36);
  const bottom = safeB + (desk ? 72 : 64);
  availH = H - topY - bottom;
  sw = desk ? Math.min(500, W * .34) : W - 24;
  sh = desk ? Math.min(availH, sw * 1.5) : availH;
  sh = Math.round(sh / 2) * 2; yc = Math.round(R * sh); fh = sh - yc;
  sx = desk ? W * .62 - sw / 2 : 12;
  rh = clamp((sh - yc - 14) / N, 44, 88);
  stage.style.setProperty('--k', clamp(fh / 340, .78, 1.2).toFixed(3));
  stage.style.setProperty('--rh', rh + 'px');
}

/* printed faces. text blocks are laid out by fraction of the available height so nothing collides on short screens */
const CH = '#191918', CB = '#2147ff', MONO = 'ui-monospace, Menlo, monospace', SANS = 'Helvetica Neue, Arial Narrow, Arial, sans-serif';
const fit = (text, w, h, max, lh) => { for (let s = max; s > 12; s -= .5) if (Math.ceil(text.length * s * .53 / w) * s * lh <= h) return s; return 12; };
const fo = (x, y, w, h, html, size, lh, extra) => `<foreignObject x="${x}" y="${y}" width="${w}" height="${h}"><div xmlns="http://www.w3.org/1999/xhtml" style="font:400 ${size}px/${lh} Helvetica Neue,Arial,sans-serif;color:${CH};text-transform:none;letter-spacing:0;${extra || ''}">${html}</div></foreignObject>`;
function inside(d, i) {                                      // the open sheet: sw x sh
  const m = 18, c = 'rgba(25,25,24,.16)', mark = (x, y) => `<path d="M${x - 6} ${y}h12M${x} ${y - 6}v12" stroke="${c}" fill="none"/>`;
  const fs = Math.min(sw * .5, yc * .5), base = 46 + fs * .72, fsz = Math.max(16, Math.min(21, sw * .056));
  const colX = fs * 1.2 + 12, colW = sw - colX - m - 6;
  const dr = Math.min(sw * .36, fh * .3);
  return `<svg width="${sw}" height="${sh}" viewBox="0 0 ${sw} ${sh}" aria-hidden="true">
  <path d="M${m} 0V${sh}M${sw - m} 0V${sh}M0 ${m}H${sw}M0 ${sh - m}H${sw}" stroke="${c}" fill="none"/>
  ${mark(m, m)}${mark(sw - m, m)}${mark(m, sh - m)}${mark(sw - m, sh - m)}
  <circle cx="${sw * .1}" cy="${yc}" r="${sw * .6}" fill="none" stroke="${CB}"/>
  <path d="M${sw} ${sh - dr}A${dr} ${dr} 0 0 0 ${sw - dr} ${sh}H${sw}Z" fill="${CB}"/>
  <text x="${m + 6}" y="${m + 16}" font-family="${MONO}" font-size="10" letter-spacing=".8" fill="${CH}">SHEET ${pad2(i + 1)} — ${d.w}</text>
  <text x="${-fs * .05}" y="${base}" font-family="${SANS}" font-weight="800" font-size="${fs}" letter-spacing="${-fs * .06}" fill="${CH}">${pad2(i + 1)}</text>
  ${fo(colX, 50, colW, fs, `<b style="font-weight:800;font-size:${fsz + 4}px;line-height:1.1;letter-spacing:-.01em">${esc(d.cap)}</b>`, fsz, 1.2)}
  ${fo(m + 6, base + 26, sw - 2 * m - 12, yc - base - 40, esc(d.p), fit(d.p, sw - 2 * m - 12, yc - base - 40, fsz + 1, 1.42), 1.42)}
  <path d="M0 ${yc}h10M${sw - 10} ${yc}h10" stroke="${CH}" stroke-width="1.2"/>
  ${fo(m + 6, yc + 30, sw - 2 * m - 12, fh * .5, esc(d.p2), fit(d.p2, sw - 2 * m - 12, fh * .5, fsz, 1.45), 1.45)}
  <text x="${m + 6}" y="${sh - m - 8}" font-family="${MONO}" font-size="10" letter-spacing=".8" fill="${CH}">↗ SPECS</text>
  </svg>`;
}
function cover(d, i) {                                       // the back of the flap = what you see when folded: sw x fh
  const m = 18, rowH = clamp(fh * .1, 28, 36), fs = Math.min(sw * .3, fh * .27);
  const factsTop = fh - 38 - 3 * rowH, tBase = 40 + fs * .72;
  const capY = tBase + 16, capH = Math.max(26, factsTop - capY - 10);
  const rows = d.f.map((r, k) => { const y = factsTop + k * rowH; return `<path d="M${m} ${y}H${sw - m}" stroke="${CH}" stroke-width=".8"/><text x="${m}" y="${y + rowH / 2 + 4}" font-family="${MONO}" font-size="10.5" letter-spacing=".8" fill="${CH}">${r[0].toUpperCase()}</text><text x="${sw - m}" y="${y + rowH / 2 + 4}" text-anchor="end" font-family="${MONO}" font-size="10.5" letter-spacing=".8" fill="${CH}">${esc(r[1]).toUpperCase()}</text>`; }).join('');
  return `<svg width="${sw}" height="${fh}" viewBox="0 0 ${sw} ${fh}" aria-hidden="true">
  <rect x="${m}" y="${m}" width="9" height="9" fill="${CB}"/>
  <text x="${m + 17}" y="${m + 8}" font-family="${MONO}" font-size="10" letter-spacing=".8" fill="${CH}">SHEET ${pad2(i + 1)} / 04</text>
  <text x="${sw - m}" y="${m + 8}" text-anchor="end" font-family="${MONO}" font-size="10" letter-spacing=".8" fill="${CH}">${pad2(i + 1)}</text>
  <text x="${-fs * .03}" y="${tBase}" font-family="${SANS}" font-weight="800" font-size="${fs}" letter-spacing="${-fs * .05}" fill="${CH}">${d.w}</text>
  ${fo(m, capY, sw - 2 * m, capH, esc(d.cap), Math.max(15, Math.min(19, sw * .05)), 1.25, 'font-weight:600')}
  ${rows}<path d="M${m} ${factsTop + 3 * rowH}H${sw - m}" stroke="${CH}" stroke-width=".8"/>
  <path d="M${m} ${fh - 22}h14M${m + 7} ${fh - 29}v14" stroke="${CB}" stroke-width="1.4" fill="none" transform="rotate(0)"/>
  <text x="${m + 24}" y="${fh - 18}" font-family="${MONO}" font-size="10" letter-spacing=".8" fill="${CH}">PULL DOWN TO UNFOLD</text>
  </svg>`;
}

/* build */
let S = [], rows = [];
function build() {
  measure();
  host.replaceChildren(); idxEl.replaceChildren(); S = []; rows = [];
  D.forEach((d, i) => {
    const el = document.createElement('div'); el.className = 'sheet'; el.style.width = sw + 'px'; el.style.height = sh + 'px';
    el.innerHTML = `
    <div class="part top" style="width:${sw}px;height:${yc}px"><div style="position:absolute;left:0;top:0">${inside(d, i)}</div><div class="shade"></div></div>
    <div class="part flap" style="top:${yc}px;width:${sw}px;height:${fh}px">
      <div class="face front"><div style="position:absolute;left:0;top:${-yc}px">${inside(d, i)}</div><div class="shade"></div></div>
      <div class="face back">${cover(d, i)}</div>
    </div>
    <div class="det" style="width:${sw}px">
      <div class="bg"></div>
      <div class="body"><h3>${d.h}</h3><p>${esc(d.dp)}</p><dl>${d.s.map(r => `<div><dt>${r[0]}</dt><dd>${r[1]}</dd></div>`).join('')}</dl></div>
      <svg class="flapsvg" aria-hidden="true"><polygon class="sh" fill="rgba(0,0,0,.5)"/><polygon class="fp" fill="#2147ff"/></svg>
    </div>
    <button type="button" class="ear" aria-label="Open specs for sheet ${i + 1}: ${d.w}"></button>
    <button type="button" class="close" aria-label="Close specs"><svg viewBox="0 0 16 16"><path d="M10 2 4 8l6 6"/></svg></button>`;
    host.appendChild(el);
    const q = (s) => el.querySelector(s);
    const o = { el, flap: q('.flap'), tsh: q('.top .shade'), fsh: q('.flap .face.front .shade'), det: q('.det'), bg: q('.det .bg'), body: q('.det .body'), sp: q('.flapsvg .sh'), fp: q('.flapsvg .fp'), ear: q('.ear'), back: q('.close') };
    o.ear.onclick = () => { used(); openDetail(); };
    o.back.onclick = () => { used(); closeDetail(); };
    o.ear.addEventListener('pointerdown', (e) => e.stopPropagation());
    S.push(o);
    const li = document.createElement('li');
    li.innerHTML = `<button type="button"><span class="n">${pad2(i + 1)}</span><span class="t">${d.w}</span><span class="c">${esc(d.cap)}</span></button>`;
    li.firstChild.onclick = () => { used(); go(i); };
    idxEl.appendChild(li); rows.push(li.firstChild);
  });
  idxEl.style.left = sx + 'px'; idxEl.style.width = sw + 'px'; idxEl.style.top = (topY + yc + 14) + 'px';
  shownIdx = -1; shownMode = '';
  render();
}

/* three axes: sheet, fold, peel. each is a mass on a spring. */
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

/* corner peel geometry */
function corner(a, Hv) {
  const poly = [[0, 0], [sw, 0], [sw, Hv], [0, Hv]], f = (p) => a - ((sw - p[0]) + p[1]), out = [];
  for (let i = 0; i < 4; i++) {
    const A = poly[i], B = poly[(i + 1) % 4], fa = f(A), fb = f(B);
    if (fa >= 0) out.push(A);
    if ((fa >= 0) !== (fb >= 0)) { const t = fa / (fa - fb); out.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t]); }
  }
  return out;
}
const reflect = (p, a) => { const k = Math.SQRT1_2, c = (sw - a) * k, dd = (p[0] * k - p[1] * k) - c; return [p[0] - 2 * dd * k, p[1] + 2 * dd * k]; };
const pts = (poly) => poly.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
const cp = (poly) => 'polygon(' + poly.map(p => p[0].toFixed(1) + 'px ' + p[1].toFixed(1) + 'px').join(',') + ')';

let shownIdx = -1, shownMode = '';
function render() {
  const p = clamp(P.x, -.35, N - 1 + .35), o = O.x, oc = clamp(o, 0, 1), d = clamp(Dd.x, 0, 1);
  const theta = Math.acos(2 * oc - 1) * 180 / Math.PI;       // 180° folded over -> 0° flat
  const s = Math.sin(theta * Math.PI / 180);
  const vis = yc + fh * Math.max(0, 2 * oc - 1);               // visible paper height; the sheet is anchored at the top, so the finger and the free edge move together
  const act = clamp(Math.round(p), 0, N - 1);
  S.forEach((sh_, i) => {
    const k = i - p;
    let tx = sx, ty = topY, sc = 1, rot = 0, op = 1, z;
    if (k < 0) { tx = sx + k * (sw + 60); rot = k * 5; op = clamp(1 + k * 1.1, 0, 1); z = 120; }
    else { tx = sx + k * 4; ty = topY; sc = 1; op = k > 3.2 ? 0 : 1; z = 100 - Math.round(k * 10); }
    sh_.el.style.transform = `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
    sh_.el.style.opacity = op.toFixed(2); sh_.el.style.zIndex = z;
    sh_.flap.style.transform = `rotateX(${theta.toFixed(2)}deg) translateZ(-.5px)`;
    sh_.tsh.style.opacity = (.75 * s).toFixed(3);
    sh_.fsh.style.opacity = (.6 * s).toFixed(3);
    const di = i === act ? d : 0, a = lerp(36, sw + vis + 6, di), poly = corner(a, vis);
    sh_.det.style.height = vis + 'px';
    sh_.bg.style.clipPath = cp(poly);
    const fl = poly.map(q => reflect(q, a));
    sh_.fp.setAttribute('points', pts(fl)); sh_.sp.setAttribute('points', pts(fl.map(q => [q[0] + 5, q[1] + 6])));
    sh_.fp.style.opacity = sh_.sp.style.opacity = di > .985 ? 0 : 1;
    sh_.body.style.opacity = i === act ? clamp((d - .45) / .45, 0, 1).toFixed(2) : 0;
    sh_.back.style.opacity = i === act ? clamp((d - .6) / .3, 0, 1).toFixed(2) : 0;
    sh_.back.style.pointerEvents = i === act && d > .6 ? 'auto' : 'none';
    sh_.det.style.pointerEvents = i === act && d > .15 ? 'auto' : 'none';
    sh_.ear.disabled = i !== act || d > .05; sh_.ear.tabIndex = (i === act && d <= .05) ? 0 : -1;
    sh_.back.tabIndex = (i === act && d > .6) ? 0 : -1;
    sh_.ear.style.left = (sw - 48) + 'px'; sh_.ear.style.right = 'auto';
    sh_.el.inert = (i !== act);
  });
  /* the index sits under the folded cover; the flap sweeps over it as the sheet opens */
  const ia = clamp(1 - oc * 2.4, 0, 1);
  idxEl.style.opacity = ia.toFixed(2); idxEl.inert = oc > .3; idxEl.style.pointerEvents = oc > .3 ? 'none' : 'auto';
  if (act !== shownIdx) { shownIdx = act; $('#cnum').textContent = pad2(act + 1); $('#bigidx').textContent = pad2(act + 1); rows.forEach((b, k) => { if (k === act) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); }); }
  const mode = d > .5 ? 'd' : (O.t ? 'o' : 'f');
  if (mode !== shownMode) { shownMode = mode; setCue(mode); }
}
function setCue(mode) {
  cue.innerHTML = mode === 'd' ? '← back · esc' : mode === 'o' ? '↑ push up to fold<br>↗ corner: specs' : '↓ pull down to unfold<br>← → sheets';
  const f = O.t === 1;
  $('#foldl').textContent = f ? 'fold' : 'unfold';
  $('#foldp').setAttribute('d', f ? 'M8 14V2M3 7l5-5 5 5' : 'M8 2v12M3 9l5 5 5-5');
  $('#fold').setAttribute('aria-pressed', f);
  $('#prev').disabled = P.t === 0; $('#next').disabled = P.t === N - 1;
  $('#prev').style.opacity = P.t === 0 ? .35 : 1; $('#next').style.opacity = P.t === N - 1 ? .35 : 1;
}

/* actions: every one has a button and a key. detail never traps: any navigation just closes it first. */
const snap = (a, t) => { a.t = clamp(Math.round(t), 0, a.max); };
let lastMsg = '';
function say() { const m = `Sheet ${P.t + 1} of ${N}, ${D[P.t].w}. ${Dd.t ? 'Specs open.' : O.t ? 'Unfolded.' : 'Folded.'}`; if (m !== lastMsg) { lastMsg = m; $('#live').textContent = m; try { if (interacted && navigator.vibrate && !RM) navigator.vibrate(5); } catch (e) {} } shownMode = ''; }
function used() { if (!interacted) { interacted = true; clearTimeout(nudge); } }
function go(k) { if (Dd.t) { closeDetail(); return; } snap(P, k); say(); kick(); }
function fold(v) { if (Dd.t) { closeDetail(); return; } snap(O, v); say(); kick(); }
function openDetail() { snap(Dd, 1); say(); kick(); }
function closeDetail() { snap(Dd, 0); say(); kick(); }
$('#prev').onclick = () => { used(); go(P.t - 1); };
$('#next').onclick = () => { used(); go(P.t + 1); };
$('#fold').onclick = () => { used(); fold(O.t ? 0 : 1); };
const rub = (v, m) => v < 0 ? v * .35 : v > m ? m + (v - m) * .35 : v;

/* gestures. the pointer is captured only once a swipe starts, so taps on index rows still work. */
let G = null;
stage.addEventListener('pointerdown', (e) => {
  if (e.target.closest('.bar, .ear')) return;
  used();
  G = { id: e.pointerId, x0: e.clientX, y0: e.clientY, lt: e.timeStamp, axis: null, bp: P.x, bo: O.x, v: 0, moved: 0 };
});
stage.addEventListener('pointermove', (e) => {
  if (!G || e.pointerId !== G.id) return;
  const dx = e.clientX - G.x0, dy = e.clientY - G.y0; G.moved = Math.max(G.moved, Math.abs(dx), Math.abs(dy));
  if (Dd.t || Dd.x > .05) return;
  if (!G.axis && G.moved > 8) { G.axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y'; (G.axis === 'x' ? P : O).drag = true; stage.classList.add('drag'); try { stage.setPointerCapture(e.pointerId); } catch (_) {} kick(); }
  if (!G.axis) return;
  const a = G.axis === 'x' ? P : O, dt = Math.max(1, e.timeStamp - G.lt) / 1000;
  const nx = G.axis === 'x' ? rub(G.bp - dx / (desk ? sw * .8 : sw * .7), a.max) : rub(G.bo + dy / (sh * .45), a.max);   // pull down = unfold
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

let nudge = 0;
if (!RM) nudge = setTimeout(() => { if (!interacted) { O.v = 3.2; kick(); } }, 1200);
addEventListener('resize', () => { build(); });
build(); say(); kick();
window.__v5 = { P, O, Dd, go, fold, openDetail, closeDetail, S: () => S, dims: () => ({ W, H, sw, sh, yc, fh, topY, rh }) };
})();
