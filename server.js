import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDb from './config/db.js';
import uploadRoute from './routes/upload.js';
import analyzeRoute from './routes/analyze.js';
import askRoute from './routes/analyze.js';
const port = process.env.LOCAL_PORT;

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


app.use('/api/upload', uploadRoute);
app.use('/deepsensevideo/analyze', analyzeRoute);
app.use('/analyze/ask', askRoute);

app.get('/', (req, res) => {
    res.send('Hii, how are you all set !');
  });

  connectDb()
  .then(() => {
    console.log('Connection successful to MongoDB');
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch((err) => console.log('Error connecting to MongoDB',err));
