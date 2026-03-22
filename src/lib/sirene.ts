/**
 * API SIRENE - Recherche d'entreprise par num\u00e9ro SIREN/SIRET
 * Utilise l'API Recherche d'Entreprises (api.gouv.fr) en fallback
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
      message: "Le num\u00e9ro doit contenir 9 chiffres (SIREN) ou 14 chiffres (SIRET)",
      code: "INVALID_FORMAT",
    };
  }

  const token = process.env.SIRENE_API_TOKEN;

  // Si pas de token INSEE, on utilise l'API publique recherche-entreprises
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
          message: "Aucune entreprise trouv\u00e9e avec ce num\u00e9ro",
          code: "NOT_FOUND",
        };
      }
      // Fallback to public API
      return searchSirenePublic(cleaned);
    }

    const data = await response.json();
    return parseInseeResponse(data, isSiret);
  } catch {
    // Fallback to public API on network error
    return searchSirenePublic(cleaned);
  }
}

/**
 * Fallback: API Recherche d'Entreprises (recherche-entreprises.api.gouv.fr)
 * Gratuite, sans token, maintenue par la DINUM
 */
async function searchSirenePublic(sirenOrSiret: string): Promise<SireneResult> {
  const siren = sirenOrSiret.slice(0, 9);
  const isSiret = sirenOrSiret.length === 14;

  try {
    // API Recherche d'Entreprises - endpoint gratuit et officiel
    const response = await fetch(
      `https://recherche-entreprises.api.gouv.fr/search?q=${siren}&mtm_campaign=prolink`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      return {
        error: true,
        message: "Erreur lors de la recherche. Veuillez r\u00e9essayer.",
        code: "API_ERROR",
      };
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return {
        error: true,
        message: "Aucune entreprise trouv\u00e9e avec ce num\u00e9ro",
        code: "NOT_FOUND",
      };
    }

    // Trouver l'entreprise correspondant au SIREN exact
    const entreprise = data.results.find(
      (r: any) => r.siren === siren
    ) || data.results[0];

    if (!entreprise) {
      return {
        error: true,
        message: "Aucune entreprise trouv\u00e9e avec ce num\u00e9ro",
        code: "NOT_FOUND",
      };
    }

    const isRadiee = entreprise.etat_administratif === "C";

    // R\u00e9cup\u00e9rer le si\u00e8ge social pour l'adresse
    const siege = entreprise.siege || {};

    // Trouver le SIRET du si\u00e8ge
    const siretValue = isSiret
      ? sirenOrSiret
      : siege.siret || `${siren}00000`;

    return {
      siren: entreprise.siren || siren,
      siret: siretValue,
      companyName:
        entreprise.nom_complet ||
        entreprise.denomination ||
        entreprise.nom_raison_sociale ||
        "",
      legalForm: entreprise.nature_juridique || "",
      activityCode: entreprise.activite_principale || siege.activite_principale || "",
      activityLabel: entreprise.libelle_activite_principale || siege.libelle_activite_principale || "",
      address: siege.adresse || siege.geo_adresse || "",
      city: siege.libelle_commune || siege.commune || "",
      postalCode: siege.code_postal || "",
      status: isRadiee ? "radiee" : "active",
      registrationDate: entreprise.date_creation || "",
    };
  } catch {
    return {
      error: true,
      message: "Impossible de contacter le service. Veuillez r\u00e9essayer.",
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
        activityCode:
          etab.periodesEtablissement?.[0]?.activitePrincipaleEtablissement || "",
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
      message: "Erreur lors du traitement des donn\u00e9es",
      code: "PARSE_ERROR",
    };
  }
}