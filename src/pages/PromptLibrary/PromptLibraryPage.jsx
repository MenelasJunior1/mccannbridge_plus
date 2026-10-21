import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import PromptVariableModal from '../../components/ai/PromptVariableModal';

export default function PromptLibraryPage() {
  const { 
    prompts, 
    addPrompt, 
    deletePrompt, 
    toggleFavoritePrompt, 
    activeAIContext, 
    setActiveAIContext 
  } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [activeModalPrompt, setActiveModalPrompt] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New prompt form state
  const [newPrompt, setNewPrompt] = useState({
    title: '',
    description: '',
    category: 'Création',
    profession: 'Directeur Artistique / Concepteur',
    tags: '',
    visibility: 'global',
    content: '',
  });

  const categories = ['Tous', 'Création', 'Stratégie', 'Social Media', 'Rédaction', 'Analyse', 'Projet'];

  // Filter prompts
  const filteredPrompts = prompts.filter(p => {
    if (selectedCategory !== 'Tous' && p.category !== selectedCategory) return false;
    if (onlyFavorites && !p.favorite) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title?.toLowerCase().includes(q);
      const matchDesc = p.description?.toLowerCase().includes(q);
      const matchTags = (p.tags || []).some(t => t.toLowerCase().includes(q));
      const matchAuthor = p.author?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchTags && !matchAuthor) return false;
    }
    return true;
  });

  const handleCreatePromptSubmit = (e) => {
    e.preventDefault();
    if (!newPrompt.title || !newPrompt.content) return;

    const tagsArray = newPrompt.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const promptObj = {
      id: `prompt-${Date.now()}`,
      title: newPrompt.title,
      description: newPrompt.description,
      category: newPrompt.category,
      profession: newPrompt.profession,
      author: `${user?.user || 'Utilisateur'} (McCann)`,
      visibility: newPrompt.visibility,
      tags: tagsArray.length > 0 ? tagsArray : [newPrompt.category],
      favorite: false,
      content: newPrompt.content,
      createdAt: new Date().toISOString(),
    };

    addPrompt(promptObj);
    setShowCreateModal(false);
    setNewPrompt({
      title: '',
      description: '',
      category: 'Création',
      profession: 'Directeur Artistique / Concepteur',
      tags: '',
      visibility: 'global',
      content: '',
    });
  };

  const handleApplyPrompt = (computedPrompt, promptItem) => {
    // Determine the corresponding agent
    const categoryAgentMap = {
      'Création': 'creative',
      'Stratégie': 'strategy',
      'Social Media': 'social',
      'Rédaction': 'copywriting',
      'Analyse': 'research',
      'Projet': 'project',
    };
    const targetAgentId = categoryAgentMap[promptItem.category] || 'creative';
    setActiveAIContext({ agentId: targetAgentId });

    // Navigate to Assistant IA with pre-filled state
    navigate('/assistant-ia');
  };

  return (
    <div className="bridge-module-page space-y-6 pb-12 animate-in fade-in">
      {/* Header Banner */}
      <div className="bridge-module-head flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">💡</span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Prompt Library & Templates Métiers
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Bibliothèque de prompts calibrés pour les équipes McCann & Orange Cameroun. Remplissez les variables dynamiques et lancez les générations en 1 clic.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
          >
            <span>➕</span>
            <span>Créer un Template</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Field */}
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Rechercher par titre, mot-clé, tag ou auteur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 pl-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
          </div>

          {/* Favorites Filter */}
          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
              onlyFavorites
                ? 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-300'
                : 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
            }`}
          >
            <span>{onlyFavorites ? '★' : '☆'}</span>
            <span>Favoris ({prompts.filter(p => p.favorite).length})</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 no-scrollbar">
          {categories.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Prompts Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPrompts.map(prompt => {
          // Extract variables in content
          const matches = prompt.content?.match(/\{\{([^}]+)\}\}/g) || [];
          const varCount = Array.from(new Set(matches)).length;

          return (
            <div
              key={prompt.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md hover:border-orange-300 dark:hover:border-orange-700 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Top Row: Category & Favorite */}
                <div className="flex items-center justify-between mb-2.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60">
                    {prompt.category}
                  </span>
                  <button
                    onClick={() => toggleFavoritePrompt(prompt.id)}
                    className="text-base text-slate-300 hover:text-amber-500 transition-colors p-1"
                    title={prompt.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    {prompt.favorite ? '★' : '☆'}
                  </button>
                </div>

                {/* Title */}
                <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1.5 line-clamp-2">
                  {prompt.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2 leading-relaxed">
                  {prompt.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(prompt.tags || []).map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-400"
                    >
                      #{t}
                    </span>
                  ))}
                  {varCount > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-[10px] font-bold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                      {varCount} variable(s)
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="text-[11px] text-slate-400 truncate">
                  Par {prompt.author || 'McCann'}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setActiveModalPrompt(prompt)}
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <span>🚀 Utiliser</span>
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(prompt.content);
                      alert('Prompt copié dans le presse-papier !');
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Copier le texte brut"
                  >
                    📋
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Variable Customization Modal */}
      {activeModalPrompt && (
        <PromptVariableModal
          isOpen={Boolean(activeModalPrompt)}
          prompt={activeModalPrompt}
          activeContext={activeAIContext}
          onClose={() => setActiveModalPrompt(null)}
          onApply={(computed) => handleApplyPrompt(computed, activeModalPrompt)}
        />
      )}

      {/* Create New Prompt Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">✨</span>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Nouveau Template de Prompt
                </h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
            </div>

            <form onSubmit={handleCreatePromptSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Titre du Template :</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Scénario Spot Radio 30s Ramadan..."
                  value={newPrompt.title}
                  onChange={(e) => setNewPrompt({ ...newPrompt, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Catégorie :</label>
                  <select
                    value={newPrompt.category}
                    onChange={(e) => setNewPrompt({ ...newPrompt, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {categories.filter(c => c !== 'Tous').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Visibilité :</label>
                  <select
                    value={newPrompt.visibility}
                    onChange={(e) => setNewPrompt({ ...newPrompt, visibility: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="global">Globale (Agence + Client)</option>
                    <option value="team">Équipe Interne McCann</option>
                    <option value="private">Privé</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Description courte :</label>
                <input
                  type="text"
                  placeholder="Objectif du prompt en 1 phrase..."
                  value={newPrompt.description}
                  onChange={(e) => setNewPrompt({ ...newPrompt, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tags (séparés par virgules) :</label>
                <input
                  type="text"
                  placeholder="Ex: Radio, Ramadan, Offre, Voix-off"
                  value={newPrompt.tags}
                  onChange={(e) => setNewPrompt({ ...newPrompt, tags: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Contenu du Prompt :</label>
                  <span className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold">
                    Astuce: utilisez &#123;&#123;variable&#125;&#125; pour insérer des champs dynamiques
                  </span>
                </div>
                <textarea
                  rows={6}
                  required
                  placeholder={`Rédige un script pour {{brand}} sur le projet {{campaign}}...\nObjectif : {{objective}}\nCible : {{audience}}`}
                  value={newPrompt.content}
                  onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md"
                >
                  Sauvegarder le Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
