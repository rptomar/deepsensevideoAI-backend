import mongoose from 'mongoose';

const VideoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  //publicId: { type: String, required: true },
  analysis: { type: Object }, // Store AI-generated analysis
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Video', VideoSchema);
