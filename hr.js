// ============================================================
//  hr.js — بخش نیروی انسانی (نسخه ۲.۰)
//  + رتبه‌بندی اعضا + هشدار غیرفعال + مقایسه هفتگی
//  + تحلیل کیفیت کامنت + نمودار عملکرد + گزارش هوشمند
// ============================================================

const HR = {
  members: [], history: [], mode: 'comment', lastResult: null,
  alerts: [],
};

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

    <!-- هشدارها -->
    <div id="hrAlertsBox"></div>

    <!-- تب‌های اصلی -->
    <div class="tabs" style="margin-bottom:12px;">
      <button class="tab active" id="hr-tab-scan" onclick="hrSwitchTab('scan')">🔍 پایش</button>
      <button class="tab" id="hr-tab-rank" onclick="hrSwitchTab('rank')">🏆 رتبه‌بندی</button>
      <button class="tab" id="hr-tab-compare" onclick="hrSwitchTab('compare')">📊 مقایسه</button>
      <button class="tab" id="hr-tab-report" onclick="hrSwitchTab('report')">📋 گزارش</button>
    </div>

    <!-- تب پایش -->
    <div id="hr-content-scan">
      <div class="card accent-green">
        <div class="card-title"><span class="ico">🎯</span> نوع پایش</div>
        <div class="mode-row">
          <div class="mode-opt ${HR.mode==='comment'?'active':''}" id="hr-mode-comment" onclick="hrSetMode('comment')"><span class="mode-ico">💬</span>کامنت</div>
          <div class="mode-opt ${HR.mode==='reply'?'active':''}" id="hr-mode-reply" onclick="hrSetMode('reply')"><span class="mode-ico">↩️</span>ریپلای</div>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><span class="ico">🔗</span> <span id="hrLinkLabel">لینک پست‌ها</span></div>
        <textarea id="hrUrls" placeholder="https://www.instagram.com/p/ABC123/&#10;هر لینک در یک خط"></textarea>
        <div class="hint" id="hrLinkHint">هر لینک در یک خط</div>
      </div>
      <div class="card">
        <div class="card-title"><span class="ico">👥</span> اعضا (<span id="hrMemberCount">0</span>)</div>
        <div class="members-wrap" id="hrMembersWrap"></div>
        <input type="text" id="hrMemberInput" placeholder="آیدی (بدون @) — Enter" onkeydown="if(event.key==='Enter'){event.preventDefault();hrAddMember();}" style="margin-bottom:9px;">
        <textarea id="hrBulk" placeholder="چند آیدی یک‌جا (هر خط یا کاما)" style="min-height:56px;"></textarea>
        <div style="display:flex;gap:8px;margin-top:9px;">
          <button class="btn btn-sm" onclick="hrBulkAdd()">➕ گروهی</button>
          <button class="btn btn-sm" onclick="hrClear()">🗑️ پاک</button>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><span class="ico">📄</span> تنظیمات</div>
        <div class="limit-row">
          <label>حداکثر صفحات:</label>
          <select id="hrMaxPages">
            <option value="3">۳ (~۴۵)</option>
            <option value="5" selected>۵ (~۷۵)</option>
            <option value="10">۱۰ (~۱۵۰)</option>
            <option value="20">۲۰ (~۳۰۰)</option>
            <option value="999">همه</option>
          </select>
        </div>
      </div>
      <button class="btn btn-primary" id="hrBtn" onclick="hrRun()">[ START_SCAN ]</button>
      <div style="height:12px"></div>
    </div>

    <!-- تب رتبه‌بندی -->
    <div id="hr-content-rank" style="display:none;">
      <div class="card accent-amber">
        <div class="card-title"><span class="ico">🏆</span> رتبه‌بندی اعضا براساس تاریخچه</div>
        <div id="hrRankList"></div>
        <div class="hint" style="margin-top:8px;">براساس تمام پایش‌های انجام‌شده محاسبه می‌شود</div>
      </div>
    </div>

    <!-- تب مقایسه -->
    <div id="hr-content-compare" style="display:none;">
      <div class="card">
        <div class="card-title"><span class="ico">📊</span> مقایسه پایش‌ها</div>
        <div class="limit-row" style="margin-bottom:12px;">
          <label>پایش اول:</label>
          <select id="hrCmp1"></select>
        </div>
        <div class="limit-row" style="margin-bottom:12px;">
          <label>پایش دوم:</label>
          <select id="hrCmp2"></select>
        </div>
        <button class="btn btn-primary" onclick="hrCompare()">[ COMPARE ]</button>
        <div id="hrCompareResult"></div>
      </div>
    </div>

    <!-- تب گزارش -->
    <div id="hr-content-report" style="display:none;">
      <div class="card">
        <div class="card-title"><span class="ico">📋</span> گزارش هوشمند</div>
        <div class="hint" style="margin-bottom:10px;">تحلیل کلی عملکرد تیم با هوش مصنوعی</div>
        <button class="btn btn-primary" id="hrAIReportBtn" onclick="hrGenerateAIReport()">[ GENERATE_REPORT ]</button>
        <div id="hrAIReportResult"></div>
      </div>
      <div class="card" id="hrHistoryCard" style="display:none;">
        <div class="card-title"><span class="ico">🕒</span> تاریخچه پایش‌ها</div>
        <div id="hrHistoryList"></div>
      </div>
    </div>

    <div id="results"></div>
  `;

  const mp=S.get('hr_maxpages'); if(mp) document.getElementById('hrMaxPages').value=mp;
  document.getElementById('hrMaxPages').onchange=e=>S.set('hr_maxpages',e.target.value);
  hrSetMode(HR.mode);
  hrRenderMembers();
  hrRenderAlerts();
}

function onShow_hr(){ hrCheckSetup(); hrRenderAlerts(); }
function hrCheckSetup(){
  const el=document.getElementById('hrSetupAlert'); if(!el)return;
  if(!APP.worker){ el.innerHTML=`<div class="sbox sbox-warn" style="margin-top:0;margin-bottom:12px;">WORKER_NOT_CONFIGURED${APP.isAdmin?` <button class="btn btn-sm" style="width:100%;margin-top:8px;" onclick="switchTab('setup')">[SETUP]</button>`:''}</div>`; }
  else el.innerHTML='';
}

function hrSwitchTab(t){
  ['scan','rank','compare','report'].forEach(x=>{
    document.getElementById('hr-content-'+x).style.display=x===t?'block':'none';
    document.getElementById('hr-tab-'+x).classList.toggle('active',x===t);
  });
  if(t==='rank') hrRenderRanking();
  if(t==='compare') hrRenderCompareSelects();
  if(t==='report'){ hrRenderHistory(); }
}

function hrSetMode(m){
  HR.mode=m; S.set('hr_mode',m);
  document.getElementById('hr-mode-comment').classList.toggle('active',m==='comment');
  document.getElementById('hr-mode-reply').classList.toggle('active',m==='reply');
  const label=document.getElementById('hrLinkLabel'), hint=document.getElementById('hrLinkHint'), ta=document.getElementById('hrUrls');
  if(m==='comment'){ label.textContent='لینک پست‌ها'; hint.textContent='کامنت زیر پست بررسی می‌شود'; ta.placeholder='https://www.instagram.com/p/ABC123/\nهر لینک در یک خط'; }
  else{ label.textContent='لینک کامنت‌ها'; hint.innerHTML='ریپلای روی کامنت بررسی می‌شود'; ta.placeholder='https://www.instagram.com/p/ABC/c/18xxx/'; }
}

function hrRenderMembers(){
  const wrap=document.getElementById('hrMembersWrap'); if(!wrap)return;
  document.getElementById('hrMemberCount').textContent=HR.members.length;
  wrap.innerHTML=HR.members.length?HR.members.map((m,i)=>`<span class="member-tag"><span>@${esc(m)}</span><span class="remove" onclick="hrRemoveMember(${i})">×</span></span>`).join(''):`<span style="font-family:var(--font-mono);font-size:10px;color:var(--dim);">// NO_MEMBERS</span>`;
}
function hrAddMember(){ const v=document.getElementById('hrMemberInput').value.trim().replace(/^@/,''); if(v&&!HR.members.includes(v)){HR.members.push(v);S.set('hr_members',HR.members);hrRenderMembers();} document.getElementById('hrMemberInput').value=''; }
function hrBulkAdd(){ document.getElementById('hrBulk').value.split(/[\n,،\s]+/).map(u=>u.trim().replace(/^@/,'')).filter(Boolean).forEach(u=>{if(!HR.members.includes(u))HR.members.push(u);}); document.getElementById('hrBulk').value=''; S.set('hr_members',HR.members); hrRenderMembers(); }
function hrRemoveMember(i){ HR.members.splice(i,1); S.set('hr_members',HR.members); hrRenderMembers(); }
function hrClear(){ if(confirm('همه اعضا پاک شوند؟')){ HR.members=[]; S.set('hr_members',HR.members); hrRenderMembers(); } }

// —— هشدارهای خودکار ——
function hrCheckAlerts(){
  if(!HR.history.length) return;
  const alerts=[];
  const lastScan=HR.history[0];
  const threeDaysAgo=Date.now()-3*24*60*60*1000;

  // هشدار غیرفعالی
  lastScan.summary.filter(u=>u.status==='none').forEach(u=>{
    // چک کن آیا در پایش‌های قبلی هم غیرفعال بوده
    const prevScans=HR.history.slice(1,4);
    const alwaysInactive=prevScans.every(s=>s.summary.find(x=>x.username===u.username)?.status==='none');
    if(alwaysInactive && prevScans.length>=2){
      alerts.push({type:'inactive',user:u.username,msg:`@${u.username} در ${prevScans.length+1} پایش متوالی غیرفعال بوده`});
    }
  });

  // هشدار کاهش فعالیت
  if(HR.history.length>=2){
    const prev=HR.history[1];
    const drop=prev.doneCount-lastScan.doneCount;
    if(drop>2) alerts.push({type:'drop',msg:`${drop} نفر کمتر از پایش قبل فعالیت داشتن`});
  }

  HR.alerts=alerts; S.set('hr_alerts',alerts);
}

function hrRenderAlerts(){
  const box=document.getElementById('hrAlertsBox'); if(!box)return;
  hrCheckAlerts();
  if(!HR.alerts.length){ box.innerHTML=''; return; }
  box.innerHTML=HR.alerts.map(a=>`<div class="sbox sbox-warn" style="margin-bottom:8px;">⚠️ ${esc(a.msg)}</div>`).join('');
}

// —— پایش اصلی ——
async function hrFetchComments(postUrl){
  const maxPages=parseInt(document.getElementById('hrMaxPages').value||'5');
  let all=[],cursor=null,page=0;
  while(page<maxPages){page++;let u=`https://api.scrapecreators.com/v2/instagram/post/comments?url=${encodeURIComponent(postUrl)}`;if(cursor)u+=`&cursor=${encodeURIComponent(cursor)}`;log(`PAGE ${page}...`);const data=await scFetch(u);const c=data.comments||[];all=all.concat(c);if(!data.cursor||c.length===0)break;cursor=data.cursor;await new Promise(r=>setTimeout(r,400));}
  return all;
}
async function hrFetchReplies(commentUrl){
  const maxPages=parseInt(document.getElementById('hrMaxPages').value||'5');
  let all=[],cursor=null,page=0;
  while(page<maxPages){page++;let u=`https://api.scrapecreators.com/v1/instagram/comment/replies?url=${encodeURIComponent(commentUrl)}`;if(cursor)u+=`&cursor=${encodeURIComponent(cursor)}`;log(`PAGE ${page}...`);const data=await scFetch(u);const c=data.replies||data.comments||[];all=all.concat(c);if(!data.cursor||c.length===0)break;cursor=data.cursor;await new Promise(r=>setTimeout(r,400));}
  return all;
}

async function hrRun(){
  const urls=document.getElementById('hrUrls').value.split(/\n/).map(u=>u.trim()).filter(u=>u.includes('instagram.com'));
  if(!urls.length){ alert('حداقل یک لینک وارد کنید'); return; }
  if(!HR.members.length){ alert('ابتدا اعضا را اضافه کنید'); return; }
  if(!APP.worker){ if(APP.isAdmin)switchTab('setup'); else alert('Worker تنظیم نشده'); return; }
  const btn=document.getElementById('hrBtn'); btn.disabled=true; btn.innerHTML='<span class="spinner"></span> SCANNING...';
  clearLog(); document.getElementById('results').innerHTML='';
  const postResults=[]; let totalItems=0;
  for(const url of urls){
    const id=url.match(/\/(p|reel|c)\/([^/?]+)/)?.[2]||'...'; log(`━━━ ${id} ━━━`,'gold');
    try{
      const items=HR.mode==='comment'?await hrFetchComments(url):await hrFetchReplies(url);
      totalItems+=items.length; log(`✓ ${items.length}`,'ok');
      const map={};
      items.forEach(c=>{
        const u=(c.user?.username||c.ownerUsername||c.owner?.username||'').toLowerCase();
        if(u&&!map[u])map[u]={
          text:c.text,
          likes:c.comment_like_count||c.likesCount||0,
          length:(c.text||'').length,
          hasEmoji:/[\u{1F300}-\u{1F9FF}]/u.test(c.text||''),
        };
      });
      postResults.push({url,items,userStatus:HR.members.map(u=>({
        username:u,done:!!map[u.toLowerCase()],
        text:map[u.toLowerCase()]?.text||null,
        likes:map[u.toLowerCase()]?.likes||0,
        length:map[u.toLowerCase()]?.length||0,
        hasEmoji:map[u.toLowerCase()]?.hasEmoji||false,
      })),error:null});
    }catch(e){
      log('ERR: '+e.message,'err');
      postResults.push({url,items:[],userStatus:HR.members.map(u=>({username:u,done:false,text:null,likes:0,length:0,hasEmoji:false})),error:e.message});
    }
  }

  const summary=HR.members.map(u=>{
    let cc=0,tl=0,lc=null,totalLen=0,emojiCount=0;
    postResults.forEach(pp=>{
      const s=pp.userStatus.find(x=>x.username===u);
      if(s?.done){cc++;tl+=s.likes;if(!lc)lc=s.text;totalLen+=s.length;if(s.hasEmoji)emojiCount++;}
    });
    const rate=Math.round(cc/urls.length*100);
    const avgLen=cc>0?Math.round(totalLen/cc):0;
    const quality=avgLen>30?'high':avgLen>10?'medium':'low';
    return {username:u,count:cc,total:urls.length,rate,status:rate===100?'done':rate>0?'partial':'none',likes:tl,text:lc,avgLen,emojiCount,quality};
  });

  const doneCount=summary.filter(u=>u.status==='done').length;
  const partialCount=summary.filter(u=>u.status==='partial').length;
  const noneCount=summary.filter(u=>u.status==='none').length;
  const avgRate=Math.round(summary.reduce((a,u)=>a+u.rate,0)/summary.length);

  const result={postResults,summary,doneCount,partialCount,noneCount,avgRate,urls,members:[...HR.members],mode:HR.mode,ts:Date.now()};
  HR.lastResult=result; HR.history.unshift(result); if(HR.history.length>20)HR.history.pop(); S.set('hr_history',HR.history);
  sendReport('hr',HR.mode==='comment'?'پایش کامنت':'پایش ریپلای',{items:totalItems,posts:urls.length,done:doneCount});
  hrRenderResults(result); hrRenderAlerts();
  btn.disabled=false; btn.innerHTML='[ START_SCAN ]'; log('SCAN_COMPLETE','ok');
}

// —— رندر نتایج ——
function hrRenderResults(r,filter='all',search=''){
  const wrap=document.getElementById('results'); wrap._hr=r;
  const participationBar=`<div style="margin-bottom:14px;"><div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:9px;color:var(--dim);margin-bottom:4px;"><span>PARTICIPATION_RATE</span><span>${r.avgRate||0}%</span></div><div style="height:3px;background:var(--border2);"><div style="width:${r.avgRate||0}%;height:100%;background:${(r.avgRate||0)>=80?'var(--green)':(r.avgRate||0)>=50?'#ffb700':'var(--red)'};" ></div></div></div>`;
  const stats=`<div class="stats-row"><div class="stat" style="--barcolor:#ffb700"><div class="stat-num" style="color:#ffb700">${r.members.length}</div><div class="stat-label">TOTAL</div></div><div class="stat" style="--barcolor:#00ff41"><div class="stat-num" style="color:#00ff41">${r.doneCount}</div><div class="stat-label">ACTIVE</div></div><div class="stat" style="--barcolor:#ffb700"><div class="stat-num" style="color:#ffb700">${r.partialCount}</div><div class="stat-label">PARTIAL</div></div><div class="stat" style="--barcolor:#ff2222"><div class="stat-num" style="color:#ff4444">${r.noneCount}</div><div class="stat-label">INACTIVE</div></div></div>`;
  const exp=`<div class="export-row"><button class="btn btn-sm" onclick="hrExportCSV()">📥 CSV</button><button class="btn btn-sm" onclick="hrExportText()">📋 COPY</button></div>`;
  const filt=`<div class="filter-row"><span class="filter-pill ${filter==='all'?'fa':''}" onclick="hrReRender('all')">ALL (${r.summary.length})</span><span class="filter-pill ${filter==='done'?'fd':''}" onclick="hrReRender('done')">✅ (${r.doneCount})</span><span class="filter-pill ${filter==='partial'?'fp':''}" onclick="hrReRender('partial')">⚠️ (${r.partialCount})</span><span class="filter-pill ${filter==='none'?'fn':''}" onclick="hrReRender('none')">❌ (${r.noneCount})</span></div><input type="text" id="hrSearch" placeholder="// SEARCH_USERNAME..." oninput="hrReRender('${filter}',this.value)" value="${esc(search)}" style="margin-bottom:10px;direction:ltr;">`;

  let list=r.summary;
  if(filter!=='all')list=list.filter(u=>u.status===filter);
  if(search)list=list.filter(u=>u.username.toLowerCase().includes(search.toLowerCase()));
  list=[...list].sort((a,b)=>b.rate-a.rate);

  const qualityColor={high:'var(--green)',medium:'#ffb700',low:'var(--red)'};
  const users=list.length?list.map((u,rank)=>{
    const c=u.status==='done'?'var(--green)':u.status==='partial'?'#ffb700':'var(--red)';
    const qc=qualityColor[u.quality]||'var(--dim)';
    const prev=u.text?`<div class="user-meta" style="direction:rtl;text-align:right;">${esc(u.text.substring(0,45))}${u.text.length>45?'…':''}</div>`:'';
    const qualBadge=u.done?`<span class="badge" style="border:1px solid ${qc};color:${qc};font-size:8px;">${u.quality.toUpperCase()}</span>`:'';
    const likeBadge=u.likes>0?`<span class="badge badge-like">❤️${u.likes}</span>`:'';
    const rankBadge=rank===0&&u.status==='done'?'<span class="badge" style="border:1px solid #ffb700;color:#ffb700;">🥇</span>':rank===1&&u.status==='done'?'<span class="badge" style="border:1px solid #aaa;color:#aaa;">🥈</span>':'';
    return `<div class="user-card" style="border-left-color:${c}">
      <div class="user-avatar" style="font-family:var(--font-mono);font-size:10px;color:var(--dim);">${String(rank+1).padStart(2,'0')}</div>
      <div class="user-info">
        <div class="user-name" style="color:${c};direction:ltr;">@${esc(u.username)}</div>
        <div class="prog-wrap"><div class="prog-bar" style="width:${u.rate}%;background:${c}"></div></div>
        ${prev}
      </div>
      <div class="user-badges">${rankBadge}${qualBadge}${likeBadge}<span class="badge" style="border:1px solid var(--border3);color:var(--dim);font-size:9px;">${u.count}/${u.total}</span></div>
    </div>`;
  }).join(''):'<div class="empty">NO_RESULTS</div>';

  const posts=r.postResults.map((pp,i)=>{
    const su=esc(pp.url.replace('https://www.instagram.com',''));
    const din=pp.userStatus.filter(u=>u.done).length;
    const pct=Math.round(din/r.members.length*100);
    const barC=pct>=80?'var(--green)':pct>=50?'#ffb700':'var(--red)';
    return `<div class="post-section"><div class="post-header" onclick="hrTogglePost(${i})">
      <span style="font-family:var(--font-mono);font-size:9px;color:var(--dim);">${String(i+1).padStart(2,'0')}</span>
      <span class="post-url-text">${su}</span>
      <span style="font-family:var(--font-mono);font-size:9px;color:${barC};">${din}/${r.members.length} (${pct}%)</span>
      <span class="chevron" id="hrchev-${i}">▼</span>
    </div>
    <div class="post-body collapsed" id="hrpb-${i}">
      ${pp.error?`<div class="sbox sbox-err" style="margin-top:0;">ERR: ${esc(pp.error)}</div>`:`
      <div style="margin-bottom:8px;"><div style="height:2px;background:var(--border2);"><div style="width:${pct}%;height:100%;background:${barC};"></div></div></div>
      ${pp.userStatus.map(s=>{
        const sc=s.done?'var(--green)':'var(--red)';
        const preview=s.text?` <span style="color:var(--dim);font-size:10px;">${esc(s.text.substring(0,35))}…</span>`:'';
        const qInfo=s.done&&s.avgLen?` <span style="color:var(--dim);font-size:9px;">[${s.length}ch]</span>`:'';
        return `<div style="display:flex;align-items:center;gap:7px;padding:5px 0;border-bottom:1px solid var(--border2);direction:ltr;font-size:11px;font-family:var(--font-mono);">
          <span style="color:${sc};">${s.done?'[OK]':'[--]'}</span>
          <span style="color:${sc};font-weight:700">@${esc(s.username)}</span>${qInfo}${preview}
        </div>`;
      }).join('')}`}
    </div></div>`;
  }).join('');

  wrap.innerHTML=`<div class="card accent-green">
    <div class="card-title"><span class="ico">📡</span> SCAN_RESULTS // ${new Date(r.ts).toLocaleString('fa-IR')}</div>
    ${participationBar}${stats}${exp}
    <div style="margin-top:12px;">${filt}<div>${users}</div></div>
  </div>${posts}`;
}

function hrReRender(f,s){ const w=document.getElementById('results'); if(w._hr)hrRenderResults(w._hr,f,s!==undefined?s:(document.getElementById('hrSearch')?.value||'')); }
function hrTogglePost(i){ document.getElementById('hrpb-'+i).classList.toggle('collapsed'); document.getElementById('hrchev-'+i).classList.toggle('open'); }

// —— رتبه‌بندی کلی ——
function hrRenderRanking(){
  const box=document.getElementById('hrRankList'); if(!box)return;
  if(!HR.history.length){ box.innerHTML='<div class="empty">ابتدا حداقل یک پایش انجام دهید</div>'; return; }

  const scores={};
  HR.history.forEach(scan=>{
    scan.summary.forEach(u=>{
      if(!scores[u.username]) scores[u.username]={scans:0,totalRate:0,done:0,partial:0,none:0};
      scores[u.username].scans++;
      scores[u.username].totalRate+=u.rate;
      scores[u.username][u.status]++;
    });
  });

  const ranked=Object.entries(scores)
    .map(([name,s])=>({name,avg:Math.round(s.totalRate/s.scans),scans:s.scans,done:s.done,none:s.none}))
    .sort((a,b)=>b.avg-a.avg);

  const medals=['🥇','🥈','🥉'];
  box.innerHTML=ranked.map((u,i)=>{
    const c=u.avg>=80?'var(--green)':u.avg>=50?'#ffb700':'var(--red)';
    return `<div class="user-card" style="border-left-color:${c}">
      <div class="user-avatar" style="font-size:16px;">${medals[i]||String(i+1).padStart(2,'0')}</div>
      <div class="user-info">
        <div class="user-name" style="color:${c};direction:ltr;">@${esc(u.name)}</div>
        <div class="prog-wrap"><div class="prog-bar" style="width:${u.avg}%;background:${c}"></div></div>
        <div class="user-meta" style="direction:ltr;">AVG: ${u.avg}% // SCANS: ${u.scans} // ACTIVE: ${u.done}x</div>
      </div>
      <span class="badge" style="border:1px solid ${c};color:${c};font-size:12px;padding:6px 10px;">${u.avg}%</span>
    </div>`;
  }).join('');
}

// —— مقایسه دو پایش ——
function hrRenderCompareSelects(){
  const sel1=document.getElementById('hrCmp1'), sel2=document.getElementById('hrCmp2');
  if(!sel1||!sel2)return;
  const opts=HR.history.map((r,i)=>`<option value="${i}">${new Date(r.ts).toLocaleDateString('fa-IR')} (${r.urls.length} پست)</option>`).join('');
  sel1.innerHTML=opts; sel2.innerHTML=opts;
  if(HR.history.length>=2) sel2.value='1';
}

function hrCompare(){
  const i1=parseInt(document.getElementById('hrCmp1').value);
  const i2=parseInt(document.getElementById('hrCmp2').value);
  const r1=HR.history[i1], r2=HR.history[i2];
  if(!r1||!r2||i1===i2){ alert('دو پایش متفاوت انتخاب کنید'); return; }
  const box=document.getElementById('hrCompareResult');
  const d1=new Date(r1.ts).toLocaleDateString('fa-IR');
  const d2=new Date(r2.ts).toLocaleDateString('fa-IR');

  const rows=HR.members.map(u=>{
    const s1=r1.summary.find(x=>x.username===u), s2=r2.summary.find(x=>x.username===u);
    if(!s1||!s2)return'';
    const diff=s1.rate-s2.rate;
    const arrow=diff>0?`<span style="color:var(--green)">▲${diff}%</span>`:diff<0?`<span style="color:var(--red)">▼${Math.abs(diff)}%</span>`:`<span style="color:var(--dim)">━</span>`;
    return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border2);font-family:var(--font-mono);font-size:11px;direction:ltr;">
      <span style="min-width:120px;color:var(--white);">@${esc(u)}</span>
      <span style="color:${s2.rate>=80?'var(--green)':s2.rate>=50?'#ffb700':'var(--red)'};">${s2.rate}%</span>
      <span style="color:var(--dim);">→</span>
      <span style="color:${s1.rate>=80?'var(--green)':s1.rate>=50?'#ffb700':'var(--red)'};">${s1.rate}%</span>
      ${arrow}
    </div>`;
  }).join('');

  const overallDiff=r1.doneCount-r2.doneCount;
  box.innerHTML=`<div class="ai-box" style="margin-top:12px;">
    <h4 style="color:#00d4ff;">// COMPARE: ${d2} → ${d1}</h4>
    <div style="display:flex;gap:10px;margin-bottom:12px;font-family:var(--font-mono);font-size:10px;">
      <span style="color:var(--dim);">ACTIVE:</span>
      <span style="color:#ffb700;">${r2.doneCount}</span>
      <span style="color:var(--dim);">→</span>
      <span style="color:var(--green);">${r1.doneCount}</span>
      <span style="color:${overallDiff>=0?'var(--green)':'var(--red)'};">${overallDiff>=0?'▲+':'▼'}${Math.abs(overallDiff)}</span>
    </div>
    ${rows}
  </div>`;
}

// —— گزارش هوشمند AI ——
async function hrGenerateAIReport(){
  if(!HR.history.length){ alert('ابتدا حداقل یک پایش انجام دهید'); return; }
  if(!APP.worker){ alert('Worker تنظیم نشده'); return; }
  const btn=document.getElementById('hrAIReportBtn'); btn.disabled=true; btn.innerHTML='<span class="spinner"></span> GENERATING...';
  const box=document.getElementById('hrAIReportResult');
  if(window.showTransmissionNoise) window.showTransmissionNoise();
  try{
    const recent=HR.history.slice(0,5);
    const stats=HR.members.map(u=>{
      const data=recent.map(r=>r.summary.find(x=>x.username===u));
      const rates=data.filter(Boolean).map(d=>d.rate);
      const avg=rates.length?Math.round(rates.reduce((a,b)=>a+b,0)/rates.length):0;
      const trend=rates.length>=2?(rates[0]-rates[rates.length-1]>0?'بهبود':'کاهش'):'—';
      return `@${u}: میانگین ${avg}% (${trend})`;
    }).join('\n');
    const sys='تو مسئول ارزیابی عملکرد تیم هستی. گزارش حرفه‌ای و مختصر فارسی بده.';
    const usr=`آمار عملکرد ${HR.members.length} عضو تیم در ${recent.length} پایش اخیر:\n${stats}\n\nتحلیل کن:\n۱) بهترین و ضعیف‌ترین عضو\n۲) روند کلی تیم\n۳) اعضایی که نیاز به پیگیری دارن\n۴) پیشنهاد عملی`;
    const raw=await groqChat('monitor',[{role:'system',content:sys},{role:'user',content:usr}],{temperature:0.5,max_tokens:1500});
    if(window.hideTransmissionNoise) window.hideTransmissionNoise();
    box.innerHTML=`<div class="ai-box" style="direction:rtl;text-align:right;margin-top:12px;"><h4 style="color:#ffb700;">// AI_PERFORMANCE_REPORT</h4>${esc(raw).replace(/\n/g,'<br>')}</div>`;
  }catch(e){
    if(window.hideTransmissionNoise) window.hideTransmissionNoise();
    box.innerHTML=`<div class="sbox sbox-err">ERR: ${esc(e.message)}</div>`;
  }
  btn.disabled=false; btn.innerHTML='[ GENERATE_REPORT ]';
}

// —— تاریخچه ——
function hrRenderHistory(){
  const card=document.getElementById('hrHistoryCard'), list=document.getElementById('hrHistoryList'); if(!card)return;
  if(!HR.history.length){ card.style.display='none'; return; }
  card.style.display='block';
  list.innerHTML=HR.history.map((r,i)=>{
    const d=new Date(r.ts);
    const ml=r.mode==='reply'?'REPLY':'COMMENT';
    return `<div class="user-card" style="cursor:pointer" onclick="hrLoadHistory(${i})">
      <div class="user-info">
        <div class="user-name" style="direction:ltr;font-size:11px;">${r.urls.length} POST // ${r.members.length} MEMBER // ${ml}</div>
        <div class="user-meta mono">${d.toLocaleString('fa-IR')}</div>
      </div>
      <div class="user-badges">
        <span class="badge badge-done">${r.doneCount}✅</span>
        <span class="badge badge-none">${r.noneCount}❌</span>
      </div>
    </div>`;
  }).join('');
}
function hrLoadHistory(i){ hrRenderResults(HR.history[i]); hrSwitchTab('scan'); document.getElementById('results').scrollIntoView({behavior:'smooth'}); }

function hrExportCSV(){
  const r=document.getElementById('results')._hr; if(!r)return;
  let csv='username,status,done,total,rate,likes,avg_length,quality\n';
  r.summary.forEach(u=>csv+=`${u.username},${u.status},${u.count},${u.total},${u.rate},${u.likes},${u.avgLen||0},${u.quality||''}\n`);
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'})); a.download=`hr_scan_${Date.now()}.csv`; a.click();
}
function hrExportText(){
  const r=document.getElementById('results')._hr; if(!r)return;
  let t=`ANDARZGOU // HR_SCAN_REPORT\n${'═'.repeat(40)}\nTIME: ${new Date(r.ts).toLocaleString('fa-IR')}\nPARTICIPATION: ${r.avgRate||0}%\nACTIVE: ${r.doneCount} / PARTIAL: ${r.partialCount} / INACTIVE: ${r.noneCount}\n${'─'.repeat(40)}\n`;
  r.summary.sort((a,b)=>b.rate-a.rate).forEach(u=>t+=`${u.status==='done'?'[OK]':u.status==='partial'?'[~~]':'[--]'} @${u.username.padEnd(20)} ${u.rate}% (${u.count}/${u.total})\n`);
  navigator.clipboard?.writeText(t).then(()=>toast('COPIED')).catch(()=>alert(t));
}
