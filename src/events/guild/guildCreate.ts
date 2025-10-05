import { Manager } from "../../manager.js";
import { stripIndents } from "common-tags";
import {
  EmbedBuilder,
  ChannelType,
  TextChannel,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  Guild,
  MessageFlags,
} from "discord.js";
import { GuildLanguageManager } from "../../utilities/GuildLanguageManager.js";
import { log } from "../../utilities/LoggerHelper.js";

export default class {
  async execute(client: Manager, guild: Guild) {
    const BlacklistGuild = await client.db.BlacklistGuild.get(guild.id);
    if (BlacklistGuild) {
      await guild.leave();
      // Log đã bị xóa - blacklisted guild
      return;
    }
    
    // Log đã bị xóa - joined guild
    
    // Auto-detect và set ngôn ngữ cho guild dựa trên preferred_locale
    await GuildLanguageManager.setupGuildLanguage(client, guild);
    
    // Lấy ngôn ngữ đã được set để sử dụng trong các tin nhắn
    const guildLanguage = await GuildLanguageManager.getGuildLanguage(client, guild.id);
    
    client.guilds.cache.set(`${guild!.id}`, guild);
    // Log channel đã bị xóa - Chỉ chạy phần giới thiệu bot, không gửi log

    // Giới thiệu bot
    try {
      let PREFIX = client.prefix;
      let guildChannel = guild.channels.cache.find((channel) => {
        if (
          channel.type === ChannelType.GuildText &&
          channel.permissionsFor(client.user!)?.has("SendMessages")
        ) {
          return channel.name.toLowerCase().includes("bot");
        }
        return false;
      });

      if (!guildChannel) {
        const textChannels = guild.channels.cache.filter(
          (channel) =>
            channel.type === ChannelType.GuildText &&
            channel.permissionsFor(client.user!)?.has("SendMessages")
        );
        const randomChannel = textChannels.random();
        if (randomChannel) {
          guildChannel = randomChannel;
        }
      }

      if (guildChannel) {
        const welcomeEmbed = new EmbedBuilder()
          .setTitle(
            `${client.i18n.get(guildLanguage, "events.guild", "join_msg_title", {
              bot: client.user!.username,
              username: String(client.user?.username),
            })}`
          )
          .setURL(
            `https://discord.com/oauth2/authorize?client_id=${
              client.user!.id
            }&permissions=8&scope=bot`
          )
          .setColor(client.color_second)
          .setThumbnail(client.user!.displayAvatarURL({ size: 1024 }))
          .setDescription(
            stripIndents`
                ${client.i18n.get(guildLanguage, "events.guild", "join_msg_desc", {
                  prefix: PREFIX,
                  bot: client.user!.username,
                  website: client.config.bot.WEBSITE_URL,
                })}
              `
          );

        const AddButton = new ActionRowBuilder<ButtonBuilder>();
        if (client.config.bot.PREMIUM_URL) {
          AddButton.addComponents(
            new ButtonBuilder()
              .setLabel("Nhận Premium")
              .setStyle(ButtonStyle.Link)
              .setURL(client.config.bot.PREMIUM_URL)
          );
        }

        await (guildChannel as TextChannel).send({
          flags: MessageFlags.SuppressNotifications,
          content: " ",
          embeds: [welcomeEmbed],
          components: AddButton.components.length ? [AddButton] : [],
        });
      }
    } catch (error) {
      // Log đã bị xóa - failed to send intro
    }
  }
}
