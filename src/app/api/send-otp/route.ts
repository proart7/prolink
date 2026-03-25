import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const RATE_LIMIT_MINUTES = 5;
const RATE_LIMIT_MAX = 3;

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidFrenchPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  const phoneRegex = /^(06|07)\d{8}$/;
  return phoneRegex.test(cleaned);
}

function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

function generateOtpCode(): string {
  const code = Math.floor(Math.random() * 1000000);
  return String(code).padStart(OTP_LENGTH, '0');
}

async function checkRateLimit(target: string, type: 'email' | 'phone'): Promise<{ allowed: boolean; count: number }> {
  const fiveMinutesAgo = new Date(Date.now() - RATE_LIMIT_MINUTES * 60 * 1000);
  const count = await prisma.otpCode.count({
    where: { target, type, createdAt: { gte: fiveMinutesAgo } },
  });
  return { allowed: count < RATE_LIMIT_MAX, count };
}

async function sendOtpViaResend(email: string, code: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[DEV MODE] Resend API key not configured. OTP code for ${email}: ${code}`);
    return true;
  }
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Transaxur <noreply@transaxur.fr>',
        to: email,
        subject: 'Votre code de v\u00e9rification Transaxur',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1e40af; margin: 0;">Transaxur</h1>
              <p style="color: #6b7280; margin-top: 5px;">Plateforme de mise en relation professionnelle</p>
            </div>
            <div style="background-color: #f3f4f6; border-radius: 8px; padding: 30px; text-align: center;">
              <h2 style="color: #1f2937; margin-top: 0;">Votre code de v\u00e9rification</h2>
              <div style="background-color: #ffffff; border: 2px dashed #1e40af; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e40af;">${code}</span>
              </div>
              <p style="color: #6b7280; font-size: 14px;">Ce code expirera dans <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.</p>
              <p style="color: #6b7280; font-size: 14px;">Si vous n'avez pas demand\u00e9 ce code, veuillez ignorer cet email.</p>
            </div>
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px;">\u00a9 2025 Transaxur. Tous droits r\u00e9serv\u00e9s.</p>
            </div>
          </div>
        `,
      }),
    });
    if (!response.ok) { const error = await response.json(); console.error('Resend API error:', error); return false; }
    return true;
  } catch (error) { console.error('Error sending email via Resend:', error); return false; }
}

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
      headers: { 'Authorization': `Basic ${authHeader}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        To: phone, From: fromNumber,
        Body: `Votre code de v\u00e9rification Transaxur est : ${code}. Ce code expirera dans ${OTP_EXPIRY_MINUTES} minutes.`,
      }).toString(),
    });
    if (!response.ok) { const error = await response.json(); console.error('Twilio API error:', error); return false; }
    return true;
  } catch (error) { console.error('Error sending SMS via Twilio:', error); return false; }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone, type } = body;
    if (!type || !['email', 'phone'].includes(type)) {
      return NextResponse.json({ success: false, message: 'Type invalide. Utilisez "email" ou "phone".' }, { status: 400 });
    }
    let target: string;
    if (type === 'email') {
      if (!email || typeof email !== 'string') return NextResponse.json({ success: false, message: 'Adresse e-mail requise.' }, { status: 400 });
      if (!isValidEmail(email)) return NextResponse.json({ success: false, message: 'Adresse e-mail invalide.' }, { status: 400 });
      target = email.toLowerCase();
    } else {
      if (!phone || typeof phone !== 'string') return NextResponse.json({ success: false, message: 'Num\u00e9ro de t\u00e9l\u00e9phone requis.' }, { status: 400 });
      if (!isValidFrenchPhone(phone)) return NextResponse.json({ success: false, message: 'Num\u00e9ro de t\u00e9l\u00e9phone fran\u00e7ais invalide (06 ou 07).' }, { status: 400 });
      target = cleanPhoneNumber(phone);
    }
    const { allowed } = await checkRateLimit(target, type);
    if (!allowed) return NextResponse.json({ success: false, message: `Trop de tentatives. Veuillez r\u00e9essayer dans ${RATE_LIMIT_MINUTES} minutes.`, retryAfter: RATE_LIMIT_MINUTES * 60 }, { status: 429 });
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await prisma.otpCode.deleteMany({ where: { target, type, used: false } });
    await prisma.otpCode.create({ data: { target, code, type, expiresAt, used: false } });
    let sendSuccess = false;
    if (type === 'email') { sendSuccess = await sendOtpViaResend(target, code); }
    else { sendSuccess = await sendOtpViaTwilio(target, code); }
    if (!sendSuccess) {
      console.error(`Failed to send OTP via ${type} to ${target}. Code: ${code}`);
      return NextResponse.json({ success: false, message: `Erreur lors de l'envoi du code. Veuillez r\u00e9essayer.` }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: 'Code OTP envoy\u00e9 avec succ\u00e8s', target: type === 'email' ? target : `+33${target.substring(1)}` }, { status: 200 });
  } catch (error) {
    console.error('OTP route error:', error);
    return NextResponse.json({ success: false, message: 'Une erreur serveur est survenue. Veuillez r\u00e9essayer.' }, { status: 500 });
  }
}
