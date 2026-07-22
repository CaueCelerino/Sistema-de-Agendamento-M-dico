const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(requireAdmin);

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

router.get('/funcionarios', (req, res, next) => {
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

router.post('/funcionarios', (req, res, next) => {
  const { nome, email, telefone, especialidade, role } = req.body || {};

  if (!nome || !email) {
    return res.status(400).json({ error: 'nome e email são obrigatórios' });
  }

  const tipoTrabalho = String(role || 'RECEPCIONISTA').toUpperCase();

  db.run(
    'INSERT INTO funcionarios (nome, email, telefone, especialidade, tipo_trabalho) VALUES (?, ?, ?, ?, ?)',
    [nome, email, telefone || null, especialidade || null, tipoTrabalho],
    function insertFuncionario(err) {
      if (err) {
        if (String(err.message).includes('UNIQUE')) {
          return res.status(409).json({ error: 'Email de funcionário já cadastrado' });
        }

        return next(err);
      }

      return res.status(201).json({
        id: this.lastID,
        nome,
        email,
        telefone: telefone || null,
        especialidade: especialidade || null,
        role: tipoTrabalho,
      });
    }
  );
});

router.put('/funcionarios/:id', (req, res, next) => {
  const { id } = req.params;
  const { nome, email, telefone, especialidade, role, ativo } = req.body || {};

  const tipoTrabalho = role ? String(role).toUpperCase() : null;

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
});

router.delete('/funcionarios/:id', (req, res, next) => {
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

module.exports = router;
