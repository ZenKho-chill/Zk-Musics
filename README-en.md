# 🎵 Zk Music's - Discord Music Bot

[![Version](https://img.shields.io/badge/version-5.3.7-blue.svg)](https://github.com/ZenKho-chill/Zk-Musics)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](https://github.com/ZenKho-chill/Zk-Musics/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-16+-brightgreen.svg)](https://nodejs.org/)

> **Zk Music's** is a comprehensive Discord music bot with Lavalink integration, supporting music playback from multiple sources, playlist system, premium features, and many advanced capabilities.

## ✨ Key Features

### 🎶 Music Playback
- **Multi-platform support**: YouTube, Spotify, Apple Music, SoundCloud, Tidal, and more
- **High quality**: High-quality audio with Lavalink
- **Seek and control**: Seek forward, backward, fast-forward, volume control
- **Smart queue**: Queue management with priority and shuffle

### 📋 Playlist Management
- **Personal playlists**: Save and manage private playlists
- **Import/Export**: Import playlists from Spotify, YouTube
- **Share playlists**: Share public playlists with the community

### 🎛️ Advanced Controls
- **Audio filters**: Bass, treble, karaoke, nightcore, vaporwave
- **Loop modes**: Single track, queue, off
- **Autoplay**: Random playback when queue ends
- **24/7 Mode**: Keep bot in voice channel continuously

### 🌟 Premium Features
- **Unlimited queue**: No limit on number of songs
- **Unlimited playlists**: No limit on number of playlists
- **Priority support**: Fast support from developer
- **Exclusive features**: Features only for Premium users

### 🤖 AI & Interactions
- **AI Chat**: Interact with Gemini AI
- **Auto notifications**: Twitch, YouTube notifications
- **Statistics**: Track server and member activity
- **ModLog**: Log moderation actions

### 🌐 Web Dashboard
- **REST API**: Full API for integrations
- **WebSocket**: Real-time updates
- **Vote webhook**: Top.gg voting integration
- **Status page**: Bot status monitoring

## 🚀 Quick Setup

### System Requirements
- **Node.js**: 16.0.0 or higher
- **npm**: 7.0.0 or higher
- **Lavalink Server**: For high-quality music playback

### 1. Clone repository
```bash
git clone https://github.com/ZenKho-chill/Zk-Musics.git
cd Zk-Musics
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure bot
```bash
# Copy configuration file
cp config.example.yml config.yml

# Copy .env file
cp .env.example .env
```

### 4. Detailed Configuration

#### .env file
```env
DISCORD_APP_TOKEN=your-discord-bot-token
```

#### config.yml file
```yaml
bot:
  TOKEN: ${DISCORD_APP_TOKEN}
  OWNER_ID: "YOUR_OWNER_ID"
  ADMIN: ["TRUSTED_USER_ID_1"]
  DEFAULT_VOLUME: 50
  LANGUAGE: "en" # or "vi"

lavalink:
  NODES:
    - host: "lavalink-server.com"
      port: 2333
      name: "zkmusic"
      auth: "your-password"
      secure: false
```

### 5. Run bot
```bash
# Run in development mode
npm run dev

# Run in production mode
npm run start:prod

# Run with sharding
npm run start:shards
```

## 📖 Detailed Guide

### 🎯 Lavalink Setup

Zk Music's uses Lavalink for high-quality music playback. You have 2 options:

#### 1. Use Free Lavalink
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

#### 2. Self-host Lavalink
```bash
# Download Lavalink
wget https://github.com/lavalink-devs/Lavalink/releases/download/4.0.8/Lavalink.jar

# Create application.yml
nano application.yml
```

```yaml
server:
  port: 2333
  address: 0.0.0.0

lavalink:
  server:
    password: "your-password"
    sources:
      youtube: true
      bandcamp: true
      soundcloud: true
      twitch: true
      vimeo: true
      http: true
      local: false

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

### 🎵 Basic Commands

#### Play Music
```
/play search: Song name or URL
```

#### Queue Management
```
/queue page: 1
/skip
/stop
/shuffle
```

#### Music Control
```
/pause
/resume
/volume level: 50
/loop mode: queue
```

#### Playlist
```
/playlist create name: Playlist name
/playlist add name: Playlist name search: Song name
/playlist play name: Playlist name
```

### 🎛️ Advanced Configuration

#### Premium System
```yaml
PremiumRole:
  GuildID: "PREMIUM_SERVER_ID"
  RoleID: "PREMIUM_ROLE_ID"
```

#### Twitch/YouTube Notifications
```yaml
utilities:
  NotifyTwitch:
    Enable: true
    ClientId: "TWITCH_CLIENT_ID"
    ClientSecret: "TWITCH_CLIENT_SECRET"
    GlobalChannelID: "NOTIFICATION_CHANNEL_ID"

  NotifyYoutube:
    Enable: true
    ApiKey1: "YOUTUBE_API_KEY"
    GlobalChannelID: "NOTIFICATION_CHANNEL_ID"
```

#### Web Dashboard
```yaml
features:
  WebServer:
    enable: true
    Port: 3000

  RestAPI:
    enable: true
    auth: "api-password"
```

### 🔧 Troubleshooting

#### Bot won't connect
1. Check if Discord token is correct
2. Check if Lavalink server is running
3. Check firewall and port forwarding

#### Commands not working
1. Ensure bot has necessary permissions
2. Check bot permissions in server
3. Use `/reload` to reload commands

#### Audio not playing
1. Check if bot is in voice channel
2. Check Lavalink connection
3. Restart Lavalink server

## 📊 Available Commands

### 🎵 Music (25 commands)
- `/play` - Play music from URL or name
- `/pause` - Pause music
- `/resume` - Resume playback
- `/skip` - Skip current track
- `/stop` - Stop music playback
- `/queue` - View queue
- `/volume` - Adjust volume
- `/loop` - Loop mode
- `/shuffle` - Shuffle queue
- And many more...

### 📋 Playlist (8 commands)
- `/playlist create` - Create new playlist
- `/playlist add` - Add song to playlist
- `/playlist remove` - Remove song from playlist
- `/playlist play` - Play playlist
- `/playlist delete` - Delete playlist
- And many more...

### ⚙️ Settings (10 commands)
- `/247` - 24/7 mode
- `/settings` - Bot settings
- `/language` - Change language
- `/prefix` - Change prefix
- And many more...

### ℹ️ Info (6 commands)
- `/info` - Bot information
- `/ping` - Check ping
- `/uptime` - Uptime
- And many more...

### 🛠️ Utilities (8 commands)
- `/kick` - Kick member
- `/ban` - Ban member
- `/purge` - Delete messages
- `/my-stats` - Personal statistics
- And many more...

## 🌟 Premium Features

### ✨ Premium Benefits
- **Unlimited queue**: Play as many songs as you want
- **Unlimited playlists**: Create as many playlists as you want
- **Priority support**: Fastest support from developer
- **Exclusive features**: Features only for Premium users

### 💎 How to Upgrade to Premium
1. Join support server: [DST Team](https://dsteam.store/discord)
2. Purchase Premium from: [Premium Page](https://zkmusic/zenkho.top/premium)
3. Get Premium role and enjoy!

## 🤝 Contributing

We welcome contributions from the community!

### How to contribute
1. Fork the repository
2. Create new branch: `git checkout -b feature/NewFeature`
3. Commit changes: `git commit -m 'Add new feature'`
4. Push to branch: `git push origin feature/NewFeature`
5. Create Pull Request

### Development guidelines
- Use TypeScript for all new code
- Follow ESLint and Prettier
- Write tests for new features
- Update documentation

## 📄 License

This project is distributed under the ISC license. See the `LICENSE` file for more details.

## 📞 Contact & Support

- **Website**: [zenkho.top](https://zenkho.top)
- **Discord Server**: [DST Team](https://dsteam.store/discord)
- **GitHub Issues**: [Report bugs](https://github.com/ZenKho-chill/Zk-Musics/issues)
- **Email**: zenkho@zenkho.top

## 🙏 Acknowledgments

Thanks to all contributors and users who support Zk Music's!

### 📊 Statistics
- ⭐ **5,000+** servers using
- 🎵 **10M+** songs played
- 👥 **500K+** users
- 🌍 Support **2 languages**: Vietnamese & English

---

**Made with ❤️ by ZenKho**</content>
<parameter name="filePath">d:\Discord Bot\Zk Music's\README-en.md
