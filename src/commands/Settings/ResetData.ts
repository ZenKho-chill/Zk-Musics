import {
  ApplicationCommandOptionType,
  CommandInteractionOptionResolver,
  PermissionFlagsBits,
  MessageFlags,
} from "discord.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

export default class implements Command {
  public name = ["reset", "data"];
  public description = "Đặt lại dữ liệu cho tài khoản hoặc máy chủ";
  public category = "Settings";
  public accessableby = data.COMMANDS_ACCESS.SETTINGS.ResetData;
  public usage = "";
  public aliases = ["rd", "resetdata"];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "type",
      description: "Chọn đặt lại dữ liệu cho người dùng hoặc guild",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: "Người dùng", value: "user" },
        { name: "Máy chủ", value: "guild" },
      ],
    },
    {
      name: "categories",
      description: "Chọn danh mục cơ sở dữ liệu để đặt lại",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        // Guild options
        { name: "Ngôn ngữ (Guild)", value: "language" },
        { name: "Twenty Four Seven (Guild)", value: "twentyfourseven" },
        { name: "Cài đặt nhạc (Guild)", value: "setup" },
        { name: "Chế độ điều khiển (Guild)", value: "controlmode" },
        { name: "Tiền tố (Guild)", value: "prefix" },
        { name: "Kênh tạm (Guild)", value: "tempvoice" },
        { name: "Xóa tất cả (Guild)", value: "resetallguild" },
        // User options
        { name: "Giao diện (Người dùng)", value: "themes" },
        { name: "Lịch sử dùng lệnh (Người dùng)", value: "commandusage" },
        { name: "Bài đã phát (Người dùng)", value: "playedsong" },
        { name: "Bài hàng đầu (Người dùng)", value: "toptrack" },
        { name: "Nghệ sĩ hàng đầu (Người dùng)", value: "topartist" },
        { name: "Spotify (Người dùng)", value: "spotify" },
        { name: "Last Fm (Người dùng)", value: "lastfm" },
        { name: "Bình chọn (Người dùng)", value: "votes" },
        { name: "Nhắc nhớ bình chọn (Người dùng)", value: "votereminder" },
        { name: "Playlist (Người dùng)", value: "playlist" },
        { name: "Thống kê người dùng (Người dùng)", value: "userstatistics" },
        { name: "Xóa tất cả (Người dùng)", value: "resetalluser" },
      ],
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    if (!handler.interaction) return;

    const options = handler.interaction
      .options as CommandInteractionOptionResolver;
    const type = options.getString("type");
    const category = options.getString("categories");
    const guildId = handler.guild?.id;
    const userId = handler.user?.id;

    try {
      let resultMessage = "";

      if (type === "guild") {
        if (!handler.member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
          return handler.interaction.reply({
            content: "Bạn không có quyền quản lý máy chủ này.",
            flags: MessageFlags.Ephemeral,
          });
        }

        switch (category) {
          case "resetallguild":
            await Promise.all([
              client.db.language.delete(guildId!),
              client.db.autoreconnect.delete(guildId!),
              client.db.setup.delete(guildId!),
              client.db.ControlButton.delete(guildId!),
              client.db.prefix.delete(guildId!),
              client.db.TempVoiceChannel.delete(guildId!),
              client.db.TempVoiceChannelSetting.delete(guildId!),
            ]);
            resultMessage =
              "Đã xóa thành công tất cả danh mục cơ sở dữ liệu của máy chủ.";
            break;
          case "language":
            await client.db.language.delete(guildId!);
            resultMessage = "Đã xóa thành công cơ sở dữ liệu Ngôn ngữ.";
            break;
          case "twentyfourseven":
            await client.db.autoreconnect.delete(guildId!);
            resultMessage =
              "Đã xóa thành công cơ sở dữ liệu Twenty Four Seven.";
            break;
          case "setup":
            await client.db.setup.delete(guildId!);
            resultMessage = "Đã xóa thành công cơ sở dữ liệu Cài đặt nhạc.";
            break;
          case "controlmode":
            await client.db.ControlButton.delete(guildId!);
            resultMessage =
              "Đã xóa thành công cơ sở dữ liệu Chế độ điều khiển.";
            break;
          case "prefix":
            await client.db.prefix.delete(guildId!);
            resultMessage = "Đã xóa thành công cơ sở dữ liệu Tiền tố.";
            break;
          case "tempvoice":
            await client.db.TempVoiceChannelSetting.delete(guildId!);
            resultMessage = "Đã xóa thành công cơ sở dữ liệu Kênh tạm.";
            break;
          default:
            resultMessage = "Danh mục cơ sở dữ liệu máy chủ không hợp lệ.";
            break;
        }
      } else if (type === "user") {
        switch (category) {
          case "resetalluser":
            await Promise.all([
              client.db.Themes.delete(userId!),
              client.db.CommandUserUsage.delete(userId!),
              client.db.PlayedSongUser.delete(userId!),
              client.db.TopArtist.delete(userId!),
              client.db.TopTrack.delete(userId!),
              client.db.SpotifyId.delete(userId!),
              client.db.LastFm.delete(userId!),
              client.db.votes.delete(userId!),
              client.db.VoteReminders.delete(userId!),
              client.db.UserStatistics.delete(`${userId!}`),
              client.db.playlist.delete(userId!),
            ]);
            resultMessage =
              "Đã xóa thành công tất cả danh mục cơ sở dữ liệu của người dùng.";
            break;
          case "themes":
            await client.db.Themes.delete(userId!);
            resultMessage = "Đã xóa thành công cơ sở dữ liệu Giao diện.";
            break;
          case "commandusage":
            await client.db.CommandUserUsage.delete(userId!);
            resultMessage =
              "Đã xóa thành công cơ sở dữ liệu Lịch sử dùng lệnh.";
            break;
          case "playedsong":
            await client.db.PlayedSongUser.delete(userId!);
            resultMessage = "Đã xóa thành công cơ sở dữ liệu Bài đã phát.";
            break;
          case "toptrack":
            await client.db.TopTrack.delete(userId!);
            resultMessage = "Đã xóa thành công cơ sở dữ liệu Bài hàng đầu.";
            break;
          case "topartist":
            await client.db.TopArtist.delete(userId!);
            resultMessage = "Đã xóa thành công cơ sở dữ liệu Nghệ sĩ hàng đầu.";
            break;
          case "spotify":
            await client.db.SpotifyId.delete(userId!);
            resultMessage = "Đã xóa thành công cơ sở dữ liệu Spotify.";
            break;
          case "lastfm":
            await client.db.LastFm.delete(userId!);
            resultMessage = "Đã xóa thành công cơ sở dữ liệu Last.fm.";
            break;
          case "votes":
            await client.db.votes.delete(userId!);
            resultMessage = "Đã xóa thành công cơ sở dữ liệu Bình chọn.";
            break;
          case "votereminder":
            await client.db.VoteReminders.delete(userId!);
            resultMessage =
              "Đã xóa thành công cơ sở dữ liệu Nhắc nhớ bình chọn.";
            break;
          case "userstatistics":
            await client.db.UserStatistics.delete(`${userId!}`);
            resultMessage =
              "Đã xóa thành công cơ sở dữ liệu Thống kê người dùng.";
            break;
          case "playlist":
            await client.db.playlist.delete(userId!);
            resultMessage = "Đã xóa thành công cơ sở dữ liệu Playlist.";
            break;
          default:
            resultMessage = "Danh mục cơ sở dữ liệu người dùng không hợp lệ.";
            break;
        }
      }

      await handler.interaction.reply({
        content: resultMessage,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      client.logger.info(
        "Đặt lại dữ liệu",
        `Lỗi khi xóa cơ sở dữ liệu, ${error}`
      );
      await handler.interaction.reply({
        content: `Đã xảy ra lỗi khi xóa cơ sở dữ liệu\n\`${error.message}\``,
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}
s;
