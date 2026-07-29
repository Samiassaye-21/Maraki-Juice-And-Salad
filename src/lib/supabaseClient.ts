import { createClient } from '@supabase/supabase-js';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Fallback to a valid placeholder if the URL is missing or still the default text
if (!supabaseUrl.startsWith('http')) {
  console.warn('Supabase URL is missing or invalid. Falling back to placeholder so the app can load.');
  supabaseUrl = 'https://placeholder.supabase.co';
  supabaseAnonKey = 'placeholder';
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
