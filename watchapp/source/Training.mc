import Toybox.Application;
import Toybox.WatchUi;
import Toybox.System;
import Toybox.Time;
import Toybox.Attention;
import Toybox.Lang;

class TrainingState {
    public var target=3, currentSet=1, resting=false, paused=false, feedback=true, mode="Indoor";
    public var profile="Recurvo", rows=[], ends=[], started=0, lastCommand=0, commandClient="";
    public var calibration=false, positive=[], threshold=3200.0, pose=null;
    public var app;
    function initialize(owner) { app=owner; started=Time.now().value(); }
    function count() { var n=0; for(var i=0;i<rows.size();i++) { if(rows[i][1]==currentSet){n++;} } return n; }
    function nextId() {var id=currentSet;for(var i=0;i<rows.size();i++){if(rows[i][1]>id){id=rows[i][1];}}return id+1;}
    function displaySet() {var n=0,prev=-1;for(var i=0;i<rows.size();i++){if(rows[i][1]!=prev){n++;prev=rows[i][1];}if(prev==currentSet){return n;}}return n+1;}
    function snapshot() { return {"target"=>target,"currentSet"=>currentSet,"resting"=>resting,"paused"=>paused,"ends"=>ends,"profile"=>profile,"mode"=>mode,"metric"=>2,"calibrating"=>calibration,"calibrationCount"=>positive.size()}; }
    function record() { return {"sid"=>app.sid,"started"=>started,"state"=>snapshot(),"rows"=>rows,"lastCommand"=>lastCommand,"commandClient"=>commandClient,"feedback"=>feedback}; }
    function save() { try { Application.Storage.setValue("training",record()); } catch (e instanceof Lang.Exception) {} }
    function restore(saved) {
        var preferences=Application.Storage.getValue("preferences");
        if(preferences instanceof Lang.Dictionary){target=preferences["target"];profile=preferences["profile"];feedback=preferences["feedback"];if(preferences.hasKey("mode")){mode=preferences["mode"];}}
        if(saved instanceof Lang.Dictionary) {
            app.sid=saved["sid"]; started=saved["started"]; rows=saved["rows"]; lastCommand=saved["lastCommand"];
            var s=saved["state"] as Lang.Dictionary; target=s["target"];currentSet=s["currentSet"];resting=s["resting"];paused=s["paused"];ends=s["ends"];profile=s["profile"];if(s.hasKey("mode")){mode=s["mode"];}
            feedback=saved["feedback"];if(saved.hasKey("commandClient")){commandClient=saved["commandClient"];}
        }
        if(profile.equals("Recurvo / arco") || profile.equals("Recurvo / cuerda")){profile="Recurvo";}  // perfiles antiguos -> tipo de arco
        if(profile.equals("Compuesto / arco") || profile.equals("Compuesto / cuerda")){profile="Compuesto";}
        paused=false;  // una sesion nueva nunca hereda el bloqueo del detector: si no, ninguna flecha dispara
        resting=target>0 && count()>=target;
        var value=Application.Storage.getValue("threshold:"+profile); if(value!=null){threshold=value;}
        pose=Application.Storage.getValue("pose:"+profile);
    }
    function buzz() { if(feedback && Attention has :vibrate) { Attention.vibrate([new Attention.VibeProfile(45,resting?240:80)]); } }
    function emit(kind, payload) { payload["kind"]=kind; payload["state"]=snapshot(); app.emit(payload); WatchUi.requestUpdate(); }
    function close(reason,id) {
        if(id==0){id=currentSet;}var n=0;
        for(var i=0;i<rows.size();i++){if(rows[i][1]==id){n++;}}
        for(var j=0;j<ends.size();j++){if(ends[j]["id"]==id){return;}}
        if(n==0 || (target>0 && n<target)){return;}ends.add({"id"=>id,"reason"=>reason});if(id==currentSet){resting=true;}
        emit("set",{});buzz();
    }
    function add(msg) {
        if(resting) { currentSet=nextId(); resting=false; }
        msg["set"]=currentSet;msg["profile"]=profile;msg["metric"]=2;
        rows.add([msg["t"].toNumber(),currentSet]); app.nShots=rows.size();
        if(target>0 && count()>=target){ends.add({"id"=>currentSet,"reason"=>"target"});resting=true;}
        emit("shot",msg);buzz();
    }
    function calibrateShot(p as Float, orientation) as Void {
        if(positive.size()==0){pose=orientation;}else{for(var k=0;k<3;k++){pose[k]=(pose[k]*positive.size()+orientation[k])/(positive.size()+1);}}
        if(pose.size()>3 && orientation.size()>3 && orientation[3]>pose[3]){pose[3]=orientation[3];}
        positive.add(p);buzz();
        if(positive.size()>=3) {
            var a1=positive[0],b1=positive[1],c1=positive[2];
            var m=a1>b1 ? (a1>c1 ? (b1>c1?b1:c1) : a1) : (a1>c1 ? a1 : (b1>c1?c1:b1));  // mediana de 3: un valor raro no desordena el umbral
            var weakest=a1<b1?(a1<c1?a1:c1):(b1<c1?b1:c1);
            if(m>1000.0) {threshold=weakest*0.6;if(threshold<900){threshold=900.0;}Application.Storage.setValue("threshold:"+profile,threshold);Application.Storage.setValue("pose:"+profile,pose);calibration=false;emit("calibration",{"result"=>"Calibrado: postura y suelta"});return;}
            positive=[];emit("calibration",{"result"=>"Senales debiles: repetir calibracion"});
        } else { emit("state",{}); }
    }
    function act(action,value) {
        if(action.equals("split") || action.equals("merge")) {
            var index=-1;
            for(var p=0;p<rows.size();p++){if((action.equals("split") && rows[p][0]==value) || (action.equals("merge") && rows[p][1]==value)){index=p;break;}}
            if(index>=0 && (action.equals("split") || index>0)) {
                var old=rows[index][1];var dest=action.equals("split")?nextId():rows[index-1][1];
                for(var q=index;q<rows.size();q++){if(rows[q][1]==old){rows[q][1]=dest;}}
                if(action.equals("split")){ends.add({"id"=>old,"reason"=>"split"});}
                if(action.equals("merge")){for(var r=ends.size()-1;r>=0;r--){if(ends[r]["id"]==old){ends.remove(ends[r]);}}}
                if(currentSet==old){currentSet=dest;resting=false;}
                emit("layout",{"layout"=>rows});
            }
            return;
        }
        if(action.equals("close")) { close("manual",value);return; }
        if(action.equals("next")) { if(target>0 && count()<target){return;}if(!resting && count()>0){ends.add({"id"=>currentSet,"reason"=>"manual"});}currentSet=nextId();resting=false;paused=false; }
        if(action.equals("reopen")) {var id=value==0?currentSet:value;for(var i=ends.size()-1;i>=0;i--){if(ends[i]["id"]==id){ends.remove(ends[i]);}}if(id==currentSet){resting=false;} }
        if(action.equals("pause")){paused=!paused;}
        if(action.equals("mode")) { mode=value;if(value.equals("Indoor")){target=3;}if(value.equals("Outdoor")){target=6;}if(value.equals("Libre")){target=0;} }
        if(action.equals("target")){target=value.toNumber();}
        if(action.equals("feedback")){feedback=!feedback;}
        if(action.equals("profile")) { profile=value;var v=Application.Storage.getValue("threshold:"+profile);threshold=v==null?3200.0:v;pose=Application.Storage.getValue("pose:"+profile);calibration=false;positive=[]; }
        if(action.equals("manual")) { add({"t"=>System.getTimer()-app.t0,"manual"=>true,"score"=>0,"peak"=>0,"instab"=>0,"settle"=>-1});return; }
        if(action.equals("undo") && calibration && positive.size()>0) { positive.remove(positive[positive.size()-1]);emit("state",{});return; }
        if(action.equals("undo") || action.equals("remove")) {
            var times=action.equals("undo")?(rows.size()>0?[rows[rows.size()-1][0]]:[]):value;
            for(var j=rows.size()-1;j>=0;j--) {for(var k=0;k<times.size();k++) {if(rows[j][0]==times[k]){rows.remove(rows[j]);break;}}}
            if(target>0 && count()<target){resting=false;for(var e=ends.size()-1;e>=0;e--){if(ends[e]["id"]==currentSet){ends.remove(ends[e]);}}}
            app.nShots=rows.size();emit("remove",{"times"=>times});return;
        }
        if(action.equals("calibrate")) { calibration=!calibration;positive=[];pose=Application.Storage.getValue("pose:"+profile);if(calibration){paused=false;} }
        if(action.equals("probe")) { app.runSensorProbe();return; }
        if(action.equals("finish")) { app.finishActivity();return; }
        if(action.equals("exit")) {System.exit();return;}
        if(action.equals("mode") || action.equals("target") || action.equals("profile") || action.equals("feedback")){Application.Storage.setValue("preferences",{"target"=>target,"profile"=>profile,"feedback"=>feedback,"mode"=>mode});}
        emit("state",{});
    }
}

class TrainingMenu extends WatchUi.Menu2InputDelegate {
    function initialize() { Menu2InputDelegate.initialize(); }
    function onSelect(item) {
        var a=Application.getApp();var id=item.getId();WatchUi.popView(WatchUi.SLIDE_IMMEDIATE);
        if(id[0].equals("more")){openMoreMenu();return;}
        if(!id[0].equals("wait")){a.finishPending();a.training.act(id[0],id[1]);}
    }
}
function pushMenu(items) {
    var menu=new WatchUi.Menu2({:title=>"ArcheryWatch"});
    for(var i=0;i<items.size();i++){
        var it=items[i];
        var sub=it.size()>3?it[1]:null;
        menu.addItem(new WatchUi.MenuItem(it[0],sub,[it[it.size()-2],it[it.size()-1]],null));
    }
    WatchUi.pushView(menu,new TrainingMenu(),WatchUi.SLIDE_UP);
}
function openTrainingMenu() {
    var a=Application.getApp();var t=a.training;
    var items=[[t.paused?"Reanudar":"Pausar","pause",0],[t.resting?"Siguiente tanda":"Cerrar tanda",t.resting?"next":"close",0],
        ["Deshacer ultima flecha","undo",0],["Mas opciones","more",0],["Guardar y salir","finish",0]];
    if(a.closing){items=[["Seguir sincronizando","wait",0],["Salir sin conexion","exit",0]];}
    pushMenu(items);
}
function openMoreMenu() {
    var t=Application.getApp().training;
    var items=[["Anadir flecha manual","manual",0],["Reabrir tanda","reopen",0],
        ["Modo Indoor (3 flechas)","mode","Indoor"],["Modo Outdoor (6 flechas)","mode","Outdoor"],["Modo libre","mode","Libre"],
        ["Recurvo","profile","Recurvo"],["Compuesto","profile","Compuesto"],
        ["Vibracion: "+(t.feedback?"si":"no"),"feedback",0],["Diagnostico sensores","probe",0],[t.calibration?"Salir calibracion":"Calibrar: 3 tiros","calibrate",0]];
    pushMenu(items);
}
