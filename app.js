// ============================================================
//  app.js — هسته مشترک سامانه اندرزگو
//  احراز هویت، نقش‌ها، مدیریت تب، ارتباط با Worker، گزارش مرکزی
// ============================================================

// —— نقش هر کد عبور ——
// admin همه چیز را می‌بیند. هر نقش دیگر فقط بخش خودش + ابزار مشترک.
const ADMIN_HASH = "a7a98e35c63d14ca1f6880793988596b8f93787bb55c4ce5f393ec1f8cda5f38";
const DEFAULT_USERS = [
  { hash: "47f1f3c3d65512847aec82891c86ccbc37f2277fb82107e463a989d869557bf5", role: "hr",      label: "نیروی انسانی ۱" },
  { hash: "2060c5b108690beb7deb44d5a04897ece3e83d342be1a053ea306e0ff02b90ad", role: "hr",      label: "نیروی انسانی ۲" },
  { hash: "133b96f1e91a7412db751ce916c744329f3a2069eb80f5ac7e23ba81255cb5f0", role: "hr",      label: "نیروی انسانی ۳" },
  { hash: "f657d2b3e8627ecd7897ae376b7618c6ef49e1dfb29dfeb7dabc921b3d85e9bb", role: "content", label: "محتوا ۱" },
  { hash: "03afe8288ff63c50bad359b49381b351426a674b1148cfd28f881c19a9c05716", role: "content", label: "محتوا ۲" },
  { hash: "4af0226605c5e27bef5f3c4eb0c2f44826bf9cc366f6bffde22f6e631a95adb2", role: "monitor", label: "رصد ۱" },
  { hash: "29bab2ecdee1dc001f06714963c82093c677fd0259285b52f91ba9cc307418bb", role: "monitor", label: "رصد ۲" },
  { hash: "ac74bc674a291e876335f079bcf981b74678e79171ecd5fcedbd73a35c6b8f0f", role: "persona", label: "هویت‌سازی ۱" },
  { hash: "4c0b144a0bb31fbe6c553bc752bba282e3307d4f9c6d48bc8cfaa7c78a22980a", role: "persona", label: "هویت‌سازی ۲" },
  { hash: "32eaad26f3f36bff2aac2409238a667ac778b8372763962ec36eff98b606bf8f", role: "hr",      label: "نیروی انسانی ۴" },
];

// تب‌های هر نقش. ابزارها و تنظیمات مشترک‌اند (تنظیمات API فقط admin).
const ROLE_TABS = {
  admin:   ['admin','content','monitor','persona','hr','setup'],
  content: ['content'],
  monitor: ['monitor'],
  persona: ['persona'],
  hr:      ['hr'],
};
const TAB_DEF = {
  admin:   { icon: '🛡️', name: 'مدیریت',        title: 'پنل فرماندهی و نظارت' },
  content: { icon: '✍️', name: 'محتوا',          title: 'تحلیل پست و تولید محتوا' },
  monitor: { icon: '📡', name: 'رصد',            title: 'رصد و تحلیل اطلاعاتی' },
  persona: { icon: '🎭', name: 'هویت‌سازی',      title: 'ساخت شخصیت نمونه' },
  hr:      { icon: '👥', name: 'نیروی انسانی',   title: 'پایش و گزارش‌گیری اعضا' },
  setup:   { icon: '⚙️', name: 'تنظیمات',        title: 'پیکربندی سامانه' },
};

// —— ذخیره‌سازی محلی ——
const S = {
  get: k => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch(e){ return null; } },
  set: (k,v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} },
  del: k => { try { localStorage.removeItem(k); } catch(e){} },
};

async function sha256(str){
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

// —— state سراسری ——
const APP = {
  worker: '',
  role: null,
  userHash: '',
  userLabel: '',
  isAdmin: false,
  activeTab: null,
};

function getUsers(){ const c = S.get('admin_pw_list'); return (c && c.length) ? c : DEFAULT_USERS; }
function getActiveHashes(){ return getUsers().map(u=>u.hash); }
function findUser(hash){ return getUsers().find(u=>u.hash===hash); }

// —— ورود ——
async function doLogin(){
  const val = (document.getElementById('loginInput').value||'').trim().toUpperCase();
  const errEl = document.getElementById('loginErr');
  function showErr(msg){ errEl.textContent=msg; errEl.style.display='block'; }
  function hideErr(){ errEl.style.display='none'; }
  if(!val){ showErr('ACCESS_CODE_REQUIRED'); return; }
  hideErr();
  const hash = await sha256(val);
  if(hash === ADMIN_HASH){
    APP.isAdmin=true; APP.role='admin'; APP.userHash=hash; APP.userLabel='مدیریت';
    S.set('auth_token', hash); enterApp();
  } else {
    const u = findUser(hash);
    if(u){
      APP.isAdmin=false; APP.role=u.role; APP.userHash=hash; APP.userLabel=u.label||'کاربر';
      S.set('auth_token', hash); enterApp();
    } else {
      showErr('ACCESS_DENIED // INVALID_CODE');
      document.getElementById('loginInput').value='';
    }
  }
}
function doLogout(){ S.del('auth_token'); location.reload(); }

function checkAuth(){
  const t = S.get('auth_token');
  if(!t) return false;
  if(t === ADMIN_HASH){ APP.isAdmin=true; APP.role='admin'; APP.userHash=t; APP.userLabel='مدیریت'; return true; }
  const u = findUser(t);
  if(u){ APP.isAdmin=false; APP.role=u.role; APP.userHash=t; APP.userLabel=u.label||'کاربر'; return true; }
  return false;
}

// —— ورود به اپ و ساخت تب‌ها ——
function enterApp(){
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('app').classList.add('active');

  const chip = document.getElementById('userChip');
  chip.querySelector('.topnav-user-name').textContent =
    APP.isAdmin ? 'ADMIN' : (TAB_DEF[APP.role]?.name || 'USER');
  chip.className = 'topnav-user' + (APP.isAdmin ? ' admin' : '');

  APP.worker = S.get('cfg_worker') || 'andarzgoo.liara.run';

  buildTabs();
  if(window.initContent) initContent();
  if(window.initMonitor) initMonitor();
  if(window.initPersona) initPersona();
  if(window.initHR) initHR();
  if(window.initAdmin) initAdmin();
  if(window.initSetup) initSetup();

  const tabs = ROLE_TABS[APP.role] || [];
  if(tabs.length) switchTab(tabs[0]);
}

function buildTabs(){
  const tabs = ROLE_TABS[APP.role] || [];
  const sideNav = document.getElementById('sideNav');
  const tabBar  = document.getElementById('tabBar');

  // Side nav (desktop)
  if(sideNav){
    sideNav.innerHTML = tabs.map(t => {
      const d = TAB_DEF[t];
      const cls = 'sidenav-item' + (t==='admin'?' admin-tab':'');
      return `<button class="${cls}" data-tab="${t}" onclick="switchTab('${t}')" title="${d.name}">
        <span>${d.icon}</span>
        <div class="sidenav-tooltip">${d.name}</div>
      </button>`;
    }).join('');
    sideNav.style.display = tabs.length <= 1 ? 'none' : '';
  }

  // Tab bar (mobile)
  if(tabBar){
    tabBar.innerHTML = tabs.map(t => {
      const d = TAB_DEF[t];
      const cls = 'tabbar-item' + (t==='admin'?' admin-tab':'');
      return `<button class="${cls}" data-tab="${t}" onclick="switchTab('${t}')">
        <span class="tabbar-icon">${d.icon}</span>
        <span>${d.name}</span>
      </button>`;
    }).join('');
    tabBar.style.display = tabs.length <= 1 ? 'none' : '';
  }
}

function switchTab(name){
  APP.activeTab = name;
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.sidenav-item,.tabbar-item').forEach(t=>t.classList.remove('active'));
  const panel = document.getElementById('panel-'+name);
  if(panel) panel.classList.add('active');
  document.querySelectorAll(`[data-tab="${name}"]`).forEach(b=>b.classList.add('active'));
  const fn = window['onShow_'+name];
  if(typeof fn === 'function') fn();
}

// —— ارتباط با Worker ——
function cleanUrl(raw){ return (raw||'').trim().replace(/^https?:\/\//i,'').replace(/\/+$/,'').trim(); }
function workerBase(){ return APP.worker ? `https://${APP.worker}` : ''; }

// ScrapeCreators از طریق Worker
async function scFetch(apiUrl){
  if(!APP.worker) throw new Error('Worker تنظیم نشده');
  const res = await fetch(`${workerBase()}/scrape?url=${encodeURIComponent(apiUrl)}`, { signal: AbortSignal.timeout(30000) });
  if(!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Groq از طریق Worker — section: content|monitor|persona
async function groqChat(section, messages, opts={}){
  if(!APP.worker) throw new Error('Worker تنظیم نشده');
  const payload = {
    model: opts.model || 'llama-3.3-70b-versatile',
    messages,
    temperature: opts.temperature ?? 0.8,
    max_tokens: opts.max_tokens ?? 2048,
  };
  if(opts.json) payload.response_format = { type: 'json_object' };
  const res = await fetch(`${workerBase()}/groq`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ section, payload }),
    signal: AbortSignal.timeout(60000),
  });
  const data = await res.json();
  if(data.error) throw new Error(typeof data.error==='string'?data.error:JSON.stringify(data.error));
  if(!data.choices || !data.choices[0]) throw new Error('پاسخ نامعتبر از هوش مصنوعی');
  return data.choices[0].message.content;
}

// —— گزارش مرکزی (KV) ——
async function sendReport(section, action, detail){
  // local log always
  let stats = S.get('activity_stats') || {};
  const key = APP.userHash.substring(0,12);
  if(!stats[key]) stats[key] = { label: APP.userLabel, role: APP.role, scans:0, items:0, lastSeen:0 };
  stats[key].scans += 1;
  stats[key].items += (detail.items||0);
  stats[key].lastSeen = Date.now();
  stats[key].label = APP.userLabel; stats[key].role = APP.role;
  S.set('activity_stats', stats);
  // central (best-effort)
  if(APP.worker){
    try {
      await fetch(`${workerBase()}/report`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ section, action, detail, user: APP.userLabel, role: APP.role, ts: Date.now() }),
        signal: AbortSignal.timeout(10000),
      });
    } catch(e){ /* silent */ }
  }
}

// —— لاگ بصری ——
function log(msg,type='info'){
  const box=document.getElementById('logBox'); if(!box) return;
  box.classList.add('show');
  const line=document.createElement('div');
  line.className={info:'log-info',ok:'log-ok',err:'log-err',gold:'log-gold'}[type]||'log-info';
  line.textContent='> '+msg; box.appendChild(line); box.scrollTop=box.scrollHeight;
}
function clearLog(){ const b=document.getElementById('logBox'); if(b){ b.innerHTML=''; b.classList.remove('show'); } }

// —— کمکی ——
function fmtNum(n){ n=Number(n)||0; if(n>=1e6)return(n/1e6).toFixed(1)+'M'; if(n>=1e3)return(n/1e3).toFixed(1)+'K'; return n.toString(); }
function esc(s){ return (s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function toast(msg){ try{ const d=document.createElement('div'); d.textContent=msg; d.className='toast-pop'; document.body.appendChild(d); setTimeout(()=>d.remove(),2200);}catch(e){} }

// —— Setup panel ——
function initSetup(){
  const p = document.getElementById('panel-setup');
  p.innerHTML = `
    <div class="card">
      <div class="card-title"><span class="ico">🌐</span> آدرس سرور پروکسی <span class="line"></span></div>
      <div style="display:flex;gap:8px;">
        <input type="text" id="workerUrl" placeholder="andarzgoo.liara.run" style="flex:1;">
        <button class="btn btn-sm" onclick="saveWorker()">ذخیره</button>
        <button class="btn btn-sm" onclick="testWorker()">تست</button>
      </div>
      <div id="workerStatus"></div>
      <div class="hint">آدرس سرور Node.js لیارا برای بخش‌های محتوا، هویت‌سازی، و نیروی انسانی.<br>بخش رصد مستقیم از <b>andarzgoo.liara.run</b> استفاده می‌کند و نیازی به تنظیم ندارد.</div>
    </div>
    ${APP.isAdmin ? `
    <div class="card">
      <div class="card-title"><span class="ico">🔐</span> کلیدهای API <span class="line"></span></div>
      <div class="sbox sbox-ok" style="margin-top:0;">✅ همه کلیدهای API (Groq، Grok، ScrapeCreators) به‌صورت امن داخل سرور Node.js لیارا ذخیره شده‌اند.</div>
    </div>` : ''}
  `;
  const w = S.get('cfg_worker') || 'andarzgoo.liara.run';
  document.getElementById('workerUrl').value = w;
  APP.worker = w;
}
function saveWorker(){
  APP.worker = cleanUrl(document.getElementById('workerUrl').value);
  S.set('cfg_worker', APP.worker);
  toast('✅ ذخیره شد');
}
async function testWorker(){
  APP.worker = cleanUrl(document.getElementById('workerUrl').value);
  S.set('cfg_worker', APP.worker);
  const el = document.getElementById('workerStatus');
  if(!APP.worker){ el.className='sbox sbox-err'; el.textContent='❌ آدرس را وارد کنید'; return; }
  el.className='sbox sbox-load'; el.innerHTML='<span class="spinner"></span> در حال تست...';
  try{
    const data = await scFetch('https://api.scrapecreators.com/v1/account/credit-balance');
    const c = data.creditCount ?? data.credits_remaining ?? '?';
    el.className='sbox sbox-ok'; el.textContent=`✅ اتصال برقرار · کردیت ScrapeCreators: ${c}`;
  }catch(e){ el.className='sbox sbox-err'; el.textContent='❌ خطا: '+e.message; }
}

// —— boot ——
function bootApp(){
  if(checkAuth()) enterApp();
}
window.bootApp = bootApp;
