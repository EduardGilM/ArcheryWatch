package com.archerywatch.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

// arranca la escucha al encender el móvil: los tiros del reloj se acumulan sin abrir la app
public class BootReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context c, Intent i) {
        try {
            c.startForegroundService(new Intent(c, LiveService.class));
        } catch (Exception e) {
            android.util.Log.d("ArcheryWatch", "boot start falló", e);
        }
    }
}
