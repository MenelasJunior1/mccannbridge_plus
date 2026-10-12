import { useState, useMemo, useRef } from 'react';
import { CM_DATA } from '../../../data/community';
import { useApp } from '../../../context/AppContext';
import PublicationImageManager, { processImageFile, BRAND_IMAGE_PRESETS } from './PublicationImageManager';
import PostSponsoringSection, { getNormalizedSponsoring } from './PostSponsoringSection';
import { 
  getPostPerformance, 
  formatMetricNumber, 
  formatCompactNumber, 
  buildPerformancePayload 
} from './calendarMetrics';
import './calendar.css';

export default function AdvancedCalendar({ onOpenArchive }) {
  const calData = CM_DATA.advancedCalendar;
  const { 
    calendarPosts = [], 
    addCalendarPost, 
    updateCalendarPost, 
    deleteCalendarPost, 
    addPublication 
  } = useApp();

  // ─── State Management ───
  const [viewMode, setViewMode] = useState('week'); // 'month' | 'week' | 'day'
  const [activeNav, setActiveNav] = useState('calendar'); // 'calendar' | 'queue' | 'drafts' | 'campaigns'
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Filters
  const [filterClient, setFilterClient] = useState('All');
  const [filterCanal, setFilterCanal] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [viewModalPost, setViewModalPost] = useState(null);
  const [viewModalImgError, setViewModalImgError] = useState(false);
  const [showViewModalImageEditor, setShowViewModalImageEditor] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [isEditingPostUrl, setIsEditingPostUrl] = useState(false);
  const [postUrlInput, setPostUrlInput] = useState('');
  const [copiedLinkNotification, setCopiedLinkNotification] = useState(false);
  const [editModalState, setEditModalState] = useState(null); // null | { mode: 'create'|'edit', data: {...} }
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [isEditingMetrics, setIsEditingMetrics] = useState(false);
  const [metricInputs, setMetricInputs] = useState({
    vues: '',
    likes: '',
    commentaires: '',
    partages: '',
    engagement: ''
  });
  const [metricsSaveSuccess, setMetricsSaveSuccess] = useState(false);
  const viewModalFileInputRef = useRef(null);

  // Safe external URL helper to avoid relative navigation
  const formatExternalUrl = (url) => {
    if (!url) return '#';
    const trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  // Preset image thumbnails using verified Brand presets
  const IMAGE_PRESETS = BRAND_IMAGE_PRESETS;

  // Helper date parsing and formatting
  const getPostDateStr = (post) => {
    if (post.date) return post.date;
    if (post.day) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}-${String(post.day).padStart(2, '0')}`;
    }
    return formatDateToYMD(currentDate);
  };

  const formatDateToYMD = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper date comparison
  const isSameDay = (d1, d2) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  // ─── Filtered Posts ───
  const filteredPosts = useMemo(() => {
    return calendarPosts.filter(p => {
      // Client filter
      if (filterClient !== 'All' && p.client !== filterClient) return false;
      // Canal filter
      if (filterCanal !== 'All' && p.canal !== filterCanal) return false;
      // Status filter
      if (filterStatus !== 'All' && p.status !== filterStatus) return false;
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = (p.title || '').toLowerCase().includes(query);
        const matchDesc = (p.desc || p.description || '').toLowerCase().includes(query);
        const matchClient = (p.client || '').toLowerCase().includes(query);
        const matchCampaign = (p.campaign || '').toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchClient && !matchCampaign) return false;
      }
      // Top nav filter
      if (activeNav === 'queue') {
        return p.status === 'PENDING' || p.status === 'SCHEDULED';
      }
      if (activeNav === 'drafts') {
        return p.status === 'DRAFT';
      }
      if (activeNav === 'campaigns') {
        return Boolean(p.campaign);
      }
      return true;
    });
  }, [calendarPosts, filterClient, filterCanal, filterStatus, searchQuery, activeNav]);

  // ─── Navigation Handlers ───
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() - 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() - 7);
    } else if (viewMode === 'day') {
      next.setDate(next.getDate() - 1);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() + 7);
    } else if (viewMode === 'day') {
      next.setDate(next.getDate() + 1);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date('2026-05-19T10:00:00'));
  };

  // Dynamic header title
  const getHeaderTitle = () => {
    if (viewMode === 'month') {
      const monthName = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      return monthName.charAt(0).toUpperCase() + monthName.slice(1);
    }
    if (viewMode === 'week') {
      // Calculate Monday of current week
      const dayOfWeek = currentDate.getDay(); // 0 is Sunday, 1 is Monday
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(currentDate);
      monday.setDate(currentDate.getDate() + diffToMonday);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const monStr = monday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      const sunStr = sunday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
      return `Semaine du ${monStr} au ${sunStr}`;
    }
    if (viewMode === 'day') {
      const dayStr = currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      return dayStr.charAt(0).toUpperCase() + dayStr.slice(1);
    }
    return '';
  };

  // ─── Status Colors & Labels ───
  const getStatusColor = (s) => {
    switch (s) {
      case 'PUBLISHED': return '#27ae60';
      case 'SCHEDULED': return '#3498db';
      case 'PENDING': return '#f39c12';
      case 'DRAFT': return '#94a3b8';
      default: return '#3b82f6';
    }
  };

  const getStatusLabel = (s) => {
    switch (s) {
      case 'PUBLISHED': return '✅ PUBLIÉ';
      case 'SCHEDULED': return '📅 PROGRAMMÉ';
      case 'PENDING': return '⏳ EN ATTENTE';
      case 'DRAFT': return '📝 BROUILLON';
      default: return s || 'BROUILLON';
    }
  };

  const getPlatformIcon = (canal) => {
    switch (canal) {
      case 'Facebook': return '📘';
      case 'Instagram': return '📸';
      case 'LinkedIn': return '💼';
      case 'X': return '✖️';
      case 'TikTok': return '🎵';
      case 'Chaine WhatsApp': return '💬';
      default: return '🌐';
    }
  };

  // ─── CRUD Action Handlers ───
  const handleOpenCreateModal = (presetDate = null, presetTime = '10:00') => {
    const targetDate = presetDate ? formatDateToYMD(presetDate) : formatDateToYMD(currentDate);
    const dayNumber = presetDate ? presetDate.getDate() : currentDate.getDate();
    const defaultClient = filterClient !== 'All' ? filterClient : 'Orange Telco';

    setEditModalState({
      mode: 'create',
      data: {
        title: '',
        client: defaultClient,
        canal: filterCanal !== 'All' ? filterCanal : 'Facebook',
        type: 'Feed',
        format: 'Paysage',
        time: presetTime,
        date: targetDate,
        day: dayNumber,
        status: 'PENDING',
        generation: 'Manual',
        desc: '',
        image: '',
        campaign: '',
        url: '',
        vues: 0,
        likes: 0,
        commentaires: 0,
        partages: 0,
        engagement: 0,
        isSponsored: false,
        sponsoring: {
          isSponsored: false,
          budget: 150000,
          budgetSpent: 140000,
          currency: 'FCFA',
          dailyBudget: 21400,
          startDate: targetDate,
          endDate: '',
          durationDays: 7,
          status: 'active',
          objective: 'Engagement & Conversions',
          platformAdAccount: `Meta Ads · ${defaultClient}`,
          reach: 345000,
          impressions: 512000,
          frequency: 1.48,
          cpm: 293,
          targetAudience: '18-35 ans · Cameroun (Douala, Yaoundé) · Intérêts Fintech & Télécoms',
          clicks: 18400,
          ctr: '3.59',
          cpc: '7.74',
          conversions: 1240,
          conversionRate: '6.74',
          cpa: '114.9',
          roas: '4.8x'
        }
      }
    });
  };

  const handleOpenEditModal = (post) => {
    const normalizedSp = getNormalizedSponsoring(post);
    const perf = getPostPerformance(post);
    setEditModalState({
      mode: 'edit',
      data: {
        ...post,
        date: getPostDateStr(post),
        day: post.day || (post.date ? parseInt(post.date.split('-')[2], 10) : 19),
        desc: post.desc || post.description || '',
        url: post.url || post.link || '',
        vues: perf.vues,
        likes: perf.likes,
        commentaires: perf.commentaires,
        partages: perf.partages,
        engagement: perf.engagement,
        isSponsored: normalizedSp.isSponsored,
        sponsoring: normalizedSp,
      }
    });
    if (viewModalPost) {
      setViewModalPost(null);
    }
  };

  const handleSaveModalForm = async (e) => {
    e.preventDefault();
    const formData = editModalState.data;
    if (!formData.title.trim()) return;

    const dayParsed = formData.date ? parseInt(formData.date.split('-')[2], 10) : formData.day || 19;
    const isSponsored = Boolean(formData.sponsoring?.isSponsored || formData.isSponsored);
    const normalizedSponsoring = {
      ...(formData.sponsoring || {}),
      isSponsored
    };

    if (editModalState.mode === 'create') {
      const perfPayload = buildPerformancePayload(
        formData.vues,
        formData.likes,
        formData.commentaires,
        formData.partages,
        formData.engagement
      );

      const newPost = {
        ...formData,
        ...perfPayload,
        isSponsored,
        sponsoring: normalizedSponsoring,
        day: dayParsed,
        url: (formData.url || '').trim(),
        createdAt: new Date().toISOString(),
      };
      await addCalendarPost(newPost);
      
      // Also register in publications context
      const platMap = { 'Facebook': 'Facebook', 'Instagram': 'Instagram', 'X': 'Twitter/X', 'LinkedIn': 'LinkedIn', 'TikTok': 'TikTok', 'Chaine WhatsApp': 'WhatsApp' };
      if (addPublication) {
        addPublication({
          title: formData.title,
          plateforme: platMap[formData.canal] || formData.canal,
          format: formData.type === 'Carrousel' ? 'Carrousel' : formData.type === 'Réels et Story' ? 'Reels' : 'Image',
          description: formData.desc,
          dateTarget: formData.date,
          heureTarget: formData.time,
        });
      }
    } else {
      // Edit mode
      const perfPayload = buildPerformancePayload(
        formData.vues,
        formData.likes,
        formData.commentaires,
        formData.partages,
        formData.engagement
      );

      await updateCalendarPost(formData.id, {
        ...formData,
        ...perfPayload,
        isSponsored,
        sponsoring: normalizedSponsoring,
        url: (formData.url || '').trim(),
        day: dayParsed,
        updatedAt: new Date().toISOString()
      });
    }

    setEditModalState(null);
  };

  const handleDeletePost = async () => {
    if (!deleteModalPost) return;
    await deleteCalendarPost(deleteModalPost.id);
    setDeleteModalPost(null);
    if (viewModalPost && viewModalPost.id === deleteModalPost.id) {
      setViewModalPost(null);
    }
  };

  const handleOpenViewModal = (post) => {
    setViewModalPost(post);
    setViewModalImgError(false);
    setShowViewModalImageEditor(false);
    setIsEditingPostUrl(false);
    setPostUrlInput(post.url || post.link || '');
    setIsEditingMetrics(false);
    setMetricsSaveSuccess(false);

    const perf = getPostPerformance(post);
    setMetricInputs({
      vues: perf.vues !== undefined ? String(perf.vues) : '0',
      likes: perf.likes !== undefined ? String(perf.likes) : '0',
      commentaires: perf.commentaires !== undefined ? String(perf.commentaires) : '0',
      partages: perf.partages !== undefined ? String(perf.partages) : '0',
      engagement: perf.engagement !== undefined ? String(perf.engagement) : '0'
    });
  };

  const handleSavePostMetrics = async () => {
    if (!viewModalPost) return;
    const payload = buildPerformancePayload(
      metricInputs.vues,
      metricInputs.likes,
      metricInputs.commentaires,
      metricInputs.partages,
      metricInputs.engagement
    );

    await updateCalendarPost(viewModalPost.id, payload);
    setViewModalPost(prev => ({
      ...prev,
      ...payload
    }));
    setIsEditingMetrics(false);
    setMetricsSaveSuccess(true);
    setTimeout(() => setMetricsSaveSuccess(false), 3000);
  };

  const handleSavePostUrl = async (customUrl = null) => {
    if (!viewModalPost) return;
    const targetUrl = (customUrl !== null ? customUrl : postUrlInput).trim();
    await updateCalendarPost(viewModalPost.id, { url: targetUrl });
    setViewModalPost(prev => ({ ...prev, url: targetUrl }));
    setIsEditingPostUrl(false);
  };

  const handleRemovePostUrl = async () => {
    if (!viewModalPost) return;
    await updateCalendarPost(viewModalPost.id, { url: '' });
    setViewModalPost(prev => ({ ...prev, url: '' }));
    setPostUrlInput('');
    setIsEditingPostUrl(false);
  };

  const handleCopyPostLink = (urlToCopy) => {
    if (!urlToCopy) return;
    navigator.clipboard?.writeText(urlToCopy);
    setCopiedLinkNotification(true);
    setTimeout(() => setCopiedLinkNotification(false), 2000);
  };

  const handleUpdatePostImage = async (postId, newImage) => {
    await updateCalendarPost(postId, { image: newImage });
    if (viewModalPost && viewModalPost.id === postId) {
      setViewModalPost(prev => ({ ...prev, image: newImage }));
      setViewModalImgError(false);
      setShowViewModalImageEditor(false);
    }
  };

  const handleViewModalFileUpload = async (files) => {
    if (!files || files.length === 0 || !viewModalPost) return;
    try {
      const res = await processImageFile(files[0]);
      await handleUpdatePostImage(viewModalPost.id, res.dataUrl);
    } catch (err) {
      alert(err.message || "Erreur lors du traitement de l'image.");
    }
  };

  const handleQuickStatusChange = async (postId, newStatus) => {
    await updateCalendarPost(postId, { status: newStatus });
    if (viewModalPost && viewModalPost.id === postId) {
      setViewModalPost(prev => ({ ...prev, status: newStatus }));
    }
  };

  const handleUpdatePostSponsoring = async (newSponsoringData) => {
    if (!viewModalPost) return;
    const isSponsored = Boolean(newSponsoringData?.isSponsored);
    const updates = {
      sponsoring: newSponsoringData,
      isSponsored
    };
    await updateCalendarPost(viewModalPost.id, updates);
    setViewModalPost(prev => ({
      ...prev,
      ...updates
    }));
  };

  const handleCopyDescription = (text) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const handleGenerateAICaption = () => {
    if (!editModalState) return;
    const current = editModalState.data;
    const aiSuggestions = [
      `🚀 Découvrez les nouveaux avantages exclusifs avec ${current.client} ! Restez connectés, profitez du meilleur du numérique au Cameroun. 📲✨ #${current.client.replace(/\s+/g, '')} #Innovation`,
      `🔥 Offre spéciale à ne pas manquer ! Bénéficiez d'une expérience fluide et simplifiée dès aujourd'hui. Cliquez sur le lien en bio pour en savoir plus. 🇨🇲🎉 #OrangeCameroun #Pulse`,
      `💡 Saviez-vous que vous pouvez gérer toutes vos opérations en un clic ? Rejoignez la communauté et transformez votre quotidien avec ${current.client}. 🚀💫`
    ];
    const randomSuggestion = aiSuggestions[Math.floor(Math.random() * aiSuggestions.length)];
    setEditModalState({
      ...editModalState,
      data: {
        ...editModalState.data,
        desc: (editModalState.data.desc ? editModalState.data.desc + '\n\n' : '') + randomSuggestion,
        generation: 'AI'
      }
    });
  };

  // ─── Month View Generator ───
  const monthCells = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const totalDays = lastDayOfMonth.getDate();
    // Monday as first day: 0=Mon, 1=Tue, ..., 6=Sun
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const cells = [];

    // Leading padding days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      cells.push({ date: d, isCurrentMonth: false });
    }

    // Days of current month
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);
      cells.push({ date: d, isCurrentMonth: true });
    }

    // Trailing padding days to complete full grid (multiple of 7)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      cells.push({ date: d, isCurrentMonth: false });
    }

    return cells;
  }, [currentDate]);

  // ─── Week View Days Generator ───
  const weekDays = useMemo(() => {
    const dayOfWeek = currentDate.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() + diffToMonday);

    const daysList = [];
    const dayNames = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isToday = isSameDay(d, new Date('2026-05-19T10:00:00'));
      daysList.push({
        name: dayNames[i],
        dateObj: d,
        dateStr: formatDateToYMD(d),
        dayNum: d.getDate(),
        isToday,
      });
    }
    return daysList;
  }, [currentDate]);

  // ─── Day View Hours Generator ───
  const dayHours = useMemo(() => {
    const hours = [];
    for (let h = 7; h <= 22; h++) {
      const timeStr = `${String(h).padStart(2, '0')}:00`;
      hours.push(timeStr);
    }
    return hours;
  }, []);

  return (
    <div className="adv-calendar-container animate-fade" id="adv-calendar-module">
      {/* ─── Top Bar Navigation ─── */}
      <div className="adv-cal-topbar" id="adv-cal-topbar">
        <div className="adv-cal-nav">
          <button 
            id="adv-tab-calendar"
            className={activeNav === 'calendar' ? 'active' : ''} 
            onClick={() => setActiveNav('calendar')}
          >
            📅 Calendrier
            <span className="adv-nav-count">{calendarPosts.length}</span>
          </button>
          <button 
            id="adv-tab-queue"
            className={activeNav === 'queue' ? 'active' : ''} 
            onClick={() => setActiveNav('queue')}
          >
            ⏸ File d'attente
            <span className="adv-nav-count">
              {calendarPosts.filter(p => p.status === 'PENDING' || p.status === 'SCHEDULED').length}
            </span>
          </button>
          <button 
            id="adv-tab-drafts"
            className={activeNav === 'drafts' ? 'active' : ''} 
            onClick={() => setActiveNav('drafts')}
          >
            📝 Brouillons
            <span className="adv-nav-count">
              {calendarPosts.filter(p => p.status === 'DRAFT').length}
            </span>
          </button>
          <button 
            id="adv-tab-campaigns"
            className={activeNav === 'campaigns' ? 'active' : ''} 
            onClick={() => setActiveNav('campaigns')}
          >
            🚀 Campagnes
            <span className="adv-nav-count">
              {calendarPosts.filter(p => Boolean(p.campaign)).length}
            </span>
          </button>
        </div>

        <div className="adv-cal-top-actions">
          <button id="adv-btn-archive" className="btn btn-ghost btn-sm" onClick={onOpenArchive}>
            📂 Archives
          </button>
          <div className="user-avatar-small" title="Community Manager">CM</div>
        </div>
      </div>

      {/* ─── Control Bar (View Toggles, Navigation, Filters) ─── */}
      <div className="adv-cal-controls" id="adv-cal-controls">
        <div className="flex items-center gap-16 flex-wrap">
          <div className="adv-cal-date-display">
            <span className="icon">🗓</span>
            <div>
              <div className="text-xs text-muted font-semibold">PLANNING & ÉDITION</div>
              <div className="font-bold text-lg text-white" id="adv-cal-current-label">
                {getHeaderTitle()}
              </div>
            </div>
          </div>

          {/* View Toggles: Mois / Semaine / Jour */}
          <div className="adv-cal-view-toggles" id="adv-cal-view-toggles">
            <button 
              id="adv-toggle-month"
              className={viewMode === 'month' ? 'active' : ''} 
              onClick={() => setViewMode('month')}
            >
              📅 Mois
            </button>
            <button 
              id="adv-toggle-week"
              className={viewMode === 'week' ? 'active' : ''} 
              onClick={() => setViewMode('week')}
            >
              📊 Semaine
            </button>
            <button 
              id="adv-toggle-day"
              className={viewMode === 'day' ? 'active' : ''} 
              onClick={() => setViewMode('day')}
            >
              🕒 Jour
            </button>
          </div>

          {/* Navigation Arrows & Today */}
          <div className="adv-cal-nav-arrows">
            <button id="adv-nav-prev" onClick={handlePrev} title="Période précédente">‹</button>
            <button id="adv-nav-next" onClick={handleNext} title="Période suivante">›</button>
            <button id="adv-nav-today" className="btn-today" onClick={handleToday}>
              Aujourd'hui
            </button>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="flex items-center gap-10 flex-wrap">
          {/* Search */}
          <input 
            id="adv-search-input"
            type="text" 
            className="adv-cal-search" 
            placeholder="🔍 Rechercher un post..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Client Filter */}
          <select 
            id="adv-filter-client"
            className="adv-cal-select" 
            value={filterClient} 
            onChange={(e) => setFilterClient(e.target.value)}
          >
            <option value="All">🏢 Tous les Clients</option>
            {calData.clients.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Canal Filter */}
          <select 
            id="adv-filter-canal"
            className="adv-cal-select" 
            value={filterCanal} 
            onChange={(e) => setFilterCanal(e.target.value)}
          >
            <option value="All">📱 Tous les Canaux</option>
            {calData.canaux.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Status Filter */}
          <select 
            id="adv-filter-status"
            className="adv-cal-select" 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">🚦 Tous les Statuts</option>
            <option value="PUBLISHED">✅ Publié</option>
            <option value="SCHEDULED">📅 Programmé</option>
            <option value="PENDING">⏳ En attente</option>
            <option value="DRAFT">📝 Brouillon</option>
          </select>

          {/* Create Button */}
          <button 
            id="adv-btn-new-post"
            className="btn btn-orange btn-sm" 
            onClick={() => handleOpenCreateModal()}
          >
            ➕ Nouveau Post
          </button>
        </div>
      </div>

      {/* ─── VIEW 1: MONTH (MOIS) ─── */}
      {viewMode === 'month' && (
        <div className="adv-month-container animate-fade" id="adv-month-view">
          <div className="adv-month-weekdays">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(dayName => (
              <div key={dayName} className="adv-month-weekday-cell">
                {dayName}
              </div>
            ))}
          </div>

          <div className="adv-month-grid">
            {monthCells.map((cell, idx) => {
              const dateStr = formatDateToYMD(cell.date);
              const isToday = isSameDay(cell.date, new Date('2026-05-19T10:00:00'));
              
              // Find posts on this day
              const dayPosts = filteredPosts.filter(p => {
                const pDate = getPostDateStr(p);
                return pDate === dateStr || (cell.isCurrentMonth && p.day === cell.date.getDate());
              });

              return (
                <div 
                  key={idx} 
                  className={`adv-month-day-cell ${!cell.isCurrentMonth ? 'is-other-month' : ''} ${isToday ? 'is-today' : ''}`}
                >
                  <div className="adv-month-cell-header">
                    <span className="adv-month-day-number">
                      {cell.date.getDate()}
                    </span>
                    <button 
                      className="adv-month-add-btn" 
                      title="Ajouter une publication ce jour"
                      onClick={() => handleOpenCreateModal(cell.date)}
                    >
                      +
                    </button>
                  </div>

                    <div className="adv-month-posts-list">
                      {dayPosts.map(post => {
                        const perf = getPostPerformance(post);
                        return (
                          <div 
                            key={post.id} 
                            className={`adv-month-post-chip status-${(post.status || 'draft').toLowerCase()}`}
                            onClick={() => handleOpenViewModal(post)}
                            title={`${post.title} — ${post.canal} (${post.time}) ${perf.hasMetrics ? `| Vues: ${formatCompactNumber(perf.vues)} · Eng: ${formatCompactNumber(perf.engagement)}` : ''}`}
                          >
                            <span>{getPlatformIcon(post.canal)}</span>
                            <span className="adv-chip-time">{post.time}</span>
                            <span className="adv-chip-title">{post.title}</span>
                            {perf.hasMetrics && (
                              <div className="adv-month-post-metrics">
                                <span className="metric-pill" title={`${formatMetricNumber(perf.vues)} vues`}>👁 {formatCompactNumber(perf.vues)}</span>
                                <span className="metric-pill" style={{ color: '#ff9233' }} title={`${formatMetricNumber(perf.engagement)} engagements (${perf.tauxEngagement})`}>⚡ {formatCompactNumber(perf.engagement)}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── VIEW 2: WEEK (SEMAINE) ─── */}
      {viewMode === 'week' && (
        <div className="adv-cal-grid animate-fade" id="adv-week-view">
          {weekDays.map((col, index) => {
            const dayPosts = filteredPosts.filter(p => {
              const pDate = getPostDateStr(p);
              return pDate === col.dateStr || p.day === col.dayNum;
            });

            return (
              <div key={index} className={`adv-cal-col ${col.isToday ? 'is-today' : ''}`}>
                <div className="adv-cal-col-header">
                  <div className="adv-cal-col-name">{col.name}</div>
                  <div className="adv-cal-col-date">
                    <span>{col.dayNum}</span>
                    {col.isToday && <span className="today-badge">AUJOURD'HUI</span>}
                  </div>
                  <div className="adv-cal-col-count">{dayPosts.length} POSTS</div>
                </div>

                <div className="adv-cal-cards">
                  {dayPosts.map(post => (
                    <div key={post.id} className="adv-post-card animate-fade">
                      <div className="adv-post-header">
                        <div className="adv-post-platform">
                          <span>{getPlatformIcon(post.canal)}</span>
                          <span>{post.canal}</span>
                          <span className="text-muted ml-4 text-xs font-mono">{post.time}</span>
                        </div>
                        <div 
                          className="adv-post-status" 
                          style={{ 
                            color: getStatusColor(post.status),
                            background: `${getStatusColor(post.status)}18`,
                            border: `1px solid ${getStatusColor(post.status)}40`
                          }}
                        >
                          {getStatusLabel(post.status)}
                        </div>
                      </div>

                      <div className="adv-post-title">{post.title}</div>

                      <div className="adv-post-meta">
                        <span className={`tag-micro ${post.generation === 'AI' ? 'tag-purple' : 'tag-green'}`}>
                          {post.generation === 'AI' ? '🤖 IA' : '✍️ MANUEL'}
                        </span>
                        <span className="adv-client-pill">{post.client}</span>
                        {post.format && <span className="tag-micro tag-blue">{post.format}</span>}
                        {post.campaign && <span className="adv-campaign-tag">{post.campaign}</span>}
                        {(post.isSponsored || (post.sponsoring && (post.sponsoring.isSponsored || post.sponsoring > 0))) && (
                          <span className="tag-micro" style={{ background: 'rgba(249, 115, 22, 0.2)', color: '#fb923c', border: '1px solid rgba(249, 115, 22, 0.45)' }} title="Publication sponsorisée">
                            ⚡ Ads
                          </span>
                        )}
                      </div>
                      
                      <div className="adv-post-body">
                        <p className="adv-post-desc flex-1">
                          {post.desc || post.description || 'Aucun texte de publication spécifié.'}
                        </p>
                        {post.image && (
                          <div 
                            className="adv-post-thumb" 
                            style={{ backgroundImage: `url(${post.image})` }}
                            title="Aperçu visuel"
                          />
                        )}
                      </div>

                      {/* Performance strip (Vues, Likes, Commentaires, Partages, Engagement) */}
                      {(() => {
                        const perf = getPostPerformance(post);
                        if (!perf.hasMetrics) return null;
                        return (
                          <div className="adv-metrics-strip" title="Performances réelles enregistrées">
                            <span className="adv-metric-item metric-views" title={`${formatMetricNumber(perf.vues)} Vues`}>
                              <span className="metric-icon">👁</span>
                              <span>{formatCompactNumber(perf.vues)}</span>
                            </span>
                            <span className="adv-metric-item metric-likes" title={`${formatMetricNumber(perf.likes)} Likes`}>
                              <span className="metric-icon">❤️</span>
                              <span>{formatCompactNumber(perf.likes)}</span>
                            </span>
                            <span className="adv-metric-item metric-comments" title={`${formatMetricNumber(perf.commentaires)} Commentaires`}>
                              <span className="metric-icon">💬</span>
                              <span>{formatCompactNumber(perf.commentaires)}</span>
                            </span>
                            <span className="adv-metric-item metric-shares" title={`${formatMetricNumber(perf.partages)} Partages`}>
                              <span className="metric-icon">🔄</span>
                              <span>{formatCompactNumber(perf.partages)}</span>
                            </span>
                            <span className="adv-metric-item metric-engagement" title={`Engagement cumulé : ${formatMetricNumber(perf.engagement)} interactions (${perf.tauxEngagement})`}>
                              <span className="metric-icon">⚡</span>
                              <span>{formatCompactNumber(perf.engagement)}</span>
                            </span>
                          </div>
                        );
                      })()}
                      
                      <div className="adv-post-footer">
                        <div className="adv-post-actions-left">
                          <button 
                            className="btn-icon-sm" 
                            title="Visualiser les détails"
                            onClick={() => handleOpenViewModal(post)}
                          >
                            👁 Voir
                          </button>
                          <button 
                            className="btn-icon-sm" 
                            title="Modifier cette publication"
                            onClick={() => handleOpenEditModal(post)}
                          >
                            ✏️ Éditer
                          </button>
                          {(post.url || post.link) && (
                            <a 
                              href={formatExternalUrl(post.url || post.link)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="btn-icon-sm" 
                              style={{ color: '#ff9233', borderColor: 'rgba(255, 121, 0, 0.35)' }}
                              title="Consulter la publication en ligne"
                              onClick={(e) => e.stopPropagation()}
                            >
                              🌐 Lien ↗
                            </a>
                          )}
                        </div>
                        
                        <button 
                          className="btn-icon-sm btn-danger" 
                          title="Supprimer"
                          onClick={() => setDeleteModalPost(post)}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Empty state & quick add button */}
                  {dayPosts.length === 0 && (
                    <div 
                      className="adv-cal-empty-day"
                      onClick={() => handleOpenCreateModal(col.dateObj)}
                    >
                      <span className="font-bold text-lg">+</span>
                      <span className="text-xs font-semibold">Ajouter un post</span>
                    </div>
                  )}

                  <button 
                    className="adv-cal-add-col-btn"
                    onClick={() => handleOpenCreateModal(col.dateObj)}
                  >
                    ➕ Planifier pour ce jour
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── VIEW 3: DAY (JOUR) ─── */}
      {viewMode === 'day' && (
        <div className="adv-day-container animate-fade" id="adv-day-view">
          {/* Day summary header */}
          {(() => {
            const dateStr = formatDateToYMD(currentDate);
            const dayPosts = filteredPosts.filter(p => {
              const pDate = getPostDateStr(p);
              return pDate === dateStr || p.day === currentDate.getDate();
            });

            const publishedCount = dayPosts.filter(p => p.status === 'PUBLISHED').length;
            const scheduledCount = dayPosts.filter(p => p.status === 'SCHEDULED').length;
            const pendingCount = dayPosts.filter(p => p.status === 'PENDING').length;
            const draftCount = dayPosts.filter(p => p.status === 'DRAFT').length;

            return (
              <>
                <div className="adv-day-header-card">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-4">
                      {currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </h2>
                    <p className="text-sm text-muted">
                      Vue détaillée horaire des publications programmées et publiées.
                    </p>
                  </div>

                  <div className="adv-day-stats">
                    <div className="adv-day-stat-item">
                      <span className="adv-day-stat-val text-white">{dayPosts.length}</span>
                      <span className="adv-day-stat-label">Total</span>
                    </div>
                    <div className="adv-day-stat-item">
                      <span className="adv-day-stat-val text-green-400">{publishedCount}</span>
                      <span className="adv-day-stat-label">Publiés</span>
                    </div>
                    <div className="adv-day-stat-item">
                      <span className="adv-day-stat-val text-blue-400">{scheduledCount}</span>
                      <span className="adv-day-stat-label">Programmés</span>
                    </div>
                    <div className="adv-day-stat-item">
                      <span className="adv-day-stat-val text-yellow-400">{pendingCount}</span>
                      <span className="adv-day-stat-label">En attente</span>
                    </div>
                    <div className="adv-day-stat-item">
                      <span className="adv-day-stat-val text-slate-400">{draftCount}</span>
                      <span className="adv-day-stat-label">Brouillons</span>
                    </div>
                  </div>
                </div>

                {/* Hourly Timeline */}
                <div className="adv-day-timeline">
                  {dayHours.map(hour => {
                    const hourPrefix = hour.split(':')[0];
                    const hourPosts = dayPosts.filter(p => {
                      const postHour = (p.time || '10:00').split(':')[0];
                      return postHour === hourPrefix;
                    });

                    return (
                      <div key={hour} className="adv-day-hour-row">
                        <div className="adv-day-hour-label">{hour}</div>
                        
                        <div className="adv-day-hour-content">
                          {hourPosts.map(post => (
                            <div key={post.id} className="adv-day-card animate-fade">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-8">
                                  <div className="flex items-center gap-8">
                                    <span className="text-base">{getPlatformIcon(post.canal)}</span>
                                    <span className="font-bold text-sm text-white">{post.canal}</span>
                                    <span className="adv-client-pill">{post.client}</span>
                                    <span className={`tag-micro ${post.generation === 'AI' ? 'tag-purple' : 'tag-green'}`}>
                                      {post.generation === 'AI' ? '🤖 IA' : '✍️ MANUEL'}
                                    </span>
                                    {post.campaign && <span className="adv-campaign-tag">{post.campaign}</span>}
                                    {(post.isSponsored || (post.sponsoring && (post.sponsoring.isSponsored || post.sponsoring > 0))) && (
                                      <span className="tag-micro" style={{ background: 'rgba(249, 115, 22, 0.2)', color: '#fb923c', border: '1px solid rgba(249, 115, 22, 0.45)' }}>
                                        ⚡ Ads
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div 
                                    className="adv-post-status" 
                                    style={{ 
                                      color: getStatusColor(post.status),
                                      background: `${getStatusColor(post.status)}18`,
                                      border: `1px solid ${getStatusColor(post.status)}40`
                                    }}
                                  >
                                    {getStatusLabel(post.status)}
                                  </div>
                                </div>

                                <div className="font-bold text-base text-white mb-6">
                                  {post.title}
                                </div>

                                <p className="text-sm text-slate-300 mb-10 leading-relaxed">
                                  {post.desc || post.description || 'Aucun texte descriptif.'}
                                </p>

                                {/* Performance strip (Vues, Likes, Commentaires, Partages, Engagement) */}
                                {(() => {
                                  const perf = getPostPerformance(post);
                                  if (!perf.hasMetrics) return null;
                                  return (
                                    <div className="adv-metrics-strip mb-10" title="Performances réelles enregistrées">
                                      <span className="adv-metric-item metric-views" title={`${formatMetricNumber(perf.vues)} Vues`}>
                                        <span className="metric-icon">👁</span>
                                        <span>{formatCompactNumber(perf.vues)} Vues</span>
                                      </span>
                                      <span className="adv-metric-item metric-likes" title={`${formatMetricNumber(perf.likes)} Likes`}>
                                        <span className="metric-icon">❤️</span>
                                        <span>{formatCompactNumber(perf.likes)}</span>
                                      </span>
                                      <span className="adv-metric-item metric-comments" title={`${formatMetricNumber(perf.commentaires)} Commentaires`}>
                                        <span className="metric-icon">💬</span>
                                        <span>{formatCompactNumber(perf.commentaires)}</span>
                                      </span>
                                      <span className="adv-metric-item metric-shares" title={`${formatMetricNumber(perf.partages)} Partages`}>
                                        <span className="metric-icon">🔄</span>
                                        <span>{formatCompactNumber(perf.partages)}</span>
                                      </span>
                                      <span className="adv-metric-item metric-engagement" title={`Engagement cumulé : ${formatMetricNumber(perf.engagement)} interactions`}>
                                        <span className="metric-icon">⚡</span>
                                        <span>{formatCompactNumber(perf.engagement)} Eng. cumulé</span>
                                      </span>
                                      <span className="adv-metric-item metric-rate" title={`Taux d'engagement : ${perf.tauxEngagement}`}>
                                        <span>{perf.tauxEngagement}</span>
                                      </span>
                                    </div>
                                  );
                                })()}

                                <div className="flex items-center gap-8">
                                  <button 
                                    className="btn-icon-sm"
                                    onClick={() => handleOpenViewModal(post)}
                                  >
                                    👁 Visualiser
                                  </button>
                                  <button 
                                    className="btn-icon-sm"
                                    onClick={() => handleOpenEditModal(post)}
                                  >
                                    ✏️ Modifier
                                  </button>
                                  <button 
                                    className="btn-icon-sm btn-danger"
                                    onClick={() => setDeleteModalPost(post)}
                                  >
                                    🗑 Supprimer
                                  </button>
                                  {(post.url || post.link) && (
                                    <a
                                      href={formatExternalUrl(post.url || post.link)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="btn-icon-sm"
                                      style={{ color: '#ff9233', borderColor: 'rgba(255, 121, 0, 0.4)' }}
                                      title="Consulter la publication sur le réseau"
                                    >
                                      🌐 Consulter ↗
                                    </a>
                                  )}
                                  {post.status !== 'PUBLISHED' && (
                                    <button 
                                      className="btn-icon-sm"
                                      style={{ color: '#27ae60', borderColor: '#27ae6050' }}
                                      onClick={() => handleQuickStatusChange(post.id, 'PUBLISHED')}
                                    >
                                      🚀 Publier immédiatement
                                    </button>
                                  )}
                                </div>
                              </div>

                              {post.image && (
                                <div 
                                  className="w-32 h-28 rounded-lg bg-cover bg-center border border-white/10 flex-shrink-0"
                                  style={{ backgroundImage: `url(${post.image})` }}
                                />
                              )}
                            </div>
                          ))}

                          {hourPosts.length === 0 && (
                            <div 
                              className="adv-day-empty-slot"
                              onClick={() => handleOpenCreateModal(currentDate, hour)}
                            >
                              <span>+</span>
                              <span>Planifier une publication à {hour}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ─── MODAL 1: VISUALISATION / VIEW POST ─── */}
      {viewModalPost && (
        <div className="adv-modal-overlay" onClick={() => setViewModalPost(null)}>
          <div className="adv-modal animate-fade" onClick={e => e.stopPropagation()}>
            <div className="adv-modal-header">
              <h2 className="adv-modal-title">
                <span>{getPlatformIcon(viewModalPost.canal)}</span>
                <span>Détail de la Publication</span>
              </h2>
              <button className="adv-modal-close" onClick={() => setViewModalPost(null)}>✕</button>
            </div>

            <div className="adv-modal-body">
              {/* Hero details */}
              <div className="adv-detail-hero">
                <div>
                  <div className="text-xl font-bold text-white mb-4">
                    {viewModalPost.title}
                  </div>
                  <div className="flex items-center gap-8 flex-wrap">
                    <span className="adv-client-pill font-semibold">🏢 {viewModalPost.client}</span>
                    <span className="tag-micro tag-blue">📱 {viewModalPost.canal}</span>
                    <span className="tag-micro tag-orange">📐 {viewModalPost.format || 'Paysage'}</span>
                    <span className={`tag-micro ${viewModalPost.generation === 'AI' ? 'tag-purple' : 'tag-green'}`}>
                      {viewModalPost.generation === 'AI' ? '🤖 Généré par IA' : '✍️ Rédaction Manuelle'}
                    </span>
                    {viewModalPost.campaign && (
                      <span className="adv-campaign-tag">🎯 {viewModalPost.campaign}</span>
                    )}
                    {(viewModalPost.isSponsored || (viewModalPost.sponsoring && (viewModalPost.sponsoring.isSponsored || viewModalPost.sponsoring > 0))) ? (
                      <span className="tag-micro" style={{ background: 'rgba(249, 115, 22, 0.2)', color: '#fb923c', border: '1px solid rgba(249, 115, 22, 0.5)', fontWeight: 700 }}>
                        ⚡ Sponsoring Activé
                      </span>
                    ) : (
                      <span className="tag-micro" style={{ background: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
                        🌱 Portée Organique
                      </span>
                    )}
                  </div>
                </div>

                <div 
                  className="adv-post-status text-sm" 
                  style={{ 
                    color: getStatusColor(viewModalPost.status),
                    background: `${getStatusColor(viewModalPost.status)}20`,
                    border: `1px solid ${getStatusColor(viewModalPost.status)}50`
                  }}
                >
                  {getStatusLabel(viewModalPost.status)}
                </div>
              </div>

              {/* Schedule time */}
              <div className="flex items-center justify-between bg-slate-900/60 p-12 rounded-lg border border-white/5 text-sm">
                <div className="flex items-center gap-8 text-slate-300">
                  <span>📅 <strong>Date cible :</strong> {getPostDateStr(viewModalPost)}</span>
                  <span>⏰ <strong>Heure :</strong> {viewModalPost.time || '10:00'}</span>
                </div>
                <div className="text-xs text-muted">
                  ID: #{viewModalPost.id}
                </div>
              </div>

              {/* ─── LIEN DE LA PUBLICATION / CONSULTATION DIRECTE ─── */}
              {isEditingPostUrl ? (
                <div className="adv-detail-link-edit animate-fade">
                  <div className="flex justify-between items-center mb-8">
                    <span className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-6">
                      <span>🔗</span>
                      <span>{(viewModalPost.url || viewModalPost.link) ? 'Modifier le lien de la publication' : 'Ajouter le lien de la publication'}</span>
                    </span>
                    <button
                      type="button"
                      className="text-xs text-slate-400 hover:text-white"
                      onClick={() => setIsEditingPostUrl(false)}
                    >
                      ✕ Annuler
                    </button>
                  </div>
                  <div className="flex gap-8 items-center flex-wrap">
                    <input
                      type="url"
                      className="pub-form-input flex-1 min-w-[240px] text-sm"
                      placeholder="Ex: https://www.facebook.com/... ou https://www.instagram.com/p/..."
                      value={postUrlInput}
                      onChange={(e) => setPostUrlInput(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSavePostUrl();
                        }
                      }}
                    />
                    <div className="flex items-center gap-6">
                      <button
                        type="button"
                        className="btn btn-orange btn-sm whitespace-nowrap"
                        onClick={() => handleSavePostUrl()}
                      >
                        💾 Enregistrer le lien
                      </button>
                      {(viewModalPost.url || viewModalPost.link) && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm text-rose-300 hover:text-rose-100"
                          onClick={handleRemovePostUrl}
                        >
                          🗑️ Retirer
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 mt-6">
                    💡 Collez le lien direct vers le post publié sur <strong>{viewModalPost.canal || 'les réseaux sociaux'}</strong> pour pouvoir le consulter en 1 clic.
                  </div>
                </div>
              ) : (viewModalPost.url || viewModalPost.link) ? (
                <div className="adv-detail-link-card animate-fade">
                  <div className="adv-detail-link-content">
                    <div className="adv-detail-link-info">
                      <div className="adv-detail-link-badge">
                        {getPlatformIcon(viewModalPost.canal)}
                      </div>
                      <div className="adv-detail-link-meta">
                        <div className="adv-detail-link-title">
                          <span>Lien direct de la publication</span>
                          <span className="text-slate-400 font-normal">({viewModalPost.canal || 'En ligne'})</span>
                        </div>
                        <a
                          href={formatExternalUrl(viewModalPost.url || viewModalPost.link)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="adv-detail-link-url"
                          title="Ouvrir la publication dans un nouvel onglet"
                        >
                          {viewModalPost.url || viewModalPost.link}
                        </a>
                      </div>
                    </div>

                    <div className="adv-detail-link-actions">
                      <a
                        href={formatExternalUrl(viewModalPost.url || viewModalPost.link)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="adv-consult-btn"
                        title="Consulter directement la publication sur la plateforme"
                      >
                        <span>🌐 Consulter la publication</span>
                        <span className="text-xs">↗</span>
                      </a>
                      <button
                        type="button"
                        className="btn-icon-sm text-xs py-2 px-8"
                        onClick={() => handleCopyPostLink(viewModalPost.url || viewModalPost.link)}
                        title="Copier le lien"
                      >
                        {copiedLinkNotification ? '✓ Copié !' : '📋 Copier'}
                      </button>
                      <button
                        type="button"
                        className="btn-icon-sm text-xs py-2 px-8 text-slate-300 hover:text-white"
                        onClick={() => {
                          setPostUrlInput(viewModalPost.url || viewModalPost.link || '');
                          setIsEditingPostUrl(true);
                        }}
                        title="Modifier ce lien"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="btn-icon-sm text-xs py-2 px-8 text-rose-300 hover:text-rose-100 hover:border-rose-500"
                        onClick={handleRemovePostUrl}
                        title="Retirer ce lien"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="adv-detail-link-empty">
                  <div className="flex items-center gap-8 min-w-0">
                    <span className="text-xl">🔗</span>
                    <div>
                      <div className="text-xs font-semibold text-slate-300">
                        Lien de consultation en ligne non renseigné
                      </div>
                      <div className="text-xs text-slate-400">
                        Ajoutez l'URL du post publié sur {viewModalPost.canal || 'les réseaux sociaux'} pour y accéder directement.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs text-orange-400 hover:text-orange-300 hover:border-orange-500/50"
                    onClick={() => {
                      setPostUrlInput('');
                      setIsEditingPostUrl(true);
                    }}
                  >
                    + Ajouter le lien du post
                  </button>
                </div>
              )}

              {/* Media image preview or error / add section */}
              {viewModalPost.image && !viewModalImgError ? (
                <div className="adv-detail-image-box">
                  <div className="adv-detail-image-wrapper">
                    <img
                      src={viewModalPost.image}
                      alt={viewModalPost.title}
                      referrerPolicy="no-referrer"
                      onError={() => setViewModalImgError(true)}
                      onClick={() => setLightboxImage(viewModalPost.image)}
                      className="cursor-pointer hover:opacity-95"
                      title="Cliquer pour afficher en plein écran"
                    />
                  </div>
                  <div className="adv-detail-image-bar">
                    <span className="text-xs text-slate-300 flex items-center gap-6">
                      <span className="font-semibold text-white">
                        {viewModalPost.image.startsWith('data:') ? '📁 Visuel importé (local)' : '🌐 Visuel via URL web'}
                      </span>
                    </span>
                    <div className="flex items-center gap-6">
                      <button
                        type="button"
                        className="btn-icon-sm text-xs py-2 px-8"
                        onClick={() => setLightboxImage(viewModalPost.image)}
                        title="Afficher en grand"
                      >
                        🔍 Agrandir
                      </button>
                      <button
                        type="button"
                        className="btn-icon-sm text-xs py-2 px-8"
                        onClick={() => setShowViewModalImageEditor(!showViewModalImageEditor)}
                        title="Remplacer par une autre image ou un fichier"
                      >
                        🔄 Remplacer
                      </button>
                      <button
                        type="button"
                        className="btn-icon-sm text-xs py-2 px-8 text-rose-300 hover:text-rose-100 hover:border-rose-500"
                        onClick={() => handleUpdatePostImage(viewModalPost.id, '')}
                        title="Supprimer cette image"
                      >
                        🗑️ Retirer
                      </button>
                    </div>
                  </div>
                </div>
              ) : viewModalPost.image && viewModalImgError ? (
                <div className="adv-detail-image-error">
                  <span className="text-3xl">⚠️</span>
                  <div className="text-sm font-bold text-rose-300">
                    Image inaccessible ou lien externe expiré
                  </div>
                  <p className="text-xs text-slate-300 max-w-md m-0">
                    Le lien distant configuré ne répond pas (erreur réseau, 404 ou blocage CORS). Vous pouvez téléverser directement un fichier image ou saisir un nouveau lien.
                  </p>
                  <div className="flex gap-8 flex-wrap justify-center mt-4">
                    <button
                      type="button"
                      className="btn btn-blue btn-sm"
                      onClick={() => viewModalFileInputRef.current?.click()}
                    >
                      📁 Téléverser une image directe
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setShowViewModalImageEditor(true)}
                    >
                      🔗 Changer le lien URL
                    </button>
                    <button
                      type="button"
                      className="btn btn-red btn-sm"
                      onClick={() => handleUpdatePostImage(viewModalPost.id, '')}
                    >
                      🗑️ Supprimer le visuel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="adv-detail-no-image">
                  <span className="text-2xl">🖼️</span>
                  <div className="text-xs text-slate-300 font-medium">
                    Aucun visuel associé à cette publication
                  </div>
                  <div className="flex gap-6 flex-wrap justify-center mt-4">
                    <button
                      type="button"
                      className="btn btn-blue btn-xs"
                      onClick={() => viewModalFileInputRef.current?.click()}
                    >
                      📁 Téléverser une image
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={() => setShowViewModalImageEditor(true)}
                    >
                      🔗 Ajouter via URL
                    </button>
                  </div>
                </div>
              )}

              {/* Hidden file input for direct detail upload */}
              <input
                ref={viewModalFileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml"
                className="hidden"
                onChange={(e) => handleViewModalFileUpload(e.target.files)}
              />

              {/* Collapsible Inline Image Editor in Detail View */}
              {showViewModalImageEditor && (
                <div className="p-12 bg-slate-900/95 rounded-lg border border-blue-500/40 animate-fade">
                  <div className="flex justify-between items-center mb-8">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Modifier le visuel (Fichier direct ou URL)
                    </span>
                    <button
                      type="button"
                      className="text-xs text-slate-400 hover:text-white"
                      onClick={() => setShowViewModalImageEditor(false)}
                    >
                      ✕ Fermer
                    </button>
                  </div>
                  <PublicationImageManager
                    value={viewModalPost.image || ''}
                    onChange={(newImg) => handleUpdatePostImage(viewModalPost.id, newImg)}
                    label="Choisir le visuel :"
                  />
                </div>
              )}

              {/* Copywriting text */}
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase mb-6 flex justify-between items-center">
                  <span>Texte du Post / Copywriting</span>
                  {copiedNotification && <span className="text-green-400 text-xs">✓ Copié dans le presse-papier</span>}
                </div>
                <div className="adv-detail-copybox">
                  <button 
                    className="adv-copy-btn"
                    onClick={() => handleCopyDescription(viewModalPost.desc || viewModalPost.description)}
                  >
                    📋 Copier
                  </button>
                  {viewModalPost.desc || viewModalPost.description || 'Aucun contenu de texte saisi pour ce post.'}
                </div>
              </div>

              {/* ─── SECTION PERFORMANCES DU POST (VUES, LIKES, COMMENTAIRES, PARTAGES, ENGAGEMENT CUMULÉ) ─── */}
              {(() => {
                const currentPerf = getPostPerformance(viewModalPost);
                return (
                  <div className="adv-detail-perf-card">
                    <div className="adv-detail-perf-header">
                      <div className="adv-detail-perf-title">
                        <span>📊</span>
                        <span>Performances de la Publication</span>
                        {currentPerf.hasMetrics ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                            Actives
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-300">
                            Non renseignées
                          </span>
                        )}
                        {metricsSaveSuccess && (
                          <span className="text-xs font-bold text-green-400 animate-fade">
                            ✓ Performances enregistrées
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-6">
                        {!isEditingMetrics ? (
                          <button
                            type="button"
                            className="btn btn-blue btn-xs"
                            onClick={() => {
                              setMetricInputs({
                                vues: currentPerf.vues !== undefined ? String(currentPerf.vues) : '0',
                                likes: currentPerf.likes !== undefined ? String(currentPerf.likes) : '0',
                                commentaires: currentPerf.commentaires !== undefined ? String(currentPerf.commentaires) : '0',
                                partages: currentPerf.partages !== undefined ? String(currentPerf.partages) : '0',
                                engagement: currentPerf.engagement !== undefined ? String(currentPerf.engagement) : '0'
                              });
                              setIsEditingMetrics(true);
                            }}
                          >
                            ✏️ {currentPerf.hasMetrics ? 'Modifier les métriques' : 'Renseigner les métriques'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs text-slate-400 hover:text-white"
                            onClick={() => setIsEditingMetrics(false)}
                          >
                            Annuler
                          </button>
                        )}
                      </div>
                    </div>

                    {!isEditingMetrics ? (
                      <div>
                        <div className="adv-detail-perf-grid">
                          <div className="adv-perf-stat-box">
                            <div className="adv-perf-stat-label">
                              <span>👁</span>
                              <span>Vues</span>
                            </div>
                            <div className="adv-perf-stat-val text-sky-400">
                              {formatMetricNumber(currentPerf.vues)}
                            </div>
                          </div>

                          <div className="adv-perf-stat-box">
                            <div className="adv-perf-stat-label">
                              <span>❤️</span>
                              <span>Likes</span>
                            </div>
                            <div className="adv-perf-stat-val text-rose-400">
                              {formatMetricNumber(currentPerf.likes)}
                            </div>
                          </div>

                          <div className="adv-perf-stat-box">
                            <div className="adv-perf-stat-label">
                              <span>💬</span>
                              <span>Commentaires</span>
                            </div>
                            <div className="adv-perf-stat-val text-amber-400">
                              {formatMetricNumber(currentPerf.commentaires)}
                            </div>
                          </div>

                          <div className="adv-perf-stat-box">
                            <div className="adv-perf-stat-label">
                              <span>🔄</span>
                              <span>Partages</span>
                            </div>
                            <div className="adv-perf-stat-val text-purple-400">
                              {formatMetricNumber(currentPerf.partages)}
                            </div>
                          </div>

                          <div className="adv-perf-stat-box adv-perf-stat-highlight">
                            <div className="adv-perf-stat-label" style={{ color: '#ff9233' }}>
                              <span>⚡</span>
                              <span>Engagement cumulé</span>
                            </div>
                            <div className="adv-perf-stat-val font-black">
                              {formatMetricNumber(currentPerf.engagement)}
                            </div>
                          </div>

                          <div className="adv-perf-stat-box adv-perf-stat-rate">
                            <div className="adv-perf-stat-label" style={{ color: '#34d399' }}>
                              <span>📈</span>
                              <span>Taux d'engagement</span>
                            </div>
                            <div className="adv-perf-stat-val">
                              {currentPerf.tauxEngagement}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 text-[11px] text-slate-400">
                          <span>
                            ℹ️ Engagement cumulé = Somme des interactions (Likes + Commentaires + Partages ou total direct).
                          </span>
                          <button
                            type="button"
                            className="text-orange-400 hover:text-orange-300 font-semibold underline"
                            onClick={() => {
                              setMetricInputs({
                                vues: currentPerf.vues !== undefined ? String(currentPerf.vues) : '0',
                                likes: currentPerf.likes !== undefined ? String(currentPerf.likes) : '0',
                                commentaires: currentPerf.commentaires !== undefined ? String(currentPerf.commentaires) : '0',
                                partages: currentPerf.partages !== undefined ? String(currentPerf.partages) : '0',
                                engagement: currentPerf.engagement !== undefined ? String(currentPerf.engagement) : '0'
                              });
                              setIsEditingMetrics(true);
                            }}
                          >
                            Modifier manuellement
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Formulaire d'édition manuelle des métriques */
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSavePostMetrics();
                        }}
                        className="p-12 bg-slate-900/90 rounded-lg border border-orange-500/40 animate-fade space-y-3"
                      >
                        <div className="text-xs text-slate-300 font-medium mb-2">
                          ✏️ <strong>Saisie manuelle des performances :</strong> modifiez les compteurs réels de la publication.
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-sky-400 uppercase mb-1">
                              👁 Vues
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={metricInputs.vues}
                              onChange={(e) => setMetricInputs(prev => ({ ...prev, vues: e.target.value }))}
                              className="w-full bg-[#0d1017] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-orange-500 outline-none"
                              placeholder="0"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-rose-400 uppercase mb-1">
                              ❤️ Likes
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={metricInputs.likes}
                              onChange={(e) => setMetricInputs(prev => ({ ...prev, likes: e.target.value }))}
                              className="w-full bg-[#0d1017] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-orange-500 outline-none"
                              placeholder="0"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-amber-400 uppercase mb-1">
                              💬 Commentaires
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={metricInputs.commentaires}
                              onChange={(e) => setMetricInputs(prev => ({ ...prev, commentaires: e.target.value }))}
                              className="w-full bg-[#0d1017] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-orange-500 outline-none"
                              placeholder="0"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-purple-400 uppercase mb-1">
                              🔄 Partages
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={metricInputs.partages}
                              onChange={(e) => setMetricInputs(prev => ({ ...prev, partages: e.target.value }))}
                              className="w-full bg-[#0d1017] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-orange-500 outline-none"
                              placeholder="0"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-orange-400 uppercase mb-1">
                              ⚡ Engagement Cumulé
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={metricInputs.engagement}
                              onChange={(e) => setMetricInputs(prev => ({ ...prev, engagement: e.target.value }))}
                              className="w-full bg-[#0d1017] border border-orange-500/50 rounded-lg px-2.5 py-1.5 text-xs text-orange-400 font-bold font-mono focus:border-orange-500 outline-none"
                              placeholder="Automatique ou manuel"
                            />
                          </div>

                          <div className="flex flex-col justify-end">
                            <button
                              type="button"
                              className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold rounded-lg border border-white/10 transition"
                              onClick={() => {
                                const l = parseInt(metricInputs.likes || 0, 10) || 0;
                                const c = parseInt(metricInputs.commentaires || 0, 10) || 0;
                                const p = parseInt(metricInputs.partages || 0, 10) || 0;
                                setMetricInputs(prev => ({ ...prev, engagement: String(l + c + p) }));
                              }}
                              title="Calculer automatiquement : Likes + Commentaires + Partages"
                            >
                              ⚡ Calculer Somme
                            </button>
                          </div>
                        </div>

                        {/* Preview du taux d'engagement calculé en direct */}
                        {(() => {
                          const v = parseInt(metricInputs.vues || 0, 10) || 0;
                          const eng = parseInt(metricInputs.engagement || 0, 10) || 0;
                          const calcRate = v > 0 ? ((eng / v) * 100).toFixed(2) + '%' : '0%';
                          return (
                            <div className="text-[11px] text-slate-400 flex items-center justify-between bg-slate-950/60 p-2 rounded border border-white/5">
                              <span>Taux d'engagement estimé : <strong className="text-emerald-400">{calcRate}</strong></span>
                              <span className="text-[10px] text-slate-500">(Calculé sur les vues réelles)</span>
                            </div>
                          );
                        })()}

                        <div className="flex justify-end gap-6 pt-2">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setIsEditingMetrics(false)}
                          >
                            Annuler
                          </button>
                          <button
                            type="submit"
                            className="btn btn-orange btn-sm"
                          >
                            💾 Enregistrer les performances
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })()}

              {/* ─── SECTION SPONSORING & MÉDIA PAYANT (BUDGET, AUDIENCE, CONVERSION) ─── */}
              <PostSponsoringSection 
                post={viewModalPost} 
                onUpdateSponsoring={handleUpdatePostSponsoring} 
              />

              {/* Quick status change */}
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase mb-8">
                  Changer le statut rapidement :
                </div>
                <div className="adv-quick-status-selector">
                  {[
                    { key: 'DRAFT', label: '📝 Brouillon' },
                    { key: 'PENDING', label: '⏳ En attente' },
                    { key: 'SCHEDULED', label: '📅 Programmé' },
                    { key: 'PUBLISHED', label: '✅ Publié' },
                  ].map(st => (
                    <button
                      key={st.key}
                      className={`adv-status-btn ${viewModalPost.status === st.key ? 'active' : ''}`}
                      onClick={() => handleQuickStatusChange(viewModalPost.id, st.key)}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="adv-modal-footer">
              {(viewModalPost.url || viewModalPost.link) && (
                <a
                  href={formatExternalUrl(viewModalPost.url || viewModalPost.link)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="adv-consult-btn mr-auto"
                  title="Ouvrir la publication dans un nouvel onglet"
                >
                  <span>🌐 Consulter la publication</span>
                  <span>↗</span>
                </a>
              )}
              <button 
                className="btn btn-red btn-sm"
                onClick={() => {
                  setDeleteModalPost(viewModalPost);
                }}
              >
                🗑 Supprimer
              </button>
              <button 
                className="btn btn-blue btn-sm"
                onClick={() => handleOpenEditModal(viewModalPost)}
              >
                ✏️ Modifier la publication
              </button>
              <button 
                className="btn btn-ghost btn-sm"
                onClick={() => setViewModalPost(null)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: CRÉATION / ÉDITION (CREATE & EDIT MODAL) ─── */}
      {editModalState && (
        <div className="adv-modal-overlay" onClick={() => setEditModalState(null)}>
          <div className="adv-modal animate-fade" onClick={e => e.stopPropagation()}>
            <div className="adv-modal-header">
              <h2 className="adv-modal-title">
                {editModalState.mode === 'create' ? '➕ Nouveau Post au Calendrier' : '✏️ Modifier la Publication'}
              </h2>
              <button className="adv-modal-close" onClick={() => setEditModalState(null)}>✕</button>
            </div>

            <form onSubmit={handleSaveModalForm}>
              <div className="adv-modal-body">
                {/* Title */}
                <div className="pub-form-group">
                  <label className="pub-form-label">Titre de la publication *</label>
                  <input 
                    className="pub-form-input" 
                    type="text" 
                    placeholder="Ex: Campagne Max It — Bonus 100%" 
                    value={editModalState.data.title}
                    onChange={e => setEditModalState({
                      ...editModalState,
                      data: { ...editModalState.data, title: e.target.value }
                    })}
                    required
                    autoFocus
                  />
                </div>

                {/* Client & Platform */}
                <div className="pub-form-row">
                  <div className="pub-form-group">
                    <label className="pub-form-label">Client / Entité *</label>
                    <select 
                      className="pub-form-select" 
                      value={editModalState.data.client}
                      onChange={e => setEditModalState({
                        ...editModalState,
                        data: { ...editModalState.data, client: e.target.value }
                      })}
                    >
                      {calData.clients.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="pub-form-group">
                    <label className="pub-form-label">Canal / Plateforme *</label>
                    <select 
                      className="pub-form-select" 
                      value={editModalState.data.canal}
                      onChange={e => setEditModalState({
                        ...editModalState,
                        data: { ...editModalState.data, canal: e.target.value }
                      })}
                    >
                      {calData.canaux.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Type & Format */}
                <div className="pub-form-row">
                  <div className="pub-form-group">
                    <label className="pub-form-label">Type de contenu</label>
                    <select 
                      className="pub-form-select" 
                      value={editModalState.data.type}
                      onChange={e => setEditModalState({
                        ...editModalState,
                        data: { ...editModalState.data, type: e.target.value }
                      })}
                    >
                      {calData.types.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div className="pub-form-group">
                    <label className="pub-form-label">Format visuel</label>
                    <select 
                      className="pub-form-select" 
                      value={editModalState.data.format}
                      onChange={e => setEditModalState({
                        ...editModalState,
                        data: { ...editModalState.data, format: e.target.value }
                      })}
                    >
                      {calData.formats.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="pub-form-row">
                  <div className="pub-form-group">
                    <label className="pub-form-label">Date de publication *</label>
                    <input 
                      className="pub-form-input" 
                      type="date" 
                      value={editModalState.data.date || '2026-05-19'}
                      onChange={e => setEditModalState({
                        ...editModalState,
                        data: { ...editModalState.data, date: e.target.value }
                      })}
                      required
                    />
                  </div>

                  <div className="pub-form-group">
                    <label className="pub-form-label">Heure *</label>
                    <input 
                      className="pub-form-input" 
                      type="time" 
                      value={editModalState.data.time || '10:00'}
                      onChange={e => setEditModalState({
                        ...editModalState,
                        data: { ...editModalState.data, time: e.target.value }
                      })}
                      required
                    />
                  </div>
                </div>

                {/* Status & Generation */}
                <div className="pub-form-row">
                  <div className="pub-form-group">
                    <label className="pub-form-label">Statut</label>
                    <select 
                      className="pub-form-select" 
                      value={editModalState.data.status || 'PENDING'}
                      onChange={e => setEditModalState({
                        ...editModalState,
                        data: { ...editModalState.data, status: e.target.value }
                      })}
                    >
                      <option value="DRAFT">📝 Brouillon</option>
                      <option value="PENDING">⏳ En attente</option>
                      <option value="SCHEDULED">📅 Programmé</option>
                      <option value="PUBLISHED">✅ Publié</option>
                    </select>
                  </div>

                  <div className="pub-form-group">
                    <label className="pub-form-label">Mode de création</label>
                    <select 
                      className="pub-form-select" 
                      value={editModalState.data.generation || 'Manual'}
                      onChange={e => setEditModalState({
                        ...editModalState,
                        data: { ...editModalState.data, generation: e.target.value }
                      })}
                    >
                      <option value="Manual">✍️ Rédaction Manuelle</option>
                      <option value="AI">🤖 Généré par IA</option>
                    </select>
                  </div>
                </div>

                {/* Campaign name */}
                <div className="pub-form-group">
                  <label className="pub-form-label">Campagne / Tag (Optionnel)</label>
                  <input 
                    className="pub-form-input" 
                    type="text" 
                    placeholder="Ex: #MaxItBonus2026, #PulseGaming" 
                    value={editModalState.data.campaign || ''}
                    onChange={e => setEditModalState({
                      ...editModalState,
                      data: { ...editModalState.data, campaign: e.target.value }
                    })}
                  />
                </div>

                {/* Image Section: Direct Upload or URL Link */}
                <PublicationImageManager
                  value={editModalState.data.image || ''}
                  onChange={(img) => setEditModalState(prev => ({
                    ...prev,
                    data: { ...prev.data, image: img }
                  }))}
                  label="Image / Visuel de la publication (Upload ou URL)"
                />

                {/* Online Publication URL */}
                <div className="pub-form-group">
                  <label className="pub-form-label flex items-center justify-between">
                    <span>Lien de la publication (URL)</span>
                    <span className="text-xs font-normal text-slate-400">Pour aller consulter le post en direct</span>
                  </label>
                  <input 
                    className="pub-form-input" 
                    type="url" 
                    placeholder="Ex: https://www.facebook.com/... ou https://instagram.com/p/..." 
                    value={editModalState.data.url || ''}
                    onChange={e => setEditModalState({
                      ...editModalState,
                      data: { ...editModalState.data, url: e.target.value }
                    })}
                  />
                </div>

                {/* Description / Copywriting with AI Generator Button */}
                <div className="pub-form-group">
                  <div className="flex justify-between items-center mb-6">
                    <label className="pub-form-label mb-0">Texte / Copywriting</label>
                    <button 
                      type="button" 
                      className="btn-icon-sm text-xs" 
                      style={{ color: '#ff7900', borderColor: '#ff790050' }}
                      onClick={handleGenerateAICaption}
                    >
                      ✨ Suggérer une idée avec l'IA
                    </button>
                  </div>
                  <textarea 
                    className="pub-form-textarea" 
                    rows={4} 
                    placeholder="Rédigez le texte de la publication, emojis, call-to-action et hashtags..." 
                    value={editModalState.data.desc || ''}
                    onChange={e => setEditModalState({
                      ...editModalState,
                      data: { ...editModalState.data, desc: e.target.value }
                    })}
                  />
                  <div className="text-right text-xs text-slate-400 mt-4">
                    {(editModalState.data.desc || '').length} caractères
                  </div>
                </div>

                {/* ─── SPONSORING & ADS TOGGLE DANS LE FORMULAIRE ─── */}
                <div className="pub-form-group bg-[#131722] p-3.5 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className="text-orange-400">⚡</span>
                        <span>Campagne Sponsorisée (Ads / Média Payant)</span>
                        {Boolean(editModalState.data.isSponsored || editModalState.data.sponsoring?.isSponsored) && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                            Actif
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Indiquer si cette publication bénéficie d'un budget Ads et définir ses paramètres
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(editModalState.data.isSponsored || editModalState.data.sponsoring?.isSponsored)}
                        onChange={e => {
                          const isSp = e.target.checked;
                          setEditModalState(prev => ({
                            ...prev,
                            data: {
                              ...prev.data,
                              isSponsored: isSp,
                              sponsoring: {
                                ...(prev.data.sponsoring || {}),
                                isSponsored: isSp
                              }
                            }
                          }));
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>

                  {Boolean(editModalState.data.isSponsored || editModalState.data.sponsoring?.isSponsored) && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-3 animate-fade">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                            Budget Alloué ({editModalState.data.sponsoring?.currency || 'FCFA'})
                          </label>
                          <input
                            type="number"
                            value={editModalState.data.sponsoring?.budget ?? 150000}
                            onChange={e => setEditModalState(prev => ({
                              ...prev,
                              data: {
                                ...prev.data,
                                sponsoring: {
                                  ...(prev.data.sponsoring || {}),
                                  budget: parseFloat(e.target.value) || 0
                                }
                              }
                            }))}
                            className="w-full bg-[#0d1017] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-orange-400 font-bold font-mono focus:border-orange-500 outline-none"
                            placeholder="150000"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                            Durée (Jours)
                          </label>
                          <input
                            type="number"
                            value={editModalState.data.sponsoring?.durationDays ?? 7}
                            onChange={e => setEditModalState(prev => ({
                              ...prev,
                              data: {
                                ...prev.data,
                                sponsoring: {
                                  ...(prev.data.sponsoring || {}),
                                  durationDays: parseInt(e.target.value, 10) || 1
                                }
                              }
                            }))}
                            className="w-full bg-[#0d1017] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-orange-500 outline-none"
                            placeholder="7"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                            Statut de diffusion
                          </label>
                          <select
                            value={editModalState.data.sponsoring?.status || 'active'}
                            onChange={e => setEditModalState(prev => ({
                              ...prev,
                              data: {
                                ...prev.data,
                                sponsoring: {
                                  ...(prev.data.sponsoring || {}),
                                  status: e.target.value
                                }
                              }
                            }))}
                            className="w-full bg-[#0d1017] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-orange-500 outline-none"
                          >
                            <option value="active">🟢 En cours de diffusion</option>
                            <option value="scheduled">⏱️ Planifié / En attente</option>
                            <option value="completed">✅ Terminé</option>
                            <option value="paused">⏸️ En pause</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                            Objectif Principal de Campagne
                          </label>
                          <input
                            type="text"
                            value={editModalState.data.sponsoring?.objective || 'Engagement & Conversions'}
                            onChange={e => setEditModalState(prev => ({
                              ...prev,
                              data: {
                                ...prev.data,
                                sponsoring: {
                                  ...(prev.data.sponsoring || {}),
                                  objective: e.target.value
                                }
                              }
                            }))}
                            className="w-full bg-[#0d1017] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-orange-500 outline-none"
                            placeholder="Ex: Trafic web, Téléchargement d'app, Ventes"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                            Audience Cible / Géographie
                          </label>
                          <input
                            type="text"
                            value={editModalState.data.sponsoring?.targetAudience || '18-35 ans · Cameroun · Intérêts Télécoms & Tech'}
                            onChange={e => setEditModalState(prev => ({
                              ...prev,
                              data: {
                                ...prev.data,
                                sponsoring: {
                                  ...(prev.data.sponsoring || {}),
                                  targetAudience: e.target.value
                                }
                              }
                            }))}
                            className="w-full bg-[#0d1017] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-orange-500 outline-none"
                            placeholder="Ex: 25-45 ans · Douala, Yaoundé · Intérêts business"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ─── PERFORMANCES DU CONTENU (SAISIE / MODIFICATION MANUELLE DES KPIS CM) ─── */}
                <div className="pub-form-group bg-[#131722] p-3.5 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className="text-emerald-400">📊</span>
                        <span>Performances de la Publication (Vues, Likes, Commentaires, Partages, Engagement)</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Saisie manuelle des résultats mesurés sur les réseaux sociaux.
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 border-t border-white/5">
                    <div>
                      <label className="block text-[10px] font-bold text-sky-400 uppercase mb-1">
                        👁 Vues
                      </label>
                      <input 
                        className="pub-form-input font-mono text-xs" 
                        type="number" 
                        min="0"
                        placeholder="0"
                        value={editModalState.data.vues ?? 0}
                        onChange={e => setEditModalState(prev => ({
                          ...prev,
                          data: { ...prev.data, vues: e.target.value }
                        }))}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-rose-400 uppercase mb-1">
                        ❤️ Likes
                      </label>
                      <input 
                        className="pub-form-input font-mono text-xs" 
                        type="number" 
                        min="0"
                        placeholder="0"
                        value={editModalState.data.likes ?? 0}
                        onChange={e => setEditModalState(prev => ({
                          ...prev,
                          data: { ...prev.data, likes: e.target.value }
                        }))}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-amber-400 uppercase mb-1">
                        💬 Commentaires
                      </label>
                      <input 
                        className="pub-form-input font-mono text-xs" 
                        type="number" 
                        min="0"
                        placeholder="0"
                        value={editModalState.data.commentaires ?? 0}
                        onChange={e => setEditModalState(prev => ({
                          ...prev,
                          data: { ...prev.data, commentaires: e.target.value }
                        }))}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-purple-400 uppercase mb-1">
                        🔄 Partages
                      </label>
                      <input 
                        className="pub-form-input font-mono text-xs" 
                        type="number" 
                        min="0"
                        placeholder="0"
                        value={editModalState.data.partages ?? 0}
                        onChange={e => setEditModalState(prev => ({
                          ...prev,
                          data: { ...prev.data, partages: e.target.value }
                        }))}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-orange-400 uppercase mb-1">
                        ⚡ Engagement
                      </label>
                      <input 
                        className="pub-form-input font-mono text-xs text-orange-400 font-bold" 
                        type="number" 
                        min="0"
                        placeholder="Auto"
                        value={editModalState.data.engagement ?? ''}
                        onChange={e => setEditModalState(prev => ({
                          ...prev,
                          data: { ...prev.data, engagement: e.target.value }
                        }))}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[11px] text-slate-400">
                    <button
                      type="button"
                      className="text-xs text-orange-400 hover:text-orange-300 font-semibold"
                      onClick={() => {
                        const l = parseInt(editModalState.data.likes || 0, 10) || 0;
                        const c = parseInt(editModalState.data.commentaires || 0, 10) || 0;
                        const p = parseInt(editModalState.data.partages || 0, 10) || 0;
                        setEditModalState(prev => ({
                          ...prev,
                          data: { ...prev.data, engagement: l + c + p }
                        }));
                      }}
                    >
                      ⚡ Calculer Engagement Cumulé (Likes + Commentaires + Partages)
                    </button>
                    <span>
                      Taux estimé : <strong className="text-emerald-400 font-mono">
                        {(() => {
                          const v = parseInt(editModalState.data.vues || 0, 10) || 0;
                          const l = parseInt(editModalState.data.likes || 0, 10) || 0;
                          const c = parseInt(editModalState.data.commentaires || 0, 10) || 0;
                          const p = parseInt(editModalState.data.partages || 0, 10) || 0;
                          const eng = editModalState.data.engagement !== undefined && editModalState.data.engagement !== '' && !isNaN(editModalState.data.engagement)
                            ? parseInt(editModalState.data.engagement, 10)
                            : (l + c + p);
                          return v > 0 ? ((eng / v) * 100).toFixed(2) + '%' : '0%';
                        })()}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="adv-modal-footer">
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  onClick={() => setEditModalState(null)}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="btn btn-orange"
                >
                  {editModalState.mode === 'create' ? '➕ Créer la publication' : '💾 Enregistrer les modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: DELETE CONFIRMATION ─── */}
      {deleteModalPost && (
        <div className="adv-modal-overlay" onClick={() => setDeleteModalPost(null)}>
          <div className="adv-modal adv-modal-sm animate-fade" onClick={e => e.stopPropagation()}>
            <div className="adv-modal-header">
              <h2 className="adv-modal-title text-red-400">
                🗑 Confirmer la suppression
              </h2>
              <button className="adv-modal-close" onClick={() => setDeleteModalPost(null)}>✕</button>
            </div>

            <div className="adv-modal-body text-slate-200">
              <p className="mb-12">
                Êtes-vous sûr de vouloir supprimer définitivement cette publication du calendrier ?
              </p>
              
              <div className="bg-slate-900/80 p-12 rounded-lg border border-white/10 text-sm">
                <div className="font-bold text-white mb-4">
                  {deleteModalPost.title}
                </div>
                <div className="text-xs text-muted flex items-center gap-6">
                  <span>{getPlatformIcon(deleteModalPost.canal)} {deleteModalPost.canal}</span>
                  <span>·</span>
                  <span>🏢 {deleteModalPost.client}</span>
                  <span>·</span>
                  <span>📅 {getPostDateStr(deleteModalPost)} {deleteModalPost.time}</span>
                </div>
              </div>
            </div>

            <div className="adv-modal-footer">
              <button 
                type="button" 
                className="btn btn-ghost" 
                onClick={() => setDeleteModalPost(null)}
              >
                Annuler
              </button>
              <button 
                type="button" 
                className="btn btn-red" 
                onClick={handleDeletePost}
              >
                🗑 Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── LIGHTBOX ZOOM MODAL ─── */}
      {lightboxImage && (
        <div className="adv-lightbox-backdrop" onClick={() => setLightboxImage(null)}>
          <div className="adv-lightbox-content" onClick={e => e.stopPropagation()}>
            <button
              className="adv-lightbox-close"
              onClick={() => setLightboxImage(null)}
              title="Fermer"
            >
              ✕
            </button>
            <img
              src={lightboxImage}
              alt="Visuel agrandi"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
