import React, { useEffect, useState, useRef } from 'react';

export default function DownloadApp() {
  const [isAndroid, setIsAndroid] = useState(false);
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const configuredApiUrl = import.meta.env?.VITE_API_URL?.replace(/\/$/, '') || '';
  const backendBaseUrl = configuredApiUrl.replace(/\/api$/, '') || window.location.origin || 'http://localhost:3000';

  useEffect(() => {
    const androidMatch = /Android/i.test(navigator.userAgent) && /Mobi/i.test(navigator.userAgent);
    const nativeMatch = typeof window !== 'undefined' && !!(
      window.Capacitor?.isNativePlatform?.() ||
      window.Capacitor?.getPlatform?.() === 'android' ||
      /Capacitor|Ionic|Cordova/.test(navigator.userAgent)
    );

    setIsAndroid(androidMatch);
    setIsNativeApp(nativeMatch);
  }, []);

  const apkUrl = `${backendBaseUrl.replace(/\/$/, '')}/mobile/app.apk`;
  const [resolvedApkUrl, setResolvedApkUrl] = useState(apkUrl);

  function openDownloadModal() {
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
  }

  // Refs for focus management
  const modalRef = useRef(null);

  useEffect(() => {
    if (showModal) {
      // Lock background scroll
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // Focus modal content to bring it into view on mobile
      setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus({ preventScroll: true });
        }
        // If VisualViewport is available, attempt to reposition slightly
        if (window.visualViewport && modalRef.current) {
          const vv = window.visualViewport;
          const topOffset = vv.offsetTop || 0;
          // scroll the window so the visual viewport centers the modal
          const modalRect = modalRef.current.getBoundingClientRect();
          const desiredScroll = window.scrollY + (modalRect.top - (vv.height / 2) + (modalRect.height / 2));
          window.scrollTo({ top: Math.max(0, Math.round(desiredScroll)), behavior: 'smooth' });
        }
      }, 60);

      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
    return undefined;
  }, [showModal]);

  // Resolve APK URL from backend endpoint to avoid serving stale/cached files
  useEffect(() => {
    let cancelled = false;
    const apiBase = backendBaseUrl.replace(/\/$/, '') || '';
    const linksEndpoint = `${apiBase}/api/mobile/links`;

    async function fetchLinks() {
      try {
        const res = await fetch(linksEndpoint, { cache: 'no-store' });
        if (!res.ok) throw new Error('no links');
        const json = await res.json();
        if (!cancelled && json && json.apk) {
          setResolvedApkUrl(json.apk);
          return;
        }
      } catch (e) {
        // fallback: try relative endpoint (in case backend proxy differs)
        try {
          const res2 = await fetch('/api/mobile/links', { cache: 'no-store' });
          if (res2.ok) {
            const j2 = await res2.json();
            if (!cancelled && j2 && j2.apk) {
              setResolvedApkUrl(j2.apk);
              return;
            }
          }
        } catch (er) {
          // ignore and keep default
        }
      }
      // ensure we always have a value
      if (!cancelled) setResolvedApkUrl(apkUrl);
    }

    fetchLinks();
    return () => { cancelled = true; };
  }, [backendBaseUrl]);

  if (!isAndroid || isNativeApp) {
    return null;
  }

  return (
    <>
      <div className="download-app">
        <button className="button button-secondary" onClick={openDownloadModal}>
          📱 Baixar APK Android
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            ref={modalRef}
            tabIndex={-1}
          >
            <h2>Download do APK</h2>
            <p>Clique no botão abaixo para baixar o APK Android diretamente:</p>
            <a
              href={`${resolvedApkUrl.replace(/\/$/, '')}?_=${Date.now()}`}
              download="espaco-vida.apk"
              className="button button-primary"
              style={{ display: 'block', textAlign: 'center', padding: '12px', textDecoration: 'none' }}
              rel="noreferrer noopener"
            >
              ⬇️ Baixar APK
            </a>
            <button className="button button-secondary" onClick={closeModal} style={{ marginTop: '12px', width: '100%' }}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
