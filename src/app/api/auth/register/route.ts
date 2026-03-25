import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { searchSirene } from "@/lib/sirene";
import {
  registerParticulierSchema,
  registerProfessionnelSchema,
} from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body; // "particulier" ou "professionnel"

    // === INSCRIPTION PARTICULIER ===
    if (type === "particulier") {
      const validated = registerParticulierSchema.parse(body);

      // Vérifier si l'email existe déjà
      const existing = await prisma.user.findUnique({
        where: { email: validated.email },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Un compte existe déjà avec cet email" },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(validated.password, 12);

      const user = await prisma.user.create({
        data: {
          email: validated.email,
          password: hashedPassword,
          firstName: validated.firstName,
          lastName: validated.lastName,
          phone: validated.phone,
          role: "PARTICULIER",
        },
      });

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          commune: validated.commune,
        },
      });
    }

    // === INSCRIPTION PROFESSIONNEL ===
    if (type === "professionnel") {
      const validated = registerProfessionnelSchema.parse(body);

      // Vérifier si l'email existe déjà
      const existingEmail = await prisma.user.findUnique({
        where: { email: validated.email },
      });
      if (existingEmail) {
        return NextResponse.json(
          { error: "Un compte existe déjà avec cet email" },
          { status: 400 }
        );
      }

      // Vérifier le SIREN via l'API SIRENE
      const sireneResult = await searchSirene(validated.siren);

      if ("error" in sireneResult) {
        return NextResponse.json(
          { error: sireneResult.message },
          { status: 400 }
        );
      }

      // Bloquer si l'entreprise est radiée
      if (sireneResult.status === "radiee") {
        return NextResponse.json(
          {
            error:
              "Cette entreprise est radiée (cessée). L'inscription n'est pas possible avec un SIREN correspondant à une entreprise inactive.",
          },
          { status: 400 }
        );
      }

      // Vérifier si le SIREN est déjà utilisé
      const existingSiren = await prisma.professional.findUnique({
        where: { siren: sireneResult.siren },
      });
      if (existingSiren) {
        return NextResponse.json(
          { error: "Ce numéro SIREN est déjà associé à un compte" },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(validated.password, 12);

      // Extract latitude and longitude from the first commune if available
      let latitude: number | undefined;
      let longitude: number | undefined;
      let serviceAreaJson: string | undefined;

      if (validated.communes && validated.communes.length > 0) {
        const firstCommune = validated.communes[0];
        if (firstCommune.lat !== undefined) latitude = firstCommune.lat;
        if (firstCommune.lng !== undefined) longitude = firstCommune.lng;
        serviceAreaJson = JSON.stringify(validated.communes);
      }

      // Créer l'utilisateur et le profil pro en une transaction
      const user = await prisma.user.create({
        data: {
          email: validated.email,
          password: hashedPassword,
          firstName: validated.firstName,
          lastName: validated.lastName,
          phone: validated.phone,
          role: "PROFESSIONNEL",
          professional: {
            create: {
              siren: sireneResult.siren,
              siret: sireneResult.siret || undefined,
              companyName: sireneResult.companyName,
              legalForm: sireneResult.legalForm || undefined,
              activityCode: validated.nafCode || sireneResult.activityCode || undefined,
              activityLabel: sireneResult.activityLabel || undefined,
              companyStatus: "ACTIVE",
              registrationDate: sireneResult.registrationDate
                ? new Date(sireneResult.registrationDate)
                : undefined,
              address: sireneResult.address || undefined,
              city: sireneResult.city || undefined,
              postalCode: sireneResult.postalCode || undefined,
              description: validated.description,
              specialties: validated.specialties || [],
              serviceArea: serviceAreaJson || validated.serviceArea || undefined,
              latitude: latitude,
              longitude: longitude,
            },
          },
        },
        include: { professional: true },
      });

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          company: sireneResult.companyName,
        },
      });
    }

    return NextResponse.json(
      { error: "Type d'inscription invalide" },
      { status: 400 }
    );
  } catch (error: any) {
    if (error.issues) {
      // Zod validation error
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
