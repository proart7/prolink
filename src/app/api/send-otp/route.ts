import { NextRequest, NextResponse } from "next/server";
import { otpStore } from "@/lib/otp-store";

// In-memory rate limiter: tracks OTP requests per identifier
const rateLimitStore = new Map<string, number[]>();

function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function isRateLimited(identifier: string, maxRequests: number = 3, windowMs: number = 5 * 60 * 1000): boolean {
  const now = Date.now();
  const timestamps = rateLimitStore.get(identifier) || [];

  // Remove timestamps outside the window
  const validTimestamps = timestamps.filter((ts) => now - ts < windowMs);

  if (validTimestamps.length >= maxRequests) {
    return true;
  }

  // Add current request timestamp
  validTimestamps.push(now);
  rateLimitStore.set(identifier, validTimestamps);

  return false;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateFrenchPhone(phone: string): boolean {
  // French phone: 06 or 07 followed by 8 digits
  const cleanPhone = phone.replace(/[\s\-().]/g, "");
  const phoneRegex = /^(?:0[67])(?:\d{8})$/;
  return phoneRegex.test(cleanPhone);
}

function cleanPhoneNumber(phone: string): string {
  return phone.replace(/[\s\-().]/g, "");
}

interface ResendEmailResponse {
  id?: string;
  error?: string;
}

interface TwilioSmsResponse {
  sid?: string;
  error_code?: string;
  message?: string;
}

async function sendEmailViaResend(
  email: string,
  code: string,
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  // Fall back to console if no API key
  if (!apiKey) {
    console.log(`[OTP - Development Mode] Email: ${email}, Code: ${code}`);
    return { success: true };
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ProLink - Code de vérification</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f9fafb;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 32px 24px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .content {
          padding: 32px 24px;
        }
        .content p {
          margin: 0 0 16px 0;
          font-size: 16px;
        }
        .code-box {
          background-color: #f3f4f6;
          border: 2px solid #667eea;
          border-radius: 8px;
          padding: 24px;
          text-align: center;
          margin: 24px 0;
        }
        .code-box .code {
          font-size: 36px;
          font-weight: 700;
          letter-spacing: 4px;
          color: #667eea;
          font-family: 'Courier New', monospace;
        }
        .code-box .note {
          font-size: 14px;
          color: #666;
          margin-top: 12px;
        }
        .footer {
          background-color: #f9fafb;
          padding: 24px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #e5e7eb;
        }
        .footer p {
          margin: 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ProLink</h1>
        </div>
        <div class="content">
          <p>Bonjour,</p>
          <p>Vous avez demandé un code de vérification pour accéder à votre compte ProLink.</p>
          <div class="code-box">
            <div class="code">${code}</div>
            <div class="note">Ce code expire dans 5 minutes</div>
          </div>
          <p>Si vous n'avez pas demandé ce code, vous pouvez ignorer cet email en toute sécurité.</p>
          <p>Cordialement,<br>L'équipe ProLink</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 ProLink. Tous droits réservés.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ProLink <onboarding@resend.dev>",
        to: email,
        subject: "ProLink - Votre code de vérification",
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as ResendEmailResponse;
      console.error("Resend API error:", errorData);
      return {
        success: false,
        error: "Erreur lors de l'envoi de l'email",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Email send exception:", error);
    return {
      success: false,
      error: "Erreur lors de l'envoi de l'email",
    };
  }
}

async function sendSmsViaTwilio(
  phone: string,
  code: string,
): Promise<{ success: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  // Fall back to console if Twilio credentials are not set
  if (!accountSid || !authToken || !twilioPhoneNumber) {
    console.log(`[OTP - Development Mode] Phone: ${phone}, Code: ${code}`);
    return { success: true };
  }

  const message = `Votre code de vérification ProLink est: ${code}. Valable 5 minutes.`;

  try {
    const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: twilioPhoneNumber,
          To: phone,
          Body: message,
        }).toString(),
      },
    );

    if (!response.ok) {
      const errorData = (await response.json()) as TwilioSmsResponse;
      console.error("Twilio API error:", errorData);
      return {
        success: false,
        error: "Erreur lors de l'envoi du SMS",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("SMS send exception:", error);
    return {
      success: false,
      error: "Erreur lors de l'envoi du SMS",
    };
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as {
      email?: string;
      phone?: string;
      type?: string;
    };
    const { email, phone, type } = body;

    if (!type || (type !== "email" && type !== "phone")) {
      return NextResponse.json(
        { error: "Type invalide. Doit être 'email' ou 'phone'" },
        { status: 400 },
      );
    }

    if (type === "email") {
      if (!email || typeof email !== "string") {
        return NextResponse.json({ error: "Email requis" }, { status: 400 });
      }

      if (!validateEmail(email)) {
        return NextResponse.json(
          { error: "Adresse email invalide" },
          { status: 400 },
        );
      }

      // Check rate limit
      if (isRateLimited(email)) {
        return NextResponse.json(
          {
            error: "Trop de demandes. Veuillez réessayer dans 5 minutes",
          },
          { status: 429 },
        );
      }

      const code = generateOtpCode();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      otpStore.set(email, { code, expiresAt });

      const sendResult = await sendEmailViaResend(email, code);

      if (!sendResult.success) {
        return NextResponse.json({ error: sendResult.error }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Code OTP envoyé avec succès",
      });
    } else if (type === "phone") {
      if (!phone || typeof phone !== "string") {
        return NextResponse.json({ error: "Numéro de téléphone requis" }, { status: 400 });
      }

      if (!validateFrenchPhone(phone)) {
        return NextResponse.json(
          {
            error: "Numéro de téléphone invalide. Format: 06XXXXXXXX ou 07XXXXXXXX",
          },
          { status: 400 },
        );
      }

      const cleanPhone = cleanPhoneNumber(phone);

      // Check rate limit
      if (isRateLimited(cleanPhone)) {
        return NextResponse.json(
          {
            error: "Trop de demandes. Veuillez réessayer dans 5 minutes",
          },
          { status: 429 },
        );
      }

      const code = generateOtpCode();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      otpStore.set(cleanPhone, { code, expiresAt });

      const sendResult = await sendSmsViaTwilio(cleanPhone, code);

      if (!sendResult.success) {
        return NextResponse.json({ error: sendResult.error }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Code OTP envoyé avec succès",
      });
    }

    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
