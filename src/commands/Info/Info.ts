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

    const globalCommandUsageData = await client.db.CommandGlobalUsage.get("global");
    const globalPlayedSongData = await client.db.PlayedSongGlobal.get("global");
    const globalCommands = globalCommandUsageData?.total || 0;
    const globalPlayed = globalPlayedSongData?.SongsPlayed || 0;

    const botInfo = stripIndents`
  • **${client.i18n.get(handler.language, "client.commands", "admin.info_username")}** ${client.user!.username}
  • **${client.i18n.get(handler.language, "client.commands", "admin.info_servers")}** ${client.guilds.cache.size}
  • **${client.i18n.get(handler.language, "client.commands", "admin.info_users")}** ${client.guilds.cache.reduce((a, b) => a + b.memberCount, 0)}
  • **${client.i18n.get(handler.language, "client.commands", "admin.info_channels")}** ${client.channels.cache.size}
  • **${client.i18n.get(handler.language, "client.commands", "admin.info_commands_used")}** ${globalCommands}
  • **${client.i18n.get(handler.language, "client.commands", "admin.info_songs_played")}** ${globalPlayed}
  • **${client.i18n.get(handler.language, "client.commands", "admin.info_api_latency")}** ${client.ws.ping}ms
  • **${client.i18n.get(handler.language, "client.commands", "admin.info_response_time")}** ${Date.now() - handler.createdAt}ms
  • **${client.i18n.get(handler.language, "client.commands", "admin.info_total_shards")}** ${client.clusterManager?.totalShards ?? "0"}
  • **${client.i18n.get(handler.language, "client.commands", "admin.info_total_clusters")}** ${client.cluster.id ?? "0"}
  `;

    const Metadata = stripIndents`
  • **${client.i18n.get(handler.language, "client.commands", "admin.info_client_id")}** ||${client.user!.id}||
  • **${client.i18n.get(handler.language, "client.commands", "admin.info_project_name")}** ${client.manifest.metadata.bot.codename}
  • **${client.i18n.get(handler.language, "client.commands", "admin.info_version")}** ${client.manifest.metadata.bot.version}
  • **${client.i18n.get(handler.language, "client.commands", "admin.info_description")}** ${client.manifest.metadata.bot.description}
  • **${client.i18n.get(handler.language, "client.commands", "admin.info_autofix_version")}** ${client.manifest.metadata.autofix.version}
  • **${client.i18n.get(handler.language, "client.commands", "admin.info_autofix_codename")}** ${client.manifest.metadata.autofix.codename}
  • **${client.i18n.get(handler.language, "client.commands", "admin.info_discordjs")}** ${client.manifest.package.discordjs}
  • **${client.i18n.get(handler.language, "client.commands", "admin.info_nodejs")}** ${process.version}
  • **${client.i18n.get(handler.language, "client.commands", "admin.info_typescript")}** ${client.manifest.package.typescript}
  • **${client.i18n.get(handler.language, "client.commands", "admin.info_total_packages")}** ${client.manifest.package.totalAmount}
  • **${client.i18n.get(handler.language, "client.commands", "admin.info_support_contact")}** ${client.config.bot.SERVER_SUPPORT_URL}
  • **${client.i18n.get(handler.language, "client.commands", "admin.info_developer")}** [${client.manifest.metadata.bot.developer.name}](${client.manifest.metadata.bot.developer.contact})
  `;

    const embed = new EmbedBuilder()
      .setColor(client.color_second)
      .setThumbnail(client.user!.displayAvatarURL({ size: 512 }))
      .addFields({ 
        name: client.i18n.get(handler.language, "client.commands", "admin.info_bot_info_field"), 
        value: botInfo, 
        inline: false 
      })
      .addFields({
        name: client.i18n.get(handler.language, "client.commands", "admin.info_technical_info_field"),
        value: Metadata,
        inline: false,
      });

    handler.editReply({ embeds: [embed], components: [] });
  }
}
