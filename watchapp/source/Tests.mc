import Toybox.Test;
import Toybox.Lang;

(:test)
class TrainingHarness {
    public var sid="test", t0=0, nShots=0, messages=[];
    function emit(msg) {messages.add(msg);}
    function finishPending() {}
}
(:test)
class SensorHarness {
    public var paused=false, resting=false, calibration=false, threshold=3200.0, pose=null, messages=[];
    function add(msg) {messages.add(msg);}
}
(:test)
function calibrationWithoutOpeningTest(logger) {
    var owner=new TrainingHarness();var state=new TrainingState(owner);state.feedback=false;state.calibration=true;
    var detector=new ArcheryApp();detector.training=state;detector.configureRate(25);
    for(var t=0;t<=14000;t+=40){detector.sample(0.0,0.0,t==2000 || t==6000 || t==10000?4000.0:1000.0,t.toFloat());}
    Test.assertEqual(state.snapshot()["calibrationCount"],3);Test.assert(state.calibration);Test.assertEqual(state.total(),0);
    state.act("calibrateShot",{"peak"=>owner.messages[1]["peak"],"profile"=>"Recurvo","requestId"=>"selected"});Test.assert(!state.calibration);
    return true;
}
(:test)
function trainingStateTest(logger) {
    var app=new TrainingHarness();var state=new TrainingState(app);state.feedback=false;state.target=3;
    state.add({"t"=>100});state.act("close",0);state.act("next",0);
    Test.assert(!state.resting);Test.assertEqual(state.currentSet,1);
    state.add({"t"=>200});state.add({"t"=>300});
    Test.assert(state.resting);Test.assertEqual(state.count(),3);Test.assertEqual(state.ends.size(),1);
    state.act("reopen",0);Test.assert(!state.resting);Test.assertEqual(state.ends.size(),0);
    state.act("close",0);state.act("next",0);state.add({"t"=>400});
    Test.assertEqual(state.currentSet,2);Test.assertEqual(state.count(),1);
    state.act("remove",[200]);Test.assertEqual(state.rows.size(),3);Test.assertEqual(state.rows[1][1],1);
    state.act("split",300);Test.assert(state.rows[1][1]!=state.rows[0][1]);
    state.act("merge",state.rows[1][1]);Test.assertEqual(state.rows[1][1],state.rows[0][1]);
    return true;
}
(:test)
function detectorTest(logger) {
    var app=new ArcheryApp();var sink=new SensorHarness();app.training=sink;app.configureRate(100);
    for(var t=0;t<=4500;t+=10) {
        var z=t==2000?5000.0:1000.0;
        app.sample(t>=1000?400.0:0.0,0.0,z,t.toFloat());
    }
    Test.assertEqual(sink.messages.size(),1);Test.assertEqual(sink.messages[0]["t"],2000.0);
    Test.assert(sink.messages[0]["peak"]>=3900);Test.assert(sink.messages[0]["settle"]>=50);
    // The same impulse while paused must not create a second shot.
    sink.paused=true;
    for(var u=4510;u<=8000;u+=10) {app.sample(0.0,0.0,u==6000?5000.0:1000.0,u.toFloat());}
    Test.assertEqual(sink.messages.size(),1);
    return true;
}
(:test)
function releasePrecursorTest(logger) {
    var app=new ArcheryApp();var sink=new SensorHarness();sink.threshold=1320.0;app.training=sink;app.configureRate(100);
    for(var t=0;t<=4500;t+=10){app.sample(t>=1000?400.0:0.0,0.0,t==2000?1500.0:(t==2010?5000.0:1000.0),t.toFloat());}
    Test.assertEqual(sink.messages.size(),1);Test.assertEqual(sink.messages[0]["t"],2000.0);return true;
}
