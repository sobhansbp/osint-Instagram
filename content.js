// ============================================================
//  content.js — بخش محتوا
//  تحلیل پست + ترجمه فارسی + تولید ۲۰ کامنت عبری + انتخاب + گزارش
// ============================================================

const CONTENT = { lastPost: null, lastComments: [], selectedIdx: -1, tone: 'mixed' };

const DEFAULT_CONTENT_PROMPT = `تو یک شهروند عادی هستی که داری زیر یک پست اینستاگرام کامنت می‌گذاری. کامنت‌هایت باید کاملاً طبیعی، عامیانه و روزمره باشند — مثل حرف زدن یک آدم معمولی در شبکه اجتماعی. از لحن رسمی، اداری یا رباتیک پرهیز کن. کوتاه، انسانی و واقعی بنویس.`;

function initContent(){
  CONTENT.tone = S.get('content_tone') || 'mixed';
  renderContentPanel();
}

function renderContentPanel(){
  const p = document.getElementById('panel-content');
  const savedPrompt = S.get('content_prompt') || DEFAULT_CONTENT_PROMPT;
  const savedCount = S.get('content_count') || '20';
  p.innerHTML = `
    <div id="contentSetupAlert"></div>
    <div class="card">
      <div class="card-title"><span class="ico">🔗</span> لینک پست <span class="line"></span></div>
      <input type="text" id="contentUrl" placeholder="https://www.instagram.com/p/ABC123/">
      <div class="hint">پست تحلیل و ترجمه می‌شود، سپس کامنت پیشنهاد داده می‌شود.</div>
      <button class="btn btn-primary" style="margin-top:12px;" id="analyzeBtn" onclick="contentAnalyze()">🔍 تحلیل پست</button>
    </div>
    <div id="contentAnalysis"></div>

    <div class="card">
      <div class="card-title"><span class="ico">⚙️</span> تنظیم تولید کامنت <span class="line"></span></div>
      <div class="mode-row">
        <div class="mode-opt ${CONTENT.tone==='pos'?'active':''}" onclick="contentSetTone('pos')"><span class="mode-ico">👍</span> مثبت</div>
        <div class="mode-opt ${CONTENT.tone==='neg'?'active':''}" onclick="contentSetTone('neg')"><span class="mode-ico">👎</span> انتقادی</div>
        <div class="mode-opt ${CONTENT.tone==='neu'?'active':''}" onclick="contentSetTone('neu')"><span class="mode-ico">⚖️</span> خنثی</div>
        <div class="mode-opt ${CONTENT.tone==='mixed'?'active':''}" onclick="contentSetTone('mixed')"><span class="mode-ico">🎲</span> ترکیبی</div>
      </div>
      <div class="limit-row" style="margin-bottom:11px;">
        <label>تعداد کامنت:</label>
        <select id="contentCount">
          <option value="5" ${savedCount==='5'?'selected':''}>۵</option>
          <option value="10" ${savedCount==='10'?'selected':''}>۱۰</option>
          <option value="20" ${savedCount==='20'?'selected':''}>۲۰</option>
        </select>
      </div>
      <div class="card-title" style="margin-top:6px;"><span class="ico">📝</span> پرامپت (قابل ویرایش) <span class="line"></span></div>
      <textarea id="contentPrompt" style="min-height:90px;direction:rtl;text-align:right;">${esc(savedPrompt)}</textarea>
      <div style="display:flex;gap:8px;margin-top:8px;">
        <button class="btn btn-sm" onclick="contentSavePrompt()">💾 ذخیره پرامپت</button>
        <button class="btn btn-sm" onclick="contentResetPrompt()">↺ پیش‌فرض</button>
      </div>
      <button class="btn btn-gold" style="margin-top:12px;" id="genBtn" onclick="contentGenerate()">✨ تولید کامنت‌ها</button>
      <div class="hint">ابتدا یک پست را تحلیل کنید، سپس کامنت تولید کنید.</div>
    </div>
    <div id="contentComments"></div>
  `;
  document.getElementById('contentCount').onchange = e => S.set('content_count', e.target.value);
}

function onShow_content(){ contentCheckSetup(); }
function contentCheckSetup(){
  const el=document.getElementById('contentSetupAlert'); if(!el)return;
  if(!APP.worker){ el.innerHTML=`<div class="sbox sbox-warn" style="margin-top:0;margin-bottom:14px;">⚠️ Worker تنظیم نشده${APP.isAdmin?` <button class="btn btn-sm" style="width:100%;margin-top:9px;" onclick="switchTab('setup')">تنظیمات</button>`:' — با مدیر هماهنگ کنید'}</div>`; }
  else el.innerHTML='';
}

function contentSetTone(t){ CONTENT.tone=t; S.set('content_tone',t); renderContentPanel(); if(CONTENT.lastPost) contentRenderAnalysis(CONTENT.lastPost); }
function contentSavePrompt(){ S.set('content_prompt', document.getElementById('contentPrompt').value); toast('✅ پرامپت ذخیره شد'); }
function contentResetPrompt(){ S.set('content_prompt', DEFAULT_CONTENT_PROMPT); document.getElementById('contentPrompt').value=DEFAULT_CONTENT_PROMPT; toast('↺ بازنشانی شد'); }

async function contentAnalyze(){
  const url=document.getElementById('contentUrl').value.trim();
  if(!url.includes('instagram.com')){ alert('لینک معتبر اینستاگرام وارد کنید'); return; }
  if(!APP.worker){ if(APP.isAdmin)switchTab('setup'); else alert('Worker تنظیم نشده'); return; }
  const btn=document.getElementById('analyzeBtn'); btn.disabled=true; btn.innerHTML='<span class="spinner"></span> در حال تحلیل...';
  const box=document.getElementById('contentAnalysis'); box.innerHTML='';
  clearLog();
  try{
    log('دریافت اطلاعات پست...');
    const data=await scFetch(`https://api.scrapecreators.com/v1/instagram/post?url=${encodeURIComponent(url)}`);
    const p=data.data?.shortcode_media||data.data||data;
    const cap=p.edge_media_to_caption?.edges?.[0]?.node?.text||p.caption?.text||(typeof p.caption==='string'?p.caption:'')||'';
    const likes=p.edge_media_preview_like?.count??p.like_count??p.likesCount??0;
    const comments=p.edge_media_to_comment?.count??p.comment_count??p.commentsCount??0;
    const owner=p.owner?.username||p.ownerUsername||'';
    log('دریافت نمونه کامنت‌ها...');
    let topComments=[];
    try{ const cd=await scFetch(`https://api.scrapecreators.com/v2/instagram/post/comments?url=${encodeURIComponent(url)}`); topComments=(cd.comments||[]).slice(0,15).map(c=>c.text).filter(Boolean); }catch(e){}
    log('تحلیل با هوش مصنوعی...','gold');
    const sys='تو یک تحلیلگر محتوای شبکه‌های اجتماعی هستی. پاسخ را فقط به زبان فارسی و به صورت JSON بده.';
    const usr=`این یک پست اینستاگرام است.\nصاحب پست: ${owner}\nکپشن: """${cap.substring(0,1500)}"""\nنمونه کامنت‌ها: """${topComments.join(' | ').substring(0,1500)}"""\n\nیک JSON با این کلیدها بده:\n{"translation":"ترجمه روان فارسی کپشن","summary":"خلاصه: پست درباره چیست (۲-۳ جمله)","sentiment":"فضای کلی کامنت‌ها: مثبت/منفی/خنثی + توضیح کوتاه","analysis":"تحلیل: لحن، هدف پست، و نکات مهم"}`;
    const raw=await groqChat('content',[{role:'system',content:sys},{role:'user',content:usr}],{json:true,temperature:0.5});
    let parsed; try{ parsed=JSON.parse(raw); }catch(e){ parsed={translation:'',summary:raw,sentiment:'',analysis:''}; }
    CONTENT.lastPost={url,cap,likes,comments,owner,topComments,analysis:parsed};
    contentRenderAnalysis(CONTENT.lastPost);
    sendReport('content','تحلیل پست',{items:1,url});
    log('✓ تحلیل کامل شد','ok');
  }catch(e){ box.innerHTML=`<div class="sbox sbox-err">❌ خطا: ${esc(e.message)}</div>`; log('خطا: '+e.message,'err'); }
  btn.disabled=false; btn.innerHTML='🔍 تحلیل پست';
}

function contentRenderAnalysis(d){
  const box=document.getElementById('contentAnalysis');
  const a=d.analysis||{};
  box.innerHTML=`<div class="card">
    <div class="card-title"><span class="ico">📷</span> اطلاعات پست <span class="line"></span></div>
    <div class="stats-row" style="grid-template-columns:repeat(3,1fr);">
      <div class="stat"><div class="stat-num" style="color:var(--red2)">${fmtNum(d.likes)}</div><div class="stat-label">❤️ لایک</div></div>
      <div class="stat"><div class="stat-num" style="color:var(--cyan2)">${fmtNum(d.comments)}</div><div class="stat-label">💬 کامنت</div></div>
      <div class="stat"><div class="stat-num" style="color:var(--gold2);font-size:13px;direction:ltr;">@${esc(d.owner||'—')}</div><div class="stat-label">صاحب پست</div></div>
    </div>
    ${a.translation?`<div class="ai-box"><h4>🔤 ترجمه فارسی</h4>${esc(a.translation)}</div>`:''}
    ${a.summary?`<div class="ai-box"><h4>📋 خلاصه</h4>${esc(a.summary)}</div>`:''}
    ${a.sentiment?`<div class="ai-box"><h4>🎭 فضای کامنت‌ها</h4>${esc(a.sentiment)}</div>`:''}
    ${a.analysis?`<div class="ai-box"><h4>🔍 تحلیل</h4>${esc(a.analysis)}</div>`:''}
  </div>`;
}

const TONE_MAP={pos:'مثبت و حمایتی',neg:'انتقادی و مخالف',neu:'خنثی و سوالی',mixed:'ترکیبی از مثبت، منفی و خنثی'};

async function contentGenerate(){
  if(!CONTENT.lastPost){ alert('ابتدا یک پست را تحلیل کنید'); return; }
  if(!APP.worker){ alert('Worker تنظیم نشده'); return; }
  const count=parseInt(document.getElementById('contentCount').value||'20');
  const userPrompt=document.getElementById('contentPrompt').value;
  const btn=document.getElementById('genBtn'); btn.disabled=true; btn.innerHTML='<span class="spinner"></span> در حال تولید...';
  const box=document.getElementById('contentComments'); box.innerHTML='';
  try{
    log(`تولید ${count} کامنت...`,'gold');
    const d=CONTENT.lastPost;
    const toneInstr=CONTENT.tone==='mixed'?`لحن کامنت‌ها ترکیبی باشد: حدود یک‌سوم مثبت، یک‌سوم انتقادی، یک‌سوم خنثی.`:`لحن همه کامنت‌ها ${TONE_MAP[CONTENT.tone]} باشد.`;
    const sys=`${userPrompt}\n\nتو کامنت‌ها را به زبان عبری تولید می‌کنی (چون پست عبری است). پاسخ را فقط به صورت JSON بده.`;
    const usr=`پست:\nکپشن: """${d.cap.substring(0,1200)}"""\nخلاصه: ${d.analysis?.summary||''}\n\n${count} کامنت کوتاه و طبیعی به زبان عبری تولید کن. ${toneInstr}\n\nخروجی JSON دقیقاً این شکل:\n{"comments":[{"he":"متن کامنت به عبری","fa":"ترجمه فارسی","tone":"pos یا neg یا neu"}]}`;
    const raw=await groqChat('content',[{role:'system',content:sys},{role:'user',content:usr}],{json:true,temperature:0.95,max_tokens:4000});
    let parsed; try{ parsed=JSON.parse(raw); }catch(e){ throw new Error('خطا در پردازش پاسخ'); }
    CONTENT.lastComments=parsed.comments||[]; CONTENT.selectedIdx=-1;
    contentRenderComments();
    sendReport('content','تولید کامنت',{items:CONTENT.lastComments.length,url:d.url,tone:CONTENT.tone});
    log(`✓ ${CONTENT.lastComments.length} کامنت تولید شد`,'ok');
  }catch(e){ box.innerHTML=`<div class="sbox sbox-err">❌ خطا: ${esc(e.message)}</div>`; log('خطا: '+e.message,'err'); }
  btn.disabled=false; btn.innerHTML='✨ تولید کامنت‌ها';
}

function contentRenderComments(){
  const box=document.getElementById('contentComments');
  if(!CONTENT.lastComments.length){ box.innerHTML=''; return; }
  const items=CONTENT.lastComments.map((c,i)=>{
    const tc=c.tone==='pos'?'tone-pos':c.tone==='neg'?'tone-neg':'tone-neu';
    const tl=c.tone==='pos'?'مثبت':c.tone==='neg'?'انتقادی':'خنثی';
    const sel=CONTENT.selectedIdx===i;
    return `<div class="comment-item" style="${sel?'border-color:var(--cyan2);':''}">
      <div class="comment-he" dir="rtl">${esc(c.he||'')}</div>
      <div class="comment-fa">🔤 ${esc(c.fa||'')}</div>
      <span class="comment-tone ${tc}">${tl}</span>
      <div class="comment-actions">
        <button class="mini-btn ${sel?'sel':''}" onclick="contentSelect(${i})">${sel?'✓ انتخاب شده':'انتخاب این کامنت'}</button>
        <button class="mini-btn" onclick="contentCopy(${i})">📋 کپی</button>
      </div>
    </div>`;
  }).join('');
  box.innerHTML=`<div class="card"><div class="card-title"><span class="ico">💬</span> کامنت‌های پیشنهادی (${CONTENT.lastComments.length}) <span class="line"></span></div>
    <div class="sbox sbox-load" style="margin-top:0;margin-bottom:12px;">کامنت مناسب را انتخاب کنید. اگر هیچ‌کدام مناسب نبود، دوباره تولید کنید.</div>
    ${items}
    <button class="btn btn-sm" style="width:100%;margin-top:6px;" onclick="contentGenerate()">🔄 تولید مجدد</button>
  </div>`;
}

function contentSelect(i){
  CONTENT.selectedIdx=i; contentRenderComments();
  const c=CONTENT.lastComments[i];
  sendReport('content','انتخاب کامنت',{items:1,url:CONTENT.lastPost?.url,selected:c.he,tone:c.tone});
  toast('✅ انتخاب ثبت و به مدیریت گزارش شد');
}
function contentCopy(i){ const c=CONTENT.lastComments[i]; navigator.clipboard?.writeText(c.he||'').then(()=>toast('✅ کپی شد')).catch(()=>alert(c.he)); }
