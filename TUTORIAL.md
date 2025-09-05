# 📚 Tutorial Chi Tiết - Zk Music's

## 🎯 Mục lục
1. [Cài đặt cơ bản](#1-cài-đặt-cơ-bản)
2. [Cấu hình Lavalink](#2-cấu-hình-lavalink)
3. [Cấu hình Database](#3-cấu-hình-database)
4. [Cài đặt Premium](#4-cài-đặt-premium)
5. [Tích hợp Web Dashboard](#5-tích-hợp-web-dashboard)
6. [Tùy chỉnh giao diện](#6-tùy-chỉnh-giao-diện)
7. [Troubleshooting nâng cao](#7-troubleshooting-nâng-cao)

---

## 1. Cài đặt cơ bản

### Bước 1: Chuẩn bị môi trường
```bash
# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài đặt Node.js 18 (khuyến nghị)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Cài đặt Java 17 (cho Lavalink)
sudo apt install openjdk-17-jre-headless -y

# Kiểm tra phiên bản
node --version  # >= 16.0.0
npm --version   # >= 7.0.0
java --version  # >= 17
```

### Bước 2: Tạo Discord Bot
1. Truy cập [Discord Developer Portal](https://discord.com/developers/applications)
2. Tạo ứng dụng mới
3. Chuyển đến tab "Bot"
4. Tạo bot và copy token
5. Mời bot vào server với quyền:
   - Send Messages
   - Use Slash Commands
   - Connect
   - Speak
   - Use Voice Activity

### Bước 3: Cấu hình cơ bản
```yaml
# config.yml
bot:
  TOKEN: "YOUR_BOT_TOKEN"
  OWNER_ID: "YOUR_DISCORD_ID"
  ADMIN: ["ADMIN_ID_1", "ADMIN_ID_2"]
  DEFAULT_VOLUME: 50
  LANGUAGE: "vi"

features:
  WebServer:
    enable: true
    Port: 3000
  RestAPI:
    enable: true
    auth: "your_secure_password"
```

---

## 2. Cấu hình Lavalink

### Phương pháp 1: Sử dụng Lavalink miễn phí
```yaml
lavalink:
  NODES:
    - host: "lavalink-v4.ajieblogs.eu.org"
      port: 80
      name: "zkmusic"
      auth: "https://dsc.gg/ajieblogs"
      secure: false
      driver: "lavalink/v4"
```

### Phương pháp 2: Tự host Lavalink (Khuyến nghị)
```bash
# Tạo thư mục Lavalink
mkdir lavalink && cd lavalink

# Tải Lavalink
wget https://github.com/lavalink-devs/Lavalink/releases/download/4.0.8/Lavalink.jar

# Tạo file cấu hình
nano application.yml
```

```yaml
server:
  port: 2333
  address: 0.0.0.0

lavalink:
  server:
    password: "your_secure_password"
    sources:
      youtube: true
      bandcamp: true
      soundcloud: true
      twitch: true
      vimeo: true
      http: true
      local: false

plugins:
  - dependency: "com.github.Topis-Lavalink-Plugins:Topis-Source-Managers-Plugin:1.2"
    repository: "https://jitpack.io"

metrics:
  prometheus:
    enabled: false
    endpoint: /metrics

sentry:
  dsn: ""
  environment: ""

logging:
  file:
    max-history: 30
    max-size: 1GB
  path: ./logs/

  level:
    root: INFO
    lavalink: INFO
```

```bash
# Chạy Lavalink
java -jar Lavalink.jar
```

### Phương pháp 3: Sử dụng Docker
```bash
# Tạo docker-compose.yml
nano docker-compose.yml
```

```yaml
version: '3.8'
services:
  lavalink:
    image: fredboat/lavalink:4.0.8
    container_name: lavalink
    restart: unless-stopped
    ports:
      - "2333:2333"
    volumes:
      - ./application.yml:/opt/Lavalink/application.yml
    environment:
      - JAVA_OPTS=-Xmx2G
```

```bash
docker-compose up -d
```

---

## 3. Cấu hình Database

### MySQL Setup
```bash
# Cài đặt MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Tạo database
mysql -u root -p
```

```sql
CREATE DATABASE zkmusic;
CREATE USER 'zkmusic'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON zkmusic.* TO 'zkmusic'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

```yaml
# config.yml
database:
  driver: "mysql"
  host: "localhost"
  port: 3306
  user: "zkmusic"
  password: "your_password"
  database: "zkmusic"
```

### MongoDB Setup
```bash
# Cài đặt MongoDB
sudo apt install mongodb -y
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Tạo database
mongosh
```

```javascript
use zkmusic
db.createUser({
  user: "zkmusic",
  pwd: "your_password",
  roles: ["readWrite"]
})
```

```yaml
# config.yml
database:
  driver: "mongodb"
  url: "mongodb://zkmusic:your_password@localhost:27017/zkmusic"
```

### PostgreSQL Setup
```bash
# Cài đặt PostgreSQL
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo -u postgres psql
```

```sql
CREATE DATABASE zkmusic;
CREATE USER zkmusic WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE zkmusic TO zkmusic;
\q
```

```yaml
# config.yml
database:
  driver: "postgres"
  host: "localhost"
  port: 5432
  user: "zkmusic"
  password: "your_password"
  database: "zkmusic"
```

---

## 4. Cài đặt Premium

### Bước 1: Tạo Server Premium
1. Tạo server Discord riêng cho Premium
2. Tạo role "Premium" với màu đặc biệt
3. Thiết lập quyền cho role Premium

### Bước 2: Cấu hình Premium
```yaml
PremiumRole:
  GuildID: "YOUR_PREMIUM_SERVER_ID"
  RoleID: "YOUR_PREMIUM_ROLE_ID"
```

### Bước 3: Tích hợp thanh toán
```yaml
utilities:
  TopggService:
    Enable: true
    Token: "YOUR_TOPGG_TOKEN"
    WebhookAuth: "your_webhook_secret"
```

### Bước 4: Cài đặt Webhook
```javascript
// Trong file webhook handler
app.post('/webhook/topgg', (req, res) => {
  const { userId, type } = req.body;
  // Xử lý vote và cấp Premium
});
```

---

## 5. Tích hợp Web Dashboard

### Cấu hình Web Server
```yaml
features:
  WebServer:
    enable: true
    Port: 3000
    Auth: "your_dashboard_password"

  RestAPI:
    enable: true
    auth: "your_api_password"
```

### API Endpoints
```javascript
// Lấy thông tin server
GET /api/servers/:guildId

// Lấy hàng chờ nhạc
GET /api/queue/:guildId

// Điều khiển nhạc
POST /api/control/:guildId
{
  "action": "play",
  "data": {
    "query": "song name"
  }
}
```

### WebSocket Events
```javascript
// Kết nối WebSocket
const ws = new WebSocket('ws://localhost:3000');

// Lắng nghe events
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

---

## 6. Tùy chỉnh giao diện

### Emoji Customization
```yaml
emoji:
  play: "▶️"
  pause: "⏸️"
  skip: "⏭️"
  stop: "⏹️"
  loop: "🔁"
  shuffle: "🔀"
  volume: "🔊"
  queue: "📋"
```

### Embed Colors
```yaml
colors:
  primary: "#FF6B6B"
  success: "#51CF66"
  error: "#FF6B6B"
  warning: "#FFD43B"
  info: "#74C0FC"
```

### Custom Messages
```yaml
messages:
  nowPlaying: "🎵 Đang phát: **{title}**"
  addedToQueue: "➕ Đã thêm **{title}** vào hàng chờ"
  queueEmpty: "📭 Hàng chờ trống"
```

---

## 7. Troubleshooting nâng cao

### Lavalink Issues
```bash
# Kiểm tra Lavalink logs
tail -f lavalink/logs/lavalink.log

# Test connection
curl -X GET "http://localhost:2333/version" \
  -H "Authorization: your_password"
```

### Database Issues
```bash
# Test MySQL connection
mysql -u zkmusic -p zkmusic -e "SELECT 1"

# Test MongoDB connection
mongosh --eval "db.stats()" zkmusic

# Test PostgreSQL connection
psql -U zkmusic -d zkmusic -c "SELECT version()"
```

### Memory Issues
```yaml
# Tăng memory cho Node.js
NODE_OPTIONS: "--max-old-space-size=4096"

# Tăng memory cho Lavalink
JAVA_OPTS: "-Xmx4G -Xms1G"
```

### Sharding Setup
```yaml
sharding:
  enabled: true
  clusters: 3
  shardsPerCluster: 5
```

```bash
# Chạy với sharding
npm run start:shards
```

---

## 🎉 Hoàn thành!

Chúc mừng! Bạn đã hoàn thành việc cài đặt và cấu hình Zk Music's. Bot của bạn giờ đã sẵn sàng phục vụ server Discord với đầy đủ tính năng.

### Các bước tiếp theo:
1. **Test bot**: Thử các lệnh cơ bản
2. **Tùy chỉnh**: Điều chỉnh cấu hình theo nhu cầu
3. **Monitor**: Theo dõi logs và performance
4. **Backup**: Thiết lập backup định kỳ
5. **Update**: Cập nhật bot thường xuyên

### Tài nguyên hữu ích:
- [Discord.js Guide](https://discordjs.guide/)
- [Lavalink Documentation](https://github.com/lavalink-devs/Lavalink)
- [Zk Music's Wiki](https://github.com/ZenKho-chill/Zk-Musics/wiki)

Nếu gặp vấn đề, hãy tham gia [Server Hỗ trợ](https://dsteam.store/discord) để được giúp đỡ!</content>
<parameter name="filePath">
