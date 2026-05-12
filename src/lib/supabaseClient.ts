import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zwbrhjofdggfjwsalrqt.supabase.co';
const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3YnJoam9mZGdnZmp3c2FscnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyOTU5MTMsImV4cCI6MjA4ODg3MTkxM30.U9gCDhZkYbM0l2ur8f8Uol4Wj_etfD6lmfgIGwLH7VE';
const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'zwbrhjofdggfjwsalrqt';

export const supabase = createClient(supabaseUrl, publicAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

export { projectId, publicAnonKey, supabaseUrl };
