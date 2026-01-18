# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (caching layer)
COPY package*.json ./
RUN npm install

# Copy all source code
COPY . .

# Install Expo CLI globally
RUN npm install -g expo-cli

# Expose ports
# 8081 - Metro bundler
EXPOSE 8081 

# Start the app in development mode
CMD ["npm", "start"]