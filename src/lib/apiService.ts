/**
 * HouseCom API Service
 * All calls go to the Supabase Edge Function (Hono server).
 * Auth is via Supabase JWT access tokens.
 */
import { supabase, projectId, publicAnonKey } from './supabaseClient';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/server`;

async function getToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || publicAnonKey;
}

async function request<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || json.message || 'Request failed');
  return json as T;
}

// ── SEED ─────────────────────────────────────────────────────────────────────
export const seed = () => request('/seed', { method: 'POST' });
export const resetSeed = () => request('/seed/reset', { method: 'POST' });
export const setupDemoUsers = () => request('/demo-setup', { method: 'POST' });

// ── PROPERTIES ───────────────────────────────────────────────────────────────
export interface PropertyFilters {
  county?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: string;
  verified?: boolean;
  landlordId?: string;
  limit?: number;
  search?: string;
}

export const getProperties = (filters: PropertyFilters = {}) => {
  const params = new URLSearchParams();
  if (filters.county) params.set('county', filters.county);
  if (filters.minPrice != null) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice != null) params.set('maxPrice', String(filters.maxPrice));
  if (filters.bedrooms) params.set('bedrooms', filters.bedrooms);
  if (filters.verified) params.set('verified', 'true');
  if (filters.landlordId) params.set('landlordId', filters.landlordId);
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  const qs = params.toString();
  return request(`/properties${qs ? '?' + qs : ''}`);
};

export const getProperty = (id: string) => request(`/properties/${id}`);

export const createProperty = (data: any) =>
  request('/properties', { method: 'POST', body: JSON.stringify(data) });

export const updateProperty = (id: string, data: any) =>
  request(`/properties/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteProperty = (id: string) =>
  request(`/properties/${id}`, { method: 'DELETE' });

export const verifyProperty = (id: string, verified: boolean) =>
  request(`/admin/properties/${id}/verify`, { method: 'PUT', body: JSON.stringify({ verified }) });

// ── SAVED PROPERTIES ─────────────────────────────────────────────────────────
export const getSaved = () => request('/saved');
export const saveProperty = (propertyId: string) =>
  request('/saved', { method: 'POST', body: JSON.stringify({ propertyId }) });
export const unsaveProperty = (propertyId: string) =>
  request(`/saved/${propertyId}`, { method: 'DELETE' });

// ── CHATS ────────────────────────────────────────────────────────────────────
export const getChats = () => request('/chats');
export const createOrGetChat = (propertyId: string, landlordId: string) =>
  request('/chats', { method: 'POST', body: JSON.stringify({ propertyId, landlordId }) });
export const getChatMessages = (chatId: string) => request(`/chats/${chatId}/messages`);
export const sendMessage = (chatId: string, text: string) =>
  request(`/chats/${chatId}/messages`, { method: 'POST', body: JSON.stringify({ text }) });

// ── PAYMENTS ─────────────────────────────────────────────────────────────────
export const getPayments = () => request('/payments');
export const createPayment = (data: {
  propertyId: string;
  amount: number;
  mpesaCode: string;
  month: string;
  mpesaTill?: string;
}) => request('/payments', { method: 'POST', body: JSON.stringify(data) });

// ── RATINGS ──────────────────────────────────────────────────────────────────
export const getRatings = (propertyId: string) => request(`/ratings/${propertyId}`);
export const submitRating = (data: { propertyId: string; score: number; comment: string }) =>
  request('/ratings', { method: 'POST', body: JSON.stringify(data) });

// ── FRAUD REPORTS ─────────────────────────────────────────────────────────────
export const submitFraudReport = (data: { propertyId: string; reason: string; details: string }) =>
  request('/fraud-reports', { method: 'POST', body: JSON.stringify(data) });

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
export const getNotifications = () => request('/notifications');

// ── USER PROFILE ─────────────────────────────────────────────────────────────
export const getUserProfile = () => request('/user/profile');
export const updateUserProfile = (data: any) =>
  request('/user/profile', { method: 'PUT', body: JSON.stringify(data) });

// ── ADMIN ─────────────────────────────────────────────────────────────────────
export const getAdminStats = () => request('/admin/stats');
export const getAdminProperties = () => request('/admin/properties');
export const getAdminUsers = () => request('/admin/users');
export const getAdminFraudReports = () => request('/admin/fraud-reports');
export const resolveReport = (id: string, status: string) =>
  request(`/admin/fraud-reports/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });

// ── TENANTS ────────────────────────────────────────────────────────────────
export const fetchTenants = () => request('/tenants');

export const updateRentStatus = (tenantId: string, status: boolean) =>
  request(`/tenants/${tenantId}/rent-status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });

// ── ADMIN MESSAGES ─────────────────────────────────────────────────────────
export const sendMessageToAdmin = (message: string) =>
  request('/admin/messages', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
