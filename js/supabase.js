/**
 * HYNAOS — Supabase Client Initialization & Authentication Helper
 * Hyna Studio Management System
 */

// Replace these placeholders with your actual Supabase Project URL and Anon Public Key
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

// Removed DEMO_PROFILES to enforce strict real database connections

let supabaseClient = null;

// Initialize Supabase Client
function initSupabase() {
  if (
    typeof window.supabase !== "undefined" &&
    SUPABASE_URL !== "YOUR_SUPABASE_URL" &&
    SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY"
  ) {
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log("⚡ HYNAOS: Supabase client connected.");
    } catch (err) {
      console.warn("⚠️ HYNAOS: Failed to initialize Supabase client.", err);
    }
  } else {
    console.log("⚠️ HYNAOS: Missing Supabase URL or Anon Key. Initialization skipped.");
  }
}

// Call initialization immediately
initSupabase();

window.HYNAOS_SUPABASE = {
  getClient: () => supabaseClient
};
