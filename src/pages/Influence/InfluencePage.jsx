import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useInfluenceStore, computeCockpitKpis } from './InfluenceStore';
import { Badge } from './components/InfluenceCommon';

// Nouveaux composants conformes au design Dashboard Analytics & OCM Growth Bridge
import InfluenceSwitchboardRibbon from './components/InfluenceSwitchboardRibbon';
import InfluencePerspectiveBanner, { INFLUENCE_PERSPECTIVES } from './components/InfluencePerspectiveBanner';
import InfluenceExportModal from './components/InfluenceExportModal';
import CockpitInfluence from './components/CockpitInfluence';
import TalentsAmbassadeurs from './components/TalentsAmbassadeurs';
import CampagnesActivations from './components/CampagnesActivations';
import LivrablesValidations from './components/LivrablesValidations';
import ReportingInfluence from './components/ReportingInfluence';
import VeilleStrategique from './components/VeilleStrategique';
import ImportExcel from './components/ImportExcel';

// COMPOSANT DÉDIÉ : VUE CLIENT (Cahier des Charges Influence Septembre 2026)
import ClientInfluencePage from './client/ClientInfluencePage';

// Composants outils métier (historique)
import InfluenceFiche from './sections/InfluenceFiche';
import InfluenceContrats from './sections/InfluenceContrats';
import InfluenceCahierCharges from './sections/InfluenceCahierCharges';
import InfluencePerformance from './sections/InfluencePerformance';
import InfluenceHistorique from './sections/InfluenceHistorique';
import InfluenceFinance from './sections/InfluenceFinance';
import InfluenceCalendrier from './sections/InfluenceCalendrier';
import { ProfileModal, EditModal } from './InfluenceModals';
import { INITIAL_INFLUENCE_TALENTS } from '../../data/influenceSeedData';

export default function InfluencePage() {
  const { talentId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('cockpit');
  const [legacySubTab, setLegacySubTab] = useState('fiche');
  const [currentPerspective, setCurrentPerspective] = useState('traffic_ops');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });

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

  // Store centralisé de l'influence synchronisé avec le classeur Excel
  const {
    data,
    runImport,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    setDeliverableStatus,
    addInsight,
    removeInsight,
    mergeTalents,
    keepTalentsSeparate,
    resetImport
  } = useInfluenceStore();

  // AppContext pour les outils métier historiques
  const { influencers = [], addInfluencer, updateInfluencer, deleteInfluencer } = useApp();
  const [profileInf, setProfileInf] = useState(null);
  const [editInf, setEditInf] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [filters, setFilters] = useState({
    text: '', niche: '', platform: '', type: '', region: '', engagement: '', disponibilite: '', status: ''
  });

  // Liste garantie non vide grâce au fallback sur data.talents et INITIAL_INFLUENCE_TALENTS
  const effectiveInfluencers = useMemo(() => {
    if (Array.isArray(influencers) && influencers.length > 0) return influencers;
    if (Array.isArray(data?.talents) && data.talents.length > 0) return data.talents;
    return INITIAL_INFLUENCE_TALENTS || [];
  }, [influencers, data?.talents]);

  // Helper pour trouver un talent de manière flexible par id ou pseudo
  const findTalentByIdOrPseudo = (idOrPseudo) => {
    if (!idOrPseudo) return null;
    const clean = String(idOrPseudo).toLowerCase().replace(/^@/, '').trim();
    const candidateList = (effectiveInfluencers && effectiveInfluencers.length > 0) ? effectiveInfluencers : (data.talents || []);
    return (
      candidateList.find(inf => {
        const infId = String(inf.id || '').toLowerCase();
        const infPseudo = String(inf.pseudo || '').toLowerCase().replace(/^@/, '');
        const infName = String(inf.name || inf.display_name || '').toLowerCase();
        return (
          infId === clean ||
          infId === `tal-${clean}` ||
          infId === `inf-${clean}` ||
          infPseudo === clean ||
          infName === clean
        );
      }) ||
      (data.talents || []).find(t => {
        const tId = String(t.id || '').toLowerCase();
        const tPseudo = String(t.pseudo || '').toLowerCase().replace(/^@/, '');
        const tName = String(t.display_name || '').toLowerCase();
        return (
          tId === clean ||
          tId === `tal-${clean}` ||
          tPseudo === clean ||
          tName === clean
        );
      })
    );
  };

  // Deep-linking URL: synchronisation automatique des paramètres d'URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const subtabParam = searchParams.get('subtab');
    const targetTalentParam = talentId || searchParams.get('influencerId') || searchParams.get('talentId');

    if (tabParam) {
      if (tabParam === 'fiche') {
        setActiveTab('outils');
        setLegacySubTab('fiche');
      } else if (['cockpit', 'talents', 'campagnes', 'livrables', 'reporting', 'veille', 'import', 'outils'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }

    if (subtabParam) {
      const norm = (subtabParam === 'budget' || subtabParam === 'budgets' || subtabParam === 'paiement' || subtabParam === 'paiements')
        ? 'finance'
        : (subtabParam === 'calendar' ? 'calendrier' : subtabParam);
      if (['fiche', 'contrats', 'cahier', 'performance', 'historique', 'finance', 'calendrier'].includes(norm)) {
        setLegacySubTab(norm);
      }
    }

    if (targetTalentParam) {
      const matched = findTalentByIdOrPseudo(targetTalentParam);
      if (matched) {
        setProfileInf(matched);
        if (!tabParam && !talentId) {
          setActiveTab('talents');
        }
      }
    }
  }, [talentId, searchParams, effectiveInfluencers, data.talents]);

  const handleCloseProfile = () => {
    setProfileInf(null);
    if (talentId) {
      navigate('/influence', { replace: true });
    } else if (searchParams.has('influencerId') || searchParams.has('talentId')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('influencerId');
      newParams.delete('talentId');
      newParams.delete('pseudo');
      setSearchParams(newParams, { replace: true });
    }
  };

  const handleNavigateFromComponent = (tabId, targetTalentId) => {
    if (tabId === 'fiche') {
      setActiveTab('outils');
      setLegacySubTab('fiche');
      if (targetTalentId) {
        const match = findTalentByIdOrPseudo(targetTalentId);
        if (match) setProfileInf(match);
      }
    } else {
      setActiveTab(tabId);
      if (targetTalentId) {
        const match = findTalentByIdOrPseudo(targetTalentId);
        if (match) setProfileInf(match);
      }
    }
  };

  // KPIs consolidés pour le switchboard et les perspectives
  const kpis = useMemo(() => computeCockpitKpis(data), [data]);

  const lastBatch = (data.batches || [])[0];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      const now = new Date();
      setLastSyncTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    }, 450);
  };

  const handleChangePerspective = (perspectiveId) => {
    setCurrentPerspective(perspectiveId);
    const pers = INFLUENCE_PERSPECTIVES.find(p => p.id === perspectiveId);
    if (pers && pers.suggestedTab) {
      setActiveTab(pers.suggestedTab);
    }
  };

  const tabs = [
    { id: 'cockpit', label: 'Vue d’ensemble 360°', icon: '📊', badge: null },
    { id: 'talents', label: 'Talents & Ambassadeurs', icon: '👥', badge: (influencers || []).length },
    { id: 'campagnes', label: 'Campagnes & Activations', icon: '🗂', badge: (data.campaigns || []).filter(c => c && c.isNewlyCreated === true && !c.isDemo && !c.isExample).length },
    { id: 'livrables', label: 'Livrables & Validations', icon: '📄', badge: (data.deliverables || []).length },
    { id: 'reporting', label: 'Reporting & Analyses', icon: '📈', badge: kpis.rate ? `${kpis.rate}%` : null },
    { id: 'veille', label: 'Veille Stratégique', icon: '📡', badge: null },
    { id: 'import', label: 'Import Excel', icon: '📥', badge: (data.batches || []).length || null },
    { id: 'outils', label: 'Outils Métier', icon: '🧰', badge: null }
  ];

  const legacyTabs = [
    { id: 'fiche', label: '1. Fiche Influence' },
    { id: 'contrats', label: '2. Contrats' },
    { id: 'cahier', label: '3. Cahier des charges' },
    { id: 'performance', label: '4. Performance & KPIs' },
    { id: 'historique', label: '5. Historique campagnes' },
    { id: 'finance', label: '6. Budgets & Paiements' },
    { id: 'calendrier', label: '7. Calendrier Influenceurs' }
  ];

  const handleSave = async (form) => {
    if (form.id) {
      await updateInfluencer(form.id, form);
    } else {
      const newId = `INF-${Date.now().toString().slice(-6)}`;
      await addInfluencer({ ...form, id: newId });
    }
    setEditInf(null);
    setShowAdd(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer cet influenceur ?')) {
      await deleteInfluencer(id);
      setProfileInf(null);
    }
  };

  const handleSetInfluencers = async (updaterOrList) => {
    const baseList = (influencers && influencers.length > 0) ? influencers : effectiveInfluencers;
    const updatedList = typeof updaterOrList === 'function' ? updaterOrList(baseList) : updaterOrList;
    if (Array.isArray(updatedList)) {
      for (const inf of updatedList) {
        const old = baseList.find(i => String(i.id) === String(inf.id));
        if (!old) {
          await addInfluencer(inf);
        } else if (JSON.stringify(old) !== JSON.stringify(inf)) {
          await updateInfluencer(inf.id, inf);
        }
      }
    }
  };

  return (
    <div className="dashboard-analytics-page animate-fade" style={{ paddingBottom: 60 }}>
      {/* ─── 1. TOP HEADER AVEC SWITCHER DE VUE CLIENT / AGENCE ─── */}
      <div className="bridge-module-head flex justify-between items-center flex-wrap gap-14 mb-20">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: '-0.5px', color: 'var(--dark)' }}>
              MODULE INFLUENCE & AMBASSADEURS
            </h1>
            <span className="tag tag-orange" style={{ fontSize: 11, fontWeight: 800 }}>
              MCCANN × ORANGE CAMEROUN
            </span>
            {activeViewMode === 'client' && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: 12,
                  background: '#E8F5E9',
                  color: '#2E7D32',
                  border: '1px solid #C8E6C9'
                }}
              >
                Vue Client Conforme Cahier des Charges
              </span>
            )}
          </div>
          <p style={{ margin: '4px 0 0 0', color: 'var(--muted)', fontSize: 13 }}>
            Tour de contrôle, sélection des créateurs, validation des BAT, mesure des performances et veille marché.
          </p>
        </div>

        {/* Switcher de Vue & Boutons d'action */}
        <div className="flex items-center gap-12 flex-wrap">
          {/* Switcher Segmenté de Vue */}
          <div
            style={{
              display: 'flex',
              background: '#F3F4F6',
              padding: 3,
              borderRadius: 8,
              border: '1px solid #E5E7EB'
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
                color: activeViewMode === 'client' ? '#FFFFFF' : '#4B5563',
                cursor: 'pointer',
                boxShadow: activeViewMode === 'client' ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                transition: 'all 0.15s ease'
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
                color: activeViewMode === 'agency' ? '#FFFFFF' : '#4B5563',
                cursor: 'pointer',
                boxShadow: activeViewMode === 'agency' ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <span>🏢 Vue Agence (Interne)</span>
            </button>
          </div>

          {activeViewMode === 'agency' && (
            <>
              <div
                className="card"
                style={{
                  padding: '6px 14px',
                  background: '#FFF8F2',
                  border: '1px solid #FFE0B2',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 0
                }}
              >
                <span style={{ fontSize: 16 }}>⚡</span>
                <div>
                  <div style={{ fontSize: 10, color: '#E65100', fontWeight: 700 }}>SYNCHRONISATION ACTIVE</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--dark)' }}>
                    Flux Connecté • {lastSyncTime}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #D0D0D0' }}
              >
                <span>🔄</span> {isRefreshing ? 'Actualisation...' : 'Actualiser'}
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowAdd(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FFF3E8', color: '#E65100', border: '1px solid #FFD8BE', fontWeight: 700 }}
              >
                <span>+</span> Nouvel influenceur
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setIsExportModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FF7900', color: '#FFF' }}
              >
                <span>📥</span> Exporter Fiche Influence
              </button>
            </>
          )}
        </div>
      </div>

      {/* ─── RENDU SELON LE MODE DE VUE CHOISI ─── */}
      {activeViewMode === 'client' ? (
        <ClientInfluencePage onSwitchToAgencyView={() => handleSwitchView('agency')} />
      ) : (
        <div className="agency-influence-view animate-fade">
          {/* ─── 2. THE VISUAL INFLUENCE SWITCHBOARD RIBBON (Style Dashboard Analytics) ─── */}
      <InfluenceSwitchboardRibbon
        data={data}
        kpis={kpis}
        activeTab={activeTab}
        onSelectTab={(tabId) => setActiveTab(tabId)}
      />

      {/* ─── 3. PERSPECTIVE ROLE BANNER ─── */}
      <InfluencePerspectiveBanner
        currentPerspective={currentPerspective}
        onChangePerspective={handleChangePerspective}
        onQuickExport={() => setIsExportModalOpen(true)}
        onRefresh={handleRefresh}
      />

      {/* ─── 4. BARRE DE NAVIGATION DES ONGLETS (Style Dashboard Analytics) ─── */}
      <div
        className="card mb-20 p-8"
        style={{
          borderRadius: 12,
          border: '1px solid #E0E0E0',
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          alignItems: 'center',
          background: '#FFFFFF',
          marginBottom: 20
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: isActive ? 800 : 600,
                border: 'none',
                background: isActive ? '#FF7900' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--dark)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge !== null && tab.badge !== undefined && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 10,
                    background: isActive ? 'rgba(255,255,255,0.25)' : '#F0F0F0',
                    color: isActive ? '#FFFFFF' : 'var(--muted)'
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── 5. CONTENU DE L'ONGLET ACTIF ─── */}
      {activeTab === 'cockpit' && (
        <CockpitInfluence data={data} onNavigate={handleNavigateFromComponent} />
      )}

      {activeTab === 'talents' && (
        <TalentsAmbassadeurs
          data={data}
          influencers={influencers}
          onEdit={(inf) => setEditInf(inf)}
          onAdd={() => setShowAdd(true)}
          onDelete={(id) => handleDelete(id)}
          onMerge={mergeTalents}
          onKeepSeparate={keepTalentsSeparate}
        />
      )}

      {activeTab === 'campagnes' && (
        <CampagnesActivations
          data={data}
          setStatus={setDeliverableStatus}
          onOpenTalentProfile={(talent) => setProfileInf(talent)}
          onAddCampaign={addCampaign}
          onUpdateCampaign={updateCampaign}
          onDeleteCampaign={deleteCampaign}
        />
      )}

      {activeTab === 'livrables' && (
        <LivrablesValidations
          data={data}
          setStatus={setDeliverableStatus}
          onOpenTalentProfile={(talent) => setProfileInf(talent)}
        />
      )}

      {activeTab === 'reporting' && (
        <ReportingInfluence
          data={data}
          onAddInsight={addInsight}
          onRemoveInsight={removeInsight}
        />
      )}

      {activeTab === 'veille' && (
        <VeilleStrategique />
      )}

      {activeTab === 'import' && (
        <ImportExcel
          data={data}
          onRunImport={runImport}
          onResetImport={resetImport}
        />
      )}

      {/* ─── ONGLET OUTILS MÉTIER (HISTORIQUE) ─── */}
      {activeTab === 'outils' && (
        <div className="flex flex-col gap-16 animate-fade">
          <div className="card p-16" style={{ borderRadius: 12, border: '1px solid #E0E0E0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--dark)', margin: 0 }}>
                  Modules Métier & Gestion Avancée des Fiches
                </h3>
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0 0' }}>
                  Éditeur complet des profils, contrats types, briefs d'influence, performance unitaire et suivi financier.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowAdd(true)}
                style={{ background: '#FF7900', color: '#FFF' }}
              >
                + Nouvel influenceur
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 6,
                padding: '4px',
                background: '#F8F9FA',
                borderRadius: 8,
                overflowX: 'auto'
              }}
            >
              {legacyTabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setLegacySubTab(t.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    border: 'none',
                    background: legacySubTab === t.id ? '#FF7900' : 'transparent',
                    color: legacySubTab === t.id ? '#FFF' : 'var(--dark)',
                    cursor: 'pointer'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {legacySubTab === 'fiche' && (
            <InfluenceFiche
              influencers={effectiveInfluencers}
              setInfluencers={handleSetInfluencers}
              filters={filters}
              setFilters={setFilters}
              onViewProfile={setProfileInf}
              onSelect={setProfileInf}
              onEdit={setEditInf}
              onDelete={handleDelete}
              onAdd={() => setShowAdd(true)}
            />
          )}

          {legacySubTab === 'contrats' && (
            <InfluenceContrats
              influencers={effectiveInfluencers}
              setInfluencers={handleSetInfluencers}
              onSelect={setProfileInf}
              onEdit={setEditInf}
            />
          )}

          {legacySubTab === 'cahier' && (
            <InfluenceCahierCharges
              influencers={effectiveInfluencers}
              setInfluencers={handleSetInfluencers}
            />
          )}

          {legacySubTab === 'performance' && (
            <InfluencePerformance
              influencers={effectiveInfluencers}
              setInfluencers={handleSetInfluencers}
              onSelect={setProfileInf}
            />
          )}

          {legacySubTab === 'historique' && (
            <InfluenceHistorique
              influencers={effectiveInfluencers}
              setInfluencers={handleSetInfluencers}
              onSelect={setProfileInf}
            />
          )}

          {legacySubTab === 'finance' && (
            <InfluenceFinance
              influencers={effectiveInfluencers}
              setInfluencers={handleSetInfluencers}
              onSelect={setProfileInf}
            />
          )}

          {legacySubTab === 'calendrier' && (
            <InfluenceCalendrier
              influencers={effectiveInfluencers}
              setInfluencers={handleSetInfluencers}
              initialInfluencerId={profileInf?.id}
              onSelectInfluencer={setProfileInf}
            />
          )}
        </div>
      )}

      {/* ─── MODALE PROFIL TALENT GLOBALE (Accessible depuis tous les onglets & URL) ─── */}
      {profileInf && (
        <ProfileModal
          inf={profileInf}
          influencer={profileInf}
          onClose={handleCloseProfile}
          onEdit={(inf) => {
            setProfileInf(null);
            setEditInf(inf);
          }}
          onDelete={handleDelete}
          setInfluencers={handleSetInfluencers}
        />
      )}

      {/* ─── MODALE ÉDITION / CRÉATION GLOBALE ─── */}
      {(editInf || showAdd) && (
        <EditModal
          inf={editInf}
          influencer={editInf}
          onClose={() => {
            setEditInf(null);
            setShowAdd(false);
          }}
          onSave={handleSave}
        />
      )}

      {/* ─── MODAL D'EXPORTATION UNIFIÉ (Style Dashboard Analytics) ─── */}
      {isExportModalOpen && (
        <InfluenceExportModal
          data={data}
          kpis={kpis}
          activeTab={activeTab}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}
        </div>
      )}
    </div>
  );
}
