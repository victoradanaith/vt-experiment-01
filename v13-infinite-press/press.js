(() => {
'use strict';
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const mod = (n, m) => ((n % m) + m) % m;
const root = document.documentElement;
if (/[?&]rm=1/.test(location.search)) root.classList.add('rm');
const RM = () => root.classList.contains('rm') || matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------------------------------------------------------
   Concept copy (same seven steps as before). Nothing claims a live service, customer, result,
   price or integration. Sample lines are invented and labelled as such.
   --------------------------------------------------------------------------------------------- */
const STEPS = [
  { t: 'Collect', st: 0, sub: ['One place for scattered data', 'ข้อมูลทุกทางมาอยู่ที่เดียว'],
    say: ['Forms, chats, emails and files land in one place.', 'ฟอร์ม แชท อีเมล และไฟล์ มารวมกันที่เดียว'],
    what: ['Pulls items from several channels into one queue. Nothing is changed yet.', 'ดึงรายการจากหลายช่องทางเข้าคิวเดียว ยังไม่แก้ไขอะไร'],
    aim: ['Less searching across tools.', 'ลดการไล่หาข้อมูลข้ามหลายเครื่องมือ'],
    sample: ['One order from a form joins the queue.', 'คำสั่งซื้อ 1 รายการจากฟอร์มเข้าคิว'] },
  { t: 'Clean', st: 1, sub: ['Ready to use', 'ให้พร้อมใช้'],
    say: ['Missing fields, duplicates and wrong formats get caught.', 'จับช่องที่ขาด ข้อมูลซ้ำ และรูปแบบที่ผิด'],
    what: ['Checks each item, fixes what is safe to fix, and flags the rest for a person.', 'ตรวจทีละรายการ แก้เฉพาะที่แก้ได้อย่างปลอดภัย ที่เหลือส่งให้คนดู'],
    aim: ['Every item enters the next step in the same shape.', 'ทุกรายการเข้าขั้นต่อไปในรูปแบบเดียวกัน'],
    sample: ['A phone number missing a digit is flagged for a person.', 'เบอร์โทรขาดหนึ่งหลักถูกติดธงให้คนยืนยัน'] },
  { t: 'Start', st: 2, sub: ['An event begins the work', 'เหตุการณ์หนึ่งเริ่มงาน'],
    say: ['A new form, email or deadline starts the flow by itself.', 'ฟอร์มใหม่ อีเมลเข้า หรือถึงเวลา ก็เริ่มงานได้เอง'],
    what: ['You define the trigger once. The flow starts the same way every time.', 'กำหนดตัวเริ่มครั้งเดียว งานเริ่มแบบเดียวกันทุกครั้ง'],
    aim: ['Work begins without someone remembering to ask.', 'งานเริ่มโดยไม่ต้องมีคนคอยสั่ง'],
    sample: ['A new form arrives and an approval step begins.', 'ฟอร์มใหม่เข้ามา ขั้นตอนอนุมัติเริ่มต้น'] },
  { t: 'Process', st: 3, sub: ['Rules, applied evenly', 'กฎเดียว ใช้เท่ากันทุกชิ้น'],
    say: ['Calculate, sort, route or ask for approval by written rules.', 'คำนวณ จัดหมวด ส่งต่อ หรือขออนุมัติ ตามกฎที่เขียนไว้'],
    what: ['Rules are written once and applied to every item, with a record of why.', 'เขียนกฎครั้งเดียว ใช้กับทุกชิ้น พร้อมบันทึกเหตุผล'],
    aim: ['The same criteria every time, traceable afterwards.', 'เกณฑ์เดียวกันทุกครั้ง ย้อนตรวจได้'],
    sample: ['An amount above the limit is sent to a manager.', 'ยอดเกินที่กำหนดถูกส่งให้ผู้จัดการอนุมัติ'] },
  { t: 'Format', st: 4, sub: ['Shaped for the receiver', 'จัดให้ตรงกับผู้รับ'],
    say: ['Results arrive in the shape the next person or system expects.', 'ผลลัพธ์อยู่ในรูปแบบที่ผู้รับหรือระบบถัดไปใช้ได้เลย'],
    what: ['Turns results into a summary, a sheet row or a document.', 'แปลงผลเป็นสรุป แถวในชีต หรือเอกสาร'],
    aim: ['The receiver does not have to reformat.', 'ผู้รับไม่ต้องจัดรูปแบบซ้ำ'],
    sample: ['A one-page summary with a reference number.', 'สรุปหนึ่งหน้าพร้อมเลขอ้างอิง'] },
  { t: 'Deliver', st: 5, sub: ['Sent where it is needed', 'ส่งถึงที่ที่ต้องใช้'],
    say: ['Notify a person or update another system, with proof it was sent.', 'แจ้งคนหรืออัปเดตระบบอื่น พร้อมหลักฐานว่าส่งแล้ว'],
    what: ['Sends through the agreed channel and records when and to whom.', 'ส่งผ่านช่องทางที่ตกลงกัน และบันทึกว่าส่งเมื่อไรถึงใคร'],
    aim: ['You can see whether the work arrived.', 'เห็นว่างานไปถึงแล้วหรือยัง'],
    sample: ['The warehouse team is notified and the time is logged.', 'แจ้งทีมคลังสินค้าและบันทึกเวลาที่ส่ง'] },
  { t: 'Review', st: 6, sub: ['Log, check, improve', 'บันทึก ตรวจ ปรับปรุง'],
    say: ['Record what happened, flag exceptions, tune the rules.', 'บันทึกสิ่งที่เกิดขึ้น ติดธงรายการผิดปกติ แล้วปรับกฎ'],
    what: ['Keeps a log, marks exceptions and feeds what was learned into the next round.', 'เก็บบันทึก ติดธงรายการผิดปกติ และนำสิ่งที่เรียนรู้ไปปรับรอบถัดไป'],
    aim: ['Auditable, and ready for the next batch.', 'ตรวจย้อนหลังได้ และพร้อมรับงานชุดต่อไป'],
    sample: ['One unusual item is flagged for review.', 'รายการผิดปกติ 1 ชิ้นถูกติดธงให้ทบทวน'] }
];
const STATUS = ['Concept prototype with invented sample content. No live service, customers, results, prices or integrations are claimed.', 'ต้นแบบแนวคิดพร้อมเนื้อหาตัวอย่างที่สมมติขึ้น ไม่มีการอ้างว่าเปิดให้บริการ มีลูกค้า ผลลัพธ์ ราคา หรือ integration'];
const ABOUT = {
  title: 'Egg Token', sub: ['Data and automation, as an endless field', 'งานข้อมูลและ automation ในรูปแบบสนามที่ไม่มีขอบ'],
  say: ['Each tile is one step of the same flow. One egg is one unit of work.', 'แต่ละกระเบื้องคือหนึ่งขั้นของการไหลเดียวกัน ไข่หนึ่งฟองคืองานหนึ่งหน่วย'],
  r: [[['How to read', 'วิธีอ่าน'], ['Drag in any direction: the field has no edge and repeats forever. Tap a tile to press it and open its details.', 'ลากไปทางไหนก็ได้ สนามนี้ไม่มีขอบและวนซ้ำไปเรื่อยๆ แตะกระเบื้องเพื่อกดและเปิดรายละเอียด']],
      [['Controls', 'การควบคุม'], ['Arrow buttons or keys move the field. F filters by step, L switches language, Esc closes details.', 'ปุ่มลูกศรหรือคีย์ลูกศรเลื่อนสนาม F กรองตามขั้นตอน L สลับภาษา Esc ปิดรายละเอียด']],
      [['What a token is', 'token คืออะไร'], ['One order, one form, one request: a single unit of work. It has nothing to do with crypto.', 'หนึ่งคำสั่งซื้อ หนึ่งฟอร์ม หนึ่งคำขอ คืองานหนึ่งหน่วย ไม่เกี่ยวกับคริปโต']]]
};
const LBL = [['What happens', 'เกิดอะไรขึ้น'], ['Aim', 'เป้าหมาย'], ['Sample · invented', 'ตัวอย่าง · สมมติ']];
let L = 1;
try { if (localStorage.getItem('v13lang') === 'en') L = 0; } catch (_) {}

/* ---- tiny egg glyphs, one per step ---- */
const GLYPH = [
  '<circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" stroke-width="2.5" opacity=".6"/>',
  '<circle cx="50" cy="50" r="34" fill="currentColor"/>',
  '<g transform="rotate(-10 50 50)" fill="currentColor"><path d="M16 45a34 34 0 0 1 68 0z" transform="translate(0 -4)"/><path d="M16 55a34 34 0 0 0 68 0z" transform="translate(0 4)"/></g>',
  '<circle cx="50" cy="50" r="36" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="50" cy="50" r="17" fill="var(--yk)"/>',
  '<circle cx="50" cy="50" r="26" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="2" opacity=".6"/><circle cx="50" cy="50" r="12" fill="var(--yk)"/>',
  '<circle cx="50" cy="56" r="26" fill="none" stroke="currentColor" stroke-width="2.5" opacity=".5"/><circle cx="50" cy="34" r="12" fill="var(--yk)"/>',
  '<circle cx="50" cy="50" r="36" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="7 7" opacity=".75"/>'
];

/* ---------------------------------------------------------------------------------------------
   The endless field. One block of C x R cells repeats forever in both directions, so there is no
   edge. R is even, so the half-cell stagger of the rows stays consistent across the repeat.
   --------------------------------------------------------------------------------------------- */
const C = 7, R = 6;
const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const SPECIAL = { '3,2': 'logo', '5,0': 'tag0', '1,4': 'tag1', '0,2': 'tag2' };
const TAGS = { tag0: 'Less work.\nMore flow.', tag1: 'Human energy.\nClear systems.', tag2: 'One egg.\nOne unit of work.' };
function cellInfo(ci, cj) {
  const key = ci + ',' + cj, sp = SPECIAL[key], h = hash(ci + 11, cj + 3);
  const tone = h < .22 ? 'yolk' : h < .55 ? 'ink' : 'shell';
  if (sp === 'logo') return { kind: 'logo', tone: 'shell', s: .86, ar: .92 };
  if (sp) return { kind: 'tag', tag: sp, tone: sp === 'tag1' ? 'ink' : sp === 'tag0' ? 'yolk' : 'shell', s: .84, ar: .8 };
  if (hash(ci + 5, cj + 9) < .14) return { kind: 'blank' };
  const step = mod(ci + cj * 2, 7), s = [.58, .72, .84][Math.floor(hash(ci, cj + 21) * 3)];
  return { kind: 'step', step, tone, s, ar: .86 + hash(ci + 2, cj) * .14 };
}

const field = $('#field'), pool = new Map();
let VW = 360, VH = 500, P = 190, camX = 0, camY = 0, filter = -1, interacted = false;
const PY = () => P;                          // row pitch
function layout() {
  VW = field.clientWidth; VH = field.clientHeight;
  P = clamp(Math.min(VW, VH) * .46, 150, 240);
}
function cellPos(i, j) {                     // top-left of the cell in world coordinates
  return { x: i * P + (mod(j, 2) ? P / 2 : 0), y: j * PY() };
}
function makeTile(i, j, info) {
  const el = document.createElement('div'); el.className = 'pos';
  const b = document.createElement('button'); b.type = 'button'; b.className = 'tile'; b.dataset.tone = info.tone;
  if (info.kind === 'step') {
    const S = STEPS[info.step];
    b.dataset.step = info.step; b.dataset.kind = 'step';
    b.innerHTML = `<span class="n">${String(info.step + 1).padStart(2, '0')}</span><span class="gl" aria-hidden="true"><svg viewBox="0 0 100 100">${GLYPH[info.step]}</svg></span><span class="ti">${S.t}</span>`;
  } else if (info.kind === 'logo') {
    b.dataset.kind = 'about'; b.innerHTML = '<span class="tl"><img src="assets/egg-token-logo.png" alt="" draggable="false"></span>';
  } else {
    b.dataset.kind = 'about'; b.innerHTML = `<span class="tx">${TAGS[info.tag]}</span>`;
  }
  el.appendChild(b); field.appendChild(el);
  return { el, b, info, i, j };
}
function label(t) {
  if (t.info.kind === 'step') { const S = STEPS[t.info.step]; return `${t.info.step + 1}. ${S.t}: ${S.sub[L]}`; }
  if (t.info.kind === 'logo') return 'Egg Token logo: about this concept';
  return TAGS[t.info.tag].replace('\n', ' ') + ': about this concept';
}
function render() {
  const mx = P * .6;
  const j0 = Math.floor((camY - mx) / PY()) - 1, j1 = Math.ceil((camY + VH + mx) / PY()) + 1;
  const seen = new Set();
  for (let j = j0; j <= j1; j++) {
    const off = mod(j, 2) ? P / 2 : 0;
    const i0 = Math.floor((camX - mx - off) / P) - 1, i1 = Math.ceil((camX + VW + mx - off) / P) + 1;
    for (let i = i0; i <= i1; i++) {
      const info = cellInfo(mod(i, C), mod(j, R)); if (info.kind === 'blank') continue;
      const k = i + ',' + j; seen.add(k);
      let t = pool.get(k);
      if (!t) { t = makeTile(i, j, info); t.b.setAttribute('aria-label', label(t)); pool.set(k, t); applyFilterTo(t); }
      const w = Math.round(P * info.s), h = Math.round(P * info.s * info.ar), cp = cellPos(i, j);
      const jx = (hash(mod(i, C) + 40, mod(j, R)) - .5) * P * .05, jy = (hash(mod(i, C), mod(j, R) + 40) - .5) * P * .05;
      const x = Math.round(cp.x + (P - w) / 2 + jx - camX), y = Math.round(cp.y + (PY() - h) / 2 + jy - camY);
      t.el.style.width = w + 'px'; t.el.style.height = h + 'px'; t.el.style.transform = `translate3d(${x}px,${y}px,0)`;
    }
  }
  for (const [k, t] of pool) if (!seen.has(k) && document.activeElement !== t.b && !t.b.classList.contains('pressed')) { t.el.remove(); pool.delete(k); }
  $('#coord').textContent = `X ${sgn(Math.round(camX))} · Y ${sgn(Math.round(camY))}`;
}
const sgn = n => (n < 0 ? '−' : '+') + String(Math.abs(n)).padStart(4, '0');
function applyFilterTo(t) { t.b.classList.toggle('dim', filter >= 0 && t.info.kind === 'step' && t.info.step !== filter); }

/* ---- camera: drag with momentum, wheel, buttons, keys ---- */
let vx = 0, vy = 0, raf = 0, last = 0, anim = null;
function loop(now) {
  const dt = Math.min(.04, (now - last) / 1000); last = now; let busy = false;
  if (anim) {
    const k = Math.min(1, (now - anim.t0) / anim.d), e = 1 - Math.pow(1 - k, 3);
    camX = anim.x0 + (anim.x1 - anim.x0) * e; camY = anim.y0 + (anim.y1 - anim.y0) * e; busy = k < 1; if (!busy) anim = null;
  } else if (!dragging && (Math.abs(vx) > 8 || Math.abs(vy) > 8)) {
    camX += vx * dt; camY += vy * dt; const f = Math.exp(-4.6 * dt); vx *= f; vy *= f; busy = true;
  } else if (!dragging) { vx = vy = 0; }
  render();
  raf = busy || dragging ? requestAnimationFrame(loop) : 0;
}
function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } }
function panBy(dx, dy) {
  used(); vx = vy = 0;
  if (RM()) { camX += dx; camY += dy; render(); return; }
  const b = anim ? { x: anim.x1, y: anim.y1 } : { x: camX, y: camY };
  anim = { t0: performance.now(), d: 380, x0: camX, y0: camY, x1: b.x + dx, y1: b.y + dy }; kick();
}
function used() { if (!interacted) { interacted = true; $('#hint').classList.add('gone'); } }

/* ---- pointer: press feedback on touch-down, drag after a few pixels, tap opens the tile ---- */
let g = null, dragging = false, noClick = false;
const tileOf = e => e.target.closest && e.target.closest('.tile');
field.addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const tl = tileOf(e); if (tl) tl.classList.add('pressed');
  g = { id: e.pointerId, x: e.clientX, y: e.clientY, px: e.clientX, py: e.clientY, tl, s: [{ t: e.timeStamp, x: e.clientX, y: e.clientY }] };
  anim = null; vx = vy = 0;
});
field.addEventListener('pointermove', e => {
  if (!g || g.id !== e.pointerId) return;
  if (!dragging) {
    if (Math.hypot(e.clientX - g.x, e.clientY - g.y) < 8) return;
    dragging = true; used(); if (g.tl) g.tl.classList.remove('pressed'); field.classList.add('drag');
    try { field.setPointerCapture(g.id); } catch (_) {}
    kick();
  }
  camX -= e.clientX - g.px; camY -= e.clientY - g.py; g.px = e.clientX; g.py = e.clientY;
  g.s.push({ t: e.timeStamp, x: e.clientX, y: e.clientY }); if (g.s.length > 8) g.s.shift();
});
function endPointer(e, cancel) {
  if (!g || g.id !== e.pointerId) return;
  const gg = g; g = null; if (gg.tl) gg.tl.classList.remove('pressed');
  if (!dragging) return;
  dragging = false; field.classList.remove('drag'); noClick = true; setTimeout(() => { noClick = false; }, 60);
  const a = gg.s[0], b = gg.s[gg.s.length - 1];
  if (!cancel && !RM() && b.t - a.t > 10 && e.timeStamp - b.t < 120) { vx = clamp(-(b.x - a.x) / ((b.t - a.t) / 1000), -3200, 3200); vy = clamp(-(b.y - a.y) / ((b.t - a.t) / 1000), -3200, 3200); }
  kick();
}
field.addEventListener('pointerup', e => endPointer(e, false)); field.addEventListener('pointercancel', e => endPointer(e, true));
field.addEventListener('wheel', e => { e.preventDefault(); used(); anim = null; vx = vy = 0; camX += e.deltaX; camY += e.deltaY; render(); }, { passive: false });
field.addEventListener('click', e => {
  const tl = tileOf(e); if (!tl || noClick) return;
  openTile(tl);
});
field.addEventListener('focusin', e => {
  const tl = tileOf(e); if (!tl) return;
  const fr = field.getBoundingClientRect(), r = tl.getBoundingClientRect(), pad = 12;
  let dx = 0, dy = 0;
  if (r.left < fr.left + pad) dx = r.left - fr.left - pad; else if (r.right > fr.right - pad) dx = r.right - fr.right + pad;
  if (r.top < fr.top + pad) dy = r.top - fr.top - pad; else if (r.bottom > fr.bottom - pad) dy = r.bottom - fr.bottom + pad;
  if (dx || dy) panBy(dx, dy);
});

/* ---- details ---- */
const sheet = $('#sheet'), closeB = $('#b-close');
let sheetOpen = false, hist = false, openStep = -2, lastTile = null;
const wide = () => matchMedia('(min-width:900px) and (orientation:landscape)').matches;
function fillSheet() {
  if (openStep === -2) return;
  if (openStep === -1) {
    $('#s-lab').textContent = 'EGG TOKEN / CONCEPT'; $('#s-title').textContent = ABOUT.title; $('#s-sub').textContent = ABOUT.sub[L]; $('#s-say').textContent = ABOUT.say[L];
    ABOUT.r.forEach((r, i) => { $('#d' + (i + 1)).textContent = r[0][L]; $('#r' + (i + 1)).textContent = r[1][L]; });
    $('#note').textContent = STATUS[L];
  } else {
    const S = STEPS[openStep];
    $('#s-lab').textContent = `${String(openStep + 1).padStart(2, '0')} / STEP`; $('#s-title').textContent = S.t; $('#s-sub').textContent = S.sub[L]; $('#s-say').textContent = S.say[L];
    [S.what, S.aim, S.sample].forEach((r, i) => { $('#d' + (i + 1)).textContent = LBL[i][L]; $('#r' + (i + 1)).textContent = r[L]; });
    $('#note').textContent = STATUS[L];
  }
}
function openTile(tl) {
  lastTile = tl; openStep = tl.dataset.kind === 'step' ? +tl.dataset.step : -1; fillSheet(); setSheet(true);
  $('#live').textContent = openStep >= 0 ? `${STEPS[openStep].t}. ${STEPS[openStep].sub[L]}` : ABOUT.title;
}
function setSheet(v, fromPop) {
  if (v === sheetOpen) { return; }
  sheetOpen = v; sheet.hidden = !v; field.inert = v && !wide();
  if (v) { used(); if (!fromPop) { try { history.pushState({ d: 1 }, '', '#detail'); hist = true; } catch (_) { hist = false; } } closeB.focus(); }
  else { if (!fromPop && hist) { hist = false; try { history.back(); } catch (_) {} } if (lastTile && lastTile.isConnected) lastTile.focus({ preventScroll: true }); }
}
closeB.onclick = () => setSheet(false);
addEventListener('popstate', () => { if (sheetOpen) { hist = false; setSheet(false, true); } });

/* ---- filter, language, buttons, keys ---- */
function setFilter(f) {
  filter = f; const b = $('#b-filter');
  b.textContent = f < 0 ? 'ALL' : STEPS[f].t.toUpperCase(); b.dataset.on = f < 0 ? '0' : '1';
  b.setAttribute('aria-label', `Filter by step: ${f < 0 ? 'all' : STEPS[f].t}. Press to change.`);
  for (const t of pool.values()) applyFilterTo(t);
  $('#live').textContent = f < 0 ? 'Showing all steps' : `Highlighting ${STEPS[f].t}`;
}
function setLang(l) {
  L = l; root.lang = L ? 'th' : 'en';
  const b = $('#b-lang'); b.textContent = L ? 'EN' : 'TH'; b.setAttribute('aria-label', L ? 'Switch language to English' : 'สลับเป็นภาษาไทย');
  $('#hint').textContent = L ? '↔ ↕ ลากไปทางไหนก็ได้ · แตะกระเบื้องเพื่อกด' : '↔ ↕ drag anywhere · tap a tile to press it';
  for (const t of pool.values()) t.b.setAttribute('aria-label', label(t));
  fillSheet(); try { localStorage.setItem('v13lang', L ? 'th' : 'en'); } catch (_) {}
}
const STEP = () => P * .9;
$('#p-left').onclick = () => panBy(-STEP(), 0); $('#p-right').onclick = () => panBy(STEP(), 0);
$('#p-up').onclick = () => panBy(0, -STEP()); $('#p-down').onclick = () => panBy(0, STEP());
$('#b-filter').onclick = () => setFilter(filter >= STEPS.length - 1 ? -1 : filter + 1);
$('#b-lang').onclick = () => setLang(L ? 0 : 1);
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key;
  if (k === 'Escape' && sheetOpen) { setSheet(false); return; }
  if (sheetOpen && !wide()) return;
  const onBtn = e.target.closest && e.target.closest('button'), m = e.shiftKey ? 2.2 : 1;
  if (k === 'ArrowLeft') { e.preventDefault(); panBy(-STEP() * m, 0); }
  else if (k === 'ArrowRight') { e.preventDefault(); panBy(STEP() * m, 0); }
  else if (k === 'ArrowUp') { e.preventDefault(); panBy(0, -STEP() * m); }
  else if (k === 'ArrowDown') { e.preventDefault(); panBy(0, STEP() * m); }
  else if ((k === 'f' || k === 'F') && !onBtn) $('#b-filter').click();
  else if ((k === 'l' || k === 'L') && !onBtn) $('#b-lang').click();
});

let rz = 0;
const relayout = () => { const ocx = camX + VW / 2, ocy = camY + VH / 2; layout(); camX = ocx - VW / 2; camY = ocy - VH / 2; render(); };
addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(relayout, 60); });
if (window.ResizeObserver) new ResizeObserver(() => { clearTimeout(rz); rz = setTimeout(relayout, 40); }).observe(field);
layout();
{ const lc = cellPos(3, 2); camX = lc.x + P / 2 - VW / 2; camY = lc.y + PY() / 2 - VH / 2; }   // open on the logo tile
setLang(L); setFilter(-1); render();
window.__v13 = { panBy, render, setFilter, setLang, openTile, setSheet, pool, get cam() { return { x: camX, y: camY }; }, set cam(v) { camX = v.x; camY = v.y; render(); }, get P() { return P; }, get sheetOpen() { return sheetOpen; }, dims: () => ({ VW, VH }), cellInfo, C, R };
})();
