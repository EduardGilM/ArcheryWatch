package com.archerywatch.app;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCallback;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattDescriptor;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothProfile;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanResult;
import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Cliente BLE nativo para CMF Watch 3 Pro (FATE + logsrv).
 * Solo SETGYROSWITCH 0/1 (RAM). Nunca SETGYROCAL ni escrituras flash/OTA.
 */
public class CmfBleClient {
    static final UUID LOG_SVC = UUID.fromString("e49a3001-f69a-11e8-8eb2-f2801f1b9fd1");
    static final UUID LOG_RX = UUID.fromString("e49a3002-f69a-11e8-8eb2-f2801f1b9fd1");
    static final UUID LOG_TX = UUID.fromString("e49a3003-f69a-11e8-8eb2-f2801f1b9fd1");
    static final UUID FATE_W = UUID.fromString("77d4ff01-2fe2-2334-0d35-9ccd078f529c");
    static final UUID FATE_N = UUID.fromString("77d4ff02-2fe2-2334-0d35-9ccd078f529c");
    static final UUID CCCD = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb");
    private static final byte[] LOG_PREPARE = hex("1D108105000002000100");
    private static final long POLL_MS = 20;
    private static final String TAG = "ArcheryWatchCMF";

    interface Listener {
        void onStatus(String status);
        void onDevice(String name, String address);
        void onSample(long tMs, float gx, float gy, float gz, float ax, float ay, float az);
        void onShot(java.util.Map<String, Object> shot);
    }

    private final Context app;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final CmfShotDetector detector = new CmfShotDetector();
    private Listener listener;
    private BluetoothGatt gatt;
    private BluetoothGattCharacteristic logRx, fateW;
    private final ByteArrayBuffer rxBuf = new ByteArrayBuffer();
    private boolean running, switchOn, mtuReady, notifReady;
    private String address;
    private long sessionStart;
    private final Runnable poll = new Runnable() {
        @Override public void run() {
            if (!running || logRx == null || !mtuReady) return;
            writeChunked(logRx, shellFrame("dbg mdw 0x38010fd8 6"), false);
            handler.postDelayed(this, POLL_MS);
        }
    };
    private ScanCallback scanCb;

    CmfBleClient(Context context) { this.app = context.getApplicationContext(); }

    void setListener(Listener l) { listener = l; }
    void setThreshold(float g) { detector.thresholdG = g; }
    boolean isRunning() { return running; }
    String address() { return address; }

    void startScan() {
        try {
            BluetoothManager bm = (BluetoothManager) app.getSystemService(Context.BLUETOOTH_SERVICE);
            BluetoothAdapter ad = bm != null ? bm.getAdapter() : null;
            if (ad == null || !ad.isEnabled()) { status("Bluetooth apagado"); return; }
            BluetoothLeScanner sc = ad.getBluetoothLeScanner();
            if (sc == null) { status("Sin escáner BLE"); return; }
            stopScan();
            scanCb = new ScanCallback() {
                @Override public void onScanResult(int callbackType, ScanResult result) {
                    BluetoothDevice d = result.getDevice();
                    if (d == null || d.getAddress() == null) return;
                    String name = d.getName();
                    if (name == null && result.getScanRecord() != null) name = result.getScanRecord().getDeviceName();
                    if (name == null) name = "";
                    String low = name.toLowerCase(Locale.ROOT);
                    if (!(low.contains("cmf") || low.contains("watch") || low.contains("nothing"))) return;
                    if (listener != null) listener.onDevice(name, d.getAddress());
                }
                @Override public void onScanFailed(int errorCode) { status("Escaneo falló: " + errorCode); }
            };
            sc.startScan(scanCb);
            status("Buscando CMF…");
            handler.postDelayed(this::stopScan, 12000);
        } catch (SecurityException e) {
            status("Falta permiso Bluetooth");
        } catch (Exception e) {
            status("Escaneo: " + e.getMessage());
        }
    }

    void stopScan() {
        try {
            BluetoothManager bm = (BluetoothManager) app.getSystemService(Context.BLUETOOTH_SERVICE);
            BluetoothAdapter ad = bm != null ? bm.getAdapter() : null;
            if (ad != null && scanCb != null) ad.getBluetoothLeScanner().stopScan(scanCb);
        } catch (Exception ignored) {}
        scanCb = null;
    }

    void connect(String addr) {
        if (addr == null || addr.isEmpty()) { status("Dirección vacía"); return; }
        stopScan();
        disconnect(false);
        address = addr.toUpperCase(Locale.ROOT);
        running = true;
        sessionStart = System.currentTimeMillis();
        detector.reset(sessionStart);
        status("Conectando " + address + "…");
        try {
            BluetoothManager bm = (BluetoothManager) app.getSystemService(Context.BLUETOOTH_SERVICE);
            BluetoothDevice dev = bm.getAdapter().getRemoteDevice(address);
            gatt = dev.connectGatt(app, false, gattCb, BluetoothDevice.TRANSPORT_LE);
        } catch (SecurityException e) {
            running = false;
            status("Falta permiso Bluetooth");
        } catch (Exception e) {
            running = false;
            status("Conexión: " + e.getMessage());
        }
    }

    void disconnect() { disconnect(true); }

    private void disconnect(boolean notify) {
        handler.removeCallbacks(poll);
        running = false;
        if (switchOn && fateW != null && gatt != null) {
            try { writeChunked(fateW, "AT SETGYROSWITCH 0".getBytes(StandardCharsets.UTF_8), false); } catch (Exception ignored) {}
            switchOn = false;
        }
        try { if (gatt != null) gatt.close(); } catch (Exception ignored) {}
        gatt = null; logRx = null; fateW = null; mtuReady = false; notifReady = false;
        if (notify) status("CMF desconectado");
    }

    private final BluetoothGattCallback gattCb = new BluetoothGattCallback() {
        @Override public void onConnectionStateChange(BluetoothGatt g, int statusCode, int newState) {
            if (newState == BluetoothProfile.STATE_CONNECTED) {
                status("Enlazado, descubriendo…");
                try { g.requestMtu(247); } catch (SecurityException e) { status("MTU: permiso"); }
            } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                boolean was = running;
                handler.post(() -> {
                    if (was && switchOn) { /* best-effort already in disconnect */ }
                    disconnect(false);
                    if (was) status("CMF desconectado");
                });
            }
        }
        @Override public void onMtuChanged(BluetoothGatt g, int mtu, int statusCode) {
            android.util.Log.i(TAG, "MTU " + mtu);
            mtuReady = true;
            try { g.discoverServices(); } catch (SecurityException e) { status("Discover: permiso"); }
        }
        @Override public void onServicesDiscovered(BluetoothGatt g, int statusCode) {
            if (statusCode != BluetoothGatt.GATT_SUCCESS) { status("Servicios: " + statusCode); return; }
            BluetoothGattService log = g.getService(LOG_SVC);
            BluetoothGattService fate = null;
            for (BluetoothGattService s : g.getServices()) {
                if (s.getCharacteristic(FATE_W) != null) { fate = s; break; }
            }
            if (log == null) { status("Sin logsrv en el reloj"); return; }
            logRx = log.getCharacteristic(LOG_RX);
            BluetoothGattCharacteristic logTx = log.getCharacteristic(LOG_TX);
            if (fate != null) fateW = fate.getCharacteristic(FATE_W);
            BluetoothGattCharacteristic fateN = fate != null ? fate.getCharacteristic(FATE_N) : null;
            if (logRx == null || logTx == null) { status("Características logsrv incompletas"); return; }
            enableNotify(g, logTx, () -> {
                if (fateN != null) enableNotify(g, fateN, CmfBleClient.this::onReady);
                else onReady();
            });
        }
        @Override public void onCharacteristicChanged(BluetoothGatt g, BluetoothGattCharacteristic c) {
            byte[] v = c.getValue();
            if (v == null) return;
            if (FATE_N.equals(c.getUuid())) {
                String t = new String(v, StandardCharsets.UTF_8);
                android.util.Log.d(TAG, "FATE " + t.trim());
                return;
            }
            if (LOG_TX.equals(c.getUuid())) ingestLog(v);
        }
        @Override public void onCharacteristicWrite(BluetoothGatt g, BluetoothGattCharacteristic c, int statusCode) {}
    };

    private void onReady() {
        notifReady = true;
        status("CMF listo");
        writeChunked(logRx, LOG_PREPARE, false);
        handler.postDelayed(() -> {
            if (!running || fateW == null) return;
            writeChunked(fateW, "AT SETGYROSWITCH 1".getBytes(StandardCharsets.UTF_8), false);
            switchOn = true;
            LiveService.dispatch("liveStart(" + org.json.JSONObject.quote("cmf-" + sessionStart) + ")");
            handler.postDelayed(poll, 400);
            status("CMF en vivo (gyro+accel)");
        }, 400);
    }

    private void enableNotify(BluetoothGatt g, BluetoothGattCharacteristic ch, Runnable next) {
        try {
            g.setCharacteristicNotification(ch, true);
            BluetoothGattDescriptor d = ch.getDescriptor(CCCD);
            if (d != null) {
                d.setValue(BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE);
                g.writeDescriptor(d);
            }
            handler.postDelayed(next, 300);
        } catch (SecurityException e) {
            status("Notify: permiso");
        }
    }

    private void writeChunked(BluetoothGattCharacteristic ch, byte[] data, boolean response) {
        if (gatt == null || ch == null || data == null) return;
        try {
            int step = 20;
            for (int i = 0; i < data.length; i += step) {
                int n = Math.min(step, data.length - i);
                byte[] part = new byte[n];
                System.arraycopy(data, i, part, 0, n);
                ch.setValue(part);
                ch.setWriteType(response ? BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT
                    : BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE);
                gatt.writeCharacteristic(ch);
                try { Thread.sleep(15); } catch (InterruptedException ignored) {}
            }
        } catch (SecurityException e) {
            status("Write: permiso");
        }
    }

    private static byte[] shellFrame(String text) {
        byte[] p = text.getBytes(StandardCharsets.UTF_8);
        ByteBuffer tlv = ByteBuffer.allocate(3 + p.length).order(ByteOrder.LITTLE_ENDIAN);
        tlv.put((byte) 1);
        tlv.putShort((short) p.length);
        tlv.put(p);
        byte[] body = tlv.array();
        ByteBuffer out = ByteBuffer.allocate(5 + body.length).order(ByteOrder.LITTLE_ENDIAN);
        out.put((byte) 0x1D).put((byte) 0x10).put((byte) 0x81);
        out.putShort((short) body.length);
        out.put(body);
        return out.array();
    }

    private void ingestLog(byte[] chunk) {
        rxBuf.append(chunk);
        while (true) {
            int i = rxBuf.indexOf((byte) 0x1D);
            if (i < 0) { rxBuf.clear(); return; }
            if (i > 0) rxBuf.discard(i);
            if (rxBuf.size() < 5) return;
            int kind = rxBuf.get(1) & 0xFF;
            int plen = (rxBuf.get(3) & 0xFF) | ((rxBuf.get(4) & 0xFF) << 8);
            if ((kind != 0x10 && kind != 0xF0 && kind != 0xF1) || plen > 8000) { rxBuf.discard(1); continue; }
            int total = 5 + plen;
            if (rxBuf.size() < total) return;
            byte[] frame = rxBuf.slice(0, total);
            rxBuf.discard(total);
            if (kind == 0xF0 && plen >= 3) {
                int tlen = (frame[6] & 0xFF) | ((frame[7] & 0xFF) << 8);
                int end = Math.min(8 + tlen, frame.length);
                if (end > 8) parseMdw(new String(frame, 8, end - 8, StandardCharsets.UTF_8));
            }
        }
    }

    // Acumula palabras de un dump mdw partido en varias lineas (fd8 / fe8).
    private final ArrayList<Integer> mdwWords = new ArrayList<>();
    private long mdwBase = -1;
    private long mdwAt;

    private void parseMdw(String text) {
        Matcher line = Pattern.compile("(?i)(38010f[0-9a-f]{2})\s*:\s*((?:[0-9a-f]{8}(?:\s+|$))+)")
            .matcher(text);
        while (line.find()) {
            long base = Long.parseLong(line.group(1), 16);
            ArrayList<Integer> words = new ArrayList<>();
            Matcher w = Pattern.compile("[0-9a-fA-F]{8}").matcher(line.group(2));
            while (w.find()) words.add((int) Long.parseLong(w.group(), 16));
            if (words.isEmpty()) continue;
            long now = System.currentTimeMillis();
            if (base == 0x38010fd8L || mdwBase < 0 || now - mdwAt > 80) {
                mdwWords.clear();
                mdwBase = base;
            }
            mdwAt = now;
            mdwWords.addAll(words);
            if (mdwWords.size() >= 6 && mdwBase == 0x38010fd8L) {
                onImu(now,
                    bits(mdwWords.get(3)), bits(mdwWords.get(4)), bits(mdwWords.get(5)),
                    bits(mdwWords.get(0)), bits(mdwWords.get(1)), bits(mdwWords.get(2)));
                mdwWords.clear();
                mdwBase = -1;
            } else if (base == 0x38010fe4L && words.size() >= 3) {
                onImu(now, bits(words.get(0)), bits(words.get(1)), bits(words.get(2)),
                    detector.ax, detector.ay, detector.az);
            }
        }
    }

    private void onImu(long t, float gx, float gy, float gz, float ax, float ay, float az) {
        if (listener != null) listener.onSample(t, gx, gy, gz, ax, ay, az);
        java.util.Map<String, Object> shot = detector.offer(t, gx, gy, gz, ax, ay, az);
        if (shot != null) {
            shot.put("sid", "cmf-" + sessionStart);
            if (listener != null) listener.onShot(shot);
            LiveService.dispatch("liveShot(" + MainActivity.toJson(shot) + ")");
        }
    }

    private void status(String s) {
        android.util.Log.i(TAG, s);
        if (listener != null) listener.onStatus(s);
        LiveService.status(s);
    }

    private static float bits(int w) {
        return Float.intBitsToFloat(w);
    }
    private static byte[] hex(String s) {
        byte[] out = new byte[s.length() / 2];
        for (int i = 0; i < out.length; i++) out[i] = (byte) Integer.parseInt(s.substring(i * 2, i * 2 + 2), 16);
        return out;
    }

    /** Buffer circular mínimo para reensamblar frames logsrv. */
    static final class ByteArrayBuffer {
        private byte[] buf = new byte[4096];
        private int len;
        void append(byte[] a) {
            if (len + a.length > buf.length) {
                byte[] n = new byte[Math.max(buf.length * 2, len + a.length)];
                System.arraycopy(buf, 0, n, 0, len);
                buf = n;
            }
            System.arraycopy(a, 0, buf, len, a.length);
            len += a.length;
        }
        int size() { return len; }
        int get(int i) { return buf[i]; }
        int indexOf(byte b) {
            for (int i = 0; i < len; i++) if (buf[i] == b) return i;
            return -1;
        }
        void discard(int n) {
            if (n >= len) { len = 0; return; }
            System.arraycopy(buf, n, buf, 0, len - n);
            len -= n;
        }
        byte[] slice(int from, int n) {
            byte[] o = new byte[n];
            System.arraycopy(buf, from, o, 0, n);
            return o;
        }
        void clear() { len = 0; }
    }
}
