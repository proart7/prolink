/**
 * API SIRENE - Recherche d'entreprise par numéro SIREN/SIRET
 * Documentation: https://api.insee.fr/catalogue/site/themes/wso2/subthemes/developer/pages/item-info.jag?name=Sirene&version=V3&provider=insee
 */

export interface SireneCompany {
  siren: string;
  siret: string;
  companyName: string;
  legalForm: string;
  activityCode: string;
  activityLabel: string;
  address: string;
  city: string;
  postalCode: string;
  status: "active" | "radiee";
  registrationDate: string;
}

export interface SireneError {
  error: true;
  message: string;
  code: string;
}

export type SireneResult = SireneCompany | SireneError;

/**
 * Recherche une entreprise via l'API SIRENE de l'INSEE
 * Utilise le SIREN (9 chiffres) ou SIRET (14 chiffres)
 */
export async function searchSirene(sirenOrSiret: string): Promise<SireneResult> {
  const cleaned = sirenOrSiret.replace(/\s/g, "");

  // Validation du format
  if (!/^\d{9}$/.test(cleaned) && !/^\d{14}$/.test(cleaned)) {
    return {
      error: true,
      message: "Le numéro doit contenir 9 chiffres (SIREN) ou 14 chiffres (SIRET)",
      code: "INVALID_FORMAT",
    };
  }

  const token = process.env.SIRENE_API_TOKEN;

  // Si pas de token INSEE, on utilise l'API publique entreprise.data.gouv.fr
  if (!token) {
    return searchSirenePublic(cleaned);
  }

  const isSiret = cleaned.length === 14;
  const endpoint = isSiret
    ? `https://api.insee.fr/entreprises/sirene/V3.11/siret/${cleaned}`
    : `https://api.insee.fr/entreprises/sirene/V3.11/siren/${cleaned}`;

  try {
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          error: true,
          message: "Aucune entreprise trouvée avec ce numéro",
          code: "NOT_FOUND",
        };
      }
      return {
        error: true,
        message: "Erreur lors de la recherche. Veuillez réessayer.",
        code: "API_ERROR",
      };
    }

    const data = await response.json();
    return parseInseeResponse(data, isSiret);
  } catch {
    return {
      error: true,
      message: "Impossible de contacter le service. Veuillez réessayer.",
      code: "NETWORK_ERROR",
    };
  }
}

/**
 * Fallback: API publique entreprise.data.gouv.fr (pas besoin de token)
 */
async function searchSirenePublic(sirenOrSiret: string): Promise<SireneResult> {
  const isSiret = sirenOrSiret.length === 14;
  const siren = sirenOrSiret.slice(0, 9);

  try {
    const response = await fetch(
      `https://entreprise.data.gouv.fr/api/sirene/v3/unites_legales/${siren}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        return {
          error: true,
          message: "Aucune entreprise trouvée avec ce numéro",
          code: "NOT_FOUND",
        };
      }
      return {
        error: true,
        message: "Erreur lors de la recherche",
        code: "API_ERROR",
      };
    }

    const data = await response.json();
    const unite = data.unite_legale;

    if (!unite) {
      return { error: true, message: "Données introuvables", code: "NO_DATA" };
    }

    // Vérifier si l'entreprise est radiée
    const isRadiee = unite.etat_administratif === "C"; // C = cessée

    // Récupérer la dénomination
    const name =
      unite.denomination ||
      unite.nom_raison_sociale ||
      `${unite.prenom_1 || ""} ${unite.nom || ""}`.trim();

    // Dernière période pour l'activité
    const periode = unite.periodesUniteLegale?.[0];
    const activityCode = periode?.activitePrincipaleUniteLegale || "";

    return {
      siren: siren,
      siret: isSiret ? sirenOrSiret : `${siren}00000`,
      companyName: name,
      legalForm: unite.categorie_juridique || "",
      activityCode: activityCode,
      activityLabel: periode?.nomenclatureActivitePrincipaleUniteLegale || "",
      address: "",
      city: "",
      postalCode: "",
      status: isRadiee ? "radiee" : "active",
      registrationDate: unite.date_creation || "",
    };
  } catch {
    return {
      error: true,
      message: "Impossible de contacter le service",
      code: "NETWORK_ERROR",
    };
  }
}

function parseInseeResponse(data: any, isSiret: boolean): SireneResult {
  try {
    if (isSiret) {
      const etab = data.etablissement;
      const unite = etab.uniteLegale;
      const adresse = etab.adresseEtablissement;
      const isRadiee = unite.etatAdministratifUniteLegale === "C";

      return {
        siren: unite.siren,
        siret: etab.siret,
        companyName:
          unite.denominationUniteLegale ||
          `${unite.prenom1UniteLegale || ""} ${unite.nomUniteLegale || ""}`.trim(),
        legalForm: unite.categorieJuridiqueUniteLegale || "",
        activityCode: etab.periodesEtablissement?.[0]?.activitePrincipaleEtablissement || "",
        activityLabel: "",
        address: `${adresse.numeroVoieEtablissement || ""} ${adresse.typeVoieEtablissement || ""} ${adresse.libelleVoieEtablissement || ""}`.trim(),
        city: adresse.libelleCommuneEtablissement || "",
        postalCode: adresse.codePostalEtablissement || "",
        status: isRadiee ? "radiee" : "active",
        registrationDate: unite.dateCreationUniteLegale || "",
      };
    } else {
      const unite = data.uniteLegale;
      const isRadiee = unite.etatAdministratifUniteLegale === "C";
      const periode = unite.periodesUniteLegale?.[0];

      return {
        siren: unite.siren,
        siret: "",
        companyName:
          unite.denominationUniteLegale ||
          `${unite.prenom1UniteLegale || ""} ${unite.nomUniteLegale || ""}`.trim(),
        legalForm: unite.categorieJuridiqueUniteLegale || "",
        activityCode: periode?.activitePrincipaleUniteLegale || "",
        activityLabel: "",
        address: "",
        city: "",
        postalCode: "",
        status: isRadiee ? "radiee" : "active",
        registrationDate: unite.dateCreationUniteLegale || "",
      };
    }
  } catch {
    return {
      error: true,
      message: "Erreur lors du traitement des données",
      code: "PARSE_ERROR",
    };
  }
}
