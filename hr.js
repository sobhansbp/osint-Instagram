// ============================================================
//  hr.js — بخش نیروی انسانی و گزارش‌گیری
//  پایش کامنت/ریپلای اعضای واقعی + نرخ مشارکت + رتبه‌بندی
// ============================================================

const HR = { members: [], history: [], mode: 'comment', lastResult: null };

function initHR(){
  HR.members = S.get('hr_members') || [];
  HR.history = S.get('hr_history') || [];
  HR.mode = S.get('hr_mode') || 'comment';
  renderHRPanel();
}

function renderHRPanel(){
  const p = document.getElementById('panel-hr');
  p.innerHTML = `
    <div id="hrSetupAlert"></div>
    <div class="card">
      <div class="card-title"><span class="ico">🎯</span> نوع پایش <span class="line"></span></div>
      <div class="mode-row">
        <div class="mode-opt ${HR.mode==='comment'?'active':''}" id="hr-mode-comment" onclick="hrSetMode('comment')"><span class="mode-ico">💬</span> کامنت زیر پست</div>
        <div class="mode-opt ${HR.mode==='reply'?'active':''}" id="hr-mode-reply" onclick="hrSetMode('reply')"><span class="mode-ico">↩️</span> ریپلای روی کامنت</div>
      </div>
    </div>
    <div class="card">
      <div class="card-title"><span class="ico">🔗</span> <span id="hrLinkLabel">لینک پست‌ها</span> <span class="line"></span></div>
      <textarea id="hrUrls" placeholder="https://www.instagram.com/p/ABC123/"></textarea>
      <div class="hint" id="hrLinkHint">هر لینک در یک خط</div>
    </div>
    <div class="card">
      <div class="card-title"><span class="ico">👥</span> اعضا (<span id="hrMemberCount">0</span>) <span class="line"></span></div>
      <div class="members-wrap" id="hrMembersWrap"></div>
      <input type="text" id="hrMemberInput" placeholder="آیدی (بدون @) — Enter" onkeydown="if(event.key==='Enter'){event.preventDefault();hrAddMember();}" style="margin-bottom:9px;">
      <textarea id="hrBulk" placeholder="یا چند آیدی یک‌جا (هر خط یا کاما)" style="min-height:64px;"></textarea>
      <div style="display:flex;gap:8px;margin-top:9px;flex-wrap:wrap;">
        <button class="btn btn-sm" onclick="hrBulkAdd()">➕ گروهی</button>
        <button class="btn btn-sm" onclick="hrClear()">🗑️ پاک</button>
      </div>
    </div>
    <div class="card">
      <div class="card-title"><span class="ico">📄</span> تنظیمات دریافت <span class="line"></span></div>
      <div class="limit-row">
        <label>حداکثر صفحات:</label>
        <select id="hrMaxPages">
          <option value="3">۳ (~۴۵ مورد)</option>
          <option value="5" selected>۵ (~۷۵)</option>
          <option value="10">۱۰ (~۱۵۰)</option>
          <option value="20">۲۰ (~۳۰۰)</option>
          <option value="999">همه</option>
        </select>
      </div>
    </div>
    <button class="btn btn-primary" id="hrBtn" onclick="hrRun()">🔍 شروع پایش</button>
    <div style="height:14px"></div>
    <div class="card" id="hrHistoryCard" style="display:none;">
      <div class="card-title"><span class="ico">📋</span> تاریخچه پایش <span class="line"></span></div>
      <div id="hrHistoryList"></div>
    </div>
  `;
  const mp = S.get('hr_maxpages'); if(mp) document.getElementById('hrMaxPages').value = mp;
  document.getElementById('hrMaxPages').onchange = e => S.set('hr_maxpages', e.target.value);
  hrSetMode(HR.mode);
  hrRenderMembers();
  hrRenderHistory();
}

function onShow_hr(){ hrCheckSetup(); }
function hrCheckSetup(){
  const el = document.getElementById('hrSetupAlert'); if(!el) return;
  if(!APP.worker){ el.innerHTML = `<div class="sbox sbox-warn" style="margin-top:0;margin-bottom:14px;">⚠️ Worker تنظیم نشده${APP.isAdmin?` <button class="btn btn-sm" style="width:100%;margin-top:9px;" onclick="switchTab('setup')">رفتن به تنظیمات</button>`:' — با مدیر هماهنگ کنید'}</div>`; }
  else el.innerHTML='';
}

function hrSetMode(m){
  HR.mode = m; S.set('hr_mode', m);
  document.getElementById('hr-mode-comment').classList.toggle('active', m==='comment');
  document.getElementById('hr-mode-reply').classList.toggle('active', m==='reply');
  const label=document.getElementById('hrLinkLabel'), hint=document.getElementById('hrLinkHint'), ta=document.getElementById('hrUrls');
  if(m==='comment'){ label.textContent='لینک پست‌ها'; hint.textContent='بررسی می‌شود چه کسی زیر پست کامنت گذاشته'; ta.placeholder='https://www.instagram.com/p/ABC123/'; }
  else { label.textContent='لینک کامنت‌ها'; hint.innerHTML='بررسی می‌شود چه کسی به کامنت ریپلای داده<br>(روی کامنت نگه‌دار → Copy Link)'; ta.placeholder='https://www.instagram.com/p/ABC/c/18xxx/'; }
}

function hrRenderMembers(){
  const wrap=document.getElementById('hrMembersWrap'); if(!wrap) return;
  document.getElementById('hrMemberCount').textContent = HR.members.length;
  wrap.innerHTML = HR.members.length ? HR.members.map((m,i)=>`<span class="member-tag"><span>@${esc(m)}</span><span class="remove" onclick="hrRemoveMember(${i})">×</span></span>`).join('') : '<span style="color:var(--text3);font-size:12px;">هنوز کسی اضافه نشده</span>';
}
function hrAddMember(){ const v=document.getElementById('hrMemberInput').value.trim().replace(/^@/,''); if(v&&!HR.members.includes(v)){HR.members.push(v);S.set('hr_members',HR.members);hrRenderMembers();} document.getElementById('hrMemberInput').value=''; }
function hrBulkAdd(){ document.getElementById('hrBulk').value.split(/[\n,،\s]+/).map(u=>u.trim().replace(/^@/,'')).filter(Boolean).forEach(u=>{if(!HR.members.includes(u))HR.members.push(u);}); document.getElementById('hrBulk').value=''; S.set('hr_members',HR.members); hrRenderMembers(); }
function hrRemoveMember(i){ HR.members.splice(i,1); S.set('hr_members',HR.members); hrRenderMembers(); }
function hrClear(){ if(confirm('همه اعضا پاک شوند؟')){ HR.members=[]; S.set('hr_members',HR.members); hrRenderMembers(); } }

async function hrFetchComments(postUrl){
  const maxPages = parseInt(document.getElementById('hrMaxPages').value||'5');
  let all=[], cursor=null, page=0;
  while(page<maxPages){ page++; let u=`https://api.scrapecreators.com/v2/instagram/post/comments?url=${encodeURIComponent(postUrl)}`; if(cursor)u+=`&cursor=${encodeURIComponent(cursor)}`; log(`صفحه ${page}...`); const data=await scFetch(u); const c=data.comments||[]; all=all.concat(c); if(!data.cursor||c.length===0)break; cursor=data.cursor; await new Promise(r=>setTimeout(r,400)); }
  return all;
}
async function hrFetchReplies(commentUrl){
  const maxPages = parseInt(document.getElementById('hrMaxPages').value||'5');
  let all=[], cursor=null, page=0;
  while(page<maxPages){ page++; let u=`https://api.scrapecreators.com/v1/instagram/comment/replies?url=${encodeURIComponent(commentUrl)}`; if(cursor)u+=`&cursor=${encodeURIComponent(cursor)}`; log(`صفحه ریپلای ${page}...`); const data=await scFetch(u); const c=data.replies||data.comments||[]; all=all.concat(c); if(!data.cursor||c.length===0)break; cursor=data.cursor; await new Promise(r=>setTimeout(r,400)); }
  return all;
}

async function hrRun(){
  const urls=document.getElementById('hrUrls').value.split(/\n/).map(u=>u.trim()).filter(u=>u.includes('instagram.com'));
  if(!urls.length){ alert('حداقل یک لینک وارد کنید'); return; }
  if(!HR.members.length){ alert('ابتدا اعضا را اضافه کنید'); return; }
  if(!APP.worker){ if(APP.isAdmin) switchTab('setup'); else alert('Worker تنظیم نشده'); return; }
  const btn=document.getElementById('hrBtn'); btn.disabled=true; btn.innerHTML='<span class="spinner"></span> در حال پایش...';
  clearLog(); document.getElementById('results').innerHTML='';
  const postResults=[]; const word=HR.mode==='comment'?'کامنت':'ریپلای'; let totalItems=0;
  for(const url of urls){
    const id=url.match(/\/(p|reel|c)\/([^/?]+)/)?.[2]||'...'; log(`━━━ ${id} ━━━`,'gold');
    try{
      const items = HR.mode==='comment' ? await hrFetchComments(url) : await hrFetchReplies(url);
      totalItems += items.length; log(`✓ ${items.length} ${word}`,'ok');
      const map={}; items.forEach(c=>{ const u=(c.user?.username||c.ownerUsername||c.owner?.username||'').toLowerCase(); if(u&&!map[u])map[u]={text:c.text,likes:c.comment_like_count||c.likesCount||0}; });
      postResults.push({ url, items, userStatus: HR.members.map(u=>({username:u,done:!!map[u.toLowerCase()],text:map[u.toLowerCase()]?.text||null,likes:map[u.toLowerCase()]?.likes||0})), error:null });
    }catch(e){ log('خطا: '+e.message,'err'); postResults.push({url,items:[],userStatus:HR.members.map(u=>({username:u,done:false,text:null,likes:0})),error:e.message}); }
  }
  const summary=HR.members.map(u=>{ let cc=0,tl=0,lc=null; postResults.forEach(p=>{const s=p.userStatus.find(x=>x.username===u); if(s?.done){cc++;tl+=s.likes;if(!lc)lc=s.text;}}); const rate=Math.round(cc/urls.length*100); return {username:u,count:cc,total:urls.length,rate,status:rate===100?'done':rate>0?'partial':'none',likes:tl,text:lc}; });
  const doneCount=summary.filter(u=>u.status==='done').length, partialCount=summary.filter(u=>u.status==='partial').length, noneCount=summary.filter(u=>u.status==='none').length;
  const result={postResults,summary,doneCount,partialCount,noneCount,urls,members:[...HR.members],mode:HR.mode,ts:Date.now()};
  HR.lastResult=result; HR.history.unshift(result); if(HR.history.length>15)HR.history.pop(); S.set('hr_history',HR.history);
  sendReport('hr', HR.mode==='comment'?'پایش کامنت':'پایش ریپلای', { items: totalItems, posts: urls.length, done: doneCount });
  hrRenderResults(result); hrRenderHistory();
  btn.disabled=false; btn.innerHTML='🔍 شروع پایش'; log('✓ پایش کامل شد','ok');
}

function hrRenderResults(r, filter='all', search=''){
  const wrap=document.getElementById('results'); wrap._hr=r;
  const word=r.mode==='reply'?'ریپلای':'کامنت';
  const stats=`<div class="stats-row"><div class="stat" style="--barcolor:var(--gold)"><div class="stat-num" style="color:var(--gold2)">${r.members.length}</div><div class="stat-label">کل اعضا</div></div><div class="stat" style="--barcolor:var(--green2)"><div class="stat-num" style="color:var(--green2)">${r.doneCount}</div><div class="stat-label">انجام داده</div></div><div class="stat" style="--barcolor:var(--yellow2)"><div class="stat-num" style="color:var(--yellow2)">${r.partialCount}</div><div class="stat-label">ناقص</div></div><div class="stat" style="--barcolor:var(--red2)"><div class="stat-num" style="color:var(--red2)">${r.noneCount}</div><div class="stat-label">نداده</div></div></div>`;
  const exp=`<div class="export-row"><button class="btn btn-sm" onclick="hrExportCSV()">📥 CSV</button><button class="btn btn-sm" onclick="hrExportText()">📋 کپی</button></div>`;
  const filt=`<div class="filter-row"><span class="filter-pill ${filter==='all'?'fa':''}" onclick="hrReRender('all')">همه (${r.summary.length})</span><span class="filter-pill ${filter==='done'?'fd':''}" onclick="hrReRender('done')">✅ (${r.doneCount})</span><span class="filter-pill ${filter==='partial'?'fp':''}" onclick="hrReRender('partial')">⚠️ (${r.partialCount})</span><span class="filter-pill ${filter==='none'?'fn':''}" onclick="hrReRender('none')">❌ (${r.noneCount})</span></div><input type="text" id="hrSearch" placeholder="🔎 جستجوی آیدی..." oninput="hrReRender('${filter}',this.value)" value="${esc(search)}" style="margin-bottom:11px;">`;
  let list=r.summary; if(filter!=='all')list=list.filter(u=>u.status===filter); if(search)list=list.filter(u=>u.username.toLowerCase().includes(search.toLowerCase()));
  const users=list.length?list.map(u=>{ const c=u.status==='done'?'var(--green2)':u.status==='partial'?'var(--yellow2)':'var(--red2)'; const bc=u.status==='done'?'badge-done':u.status==='partial'?'badge-partial':'badge-none'; const bt=u.status==='done'?`✅ ${u.count}/${u.total}`:u.status==='partial'?`⚠️ ${u.count}/${u.total}`:'❌ هیچ'; const lk=u.likes>0?`<span class="badge badge-like">❤️ ${u.likes}</span>`:''; const prev=u.text?`<div class="user-meta">${esc(u.text.substring(0,50))}${u.text.length>50?'…':''}</div>`:''; return `<div class="user-card"><div class="user-avatar">👤</div><div class="user-info"><div class="user-name" style="color:${c}">@${esc(u.username)}</div><div class="prog-wrap"><div class="prog-bar" style="width:${u.rate}%;background:${c}"></div></div>${prev}</div><div class="user-badges"><span class="badge ${bc}">${bt}</span>${lk}</div></div>`; }).join(''):'<div class="empty">نتیجه‌ای نیست</div>';
  const posts=r.postResults.map((p,i)=>{ const su=esc(p.url.replace('https://www.instagram.com','')); const din=p.userStatus.filter(u=>u.done).length; return `<div class="post-section"><div class="post-header" onclick="hrTogglePost(${i})"><span>📌</span><span class="post-url-text">${su}</span><span style="font-size:11px;color:var(--green2);">${din}/${r.members.length}</span><span class="chevron" id="hrchev-${i}">▼</span></div><div class="post-body collapsed" id="hrpb-${i}">${p.error?`<div class="sbox sbox-err" style="margin-top:0;">❌ ${esc(p.error)}</div>`:`<div style="font-size:11px;color:var(--text3);margin-bottom:9px;">${p.items.length} ${word}</div>${p.userStatus.map(s=>{const c=s.done?'var(--green2)':'var(--red2)';const prev=s.text?` — <span style="color:var(--text3)">${esc(s.text.substring(0,35))}…</span>`:'';return `<div style="display:flex;align-items:center;gap:7px;padding:5px 0;border-bottom:1px solid rgba(30,41,55,0.4);direction:ltr;font-size:12px;"><span>${s.done?'✅':'❌'}</span><span style="color:${c};font-weight:700">@${esc(s.username)}</span>${prev}</div>`;}).join('')}`}</div></div>`; }).join('');
  wrap.innerHTML = stats+exp+`<div class="card"><div class="card-title"><span class="ico">📊</span> عملکرد اعضا <span class="line"></span></div>${filt}<div>${users}</div></div>`+posts;
}
function hrReRender(f,s){ const w=document.getElementById('results'); if(w._hr)hrRenderResults(w._hr,f,s!==undefined?s:(document.getElementById('hrSearch')?.value||'')); }
function hrTogglePost(i){ document.getElementById('hrpb-'+i).classList.toggle('collapsed'); document.getElementById('hrchev-'+i).classList.toggle('open'); }

function hrRenderHistory(){
  const card=document.getElementById('hrHistoryCard'), list=document.getElementById('hrHistoryList'); if(!card)return;
  if(!HR.history.length){ card.style.display='none'; return; }
  card.style.display='block';
  list.innerHTML=HR.history.map((r,i)=>{ const d=new Date(r.ts); const ds=`${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`; const ml=r.mode==='reply'?'↩️ ریپلای':'💬 کامنت'; return `<div class="user-card" style="cursor:pointer" onclick="hrLoadHistory(${i})"><div class="user-info"><div class="user-name" style="direction:rtl;text-align:right;">${r.urls.length} مورد · ${r.members.length} عضو · ${ml}</div><div class="user-meta mono" style="direction:rtl;text-align:right;">${ds}</div></div><div class="user-badges"><span class="badge badge-done">✅${r.doneCount}</span><span class="badge badge-none">❌${r.noneCount}</span></div></div>`; }).join('');
}
function hrLoadHistory(i){ hrRenderResults(HR.history[i]); document.getElementById('results').scrollIntoView({behavior:'smooth'}); }

function hrExportCSV(){ const r=document.getElementById('results')._hr; if(!r)return; let csv='username,status,done,total,rate,likes\n'; r.summary.forEach(u=>csv+=`${u.username},${u.status},${u.count},${u.total},${u.rate},${u.likes}\n`); const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'})); a.download=`andarzgou_hr_${Date.now()}.csv`; a.click(); }
function hrExportText(){ const r=document.getElementById('results')._hr; if(!r)return; let t=`📊 گزارش پایش - اندرزگو\n${'─'.repeat(30)}\n✅ ${r.doneCount} · ⚠️ ${r.partialCount} · ❌ ${r.noneCount}\n\n`; r.summary.forEach(u=>t+=`${u.status==='done'?'✅':u.status==='partial'?'⚠️':'❌'} @${u.username} — ${u.count}/${u.total} (${u.rate}%)\n`); navigator.clipboard?.writeText(t).then(()=>toast('✅ کپی شد')).catch(()=>alert(t)); }
