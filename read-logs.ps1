$ErrorActionPreference = 'Continue'
$sh = New-Object -ComObject Shell.Application
$outDir = Join-Path $env:TEMP 'aw-logs'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function Find-Item($folder, $name) {
    foreach ($i in $folder.Items()) {
        if ($i.Name -eq $name) { return $i }
    }
    return $null
}

$device = $sh.Namespace(17).Items() | Where-Object { $_.Name -match 'Forerunner|Garmin' } | Select-Object -First 1
if (-not $device) { Write-Output 'NO_DEVICE'; exit 1 }
Write-Output ("DEVICE: " + $device.Name)

$devFolder = $device.GetFolder
$storage = $null
foreach ($i in $devFolder.Items()) {
    Write-Output ("  ROOT: " + $i.Name)
    if ($i.Name -match 'Internal|Almacenamiento') { $storage = $i }
}
if (-not $storage) { $storage = $devFolder.Items() | Select-Object -First 1 }
if (-not $storage) { Write-Output 'NO_STORAGE'; exit 1 }

$garmin = Find-Item $storage.GetFolder 'GARMIN'
if (-not $garmin) { Write-Output 'NO_GARMIN'; exit 1 }

foreach ($sub in @('Apps', 'LOGS')) {
    $f = Find-Item $garmin.GetFolder $sub
    if ($f) {
        Write-Output ("GARMIN\" + $sub + ":")
        foreach ($i in $f.GetFolder.Items()) { Write-Output ("    " + $i.Name + "  " + $i.Size + "B  " + $i.ModifyDate) }
    }
}

$apps = Find-Item $garmin.GetFolder 'Apps'
$logs = $null
if ($apps) { $logs = Find-Item $apps.GetFolder 'LOGS' }
if ($logs) {
    Write-Output 'LOGFILES:'
    foreach ($i in $logs.GetFolder.Items()) {
        Write-Output ("    " + $i.Name + "  " + $i.Size + "B  " + $i.ModifyDate)
        $dest = Join-Path $outDir $i.Name
        $sh.Namespace($outDir).CopyHere($i, 0x14)
        Start-Sleep -Milliseconds 700
        if (Test-Path $dest) { Write-Output ("    COPIED -> " + $dest) }
    }
} else { Write-Output 'NO_LOGS_DIR' }

# También copiar los PRG actuales del reloj para saber qué versión corre
if ($apps) {
    foreach ($i in $apps.GetFolder.Items()) {
        if ($i.Name -match '\.PRG$|\.prg$') {
            $dest = Join-Path $outDir $i.Name
            $sh.Namespace($outDir).CopyHere($i, 0x14)
            Start-Sleep -Milliseconds 700
        }
    }
}
Write-Output 'DONE'
