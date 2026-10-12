// Utilitaires de calcul, formatage et gestion des performances de publications des Community Managers

export function getPostPerformance(post) {
  if (!post) {
    return {
      vues: 0,
      likes: 0,
      commentaires: 0,
      partages: 0,
      engagement: 0,
      tauxEngagement: '0%',
      hasMetrics: false
    };
  }

  const m = post.metrics || {};
  const vues = Math.max(0, parseInt(m.vues ?? m.views ?? post.vues ?? post.views ?? 0, 10) || 0);
  const likes = Math.max(0, parseInt(m.likes ?? post.likes ?? 0, 10) || 0);
  const commentaires = Math.max(0, parseInt(m.commentaires ?? m.comments ?? post.commentaires ?? post.comments ?? 0, 10) || 0);
  const partages = Math.max(0, parseInt(m.partages ?? m.shares ?? post.partages ?? post.shares ?? 0, 10) || 0);

  // Engagement cumulé : si spécifié explicitement ou somme likes + commentaires + partages
  const sumInteractions = likes + commentaires + partages;
  const explicitEngagement = m.engagement ?? m.engagementCumule ?? post.engagement ?? post.engagementCumule;
  const engagement = explicitEngagement !== undefined && explicitEngagement !== null && !isNaN(explicitEngagement)
    ? Math.max(0, parseInt(explicitEngagement, 10))
    : sumInteractions;

  // Calcul du taux d'engagement (%)
  let tauxEngagement = '0%';
  if (vues > 0) {
    const rate = ((engagement / vues) * 100).toFixed(2);
    tauxEngagement = `${rate}%`;
  } else if (m.tauxEngagement || post.tauxEngagement) {
    tauxEngagement = String(m.tauxEngagement || post.tauxEngagement);
  }

  const hasMetrics = vues > 0 || likes > 0 || commentaires > 0 || partages > 0 || engagement > 0;

  return {
    vues,
    likes,
    commentaires,
    partages,
    engagement,
    tauxEngagement,
    hasMetrics
  };
}

export const formatMetricNumber = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return Number(val).toLocaleString('fr-FR');
};

export const formatCompactNumber = (val) => {
  if (!val || isNaN(val)) return '0';
  const num = Number(val);
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace('.0', '') + 'k';
  }
  return num.toLocaleString('fr-FR');
};

export function buildPerformancePayload(vuesInput, likesInput, commentsInput, sharesInput, customEngagementInput) {
  const vues = Math.max(0, parseInt(vuesInput || 0, 10));
  const likes = Math.max(0, parseInt(likesInput || 0, 10));
  const commentaires = Math.max(0, parseInt(commentsInput || 0, 10));
  const partages = Math.max(0, parseInt(sharesInput || 0, 10));

  const sumInteractions = likes + commentaires + partages;
  const engagement = customEngagementInput !== undefined && customEngagementInput !== '' && !isNaN(customEngagementInput)
    ? Math.max(0, parseInt(customEngagementInput, 10))
    : sumInteractions;

  const rate = vues > 0 ? ((engagement / vues) * 100).toFixed(2) + '%' : '0%';

  return {
    vues,
    views: vues,
    likes,
    commentaires,
    comments: commentaires,
    partages,
    shares: partages,
    engagement,
    engagementCumule: engagement,
    tauxEngagement: rate,
    metrics: {
      vues,
      views: vues,
      likes,
      commentaires,
      comments: commentaires,
      partages,
      shares: partages,
      engagement,
      engagementCumule: engagement,
      tauxEngagement: rate
    }
  };
}

// Générateur de publications initiales chartées Orange Cameroun avec métriques de performances
export function getInitialCommunityPosts() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayDate = now.getDate();

  const makeDate = (offsetDays) => {
    const d = new Date(year, month, todayDate + offsetDays);
    const yStr = d.getFullYear();
    const mStr = String(d.getMonth() + 1).padStart(2, '0');
    const dStr = String(d.getDate()).padStart(2, '0');
    return {
      date: `${yStr}-${mStr}-${dStr}`,
      day: d.getDate()
    };
  };

  const d1 = makeDate(-3);
  const d2 = makeDate(-2);
  const d3 = makeDate(-1);
  const d4 = makeDate(0); // today
  const d5 = makeDate(1);
  const d6 = makeDate(2);
  const d7 = makeDate(3);

  return [
    {
      id: 'CMP-101',
      client: 'Max it',
      canal: 'Facebook',
      type: 'Carrousel',
      format: 'Paysage',
      time: '09:30',
      date: d1.date,
      day: d1.day,
      status: 'PUBLISHED',
      title: 'Flash Promo Max It — 100% Bonus Data & Recharge Facile',
      generation: 'Manual',
      desc: 'Doublez votre connexion avec Max It ! Pour toute recharge via l\'application ce week-end, profitez de 100% de bonus data offert immédiatement. Cliquez pour télécharger !',
      campaign: 'Max It Super Bonus',
      url: 'https://www.facebook.com/orangecameroun/posts/101594829182',
      isSponsored: true,
      sponsoring: {
        isSponsored: true,
        budget: 180000,
        budgetSpent: 165000,
        currency: 'FCFA',
        reach: 485000,
        impressions: 610000,
        clicks: 22400
      },
      image: 'https://images.unsplash.com/photo-1616469829941-c7200edec809?w=800&auto=format&fit=crop&q=80',
      vues: 54200,
      views: 54200,
      likes: 3120,
      commentaires: 485,
      comments: 485,
      partages: 215,
      shares: 215,
      engagement: 3820,
      engagementCumule: 3820,
      tauxEngagement: '7.05%',
      metrics: {
        vues: 54200,
        views: 54200,
        likes: 3120,
        commentaires: 485,
        comments: 485,
        partages: 215,
        shares: 215,
        engagement: 3820,
        engagementCumule: 3820,
        tauxEngagement: '7.05%'
      }
    },
    {
      id: 'CMP-102',
      client: 'Orange Money',
      canal: 'Instagram',
      type: 'Réels et Story',
      format: 'Portraits',
      time: '12:15',
      date: d2.date,
      day: d2.day,
      status: 'PUBLISHED',
      title: 'Tutoriel OM Otélé — Retrait Sans Carte Sécurisé au GAB',
      generation: 'Manual',
      desc: 'Besoin d\'argent en urgence sans carte bancaire ? Découvrez comment générer votre code de retrait Orange Money en 3 clics sur les guichets partenaires partout au Cameroun.',
      campaign: 'Orange Money Otélé',
      url: 'https://www.instagram.com/p/C7X39zKLOk2/',
      isSponsored: false,
      sponsoring: { isSponsored: false },
      image: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=800&auto=format&fit=crop&q=80',
      vues: 38900,
      views: 38900,
      likes: 2450,
      commentaires: 320,
      comments: 320,
      partages: 140,
      shares: 140,
      engagement: 2910,
      engagementCumule: 2910,
      tauxEngagement: '7.48%',
      metrics: {
        vues: 38900,
        views: 38900,
        likes: 2450,
        commentaires: 320,
        comments: 320,
        partages: 140,
        shares: 140,
        engagement: 2910,
        engagementCumule: 2910,
        tauxEngagement: '7.48%'
      }
    },
    {
      id: 'CMP-103',
      client: 'Orange Telco',
      canal: 'TikTok',
      type: 'Réels et Story',
      format: 'Portraits',
      time: '17:00',
      date: d3.date,
      day: d3.day,
      status: 'PUBLISHED',
      title: 'Pulse Dance Challenge #MaxiPulse — Battle avec les Créateurs',
      generation: 'AI',
      desc: 'Montre-nous ta meilleure chorégraphie sur le son officiel Orange Pulse ! À gagner : 1 an de forfaits data et des invitations VIP pour le festival urbain.',
      campaign: 'Orange Pulse Jeunesse',
      url: 'https://www.tiktok.com/@orangecameroun/video/7391827491029',
      isSponsored: true,
      sponsoring: {
        isSponsored: true,
        budget: 250000,
        budgetSpent: 220000,
        currency: 'FCFA',
        reach: 720000,
        impressions: 980000,
        clicks: 34100
      },
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80',
      vues: 92400,
      views: 92400,
      likes: 8150,
      commentaires: 940,
      comments: 940,
      partages: 1420,
      shares: 1420,
      engagement: 10510,
      engagementCumule: 10510,
      tauxEngagement: '11.37%',
      metrics: {
        vues: 92400,
        views: 92400,
        likes: 8150,
        commentaires: 940,
        comments: 940,
        partages: 1420,
        shares: 1420,
        engagement: 10510,
        engagementCumule: 10510,
        tauxEngagement: '11.37%'
      }
    },
    {
      id: 'CMP-104',
      client: 'Orange Business',
      canal: 'LinkedIn',
      type: 'Feed',
      format: 'Paysage',
      time: '10:00',
      date: d4.date,
      day: d4.day,
      status: 'PUBLISHED',
      title: 'Cybersécurité & Cloud B2B — Témoignage Grands Comptes Cameroun',
      generation: 'Manual',
      desc: 'Comment protéger l\'infrastructure cloud de votre entreprise face aux menaces émergentes ? Découvrez l\'étude de cas réalisée avec les équipes Orange Business Douala.',
      campaign: 'B2B Solutions Cloud',
      url: 'https://www.linkedin.com/posts/orange-cameroun-b2b_cybersecurite-cloud',
      isSponsored: false,
      sponsoring: { isSponsored: false },
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
      vues: 18600,
      views: 18600,
      likes: 840,
      commentaires: 115,
      comments: 115,
      partages: 92,
      shares: 92,
      engagement: 1047,
      engagementCumule: 1047,
      tauxEngagement: '5.63%',
      metrics: {
        vues: 18600,
        views: 18600,
        likes: 840,
        commentaires: 115,
        comments: 115,
        partages: 92,
        shares: 92,
        engagement: 1047,
        engagementCumule: 1047,
        tauxEngagement: '5.63%'
      }
    },
    {
      id: 'CMP-105',
      client: 'Orange Telco',
      canal: 'Facebook',
      type: 'Feed',
      format: 'Paysage',
      time: '14:00',
      date: d4.date,
      day: d4.day,
      status: 'SCHEDULED',
      title: 'Offre Week-end Orange — Forfaits Giga Nuit 10 Go',
      generation: 'Manual',
      desc: 'Vos soirées streaming et téléchargements en très haut débit avec les forfaits Giga Nuit. Tapez *123*1# pour souscrire dès 22h.',
      campaign: 'Orange Weekend 2026',
      url: '',
      isSponsored: true,
      sponsoring: {
        isSponsored: true,
        budget: 120000,
        currency: 'FCFA',
        dailyBudget: 20000,
        durationDays: 6
      },
      image: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=800&auto=format&fit=crop&q=80',
      vues: 0,
      views: 0,
      likes: 0,
      commentaires: 0,
      comments: 0,
      partages: 0,
      shares: 0,
      engagement: 0,
      engagementCumule: 0,
      tauxEngagement: '0%',
      metrics: {
        vues: 0,
        views: 0,
        likes: 0,
        commentaires: 0,
        comments: 0,
        partages: 0,
        shares: 0,
        engagement: 0,
        engagementCumule: 0,
        tauxEngagement: '0%'
      }
    },
    {
      id: 'CMP-106',
      client: 'Orange WhatssApp',
      canal: 'Chaine WhatsApp',
      type: 'Feed',
      format: 'Portraits',
      time: '11:00',
      date: d5.date,
      day: d5.day,
      status: 'SCHEDULED',
      title: 'Alerte Bons Plans — Chaîne Officielle WhatsApp Orange CM',
      generation: 'Manual',
      desc: 'Rejoignez la chaîne officielle Orange Cameroun sur WhatsApp pour être informé(e) des ventes flash et codes promo en avant-première.',
      campaign: 'Canaux Directs WhatsApp',
      url: '',
      isSponsored: false,
      sponsoring: { isSponsored: false },
      image: null,
      vues: 0,
      views: 0,
      likes: 0,
      commentaires: 0,
      comments: 0,
      partages: 0,
      shares: 0,
      engagement: 0,
      engagementCumule: 0,
      tauxEngagement: '0%',
      metrics: {
        vues: 0,
        views: 0,
        likes: 0,
        commentaires: 0,
        comments: 0,
        partages: 0,
        shares: 0,
        engagement: 0,
        engagementCumule: 0,
        tauxEngagement: '0%'
      }
    },
    {
      id: 'CMP-107',
      client: 'Orange Digital Center',
      canal: 'LinkedIn',
      type: 'Carrousel',
      format: 'Paysage',
      time: '15:30',
      date: d6.date,
      day: d6.day,
      status: 'PENDING',
      title: 'ODC Douala — Inscriptions Ouvertes : Formation Développeur IA & Data',
      generation: 'AI',
      desc: '100% gratuit et certifiant : Orange Digital Center forme les talents tech de demain. Dépôt des candidatures avant le 30 octobre.',
      campaign: 'Orange Digital Center RSE',
      url: '',
      isSponsored: false,
      sponsoring: { isSponsored: false },
      image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80',
      vues: 0,
      views: 0,
      likes: 0,
      commentaires: 0,
      comments: 0,
      partages: 0,
      shares: 0,
      engagement: 0,
      engagementCumule: 0,
      tauxEngagement: '0%',
      metrics: {
        vues: 0,
        views: 0,
        likes: 0,
        commentaires: 0,
        comments: 0,
        partages: 0,
        shares: 0,
        engagement: 0,
        engagementCumule: 0,
        tauxEngagement: '0%'
      }
    },
    {
      id: 'CMP-108',
      client: 'Orange Telco',
      canal: 'X',
      type: 'Feed',
      format: 'Paysage',
      time: '18:45',
      date: d7.date,
      day: d7.day,
      status: 'DRAFT',
      title: 'Match des Lions Indomptables — Pronostics et Pass Data Offerts',
      generation: 'Manual',
      desc: 'Quel est votre pronostic pour la rencontre de ce soir ? Les 10 premiers bons scores remporteront 5 Go de crédit data.',
      campaign: 'Sponsoring Sportif & Fécafoot',
      url: '',
      isSponsored: false,
      sponsoring: { isSponsored: false },
      image: null,
      vues: 0,
      views: 0,
      likes: 0,
      commentaires: 0,
      comments: 0,
      partages: 0,
      shares: 0,
      engagement: 0,
      engagementCumule: 0,
      tauxEngagement: '0%',
      metrics: {
        vues: 0,
        views: 0,
        likes: 0,
        commentaires: 0,
        comments: 0,
        partages: 0,
        shares: 0,
        engagement: 0,
        engagementCumule: 0,
        tauxEngagement: '0%'
      }
    }
  ];
}
