$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

function New-SquarePng {
  param(
    [Parameter(Mandatory = $true)][string]$Source,
    [Parameter(Mandatory = $true)][string]$Destination,
    [Parameter(Mandatory = $true)][int]$Size
  )

  $img = [System.Drawing.Image]::FromFile($Source)
  try {
    $bmp = New-Object System.Drawing.Bitmap $Size, $Size
    try {
      $g = [System.Drawing.Graphics]::FromImage($bmp)
      try {
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.Clear([System.Drawing.Color]::Transparent)

        $scale = [Math]::Min($Size / $img.Width, $Size / $img.Height)
        $w = [Math]::Round($img.Width * $scale)
        $h = [Math]::Round($img.Height * $scale)
        $x = [Math]::Round(($Size - $w) / 2)
        $y = [Math]::Round(($Size - $h) / 2)

        $g.DrawImage($img, $x, $y, $w, $h)
        $bmp.Save($Destination, [System.Drawing.Imaging.ImageFormat]::Png)
      } finally {
        $g.Dispose()
      }
    } finally {
      $bmp.Dispose()
    }
  } finally {
    $img.Dispose()
  }
}

$src = Join-Path $PSScriptRoot "assets\LOGO PKM MB.png"
if (!(Test-Path $src)) {
  throw "Logo source not found: $src"
}

New-SquarePng -Source $src -Destination (Join-Path $PSScriptRoot "favicon-96x96.png") -Size 96
New-SquarePng -Source $src -Destination (Join-Path $PSScriptRoot "apple-touch-icon.png") -Size 180
New-SquarePng -Source $src -Destination (Join-Path $PSScriptRoot "pwa-192x192.png") -Size 192
New-SquarePng -Source $src -Destination (Join-Path $PSScriptRoot "web-app-manifest-512x512.png") -Size 512

Write-Output "OK: icons regenerated"
