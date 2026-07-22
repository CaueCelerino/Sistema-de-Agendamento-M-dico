const express = require('express');
const db = require('../config/db');
const { isAdminRole } = require('../utils/authz');

const router = express.Router();

router.get('/', (req, res, next) => {
  const admin = isAdminRole(req.auth.role);

  const query = `
    SELECT
      a.id,
      a.usuario_id,
      a.cartao_id,
      a.funcionario_id,
      a.tipo,
      a.data_agendamento AS data,
      a.horario_agendamento AS horario,
      a.status,
      a.descricao,
      a.observacoes,
      f.nome AS funcionario,
      f.especialidade AS funcionario_especialidade
    FROM agendamentos a
    LEFT JOIN funcionarios f ON f.id = a.funcionario_id
    ${admin ? '' : 'WHERE a.usuario_id = ?'}
    ORDER BY a.data_agendamento DESC, a.horario_agendamento DESC
  `;

  const params = admin ? [] : [req.auth.userId];

  db.all(query, params, (err, rows) => {
    if (err) return next(err);
    return res.json({ agendamentos: rows || [] });
  });
});

router.post('/', (req, res, next) => {
  const { cartao_id, funcionario_id, tipo, data, horario, descricao, observacoes } = req.body || {};
  const resolvedTipo = String(tipo || 'CONSULTA').toUpperCase();

  if (!data || !horario) {
    return res.status(400).json({ error: 'data e horario são obrigatórios' });
  }

  db.get('SELECT id FROM cartoes WHERE usuario_id = ? ORDER BY id LIMIT 1', [req.auth.userId], (cardErr, cardRow) => {
    if (cardErr) return next(cardErr);

    db.get('SELECT id FROM funcionarios WHERE ativo = 1 ORDER BY id LIMIT 1', (funcErr, funcRow) => {
      if (funcErr) return next(funcErr);

      const resolvedCardId = cartao_id || cardRow?.id || 1;
      const resolvedFuncionarioId = funcionario_id || funcRow?.id || 1;

      db.run(
        'INSERT INTO agendamentos (usuario_id, cartao_id, funcionario_id, tipo, data_agendamento, horario_agendamento, descricao, observacoes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [req.auth.userId, resolvedCardId, resolvedFuncionarioId, resolvedTipo, data, horario, descricao || null, observacoes || null, 'PENDENTE'],
        function insertAppointment(err) {
          if (err) return next(err);

          return res.status(201).json({
            id: this.lastID,
            usuario_id: req.auth.userId,
            cartao_id: resolvedCardId,
            funcionario_id: resolvedFuncionarioId,
            tipo: resolvedTipo,
            data,
            horario,
            descricao: descricao || null,
            observacoes: observacoes || null,
            status: 'PENDENTE',
          });
        }
      );
    });
  });
});

router.get('/disponibilidades', (req, res, next) => {
  const month = req.query.mes || new Date().toISOString().slice(0, 7);

  db.all(
    `SELECT a.id, a.funcionario_id, a.data_agenda AS data, a.horario_inicio AS horario, a.horario_fim, a.disponivel, f.nome AS funcionario, f.especialidade
     FROM agendas a
     LEFT JOIN funcionarios f ON f.id = a.funcionario_id
     WHERE a.data_agenda LIKE ? AND a.disponivel = 1
     ORDER BY a.data_agenda, a.horario_inicio`,
    [`${month}%`],
    (err, rows) => {
      if (err) return next(err);

      // agrupamos por data e também por profissional dentro da data
      const grouped = new Map();

      (rows || []).forEach((row) => {
        const key = row.data;
        if (!grouped.has(key)) {
          grouped.set(key, { data: row.data, horarios: [], porProfissionais: {} });
        }

        const entry = grouped.get(key);

        // horários agregados
        entry.horarios.push(row.horario);

        // por profissional
        const pid = row.funcionario_id || 'equipe';
        if (!entry.porProfissionais[pid]) {
          entry.porProfissionais[pid] = {
            funcionario_id: row.funcionario_id || null,
            funcionario: row.funcionario || 'Equipe Clínica',
            especialidade: row.especialidade || null,
            horarios: [],
          };
        }

        entry.porProfissionais[pid].horarios.push(row.horario);
      });

      const disponibilidades = Array.from(grouped.values()).map((item) => ({
        data: item.data,
        horarios: Array.from(new Set(item.horarios)).sort(),
        porProfissionais: Object.values(item.porProfissionais).map((p) => ({
          funcionario_id: p.funcionario_id,
          funcionario: p.funcionario,
          especialidade: p.especialidade,
          horarios: Array.from(new Set(p.horarios)).sort(),
        })),
      }));

      return res.json({ disponibilidades });
    }
  );
});

router.post('/disponibilidades', (req, res, next) => {
  // Contrato novo (opcional): { data, disponibilidadesPorMedico: [{ funcionario_id, horarios: [] }] }
  // Contrato antigo: { data, horarios: [], profissional, funcionario_id }
  const { data, horarios, profissional, funcionario_id, disponibilidadesPorMedico } = req.body || {};


  if (!isAdminRole(req.auth.role)) {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }

  const hasNewPayload = Array.isArray(disponibilidadesPorMedico);

  // NOVO CONTRATO: disponibilidadesPorMedico (recomendado)
  if (hasNewPayload) {
    if (!data) {
      return res.status(400).json({ error: 'data é obrigatória' });
    }

    const normalized = disponibilidadesPorMedico
      .filter((item) => item && item.funcionario_id && Array.isArray(item.horarios) && item.horarios.length > 0)
      .map((item) => ({
        funcionario_id: Number(item.funcionario_id),
        horarios: Array.from(new Set(item.horarios)).sort(),
      }));

    if (normalized.length === 0) {
      return res.status(400).json({ error: 'disponibilidadesPorMedico deve conter pelo menos 1 médico com horários' });
    }

    // Ao adicionar disponibilidades para uma data já existente, apenas inserimos as novas entradas
    // (INSERT OR IGNORE evita duplicatas graças à constraint UNIQUE(funcionario_id, data_agenda, horario_inicio)).
    db.serialize(() => {
      const stmt = db.prepare(
        'INSERT OR IGNORE INTO agendas (funcionario_id, data_agenda, horario_inicio, horario_fim, intervalo_minutos, disponivel) VALUES (?, ?, ?, ?, ?, ?)' 
      );

      normalized.forEach(({ funcionario_id: resolvedFuncionarioId, horarios }) => {
        horarios.forEach((horario) => {
          stmt.run(resolvedFuncionarioId, data, horario, horario, 30, 1);
        });
      });

      stmt.finalize((finalizeErr) => {
        if (finalizeErr) return next(finalizeErr);
        return res.status(201).json({ data, disponibilidadesPorMedico: normalized });
      });
    });

    return;
  }

  // CONTRATO ANTIGO: { horarios: string[], funcionario_id?: number }
  if (!data || !Array.isArray(horarios) || horarios.length === 0) {
    return res.status(400).json({ error: 'data e horarios são obrigatórios' });
  }

  db.get('SELECT id FROM funcionarios WHERE ativo = 1 ORDER BY id LIMIT 1', (funcErr, funcRow) => {
    if (funcErr) return next(funcErr);

    const resolvedFuncionarioId = funcionario_id || funcRow?.id || 1;

    // Inserimos apenas novos horários, sem apagar os já existentes para a data
    db.serialize(() => {
      const stmt = db.prepare(
        'INSERT OR IGNORE INTO agendas (funcionario_id, data_agenda, horario_inicio, horario_fim, intervalo_minutos, disponivel) VALUES (?, ?, ?, ?, ?, ?)' 
      );

      horarios.forEach((horario) => {
        stmt.run(resolvedFuncionarioId, data, horario, horario, 30, 1);
      });

      stmt.finalize((finalizeErr) => {
        if (finalizeErr) return next(finalizeErr);
        return res.status(201).json({ data, horarios, profissional: profissional || 'Equipe Clínica' });
      });
    });
  });
});

router.delete('/disponibilidades/:data', (req, res, next) => {
  if (!isAdminRole(req.auth.role)) {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }

  db.run('DELETE FROM agendas WHERE data_agenda = ?', [req.params.data], function deleteAvailability(err) {
    if (err) return next(err);
    return res.json({ data: req.params.data, removed: true });
  });
});

// DELETE com filtro por profissional e horários específicos
router.post('/disponibilidades/:data/remover-horarios', (req, res, next) => {
  if (!isAdminRole(req.auth.role)) {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }

  const { data } = req.params;
  const { funcionario_id, horarios } = req.body || {};

  if (!funcionario_id || !Array.isArray(horarios) || horarios.length === 0) {
    return res.status(400).json({ error: 'funcionario_id e horarios[] são obrigatórios' });
  }

  db.serialize(() => {
    const stmt = db.prepare('DELETE FROM agendas WHERE data_agenda = ? AND funcionario_id = ? AND horario_inicio = ?');
    
    horarios.forEach((horario) => {
      stmt.run(data, funcionario_id, horario);
    });

    stmt.finalize((finalizeErr) => {
      if (finalizeErr) return next(finalizeErr);
      return res.json({ data, funcionario_id, horarios, removed: true });
    });
  });
});

// Retorna horários por profissional para uma data específica (rota compatível com frontend)
router.get('/disponibilidades/:data/horarios-profissionais', (req, res, next) => {
  const { data } = req.params;

  db.all(
    `SELECT a.funcionario_id, f.nome AS funcionario, f.especialidade, a.horario_inicio AS horario
     FROM agendas a
     LEFT JOIN funcionarios f ON f.id = a.funcionario_id
     WHERE a.data_agenda = ? AND a.disponivel = 1
     ORDER BY a.funcionario_id, a.horario_inicio`,
    [data],
    (err, rows) => {
      if (err) return next(err);

      const grouped = new Map();
      (rows || []).forEach((r) => {
        const pid = r.funcionario_id || 'equipe';
        if (!grouped.has(pid)) {
          grouped.set(pid, { funcionario_id: r.funcionario_id, funcionario: r.funcionario || 'Equipe Clínica', especialidade: r.especialidade || null, horarios: [] });
        }

        grouped.get(pid).horarios.push(r.horario);
      });

      return res.json({ horariosPorProfissional: Array.from(grouped.values()).map((p) => ({ ...p, horarios: Array.from(new Set(p.horarios)).sort() })) });
    }
  );
});

router.get('/disponibilidades/:data/horarios', (req, res, next) => {
  const { data } = req.params;

  db.all(
    `SELECT a.id, a.funcionario_id, a.data_agenda AS data, a.horario_inicio AS horario, f.nome AS funcionario
     FROM agendas a
     LEFT JOIN funcionarios f ON f.id = a.funcionario_id
     WHERE a.data_agenda = ? AND a.disponivel = 1
     ORDER BY a.horario_inicio`,
    [data],
    (err, rows) => {
      if (err) return next(err);
      return res.json({ horarios: rows || [] });
    }
  );
});

router.post('/solicitacoes', (req, res, next) => {
  const { tipo, data, horario, descricao, observacoes } = req.body || {};

  if (!data || !horario) {
    return res.status(400).json({ error: 'data e horario são obrigatórios' });
  }

  const resolvedTipo = String(tipo || 'CONSULTA').toUpperCase();

  db.run(
    'INSERT INTO agendamentos (usuario_id, cartao_id, funcionario_id, tipo, data_agendamento, horario_agendamento, descricao, observacoes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [req.auth.userId, 1, 1, resolvedTipo, data, horario, descricao || null, observacoes || null, 'PENDENTE'],
    function insertSolicitacao(err) {
      if (err) return next(err);

      return res.status(201).json({
        id: this.lastID,
        status: 'PENDENTE',
        mensagem: 'Solicitação recebida com sucesso',
      });
    }
  );
});

module.exports = router;
