import { NextRequest, NextResponse } from "next/server";
import { otpStore } from "@/lib/otp-store";

// Helper function to generate a random 6-digit code
function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, type } = body;

    // Validate inputs
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email requis" },
        { status: 400 }
      );
    }

    if (!type || type !== "email") {
      return NextResponse.json(
        { error: "Type invalide. Seul 'email' est actuellement supporté" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Adresse email invalide" },
        { status: 400 }
      );
    }

    // Generate OTP code
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store in the map
    otpStore.set(email, { code, expiresAt });

    // In production, send via email service (e.g., SendGrid, Resend, etc.)
    // For now, just log it to console
    console.log(
      `[OTP] Email: ${email}, Code: ${code}, Expires: ${expiresAt.toISOString()}`
    );

    // Optionally also log to a development endpoint (remove in production)
    if (process.env.NODE_ENV === "development") {
      console.log(`Development: OTP code for ${email} is ${code}`);
    }

    return NextResponse.json({
      success: true,
      message: "Code OTP envoyé avec succès",
    });
  } catch (error: any) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
