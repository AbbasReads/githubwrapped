FROM node:20-alpine

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ redis

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source files
COPY src/ ./src/
COPY public/ ./public/
COPY motia.config.ts ./
COPY tsconfig.json ./
COPY types.d.ts ./
COPY scripts/ ./scripts/

# Bundle static assets and build
RUN npm run build

# Expose port
EXPOSE 3000

# Start Redis in background and then the app
CMD redis-server --daemonize yes && npm run start
