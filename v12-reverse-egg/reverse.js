(() => {
'use strict';
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t * t * (3 - 2 * t);
const root = document.documentElement;
if (/[?&]rm=1/.test(location.search)) root.classList.add('rm');
const RM = () => root.classList.contains('rm') || matchMedia('(prefers-reduced-motion: reduce)').matches;
const INK = '#161616', SHELLHEX = '#F8F4EE', YOLK = '#FFC104';
const SHELL = [248, 244, 238], INKRGB = [22, 22, 22];

/* ---------------------------------------------------------------------------------------------
   The story runs backwards. It opens on the fried egg that already sits in the logo (the O of
   TOKEN: a ring around a yolk) and scrolls down, step by step, to the raw egg.
   Format, Deliver and Review happen after the frying, so they live inside "Result".
   Copy is concept only: no live service, customer, result, price or integration is claimed.
   --------------------------------------------------------------------------------------------- */
const STEPS = [
  { egg: 'FRIED', t: 'Result',
    sub: ['Finished work, in one piece', 'งานที่เสร็จ ครบในชิ้นเดียว'],
    say: ['Formatted, delivered and recorded. Start here, then trace it back.', 'จัดรูปแบบ ส่งต่อ และบันทึกเรียบร้อย เริ่มตรงนี้ แล้วย้อนกลับไปดูว่ามาจากไหน'],
    what: ['The end of the flow: the output is shaped for the receiver, sent through the agreed channel and logged.', 'ปลายทางของการไหล: ผลลัพธ์ถูกจัดให้ตรงกับผู้รับ ส่งผ่านช่องทางที่ตกลง และมีบันทึก'],
    aim: ['You can see what arrived, and trust where it came from.', 'เห็นว่าอะไรมาถึง และเชื่อใจได้ว่ามาจากไหน'],
    sample: ['A one-page order summary reaches the warehouse team, with the send time logged.', 'สรุปคำสั่งซื้อหนึ่งหน้าถึงทีมคลังสินค้า พร้อมบันทึกเวลาที่ส่ง'] },
  { egg: 'COOKING', t: 'Process',
    sub: ['Made by rules', 'เกิดจากกฎ'],
    say: ['Rules written once turned the input into this result.', 'กฎที่เขียนไว้ครั้งเดียวเปลี่ยนข้อมูลเข้าให้เป็นผลลัพธ์นี้'],
    what: ['Calculating, sorting, routing and approvals, applied the same way to every item.', 'คำนวณ จัดหมวด ส่งต่อ และขออนุมัติ ใช้วิธีเดียวกับทุกชิ้น'],
    aim: ['The same criteria every time, traceable afterwards.', 'เกณฑ์เดียวกันทุกครั้ง ย้อนตรวจได้'],
    sample: ['An amount above the limit is routed to a manager.', 'ยอดเกินที่กำหนดถูกส่งให้ผู้จัดการอนุมัติ'] },
  { egg: 'CRACKED', t: 'Start',
    sub: ['Something set it off', 'มีบางอย่างเริ่มมัน'],
    say: ['An event began the work: a new form, an email, a deadline.', 'เหตุการณ์หนึ่งเริ่มงาน: ฟอร์มใหม่ อีเมล หรือเวลาที่ถึง'],
    what: ['The trigger is defined once. Each time it fires, the flow starts the same way.', 'กำหนดตัวเริ่มครั้งเดียว ทุกครั้งที่เกิดขึ้น งานเริ่มแบบเดียวกัน'],
    aim: ['Work begins without someone remembering to ask.', 'งานเริ่มโดยไม่ต้องมีคนคอยสั่ง'],
    sample: ['A new order form arrives and the approval step begins.', 'ฟอร์มสั่งซื้อใหม่เข้ามา ขั้นตอนอนุมัติเริ่มต้น'] },
  { egg: 'WHOLE', t: 'Clean',
    sub: ['Checked before use', 'ตรวจก่อนใช้'],
    say: ['Missing fields, duplicates and wrong formats were caught first.', 'จับช่องที่ขาด ข้อมูลซ้ำ และรูปแบบที่ผิดก่อนใช้งาน'],
    what: ['Each item is checked. Safe fixes are made; the rest is flagged for a person.', 'ตรวจทีละรายการ แก้เฉพาะที่แก้ได้อย่างปลอดภัย ที่เหลือส่งให้คนดู'],
    aim: ['Everything enters the flow in the same shape.', 'ทุกอย่างเข้าสู่การไหลในรูปแบบเดียวกัน'],
    sample: ['A phone number missing a digit is flagged for a person.', 'เบอร์โทรขาดหนึ่งหลักถูกติดธงให้คนยืนยัน'] },
  { egg: 'COLD STORE', t: 'Collect',
    sub: ['Gathered in one place', 'รวมมาไว้ที่เดียว'],
    say: ['Forms, chats, emails and files were brought into one queue.', 'ฟอร์ม แชท อีเมล และไฟล์ ถูกรวมเข้าคิวเดียว'],
    what: ['Items from several channels are pulled into one place, untouched.', 'ดึงรายการจากหลายช่องทางมาไว้ที่เดียว โดยยังไม่แตะต้อง'],
    aim: ['Less searching across tools.', 'ลดการไล่หาข้อมูลข้ามหลายเครื่องมือ'],
    sample: ['One order from a form and one from email, side by side in the same queue.', 'คำสั่งซื้อจากฟอร์มหนึ่งรายการและจากอีเมลหนึ่งรายการ อยู่ในคิวเดียวกัน'] },
  { egg: 'RAW', t: 'Raw',
    sub: ['Where it begins', 'จุดเริ่มต้นของมัน'],
    say: ['Raw data: scattered, uneven, still whole. This is the material.', 'ข้อมูลดิบ: กระจัดกระจาย ไม่เท่ากัน แต่ยังครบ นี่คือวัตถุดิบ'],
    what: ['The untouched input: messages, forms, spreadsheets and files, each in its own format.', 'ข้อมูลนำเข้าที่ยังไม่แตะต้อง: ข้อความ ฟอร์ม สเปรดชีต และไฟล์ ซึ่งแต่ละอย่างมีรูปแบบของตัวเอง'],
    aim: ['Know exactly what you start from, so every later step can be traced back to it.', 'รู้ชัดว่าเริ่มจากอะไร เพื่อให้ทุกขั้นหลังจากนั้นย้อนกลับมาหาได้'],
    sample: ['A chat message, a pasted spreadsheet row and a photo of a receipt.', 'ข้อความแชทหนึ่งข้อความ แถวสเปรดชีตที่วางมา และรูปใบเสร็จหนึ่งใบ'] }
];
const LBL = {
  step: [['What happens', 'เกิดอะไรขึ้น'], ['Aim', 'เป้าหมาย'], ['Sample · invented', 'ตัวอย่าง · สมมติ'], ['At scale', 'เมื่อมีจำนวนมาก']],
  intro: [['How to read', 'วิธีอ่าน'], ['What a token is', 'token คืออะไร'], ['Status', 'สถานะ'], ['Controls', 'การควบคุม']]
};
const CTRL = ['Buttons and arrow keys work too: down goes toward the raw egg, up goes back. A toggles AUTO, L switches language, I opens details.', 'ใช้ปุ่มหรือลูกศรได้เช่นกัน: ลงคือไปทางไข่ดิบ ขึ้นคือย้อนกลับ A เปิด/ปิด AUTO, L สลับภาษา, I เปิดรายละเอียด'];
const STATUS = ['Concept prototype with invented sample content. No live service, customers, results, prices or integrations are claimed.', 'ต้นแบบแนวคิดพร้อมเนื้อหาตัวอย่างที่สมมติขึ้น ไม่มีการอ้างว่าเปิดให้บริการ มีลูกค้า ผลลัพธ์ ราคา หรือ integration'];
const TOKEN = ['One order, one form, one request: a single unit of work. It has nothing to do with crypto.', 'หนึ่งคำสั่งซื้อ หนึ่งฟอร์ม หนึ่งคำขอ คืองานหนึ่งหน่วย ไม่เกี่ยวกับคริปโต'];
const INTRO = {
  title: 'Less work.\nMore flow.', lab: '00 / CONCEPT',
  sub: ['Trace it back', 'ย้อนรอยกลับไป'],
  say: ['The O in TOKEN is a fried egg. Scroll down to follow it back to the raw egg.', 'ตัว O ใน TOKEN คือไข่ดาว เลื่อนลงเพื่อย้อนรอยกลับไปหาไข่ดิบ'],
  r: [['Scroll or swipe down to go back from the finished result to the raw material. Swipe sideways to see many tokens at once.', 'เลื่อนหรือปัดลงเพื่อย้อนจากผลลัพธ์ที่เสร็จแล้วไปหาวัตถุดิบ ปัดไปด้านข้างเพื่อดู token จำนวนมากพร้อมกัน'], TOKEN, STATUS, CTRL]
};
const NC = STEPS.length + 1;           // 0 intro (logo), 1..6 steps
const LASTC = NC - 1;
const COUNT = [['1 token', '1 token'], ['3 tokens', '3 token'], ['9 tokens', '9 token'], ['36 tokens', '36 token'], ['endless', 'ไม่รู้จบ']];
const Q_LABEL = ['×1', '×3', '×9', '×36', '∞'];
const UI = {
  cue0: ['↓ scroll down', '↓ เลื่อนลง'], cueH: ['↔ swipe for more tokens', '↔ ปัดข้างเพื่อดู token เพิ่ม'],
  scaleHand: ['By hand: every item is touched one by one, so more items means more work, and the last ones trail behind.', 'ทำด้วยมือ: แตะทีละชิ้น ยิ่งมากยิ่งงานเพิ่ม ชิ้นท้ายๆ ตามหลัง'],
  scaleAuto: ['AUTO: one set of rules moves every item together.', 'AUTO: กฎชุดเดียวขับทุกชิ้นพร้อมกัน'],
  ill: [' (Illustration, not data.)', ' (ภาพประกอบ ไม่ใช่ข้อมูลจริง)']
};
let L = 1;
try { if (localStorage.getItem('v12lang') === 'en') L = 0; } catch (_) {}

/* ---------------------------------------------------------------------------------------------
   The O of TOKEN, measured on the real exported logo (1575 x 1122 px). The ring and yolk drawn
   during the hand-off are placed from these numbers, so they overlay the logo's own O exactly
   before it lifts out and grows into the egg.
   --------------------------------------------------------------------------------------------- */
const LOGO = { w: 1575, o: { x: 422, y: 1069, rx: 55.3, ry: 52.5 }, i: { x: 422, y: 1071, rx: 32.5, ry: 35 }, y: { x: 421.85, y: 1072.95, r: 32 } };

/* ---- one egg, continuous across chapters. ring, disc, split, yolk, yolkR, yolkY, ring2, dash, ovoid, specks ---- */
const VK = [
  [.8, 0, 0, 1, .46, 0, 0, 0, 0, 0],
  [.8, 0, 0, 1, .46, 0, 0, 0, 0, 0],        // 1 result: the fried egg, exactly the O of the logo
  [.52, .33, .35, .65, .46, 0, 0, 0, 0, 0], // 2 process: the white and yolk are still taking shape
  [0, .95, 1, 0, .46, 0, 0, 0, 0, 0],       // 3 start: the shell opens
  [0, .95, 0, 0, .46, 0, 0, 0, 0, 0],       // 4 clean: whole and tidy
  [.8, 0, 0, 0, .46, 0, 0, 0, 1, .7],      // 5 collect: an egg outline, the pieces gather round it
  [.3, .95, 0, 0, .46, 0, 0, 0, 1, 1]       // 6 raw: a whole raw egg, data scattered around it
];
const SPK = []; { let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647; for (let k = 0; k < 24; k++) SPK.push({ a: r() * 6.2832, d: 1.28 + r() * .3, r: .035 + r() * .055 }); }
const P = new Array(10);
let FGC = INK;
function ovo(c, x, y, R, ov) {
  c.beginPath();
  const sx = lerp(1, .82, ov), sy = lerp(1, 1.08, ov), sk = .12 * ov;
  if (R < 14) { c.ellipse(x, y, R * sx, R * sy, 0, 0, 6.2832); return; }   // tiny eggs: a plain ellipse is indistinguishable and much cheaper
  for (let i = 0; i <= 28; i++) { const a = i / 28 * 6.2832, px = x + R * sx * Math.sin(a) * (1 - sk * Math.cos(a)), py = y - R * sy * Math.cos(a); i ? c.lineTo(px, py) : c.moveTo(px, py); }
  c.closePath();
}
function morph(c, x, y, R, s, alpha) {
  const a = clamp(Math.floor(s), 0, LASTC - 1), t = ease(clamp(s - a, 0, 1)), A = VK[a], B = VK[a + 1];
  for (let i = 0; i < 10; i++) P[i] = lerp(A[i], B[i], t);
  const ov = P[8];
  c.lineWidth = clamp(R * .07, 1, 3); c.strokeStyle = FGC; c.fillStyle = FGC;
  if (P[1] > .01) {
    c.globalAlpha = P[1] * alpha;
    const g = R * .2 * P[2];
    if (P[2] > .001) { c.save(); c.translate(x, y); c.rotate(-.18 * P[2]); c.beginPath(); c.arc(0, -g, R, Math.PI, 0); c.fill(); c.beginPath(); c.arc(0, g, R, 0, Math.PI); c.fill(); c.restore(); }
    else if (ov > .01) { ovo(c, x, y, R, ov); c.fill(); }
    else { c.beginPath(); c.arc(x, y, R, 0, 6.2832); c.fill(); }
  }
  if (P[0] > .01) { c.globalAlpha = P[0] * alpha; if (ov > .01) { ovo(c, x, y, R, ov); } else { c.beginPath(); c.arc(x, y, R, 0, 6.2832); } c.stroke(); }
  if (P[3] > .01) { c.globalAlpha = P[3] * alpha; c.fillStyle = YOLK; c.beginPath(); c.arc(x, y + P[5] * R, P[4] * R, 0, 6.2832); c.fill(); }
  if (P[9] > .01 && R >= 14) { c.globalAlpha = P[9] * alpha; c.fillStyle = YOLK; for (let k = 0; k < SPK.length; k++) { const q = SPK[k]; c.beginPath(); c.arc(x + Math.cos(q.a) * q.d * R, y + Math.sin(q.a) * q.d * R, q.r * R, 0, 6.2832); c.fill(); } }
  c.globalAlpha = 1;
}

/* ---- the lattice: eggs live on one fixed grid; zooming out only reveals more of it ---- */
const NL = 5, LAGK = [0, .5, 1.3, 2.3, 3.4];
let auto = false, interacted = false, zoomed = false, W = 360, H = 400;
const S = { x: 0, t: 0 };                                   // chapter position: driven by the page scroll
const Z = { x: 0, v: 0, t: 0, drag: false, max: NL - 1 };   // zoom position: 1 -> 3 -> 9 -> 36 -> endless
let LV = [];
function levels() {
  const m = Math.min(W, H);
  const p = [m * .8, Math.min(W / 3, H), m / 3.2, m / 6.4, clamp(m / 36, 6, 14)];
  const half = (n, pp) => Math.ceil(n / pp / 2) + 1;
  LV = [
    { p: p[0], cx: 0, cy: 0, i0: 0, i1: 0, j0: 0, j1: 0 },
    { p: p[1], cx: 0, cy: 0, i0: -1, i1: 1, j0: 0, j1: 0 },
    { p: p[2], cx: 0, cy: 0, i0: -1, i1: 1, j0: -1, j1: 1 },
    { p: p[3], cx: -.5, cy: -.5, i0: -3, i1: 2, j0: -3, j1: 2 },
    { p: p[4], cx: -.5, cy: -.5, i0: -half(W, p[4]), i1: half(W, p[4]), j0: -half(H, p[4]), j1: half(H, p[4]) }
  ];
  LV.forEach(l => { l.cols = l.i1 - l.i0 + 1; l.rows = l.j1 - l.j0 + 1; });
}
let cvEl, ctx, dpr = 1, drawn = 0;
const stage = $('#stage'), scroller = $('#scroller'), hero = $('#hero');
function size() {
  const w = Math.floor(stage.clientWidth), h = Math.floor(stage.clientHeight);
  if (w < 20 || h < 20) return false;
  W = w; H = h; dpr = Math.min(3, devicePixelRatio || 1);
  cvEl.width = w * dpr; cvEl.height = h * dpr; cvEl.style.width = w + 'px'; cvEl.style.height = h + 'px';
  levels(); return true;
}

/* depth: light above, dark below. Chapters 4 to 6 sit on Ink; the text colour flips at the half-way point. */
let bgShown = '', fgShown = '';
function paintBg(sx) {
  const dk = ease(clamp(sx - 3, 0, 1)), bg = SHELL.map((v, i) => Math.round(lerp(v, INKRGB[i], dk))), s = `rgb(${bg})`;
  if (s !== bgShown) { bgShown = s; root.style.setProperty('--bg', s); }
  const dark = dk > .5, fg = dark ? SHELL : INKRGB, f = fg.join(',');
  if (f !== fgShown) { fgShown = f; FGC = dark ? SHELLHEX : INK; root.style.setProperty('--fg', `rgb(${f})`); root.style.setProperty('--fgrgb', f); }
  const t = clamp(sx, 0, 1);       // the small mark and the text label take turns, never overlap
  $('#logo').style.opacity = (clamp(2 * t - 1, 0, 1) * (1 - clamp(2 * dk, 0, 1))).toFixed(3);
  $('#bt').style.opacity = clamp(clamp(1 - 2 * t, 0, 1) + clamp(2 * dk - 1, 0, 1), 0, 1).toFixed(3);
  hero.style.opacity = (1 - clamp(t / .6, 0, 1)).toFixed(3);
  $('#tag').classList.toggle('on', sx > LASTC - .5);
}
/* the hand-off: the logo's own O lifts out of the wordmark and grows into the fried egg */
function junction(t) {
  const hr = hero.getBoundingClientRect(), sr = stage.getBoundingClientRect(), k = hr.width / LOGO.w, e = ease(t);
  const px = (u, dx = 0) => hr.left - sr.left + u * k, py = v => hr.top - sr.top + v * k;
  const R0 = LV[0].p * .36, lw = clamp(R0 * .07, 1, 3), cx = W / 2, cy = H / 2, O = LOGO.o, I = LOGO.i, Y = LOGO.y;
  ctx.fillStyle = INK; ctx.globalAlpha = lerp(1, .8, e);
  const ox = lerp(px(O.x), cx, e), oy = lerp(py(O.y), cy, e), ix = lerp(px(I.x), cx, e), iy = lerp(py(I.y), cy, e);
  ctx.beginPath();
  ctx.ellipse(ox, oy, lerp(O.rx * k, R0 + lw / 2, e), lerp(O.ry * k, R0 + lw / 2, e), 0, 0, 6.2832);
  ctx.moveTo(ix + lerp(I.rx * k, R0 - lw / 2, e), iy);
  ctx.ellipse(ix, iy, lerp(I.rx * k, R0 - lw / 2, e), lerp(I.ry * k, R0 - lw / 2, e), 0, 0, 6.2832);
  ctx.fill('evenodd');
  ctx.globalAlpha = 1; ctx.fillStyle = YOLK; ctx.beginPath();
  ctx.arc(lerp(px(Y.x), cx, e), lerp(py(Y.y), cy, e), lerp(Y.r * k, .46 * R0, e), 0, 6.2832); ctx.fill();
}
function draw() {
  if (!LV.length) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
  const rm = RM(), sx = rm ? Math.round(S.x) : S.x;
  paintBg(sx);
  const t = clamp(sx, 0, 1), zl = rm ? Math.round(Z.x) : Z.x;
  if (t < 1 && zl < .02) { drawn = t > 0 ? 1 : 1; junction(t); return; }
  const ea = t, sl = Math.max(1, sx);
  const k0 = clamp(Math.floor(zl + 1e-6), 0, NL - 1), f = clamp(zl - k0, 0, 1), k1 = Math.min(NL - 1, k0 + 1), e = ease(f);
  const A = LV[k0], B = LV[k1], win = f < .001 ? A : B;
  const p = Math.exp(lerp(Math.log(A.p), Math.log(B.p), e)), cx = lerp(A.cx, B.cx, e), cy = lerp(A.cy, B.cy, e);
  const colsW = lerp(A.cols, B.cols, e), rowsW = lerp(A.rows, B.rows, e);
  const lag = auto || rm ? 0 : lerp(LAGK[k0], LAGK[k1], e);
  const R = p * .36, hx = W / 2, hy = H / 2; let n = 0;
  for (let j = win.j0; j <= win.j1; j++) {
    const sy = hy + (j - cy) * p; if (sy < -p || sy > H + p) continue;
    const jt = clamp((j - (cy - (rowsW - 1) / 2)) / Math.max(1, rowsW - 1), 0, 1);
    for (let i = win.i0; i <= win.i1; i++) {
      const sxx = hx + (i - cx) * p; if (sxx < -p || sxx > W + p) continue;
      const inA = i >= A.i0 && i <= A.i1 && j >= A.j0 && j <= A.j1;
      const it = clamp((i - (cx - (colsW - 1) / 2)) / Math.max(1, colsW - 1), 0, 1);
      const u = jt * .85 + it * .15;
      morph(ctx, sxx, sy, R, clamp(sl - lag * u, 1, LASTC), (inA ? 1 : e) * ea); n++;
    }
  }
  drawn = n;
}

/* ---- the page scroll drives the story; only the zoom has a spring ---- */
const K = 150, C = 18; let raf = 0, last = 0, pend = false, tgt = null;
function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }
function tick(now) {
  const dt = Math.min(.033, (now - last) / 1000); last = now; let busy = false;
  const o = Z;
  if (o.drag) busy = true;
  else { o.v += ((o.t - o.x) * K - o.v * C) * dt; o.x += o.v * dt; if (Math.abs(o.t - o.x) > .002 || Math.abs(o.v) > .01) busy = true; else { o.x = o.t; o.v = 0; } }
  draw(); ui();
  raf = busy ? requestAnimationFrame(tick) : 0;
}
function later() { if (!pend) { pend = true; requestAnimationFrame(() => { pend = false; draw(); ui(); }); } }
function onScroll() {
  const h = scroller.clientHeight || 1; S.x = clamp(scroller.scrollTop / h, 0, LASTC);
  if (tgt != null && Math.abs(S.x - tgt) < .02) tgt = null;
  S.t = tgt != null ? tgt : clamp(Math.round(S.x), 0, LASTC);
  if (S.t === 0 && Z.t !== 0) { Z.t = 0; if (RM()) { Z.x = 0; Z.v = 0; } kick(); }
  if (scroller.scrollTop > 20) used();
  later();
}
scroller.addEventListener('scroll', () => { onScroll(); settleSoon(); }, { passive: true });
/* safety net: if the browser leaves the scroll between two chapters, finish the move to the nearest one */
let touching = false, st_ = 0;
scroller.addEventListener('touchstart', () => { touching = true; }, { passive: true });
const untouch = () => { touching = false; settleSoon(); };
scroller.addEventListener('touchend', untouch, { passive: true }); scroller.addEventListener('touchcancel', untouch, { passive: true });
function settleSoon() {
  clearTimeout(st_);
  st_ = setTimeout(() => {
    if (touching || tgt != null) return;
    const h = scroller.clientHeight || 1, n = clamp(Math.round(scroller.scrollTop / h), 0, LASTC);
    if (Math.abs(scroller.scrollTop - n * h) > 2) scroller.scrollTo({ top: n * h, behavior: RM() ? 'auto' : 'smooth' });
  }, 220);
}
function used() { if (!interacted) { interacted = true; } }
function goCh(i) {
  used(); i = clamp(Math.round(i), 0, LASTC); const h = scroller.clientHeight || 1;
  tgt = Math.abs(scroller.scrollTop / h - i) < .02 ? null : i; S.t = i;
  scroller.scrollTo({ top: i * h, behavior: RM() ? 'auto' : 'smooth' }); ui(true);
}
function goZoom(i) { if (S.t === 0) return; used(); zoomed = true; Z.t = clamp(Math.round(i), 0, NL - 1); if (RM()) { Z.x = Z.t; Z.v = 0; draw(); ui(); } else kick(); ui(true); }
function setAuto(v) { used(); auto = v; $('#b-auto').setAttribute('aria-pressed', auto); draw(); fillSheet(); announce(); }

/* ---- text ---- */
const pad2 = n => String(n).padStart(2, '0');
let shownC = -1, shownZ = -1;
const chData = c => c === 0 ? INTRO : STEPS[c - 1];
const kind = c => c === 0 ? 'intro' : 'step';
function setText() {
  const c = Math.max(0, shownC), d = chData(c), k = kind(c);
  $('#head').dataset.k = k;
  $('#lab').textContent = k === 'step' ? `${pad2(c)} / ${d.egg}` : d.lab;
  $('#ttl').textContent = k === 'step' ? d.t : d.title;
  $('#sub').textContent = d.sub[L]; $('#say').textContent = d.say[L];
  $('#b-top').hidden = c !== LASTC;
  $('#cnt').textContent = `${pad2(c)} / ${pad2(LASTC)}`;
  [...$('#rail').children].forEach((li, i) => li.classList.toggle('on', i === c));
  fillSheet(); cueText();
}
function fillSheet() {
  const c = Math.max(0, shownC), d = chData(c), k = kind(c), z = Math.max(0, shownZ);
  $('#sh-title').textContent = k === 'step' ? `${pad2(c)} ${d.egg} · ${d.t}` : d.lab;
  const lb = LBL[k];
  for (let i = 0; i < 4; i++) $('#d' + (i + 1)).textContent = lb[i][L];
  let rows;
  if (k === 'step') {
    const cnt = z === 4 ? (L ? 'token จำนวนมาก' : 'a great many tokens') : COUNT[z][L];
    rows = [d.what[L], d.aim[L], d.sample[L], (L ? `ตอนนี้มี ${cnt} ` : `Showing ${cnt}. `) + (auto ? UI.scaleAuto[L] : UI.scaleHand[L]) + UI.ill[L]];
  } else rows = d.r.map(r => r[L]);
  for (let i = 0; i < 4; i++) $('#r' + (i + 1)).textContent = rows[i];
  $('#note').textContent = k === 'step' ? STATUS[L] : '';
}
function cueText() {
  const cue = $('#cue'), c = Math.max(0, shownC);
  let txt = '', h = false;
  if (!interacted && c === 0) txt = UI.cue0[L];
  else if (c === 1 && !zoomed) { txt = UI.cueH[L]; h = true; }
  cue.className = 'cue' + (h ? ' h' : ''); cue.textContent = ''; if (txt) { const i = document.createElement('i'); i.textContent = txt; cue.appendChild(i); }
}
function ui(force) {
  const cur = force ? S.t : clamp(Math.round(S.x), 0, LASTC);
  $('#b-up').disabled = S.t === 0; $('#b-down').disabled = S.t === LASTC;
  $('#b-less').disabled = Z.t === 0 || S.t === 0; $('#b-more').disabled = Z.t === NL - 1 || S.t === 0;
  const ci = clamp(cur, 0, LASTC), zi = clamp(Math.round(force ? Z.t : Z.x), 0, NL - 1);
  if (ci !== shownC) {
    shownC = ci; setText();
    if (!RM()) { const h = $('#head'); h.classList.remove('sw'); void h.offsetWidth; h.classList.add('sw'); }
    queue();
  }
  if (zi !== shownZ) { shownZ = zi; $('#q').textContent = Q_LABEL[zi]; $('#eggs').textContent = COUNT[zi][L]; fillSheet(); queue(); }
  $('#eggs').style.visibility = shownC === 0 ? 'hidden' : 'visible';
}
let qt = 0; const queue = () => { clearTimeout(qt); qt = setTimeout(announce, 350); };
function announce() {
  const c = Math.max(0, shownC), d = chData(c);
  $('#live').textContent = c ? `${c} of ${LASTC}: ${d.t}, ${d.sub[L]}. ${COUNT[Math.max(0, shownZ)][L]}. ${auto ? 'AUTO' : (L ? 'ทำด้วยมือ' : 'By hand')}.` : `${d.title.replace('\n', ' ')}. ${d.sub[L]}.`;
}
function setLang(l) {
  L = l; root.lang = L ? 'th' : 'en';
  const b = $('#b-lang'); b.textContent = L ? 'EN' : 'TH'; b.setAttribute('aria-label', L ? 'Switch language to English' : 'สลับเป็นภาษาไทย');
  $('#eggs').textContent = COUNT[Math.max(0, shownZ)][L]; if (shownC >= 0) setText(); announce();
  try { localStorage.setItem('v12lang', L ? 'th' : 'en'); } catch (_) {}
}

/* ---- details: optional. Close button, Esc and the browser's Back all return to the story. ---- */
const sheet = $('#sheet'), info = $('#b-info'), closeB = $('#b-close');
let sheetOpen = false, hist = false;
const wide = () => matchMedia('(min-width:900px) and (orientation:landscape)').matches;
function setSheet(v, fromPop) {
  if (v === sheetOpen) return;
  sheetOpen = v; sheet.hidden = !v; info.setAttribute('aria-expanded', v);
  scroller.inert = v && !wide(); $('#capRow').inert = v && !wide();
  if (v) { used(); if (!fromPop) { try { history.pushState({ d: 1 }, '', '#detail'); hist = true; } catch (_) { hist = false; } } closeB.focus(); }
  else { if (!fromPop && hist) { hist = false; try { history.back(); } catch (_) {} } info.focus(); }
}
info.onclick = () => setSheet(!sheetOpen);
closeB.onclick = () => setSheet(false);
addEventListener('popstate', () => { if (sheetOpen) { hist = false; setSheet(false, true); } });

/* ---- gestures: vertical scroll is native (with snap, one chapter at a time); sideways changes how many tokens ---- */
let g = null;
const rub = (v, hi) => v < 0 ? v * .35 : v > hi ? hi + (v - hi) * .35 : v;
const unitX = () => clamp(W * .5, 150, 320);
scroller.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button !== 0) return; g = { id: e.pointerId, mouse: e.pointerType === 'mouse', x: e.clientX, y: e.clientY, z0: Z.x, axis: null, s: [{ t: e.timeStamp, x: e.clientX }] }; });
scroller.addEventListener('pointermove', e => {
  if (!g || g.id !== e.pointerId) return;
  const dx = e.clientX - g.x, dy = e.clientY - g.y;
  g.s.push({ t: e.timeStamp, x: e.clientX }); if (g.s.length > 10) g.s.shift();
  if (!g.axis) {
    if (Math.hypot(dx, dy) < 10) return;
    g.axis = Math.abs(dx) > Math.abs(dy) * 1.1 ? 'x' : 'y';
    if (g.axis === 'x' && S.t === 0) { g = null; return; }
    if (g.axis === 'y') { if (!g.mouse) { g = null; return; } }      // touch scrolls natively
    else { try { scroller.setPointerCapture(g.id); } catch (_) {} Z.drag = true; Z.v = 0; kick(); used(); }
  }
  if (g.axis === 'y') { if (!g.done && Math.abs(dy) > 60) { g.done = true; goCh(S.t + (dy < 0 ? 1 : -1)); } }
  else { Z.x = rub(g.z0 - dx / unitX(), Z.max); zoomed = true; kick(); }
});
function endG(e, cancel) {
  if (!g || g.id !== e.pointerId) return; const gg = g; g = null;
  if (gg.axis !== 'x') return;
  const a = gg.s[0], b = gg.s[gg.s.length - 1]; let v = 0;
  if (!cancel && b.t - a.t > 10 && e.timeStamp - b.t < 120) v = clamp(-(b.x - a.x) / unitX() / ((b.t - a.t) / 1000), -9, 9);
  const base = Math.round(gg.z0);
  Z.drag = false; Z.t = clamp(clamp(Math.round(Z.x + v * .15), base - 1, base + 1), 0, Z.max);
  if (RM()) { Z.x = Z.t; Z.v = 0; draw(); ui(); } else { Z.v = v * .6; kick(); }
  ui(true);
}
scroller.addEventListener('pointerup', e => endG(e, false)); scroller.addEventListener('pointercancel', e => endG(e, true));
let wl = false, wt = 0;
scroller.addEventListener('wheel', e => {
  if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;     // vertical wheel scrolls the story natively
  e.preventDefault(); clearTimeout(wt); wt = setTimeout(() => { wl = false; }, 160); if (wl) return;
  if (Math.abs(e.deltaX) < 6) return; wl = true; goZoom(Z.t + Math.sign(e.deltaX));
}, { passive: false });

$('#b-up').onclick = () => goCh(S.t - 1);
$('#b-down').onclick = () => goCh(S.t + 1);
$('#b-less').onclick = () => goZoom(Z.t - 1);
$('#b-more').onclick = () => goZoom(Z.t + 1);
$('#b-auto').onclick = () => setAuto(!auto);
$('#b-lang').onclick = () => setLang(L ? 0 : 1);
$('#b-top').onclick = () => goCh(1);
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key;
  if (k === 'Escape' && sheetOpen) { setSheet(false); return; }
  const onBtn = e.target.closest && e.target.closest('button');
  if (k === 'ArrowDown' || k === 'PageDown') { e.preventDefault(); goCh(S.t + 1); }
  else if (k === 'ArrowUp' || k === 'PageUp') { e.preventDefault(); goCh(S.t - 1); }
  else if (k === 'ArrowRight') { e.preventDefault(); goZoom(Z.t + 1); }
  else if (k === 'ArrowLeft') { e.preventDefault(); goZoom(Z.t - 1); }
  else if (k === ' ' && !onBtn) { e.preventDefault(); goCh(S.t + (e.shiftKey ? -1 : 1)); }
  else if (k === 'a' || k === 'A') setAuto(!auto);
  else if (k === 'i' || k === 'I') setSheet(!sheetOpen);
  else if (k === 'l' || k === 'L') setLang(L ? 0 : 1);
  else if (/^[0-6]$/.test(k)) goCh(+k);
  else if (k === 'Home') { e.preventDefault(); goCh(0); }
  else if (k === 'End') { e.preventDefault(); goCh(LASTC); }
});

cvEl = $('#cv'); ctx = cvEl.getContext('2d');
for (let i = 0; i < NC; i++) { $('#rail').appendChild(document.createElement('li')); const pg = document.createElement('div'); pg.className = 'pg'; scroller.appendChild(pg); }
let rz = 0;
const resize = () => { if (size()) { const h = scroller.clientHeight || 1; scroller.scrollTo({ top: S.t * h, behavior: 'auto' }); draw(); } };
addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(resize, 80); });
if (window.ResizeObserver) new ResizeObserver(() => { clearTimeout(rz); rz = setTimeout(resize, 40); }).observe(stage);
hero.addEventListener('load', () => draw());
size(); setLang(L); draw(); ui(true);
window.__vr = { goCh, goZoom, setAuto, setSheet, setLang, redraw: draw, get ch() { return S.x; }, get chT() { return S.t; }, get zoom() { return Z.x; }, get zT() { return Z.t; }, get auto() { return auto; }, get drawn() { return drawn; }, get sheetOpen() { return sheetOpen; }, get lang() { return L; }, LV: () => LV, dims: () => ({ W, H }), junction: (t) => { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); junction(t); }, NC, NL, LOGO };
})();
