// ============================================================
//  monitor.js — بخش رصد (نسخه ۴.۰)
//  موتور: Grok از طریق Node.js لیارا (real-time)
//  + چت مستقیم با هوش مصنوعی
//  + بدون نیاز به Worker برای رصد
// ============================================================

const MONITOR = { history:[], activeTab:'daily', savedTopics:[], chatHistory:[] };

// آدرس Node.js لیارا — همه درخواست‌های رصد از اینجا میرن
const MONITOR_SERVER = 'https://andarzgoo.liara.run';

function initMonitor(){
  MONITOR.history = S.get('monitor_history') || [];
  MONITOR.savedTopics = S.get('monitor_topics') || [];
  MONITOR.chatHistory = [];
  renderMonitorPanel();
}

function renderMonitorPanel(){
  const p = document.getElementById('panel-monitor');
  p.innerHTML = `
    <div class="card">
      <div class="card-title"><span class="ico">⚡</span> ابزارهای سریع <span class="line"></span></div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;">
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
        <button class="tab ${MONITOR.activeTab==='chat'?'active':''}" onclick="monSwitchTab('chat')">💬 چت تحلیلی</button>
      </div>

      <div id="mon-tab-daily" style="display:${MONITOR.activeTab==='daily'?'block':'none'};">
        <div class="hint" style="margin-bottom:10px;">تحلیل جامع اخبار روز اسرائیل با اطلاعات real-time</div>
        <div class="limit-row" style="margin-bottom:12px;">
          <label>عمق:</label>
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
        <button class="btn btn-primary" id="monProfileBtn" onclick="monRunProfile()">👤 رصد پیج/شخصیت</button>
      </div>

      <div id="mon-tab-compare" style="display:${MONITOR.activeTab==='compare'?'block':'none'};">
        <input type="text" id="monCompareInput" placeholder="موضوع برای مقایسه..." style="direction:rtl;text-align:right;margin-bottom:9px;">
        <button class="btn btn-primary" id="monCompareBtn" onclick="monRunCompare()">⚖️ مقایسه دیدگاه رسانه‌ها</button>
      </div>

      <div id="mon-tab-chat" style="display:${MONITOR.activeTab==='chat'?'block':'none'};">
        <div class="hint" style="margin-bottom:10px;">مستقیم با هوش مصنوعی درباره اخبار و تحلیل‌های اسرائیل صحبت کن</div>
        <div id="monChatBox" style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:12px;min-height:200px;max-height:400px;overflow-y:auto;margin-bottom:10px;direction:rtl;"></div>
        <div style="display:flex;gap:8px;">
          <input type="text" id="monChatInput" placeholder="سوال یا درخواست خود را بنویس..." style="flex:1;direction:rtl;text-align:right;" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();monSendChat();}">
          <button class="btn btn-sm" onclick="monSendChat()" id="monChatBtn">ارسال</button>
          <button class="btn btn-sm" onclick="monClearChat()">🗑️</button>
        </div>
      </div>
    </div>

    <div id="monResult"></div>

    <div class="card" id="monHistCard" style="display:none;">
      <div class="card-title"><span class="ico">📋</span> تاریخچه (<span id="monHistCount">0</span>) <span class="line"></span></div>
      <div id="monHistList"></div>
    </div>
  `;

  if(!document.querySelector('style[data-mon]')){
    const s=document.createElement('style');
    s.setAttribute('data-mon','1');
    s.textContent=`.mon-tool-btn{background:var(--surface);border:1px solid var(--border2);color:var(--text2);border-radius:10px;padding:10px 8px;font-size:12px;font-weight:600;font-family:'Vazirmatn';cursor:pointer;transition:all 0.2s;text-align:center;width:100%;}.mon-tool-btn:hover{border-color:var(--cyan2);color:var(--cyanGlow);background:rgba(30,158,138,0.08);}.mon-msg{padding:10px 13px;border-radius:12px;margin-bottom:8px;font-size:13px;line-height:1.7;max-width:90%;}.mon-msg-user{background:rgba(42,157,130,0.15);border:1px solid rgba(42,157,130,0.3);color:var(--text);margin-right:auto;direction:rtl;}.mon-msg-ai{background:var(--card2);border:1px solid var(--border);color:var(--text);margin-left:auto;direction:rtl;}`;
    document.head.appendChild(s);
  }
  monRenderHistory();
}

function onShow_monitor(){ /* بدون نیاز به Worker */ }

function monSwitchTab(t){
  MONITOR.activeTab=t;
  ['daily','topic','profile','compare','chat'].forEach(x=>{
    const el=document.getElementById('mon-tab-'+x);
    if(el)el.style.display=x===t?'block':'none';
  });
  document.querySelectorAll('#panel-monitor .tab').forEach((b,i)=>{
    const tabs=['daily','topic','profile','compare','chat'];
    b.classList.toggle('active',tabs[i]===t);
  });
}

// —— Grok از طریق Node.js لیارا ——
async function grokChat(messages, opts={}){
  const payload={
    model: opts.model||'grok-3-fast',
    messages,
    temperature: opts.temperature??0.5,
    max_tokens: opts.max_tokens??2000,
  };

  const res=await fetch(`${MONITOR_SERVER}/grok`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({payload}),
    signal:AbortSignal.timeout(90000),
  });

  if(!res.ok){const err=await res.text();throw new Error(`HTTP ${res.status}: ${err.substring(0,200)}`);}
  const data=await res.json();
  if(data.error)throw new Error(typeof data.error==='string'?data.error:JSON.stringify(data.error));
  if(!data.choices?.[0])throw new Error('پاسخ نامعتبر');
  return data.choices[0].message.content;
}

const QUICK_TOOLS={
  breaking:{label:'⚡ اخبار فوری',prompt:'آخرین اخبار فوری چند ساعت اخیر اسرائیل؟'},
  trends:{label:'📈 روندهای داغ',prompt:'مهم‌ترین موضوعات داغ امروز در رسانه‌های اسرائیل؟'},
  sentiment:{label:'🎭 تحلیل احساسات',prompt:'احساسات عمومی مردم اسرائیل به مهم‌ترین رویداد امروز چیست؟'},
  military:{label:'🎖️ نظامی-امنیتی',prompt:'آخرین اخبار نظامی و امنیتی اسرائیل امروز؟'},
  economy:{label:'💰 اقتصاد و بازار',prompt:'وضعیت اقتصاد و بازار سهام اسرائیل امروز؟'},
  politics:{label:'🏛️ سیاست داخلی',prompt:'مهم‌ترین اخبار سیاسی داخلی اسرائیل امروز؟'},
  social:{label:'👥 فضای اجتماعی',prompt:'فضای اجتماعی و اعتراضات در اسرائیل امروز؟'},
  weekly:{label:'📊 گزارش هفتگی',prompt:'مهم‌ترین رویدادهای هفته گذشته اسرائیل؟'},
};

async function monQuickTool(type){const tool=QUICK_TOOLS[type];if(!tool)return;await monExecute(tool.prompt,tool.label,'brief');}

async function monRunDaily(){const d=document.getElementById('monDailyDepth').value;const p={brief:'مهم‌ترین اخبار امروز اسرائیل را خلاصه کن.',normal:'تحلیل جامع اخبار روز اسرائیل شامل سیاست، نظامی، اقتصاد، اجتماعی.',deep:'تحلیل عمیق اخبار روز اسرائیل با زمینه تاریخی و پیامدها.'};await monExecute(p[d],'🌐 تحلیل اخبار روز',d);}
async function monRunTopic(){const t=document.getElementById('monTopicInput').value.trim();if(!t){alert('موضوع را وارد کنید');return;}await monExecute(`درباره «${t}» در اسرائیل امروز چه خبر است؟`,'🔍 '+t,'normal');}
async function monRunProfile(){const p=document.getElementById('monProfileInput').value.trim();if(!p){alert('نام را وارد کنید');return;}await monExecute(`آخرین اخبار و فعالیت‌های «${p}» در اسرائیل؟`,'👤 '+p,'normal');}
async function monRunCompare(){const t=document.getElementById('monCompareInput').value.trim();if(!t){alert('موضوع را وارد کنید');return;}await monExecute(`رسانه‌های مختلف اسرائیل درباره «${t}» چه دیدگاه‌هایی دارند؟`,'⚖️ '+t,'normal');}

async function monExecute(query,label,depth){
  ['monDailyBtn','monTopicBtn','monProfileBtn','monCompareBtn'].forEach(id=>{const el=document.getElementById(id);if(el){el.disabled=true;el.innerHTML='<span class="spinner"></span> در حال رصد...';}});
  const box=document.getElementById('monResult');
  box.innerHTML=`<div class="card"><div class="sbox sbox-load" style="margin:0;"><span class="spinner"></span> دریافت اطلاعات real-time از Grok...</div></div>`;

  const today=new Date().toISOString().split('T')[0];
  const sys=`تو تحلیلگر ارشد رسانه‌های اسرائیل هستی. تاریخ امروز: ${today}. از اطلاعات real-time خود استفاده کن. پاسخ فارسی با این ساختار:\n📋 خلاصه:\n🔍 تحلیل:\n📊 سنجش احساسات:\n🎯 پیشنهاد اقدام:\n📌 منابع:`;

  try{
    const raw=await grokChat([{role:'system',content:sys},{role:'user',content:query}],{model:depth==='deep'?'grok-3':'grok-3-fast',temperature:0.4,max_tokens:depth==='brief'?1000:depth==='deep'?3000:2000});
    const result={query:label,text:raw,ts:Date.now(),depth};
    MONITOR.history.unshift(result);if(MONITOR.history.length>30)MONITOR.history.pop();S.set('monitor_history',MONITOR.history);
    monRenderResult(result);
    sendReport('monitor','رصد: '+label,{items:1,query:label});
    monRenderHistory();
  }catch(e){
    box.innerHTML=`<div class="card"><div class="sbox sbox-err" style="margin:0;">❌ ${esc(e.message)}<br><small>مطمئن شو سرور andarzgoo.liara.run فعاله</small></div></div>`;
  }
  ['monDailyBtn','monTopicBtn','monProfileBtn','monCompareBtn'].forEach(id=>{const el=document.getElementById(id);if(el){el.disabled=false;const lb={'monDailyBtn':'🌐 تحلیل اخبار روز','monTopicBtn':'🔍 جستجو','monProfileBtn':'👤 رصد','monCompareBtn':'⚖️ مقایسه'};el.innerHTML=lb[id]||'اجرا';}});
}

// —— چت تحلیلی ——
async function monSendChat(){
  const inp=document.getElementById('monChatInput');
  const msg=inp.value.trim();
  if(!msg)return;
  inp.value='';
  const btn=document.getElementById('monChatBtn');
  btn.disabled=true;btn.textContent='...';

  const box=document.getElementById('monChatBox');
  box.innerHTML+=`<div class="mon-msg mon-msg-user">${esc(msg)}</div>`;
  box.scrollTop=box.scrollHeight;

  MONITOR.chatHistory.push({role:'user',content:msg});

  const today=new Date().toISOString().split('T')[0];
  const sys=`تو یک تحلیلگر اطلاعاتی متخصص در رسانه‌ها و سیاست اسرائیل هستی. تاریخ امروز: ${today}. از اطلاعات real-time خود استفاده کن. پاسخ را به فارسی روان بده.`;

  try{
    const messages=[{role:'system',content:sys},...MONITOR.chatHistory.slice(-10)];
    const reply=await grokChat(messages,{model:'grok-3-fast',temperature:0.6,max_tokens:1500});
    MONITOR.chatHistory.push({role:'assistant',content:reply});
    box.innerHTML+=`<div class="mon-msg mon-msg-ai">${esc(reply).replace(/\n/g,'<br>')}</div>`;
  }catch(e){
    box.innerHTML+=`<div class="mon-msg mon-msg-ai" style="color:var(--red2);">❌ ${esc(e.message)}</div>`;
  }
  box.scrollTop=box.scrollHeight;
  btn.disabled=false;btn.textContent='ارسال';
}
function monClearChat(){MONITOR.chatHistory=[];const b=document.getElementById('monChatBox');if(b)b.innerHTML='';}

function monRenderResult(r){
  const box=document.getElementById('monResult');
  const d=new Date(r.ts);
  box.innerHTML=`<div class="card"><div class="card-title"><span class="ico">📡</span> ${esc(r.query)} <span class="line"></span></div><div class="ai-box" style="direction:rtl;text-align:right;line-height:2;">${monFormatText(r.text)}</div><div style="display:flex;gap:8px;margin-top:13px;"><button class="btn btn-sm" onclick="monCopy()">📋 کپی</button><button class="btn btn-sm" onclick="monExportText()">📥 دانلود</button></div><div class="user-meta mono" style="direction:rtl;text-align:right;margin-top:8px;">${d.toLocaleString('fa-IR')}</div></div>`;
  box._text=r.text;box._label=r.query;
}
function monFormatText(t){return esc(t).replace(/📋\s*خلاصه[:：]?/g,'<h4 style="color:var(--cyanGlow);margin:14px 0 7px;">📋 خلاصه</h4>').replace(/🔍\s*تحلیل[:：]?/g,'<h4 style="color:var(--gold2);margin:14px 0 7px;">🔍 تحلیل</h4>').replace(/📊\s*سنجش احساسات[:：]?/g,'<h4 style="color:var(--purple2);margin:14px 0 7px;">📊 سنجش احساسات</h4>').replace(/🎯\s*پیشنهاد اقدام[:：]?/g,'<h4 style="color:var(--green2);margin:14px 0 7px;">🎯 پیشنهاد اقدام</h4>').replace(/📌\s*منابع[:：]?/g,'<h4 style="color:var(--text3);margin:14px 0 7px;">📌 منابع</h4>').replace(/\n/g,'<br>');}
function monCopy(){const t=document.getElementById('monResult')._text;if(t)navigator.clipboard?.writeText(t).then(()=>toast('✅ کپی شد'));}
function monExportText(){const box=document.getElementById('monResult');if(!box._text)return;const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([box._text],{type:'text/plain;charset=utf-8'}));a.download=`rasad_${Date.now()}.txt`;a.click();}

function monSaveTopic(){const t=document.getElementById('monTopicInput').value.trim();if(!t){alert('موضوع را وارد کنید');return;}if(!MONITOR.savedTopics.includes(t)){MONITOR.savedTopics.unshift(t);if(MONITOR.savedTopics.length>20)MONITOR.savedTopics.pop();S.set('monitor_topics',MONITOR.savedTopics);}toast('✅ ذخیره شد');}
function monShowSavedTopics(){const wrap=document.getElementById('monSavedTopicsWrap');if(wrap.style.display==='none'){if(!MONITOR.savedTopics.length){toast('موضوعی ذخیره نشده');return;}wrap.style.display='block';wrap.innerHTML=MONITOR.savedTopics.map((t,i)=>`<span class="member-tag" style="cursor:pointer;" onclick="document.getElementById('monTopicInput').value='${esc(t)}';document.getElementById('monSavedTopicsWrap').style.display='none';"><span>${esc(t)}</span><span class="remove" onclick="event.stopPropagation();monDeleteTopic(${i})">×</span></span>`).join('');}else{wrap.style.display='none';}}
function monDeleteTopic(i){MONITOR.savedTopics.splice(i,1);S.set('monitor_topics',MONITOR.savedTopics);monShowSavedTopics();monShowSavedTopics();}

function monRenderHistory(){
  const card=document.getElementById('monHistCard'),list=document.getElementById('monHistList'),count=document.getElementById('monHistCount');if(!card)return;
  if(!MONITOR.history.length){card.style.display='none';return;}
  card.style.display='block';if(count)count.textContent=MONITOR.history.length;
  list.innerHTML=MONITOR.history.slice(0,20).map((r,i)=>{const d=new Date(r.ts);return `<div class="user-card" style="cursor:pointer" onclick="monLoad(${i})"><div class="user-info"><div class="user-name" style="direction:rtl;text-align:right;">${esc(r.query)}</div><div class="user-meta mono" style="direction:rtl;text-align:right;">${d.toLocaleString('fa-IR')}</div></div><span class="badge badge-done">📡</span></div>`;}).join('');
}
function monLoad(i){monRenderResult(MONITOR.history[i]);document.getElementById('monResult').scrollIntoView({behavior:'smooth'});}
