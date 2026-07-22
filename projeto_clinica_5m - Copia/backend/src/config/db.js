const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const dbDir = path.resolve(__dirname, '../../database');
const dbPath = path.resolve(dbDir, process.env.DB_NAME || 'clinica_5m.db');
const schemaPath = path.resolve(__dirname, '../../../schema.sql');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('Erro ao abrir o banco de dados:', err.message);
    process.exit(1);
  }

  console.log(`✅ Banco SQLite aberto em: ${dbPath}`);
  initializeDatabase();
});

function initializeDatabase() {
  if (!fs.existsSync(schemaPath)) {
    console.warn(`⚠️ Arquivo de esquema não encontrado em ${schemaPath}.`);
    return;
  }

  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql, (schemaErr) => {
    if (schemaErr) {
      console.error('Erro ao criar esquema do banco:', schemaErr.message);
      return;
    }

    console.log('✅ Esquema SQL carregado com sucesso.');
    migrateAgendamentosTable();
    seedDatabase();
  });
}

function migrateAgendamentosTable() {
  db.get("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'agendamentos'", (err, row) => {
    if (err) {
      console.error('Erro ao inspecionar tabela agendamentos:', err.message);
      return;
    }

    if (!row?.sql || String(row.sql).includes("'PENDENTE'")) {
      return;
    }

    db.serialize(() => {
      db.run(`
        CREATE TABLE agendamentos_new (
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
        )
      `);

      db.run(`
        INSERT INTO agendamentos_new (id, usuario_id, cartao_id, funcionario_id, tipo, data_agendamento, horario_agendamento, descricao, status, observacoes, created_at, updated_at)
        SELECT id, usuario_id, cartao_id, funcionario_id, tipo, data_agendamento, horario_agendamento, descricao, status, observacoes, created_at, updated_at
        FROM agendamentos
      `);

      db.run('DROP TABLE agendamentos');
      db.run('ALTER TABLE agendamentos_new RENAME TO agendamentos');
      console.log('✅ Estrutura da tabela agendamentos migrada para suportar status pendente.');
    });
  });
}

function seedDatabase() {
  db.get('SELECT COUNT(*) AS count FROM usuarios', (err, row) => {
    if (err) {
      console.error('Erro ao validar dados iniciais:', err.message);
      return;
    }

    if (Number(row?.count || 0) > 0) {
      return;
    }

    const senhaHash = bcrypt.hashSync('admin123', 10);

    db.run(
      'INSERT INTO usuarios (email, senha, nome, telefone, role, ativo) VALUES (?, ?, ?, ?, ?, ?)',
      ['admin@clinica.com', senhaHash, 'Administrador', '11999999999', 'ADM', 1],
      function insertAdmin(err) {
        if (err) {
          console.error('Erro ao criar usuário administrador inicial:', err.message);
          return;
        }

        const adminId = this.lastID;

        db.run(
          'INSERT INTO funcionarios (nome, email, telefone, especialidade, tipo_trabalho, ativo) VALUES (?, ?, ?, ?, ?, ?)',
          ['Dra. Ana Souza', 'ana@clinica.com', '11988888888', 'Clínica Geral', 'MEDICO', 1],
          () => {}
        );

        db.run(
          'INSERT INTO cartoes (usuario_id, tipo_servico, nome_cartao, data_entrada, data_saida, status) VALUES (?, ?, ?, ?, ?, ?)',
          [adminId, 'INDIVIDUAL', 'Cartão Inicial', '2026-01-01', '2026-12-31', 'ATIVO'],
          () => {}
        );

        db.run(
          'INSERT INTO agendamentos (usuario_id, cartao_id, funcionario_id, tipo, data_agendamento, horario_agendamento, descricao, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [adminId, 1, 1, 'CONSULTA', '2026-07-02', '09:00:00', 'Consulta de retorno', 'AGENDADO'],
          () => {}
        );

        console.log('✅ Dados iniciais do sistema criados.');
      }
    );
  });
}

module.exports = db;
module.exports.initializeDatabase = initializeDatabase;
