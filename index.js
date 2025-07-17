import dotenv from 'dotenv';
import morgan from 'morgan';
import express from 'express';
import bodyParser from 'body-parser';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const PORT = 3000;
const app = express();

app.use(morgan('combined'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const supabase = createClient(process.env.PROJECT_URL, process.env.API_KEY);

app.get('/users', async (req, res) => {
    const {data, err} = await supabase
        .from('User')
        .select()
    res.send(data);
});



app.listen(PORT, () => console.log(`LISTENING ON PORT: ${PORT}`));