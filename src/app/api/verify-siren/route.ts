import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/verify-siren
 * Vérifie un numéro SIREN via plusieurs APIs publiques avec fallback
 */

interface CompanyData {
  siren: string;
  companyName: string;
  address: string;
  city: string;
  postalCode: string;
  activityCode: string;
  activityLabel: string;
  legalForm: string;
  status: string;
  registrationDate: string;
}

// Helper: wait ms
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Méthode 1: API recherche-entreprises.api.gouv.fr (officielle, gratuite)
 */
async function fetchFromRechercheEntreprises(sirenNumber: string): Promise<CompanyData | null> {
  const apiUrl = `https://recherche-entreprises.api.gouv.fr/search?q=${sirenNumber}&page=1&per_page=5`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Transaxur/1.0 (https://transaxur.fr)',
        },
      });

      if (response.status === 429) {
        console.log(`recherche-entreprises 429, attempt ${attempt + 1}/3, retrying...`);
        await sleep(1000 * (attempt + 1));
        continue;
      }

      if (!response.ok) {
        console.error(`recherche-entreprises error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      if (!data.results || data.results.length === 0) return null;

      const entreprise = data.results.find((r: any) => r.siren === sirenNumber);
      if (!entreprise) return null;

      const siege = entreprise.siege || {};
      const addressParts = [siege.numero_voie, siege.type_voie, siege.libelle_voie].filter(Boolean);
      const address = addressParts.join(' ');
      const fullAddress = [address, siege.code_postal, siege.libelle_commune].filter(Boolean).join(', ');

      return {
        siren: entreprise.siren,
        companyName: entreprise.nom_complet || entreprise.nom_raison_sociale || '',
        address: fullAddress,
        city: siege.libelle_commune || '',
        postalCode: siege.code_postal || '',
        activityCode: entreprise.activite_principale || siege.activite_principale || '',
        activityLabel: entreprise.activite_principale_label || '',
        legalForm: entreprise.nature_juridique || '',
        status: entreprise.etat_administratif === 'A' ? 'active' : entreprise.etat_administratif === 'C' ? 'cessee' : 'inactive',
        registrationDate: entreprise.date_creation || '',
      };
    } catch (error) {
      console.error(`recherche-entreprises fetch error (attempt ${attempt + 1}):`, error);
      if (attempt < 2) await sleep(1000);
    }
  }
  return null;
}

/**
 * Méthode 2: API OpenDataSoft SIRENE (fallback, pas de rate limit strict)
 */
async function fetchFromOpenDataSoft(sirenNumber: string): Promise<CompanyData | null> {
  try {
    const apiUrl = `https://data.opendatasoft.com/api/explore/v2.1/catalog/datasets/economicref-france-sirene-v3@public/records?where=siren%3D%22${sirenNumber}%22&limit=1`;

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Transaxur/1.0 (https://transaxur.fr)',
      },
    });

    if (!response.ok) {
      console.error(`OpenDataSoft error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (!data.results || data.results.length === 0) return null;

    const record = data.results[0];

    const addressParts = [
      record.numerovoieetablissement,
      record.typevoieetablissement,
      record.libellevoieetablissement,
    ].filter(Boolean);

    const fullAddress = [
      addressParts.join(' '),
      record.codepostaletablissement,
      record.libellecommuneetablissement,
    ].filter(Boolean).join(', ');

    return {
      siren: record.siren || sirenNumber,
      companyName: record.denominationunitelegale || record.l1_normalisee ||
        `${record.prenomsetablissement || ''} ${record.nomunitelegale || ''}`.trim() || '',
      address: fullAddress,
      city: record.libellecommuneetablissement || '',
      postalCode: record.codepostaletablissement || '',
      activityCode: record.activiteprincipaleetablissement || record.activiteprincipaleunitelegale || '',
      activityLabel: record.nomenclatureactiviteprincipaleetablissement || '',
      legalForm: record.categoriejuridiqueunitelegale || '',
      status: record.etatadministratifunitelegale === 'A' ? 'active' : record.etatadministratifunitelegale === 'C' ? 'cessee' : 'inactive',
      registrationDate: record.datecreationunitelegale || '',
    };
  } catch (error) {
    console.error('OpenDataSoft fetch error:', error);
    return null;
  }
}

/**
 * Méthode 3: API Pappers (fallback ultime, gratuit pour recherche basique)
 */
async function fetchFromPappers(sirenNumber: string): Promise<CompanyData | null> {
  try {
    const apiUrl = `https://suggestions.pappers.fr/v2?q=${sirenNumber}&cibles=siren`;

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Transaxur/1.0 (https://transaxur.fr)',
      },
    });

    if (!response.ok) {
      console.error(`Pappers error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (!data.resultats_siren || data.resultats_siren.length === 0) return null;

    const entreprise = data.resultats_siren.find((r: any) => r.siren === sirenNumber);
    if (!entreprise) return null;

    const fullAddress = [
      entreprise.siege?.adresse_ligne_1,
      entreprise.siege?.code_postal,
      entreprise.siege?.ville,
    ].filter(Boolean).join(', ');

    return {
      siren: entreprise.siren || sirenNumber,
      companyName: entreprise.nom_entreprise || entreprise.denomination || '',
      address: fullAddress,
      city: entreprise.siege?.ville || '',
      postalCode: entreprise.siege?.code_postal || '',
      activityCode: entreprise.code_naf || '',
      activityLabel: entreprise.libelle_code_naf || '',
      legalForm: entreprise.forme_juridique || '',
      status: 'active',
      registrationDate: '',
    };
  } catch (error) {
    console.error('Pappers fetch error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siren } = body;

    if (!siren || typeof siren !== 'string') {
      return NextResponse.json(
        { message: 'Numéro SIREN requis' },
        { status: 400 }
      );
    }

    const cleaned = siren.replace(/\s/g, '');

    if (!/^\d{9}$/.test(cleaned) && !/^\d{14}$/.test(cleaned)) {
      return NextResponse.json(
        { message: 'Le numéro doit contenir 9 chiffres (SIREN) ou 14 chiffres (SIRET)' },
        { status: 400 }
      );
    }

    const sirenNumber = cleaned.slice(0, 9);

    // Essayer les APIs dans l'ordre avec fallback
    console.log(`Verifying SIREN: ${sirenNumber}`);

    // Méthode 1: recherche-entreprises.api.gouv.fr
    let result = await fetchFromRechercheEntreprises(sirenNumber);

    // Méthode 2: OpenDataSoft SIRENE
    if (!result) {
      console.log('Fallback to OpenDataSoft...');
      result = await fetchFromOpenDataSoft(sirenNumber);
    }

    // Méthode 3: Pappers suggestions
    if (!result) {
      console.log('Fallback to Pappers...');
      result = await fetchFromPappers(sirenNumber);
    }

    if (!result) {
      return NextResponse.json(
        { message: 'Aucune entreprise trouvée avec ce numéro SIREN. Vérifiez le numéro et réessayez.' },
        { status: 404 }
      );
    }

    // Vérifier si l'entreprise est cessée
    if (result.status === 'cessee') {
      return NextResponse.json(
        { message: 'Cette entreprise est cessée (radiée). Inscription impossible.' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Verify SIREN error:', error);
    return NextResponse.json(
      { message: 'Erreur serveur lors de la vérification du SIREN' },
      { status: 500 }
    );
  }
}
