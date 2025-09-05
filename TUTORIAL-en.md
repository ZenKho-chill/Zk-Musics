# 📚 Detailed Tutorial - Zk Music's

## 🎯 Table of Contents
1. [Basic Installation](#1-basic-installation)
2. [Docker Setup](#2-docker-setup)
3. [Lavalink Configuration](#3-lavalink-configuration)
4. [Database Configuration](#4-database-configuration)
5. [Premium Setup](#5-premium-setup)
6. [Web Dashboard Integration](#6-web-dashboard-integration)
7. [UI Customization](#7-ui-customization)
8. [Advanced Troubleshooting](#8-advanced-troubleshooting)

---

## 1. Basic Installation

### Step 1: Environment Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18 (recommended)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Java 17 (for Lavalink)
sudo apt install openjdk-17-jre-headless -y

# Check versions
node --version  # >= 16.0.0
npm --version   # >= 7.0.0
java --version  # >= 17
```

### Step 2: Create Discord Bot
1. Visit [Discord Developer Portal](https://discord.com/developers/applications)
2. Create new application
3. Go to "Bot" tab
4. Create bot and copy token
5. Invite bot to server with permissions:
   - Send Messages
   - Use Slash Commands
   - Connect
   - Speak
   - Use Voice Activity

### Step 3: Basic Configuration
```yaml
# config.yml
bot:
  TOKEN: "YOUR_BOT_TOKEN"
  OWNER_ID: "YOUR_DISCORD_ID"
  ADMIN: ["ADMIN_ID_1", "ADMIN_ID_2"]
  DEFAULT_VOLUME: 50
  LANGUAGE: "en"

features:
  WebServer:
    enable: true
    Port: 3000
  RestAPI:
    enable: true
    auth: "your_secure_password"
```

---

## 2. Docker Setup

### Docker Advantages
- **Easy setup**: No need to install Node.js, Java
- **Isolated environment**: No conflicts with system
- **Auto-scaling**: Easy to scale and manage
- **Easy deployment**: Fast and consistent deployment

### Step 1: Install Docker
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose -y
sudo systemctl start docker
sudo systemctl enable docker

# CentOS/RHEL
sudo yum install docker docker-compose -y
sudo systemctl start docker
sudo systemctl enable docker

# Check installation
docker --version
docker-compose --version
```

### Step 2: Prepare Project
```bash
git clone https://github.com/ZenKho-chill/Zk-Musics.git
cd Zk-Musics

# Copy configuration files
cp .env.example .env
cp config.example.yml config.yml
```

### Step 3: Configure Bot
```bash
# Edit .env
nano .env
```

```env
# Discord Bot Token
DISCORD_APP_TOKEN=your_discord_bot_token_here

# Database (optional)
DB_PASSWORD=zkmusic123

# Lavalink
LAVALINK_PASSWORD=youshallnotpass
```

### Step 4: Run with Docker

#### Simple Setup (no database)
```bash
# Run bot and Lavalink
docker-compose -f docker-compose.simple.yml up -d

# Check logs
docker-compose -f docker-compose.simple.yml logs -f
```

#### Full Setup (with database)
```bash
# Run with PostgreSQL
docker-compose --profile db up -d postgres zkmusic lavalink

# Run with MySQL
docker-compose --profile db up -d mysql zkmusic lavalink

# Run with MongoDB
docker-compose --profile db up -d mongodb zkmusic lavalink

# Run everything
docker-compose up -d
```

### Step 5: Manage Containers
```bash
# View status
docker-compose ps

# View logs
docker-compose logs -f zkmusic
docker-compose logs -f lavalink

# Restart services
docker-compose restart zkmusic

# Stop services
docker-compose down

# Update bot
docker-compose pull && docker-compose up -d --build
```

### Step 6: Backup and Restore
```bash
# Backup database
docker exec zkmusic-postgres pg_dump -U zkmusic zkmusic > backup.sql

# Restore database
docker exec -i zkmusic-postgres psql -U zkmusic zkmusic < backup.sql

# Backup volumes
docker run --rm -v zkmusic_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .
```

### Advanced Docker Configuration

#### Custom Lavalink config
```yaml
# lavalink/application.yml
server:
  port: 2333
  address: 0.0.0.0

lavalink:
  server:
    password: "${LAVALINK_PASSWORD}"
    sources:
      youtube: true
      spotify: true
      soundcloud: true
```

#### Environment variables
```env
# Bot configuration
NODE_ENV=production
DEBUG_MODE=false

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=zkmusic
DB_USER=zkmusic
DB_PASSWORD=zkmusic123

# Lavalink
LAVALINK_HOST=lavalink
LAVALINK_PORT=2333
LAVALINK_PASSWORD=youshallnotpass
```

#### Volumes mapping
```yaml
services:
  zkmusic:
    volumes:
      - ./config.yml:/app/config.yml:ro
      - ./logs:/app/logs
      - ./database:/app/database
      - ./custom_emojis:/app/assets/emojis
```

---

## 3. Lavalink Configuration

### Method 1: Use Free Lavalink
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

### Method 2: Self-host Lavalink (Recommended)
```bash
# Create Lavalink directory
mkdir lavalink && cd lavalink

# Download Lavalink
wget https://github.com/lavalink-devs/Lavalink/releases/download/4.0.8/Lavalink.jar

# Create configuration file
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
# Run Lavalink
java -jar Lavalink.jar
```

### Method 3: Using Docker
```bash
# Create docker-compose.yml
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

## 3. Database Configuration

### MySQL Setup
```bash
# Install MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Create database
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
# Install MongoDB
sudo apt install mongodb -y
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Create database
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
# Install PostgreSQL
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

## 4. Premium Setup

### Step 1: Create Premium Server
1. Create separate Discord server for Premium
2. Create "Premium" role with special color
3. Set up permissions for Premium role

### Step 2: Configure Premium
```yaml
PremiumRole:
  GuildID: "YOUR_PREMIUM_SERVER_ID"
  RoleID: "YOUR_PREMIUM_ROLE_ID"
```

### Step 3: Payment Integration
```yaml
utilities:
  TopggService:
    Enable: true
    Token: "YOUR_TOPGG_TOKEN"
    WebhookAuth: "your_webhook_secret"
```

### Step 4: Setup Webhook
```javascript
// In webhook handler file
app.post('/webhook/topgg', (req, res) => {
  const { userId, type } = req.body;
  // Process vote and grant Premium
});
```

---

## 5. Web Dashboard Integration

### Web Server Configuration
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
// Get server info
GET /api/servers/:guildId

// Get music queue
GET /api/queue/:guildId

// Control music
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
// Connect WebSocket
const ws = new WebSocket('ws://localhost:3000');

// Listen to events
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

---

## 6. UI Customization

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
  nowPlaying: "🎵 Now Playing: **{title}**"
  addedToQueue: "➕ Added **{title}** to queue"
  queueEmpty: "📭 Queue is empty"
```

---

## 7. Advanced Troubleshooting

### Lavalink Issues
```bash
# Check Lavalink logs
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
# Increase memory for Node.js
NODE_OPTIONS: "--max-old-space-size=4096"

# Increase memory for Lavalink
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
# Run with sharding
npm run start:shards
```

---

## 🎉 Complete!

Congratulations! You have successfully installed and configured Zk Music's. Your bot is now ready to serve your Discord server with full features.

### Next Steps:
1. **Test bot**: Try basic commands
2. **Customize**: Adjust configuration to your needs
3. **Monitor**: Monitor logs and performance
4. **Backup**: Set up regular backups
5. **Update**: Keep bot updated regularly

### Useful Resources:
- [Discord.js Guide](https://discordjs.guide/)
- [Lavalink Documentation](https://github.com/lavalink-devs/Lavalink)
- [Zk Music's Wiki](https://github.com/ZenKho-chill/Zk-Musics/wiki)

If you encounter any issues, join our [Support Server](https://dsteam.store/discord) for help!</content>
<parameter name="filePath">
