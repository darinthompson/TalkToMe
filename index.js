import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createClient } from '@supabase/supabase-js';
import openAIRoutes from './backend/routes/openAIRoutes.js';
import userRoutes from './backend/routes/userRoutes.js';
import journalRoutes from './backend/routes/journalRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Set up routes
app.use('/api/ai', openAIRoutes);
app.use('/api/user', userRoutes);
app.use('/api/journal', journalRoutes);

// Error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

app.listen(3000, () => {
  console.log(`> Ready on http://localhost:3000`);
});