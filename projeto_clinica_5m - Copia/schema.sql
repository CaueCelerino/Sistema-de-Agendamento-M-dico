-- ============================================
-- PROJETO 5M - CLINICA CLÍNICA
-- Schema SQLite + PostgreSQL
-- ============================================

-- TABELA: USUARIOS (Clientes e ADMs)
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    nome TEXT NOT NULL,
    telefone TEXT,
    role TEXT DEFAULT 'USER' CHECK(role IN ('USER', 'ADM', 'SUPER_ADM')),
    ativo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- TABELA: CARTOES (Cartões de acesso Individual/Familiar/Empresarial)
CREATE TABLE IF NOT EXISTS cartoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    tipo_servico TEXT NOT NULL CHECK(tipo_servico IN ('INDIVIDUAL', 'FAMILIAR', 'EMPRESARIAL')),
    nome_cartao TEXT NOT NULL,
    data_entrada DATE NOT NULL,
    data_saida DATE NOT NULL,
    status TEXT DEFAULT 'ATIVO' CHECK(status IN ('ATIVO', 'VENCIDO', 'CANCELADO')),
    notificacao_enviada BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
);

-- TABELA: DEPENDENTES (Para cartão FAMILIAR)
CREATE TABLE IF NOT EXISTS dependentes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cartao_id INTEGER NOT NULL,
    nome TEXT NOT NULL,
    relacao TEXT NOT NULL CHECK(relacao IN ('CONJUGE', 'FILHO', 'PAI', 'MAE', 'IRMAAO', 'OUTRO')),
    email TEXT,
    telefone TEXT,
    data_nascimento DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(cartao_id) REFERENCES cartoes(id)
);

-- TABELA: EMPRESAS (Para cartão EMPRESARIAL)
CREATE TABLE IF NOT EXISTS empresas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cnpj TEXT UNIQUE,
    email TEXT,
    telefone TEXT,
    endereco TEXT,
    limit_funcionarios INTEGER DEFAULT 10,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- TABELA: CARTOES_EMPRESARIAIS (Relacionamento)
CREATE TABLE IF NOT EXISTS cartoes_empresariais (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cartao_id INTEGER NOT NULL,
    empresa_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(cartao_id) REFERENCES cartoes(id),
    FOREIGN KEY(empresa_id) REFERENCES empresas(id)
);

-- TABELA: FUNCIONARIOS (Médicos, enfermeiras, recepcionistas)
CREATE TABLE IF NOT EXISTS funcionarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telefone TEXT,
    especialidade TEXT,
    tipo_trabalho TEXT CHECK(tipo_trabalho IN ('MEDICO', 'ENFERMEIRO', 'RECEPCIONISTA', 'ADMIN')),
    ativo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- TABELA: AGENDAS (Horários disponíveis dos funcionários)
CREATE TABLE IF NOT EXISTS agendas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    funcionario_id INTEGER NOT NULL,
    data_agenda DATE NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL,
    intervalo_minutos INTEGER DEFAULT 30,
    disponivel BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(funcionario_id) REFERENCES funcionarios(id),
    UNIQUE(funcionario_id, data_agenda, horario_inicio)
);

-- TABELA: AGENDAMENTOS (Consultas e Exames marcados)
CREATE TABLE IF NOT EXISTS agendamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    cartao_id INTEGER NOT NULL,
    funcionario_id INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('CONSULTA', 'EXAME')),
    data_agendamento DATE NOT NULL,
    horario_agendamento TIME NOT NULL,
    descricao TEXT,
    status TEXT DEFAULT 'AGENDADO' CHECK(status IN ('PENDENTE', 'AGENDADO', 'REALIZADO', 'CANCELADO', 'NAO_COMPARECEU')),
    observacoes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY(cartao_id) REFERENCES cartoes(id),
    FOREIGN KEY(funcionario_id) REFERENCES funcionarios(id)
);

-- TABELA: TOKENS_ACESSO (Tokens para múltiplos funcionários acessarem cartão empresarial)
CREATE TABLE IF NOT EXISTS tokens_acesso (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cartao_id INTEGER NOT NULL,
    funcionario_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    permissoes TEXT DEFAULT 'AGENDAR,VER_AGENDA',
    data_expiracao DATE,
    ativo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(cartao_id) REFERENCES cartoes(id),
    FOREIGN KEY(funcionario_id) REFERENCES funcionarios(id)
);

-- TABELA: NOTIFICACOES (Notificações push/email)
CREATE TABLE IF NOT EXISTS notificacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    cartao_id INTEGER,
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    tipo TEXT CHECK(tipo IN ('VENCIMENTO', 'AGENDAMENTO', 'LEMBRETE', 'ALERTA')),
    enviada BOOLEAN DEFAULT 0,
    lida BOOLEAN DEFAULT 0,
    canal TEXT DEFAULT 'PUSH' CHECK(canal IN ('PUSH', 'EMAIL', 'SMS', 'APP')),
    data_envio DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY(cartao_id) REFERENCES cartoes(id)
);

-- TABELA: LOGS_ACESSO (Auditoria de acessos)
CREATE TABLE IF NOT EXISTS logs_acesso (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    acao TEXT NOT NULL,
    descricao TEXT,
    ip_address TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
);

-- INDEXES para otimizar queries
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(role);
CREATE INDEX IF NOT EXISTS idx_cartoes_usuario ON cartoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_cartoes_status ON cartoes(status);
CREATE INDEX IF NOT EXISTS idx_cartoes_data_saida ON cartoes(data_saida);
CREATE INDEX IF NOT EXISTS idx_agendamentos_usuario ON agendamentos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_funcionario ON agendamentos(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data_agendamento);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status);
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs_acesso(timestamp);
