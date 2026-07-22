import React from 'react';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';

function AdminRelatorios() {
  return (
    <Layout>
      <div className="page-container">
        <section className="hero-card">
          <h1>Relatórios Administrativos</h1>
          <p>Gerar e exportar relatórios de uso, financeiro e auditoria.</p>
        </section>

        <div className="hero-grid">
          <Card title="Relatórios">
            <p>Ferramentas de geração de relatórios.</p>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

export default AdminRelatorios;
