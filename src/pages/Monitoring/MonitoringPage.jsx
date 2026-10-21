'use client';

import { useCallback, useEffect, useState } from 'react';
import { Activity, Bot, Database, RefreshCw, ShieldCheck, Users } from 'lucide-react';

const API_URL = '/api/backend/v1/monitoring';

function formatBytes(value) {
  return `${(value / 1024 / 1024).toFixed(1)} Mo`;
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days} j ${hours} h`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(value));
}

export default function MonitoringPage() {
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(API_URL, { credentials: 'include' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'monitoring_unavailable');
      setSnapshot(payload);
    } catch {
      setError('Le monitoring Phoenix est indisponible ou votre rôle ne permet pas cet accès.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading && !snapshot) return <div className="next-module-state"><RefreshCw className="is-spinning" /><span>Chargement du monitoring…</span></div>;
  if (error && !snapshot) return <div className="next-module-state is-error"><ShieldCheck /><span>{error}</span></div>;

  const metrics = [
    { label: 'Utilisateurs', value: snapshot.counts.users, icon: Users },
    { label: 'Clients actifs', value: snapshot.counts.clients, icon: Database },
    { label: 'Documents', value: snapshot.counts.documents, icon: Database },
    { label: 'Chunks actifs', value: snapshot.counts.active_chunks, icon: Bot },
    { label: 'Événements / 24 h', value: snapshot.counts.audit_24h, icon: Activity },
    { label: 'Échecs IA / 24 h', value: snapshot.counts.assistant_failures_24h, icon: ShieldCheck },
  ];

  return (
    <section className="next-monitoring-page">
      <header className="next-module-hero">
        <div><p className="eyebrow">Administration système</p><h1>Audit & monitoring</h1><p>État opérationnel du backend Phoenix et trace des actions sensibles.</p></div>
        <button type="button" onClick={load} disabled={loading}><RefreshCw size={16} className={loading ? 'is-spinning' : ''} /> Actualiser</button>
      </header>

      <div className="next-monitoring-metrics">
        {metrics.map(({ label, value, icon: Icon }) => <article key={label}><Icon /><small>{label}</small><strong>{value}</strong></article>)}
      </div>

      <div className="next-monitoring-health">
        <article>
          <div><p className="eyebrow">Runtime</p><h2>Phoenix / BEAM</h2></div>
          <dl>
            <div><dt>Base de données</dt><dd>{snapshot.runtime.database}</dd></div>
            <div><dt>Uptime</dt><dd>{formatUptime(snapshot.runtime.uptime_seconds)}</dd></div>
            <div><dt>Mémoire</dt><dd>{formatBytes(snapshot.runtime.memory_bytes)}</dd></div>
            <div><dt>Processus</dt><dd>{snapshot.runtime.process_count} / {snapshot.runtime.process_limit}</dd></div>
          </dl>
        </article>
        <article>
          <div><p className="eyebrow">Assistant</p><h2>Génération externe</h2></div>
          <dl>
            <div><dt>État</dt><dd>{snapshot.assistant.state}</dd></div>
            <div><dt>Fournisseur</dt><dd>{snapshot.assistant.provider}</dd></div>
            <div><dt>Modèle</dt><dd>{snapshot.assistant.model || 'Non configuré'}</dd></div>
            {'zdr_confirmed' in snapshot.assistant && <div><dt>ZDR</dt><dd>{snapshot.assistant.zdr_confirmed ? 'Confirmé' : 'À confirmer'}</dd></div>}
          </dl>
        </article>
      </div>

      <article className="next-audit-panel">
        <div><p className="eyebrow">Journal d’audit</p><h2>Derniers événements</h2></div>
        <div className="next-audit-table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Action</th><th>Acteur</th><th>Client</th><th>Détails</th></tr></thead>
            <tbody>
              {snapshot.events.map((event) => (
                <tr key={event.id}>
                  <td>{formatDate(event.inserted_at)}</td><td><strong>{event.action}</strong><small>{event.resource_type}</small></td>
                  <td>{event.actor?.email || 'Système'}</td><td>{event.client?.name || 'Global'}</td><td><code>{JSON.stringify(event.metadata)}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
