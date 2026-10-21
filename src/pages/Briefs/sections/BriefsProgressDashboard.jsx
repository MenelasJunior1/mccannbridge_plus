import { useState } from 'react';
import { AlertTriangle, CalendarDays, FileText, Plus, Rocket, UserRound } from 'lucide-react';
import { BRIEF_STATUSES } from '../../../data/briefs';
import { formatCurrency } from '../../../utils/helpers';

export default function BriefsProgressDashboard({ briefs, onSelectBrief, perspective = 'client', onNewBrief }) {
  const [selectedBriefId, setSelectedBriefId] = useState(briefs[0]?.id || null);

  const activeBrief = briefs.find(b => b.id === selectedBriefId) || briefs[0];

  // Critical countdowns for agency
  const criticalBriefs = briefs
    .filter(b => b.goLiveDate && b.status !== 'live')
    .map(b => {
      const diff = new Date(b.goLiveDate) - new Date();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return { ...b, daysToGoLive: days };
    })
    .sort((a, b) => a.daysToGoLive - b.daysToGoLive);

  if (briefs.length === 0) {
    return (
      <div className="briefs-dashboard-container animate-fade">
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', margin: '20px 0', borderRadius: 12 }}>
          <FileText size={34} style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--dark)' }}>
            Aucun brief enregistré
          </h3>
          <p style={{ color: 'var(--muted)', fontSize: 14, maxWidth: 480, margin: '0 auto 20px', lineHeight: 1.5 }}>
            Les briefs créés sont synchronisés directement dans la base de données Firestore et leur progression s'affichera ici en temps réel.
          </p>
          {onNewBrief && (
            <button className="btn btn-primary" onClick={onNewBrief} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Plus size={16} /> Créer un nouveau brief
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="briefs-dashboard-container animate-fade">
      
      {/* Top Grid: Critical Alerts & Active Briefs Status */}
      <div className="dashboard-grid-cards">
        
        {/* Left Card: Active Briefs Selector */}
        <div className="card" style={{ flex: 1 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>
            <FileText size={16} /> Briefs en cours ({briefs.filter(b => b.status === 'in_progress' || b.status === 'uat').length})
          </h3>
          <div className="briefs-mini-list">
            {briefs.map(b => {
              const statusMeta = BRIEF_STATUSES[b.status] || BRIEF_STATUSES.submitted;
              const isSelected = b.id === (activeBrief?.id);
              
              let days = null;
              if (b.goLiveDate) {
                const diff = new Date(b.goLiveDate) - new Date();
                days = Math.ceil(diff / (1000 * 60 * 60 * 24));
              }

              return (
                <div
                  key={b.id}
                  className={`brief-mini-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedBriefId(b.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="brief-id-tag" style={{ fontSize: 10 }}>{b.id}</span>
                    <span className="tag" style={{ background: statusMeta.bg, color: statusMeta.color, fontSize: 10 }}>
                      {statusMeta.shortLabel}
                    </span>
                  </div>

                  <div className="brief-mini-title">{b.title}</div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <div style={{ flex: 1, marginRight: 12 }}>
                      <div className="progress-bar-sm">
                        <div className="progress-fill-sm" style={{ width: `${b.progress}%`, background: statusMeta.color }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{b.progress}%</span>
                  </div>

                  {days !== null && (
                    <div style={{ fontSize: 10, color: days <= 15 ? 'var(--red)' : 'var(--muted)', marginTop: 4 }}>
                      <Rocket size={12} /> Lancement : {days > 0 ? `dans ${days} jours (${b.goLiveDate})` : 'Aujourd’hui'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Card: Critical Go-Live Deadlines & Alerts (Special Agence & Client) */}
        <div className="card" style={{ flex: 1 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>
            <AlertTriangle size={16} /> Alertes planning et lancement
          </h3>
          <div className="critical-alerts-list">
            {criticalBriefs.slice(0, 4).map(cb => {
              const isUrgent = cb.daysToGoLive <= 30;
              return (
                <div key={cb.id} className={`alert-card ${isUrgent ? 'alert-urgent' : 'alert-normal'}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{cb.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                        Réf: {cb.id} • Typologie : {cb.typology}
                      </div>
                    </div>
                    <span className={`countdown-badge ${isUrgent ? 'badge-urgent' : 'badge-normal'}`}>
                      {cb.daysToGoLive > 0 ? `J-${cb.daysToGoLive}` : 'D-DAY'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: 11 }}>
                    <span>Cible Go-Live : <strong>{cb.goLiveDate}</strong></span>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ padding: '2px 8px', fontSize: 11 }}
                      onClick={() => onSelectBrief(cb)}
                    >
                      Détails 360° →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Bottom Section: Active Project Deep Dive & Modules Progress */}
      {activeBrief && (
        <div className="card card-bordered" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="tag tag-orange">{activeBrief.typology}</span>
                <span className="brief-id-tag">{activeBrief.id}</span>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--dark)', marginTop: 4 }}>
                {activeBrief.title}
              </h2>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                Sponsors : {(activeBrief.sponsors || []).map(s => s.name).join(', ')} • Budget : {activeBrief.budget ? formatCurrency(activeBrief.budget) : 'NC'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn btn-orange"
                onClick={() => onSelectBrief(activeBrief)}
              >
                Inspecter le Brief & Exporter PDF →
              </button>
            </div>
          </div>

          {/* Module Milestones Progress Grid */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Avancement des Modules Clés</h4>
            <div className="modules-progress-grid">
              {(activeBrief.milestones || []).map(m => (
                <div key={m.id} className="module-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 12 }}>{m.title}</span>
                    <span style={{ fontWeight: 800, color: m.percentage === 100 ? 'var(--green)' : 'var(--orange)', fontSize: 12 }}>
                      {m.percentage}%
                    </span>
                  </div>
                  <div className="progress-bar-sm">
                    <div
                      className="progress-fill-sm"
                      style={{
                        width: `${m.percentage}%`,
                        background: m.percentage === 100 ? 'var(--green)' : 'var(--orange)',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: 'var(--muted)' }}>
                    <span><UserRound size={11} /> {m.owner}</span>
                    <span>{m.dueDate ? <><CalendarDays size={11} /> {m.dueDate}</> : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Journey Summary & Specific Features Readiness */}
          <div className="form-grid-2">
            <div className="detail-sub-box">
              <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>User Journey & Mécanique</h4>
              <p style={{ fontSize: 12, color: 'var(--body)', lineHeight: 1.5, margin: 0 }}>
                {activeBrief.userJourney || 'Mécanique en cours de cadrage par les équipes techniques.'}
              </p>
            </div>

            <div className="detail-sub-box">
              <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Fonctionnalités Spécifiques Développées</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {(activeBrief.specificFeatures || []).map((f, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                    <span>• {f.label}</span>
                    <span className="tag tag-muted" style={{ fontSize: 10 }}>{f.status || 'En cours'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
