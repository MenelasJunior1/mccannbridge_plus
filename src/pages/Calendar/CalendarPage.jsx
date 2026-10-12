import { useState } from 'react';
import { CM_DATA } from '../../data/community';
import { useApp } from '../../context/AppContext';
import AdvancedCalendar from './sections/AdvancedCalendar';
import ArchiveModal from './sections/ArchiveModal';
import AdsSponsoringSection from './sections/AdsSponsoringSection';
import PublicationImageManager from './sections/PublicationImageManager';
import { getPostPerformance, formatMetricNumber } from './sections/calendarMetrics';

const FMT = (n) => n.toLocaleString('fr-FR');

const CM_SECTIONS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'calendrier', label: 'Calendrier', icon: '📅' },
  { id: 'creation', label: 'Création', icon: '🔥' },
  { id: 'validation', label: 'Validation', icon: '✅' },
  { id: 'publication', label: 'Publication', icon: '🚀' },
  { id: 'ads', label: 'Ads / Sponsoring', icon: '📢' },
  { id: 'briefs', label: 'Inbox Briefs', icon: '📨' },
  { id: 'rapports', label: 'Rapports', icon: '📊' },
];

/* ─── Sub-components ─── */

function CmKpis() {
  const { publications = [], calendarPosts = [] } = useApp();
  const postsAValider = publications.filter(p => p.statut === 'En validation').length;
  const postsProgrammes = publications.filter(p => p.statut === 'Programmé').length + calendarPosts.filter(p => p.status === 'SCHEDULED').length;
  const postsValides = publications.filter(p => p.statut === 'Validé').length;
  const postsPublies = publications.filter(p => p.statut === 'Publié').length + calendarPosts.filter(p => p.status === 'PUBLISHED').length;

  const kpis = [
    { label: 'POSTS À VALIDER AUJOURD\'HUI', value: postsAValider, delta: postsAValider > 0 ? `${postsAValider} en attente` : '0 en attente' },
    { label: 'POSTS PROGRAMMÉS CETTE SEMAINE', value: postsProgrammes, delta: postsProgrammes > 0 ? `${postsProgrammes} programmés` : '0 programmé' },
    { label: 'POSTS VALIDÉS PRÊTS', value: postsValides, delta: postsValides > 0 ? `${postsValides} prêts` : '0 prêt' },
    { label: 'POSTS PUBLIÉS EN LIGNE', value: postsPublies, delta: `${postsPublies} en direct` },
  ];
  return (
    <div className="cm-kpi-row">
      {kpis.map((kp, i) => (
        <div key={i} className="cm-kpi-card">
          <div className="cm-kpi-label">{kp.label}</div>
          <div className="cm-kpi-value">{kp.value}</div>
          <div className="cm-kpi-delta">{kp.delta}</div>
        </div>
      ))}
    </div>
  );
}

function CmWorkflow({ onNavigate }) {
  const [activeStep, setActiveStep] = useState(0);
  const stepMap = ['calendrier', 'creation', 'validation', 'publication', 'ads', 'rapports'];
  return (
    <div className="cm-section-card">
      <div className="cm-tag-header cm-tag-orange">WORKFLOW RECOMMANDÉ</div>
      <div className="cm-workflow-row">
        {CM_DATA.workflow.map((step, i) => (
          <div
            key={step.id}
            className={`cm-wf-step ${i === activeStep ? 'active' : ''}`}
            onClick={() => {
              setActiveStep(i);
              if (onNavigate && stepMap[i]) onNavigate(stepMap[i]);
            }}
            title={`Accéder au module ${step.label}`}
          >
            <div className="cm-wf-icon">{step.icon}</div>
            <div className="cm-wf-label">{step.label}</div>
            <div className="cm-wf-sub">{step.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CmBriefs({ onNavigate }) {
  const { briefs = [] } = useApp();
  const getPriorityClass = (p) => {
    if (p === 'urgent') return 'cm-priority-urgent';
    if (p === 'haute') return 'cm-priority-haute';
    return 'cm-priority-normale';
  };
  return (
    <div className="cm-section-card">
      <div className="cm-section-head">
        <div className="cm-tag-header cm-tag-orange">BRIEFS & PRIORITÉS DU JOUR</div>
        <span className="cm-count-badge">{briefs.length} BRIEF{briefs.length > 1 ? 'S' : ''}</span>
      </div>
      {briefs.length === 0 ? (
        <div className="pub-empty-state" style={{ padding: '24px 16px' }}>
          <div className="pub-empty-icon">📨</div>
          <div className="pub-empty-title">Aucun brief en attente</div>
          <div className="pub-empty-desc">Les nouveaux briefs enregistrés apparaîtront ici.</div>
        </div>
      ) : (
        <div className="cm-briefs-list">
          {briefs.map(b => (
            <div key={b.id} className="cm-brief-item">
              <div className={`cm-brief-dot ${getPriorityClass(b.priority)}`} />
              <div className="cm-brief-info">
                <div className="cm-brief-title">{b.title}</div>
                <div className="cm-brief-meta">{b.client || b.source || 'Client'} · {b.priority === 'urgent' ? 'Urgent' : `Priorité ${b.priority || 'normale'}`} · {b.deadline || 'Flexible'}</div>
              </div>
              <div className="cm-brief-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => onNavigate?.('briefs')}>Voir</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CmPlanningMini() {
  const { calendarPosts = [] } = useApp();
  const today = new Date();
  const currentDayOfWeek = today.getDay();
  const monday = new Date(today);
  const diff = today.getDate() - currentDayOfWeek + (currentDayOfWeek === 0 ? -6 : 1);
  monday.setDate(diff);

  const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dayNum = d.getDate();
    const dayStr = d.toISOString().split('T')[0];
    const isToday = d.toDateString() === today.toDateString();
    
    const matchingPosts = calendarPosts.filter(p => {
      if (p.date) return p.date === dayStr;
      if (p.day) return p.day === dayNum;
      return false;
    });

    return {
      label,
      num: dayNum,
      isToday,
      posts: matchingPosts
    };
  });

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return (
    <div className="cm-section-card">
      <div className="cm-section-head">
        <div className="cm-tag-header cm-tag-blue">PLANNING ÉDITORIAL SEMAINE</div>
        <span className="text-muted text-sm">{today.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
      </div>
      <div className="cm-planning-nav">
        <span className="font-semibold">{monday.getDate()} {monday.toLocaleDateString('fr-FR', { month: 'short' })} — {sunday.getDate()} {sunday.toLocaleDateString('fr-FR', { month: 'short' })}</span>
      </div>
      <div className="cm-planning-grid">
        {days.map((j, i) => (
          <div key={i} className={`cm-planning-day ${j.isToday ? 'today' : ''}`}>
            <div className="cm-planning-day-label">{j.label}</div>
            <div className="cm-planning-day-num">{j.num}</div>
            <div className="cm-planning-dots">
              {j.posts.map((p, pi) => (
                <span key={pi} className={`cm-plan-dot cm-dot-${p.status === 'PUBLISHED' ? 'publie' : p.status === 'SCHEDULED' ? 'programme' : 'a_corriger'}`} title={p.title} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="cm-planning-legend">
        <span><i className="cm-plan-dot cm-dot-programme" /> Programmé ({calendarPosts.filter(p => p.status === 'SCHEDULED' || p.status === 'PENDING').length})</span>
        <span><i className="cm-plan-dot cm-dot-publie" /> Publié ({calendarPosts.filter(p => p.status === 'PUBLISHED').length})</span>
        <span><i className="cm-plan-dot cm-dot-a_corriger" /> Brouillon ({calendarPosts.filter(p => p.status === 'DRAFT').length})</span>
      </div>
    </div>
  );
}

function CmStatuts() {
  const { publications = [], calendarPosts = [] } = useApp();
  const dynamicStatuts = [
    { label: 'Brouillon', color: '#8C8C8C', count: publications.filter(p => p.statut === 'Brouillon').length },
    { label: 'En Validation', color: '#F39C12', count: publications.filter(p => p.statut === 'En validation').length },
    { label: 'À Corriger', color: '#E74C3C', count: publications.filter(p => p.statut === 'À corriger').length },
    { label: 'Validé', color: '#27AE60', count: publications.filter(p => p.statut === 'Validé').length },
    { label: 'Programmé', color: '#2980B9', count: publications.filter(p => p.statut === 'Programmé').length },
    { label: 'Publié', color: '#8E44AD', count: publications.filter(p => p.statut === 'Publié').length },
    { label: 'Total Enregistrés', color: '#E67E22', count: publications.length },
    { label: 'Calendrier Actif', color: '#2C3E50', count: calendarPosts.length },
  ];
  return (
    <div className="cm-section-card">
      <div className="cm-tag-header cm-tag-red">STATUTS DES PUBLICATIONS EN BASE</div>
      <div className="cm-statuts-grid">
        {dynamicStatuts.map((s, i) => (
          <div key={i} className="cm-statut-card">
            <div className="cm-statut-value">{s.count}</div>
            <div className="cm-statut-label">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Creation form modal ─── */
function CreatePublicationModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    title: '',
    plateforme: 'Facebook',
    format: 'Image',
    description: '',
    dateTarget: '',
    heureTarget: '10:00',
    image: '',
    url: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSubmit(form);
    onClose();
  };

  return (
    <div className="pub-modal-overlay" onClick={onClose}>
      <div className="pub-modal" onClick={e => e.stopPropagation()}>
        <div className="pub-modal-header">
          <h2 className="pub-modal-title">🔥 Créer une publication</h2>
          <button className="pub-modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="pub-modal-form">
          <div className="pub-form-group">
            <label className="pub-form-label">Titre de la publication *</label>
            <input
              className="pub-form-input"
              type="text"
              placeholder="Ex: Carousel produit été 2026"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              autoFocus
            />
          </div>
          <div className="pub-form-row">
            <div className="pub-form-group">
              <label className="pub-form-label">Plateforme *</label>
              <select className="pub-form-select" value={form.plateforme} onChange={e => setForm({ ...form, plateforme: e.target.value })}>
                {CM_DATA.plateformes.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="pub-form-group">
              <label className="pub-form-label">Format *</label>
              <select className="pub-form-select" value={form.format} onChange={e => setForm({ ...form, format: e.target.value })}>
                {['Image', 'Carrousel', 'Reels', 'Story', 'Thread', 'Vidéo'].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div className="pub-form-row">
            <div className="pub-form-group">
              <label className="pub-form-label">Date cible</label>
              <input className="pub-form-input" type="date" value={form.dateTarget} onChange={e => setForm({ ...form, dateTarget: e.target.value })} />
            </div>
            <div className="pub-form-group">
              <label className="pub-form-label">Heure de publication</label>
              <input className="pub-form-input" type="time" value={form.heureTarget} onChange={e => setForm({ ...form, heureTarget: e.target.value })} />
            </div>
          </div>
          <div className="pub-form-group">
            <label className="pub-form-label">Description / Copy</label>
            <textarea
              className="pub-form-textarea"
              rows={3}
              placeholder="Décrivez le contenu de la publication..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <PublicationImageManager
            value={form.image}
            onChange={img => setForm({ ...form, image: img })}
            label="Visuel de la publication (Upload direct ou URL)"
          />

          <div className="pub-form-group">
            <label className="pub-form-label flex items-center justify-between">
              <span>Lien de la publication (URL)</span>
              <span className="text-xs font-normal text-slate-400">Pour consulter le post en ligne</span>
            </label>
            <input
              className="pub-form-input"
              type="url"
              placeholder="Ex: https://www.facebook.com/... ou https://instagram.com/p/..."
              value={form.url}
              onChange={e => setForm({ ...form, url: e.target.value })}
            />
          </div>

          <div className="pub-form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-orange">🔥 Créer la publication</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Schedule modal ─── */
function ScheduleModal({ pub, onClose, onSchedule }) {
  const [date, setDate] = useState(pub.dateTarget || '');
  const [heure, setHeure] = useState(pub.heureTarget || '10:00');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSchedule(pub.id, pub.title, date, heure);
    onClose();
  };

  return (
    <div className="pub-modal-overlay" onClick={onClose}>
      <div className="pub-modal pub-modal-sm" onClick={e => e.stopPropagation()}>
        <div className="pub-modal-header">
          <h2 className="pub-modal-title">📅 Programmer la publication</h2>
          <button className="pub-modal-close" onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: '0 24px 8px', color: '#a0aab2', fontSize: 13 }}>
          <strong style={{ color: '#fff' }}>{pub.title}</strong> — {pub.plateforme}
        </div>
        <form onSubmit={handleSubmit} className="pub-modal-form">
          <div className="pub-form-row">
            <div className="pub-form-group">
              <label className="pub-form-label">Date de publication *</label>
              <input className="pub-form-input" type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div className="pub-form-group">
              <label className="pub-form-label">Heure *</label>
              <input className="pub-form-input" type="time" value={heure} onChange={e => setHeure(e.target.value)} required />
            </div>
          </div>
          <div className="pub-form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-blue">📅 Programmer</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── CmCreation (dynamic) ─── */
function CmCreation({ onNavigate }) {
  const { publications = [], addPublication, submitForValidation } = useApp();
  const [filter, setFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);

  const filtered = filter === 'all' ? publications : publications.filter(p => p.plateforme === filter);

  const getStatutClass = (s) => {
    if (s === 'Brouillon') return 'tag-muted';
    if (s === 'À corriger') return 'tag-red';
    if (s === 'Validé') return 'tag-green';
    if (s === 'En validation') return 'tag-yellow';
    if (s === 'Programmé') return 'tag-blue';
    if (s === 'Publié') return 'tag-purple-solid';
    return 'tag-muted';
  };

  const getActionButton = (p) => {
    switch (p.statut) {
      case 'Brouillon':
      case 'À corriger':
        return (
          <button className="btn btn-orange btn-sm" onClick={() => submitForValidation(p.id, p.title)}>
            📤 Soumettre
          </button>
        );
      case 'En validation':
        return <span className="tag tag-yellow" style={{ fontSize: 11 }}>⏳ En attente</span>;
      case 'Validé':
        return <span className="tag tag-green" style={{ fontSize: 11 }}>✅ Validé</span>;
      case 'Programmé':
        return <span className="tag tag-blue" style={{ fontSize: 11 }}>📅 Programmé</span>;
      case 'Publié':
        return <span className="tag tag-purple-solid" style={{ fontSize: 11 }}>🚀 Publié</span>;
      default:
        return <button className="btn btn-ghost btn-sm">{p.action || 'Éditer'}</button>;
    }
  };

  return (
    <div className="cm-section-card">
      <div className="cm-section-head">
        <div className="cm-tag-header cm-tag-orange">CRÉATION / ADAPTATION PAR PLATEFORME</div>
        <button className="btn btn-green btn-sm" onClick={() => setShowCreate(true)}>+ Créer</button>
      </div>

      {/* Quick stats */}
      <div className="pub-quick-stats">
        <div className="pub-stat"><span className="pub-stat-num">{publications.filter(p => p.statut === 'Brouillon').length}</span><span className="pub-stat-label">Brouillons</span></div>
        <div className="pub-stat"><span className="pub-stat-num pub-stat-orange">{publications.filter(p => p.statut === 'En validation').length}</span><span className="pub-stat-label">En validation</span></div>
        <div className="pub-stat"><span className="pub-stat-num pub-stat-green">{publications.filter(p => p.statut === 'Validé').length}</span><span className="pub-stat-label">Validés</span></div>
        <div className="pub-stat"><span className="pub-stat-num pub-stat-blue">{publications.filter(p => p.statut === 'Programmé').length}</span><span className="pub-stat-label">Programmés</span></div>
      </div>

      <div className="cm-platform-filters">
        <button className={`cm-plat-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Tous ({publications.length})</button>
        {CM_DATA.plateformes.map(p => {
          const count = publications.filter(pub => pub.plateforme === p).length;
          return (
            <button key={p} className={`cm-plat-btn ${filter === p ? 'active' : ''}`} onClick={() => setFilter(p)}>
              <span className={`cm-plat-dot cm-plat-${p.toLowerCase().replace('/', '')}`} /> {p} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="pub-empty-state" style={{ padding: '32px 16px' }}>
          <div className="pub-empty-icon">📝</div>
          <div className="pub-empty-title">Aucune publication enregistrée</div>
          <div className="pub-empty-desc">
            {publications.length === 0
              ? 'Créez votre première publication pour lancer le flux de validation et de diffusion.'
              : 'Aucune publication trouvée pour ce filtre.'}
          </div>
          <button className="btn btn-orange btn-sm" style={{ marginTop: 12 }} onClick={() => setShowCreate(true)}>
            + Créer une publication
          </button>
        </div>
      ) : (
        <table className="table cm-table">
          <thead>
            <tr>
              <th>POST</th>
              <th>PLATEFORME</th>
              <th>FORMAT</th>
              <th className="text-center">STATUT</th>
              <th className="text-center">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="pub-table-row animate-fade">
                <td className="font-semibold">{p.title}</td>
                <td>{p.plateforme}</td>
                <td className="text-muted">{p.format}</td>
                <td className="text-center"><span className={`tag ${getStatutClass(p.statut)}`}>{p.statut.toUpperCase()}</span></td>
                <td className="text-center">{getActionButton(p)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showCreate && (
        <CreatePublicationModal
          onClose={() => setShowCreate(false)}
          onSubmit={(formData) => addPublication(formData)}
        />
      )}
    </div>
  );
}

/* ─── CmValidation (dynamic) ─── */
function CmValidation() {
  const { publications, submitForValidation, validatePublication, rejectPublication, schedulePublication } = useApp();
  const pendingPubs = publications.filter(p => p.statut === 'En validation');
  const correctionPubs = publications.filter(p => p.statut === 'À corriger');

  return (
    <div className="cm-section-card">
      <div className="cm-section-head">
        <div className="cm-tag-header cm-tag-blue">SOUMETTRE, CORRIGER, PROGRAMMER</div>
        <span className="cm-count-badge" style={{ background: 'var(--green)', color: '#fff' }}>
          {pendingPubs.length} EN ATTENTE
        </span>
      </div>

      {/* Pending validation items */}
      {pendingPubs.length > 0 && (
        <div className="pub-validation-list">
          <div className="pub-val-section-title">⏳ En attente de validation ({pendingPubs.length})</div>
          {pendingPubs.map(p => (
            <div key={p.id} className="pub-val-card animate-fade">
              <div className="pub-val-info">
                <div className="pub-val-title">{p.title}</div>
                <div className="pub-val-meta">📱 {p.plateforme} · {p.format} · {p.dateTarget || 'Date non définie'}</div>
                {p.description && <div className="pub-val-desc">{p.description}</div>}
              </div>
              <div className="pub-val-actions">
                <button className="btn btn-green btn-sm" onClick={() => validatePublication(p.id, p.title)}>✓ Approuver</button>
                <button className="btn btn-red btn-sm" onClick={() => rejectPublication(p.id, p.title)}>✕ Rejeter</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Correction items */}
      {correctionPubs.length > 0 && (
        <div className="pub-validation-list" style={{ marginTop: 16 }}>
          <div className="pub-val-section-title" style={{ color: '#e74c3c' }}>🔧 À corriger ({correctionPubs.length})</div>
          {correctionPubs.map(p => (
            <div key={p.id} className="pub-val-card pub-val-card-warn animate-fade">
              <div className="pub-val-info">
                <div className="pub-val-title">{p.title}</div>
                <div className="pub-val-meta">📱 {p.plateforme} · {p.format}</div>
              </div>
              <div className="pub-val-actions">
                <button className="btn btn-orange btn-sm" onClick={() => submitForValidation(p.id, p.title)}>📤 Re-soumettre</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pendingPubs.length === 0 && correctionPubs.length === 0 && (
        <div className="pub-empty-state">
          <div className="pub-empty-icon">✅</div>
          <div className="pub-empty-title">Aucun post en attente</div>
          <div className="pub-empty-desc">Tous les contenus sont validés ou en cours de création</div>
        </div>
      )}

      {/* Validation queue summary */}
      <div className="cm-val-queue" style={{ marginTop: 16 }}>
        <div className="cm-val-queue-title">File d'attente de validation</div>
        <div className="cm-val-queue-row">
          <span className="cm-val-queue-label">Publications</span>
          <div className="cm-val-queue-bar">
            <div className="cm-val-queue-fill" style={{
              width: `${publications.length > 0 ? ((publications.filter(p => p.statut === 'Validé' || p.statut === 'Programmé' || p.statut === 'Publié').length / publications.length) * 100) : 0}%`,
              background: 'var(--orange)'
            }} />
          </div>
          <span className="cm-val-queue-count">
            {publications.filter(p => p.statut === 'Validé' || p.statut === 'Programmé' || p.statut === 'Publié').length}/{publications.length}
          </span>
        </div>
      </div>
    </div>
  );
}

function CmSponsoring({ onNavigate }) {
  return (
    <div className="cm-section-card">
      <div className="cm-section-head">
        <div className="cm-tag-header cm-tag-orange">PILOTAGE ADS & SPONSORING</div>
      </div>
      <div style={{ fontSize: 13, color: '#94a3b8', margin: '14px 0', lineHeight: 1.4 }}>
        Aucune donnée active dans le cockpit Ads / Sponsoring.
      </div>
      <div className="cm-sponso-actions">
        <button className="btn btn-ghost btn-sm" onClick={() => onNavigate?.('ads')}>Ouvrir Ads / Sponsoring</button>
      </div>
    </div>
  );
}

function CmEngagement() {
  const { publications = [], calendarPosts = [] } = useApp();
  const publishedCount = publications.filter(p => p.statut === 'Publié').length + calendarPosts.filter(p => p.status === 'PUBLISHED').length;

  const totals = calendarPosts.reduce((acc, p) => {
    const perf = getPostPerformance(p);
    acc.vues += perf.vues;
    acc.likes += perf.likes;
    acc.commentaires += perf.commentaires;
    acc.partages += perf.partages;
    acc.engagement += perf.engagement;
    return acc;
  }, { vues: 0, likes: 0, commentaires: 0, partages: 0, engagement: 0 });

  return (
    <div className="cm-section-card">
      <div className="cm-section-head">
        <div className="cm-tag-header cm-tag-green">MESURE & COMMUNAUTÉ</div>
        <span className="tag tag-blue">TEMPS RÉEL</span>
      </div>
      <div className="cm-engage-chart">
        <div style={{ textAlign: 'center', padding: '16px 0', color: '#94a3b8', fontSize: 13 }}>
          {publishedCount === 0 
            ? "Les métriques d'engagement se mettront à jour dès que vos posts seront publiés en direct."
            : `${publishedCount} publication(s) en ligne suivie(s) en temps réel avec ${formatMetricNumber(totals.vues)} vues cumulées.`}
        </div>
      </div>
      <div className="cm-engage-metrics" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))' }}>
        <div className="cm-engage-metric">
          <div className="cm-engage-metric-val" style={{ color: '#38bdf8' }}>{formatMetricNumber(totals.vues)}</div>
          <div className="cm-engage-metric-label">👁 Vues</div>
        </div>
        <div className="cm-engage-metric">
          <div className="cm-engage-metric-val" style={{ color: '#f43f5e' }}>{formatMetricNumber(totals.likes)}</div>
          <div className="cm-engage-metric-label">❤️ Likes</div>
        </div>
        <div className="cm-engage-metric">
          <div className="cm-engage-metric-val" style={{ color: '#fbbf24' }}>{formatMetricNumber(totals.commentaires)}</div>
          <div className="cm-engage-metric-label">💬 Commentaires</div>
        </div>
        <div className="cm-engage-metric">
          <div className="cm-engage-metric-val" style={{ color: '#a855f7' }}>{formatMetricNumber(totals.partages)}</div>
          <div className="cm-engage-metric-label">🔄 Partages</div>
        </div>
        <div className="cm-engage-metric">
          <div className="cm-engage-metric-val" style={{ color: '#ff9233', fontWeight: 900 }}>{formatMetricNumber(totals.engagement)}</div>
          <div className="cm-engage-metric-label">⚡ Engagement cumulé</div>
        </div>
      </div>
    </div>
  );
}

function CmRapport() {
  const { publications = [], calendarPosts = [] } = useApp();
  const totalCount = publications.length + calendarPosts.length;
  const publishedCount = publications.filter(p => p.statut === 'Publié').length + calendarPosts.filter(p => p.status === 'PUBLISHED').length;
  const validatedCount = publications.filter(p => p.statut === 'Validé' || p.statut === 'Programmé' || p.statut === 'Publié').length;
  const validationRate = totalCount > 0 ? Math.round((validatedCount / totalCount) * 100) : 0;

  return (
    <div className="cm-section-card">
      <div className="cm-section-head">
        <div className="cm-tag-header cm-tag-orange">RAPPORT RAPIDE</div>
        <button className="btn btn-ghost btn-sm">Exporter PDF</button>
      </div>
      <div className="cm-rapport-obj">
        <strong>Objectif :</strong> Flux de production, validation et publication multi-plateformes en direct.
      </div>
      <div className="cm-rapport-jauges">
        <div className="cm-jauge-row">
          <span className="cm-jauge-label">Taux validation</span>
          <div className="cm-jauge-bar">
            <div className="cm-jauge-fill" style={{ width: `${validationRate}%`, background: 'var(--orange)' }} />
          </div>
          <span className="cm-jauge-val">{validationRate}%</span>
        </div>
        <div className="cm-jauge-row">
          <span className="cm-jauge-label">Posts publiés</span>
          <div className="cm-jauge-bar">
            <div className="cm-jauge-fill" style={{ width: `${totalCount > 0 ? Math.min(100, (publishedCount / totalCount) * 100) : 0}%`, background: 'var(--green)' }} />
          </div>
          <span className="cm-jauge-val">{publishedCount}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Tab content panels ─── */

function HomeTab({ onNavigate }) {
  return (
    <>
      <CmKpis />
      <CmWorkflow onNavigate={onNavigate} />
      <div className="cm-two-cols">
        <CmBriefs onNavigate={onNavigate} />
        <CmPlanningMini />
      </div>
      <CmStatuts />
      <div className="cm-two-cols">
        <CmCreation onNavigate={onNavigate} />
        <CmValidation />
      </div>
      <div className="cm-three-cols">
        <CmSponsoring onNavigate={onNavigate} />
        <CmEngagement />
        <CmRapport />
      </div>
      <div className="cm-impact-banner">
        Impact : workflow simple et traçable pour accélérer les validations et la publication multi-plateformes.
      </div>
    </>
  );
}

function CalendrierTab({ onOpenArchive }) {
  return <AdvancedCalendar onOpenArchive={onOpenArchive} />;
}

function CreationTab() {
  return <CmCreation />;
}

function ValidationTab() {
  const { publications, validatePublication, rejectPublication, submitForValidation } = useApp();
  const pendingPubs = publications.filter(p => p.statut === 'En validation');
  const correctionPubs = publications.filter(p => p.statut === 'À corriger');

  return (
    <div className="cm-section-card">
      <div className="cm-section-head">
        <div className="cm-tag-header cm-tag-blue">✅ VALIDATION DES PUBLICATIONS</div>
        <span className="cm-count-badge" style={{ background: pendingPubs.length > 0 ? 'var(--red)' : 'var(--green)', color: '#fff' }}>
          {pendingPubs.length} EN ATTENTE
        </span>
      </div>

      {pendingPubs.length > 0 && (
        <div className="pub-ai-banner">
          🤖 « {pendingPubs.length} publication{pendingPubs.length > 1 ? 's' : ''} en attente de validation. Temps estimé : {pendingPubs.length * 2} min. »
        </div>
      )}

      {pendingPubs.length > 0 ? (
        <div className="pub-validation-list">
          {pendingPubs.map(p => (
            <div key={p.id} className="pub-val-card-full animate-fade">
              <div className="pub-val-card-left">
                <span className="tag tag-red" style={{ fontSize: 10 }}>⚡ En attente</span>
                <h3 className="pub-val-card-title">{p.title}</h3>
                <div className="pub-val-card-meta">📱 {p.plateforme} · {p.format} · {p.dateTarget || 'Date non définie'}</div>
                {p.description && (
                  <div className="pub-val-card-preview">
                    <div className="pub-val-preview-label">APERÇU DU CONTENU</div>
                    {p.description}
                  </div>
                )}
              </div>
              <div className="pub-val-card-visual">
                <div className="pub-val-placeholder">
                  {p.plateforme === 'Instagram' ? '📸' : p.plateforme === 'TikTok' ? '🎵' : p.plateforme === 'LinkedIn' ? '💼' : '📘'}
                </div>
              </div>
              <div className="pub-val-card-actions">
                <button className="btn btn-green" onClick={() => validatePublication(p.id, p.title)}>✓ Approuver</button>
                <button className="btn btn-ghost">✎ Modifier</button>
                <button className="btn btn-red" onClick={() => rejectPublication(p.id, p.title)}>✕ Rejeter</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="pub-empty-state">
          <div className="pub-empty-icon">✅</div>
          <div className="pub-empty-title">Tout est validé !</div>
          <div className="pub-empty-desc">Aucune publication en attente de validation</div>
        </div>
      )}

      {correctionPubs.length > 0 && (
        <div className="pub-validation-list" style={{ marginTop: 20 }}>
          <div className="pub-val-section-title" style={{ color: '#e74c3c' }}>🔧 À corriger ({correctionPubs.length})</div>
          {correctionPubs.map(p => (
            <div key={p.id} className="pub-val-card pub-val-card-warn animate-fade">
              <div className="pub-val-info">
                <div className="pub-val-title">{p.title}</div>
                <div className="pub-val-meta">📱 {p.plateforme} · {p.format}</div>
              </div>
              <div className="pub-val-actions">
                <button className="btn btn-orange btn-sm" onClick={() => submitForValidation(p.id, p.title)}>📤 Re-soumettre</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PublicationTab() {
  const { publications, schedulePublication, publishPublication } = useApp();
  const validatedPubs = publications.filter(p => p.statut === 'Validé');
  const scheduledPubs = publications.filter(p => p.statut === 'Programmé');
  const publishedPubs = publications.filter(p => p.statut === 'Publié');
  const [scheduleTarget, setScheduleTarget] = useState(null);

  return (
    <div className="cm-section-card">
      <div className="cm-section-head">
        <div className="cm-tag-header cm-tag-green">🚀 PUBLICATION & PROGRAMMATION</div>
        <span className="cm-count-badge" style={{ background: 'var(--blue)', color: '#fff' }}>
          {validatedPubs.length + scheduledPubs.length} PRÊTS
        </span>
      </div>

      {/* Validated — ready to schedule */}
      {validatedPubs.length > 0 && (
        <div className="pub-section-block">
          <div className="pub-val-section-title" style={{ color: '#27ae60' }}>✅ Validés — Prêts à programmer ({validatedPubs.length})</div>
          <table className="table cm-table">
            <thead><tr><th>POST</th><th>PLATEFORME</th><th>FORMAT</th><th className="text-center">STATUT</th><th className="text-center">ACTION</th></tr></thead>
            <tbody>
              {validatedPubs.map(p => (
                <tr key={p.id} className="pub-table-row animate-fade">
                  <td className="font-semibold">{p.title}</td>
                  <td>{p.plateforme}</td>
                  <td className="text-muted">{p.format}</td>
                  <td className="text-center"><span className="tag tag-green">VALIDÉ</span></td>
                  <td className="text-center">
                    <button className="btn btn-blue btn-sm" onClick={() => setScheduleTarget(p)}>📅 Programmer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Scheduled — ready to publish */}
      {scheduledPubs.length > 0 && (
        <div className="pub-section-block">
          <div className="pub-val-section-title" style={{ color: '#2980b9' }}>📅 Programmés — Prêts à publier ({scheduledPubs.length})</div>
          <table className="table cm-table">
            <thead><tr><th>POST</th><th>PLATEFORME</th><th>DATE / HEURE</th><th className="text-center">STATUT</th><th className="text-center">ACTION</th></tr></thead>
            <tbody>
              {scheduledPubs.map(p => (
                <tr key={p.id} className="pub-table-row animate-fade">
                  <td className="font-semibold">{p.title}</td>
                  <td>{p.plateforme}</td>
                  <td className="text-muted">{p.dateTarget} {p.heureTarget}</td>
                  <td className="text-center"><span className="tag tag-blue">PROGRAMMÉ</span></td>
                  <td className="text-center">
                    <button className="btn btn-orange btn-sm" onClick={() => publishPublication(p.id, p.title)}>🚀 Publier</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Published */}
      {publishedPubs.length > 0 && (
        <div className="pub-section-block">
          <div className="pub-val-section-title" style={{ color: '#8e44ad' }}>🚀 Publiés ({publishedPubs.length})</div>
          <table className="table cm-table">
            <thead><tr><th>POST</th><th>PLATEFORME</th><th>FORMAT</th><th className="text-center">STATUT</th><th className="text-center">DATE</th></tr></thead>
            <tbody>
              {publishedPubs.map(p => (
                <tr key={p.id} className="pub-table-row animate-fade">
                  <td className="font-semibold">{p.title}</td>
                  <td>{p.plateforme}</td>
                  <td className="text-muted">{p.format}</td>
                  <td className="text-center"><span className="tag tag-purple-solid">PUBLIÉ</span></td>
                  <td className="text-center text-muted">{p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('fr-FR') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {validatedPubs.length === 0 && scheduledPubs.length === 0 && publishedPubs.length === 0 && (
        <div className="pub-empty-state">
          <div className="pub-empty-icon">📭</div>
          <div className="pub-empty-title">Aucune publication prête</div>
          <div className="pub-empty-desc">Créez et validez des publications pour les voir ici</div>
        </div>
      )}

      {scheduleTarget && (
        <ScheduleModal
          pub={scheduleTarget}
          onClose={() => setScheduleTarget(null)}
          onSchedule={schedulePublication}
        />
      )}
    </div>
  );
}

function AdsTab() {
  return <AdsSponsoringSection />;
}

function BriefsTab({ onNavigate }) {
  return <CmBriefs onNavigate={onNavigate} />;
}

function RapportsTab() {
  return (
    <>
      <CmEngagement />
      <CmRapport />
    </>
  );
}

/* ─── Main Page ─── */

export default function CalendarPage() {
  const [activeSection, setActiveSection] = useState('home');
  const [showArchive, setShowArchive] = useState(false);
  const { publications } = useApp();

  const validationCount = publications.filter(p => p.statut === 'En validation').length;
  const publicationCount = publications.filter(p => p.statut === 'Validé' || p.statut === 'Programmé').length;

  const renderContent = () => {
    switch (activeSection) {
      case 'home': return <HomeTab onNavigate={setActiveSection} />;
      case 'calendrier': return <CalendrierTab onOpenArchive={() => setShowArchive(true)} />;
      case 'creation': return <CreationTab onNavigate={setActiveSection} />;
      case 'validation': return <ValidationTab />;
      case 'publication': return <PublicationTab />;
      case 'ads': return <AdsTab />;
      case 'briefs': return <BriefsTab onNavigate={setActiveSection} />;
      case 'rapports': return <RapportsTab />;
      default: return <HomeTab onNavigate={setActiveSection} />;
    }
  };

  const getBadge = (id) => {
    if (id === 'validation' && validationCount > 0) return validationCount;
    if (id === 'publication' && publicationCount > 0) return publicationCount;
    return null;
  };

  return (
    <div className="cm-layout">
      {/* Internal sidebar */}
      <aside className="cm-sidebar">
        <div className="cm-sidebar-header">
          <div className="cm-sidebar-avatar">CM</div>
          <div>
            <div className="cm-sidebar-brand">Community</div>
            <div className="cm-sidebar-brand">Managers</div>
          </div>
        </div>
        <div className="cm-sidebar-section-label">MODULES BRIDGE</div>
        <nav className="cm-sidebar-nav">
          {CM_SECTIONS.map(s => {
            const badge = getBadge(s.id);
            return (
              <button
                key={s.id}
                className={`cm-sidebar-item ${activeSection === s.id ? 'active' : ''}`}
                onClick={() => setActiveSection(s.id)}
              >
                <span className="cm-sidebar-icon">{s.icon}</span>
                <span>{s.label}</span>
                {badge && <span className="cm-sidebar-badge">{badge}</span>}
              </button>
            );
          })}
        </nav>
        <div className="cm-sidebar-mission">
          <div className="cm-sidebar-section-label">RÔLE & MISSION</div>
          <div className="cm-sidebar-mission-text">
            Piloter les contenus, le sponsoring, le planning éditorial et l'exécution quotidienne des plateformes sociales.
          </div>
        </div>
        <div className="cm-sidebar-version">
          Cockpit Opérationnel v1.0<br />
          <span className="text-muted">Workflow traçable multi-plateformes</span>
        </div>
      </aside>

      {/* Main content */}
      <main className="cm-main">
        <header className="cm-header">
          <div>
            <h1 className="cm-title">Interface Community Manager</h1>
            <p className="cm-subtitle">Cycle de vie complet du contenu : calendrier, validation, publication et modération.</p>
          </div>
          <div className="cm-header-actions">
            <button className="btn btn-ghost btn-sm">📨 Recevoir un brief</button>
            <button className="btn btn-orange btn-sm" onClick={() => setActiveSection('creation')}>+ Nouveau post</button>
            <div className="cm-header-user">
              <div className="cm-header-user-avatar">CM</div>
              <span>Community Manager</span>
            </div>
          </div>
        </header>
        <div className="cm-content animate-fade">
          {renderContent()}
        </div>
      </main>
      {showArchive && <ArchiveModal onClose={() => setShowArchive(false)} />}
    </div>
  );
}
