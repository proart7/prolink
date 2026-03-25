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