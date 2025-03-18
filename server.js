import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import uploadRoute from './routes/upload.js';
import analyzeRoute from './routes/analyze.js';
import askRoute from './routes/ask.js';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.DATABASE_URL; // Make sure this is defined in your .env file

// Check if MONGODB_URI is defined
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

try {
  await mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('Connected to MongoDB successfully');
} catch (error) {
  console.error('MongoDB Connection Error:', error);
}

app.use('/api/upload', uploadRoute);
app.use('/deepsensevideo/analyze', analyzeRoute);
app.use('/api/ask', askRoute);

const PORT = process.env.LOCAL_PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
