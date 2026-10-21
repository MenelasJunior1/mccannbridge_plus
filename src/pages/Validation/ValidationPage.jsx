import { useApp } from '../../context/AppContext';
import { TEAM } from '../../data/team';
import { Check, CheckCircle2, Clock3, MessageSquareText, Smartphone, X } from 'lucide-react';

export default function ValidationPage() {
  const { calendar, validateCalendarItem, rejectCalendarItem } = useApp();
  const pendingItems = calendar.map((item, idx) => ({ ...item, globalIdx: idx })).filter(c => c.status === 'pending');

  return (
    <div className="bridge-simple-page bridge-validation-page">
      <header className="bridge-editorial-page-head bridge-simple-head">
        <div>
          <span className="bridge-page-index">05 / VALIDATION</span>
          <h1>Validation<br />client</h1>
          <p>Traitez les contenus prioritaires, suivez les décisions et libérez le calendrier de production.</p>
        </div>
        <div className="bridge-validation-count"><Clock3 size={17} /><span><small>Décisions attendues</small><strong>{pendingItems.length}</strong></span></div>
      </header>

      <div className="bridge-insight-strip">
        <span>Priorité Traffic</span>
        <p>{pendingItems.length} productions en attente. Les premiers éléments peuvent bloquer le calendrier de lundi.</p>
        <small>Temps estimé : 3 min</small>
      </div>

      {pendingItems.length === 0 ? (
        <div className="bridge-empty-state">
          <CheckCircle2 size={38} />
          <div className="text-lg font-semibold text-green">Tout est validé !</div>
          <div className="text-sm text-muted mt-4">Aucun contenu en attente de validation client</div>
        </div>
      ) : (
        pendingItems.map(item => {
          const cm = TEAM.cm.find(c => c.id === item.cm);
          return (
            <article key={item.globalIdx} className="bridge-validation-card animate-fade">
              <div className="val-card-layout">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className="tag tag-red mb-8">Bloque le calendrier</span>
                  <h3 className="text-lg font-bold text-dark" style={{ marginTop: 8, marginBottom: 4 }}>{item.content}</h3>
                  <div className="bridge-validation-meta"><Smartphone size={14} /> {item.platform} <span /> {item.day} <span /> CM : {cm?.name || '—'}</div>
                  <div className="text-sm text-muted mt-4">Sponsoring : {item.sponsoring > 0 ? (item.sponsoring / 1000).toFixed(0) + 'K FCFA' : 'Non sponsorisé'}</div>
                  <div className="bridge-content-preview">
                    <div>APERÇU DU CONTENU</div>
                    Contenu prêt pour publication. Visuel validé en interne. CTA vérifié. Relecture croisée effectuée.
                  </div>
                </div>
                <div className="val-preview-box">
                  [Aperçu visuel]
                </div>
              </div>
              <div className="val-actions-row">
                <button onClick={() => validateCalendarItem(item.globalIdx, item.content)} className="btn btn-green"><Check size={14} /> Approuver</button>
                <button className="btn btn-ghost"><MessageSquareText size={14} /> Demander modification</button>
                <button onClick={() => rejectCalendarItem(item.globalIdx, item.content)} className="btn btn-red"><X size={14} /> Rejeter</button>
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}
