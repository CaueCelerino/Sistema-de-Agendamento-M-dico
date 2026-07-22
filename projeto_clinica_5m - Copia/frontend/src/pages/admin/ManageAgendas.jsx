import React from 'react';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';

function ManageAgendas() {
  return (
    <Layout>
      <div className="page-container">
        <section className="hero-card">
          <h1>Gerenciar Agendas</h1>
          <p>Configurar horários, especialidades e controle de disponibilidade.</p>
        </section>

        <div className="hero-grid">
          <Card title="Agendas">
            <p>Ferramentas administrativas para gerenciar agendas.</p>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

export default ManageAgendas;
