
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('CRITICAL ERROR: Supabase URL or Anon Key is missing!');
    console.info('Site is running in production mode. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your hosting (Netlify/Vercel) environment variables.');
}

// Ensure the app doesn't crash immediately if keys are missing
export const supabase = createClient(
    supabaseUrl || 'https://placeholder-url.supabase.co',
    supabaseAnonKey || 'placeholder-key'
);
