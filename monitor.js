// ============================================================
//  monitor.js — بخش رصد
//  رصد اخبار روز + جستجوی موضوع با Groq Compound (سرچ زنده)
//  خروجی: خلاصه + تحلیل + پیشنهاد اقدام + احساسات
// ============================================================

const MONITOR = { mode: 'daily', history: [] };

function initMonitor(){
  MONITOR.history = S.get('monitor_history') || [];
  renderMonitorPanel();
}

function renderMonitorPanel(){
  const p=document.getElementById('panel-monitor');
  p.innerHTML=`
    <div id="monSetupAlert"></div>
    <div class="card">
      <div class="card-title"><span class="ico">📡</span> حالت رصد <span class="line"></span></div>
      <div class="mode-row">
        <div class="mode-opt ${MONITOR.mode==='daily'?'active':''}" id="mon-daily" onclick="monSetMode('daily')"><span class="mode-ico">🌐</span> تحلیل اخبار روز</div>
        <div class="mode-opt ${MONITOR.mode==='topic'?'active':''}" id="mon-topic" onclick="monSetMode('topic')"><span class="mode-ico">🔍</span> جستجوی موضوع</div>
      </div>
      <div id="monTopicWrap" style="display:${MONITOR.mode==='topic'?'block':'none'};">
        <input type="text" id="monTopic" placeholder="موضوع مورد نظر (مثلاً: واکنش به فلان رویداد)" style="direction:rtl;text-align:right;">
        <div class="hint">هوش مصنوعی به‌صورت زنده وب را جستجو می‌کند و تحلیل می‌دهد.</div>
      </div>
      <div id="monDailyWrap" style="display:${MONITOR.mode==='daily'?'block':'none'};">
        <div class="hint">تحلیل کلی مهم‌ترین اخبار روز اسرائیل با جستجوی زنده.</div>
      </div>
      <button class="btn btn-primary" style="margin-top:12px;" id="monBtn" onclick="monRun()">📡 شروع رصد</button>
    </div>

    <div class="card">
      <div class="card-title"><span class="ico">🎯</span> ابزارهای تکمیلی <span class="line"></span></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-sm" onclick="monQuick('سنتیمنت و واکنش افکار عمومی به مهم‌ترین رویداد امروز اسرائیل')">🎭 تحلیل احساسات</button>
        <button class="btn btn-sm" onclick="monQuick('مهم‌ترین روندها و موضوعات داغ امروز در رسانه‌های اسرائیل')">📈 روندهای داغ</button>
        <button class="btn btn-sm" onclick="monQuick('اخبار فوری و مهم چند ساعت اخیر اسرائیل')">⚡ اخبار فوری</button>
      </div>
    </div>

    <div id="monResult"></div>

    <div class="card" id="monHistCard" style="display:none;">
      <div class="card-title"><span class="ico">📋</span> تاریخچه رصد <span class="line"></span></div>
      <div id="monHistList"></div>
    </div>
  `;
  monRenderHistory();
}

function onShow_monitor(){ monCheckSetup(); }
function monCheckSetup(){ const el=document.getElementById('monSetupAlert'); if(!el)return; if(!APP.worker){ el.innerHTML=`<div class="sbox sbox-warn" style="margin-top:0;margin-bottom:14px;">⚠️ Worker تنظیم نشده${APP.isAdmin?` <button class="btn btn-sm" style="width:100%;margin-top:9px;" onclick="switchTab('setup')">تنظیمات</button>`:''}</div>`; } else el.innerHTML=''; }

function monSetMode(m){ MONITOR.mode=m; document.getElementById('mon-daily').classList.toggle('active',m==='daily'); document.getElementById('mon-topic').classList.toggle('active',m==='topic'); document.getElementById('monTopicWrap').style.display=m==='topic'?'block':'none'; document.getElementById('monDailyWrap').style.display=m==='daily'?'block':'none'; }

async function monQuick(q){ await monExecute(q, 'ابزار سریع'); }

async function monRun(){
  let query, label;
  if(MONITOR.mode==='topic'){
    const t=document.getElementById('monTopic').value.trim();
    if(!t){ alert('موضوع را وارد کنید'); return; }
    query=`درباره این موضوع به‌صورت زنده جستجو کن و تحلیل کامل بده: «${t}». منابع خبری اسرائیلی و بین‌المللی را بررسی کن.`;
    label='موضوع: '+t;
  } else {
    query='مهم‌ترین اخبار امروز اسرائیل را به‌صورت زنده جستجو کن و یک بریفینگ کامل بده.';
    label='تحلیل اخبار روز';
  }
  await monExecute(query, label);
}

async function monExecute(query, label){
  if(!APP.worker){ if(APP.isAdmin)switchTab('setup'); else alert('Worker تنظیم نشده'); return; }
  const btn=document.getElementById('monBtn'); if(btn){ btn.disabled=true; btn.innerHTML='<span class="spinner"></span> در حال رصد...'; }
  const box=document.getElementById('monResult'); box.innerHTML='<div class="sbox sbox-load"><span class="spinner"></span> جستجوی زنده و تحلیل... (ممکن است تا ۳۰ ثانیه طول بکشد)</div>';
  clearLog(); log('اتصال به موتور رصد...','gold');
  try{
    const sys='تو یک تحلیلگر ارشد اطلاعاتی هستی که رسانه‌های اسرائیل را رصد می‌کنی. پاسخ را کامل و فقط به زبان فارسی بده. ساختار: ۱) خلاصه رویدادها ۲) تحلیل تحلیلگر ۳) پیشنهاد اقدام. از جستجوی زنده وب استفاده کن.';
    const usr=`${query}\n\nپاسخ را با این سه بخش مشخص بده:\n\n📋 خلاصه:\n(مهم‌ترین رویدادها و اخبار)\n\n🔍 تحلیل:\n(تحلیل عمیق، زمینه، و معنای رویدادها)\n\n🎯 پیشنهاد اقدام:\n(چه واکنش یا اقدامی منطقی است)`;
    log('جستجوی زنده وب توسط هوش مصنوعی...','info');
    const raw=await groqChat('monitor',[{role:'system',content:sys},{role:'user',content:usr}],{model:'groq/compound',temperature:0.6,max_tokens:3500});
    const result={query:label,text:raw,ts:Date.now()};
    MONITOR.history.unshift(result); if(MONITOR.history.length>20)MONITOR.history.pop(); S.set('monitor_history',MONITOR.history);
    monRenderResult(result);
    sendReport('monitor','رصد',{items:1,query:label});
    monRenderHistory();
    log('✓ رصد کامل شد','ok');
  }catch(e){ box.innerHTML=`<div class="sbox sbox-err">❌ خطا: ${esc(e.message)}<br><span style="font-size:11px">اگر خطای مدل بود، ممکن است سهمیه روزانه کلید رصد تمام شده باشد.</span></div>`; log('خطا: '+e.message,'err'); }
  if(btn){ btn.disabled=false; btn.innerHTML='📡 شروع رصد'; }
}

function monRenderResult(r){
  const box=document.getElementById('monResult');
  const d=new Date(r.ts);
  const formatted = monFormatText(r.text);
  box.innerHTML=`<div class="card">
    <div class="card-title"><span class="ico">📡</span> ${esc(r.query)} <span class="line"></span></div>
    <div class="ai-box" style="direction:rtl;text-align:right;">${formatted}</div>
    <div style="display:flex;gap:8px;margin-top:11px;">
      <button class="btn btn-sm" onclick="monCopy()">📋 کپی گزارش</button>
    </div>
    <div class="user-meta mono" style="direction:rtl;text-align:right;margin-top:8px;">${d.toLocaleString('fa-IR')}</div>
  </div>`;
  box._text=r.text;
}
function monFormatText(t){
  return esc(t)
    .replace(/📋\s*خلاصه[:：]?/g,'<h4 style="color:var(--cyanGlow);margin:10px 0 6px;">📋 خلاصه</h4>')
    .replace(/🔍\s*تحلیل[:：]?/g,'<h4 style="color:var(--gold2);margin:14px 0 6px;">🔍 تحلیل</h4>')
    .replace(/🎯\s*پیشنهاد اقدام[:：]?/g,'<h4 style="color:var(--green2);margin:14px 0 6px;">🎯 پیشنهاد اقدام</h4>')
    .replace(/\n/g,'<br>');
}
function monCopy(){ const t=document.getElementById('monResult')._text; if(t)navigator.clipboard?.writeText(t).then(()=>toast('✅ کپی شد')).catch(()=>{}); }

function monRenderHistory(){
  const card=document.getElementById('monHistCard'), list=document.getElementById('monHistList'); if(!card)return;
  if(!MONITOR.history.length){ card.style.display='none'; return; }
  card.style.display='block';
  list.innerHTML=MONITOR.history.map((r,i)=>{ const d=new Date(r.ts); return `<div class="user-card" style="cursor:pointer" onclick="monLoad(${i})"><div class="user-info"><div class="user-name" style="direction:rtl;text-align:right;">${esc(r.query)}</div><div class="user-meta mono" style="direction:rtl;text-align:right;">${d.toLocaleString('fa-IR')}</div></div><span class="badge badge-done">📡</span></div>`; }).join('');
}
function monLoad(i){ monRenderResult(MONITOR.history[i]); document.getElementById('monResult').scrollIntoView({behavior:'smooth'}); }
