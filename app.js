const BASE='https://raw.githubusercontent.com/jeanc0071/projet/agent/refresh-stability/.project-control/';
const SOURCES={status:'current-status.json',tasks:'tasks.json',validations:'validations.json'};
let allTasks=[];
const $=id=>document.getElementById(id);
const labels={completed:'Terminée',to_validate:'À valider',in_progress:'En cours',blocked:'Bloquée',planned:'Planifiée'};
const esc=value=>String(value??'—').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const pct=n=>`${Math.round((Number(n)||0)*100)}%`;
const date=value=>{if(!value)return'—';const d=new Date(value);return Number.isNaN(d.valueOf())?value:new Intl.DateTimeFormat('fr-FR',{dateStyle:'medium',timeStyle:'short'}).format(d)};
async function getJson(name){const r=await fetch(BASE+name,{cache:'no-store'});if(!r.ok)throw new Error(`${name}: HTTP ${r.status}`);return r.json()}
function renderTasks(filter='active'){
 const list=filter==='all'?allTasks:filter==='active'?allTasks.filter(t=>t.status!=='completed'):allTasks.filter(t=>t.status===filter);
 $('tasks').innerHTML=list.length?list.map(t=>`<article class="task"><div class="task-top"><h3>${esc(t.title)}</h3><span class="status">${esc(labels[t.status]||t.status)}</span></div><div class="bar"><span style="width:${pct(t.progress)}"></span></div><small>${pct(t.progress)} · ${esc(t.owner||'Non affecté')}</small>${t.currentAction?`<p><strong>Maintenant :</strong> ${esc(t.currentAction)}</p>`:''}${t.nextAction?`<p><strong>Ensuite :</strong> ${esc(t.nextAction)}</p>`:''}</article>`).join(''):'<article class="task">Aucune tâche dans ce filtre.</article>';
}
async function load(){
 const banner=$('connection');banner.className='banner loading';banner.textContent='Chargement du dernier snapshot GitHub…';$('refresh').disabled=true;
 try{
  const [status,tasksData,validationsData]=await Promise.all([getJson(SOURCES.status),getJson(SOURCES.tasks),getJson(SOURCES.validations).catch(()=>({validations:[]}))]);
  allTasks=Array.isArray(tasksData.tasks)?tasksData.tasks:[];
  const completed=allTasks.filter(t=>t.status==='completed').length;
  const validate=allTasks.filter(t=>t.status==='to_validate').length;
  const blocked=allTasks.filter(t=>t.status==='blocked').length;
  const weightedTotal=allTasks.reduce((s,t)=>s+(Number(t.weight)||1),0);
  const weightedDone=allTasks.reduce((s,t)=>s+(Number(t.weight)||1)*(Number(t.progress)||0),0);
  const progress=weightedTotal?weightedDone/weightedTotal:0;
  $('statusBadge').textContent=labels[status.status]||status.status||'—';$('objective').textContent=status.objective||'—';$('currentAction').textContent=status.currentAction||'—';$('nextAction').textContent=status.nextAction||'—';$('milestone').textContent=status.milestone||'—';$('updatedAt').textContent=date(status.updatedAt||status.lastProgressAt);$('globalProgress').textContent=pct(progress);$('taskCount').textContent=allTasks.length;$('completedCount').textContent=completed;$('validationCount').textContent=validate;$('blockedCount').textContent=blocked;
  renderTasks($('statusFilter').value);
  const validationInfo=Array.isArray(validationsData.validations)?` · ${validationsData.validations.length} validations enregistrées`:'';
  banner.className='banner ok';banner.textContent=`Snapshot GitHub chargé${validationInfo} · ${date(new Date().toISOString())}`;
 }catch(error){banner.className='banner error';banner.textContent=`Impossible de charger les snapshots : ${error.message}`;$('tasks').innerHTML='<article class="task">Les données restent disponibles dans le dépôt source. Réessaye avec le bouton ↻.</article>'}
 finally{$('refresh').disabled=false}
}
$('statusFilter').addEventListener('change',e=>renderTasks(e.target.value));$('refresh').addEventListener('click',load);load();
