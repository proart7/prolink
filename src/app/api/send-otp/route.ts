import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Constants
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const RATE_LIMIT_MINUTES = 5;
const RATE_LIMIT_MAX = 3;

// Email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// French phone number validation (06 or 07 followed by 8 digits)
function isValidFrenchPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  const phoneRegex = /^(06|07)\d{8}$/;
  return phoneRegex.test(cleaned);
}

// Clean phone number to keep only digits
function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

// Generate random 6-digit OTP code
function generateOtpCode(): string {
  const code = Math.floor(Math.random() * 1000000);
  return String(code).padStart(OTP_LENGTH, '0');
}

// Check rate limiting
async function checkRateLimit(target: string, type: 'email' | 'phone'): Promise<{ allowed: boolean; count: number }> {
  const fiveMinutesAgo = new Date(Date.now() - RATE_LIMIT_MINUTES * 60 * 1000);

  const count = await prisma.otpCode.count({
    where: {
      target,
      type,
      createdAt: {
        gte: fiveMinutesAgo,
      },
    },
  });

  return {
    allowed: count < RATE_LIMIT_MAX,
    count,
  };
}

// Send OTP via Resend (email)
async function sendOtpViaResend(email: string, code: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[DEV MODE] Resend API key not configured. OTP code for ${email}: ${code}`);
    return true;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ProLink <onboarding@resend.dev>',
        to: email,
        subject: 'Votre code de vérification ProLink',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
                .code-box { background-color: #ffffff; border: 2px solid #007bff; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
                .code { font-size: 36px; font-weight: bold; letter-spacing: 5px; color: #007bff; font-family: monospace; }
                .footer { font-size: 12px; color: #999; text-align: center; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>ProLink</h1>
                </div>
                <div class="content">
                  <p>Bonjour,</p>
                  <p>Vous avez demandé un code de vérification pour accéder à votre compte ProLink. Veuillez utiliser le code ci-dessous :</p>
                  <div class="code-box">
                    <div class="code">${code}</div>
                  </div>
                  <p>Ce code expirera dans ${OTP_EXPIRY_MINUTES} minutes.</p>
                  <p>Si vous n'avez pas demandé ce code, veuillez ignorer cet e-mail.</p>
                  <p>Cordialement,<br/>L'équipe ProLink</p>
                  <div class="footer">
                    <p>© 2026 ProLink. Tous droits réservés.</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Resend API error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending email via Resend:', error);
    return false;
  }
}

// Send OTP via Twilio (SMS)
async function sendOtpViaTwilio(phone: string, code: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.log(`[DEV MODE] Twilio credentials not configured. OTP code for ${phone}: ${code}`);
    return true;
  }

  try {
    const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: phone,
        From: fromNumber,
        Body: `Votre code de vérification ProLink est : ${code}. Ce code expirera dans ${OTP_EXPIRY_MINUTES} minutes.`,
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Twilio API error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending SMS via Twilio:', error);
    return false;
  }
}

// Main route handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone, type } = body;

    // Validate type
    if (!type || !['email', 'phone'].includes(type)) {
      return NextResponse.json(
        { success: false, message: 'Type invalide. Utilisez "email" ou "phone".' },
        { status: 400 }
      );
    }

    // Validate input based on type
    let target: string;

    if (type === 'email') {
      if (!email || typeof email !== 'string') {
        return NextResponse.json(
          { success: false, message: 'Adresse e-mail requise.' },
          { status: 400 }
        );
      }

      if (!isValidEmail(email)) {
        return NextResponse.json(
          { success: false, message: 'Adresse e-mail invalide.' },
          { status: 400 }
        );
      }

      target = email.toLowerCase();
    } else {
      // type === 'phone'
      if (!phone || typeof phone !== 'string') {
        return NextResponse.json(
          { success: false, message: 'Numéro de téléphone requis.' },
          { status: 400 }
        );
      }

      if (!isValidFrenchPhone(phone)) {
        return NextResponse.json(
          { success: false, message: 'Numéro de téléphone français invalide (06 ou 07).' },
          { status: 400 }
        );
      }

      target = cleanPhoneNumber(phone);
    }

    // Check rate limiting
    const { allowed, count } = await checkRateLimit(target, type);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `Trop de tentatives. Veuillez réessayer dans ${RATE_LIMIT_MINUTES} minutes.`,
          retryAfter: RATE_LIMIT_MINUTES * 60,
        },
        { status: 429 }
      );
    }

    // Generate OTP code
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Delete any existing unused OTP codes for this target+type
    await prisma.otpCode.deleteMany({
      where: {
        target,
        type,
        used: false,
      },
    });

    // Create new OTP code in database
    await prisma.otpCode.create({
      data: {
        target,
        code,
        type,
        expiresAt,
        used: false,
      },
    });

    // Send OTP via appropriate channel
    let sendSuccess = false;

    if (type === 'email') {
      sendSuccess = await sendOtpViaResend(target, code);
    } else {
      sendSuccess = await sendOtpViaTwilio(target, code);
    }

    if (!sendSuccess) {
      // Log the code for debugging
      console.error(`Failed to send OTP via ${type} to ${target}. Code: ${code}`);
      return NextResponse.json(
        {
          success: false,
          message: `Erreur lors de l'envoi du code. Veuillez réessayer.`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Code OTP envoyé avec succès',
        target: type === 'email' ? target : `+33${target.substring(1)}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('OTP route error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Une erreur serveur est survenue. Veuillez réessayer.',
      },
      { status: 500 }
    );
  }
}
