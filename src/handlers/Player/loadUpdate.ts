import { Manager } from "../../manager.js";
import {
  EmbedBuilder,
  TextChannel,
  AttachmentBuilder,
  User,
  MessageFlags,
} from "discord.js";
import { FormatDuration } from "../../utilities/FormatDuration.js";
import { ZklinkPlayer, ZklinkTrack } from "../../zklink/main.js";
import { TrackTitle } from "../../utilities/TrackTitle.js";
import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";
import { zkcard } from "zkcard";
export class PlayerUpdateLoader {
  client: Manager;
  constructor(client: Manager) {
    this.client = client;
    this.loader(this.client);
  }

  async loader(client: Manager) {
    client.UpdateQueueMsg = async function (player: ZklinkPlayer) {
      let data = await client.db.setup.get(`${player.guildId}`);
      if (!data) return;
      if (data.enable === false) return;

      let channel = (await client.channels
        .fetch(data.channel)
        .catch(() => undefined)) as TextChannel;
      if (!channel) return;

      let playMsg = await channel.messages
        .fetch(data.playmsg)
        .catch(() => undefined);
      if (!playMsg) return;

      let guildModel = await client.db.language.get(`${player.guildId}`);
      if (!guildModel) {
        guildModel = await client.db.language.set(
          `${player.guildId}`,
          client.config.bot.LANGUAGE
        );
      }

      const language = guildModel;

      const source = player.queue.current?.source || "unknown";
      let src = client.config.PLAYER_SOURCENAME.UNKNOWN; // Mặc định là UNKNOWN nếu nguồn không xác định
      if (source === "youtube") {
        src = client.config.PLAYER_SOURCENAME.YOUTUBE;
      } else if (source === "spotify") {
        src = client.config.PLAYER_SOURCENAME.SPOTIFY;
      } else if (source === "tidal") {
        src = client.config.PLAYER_SOURCENAME.TIDAL;
      } else if (source === "soundcloud") {
        src = client.config.PLAYER_SOURCENAME.SOUNDCLOUD;
      } else if (source === "deezer") {
        src = client.config.PLAYER_SOURCENAME.DEEZER;
      } else if (source === "twitch") {
        src = client.config.PLAYER_SOURCENAME.TWITCH;
      } else if (source === "apple") {
        src = client.config.PLAYER_SOURCENAME.APPLE_MUSIC;
      } else if (source === "applemusic") {
        src = client.config.PLAYER_SOURCENAME.APPLE_MUSIC;
      } else if (source === "youtube_music") {
        src = client.config.PLAYER_SOURCENAME.YOUTUBE_MUSIC;
      } else if (source === "http") {
        src = client.config.PLAYER_SOURCENAME.HTTP;
      }

      function drawRoundedImage(ctx, img, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + width, y, x + width, y + height, radius);
        ctx.arcTo(x + width, y + height, x, y + height, radius);
        ctx.arcTo(x, y + height, x, y, radius);
        ctx.arcTo(x, y, x + width, y, radius);
        ctx.closePath();
        ctx.clip(); // Thiết lập vùng cắt cho hình chữ nhật bo góc
        ctx.drawImage(img, x, y, width, height); // Vẽ ảnh trong vùng cắt
        ctx.restore(); // Khôi phục context ban đầu sau khi cắt
      }

      const TotalDuration = player.queue.duration;

      let cSong = player.queue.current;
      let qDuration = `${new FormatDuration().parse(
        TotalDuration + Number(player.queue.current?.duration)
      )}`;

      // Check if there are songs in the queue before creating the canvas
      let attachment;
      if (player.queue.length > 0) {
        // Sau khi xác định kích thước canvas
        const canvasWidth = 800;
        const songHeight = 60; // Chiều cao cho mỗi bài hát
        const canvasHeight =
          Math.min(player.queue.length, 10) * songHeight + 70; // Thiết lập chiều cao canvas dựa trên số lượng bài (thêm bù)

        // Tạo một canvas
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext("2d");

        // Thiết lập màu nền
        ctx.fillStyle = "#2C2F33";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Tải font nếu cần
        GlobalFonts.registerFromPath(
          "./scripts/Courage-Road.ttf",
          "Courage Road"
        );
        ctx.font = "16px Courage Road"; // Font size and style

        // Văn bản tiêu đề
        ctx.fillStyle = "#FFFFFF";
        const headerText = "Các bài trong hàng chờ của bạn";
        const textWidth = ctx.measureText(headerText).width; // Calculate text width
        const xPosition = (canvasWidth - textWidth) / 2; // Calculate x position for center alignment
        ctx.fillText(headerText, xPosition, 30); // Draw the header text

        // Khoảng cách dọc giữa các bài
        let yOffset = 70;

        // Duyệt các bài trong hàng chờ
        for (let i = 0; i < Math.min(player.queue.length, 10); i++) {
          // Chỉ hiển thị tối đa 10 bài (giới hạn)
          const song = player.queue[i];

          // Tải ảnh thu nhỏ từ URL của bài
          const thumbnailUrl =
            song.artworkUrl || client.user?.displayAvatarURL(); // Use default if no thumbnail
          const thumbnailImage = await loadImage(thumbnailUrl);

          // Vẽ ảnh thu nhỏ với góc bo tròn
          const thumbnailSize = 50; // Thumbnail size
          const cornerRadius = 10; // Corner radius
          ctx.save(); // Save canvas state
          drawRoundedImage(
            ctx,
            thumbnailImage,
            50,
            yOffset - 20,
            thumbnailSize,
            thumbnailSize,
            cornerRadius
          );

          // Số thứ tự bài
          ctx.fillStyle = "#b4b4b4";
          ctx.fillText(`${i + 1}.`, 20, yOffset + 10); // Add index before thumbnail

          // Tiêu đề bài
          ctx.fillStyle = "#F4E0C7";
          ctx.font = "16px Courage Road"; // Normal size for song title

          // Rút gọn tiêu đề nếu dài hơn 25 ký tự
          const maxTitleLength = 25;
          let displayTitle =
            song.title.length > maxTitleLength
              ? song.title.slice(0, maxTitleLength) + "..."
              : song.title;

          ctx.fillText(displayTitle, 120, yOffset); // Draw trimmed title

          // Tác giả bài
          ctx.fillStyle = "#b4b4b4"; // Color for author
          ctx.font = "12px Courage Road"; // Smaller size for author
          ctx.fillText(song.author, 120, yOffset + 18); // Position slightly lower than title

          // Thời lượng bài
          ctx.fillStyle = "#b4b4b4"; // Color for duration
          ctx.font = "10px Courage Road"; // Smaller size for duration
          ctx.fillText(
            new FormatDuration().parse(song.duration),
            700,
            yOffset + 18
          ); // Align with author

          // Cập nhật yOffset cho bài tiếp theo
          yOffset += 60;
        }

        // Tạo buffer ảnh
        const buffer = canvas.toBuffer("image/png");
        attachment = new AttachmentBuilder(buffer, { name: "queue.png" });
      } else {
        // Nếu không có bài trong hàng chờ, hiển thị "KHÔNG CÓ HÀNG CHỜ"
        const canvasWidth = 800;
        const canvasHeight = 100; // Chiều cao cho canvas chứa văn bản "KHÔNG CÓ HÀNG CHỜ"

        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext("2d");

        // Thiết lập màu nền
        ctx.fillStyle = "#2C2F33";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Tải font nếu cần
        GlobalFonts.registerFromPath(
          "./scripts/Courage-Road.ttf",
          "Courage Road"
        );
        ctx.font = "20px Courage Road"; // Font size and style for "NO QUEUE"

        // Vẽ văn bản "KHÔNG CÓ HÀNG CHỜ"
        ctx.fillStyle = "#F4E0C7";
        const noQueueText = "Không có bài trong hàng chờ!";
        const textWidth = ctx.measureText(noQueueText).width; // Calculate text width
        const xPosition = (canvasWidth - textWidth) / 2; // Calculate x position for center alignment
        ctx.fillText(noQueueText, xPosition, canvasHeight / 2); // Draw the "NO QUEUE" text at the center

        // Tạo buffer ảnh
        const buffer = canvas.toBuffer("image/png");
        attachment = new AttachmentBuilder(buffer, { name: "queue.png" });
      }

      let embed = new EmbedBuilder()
        .setAuthor({
          name: client.i18n.get(
            language,
            "button.setup.music",
            "player_setup_author"
          ),
          iconURL: client.i18n.get(
            language,
            "button.setup.music",
            "player_setup_icon_author"
          ),
        })
        .setDescription(`**${TrackTitle(client, cSong!)}**`)
        .setThumbnail(
          source === "soundcloud"
            ? (client.user?.displayAvatarURL() as string)
            : cSong.artworkUrl ??
                `https://img.youtube.com/vi/${cSong.identifier}/hqdefault.jpg`
        )
        .setColor(client.color_second)
        .setImage("attachment://queue.png")
        .setFooter({
          text: `${client.i18n.get(
            language,
            "button.setup.music",
            "setup_footer",
            {
              duration: qDuration,
              totalsong: player.queue.length.toString(),
              autoplay: player!.data.get("autoplay") ? "On" : "Off",
              queue: `${player.queue.length}`,
              volume: `${player.volume}%`,
              requester:
                (cSong?.requester as User)?.displayName ||
                (cSong?.requester as User)?.username,
            }
          )}`,
        })
        .setTimestamp()
        .addFields(
          {
            name: `${client.config.TRACKS_EMOJI.Author} ${cSong?.author} ♪`,
            value: `**${
              client.config.TRACKS_EMOJI.Timers
            } ${new FormatDuration().parse(cSong?.duration)}**`,
            inline: true,
          },
          {
            name: `${client.config.TRACKS_EMOJI.Volume} **${player.volume}%**`,
            value: `**${
              player!.data.get("autoplay")
                ? `${client.config.TRACKS_EMOJI.Autoplay} AutoPlay`
                : src
            }**`,
            inline: true,
          }
        );

      return await playMsg
        .edit({
          flags: MessageFlags.SuppressNotifications,
          embeds: [embed],
          components: [client.enSwitchMod],
          files: attachment ? [attachment] : [], // Thêm tập tin đính kèm nếu tồn tại
        })
        .catch((error) => {
          client.logger.info(
            "loadUpdate",
            `Lỗi khi chỉnh sửa tin nhắn tại @ ${playMsg.guild!.name} / ${
              playMsg.guildId
            }`
          );
        });
    };

    /**
     *
     * @param {Player} player
     */
    client.UpdateMusic = async function (player: ZklinkPlayer) {
      let data = await client.db.setup.get(`${player.guildId}`);
      if (!data) return;
      if (data.enable === false) return;

      let channel = (await client.channels
        .fetch(data.channel)
        .catch(() => undefined)) as TextChannel;
      if (!channel) return;

      let playMsg = await channel.messages
        .fetch(data.playmsg)
        .catch(() => undefined);
      if (!playMsg) return;

      let guildModel = await client.db.language.get(`${player.guildId}`);
      if (!guildModel) {
        guildModel = await client.db.language.set(
          `${player.guildId}`,
          client.config.bot.LANGUAGE
        );
      }

      const language = guildModel;

      const queueMsg = `${client.i18n.get(
        language,
        "button.setup.music",
        "setup_queuemsg"
      )}`;

      const playEmbed = new EmbedBuilder()
        .setColor(client.color_second)
        .setAuthor({
          name: `${client.i18n.get(
            language,
            "button.setup.music",
            "setup_playembed_author"
          )}`,
        })
        .setImage(client.config.bot.IMAGES_URL_REQUEST_MUSIC);

      return await playMsg
        .edit({
          content: `${queueMsg}`,
          embeds: [playEmbed],
          components: [client.diSwitch],
          files: [], // Thêm tập tin đính kèm ở đây
        })
        .catch((error) => {
          client.logger.info(
            "LoadUpdate",
            `Không thể chỉnh sửa tin nhắn tại @ ${playMsg.guild!.name} / ${
              playMsg.guildId
            }`
          );
        });
    };
  }
}
