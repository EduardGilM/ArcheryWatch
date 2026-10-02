$sh = New-Object -ComObject Shell.Application
$dev = $sh.Namespace(17).Items() | Where-Object { $_.Name -eq 'Forerunner 165' }
if (-not $dev) { Write-Output 'WATCH_NOT_FOUND'; exit 1 }
$is = $dev.GetFolder.Items() | Where-Object { $_.Name -eq 'Internal Storage' }
$g = $is.GetFolder.Items() | Where-Object { $_.Name -eq 'GARMIN' }
$apps = $g.GetFolder.Items() | Where-Object { $_.Name -eq 'Apps' }
$src = $args[0]
$apps.GetFolder.CopyHere($src, 4 + 16)
Start-Sleep 4
$apps.GetFolder.Items() | ForEach-Object { $_.Name }
