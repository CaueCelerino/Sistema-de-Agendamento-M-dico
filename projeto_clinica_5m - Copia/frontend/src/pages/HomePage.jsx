import React from 'react';
import Layout from '../components/layout/Layout';

function HomePage() {
  return (
    <Layout>
      <main className="page-container">
        <section className="hero-card">
          <h1>Bem-vindo ao Espaço Vida</h1>
          <p>Gestão de agendamentos, cartões e agilidade para clínicas com design limpo e intuitivo.</p>
        </section>
      </main>
    </Layout>
  );
}

export default HomePage;
