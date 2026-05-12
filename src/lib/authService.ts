/**
 * HouseCom Auth Service — powered by Supabase Auth
 * Replaces the mock backend with real Supabase Authentication.
 */
import { supabase } from './supabaseClient';
import { User } from './mockData';

export interface LoginCredentials { email: string; password: string; }
export interface SignupData {
  name: string; email: string; phone: string; password: string;
  role: 'tenant' | 'landlord'; county: string; isStudent: boolean; studentId?: string;
  institution?: string; institutionId?: string; institutionCounty?: string;
}
export interface AuthResponse {
  success: boolean; message: string; user?: User; token?: string; requiresOTP?: boolean;
}

// Demo credentials from environment
const DEMO_CREDENTIALS = {
  tenant: {
    email: import.meta.env.VITE_DEMO_TENANT_EMAIL,
    password: import.meta.env.VITE_DEMO_TENANT_PASSWORD,
    role: 'tenant' as const,
  },
  landlord: {
    email: import.meta.env.VITE_DEMO_LANDLORD_EMAIL,
    password: import.meta.env.VITE_DEMO_LANDLORD_PASSWORD,
    role: 'landlord' as const,
  },
  admin: {
    email: import.meta.env.VITE_DEMO_ADMIN_EMAIL,
    password: import.meta.env.VITE_DEMO_ADMIN_PASSWORD,
    role: 'admin' as const,
  },
};

const DEMO_SESSION_KEY = 'housecom_demo_session';

// Helper to create a User object from Supabase auth data + metadata
function createUserFromAuth(authUser: any, metadata?: any): User {
  return {
    id: authUser.id,
    name: metadata?.name || authUser.user_metadata?.name || 'User',
    email: authUser.email || '',
    phone: metadata?.phone || authUser.user_metadata?.phone || '',
    role: (metadata?.role || authUser.user_metadata?.role || 'tenant') as 'tenant' | 'landlord' | 'admin',
    county: metadata?.county || authUser.user_metadata?.county || 'Mombasa',
    isStudent: metadata?.isStudent || authUser.user_metadata?.isStudent || false,
    studentId: metadata?.studentId || authUser.user_metadata?.studentId,
    institution: metadata?.institution || authUser.user_metadata?.institution,
    institutionId: metadata?.institutionId || authUser.user_metadata?.institutionId,
    institutionCounty: metadata?.institutionCounty || authUser.user_metadata?.institutionCounty,
    verified: metadata?.verified || authUser.user_metadata?.verified || false,
    avatar: authUser.user_metadata?.avatar_url,
  };
}

// Helper to create demo user
function createDemoUser(type: 'tenant' | 'landlord' | 'admin'): User {
  const creds = DEMO_CREDENTIALS[type];
  return {
    id: `demo-${type}`,
    name: `${type.charAt(0).toUpperCase() + type.slice(1)} Demo User`,
    email: creds.email,
    phone: '+254700000000',
    role: creds.role,
    county: 'Nairobi',
    isStudent: type === 'tenant',
    studentId: type === 'tenant' ? 'DEMO123' : undefined,
    institution: type === 'tenant' ? 'Demo University' : undefined,
    institutionId: type === 'tenant' ? 'DEMO_UNI' : undefined,
    institutionCounty: type === 'tenant' ? 'Nairobi' : undefined,
    verified: true,
    avatar: undefined,
  };
}

// Helper to check if credentials are demo
function isDemoLogin(credentials: LoginCredentials): 'tenant' | 'landlord' | 'admin' | null {
  for (const [type, creds] of Object.entries(DEMO_CREDENTIALS)) {
    if (credentials.email === creds.email && credentials.password === creds.password) {
      return type as 'tenant' | 'landlord' | 'admin';
    }
  }
  return null;
}

// Helper to get demo session
function getDemoSession() {
  const stored = localStorage.getItem(DEMO_SESSION_KEY);
  return stored ? JSON.parse(stored) : null;
}

// Helper to set demo session
function setDemoSession(user: User) {
  localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify({
    user,
    token: `demo-token-${user.id}`,
    expires_at: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  }));
}

// Helper to clear demo session
function clearDemoSession() {
  localStorage.removeItem(DEMO_SESSION_KEY);
}

export const authService = {
  /** Get current Supabase session or demo session */
  getCurrentSession: async () => {
    const demoSession = getDemoSession();
    if (demoSession) {
      return {
        access_token: demoSession.token,
        refresh_token: null,
        expires_at: demoSession.expires_at,
        user: demoSession.user,
      };
    }
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  /** Get current user from session or demo */
  getCurrentUser: async (): Promise<User | null> => {
    const demoSession = getDemoSession();
    if (demoSession) {
      return demoSession.user;
    }
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) return null;
      return createUserFromAuth(data.session.user);
    } catch (e) {
      console.log('getCurrentUser error:', e);
      return null;
    }
  },

  /** Get auth token or demo token */
  getToken: async (): Promise<string | null> => {
    const demoSession = getDemoSession();
    if (demoSession) {
      return demoSession.token;
    }
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  },

  /** Login with email/password via Supabase Auth or demo */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // Check for demo login first
    const demoType = isDemoLogin(credentials);
    if (demoType) {
      const user = createDemoUser(demoType);
      setDemoSession(user);
      return { success: true, message: 'Demo login successful', user, token: `demo-token-${user.id}` };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      });
      if (error) return { success: false, message: error.message };
      if (!data.session?.user) return { success: false, message: 'Login failed — no session' };

      const user = createUserFromAuth(data.session.user);
      return { success: true, message: 'Login successful', user, token: data.session.access_token };
    } catch (e) {
      console.log('Login error:', e);
      return { success: false, message: `Login failed: ${String(e).substring(0, 100)}` };
    }
  },

  /** Signup via Supabase Auth */
  signup: async (data: SignupData): Promise<AuthResponse> => {
    try {
      // Sign up the user with Supabase Auth
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        options: {
          data: {
            name: data.name,
            phone: data.phone,
            role: data.role,
            county: data.county,
            isStudent: data.isStudent,
            studentId: data.studentId,
            institution: data.institution,
            institutionId: data.institutionId,
            institutionCounty: data.institutionCounty,
          },
        },
      });

      if (signupError) {
        // Handle rate limiting gracefully
        if (signupError.message?.includes('rate_limit') || signupError.message?.includes('too many')) {
          return {
            success: false,
            message: 'Too many signup attempts. Please wait 5 minutes before trying again or use a different email.',
          };
        }
        // Handle already registered emails
        if (signupError.message?.includes('already registered') || signupError.message?.includes('user already exists')) {
          return {
            success: false,
            message: 'This email is already registered. Please log in instead.',
          };
        }
        return { success: false, message: signupError.message };
      }

      if (!authData.user) {
        return { success: false, message: 'Signup failed — no user created' };
      }

      // Create user object from auth data
      const newUser = createUserFromAuth(authData.user, {
        name: data.name,
        phone: data.phone,
        role: data.role,
        county: data.county,
        isStudent: data.isStudent,
        studentId: data.studentId,
      });

      return {
        success: true,
        message: 'Account created! Please verify your email.',
        user: newUser,
        requiresOTP: true,
      };
    } catch (e) {
      console.log('Signup error:', e);
      return { success: false, message: `Signup failed: ${String(e).substring(0, 100)}` };
    }
  },

  /** Google OAuth login */
  socialLogin: async (provider: 'google' | 'apple'): Promise<AuthResponse> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}?authCallback=true`,
        },
      });
      if (error) return { success: false, message: error.message };
      return { success: true, message: `Redirecting to ${provider}...` };
    } catch (e) {
      return { success: false, message: `${provider} login failed: ${String(e).substring(0, 100)}` };
    }
  },

  /** OTP verification (email confirmation via Supabase) */
  verifyOTP: async (otp: string, user: User): Promise<AuthResponse> => {
    try {
      // In Supabase, email verification happens via confirmation link in email
      // This is a mock verification that accepts any 6-digit code
      const clean = otp.replace(/\D/g, '');
      if (clean.length === 6) {
        // Create a verified version of the user
        return {
          success: true,
          message: 'Email verified successfully',
          user: { ...user, verified: true },
        };
      }
      return { success: false, message: 'Invalid OTP. Enter any 6 digits for demo.' };
    } catch (e) {
      return { success: false, message: `OTP verification failed: ${String(e).substring(0, 100)}` };
    }
  },

  /** Logout */
  logout: async () => {
    clearDemoSession();
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.log('Logout error:', e);
    }
  },

  /** Update profile */
  updateProfile: async (updates: Partial<User>): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates,
      });
      if (error) return { success: false, message: error.message };
      if (!data.user) return { success: false, message: 'Update failed' };

      const updatedUser = createUserFromAuth(data.user);
      return { success: true, message: 'Profile updated', user: updatedUser };
    } catch (e) {
      return { success: false, message: `Profile update failed: ${String(e).substring(0, 100)}` };
    }
  },
};
