import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Video from "../models/video.js";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import pkg from "node-video-lib";
const { extractFrames } = pkg;
import axios from "axios";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { videourl } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!videourl) {
      return res.status(400).json({ error: "videourl is required" });
    }

    // Download video and extract frames
    const response = await axios({
      url: videourl,
      method: "GET",
      responseType: "arraybuffer",
    });

    // Extract video metadata and key frames
    const videoData = {
      duration: 0,
      frames: [],
      metadata: {},
    };

    // Process video with ffmpeg
    await new Promise((resolve, reject) => {
      ffmpeg(videourl)
        .screenshots({
          count: 5,
          folder: "/tmp",
          filename: "thumbnail-%i.png",
        })
        .ffprobe((err, data) => {
          if (!err) {
            videoData.metadata = data.format;
            videoData.duration = data.format.duration;
          }
        })
        .on("end", resolve)
        .on("error", reject);
    });

    // Use Gemini Pro for analysis
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 8192,
      },
    });

    const analysisPrompt = `Analyze this video content:
    Video Duration: ${videoData.duration} seconds
    Video Format: ${videoData.metadata.format_name}
    Video Resolution: ${videoData.metadata.width}x${videoData.metadata.height}

    Please provide a comprehensive analysis including:
    1. Technical overview of the video
    2. Estimated content type and purpose
    3. Suggested improvements or recommendations`;

    const result = await model.generateContent(analysisPrompt);
    const analysis = result.response.text();

    // Save to database
    const newVideo = new Video({
      url: videourl,
      analysis: {
        aiAnalysis: analysis,
        metadata: videoData.metadata,
      },
    });
    await newVideo.save();

    res.json({
      success: true,
      analysis,
      metadata: videoData.metadata,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({
      error: "Analysis failed",

      details: error.message,
    });
  }
});

export default router;
