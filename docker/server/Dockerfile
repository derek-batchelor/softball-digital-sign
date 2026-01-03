# Build stage
FROM node:24-alpine AS build

WORKDIR /app

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY src/server/package*.json ./src/server/
COPY shared/types/package*.json ./shared/types/

# Install dependencies
RUN npm install --workspace=src/server --workspace=shared/types

# Copy only necessary source files
COPY shared/types/src ./shared/types/src
COPY shared/types/tsconfig.json ./shared/types/
COPY src/server/src ./src/server/src
COPY src/server/tsconfig*.json ./src/server/
COPY src/server/nest-cli.json ./src/server/
COPY tsconfig.json ./

# Build shared types first
RUN npm run build --workspace=shared/types

# Build the application
RUN npm run build --workspace=src/server

# Production stage
FROM node:24-alpine

WORKDIR /app

# Install runtime dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY src/server/package*.json ./src/server/
COPY shared/types/package*.json ./shared/types/

# Install production dependencies only
RUN npm install --workspace=src/server --workspace=shared/types --omit=dev

# Copy built application and shared types
COPY --from=build /app/src/server/dist ./src/server/dist
COPY --from=build /app/shared/types/dist ./shared/types/dist
COPY --from=build /app/shared/types/package.json ./shared/types/package.json

# Create directories for volume mounts
RUN mkdir -p /app/media /app/data && \
    chown -R node:node /app/media /app/data

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "src/server/dist/main"]
