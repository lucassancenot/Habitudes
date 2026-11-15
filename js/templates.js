// Bibliothèque d'habitudes courantes avec leurs bienfaits suggérés.
// Les bienfaits sont des points de départ : tout est modifiable dans l'application.

export const COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // rose
  '#ef4444', // rouge
  '#f97316', // orange
  '#eab308', // jaune
  '#22c55e', // vert
  '#14b8a6', // turquoise
  '#06b6d4', // cyan
  '#3b82f6', // bleu
  '#64748b', // ardoise
  '#a16207', // brun
];

export const ICONS = [
  '💧', '🏃', '🧘', '📚', '😴', '🥗', '🍎', '💪', '🚶', '🚴', '🏊', '🧠',
  '✍️', '📝', '🎯', '⏰', '🌅', '🛏️', '🦷', '🧴', '💊', '🌿', '☀️', '🎵',
  '🎨', '🎸', '🗣️', '📞', '❤️', '🙏', '😊', '🧹', '💰', '📵', '🚭', '🍷',
  '🍬', '☕', '🎮', '📱', '💻', '🌱', '🐕', '🧊', '🥛', '⭐', '🔥', '✅',
];

export const TEMPLATES = [
  // --- Santé & corps
  {
    category: 'Santé',
    name: "Boire de l'eau",
    icon: '💧',
    color: '#06b6d4',
    type: 'quantity',
    target: 8,
    unit: 'verres',
    keywords: ['eau', 'boire', 'hydrat', 'verre'],
    benefits: [
      'Améliore la concentration et la mémoire',
      'Réduit la fatigue et les maux de tête',
      'Favorise une peau plus saine',
      'Aide la digestion et le transit',
      'Régule la température du corps',
    ],
  },
  {
    category: 'Santé',
    name: 'Faire du sport',
    icon: '💪',
    color: '#ef4444',
    type: 'weekly',
    timesPerWeek: 3,
    keywords: ['sport', 'muscu', 'salle', 'gym', 'entrain', 'fitness', 'crossfit', 'exercice'],
    benefits: [
      'Renforce le cœur et le système cardiovasculaire',
      "Libère des endorphines et améliore l'humeur",
      'Réduit le stress et l\'anxiété',
      'Améliore la qualité du sommeil',
      'Renforce les muscles et les os',
      "Augmente l'énergie au quotidien",
    ],
  },
  {
    category: 'Santé',
    name: 'Courir',
    icon: '🏃',
    color: '#f97316',
    type: 'weekly',
    timesPerWeek: 3,
    keywords: ['courir', 'course', 'running', 'jogging', 'footing', 'run'],
    benefits: [
      "Améliore l'endurance et la capacité pulmonaire",
      'Aide à gérer le poids',
      "Libère des endorphines (« runner's high »)",
      'Clarifie les idées et réduit le stress',
      'Renforce les os et les articulations',
    ],
  },
  {
    category: 'Santé',
    name: 'Marcher 10 000 pas',
    icon: '🚶',
    color: '#22c55e',
    type: 'quantity',
    target: 10000,
    unit: 'pas',
    keywords: ['marche', 'marcher', 'pas', 'promenade', 'balade'],
    benefits: [
      'Réduit les risques de maladies cardiovasculaires',
      'Stimule la créativité',
      'Améliore la digestion',
      "Contrebalance les effets de la position assise",
      'Améliore l\'humeur, surtout en extérieur',
    ],
  },
  {
    category: 'Santé',
    name: "S'étirer",
    icon: '🤸',
    color: '#14b8a6',
    type: 'check',
    keywords: ['etir', 'stretch', 'souplesse', 'mobilite'],
    benefits: [
      'Améliore la souplesse et la mobilité',
      'Réduit les tensions musculaires et le mal de dos',
      'Diminue le risque de blessure',
      'Favorise la détente',
    ],
  },
  {
    category: 'Santé',
    name: 'Dormir 8 heures',
    icon: '😴',
    color: '#6366f1',
    type: 'quantity',
    target: 8,
    unit: 'heures',
    keywords: ['dormir', 'sommeil', 'dodo', 'nuit', 'coucher'],
    benefits: [
      'Consolide la mémoire et les apprentissages',
      'Renforce le système immunitaire',
      "Stabilise l'humeur et réduit l'irritabilité",
      "Régule l'appétit",
      'Améliore la concentration et la prise de décision',
    ],
  },
  {
    category: 'Santé',
    name: 'Se coucher avant 23h',
    icon: '🛏️',
    color: '#8b5cf6',
    type: 'check',
    keywords: ['coucher', '23h', 'tot', 'heure fixe'],
    benefits: [
      "Régule l'horloge biologique",
      'Facilite le réveil le matin',
      'Améliore la qualité du sommeil profond',
    ],
  },
  {
    category: 'Santé',
    name: 'Manger 5 fruits et légumes',
    icon: '🥗',
    color: '#22c55e',
    type: 'quantity',
    target: 5,
    unit: 'portions',
    keywords: ['fruit', 'legume', 'manger', 'sain', 'alimentation', 'salade'],
    benefits: [
      'Apporte vitamines, minéraux et fibres',
      'Réduit le risque de maladies chroniques',
      'Améliore la digestion',
      'Donne plus d\'énergie stable',
    ],
  },
  {
    category: 'Santé',
    name: 'Prendre ses vitamines',
    icon: '💊',
    color: '#eab308',
    type: 'check',
    keywords: ['vitamine', 'complement', 'medicament', 'cachet'],
    benefits: ['Comble les carences éventuelles', 'Soutient le système immunitaire'],
  },
  {
    category: 'Santé',
    name: 'Douche froide',
    icon: '🧊',
    color: '#3b82f6',
    type: 'check',
    keywords: ['froid', 'douche', 'glace'],
    benefits: [
      'Booste la vigilance et l\'énergie',
      'Stimule la circulation sanguine',
      'Renforce la discipline et la tolérance à l\'inconfort',
    ],
  },
  {
    category: 'Santé',
    name: 'Se brosser les dents (fil dentaire)',
    icon: '🦷',
    color: '#06b6d4',
    type: 'check',
    keywords: ['dent', 'fil dentaire', 'brosse'],
    benefits: ['Prévient les caries et les maladies des gencives', 'Haleine plus fraîche'],
  },

  // --- Esprit
  {
    category: 'Esprit',
    name: 'Méditer',
    icon: '🧘',
    color: '#8b5cf6',
    type: 'quantity',
    target: 10,
    unit: 'min',
    keywords: ['medit', 'pleine conscience', 'respiration', 'mindful', 'calme'],
    benefits: [
      "Réduit le stress et l'anxiété",
      'Améliore la concentration et l\'attention',
      'Aide à mieux gérer ses émotions',
      'Améliore la qualité du sommeil',
      'Développe la conscience de soi',
    ],
  },
  {
    category: 'Esprit',
    name: 'Lire',
    icon: '📚',
    color: '#a16207',
    type: 'quantity',
    target: 20,
    unit: 'pages',
    keywords: ['lire', 'lecture', 'livre', 'page', 'roman'],
    benefits: [
      'Enrichit le vocabulaire et la culture générale',
      'Stimule la mémoire et la concentration',
      'Réduit le stress',
      "Développe l'empathie",
      'Favorise un meilleur endormissement (sans écran)',
    ],
  },
  {
    category: 'Esprit',
    name: 'Écrire son journal',
    icon: '✍️',
    color: '#ec4899',
    type: 'check',
    keywords: ['journal', 'ecrire', 'ecriture', 'journaling', 'gratitude'],
    benefits: [
      'Clarifie les pensées et les émotions',
      'Réduit le stress et les ruminations',
      'Aide à se fixer et suivre des objectifs',
      'Garde une trace de sa progression',
    ],
  },
  {
    category: 'Esprit',
    name: '3 gratitudes',
    icon: '🙏',
    color: '#f97316',
    type: 'check',
    keywords: ['gratitude', 'merci', 'reconnaissance'],
    benefits: [
      'Augmente le sentiment de bonheur',
      'Oriente l\'attention vers le positif',
      'Améliore les relations',
      'Favorise un meilleur sommeil',
    ],
  },
  {
    category: 'Esprit',
    name: 'Apprendre une langue',
    icon: '🗣️',
    color: '#3b82f6',
    type: 'quantity',
    target: 15,
    unit: 'min',
    keywords: ['langue', 'anglais', 'espagnol', 'duolingo', 'vocabulaire', 'allemand', 'italien', 'japonais'],
    benefits: [
      'Stimule le cerveau et la mémoire',
      'Ouvre de nouvelles opportunités professionnelles',
      'Facilite les voyages et les rencontres',
      'Retarde le déclin cognitif',
    ],
  },
  {
    category: 'Esprit',
    name: "Jouer d'un instrument",
    icon: '🎸',
    color: '#ef4444',
    type: 'weekly',
    timesPerWeek: 4,
    keywords: ['instrument', 'guitare', 'piano', 'musique', 'violon', 'batterie'],
    benefits: [
      'Améliore la coordination et la motricité fine',
      'Stimule la mémoire et la créativité',
      'Procure un sentiment d\'accomplissement',
      'Réduit le stress',
    ],
  },

  // --- Productivité
  {
    category: 'Productivité',
    name: 'Se lever tôt',
    icon: '🌅',
    color: '#f97316',
    type: 'check',
    keywords: ['lever', 'reveil', 'matin', 'tot'],
    benefits: [
      'Du temps calme pour soi avant la journée',
      'Moins de précipitation et de stress le matin',
      'Plus de régularité dans le rythme de sommeil',
    ],
  },
  {
    category: 'Productivité',
    name: 'Planifier sa journée',
    icon: '🎯',
    color: '#6366f1',
    type: 'check',
    keywords: ['planif', 'organis', 'todo', 'agenda', 'priorite'],
    benefits: [
      'Clarifie les priorités',
      'Réduit la charge mentale',
      'Augmente la productivité',
      'Donne un sentiment de contrôle',
    ],
  },
  {
    category: 'Productivité',
    name: 'Travail concentré (deep work)',
    icon: '🧠',
    color: '#14b8a6',
    type: 'quantity',
    target: 2,
    unit: 'heures',
    keywords: ['deep work', 'concentr', 'focus', 'travail', 'pomodoro', 'etud', 'reviser'],
    benefits: [
      'Produit un travail de meilleure qualité',
      'Avance plus vite sur les projets importants',
      'Renforce la capacité de concentration',
      'Procure un sentiment de satisfaction',
    ],
  },
  {
    category: 'Productivité',
    name: 'Ranger 10 minutes',
    icon: '🧹',
    color: '#64748b',
    type: 'check',
    keywords: ['ranger', 'menage', 'nettoy', 'rangement'],
    benefits: ['Un intérieur plus apaisant', 'Moins de temps perdu à chercher', 'Réduit le stress visuel'],
  },
  {
    category: 'Productivité',
    name: 'Noter ses dépenses',
    icon: '💰',
    color: '#22c55e',
    type: 'check',
    keywords: ['depense', 'budget', 'argent', 'econom', 'finance'],
    benefits: ['Meilleure maîtrise de son budget', 'Repère les dépenses inutiles', 'Aide à épargner'],
  },

  // --- Social
  {
    category: 'Social',
    name: 'Appeler un proche',
    icon: '📞',
    color: '#ec4899',
    type: 'weekly',
    timesPerWeek: 2,
    keywords: ['appeler', 'proche', 'famille', 'ami', 'parent', 'telephon'],
    benefits: [
      'Renforce les liens affectifs',
      'Réduit le sentiment de solitude',
      'Améliore le bien-être émotionnel',
    ],
  },
  {
    category: 'Social',
    name: 'Faire une bonne action',
    icon: '❤️',
    color: '#ef4444',
    type: 'check',
    keywords: ['bonne action', 'aider', 'gentil', 'benevol'],
    benefits: ['Procure un sentiment de bien-être', 'Renforce les liens sociaux', 'Donne du sens'],
  },

  // --- À arrêter
  {
    category: 'À arrêter',
    name: 'Arrêter de fumer',
    icon: '🚭',
    color: '#64748b',
    type: 'quit',
    keywords: ['fumer', 'cigarette', 'tabac', 'clope', 'vapot'],
    benefits: [
      'Le cœur et la tension se normalisent en quelques heures',
      "Le goût et l'odorat reviennent en quelques jours",
      'Le souffle s\'améliore en quelques semaines',
      'Fait économiser beaucoup d\'argent',
      'Réduit fortement le risque de cancers et de maladies cardiaques',
    ],
  },
  {
    category: 'À arrêter',
    name: "Pas d'alcool",
    icon: '🍷',
    color: '#a16207',
    type: 'quit',
    keywords: ['alcool', 'boire', 'biere', 'vin'],
    benefits: [
      'Meilleur sommeil et plus d\'énergie',
      'Protège le foie',
      'Améliore la clarté mentale',
      'Aide à perdre du poids',
      'Fait économiser de l\'argent',
    ],
  },
  {
    category: 'À arrêter',
    name: 'Pas de sucre ajouté',
    icon: '🍬',
    color: '#ec4899',
    type: 'quit',
    keywords: ['sucre', 'bonbon', 'gateau', 'soda', 'sucrerie'],
    benefits: [
      "Énergie plus stable (moins de coups de fatigue)",
      'Réduit les envies de grignotage',
      'Protège les dents',
      'Réduit le risque de diabète',
    ],
  },
  {
    category: 'À arrêter',
    name: 'Pas de réseaux sociaux',
    icon: '📵',
    color: '#3b82f6',
    type: 'quit',
    keywords: ['reseau', 'social', 'instagram', 'tiktok', 'facebook', 'twitter', 'scroll'],
    benefits: [
      'Libère du temps pour ce qui compte',
      'Réduit la comparaison sociale et l\'anxiété',
      'Améliore la concentration',
      'Meilleur sommeil',
    ],
  },
  {
    category: 'À arrêter',
    name: "Pas d'écran avant de dormir",
    icon: '📱',
    color: '#8b5cf6',
    type: 'check',
    keywords: ['ecran', 'telephone', 'portable', 'lumiere bleue'],
    benefits: [
      "Endormissement plus rapide (moins de lumière bleue)",
      'Sommeil plus réparateur',
      'Moins de stimulation mentale le soir',
    ],
  },
  {
    category: 'À arrêter',
    name: 'Pas de grignotage',
    icon: '🍪',
    color: '#f97316',
    type: 'quit',
    keywords: ['grignot', 'snack', 'fast food', 'junk'],
    benefits: ['Meilleure gestion du poids', 'Digestion plus légère', 'Meilleure écoute de la faim'],
  },
];

export const CATEGORIES = [...new Set(TEMPLATES.map((t) => t.category))];

export function normalize(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

/** Trouve le modèle le plus proche d'un nom d'habitude. */
export function findTemplate(name) {
  const n = normalize(name);
  if (n.length < 3) return null;
  let best = null;
  let bestScore = 0;
  for (const t of TEMPLATES) {
    let score = 0;
    if (normalize(t.name) === n) score += 100;
    for (const kw of t.keywords) if (n.includes(normalize(kw))) score += normalize(kw).length;
    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  }
  return best;
}

/** Bienfaits suggérés pour un nom d'habitude. */
export function suggestBenefits(name) {
  const t = findTemplate(name);
  return t ? t.benefits.slice() : [];
}
