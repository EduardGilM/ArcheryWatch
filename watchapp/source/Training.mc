import Toybox.Application;
import Toybox.WatchUi;
import Toybox.System;
import Toybox.Time;
import Toybox.Attention;
import Toybox.Lang;

class TrainingState {
    public var target=3, currentSet=1, resting=false, paused=false, feedback=true, walkClose=true, mode="Indoor";
    public var profile="Recurvo", rows=[], ends=[], started=0, lastCommand=0, commandClient="";
    public var calibration=false, threshold=3200.0, pose=null;
    public var app;
    function initialize(owner) { app=owner; started=Time.now().value(); }
    function count() { var n=0; for(var i=0;i<rows.size();i++) { if(rows[i][1]==currentSet){n++;} } return n; }
    function total() { var n=0;for(var i=0;i<rows.size();i++){if(rows[i][1]>0){n++;}}return n; }
    function nextId() {var id=currentSet;for(var i=0;i<rows.size();i++){if(rows[i][1]>id){id=rows[i][1];}}return id+1;}
    function displaySet() {var n=0,prev=-1;for(var i=0;i<rows.size();i++){if(rows[i][1]<0){continue;}if(rows[i][1]!=prev){n++;prev=rows[i][1];}if(prev==currentSet){return n;}}return n+1;}
    function snapshot() { return {"target"=>target,"currentSet"=>currentSet,"resting"=>resting,"paused"=>paused,"ends"=>ends,"profile"=>profile,"mode"=>mode,"metric"=>2,"calibrating"=>calibration,"calibrationCount"=>rows.size()-total()}; }
    function record() { return {"sid"=>app.sid,"started"=>started,"state"=>snapshot(),"rows"=>rows,"lastCommand"=>lastCommand,"commandClient"=>commandClient,"feedback"=>feedback,"walkClose"=>walkClose}; }
    function save() { try { Application.Storage.setValue("training",record()); } catch (e instanceof Lang.Exception) {app.note("No se pudo guardar la sesion", "save", false);} }
    function restore(saved) {
        var preferences=Application.Storage.getValue("preferences");
        if(preferences instanceof Lang.Dictionary){target=preferences["target"];profile=preferences["profile"];feedback=preferences["feedback"];if(preferences.hasKey("mode")){mode=preferences["mode"];}if(preferences.hasKey("walkClose")){walkClose=preferences["walkClose"];}}
        if(saved instanceof Lang.Dictionary) {
            app.sid=saved["sid"]; started=saved["started"]; rows=saved["rows"]; lastCommand=saved["lastCommand"];
            var s=saved["state"] as Lang.Dictionary; target=s["target"];currentSet=s["currentSet"];resting=s["resting"];paused=s["paused"];ends=s["ends"];profile=s["profile"];if(s.hasKey("mode")){mode=s["mode"];}
            feedback=saved["feedback"];if(saved.hasKey("walkClose")){walkClose=saved["walkClose"];}if(saved.hasKey("commandClient")){commandClient=saved["commandClient"];}
            if(s.hasKey("calibrating")){calibration=s["calibrating"];}
        }
        if(profile.equals("Recurvo / arco") || profile.equals("Recurvo / cuerda")){profile="Recurvo";}  // perfiles antiguos -> tipo de arco
        if(profile.equals("Compuesto / arco") || profile.equals("Compuesto / cuerda")){profile="Compuesto";}
        paused=false;  // una sesion nueva nunca hereda el bloqueo del detector: si no, ninguna flecha dispara
        resting=target>0 && count()>=target;
        var value=Application.Storage.getValue("threshold:"+profile); if(value!=null){threshold=value;}
        pose=Application.Storage.getValue("pose:"+profile);
    }
    function buzz() { if(feedback && Attention has :vibrate) { Attention.vibrate([new Attention.VibeProfile(45,resting?240:80)]); } }
    function buzzSoft() { if(feedback && Attention has :vibrate) { Attention.vibrate([new Attention.VibeProfile(25,120)]); } }
    function emit(kind, payload) { payload["kind"]=kind; payload["state"]=snapshot(); app.emit(payload); WatchUi.requestUpdate(); }
    function close(reason,id) {
        if(id==0){id=currentSet;}var n=0;
        for(var i=0;i<rows.size();i++){if(rows[i][1]==id){n++;}}
        for(var j=0;j<ends.size();j++){if(ends[j]["id"]==id){return;}}
        if(n==0 || (target>0 && n<target)){return;}ends.add({"id"=>id,"reason"=>reason});if(id==currentSet){resting=true;}
        emit("set",{"reason"=>reason});
        if(reason.equals("walk")){buzzSoft();if(app has :note){app.note("Tanda cerrada", "walk", false);}}
        else {buzz();}
    }
    function add(msg) {
        var candidate=msg.hasKey("candidate") && msg["candidate"];
        if(!candidate && resting) { currentSet=nextId(); resting=false; }
        msg["set"]=candidate?-1:currentSet;msg["profile"]=profile;msg["metric"]=2;
        rows.add([msg["t"].toNumber(),msg["set"]]); app.nShots=total();
        if(!candidate && target>0 && count()>=target){ends.add({"id"=>currentSet,"reason"=>"target"});resting=true;}
        emit("shot",msg);buzz();
    }
    function validProfile(value) {return value instanceof Lang.String && value.length()>0 && value.length()<=24;}
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
        if(action.equals("calibrateShot")) {
            var request=(value instanceof Lang.Dictionary?value:{"peak"=>0.0,"profile"=>"","requestId"=>""}) as Lang.Dictionary;
            var p=request["peak"], dest=request["profile"], requestId=request["requestId"];
            var numeric=p instanceof Lang.Number || p instanceof Lang.Float || p instanceof Lang.Long || p instanceof Lang.Double;
            if(!numeric || !(p>150 && p<=100000) || !validProfile(dest) || !(requestId instanceof Lang.String)) {
                emit("calibration",{"requestId"=>requestId,"applied"=>false,"result"=>"Pico o perfil de calibracion no valido"});return;
            }
            var orientation=request.hasKey("pose")?request["pose"]:null;
            if(orientation!=null) {
                if(!(orientation instanceof Lang.Array) || (orientation.size()!=3 && orientation.size()!=4)){emit("calibration",{"requestId"=>requestId,"applied"=>false,"result"=>"Postura no valida"});return;}
                for(var k=0;k<3;k++){var v=orientation[k];if(!(v instanceof Lang.Number || v instanceof Lang.Float || v instanceof Lang.Long || v instanceof Lang.Double) || !(v>=-2000 && v<=2000)){emit("calibration",{"requestId"=>requestId,"applied"=>false,"result"=>"Postura no valida"});return;}}
                if(orientation.size()==4){var noise=orientation[3];if(!(noise instanceof Lang.Number || noise instanceof Lang.Float || noise instanceof Lang.Long || noise instanceof Lang.Double) || !(noise>=0 && noise<=4000000)){emit("calibration",{"requestId"=>requestId,"applied"=>false,"result"=>"Estabilidad no valida"});return;}}
                var norm=orientation[0]*orientation[0]+orientation[1]*orientation[1]+orientation[2]*orientation[2];if(!(norm>=250000 && norm<=2250000)){emit("calibration",{"requestId"=>requestId,"applied"=>false,"result"=>"Postura no valida"});return;}
            }
            var nextThreshold=Math.floor(p*0.35+0.5);if(nextThreshold<90){nextThreshold=90.0;}
            Application.Storage.setValue("threshold:"+dest,nextThreshold);
            if(orientation==null){Application.Storage.deleteValue("pose:"+dest);}else{Application.Storage.setValue("pose:"+dest,orientation);}
            if(dest.equals(profile)){threshold=nextThreshold;pose=orientation;calibration=false;}
            emit("calibration",{"requestId"=>requestId,"applied"=>true,"profile"=>dest,"threshold"=>nextThreshold,
                "result"=>dest+": "+nextThreshold.toNumber()+" mG"+(dest.equals(profile)?" aplicado":" guardado; selecciona este arco en el movil")});return;
        }
        if(action.equals("deleteProfile")) {
            if(!validProfile(value)){return;}
            Application.Storage.deleteValue("threshold:"+value);Application.Storage.deleteValue("pose:"+value);
            if(value.equals(profile)){profile="Recurvo";var fallback=Application.Storage.getValue("threshold:"+profile);threshold=fallback==null?3200.0:fallback;pose=Application.Storage.getValue("pose:"+profile);calibration=false;}
        }
        if(action.equals("threshold")) {
            var numeric=value instanceof Lang.Number || value instanceof Lang.Float || value instanceof Lang.Long || value instanceof Lang.Double;
            if(!numeric || !(value>0 && value<=60000)){emit("calibration",{"applied"=>false,"result"=>"Umbral no valido"});return;}
            var nextThreshold=value<90?90.0:value.toFloat();Application.Storage.setValue("threshold:"+profile,nextThreshold);
            threshold=nextThreshold;calibration=false;emit("calibration",{"result"=>"Umbral manual: "+threshold.toNumber()});return;
        }
        if(action.equals("feedback")){feedback=!feedback;}
        if(action.equals("walkClose")){walkClose=!walkClose;}
        if(action.equals("profile")) { if(!validProfile(value)){return;}profile=value;var v=Application.Storage.getValue("threshold:"+profile);threshold=v==null?3200.0:v;pose=Application.Storage.getValue("pose:"+profile);calibration=false; }
        if(action.equals("manual")) { add({"t"=>System.getTimer()-app.t0,"manual"=>true,"score"=>0,"peak"=>0,"instab"=>0,"settle"=>-1});return; }
        if(action.equals("undo") || action.equals("remove")) {
            var times=action.equals("undo")?(rows.size()>0?[rows[rows.size()-1][0]]:[]):value;
            for(var j=rows.size()-1;j>=0;j--) {for(var k=0;k<times.size();k++) {if(rows[j][0]==times[k]){rows.remove(rows[j]);break;}}}
            if(target>0 && count()<target){resting=false;for(var e=ends.size()-1;e>=0;e--){if(ends[e]["id"]==currentSet){ends.remove(ends[e]);}}}
            app.nShots=total();emit("remove",{"times"=>times});return;
        }
        if(action.equals("calibrate")) { calibration=!calibration;if(calibration){paused=false;} }
        if(action.equals("probe")) { app.runSensorProbe();return; }
        if(action.equals("finish")) { app.finishActivity();return; }
        if(action.equals("exit")) {System.exit();return;}
        if(action.equals("mode") || action.equals("target") || action.equals("profile") || action.equals("deleteProfile") || action.equals("feedback") || action.equals("walkClose")){Application.Storage.setValue("preferences",{"target"=>target,"profile"=>profile,"feedback"=>feedback,"walkClose"=>walkClose,"mode"=>mode});}
        emit("state",{});
    }
}

class TrainingMenu extends WatchUi.Menu2InputDelegate {
    function initialize() { Menu2InputDelegate.initialize(); }
    function onSelect(item) {
        var a=Application.getApp();
        try {
        var id=item.getId();WatchUi.popView(WatchUi.SLIDE_IMMEDIATE);
        if(id[0].equals("more")){openMoreMenu();return;}
        if(!id[0].equals("wait")){a.finishPending();a.training.act(id[0],id[1]);}
        } catch(e instanceof Lang.Exception){a.note("SEL3:"+e.getErrorMessage(), "ui", false);}
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
        ["Vibracion: "+(t.feedback?"si":"no"),"feedback",0],["Cerrar al recoger: "+(t.walkClose?"si":"no"),"walkClose",0],["Diagnostico sensores","probe",0],[t.calibration?"Salir calibracion":"Calibrar desde movil","calibrate",0]];
    pushMenu(items);
}
