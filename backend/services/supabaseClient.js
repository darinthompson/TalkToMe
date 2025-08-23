import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const insertPrompt = async ({ user_journal, user_response, user_mood, user_id }) => {
  return await supabase.from('Prompt').insert([
    { user_journal, user_response, user_mood, user_id }
  ]);
};

const registerUser = async ({ username, firstName, lastName, email, password }) => {
  const { data: existing } = await supabase
    .from('User')
    .select('id')
    .eq('username', username)
    .single();
  if (existing) {
    return { error: 'Username already exists.' };
  }
  const { data, error } = await supabase
    .from('User')
    .insert([
      { username, first_name: firstName, last_name: lastName, email, password }
    ])
    .select()
    .single();
  if (error) {
    return { error: error.message };
  }
  // Return flat user info
  return {
    id: data.id,
    username: data.username,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email
  };
};

const loginUser = async ({ username, password }) => {
  const { data, error } = await supabase
    .from('User')
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .single();
  if (error || !data) {
    return { error: 'Incorrect username or password.' };
  }
  // Return flat user info
  return {
    id: data.id,
    username: data.username,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email
  };
};

export default {
  supabase,
  insertPrompt,
  registerUser,
  loginUser
};
