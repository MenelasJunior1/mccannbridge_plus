import { useState, useMemo } from 'react';
import { 
  FileText, Calendar, Sparkles, BarChart2, TrendingUp, 
  Plus, Search, Filter, Download, Layers, Settings, 
  Shield, ShieldCheck, CheckCircle2, Clock, AlertTriangle, ArrowLeft, 
  Database, Brain, Share2, Eye, RefreshCw, ChevronRight,
  MapPin, Mail, Hash, Target
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { REPORT_STATUSES, REPORT_TYPES, BRANDS_LIST } from '../../data/reportsData';

// Dashboard-inspired Ribbon and Perspectives components
import ReportingSwitchboardRibbon from './components/ReportingSwitchboardRibbon';
import ReportingPerspectiveBanner, { REPORTING_PERSPECTIVES } from './components/ReportingPerspectiveBanner';
import ClientSwitchboardRibbon from './components/ClientSwitchboardRibbon';
import ClientPerspectiveBanner, { CLIENT_REPORTING_PERSPECTIVES } from './components/ClientPerspectiveBanner';

// Sub-components aligned with the Dashboard Analytics design system (Agency View)
import ReportExecutiveCockpit from './components/ReportExecutiveCockpit';
import ReportSummaryCards from './components/ReportSummaryCards';
import ReportFilters from './components/ReportFilters';
import ReportRequestsTable from './components/ReportRequestsTable';
import ReportDetailView from './components/ReportDetailView';
import ReportCalendarView from './components/ReportCalendarView';
import ReportDataStudio from './components/ReportDataStudio';
import ReportBenchmarkInsights from './components/ReportBenchmarkInsights';
import ReportLibraryView from './components/ReportLibraryView';
import ReportTemplatesView from './components/ReportTemplatesView';
import ReportAdminSettings from './components/ReportAdminSettings';
import NewReportRequestModal from './components/NewReportRequestModal';
import ReportExportModal from './components/ReportExportModal';

// Dedicated Client View Sub-components (Conformes au Cahier des Charges & Données S38 Septembre 2026)
import ClientExecutiveCockpit from './components/ClientExecutiveCockpit';
import ClientBrandPerformance from './components/ClientBrandPerformance';
import ClientCampaignsContent from './components/ClientCampaignsContent';
import ClientBenchmarkInsights from './components/ClientBenchmarkInsights';
import ClientRecommendationsActionPlan from './components/ClientRecommendationsActionPlan';
import SocialPlatformIcon from '../../components/common/SocialPlatformIcon';

export default function ReportsPage() {
  const { 
    state, 
    addReport, 
    updateReport, 
    updateReportStatus, 
    addReportComment, 
    addReportSpeech, 
    updateReportData, 
    deleteReport 
  } = useApp();
  const { user, isAgency: authIsAgency, isClient: authIsClient } = useAuth();

  const reports = state?.reports || [];
  const currentUser = state?.currentUser || { user: 'Steve BESSOUBE', poste: 'Digital Web Analyst & Media' };
  const isAgency = state?.viewMode === 'agency' || (currentUser?.role || '').toLowerCase().includes('agency') || true;

  // Strict check if current logged user is a Client account
  const isClientAccount = Boolean(authIsClient || user?.role === 'client' || state?.viewMode === 'client');

  // Client view tab state (5 sections according to cahier des charges)
  const [clientTab, setClientTab] = useState('cockpit'); // 'cockpit' | 'brand' | 'campaigns' | 'benchmark' | 'action_plan'
  const [clientPerspective, setClientPerspective] = useState('direction_marketing');
  const [clientPeriod, setClientPeriod] = useState('s38_2026');
  const [clientBrand, setClientBrand] = useState('all');
  const [clientChannel, setClientChannel] = useState('all');
  const [clientDiffusion, setClientDiffusion] = useState('all');
  const [clientCompareMode, setClientCompareMode] = useState(true);

  const handleClientPerspectiveChange = (perspId) => {
    setClientPerspective(perspId);
    const found = CLIENT_REPORTING_PERSPECTIVES.find(p => p.id === perspId);
    if (found?.suggestedTab) {
      setClientTab(found.suggestedTab);
    }
  };

  // Default active view mode to 'client' so that Client accounts and consultants preview the client experience immediately
  const [agencyActiveMode, setAgencyActiveMode] = useState('client'); // 'client' | 'agency'
  const isCurrentlyClientView = isClientAccount || agencyActiveMode === 'client';

  // 5 Client Tabs matching the cahier des charges
  const clientTabs = [
    { id: 'cockpit', label: '1. Cockpit Exécutif', icon: '📊', badge: 'S38 Live' },
    { id: 'brand', label: '2. Performance de la Marque', icon: '📈', badge: '4 Marques' },
    { id: 'campaigns', label: '3. Campagnes & Contenus', icon: '🎯', badge: 'Top Posts' },
    { id: 'benchmark', label: '4. Benchmark & Insights', icon: '⚖️', badge: '3 Espaces' },
    { id: 'action_plan', label: '5. Plan d’Action & Livrables', icon: '📋', badge: 'PDF S38' },
  ];

  // Certified S38 Report Fallback for export modal
  const s38ReportFallback = useMemo(() => {
    return reports.find(r => r.id?.includes('S38') || r.period?.label?.includes('S38')) || {
      id: 'REP-2026-S38-ORANGE',
      title: 'Bilan Hebdomadaire Social Media — Semaine S38 (14 au 20 Septembre 2026)',
      type: 'hebdomadaire',
      client: 'Orange Cameroun',
      brands: ['Orange TELCO', 'Orange Money (OM)', 'Orange Business', 'Orange Pulse'],
      status: 'approved',
      version: 'v2.1 Certifiée',
      priority: 'haute',
      dueDate: '2026-09-21',
      createdAt: '2026-09-21T08:00:00Z',
      period: {
        start: '2026-09-14',
        end: '2026-09-20',
        label: 'Semaine S38 (14 au 20 Septembre 2026) vs S37',
        comparisonType: 'periode_precedente'
      },
      requester: {
        name: 'Patrick Tuete',
        role: 'Head of Digital Marketing',
        email: 'patrick.tuete@orange.cm'
      },
      assignee: {
        name: 'Steve BESSOUBE',
        role: 'Digital Web Analyst & Media'
      },
      channels: ['Facebook', 'Instagram', 'TikTok', 'LinkedIn', 'X (Twitter)', 'YouTube']
    };
  }, [reports]);

  // 7 numbered tabs matching the exact Dashboard Analytics & Platform architecture
  const tabs = [
    { id: 'demandes', label: '1. Registre des Demandes', icon: '📋', badge: `${reports.length}` },
    { id: 'cockpit', label: '2. Cockpit Exécutif 360°', icon: '📊', badge: 'Live' },
    { id: 'livrables', label: '3. Livrables & Fiches PDF', icon: '📄', badge: `${reports.filter(r => r.status === 'delivered' || r.status === 'approved').length}` },
    { id: 'prises_parole', label: '4. Prises de parole & Formats', icon: '⚡' },
    { id: 'benchmark', label: '5. Benchmark & Veille', icon: '🏆', badge: 'SOV' },
    { id: 'calendrier', label: '6. Calendrier & Échéances', icon: '📅' },
    { id: 'modeles_admin', label: '7. Modèles & Administration', icon: '⚙️' },
  ];

  const [activeTab, setActiveTab] = useState('demandes');
  const [currentPerspective, setCurrentPerspective] = useState('analyste');
  const [compareMode, setCompareMode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(
    new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  );

  // Selected report for 360° detail view
  const [selectedReportId, setSelectedReportId] = useState(null);

  // Sub-toggle for Tab 7 (Modèles vs Paramètres)
  const [adminSubTab, setAdminSubTab] = useState('modeles'); // 'modeles' | 'settings'

  // Modals state
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [prefilledTemplate, setPrefilledTemplate] = useState(null);
  const [exportModalReport, setExportModalReport] = useState(null);

  // Filter state for Tab 1 (Demandes)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [activeStatusCardFilter, setActiveStatusCardFilter] = useState('all');

  // Handle Refresh simulation
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastSyncTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    }, 600);
  };

  // Current active report object when viewing details
  const activeReport = useMemo(() => {
    if (!selectedReportId) return null;
    return reports.find(r => r.id === selectedReportId) || null;
  }, [selectedReportId, reports]);

  // Filtered reports for Demandes table
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      // Search text
      const matchesSearch = !searchQuery.trim() || 
        report.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.brands?.some(b => b.toLowerCase().includes(searchQuery.toLowerCase())) ||
        report.context?.campaignName?.toLowerCase().includes(searchQuery.toLowerCase());

      // Brand filter
      const matchesBrand = selectedBrand === 'all' || 
        report.brands?.includes(selectedBrand);

      // Type filter
      const matchesType = selectedType === 'all' || 
        report.type === selectedType;

      // Status dropdown filter
      const matchesStatus = selectedStatus === 'all' || 
        report.status === selectedStatus;

      // Status card click filter
      const matchesCardStatus = activeStatusCardFilter === 'all' || 
        report.status === activeStatusCardFilter ||
        (activeStatusCardFilter === 'late' && report.dueDate && report.dueDate < new Date().toISOString().slice(0, 10) && report.status !== 'delivered') ||
        (activeStatusCardFilter === 'validated' && (report.status === 'approved' || report.status === 'delivered'));

      // Priority filter
      const matchesPriority = selectedPriority === 'all' || 
        report.priority === selectedPriority;

      return matchesSearch && matchesBrand && matchesType && matchesStatus && matchesCardStatus && matchesPriority;
    });
  }, [reports, searchQuery, selectedBrand, selectedType, selectedStatus, activeStatusCardFilter, selectedPriority]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedBrand('all');
    setSelectedType('all');
    setSelectedStatus('all');
    setSelectedPriority('all');
    setActiveStatusCardFilter('all');
  };

  const handleStatusCardFilterChange = (status) => {
    setActiveStatusCardFilter(prev => prev === status ? 'all' : status);
  };

  // Export filtered reports to CSV
  const handleExportFilteredCsv = () => {
    if (filteredReports.length === 0) return;
    const headers = ['ID', 'Titre', 'Type', 'Marques', 'Statut', 'Priorité', 'Échéance', 'Demandeur', 'Analyste'];
    const rows = filteredReports.map(r => [
      r.id,
      `"${(r.title || '').replace(/"/g, '""')}"`,
      r.type,
      `"${(r.brands || []).join(', ')}"`,
      r.status,
      r.priority,
      r.dueDate,
      `"${r.requester?.name || ''}"`,
      `"${r.assignee?.name || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mccann_reporting_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUseTemplate = (template) => {
    setPrefilledTemplate(template);
    setIsNewRequestOpen(true);
  };

  return (
    <div className="reports-analytics-container animate-fadeIn">
      {isCurrentlyClientView ? (
        /* ═══════════════════════════════════════════════════════════════════
           VUE CLIENT CERTIFIÉE (Cahier des charges Septembre 2026 - S38)
           Strictement étanche, décisionnelle et protégée — Design Influence
           ═══════════════════════════════════════════════════════════════════ */
        <div className="dashboard-analytics-page animate-fade" style={{ paddingBottom: 60 }}>
          
          {/* ─── 1. EN-TÊTE DÉCISIONNEL CLIENT (Style Module Influence) ─── */}
          <div className="bridge-module-head flex justify-between items-center flex-wrap gap-14 mb-20">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: '-0.5px', color: 'var(--dark)' }}>
                  REPORTING & INSIGHTS
                </h1>
                <span className="tag tag-orange" style={{ fontSize: 11, fontWeight: 800 }}>
                  MCCANN × ORANGE CAMEROUN
                </span>
                <span className="tag tag-green" style={{ fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <ShieldCheck size={13} /> ESPACE CLIENT CERTIFIÉ
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', color: 'var(--muted)', fontSize: 13 }}>
                Tour de contrôle décisionnelle, performance de marque, campagnes & contenus, benchmark concurrentiel et plan d’action S38.
              </p>
            </div>

            {/* Actions & Synchronisation Live */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {/* Synchronisation Active Badge Card */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  padding: '6px 12px', 
                  borderRadius: 8, 
                  background: '#FFF8F2', 
                  border: '1px solid #FFE0B2' 
                }}
              >
                <span style={{ fontSize: 16 }}>⚡</span>
                <div>
                  <div style={{ fontSize: 9.5, fontWeight: 800, color: '#FF7900', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    SYNCHRONISATION ACTIVE
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--dark)' }}>
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
                <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
                <span>{isRefreshing ? 'Actualisation...' : 'Actualiser'}</span>
              </button>

              <button 
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setClientCompareMode(!clientCompareMode)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 6,
                  borderColor: clientCompareMode ? '#FF7900' : '#D0D0D0',
                  background: clientCompareMode ? '#FFF8F2' : '#FFF',
                  color: clientCompareMode ? '#FF7900' : 'var(--dark)'
                }}
              >
                <span>⚖️</span>
                <span>{clientCompareMode ? 'vs. S37 (Actif)' : 'Période S38 Seule'}</span>
              </button>

              <button 
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setExportModalReport(s38ReportFallback)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 6, 
                  background: '#FF7900', 
                  color: '#FFFFFF',
                  border: 'none',
                  boxShadow: '0 2px 6px rgba(255, 121, 0, 0.3)'
                }}
              >
                <Download size={14} />
                <span>Télécharger Bilan PDF S38</span>
              </button>

              {/* Toggle réservé aux consultants agence */}
              {!isClientAccount && (
                <button
                  type="button"
                  onClick={() => setAgencyActiveMode('agency')}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F4E8FF', color: '#6B21A8', borderColor: '#E9D5FF' }}
                  title="Accéder au registre des demandes et outils de production interne"
                >
                  <span>🛠️</span>
                  <span>Mode Opérationnel Agence</span>
                </button>
              )}
            </div>
          </div>

          {/* ─── 2. THE EXECUTIVE REPORTING SWITCHBOARD (Signature Design Influence) ─── */}
          <ClientSwitchboardRibbon
            activeTab={clientTab}
            onSelectTab={setClientTab}
            selectedBrand={clientBrand}
            compareMode={clientCompareMode}
            lastSyncTime={lastSyncTime}
          />

          {/* ─── 3. MOTEUR DE PERSPECTIVES MÉTIER (Conforme InfluencePerspectiveBanner) ─── */}
          <ClientPerspectiveBanner
            currentPerspective={clientPerspective}
            onChangePerspective={handleClientPerspectiveChange}
            onQuickExport={() => setExportModalReport(s38ReportFallback)}
            onRefresh={handleRefresh}
          />

          {/* ─── 4. BARRE DE NAVIGATION DES ONGLETS (Style Pills Influence) ─── */}
          <div
            className="card mb-20 p-8"
            style={{
              borderRadius: 12,
              border: '1px solid #E0E0E0',
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              alignItems: 'center',
              background: '#FFFFFF',
              marginBottom: 20
            }}
          >
            {clientTabs.map(tab => {
              const isSelected = clientTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setClientTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 14px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'all 0.15s ease',
                    background: isSelected ? '#FF7900' : 'transparent',
                    color: isSelected ? '#FFFFFF' : 'var(--dark)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span style={{ fontSize: 14 }}>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: 10,
                        background: isSelected ? 'rgba(255, 255, 255, 0.25)' : '#F0F0F0',
                        color: isSelected ? '#FFFFFF' : 'var(--muted)'
                      }}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ─── 3. RENDU DES 5 MODULES DU CAHIER DES CHARGES ─── */}
          {clientTab === 'cockpit' && (
            <ClientExecutiveCockpit
              selectedPeriod={clientPeriod}
              onPeriodChange={setClientPeriod}
              selectedBrand={clientBrand}
              onBrandChange={setClientBrand}
              selectedChannel={clientChannel}
              onChannelChange={setClientChannel}
              diffusionType={clientDiffusion}
              onDiffusionTypeChange={setClientDiffusion}
              compareMode={clientCompareMode}
              onToggleCompareMode={() => setClientCompareMode(!clientCompareMode)}
              lastSyncTime={lastSyncTime}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
              onNavigateToTab={(tab) => setClientTab(tab)}
              onOpenExport={() => setExportModalReport(s38ReportFallback)}
            />
          )}

          {clientTab === 'brand' && (
            <ClientBrandPerformance
              selectedBrand={clientBrand}
              onBrandChange={setClientBrand}
              compareMode={clientCompareMode}
            />
          )}

          {clientTab === 'campaigns' && (
            <ClientCampaignsContent />
          )}

          {clientTab === 'benchmark' && (
            <ClientBenchmarkInsights />
          )}

          {clientTab === 'action_plan' && (
            <ClientRecommendationsActionPlan
              onOpenExportModal={() => setExportModalReport(s38ReportFallback)}
            />
          )}

        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════════
           VUE OPÉRATIONNELLE AGENCE (Registre, Modélisation, SLA & Admin)
           ═══════════════════════════════════════════════════════════════════ */
        <div className="agency-view-container animate-fadeIn">
          {/* ─── 1. TOP HEADER (Identique au module Dashboard Analytics) ─── */}
      <div className="bridge-module-head flex justify-between items-start flex-wrap gap-16 mb-20">
        <div>
          <div className="flex items-center gap-10 flex-wrap">
            <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>
              REPORTING & INSIGHTS
            </h1>
            <span className="tag tag-orange" style={{ fontSize: 11, fontWeight: 800 }}>
              MCCANN × ORANGE CAMEROUN
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', color: 'var(--muted)', fontSize: 13 }}>
            Centre de pilotage analytique, production des bilans de performance, SLA de livraison et insights stratégiques 360°.
          </p>
        </div>

        {/* Action buttons & Live Sync Status */}
        <div className="flex items-center gap-12 flex-wrap">
          {/* Live sync chip exactly like Dashboard Analytics */}
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
            style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #D0D0D0', background: '#FFF' }}
          >
            <span>🔄</span> {isRefreshing ? 'Actualisation...' : 'Actualiser'}
          </button>

          <button 
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setCompareMode(!compareMode)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6, 
              border: compareMode ? '1px solid #FF7900' : '1px solid #D0D0D0',
              background: compareMode ? '#FFF8F2' : '#FFF',
              color: compareMode ? '#FF7900' : 'var(--dark)'
            }}
          >
            <span>⚖️</span> {compareMode ? 'Comparatif N-1 Actif' : 'Période Fixe'}
          </button>

          <button 
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setPrefilledTemplate(null);
              setIsNewRequestOpen(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FF7900', color: '#FFF' }}
          >
            <span>+</span> Nouvelle Demande
          </button>

          <button 
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleExportFilteredCsv}
            style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #D0D0D0', background: '#FFF' }}
          >
            <span>📥</span> Exporter Fiche CSV
          </button>
        </div>
      </div>

      {/* ─── 2. THE VISUAL ANALYTICS SWITCHBOARD RIBBON ─── */}
      <ReportingSwitchboardRibbon 
        reports={reports}
        activeTab={activeTab}
        onSelectTab={(tabId) => {
          setSelectedReportId(null);
          setActiveTab(tabId);
        }}
      />

      {/* ─── 3. ROLE & PERSPECTIVES BANNER ─── */}
      <ReportingPerspectiveBanner 
        currentPerspective={currentPerspective}
        onChangePerspective={(roleId) => {
          setCurrentPerspective(roleId);
          const p = REPORTING_PERSPECTIVES.find(item => item.id === roleId);
          if (p?.suggestedTab) {
            setSelectedReportId(null);
            setActiveTab(p.suggestedTab);
          }
        }}
        onQuickExport={handleExportFilteredCsv}
        onRefresh={handleRefresh}
        onNewRequest={() => {
          setPrefilledTemplate(null);
          setIsNewRequestOpen(true);
        }}
      />

      {/* ─── 4. MAIN TABS SWITCHBOARD CARD ─── */}
      <div className="card mb-20 p-12" style={{ borderRadius: 12, background: '#FFF', border: '1px solid #E0E0E0' }}>
        <div className="flex justify-between items-center flex-wrap gap-12">
          {/* Navigation Tabs (Horizontal Scroll on Mobile/Tablet) */}
          <div 
            className="flex gap-6 overflow-x-auto pb-4 md:pb-0" 
            style={{ WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}
            role="tablist"
            aria-label="Navigation Reporting & Insights"
          >
            {tabs.map(tab => {
              const isSelected = activeTab === tab.id && !selectedReportId;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => {
                    setSelectedReportId(null);
                    setActiveTab(tab.id);
                  }}
                  className="btn btn-sm"
                  style={{
                    background: isSelected ? '#FF7900' : 'transparent',
                    color: isSelected ? '#FFFFFF' : 'var(--dark)',
                    fontWeight: isSelected ? 800 : 600,
                    borderRadius: 6,
                    border: isSelected ? 'none' : '1px solid #E5E7EB',
                    whiteSpace: 'nowrap',
                    minHeight: 38,
                    padding: '6px 12px',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span 
                      style={{ 
                        fontSize: 10, 
                        fontWeight: 700,
                        padding: '1px 6px', 
                        borderRadius: 10, 
                        background: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)', 
                        color: isSelected ? '#FFF' : 'var(--dark)' 
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
      </div>

      {/* ─── 5. CONTENU DYNAMIQUE DE L'ONGLET SÉLECTIONNÉ ─── */}
      {selectedReportId && activeReport ? (
        <ReportDetailView
          report={activeReport}
          reports={reports}
          onSelectReport={(id) => setSelectedReportId(id)}
          onBack={() => setSelectedReportId(null)}
          onUpdateStatus={updateReportStatus}
          onAddComment={addReportComment}
          onAddSpeech={addReportSpeech}
          onUpdateData={updateReportData}
          onOpenExport={(rep) => setExportModalReport(rep)}
          isAgency={isAgency}
          currentUser={currentUser}
        />
      ) : (
        <>
          {/* TAB 1: REGISTRE DES DEMANDES */}
          {activeTab === 'demandes' && (
            <div className="space-y-4 animate-fadeIn pb-10">
              
              {/* En-tête de section (Dashboard Analytics Style) */}
              <div className="flex flex-wrap items-center justify-between gap-16 mb-16">
                <div className="flex items-center gap-10">
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: '#FF7900',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      boxShadow: '0 2px 8px rgba(255, 121, 0, 0.25)',
                    }}
                  >
                    📋
                  </div>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--dark)', margin: 0 }}>
                      Registre & Demandes de Reporting — Performance Social Media & Paid
                    </h2>
                    <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, marginTop: 2 }}>
                      Gestion des demandes de bilans, qualification des briefs, cadencement SLA et avancement du workflow
                    </p>
                  </div>
                </div>

                {/* Boutons d'actions */}
                <div className="flex items-center gap-8 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setPrefilledTemplate(null);
                      setIsNewRequestOpen(true);
                    }}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FF7900', color: '#FFF' }}
                  >
                    <Plus size={15} />
                    <span>Nouvelle Demande</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportFilteredCsv}
                    className="btn btn-ghost btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #D0D0D0', background: '#FFF' }}
                  >
                    <Download size={15} />
                    <span>Exporter CSV</span>
                  </button>
                </div>
              </div>

              {/* 4 Macro KPI Cards (Dashboard Analytics Style) */}
              <ReportSummaryCards
                reports={reports}
                activeStatusFilter={activeStatusCardFilter}
                onStatusFilterChange={handleStatusCardFilterChange}
              />

              {/* Panneau de recherche & filtres (Dashboard Analytics Style) */}
              <ReportFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedBrand={selectedBrand}
                onBrandChange={setSelectedBrand}
                selectedType={selectedType}
                onTypeChange={setSelectedType}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                selectedPriority={selectedPriority}
                onPriorityChange={setSelectedPriority}
                onReset={handleResetFilters}
                totalResults={filteredReports.length}
                onExportCsv={handleExportFilteredCsv}
              />

              {/* Table des rapports */}
              <ReportRequestsTable
                reports={filteredReports}
                onSelectReport={(rep) => setSelectedReportId(rep.id)}
                onOpenWorkflow={(rep) => setSelectedReportId(rep.id)}
                onOpenExport={(rep) => setExportModalReport(rep)}
                onDeleteReport={deleteReport}
                isAgency={isAgency}
              />

            </div>
          )}

          {/* TAB 2: COCKPIT EXÉCUTIF 360° */}
          {activeTab === 'cockpit' && (
            <ReportExecutiveCockpit
              reports={reports}
              onNavigateToTab={(tabId) => {
                setSelectedReportId(null);
                setActiveTab(tabId);
              }}
              onOpenNewReport={() => {
                setPrefilledTemplate(null);
                setIsNewRequestOpen(true);
              }}
              onCreateReport={() => {
                setPrefilledTemplate(null);
                setIsNewRequestOpen(true);
              }}
              onSelectReport={(rep) => setSelectedReportId(rep.id)}
            />
          )}

          {/* TAB 3: LIVRABLES & FICHES PDF */}
          {activeTab === 'livrables' && (
            <ReportLibraryView
              reports={reports}
              onSelectReport={(rep) => setSelectedReportId(rep.id)}
              onOpenExport={(rep) => setExportModalReport(rep)}
              onCreateReport={() => {
                setPrefilledTemplate(null);
                setIsNewRequestOpen(true);
              }}
            />
          )}

          {/* TAB 4: PRISES DE PAROLE & FORMATS */}
          {activeTab === 'prises_parole' && (
            <ReportDataStudio
              reports={reports}
              onSelectReport={(rep) => setSelectedReportId(rep.id)}
              onAddSpeech={addReportSpeech}
              onUpdateData={updateReportData}
              isAgency={isAgency}
            />
          )}

          {/* TAB 5: BENCHMARK & VEILLE */}
          {activeTab === 'benchmark' && (
            <ReportBenchmarkInsights
              reports={reports}
              onSelectReport={(rep) => setSelectedReportId(rep.id)}
              onUpdateData={updateReportData}
              isAgency={isAgency}
            />
          )}

          {/* TAB 6: CALENDRIER & ÉCHÉANCES */}
          {activeTab === 'calendrier' && (
            <ReportCalendarView
              reports={reports}
              onSelectReport={(rep) => setSelectedReportId(rep.id)}
            />
          )}

          {/* TAB 7: MODÈLES & ADMINISTRATION */}
          {activeTab === 'modeles_admin' && (
            <div className="space-y-4">
              {/* Sous-onglets de Tab 7 (Dashboard Analytics Style) */}
              <div 
                className="card mb-16 p-10 flex flex-wrap gap-4" 
                style={{ 
                  background: '#FFF', 
                  borderRadius: 10, 
                  border: '1px solid #E0E0E0' 
                }}
              >
                <button
                  type="button"
                  onClick={() => setAdminSubTab('modeles')}
                  className="btn btn-sm"
                  style={{
                    background: adminSubTab === 'modeles' ? '#FF7900' : 'transparent',
                    color: adminSubTab === 'modeles' ? '#FFFFFF' : 'var(--dark)',
                    fontWeight: adminSubTab === 'modeles' ? 800 : 600,
                    borderRadius: 6,
                    border: adminSubTab === 'modeles' ? 'none' : '1px solid #E5E7EB',
                    padding: '6px 14px'
                  }}
                >
                  <Sparkles size={14} className="inline mr-1" />
                  Modèles Types Standardisés
                </button>
                <button
                  type="button"
                  onClick={() => setAdminSubTab('settings')}
                  className="btn btn-sm"
                  style={{
                    background: adminSubTab === 'settings' ? '#FF7900' : 'transparent',
                    color: adminSubTab === 'settings' ? '#FFFFFF' : 'var(--dark)',
                    fontWeight: adminSubTab === 'settings' ? 800 : 600,
                    borderRadius: 6,
                    border: adminSubTab === 'settings' ? 'none' : '1px solid #E5E7EB',
                    padding: '6px 14px'
                  }}
                >
                  <Settings size={14} className="inline mr-1" />
                  Paramètres, Gouvernance & SLA
                </button>
              </div>

              {adminSubTab === 'modeles' ? (
                <ReportTemplatesView
                  onUseTemplate={handleUseTemplate}
                />
              ) : (
                <ReportAdminSettings />
              )}
            </div>
          )}

        </>
      )}

        </div>
      )}

      {/* NOUVELLE DEMANDE MODAL */}
      <NewReportRequestModal
        isOpen={isNewRequestOpen}
        onClose={() => {
          setIsNewRequestOpen(false);
          setPrefilledTemplate(null);
        }}
        onSubmitReport={addReport}
        currentUser={currentUser}
        prefilledTemplate={prefilledTemplate}
      />

      {/* MODAL EXPORT & PARTAGE */}
      {exportModalReport && (
        <ReportExportModal
          isOpen={Boolean(exportModalReport)}
          onClose={() => setExportModalReport(null)}
          report={exportModalReport}
        />
      )}

    </div>
  );
}
