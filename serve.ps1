param(
    [int]$Port = 8000
)

$python = Get-Command python -ErrorAction SilentlyContinue
$python3 = Get-Command python3 -ErrorAction SilentlyContinue
$npx = Get-Command npx -ErrorAction SilentlyContinue

if ($python) {
    Write-Host "Starting Python HTTP server on port $Port..."
    & python -m http.server $Port
}
elseif ($python3) {
    Write-Host "Starting Python3 HTTP server on port $Port..."
    & python3 -m http.server $Port
}
elseif ($npx) {
    Write-Host "Starting http-server (npx) on port $Port..."
    & npx http-server -p $Port
}
else {
    Write-Host "No Python or npx found. Opening index.html in default app."
    Start-Process (Join-Path $PSScriptRoot 'index.html')
}