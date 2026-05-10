import { createClient } from "@supabase/supabase-js";

// Memasukkan URL langsung menggunakan string (tanda kutip)
const supabaseUrl = "https://ofvlynwceneqweyuxwmo.supabase.co";

// Ganti teks di bawah ini dengan Kunci Anon kamu yang panjang
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mdmx5bndjZW5lcXdleXV4d21vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNDYwMzIsImV4cCI6MjA5MzgyMjAzMn0.mtHcM8riQG8mOn-3cN5pfhuceLGQ01dha3hQaktMiU8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
