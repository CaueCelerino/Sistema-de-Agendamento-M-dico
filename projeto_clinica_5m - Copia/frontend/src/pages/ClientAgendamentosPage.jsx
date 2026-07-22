import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/layout/Layout';
import CalendarMonth from '../components/ui/CalendarMonth';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import {
  listClientAvailability,
  requestAppointment,
} from '../services/agendaDisponibilidadeService';
import { listClientNotices } from '../services/relatoriosService';
import { getAgendamentos } from '../services/agendamentosService';

function ClientAgendamentosPage() {
  const [availability, setAvailability] = useState([]);
  const [notices, setNotices] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedHour, setSelectedHour] = useState('');
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);
  const [noticeDetail, setNoticeDetail] = useState(null);
  const [isMobileSchedule, setIsMobileSchedule] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

  function extractReagendamentoPayload(message = '') {
    const marker = '__REAGENDAR__';
    if (!message.includes(marker)) return null;

    const payloadText = message.split(marker)[1]?.trim();
    if (!payloadText) return null;

    try {
      return JSON.parse(payloadText);
    } catch {
      return null;
    }
  }

  function formatNoticeText(message = '') {
    const marker = '__REAGENDAR__';
    if (!message.includes(marker)) return message;
    return message.split(marker)[0].trim();
  }

  function isSurveyNotice(message = '') {
    return /pesquisa de satisfa\u00E7\u00E3o|pesquisa de satisfacao|pesquisa/i.test(message);
  }

  function isPendingReagendamentoForAppointment(item, notice) {
    const payload = extractReagendamentoPayload(notice?.mensagem || '');
    if (!payload) return false;

    // Normaliza os dados do agendamento
    const appointmentDate = String(item.data || item.data_agendamento || '').trim();
    const appointmentTime = String(item.horario || item.horario_agendamento || '').trim();
    const appointmentProfessionalId = item.funcionario_id != null ? Number(item.funcionario_id) : null;

    // Normaliza os dados do payload
    const payloadDate = String(payload.data || '').trim();
    const payloadTime = String(payload.horario || '').trim();
    const payloadProfId = payload.funcionarioId != null ? Number(payload.funcionarioId) : null;

    // Comparação
    const dateMatch = appointmentDate === payloadDate;
    const timeMatch = appointmentTime === payloadTime;
    const profMatch = payloadProfId ? appointmentProfessionalId === payloadProfId : true;

    return dateMatch && timeMatch && profMatch;
  }

  async function handleReagendarNotice(notice) {
    const payload = extractReagendamentoPayload(notice?.mensagem || '');
    if (!payload) {
      setError('Não foi possível abrir o reagendamento neste momento.');
      return;
    }

    try {
      const months = [monthKey];
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonthIndex = currentDate.getMonth();

      for (let offset = 1; offset <= 3; offset += 1) {
        const next = new Date(currentYear, currentMonthIndex + offset, 1);
        months.push(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
      }

      const combined = [];
      for (const entry of months) {
        const response = await listClientAvailability({ mes: entry });
        combined.push(...(response.disponibilidades || []));
      }

      const today = currentDate.toISOString().slice(0, 10);
      const targetProfessionalId = payload.funcionarioId ? Number(payload.funcionarioId) : null;
      const candidate = combined
        .filter((item) => String(item.data) >= String(today))
        .flatMap((item) => {
          const professionals = item.porProfissionais || [];
          const matchingProfessionals = targetProfessionalId
            ? professionals.filter((prof) => Number(prof.funcionario_id) === targetProfessionalId)
            : professionals;

          return matchingProfessionals.map((prof) => ({
            data: item.data,
            horario: (prof.horarios || [])[0] || (item.horarios || [])[0] || '',
            funcionario_id: prof.funcionario_id,
            funcionario: prof.funcionario,
            especialidade: prof.especialidade,
          })).filter((entry) => entry.horario);
        })
        .sort((a, b) => a.data.localeCompare(b.data) || a.horario.localeCompare(b.horario))[0];

      if (!candidate) {
        setSuccessMessage('Ainda não há disponibilidade próxima para esse profissional.');
        return;
      }

      setCurrentMonth(new Date(`${candidate.data.slice(0, 4)}-${candidate.data.slice(5, 7)}-01`));
      setSelectedDate(candidate.data);
      setSelectedProfessional(targetProfessionalId || Number(candidate.funcionario_id));
      setSelectedHour(candidate.horario);
      setShowScheduleModal(Boolean(isMobileSchedule));
      setSuccessMessage(`A próxima disponibilidade para ${payload.profissional || 'o profissional'} foi aberta na agenda.`);
      setError('');
    } catch (err) {
      setError('Não foi possível abrir a próxima disponibilidade para reagendamento.');
      console.error(err);
    }
  }

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [availabilityData, noticesData, agendamentosData] = await Promise.all([
          listClientAvailability({ mes: monthKey }),
          listClientNotices(),
          getAgendamentos(),
        ]);
        setAvailability(availabilityData.disponibilidades || []);
        setNotices(noticesData.avisos || []);
        setAgendamentos(agendamentosData.agendamentos || []);
        setUsingFallback(Boolean(availabilityData.usingFallback || noticesData.usingFallback));
      } catch {
        setError('Não foi possível carregar agenda e avisos.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [monthKey]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateMode = () => {
      const isMobile = mediaQuery.matches;
      setIsMobileSchedule(isMobile);
      if (!isMobile) {
        setShowScheduleModal(false);
      }
    };

    updateMode();
    mediaQuery.addEventListener('change', updateMode);
    return () => mediaQuery.removeEventListener('change', updateMode);
  }, []);

  const selectedAvailability = useMemo(
    () => availability.find((item) => item.data === selectedDate),
    [availability, selectedDate]
  );

  const filteredHorarios = useMemo(() => {
    if (!selectedAvailability) return [];
    if (!selectedProfessional) return selectedAvailability.horarios || [];
    
    // Se um médico foi selecionado, mostrar apenas seus horários
    const prof = selectedAvailability.porProfissionais?.find(p => p.funcionario_id === selectedProfessional);
    return prof?.horarios || [];
  }, [selectedAvailability, selectedProfessional]);

  async function handleRequestAppointment() {
    if (!selectedHour || !selectedDate) return;
    try {
      await requestAppointment({ 
        tipo: 'CONSULTA', 
        data: selectedDate, 
        horario: selectedHour,
        funcionario_id: selectedProfessional
      });
      setSuccessMessage('Agendamento solicitado com sucesso. Verifique seus agendamentos.');
      setSelectedHour('');
      setSelectedProfessional(null);
      setShowScheduleModal(false);
    } catch (error) {
      const message = error?.response?.data?.error || 'Falha ao solicitar agendamento. Tente novamente.';
      setError(message);
    }
  }

  function handleSelectDate(date) {
    const availabilityForDate = availability.find((item) => item.data === date);
    setSelectedDate(date);
    setSelectedHour('');
    setSelectedProfessional(null);
    setShowScheduleModal(Boolean(isMobileSchedule && availabilityForDate));
  }

  function handleMonthChange(offset) {
    setCurrentMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
    setSelectedDate('');
    setSelectedHour('');
    setSelectedProfessional(null);
  }

  function handleCloseScheduleModal() {
    setShowScheduleModal(false);
    setSelectedHour('');
  }

  return (
    <Layout>
      <div className="page-container">
        <section className="hero-card">
          <h1>Meus Agendamentos</h1>
          <p>Visualize seus agendamentos atuais, pendências e agende novas consultas.</p>
        </section>

        {usingFallback && (
          <p className="fallback-note">
            Dados temporários. Aguardando integração com servidor.
          </p>
        )}
        {error && <p className="text-error">{error}</p>}

        {/* SEÇÃO: AGENDAMENTOS ATUAIS DO CLIENTE */}
        {!loading && agendamentos.length > 0 && (
          <section className="hero-card" style={{ marginBottom: '1.5rem' }}>
            <h3>Seus agendamentos</h3>
            <div className="hero-grid" style={{ gap: '1rem' }}>
              {agendamentos.map((item) => {
                const pendingReagendamento = notices.some((notice) => isPendingReagendamentoForAppointment(item, notice));
                const reagendamentoNotice = notices.find((notice) => isPendingReagendamentoForAppointment(item, notice));
                return (
                  <Card key={item.id} title={item.funcionario || 'Agendamento'}>
                    <p><strong>Data:</strong> {item.data || item.data_agendamento || '—'}</p>
                    <p><strong>Horário:</strong> {item.horario || item.horario_agendamento || '—'}</p>
                    <p><strong>Tipo:</strong> {item.tipo || '—'}</p>
                    {item.funcionario_especialidade && (
                      <p><strong>Especialidade:</strong> {item.funcionario_especialidade}</p>
                    )}
                    {!pendingReagendamento && (
                      <Badge
                        text={item.status === 'REALIZADO' ? 'REALIZADA' : item.status || 'Pendente'}
                        variant={
                          item.status === 'REALIZADO'
                            ? 'success'
                            : item.status === 'CANCELADO'
                            ? 'danger'
                            : item.status === 'AGENDADO'
                            ? 'info'
                            : item.status === 'NAO_COMPARECEU'
                            ? 'warning'
                            : 'warning'
                        }
                      />
                    )}
                    {pendingReagendamento && (
                      <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '4px' }}>
                        <p style={{ color: '#dc2626', fontWeight: 600, marginBottom: '0.5rem' }}>
                          ⚠️ Solicitação de re-agendamento
                        </p>
                        <p style={{ fontSize: '0.9rem', color: '#7f1d1d', marginBottom: '0.75rem' }}>
                          A equipe solicitou um ajuste nesse agendamento. Por favor, reagende para a próxima disponibilidade.
                        </p>
                        {reagendamentoNotice && (
                          <button
                            className="button button-primary"
                            type="button"
                            onClick={() => handleReagendarNotice(reagendamentoNotice)}
                            style={{ width: '100%' }}
                          >
                            Reagendar agora
                          </button>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* SEÇÃO: NOVO AGENDAMENTO */}
        <section className="hero-card">
          <h3>Agendar nova consulta</h3>
        </section>

        {loading ? (
          <div className="hero-grid">
            <Card title="Carregando">
              <p>Carregando disponibilidades...</p>
            </Card>
          </div>
        ) : (
          <>
            {successMessage && <p className="form-success">{successMessage}</p>}
            <div className="calendar-layout">
              <CalendarMonth
                availability={availability}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
                year={currentMonth.getFullYear()}
                month={currentMonth.getMonth()}
                onMonthChange={handleMonthChange}
              />
              <aside className="side-panel client-schedule-panel">
                <h3>Detalhes do agendamento</h3>
                {!selectedDate && <p>Selecione um dia destacado no calendário.</p>}
                {selectedDate && !selectedAvailability && <p>Este dia não possui horários disponíveis.</p>}
                {selectedAvailability && (
                  <>
                    <p><strong>Data:</strong> {selectedDate}</p>
                    
                    {/* Seletor de profissional */}
                    {selectedAvailability.porProfissionais && selectedAvailability.porProfissionais.length > 1 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                          Selecione o profissional:
                        </label>
                        <select
                          value={selectedProfessional || ''}
                          onChange={(e) => {
                            const val = e.target.value ? Number(e.target.value) : null;
                            setSelectedProfessional(val);
                            setSelectedHour('');
                          }}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                            fontSize: '1rem'
                          }}
                        >
                          <option value="">Qualquer profissional</option>
                          {selectedAvailability.porProfissionais.map((prof) => (
                            <option key={prof.funcionario_id} value={prof.funcionario_id}>
                              {prof.funcionario}{prof.especialidade ? ` (${prof.especialidade})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {/* Horários disponíveis */}
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Horários disponíveis:
                      </label>
                      <div className="schedule-slot-list">
                        {filteredHorarios.length > 0 ? (
                          filteredHorarios.map((horario) => (
                            <button
                              className={`slot-chip ${selectedHour === horario ? 'slot-chip-selected' : ''}`}
                              key={horario}
                              type="button"
                              onClick={() => setSelectedHour(horario)}
                            >
                              {horario}
                            </button>
                          ))
                        ) : (
                          <p>Nenhum horário disponível para esta data e profissional.</p>
                        )}
                      </div>
                    </div>

                    <button
                      className="button button-primary appointment-start-button"
                      type="button"
                      disabled={!selectedHour}
                      onClick={handleRequestAppointment}
                    >
                      Confirmar agendamento
                    </button>
                  </>
                )}
              </aside>
            </div>
          </>
        )}

        <Modal
          isOpen={Boolean(showScheduleModal && selectedAvailability)}
          title={selectedDate ? `Agendamento para ${selectedDate}` : 'Horários disponíveis'}
          onClose={handleCloseScheduleModal}
          onSubmit={handleRequestAppointment}
          submitLabel="Confirmar agendamento"
          submitDisabled={!selectedHour}
          className="mobile-schedule-modal"
        >
          {selectedAvailability && (
            <div className="mobile-schedule-content">
              <p><strong>Data:</strong> {selectedDate}</p>
              
              {selectedAvailability.porProfissionais && selectedAvailability.porProfissionais.length > 1 && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Profissional:
                  </label>
                  <select
                    value={selectedProfessional || ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      setSelectedProfessional(val);
                      setSelectedHour('');
                    }}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      border: '1px solid #ccc',
                    }}
                  >
                    <option value="">Qualquer profissional</option>
                    {selectedAvailability.porProfissionais.map((prof) => (
                      <option key={prof.funcionario_id} value={prof.funcionario_id}>
                        {prof.funcionario}{prof.especialidade ? ` (${prof.especialidade})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="mobile-slot-list">
                {filteredHorarios.length > 0 ? (
                  filteredHorarios.map((horario) => (
                    <button
                      className={`slot-chip ${selectedHour === horario ? 'slot-chip-selected' : ''}`}
                      key={horario}
                      type="button"
                      onClick={() => setSelectedHour(horario)}
                    >
                      {horario}
                    </button>
                  ))
                ) : (
                  <p>Nenhum horário disponível.</p>
                )}
              </div>
            </div>
          )}
        </Modal>

        {/* SEÇÃO: AVISOS E COMUNICADOS */}
        <section className="notice-panel" style={{ marginTop: '2rem' }}>
          <h3>Avisos e comunicados</h3>
          {notices.length === 0 ? (
            <p>Nenhum aviso disponível.</p>
          ) : (
            <div className="notice-list">
              {notices.map((notice) => {
                const payload = extractReagendamentoPayload(notice?.mensagem || '');
                const isReagendamento = Boolean(payload);
                const hasSurvey = isSurveyNotice(notice?.mensagem || '');
                return (
                  <article className="detail-item" key={notice.id}>
                    <span><strong>{notice.tipo || 'Aviso'}</strong> - {notice.created_at || notice.data_criacao || 'agora'}</span>
                    <strong>{notice.titulo}</strong>
                    <p>{formatNoticeText(notice.mensagem)}</p>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                      {isReagendamento && (
                        <button className="button button-primary" type="button" onClick={() => handleReagendarNotice(notice)}>
                          Reagendar
                        </button>
                      )}
                      {hasSurvey && !isReagendamento && (
                        <button className="button button-secondary" type="button" onClick={() => window.location.assign('/agendamentos')}>
                          Responder pesquisa de satisfação
                        </button>
                      )}
                      <button className="link-button" type="button" onClick={() => setNoticeDetail(notice)}>
                        Ver detalhes
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <Modal
          isOpen={Boolean(noticeDetail)}
          title="Detalhes do aviso"
          onClose={() => setNoticeDetail(null)}
          onSubmit={() => setNoticeDetail(null)}
          submitLabel="Fechar"
        >
          {noticeDetail && (
            <div className="form-grid">
              <div className="detail-item">
                <span><strong>{noticeDetail.tipo}</strong></span>
                <strong>{noticeDetail.titulo}</strong>
              </div>
              <p>{formatNoticeText(noticeDetail.mensagem)}</p>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
}

export default ClientAgendamentosPage;
