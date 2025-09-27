import * as argon2 from "argon2";
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const DUMMY_HASH = process.env.ARGON2_DUMMY_HASH;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const argon2Options = {
  type: argon2.argon2id,
  timeCost: 3,
  memoryCost: 19456, // ~19 MB
  parallelism: 1,
  hashLength: 32,
  version: 0x13
};

const insertPrompt = async ({ user_journal, user_response, user_mood, user_id }) => {
  return await supabase.from('Prompt').insert([
    { user_journal, user_response, user_mood, user_id }
  ]);
};

const fetchMoodHistoryByUserId = async (user_id) => {
  const {data, error} = await supabase
    .from('Prompt')
    .select('*')
    .eq('user_id', user_id);

    if(!data || error) {
      return {error: error.message}
    }

    return {data: data ?? [], error};

}

const registerUser = async ({ username, firstName, lastName, email, password }) => {
  const { data: existing } = await supabase
    .from('User')
    .select('id')
    .eq('username', username)
    .single();
  if (existing) {
    return { error: 'Username already exists.' };
  }
  
  let password_hash;
  try {
    password_hash = await argon2.hash(password, argon2Options);
  } catch {
    return { error: "Fatal error trying to hash password." };
  }
  
  const { data, error } = await supabase
    .from('User')
    .insert([
      { username, first_name: firstName, last_name: lastName, email, password: password_hash }
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


async function loginUser({ username, password }) {
  const { data: user, error } = await supabase
    .from("User")
    .select("id, username, first_name, last_name, email, password")
    .eq("username", username)
    .maybeSingle();

  if (error || !user) {
    // We do this to prevent bad actors from knowing if the password or the username was wrong. Fakes a password call.
    try { await argon2.verify(DUMMY_HASH, password, argon2Options); } catch {}
    return { error: "Incorrect username or password." };
  }

  let ok = false;
  try { ok = await argon2.verify(user.password, password, argon2Options); } catch { ok = false; }
  if (!ok) return { error: "Incorrect username or password." };

  return { id: user.id, username: user.username, firstName: user.first_name, lastName: user.last_name, email: user.email };
}

export default {
  supabase,
  insertPrompt,
  registerUser,
  loginUser,
  fetchMoodHistoryByUserId
};
