import dotnev from 'dotenv';
import morgan from 'morgan';
import express from 'express';
import bodyParser from "body-parser";
import {createClient} from '@supabase/supabase-js'

dotnev.config()
const app = express();


// using morgan for logs
app.use(morgan('combined'));

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

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
});


app.listen(3000, () => {
    console.log(`> Ready on http://localhost:3000`);
});

