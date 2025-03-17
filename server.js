import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import uploadRoute from './routes/upload.js';
import analyzeRoute from './routes/analyze.js';
import askRoute from './routes/ask.js';

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/upload', uploadRoute);
app.use('/deepsensevideo/analyze', analyzeRoute);
app.use('/api/ask', askRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
