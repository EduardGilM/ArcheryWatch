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
        if (!askedMode) { askedMode = true; openModeMenu(); }
    }

    public function onUpdate(dc as Dc) as Void {
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
            var yy = 78;
            for (var pi = 0; pi < _app.probeReport.size(); pi++) {
                dc.drawText(cx, yy, Graphics.FONT_XTINY, _app.probeReport[pi], Graphics.TEXT_JUSTIFY_CENTER);
                yy += dc.getFontHeight(Graphics.FONT_XTINY) + 5;
            }
            dc.setColor(Graphics.COLOR_DK_GRAY, Graphics.COLOR_TRANSPARENT);
            dc.drawText(cx, yy + 10, Graphics.FONT_XTINY, "START: cerrar diagnostico", Graphics.TEXT_JUSTIFY_CENTER);
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
        if (t.calibration) {
            dc.setColor(Graphics.COLOR_ORANGE, Graphics.COLOR_TRANSPARENT);
            dc.drawText(cx, yLine1 - hXt - 8, Graphics.FONT_XTINY, "CALIBRANDO " + t.positive.size() + "/3", Graphics.TEXT_JUSTIFY_CENTER);
        } else if (t.paused) {
            dc.setColor(Graphics.COLOR_DK_GRAY, Graphics.COLOR_TRANSPARENT);
            dc.drawText(cx, yLine1 - hXt - 8, Graphics.FONT_XTINY, "PAUSA", Graphics.TEXT_JUSTIFY_CENTER);
        } else if (_app.discardInfo != null) {
            dc.setColor(Graphics.COLOR_ORANGE, Graphics.COLOR_TRANSPARENT);
            dc.drawText(cx, yLine1 - hXt - 8, Graphics.FONT_XTINY, "✕ " + _app.discardInfo, Graphics.TEXT_JUSTIFY_CENTER);
        } else if (t.calibration == false && _app.lastPeakDev > 800.0 && System.getTimer() - _app.lastPeakAt < 30000) {
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
        dc.drawText(cx, yHero, Graphics.FONT_NUMBER_HOT, t.calibration ? t.positive.size()+"/3" : t.count() + (t.target > 0 ? "/" + t.target : ""), Graphics.TEXT_JUSTIFY_CENTER);
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
        var a=Application.getApp();var id=item.getId();
        WatchUi.popView(WatchUi.SLIDE_IMMEDIATE);
        a.training.act(id[0],id[1]);
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
        if(_app.probeReport.size() > 0){_app.probeReport = new [0];WatchUi.requestUpdate();return true;}
        if(_app.closing){openTrainingMenu();return true;}
        _app.finishPending();
        _app.training.act(_app.training.paused ? "pause" : (_app.training.resting ? "next" : "close"),0);
        return true;
    }
    public function onMenu() as Boolean { openTrainingMenu();return true; }
    public function onBack() as Boolean { openTrainingMenu();return true; }
    public function onNextPage() as Boolean { openTrainingMenu();return true; }

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

    public var discardInfo=null;  // ultimo motivo de descarte: persiste hasta el proximo tiro aceptado
    public var lastPeakDev=0.0;   // mayor sacudida reciente SIN tiro aceptado (diagnostico de umbral en campo)
    public var lastPeakAt=0;
    public var lastScore = 0;
    public var lastHr = 0;
    public var t0 = 0;
    public var err = null;
    public var saved = false;
    public var closing=false;
    private var session = null;

    // Detector causal; el prototipo Python requiere equivalencia antes de validar parámetros.
    private var PRE_STABLE = 450.0;  // el apuntado previo debe estar quieto (pstdev mg de la ventana vieja)
    private var REFRAC = 1500.0;     // ms refractarios
    private var POST = 1200.0;       // ms de ventana post-suelta (latencia flecha->pantalla)
    private var SETTLE_MG = 300.0;   // umbral de asentamiento

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
    public var curMagX=1.0, curMagY=0.0;        // ultima lectura del magnetometro (alineada por onData)
    private var rrRing=new [90] as Array<Float>; private var rrCount=0;
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
    private var peak = 0.0;
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

    public function configureRate(rate) {
        rateA=rate;gravityN=Math.ceil(rateA*0.5).toNumber();stableN=gravityN-Math.ceil(rateA*0.08).toNumber();
        if(stableN<1){stableN=1;}stride=Math.ceil(rateA/20.0).toNumber();
        gBuf=new [gravityN];for(var i=0;i<gravityN;i++){gBuf[i]=1000.0;}
        gSum=1000.0*gravityN;gCount=0;gi=0;rn=0;ri=0;dec=0;drawStart=-1.0;drawQuiet=0.0;motionSince=-1.0;motionSteps=0;
    }

    public function onStart(state as Dictionary?) as Void {
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
            training.restore(checkpoint);nShots=training.rows.size();
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
            sendControl("start");
        } catch (e instanceof Lang.Exception) {
            err = e.getErrorMessage();
        }
    }

    public function onStop(state as Dictionary?) as Void {
        try { if (inShot) { finalize(); }
            if(training!=null && !closing) {finishActivity();}
        } catch(e instanceof Lang.Exception){}
        try {
            timer.stop();
            Sensor.unregisterSensorDataListener();
        } catch (e instanceof Lang.Exception) {
        }
        if (session != null) {
            if (session.isRecording()) {
                session.stop();
                saved = session.save();
            }
            session = null;  // tras stop/save el objeto queda invalido: cualquier metodo suyo es System Error
        }
    }

    public function finishActivity() {
        if(closing){return;}
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
        System.println("FA-6");
    }

    public function rrRmssd() as Float or Null {
        if (rrCount < 11) { return null; }
        var from = rrCount - 31; if (from < 1) { from = 1; }
        var sum = 0.0, n = 0;
        for (var i = from; i < rrCount; i++) { var d = rrRing[i] - rrRing[i-1]; sum += d * d; n += 1; }
        return n > 0 ? Math.sqrt(sum / n) : null;
    }

    public function probeLine(line as Object) as Void {
        if (line == null) { return; }
        var txt = line.toString();
        while (txt.length() > 0 && probeReport.size() < 9) {
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
        } else { probeLine("MAG api no expuesta"); }
        if (Toybox has :SensorHistory && SensorHistory has :getPressureHistory) {
            var ph = SensorHistory.getPressureHistory({:period => new Toybox.Time.Duration(300), :order => SensorHistory.ORDER_NEWEST_FIRST});
            var ps = ph != null ? ph.next() : null;  // next() devuelve null cuando se agota (no hay hasNext)
            var pd = ps != null ? ps.data : null;
            probeLine(pd != null ? "BAR " + pd + " Pa" : "BAR sin lectura");
        } else { probeLine("BAR api no expuesta"); }
        try {
            Sensor.unregisterSensorDataListener();
            Sensor.registerSensorDataListener(method(:onData), {
                :period => 1,
                :accelerometer => { :enabled => true, :sampleRate => 25 },
                :magnetometer => { :enabled => true, :sampleRate => 25 },
                :heartBeatIntervals => { :enabled => true }
            });
            probeLine("LISTENER MAG+RR OK");
        } catch (e instanceof Lang.Exception) {
            probeLine("LISTENER RECHAZADO");
            probeLine(e.getErrorMessage());
        }
    }

    public function onHr(sensorInfo as Sensor.Info) as Void {
        if (sensorInfo.heartRate != null) {
            lastHr = sensorInfo.heartRate;
        }
    }

    public function onData(data as Sensor.SensorData) as Void {
        if (probeMode) {
            var mg = data has :magnetometerData ? data.magnetometerData : null;
            probeLine(mg != null && mg.x.size() > 0 ? "MAG dato SI (" + mg.x[0] + " mGauss)" : "MAG dato ausente");
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
                Sensor.unregisterSensorDataListener();
                Sensor.registerSensorDataListener(method(:onData), { :period => 1, :accelerometer => { :enabled => true, :sampleRate => rateA } });
            }
            return;
        }
        var a = data.accelerometerData;
        if (a == null || a.x.size() == 0) { return; }
        var n = a.x.size();
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
        if (ivs != null) { for (var v = 0; v < ivs.size() && rrCount < rrRing.size(); v++) { if (ivs[v] > 300.0 && ivs[v] < 2500.0) { rrRing[rrCount] = ivs[v]; rrCount += 1; } } }
        try {
            for (var i = 0; i < n; i++) {
                var when=timestamps!=null?timestamps[i]+sensorOffset:now-(n-1-i)*(1000.0/rateA);
                if(when<=lastSample){continue;}
                if(lastSample>=0 && when-lastSample>2000) {if(inShot){finalize();}configureRate(rateA);}
                lastSample=when;
                if (magN != null && i < magN.x.size()) { curMagX = magN.x[i].toFloat(); curMagY = magN.y[i].toFloat(); }  // lote corto: conserva el ultimo valor, sin repetir en cascada
                sample(a.x[i].toFloat(),a.y[i].toFloat(),a.z[i].toFloat(),when.toFloat());
            }
        } catch(e instanceof Lang.Exception){err="Error guardando datos";training.paused=true;}
        WatchUi.requestUpdate();
    }

    public function sample(x as Float, y as Float, z as Float, tAbs as Float) as Void {
        var t = tAbs - t0;
        var mag = Math.sqrt(x * x + y * y + z * z);
        var dev = mag - gSum / gravityN;
        var dx=x-previousX,dy=y-previousY,dz=z-previousZ;
        var jerk=Math.sqrt(dx*dx+dy*dy+dz*dz);
        previousX=x;previousY=y;previousZ=z;
        var limit=training.calibration?1200.0:training.threshold;
        var impulse=dev>limit || (jerk>limit*1.2 && (dev<0?-dev:dev)>limit*0.35);
        var adev=dev<0?-dev:dev;
        if (detectorStatus != null) { discardInfo = detectorStatus; }
        if (adev > 800.0) { if (adev > lastPeakDev) { lastPeakDev = adev; } lastPeakAt = System.getTimer(); }
        if(dev>limit && !training.calibration && drawStart<0){detectorStatus="FALTA APERTURA";}
        // apertura no detectada (aperturas suaves): una suelta claramente fuerte se acepta igual;
        // los movimientos falsos siguen fuera por la ventana de apuntado quieta (preStable)
        if (!inShot && !training.paused && (training.calibration || drawStart>=0 || adev>limit*1.05) && gCount >= gravityN && rn >= 10 && impulse && t - lastShot > REFRAC && preStable(dev>limit)) { trigger(t); peak = dev>0?dev:-dev;shotLimit=limit; }
        else if (inShot) {
            if (t-tShot<=120 && dev > peak) { peak = dev; }
            if(t-tShot<=600 && !pulseRecovered) {
                if((dev<0?-dev:dev)>shotLimit*0.5){pulseEnd=t-tShot;pulseQuiet=-1.0;}
                else {if(pulseQuiet<0){pulseQuiet=t;}if(t-pulseQuiet>=100){pulseRecovered=true;}}
            }
            if (settleT < 0 && t-tShot>50) {
                if((dev<0?-dev:dev)<SETTLE_MG) { if(quietSince<0){quietSince=t;} if(t-quietSince>=150){settleT=quietSince-tShot;} }
                else {quietSince=-1.0;}
            }
            if (t - tShot >= POST) { finalize(); }
        }
        gSum += mag - gBuf[gi]; gBuf[gi] = mag;
        gi = (gi + 1) % gravityN;
        if (gCount < gravityN) { gCount += 1; }
        if (dec == 0) {
            dx=x-baseX;dy=y-baseY;dz=z-baseZ;
            if(gCount==1 || training.paused || inShot){drawQuiet=t;baseX=x;baseY=y;baseZ=z;motionSince=-1.0;motionSteps=0;if(training.paused){drawStart=-1.0;}}
            else if(dx*dx+dy*dy+dz*dz>14400) {
                if(drawStart<0 && t-drawQuiet>=600){drawStart=t-600;}
                if(t-drawQuiet>600){motionSince=-1.0;motionSteps=0;}
                if(motionSince<0){motionSince=t;}motionSteps++;
                if(drawStart<0 && motionSteps>=3 && t-motionSince>=200){drawStart=motionSince;}
                drawQuiet=t;baseX=x;baseY=y;baseZ=z;
            }
            rx[ri] = x; ry[ri] = y; rz[ri]=z;rm[ri] = mag;rt[ri]=t;
            ryw[ri] = Math.atan2(curMagY, curMagX) * 57.2958;
            ri = (ri + 1) % rx.size();
            if (rn < rx.size()) { rn += 1; }
            if (inShot && pn < 24) { postMag[pn] = mag; postX[pn] = x; postY[pn] = y;postTimes[pn]=t-tShot; pn += 1; }
        }
        dec = (dec + 1) % stride;
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
        if(training.pose!=null && training.pose.size()>3 && training.pose[3]*3.0>allowed){allowed=training.pose[3]*3.0;}
        if(!training.calibration && !strong && variance>allowed){detectorStatus="APUNTE INESTABLE";return false;}
        if(!training.calibration && strong && variance>allowed*4){detectorStatus="APUNTE INESTABLE";return false;}
        snapPose=[ax,ay,az,variance>0?variance:0.0];
        if(!training.calibration && !strong && training.pose!=null) {
            var p=training.pose;
            var norm=Math.sqrt((ax*ax+ay*ay+az*az)*(p[0]*p[0]+p[1]*p[1]+p[2]*p[2]));
            if(norm<1 || (ax*p[0]+ay*p[1]+az*p[2])/norm<0.85){detectorStatus="POSTURA DISTINTA";return false;}
        }
        return true;
    }

    private function trigger(t as Float) as Void {
        // congelar métricas pre-suelta: los anillos aún contienen el apuntado
        var start=drawStart>lastShot+POST?drawStart:lastShot+POST;
        if(motionSince>=0 && t-motionSince<6000){ start=motionSince-200; if(start<0){start=0.0;} }  // la apertura REAL: ultimo episodio de movimiento (colocar flecha no cuenta)
        inShot = true;
        detectorStatus="COMPROBANDO TIRO";
        tShot = t;
        lastShot = t;
        peak = 0.0;
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
        var dminX=1000000.0,dmaxX=-1000000.0,dminY=1000000.0,dmaxY=-1000000.0,sx=0.0,sxy=0.0,sy=0.0,syy=0.0,dn=0;
        var dc=72;if(dc>rn-2){dc=rn-2;}
        for(var d=2;d<=dc;d++){var q2=(ri-1-d+rx.size())%rx.size();
            if(rx[q2]<dminX){dminX=rx[q2];}if(rx[q2]>dmaxX){dmaxX=rx[q2];}
            if(ry[q2]<dminY){dminY=ry[q2];}if(ry[q2]>dmaxY){dmaxY=ry[q2];}
            sx+=rx[q2];sxy+=rx[q2]*rx[q2];sy+=ry[q2];syy+=ry[q2]*ry[q2];dn+=1;}
        var drift=(dmaxX-dminX)>(dmaxY-dminY)?(dmaxX-dminX):(dmaxY-dminY);
        var vx=sxy/dn-(sx/dn)*(sx/dn),vy=syy/dn-(sy/dn)*(sy/dn);
        var wob=Math.sqrt(vx>vy?vx:vy);  // temblor de toda la ventana de traza (~6 s), no solo el final
        var nv=pstdev(gBuf);if(nv<wob){nv=wob;}
        snapScore = clamp(100 - nv * 0.8 - drift * 0.10);  // lo que se VE en la traza es lo que puntua
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
        for (var i = 0; i < points; i++) {
            var k = (ri - rn + rx.size() + first + i) % rx.size();
            snapTx[i] = rx[k];
            snapTy[i] = ry[k];
            snapMag[i] = rm[k];snapTimes[i]=rt[k]-t;
            snapYw[i] = ryw[k];
        }
    }

    private function finalize() as Void {
        inShot = false;
        drawStart=-1.0;
        if(peak < shotLimit*1.3 && (!pulseRecovered || pulseEnd>160)){detectorStatus="PULSO DESCARTADO";return;}  // suelta fuerte: el pulso no veta
        detectorStatus=null;discardInfo=null;lastPeakDev=0.0;
        if (training.calibration) { training.calibrateShot(peak,snapPose); return; }

        lastScore = snapScore.toNumber();
        var msg = {
            "sid" => sid,
            "clock" => clockSource,
            "rate" => rateA,
            "trace_t" => decimate(snapTimes,64),
            "pre_t" => decimate(snapTimes,48),
            "post_t" => subArray(postTimes,pn),
            "dt" => 1000.0 * stride / rateA,
            "t" => snapT,
            "hr" => snapHr,
            "peak" => peak.toNumber(),
            "instab" => snapInstab.toNumber(),
            "settle" => settleT,
            "score" => snapScore,
            "tx" => decimate(snapTx, 64),
            "yw" => decimate(snapYw, 32),
            "drawms" => snapDraw,
            "ty" => decimate(snapTy, 64),
            "mp" => decimate(snapMag, 48),
            "mq" => subArray(postMag, pn),
            "px" => diffArray(subArray(postX, pn), 0.0),
            "py" => diffArray(subArray(postY, pn), 0.0)
        };
        var rr = rrRmssd();
        if (rr != null) { msg["rmssd"] = rr; }
        training.add(msg);
        WatchUi.requestUpdate();
    }

    public function finishPending() { if(inShot){finalize();} }
    public function pending() { return qTail-qHead; }
    public function emit(msg) { msg["sid"]=sid;msg["eid"]=qTail;enqueue({"event"=>msg,"checkpoint"=>training.record()});training.save();flush(); }
    private function sendControl(key as String) as Void { emit({"kind"=>key,"state"=>training.snapshot()}); }
    public function onPhone(message as Communications.PhoneAppMessage) as Void {
        var m=message.data;
        if(!(m instanceof Dictionary)){return;}
        if(m.hasKey("ack") && qHead<qTail && m["ack"]==qHead) {
            var first=Application.Storage.getValue("queued"+qHead);
            if(first instanceof Dictionary && first.hasKey("event")){first=first["event"];}
            if(first instanceof Dictionary && first["sid"].equals(m["sid"])) {
                Application.Storage.setValue("queueIndex",[qHead+1,qTail]);qHead++;Application.Storage.deleteValue("queued"+(qHead-1));sending=false;
                if(closing && qHead==qTail){exitPending=true;}else{flush();}
            }
        }
        if(m.hasKey("cid") && m.hasKey("sid")) {
            if(closing || !m["sid"].equals(sid)) {Communications.transmit({"commandAck"=>m["cid"],"client"=>m["client"],"error"=>"Actividad terminada"},null,new CommandListener());return;}
            if(m.hasKey("client") && !m["client"].equals(training.commandClient)){training.commandClient=m["client"];training.lastCommand=0;}
            if(m["cid"]>training.lastCommand) {
                finishPending();var previous=training.lastCommand;training.lastCommand=m["cid"];
                try {training.act(m["action"],m["value"]);training.save();}
                catch(e instanceof Lang.Exception){training.lastCommand=previous;err="Error guardando orden";return;}
            }
            Communications.transmit({"commandAck"=>m["cid"],"client"=>m["client"]},null,new CommandListener());
        }
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
        } catch (e instanceof Lang.Exception) { err = "Memoria de envio llena"; }
    }

    // ---- cola de reenvío ----
    public function flushTimer() as Void {
        if (exitPending) { System.exit(); }  // salir SIEMPRE del contexto principal, nunca de un callback
        if(sending && System.getTimer()-txStarted>12000){sending=false;}
        try { flush(); } catch (e instanceof Lang.Exception) { }
        WatchUi.requestUpdate();
    }

    private function flush() as Void {
        if (sending || qHead >= qTail) { return; }
        var m = Application.Storage.getValue("queued" + qHead);
        if (!(m instanceof Dictionary)) { err = "Cola de envio incompleta"; return; }
        if(m.hasKey("event")){m=m["event"] as Dictionary;}
        m["eid"]=qHead;
        sending = true;
        txStarted=System.getTimer();
        try { Communications.transmit(m, null, new TxListener(self)); }
        catch (e instanceof Lang.Exception) { sending = false; }
    }

    public function onTxAck() as Void { sending=false; } // Transport ACK is not a durable receipt.

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
