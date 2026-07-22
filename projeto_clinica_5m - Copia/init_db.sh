#!/bin/bash

# Script para inicializar banco de dados SQLite
# PROJETO 5M - CLÍNICA CLÍNICA

DB_FILE="clinica_5m.db"
SCHEMA_FILE="schema.sql"

echo "🚀 Inicializando banco de dados SQLite..."
echo "Database: $DB_FILE"

# Verificar se arquivo de schema existe
if [ ! -f "$SCHEMA_FILE" ]; then
    echo "❌ Erro: Arquivo $SCHEMA_FILE não encontrado!"
    exit 1
fi

# Criar/atualizar banco de dados
sqlite3 "$DB_FILE" < "$SCHEMA_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Banco de dados criado com sucesso!"
    echo "📊 Verificando tabelas..."
    sqlite3 "$DB_FILE" ".tables"
    echo ""
    echo "📈 Estatísticas:"
    sqlite3 "$DB_FILE" "SELECT name FROM sqlite_master WHERE type='table';" | wc -l
    echo "tabelas criadas"
else
    echo "❌ Erro ao criar banco de dados!"
    exit 1
fi

# Dados iniciais de teste
echo ""
echo "📝 Inserindo dados de teste..."

sqlite3 "$DB_FILE" << EOF
-- Usuario de teste (ADM)
INSERT INTO usuarios (email, senha, nome, telefone, role) 
VALUES ('admin@maistrigo.com', 'senha_hash_aqui', 'Administrador', '11999999999', 'SUPER_ADM');

-- Usuario de teste (Cliente)
INSERT INTO usuarios (email, senha, nome, telefone, role) 
VALUES ('cliente@test.com', 'senha_hash_aqui', 'João Silva', '11988888888', 'USER');

-- Funcionário de teste
INSERT INTO funcionarios (nome, email, telefone, especialidade, tipo_trabalho)
VALUES ('Dr. Carlos', 'carlos@maistrigo.com', '11987654321', 'Clínica Geral', 'MEDICO');

-- Cartão de teste (Individual)
INSERT INTO cartoes (usuario_id, tipo_servico, nome_cartao, data_entrada, data_saida, status)
VALUES (2, 'INDIVIDUAL', 'Plano Individual', DATE('now'), DATE('now', '+1 year'), 'ATIVO');

-- Agenda de teste
INSERT INTO agendas (funcionario_id, data_agenda, horario_inicio, horario_fim)
VALUES (1, DATE('now', '+1 day'), '09:00', '17:00');

EOF

if [ $? -eq 0 ]; then
    echo "✅ Dados de teste inseridos!"
else
    echo "⚠️  Erro ao inserir dados de teste"
fi

echo ""
echo "✨ Banco de dados pronto para usar!"
echo "📁 Arquivo: $DB_FILE"
echo ""
echo "💡 Para abrir no VSCode:"
echo "   1. Instale extensão: SQLite (alexcvzz.vscode-sqlite)"
echo "   2. Clique em: View > Command Palette > SQLite: Open Database"
echo "   3. Selecione: $DB_FILE"
