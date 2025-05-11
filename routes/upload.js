
import express from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import Video from '../models/video.js';

const router = express.Router();
// Configure multer with file size limit and file filter
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

router.post('/', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    // Create a promise to handle the upload
    const uploadPromise = new Promise((resolve, reject) => {
      let uploadProgress = 0;

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          chunk_size: 6000000, // 6MB chunks
          timeout: 600000, // 10 minutes timeout
        },
        async (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      // Handle upload progress
      uploadStream.on('progress', (progress) => {
        uploadProgress = Math.round((progress.bytes * 100) / progress.total_bytes);
        // You can emit this progress to the client if needed
        console.log(`Upload progress: ${uploadProgress}%`);
      });

      uploadStream.end(req.file.buffer);
    });

    const result = await uploadPromise;
    
    // Save video details to database
    const newVideo = new Video({
      url: result.secure_url,
      publicId: result.public_id,
    });
    await newVideo.save();

    res.json({
      message: 'Upload successful',
      videoUrl: result.secure_url,
      publicId: result.public_id
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      details: error.message
    });
  }
});

export default router;
