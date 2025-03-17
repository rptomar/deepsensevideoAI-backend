import express from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import Video from '../models/video.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('video'), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload_stream(
      { resource_type: 'video' },
      async (error, result) => {
        if (error) return res.status(500).json({ error });

        const newVideo = new Video({ url: result.secure_url, publicId: result.public_id });
        await newVideo.save();

        res.json({ message: 'Upload successful', videoUrl: result.secure_url });
      }
    ).end(req.file.buffer);
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
