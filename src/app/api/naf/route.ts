import { NextRequest, NextResponse } from "next/server";

// Built-in mapping of common NAF codes to labels (French trades and professions)
const NAF_CODES: Record<string, string> = {
  // Construction et bâtiment
  "4120A": "Travaux de génie civil",
  "4120B": "Travaux de construction de routes et autoroutes",
  "4120C": "Travaux de construction d'aéroports, de routes, de voies ferrées, de ports et installations fluviales",
  "4210A": "Construction de maisons individuelles",
  "4210B": "Construction d'immeubles collectifs et autres bâtiments",
  "4220": "Construction de routes et voies",
  "4290": "Autres travaux de construction spécialisés non classés ailleurs",
  "4311Z": "Travaux de démolition",
  "4312A": "Travaux de préparation de chantier",
  "4312B": "Travaux de préparation de sites naturels avant exploitation",
  "4313Z": "Travaux de terrassement",
  "4321A": "Travaux d'installation d'eau et de gaz dans tous bâtiments",
  "4321B": "Travaux d'installation d'équipements thermiques et de climatisation",
  "4322A": "Travaux d'installation d'équipements électriques",
  "4322B": "Travaux d'installation de télécommunications",
  "4329A": "Travaux d'isolation",
  "4329B": "Autres travaux d'installation spécialisés",
  "4331Z": "Travaux de plâtrerie",
  "4332A": "Travaux de menuiserie bois et PVC",
  "4332B": "Travaux de menuiserie métallique et serrurerie",
  "4333Z": "Travaux de revêtement des sols et des murs",
  "4334Z": "Travaux de peinture et vitrerie",
  "4339Z": "Autres travaux de finition",
  "4399C": "Autres travaux spécialisés divers",

  // Plomberie
  "4321A": "Travaux d'installation d'eau et de gaz",
  "4399D": "Travaux de plomberie",

  // Électricité
  "4322A": "Travaux d'installation d'équipements électriques",
  "4399E": "Travaux électriques",

  // Chauffage et climatisation
  "4321B": "Travaux d'installation d'équipements thermiques",
  "4399F": "Travaux de chauffage et climatisation",

  // Décoration et peinture
  "4334Z": "Travaux de peinture et vitrerie",
  "4399G": "Travaux de décoration intérieure",

  // Services à la personne
  "8510A": "Enseignement préprimaire",
  "8520Z": "Enseignement primaire",
  "8530A": "Enseignement secondaire général",
  "8530B": "Enseignement secondaire technique ou professionnel",
  "8610A": "Activités hospitalières",
  "8620A": "Pratique dentaire",
  "8690A": "Activités des infirmiers et sages-femmes",
  "8690B": "Autres activités paramédicales",
  "8690C": "Activités de santé humaine non classées ailleurs",
  "8710A": "Hébergement collectif et autres hébergements non touristiques",
  "9601A": "Blanchisserie-teinturerie de détail",
  "9601B": "Blanchisserie-teinturerie de gros",
  "9602A": "Entretien et réparation de vêtements et accessoires",
  "9603Z": "Pressing",
  "9604Z": "Désinfection et dératisation",
  "9619Z": "Autres services personnels non classés ailleurs",

  // Nettoyage et maintenance
  "8121Z": "Nettoyage courant des bâtiments",
  "8122Z": "Autres activités de nettoyage des bâtiments",
  "8129A": "Désinfection, dératisation et services similaires",
  "8129B": "Autres services de nettoyage",
  "8211Z": "Activités administratives et autres activités de soutien aux entreprises n.c.a.",

  // Réparation et entretien
  "9511Z": "Réparation d'ordinateurs et de périphériques",
  "9512Z": "Réparation d'équipements de communication",
  "9521Z": "Réparation et entretien d'articles de sport",
  "9522Z": "Réparation et entretien de jeux et jouets",
  "9523Z": "Réparation et entretien d'articles personnels et domestiques",
  "9524Z": "Entretien et réparation d'autres articles",

  // Artisanat
  "3211Z": "Fabrication de bijoux fantaisie et articles similaires",
  "3220Z": "Fabrication d'articles de joaillerie et de bijouterie",
  "3230Z": "Fabrication d'articles de monnaie",
  "3319Z": "Autres activités de transformation n.c.a.",
  "4390Z": "Autres activités spécialisées de construction",

  // Conseil et expertise
  "6202A": "Conseil en systèmes et logiciels informatiques",
  "6202B": "Tierce maintenance de systèmes et d'applications informatiques",
  "6203Z": "Gestion d'installations informatiques",
  "6209Z": "Autres activités de services informatiques",
  "6910A": "Activités juridiques",
  "6920A": "Activités comptables",
  "7010Z": "Activités des sièges sociaux",
  "7020Z": "Conseil en relations publiques et communication",
  "7021Z": "Conseil en stratégie et pilotage",
  "7022Z": "Conseil pour les affaires et autres conseils de gestion",
  "7111Z": "Activités d'architecture",
  "7112A": "Ingénierie, études techniques et conseil en ingénierie",
  "7112B": "Analyses, essais et inspections techniques",
  "7490A": "Autres activités spécialisées, scientifiques et techniques diverses",
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");

    if (!code || code.trim().length === 0) {
      return NextResponse.json(
        { error: "Paramètre 'code' requis" },
        { status: 400 }
      );
    }

    const normalizedCode = code.trim().toUpperCase();

    // First, check the built-in mapping
    if (normalizedCode in NAF_CODES) {
      return NextResponse.json({
        code: normalizedCode,
        label: NAF_CODES[normalizedCode],
        source: "local",
      });
    }

    // If not found locally, try fetching from the API
    try {
      const url = new URL("https://recherche-entreprises.api.gouv.fr/search");
      url.searchParams.append("q", normalizedCode);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();

        // Try to extract activity label from the API response
        if (data.results && data.results.length > 0) {
          const result = data.results[0];
          const label = result.activite_principale_libelle || "Activité inconnue";

          return NextResponse.json({
            code: normalizedCode,
            label: label,
            source: "api",
          });
        }
      }
    } catch (apiError) {
      console.error("NAF API fetch error:", apiError);
      // Continue to error response
    }

    // Code not found anywhere
    return NextResponse.json(
      { error: "Code NAF non trouvé", code: normalizedCode },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("NAF lookup error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
