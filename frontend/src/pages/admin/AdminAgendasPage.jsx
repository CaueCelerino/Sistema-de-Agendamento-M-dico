import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/layout/Layout';
import CalendarMonth from '../../components/ui/CalendarMonth';
import { listAdminAvailability, removeAvailability, saveAvailability, removeSpecificHorarios } from '../../services/agendaDisponibilidadeService';
import adminService from '../../services/adminService';

function AdminAgendasPage() {
  const [availability, setAvailability] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');

  // state usado quando o dia não possui horários base cadastrados no backend
  // (permite salvar criando horários novos)

  const [loading, setLoading] = useState(true);

  const [funcionarios, setFuncionarios] = useState([]);
  const [selectedFuncionarioIds, setSelectedFuncionarioIds] = useState([]);
  const [selectedHoursByFuncionario, setSelectedHoursByFuncionario] = useState({});

  const [draftHoursByDay, setDraftHoursByDay] = useState('08:00, 09:00, 14:00');

  const [error, setError] = useState('');

  const [usingFallback, setUsingFallback] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  // Para editar horários existentes
  const [horariosParaRemover, setHorariosParaRemover] = useState({});
  const [novoHorarioPorMedico, setNovoHorarioPorMedico] = useState({});
  const [showNewProfessionalSection, setShowNewProfessionalSection] = useState(false);

  const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

  useEffect(() => {
    async function loadAvailability() {
      setLoading(true);
      try {
        const data = await listAdminAvailability({ mes: monthKey });
        setAvailability(data.disponibilidades || []);
        setUsingFallback(Boolean(data.usingFallback));
      } catch {
        setError('Não foi possível carregar as disponibilidades.');
      } finally {
        setLoading(false);
      }
    }

    loadAvailability();
  }, [monthKey]);

  useEffect(() => {
    async function loadFuncionarios() {
      try {
        const data = await adminService.getFuncionarios();
        setFuncionarios(data.funcionarios || []);
      } catch {
        // não bloquear a tela caso falhe
      }
    }
    loadFuncionarios();
  }, []);

  const selectedAvailability = useMemo(
    () => availability.find((item) => item.data === selectedDate),
    [availability, selectedDate]
  );

  const selectedAvailabilityProfessionalIds = useMemo(() => {
    return new Set((selectedAvailability?.porProfissionais || []).map((item) => Number(item.funcionario_id)));
  }, [selectedAvailability]);

  const selectedNewProfessionals = useMemo(() => {
    if (!selectedAvailability) return [];
    return selectedFuncionarioIds
      .filter((funcionarioId) => !selectedAvailabilityProfessionalIds.has(Number(funcionarioId)))
      .map((funcionarioId) => funcionarios.find((item) => Number(item.id) === Number(funcionarioId)))
      .filter(Boolean);
  }, [funcionarios, selectedAvailability, selectedAvailabilityProfessionalIds, selectedFuncionarioIds]);

  async function handleSelectDate(date) {
    setSelectedDate(date);
    setSelectedFuncionarioIds([]);
    setSelectedHoursByFuncionario({});
    setHorariosParaRemover({});
    setNovoHorarioPorMedico({});
    setShowNewProfessionalSection(false);
  }

  function handleMonthChange(offset) {
    setCurrentMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
    setSelectedDate('');
  }

  function toggleFuncionario(funcionarioId) {
    setSelectedFuncionarioIds((prev) => {
      const exists = prev.includes(funcionarioId);
      const next = exists ? prev.filter((id) => id !== funcionarioId) : [...prev, funcionarioId];
      return next;
    });
  }

  function toggleNewProfessionalSection() {
    setShowNewProfessionalSection((current) => {
      const next = !current;
      if (!next) {
        setSelectedFuncionarioIds([]);
        setSelectedHoursByFuncionario({});
        setNovoHorarioPorMedico({});
      }
      return next;
    });
  }

  // Sem endpoint de horários por médico ainda, usamos os horários já existentes do dia (compatível com o GET /disponibilidades)
  // e aplicamos seleção por médico.
  const horariosBaseDoDia = selectedAvailability?.horarios || [];

  function toggleHorarioParaFuncionario(funcionarioId, horario) {
    setSelectedHoursByFuncionario((prev) => {
      const current = prev[funcionarioId] || [];
      const exists = current.includes(horario);
      const next = exists ? current.filter((h) => h !== horario) : [...current, horario];
      return { ...prev, [funcionarioId]: next };
    });
  }

  async function handleSaveAvailability() {
    if (!selectedDate) return;

    // Se o backend retornou horários base, usamos seleção por chip.
    // Se NÃO retornou horários base (dia vazio), usamos os horários digitados (draftHoursByDay)
    // para alimentar a seleção automaticamente para cada profissional selecionado.
    const horariosDigitados = draftHoursByDay
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const isDiaSemBase = horariosBaseDoDia.length === 0;

    const disponibilidadesPorMedico = selectedFuncionarioIds
      .map((funcionario_id) => {
        const horariosSelecionados = selectedHoursByFuncionario[funcionario_id] || [];
        const horarios = isDiaSemBase ? horariosDigitados : horariosSelecionados;
        return { funcionario_id, horarios };
      })
      .filter((x) => Array.isArray(x.horarios) && x.horarios.length > 0);

    if (disponibilidadesPorMedico.length === 0) {
      setError('Selecione pelo menos 1 profissional e 1 horário para cada profissional.');
      return;
    }

    try {
      // Payload novo suportado pelo backend: { data, disponibilidadesPorMedico: [{ funcionario_id, horarios }] }
      await saveAvailability({ data: selectedDate, disponibilidadesPorMedico });

      setSelectedDate('');
      setSelectedFuncionarioIds([]);
      setSelectedHoursByFuncionario({});

      const data = await listAdminAvailability({ mes: monthKey });
      setAvailability(data.disponibilidades || []);
      setError('');
    } catch (e) {
      setError('Não foi possível salvar a disponibilidade. Verifique o console/erro de rede.');
      console.error(e);
    }
  }


  async function handleRemoveAvailability() {
    if (!selectedDate) return;

    try {
      await removeAvailability(selectedDate);
      setSelectedDate('');
      const data = await listAdminAvailability({ mes: monthKey });
      setAvailability(data.disponibilidades || []);
      setSelectedFuncionarioIds([]);
      setSelectedHoursByFuncionario({});
      setError('');
    } catch {
      setError('Não foi possível remover a disponibilidade.');
    }
  }

  function toggleHorarioParaRemover(funcionario_id, horario) {
    setHorariosParaRemover((prev) => {
      const current = prev[funcionario_id] || [];
      const exists = current.includes(horario);
      const next = exists ? current.filter((h) => h !== horario) : [...current, horario];
      return { ...prev, [funcionario_id]: next };
    });
  }

  function removerNovoHorario(funcionario_id, horario) {
    setSelectedHoursByFuncionario((prev) => {
      const current = prev[funcionario_id] || [];
      const next = current.filter((h) => h !== horario);
      if (next.length === 0) {
        const { [funcionario_id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [funcionario_id]: next };
    });
  }

  function adicionarNovoHorario(funcionario_id) {
    if (!novoHorarioPorMedico[funcionario_id] || novoHorarioPorMedico[funcionario_id].trim() === '') {
      return;
    }

    const novo = novoHorarioPorMedico[funcionario_id].trim();

    const horariosExistentes = selectedAvailability?.porProfissionais
      .find((p) => p.funcionario_id === Number(funcionario_id))
      ?.horarios || [];

    if (horariosExistentes.includes(novo)) {
      setError(`O horário ${novo} já existe para este profissional.`);
      return;
    }

    setSelectedHoursByFuncionario((prev) => {
      const current = prev[funcionario_id] || [];
      const exists = current.includes(novo);
      const next = exists ? current : [...current, novo];
      return { ...prev, [funcionario_id]: next };
    });

    setNovoHorarioPorMedico((prev) => ({
      ...prev,
      [funcionario_id]: '',
    }));
  }

  async function handleSalvarEdicoesHorarios() {
    if (!selectedDate || !selectedAvailability) return;

    try {
      // 1. Remover horários marcados para remoção
      const remocoes = Object.entries(horariosParaRemover)
        .filter(([_, horarios]) => horarios.length > 0);

      for (const [funcionario_id, horarios] of remocoes) {
        await removeSpecificHorarios(selectedDate, Number(funcionario_id), horarios);
      }

      // 2. Adicionar novos horários para profissionais existentes ou novos profissionais na mesma data
      const profissionaisExistentes = selectedAvailability.porProfissionais || [];
      const profissionaisJaPresentes = new Set(profissionaisExistentes.map((p) => Number(p.funcionario_id)));

      const novosPorMedico = Object.entries(selectedHoursByFuncionario)
        .map(([funcionario_id, horarios]) => {
          const horariosAntigos = selectedAvailability.porProfissionais
            .find((p) => p.funcionario_id === Number(funcionario_id))
            ?.horarios || [];

          const horariosNovos = horarios.filter((h) => !horariosAntigos.includes(h));
          return { funcionario_id: Number(funcionario_id), horarios: horariosNovos };
        })
        .filter((x) => x.horarios.length > 0);

      const novosProfissionais = selectedFuncionarioIds
        .filter((funcionario_id) => !profissionaisJaPresentes.has(Number(funcionario_id)))
        .map((funcionario_id) => {
          const horarios = selectedHoursByFuncionario[funcionario_id] || [];
          return { funcionario_id: Number(funcionario_id), horarios };
        })
        .filter((x) => x.horarios.length > 0);

      const payloadAdicionar = [...novosPorMedico, ...novosProfissionais];

      if (payloadAdicionar.length > 0) {
        await saveAvailability({ data: selectedDate, disponibilidadesPorMedico: payloadAdicionar });
      }

      // 3. Recarregar disponibilidades
      setSelectedDate('');
      const data = await listAdminAvailability({ mes: monthKey });
      setAvailability(data.disponibilidades || []);
      setSelectedFuncionarioIds([]);
      setSelectedHoursByFuncionario({});
      setHorariosParaRemover({});
      setNovoHorarioPorMedico({});
      setError('');
    } catch (e) {
      setError('Não foi possível salvar as alterações.');
      console.error(e);
    }
  }

  return (
    <Layout>
      <div className="page-container">
        <section className="hero-card">
          <h1>Gerenciar Agendas</h1>
          <p>Cadastre dias e horários disponíveis para atendimento e futuras reservas dos clientes.</p>
        </section>

        {usingFallback && (
          <p className="fallback-note">Disponibilidades temporárias. Integração futura sugerida em /admin/disponibilidades.</p>
        )}
        {error && <p className="text-error">{error}</p>}

        {loading ? (
          <div className="hero-grid"><section className="small-card"><h3>Carregando</h3><p>Carregando calendário...</p></section></div>
        ) : (
          <div className="calendar-layout">
            <CalendarMonth
              availability={availability}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              year={currentMonth.getFullYear()}
              month={currentMonth.getMonth()}
              onMonthChange={handleMonthChange}
            />
              <aside className="side-panel">
              <h3>Disponibilidades</h3>
              <p>Selecione um dia no calendário para adicionar ou remover horários.</p>
              <div className="slot-list">
                {availability.map((item) => (
                  <div className="detail-item" key={item.data}>
                    <span>{item.data}</span>
                    <strong>{item.horarios.join(', ')}</strong>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        )}

        {Boolean(selectedDate) && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{selectedAvailability ? 'Editar disponibilidade' : 'Adicionar disponibilidade'}</h2>
                <button className="modal-close" onClick={() => setSelectedDate('')} aria-label="Fechar">✕</button>
              </div>

              <div className="modal-body">
                <div className="form-grid">
                  <div className="detail-item">
                    <span>Data selecionada</span>
                    <strong>{selectedDate}</strong>
                  </div>

                  <div>
                    <h3>1) Selecione o(s) profissional(is)</h3>
                    {selectedAvailability ? (
                      <>
                        <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Edite os horários dos profissionais abaixo ou adicione novos profissionais para esta mesma data.</p>
                        <button
                          type="button"
                          className="link-button"
                          onClick={toggleNewProfessionalSection}
                          style={{ marginBottom: '0.75rem' }}
                        >
                          {showNewProfessionalSection ? 'Ocultar novos profissionais' : 'Adicionar novos profissionais'}
                        </button>
                      </>
                    ) : null}
                    <div className="slot-chip-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {funcionarios.length === 0 ? (
                        <p>Nenhum profissional carregado.</p>
                      ) : (
                        funcionarios.map((f) => {
                          const alreadyInDate = Boolean(selectedAvailability?.porProfissionais?.some((p) => Number(p.funcionario_id) === Number(f.id)));
                          const checked = selectedFuncionarioIds.includes(f.id);
                          return (
                            <button
                              type="button"
                              key={f.id}
                              className={`slot-chip ${checked ? 'slot-chip-selected' : ''}`}
                              onClick={() => toggleFuncionario(f.id)}
                              disabled={selectedAvailability !== undefined && !showNewProfessionalSection}
                              style={{
                                opacity: selectedAvailability !== undefined && !showNewProfessionalSection ? 0.5 : 1,
                                cursor: selectedAvailability !== undefined && !showNewProfessionalSection ? 'not-allowed' : 'pointer',
                              }}
                            >
                              {f.nome}
                              {alreadyInDate ? ' (já cadastrado)' : ''}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div>
                    <h3>2) Selecione os horários</h3>

                    {/* SE HÁ HORÁRIOS EXISTENTES - MODO EDIÇÃO */}
                    {selectedAvailability && selectedAvailability.porProfissionais && selectedAvailability.porProfissionais.length > 0 ? (
                      <div>
                        <p style={{ marginBottom: '1rem', fontStyle: 'italic' }}>Este dia já possui horários cadastrados. Você pode adicionar novos ou remover os existentes.</p>
                        
                        {selectedAvailability.porProfissionais.map((prof) => (
                          <div key={prof.funcionario_id} style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                            <div className="detail-item">
                              <span>Profissional</span>
                              <strong>{prof.funcionario}{prof.especialidade ? ` (${prof.especialidade})` : ''}</strong>
                            </div>
                            
                            {/* Horários Existentes */}
                            <div style={{ marginTop: '0.75rem' }}>
                              <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', fontSize: '0.9rem' }}>Horários Disponíveis:</p>
                              <div className="schedule-slot-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                {prof.horarios && prof.horarios.length > 0 ? (
                                  prof.horarios.map((horario) => {
                                    const estaParaRemover = (horariosParaRemover[prof.funcionario_id] || []).includes(horario);
                                    return (
                                      <button
                                        type="button"
                                        key={horario}
                                        className={`slot-chip ${estaParaRemover ? 'slot-chip-disabled' : ''}`}
                                        onClick={() => toggleHorarioParaRemover(prof.funcionario_id, horario)}
                                        style={{
                                          opacity: estaParaRemover ? 0.5 : 1,
                                          textDecoration: estaParaRemover ? 'line-through' : 'none',
                                        }}
                                      >
                                        {horario} {estaParaRemover ? '(remover)' : ''}
                                      </button>
                                    );
                                  })
                                ) : (
                                  <p style={{ margin: 0, fontSize: '0.9rem' }}>Nenhum horário cadastrado</p>
                                )}
                              </div>
                            </div>

                            {/* Adicionar Novo Horário */}
                            <div style={{ marginTop: '0.75rem' }}>
                              <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                                <div style={{ flex: 1 }}>
                                  <small>Adicionar novo horário:</small>
                                  <input
                                    type="time"
                                    value={novoHorarioPorMedico[prof.funcionario_id] || ''}
                                    onChange={(e) => {
                                      const timeStr = e.target.value;
                                      setNovoHorarioPorMedico((prev) => ({
                                        ...prev,
                                        [prof.funcionario_id]: timeStr,
                                      }));
                                    }}
                                    style={{ width: '100%' }}
                                  />
                                </div>
                                <button
                                  type="button"
                                  className="button button-primary"
                                  onClick={() => adicionarNovoHorario(prof.funcionario_id)}
                                  disabled={!novoHorarioPorMedico[prof.funcionario_id]}
                                >
                                  +
                                </button>
                              </label>
                            </div>

                            {selectedHoursByFuncionario[prof.funcionario_id] && selectedHoursByFuncionario[prof.funcionario_id].length > 0 ? (
                              <div style={{ marginTop: '0.75rem' }}>
                                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', fontSize: '0.9rem' }}>Novos horários a adicionar:</p>
                                <div className="schedule-slot-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                  {selectedHoursByFuncionario[prof.funcionario_id].map((horario) => (
                                    <button
                                      key={horario}
                                      type="button"
                                      className="slot-chip slot-chip-selected"
                                      onClick={() => removerNovoHorario(prof.funcionario_id, horario)}
                                      style={{ display: 'inline-flex', alignItems: 'center' }}
                                    >
                                      {horario} <span style={{ marginLeft: '0.35rem', fontSize: '0.75rem' }}>Remover</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        ))}

                        <small style={{ display: 'block', marginTop: '1rem', fontStyle: 'italic' }}>
                          Dica: Clique em um horário existente para marcá-lo para remoção (ficará com linha riscada).
                        </small>

                        {showNewProfessionalSection && selectedNewProfessionals.length > 0 && (
                          <div style={{ marginTop: '1.5rem' }}>
                            <h4 style={{ marginBottom: '0.75rem' }}>Novos profissionais nesta data</h4>
                            {selectedNewProfessionals.map((prof) => (
                              <div key={prof.id} style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', background: '#fafafa' }}>
                                <div className="detail-item">
                                  <span>Profissional novo</span>
                                  <strong>{prof.nome}</strong>
                                </div>
                                <div style={{ marginTop: '0.75rem' }}>
                                  <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                                    <div style={{ flex: 1 }}>
                                      <small>Adicionar horário:</small>
                                      <input
                                        type="time"
                                        value={novoHorarioPorMedico[prof.id] || ''}
                                        onChange={(e) => {
                                          const timeStr = e.target.value;
                                          setNovoHorarioPorMedico((prev) => ({
                                            ...prev,
                                            [prof.id]: timeStr,
                                          }));
                                        }}
                                        style={{ width: '100%' }}
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      className="button button-primary"
                                      onClick={() => adicionarNovoHorario(prof.id)}
                                      disabled={!novoHorarioPorMedico[prof.id]}
                                    >
                                      +
                                    </button>
                                  </label>
                                </div>

                                {selectedHoursByFuncionario[prof.id] && selectedHoursByFuncionario[prof.id].length > 0 ? (
                                  <div style={{ marginTop: '0.75rem' }}>
                                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', fontSize: '0.9rem' }}>Novos horários a adicionar:</p>
                                    <div className="schedule-slot-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                      {selectedHoursByFuncionario[prof.id].map((horario) => (
                                        <button
                                          key={horario}
                                          type="button"
                                          className="slot-chip slot-chip-selected"
                                          onClick={() => removerNovoHorario(prof.id, horario)}
                                          style={{ display: 'inline-flex', alignItems: 'center' }}
                                        >
                                          {horario} <span style={{ marginLeft: '0.35rem', fontSize: '0.75rem' }}>Remover</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* SE NÃO HÁ HORÁRIOS - MODO CRIAÇÃO */}
                        <p>Esse dia não tem horários base cadastrados ainda. Você pode criar horários novos abaixo.</p>

                        <label style={{ display: 'block', marginTop: '0.75rem' }}>
                          Horários (separe por vírgula)
                          <input
                            value={draftHoursByDay}
                            onChange={(e) => setDraftHoursByDay(e.target.value)}
                            placeholder="08:00, 09:00, 14:00"
                          />
                        </label>
                        <small style={{ display: 'block', marginTop: '0.25rem' }}>
                          Ex: 08:00, 09:30, 14:00
                        </small>

                        <div style={{ marginTop: '0.75rem' }}>
                          <p style={{ margin: 0 }}>
                            Após salvar, o calendário passa a listar esses horários para o dia.
                          </p>
                        </div>
                      </>
                    )}

                    {!selectedAvailability ? (
                      <>
                        {selectedFuncionarioIds.length === 0 ? (
                          <p>Selecione pelo menos um profissional para liberar os horários por médico.</p>
                        ) : (
                          selectedFuncionarioIds.map((funcionario_id) => {
                            const horariosParaEsseCaso = horariosBaseDoDia.length > 0 ? horariosBaseDoDia : draftHoursByDay
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean);

                            return (
                              <div key={funcionario_id} style={{ marginTop: '1rem' }}>
                                <div className="detail-item">
                                  <span>Profissional</span>
                                  <strong>{funcionarios.find((x) => x.id === funcionario_id)?.nome || funcionario_id}</strong>
                                </div>
                                <div className="schedule-slot-list" style={{ marginTop: '0.75rem' }}>
                                  {horariosParaEsseCaso.length === 0 ? (
                                    <p style={{ margin: 0 }}>Informe horários acima para este dia.</p>
                                  ) : (
                                    horariosParaEsseCaso.map((horario) => {
                                      const checked = (selectedHoursByFuncionario[funcionario_id] || []).includes(horario);
                                      return (
                                        <button
                                          type="button"
                                          key={horario}
                                          className={`slot-chip ${checked ? 'slot-chip-selected' : ''}`}
                                          onClick={() => toggleHorarioParaFuncionario(funcionario_id, horario)}
                                        >
                                          {horario}
                                        </button>
                                      );
                                    })
                                  )}

                                  <p style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>
                                    Observação: os horários são persistidos no backend (tabela <code>agendas</code>).
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </>
                    ) : null}
                  </div>


                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                    {selectedAvailability ? (
                      <>
                        <button className="link-button link-button-danger" type="button" onClick={handleRemoveAvailability}>
                          Remover tudo
                        </button>
                        <button className="button button-primary" type="button" onClick={handleSalvarEdicoesHorarios}>
                          Salvar edições
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="link-button link-button-danger" type="button" onClick={handleRemoveAvailability} disabled>
                          Remover disponibilidade
                        </button>
                        <button className="button button-primary" type="button" onClick={handleSaveAvailability}>
                          Salvar disponibilidade
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="link-button" onClick={() => setSelectedDate('')}>Fechar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default AdminAgendasPage;

