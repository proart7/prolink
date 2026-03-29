// Profils de démonstration - À retirer une fois que la plateforme a suffisamment de vrais professionnels
// Flag isDemo: true permet de les identifier et les filtrer facilement

export interface DemoProfessional {
  id: string;
  companyName: string;
  description: string;
  specialties: string[];
  city: string;
  postalCode: string;
  averageRating: number;
  totalReviews: number;
  insuranceStatus: string;
  activityLabel: string;
  serviceArea: string;
  isDemo: boolean;
  avatarColor: string;
  avatarInitials: string;
  user: {
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  categories: { category: { name: string; slug: string } }[];
}

export const demoProfiles: DemoProfessional[] = [
  {
    id: "demo-1",
    companyName: "Durand Plomberie",
    description: "Plombier chauffagiste depuis 15 ans. Intervention rapide pour dépannage, installation et rénovation de salle de bain. Devis gratuit sous 24h.",
    specialties: ["Plomberie", "Chauffage", "Salle de bain"],
    city: "Paris",
    postalCode: "75011",
    averageRating: 4.8,
    totalReviews: 47,
    insuranceStatus: "VERIFIEE",
    activityLabel: "Travaux de plomberie et de chauffage",
    serviceArea: "Paris et petite couronne",
    isDemo: true,
    avatarColor: "#3B82F6",
    avatarInitials: "PD",
    user: { firstName: "Philippe", lastName: "Durand", avatar: null },
    categories: [{ category: { name: "Plomberie", slug: "plomberie" } }],
  },
  {
    id: "demo-2",
    companyName: "Elec Solutions Martin",
    description: "Électricien certifié Qualifelec. Mise aux normes, tableaux électriques, domotique et bornes de recharge véhicules électriques.",
    specialties: ["Électricité", "Domotique", "Bornes de recharge"],
    city: "Lyon",
    postalCode: "69003",
    averageRating: 4.9,
    totalReviews: 63,
    insuranceStatus: "VERIFIEE",
    activityLabel: "Travaux d'installation électrique",
    serviceArea: "Lyon et agglomération",
    isDemo: true,
    avatarColor: "#F59E0B",
    avatarInitials: "SM",
    user: { firstName: "Sébastien", lastName: "Martin", avatar: null },
    categories: [{ category: { name: "Électricité", slug: "electricite" } }],
  },
  {
    id: "demo-3",
    companyName: "Maçonnerie Belmonte",
    description: "Entreprise de maçonnerie générale et gros œuvre. Construction, extension, rénovation. Travail soigné et respect des délais.",
    specialties: ["Maçonnerie", "Gros œuvre", "Extension"],
    city: "Marseille",
    postalCode: "13008",
    averageRating: 4.6,
    totalReviews: 31,
    insuranceStatus: "VERIFIEE",
    activityLabel: "Travaux de maçonnerie générale",
    serviceArea: "Marseille et Bouches-du-Rhône",
    isDemo: true,
    avatarColor: "#EF4444",
    avatarInitials: "AB",
    user: { firstName: "Antonio", lastName: "Belmonte", avatar: null },
    categories: [{ category: { name: "Maçonnerie", slug: "maconnerie" } }],
  },
  {
    id: "demo-4",
    companyName: "Peinture & Déco Lefèvre",
    description: "Peintre décorateur professionnel. Peinture intérieure et extérieure, ravalement de façade, pose de papier peint et enduits décoratifs.",
    specialties: ["Peinture", "Décoration", "Ravalement"],
    city: "Bordeaux",
    postalCode: "33000",
    averageRating: 4.7,
    totalReviews: 52,
    insuranceStatus: "VERIFIEE",
    activityLabel: "Travaux de peinture",
    serviceArea: "Bordeaux Métropole",
    isDemo: true,
    avatarColor: "#8B5CF6",
    avatarInitials: "JL",
    user: { firstName: "Julie", lastName: "Lefèvre", avatar: null },
    categories: [{ category: { name: "Peinture", slug: "peinture" } }],
  },
  {
    id: "demo-5",
    companyName: "Serrurier Express Nantes",
    description: "Serrurier disponible 7j/7. Ouverture de porte, changement de serrure, blindage de porte, installation de systèmes de sécurité.",
    specialties: ["Serrurerie", "Blindage", "Sécurité"],
    city: "Nantes",
    postalCode: "44000",
    averageRating: 4.5,
    totalReviews: 38,
    insuranceStatus: "VERIFIEE",
    activityLabel: "Travaux de serrurerie",
    serviceArea: "Nantes et Loire-Atlantique",
    isDemo: true,
    avatarColor: "#06B6D4",
    avatarInitials: "KA",
    user: { firstName: "Karim", lastName: "Amrani", avatar: null },
    categories: [{ category: { name: "Serrurerie", slug: "serrurerie" } }],
  },
  {
    id: "demo-6",
    companyName: "Cabinet Moreau Avocats",
    description: "Avocat en droit des affaires et droit immobilier. Conseil juridique, rédaction de contrats, contentieux commercial. 12 ans d'expérience.",
    specialties: ["Droit des affaires", "Droit immobilier", "Contrats"],
    city: "Paris",
    postalCode: "75008",
    averageRating: 4.9,
    totalReviews: 28,
    insuranceStatus: "VERIFIEE",
    activityLabel: "Activités juridiques",
    serviceArea: "Île-de-France",
    isDemo: true,
    avatarColor: "#1E40AF",
    avatarInitials: "CM",
    user: { firstName: "Claire", lastName: "Moreau", avatar: null },
    categories: [{ category: { name: "Avocat", slug: "avocat" } }],
  },
  {
    id: "demo-7",
    companyName: "Carrelage Pro Roux",
    description: "Carreleur faïencier qualifié. Pose de carrelage sol et mur, mosaïque, terrasse extérieure. Finitions impeccables garanties.",
    specialties: ["Carrelage", "Faïence", "Mosaïque"],
    city: "Toulouse",
    postalCode: "31000",
    averageRating: 4.7,
    totalReviews: 41,
    insuranceStatus: "VERIFIEE",
    activityLabel: "Travaux de revêtement des sols et des murs",
    serviceArea: "Toulouse et Haute-Garonne",
    isDemo: true,
    avatarColor: "#059669",
    avatarInitials: "MR",
    user: { firstName: "Marc", lastName: "Roux", avatar: null },
    categories: [{ category: { name: "Carrelage", slug: "carrelage" } }],
  },
  {
    id: "demo-8",
    companyName: "Toiture Bernard & Fils",
    description: "Couvreur zingueur de père en fils depuis 1985. Réfection de toiture, charpente, zinguerie, isolation de combles et traitement hydrofuge.",
    specialties: ["Couverture", "Zinguerie", "Charpente"],
    city: "Lille",
    postalCode: "59000",
    averageRating: 4.8,
    totalReviews: 56,
    insuranceStatus: "VERIFIEE",
    activityLabel: "Travaux de couverture",
    serviceArea: "Métropole lilloise et Nord",
    isDemo: true,
    avatarColor: "#DC2626",
    avatarInitials: "TB",
    user: { firstName: "Thomas", lastName: "Bernard", avatar: null },
    categories: [{ category: { name: "Couverture", slug: "couverture" } }],
  },
  {
    id: "demo-9",
    companyName: "Compta Plus Dubois",
    description: "Expert-comptable inscrit à l'Ordre. Comptabilité, fiscalité, création d'entreprise, bilan annuel. Accompagnement personnalisé TPE/PME.",
    specialties: ["Comptabilité", "Fiscalité", "Création entreprise"],
    city: "Strasbourg",
    postalCode: "67000",
    averageRating: 4.6,
    totalReviews: 22,
    insuranceStatus: "VERIFIEE",
    activityLabel: "Activités comptables",
    serviceArea: "Strasbourg et Bas-Rhin",
    isDemo: true,
    avatarColor: "#7C3AED",
    avatarInitials: "ND",
    user: { firstName: "Nicolas", lastName: "Dubois", avatar: null },
    categories: [{ category: { name: "Comptabilité", slug: "comptabilite" } }],
  },
  {
    id: "demo-10",
    companyName: "Menuiserie Créative Laurent",
    description: "Menuisier ébéniste spécialisé dans le sur-mesure. Cuisines, placards, escaliers, meubles de salle de bain. Bois massif et matériaux nobles.",
    specialties: ["Menuiserie", "Cuisines", "Sur-mesure"],
    city: "Nice",
    postalCode: "06000",
    averageRating: 4.9,
    totalReviews: 34,
    insuranceStatus: "VERIFIEE",
    activityLabel: "Travaux de menuiserie",
    serviceArea: "Nice et Côte d'Azur",
    isDemo: true,
    avatarColor: "#B45309",
    avatarInitials: "FL",
    user: { firstName: "Frédéric", lastName: "Laurent", avatar: null },
    categories: [{ category: { name: "Menuiserie", slug: "menuiserie" } }],
  },
  {
    id: "demo-11",
    companyName: "Atelier d'Architecture Petit",
    description: "Architecte DPLG. Conception de maisons individuelles, rénovation d'appartements, extensions. Plans 3D et suivi de chantier inclus.",
    specialties: ["Architecture", "Rénovation", "Plans 3D"],
    city: "Montpellier",
    postalCode: "34000",
    averageRating: 4.8,
    totalReviews: 19,
    insuranceStatus: "VERIFIEE",
    activityLabel: "Activités d'architecture",
    serviceArea: "Montpellier et Hérault",
    isDemo: true,
    avatarColor: "#0891B2",
    avatarInitials: "SP",
    user: { firstName: "Sophie", lastName: "Petit", avatar: null },
    categories: [{ category: { name: "Architecture", slug: "architecture" } }],
  },
  {
    id: "demo-12",
    companyName: "Diag Immo Girard",
    description: "Diagnostiqueur immobilier certifié. DPE, amiante, plomb, électricité, gaz, termites. Rapports sous 48h pour vente ou location.",
    specialties: ["DPE", "Amiante", "Diagnostics immobiliers"],
    city: "Rennes",
    postalCode: "35000",
    averageRating: 4.5,
    totalReviews: 67,
    insuranceStatus: "VERIFIEE",
    activityLabel: "Activités de contrôle et analyses techniques",
    serviceArea: "Rennes et Ille-et-Vilaine",
    isDemo: true,
    avatarColor: "#65A30D",
    avatarInitials: "LG",
    user: { firstName: "Laurent", lastName: "Girard", avatar: null },
    categories: [{ category: { name: "Diagnostic immobilier", slug: "diagnostic-immobilier" } }],
  },
  {
    id: "demo-13",
    companyName: "Clim & Chauffage Mercier",
    description: "Installateur de climatisation et pompe à chaleur RGE. Installation, entretien et dépannage. Eligible aux aides MaPrimeRénov'.",
    specialties: ["Climatisation", "Pompe à chaleur", "RGE"],
    city: "Aix-en-Provence",
    postalCode: "13100",
    averageRating: 4.7,
    totalReviews: 43,
    insuranceStatus: "VERIFIEE",
    activityLabel: "Installation de climatisation",
    serviceArea: "Aix-en-Provence et alentours",
    isDemo: true,
    avatarColor: "#2563EB",
    avatarInitials: "DM",
    user: { firstName: "David", lastName: "Mercier", avatar: null },
    categories: [{ category: { name: "Climatisation", slug: "climatisation" } }],
  },
  {
    id: "demo-14",
    companyName: "Jardin & Paysage Simon",
    description: "Paysagiste créateur de jardins. Aménagement extérieur, terrasses, clôtures, arrosage automatique, entretien régulier. Projets sur-mesure.",
    specialties: ["Paysagisme", "Terrasses", "Aménagement extérieur"],
    city: "Annecy",
    postalCode: "74000",
    averageRating: 4.8,
    totalReviews: 29,
    insuranceStatus: "VERIFIEE",
    activityLabel: "Services d'aménagement paysager",
    serviceArea: "Annecy et Haute-Savoie",
    isDemo: true,
    avatarColor: "#16A34A",
    avatarInitials: "ES",
    user: { firstName: "Émilie", lastName: "Simon", avatar: null },
    categories: [{ category: { name: "Paysagisme", slug: "paysagisme" } }],
  },
  {
    id: "demo-15",
    companyName: "Rénovation Globale Faure",
    description: "Entreprise tous corps d'état. Rénovation complète d'appartements et maisons. Coordination de chantier, un seul interlocuteur pour tous vos travaux.",
    specialties: ["Rénovation", "Tous corps d'état", "Coordination"],
    city: "Grenoble",
    postalCode: "38000",
    averageRating: 4.6,
    totalReviews: 37,
    insuranceStatus: "VERIFIEE",
    activityLabel: "Travaux de rénovation",
    serviceArea: "Grenoble et Isère",
    isDemo: true,
    avatarColor: "#EA580C",
    avatarInitials: "PF",
    user: { firstName: "Pierre", lastName: "Faure", avatar: null },
    categories: [{ category: { name: "Rénovation", slug: "renovation" } }],
  },
];

// Fonction de filtrage des profils démo (simule la recherche côté serveur)
export function filterDemoProfiles(params: {
  query?: string;
  city?: string;
  minRating?: number;
  insuranceVerified?: boolean;
}): DemoProfessional[] {
  let filtered = [...demoProfiles];

  if (params.query) {
    const q = params.query.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.companyName.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.specialties.some((s) => s.toLowerCase().includes(q)) ||
        p.activityLabel.toLowerCase().includes(q) ||
        p.user.firstName.toLowerCase().includes(q) ||
        p.user.lastName.toLowerCase().includes(q) ||
        p.categories.some((c) => c.category.name.toLowerCase().includes(q))
    );
  }

  if (params.city) {
    const c = params.city.toLowerCase();
    filtered = filtered.filter((p) => p.city.toLowerCase().includes(c));
  }

  if (params.minRating && params.minRating > 0) {
    filtered = filtered.filter((p) => p.averageRating >= params.minRating!);
  }

  if (params.insuranceVerified) {
    filtered = filtered.filter((p) => p.insuranceStatus === "VERIFIEE");
  }

  return filtered;
}
