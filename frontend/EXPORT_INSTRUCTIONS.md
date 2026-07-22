# Instruções de Exportação — Espaço Vida Frontend

Este documento descreve como exportar o projeto completo em um arquivo `.zip` para compartilhar com outros membros do time de desenvolvimento.

## Pré-requisitos

- PowerShell 5.0+ (Windows) ou terminal equivalente (Linux/macOS)
- `7-Zip` (recomendado para melhor compressão) ou `WinRAR` / `Compressão nativa do Windows`

## Opção 1: Compressão via PowerShell (Windows) — RECOMENDADO

A forma mais prática e confiável é usar o cmdlet `Compress-Archive` do PowerShell.

### Passos

1. **Abra o PowerShell como Administrador** (ou usuário comum)

2. **Navegue até a pasta raiz do projeto**:
   ```powershell
   cd "C:\Users\cauec\Downloads\TRABALHOOOOOOOOOOOO\PROJETO5K\projeto_clinica_5m"
   ```

3. **Execute o comando de compressão**:

   ```powershell
   Compress-Archive -Path @('backend', 'frontend', 'docs', '*.md', '.gitignore') `
     -DestinationPath "..\EspacoVida_frontend_export_$(Get-Date -Format 'yyyy-MM-dd_HHmmss').zip" `
     -Force
   ```

   **Explicação**:
   - `-Path @(...)`: Lista de pastas e arquivos a incluir
   - `-DestinationPath`: Localização do `.zip` (usa timestamp para evitar sobrescrita)
   - `-Force`: Sobrescreve se o arquivo já existir

4. **Verifique se o arquivo foi criado**:
   ```powershell
   Get-ChildItem "..\EspacoVida_frontend_*.zip" | Select Name, Length, LastWriteTime
   ```

### Arquivos inclusos
- `backend/` — Código do mock API server
- `frontend/` — Código React + Vite (excluindo `node_modules` e `dist`)
- `docs/` — Documentação
- `*.md` — Todos os arquivos markdown (README, ADMIN_ONBOARDING, etc.)
- `.gitignore` — Arquivo de exclusões Git

### Arquivos exclusos (inteligentemente)
- `node_modules/` — Será instalado via `npm install`
- `dist/` e `.vite/` — Build artifacts (podem ser regenerados)
- `.git/` — Histórico Git (compartilhar via repositório é melhor)

---

## Opção 2: Compressão com Exclusões Explícitas (Mais Controle)

Se você preferir excluir certos arquivos explicitamente:

```powershell
# Criar lista de arquivos/pastas a excluir
$exclude = @('node_modules', 'dist', '.git', '.vite', '*.log', '.env')

# Compactar tudo exceto os da lista
Compress-Archive `
  -Path "C:\Users\cauec\Downloads\TRABALHOOOOOOOOOOOO\PROJETO5K\projeto_clinica_5m\*" `
  -DestinationPath "..\EspacoVida_export_full.zip" `
  -Force

# Depois remover os indesejados manualmente ou usar 7-Zip para mais controle
```

---

## Opção 3: Usar 7-Zip (CLI) para Máxima Compressão

Se 7-Zip está instalado:

```powershell
# Exemplo (instale via: choco install 7zip ou download manual)
& 'C:\Program Files\7-Zip\7z.exe' a -r -xr!node_modules -xr!dist `
  "..\EspacoVida_export_7z.zip" `
  "C:\Users\cauec\Downloads\TRABALHOOOOOOOOOOOO\PROJETO5K\projeto_clinica_5m\*"
```

---

## Opção 4: GitHub Releases (Para Controle de Versão)

Se o projeto estiver em um repositório Git:

```bash
# Tag a versão
git tag -a v1.0-admin-features -m "Admin pages with CRUD funcionarios"

# Push tag
git push origin v1.0-admin-features

# GitHub cria automaticamente release com opção de download
# (alternativa: criar release manualmente na interface web)
```

---

## Checklist Antes de Exportar

- [ ] **node_modules limpo**: Remova antes de zippar
  ```powershell
  Remove-Item -Recurse -Force frontend\node_modules, backend\node_modules -ErrorAction SilentlyContinue
  ```

- [ ] **Arquivos temporários removidos**:
  ```powershell
  Remove-Item -Recurse -Force frontend\dist, frontend\.vite, backend\dist -ErrorAction SilentlyContinue
  ```

- [ ] **Arquivo .env não incluído** (se existir com credenciais):
  ```powershell
  Remove-Item .env -ErrorAction SilentlyContinue
  ```

- [ ] **Documentação atualizada**: Confirme que `ADMIN_ONBOARDING.md` está presente

- [ ] **README.md com instruções**: Verifique se contém passos de setup

---

## Instruções para o Receptor (Como Descompactar e Rodar)

Após receber o `.zip`, o novo desenvolvedor deve:

1. **Descompactar** o arquivo em uma pasta desejada
2. **Instalar dependências**:
   ```powershell
   cd frontend
   npm install
   cd ../backend
   npm install
   ```
3. **Iniciar backend mock**:
   ```powershell
   cd backend
   npm run mock
   # Deve exibir: "Mock API server running on http://localhost:3000"
   ```
4. **Iniciar frontend em dev** (em outro terminal):
   ```powershell
   cd frontend
   npm run dev
   # Acesse http://localhost:4173 (ou porta indicada)
   ```

---

## Tamanho Esperado do .zip

- **Com node_modules e dist**: ~500 MB (não recomendado)
- **Sem node_modules e dist** (recomendado): **~10-20 MB**

---

## Script Automatizado (Opcional)

Crie um arquivo `export.ps1` na raiz do projeto e execute quando precisar exportar:

```powershell
# Salvar como: projeto_clinica_5m\export.ps1

# Limpar temporários
Write-Host "Limpando arquivos temporários..."
Remove-Item -Recurse -Force frontend\node_modules, backend\node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force frontend\dist, frontend\.vite, backend\dist -ErrorAction SilentlyContinue

# Compactar
Write-Host "Comprimindo projeto..."
$zipName = "EspacoVida_export_$(Get-Date -Format 'yyyy-MM-dd_HHmmss').zip"
Compress-Archive -Path @('backend', 'frontend', 'docs', '*.md') `
  -DestinationPath "..\$zipName" `
  -Force

Write-Host "✓ Exportado: ..\$zipName"
Get-Item "..\$zipName" | Select Name, @{N="Size(MB)";E={[math]::Round($_.Length/1MB, 2)}}
```

**Para usar**:
```powershell
cd C:\Users\cauec\Downloads\TRABALHOOOOOOOOOOOO\PROJETO5K\projeto_clinica_5m
.\export.ps1
```

---

## Exemplo de Estrutura Esperada no .zip

```
EspacoVida_frontend_export_2026-06-15_203000.zip
├── backend/
│   ├── src/
│   │   └── mock_server.js
│   ├── package.json
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── ...
│   ├── package.json
│   ├── vite.config.js
│   └── ...
├── docs/
│   └── API_REFERENCE.md
├── README.md
├── ADMIN_ONBOARDING.md
└── .gitignore
```

---

## Dúvidas Frequentes

**P: Posso incluir `.env`?**  
R: Não. Se houver credenciais, crie um `.env.example` sem valores reais.

**P: O receptor precisa de Git?**  
R: Não. O `.zip` é autossuficiente. Git é opcional para controle de versão posterior.

**P: Como atualizar após mudanças?**  
R: Re-execute o script `export.ps1` ou o comando de compressão. O novo `.zip` sobrescreverá o anterior.

---

Para mais informações, consulte [ADMIN_ONBOARDING.md](ADMIN_ONBOARDING.md).
