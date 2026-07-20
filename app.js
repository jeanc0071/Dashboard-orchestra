let allTasks=[];
let refreshTimer=null;
const REFRESH_INTERVAL_MS=60000;
const SNAPSHOT_CACHE_KEY='orkestra:last-snapshot';
const $=id=>document.getElementById(id);
const labels={completed:'Terminée',to_validate:'À valider',in_progress:'En cours',blocked:'Bloquée',planned:'Planifiée'};
const esc=value=>String(value??'—').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const pct=n=>`${Math.round((Number(n)||0)*100)}%`;
const date=value=>{if(!value)return'—';const d=new Date(value);return Number.isNaN(d.valueOf())?value:new Intl.DateTimeFormat('fr-FR',{dateStyle:'medium',timeStyle:'short'}).format(d)};
function renderTasks(filter='active'){
 const list=filter==='all'?allTasks:filter==='active'?allTasks.filter(t=>t.status!=='completed'):allTasks.filter(t=>t.status===filter);
 $('tasks').innerHTML=list.length?list.map(t=>`<article class="task"><div class="task-top"><h3>${esc(t.title)}</h3><span class="status">${esc(labels[t.status]||t.status)}</span></div><div class="bar"><span style="width:${pct(t.progress)}"></span></div><small>${pct(t.progress)} · ${esc(t.owner||'Non affecté')}</small>${t.currentAction?`<p><strong>Maintenant :</strong> ${esc(t.currentAction)}</p>`:''}${t.nextAction?`<p><strong>Ensuite :</strong> ${esc(t.nextAction)}</p>`:''}</article>`).join(''):'<article class="task">Aucune tâche dans ce filtre.</article>';
}
function renderSnapshot(snapshot,{offline=false}={}){
 const status=snapshot.status||{};
 allTasks=Array.isArray(snapshot.tasks)?snapshot.tasks:[];
 const completed=allTasks.filter(t=>t.status==='completed').length;
 const validate=allTasks.filter(t=>t.status==='to_validate').length;
 const blocked=allTasks.filter(t=>t.status==='blocked').length;
 const weightedTotal=allTasks.reduce((s,t)=>s+(Number(t.weight)||1),0);
 const weightedDone=allTasks.reduce((s,t)=>s+(Number(t.weight)||1)*(Number(t.progress)||0),0);
 const progress=weightedTotal?weightedDone/weightedTotal:0;
 $('statusBadge').textContent=labels[status.status]||status.status||'—';
 $('objective').textContent=status.objective||'—';
 $('currentAction').textContent=status.currentAction||'—';
 $('nextAction').textContent=status.nextAction||'—';
 $('milestone').textContent=status.milestone||'—';
 $('updatedAt').textContent=date(status.updatedAt||status.lastProgressAt||snapshot.generatedAt);
 $('globalProgress').textContent=pct(progress);
 $('taskCount').textContent=allTasks.length;
 $('completedCount').textContent=completed;
 $('validationCount').textContent=validate;
 $('blockedCount').textContent=blocked;
 renderTasks($('statusFilter').value);
 const banner=$('connection');
 banner.className=offline?'banner loading':'banner ok';
 banner.textContent=offline
  ?`Mode hors ligne · dernier snapshot connu du ${date(snapshot.generatedAt)}`
  :`Snapshot publié chargé · ${snapshot.validationsCount||0} validations · actualisé ${date(snapshot.generatedAt)}`;
}
function readCachedSnapshot(){
 try{return JSON.parse(localStorage.getItem(SNAPSHOT_CACHE_KEY)||'null')}catch{return null}
}
function cacheSnapshot(snapshot){
 try{localStorage.setItem(SNAPSHOT_CACHE_KEY,JSON.stringify(snapshot))}catch{}
}
async function load({silent=false}={}){
 const banner=$('connection');
 if(!silent){banner.className='banner loading';banner.textContent='Chargement du dernier snapshot publié…'}
 $('refresh').disabled=true;
 try{
  const response=await fetch(`./data/snapshot.json?v=${Date.now()}`,{cache:'no-store'});
  if(!response.ok)throw new Error(`snapshot.json : HTTP ${response.status}`);
  const snapshot=await response.json();
  cacheSnapshot(snapshot);
  renderSnapshot(snapshot);
 }catch(error){
  const cached=readCachedSnapshot();
  if(cached){renderSnapshot(cached,{offline:true})}
  else{
   banner.className='banner error';
   banner.textContent=`Impossible de charger le snapshot publié : ${error.message}`;
   $('tasks').innerHTML='<article class="task">Aucune donnée locale disponible. Recharge la page quand la connexion sera rétablie.</article>';
  }
 }finally{$('refresh').disabled=false}
}
function scheduleRefresh(){
 clearInterval(refreshTimer);
 refreshTimer=setInterval(()=>{if(!document.hidden)load({silent:true})},REFRESH_INTERVAL_MS);
}
$('statusFilter').addEventListener('change',e=>renderTasks(e.target.value));
$('refresh').addEventListener('click',()=>load());
document.addEventListener('visibilitychange',()=>{if(!document.hidden)load({silent:true})});
window.addEventListener('online',()=>load({silent:true}));
if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').catch(()=>{})}
const cached=readCachedSnapshot();
if(cached)renderSnapshot(cached,{offline:true});
load();
scheduleRefresh();
