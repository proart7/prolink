// Shared OTP store - using globalThis to maintain state across route handlers
const globalForOtp = globalThis as unknown as {
  otpStore?: Map<string, { code: string; expiresAt: Date }>;
};

if (!globalForOtp.otpStore) {
  globalForOtp.otpStore = new Map();
}

export const otpStore = globalForOtp.otpStore;
