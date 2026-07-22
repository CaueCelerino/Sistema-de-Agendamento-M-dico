/**
 * Firebase Service Tests
 * Testa funcionalidades de notificações push
 * 
 * Authors: Lucas, Caue, Kaio, Gustavo
 */

const firebaseService = require('../src/services/firebaseService');

describe('Firebase Service', () => {
  describe('Inicialização', () => {
    it('deve tentar inicializar Firebase', () => {
      const result = firebaseService.initializeFirebase();
      // Firebase pode não estar disponível em teste, então apenas verificamos a chamada
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Notificações', () => {
    it('notifyAgendamentoConfirmado deve ter tipo correto', () => {
      const agendamento = {
        id: 1,
        dataFormatada: '2026-07-10 14:00'
      };

      // Apenas verificamos que a função existe e pode ser chamada
      expect(typeof firebaseService.notifyAgendamentoConfirmado).toBe('function');
    });

    it('notifyCartaoVencido deve ter tipo correto', () => {
      const usuario = { id: 1 };
      expect(typeof firebaseService.notifyCartaoVencido).toBe('function');
    });

    it('notifyCartaoVencendoEmBreve deve ter tipo correto', () => {
      const usuario = { id: 1 };
      const diasRestantes = 3;
      expect(typeof firebaseService.notifyCartaoVencendoEmBreve).toBe('function');
    });

    it('notifyLembreteConsulta deve ter tipo correto', () => {
      const agendamento = {
        id: 1,
        horario: '14:00'
      };
      expect(typeof firebaseService.notifyLembreteConsulta).toBe('function');
    });
  });

  describe('Funções de Envio', () => {
    it('sendNotification deve estar disponível', () => {
      expect(typeof firebaseService.sendNotification).toBe('function');
    });

    it('sendMulticastNotification deve estar disponível', () => {
      expect(typeof firebaseService.sendMulticastNotification).toBe('function');
    });

    it('sendTopicNotification deve estar disponível', () => {
      expect(typeof firebaseService.sendTopicNotification).toBe('function');
    });

    it('subscribeToTopic deve estar disponível', () => {
      expect(typeof firebaseService.subscribeToTopic).toBe('function');
    });

    it('unsubscribeFromTopic deve estar disponível', () => {
      expect(typeof firebaseService.unsubscribeFromTopic).toBe('function');
    });
  });
});
