<<<<<<< HEAD
import dotenv from 'dotenv';
=======
import dotnev from 'dotenv';
>>>>>>> f81b56a (Set up and getting sample user data)
import morgan from 'morgan';
import express from 'express';
import bodyParser from "body-parser";
import openAIRoutes from './Routes/openAIRoutes.js'

dotenv.config()
=======
import dotnev from 'dotenv';
import morgan from 'morgan';
import express from 'express';
import bodyParser from "body-parser";
import {createClient} from '@supabase/supabase-js'

<<<<<<< HEAD
dotnev.config()
>>>>>>> 40f68be (Set up and getting sample user data)
=======
<<<<<<< HEAD
dotenv.config()
=======
dotnev.config()
>>>>>>> f81b56a (Set up and getting sample user data)
>>>>>>> bebb433 (Set up and getting sample user data)
const app = express();


// using morgan for logs
app.use(morgan('combined'));

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

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
});


app.listen(3000, () => {
    console.log(`> Ready on http://localhost:3000`);
});

