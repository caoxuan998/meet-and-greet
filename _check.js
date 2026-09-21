
/* ========== 颜色主题（粉系） ========== */
const COLORS = [
  { key: 'pink',     main: '#FF8FAB', soft: '#FFE9F0', label: '樱粉' },
  { key: 'rose',     main: '#F26D92', soft: '#FBD9E2', label: '玫粉' },
  { key: 'coral',    main: '#FF9E80', soft: '#FFE6DC', label: '蜜桃' },
  { key: 'lavender', main: '#C9A0DC', soft: '#EFE2F6', label: '丁香' },
  { key: 'gold',     main: '#E0A36B', soft: '#F6E4D2', label: '暖金' },
  { key: 'blush',    main: '#FFB3C6', soft: '#FFE3EC', label: '淡粉' }
];

/* ========== 存储管理 ========== */
const STORAGE_KEY = 'meet:items:v1';
const INSTALL_KEY = 'meet:install:dismissed';

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function loadItems() {
  let list = [];
  try { const raw = localStorage.getItem(STORAGE_KEY); list = raw ? JSON.parse(raw) : []; }
  catch (e) { list = []; }
  if (!Array.isArray(list)) list = [];

  let dirty = false;
  const seen = new Set();
  const out = [];
  for (const it of list) {
    if (!it || typeof it !== 'object') { dirty = true; continue; }
    if (!it.date) { dirty = true; continue; }

    const rawId = (it.id === undefined || it.id === null) ? '' : String(it.id).trim();
    let id = (rawId === '' || rawId === 'undefined' || rawId === 'null' || rawId === 'NaN') ? newId() : rawId;
    if (seen.has(id)) id = newId();
    if (rawId !== id) dirty = true;

    seen.add(id);
    out.push({ ...it, id, name: it.name || '未命名', date: it.date, color: it.color || 'pink' });
  }
  if (dirty) saveItems(out);
  return out;
}
function saveItems(items) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch (e) {}
}

/* ========== 通用工具 ========== */
function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
let toastTimer = null;
function toast(msg, ms = 1800) {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; document.body.appendChild(el); }
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}
const $ = (id) => document.getElementById(id);
let currentPageId = 'page-home';

/* ========== 时间计算 ========== */
function daysBetween(date1, date2) {
  const d1 = new Date(date1); d1.setHours(0,0,0,0);
  const d2 = new Date(date2); d2.setHours(0,0,0,0);
  return Math.round((d2 - d1) / 86400000);
}
function formatDate(dateStr) {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}年${m}月${day}日`;
}

/* ========== 首页渲染 ========== */
function renderHome() {
  const items = loadItems();
  const today = new Date(); today.setHours(0,0,0,0);

  const upcoming = [];
  const passed = [];
  for (const item of items) {
    const days = daysBetween(today, item.date);
    if (days >= 0) upcoming.push({ ...item, days });
    else passed.push({ ...item, days: Math.abs(days) });
  }
  upcoming.sort((a, b) => a.days - b.days);
  passed.sort((a, b) => a.days - b.days);

  document.getElementById('statCount').textContent = items.length;

  const upcomingList = document.getElementById('upcomingList');
  document.getElementById('upcomingCount').textContent = upcoming.length;
  if (upcoming.length === 0) {
    upcomingList.innerHTML = `
      <div class="empty-state">
        <div class="em-icon">+</div>
        <div class="em-title">还没有见面计划</div>
        <div class="em-sub">点右下角 + 添加下次见面的日子<br>每天打开都能看到还差几天</div>
        <button class="btn btn-primary" onclick="showAddModal()">添加见面计划</button>
      </div>`;
  } else {
    upcomingList.innerHTML = upcoming.map(item => renderCard(item, false)).join('');
  }

  const passedList = document.getElementById('passedList');
  document.getElementById('passedCount').textContent = passed.length;
  if (passed.length === 0) {
    passedList.innerHTML = '';
  } else {
    passedList.innerHTML = passed.map(item => renderCard(item, true)).join('');
  }

  document.querySelectorAll('.countdown-card').forEach(el => {
    el.onclick = (e) => {
      if (e.target.closest('.cc-mini-btn')) return;
      window.location.hash = '#detail/' + el.dataset.id;
    };
  });
  document.querySelectorAll('.cc-delete').forEach(btn => {
    btn.onclick = (e) => { e.stopPropagation(); e.preventDefault(); showDeleteConfirm(btn.dataset.id); };
  });
  document.querySelectorAll('.cc-edit').forEach(btn => {
    btn.onclick = (e) => { e.stopPropagation(); showEditModal(btn.dataset.id); };
  });
}

function renderCard(item, passed) {
  const color = COLORS.find(c => c.key === item.color) || COLORS[0];
  const dateStr = formatDate(item.date);

  let countdownHtml = '';
  if (passed) {
    const years = Math.floor(item.days / 365);
    const months = Math.floor((item.days % 365) / 30);
    const days = item.days % 30;
    let breakdown = '';
    if (years > 0) breakdown += `<div class="cd-item"><span class="cd-num">${years}</span>年</div>`;
    if (months > 0 || years > 0) breakdown += `<div class="cd-item"><span class="cd-num">${months}</span>月</div>`;
    breakdown += `<div class="cd-item"><span class="cd-num">${days}</span>天</div>`;
    countdownHtml = `
      <div class="cc-countdown">
        <div class="cc-days passed-num">${item.days}</div>
        <div class="cc-unit">天前</div>
      </div>
      <div class="cc-detail">${breakdown}</div>`;
  } else {
    const days = item.days;
    countdownHtml = `
      <div class="cc-countdown">
        <div class="cc-days">${days === 0 ? '今天' : days}</div>
        <div class="cc-unit">${days === 0 ? '就要见到啦！' : '天后'}</div>
      </div>
      <div class="cc-progress"><div class="cc-progress-fill" style="width: ${calculateProgress(item.date)}%"></div></div>`;
  }

  return `
    <div class="countdown-card ${passed ? 'passed' : ''}" data-id="${item.id}">
      <div class="cc-header">
        <div>
          <div class="cc-title">${escapeHTML(item.name)}</div>
          <div class="cc-date">${dateStr}${item.note ? ' · ' + escapeHTML(item.note) : ''}</div>
        </div>
        <div class="cc-actions">
          <button class="cc-mini-btn cc-edit" data-id="${item.id}" aria-label="编辑">编辑</button>
          <button class="cc-mini-btn cc-delete" data-id="${item.id}" aria-label="删除">删除</button>
        </div>
      </div>
      ${countdownHtml}
    </div>`;
}

function calculateProgress(targetDate) {
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(targetDate); target.setHours(0,0,0,0);
  const days = (target - today) / 86400000;
  if (days <= 0) return 100;
  if (days >= 365) return 0;
  return ((365 - days) / 365) * 100;
}

/* ========== 添加/编辑 ========== */
let editingId = null;

function showAddModal() {
  editingId = null;
  document.getElementById('modalTitle').textContent = '添加见面计划';
  document.getElementById('inputName').value = '';
  document.getElementById('inputDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('inputType').value = 'countdown';
  document.getElementById('inputNote').value = '';
  document.getElementById('editModal').classList.remove('hidden');
}
function showEditModal(id) {
  const item = loadItems().find(x => x.id === id);
  if (!item) return;
  editingId = id;
  document.getElementById('modalTitle').textContent = '编辑见面计划';
  document.getElementById('inputName').value = item.name;
  document.getElementById('inputDate').value = item.date;
  document.getElementById('inputType').value = item.type || 'countdown';
  document.getElementById('inputNote').value = item.note || '';
  document.getElementById('editModal').classList.remove('hidden');
}
function hideModal() {
  document.getElementById('editModal').classList.add('hidden');
  editingId = null;
}

let confirmHandler = null;
function showConfirm(opts) {
  confirmHandler = (opts && typeof opts.onOk === 'function') ? opts.onOk : null;
  const t = $('confirmTitle'), s = $('confirmSub'), d = $('confirmDesc'), ok = $('confirmOk');
  if (t) t.textContent = (opts && opts.title) || '确定要删除吗？';
  if (s) s.textContent = (opts && opts.subtitle) || 'Are you sure?';
  if (d) d.textContent = (opts && opts.desc) || '删除后无法恢复';
  if (ok) ok.textContent = (opts && opts.okText) || '删除';
  $('confirmModal').classList.remove('hidden');
}
function hideConfirm() { confirmHandler = null; $('confirmModal').classList.add('hidden'); }
function doConfirm() { const fn = confirmHandler; hideConfirm(); if (typeof fn === 'function') fn(); }
function showDeleteConfirm(id) {
  const hit = loadItems().find(x => String(x.id) === String(id));
  const name = hit ? hit.name : '';
  showConfirm({
    title: '确定要删除吗？',
    subtitle: 'Delete this plan?',
    desc: (name ? '「' + name + '」' : '这条见面计划') + '删除后无法恢复',
    onOk: () => deleteDay(id)
  });
}
function deleteDay(id) {
  const targetId = String(id);
  const before = loadItems();
  const items = before.filter(x => String(x.id) !== targetId);
  saveItems(items);
  renderHome();
  toast(items.length < before.length ? '已删除' : '没有找到这条记录');
  if (location.hash.indexOf('#detail/') === 0 && location.hash.indexOf(targetId) > 0) {
    location.hash = '#home';
  }
}
function saveModal() {
  const nameEl = document.getElementById('inputName');
  const dateEl = document.getElementById('inputDate');
  const typeEl = document.getElementById('inputType');
  const noteEl = document.getElementById('inputNote');
  if (!nameEl || !dateEl) { toast('表单元素缺失，请刷新页面'); return; }

  const name = nameEl.value.trim();
  const date = dateEl.value;
  const type = typeEl ? typeEl.value : 'countdown';
  const note = noteEl ? noteEl.value.trim() : '';

  if (!name) { toast('先写个名字吧'); return; }
  if (!date) { toast('请选择见面日期'); return; }

  const items = loadItems();
  const color = COLORS[0].key; // 粉色为主，默认樱粉
  if (editingId) {
    const idx = items.findIndex(x => x.id === editingId);
    if (idx >= 0) items[idx] = { ...items[idx], name, date, type, color, note };
    else items.push({ id: newId(), name, date, type, color, note, created: Date.now() });
  } else {
    items.push({ id: newId(), name, date, type, color, note, created: Date.now() });
  }
  saveItems(items);
  hideModal();
  renderHome();
  toast(editingId ? '已更新' : '已添加');
}

/* ========== 详情页 ========== */
function renderDetail(id) {
  const items = loadItems();
  const item = items.find(x => x.id === id);
  if (!item) { window.location.hash = '#home'; return; }

  const today = new Date(); today.setHours(0,0,0,0);
  const days = daysBetween(today, item.date);
  const passed = days < 0;
  const absDays = Math.abs(days);

  const color = COLORS.find(c => c.key === item.color) || COLORS[0];

  let statusText = '';
  let statusHtml = '';
  if (days === 0) { statusText = '就是今天'; statusHtml = '<div class="db-status">TODAY · 今天就要见到啦</div>'; }
  else if (passed) { statusText = '已经过去'; }
  else { statusText = '还有'; }

  const numDisplay = passed ? absDays : (days === 0 ? '今天' : days);

  let breakdown = '';
  if (passed) {
    const years = Math.floor(absDays / 365);
    const months = Math.floor((absDays % 365) / 30);
    const remDays = absDays % 30;
    breakdown = `
      <div class="time-breakdown">
        <div class="tb-cell"><div class="tb-num">${years}</div><div class="tb-label">YEARS</div></div>
        <div class="tb-cell"><div class="tb-num">${months}</div><div class="tb-label">MONTHS</div></div>
        <div class="tb-cell"><div class="tb-num">${remDays}</div><div class="tb-label">DAYS</div></div>
        <div class="tb-cell"><div class="tb-num">${absDays}</div><div class="tb-label">TOTAL</div></div>
      </div>`;
  } else {
    const months = Math.floor(days / 30);
    const remDays = days % 30;
    const weeks = Math.floor(days / 7);
    breakdown = `
      <div class="time-breakdown">
        <div class="tb-cell"><div class="tb-num">${months}</div><div class="tb-label">MONTHS</div></div>
        <div class="tb-cell"><div class="tb-num">${weeks}</div><div class="tb-label">WEEKS</div></div>
        <div class="tb-cell"><div class="tb-num">${remDays}</div><div class="tb-label">DAYS</div></div>
        <div class="tb-cell"><div class="tb-num">${days}</div><div class="tb-label">TOTAL</div></div>
      </div>`;
  }

  const quotes = generateQuotes(days, passed);

  const html = `
    <div class="detail-hero">
      <div class="dh-eyebrow">${passed ? 'A Meeting' : days === 0 ? 'Today' : 'Coming Up'}</div>
      <div class="dh-title">${escapeHTML(item.name)}</div>
      <div class="dh-date">${formatDate(item.date)}</div>
    </div>

    <div class="days-big">
      <div class="db-num" style="color: ${color.main};">${numDisplay}</div>
      <div class="db-label">${days === 0 ? '就要见到啦' : (passed ? '天前' : '天后')}</div>
      ${statusHtml}
    </div>

    ${breakdown}

    ${item.note ? `
    <div class="detail-card">
      <div class="dc-title">我们的备注</div>
      <div class="dc-body">${escapeHTML(item.note)}</div>
    </div>` : ''}

    <div class="detail-card">
      <div class="dc-title">${passed ? '那次见面' : '等见面的日子'}</div>
      <ul class="quotes">
        ${quotes.map(q => `<li>${escapeHTML(q)}</li>`).join('')}
      </ul>
    </div>
  `;

  document.getElementById('detailPage').innerHTML = html;
  document.getElementById('detailShare').onclick = () => generateShareCard(item, days, color);
}

function generateQuotes(days, passed) {
  if (days === 0) {
    return ['今天就要见到 TA 啦！', '记得给 TA 一个大大的拥抱', '终于不用隔着屏幕了'];
  }
  if (passed) {
    return [`这次见面已经过去 ${Math.abs(days)} 天`, '那次见面真的好开心', '期待下一次相聚', '见面的日子，值得反复回味'];
  }
  if (days <= 7) {
    return ['就在这周了！', '开始收拾行李准备出发', '马上就能抱到 TA 啦', '倒计时进入最后冲刺'];
  }
  if (days <= 30) {
    return ['一个月以内就能见到啦', '倒计时进入冲刺阶段', '想想见面要一起做什么'];
  }
  if (days <= 100) {
    return ['快了，时间在悄悄靠近', '每过一天，就离 TA 近一点', '见面清单可以列起来啦'];
  }
  return ['数着日子等见面', '等待见面的日子也甜', '那一天一定会来的', '见面的期待，撑过异地'];
}

/* ========== 分享卡片（粉色） ========== */
function generateShareCard(item, days, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 750; canvas.height = 1334;
  const ctx = canvas.getContext('2d');

  const passed = days < 0;
  const absDays = Math.abs(days);

  const bgGrad = ctx.createLinearGradient(0, 0, 0, 1334);
  bgGrad.addColorStop(0, '#FFF1F6');
  bgGrad.addColorStop(1, '#FCE3EC');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 750, 1334);

  ctx.fillStyle = 'rgba(255, 143, 171, 0.10)';
  ctx.beginPath(); ctx.arc(650, 100, 200, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(242, 109, 146, 0.10)';
  ctx.beginPath(); ctx.arc(100, 1200, 250, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = color.main;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(75, 120); ctx.lineTo(75, 180); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(675, 120); ctx.lineTo(675, 180); ctx.stroke();

  ctx.font = '500 20px "Cormorant Garamond", serif';
  ctx.fillStyle = color.main;
  ctx.textAlign = 'center';
  ctx.letterSpacing = '4px';
  ctx.fillText('N E X T   M E E T I N G', 375, 150);

  ctx.font = '600 36px "Noto Serif SC", serif';
  ctx.fillStyle = '#4A2E3A';
  ctx.fillText('还有多久见到 TA', 375, 220);

  ctx.font = '18px "Noto Sans SC", sans-serif';
  ctx.fillStyle = '#A8768A';
  ctx.fillText(item.name, 375, 270);

  ctx.font = '500 16px "Cormorant Garamond", serif';
  ctx.fillStyle = '#A8768A';
  ctx.fillText(formatDate(item.date), 375, 310);

  const numDisplay = passed ? absDays : (days === 0 ? 'TODAY' : days);
  ctx.font = days === 0 ? '600 110px "Cormorant Garamond", serif' : '600 220px "Cormorant Garamond", serif';
  ctx.fillStyle = color.main;
  ctx.fillText(String(numDisplay), 375, 600);

  ctx.font = '24px "Noto Serif SC", serif';
  ctx.fillStyle = '#7A4A5C';
  const unitText = days === 0 ? '就要见到啦' : (passed ? '天前' : '天后');
  ctx.fillText(unitText, 375, 660);

  ctx.strokeStyle = '#F2C4D2';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(200, 740); ctx.lineTo(550, 740); ctx.stroke();

  ctx.font = '22px "Noto Serif SC", serif';
  ctx.fillStyle = '#7A4A5C';
  let quoteText = '';
  if (days === 0) quoteText = '今天就要见到 TA 啦';
  else if (passed) quoteText = '那次见面，真好';
  else if (days <= 7) quoteText = '就在这周见面啦';
  else if (days <= 100) quoteText = '时间在悄悄靠近';
  else quoteText = '数着日子等见面';
  ctx.fillText(`「 ${quoteText} 」`, 375, 810);

  if (item.note) {
    ctx.font = '18px "Noto Sans SC", sans-serif';
    ctx.fillStyle = '#A8768A';
    ctx.fillText(item.note, 375, 870);
  }

  ctx.font = '500 16px "Cormorant Garamond", serif';
  ctx.fillStyle = '#F26D92';
  ctx.fillText('OUR NEXT MEETING', 375, 1230);

  ctx.font = '14px "Noto Sans SC", sans-serif';
  ctx.fillStyle = '#C9A6B4';
  ctx.fillText('一个链接，安装到手机桌面随时查看', 375, 1260);

  showShareModal(canvas);
}

function showShareModal(canvas) {
  const modal = document.createElement('div');
  modal.className = 'modal-mask';
  modal.innerHTML = `
    <div class="modal-sheet" style="max-height: 95vh;">
      <div class="modal-handle"></div>
      <div class="modal-title">分享给 TA</div>
      <div class="modal-subtitle">Long Press to Save</div>
      <img src="${canvas.toDataURL('image/png')}" style="width: 100%; border-radius: 12px; margin-bottom: 16px; box-shadow: 0 4px 20px rgba(242, 109, 146, 0.15);">
      <div class="modal-actions">
        <button class="btn btn-primary" id="dlBtn">下载图片</button>
        <button class="btn btn-ghost" id="closeBtn">关闭</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  document.getElementById('dlBtn').onclick = () => {
    const link = document.createElement('a');
    link.download = `见面倒计时-${new Date().getTime()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast('已保存到下载文件夹');
  };
  document.getElementById('closeBtn').onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

/* ========== 路由 ========== */
function showPage(id) {
  ['page-home', 'page-detail'].forEach(x => {
    const el = document.getElementById(x);
    if (el) el.classList.toggle('active', x === id);
  });
  const fab = $('addBtn');
  if (fab) fab.classList.toggle('hidden', id === 'page-detail');
  currentPageId = id;
}
function route() {
  const raw = location.hash.replace(/^#/, '') || 'home';
  const parts = raw.split('/');
  if (parts[0] === 'home') { showPage('page-home'); renderHome(); }
  else if (parts[0] === 'detail' && parts[1]) { showPage('page-detail'); renderDetail(parts[1]); }
  else { location.hash = '#home'; }
}

/* ========== 初始化 ========== */
function init() {
  try {
    const addBtn = $('addBtn');
    const detailBack = $('detailBack');
    const modalCancel = $('modalCancel');
    const modalSave = $('modalSave');
    const editModal = $('editModal');

    if (addBtn) addBtn.addEventListener('click', showAddModal);
    if (detailBack) detailBack.addEventListener('click', () => location.hash = '#home');
    if (modalCancel) modalCancel.addEventListener('click', hideModal);
    if (modalSave) modalSave.addEventListener('click', saveModal);
    if (editModal) editModal.addEventListener('click', (e) => { if (e.target.id === 'editModal') hideModal(); });

    const confirmCancel = $('confirmCancel');
    const confirmOk = $('confirmOk');
    const confirmModal = $('confirmModal');
    if (confirmCancel) confirmCancel.addEventListener('click', hideConfirm);
    if (confirmOk) confirmOk.addEventListener('click', doConfirm);
    if (confirmModal) confirmModal.addEventListener('click', (e) => { if (e.target.id === 'confirmModal') hideConfirm(); });

    window.addEventListener('hashchange', route);
    route();
    renderHome();
  } catch (err) {
    console.error('[见面倒计时] init 失败:', err);
    alert('初始化失败：' + err.message);
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js?v=2').catch(() => {});
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });
  }

  window.__resetDays = function () { localStorage.removeItem(STORAGE_KEY); renderHome(); toast('已清空全部数据'); };

  setupInstallPrompt();
}

/* ========== PWA 安装提示 ========== */
let deferredPrompt = null;
function setupInstallPrompt() {
  if (localStorage.getItem(INSTALL_KEY) === 'yes') return;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallBanner();
  });
  window.addEventListener('appinstalled', () => {
    localStorage.setItem(INSTALL_KEY, 'yes');
    hideInstallBanner();
  });
}
function showInstallBanner() {
  if (document.getElementById('installBanner')) return;
  const banner = document.createElement('div');
  banner.id = 'installBanner';
  banner.className = 'install-banner';
  banner.innerHTML = `
    <div class="ib-text"><strong>添加到主屏幕</strong><br>像 APP 一样随时打开</div>
    <button class="ib-btn" id="installBtn">安装</button>
    <button class="ib-close" id="closeBanner">×</button>`;
  document.body.appendChild(banner);
  document.getElementById('installBtn').onclick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') localStorage.setItem(INSTALL_KEY, 'yes');
    deferredPrompt = null;
    hideInstallBanner();
  };
  document.getElementById('closeBanner').onclick = () => { localStorage.setItem(INSTALL_KEY, 'yes'); hideInstallBanner(); };
}
function hideInstallBanner() { const b = document.getElementById('installBanner'); if (b) b.remove(); }

document.addEventListener('DOMContentLoaded', init);
  