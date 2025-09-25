# Use official Python image
FROM python:3.10-slim

# Install system dependencies for OpenCV and Node
RUN apt-get update && \
    apt-get install -y \
        libgl1 \
        libglib2.0-0 \
        libsm6 \
        libxext6 \
        libxrender1 \
        ffmpeg \
        nodejs \
        npm \
        gcc \
    && rm -rf /var/lib/apt/lists/*

# Set workdir
WORKDIR /app

# Copy backend files
COPY HackUKBackend ./HackUKBackend

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Build React frontend
COPY HackUKFrontEnd/my-app ./HackUKFrontEnd/my-app
WORKDIR /app/HackUKFrontEnd/my-app
RUN npm install && npm run build

# Return to backend directory
WORKDIR /app/HackUKBackend

# Expose port (Railway will set $PORT)
EXPOSE 5001

# Start backend
CMD ["python", "script.py"]
