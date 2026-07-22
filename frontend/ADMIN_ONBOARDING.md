# Onboarding Admin — Espaço Vida (Frontend)

Este documento descreve passo a passo como verificar, testar e estender as partes administrativas do frontend do projeto "Espaço Vida". Inclui também instruções de estrutura de código, execução local, testes automatizados e como exportar o projeto em um arquivo .zip para outros desenvolvedores.

**Resumo rápido**: a interface administrativa está em `src/pages/admin/` e depende do `AuthContext` e de serviços HTTP em `src/services/`.

**Estrutura principal relevante**
- **File**: [frontend/src/pages/admin/](frontend/src/pages/admin/)
  - Contém `AdminDashboard.jsx`, `ManageFuncionarios.jsx`, `ManageAgendas.jsx`, `ControlCartoes.jsx`, `AdminRelatorios.jsx`.
- **File**: [frontend/src/services/api.js](frontend/src/services/api.js#L1)
  - Axios instance central com `baseURL` apontando para `http://localhost:3000/api`.
- **File**: [frontend/src/context/AuthContext.jsx](frontend/src/context/AuthContext.jsx#L1)
  - Gerencia autenticação, token e injeta `Authorization` no `api.defaults.headers`.
- **File**: [frontend/src/components/layout/Sidebar.jsx](frontend/src/components/layout/Sidebar.jsx#L1)
  - Mostra links admin quando o papel normalizado for `ADM` ou `SUPER_ADM`.

**Pré-requisitos locais**
- Node.js (recomendado >= 18)
- npm
- Portas: backend mock: `3000`, frontend dev: `5173` (vite) ou preview `4173/4174`.

**Passos para rodar a aplicação (dev)**
- Instalar dependências (frontend e backend):

```powershell
cd frontend
npm install
cd ../backend
npm install
```

- Iniciar backend mock:

```powershell
cd backend
npm run mock
# Deve exibir: "Mock API server running on http://localhost:3000"
```

- Iniciar frontend em modo dev:

```powershell
cd frontend
npm run dev
# Acessar http://localhost:5173 (ou porta mostrada)
```

**Passos para build/preview (produção local)**

```powershell
cd frontend
npm run build
npm run preview
# Preview em http://localhost:4173 (ou 4174 se 4173 ocupado)
```

**Verificações manuais para fluxos admin**
- Login
  - Abra `/login` e autentique com um usuário admin mock (consulte `backend/src/mock_server.js`).
  - Confirme `localStorage.espacoVida_user` contém `token` e `usuario.role: 'ADM'` (ou `SUPER_ADM`).
- Sidebar
  - Usuário admin deve ver a seção `Admin` e links para as páginas admin.
- Admin Dashboard
  - Acessar `/admin` deve renderizar `AdminDashboard.jsx`.
- Gerenciar Funcionários
  - Acessar `/admin/funcionarios` deve listar funcionários; ações de criar/editar/remover devem existir (ou placeholders até implementação completa).

**Testes automatizados**
- Smoke tests (Node):
  - Arquivo: `tests/e2e_smoke.js` — script que verifica endpoints principais.
  - Executar:

```powershell
node tests/e2e_smoke.js
```

- Playwright (UI e2e):
  - Instalação (uma vez):

```powershell
cd frontend
npm install
npx playwright install chromium
```

  - Executar teste de login headless:

```powershell
node tests/playwright_login.js
```

**Como validar mudanças administrativas (checklist rápido)**
- [ ] Backend retorna JSON conforme esperado para `GET /api/admin/funcionarios`.
- [ ] `frontend/src/services/adminService.js` possui métodos `getFuncionarios`, `createFuncionario`, `updateFuncionario`, `deleteFuncionario`.
- [ ] `ManageFuncionarios.jsx` consome `adminService` e exibe lista, com tratamento de loading e erros.
- [ ] Rotas e `AdminRoute` protegem acessos não autorizados.

**Estrutura de código — explicação para novos programadores**
- `src/` — código do aplicativo React.
  - `components/` — componentes UI reaproveitáveis (Card, Button, Input, layout, Sidebar, etc.).
  - `context/` — `AuthContext.jsx`: fonte da verdade de autenticação e usuário atual.
  - `pages/` — páginas roteáveis. Admin especificamente em `pages/admin/`.
  - `services/` — camadas de acesso a API (`api.js`, `authService.js`, `userService.js`, `adminService.js`).
  - `styles/` — `global.css` com Tailwind directives e tokens de marca.

**Boas práticas ao estender**
- Colocar lógica de API em `services/` — evitar fetch direto em componentes.
- Reutilizar `Card`, `Button` e `Input` para manter consistência.
- Tratar estados `loading`, `error` e `empty` nas páginas.
- Manter rotas protegidas com `ProtectedRoute` e `AdminRoute`.

**Como adicionar endpoints no mock backend**
- Arquivo: `backend/src/mock_server.js` — edite para adicionar rotas como:

```js
app.get('/api/admin/funcionarios', (req, res) => { res.json({ funcionarios: [...] }) })
```

- Reiniciar o mock server após alterações.

**Contribuição e commit**
- Use branches por feature: `feature/admin-funcionarios`.
- Mensagens de commit curtas e descritivas: `feat(admin): add adminService with getFuncionarios`.

**Empacotamento para enviar a outros desenvolvedores (.zip)**
- Regras de empacotamento:
  - Incluir: todo o repositório exceto `node_modules` e arquivos temporários.
  - Incluir `frontend/dist` apenas se quiser compartilhar build (opcional).
  - Incluir instruções de execução (este `ADMIN_ONBOARDING.md` já fornece passos).

- Comprimir usando PowerShell (Windows):

```powershell
# A partir da raiz do repositório (projeto_clinica_5m):
Compress-Archive -Path .\* -DestinationPath ..\EspacoVida_frontend_export.zip -Exclude node_modules
# Observação: ajuste o caminho e o nome do zip conforme necessário.
```

- Alternativa (ZIP via npm devDeps `archiver` or `zip`): criar script `package.json` se preferir automatizar.

**Checklist antes de enviar o .zip**
- [ ] `node_modules` removido (não incluir).
- [ ] `npm install` instruções incluídas no README.
- [ ] `ADMIN_ONBOARDING.md` incluído na raiz do frontend (ou `docs/`).

---

Se deseja, posso agora:
- A) Implementar `src/services/adminService.js` e conectar `ManageFuncionarios.jsx` para listar funcionários.
- B) Atualizar o backend mock com endpoints admin necessários.
- C) Implementar formulários (criar/editar) e testes Playwright.

Escolha A, B ou C (ou peça uma combinação). Eu já marquei o plano de tarefas e preparei este documento.  

