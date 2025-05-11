import express from "express";
import Video from "../models/video.js";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobe from "@ffprobe-installer/ffprobe";
import fs from 'fs';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import Jimp from 'jimp';

const router = express.Router();
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobe.path);

router.post("/", async (req, res) => {
  try {
    const { videourl } = req.body;
    if (!videourl) {
      return res.status(400).json({ error: "videourl is required" });
    }

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

    // Load MobileNet model
    const model = await mobilenet.load();

    // Analyze frames
    const detections = [];
    for (let i = 1; i <= 5; i++) {
      const imagePath = `/tmp/frame-${i}.png`;
      
      // Process image with Jimp
      const image = await Jimp.read(imagePath);
      image.resize(224, 224); // MobileNet expects 224x224 images
      
      // Convert Jimp image to tensor
      const imageData = new Float32Array(224 * 224 * 3);
      let idx = 0;
      
      // Process each pixel
      for (let y = 0; y < 224; y++) {
        for (let x = 0; x < 224; x++) {
          const pixel = image.getPixelColor(x, y);
          const { r, g, b } = Jimp.intToRGBA(pixel);
          
          // Normalize pixel values to [0, 1]
          imageData[idx] = r / 255.0;
          imageData[idx + 1] = g / 255.0;
          imageData[idx + 2] = b / 255.0;
          idx += 3;
        }
      }
      
      // Create tensor with correct shape
      const tensor = tf.tensor3d(imageData, [224, 224, 3]);
      
      // Get predictions
      const predictions = await model.classify(tensor);
      detections.push(...predictions);
      
      // Clean up tensor
      tensor.dispose();
    }

    // Process detections
    const objectCounts = {};
    detections.forEach(detection => {
      if (!objectCounts[detection.className]) {
        objectCounts[detection.className] = 1;
      } else {
        objectCounts[detection.className]++;
      }
    });

    const detectedObjects = Object.entries(objectCounts).map(([name, count]) => ({
      name,
      count,
      confidence: Math.round((detections.find(d => d.className === name)?.probability || 0) * 100)
    }));

    const analysis = {
      detectedObjects,
      summary: detectedObjects.length > 0 
        ? `Video contains ${detectedObjects
            .map(obj => `${obj.count} ${obj.name}(s)`)
            .join(', ')}`
        : "No objects detected in video"
    };

    // Save to database
    const newVideo = new Video({
      url: videourl,
      analysis: analysis,
    });
    await newVideo.save();

    res.json({
      success: true,
      detectedObjects: analysis.detectedObjects,
      summary: analysis.summary
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