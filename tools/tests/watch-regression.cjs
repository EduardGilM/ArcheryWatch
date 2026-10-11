// Executes the actual numeric Monkey C method bodies with small Toybox shims.
// Complements compilation; it does not emulate the Garmin VM or sensor hardware.
const fs=require('node:fs'), assert=require('node:assert/strict');
Number.prototype.toNumber=function(){return Math.trunc(this);};
Number.prototype.toFloat=function(){return Math.fround(this);};
String.prototype.equals=function(other){return String(this)===other;};
Array.prototype.remove=function(value){const i=this.indexOf(value);if(i>=0)this.splice(i,1);};
Error.prototype.getErrorMessage=function(){return this.message;};
Object.defineProperty(Object.prototype,'hasKey',{value:function(key){return Object.hasOwn(this,key);},configurable:true});
const Numeric=class {static [Symbol.hasInstance](v){return typeof v==='number';}};
const Text=class {static [Symbol.hasInstance](v){return typeof v==='string';}};
const Dict=class {static [Symbol.hasInstance](v){return v!==null&&typeof v==='object'&&!Array.isArray(v);}};
const convert=s=>s.replace(/catch\s*\(\s*(\w+)\s+instanceof\s+[\w.]+\s*\)/g,'catch($1)').replace(/\s+as\s+(?:Array<Float>|Lang.Dictionary|Float|Number|Boolean|Void|Array)/g,'').replace(/new \[([^\]]+)\]/g,'Array($1).fill(0)').replace(/\.(?:size|length)\(\)/g,'.length').replace(/(?<!training)\.add\(/g,'.push(').replace(/(\w+) has :(\w+)/g,"('$2' in $1)").replace(/([({,]\s*):(\w+)/g,'$1"$2"').replace(/=>/g,':');
function body(source,name){
  const start=source.indexOf('{',source.indexOf('function '+name+'('));let depth=1,end=start+1;
  while(depth){if(source[end]==='{')depth++;if(source[end]==='}')depth--;end++;}
  return source.slice(start+1,end-1);
}
function load(file,klass,names){
  const source=fs.readFileSync(file,'utf8').split('class '+klass+' ')[1], values=new Map(), env={Math,Lang:{Array,Dictionary:Dict,Number:Numeric,Long:Numeric,Float:Numeric,Double:Numeric,String:Text,InvalidValueException:Error},System:{getTimer:()=>0},Toybox:{Timer:{Timer:function(){}}},WatchUi:{requestUpdate(){}},Application:{Storage:{setValue:(k,v)=>values.set(k,v),getValue:k=>values.get(k)??null,deleteValue:k=>values.delete(k)}}};
  for(const match of source.slice(0,source.indexOf('function initialize')).matchAll(/(?:private|public) var ([^;]+);/g)){
    const declaration=convert(match[1]);
    const names=[...declaration.matchAll(/(?:^|,)\s*(\w+)\s*(?:=|$)/g)].map(m=>m[1]);
    Function('env','with(env){var '+declaration+';Object.assign(env,{'+names.join(',')+'});}')(env);
  }
  for(const name of names){
    const args=source.match(new RegExp('function '+name+'\\(([^)]*)'))[1].replace(/\s+as\s+[\w.<>]+/g,'');
    env[name]=Function('env','return function('+args+'){with(env){'+convert(body(source,name))+'}}')(env);
  }
  return env;
}
const watch=()=>load('watchapp/source/ArcheryApp.mc','ArcheryApp',['configureRate','walkReset','stepsNow','considerWalk','onData','sample','magYaw','rememberRR','rrRmssd','preStable','trigger','finalize','finalizeBody','mark','note','clearNote','noticeLive','decimate','subArray','diffArray','mean','pstdev','clamp','shouldResume']);
const training=()=>{const s=load('watchapp/source/Training.mc','TrainingState',['count','total','nextId','snapshot','close','buzzSoft','validProfile','add','act','restore','readyLine','quietLaunch','roundGoal','closedSets','settleRound','buzzRound']);s.app={mark(){}};s.events=[];s.notes=[];s.buzzes=[];s.app.note=t=>s.notes.push(t);s.emit=(kind,payload)=>s.events.push({kind,...payload});s.buzz=()=>s.buzzes.push('hard');s.buzzSoft=()=>s.buzzes.push('soft');s.buzzRound=()=>s.buzzes.push('round');return s;};
let failures=0;
function test(name,run){try{run();console.log('PASS',name);}catch(e){failures++;console.error('FAIL',name,e.message);}}
test('Sensor batches preserve 10 ms intervals after days of watch uptime',()=>{
  for(const timestamp of [null,Array.from({length:100},(_,i)=>10000+i*10)]){
    const s=watch(), times=[];s.t0=321860380;s.System.getTimer=()=>s.t0+990;s.sample=(x,y,z,t)=>times.push(t);s.configureRate(100);
    s.onData({accelerometerData:{x:Array(100).fill(0),y:Array(100).fill(0),z:Array(100).fill(1000),timestamp}});
    assert.equal(times.length,100);assert.equal(times[0],0);assert.ok(times.slice(1).every((t,i)=>t-times[i]===10),JSON.stringify(times));
  }
});
test('An old movement does not block a later draw and release',()=>{
  const s=watch(),shots=[];s.training={paused:false,calibration:false,threshold:1320,add:m=>shots.push(m)};s.configureRate(100);
  for(let t=0;t<=42000;t+=10)s.sample(t>=1000&&t<5000||t>=36000?400:0,0,t===40000?5000:1000,t);
  assert.deepEqual(shots.map(m=>m.t),[40000]);
});
test('A release precursor does not erase aiming calm before the main pulse',()=>{
  const s=watch(),shots=[];s.training={paused:false,calibration:false,threshold:1320,add:m=>shots.push(m)};s.configureRate(100);
  for(let t=0;t<=4500;t+=10)s.sample(t>=1000?400:0,0,t===2000?1500:t===2010?5000:1000,t);
  assert.deepEqual(shots.map(m=>m.t),[2000]);
});
test('Opening the bow does not zero the score of a steady aim',()=>{
  const s=watch(),shots=[];s.training={paused:false,calibration:false,threshold:1320,add:m=>shots.push(m)};s.configureRate(100);
  for(let t=0;t<=4500;t+=10)s.sample(t>=1000?400:0,0,t===2500?5000:1000,t);
  assert.equal(shots.length,1);assert.ok(shots[0].score>=90,String(shots[0].score));
});
test('Recorded release-shaped impulses survive calibration from any of the three references',()=>{
  const rows=JSON.parse(fs.readFileSync('tools/tests/fixtures/field-20261002.json')),s=watch(),state=training();state.calibration=true;s.training=state;s.configureRate(100);
  rows.forEach(([t,x,y,z])=>s.sample(x,y,z,t));const anchors=[60047,97846,134005],references=anchors.map(t=>state.events.find(e=>Math.abs(e.t-t)<100));
  assert.ok(references.every(Boolean));
  for(const reference of references){const preset=training();preset.act('profile','TRX 38');preset.act('calibrateShot',{peak:reference.peak,pose:reference.pose,profile:'TRX 38',requestId:'field'});assert.equal(preset.events.at(-1).applied,true);
    const detector=watch();detector.training=preset;detector.configureRate(100);rows.forEach(([t,x,y,z])=>detector.sample(x,y,z,t));
    const shots=preset.events.filter(e=>e.kind==='shot');assert.equal(shots.length,3,JSON.stringify(shots.map(e=>[e.t,e.peak])));assert.ok(shots.every((e,i)=>Math.abs(e.t-anchors[i])<100));
  }
});
test('Incomplete three-arrow end cannot close',()=>{const s=training();s.target=3;s.rows=[[100,1]];s.close('manual',0);assert.equal(s.resting,false);assert.equal(s.ends.length,0);});
test('The second field capture retains the three probable releases after calibration',()=>{
  const rows=JSON.parse(fs.readFileSync('tools/tests/fixtures/field-20261002-afternoon.json')),candidates=JSON.parse(fs.readFileSync('tools/tests/fixtures/candidates-20261002.json'));
  for(const i of [3,11,17]){
    const reference=candidates[i],state=training();state.act('profile','TRX 38');state.act('calibrateShot',{peak:reference.peak_mg,pose:reference.pose,profile:'TRX 38',requestId:'field2'});
    const detector=watch();detector.training=state;detector.configureRate(100);rows.forEach(([t,x,y,z])=>detector.sample(x,y,z,t));
    const shots=state.events.filter(e=>e.kind==='shot');assert.equal(shots.length,3,JSON.stringify(shots.map(e=>[e.t,e.peak])));
    assert.ok(shots.every((e,j)=>Math.abs(e.t-candidates[[3,11,17][j]].t_ms)<200),JSON.stringify(shots.map(e=>e.t)));
  }
});
test('Next cannot skip an incomplete end; undo reopens the current end',()=>{const s=training();s.rows=[[100,1],[200,1]];s.act('next',0);assert.equal(s.currentSet,1);s.rows.push([300,1]);s.close('manual',0);assert.equal(s.resting,true);s.act('undo',0);assert.equal(s.resting,false);assert.equal(s.ends.length,0);});
test('Calibration candidates are published without advancing the training end',()=>{const s=training();s.calibration=true;s.add({t:1000,candidate:true});assert.equal(s.snapshot().calibrationCount,1);assert.equal(s.count(),0);assert.equal(s.app.nShots,0);assert.equal(s.events[0].kind,'shot');});
test('Trace respects the six-second capture cap and preserves recent samples',()=>{const s=watch();s.training={paused:false,calibration:false,threshold:3200,add:m=>s.message=m};s.configureRate(100);
  for(let t=0;t<=14000;t+=10)s.sample(t>=2000 && t<5000?400:0,0,t===12000?5000:1000,t);
  assert.equal(s.message.trace_t[0],-6000);assert.equal(s.message.trace_t.at(-1),-50);assert.equal(s.message.trace_t.length,s.message.tx.length);});
test('Compression retains both endpoints',()=>{const s=watch();assert.deepEqual([s.decimate([0,1,2,3,4,5],3)[0],s.decimate([0,1,2,3,4,5],3).at(-1)],[0,5]);});
test('Directional release, no doubles, at 25/50/100 Hz',()=>{
  for(const rate of [25,50,100]){const s=watch(), shots=[];s.training={paused:false,calibration:false,threshold:3200,add:m=>shots.push(m)};s.configureRate(rate);
    for(let t=0;t<=14000;t+=1000/rate)s.sample(t>=1000 && t%4000>=1000?400:0,0,[2000,6000,10000].includes(t)?-3000:1000,t);
    assert.deepEqual(shots.map(m=>m.t),[2000,6000,10000]);assert.ok(shots.every(m=>m.tx.every(Number.isFinite)&&m.trace_t.length===m.tx.length));}
});
test('Slow opening and constant rest do not count as arrows',()=>{const s=watch(), shots=[];s.training={paused:false,calibration:false,threshold:900,add:m=>shots.push(m)};s.configureRate(100);
  for(let t=0;t<=12000;t+=10)s.sample(1000*Math.sin(t/3000),0,1000*Math.cos(t/3000),t);assert.equal(shots.length,0);
});
test('An isolated knock without drawing the bow is rejected',()=>{const s=watch(), shots=[];s.training={paused:false,calibration:false,threshold:1320,add:m=>shots.push(m)};s.configureRate(100);
  for(let t=0;t<=5000;t+=10)s.sample(0,0,t===2000?5000:1000,t);assert.equal(shots.length,0);
});
test('A sustained shake after opening is rejected',()=>{const s=watch(), shots=[];s.training={paused:false,calibration:false,threshold:1320,add:m=>shots.push(m)};s.configureRate(100);
  for(let t=0;t<=7000;t+=10)s.sample(t>=1000?400:0,0,t>=4000&&t<4600?5000:1000,t);assert.equal(shots.length,0);
});
test('Knocks in a different wrist posture are rejected after calibration',()=>{const s=watch(), shots=[];s.training={paused:false,calibration:false,pose:[0,0,1000],threshold:1320,add:m=>shots.push(m)};s.configureRate(100);
  for(let t=0;t<=7000;t+=10)s.sample(t>=1000?(t===4000?5000:1000):0,0,t>=1000?0:1000,t);assert.equal(shots.length,0);
});
test('A second impulse without a new draw is not another arrow',()=>{const s=watch(), shots=[];s.training={paused:false,calibration:false,threshold:1320,add:m=>shots.push(m)};s.configureRate(100);
  for(let t=0;t<=9000;t+=10)s.sample(t>=1000?400:0,0,t===3000||t===6000?5000:1000,t);assert.deepEqual(shots.map(s=>s.t),[3000]);
});
test('Walking with repeated impacts and swinging the arm is rejected',()=>{const s=watch(), shots=[];s.training={paused:false,calibration:false,threshold:900,add:m=>shots.push(m)};s.configureRate(100);
  for(let t=0;t<=10000;t+=10){const moving=t>=1000;s.sample(moving?600*Math.sin(t/180):0,0,moving&&t%600===0?3500:1000,t);}assert.equal(shots.length,0);
});
test('Selecting a weaker release calibrates without follow-through inflating peak',()=>{const state=training();state.calibration=true;state.act('calibrateShot',{peak:2200,profile:'Recurvo',requestId:'weak'});assert.equal(state.threshold,770);assert.equal(state.calibration,false);
  const s=watch(), shots=[];s.training={paused:false,calibration:false,threshold:state.threshold,add:m=>shots.push(m)};s.configureRate(100);
  for(let t=0;t<=5000;t+=10)s.sample(t>=1000?400:0,0,t===2000?2500:t===2500?8000:1000,t);
  assert.equal(shots.length,1);assert.ok(shots[0].peak>1400 && shots[0].peak<1600);
});
test('Legacy arrows stay together through long pauses, then start a new trio',()=>{
  const html=fs.readFileSync('mobile/index.html','utf8'), identify=Function('shots',body(html,'identifySets'));
  const shots=[0,90000,180000,270000].map(t_ms=>({t_ms}));identify(shots);assert.deepEqual(shots.map(s=>s.set_id),[0,0,0,270000]);
  shots.splice(1,1);identify(shots);assert.deepEqual(shots.map(s=>s.set_id),[0,0,270000]);
});
test('Calibration captures candidates without requiring a recognised opening',()=>{
  for(const rate of [25,50,100]){const s=watch(), state=training();state.calibration=true;s.training=state;s.configureRate(rate);
    for(let t=0;t<=14000;t+=1000/rate)s.sample(0,0,[2000,6000,10000].includes(t)?4000:1000,t);
    assert.equal(state.snapshot().calibrationCount,3);assert.equal(state.calibration,true);assert.equal(state.threshold,3200);assert.equal(state.events.filter(e=>e.candidate).length,3);}
});
test('Calibration tolerates aiming sway before learning posture',()=>{
  const s=watch(), state=training();state.calibration=true;s.training=state;s.configureRate(100);
  for(let t=0;t<=5000;t+=10)s.sample(160*Math.sin(t/100),0,t===2000?4000:1000,t);
  assert.equal(state.snapshot().calibrationCount,1);
});
test('Calibration retains sustained movement for the user to accept or discard',()=>{
  for(const shake of [false,true]){const s=watch(), state=training();state.calibration=true;s.training=state;s.configureRate(100);
    for(let t=0;t<=6000;t+=10)s.sample(300*Math.sin(t/1000),0,shake&&t>=2000&&t<2700?5000:1000,t);
    assert.equal(state.snapshot().calibrationCount>0,shake);assert.equal(state.calibration,true);}
});
test('Calibration never ends at three candidates; selected sensitivity detects later arrows',()=>{
  for(const rate of [25,50,100]){const s=watch(), state=training();state.calibration=true;s.training=state;s.configureRate(rate);
    for(let t=0;t<=14000;t+=1000/rate)s.sample(0,0,[2000,6000,10000].includes(t)?1250:1000,t);
    const candidates=state.events.filter(e=>e.candidate);assert.equal(candidates.length,3);assert.equal(state.calibration,true);assert.equal(state.threshold,3200);
    state.act('calibrateShot',{peak:candidates[1].peak,pose:candidates[1].pose,profile:'Recurvo',requestId:'selected'});
    assert.equal(state.threshold,90);assert.equal(state.calibration,false);
    for(let t=14000+1000/rate;t<=34000;t+=1000/rate){const phase=t%6000;s.sample(Math.min(400,Math.max(0,phase-1000)),0,phase===4000?1250:1000,t);}
    assert.equal(state.total(),3,JSON.stringify({rate,events:state.events.map(e=>[e.t,e.peak]),status:s.detectorStatus}));}
});
test('Mobile calibration persists the selected profile and confirms the request',()=>{
  const s=training();s.calibration=true;
  s.act('calibrateShot',{peak:1200,profile:'Recurvo',requestId:'r1'});
  assert.equal(s.threshold,420);assert.equal(s.calibration,false);
  assert.equal(s.Application.Storage.getValue('threshold:Recurvo'),420);
  assert.equal(s.events.at(-1).requestId,'r1');assert.equal(s.events.at(-1).applied,true);
});
test('Mobile calibration for another profile does not alter the active profile',()=>{
  const s=training();s.calibration=true;
  s.act('calibrateShot',{peak:2000,profile:'Compuesto',requestId:'r2'});
  assert.equal(s.threshold,3200);assert.equal(s.profile,'Recurvo');assert.equal(s.calibration,true);
  assert.equal(s.Application.Storage.getValue('threshold:Compuesto'),700);assert.equal(s.events.at(-1).applied,true);
});
test('Malformed mobile calibration never changes saved sensitivity',()=>{
  for(const peak of [null,'1200',NaN,Infinity,-1,0,150,100001]){
    const s=training();s.act('calibrateShot',{peak,profile:'Recurvo',requestId:'bad'});
    assert.equal(s.threshold,3200);assert.equal(s.Application.Storage.getValue('threshold:Recurvo'),null);
    assert.equal(s.events.at(-1).applied,false);
  }
});
test('Mobile calibration accepts named bows, weak peaks and rejects invalid names',()=>{
  const s=training();s.act('calibrateShot',{peak:151,profile:'Recurvo',requestId:'floor'});assert.equal(s.threshold,90);
  s.act('profile','Olímpico 38');s.act('calibrateShot',{peak:250,profile:'Olímpico 38',pose:[0,0,1000],requestId:'named'});assert.equal(s.threshold,90);assert.equal(s.events.at(-1).applied,true);assert.deepEqual(s.pose,[0,0,1000]);
  for(const profile of ['',null,'x'.repeat(25)]){s.act('calibrateShot',{peak:4000,profile,requestId:'bad'});assert.equal(s.threshold,90);assert.equal(s.events.at(-1).applied,false);}
});
test('Deleting a bow preset clears its sensitivity and posture and preserves other bows',()=>{
  const s=training();s.act('profile','Equipo A');s.act('calibrateShot',{peak:1200,profile:'Equipo A',pose:[0,0,1000],requestId:'a'});s.Application.Storage.setValue('threshold:Equipo B',900);
  s.act('deleteProfile','Equipo A');assert.equal(s.Application.Storage.getValue('threshold:Equipo A'),null);assert.equal(s.Application.Storage.getValue('pose:Equipo A'),null);assert.equal(s.profile,'Recurvo');assert.equal(s.threshold,3200);assert.equal(s.Application.Storage.getValue('threshold:Equipo B'),900);
});
test('Invalid posture never partially changes calibration; historical shots clear stale posture',()=>{
  const s=training();for(const pose of [[0,0],[0,0,0],[NaN,0,1000],[0,0,Infinity],['0',0,1000],[0,0,1000,NaN],[0,0,1000,-1],[0,0,1000,4000001],[0,0,1000,0,0]]){s.act('calibrateShot',{peak:1200,profile:'Recurvo',pose,requestId:'bad-pose'});assert.equal(s.threshold,3200);assert.equal(s.Application.Storage.getValue('threshold:Recurvo'),null);}
  s.pose=[1000,0,0];s.Application.Storage.setValue('pose:Recurvo',s.pose);s.act('calibrateShot',{peak:1200,profile:'Recurvo',requestId:'legacy'});assert.equal(s.pose,null);assert.equal(s.Application.Storage.getValue('pose:Recurvo'),null);
});
test('Zero acceleration samples do not create a non-finite pitch',()=>{
  const s=watch();s.training={paused:false,calibration:false,threshold:3200};s.configureRate(100);s.sample(0,0,0,0);
  assert.ok(Number.isFinite(s.rpt[0]));
});
test('A sensor restart discards the stale orientation reference',()=>{
  const s=watch();s.basisOk=true;s.refOk=true;s.configureRate(100);assert.equal(s.basisOk,false);assert.equal(s.refOk,false);
});
test('RR metrics keep updating beyond ninety heartbeats and reject invalid intervals',()=>{
  const s=watch();for(let i=0;i<100;i++)s.rememberRR(800);assert.equal(s.rrCount,90);assert.equal(s.rrRmssd(),0);
  for(let i=0;i<40;i++)s.rememberRR(i%2?1000:800);assert.equal(s.rrCount,90);assert.equal(s.rrRmssd(),200);
  for(const value of [0,300,2500,Infinity,NaN])s.rememberRR(value);assert.equal(s.rrRmssd(),200);
});
test('Vector-only and negative release candidates have usable calibration peaks',()=>{
  for(const rate of [25,50,100])for(const directional of [false,true]){const s=watch(), state=training();state.calibration=true;s.training=state;s.configureRate(rate);
    for(let t=0;t<=4000;t+=1000/rate)s.sample(t===2000&&directional?1000:0,0,t===2000?(directional?0:750):1000,t);
    const shot=state.events.find(e=>e.candidate);assert.ok(shot&&shot.peak>150);assert.equal(shot.trace_t.length,shot.yw2.length);}
});
test('Normal training detects a brief vector impulse with unchanged acceleration magnitude',()=>{
  for(const rate of [25,50,100]){const s=watch(), shots=[];s.training={paused:false,calibration:false,threshold:400,add:m=>shots.push(m)};s.configureRate(rate);
    for(let t=0;t<=5000;t+=1000/rate)s.sample(t>=1000?(t===3000?-400:400):0,0,1000,t);
    assert.equal(shots.length,1);assert.equal(shots[0].t,3000);assert.ok(shots[0].peak>600);assert.equal(shots[0].tx.length,shots[0].yw2.length);}
});
test('Historical calibration crosses the phone dispatcher as scalar fields and is idempotent',()=>{
  const s=load('watchapp/source/ArcheryApp.mc','ArcheryApp',['onPhone','note','clearNote']), state=training(), replies=[];
  Object.assign(s,{Dictionary:Dict,String:Text,CommandListener:function(){},Communications:{transmit:r=>replies.push(r)},finishPending(){},training:state});state.save=()=>{};s.sid='current';
  const message={data:{sid:'history',cid:1,client:'phone',action:'calibrateShot',value:1200,profile:'Recurvo',requestId:'old-shot'}};
  s.onPhone(message);s.onPhone(message);
  assert.equal(state.threshold,420);assert.equal(state.events.length,1);assert.equal(state.events[0].requestId,'old-shot');assert.equal(replies.length,2);
});
test('A startup failure stays latched and a transient notice does not clear it or block by itself',()=>{
  const s=watch();
  s.err='Sin acelerometro';
  s.note('TX:radio','tx',false);
  assert.equal(s.err,'Sin acelerometro');
  assert.equal(s.notice,'TX:radio');
  assert.equal(s.noticeLive(),true);
  s.System.getTimer=()=>s.noticeAt+5999;assert.equal(s.noticeLive(),true);
  s.System.getTimer=()=>s.noticeAt+6000;assert.equal(s.noticeLive(),false);assert.equal(s.notice,null);assert.equal(s.err,'Sin acelerometro');
  s.note('PROBE:listener','probe',true);
  s.System.getTimer=()=>s.noticeAt+60000;assert.equal(s.noticeLive(),true);
  s.clearNote('tx');assert.equal(s.notice,'PROBE:listener');
  s.clearNote('probe');assert.equal(s.notice,null);
});
test('One sensor glitch keeps detecting; repeated faults are shown and then clear',()=>{
  const s=watch(), shots=[];
  s.training={paused:false,calibration:false,threshold:1320,add:m=>shots.push(m)};
  s.configureRate(100);s.t0=0;
  const real=s.sample;
  s.sample=()=>{throw new Error('glitch');};
  for(let n=1;n<=3;n++){
    s.System.getTimer=()=>n*1000;
    s.onData({accelerometerData:{x:[0],y:[0],z:[1000],timestamp:[n*1000]}});
    assert.equal(s.training.paused,false);assert.equal(s.err,null);assert.equal(s.inShot,false);
    if(n<3){assert.equal(s.notice,null);assert.equal(s.sensorFaults,n);}
  }
  assert.equal(s.notice,'SENSOR repetido: glitch');assert.equal(s.noticeHold,true);
  s.System.getTimer=()=>999999;assert.equal(s.noticeLive(),true);
  s.sample=real;
  const xs=[],ys=[],zs=[],ts=[];
  for(let t=4000;t<=8500;t+=10){xs.push(t>=5000?400:0);ys.push(0);zs.push(t===6000?5000:1000);ts.push(t);}
  s.System.getTimer=()=>8500;
  s.onData({accelerometerData:{x:xs,y:ys,z:zs,timestamp:ts}});
  assert.deepEqual(shots.map(m=>m.t),[6000]);
  assert.equal(s.notice,null);assert.equal(s.sensorFaults,0);assert.equal(s.training.paused,false);assert.equal(s.err,null);
});
test('Send failures are status notices and clear when the queue moves again',()=>{
  const s=load('watchapp/source/ArcheryApp.mc','ArcheryApp',['enqueue','flush','note','clearNote','noticeLive','mark','onTxAck','noteBacklog','pending']);
  s.Dictionary=Dict;s.TxListener=function(){};s.self=s;
  s.Communications={transmit(){throw new Error('radio');}};
  const store=s.Application.Storage, realSet=store.setValue;
  store.setValue=()=>{throw new Error('full');};
  s.enqueue({event:{kind:'shot'}});
  assert.equal(s.err,null);assert.equal(s.notice,'Memoria de envio llena');assert.equal(s.noticeHold,true);
  store.setValue=realSet;
  s.enqueue({event:{kind:'shot'}});
  assert.equal(s.notice,null);assert.equal(s.qTail,1);
  store.setValue('queued0','roto');s.qHead=0;s.qTail=1;s.sending=false;
  s.flush();
  assert.equal(s.err,null);assert.equal(s.notice,'Cola de envio incompleta');assert.equal(s.sending,false);
  store.setValue('queued0',{event:1});s.flush();
  assert.equal(s.notice,'Cola de envio incompleta');assert.equal(s.sending,false);
  store.setValue('queued0',{event:{kind:'shot',sid:'a'}});s.flush();
  assert.equal(s.err,null);assert.equal(s.sending,false);assert.equal(s.notice,'TX:radio');assert.equal(s.noticeHold,false);
  assert.equal(store.getValue('step'),null);
  s.System.getTimer=()=>s.noticeAt+6000;assert.equal(s.noticeLive(),false);
  store.setValue('queued0',{event:{kind:'shot',sid:'a'}});s.sending=false;s.Communications={transmit(){}};
  s.note('TX:radio','tx',false);s.flush();
  assert.equal(s.notice,null);assert.equal(s.sending,true);
  s.note('TX:radio','tx',false);s.onTxAck();
  assert.equal(s.notice,null);assert.equal(s.sending,false);
});
function gait(s, until, stepMs, pulseMs, from = 0) {
  const dt = 1000 / s.rateA;
  for (let t = from; t <= until; t += dt) {
    const on = stepMs > 0 && (Math.round(t) % stepMs) < pulseMs;
    s.sample(0, 0, on ? 1700 : 1000, t);
  }
}
function libreWalker() {
  const s = watch(), state = training();
  state.target = 0; state.mode = 'Libre'; state.walkClose = true; state.rows = [[100, 1]]; state.currentSet = 1;
  s.training = state; s.configureRate(100); s.lastShot = 0;
  return [s, state];
}
test('Walking to the target closes a free end once, with a soft buzz and no extra arrow', () => {
  const [s, state] = libreWalker();
  gait(s, 9000, 500, 120);
  assert.equal(state.events.filter(e => e.kind === 'shot').length, 0);
  assert.equal(state.ends.length, 1);
  assert.equal(state.ends[0].reason, 'walk');
  assert.equal(state.resting, true);
  assert.deepEqual(state.buzzes, ['soft']);
  assert.equal(state.events.filter(e => e.kind === 'set').length, 1);
  assert.equal(state.events.at(-1).reason, 'walk');
  const before = state.buzzes.length;
  gait(s, 16000, 500, 120, 9000);
  assert.equal(state.ends.length, 1);
  assert.equal(state.buzzes.length, before);
});
test('Standing still does not close the end', () => {
  const [s, state] = libreWalker();
  gait(s, 12000, 0, 0);
  assert.equal(state.ends.length, 0);
  assert.equal(state.resting, false);
  assert.equal(state.buzzes.length, 0);
  assert.equal(state.events.filter(e => e.kind === 'shot').length, 0);
});
test('Repositioning or an irregular shift does not close the end', () => {
  const [s, state] = libreWalker();
  for (let t = 0; t <= 12000; t += 10) s.sample(0, 0, t < 2200 && t % 500 < 120 ? 1700 : 1000, t);
  assert.equal(state.ends.length, 0, 'short cadence');
  const [shift, shifted] = libreWalker();
  const bursts = [400, 700, 1800, 2600, 5000, 8200];
  for (let t = 0; t <= 12000; t += 10) shift.sample(0, 0, bursts.some(p => t >= p && t < p + 150) ? 1700 : 1000, t);
  assert.equal(shifted.ends.length, 0, 'irregular');
  assert.equal(shifted.events.filter(e => e.kind === 'shot').length, 0);
});
test('An indoor end with fewer arrows than the mode stays open while walking', () => {
  const s = watch(), state = training();
  state.target = 3; state.mode = 'Indoor'; state.walkClose = true; state.rows = [[100, 1], [200, 1]];
  s.training = state; s.configureRate(100); s.lastShot = 0;
  gait(s, 12000, 500, 120);
  assert.equal(state.ends.length, 0);
  assert.equal(state.resting, false);
  assert.equal(state.buzzes.length, 0);
});
test('Walk-to-collect can be turned off and an already closed end is not buzzed again', () => {
  const [s, state] = libreWalker();
  state.walkClose = false;
  gait(s, 12000, 500, 120);
  assert.equal(state.ends.length, 0);
  assert.equal(state.buzzes.length, 0);
  const [again, closed] = libreWalker();
  closed.ends = [{id: 1, reason: 'target'}]; closed.resting = true;
  gait(again, 12000, 500, 120);
  assert.equal(closed.ends.length, 1);
  assert.equal(closed.buzzes.length, 0);
  const pref = training();
  assert.equal(pref.walkClose, true);
  pref.act('walkClose', 0);
  assert.equal(pref.walkClose, false);
  assert.equal(pref.Application.Storage.getValue('preferences').walkClose, false);
  pref.restore(null);
  assert.equal(pref.walkClose, false);
  pref.act('walkClose', 0);
  assert.equal(pref.Application.Storage.getValue('preferences').walkClose, true);
});
test('A flat step counter delays the close; a rising one confirms the shorter walk', () => {
  const [flat, flatState] = libreWalker();
  flat.Toybox.ActivityMonitor = {getInfo: () => ({steps: 20})};
  gait(flat, 7000, 500, 120);
  assert.equal(flatState.ends.length, 0, 'six seconds with a flat pedometer');
  gait(flat, 11000, 500, 120, 7000);
  assert.equal(flatState.ends.length, 1, 'eight seconds of cadence still closes');
  const [up, upState] = libreWalker();
  let steps = 0;
  up.Toybox.ActivityMonitor = {getInfo() { steps += 5; return {steps}; }};
  gait(up, 7000, 500, 120);
  assert.equal(upState.ends.length, 1);
  assert.equal(upState.ends[0].reason, 'walk');
});
test('A fresh launch keeps the last setup and does not count an arrow before START', () => {
  const s = training();
  s.app.live = false;
  s.act('mode', 'Outdoor');
  s.act('profile', 'Compuesto');
  s.act('manual', 0);
  assert.equal(s.events.length, 0);
  assert.equal(s.rows.length, 0);
  assert.equal(s.mode, 'Outdoor');
  assert.equal(s.target, 6);
  assert.equal(s.profile, 'Compuesto');
  assert.equal(s.Application.Storage.getValue('preferences').mode, 'Outdoor');
  assert.equal(s.Application.Storage.getValue('preferences').profile, 'Compuesto');
  s.restore(null);
  assert.equal(s.mode, 'Outdoor');
  assert.equal(s.profile, 'Compuesto');
  assert.deepEqual(s.readyLine().slice(0, 3), ['Outdoor', '6 flechas', 'Compuesto']);
  assert.equal(s.readyLine()[3], 'Sin calibrar');
  s.Application.Storage.setValue('threshold:Compuesto', 700);
  assert.equal(s.readyLine()[3], 'Calibrado 700');
  s.act('mode', 'Libre');
  assert.equal(s.readyLine()[1], 'sin limite');
});
test('An indoor round is ten sets and finishes once, without changing a free session', () => {
  const s = training();
  s.act('mode', 'TandaIndoor');
  assert.equal(s.mode, 'Indoor');
  assert.equal(s.tanda, true);
  assert.equal(s.target, 3);
  assert.equal(s.roundGoal(), 10);
  assert.equal(s.Application.Storage.getValue('preferences').tanda, true);
  assert.deepEqual(s.readyLine().slice(0, 2), ['Tanda indoor', '10 sets · 3 flechas']);
  for (let i = 0; i < 29; i++) s.add({t: 1000 + i * 1000, score: 80, peak: 1, instab: 1, settle: 1});
  assert.equal(s.roundDone, false);
  assert.equal(s.closedSets(), 9);
  assert.equal(s.notes.length, 0);
  s.add({t: 40000, score: 80, peak: 1, instab: 1, settle: 1});
  assert.equal(s.roundDone, true);
  assert.equal(s.closedSets(), 10);
  assert.equal(s.notes.at(-1), 'Tanda 10/10');
  assert.equal(s.buzzes.at(-1), 'round');
  assert.equal(s.snapshot().roundDone, true);
  const noted = s.notes.length;
  s.add({t: 50000, score: 80, peak: 1, instab: 1, settle: 1});
  assert.equal(s.roundDone, true);
  assert.equal(s.notes.length, noted);
  s.act('undo', 0);
  assert.equal(s.roundDone, true);
  const fresh = training();
  fresh.act('mode', 'TandaIndoor');
  for (let i = 0; i < 30; i++) fresh.add({t: 1000 + i * 1000, score: 80, peak: 1, instab: 1, settle: 1});
  assert.equal(fresh.roundDone, true);
  fresh.act('undo', 0);
  assert.equal(fresh.roundDone, false);
  assert.equal(fresh.resting, false);
  fresh.act('mode', 'Libre');
  assert.equal(fresh.tanda, false);
  assert.equal(fresh.target, 0);
  fresh.restore(null);
  assert.equal(fresh.tanda, false);
  const outdoor = training();
  outdoor.act('mode', 'TandaOutdoor');
  assert.equal(outdoor.roundGoal(), 6);
  assert.equal(outdoor.target, 6);
  assert.equal(outdoor.readyLine()[0], 'Tanda aire libre');
  for (let i = 0; i < 6; i++) outdoor.add({t: 1000 + i * 1000, score: 70, peak: 1, instab: 1, settle: 1});
  assert.equal(outdoor.closedSets(), 1);
  assert.equal(outdoor.roundDone, false);
  outdoor.act('mode', 'Indoor');
  assert.equal(outdoor.tanda, false);
  assert.equal(outdoor.target, 3);
});
test('A half session resumes and a watch without one stays on the launcher', () => {
  const s = watch();
  assert.equal(s.shouldResume(null), false);
  assert.equal(s.shouldResume({}), false);
  assert.equal(s.shouldResume({sid: '', rows: [], state: {ends: [], calibrating: false}}), false);
  assert.equal(s.shouldResume({sid: '9', rows: [], state: {ends: [], calibrating: false}}), true);
  assert.equal(s.shouldResume({sid: '9', rows: [[10, 1]], state: {ends: []}}), true);
  assert.equal(s.shouldResume({rows: [], state: {calibrating: true, ends: []}}), true);
  assert.equal(s.shouldResume({rows: [], state: {ends: [{id: 1}], calibrating: false}}), true);
});
test('Before START the phone can set the bow and a shot command waits', () => {
  const s = load('watchapp/source/ArcheryApp.mc', 'ArcheryApp', ['onPhone', 'note', 'clearNote']);
  const state = training();
  const replies = [];
  state.app.live = false;
  state.save = () => {};
  Object.assign(s, {live: false, Dictionary: Dict, String: Text, CommandListener: function() {}, Communications: {transmit: r => replies.push(r)}, finishPending() {}, training: state, sid: 'pending'});
  s.onPhone({data: {sid: 'other', cid: 1, client: 'phone', action: 'profile', value: 'Olímpico 38'}});
  assert.equal(state.profile, 'Olímpico 38');
  assert.equal(state.events.length, 0);
  assert.equal(state.Application.Storage.getValue('preferences').profile, 'Olímpico 38');
  assert.equal(replies[0].commandAck, 1);
  assert.equal(replies[0].error, undefined);
  s.onPhone({data: {sid: 'other', cid: 2, client: 'phone', action: 'manual', value: 0}});
  assert.equal(state.rows.length, 0);
  assert.equal(replies[1].error, 'Pulsa START en el reloj');
  state.app.live = true;
  s.live = true;
  s.onPhone({data: {sid: 'pending', cid: 3, client: 'phone', action: 'mode', value: 'Indoor'}});
  assert.equal(state.mode, 'Indoor');
  assert.equal(state.target, 3);
  assert.equal(state.events.at(-1).kind, 'state');
});
test('The queue warns as it fills and a phone ack is the only fresh link', () => {
  const s = load('watchapp/source/ArcheryApp.mc', 'ArcheryApp', ['enqueue', 'note', 'clearNote', 'noticeLive', 'noteBacklog', 'pending', 'linkFresh', 'linkLabel', 'linkHot', 'onPhone']);
  s.Dictionary = Dict;
  s.String = Text;
  s.CommandListener = function() {};
  s.Communications = {transmit() {}};
  s.finishPending = () => {};
  s.flush = () => {};
  s.training = {commandClient: '', lastCommand: 0, save() {}, act() {}};
  s.sid = 'a';
  s.System.getTimer = () => 5000;
  for (let i = 0; i < 14; i++) s.enqueue({event: {sid: 'a', kind: 'shot'}});
  assert.equal(s.pending(), 14);
  assert.equal(s.notice, null);
  assert.equal(s.linkLabel(), '14!');
  assert.equal(s.linkHot(), true);
  assert.equal(s.linkFresh(), false);
  s.enqueue({event: {sid: 'a', kind: 'shot'}});
  assert.equal(s.pending(), 15);
  assert.equal(s.notice, 'Cola 15/25');
  assert.equal(s.noticeHold, true);
  assert.equal(s.linkLabel(), '15/25');
  assert.equal(s.err, null);
  s.Application.Storage.setValue('queued0', {event: {sid: 'a', kind: 'shot'}});
  s.onPhone({data: {ack: 0, sid: 'a'}});
  assert.equal(s.pending(), 14);
  assert.equal(s.lastAckAt, 5000);
  assert.equal(s.linkFresh(), true);
  assert.equal(s.notice, null);
  assert.equal(s.linkLabel(), '14');
  s.System.getTimer = () => 25000;
  assert.equal(s.linkFresh(), false);
  assert.equal(s.linkLabel(), '14!');
  s.qHead = s.qTail;
  assert.equal(s.linkLabel(), '·');
  s.lastAckAt = 24000;
  s.System.getTimer = () => 25000;
  assert.equal(s.linkLabel(), 'ok');
});
process.exitCode=failures?1:0;
