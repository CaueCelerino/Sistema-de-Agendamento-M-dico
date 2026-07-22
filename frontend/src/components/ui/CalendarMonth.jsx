import React from 'react';

const weekdayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function formatDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function CalendarMonth({ year, month, availability = [], selectedDate, onSelectDate, onMonthChange }) {
  const resolvedYear = year ?? new Date().getFullYear();
  const resolvedMonth = month ?? new Date().getMonth();
  const availableMap = new Map(availability.map((item) => [item.data, item]));
  const firstDay = new Date(resolvedYear, resolvedMonth, 1).getDay();
  const daysInMonth = new Date(resolvedYear, resolvedMonth + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: firstDay }, (_, index) => ({ key: `empty-${index}`, empty: true })),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const data = formatDate(resolvedYear, resolvedMonth, day);
      return {
        key: data,
        day,
        data,
        disponibilidade: availableMap.get(data),
      };
    }),
  ];

  return (
    <div className="calendar-panel">
      <div className="calendar-header-row">
        <div className="calendar-nav-controls" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {onMonthChange ? (
            <button type="button" className="link-button" onClick={() => onMonthChange(-1)}>
              ‹
            </button>
          ) : null}
          <h3>{monthNames[resolvedMonth]} {resolvedYear}</h3>
          {onMonthChange ? (
            <button type="button" className="link-button" onClick={() => onMonthChange(1)}>
              ›
            </button>
          ) : null}
        </div>
        <span>{availability.length} dias disponíveis</span>
      </div>

      <div className="calendar-weekdays">
        {weekdayLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="calendar-grid" role="grid" aria-label="Calendário mensal">
        {cells.map((cell) => {
          if (cell.empty) {
            return <div className="calendar-day calendar-day-empty" key={cell.key} />;
          }

          const isAvailable = Boolean(cell.disponibilidade);
          const isSelected = selectedDate === cell.data;

          return (
            <button
              className={`calendar-day ${isAvailable ? 'calendar-day-available' : ''} ${isSelected ? 'calendar-day-selected' : ''}`}
              key={cell.key}
              type="button"
              onClick={() => onSelectDate?.(cell.data)}
            >
              <span>{cell.day}</span>
              {isAvailable && <small>{cell.disponibilidade.horarios.length} horários</small>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CalendarMonth;
