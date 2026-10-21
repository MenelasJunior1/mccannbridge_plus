// Constantes et référentiels métiers pour le module Utilisateurs & Droits — Plateforme BRIDGE

export const AGENCY_ENTITIES = [
  'Direction Générale',
  'Account Management (Commercial)',
  'Création',
  'Stratégie & Planning',
  'Digital & Social Media',
  'Média',
  'Production',
  'Finance & Administration',
  'Information Technology'
];

export const AGENCY_PROFILES = [
  'Directeur Général',
  'Directeur de Clientèle',
  'Chef de Pub (Account Manager)',
  'Account Executive',
  'Traffic Manager',
  'Directeur de Création',
  'Directeur Artistique',
  'Graphiste',
  'Concepteur-Rédacteur',
  'Motion Designer',
  'Planneur Stratégique',
  'Média Planner',
  'Data Analyst',
  'Digital Manager',
  'Community Manager',
  'Social Media Manager',
  'Influence Manager',
  'Content Manager',
  'Resp. Production',
  'DAF',
  'Growth Hacker',
  'Assistant Comptable',
  'Administrateur BRIDGE'
];

export const CLIENT_ENTITIES = [
  'Direction Marketing',
  'Communication Corporate',
  'Direction Digitale',
  'Direction Communication',
  'Orange Money',
  'Orange Business',
  'Achats & Procurement',
  'Contrôle de Gestion',
  'Direction Juridique',
  'Direction Générale'
];

export const CLIENT_PROFILES = [
  'Directeur Marketing & Communication',
  'Brand Manager',
  'Chargé de Communication',
  'Chef de Projet Digital',
  'Resp. Média & Partenariats',
  'Resp. Achats',
  'Contrôleur de Gestion',
  'Resp. Juridique',
  'Validateur Exécutif',
  'Lecteur Simple'
];

export const MODULES_RBAC = [
  { id: 'traffic', label: 'Traffic Manager & Sprints', desc: 'Gestion des charges et assignations de l’équipe créative' },
  { id: 'briefs', label: 'Briefs & Demandes', desc: 'Création, validation et suivi de progression des briefs annonceur' },
  { id: 'calendar', label: 'Calendrier Éditorial', desc: 'Plannings de publication et validation des contenus réseaux sociaux' },
  { id: 'validation', label: 'Validation Client', desc: 'Circuit d’approbation formelle des créas et déclinaisons' },
  { id: 'influence', label: 'Influence & Créateurs', desc: 'Casting, contrats, briefs influenceurs et suivi du reach' },
  { id: 'reports', label: 'Reporting & Insights', desc: 'Rapports mensuels de performance et analyses de ROI' },
  { id: 'finance', label: 'Suivi Financier', desc: 'Budgets engagés, devis, facturation et temps passés' },
  { id: 'assistant_ia', label: 'Assistant IA & Prompts', desc: 'Génération de copies, déclinaisons créas et RAG' },
  { id: 'admin_ia', label: 'Administration IA & RAG', desc: 'Paramétrage des bases documentaires et du fournisseur Groq' },
  { id: 'users', label: 'Gestion Utilisateurs & Droits', desc: 'Console RH, gestion des comptes, habilitations et audit' }
];

export const DEFAULT_PERMISSIONS = {
  'Directeur Général': { traffic: 'admin', briefs: 'admin', calendar: 'admin', validation: 'admin', influence: 'admin', reports: 'admin', finance: 'admin', assistant_ia: 'admin', admin_ia: 'admin', users: 'admin' },
  'Administrateur BRIDGE': { traffic: 'admin', briefs: 'admin', calendar: 'admin', validation: 'admin', influence: 'admin', reports: 'admin', finance: 'admin', assistant_ia: 'admin', admin_ia: 'admin', users: 'admin' },
  'Directeur de Clientèle': { traffic: 'write', briefs: 'admin', calendar: 'admin', validation: 'admin', influence: 'write', reports: 'admin', finance: 'admin', assistant_ia: 'write', admin_ia: 'read', users: 'write' },
  'Directeur de Création': { traffic: 'admin', briefs: 'admin', calendar: 'admin', validation: 'admin', influence: 'write', reports: 'read', finance: 'read', assistant_ia: 'admin', admin_ia: 'read', users: 'read' },
  'Traffic Manager': { traffic: 'admin', briefs: 'admin', calendar: 'admin', validation: 'admin', influence: 'admin', reports: 'write', finance: 'read', assistant_ia: 'admin', admin_ia: 'read', users: 'admin' },
  'Directeur Artistique': { traffic: 'read', briefs: 'write', calendar: 'write', validation: 'write', influence: 'read', reports: 'read', finance: 'none', assistant_ia: 'write', admin_ia: 'none', users: 'none' },
  'Graphiste': { traffic: 'read', briefs: 'read', calendar: 'read', validation: 'read', influence: 'none', reports: 'none', finance: 'none', assistant_ia: 'write', admin_ia: 'none', users: 'none' },
  'Motion Designer': { traffic: 'read', briefs: 'read', calendar: 'read', validation: 'read', influence: 'none', reports: 'none', finance: 'none', assistant_ia: 'write', admin_ia: 'none', users: 'none' },
  'Chef de Pub (Account Manager)': { traffic: 'write', briefs: 'admin', calendar: 'write', validation: 'write', influence: 'write', reports: 'write', finance: 'write', assistant_ia: 'write', admin_ia: 'none', users: 'read' },
  'Community Manager': { traffic: 'read', briefs: 'read', calendar: 'admin', validation: 'write', influence: 'read', reports: 'read', finance: 'none', assistant_ia: 'write', admin_ia: 'none', users: 'none' },
  'Social Media Manager': { traffic: 'read', briefs: 'write', calendar: 'admin', validation: 'admin', influence: 'write', reports: 'write', finance: 'none', assistant_ia: 'write', admin_ia: 'none', users: 'none' },
  'Influence Manager': { traffic: 'read', briefs: 'write', calendar: 'read', validation: 'write', influence: 'admin', reports: 'write', finance: 'read', assistant_ia: 'write', admin_ia: 'none', users: 'none' },
  'Digital Web Analyst': { traffic: 'read', briefs: 'read', calendar: 'read', validation: 'read', influence: 'read', reports: 'admin', finance: 'none', assistant_ia: 'write', admin_ia: 'none', users: 'none' },
  'DAF': { traffic: 'read', briefs: 'read', calendar: 'none', validation: 'read', influence: 'read', reports: 'admin', finance: 'admin', assistant_ia: 'none', admin_ia: 'none', users: 'read' },
  
  // Client Profiles (Strictly forbidden from users & IAM)
  'Directeur Marketing & Communication': { traffic: 'read', briefs: 'admin', calendar: 'admin', validation: 'admin', influence: 'write', reports: 'admin', finance: 'admin', assistant_ia: 'read', admin_ia: 'none', users: 'none' },
  'Brand Manager': { traffic: 'read', briefs: 'admin', calendar: 'admin', validation: 'admin', influence: 'write', reports: 'admin', finance: 'write', assistant_ia: 'read', admin_ia: 'none', users: 'none' },
  'Chargé de Communication': { traffic: 'read', briefs: 'write', calendar: 'write', validation: 'write', influence: 'read', reports: 'read', finance: 'none', assistant_ia: 'read', admin_ia: 'none', users: 'none' },
  'Chef de Projet Digital': { traffic: 'read', briefs: 'write', calendar: 'admin', validation: 'admin', influence: 'write', reports: 'write', finance: 'read', assistant_ia: 'read', admin_ia: 'none', users: 'none' },
  'Validateur Exécutif': { traffic: 'read', briefs: 'admin', calendar: 'admin', validation: 'admin', influence: 'read', reports: 'admin', finance: 'admin', assistant_ia: 'none', admin_ia: 'none', users: 'none' },
  'Lecteur Simple': { traffic: 'read', briefs: 'read', calendar: 'read', validation: 'read', influence: 'read', reports: 'read', finance: 'read', assistant_ia: 'read', admin_ia: 'none', users: 'none' }
};

export const INITIAL_AUDIT_LOGS = [
  {
    id: 'log-001',
    timestamp: '2026-09-04 15:42:19',
    actor: 'Victor F. AKOA (Traffic Manager)',
    target: 'Jourdain SONGUE',
    action: 'MODIFICATION_ROLE',
    details: 'Habilitation de validation sur le module Calendrier Éditorial',
    ip: '102.244.155.12 (Douala, CM)',
    status: 'success',
    severity: 'info'
  },
  {
    id: 'log-002',
    timestamp: '2026-09-04 14:18:05',
    actor: 'Système Sécurité BRIDGE',
    target: 'Patrick TUETE',
    action: 'SESSION_LOGIN',
    details: 'Connexion réussie via Google Workspace (Orange Cameroun)',
    ip: '154.72.168.45 (Douala, CM)',
    status: 'success',
    severity: 'info'
  },
  {
    id: 'log-003',
    timestamp: '2026-09-04 11:23:44',
    actor: 'Claire MOUKOKO (Directrice Clientèle)',
    target: 'Fiche Utilisateur - Lauriane NGAMENI',
    action: 'EXPORT_PDF',
    details: 'Génération et téléchargement de la fiche RH officielle A4',
    ip: '102.244.155.12 (Douala, CM)',
    status: 'success',
    severity: 'info'
  },
  {
    id: 'log-004',
    timestamp: '2026-09-03 18:02:11',
    actor: 'Administrateur BRIDGE',
    target: 'Nouveau compte: Boris TIENTCHEU',
    action: 'CREATION_COMPTE',
    details: 'Création compte Client Orange avec génération mot de passe temporaire',
    ip: '102.244.155.12 (Douala, CM)',
    status: 'success',
    severity: 'success'
  },
  {
    id: 'log-005',
    timestamp: '2026-09-03 09:12:30',
    actor: 'Sécurité Réseau BRIDGE',
    target: 'Tentative inconnue (admin@orange-cm.com)',
    action: 'ALERTE_DOMAINE',
    details: 'Tentative de création avec domaine non autorisé bloquée par la passerelle',
    ip: '41.202.219.78 (Yaoundé, CM)',
    status: 'blocked',
    severity: 'warning'
  }
];
