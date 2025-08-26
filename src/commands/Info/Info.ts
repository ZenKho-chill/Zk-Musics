import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import { stripIndents } from "common-tags";
import { EmbedBuilder } from "discord.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

export default class implements Command {
  public name = ["info"];
  public description = "Hiển thị thông tin của bot";
  public category = "Info";
  public accessableby = data.COMMANDS_ACCESS.INFO.Info;
  public usage = "";
  public aliases = ["stats", "bs"];
  public lavalink = false;
  public options = [];
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const globalCommandUsageData = await client.db.CommandGlobalUsage.get(
      "global"
    );
    const globalPlayedSongData = await client.db.PlayedSongGlobal.get("global");
    const globalCommands = globalCommandUsageData?.total || 0;
    const globalPlayed = globalPlayedSongData?.SongsPlayed || 0;

    const botInfo = stripIndents`
  • **Tên người dùng :** ${client.user!.username} / ${client.user!.id}
  • **Số máy chủ :** ${client.guilds.cache.size}
  • **Số người dùng :** ${client.guilds.cache.reduce(
    (a, b) => a + b.memberCount,
    0
  )}
  • **Số kênh :** ${client.channels.cache.size}
  • **Lệnh đã sử dụng :** ${globalCommands}
  • **Bài đã phát :** ${globalPlayed}
  • **Độ trễ API :** ${client.ws.ping}ms
  • **Thời gian phản hồi :** ${Date.now() - handler.createdAt}ms
  • **Tổng shards :** ${client.clusterManager?.totalShards ?? "0"}
  • **Tổng cluster :** ${client.cluster.id ?? "0"}
  `;

    const Metadata = stripIndents`
  • **Client ID :** ${client.user!.id}
  • **Tên dự án :** ${client.manifest.metadata.bot.codename}
  • **Phiên bản :** ${client.manifest.metadata.bot.version}
  • **Mô tả :** ${client.manifest.metadata.bot.description}
  • **Phiên bản Autofix :** ${client.manifest.metadata.autofix.version}
  • **Mã định danh :** ${client.manifest.metadata.autofix.codename}
  • **Discord.js :** ${client.manifest.package.discordjs}
  • **Node.js :** ${process.version}
  • **Typescript :** ${client.manifest.package.typescript}
  • **Tổng số gói :** ${client.manifest.package.totalAmount}
  • **Liên hệ hỗ trợ :** ${client.config.bot.SERVER_SUPPORT_URL}
  • **Nhà phát triển :** ${client.manifest.metadata.bot.developer}
  `;

    const embed = new EmbedBuilder()
      .setColor(client.color_second)
      .setThumbnail(client.user!.displayAvatarURL({ size: 512 }))
      .addFields({ name: "THÔNG TIN BOT", value: botInfo, inline: false })
      .addFields({
        name: "THÔNG TIN KỸ THUẬT",
        value: Metadata,
        inline: false,
      });

    handler.editReply({ embeds: [embed], components: [] });
  }
}
