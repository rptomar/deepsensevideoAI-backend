import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { question, analysis } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2-flash:generateContent`,
      { prompt: `Based on this video analysis: 
      ${JSON.stringify(analysis)}, answer: ${question}` },
      { headers: { 'Authorization': `Bearer ${API_KEY}` } }
    );

    res.json(response.data);
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to process question' });
  }
});

export default router;
