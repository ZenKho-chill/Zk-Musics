import { 
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ComponentType,
  StringSelectMenuInteraction
} from "discord.js";
import { Manager } from "../../manager.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";

const data: Config = new ConfigData().data;

export class PlaylistInfoHandler {
  private formatCreatedTime(timestamp: number): string {
    const date = new Date(timestamp);
    // Chuyển sang timezone Việt Nam (UTC+7)
    const vietnamTime = new Date(date.getTime() + (7 * 60 * 60 * 1000));
    const day = vietnamTime.getUTCDate().toString().padStart(2, '0');
    const month = (vietnamTime.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = vietnamTime.getUTCFullYear();
    const hours = vietnamTime.getUTCHours().toString().padStart(2, '0');
    const minutes = vietnamTime.getUTCMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  public async execute(client: Manager, handler: CommandHandler) {
    // Lấy tất cả playlists mà user có thể xem (owned + public)
    const fullList = await client.db.playlist.all();
    const accessiblePlaylists = fullList.filter((data) => {
      return data.value.owner == handler.user?.id || !data.value.private;
    });

    if (!accessiblePlaylists || accessiblePlaylists.length === 0) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription("❌ Không có playlist nào để xem thông tin!")
            .setColor(client.color_main),
        ],
      });
    }

    // Tạo dropdown với các playlist options (giới hạn 25 options của Discord)
    const playlistOptions = accessiblePlaylists.slice(0, 25).map((playlist, index) => {
      const created = this.formatCreatedTime(playlist.value.created);
      const isOwner = playlist.value.owner === handler.user?.id;
      const privacy = playlist.value.private ? "🔒 Riêng tư" : "🌐 Công khai";
      
      return new StringSelectMenuOptionBuilder()
        .setLabel(`${playlist.value.name || playlist.value.id}`)
        .setDescription(`${playlist.value.tracks?.length || 0} bài • ${privacy} • ${isOwner ? "Của bạn" : "Công khai"}`)
        .setValue(playlist.value.id);
    });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("playlist_select_info")
      .setPlaceholder("Chọn playlist để xem thông tin...")
      .addOptions(playlistOptions);

    const actionRow = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);

    const embed = new EmbedBuilder()
      .setTitle("ℹ️ Thông tin playlist")
      .setDescription(
        `**Playlist có thể xem:** ${accessiblePlaylists.length}\n\n` +
        `Chọn playlist từ dropdown bên dưới để xem thông tin chi tiết:`
      )
      .setColor(client.color_main)
      .setFooter({
        text: accessiblePlaylists.length > 25 ? `Hiển thị 25/${accessiblePlaylists.length} playlist đầu tiên` : `${accessiblePlaylists.length} playlist`,
      });

    const response = await handler.editReply({
      embeds: [embed],
      components: [actionRow],
    });

    // Collector để lắng nghe user chọn playlist
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 300000, // 5 phút timeout
    });

    collector.on("collect", async (interaction: StringSelectMenuInteraction) => {
      if (interaction.user.id !== handler.user?.id) {
        return interaction.reply({
          content: client.i18n.get(handler.language, "client.commands.playlist", "access_cannot_use_dropdown"),
          ephemeral: true,
        });
      }

      const selectedPlaylistId = interaction.values[0];
      
      // Hiển thị thông tin playlist (xóa dropdown)
      await this.showPlaylistInfo(client, handler, interaction, selectedPlaylistId, selectMenu);
    });

    collector.on("end", async (_, reason) => {
      if (reason === "time") {
        selectMenu.setDisabled(true);
        const disabledRow = new ActionRowBuilder<StringSelectMenuBuilder>()
          .addComponents(selectMenu);

        const timeoutEmbed = new EmbedBuilder()
          .setDescription(client.i18n.get(handler.language, "server.events", "playlist_selection_timeout"))
          .setColor(client.color_main);

        await handler.editReply({
          embeds: [timeoutEmbed],
          components: [disabledRow],
        }).catch(() => null);
      }
    });
  }

  private async showPlaylistInfo(
    client: Manager,
    handler: CommandHandler,
    interaction: StringSelectMenuInteraction,
    playlistId: string,
    selectMenu: StringSelectMenuBuilder
  ) {
    const info = await client.db.playlist.get(playlistId);

    if (!info) {
      return interaction.update({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "client.commands.playlist", "pl_info_invalid")}`
            )
            .setColor(client.color_main),
        ],
        components: [],
      });
    }

    if (info.private && info.owner !== handler.user?.id) {
      return interaction.update({
        embeds: [
          new EmbedBuilder()
            .setDescription("❌ Playlist này là riêng tư!")
            .setColor(client.color_main),
        ],
        components: [],
      });
    }

    const created = this.formatCreatedTime(Number(info.created));

    const owner = await client.users.fetch(info.owner).catch(() => null);

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${client.user!.username} Thông tin Playlist!`,
        iconURL: client.user!.displayAvatarURL(),
        url: `https://discord.com/oauth2/authorize?client_id=${
          client.user!.id
        }&permissions=8&scope=bot`,
      })
      .setTitle(info.name)
      .addFields([
        {
          name: `${client.i18n.get(handler.language, "client.commands.playlist", "pl_info_owner")}`,
          value: `${owner?.username || "Unknown User"}`,
        },
        {
          name: `${client.i18n.get(handler.language, "client.commands.playlist", "pl_info_id")}`,
          value: `||${info.id}||`,
        },
        {
          name: `${client.i18n.get(handler.language, "client.commands.playlist", "pl_info_des")}`,
          value: `${
            info.description === null || info.description === "null"
              ? client.i18n.get(handler.language, "client.commands.playlist", "pl_info_no_des")
              : info.description
          }`,
        },
        {
          name: `${client.i18n.get(handler.language, "client.commands.playlist", "pl_info_private")}`,
          value: `${
            info.private
              ? client.i18n.get(handler.language, "client.commands.playlist", "pl_private")
              : client.i18n.get(handler.language, "client.commands.playlist", "pl_public")
          }`,
        },
        {
          name: `${client.i18n.get(handler.language, "client.commands.playlist", "pl_info_created")}`,
          value: `${created}`,
        },
        {
          name: `${client.i18n.get(handler.language, "client.commands.playlist", "pl_info_total")}`,
          value: `${info.tracks!.length} bài`,
        },
      ])
      .setColor(client.color_main)
      .setTimestamp();

    await interaction.update({ 
      embeds: [embed], 
      components: [] // Xóa tất cả components
    });
  }
}
