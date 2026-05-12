/**
 * OTP Service - Generates and manages one-time passwords
 * Integrates with backend SMS sending
 */
import { supabase } from './supabaseClient';

export interface OTPData {
  code: string;
  phoneNumber: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
}

// Store OTPs in localStorage (temporary storage for demo)
// In production, use a secure backend KV store or database
const OTP_PREFIX = 'housecom_otp_';
const OTP_VALIDITY = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 3;

export const otpService = {
  /**
   * Generate a random 6-digit OTP code
   */
  generateCode: (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  /**
   * Send OTP to phone number via SMS
   * Integrates with backend SMS service
   */
  sendOTP: async (phoneNumber: string): Promise<{ success: boolean; message: string; code?: string }> => {
    try {
      const code = otpService.generateCode();
      const now = Date.now();
      const otpData: OTPData = {
        code,
        phoneNumber,
        createdAt: now,
        expiresAt: now + OTP_VALIDITY,
        attempts: 0,
        maxAttempts: MAX_ATTEMPTS,
      };

      // Store OTP locally (for demo/testing)
      localStorage.setItem(`${OTP_PREFIX}${phoneNumber}`, JSON.stringify(otpData));

      // Send SMS via backend endpoint
      try {
        const response = await fetch('/api/sms/send.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber,
            message: `Your HouseCom verification code is: ${code}. Valid for 10 minutes.`,
            code,
          }),
        });

        if (response.ok) {
          console.log(`✅ OTP sent to ${phoneNumber}: ${code}`);
          return {
            success: true,
            message: `Verification code sent to ${phoneNumber}`,
            code, // Return code for testing (remove in production)
          };
        } else {
          // Backend not available, use test mode
          console.warn('⚠️ SMS backend unavailable, using test mode. Code:', code);
          return {
            success: true,
            message: `[TEST MODE] Code: ${code}. In production, this would be sent via SMS.`,
            code,
          };
        }
      } catch (fetchError) {
        // Backend not reachable - use test mode
        console.warn('⚠️ SMS service unavailable (test mode)', fetchError);
        return {
          success: true,
          message: `[TEST MODE] Code: ${code}. Paste this code to continue.`,
          code,
        };
      }
    } catch (e) {
      return {
        success: false,
        message: `Failed to send OTP: ${String(e).substring(0, 100)}`,
      };
    }
  },

  /**
   * Verify OTP code against stored OTP
   */
  verifyOTP: (phoneNumber: string, enteredCode: string): { success: boolean; message: string } => {
    try {
      const stored = localStorage.getItem(`${OTP_PREFIX}${phoneNumber}`);
      if (!stored) {
        return { success: false, message: 'No verification code found. Request a new one.' };
      }

      const otpData: OTPData = JSON.parse(stored);

      // Check if expired
      if (Date.now() > otpData.expiresAt) {
        localStorage.removeItem(`${OTP_PREFIX}${phoneNumber}`);
        return { success: false, message: 'Verification code expired. Request a new one.' };
      }

      // Check attempts
      if (otpData.attempts >= otpData.maxAttempts) {
        localStorage.removeItem(`${OTP_PREFIX}${phoneNumber}`);
        return { success: false, message: 'Too many attempts. Request a new code.' };
      }

      // Check code (clean input)
      const cleanEntered = enteredCode.replace(/\D/g, '');
      if (cleanEntered === otpData.code) {
        // Correct code - clear it
        localStorage.removeItem(`${OTP_PREFIX}${phoneNumber}`);
        return { success: true, message: 'Phone verified successfully!' };
      }

      // Wrong code - increment attempts
      otpData.attempts++;
      localStorage.setItem(`${OTP_PREFIX}${phoneNumber}`, JSON.stringify(otpData));
      const remaining = otpData.maxAttempts - otpData.attempts;
      return {
        success: false,
        message: `Invalid code. ${remaining} attempt(s) remaining.`,
      };
    } catch (e) {
      return { success: false, message: 'Verification failed. Please try again.' };
    }
  },

  /**
   * Check if OTP exists and is still valid
   */
  isOTPValid: (phoneNumber: string): boolean => {
    try {
      const stored = localStorage.getItem(`${OTP_PREFIX}${phoneNumber}`);
      if (!stored) return false;

      const otpData: OTPData = JSON.parse(stored);
      return Date.now() <= otpData.expiresAt && otpData.attempts < otpData.maxAttempts;
    } catch {
      return false;
    }
  },

  /**
   * Get remaining time for OTP in seconds
   */
  getRemainingTime: (phoneNumber: string): number => {
    try {
      const stored = localStorage.getItem(`${OTP_PREFIX}${phoneNumber}`);
      if (!stored) return 0;

      const otpData: OTPData = JSON.parse(stored);
      const remaining = Math.ceil((otpData.expiresAt - Date.now()) / 1000);
      return remaining > 0 ? remaining : 0;
    } catch {
      return 0;
    }
  },

  /**
   * Clear OTP for phone number
   */
  clearOTP: (phoneNumber: string) => {
    localStorage.removeItem(`${OTP_PREFIX}${phoneNumber}`);
  },
};
