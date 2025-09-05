# Dockerfile cho Zk Music's Discord Bot
FROM node:21-alpine AS base

# Cài đặt các dependencies cần thiết cho canvas và build
RUN apk add --no-cache \
  python3 \
  make \
  g++ \
  gcc \
  libc6-compat \
  cairo-dev \
  jpeg-dev \
  giflib-dev \
  librsvg-dev \
  pango-dev \
  pixman-dev \
  pkgconfig

# Tạo thư mục ứng dụng
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install && npm ci --omit=dev && npm cache clean --force

# Production stage
FROM node:21-alpine AS production

# Cài đặt các dependencies runtime
RUN apk add --no-cache \
  cairo \
  jpeg \
  giflib \
  librsvg \
  pango \
  pixman \
  pkgconfig \
  python3 \
  ffmpeg

# Tạo user không phải root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S zkmusic -u 1001

# Tạo thư mục ứng dụng
WORKDIR /app

# Copy dependencies từ base stage
COPY --from=base --chown=zkmusic:nodejs /app/node_modules ./node_modules

# Copy source code
COPY --chown=zkmusic:nodejs . .

# Build ứng dụng
RUN npm run build && npm run build:data

# Chuyển sang user không phải root
USER zkmusic

# Expose port cho web server (tùy chọn)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node --version || exit 1

# Start ứng dụng
CMD ["npm", "run", "start"]
