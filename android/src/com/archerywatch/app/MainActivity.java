package com.archerywatch.app;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.util.Map;

public class MainActivity extends Activity {
    private WebView wv;
    private boolean started;
    private boolean pageReady;  // el drain antes de que cargue la página pierde los eventos
    private boolean draining;

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        wv = new WebView(this);
        setContentView(wv);
        WebSettings s = wv.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);  // sin esto localStorage es null y el historial/live revientan
        wv.setWebChromeClient(new android.webkit.WebChromeClient() {
            @Override public boolean onJsConfirm(WebView view, String url, String message, android.webkit.JsResult result) {
                new android.app.AlertDialog.Builder(MainActivity.this).setMessage(message)
                    .setNegativeButton("Cancelar", (dialog, which) -> result.cancel())
                    .setPositiveButton("Confirmar", (dialog, which) -> result.confirm())
                    .setOnCancelListener(dialog -> result.cancel()).show();
                return true;
            }
        });
        // Solo recursos empaquetados en la aplicación.
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setAllowFileAccessFromFileURLs(false);
        s.setAllowUniversalAccessFromFileURLs(false);
        s.setBlockNetworkLoads(true);
        WebView.setWebContentsDebuggingEnabled((getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0);
        wv.setWebViewClient(new WebViewClient() {
            @Override public void onPageFinished(WebView v, String url) { pageReady = true; deliverExportError(); drain(); }
            @Override public boolean shouldOverrideUrlLoading(WebView v, android.webkit.WebResourceRequest request) { return true; }
        });
        wv.addJavascriptInterface(new Bridge(), "Native");
        wv.loadUrl("file:///android_asset/index.html");
    }

    // drenar estado y tiros recibidos mientras la UI no estaba lista/visible
    void drain() {
        runOnUiThread(() -> {
            if (!pageReady || draining || LiveService.ui != this || LiveService.inbox == null) return;
            EventQueue.Entry e = LiveService.inbox.peek();
            if (e == null) return;
            draining = true;
            wv.evaluateJavascript("receiveNative(" + e.id + ",()=>{" + e.js + "})", result -> {
                draining = false;
                if ("true".equals(result)) {
                    try { LiveService.inbox.ack(e.id); drain(); }
                    catch (IllegalStateException error) { LiveService.status(error.getMessage()); }
                }
            });
        });
    }

    @Override protected void onResume() {
        super.onResume();
        LiveService.ui = this;
        if (pageReady) drain();  // sin página cargada, el drain se pierde: espera a onPageFinished
        if (pageReady) push("liveStatus(" + org.json.JSONObject.quote(LiveService.STATUS) + ")");
        // el FGS connectedDevice exige BLUETOOTH_CONNECT concedido
        if (!started && (android.os.Build.VERSION.SDK_INT < 31 || checkSelfPermission("android.permission.BLUETOOTH_CONNECT")
                == android.content.pm.PackageManager.PERMISSION_GRANTED)) {
            started = true;
            startForegroundService(new Intent(this, LiveService.class));
        } else if (!started) {
            requestPermissions(android.os.Build.VERSION.SDK_INT >= 33 ? new String[]{"android.permission.BLUETOOTH_CONNECT",
                "android.permission.POST_NOTIFICATIONS"} : new String[]{"android.permission.BLUETOOTH_CONNECT"}, 1);
        }
    }
    @Override public void onRequestPermissionsResult(int code, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(code, permissions, results);
        if (code == 1 && results.length > 0 && results[0] == android.content.pm.PackageManager.PERMISSION_GRANTED) {
            started = true; startForegroundService(new Intent(this, LiveService.class));
        }
    }

    @Override protected void onPause() {
        LiveService.ui = null;
        super.onPause();
    }

    void push(final String js) {
        runOnUiThread(new Runnable() { @Override public void run() {
            if (pageReady) wv.evaluateJavascript(js, null);
        } });
    }

    private final Object exportLock = new Object();
    private String exportError;
    private java.io.File exportFile() { return new java.io.File(getFilesDir(), "export-pending.json"); }
    // El selector de documentos puede recrear la actividad: el JSON no cabe en el estado guardado.
    private void discardExport() {
        java.io.File file = exportFile();
        if (file.exists() && !file.delete()) file.deleteOnExit();
    }
    private void noticeExport(String message) { runOnUiThread(() -> { exportError = message; deliverExportError(); }); }
    // Si el selector recrea la actividad, la página aún no está lista y el aviso se perdería.
    private void deliverExportError() {
        if (!pageReady || exportError == null) return;
        String message = exportError;
        exportError = null;
        push("notice(" + org.json.JSONObject.quote(message) + ")");
    }
    public class Bridge {
        @android.webkit.JavascriptInterface public String diagnostics() { return LiveService.diagnostics(); }
        @android.webkit.JavascriptInterface public String command(String json) {
            try { LiveService.command(json); return ""; } catch(Exception e) { return e.getMessage(); }
        }
        @android.webkit.JavascriptInterface public void export(String json) {
            if (json == null) { noticeExport("No se pudo preparar la copia"); return; }
            synchronized (exportLock) {
                try (java.io.Writer writer = new java.io.OutputStreamWriter(new java.io.FileOutputStream(exportFile()), java.nio.charset.StandardCharsets.UTF_8)) {
                    final int step = 16384;
                    for (int i = 0; i < json.length(); i += step) writer.write(json, i, Math.min(step, json.length() - i));
                } catch (Exception e) {
                    discardExport();
                    noticeExport("No se pudo preparar la copia");
                    return;
                }
            }
            runOnUiThread(() -> {
                try {
                    if (isFinishing()) { synchronized (exportLock) { discardExport(); } return; }
                    startActivityForResult(new Intent(Intent.ACTION_CREATE_DOCUMENT).setType("application/json").addCategory(Intent.CATEGORY_OPENABLE).putExtra(Intent.EXTRA_TITLE, "ArcheryWatch-backup.json"), 20);
                } catch (Exception e) {
                    synchronized (exportLock) { discardExport(); }
                    noticeExport("No se pudo abrir el selector de archivos");
                }
            });
        }
        @android.webkit.JavascriptInterface public void restore() {
            runOnUiThread(() -> startActivityForResult(new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("application/json").addCategory(Intent.CATEGORY_OPENABLE), 21));
        }
        @android.webkit.JavascriptInterface public void sharePng(String data) {
            try {
                String raw = data == null ? "" : data;
                int comma = raw.indexOf(',');
                if (raw.startsWith("data:") && comma >= 0) raw = raw.substring(comma + 1);
                byte[] bytes = android.util.Base64.decode(raw, android.util.Base64.DEFAULT);
                boolean jpeg = bytes.length > 2 && (bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8;
                final String type = jpeg ? "image/jpeg" : "image/png";
                final String name = jpeg ? "archerywatch.jpg" : "archerywatch.png";
                try (java.io.FileOutputStream out = new java.io.FileOutputStream(new java.io.File(getCacheDir(), "share.png"))) { out.write(bytes); }
                runOnUiThread(() -> {
                    try {
                        android.net.Uri uri = android.net.Uri.parse("content://com.archerywatch.app.share/share.png");
                        Intent send = new Intent(Intent.ACTION_SEND);
                        send.setType(type);
                        send.putExtra(Intent.EXTRA_STREAM, uri);
                        send.putExtra(Intent.EXTRA_TITLE, name);
                        send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        send.setClipData(android.content.ClipData.newRawUri("ArcheryWatch", uri));
                        startActivity(Intent.createChooser(send, "Compartir"));
                    } catch (Exception e) {
                        push("notice(" + org.json.JSONObject.quote("No se pudo compartir") + ")");
                    }
                });
            } catch (Exception e) {
                runOnUiThread(() -> push("notice(" + org.json.JSONObject.quote("No se pudo compartir") + ")"));
            }
        }
    }
    private void finishExport(int result, Intent intent) {
        synchronized (exportLock) {
            if (result != RESULT_OK || intent == null || intent.getData() == null) { discardExport(); return; }
            java.io.File file = exportFile();
            android.net.Uri uri = intent.getData();
            if (!file.isFile()) { noticeExport("No se pudo guardar la copia"); return; }
            try {
                java.io.OutputStream opened = getContentResolver().openOutputStream(uri);
                if (opened == null) throw new java.io.IOException("sin destino");
                try (java.io.InputStream in = new java.io.FileInputStream(file); java.io.OutputStream out = opened) {
                    byte[] buffer = new byte[8192]; int n;
                    while ((n = in.read(buffer)) != -1) out.write(buffer, 0, n);
                }
                discardExport();
            } catch (Exception e) {
                discardExport();
                try { android.provider.DocumentsContract.deleteDocument(getContentResolver(), uri); } catch (Exception ignored) {}
                noticeExport("No se pudo guardar la copia");
            }
        }
    }
    @Override protected void onActivityResult(int request, int result, Intent intent) {
        super.onActivityResult(request,result,intent);
        if (request == 20) { finishExport(result, intent); return; }
        if (request != 21 || result != RESULT_OK || intent == null || intent.getData() == null) return;
        try (java.io.InputStream stream = getContentResolver().openInputStream(intent.getData())) {
            if (stream == null) throw new java.io.IOException("sin origen");
            java.io.ByteArrayOutputStream bytes=new java.io.ByteArrayOutputStream(); byte[] buffer=new byte[8192]; int n;
            while((n=stream.read(buffer))!=-1) { if(bytes.size()+n>20*1024*1024) throw new IllegalArgumentException("Copia demasiado grande"); bytes.write(buffer,0,n); }
            push("restoreBackup("+org.json.JSONObject.quote(bytes.toString("UTF-8"))+")");
        } catch(Exception e) { push("notice("+org.json.JSONObject.quote("No se pudo guardar o abrir la copia")+")"); }
    }

    static String toJson(Map m) { return new org.json.JSONObject(m).toString(); }
}
