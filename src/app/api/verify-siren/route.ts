import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/verify-siren
 * Vérifie un numéro SIREN via l'API publique recherche-entreprises.api.gouv.fr
 * (gratuite, sans token, remplace l'ancien entreprise.data.gouv.fr)
 */
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

    // Validation du format SIREN (9 chiffres) ou SIRET (14 chiffres)
    if (!/^\d{9}$/.test(cleaned) && !/^\d{14}$/.test(cleaned)) {
      return NextResponse.json(
        { message: 'Le numéro doit contenir 9 chiffres (SIREN) ou 14 chiffres (SIRET)' },
        { status: 400 }
      );
    }

    // Utiliser l'API recherche-entreprises.api.gouv.fr (nouvelle API publique officielle)
    const sirenNumber = cleaned.slice(0, 9);
    const apiUrl = `https://recherche-entreprises.api.gouv.fr/search?q=${sirenNumber}&mtm_campaign=transaxur`;

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`API recherche-entreprises error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { message: 'Erreur lors de la communication avec le service de vérification' },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return NextResponse.json(
        { message: 'Aucune entreprise trouvée avec ce numéro SIREN' },
        { status: 404 }
      );
    }

    // Trouver l'entreprise exacte par SIREN
    const entreprise = data.results.find(
      (r: any) => r.siren === sirenNumber
    );

    if (!entreprise) {
      return NextResponse.json(
        { message: 'Aucune entreprise trouvée avec ce numéro SIREN' },
        { status: 404 }
      );
    }

    // Vérifier si l'entreprise est active
    if (entreprise.etat_administratif === 'C') {
      return NextResponse.json(
        { message: 'Cette entreprise est cessée (radiée). Inscription impossible.' },
        { status: 400 }
      );
    }

    // Extraire les informations du siège social
    const siege = entreprise.siege || {};
    const activityCode = entreprise.activite_principale || siege.activite_principale || '';

    // Construire l'adresse
    const addressParts = [
      siege.numero_voie,
      siege.type_voie,
      siege.libelle_voie,
    ].filter(Boolean);
    const address = addressParts.join(' ');

    const fullAddress = [
      address,
      siege.code_postal,
      siege.libelle_commune,
    ].filter(Boolean).join(', ');

    // Trouver le label NAF
    const activityLabel = entreprise.activite_principale_label ||
      siege.activite_principale_label || '';

    return NextResponse.json({
      siren: entreprise.siren,
      companyName: entreprise.nom_complet || entreprise.nom_raison_sociale || '',
      address: fullAddress,
      city: siege.libelle_commune || '',
      postalCode: siege.code_postal || '',
      activityCode: activityCode,
      activityLabel: activityLabel,
      legalForm: entreprise.nature_juridique || '',
      status: entreprise.etat_administratif === 'A' ? 'active' : 'inactive',
      registrationDate: entreprise.date_creation || '',
    });
  } catch (error) {
    console.error('Verify SIREN error:', error);
    return NextResponse.json(
      { message: 'Erreur serveur lors de la vérification du SIREN' },
      { status: 500 }
    );
  }
}
