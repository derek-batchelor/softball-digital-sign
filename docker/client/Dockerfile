# Build stage
FROM node:24-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY src/client/package*.json ./src/client/
COPY src/shared/types/package*.json ./src/shared/types/

# Install dependencies
RUN npm install --workspace=src/client --workspace=src/shared/types

# Copy only necessary source files
COPY src/shared/types/src ./src/shared/types/src
COPY src/shared/types/tsconfig.json ./src/shared/types/
COPY src/client/src ./src/client/src
COPY src/client/index.html ./src/client/
COPY src/client/tsconfig*.json ./src/client/
COPY src/client/vite.config.ts ./src/client/
COPY src/client/tailwind.config.js ./src/client/
COPY src/client/postcss.config.js ./src/client/
COPY tsconfig.json ./

# Build shared types first
RUN npm run build --workspace=src/shared/types

# Build the application
RUN npm run build --workspace=src/client

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=build /app/src/client/dist /usr/share/nginx/html

# Copy nginx configuration
COPY docker/client/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
