// Executes the actual numeric Monkey C method bodies with small Toybox shims.
// Complements compilation; it does not emulate the Garmin VM or sensor hardware.
const fs=require('node:fs'), assert=require('node:assert/strict');
Number.prototype.toNumber=function(){return Math.trunc(this);};
String.prototype.equals=function(other){return String(this)===other;};
Array.prototype.remove=function(value){const i=this.indexOf(value);if(i>=0)this.splice(i,1);};
const convert=s=>s.replace(/\s+as\s+(?:Array<Float>|Float|Number|Boolean|Void|Array)/g,'').replace(/new \[([^\]]+)\]/g,'Array($1).fill(0)').replace(/\.size\(\)/g,'.length').replace(/(?<!training)\.add\(/g,'.push(').replace(/\.toFloat\(\)/g,'').replace(/=>/g,':');
function body(source,name){
  const start=source.indexOf('{',source.indexOf('function '+name+'('));let depth=1,end=start+1;
  while(depth){if(source[end]==='{')depth++;if(source[end]==='}')depth--;end++;}
  return source.slice(start+1,end-1);
}
function load(file,klass,names){
  const source=fs.readFileSync(file,'utf8').split('class '+klass+' ')[1], env={Math,Toybox:{Timer:{Timer:function(){}}},WatchUi:{requestUpdate(){}},Application:{Storage:{setValue(){}}}};
  for(const match of source.slice(0,source.indexOf('function initialize')).matchAll(/(?:private|public) var ([^;]+);/g)){
    const declaration=convert(match[1]);
    const names=[...declaration.matchAll(/(?:^|,)\s*(\w+)\s*(?:=|$)/g)].map(m=>m[1]);
    Function('env','with(env){var '+declaration+';Object.assign(env,{'+names.join(',')+'});}')(env);
  }
  for(const name of names){
    const args=source.match(new RegExp('function '+name+'\\(([^)]*)'))[1].replace(/\s+as\s+[\w<>]+/g,'');
    env[name]=Function('env','return function('+args+'){with(env){'+convert(body(source,name))+'}}')(env);
  }
  return env;
}
const watch=()=>load('watchapp/source/ArcheryApp.mc','ArcheryApp',['configureRate','sample','preStable','trigger','finalize','decimate','subArray','diffArray','mean','pstdev','clamp']);
const training=()=>{const s=load('watchapp/source/Training.mc','TrainingState',['count','nextId','snapshot','close','calibrateShot','act']);s.app={};s.events=[];s.emit=(kind,payload)=>s.events.push({kind,...payload});s.buzz=()=>{};return s;};
let failures=0;
function test(name,run){try{run();console.log('PASS',name);}catch(e){failures++;console.error('FAIL',name,e.message);}}
test('Incomplete three-arrow end cannot close',()=>{const s=training();s.target=3;s.rows=[[100,1]];s.close('manual',0);assert.equal(s.resting,false);assert.equal(s.ends.length,0);});
test('Next cannot skip an incomplete end; undo reopens the current end',()=>{const s=training();s.rows=[[100,1],[200,1]];s.act('next',0);assert.equal(s.currentSet,1);s.rows.push([300,1]);s.close('manual',0);assert.equal(s.resting,true);s.act('undo',0);assert.equal(s.resting,false);assert.equal(s.ends.length,0);});
test('Calibration progress is published after each arrow',()=>{const s=training();s.calibration=true;s.calibrateShot(4000,[0,0,1000]);assert.equal(s.snapshot().calibrationCount,1);});
test('Trace preserves opening eight seconds before release',()=>{const s=watch();s.training={paused:false,calibration:false,threshold:3200,add:m=>s.message=m};s.configureRate(100);
  for(let t=0;t<=14000;t+=10)s.sample(t>=2000 && t<5000?400:0,0,t===12000?5000:1000,t);
  assert.ok(s.message.trace_t[0]<=-8000,JSON.stringify(s.message.trace_t));assert.ok(s.message.tx.some(x=>x>200));});
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
test('Calibration accommodates a weaker release without follow-through inflating peak',()=>{const state=training();state.calibration=true;[4000,2200,3800].forEach(p=>state.calibrateShot(p,[0,0,1000]));assert.equal(state.threshold,1320);assert.equal(state.calibration,false);
  const s=watch(), shots=[];s.training={paused:false,calibration:false,threshold:state.threshold,add:m=>shots.push(m)};s.configureRate(100);
  for(let t=0;t<=5000;t+=10)s.sample(t>=1000?400:0,0,t===2000?2500:t===2500?8000:1000,t);
  assert.equal(shots.length,1);assert.ok(shots[0].peak>1400 && shots[0].peak<1600);
});
test('Legacy arrows stay together through long pauses, then start a new trio',()=>{
  const html=fs.readFileSync('mobile/index.html','utf8'), identify=Function('shots',body(html,'identifySets'));
  const shots=[0,90000,180000,270000].map(t_ms=>({t_ms}));identify(shots);assert.deepEqual(shots.map(s=>s.set_id),[0,0,0,270000]);
  shots.splice(1,1);identify(shots);assert.deepEqual(shots.map(s=>s.set_id),[0,0,270000]);
});
test('Calibration accepts three releases without a recognised opening',()=>{
  for(const rate of [25,50,100]){const s=watch(), state=training();state.calibration=true;s.training=state;s.configureRate(rate);
    for(let t=0;t<=14000;t+=1000/rate)s.sample(0,0,[2000,6000,10000].includes(t)?4000:1000,t);
    assert.equal(state.positive.length,3);assert.equal(state.calibration,false);assert.ok(state.pose.every(Number.isFinite));}
});
test('Calibration tolerates aiming sway before learning posture',()=>{
  const s=watch(), state=training();state.calibration=true;s.training=state;s.configureRate(100);
  for(let t=0;t<=5000;t+=10)s.sample(160*Math.sin(t/100),0,t===2000?4000:1000,t);
  assert.equal(state.positive.length,1);
});
test('Calibration still rejects slow motion and sustained shaking',()=>{
  for(const shake of [false,true]){const s=watch(), state=training();state.calibration=true;s.training=state;s.configureRate(100);
    for(let t=0;t<=6000;t+=10)s.sample(300*Math.sin(t/1000),0,shake&&t>=2000&&t<2700?5000:1000,t);
    assert.equal(state.positive.length,0);}
});
test('Same six cycles: three calibrations followed by three training arrows',()=>{
  for(const rate of [25,50,100]){const s=watch(), state=training(), shots=[];state.calibration=true;state.add=m=>shots.push(m);s.training=state;s.configureRate(rate);
    for(let t=0;t<=36500;t+=1000/rate){const phase=t%6000;const x=phase<2000?600*Math.sin(phase/400):phase<4300?400+160*Math.sin(phase/100):0;s.sample(x,0,phase===4000?4000:1000,t);}
    assert.equal(state.positive.length,3);assert.equal(shots.length,3,'Training must accept the same calibrated movement');
    for(let t=36600;t<=46600;t+=1000/rate)s.sample(600*Math.sin(t/180),0,t%600===0?3500:1000,t);
    assert.equal(shots.length,3,'Walking after real calibration must not add arrows');}
});
process.exitCode=failures?1:0;




