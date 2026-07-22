# Espaço Vida - Frontend

Instruções para executar o frontend localmente e usar o mock backend incluído no repositório.

Pré-requisitos
- Node.js 18+ e npm

Scripts úteis (executar a partir do diretório `frontend`):

- Instalar dependências

```bash
cd frontend
npm install
```

- Rodar em modo desenvolvimento (Vite)

```bash
cd frontend
npm run dev
# abre http://localhost:4173
```

- Build de produção

```bash
cd frontend
npm run build
npm run preview
```

Mock backend (para testes locais)

Este repositório contém um mock simples em `backend/src/mock_server.js` que expõe as rotas mínimas usadas pelo frontend:

- `POST /api/auth/login` — aceita `{ email, senha, perfil? }` e retorna `{ token, usuario, user }`
- `POST /api/auth/register`
- `GET /api/cartoes`
- `GET /api/agendamentos`
- `GET/PUT /api/usuarios/me`
- `GET /api/health`

Rodar o mock:

```bash
cd backend
npm install
npm run mock
# o mock escuta em http://localhost:3000
```

Smoke test programático

Um teste rápido está disponível em `tests/e2e_smoke.js` para validar as chamadas básicas contra o mock.

```bash
node tests/e2e_smoke.js
```

Testes Playwright (UI E2E)

Teste automatizado do fluxo administrativo:

```bash
# Instalar Chromium (primeira vez)
npx playwright install chromium

# Rodar teste de login
node tests/playwright_login.js

# Rodar teste admin (CRUD funcionários)
node tests/playwright_admin.js
```

Novas funcionalidades: Admin

A partir da v1.0-admin, o sistema possui:

- **Páginas administrativas** em `/admin` (requer `role: 'ADM'` ou `role: 'SUPER_ADM'`):
  - `/admin` — Dashboard admin
  - `/admin/funcionarios` — Gerenciar funcionários (CRUD completo)
  - `/admin/agendas` — Gerenciar agendas
  - `/admin/cartoes` — Controle de cartões
  - `/admin/relatorios` — Relatórios administrativos

- **APIs administrativas** no mock:
  - `GET /api/admin/funcionarios` — Listar funcionários
  - `POST /api/admin/funcionarios` — Criar funcionário
  - `PUT /api/admin/funcionarios/:id` — Editar funcionário
  - `DELETE /api/admin/funcionarios/:id` — Deletar funcionário

- **Componentes UI novo**:
  - `Modal.jsx` — Modal reutilizável com formulários
  - Formulários com validação básica em `ManageFuncionarios.jsx`

Para mais detalhes, consulte [ADMIN_ONBOARDING.md](ADMIN_ONBOARDING.md).

Fluxo recomendado para desenvolvimento

1. Em uma aba/terminal: `cd backend && npm run mock`
2. Em outra aba/terminal: `cd frontend && npm run dev`
3. Abrir `http://localhost:4173` e testar os fluxos de login/perfil/dashboard
4. Se admin: navegar para `/admin/funcionarios` e testar CRUD

Exportação para outros desenvolvedores

Para compartilhar o projeto com o time:

```powershell
# Na raiz do projeto, execute:
.\export.ps1
# Será criado um .zip com tudo necessário
```

Para instruções detalhadas, consulte [EXPORT_INSTRUCTIONS.md](EXPORT_INSTRUCTIONS.md).

Observações
- O frontend já aponta por padrão para `http://localhost:3000/api` via `frontend/src/services/api.js`.
- Quando o backend real estiver disponível, retire o mock e ajuste `api.js` se necessário.
