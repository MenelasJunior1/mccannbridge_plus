import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Activity, ArrowUpRight, BarChart3, CalendarDays, ChevronDown, Download,
  Megaphone, RefreshCw, SlidersHorizontal, TrendingUp, Users
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { computeAnalytics, CLIENT_OPTIONS, CHANNEL_OPTIONS, PERIOD_OPTIONS } from './analyticsDataEngine';
import CalendarAnalyticsView from './components/CalendarAnalyticsView';
import AdsAnalyticsView from './components/AdsAnalyticsView';
import FinanceAnalyticsView from './components/FinanceAnalyticsView';
import UsersAnalyticsView from './components/UsersAnalyticsView';
import InfluenceAnalyticsView from './components/InfluenceAnalyticsView';
import ExportModal from './components/ExportModal';

const compactNumber = (value) => new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0);

const dashboardTabs = [
  { id: 'overview', label: 'Vue d’ensemble', icon: BarChart3 },
  { id: 'calendar', label: 'Contenus', icon: CalendarDays },
  { id: 'ads', label: 'Média', icon: Activity },
  { id: 'finance', label: 'Finance', icon: TrendingUp },
  { id: 'users', label: 'Équipe', icon: Users },
  { id: 'influence', label: 'Influence', icon: Megaphone },
];

function DashboardOverview({ data, onNavigate }) {
  const { metrics, breakdowns, trends } = data;
  const chartData = trends.map((item) => ({ ...item, revenue: item.caFacture / 1000000 }));
  const priorityItems = [
    {
      label: 'Budget média consommé',
      detail: `${metrics.tauxConsommation}% du budget engagé`,
      tone: metrics.tauxConsommation > 85 ? 'warning' : 'success',
      tab: 'finance',
    },
    {
      label: 'Contenus en validation',
      detail: `${breakdowns.publicationsByStatus.find((item) => item.key === 'en_validation')?.count || 0} éléments à traiter`,
      tone: 'info',
      tab: 'calendar',
    },
    {
      label: 'Campagnes actives',
      detail: `${data.filteredAds.filter((item) => item.status === 'active').length} campagnes en diffusion`,
      tone: 'success',
      tab: 'ads',
    },
  ];

  return (
    <div className="bridge-dashboard-overview">
      <section className="bridge-dashboard-primary-grid">
        <article className="bridge-dashboard-panel bridge-performance-panel">
          <header>
            <div><span className="bridge-panel-eyebrow">Performance consolidée</span><h2>Évolution de l’activité</h2></div>
            <span className="bridge-period-chip">6 derniers mois</span>
          </header>
          <div className="bridge-chart-legend"><span className="is-blue" /> Publications <span className="is-teal" /> CA en millions FCFA</div>
          <div className="bridge-main-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="bridgePublications" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1556ff" stopOpacity={0.24} /><stop offset="1" stopColor="#1556ff" stopOpacity={0} /></linearGradient>
                  <linearGradient id="bridgeConversions" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#00a999" stopOpacity={0.18} /><stop offset="1" stopColor="#00a999" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid stroke="#edf1f6" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#7b8798', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#7b8798', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ border: '1px solid #e2e7ee', borderRadius: 12, boxShadow: '0 12px 30px rgba(10,29,61,.12)', fontSize: 11 }} />
                <Area type="monotone" dataKey="publications" name="Publications" stroke="#1556ff" strokeWidth={2.5} fill="url(#bridgePublications)" />
                <Area type="monotone" dataKey="revenue" name="CA (M FCFA)" stroke="#00a999" strokeWidth={2} fill="url(#bridgeConversions)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <aside className="bridge-dashboard-panel bridge-priorities-panel">
          <header><div><span className="bridge-panel-eyebrow">À surveiller</span><h2>Priorités du jour</h2></div></header>
          <div className="bridge-priority-list">
            {priorityItems.map((item) => (
              <button type="button" key={item.label} onClick={() => onNavigate(item.tab)}>
                <i className={`tone-${item.tone}`} />
                <span><strong>{item.label}</strong><small>{item.detail}</small></span>
                <ArrowUpRight size={16} />
              </button>
            ))}
          </div>
          <div className="bridge-priority-foot"><span><i /> Données synchronisées</span><small>Vue opérationnelle</small></div>
        </aside>
      </section>

      <section className="bridge-dashboard-secondary-grid">
        <article className="bridge-dashboard-panel bridge-channel-panel">
          <header><div><span className="bridge-panel-eyebrow">Répartition</span><h2>Contenus par canal</h2></div><button type="button" onClick={() => onNavigate('calendar')}>Détails <ArrowUpRight size={14} /></button></header>
          <div className="bridge-channel-list">
            {breakdowns.publicationsByChannel.slice(0, 5).map((channel) => {
              const maximum = Math.max(...breakdowns.publicationsByChannel.map((item) => item.count), 1);
              return <div key={channel.channel}><span>{channel.channel}</span><div><i style={{ width: `${(channel.count / maximum) * 100}%` }} /></div><strong>{channel.count}</strong></div>;
            })}
          </div>
        </article>

        <article className="bridge-dashboard-panel bridge-summary-panel">
          <header><div><span className="bridge-panel-eyebrow">Synthèse</span><h2>Lecture rapide</h2></div></header>
          <div className="bridge-summary-score"><span style={{ '--score': `${Math.min(metrics.sponsoringRate, 100) * 3.6}deg` }}><b>{metrics.sponsoringRate}%</b><small>sponsorisés</small></span></div>
          <p>{metrics.totalSponsoredPubs} publications bénéficient d’un soutien média sur {metrics.totalPublications} contenus suivis.</p>
        </article>

        <article className="bridge-dashboard-panel bridge-team-panel">
          <header><div><span className="bridge-panel-eyebrow">Collaboration</span><h2>Équipe active</h2></div><button type="button" onClick={() => onNavigate('users')}>Voir <ArrowUpRight size={14} /></button></header>
          <strong>{metrics.activeUsersCount}</strong>
          <p>collaborateurs actifs sur l’espace de travail</p>
          <div className="bridge-team-avatars"><span>MK</span><span>CM</span><span>DA</span><span>+{Math.max(metrics.activeUsersCount - 3, 0)}</span></div>
        </article>
      </section>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isAgency: authIsAgency, isClient } = useAuth();
  const { state, isAgency: appIsAgency } = useApp();
  const isAgency = authIsAgency ?? appIsAgency;
  const [activeTab, setActiveTab] = useState('overview');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterClient, setFilterClient] = useState('all');
  const [filterChannel, setFilterChannel] = useState('all');
  const [filterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const analyticsData = useMemo(() => computeAnalytics({
    appContextPublications: state?.publications || state?.calendar || [],
    appContextFinancialDocs: state?.financialDocuments || [],
    appContextInfluencers: state?.influencers || [],
    filterPeriod, filterClient, filterChannel, filterStatus, searchTerm,
  }), [state, filterPeriod, filterClient, filterChannel, filterStatus, searchTerm]);

  if (isClient || user?.role === 'client' || !isAgency) return <Navigate to="/briefs" replace />;

  const metrics = analyticsData.metrics;
  const kpis = [
    { label: 'Publications suivies', value: metrics.totalPublications, note: `${metrics.totalSponsoredPubs} sponsorisées`, icon: CalendarDays, tone: 'blue' },
    { label: 'Investissement média', value: `${compactNumber(metrics.totalAdsSpent)} FCFA`, note: `CTR moyen ${metrics.avgCTR}%`, icon: Activity, tone: 'teal' },
    { label: 'Facturation TTC', value: `${compactNumber(metrics.totalTTC)} FCFA`, note: `${metrics.tauxConsommation}% consommé`, icon: TrendingUp, tone: 'navy' },
    { label: 'Talents actifs', value: metrics.activeInfluencersCount, note: `${metrics.contractsSignedCount} contrats signés`, icon: Megaphone, tone: 'amber' },
  ];

  const refresh = () => {
    setIsRefreshing(true);
    window.setTimeout(() => setIsRefreshing(false), 450);
  };

  return (
    <div className="bridge-dashboard-page">
      <div className="bridge-dashboard-heading">
        <div><span className="bridge-page-eyebrow">Pilotage transversal</span><h1>Vue d’ensemble</h1><p>Les indicateurs essentiels pour décider et agir aujourd’hui.</p></div>
        <div className="bridge-dashboard-actions">
          <button type="button" className={`bridge-action-secondary ${filtersOpen ? 'active' : ''}`} onClick={() => setFiltersOpen(!filtersOpen)}><SlidersHorizontal size={16} /> Filtres <ChevronDown size={14} /></button>
          <button type="button" className="bridge-action-icon" onClick={refresh} aria-label="Actualiser"><RefreshCw size={17} className={isRefreshing ? 'is-spinning' : ''} /></button>
          <button type="button" className="bridge-action-primary" onClick={() => setIsExportModalOpen(true)}><Download size={16} /> Exporter</button>
        </div>
      </div>

      {filtersOpen && (
        <div className="bridge-dashboard-filters">
          <label><span>Période</span><select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)}>{PERIOD_OPTIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <label><span>Client</span><select value={filterClient} onChange={(e) => setFilterClient(e.target.value)}>{CLIENT_OPTIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <label><span>Canal</span><select value={filterChannel} onChange={(e) => setFilterChannel(e.target.value)}>{CHANNEL_OPTIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <label className="bridge-filter-search"><span>Recherche</span><input type="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Campagne, marque, référence…" /></label>
        </div>
      )}

      <div className="bridge-dashboard-kpis">
        {kpis.map(({ label, value, note, icon: Icon, tone }) => (
          <article key={label}>
            <div className={`bridge-kpi-icon tone-${tone}`}><Icon size={20} /></div>
            <span>{label}</span><strong>{value}</strong><small>{note}</small>
          </article>
        ))}
      </div>

      <nav className="bridge-dashboard-tabs" aria-label="Sections analytiques">
        {dashboardTabs.map(({ id, label, icon: Icon }) => <button type="button" key={id} className={activeTab === id ? 'active' : ''} onClick={() => setActiveTab(id)}><Icon size={16} /><span>{label}</span></button>)}
      </nav>

      {activeTab === 'overview' && <DashboardOverview data={analyticsData} onNavigate={setActiveTab} />}
      <div className={activeTab === 'overview' ? '' : 'bridge-dashboard-detail'}>
        {activeTab === 'calendar' && <CalendarAnalyticsView data={analyticsData} />}
        {activeTab === 'ads' && <AdsAnalyticsView data={analyticsData} />}
        {activeTab === 'finance' && <FinanceAnalyticsView data={analyticsData} />}
        {activeTab === 'users' && <UsersAnalyticsView data={analyticsData} />}
        {activeTab === 'influence' && <InfluenceAnalyticsView data={analyticsData} />}
      </div>

      {isExportModalOpen && <ExportModal isOpen onClose={() => setIsExportModalOpen(false)} data={analyticsData} activeTab={activeTab} filterClient={filterClient} filterPeriod={filterPeriod} />}
    </div>
  );
}
