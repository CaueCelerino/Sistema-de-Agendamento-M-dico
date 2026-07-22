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
    migrateFuncionariosTable();
    seedDatabase();
  });
}

function migrateFuncionariosTable() {
  db.get("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'funcionarios'", (err, row) => {
    if (err) {
      console.error('Erro ao inspecionar tabela funcionarios:', err.message);
      return;
    }

    if (!row?.sql || !String(row.sql).includes('CHECK(tipo_trabalho')) {
      return;
    }

    db.serialize(() => {
      db.run('DROP TABLE IF EXISTS funcionarios_new');
      db.run(`
        CREATE TABLE IF NOT EXISTS funcionarios_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          telefone TEXT,
          especialidade TEXT,
          tipo_trabalho TEXT,
          ativo BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
        INSERT OR IGNORE INTO funcionarios_new (id, nome, email, telefone, especialidade, tipo_trabalho, ativo, created_at, updated_at)
        SELECT id, nome, email, telefone, especialidade, tipo_trabalho, ativo, created_at, updated_at
        FROM funcionarios
      `);

      db.run('DROP TABLE IF EXISTS funcionarios');
      db.run('ALTER TABLE funcionarios_new RENAME TO funcionarios');
      console.log('✅ Estrutura da tabela funcionarios migrada para suportar cargos dinâmicos.');
    });
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
  const adminEmail = (process.env.ADMIN_EMAIL || 'espacovida@gmail.com').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'vida22';
  const senhaHash = bcrypt.hashSync(adminPassword, 10);

  const ensureDefaultCargos = () => {
    const defaultCargos = ['MEDICO', 'ENFERMEIRO'];
    db.serialize(() => {
      const stmt = db.prepare('INSERT OR IGNORE INTO cargos (nome, ativo) VALUES (?, 1)');
      defaultCargos.forEach((cargo) => stmt.run(cargo));
      stmt.finalize((finalizeErr) => {
        if (finalizeErr) {
          console.error('Erro ao garantir cargos padrão:', finalizeErr.message);
        }
      });
    });
  };

  ensureDefaultCargos();

  const enforceSingleAdminPolicy = () => {
    db.run(
      'UPDATE usuarios SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE LOWER(email) <> LOWER(?) AND role IN (?, ?)',
      ['USER', adminEmail, 'ADM', 'SUPER_ADM'],
      (roleErr) => {
        if (roleErr) {
          console.error('Erro ao aplicar política de admin único:', roleErr.message);
        }
      }
    );
  };

  db.get('SELECT id FROM usuarios WHERE LOWER(email) = LOWER(?)', [adminEmail], (err, adminRow) => {
    if (err) {
      console.error('Erro ao validar dados iniciais:', err.message);
      return;
    }

    const upsertAdmin = (adminId) => {
      // Garantir ao menos um profissional ativo para alimentar agenda/agendamentos
      db.get('SELECT id FROM funcionarios WHERE ativo = 1 ORDER BY id LIMIT 1', (funcErr, funcRow) => {
        if (funcErr) {
          console.error('Erro ao garantir funcionário inicial:', funcErr.message);
          return;
        }

        const ensureCartaoAndAgenda = (funcionarioId) => {
          db.get('SELECT id FROM cartoes WHERE usuario_id = ? ORDER BY id LIMIT 1', [adminId], (cardErr, cardRow) => {
            if (cardErr) {
              console.error('Erro ao garantir cartão inicial:', cardErr.message);
              return;
            }

            const finalizeSeed = (cartaoId) => {
              db.get('SELECT COUNT(*) AS total FROM agendamentos', (countErr, countRow) => {
                if (countErr) {
                  console.error('Erro ao validar agendamentos iniciais:', countErr.message);
                  return;
                }

                if (Number(countRow?.total || 0) > 0) {
                  enforceSingleAdminPolicy();
                  console.log('✅ Dados iniciais do sistema validados.');
                  return;
                }

                db.run(
                  'INSERT INTO agendamentos (usuario_id, cartao_id, funcionario_id, tipo, data_agendamento, horario_agendamento, descricao, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                  [adminId, cartaoId, funcionarioId, 'CONSULTA', '2026-07-02', '09:00:00', 'Consulta de retorno', 'AGENDADO'],
                  (agendamentoErr) => {
                    if (agendamentoErr) {
                      console.error('Erro ao criar agendamento inicial:', agendamentoErr.message);
                      return;
                    }

                    enforceSingleAdminPolicy();
                    console.log('✅ Dados iniciais do sistema criados.');
                  }
                );
              });
            };

            if (cardRow?.id) {
              finalizeSeed(cardRow.id);
              return;
            }

            db.run(
              'INSERT INTO cartoes (usuario_id, tipo_servico, nome_cartao, data_entrada, data_saida, status) VALUES (?, ?, ?, ?, ?, ?)',
              [adminId, 'INDIVIDUAL', 'Cartão Inicial', '2026-01-01', '2026-12-31', 'ATIVO'],
              function insertCard(insertCardErr) {
                if (insertCardErr) {
                  console.error('Erro ao criar cartão inicial:', insertCardErr.message);
                  return;
                }

                finalizeSeed(this.lastID);
              }
            );
          });
        };

        if (funcRow?.id) {
          ensureCartaoAndAgenda(funcRow.id);
          return;
        }

        db.run(
          'INSERT INTO funcionarios (nome, email, telefone, especialidade, tipo_trabalho, ativo) VALUES (?, ?, ?, ?, ?, ?)',
          ['Dra. Ana Souza', 'ana@clinica.com', '11988888888', 'Clínica Geral', 'MEDICO', 1],
          function insertFuncionario(insertFuncErr) {
            if (insertFuncErr) {
              console.error('Erro ao criar funcionário inicial:', insertFuncErr.message);
              return;
            }

            ensureCartaoAndAgenda(this.lastID);
          }
        );
      });
    };

    if (adminRow?.id) {
      db.run(
        'UPDATE usuarios SET senha = ?, role = ?, ativo = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [senhaHash, 'ADM', adminRow.id],
        (updateErr) => {
          if (updateErr) {
            console.error('Erro ao atualizar credenciais do admin principal:', updateErr.message);
            return;
          }

          upsertAdmin(adminRow.id);
        }
      );
      return;
    }

    db.run(
      'INSERT INTO usuarios (email, senha, nome, telefone, role, ativo) VALUES (?, ?, ?, ?, ?, ?)',
      [adminEmail, senhaHash, 'Administrador Espaço Vida', '11999999999', 'ADM', 1],
      function insertAdmin(insertErr) {
        if (insertErr) {
          console.error('Erro ao criar usuário administrador inicial:', insertErr.message);
          return;
        }

        upsertAdmin(this.lastID);
      }
    );
  });
}

module.exports = db;
module.exports.initializeDatabase = initializeDatabase;
