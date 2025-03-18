import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Video from '../models/video.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { videourl } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;

    // Validate if videoUrl exists
    if (!videourl) {
      return res.status(400).json({ error: 'videourl is required' });
    }

    console.log('Video URL:', videourl);
    
    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    // Configuration for the model
    const generationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: "text/plain",
    };

    // Start chat session with initial prompt
    const chatSession = model.startChat({
      generationConfig,
      history: []
    });

    // Send message with video analysis prompt
    const prompt = `Using this video: ${videourl}, please analyze and provide the following information:
    1. What is the main subject/topic of the video?
    2. What are the key moments or highlights?
    3. Provide a detailed summary of the content
    4. Any notable elements (music, effects, transitions, etc.)`;

    const result = await chatSession.sendMessage(prompt);
    const analysis = result.response.text();

    // Create and save new video document with analysis
    const newVideo = new Video({
      url: videourl,
      analysis: analysis
    });
    await newVideo.save();

    // Return the analysis data
    res.json({ analysis });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Analysis failed', details: error.message });
  }
});

// New endpoint for asking questions about a video
router.post('/ask', async (req, res) => {
  try {
    const { videourl, question } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!videourl || !question) {
      return res.status(400).json({ error: 'videourl and question are required' });
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    const generationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: "text/plain",
    };

    // Start chat session with context and history
    const chatSession = model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [{ text: `Using this video: ${videourl}, please analyze it thoroughly.` }]
        },
        {
          role: "model",
          parts: [{ text: "I have analyzed the video and am ready to answer questions about it." }]
        }
      ]
    });

    // Send the user's specific question
    const result = await chatSession.sendMessage(question);
    const answer = result.response.text();

    // Return the answer
    res.json({ answer });
  } catch (error) {
    console.error('Question answering error:', error);
    res.status(500).json({ error: 'Failed to answer question', details: error.message });
  }
});

export default router;
