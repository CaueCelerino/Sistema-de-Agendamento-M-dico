$out = "c:\projetos\projeto_clinica_5m - Copia\cloudflared.exe"
$url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
Write-Host "Downloading $url to $out"
Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing
if (Test-Path $out) {
  Write-Host "cloudflared downloaded. Version:"
  & $out --version
} else {
  Write-Error 'Falha ao baixar cloudflared.exe'
  exit 1
}