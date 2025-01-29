FROM node:20.16-alpine as builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source files and environment variables
COPY . .
RUN echo "VITE_API_URL=${VITE_API_URL}" >> .env.production
RUN echo "VITE_WS_URL=${VITE_WS_URL}" >> .env.production

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