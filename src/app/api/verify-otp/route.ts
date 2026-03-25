import { NextRequest, NextResponse } from "next/server";
import { otpStore } from "@/lib/otp-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, type } = body;

    // Validate inputs
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email requis" },
        { status: 400 }
      );
    }

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Code OTP requis" },
        { status: 400 }
      );
    }

    if (!type || type !== "email") {
      return NextResponse.json(
        { error: "Type invalide. Seul 'email' est actuellement supporté" },
        { status: 400 }
      );
    }

    // Check if OTP exists for this email
    const otpData = otpStore.get(email);

    if (!otpData) {
      return NextResponse.json(
        { success: false, error: "Aucun code OTP en attente pour cet email" },
        { status: 400 }
      );
    }

    // Check if code has expired
    if (new Date() > otpData.expiresAt) {
      otpStore.delete(email);
      return NextResponse.json(
        { success: false, error: "Code OTP expiré" },
        { status: 400 }
      );
    }

    // Check if code matches
    if (code !== otpData.code) {
      return NextResponse.json(
        { success: false, error: "Code OTP invalide" },
        { status: 400 }
      );
    }

    // Code is valid, delete from store
    otpStore.delete(email);

    console.log(`[OTP Verified] Email: ${email}`);

    return NextResponse.json({
      success: true,
      verified: true,
      message: "Code OTP vérifié avec succès",
    });
  } catch (error: any) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
