/**
 * @typedef {'ATIVO' | 'DESATIVADO' | 'CANCELADO'} CardStatus
 * @typedef {'RELATORIO' | 'AVISO' | 'COMUNICADO'} ReportType
 * @typedef {'ADMIN' | 'CLIENTES'} ReportVisibility
 *
 * @typedef {Object} AdminCard
 * @property {number} id
 * @property {string} clienteNome
 * @property {string} identificacao
 * @property {CardStatus} status
 * @property {string} criadoEm
 * @property {string} validade
 * @property {string} tipo
 *
 * @typedef {Object} ClientCard
 * @property {number} id
 * @property {string} identificacao
 * @property {CardStatus} status
 * @property {string} criadoEm
 * @property {string} validade
 * @property {string} tipo
 *
 * @typedef {Object} Availability
 * @property {string} data ISO date, YYYY-MM-DD
 * @property {string[]} horarios
 * @property {string} profissional
 *
 * @typedef {Object} AdminReport
 * @property {number} id
 * @property {string} titulo
 * @property {string} conteudo
 * @property {string} autor
 * @property {string} publicadoEm
 * @property {ReportType} tipo
 * @property {ReportVisibility} visibilidade
 */

export const CARD_STATUS = {
  ATIVO: 'ATIVO',
  DESATIVADO: 'DESATIVADO',
  CANCELADO: 'CANCELADO',
};

export const REPORT_TYPES = {
  RELATORIO: 'RELATORIO',
  AVISO: 'AVISO',
  COMUNICADO: 'COMUNICADO',
};

export const REPORT_VISIBILITY = {
  ADMIN: 'ADMIN',
  CLIENTES: 'CLIENTES',
};
