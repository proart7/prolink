import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Parse JSON body
    const body = await request.json();
    const { code, type, email, phone } = body;

    // Validate code
    if (!code || typeof code !== "string" || code.length !== 6) {
      return NextResponse.json(
        { success: false, message: "Le code doit être une chaîne de 6 caractères" },
        { status: 400 }
      );
    }

    // Validate type
    if (!type || !["email", "phone"].includes(type)) {
      return NextResponse.json(
        { success: false, message: "Le type doit être 'email' ou 'phone'" },
        { status: 400 }
      );
    }

    // Validate email if type is email
    if (type === "email") {
      if (!email || typeof email !== "string") {
        return NextResponse.json(
          { success: false, message: "L'adresse email est requise pour la vérification par email" },
          { status: 400 }
        );
      }
    }

    // Validate and clean phone if type is phone
    let cleanPhone: string | null = null;
    if (type === "phone") {
      if (!phone || typeof phone !== "string") {
        return NextResponse.json(
          { success: false, message: "Le numéro de téléphone est requis pour la vérification par téléphone" },
          { status: 400 }
        );
      }
      cleanPhone = phone.replace(/\D/g, "");
      if (!cleanPhone) {
        return NextResponse.json(
          { success: false, message: "Le numéro de téléphone est invalide" },
          { status: 400 }
        );
      }
    }

    // Determine the target (email or cleaned phone)
    const storeKey = type === "email" ? email : cleanPhone;

    // Look up OTP in database
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        target: storeKey,
        type,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // If OTP not found
    if (!otpRecord) {
      return NextResponse.json(
        { success: false, message: "Aucun code trouvé. Veuillez en demander un nouveau." },
        { status: 400 }
      );
    }

    // If code doesn't match
    if (otpRecord.code !== code) {
      return NextResponse.json(
        { success: false, message: "Code invalide" },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await prisma.otpCode.update({
      where: {
        id: otpRecord.id,
      },
      data: {
        used: true,
      },
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Vérification réussie",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { success: false, message: "Erreur lors de la vérification du code" },
      { status: 500 }
    );
  }
}
