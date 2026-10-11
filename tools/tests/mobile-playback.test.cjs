const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');

function page() {
  const elements = new Map(), storage = new Map(), frames = new Map(), created=[];
  let frameId = 0;
  const element = () => {
    const calls = [];
    const context = new Proxy({calls, createRadialGradient: () => ({addColorStop() {}})}, {
      get: (target, key) => key in target ? target[key] : (...args) => calls.push([key, ...(key==='stroke'?[target.strokeStyle]:args)])
    });
    return {style: {}, dataset: {}, width: 320, height: 320, clientWidth: 320, textContent: '', value: '', hidden: false,
      classList: {toggle() {}}, setAttribute() {}, insertAdjacentHTML() {}, appendChild() {}, addEventListener() {},
      querySelectorAll: () => [], querySelector: () => element(), classList: {toggle() {}, add() {}, remove() {}}, getContext: () => context, parentElement: {style: {}}, click() {}, remove() {}};
  };
  const document = {getElementById: id => {
    if (!elements.has(id)) elements.set(id, element());
    return elements.get(id);
  }, createElement: () => {const e=element();created.push(e);return e;}, head: element(), body: element(), visibilityState: 'visible'};
  const sandbox = {document, console, devicePixelRatio: 1, performance: {now: () => 0},
    localStorage: {getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, String(v)), removeItem: k => storage.delete(k),
      key: i => [...storage.keys()][i] ?? null, get length() { return storage.size; }},
    addEventListener() {}, setTimeout: () => 1, clearTimeout() {},
    requestAnimationFrame: f => {frames.set(++frameId, f); return frameId;}, cancelAnimationFrame: id => frames.delete(id)};
  sandbox.window = sandbox;
  const ctx = vm.createContext(sandbox), run = script => vm.runInContext(script, ctx);
  run(fs.readFileSync(path.join(root, 'mobile/session-model.js'), 'utf8'));
  run(fs.readFileSync(path.join(root, 'mobile/trace-geom.js'), 'utf8'));
  run(fs.readFileSync(path.join(root, 'mobile/backup.js'), 'utf8'));
  run(fs.readFileSync(path.join(root, 'mobile/score.js'), 'utf8'));
  run(fs.readFileSync(path.join(root, 'mobile/compare.js'), 'utf8'));
  run(fs.readFileSync(path.join(root, 'mobile/goals.js'), 'utf8'));
  const html = fs.readFileSync(path.join(root, 'mobile/index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).filter(s => s.trim());
  scripts.forEach(s => new vm.Script(s));
  run(scripts[0]);
  run(fs.readFileSync(path.join(root, 'mobile/training.js'), 'utf8'));
  run(`const fixture = {t_ms:1000,set_id:1,aim_score:80,peak_mg:1200,tilt_x:[0,100,200,300],tilt_y:[0,20,40,60],trace_t:[-1500,-1000,-500,-50]};
    curSess={id:1,watchId:'test',profile:'Recurvo',live:true,lastEvent:1,shots:[fixture]};store.save([curSess]);data={shots:curSess.shots};view='Shot';cur=0;render();`);
  return {run, elements, frames, created};
}

test('calibration action is visible for a recorded historical shot', () => {
  const p = page();
  p.run("historyMode=true;histId=1;curSess=null;render()");
  assert.equal(p.elements.get('calibrationPanel').hidden, false);
});

test('small displacement still animates when it spans visible pixels', () => {
  const p = page();
  p.run("fixture.pos_x=[0,0.15,0.3,0.45];fixture.pos_y=[0,0,0,0];render();play()");
  assert.equal(p.frames.size, 1, p.elements.get('tip').textContent);
});

test('incoming state does not cancel playback of the same shot', () => {
  const p = page();
  p.run('play()');
  assert.equal(p.frames.size, 1);
  p.run("liveEvent({sid:'test',eid:2,kind:'state',state:{currentSet:1}})");
  assert.equal(p.frames.size, 1, 'state refresh cancelled animation');
  assert.equal(p.elements.get('play').textContent, 'Detener');
});

test('switching sessions with equal shot timestamps repaints the canvas', () => {
  const p = page(), calls = p.elements.get('aim').getContext('2d').calls;
  const before = calls.length;
  p.run("historyMode=true;histId=2;store.save([...store.list(),{id:2,shots:[{...fixture,tilt_x:[100,0,-100,-200]}]}]);data={shots:store.list()[1].shots};render()");
  assert.ok(calls.length > before, 'cached canvas from a different session');
});

test('native command errors are not reported as calibration success', async () => {
  const p = page();
  p.run("askConfirm=async()=>true;window.Native={command:()=> 'Abre Garmin Connect'}");
  await p.run('calibrateFromShot()');
  assert.match(p.elements.get('notice').textContent, /Abre Garmin Connect/);
  assert.equal(p.run("JSON.parse(localStorage.getItem('awCalibration')).status"), 'error');
});

test('invalid calibration peaks cannot be sent to the watch', async () => {
  for (const value of ['NaN', 'Infinity', 'null', '-1', '0', '100001']) {
    const p = page();
    p.run(`let sent=0;askConfirm=async()=>true;window.Native={command:()=>{sent++;return ''}};fixture.peak_mg=${value}`);
    await p.run('calibrateFromShot()');
    assert.equal(p.run('sent'), 0, value);
  }
});

test('calibration lists the user bows and retains the chosen one', async () => {
  const p = page();
  p.run("let sent;window.Native={command:json=>{sent=JSON.parse(json);return ''}};historyMode=true;histId=1;" +
    "localStorage.setItem('awGear',JSON.stringify({bows:['Olímpico 38','Poleas']}));render()");
  assert.match(p.elements.get('calibrationProfile').innerHTML, /Olímpico 38/);
  assert.match(p.elements.get('calibrationProfile').innerHTML, /Poleas/);
  p.run("document.getElementById('calibrationProfile').value='Poleas'");
  const pending = p.run('calibrateFromShot()');
  assert.equal(p.run('sent'), undefined);
  assert.match(p.elements.get('askMsg').textContent, /Poleas/);
  assert.match(p.elements.get('askMsg').textContent, /420/);
  p.run('data.shots.push({...fixture,t_ms:2000,peak_mg:5000});cur=1');
  p.elements.get('askYes').onclick(); await pending;
  assert.equal(p.run('sent.action'), 'calibrateShot');
  assert.equal(p.run('sent.value'), 1200);
  assert.equal(p.run('sent.profile'), 'Poleas');
  assert.match(p.elements.get('notice').textContent, /enviado/);
  assert.equal(p.run("JSON.parse(localStorage.getItem('awCalibration')).status"), 'pending');
  p.run("render();liveEvent({sid:'other',eid:1,kind:'calibration',requestId:'unrelated',applied:true,result:'Otro ajuste'})");
  assert.equal(p.run("JSON.parse(localStorage.getItem('awCalibration')).status"), 'pending');
  p.run("liveEvent({sid:'other',eid:2,kind:'calibration',requestId:sent.requestId,applied:true,threshold:420,profile:'Poleas',result:'Calibración aplicada'})");
  assert.equal(p.run("JSON.parse(localStorage.getItem('awCalibration')).status"), 'applied');
  assert.match(p.elements.get('notice').textContent, /aplicada/);
});

test('cancelling calibration does not send or queue a command', async () => {
  const p = page();
  p.run("let sent=0;window.Native={command:()=>{sent++;return ''}}");
  const pending = p.run('calibrateFromShot()');
  p.elements.get('askNo').onclick(); await pending;
  assert.equal(p.run('sent'), 0);
  assert.equal(p.run("localStorage.getItem('awCalibration')"), null);
});
test('weak calibration candidates preserve posture and can be chosen on the phone', async () => {
  const p=page();p.run("let sent;askConfirm=async()=>true;window.Native={command:json=>{sent=JSON.parse(json);return ''}};liveEvent({sid:'test',eid:2,kind:'shot',candidate:true,t:2000,set:-1,score:80,peak:250,instab:10,pose:[0,0,1000],state:{calibrating:true,calibrationCount:1,profile:'Recurvo'}});show('Shot')");
  assert.equal(p.elements.get('calibrationPanel').hidden,false);assert.equal(p.elements.get('mScore').textContent,'–');assert.match(p.elements.get('title').textContent,/Candidato/);
  await p.run('calibrateFromShot()');assert.equal(p.run('sent.value'),250);assert.equal(p.run('sent.profile'),'Recurvo');assert.equal(p.run('JSON.stringify(sent.pose)'),'[0,0,1000]');
  p.run("show('Session')");assert.equal(p.elements.get('sTotal').textContent,1);assert.equal(p.elements.get('sSets').textContent,1);
});
test('calibration forwards learned aiming variance and explains unscored candidates',async()=>{
  const p=page();p.run("let sent;askConfirm=async()=>true;window.Native={command:json=>{sent=JSON.parse(json);return ''}};liveEvent({sid:'test',eid:2,kind:'shot',candidate:true,t:2000,set:-1,score:80,peak:3000,instab:10,pose:[0,0,1000,25]});show('Shot')");
  assert.match(p.elements.get('calibrationInfo').textContent,/Candidato sin puntuar.*3000 mG/);await p.run('calibrateFromShot()');assert.equal(p.run('JSON.stringify(sent.pose)'),'[0,0,1000,25]');assert.equal(p.run('calibrationState().threshold'),1050);
});
test('bow preset delete button removes saved gear and queues the named watch deletion', () => {
  const p=page();p.run("let sent;window.Native={command:json=>{sent=JSON.parse(json);return ''}};gear.save({bows:['Equipo A','Equipo B'],arrows:['X10']});curSess.bow=curSess.profile='Equipo A';saveSession(curSess);store.save([...store.list(),{id:2,bow:'Equipo A',profile:'Equipo A',shots:[fixture]}]);render()");
  assert.match(p.elements.get('bowList').innerHTML,/aria-label="Eliminar preset Equipo A"/);
  p.run("document.getElementById('bowSheet').onclick({target:{closest:selector=>selector==='[data-delete-bow]'?{dataset:{deleteBow:'Equipo A'}}:null}})");
  assert.equal(p.run('JSON.stringify(gear.get())'),'{"bows":["Equipo B"],"arrows":["X10"]}');assert.equal(p.run('sent.action'),'deleteProfile');assert.equal(p.run('sent.value'),'Equipo A');assert.equal(p.run('sent.sid'),'test');
  assert.equal(p.run('displayedSession().profile'),'Recurvo');assert.equal(p.run('store.list().find(s=>s.id===2).bow'),'Equipo A');assert.doesNotMatch(p.elements.get('calibrationProfile').innerHTML,/Equipo A/);
});
test('deleting a bow reports a native failure without discarding the preset', () => {
  const p=page();p.run("gear.save({bows:['Equipo A'],arrows:[]});window.Native={command:()=> 'Sin conexión'};deleteBow('Equipo A')");
  assert.equal(p.run("gear.get().bows[0]"),'Equipo A');assert.match(p.elements.get('notice').textContent,/Sin conexión/);
});
test('adding a named bow sends its profile and calibration can start from the phone', () => {
  const p=page();p.run("let sent;window.Native={command:json=>{sent=JSON.parse(json);return ''}};document.getElementById('bowName').value='Equipo A';document.getElementById('bowAdd').onclick()");
  assert.equal(p.run('sent.action'),'profile');assert.equal(p.run('sent.value'),'Equipo A');assert.equal(p.elements.get('calibrationMode').hidden,false);
  p.run("sendCmd('calibrate',0)");assert.equal(p.run('sent.action'),'calibrate');
});

test('degrees are drawn by default even when the shot includes integrated centimeters', () => {
  const p = page();
  const before = p.run('localStorage.getItem("awSessions")');
  p.run('fixture.tilt_x=[0,0,0];fixture.tilt_y=[0,0,0];fixture.yaw_c=[0,90,10];fixture.pitch_deg=[0,0,0];fixture.pos_x=[0,40,5];fixture.pos_y=[0,0,0];fixture.trace_t=[-100,-50,0];aimDrawnKey="";render()');
  const deg = JSON.parse(p.run('JSON.stringify(proj(fixture).pts.map(p=>p[0]))'));
  assert.ok(Math.abs(deg[1] - 80) < 1e-6, JSON.stringify(deg));
  assert.match(p.elements.get('aimCaption').textContent, /grados/);
  p.run("setTrace('cm')");
  const cm = JSON.parse(p.run('JSON.stringify(proj(fixture).pts.map(p=>p[0]))'));
  const k = p.run('Trace.cmPerDeg(0.65)');
  assert.ok(Math.abs(cm[1] - 80 * k) < 1e-6, JSON.stringify(cm));
  assert.match(p.elements.get('aimCaption').textContent, /cm/);
  assert.match(p.elements.get('aimCaption').textContent, /0\.65 m/);
  p.run("setArm(1)");
  const cm1 = JSON.parse(p.run('JSON.stringify(proj(fixture).pts[1][0])'));
  assert.ok(Math.abs(cm1 - 80 * Math.PI / 180 * 100) < 1e-6, cm1);
  assert.equal(p.run('Trace.prefs(localStorage).armM'), 1);
  p.run("setTrace('raw')");
  const raw = JSON.parse(p.run('JSON.stringify(proj(fixture).pts.map(p=>p[0]))'));
  assert.ok(Math.abs(raw[1] - 35) < 1e-6, JSON.stringify(raw));
  assert.match(p.elements.get('aimCaption').textContent, /experimental/);
  p.run("setTrace('deg')");
  assert.equal(p.run('localStorage.getItem("awSessions")'), before);
  assert.equal(p.run('JSON.stringify(fixture.pos_x)'), '[0,40,5]');
});

test('a yaw that crosses ±180° is drawn on the short arc', () => {
  const p = page();
  p.run('fixture.tilt_x=[0,0,0];fixture.tilt_y=[0,0,0];fixture.yaw_c=[179,-179,178];fixture.pitch_deg=[0,0,0];fixture.pos_x=[0,80,0];fixture.pos_y=[0,0,0];fixture.trace_t=[-100,-50,0];aimDrawnKey="";render()');
  const xs = JSON.parse(p.run('JSON.stringify(proj(fixture).pts.map(p=>p[0]))'));
  assert.ok(Math.abs(xs[0] - 1) < 1e-6 && Math.abs(xs[1] - 3) < 1e-6, JSON.stringify(xs));
  assert.ok(xs.every(v => Math.abs(v) < 10), JSON.stringify(xs));
});

test('cm and raw say so when the shot cannot be drawn that way', () => {
  const p = page();
  p.run("setTrace('cm'); fixture.yaw_c=[]; fixture.yaw_deg=[]; fixture.pitch_deg=[]; aimDrawnKey=''; render()");
  assert.match(p.elements.get('aimCaption').textContent, /Sin ángulos de brújula/);
  p.run("setTrace('raw'); fixture.yaw_c=[0,10,0]; fixture.pitch_deg=[0,0,0]; fixture.pos_x=[1,1,1]; fixture.pos_y=[2,2,2]; aimDrawnKey=''; render()");
  assert.match(p.elements.get('aimCaption').textContent, /Sin posición integrada: orientación en grados/);
});

test('the drawn trajectory reaches the release point', () => {
  const p = page(), calls = p.elements.get('aim').getContext('2d').calls;
  const end = calls.filter(c => c[0] === 'quadraticCurveTo').at(-1).slice(-2);
  const release = JSON.parse(p.run('JSON.stringify(proj(fixture).P(proj(fixture).pts.at(-1)))'));
  assert.deepEqual(end, release);
});

test('the playback marker moves across frames and finishes', () => {
  const p = page(), calls = p.elements.get('aim').getContext('2d').calls;
  p.run('play()');
  const positions = [];
  for (const time of [1000, 2000, 3000, 11000]) {
    const [id, callback] = p.frames.entries().next().value;
    p.frames.delete(id); callback(time);
    if (time < 11000) positions.push(calls.filter(c => c[0] === 'arc' && c[3] === 3).at(-1).slice(1, 3));
  }
  assert.notDeepEqual(positions[0], positions[1]);
  assert.notDeepEqual(positions[1], positions[2]);
  assert.equal(p.frames.size, 0);
  assert.equal(p.elements.get('play').textContent, 'Reproducir');
});

test('changing the selected shot stops playback', () => {
  const p = page();
  p.run('play();data.shots.push({...fixture,t_ms:2000});step(1)');
  assert.equal(p.frames.size, 0);
});

test('flat trajectories retain their static canvas and explain why playback is unavailable', () => {
  const p = page();
  p.run('fixture.pos_x=[0,0,0,0];fixture.pos_y=[0,0,0,0];fixture.tilt_x=[0,0,0,0];fixture.tilt_y=[0,0,0,0];render()');
  const calls = p.elements.get('aim').getContext('2d').calls, before = calls.length;
  p.run('play()');
  assert.equal(p.frames.size, 0);
  assert.equal(calls.length, before, 'failed playback cleared the static canvas');
  assert.match(p.elements.get('tip').textContent, /plana|movimiento|Camino/);
});

test('recorded calibration candidates show orientation when integrated position is flat', () => {
  const p=page(), shots=require('./fixtures/candidates-20261002.json');
  p.run(`data={shots:${JSON.stringify(shots)}}`);
  for(let i=0;i<shots.length;i++) {
    p.run(`stopPlayback();cur=${i};render();play()`);
    assert.equal(p.frames.size,1,'candidate '+(i+1)+': '+p.elements.get('tip').textContent);
  }
  assert.match(p.elements.get('aimCaption').textContent,/Orientación.*individual/);
});

test('calibration bars compare impulse peaks instead of missing stability scores', () => {
  const p=page(), shots=require('./fixtures/candidates-20261002.json');
  p.run(`const heights=[];const drawBar=rr;rr=(...a)=>{heights.push(a[4]);drawBar(...a)};data={shots:[${JSON.stringify(shots[3])},${JSON.stringify(shots[4])}]};cur=0;show('Session')`);
  assert.ok(p.run('heights[0]>heights[1]*5'),p.run('JSON.stringify(heights)'));
});

test('the visual onset does not interpolate aiming coordinates through the impulse', () => {
  const p=page();
  assert.equal(p.run('JSON.stringify(releasePath([[10,20,-50],[900,800,50]],0))'),'[[10,20,-50],[10,20,0],[900,800,50]]');
  assert.equal(p.run('JSON.stringify(releasePath([[10,20,-50],[900,800,0]],0))'),'[[10,20,-50],[10,20,0],[900,800,0]]');
});

test('the release marker stays at the last recorded aiming position instead of following the later impulse', () => {
  const p=page(), shots=require('./fixtures/release-paint-20261002.json'), context=p.elements.get('aim').getContext('2d');
  p.run(`const paintingShots=${JSON.stringify(shots)};data={shots:paintingShots}`);
  const before=p.run('JSON.stringify(paintingShots)');
  for(let i=0;i<shots.length;i++) {
    context.calls.length=0;p.run(`cur=${i};aimDrawnKey='';drawAim(data.shots[cur])`);
    const expected=JSON.parse(p.run('JSON.stringify((()=>{const {pts,P}=proj(data.shots[cur]);return P(pts.filter(p=>p[2]<0).at(-1))})())'));
    assert.deepEqual(context.calls.filter(c=>c[0]==='arc'&&c[3]===5).at(-1).slice(1,3),expected,'release point '+(i+1));
    assert.ok(context.calls.some(c=>c[0]==='stroke'&&c[1]===p.run('C.acc')),'missing follow-through '+(i+1));
  }
  assert.equal(p.run('JSON.stringify(paintingShots)'),before,'painting changed captured data');
});

test('playback paints follow-through after the recorded release', () => {
  const p=page();p.run(`data={shots:${JSON.stringify(require('./fixtures/release-paint-20261002.json'))}};cur=0;play()`);
  assert.equal(p.frames.size,1);p.created.forEach(e=>e.getContext('2d').calls.length=0);
  const [id,callback]=p.frames.entries().next().value;p.frames.delete(id);callback(9900);
  assert.ok(p.created.some(e=>e.getContext('2d').calls.some(c=>c[0]==='stroke'&&c[1]===p.run('C.acc'))),'animation omits follow-through');
});

test('the trajectory changes from aiming to follow-through at the recorded release, reserving red for the marker', () => {
  const p=page(), calls=p.elements.get('aim').getContext('2d').calls;calls.length=0;
  p.run("aimPath(document.getElementById('aim').getContext('2d'),[[0,0,-1000],[10,0,-50],[50,0,50],[100,0,100],[130,0,150],[200,0,400]],p=>p,1000,100)");
  const aim=calls.findIndex(c=>c[0]==='stroke'&&c[1]===p.run('C.aim'));
  assert.deepEqual(calls.slice(0,aim).filter(c=>c[0]==='quadraticCurveTo').at(-1).slice(-2),[100,0]);
  assert.deepEqual(calls.slice(aim).find(c=>c[0]==='moveTo').slice(1),[100,0]);
  assert.ok(calls.slice(aim).some(c=>c[0]==='stroke'&&c[1]===p.run('C.acc')));
  assert.ok(!calls.some(c=>c[0]==='stroke'&&c[1]===p.run('C.rel')));
});

test('an impulse sampled at zero cannot move the labelled aiming point or change captured data', () => {
  const p=page(), calls=p.elements.get('aim').getContext('2d').calls;
  p.run("fixture.window={pre:[-50],mag_pre:[1],post:[25,50],mag_post:[100,0]};fixture.traj_x=[400,500];fixture.traj_y=[80,100];fixture.post_t=[0,50]");
  const before=p.run('JSON.stringify(fixture)'), expected=JSON.parse(p.run('JSON.stringify((()=>{const {pts,P}=proj(fixture);return P(pts.filter(p=>p[2]<0).at(-1))})())'));
  calls.length=0;p.run("aimDrawnKey='';drawAim(fixture)");
  assert.deepEqual(calls.filter(c=>c[0]==='arc'&&c[3]===5).at(-1).slice(1,3),expected);
  assert.ok(calls.some(c=>c[0]==='fillText'&&c[1]==='Suelta estimada'));
  assert.match(p.elements.get('aimCaption').textContent,/Punto rojo: suelta estimada/);
  assert.equal(p.run('JSON.stringify(fixture)'),before);
});

test('playback pauses at the marked release before drawing follow-through and then finishes', () => {
  const shots=require('./fixtures/release-paint-20261002.json');
  for(let i=0;i<shots.length;i++){
    const p=page(), calls=p.elements.get('aim').getContext('2d').calls;
    p.run(`data={shots:${JSON.stringify(shots)}};cur=${i};play()`);
    const orange=p.run('C.acc'), paused=[];let followed=false;
    for(let time=0;p.frames.size&&time<=11000;time+=50){
      calls.length=0;const [id,callback]=p.frames.entries().next().value;p.frames.delete(id);callback(time);
      followed=p.created.some(e=>e.getContext('2d').calls.some(c=>c[0]==='stroke'&&c[1]===orange));
      if(!followed&&calls.some(c=>c[0]==='fillText'&&c[1]==='Suelta estimada'))paused.push(time);
    }
    assert.ok(paused.at(-1)-paused[0]>=500,'arrow '+(i+1)+': '+JSON.stringify(paused));
    assert.ok(followed,'missing follow-through after pause');
    assert.equal(p.frames.size,0);assert.equal(p.elements.get('play').textContent,'Reproducir');
  }
});

test('export packs the aw* storage for Android and reports a failed download', () => {
  const p = page();
  p.run("localStorage.setItem('awGear', JSON.stringify({bows:['Recurvo'],arrows:[]})); localStorage.setItem('awReceipt','4'); localStorage.setItem('theme','dark')");
  const sent = p.run("let captured; window.Native={export(json){captured=json}}; exportBackup(); captured");
  const copy = JSON.parse(sent);
  assert.equal(copy.format, 1);
  assert.equal(copy.app, null);
  assert.equal(copy.storage.awSessions[0].id, 1);
  assert.equal(copy.storage.awGear.bows[0], 'Recurvo');
  assert.equal(copy.storage.awCalibration, undefined);
  assert.equal(copy.storage.awReceipt, '4');
  assert.equal(Object.hasOwn(copy.storage, 'theme'), false);
  assert.equal(p.run("window.Native={}; exportBackup(); document.getElementById('notice').textContent"), 'No se pudo exportar la copia: Blob is not defined');
  const downloaded = p.run("document.getElementById('notice').hidden=true; document.getElementById('notice').textContent=''; window.Native=undefined; const files=[]; Blob=function(parts){this.parts=parts}; URL={createObjectURL(blob){files.push(blob.parts[0]); return 'blob:aw'}, revokeObjectURL(){}}; exportBackup(); files[0]");
  assert.equal(JSON.parse(downloaded).storage.awReceipt, '4');
  assert.equal(p.run("document.getElementById('notice').textContent"), '');
});

test('a closed end opens the score pad once and a repeat does not', () => {
  const p = page();
  p.run(`curSess.ends=[];curSess.target=0;curSess.mode='Libre';curSess.live=true;curSess.lastEvent=1;store.save([curSess]);view='Shot';
    liveEvent({sid:'test',eid:2,kind:'set',reason:'walk',state:{resting:true,currentSet:1,target:0,paused:false,mode:'Libre',ends:[{id:1,reason:'walk'}]}})`);
  assert.equal(p.run('view'), 'Set');
  assert.match(p.elements.get('notice').textContent, /Tanda cerrada/);
  assert.match(p.elements.get('notice').textContent, /valor de las flechas/);
  assert.match(p.elements.get('setScore').innerHTML, /Flecha 1/);
  assert.equal(p.run("store.list()[0].ends[0].reason"), 'walk');
  assert.equal(p.run("store.list()[0].shots[0].t_ms"), 1000);
  p.run("view='Shot';liveEvent({sid:'test',eid:3,kind:'state',state:{resting:true,currentSet:1,target:0,paused:false,ends:[{id:1,reason:'walk'}]}})");
  assert.equal(p.run('view'), 'Shot');
  p.run("historyMode=true;histId=1;view='History';liveEvent({sid:'test',eid:4,kind:'set',reason:'walk',state:{resting:false,currentSet:2,target:0,paused:false,ends:[{id:1,reason:'walk'},{id:2,reason:'walk'}]}})");
  assert.equal(p.run('view'), 'History');
});

test('history compares two sessions with the score pad metrics and degree traces', () => {
  const p = page();
  const now = Date.now(), older = now - 3 * 864e5;
  p.run(`const yaw=(base)=>[10,12,14,16,18].map(v=>v+base);
    const shot=(t,aim,value,set_id,base)=>({t_ms:t,set_id,aim_score:aim,draw_ms:2000,settle_ms:180,hr_bpm:80,candidate:false,result:{value},yaw_c:yaw(base),pitch_deg:[0,1,0,1,0],trace_t:[-400,-300,-200,-100,-40]});
    store.save([
      {id:${older},mode:'Indoor',bow:'Recurvo',arrows:'X10',shots:[shot(1000,70,'8',1,0),shot(4000,60,'7',2,0)]},
      {id:${now},mode:'Indoor',bow:'Recurvo',arrows:'ACE',shots:[shot(1000,90,'X',1,5),shot(2000,88,'10',1,5),shot(5000,84,'9',2,5)]}
    ]);
    show('History');openCompare();`);
  const table = p.elements.get('cmpTable').innerHTML;
  assert.match(table, /Flechas/);
  assert.match(table, /Puntos/);
  assert.match(table, />15</);
  assert.match(table, />29</);
  assert.match(table, /Estabilidad/);
  assert.match(p.elements.get('cmpGear').innerHTML, /Recurvo/);
  assert.match(p.elements.get('cmpAimCap').textContent, /grados/);
  assert.equal(p.elements.get('compareCard').hidden, false);
  const strokes = p.elements.get('cmpAim').getContext('2d').calls.filter(c => c[0] === 'stroke').map(c => c[1]);
  assert.ok(strokes.includes('#5ab0f0') && strokes.includes('#ff7a1a'), JSON.stringify(strokes));
  p.run("cmpArrowSet('1');cmpMetricSet('score');cmpQuick('aim')");
  assert.match(p.elements.get('cmpAimCap').textContent, /Flecha 2/);
  assert.equal(p.run('cmpMetric'), 'score');
  assert.notEqual(p.run('cmpA'), p.run('cmpB'));
});

test('progress shows the current week bar and keeps the goal in awGoals', () => {
  const p = page();
  p.run(`localStorage.setItem('awGoals', JSON.stringify({arrows:10, sessions:null, average:null, stability:null}));
    store.save([{id:Date.now(), shots:[0,1,2,3].map(t => ({t_ms:t, aim_score:80, candidate:false}))}]);
    show('Progress');`);
  assert.match(p.elements.get('goalBars').innerHTML, /4\/10 · 40%/);
  assert.match(p.elements.get('goalBars').innerHTML, /width:40%/);
  assert.match(p.elements.get('goalStreak').textContent, /1 día seguido/);
  assert.match(p.elements.get('title').textContent, /Progreso/);
  p.run("document.getElementById('goalArrows').value='12'; document.getElementById('goalAverage').value='8,5'; saveGoals();");
  assert.deepEqual(JSON.parse(p.run("localStorage.getItem('awGoals')")), {arrows: 12, sessions: null, average: 8.5, stability: null});
  assert.match(p.elements.get('notice').textContent, /Objetivos guardados/);
  assert.match(p.elements.get('goalBars').innerHTML, /Media/);
});

test('scoring the set stores the value and a repeated watch event leaves it', () => {
  const p = page();
  p.run(`fixture.draw_ms=3000;fixture.settle_ms=180;fixture.hr_bpm=90;fixture.set_id=1;
    const second={...fixture,t_ms:2000,aim_score:70,draw_ms:2800};const third={...fixture,t_ms:3000,aim_score:60,draw_ms:5000};
    curSess.watchId='test';curSess.lastEvent=1;curSess.shots=[fixture,second,third];data={shots:curSess.shots};store.save([curSess]);
    scoreArrow(1000,'X');scoreArrow(2000,'9');scoreArrow(3000,'M');view='Set';cur=0;render()`);
  assert.match(p.elements.get('setScore').innerHTML, /data-score="X"/);
  assert.match(p.elements.get('setScore').innerHTML, />X</);
  assert.match(p.elements.get('subtitle').textContent, /19 puntos/);
  p.run("liveEvent({sid:'test',kind:'shot',eid:4,t:1000,set:1,score:11,peak:1000,instab:10,dt:50})");
  const kept = p.run("store.list()[0].shots.find(s=>s.t_ms===1000).result.value");
  assert.equal(kept, 'X');
  p.run("view='Session';render()");
  assert.match(p.elements.get('sessionScoreLine').textContent, /19 puntos · media 6\.3 · 1 X · 0 dieces/);
  assert.match(p.elements.get('sessionScoreInsight').textContent, /al menos 4/);
  p.run("scoreArrow(1000,null)");
  assert.equal(p.run("store.list()[0].shots.find(s=>s.t_ms===1000).result"), undefined);
  p.run("historyMode=true;histId=curSess.id;curSess=null;scoreArrow(2000,'8')");
  assert.equal(p.run("historyMode && store.list()[0].shots.find(s=>s.t_ms===2000).result.value"), '8');
});
