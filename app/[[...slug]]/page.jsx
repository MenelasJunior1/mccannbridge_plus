'use client';

import dynamic from 'next/dynamic';

const McCannBridgeApp = dynamic(() => import('../../src/App'), {
  ssr: false,
  loading: () => (
    <main className="next-app-loading" aria-live="polite">
      <span />
      <strong>Chargement de McCann Bridge…</strong>
    </main>
  ),
});

export default function AppPage() {
  return <McCannBridgeApp />;
}
