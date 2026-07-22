const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(requireAdmin);

function getAsync(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

function runAsync(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function runCallback(err) {
      if (err) return reject(err);
      return resolve({ changes: this.changes, lastID: this.lastID });
    });
  });
}

function generateTemporaryPassword() {
  const randomChunk = Math.random().toString(36).slice(2, 8);
  const randomDigits = String(Math.floor(1000 + Math.random() * 9000));
  return `Vida@${randomChunk}${randomDigits}`;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeCargoName(name) {
  return String(name || '').trim().toUpperCase();
}

function ensureCanManageFuncionarios(req, res, next) {
  if (req.auth?.staffAccess) {
    return res.status(403).json({ error: 'Perfil de funcionário não pode gerenciar funcionários' });
  }


router.get('/cargos', ensureCanManageFuncionarios, (req, res, next) => {
  db.all(
    'SELECT id, nome, ativo, created_at, updated_at FROM cargos WHERE ativo = 1 ORDER BY nome ASC',
    [],
    (err, rows) => {
      if (err) return next(err);
      return res.json({ cargos: rows || [] });
    }
  );
});

router.post('/cargos', ensureCanManageFuncionarios, async (req, res, next) => {
  const nome = normalizeCargoName(req.body?.nome);
  if (!nome) {
    return res.status(400).json({ error: 'nome do cargo é obrigatório' });
  }

  try {
    const existing = await getAsync('SELECT id FROM cargos WHERE UPPER(nome) = UPPER(?)', [nome]);
    if (existing?.id) {
      await runAsync('UPDATE cargos SET ativo = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [existing.id]);
      const cargo = await getAsync('SELECT id, nome, ativo, created_at, updated_at FROM cargos WHERE id = ?', [existing.id]);
      return res.status(200).json({ cargo, restored: true });
    }

    const insert = await runAsync('INSERT INTO cargos (nome, ativo) VALUES (?, 1)', [nome]);
    const cargo = await getAsync('SELECT id, nome, ativo, created_at, updated_at FROM cargos WHERE id = ?', [insert.lastID]);
    return res.status(201).json({ cargo });
  } catch (err) {
    return next(err);
  }
});

router.delete('/cargos/:id', ensureCanManageFuncionarios, async (req, res, next) => {
  const cargoId = Number(req.params.id);
  if (!Number.isFinite(cargoId) || cargoId <= 0) {
    return res.status(400).json({ error: 'id de cargo inválido' });
  }

  try {
    const cargo = await getAsync('SELECT id, nome FROM cargos WHERE id = ? AND ativo = 1', [cargoId]);
    if (!cargo) {
      return res.status(404).json({ error: 'Cargo não encontrado' });
    }

    const inUse = await getAsync(
      'SELECT COUNT(*) AS total FROM funcionarios WHERE UPPER(tipo_trabalho) = UPPER(?) AND ativo = 1',
      [cargo.nome]
    );

    if (Number(inUse?.total || 0) > 0) {
      return res.status(400).json({ error: 'Cargo em uso por funcionários ativos e não pode ser excluído' });
    }

    await runAsync('UPDATE cargos SET ativo = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [cargoId]);
    return res.json({ id: cargoId, deleted: true });
  } catch (err) {
    return next(err);
  }
});
  return next();
}

router.get('/dashboard', (req, res, next) => {
  const counters = [
    { key: 'total_usuarios', query: 'SELECT COUNT(*) AS total_usuarios FROM usuarios' },
    { key: 'total_cartoes', query: 'SELECT COUNT(*) AS total_cartoes FROM cartoes' },
    { key: 'total_agendamentos', query: 'SELECT COUNT(*) AS total_agendamentos FROM agendamentos' },
    { key: 'total_funcionarios', query: 'SELECT COUNT(*) AS total_funcionarios FROM funcionarios WHERE ativo = 1' },
  ];

  const summary = {};
  let completed = 0;

  counters.forEach(({ key, query }) => {
    db.get(query, (err, row) => {
      if (err) return next(err);

      summary[key] = Number(row?.[key] || 0);
      completed += 1;

      if (completed === counters.length) {
        return res.json({ resumo: summary });
      }
    });
  });
});

router.get('/funcionarios', ensureCanManageFuncionarios, (req, res, next) => {
  const query = `
    SELECT id, nome, email, telefone, especialidade, tipo_trabalho AS role, ativo
    FROM funcionarios
    ORDER BY nome ASC
  `;

  db.all(query, [], (err, rows) => {
    if (err) return next(err);
    return res.json({ funcionarios: rows || [] });
  });
});

router.post('/funcionarios', ensureCanManageFuncionarios, async (req, res, next) => {
  const { nome, email, telefone, especialidade, role } = req.body || {};

  if (!nome || !email) {
    return res.status(400).json({ error: 'nome e email são obrigatórios' });
  }

  const normalizedEmail = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: 'email inválido' });
  }

  const tipoTrabalho = normalizeCargoName(role);
  if (!tipoTrabalho) {
    return res.status(400).json({ error: 'cargo é obrigatório' });
  }
  const senhaTemporaria = generateTemporaryPassword();

  try {
    const cargoAtivo = await getAsync('SELECT id, nome FROM cargos WHERE UPPER(nome) = UPPER(?) AND ativo = 1', [tipoTrabalho]);
    if (!cargoAtivo) {
      return res.status(400).json({ error: 'Cargo inválido. Cadastre o cargo antes de criar o funcionário.' });
    }

    const senhaHash = await bcrypt.hash(String(senhaTemporaria), 10);
    const existingUsuario = await getAsync('SELECT id, role FROM usuarios WHERE LOWER(email) = LOWER(?)', [normalizedEmail]);

    let usuarioId = null;
    if (existingUsuario?.id) {
      await runAsync(
        `UPDATE usuarios
         SET nome = COALESCE(?, nome),
             telefone = COALESCE(?, telefone),
             senha = ?,
             role = ?,
             ativo = 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [nome || null, telefone || null, senhaHash, 'ADM', existingUsuario.id]
      );
      usuarioId = existingUsuario.id;
    } else {
      const insertUsuario = await runAsync(
        'INSERT INTO usuarios (email, senha, nome, telefone, role, ativo) VALUES (?, ?, ?, ?, ?, 1)',
        [normalizedEmail, senhaHash, nome, telefone || null, 'ADM']
      );
      usuarioId = insertUsuario.lastID;
    }

    const insertFuncionario = await runAsync(
      'INSERT INTO funcionarios (nome, email, telefone, especialidade, tipo_trabalho) VALUES (?, ?, ?, ?, ?)',
      [nome, normalizedEmail, telefone || null, especialidade || null, tipoTrabalho]
    );

    return res.status(201).json({
      id: insertFuncionario.lastID,
      nome,
      email: normalizedEmail,
      telefone: telefone || null,
      especialidade: especialidade || null,
      role: tipoTrabalho,
      usuario_id: usuarioId,
      credenciais: {
        email: normalizedEmail,
        senhaTemporaria,
        perfil: 'FUNCIONARIO_ADMIN',
        deveAlterarSenha: true,
      },
    });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'Email de funcionário já cadastrado' });
    }

    return next(err);
  }
});

router.put('/funcionarios/:id', ensureCanManageFuncionarios, (req, res, next) => {
  const { id } = req.params;
  const { nome, email, telefone, especialidade, role, ativo } = req.body || {};

  const tipoTrabalho = role ? normalizeCargoName(role) : null;

  const proceedUpdate = () => {
    db.run(
      `UPDATE funcionarios
       SET nome = COALESCE(?, nome),
           email = COALESCE(?, email),
           telefone = COALESCE(?, telefone),
           especialidade = COALESCE(?, especialidade),
           tipo_trabalho = COALESCE(?, tipo_trabalho),
           ativo = COALESCE(?, ativo),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [nome || null, email || null, telefone || null, especialidade || null, tipoTrabalho, ativo ?? null, id],
      function updateFuncionario(err) {
        if (err) return next(err);
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Funcionário não encontrado' });
        }

        db.get(
          'SELECT id, nome, email, telefone, especialidade, tipo_trabalho AS role, ativo FROM funcionarios WHERE id = ?',
          [id],
          (findErr, row) => {
            if (findErr) return next(findErr);
            return res.json(row);
          }
        );
      }
    );
  };

  if (tipoTrabalho) {
    db.get('SELECT id, nome FROM cargos WHERE UPPER(nome) = UPPER(?) AND ativo = 1', [tipoTrabalho], (cargoErr, cargoRow) => {
      if (cargoErr) return next(cargoErr);
      if (!cargoRow) {
        return res.status(400).json({ error: 'Cargo inválido. Cadastre o cargo antes de atualizar o funcionário.' });
      }

      return proceedUpdate();
    });
    return;
  }

  return proceedUpdate();
});

router.delete('/funcionarios/:id', ensureCanManageFuncionarios, (req, res, next) => {
  const { id } = req.params;

  db.get('SELECT id, nome, email FROM funcionarios WHERE id = ?', [id], (findErr, row) => {
    if (findErr) return next(findErr);
    if (!row) return res.status(404).json({ error: 'Funcionário não encontrado' });

    db.run('DELETE FROM funcionarios WHERE id = ?', [id], (deleteErr) => {
      if (deleteErr) return next(deleteErr);
      return res.json({ message: 'Deletado', funcionario: row });
    });
  });
});

router.get('/agendamentos', (req, res, next) => {
  db.all(
    `SELECT a.id, a.usuario_id, a.cartao_id, a.funcionario_id, a.tipo, a.data_agendamento AS data, a.horario_agendamento AS horario,
            a.status, a.descricao, a.observacoes, u.nome AS usuario_nome, u.email AS usuario_email,
            f.nome AS funcionario, c.nome_cartao
     FROM agendamentos a
     LEFT JOIN usuarios u ON u.id = a.usuario_id
     LEFT JOIN funcionarios f ON f.id = a.funcionario_id
     LEFT JOIN cartoes c ON c.id = a.cartao_id
     ORDER BY a.data_agendamento ASC, a.horario_agendamento ASC`,
    [],
    (err, rows) => {
      if (err) return next(err);
      return res.json({ agendamentos: rows || [] });
    }
  );
});

router.patch('/agendamentos/:id/aceitar', (req, res, next) => {
  const { id } = req.params;

  // Primeiro, obtém os dados do agendamento (data, horário, funcionário)
  db.get(
    'SELECT data_agendamento, horario_agendamento, funcionario_id FROM agendamentos WHERE id = ?',
    [id],
    (getErr, agendamento) => {
      if (getErr) return next(getErr);
      if (!agendamento) return res.status(404).json({ error: 'Agendamento não encontrado' });

      // Marca o horário como indisponível na tabela agendas
      db.run(
        'UPDATE agendas SET disponivel = 0 WHERE funcionario_id = ? AND data_agenda = ? AND horario_inicio = ?',
        [agendamento.funcionario_id, agendamento.data_agendamento, agendamento.horario_agendamento],
        (updateAgendaErr) => {
          if (updateAgendaErr) return next(updateAgendaErr);

          // Depois atualiza o status do agendamento para AGENDADO
          db.run(
            'UPDATE agendamentos SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            ['AGENDADO', id],
            function updateAppointment(err) {
              if (err) return next(err);
              return res.json({ message: 'Agendamento aceito e horário bloqueado', id: Number(id) });
            }
          );
        }
      );
    }
  );
});

router.patch('/agendamentos/:id/rejeitar', (req, res, next) => {
  db.run('UPDATE agendamentos SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['CANCELADO', req.params.id], function updateAppointment(err) {
    if (err) return next(err);
    if (this.changes === 0) return res.status(404).json({ error: 'Agendamento não encontrado' });
    return res.json({ message: 'Agendamento rejeitado', id: Number(req.params.id) });
  });
});

// Solicitar reagendamento: cria uma notificação para o usuário avisando que o admin solicita reagendamento
router.post('/agendamentos/:id/solicitar-reagendamento', (req, res, next) => {
  const { id } = req.params;

  db.get(
    `SELECT a.id, a.usuario_id, a.cartao_id, a.funcionario_id, a.data_agendamento AS data, a.horario_agendamento AS horario, u.nome AS usuario_nome, f.nome AS funcionario_nome, f.especialidade
     FROM agendamentos a
     LEFT JOIN usuarios u ON u.id = a.usuario_id
     LEFT JOIN funcionarios f ON f.id = a.funcionario_id
     WHERE a.id = ?`,
    [id],
    (err, row) => {
      if (err) return next(err);
      if (!row) return res.status(404).json({ error: 'Agendamento não encontrado' });

      const profissionalTexto = row.funcionario_nome ? `${row.funcionario_nome}${row.especialidade ? ` (${row.especialidade})` : ''}` : 'seu profissional';
      const payload = JSON.stringify({
        agendamentoId: row.id,
        funcionarioId: row.funcionario_id,
        profissional: row.funcionario_nome || null,
        especialidade: row.especialidade || null,
        data: row.data,
        horario: row.horario,
      });
      const marker = `__REAGENDAR__${payload}`;
      const titulo = 'Reagendamento solicitado';
      const mensagem = `Seu agendamento de ${row.data} às ${row.horario} com ${profissionalTexto} precisou de um ajuste. Toque em Reagendar para abrir a agenda com a próxima disponibilidade disponível para este profissional. ${marker}`;

      db.run(
        'INSERT INTO notificacoes (usuario_id, cartao_id, titulo, mensagem, tipo, enviada, lida, canal, data_envio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
        [row.usuario_id, row.cartao_id || null, titulo, mensagem, 'AGENDAMENTO', 0, 0, 'APP'],
        function insertNotification(insErr) {
          if (insErr) return next(insErr);
          return res.status(201).json({ message: 'Notificação de reagendamento enviada', notificacaoId: this.lastID });
        }
      );
    }
  );
});

router.patch('/agendamentos/:id/compareceu', (req, res, next) => {
  const { id } = req.params;

  db.get(
    `SELECT a.id, a.usuario_id, a.cartao_id, a.funcionario_id, a.data_agendamento AS data, a.horario_agendamento AS horario, f.nome AS funcionario_nome, f.especialidade
     FROM agendamentos a
     LEFT JOIN funcionarios f ON f.id = a.funcionario_id
     WHERE a.id = ?`,
    [id],
    (err, row) => {
      if (err) return next(err);
      if (!row) return res.status(404).json({ error: 'Agendamento não encontrado' });

      db.run(
        'UPDATE agendamentos SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['REALIZADO', id],
        function updateAppointment(err2) {
          if (err2) return next(err2);

          const profissionalTexto = row.funcionario_nome ? `${row.funcionario_nome}${row.especialidade ? ` (${row.especialidade})` : ''}` : 'seu profissional';
          const titulo = 'Consulta realizada';
          const mensagem = `Sua consulta de ${row.data} às ${row.horario} com ${profissionalTexto} foi marcada como realizada. Por favor, responda nossa pesquisa de satisfação.`;

          db.run(
            'INSERT INTO notificacoes (usuario_id, cartao_id, titulo, mensagem, tipo, enviada, lida, canal, data_envio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
            [row.usuario_id, row.cartao_id || null, titulo, mensagem, 'AGENDAMENTO', 0, 0, 'APP'],
            function insertNotification(insErr) {
              if (insErr) return next(insErr);
              return res.json({ message: 'Agendamento marcado como realizado', notificacaoId: this.lastID });
            }
          );
        }
      );
    }
  );
});

router.patch('/agendamentos/:id/nao-compareceu', (req, res, next) => {
  const { id } = req.params;

  db.get(
    `SELECT a.id, a.usuario_id, a.cartao_id, a.funcionario_id, a.data_agendamento AS data, a.horario_agendamento AS horario, f.nome AS funcionario_nome, f.especialidade
     FROM agendamentos a
     LEFT JOIN funcionarios f ON f.id = a.funcionario_id
     WHERE a.id = ?`,
    [id],
    (err, row) => {
      if (err) return next(err);
      if (!row) return res.status(404).json({ error: 'Agendamento não encontrado' });

      db.run(
        'UPDATE agendamentos SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['NAO_COMPARECEU', id],
        function updateAppointment(err2) {
          if (err2) return next(err2);

          const profissionalTexto = row.funcionario_nome ? `${row.funcionario_nome}${row.especialidade ? ` (${row.especialidade})` : ''}` : 'seu profissional';
          const titulo = 'Agendamento não comparecido';
          const mensagem = `O seu agendamento de ${row.data} às ${row.horario} com ${profissionalTexto} foi marcado como não comparecido. Entre em contato para reagendar.`;

          db.run(
            'INSERT INTO notificacoes (usuario_id, cartao_id, titulo, mensagem, tipo, enviada, lida, canal, data_envio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
            [row.usuario_id, row.cartao_id || null, titulo, mensagem, 'AGENDAMENTO', 0, 0, 'APP'],
            function insertNotification(insErr) {
              if (insErr) return next(insErr);
              return res.json({ message: 'Agendamento marcado como não comparecido', notificacaoId: this.lastID });
            }
          );
        }
      );
    }
  );
});

router.put('/usuarios/:id/reset-senha', async (req, res, next) => {
  const { novaSenha } = req.body || {};

  if (!novaSenha) {
    return res.status(400).json({ error: 'novaSenha é obrigatória' });
  }

  try {
    const senhaHash = await bcrypt.hash(String(novaSenha), 10);
    db.run('UPDATE usuarios SET senha = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [senhaHash, req.params.id], function updatePassword(err) {
      if (err) return next(err);
      if (this.changes === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
      return res.json({ message: 'Senha redefinida com sucesso', id: Number(req.params.id) });
    });
  } catch (hashErr) {
    return next(hashErr);
  }
});

router.get('/cartoes', (req, res, next) => {
  db.all(
    `SELECT c.id, c.usuario_id, c.nome_cartao, c.status, c.tipo_servico, c.data_entrada, c.data_saida, u.nome AS usuario_nome, u.email AS usuario_email
     FROM cartoes c
     LEFT JOIN usuarios u ON u.id = c.usuario_id
     ORDER BY c.data_entrada DESC`,
    [],
    (err, rows) => {
      if (err) return next(err);
      return res.json({ cartoes: rows || [] });
    }
  );
});

router.post('/cartoes', async (req, res, next) => {
  const {
    clienteNome,
    email,
    telefone,
    identificacao,
    tipo,
    criadoEm,
    validade,
    status,
  } = req.body || {};

  const normalizedEmail = normalizeEmail(email);
  const normalizedName = String(clienteNome || '').trim();

  if (!normalizedName || !normalizedEmail) {
    return res.status(400).json({ error: 'clienteNome e email são obrigatórios' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: 'email inválido' });
  }

  const typeMap = {
    INDIVIDUAL: 'INDIVIDUAL',
    FAMILIAR: 'FAMILIAR',
    EMPRESARIAL: 'EMPRESARIAL',
    DEPENDENTE: 'INDIVIDUAL',
  };

  const statusMap = {
    ATIVO: 'ATIVO',
    DESATIVADO: 'CANCELADO',
    CANCELADO: 'CANCELADO',
    VENCIDO: 'VENCIDO',
  };

  const normalizedTipo = typeMap[String(tipo || '').trim().toUpperCase()] || 'INDIVIDUAL';
  const normalizedStatus = statusMap[String(status || '').trim().toUpperCase()] || 'ATIVO';
  const dataEntrada = criadoEm || new Date().toISOString().slice(0, 10);
  const dataSaida = validade || dataEntrada;
  const nomeCartao = String(identificacao || `EV-${Date.now()}`).trim();
  const senhaTemporaria = generateTemporaryPassword();

  try {
    const senhaHash = await bcrypt.hash(String(senhaTemporaria), 10);
    const existingUsuario = await getAsync('SELECT id, role FROM usuarios WHERE LOWER(email) = LOWER(?)', [normalizedEmail]);

    let usuarioId = null;
    if (existingUsuario?.id) {
      const roleAtual = String(existingUsuario.role || 'USER').toUpperCase();
      if (roleAtual === 'ADM' || roleAtual === 'SUPER_ADM') {
        return res.status(409).json({ error: 'Email já vinculado a perfil administrativo' });
      }

      await runAsync(
        `UPDATE usuarios
         SET nome = COALESCE(?, nome),
             telefone = COALESCE(?, telefone),
             senha = ?,
             role = ?,
             ativo = 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [normalizedName || null, telefone || null, senhaHash, 'USER', existingUsuario.id]
      );
      usuarioId = existingUsuario.id;
    } else {
      const insertUsuario = await runAsync(
        'INSERT INTO usuarios (email, senha, nome, telefone, role, ativo) VALUES (?, ?, ?, ?, ?, 1)',
        [normalizedEmail, senhaHash, normalizedName, telefone || null, 'USER']
      );
      usuarioId = insertUsuario.lastID;
    }

    const insertCard = await runAsync(
      `INSERT INTO cartoes (usuario_id, tipo_servico, nome_cartao, data_entrada, data_saida, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [usuarioId, normalizedTipo, nomeCartao, dataEntrada, dataSaida, normalizedStatus]
    );

    const cardRow = await getAsync(
      `SELECT c.id, c.usuario_id, c.nome_cartao, c.status, c.tipo_servico, c.data_entrada, c.data_saida,
              u.nome AS usuario_nome, u.email AS usuario_email
       FROM cartoes c
       LEFT JOIN usuarios u ON u.id = c.usuario_id
       WHERE c.id = ?`,
      [insertCard.lastID]
    );

    return res.status(201).json({
      cartao: cardRow,
      credenciais: {
        email: normalizedEmail,
        senhaTemporaria,
        perfil: 'CLIENTE',
        deveAlterarSenha: true,
      },
    });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    return next(err);
  }
});

router.get('/cartoes/:id', (req, res, next) => {
  db.get(
    `SELECT c.id, c.nome_cartao, c.status, c.tipo_servico, c.data_entrada, c.data_saida, u.nome AS usuario_nome, u.email AS usuario_email
     FROM cartoes c
     LEFT JOIN usuarios u ON u.id = c.usuario_id
     WHERE c.id = ?`,
    [req.params.id],
    (err, row) => {
      if (err) return next(err);
      if (!row) return res.status(404).json({ error: 'Cartão não encontrado' });
      return res.json({ cartao: row });
    }
  );
});

router.patch('/cartoes/:id', async (req, res, next) => {
  const { id } = req.params;
  const { clienteNome, nome, email, identificacao, tipo, validade, status, senha, telefone } = req.body || {};

  try {
    const row = await new Promise((resolve, reject) => {
      db.get(
        `SELECT c.id, c.usuario_id, c.nome_cartao, c.status, c.tipo_servico, c.data_entrada, c.data_saida, u.nome AS usuario_nome, u.email AS usuario_email
         FROM cartoes c
         LEFT JOIN usuarios u ON u.id = c.usuario_id
         WHERE c.id = ?`,
        [id],
        (err, found) => (err ? reject(err) : resolve(found))
      );
    });

    if (!row) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }

    const updates = [];
    const params = [];

    const resolvedNome = String(clienteNome || nome || '').trim();
    if (resolvedNome) {
      updates.push('nome = ?');
      params.push(resolvedNome);
    }

    const resolvedEmail = String(email || '').trim();
    if (resolvedEmail) {
      updates.push('email = ?');
      params.push(resolvedEmail);
    }

    if (telefone !== undefined && telefone !== null) {
      updates.push('telefone = ?');
      params.push(String(telefone));
    }

    let passwordHash = null;
    if (senha) {
      passwordHash = await bcrypt.hash(String(senha), 10);
      updates.push('senha = ?');
      params.push(passwordHash);
    }

    if (updates.length > 0) {
      await new Promise((resolve, reject) => {
        db.run(
          `UPDATE usuarios SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [...params, row.usuario_id],
          function updateUser(err) {
            if (err) return reject(err);
            return resolve(this.changes);
          }
        );
      });
    }

    const cardUpdates = [];
    const cardParams = [];

    const resolvedIdentificacao = String(identificacao || '').trim();
    if (resolvedIdentificacao) {
      cardUpdates.push('nome_cartao = ?');
      cardParams.push(resolvedIdentificacao);
    }

    const resolvedTipo = String(tipo || '').trim().toUpperCase();
    const mapTipo = {
      INDIVIDUAL: 'INDIVIDUAL',
      FAMILIAR: 'FAMILIAR',
      EMPRESARIAL: 'EMPRESARIAL',
      DEPENDENTE: 'INDIVIDUAL',
    };
    if (resolvedTipo && mapTipo[resolvedTipo]) {
      cardUpdates.push('tipo_servico = ?');
      cardParams.push(mapTipo[resolvedTipo]);
    }

    const resolvedValidade = String(validade || '').trim();
    if (resolvedValidade) {
      cardUpdates.push('data_saida = ?');
      cardParams.push(resolvedValidade);
    }

    const normalizedStatus = String(status || '').trim().toUpperCase();
    const mapStatus = {
      ATIVO: 'ATIVO',
      DESATIVADO: 'CANCELADO',
      CANCELADO: 'CANCELADO',
      VENCIDO: 'VENCIDO',
    };
    if (normalizedStatus && mapStatus[normalizedStatus]) {
      cardUpdates.push('status = ?');
      cardParams.push(mapStatus[normalizedStatus]);
    }

    if (cardUpdates.length > 0) {
      await new Promise((resolve, reject) => {
        db.run(
          `UPDATE cartoes SET ${cardUpdates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [...cardParams, id],
          function updateCard(err) {
            if (err) return reject(err);
            return resolve(this.changes);
          }
        );
      });
    }

    const updatedCard = await new Promise((resolve, reject) => {
      db.get(
        `SELECT c.id, c.usuario_id, c.nome_cartao, c.status, c.tipo_servico, c.data_entrada, c.data_saida, u.nome AS usuario_nome, u.email AS usuario_email
         FROM cartoes c
         LEFT JOIN usuarios u ON u.id = c.usuario_id
         WHERE c.id = ?`,
        [id],
        (err, found) => (err ? reject(err) : resolve(found))
      );
    });

    return res.json({
      cartao: updatedCard,
      usuario: {
        id: row.usuario_id,
        nome: resolvedNome || row.usuario_nome,
        email: resolvedEmail || row.usuario_email,
      },
    });
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    return next(error);
  }
});

router.patch('/cartoes/:id/ativar', (req, res, next) => {
  db.run('UPDATE cartoes SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['ATIVO', req.params.id], function updateCard(err) {
    if (err) return next(err);
    if (this.changes === 0) return res.status(404).json({ error: 'Cartão não encontrado' });
    return res.json({ message: 'Cartão ativado', id: Number(req.params.id) });
  });
});

router.patch('/cartoes/:id/desativar', (req, res, next) => {
  db.run('UPDATE cartoes SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['CANCELADO', req.params.id], function updateCard(err) {
    if (err) return next(err);
    if (this.changes === 0) return res.status(404).json({ error: 'Cartão não encontrado' });
    return res.json({ message: 'Cartão desativado', id: Number(req.params.id) });
  });
});

router.delete('/cartoes/:id', (req, res, next) => {
  db.get('SELECT id, status FROM cartoes WHERE id = ?', [req.params.id], (findErr, row) => {
    if (findErr) return next(findErr);
    if (!row) return res.status(404).json({ error: 'Cartão não encontrado' });

    if (String(row.status).toUpperCase() === 'ATIVO') {
      return res.status(400).json({ error: 'Apenas cartões desativados/cancelados podem ser excluídos' });
    }

    db.get('SELECT COUNT(*) AS total FROM agendamentos WHERE cartao_id = ?', [req.params.id], (countErr, countRow) => {
      if (countErr) return next(countErr);

      if (Number(countRow?.total || 0) > 0) {
        return res.status(400).json({ error: 'Cartão possui agendamentos vinculados e não pode ser excluído' });
      }

      db.run('DELETE FROM cartoes WHERE id = ?', [req.params.id], function deleteCard(deleteErr) {
        if (deleteErr) return next(deleteErr);
        return res.json({ message: 'Cartão excluído', id: Number(req.params.id) });
      });
    });
  });
});

router.get('/relatorios', (req, res, next) => {
  db.all(
    `SELECT id, titulo, conteudo, tipo, visibilidade, autor, publicado_em AS publicadoEm, created_at, updated_at
     FROM relatorios
     WHERE ativo = 1
     ORDER BY publicado_em DESC, id DESC`,
    [],
    (err, rows) => {
      if (err) return next(err);
      return res.json({ relatorios: rows || [] });
    }
  );
});

router.post('/relatorios', (req, res, next) => {
  const { titulo, conteudo, tipo, visibilidade, autor, publicadoEm } = req.body || {};

  if (!titulo || !conteudo) {
    return res.status(400).json({ error: 'titulo e conteudo são obrigatórios' });
  }

  const tipoNormalizado = ['RELATORIO', 'AVISO', 'COMUNICADO'].includes(String(tipo || '').toUpperCase())
    ? String(tipo).toUpperCase()
    : 'AVISO';

  const visibilidadeNormalizada = ['ADMIN', 'CLIENTES'].includes(String(visibilidade || '').toUpperCase())
    ? String(visibilidade).toUpperCase()
    : 'ADMIN';

  const autorNormalizado = String(autor || req.auth?.role || 'Admin').slice(0, 120);

  db.run(
    `INSERT INTO relatorios (titulo, conteudo, tipo, visibilidade, autor, publicado_em, ativo)
     VALUES (?, ?, ?, ?, ?, COALESCE(?, DATE('now')), 1)`,
    [titulo, conteudo, tipoNormalizado, visibilidadeNormalizada, autorNormalizado, publicadoEm || null],
    function insertReport(err) {
      if (err) return next(err);

      db.get(
        `SELECT id, titulo, conteudo, tipo, visibilidade, autor, publicado_em AS publicadoEm, created_at, updated_at
         FROM relatorios
         WHERE id = ?`,
        [this.lastID],
        (findErr, row) => {
          if (findErr) return next(findErr);
          return res.status(201).json({ relatorio: row });
        }
      );
    }
  );
});

router.put('/relatorios/:id', (req, res, next) => {
  const { titulo, conteudo, tipo, visibilidade, autor, publicadoEm } = req.body || {};

  const tipoNormalizado = tipo && ['RELATORIO', 'AVISO', 'COMUNICADO'].includes(String(tipo).toUpperCase())
    ? String(tipo).toUpperCase()
    : null;

  const visibilidadeNormalizada = visibilidade && ['ADMIN', 'CLIENTES'].includes(String(visibilidade).toUpperCase())
    ? String(visibilidade).toUpperCase()
    : null;

  db.run(
    `UPDATE relatorios
     SET titulo = COALESCE(?, titulo),
         conteudo = COALESCE(?, conteudo),
         tipo = COALESCE(?, tipo),
         visibilidade = COALESCE(?, visibilidade),
         autor = COALESCE(?, autor),
         publicado_em = COALESCE(?, publicado_em),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND ativo = 1`,
    [titulo || null, conteudo || null, tipoNormalizado, visibilidadeNormalizada, autor || null, publicadoEm || null, req.params.id],
    function updateReport(err) {
      if (err) return next(err);
      if (this.changes === 0) return res.status(404).json({ error: 'Relatório não encontrado' });

      db.get(
        `SELECT id, titulo, conteudo, tipo, visibilidade, autor, publicado_em AS publicadoEm, created_at, updated_at
         FROM relatorios
         WHERE id = ?`,
        [req.params.id],
        (findErr, row) => {
          if (findErr) return next(findErr);
          return res.json({ relatorio: row });
        }
      );
    }
  );
});

router.delete('/relatorios/:id', (req, res, next) => {
  db.run(
    'UPDATE relatorios SET ativo = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND ativo = 1',
    [req.params.id],
    function deleteReport(err) {
      if (err) return next(err);
      if (this.changes === 0) return res.status(404).json({ error: 'Relatório não encontrado' });
      return res.json({ id: Number(req.params.id), deleted: true });
    }
  );
});

router.post('/relatorios/gerar-rapido', (req, res, next) => {
  const hoje = new Date().toISOString().slice(0, 10);
  const nowIso = new Date().toISOString();
  const autor = String(req.body?.autor || req.auth?.role || 'Sistema').slice(0, 120);
  const tituloBase = `Resumo rápido ${hoje}`;

  db.get('SELECT COUNT(*) AS total FROM agendamentos WHERE status = ?', ['PENDENTE'], (countErr, pendentesRow) => {
    if (countErr) return next(countErr);

    db.get('SELECT COUNT(*) AS total FROM cartoes WHERE status = ?', ['ATIVO'], (ativosErr, ativosRow) => {
      if (ativosErr) return next(ativosErr);

      db.get('SELECT COUNT(*) AS total FROM notificacoes WHERE lida = 0', (notificacoesErr, notificacoesRow) => {
        if (notificacoesErr) return next(notificacoesErr);

        const pendencias = Number(pendentesRow?.total || 0);
        const cartoesAtivos = Number(ativosRow?.total || 0);
        const notificacoesNaoLidas = Number(notificacoesRow?.total || 0);
        const conteudo = `Resumo automático de ${hoje}: ${pendencias} pendências de agendamento, ${cartoesAtivos} cartões ativos e ${notificacoesNaoLidas} notificações não lidas. Gerado em ${nowIso}.`;

        db.get(
          `SELECT id
           FROM relatorios
           WHERE ativo = 1
             AND publicado_em = ?
             AND titulo LIKE ?
           ORDER BY id DESC
           LIMIT 1`,
          [hoje, 'Resumo rápido %'],
          (findErr, existingRow) => {
            if (findErr) return next(findErr);

            const sendResult = (reportId, statusCode, operation) => {
              db.get(
                `SELECT id, titulo, conteudo, tipo, visibilidade, autor, publicado_em AS publicadoEm, created_at, updated_at
                 FROM relatorios
                 WHERE id = ?`,
                [reportId],
                (resultErr, row) => {
                  if (resultErr) return next(resultErr);

                  return res.status(statusCode).json({
                    relatorio: row,
                    quickSummary: {
                      operation,
                      metricas: {
                        pendencias,
                        cartoesAtivos,
                        notificacoesNaoLidas,
                      },
                      generatedAt: nowIso,
                    },
                  });
                }
              );
            };

            if (existingRow?.id) {
              db.run(
                `UPDATE relatorios
                 SET titulo = ?,
                     conteudo = ?,
                     visibilidade = ?,
                     autor = ?,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [tituloBase, conteudo, visibilidade, autor, existingRow.id],
                function updateQuick(updateErr) {
                  if (updateErr) return next(updateErr);
                  return sendResult(existingRow.id, 200, 'updated');
                }
              );
              return;
            }

            db.run(
              `INSERT INTO relatorios (titulo, conteudo, tipo, visibilidade, autor, publicado_em, ativo)
               VALUES (?, ?, ?, ?, ?, ?, 1)`,
              [tituloBase, conteudo, 'RELATORIO', visibilidade, autor, hoje],
              function insertQuick(insertErr) {
                if (insertErr) return next(insertErr);
                return sendResult(this.lastID, 201, 'created');
              }
            );
          }
        );
      });
    });
  });
});

module.exports = router;
