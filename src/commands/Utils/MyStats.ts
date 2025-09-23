import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import { EmbedBuilder } from "discord.js";
import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";

const data: Config = new ConfigData().data;

// Đăng ký font để sử dụng trong canvas
GlobalFonts.registerFromPath("./script/Courage-Road.ttf", "Courage Road");

export default class implements Command {
  public name = ["mystats"];
  public description = "Hiển thị lịch sử hoạt động và thống kê sử dụng của bạn";
  public category = "Utils";
  public accessableby = data.COMMANDS_ACCESS.UTILS.MyStats;
  public usage = "";
  public aliases = ["st"];
  public lavalink = false;
  public usingInteraction = true;
  public playerCheck = false;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    // Check if user exists
    if (!handler.user) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(client.i18n.get("vi", "errors", "cannot_get_user_info"))
            .setColor("#FF0000"),
        ],
      });
    }

    const userId = handler.user.id;

    try {
      // Lấy dữ liệu từ cơ sở dữ liệu
      const userData = await client.db.PlayedSongUser.get(userId);
      const commandUsageData = await client.db.CommandUserUsage.get(userId);
      const voteData = await client.db.votes.get(userId);
      const topTracksData = await client.db.TopTrack.get(userId);
      const topArtistsData = await client.db.TopArtist.get(userId);

      const totalCommands = commandUsageData?.total || 0;
      const totalPlayed = userData?.totalSongsPlayed || 0;
      const voteCount = voteData?.count || 0;

      // Đảm bảo dữ liệu ở định dạng mảng
      const topTracksArray = Array.isArray(topTracksData?.Tracks) ? topTracksData?.Tracks : [];
      const topArtistsArray = Array.isArray(topArtistsData?.Artists) ? topArtistsData?.Artists : [];

      // Định dạng danh sách top bài hát và nghệ sĩ kèm đánh số
      const topTracks =
        topTracksArray
          .sort((a, b) => (b.count || 0) - (a.count || 0))
          .slice(0, 3)
          .map((track, index) => `${index + 1}. ${track.name}`)
          .join("\n") || "Không có dữ liệu";

      const topArtists =
        topArtistsArray
          .sort((a, b) => (b.count || 0) - (a.count || 0))
          .slice(0, 3)
          .map((artist, index) => `${index + 1}. ${artist.name}`)
          .join("\n") || "Không có dữ liệu";

      // Tạo canvas với kích thước mong muốn
      const canvas = createCanvas(954, 647);
      const ctx = canvas.getContext("2d");

      // Tải ảnh nền cho thẻ
      const backgroundImg = await loadImage("./script/mystats.png");
      ctx.drawImage(backgroundImg, 0, 0, 954, 647);

      // Vẽ ảnh đại diện người dùng
      const userPfp = await loadImage(
        handler.user.displayAvatarURL({ extension: "jpg", size: 1024 })
      );
      // Kích thước và vị trí ảnh đại diện
      const x = 53 + 142 / 2;
      const y = 30 + 142 / 2;
      const radius = 142 / 2;
      const borderThickness = 5;

      // Vẽ viền ngoài ảnh đại diện
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius + borderThickness, 0, Math.PI * 2);
      ctx.fillStyle = "#f4d8ad";
      ctx.fill();
      ctx.restore();

      // Ảnh đại diện nằm trên viền
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(userPfp, 53, 30, 142, 142);
      ctx.restore();

      // Hàm rút ngắn tên người dùng tới độ dài tối đa và thêm dấu bốn chấm
      function UsernameTruncateText(text, maxLength) {
        if (text.length > maxLength) {
          return text.slice(0, maxLength - 3) + "..."; // Cắt chuỗi và thêm dấu ...
        }
        return text;
      }

      // Vẽ tên người dùng
      const maxLength = 18; // Maximum number of characters
      const username = handler.user.username.toUpperCase();
      const truncatedUsername = UsernameTruncateText(username, maxLength);

      ctx.font = "40px Courage Road";
      ctx.fillStyle = "#a4815e";
      ctx.textAlign = "left";
      ctx.fillText(truncatedUsername, 208, 90);

      // Vẽ số lệnh đã sử dụng
      ctx.font = "30px Courage Road";
      ctx.fillStyle = "#f4d8ad";
      ctx.fillText(`${totalCommands}`.toUpperCase(), 295, 500);

      // Vẽ tổng số bài đã phát
      ctx.font = "30px Courage Road";
      ctx.fillStyle = "#f4d8ad";
      ctx.fillText(`${totalPlayed}`.toUpperCase(), 295, 580);

      ctx.font = "24px Courage Road";
      ctx.fillStyle = "#a4815e";
      ctx.fillText(`SỐ LƯỢT BÌNH CHỌN TRÊN TOP.GG - ${voteCount}`.toUpperCase(), 208, 140);

      // Hàm tiện ích rút ngắn chuỗi tới độ dài tối đa
      function topTrackstruncateText(text: string, maxLength: number): string {
        return text.length > maxLength ? text.slice(0, maxLength - 3) + "..." : text;
      }

      // Vẽ danh sách top bài hát
      ctx.font = "20px Courage Road";
      ctx.fillStyle = "#f4d8ad";
      let topTracksY = 275;
      const topTracksLines = topTracks.toUpperCase().split("\n");
      topTracksLines.forEach((line) => {
        const truncatedLine = topTrackstruncateText(line, 40);
        ctx.fillText(truncatedLine, 75, topTracksY);
        topTracksY += 40;
      });

      // Hàm tiện ích rút ngắn chuỗi tới độ dài tối đa
      function topArtiststruncateText(text: string, maxLength: number): string {
        return text.length > maxLength ? text.slice(0, maxLength - 3) + "..." : text;
      }
      // Vẽ danh sách top nghệ sĩ
      ctx.fillStyle = "#f4d8ad";
      ctx.font = "20px Courage Road";
      let topArtistsY = 505;
      const topArtistsLines = topArtists.toUpperCase().split("\n");
      topArtistsLines.forEach((line) => {
        const truncatedLine = topArtiststruncateText(line, 21);
        ctx.fillText(truncatedLine, 520, topArtistsY);
        topArtistsY += 35;
      });

      // Tạo buffer từ canvas
      const buffer = canvas.toBuffer("image/jpeg");

      // Gửi ảnh như một phản hồi
      await handler.editReply({
        files: [
          {
            attachment: buffer,
            name: "mystats-zk.jpg",
          },
        ],
      });
    } catch (error) {
      logWarn("UserStats", "Lỗi khi tạo ảnh thống kê người dùng");
      await handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "client.commands", "utils.mystats_error")}`
            )
            .setColor(client.color_main),
        ],
        content: " ",
      });
    }
  }
}
