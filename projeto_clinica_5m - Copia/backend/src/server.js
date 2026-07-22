/**
 * PROJETO 5M - CLÍNICA
 * Backend API Server
 * 
 * Authors: Lucas, Caue, Kaio, Gustavo
 * Created: 12/06/2026
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('express-async-errors');

const authRoutes = require('./routes/auth');
const cartoesRoutes = require('./routes/cartoes');
const usuariosRoutes = require('./routes/usuarios');
const agendamentosRoutes = require('./routes/agendamentos');
const adminRoutes = require('./routes/admin');
const notificacoesRoutes = require('./routes/notificacoes');
const { requireAuth } = require('./middleware/auth');

// Middleware
const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);

app.use('/api/usuarios', requireAuth, usuariosRoutes);
app.use('/api/agendamentos', requireAuth, agendamentosRoutes);
app.use('/api/admin', requireAuth, adminRoutes);
app.use('/api/cartoes', requireAuth, cartoesRoutes);
app.use('/api/notificacoes', requireAuth, notificacoesRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Projeto 5M - API Backend Clínica',
    timestamp: new Date().toISOString(),
    authors: ['Lucas', 'Caue', 'Kaio', 'Gustavo']
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

function startServer(port = process.env.PORT || 3000) {
  return app.listen(port, () => {
    console.log(`✅ Servidor rodando em http://localhost:${port}`);
    console.log(`📝 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`👥 Autores: Lucas, Caue, Kaio, Gustavo`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
