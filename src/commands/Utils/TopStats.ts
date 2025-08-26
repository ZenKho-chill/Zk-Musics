import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import { EmbedBuilder } from "discord.js";
import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";

const data: Config = new ConfigData().data;

// Đăng ký font để sử dụng trong canvas
GlobalFonts.registerFromPath("./script/Courage-Road.ttf", "Courage Road");

export default class implements Command {
  public name = ["topstats"];
  public description =
    "Hiển thị top server, top người dùng và top lượt bình chọn";
  public category = "Utils";
  public accessableby = data.COMMANDS_ACCESS.UTILS.TopStats;
  public usage = "";
  public aliases = ["ts"];
  public lavalink = false;
  public usingInteraction = true;
  public playerCheck = false;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    try {
      // Lấy dữ liệu từ cơ sở dữ liệu
      const guildsData = await client.db.PlayedSongGuild.all();
      const usersData = await client.db.PlayedSongUser.all();
      const votesData = await client.db.votes.all();

      // Sắp xếp và lấy top cho mỗi danh mục
      const topGuilds =
        (guildsData || [])
          .sort((a, b) => (b.value.Count || 0) - (a.value.Count || 0))
          .slice(0, 5)
          .map((guild, index) => `${index + 1}. ${guild.value.GuildName}`)
          .join("\n") || "Không có dữ liệu";

      const topUsers =
        (usersData || [])
          .sort(
            (a, b) =>
              (b.value.totalSongsPlayed || 0) - (a.value.totalSongsPlayed || 0)
          )
          .slice(0, 10)
          .map((user, index) => `${index + 1}. ${user.value.username}`)
          .join("\n") || "Không có dữ liệu";

      const topVotes =
        (votesData || [])
          .sort((a, b) => (b.value.count || 0) - (a.value.count || 0))
          .slice(0, 5)
          .map((vote, index) => `${index + 1}. ${vote.value.username}`)
          .join("\n") || "Không có dữ liệu";

      // Tạo canvas với kích thước mong muốn
      const canvas = createCanvas(954, 647);
      const ctx = canvas.getContext("2d");

      // Tải ảnh nền cho thẻ
      const backgroundImg = await loadImage("./script/topstats.png");
      ctx.drawImage(backgroundImg, 0, 0, 954, 647);

      // Hàm tiện ích để rút ngắn chuỗi tới độ dài tối đa
      function truncateText(text: string, maxLength: number): string {
        return text.length > maxLength
          ? text.slice(0, maxLength - 3) + "..."
          : text;
      }

      // Vẽ danh sách Top Server
      function drawTopGuilds(guilds: string, x: number, y: number): void {
        ctx.fillStyle = "#f4d8ad";
        ctx.font = "20px Courage Road";
        const lines = guilds.toUpperCase().split("\n");
        lines.forEach((line) => {
          const truncatedLine = truncateText(line, 21);
          ctx.fillText(truncatedLine, x, y);
          y += 40;
        });
      }

      // Vẽ danh sách Top Người dùng
      function drawTopUsers(users: string, x: number, y: number): void {
        ctx.fillStyle = "#f4d8ad";
        ctx.font = "18px Courage Road";
        const lines = users.split("\n");
        lines.forEach((line) => {
          const truncatedLine = truncateText(line, 21);
          ctx.fillText(truncatedLine, x, y);
          y += 33;
        });
      }

      // Vẽ danh sách Top Bình chọn
      function drawTopVotes(votes: string, x: number, y: number): void {
        ctx.fillStyle = "#f4d8ad";
        ctx.font = "20px Courage Road";
        const lines = votes.split("\n");
        lines.forEach((line) => {
          const truncatedLine = truncateText(line, 21);
          ctx.fillText(truncatedLine, x, y);
          y += 40;
        });
      }

      // Gọi các hàm để vẽ từng phần
      drawTopGuilds(topGuilds, 470, 140);
      drawTopUsers(topUsers, 50, 285);
      drawTopVotes(topVotes, 470, 425);

      // Tạo buffer từ canvas
      const buffer = canvas.toBuffer("image/jpeg");

      await handler.editReply({
        files: [
          {
            attachment: buffer,
            name: "topstats-zk.jpg",
          },
        ],
      });
    } catch (error) {
      client.logger.warn("TopStats", "Lỗi khi tạo ảnh thống kê top");
      await handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(
                handler.language,
                "commands.utils",
                "topstats_error"
              )}`
            )
            .setColor(client.color_main),
        ],
        content: " ",
      });
    }
  }
}
