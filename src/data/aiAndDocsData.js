// Data models & Initial seed for Assistant IA, Documents, Prompt Library & Knowledge Base

export const INITIAL_AGENTS = [
  {
    id: "creative",
    name: "Creative AI",
    role: "Directeur de Création & Concepteur",
    icon: "🎨",
    description: "Concepts disruptifs, accroches publicitaires, scripts vidéo, storyboards et activations terrain innovantes.",
    systemPrompt: "Tu es le Directeur de Création Senior de McCann Bridge pour Orange Cameroun. Ton rôle est de proposer des concepts de campagne percutants, des idées d'activation mémorables, des storyboards engageants et des angles créatifs originaux ancrés dans la culture camerounaise et urbaine africaine.",
    model: "openai/gpt-oss-20b",
    temperature: 0.85,
    tools: ["brainstorming", "scriptwriter", "storyboarder"],
    status: "active",
    category: "Création",
    color: "#E11D48",
  },
  {
    id: "strategy",
    name: "Strategy AI",
    role: "Planneur Stratégique",
    icon: "💡",
    description: "Analyse de brief, insights consommateurs, cartographie d'audiences, positionnement et territoires de marque.",
    systemPrompt: "Tu es le Planneur Stratégique de McCann Bridge. Tu analyses les briefs, définis des problématiques clés, découvres des insights consommateurs forts au Cameroun (Douala, Yaoundé, régions), et structures des recommandations stratégiques rigoureuses et convaincantes.",
    model: "openai/gpt-oss-20b",
    temperature: 0.6,
    tools: ["market-analysis", "consumer-insights", "brief-deconstruct"],
    status: "active",
    category: "Stratégie",
    color: "#2563EB",
  },
  {
    id: "social",
    name: "Social Media AI",
    role: "Social Media Strategist & CM",
    icon: "📱",
    description: "Calendriers éditoriaux, captions virales, concepts de Reels/TikTok, stratégie de hashtags et engagement de communauté.",
    systemPrompt: "Tu es l'expert Social Media & Community Management de McCann pour Orange Cameroun (Facebook, Instagram, TikTok, X, LinkedIn). Tu crées des calendriers de publication, rédiges des captions accrocheuses en français avec touches de camfranglais si approprié, proposes des formats tendances et maximises l'engagement.",
    model: "openai/gpt-oss-20b",
    temperature: 0.75,
    tools: ["calendar-generator", "caption-writer", "trend-analyzer"],
    status: "active",
    category: "Social Media",
    color: "#059669",
  },
  {
    id: "copywriting",
    name: "Copywriting AI",
    role: "Concepteur-Rédacteur",
    icon: "✍️",
    description: "Slogans percutants, headlines, body copy publicitaire, manifestes de marque et reformulations persuasives.",
    systemPrompt: "Tu es le Concepteur-Rédacteur d'élite de McCann. Tu cisèles chaque mot pour créer des slogans inoubliables, des accroches publicitaires percutantes, des body copies fluides et des manifestes de marque inspirants avec une maîtrise absolue de la rhétorique et du ton.",
    model: "openai/gpt-oss-20b",
    temperature: 0.7,
    tools: ["slogan-maker", "tone-adjuster", "copy-polisher"],
    status: "active",
    category: "Rédaction",
    color: "#D97706",
  },
  {
    id: "research",
    name: "Research & Knowledge AI",
    role: "Document & Insights Analyst",
    icon: "🔬",
    description: "Analyse approfondie de documents internes, extraction de données clés, synthèse documentaire et comparaisons RAG.",
    systemPrompt: "Tu es l'Analyste de Recherche et de Connaissances de McCann Bridge. Tu exploites la base de connaissances documentaire de l'agence (Brand Guidelines, Briefs, Rapports, Etudes) pour extraire avec exactitude les informations recherchées, citer les sources et produire des synthèses structurées.",
    model: "openai/gpt-oss-20b",
    temperature: 0.3,
    tools: ["rag-search", "document-summarizer", "data-extractor"],
    status: "active",
    category: "Analyse",
    color: "#7C3AED",
  },
  {
    id: "project",
    name: "Project Manager AI",
    role: "Chef de Projet & Coordination",
    icon: "⏱️",
    description: "Comptes-rendus de réunion, matrice de tâches, rétroplannings, suivi d'actions et synthèses de projet.",
    systemPrompt: "Tu es le Chef de Projet Digital Senior de McCann Bridge. Tu structures les plannings de campagne, rédiges des comptes-rendus de réunion actionnables, récapitules les livrables clés et identifies les points de blocage opérationnels avec rigueur.",
    model: "openai/gpt-oss-20b",
    temperature: 0.4,
    tools: ["timeline-builder", "meeting-notes", "task-matrix"],
    status: "active",
    category: "Projet",
    color: "#0D9488",
  },
];

export const INITIAL_CLIENTS_HIERARCHY = [
  {
    id: "client-orange",
    name: "Orange Cameroun",
    brands: [
      {
        id: "brand-orange-telco",
        name: "Orange (Telco & Data)",
        projects: [
          { id: "proj-ramadan-2026", name: "Campagne Ramadan 2026", code: "RAM-26" },
          { id: "proj-5g-launch", name: "Lancement Orange 5G Cameroun", code: "5G-26" },
          { id: "proj-rentree-2026", name: "Rentrée Digitale & Étudiants 2026", code: "REN-26" },
        ],
      },
      {
        id: "brand-orange-money",
        name: "Orange Money Cameroun",
        projects: [
          { id: "proj-om-bank", name: "OM Visa Card & Transferts Régionaux", code: "OM-VISA" },
          { id: "proj-om-marchand", name: "Campagne Paiement Marchand QR", code: "OM-QR" },
        ],
      },
      {
        id: "brand-pulse",
        name: "Orange Pulse (Jeunes)",
        projects: [
          { id: "proj-pulse-gaming", name: "Pulse Gaming League Season 3", code: "PULSE-G" },
          { id: "proj-pulse-music", name: "Pulse Music Experience 2026", code: "PULSE-M" },
        ],
      },
    ],
  },
  {
    id: "client-nestle",
    name: "Nestlé Cameroun",
    brands: [
      {
        id: "brand-maggi",
        name: "Maggi Cameroun",
        projects: [
          { id: "proj-maggi-etoile", name: "Caravane Culinaire des Étoiles", code: "MAG-CAR" },
        ],
      },
      {
        id: "brand-nescafe",
        name: "Nescafé",
        projects: [
          { id: "proj-nescafe-start", name: "Start Strong Yaoundé Tour", code: "NES-SS" },
        ],
      },
    ],
  },
];

export const INITIAL_PROMPT_TEMPLATES = [
  {
    id: "prompt-1",
    title: "Générateur d'Accroches & Slogans de Campagne",
    description: "Formule 5 slogans percutants et 10 déclinaisons pour affichage, radio et digital.",
    category: "Création",
    profession: "Directeur Artistique / Concepteur",
    author: "Steve B. (McCann)",
    visibility: "global",
    tags: ["Campagne", "Slogan", "Copywriting", "Créa"],
    recommendedModel: "openai/gpt-oss-20b",
    favorite: true,
    content: `Agis comme un Directeur de Création de renommée mondiale.
Je prépare une campagne pour la marque {{brand}} autour du projet "{{campaign}}".
Cible prioritaire : {{audience}}
Objectif principal : {{objective}}
Ton souhaité : {{tone}}

Livrables attendus :
1. Un Manifeste de campagne en 4 phrases inspirantes.
2. 5 Accroches fortes (Headlines) adaptées à l'affichage urbain et aux réseaux sociaux.
3. 3 Déclinaisons en camfranglais / argot urbain camerounais accessible.
4. Une proposition de hashtag signature.`,
  },
  {
    id: "prompt-2",
    title: "Planning Éditorial Social Media Hebdomadaire",
    description: "Construit un calendrier de posts complet du lundi au dimanche avec objectifs et visuels.",
    category: "Social Media",
    profession: "Community Manager",
    author: "Sarah K. (Social Lead)",
    visibility: "global",
    tags: ["Planning", "Instagram", "Facebook", "TikTok"],
    recommendedModel: "openai/gpt-oss-20b",
    favorite: true,
    content: `Crée un calendrier éditorial pour la marque {{brand}} sur la semaine prochaine.
Projet / Axe thématique : {{campaign}}
Cible : {{audience}}
Objectif : {{objective}}

Pour chaque jour (Lundi au Dimanche), fournis dans un tableau :
- Jour & Heure optimale
- Pilier de contenu (Éducatif, Divertissant, Promotionnel, Engagement)
- Format (Carrousel, Reel, Post statique, Story, Sondage)
- Proposition de visuel / Scénario vidéo (en 2 lignes)
- Caption prête à publier avec call-to-action
- 4 à 6 hashtags stratégiques`,
  },
  {
    id: "prompt-3",
    title: "Déconstruction & Analyse Stratégique de Brief",
    description: "Analyse le brief client, identifie la vraie problématique et formule le single minded proposition.",
    category: "Stratégie",
    profession: "Planneur Stratégique",
    author: "Marc O. (Strat Lead)",
    visibility: "global",
    tags: ["Brief", "Stratégie", "Insights", "Positionnement"],
    recommendedModel: "openai/gpt-oss-20b",
    favorite: false,
    content: `Analyse le brief suivant pour la marque {{brand}} dans le cadre du projet "{{campaign}}".
Objectif business et communication : {{objective}}
Audience visée : {{audience}}

Fournis une analyse stratégique en 5 étapes :
1. Reformulation de la problématique commerciale en problématique de communication.
2. Définition de l'Insight consommateur clé (Tension culturelle / vérité humaine).
3. Single Minded Proposition (L'idée unique à faire passer en 1 phrase).
4. Raisons de croire (RTBs - Reasons To Believe).
5. Mesure du succès (KPIs quantitatifs et qualitatifs).`,
  },
  {
    id: "prompt-4",
    title: "Script Vidéo Publicitaire 30s & 15s",
    description: "Rédige le script vidéo minuté avec colonnes Vidéo, Audio et Voix-off.",
    category: "Création",
    profession: "Concepteur-Rédacteur",
    author: "Marie D. (Copywriter)",
    visibility: "global",
    tags: ["Vidéo", "Script", "Spot TV", "Digital"],
    recommendedModel: "openai/gpt-oss-20b",
    favorite: true,
    content: `Rédige un script publicitaire pour {{brand}} pour la campagne "{{campaign}}".
Objectif : {{objective}}
Cible : {{audience}}
Ton : {{tone}}

Format : Tableau scénarisé minute par minute (0-5s, 5-15s, 15-25s, 25-30s) avec :
- Description visuelle (Cadre, acteurs, décor camerounais réaliste)
- Voix-off / Dialogue
- Effets sonores & Musique d'ambiance
- Packshot final et Mentions légales / Call to action.`,
  },
  {
    id: "prompt-5",
    title: "Synthèse & Extraction de Faits depuis Documents Internes",
    description: "Extrait les données clés, contraintes juridiques et éléments de charte d'un document.",
    category: "Analyse",
    profession: "Chef de Projet",
    author: "Kevin N. (Account Manager)",
    visibility: "team",
    tags: ["Synthèse", "RAG", "Knowledge", "Audit"],
    recommendedModel: "openai/gpt-oss-20b",
    favorite: false,
    content: `À partir des documents attachés en contexte pour {{brand}} et le projet {{campaign}} :
1. Résume en 5 points clés les directives obligatoires de la marque.
2. Liste les contraintes juridiques et mentions obligatoires à respecter.
3. Synthétise les chiffres clés ou offres tarifaires mentionnées.
4. Identifie d'éventuelles incohérences ou points nécessitant un arbitrage client.`,
  },
  {
    id: "prompt-6",
    title: "Compte-Rendu de Réunion Client & Matrice d'Actions",
    description: "Transforme des notes brutes en compte-rendu exécutif clair avec responsables et deadlines.",
    category: "Projet",
    profession: "Chef de Projet",
    author: "Alain T. (Directeur de Clientèle)",
    visibility: "global",
    tags: ["Compte-Rendu", "Management", "Actions", "Client"],
    recommendedModel: "openai/gpt-oss-20b",
    favorite: false,
    content: `Génère un compte-rendu de réunion officiel McCann Bridge pour le client {{brand}} sur le projet {{campaign}}.
Objectif de la réunion : {{objective}}

Format du compte-rendu :
- Date & Participants
- Décisions majeures validées en séance
- Tableau des actions : [Tâche | Responsable Agence/Client | Date limite | Statut]
- Date et ordre du jour proposé pour le prochain point d'étape.`,
  },
];

export const INITIAL_DOCUMENTS = [
  {
    id: "doc-1",
    title: "Brand_Guidelines_Orange_Cameroun_2026.pdf",
    name: "Brand Guidelines Orange Cameroun 2026",
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileType: "pdf",
    fileSize: "4.8 MB",
    category: "Guidelines",
    client: "Orange Cameroun",
    clientId: "client-orange",
    brand: "Orange (Telco & Data)",
    brandId: "brand-orange-telco",
    project: "Campagne Ramadan 2026",
    projectId: "proj-ramadan-2026",
    owner: "Steve B.",
    ownerId: "usr_steve",
    currentVersion: "V3",
    status: "Validé",
    inKnowledgeBase: true,
    createdAt: "2026-03-10T10:00:00.000Z",
    updatedAt: "2026-04-12T14:30:00.000Z",
    tags: ["Charte Graphique", "Logo", "Typographie", "Palette Couleur", "Tone of Voice"],
    description: "Guide complet de marque 2026 pour Orange Cameroun : règles d'usage du carré orange, typographie Helvetica Neue LT, palette secondaire et tonalité de communication bienveillante et dynamique.",
    content: `GUIDE DE MARQUE ORANGE CAMEROUN 2026
1. Identité Visuelle :
Le carré Orange doit toujours être positionné avec un espace de respiration égal à la moitié de sa hauteur.
Couleur primaire : Orange #FF7900 (Pantone 151 C).
Couleurs secondaires autorisées : Noir #000000, Blanc #FFFFFF, Gris foncé #333333, Jaune Soleil #FFCC00 (accents promo).

2. Tonalité & Expression :
Le ton est proche, humain, optimiste et orienté solution.
Langues officielles de diffusion : Français et Anglais.
Pour les cibles jeunes et urbaines, des formules idiomatiques locales en camfranglais sont permises sous validation préalable du Brand Manager.

3. Règles d'Affichage & Digital :
Tout visuel publicitaire doit obligatoirement intégrer le disclaimer réglementaire de l'ART et la signature officielle 'Vous rapprocher de l'essentiel'.`,
    versions: [
      {
        id: "v3",
        version: "V3",
        date: "12/04/2026",
        author: "Steve B.",
        fileSize: "4.8 MB",
        comment: "Mise à jour des déclinaisons digitales et harmonisation des couleurs d'accent.",
        status: "Validé",
      },
      {
        id: "v2",
        version: "V2",
        date: "25/03/2026",
        author: "Marie D.",
        fileSize: "4.5 MB",
        comment: "Ajout des spécifications typographiques pour formats verticaux 9:16 (Stories/Reels).",
        status: "Révisé",
      },
      {
        id: "v1",
        version: "V1",
        date: "10/03/2026",
        author: "Steve B.",
        fileSize: "4.2 MB",
        comment: "Version initiale soumise pour la nouvelle année fiscale.",
        status: "Initial",
      },
    ],
    comments: [
      {
        id: "c1",
        author: "Marie D.",
        role: "Chef de Projet Digital",
        date: "12/04/2026 15:10",
        content: "La palette d'accent jaune pour le Ramadan est validée par le client. Document prêt pour déploiement créa.",
      },
      {
        id: "c2",
        author: "Kevin N.",
        role: "Account Lead",
        date: "12/04/2026 16:45",
        content: "Parfait ! Les équipes créatives et CM doivent s'y conformer strictement.",
      },
    ],
  },
  {
    id: "doc-2",
    title: "Brief_Strategique_Campagne_Ramadan_2026.docx",
    name: "Brief Stratégique Ramadan 2026",
    fileUrl: "#",
    fileType: "docx",
    fileSize: "1.2 MB",
    category: "Brief",
    client: "Orange Cameroun",
    clientId: "client-orange",
    brand: "Orange (Telco & Data)",
    brandId: "brand-orange-telco",
    project: "Campagne Ramadan 2026",
    projectId: "proj-ramadan-2026",
    owner: "Marc O.",
    ownerId: "usr_marc",
    currentVersion: "V2",
    status: "Validé",
    inKnowledgeBase: true,
    createdAt: "2026-03-15T09:00:00.000Z",
    updatedAt: "2026-04-02T11:20:00.000Z",
    tags: ["Ramadan", "Brief", "Stratégie", "Offres Data", "Grand Nord"],
    description: "Brief de campagne 360° pour le mois saint du Ramadan 2026 : ciblage Grand Nord (Maroua, Garoua, Ngaoundéré) et diaspora urbaine (Douala, Yaoundé). Focus sur la générosité, le partage et les pass data nuit.",
    content: `BRIEF STRATÉGIQUE — CAMPAGNE RAMADAN 2026 ORANGE CAMEROUN
Contexte :
Pendant le mois de Ramadan, la consommation de data et les appels connaissent un pic majeur entre 18h et 5h du matin (Iftar et Sahur).
Le besoin de connectivité pour garder le contact avec la famille et partager des prières/recettes est au plus haut.

Objectif de Communication :
Positionner Orange comme le partenaire privilégié de la générosité et du partage familial pendant le Ramadan.

Cibles :
1. Cible Coeur : Communauté musulmane du Grand Nord et des grandes métropoles (18-45 ans).
2. Cible Secondaire : Familles et entourage bénéficiant des transferts Orange Money et des forfaits partagés.

Offres phares à promouvoir :
- Pass Nuit Ramadan : 5 Go à 500 FCFA de 23h à 6h.
- Bonus Recharges Spécial Ramadan : 100% de bonus data sur toute recharge Orange Money le vendredi.
- Dons & Solidarité OM : 0 frais de transfert vers les associations caritatives partenaires.`,
    versions: [
      {
        id: "v2",
        version: "V2",
        date: "02/04/2026",
        author: "Marc O.",
        fileSize: "1.2 MB",
        comment: "Intégration du volet Orange Money 0 frais pour dons caritatifs.",
        status: "Validé",
      },
      {
        id: "v1",
        version: "V1",
        date: "15/03/2026",
        author: "Marc O.",
        fileSize: "1.1 MB",
        comment: "Première mouture du brief stratégique.",
        status: "Initial",
      },
    ],
    comments: [
      {
        id: "c3",
        author: "Sarah K.",
        role: "Social Media Lead",
        date: "03/04/2026 10:20",
        content: "Nous avons prévu 12 capsules vidéo spéciales recettes Sahur et messages de paix animées par nos CM.",
      },
    ],
  },
  {
    id: "doc-3",
    title: "Presentation_Lancement_Orange_5G_Douala_Yaounde.pptx",
    name: "Pitch & Plan de Lancement Orange 5G",
    fileUrl: "#",
    fileType: "pptx",
    fileSize: "18.5 MB",
    category: "Création",
    client: "Orange Cameroun",
    clientId: "client-orange",
    brand: "Orange (Telco & Data)",
    brandId: "brand-orange-telco",
    project: "Lancement Orange 5G Cameroun",
    projectId: "proj-5g-launch",
    owner: "Steve B.",
    ownerId: "usr_steve",
    currentVersion: "V4",
    status: "En révision",
    inKnowledgeBase: true,
    createdAt: "2026-03-20T11:00:00.000Z",
    updatedAt: "2026-04-18T16:00:00.000Z",
    tags: ["5G", "Innovation", "Keynote", "B2B", "Ultra Débit"],
    description: "Support de présentation pour la conférence de presse et le reveal grand public de l'Orange 5G : débits x10, couverture pilote Bonanjo, Akwa et Bastos.",
    content: `PLAN DE LANCEMENT ORANGE 5G CAMEROUN — SLIDES CLÉS
Slide 4 : Le Saut Technologique
Débits réels constatés : jusqu'à 1.2 Gbps (latence inférieure à 10ms).
Zones pilotes au lancement : Douala (Akwa, Bonanjo, Bonapriso) & Yaoundé (Bastos, Centre Administratif, Omnisports).

Slide 7 : Le Territoire de Communication
Signature proposée : 'La Vitesse d'Avance. Bienvenue dans l'ère 5G Orange.'
Partenariats technologiques & influenceurs tech : Démonstrations live de cloud gaming, télémédecine et retransmissions 4K.`,
    versions: [
      {
        id: "v4",
        version: "V4",
        date: "18/04/2026",
        author: "Steve B.",
        fileSize: "18.5 MB",
        comment: "Ajout des slides de démonstration Gaming et B2B.",
        status: "En révision",
      },
      {
        id: "v3",
        version: "V3",
        date: "05/04/2026",
        author: "Steve B.",
        fileSize: "16.2 MB",
        comment: "Ajustement du rétroplanning événementiel de lancement.",
        status: "Révisé",
      },
    ],
    comments: [],
  },
  {
    id: "doc-4",
    title: "Etude_Marche_Jeunes_Pulse_Gaming_2026.xlsx",
    name: "Étude Marché & KPIs Orange Pulse Gaming",
    fileUrl: "#",
    fileType: "xlsx",
    fileSize: "2.1 MB",
    category: "Rapport",
    client: "Orange Cameroun",
    clientId: "client-orange",
    brand: "Orange Pulse (Jeunes)",
    brandId: "brand-pulse",
    project: "Pulse Gaming League Season 3",
    projectId: "proj-pulse-gaming",
    owner: "Sarah K.",
    ownerId: "usr_sarah",
    currentVersion: "V1",
    status: "Validé",
    inKnowledgeBase: true,
    createdAt: "2026-04-01T08:30:00.000Z",
    updatedAt: "2026-04-01T08:30:00.000Z",
    tags: ["Pulse", "Gaming", "Jeunes", "Statistiques", "Esport"],
    description: "Données chiffrées sur la communauté esport camerounaise (FC26, Call of Duty Mobile, PUBG Mobile) et prévisions d'inscriptions pour la saison 3.",
    content: `RAPPORT ÉTUDE ESPORT & JEUNESSE ORANGE PULSE 2026
Principaux enseignements :
- 68% des 16-25 ans interrogés jouent au moins 3 fois par semaine sur smartphone (CoD Mobile, Free Fire).
- Le tournoi Pulse Gaming Season 2 a généré +450 000 vues en streaming live et +12 000 participants.
- Objectif Saison 3 : 25 000 participants qualifiés à Douala, Yaoundé, Bafoussam et Buéa avec un cashprize total de 10 000 000 FCFA.`,
    versions: [
      {
        id: "v1",
        version: "V1",
        date: "01/04/2026",
        author: "Sarah K.",
        fileSize: "2.1 MB",
        comment: "Version finale de consolidation des insights marché.",
        status: "Validé",
      },
    ],
    comments: [],
  },
  {
    id: "doc-5",
    title: "Contrat_Partenariat_Influenceurs_Ramadan.docx",
    name: "Modèle Contrat & Livrables Influenceurs Ramadan",
    fileUrl: "#",
    fileType: "docx",
    fileSize: "850 KB",
    category: "Contrat",
    client: "Orange Cameroun",
    clientId: "client-orange",
    brand: "Orange (Telco & Data)",
    brandId: "brand-orange-telco",
    project: "Campagne Ramadan 2026",
    projectId: "proj-ramadan-2026",
    owner: "Kevin N.",
    ownerId: "usr_kevin",
    currentVersion: "V1",
    status: "Validé",
    inKnowledgeBase: false,
    createdAt: "2026-04-05T14:00:00.000Z",
    updatedAt: "2026-04-05T14:00:00.000Z",
    tags: ["Influence", "Contrat", "Juridique", "Livrables"],
    description: "Modèle de contrat cadre fixant les engagements éditoriaux, le respect de la charte de modération et le calendrier de diffusion des créateurs de contenu.",
    content: `CONTRAT CADRE PARTENARIAT INFLUENCE — MCCANN / ORANGE
Engagements obligatoires :
1. Chaque créateur doit mentionner explicitement le hashtag officiel #OrangeRamadanEnsemble.
2. Tout contenu doit faire l'objet d'une pré-validation sur le portail McCann Bridge au minimum 48h avant mise en ligne.
3. Respect strict de la modération et interdiction de propos polémiques ou discriminatoires.`,
    versions: [
      {
        id: "v1",
        version: "V1",
        date: "05/04/2026",
        author: "Kevin N.",
        fileSize: "850 KB",
        comment: "Validé par le pôle juridique de l'agence.",
        status: "Validé",
      },
    ],
    comments: [],
  },
];

export const INITIAL_KNOWLEDGE_CHUNKS = [
  {
    id: "kc-1",
    documentId: "doc-1",
    documentTitle: "Brand Guidelines Orange Cameroun 2026",
    category: "Guidelines",
    page: 4,
    content: "Le carré Orange doit toujours être positionné avec un espace de respiration égal à la moitié de sa hauteur. Couleur primaire : Orange #FF7900 (Pantone 151 C). Signature officielle obligatoire : 'Vous rapprocher de l'essentiel'.",
    tags: ["logo", "couleur", "charte"],
  },
  {
    id: "kc-2",
    documentId: "doc-1",
    documentTitle: "Brand Guidelines Orange Cameroun 2026",
    category: "Tone of Voice",
    page: 8,
    content: "Tonalité Orange : chaleureuse, optimiste, humaine et directe. Les déclinaisons en camfranglais sont permises pour les cibles jeunes et urbaines mais requièrent validation de conformité.",
    tags: ["ton", "camfranglais", "rédaction"],
  },
  {
    id: "kc-3",
    documentId: "doc-2",
    documentTitle: "Brief Stratégique Ramadan 2026",
    category: "Stratégie",
    page: 2,
    content: "Offre phare Ramadan : Pass Nuit Ramadan 5 Go à 500 FCFA de 23h à 6h. Bonus 100% data pour recharges Orange Money le vendredi. Opération de solidarité 0 frais vers les associations caritatives.",
    tags: ["ramadan", "pass nuit", "orange money", "tarifs"],
  },
  {
    id: "kc-4",
    documentId: "doc-2",
    documentTitle: "Brief Stratégique Ramadan 2026",
    category: "Insights",
    page: 1,
    content: "Pendant le Ramadan, le pic de trafic data survient entre 18h et 5h (Iftar et Sahur). L'axe créatif doit valoriser le partage, les retrouvailles familiales et la communion.",
    tags: ["iftar", "famille", "insights"],
  },
  {
    id: "kc-5",
    documentId: "doc-3",
    documentTitle: "Pitch & Plan de Lancement Orange 5G",
    category: "Technologie & 5G",
    page: 4,
    content: "Orange 5G Cameroun : débits réels jusqu'à 1.2 Gbps avec latence inférieure à 10ms. Zones de couverture pilote : Douala (Akwa, Bonanjo, Bonapriso) et Yaoundé (Bastos, Centre Administratif).",
    tags: ["5g", "débit", "zones de couverture"],
  },
  {
    id: "kc-6",
    documentId: "doc-4",
    documentTitle: "Étude Marché & KPIs Orange Pulse Gaming",
    category: "Esport & Jeunesse",
    page: 3,
    content: "Pulse Gaming League Saison 3 : 25 000 participants attendus sur CoD Mobile et FC26, cashprize total de 10 000 000 FCFA à travers Douala, Yaoundé, Bafoussam et Buéa.",
    tags: ["pulse", "gaming", "esport", "tournoi"],
  },
];

export const INITIAL_CONVERSATIONS = [
  {
    id: "conv-1",
    title: "Stratégie & Accroches Ramadan 2026",
    userId: "usr_steve",
    userName: "Steve B.",
    agentId: "creative",
    agentName: "Creative AI",
    clientId: "client-orange",
    clientName: "Orange Cameroun",
    brandId: "brand-orange-telco",
    brandName: "Orange (Telco & Data)",
    projectId: "proj-ramadan-2026",
    projectName: "Campagne Ramadan 2026",
    selectedDocuments: ["doc-1", "doc-2"],
    createdAt: "2026-04-18T10:00:00.000Z",
    updatedAt: "2026-04-18T10:25:00.000Z",
    messages: [
      {
        id: "m-1",
        role: "user",
        content: "Propose-moi 3 concepts créatifs de campagne pour le Ramadan 2026 d'Orange Cameroun, en intégrant les offres Pass Nuit et les valeurs de partage.",
        createdAt: "2026-04-18T10:00:00.000Z",
      },
      {
        id: "m-2",
        role: "assistant",
        content: `### Propositions Créatives — Campagne Ramadan 2026 (Orange Cameroun)

En exploitant les directives du **Brief Stratégique** [Source 1: Brief_Strategique_Campagne_Ramadan_2026.docx] et la charte de marque [Source 2: Brand_Guidelines_Orange_Cameroun_2026.pdf], voici 3 pistes créatives percutantes :

---

#### 🌟 Piste 1 : « La Nuit Rapproche les Cœurs » (Axe Émotion & Solidarité)
- **Concept :** Une narration visuelle nocturne mettant en scène les moments de Sahur et d'Iftar reliés par la data Orange.
- **Accroche Principale :** *"Quand la nuit s'illumine, la générosité prend tout son sens avec le Pass Nuit 5 Go à 500 FCFA."*
- **Dispositif 360° :**
  - Film TV / Digital 30s montrant un jeune étudiant à Douala partageant la prière en visio avec ses grands-parents à Maroua.
  - Carrousels Social Media axés sur les 0 frais Orange Money pour les dons caritatifs.

---

#### 🚀 Piste 2 : « Partagez Plus Que des Mégas » (Axe Générosité Active)
- **Concept :** Valoriser le bonus 100% data du vendredi et le geste de transférer du crédit à ses proches.
- **Accroche Principale :** *"Ce Ramadan, chaque giga offert est une bénédiction partagée."*
- **Activation :** Challenge TikTok avec créateurs de contenu locaux autour des recettes traditionnelles et du hashtag **#OrangeRamadanEnsemble**.

---

#### 🤝 Piste 3 : « Le Grand Nord au Cœur de la Fête » (Axe Ancrage Culturel Local)
- **Concept :** Visuels chaleureux aux teintes dorées et Orange, sublimant l'hospitalité et l'architecture sahélienne.
- **Accroche :** *"Ensemble sous la même étoile, connectés à l'essentiel."*

---

Souhaitez-vous que je développe le script complet du spot TV de la Piste 1 ou le calendrier social media ?`,
        createdAt: "2026-04-18T10:01:15.000Z",
        sources: [
          {
            id: "src-1",
            documentId: "doc-2",
            title: "Brief_Strategique_Campagne_Ramadan_2026.docx",
            page: 1,
            category: "Brief",
            excerpt: "Offre phare Ramadan : Pass Nuit Ramadan 5 Go à 500 FCFA de 23h à 6h. Bonus 100% data le vendredi.",
          },
          {
            id: "src-2",
            documentId: "doc-1",
            title: "Brand_Guidelines_Orange_Cameroun_2026.pdf",
            page: 8,
            category: "Guidelines",
            excerpt: "Tonalité chaleureuse, optimiste et humaine. Signature obligatoire : Vous rapprocher de l'essentiel.",
          },
        ],
        feedback: "positive",
      },
    ],
  },
];

export const INITIAL_AUDIT_LOGS = [
  {
    id: "log-1",
    userId: "usr_steve",
    userName: "Steve B.",
    action: "UPLOAD_DOCUMENT",
    resourceType: "document",
    resourceId: "doc-1",
    resourceName: "Brand_Guidelines_Orange_Cameroun_2026.pdf",
    timestamp: "2026-04-12T14:30:00.000Z",
    metadata: { version: "V3", category: "Guidelines" },
  },
  {
    id: "log-2",
    userId: "usr_steve",
    userName: "Steve B.",
    action: "INDEX_KNOWLEDGE_BASE",
    resourceType: "knowledge_base",
    resourceId: "doc-1",
    resourceName: "Brand_Guidelines_Orange_Cameroun_2026.pdf",
    timestamp: "2026-04-12T14:35:00.000Z",
    metadata: { chunksCount: 6 },
  },
  {
    id: "log-3",
    userId: "usr_marc",
    userName: "Marc O.",
    action: "CREATE_AI_CONVERSATION",
    resourceType: "ai_conversation",
    resourceId: "conv-1",
    resourceName: "Stratégie & Accroches Ramadan 2026",
    timestamp: "2026-04-18T10:00:00.000Z",
    metadata: { agent: "creative", client: "Orange Cameroun" },
  },
];
