# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src/ ./src/
COPY scripts/ ./scripts/

# Expose port
EXPOSE 5000

# Run seed script and start server
CMD npm run seed && npm run dev
