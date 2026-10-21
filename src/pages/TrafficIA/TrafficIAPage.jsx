import React, { useState } from 'react';
import {
  AlertTriangle, CheckCircle2, ChevronDown, CircleGauge, Clock3,
  FileBarChart, Filter, GitBranch, LayoutDashboard, Plus, Search,
  UsersRound, X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { TEAM, POLES } from '../../data/team';
import { TRAFFIC_STATUSES } from '../../data/tickets';
import { getFridayCountdown } from '../../utils/helpers';

// Components & Sections (Vue Agence Interne)
import TrafficKanbanView from './sections/TrafficKanbanView';
import TrafficChronosTimeline from './sections/TrafficChronosTimeline';
import TrafficCompetencesAndLoad from './sections/TrafficCompetencesAndLoad';
import TrafficDependenciesView from './sections/TrafficDependenciesView';
import TrafficSmartAlerts from './sections/TrafficSmartAlerts';

// Modals (Vue Agence)
import TicketDetailModal from './modals/TicketDetailModal';
import NewTicketModal from './modals/NewTicketModal';
import WeeklyTrafficReportModal from './modals/WeeklyTrafficReportModal';

// NOUVEAUX COMPOSANTS DÉDIÉS : VUE CLIENT (Conformes au Cahier des Charges & Design Influence)
import ClientTrafficContextBar from './client/ClientTrafficContextBar';
import ClientTrafficCockpit from './client/ClientTrafficCockpit';
import ClientTrafficPortfolio from './client/ClientTrafficPortfolio';
import ClientTrafficSharedCalendar from './client/ClientTrafficSharedCalendar';
import ClientTrafficRecommendations from './client/ClientTrafficRecommendations';
import ClientTrafficValidationCenter from './client/ClientTrafficValidationCenter';
import ClientTrafficLivrables from './client/ClientTrafficLivrables';
import ClientTrafficGovernance from './client/ClientTrafficGovernance';

// Modals Dédiés Client
import ClientNewBriefModal from './client/ClientNewBriefModal';
import ClientDossierDetailModal from './client/ClientDossierDetailModal';
import ClientValidationModal from './client/ClientValidationModal';
import ClientContentDetailModal from './client/ClientContentDetailModal';

// Données Métier Certifiées S38
import {
  INITIAL_CLIENT_DOSSIERS,
  INITIAL_CLIENT_VALIDATIONS,
  INITIAL_CLIENT_RECOMMENDATIONS,
  INITIAL_CLIENT_CALENDAR_ITEMS,
  INITIAL_CLIENT_LIVRABLES,
} from '../../data/clientTrafficData';

const loadSavedClientDossiers = () => {
  try {
    const saved = localStorage.getItem('bridge_client_dossiers_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(d => d && !d.isDemo && !d.isExample && !d.id?.startsWith('TK-2026-OM-040') && !d.id?.startsWith('TK-2026-PULSE-081') && !d.id?.startsWith('TK-2026-TELCO-102') && !d.id?.startsWith('TK-2026-B2B-015') && !d.id?.startsWith('TK-2026-SPON-094') && !d.id?.startsWith('TK-2026-VEIL-022') && !d.id?.startsWith('TK-2026-REP-S38') && !d.id?.startsWith('TK-2026-REC-003'));
      }
    }
  } catch (e) {}
  return [];
};

const loadSavedClientValidations = () => {
  try {
    const saved = localStorage.getItem('bridge_client_validations_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(v => v && !v.isDemo && !v.isExample && !v.id?.startsWith('VAL-00'));
      }
    }
  } catch (e) {}
  return [];
};

const loadSavedClientRecommendations = () => {
  try {
    const saved = localStorage.getItem('bridge_client_recommendations_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(r => r && !r.isDemo && !r.isExample && !r.id?.startsWith('REC-2026-00'));
      }
    }
  } catch (e) {}
  return [];
};

const loadSavedClientCalendarItems = () => {
  try {
    const saved = localStorage.getItem('bridge_client_calendar_items_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(c => c && !c.isDemo && !c.isExample && !c.id?.startsWith('CAL-00'));
      }
    }
  } catch (e) {}
  return [];
};

const loadSavedClientLivrables = () => {
  try {
    const saved = localStorage.getItem('bridge_client_livrables_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(l => l && !l.isDemo && !l.isExample && !l.id?.startsWith('LIV-2026-'));
      }
    }
  } catch (e) {}
  return [];
};

export default function TrafficIAPage() {
  const {
    tickets = [],
    updateTicketStatus,
    updateTicket,
    reassignTicket,
    addTicket,
    reportTicketBlockage,
    resolveTicketBlockage,
    logTicketHours,
    isAgency,
  } = useApp();

  const { isClient: authIsClient } = useAuth ? useAuth() : { isClient: false };

  // Mode d'affichage actif : par défaut 'client' pour respecter fidèlement la demande du cahier des charges
  const [activeViewMode, setActiveViewMode] = useState(authIsClient ? 'client' : 'agency'); // 'client' | 'agency'

  // ─────────────────────────────────────────────────────────────
  // ÉTATS DE LA VUE CLIENT (Cahier des charges Septembre 2026)
  // ─────────────────────────────────────────────────────────────
  const [clientTab, setClientTab] = useState('cockpit'); // 'cockpit' | 'travaux' | 'calendrier' | 'recommandations' | 'validations' | 'livrables' | 'gouvernance'
  const [selectedPeriod, setSelectedPeriod] = useState('s38_2026');
  const [selectedEntity, setSelectedEntity] = useState('all');
  const [selectedUniverse, setSelectedUniverse] = useState('all');
  const [lastSyncTime, setLastSyncTime] = useState('15:50');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Données dynamiques de la vue client (sans données exemples)
  const [clientDossiers, setClientDossiers] = useState(loadSavedClientDossiers);
  const [clientValidations, setClientValidations] = useState(loadSavedClientValidations);
  const [clientRecommendations, setClientRecommendations] = useState(loadSavedClientRecommendations);
  const [clientCalendarItems, setClientCalendarItems] = useState(loadSavedClientCalendarItems);
  const [clientLivrables, setClientLivrables] = useState(loadSavedClientLivrables);

  // Sauvegarde automatique lors des modifications
  React.useEffect(() => {
    try {
      localStorage.setItem('bridge_client_dossiers_v2', JSON.stringify(clientDossiers));
    } catch (e) {}
  }, [clientDossiers]);

  React.useEffect(() => {
    try {
      localStorage.setItem('bridge_client_validations_v2', JSON.stringify(clientValidations));
    } catch (e) {}
  }, [clientValidations]);

  React.useEffect(() => {
    try {
      localStorage.setItem('bridge_client_recommendations_v2', JSON.stringify(clientRecommendations));
    } catch (e) {}
  }, [clientRecommendations]);

  React.useEffect(() => {
    try {
      localStorage.setItem('bridge_client_calendar_items_v2', JSON.stringify(clientCalendarItems));
    } catch (e) {}
  }, [clientCalendarItems]);

  React.useEffect(() => {
    try {
      localStorage.setItem('bridge_client_livrables_v2', JSON.stringify(clientLivrables));
    } catch (e) {}
  }, [clientLivrables]);

  // Modals de la vue client
  const [isClientNewBriefOpen, setIsClientNewBriefOpen] = useState(false);
  const [selectedClientDossier, setSelectedClientDossier] = useState(null);
  const [selectedClientValidation, setSelectedClientValidation] = useState(null);
  const [validationModalActionType, setValidationModalActionType] = useState('commenter');
  const [selectedClientContent, setSelectedClientContent] = useState(null);

  // ─────────────────────────────────────────────────────────────
  // ÉTATS DE LA VUE AGENCE INTERNE (Préservés)
  // ─────────────────────────────────────────────────────────────
  const [currentAgencyRole, setCurrentAgencyRole] = useState(isAgency ? 'traffic_manager' : 'demandeur');
  const [selectedExecutantId, setSelectedExecutantId] = useState('t1');
  const [agencyActiveTab, setAgencyActiveTab] = useState('kanban');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedPoleFilter, setSelectedPoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterAccordionOpen, setIsFilterAccordionOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [isWeeklyReportOpen, setIsWeeklyReportOpen] = useState(false);

  // Friday countdown
  const fridayCount = getFridayCountdown();
  const alertCount = tickets.filter(t => t.blockage?.isBlocked || (t.status !== 'delivered' && t.daysLeft <= 1) || t.status === 'client_review').length;
  const activeFiltersCount = (selectedPoleFilter !== 'all' ? 1 : 0) + (searchQuery ? 1 : 0) + (selectedStatusFilter !== 'all' ? 1 : 0);

  // ─────────────────────────────────────────────────────────────
  // ACTIONS MÉTIER DE LA VUE CLIENT
  // ─────────────────────────────────────────────────────────────

  // 1. Approbation rapide d'une validation Orange
  const handleQuickApproveValidation = (validationId) => {
    setClientValidations(prev =>
      prev.map(v => (v.id === validationId ? { ...v, status: 'approuve' } : v))
    );
    // Mettre à jour le dossier correspondant si existant
    setClientDossiers(prev =>
      prev.map(d => {
        const val = clientValidations.find(v => v.id === validationId);
        if (val && d.id === val.ticketId) {
          return {
            ...d,
            clientStatus: 'production',
            nextStep: 'Validation enregistrée • Déploiement en production régie',
            risk: { level: 'vert', cause: 'Validé par Orange', consequence: 'Planning nominal', decisionDate: 'Terminé', recommendedAction: 'Suivre la diffusion' }
          };
        }
        return d;
      })
    );
    showToast('Validation validée avec succès ! Le flux de production a été notifié.');
  };

  // 2. Traitement d'action modale (commenter, modifier, repousser, refuser)
  const handleSubmitValidationAction = ({ validationId, actionType, comment, postponedDate }) => {
    setClientValidations(prev =>
      prev.map(v => {
        if (v.id === validationId) {
          return {
            ...v,
            status: actionType === 'refuser' ? 'refuse' : 'en_attente',
            whatIsExpected: actionType === 'modifier' ? `Ajustements requis : ${comment}` : v.whatIsExpected,
            deadline: actionType === 'repousser' ? `Repoussé au ${postponedDate}` : v.deadline,
          };
        }
        return v;
      })
    );
    showToast(`Action "${actionType}" enregistrée et transmise à McCann Douala.`);
  };

  // 3. Arbitrage direct d'une recommandation digitale
  const handleUpdateRecommendationDecision = (recId, decision) => {
    setClientRecommendations(prev =>
      prev.map(r => (r.id === recId ? { ...r, clientDecision: decision } : r))
    );
  };

  // 4. Création d'un nouveau brief structuré
  const handleSubmitNewBrief = (briefData) => {
    const newId = `TK-2026-BRIEF-${Math.floor(Math.random() * 800 + 100)}`;
    const newDossier = {
      id: newId,
      title: briefData.title,
      brand: briefData.brand,
      universe: 'social_media',
      type: 'crea',
      typeLabel: 'Nouveau Brief Structuré',
      aarrr: briefData.aarrr,
      priority: briefData.urgency.includes('P0') ? 'critique' : 'normale',
      mccannLead: { name: 'Directeur Conseil', role: 'Coordination Traffic', email: 'traffic@mccann.cm' },
      orangeContact: { name: briefData.orangeValidator, role: 'Validateur Orange', email: 'validation@orange.cm' },
      clientStatus: 'nouvelle_demande',
      nextStep: 'Prise en charge par le Traffic McCann pour qualification et estimation',
      deadline: briefData.desiredDeadline || '2026-09-30',
      risk: {
        level: 'vert',
        cause: 'Nouveau brief qualifié avec succès',
        consequence: 'En cours d’analyse',
        decisionDate: 'Cadrage sous 24h',
        recommendedAction: 'Attendre le retour de cadrage McCann',
      },
      lastActivity: 'Brief créé et synchronisé • À l’instant',
      timeline: [
        { step: 1, label: 'Demande créée', done: true, date: 'Aujourd’hui', user: briefData.orangeValidator },
        { step: 2, label: 'Brief complété', done: true, date: 'Aujourd’hui', user: briefData.orangeValidator },
        { step: 3, label: 'Cadrage et estimation partagés', done: false, date: 'En cours', user: 'Traffic McCann' },
        { step: 4, label: 'Planification confirmée', done: false, date: 'À venir', user: 'Traffic McCann' },
      ],
      assets: [],
    };

    setClientDossiers(prev => [newDossier, ...prev]);
    setClientTab('travaux');
    showToast(`Le brief ${newId} a été transmis à McCann Douala avec succès.`);
  };

  // 5. Rafraîchissement simulé
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const now = new Date();
      setLastSyncTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
      setIsRefreshing(false);
    }, 400);
  };

  return (
    <div className="traffic-manager-page bridge-traffic-page animate-fade">
      <header className="bridge-editorial-page-head bridge-traffic-head">
        <div>
          <span className="bridge-page-index">02 / TRAFFIC</span>
          <h1>Traffic<br />manager</h1>
          <p>Coordonnez la charge, les délais et les arbitrages depuis une seule ligne de commande.</p>
        </div>
        <div className="bridge-traffic-head-actions">
          <div className="bridge-view-switcher" aria-label="Perspective d’affichage">
            <button type="button" className={activeViewMode === 'client' ? 'active' : ''} onClick={() => setActiveViewMode('client')}>Client</button>
            <button type="button" className={activeViewMode === 'agency' ? 'active' : ''} onClick={() => setActiveViewMode('agency')}>Agence</button>
          </div>
          <div className="bridge-deadline">
            <Clock3 size={17} />
            <span><small>Clôture vendredi, 17 h</small><strong>{fridayCount.days}j {fridayCount.hours}h {fridayCount.minutes}m</strong></span>
          </div>
          {activeViewMode === 'client' ? (
            <button className="bridge-primary-action" onClick={() => setIsClientNewBriefOpen(true)}><Plus size={17} /> Nouveau brief</button>
          ) : (
            <div className="bridge-head-button-row">
              <button className="bridge-secondary-action" onClick={() => setIsWeeklyReportOpen(true)}><FileBarChart size={16} /> Rapport</button>
              <button className="bridge-primary-action" onClick={() => setIsNewTicketOpen(true)}><Plus size={17} /> Nouveau ticket</button>
            </div>
          )}
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 🅰️ RENDU PRINCIPAL : VUE CLIENT (CAHIER DES CHARGES SEPT. 2026)    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeViewMode === 'client' && (
        <div className="client-traffic-view-container space-y-20 animate-fade">
          {/* Contexte & filtres métier */}
          <ClientTrafficContextBar
            selectedPeriod={selectedPeriod}
            onChangePeriod={setSelectedPeriod}
            selectedEntity={selectedEntity}
            onChangeEntity={setSelectedEntity}
            selectedUniverse={selectedUniverse}
            onChangeUniverse={setSelectedUniverse}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            lastSyncTime={lastSyncTime}
            onQuickNav={setClientTab}
            validationsCount={clientValidations.filter(v => v.status === 'en_attente').length}
            dossiersCount={clientDossiers.length}
          />

          {/* Navigation principale des 7 sections client */}
          <div
            className="card mb-20 p-8"
            style={{
              borderRadius: 12,
              background: '#FFFFFF',
              border: '1px solid #E0E0E0',
            }}
          >
            <div
              className="flex gap-6 overflow-x-auto pb-4 md:pb-0"
              style={{ WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}
              role="tablist"
              aria-label="Navigation Vue Client Traffic"
            >
              {[
                { id: 'cockpit', label: '01. Mon cockpit', badge: null },
                { id: 'travaux', label: '02. Travaux en cours', badge: clientDossiers.length },
                { id: 'calendrier', label: '03. Calendrier partagé', badge: clientCalendarItems.length },
                { id: 'recommandations', label: '04. Recommandations', badge: clientRecommendations.length },
                { id: 'validations', label: '05. Mes validations', badge: clientValidations.filter(v => v.status === 'en_attente').length, isAlert: true },
                { id: 'livrables', label: '06. Livrables et bilans', badge: clientLivrables.length },
                { id: 'gouvernance', label: '07. Historique et gouvernance', badge: null },
              ].map(tab => {
                const isActive = clientTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setClientTab(tab.id)}
                    className="btn btn-sm"
                    style={{
                      background: isActive ? '#FF7900' : 'transparent',
                      color: isActive ? '#FFFFFF' : 'var(--dark)',
                      fontWeight: 800,
                      borderRadius: 8,
                      border: isActive ? 'none' : '1px solid #E5E7EB',
                      whiteSpace: 'nowrap',
                      minHeight: 40,
                      padding: '8px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.15s ease',
                      boxShadow: isActive ? '0 2px 6px rgba(255, 121, 0, 0.3)' : 'none',
                    }}
                  >
                    <span>{tab.label}</span>
                    {tab.badge !== null && tab.badge > 0 && (
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 900,
                          padding: '1px 6px',
                          borderRadius: 10,
                          background: isActive ? 'rgba(0,0,0,0.25)' : tab.isAlert ? '#FF7900' : '#E5E7EB',
                          color: isActive ? '#FFFFFF' : tab.isAlert ? '#FFFFFF' : '#4B5563',
                        }}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Rendu Dynamique des 7 Sections Client */}
          {clientTab === 'cockpit' && (
            <ClientTrafficCockpit
              dossiers={clientDossiers}
              validations={clientValidations}
              recommendations={clientRecommendations}
              calendarItems={clientCalendarItems}
              livrables={clientLivrables}
              onNavigateTab={setClientTab}
              onOpenValidation={(val) => {
                setSelectedClientValidation(val);
                setValidationModalActionType('commenter');
              }}
              onOpenDossier={setSelectedClientDossier}
              onOpenNewBrief={() => setIsClientNewBriefOpen(true)}
            />
          )}

          {clientTab === 'travaux' && (
            <ClientTrafficPortfolio
              dossiers={clientDossiers}
              onOpenDossier={setSelectedClientDossier}
              onOpenNewBrief={() => setIsClientNewBriefOpen(true)}
              selectedEntity={selectedEntity}
              selectedUniverse={selectedUniverse}
            />
          )}

          {clientTab === 'calendrier' && (
            <ClientTrafficSharedCalendar
              calendarItems={clientCalendarItems}
              onOpenContentDetail={setSelectedClientContent}
              onOpenNewContent={() => setIsClientNewBriefOpen(true)}
              selectedEntity={selectedEntity}
            />
          )}

          {clientTab === 'recommandations' && (
            <ClientTrafficRecommendations
              recommendations={clientRecommendations}
              onUpdateDecision={handleUpdateRecommendationDecision}
              onOpenNewProposal={() => setIsClientNewBriefOpen(true)}
              selectedEntity={selectedEntity}
            />
          )}

          {clientTab === 'validations' && (
            <ClientTrafficValidationCenter
              validations={clientValidations}
              onOpenValidationModal={(val, action) => {
                setSelectedClientValidation(val);
                setValidationModalActionType(action);
              }}
              onQuickApprove={handleQuickApproveValidation}
              selectedEntity={selectedEntity}
            />
          )}

          {clientTab === 'livrables' && (
            <ClientTrafficLivrables
              livrables={clientLivrables}
              selectedEntity={selectedEntity}
              selectedPeriod={selectedPeriod}
            />
          )}

          {clientTab === 'gouvernance' && (
            <ClientTrafficGovernance />
          )}

          {/* 6. Modals Dédiés Client */}
          <ClientNewBriefModal
            isOpen={isClientNewBriefOpen}
            onClose={() => setIsClientNewBriefOpen(false)}
            onSubmitBrief={handleSubmitNewBrief}
          />

          <ClientDossierDetailModal
            dossier={selectedClientDossier}
            isOpen={Boolean(selectedClientDossier)}
            onClose={() => setSelectedClientDossier(null)}
          />

          <ClientValidationModal
            validation={selectedClientValidation}
            actionType={validationModalActionType}
            isOpen={Boolean(selectedClientValidation)}
            onClose={() => setSelectedClientValidation(null)}
            onSubmitAction={handleSubmitValidationAction}
          />

          <ClientContentDetailModal
            content={selectedClientContent}
            isOpen={Boolean(selectedClientContent)}
            onClose={() => setSelectedClientContent(null)}
            onValidate={(content) => {
              showToast(`Contenu « ${content.title || content.network} » validé avec succès.`);
              setSelectedClientContent(null);
            }}
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 🅱️ RENDU VUE AGENCE (INTERNE MCCANN)                                */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeViewMode === 'agency' && (
        <div className="agency-traffic-view-container bridge-agency-traffic animate-fade">
          <section className="bridge-traffic-stats" aria-label="Indicateurs Traffic">
            <article><span>Tickets actifs</span><strong>{tickets.filter((ticket) => ticket.status !== 'delivered').length}</strong><small>Flux en cours</small></article>
            <article><span>Priorités</span><strong>{tickets.filter((ticket) => ticket.priority === 'p0_urgent').length}</strong><small>Intervention immédiate</small></article>
            <article><span>Blocages</span><strong>{tickets.filter((ticket) => ticket.blockage?.isBlocked).length}</strong><small>Arbitrages requis</small></article>
            <article><span>Revue client</span><strong>{tickets.filter((ticket) => ticket.status === 'client_review').length}</strong><small>Décisions attendues</small></article>
          </section>

          <div className="bridge-traffic-toolbar">
            <div className="bridge-traffic-tabs" role="tablist" aria-label="Modes d'affichage Traffic">
                {[
                  { id: 'kanban', label: 'Switchboard', icon: LayoutDashboard },
                  { id: 'chronos', label: 'Chronologie', icon: Clock3 },
                  { id: 'load', label: 'Charge équipe', icon: UsersRound },
                  { id: 'dependencies', label: 'Dépendances', icon: GitBranch },
                  { id: 'alerts', label: `Alertes ${alertCount}`, icon: AlertTriangle },
                ].map(tab => {
                  const TabIcon = tab.icon;
                  return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={agencyActiveTab === tab.id}
                    onClick={() => setAgencyActiveTab(tab.id)}
                    className={agencyActiveTab === tab.id ? 'active' : ''}
                  >
                    <TabIcon size={16} /> {tab.label}
                  </button>
                );})}
            </div>

              <div className="bridge-traffic-tools">
                <label className="bridge-role-select">
                  <span className="sr-only">Perspective métier</span>
                  <CircleGauge size={15} />
                  <select value={currentAgencyRole} onChange={(event) => setCurrentAgencyRole(event.target.value)}>
                    <option value="traffic_manager">Traffic manager</option>
                    <option value="demandeur">Demandeur</option>
                    <option value="observateur">Observateur</option>
                    <option value="executant">Exécutant</option>
                    <option value="finance">Finance</option>
                  </select>
                </label>
                <button
                  type="button"
                  className={`bridge-filter-trigger ${isFilterAccordionOpen ? 'active' : ''}`}
                  onClick={() => setIsFilterAccordionOpen(!isFilterAccordionOpen)}
                  aria-expanded={isFilterAccordionOpen}
                >
                  <Filter size={15} /> Filtres
                  {activeFiltersCount > 0 && (
                    <span>{activeFiltersCount}</span>
                  )}
                  <ChevronDown size={14} />
                </button>
              </div>

            <div
              id="trafficFiltersContent"
              className={`traffic-filters-collapsible ${isFilterAccordionOpen ? 'is-expanded' : ''}`}
            >
              <div className="bridge-traffic-filter-grid">
                <div>
                  <label htmlFor="trafficPoleFilter" className="sr-only">Pôle</label>
                  <select
                    id="trafficPoleFilter"
                    className="form-control w-full"
                    value={selectedPoleFilter}
                    onChange={e => setSelectedPoleFilter(e.target.value)}
                  >
                    <option value="all">Tous les pôles</option>
                    {POLES.map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div className="bridge-traffic-search">
                  <label htmlFor="trafficSearchQuery" className="sr-only">Rechercher</label>
                  <Search size={15} />
                  <input
                    id="trafficSearchQuery"
                    type="search"
                    className="form-control w-full"
                    placeholder="Titre, identifiant ou marque…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>

                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    className="bridge-reset-filters"
                    onClick={() => { setSelectedPoleFilter('all'); setSearchQuery(''); setSelectedStatusFilter('all'); }}
                  >
                    <X size={14} /> Réinitialiser
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Active Tab View Rendering (Vue Agence) */}
          {agencyActiveTab === 'kanban' && (
            <TrafficKanbanView
              tickets={tickets}
              currentRole={currentAgencyRole}
              activeExecutantId={selectedExecutantId}
              selectedStatusFilter={selectedStatusFilter}
              selectedPoleFilter={selectedPoleFilter}
              searchQuery={searchQuery}
              onSelectTicket={setSelectedTicket}
              onUpdateStatus={updateTicketStatus}
              onOpenNewTicket={() => setIsNewTicketOpen(true)}
            />
          )}

          {agencyActiveTab === 'chronos' && (
            <TrafficChronosTimeline
              tickets={tickets}
              onSelectTicket={setSelectedTicket}
            />
          )}

          {agencyActiveTab === 'load' && (
            <TrafficCompetencesAndLoad
              tickets={tickets}
              onReassignTicket={reassignTicket}
              onSelectTicket={setSelectedTicket}
            />
          )}

          {agencyActiveTab === 'dependencies' && (
            <TrafficDependenciesView
              tickets={tickets}
              onSelectTicket={setSelectedTicket}
            />
          )}

          {agencyActiveTab === 'alerts' && (
            <TrafficSmartAlerts
              tickets={tickets}
              onSelectTicket={setSelectedTicket}
              onResolveBlockage={resolveTicketBlockage}
            />
          )}

          {/* Ticket Detail & Action Modal (Vue Agence) */}
          {selectedTicket && (
            <TicketDetailModal
              ticket={selectedTicket}
              onClose={() => setSelectedTicket(null)}
              currentRole={currentAgencyRole}
              activeExecutantId={selectedExecutantId}
              onUpdateStatus={updateTicketStatus}
              onReassign={reassignTicket}
              onUpdateTicket={updateTicket}
              onReportBlockage={reportTicketBlockage}
              onResolveBlockage={resolveTicketBlockage}
              onLogHours={logTicketHours}
            />
          )}

          {/* New Ticket / Brief Modal (Vue Agence) */}
          {isNewTicketOpen && (
            <NewTicketModal
              currentRole={currentAgencyRole}
              onClose={() => setIsNewTicketOpen(false)}
              onAddTicket={addTicket}
            />
          )}

          {/* Weekly Digest Modal (Vue Agence) */}
          {isWeeklyReportOpen && (
            <WeeklyTrafficReportModal
              tickets={tickets}
              onClose={() => setIsWeeklyReportOpen(false)}
            />
          )}
        </div>
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className="bridge-toast animate-fade"
        >
          <CheckCircle2 size={17} />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="bridge-toast-close"
            aria-label="Fermer"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

