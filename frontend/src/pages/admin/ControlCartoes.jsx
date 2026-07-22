import React from 'react';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';

function ControlCartoes() {
  return (
    <Layout>
      <div className="page-container">
        <section className="hero-card">
          <h1>Controle de Cartões</h1>
          <p>Emitir, revogar e auditar cartões de acesso.</p>
        </section>

        <div className="hero-grid">
          <Card title="Cartões">
            <p>Lista administrativa de cartões e ações rápidas.</p>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

export default ControlCartoes;
