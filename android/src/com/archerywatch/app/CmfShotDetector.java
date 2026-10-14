package com.archerywatch.app;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Detecta suelta por pico de accel y estabilidad de apunte por RMS de gyro.
 * Emite mapas compatibles con liveShot(...) del path Garmin.
 */
public class CmfShotDetector {
    static final int HOLD_MS = 1500;
    static final int POST_MS = 400;
    static final int DEBOUNCE_MS = 900;
    static final int DT_MS = 50; // ventana remuestreada para mp/mq
    float thresholdG = 0.25f;

    float gx, gy, gz, ax, ay, az;
    private final ArrayList<Sample> buf = new ArrayList<>();
    private long lastShotAt;
    private long t0;

    void reset(long sessionStart) {
        buf.clear();
        lastShotAt = 0;
        t0 = sessionStart;
        gx = gy = gz = ax = ay = az = 0;
    }

    void lastGyro(long t, float x, float y, float z) {
        gx = x; gy = y; gz = z;
    }

    Map<String, Object> offer(long t, float ngx, float ngy, float ngz, float nax, float nay, float naz) {
        gx = ngx; gy = ngy; gz = ngz; ax = nax; ay = nay; az = naz;
        buf.add(new Sample(t, ngx, ngy, ngz, nax, nay, naz));
        trim(t);
        double mag = Math.hypot(nax, Math.hypot(nay, naz));
        double excess = mag - 1.0;
        if (excess < thresholdG) return null;
        if (t - lastShotAt < DEBOUNCE_MS) return null;
        // confirmar pico local en ±120 ms
        double peakExcess = excess;
        long peakT = t;
        for (Sample s : buf) {
            if (Math.abs(s.t - t) > 120) continue;
            double e = Math.hypot(s.ax, Math.hypot(s.ay, s.az)) - 1.0;
            if (e > peakExcess) { peakExcess = e; peakT = s.t; }
        }
        if (peakExcess < thresholdG) return null;
        lastShotAt = peakT;

        ArrayList<Sample> hold = new ArrayList<>();
        ArrayList<Sample> post = new ArrayList<>();
        for (Sample s : buf) {
            if (s.t >= peakT - HOLD_MS && s.t < peakT) hold.add(s);
            if (s.t > peakT && s.t <= peakT + POST_MS) post.add(s);
        }
        if (hold.size() < 3) return null;

        double sumSq = 0;
        for (Sample s : hold) sumSq += s.gx * s.gx + s.gy * s.gy + s.gz * s.gz;
        double gyroRms = Math.sqrt(sumSq / hold.size()); // deg/s
        // score: quiet ~0.3 dps -> ~95; 4 dps -> ~40
        int score = (int) Math.max(0, Math.min(100, Math.round(100 - gyroRms * 15)));

        double sumA = 0, sumA2 = 0;
        for (Sample s : hold) {
            double m = Math.hypot(s.ax, Math.hypot(s.ay, s.az)) * 1000.0; // mg
            sumA += m; sumA2 += m * m;
        }
        double mean = sumA / hold.size();
        double instab = Math.sqrt(Math.max(0, sumA2 / hold.size() - mean * mean)); // mg sd

        ArrayList<Integer> mp = resampleMag(hold, peakT - HOLD_MS, peakT, true);
        ArrayList<Integer> mq = resampleMag(post, peakT, peakT + POST_MS, false);

        Map<String, Object> ev = new HashMap<>();
        ev.put("t", (double) (peakT - t0));
        ev.put("score", (double) score);
        ev.put("peak", peakExcess * 1000.0);
        ev.put("instab", instab);
        ev.put("settle", settleMs(post, peakExcess));
        ev.put("hr", 0.0);
        ev.put("dt", (double) DT_MS);
        ev.put("mp", mp);
        ev.put("mq", mq);
        ev.put("src", "cmf");
        ev.put("gyro_rms", Math.round(gyroRms * 100.0) / 100.0);
        android.util.Log.i("ArcheryWatchCMF", String.format(Locale.US,
            "shot score=%d peak=%.0fmg instab=%.0f gyroRms=%.2f", score, peakExcess * 1000, instab, gyroRms));
        return ev;
    }

    private static double settleMs(ArrayList<Sample> post, double peakExcess) {
        if (post.isEmpty()) return -1;
        double thr = Math.max(0.05, peakExcess * 0.15);
        long tPeak = post.get(0).t;
        for (Sample s : post) {
            double e = Math.hypot(s.ax, Math.hypot(s.ay, s.az)) - 1.0;
            if (e <= thr) return (double) (s.t - tPeak);
        }
        return (double) (post.get(post.size() - 1).t - tPeak);
    }

    private ArrayList<Integer> resampleMag(ArrayList<Sample> src, long from, long to, boolean pre) {
        ArrayList<Integer> out = new ArrayList<>();
        if (src.isEmpty()) return out;
        for (long t = from + DT_MS; t <= to; t += DT_MS) {
            Sample best = null; long bestD = Long.MAX_VALUE;
            for (Sample s : src) {
                long d = Math.abs(s.t - t);
                if (d < bestD) { bestD = d; best = s; }
            }
            if (best == null) continue;
            int mg = (int) Math.round(Math.hypot(best.ax, Math.hypot(best.ay, best.az)) * 1000.0);
            out.add(mg);
        }
        return out;
    }

    private void trim(long now) {
        long keep = now - HOLD_MS - POST_MS - 500;
        while (!buf.isEmpty() && buf.get(0).t < keep) buf.remove(0);
    }

    static final class Sample {
        final long t;
        final float gx, gy, gz, ax, ay, az;
        Sample(long t, float gx, float gy, float gz, float ax, float ay, float az) {
            this.t = t; this.gx = gx; this.gy = gy; this.gz = gz; this.ax = ax; this.ay = ay; this.az = az;
        }
    }
}
