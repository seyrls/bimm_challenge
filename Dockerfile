# Dockerfile
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build the application
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy build artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/graphql ./src/graphql

# Expose the application port
EXPOSE 3000

# Run the application
CMD ["node", "dist/src/main.js"]