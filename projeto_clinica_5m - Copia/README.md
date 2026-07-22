# 🏥 PROJETO 5M - CLÍNICA

Sistema integrado de agendamento de consultas/exames com controle de cartões (Individual/Familiar/Empresarial).

## 📋 Estrutura do Projeto

```
projeto_clinica_5m/
├── backend/                 # API Node.js/Express
│   ├── src/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── server.js
│   └── package.json
├── frontend/               # Painel ADM (React)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.js
│   └── package.json
├── mobile/                 # App Flutter
│   ├── lib/
│   ├── android/
│   └── ios/
├── database/
│   ├── schema.sql
│   └── clinica_5m.db
├── schema.sql             # Schema do banco de dados
├── init_db.sh             # Script de inicialização
└── package.json           # Root package.json
```

## 🚀 Quickstart

### 1. Inicializar Banco de Dados

```bash
# Tornar script executável
chmod +x init_db.sh

# Executar inicialização
./init_db.sh
```

### 2. Backend

```bash
cd backend
npm install
npm run dev
```

### 3. Frontend (ADM Dashboard)

```bash
cd frontend
npm install
npm start
```

### 4. Mobile (Flutter App)

```bash
cd mobile
flutter pub get
flutter run
```

## 📊 Banco de Dados

**Tipo:** SQLite (desenvolvimento) + PostgreSQL (produção)

**Tabelas principais:**
- `usuarios` - Clientes e ADMs
- `cartoes` - Cartões de acesso (Individual/Familiar/Empresarial)
- `funcionarios` - Médicos, enfermeiras, etc
- `agendamentos` - Consultas e exames marcados
- `agendas` - Horários disponíveis
- `notificacoes` - Sistema de notificações
- `tokens_acesso` - Tokens para múltiplos funcionários

## 🔐 Roles e Permissões

- **USER** - Cliente/Paciente (agendar, visualizar cartão)
- **ADM** - Funcionário (gerenciar agendas, visualizar clientes)
- **SUPER_ADM** - Administrador total (criar ADMs, relatórios)

## 🎨 Identidade Visual

**Cores Clínica:**
- Ouro: `#D4AF37`
- Branco: `#FFFFFF`
- Marrom Escuro: `#5D4037`
- Cinza Neutro: `#757575`

**Tipografia:**
- Headlines: Poppins Bold
- Body: Inter Regular
- Buttons: Poppins SemiBold

## 📱 Funcionalidades

### Cliente
- [x] Cadastro e Login
- [x] Visualizar Cartão e Validade
- [x] Agendar Consulta/Exame
- [x] Histórico de Agendamentos
- [x] Notificações de Vencimento
- [ ] Renovar Cartão

### ADM
- [x] Cadastrar Funcionários
- [x] Gerenciar Agendas
- [x] Visualizar Agendamentos
- [x] Controle de Cartões Vencidos
- [ ] Relatórios

### Admin Total
- [x] Criar outros ADMs
- [x] Auditoria de acessos
- [ ] Relatórios avançados

## ❓ Dúvidas em Aberto

- [ ] Existe secretária? Como organiza agendamentos?
- [ ] Diferenças entre planos (quantidade de pessoas por tipo)?
- [ ] Limite de funcionários para cartão empresarial?

## 📦 Dependências

### Backend
- express
- sqlite3
- sequelize (ORM)
- jsonwebtoken
- bcryptjs

### Frontend
- react
- react-router-dom
- axios
- tailwindcss

### Mobile
- Flutter
- Firebase
- sqflite

## 🔧 Próximos Passos

1. Setup completo de backend (Express)
2. Criar API REST com autenticação JWT
3. Desenvolver painel ADM (React)
4. Implementar notificações
5. Build APK para Android

## 📞 Contato

**Desenvolvedor Principal:** Lucas  
**Equipe:** Caue, Kaio, Gustavo  
**Empresa:** Clínica  
**Status:** Em Desenvolvimento 🚧

---

## 👥 Autores

- **Lucas** (Desenvolvedor Principal)
- **Caue**
- **Kaio**
- **Gustavo**

**Última atualização:** 12/06/2026
