/**
 * Firebase Service
 * Gerencia notificações push via Firebase Cloud Messaging
 * 
 * Authors: Lucas, Caue, Kaio, Gustavo
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let firebaseInitialized = false;

/**
 * Inicializa Firebase Admin SDK
 */
function initializeFirebase() {
  if (firebaseInitialized) {
    return;
  }

  try {
    // Verificar se credenciais existem como variável de ambiente
    if (process.env.FIREBASE_CONFIG) {
      const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
      admin.initializeApp({
        credential: admin.credential.cert(firebaseConfig),
      });
    } else {
      // Tentar carregar do arquivo local (desenvolvimento)
      const credentialsPath = path.join(__dirname, '../../firebase-config.json');
      if (fs.existsSync(credentialsPath)) {
        const serviceAccount = require(credentialsPath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else {
        console.warn('⚠️  Firebase não inicializado: arquivo de credenciais não encontrado');
        return false;
      }
    }
    
    firebaseInitialized = true;
    console.log('✅ Firebase inicializado com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase:', error.message);
    return false;
  }
}

/**
 * Envia notificação push para um dispositivo
 * @param {string} deviceToken - Token do dispositivo
 * @param {object} notification - Objeto com title e body
 * @param {object} data - Dados adicionais
 */
async function sendNotification(deviceToken, notification, data = {}) {
  if (!firebaseInitialized) {
    console.warn('Firebase não está inicializado');
    return null;
  }

  try {
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        ...data,
        timestamp: new Date().toISOString(),
      },
      token: deviceToken,
    };

    const response = await admin.messaging().send(message);
    console.log(`✅ Notificação enviada com sucesso: ${response}`);
    return response;
  } catch (error) {
    console.error('❌ Erro ao enviar notificação:', error.message);
    return null;
  }
}

/**
 * Envia notificação para múltiplos dispositivos
 * @param {array} deviceTokens - Array de tokens
 * @param {object} notification - Notificação
 * @param {object} data - Dados adicionais
 */
async function sendMulticastNotification(deviceTokens, notification, data = {}) {
  if (!firebaseInitialized) {
    console.warn('Firebase não está inicializado');
    return null;
  }

  try {
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        ...data,
        timestamp: new Date().toISOString(),
      },
    };

    const response = await admin.messaging().sendMulticast({
      ...message,
      tokens: deviceTokens,
    });

    console.log(`✅ ${response.successCount} notificações enviadas com sucesso`);
    console.log(`❌ ${response.failureCount} notificações falharam`);
    
    return response;
  } catch (error) {
    console.error('❌ Erro ao enviar notificações em massa:', error.message);
    return null;
  }
}

/**
 * Envia notificação por tópico
 * @param {string} topic - Nome do tópico
 * @param {object} notification - Notificação
 * @param {object} data - Dados adicionais
 */
async function sendTopicNotification(topic, notification, data = {}) {
  if (!firebaseInitialized) {
    console.warn('Firebase não está inicializado');
    return null;
  }

  try {
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        ...data,
        timestamp: new Date().toISOString(),
      },
      topic: topic,
    };

    const response = await admin.messaging().send(message);
    console.log(`✅ Notificação de tópico enviada: ${response}`);
    return response;
  } catch (error) {
    console.error('❌ Erro ao enviar notificação de tópico:', error.message);
    return null;
  }
}

/**
 * Subscreve um dispositivo a um tópico
 * @param {array} deviceTokens - Array de tokens
 * @param {string} topic - Nome do tópico
 */
async function subscribeToTopic(deviceTokens, topic) {
  if (!firebaseInitialized) {
    console.warn('Firebase não está inicializado');
    return null;
  }

  try {
    const response = await admin.messaging().subscribeToTopic(deviceTokens, topic);
    console.log(`✅ Dispositivos inscritos no tópico "${topic}"`);
    return response;
  } catch (error) {
    console.error('❌ Erro ao inscrever em tópico:', error.message);
    return null;
  }
}

/**
 * Desinscreve um dispositivo de um tópico
 * @param {array} deviceTokens - Array de tokens
 * @param {string} topic - Nome do tópico
 */
async function unsubscribeFromTopic(deviceTokens, topic) {
  if (!firebaseInitialized) {
    console.warn('Firebase não está inicializado');
    return null;
  }

  try {
    const response = await admin.messaging().unsubscribeFromTopic(deviceTokens, topic);
    console.log(`✅ Dispositivos desinscritos do tópico "${topic}"`);
    return response;
  } catch (error) {
    console.error('❌ Erro ao desinscrever de tópico:', error.message);
    return null;
  }
}

/**
 * Envia notificação de agendamento confirmado
 */
async function notifyAgendamentoConfirmado(deviceToken, agendamento) {
  const notification = {
    title: '✅ Agendamento Confirmado',
    body: `Sua consulta foi marcada para ${agendamento.dataFormatada}`,
  };

  const data = {
    type: 'agendamento_confirmado',
    agendamentoId: agendamento.id.toString(),
    data: agendamento.dataFormatada,
  };

  return await sendNotification(deviceToken, notification, data);
}

/**
 * Envia notificação de cartão vencido
 */
async function notifyCartaoVencido(deviceToken, usuario) {
  const notification = {
    title: '⚠️ Cartão Vencido',
    body: `Seu cartão de acesso expirou. Renove para continuar usando nossos serviços.`,
  };

  const data = {
    type: 'cartao_vencido',
    usuarioId: usuario.id.toString(),
  };

  return await sendNotification(deviceToken, notification, data);
}

/**
 * Envia notificação de cartão vencendo em breve
 */
async function notifyCartaoVencendoEmBreve(deviceToken, usuario, diasRestantes) {
  const notification = {
    title: '⏰ Cartão Vencendo em Breve',
    body: `Seu cartão vence em ${diasRestantes} dias. Renove agora!`,
  };

  const data = {
    type: 'cartao_vencendo',
    usuarioId: usuario.id.toString(),
    diasRestantes: diasRestantes.toString(),
  };

  return await sendNotification(deviceToken, notification, data);
}

/**
 * Envia notificação de lembrete de consulta
 */
async function notifyLembreteConsulta(deviceToken, agendamento, horasAntes = 24) {
  const notification = {
    title: '🔔 Lembrete de Consulta',
    body: `Você tem uma consulta marcada para amanhã às ${agendamento.horario}`,
  };

  const data = {
    type: 'lembrete_consulta',
    agendamentoId: agendamento.id.toString(),
    horario: agendamento.horario,
  };

  return await sendNotification(deviceToken, notification, data);
}

/**
 * Envia notificação para todos os clientes sobre promoção/notícia
 */
async function notifyAllClients(notification, data = {}) {
  return await sendTopicNotification('clientes', notification, data);
}

module.exports = {
  initializeFirebase,
  sendNotification,
  sendMulticastNotification,
  sendTopicNotification,
  subscribeToTopic,
  unsubscribeFromTopic,
  notifyAgendamentoConfirmado,
  notifyCartaoVencido,
  notifyCartaoVencendoEmBreve,
  notifyLembreteConsulta,
  notifyAllClients,
};
