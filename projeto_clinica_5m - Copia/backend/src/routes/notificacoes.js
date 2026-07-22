const express = require('express');
const db = require('../config/db');
const { requireAuth } = require('../middleware/auth');

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

module.exports = router;
