import { toast } from 'sonner';

/**
 * Centralized Error Handler
 * Provides consistent error messages and logging across the app
 */

export interface APIError {
  code?: string;
  message: string;
  details?: string;
  statusCode?: number;
}

const ERROR_MESSAGES: Record<string, string> = {
  // Auth errors
  'auth/user-not-found': 'User not found. Please check your email.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/email-already-in-use': 'This email is already registered.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/too-many-requests': 'Too many login attempts. Please try again later.',

  // Property errors
  'property/not-found': 'Property not found.',
  'property/unauthorized': 'You do not have permission to modify this property.',
  'property/invalid-data': 'Please fill in all required property fields.',

  // Payment errors
  'payment/insufficient-funds': 'Insufficient M-PESA balance.',
  'payment/invalid-mpesa-code': 'Invalid M-PESA code. Please check and try again.',
  'payment/timeout': 'Payment verification timed out. Please check M-PESA.',
  'payment/failed': 'Payment failed. Please try again.',

  // Chat errors
  'chat/message-empty': 'Message cannot be empty.',
  'chat/chat-not-found': 'Chat not found.',

  // Network errors
  'network/offline': 'You are offline. Please check your internet connection.',
  'network/timeout': 'Request timed out. Please try again.',
  'network/server-error': 'Server error. Please try again later.',
  'network/unauthorized': 'Session expired. Please login again.',

  // Generic errors
  'error/unknown': 'An unexpected error occurred. Please try again.',
  'error/validation': 'Please check your input and try again.',
};

export function getErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return ERROR_MESSAGES[error] || error;
  }

  if (error instanceof Error) {
    return ERROR_MESSAGES[error.message] || error.message;
  }

  if (error?.code) {
    return ERROR_MESSAGES[error.code] || error.message || 'An error occurred';
  }

  if (error?.error) {
    return typeof error.error === 'string'
      ? ERROR_MESSAGES[error.error] || error.error
      : error.error.message || 'An error occurred';
  }

  return ERROR_MESSAGES['error/unknown'];
}

export function handleAPIError(error: any, defaultMessage = 'Something went wrong') {
  const message = getErrorMessage(error);
  console.error('API Error:', error);
  toast.error(message || defaultMessage);
  return message;
}

export function handleAPISuccess(message = 'Operation successful!') {
  toast.success(message);
}

export function validateEmail(email: string): { valid: boolean; error?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return { valid: false, error: 'Email is required' };
  if (!emailRegex.test(email)) return { valid: false, error: 'Please enter a valid email' };
  return { valid: true };
}

export function validatePhone(phone: string): { valid: boolean; error?: string } {
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s]?[(]?[0-9]{1,4}[)]?[-\s]?[0-9]{1,9}$/;
  if (!phone) return { valid: false, error: 'Phone number is required' };
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return { valid: false, error: 'Please enter a valid phone number' };
  }
  return { valid: true };
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) return { valid: false, error: 'Password is required' };
  if (password.length < 6) return { valid: false, error: 'Password must be at least 6 characters' };
  return { valid: true };
}

export function validateForm(data: Record<string, any>, rules: Record<string, (value: any) => { valid: boolean; error?: string }>) {
  const errors: Record<string, string> = {};
  
  for (const [field, value] of Object.entries(data)) {
    if (rules[field]) {
      const validation = rules[field](value);
      if (!validation.valid) {
        errors[field] = validation.error || 'Invalid input';
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export const commonValidationRules = {
  email: (value: string) => validateEmail(value),
  phone: (value: string) => validatePhone(value),
  password: (value: string) => validatePassword(value),
  required: (value: any) => 
    value ? { valid: true } : { valid: false, error: 'This field is required' },
  minLength: (min: number) => (value: any) =>
    (value?.length || 0) >= min
      ? { valid: true }
      : { valid: false, error: `Must be at least ${min} characters` },
  maxLength: (max: number) => (value: any) =>
    (value?.length || 0) <= max
      ? { valid: true }
      : { valid: false, error: `Must not exceed ${max} characters` },
  number: (value: any) =>
    !isNaN(value) && value !== null && value !== ''
      ? { valid: true }
      : { valid: false, error: 'Must be a number' },
  positiveNumber: (value: any) =>
    !isNaN(value) && parseInt(value) > 0
      ? { valid: true }
      : { valid: false, error: 'Must be a positive number' },
};

export function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const attempt = async (count = 0) => {
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        if (count < maxRetries) {
          setTimeout(() => attempt(count + 1), delay * (count + 1));
        } else {
          reject(error);
        }
      }
    };
    attempt();
  });
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
