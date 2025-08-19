import dotenv from 'dotenv';
import morgan from 'morgan';
import express from 'express';
import bodyParser from "body-parser";
import openAIRoutes from './Routes/openAIRoutes.js'

dotenv.config()
const app = express();


// using morgan for logs
app.use(morgan('combined'));

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use('/api/ai', openAIRoutes);
const supabase = createClient(process.env.SUPABASE_PROJECT_URL, process.env.SUPABASE_API_KEY);


app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});


app.listen(3000, () => {
    console.log(`> Ready on http://localhost:3000`);
});

