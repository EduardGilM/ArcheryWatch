#!/bin/bash
# ArcheryWatch APK: aapt2 -> javac -> d8 -> jar -> apksigner (sin Gradle)
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WROOT="$(cygpath -m "$ROOT")"
BT="$ROOT/tools/android/android-VanillaIceCream"
JAR="$ROOT/tools/android/android-34/android.jar"
CIQ="$ROOT/tools/ciq/mobile/aar/classes.jar"      # SDK ConnectIQ (com.garmin.android.connectiq)
CIQCLS="$ROOT/tools/ciq/mobile/classes"           # mismo jar extraido, para el dex
KS="$ROOT/tools/android/archery.keystore"
cd "$ROOT"
node --test tools/tests/mobile-playback.test.cjs tools/tests/session-model.test.cjs tools/tests/trace-geom.test.cjs tools/tests/backup.test.cjs tools/tests/score.test.cjs tools/tests/compare.test.cjs tools/tests/goals.test.cjs
rm -rf android/build && mkdir -p android/build/gen android/build/classes android/build/assets
cp mobile/session-model.js mobile/trace-geom.js mobile/backup.js mobile/score.js mobile/compare.js mobile/goals.js mobile/training.js mobile/studio.js mobile/index.html mobile/icon-192.png mobile/icon-512.png mobile/manifest.json mobile/sw.js android/build/assets/ && cp -r mobile/fonts android/build/assets/
"$BT/aapt2.exe" compile --dir android/res -o android/build/res.zip
"$BT/aapt2.exe" link -o android/build/base.apk -I "$JAR" --manifest android/AndroidManifest.xml \
  -A android/build/assets android/build/res.zip --java android/build/gen --auto-add-overlay
SRCS="$(find android/src -name '*.java' | tr '\n' ' ')"
javac --release 17 -g -encoding UTF-8 \
  -cp "$(cygpath -m "$JAR");$(cygpath -m "$CIQ")" -d android/build/classes \
  android/build/gen/com/archerywatch/app/R.java $SRCS
# nuestro codigo + SDK en un solo jar -> un solo classes.dex
jar -cf android/build/all.jar -C android/build/classes . -C "$CIQCLS" . -C "$ROOT/tools/ciq/mobile/kotlin-classes" .
"$BT/d8.bat" --release --lib "$JAR" --output android/build android/build/all.jar
(cd android/build && jar -uf base.apk classes.dex)
python tools/normalize-apk.py android/build/base.apk
if [ ! -f "$KS" ]; then
  keytool -genkeypair -keystore "$KS" -alias aw -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass archery123 -keypass archery123 -dname "CN=ArcheryWatch"
fi
"$BT/apksigner.bat" sign --ks "$KS" --ks-pass pass:archery123 --key-pass pass:archery123 \
  --out android/build/ArcheryWatch.apk android/build/base.apk
echo "APK_OK $(stat -c%s android/build/ArcheryWatch.apk) bytes"
