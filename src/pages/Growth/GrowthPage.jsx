import React, { useState } from 'react';
import GrowthDashboard from './sections/GrowthDashboard';
import GrowthIdeas from './sections/GrowthIdeas';
import GrowthExperiments from './sections/GrowthExperiments';
import GrowthFunnel from './sections/GrowthFunnel';
import GrowthAlerts from './sections/GrowthAlerts';
import GrowthRecommendations from './sections/GrowthRecommendations';
import GrowthWorkflows from './sections/GrowthWorkflows';
import GrowthKnowledge from './sections/GrowthKnowledge';
import GrowthConnectors from './sections/GrowthConnectors';
import GrowthAudit from './sections/GrowthAudit';

import GrowthSwitchboardRibbon from './components/GrowthSwitchboardRibbon';
import GrowthPerspectiveBanner, { GROWTH_PERSPECTIVES } from './components/GrowthPerspectiveBanner';
import GrowthExportModal from './components/GrowthExportModal';
import NewGrowthIdeaModal from './components/NewGrowthIdeaModal';

const TABS = [
  { id: 'cockpit', label: 'Cockpit Growth', icon: '🚀', badge: 'LTV/CAC 4.2x' },
  { id: 'ideas', label: "Backlog d'Idées", icon: '💡', badge: 'ICE' },
  { id: 'experiments', label: 'Expériences A/B', icon: '🧪', badge: '4 Actives' },
  { id: 'funnel', label: 'Funnel & Cohortes', icon: '🔄', badge: 'AARRR' },
  { id: 'alerts', label: 'Alertes & Signaux', icon: '🔔', badge: '2 Critiques' },
  { id: 'recommendations', label: 'Recommandations IA', icon: '🤖', badge: 'Gemini' },
  { id: 'workflows', label: 'Automatisation', icon: '⚙️' },
  { id: 'knowledge', label: 'Base de Savoirs', icon: '📚' },
  { id: 'connectors', label: 'Connecteurs', icon: '🔗' },
  { id: 'audit', label: 'Audit & Sécurité', icon: '🛡️' },
];

export default function GrowthPage() {
  const [activeTab, setActiveTab] = useState('cockpit');
  const [currentPerspective, setCurrentPerspective] = useState('growth_ops');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isNewIdeaModalOpen, setIsNewIdeaModalOpen] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('10:15');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRefresh = () => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setLastSyncTime(timeStr);
    showToast('Flux Growth synchronisé avec les traceurs Mixpanel, GA4 et webhooks.');
  };

  const handleChangePerspective = (perspectiveId) => {
    setCurrentPerspective(perspectiveId);
    const pConfig = GROWTH_PERSPECTIVES.find(p => p.id === perspectiveId);
    if (pConfig && pConfig.suggestedTab) {
      setActiveTab(pConfig.suggestedTab);
      showToast(`Perspective "${pConfig.label}" activée — Vue basculée vers ${pConfig.suggestedTab}.`);
    } else {
      showToast(`Perspective métier "${pConfig?.label || perspectiveId}" appliquée.`);
    }
  };

  const handleNewIdeaCreated = (newIdea) => {
    showToast(`Idée "${newIdea.title}" enregistrée au backlog avec un score ICE de ${newIdea.scoreICE.total} pts.`);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'cockpit':
        return <GrowthDashboard onNavigate={setActiveTab} />;
      case 'ideas':
        return <GrowthIdeas onOpenNewIdea={() => setIsNewIdeaModalOpen(true)} />;
      case 'experiments':
        return <GrowthExperiments />;
      case 'funnel':
        return <GrowthFunnel />;
      case 'alerts':
        return <GrowthAlerts />;
      case 'recommendations':
        return (
          <GrowthRecommendations 
            onExecuteAction={(rec) => {
              showToast(`Recommandation "${rec.title}" transmise pour arbitrage.`);
            }} 
          />
        );
      case 'workflows':
        return <GrowthWorkflows />;
      case 'knowledge':
        return <GrowthKnowledge />;
      case 'connectors':
        return <GrowthConnectors />;
      case 'audit':
        return <GrowthAudit />;
      default:
        return <GrowthDashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="growth-page animate-fade" style={{ paddingBottom: 60 }}>
      {/* ─── TOAST DE NOTIFICATION TEMPORELLE ─── */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'rgba(26, 26, 46, 0.95)',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            zIndex: 2000,
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderLeft: '4px solid #FF7900'
          }}
          className="bridge-toast animate-fade"
        >
          <span>🚀</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── EN-TÊTE PRINCIPAL (Style Influence) ─── */}
      <div 
        className="card mb-20 bridge-module-head bridge-growth-head"
        style={{
          background: '#FFFFFF',
          borderRadius: 12,
          padding: '20px 24px',
          border: '1px solid #E0E0E0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          marginBottom: 20
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 20, fontWeight: 900, color: 'var(--dark)', margin: 0, letterSpacing: '-0.3px' }}>
                MODULE GROWTH HACKING & EXPÉRIMENTATIONS
              </h1>
              <span className="tag tag-orange" style={{ fontSize: 11, fontWeight: 800 }}>
                MCCANN × ORANGE CAMEROUN
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, maxWidth: 880, lineHeight: 1.5 }}>
              Tour de contrôle du funnel AARRR, matrice de priorisation ICE, suivi des tests A/B, détection des frictions et arbitrage des leviers de croissance multi-canaux.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: 11,
                fontWeight: 700,
                color: '#27AE60',
                background: 'rgba(39, 174, 96, 0.1)',
                padding: '5px 10px',
                borderRadius: 20,
                border: '1px solid rgba(39, 174, 96, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#27AE60' }}></span>
              SYNCHRONISATION ACTIVE • Flux Connecté • {lastSyncTime}
            </span>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleRefresh}
              style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #D0D0D0', background: '#FFF' }}
              title="Synchroniser les données avec le traceur de conversion"
            >
              <span>🔄</span> Actualiser
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsNewIdeaModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FF7900', color: '#FFF' }}
            >
              <span>💡</span> Proposer une Idée
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsExportModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1A1A2E', color: '#FFF' }}
            >
              <span>📥</span> Exporter Fiche Growth
            </button>
          </div>
        </div>
      </div>

      {/* ─── SWITCHBOARD RIBBON INTERACTIF (Style Influence) ─── */}
      <GrowthSwitchboardRibbon
        activeTab={activeTab}
        onSelectTab={(tabId) => {
          setActiveTab(tabId);
          showToast(`Navigation Switchboard → ${TABS.find(t => t.id === tabId)?.label || tabId}`);
        }}
      />

      {/* ─── BANDEAU PERSPECTIVES MÉTIER (Style Influence) ─── */}
      <GrowthPerspectiveBanner
        currentPerspective={currentPerspective}
        onChangePerspective={handleChangePerspective}
        onQuickExport={() => setIsExportModalOpen(true)}
        onRefresh={handleRefresh}
      />

      {/* ─── BARRE D'ONGLETS DE NAVIGATION (Style Influence) ─── */}
      <div
        className="card mb-20"
        style={{
          background: '#FFFFFF',
          borderRadius: 12,
          padding: 8,
          border: '1px solid #E0E0E0',
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          marginBottom: 20
        }}
      >
        {TABS.map((tab) => {
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
                padding: '9px 14px',
                borderRadius: 8,
                background: isActive ? '#FF7900' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--dark)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: isActive ? 800 : 600,
                fontSize: 12.5,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = '#F9FAFB';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: 16 }}>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 10,
                    background: isActive ? 'rgba(255, 255, 255, 0.28)' : '#F3F4F6',
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

      {/* ─── ZONE PRINCIPALE DE CONTENU DE L'ONGLET ─── */}
      <div className="tab-content-area">
        {renderContent()}
      </div>

      {/* ─── MODALES (Export & Nouvelle Idée) ─── */}
      <GrowthExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        activeTab={activeTab}
        onExport={({ format, scope }) => {
          showToast(`Rapport Growth exporté en ${format.toUpperCase()} (Périmètre : ${scope}).`);
        }}
      />

      <NewGrowthIdeaModal
        isOpen={isNewIdeaModalOpen}
        onClose={() => setIsNewIdeaModalOpen(false)}
        onSubmitIdea={handleNewIdeaCreated}
      />
    </div>
  );
}
