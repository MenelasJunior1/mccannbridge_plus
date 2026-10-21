import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export default function DocumentsPage() {
  const { 
    documents, 
    clientsHierarchy, 
    addDocument, 
    updateDocument, 
    deleteDocument, 
    addDocumentVersion, 
    restoreDocumentVersion, 
    addDocumentComment, 
    toggleKnowledgeBase, 
    sendDocToAI 
  } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Filters & State
  const [selectedClient, setSelectedClient] = useState('Tous');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  
  // Modals & Drawers
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeDocDrawer, setActiveDocDrawer] = useState(null);
  const [showAddVersionModal, setShowAddVersionModal] = useState(false);
  const [newVersionComment, setNewVersionComment] = useState('');
  const [newCommentText, setNewCommentText] = useState('');

  // Upload Form State
  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: 'Guidelines',
    client: 'Orange Cameroun',
    brand: 'Orange (Telco & Data)',
    project: 'Campagne Ramadan 2026',
    description: '',
    fileType: 'pdf',
    fileSize: '2.4 MB',
    tags: '',
    inKnowledgeBase: true,
  });

  const categories = ['Tous', 'Guidelines', 'Brief', 'Création', 'Rapport', 'Contrat'];

  // Filter documents
  const filteredDocs = documents.filter(doc => {
    if (selectedClient !== 'Tous' && doc.client !== selectedClient) return false;
    if (selectedCategory !== 'Tous' && doc.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (doc.title || doc.name)?.toLowerCase().includes(q);
      const matchDesc = doc.description?.toLowerCase().includes(q);
      const matchTags = (doc.tags || []).some(t => t.toLowerCase().includes(q));
      const matchBrand = doc.brand?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchTags && !matchBrand) return false;
    }
    return true;
  });

  // Handle Document Upload
  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!uploadForm.title) return;

    const tagsArray = uploadForm.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const newDocItem = {
      id: `doc-${Date.now()}`,
      title: uploadForm.title.endsWith(`.${uploadForm.fileType}`) ? uploadForm.title : `${uploadForm.title}.${uploadForm.fileType}`,
      name: uploadForm.title,
      fileType: uploadForm.fileType,
      fileSize: uploadForm.fileSize || '1.8 MB',
      category: uploadForm.category,
      client: uploadForm.client,
      brand: uploadForm.brand,
      project: uploadForm.project,
      owner: user?.user || 'Steve B.',
      ownerId: user?.id || 'usr_steve',
      currentVersion: 'V1',
      status: 'Validé',
      inKnowledgeBase: uploadForm.inKnowledgeBase,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: tagsArray.length > 0 ? tagsArray : [uploadForm.category, uploadForm.brand],
      description: uploadForm.description || `Document officiel ${uploadForm.category} pour ${uploadForm.client}.`,
      content: `${uploadForm.title.toUpperCase()}\n\nContenu document pour ${uploadForm.brand} (${uploadForm.project}).\n${uploadForm.description}`,
      versions: [
        {
          id: 'v1',
          version: 'V1',
          date: new Date().toLocaleDateString('fr-FR'),
          author: user?.user || 'Steve B.',
          fileSize: uploadForm.fileSize || '1.8 MB',
          comment: 'Dépôt initial du document.',
          status: 'Validé',
        },
      ],
      comments: [],
    };

    addDocument(newDocItem);
    setShowUploadModal(false);
    setUploadForm({
      title: '',
      category: 'Guidelines',
      client: 'Orange Cameroun',
      brand: 'Orange (Telco & Data)',
      project: 'Campagne Ramadan 2026',
      description: '',
      fileType: 'pdf',
      fileSize: '2.4 MB',
      tags: '',
      inKnowledgeBase: true,
    });
  };

  // Open Document in AI Assistant
  const handleSendToAI = (docItem) => {
    sendDocToAI(docItem);
    navigate('/assistant-ia');
  };

  // Add new version
  const handleAddVersion = (e) => {
    e.preventDefault();
    if (!activeDocDrawer) return;

    const currentVNum = parseInt((activeDocDrawer.currentVersion || 'V1').replace('V', ''), 10) || 1;
    const nextV = `V${currentVNum + 1}`;

    const versionObj = {
      id: `v${Date.now()}`,
      version: nextV,
      date: new Date().toLocaleDateString('fr-FR'),
      author: user?.user || 'Steve B.',
      fileSize: activeDocDrawer.fileSize || '2.0 MB',
      comment: newVersionComment || `Mise à jour vers la version ${nextV}`,
      status: 'Validé',
    };

    addDocumentVersion(activeDocDrawer.id, versionObj);
    setShowAddVersionModal(false);
    setNewVersionComment('');
    
    // Refresh active drawer doc
    setActiveDocDrawer(prev => ({
      ...prev,
      currentVersion: nextV,
      versions: [versionObj, ...(prev.versions || [])],
    }));
  };

  // Add comment
  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !activeDocDrawer) return;

    const commentObj = {
      id: `c-${Date.now()}`,
      author: user?.user || 'Steve B.',
      role: user?.poste || 'Équipe McCann',
      date: `${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      content: newCommentText.trim(),
    };

    addDocumentComment(activeDocDrawer.id, commentObj);
    setNewCommentText('');
    setActiveDocDrawer(prev => ({
      ...prev,
      comments: [...(prev.comments || []), commentObj],
    }));
  };

  return (
    <div className="bridge-module-page space-y-6 pb-12 animate-in fade-in">
      {/* Header Banner */}
      <div className="bridge-module-head flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📁</span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Documents & Base Documentaire RAG
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestion centralisée des chartes, briefs, présentations et rapports. Versioning avec historique, commentaires et indexation instantanée pour l'Assistant IA.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
          >
            <span>📤</span>
            <span>Uploader un Document</span>
          </button>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Rechercher un document par nom, marque, projet ou tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 pl-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
          </div>

          {/* Client Filter */}
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="text-xs font-semibold py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
          >
            <option value="Tous">Tous les Clients</option>
            {clientsHierarchy.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          {/* Grid / Table View Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
              }`}
              title="Vue Grille"
            >
              ⊞
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                viewMode === 'table' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
              }`}
              title="Vue Tableau"
            >
              ☰
            </button>
          </div>
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

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocs.map(doc => (
            <div
              key={doc.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md hover:border-orange-300 dark:hover:border-orange-700 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Top Row: File icon, Type badge, Version pill & RAG status */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 flex items-center justify-center text-xl shrink-0">
                      {doc.fileType === 'pdf' ? '📕' : doc.fileType === 'docx' ? '📘' : doc.fileType === 'xlsx' ? '📊' : doc.fileType === 'pptx' ? '📙' : '📄'}
                    </div>
                    <div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {doc.category}
                      </span>
                      <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200">
                        {doc.currentVersion || 'V1'}
                      </span>
                    </div>
                  </div>

                  {/* RAG Knowledge Base Pill */}
                  <button
                    onClick={() => toggleKnowledgeBase(doc.id)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all border ${
                      doc.inKnowledgeBase
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                    }`}
                    title={doc.inKnowledgeBase ? 'Indexé dans le RAG pour l\'IA' : 'Non indexé dans le RAG'}
                  >
                    {doc.inKnowledgeBase ? '✓ RAG IA' : '○ Non-RAG'}
                  </button>
                </div>

                {/* Title */}
                <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1.5 line-clamp-2">
                  {doc.title || doc.name}
                </h3>

                {/* Breadcrumb / Project */}
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2 flex items-center gap-1.5 truncate">
                  <span className="text-orange-600 dark:text-orange-400 font-bold">{doc.brand}</span>
                  <span>›</span>
                  <span className="truncate">{doc.project}</span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2 leading-relaxed">
                  {doc.description}
                </p>

                {/* Tags & Metadata */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(doc.tags || []).slice(0, 3).map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-400"
                    >
                      #{t}
                    </span>
                  ))}
                  <span className="text-[10px] text-slate-400 ml-auto self-center">
                    {doc.fileSize}
                  </span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => setActiveDocDrawer(doc)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <span>🔍 Détails & Versions</span>
                  {(doc.versions || []).length > 1 && (
                    <span className="px-1 py-0.2 rounded-full text-[9px] bg-slate-300 dark:bg-slate-600 font-bold">
                      {doc.versions.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleSendToAI(doc)}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                >
                  <span>✨ Ouvrir dans IA</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-4">Document</th>
                  <th className="p-4">Catégorie</th>
                  <th className="p-4">Marque & Projet</th>
                  <th className="p-4">Version</th>
                  <th className="p-4">Statut RAG</th>
                  <th className="p-4">Taille</th>
                  <th className="p-4">Dernière MàJ</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDocs.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                      <span className="text-lg">
                        {doc.fileType === 'pdf' ? '📕' : doc.fileType === 'docx' ? '📘' : doc.fileType === 'xlsx' ? '📊' : '📄'}
                      </span>
                      <div>
                        <div className="truncate max-w-xs">{doc.title || doc.name}</div>
                        <div className="text-[11px] text-slate-400 font-normal truncate">{doc.description}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {doc.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{doc.brand}</div>
                      <div className="text-[11px] text-slate-400">{doc.project}</div>
                    </td>
                    <td className="p-4 font-mono font-bold text-blue-600">{doc.currentVersion || 'V1'}</td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleKnowledgeBase(doc.id)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          doc.inKnowledgeBase
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}
                      >
                        {doc.inKnowledgeBase ? '✓ Indexé RAG' : 'Non indexé'}
                      </button>
                    </td>
                    <td className="p-4 text-slate-500">{doc.fileSize}</td>
                    <td className="p-4 text-slate-400">
                      {new Date(doc.updatedAt || doc.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setActiveDocDrawer(doc)}
                          className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-lg font-semibold"
                        >
                          Détails
                        </button>
                        <button
                          onClick={() => handleSendToAI(doc)}
                          className="px-2.5 py-1 text-xs bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg"
                        >
                          ✨ IA
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">📤</span>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Uploader un Nouveau Document
                </h3>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3.5 text-xs">
              {/* Drag & Drop simulated dropzone */}
              <div className="p-6 border-2 border-dashed border-orange-300 dark:border-orange-800/80 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 text-center cursor-pointer hover:bg-orange-50 transition-colors">
                <span className="text-3xl block mb-2">📄</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Glissez et déposez votre fichier ici</span>
                <span className="text-[11px] text-slate-400 block mt-1">PDF, DOCX, PPTX, XLSX ou TXT (jusqu'à 50 MB)</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Nom / Titre du fichier :</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Brand_Guidelines_Orange_Cameroun_2026.pdf"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Catégorie :</label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {categories.filter(c => c !== 'Tous').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Format de fichier :</label>
                  <select
                    value={uploadForm.fileType}
                    onChange={(e) => setUploadForm({ ...uploadForm, fileType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="pdf">PDF (Document standard)</option>
                    <option value="docx">Word (DOCX)</option>
                    <option value="pptx">PowerPoint (PPTX)</option>
                    <option value="xlsx">Excel (XLSX)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Marque associée :</label>
                  <input
                    type="text"
                    value={uploadForm.brand}
                    onChange={(e) => setUploadForm({ ...uploadForm, brand: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Projet / Campagne :</label>
                  <input
                    type="text"
                    value={uploadForm.project}
                    onChange={(e) => setUploadForm({ ...uploadForm, project: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Description & Contenu synthétique :</label>
                <textarea
                  rows={3}
                  placeholder="Résumé du document, directives clés..."
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl">
                <input
                  type="checkbox"
                  id="chk-rag"
                  checked={uploadForm.inKnowledgeBase}
                  onChange={(e) => setUploadForm({ ...uploadForm, inKnowledgeBase: e.target.checked })}
                  className="accent-blue-600 rounded-sm"
                />
                <label htmlFor="chk-rag" className="font-bold text-blue-950 dark:text-blue-200 cursor-pointer">
                  Activer immédiatement l'indexation RAG dans l'Assistant IA
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md"
                >
                  Importer le Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Details & Version History Drawer */}
      {activeDocDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 flex items-center justify-center text-2xl shrink-0">
                  {activeDocDrawer.fileType === 'pdf' ? '📕' : activeDocDrawer.fileType === 'docx' ? '📘' : activeDocDrawer.fileType === 'xlsx' ? '📊' : '📄'}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
                    {activeDocDrawer.title || activeDocDrawer.name}
                  </h3>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <span className="font-semibold text-orange-600">{activeDocDrawer.brand}</span>
                    <span>•</span>
                    <span>{activeDocDrawer.project}</span>
                    <span>•</span>
                    <span className="font-mono font-bold text-blue-600">{activeDocDrawer.currentVersion || 'V1'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveDocDrawer(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSendToAI(activeDocDrawer)}
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center justify-center gap-2"
                >
                  <span>✨ Ouvrir dans l'Assistant IA</span>
                </button>
                <button
                  onClick={() => setShowAddVersionModal(true)}
                  className="px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5"
                >
                  <span>➕ Nouvelle Version</span>
                </button>
              </div>

              {/* Document Overview */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Description :</div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {activeDocDrawer.description || 'Aucune description fournie.'}
                </p>
                {activeDocDrawer.content && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Extrait textuel :</div>
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-400 whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {activeDocDrawer.content}
                    </div>
                  </div>
                )}
              </div>

              {/* Version History Timeline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Historique des Versions ({(activeDocDrawer.versions || []).length})
                  </span>
                </div>

                <div className="space-y-2.5">
                  {(activeDocDrawer.versions || []).map((ver, idx) => {
                    const isCurrent = ver.version === activeDocDrawer.currentVersion;
                    return (
                      <div
                        key={ver.id || idx}
                        className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                          isCurrent
                            ? 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-blue-600 text-white">
                              {ver.version}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              Par {ver.author}
                            </span>
                            <span className="text-[11px] text-slate-400">• {ver.date}</span>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                Actuelle
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">{ver.comment}</p>
                        </div>

                        {!isCurrent && (
                          <button
                            onClick={() => restoreDocumentVersion(activeDocDrawer.id, ver.version)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold shrink-0"
                            title="Restaurer cette version"
                          >
                            ↺ Restaurer
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Comments Thread */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Commentaires & Annotations ({(activeDocDrawer.comments || []).length})
                </span>

                <div className="space-y-2.5">
                  {(activeDocDrawer.comments || []).map(comment => (
                    <div
                      key={comment.id}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">{comment.author}</span>
                        <span className="text-[10px] text-slate-400">{comment.date}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300">{comment.content}</p>
                    </div>
                  ))}

                  {/* Add comment form */}
                  <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Ajouter une remarque ou directive sur ce document..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      className="flex-1 text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                    <button
                      type="submit"
                      disabled={!newCommentText.trim()}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-xs"
                    >
                      Publier
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Version Modal */}
      {showAddVersionModal && activeDocDrawer && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-3">
              Déposer une Nouvelle Version
            </h3>
            <form onSubmit={handleAddVersion} className="space-y-3.5 text-xs">
              <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center">
                <span>📁 Sélectionner le fichier mis à jour</span>
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Note de version / Modifications apportées :</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ex: Correction de la palette de couleurs suite au retour client..."
                  value={newVersionComment}
                  onChange={(e) => setNewVersionComment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddVersionModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md"
                >
                  Publier la Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
