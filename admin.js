// ============================================================
//  admin.js — پنل مدیریت (فرماندهی)
//  نظارت مرکزی، گزارش‌های KV، خلاصه هوشمند، مدیریت کدها
// ============================================================

const ADMIN = { reports: [], filter: 'all' };

function initAdmin(){
  if(!APP.isAdmin) return;
  renderAdminPanel();
}

function renderAdminPanel(){
  const p=document.getElementById('panel-admin');
  p.innerHTML=`
    <div class="card">
      <div class="card-title"><span class="ico">📊</span> داشبورد مرکزی <span class="line"></span></div>
      <div class="stats-row" id="adminStats">
        <div class="stat"><div class="stat-num">—</div><div class="stat-label">در حال بارگذاری</div></div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-sm" onclick="adminLoadReports()">🔄 بارگذاری گزارش‌ها</button>
        <button class="btn btn-sm" onclick="adminAISummary()">🤖 خلاصه هوشمند</button>
      </div>
      <div id="adminConnStatus"></div>
    </div>

    <div id="adminAIBox"></div>

    <div class="card">
      <div class="card-title"><span class="ico">📡</span> گزارش فعالیت بخش‌ها <span class="line"></span></div>
      <div class="filter-row">
        <span class="filter-pill fa" id="af-all" onclick="adminFilter('all')">همه</span>
        <span class="filter-pill" id="af-content" onclick="adminFilter('content')">✍️ محتوا</span>
        <span class="filter-pill" id="af-monitor" onclick="adminFilter('monitor')">📡 رصد</span>
        <span class="filter-pill" id="af-persona" onclick="adminFilter('persona')">🎭 هویت</span>
        <span class="filter-pill" id="af-hr" onclick="adminFilter('hr')">👥 نیرو</span>
      </div>
      <div id="adminReports"><div class="empty">برای مشاهده، «بارگذاری گزارش‌ها» را بزنید</div></div>
    </div>

    <div class="card">
      <div class="card-title"><span class="ico">👤</span> فعالیت کاربران (محلی) <span class="line"></span></div>
      <div id="adminUsers"></div>
    </div>

    <div class="card">
      <div class="card-title"><span class="ico">🔑</span> مدیریت کدهای عبور <span class="line"></span></div>
      <div class="hint" style="margin-bottom:10px;">افزودن/حذف کد و تعیین بخش. تغییرات روی این دستگاه ذخیره می‌شود.</div>
      <input type="text" id="newPwCode" placeholder="کد جدید (ABCD-1234)" style="margin-bottom:8px;">
      <div class="limit-row" style="margin:0 0 8px;">
        <label>بخش:</label>
        <select id="newPwRole">
          <option value="content">محتوا</option>
          <option value="monitor">رصد</option>
          <option value="persona">هویت‌سازی</option>
          <option value="hr">نیروی انسانی</option>
        </select>
      </div>
      <button class="btn btn-sm" style="width:100%;" onclick="adminAddPw()">➕ افزودن کد</button>
      <div id="adminPwList" style="margin-top:12px;"></div>
      <button class="btn btn-danger" style="width:100%;margin-top:10px;" onclick="adminResetPw()">بازگردانی کدهای پیش‌فرض</button>
    </div>

    <div class="card">
      <div class="card-title"><span class="ico">🗑️</span> مدیریت داده <span class="line"></span></div>
      <button class="btn btn-danger" style="width:100%;margin-bottom:8px;" onclick="adminClearLocal()">پاک کردن آمار محلی این دستگاه</button>
      <button class="btn btn-danger" style="width:100%;" onclick="adminClearCentral()">پاک کردن همه گزارش‌های مرکزی (KV)</button>
    </div>
  `;
  adminRenderUsers();
  adminRenderPwList();
  adminRenderStatsLocal();
}

function onShow_admin(){ if(APP.isAdmin){ adminRenderUsers(); adminRenderStatsLocal(); } }

// —— central reports ——
async function adminLoadReports(){
  const el=document.getElementById('adminConnStatus');
  if(!APP.worker){ el.innerHTML='<div class="sbox sbox-warn">⚠️ Worker تنظیم نشده — به تنظیمات بروید</div>'; return; }
  el.innerHTML='<div class="sbox sbox-load"><span class="spinner"></span> بارگذاری از سرور مرکزی...</div>';
  try{
    const res=await fetch(`${workerBase()}/reports?limit=300`,{signal:AbortSignal.timeout(20000)});
    const data=await res.json();
    if(data.error) throw new Error(data.error);
    ADMIN.reports=data.reports||[];
    el.innerHTML=`<div class="sbox sbox-ok">✅ ${ADMIN.reports.length} گزارش بارگذاری شد</div>`;
    adminRenderReports();
    adminRenderStatsCentral();
  }catch(e){
    el.innerHTML=`<div class="sbox sbox-err">❌ ${esc(e.message)}<br><span style="font-size:11px">اگر KV راه‌اندازی نشده، راهنمای نصب را ببینید.</span></div>`;
  }
}

function adminFilter(f){ ADMIN.filter=f; ['all','content','monitor','persona','hr'].forEach(x=>{const e=document.getElementById('af-'+x);if(e)e.className='filter-pill'+(x===f?' fa':'');}); adminRenderReports(); }

function adminRenderReports(){
  const box=document.getElementById('adminReports');
  let list=ADMIN.reports;
  if(ADMIN.filter!=='all')list=list.filter(r=>r.section===ADMIN.filter);
  if(!list.length){ box.innerHTML='<div class="empty">گزارشی نیست</div>'; return; }
  const secMap={content:'✍️ محتوا',monitor:'📡 رصد',persona:'🎭 هویت',hr:'👥 نیرو'};
  const secCls={content:'sec-content',monitor:'sec-monitor',persona:'sec-persona',hr:'sec-hr'};
  box.innerHTML=list.slice(0,100).map(r=>{
    const d=new Date(r.ts||r.serverTs);
    let extra='';
    if(r.detail){
      if(r.detail.url)extra+=`<div class="user-meta" style="direction:ltr;text-align:left;">${esc(r.detail.url.replace('https://www.instagram.com',''))}</div>`;
      if(r.detail.query)extra+=`<div class="user-meta" style="direction:rtl;text-align:right;">${esc(r.detail.query)}</div>`;
      if(r.detail.selected)extra+=`<div class="comment-he" style="font-size:12px;margin-top:5px;background:var(--bg2);padding:7px;border-radius:8px;" dir="rtl">${esc(r.detail.selected)}</div>`;
      if(r.detail.items)extra+=`<div class="user-meta">${r.detail.items} مورد</div>`;
    }
    return `<div class="admin-report-item">
      <div class="admin-report-head">
        <span class="sec-badge ${secCls[r.section]||''}">${secMap[r.section]||r.section}</span>
        <span style="font-size:12px;color:var(--gold2);">${esc(r.user||'?')}</span>
      </div>
      <div style="font-size:13px;margin-top:6px;">${esc(r.action||'')}</div>
      ${extra}
      <div class="user-meta mono" style="direction:rtl;text-align:right;margin-top:5px;">${d.toLocaleString('fa-IR')}</div>
    </div>`;
  }).join('');
}

// —— AI management summary ——
async function adminAISummary(){
  const box=document.getElementById('adminAIBox');
  if(!APP.worker){ box.innerHTML='<div class="sbox sbox-warn">⚠️ Worker تنظیم نشده</div>'; return; }
  if(!ADMIN.reports.length){ await adminLoadReports(); }
  if(!ADMIN.reports.length){ box.innerHTML='<div class="card"><div class="sbox sbox-warn" style="margin:0;">گزارشی برای تحلیل نیست</div></div>'; return; }
  box.innerHTML='<div class="card"><div class="sbox sbox-load" style="margin:0;"><span class="spinner"></span> تولید خلاصه مدیریتی با هوش مصنوعی...</div></div>';
  try{
    const counts={}; ADMIN.reports.forEach(r=>{counts[r.section]=(counts[r.section]||0)+1;});
    const byUser={}; ADMIN.reports.forEach(r=>{const u=r.user||'?';byUser[u]=(byUser[u]||0)+1;});
    const recent=ADMIN.reports.slice(0,40).map(r=>`[${r.section}] ${r.user}: ${r.action}`).join('\n');
    const sys='تو دستیار فرماندهی هستی. یک گزارش مدیریتی کوتاه و حرفه‌ای به فارسی بنویس.';
    const usr=`آمار فعالیت بخش‌ها:\n${JSON.stringify(counts)}\n\nفعالیت هر کاربر:\n${JSON.stringify(byUser)}\n\nآخرین فعالیت‌ها:\n${recent}\n\nیک خلاصه مدیریتی بده شامل: وضعیت کلی، فعال‌ترین بخش‌ها، نکات قابل توجه، و توصیه.`;
    const raw=await groqChat('monitor',[{role:'system',content:sys},{role:'user',content:usr}],{temperature:0.5,max_tokens:1500});
    box.innerHTML=`<div class="card"><div class="card-title"><span class="ico">🤖</span> خلاصه مدیریتی هوشمند <span class="line"></span></div><div class="ai-box" style="direction:rtl;text-align:right;">${esc(raw).replace(/\n/g,'<br>')}</div></div>`;
  }catch(e){ box.innerHTML=`<div class="card"><div class="sbox sbox-err" style="margin:0;">❌ ${esc(e.message)}</div></div>`; }
}

// —— stats ——
function adminRenderStatsCentral(){
  const counts={content:0,monitor:0,persona:0,hr:0};
  ADMIN.reports.forEach(r=>{ if(counts[r.section]!==undefined)counts[r.section]++; });
  const users=new Set(ADMIN.reports.map(r=>r.user)).size;
  document.getElementById('adminStats').innerHTML=`
    <div class="stat" style="--barcolor:var(--gold)"><div class="stat-num" style="color:var(--gold2)">${ADMIN.reports.length}</div><div class="stat-label">کل گزارش‌ها</div></div>
    <div class="stat" style="--barcolor:var(--cyan2)"><div class="stat-num" style="color:var(--cyan2)">${users}</div><div class="stat-label">کاربر فعال</div></div>
    <div class="stat" style="--barcolor:var(--purple2)"><div class="stat-num" style="color:var(--purple2)">${counts.monitor}</div><div class="stat-label">رصد</div></div>
    <div class="stat" style="--barcolor:var(--green2)"><div class="stat-num" style="color:var(--green2)">${counts.content}</div><div class="stat-label">محتوا</div></div>
  `;
}
function adminRenderStatsLocal(){
  const stats=S.get('activity_stats')||{};
  const u=Object.keys(stats).length;
  const sc=Object.values(stats).reduce((a,v)=>a+v.scans,0);
  const el=document.getElementById('adminStats');
  if(el && !ADMIN.reports.length){
    el.innerHTML=`
      <div class="stat" style="--barcolor:var(--gold)"><div class="stat-num" style="color:var(--gold2)">${u}</div><div class="stat-label">کاربر (محلی)</div></div>
      <div class="stat" style="--barcolor:var(--cyan2)"><div class="stat-num" style="color:var(--cyan2)">${sc}</div><div class="stat-label">فعالیت محلی</div></div>
      <div class="stat" style="--barcolor:var(--purple2)"><div class="stat-num" style="color:var(--text3)">—</div><div class="stat-label">مرکزی</div></div>
      <div class="stat" style="--barcolor:var(--green2)"><div class="stat-num" style="color:var(--text3)">—</div><div class="stat-label">مرکزی</div></div>
    `;
  }
}
function adminRenderUsers(){
  const stats=S.get('activity_stats')||{};
  const entries=Object.entries(stats);
  const box=document.getElementById('adminUsers'); if(!box)return;
  if(!entries.length){ box.innerHTML='<div class="empty">فعالیت محلی ثبت نشده</div>'; return; }
  box.innerHTML=entries.sort((a,b)=>b[1].scans-a[1].scans).map(([k,v])=>{
    const d=new Date(v.lastSeen);
    return `<div class="admin-report-item"><div class="admin-report-head"><span style="font-size:13px;font-weight:700;color:var(--gold2);">${esc(v.label||k)}</span><span class="sec-badge sec-${v.role||'hr'}">${esc(v.role||'')}</span></div><div class="user-meta" style="direction:rtl;text-align:right;margin-top:5px;">🔍 ${v.scans} فعالیت · ${fmtNum(v.items)} مورد · ${d.toLocaleDateString('fa-IR')}</div></div>`;
  }).join('');
}

// —— password management ——
function adminRenderPwList(){
  const list=getUsers();
  const roleMap={content:'محتوا',monitor:'رصد',persona:'هویت',hr:'نیرو'};
  document.getElementById('adminPwList').innerHTML=list.map((u,i)=>`<div class="pw-item"><span class="code">${esc(u.plain||u.label||'کد '+(i+1))}</span><span class="role-tag">${roleMap[u.role]||u.role}</span><span class="del" onclick="adminDelPw(${i})">×</span></div>`).join('');
}
async function adminAddPw(){
  const code=document.getElementById('newPwCode').value.trim().toUpperCase();
  const role=document.getElementById('newPwRole').value;
  if(!code){ alert('کد را وارد کنید'); return; }
  const hash=await sha256(code);
  let list=getUsers().slice();
  if(list.some(u=>u.hash===hash)){ alert('این کد قبلاً وجود دارد'); return; }
  const roleMap={content:'محتوا',monitor:'رصد',persona:'هویت‌سازی',hr:'نیروی انسانی'};
  list.push({hash,role,label:roleMap[role]+' (جدید)',plain:code});
  S.set('admin_pw_list',list); document.getElementById('newPwCode').value=''; adminRenderPwList(); toast('✅ کد افزوده شد');
}
function adminDelPw(i){ let list=getUsers().slice(); if(list.length<=1){alert('حداقل یک کد باید بماند');return;} if(confirm('این کد حذف شود؟')){ list.splice(i,1); S.set('admin_pw_list',list); adminRenderPwList(); } }
function adminResetPw(){ if(confirm('به کدهای پیش‌فرض بازگردد؟')){ S.del('admin_pw_list'); adminRenderPwList(); toast('↺ بازنشانی شد'); } }

// —— data management ——
function adminClearLocal(){ if(confirm('آمار محلی این دستگاه پاک شود؟')){ S.del('activity_stats'); adminRenderUsers(); adminRenderStatsLocal(); } }
async function adminClearCentral(){
  if(!APP.worker){ alert('Worker تنظیم نشده'); return; }
  if(!confirm('همه گزارش‌های مرکزی پاک شوند؟ این عمل برگشت‌ناپذیر است.')) return;
  try{ const res=await fetch(`${workerBase()}/reports/clear`,{method:'POST',signal:AbortSignal.timeout(20000)}); const d=await res.json(); if(d.error)throw new Error(d.error); ADMIN.reports=[]; adminRenderReports(); toast(`✅ ${d.deleted||0} گزارش پاک شد`); }catch(e){ alert('خطا: '+e.message); }
}
