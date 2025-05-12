#!/usr/bin/env bash
# exit on error
set -o errexit

# Install FFmpeg
apt-get update
apt-get install -y ffmpeg

# Install dependencies
npm install 