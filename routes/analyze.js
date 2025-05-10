import express from 'express';
import { VideoIntelligenceServiceClient } from '@google-cloud/video-intelligence';
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

    // Initialize Video Intelligence client
    const videoClient = new VideoIntelligenceServiceClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
    });

    // Configure the video analysis request
    const request = {
      inputUri: videourl,
      features: [
        'LABEL_DETECTION',
        'SPEECH_TRANSCRIPTION',
        'TEXT_DETECTION',
        'OBJECT_TRACKING'
      ],
      videoContext: {
        speechTranscriptionConfig: {
          languageCode: 'en-US',
          enableAutomaticPunctuation: true,
        },
      },
    };

    // Perform the video analysis
    const [operation] = await videoClient.annotateVideo(request);
    const [results] = await operation.promise();

    // Extract relevant information
    const videoData = {
      labels: results.labelAnnotations || [],
      speech: results.speechTranscriptions?.[0]?.alternatives?.[0]?.transcript || '',
      textDetections: results.textAnnotations || [],
      objects: results.objectAnnotations || []
    };

    // Use Gemini to generate a comprehensive analysis
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 8192,
      }
    });

    const analysisPrompt = `Analyze this video content:

    Detected Labels: ${JSON.stringify(videoData.labels)}
    Speech Transcript: ${videoData.speech}
    Detected Text: ${JSON.stringify(videoData.textDetections)}
    Detected Objects: ${JSON.stringify(videoData.objects)}

    Provide a comprehensive analysis including:
    1. Main content and topic
    2. Key moments and highlights
    3. Important text and speech content
    4. Visual elements and objects
    5. Overall context and purpose`;

    const result = await model.generateContent(analysisPrompt);
    const analysis = result.response.text();

    // Save to database
    const newVideo = new Video({
      url: videourl,
      analysis: {
        aiAnalysis: analysis,
        rawData: videoData
      }
    });
    await newVideo.save();

    res.json({
      success: true,
      analysis,
      videoData
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      details: error.message
    });
  }
});

export default router;