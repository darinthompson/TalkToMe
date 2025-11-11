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

// Appointments helpers
const insertAppointment = async ({ user_id, title, start_time, end_time, location, notes }) => {
  const { data, error } = await supabase.from('Appointment').insert([
    { user_id, title, start_time, end_time, location, notes }
  ]).select();
  return { data, error: error?.message };
};

const fetchAppointmentsByDate = async (user_id, dateYYYYMMDD) => {
  // Expect start_time/end_time stored as timestamptz; filter by date portion
  const { data, error } = await supabase
    .from('Appointment')
    .select('*')
    .eq('user_id', user_id)
    .gte('start_time', `${dateYYYYMMDD}T00:00:00.000Z`)
    .lt('start_time', `${dateYYYYMMDD}T23:59:59.999Z`)
    .order('start_time', { ascending: true });
  return { data, error: error?.message };
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

const resetUserPassword = async ({email, password}) => {

  let password_hash;
  try {
    password_hash = await argon2.hash(password, argon2Options);
  } catch {
    return { error: "Fatal error trying to hash updated password." };
  }
  
  const {data: user, error} = await supabase
    .from("User")
    .update({password: password_hash})
    .eq("email", email)

  if(error) {
    try { await argon2.verify(DUMMY_HASH, password, argon2Options); } catch {}
    return { error: "Error updating password", isUpdated: false };
  }

  return {isUpdated: true};
}

// Daily Challenges helpers
const getUserDailyChallenges = async (user_id, date) => {
  const { data, error } = await supabase
    .from('user_daily_challenges')
    .select('*')
    .eq('user_id', user_id)
    .eq('date', date)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
    return { error: error.message };
  }

  return { data, error: null };
};

const insertUserDailyChallenges = async ({ user_id, date, daily_tasks, score }) => {
  const { data, error } = await supabase
    .from('user_daily_challenges')
    .insert([{ user_id, date, daily_tasks, score, version: 1 }])
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data, error: null };
};

const updateUserDailyChallenges = async ({ user_id, date, daily_tasks, score, current_version }) => {
  const { data, error } = await supabase
    .from('user_daily_challenges')
    .update({
      daily_tasks,
      score,
      updated_at: new Date().toISOString(),
      version: current_version + 1
    })
    .eq('user_id', user_id)
    .eq('date', date)
    .eq('version', current_version) // Optimistic locking
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data, error: null };
};

// Streaks helpers
const getUserStreaks = async (user_id) => {
  const { data, error } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', user_id)
    .single();

  if (error && error.code !== 'PGRST116') {
    return { error: error.message };
  }

  return { data, error: null };
};

const insertUserStreaks = async ({ user_id, current_streak, longest_streak, last_completion_date, perfect_days_count, total_tasks_completed }) => {
  const { data, error } = await supabase
    .from('user_streaks')
    .insert([{
      user_id,
      current_streak: current_streak || 0,
      longest_streak: longest_streak || 0,
      last_completion_date,
      perfect_days_count: perfect_days_count || 0,
      total_tasks_completed: total_tasks_completed || 0,
      version: 1
    }])
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data, error: null };
};

const updateUserStreaks = async ({ user_id, current_streak, longest_streak, last_completion_date, perfect_days_count, total_tasks_completed, current_version }) => {
  const { data, error } = await supabase
    .from('user_streaks')
    .update({
      current_streak,
      longest_streak,
      last_completion_date,
      perfect_days_count,
      total_tasks_completed,
      updated_at: new Date().toISOString(),
      version: current_version + 1
    })
    .eq('user_id', user_id)
    .eq('version', current_version) // Optimistic locking
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data, error: null };
};

// Achievements helpers
const getAllAchievements = async () => {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    return { error: error.message };
  }

  return { data: data || [], error: null };
};

const getUserAchievements = async (user_id) => {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', user_id);

  if (error) {
    return { error: error.message };
  }

  return { data: data || [], error: null };
};

const insertUserAchievement = async ({ user_id, achievement_id, progress, unlocked_at }) => {
  const { data, error } = await supabase
    .from('user_achievements')
    .insert([{
      user_id,
      achievement_id,
      progress: progress || 0,
      unlocked_at,
      version: 1
    }])
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data, error: null };
};

const updateUserAchievement = async ({ user_id, achievement_id, progress, unlocked_at, current_version }) => {
  const { data, error } = await supabase
    .from('user_achievements')
    .update({
      progress,
      unlocked_at,
      updated_at: new Date().toISOString(),
      version: current_version + 1
    })
    .eq('user_id', user_id)
    .eq('achievement_id', achievement_id)
    .eq('version', current_version) // Optimistic locking
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data, error: null };
};

const upsertUserAchievement = async ({ user_id, achievement_id, progress, unlocked_at }) => {
  const { data, error } = await supabase
    .from('user_achievements')
    .upsert({
      user_id,
      achievement_id,
      progress: progress || 0,
      unlocked_at,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,achievement_id'
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data, error: null };
};

const getTodaysUnlockedAchievements = async (user_id, date) => {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', user_id)
    .gte('unlocked_at', `${date}T00:00:00.000Z`)
    .lt('unlocked_at', `${date}T23:59:59.999Z`)
    .order('unlocked_at', { ascending: true });

  if (error) {
    return { error: error.message };
  }

  return { data: data || [], error: null };
};



export default {
  supabase,
  insertPrompt,
  registerUser,
  loginUser,
  resetUserPassword,
  fetchMoodHistoryByUserId,
  insertAppointment,
  fetchAppointmentsByDate,
  // Daily Challenges database operations
  getUserDailyChallenges,
  insertUserDailyChallenges,
  updateUserDailyChallenges,
  // Streaks database operations
  getUserStreaks,
  insertUserStreaks,
  updateUserStreaks,
  // Achievements database operations
  getAllAchievements,
  getUserAchievements,
  insertUserAchievement,
  updateUserAchievement,
  upsertUserAchievement,
  getTodaysUnlockedAchievements
};
