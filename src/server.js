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

// Firebase
const firebaseService = require('./services/firebaseService');

const authRoutes = require('./routes/auth');
const cartoesRoutes = require('./routes/cartoes');
const usuariosRoutes = require('./routes/usuarios');
const agendamentosRoutes = require('./routes/agendamentos');
const adminRoutes = require('./routes/admin');
const notificacoesRoutes = require('./routes/notificacoes');
const relatoriosRoutes = require('./routes/relatorios');
const { requireAuth } = require('./middleware/auth');
const path = require('path');

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
app.use('/api/relatorios', relatoriosRoutes);

// Serve static mobile build artifacts placed in backend/public/mobile
app.use('/mobile', express.static(path.join(__dirname, '..', 'public', 'mobile')));

// API endpoint that returns mobile download links (APK and iOS zip) based on host
app.get('/api/mobile/links', (req, res) => {
  const host = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
  const apk = `${host.replace(/\/$/, '')}/mobile/app.apk`;
  const ios = `${host.replace(/\/$/, '')}/mobile/app-ios.zip`;
  res.json({ apk, ios });
});

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
  // Inicializar Firebase
  firebaseService.initializeFirebase();

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
