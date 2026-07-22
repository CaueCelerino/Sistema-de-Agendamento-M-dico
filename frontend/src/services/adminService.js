import api from './api';

const adminService = {
  getFuncionarios: async () => {
    const res = await api.get('/admin/funcionarios');
    return res.data;
  },

  createFuncionario: async (payload) => {
    const res = await api.post('/admin/funcionarios', payload);
    return res.data;
  },

  updateFuncionario: async (id, payload) => {
    const res = await api.put(`/admin/funcionarios/${id}`, payload);
    return res.data;
  },

  deleteFuncionario: async (id) => {
    const res = await api.delete(`/admin/funcionarios/${id}`);
    return res.data;
  },

  getAgendamentos: async () => {
    const res = await api.get('/admin/agendamentos');
    return res.data;
  },

  aceitarAgendamento: async (id) => {
    const res = await api.patch(`/admin/agendamentos/${id}/aceitar`);
    return res.data;
  },

  rejeitarAgendamento: async (id) => {
    const res = await api.patch(`/admin/agendamentos/${id}/rejeitar`);
    return res.data;
  },

  requestReagendamento: async (id) => {
    const res = await api.post(`/admin/agendamentos/${id}/solicitar-reagendamento`);
    return res.data;
  },

  marcarCompareceu: async (id) => {
    const res = await api.patch(`/admin/agendamentos/${id}/compareceu`);
    return res.data;
  },

  marcarNaoCompareceu: async (id) => {
    const res = await api.patch(`/admin/agendamentos/${id}/nao-compareceu`);
    return res.data;
  },

  resetarSenhaUsuario: async (id, novaSenha) => {
    const res = await api.put(`/admin/usuarios/${id}/reset-senha`, { novaSenha });
    return res.data;
  },

  getCargos: async () => {
    const res = await api.get('/admin/cargos');
    return res.data;
  },

  createCargo: async (nome) => {
    const res = await api.post('/admin/cargos', { nome });
    return res.data;
  },

  deleteCargo: async (id) => {
    const res = await api.delete(`/admin/cargos/${id}`);
    return res.data;
  },
};

export default adminService;
