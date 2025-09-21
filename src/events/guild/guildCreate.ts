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
import { logInfo } from "../../utilities/Logger.js";

export default class {
  async execute(client: Manager, guild: Guild) {
    const BlacklistGuild = await client.db.BlacklistGuild.get(guild.id);
    if (BlacklistGuild) {
      await guild.leave();
      logInfo(
        "GuildCreate",
        `Đã chặn guild ${guild.name} không được gia nhập do hạn chế blacklist (tự rời)`
      );
      return;
    }
    
    logInfo("GuildCreate", `Đã tham gia guild ${guild.name} @ ${guild.id}`);
    
    // Auto-detect và set ngôn ngữ cho guild dựa trên preferred_locale
    await GuildLanguageManager.setupGuildLanguage(client, guild);
    
    // Lấy ngôn ngữ đã được set để sử dụng trong các tin nhắn
    const guildLanguage = await GuildLanguageManager.getGuildLanguage(client, guild.id);
    
    client.guilds.cache.set(`${guild!.id}`, guild);
    if (!client.config.logchannel.GuildJoinChannelID) return;
    try {
      const eventChannel = await client.channels.fetch(client.config.logchannel.GuildJoinChannelID);
      if (!eventChannel || !eventChannel.isTextBased()) return;
      const owner = await client.users.fetch(guild.ownerId);

      const embed = new EmbedBuilder()
        .setThumbnail(guild.iconURL({ size: 1024 }))
        .setAuthor({
          name: `${client.i18n.get(guildLanguage, "events.guild", "joined_title")}`,
        })
        .addFields([
          {
            name: `${client.i18n.get(guildLanguage, "events.guild", "guild_name")}`,
            value: `\`${guild.name}\` \n \`${guild.id}\``,
            inline: true,
          },
          {
            name: `${client.i18n.get(guildLanguage, "events.guild", "guild_member_count")}`,
            value: `\`${guild.memberCount}\` Thành viên`,
            inline: true,
          },
          {
            name: `${client.i18n.get(guildLanguage, "events.guild", "guild_owner")}`,
            value: `\`${owner.displayName}\` \n \`${owner.id}\``,
            inline: true,
          },
          {
            name: `${client.i18n.get(guildLanguage, "events.guild", "guild_creation_date")}`,
            value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
            inline: true,
          },
          {
            name: `${client.i18n.get(guildLanguage, "events.guild", "guild_join_date")}`,
            value: `<t:${Math.floor(guild.joinedTimestamp / 1000)}:F>`,
            inline: true,
          },
          {
            name: `${client.i18n.get(guildLanguage, "events.guild", "current_server_count")}`,
            value: `\`${client.guilds.cache.size}\` Server`,
            inline: true,
          },
        ])
        .setColor(client.color_main)
        .setTimestamp();

      const channel = eventChannel as TextChannel;
      await channel.send({
        embeds: [embed],
      });
      logInfo(
        "GuildCreate",
        `Đã gửi tin nhắn chào mừng tới kênh sự kiện cho guild ${guild.name}`
      );

      // Giới thiệu bot
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
      logInfo(
        "GuildCreate",
        `Không thể gửi tin giới thiệu bot cho guild @ ${guild.name} @ ${guild.id}` + error
      );
    }
  }
}
