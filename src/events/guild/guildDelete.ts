import { Manager } from "../../manager.js";
import { EmbedBuilder, Guild, TextChannel } from "discord.js";
import { log } from "../../utilities/LoggerHelper.js";

export default class {
  async execute(client: Manager, guild: Guild) {
    // Log đã bị xóa - Đã rời guild
    const language = client.config.bot.LANGUAGE;
    client.guilds.cache.delete(`${guild!.id}`);
    await client.db.setup.delete(guild.id);
    await client.db.language.delete(guild.id);
    await client.db.autoreconnect.delete(guild.id);
    await client.db.prefix.delete(guild.id);
    await client.db.ControlButton.delete(guild.id);
    await client.db.PlayedSongGuild.delete(guild.id);
    await client.db.TempVoiceChannel.delete(guild.id);
    await client.db.TempVoiceChannelSetting.delete(guild.id);
    
    // Log channel đã bị xóa - Gửi thông báo leave vào kênh chung thay vì log channel
    try {
      const owner = await client.users.fetch(guild.ownerId);
      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${client.i18n.get(language, "events.guild", "leave_title")}`,
        })
        .setThumbnail(guild.iconURL({ size: 1024 }))
        .addFields([
          {
            name: `${client.i18n.get(language, "events.guild", "guild_name")}`,
            value: `\`${guild.name}\` \n \`${guild.id}\``,
            inline: true,
          },
          {
            name: `${client.i18n.get(language, "events.guild", "guild_member_count")}`,
            value: `\`${guild.memberCount}\` Thành viên`,
            inline: true,
          },
          {
            name: `${client.i18n.get(language, "events.guild", "guild_owner")}`,
            value: `\`${owner.displayName}\` \n \`${owner.id}\``,
            inline: true,
          },
          {
            name: `${client.i18n.get(language, "events.guild", "guild_creation_date")}`,
            value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
            inline: true,
          },
          {
            name: `${client.i18n.get(language, "events.guild", "guild_join_date")}`,
            value: `<t:${Math.floor(guild.joinedTimestamp / 1000)}:F>`,
            inline: true,
          },
          {
            name: `${client.i18n.get(language, "events.guild", "current_server_count")}`,
            value: `\`${client.guilds.cache.size}\` Server`,
            inline: true,
          },
        ])
        .setTimestamp()
        .setColor(client.color_main);

      // Tìm một text channel để gửi thông báo (thay vì log channel đã bị xóa)
      const availableChannels = guild.channels.cache.filter(c => c.isTextBased());
      const channel = availableChannels.first() as TextChannel;
      
      if (channel) {
        await channel.send({ embeds: [embed] });
      }
      // Log đã bị xóa - Đã gửi tin nhắn rời tới kênh
    } catch (err) {
      // Log đã bị xóa - Gửi tin tới kênh thất bại
    }
  }
}
