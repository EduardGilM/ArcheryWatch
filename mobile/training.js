// Extensiones de entrenamiento; el movil es visor: todos los controles viven en el menu del reloj.
const $ = id => document.getElementById(id), escapeText = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
document.head.insertAdjacentHTML('beforeend',`<style>
.training{border-top:1px solid var(--line);padding:14px 0;line-height:1.6;font-size:12px;color:var(--dim)}
.training select{background:var(--panel2);color:var(--txt);border:1px solid var(--line);border-radius:10px;padding:8px;font:inherit;max-width:100%}
.training label{display:block;margin:8px 0}.training b{color:var(--txt)}
.picker{margin-top:10px}
.pickRow{display:flex;justify-content:space-between;align-items:center;width:100%;background:var(--panel2);color:var(--txt);border:1px solid var(--line);border-radius:12px;padding:13px 14px;font:inherit;font-size:14px;cursor:pointer;min-height:48px}
.pickRow b{color:var(--acc);font-weight:600}
.sheet{display:flex;flex-direction:column;gap:6px;margin-top:6px}
.sheet[hidden]{display:none}
.sheet button{display:flex;justify-content:space-between;background:var(--panel);color:var(--txt);border:1px solid var(--line);border-radius:12px;padding:13px 14px;font:inherit;font-size:14px;cursor:pointer;min-height:48px;text-align:left}
.sheet button.on{border-color:var(--acc);color:var(--acc);font-weight:700}
.addItem{display:flex;gap:6px;margin-top:2px}
.addItem input{flex:1;background:var(--panel2);color:var(--txt);border:1px solid var(--line);border-radius:12px;padding:11px;font:inherit;min-height:44px}
.addItem button{background:#3c2c1c;color:var(--acc);border:1px solid #5a4028;border-radius:12px;padding:11px 16px;font:inherit;font-weight:700;cursor:pointer;min-height:44px}
#trainingStatus{font-size:15px;color:var(--txt)}#notice{position:fixed;bottom:78px;left:14px;right:14px;z-index:20;padding:12px;background:#302619;color:#ffdcad;border-radius:12px;font-size:12px}
</style>`);
$('vSession').insertAdjacentHTML('afterbegin',`<section class="training" id="trainingPanel"><div id="trainingStatus">Prepara tu entrenamiento</div>
<div class="picker" id="modePicker">
<button class="pickRow" id="modeRow"><span>Modo</span><b id="modeVal">–</b></button>
<div class="sheet" id="modeSheet" hidden>
<button data-v="Indoor">Indoor<span>3 flechas</span></button>
<button data-v="Outdoor">Outdoor<span>6 flechas</span></button>
<button data-v="Libre">Libre<span>sin tope</span></button>
</div></div>
<div class="picker" id="bowPicker">
<button class="pickRow" id="bowRow"><span>Arco</span><b id="bowVal">–</b></button>
<div class="sheet" id="bowSheet" hidden><div id="bowList"></div>
<div class="addItem"><input id="bowName" placeholder="Nombre del arco" maxlength="24"><button id="bowAdd">Añadir</button></div></div>
</div>
<div class="picker" id="arrowPicker">
<button class="pickRow" id="arrowRow"><span>Flechas</span><b id="arrowVal">–</b></button>
<div class="sheet" id="arrowSheet" hidden><div id="arrowList"></div>
<div class="addItem"><input id="arrowName" placeholder="Nombre de las flechas" maxlength="24"><button id="arrowAdd">Añadir</button></div></div>
</div></section>`);
$('vSet').insertAdjacentHTML('beforeend',`<section class="training"><div id="setState"></div></section>`);
$('vShot').insertAdjacentHTML('beforeend',`<section class="training"><div id="shotContext"></div><label>Comparar con <select id="compareShot" onchange="render()"><option value="">Ninguna</option></select></label><div id="comparison"></div></section>`);
$('vProgress').insertAdjacentHTML('afterbegin',`<section class="training"><label>Equipo y métrica <select id="progressProfile" onchange="renderProgress()"></select></label><div id="volume"></div></section>`);
document.body.insertAdjacentHTML('beforeend','<div id="notice" role="status" hidden></div>');
const gear={get:()=>{try{const g=JSON.parse(localStorage.getItem('awGear'));return {bows:Array.isArray(g?.bows)?g.bows:[],arrows:Array.isArray(g?.arrows)?g.arrows:[]};}catch(e){return {bows:[],arrows:[]};}},
  save:g=>localStorage.setItem('awGear',JSON.stringify(g))};
function closeSheets(except){['modeSheet','bowSheet','arrowSheet'].forEach(id=>{$(id).hidden=id!==except;});}
['modeRow','bowRow','arrowRow'].forEach(id=>{$(id).onclick=()=>{const sh=$(id.replace('Row','Sheet'));closeSheets(sh.hidden?sh.id:null);};});
function sendCmd(action,value){const s=displayedSession();if(s?.live&&s.watchId&&window.Native?.command){Native.command(JSON.stringify({sid:s.watchId,action,value}));}}
function saveSession(s){const L=store.list();const i=L.findIndex(x=>x.id===s.id);if(i>=0)L[i]=s;else L.push(s);store.save(L);if(curSess?.id===s.id)curSess=s;}
$('modeSheet').onclick=e=>{const b=e.target.closest('[data-v]');if(!b)return;const s=displayedSession();if(!s||historyMode)return;
  s.mode=b.dataset.v;s.target=b.dataset.v==='Indoor'?3:b.dataset.v==='Outdoor'?6:0;saveSession(s);sendCmd('mode',s.mode);closeSheets(null);render();};
function gearSheet(listId,sheetId,field,cmd){
  $(sheetId).onclick=e=>{const b=e.target.closest('[data-n]');if(!b)return;const s=displayedSession();if(!s||historyMode)return;
    s[field]=b.dataset.n;saveSession(s);if(cmd)sendCmd(cmd,s[field]);closeSheets(null);render();};
}
gearSheet('bowList','bowSheet','bow','profile');
gearSheet('arrowList','arrowSheet','arrows',null);
function addGear(inputId,btnId,listName,field){
  $(btnId).onclick=()=>{const n=$(inputId).value.trim();if(!n)return;
    const g=gear.get();if(!g[listName].includes(n)){g[listName].push(n);gear.save(g);}
    const s=displayedSession();if(s&&!historyMode){s[field]=n;saveSession(s);}
    $(inputId).value='';render();};
}
addGear('bowName','bowAdd','bows','bow');
addGear('arrowName','arrowAdd','arrows','arrows');
let noticeTimer;
function notice(message) { $('notice').textContent=message;$('notice').hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').hidden=true,6000); }
function displayedSession() { return store.list().find(s=>s.id===(historyMode?histId:curSess?.id)); }
window.liveEvent = e => {
  if (!e || typeof e.sid!=='string' || !Number.isFinite(e.eid) || typeof e.kind!=='string') throw Error('Evento inválido');
  if (e.kind==='shot' && (!Number.isFinite(e.t)||(!e.manual&&!['score','peak','instab'].every(k=>Number.isFinite(e[k]))))) throw Error('Tiro inválido');
  const L=store.list();let i=L.findIndex(s=>s.watchId===e.sid);
  if(i<0) { const epoch=Number(e.sid.split('-')[0])*1000;L.push(Training.create(e,Number.isFinite(epoch)&&epoch>1e12?epoch:Math.max(Date.now(),...L.map(s=>s.id+1))));i=L.length-1; }
  if(e.eid<=(L[i].lastEvent??-1))return;
  if(e.kind==='start')L.forEach((s,j)=>{if(i!==j)s.live=false;});
  const follow=!data?.shots.length||cur===data.shots.length-1, s=Training.apply(L[i],e);L[i]=s;store.save(L);
  if(e.kind==='calibration')notice(e.result);  // se calibra desde el reloj; aqui solo informamos
  if(!historyMode) {
    if(s.live) {curSess=s;data={shots:s.shots};live=true;if(follow)cur=Math.max(0,s.shots.length-1);}
    else if(curSess?.watchId===e.sid) {curSess=null;data={shots:[]};live=false;cur=0;}
  } else if(histId===s.id) {data={shots:s.shots};}
  liveStatus('');if(!historyMode && (e.kind==='start'||e.kind==='end'))show('Session');else render();
};
const originalRemove=removeSelection;
removeSelection=function(kind,id=historyMode?histId:curSess?.id) {
  const s=store.list().find(s=>s.id===id);
  if(s?.live&&s.watchId&&s.metric===2) {
    const group=kind==='session'?s.shots:kind==='set'?sets(s.shots).find(g=>g.includes(cur))?.map(i=>s.shots[i]):[s.shots[cur]];
    if(!group?.length)return;
    const times=group.map(x=>x.t_ms);
    // borrado optimista: fuera ya en el movil; el eco del reloj reconcilia (removed[] ignora reenvios)
    s.removed=[...new Set([...(s.removed||[]),...times])];
    s.shots=s.shots.filter(x=>!times.includes(x.t_ms));
    saveSession(s);
    if(window.Native?.command){Native.command(JSON.stringify({sid:s.watchId,action:'remove',value:times}));}
    notice(times.length>1?times.length+' flechas eliminadas':'Flecha eliminada');
    if(curSess?.id===s.id){data={shots:s.shots};cur=Math.max(0,Math.min(cur,Math.max(0,s.shots.length-1)));}
    render();return;
  }
  originalRemove(kind,id);
};
const originalRender=render;
render=function() {
  originalRender();const s=displayedSession(), shot=data?.shots[cur];
  const ordinal=s?sets(s.shots).findIndex(g=>s.shots[g[0]].set_id===s.currentSet):-1;
  const setNumber=ordinal>=0?ordinal+1:(s?sets(s.shots).length+1:1);
  $('trainingStatus').textContent=historyMode?'Sesión guardada':s?`${s.mode?s.mode+' · ':''}${s.paused?'Pausa':s.resting?'Descanso':'Set '+setNumber} · ${s.shots.filter(x=>x.set_id===(s.currentSet??1)).length}${s.target?'/'+s.target:''} flechas`:'Prepara tu entrenamiento';
  if(!historyMode && s?.calibrating)$('trainingStatus').textContent=`Calibrando · ${s.calibrationCount||0}/3 flechas`;
  ['modePicker','bowPicker','arrowPicker'].forEach(id=>$(id).hidden=historyMode);
  $('modeVal').textContent=s?.mode||'–';
  $('bowVal').textContent=s?.bow||'sin definir';
  $('arrowVal').textContent=s?.arrows||'sin definir';
  $('modeSheet').querySelectorAll('[data-v]').forEach(b=>b.classList.toggle('on',b.dataset.v===(s?.mode||'')));
  const g=gear.get();
  $('bowList').innerHTML=g.bows.map(n=>`<button data-n="${escapeText(n)}"${n===s?.bow?' class="on"':''}>${escapeText(n)}<span>‹</span></button>`).join('')||'';
  $('arrowList').innerHTML=g.arrows.map(n=>`<button data-n="${escapeText(n)}"${n===s?.arrows?' class="on"':''}>${escapeText(n)}<span>‹</span></button>`).join('')||'';
  if(shot) {
    $('setState').textContent=(s?.ends||[]).some(e=>e.id===shot.set_id)?'Set cerrado':'Set abierto';
    const group=sets(data.shots).find(g=>g.includes(cur)), stats=Training.summary(group.map(i=>data.shots[i]));
    const eq=[...new Set([shot.profile,s?.profile,s?.bow,s?.arrows].filter(Boolean))].join(' · ');
    $('shotContext').textContent=`${shot.manual?'Flecha manual':eq||'Sin equipo'} · apunte ${aimTime(shot)==null?'–':(aimTime(shot)/1000).toFixed(1)+' s'} · radio ${aimRadius(shot)==null?'–':aimRadius(shot).toFixed(1)+aimUnit(shot)} · pulso ${shot.hr_bpm??'–'} ppm · ${shot.rmssd!=null?'RMSSD '+shot.rmssd.toFixed(0)+' ms':'RMSSD –'} · ritmo ${stats.rhythm==null?'–':stats.rhythm.toFixed(1)+' s'}`;
    const select=$('compareShot'), selected=select.value;
    select.innerHTML='<option value="">Ninguna</option>'+group.filter(i=>i!==cur).map(i=>`<option value="${i}">Flecha ${group.indexOf(i)+1}</option>`).join('');select.value=selected;
    $('comparison').textContent='';
    if(view==='Shot'&&select.value!=='') {
      const other=data.shots[+select.value], c=$('aim'), x=c.getContext('2d'), {pts,P}=proj(other);
      x.strokeStyle='#ff8220';x.setLineDash([4,4]);x.beginPath();pts.forEach((p,i)=>i?x.lineTo(...P(p)):x.moveTo(...P(p)));x.stroke();x.setLineDash([]);
      const delta=Number.isFinite(shot.aim_score)&&Number.isFinite(other.aim_score)?shot.aim_score-other.aim_score:null;
      $('comparison').textContent=`Referencia naranja · ${delta==null?'sin comparación de estabilidad':(delta>0?'+':'')+delta+' de estabilidad'} · misma escala`;
    }
  }
  ['sAvg','sSd'].forEach(id=>{if($(''+id).textContent==='NaN')$(id).textContent='–';});
};
const PROFILE_LABELS={'Recurvo':'Arco recurvo','Compuesto':'Arco compuesto','Recurvo / arco':'Recurvo (brazo de arco)','Compuesto / arco':'Compuesto (brazo de arco)','Recurvo / cuerda':'Recurvo (brazo de cuerda)','Compuesto / cuerda':'Compuesto (brazo de cuerda)'};
const originalProgress=renderProgress;
renderProgress=function() {
  const L=store.list(), keys=[...new Set(L.flatMap(s=>s.shots.map(a=>Training.key({profile:a.profile||s.profile,metric:a.metric||s.metric}))))], select=$('progressProfile'), old=select.value;
  select.innerHTML=keys.map(k=>`<option value="${escapeText(k)}">${escapeText(PROFILE_LABELS[k]||k)}</option>`).join('');if(keys.includes(old))select.value=old;
  const filtered=L.map(s=>({...s,shots:s.shots.filter(a=>Training.key({profile:a.profile||s.profile,metric:a.metric||s.metric})===select.value)}));
  const week=filtered.filter(s=>s.id>=Date.now()-7*864e5).reduce((n,s)=>n+s.shots.length,0), total=filtered.reduce((n,s)=>n+s.shots.length,0);
  $('volume').textContent=`${week} flechas en 7 días · ${total} en este perfil`;
  const list=store.list;try {store.list=()=>filtered.map(s=>({...s,shots:s.shots.filter(a=>Number.isFinite(a.aim_score))}));originalProgress();}finally{store.list=list;}
};
