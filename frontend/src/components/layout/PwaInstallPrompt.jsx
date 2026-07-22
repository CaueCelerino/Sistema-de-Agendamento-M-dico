import React, { useEffect, useState } from 'react';

function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || Boolean(window.navigator.standalone);
    if (isStandalone) {
      return undefined;
    }

    try {
      const dismissedUntil = Number(window.localStorage.getItem('espaco-vida-install-dismissed-until') || '0');
      if (Date.now() < dismissedUntil) {
        return undefined;
      }
    } catch {
      // Ignora falhas de storage e continua exibindo o banner.
    }

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    const timer = window.setTimeout(() => {
      setIsVisible(true);
    }, 1800);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(window.navigator.userAgent);
  if (!isMobile || !isVisible || isInstalled || !deferredPrompt) {
    return null;
  }

  const handleDismiss = () => {
    try {
      window.localStorage.setItem('espaco-vida-install-dismissed-until', String(Date.now() + 1000 * 60 * 60 * 6));
    } catch {
      // Ignora falhas de storage.
    }
    setIsVisible(false);
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  return (
    <div className="install-app-banner" role="status">
      <button className="install-app-banner__close" type="button" aria-label="Fechar sugestão de instalação" onClick={handleDismiss}>
        ×
      </button>
      <div className="install-app-banner__content">
        <div className="install-app-banner__pill">Instalação rápida</div>
        <strong>Instale o Espaço Vida no celular</strong>
        <p>Toque no botão abaixo para instalar o aplicativo quando o navegador permitir.</p>

        <div className="install-app-banner__actions">
          <button className="button button-primary" type="button" onClick={handleInstall}>
            Instalar agora
          </button>
        </div>
      </div>
    </div>
  );
}

export default PwaInstallPrompt;
