# 📚 API Reference - PROJETO 5M

## Base URL
```
Development:  http://localhost:3000/api
Production:   https://api.maistrigo.com/api
```

## Authentication
Todos os endpoints (exceto /auth/login e /auth/register) requerem:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 🔐 Authentication

### POST /auth/register
Registrar novo usuário

**Request:**
```json
{
  "email": "usuario@example.com",
  "senha": "senha_segura",
  "nome": "João Silva",
  "telefone": "11999999999"
}
```

**Response (201):**
```json
{
  "id": 1,
  "email": "usuario@example.com",
  "nome": "João Silva",
  "token": "eyJhbGc..."
}
```

### POST /auth/login
Fazer login

**Request:**
```json
{
  "email": "usuario@example.com",
  "senha": "senha_segura"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGc...",
  "usuario": {
    "id": 1,
    "nome": "João Silva",
    "role": "USER"
  }
}
```

---

## 🎫 Cartões

### GET /cartoes
Listar cartões do usuário autenticado

**Response (200):**
```json
{
  "cartoes": [
    {
      "id": 1,
      "tipo_servico": "INDIVIDUAL",
      "nome_cartao": "Plano Individual",
      "data_entrada": "2026-01-15",
      "data_saida": "2027-01-15",
      "status": "ATIVO",
      "dias_para_vencer": 245
    }
  ]
}
```

### POST /cartoes
Criar novo cartão

**Request:**
```json
{
  "tipo_servico": "INDIVIDUAL",
  "nome_cartao": "Meu Cartão",
  "duracao_meses": 12
}
```

**Response (201):**
```json
{
  "id": 1,
  "tipo_servico": "INDIVIDUAL",
  "status": "ATIVO"
}
```

### GET /cartoes/:id
Detalhes do cartão

**Response (200):**
```json
{
  "id": 1,
  "usuario_id": 1,
  "tipo_servico": "INDIVIDUAL",
  "nome_cartao": "Plano Individual",
  "data_entrada": "2026-01-15",
  "data_saida": "2027-01-15",
  "status": "ATIVO",
  "notificacao_enviada": false
}
```

---

## 📅 Agendamentos

### GET /agendamentos
Listar agendamentos do usuário

**Query Parameters:**
- `status`: AGENDADO, REALIZADO, CANCELADO
- `mes`: 01-12
- `ano`: YYYY

**Response (200):**
```json
{
  "agendamentos": [
    {
      "id": 1,
      "funcionario": "Dr. Carlos",
      "tipo": "CONSULTA",
      "data": "2026-06-20",
      "horario": "14:30",
      "status": "AGENDADO"
    }
  ]
}
```

### POST /agendamentos
Criar novo agendamento

**Request:**
```json
{
  "cartao_id": 1,
  "funcionario_id": 1,
  "tipo": "CONSULTA",
  "data_agendamento": "2026-06-20",
  "horario_agendamento": "14:30",
  "descricao": "Consulta de rotina"
}
```

**Response (201):**
```json
{
  "id": 1,
  "status": "AGENDADO",
  "confirmacao": "Agendamento realizado com sucesso"
}
```

### PUT /agendamentos/:id/cancelar
Cancelar agendamento

**Response (200):**
```json
{
  "status": "CANCELADO",
  "mensagem": "Agendamento cancelado"
}
```

---

## 🏥 Funcionários

### GET /funcionarios
Listar funcionários disponíveis

**Query Parameters:**
- `especialidade`: MEDICO, ENFERMEIRO, etc

**Response (200):**
```json
{
  "funcionarios": [
    {
      "id": 1,
      "nome": "Dr. Carlos",
      "email": "carlos@maistrigo.com",
      "especialidade": "Clínica Geral",
      "ativo": true
    }
  ]
}
```

### GET /funcionarios/:id/agenda
Horários disponíveis de um funcionário

**Query Parameters:**
- `data`: YYYY-MM-DD

**Response (200):**
```json
{
  "horarios": [
    {
      "data": "2026-06-20",
      "horario": "09:00",
      "disponivel": true
    }
  ]
}
```

---

## 📧 Notificações

### GET /notificacoes
Listar notificações do usuário

**Response (200):**
```json
{
  "notificacoes": [
    {
      "id": 1,
      "titulo": "Cartão vencendo",
      "mensagem": "Seu cartão vence em 30 dias",
      "tipo": "VENCIMENTO",
      "lida": false,
      "created_at": "2026-06-12T10:30:00Z"
    }
  ]
}
```

### PUT /notificacoes/:id/marcar-como-lida
Marcar notificação como lida

**Response (200):**
```json
{
  "lida": true
}
```

---

## 👥 Usuários (ADM)

### GET /admin/usuarios
Listar todos os usuários (SUPER_ADM apenas)

**Response (200):**
```json
{
  "usuarios": [
    {
      "id": 1,
      "email": "usuario@example.com",
      "nome": "João Silva",
      "role": "USER",
      "ativo": true
    }
  ]
}
```

### POST /admin/usuarios/:id/role
Mudar role de usuário (SUPER_ADM apenas)

**Request:**
```json
{
  "role": "ADM"
}
```

---

## 🐛 Códigos de Erro

| Código | Mensagem | Solução |
|--------|----------|---------|
| 400 | Bad Request | Verificar payload |
| 401 | Unauthorized | Fazer login novamente |
| 403 | Forbidden | Sem permissão |
| 404 | Not Found | Recurso não existe |
| 409 | Conflict | Recurso duplicado |
| 500 | Server Error | Contatar suporte |

---

**Última atualização:** 12/06/2026
