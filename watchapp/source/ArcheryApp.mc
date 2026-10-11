import Toybox.ActivityMonitor;
import Toybox.ActivityRecording;
import Toybox.Application;
import Toybox.Communications;
import Toybox.Graphics;
import Toybox.Lang;
import Toybox.Math;
import Toybox.Sensor;
import Toybox.SensorLogging;
import Toybox.System;
import Toybox.Timer;
import Toybox.Time;
import Toybox.WatchUi;

class ArcheryView extends WatchUi.View {
    private var _app as ArcheryApp;

    private var askedMode = false;

    public function initialize() {
        View.initialize();
        _app = Application.getApp() as ArcheryApp;
    }

    public function onShow() as Void {
        if (!askedMode) {
            askedMode = true;
            try { openModeMenu(); } catch (e instanceof Lang.Exception) { _app.note("SHOW:" + e.getErrorMessage(), "ui", false); }
        }
    }

    public function onUpdate(dc as Dc) as Void {
        try { onUpdateBody(dc); } catch (e instanceof Lang.Exception) {
            // Este fotograma no se pudo pintar. No se engancha: el siguiente reintenta la interfaz.
            var msg = "UI:" + e.getErrorMessage();
            _app.note(msg, "ui", false);
            dc.setColor(Graphics.COLOR_BLACK, Graphics.COLOR_BLACK);
            dc.clear();
            dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_TRANSPARENT);
            dc.drawText(dc.getWidth() / 2, dc.getHeight() / 2, Graphics.FONT_SMALL, "ERROR " + msg, Graphics.TEXT_JUSTIFY_CENTER);
        }
    }

    private function onUpdateBody(dc as Dc) as Void {
        var cx = dc.getWidth() / 2;
        var cy = dc.getHeight() / 2;
        dc.setColor(Graphics.COLOR_BLACK, Graphics.COLOR_BLACK);
        dc.clear();
        if (_app.err != null) {
            dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_TRANSPARENT);
            dc.drawText(cx, cy - 30, Graphics.FONT_SMALL, "ERROR", Graphics.TEXT_JUSTIFY_CENTER);
            dc.drawText(cx, cy + 10, Graphics.FONT_SMALL, _app.err, Graphics.TEXT_JUSTIFY_CENTER);
            return;
        }
        var t = _app.training;
        if (t == null) { return; }
        if (_app.probeReport.size() > 0) {
            dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_TRANSPARENT);
            var lh = dc.getFontHeight(Graphics.FONT_XTINY) + 5;
            var top = 52, bottom = dc.getHeight() - 24;
            var maxVis = (bottom - top) / lh;
            var maxSc = _app.probeReport.size() - maxVis; if (maxSc < 0) { maxSc = 0; }
            if (_app.probeScroll > maxSc) { _app.probeScroll = maxSc; }
            var yy = top;
            for (var pi = _app.probeScroll; pi < _app.probeReport.size() && pi < _app.probeScroll + maxVis; pi++) {
                dc.drawText(cx, yy, Graphics.FONT_XTINY, _app.probeReport[pi], Graphics.TEXT_JUSTIFY_CENTER);
                yy += lh;
            }
            dc.setColor(Graphics.COLOR_DK_GRAY, Graphics.COLOR_TRANSPARENT);
            var hint = "desliza o UP/DN";
            if (_app.probeScroll > 0) { hint = "^ " + hint; }
            if (_app.probeScroll < maxSc) { hint = hint + " v"; }
            dc.drawText(cx, bottom, Graphics.FONT_XTINY, hint + " | START cierra", Graphics.TEXT_JUSTIFY_CENTER);
            return;
        }
        // alturas reales: el layout nunca solapa aunque cambien las fuentes
        var hXt = dc.getFontHeight(Graphics.FONT_XTINY);
        var hL = dc.getFontHeight(Graphics.FONT_LARGE);
        var hHot = dc.getFontHeight(Graphics.FONT_NUMBER_HOT);
        var hM = dc.getFontHeight(Graphics.FONT_MEDIUM);
        var yLine1 = 92;
        var yLbl = yLine1 + 8;
        var yVal = yLbl + hXt + 2;
        var yLine2 = yVal + hL + 8;
        var yHero = yLine2 + 8;
        var yTime = yHero + hHot + 8;
        // linea superior: estado o score de la ultima flecha (una sola cosa, nunca se solapa)
        var pk = _app.lastPeakDev > 300.0 && System.getTimer() - _app.lastPeakAt < 30000 ? " · PICO " + _app.lastPeakDev.toNumber() : "";
        if (_app.noticeLive()) {
            dc.setColor(Graphics.COLOR_ORANGE, Graphics.COLOR_TRANSPARENT);
            dc.drawText(cx, yLine1 - hXt - 8, Graphics.FONT_XTINY, _app.notice, Graphics.TEXT_JUSTIFY_CENTER);
        } else if (t.calibration) {
            dc.setColor(Graphics.COLOR_ORANGE, Graphics.COLOR_TRANSPARENT);
            dc.drawText(cx, yLine1 - hXt - 8, Graphics.FONT_XTINY, "ELIGE EN EL MOVIL" + pk, Graphics.TEXT_JUSTIFY_CENTER);
        } else if (t.paused) {
            dc.setColor(Graphics.COLOR_DK_GRAY, Graphics.COLOR_TRANSPARENT);
            dc.drawText(cx, yLine1 - hXt - 8, Graphics.FONT_XTINY, "PAUSA", Graphics.TEXT_JUSTIFY_CENTER);
        } else if (_app.discardInfo != null) {
            dc.setColor(Graphics.COLOR_ORANGE, Graphics.COLOR_TRANSPARENT);
            dc.drawText(cx, yLine1 - hXt - 8, Graphics.FONT_XTINY, "✕ " + _app.discardInfo, Graphics.TEXT_JUSTIFY_CENTER);
        } else if (_app.lastPeakDev > 300.0 && System.getTimer() - _app.lastPeakAt < 30000) {
            dc.setColor(Graphics.COLOR_DK_GRAY, Graphics.COLOR_TRANSPARENT);
            dc.drawText(cx, yLine1 - hXt - 8, Graphics.FONT_XTINY, "SACUDIDA " + _app.lastPeakDev.toNumber() + " · UMBRAL " + t.threshold.toNumber(), Graphics.TEXT_JUSTIFY_CENTER);
        } else if (_app.nShots > 0) {
            dc.setColor(_app.lastScore >= 75 ? Graphics.COLOR_GREEN : (_app.lastScore >= 50 ? Graphics.COLOR_YELLOW : Graphics.COLOR_RED), Graphics.COLOR_TRANSPARENT);
            dc.drawText(cx, yLine1 - hXt - 8, Graphics.FONT_XTINY, "ULTIMA " + _app.lastScore, Graphics.TEXT_JUSTIFY_CENTER);
        } else if (t.resting) {
            dc.setColor(Graphics.COLOR_DK_GRAY, Graphics.COLOR_TRANSPARENT);
            dc.drawText(cx, yLine1 - hXt - 8, Graphics.FONT_XTINY, "DESCANSO", Graphics.TEXT_JUSTIFY_CENTER);
        }
        // banda 1: tres columnas SET | TOTAL | PPM
        dc.setColor(0x282833, Graphics.COLOR_TRANSPARENT);
        dc.setPenWidth(2);
        dc.drawLine(cx - 120, yLine1, cx + 120, yLine1);
        dc.drawLine(cx - 48, yLbl, cx - 48, yLine2 - 6);
        dc.drawLine(cx + 48, yLbl, cx + 48, yLine2 - 6);
        dc.setColor(Graphics.COLOR_ORANGE, Graphics.COLOR_TRANSPARENT);
        dc.drawText(cx - 96, yLbl, Graphics.FONT_XTINY, "SET " + t.displaySet(), Graphics.TEXT_JUSTIFY_CENTER);
        dc.setColor(Graphics.COLOR_DK_GRAY, Graphics.COLOR_TRANSPARENT);
        dc.drawText(cx, yLbl, Graphics.FONT_XTINY, "TOTAL", Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(cx + 96, yLbl, Graphics.FONT_XTINY, "PPM", Graphics.TEXT_JUSTIFY_CENTER);
        dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_TRANSPARENT);
        dc.drawText(cx - 96, yVal, Graphics.FONT_LARGE, t.count().toString(), Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(cx, yVal, Graphics.FONT_LARGE, _app.nShots.toString(), Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(cx + 96, yVal, Graphics.FONT_LARGE, _app.lastHr > 0 ? _app.lastHr.toString() : "--", Graphics.TEXT_JUSTIFY_CENTER);
        // banda 2: progreso del set en grande (el protagonista)
        dc.setColor(0x282833, Graphics.COLOR_TRANSPARENT);
        dc.drawLine(cx - 120, yLine2, cx + 120, yLine2);
        dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_TRANSPARENT);
        dc.drawText(cx, yHero, Graphics.FONT_NUMBER_HOT, t.calibration ? (t.rows.size()-t.total()).toString() : t.count() + (t.target > 0 ? "/" + t.target : ""), Graphics.TEXT_JUSTIFY_CENTER);
        // tiempo debajo del heroe
        var elapsed = (System.getTimer() - _app.t0) / 1000;
        if (yTime + hM < dc.getHeight() - 14) {
            dc.setColor(Graphics.COLOR_DK_GRAY, Graphics.COLOR_TRANSPARENT);
            dc.drawText(cx, yTime, Graphics.FONT_MEDIUM, (elapsed / 60).format("%02d") + ":" + (elapsed % 60).format("%02d"), Graphics.TEXT_JUSTIFY_CENTER);
        }
    }
}

class ModeMenuDelegate extends WatchUi.Menu2InputDelegate {
    function onSelect(item) {
        var a=Application.getApp();
        try {
            var id=item.getId();
            WatchUi.popView(WatchUi.SLIDE_IMMEDIATE);
            a.training.act(id[0],id[1]);
        } catch(e instanceof Lang.Exception){a.note("SEL2:"+e.getErrorMessage(), "ui", false);}
    }
}
function openModeMenu() {
    var menu=new WatchUi.Menu2({:title=>"Modo de tiro"});
    menu.addItem(new WatchUi.MenuItem("Indoor (3 flechas)",null,["mode","Indoor"],null));
    menu.addItem(new WatchUi.MenuItem("Outdoor (6 flechas)",null,["mode","Outdoor"],null));
    menu.addItem(new WatchUi.MenuItem("Libre",null,["mode","Libre"],null));
    WatchUi.pushView(menu,new ModeMenuDelegate(),WatchUi.SLIDE_UP);
}
class ArcheryDelegate extends WatchUi.BehaviorDelegate {
    private var _app as ArcheryApp;

    public function initialize() {
        BehaviorDelegate.initialize();
        _app = Application.getApp() as ArcheryApp;
    }

    public function onSelect() as Boolean {
        try {
            if(_app.probeReport.size() > 0){_app.probeReport = new [0];_app.probeScroll=0;WatchUi.requestUpdate();return true;}
            if(_app.closing){openTrainingMenu();return true;}
            _app.finishPending();
            _app.training.act(_app.training.paused ? "pause" : (_app.training.resting ? "next" : "close"),0);
        } catch(e instanceof Lang.Exception){_app.note("EX:"+e.getErrorMessage(), "ui", false);}
        return true;
    }
    public function onSwipe(e) as Boolean {
        try {
            if(_app.probeReport.size() > 0){
                var d = e.getDirection();
                if(d == WatchUi.SWIPE_UP){ _app.probeScroll += 1; WatchUi.requestUpdate(); return true; }
                if(d == WatchUi.SWIPE_DOWN){ if(_app.probeScroll > 0){ _app.probeScroll -= 1; } WatchUi.requestUpdate(); return true; }
            }
        } catch(ex instanceof Lang.Exception){_app.note("SWP:"+ex.getErrorMessage(), "ui", false);}
        return false;
    }
    public function onMenu() as Boolean { try{openTrainingMenu();}catch(e instanceof Lang.Exception){_app.note("MENU:"+e.getErrorMessage(), "ui", false);} return true; }
    public function onBack() as Boolean { try{openTrainingMenu();}catch(e instanceof Lang.Exception){_app.note("MENU:"+e.getErrorMessage(), "ui", false);} return true; }
    public function onNextPage() as Boolean {
        if(_app.probeReport.size() > 0){ _app.probeScroll += 1; WatchUi.requestUpdate(); return true; }
        try{openTrainingMenu();}catch(e instanceof Lang.Exception){_app.note("MENU:"+e.getErrorMessage(), "ui", false);}
        return true;
    }
    public function onPreviousPage() as Boolean {
        if(_app.probeReport.size() > 0){ if(_app.probeScroll > 0){ _app.probeScroll -= 1; } WatchUi.requestUpdate(); return true; }
        return false;
    }

}

class TxListener extends Communications.ConnectionListener {
    private var _app as ArcheryApp;

    function initialize(app as ArcheryApp) {
        ConnectionListener.initialize();
        _app = app;
    }

    public function onComplete() as Void {
        _app.onTxAck();
    }

    public function onError() as Void {
        _app.onTxError();
    }
}

class ArcheryApp extends Application.AppBase {
    public var rateA = 0;
    public var nShots = 0;
    public var detectorStatus=null;
    private var exitPending=false;
    public var probeMode=false;      // diagnostico de sensores en vivo (investigacion-acelerometro.md §5)
    public var probeBatches=0;
    public var probeReport = new [0];
    public var probeScroll = 0;      // primera linea visible del informe (swipe/botones)

    public var discardInfo=null;  // ultimo motivo de descarte: persiste hasta el proximo tiro aceptado
    public var lastPeakDev=0.0;   // mayor sacudida reciente SIN tiro aceptado (diagnostico de umbral en campo)
    public var lastPeakAt=0;
    public var lastScore = 0;
    public var lastHr = 0;
    public var t0 = 0;
    public var err = null;  // solo arranque: bloquea la pantalla porque la app no puede funcionar
    public var notice = null;
    private var noticeAt = 0;
    private var noticeHold = false;
    private var noticeKey = null;
    private var sensorFaults = 0;
    public var saved = false;
    public var closing=false;
    private var session = null;

    // Detector causal; el prototipo Python requiere equivalencia antes de validar parámetros.
    private var PRE_STABLE = 450.0;  // el apuntado previo debe estar quieto (pstdev mg de la ventana vieja)
    private var REFRAC = 1500.0;     // ms refractarios
    private var POST = 1200.0;       // ms de ventana post-suelta (latencia flecha->pantalla)
    private var SETTLE_MG = 300.0;   // umbral de asentamiento
    // Marcha hacia la diana, solo con el acelerómetro ya muestreado (nada de otro listener).
    // Umbrales conservadores: validar en campo (muñeca real, FR165, recolocar vs caminar).
    private var WALK_MG = 180.0;     // pico de la magnitud respecto a la gravedad lenta
    private var WALK_LO = 380.0;     // periodo mínimo: ~2,6 Hz
    private var WALK_HI = 700.0;     // periodo máximo: ~1,4 Hz (banda 1,5–2,5 Hz con holgura)
    private var WALK_N = 10;         // intervalos seguidos dentro de banda
    private var WALK_MS = 6000.0;    // y al menos 6 s de ese ritmo
    private var WALK_LONG = 8000.0;  // si el podómetro existe y no sube, exigir 8 s
    private var WALK_STEPS = 4;      // pasos de ActivityMonitor que confirman antes de los 8 s
    private var WALK_GAP = 2500.0;   // no cerrar en el follow-through del último tiro

    // Ventana causal de 500 ms, dimensionada a la frecuencia del sensor.
    private var gBuf = new [50] as Array<Float>;
    private var gi = 0;
    private var gravityN=50, stableN=42;
    private var sensorOffset=null, lastSample=-1.0;
    private var clockSource="estimated";
    // Hasta 20 s de apertura y apuntado; envio reducido sin recortar el inicio.
    private var rx = new [400] as Array<Float>;
    private var ry = new [400] as Array<Float>;
    private var rz = new [400] as Array<Float>;
    private var rm = new [400] as Array<Float>;
    private var rt=new [400];
    private var ryw=new [400] as Array<Float>;  // yaw de brujula (grados) por muestra diezmada
    private var ryw2=new [400] as Array<Float>; // yaw compensado por inclinacion (campo 3 ejes + gravedad)
    private var rpt=new [400] as Array<Float>;  // pitch real de la esfera: asin(y/g) en grados
    public var curMagX=1.0, curMagY=0.0, curMagZ=0.0;  // ultima lectura del magnetometro (alineada por onData)
    private var rrRing=new [90] as Array<Float>; private var rrCount=0;
    // Posicion 3D sin giroscopio: TRIAD (gravedad + mag) da la rotacion por muestra
    // cuasi-estatica; la referencia es la ultima quietud larga, asi a_lineal = R·a - a_ref
    // cancela la gravedad exactamente incluso al rotar la muneca. ZUPT clava v=0 (y la
    // quietud larga tambien re-ancora p) para acotar la deriva. Fallback: media vectorial.
    private var gbx = new [50] as Array<Float>, gby = new [50] as Array<Float>, gbz = new [50] as Array<Float>;
    private var gbSumX = 0.0, gbSumY = 0.0, gbSumZ = 50000.0;
    private var vx_ = 0.0, vy_ = 0.0, vz_ = 0.0, pxx = 0.0, pyy = 0.0, pzz = 0.0, stillT = 0;
    private var lastMoveT = -100000.0;  // ultimo instante con movimiento: la suelta exige quietud inmediata previa
    private var b1x=0.0,b1y=0.0,b1z=0.0, b2x=0.0,b2y=0.0,b2z=0.0, b3x=0.0,b3y=0.0,b3z=0.0, basisOk=false;  // base TRIAD del instante
    private var r1x=0.0,r1y=0.0,r1z=0.0, r2x=0.0,r2y=0.0,r2z=0.0, r3x=0.0,r3y=0.0,r3z=0.0;               // base TRIAD de referencia
    private var refAx=0.0,refAy=0.0,refAz=0.0, refOk=false;                                            // accel (gravedad) de referencia
    private var rpx = new [400] as Array<Float>, rpy = new [400] as Array<Float>, rpz = new [400] as Array<Float>;  // cm
    private var postPX = new [24] as Array<Float>, postPY = new [24] as Array<Float>, postPZ = new [24] as Array<Float>;
    private var snapPx = new [1] as Array<Float>, snapPy = new [1] as Array<Float>, snapPz = new [1] as Array<Float>;
    private var previousX=0.0, previousY=0.0, previousZ=1000.0;
    private var drawStart=-1.0, drawQuiet=0.0, baseX=0.0, baseY=0.0, baseZ=1000.0;
    private var motionSince=-1.0, motionSteps=0;
    private var pulseEnd=0.0, pulseQuiet=-1.0, pulseRecovered=false, shotLimit=0.0, snapPose=[0.0,0.0,1000.0];
    private var postTimes=new [40];
    private var snapTimes=[];
    private var ri = 0;
    private var rn = 0;
    private var dec = 0;
    // traza post-suelta @20 Hz: magnitud (40) + trayectoria x/y (40) = 2 s de follow-through
    private var postMag = new [24] as Array<Float>;
    private var postX = new [24] as Array<Float>;
    private var postY = new [24] as Array<Float>;
    private var pn = 0;
    // tiro en curso
    private var inShot = false;
    private var tShot = 0.0;
    private var lastShot = -100000.0;
    // Cadencia de marcha: se actualiza en la rama ya diezmada (~20 Hz), sin sensor extra.
    private var wSm=0.0, wArmed=false, wTop=0.0, wTopT=0.0, wLast=-1.0, wStart=-1.0, wCount=0, stepMark=-1, stepRead=-1, stepReadAt=-100000.0, walkTried=false;
    private var peak = 0.0, shotBaseline = 1000.0;
    private var settleT = -1.0;
    // snapshot pre-suelta congelado al detectar
    private var snapT = 0.0;
    private var snapDraw = -1.0;
    private var snapHr = 0;
    private var snapScore = 0.0;
    private var snapInstab = 0.0;
    private var snapTx = new [1] as Array<Float>;
    private var snapTy = new [1] as Array<Float>;
    private var snapMag = new [1] as Array<Float>;
    private var snapYw = new [1] as Array<Float>;
    private var snapYw2 = new [1] as Array<Float>;
    private var snapPt = new [1] as Array<Float>;
    private var postMx = 0.0;
    private var postMy = 0.0;
    private var qHead = 0;
    private var qTail = 0;
    private var sending = false;
    private var txStarted=0;
    public var sid = "";
    public var training;
    private var quietSince=-1.0;
    private var gSum = 50000.0;
    private var gCount = 0;
    private var stride = 5;
    private var timer = new Toybox.Timer.Timer();

    public function initialize() {
        AppBase.initialize();
        for (var i = 0; i < 50; i++) { gBuf[i] = 1000.0; }
    }

    // Miga de caja negra: si la app muere sin log (watchdog/fallo nativo), la ultima
    // marca persistida dice en que operacion estaba cuando cayo.
    public function mark(step) {
        try {
            if (step == null) { Application.Storage.deleteValue("step"); }
            else { Application.Storage.setValue("step", step); }
        } catch (e instanceof Lang.Exception) { }
    }

    // Aviso en la barra de estado, sin tapar el entrenamiento. Con hold se queda hasta
    // clearNote (la causa sigue viva); si no, desaparece a los 6 s.
    public function note(text, key, hold) {
        notice = text;
        noticeKey = key;
        noticeAt = System.getTimer();
        noticeHold = hold;
    }

    public function clearNote(key) {
        if (noticeKey != null && noticeKey.equals(key)) { notice = null; noticeKey = null; noticeHold = false; }
    }

    public function noticeLive() as Boolean {
        if (notice == null) { return false; }
        if (!noticeHold && System.getTimer() - noticeAt >= 6000) { notice = null; noticeKey = null; noticeHold = false; return false; }
        return true;
    }

    public function configureRate(rate) {
        rateA=rate;gravityN=Math.ceil(rateA*0.5).toNumber();stableN=gravityN-Math.ceil(rateA*0.08).toNumber();
        if(stableN<1){stableN=1;}stride=Math.ceil(rateA/20.0).toNumber();
        gBuf=new [gravityN];gbx=new [gravityN];gby=new [gravityN];gbz=new [gravityN];
        for(var i=0;i<gravityN;i++){gBuf[i]=1000.0;gbx[i]=0.0;gby[i]=0.0;gbz[i]=1000.0;}
        gSum=1000.0*gravityN;gbSumX=0.0;gbSumY=0.0;gbSumZ=1000.0*gravityN;
        vx_=0.0;vy_=0.0;vz_=0.0;pxx=0.0;pyy=0.0;pzz=0.0;stillT=0;lastMoveT=-100000.0;basisOk=false;refOk=false;
        gCount=0;gi=0;rn=0;ri=0;dec=0;drawStart=-1.0;drawQuiet=0.0;motionSince=-1.0;motionSteps=0;
        walkReset();
    }

    private function walkReset() as Void {
        wSm=0.0; wArmed=false; wTop=0.0; wTopT=0.0; wLast=-1.0; wStart=-1.0; wCount=0;
        stepMark=-1; stepRead=-1; stepReadAt=-100000.0; walkTried=false;
    }

    // El podómetro del sistema, si el FR165 lo expone. Leerlo no enciende un sensor;
    // si no está, la cadencia del acelerómetro basta. Hay que confirmarlo en el reloj.
    private function stepsNow() as Number {
        if (!(Toybox has :ActivityMonitor)) { return -1; }
        try {
            var info = Toybox.ActivityMonitor.getInfo();
            if (info != null && info has :steps && info.steps != null) { return info.steps; }
        } catch (es instanceof Lang.Exception) { }
        return -1;
    }

    private function considerWalk(mag as Float, t as Float) as Void {
        if (training == null || training.paused || training.calibration || training.resting || inShot) {
            if (wCount > 0 || wArmed) { walkReset(); }
            return;
        }
        if (wSm < 1.0) { wSm = mag; return; }
        var hp = mag - wSm;
        wSm = wSm + 0.15 * (mag - wSm);
        if (hp > WALK_MG) {
            if (!wArmed || hp > wTop) { wArmed = true; wTop = hp; wTopT = t; }
            return;
        }
        if (!wArmed) { return; }
        var peakT = wTopT;
        wArmed = false; wTop = 0.0;
        if (wLast < 0.0) { wLast = peakT; return; }
        var dt = peakT - wLast;
        wLast = peakT;
        if (dt >= WALK_LO && dt <= WALK_HI) {
            if (wCount == 0) { wStart = peakT - dt; stepMark = stepsNow(); }
            wCount += 1;
        } else {
            wCount = 0; wStart = -1.0; stepMark = -1; walkTried = false;
            return;
        }
        if (walkTried || wCount < WALK_N || t - wStart < WALK_MS || t - lastShot < WALK_GAP) { return; }
        if (training has :walkClose && !training.walkClose) { return; }
        if (t - stepReadAt >= 1000.0) { stepRead = stepsNow(); stepReadAt = t; }
        var known = stepMark >= 0 && stepRead >= 0;
        if (known && stepRead - stepMark < WALK_STEPS && t - wStart < WALK_LONG) { return; }
        walkTried = true;
        if (!(training has :close)) { return; }
        training.close("walk", 0);
    }

    public function onStart(state as Dictionary?) as Void {
        var cut = null;
        try { cut = Application.Storage.getValue("step"); } catch (ec instanceof Lang.Exception) { }
        mark("INI");  // primera marca: un kill durante el arranque deja esta miga
        if (cut != null) { discardInfo = "CORTE EN " + cut; }  // la ejecucion anterior murio en medio de una operacion
        try {
            var meta = Application.Storage.getValue("queueIndex");
            if (meta != null) { qHead = meta[0]; qTail = meta[1]; }
            sid = Time.now().value().toString() + "-" + System.getTimer().toString();
            training=new TrainingState(self);
            var checkpoint=Application.Storage.getValue("training");
            // A message and its recovery state are one atomic storage value.
            var orphan=Application.Storage.getValue("queued"+qTail);
            while(orphan instanceof Dictionary) {qTail++;orphan=Application.Storage.getValue("queued"+qTail);}
            Application.Storage.setValue("queueIndex",[qHead,qTail]);
            var last= qTail>qHead?Application.Storage.getValue("queued"+(qTail-1)):null;
            if(last instanceof Dictionary && last.hasKey("checkpoint")) {
                var pending=last["event"] as Dictionary;
                if(!pending["kind"].equals("end")){checkpoint=last["checkpoint"];}
                else {checkpoint=null;Application.Storage.deleteValue("training");}
            }
            training.restore(checkpoint);nShots=training.total();

            Communications.registerForPhoneAppMessages(method(:onPhone));
            var logger = new SensorLogging.SensorLogger({:accelerometer => {:enabled => true}});
            session = ActivityRecording.createSession({
                :sport => ActivityRecording.SPORT_GENERIC,
                :name => "ArcheryWatch",
                :sensorLogger => logger
            });
            session.start();
            rateA = Sensor.getMaxSampleRateForSensorType(:accelerometer);
            if (rateA > 100) { rateA = 100; }
            if (rateA <= 0) { throw new Lang.InvalidValueException("Sin acelerometro"); }
            configureRate(rateA);
            Sensor.setEnabledSensors([Sensor.SENSOR_HEARTRATE]);
            Sensor.enableSensorEvents(method(:onHr));
            Sensor.registerSensorDataListener(method(:onData), {
                :period => 1,
                :accelerometer => { :enabled => true, :sampleRate => rateA },
                :magnetometer => { :enabled => true, :sampleRate => 25 },
                :heartBeatIntervals => { :enabled => true }
            });
            timer.start(method(:flushTimer), 5000, true);
            t0 = System.getTimer()-(Time.now().value()-training.started)*1000;
            emit({"kind"=>"start","state"=>training.snapshot(),"build"=>66,"recovery"=>cut});
            mark(null);
        } catch (e instanceof Lang.Exception) {
            err = e.getErrorMessage();
        }
    }

    public function onStop(state as Dictionary?) as Void {
        mark("STOP");
        try { if (inShot) { finalize(); }
            if(training!=null && !closing) {finishActivity();}
        } catch(e instanceof Lang.Exception){}
        try {
            timer.stop();
            Sensor.unregisterSensorDataListener();
        } catch (e instanceof Lang.Exception) {
        }
        if (session != null) {
            mark("SES");
            try {
                if (session.isRecording()) {
                    session.stop();
                    saved = session.save();
                }
            } catch (e instanceof Lang.Exception) { note("SES:" + e.getErrorMessage(), "ses", false); }
            session = null;  // tras stop/save el objeto queda invalido: cualquier metodo suyo es System Error
        }
        mark(null);
    }

    public function finishActivity() {
        if(closing){return;}
        mark("CIERRE");
        finishPending();
        Sensor.unregisterSensorDataListener();  // el listener debe morir antes de cerrar la sesion con sensorLogger
        training.paused=true;
        System.println("SB-a");
        if(session!=null){
            System.println("SB-b");
            if(session.isRecording()){
                System.println("SB-c");
                session.stop();
                System.println("SB-d");
                saved=session.save();
                System.println("SB-e");
            }
            session=null;
        }
        System.println("FA-3");
        closing=true;
        sendControl("end");
        Application.Storage.deleteValue("training");WatchUi.requestUpdate();
        mark(null);
        System.println("FA-6");
    }

    public function rrRmssd() as Float or Null {
        if (rrCount < 11) { return null; }
        var from = rrCount - 31; if (from < 1) { from = 1; }
        var sum = 0.0, n = 0;
        for (var i = from; i < rrCount; i++) { var d = rrRing[i] - rrRing[i-1]; sum += d * d; n += 1; }
        return n > 0 ? Math.sqrt(sum / n) : null;
    }
    public function rememberRR(value) {
        if(!(value>300.0 && value<2500.0)){return;}
        if(rrCount==rrRing.size()){for(var r=1;r<rrCount;r++){rrRing[r-1]=rrRing[r];}rrCount--;}
        rrRing[rrCount]=value;rrCount++;
    }

    public function probeLine(line as Object) as Void {
        if (line == null) { return; }
        var txt = line.toString();
        while (txt.length() > 0 && probeReport.size() < 24) {
            var cut = txt.length() > 16 ? 16 : txt.length();
            probeReport.add(txt.substring(0, cut));
            txt = txt.substring(cut, txt.length());
        }
        WatchUi.requestUpdate();
    }

    public function runSensorProbe() as Void {
        probeMode = true; probeBatches = 0; probeReport = new [0];
        var msr = Sensor has :getMaxSampleRate ? Sensor.getMaxSampleRate() : null;
        probeLine(msr != null ? "ACC max " + msr + " Hz" : "ACC max n/d");
        if (Sensor has :getMaxSampleRateForSensorType) {
            var mm = Sensor.getMaxSampleRateForSensorType(:magnetometer);
            probeLine(mm != null ? "MAG api " + mm + " Hz" : "MAG api sin datos");
            var gr = Sensor.getMaxSampleRateForSensorType(:gyroscope);
            probeLine(gr != null && gr > 0 ? "GYRO api " + gr + " Hz" : "GYRO api sin datos");
        } else { probeLine("MAG/GYRO api no expuesta"); }
        try {
            if (Toybox has :SensorHistory && SensorHistory has :getPressureHistory) {
                var ph = SensorHistory.getPressureHistory({:period => new Toybox.Time.Duration(300), :order => SensorHistory.ORDER_NEWEST_FIRST});
                var ps = ph != null ? ph.next() : null;  // next() devuelve null cuando se agota (no hay hasNext)
                var pd = ps != null ? ps.data : null;
                probeLine(pd != null ? "BAR " + pd + " Pa" : "BAR sin lectura");
            } else { probeLine("BAR api no expuesta"); }
        } catch (eb instanceof Lang.Exception) { probeLine("BAR excepcion"); }
        try {
            Sensor.unregisterSensorDataListener();
            try {
                Sensor.registerSensorDataListener(method(:onData), {
                    :period => 1,
                    :accelerometer => { :enabled => true, :sampleRate => 25 },
                    :magnetometer => { :enabled => true, :sampleRate => 25 },
                    :gyroscope => { :enabled => true, :sampleRate => 25 },
                    :heartBeatIntervals => { :enabled => true }
                });
                probeLine("LISTENER MAG+GYR+RR OK");
            } catch (e2 instanceof Lang.Exception) {
                probeLine("GYRO key rechazada");
                Sensor.registerSensorDataListener(method(:onData), {
                    :period => 1,
                    :accelerometer => { :enabled => true, :sampleRate => 25 },
                    :magnetometer => { :enabled => true, :sampleRate => 25 },
                    :heartBeatIntervals => { :enabled => true }
                });
                probeLine("LISTENER MAG+RR OK");
            }
        } catch (e instanceof Lang.Exception) {
            probeLine("LISTENER RECHAZADO");
            probeLine(e.getErrorMessage());
        }
    }

    public function onHr(sensorInfo as Sensor.Info) as Void {
        if (sensorInfo != null && sensorInfo.heartRate != null) {
            lastHr = sensorInfo.heartRate;
        }
    }

    public function onData(data as Sensor.SensorData) as Void {
        if (probeMode) {
            var mg = data has :magnetometerData ? data.magnetometerData : null;
            probeLine(mg != null && mg.x != null && mg.x.size() > 0 ? "MAG dato SI (" + mg.x[0] + " mGauss)" : "MAG dato ausente");
            var gy = data has :gyroscopeData ? data.gyroscopeData : null;
            probeLine(gy != null && gy.x != null && gy.x.size() > 0 ? "GYRO dato SI (" + gy.x[0] + ")" : "GYRO dato ausente");
            var hd = data has :heartRateData ? data.heartRateData : null;
            var rr = hd != null ? hd.heartBeatIntervals : null;
            probeBatches += 1;
            if (rr != null && rr.size() > 0) {
                probeLine("RR SI (" + rr[0] + " ms)");
            } else if (probeBatches == 1) {
                probeLine("HR " + (lastHr > 0 ? lastHr + " ppm" : "sin lecturas") + ", esperando RR...");
            }
            if (rr != null && rr.size() > 0 || probeBatches >= 15) {
                if (rr == null || rr.size() == 0) { probeLine("RR ausente en 15 s"); }
                probeMode = false;  // volver al listener normal de deteccion
                try {
                    Sensor.unregisterSensorDataListener();
                    Sensor.registerSensorDataListener(method(:onData), { :period => 1, :accelerometer => { :enabled => true, :sampleRate => rateA }, :magnetometer => { :enabled => true, :sampleRate => 25 }, :heartBeatIntervals => { :enabled => true } });
                    clearNote("probe");
                } catch (ep instanceof Lang.Exception) { note("PROBE:" + ep.getErrorMessage(), "probe", true); }
            }
            return;
        }
        try {
        var a = data.accelerometerData;
        if (a == null || a.x == null || a.y == null || a.z == null || a.x.size() == 0 || a.x.size()!=a.y.size() || a.x.size()!=a.z.size()) { return; }
        var n = a.x.size();
        var consumed = 0;
        var now = System.getTimer();
        var timestamps=null;
        if(a has :timestamp){timestamps=a.timestamp;}
        if(timestamps!=null && timestamps.size()==n) {
            if(sensorOffset==null){sensorOffset=now-timestamps[n-1];}clockSource="sensor-relative";
        } else {timestamps=null;clockSource="estimated";}
        var mag = data has :magnetometerData ? data.magnetometerData : null;
        var magN = mag != null && mag.x.size() > 0 ? mag : null;  // su propio ritmo de lote: alinear por indice
        var hdata = data has :heartRateData ? data.heartRateData : null;
        var ivs = hdata != null ? hdata.heartBeatIntervals : null;
        if (ivs != null) { for (var v = 0; v < ivs.size(); v++) {rememberRR(ivs[v]);} }
            for (var i = 0; i < n; i++) {
                var when=timestamps!=null?timestamps[i]+sensorOffset:now-Math.round((n-1-i)*1000.0/rateA).toNumber();
                if(when<=lastSample){continue;}
                if(lastSample>=0 && when-lastSample>2000) {if(inShot){finalize();}configureRate(rateA);}
                lastSample=when;
                if (magN != null && i < magN.x.size()) { curMagX = magN.x[i].toFloat();
                    if (magN.y != null && i < magN.y.size()) { curMagY = magN.y[i].toFloat(); }
                    if (magN.z != null && i < magN.z.size()) { curMagZ = magN.z[i].toFloat(); } }  // lote corto: conserva el ultimo valor, sin repetir en cascada
                sample(a.x[i].toFloat(),a.y[i].toFloat(),a.z[i].toFloat(),(when-t0).toFloat());
                consumed += 1;
            }
        if (consumed > 0) { sensorFaults = 0; clearNote("sensor"); }
        } catch(e instanceof Lang.Exception) {
            // Un lote roto no deja el detector en pausa muda: se suelta el tiro a medias,
            // se rearma la ventana y se sigue. Solo si se repite se avisa en la barra.
            sensorFaults += 1;
            inShot = false;
            mark(null);
            if (rateA > 0) { try { configureRate(rateA); } catch (er instanceof Lang.Exception) {} }
            if (sensorFaults >= 3) { note("SENSOR repetido: " + e.getErrorMessage(), "sensor", true); }
        }
        WatchUi.requestUpdate();
    }

    public function sample(x as Float, y as Float, z as Float, t as Float) as Void {
        // Convertir solo el tiempo relativo: Float pierde muestras de 10 ms tras dias encendido.
        var mag = Math.sqrt(x * x + y * y + z * z);
        var dev = mag - gSum / gravityN;
        var dx=x-previousX,dy=y-previousY,dz=z-previousZ;
        var jerk=Math.sqrt(dx*dx+dy*dy+dz*dz);
        previousX=x;previousY=y;previousZ=z;
        var limit=training.calibration?150.0:training.threshold;
        var adev=dev<0?-dev:dev;
        var intensity=adev>jerk/1.2?adev:jerk/1.2, impulse=intensity>(limit<150?limit:150.0);
        if (detectorStatus != null) { discardInfo = detectorStatus; }
        if (adev > 300.0) { if (adev > lastPeakDev) { lastPeakDev = adev; } lastPeakAt = System.getTimer(); }  // registrar casi-disparos: visible en pantalla para ajustar el umbral
        // una suelta real siempre sigue a una apertura reciente Y a ~600 ms de quietud
        // de apunte: un golpe mientras se maneja el arco nunca tiene esa calma previa.
        var drawAt=motionSince>=0?motionSince:drawStart;
        var drew = drawStart >= 0 && drawAt >= 0 && t - drawAt >= 600 && t - drawAt < 30000;
        var quietGap = t - lastMoveT;  // lastMoveT se actualiza DESPUES de esta evaluacion
        if (dev > limit && !inShot && !training.paused) {
            if (!drew) { detectorStatus="FALTA APERTURA"; }
            else if (quietGap < 600) { detectorStatus="SIN QUIETUD"; }
        }
        if (!inShot && !training.paused && gCount >= gravityN && rn >= 10 && impulse && t - lastShot > REFRAC && (training.calibration || (drew && quietGap >= 600 && preStable(adev>limit)))) { mark("TRG");try{trigger(t);}catch(et instanceof Lang.Exception){note("TRG:"+et.getErrorMessage(), "trg", false);}mark(null); peak = intensity;shotLimit=limit; }
        else if (inShot) {
            if (t-tShot<=120 && intensity > peak) { peak = intensity; }
            if(!training.calibration && t-tShot>120 && peak<shotLimit){inShot=false;}
            if(t-tShot<=600 && !pulseRecovered) {
                var pulseDev=mag-shotBaseline;
                var pulseLimit=peak*0.35>shotLimit*0.5?peak*0.35:shotLimit*0.5;
                if((pulseDev<0?-pulseDev:pulseDev)>pulseLimit || jerk/1.2>pulseLimit){pulseEnd=t-tShot;pulseQuiet=-1.0;}
                else {if(pulseQuiet<0){pulseQuiet=t;}if(t-pulseQuiet>=100){pulseRecovered=true;}}
            }
            if (settleT < 0 && t-tShot>50) {
                if((dev<0?-dev:dev)<SETTLE_MG) { if(quietSince<0){quietSince=t;} if(t-quietSince>=150){settleT=quietSince-tShot;} }
                else {quietSince=-1.0;}
            }
            if (t - tShot >= POST) { finalize(); }
        }
        gSum += mag - gBuf[gi]; gBuf[gi] = mag;
        gbSumX += x - gbx[gi]; gbx[gi] = x;
        gbSumY += y - gby[gi]; gby[gi] = y;
        gbSumZ += z - gbz[gi]; gbz[gi] = z;
        gi = (gi + 1) % gravityN;
        if (gCount < gravityN) { gCount += 1; }
        var still = adev < 400.0 && jerk < 700.0;  // el apunte humano tiembla: la quietud no puede pedir menos que el temblor propio de apuntar
        if (still) { stillT += 1; } else { stillT = 0; lastMoveT = t; }
        // base TRIAD solo en cuasi-estatica: en movimiento brusco el accel no es gravedad
        // pura y la orientacion no es observable (se conserva la ultima base valida)
        var magAbs = Math.sqrt(curMagX * curMagX + curMagY * curMagY + curMagZ * curMagZ);
        if (adev < 150.0 && mag > 1.0 && magAbs > 150.0 && magAbs < 900.0) {
            var na = 1.0 / mag;
            var e1x = x * na, e1y = y * na, e1z = z * na;
            var md = curMagX * e1x + curMagY * e1y + curMagZ * e1z;
            var e2x = curMagX - md * e1x, e2y = curMagY - md * e1y, e2z = curMagZ - md * e1z;
            var ne = Math.sqrt(e2x * e2x + e2y * e2y + e2z * e2z);
            if (ne > magAbs * 0.15) {  // mag casi paralela a gravedad: yaw no observable
                ne = 1.0 / ne; e2x *= ne; e2y *= ne; e2z *= ne;
                b1x = e1x; b1y = e1y; b1z = e1z; b2x = e2x; b2y = e2y; b2z = e2z;
                b3x = e1y * e2z - e1z * e2y; b3y = e1z * e2x - e1x * e2z; b3z = e1x * e2y - e1y * e2x;
                basisOk = true;
                if (stillT * 2 >= rateA) {  // quietud larga: este instante define el marco mundo
                    refAx = x; refAy = y; refAz = z;
                    r1x = b1x; r1y = b1y; r1z = b1z; r2x = b2x; r2y = b2y; r2z = b2z; r3x = b3x; r3y = b3y; r3z = b3z;
                    refOk = true;
                    pxx = 0.0; pyy = 0.0; pzz = 0.0;  // origen = ultimo reposo confirmado
                }
            }
        }
        var lx, ly, lz;
        if (refOk && basisOk) {
            var c1 = b1x * x + b1y * y + b1z * z, c2 = b2x * x + b2y * y + b2z * z, c3 = b3x * x + b3y * y + b3z * z;
            lx = r1x * c1 + r2x * c2 + r3x * c3 - refAx;
            ly = r1y * c1 + r2y * c2 + r3y * c3 - refAy;
            lz = r1z * c1 + r2z * c2 + r3z * c3 - refAz;
        } else {
            lx = x - gbSumX / gravityN; ly = y - gbSumY / gravityN; lz = z - gbSumZ / gravityN;
        }
        if (lx > -15.0 && lx < 15.0) { lx = 0.0; } if (ly > -15.0 && ly < 15.0) { ly = 0.0; } if (lz > -15.0 && lz < 15.0) { lz = 0.0; }
        if (still) { if (stillT * 10 >= rateA) { vx_ = 0.0; vy_ = 0.0; vz_ = 0.0; } }
        else { var dt = 1.0 / rateA; vx_ += lx * dt; vy_ += ly * dt; vz_ += lz * dt; pxx += vx_ * dt; pyy += vy_ * dt; pzz += vz_ * dt; }
        if (dec == 0) {
            dx=x-baseX;dy=y-baseY;dz=z-baseZ;
            if(gCount==1 || training.paused || (inShot && (training.calibration || peak>=shotLimit))){drawQuiet=t;baseX=x;baseY=y;baseZ=z;motionSince=-1.0;motionSteps=0;if(training.paused){drawStart=-1.0;}}
            else if(dx*dx+dy*dy+dz*dz>14400) {
                if(drawStart<0 && t-drawQuiet>=600){drawStart=t-600;}
                if(t-drawQuiet>600){motionSince=-1.0;motionSteps=0;}
                if(motionSince<0){motionSince=t;}motionSteps++;
                if(drawStart<0 && motionSteps>=3 && t-motionSince>=200){drawStart=motionSince;}
                drawQuiet=t;baseX=x;baseY=y;baseZ=z;
            }
            rx[ri] = x; ry[ri] = y; rz[ri]=z;rm[ri] = mag;rt[ri]=t;
            ryw[ri] = Math.atan2(curMagY, curMagX) * 57.2958;
            ryw2[ri] = magYaw(x, y, z);
            var pt=mag>1.0?y/mag:0.0;if(pt>1.0){pt=1.0;}else if(pt<-1.0){pt=-1.0;}
            rpt[ri]=Math.asin(pt)*57.2958;  // pitch real: la aproximacion mG->deg diverge en aperturas grandes
            rpx[ri]=pxx*0.9807;rpy[ri]=pyy*0.9807;rpz[ri]=pzz*0.9807;  // mG·s² -> cm
            ri = (ri + 1) % rx.size();
            if (rn < rx.size()) { rn += 1; }
            if (inShot && pn < 24) { postMag[pn] = mag; postX[pn] = x; postY[pn] = y;postTimes[pn]=t-tShot;
                postPX[pn]=pxx*0.9807;postPY[pn]=pyy*0.9807;postPZ[pn]=pzz*0.9807; pn += 1; }
            considerWalk(mag, t);
        }
        dec = (dec + 1) % stride;
    }

    // Azimut con compensacion de inclinacion: proyecta el campo magnetico 3 ejes al plano
    // horizontal (gravedad del propio acelerometro) y lo mide contra el eje "arriba" de la
    // esfera proyectado al mismo plano. Con la muneca girada el atan2 crudo mezclaba ejes.
    private function magYaw(x as Float, y as Float, z as Float) as Float {
        var gn = Math.sqrt(x * x + y * y + z * z);
        if (gn < 1.0) { return Math.atan2(curMagY, curMagX) * 57.2958; }
        var gx = x / gn, gy = y / gn, gz = z / gn;
        var ux = -gy * gx, uy = 1.0 - gy * gy, uz = -gy * gz;   // "arriba" del reloj -> horizontal
        var un = Math.sqrt(ux * ux + uy * uy + uz * uz);
        if (un < 0.25) { return Math.atan2(curMagY, curMagX) * 57.2958; }  // eje arriba vertical: degenera
        ux /= un; uy /= un; uz /= un;
        var rxv = gy * uz - gz * uy, rvy = gz * ux - gx * uz, rvz = gx * uy - gy * ux;  // derecha = g x u
        var bd = curMagX * gx + curMagY * gy + curMagZ * gz;
        var hx = curMagX - bd * gx, hy = curMagY - bd * gy, hz = curMagZ - bd * gz;      // campo en plano horizontal
        return Math.atan2(hx * rxv + hy * rvy + hz * rvz, hx * ux + hy * uy + hz * uz) * 57.2958;
    }

    private function preStable(strong as Boolean) as Boolean {
        // Variacion de la ventana causal, excluyendo los ultimos 80 ms.
        // El impulso reciente no debe invalidar el contexto previo.
        var sum = 0.0;
        var sum2 = 0.0;
        for (var k = 0; k < stableN; k++) {
            var v = gBuf[(gi + k) % gravityN];
            sum += v;
            sum2 += v * v;
        }
        var mu = sum / stableN;
        var va = sum2 / stableN - mu * mu;
        var mv=Math.sqrt(va < 0 ? 0.0 : va), mvLim=strong?PRE_STABLE*1.5:PRE_STABLE;  // tras recoger flechas la muñeca aun se asienta
        if(mv>=mvLim){if(strong){detectorStatus="MOVIMIENTO PREVIO";}return false;}
        // Ventana temporal de apuntado: distingue oscilacion de marcha de una pausa instantanea.
        var ax=0.0,ay=0.0,az=0.0,energy=0.0,n=0,latest=rt[(ri-1+rx.size())%rx.size()];
        for(var j=0;j<rn;j++){var q=(ri-1-j+rx.size())%rx.size(),age=latest-rt[q];if(age>900){break;}if(age<80){continue;}ax+=rx[q];ay+=ry[q];az+=rz[q];energy+=rx[q]*rx[q]+ry[q]*ry[q]+rz[q]*rz[q];n++;}
        if(n<4){return false;}ax/=n;ay/=n;az/=n;
        var variance=energy/n-ax*ax-ay*ay-az*az,allowed=40000.0;  // sd 200 mG: el apunte humano tiembla; lo que separa de andar/maniobrar es MOVIMIENTO PREVIO
        if(training.pose instanceof Lang.Array && training.pose.size()>3){allowed=training.pose[3]*4.0;if(allowed<2500){allowed=2500.0;}}
        snapPose=[ax,ay,az,variance>0?variance:0.0];
        if(variance>allowed){detectorStatus="APUNTE INESTABLE";return false;}
        if(!training.calibration && training.pose instanceof Lang.Array && training.pose.size()>=3) {
            var p=training.pose;
            var norm=Math.sqrt((ax*ax+ay*ay+az*az)*(p[0]*p[0]+p[1]*p[1]+p[2]*p[2]));
            if(norm<1 || (ax*p[0]+ay*p[1]+az*p[2])/norm<0.85){detectorStatus="POSTURA DISTINTA";return false;}
        }
        return true;
    }

    private function trigger(t as Float) as Void {
        walkReset();  // la suelta no es un paso; la marcha se cuenta desde el siguiente reposo
        // congelar métricas pre-suelta: los anillos aún contienen el apuntado
        var start=drawStart>lastShot+POST?drawStart:lastShot+POST;
        if(motionSince>=0 && t-motionSince<6000){ start=motionSince-200; if(start<0){start=0.0;} }  // la apertura REAL: ultimo episodio de movimiento (colocar flecha no cuenta)
        inShot = true;
        detectorStatus="COMPROBANDO TIRO";
        tShot = t;
        if(training.calibration){lastShot=t;}
        peak = 0.0;shotBaseline=gSum/gravityN;
        pulseEnd=0.0;pulseQuiet=-1.0;pulseRecovered=false;
        settleT = -1.0;quietSince=-1.0;
        pn = 0;
        var first=0;
        // Conservar al menos el ultimo segundo aun si no se observa una apertura clara.
        if(start>t-1000){start=t-1000;}
        if(start<t-6000){start=t-6000;}  // tope de ventana: nunca mas de 6 s de traza
        while(first<rn-1 && rt[(ri-rn+rx.size()+first)%rx.size()]<start){first++;}
        var points=rn-first;
        snapT = t;snapTimes=new [points];
        snapDraw = motionSince >= 0 ? t - motionSince : (drawStart >= 0 ? t - drawStart : -1.0);  // desde la apertura real, no desde colocar la flecha
        snapHr = lastHr;
        if(training.calibration){preStable(false);}
        var dminX=1000000.0,dmaxX=-1000000.0,dminY=1000000.0,dmaxY=-1000000.0,sx=0.0,sxy=0.0,sy=0.0,syy=0.0,dn=0;
        var dc=72;if(dc>rn-2){dc=rn-2;}
        for(var d=2;d<=dc;d++){var q2=(ri-1-d+rx.size())%rx.size();
            var age=t-rt[q2];if(age>900){break;}if(age<80){continue;}
            if(rx[q2]<dminX){dminX=rx[q2];}if(rx[q2]>dmaxX){dmaxX=rx[q2];}
            if(ry[q2]<dminY){dminY=ry[q2];}if(ry[q2]>dmaxY){dmaxY=ry[q2];}
            sx+=rx[q2];sxy+=rx[q2]*rx[q2];sy+=ry[q2];syy+=ry[q2]*ry[q2];dn+=1;}
        var drift=(dmaxX-dminX)>(dmaxY-dminY)?(dmaxX-dminX):(dmaxY-dminY);
        var vx=sxy/dn-(sx/dn)*(sx/dn),vy=syy/dn-(sy/dn)*(sy/dn);
        var variance=vx>vy?vx:vy, wob=Math.sqrt(variance>0?variance:0.0);  // evita NaN por redondeo en reposo
        var nv=pstdev(gBuf);if(nv<wob){nv=wob;}
        snapScore = clamp(100 - nv * 0.8 - drift * 0.10);  // puntua el apunte previo; la apertura no es temblor
        var recent=new [rn<64?rn:64];
        for(var r=0;r<recent.size();r++){recent[r]=rm[(ri-1-r+rx.size())%rx.size()];}
        snapInstab = pstdev(recent);
        // Centrar en el ultimo medio segundo de apuntado, no en toda la apertura.
        var mx=0.0,my=0.0,anchor=rn<10?rn:10;
        for(var j=0;j<anchor;j++){var idx=(ri-1-j+rx.size())%rx.size();mx+=rx[idx];my+=ry[idx];}
        mx/=anchor;my/=anchor;
        postMx = mx;
        postMy = my;
        snapTx = new [points] as Array<Float>;
        snapTy = new [points] as Array<Float>;
        snapMag = new [points] as Array<Float>;
        snapYw = new [points] as Array<Float>;
        snapYw2 = new [points] as Array<Float>;
        snapPt = new [points] as Array<Float>;
        snapPx = new [points] as Array<Float>;
        snapPy = new [points] as Array<Float>;
        snapPz = new [points] as Array<Float>;
        for (var i = 0; i < points; i++) {
            var k = (ri - rn + rx.size() + first + i) % rx.size();
            snapTx[i] = rx[k];
            snapTy[i] = ry[k];
            snapMag[i] = rm[k];snapTimes[i]=rt[k]-t;
            snapYw[i] = ryw[k];snapYw2[i] = ryw2[k];snapPt[i] = rpt[k];
            snapPx[i] = rpx[k];snapPy[i] = rpy[k];snapPz[i] = rpz[k];
        }
    }

    private function finalize() as Void {
        mark("FIN");
        try { finalizeBody(); } catch (e instanceof Lang.Exception) { note("FNZ:" + e.getErrorMessage(), "fnz", false); }
        mark(null);
    }

    private function finalizeBody() as Void {
        inShot = false;
        if(!training.calibration && (peak<shotLimit || !pulseRecovered || pulseEnd>250)){detectorStatus="PULSO DESCARTADO";return;}  // la sensibilidad se valida con el pulso completo, no con su primera muestra
        lastShot=tShot;
        drawStart=-1.0;
        detectorStatus=null;discardInfo=null;lastPeakDev=0.0;

        lastScore = snapScore.toNumber();
        var max=training.calibration?32:64;
        var msg = {
            "sid" => sid,
            "clock" => clockSource,
            "rate" => rateA,
            "trace_t" => decimate(snapTimes,max),
            "pre_t" => decimate(snapTimes,48),
            "post_t" => subArray(postTimes,pn),
            "dt" => 1000.0 * stride / rateA,
            "t" => snapT,
            "hr" => snapHr,
            "peak" => peak.toNumber(),
            "instab" => snapInstab.toNumber(),
            "settle" => settleT,
            "score" => snapScore,
            "tx" => decimate(snapTx, max),
            "yw" => decimate(snapYw, max),
            "yw2" => decimate(snapYw2, max),
            "pt" => decimate(snapPt, max),
            "qx" => decimate(snapPx, max),
            "qy" => decimate(snapPy, max),
            "qz" => decimate(snapPz, max),
            "qx2" => subArray(postPX, pn),
            "qy2" => subArray(postPY, pn),
            "qz2" => subArray(postPZ, pn),
            "drawms" => snapDraw,
            "ty" => decimate(snapTy, max),
            "mp" => decimate(snapMag, 48),
            "mq" => subArray(postMag, pn),
            "px" => diffArray(subArray(postX, pn), 0.0),
            "py" => diffArray(subArray(postY, pn), 0.0)
        };
        if(training.calibration){msg["candidate"]=true;msg["pose"]=snapPose;}
        var rr = rrRmssd();
        if (rr != null) { msg["rmssd"] = rr; }
        training.add(msg);
        WatchUi.requestUpdate();
    }

    public function finishPending() { if(inShot){try{finalize();}catch(e instanceof Lang.Exception){note("FIN:"+e.getErrorMessage(), "fin", false);inShot=false;}} }
    public function pending() { return qTail-qHead; }
    public function emit(msg) { msg["sid"]=sid;msg["eid"]=qTail;enqueue({"event"=>msg,"checkpoint"=>training.record()});training.save();flush(); }
    private function sendControl(key as String) as Void { emit({"kind"=>key,"state"=>training.snapshot()}); }
    public function onPhone(message as Communications.PhoneAppMessage) as Void {
        try {
        var m=message.data;
        if(!(m instanceof Dictionary)){return;}
        clearNote("phn");
        if(m.hasKey("ack") && qHead<qTail && m["ack"]==qHead) {
            var first=Application.Storage.getValue("queued"+qHead);
            if(first instanceof Dictionary && first.hasKey("event")){first=first["event"];}
            if(first instanceof Dictionary && first["sid"].equals(m["sid"])) {
                Application.Storage.setValue("queueIndex",[qHead+1,qTail]);qHead++;Application.Storage.deleteValue("queued"+(qHead-1));sending=false;
                if(closing && qHead==qTail){exitPending=true;}else{flush();}
            }
        }
        if(m.hasKey("cid") && m.hasKey("sid")) {
            var knownSid = m["sid"].equals(sid);
            var isThreshold = m.hasKey("action") && (m["action"] instanceof String) && (m["action"].equals("threshold") || m["action"].equals("calibrateShot") || m["action"].equals("deleteProfile"));  // ajustes de equipo: valen aunque la sesion cambiara
            if(closing || (!knownSid && !isThreshold)) {Communications.transmit({"commandAck"=>m["cid"],"client"=>m["client"],"error"=>"Actividad terminada"},null,new CommandListener());return;}
            if(m.hasKey("client") && !m["client"].equals(training.commandClient)){training.commandClient=m["client"];training.lastCommand=0;}
            if(m["cid"]>training.lastCommand) {
                finishPending();var previous=training.lastCommand;training.lastCommand=m["cid"];
                try {
                    var value=m["value"];
                    if(m["action"].equals("calibrateShot")){value={"peak"=>value,"profile"=>m["profile"],"requestId"=>m["requestId"]};if(m.hasKey("pose")){value["pose"]=m["pose"];}}
                    training.act(m["action"],value);training.save();
                }
                catch(e instanceof Lang.Exception){training.lastCommand=previous;note("Error guardando orden", "ord", false);return;}
            }
            Communications.transmit({"commandAck"=>m["cid"],"client"=>m["client"]},null,new CommandListener());
        }
        } catch(e instanceof Lang.Exception){note("PHN:"+e.getErrorMessage(), "phn", false);}
    }
    private function enqueue(msg as Dictionary) as Void {
        try {
            if (qTail - qHead >= 25) {  // sin ACKs del movil la cola no puede crecer sin limite: se conserva lo reciente
                for (var k = qHead; k < qTail - 10; k++) { Application.Storage.deleteValue("queued" + k); }
                qHead = qTail - 10;
                Application.Storage.setValue("queueIndex", [qHead, qTail]);
            }
            Application.Storage.setValue("queued" + qTail, msg);
            Application.Storage.setValue("queueIndex", [qHead, qTail + 1]);
            qTail += 1;
            clearNote("mem");
        } catch (e instanceof Lang.Exception) { note("Memoria de envio llena", "mem", true); }
    }

    // ---- cola de reenvío ----
    public function flushTimer() as Void {
        if (exitPending) { System.exit(); }  // salir SIEMPRE del contexto principal, nunca de un callback
        if(sending && System.getTimer()-txStarted>12000){sending=false;}
        try { flush(); } catch (e instanceof Lang.Exception) { }
        WatchUi.requestUpdate();
    }

    private function flush() as Void {
        try {
            if (sending || qHead >= qTail) { return; }
            var m = Application.Storage.getValue("queued" + qHead);
            if (!(m instanceof Dictionary)) { note("Cola de envio incompleta", "queue", true); return; }
            if(m.hasKey("event")){var ev=m["event"];if(!(ev instanceof Dictionary)){note("Cola de envio incompleta", "queue", true);return;}m=ev;}
            m["eid"]=qHead;
            sending = true;
            txStarted=System.getTimer();
            mark("TX");
            Communications.transmit(m, null, new TxListener(self));
            mark(null);
            clearNote("tx");
            clearNote("queue");
        } catch (e instanceof Lang.Exception) { sending = false; mark(null); note("TX:" + e.getErrorMessage(), "tx", false); }
    }

    public function onTxAck() as Void { sending=false; clearNote("tx"); } // Transport ACK is not a durable receipt.

    public function onTxError() as Void {
        sending = false;
    }

    private function decimate(buf as Array<Float>, max as Number) as Array<Float> {
        var n = buf.size();
        var count=n<max?n:max;
        var out = new [count] as Array<Float>;
        var tail=(count/2).toNumber(),head=count-tail;
        // Mitad para toda la apertura; mitad para el detalle inmediatamente previo.
        for (var i = 0; i < count; i++) {var k=i;if(n>count){k=i<head?(head<2?0:(i*(n-tail-1)/(head-1)).toNumber()):n-tail+i-head;}out[i]=buf[k];}
        return out;
    }

    private function subArray(buf as Array<Float>, n as Number) as Array<Float> {
        var out = new [n] as Array<Float>;
        for (var i = 0; i < n; i++) { out[i] = buf[i]; }
        return out;
    }

    private function diffArray(buf as Array<Float>, ref as Float) as Array<Float> {
        var out = new [buf.size()] as Array<Float>;
        for (var i = 0; i < buf.size(); i++) { out[i] = buf[i] - ref; }
        return out;
    }

    private function mean(buf as Array) as Float {
        var n = buf.size();
        var s = 0.0;
        for (var i = 0; i < n; i++) { s += buf[i]; }
        return s / n;
    }

    private function pstdev(buf as Array) as Float {
        var m = mean(buf);
        var n = buf.size();
        var v = 0.0;
        for (var i = 0; i < n; i++) { var d = buf[i] - m; v += d * d; }
        return Math.sqrt(v / n);
    }

    private function clamp(v as Float) as Float {
        if (v < 0) { return 0.0; }
        if (v > 100) { return 100.0; }
        return v;
    }

    public function getInitialView() as [Views] or [Views, InputDelegates] {
        return [new ArcheryView(), new ArcheryDelegate()];
    }
}

class CommandListener extends Communications.ConnectionListener {
    function initialize() {ConnectionListener.initialize();}
    function onComplete() as Void {}
    function onError() as Void {}
}
