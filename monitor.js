// ============================================================
//  monitor.js — بخش رصد حرفه‌ای (نسخه ۳.۰)
//  موتور: xAI Grok (real-time، به X/Twitter وصله)
//  از Worker رد میشه چون سرور ایران تحریمه
// ============================================================

const MONITOR = {
  history: [],
  activeTab: 'daily',
  savedTopics: [],
};

function initMonitor(){
  MONITOR.history = S.get('monitor_history') || [];
  MONITOR.savedTopics = S.get('monitor_topics') || [];
  renderMonitorPanel();
}

function renderMonitorPanel(){
  const p = document.getElementById('panel-monitor');
  p.innerHTML = `
    <div id="monSetupAlert"></div>

    <div class="card">
      <div class="card-title"><span class="ico">⚡</span> ابزارهای سریع <span class="line"></span></div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;" id="monQuickGrid">
        <button class="mon-tool-btn" onclick="monQuickTool('breaking')">⚡ اخبار فوری</button>
        <button class="mon-tool-btn" onclick="monQuickTool('trends')">📈 روندهای داغ</button>
        <button class="mon-tool-btn" onclick="monQuickTool('sentiment')">🎭 تحلیل احساسات</button>
        <button class="mon-tool-btn" onclick="monQuickTool('military')">🎖️ نظامی-امنیتی</button>
        <button class="mon-tool-btn" onclick="monQuickTool('economy')">💰 اقتصاد و بازار</button>
        <button class="mon-tool-btn" onclick="monQuickTool('politics')">🏛️ سیاست داخلی</button>
        <button class="mon-tool-btn" onclick="monQuickTool('social')">👥 فضای اجتماعی</button>
        <button class="mon-tool-btn" onclick="monQuickTool('weekly')">📊 گزارش هفتگی</button>
      </div>
    </div>

    <div class="card">
      <div class="card-title"><span class="ico">📡</span> رصد پیشرفته <span class="line"></span></div>
      <div class="tabs" style="margin-bottom:14px;">
        <button class="tab ${MONITOR.activeTab==='daily'?'active':''}" onclick="monSwitchTab('daily')">🌐 تحلیل روز</button>
        <button class="tab ${MONITOR.activeTab==='topic'?'active':''}" onclick="monSwitchTab('topic')">🔍 موضوع خاص</button>
        <button class="tab ${MONITOR.activeTab==='profile'?'active':''}" onclick="monSwitchTab('profile')">👤 رصد پیج</button>
        <button class="tab ${MONITOR.activeTab==='compare'?'active':''}" onclick="monSwitchTab('compare')">⚖️ مقایسه منابع</button>
      </div>

      <div id="mon-tab-daily" style="display:${MONITOR.activeTab==='daily'?'block':'none'};">
        <div class="hint" style="margin-bottom:10px;">تحلیل جامع مهم‌ترین اخبار روز اسرائیل — اطلاعات لحظه‌ای از X و رسانه‌های معتبر</div>
        <div class="limit-row" style="margin-bottom:12px;">
          <label>عمق تحلیل:</label>
          <select id="monDailyDepth">
            <option value="brief">خلاصه سریع</option>
            <option value="normal" selected>تحلیل معمول</option>
            <option value="deep">تحلیل عمیق</option>
          </select>
        </div>
        <button class="btn btn-primary" id="monDailyBtn" onclick="monRunDaily()">🌐 تحلیل اخبار روز</button>
      </div>

      <div id="mon-tab-topic" style="display:${MONITOR.activeTab==='topic'?'block':'none'};">
        <input type="text" id="monTopicInput" placeholder="موضوع مورد نظر..." style="direction:rtl;text-align:right;margin-bottom:9px;">
        <div style="display:flex;gap:8px;margin-bottom:10px;">
          <button class="btn btn-sm" onclick="monSaveTopic()">💾 ذخیره</button>
          <button class="btn btn-sm" onclick="monShowSavedTopics()">📂 ذخیره‌شده‌ها</button>
        </div>
        <div id="monSavedTopicsWrap" style="display:none;margin-bottom:10px;"></div>
        <button class="btn btn-primary" id="monTopicBtn" onclick="monRunTopic()">🔍 جستجو و تحلیل</button>
      </div>

      <div id="mon-tab-profile" style="display:${MONITOR.activeTab==='profile'?'block':'none'};">
        <input type="text" id="monProfileInput" placeholder="نام پیج یا شخصیت اسرائیلی..." style="direction:rtl;text-align:right;margin-bottom:9px;">
        <div class="hint" style="margin-bottom:10px;">آخرین فعالیت‌ها و موضع‌گیری‌های یک شخصیت یا رسانه اسرائیلی</div>
        <button class="btn btn-primary" id="monProfileBtn" onclick="monRunProfile()">👤 رصد پیج/شخصیت</button>
      </div>

      <div id="mon-tab-compare" style="display:${MONITOR.activeTab==='compare'?'block':'none'};">
        <input type="text" id="monCompareInput" placeholder="موضوع برای مقایسه رسانه‌ها..." style="direction:rtl;text-align:right;margin-bottom:9px;">
        <button class="btn btn-primary" id="monCompareBtn" onclick="monRunCompare()">⚖️ مقایسه دیدگاه رسانه‌ها</button>
      </div>
    </div>

    <div id="monResult"></div>

    <div class="card" id="monHistCard" style="display:none;">
      <div class="card-title"><span class="ico">📋</span> تاریخچه رصد (<span id="monHistCount">0</span>) <span class="line"></span></div>
      <div id="monHistList"></div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `.mon-tool-btn{background:var(--surface);border:1px solid var(--border2);color:var(--text2);border-radius:10px;padding:10px 8px;font-size:12px;font-weight:600;font-family:'Vazirmatn';cursor:pointer;transition:all 0.2s;text-align:center;width:100%;}.mon-tool-btn:hover{border-color:var(--cyan2);color:var(--cyanGlow);background:rgba(30,158,138,0.08);}`;
  if(!document.querySelector('style[data-mon]')){ style.setAttribute('data-mon','1'); document.head.appendChild(style); }

  monRenderHistory();
}

function onShow_monitor(){ monCheckSetup(); }
function monCheckSetup(){
  const el = document.getElementById('monSetupAlert'); if(!el) return;
  if(!APP.worker){
    el.innerHTML = `<div class="sbox sbox-warn" style="margin-top:0;margin-bottom:14px;">⚠️ Worker تنظیم نشده${APP.isAdmin?` <button class="btn btn-sm" style="width:100%;margin-top:9px;" onclick="switchTab('setup')">تنظیمات</button>`:''}</div>`;
  } else { el.innerHTML = ''; }
}

function monSwitchTab(t){
  MONITOR.activeTab = t;
  ['daily','topic','profile','compare'].forEach(x=>{
    const el = document.getElementById('mon-tab-'+x);
    if(el) el.style.display = x===t?'block':'none';
  });
  document.querySelectorAll('#panel-monitor .tab').forEach((b,i)=>{
    const tabs=['daily','topic','profile','compare'];
    b.classList.toggle('active', tabs[i]===t);
  });
}

// —— Grok API (مستقیم، بدون Worker) ——
async function grokChat(messages, opts={}){
  const GROK_KEY = 'xai-V16xLRnNaqsFpovnvWZrLI3tGaerkKDre7ViF6zUTIbjYbOtxePJPQ8cyt56AICSOvA0UmBmxpVw9UqR';

  const payload = {
    model: opts.model || 'grok-3',
    messages,
    temperature: opts.temperature ?? 0.5,
    max_tokens: opts.max_tokens ?? 2000,
  };

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROK_KEY}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(90000),
  });

  if(!res.ok){
    const err = await res.text();
    throw new Error(`HTTP ${res.status}: ${err.substring(0,300)}`);
  }

  const data = await res.json();
  if(data.error) throw new Error(typeof data.error==='string'?data.error:JSON.stringify(data.error));
  if(!data.choices?.[0]) throw new Error('پاسخ نامعتبر از Grok');
  return data.choices[0].message.content;
}

// —— ابزارهای سریع ——
const QUICK_TOOLS = {
  breaking: { label:'⚡ اخبار فوری', prompt: 'آخرین اخبار فوری چند ساعت اخیر اسرائیل چیست؟ فقط مهم‌ترین رویدادهای امروز.' },
  trends: { label:'📈 روندهای داغ', prompt: 'مهم‌ترین موضوعات داغ و ترند امروز در رسانه‌ها و شبکه‌های اجتماعی اسرائیل چیست؟' },
  sentiment: { label:'🎭 تحلیل احساسات', prompt: 'احساسات و واکنش عمومی مردم اسرائیل به مهم‌ترین رویداد امروز چیست؟ فضای کلی مثبت است یا منفی؟' },
  military: { label:'🎖️ نظامی-امنیتی', prompt: 'آخرین اخبار نظامی، امنیتی، و دفاعی اسرائیل امروز چیست؟' },
  economy: { label:'💰 اقتصاد و بازار', prompt: 'وضعیت اقتصاد، بازار سهام، و اخبار مالی اسرائیل امروز چگونه است؟' },
  politics: { label:'🏛️ سیاست داخلی', prompt: 'مهم‌ترین اخبار سیاست داخلی، کنست، و دولت اسرائیل امروز چیست؟' },
  social: { label:'👥 فضای اجتماعی', prompt: 'فضای اجتماعی، اعتراضات، و بحث‌های عمومی در جامعه اسرائیل امروز چیست؟' },
  weekly: { label:'📊 گزارش هفتگی', prompt: 'مهم‌ترین رویدادهای هفته گذشته اسرائیل را به صورت گزارش جامع ارائه بده.' },
};

async function monQuickTool(type){
  const tool = QUICK_TOOLS[type];
  if(!tool) return;
  await monExecute(tool.prompt, tool.label, 'brief');
}

// —— اجراها ——
async function monRunDaily(){
  const depth = document.getElementById('monDailyDepth').value;
  const prompts = {
    brief: 'مهم‌ترین اخبار امروز اسرائیل را در چند بند خلاصه کن.',
    normal: 'تحلیل جامع مهم‌ترین اخبار روز اسرائیل شامل سیاست، نظامی، اقتصاد، و اجتماعی.',
    deep: 'تحلیل عمیق اخبار روز اسرائیل. زمینه تاریخی، پیامدها، و چشم‌انداز آینده را هم بررسی کن.',
  };
  await monExecute(prompts[depth], '🌐 تحلیل اخبار روز', depth);
}

async function monRunTopic(){
  const topic = document.getElementById('monTopicInput').value.trim();
  if(!topic){ alert('موضوع را وارد کنید'); return; }
  await monExecute(`درباره «${topic}» در اسرائیل امروز چه خبر است؟ آخرین اطلاعات را بده.`, '🔍 '+topic, 'normal');
}

async function monRunProfile(){
  const profile = document.getElementById('monProfileInput').value.trim();
  if(!profile){ alert('نام را وارد کنید'); return; }
  await monExecute(`آخرین اخبار، اظهارات، و فعالیت‌های «${profile}» در اسرائیل چیست؟`, '👤 '+profile, 'normal');
}

async function monRunCompare(){
  const topic = document.getElementById('monCompareInput').value.trim();
  if(!topic){ alert('موضوع را وارد کنید'); return; }
  await monExecute(`رسانه‌های مختلف اسرائیل درباره «${topic}» چه دیدگاه‌هایی دارند؟ تفاوت دیدگاه‌ها را مقایسه کن.`, '⚖️ مقایسه: '+topic, 'normal');
}

// —— موتور اصلی ——
async function monExecute(query, label, depth){
  if(!APP.worker){ if(APP.isAdmin)switchTab('setup'); else alert('Worker تنظیم نشده'); return; }

  ['monDailyBtn','monTopicBtn','monProfileBtn','monCompareBtn'].forEach(id=>{
    const el=document.getElementById(id); if(el){el.disabled=true;el.innerHTML='<span class="spinner"></span> در حال رصد...';}
  });

  const box = document.getElementById('monResult');
  box.innerHTML = `<div class="card"><div class="sbox sbox-load" style="margin:0;"><span class="spinner"></span> در حال دریافت اخبار لحظه‌ای... <span style="color:var(--text3);font-size:11px;">(تا ۳۰ ثانیه)</span></div></div>`;
  clearLog(); log('رصد: '+label,'gold');

  const today = new Date().toLocaleDateString('fa-IR');
  const todayEn = new Date().toISOString().split('T')[0];

  const sys = `تو یک تحلیلگر ارشد اطلاعاتی متخصص در رسانه‌های اسرائیل هستی.
تاریخ امروز: ${today} (${todayEn})
از آخرین اطلاعات real-time خود استفاده کن. فقط اخبار امروز و چند روز اخیر مهم است.
پاسخ را کامل و فقط به زبان فارسی بده با این ساختار:

📋 خلاصه:
[مهم‌ترین رویدادهای امروز]

🔍 تحلیل:
[تحلیل عمیق و زمینه رویدادها]

📊 سنجش احساسات:
[فضای کلی جامعه: مثبت/منفی/خنثی + توضیح]

🎯 پیشنهاد اقدام:
[اقدامات عملی پیشنهادی]

📌 منابع:
[منابع خبری استفاده‌شده]`;

  const maxTokens = depth==='brief'?1000:depth==='deep'?3000:2000;
  const model = depth==='deep' ? 'grok-3' : 'grok-3-fast';

  try{
    const raw = await grokChat(
      [{role:'system',content:sys},{role:'user',content:query}],
      { model, temperature:0.4, max_tokens: maxTokens }
    );

    const result = { query:label, text:raw, ts:Date.now(), depth };
    MONITOR.history.unshift(result);
    if(MONITOR.history.length>30) MONITOR.history.pop();
    S.set('monitor_history', MONITOR.history);
    monRenderResult(result);
    sendReport('monitor', 'رصد: '+label, {items:1, query:label});
    monRenderHistory();
    log('✓ رصد کامل شد','ok');
  }catch(e){
    box.innerHTML = `<div class="card"><div class="sbox sbox-err" style="margin:0;">❌ ${esc(e.message)}</div></div>`;
    log('خطا: '+e.message,'err');
  }

  ['monDailyBtn','monTopicBtn','monProfileBtn','monCompareBtn'].forEach(id=>{
    const el=document.getElementById(id); if(el){el.disabled=false;
      const labels={'monDailyBtn':'🌐 تحلیل اخبار روز','monTopicBtn':'🔍 جستجو و تحلیل','monProfileBtn':'👤 رصد پیج/شخصیت','monCompareBtn':'⚖️ مقایسه دیدگاه رسانه‌ها'};
      el.innerHTML=labels[id]||'اجرا';
    }
  });
}

// —— رندر نتیجه ——
function monRenderResult(r){
  const box = document.getElementById('monResult');
  const d = new Date(r.ts);
  const formatted = monFormatText(r.text);
  box.innerHTML = `<div class="card">
    <div class="card-title"><span class="ico">📡</span> ${esc(r.query)} <span class="line"></span></div>
    <div class="ai-box" style="direction:rtl;text-align:right;line-height:2;">${formatted}</div>
    <div style="display:flex;gap:8px;margin-top:13px;flex-wrap:wrap;">
      <button class="btn btn-sm" onclick="monCopy()">📋 کپی گزارش</button>
      <button class="btn btn-sm" onclick="monExportText()">📥 دانلود</button>
    </div>
    <div class="user-meta mono" style="direction:rtl;text-align:right;margin-top:8px;">${d.toLocaleString('fa-IR')}</div>
  </div>`;
  box._text = r.text;
  box._label = r.query;
}

function monFormatText(t){
  return esc(t)
    .replace(/📋\s*خلاصه[:：]?/g,'<h4 style="color:var(--cyanGlow);margin:14px 0 7px;font-size:14px;">📋 خلاصه</h4>')
    .replace(/🔍\s*تحلیل[:：]?/g,'<h4 style="color:var(--gold2);margin:14px 0 7px;font-size:14px;">🔍 تحلیل</h4>')
    .replace(/📊\s*سنجش احساسات[:：]?/g,'<h4 style="color:var(--purple2);margin:14px 0 7px;font-size:14px;">📊 سنجش احساسات</h4>')
    .replace(/🎯\s*پیشنهاد اقدام[:：]?/g,'<h4 style="color:var(--green2);margin:14px 0 7px;font-size:14px;">🎯 پیشنهاد اقدام</h4>')
    .replace(/📌\s*منابع[:：]?/g,'<h4 style="color:var(--text3);margin:14px 0 7px;font-size:13px;">📌 منابع</h4>')
    .replace(/\n/g,'<br>');
}

function monCopy(){ const t=document.getElementById('monResult')._text; if(t)navigator.clipboard?.writeText(t).then(()=>toast('✅ کپی شد')).catch(()=>{}); }
function monExportText(){ const box=document.getElementById('monResult'); if(!box._text)return; const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([box._text],{type:'text/plain;charset=utf-8'})); a.download=`rasad_${Date.now()}.txt`; a.click(); }

function monSaveTopic(){ const t=document.getElementById('monTopicInput').value.trim(); if(!t){alert('موضوع را وارد کنید');return;} if(!MONITOR.savedTopics.includes(t)){MONITOR.savedTopics.unshift(t);if(MONITOR.savedTopics.length>20)MONITOR.savedTopics.pop();S.set('monitor_topics',MONITOR.savedTopics);} toast('✅ ذخیره شد'); }
function monShowSavedTopics(){ const wrap=document.getElementById('monSavedTopicsWrap'); if(wrap.style.display==='none'){if(!MONITOR.savedTopics.length){toast('موضوعی ذخیره نشده');return;} wrap.style.display='block'; wrap.innerHTML=MONITOR.savedTopics.map((t,i)=>`<span class="member-tag" style="cursor:pointer;" onclick="document.getElementById('monTopicInput').value='${esc(t)}';document.getElementById('monSavedTopicsWrap').style.display='none';"><span>${esc(t)}</span><span class="remove" onclick="event.stopPropagation();monDeleteTopic(${i})">×</span></span>`).join('');}else{wrap.style.display='none';} }
function monDeleteTopic(i){ MONITOR.savedTopics.splice(i,1);S.set('monitor_topics',MONITOR.savedTopics);monShowSavedTopics();monShowSavedTopics(); }

function monRenderHistory(){
  const card=document.getElementById('monHistCard'),list=document.getElementById('monHistList'),count=document.getElementById('monHistCount');if(!card)return;
  if(!MONITOR.history.length){card.style.display='none';return;}
  card.style.display='block';
  if(count)count.textContent=MONITOR.history.length;
  list.innerHTML=MONITOR.history.slice(0,20).map((r,i)=>{const d=new Date(r.ts);return `<div class="user-card" style="cursor:pointer" onclick="monLoad(${i})"><div class="user-info"><div class="user-name" style="direction:rtl;text-align:right;">${esc(r.query)}</div><div class="user-meta mono" style="direction:rtl;text-align:right;">${d.toLocaleString('fa-IR')}</div></div><span class="badge badge-done">📡</span></div>`;}).join('');
}
function monLoad(i){ monRenderResult(MONITOR.history[i]); document.getElementById('monResult').scrollIntoView({behavior:'smooth'}); }
