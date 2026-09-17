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
            @Override public void onPageFinished(WebView v, String url) { pageReady = true; drain(); }
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

    private String exportData;
    public class Bridge {
        @android.webkit.JavascriptInterface public String diagnostics() { return LiveService.diagnostics(); }
        @android.webkit.JavascriptInterface public String command(String json) {
            try { LiveService.command(json); return ""; } catch(Exception e) { return e.getMessage(); }
        }
        @android.webkit.JavascriptInterface public void export(String json) {
            runOnUiThread(() -> { exportData=json; startActivityForResult(new Intent(Intent.ACTION_CREATE_DOCUMENT).setType("application/json").addCategory(Intent.CATEGORY_OPENABLE).putExtra(Intent.EXTRA_TITLE,"ArcheryWatch-backup.json"), 20); });
        }
        @android.webkit.JavascriptInterface public void restore() {
            runOnUiThread(() -> startActivityForResult(new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("application/json").addCategory(Intent.CATEGORY_OPENABLE), 21));
        }
    }
    @Override protected void onActivityResult(int request, int result, Intent intent) {
        super.onActivityResult(request,result,intent);
        if(result != RESULT_OK || intent == null || intent.getData() == null) return;
        try {
            if(request==20 && exportData!=null) {
                try(java.io.OutputStream stream=getContentResolver().openOutputStream(intent.getData())) { stream.write(exportData.getBytes(java.nio.charset.StandardCharsets.UTF_8)); }
                exportData=null;
            } else if(request==21) {
                try(java.io.InputStream stream=getContentResolver().openInputStream(intent.getData())) {
                    java.io.ByteArrayOutputStream bytes=new java.io.ByteArrayOutputStream(); byte[] buffer=new byte[8192]; int n;
                    while((n=stream.read(buffer))!=-1) { if(bytes.size()+n>20*1024*1024) throw new IllegalArgumentException("Copia demasiado grande"); bytes.write(buffer,0,n); }
                    push("restoreBackup("+org.json.JSONObject.quote(bytes.toString("UTF-8"))+")");
                }
            }
        } catch(Exception e) { push("notice("+org.json.JSONObject.quote("No se pudo guardar o abrir la copia")+")"); }
    }

    static String toJson(Map m) { return new org.json.JSONObject(m).toString(); }
}
