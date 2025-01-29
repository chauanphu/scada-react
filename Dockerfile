FROM node:20.16-alpine as builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source files and environment variables
COPY . .
COPY .env.production .env

# Build the application
RUN npm run build

# Stage 2: Serve using nginx
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port and start server
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]