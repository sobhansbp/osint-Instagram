// ============================================================
//  persona.js — بخش هویت‌سازی (نسخه ۲.۰)
//  + پروفایل کامل اینستاگرام + بیو + پست‌های نمونه
//  + سبک نوشتار + Backstory کامل + کامنت‌استایل
// ============================================================

const PERSONA = { saved: [], current: null, activeTab: 'build' };

function initPersona(){
  PERSONA.saved = S.get('persona_saved') || [];
  renderPersonaPanel();
}

function renderPersonaPanel(){
  const p = document.getElementById('panel-persona');
  p.innerHTML = `
    <div id="perSetupAlert"></div>
    <div class="sbox sbox-warn" style="margin-bottom:12px;font-size:10px;">// این بخش «شخصیت نمونه» برای تحلیل تولید می‌کند. خروجی صرفاً نمونه است.</div>

    <div class="tabs" style="margin-bottom:12px;">
      <button class="tab active" id="per-tab-build" onclick="perSwitchTab('build')">🎭 ساخت</button>
      <button class="tab" id="per-tab-profile" onclick="perSwitchTab('profile')">📱 پروفایل</button>
      <button class="tab" id="per-tab-style" onclick="perSwitchTab('style')">✍️ سبک نوشتار</button>
      <button class="tab" id="per-tab-saved" onclick="perSwitchTab('saved')">💾 ذخیره‌شده‌ها</button>
    </div>

    <!-- تب ساخت -->
    <div id="per-content-build">
      <div class="card accent-amber">
        <div class="card-title"><span class="ico">⚙️</span> پارامترهای شخصیت</div>
        <div class="limit-row" style="margin-bottom:10px;">
          <label>جنسیت:</label>
          <select id="perGender">
            <option value="any">فرقی ندارد</option>
            <option value="male">مرد</option>
            <option value="female">زن</option>
          </select>
        </div>
        <div class="limit-row" style="margin-bottom:10px;">
          <label>سن:</label>
          <select id="perAge">
            <option value="any">فرقی ندارد</option>
            <option value="18-25">۱۸-۲۵</option>
            <option value="26-35">۲۶-۳۵</option>
            <option value="36-50">۳۶-۵۰</option>
            <option value="50+">بالای ۵۰</option>
          </select>
        </div>
        <div class="limit-row" style="margin-bottom:10px;">
          <label>طیف سیاسی:</label>
          <select id="perPolitics">
            <option value="any">فرقی ندارد</option>
            <option value="right">راست‌گرا</option>
            <option value="left">چپ‌گرا</option>
            <option value="center">میانه‌رو</option>
            <option value="religious">مذهبی</option>
            <option value="secular">سکولار</option>
          </select>
        </div>
        <div class="limit-row" style="margin-bottom:12px;">
          <label>منطقه:</label>
          <select id="perRegion">
            <option value="any">فرقی ندارد</option>
            <option value="tel-aviv">تل‌آویو</option>
            <option value="jerusalem">اورشلیم</option>
            <option value="haifa">حیفا</option>
            <option value="south">جنوب</option>
            <option value="north">شمال</option>
          </select>
        </div>
        <input type="text" id="perContext" placeholder="ویژگی خاص (اختیاری)..." style="direction:rtl;text-align:right;margin-bottom:10px;">
        <div class="hint" style="margin-bottom:12px;">مثلاً: پدر دو فرزند، کارمند دولت، علاقه‌مند به فوتبال</div>
        <div class="mode-row">
          <div class="mode-opt active" id="per-depth-basic" onclick="perSetDepth('basic')"><span class="mode-ico">⚡</span>سریع</div>
          <div class="mode-opt" id="per-depth-full" onclick="perSetDepth('full')"><span class="mode-ico">🔬</span>کامل</div>
        </div>
        <button class="btn btn-amber" id="perBtn" onclick="perGenerate()">[ BUILD_PERSONA ]</button>
      </div>
      <div id="perResult"></div>
    </div>

    <!-- تب پروفایل اینستاگرام -->
    <div id="per-content-profile" style="display:none;">
      <div class="card">
        <div class="card-title"><span class="ico">📱</span> پروفایل اینستاگرام</div>
        <div class="hint" style="margin-bottom:10px;">ابتدا یک شخصیت بساز، سپس پروفایل کامل اینستاگرام تولید کن</div>
        <button class="btn btn-primary" id="perProfileBtn" onclick="perGenerateProfile()">[ GENERATE_PROFILE ]</button>
        <div id="perProfileResult"></div>
      </div>
    </div>

    <!-- تب سبک نوشتار -->
    <div id="per-content-style" style="display:none;">
      <div class="card">
        <div class="card-title"><span class="ico">✍️</span> سبک کامنت‌گذاری</div>
        <div class="hint" style="margin-bottom:10px;">این شخصیت چطور کامنت میذاره؟ نمونه کامنت‌های واقعی تولید کن</div>
        <div class="limit-row" style="margin-bottom:12px;">
          <label>موضوع:</label>
          <select id="perStyleTopic">
            <option value="politics">خبر سیاسی</option>
            <option value="military">خبر نظامی</option>
            <option value="social">پست اجتماعی</option>
            <option value="sports">ورزش</option>
            <option value="economy">اقتصاد</option>
          </select>
        </div>
        <button class="btn btn-primary" id="perStyleBtn" onclick="perGenerateStyle()">[ GENERATE_STYLE ]</button>
        <div id="perStyleResult"></div>
      </div>
    </div>

    <!-- تب ذخیره‌شده‌ها -->
    <div id="per-content-saved" style="display:none;">
      <div class="card" id="perSavedCard">
        <div class="card-title"><span class="ico">💾</span> شخصیت‌های ذخیره‌شده (<span id="perSavedCount">0</span>)</div>
        <div id="perSavedList"></div>
      </div>
    </div>
  `;
  PERSONA._depth = 'basic';
  perRenderSaved();
}

function onShow_persona(){ perCheckSetup(); }
function perCheckSetup(){
  const el=document.getElementById('perSetupAlert'); if(!el)return;
  if(!APP.worker){ el.innerHTML=`<div class="sbox sbox-warn" style="margin-top:0;margin-bottom:12px;">WORKER_NOT_CONFIGURED${APP.isAdmin?` <button class="btn btn-sm" style="width:100%;margin-top:8px;" onclick="switchTab('setup')">[SETUP]</button>`:''}</div>`; }
  else el.innerHTML='';
}

function perSwitchTab(t){
  ['build','profile','style','saved'].forEach(x=>{
    document.getElementById('per-content-'+x).style.display=x===t?'block':'none';
    document.getElementById('per-tab-'+x).classList.toggle('active',x===t);
  });
  if(t==='saved') perRenderSaved();
}

function perSetDepth(d){
  PERSONA._depth=d;
  ['basic','full'].forEach(x=>document.getElementById('per-depth-'+x).classList.toggle('active',x===d));
}

// —— ساخت شخصیت ——
async function perGenerate(){
  if(!APP.worker){ if(APP.isAdmin)switchTab('setup'); else alert('Worker تنظیم نشده'); return; }
  const gender=document.getElementById('perGender').value;
  const age=document.getElementById('perAge').value;
  const politics=document.getElementById('perPolitics').value;
  const region=document.getElementById('perRegion').value;
  const ctx=document.getElementById('perContext').value.trim();
  const depth=PERSONA._depth||'basic';
  const btn=document.getElementById('perBtn'); btn.disabled=true; btn.innerHTML='<span class="spinner"></span> BUILDING...';
  const box=document.getElementById('perResult'); box.innerHTML='';
  if(window.showTransmissionNoise) window.showTransmissionNoise();
  try{
    const gMap={any:'هر جنسیتی',male:'مرد',female:'زن'};
    const pMap={any:'',right:'راست‌گرا',left:'چپ‌گرا',center:'میانه‌رو',religious:'مذهبی',secular:'سکولار'};
    const rMap={any:'',['tel-aviv']:'تل‌آویو',jerusalem:'اورشلیم',haifa:'حیفا',south:'جنوب اسرائیل',north:'شمال اسرائیل'};

    const extraFields = depth==='full' ? `,"instagram_username":"آیدی اینستاگرام پیشنهادی","followers":"تعداد تقریبی فالوور","following":"تعداد تقریبی فالووینگ","post_count":"تعداد پست","bio_instagram":"بیو اینستاگرام (حداکثر ۱۵۰ کاراکتر)","story_highlights":["عنوان هایلایت‌های اینستاگرام"],"comment_style":"سبک کامنت‌گذاری این شخص","daily_routine":"روتین روزانه","political_view":"دیدگاه سیاسی دقیق"` : '';

    const sys='تو یک ابزار تولید پرسونای نمونه اسرائیلی هستی. شخصیت واقع‌نما و باورپذیر بساز. پاسخ فقط JSON فارسی.';
    const usr=`شخصیت نمونه اسرائیلی:\nجنسیت: ${gMap[gender]}\nسن: ${age==='any'?'آزاد':age}\n${pMap[politics]?'طیف سیاسی: '+pMap[politics]:''}\n${rMap[region]?'منطقه: '+rMap[region]:''}\n${ctx?'ویژگی: '+ctx:''}\n\nJSON:\n{"name":"نام عبری کامل","age":"سن دقیق","city":"شهر","job":"شغل دقیق","education":"تحصیلات","bio":"بیوگرافی کوتاه (۲ جمله)","interests":"علایق","personality":"ویژگی‌های شخصیتی","background":"داستان زندگی (۳-۴ جمله)"${extraFields}}`;

    const raw=await groqChat('persona',[{role:'system',content:sys},{role:'user',content:usr}],{json:true,temperature:1.0,max_tokens:2000});
    let pr; try{ pr=JSON.parse(raw); }catch(e){ throw new Error('خطا در پردازش'); }
    if(window.hideTransmissionNoise) window.hideTransmissionNoise();
    PERSONA.current=pr;
    perRenderResult(pr, depth);
    sendReport('persona','تولید شخصیت',{items:1});
  }catch(e){
    if(window.hideTransmissionNoise) window.hideTransmissionNoise();
    box.innerHTML=`<div class="sbox sbox-err">ERR: ${esc(e.message)}</div>`;
  }
  btn.disabled=false; btn.innerHTML='[ BUILD_PERSONA ]';
}

function perRenderResult(pr, depth){
  const box=document.getElementById('perResult');
  const fullFields = depth==='full' ? `
    ${pr.instagram_username?`<div class="persona-field"><span class="k">آیدی</span><span class="v" style="direction:ltr;">@${esc(pr.instagram_username)}</span></div>`:''}
    ${pr.followers?`<div class="persona-field"><span class="k">فالوور</span><span class="v">${esc(pr.followers)}</span></div>`:''}
    ${pr.bio_instagram?`<div class="persona-field"><span class="k">بیو اینستا</span><span class="v">${esc(pr.bio_instagram)}</span></div>`:''}
    ${pr.comment_style?`<div class="persona-field"><span class="k">سبک کامنت</span><span class="v">${esc(pr.comment_style)}</span></div>`:''}
    ${pr.political_view?`<div class="persona-field"><span class="k">دیدگاه سیاسی</span><span class="v">${esc(pr.political_view)}</span></div>`:''}
    ${pr.daily_routine?`<div class="persona-field" style="border:none;"><span class="k">روتین</span><span class="v">${esc(pr.daily_routine)}</span></div>`:''}
  ` : '';

  box.innerHTML=`<div class="persona-card">
    <span class="persona-sample-tag">SAMPLE_PERSONA // ${depth.toUpperCase()}</span>
    <div style="font-family:var(--font-hud);font-size:16px;font-weight:700;color:var(--amber);margin-bottom:12px;direction:rtl;">${esc(pr.name||'—')}</div>
    <div class="persona-field"><span class="k">سن</span><span class="v">${esc(pr.age||'—')}</span></div>
    <div class="persona-field"><span class="k">شهر</span><span class="v">${esc(pr.city||'—')}</span></div>
    <div class="persona-field"><span class="k">شغل</span><span class="v">${esc(pr.job||'—')}</span></div>
    <div class="persona-field"><span class="k">تحصیلات</span><span class="v">${esc(pr.education||'—')}</span></div>
    <div class="persona-field"><span class="k">بیو</span><span class="v">${esc(pr.bio||'—')}</span></div>
    <div class="persona-field"><span class="k">علایق</span><span class="v">${esc(pr.interests||'—')}</span></div>
    <div class="persona-field"><span class="k">شخصیت</span><span class="v">${esc(pr.personality||'—')}</span></div>
    <div class="persona-field"><span class="k">پیشینه</span><span class="v">${esc(pr.background||'—')}</span></div>
    ${fullFields}
    <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;">
      <button class="btn btn-sm" onclick='perSave(${JSON.stringify(pr).replace(/'/g,"&#39;")})'>💾 SAVE</button>
      <button class="btn btn-sm" onclick="perGenerate()">🔄 REBUILD</button>
      <button class="btn btn-sm" onclick="perSwitchTab('profile')">📱 PROFILE</button>
      <button class="btn btn-sm" onclick="perSwitchTab('style')">✍️ STYLE</button>
    </div>
  </div>`;
}

// —— پروفایل کامل اینستاگرام ——
async function perGenerateProfile(){
  if(!PERSONA.current){ alert('ابتدا یک شخصیت بسازید'); return; }
  if(!APP.worker){ alert('Worker تنظیم نشده'); return; }
  const btn=document.getElementById('perProfileBtn'); btn.disabled=true; btn.innerHTML='<span class="spinner"></span> GENERATING...';
  const box=document.getElementById('perProfileResult'); box.innerHTML='';
  if(window.showTransmissionNoise) window.showTransmissionNoise();
  try{
    const pr=PERSONA.current;
    const sys='تو یک متخصص ساخت پروفایل اینستاگرام اسرائیلی هستی. پاسخ فقط JSON فارسی.';
    const usr=`برای این شخصیت پروفایل کامل اینستاگرام بساز:\n${JSON.stringify({name:pr.name,age:pr.age,job:pr.job,city:pr.city,interests:pr.interests,personality:pr.personality})}\n\nJSON:\n{"username":"آیدی پیشنهادی (بدون @، انگلیسی یا عبری-انگلیسی)","display_name":"نام نمایشی","bio":"بیوگرافی اینستاگرام (حداکثر ۱۵۰ کاراکتر، باورپذیر)","highlights":["عنوان هایلایت ۱","عنوان هایلایت ۲","عنوان هایلایت ۳"],"typical_posts":["توضیح پست نوع ۱","توضیح پست نوع ۲","توضیح پست نوع ۳"],"caption_style":"سبک کپشن نوشتن","hashtags":["هشتگ۱","هشتگ۲","هشتگ۳"],"post_frequency":"چقدر پست میذاره","active_hours":"چه ساعت‌هایی فعاله","story_style":"سبک استوری"}`;
    const raw=await groqChat('persona',[{role:'system',content:sys},{role:'user',content:usr}],{json:true,temperature:0.9,max_tokens:2000});
    let pf; try{ pf=JSON.parse(raw); }catch(e){ throw new Error('خطا در پردازش'); }
    if(window.hideTransmissionNoise) window.hideTransmissionNoise();

    box.innerHTML=`<div class="persona-card" style="margin-top:12px;">
      <span class="persona-sample-tag">INSTAGRAM_PROFILE</span>
      <div style="font-family:var(--font-mono);font-size:16px;color:var(--green);margin-bottom:12px;direction:ltr;">@${esc(pf.username||'—')}</div>
      <div class="persona-field"><span class="k">نام</span><span class="v">${esc(pf.display_name||'—')}</span></div>
      <div class="persona-field"><span class="k">بیو</span><span class="v">${esc(pf.bio||'—')}</span></div>
      <div class="persona-field"><span class="k">هایلایت‌ها</span><span class="v">${(pf.highlights||[]).map(h=>`<span style="font-family:var(--font-mono);font-size:10px;border:1px solid var(--border3);padding:2px 7px;margin-left:4px;">${esc(h)}</span>`).join('')}</span></div>
      <div class="persona-field"><span class="k">سبک کپشن</span><span class="v">${esc(pf.caption_style||'—')}</span></div>
      <div class="persona-field"><span class="k">فرکانس</span><span class="v">${esc(pf.post_frequency||'—')}</span></div>
      <div class="persona-field"><span class="k">ساعت فعالیت</span><span class="v">${esc(pf.active_hours||'—')}</span></div>
      <div class="persona-field"><span class="k">هشتگ‌ها</span><span class="v" style="direction:ltr;">${(pf.hashtags||[]).map(h=>`<span style="color:var(--cyan);font-family:var(--font-mono);font-size:10px;margin-left:6px;">#${esc(h)}</span>`).join('')}</span></div>
      <div style="margin-top:12px;font-family:var(--font-mono);font-size:9px;color:var(--dim);letter-spacing:2px;">// TYPICAL_POSTS</div>
      ${(pf.typical_posts||[]).map((pt,i)=>`<div style="padding:8px 0;border-bottom:1px solid var(--border2);font-size:12px;direction:rtl;">${i+1}. ${esc(pt)}</div>`).join('')}
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button class="btn btn-sm" onclick="perCopyProfile()">📋 COPY_BIO</button>
      </div>
    </div>`;
    box._pf=pf;
  }catch(e){
    if(window.hideTransmissionNoise) window.hideTransmissionNoise();
    box.innerHTML=`<div class="sbox sbox-err">ERR: ${esc(e.message)}</div>`;
  }
  btn.disabled=false; btn.innerHTML='[ GENERATE_PROFILE ]';
}

function perCopyProfile(){
  const box=document.getElementById('perProfileResult');
  if(!box._pf)return;
  const pf=box._pf;
  const t=`@${pf.username}\n${pf.display_name}\n\n${pf.bio}\n\nهشتگ‌ها: ${(pf.hashtags||[]).map(h=>'#'+h).join(' ')}`;
  navigator.clipboard?.writeText(t).then(()=>toast('COPIED'));
}

// —— سبک کامنت‌گذاری ——
async function perGenerateStyle(){
  if(!PERSONA.current){ alert('ابتدا یک شخصیت بسازید'); return; }
  if(!APP.worker){ alert('Worker تنظیم نشده'); return; }
  const topic=document.getElementById('perStyleTopic').value;
  const topicMap={politics:'خبر سیاسی اسرائیل',military:'خبر نظامی',social:'پست اجتماعی روزمره',sports:'خبر ورزشی',economy:'خبر اقتصادی'};
  const btn=document.getElementById('perStyleBtn'); btn.disabled=true; btn.innerHTML='<span class="spinner"></span> ANALYZING...';
  const box=document.getElementById('perStyleResult'); box.innerHTML='';
  if(window.showTransmissionNoise) window.showTransmissionNoise();
  try{
    const pr=PERSONA.current;
    const sys='تو یک متخصص رفتارشناسی شبکه‌های اجتماعی اسرائیل هستی. پاسخ فقط JSON فارسی.';
    const usr=`این شخصیت:\n${JSON.stringify({name:pr.name,age:pr.age,job:pr.job,personality:pr.personality,interests:pr.interests})}\n\nموضوع: ${topicMap[topic]}\n\nJSON:\n{"style_description":"توضیح سبک کامنت‌گذاری این شخص","sample_comments":["کامنت نمونه ۱ به عبری","کامنت نمونه ۲ به عبری","کامنت نمونه ۳ به عبری","کامنت نمونه ۴ به عبری","کامنت نمونه ۵ به عبری"],"translations":["ترجمه ۱","ترجمه ۲","ترجمه ۳","ترجمه ۴","ترجمه ۵"],"emoji_usage":"میزان و نوع استفاده از ایموجی","length_preference":"معمولاً کوتاه/متوسط/بلند","reaction_style":"چطور به نظرات دیگران واکنش نشون میده"}`;
    const raw=await groqChat('persona',[{role:'system',content:sys},{role:'user',content:usr}],{json:true,temperature:0.9,max_tokens:2000});
    let st; try{ st=JSON.parse(raw); }catch(e){ throw new Error('خطا در پردازش'); }
    if(window.hideTransmissionNoise) window.hideTransmissionNoise();

    const comments=(st.sample_comments||[]).map((c,i)=>`
      <div class="comment-item">
        <div class="comment-he" dir="rtl">${esc(c)}</div>
        <div class="comment-fa">${esc((st.translations||[])[i]||'')}</div>
        <div class="comment-actions">
          <button class="mini-btn" onclick="navigator.clipboard?.writeText('${esc(c)}').then(()=>toast('COPIED'))">COPY</button>
        </div>
      </div>`).join('');

    box.innerHTML=`<div style="margin-top:12px;">
      <div class="ai-box" style="margin-bottom:12px;">
        <h4 style="color:var(--amber);">// COMMENT_STYLE_ANALYSIS</h4>
        ${esc(st.style_description||'')}
        <div style="margin-top:8px;display:flex;gap:10px;flex-wrap:wrap;font-family:var(--font-mono);font-size:10px;">
          <span style="color:var(--dim);">EMOJI: <span style="color:var(--white);">${esc(st.emoji_usage||'—')}</span></span>
          <span style="color:var(--dim);">LENGTH: <span style="color:var(--white);">${esc(st.length_preference||'—')}</span></span>
        </div>
      </div>
      <div style="font-family:var(--font-mono);font-size:9px;color:var(--dim);letter-spacing:2px;margin-bottom:8px;">// SAMPLE_COMMENTS</div>
      ${comments}
    </div>`;
  }catch(e){
    if(window.hideTransmissionNoise) window.hideTransmissionNoise();
    box.innerHTML=`<div class="sbox sbox-err">ERR: ${esc(e.message)}</div>`;
  }
  btn.disabled=false; btn.innerHTML='[ GENERATE_STYLE ]';
}

// —— ذخیره و مدیریت ——
function perSave(pr){
  PERSONA.saved.unshift({...pr,ts:Date.now()});
  if(PERSONA.saved.length>30)PERSONA.saved.pop();
  S.set('persona_saved',PERSONA.saved);
  perRenderSaved(); toast('SAVED');
}

function perRenderSaved(){
  const card=document.getElementById('perSavedCard');
  const list=document.getElementById('perSavedList');
  const count=document.getElementById('perSavedCount');
  if(!card)return;
  if(!PERSONA.saved.length){
    if(list) list.innerHTML='<div class="empty">NO_SAVED_PERSONAS</div>';
    if(count) count.textContent='0';
    return;
  }
  if(count) count.textContent=PERSONA.saved.length;
  list.innerHTML=PERSONA.saved.map((p,i)=>`
    <div class="user-card">
      <div class="user-avatar" style="font-size:11px;font-family:var(--font-mono);color:var(--amber);">${String(i+1).padStart(2,'0')}</div>
      <div class="user-info">
        <div class="user-name" style="direction:rtl;text-align:right;color:var(--amber);">${esc(p.name||'—')}</div>
        <div class="user-meta" style="direction:ltr;">${esc(p.age||'')} // ${esc(p.city||'')} // ${esc(p.job||'')}</div>
        <div class="user-meta mono">${new Date(p.ts).toLocaleDateString('fa-IR')}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:5px;">
        <button class="mini-btn" onclick="perLoadSaved(${i})">LOAD</button>
        <button class="mini-btn" onclick="perDelete(${i})" style="color:var(--red);">DEL</button>
      </div>
    </div>`).join('');
}

function perLoadSaved(i){
  PERSONA.current=PERSONA.saved[i];
  perRenderResult(PERSONA.current,'basic');
  perSwitchTab('build');
  toast('LOADED');
}
function perDelete(i){ PERSONA.saved.splice(i,1); S.set('persona_saved',PERSONA.saved); perRenderSaved(); }
