# deepsensevideoAI-backend

## Overview
This project is a backend for an AI-Powered Video Analysis tool, developed as part of a Full-Stack Developer assignment. The application allows users to upload short videos (up to 10 minutes) and leverages AI to automatically analyze and extract meaningful text information from the content. This tool demonstrates the integration of video processing with AI analysis in a practical business application.

## Setup Instructions

### Prerequisites
- Node.js (v14 or later)
- MongoDB (or another database of your choice)
- Cloud storage account (AWS S3, Firebase Storage, etc.)
- API key for Google gemini 2.0 Flash or a similar AI model

### Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/rptomar/deepsensevideoAI-backend.git
   cd deepsensevideoAI-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory and add the following:
   ```plaintext
   MONGODB_URI=your_mongodb_connection_string
   GEMINI_API_KEY=your_gemini_api_key
   CLOUD_STORAGE_KEY=your_cloud_storage_key
   ```

4. **Run the server:**
   ```bash
   npm run dev
   ```

## Features Implemented
- **Video Upload & Processing:** Users can upload videos up to 10 minutes long for AI analysis.
- **AI Analysis Dashboard:** Automatically generates a comprehensive text analysis, including transcription, summary, object detection, and sentiment analysis.
- **Interactive Q&A:** Users can ask questions about the video content, and the AI provides relevant answers.
- **Responsive Design:** Ensures a clean and intuitive interface across devices.

## Technical Decisions and Trade-offs
- **Database Choice:** MongoDB was chosen for its flexibility and ease of use with Node.js. Alternatives like Supabase or Firebase could be considered for real-time capabilities.
- **AI Model:** Google gemini 2.0 Flash  was selected for its advanced capabilities in video analysis. Other models could be explored for specific use cases.
- **Backend Framework:** Node.js was used for its non-blocking architecture, which is ideal for handling multiple video uploads and processing tasks concurrently.

## What I Would Improve with More Time
- **Enhanced AI Capabilities:** Integrate more advanced AI models for deeper analysis, such as emotion detection or scene segmentation.

- **Export Features:** Allow users to export analysis results in various formats, such as PDF or CSV.
- **Performance Optimization:** Optimize video processing and AI analysis for faster response times.
- **Error Handling:** Improve error handling and user feedback for failed uploads or processing errors.

## Conclusion
This backend project showcases the integration of video processing and AI analysis, providing a foundation for building a comprehensive AI-powered video analysis tool. With further development, it can be expanded to include more advanced features and capabilities.
