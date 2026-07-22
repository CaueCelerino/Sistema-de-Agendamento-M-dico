# 📋 Requisitos Consolidados - PROJETO 5M

## 🎯 Objetivo Geral
Criar um sistema integrado de agendamento de consultas/exames com controle de cartões de acesso (Individual/Familiar/Empresarial) para a clínica CLÍNICA.

---

## LADO DO CLIENTE - Requisitos Funcionais

### RF-01: Cadastro de Usuário
- [ ] Permitir cadastro com email, senha, nome e telefone
- [ ] Validar email único
- [ ] Enviar confirmação por email
- [ ] Senhas com hash bcryptjs

### RF-02: Autenticação
- [ ] Login com email/senha
- [ ] Gerar JWT token
- [ ] Refresh token automático
- [ ] Logout e limpeza de sessão

### RF-03: Visualizar Cartão
- [ ] Mostrar dados do cartão (tipo, validade)
- [ ] Exibir dias restantes para vencimento
- [ ] Mostrar dependentes (se familiar)
- [ ] Mostrar funcionários com acesso (se empresarial)

### RF-04: Renovação de Cartão
- [ ] Link para renovar antes do vencimento
- [ ] Manter histórico de cartões anteriores
- [ ] Notificação 30 dias antes do vencimento
- [ ] Notificação 7 dias antes do vencimento
- [ ] Bloqueio de acesso após vencimento

### RF-05: Agendamento de Consulta
- [ ] Selecionar funcionário
- [ ] Visualizar horários disponíveis
- [ ] Agendar consulta
- [ ] Confirmação por email/SMS

### RF-06: Agendamento de Exame
- [ ] Selecionar tipo de exame
- [ ] Visualizar disponibilidade
- [ ] Agendar exame
- [ ] Receber instruções pré-exame

### RF-07: Histórico de Agendamentos
- [ ] Listar agendamentos passados
- [ ] Listar agendamentos futuros
- [ ] Ver detalhes de cada agendamento
- [ ] Permitir cancelamento (até 24h antes)

### RF-08: Notificações
- [ ] Notificação de vencimento do cartão
- [ ] Lembrete de agendamento 24h antes
- [ ] Cancelamento/reagendamento
- [ ] Via push, email e SMS

---

## LADO DO ADM - Requisitos Funcionais

### RF-09: Cadastro de Funcionários
- [ ] Criar funcionário (nome, email, especialidade, telefone)
- [ ] Definir tipo (médico, enfermeiro, recepcionista, admin)
- [ ] Ativar/desativar funcionário
- [ ] Atribuir cartão de empresa

### RF-10: Gerenciamento de Agendas
- [ ] Definir horários de disponibilidade
- [ ] Intervalo de consulta (ex: 30 min)
- [ ] Bloquear horários (almoço, reunião, fds)
- [ ] Aprovar/rejeitar agendamentos
- [ ] Remarcar agendamentos

### RF-11: Visualização de Agendamentos
- [ ] Calendário com todos os agendamentos
- [ ] Filtrar por funcionário/data/status
- [ ] Ver detalhes do paciente
- [ ] Marcar como realizado/não compareceu

### RF-12: Controle de Cartões Vencidos
- [ ] Dashboard com cartões vencidos/próximos
- [ ] Filtro por status (ativo/vencido/renovar)
- [ ] Enviar lembrete de renovação
- [ ] Ver histórico de renovações

### RF-13: Relatórios (ADM)
- [ ] Agendamentos por período
- [ ] Taxa de comparecimento
- [ ] Funcionários mais demandados
- [ ] Receita por tipo de serviço

---

## 🔐 Requisitos de Segurança

### RNF-01: Autenticação e Autorização
- [ ] JWT tokens com expiração
- [ ] Refresh tokens seguros
- [ ] Roles: USER, ADM, SUPER_ADM
- [ ] Apenas SUPER_ADM cria novos ADMs
- [ ] Auditoria de ações críticas

### RNF-02: Proteção de Dados
- [ ] Senhas com hash bcryptjs
- [ ] HTTPS em produção
- [ ] CORS configurado
- [ ] Rate limiting em endpoints críticos
- [ ] Validação de entrada em todos endpoints

### RNF-03: Acesso ao Cartão Empresarial
- [ ] Tokens de acesso por funcionário
- [ ] Permissões granulares (agendar, visualizar, cancelar)
- [ ] Limite de funcionários por cartão
- [ ] Data de expiração do token de acesso

---

## 💾 Estrutura de Dados

### Tabela: USUARIOS
```sql
id, email, senha_hash, nome, telefone, role, ativo, created_at, updated_at
```

### Tabela: CARTOES
```sql
id, usuario_id, tipo_servico, nome_cartao, data_entrada, data_saida, 
status, notificacao_enviada, created_at, updated_at
```

### Tabela: DEPENDENTES
```sql
id, cartao_id, nome, relacao, email, telefone, data_nascimento
```

### Tabela: FUNCIONARIOS
```sql
id, nome, email, telefone, especialidade, tipo_trabalho, ativo, created_at
```

### Tabela: AGENDAMENTOS
```sql
id, usuario_id, cartao_id, funcionario_id, tipo, data_agendamento, 
horario_agendamento, status, descricao, observacoes, created_at
```

### Tabela: AGENDAS
```sql
id, funcionario_id, data_agenda, horario_inicio, horario_fim, 
intervalo_minutos, disponivel, created_at
```

### Tabela: TOKENS_ACESSO
```sql
id, cartao_id, funcionario_id, token, permissoes, data_expiracao, 
ativo, created_at
```

### Tabela: NOTIFICACOES
```sql
id, usuario_id, cartao_id, titulo, mensagem, tipo, enviada, lida, 
canal, data_envio, created_at
```

---

## 📱 Requisitos Mobile (Flutter/Capacitor)

### RNF-04: Plataformas
- [ ] Android (API 21+)
- [ ] iOS (14+)
- [ ] Responsivo (4.5" a 6.7")

### RNF-05: Performance
- [ ] Tempo de carregamento < 3s
- [ ] Banco local SQLite
- [ ] Sincronização offline
- [ ] Cache inteligente

### RNF-06: Exportação APK
- [ ] Build automatizado
- [ ] Assinatura digital
- [ ] Versioning
- [ ] Distribuição Play Store

---

## 🌐 Requisitos Frontend (React)

### RNF-07: Dashboard ADM
- [ ] Responsivo (desktop/tablet)
- [ ] Tema escuro/claro (opcional)
- [ ] Sidebar navegação
- [ ] Breadcrumb
- [ ] Gráficos/charts

### RNF-08: Performance
- [ ] Lazy loading componentes
- [ ] Code splitting
- [ ] Minificação
- [ ] Time to Interactive < 2s

---

## 🗄️ Requisitos de Banco de Dados

### RNF-09: SQLite (Desenvolvimento)
- [ ] Arquivo clinica_5m.db
- [ ] Fácil integração VSCode
- [ ] Schema versionado

### RNF-10: PostgreSQL (Produção)
- [ ] Migrations sequenciais
- [ ] Backups automáticos
- [ ] Replicação (opcional)

---

## ❓ Dúvidas Abertas - Para Cliente

### Secretária / Agendamento
- [ ] Existe secretária?
- [ ] Como organiza as consultas?
- [ ] Quem aprova agendamentos?
- [ ] Existe priorização (urgente/rotina)?

### Tipos de Serviço
**Individual**
- [ ] Somente 1 pessoa?
- [ ] Duração padrão?

**Familiar**
- [ ] Máximo de dependentes?
- [ ] Limites de consultas/mês?
- [ ] Compartilhar horários?

**Empresarial**
- [ ] Limite de funcionários?
- [ ] Limite de consultas?
- [ ] Precisa renovação centralizad?

### Funcionalidades Extras
- [ ] Prontuário eletrônico?
- [ ] Receituário digital?
- [ ] Telemedicina?
- [ ] Análise de resultado de exames?

---

## 📅 Timeline Estimado

| Fase | Atividade | Tempo |
|------|-----------|-------|
| 1 | Setup Base + DB | 3-5 dias |
| 2 | Backend Core | 2-3 semanas |
| 3 | Frontend ADM | 1-2 semanas |
| 4 | Mobile Flutter | 2-3 semanas |
| 5 | Testes + Deploy | 1 semana |

**Total: 1.5-2 meses (tempo solo)**

---

**Última atualização:** 12/06/2026  
**Status:** ✅ Requisitos consolidados, aguardando respostas para dúvidas abertas
