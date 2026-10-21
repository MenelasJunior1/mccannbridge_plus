import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { FINANCIAL_DATA } from '../../data/financial';
import { DOCUMENT_TYPES, DOCUMENT_STATUSES } from '../../utils/financialUtils';
import FinancialDocumentModal from './modals/FinancialDocumentModal';
import OcrImportModal from './modals/OcrImportModal';
import ClientFinancePage from './client/ClientFinancePage';

const FMT = (n) => (n !== undefined && n !== null ? Number(n).toLocaleString('fr-FR') : '0');

const FINANCE_SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'operations', label: 'Opérations (BC / Factures / Devis)', icon: '📄' },
  { id: 'facturation', label: 'Facturation Client', icon: '🧾' },
  { id: 'tresorerie', label: 'Trésorerie & Alertes', icon: '💰' },
  { id: 'rapprochements', label: 'Rapprochements & Approbations', icon: '🔗' },
  { id: 'budget-reel', label: 'Budget vs Réel', icon: '📈' },
  { id: 'reporting', label: 'Reporting & Prévisions', icon: '📋' },
  { id: 'audit', label: 'Audit & Logs', icon: '🔒' },
];

/* ─── Sub-components ─── */

function KpiCards() {
  const c = FINANCIAL_DATA.cockpit;
  const f = FINANCIAL_DATA.facturation;
  const kpis = [
    { label: 'BUDGET ALLOUÉ', value: FMT(c.budgetAlloue), sub: 'Campagnes Q2 — Mayi + Digital', color: 'var(--dark)', unit: 'FCFA' },
    { label: 'BUDGET RÉALISÉ', value: FMT(c.budgetRealise), sub: '69,4 % consommé', color: 'var(--dark)', unit: 'FCFA' },
    { label: 'CA FACTURÉ CLIENT', value: FMT(f.caFacture), sub: `Reste à facturer: ${FMT(f.resteAFacturer)}`, color: 'var(--blue)', unit: 'FCFA' },
    { label: 'ÉCART BUDGET/RÉEL', value: `+${c.ecartPct} %`, sub: c.ecartNote, color: 'var(--green)', unit: '' },
    { label: 'TRÉSORERIE DISPONIBLE', value: FMT(c.tresorerieDisponible), sub: c.tresorerieNote, color: 'var(--green)', unit: 'FCFA' },
    { label: 'EN ATTENTE VALIDATION', value: c.enAttenteValidation, sub: c.attenteDetail, color: 'var(--dark)', unit: '' },
    { label: 'ALERTES ACTIVES', value: c.alertesActives, sub: c.alertesDetail, color: 'var(--red)', unit: '' },
  ];

  return (
    <div className="fin-kpi-row">
      {kpis.map((k, i) => (
        <div key={i} className="fin-kpi-card">
          <div className="fin-kpi-label">{k.label}</div>
          <div className="fin-kpi-value" style={{ color: k.color }}>{k.value}</div>
          {k.unit && <div className="fin-kpi-unit">{k.unit}</div>}
          <div className="fin-kpi-sub">{k.sub}</div>
        </div>
      ))}
    </div>
  );
}

function BudgetChart() {
  const data = FINANCIAL_DATA.budgetExecution;
  const maxVal = Math.max(...data.postes.flatMap(p => [p.budget, p.reel, p.prevision]));

  return (
    <div className="fin-section-card">
      <h3 className="fin-section-title">EXÉCUTION BUDGET VS RÉEL — {data.campagne.toUpperCase()}</h3>
      <div className="fin-chart-area">
        <div className="fin-chart-bars">
          {data.postes.map((p, i) => (
            <div key={i} className="fin-chart-group">
              <div className="fin-chart-bar-set">
                <div className="fin-chart-bar fin-bar-budget" style={{ height: `${(p.budget / maxVal) * 100}%` }} title={`Budget: ${FMT(p.budget)}`} />
                <div className="fin-chart-bar fin-bar-reel" style={{ height: `${(p.reel / maxVal) * 100}%` }} title={`Réel: ${FMT(p.reel)}`} />
                <div className="fin-chart-bar fin-bar-prev" style={{ height: `${(p.prevision / maxVal) * 100}%` }} title={`Prévision: ${FMT(p.prevision)}`} />
              </div>
              <div className="fin-chart-label">{p.name.length > 12 ? p.name.slice(0, 12) + '…' : p.name}</div>
            </div>
          ))}
        </div>
        <div className="fin-chart-legend">
          <span><i className="fin-legend-dot" style={{ background: 'var(--orange)' }} /> Budget</span>
          <span><i className="fin-legend-dot" style={{ background: '#E74C3C' }} /> Réel</span>
          <span><i className="fin-legend-dot" style={{ background: '#ddd' }} /> Prévision</span>
        </div>
      </div>
      <div className="fin-ecarts">
        <strong>Analyse automatique des écarts :</strong>
        <ul>
          {data.ecarts.map((e, i) => (
            <li key={i} className={`fin-ecart-item fin-ecart-${e.type}`}>
              {e.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function WorkflowPanel() {
  const wf = FINANCIAL_DATA.workflow;
  return (
    <div className="fin-section-card">
      <h3 className="fin-section-title">WORKFLOW DES ACTIONS EN COURS</h3>
      <div className="fin-workflow-steps">
        {wf.steps.map((s, i) => (
          <div key={i} className="fin-wf-step-wrapper">
            <div className={`fin-wf-step ${s.num <= wf.currentStep ? 'active' : ''}`}>
              {s.num}
            </div>
            {i < wf.steps.length - 1 && <div className={`fin-wf-line ${s.num < wf.currentStep ? 'active' : ''}`} />}
          </div>
        ))}
      </div>
      <div className="fin-workflow-labels">
        {wf.steps.map((s, i) => (
          <div key={i} className="fin-wf-label">{s.label}</div>
        ))}
      </div>
      <div className="fin-workflow-counts">
        {wf.counts.map((c, i) => (
          <div key={i} className="fin-wf-count-row">
            <span className="fin-wf-count-label">
              <i className="fin-legend-dot" style={{ background: c.color }} /> {c.label}
            </span>
            <span className="fin-wf-count-value">{c.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OperationsRegister() {
  const { 
    financialDocuments = [], 
    addFinancialDocument, 
    updateFinancialDocument, 
    deleteFinancialDocument, 
    approveFinancialDocument 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [defaultDocType, setDefaultDocType] = useState('BC');

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return (financialDocuments || []).filter(doc => {
      const matchSearch = !searchQuery || 
        (doc.reference && doc.reference.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (doc.client && doc.client.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (doc.campagne && doc.campagne.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (doc.notes && doc.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchType = selectedTypeFilter === 'ALL' || doc.type === selectedTypeFilter;
      const matchStatus = selectedStatusFilter === 'ALL' || doc.statut === selectedStatusFilter;

      return matchSearch && matchType && matchStatus;
    });
  }, [financialDocuments, searchQuery, selectedTypeFilter, selectedStatusFilter]);

  const handleOpenCreateModal = (type = 'BC') => {
    setEditingDoc(null);
    setDefaultDocType(type);
    setIsDocModalOpen(true);
  };

  const handleOpenEditModal = (doc) => {
    setEditingDoc(doc);
    setDefaultDocType(doc.type || 'BC');
    setIsDocModalOpen(true);
  };

  const handleSaveDocument = (docData) => {
    if (editingDoc) {
      updateFinancialDocument(editingDoc.id, docData);
    } else {
      addFinancialDocument(docData);
    }
  };

  const handleOcrImport = (parsedDoc) => {
    setEditingDoc(parsedDoc);
    setDefaultDocType(parsedDoc.type || 'BC');
    setIsDocModalOpen(true);
  };

  const handleDelete = (id, ref) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le document ${ref || id} ?`)) {
      deleteFinancialDocument(id, ref);
    }
  };

  const getDocTypeConfig = (type) => {
    return DOCUMENT_TYPES.find(t => t.id === type || t.label === type) || DOCUMENT_TYPES[0];
  };

  const getStatutBadge = (statut) => {
    const sObj = DOCUMENT_STATUSES.find(s => s.id === statut) || { badgeClass: 'tag-muted' };
    return sObj.badgeClass;
  };

  return (
    <div className="fin-section-card" style={{ marginBottom: 24 }}>
      {/* Title & Quick Actions Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <h3 className="fin-section-title" style={{ margin: 0 }}>
            REGISTRE DES OPÉRATIONS & DOCUMENTS FINANCIERS (6 TYPES)
          </h3>
          <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 4 }}>
            Bons de Commande, Factures (Fournisseur & Client), Reçus, Devis et Pro-forma avec calcul TVA & OCR
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button 
            type="button" 
            onClick={() => setIsOcrModalOpen(true)}
            className="btn btn-ghost btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--orange)', color: 'var(--orange)' }}
          >
            <span>🔍</span> Import Reconnaissance OCR
          </button>
          
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button 
              type="button" 
              onClick={() => handleOpenCreateModal('BC')}
              className="btn btn-orange btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
            >
              <span>+</span> Créer un Document
            </button>
          </div>
        </div>
      </div>

      {/* 6 Document Type Fast Creation Buttons Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 8,
        marginBottom: 16,
        padding: '12px',
        background: '#f8fafc',
        borderRadius: 10,
        border: '1px solid #e2e8f0'
      }}>
        {DOCUMENT_TYPES.map(t => {
          const count = (financialDocuments || []).filter(d => d.type === t.id).length;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => handleOpenCreateModal(t.id)}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                padding: '8px 10px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = t.color;
                e.currentTarget.style.background = '#fff7ed';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.background = '#ffffff';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 15 }}>{t.icon}</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#0f172a' }}>+ {t.id}</div>
                  <div style={{ fontSize: 9, color: '#64748b', whiteSpace: 'nowrap' }}>{t.label.slice(0, 16)}</div>
                </div>
              </div>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                background: '#f1f5f9',
                color: t.color,
                padding: '2px 6px',
                borderRadius: 10
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
            <input
              type="text"
              placeholder="Rechercher par réf, client, campagne..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: 32, fontSize: 13, height: 36 }}
            />
            <span style={{ position: 'absolute', left: 10, top: 9, color: '#94a3b8', fontSize: 14 }}>🔍</span>
          </div>

          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="form-input form-select"
            style={{ width: 170, fontSize: 13, height: 36 }}
          >
            <option value="ALL">Tous les types ({financialDocuments.length})</option>
            {DOCUMENT_TYPES.map(t => (
              <option key={t.id} value={t.id}>{t.label} ({t.id})</option>
            ))}
          </select>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="form-input form-select"
            style={{ width: 170, fontSize: 13, height: 36 }}
          >
            <option value="ALL">Tous les statuts</option>
            {DOCUMENT_STATUSES.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: 12, color: 'var(--gray)', fontWeight: 600 }}>
          {filteredDocs.length} document(s) affiché(s)
        </div>
      </div>

      {/* Interactive Financial Documents Table */}
      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
        <table className="table fin-ops-table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th style={{ width: 85 }}>TYPE</th>
              <th>RÉFÉRENCE</th>
              <th>CLIENT / FOURNISSEUR</th>
              <th>CAMPAGNE</th>
              <th className="text-right">MONTANT TTC</th>
              <th>ÉMISSION</th>
              <th className="text-center">STATUT</th>
              <th>PIÈCES</th>
              <th className="text-center" style={{ minWidth: 160 }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '36px 20px', color: '#64748b' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📑</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Aucun document financier trouvé</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    Cliquez sur « + Créer un Document » ou « Import Reconnaissance OCR » pour en ajouter un.
                  </div>
                </td>
              </tr>
            ) : (
              filteredDocs.map(doc => {
                const typeCfg = getDocTypeConfig(doc.type);
                const piecesCount = Array.isArray(doc.pieces) ? doc.pieces.length : (doc.pieces && doc.pieces !== '—' ? 1 : 0);

                return (
                  <tr key={doc.id} style={{ transition: 'background 0.2s' }}>
                    <td>
                      <span 
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: 4,
                          background: `${typeCfg.color}15`,
                          color: typeCfg.color,
                          border: `1px solid ${typeCfg.color}40`,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <span>{typeCfg.icon}</span> {doc.type}
                      </span>
                    </td>
                    <td className="font-semibold" style={{ color: '#0f172a' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(doc)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#0f172a',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          padding: 0,
                          fontSize: 13
                        }}
                        title="Cliquer pour voir et éditer"
                      >
                        {doc.reference}
                      </button>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{doc.thirdParty?.name || doc.client || '—'}</div>
                      {doc.thirdParty?.rccm && (
                        <div style={{ fontSize: 10, color: '#64748b' }}>{doc.thirdParty.rccm.slice(0, 24)}...</div>
                      )}
                    </td>
                    <td style={{ color: '#475569', fontSize: 12 }}>{doc.campagne || '—'}</td>
                    <td className="text-right font-semibold" style={{ color: '#0f172a', whiteSpace: 'nowrap' }}>
                      {FMT(doc.montantTTC || doc.montant || 0)} FCFA
                    </td>
                    <td style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                      {doc.dateEmission || doc.date || '—'}
                    </td>
                    <td className="text-center">
                      <span className={`tag ${getStatutBadge(doc.statut)}`}>
                        {doc.statut}
                      </span>
                    </td>
                    <td className="text-muted" style={{ fontSize: 12 }}>
                      {piecesCount > 0 ? (
                        <span title={Array.isArray(doc.pieces) ? doc.pieces.join(', ') : doc.pieces} style={{ cursor: 'pointer', color: 'var(--blue)' }}>
                          📎 {piecesCount} doc(s)
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="text-center">
                      <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(doc)}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '3px 8px', fontSize: 12 }}
                          title="Prévisualiser et modifier"
                        >
                          👁️ Fiche
                        </button>
                        
                        {doc.statut !== 'Validée' && doc.statut !== 'Réconcilié' && doc.statut !== 'Encaissée / Payée' ? (
                          <button
                            type="button"
                            onClick={() => approveFinancialDocument(doc.id, 'Validée')}
                            className="btn btn-orange btn-sm"
                            style={{ padding: '3px 8px', fontSize: 12 }}
                            title="Valider ce document"
                          >
                            ✓ Valider
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => approveFinancialDocument(doc.id, 'Réconcilié')}
                            className="btn btn-green btn-sm"
                            style={{ padding: '3px 8px', fontSize: 12 }}
                            title="Marquer réconcilié"
                          >
                            ✓ Réconcilier
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(doc.id, doc.reference)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '3px 6px',
                            fontSize: 14
                          }}
                          title="Supprimer définitivement"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Financial Modals */}
      <FinancialDocumentModal
        isOpen={isDocModalOpen}
        onClose={() => { setIsDocModalOpen(false); setEditingDoc(null); }}
        onSave={handleSaveDocument}
        initialData={editingDoc}
        defaultType={defaultDocType}
        existingDocs={financialDocuments}
      />

      <OcrImportModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        onImportParsedDoc={handleOcrImport}
      />
    </div>
  );
}

function AlertsSection() {
  return (
    <div className="fin-section-card">
      <h3 className="fin-section-title">ALERTES BUDGET & TRÉSORERIE</h3>
      <div className="fin-alerts-list">
        {FINANCIAL_DATA.alerts.map(a => (
          <div key={a.id} className={`fin-alert-card fin-alert-${a.severity}`}>
            <div className="fin-alert-content">
              <strong>{a.title}</strong> — {a.text}
            </div>
            <button className="btn btn-sm" style={{ background: a.actionColor, color: '#fff', flexShrink: 0 }}>{a.action}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportingSection() {
  const r = FINANCIAL_DATA.reporting;
  return (
    <div className="fin-section-card">
      <h3 className="fin-section-title">REPORTING & PRÉVISIONS</h3>
      <div className="fin-reporting-grid">
        <div className="fin-report-block">
          <div className="fin-report-label">{r.dernierRapport.title}</div>
          <div className="fin-report-detail">{r.dernierRapport.periode}</div>
          <div className="fin-report-date">{r.dernierRapport.diffuse}</div>
        </div>
        <div className="fin-report-block">
          <div className="fin-report-label">{r.prevision.title}</div>
          <div className="fin-report-detail">
            Probabilité de dépassement : <strong style={{ color: 'var(--orange)' }}>{r.prevision.probabilite} %</strong> {r.prevision.note}
          </div>
          <div className="progress-track progress-track-lg" style={{ marginTop: 8 }}>
            <div className="progress-fill" style={{ background: 'var(--orange)', width: `${r.prevision.probabilite}%` }} />
          </div>
        </div>
      </div>
      <div className="fin-report-buttons">
        <button className="btn btn-orange btn-sm">Générer Report Client</button>
        <button className="btn btn-green btn-sm">Export Audit BEAC</button>
        <button className="btn btn-ghost btn-sm">Prévisionnel PDF</button>
      </div>
    </div>
  );
}

/* ─── Tab content panels ─── */

function DashboardTab() {
  return (
    <>
      <KpiCards />
      <div className="fin-two-cols">
        <BudgetChart />
        <WorkflowPanel />
      </div>
      <OperationsRegister />
      <div className="fin-two-cols">
        <AlertsSection />
        <ReportingSection />
      </div>
    </>
  );
}

function OperationsTab() {
  return <OperationsRegister />;
}

function TresorerieTab() {
  const t = FINANCIAL_DATA.treasury;
  return (
    <>
      <div className="fin-kpi-row">
        <div className="fin-kpi-card"><div className="fin-kpi-label">SOLDE ACTUEL</div><div className="fin-kpi-value" style={{ color: 'var(--green)' }}>{FMT(t.soldeActuel)}</div><div className="fin-kpi-unit">FCFA</div></div>
        <div className="fin-kpi-card"><div className="fin-kpi-label">ENTRÉES (30J)</div><div className="fin-kpi-value" style={{ color: 'var(--blue)' }}>{FMT(t.entrees30j)}</div><div className="fin-kpi-unit">FCFA</div></div>
        <div className="fin-kpi-card"><div className="fin-kpi-label">SORTIES (30J)</div><div className="fin-kpi-value" style={{ color: 'var(--red)' }}>{FMT(t.sorties30j)}</div><div className="fin-kpi-unit">FCFA</div></div>
        <div className="fin-kpi-card"><div className="fin-kpi-label">PROJECTION 30J</div><div className="fin-kpi-value" style={{ color: 'var(--purple)' }}>{FMT(t.projection30j)}</div><div className="fin-kpi-unit">FCFA</div></div>
      </div>
      <div className="fin-section-card">
        <h3 className="fin-section-title">ÉVOLUTION TRÉSORERIE</h3>
        <div className="fin-treasury-chart">
          {t.history.map((h, i) => {
            const maxH = Math.max(...t.history.map(x => x.solde));
            return (
              <div key={i} className="fin-treasury-bar-group">
                <div className="fin-treasury-bar" style={{ height: `${(h.solde / maxH) * 100}%` }}>
                  <span className="fin-treasury-bar-val">{(h.solde / 1000000).toFixed(0)}M</span>
                </div>
                <div className="fin-chart-label">{h.month}</div>
              </div>
            );
          })}
        </div>
      </div>
      <AlertsSection />
    </>
  );
}

function RapprochmentsTab() {
  const getStatClass = (s) => {
    if (s === 'Concordant') return 'tag-green';
    if (s === 'Écart mineur') return 'tag-yellow';
    if (s === 'Écart critique') return 'tag-red';
    return 'tag-muted';
  };
  return (
    <div className="fin-section-card">
      <h3 className="fin-section-title">RAPPROCHEMENTS & APPROBATIONS</h3>
      <table className="table fin-ops-table">
        <thead>
          <tr>
            <th>RÉFÉRENCE</th>
            <th>FOURNISSEUR</th>
            <th className="text-right">MONTANT BC</th>
            <th className="text-right">MONTANT FACTURE</th>
            <th className="text-right">ÉCART</th>
            <th className="text-center">STATUT</th>
            <th>DATE</th>
            <th className="text-center">ACTION</th>
          </tr>
        </thead>
        <tbody>
          {FINANCIAL_DATA.rapprochements.map(r => (
            <tr key={r.id}>
              <td className="font-semibold">{r.reference}</td>
              <td>{r.fournisseur}</td>
              <td className="text-right">{FMT(r.montantBC)} FCFA</td>
              <td className="text-right">{r.montantFacture ? FMT(r.montantFacture) + ' FCFA' : '—'}</td>
              <td className="text-right" style={{ color: r.ecart > 0 ? 'var(--red)' : r.ecart < 0 ? 'var(--blue)' : 'var(--green)' }}>
                {r.ecart !== null ? (r.ecart >= 0 ? '+' : '') + FMT(r.ecart) : '—'}
              </td>
              <td className="text-center"><span className={`tag ${getStatClass(r.statut)}`}>{r.statut}</span></td>
              <td>{r.date}</td>
              <td className="text-center">
                {r.statut === 'Écart critique' && <button className="btn btn-red btn-sm">Investiguer</button>}
                {r.statut === 'En attente facture' && <button className="btn btn-ghost btn-sm">Relancer</button>}
                {r.statut === 'Concordant' && <span className="text-muted text-sm">✓ OK</span>}
                {r.statut === 'Écart mineur' && <button className="btn btn-ghost btn-sm">Accepter</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BudgetVsReelTab() {
  const cats = FINANCIAL_DATA.budgetVsReel.categories;
  return (
    <div className="fin-section-card">
      <h3 className="fin-section-title">BUDGET VS RÉEL — DÉTAIL PAR CATÉGORIE</h3>
      <div className="fin-bvr-grid">
        {cats.map((cat, i) => {
          const solde = cat.budget - cat.reel;
          return (
            <div key={i} className="fin-bvr-card" style={{ borderLeft: `4px solid ${cat.color}` }}>
              <div className="fin-bvr-name">{cat.name}</div>
              <div className="fin-bvr-amounts">
                <span>Budget: <strong>{FMT(cat.budget)}</strong></span>
                <span>Réel: <strong>{FMT(cat.reel)}</strong></span>
              </div>
              <div className="progress-track progress-track-lg" style={{ margin: '10px 0' }}>
                <div className="progress-fill" style={{ background: cat.color, width: `${cat.pct}%` }} />
              </div>
              <div className="fin-bvr-footer">
                <span>{cat.pct}% consommé</span>
                <span style={{ color: 'var(--green)', fontWeight: 600 }}>Solde: {FMT(solde)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReportingTab() {
  return (
    <>
      <ReportingSection />
      <div className="fin-section-card">
        <h3 className="fin-section-title">HISTORIQUE DES RAPPORTS</h3>
        <table className="table fin-ops-table">
          <thead>
            <tr>
              <th>PÉRIODE</th>
              <th>CLIENT</th>
              <th>FORMAT</th>
              <th>DATE DIFFUSION</th>
              <th className="text-center">STATUT</th>
              <th className="text-center">ACTION</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="font-semibold">Avril 2026</td>
              <td>Orange CMR</td>
              <td>PDF, Excel</td>
              <td>03/05/2026</td>
              <td className="text-center"><span className="tag tag-green">Diffusé</span></td>
              <td className="text-center"><button className="btn btn-ghost btn-sm">Télécharger</button></td>
            </tr>
            <tr>
              <td className="font-semibold">Mars 2026</td>
              <td>Orange CMR</td>
              <td>PDF</td>
              <td>05/04/2026</td>
              <td className="text-center"><span className="tag tag-green">Diffusé</span></td>
              <td className="text-center"><button className="btn btn-ghost btn-sm">Télécharger</button></td>
            </tr>
            <tr>
              <td className="font-semibold">Février 2026</td>
              <td>Orange CMR</td>
              <td>PDF, Excel</td>
              <td>03/03/2026</td>
              <td className="text-center"><span className="tag tag-green">Diffusé</span></td>
              <td className="text-center"><button className="btn btn-ghost btn-sm">Télécharger</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

function AuditTab() {
  const getLevelIcon = (l) => {
    if (l === 'success') return '✅';
    if (l === 'warning') return '⚠️';
    if (l === 'error') return '❌';
    return 'ℹ️';
  };
  return (
    <div className="fin-section-card">
      <h3 className="fin-section-title">JOURNAL D'AUDIT & LOGS</h3>
      <table className="table fin-ops-table">
        <thead>
          <tr>
            <th style={{ width: 40 }}></th>
            <th>DATE & HEURE</th>
            <th>UTILISATEUR</th>
            <th>ACTION</th>
            <th>DÉTAIL</th>
          </tr>
        </thead>
        <tbody>
          {FINANCIAL_DATA.auditLogs.map(log => (
            <tr key={log.id}>
              <td className="text-center">{getLevelIcon(log.level)}</td>
              <td className="text-muted">{log.date}</td>
              <td className="font-semibold">{log.user}</td>
              <td><span className={`tag ${log.level === 'success' ? 'tag-green' : log.level === 'warning' ? 'tag-yellow' : log.level === 'error' ? 'tag-red' : 'tag-blue'}`}>{log.action}</span></td>
              <td className="text-muted">{log.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Facturation Client Tab ─── */

function FacturationTab() {
  const fact = FINANCIAL_DATA.facturation;
  const [subTab, setSubTab] = useState('pipeline');

  const getStatutClass = (s) => {
    if (s === 'Encaissée' || s === 'Payée' || s === 'Lettré') return 'tag-green';
    if (s === 'Impayée' || s === 'Non lettré') return 'tag-red';
    if (s === 'Proforma en attente' || s === 'En création') return 'tag-yellow';
    if (s === 'Devis en cours') return 'tag-muted';
    if (s === 'Envoyé') return 'tag-blue';
    if (s === 'Programmé') return 'tag-purple';
    if (s === 'Écart mineur') return 'tag-yellow';
    return 'tag-muted';
  };

  const SUB_TABS = [
    { id: 'pipeline', label: 'Pipeline & Dossiers' },
    { id: 'factures', label: 'Registre Factures' },
    { id: 'relances', label: 'Relances' },
    { id: 'lettrage', label: 'Lettrage' },
    { id: 'echeancier', label: 'Échéancier' },
    { id: 'fonctions', label: 'Fonctions & Règles' },
  ];

  return (
    <>
      {/* KPIs Facturation */}
      <div className="fin-kpi-row" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="fin-kpi-card"><div className="fin-kpi-label">CA FACTURÉ</div><div className="fin-kpi-value" style={{ color: 'var(--blue)' }}>{FMT(fact.caFacture)}</div><div className="fin-kpi-unit">FCFA</div></div>
        <div className="fin-kpi-card"><div className="fin-kpi-label">RESTE À FACTURER</div><div className="fin-kpi-value" style={{ color: 'var(--orange)' }}>{FMT(fact.resteAFacturer)}</div><div className="fin-kpi-unit">FCFA</div></div>
        <div className="fin-kpi-card"><div className="fin-kpi-label">CA ENCAISSÉ</div><div className="fin-kpi-value" style={{ color: 'var(--green)' }}>{FMT(fact.caEncaisse)}</div><div className="fin-kpi-unit">FCFA</div></div>
        <div className="fin-kpi-card"><div className="fin-kpi-label">EN COURS ENCAISSEMENT</div><div className="fin-kpi-value" style={{ color: 'var(--yellow)' }}>{FMT(fact.enCoursEncaissement)}</div><div className="fin-kpi-unit">FCFA</div></div>
        <div className="fin-kpi-card"><div className="fin-kpi-label">DSO MOYEN</div><div className="fin-kpi-value" style={{ color: fact.dso > 30 ? 'var(--red)' : 'var(--green)' }}>{fact.dso} j</div><div className="fin-kpi-sub">{fact.facutresImpayees} facture(s) impayée(s)</div></div>
      </div>

      {/* Sub-tabs */}
      <div className="tab-bar" style={{ marginBottom: 20 }}>
        {SUB_TABS.map(t => (
          <button key={t.id} className={`tab-item ${subTab === t.id ? 'active' : ''}`} onClick={() => setSubTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* Pipeline & Dossiers */}
      {subTab === 'pipeline' && (
        <>
          <div className="fin-section-card">
            <h3 className="fin-section-title">PIPELINE FACTURATION — CYCLE DEVIS → ENCAISSEMENT</h3>
            <div className="fin-pipeline-header">
              {fact.pipelineStages.map((stage, i) => (
                <div key={i} className="fin-pipeline-stage-header">
                  <div className="fin-pipeline-stage-num">{i + 1}</div>
                  <span>{stage}</span>
                  {i < fact.pipelineStages.length - 1 && <div className="fin-pipeline-arrow">→</div>}
                </div>
              ))}
            </div>
          </div>

          <div className="fin-section-card">
            <h3 className="fin-section-title">DOSSIERS CLIENTS</h3>
            <div className="fin-dossiers-list">
              {fact.dossiers.map(d => (
                <div key={d.id} className="fin-dossier-card">
                  <div className="fin-dossier-header">
                    <div>
                      <div className="fin-dossier-client">{d.client}</div>
                      <div className="fin-dossier-ref">{d.reference}</div>
                    </div>
                    <div className="fin-dossier-stage-badge" style={{ background: d.currentStage >= 4 ? 'var(--green)' : d.currentStage >= 3 ? 'var(--blue)' : 'var(--orange)' }}>
                      {fact.pipelineStages[d.currentStage]}
                    </div>
                  </div>
                  <div className="fin-dossier-pipeline">
                    {fact.pipelineStages.map((stage, i) => {
                      const data = i === 0 ? d.devis : i === 1 ? d.avenant : i === 2 ? d.proforma : i === 3 ? d.facture : d.encaissement;
                      const isActive = i <= d.currentStage;
                      const isCurrent = i === d.currentStage;
                      return (
                        <div key={i} className="fin-dossier-step">
                          <div className={`fin-dossier-dot ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}`}>
                            {isActive && data ? '✓' : i + 1}
                          </div>
                          {i < 4 && <div className={`fin-dossier-line ${i < d.currentStage ? 'active' : ''}`} />}
                          <div className="fin-dossier-step-label">{stage}</div>
                          {data && (
                            <div className="fin-dossier-step-info">
                              {data.montant ? `${FMT(data.montant)} FCFA` : ''}
                              {data.statut && <div className="fin-dossier-step-status">{data.statut}</div>}
                            </div>
                          )}
                          {!data && i <= d.currentStage && <div className="fin-dossier-step-info fin-dossier-na">—</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Registre Factures */}
      {subTab === 'factures' && (
        <div className="fin-section-card">
          <h3 className="fin-section-title">REGISTRE DES FACTURES CLIENT</h3>
          <div className="fin-ops-actions">
            <button className="btn btn-orange btn-sm">+ Nouveau Devis</button>
            <button className="btn btn-green btn-sm">+ Émettre Proforma</button>
            <button className="btn btn-ghost btn-sm">+ Facture Finale</button>
            <button className="btn btn-ghost btn-sm">Export Comptable</button>
          </div>
          <table className="table fin-ops-table">
            <thead>
              <tr>
                <th>RÉFÉRENCE</th>
                <th>CLIENT</th>
                <th className="text-right">MONTANT HT</th>
                <th className="text-right">TVA 19,25%</th>
                <th className="text-right">MONTANT TTC</th>
                <th>ÉMISSION</th>
                <th>ÉCHÉANCE</th>
                <th className="text-center">STATUT</th>
                <th>RELANCE</th>
              </tr>
            </thead>
            <tbody>
              {fact.factures.map(f => (
                <tr key={f.id}>
                  <td className="font-semibold">{f.reference}</td>
                  <td>{f.client}</td>
                  <td className="text-right">{FMT(f.montantHT)}</td>
                  <td className="text-right text-muted">{FMT(f.tva)}</td>
                  <td className="text-right font-semibold">{FMT(f.montantTTC)}</td>
                  <td>{f.dateEmission}</td>
                  <td>{f.echeance}</td>
                  <td className="text-center"><span className={`tag ${getStatutClass(f.statut)}`}>{f.statut}</span></td>
                  <td className="text-muted text-sm">{f.relance || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Relances */}
      {subTab === 'relances' && (
        <div className="fin-section-card">
          <h3 className="fin-section-title">RELANCES AUTOMATISÉES</h3>
          <div className="ai-banner" style={{ marginBottom: 16 }}>
            <strong>⚡ Automatisation active</strong> — Relances J-5, J+5, J+15 configurées. Canal : Email + SMS. {fact.facutresImpayees} facture(s) en suivi actif.
          </div>
          <table className="table fin-ops-table">
            <thead>
              <tr>
                <th>FACTURE</th>
                <th>CLIENT</th>
                <th>TYPE</th>
                <th>DATE</th>
                <th>CANAL</th>
                <th className="text-center">STATUT</th>
                <th>RÉPONSE</th>
              </tr>
            </thead>
            <tbody>
              {fact.relances.map(r => (
                <tr key={r.id}>
                  <td className="font-semibold">{r.facture}</td>
                  <td>{r.client}</td>
                  <td><span className={`tag ${r.type.includes('-') ? 'tag-blue' : 'tag-yellow'}`}>{r.type}</span></td>
                  <td>{r.date}</td>
                  <td>{r.canal}</td>
                  <td className="text-center"><span className={`tag ${getStatutClass(r.statut)}`}>{r.statut}</span></td>
                  <td className="text-muted">{r.reponse}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lettrage */}
      {subTab === 'lettrage' && (
        <div className="fin-section-card">
          <h3 className="fin-section-title">LETTRAGE — MATCHING ENCAISSEMENT / FACTURE</h3>
          <div className="ai-banner" style={{ marginBottom: 16 }}>
            <strong>🔗 Matching automatique</strong> — Rapprochement bancaire → facture émise en temps réel. Solde client calculé automatiquement.
          </div>
          <table className="table fin-ops-table">
            <thead>
              <tr>
                <th>FACTURE</th>
                <th>CLIENT</th>
                <th className="text-right">MONTANT FACTURE</th>
                <th className="text-right">ENCAISSEMENT</th>
                <th className="text-right">ÉCART</th>
                <th>DATE MATCH</th>
                <th className="text-center">STATUT</th>
                <th>BANQUE</th>
              </tr>
            </thead>
            <tbody>
              {fact.lettrage.map(l => (
                <tr key={l.id}>
                  <td className="font-semibold">{l.facture}</td>
                  <td>{l.client}</td>
                  <td className="text-right">{FMT(l.montantFacture)} FCFA</td>
                  <td className="text-right">{l.encaissement > 0 ? FMT(l.encaissement) + ' FCFA' : '—'}</td>
                  <td className="text-right" style={{ color: l.ecart === 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                    {l.ecart === 0 ? '0' : FMT(l.ecart)}
                  </td>
                  <td>{l.dateMatch || '—'}</td>
                  <td className="text-center"><span className={`tag ${getStatutClass(l.statut)}`}>{l.statut}</span></td>
                  <td className="text-muted">{l.banque}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Échéancier */}
      {subTab === 'echeancier' && (
        <div className="fin-section-card">
          <h3 className="fin-section-title">ÉCHÉANCIER PRÉVISIONNEL — ENTRÉES & SORTIES</h3>
          <table className="table fin-ops-table">
            <thead>
              <tr>
                <th>MOIS</th>
                <th className="text-right">ENTRÉES PRÉVUES</th>
                <th className="text-right">SORTIES PRÉVUES</th>
                <th className="text-right">SOLDE PRÉVU</th>
                <th className="text-center">TENDANCE</th>
              </tr>
            </thead>
            <tbody>
              {fact.echeancier.map((e, i) => (
                <tr key={i}>
                  <td className="font-semibold">{e.mois}</td>
                  <td className="text-right" style={{ color: 'var(--green)' }}>+{FMT(e.entrees)}</td>
                  <td className="text-right" style={{ color: 'var(--red)' }}>-{FMT(e.sorties)}</td>
                  <td className="text-right font-semibold">{FMT(e.soldePrevu)} FCFA</td>
                  <td className="text-center">
                    {e.entrees >= e.sorties
                      ? <span style={{ color: 'var(--green)', fontSize: 18 }}>↗</span>
                      : <span style={{ color: 'var(--red)', fontSize: 18 }}>↘</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="fin-echeancier-chart">
            {fact.echeancier.map((e, i) => {
              const maxVal = Math.max(...fact.echeancier.map(x => Math.max(x.entrees, x.sorties)));
              return (
                <div key={i} className="fin-ech-bar-group">
                  <div className="fin-ech-bars">
                    <div className="fin-ech-bar" style={{ height: `${(e.entrees / maxVal) * 100}%`, background: 'var(--green)' }} title={`Entrées: ${FMT(e.entrees)}`} />
                    <div className="fin-ech-bar" style={{ height: `${(e.sorties / maxVal) * 100}%`, background: 'var(--red)' }} title={`Sorties: ${FMT(e.sorties)}`} />
                  </div>
                  <div className="fin-chart-label">{e.mois.split(' ')[0]}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fonctions & Règles */}
      {subTab === 'fonctions' && (
        <>
          <div className="fin-section-card">
            <h3 className="fin-section-title">FONCTIONS DU MODULE FACTURATION CLIENT</h3>
            <table className="table fin-ops-table">
              <thead>
                <tr>
                  <th style={{ width: 120 }}>FONCTION</th>
                  <th>DESCRIPTION</th>
                  <th>IMPACT MÉTIER</th>
                </tr>
              </thead>
              <tbody>
                {fact.fonctions.map((fn, i) => (
                  <tr key={i}>
                    <td><span className="fin-func-badge">{fn.name}</span></td>
                    <td className="text-sm">{fn.description}</td>
                    <td className="text-sm" style={{ color: 'var(--dark)', fontWeight: 500 }}>{fn.impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="fin-section-card">
            <h3 className="fin-section-title">RÈGLES MÉTIER AUTOMATISÉES</h3>
            <div className="fin-rules-list">
              {fact.regles.map((r, i) => (
                <div key={i} className="fin-rule-item">
                  <span className="fin-rule-bullet">⚙</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}

/* ─── Main Page ─── */

export default function FinancePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState('dashboard');

  // Mode de vue actif : 'client' par défaut (Cahier des Charges Septembre 2026) | 'agency' (Interne)
  const [activeViewMode, setActiveViewMode] = useState(() => {
    const viewParam = searchParams.get('view');
    if (viewParam === 'agency') return 'agency';
    if (viewParam === 'client') return 'client';
    return 'client';
  });

  const handleSwitchView = (mode) => {
    setActiveViewMode(mode);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('view', mode);
    setSearchParams(newParams, { replace: true });
  };

  const renderAgencyContent = () => {
    switch (activeSection) {
      case 'dashboard': return <DashboardTab />;
      case 'operations': return <OperationsTab />;
      case 'facturation': return <FacturationTab />;
      case 'tresorerie': return <TresorerieTab />;
      case 'rapprochements': return <RapprochmentsTab />;
      case 'budget-reel': return <BudgetVsReelTab />;
      case 'reporting': return <ReportingTab />;
      case 'audit': return <AuditTab />;
      default: return <DashboardTab />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: '100%' }}>
      {/* ─── EN-TÊTE SUPÉRIEUR GLOBAL : SÉLECTEUR DE VUE DUAL CLIENT / AGENCE ─── */}
      <header
        className="bridge-module-switcher"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          padding: '12px 18px',
          background: '#FFFFFF',
          borderRadius: 12,
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: 17, fontWeight: 900, color: 'var(--dark)', margin: 0 }}>
                SUIVI FINANCIER & BUDGET — ORANGE CAMEROUN
              </h1>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: activeViewMode === 'client' ? '#FF7900' : '#1E293B',
                  color: '#FFFFFF',
                  textTransform: 'uppercase',
                }}
              >
                {activeViewMode === 'client' ? 'Vue Client Certifiée' : 'Vue Agence Interne'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              {activeViewMode === 'client'
                ? 'Interface conforme au Cahier des Charges Septembre 2026 — Transparence, Gouvernance & Sécurité Partagée.'
                : 'Supervision financière opérationnelle McCann Bridge, gestion des marges, trésorerie et facturation.'}
            </div>
          </div>
        </div>

        {/* Sélecteur de mode de vue (Segmented Switch) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              display: 'flex',
              padding: 3,
              background: '#F1F5F9',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
            }}
          >
            <button
              type="button"
              onClick={() => handleSwitchView('client')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 800,
                border: 'none',
                background: activeViewMode === 'client' ? '#FF7900' : 'transparent',
                color: activeViewMode === 'client' ? '#FFFFFF' : '#475569',
                cursor: 'pointer',
                boxShadow: activeViewMode === 'client' ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <span>👁️ Vue Client (Cahier des Charges)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchView('agency')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 800,
                border: 'none',
                background: activeViewMode === 'agency' ? '#1E293B' : 'transparent',
                color: activeViewMode === 'agency' ? '#FFFFFF' : '#475569',
                cursor: 'pointer',
                boxShadow: activeViewMode === 'agency' ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <span>🏢 Vue Agence (Interne)</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── RENDU DU MODE CLIENT ─── */}
      {activeViewMode === 'client' && (
        <ClientFinancePage />
      )}

      {/* ─── RENDU DU MODE AGENCE (STRUCTURE ORIGINALE CONSERVÉE) ─── */}
      {activeViewMode === 'agency' && (
        <div className="fin-layout">
          {/* Internal sidebar */}
          <aside className="fin-sidebar">
            <div className="fin-sidebar-header">
              <div className="fin-sidebar-brand">McCANN BRIDGE</div>
              <div className="fin-sidebar-sub">FINANCIAL MANAGER</div>
            </div>
            <nav className="fin-sidebar-nav">
              {FINANCE_SECTIONS.map(s => (
                <button
                  key={s.id}
                  className={`fin-sidebar-item ${activeSection === s.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(s.id)}
                >
                  <span className="fin-sidebar-icon">{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <main className="fin-main">
            <header className="fin-header">
              <div className="fin-header-left">
                <h1 className="fin-title">
                  Cockpit Financier Interne — Client : {FINANCIAL_DATA.client} · {FINANCIAL_DATA.cockpit ? 'Q2' : ''} {FINANCIAL_DATA.year}
                </h1>
              </div>
              <div className="fin-header-right">
                <select className="form-input form-select" style={{ width: 200, padding: '6px 12px' }}>
                  <option>Orange Cameroun</option>
                  <option>MTN Cameroun</option>
                  <option>Tous les clients</option>
                </select>
              </div>
            </header>
            <div className="fin-content animate-fade">
              {renderAgencyContent()}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
