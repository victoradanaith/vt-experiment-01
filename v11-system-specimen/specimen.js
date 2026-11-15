(() => {
'use strict';
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t * t * (3 - 2 * t);
const root = document.documentElement;
if (/[?&]rm=1/.test(location.search)) root.classList.add('rm');
const RM = () => root.classList.contains('rm') || matchMedia('(prefers-reduced-motion: reduce)').matches;
const INK = '#161616', YOLK = '#FFC104';
const SHELL = [248, 244, 238], YOLKRGB = [255, 193, 4];

/* ---------------------------------------------------------------------------------------------
   Concept copy. Title stays English (Montserrat); sub, body and details follow the language.
   Nothing here claims a live service, a customer, a result, a price or an integration.
   --------------------------------------------------------------------------------------------- */
const STEPS = [
  { egg: 'COLD', t: 'Collect',
    sub: ['One place for scattered data', 'ข้อมูลทุกทางมาอยู่ที่เดียว'],
    say: ['Forms, chats, emails and files land in one place.', 'ฟอร์ม แชท อีเมล และไฟล์ มารวมกันที่เดียว'],
    what: ['Pulls items from several channels into one queue. Nothing is changed yet.', 'ดึงรายการจากหลายช่องทางเข้าคิวเดียว ยังไม่แก้ไขอะไร'],
    aim: ['Less searching across tools.', 'ลดการไล่หาข้อมูลข้ามหลายเครื่องมือ'],
    sample: ['One order from a form joins the queue.', 'คำสั่งซื้อ 1 รายการจากฟอร์มเข้าคิว'] },
  { egg: 'PREP', t: 'Clean',
    sub: ['Ready to use', 'ให้พร้อมใช้'],
    say: ['Missing fields, duplicates and wrong formats get caught.', 'จับช่องที่ขาด ข้อมูลซ้ำ และรูปแบบที่ผิด'],
    what: ['Checks each item, fixes what is safe to fix, and flags the rest for a person.', 'ตรวจทีละรายการ แก้เฉพาะที่แก้ได้อย่างปลอดภัย ที่เหลือส่งให้คนดู'],
    aim: ['Every item enters the next step in the same shape.', 'ทุกรายการเข้าขั้นต่อไปในรูปแบบเดียวกัน'],
    sample: ['A phone number missing a digit is flagged for a person.', 'เบอร์โทรขาดหนึ่งหลักถูกติดธงให้คนยืนยัน'] },
  { egg: 'CRACK', t: 'Start',
    sub: ['An event begins the work', 'เหตุการณ์หนึ่งเริ่มงาน'],
    say: ['A new form, email or deadline starts the flow by itself.', 'ฟอร์มใหม่ อีเมลเข้า หรือถึงเวลา ก็เริ่มงานได้เอง'],
    what: ['You define the trigger once. The flow starts the same way every time.', 'กำหนดตัวเริ่มครั้งเดียว งานเริ่มแบบเดียวกันทุกครั้ง'],
    aim: ['Work begins without someone remembering to ask.', 'งานเริ่มโดยไม่ต้องมีคนคอยสั่ง'],
    sample: ['A new form arrives and an approval step begins.', 'ฟอร์มใหม่เข้ามา ขั้นตอนอนุมัติเริ่มต้น'] },
  { egg: 'FRY', t: 'Process',
    sub: ['Rules, applied evenly', 'กฎเดียว ใช้เท่ากันทุกชิ้น'],
    say: ['Calculate, sort, route or ask for approval by written rules.', 'คำนวณ จัดหมวด ส่งต่อ หรือขออนุมัติ ตามกฎที่เขียนไว้'],
    what: ['Rules are written once and applied to every item, with a record of why.', 'เขียนกฎครั้งเดียว ใช้กับทุกชิ้น พร้อมบันทึกเหตุผล'],
    aim: ['The same criteria every time, traceable afterwards.', 'เกณฑ์เดียวกันทุกครั้ง ย้อนตรวจได้'],
    sample: ['An amount above the limit is sent to a manager.', 'ยอดเกินที่กำหนดถูกส่งให้ผู้จัดการอนุมัติ'] },
  { egg: 'PLATE', t: 'Format',
    sub: ['Shaped for the receiver', 'จัดให้ตรงกับผู้รับ'],
    say: ['Results arrive in the shape the next person or system expects.', 'ผลลัพธ์อยู่ในรูปแบบที่ผู้รับหรือระบบถัดไปใช้ได้เลย'],
    what: ['Turns results into a summary, a sheet row or a document.', 'แปลงผลเป็นสรุป แถวในชีต หรือเอกสาร'],
    aim: ['The receiver does not have to reformat.', 'ผู้รับไม่ต้องจัดรูปแบบซ้ำ'],
    sample: ['A one-page summary with a reference number.', 'สรุปหนึ่งหน้าพร้อมเลขอ้างอิง'] },
  { egg: 'SERVE', t: 'Deliver',
    sub: ['Sent where it is needed', 'ส่งถึงที่ที่ต้องใช้'],
    say: ['Notify a person or update another system, with proof it was sent.', 'แจ้งคนหรืออัปเดตระบบอื่น พร้อมหลักฐานว่าส่งแล้ว'],
    what: ['Sends through the agreed channel and records when and to whom.', 'ส่งผ่านช่องทางที่ตกลงกัน และบันทึกว่าส่งเมื่อไรถึงใคร'],
    aim: ['You can see whether the work arrived.', 'เห็นว่างานไปถึงแล้วหรือยัง'],
    sample: ['The warehouse team is notified and the time is logged.', 'แจ้งทีมคลังสินค้าและบันทึกเวลาที่ส่ง'] },
  { egg: 'WASH', t: 'Review',
    sub: ['Log, check, improve', 'บันทึก ตรวจ ปรับปรุง'],
    say: ['Record what happened, flag exceptions, tune the rules.', 'บันทึกสิ่งที่เกิดขึ้น ติดธงรายการผิดปกติ แล้วปรับกฎ'],
    what: ['Keeps a log, marks exceptions and feeds what was learned into the next round.', 'เก็บบันทึก ติดธงรายการผิดปกติ และนำสิ่งที่เรียนรู้ไปปรับรอบถัดไป'],
    aim: ['Auditable, and ready for the next batch.', 'ตรวจย้อนหลังได้ และพร้อมรับงานชุดต่อไป'],
    sample: ['One unusual item is flagged for review.', 'รายการผิดปกติ 1 ชิ้นถูกติดธงให้ทบทวน'] }
];
const LBL = {
  step: [['What happens', 'เกิดอะไรขึ้น'], ['Aim', 'เป้าหมาย'], ['Sample · invented', 'ตัวอย่าง · สมมติ'], ['At scale', 'เมื่อมีจำนวนมาก']],
  intro: [['How to read', 'วิธีอ่าน'], ['What a token is', 'token คืออะไร'], ['Status', 'สถานะ'], ['Controls', 'การควบคุม']],
  outro: [['The idea', 'แนวคิด'], ['Next', 'ขั้นต่อไป'], ['Status', 'สถานะ'], ['Controls', 'การควบคุม']]
};
const CTRL = ['Buttons and arrow keys work too. A toggles AUTO, L switches language, I opens details.', 'ใช้ปุ่มหรือลูกศรบนคีย์บอร์ดได้ A เปิด/ปิด AUTO, L สลับภาษา, I เปิดรายละเอียด'];
const STATUS = ['Concept prototype with invented sample content. No live service, customers, results, prices or integrations are claimed.', 'ต้นแบบแนวคิดพร้อมเนื้อหาตัวอย่างที่สมมติขึ้น ไม่มีการอ้างว่าเปิดให้บริการ มีลูกค้า ผลลัพธ์ ราคา หรือ integration'];
const TOKEN = ['One order, one form, one request: a single unit of work. It has nothing to do with crypto.', 'หนึ่งคำสั่งซื้อ หนึ่งฟอร์ม หนึ่งคำขอ คืองานหนึ่งหน่วย ไม่เกี่ยวกับคริปโต'];
const INTRO = {
  title: 'Less work.\nMore flow.', lab: '00 / CONCEPT',
  sub: ['Data and automation', 'งานข้อมูลและ automation'],
  say: ['One egg, seven steps: how scattered work can become one calm flow.', 'ไข่หนึ่งฟอง เจ็ดขั้นตอน: งานที่กระจัดกระจายกลายเป็นการไหลที่เรียบง่ายได้อย่างไร'],
  r: [['Swipe up to follow one token through seven steps. Swipe sideways to see many tokens at once.', 'ปัดขึ้นเพื่อดู token หนึ่งชิ้นผ่านเจ็ดขั้นตอน ปัดไปด้านข้างเพื่อดู token จำนวนมากพร้อมกัน'], TOKEN, STATUS, CTRL]
};
const OUTRO = {
  title: 'Human energy.\nClear systems.', lab: '08 / END',
  sub: ['Build with clarity', 'สร้างด้วยความชัดเจน'],
  say: ['Leave room for the unexpected.', 'เปิดพื้นที่ให้สิ่งใหม่'],
  r: [['Collect, clean, start, process, format, deliver, review: one flow for data and automation work.', 'รวบรวม ตรวจจัด เริ่ม ประมวลผล จัดรูปแบบ ส่งต่อ ทบทวน: การไหลเดียวสำหรับงานข้อมูลและ automation'],
      ['A real conversation would start from your own process. This page has no form and sends nothing.', 'บทสนทนาจริงควรเริ่มจากขั้นตอนงานของคุณเอง หน้านี้ไม่มีฟอร์มและไม่ส่งข้อมูลใดๆ'], STATUS, CTRL]
};
const NC = STEPS.length + 2;          // 0 intro, 1..7 steps, 8 outro
const LASTC = NC - 1;
const COUNT = [['1 token', '1 token'], ['3 tokens', '3 token'], ['9 tokens', '9 token'], ['36 tokens', '36 token'], ['endless', 'ไม่รู้จบ']];
const Q_LABEL = ['×1', '×3', '×9', '×36', '∞'];
const UI = {
  cue0: ['↑ swipe up', '↑ ปัดขึ้น'], cueH: ['↔ swipe for more tokens', '↔ ปัดข้างเพื่อดู token เพิ่ม'],
  scaleHand: ['By hand: every item is touched one by one, so more items means more work, and the last ones trail behind.', 'ทำด้วยมือ: แตะทีละชิ้น ยิ่งมากยิ่งงานเพิ่ม ชิ้นท้ายๆ ตามหลัง'],
  scaleAuto: ['AUTO: one set of rules moves every item together.', 'AUTO: กฎชุดเดียวขับทุกชิ้นพร้อมกัน'],
  ill: [' (Illustration, not data.)', ' (ภาพประกอบ ไม่ใช่ข้อมูลจริง)']
};
let L = 1;                                   // 0 = EN, 1 = TH
try { const sv = localStorage.getItem('v11lang'); if (sv === 'en') L = 0; } catch (_) {}

/* ---------------------------------------------------------------------------------------------
   One egg, continuous between states (as in v9-morph / v10). Ink on shell, yolk as the signal.
   --------------------------------------------------------------------------------------------- */
const NS = STEPS.length, NL = 5, LAGK = [0, .5, 1.3, 2.3, 3.4];
let auto = false, interacted = false, zoomed = false, W = 360, H = 400;
const S = { x: 0, v: 0, t: 0, drag: false, max: LASTC };   // chapter position
const Z = { x: 0, v: 0, t: 0, drag: false, max: NL - 1 };  // zoom position
// ringA, discA, split, yolkA, yolkR, yolkY, ring2A, dashA
const KEYS = [
  [.5, 0, 0, 0, .46, 0, 0, 0], [0, .95, 0, 0, .46, 0, 0, 0], [0, .95, 1, 0, .46, 0, 0, 0], [.8, 0, 0, 1, .46, 0, 0, 0],
  [.8, 0, 0, 1, .4, 0, .5, 0], [.25, 0, 0, .75, .34, -.4, 0, 0], [0, 0, 0, 0, .34, -.4, 0, .6]
];
const P = new Array(8);
function morph(c, x, y, R, s, alpha) {
  const a = clamp(Math.floor(s), 0, NS - 2), t = ease(clamp(s - a, 0, 1)), A = KEYS[a], B = KEYS[a + 1];
  for (let i = 0; i < 8; i++) P[i] = lerp(A[i], B[i], t);
  c.lineWidth = clamp(R * .07, 1, 3);
  if (P[1] > .01) {
    c.globalAlpha = P[1] * alpha; c.fillStyle = INK;
    const g = R * .2 * P[2];
    if (P[2] > .001) { c.save(); c.translate(x, y); c.rotate(-.18 * P[2]); c.beginPath(); c.arc(0, -g, R, Math.PI, 0); c.fill(); c.beginPath(); c.arc(0, g, R, 0, Math.PI); c.fill(); c.restore(); }
    else { c.beginPath(); c.arc(x, y, R, 0, 6.2832); c.fill(); }
  }
  c.strokeStyle = INK;
  if (P[0] > .01) { c.globalAlpha = P[0] * alpha; c.beginPath(); c.arc(x, y, R, 0, 6.2832); c.stroke(); }
  if (P[6] > .01) { c.globalAlpha = P[6] * alpha; c.beginPath(); c.arc(x, y, R * 1.32, 0, 6.2832); c.stroke(); }
  if (P[7] > .01) { c.globalAlpha = P[7] * alpha; c.setLineDash([R * .3, R * .35]); c.beginPath(); c.arc(x, y, R * 1.1, 0, 6.2832); c.stroke(); c.setLineDash([]); }
  if (P[3] > .01) { c.globalAlpha = P[3] * alpha; c.fillStyle = YOLK; c.beginPath(); c.arc(x, y + P[5] * R, P[4] * R, 0, 6.2832); c.fill(); }
  c.globalAlpha = 1;
}

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
function size() {
  const st = $('#stage'), w = Math.floor(st.clientWidth), h = Math.floor(st.clientHeight);
  if (w < 20 || h < 20) return false;
  W = w; H = h; dpr = Math.min(3, devicePixelRatio || 1);
  cvEl.width = w * dpr; cvEl.height = h * dpr; cvEl.style.width = w + 'px'; cvEl.style.height = h + 'px';
  levels(); return true;
}
let bgShown = '';
function paintBg(sx) {
  const k = clamp(sx - (LASTC - 1), 0, 1), e = ease(k);
  const c = SHELL.map((v, i) => Math.round(lerp(v, YOLKRGB[i], e))), s = `rgb(${c})`;
  if (s !== bgShown) { bgShown = s; root.style.setProperty('--bg', s); }
  const lg = clamp(sx, 0, 1) * (1 - clamp((sx - (LASTC - 1)) * 2, 0, 1));
  $('#logo').style.opacity = lg.toFixed(3); $('#bt').style.opacity = (1 - lg).toFixed(3);
  $('#hero').style.opacity = (1 - clamp(sx, 0, 1)).toFixed(3);
}
function draw() {
  if (!LV.length) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
  const rm = RM();
  const sx = rm ? Math.round(S.x) : S.x;
  paintBg(sx);
  const ea = clamp(sx, 0, 1);                       // the egg fades in as the logo fades out
  const zl = rm ? Math.round(Z.x) : Z.x, sl = clamp(sx - 1, 0, NS - 1);
  if (ea < .005) { drawn = 0; return; }
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
      morph(ctx, sxx, sy, R, clamp(sl - lag * u, 0, NS - 1), (inA ? 1 : e) * ea); n++;
    }
  }
  drawn = n;
}

/* ---- springs ---- */
const K = 150, C = 18; let raf = 0, last = 0;
function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }
function tick(now) {
  const dt = Math.min(.033, (now - last) / 1000); last = now; let busy = false;
  for (const o of [S, Z]) {
    if (o.drag) { busy = true; continue; }
    o.v += ((o.t - o.x) * K - o.v * C) * dt; o.x += o.v * dt;
    if (Math.abs(o.t - o.x) > .002 || Math.abs(o.v) > .01) busy = true; else { o.x = o.t; o.v = 0; }
  }
  draw(); ui();
  raf = busy ? requestAnimationFrame(tick) : 0;
}
function snap(o) { o.x = o.t; o.v = 0; draw(); ui(); }
function used() { if (!interacted) { interacted = true; } }
function goCh(i) { used(); S.t = clamp(Math.round(i), 0, S.max); if (RM()) snap(S); else kick(); ui(true); }
function goZoom(i) { if (S.t === 0) return; used(); zoomed = true; Z.t = clamp(Math.round(i), 0, NL - 1); if (RM()) snap(Z); else kick(); ui(true); }
function setAuto(v) { used(); auto = v; $('#b-auto').setAttribute('aria-pressed', auto); draw(); fillSheet(); announce(); }

/* ---- text ---- */
const pad2 = n => String(n).padStart(2, '0');
let shownC = -1, shownZ = -1;
const chData = c => c === 0 ? INTRO : c === LASTC ? OUTRO : STEPS[c - 1];
const kind = c => c === 0 ? 'intro' : c === LASTC ? 'outro' : 'step';
function setText() {
  const c = Math.max(0, shownC), d = chData(c), k = kind(c);
  $('#head').dataset.k = k;
  $('#lab').textContent = k === 'step' ? `${pad2(c)} / ${d.egg}` : d.lab;
  $('#ttl').textContent = k === 'step' ? d.t : d.title;
  $('#sub').textContent = d.sub[L]; $('#say').textContent = d.say[L];
  $('#b-top').hidden = k !== 'outro';
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
  $('#b-up').disabled = S.t === 0; $('#b-down').disabled = S.t === S.max;
  $('#b-less').disabled = Z.t === 0 || S.t === 0; $('#b-more').disabled = Z.t === NL - 1 || S.t === 0;
  const ci = clamp(Math.round(force ? S.t : S.x), 0, S.max), zi = clamp(Math.round(force ? Z.t : Z.x), 0, NL - 1);
  let changed = false;
  if (ci !== shownC) {
    shownC = ci; changed = true; setText();
    if (!RM()) { const h = $('#head'); h.classList.remove('sw'); void h.offsetWidth; h.classList.add('sw'); }
    queue();
  }
  if (zi !== shownZ) {
    shownZ = zi; $('#q').textContent = Q_LABEL[zi]; $('#eggs').textContent = COUNT[zi][L]; fillSheet(); queue();
  }
  $('#eggs').style.visibility = shownC === 0 ? 'hidden' : 'visible';
  if (changed) $('#b-up').setAttribute('aria-label', 'Previous');
}
let qt = 0; const queue = () => { clearTimeout(qt); qt = setTimeout(announce, 350); };
function announce() {
  const c = Math.max(0, shownC), d = chData(c), k = kind(c);
  $('#live').textContent = k === 'step' ? `${c} of ${NS}: ${d.t}, ${d.sub[L]}. ${COUNT[Math.max(0, shownZ)][L]}. ${auto ? 'AUTO' : (L ? 'ทำด้วยมือ' : 'By hand')}.` : `${d.title.replace('\n', ' ')}. ${d.sub[L]}.`;
}
function setLang(l) {
  L = l; root.lang = L ? 'th' : 'en';
  const b = $('#b-lang'); b.textContent = L ? 'EN' : 'TH'; b.setAttribute('aria-label', L ? 'Switch language to English' : 'สลับเป็นภาษาไทย');
  $('#eggs').textContent = COUNT[Math.max(0, shownZ)][L]; if (shownC >= 0) setText(); announce();
  try { localStorage.setItem('v11lang', L ? 'th' : 'en'); } catch (_) {}
}

/* ---- details: optional. Close button, Esc and the browser's Back all return to the field. ---- */
const sheet = $('#sheet'), info = $('#b-info'), closeB = $('#b-close');
let sheetOpen = false, hist = false;
const wide = () => matchMedia('(min-width:900px) and (orientation:landscape)').matches;
function setSheet(v, fromPop) {
  if (v === sheetOpen) return;
  sheetOpen = v; sheet.hidden = !v; info.setAttribute('aria-expanded', v);
  stage.inert = v && !wide(); $('#capRow').inert = v && !wide();
  if (v) { used(); if (!fromPop) { try { history.pushState({ d: 1 }, '', '#detail'); hist = true; } catch (_) { hist = false; } } closeB.focus(); }
  else { if (!fromPop && hist) { hist = false; try { history.back(); } catch (_) {} } info.focus(); }
  setTimeout(() => { if (size()) draw(); }, 0);
}
info.onclick = () => setSheet(!sheetOpen);
closeB.onclick = () => setSheet(false);
addEventListener('popstate', () => { if (sheetOpen) { hist = false; setSheet(false, true); } });

/* ---- gestures: vertical moves through the story, horizontal changes how many tokens ---- */
const stage = $('#stage'); let g = null;
const rub = (v, hi) => v < 0 ? v * .35 : v > hi ? hi + (v - hi) * .35 : v;
const unitY = () => clamp(H / 3.2, 110, 200), unitX = () => clamp(W * .5, 150, 320);
stage.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button !== 0) return; g = { id: e.pointerId, x: e.clientX, y: e.clientY, s0: S.x, z0: Z.x, axis: null, s: [{ t: e.timeStamp, x: e.clientX, y: e.clientY }] }; });
stage.addEventListener('pointermove', e => {
  if (!g || g.id !== e.pointerId) return;
  const dx = e.clientX - g.x, dy = e.clientY - g.y;
  g.s.push({ t: e.timeStamp, x: e.clientX, y: e.clientY }); if (g.s.length > 10) g.s.shift();
  if (!g.axis) {
    if (Math.hypot(dx, dy) < 10) return;
    g.axis = Math.abs(dx) > Math.abs(dy) * 1.1 ? 'x' : 'y';
    if (g.axis === 'x' && S.t === 0) { g = null; return; }   // nothing to zoom on the first screen
    try { stage.setPointerCapture(g.id); } catch (_) {}
    stage.classList.add('drag'); used();
    const o = g.axis === 'x' ? Z : S; o.drag = true; o.v = 0; kick();
  }
  if (g.axis === 'y') S.x = rub(g.s0 - dy / unitY(), S.max);
  else { Z.x = rub(g.z0 - dx / unitX(), Z.max); zoomed = true; }
  kick();
});
function endG(e, cancel) {
  if (!g || g.id !== e.pointerId) return; const gg = g; g = null; stage.classList.remove('drag');
  if (!gg.axis) return;
  const o = gg.axis === 'x' ? Z : S, unit = gg.axis === 'x' ? unitX() : unitY();
  const a = gg.s[0], b = gg.s[gg.s.length - 1]; let v = 0;
  if (!cancel && b.t - a.t > 10 && e.timeStamp - b.t < 120) { const d = gg.axis === 'x' ? -(b.x - a.x) : -(b.y - a.y); v = clamp(d / unit / ((b.t - a.t) / 1000), -9, 9); }
  const base = Math.round(gg.axis === 'x' ? gg.z0 : gg.s0);   // one gesture moves at most one step: every chapter gets read
  o.drag = false; o.t = clamp(clamp(Math.round(o.x + v * .15), base - 1, base + 1), 0, o.max);
  if (RM()) snap(o); else { o.v = v * .6; kick(); }
  ui(true);
}
stage.addEventListener('pointerup', e => endG(e, false)); stage.addEventListener('pointercancel', e => endG(e, true));
let wl = false, wt = 0;
stage.addEventListener('wheel', e => {
  e.preventDefault(); clearTimeout(wt); wt = setTimeout(() => { wl = false; }, 160); if (wl) return;
  const ax = Math.abs(e.deltaX) > Math.abs(e.deltaY), d = ax ? e.deltaX : e.deltaY; if (Math.abs(d) < 6) return;
  wl = true; if (ax) goZoom(Z.t + Math.sign(d)); else goCh(S.t + Math.sign(d));
}, { passive: false });

$('#b-up').onclick = () => goCh(S.t - 1);
$('#b-down').onclick = () => goCh(S.t + 1);
$('#b-less').onclick = () => goZoom(Z.t - 1);
$('#b-more').onclick = () => goZoom(Z.t + 1);
$('#b-auto').onclick = () => setAuto(!auto);
$('#b-lang').onclick = () => setLang(L ? 0 : 1);
$('#b-top').onclick = () => goCh(0);
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key;
  if (k === 'Escape' && sheetOpen) { setSheet(false); return; }
  if (k === 'ArrowDown' || k === 'PageDown') { e.preventDefault(); goCh(S.t + 1); }
  else if (k === 'ArrowUp' || k === 'PageUp') { e.preventDefault(); goCh(S.t - 1); }
  else if (k === 'ArrowRight') { e.preventDefault(); goZoom(Z.t + 1); }
  else if (k === 'ArrowLeft') { e.preventDefault(); goZoom(Z.t - 1); }
  else if (k === 'a' || k === 'A') setAuto(!auto);
  else if (k === 'i' || k === 'I') setSheet(!sheetOpen);
  else if (k === 'l' || k === 'L') setLang(L ? 0 : 1);
  else if (/^[0-8]$/.test(k)) goCh(+k);
  else if (k === 'Home') { e.preventDefault(); goCh(0); }
  else if (k === 'End') { e.preventDefault(); goCh(S.max); }
});

cvEl = $('#cv'); ctx = cvEl.getContext('2d');
for (let i = 0; i < NC; i++) $('#rail').appendChild(document.createElement('li'));
let rz = 0;
const resize = () => { if (size()) draw(); };
addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(resize, 80); });
if (window.ResizeObserver) new ResizeObserver(() => { clearTimeout(rz); rz = setTimeout(resize, 40); }).observe(stage);
size(); setLang(L); draw(); ui(true);
window.__vs = { goCh, goZoom, setAuto, setSheet, setLang, redraw: draw, get ch() { return S.x; }, get chT() { return S.t; }, get zoom() { return Z.x; }, get zT() { return Z.t; }, get auto() { return auto; }, get drawn() { return drawn; }, get sheetOpen() { return sheetOpen; }, get lang() { return L; }, LV: () => LV, dims: () => ({ W, H }), NC, NL };
})();
