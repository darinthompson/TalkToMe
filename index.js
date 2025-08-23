<<<<<<< HEAD
<<<<<<< HEAD
=======

>>>>>>> 96ccc20 (WIP: save progress before rebase)
import dotenv from 'dotenv';
=======
import dotnev from 'dotenv';
>>>>>>> f81b56a (Set up and getting sample user data)
import morgan from 'morgan';
import express from 'express';
import cors from 'cors';
import bodyParser from "body-parser";
<<<<<<< HEAD
import openAIRoutes from './Routes/openAIRoutes.js'
<<<<<<< HEAD

dotenv.config()
=======
import dotnev from 'dotenv';
import morgan from 'morgan';
import express from 'express';
import bodyParser from "body-parser";
import {createClient} from '@supabase/supabase-js'
=======
>>>>>>> 8483b22 (built simple back-end to consume openAPI request)

<<<<<<< HEAD
dotnev.config()
>>>>>>> 40f68be (Set up and getting sample user data)
=======
=======
import { createClient } from '@supabase/supabase-js';
import openAIRoutes from './backend/routes/openAIRoutes.js';
import userRoutes from './backend/routes/userRoutes.js';
import journalRoutes from './backend/routes/journalRoutes.js';

dotenv.config();

<<<<<<< HEAD
>>>>>>> 931f1a3 (WIP: save progress before rebase)
<<<<<<< HEAD
dotenv.config()
=======
dotnev.config()
>>>>>>> f81b56a (Set up and getting sample user data)
<<<<<<< HEAD
>>>>>>> bebb433 (Set up and getting sample user data)
=======
=======
>>>>>>> 96ccc20 (WIP: save progress before rebase)
>>>>>>> 931f1a3 (WIP: save progress before rebase)
const app = express();
app.use(cors());

// Using morgan for logs
app.use(morgan('combined'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
app.use('/api/ai', openAIRoutes);
const supabase = createClient(process.env.SUPABASE_PROJECT_URL, process.env.SUPABASE_API_KEY);


app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
=======
const supabase = createClient(process.env.PROJECT_URL, process.env.API_KEY);

app.get('/users', async (req, res) => {
    const { data, error } = await supabase
        .from('User')
        .select();

    if (error) {
        console.error("Supabase error:", error);
        return res.status(500).json({ error: error.message });
    }

    res.json(data);
>>>>>>> 40f68be (Set up and getting sample user data)
=======
=======
>>>>>>> bb38ab5 (added .gitignore about to fix the api key issue)
=======
>>>>>>> 931f1a3 (WIP: save progress before rebase)
app.use('/api/ai', openAIRoutes);
=======
const supabase = createClient(process.env.SUPABASE_PROJECT_URL, process.env.SUPABASE_API_KEY);
>>>>>>> 4854003 (added .gitignore about to fix the api key issue)
=======
// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

>>>>>>> 96ccc20 (WIP: save progress before rebase)

// Set up routes
app.use('/api/ai', openAIRoutes);
app.use('/api/user', userRoutes);
app.use('/api/journal', journalRoutes);

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
>>>>>>> 8483b22 (built simple back-end to consume openAPI request)
});

app.listen(3000, () => {
  console.log(`> Ready on http://localhost:3000`);
});