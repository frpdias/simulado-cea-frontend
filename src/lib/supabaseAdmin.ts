import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zcrzyhdzjanivracmoub.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpjcnp5aGR6amFuaXZyYWNtb3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNDUwOTEsImV4cCI6MjA3MzgyMTA5MX0.Vu-1TzpSxOJF1uQVCShuzqsG-EgYJiWVpwl1D4qUIzQ';

export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'supabase.auth.token.admin'
  }
});
