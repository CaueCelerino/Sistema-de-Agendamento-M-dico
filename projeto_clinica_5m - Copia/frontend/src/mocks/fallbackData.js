import { CARD_STATUS, REPORT_TYPES, REPORT_VISIBILITY } from '../types/domain';

export const fallbackAdminCards = [
  {
    id: 1,
    clienteNome: 'João Silva',
    identificacao: 'EV-2026-0001',
    status: CARD_STATUS.ATIVO,
    criadoEm: '2026-01-12',
    validade: '2027-01-12',
    tipo: 'Individual',
  },
  {
    id: 2,
    clienteNome: 'Maria Oliveira',
    identificacao: 'EV-2026-0002',
    status: CARD_STATUS.DESATIVADO,
    criadoEm: '2026-02-03',
    validade: '2027-02-03',
    tipo: 'Familiar',
  },
  {
    id: 3,
    clienteNome: 'Clínica Alfa',
    identificacao: 'EV-2026-0003',
    status: CARD_STATUS.ATIVO,
    criadoEm: '2026-03-18',
    validade: '2027-03-18',
    tipo: 'Empresarial',
  },
  {
    id: 4,
    clienteNome: 'Pedro Santos',
    identificacao: 'EV-2025-0098',
    status: CARD_STATUS.CANCELADO,
    criadoEm: '2025-11-22',
    validade: '2026-11-22',
    tipo: 'Individual',
  },
];

export const fallbackClientCards = [
  {
    id: 1,
    identificacao: 'EV-2026-0001',
    status: CARD_STATUS.ATIVO,
    criadoEm: '2026-01-12',
    validade: '2027-01-12',
    tipo: 'Individual',
  },
  {
    id: 5,
    identificacao: 'EV-2026-0042',
    status: CARD_STATUS.ATIVO,
    criadoEm: '2026-05-10',
    validade: '2027-05-10',
    tipo: 'Dependente',
  },
];

export const fallbackAvailability = [
  { data: '2026-06-03', horarios: ['08:00', '09:30', '14:00'], profissional: 'Dra. Marina' },
  { data: '2026-06-06', horarios: ['10:00', '11:00'], profissional: 'Dr. Carlos' },
  { data: '2026-06-12', horarios: ['08:30', '15:30', '16:30'], profissional: 'Dra. Marina' },
  { data: '2026-06-18', horarios: ['09:00', '13:30'], profissional: 'Dr. Carlos' },
  { data: '2026-06-25', horarios: ['08:00', '10:30', '15:00'], profissional: 'Equipe Clínica' },
];

export const fallbackReports = [
  {
    id: 1,
    titulo: 'Fechamento mensal de atendimentos',
    autor: 'Admin Visual',
    publicadoEm: '2026-06-10',
    tipo: REPORT_TYPES.RELATORIO,
    visibilidade: REPORT_VISIBILITY.ADMIN,
    conteudo: 'Resumo interno de consultas, exames e renovações realizadas no mês.',
  },
  {
    id: 2,
    titulo: 'Comunicado sobre renovação anual',
    autor: 'Coord. Atendimento',
    publicadoEm: '2026-06-14',
    tipo: REPORT_TYPES.COMUNICADO,
    visibilidade: REPORT_VISIBILITY.CLIENTES,
    conteudo: 'Clientes com cartões próximos do vencimento receberão orientações de renovação.',
  },
  {
    id: 3,
    titulo: 'Aviso interno de agenda reduzida',
    autor: 'Gestão Clínica',
    publicadoEm: '2026-06-20',
    tipo: REPORT_TYPES.AVISO,
    visibilidade: REPORT_VISIBILITY.ADMIN,
    conteudo: 'Agenda administrativa reduzida durante treinamento da equipe.',
  },
];

export const fallbackClientNotices = fallbackReports.filter(
  (item) => item.visibilidade === REPORT_VISIBILITY.CLIENTES
);
