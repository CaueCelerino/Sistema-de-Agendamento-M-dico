const express = require('express');
const db = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const firebaseService = require('../services/firebaseService');

const router = express.Router();

router.use(requireAuth);

// GET /api/notificacoes - Lista notificações do usuário autenticado
router.get('/', (req, res, next) => {
  const query = `
    SELECT id, titulo, mensagem, tipo, enviada, lida, created_at, canal
    FROM notificacoes
    WHERE usuario_id = ?
    ORDER BY created_at DESC
  `;

  db.all(query, [req.auth.userId], (err, rows) => {
    if (err) return next(err);
    return res.json({ notificacoes: rows || [], avisos: rows || [] });
  });
});

// PATCH /api/notificacoes/:id/marcar-lida - Marca notificação como lida
router.patch('/:id/marcar-lida', (req, res, next) => {
  db.run(
    'UPDATE notificacoes SET lida = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND usuario_id = ?',
    [req.params.id, req.auth.userId],
    function updateNotification(err) {
      if (err) return next(err);
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Notificação não encontrada' });
      }
      return res.json({ message: 'Notificação marcada como lida', id: Number(req.params.id) });
    }
  );
});

// POST /api/notificacoes/device-token - Registra token do dispositivo
router.post('/device-token', (req, res, next) => {
  const { deviceToken, plataforma } = req.body;

  if (!deviceToken) {
    return res.status(400).json({ error: 'deviceToken é obrigatório' });
  }

  // Salvar token no banco de dados
  db.run(
    `INSERT OR REPLACE INTO device_tokens (usuario_id, token, plataforma, ativo, created_at)
     VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)`,
    [req.auth.userId, deviceToken, plataforma || 'mobile'],
    function(err) {
      if (err) return next(err);
      
      // Inscrever no tópico geral de clientes
      firebaseService.subscribeToTopic([deviceToken], 'clientes').catch(console.error);
      
      return res.json({ 
        message: 'Token do dispositivo registrado com sucesso',
        deviceTokenId: this.lastID 
      });
    }
  );
});

// POST /api/notificacoes/test-push - Envia notificação de teste
router.post('/test-push', (req, res, next) => {
  const { deviceToken } = req.body;

  if (!deviceToken) {
    return res.status(400).json({ error: 'deviceToken é obrigatório' });
  }

  firebaseService.sendNotification(
    deviceToken,
    {
      title: '🧪 Teste de Notificação',
      body: 'Esta é uma notificação de teste do sistema Espaço Vida',
    },
    { type: 'test' }
  ).then(result => {
    if (result) {
      return res.json({ 
        message: 'Notificação de teste enviada com sucesso',
        messageId: result 
      });
    } else {
      return res.status(500).json({ error: 'Falha ao enviar notificação' });
    }
  }).catch(next);
});

module.exports = router;
