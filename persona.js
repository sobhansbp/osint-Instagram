// ============================================================
//  persona.js — بخش هویت‌سازی (شخصیت نمونه)
//  تولید پرسونای نمونه با هوش مصنوعی — برچسب «شخصیت نمونه»
// ============================================================

const PERSONA = { saved: [] };

function initPersona(){
  PERSONA.saved = S.get('persona_saved') || [];
  renderPersonaPanel();
}

function renderPersonaPanel(){
  const p=document.getElementById('panel-persona');
  p.innerHTML=`
    <div id="perSetupAlert"></div>
    <div class="card">
      <div class="card-title"><span class="ico">🎭</span> ساخت شخصیت نمونه <span class="line"></span></div>
      <div class="sbox sbox-warn" style="margin-top:0;margin-bottom:13px;">این بخش «شخصیت نمونه» برای تحلیل و برنامه‌ریزی تولید می‌کند. خروجی صرفاً نمونه است.</div>
      <div class="limit-row" style="margin-bottom:10px;">
        <label>جنسیت:</label>
        <select id="perGender"><option value="any">فرقی ندارد</option><option value="male">مرد</option><option value="female">زن</option></select>
      </div>
      <div class="limit-row" style="margin-bottom:10px;">
        <label>رده سنی:</label>
        <select id="perAge"><option value="any">فرقی ندارد</option><option value="18-25">۱۸-۲۵</option><option value="26-35">۲۶-۳۵</option><option value="36-50">۳۶-۵۰</option><option value="50+">بالای ۵۰</option></select>
      </div>
      <input type="text" id="perContext" placeholder="زمینه یا ویژگی خاص (اختیاری)" style="direction:rtl;text-align:right;">
      <div class="hint">مثلاً: اهل تل‌آویو، علاقه‌مند به ورزش، شغل آزاد</div>
      <button class="btn btn-gold" style="margin-top:12px;" id="perBtn" onclick="perGenerate()">🎭 تولید شخصیت نمونه</button>
    </div>
    <div id="perResult"></div>
    <div class="card" id="perSavedCard" style="display:none;">
      <div class="card-title"><span class="ico">💾</span> شخصیت‌های ذخیره‌شده <span class="line"></span></div>
      <div id="perSavedList"></div>
    </div>
  `;
  perRenderSaved();
}

function onShow_persona(){ perCheckSetup(); }
function perCheckSetup(){ const el=document.getElementById('perSetupAlert'); if(!el)return; if(!APP.worker){ el.innerHTML=`<div class="sbox sbox-warn" style="margin-top:0;margin-bottom:14px;">⚠️ Worker تنظیم نشده${APP.isAdmin?` <button class="btn btn-sm" style="width:100%;margin-top:9px;" onclick="switchTab('setup')">تنظیمات</button>`:''}</div>`; } else el.innerHTML=''; }

async function perGenerate(){
  if(!APP.worker){ if(APP.isAdmin)switchTab('setup'); else alert('Worker تنظیم نشده'); return; }
  const gender=document.getElementById('perGender').value;
  const age=document.getElementById('perAge').value;
  const ctx=document.getElementById('perContext').value.trim();
  const btn=document.getElementById('perBtn'); btn.disabled=true; btn.innerHTML='<span class="spinner"></span> در حال ساخت...';
  const box=document.getElementById('perResult'); box.innerHTML='';
  clearLog(); log('تولید شخصیت نمونه...','gold');
  try{
    const gMap={any:'هر جنسیتی',male:'مرد',female:'زن'};
    const sys='تو یک ابزار تولید پرسونای نمونه برای تحلیل مخاطب هستی. یک شخصیت نمونه واقع‌نما بساز. پاسخ فقط JSON و فارسی.';
    const usr=`یک شخصیت نمونه بساز با این مشخصات:\nجنسیت: ${gMap[gender]}\nرده سنی: ${age==='any'?'آزاد':age}\nزمینه: ${ctx||'آزاد'}\n\nJSON دقیقاً این کلیدها:\n{"name":"نام کامل","age":"سن","city":"شهر و کشور","job":"شغل","education":"تحصیلات","bio":"بیوگرافی کوتاه (۲ جمله)","interests":"علایق (با کاما)","personality":"ویژگی‌های شخصیتی","background":"پیشینه و داستان کوتاه"}`;
    const raw=await groqChat('persona',[{role:'system',content:sys},{role:'user',content:usr}],{json:true,temperature:1.0});
    let pr; try{ pr=JSON.parse(raw); }catch(e){ throw new Error('خطا در پردازش پاسخ'); }
    perRenderResult(pr);
    sendReport('persona','تولید شخصیت',{items:1});
    log('✓ شخصیت نمونه ساخته شد','ok');
  }catch(e){ box.innerHTML=`<div class="sbox sbox-err">❌ خطا: ${esc(e.message)}</div>`; log('خطا: '+e.message,'err'); }
  btn.disabled=false; btn.innerHTML='🎭 تولید شخصیت نمونه';
}

function perRenderResult(pr){
  const box=document.getElementById('perResult');
  box.innerHTML=`<div class="persona-card">
    <span class="persona-sample-tag">🎭 شخصیت نمونه</span>
    <div style="font-size:18px;font-weight:800;margin-bottom:4px;">${esc(pr.name||'—')}</div>
    <div class="persona-field"><span class="k">سن</span><span class="v">${esc(pr.age||'—')}</span></div>
    <div class="persona-field"><span class="k">محل</span><span class="v">${esc(pr.city||'—')}</span></div>
    <div class="persona-field"><span class="k">شغل</span><span class="v">${esc(pr.job||'—')}</span></div>
    <div class="persona-field"><span class="k">تحصیلات</span><span class="v">${esc(pr.education||'—')}</span></div>
    <div class="persona-field"><span class="k">بیو</span><span class="v">${esc(pr.bio||'—')}</span></div>
    <div class="persona-field"><span class="k">علایق</span><span class="v">${esc(pr.interests||'—')}</span></div>
    <div class="persona-field"><span class="k">شخصیت</span><span class="v">${esc(pr.personality||'—')}</span></div>
    <div class="persona-field" style="border:none;"><span class="k">پیشینه</span><span class="v">${esc(pr.background||'—')}</span></div>
    <div style="display:flex;gap:8px;margin-top:13px;">
      <button class="btn btn-sm" onclick='perSave(${JSON.stringify(pr).replace(/'/g,"&#39;")})'>💾 ذخیره</button>
      <button class="btn btn-sm" onclick="perGenerate()">🔄 تولید مجدد</button>
    </div>
  </div>`;
}

function perSave(pr){ PERSONA.saved.unshift({...pr,ts:Date.now()}); if(PERSONA.saved.length>30)PERSONA.saved.pop(); S.set('persona_saved',PERSONA.saved); perRenderSaved(); toast('✅ ذخیره شد'); }
function perRenderSaved(){
  const card=document.getElementById('perSavedCard'), list=document.getElementById('perSavedList'); if(!card)return;
  if(!PERSONA.saved.length){ card.style.display='none'; return; }
  card.style.display='block';
  list.innerHTML=PERSONA.saved.map((p,i)=>`<div class="user-card"><div class="user-avatar">🎭</div><div class="user-info"><div class="user-name" style="direction:rtl;text-align:right;">${esc(p.name||'—')}</div><div class="user-meta" style="direction:rtl;text-align:right;">${esc(p.age||'')} · ${esc(p.city||'')} · ${esc(p.job||'')}</div></div><span class="del" onclick="perDelete(${i})" style="cursor:pointer;color:var(--text3);font-size:18px;">×</span></div>`).join('');
}
function perDelete(i){ PERSONA.saved.splice(i,1); S.set('persona_saved',PERSONA.saved); perRenderSaved(); }
