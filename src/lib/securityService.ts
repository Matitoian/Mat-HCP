/**
 * HouseCom Security Service
 * Handles: Input sanitization, XSS prevention, rate limiting,
 * content security, and anti-fraud utilities.
 */

// ── 1. INPUT SANITIZATION ──────────────────────────────────────────────────

/**
 * Strip HTML tags and dangerous characters to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // remove angle brackets (XSS)
    .replace(/javascript:/gi, '') // remove JS protocol
    .replace(/on\w+=/gi, '') // remove event handlers
    .replace(/data:/gi, '') // remove data URIs
    .trim()
    .slice(0, 500); // max length guard
}

/**
 * Sanitize a full form object's string fields
 */
export function sanitizeFormData<T extends Record<string, unknown>>(data: T): T {
  const sanitized = { ...data };
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      (sanitized as Record<string, unknown>)[key] = sanitizeInput(sanitized[key] as string);
    }
  }
  return sanitized;
}

// ── 2. VALIDATION HELPERS ──────────────────────────────────────────────────

export const validators = {
  email: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  phone: (phone: string) => /^\+254\d{9}$/.test(phone),
  kenyanPhone: (phone: string) => /^(\+254|0)\d{9}$/.test(phone),
  mpesaCode: (code: string) => /^[A-Z0-9]{10}$/i.test(code),
  studentId: (id: string) => /^[A-Z]{2,5}\/\d{4}\/\d{3,6}$/i.test(id),
  password: (password: string) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
    };
    return {
      isValid: Object.values(checks).every(Boolean),
      checks,
      score: Object.values(checks).filter(Boolean).length,
    };
  },
  price: (price: number) => price >= 1000 && price <= 200000,
};

// ── 3. RATE LIMITING (client-side, for demo defense) ──────────────────────

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
  blocked: boolean;
  blockedUntil?: number;
}

const rateLimitStore: Map<string, RateLimitEntry> = new Map();

const RATE_LIMITS = {
  login: { maxAttempts: 5, windowMs: 5 * 60 * 1000, blockMs: 15 * 60 * 1000 },
  signup: { maxAttempts: 3, windowMs: 10 * 60 * 1000, blockMs: 30 * 60 * 1000 },
  otp: { maxAttempts: 3, windowMs: 10 * 60 * 1000, blockMs: 10 * 60 * 1000 },
  search: { maxAttempts: 100, windowMs: 60 * 1000, blockMs: 60 * 1000 },
};

export function checkRateLimit(action: keyof typeof RATE_LIMITS, identifier: string = 'global'): {
  allowed: boolean;
  remainingAttempts: number;
  blockedFor?: number; // seconds
  message?: string;
} {
  const key = `${action}:${identifier}`;
  const limit = RATE_LIMITS[action];
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  // If blocked, check if block has expired
  if (entry?.blocked) {
    if (entry.blockedUntil && now < entry.blockedUntil) {
      const blockedFor = Math.ceil((entry.blockedUntil - now) / 1000);
      return {
        allowed: false,
        remainingAttempts: 0,
        blockedFor,
        message: `Too many attempts. Try again in ${blockedFor} seconds.`,
      };
    } else {
      // Block expired, reset
      rateLimitStore.delete(key);
      entry = undefined;
    }
  }

  // Window expired? Reset
  if (entry && now - entry.firstAttempt > limit.windowMs) {
    rateLimitStore.delete(key);
    entry = undefined;
  }

  if (!entry) {
    rateLimitStore.set(key, {
      attempts: 1,
      firstAttempt: now,
      lastAttempt: now,
      blocked: false,
    });
    return { allowed: true, remainingAttempts: limit.maxAttempts - 1 };
  }

  entry.attempts += 1;
  entry.lastAttempt = now;

  if (entry.attempts > limit.maxAttempts) {
    entry.blocked = true;
    entry.blockedUntil = now + limit.blockMs;
    const blockedFor = Math.ceil(limit.blockMs / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      blockedFor,
      message: `Account temporarily locked. Try again in ${Math.ceil(blockedFor / 60)} minutes.`,
    };
  }

  return {
    allowed: true,
    remainingAttempts: limit.maxAttempts - entry.attempts,
  };
}

export function resetRateLimit(action: keyof typeof RATE_LIMITS, identifier: string = 'global') {
  rateLimitStore.delete(`${action}:${identifier}`);
}

// ── 4. SECURE LOCALSTORAGE ─────────────────────────────────────────────────

export const secureStorage = {
  set: (key: string, value: unknown): void => {
    try {
      const serialized = JSON.stringify({ data: value, ts: Date.now() });
      localStorage.setItem(key, serialized);
    } catch (err) {
      console.error('SecureStorage.set error:', err);
    }
  },

  get: <T>(key: string): T | null => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Support both legacy (plain values) and new format
      return (parsed && 'data' in parsed ? parsed.data : parsed) as T;
    } catch {
      // Corrupted data — clear it
      localStorage.removeItem(key);
      return null;
    }
  },

  remove: (key: string): void => {
    localStorage.removeItem(key);
  },

  clear: (): void => {
    const keysToRemove = ['housecom_user', 'housecom_token', 'housecom_saved'];
    keysToRemove.forEach(k => localStorage.removeItem(k));
  },
};

// ── 5. FRAUD DETECTION HEURISTICS ─────────────────────────────────────────

export interface FraudSignal {
  type: 'price_too_low' | 'no_verification' | 'suspicious_contact' | 'unrealistic_claim' | 'pressure_tactics';
  severity: 'low' | 'medium' | 'high';
  message: string;
}

export function analyzePropertyForFraud(property: {
  price: number;
  county: string;
  landlordVerified: boolean;
  description?: string;
  bedrooms: number;
}): FraudSignal[] {
  const signals: FraudSignal[] = [];

  // Price anomaly detection
  const minPrices: Record<string, number> = {
    Mombasa: 3500,
    Kilifi: 3000,
    Kwale: 4000,
    Lamu: 2500,
  };
  const minPrice = minPrices[property.county] || 3000;
  if (property.price < minPrice) {
    signals.push({
      type: 'price_too_low',
      severity: 'high',
      message: `Price KSh ${property.price.toLocaleString()} is unusually low for ${property.county}`,
    });
  }

  // Unverified landlord
  if (!property.landlordVerified) {
    signals.push({
      type: 'no_verification',
      severity: 'medium',
      message: 'Landlord has not completed identity verification',
    });
  }

  // Suspicious description keywords
  const suspiciousKeywords = ['send money first', 'wire transfer', 'western union', 'advance fee', 'deposit upfront'];
  const desc = (property.description || '').toLowerCase();
  if (suspiciousKeywords.some(kw => desc.includes(kw))) {
    signals.push({
      type: 'suspicious_contact',
      severity: 'high',
      message: 'Description contains suspicious payment request language',
    });
  }

  return signals;
}

export function getFraudRiskLevel(signals: FraudSignal[]): 'safe' | 'caution' | 'danger' {
  if (signals.some(s => s.severity === 'high')) return 'danger';
  if (signals.some(s => s.severity === 'medium')) return 'caution';
  return 'safe';
}

// ── 6. CONTENT SECURITY HEADERS (documented for PHP backend) ──────────────

export const SECURITY_HEADERS_DOCS = `
When the PHP backend is deployed, add these headers:

Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https://images.unsplash.com data:;
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(self), camera=(), microphone=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
`;

// ── 7. SESSION VALIDATION ──────────────────────────────────────────────────

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function validateSession(token: string | null): boolean {
  if (!token) return false;
  if (!token.startsWith('mock_token_')) return false;

  // Extract timestamp from token
  const ts = parseInt(token.replace('mock_token_', ''));
  if (isNaN(ts)) return false;

  // Check expiry
  return Date.now() - ts < SESSION_DURATION_MS;
}

// ── 8. ANTI-SCRAPING ──────────────────────────────────────────────────────

let viewCount = 0;
export function trackPropertyView(propertyId: string): boolean {
  viewCount++;
  // In production: track via backend, detect bots, rate limit
  const key = `housecom_view_${propertyId}`;
  const lastView = localStorage.getItem(key);
  const now = Date.now();

  if (lastView && now - parseInt(lastView) < 5000) {
    return false; // Duplicate view within 5s
  }

  localStorage.setItem(key, now.toString());
  return true;
}
