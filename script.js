/* ===== barra de progresso ===== */
const bar = document.getElementById('progressBar');
addEventListener('scroll', () => {
  const h = document.documentElement;
  bar.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + '%';
}, {passive:true});

/* ===== menu mobile ===== */
const menuBtn = document.getElementById('menuBtn');
const menuOverlay = document.getElementById('menuOverlay');
function setMenu(open){
  menuOverlay.classList.toggle('open', open);
  document.body.classList.toggle('no-scroll', open);
  menuBtn.setAttribute('aria-expanded', open);
}
menuBtn.addEventListener('click', () => setMenu(true));
document.getElementById('menuClose').addEventListener('click', () => setMenu(false));
menuOverlay.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));

/* ===== reveal ao rolar ===== */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, {threshold:.12, rootMargin:'0px 0px -6% 0px'});
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ===== abas de ambientes ===== */
document.querySelectorAll('.env-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.env-btn').forEach(b => {
      const on = b === btn;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on);
    });
    document.querySelectorAll('.env-panel').forEach(p =>
      p.classList.toggle('active', p.id === btn.dataset.target));
  });
});

/* ===== acordeão de soft skills ===== */
document.querySelectorAll('.skill-head').forEach(head => {
  head.addEventListener('click', () => {
    const item = head.parentElement;
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.skill').forEach(s => {
      s.classList.remove('open');
      s.querySelector('.skill-head').setAttribute('aria-expanded', 'false');
    });
    if (!wasOpen) {
      item.classList.add('open');
      head.setAttribute('aria-expanded', 'true');
    }
  });
});

/* ===== comparador arrastável (escola × trabalho) ===== */
const cmp = document.getElementById('compare');
const schoolTxt = cmp.querySelector('.cmp-school .side-inner');
const workTxt   = cmp.querySelector('.cmp-work .side-inner');
const limit = (v, min, max) => Math.max(min, Math.min(max, v));
let dragging = false;

function applySplit(p){
  p = limit(p, 6, 94);
  cmp.style.setProperty('--split', p + '%');
  cmp.setAttribute('aria-valuenow', Math.round(p));
  /* fade: o texto do lado que está sendo coberto some suavemente,
     em vez de ser cortado pela cortina */
  schoolTxt.style.opacity = limit((p - 34) / 16, 0, 1);
  workTxt.style.opacity   = limit((66 - p) / 16, 0, 1);
}
function setSplit(clientX){
  const r = cmp.getBoundingClientRect();
  applySplit((clientX - r.left) / r.width * 100);
}
applySplit(50);

cmp.addEventListener('pointerdown', e => { dragging = true; cmp.setPointerCapture(e.pointerId); setSplit(e.clientX); });
cmp.addEventListener('pointermove', e => { if (dragging) setSplit(e.clientX); });
['pointerup','pointercancel'].forEach(ev => addEventListener(ev, () => dragging = false));
cmp.addEventListener('keydown', e => {
  const cur = parseFloat(getComputedStyle(cmp).getPropertyValue('--split')) || 50;
  if (e.key === 'ArrowLeft')  { applySplit(cur - 4); e.preventDefault(); }
  if (e.key === 'ArrowRight') { applySplit(cur + 4); e.preventDefault(); }
});

/* ===== canvas de assinatura ===== */
const cv = document.getElementById('signCanvas');
const ctx = cv.getContext('2d');
const statusEl = document.getElementById('signStatus');
const stamp = document.getElementById('signStamp');
let drawing = false, prev = null, signed = false;

function fitCanvas(){
  const r = cv.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  let snap = null;
  if (cv.width > 0) { // preserva a assinatura ao redimensionar
    snap = document.createElement('canvas');
    snap.width = cv.width; snap.height = cv.height;
    snap.getContext('2d').drawImage(cv, 0, 0);
  }
  cv.width = Math.round(r.width * dpr);
  cv.height = Math.round(r.height * dpr);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.lineWidth = 2.2 * dpr;
  ctx.strokeStyle = '#191613';
  if (snap) ctx.drawImage(snap, 0, 0, cv.width, cv.height);
}
addEventListener('load', fitCanvas);
let rsT; addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(fitCanvas, 150); });

function pos(e){
  const r = cv.getBoundingClientRect();
  return [(e.clientX - r.left) * (cv.width / r.width), (e.clientY - r.top) * (cv.height / r.height)];
}
cv.addEventListener('pointerdown', e => {
  e.preventDefault();
  drawing = true;
  cv.setPointerCapture(e.pointerId);
  prev = pos(e);
  ctx.beginPath();
  ctx.moveTo(prev[0], prev[1]);
  ctx.lineTo(prev[0] + .1, prev[1]);
  ctx.stroke();
});
cv.addEventListener('pointermove', e => {
  if (!drawing) return;
  const p = pos(e);
  ctx.beginPath();
  ctx.moveTo(prev[0], prev[1]);
  ctx.lineTo(p[0], p[1]);
  ctx.stroke();
  prev = p;
});
['pointerup','pointercancel'].forEach(ev => cv.addEventListener(ev, () => {
  if (drawing && !signed) {
    signed = true;
    const now = new Date();
    const dt = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
    statusEl.classList.add('ok');
    statusEl.querySelector('span').textContent = 'Compromisso registrado em ' + dt;
    stamp.classList.add('show');
  }
  drawing = false;
}));
document.getElementById('clearBtn').addEventListener('click', () => {
  ctx.clearRect(0, 0, cv.width, cv.height);
  signed = false;
  statusEl.classList.remove('ok');
  statusEl.querySelector('span').textContent = 'Aguardando assinatura — use o mouse ou o dedo.';
  stamp.classList.remove('show');
});