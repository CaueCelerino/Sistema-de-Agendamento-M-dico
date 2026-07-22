import React from 'react';
import Layout from '../components/layout/Layout';
import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <Layout>
      <div className="page-container">
        <section className="hero-card">
          <h1>Página não encontrada</h1>
          <p>Desculpe, não foi possível encontrar essa página.</p>
          <Link to="/" className="button-secondary">
            Voltar ao Dashboard
          </Link>
        </section>
      </div>
    </Layout>
  );
}

export default NotFoundPage;
