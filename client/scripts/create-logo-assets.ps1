param(
  [string]$Source = "scripts/assets/marseille04-logo-source.png",
  [string]$OutDir = "public/brand"
)

Add-Type -AssemblyName System.Drawing

function New-Canvas([int]$Width, [int]$Height) {
  $bitmap = New-Object System.Drawing.Bitmap($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.Clear([System.Drawing.Color]::White)
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  return @{ Bitmap = $bitmap; Graphics = $graphics }
}

function Save-FitImage($SourceBitmap, [System.Drawing.Rectangle]$Crop, [string]$Target, [int]$Width, [int]$Height, [int]$Padding) {
  $canvas = New-Canvas $Width $Height
  $availableWidth = [Math]::Max(1, $Width - ($Padding * 2))
  $availableHeight = [Math]::Max(1, $Height - ($Padding * 2))
  $scale = [Math]::Min($availableWidth / $Crop.Width, $availableHeight / $Crop.Height)
  $drawWidth = [int][Math]::Round($Crop.Width * $scale)
  $drawHeight = [int][Math]::Round($Crop.Height * $scale)
  $x = [int][Math]::Round(($Width - $drawWidth) / 2)
  $y = [int][Math]::Round(($Height - $drawHeight) / 2)
  $destination = New-Object System.Drawing.Rectangle($x, $y, $drawWidth, $drawHeight)
  $canvas.Graphics.DrawImage($SourceBitmap, $destination, $Crop, [System.Drawing.GraphicsUnit]::Pixel)
  $canvas.Bitmap.Save($Target, [System.Drawing.Imaging.ImageFormat]::Png)
  $canvas.Graphics.Dispose()
  $canvas.Bitmap.Dispose()
}

function Expand-Rectangle([System.Drawing.Rectangle]$Rect, [int]$PadX, [int]$PadY, [int]$MaxWidth, [int]$MaxHeight) {
  [int]$left = [Math]::Max(0, $Rect.Left - $PadX)
  [int]$top = [Math]::Max(0, $Rect.Top - $PadY)
  [int]$right = [Math]::Min($MaxWidth, $Rect.Right + $PadX)
  [int]$bottom = [Math]::Min($MaxHeight, $Rect.Bottom + $PadY)
  return [System.Drawing.Rectangle]::new($left, $top, [Math]::Max(1, $right - $left), [Math]::Max(1, $bottom - $top))
}

$sourcePath = Resolve-Path $Source
$outputPath = Join-Path (Get-Location) $OutDir
New-Item -ItemType Directory -Force -Path $outputPath | Out-Null

$image = [System.Drawing.Bitmap]::FromFile($sourcePath)
$minX = $image.Width
$minY = $image.Height
$maxX = 0
$maxY = 0

for ($y = 0; $y -lt $image.Height; $y++) {
  for ($x = 0; $x -lt $image.Width; $x++) {
    $pixel = $image.GetPixel($x, $y)
    $distanceFromWhite = [Math]::Abs(255 - $pixel.R) + [Math]::Abs(255 - $pixel.G) + [Math]::Abs(255 - $pixel.B)
    if ($pixel.A -gt 20 -and $distanceFromWhite -gt 42) {
      if ($x -lt $minX) { $minX = $x }
      if ($y -lt $minY) { $minY = $y }
      if ($x -gt $maxX) { $maxX = $x }
      if ($y -gt $maxY) { $maxY = $y }
    }
  }
}

if ($maxX -le $minX -or $maxY -le $minY) {
  throw "Could not detect logo content in $Source"
}

$content = [System.Drawing.Rectangle]::new($minX, $minY, ($maxX - $minX + 1), ($maxY - $minY + 1))
$fullLogoCrop = Expand-Rectangle $content ([int]($content.Width * 0.035)) ([int]($content.Height * 0.18)) $image.Width $image.Height

$markSize = [Math]::Min($fullLogoCrop.Height, $image.Width - $fullLogoCrop.Left)
$markCrop = [System.Drawing.Rectangle]::new($fullLogoCrop.Left, $fullLogoCrop.Top, $markSize, $fullLogoCrop.Height)

Save-FitImage $image $fullLogoCrop (Join-Path $outputPath "marseille04-logo-header.png") 384 96 10
Save-FitImage $image $fullLogoCrop (Join-Path $outputPath "marseille04-logo-footer.png") 640 160 18
Save-FitImage $image $fullLogoCrop (Join-Path $outputPath "marseille04-logo-og.png") 1200 630 72
Save-FitImage $image $markCrop (Join-Path $outputPath "marseille04-mark-192.png") 192 192 18
Save-FitImage $image $markCrop (Join-Path $outputPath "marseille04-mark-512.png") 512 512 48
Save-FitImage $image $markCrop (Join-Path (Split-Path $outputPath -Parent) "favicon.png") 64 64 6

$image.Dispose()

Get-ChildItem $outputPath, (Join-Path (Split-Path $outputPath -Parent) "favicon.png") |
  Select-Object Name, Length, FullName
