// ============================================================
//  content.js — بخش محتوا (نسخه ۲.۰)
//  + تحلیل کامنت‌های موجود + بهترین زمان + ریپلای هوشمند
//  + تاریخچه + فیلتر کامنت‌ها + رتبه‌بندی
// ============================================================

const CONTENT = {
  lastPost: null, lastComments: [], selectedIdx: -1,
  tone: 'mixed', mode: 'comment', history: [],
  topCommentsFull: [],
};

const DEFAULT_CONTENT_PROMPT = `تو یک شهروند عادی هستی که داری زیر یک پست اینستاگرام کامنت می‌گذاری. کامنت‌هایت باید کاملاً طبیعی، عامیانه و روزمره باشند — مثل حرف زدن یک آدم معمولی در شبکه اجتماعی. از لحن رسمی، اداری یا رباتیک پرهیز کن. کوتاه، انسانی و واقعی بنویس.`;

function initContent(){
  CONTENT.tone = S.get('content_tone') || 'mixed';
  CONTENT.mode = S.get('content_mode') || 'comment';
  CONTENT.history = S.get('content_history') || [];
  renderContentPanel();
}

function renderContentPanel(){
  const p = document.getElementById('panel-content');
  const savedPrompt = S.get('content_prompt') || DEFAULT_CONTENT_PROMPT;
  const savedCount = S.get('content_count') || '20';
  p.innerHTML = `
    <div id="contentSetupAlert"></div>

    <!-- لینک پست -->
    <div class="card accent-green">
      <div class="card-title"><span class="ico">🔗</span> لینک پست هدف</div>
      <input type="text" id="contentUrl" placeholder="https://www.instagram.com/p/ABC123/" style="direction:ltr;">
      <button class="btn btn-primary" style="margin-top:10px;" id="analyzeBtn" onclick="contentAnalyze()">[ ANALYZE_POST ]</button>
    </div>

    <!-- نتیجه تحلیل -->
    <div id="contentAnalysis"></div>

    <!-- تب‌های حالت -->
    <div class="card" id="contentGenCard" style="display:none;">
      <div class="card-title"><span class="ico">⚙️</span> حالت تولید محتوا</div>
      <div class="tabs" style="margin-bottom:14px;">
        <button class="tab ${CONTENT.mode==='comment'?'active':''}" onclick="contentSetMode('comment')">💬 کامنت جدید</button>
        <button class="tab ${CONTENT.mode==='reply'?'active':''}" onclick="contentSetMode('reply')">↩️ ریپلای هوشمند</button>
        <button class="tab ${CONTENT.mode==='analysis'?'active':''}" onclick="contentSetMode('analysis')">📊 تحلیل کامنت‌ها</button>
      </div>

      <!-- حالت کامنت جدید -->
      <div id="content-tab-comment" style="display:${CONTENT.mode==='comment'?'block':'none'};">
        <div class="mode-row">
          <div class="mode-opt ${CONTENT.tone==='pos'?'active':''}" onclick="contentSetTone('pos')"><span class="mode-ico">👍</span>مثبت</div>
          <div class="mode-opt ${CONTENT.tone==='neg'?'active':''}" onclick="contentSetTone('neg')"><span class="mode-ico">👎</span>انتقادی</div>
          <div class="mode-opt ${CONTENT.tone==='neu'?'active':''}" onclick="contentSetTone('neu')"><span class="mode-ico">⚖️</span>خنثی</div>
          <div class="mode-opt ${CONTENT.tone==='mixed'?'active':''}" onclick="contentSetTone('mixed')"><span class="mode-ico">🎲</span>ترکیبی</div>
        </div>
        <div class="limit-row" style="margin-bottom:12px;">
          <label>تعداد:</label>
          <select id="contentCount">
            <option value="5" ${savedCount==='5'?'selected':''}>۵</option>
            <option value="10" ${savedCount==='10'?'selected':''}>۱۰</option>
            <option value="20" ${savedCount==='20'?'selected':''}>۲۰</option>
          </select>
        </div>
        <div class="card-title" style="margin-top:4px;"><span class="ico">📝</span> پرامپت</div>
        <textarea id="contentPrompt" style="min-height:80px;direction:rtl;text-align:right;">${esc(savedPrompt)}</textarea>
        <div style="display:flex;gap:8px;margin-top:8px;">
          <button class="btn btn-sm" onclick="contentSavePrompt()">💾 ذخیره</button>
          <button class="btn btn-sm" onclick="contentResetPrompt()">↺ پیش‌فرض</button>
        </div>
        <button class="btn btn-amber" style="margin-top:12px;" id="genBtn" onclick="contentGenerate()">[ GENERATE_COMMENTS ]</button>
      </div>

      <!-- حالت ریپلای هوشمند -->
      <div id="content-tab-reply" style="display:${CONTENT.mode==='reply'?'block':'none'};">
        <div class="hint" style="margin-bottom:10px;">یک کامنت موجود زیر پست را انتخاب کن، AI بهش ریپلای طبیعی میده</div>
        <div id="contentReplyList"></div>
        <div id="contentReplyResult"></div>
      </div>

      <!-- حالت تحلیل کامنت‌ها -->
      <div id="content-tab-analysis" style="display:${CONTENT.mode==='analysis'?'block':'none'};">
        <div class="hint" style="margin-bottom:10px;">تحلیل کامنت‌های موجود: الگوهای موفق، بهترین زمان، نوع محتوا</div>
        <button class="btn btn-primary" id="deepAnalyzeBtn" onclick="contentDeepAnalysis()">[ DEEP_ANALYSIS ]</button>
        <div id="contentDeepResult"></div>
      </div>
    </div>

    <!-- کامنت‌های تولیدشده -->
    <div id="contentComments"></div>

    <!-- تاریخچه -->
    <div class="card" id="contentHistCard" style="display:none;">
      <div class="card-title"><span class="ico">📋</span> تاریخچه انتخاب‌ها (<span id="contentHistCount">0</span>)</div>
      <div id="contentHistList"></div>
    </div>
  `;
  document.getElementById('contentCount').onchange = e => S.set('content_count', e.target.value);
  contentRenderHistory();
}

function onShow_content(){ contentCheckSetup(); }
function contentCheckSetup(){
  const el=document.getElementById('contentSetupAlert'); if(!el)return;
  if(!APP.worker){ el.innerHTML=`<div class="sbox sbox-warn" style="margin-top:0;margin-bottom:12px;">WORKER_NOT_CONFIGURED${APP.isAdmin?` <button class="btn btn-sm" style="width:100%;margin-top:8px;" onclick="switchTab('setup')">[SETUP]</button>`:''}</div>`; }
  else el.innerHTML='';
}

function contentSetMode(m){
  CONTENT.mode=m; S.set('content_mode',m);
  ['comment','reply','analysis'].forEach(x=>{
    const el=document.getElementById('content-tab-'+x);
    if(el) el.style.display=x===m?'block':'none';
  });
  document.querySelectorAll('#contentGenCard .tab').forEach((b,i)=>{
    const tabs=['comment','reply','analysis'];
    b.classList.toggle('active',tabs[i]===m);
  });
  if(m==='reply') contentRenderReplyList();
}

function contentSetTone(t){ CONTENT.tone=t; S.set('content_tone',t); renderContentPanel(); const gc=document.getElementById('contentGenCard'); if(gc)gc.style.display='block'; }
function contentSavePrompt(){ S.set('content_prompt',document.getElementById('contentPrompt').value); toast('SAVED'); }
function contentResetPrompt(){ S.set('content_prompt',DEFAULT_CONTENT_PROMPT); document.getElementById('contentPrompt').value=DEFAULT_CONTENT_PROMPT; toast('RESET'); }

// —— تحلیل پست ——
async function contentAnalyze(){
  const url=document.getElementById('contentUrl').value.trim();
  if(!url.includes('instagram.com')){ alert('لینک معتبر اینستاگرام وارد کنید'); return; }
  if(!APP.worker){ if(APP.isAdmin)switchTab('setup'); else alert('Worker تنظیم نشده'); return; }
  const btn=document.getElementById('analyzeBtn'); btn.disabled=true; btn.innerHTML='<span class="spinner"></span> ANALYZING...';
  const box=document.getElementById('contentAnalysis'); box.innerHTML='';
  if(window.showTransmissionNoise) window.showTransmissionNoise();
  try{
    const data=await scFetch(`https://api.scrapecreators.com/v1/instagram/post?url=${encodeURIComponent(url)}`);
    const pp=data.data?.shortcode_media||data.data||data;
    const cap=pp.edge_media_to_caption?.edges?.[0]?.node?.text||pp.caption?.text||(typeof pp.caption==='string'?pp.caption:'')||'';
    const likes=pp.edge_media_preview_like?.count??pp.like_count??pp.likesCount??0;
    const comments=pp.edge_media_to_comment?.count??pp.comment_count??pp.commentsCount??0;
    const owner=pp.owner?.username||pp.ownerUsername||'';
    const timestamp=pp.taken_at_timestamp||pp.taken_at||null;

    let topComments=[];
    try{
      const cd=await scFetch(`https://api.scrapecreators.com/v2/instagram/post/comments?url=${encodeURIComponent(url)}`);
      topComments=(cd.comments||[]).slice(0,20);
      CONTENT.topCommentsFull=topComments;
    }catch(e){}

    const sys='تو یک تحلیلگر محتوای شبکه‌های اجتماعی هستی. پاسخ فقط JSON فارسی.';
    const usr=`پست اینستاگرام:\nصاحب: ${owner}\nکپشن: """${cap.substring(0,1500)}"""\nکامنت‌ها: """${topComments.slice(0,15).map(c=>c.text).join(' | ').substring(0,1500)}"""\n\nJSON با این کلیدها:\n{"translation":"ترجمه روان فارسی","summary":"خلاصه پست (۲-۳ جمله)","sentiment":"فضای کامنت‌ها","analysis":"تحلیل: لحن و هدف پست","bestTime":"بهترین زمان کامنت براساس زمان پست و محتوا","strategy":"استراتژی: چه نوع کامنتی بیشتر دیده میشه"}`;
    const raw=await groqChat('content',[{role:'system',content:sys},{role:'user',content:usr}],{json:true,temperature:0.5});
    let parsed; try{ parsed=JSON.parse(raw); }catch(e){ parsed={translation:'',summary:raw,sentiment:'',analysis:'',bestTime:'',strategy:''}; }

    CONTENT.lastPost={url,cap,likes,comments,owner,timestamp,topComments,analysis:parsed};
    if(window.hideTransmissionNoise) window.hideTransmissionNoise();
    contentRenderAnalysis(CONTENT.lastPost);
    document.getElementById('contentGenCard').style.display='block';
    sendReport('content','تحلیل پست',{items:1,url});
    if(CONTENT.mode==='reply') contentRenderReplyList();
  }catch(e){
    if(window.hideTransmissionNoise) window.hideTransmissionNoise();
    box.innerHTML=`<div class="sbox sbox-err">ERR: ${esc(e.message)}</div>`;
  }
  btn.disabled=false; btn.innerHTML='[ ANALYZE_POST ]';
}

function contentRenderAnalysis(d){
  const box=document.getElementById('contentAnalysis');
  const a=d.analysis||{};
  // محاسبه نرخ engagement
  const eng = d.likes+d.comments > 0 ? ((d.comments/(d.likes+d.comments))*100).toFixed(1) : '0';
  box.innerHTML=`<div class="card accent-cyan">
    <div class="card-title"><span class="ico">📡</span> POST_INTEL // @${esc(d.owner||'—')}</div>
    <div class="stats-row" style="grid-template-columns:repeat(4,1fr);">
      <div class="stat" style="--barcolor:#ff2222"><div class="stat-num" style="color:#ff4444">${fmtNum(d.likes)}</div><div class="stat-label">LIKES</div></div>
      <div class="stat" style="--barcolor:#00d4ff"><div class="stat-num" style="color:#00d4ff">${fmtNum(d.comments)}</div><div class="stat-label">COMMENTS</div></div>
      <div class="stat" style="--barcolor:#ffb700"><div class="stat-num" style="color:#ffb700;font-size:16px;">${eng}%</div><div class="stat-label">ENGAGE</div></div>
      <div class="stat" style="--barcolor:#00ff41"><div class="stat-num" style="color:#00ff41;font-size:13px;">${d.topComments?.length||0}</div><div class="stat-label">SAMPLES</div></div>
    </div>
    ${a.translation?`<div class="ai-box" style="border-left-color:#00d4ff;"><h4 style="color:#00d4ff;">// TRANSLATION</h4>${esc(a.translation)}</div>`:''}
    ${a.summary?`<div class="ai-box"><h4 style="color:#00ff41;">// SUMMARY</h4>${esc(a.summary)}</div>`:''}
    ${a.sentiment?`<div class="ai-box" style="border-left-color:#ffb700;"><h4 style="color:#ffb700;">// SENTIMENT</h4>${esc(a.sentiment)}</div>`:''}
    ${a.bestTime?`<div class="ai-box" style="border-left-color:#00ff41;"><h4 style="color:#00ff41;">// BEST_TIME</h4>${esc(a.bestTime)}</div>`:''}
    ${a.strategy?`<div class="ai-box" style="border-left-color:#ff2222;"><h4 style="color:#ff4444;">// STRATEGY</h4>${esc(a.strategy)}</div>`:''}
  </div>`;
}

// —— تولید کامنت ——
const TONE_MAP={pos:'مثبت و حمایتی',neg:'انتقادی و مخالف',neu:'خنثی و سوالی',mixed:'ترکیبی'};

async function contentGenerate(){
  if(!CONTENT.lastPost){ alert('ابتدا پست را تحلیل کنید'); return; }
  if(!APP.worker){ alert('Worker تنظیم نشده'); return; }
  const count=parseInt(document.getElementById('contentCount').value||'20');
  const userPrompt=document.getElementById('contentPrompt').value;
  const btn=document.getElementById('genBtn'); btn.disabled=true; btn.innerHTML='<span class="spinner"></span> GENERATING...';
  const box=document.getElementById('contentComments'); box.innerHTML='';
  if(window.showTransmissionNoise) window.showTransmissionNoise();
  try{
    const d=CONTENT.lastPost;
    // از کامنت‌های پرلایک الگو بگیر
    const topLiked=CONTENT.topCommentsFull.sort((a,b)=>(b.comment_like_count||0)-(a.comment_like_count||0)).slice(0,5).map(c=>c.text).filter(Boolean);
    const toneInstr=CONTENT.tone==='mixed'?'لحن ترکیبی: یک‌سوم مثبت، یک‌سوم انتقادی، یک‌سوم خنثی':`لحن: ${TONE_MAP[CONTENT.tone]}`;
    const sys=`${userPrompt}\n\nکامنت‌ها را به زبان عبری تولید کن. پاسخ فقط JSON.`;
    const usr=`پست:\nکپشن: """${d.cap.substring(0,1000)}"""\nخلاصه: ${d.analysis?.summary||''}\n${topLiked.length?`\nکامنت‌های پرلایک موجود (الگو بگیر):\n${topLiked.join('\n')}`:''}\n\n${count} کامنت طبیعی عبری تولید کن.\n${toneInstr}\n\nJSON:\n{"comments":[{"he":"متن عبری","fa":"ترجمه فارسی","tone":"pos|neg|neu","length":"short|medium"}]}`;
    const raw=await groqChat('content',[{role:'system',content:sys},{role:'user',content:usr}],{json:true,temperature:0.95,max_tokens:4000});
    let parsed; try{ parsed=JSON.parse(raw); }catch(e){ throw new Error('خطا در پردازش پاسخ'); }
    if(window.hideTransmissionNoise) window.hideTransmissionNoise();
    CONTENT.lastComments=parsed.comments||[]; CONTENT.selectedIdx=-1;
    contentRenderComments();
    sendReport('content','تولید کامنت',{items:CONTENT.lastComments.length,url:d.url,tone:CONTENT.tone});
  }catch(e){
    if(window.hideTransmissionNoise) window.hideTransmissionNoise();
    box.innerHTML=`<div class="sbox sbox-err">ERR: ${esc(e.message)}</div>`;
  }
  btn.disabled=false; btn.innerHTML='[ GENERATE_COMMENTS ]';
}

// —— ریپلای هوشمند ——
function contentRenderReplyList(){
  const box=document.getElementById('contentReplyList'); if(!box)return;
  const comments=CONTENT.topCommentsFull;
  if(!comments.length){ box.innerHTML='<div class="empty">ابتدا پست را تحلیل کنید</div>'; return; }
  box.innerHTML=`<div style="margin-bottom:10px;font-family:var(--font-mono);font-size:10px;color:var(--dim);">// SELECT_TARGET_COMMENT</div>`+
    comments.slice(0,15).map((c,i)=>{
      const txt=c.text||''; const user=c.user?.username||c.ownerUsername||'?';
      const lk=c.comment_like_count||c.likesCount||0;
      return `<div class="user-card" style="cursor:pointer;border-left-color:transparent;" onclick="contentGenerateReply(${i})">
        <div class="user-avatar" style="font-size:10px;font-family:var(--font-mono);color:var(--dim);">${(i+1).toString().padStart(2,'0')}</div>
        <div class="user-info">
          <div class="user-name" style="direction:rtl;text-align:right;font-size:12px;">@${esc(user)}</div>
          <div class="user-meta" style="direction:rtl;text-align:right;">${esc(txt.substring(0,60))}${txt.length>60?'…':''}</div>
        </div>
        <div class="user-badges">${lk?`<span class="badge badge-like">❤️${lk}</span>`:''}<span class="badge" style="border:1px solid var(--border3);color:var(--dim);">REPLY</span></div>
      </div>`;
    }).join('');
}

async function contentGenerateReply(idx){
  if(!APP.worker){ alert('Worker تنظیم نشده'); return; }
  const comment=CONTENT.topCommentsFull[idx]; if(!comment)return;
  const box=document.getElementById('contentReplyResult');
  box.innerHTML='<div class="sbox sbox-load"><span class="spinner"></span> GENERATING_REPLY...</div>';
  if(window.showTransmissionNoise) window.showTransmissionNoise();
  try{
    const sys='تو یک شهروند عادی اسرائیلی هستی. به کامنت داده‌شده ریپلای طبیعی، کوتاه و عامیانه به عبری بده. پاسخ فقط JSON.';
    const usr=`پست درباره: ${CONTENT.lastPost?.analysis?.summary||''}\nکامنت: """${comment.text}"""\n\nسه ریپلای متفاوت به عبری بده.\nJSON:\n{"replies":[{"he":"متن عبری","fa":"ترجمه فارسی","tone":"pos|neg|neu"}]}`;
    const raw=await groqChat('content',[{role:'system',content:sys},{role:'user',content:usr}],{json:true,temperature:0.9,max_tokens:1000});
    let parsed; try{ parsed=JSON.parse(raw); }catch(e){ throw new Error('خطا در پردازش'); }
    if(window.hideTransmissionNoise) window.hideTransmissionNoise();
    const replies=parsed.replies||[];
    box.innerHTML=`<div style="margin:12px 0 6px;font-family:var(--font-mono);font-size:10px;color:var(--dim);">// REPLIES_TO: @${esc(comment.user?.username||'?')}</div>`+
      replies.map((r,i)=>`<div class="comment-item">
        <div class="comment-he" dir="rtl">${esc(r.he||'')}</div>
        <div class="comment-fa">${esc(r.fa||'')}</div>
        <div class="comment-actions">
          <button class="mini-btn" onclick="navigator.clipboard?.writeText('${esc(r.he||'')}').then(()=>toast('COPIED'))">📋 کپی</button>
          <button class="mini-btn" onclick="contentSaveReply(${i},${idx})">💾 ثبت</button>
        </div>
      </div>`).join('');
    box._replies=replies; box._commentIdx=idx;
  }catch(e){
    if(window.hideTransmissionNoise) window.hideTransmissionNoise();
    box.innerHTML=`<div class="sbox sbox-err">ERR: ${esc(e.message)}</div>`;
  }
}

function contentSaveReply(ri,ci){
  const box=document.getElementById('contentReplyResult');
  const r=box._replies?.[ri]; if(!r)return;
  const comment=CONTENT.topCommentsFull[ci];
  const entry={type:'reply',he:r.he,fa:r.fa,tone:r.tone,replyTo:comment?.text?.substring(0,50),url:CONTENT.lastPost?.url,ts:Date.now()};
  CONTENT.history.unshift(entry); if(CONTENT.history.length>50)CONTENT.history.pop(); S.set('content_history',CONTENT.history);
  sendReport('content','ریپلای انتخاب شد',{items:1,url:CONTENT.lastPost?.url,selected:r.he});
  toast('SAVED // گزارش به مدیریت ارسال شد');
  contentRenderHistory();
}

// —— تحلیل عمیق کامنت‌ها ——
async function contentDeepAnalysis(){
  if(!CONTENT.lastPost){ alert('ابتدا پست را تحلیل کنید'); return; }
  if(!APP.worker){ alert('Worker تنظیم نشده'); return; }
  const btn=document.getElementById('deepAnalyzeBtn'); btn.disabled=true; btn.innerHTML='<span class="spinner"></span> ANALYZING...';
  const box=document.getElementById('contentDeepResult'); box.innerHTML='';
  if(window.showTransmissionNoise) window.showTransmissionNoise();
  try{
    const comments=CONTENT.topCommentsFull.slice(0,25).map(c=>({text:c.text,likes:c.comment_like_count||0}));
    const sys='تو یک تحلیلگر رفتار شبکه‌های اجتماعی هستی. پاسخ کامل فارسی.';
    const usr=`تحلیل کامنت‌های این پست:\n${JSON.stringify(comments)}\n\nتحلیل کن:\n۱) کامنت‌های پرلایک چه ویژگی‌هایی دارن؟\n۲) چه نوع کامنتی بیشتر مورد توجه قرار گرفته؟\n۳) الگوی کلی مخاطبین چیه؟\n۴) بهترین استراتژی برای کامنت‌های بعدی چیه؟\n۵) چه موضوعاتی حساسیت‌برانگیز بوده؟`;
    const raw=await groqChat('content',[{role:'system',content:sys},{role:'user',content:usr}],{temperature:0.5,max_tokens:2000});
    if(window.hideTransmissionNoise) window.hideTransmissionNoise();
    box.innerHTML=`<div class="ai-box" style="direction:rtl;text-align:right;margin-top:12px;"><h4 style="color:#00d4ff;">// DEEP_ANALYSIS</h4>${esc(raw).replace(/\n/g,'<br>')}</div>`;
  }catch(e){
    if(window.hideTransmissionNoise) window.hideTransmissionNoise();
    box.innerHTML=`<div class="sbox sbox-err">ERR: ${esc(e.message)}</div>`;
  }
  btn.disabled=false; btn.innerHTML='[ DEEP_ANALYSIS ]';
}

// —— رندر کامنت‌ها با فیلتر ——
function contentRenderComments(filter='all'){
  const box=document.getElementById('contentComments');
  if(!CONTENT.lastComments.length){ box.innerHTML=''; return; }
  let list=CONTENT.lastComments;
  if(filter==='pos')list=list.filter(c=>c.tone==='pos');
  else if(filter==='neg')list=list.filter(c=>c.tone==='neg');
  else if(filter==='neu')list=list.filter(c=>c.tone==='neu');
  else if(filter==='short')list=list.filter(c=>c.length==='short'||(c.he||'').length<40);

  const filters=`<div class="filter-row">
    <span class="filter-pill ${filter==='all'?'fa':''}" onclick="contentRenderComments('all')">ALL (${CONTENT.lastComments.length})</span>
    <span class="filter-pill ${filter==='pos'?'fd':''}" onclick="contentRenderComments('pos')">POS</span>
    <span class="filter-pill ${filter==='neg'?'fn':''}" onclick="contentRenderComments('neg')">NEG</span>
    <span class="filter-pill ${filter==='neu'?'fp':''}" onclick="contentRenderComments('neu')">NEU</span>
    <span class="filter-pill ${filter==='short'?'fa':''}" onclick="contentRenderComments('short')">SHORT</span>
  </div>`;

  const items=list.map((c,i)=>{
    const realIdx=CONTENT.lastComments.indexOf(c);
    const tc=c.tone==='pos'?'tone-pos':c.tone==='neg'?'tone-neg':'tone-neu';
    const tl=c.tone==='pos'?'POS':c.tone==='neg'?'NEG':'NEU';
    const sel=CONTENT.selectedIdx===realIdx;
    const lenBadge=c.length==='short'?'<span class="badge" style="border:1px solid var(--border3);color:var(--dim);font-size:8px;">SHORT</span>':'';
    return `<div class="comment-item ${sel?'selected':''}">
      <div class="comment-he" dir="rtl">${esc(c.he||'')}</div>
      <div class="comment-fa">${esc(c.fa||'')}</div>
      <div style="display:flex;align-items:center;gap:6px;margin-top:6px;">
        <span class="comment-tone ${tc}">${tl}</span>${lenBadge}
      </div>
      <div class="comment-actions">
        <button class="mini-btn ${sel?'sel':''}" onclick="contentSelect(${realIdx})">${sel?'✓ SELECTED':'SELECT'}</button>
        <button class="mini-btn" onclick="contentCopy(${realIdx})">COPY</button>
      </div>
    </div>`;
  }).join('');

  box.innerHTML=`<div class="card accent-green">
    <div class="card-title"><span class="ico">💬</span> COMMENTS_GENERATED (${CONTENT.lastComments.length})</div>
    ${filters}
    ${items}
    <button class="btn btn-sm" style="width:100%;margin-top:8px;" onclick="contentGenerate()">[ REGENERATE ]</button>
  </div>`;
}

function contentSelect(i){
  CONTENT.selectedIdx=i; contentRenderComments();
  const c=CONTENT.lastComments[i];
  const entry={type:'comment',he:c.he,fa:c.fa,tone:c.tone,url:CONTENT.lastPost?.url,ts:Date.now()};
  CONTENT.history.unshift(entry); if(CONTENT.history.length>50)CONTENT.history.pop(); S.set('content_history',CONTENT.history);
  sendReport('content','انتخاب کامنت',{items:1,url:CONTENT.lastPost?.url,selected:c.he,tone:c.tone});
  toast('SELECTED // گزارش ارسال شد');
  contentRenderHistory();
}
function contentCopy(i){ const c=CONTENT.lastComments[i]; navigator.clipboard?.writeText(c.he||'').then(()=>toast('COPIED')).catch(()=>alert(c.he)); }

// —— تاریخچه ——
function contentRenderHistory(){
  const card=document.getElementById('contentHistCard');
  const list=document.getElementById('contentHistList');
  const count=document.getElementById('contentHistCount');
  if(!card)return;
  if(!CONTENT.history.length){card.style.display='none';return;}
  card.style.display='block';
  if(count)count.textContent=CONTENT.history.length;
  list.innerHTML=CONTENT.history.slice(0,20).map((h,i)=>{
    const d=new Date(h.ts);
    const type=h.type==='reply'?'↩️ REPLY':'💬 COMMENT';
    return `<div class="user-card">
      <div class="user-info">
        <div class="user-name" style="direction:rtl;text-align:right;font-size:12px;">${esc(h.he?.substring(0,50)||'')}${(h.he||'').length>50?'…':''}</div>
        <div class="user-meta" style="direction:rtl;text-align:right;">${esc(h.fa?.substring(0,40)||'')}</div>
        <div class="user-meta mono">${type} // ${d.toLocaleString('fa-IR')}</div>
      </div>
      <button class="mini-btn" onclick="navigator.clipboard?.writeText('${esc(h.he||'')}').then(()=>toast('COPIED'))">COPY</button>
    </div>`;
  }).join('');
}
