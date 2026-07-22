# Script de exportação automatizada do projeto Espaço Vida
# Uso: .\export.ps1
# Este script limpa arquivos temporários e compacta o projeto em um .zip

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  EXPORTADOR — Espaço Vida Frontend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Validar que estamos na raiz correta
if (-not (Test-Path "frontend") -or -not (Test-Path "backend")) {
    Write-Host "❌ Erro: Não encontrado as pastas 'frontend' e 'backend'." -ForegroundColor Red
    Write-Host "   Certifique-se de executar este script da raiz do projeto:" -ForegroundColor Yellow
    Write-Host "   C:\Users\cauec\Downloads\TRABALHOOOOOOOOOOOO\PROJETO5K\projeto_clinica_5m" -ForegroundColor Yellow
    exit 1
}

# Passo 1: Perguntar se deseja limpar node_modules
Write-Host "[1/3] Limpando arquivos temporários..." -ForegroundColor Green
$cleanNodeModules = $false
$response = Read-Host "Deseja remover node_modules e dist/ para reduzir tamanho? (s/n) [s]"
if ($response -eq "" -or $response -eq "s" -or $response -eq "S") {
    $cleanNodeModules = $true
}

if ($cleanNodeModules) {
    Write-Host "      Removendo frontend\node_modules..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force frontend\node_modules -ErrorAction SilentlyContinue
    
    Write-Host "      Removendo backend\node_modules..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force backend\node_modules -ErrorAction SilentlyContinue
    
    Write-Host "      Removendo frontend\dist..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force frontend\dist -ErrorAction SilentlyContinue
    
    Write-Host "      Removendo frontend\.vite..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force frontend\.vite -ErrorAction SilentlyContinue
    
    Write-Host "✓ Arquivos temporários removidos" -ForegroundColor Green
} else {
    Write-Host "⊘ Pulando limpeza (arquivo .zip será maior)" -ForegroundColor Yellow
}

Write-Host ""

# Passo 2: Gerar nome do arquivo com timestamp
Write-Host "[2/3] Preparando compressão..." -ForegroundColor Green
$timestamp = Get-Date -Format 'yyyy-MM-dd_HHmmss'
$zipName = "EspacoVida_export_${timestamp}.zip"
$zipPath = Join-Path -Path ".." -ChildPath $zipName

Write-Host "      Nome do arquivo: $zipName" -ForegroundColor Cyan
Write-Host "      Destino: $zipPath" -ForegroundColor Cyan

# Passo 3: Compactar
Write-Host "[3/3] Comprimindo projeto..." -ForegroundColor Green
Write-Host "      Incluindo: backend/, frontend/, docs/, *.md files" -ForegroundColor Cyan

try {
    Compress-Archive -Path @('backend', 'frontend', 'docs', '*.md', '.gitignore') `
      -DestinationPath $zipPath `
      -Force
    
    # Obter info do arquivo criado
    $zipFile = Get-Item $zipPath
    $sizeMB = [math]::Round($zipFile.Length / 1MB, 2)
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✅ EXPORTAÇÃO CONCLUÍDA COM SUCESSO" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Arquivo: $($zipFile.Name)" -ForegroundColor Cyan
    Write-Host "  Tamanho: $sizeMB MB" -ForegroundColor Cyan
    Write-Host "  Criado: $($zipFile.LastWriteTime)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📦 Pronto para compartilhar com o time!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos passos para quem receber o arquivo:" -ForegroundColor Yellow
    Write-Host "  1. Descompactar o .zip" -ForegroundColor Yellow
    Write-Host "  2. Executar: npm install (em frontend/ e backend/)" -ForegroundColor Yellow
    Write-Host "  3. Iniciar backend: npm run mock (em backend/)" -ForegroundColor Yellow
    Write-Host "  4. Iniciar frontend: npm run dev (em frontend/)" -ForegroundColor Yellow
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ ERRO ao compactar!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
