# Use official Python image
# Install system dependencies for OpenCV and Node
# Set workdir
# Copy backend files
# Install Python dependencies
# Build React frontend
# Return to backend directory
# Expose port (Railway will set $PORT)
# Start backend using absolute path
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy React app
COPY HackUKFrontEnd/my-app ./my-app

# Build React app
WORKDIR /app/my-app
RUN npm install && npm run build

# Install serve to serve static files
RUN npm install -g serve

# Expose port (Railway will set $PORT)
EXPOSE 5000

# Start static server
CMD ["serve", "-s", "build", "-l", "5000"]
