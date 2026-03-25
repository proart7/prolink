import { NextRequest, NextResponse } from "next/server";
import { otpStore } from "@/lib/otp-store";

function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, "");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, type, email, phone } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { success: false, message: "Code requis" },
        { status: 400 }
      );
    }

    if (!type || (type !== "email" && type !== "phone")) {
      return NextResponse.json(
        { success: false, message: "Type invalide. Doit être 'email' ou 'phone'" },
        { status: 400 }
      );
    }

    let storeKey: string;

    if (type === "email") {
      if (!email || typeof email !== "string") {
        return NextResponse.json(
          { success: false, message: "Email requis" },
          { status: 400 }
        );
      }
      storeKey = email;
    } else {
      if (!phone || typeof phone !== "string") {
        return NextResponse.json(
          { success: false, message: "Numéro de téléphone requis" },
          { status: 400 }
        );
      }
      storeKey = cleanPhoneNumber(phone);
    }

    const storedOtpData = otpStore.get(storeKey);

    if (!storedOtpData) {
      return NextResponse.json(
        { success: false, message: "Aucun code trouvé. Veuillez en demander un nouveau." },
        { status: 400 }
      );
    }

    const { code: storedCode, expiresAt } = storedOtpData;

    // Check expiry - expiresAt is a Date object
    if (new Date() > expiresAt) {
      otpStore.delete(storeKey);
      return NextResponse.json(
        { success: false, message: "Code expiré. Veuillez en demander un nouveau." },
        { status: 400 }
      );
    }

    if (code !== storedCode) {
      return NextResponse.json(
        { success: false, message: "Code invalide" },
        { status: 400 }
      );
    }

    // Success - delete used OTP
    otpStore.delete(storeKey);

    return NextResponse.json(
      { success: true, message: "Vérification réussie" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
