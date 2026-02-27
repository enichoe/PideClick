// Configuración inicial de Supabase
// Reemplaza estas credenciales con las de tu proyecto en Supabase (Project Settings -> API)
const SUPABASE_URL = 'https://hybngvgfigqzwpvvrmek.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5Ym5ndmdmaWdxendwdnZybWVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNTY0NDIsImV4cCI6MjA4NzczMjQ0Mn0.aLZE3ej05cEC-sX-IDLTLrxDlywMkAC78pMaSsIZFAQ';

// La librería cargada por CDN expone el objeto global 'supabase'
const { createClient } = supabase;
const supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.supabaseClient = supabaseInstance;
