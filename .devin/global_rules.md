# ArcheryWatch verification

- Run `node --test tools/tests/*.cjs` from the repository root. The mobile playback tests execute the real scripts with DOM/canvas stubs. The watch tests translate actual Monkey C method bodies with Toybox shims; they do not emulate Garmin firmware or prove field detection accuracy.
- Run `py -m unittest discover -s tools/tests -p "test_*.py"` on Windows for the Python replay prototype. That prototype is not equivalent to the current watch detector.
- `bash android/build.sh` runs mobile regression tests before packaging. It deletes and regenerates `android/build`; obtain confirmation before executing that destructive cleanup. Output: `android/build/ArcheryWatch.apk`.
- Compile the watch with the installed Connect IQ SDK's `monkeyc.bat`, device `fr165`, jungle `watchapp/monkey.jungle`, and the existing `watchapp/developer.der` signing key. Never regenerate or expose signing keys.
- Do not treat successful compilation as successful deployment or physical validation. Garmin MTP copies are imported after USB disconnect. Preserve phone sessions when updating the APK.
- Test browser sessions must use an isolated browser profile and synthetic data. Never run reset/cleanup fixtures against the user's real WebView storage.
- Phone commands currently support scalar JSON fields and arrays, not nested JSON objects. The `calibrateShot` command sends scalar `value` (peak), `profile`, and `requestId`; the watch dispatcher constructs the internal dictionary. Only the matching watch calibration event confirms that a pending adjustment was applied.
- Relative integrated position is experimental. A flat stored position trace does not prove that the wrist did not move; do not invent a trajectory or silently label orientation as physical position.
