# Import new Fizz catalog batches dropped in output\fizz\inbox.
# This reads JSON you already collected. It does not open Fizz.
$ErrorActionPreference = "Stop"

$bs = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$fizz = Join-Path $bs "output\fizz"
$inbox = Join-Path $fizz "inbox"
$imported = Join-Path $inbox "imported"
$importer = Join-Path $fizz "catalog_batch.py"
$log = Join-Path $inbox "import.log"

New-Item -ItemType Directory -Force -Path $imported | Out-Null

$files = @(Get-ChildItem -Path $inbox -Filter *.json -File -ErrorAction SilentlyContinue)
if ($files.Count -eq 0) {
  exit 0
}

foreach ($file in $files) {
  $stamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssK"
  & python $importer $file.FullName
  if ($LASTEXITCODE -ne 0) {
    Add-Content -Path $log -Value "$stamp FAIL $($file.Name)"
    exit $LASTEXITCODE
  }
  $dest = Join-Path $imported ("{0}-{1}" -f (Get-Date -Format "yyyyMMddTHHmmss"), $file.Name)
  Move-Item -LiteralPath $file.FullName -Destination $dest
  Add-Content -Path $log -Value "$stamp OK $($file.Name)"
}
