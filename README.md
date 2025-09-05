# 🎵 Zk Music's - Discord Music Bot

[![Version](https://img.shields.io/badge/version-5.3.7-blue.svg)](https://github.com/ZenKho-chill/Zk-Musics)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](https://github.com/ZenKho-chill/Zk-Musics/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-16+-brightgreen.svg)](https://nodejs.org/)

> **Zk Music's** là một bot nhạc Discord toàn diện với Lavalink, hỗ trợ phát nhạc từ nhiều nguồn khác nhau, có hệ thống playlist, premium, và nhiều tính năng nâng cao khác.

## ✨ Tính năng chính

### 🎶 Phát nhạc
- **Hỗ trợ đa nền tảng**: YouTube, Spotify, Apple Music, SoundCloud, Tidal, và nhiều hơn nữa
- **Chất lượng cao**: Âm thanh chất lượng cao với Lavalink
- **Tua và điều khiển**: Tua tới, tua lùi, tua nhanh, điều chỉnh âm lượng
- **Hàng chờ thông minh**: Quản lý hàng chờ với ưu tiên và xáo trộn

### 📋 Quản lý playlist
- **Tạo playlist cá nhân**: Lưu và quản lý playlist riêng tư
- **Import/Export**: Nhập playlist từ Spotify, YouTube
- **Chia sẻ playlist**: Chia sẻ playlist công khai với cộng đồng

### 🎛️ Điều khiển nâng cao
- **Bộ lọc âm thanh**: Bass, treble, karaoke, nightcore, vaporwave
- **Chế độ lặp**: Lặp bài, lặp hàng chờ, lặp tắt
- **Tự động phát**: Phát ngẫu nhiên khi hết hàng chờ
- **24/7 Mode**: Giữ bot ở kênh thoại liên tục

### 🌟 Tính năng Premium
- **Hàng chờ không giới hạn**: Không giới hạn số lượng bài hát
- **Playlist không giới hạn**: Không giới hạn số lượng playlist
- **Ưu tiên hỗ trợ**: Hỗ trợ nhanh chóng từ developer
- **Tính năng độc quyền**: Các tính năng chỉ dành cho Premium

### 🤖 AI & Tương tác
- **Chat AI**: Tương tác với Gemini AI
- **Thông báo tự động**: Twitch, YouTube notifications
- **Thống kê**: Theo dõi hoạt động server và thành viên
- **ModLog**: Ghi lại các hành động moderation

### 🌐 Web Dashboard
- **REST API**: API đầy đủ để tích hợp
- **WebSocket**: Real-time updates
- **Vote webhook**: Tích hợp Top.gg voting
- **Status page**: Giám sát trạng thái bot

## 🚀 Cài đặt nhanh

### Yêu cầu hệ thống
- **Node.js**: 16.0.0 hoặc cao hơn
- **npm**: 7.0.0 hoặc cao hơn
- **Lavalink Server**: Cho phát nhạc chất lượng cao

### 1. Clone repository
```bash
git clone https://github.com/ZenKho-chill/Zk-Musics.git
cd Zk-Musics
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình bot
```bash
# Sao chép file cấu hình mẫu
cp config.example.yml config.yml

# Sao chép file .env mẫu
cp .env.example .env
```

### 4. Cấu hình chi tiết

#### File .env
```env
DISCORD_APP_TOKEN=token-discord-bot-cua-ban
```

#### File config.yml
```yaml
bot:
  TOKEN: ${DISCORD_APP_TOKEN}
  OWNER_ID: "ID_CHU_SO_HUU_CUA_BAN"
  ADMIN: ["ID_NGUOI_TIN_CAY_1"]
  DEFAULT_VOLUME: 50
  LANGUAGE: "vi" # hoặc "en"

lavalink:
  NODES:
    - host: "lavalink-server.com"
      port: 2333
      name: "zkmusic"
      auth: "password-cua-ban"
      secure: false
```

### 5. Chạy bot
```bash
# Chạy ở chế độ development
npm run dev

# Chạy ở chế độ production
npm run start:prod

# Chạy với sharding
npm run start:shards
```

## 📖 Hướng dẫn chi tiết

### 🎯 Thiết lập Lavalink

Zk Music's sử dụng Lavalink để phát nhạc chất lượng cao. Bạn có 2 lựa chọn:

#### 1. Sử dụng Lavalink miễn phí
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

#### 2. Tự host Lavalink
```bash
# Tải Lavalink
wget https://github.com/lavalink-devs/Lavalink/releases/download/4.0.8/Lavalink.jar

# Tạo file application.yml
nano application.yml
```

```yaml
server:
  port: 2333
  address: 0.0.0.0

lavalink:
  server:
    password: "password-cua-ban"
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
# Chạy Lavalink
java -jar Lavalink.jar
```

### 🎵 Sử dụng lệnh cơ bản

#### Phát nhạc
```
/play search: Tên bài hát hoặc URL
```

#### Quản lý hàng chờ
```
/queue page: 1
/skip
/stop
/shuffle
```

#### Điều khiển nhạc
```
/pause
/resume
/volume level: 50
/loop mode: queue
```

#### Playlist
```
/playlist create name: Tên playlist
/playlist add name: Tên playlist search: Tên bài hát
/playlist play name: Tên playlist
```

### 🎛️ Cấu hình nâng cao

#### Hệ thống Premium
```yaml
PremiumRole:
  GuildID: "ID_SERVER_PREMIUM"
  RoleID: "ID_VAI_TRO_PREMIUM"
```

#### Thông báo Twitch/YouTube
```yaml
utilities:
  NotifyTwitch:
    Enable: true
    ClientId: "TWITCH_CLIENT_ID"
    ClientSecret: "TWITCH_CLIENT_SECRET"
    GlobalChannelID: "ID_KENH_THONG_BAO"

  NotifyYoutube:
    Enable: true
    ApiKey1: "YOUTUBE_API_KEY"
    GlobalChannelID: "ID_KENH_THONG_BAO"
```

#### Web Dashboard
```yaml
features:
  WebServer:
    enable: true
    Port: 3000

  RestAPI:
    enable: true
    auth: "mat-khau-api"
```

### 🔧 Troubleshooting

#### Bot không kết nối được
1. Kiểm tra token Discord có đúng không
2. Kiểm tra Lavalink server có chạy không
3. Kiểm tra firewall và port forwarding

#### Lệnh không hoạt động
1. Đảm bảo bot có quyền cần thiết
2. Kiểm tra quyền của bot trong server
3. Sử dụng `/reload` để reload commands

#### Âm thanh không phát
1. Kiểm tra bot có ở kênh thoại không
2. Kiểm tra Lavalink connection
3. Restart Lavalink server

## 📊 Lệnh có sẵn

### 🎵 Nhạc (25 lệnh)
- `/play` - Phát nhạc từ URL hoặc tên
- `/pause` - Tạm dừng nhạc
- `/resume` - Tiếp tục phát
- `/skip` - Bỏ qua bài hiện tại
- `/stop` - Dừng phát nhạc
- `/queue` - Xem hàng chờ
- `/volume` - Điều chỉnh âm lượng
- `/loop` - Chế độ lặp
- `/shuffle` - Xáo trộn hàng chờ
- Và nhiều lệnh khác...

### 📋 Playlist (8 lệnh)
- `/playlist create` - Tạo playlist mới
- `/playlist add` - Thêm bài vào playlist
- `/playlist remove` - Xóa bài khỏi playlist
- `/playlist play` - Phát playlist
- `/playlist delete` - Xóa playlist
- Và nhiều lệnh khác...

### ⚙️ Cài đặt (10 lệnh)
- `/247` - Chế độ 24/7
- `/settings` - Cài đặt bot
- `/language` - Đổi ngôn ngữ
- `/prefix` - Đổi prefix
- Và nhiều lệnh khác...

### ℹ️ Thông tin (6 lệnh)
- `/info` - Thông tin bot
- `/ping` - Kiểm tra ping
- `/uptime` - Thời gian hoạt động
- Và nhiều lệnh khác...

### 🛠️ Tiện ích (8 lệnh)
- `/kick` - Kick thành viên
- `/ban` - Ban thành viên
- `/purge` - Xóa tin nhắn
- `/my-stats` - Thống kê cá nhân
- Và nhiều lệnh khác...

## 🌟 Tính năng Premium

### ✨ Ưu đãi Premium
- **Hàng chờ không giới hạn**: Phát bao nhiêu bài cũng được
- **Playlist không giới hạn**: Tạo bao nhiêu playlist cũng được
- **Ưu tiên hỗ trợ**: Được hỗ trợ nhanh nhất
- **Tính năng độc quyền**: Các tính năng chỉ dành cho Premium

### 💎 Cách nâng cấp Premium
1. Tham gia server hỗ trợ: [DST Team](https://dsteam.store/discord)
2. Mua gói Premium từ: [Premium Page](https://zkmusic/zenkho.top/premium)
3. Nhận role Premium và tận hưởng!

## 🤝 Đóng góp

Chúng tôi luôn chào đón đóng góp từ cộng đồng!

### Cách đóng góp
1. Fork repository
2. Tạo branch mới: `git checkout -b feature/TinhNangMoi`
3. Commit changes: `git commit -m 'Thêm tính năng mới'`
4. Push to branch: `git push origin feature/TinhNangMoi`
5. Tạo Pull Request

### Hướng dẫn phát triển
- Sử dụng TypeScript cho tất cả code mới
- Tuân thủ ESLint và Prettier
- Viết test cho các tính năng mới
- Cập nhật documentation

## 📄 License

Dự án này được phân phối dưới giấy phép ISC. Xem file `LICENSE` để biết thêm chi tiết.

## 📞 Liên hệ & Hỗ trợ

- **Website**: [zenkho.top](https://zenkho.top)
- **Server Discord**: [DST Team](https://dsteam.store/discord)
- **GitHub Issues**: [Báo lỗi](https://github.com/ZenKho-chill/Zk-Musics/issues)
- **Email**: zenkho@zenkho.top

## 🙏 Lời cảm ơn

Cảm ơn tất cả contributors và người dùng đã ủng hộ Zk Music's!

### 📊 Thống kê
- ⭐ **5,000+** server sử dụng
- 🎵 **10M+** bài hát đã phát
- 👥 **500K+** người dùng
- 🌍 Hỗ trợ **2 ngôn ngữ**: Tiếng Việt & Tiếng Anh

---

**Made with ❤️ by ZenKho**</content>
<parameter name="filePath">