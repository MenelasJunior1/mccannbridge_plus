import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { 
  db, 
  auth, 
  handleFirestoreError, 
  OperationType 
} from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs 
} from 'firebase/firestore';
import { INITIAL_TICKETS } from '../data/tickets';
import { INITIAL_CALENDAR } from '../data/calendar';
import { CM_DATA } from '../data/community';
import { INITIAL_BRIEFS } from '../data/briefs';
import { INITIAL_REPORTS, REPORT_STATUSES } from '../data/reportsData';
import { 
  INITIAL_DOCUMENTS, 
  INITIAL_AGENTS, 
  INITIAL_PROMPT_TEMPLATES, 
  INITIAL_CONVERSATIONS, 
  INITIAL_KNOWLEDGE_CHUNKS, 
  INITIAL_AUDIT_LOGS,
  INITIAL_CLIENTS_HIERARCHY
} from '../data/aiAndDocsData';
import { INITIAL_FINANCIAL_DOCUMENTS } from '../utils/financialUtils';
import {
  INITIAL_INFLUENCE_TALENTS,
  INITIAL_INFLUENCE_DELIVERABLES,
  INITIAL_INFLUENCE_SNAPSHOTS,
  INITIAL_INFLUENCE_CAMPAIGNS,
  INITIAL_AMBASSADOR_GROUPS,
  INITIAL_INFLUENCE_DUPLICATES,
  INITIAL_INFLUENCE_INSIGHTS,
  INITIAL_INFLUENCE_ALERTS,
  INITIAL_IMPORT_BATCH
} from '../data/influenceSeedData';

import { getInitialCommunityPosts } from '../pages/Calendar/sections/calendarMetrics';

const AppContext = createContext(null);

// Load publications from localStorage fallback (empty by default)
const loadSavedPublications = () => {
  try {
    const saved = localStorage.getItem('bridge_publications_v2');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

// Load calendar posts from localStorage with certified initial Community Manager publications
const loadSavedCalendarPosts = () => {
  try {
    const saved = localStorage.getItem('bridge_calendar_posts_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    const initial = getInitialCommunityPosts();
    try { localStorage.setItem('bridge_calendar_posts_v2', JSON.stringify(initial)); } catch (e) {}
    return initial;
  } catch (e) {
    return getInitialCommunityPosts();
  }
};

let nextPubId = 100;
let nextCalPostId = 100;

// Load briefs from localStorage if available fallback
const loadSavedBriefs = () => {
  try {
    const saved = localStorage.getItem('bridge_briefs_v2');
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    const demoIds = ['BR-2026-001', 'BR-2026-002', 'BR-2026-003', 'BR-2026-004', 'BR-2026-005', 'BR-2026-006'];
    const cleaned = Array.isArray(parsed) ? parsed.filter(b => b && b.id && !demoIds.includes(b.id)) : [];
    return cleaned;
  } catch (e) {
    return [];
  }
};

// Load reports from localStorage if available fallback
const loadSavedReports = () => {
  try {
    const saved = localStorage.getItem('bridge_reports_v2');
    return saved ? JSON.parse(saved) : INITIAL_REPORTS;
  } catch (e) {
    return INITIAL_REPORTS;
  }
};

// Load documents from localStorage fallback
const loadSavedDocuments = () => {
  try {
    const saved = localStorage.getItem('bridge_documents_v2');
    return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
  } catch (e) {
    return INITIAL_DOCUMENTS;
  }
};

// Load agents from localStorage fallback
const loadSavedAgents = () => {
  try {
    const saved = localStorage.getItem('bridge_agents_v2');
    return saved ? JSON.parse(saved) : INITIAL_AGENTS;
  } catch (e) {
    return INITIAL_AGENTS;
  }
};

// Load prompts from localStorage fallback
const loadSavedPrompts = () => {
  try {
    const saved = localStorage.getItem('bridge_prompts_v2');
    return saved ? JSON.parse(saved) : INITIAL_PROMPT_TEMPLATES;
  } catch (e) {
    return INITIAL_PROMPT_TEMPLATES;
  }
};

// Load conversations from localStorage fallback
const loadSavedConversations = () => {
  try {
    const saved = localStorage.getItem('bridge_conversations_v2');
    return saved ? JSON.parse(saved) : INITIAL_CONVERSATIONS;
  } catch (e) {
    return INITIAL_CONVERSATIONS;
  }
};

// Load knowledge chunks from localStorage fallback
const loadSavedKnowledgeChunks = () => {
  try {
    const saved = localStorage.getItem('bridge_knowledge_chunks_v2');
    return saved ? JSON.parse(saved) : INITIAL_KNOWLEDGE_CHUNKS;
  } catch (e) {
    return INITIAL_KNOWLEDGE_CHUNKS;
  }
};

// Load audit logs from localStorage fallback
const loadSavedAuditLogs = () => {
  try {
    const saved = localStorage.getItem('bridge_audit_logs_v2');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  } catch (e) {
    return INITIAL_AUDIT_LOGS;
  }
};

// Load registered influencers from localStorage fallback (with INITIAL_INFLUENCE_TALENTS seed fallback)
const loadSavedInfluencers = () => {
  try {
    const saved = localStorage.getItem('bridge_influencers_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(inf => ({
          ...inf,
          campaigns: typeof inf.campaigns === 'number' && inf.campaigns > 0 ? inf.campaigns : 0,
          contracts: Array.isArray(inf.contracts) ? inf.contracts : [],
          factures: Array.isArray(inf.factures) ? inf.factures : [],
          cahierDesCharges: Array.isArray(inf.cahierDesCharges) ? inf.cahierDesCharges : [],
          publicationStats: Array.isArray(inf.publicationStats)
            ? inf.publicationStats.filter(p => p && p.isNewlyCreated && !p.isDemo && !p.isExample && p.vues !== 205000 && p.views !== 205000)
            : [],
          performanceHistory: Array.isArray(inf.performanceHistory)
            ? inf.performanceHistory.filter(h =>
                h &&
                h.isNewlyCreated &&
                !h.isDemo &&
                !h.isExample &&
                h.campaign !== 'Orange Weekend Mars' &&
                h.campaign !== 'Pulse Jeunesse Fév' &&
                h.campaign !== 'OM Transfert Jan'
              )
            : [],
          paiements: Array.isArray(inf.paiements) ? inf.paiements : [],
          pendingDeliverables: Array.isArray(inf.pendingDeliverables) ? inf.pendingDeliverables : [],
          scorePerformance: inf.isNewlyCreated ? inf.scorePerformance : null,
          score: inf.isNewlyCreated ? inf.score : null
        }));
      }
    }
    return INITIAL_INFLUENCE_TALENTS;
  } catch (e) {
    return INITIAL_INFLUENCE_TALENTS;
  }
};

const loadSavedInfluenceDeliverables = () => {
  try {
    const saved = localStorage.getItem('bridge_influence_deliverables_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Exclure les livrables d'exemple : conserver uniquement les créations réelles
        return parsed.filter(d =>
          d &&
          d.isNewlyCreated === true &&
          !d.isDemo &&
          !d.isExample &&
          d.metrics?.views !== 205000 &&
          d.views !== 205000 &&
          d.metrics?.likes !== 16700 &&
          d.likes !== 16700
        );
      }
    }
    return [];
  } catch (e) {
    return [];
  }
};

const loadSavedInfluenceCampaigns = () => {
  try {
    const saved = localStorage.getItem('bridge_influence_campaigns_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Exclude legacy mock campaigns, strictly keep newly recorded campaigns
        return parsed.filter(c =>
          c &&
          c.isNewlyCreated === true &&
          !c.isDemo &&
          !c.isExample &&
          !['CAMP-ORANGE-WEEKEND', 'CAMP-ORANGE-RELAY-2025', 'CAMP-ORANGE-Q4-2025', 'CAMP-001', 'CAMP-002', 'CAMP-003'].includes(c.id) &&
          !['Orange Weekend 2025', 'Relais Média & Webzines', 'Campagnes & Challenges Q4 2025'].includes(c.name) &&
          !c.id?.startsWith('mock-')
        );
      }
    }
    return [];
  } catch (e) {
    return [];
  }
};

const loadSavedInfluenceAmbassadorGroups = () => {
  try {
    const saved = localStorage.getItem('bridge_influence_groups_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    return INITIAL_AMBASSADOR_GROUPS;
  } catch (e) {
    return INITIAL_AMBASSADOR_GROUPS;
  }
};

const loadSavedInfluenceDuplicates = () => {
  try {
    const saved = localStorage.getItem('bridge_influence_duplicates_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    return INITIAL_INFLUENCE_DUPLICATES;
  } catch (e) {
    return INITIAL_INFLUENCE_DUPLICATES;
  }
};

const loadSavedInfluenceInsights = () => {
  try {
    const saved = localStorage.getItem('bridge_influence_insights_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter(i => i && i.isNewlyCreated === true && !i.isDemo && !i.isExample);
      }
    }
    return [];
  } catch (e) {
    return [];
  }
};

const loadSavedInfluenceAlerts = () => {
  try {
    const saved = localStorage.getItem('bridge_influence_alerts_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    return INITIAL_INFLUENCE_ALERTS;
  } catch (e) {
    return INITIAL_INFLUENCE_ALERTS;
  }
};

const loadSavedInfluenceBatches = () => {
  try {
    const saved = localStorage.getItem('bridge_influence_batches_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    return [INITIAL_IMPORT_BATCH];
  } catch (e) {
    return [INITIAL_IMPORT_BATCH];
  }
};

// Load financial documents from localStorage fallback
const loadSavedFinancialDocuments = () => {
  try {
    const saved = localStorage.getItem('bridge_financial_docs_v2');
    return saved ? JSON.parse(saved) : INITIAL_FINANCIAL_DOCUMENTS;
  } catch (e) {
    return INITIAL_FINANCIAL_DOCUMENTS;
  }
};

const loadSavedTickets = () => {
  try {
    const saved = localStorage.getItem('bridge_traffic_tickets_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter(t => t && !t.isDemo && !t.isExample && !t.id?.startsWith('TK-04') && t.isNewlyCreated === true);
      }
    }
    return [];
  } catch (e) {
    return [];
  }
};

const initialState = {
  tickets: loadSavedTickets(),
  calendar: INITIAL_CALENDAR,
  publications: loadSavedPublications(),
  calendarPosts: loadSavedCalendarPosts(),
  influencers: loadSavedInfluencers(),
  influenceTalents: loadSavedInfluencers(),
  influenceCampaigns: loadSavedInfluenceCampaigns(),
  influenceDeliverables: loadSavedInfluenceDeliverables(),
  influenceSnapshots: INITIAL_INFLUENCE_SNAPSHOTS,
  influenceAmbassadorGroups: loadSavedInfluenceAmbassadorGroups(),
  influenceDuplicates: loadSavedInfluenceDuplicates(),
  influenceInsights: loadSavedInfluenceInsights(),
  influenceAlerts: loadSavedInfluenceAlerts(),
  influenceImportBatches: loadSavedInfluenceBatches(),
  influenceUserRole: 'direction_agence',
  financialDocuments: loadSavedFinancialDocuments(),
  briefs: loadSavedBriefs(),
  reports: loadSavedReports(),
  documents: loadSavedDocuments(),
  agents: loadSavedAgents(),
  prompts: loadSavedPrompts(),
  conversations: loadSavedConversations(),
  knowledgeChunks: loadSavedKnowledgeChunks(),
  auditLogs: loadSavedAuditLogs(),
  clientsHierarchy: INITIAL_CLIENTS_HIERARCHY,
  activeAIContext: {
    client: 'Orange Cameroun',
    brand: 'Orange (Telco & Data)',
    project: 'Campagne Ramadan 2026',
    documents: [],
    agentId: 'creative',
  },
  notifications: [],
  firestoreReady: false,
};

function appReducer(state, action) {
  switch (action.type) {
    // ─── Direct Firestore Sync ───
    case 'SYNC_BRIEFS':
      return { ...state, briefs: action.briefs, firestoreReady: true };

    case 'SYNC_REPORTS':
      return { ...state, reports: action.reports, firestoreReady: true };

    case 'SYNC_TICKETS':
      return { ...state, tickets: action.tickets, firestoreReady: true };

    case 'SYNC_PUBLICATIONS':
      return { ...state, publications: action.publications, firestoreReady: true };

    case 'SYNC_CALENDAR_POSTS':
      return { ...state, calendarPosts: action.calendarPosts, firestoreReady: true };

    case 'SYNC_NOTIFICATIONS':
      return { ...state, notifications: action.notifications, firestoreReady: true };

    case 'SYNC_DOCUMENTS':
      return { ...state, documents: action.documents, firestoreReady: true };

    case 'SYNC_AGENTS':
      return { ...state, agents: action.agents, firestoreReady: true };

    case 'SYNC_PROMPTS':
      return { ...state, prompts: action.prompts, firestoreReady: true };

    case 'SYNC_CONVERSATIONS':
      return { ...state, conversations: action.conversations, firestoreReady: true };

    case 'SYNC_KNOWLEDGE_CHUNKS':
      return { ...state, knowledgeChunks: action.knowledgeChunks, firestoreReady: true };

    case 'SYNC_AUDIT_LOGS':
      return { ...state, auditLogs: action.auditLogs, firestoreReady: true };

    case 'SYNC_INFLUENCERS': {
      const sanitized = (action.influencers || []).map(inf => ({
        ...inf,
        campaigns: typeof inf.campaigns === 'number' && inf.campaigns > 0 ? inf.campaigns : 0,
        contracts: Array.isArray(inf.contracts) ? inf.contracts : [],
        factures: Array.isArray(inf.factures) ? inf.factures : [],
        cahierDesCharges: Array.isArray(inf.cahierDesCharges) ? inf.cahierDesCharges : [],
        publicationStats: Array.isArray(inf.publicationStats)
          ? inf.publicationStats.filter(p => p && p.isNewlyCreated && !p.isDemo && !p.isExample && p.vues !== 205000 && p.views !== 205000)
          : [],
        performanceHistory: Array.isArray(inf.performanceHistory)
          ? inf.performanceHistory.filter(h =>
              h &&
              h.isNewlyCreated &&
              !h.isDemo &&
              !h.isExample &&
              h.campaign !== 'Orange Weekend Mars' &&
              h.campaign !== 'Pulse Jeunesse Fév' &&
              h.campaign !== 'OM Transfert Jan'
            )
          : [],
        paiements: Array.isArray(inf.paiements) ? inf.paiements : [],
        pendingDeliverables: Array.isArray(inf.pendingDeliverables) ? inf.pendingDeliverables : [],
        scorePerformance: inf.isNewlyCreated ? inf.scorePerformance : null,
        score: inf.isNewlyCreated ? inf.score : null
      }));
      try { localStorage.setItem('bridge_influencers_v2', JSON.stringify(sanitized)); } catch (e) {}
      return { ...state, influencers: sanitized, influenceTalents: sanitized, firestoreReady: true };
    }

    case 'SYNC_FINANCIAL_DOCUMENTS': {
      try { localStorage.setItem('bridge_financial_docs_v2', JSON.stringify(action.documents)); } catch (e) {}
      return { ...state, financialDocuments: action.documents, firestoreReady: true };
    }

    case 'ADD_FINANCIAL_DOCUMENT': {
      const updatedDocs = [action.document, ...state.financialDocuments.filter(d => d.id !== action.document.id)];
      try { localStorage.setItem('bridge_financial_docs_v2', JSON.stringify(updatedDocs)); } catch (e) {}
      return { ...state, financialDocuments: updatedDocs };
    }

    case 'UPDATE_FINANCIAL_DOCUMENT': {
      const updatedDocs = state.financialDocuments.map(d =>
        d.id === action.id ? { ...d, ...action.updates, updatedAt: new Date().toISOString() } : d
      );
      try { localStorage.setItem('bridge_financial_docs_v2', JSON.stringify(updatedDocs)); } catch (e) {}
      return { ...state, financialDocuments: updatedDocs };
    }

    case 'DELETE_FINANCIAL_DOCUMENT': {
      const updatedDocs = state.financialDocuments.filter(d => d.id !== action.id);
      try { localStorage.setItem('bridge_financial_docs_v2', JSON.stringify(updatedDocs)); } catch (e) {}
      return { ...state, financialDocuments: updatedDocs };
    }

    // ─── Active AI Context ───
    case 'SET_ACTIVE_AI_CONTEXT':
      return { ...state, activeAIContext: { ...state.activeAIContext, ...action.context } };

    // ─── Documents Management ───
    case 'ADD_DOCUMENT': {
      const updatedDocs = [action.document, ...state.documents.filter(d => d.id !== action.document.id)];
      try { localStorage.setItem('bridge_documents_v2', JSON.stringify(updatedDocs)); } catch (e) {}
      return { ...state, documents: updatedDocs };
    }

    case 'UPDATE_DOCUMENT': {
      const updatedDocs = state.documents.map(d =>
        d.id === action.id ? { ...d, ...action.updates, updatedAt: new Date().toISOString() } : d
      );
      try { localStorage.setItem('bridge_documents_v2', JSON.stringify(updatedDocs)); } catch (e) {}
      return { ...state, documents: updatedDocs };
    }

    case 'DELETE_DOCUMENT': {
      // Logical delete / archive
      const updatedDocs = state.documents.filter(d => d.id !== action.id);
      try { localStorage.setItem('bridge_documents_v2', JSON.stringify(updatedDocs)); } catch (e) {}
      return { ...state, documents: updatedDocs };
    }

    case 'ADD_DOCUMENT_VERSION': {
      const updatedDocs = state.documents.map(d => {
        if (d.id === action.id) {
          const versions = d.versions || [];
          return {
            ...d,
            currentVersion: action.version.version,
            versions: [action.version, ...versions],
            updatedAt: new Date().toISOString(),
          };
        }
        return d;
      });
      try { localStorage.setItem('bridge_documents_v2', JSON.stringify(updatedDocs)); } catch (e) {}
      return { ...state, documents: updatedDocs };
    }

    case 'RESTORE_DOCUMENT_VERSION': {
      const updatedDocs = state.documents.map(d => {
        if (d.id === action.id) {
          return {
            ...d,
            currentVersion: action.targetVersion,
            updatedAt: new Date().toISOString(),
          };
        }
        return d;
      });
      try { localStorage.setItem('bridge_documents_v2', JSON.stringify(updatedDocs)); } catch (e) {}
      return { ...state, documents: updatedDocs };
    }

    case 'ADD_DOCUMENT_COMMENT': {
      const updatedDocs = state.documents.map(d => {
        if (d.id === action.id) {
          const comments = d.comments || [];
          return {
            ...d,
            comments: [...comments, action.comment],
            updatedAt: new Date().toISOString(),
          };
        }
        return d;
      });
      try { localStorage.setItem('bridge_documents_v2', JSON.stringify(updatedDocs)); } catch (e) {}
      return { ...state, documents: updatedDocs };
    }

    case 'TOGGLE_KNOWLEDGE_BASE': {
      const updatedDocs = state.documents.map(d => {
        if (d.id === action.id) {
          return {
            ...d,
            inKnowledgeBase: !d.inKnowledgeBase,
            updatedAt: new Date().toISOString(),
          };
        }
        return d;
      });
      try { localStorage.setItem('bridge_documents_v2', JSON.stringify(updatedDocs)); } catch (e) {}
      return { ...state, documents: updatedDocs };
    }

    // ─── AI Agents Management ───
    case 'ADD_AGENT': {
      const updatedAgents = [...state.agents, action.agent];
      try { localStorage.setItem('bridge_agents_v2', JSON.stringify(updatedAgents)); } catch (e) {}
      return { ...state, agents: updatedAgents };
    }

    case 'UPDATE_AGENT': {
      const updatedAgents = state.agents.map(a =>
        a.id === action.id ? { ...a, ...action.updates } : a
      );
      try { localStorage.setItem('bridge_agents_v2', JSON.stringify(updatedAgents)); } catch (e) {}
      return { ...state, agents: updatedAgents };
    }

    case 'DELETE_AGENT': {
      const updatedAgents = state.agents.filter(a => a.id !== action.id);
      try { localStorage.setItem('bridge_agents_v2', JSON.stringify(updatedAgents)); } catch (e) {}
      return { ...state, agents: updatedAgents };
    }

    // ─── Prompt Templates Management ───
    case 'ADD_PROMPT': {
      const updatedPrompts = [action.prompt, ...state.prompts];
      try { localStorage.setItem('bridge_prompts_v2', JSON.stringify(updatedPrompts)); } catch (e) {}
      return { ...state, prompts: updatedPrompts };
    }

    case 'UPDATE_PROMPT': {
      const updatedPrompts = state.prompts.map(p =>
        p.id === action.id ? { ...p, ...action.updates } : p
      );
      try { localStorage.setItem('bridge_prompts_v2', JSON.stringify(updatedPrompts)); } catch (e) {}
      return { ...state, prompts: updatedPrompts };
    }

    case 'DELETE_PROMPT': {
      const updatedPrompts = state.prompts.filter(p => p.id !== action.id);
      try { localStorage.setItem('bridge_prompts_v2', JSON.stringify(updatedPrompts)); } catch (e) {}
      return { ...state, prompts: updatedPrompts };
    }

    case 'TOGGLE_FAVORITE_PROMPT': {
      const updatedPrompts = state.prompts.map(p =>
        p.id === action.id ? { ...p, favorite: !p.favorite } : p
      );
      try { localStorage.setItem('bridge_prompts_v2', JSON.stringify(updatedPrompts)); } catch (e) {}
      return { ...state, prompts: updatedPrompts };
    }

    // ─── AI Conversations & Messages ───
    case 'CREATE_CONVERSATION': {
      const updatedConvs = [action.conversation, ...state.conversations];
      try { localStorage.setItem('bridge_conversations_v2', JSON.stringify(updatedConvs)); } catch (e) {}
      return { ...state, conversations: updatedConvs };
    }

    case 'ADD_MESSAGE_TO_CONVERSATION': {
      const updatedConvs = state.conversations.map(c => {
        if (c.id === action.convId) {
          const msgs = c.messages || [];
          return {
            ...c,
            messages: [...msgs, action.message],
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      });
      try { localStorage.setItem('bridge_conversations_v2', JSON.stringify(updatedConvs)); } catch (e) {}
      return { ...state, conversations: updatedConvs };
    }

    case 'UPDATE_CONVERSATION': {
      const updatedConvs = state.conversations.map(c =>
        c.id === action.id ? { ...c, ...action.updates, updatedAt: new Date().toISOString() } : c
      );
      try { localStorage.setItem('bridge_conversations_v2', JSON.stringify(updatedConvs)); } catch (e) {}
      return { ...state, conversations: updatedConvs };
    }

    case 'DELETE_CONVERSATION': {
      const updatedConvs = state.conversations.filter(c => c.id !== action.id);
      try { localStorage.setItem('bridge_conversations_v2', JSON.stringify(updatedConvs)); } catch (e) {}
      return { ...state, conversations: updatedConvs };
    }

    case 'SET_MESSAGE_FEEDBACK': {
      const updatedConvs = state.conversations.map(c => {
        if (c.id === action.convId) {
          const msgs = (c.messages || []).map(m =>
            m.id === action.messageId ? { ...m, feedback: action.feedback } : m
          );
          return { ...c, messages: msgs };
        }
        return c;
      });
      try { localStorage.setItem('bridge_conversations_v2', JSON.stringify(updatedConvs)); } catch (e) {}
      return { ...state, conversations: updatedConvs };
    }

    // ─── Knowledge Chunks & Audit Logs ───
    case 'INDEX_DOCUMENT_CHUNKS': {
      const filtered = state.knowledgeChunks.filter(kc => kc.documentId !== action.docId);
      const updatedChunks = [...action.chunks, ...filtered];
      try { localStorage.setItem('bridge_knowledge_chunks_v2', JSON.stringify(updatedChunks)); } catch (e) {}
      return { ...state, knowledgeChunks: updatedChunks };
    }

    case 'REMOVE_DOCUMENT_CHUNKS': {
      const updatedChunks = state.knowledgeChunks.filter(kc => kc.documentId !== action.docId);
      try { localStorage.setItem('bridge_knowledge_chunks_v2', JSON.stringify(updatedChunks)); } catch (e) {}
      return { ...state, knowledgeChunks: updatedChunks };
    }

    case 'ADD_AUDIT_LOG': {
      const updatedLogs = [action.log, ...state.auditLogs];
      try { localStorage.setItem('bridge_audit_logs_v2', JSON.stringify(updatedLogs)); } catch (e) {}
      return { ...state, auditLogs: updatedLogs };
    }

    // ─── Influencers & Talents Unified Management ───
    case 'SET_INFLUENCE_USER_ROLE':
      return { ...state, influenceUserRole: action.role };

    case 'ADD_INFLUENCER':
    case 'ADD_INFLUENCE_TALENT': {
      const talent = action.talent || action.influencer;
      const baseList = (state.influencers && state.influencers.length > 0) ? state.influencers : (state.influenceTalents || []);
      const updatedTalents = [talent, ...baseList.filter(i => String(i.id) !== String(talent.id))];
      try { localStorage.setItem('bridge_influencers_v2', JSON.stringify(updatedTalents)); } catch (e) {}
      return { ...state, influencers: updatedTalents, influenceTalents: updatedTalents };
    }

    case 'UPDATE_INFLUENCER':
    case 'UPDATE_INFLUENCE_TALENT': {
      const baseList = (state.influencers && state.influencers.length > 0) ? state.influencers : (state.influenceTalents || []);
      const updatedTalents = baseList.map(i =>
        String(i.id) === String(action.id) ? { ...i, ...action.updates, updatedAt: new Date().toISOString() } : i
      );
      try { localStorage.setItem('bridge_influencers_v2', JSON.stringify(updatedTalents)); } catch (e) {}
      return { ...state, influencers: updatedTalents, influenceTalents: updatedTalents };
    }

    case 'DELETE_INFLUENCER':
    case 'DELETE_INFLUENCE_TALENT': {
      const baseList = (state.influencers && state.influencers.length > 0) ? state.influencers : (state.influenceTalents || []);
      const updatedTalents = baseList.filter(i => String(i.id) !== String(action.id));
      try { localStorage.setItem('bridge_influencers_v2', JSON.stringify(updatedTalents)); } catch (e) {}
      return { ...state, influencers: updatedTalents, influenceTalents: updatedTalents };
    }

    case 'ADD_INFLUENCE_CAMPAIGN': {
      const updated = [action.campaign, ...state.influenceCampaigns.filter(c => c.id !== action.campaign.id)];
      try { localStorage.setItem('bridge_influence_campaigns_v2', JSON.stringify(updated)); } catch (e) {}
      return { ...state, influenceCampaigns: updated };
    }

    case 'UPDATE_INFLUENCE_CAMPAIGN': {
      const updated = state.influenceCampaigns.map(c =>
        c.id === action.id ? { ...c, ...action.updates, updatedAt: new Date().toISOString() } : c
      );
      try { localStorage.setItem('bridge_influence_campaigns_v2', JSON.stringify(updated)); } catch (e) {}
      return { ...state, influenceCampaigns: updated };
    }

    case 'DELETE_INFLUENCE_CAMPAIGN': {
      const updated = state.influenceCampaigns.filter(c => c.id !== action.id);
      try { localStorage.setItem('bridge_influence_campaigns_v2', JSON.stringify(updated)); } catch (e) {}
      return { ...state, influenceCampaigns: updated };
    }

    case 'ADD_INFLUENCE_DELIVERABLE': {
      const updated = [action.deliverable, ...state.influenceDeliverables.filter(d => d.id !== action.deliverable.id)];
      try { localStorage.setItem('bridge_influence_deliverables_v2', JSON.stringify(updated)); } catch (e) {}
      return { ...state, influenceDeliverables: updated };
    }

    case 'UPDATE_INFLUENCE_DELIVERABLE': {
      const updated = state.influenceDeliverables.map(d =>
        d.id === action.id ? { ...d, ...action.updates, updatedAt: new Date().toISOString() } : d
      );
      try { localStorage.setItem('bridge_influence_deliverables_v2', JSON.stringify(updated)); } catch (e) {}
      return { ...state, influenceDeliverables: updated };
    }

    case 'DELETE_INFLUENCE_DELIVERABLE': {
      const updated = state.influenceDeliverables.filter(d => d.id !== action.id);
      try { localStorage.setItem('bridge_influence_deliverables_v2', JSON.stringify(updated)); } catch (e) {}
      return { ...state, influenceDeliverables: updated };
    }

    case 'ADD_INFLUENCE_INSIGHT': {
      const updated = [action.insight, ...state.influenceInsights.filter(i => i.id !== action.insight.id)];
      try { localStorage.setItem('bridge_influence_insights_v2', JSON.stringify(updated)); } catch (e) {}
      return { ...state, influenceInsights: updated };
    }

    case 'UPDATE_INFLUENCE_INSIGHT': {
      const updated = state.influenceInsights.map(i =>
        i.id === action.id ? { ...i, ...action.updates } : i
      );
      try { localStorage.setItem('bridge_influence_insights_v2', JSON.stringify(updated)); } catch (e) {}
      return { ...state, influenceInsights: updated };
    }

    case 'DELETE_INFLUENCE_INSIGHT': {
      const updated = state.influenceInsights.filter(i => i.id !== action.id);
      try { localStorage.setItem('bridge_influence_insights_v2', JSON.stringify(updated)); } catch (e) {}
      return { ...state, influenceInsights: updated };
    }

    case 'RESOLVE_INFLUENCE_DUPLICATE': {
      const { candidateId, actionChoice } = action;
      // actionChoice: 'merge' | 'keep_separate' | 'ignore'
      const updatedDuplicates = state.influenceDuplicates.filter(d => d.candidate.id !== candidateId);
      let updatedTalents = state.influenceTalents;

      if (actionChoice === 'merge') {
        // Find duplicate info
        const dup = state.influenceDuplicates.find(d => d.candidate.id === candidateId);
        if (dup) {
          // Merge metadata into target and mark candidate merged
          updatedTalents = state.influenceTalents.map(t => {
            if (t.id === dup.target.id) {
              return {
                ...t,
                notes: `${t.notes || ''} | Fusionné avec ${dup.candidate.display_name} (${dup.candidate.source_sheet})`,
                platform_profiles: [
                  ...t.platform_profiles,
                  ...(dup.candidate.platform_profiles || []).filter(p => !t.platform_profiles.some(tp => tp.url === p.url))
                ]
              };
            }
            if (t.id === candidateId) {
              return { ...t, record_status: 'merged_into', merged_into_id: dup.target.id };
            }
            return t;
          });
        }
      } else if (actionChoice === 'keep_separate') {
        updatedTalents = state.influenceTalents.map(t =>
          t.id === candidateId ? { ...t, record_status: 'active', duplicate_of: null, notes: `${t.notes || ''} [Confirmé distinct par arbitrage manuel]` } : t
        );
      } else if (actionChoice === 'ignore') {
        updatedTalents = state.influenceTalents.map(t =>
          t.id === candidateId ? { ...t, record_status: 'ignored' } : t
        );
      }

      try {
        localStorage.setItem('bridge_influence_duplicates_v2', JSON.stringify(updatedDuplicates));
        localStorage.setItem('bridge_influencers_v2', JSON.stringify(updatedTalents));
      } catch (e) {}

      return {
        ...state,
        influenceDuplicates: updatedDuplicates,
        influenceTalents: updatedTalents,
        influencers: updatedTalents
      };
    }

    case 'RESOLVE_INFLUENCE_ALERT': {
      const updated = state.influenceAlerts.map(a =>
        a.id === action.alertId ? { ...a, status: 'resolu', resolution_note: action.resolutionNote, resolved_at: new Date().toISOString() } : a
      );
      try { localStorage.setItem('bridge_influence_alerts_v2', JSON.stringify(updated)); } catch (e) {}
      return { ...state, influenceAlerts: updated };
    }

    case 'IMPORT_INFLUENCE_BATCH': {
      const { talents, deliverables, ambassadorGroups, duplicateCandidates, summary, campaigns } = action.batchData;

      // Merge talents idempotently
      const existingTalentsMap = new Map((state.influenceTalents || []).map(t => [t.id, t]));
      for (const t of talents) {
        existingTalentsMap.set(t.id, { ...(existingTalentsMap.get(t.id) || {}), ...t });
      }
      const mergedTalents = Array.from(existingTalentsMap.values());

      // Merge deliverables idempotently
      const existingDelivsMap = new Map((state.influenceDeliverables || []).map(d => [d.id, d]));
      for (const d of deliverables) {
        existingDelivsMap.set(d.id, { ...(existingDelivsMap.get(d.id) || {}), ...d });
      }
      const mergedDeliverables = Array.from(existingDelivsMap.values());

      // Merge campaigns
      const existingCampsMap = new Map((state.influenceCampaigns || []).map(c => [c.id, c]));
      for (const c of (campaigns || [])) {
        existingCampsMap.set(c.id, { ...(existingCampsMap.get(c.id) || {}), ...c });
      }
      const mergedCampaigns = Array.from(existingCampsMap.values());

      // Merge groups
      const existingGroupsMap = new Map((state.influenceAmbassadorGroups || []).map(g => [g.id, g]));
      for (const g of (ambassadorGroups || [])) {
        existingGroupsMap.set(g.id, { ...(existingGroupsMap.get(g.id) || {}), ...g });
      }
      const mergedGroups = Array.from(existingGroupsMap.values());

      const updatedBatches = [summary, ...(state.influenceImportBatches || [])];
      const updatedDuplicates = [...(duplicateCandidates || []), ...(state.influenceDuplicates || []).filter(d => !duplicateCandidates.some(nd => nd.candidate.id === d.candidate.id))];

      try {
        localStorage.setItem('bridge_influencers_v2', JSON.stringify(mergedTalents));
        localStorage.setItem('bridge_influence_deliverables_v2', JSON.stringify(mergedDeliverables));
        localStorage.setItem('bridge_influence_campaigns_v2', JSON.stringify(mergedCampaigns));
        localStorage.setItem('bridge_influence_groups_v2', JSON.stringify(mergedGroups));
        localStorage.setItem('bridge_influence_batches_v2', JSON.stringify(updatedBatches));
        localStorage.setItem('bridge_influence_duplicates_v2', JSON.stringify(updatedDuplicates));
      } catch (e) {}

      return {
        ...state,
        influencers: mergedTalents,
        influenceTalents: mergedTalents,
        influenceDeliverables: mergedDeliverables,
        influenceCampaigns: mergedCampaigns,
        influenceAmbassadorGroups: mergedGroups,
        influenceImportBatches: updatedBatches,
        influenceDuplicates: updatedDuplicates
      };
    }

    // ─── Briefs Workflow ───
    case 'ADD_BRIEF': {
      const updatedBriefs = [action.brief, ...state.briefs.filter(b => b.id !== action.brief.id)];
      try { localStorage.setItem('bridge_briefs_v2', JSON.stringify(updatedBriefs)); } catch (e) {}
      return { ...state, briefs: updatedBriefs };
    }

    case 'UPDATE_BRIEF': {
      const updatedBriefs = state.briefs.map(b =>
        b.id === action.id ? { ...b, ...action.updatedFields, updatedAt: new Date().toISOString() } : b
      );
      try { localStorage.setItem('bridge_briefs_v2', JSON.stringify(updatedBriefs)); } catch (e) {}
      return { ...state, briefs: updatedBriefs };
    }

    case 'UPDATE_BRIEF_STATUS': {
      const updatedBriefs = state.briefs.map(b => {
        if (b.id === action.id) {
          const progressMap = {
            draft: 5,
            submitted: 15,
            tech_review: 30,
            approved: 45,
            in_progress: action.progress !== undefined ? action.progress : 65,
            uat: 88,
            live: 100,
            on_hold: b.progress,
          };
          const newProgress = action.progress !== undefined ? action.progress : (progressMap[action.status] || b.progress);
          return {
            ...b,
            status: action.status,
            subStatus: action.subStatus !== undefined ? action.subStatus : b.subStatus,
            progress: newProgress,
            updatedAt: new Date().toISOString(),
          };
        }
        return b;
      });
      try { localStorage.setItem('bridge_briefs_v2', JSON.stringify(updatedBriefs)); } catch (e) {}
      return { ...state, briefs: updatedBriefs };
    }

    case 'ADD_BRIEF_COMMENT': {
      const updatedBriefs = state.briefs.map(b => {
        if (b.id === action.briefId) {
          const comments = b.comments || [];
          return {
            ...b,
            comments: [...comments, action.comment],
            updatedAt: new Date().toISOString(),
          };
        }
        return b;
      });
      try { localStorage.setItem('bridge_briefs_v2', JSON.stringify(updatedBriefs)); } catch (e) {}
      return { ...state, briefs: updatedBriefs };
    }

    case 'ADD_BRIEF_ASSET': {
      const updatedBriefs = state.briefs.map(b => {
        if (b.id === action.briefId) {
          const assets = b.assets || [];
          return {
            ...b,
            assets: [action.asset, ...assets],
            updatedAt: new Date().toISOString(),
          };
        }
        return b;
      });
      try { localStorage.setItem('bridge_briefs_v2', JSON.stringify(updatedBriefs)); } catch (e) {}
      return { ...state, briefs: updatedBriefs };
    }

    case 'UPDATE_BRIEF_MILESTONE': {
      const updatedBriefs = state.briefs.map(b => {
        if (b.id === action.briefId) {
          const milestones = (b.milestones || []).map(m =>
            m.id === action.milestoneId ? { ...m, percentage: action.percentage, status: action.status || m.status } : m
          );
          const avgProgress = milestones.length > 0
            ? Math.round(milestones.reduce((acc, m) => acc + (m.percentage || 0), 0) / milestones.length)
            : b.progress;
          return {
            ...b,
            milestones,
            progress: avgProgress,
            updatedAt: new Date().toISOString(),
          };
        }
        return b;
      });
      try { localStorage.setItem('bridge_briefs_v2', JSON.stringify(updatedBriefs)); } catch (e) {}
      return { ...state, briefs: updatedBriefs };
    }

    case 'DELETE_BRIEF': {
      const updatedBriefs = state.briefs.filter(b => b.id !== action.id);
      try { localStorage.setItem('bridge_briefs_v2', JSON.stringify(updatedBriefs)); } catch (e) {}
      return { ...state, briefs: updatedBriefs };
    }

    // ─── Reporting & Insights Workflow ───
    case 'ADD_REPORT': {
      const updatedReports = [action.report, ...state.reports.filter(r => r.id !== action.report.id)];
      try { localStorage.setItem('bridge_reports_v2', JSON.stringify(updatedReports)); } catch (e) {}
      return { ...state, reports: updatedReports };
    }

    case 'UPDATE_REPORT': {
      const updatedReports = state.reports.map(r =>
        r.id === action.id ? { ...r, ...action.updatedFields, updatedAt: new Date().toISOString() } : r
      );
      try { localStorage.setItem('bridge_reports_v2', JSON.stringify(updatedReports)); } catch (e) {}
      return { ...state, reports: updatedReports };
    }

    case 'UPDATE_REPORT_STATUS': {
      const updatedReports = state.reports.map(r => {
        if (r.id === action.id) {
          const now = new Date();
          const timestamp = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
          
          let newVersion = r.version;
          const versions = [...(r.versions || [])];
          if (action.status === 'delivered' && !r.version?.includes('Verrouillée')) {
            newVersion = `${r.version || 'v1.0'} (Verrouillée)`;
            versions.push({
              versionNumber: newVersion,
              date: timestamp,
              author: action.author || 'Système McCann',
              changelog: 'Livraison finale et verrouillage du rapport officiel'
            });
          }

          const auditEntry = {
            timestamp,
            user: action.author || 'Utilisateur',
            action: `Statut → ${action.statusLabel || action.status}`,
            detail: action.note || `Transition vers le statut ${action.statusLabel || action.status}`
          };

          return {
            ...r,
            status: action.status,
            version: newVersion,
            versions,
            deliveredDate: action.status === 'delivered' ? now.toISOString().slice(0,10) : r.deliveredDate,
            auditLog: [auditEntry, ...(r.auditLog || [])],
            updatedAt: now.toISOString(),
          };
        }
        return r;
      });
      try { localStorage.setItem('bridge_reports_v2', JSON.stringify(updatedReports)); } catch (e) {}
      return { ...state, reports: updatedReports };
    }

    case 'ADD_REPORT_COMMENT': {
      const updatedReports = state.reports.map(r => {
        if (r.id === action.reportId) {
          const comments = r.comments || [];
          return {
            ...r,
            comments: [...comments, action.comment],
            updatedAt: new Date().toISOString(),
          };
        }
        return r;
      });
      try { localStorage.setItem('bridge_reports_v2', JSON.stringify(updatedReports)); } catch (e) {}
      return { ...state, reports: updatedReports };
    }

    case 'ADD_REPORT_SPEECH': {
      const updatedReports = state.reports.map(r => {
        if (r.id === action.reportId) {
          const speeches = r.data?.speeches || [];
          return {
            ...r,
            data: {
              ...r.data,
              speeches: [action.speech, ...speeches]
            },
            updatedAt: new Date().toISOString(),
          };
        }
        return r;
      });
      try { localStorage.setItem('bridge_reports_v2', JSON.stringify(updatedReports)); } catch (e) {}
      return { ...state, reports: updatedReports };
    }

    case 'UPDATE_REPORT_DATA': {
      const updatedReports = state.reports.map(r => {
        if (r.id === action.reportId) {
          return {
            ...r,
            data: {
              ...r.data,
              ...action.data
            },
            updatedAt: new Date().toISOString(),
          };
        }
        return r;
      });
      try { localStorage.setItem('bridge_reports_v2', JSON.stringify(updatedReports)); } catch (e) {}
      return { ...state, reports: updatedReports };
    }

    case 'DELETE_REPORT': {
      const updatedReports = state.reports.filter(r => r.id !== action.id);
      try { localStorage.setItem('bridge_reports_v2', JSON.stringify(updatedReports)); } catch (e) {}
      return { ...state, reports: updatedReports };
    }

    case 'UPDATE_TICKET':
      return {
        ...state,
        tickets: state.tickets.map(t =>
          t.id === action.ticketId ? { ...t, ...action.updates, lastUpdated: new Date().toISOString() } : t
        ),
      };

    case 'UPDATE_TICKET_STATUS': {
      const getAutoProgress = (status, currentProgress = 0) => {
        switch (status) {
          case 'delivered': case 'livre': return 100;
          case 'client_review': case 'validation': return 95;
          case 'internal_review': return 85;
          case 'revisions': return Math.max(60, currentProgress - 15);
          case 'production': return currentProgress > 0 ? currentProgress : 35;
          case 'ready': return 0;
          case 'cadrage': return 15;
          case 'backlog': return 0;
          default: return currentProgress;
        }
      };

      return {
        ...state,
        tickets: state.tickets.map(t =>
          t.id === action.ticketId
            ? {
                ...t,
                status: action.status,
                progress: action.progress !== undefined ? action.progress : getAutoProgress(action.status, t.progress),
                ...(action.extraData || {}),
                lastUpdated: new Date().toISOString(),
              }
            : t
        ),
      };
    }

    case 'REASSIGN_TICKET':
      return {
        ...state,
        tickets: state.tickets.map(t =>
          t.id === action.ticketId
            ? {
                ...t,
                assignee: action.assignee,
                assigneeRole: action.assigneeRole || t.assigneeRole,
                backupId: action.backupId !== undefined ? action.backupId : t.backupId,
                lastUpdated: new Date().toISOString(),
              }
            : t
        ),
      };

    case 'ADD_TICKET':
      return { ...state, tickets: [action.ticket, ...state.tickets] };

    case 'DELETE_TICKET':
      return { ...state, tickets: state.tickets.filter(t => t.id !== action.ticketId) };

    case 'VALIDATE_CALENDAR':
      return {
        ...state,
        calendar: state.calendar.map((c, i) =>
          i === action.index ? { ...c, status: 'validated' } : c
        ),
      };

    case 'REJECT_CALENDAR':
      return {
        ...state,
        calendar: state.calendar.map((c, i) =>
          i === action.index ? { ...c, status: 'rejected' } : c
        ),
      };

    case 'SUBMIT_CALENDAR':
      return {
        ...state,
        calendar: state.calendar.map((c, i) =>
          i === action.index ? { ...c, status: 'pending' } : c
        ),
      };

    case 'PUBLISH_CALENDAR':
      return {
        ...state,
        calendar: state.calendar.map((c, i) =>
          i === action.index ? { ...c, publishedAt: new Date().toISOString() } : c
        ),
      };

    // ─── Publication Workflow ───
    case 'ADD_PUBLICATION': {
      const pub = {
        id: String(action.payload.id || nextPubId++),
        title: action.payload.title,
        plateforme: action.payload.plateforme,
        format: action.payload.format,
        description: action.payload.description || '',
        dateTarget: action.payload.dateTarget || '',
        heureTarget: action.payload.heureTarget || '10:00',
        statut: 'Brouillon',
        action: 'Éditer',
        createdAt: new Date().toISOString(),
        submittedAt: null,
        validatedAt: null,
        scheduledAt: null,
        publishedAt: null,
      };
      return { ...state, publications: [pub, ...state.publications] };
    }

    case 'SUBMIT_FOR_VALIDATION':
      return {
        ...state,
        publications: state.publications.map(p =>
          String(p.id) === String(action.id)
            ? { ...p, statut: 'En validation', action: 'Relancer', submittedAt: new Date().toISOString() }
            : p
        ),
      };

    case 'VALIDATE_PUBLICATION': {
      const pub = state.publications.find(p => String(p.id) === String(action.id));
      if (!pub) return state;

      const now = new Date();
      const targetDate = pub.dateTarget ? new Date(pub.dateTarget) : now;
      const day = targetDate.getDate();

      const canalMap = { 'Facebook': 'Facebook', 'Instagram': 'Instagram', 'TikTok': 'TikTok', 'LinkedIn': 'LinkedIn', 'Twitter/X': 'X' };
      const canal = canalMap[pub.plateforme] || pub.plateforme;

      const newCalPost = {
        id: String(nextCalPostId++),
        client: 'Orange Telco',
        canal,
        type: pub.format === 'Carrousel' ? 'Carrousel' : pub.format === 'Reels' || pub.format === 'Story' ? 'Réels et Story' : 'Feed',
        format: 'Paysage',
        time: pub.heureTarget || '10:00',
        status: 'PENDING',
        title: pub.title,
        generation: 'Manual',
        desc: pub.description || pub.title,
        day,
        image: null,
      };

      return {
        ...state,
        publications: state.publications.map(p =>
          String(p.id) === String(action.id)
            ? { ...p, statut: 'Validé', action: 'Programmer', validatedAt: new Date().toISOString() }
            : p
        ),
        calendarPosts: [...state.calendarPosts, newCalPost],
      };
    }

    case 'REJECT_PUBLICATION':
      return {
        ...state,
        publications: state.publications.map(p =>
          String(p.id) === String(action.id)
            ? { ...p, statut: 'À corriger', action: 'Corriger' }
            : p
        ),
      };

    case 'SCHEDULE_PUBLICATION':
      return {
        ...state,
        publications: state.publications.map(p =>
          String(p.id) === String(action.id)
            ? {
              ...p,
              statut: 'Programmé',
              action: 'Voir',
              scheduledAt: new Date().toISOString(),
              dateTarget: action.date || p.dateTarget,
              heureTarget: action.heure || p.heureTarget,
            }
            : p
        ),
        calendarPosts: state.calendarPosts.map(cp =>
          cp.title === state.publications.find(pp => String(pp.id) === String(action.id))?.title
            ? { ...cp, status: 'SCHEDULED', time: action.heure || cp.time }
            : cp
        ),
      };

    case 'PUBLISH_PUBLICATION':
      return {
        ...state,
        publications: state.publications.map(p =>
          String(p.id) === String(action.id)
            ? { ...p, statut: 'Publié', action: 'Voir', publishedAt: new Date().toISOString() }
            : p
        ),
        calendarPosts: state.calendarPosts.map(cp =>
          cp.title === state.publications.find(pp => String(pp.id) === String(action.id))?.title
            ? { ...cp, status: 'PUBLISHED' }
            : cp
        ),
      };

    case 'ADD_CALENDAR_POST': {
      const post = {
        ...action.payload,
        id: String(action.payload.id || nextCalPostId++),
        createdAt: action.payload.createdAt || new Date().toISOString(),
      };
      return { ...state, calendarPosts: [post, ...state.calendarPosts] };
    }

    case 'UPDATE_CALENDAR_POST': {
      return {
        ...state,
        calendarPosts: state.calendarPosts.map(p =>
          String(p.id) === String(action.id)
            ? { ...p, ...action.updates, updatedAt: new Date().toISOString() }
            : p
        ),
      };
    }

    case 'DELETE_CALENDAR_POST': {
      return {
        ...state,
        calendarPosts: state.calendarPosts.filter(p => String(p.id) !== String(action.id)),
      };
    }

    case 'UPDATE_PUBLICATION': {
      return {
        ...state,
        publications: state.publications.map(p =>
          String(p.id) === String(action.id)
            ? { ...p, ...action.updates, updatedAt: new Date().toISOString() }
            : p
        ),
      };
    }

    case 'DELETE_PUBLICATION': {
      return {
        ...state,
        publications: state.publications.filter(p => String(p.id) !== String(action.id)),
      };
    }

    case 'ADD_NOTIFICATION': {
      const notif = { 
        id: String(Date.now()), 
        text: action.text, 
        type: action.notifType || 'info', 
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString()
      };
      return { ...state, notifications: [notif, ...state.notifications.slice(0, 19)] };
    }

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const isInitializedRef = useRef(false);

  // ─── Realtime Firestore Synchronization ───
  useEffect(() => {
    let unsubs = [];

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clean up previous listeners
      unsubs.forEach(unsub => unsub && unsub());
      unsubs = [];

      try {
        // 1. Briefs Listener (purely Firestore-driven)
        const briefsCol = collection(db, 'briefs');
        const unsubBriefs = onSnapshot(briefsCol, async (snapshot) => {
          const demoIds = ['BR-2026-001', 'BR-2026-002', 'BR-2026-003', 'BR-2026-004', 'BR-2026-005', 'BR-2026-006'];
          for (const d of snapshot.docs) {
            if (demoIds.includes(d.id)) {
              try {
                await deleteDoc(doc(db, 'briefs', d.id));
              } catch (e) {
                // Ignore cleanup errors
              }
            }
          }
          const list = snapshot.docs
            .filter(d => !demoIds.includes(d.id))
            .map(d => ({ ...d.data(), id: d.id }));
          dispatch({ type: 'SYNC_BRIEFS', briefs: list });
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'briefs');
        });
        unsubs.push(unsubBriefs);

        // 2. Reports Listener
        const reportsCol = collection(db, 'reports');
        const unsubReports = onSnapshot(reportsCol, async (snapshot) => {
          if (snapshot.empty && !isInitializedRef.current) {
            for (const report of INITIAL_REPORTS) {
              await setDoc(doc(db, 'reports', report.id), report);
            }
          } else {
            const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
            if (list.length > 0) {
              dispatch({ type: 'SYNC_REPORTS', reports: list });
            } else {
              dispatch({ type: 'SYNC_REPORTS', reports: INITIAL_REPORTS });
            }
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'reports');
        });
        unsubs.push(unsubReports);

        // 3. Tickets Listener (Sync real database documents only)
        const ticketsCol = collection(db, 'tickets');
        const unsubTickets = onSnapshot(ticketsCol, (snapshot) => {
          const list = snapshot.docs
            .map(d => ({ ...d.data(), id: d.id }))
            .filter(t => !t.isDemo && !t.isExample && !t.id?.startsWith('TK-04'));
          dispatch({ type: 'SYNC_TICKETS', tickets: list });
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'tickets');
        });
        unsubs.push(unsubTickets);

        // 4. Calendar Posts Listener (Sync real database documents only)
        const calCol = collection(db, 'calendarPosts');
        const unsubCal = onSnapshot(calCol, (snapshot) => {
          const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
          dispatch({ type: 'SYNC_CALENDAR_POSTS', calendarPosts: list });
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'calendarPosts');
        });
        unsubs.push(unsubCal);

        // 5. Publications Listener (Sync real database documents only)
        const pubCol = collection(db, 'publications');
        const unsubPub = onSnapshot(pubCol, (snapshot) => {
          const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
          dispatch({ type: 'SYNC_PUBLICATIONS', publications: list });
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'publications');
        });
        unsubs.push(unsubPub);

        // 6. Notifications Listener
        const notifCol = collection(db, 'notifications');
        const unsubNotif = onSnapshot(notifCol, (snapshot) => {
          const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
          if (list.length > 0) {
            dispatch({ type: 'SYNC_NOTIFICATIONS', notifications: list });
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'notifications');
        });
        unsubs.push(unsubNotif);

        // 7. Documents Listener
        const docsCol = collection(db, 'documents');
        const unsubDocs = onSnapshot(docsCol, async (snapshot) => {
          if (snapshot.empty && !isInitializedRef.current) {
            for (const docItem of INITIAL_DOCUMENTS) {
              await setDoc(doc(db, 'documents', docItem.id), docItem);
            }
          } else {
            const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
            if (list.length > 0) {
              dispatch({ type: 'SYNC_DOCUMENTS', documents: list });
            }
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'documents');
        });
        unsubs.push(unsubDocs);

        // 8. Agents Listener
        const agentsCol = collection(db, 'agents');
        const unsubAgents = onSnapshot(agentsCol, async (snapshot) => {
          if (snapshot.empty && !isInitializedRef.current) {
            for (const agent of INITIAL_AGENTS) {
              await setDoc(doc(db, 'agents', agent.id), agent);
            }
          } else {
            const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
            if (list.length > 0) {
              dispatch({ type: 'SYNC_AGENTS', agents: list });
            }
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'agents');
        });
        unsubs.push(unsubAgents);

        // 9. Prompts Listener
        const promptsCol = collection(db, 'prompts');
        const unsubPrompts = onSnapshot(promptsCol, async (snapshot) => {
          if (snapshot.empty && !isInitializedRef.current) {
            for (const pr of INITIAL_PROMPT_TEMPLATES) {
              await setDoc(doc(db, 'prompts', pr.id), pr);
            }
          } else {
            const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
            if (list.length > 0) {
              dispatch({ type: 'SYNC_PROMPTS', prompts: list });
            }
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'prompts');
        });
        unsubs.push(unsubPrompts);

        // 10. AI Conversations Listener
        const convCol = collection(db, 'ai_conversations');
        const unsubConv = onSnapshot(convCol, async (snapshot) => {
          if (snapshot.empty && !isInitializedRef.current) {
            for (const c of INITIAL_CONVERSATIONS) {
              await setDoc(doc(db, 'ai_conversations', c.id), c);
            }
          } else {
            const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
            if (list.length > 0) {
              dispatch({ type: 'SYNC_CONVERSATIONS', conversations: list });
            }
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'ai_conversations');
        });
        unsubs.push(unsubConv);

        // 11. Knowledge Chunks Listener
        const chunksCol = collection(db, 'knowledge_chunks');
        const unsubChunks = onSnapshot(chunksCol, async (snapshot) => {
          if (snapshot.empty && !isInitializedRef.current) {
            for (const chunk of INITIAL_KNOWLEDGE_CHUNKS) {
              await setDoc(doc(db, 'knowledge_chunks', chunk.id), chunk);
            }
          } else {
            const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
            if (list.length > 0) {
              dispatch({ type: 'SYNC_KNOWLEDGE_CHUNKS', knowledgeChunks: list });
            }
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'knowledge_chunks');
        });
        unsubs.push(unsubChunks);

        // 12. Audit Logs Listener
        const logsCol = collection(db, 'audit_logs');
        const unsubLogs = onSnapshot(logsCol, async (snapshot) => {
          if (snapshot.empty && !isInitializedRef.current) {
            for (const l of INITIAL_AUDIT_LOGS) {
              await setDoc(doc(db, 'audit_logs', l.id), l);
            }
          } else {
            const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
            if (list.length > 0) {
              dispatch({ type: 'SYNC_AUDIT_LOGS', auditLogs: list });
            }
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'audit_logs');
        });
        unsubs.push(unsubLogs);

        // 13. Influencers Listener (Live Firestore only, no demo seeding)
        const infCol = collection(db, 'influencers');
        const unsubInf = onSnapshot(infCol, (snapshot) => {
          const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
          dispatch({ type: 'SYNC_INFLUENCERS', influencers: list });
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'influencers');
        });
        unsubs.push(unsubInf);

        // 14. Financial Documents Listener (BC, Factures, Devis, Reçus, Proforma)
        const finDocsCol = collection(db, 'financial_documents');
        const unsubFinDocs = onSnapshot(finDocsCol, async (snapshot) => {
          if (snapshot.empty && !isInitializedRef.current) {
            for (const fd of INITIAL_FINANCIAL_DOCUMENTS) {
              await setDoc(doc(db, 'financial_documents', fd.id), fd);
            }
          } else {
            const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
            if (list.length > 0) {
              dispatch({ type: 'SYNC_FINANCIAL_DOCUMENTS', documents: list });
            }
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'financial_documents');
        });
        unsubs.push(unsubFinDocs);

        isInitializedRef.current = true;
      } catch (e) {
        console.warn('Firestore initial sync error:', e);
      }
    });

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      unsubs.forEach(unsub => unsub && unsub());
    };
  }, []);

  // ─── Action Handlers with Firestore Writes ───

  const updateTicketStatus = useCallback(async (ticketId, status, extraData = {}) => {
    dispatch({ type: 'UPDATE_TICKET_STATUS', ticketId, status, extraData });
    const statusLabels = {
      backlog: 'À qualifier (Backlog)',
      cadrage: 'Cadrage & Estimation',
      ready: 'Prêt à produire',
      production: 'En Production',
      internal_review: 'Contrôle Qualité Interne',
      client_review: 'Validation Client',
      revisions: 'Révisions demandées',
      delivered: 'Validé & Livré',
    };
    dispatch({ type: 'ADD_NOTIFICATION', text: `Ticket ${ticketId} → ${statusLabels[status] || status.toUpperCase()}`, notifType: status === 'delivered' ? 'success' : status === 'revisions' ? 'warning' : 'info' });

    try {
      const ticketRef = doc(db, 'tickets', ticketId);
      await updateDoc(ticketRef, {
        status,
        ...extraData,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `tickets/${ticketId}`);
    }
  }, []);

  const updateTicket = useCallback(async (ticketId, updates) => {
    dispatch({ type: 'UPDATE_TICKET', ticketId, updates });
    try {
      const ticketRef = doc(db, 'tickets', ticketId);
      await updateDoc(ticketRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `tickets/${ticketId}`);
    }
  }, []);

  const reassignTicket = useCallback(async (ticketId, assignee, assigneeName, extraFields = {}) => {
    dispatch({ type: 'REASSIGN_TICKET', ticketId, assignee, ...extraFields });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Traffic Manager : ${ticketId} réassigné à ${assigneeName}`, notifType: 'success' });

    try {
      const ticketRef = doc(db, 'tickets', ticketId);
      await updateDoc(ticketRef, {
        assignee,
        ...extraFields,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `tickets/${ticketId}`);
    }
  }, []);

  const addTicket = useCallback(async (ticket) => {
    dispatch({ type: 'ADD_TICKET', ticket });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Nouveau ticket créé : ${ticket.title}`, notifType: 'success' });

    try {
      const ticketRef = doc(db, 'tickets', ticket.id);
      await setDoc(ticketRef, {
        ...ticket,
        createdAt: ticket.createdAt || new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `tickets/${ticket.id}`);
    }
  }, []);

  const deleteTicket = useCallback(async (ticketId) => {
    dispatch({ type: 'DELETE_TICKET', ticketId });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Ticket ${ticketId} archivé`, notifType: 'info' });

    try {
      const ticketRef = doc(db, 'tickets', ticketId);
      await deleteDoc(ticketRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `tickets/${ticketId}`);
    }
  }, []);

  const reportTicketBlockage = useCallback(async (ticketId, reason, reporterName) => {
    const blockageData = {
      isBlocked: true,
      reason,
      reporter: reporterName,
      date: new Date().toISOString(),
      resolved: false,
    };
    dispatch({ type: 'UPDATE_TICKET', ticketId, updates: { blockage: blockageData } });
    dispatch({ type: 'ADD_NOTIFICATION', text: `🚨 Blocage signalé sur ${ticketId} : ${reason}`, notifType: 'error' });

    try {
      const ticketRef = doc(db, 'tickets', ticketId);
      await updateDoc(ticketRef, {
        blockage: blockageData,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `tickets/${ticketId}`);
    }
  }, []);

  const resolveTicketBlockage = useCallback(async (ticketId) => {
    const blockageData = {
      isBlocked: false,
      reason: '',
      reporter: '',
      date: '',
      resolved: true,
    };
    dispatch({ type: 'UPDATE_TICKET', ticketId, updates: { blockage: blockageData } });
    dispatch({ type: 'ADD_NOTIFICATION', text: `✅ Blocage résolu sur ${ticketId}`, notifType: 'success' });

    try {
      const ticketRef = doc(db, 'tickets', ticketId);
      await updateDoc(ticketRef, {
        blockage: blockageData,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `tickets/${ticketId}`);
    }
  }, []);

  const logTicketHours = useCallback(async (ticketId, additionalHours, currentLogged = 0) => {
    const newLogged = Math.round((currentLogged + additionalHours) * 10) / 10;
    dispatch({ type: 'UPDATE_TICKET', ticketId, updates: { loggedHours: newLogged } });
    dispatch({ type: 'ADD_NOTIFICATION', text: `+${additionalHours}h enregistrées sur ${ticketId} (Total: ${newLogged}h)`, notifType: 'info' });

    try {
      const ticketRef = doc(db, 'tickets', ticketId);
      await updateDoc(ticketRef, {
        loggedHours: newLogged,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `tickets/${ticketId}`);
    }
  }, []);

  const validateCalendarItem = useCallback((index, contentName) => {
    dispatch({ type: 'VALIDATE_CALENDAR', index });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Validé : ${contentName}`, notifType: 'success' });
  }, []);

  const rejectCalendarItem = useCallback((index, contentName) => {
    dispatch({ type: 'REJECT_CALENDAR', index });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Rejeté : ${contentName} — modification requise`, notifType: 'warning' });
  }, []);

  const submitCalendarItem = useCallback((index, contentName) => {
    dispatch({ type: 'SUBMIT_CALENDAR', index });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Soumis : ${contentName}`, notifType: 'info' });
  }, []);

  const publishCalendarItem = useCallback((index, contentName) => {
    dispatch({ type: 'PUBLISH_CALENDAR', index });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Publié : ${contentName}`, notifType: 'success' });
  }, []);

  // ─── Briefs Workflow Actions ───
  const addBrief = useCallback(async (brief) => {
    dispatch({ type: 'ADD_BRIEF', brief });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Nouveau Brief créé : ${brief.title} (${brief.id})`, notifType: 'success' });

    try {
      const briefRef = doc(db, 'briefs', brief.id);
      await setDoc(briefRef, {
        ...brief,
        createdAt: brief.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `briefs/${brief.id}`);
    }
  }, []);

  const updateBrief = useCallback(async (id, updatedFields) => {
    dispatch({ type: 'UPDATE_BRIEF', id, updatedFields });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Brief mis à jour : ${id}`, notifType: 'info' });

    try {
      const briefRef = doc(db, 'briefs', id);
      await updateDoc(briefRef, {
        ...updatedFields,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `briefs/${id}`);
    }
  }, []);

  const updateBriefStatus = useCallback(async (id, status, subStatus, comment, progress) => {
    dispatch({ type: 'UPDATE_BRIEF_STATUS', id, status, subStatus, progress });
    const statusLabels = {
      draft: 'Brouillon',
      submitted: 'Soumis pour Analyse',
      tech_review: 'Faisabilité Tech & Chiffrage',
      approved: 'Validé / Kick-off',
      in_progress: 'En Production',
      uat: 'Recette Client (UAT)',
      live: 'Livré / En Ligne',
      on_hold: 'Révision Requise',
    };
    dispatch({ type: 'ADD_NOTIFICATION', text: `Statut Brief ${id} → ${statusLabels[status] || status}`, notifType: status === 'live' || status === 'approved' ? 'success' : 'info' });

    try {
      const briefRef = doc(db, 'briefs', id);
      const updates = {
        status,
        updatedAt: new Date().toISOString()
      };
      if (subStatus !== undefined) updates.subStatus = subStatus;
      if (progress !== undefined) updates.progress = progress;
      await updateDoc(briefRef, updates);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `briefs/${id}`);
    }
  }, []);

  const addBriefComment = useCallback(async (briefId, comment) => {
    dispatch({ type: 'ADD_BRIEF_COMMENT', briefId, comment });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Nouveau commentaire ajouté sur le brief ${briefId}`, notifType: 'info' });

    try {
      const brief = state.briefs.find(b => b.id === briefId);
      const comments = brief?.comments || [];
      const briefRef = doc(db, 'briefs', briefId);
      await updateDoc(briefRef, {
        comments: [...comments, comment],
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `briefs/${briefId}`);
    }
  }, [state.briefs]);

  const addBriefAsset = useCallback(async (briefId, asset) => {
    dispatch({ type: 'ADD_BRIEF_ASSET', briefId, asset });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Document attaché au brief ${briefId} : ${asset.name}`, notifType: 'success' });

    try {
      const brief = state.briefs.find(b => b.id === briefId);
      const assets = brief?.assets || [];
      const briefRef = doc(db, 'briefs', briefId);
      await updateDoc(briefRef, {
        assets: [asset, ...assets],
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `briefs/${briefId}`);
    }
  }, [state.briefs]);

  const updateBriefMilestone = useCallback(async (briefId, milestoneId, percentage, status) => {
    dispatch({ type: 'UPDATE_BRIEF_MILESTONE', briefId, milestoneId, percentage, status });

    try {
      const brief = state.briefs.find(b => b.id === briefId);
      if (brief) {
        const milestones = (brief.milestones || []).map(m =>
          m.id === milestoneId ? { ...m, percentage, status: status || m.status } : m
        );
        const avgProgress = milestones.length > 0
          ? Math.round(milestones.reduce((acc, m) => acc + (m.percentage || 0), 0) / milestones.length)
          : brief.progress;

        const briefRef = doc(db, 'briefs', briefId);
        await updateDoc(briefRef, {
          milestones,
          progress: avgProgress,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `briefs/${briefId}`);
    }
  }, [state.briefs]);

  const deleteBrief = useCallback(async (id) => {
    dispatch({ type: 'DELETE_BRIEF', id });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Brief archivé/supprimé : ${id}`, notifType: 'warning' });

    try {
      const briefRef = doc(db, 'briefs', id);
      await deleteDoc(briefRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `briefs/${id}`);
    }
  }, []);

  // ─── Publication workflow actions ───
  const addPublication = useCallback(async (payload) => {
    const pubId = String(payload.id || nextPubId++);
    const pub = {
      id: pubId,
      title: payload.title,
      plateforme: payload.plateforme || 'Facebook',
      format: payload.format || 'Image',
      description: payload.description || '',
      dateTarget: payload.dateTarget || '',
      heureTarget: payload.heureTarget || '10:00',
      statut: payload.statut || 'Brouillon',
      action: payload.action || 'Éditer',
      image: payload.image || '',
      url: payload.url || '',
      client: payload.client || 'Orange Cameroun',
      campaign: payload.campaign || '',
      isSponsored: !!payload.isSponsored,
      sponsoring: payload.sponsoring || { isSponsored: false },
      createdAt: new Date().toISOString(),
      submittedAt: null,
      validatedAt: null,
      scheduledAt: null,
      publishedAt: null,
    };
    dispatch({ type: 'ADD_PUBLICATION', payload: pub });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Publication créée : ${payload.title}`, notifType: 'success' });

    try {
      await setDoc(doc(db, 'publications', pubId), pub);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `publications/${pubId}`);
    }
  }, []);

  const submitForValidation = useCallback(async (id, title) => {
    dispatch({ type: 'SUBMIT_FOR_VALIDATION', id });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Soumis pour validation : ${title}`, notifType: 'info' });

    try {
      await updateDoc(doc(db, 'publications', String(id)), {
        statut: 'En validation',
        action: 'Relancer',
        submittedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `publications/${id}`);
    }
  }, []);

  const validatePublication = useCallback(async (id, title) => {
    dispatch({ type: 'VALIDATE_PUBLICATION', id });
    dispatch({ type: 'ADD_NOTIFICATION', text: `✅ Publication validée : ${title} — ajoutée au calendrier`, notifType: 'success' });

    try {
      await updateDoc(doc(db, 'publications', String(id)), {
        statut: 'Validé',
        action: 'Programmer',
        validatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `publications/${id}`);
    }
  }, []);

  const rejectPublication = useCallback(async (id, title) => {
    dispatch({ type: 'REJECT_PUBLICATION', id });
    dispatch({ type: 'ADD_NOTIFICATION', text: `❌ Publication rejetée : ${title} — corrections requises`, notifType: 'warning' });

    try {
      await updateDoc(doc(db, 'publications', String(id)), {
        statut: 'À corriger',
        action: 'Corriger',
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `publications/${id}`);
    }
  }, []);

  const schedulePublication = useCallback(async (id, title, date, heure) => {
    dispatch({ type: 'SCHEDULE_PUBLICATION', id, date, heure });
    dispatch({ type: 'ADD_NOTIFICATION', text: `📅 Publication programmée : ${title}`, notifType: 'success' });

    try {
      await updateDoc(doc(db, 'publications', String(id)), {
        statut: 'Programmé',
        action: 'Voir',
        scheduledAt: new Date().toISOString(),
        dateTarget: date,
        heureTarget: heure,
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `publications/${id}`);
    }
  }, []);

  const publishPublication = useCallback(async (id, title) => {
    dispatch({ type: 'PUBLISH_PUBLICATION', id });
    dispatch({ type: 'ADD_NOTIFICATION', text: `🚀 Publication publiée : ${title}`, notifType: 'success' });

    try {
      await updateDoc(doc(db, 'publications', String(id)), {
        statut: 'Publié',
        action: 'Voir',
        publishedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `publications/${id}`);
    }
  }, []);

  const updatePublication = useCallback(async (id, updates) => {
    dispatch({ type: 'UPDATE_PUBLICATION', id, updates });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Publication mise à jour`, notifType: 'info' });

    try {
      await updateDoc(doc(db, 'publications', String(id)), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `publications/${id}`);
    }
  }, []);

  const deletePublication = useCallback(async (id) => {
    dispatch({ type: 'DELETE_PUBLICATION', id });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Publication supprimée`, notifType: 'warning' });

    try {
      await deleteDoc(doc(db, 'publications', String(id)));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `publications/${id}`);
    }
  }, []);

  // ─── Advanced Calendar CRUD Actions ───
  const addCalendarPost = useCallback(async (payload) => {
    const id = payload.id ? String(payload.id) : `CAL-${Date.now().toString().slice(-6)}`;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const targetDate = payload.date || todayStr;
    const dayParsed = payload.day || parseInt(targetDate.split('-')[2], 10) || now.getDate();
    const newPost = {
      id,
      client: payload.client || 'Orange Telco',
      canal: payload.canal || 'Facebook',
      type: payload.type || 'Feed',
      format: payload.format || 'Paysage',
      time: payload.time || '10:00',
      status: payload.status || 'PENDING',
      title: payload.title || 'Nouvelle publication',
      generation: payload.generation || 'Manual',
      desc: payload.desc || payload.description || '',
      day: dayParsed,
      date: targetDate,
      image: payload.image || null,
      campaign: payload.campaign || '',
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_CALENDAR_POST', payload: newPost });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Publication planifiée : ${newPost.title}`, notifType: 'success' });

    try {
      await setDoc(doc(db, 'calendarPosts', id), newPost);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `calendarPosts/${id}`);
    }
    return newPost;
  }, []);

  const updateCalendarPost = useCallback(async (id, updates) => {
    dispatch({ type: 'UPDATE_CALENDAR_POST', id, updates });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Publication mise à jour : ${updates.title || id}`, notifType: 'info' });

    try {
      await updateDoc(doc(db, 'calendarPosts', String(id)), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `calendarPosts/${id}`);
    }
  }, []);

  const deleteCalendarPost = useCallback(async (id) => {
    dispatch({ type: 'DELETE_CALENDAR_POST', id });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Publication supprimée du calendrier`, notifType: 'warning' });

    try {
      await deleteDoc(doc(db, 'calendarPosts', String(id)));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `calendarPosts/${id}`);
    }
  }, []);

  // ─── Reporting & Insights workflow actions ───
  const addReport = useCallback(async (report) => {
    dispatch({ type: 'ADD_REPORT', report });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Nouvelle demande de rapport créée : ${report.title} (${report.id})`, notifType: 'success' });

    try {
      await setDoc(doc(db, 'reports', report.id), {
        ...report,
        createdAt: report.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `reports/${report.id}`);
    }
  }, []);

  const updateReport = useCallback(async (id, updatedFields) => {
    dispatch({ type: 'UPDATE_REPORT', id, updatedFields });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Rapport mis à jour : ${id}`, notifType: 'info' });

    try {
      await updateDoc(doc(db, 'reports', id), {
        ...updatedFields,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `reports/${id}`);
    }
  }, []);

  const updateReportStatus = useCallback(async (id, status, author, note) => {
    const statusLabel = REPORT_STATUSES[status]?.label || status;
    dispatch({ type: 'UPDATE_REPORT_STATUS', id, status, author, note, statusLabel });
    const isSuccess = status === 'approved' || status === 'delivered';
    dispatch({ type: 'ADD_NOTIFICATION', text: `Statut Rapport ${id} → ${statusLabel}`, notifType: isSuccess ? 'success' : 'info' });

    try {
      const now = new Date();
      const timestamp = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      const auditEntry = {
        timestamp,
        user: author || 'Utilisateur',
        action: `Statut → ${statusLabel}`,
        detail: note || `Transition vers le statut ${statusLabel}`
      };

      const report = state.reports.find(r => r.id === id);
      const auditLog = [auditEntry, ...(report?.auditLog || [])];

      await updateDoc(doc(db, 'reports', id), {
        status,
        auditLog,
        deliveredDate: status === 'delivered' ? now.toISOString().slice(0,10) : report?.deliveredDate || null,
        updatedAt: now.toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `reports/${id}`);
    }
  }, [state.reports]);

  const addReportComment = useCallback(async (reportId, comment) => {
    dispatch({ type: 'ADD_REPORT_COMMENT', reportId, comment });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Nouveau commentaire sur le rapport ${reportId}`, notifType: 'info' });

    try {
      const report = state.reports.find(r => r.id === reportId);
      const comments = report?.comments || [];
      await updateDoc(doc(db, 'reports', reportId), {
        comments: [...comments, comment],
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `reports/${reportId}`);
    }
  }, [state.reports]);

  const addReportSpeech = useCallback(async (reportId, speech) => {
    dispatch({ type: 'ADD_REPORT_SPEECH', reportId, speech });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Prise de parole ajoutée au rapport ${reportId} : ${speech.name}`, notifType: 'success' });

    try {
      const report = state.reports.find(r => r.id === reportId);
      const speeches = report?.data?.speeches || [];
      await updateDoc(doc(db, 'reports', reportId), {
        'data.speeches': [speech, ...speeches],
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `reports/${reportId}`);
    }
  }, [state.reports]);

  const updateReportData = useCallback(async (reportId, data) => {
    dispatch({ type: 'UPDATE_REPORT_DATA', reportId, data });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Données du rapport actualisées : ${reportId}`, notifType: 'success' });

    try {
      const report = state.reports.find(r => r.id === reportId);
      await updateDoc(doc(db, 'reports', reportId), {
        data: {
          ...(report?.data || {}),
          ...data
        },
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `reports/${reportId}`);
    }
  }, [state.reports]);

  const deleteReport = useCallback(async (id) => {
    dispatch({ type: 'DELETE_REPORT', id });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Rapport archivé / supprimé : ${id}`, notifType: 'warning' });

    try {
      await deleteDoc(doc(db, 'reports', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `reports/${id}`);
    }
  }, []);

  const addNotification = useCallback(async (text, type) => {
    const notif = {
      id: String(Date.now()),
      text,
      type: type || 'info',
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString()
    };
    dispatch({ type: 'ADD_NOTIFICATION', text, notifType: type });

    try {
      await setDoc(doc(db, 'notifications', notif.id), notif);
    } catch (e) {
      // Notification errors are non-blocking
    }
  }, []);

  // ─── AI Context & Helpers ───
  const setActiveAIContext = useCallback((contextUpdates) => {
    dispatch({ type: 'SET_ACTIVE_AI_CONTEXT', context: contextUpdates });
  }, []);

  const logAudit = useCallback(async (action, resourceType, resourceId, resourceName, metadata = {}) => {
    const logItem = {
      id: `log-${Date.now()}`,
      action,
      resourceType,
      resourceId,
      resourceName,
      metadata,
      timestamp: new Date().toISOString(),
      userId: 'usr_current',
      userName: 'Utilisateur Connecté'
    };
    dispatch({ type: 'ADD_AUDIT_LOG', log: logItem });
    try {
      await setDoc(doc(db, 'audit_logs', logItem.id), logItem);
    } catch (e) {}
  }, []);

  // ─── Documents Actions ───
  const addDocument = useCallback(async (document) => {
    dispatch({ type: 'ADD_DOCUMENT', document });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Document importé : ${document.title || document.name}`, notifType: 'success' });
    logAudit('UPLOAD_DOCUMENT', 'document', document.id, document.title || document.name, { category: document.category });

    try {
      await setDoc(doc(db, 'documents', document.id), document);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `documents/${document.id}`);
    }
  }, [logAudit]);

  const updateDocument = useCallback(async (id, updates) => {
    dispatch({ type: 'UPDATE_DOCUMENT', id, updates });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Document mis à jour : ${id}`, notifType: 'info' });
    logAudit('UPDATE_DOCUMENT', 'document', id, updates.title || id, updates);

    try {
      await updateDoc(doc(db, 'documents', id), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `documents/${id}`);
    }
  }, [logAudit]);

  const deleteDocument = useCallback(async (id, name = '') => {
    dispatch({ type: 'DELETE_DOCUMENT', id });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Document archivé : ${name || id}`, notifType: 'warning' });
    logAudit('DELETE_DOCUMENT', 'document', id, name || id);

    try {
      await deleteDoc(doc(db, 'documents', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `documents/${id}`);
    }
  }, [logAudit]);

  const addDocumentVersion = useCallback(async (id, version) => {
    dispatch({ type: 'ADD_DOCUMENT_VERSION', id, version });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Nouvelle version ${version.version} ajoutée`, notifType: 'success' });
    logAudit('ADD_VERSION', 'document', id, version.version, { comment: version.comment });

    try {
      const docItem = state.documents.find(d => d.id === id);
      const versions = docItem?.versions || [];
      await updateDoc(doc(db, 'documents', id), {
        currentVersion: version.version,
        versions: [version, ...versions],
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `documents/${id}`);
    }
  }, [state.documents, logAudit]);

  const restoreDocumentVersion = useCallback(async (id, targetVersion) => {
    dispatch({ type: 'RESTORE_DOCUMENT_VERSION', id, targetVersion });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Document restauré à la version ${targetVersion}`, notifType: 'info' });
    logAudit('RESTORE_VERSION', 'document', id, targetVersion);

    try {
      await updateDoc(doc(db, 'documents', id), {
        currentVersion: targetVersion,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `documents/${id}`);
    }
  }, [logAudit]);

  const addDocumentComment = useCallback(async (id, comment) => {
    dispatch({ type: 'ADD_DOCUMENT_COMMENT', id, comment });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Commentaire ajouté sur le document`, notifType: 'info' });

    try {
      const docItem = state.documents.find(d => d.id === id);
      const comments = docItem?.comments || [];
      await updateDoc(doc(db, 'documents', id), {
        comments: [...comments, comment],
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `documents/${id}`);
    }
  }, [state.documents]);

  const toggleKnowledgeBase = useCallback(async (id) => {
    const docItem = state.documents.find(d => d.id === id);
    const newStatus = !docItem?.inKnowledgeBase;
    dispatch({ type: 'TOGGLE_KNOWLEDGE_BASE', id });
    dispatch({ 
      type: 'ADD_NOTIFICATION', 
      text: newStatus ? `Document indexé dans le RAG / Base de connaissances` : `Document retiré du RAG`, 
      notifType: newStatus ? 'success' : 'warning' 
    });
    logAudit(newStatus ? 'ENABLE_KNOWLEDGE_BASE' : 'DISABLE_KNOWLEDGE_BASE', 'document', id, docItem?.title || id);

    try {
      await updateDoc(doc(db, 'documents', id), {
        inKnowledgeBase: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `documents/${id}`);
    }
  }, [state.documents, logAudit]);

  const sendDocToAI = useCallback((docItem) => {
    dispatch({
      type: 'SET_ACTIVE_AI_CONTEXT',
      context: {
        client: docItem.client || 'Orange Cameroun',
        brand: docItem.brand || 'Orange (Telco & Data)',
        project: docItem.project || 'Campagne Ramadan 2026',
        documents: [docItem.id],
      }
    });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Document sélectionné pour l'Assistant IA : ${docItem.title || docItem.name}`, notifType: 'info' });
  }, []);

  // ─── AI Agents Actions ───
  const addAgent = useCallback(async (agent) => {
    dispatch({ type: 'ADD_AGENT', agent });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Agent IA créé : ${agent.name}`, notifType: 'success' });
    logAudit('CREATE_AGENT', 'agent', agent.id, agent.name);

    try {
      await setDoc(doc(db, 'agents', agent.id), agent);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `agents/${agent.id}`);
    }
  }, [logAudit]);

  const updateAgent = useCallback(async (id, updates) => {
    dispatch({ type: 'UPDATE_AGENT', id, updates });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Agent IA configuré : ${id}`, notifType: 'info' });
    logAudit('UPDATE_AGENT', 'agent', id, updates.name || id, updates);

    try {
      await updateDoc(doc(db, 'agents', id), updates);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `agents/${id}`);
    }
  }, [logAudit]);

  const deleteAgent = useCallback(async (id, name = '') => {
    dispatch({ type: 'DELETE_AGENT', id });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Agent supprimé : ${name || id}`, notifType: 'warning' });
    logAudit('DELETE_AGENT', 'agent', id, name || id);

    try {
      await deleteDoc(doc(db, 'agents', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `agents/${id}`);
    }
  }, [logAudit]);

  // ─── Prompts Library Actions ───
  const addPrompt = useCallback(async (prompt) => {
    dispatch({ type: 'ADD_PROMPT', prompt });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Template de prompt ajouté : ${prompt.title}`, notifType: 'success' });
    logAudit('CREATE_PROMPT', 'prompt', prompt.id, prompt.title);

    try {
      await setDoc(doc(db, 'prompts', prompt.id), prompt);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `prompts/${prompt.id}`);
    }
  }, [logAudit]);

  const updatePrompt = useCallback(async (id, updates) => {
    dispatch({ type: 'UPDATE_PROMPT', id, updates });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Prompt mis à jour : ${updates.title || id}`, notifType: 'info' });

    try {
      await updateDoc(doc(db, 'prompts', id), updates);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `prompts/${id}`);
    }
  }, []);

  const deletePrompt = useCallback(async (id, title = '') => {
    dispatch({ type: 'DELETE_PROMPT', id });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Prompt supprimé : ${title || id}`, notifType: 'warning' });

    try {
      await deleteDoc(doc(db, 'prompts', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `prompts/${id}`);
    }
  }, []);

  const toggleFavoritePrompt = useCallback(async (id) => {
    dispatch({ type: 'TOGGLE_FAVORITE_PROMPT', id });
    try {
      const pr = state.prompts.find(p => p.id === id);
      await updateDoc(doc(db, 'prompts', id), {
        favorite: !pr?.favorite
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `prompts/${id}`);
    }
  }, [state.prompts]);

  // ─── AI Conversations Actions ───
  const createConversation = useCallback(async (conv) => {
    dispatch({ type: 'CREATE_CONVERSATION', conversation: conv });
    try {
      await setDoc(doc(db, 'ai_conversations', conv.id), conv);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `ai_conversations/${conv.id}`);
    }
  }, []);

  const addMessageToConversation = useCallback(async (convId, message) => {
    dispatch({ type: 'ADD_MESSAGE_TO_CONVERSATION', convId, message });
    try {
      const conv = state.conversations.find(c => c.id === convId);
      const messages = conv?.messages || [];
      await updateDoc(doc(db, 'ai_conversations', convId), {
        messages: [...messages, message],
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `ai_conversations/${convId}`);
    }
  }, [state.conversations]);

  const updateConversation = useCallback(async (id, updates) => {
    dispatch({ type: 'UPDATE_CONVERSATION', id, updates });
    try {
      await updateDoc(doc(db, 'ai_conversations', id), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `ai_conversations/${id}`);
    }
  }, []);

  const deleteConversation = useCallback(async (id) => {
    dispatch({ type: 'DELETE_CONVERSATION', id });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Session de discussion supprimée`, notifType: 'info' });
    try {
      await deleteDoc(doc(db, 'ai_conversations', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `ai_conversations/${id}`);
    }
  }, []);

  const setMessageFeedback = useCallback(async (convId, messageId, feedback) => {
    dispatch({ type: 'SET_MESSAGE_FEEDBACK', convId, messageId, feedback });
    dispatch({ type: 'ADD_NOTIFICATION', text: feedback === 'positive' ? 'Merci pour votre retour positif !' : 'Merci, retour enregistré pour affiner les réponses.', notifType: 'info' });
  }, []);

  // ─── Knowledge Base Chunks ───
  const indexDocumentChunks = useCallback(async (docId, chunks) => {
    dispatch({ type: 'INDEX_DOCUMENT_CHUNKS', docId, chunks });
    dispatch({ type: 'ADD_NOTIFICATION', text: `${chunks.length} sections documentaires vectorisées dans le RAG`, notifType: 'success' });
    for (const chunk of chunks) {
      try {
        await setDoc(doc(db, 'knowledge_chunks', chunk.id), chunk);
      } catch (e) {}
    }
  }, []);

  const removeDocumentChunks = useCallback(async (docId) => {
    dispatch({ type: 'REMOVE_DOCUMENT_CHUNKS', docId });
    try {
      const chunksToDelete = state.knowledgeChunks.filter(kc => kc.documentId === docId);
      for (const chunk of chunksToDelete) {
        await deleteDoc(doc(db, 'knowledge_chunks', chunk.id));
      }
    } catch (e) {}
  }, [state.knowledgeChunks]);

  // ─── Influencers Management ───
  const sanitizeForFirestore = (obj) => {
    if (obj === undefined) return null;
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned;
  };

  const addInfluencer = useCallback(async (influencerData) => {
    const id = influencerData.id ? String(influencerData.id) : `INF-${Date.now().toString().slice(-6)}`;
    const newInf = {
      ...influencerData,
      id,
      createdAt: influencerData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_INFLUENCER', influencer: newInf });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Influenceur @${newInf.pseudo || newInf.name} enregistré`, notifType: 'success' });
    try {
      await setDoc(doc(db, 'influencers', id), sanitizeForFirestore(newInf));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `influencers/${id}`);
    }
    return newInf;
  }, []);

  const updateInfluencer = useCallback(async (id, updates) => {
    const stringId = String(id);
    const updatedFields = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: 'UPDATE_INFLUENCER', id: stringId, updates: updatedFields });
    try {
      await setDoc(doc(db, 'influencers', stringId), sanitizeForFirestore(updatedFields), { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `influencers/${stringId}`);
    }
  }, []);

  const deleteInfluencer = useCallback(async (id) => {
    const stringId = String(id);
    dispatch({ type: 'DELETE_INFLUENCER', id: stringId });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Influenceur supprimé`, notifType: 'info' });
    try {
      await deleteDoc(doc(db, 'influencers', stringId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `influencers/${stringId}`);
    }
  }, []);

  // ─── Extended Influence Operations Callbacks ───
  const setInfluenceUserRole = useCallback((role) => {
    dispatch({ type: 'SET_INFLUENCE_USER_ROLE', role });
    const labels = {
      direction_agence: 'Directeur de Projet / Agence (Accès Complet)',
      influence_manager: 'Influence & Traffic Manager (Opérationnel)',
      client: 'Client Orange Cameroun (Consultation Restreinte)'
    };
    dispatch({ type: 'ADD_NOTIFICATION', text: `Rôle basculé : ${labels[role] || role}`, notifType: 'info' });
  }, []);

  const addInfluenceCampaign = useCallback((campaign) => {
    const newCamp = {
      ...campaign,
      id: campaign.id || `CAMP-${Date.now().toString().slice(-6)}`,
      isNewlyCreated: true,
      isReal: true,
      isDemo: false,
      isExample: false,
      created_at: new Date().toISOString()
    };
    dispatch({ type: 'ADD_INFLUENCE_CAMPAIGN', campaign: newCamp });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Campagne créée : ${newCamp.name}`, notifType: 'success' });
    return newCamp;
  }, []);

  const updateInfluenceCampaign = useCallback((id, updates) => {
    dispatch({ type: 'UPDATE_INFLUENCE_CAMPAIGN', id, updates });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Campagne mise à jour`, notifType: 'info' });
  }, []);

  const deleteInfluenceCampaign = useCallback((id) => {
    dispatch({ type: 'DELETE_INFLUENCE_CAMPAIGN', id });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Campagne supprimée`, notifType: 'warning' });
  }, []);

  const addInfluenceDeliverable = useCallback((delData) => {
    const newDel = {
      ...delData,
      id: delData.id || `PUB-${Date.now().toString().slice(-6)}`,
      created_at: new Date().toISOString()
    };
    dispatch({ type: 'ADD_INFLUENCE_DELIVERABLE', deliverable: newDel });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Livrable enregistré : ${newDel.title}`, notifType: 'success' });
    return newDel;
  }, []);

  const updateInfluenceDeliverable = useCallback((id, updates) => {
    dispatch({ type: 'UPDATE_INFLUENCE_DELIVERABLE', id, updates });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Livrable actualisé`, notifType: 'info' });
  }, []);

  const deleteInfluenceDeliverable = useCallback((id) => {
    dispatch({ type: 'DELETE_INFLUENCE_DELIVERABLE', id });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Livrable retiré`, notifType: 'warning' });
  }, []);

  const addInfluenceInsight = useCallback((insight) => {
    const newInsight = {
      ...insight,
      id: insight.id || `INS-${Date.now().toString().slice(-6)}`,
      created_at: new Date().toISOString()
    };
    dispatch({ type: 'ADD_INFLUENCE_INSIGHT', insight: newInsight });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Recommandation enregistrée : ${newInsight.title}`, notifType: 'success' });
    return newInsight;
  }, []);

  const updateInfluenceInsight = useCallback((id, updates) => {
    dispatch({ type: 'UPDATE_INFLUENCE_INSIGHT', id, updates });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Recommandation mise à jour`, notifType: 'info' });
  }, []);

  const deleteInfluenceInsight = useCallback((id) => {
    dispatch({ type: 'DELETE_INFLUENCE_INSIGHT', id });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Recommandation retirée`, notifType: 'warning' });
  }, []);

  const resolveInfluenceDuplicate = useCallback((candidateId, actionChoice) => {
    dispatch({ type: 'RESOLVE_INFLUENCE_DUPLICATE', candidateId, actionChoice });
    const actionLabels = {
      merge: 'fusionné avec le profil principal',
      keep_separate: 'validé comme profil distinct',
      ignore: 'écarté'
    };
    dispatch({ type: 'ADD_NOTIFICATION', text: `Arbitrage doublon appliqué (${actionLabels[actionChoice] || actionChoice})`, notifType: 'success' });
  }, []);

  const resolveInfluenceAlert = useCallback((alertId, resolutionNote) => {
    dispatch({ type: 'RESOLVE_INFLUENCE_ALERT', alertId, resolutionNote });
    dispatch({ type: 'ADD_NOTIFICATION', text: `Alerte influence résolue avec succès`, notifType: 'success' });
  }, []);

  const importInfluenceBatch = useCallback((batchData) => {
    dispatch({ type: 'IMPORT_INFLUENCE_BATCH', batchData });
    dispatch({
      type: 'ADD_NOTIFICATION',
      text: `Lot importé avec succès : ${batchData.talents.length} talents, ${batchData.deliverables.length} livrables`,
      notifType: 'success'
    });
  }, []);

  // ─── Financial Documents Management Handlers ───
  const addFinancialDocument = useCallback(async (docData) => {
    const newDoc = {
      ...docData,
      id: docData.id || `fin-${Date.now()}`,
      createdAt: docData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_FINANCIAL_DOCUMENT', document: newDoc });
    dispatch({
      type: 'ADD_NOTIFICATION',
      text: `Document enregistré : ${newDoc.reference} (${newDoc.typeLabel || newDoc.type})`,
      notifType: 'success'
    });

    // Automatically record in audit log
    const auditEntry = {
      id: `audit-${Date.now()}`,
      date: new Date().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      user: 'Directeur Financier',
      action: `Création ${newDoc.typeLabel || newDoc.type}`,
      detail: `${newDoc.reference} — ${newDoc.client} — ${(newDoc.montantTTC || 0).toLocaleString('fr-FR')} FCFA`,
      level: 'info',
      timestamp: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_AUDIT_LOG', log: auditEntry });

    try {
      const docRef = doc(db, 'financial_documents', newDoc.id);
      await setDoc(docRef, newDoc);

      const auditRef = doc(db, 'audit_logs', auditEntry.id);
      await setDoc(auditRef, auditEntry);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `financial_documents/${newDoc.id}`);
    }

    return newDoc;
  }, []);

  const updateFinancialDocument = useCallback(async (id, updates) => {
    dispatch({ type: 'UPDATE_FINANCIAL_DOCUMENT', id, updates });
    dispatch({
      type: 'ADD_NOTIFICATION',
      text: `Document mis à jour : ${updates.reference || id}`,
      notifType: 'info'
    });

    try {
      const docRef = doc(db, 'financial_documents', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `financial_documents/${id}`);
    }
  }, []);

  const deleteFinancialDocument = useCallback(async (id, reference) => {
    dispatch({ type: 'DELETE_FINANCIAL_DOCUMENT', id });
    dispatch({
      type: 'ADD_NOTIFICATION',
      text: `Document supprimé : ${reference || id}`,
      notifType: 'warning'
    });

    try {
      const docRef = doc(db, 'financial_documents', id);
      await deleteDoc(docRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `financial_documents/${id}`);
    }
  }, []);

  const approveFinancialDocument = useCallback(async (id, newStatut = 'Validée') => {
    dispatch({
      type: 'UPDATE_FINANCIAL_DOCUMENT',
      id,
      updates: { statut: newStatut }
    });
    dispatch({
      type: 'ADD_NOTIFICATION',
      text: `Statut validé avec succès (${newStatut})`,
      notifType: 'success'
    });

    const auditEntry = {
      id: `audit-${Date.now()}`,
      date: new Date().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      user: 'Contrôleur de Gestion',
      action: `Validation ${newStatut}`,
      detail: `Document ${id} validé et prêt pour ordonnancement`,
      level: 'success',
      timestamp: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_AUDIT_LOG', log: auditEntry });

    try {
      const docRef = doc(db, 'financial_documents', id);
      await updateDoc(docRef, {
        statut: newStatut,
        updatedAt: new Date().toISOString()
      });
      const auditRef = doc(db, 'audit_logs', auditEntry.id);
      await setDoc(auditRef, auditEntry);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `financial_documents/${id}`);
    }
  }, []);

  return (
    <AppContext.Provider value={{
      ...state, 
      addInfluencer,
      updateInfluencer,
      deleteInfluencer,
      addFinancialDocument,
      updateFinancialDocument,
      deleteFinancialDocument,
      approveFinancialDocument,
      updateTicketStatus, 
      updateTicket,
      reassignTicket, 
      addTicket,
      deleteTicket,
      reportTicketBlockage,
      resolveTicketBlockage,
      logTicketHours,
      validateCalendarItem, 
      rejectCalendarItem, 
      submitCalendarItem,
      publishCalendarItem, 
      addNotification,
      addPublication, 
      updatePublication,
      deletePublication,
      submitForValidation, 
      validatePublication,
      rejectPublication, 
      schedulePublication, 
      publishPublication,
      addCalendarPost,
      updateCalendarPost,
      deleteCalendarPost,
      addBrief, 
      updateBrief, 
      updateBriefStatus, 
      addBriefComment,
      addBriefAsset, 
      updateBriefMilestone, 
      deleteBrief,
      addReport, 
      updateReport, 
      updateReportStatus, 
      addReportComment,
      addReportSpeech, 
      updateReportData, 
      deleteReport,
      // AI & Documents actions
      setActiveAIContext,
      logAudit,
      addDocument,
      updateDocument,
      deleteDocument,
      addDocumentVersion,
      restoreDocumentVersion,
      addDocumentComment,
      toggleKnowledgeBase,
      sendDocToAI,
      addAgent,
      updateAgent,
      deleteAgent,
      addPrompt,
      updatePrompt,
      deletePrompt,
      toggleFavoritePrompt,
      createConversation,
      addMessageToConversation,
      updateConversation,
      deleteConversation,
      setMessageFeedback,
      indexDocumentChunks,
      removeDocumentChunks,
      // Extended Influence Operations
      setInfluenceUserRole,
      addInfluenceCampaign,
      updateInfluenceCampaign,
      deleteInfluenceCampaign,
      addInfluenceDeliverable,
      updateInfluenceDeliverable,
      deleteInfluenceDeliverable,
      addInfluenceInsight,
      updateInfluenceInsight,
      deleteInfluenceInsight,
      resolveInfluenceDuplicate,
      resolveInfluenceAlert,
      importInfluenceBatch,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
