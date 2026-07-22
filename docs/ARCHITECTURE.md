# 🏗️ Arquitetura - Projeto 5M Clínica

**Versão:** 1.0.0  
**Data:** 04/07/2026

---

## 📐 Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                      INFRAESTRUTURA                         │
│                   (Docker, Kubernetes)                      │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
    ┌────────┐           ┌────────┐           ┌────────┐
    │Frontend │           │Backend │           │   DB   │
    │ React  │           │Express │           │  PG    │
    │ Vite   │◄──────────►│Node.js │◄─────────►│SQLite  │
    └────────┘           └────────┘           └────────┘
        ▲                     ▲
        │                     │
        ├────────┬────────────┤
        │        │            │
        ▼        ▼            ▼
     Nginx   Firebase    Monitoring
     Cache   Messaging   (PM2, ELK)
```

---

## 🔄 Fluxo de Notificações Push

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUXO DE NOTIFICAÇÕES                    │
└─────────────────────────────────────────────────────────────┘

1. REGISTRO DE DISPOSITIVO
   ┌──────────────┐
   │  Frontend    │
   │  (App/Web)   │
   └──────┬───────┘
          │ Solicita permissão
          ▼
   ┌──────────────┐
   │   Browser    │
   │ (Notification)
   └──────┬───────┘
          │ Gera device token
          ▼
   ┌──────────────────────────┐
   │ Firebase Cloud Messaging │
   │ Gera Token (FCM)        │
   └──────┬───────────────────┘
          │ Token: fPP9...xyz
          ▼
   ┌──────────────┐
   │    Backend   │
   │   (Node.js)  │
   └──────┬───────┘
          │ POST /api/notificacoes/device-token
          ▼
   ┌──────────────────────────┐
   │    Banco de Dados        │
   │ device_tokens table      │
   └──────────────────────────┘

2. ENVIO DE NOTIFICAÇÃO
   ┌──────────────┐
   │   Sistema    │
   │  Evento      │
   │ (Agendar,   │
   │  Vencer)    │
   └──────┬───────┘
          │ Trigger
          ▼
   ┌──────────────────────────┐
   │  Backend API             │
   │ /api/notificacoes/*      │
   │ firebaseService.send()   │
   └──────┬───────────────────┘
          │ Message objeto
          ▼
   ┌──────────────────────────┐
   │ Firebase Admin SDK       │
   │ messaging.send()         │
   └──────┬───────────────────┘
          │ HTTPS
          ▼
   ┌──────────────────────────┐
   │ FCM Servers              │
   │ Google Cloud             │
   └──────┬───────────────────┘
          │ Entrega
          ▼
   ┌──────────────────────────┐
   │  Dispositivo Cliente     │
   │  (Browser/Mobile)        │
   └──────┬───────────────────┘
          │ onMessage listener
          ▼
   ┌──────────────────────────┐
   │ Notificação Exibida      │
   │ ao Usuário               │
   └──────────────────────────┘
```

---

## 🗂️ Estrutura de Pastas Detalhada

```
projeto_clinica_5m/
│
├── backend/                          # API Node.js
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                # Conexão banco de dados
│   │   │
│   │   ├── services/                # Lógica de negócio
│   │   │   └── firebaseService.js   ✨ NOVO - Notificações
│   │   │
│   │   ├── routes/                  # Rotas API
│   │   │   ├── auth.js              # Login/Registro
│   │   │   ├── usuarios.js          # Usuários
│   │   │   ├── agendamentos.js      # Agendamentos
│   │   │   ├── cartoes.js           # Cartões
│   │   │   ├── notificacoes.js      ✏️ ATUALIZADO
│   │   │   └── admin.js             # Admin routes
│   │   │
│   │   ├── controllers/             # Lógica controllers
│   │   │   └── cartoesController.js
│   │   │
│   │   ├── middleware/
│   │   │   └── auth.js              # JWT auth
│   │   │
│   │   └── server.js                ✏️ ATUALIZADO
│   │
│   ├── tests/                       # Testes automatizados
│   │   ├── auth.test.js             ✨ NOVO - 8 testes
│   │   ├── firebase.test.js         ✨ NOVO - 10 testes
│   │   └── agendamentos.test.js     ✨ NOVO - 6 testes
│   │
│   ├── jest.config.json             ✨ NOVO - Config Jest
│   ├── package.json                 ✏️ ATUALIZADO
│   ├── .env.example
│   └── node_modules/
│
├── frontend/                        # App React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminRoute.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── layout/
│   │   │       ├── Header.jsx
│   │   │       ├── Layout.jsx
│   │   │       └── Sidebar.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── HomePage.jsx
│   │   │   ├── AgendamentosPage.jsx
│   │   │   ├── CartoesPage.jsx
│   │   │   └── admin/
│   │   │
│   │   ├── services/                # Comunicação com backend
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── agendamentosService.js
│   │   │   └── ...
│   │   │
│   │   ├── hooks/                   # Hooks customizados
│   │   │   ├── useAuth.js
│   │   │   └── useNotifications.js  ✨ RECOMENDADO
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   │
│   │   └── App.jsx
│   │
│   ├── public/
│   │   └── firebase-messaging-sw.js ✨ RECOMENDADO
│   │
│   ├── .env                         # Config vars
│   ├── package.json
│   └── vite.config.js
│
├── database/                        # Scripts banco de dados
│   ├── backups/
│   │   └── clinica_*.sql.gz         # Backups automáticos
│   └── schema.sql
│
├── docs/                            # Documentação
│   ├── API_REFERENCE.md
│   ├── BRANDING.md
│   ├── REQUISITOS.md
│   ├── DEPLOY.md                    ✨ NOVO - 1000+ linhas
│   └── FIREBASE_SETUP.md            ✨ NOVO - 600+ linhas
│
├── IMPLEMENTATION_SUMMARY.md        ✨ NOVO - Sumário
├── QUICKSTART.md                    ✨ NOVO - Guia rápido
├── README.md
├── package.json
└── docker-compose.yml               ✨ RECOMENDADO
```

---

## 🔐 Fluxo de Autenticação

```
┌─────────────────────────────────────────────────────────────┐
│                   FLUXO DE AUTENTICAÇÃO                     │
└─────────────────────────────────────────────────────────────┘

1. LOGIN
   Frontend          Backend          Database
      │ POST /login    │
      │────────────────▶│
      │                 │ SELECT user
      │                 │─────────────▶
      │                 │◀─────────────
      │                 │ Verificar bcrypt
      │                 │ Gerar JWT
      │ Token JWT       │
      │◀────────────────│
      │                 │

2. REQUISIÇÃO AUTENTICADA
   Frontend          Backend          Database
      │ GET /data       │
      │ + Token         │
      │────────────────▶│
      │                 │ Verificar JWT
      │                 │ middleware auth
      │                 │ SELECT data
      │                 │─────────────▶
      │                 │◀─────────────
      │ Response        │
      │◀────────────────│
```

---

## 💾 Modelo de Dados (Banco)

```
┌─────────────────────────────────────────────────────────────┐
│                   SCHEMA DO BANCO                           │
└─────────────────────────────────────────────────────────────┘

usuarios
  ├── id (PK)
  ├── email (UNIQUE)
  ├── senha (bcrypt)
  ├── nome
  ├── cpf
  ├── telefone
  ├── role (USER, ADM, SUPER_ADM)
  └── created_at

cartoes
  ├── id (PK)
  ├── usuario_id (FK)
  ├── tipo (INDIVIDUAL, FAMILIAR, EMPRESARIAL)
  ├── status (ATIVO, VENCIDO, SUSPENSO)
  ├── vencimento
  └── criado_em

agendamentos
  ├── id (PK)
  ├── usuario_id (FK)
  ├── funcionario_id (FK)
  ├── data_agendamento
  ├── hora_agendamento
  ├── tipo_atendimento
  ├── status (AGENDADO, REALIZADO, CANCELADO)
  └── criado_em

notificacoes
  ├── id (PK)
  ├── usuario_id (FK)
  ├── titulo
  ├── mensagem
  ├── tipo
  ├── lida (boolean)
  └── criada_em

device_tokens  ✨ NOVO
  ├── id (PK)
  ├── usuario_id (FK)
  ├── token
  ├── plataforma (web, mobile, etc)
  ├── ativo (boolean)
  └── criado_em
```

---

## 🔌 APIs Principais

### Autenticação
```
POST   /api/auth/login              # Login
POST   /api/auth/register           # Registro
POST   /api/auth/logout             # Logout
```

### Usuários
```
GET    /api/usuarios/perfil         # Meu perfil
PUT    /api/usuarios/:id            # Atualizar
DELETE /api/usuarios/:id            # Deletar
```

### Agendamentos
```
GET    /api/agendamentos            # Listar
POST   /api/agendamentos            # Criar
GET    /api/agendamentos/:id        # Detalhes
PUT    /api/agendamentos/:id        # Atualizar
DELETE /api/agendamentos/:id        # Cancelar
```

### Notificações ✨
```
GET    /api/notificacoes            # Listar
PATCH  /api/notificacoes/:id/marcar-lida  # Marcar lida
POST   /api/notificacoes/device-token     # Registrar device
POST   /api/notificacoes/test-push        # Enviar teste
```

---

## 🧪 Stack de Testes

```
┌─────────────────────────────────────────────────────────────┐
│                   STACK DE TESTES                           │
└─────────────────────────────────────────────────────────────┘

Jest (Framework principal)
  ├── Testes unitários
  ├── Testes de integração
  └── Reporter de cobertura

Supertest (Testes HTTP)
  ├── Requisições GET, POST, PUT, DELETE
  ├── Assertions em response
  └── Autenticação JWT

Testes Implementados:
  ├── Auth Tests (8 casos)
  │   ├── Login com email inválido
  │   ├── Login com senha ausente
  │   ├── Registro novo usuário
  │   └── Validações
  │
  ├── Firebase Tests (10 casos)
  │   ├── Inicialização
  │   ├── Tipos de notificação
  │   └── Funções de envio
  │
  └── Agendamentos Tests (6 casos)
      ├── GET list
      ├── POST criar
      └── Validações de data/hora
```

---

## 📊 Fluxo de Dados - Agendamento

```
┌─────────────────────────────────────────────────────────────┐
│            FLUXO COMPLETO: CRIAR AGENDAMENTO               │
└─────────────────────────────────────────────────────────────┘

1. REQUISIÇÃO
   Cliente                Backend
   ├── Preenche form
   ├── Seleciona data/hora
   └── POST /api/agendamentos
                              │
                    Validação de dados
                    Verificar disponibilidade
                    Validar cartão cliente
                              │
                              ▼
                    Salvar em database
                              │
                              ▼
                    Criar notificação
                              │
                              ▼
                    Enviar Firebase
                              │
                              ▼
   Response 201 Created
   ├── agendamentoId
   └── confirmado

2. NOTIFICAÇÃO
   Backend (post-agendamento)
   │
   ├─ Buscar device_token do usuário
   │
   ├─ Chamar firebaseService.notifyAgendamentoConfirmado()
   │
   ├─ firebaseService.sendNotification()
   │
   └─ Google FCM Servers
      │
      └─ Entregar ao Cliente
         │
         ├─ Se browser: notification Web API
         │
         └─ Se mobile: FCM push
```

---

## 🚀 Deploy Stages

```
┌─────────────────────────────────────────────────────────────┐
│            ESTÁGIOS DE DEPLOYMENT                           │
└─────────────────────────────────────────────────────────────┘

1. LOCAL (Dev)
   sqlite          node          http
   localhost:3000  localhost:4173

2. STAGING
   postgresql       docker-compose  nginx + ssl
   staging.api      staging.app     cloudflare

3. PRODUCTION
   postgresql       docker k8s      nginx + cdn
   api.clinica.com  app.clinica.com cdn.clinica.com
```

---

## 📈 Performance e Escalabilidade

### Backend
- **Single Instance:** ~100 req/s
- **Com Load Balancer:** ~500+ req/s
- **Caching (Redis):** +2x performance
- **DB Indexes:** +10x em queries

### Frontend
- **Build Size:** ~150KB (gzipped)
- **Time to First Byte:** <500ms
- **Lighthouse Score:** 90+

### Banco de Dados
- **Conexões:** Pooling até 20
- **Queries:** Otimizadas com índices
- **Backups:** Diários automáticos

---

## 🔒 Segurança

```
┌─────────────────────────────────────────────────────────────┐
│              CAMADAS DE SEGURANÇA                           │
└─────────────────────────────────────────────────────────────┘

1. REDE
   ├── HTTPS/TLS 1.2+
   ├── CORS whitelist
   └── Rate limiting

2. APLICAÇÃO
   ├── JWT (7 dias validade)
   ├── Bcrypt (senhas)
   ├── Input validation
   └── SQL injection prevention

3. DADOS
   ├── Criptografia PII
   ├── Backup diário
   ├── Audit logs
   └── GDPR compliance (recomendado)

4. TERCEIROS
   ├── Firebase Admin SDK
   ├── Google Cloud
   └── Certificados SSL válidos
```

---

## 📞 Contato Arquitetura

- **Arquiteto:** Lucas
- **DevOps:** Caue
- **Frontend Lead:** Gustavo
- **Backend Lead:** Kaio

---

**Versão:** 1.0.0  
**Última atualização:** 04/07/2026

