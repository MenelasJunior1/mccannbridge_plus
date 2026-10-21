import React, { useState, useEffect, useRef } from 'react';
import {
  Bot, ChevronRight, FileText, History, Plus, Search,
  Send, Sparkles, Trash2, X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import ContextSelector from '../../components/ai/ContextSelector';
import PromptVariableModal from '../../components/ai/PromptVariableModal';
import ChatMessageItem from '../../components/ai/ChatMessageItem';

export default function AssistantIAPage() {
  const { 
    agents, 
    prompts, 
    documents, 
    conversations, 
    activeAIContext, 
    setActiveAIContext,
    createConversation,
    addMessageToConversation,
    deleteConversation,
    setMessageFeedback,
  } = useApp();

  const { user } = useAuth();

  // Active state
  const [selectedAgentId, setSelectedAgentId] = useState(activeAIContext.agentId || 'creative');
  const [currentConvId, setCurrentConvId] = useState(conversations[0]?.id || null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [activePromptModal, setActivePromptModal] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);
  const [searchHistory, setSearchHistory] = useState('');

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const selectedAgent = agents.find(a => a.id === selectedAgentId) || agents[0];
  const currentConversation = conversations.find(c => c.id === currentConvId);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages, streamingText, isLoading]);

  // Handle agent switch
  const handleSelectAgent = (agentId) => {
    setSelectedAgentId(agentId);
    setActiveAIContext({ agentId });
  };

  // Create new conversation session
  const handleNewConversation = () => {
    const newConv = {
      id: `conv-${Date.now()}`,
      title: `Nouvelle session (${selectedAgent?.name || 'IA'})`,
      userId: user?.id || 'usr_steve',
      userName: user?.user || 'Steve B.',
      agentId: selectedAgentId,
      agentName: selectedAgent?.name,
      clientId: activeAIContext.client,
      clientName: activeAIContext.client,
      brandId: activeAIContext.brand,
      brandName: activeAIContext.brand,
      projectId: activeAIContext.project,
      projectName: activeAIContext.project,
      selectedDocuments: activeAIContext.documents || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    createConversation(newConv);
    setCurrentConvId(newConv.id);
  };

  // Ensure there is at least one active conversation
  useEffect(() => {
    if (!currentConvId && conversations.length > 0) {
      setCurrentConvId(conversations[0].id);
    } else if (conversations.length === 0 && !currentConvId) {
      handleNewConversation();
    }
  }, [conversations, currentConvId]);

  // Send message to AI
  const handleSendMessage = async (customText = null) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || isLoading) return;

    // If no current conversation, create one
    let targetConvId = currentConvId;
    if (!targetConvId) {
      const newConv = {
        id: `conv-${Date.now()}`,
        title: textToSend.slice(0, 35) + '...',
        userId: user?.id || 'usr_steve',
        userName: user?.user || 'Steve B.',
        agentId: selectedAgentId,
        agentName: selectedAgent?.name,
        clientId: activeAIContext.client,
        clientName: activeAIContext.client,
        brandId: activeAIContext.brand,
        brandName: activeAIContext.brand,
        projectId: activeAIContext.project,
        projectName: activeAIContext.project,
        selectedDocuments: activeAIContext.documents || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      };
      createConversation(newConv);
      targetConvId = newConv.id;
      setCurrentConvId(newConv.id);
    }

    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: textToSend,
      createdAt: new Date().toISOString(),
    };

    addMessageToConversation(targetConvId, userMessage);
    setInputMessage('');
    setIsLoading(true);
    setStreamingText('');

    try {
      if (!user?.activeClientId) throw new Error('Aucun périmètre client actif.');

      const res = await fetch('/api/backend/v1/assistant/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ client_id: user.activeClientId, question: textToSend }),
      });

      const data = await res.json();
      if (!res.ok && !data.answer) throw new Error(data.error || `API HTTP Error: ${res.status}`);

      const assistantReply = data.answer || 'Le service de génération ne peut pas répondre actuellement.';
      const ragSources = (data.citations || []).map((citation) => ({
        id: citation.chunk_id,
        documentId: citation.document_version_id,
        title: citation.title,
        page: citation.page,
        category: data.grounded ? 'Source RAG vérifiée' : 'Non fondé',
        excerpt: citation.excerpt,
      }));

      const assistantMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: assistantReply,
        sources: ragSources,
        createdAt: new Date().toISOString(),
      };

      addMessageToConversation(targetConvId, assistantMessage);
    } catch (error) {
      console.warn('Phoenix assistant API error:', error);
      const assistantMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `L’assistant sécurisé est indisponible : ${error.message || 'erreur inconnue'}.`,
        sources: [],
        createdAt: new Date().toISOString(),
      };

      addMessageToConversation(targetConvId, assistantMessage);
    } finally {
      setIsLoading(false);
      setStreamingText('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleOpenDocPreview = (docId) => {
    const foundDoc = documents.find(d => d.id === docId);
    if (foundDoc) {
      setPreviewDoc(foundDoc);
    }
  };

  const filteredHistory = conversations.filter(c => 
    c.title?.toLowerCase().includes(searchHistory.toLowerCase()) ||
    c.agentName?.toLowerCase().includes(searchHistory.toLowerCase())
  );

  return (
    <div className="bridge-assistant-page flex flex-col h-[calc(100vh-100px)] min-h-[620px] -m-4 sm:-m-6 bg-slate-50 dark:bg-slate-950">
      {/* Top Bar with Agent Switcher & Session Controls */}
      <div className="bridge-ai-toolbar">
        {/* Left: Mobile Sidebar toggle & Active Agent Name */}
        <div className="bridge-ai-toolbar-actions">
          <button
            onClick={() => setShowHistorySidebar(!showHistorySidebar)}
            className="bridge-ai-tool-button"
            title="Historique des discussions"
          >
            <History size={15} />
            <span>Historique</span>
          </button>

          <button
            onClick={handleNewConversation}
            className="bridge-ai-tool-button bridge-ai-new-chat"
            title="Démarrer une nouvelle discussion"
          >
            <Plus size={15} />
            <span>Nouveau chat</span>
          </button>
        </div>

        {/* Center: Agent Switcher Horizontal Tabs */}
        <div className="bridge-ai-agent-tabs" role="tablist" aria-label="Agents IA">
          {agents.map(agent => {
            const isSelected = agent.id === selectedAgentId;
            return (
              <button
                key={agent.id}
                onClick={() => handleSelectAgent(agent.id)}
                role="tab"
                aria-selected={isSelected}
                className={`bridge-ai-agent-tab ${isSelected ? 'active' : ''}`}
              >
                <span>{agent.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Active Model Badge */}
        <div className="bridge-ai-model">
          <span />
          <span>Groq · orchestré par Phoenix</span>
        </div>
      </div>

      {/* Main Workspace Layout (Sidebar + Chat Canvas) */}
      <div className="bridge-ai-workspace">
        {showHistorySidebar && <button type="button" className="bridge-ai-history-backdrop" onClick={() => setShowHistorySidebar(false)} aria-label="Fermer l’historique" />}
        {/* Left History Drawer (collapsible) */}
        <aside className={`bridge-ai-history ${showHistorySidebar ? 'is-open' : ''}`}>
          {/* Header */}
          <div className="bridge-ai-history-head">
            <span>
              Sessions de travail <b>{conversations.length}</b>
            </span>
            <button
              onClick={() => setShowHistorySidebar(false)}
              className="bridge-ai-icon-button"
              aria-label="Fermer l’historique"
            >
              <X size={15} />
            </button>
          </div>

          {/* Search Box */}
          <div className="bridge-ai-history-search">
            <Search size={14} />
            <input
              type="text"
              placeholder="Rechercher une discussion..."
              value={searchHistory}
              onChange={(e) => setSearchHistory(e.target.value)}
              className="bridge-ai-search-input"
            />
          </div>

          {/* List of Sessions */}
          <div className="bridge-ai-session-list">
            {filteredHistory.map(conv => {
              const isActive = conv.id === currentConvId;
              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    setCurrentConvId(conv.id);
                    setSelectedAgentId(conv.agentId || 'creative');
                    setShowHistorySidebar(false);
                  }}
                  className={`bridge-ai-session ${isActive ? 'active' : ''}`}
                >
                  <div className="bridge-ai-session-copy">
                    <div>{conv.title || 'Discussion sans titre'}</div>
                    <div>
                      <span>{conv.agentName || 'IA'}</span>
                      <span>·</span>
                      <span>{new Date(conv.updatedAt || conv.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                    className="bridge-ai-delete-session"
                    title="Supprimer la session"
                    aria-label="Supprimer la session"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Chat Canvas */}
        <section className="bridge-ai-chat">
          {/* Context Selector & RAG Bar */}
          <div className="bridge-ai-context-zone">
            <ContextSelector
              activeContext={activeAIContext}
              onChange={(updated) => setActiveAIContext(updated)}
              availableDocuments={documents}
            />

            {/* Quick Prompts Bar */}
            <div className="bridge-ai-quick-prompts">
              <span className="bridge-ai-quick-label">
                <Sparkles size={13} /> Prompts rapides
              </span>
              {prompts.slice(0, 5).map(pr => (
                <button
                  key={pr.id}
                  onClick={() => setActivePromptModal(pr)}
                  className="bridge-ai-prompt-chip"
                >
                  <span>{pr.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="bridge-ai-messages">
            {(!currentConversation?.messages || currentConversation.messages.length === 0) ? (
              <div className="bridge-ai-empty animate-in fade-in">
                <div 
                  className="bridge-ai-empty-icon"
                >
                  <Bot size={26} />
                </div>
                <h2>
                  {selectedAgent?.name || 'McCann Assistant IA'}
                </h2>
                <p>
                  {selectedAgent?.description}
                </p>

                {/* Suggested starter prompts */}
                <div className="bridge-ai-starters">
                  <div className="bridge-ai-starters-label">
                    Suggestions d'amorces :
                  </div>
                  {prompts
                    .filter(p => p.category === selectedAgent?.category || p.favorite)
                    .slice(0, 3)
                    .map(promptItem => (
                      <div
                        key={promptItem.id}
                        onClick={() => setActivePromptModal(promptItem)}
                        className="bridge-ai-starter"
                      >
                        <div>
                          <span>{promptItem.title}</span>
                          <ChevronRight size={14} />
                        </div>
                        <p>{promptItem.description}</p>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="bridge-ai-thread">
                {currentConversation.messages.map((msg) => (
                  <ChatMessageItem
                    key={msg.id}
                    message={msg}
                    agent={selectedAgent}
                    onFeedback={(msgId, fb) => setMessageFeedback(currentConvId, msgId, fb)}
                    onOpenDocPreview={handleOpenDocPreview}
                  />
                ))}

                {/* Loading Indicator */}
                {isLoading && (
                  <div className="bridge-ai-loading animate-in fade-in">
                    <div 
                      className="bridge-ai-loading-mark"
                    >
                      <Bot size={16} />
                    </div>
                    <div className="bridge-ai-loading-copy">
                      <div className="bridge-ai-loading-dots">
                        <span />
                        <span />
                        <span />
                      </div>
                      <span>
                        {selectedAgent?.name} analyse le contexte et rédige la réponse...
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Bottom Chat Input Form */}
          <div className="bridge-ai-composer">
            <div className="bridge-ai-composer-inner">
              <div className="bridge-ai-input-wrap">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Demandez à ${selectedAgent?.name || 'l\'Assistant'} (ex: idées de campagne, analyse de doc, calendrier...) - Maj+Entrée pour saut de ligne`}
                  rows={2}
                  className="bridge-ai-input"
                />

                {/* Right Action Buttons */}
                <div className="bridge-ai-send-wrap">
                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || isLoading}
                    className="bridge-ai-send"
                  >
                    <span>Envoyer</span>
                    <Send size={14} />
                  </button>
                </div>
              </div>

              {/* Status footer bar */}
              <div className="bridge-ai-composer-meta">
                <div>
                  Contexte actif : <strong>{activeAIContext.brand}</strong> · <strong>{activeAIContext.project}</strong>
                </div>
                <div>
                  {(activeAIContext.documents || []).length} document(s) RAG activé(s)
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Prompt Customization Modal */}
      {activePromptModal && (
        <PromptVariableModal
          isOpen={Boolean(activePromptModal)}
          prompt={activePromptModal}
          activeContext={activeAIContext}
          onClose={() => setActivePromptModal(null)}
          onApply={(computedPrompt) => {
            setInputMessage(computedPrompt);
            if (textareaRef.current) {
              textareaRef.current.focus();
            }
          }}
        />
      )}

      {/* Document Inspector Modal */}
      {previewDoc && (
        <div className="bridge-ai-modal-overlay">
          <div className="bridge-ai-doc-modal">
            <div className="bridge-ai-doc-head">
              <div>
                <FileText size={19} />
                <div>
                  <h3>{previewDoc.title || previewDoc.name}</h3>
                  <p>{previewDoc.client} · {previewDoc.brand} · {previewDoc.currentVersion || 'V1'}</p>
                </div>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="bridge-ai-icon-button" aria-label="Fermer"><X size={16} /></button>
            </div>

            <div className="bridge-ai-doc-content">
              {previewDoc.content || previewDoc.description || 'Aucun aperçu textuel disponible.'}
            </div>

            <div className="bridge-ai-doc-actions">
              <button
                onClick={() => setPreviewDoc(null)}
                className="bridge-ai-tool-button bridge-ai-new-chat"
              >
                Fermer l'aperçu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
