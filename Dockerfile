# Dockerfile tối thiểu cho Zk Music's Discord Bot
FROM node:lts-alpine

# Cài dependencies runtime cần cho canvas + ffmpeg
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

# Copy package files và cài dependencies
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy source code
COPY . .

# Build ứng dụng
RUN npm run build || echo "⚠️ Bỏ qua build nếu không có script build"
RUN npm run build:data || echo "⚠️ Bỏ qua copy data nếu không có script"

# Expose port (nếu có web dashboard)
EXPOSE 3000

# Start bot
CMD ["npm", "run", "start"]
