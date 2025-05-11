import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Video from "../models/video.js";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobe from "@ffprobe-installer/ffprobe";
import * as tf from '@tensorflow/tfjs-node';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import fs from 'fs';

const router = express.Router();
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobe.path);

router.post("/", async (req, res) => {
  try {
    const { videourl } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!videourl) {
      return res.status(400).json({ error: "videourl is required" });
    }

    // Load COCO-SSD model
    const model = await cocoSsd.load();

    // Extract frames from video using ffmpeg
    const extractedFrames = [];

    await new Promise((resolve, reject) => {
      ffmpeg(videourl)
        .screenshots({
          count: 5,
          folder: '/tmp',
          filename: 'frame-%i.png',
          size: '640x?'
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (err) => {
          reject(err);
        });
    });

    // Analyze frames
    const detections = [];
    for (let i = 1; i <= 5; i++) {
      const img = tf.node.decodeImage(fs.readFileSync(`/tmp/frame-${i}.png`));
      const predictions = await model.detect(img);
      detections.push(...predictions);
    }

    // Process detections
    const objectCounts = {};
    detections.forEach(detection => {
      if (!objectCounts[detection.class]) {
        objectCounts[detection.class] = 1;
      } else {
        objectCounts[detection.class]++;
      }
    });

    const analysis = {
      objects: Object.entries(objectCounts).map(([name, count]) => ({
        name,
        count,
        confidence: detections.find(d => d.class === name)?.score || 0
      })),
      summary: `Video contains ${Object.entries(objectCounts)
        .map(([name, count]) => `${count} ${name}(s)`)
        .join(', ')}`
    };

    // Save to database
    const newVideo = new Video({
      url: videourl,
      analysis: analysis,
    });
    await newVideo.save();

    res.json({
      success: true,
      analysis,
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