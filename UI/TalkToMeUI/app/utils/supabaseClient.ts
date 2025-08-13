import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tftasaprvaftoqarrpkc.supabase.co';
const SUPABASE_ANON_KEY = 'API_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// User table helpers
export async function registerUser({ username, firstName, lastName, email, password }) {
  console.log('registerUser called:', { username, firstName, lastName, email });
  // Check if username exists
  const { data: existing, error: existError } = await supabase
    .from('User')
    .select('id')
    .eq('username', username)
    .single();
  console.log('Check username result:', { existing, existError });
  if (existing) {
    return { error: 'Username already exists.' };
  }
  // Insert new user
  const { data, error } = await supabase
    .from('User')
    .insert([
      { username, first_name: firstName, last_name: lastName, email, password }
    ])
    .select()
    .single();
  console.log('Insert user result:', { data, error });
  if (error) {
    return { error: error.message };
  }
  return { data };
}

export async function loginUser({ username, password }) {
  console.log('loginUser called:', { username });
  const { data, error } = await supabase
    .from('User')
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .single();
  console.log('Login result:', { data, error });
  if (error || !data) {
    return { error: 'Incorrect username or password.' };
  }
  return { data };
}
