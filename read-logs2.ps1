$ErrorActionPreference = 'Continue'
$sh = New-Object -ComObject Shell.Application
$outDir = Join-Path $env:TEMP 'aw-logs2'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$device = $sh.Namespace(17).Items() | Where-Object { $_.Name -match 'Forerunner|Garmin' } | Select-Object -First 1
if (-not $device) { Write-Output 'NO_DEVICE'; exit 1 }

$storage = $device.GetFolder.Items() | Where-Object { $_.Name -match 'Internal|Almacenamiento' } | Select-Object -First 1
if (-not $storage) { $storage = $device.GetFolder.Items() | Select-Object -First 1 }

function Walk($folderItem, $prefix, $depth) {
    if ($depth -gt 4) { return }
    foreach ($i in $folderItem.GetFolder.Items()) {
        $isFolder = $i.IsFolder
        Write-Output ("{0}{1}  [{2}]  {3}B  {4}" -f $prefix, $i.Name, $(if($isFolder){'DIR'}else{'FILE'}), $i.Size, $i.ModifyDate)
        if ($i.Name -match 'CIQ|LOG|AWW|AARCH|PRG|\.YML|\.TXT') {
            $dest = Join-Path $outDir (($prefix -replace '[\\/:\s]','_') + $i.Name)
            try {
                $sh.Namespace($outDir).CopyHere($i, 0x14)
                Start-Sleep -Milliseconds 600
            } catch { Write-Output ("    COPYFAIL " + $_.Exception.Message) }
        }
        if ($isFolder -and $i.Name -notmatch '^System|^\.') {
            Walk $i ($prefix + $i.Name + '\') ($depth + 1)
        }
    }
}
Walk $storage '' 0
Write-Output 'DONE'
Get-ChildItem $outDir | ForEach-Object { Write-Output ("COPIED: " + $_.Name + " " + $_.Length + "B") }
