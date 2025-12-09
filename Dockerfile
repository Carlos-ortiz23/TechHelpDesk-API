# Development Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code (will be overwritten by volume mount)
COPY . .

# Expose port
EXPOSE 8080

# Start in development mode with hot reload
CMD ["npm", "run", "start:dev"]
