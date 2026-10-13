import { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { CM_DATA } from '../../../data/community';
import PublicationImageManager, { BRAND_IMAGE_PRESETS } from './PublicationImageManager';

const CLIENT_OPTIONS = [
  'Orange Telco',
  'Orange Money',
  'Max it',
  'Orange Pulse',
  'Orange Digital Center',
  'Orange Business',
  'Orange LinkedIn',
  'Site web'
];

const PLATFORMS = [
  { id: 'Facebook', label: 'Facebook', icon: '📘', color: '#1877F2', maxChars: 2200, recommendedChars: 120 },
  { id: 'Instagram', label: 'Instagram', icon: '📸', color: '#E4405F', maxChars: 2200, recommendedChars: 150 },
  { id: 'TikTok', label: 'TikTok', icon: '🎵', color: '#000000', maxChars: 2200, recommendedChars: 100 },
  { id: 'LinkedIn', label: 'LinkedIn', icon: '💼', color: '#0A66C2', maxChars: 3000, recommendedChars: 250 },
  { id: 'Twitter/X', label: 'Twitter / X', icon: '🐦', color: '#1DA1F2', maxChars: 280, recommendedChars: 240 },
  { id: 'WhatsApp', label: 'Chaine WhatsApp', icon: '💬', color: '#25D366', maxChars: 1024, recommendedChars: 180 }
];

const FORMAT_OPTIONS = [
  { id: 'Image', label: 'Image', icon: '🖼️', badge: '1080×1080 / 1200×630' },
  { id: 'Carrousel', label: 'Carrousel', icon: '📑', badge: 'Multi-visuels 1080×1080' },
  { id: 'Reels', label: 'Réels / Story', icon: '📱', badge: 'Vertical 9:16 (1080×1920)' },
  { id: 'Vidéo', label: 'Vidéo courte', icon: '🎬', badge: 'Format paysage ou vertical' },
  { id: 'Thread', label: 'Post Texte / Thread', icon: '✍️', badge: 'Copy & Liens' }
];

const QUICK_HASHTAGS = [
  '#OrangeCameroun',
  '#OrangeMoney',
  '#IciOnEstEnFamille',
  '#MaxIt',
  '#PulseCommunity',
  '#OrangeDigitalCenter',
  '#Innovation',
  '#DataOrange'
];

const QUICK_EMOJIS = ['🔥', '📱', '🚀', '💬', '🎁', '✨', '🧡', '💳', '🎉', '⚡'];

const QUICK_CTAS = [
  '👉 Téléchargez Max it dès maintenant !',
  '📲 Composez le #150# pour activer votre offre.',
  '🔗 Cliquez sur le lien pour découvrir tous les détails.',
  '💬 Dites-nous en commentaire votre avis !',
  '💡 Tag un ami qui doit voir ceci absolument !'
];

export default function CommunityCreationStudio({ onNavigate }) {
  const { 
    publications = [], 
    calendarPosts = [], 
    addPublication, 
    updatePublication, 
    deletePublication, 
    submitForValidation,
    addCalendarPost,
    updateCalendarPost,
    deleteCalendarPost
  } = useApp();

  // Component state
  const [activeFilterPlatform, setActiveFilterPlatform] = useState('all');
  const [activeFilterStatus, setActiveFilterStatus] = useState('all');
  const [activeFilterClient, setActiveFilterClient] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [previewingPost, setPreviewingPost] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Quick composer form state
  const getInitialForm = () => {
    const today = new Date();
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + 1);
    const dateStr = nextDate.toISOString().split('T')[0];

    return {
      title: '',
      client: 'Orange Telco',
      plateforme: 'Facebook',
      format: 'Image',
      campaign: 'Communication Orange 2026',
      description: '',
      dateTarget: dateStr,
      heureTarget: '10:00',
      image: BRAND_IMAGE_PRESETS[0]?.url || '',
      url: '',
      isSponsored: false,
      sponsoringBudget: '150000',
      sponsoringObjective: 'Engagement & Conversions'
    };
  };

  const [form, setForm] = useState(getInitialForm);

  const showNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Harmonize all publications & calendar posts into a unified, safe list
  const allNormalizedPosts = useMemo(() => {
    const list = [];
    const seenIds = new Set();

    // 1. Process explicit publications
    publications.forEach((p) => {
      const id = String(p.id || '');
      if (id) seenIds.add(id);

      const rawStatut = p.statut || (p.status === 'PUBLISHED' ? 'Publié' : p.status === 'SCHEDULED' ? 'Programmé' : 'Brouillon');
      list.push({
        id: id || `pub-${Math.random()}`,
        source: 'publication',
        raw: p,
        title: p.title || 'Publication sans titre',
        client: p.client || 'Orange Cameroun',
        plateforme: p.plateforme || 'Facebook',
        format: p.format || 'Image',
        campaign: p.campaign || 'Campagne en cours',
        description: p.description || p.desc || '',
        dateTarget: p.dateTarget || p.date || '',
        heureTarget: p.heureTarget || p.time || '10:00',
        image: p.image || '',
        url: p.url || '',
        statut: rawStatut,
        isSponsored: !!p.isSponsored,
        sponsoring: p.sponsoring || { isSponsored: !!p.isSponsored, budget: p.sponsoringBudget || 0 },
        createdAt: p.createdAt || new Date().toISOString()
      });
    });

    // 2. Also map calendarPosts so the Community Manager sees all existing community publications
    calendarPosts.forEach((cp) => {
      const id = String(cp.id || '');
      if (seenIds.has(id)) return; // Avoid duplication
      seenIds.add(id);

      let computedStatut = 'Brouillon';
      if (cp.status === 'PUBLISHED') computedStatut = 'Publié';
      else if (cp.status === 'SCHEDULED') computedStatut = 'Programmé';
      else if (cp.status === 'PENDING') computedStatut = 'En validation';
      else if (cp.status === 'DRAFT') computedStatut = 'Brouillon';

      const canalMap = {
        'Facebook': 'Facebook',
        'Instagram': 'Instagram',
        'LinkedIn': 'LinkedIn',
        'X': 'Twitter/X',
        'TikTok': 'TikTok',
        'Chaine WhatsApp': 'WhatsApp'
      };

      const formatMap = {
        'Feed': 'Image',
        'Carrousel': 'Carrousel',
        'Réels et Story': 'Reels',
        'Portraits': 'Image',
        'Paysage': 'Image'
      };

      list.push({
        id: id || `cal-${Math.random()}`,
        source: 'calendar',
        raw: cp,
        title: cp.title || 'Post Calendrier CM',
        client: cp.client || 'Orange Telco',
        plateforme: canalMap[cp.canal] || cp.canal || 'Facebook',
        format: formatMap[cp.type] || cp.type || 'Image',
        campaign: cp.campaign || 'Communication Éditoriale',
        description: cp.desc || cp.description || '',
        dateTarget: cp.date || (cp.day ? `Jour ${cp.day}` : ''),
        heureTarget: cp.time || '10:00',
        image: cp.image || '',
        url: cp.url || '',
        statut: cp.statut || computedStatut,
        isSponsored: !!cp.isSponsored,
        sponsoring: cp.sponsoring || { isSponsored: !!cp.isSponsored },
        createdAt: cp.createdAt || new Date().toISOString()
      });
    });

    return list;
  }, [publications, calendarPosts]);

  // Filtered posts based on search, platform, status, and client
  const filteredPosts = useMemo(() => {
    return allNormalizedPosts.filter((post) => {
      // Platform filter
      if (activeFilterPlatform !== 'all' && post.plateforme !== activeFilterPlatform) {
        return false;
      }
      // Status filter
      if (activeFilterStatus !== 'all' && post.statut !== activeFilterStatus) {
        return false;
      }
      // Client filter
      if (activeFilterClient !== 'all' && post.client !== activeFilterClient) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = (post.title || '').toLowerCase().includes(query);
        const matchDesc = (post.description || '').toLowerCase().includes(query);
        const matchClient = (post.client || '').toLowerCase().includes(query);
        const matchCampaign = (post.campaign || '').toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchClient && !matchCampaign) {
          return false;
        }
      }
      return true;
    });
  }, [allNormalizedPosts, activeFilterPlatform, activeFilterStatus, activeFilterClient, searchQuery]);

  // Statistics
  const counts = useMemo(() => {
    return {
      total: allNormalizedPosts.length,
      brouillon: allNormalizedPosts.filter(p => p.statut === 'Brouillon').length,
      enValidation: allNormalizedPosts.filter(p => p.statut === 'En validation').length,
      aCorriger: allNormalizedPosts.filter(p => p.statut === 'À corriger').length,
      valide: allNormalizedPosts.filter(p => p.statut === 'Validé').length,
      programme: allNormalizedPosts.filter(p => p.statut === 'Programmé').length,
      publie: allNormalizedPosts.filter(p => p.statut === 'Publié').length,
    };
  }, [allNormalizedPosts]);

  // Helper formatting & badges
  const getStatusBadge = (statut) => {
    const s = String(statut || 'Brouillon').toLowerCase();
    if (s.includes('validation')) {
      return <span className="tag tag-yellow">⏳ EN VALIDATION</span>;
    }
    if (s.includes('corriger')) {
      return <span className="tag tag-red">🔧 À CORRIGER</span>;
    }
    if (s.includes('validé') || s.includes('valide')) {
      return <span className="tag tag-green">✅ VALIDÉ</span>;
    }
    if (s.includes('programme') || s.includes('programmé')) {
      return <span className="tag tag-blue">📅 PROGRAMMÉ</span>;
    }
    if (s.includes('publi')) {
      return <span className="tag tag-purple-solid">🚀 PUBLIÉ</span>;
    }
    return <span className="tag tag-muted">📝 BROUILLON</span>;
  };

  const getPlatformMeta = (platName) => {
    return PLATFORMS.find(p => p.id === platName) || {
      id: platName,
      label: platName,
      icon: '🌐',
      color: '#ff7900',
      maxChars: 2200,
      recommendedChars: 150
    };
  };

  // Form handling
  const handleInsertHashtag = (tag) => {
    setForm(prev => ({
      ...prev,
      description: prev.description ? `${prev.description} ${tag}` : tag
    }));
  };

  const handleInsertEmoji = (emoji) => {
    setForm(prev => ({
      ...prev,
      description: prev.description ? `${prev.description} ${emoji}` : emoji
    }));
  };

  const handleInsertCta = (cta) => {
    setForm(prev => ({
      ...prev,
      description: prev.description ? `${prev.description}\n\n${cta}` : cta
    }));
  };

  const handleSaveForm = async (targetStatus = 'Brouillon') => {
    if (!form.title.trim()) {
      showNotification('Veuillez renseigner au moins un titre pour la publication.');
      return;
    }

    const newPostPayload = {
      title: form.title.trim(),
      client: form.client,
      plateforme: form.plateforme,
      format: form.format,
      campaign: form.campaign.trim(),
      description: form.description.trim(),
      dateTarget: form.dateTarget,
      heureTarget: form.heureTarget,
      image: form.image,
      url: form.url.trim(),
      statut: targetStatus,
      isSponsored: !!form.isSponsored,
      sponsoring: {
        isSponsored: !!form.isSponsored,
        budget: Number(form.sponsoringBudget) || 0,
        objective: form.sponsoringObjective,
        currency: 'FCFA'
      }
    };

    if (addPublication) {
      await addPublication(newPostPayload);
    }

    // Also mirror to calendarPosts if addCalendarPost exists
    if (addCalendarPost && (targetStatus === 'Programmé' || targetStatus === 'Publié' || targetStatus === 'Brouillon')) {
      const canalMapRev = {
        'Facebook': 'Facebook',
        'Instagram': 'Instagram',
        'Twitter/X': 'X',
        'LinkedIn': 'LinkedIn',
        'TikTok': 'TikTok',
        'WhatsApp': 'Chaine WhatsApp'
      };
      const dayNum = form.dateTarget ? new Date(form.dateTarget).getDate() || 15 : 15;
      await addCalendarPost({
        title: form.title.trim(),
        client: form.client,
        canal: canalMapRev[form.plateforme] || form.plateforme,
        type: form.format === 'Reels' ? 'Réels et Story' : form.format === 'Carrousel' ? 'Carrousel' : 'Feed',
        format: form.format === 'Reels' ? 'Portraits' : 'Paysage',
        campaign: form.campaign.trim(),
        desc: form.description.trim(),
        date: form.dateTarget,
        day: dayNum,
        time: form.heureTarget,
        image: form.image,
        url: form.url.trim(),
        status: targetStatus === 'Publié' ? 'PUBLISHED' : targetStatus === 'Programmé' ? 'SCHEDULED' : targetStatus === 'En validation' ? 'PENDING' : 'DRAFT',
        isSponsored: !!form.isSponsored,
        sponsoring: {
          isSponsored: !!form.isSponsored,
          budget: Number(form.sponsoringBudget) || 0,
          currency: 'FCFA'
        }
      });
    }

    showNotification(
      targetStatus === 'En validation' 
        ? '🔥 Publication créée et transmise au circuit de validation !' 
        : '✅ Publication enregistrée avec succès comme Brouillon.'
    );

    setIsComposerOpen(false);
    setForm(getInitialForm());
  };

  const handleDuplicatePost = (post) => {
    setForm({
      title: `${post.title} (Copie)`,
      client: post.client,
      plateforme: post.plateforme,
      format: post.format,
      campaign: post.campaign,
      description: post.description,
      dateTarget: post.dateTarget || '',
      heureTarget: post.heureTarget || '10:00',
      image: post.image || '',
      url: post.url || '',
      isSponsored: !!post.isSponsored,
      sponsoringBudget: String(post.sponsoring?.budget || 150000),
      sponsoringObjective: post.sponsoring?.objective || 'Engagement & Conversions'
    });
    setIsComposerOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showNotification('📋 Publication dupliquée dans le studio de composition.');
  };

  const handleDelete = async (post) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer "${post.title}" ?`)) return;
    if (deletePublication) {
      await deletePublication(post.id);
    }
    if (deleteCalendarPost) {
      await deleteCalendarPost(post.id);
    }
    showNotification('🗑 Publication supprimée.');
  };

  const handleSubmitValidation = async (post) => {
    if (submitForValidation) {
      await submitForValidation(post.id, post.title);
      showNotification(`📤 "${post.title}" transmis au validateur.`);
    } else if (updatePublication) {
      await updatePublication(post.id, { statut: 'En validation' });
      showNotification(`📤 "${post.title}" transmis au validateur.`);
    }
  };

  return (
    <div className="community-creation-studio animate-fade">
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          style={{
            position: 'fixed',
            top: 24,
            right: 28,
            zIndex: 9999,
            background: '#0f172a',
            color: '#fff',
            border: '1px solid #ff7900',
            padding: '12px 20px',
            borderRadius: 10,
            boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}
        >
          <span>{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)}
            style={{ background: 'transparent', border: 'none', color: '#ff7900', cursor: 'pointer', fontSize: 16 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Hero Studio Header */}
      <div className="cm-section-card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span className="cm-tag-header cm-tag-orange">STUDIO DE CRÉATION MULTI-PLATEFORMES</span>
              <span className="text-xs font-semibold text-slate-400">McCann × Community Management</span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--dark)', margin: 0, letterSpacing: -0.5 }}>
              Studio de Création & Adaptation de Contenus
            </h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0', maxWidth: 780, lineHeight: 1.5 }}>
              Rédigez, adaptez vos formats par réseau social, personnalisez les visuels certifiés Orange et déclenchez le workflow de validation en 1 clic.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button 
              className={`btn ${isComposerOpen ? 'btn-ghost' : 'btn-orange'} btn-sm`}
              onClick={() => setIsComposerOpen(prev => !prev)}
              style={{ fontWeight: 700 }}
            >
              {isComposerOpen ? '✕ Fermer le studio' : '🔥 + Composer un post'}
            </button>
            {onNavigate && (
              <button 
                className="btn btn-ghost btn-sm"
                onClick={() => onNavigate('calendrier')}
                title="Consulter le calendrier éditorial"
              >
                📅 Voir Calendrier
              </button>
            )}
          </div>
        </div>

        {/* Quick KPI stats row */}
        <div className="cm-statuts-grid" style={{ marginTop: 20 }}>
          <div className="cm-statut-card" style={{ cursor: 'pointer' }} onClick={() => setActiveFilterStatus('all')}>
            <div className="cm-statut-value" style={{ color: '#ff7900' }}>{counts.total}</div>
            <div className="cm-statut-label">Total Créations</div>
          </div>
          <div className="cm-statut-card" style={{ cursor: 'pointer' }} onClick={() => setActiveFilterStatus('Brouillon')}>
            <div className="cm-statut-value" style={{ color: '#64748b' }}>{counts.brouillon}</div>
            <div className="cm-statut-label">Brouillons en cours</div>
          </div>
          <div className="cm-statut-card" style={{ cursor: 'pointer' }} onClick={() => setActiveFilterStatus('En validation')}>
            <div className="cm-statut-value" style={{ color: '#f59e0b' }}>{counts.enValidation}</div>
            <div className="cm-statut-label">En attente validation</div>
          </div>
          <div className="cm-statut-card" style={{ cursor: 'pointer' }} onClick={() => setActiveFilterStatus('Validé')}>
            <div className="cm-statut-value" style={{ color: '#10b981' }}>{counts.valide}</div>
            <div className="cm-statut-label">Validés prêts</div>
          </div>
        </div>
      </div>

      {/* ─── LIVE COMPOSER STUDIO DRAWER / ACCORDION ─── */}
      {isComposerOpen && (
        <div className="cm-section-card animate-fade" style={{ border: '2px solid rgba(255,121,0,0.3)', background: '#fafafc', marginBottom: 24 }}>
          <div className="cm-section-head" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="cm-tag-header cm-tag-orange">POST COMPOSER STUDIO</span>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--dark)' }}>
                Nouvelle Publication Multi-Plateformes
              </h3>
            </div>
            <button 
              className="btn btn-ghost btn-sm"
              onClick={() => setIsComposerOpen(false)}
            >
              Fermer ✕
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)', gap: 24, marginTop: 16 }}>
            {/* Form Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Client & Campaign */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="pub-form-group">
                  <label className="pub-form-label">Client / Marque *</label>
                  <select 
                    className="pub-form-select"
                    value={form.client}
                    onChange={e => setForm({ ...form, client: e.target.value })}
                  >
                    {CLIENT_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="pub-form-group">
                  <label className="pub-form-label">Campagne / Tag</label>
                  <input 
                    className="pub-form-input"
                    type="text"
                    placeholder="Ex: Super Promo Data 2026"
                    value={form.campaign}
                    onChange={e => setForm({ ...form, campaign: e.target.value })}
                  />
                </div>
              </div>

              {/* Platform Selector buttons */}
              <div className="pub-form-group">
                <label className="pub-form-label">Réseau social cible *</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {PLATFORMS.map(p => {
                    const isSelected = form.plateforme === p.id;
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => setForm({ ...form, plateforme: p.id })}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 14px',
                          borderRadius: 8,
                          border: isSelected ? `2px solid ${p.color}` : '1px solid #cbd5e1',
                          background: isSelected ? p.color : '#fff',
                          color: isSelected ? '#fff' : '#1e293b',
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: 12.5,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span>{p.icon}</span>
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Format selection */}
              <div className="pub-form-group">
                <label className="pub-form-label">Format de publication *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
                  {FORMAT_OPTIONS.map(f => {
                    const isSelected = form.format === f.id;
                    return (
                      <div
                        key={f.id}
                        onClick={() => setForm({ ...form, format: f.id })}
                        style={{
                          border: isSelected ? '2px solid #ff7900' : '1px solid #e2e8f0',
                          background: isSelected ? 'rgba(255,121,0,0.06)' : '#fff',
                          borderRadius: 8,
                          padding: '10px 12px',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ fontSize: 18 }}>{f.icon}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? '#ff7900' : '#1e293b', marginTop: 2 }}>{f.label}</div>
                        <div style={{ fontSize: 9.5, color: '#94a3b8', marginTop: 2 }}>{f.badge}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Post Title */}
              <div className="pub-form-group">
                <label className="pub-form-label">Titre éditorial du Post *</label>
                <input 
                  className="pub-form-input"
                  type="text"
                  placeholder="Ex: Flash Promo Max It — 100% Bonus Data & Recharge Facile"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                />
              </div>

              {/* Date & Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="pub-form-group">
                  <label className="pub-form-label">Date cible de diffusion</label>
                  <input 
                    className="pub-form-input"
                    type="date"
                    value={form.dateTarget}
                    onChange={e => setForm({ ...form, dateTarget: e.target.value })}
                  />
                </div>
                <div className="pub-form-group">
                  <label className="pub-form-label">Heure de diffusion</label>
                  <input 
                    className="pub-form-input"
                    type="time"
                    value={form.heureTarget}
                    onChange={e => setForm({ ...form, heureTarget: e.target.value })}
                  />
                </div>
              </div>

              {/* Copywriting / Description */}
              <div className="pub-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label className="pub-form-label" style={{ margin: 0 }}>Copywriting / Légende du post</label>
                  <span style={{ fontSize: 11, color: form.description.length > (getPlatformMeta(form.plateforme).recommendedChars * 2) ? '#e11d48' : '#64748b' }}>
                    {form.description.length} / {getPlatformMeta(form.plateforme).maxChars} caractères (recommandé: ~{getPlatformMeta(form.plateforme).recommendedChars})
                  </span>
                </div>
                <textarea 
                  className="pub-form-textarea"
                  rows={4}
                  placeholder="Rédigez ici le copy complet de votre publication, les accroches, les hashtags et le CTA..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {/* Quick Hashtags, Emojis and CTAs */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>
                  ⚡ Accélérateurs de rédaction
                </div>
                
                {/* Hashtags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: '#94a3b8', alignSelf: 'center', marginRight: 4 }}>Hashtags:</span>
                  {QUICK_HASHTAGS.map(tag => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => handleInsertHashtag(tag)}
                      style={{
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: 4,
                        padding: '2px 7px',
                        fontSize: 11,
                        color: '#0284c7',
                        cursor: 'pointer'
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                {/* Emojis */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: '#94a3b8', alignSelf: 'center', marginRight: 4 }}>Émojis:</span>
                  {QUICK_EMOJIS.map(em => (
                    <button
                      type="button"
                      key={em}
                      onClick={() => handleInsertEmoji(em)}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 4,
                        padding: '2px 8px',
                        fontSize: 14,
                        cursor: 'pointer'
                      }}
                    >
                      {em}
                    </button>
                  ))}
                </div>

                {/* CTAs */}
                <div>
                  <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Call-to-Action recommandés :</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {QUICK_CTAS.slice(0, 3).map((cta, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => handleInsertCta(cta)}
                        style={{
                          textAlign: 'left',
                          background: 'rgba(255,121,0,0.04)',
                          border: '1px dashed rgba(255,121,0,0.3)',
                          borderRadius: 4,
                          padding: '4px 8px',
                          fontSize: 11,
                          color: '#c2410c',
                          cursor: 'pointer'
                        }}
                      >
                        + {cta}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Image Manager */}
              <PublicationImageManager 
                value={form.image}
                onChange={newImg => setForm({ ...form, image: newImg })}
                label="Visuel de la publication (Presets certifiés Orange ou Upload direct)"
              />

              {/* Destination URL */}
              <div className="pub-form-group">
                <label className="pub-form-label">Lien / URL cible de la publication</label>
                <input 
                  className="pub-form-input"
                  type="url"
                  placeholder="Ex: https://www.facebook.com/... ou lien de destination Max it"
                  value={form.url}
                  onChange={e => setForm({ ...form, url: e.target.value })}
                />
              </div>

              {/* Sponsoring / Ads Toggle */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', margin: 0 }}>
                  <input 
                    type="checkbox"
                    checked={form.isSponsored}
                    onChange={e => setForm({ ...form, isSponsored: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: '#ff7900' }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>
                      📢 Booster cette publication (Ads / Sponsoring)
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      Transmettre directement au module Ads pour planification média payante.
                    </div>
                  </div>
                </label>

                {form.isSponsored && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                    <div>
                      <label className="pub-form-label" style={{ fontSize: 11 }}>Budget estimé (FCFA)</label>
                      <input 
                        className="pub-form-input"
                        type="number"
                        placeholder="150000"
                        value={form.sponsoringBudget}
                        onChange={e => setForm({ ...form, sponsoringBudget: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="pub-form-label" style={{ fontSize: 11 }}>Objectif de campagne</label>
                      <select 
                        className="pub-form-select"
                        value={form.sponsoringObjective}
                        onChange={e => setForm({ ...form, sponsoringObjective: e.target.value })}
                      >
                        <option value="Engagement & Conversions">Engagement & Conversions</option>
                        <option value="Portée & Notoriété">Portée & Notoriété</option>
                        <option value="Clics vers lien / App">Clics vers lien / App</option>
                        <option value="Vues de vidéo">Vues de vidéo</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                <button 
                  type="button" 
                  className="btn btn-orange"
                  onClick={() => handleSaveForm('En validation')}
                  style={{ fontWeight: 700 }}
                >
                  📤 Créer et Soumettre pour validation
                </button>
                <button 
                  type="button" 
                  className="btn btn-ghost"
                  onClick={() => handleSaveForm('Brouillon')}
                >
                  💾 Enregistrer comme Brouillon
                </button>
                <button 
                  type="button" 
                  className="btn btn-blue"
                  onClick={() => handleSaveForm('Programmé')}
                >
                  📅 Créer & Programmer
                </button>
                <button 
                  type="button" 
                  className="btn btn-ghost"
                  onClick={() => setIsComposerOpen(false)}
                >
                  Annuler
                </button>
              </div>
            </div>

            {/* Right Column: LIVE SOCIAL MOCKUP PREVIEW */}
            <div>
              <div style={{ position: 'sticky', top: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>👁 Aperçu Direct ({form.plateforme})</span>
                  <span style={{ fontSize: 10, color: '#ff7900' }}>Live Rendering</span>
                </div>

                {/* Mockup Card Container */}
                <div 
                  style={{
                    background: '#fff',
                    borderRadius: 12,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden'
                  }}
                >
                  {/* Account Header */}
                  <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div 
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          background: '#ff7900',
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: 14,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        OC
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>{form.client || 'Orange Cameroun'}</span>
                          <span style={{ color: '#0284c7', fontSize: 12 }} title="Compte officiel vérifié">✓</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>
                          {form.plateforme} · {form.dateTarget || 'Demain'} à {form.heureTarget || '10:00'}
                          {form.isSponsored && ' · Sponsorisé 📢'}
                        </div>
                      </div>
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: 16 }}>•••</span>
                  </div>

                  {/* Post Text */}
                  <div style={{ padding: '12px 14px', fontSize: 13, color: '#1e293b', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                    <strong style={{ display: 'block', marginBottom: 4, color: '#0f172a' }}>
                      {form.title || 'Titre de la publication...'}
                    </strong>
                    {form.description || 'Le texte du post et les hashtags apparaîtront ici en temps réel pendant votre rédaction...'}
                  </div>

                  {/* Post Visual */}
                  <div style={{ position: 'relative', width: '100%', background: '#0f172a', maxHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {form.image ? (
                      <img 
                        src={form.image} 
                        alt="Preview visuel" 
                        style={{ width: '100%', height: 'auto', maxHeight: 280, objectFit: 'cover' }} 
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>🖼️</div>
                        <div style={{ fontSize: 12 }}>Aucun visuel sélectionné</div>
                      </div>
                    )}
                    <span 
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        background: 'rgba(15,23,42,0.85)',
                        color: '#fff',
                        fontSize: 10,
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontWeight: 600
                      }}
                    >
                      {form.format}
                    </span>
                  </div>

                  {/* CTA Bar if URL */}
                  {form.url && (
                    <div style={{ padding: '10px 14px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                        🔗 {form.url}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#ff7900' }}>En savoir plus →</span>
                    </div>
                  )}

                  {/* Fake Engagement Bar */}
                  <div style={{ padding: '10px 14px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-around', color: '#64748b', fontSize: 12 }}>
                    <span>👍 J'aime</span>
                    <span>💬 Commenter</span>
                    <span>🔄 Partager</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── FILTERS & SEARCH BAR ─── */}
      <div className="cm-section-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
          {/* Search Input */}
          <div style={{ flex: '1 1 240px', maxWidth: 400, position: 'relative' }}>
            <input 
              type="text"
              placeholder="🔍 Rechercher par titre, copy, client ou campagne..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pub-form-input"
              style={{ paddingLeft: 34 }}
            />
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }}>🔍</span>
          </div>

          {/* Client Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Marque :</span>
            <select 
              className="pub-form-select"
              value={activeFilterClient}
              onChange={e => setActiveFilterClient(e.target.value)}
              style={{ width: 'auto', minWidth: 150 }}
            >
              <option value="all">Toutes les marques ({allNormalizedPosts.length})</option>
              {CLIENT_OPTIONS.map(c => {
                const count = allNormalizedPosts.filter(p => p.client === c).length;
                return <option key={c} value={c}>{c} ({count})</option>;
              })}
            </select>
          </div>

          {/* Status Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Statut :</span>
            <select 
              className="pub-form-select"
              value={activeFilterStatus}
              onChange={e => setActiveFilterStatus(e.target.value)}
              style={{ width: 'auto', minWidth: 160 }}
            >
              <option value="all">Tous les statuts</option>
              <option value="Brouillon">Brouillons ({counts.brouillon})</option>
              <option value="En validation">En validation ({counts.enValidation})</option>
              <option value="À corriger">À corriger ({counts.aCorriger})</option>
              <option value="Validé">Validés ({counts.valide})</option>
              <option value="Programmé">Programmés ({counts.programme})</option>
              <option value="Publié">Publiés ({counts.publie})</option>
            </select>
          </div>

          {/* View mode toggle (Grid vs Table) */}
          <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '6px 12px',
                background: viewMode === 'grid' ? '#0f172a' : '#fff',
                color: viewMode === 'grid' ? '#fff' : '#64748b',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600
              }}
              title="Vue Grille de cartes"
            >
              🖼️ Cartes
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 12px',
                background: viewMode === 'table' ? '#0f172a' : '#fff',
                color: viewMode === 'table' ? '#fff' : '#64748b',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600
              }}
              title="Vue Tableau complet"
            >
              📋 Tableau
            </button>
          </div>
        </div>

        {/* Platform Filter Buttons Strip */}
        <div className="cm-platform-filters" style={{ margin: 0 }}>
          <button 
            className={`cm-plat-btn ${activeFilterPlatform === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilterPlatform('all')}
          >
            Tous les réseaux ({allNormalizedPosts.length})
          </button>
          {PLATFORMS.map(p => {
            const count = allNormalizedPosts.filter(post => post.plateforme === p.id).length;
            const isAct = activeFilterPlatform === p.id;
            return (
              <button
                key={p.id}
                className={`cm-plat-btn ${isAct ? 'active' : ''}`}
                onClick={() => setActiveFilterPlatform(p.id)}
              >
                <span>{p.icon}</span>
                <span>{p.label} ({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── POSTS PRESENTATION (GRID OR TABLE) ─── */}
      <div className="cm-section-card">
        <div className="cm-section-head">
          <div>
            <span className="cm-tag-header cm-tag-blue">PUBLICATIONS & DÉCLINAISONS</span>
            <span className="text-muted text-xs font-semibold" style={{ marginLeft: 10 }}>
              {filteredPosts.length} publication{filteredPosts.length > 1 ? 's' : ''} affichée{filteredPosts.length > 1 ? 's' : ''}
            </span>
          </div>

          <button 
            className="btn btn-green btn-sm"
            onClick={() => setIsComposerOpen(true)}
          >
            + Composer un post
          </button>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="pub-empty-state" style={{ padding: '40px 16px' }}>
            <div className="pub-empty-icon">📝</div>
            <div className="pub-empty-title">Aucune publication trouvée</div>
            <div className="pub-empty-desc">
              {allNormalizedPosts.length === 0 
                ? 'Le studio de création est prêt. Créez votre premier post ou explorez les modèles Orange ci-dessous !'
                : 'Aucune publication ne correspond aux critères de filtre sélectionnés.'}
            </div>
            <button 
              className="btn btn-orange btn-sm" 
              style={{ marginTop: 14 }}
              onClick={() => {
                setActiveFilterPlatform('all');
                setActiveFilterStatus('all');
                setActiveFilterClient('all');
                setSearchQuery('');
                setIsComposerOpen(true);
              }}
            >
              🔥 Créer une publication maintenant
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* ─── GRID CARDS VIEW ─── */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 16 }}>
            {filteredPosts.map(post => {
              const platMeta = getPlatformMeta(post.plateforme);
              return (
                <div 
                  key={post.id}
                  style={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}
                  className="hover:shadow-md"
                >
                  {/* Card Visual Header */}
                  <div style={{ position: 'relative', width: '100%', height: 160, background: '#0f172a', overflow: 'hidden' }}>
                    {post.image ? (
                      <img 
                        src={post.image} 
                        alt={post.title} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 32 }}>
                        {platMeta.icon}
                      </div>
                    )}

                    {/* Platform Tag */}
                    <span 
                      style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        background: 'rgba(15,23,42,0.85)',
                        color: '#fff',
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 6,
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <span>{platMeta.icon}</span>
                      <span>{post.plateforme}</span>
                    </span>

                    {/* Format Tag */}
                    <span 
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        background: 'rgba(255,121,0,0.9)',
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 6
                      }}
                    >
                      {post.format}
                    </span>

                    {/* Sponsoring Badge */}
                    {post.isSponsored && (
                      <span 
                        style={{
                          position: 'absolute',
                          bottom: 10,
                          left: 10,
                          background: 'rgba(16,185,129,0.92)',
                          color: '#fff',
                          fontSize: 9.5,
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: 4
                        }}
                      >
                        📢 ADS SPONSORISÉ
                      </span>
                    )}
                  </div>

                  {/* Card Content Body */}
                  <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#ff7900' }}>
                        {post.client}
                      </span>
                      <div>{getStatusBadge(post.statut)}</div>
                    </div>

                    <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: '0 0 6px', lineHeight: 1.3 }}>
                      {post.title}
                    </h4>

                    {post.description && (
                      <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 10px', lineHeight: 1.4, flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {post.description}
                      </p>
                    )}

                    <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto', paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                      <span>📅 {post.dateTarget || 'Non planifié'}</span>
                      <span>⏰ {post.heureTarget || '10:00'}</span>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div style={{ padding: '8px 12px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button 
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '4px 8px', fontSize: 11 }}
                        onClick={() => setPreviewingPost(post)}
                        title="Aperçu grand format"
                      >
                        👁 Voir
                      </button>
                      <button 
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '4px 8px', fontSize: 11 }}
                        onClick={() => handleDuplicatePost(post)}
                        title="Dupliquer pour adapter à un autre réseau"
                      >
                        📋 Dupliquer
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: 4 }}>
                      {(post.statut === 'Brouillon' || post.statut === 'À corriger') && (
                        <button 
                          className="btn btn-orange btn-sm"
                          style={{ padding: '4px 8px', fontSize: 11, fontWeight: 700 }}
                          onClick={() => handleSubmitValidation(post)}
                          title="Transmettre au validateur"
                        >
                          📤 Soumettre
                        </button>
                      )}
                      <button 
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '4px 6px', fontSize: 11, color: '#ef4444' }}
                        onClick={() => handleDelete(post)}
                        title="Supprimer la publication"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ─── TABLE VIEW ─── */
          <div style={{ overflowX: 'auto' }}>
            <table className="table cm-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: 50 }}>VISUEL</th>
                  <th>TITRE & COPY</th>
                  <th>CLIENT / MARQUE</th>
                  <th>PLATEFORME</th>
                  <th>FORMAT</th>
                  <th>DATE / HEURE</th>
                  <th className="text-center">STATUT</th>
                  <th className="text-center" style={{ width: 140 }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map(post => {
                  const platMeta = getPlatformMeta(post.plateforme);
                  return (
                    <tr key={post.id} className="pub-table-row animate-fade">
                      <td>
                        <div style={{ width: 44, height: 44, borderRadius: 6, background: '#0f172a', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {post.image ? (
                            <img src={post.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span>{platMeta.icon}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>{post.title}</div>
                        {post.description && (
                          <div style={{ fontSize: 11, color: '#64748b', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {post.description}
                          </div>
                        )}
                        {post.isSponsored && (
                          <span style={{ fontSize: 9.5, color: '#10b981', fontWeight: 700 }}>📢 Ads sponsorisé</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600, color: '#ff7900', fontSize: 12 }}>{post.client}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                          <span>{platMeta.icon}</span>
                          <span>{post.plateforme}</span>
                        </span>
                      </td>
                      <td className="text-muted">{post.format}</td>
                      <td style={{ fontSize: 11.5 }}>
                        <div>{post.dateTarget || 'Non défini'}</div>
                        <div style={{ color: '#94a3b8' }}>{post.heureTarget || '10:00'}</div>
                      </td>
                      <td className="text-center">{getStatusBadge(post.statut)}</td>
                      <td className="text-center">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <button 
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '3px 6px', fontSize: 11 }}
                            onClick={() => setPreviewingPost(post)}
                            title="Voir le post"
                          >
                            👁
                          </button>
                          <button 
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '3px 6px', fontSize: 11 }}
                            onClick={() => handleDuplicatePost(post)}
                            title="Dupliquer"
                          >
                            📋
                          </button>
                          {(post.statut === 'Brouillon' || post.statut === 'À corriger') && (
                            <button 
                              className="btn btn-orange btn-sm"
                              style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}
                              onClick={() => handleSubmitValidation(post)}
                              title="Soumettre pour validation"
                            >
                              📤
                            </button>
                          )}
                          <button 
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '3px 6px', fontSize: 11, color: '#ef4444' }}
                            onClick={() => handleDelete(post)}
                            title="Supprimer"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── FULL POST PREVIEW MODAL ─── */}
      {previewingPost && (
        <div className="pub-modal-overlay" onClick={() => setPreviewingPost(null)}>
          <div className="pub-modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="pub-modal-header">
              <h2 className="pub-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{getPlatformMeta(previewingPost.plateforme).icon}</span>
                <span>Aperçu de Publication</span>
              </h2>
              <button className="pub-modal-close" onClick={() => setPreviewingPost(null)}>✕</button>
            </div>

            <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#ff7900' }}>{previewingPost.client}</span>
                  <span style={{ color: '#94a3b8', margin: '0 6px' }}>·</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{previewingPost.plateforme} ({previewingPost.format})</span>
                </div>
                <div>{getStatusBadge(previewingPost.statut)}</div>
              </div>

              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--dark)', margin: 0 }}>
                {previewingPost.title}
              </h3>

              {previewingPost.image && (
                <div style={{ borderRadius: 10, overflow: 'hidden', background: '#0f172a', maxHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={previewingPost.image} alt={previewingPost.title} style={{ width: '100%', height: 'auto', maxHeight: 320, objectFit: 'contain' }} />
                </div>
              )}

              {previewingPost.description && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: '#1e293b' }}>
                  {previewingPost.description}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, fontSize: 12, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
                <div>
                  <span style={{ color: '#94a3b8', display: 'block', fontSize: 10 }}>DATE CIBLE</span>
                  <strong style={{ color: '#0f172a' }}>{previewingPost.dateTarget || 'Non définie'}</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', display: 'block', fontSize: 10 }}>HEURE</span>
                  <strong style={{ color: '#0f172a' }}>{previewingPost.heureTarget || '10:00'}</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', display: 'block', fontSize: 10 }}>SPONSORING</span>
                  <strong style={{ color: previewingPost.isSponsored ? '#10b981' : '#64748b' }}>
                    {previewingPost.isSponsored ? `Oui (${previewingPost.sponsoring?.budget || 0} FCFA)` : 'Non boosté'}
                  </strong>
                </div>
              </div>

              {previewingPost.url && (
                <div style={{ fontSize: 12 }}>
                  <span style={{ color: '#94a3b8' }}>Lien de publication : </span>
                  <a href={previewingPost.url} target="_blank" rel="noopener noreferrer" style={{ color: '#0284c7', wordBreak: 'break-all' }}>
                    {previewingPost.url}
                  </a>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
                <button 
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    handleDuplicatePost(previewingPost);
                    setPreviewingPost(null);
                  }}
                >
                  📋 Dupliquer ce post
                </button>

                <div style={{ display: 'flex', gap: 8 }}>
                  {(previewingPost.statut === 'Brouillon' || previewingPost.statut === 'À corriger') && (
                    <button 
                      className="btn btn-orange btn-sm"
                      onClick={() => {
                        handleSubmitValidation(previewingPost);
                        setPreviewingPost(null);
                      }}
                    >
                      📤 Soumettre à validation
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm" onClick={() => setPreviewingPost(null)}>
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
