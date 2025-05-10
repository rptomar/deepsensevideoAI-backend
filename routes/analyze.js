import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Video from '../models/video.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { videourl } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!videourl) {
      return res.status(400).json({ error: 'videourl is required' });
    }

    console.log('Processing video:', videourl);

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    const generationConfig = {
      temperature: 0.7, // Reduced for more focused responses
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 8192,
    };

    const chatSession = model.startChat({
      generationConfig,
      history: []
    });

    // Improved prompt with more specific instructions
    const prompt = `Analyze this video: ${videourl}

    Please provide a detailed analysis with the following structure:

    1. Content Overview:
    - Main topic and purpose
    - Target audience
    - Duration and format

    2. Key Elements Analysis:
    - Main speakers/subjects
    - Important visual elements
    - Audio components (music, sound effects, voice)

    3. Timeline Breakdown:
    - Beginning (first 30%)
    - Middle (middle 40%)
    - End (final 30%)

    4. Technical Analysis:
    - Video quality
    - Audio quality
    - Production value

    Please be specific and detailed in your analysis.`;

    const result = await chatSession.sendMessage(prompt);
    const analysis = result.response.text();

    // Save analysis to database
    const newVideo = new Video({
      url: videourl,
      analysis: analysis
    });
    await newVideo.save();

    res.json({ 
      success: true,
      analysis,
      videoUrl: videourl
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: 'Analysis failed', 
      details: error.message 
    });
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