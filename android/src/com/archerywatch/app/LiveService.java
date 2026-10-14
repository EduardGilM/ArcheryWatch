package com.archerywatch.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import com.garmin.android.connectiq.ConnectIQ;
import com.garmin.android.connectiq.IQApp;
import com.garmin.android.connectiq.IQDevice;
import java.util.List;
import java.util.Map;

// Servicio en primer plano: escucha tiros del reloj con la pantalla apagada
// o la app cerrada; conserva eventos hasta que la UI confirma su almacenamiento.
public class LiveService extends Service {
    static EventQueue inbox, outbox;
    static LiveService instance;
    static volatile String STATUS = "";
    static volatile MainActivity ui;
    static CmfBleClient cmf;
    // UUID verificado en el propio reloj (id 0xA2C49E17B03A4F1E8D5C6B7A90E1F2D3)
    private static final String APP_UUID = "a2c49e17-b03a-4f1e-8d5c-6b7a90e1f2d3";
    private final Handler handler = new Handler(Looper.getMainLooper());
    private boolean registered = false;
    private android.content.SharedPreferences diagnostics;
    private IQDevice activeDevice;
    private String client;
    private int attempts = 0;

    @Override public void onCreate() {
        super.onCreate();
        instance = this;
        if (cmf == null) {
            cmf = new CmfBleClient(this);
            cmf.setListener(new CmfBleClient.Listener() {
                public void onStatus(String status) {}
                public void onDevice(String name, String address) {
                    if (ui != null) ui.push("cmfDevice(" + org.json.JSONObject.quote(name) + "," + org.json.JSONObject.quote(address) + ")");
                }
                public void onSample(long tMs, float gx, float gy, float gz, float ax, float ay, float az) {
                    if (ui != null) ui.push(String.format(java.util.Locale.US,
                        "cmfSample(%d,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f)", tMs, gx, gy, gz, ax, ay, az));
                }
                public void onShot(java.util.Map<String, Object> shot) {}
            });
        }
        android.content.SharedPreferences prefs = getSharedPreferences("inbox", MODE_PRIVATE);
        diagnostics = getSharedPreferences("connection", MODE_PRIVATE);
        client=diagnostics.getString("client",java.util.UUID.randomUUID().toString());
        diagnostics.edit().putString("client",client).commit();
        inbox = new EventQueue(new EventQueue.Disk() {
            public String read() { return prefs.getString("events", ""); }
            public boolean write(String value) { return prefs.edit().putString("events", value).commit(); }
        });
        outbox = new EventQueue(new EventQueue.Disk() {
            public String read() { return prefs.getString("commands", ""); }
            public boolean write(String value) { return prefs.edit().putString("commands", value).commit(); }
        });
        handler.post(commandPump);
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm.getNotificationChannel("live") == null) {
            nm.createNotificationChannel(new NotificationChannel("live", "ArcheryWatch en vivo",
                NotificationManager.IMPORTANCE_LOW));
        }
        startForeground(1, new Notification.Builder(this, "live")
            .setContentTitle("ArcheryWatch escuchando")
            .setContentText("Esperando tiros del reloj")
            .setSmallIcon(R.drawable.ic_notification)
            .setContentIntent(android.app.PendingIntent.getActivity(this, 0, new Intent(this, MainActivity.class), android.app.PendingIntent.FLAG_IMMUTABLE | android.app.PendingIntent.FLAG_UPDATE_CURRENT))
            .setOngoing(true)
            .build());
        initConnectIq();
        if (ui != null) ui.drain();
    }

    // el binder de Garmin Connect es quisquilloso tras reinstalaciones: reintentar hasta registrar
    private void initConnectIq() {
        try {
            ConnectIQ ciq = ConnectIQ.getInstance(this, ConnectIQ.IQConnectType.WIRELESS);
            ciq.initialize(this, false, new ConnectIQ.ConnectIQListener() {
                @Override public void onSdkReady() { registered = listen(ciq); }
                @Override public void onInitializeError(ConnectIQ.IQSdkErrorStatus e) {
                    android.util.Log.d("ArcheryWatch", "init error: " + e);
                    status("sin Garmin Connect: " + e);
                }
                @Override public void onSdkShutDown() { registered = false; }
            });
        } catch (Exception e) {
            android.util.Log.d("ArcheryWatch", "init exception", e);
        }

    }

    private boolean listen(ConnectIQ ciq) {
        try {
            ConnectIQ.IQApplicationEventListener l = new ConnectIQ.IQApplicationEventListener() {
                @Override public void onMessageReceived(IQDevice d, IQApp a, List<Object> msgs,
                                                        ConnectIQ.IQMessageStatus st) {
                    if (st != ConnectIQ.IQMessageStatus.SUCCESS) {
                        android.util.Log.d("ArcheryWatch", "mensaje con estado: " + st);
                        return;
                    }
                    if (msgs == null || a == null || !APP_UUID.replace("-", "").equalsIgnoreCase(a.getApplicationId())) return;
                    for (Object m : msgs) {
                        if (!(m instanceof Map)) continue;
                        Map mm = (Map) m;
                        activeDevice = d;
                        diagnostics.edit().putLong("device",d.getDeviceIdentifier()).apply();
                        if (mm.containsKey("commandAck")) {
                            if(!client.equals(mm.get("client")))continue;
                            EventQueue.Entry pending = outbox.peek();
                            if (pending != null && pending.id == ((Number)mm.get("commandAck")).longValue()) outbox.ack(pending.id);
                            if(mm.containsKey("error") && ui!=null) ui.push("notice("+org.json.JSONObject.quote(mm.get("error").toString())+")");
                            continue;
                        }
                        String js = mm.containsKey("kind") ? "liveEvent(" + MainActivity.toJson(mm) + ")" :
                            mm.containsKey("start") ? "liveStart(" + org.json.JSONObject.quote(String.valueOf(mm.getOrDefault("sid", ""))) + ")" :
                            mm.containsKey("end") ? "liveEnd(" + org.json.JSONObject.quote(String.valueOf(mm.getOrDefault("sid", ""))) + ")" : "liveShot(" + MainActivity.toJson(mm) + ")";
                        try {
                            inbox.offer(js); // ACK solamente después del commit duradero.
                            String kind=String.valueOf(mm.getOrDefault("kind",mm.containsKey("start")?"start":mm.containsKey("end")?"end":"shot"));
                            diagnostics.edit().putLong("receivedAt",System.currentTimeMillis()).putString("kind",kind).apply();
                            android.util.Log.i("ArcheryWatch", "received " + kind + " eid=" + mm.get("eid"));
                            if (mm.containsKey("eid")) { Map<String,Object> ack=new java.util.HashMap<>();ack.put("ack",mm.get("eid"));ack.put("sid",mm.get("sid"));send(d,ack); }
                            if (ui != null) ui.drain();
                        } catch (Exception error) { status("Error al guardar: " + error.getMessage()); }

                    }
                }
            };
            IQApp app = new IQApp(APP_UUID);
            int n = 0;
            for (IQDevice d : ciq.getKnownDevices()) {
                android.util.Log.d("ArcheryWatch", "registro en dispositivo: " + d.getFriendlyName());
                ciq.registerForAppEvents(d, app, l);  // registro directo, sin esperar a la sonda
                ciq.registerForDeviceEvents(d,(device, state) -> {
                    status(state==IQDevice.IQDeviceStatus.CONNECTED?"Receptor listo":"Reloj sin conexión");
                    if(state==IQDevice.IQDeviceStatus.CONNECTED) { try {ciq.registerForAppEvents(device,app,l);sendCommand();} catch(Exception ignored){} }
                });
                n++;
            }
            if (n > 0) {
                android.util.Log.d("ArcheryWatch", "listener registrado en " + n + " dispositivo(s)");
                status(ciq.getConnectedDevices().isEmpty()?"Reloj sin conexión":"Receptor listo");
            }
            return n > 0;  // solo cuenta como listo con registro por dispositivo
        } catch (Exception e) {
            android.util.Log.d("ArcheryWatch", "listen error", e);
            return false;
        }
    }

    // buffer y reenvío uniforme: cada entrada es una llamada JS lista para ejecutar
    static void dispatch(String js) {
        try { inbox.offer(js); }
        catch (IllegalStateException e) { status(e.getMessage()); return; }
        if (ui != null) ui.drain();
    }

    private void send(IQDevice device, Object payload) throws Exception {
        ConnectIQ.getInstance(this, ConnectIQ.IQConnectType.WIRELESS).sendMessage(device, new IQApp(APP_UUID), payload, (d,a,status) -> {});
    }
    static void command(String json) {
        if (instance == null || outbox == null) throw new IllegalStateException("Abre Garmin Connect e inténtalo de nuevo");
        outbox.offer(json);
        instance.handler.post(instance::sendCommand);
    }
    private void sendCommand() {
        EventQueue.Entry e = outbox.peek(); if(e == null || !registered) return;
        try {
            org.json.JSONObject json = new org.json.JSONObject(e.js);
            Map<String,Object> payload = new java.util.HashMap<>();
            java.util.Iterator<String> keys = json.keys();
            while(keys.hasNext()) { String key=keys.next(); Object v=json.get(key);
                if(v instanceof org.json.JSONArray) { java.util.ArrayList<Object> values=new java.util.ArrayList<>(); for(int i=0;i<((org.json.JSONArray)v).length();i++)values.add(((org.json.JSONArray)v).get(i)); v=values; }
                payload.put(key,v);
            }
            payload.put("cid", e.id);payload.put("client",client);
            if(activeDevice==null) {
                List<IQDevice> devices=ConnectIQ.getInstance(this, ConnectIQ.IQConnectType.WIRELESS).getKnownDevices();
                for(IQDevice d:devices)if(d.getDeviceIdentifier()==diagnostics.getLong("device",-1))activeDevice=d;
                if(activeDevice==null && devices.size()==1)activeDevice=devices.get(0);
            }
            if(activeDevice!=null) send(activeDevice,payload);
        } catch(Exception error) { status("Pendiente de conectar con el reloj"); }
    }
    private final Runnable commandPump = new Runnable() {
        public void run() { sendCommand(); handler.postDelayed(this, 5000); }
    };

    static void status(String s) {
        STATUS = s;
        if (ui != null) ui.push("liveStatus(" + org.json.JSONObject.quote(s) + ")");
    }
    static String diagnostics() {
        Map<String,Object> values=new java.util.HashMap<>();values.put("status",STATUS);
        values.put("pending",inbox==null?0:inbox.size());values.put("commands",outbox==null?0:outbox.size());
        boolean cmfOn = cmf != null && cmf.isRunning();
        values.put("connected", cmfOn || (STATUS != null && STATUS.contains("listo")));
        values.put("source", cmfOn ? "cmf" : "garmin");
        values.put("cmf", cmfOn);
        values.put("cmfAddress", cmf != null && cmf.address() != null ? cmf.address() : "");
        values.put("version",130);
        if(instance!=null){values.put("receivedAt",instance.diagnostics.getLong("receivedAt",0));values.put("kind",instance.diagnostics.getString("kind",""));}
        return MainActivity.toJson(values);
    }

    @Override public int onStartCommand(Intent i, int flags, int id) { return START_STICKY; }

    // re-registrar el listener cada minuto: el routing de Garmin Cadena podria caducar tras reinicios de la app del reloj
    private final Runnable reRegister = new Runnable() {
        @Override public void run() {
            if (registered && ++attempts % 4 == 0) {
                try { listen(ConnectIQ.getInstance(LiveService.this, ConnectIQ.IQConnectType.WIRELESS)); }
                catch (Exception e) { android.util.Log.d("ArcheryWatch", "re-register falló", e); }
            } else if(!registered) { initConnectIq(); }
            handler.postDelayed(reRegister, 15000);
        }
    };
    {
        handler.postDelayed(reRegister, 15000);
    }
    @Override public void onDestroy() {
        if (cmf != null) try { cmf.disconnect(); } catch (Exception ignored) {}
        instance = null;
        handler.removeCallbacksAndMessages(null);
        try { ConnectIQ.getInstance(this, ConnectIQ.IQConnectType.WIRELESS).shutdown(this); } catch (Exception ignored) { }
        super.onDestroy();
    }
    
    static void cmfScan() {
        if (instance == null) throw new IllegalStateException("Abre la app e inténtalo de nuevo");
        cmf.startScan();
    }
    static void cmfConnect(String address) {
        if (instance == null) throw new IllegalStateException("Abre la app e inténtalo de nuevo");
        cmf.connect(address);
    }
    static void cmfDisconnect() {
        if (instance != null && cmf != null) cmf.disconnect();
    }
    static void cmfThreshold(float g) {
        if (instance != null && cmf != null) cmf.setThreshold(g);
    }

    @Override public IBinder onBind(Intent i) { return null; }
}
