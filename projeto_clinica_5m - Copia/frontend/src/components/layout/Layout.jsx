import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

function Layout({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAdmin } = useAuth();

  const closeMenu = () => setIsMenuOpen(false);
  const shellClassName = `app-shell ${isAdmin ? 'app-shell-admin' : 'app-shell-client'}`;

  return (
    <div className={shellClassName}>
      <Sidebar isOpen={isMenuOpen} onClose={closeMenu} onNavigate={closeMenu} />
      <button
        className={`sidebar-backdrop ${isMenuOpen ? 'sidebar-backdrop-visible' : ''}`}
        type="button"
        aria-label="Fechar menu"
        onClick={closeMenu}
      />
      <div className="app-main">
        <header className="app-header">
          <Header
            isMenuOpen={isMenuOpen}
            onMenuClick={() => setIsMenuOpen((open) => !open)}
          />
        </header>
        <main className="app-content">{children}</main>
        <footer className="app-footer" style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.85rem', color: '#6b7280' }}>
          Todos os direitos reservados - Espaço e Vida
        </footer>
      </div>
    </div>
  );
}

export default Layout;
