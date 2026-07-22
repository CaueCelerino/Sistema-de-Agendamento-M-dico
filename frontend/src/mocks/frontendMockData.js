export const mockAdminCards = [
  {
    id: 1,
    cliente: 'João Silva',
    identificacao: 'EV-2026-0001',
    status: 'ATIVO',
    criadoEm: '2026-01-12',
    validade: '2027-01-12',
    tipo: 'Individual',
  },
  {
    id: 2,
    cliente: 'Maria Oliveira',
    identificacao: 'EV-2026-0002',
    status: 'DESATIVADO',
    criadoEm: '2026-02-03',
    validade: '2027-02-03',
    tipo: 'Familiar',
  },
  {
    id: 3,
    cliente: 'Clínica Alfa',
    identificacao: 'EV-2026-0003',
    status: 'ATIVO',
    criadoEm: '2026-03-18',
    validade: '2027-03-18',
    tipo: 'Empresarial',
  },
  {
    id: 4,
    cliente: 'Pedro Santos',
    identificacao: 'EV-2025-0098',
    status: 'CANCELADO',
    criadoEm: '2025-11-22',
    validade: '2026-11-22',
    tipo: 'Individual',
  },
];

export const mockClientCards = [
  {
    id: 1,
    identificacao: 'EV-2026-0001',
    status: 'ATIVO',
    criadoEm: '2026-01-12',
    validade: '2027-01-12',
    tipo: 'Individual',
  },
  {
    id: 5,
    identificacao: 'EV-2026-0042',
    status: 'ATIVO',
    criadoEm: '2026-05-10',
    validade: '2027-05-10',
    tipo: 'Dependente',
  },
];

export const mockAvailability = [
  { date: '2026-06-03', horarios: ['08:00', '09:30', '14:00'], profissional: 'Dra. Marina' },
  { date: '2026-06-06', horarios: ['10:00', '11:00'], profissional: 'Dr. Carlos' },
  { date: '2026-06-12', horarios: ['08:30', '15:30', '16:30'], profissional: 'Dra. Marina' },
  { date: '2026-06-18', horarios: ['09:00', '13:30'], profissional: 'Dr. Carlos' },
  { date: '2026-06-25', horarios: ['08:00', '10:30', '15:00'], profissional: 'Equipe Clínica' },
];

export const mockReports = [
  {
    id: 1,
    titulo: 'Fechamento mensal de atendimentos',
    autor: 'Admin Visual',
    publicadoEm: '2026-06-10',
    tipo: 'Relatório',
    visibilidade: 'ADMIN',
    conteudo: 'Resumo interno de consultas, exames e renovações realizadas no mês.',
  },
  {
    id: 2,
    titulo: 'Comunicado sobre renovação anual',
    autor: 'Coord. Atendimento',
    publicadoEm: '2026-06-14',
    tipo: 'Comunicado',
    visibilidade: 'CLIENTES',
    conteudo: 'Clientes com cartões próximos do vencimento receberão orientações de renovação.',
  },
  {
    id: 3,
    titulo: 'Aviso interno de agenda reduzida',
    autor: 'Gestão Clínica',
    publicadoEm: '2026-06-20',
    tipo: 'Aviso',
    visibilidade: 'ADMIN',
    conteudo: 'Agenda administrativa reduzida durante treinamento da equipe.',
  },
];

export const mockClientNotices = mockReports.filter((item) => item.visibilidade === 'CLIENTES');
