import express from 'express';
import axios from 'axios';
import Video from '../models/video.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { videoUrl, videoId } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2-flash:analyzeVideo`,
      { videoUrl },
      { headers: { 'Authorization': `Bearer ${API_KEY}` } }
    );

    const video = await Video.findById(videoId);
    if (video) {
      video.analysis = response.data;
      await video.save();
    }

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Analysis failed' });
  }
});

export default router;
