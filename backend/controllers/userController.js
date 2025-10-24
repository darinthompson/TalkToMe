import supabaseClient from '../services/supabaseClient.js';

async function loginUser(req, res) {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }
  const result = await supabaseClient.loginUser({ username, password });
  if (result.error || !result.id) {
    return res.status(401).json({ error: result.error || 'Incorrect username or password' });
  }
  res.json(result);
}

async function registerUser(req, res) {
  const { username, firstName, lastName, email, password } = req.body || {};
  if (!username || !firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const result = await supabaseClient.registerUser({ username, firstName, lastName, email, password });
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.json(result);
}

const resetUserPassword = async (req, res) => {
  const {email, password} = req.body || {};

  console.log('BODY: ', email, password);
  if(!email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const result = await supabaseClient.resetUserPassword({ email, password });
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.json(result);
}

export default {
  loginUser,
  registerUser,
  resetUserPassword
};
