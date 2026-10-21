import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export default function AdminIAPage() {
  const { 
    agents, 
    addAgent, 
    updateAgent, 
    deleteAgent, 
    knowledgeChunks, 
    documents, 
    auditLogs,
    indexDocumentChunks 
  } = useApp();
  const { user, isAgency } = useAuth();

  const [activeTab, setActiveTab] = useState('agents'); // 'agents' | 'rag' | 'audit'
  const [editingAgent, setEditingAgent] = useState(null);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);

  // Filter state for audit logs
  const [auditFilter, setAuditFilter] = useState('');

  const handleSaveAgent = (e) => {
    e.preventDefault();
    if (!editingAgent.name || !editingAgent.systemPrompt) return;

    if (agents.some(a => a.id === editingAgent.id)) {
      updateAgent(editingAgent.id, editingAgent);
    } else {
      addAgent(editingAgent);
    }
    setShowAgentModal(false);
    setEditingAgent(null);
  };

  const handleTriggerReindexAll = () => {
    setIsIndexing(true);
    setTimeout(() => {
      // Vectorize all indexed documents
      const newChunks = [];
      documents.filter(d => d.inKnowledgeBase).forEach(docItem => {
        const text = docItem.content || docItem.description || '';
        const paragraphs = text.split('\n\n').filter(Boolean);
        paragraphs.forEach((p, idx) => {
          newChunks.push({
            id: `kc-${docItem.id}-${idx}`,
            documentId: docItem.id,
            documentTitle: docItem.title || docItem.name,
            category: docItem.category || 'Général',
            page: idx + 1,
            content: p,
            tags: docItem.tags || [],
          });
        });
      });

      if (newChunks.length > 0) {
        indexDocumentChunks(documents[0]?.id || 'all', newChunks);
      }
      setIsIndexing(false);
      alert('Indexation vectorielle et synchronisation RAG terminées avec succès !');
    }, 1500);
  };

  return (
    <div className="bridge-module-page space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="bridge-module-head flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">⚙️</span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Administration IA, Agents & Knowledge Base (RAG)
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gouvernance du fournisseur Groq, personnalisation des agents, indexation documentaire et traçabilité des opérations orchestrées par Phoenix.
          </p>
        </div>

        {/* Tabs switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('agents')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'agents'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            🤖 Agents ({agents.length})
          </button>
          <button
            onClick={() => setActiveTab('rag')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'rag'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            📚 RAG & Chunks ({knowledgeChunks.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'audit'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            📜 Audit Logs ({auditLogs.length})
          </button>
        </div>
      </div>

      {/* Tab 1: AI Agents Management */}
      {activeTab === 'agents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Catalogue des Agents IA Configurés
            </h2>
            <button
              onClick={() => {
                setEditingAgent({
                  id: `agent-custom-${Date.now()}`,
                  name: '',
                  role: '',
                  icon: '🤖',
                  description: '',
                  systemPrompt: '',
                  model: 'openai/gpt-oss-20b',
                  temperature: 0.7,
                  tools: ['general-ai'],
                  status: 'active',
                  category: 'Personnalisé',
                  color: '#4F46E5',
                });
                setShowAgentModal(true);
              }}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
            >
              <span>➕</span>
              <span>Ajouter un Agent</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map(agent => (
              <div
                key={agent.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                        style={{ background: `${agent.color || '#FF7900'}20`, border: `1.5px solid ${agent.color || '#FF7900'}` }}
                      >
                        {agent.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">{agent.name}</h3>
                        <p className="text-xs text-slate-500">{agent.role}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {agent.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                    {agent.description}
                  </p>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-[11px] font-mono text-slate-600 dark:text-slate-400 line-clamp-3 mb-3">
                    {agent.systemPrompt}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3">
                    <span>Modèle : <strong className="text-slate-700 dark:text-slate-300">{agent.model}</strong></span>
                    <span>Température : <strong className="text-slate-700 dark:text-slate-300">{agent.temperature}</strong></span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setEditingAgent({ ...agent });
                      setShowAgentModal(true);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg"
                  >
                    ✏️ Modifier
                  </button>
                  {agent.category === 'Personnalisé' && (
                    <button
                      onClick={() => deleteAgent(agent.id, agent.name)}
                      className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 rounded-lg"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: RAG & Vector Chunks Management */}
      {activeTab === 'rag' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Base Vectorielle & Fragments Documentaires (RAG)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {knowledgeChunks.length} sections documentaires indexées. Phoenix contrôle leur sélection, leur autorisation et les citations transmises à Groq.
              </p>
            </div>
            <button
              onClick={handleTriggerReindexAll}
              disabled={isIndexing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 shrink-0"
            >
              <span>{isIndexing ? '⏳' : '🔄'}</span>
              <span>{isIndexing ? 'Vectorisation en cours...' : 'Réindexer tous les documents'}</span>
            </button>
          </div>

          {/* Chunks table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">Document Source</th>
                    <th className="p-3.5">Catégorie</th>
                    <th className="p-3.5">Page</th>
                    <th className="p-3.5">Contenu Vectorisé</th>
                    <th className="p-3.5">Tags Clés</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {knowledgeChunks.map(chunk => (
                    <tr key={chunk.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>📄</span>
                        <span>{chunk.documentTitle}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {chunk.category}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500 font-mono">P.{chunk.page}</td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300 max-w-md truncate">
                        {chunk.content}
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1">
                          {(chunk.tags || []).map((t, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-[9px] font-bold text-blue-700 dark:text-blue-300 rounded-sm">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Journal d'Audit & Traçabilité des Actions IA
            </h2>
            <input
              type="text"
              placeholder="Filtrer par action ou ressource..."
              value={auditFilter}
              onChange={(e) => setAuditFilter(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">Date & Heure</th>
                    <th className="p-3.5">Utilisateur</th>
                    <th className="p-3.5">Action</th>
                    <th className="p-3.5">Type de Ressource</th>
                    <th className="p-3.5">Nom de la Ressource</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {auditLogs
                    .filter(l => !auditFilter || l.action?.toLowerCase().includes(auditFilter.toLowerCase()) || l.resourceName?.toLowerCase().includes(auditFilter.toLowerCase()))
                    .map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                          {new Date(log.timestamp).toLocaleString('fr-FR')}
                        </td>
                        <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">{log.userName || log.userId}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500 capitalize">{log.resourceType}</td>
                        <td className="p-3.5 font-medium text-slate-900 dark:text-white">{log.resourceName}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Create Agent Modal */}
      {showAgentModal && editingAgent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Configuration de l'Agent IA
              </h3>
              <button onClick={() => setShowAgentModal(false)} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
            </div>

            <form onSubmit={handleSaveAgent} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Nom de l'Agent :</label>
                  <input
                    type="text"
                    required
                    value={editingAgent.name}
                    onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Icône / Emoji :</label>
                  <input
                    type="text"
                    value={editingAgent.icon}
                    onChange={(e) => setEditingAgent({ ...editingAgent, icon: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-center"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Rôle / Spécialité :</label>
                <input
                  type="text"
                  required
                  value={editingAgent.role}
                  onChange={(e) => setEditingAgent({ ...editingAgent, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Description :</label>
                <input
                  type="text"
                  value={editingAgent.description}
                  onChange={(e) => setEditingAgent({ ...editingAgent, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Modèle Groq :</label>
                  <select
                    value={editingAgent.model}
                    onChange={(e) => setEditingAgent({ ...editingAgent, model: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="openai/gpt-oss-20b">OpenAI GPT OSS 20B</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Température ({editingAgent.temperature}) :</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={editingAgent.temperature}
                    onChange={(e) => setEditingAgent({ ...editingAgent, temperature: parseFloat(e.target.value) })}
                    className="w-full accent-orange-600 mt-2"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">System Prompt :</label>
                <textarea
                  rows={4}
                  required
                  value={editingAgent.systemPrompt}
                  onChange={(e) => setEditingAgent({ ...editingAgent, systemPrompt: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAgentModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md"
                >
                  Enregistrer l'Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
