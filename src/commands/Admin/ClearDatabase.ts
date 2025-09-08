import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import {
  ApplicationCommandOptionType,
  CommandInteractionOptionResolver,
  MessageFlags,
} from "discord.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

export default class implements Command {
  public name = ["clear", "database"];
  public description = "Xóa dữ liệu từ cơ sở dữ liệu đã chọn";
  public category = "Admin";
  public accessableby = data.COMMANDS_ACCESS.ADMIN.ClearDatabase;
  public usage = "";
  public aliases = [];
  public lavalink = false;
  public usingInteraction = true;
  public playerCheck = false;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "database",
      description: "Chọn loại cơ sở dữ liệu để xóa, hoặc 'all' để xóa tất cả",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: "Chế độ 24/7", value: "autoreconnect" },
        { name: "Blacklist máy chủ", value: "blacklistguild" },
        { name: "Blacklist người dùng", value: "blacklistuser" },
        { name: "Mã Premium", value: "premiumcode" },
        { name: "Thống kê lệnh người dùng", value: "commanduserusage" },
        { name: "Nút điều khiển", value: "controlbutton" },
        { name: "Người dùng Premium", value: "premiumuser" },
        { name: "Máy chủ Premium", value: "premiumguild" },
        { name: "Ngôn ngữ", value: "language" },
        { name: "Last Fm", value: "lastfm" },
        { name: "Bài đã phát (Toàn cầu)", value: "playedsongglobal" },
        { name: "Bài đã phát (Máy chủ)", value: "playedsongguild" },
        { name: "Bài đã phát (Người dùng)", value: "playedsonguser" },
        { name: "Playlist", value: "playlist" },
        { name: "Tiền tố (Prefix)", value: "prefix" },
        { name: "Setup", value: "setup" },
        { name: "Giao diện (Themes)", value: "themes" },
        { name: "Số lượt vote", value: "votes" },
        { name: "Nhắc vote", value: "votereminders" },
        { name: "Top Track", value: "toptrack" },
        { name: "Top Artist", value: "topartist" },
        { name: "Tất cả cơ sở dữ liệu", value: "all" },
      ],
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    if (!handler.interaction) return;

    const interaction = handler.interaction as any;
    const databaseCategory = (interaction.options as CommandInteractionOptionResolver).getString(
      "database"
    );

    const dbName = this.options[0].choices.find(
      (choice) => choice.value === databaseCategory
    )?.name;

    try {
      let resultMessage = "";

      switch (databaseCategory) {
        case "all":
          await Promise.all([
            client.db.autoreconnect.deleteAll(),
            client.db.BlacklistGuild.deleteAll(),
            client.db.BlacklistUser.deleteAll(),
            client.db.code.deleteAll(),
            client.db.CommandGlobalUsage.deleteAll(),
            client.db.CommandUserUsage.deleteAll(),
            client.db.ControlButton.deleteAll(),
            client.db.premium.deleteAll(),
            client.db.preGuild.deleteAll(),
            client.db.language.deleteAll(),
            client.db.LastFm.deleteAll(),
            client.db.maintenance.deleteAll(),
            client.db.PlayedSongGlobal.deleteAll(),
            client.db.PlayedSongGuild.deleteAll(),
            client.db.PlayedSongUser.deleteAll(),
            client.db.playlist.deleteAll(),
            client.db.prefix.deleteAll(),
            client.db.setup.deleteAll(),
            client.db.Themes.deleteAll(),
            client.db.votes.deleteAll(),
            client.db.VoteReminders.deleteAll(),
            client.db.TopTrack.deleteAll(),
            client.db.TopArtist.deleteAll(),
            client.db.SpotifyId.deleteAll(),
          ]);
          resultMessage = "Đã xóa thành công tất cả các loại cơ sở dữ liệu.";
          break;
        case "autoreconnect":
          await client.db.autoreconnect.deleteAll();
          resultMessage = `Đã xóa thành công cơ sở dữ liệu ${dbName}.`;
          break;
        case "blacklistguild":
          await client.db.BlacklistGuild.deleteAll();
          resultMessage = `Đã xóa thành công cơ sở dữ liệu ${dbName}.`;
          break;
        case "blacklistuser":
          await client.db.BlacklistUser.deleteAll();
          resultMessage = `Đã xóa thành công cơ sở dữ liệu ${dbName}.`;
          break;
        case "premiumcode":
          await client.db.code.deleteAll();
          resultMessage = `Đã xóa thành công cơ sở dữ liệu ${dbName}.`;
          break;
        case "commanduserusage":
          await client.db.CommandUserUsage.deleteAll();
          resultMessage = `Đã xóa thành công cơ sở dữ liệu ${dbName}.`;
          break;
        case "controlbutton":
          await client.db.ControlButton.deleteAll();
          resultMessage = `Đã xóa thành công cơ sở dữ liệu ${dbName}.`;
          break;
        case "premiumuser":
          await client.db.premium.deleteAll();
          resultMessage = `Đã xóa thành công cơ sở dữ liệu ${dbName}.`;
          break;
        case "premiumguild":
          await client.db.preGuild.deleteAll();
          resultMessage = `Đã xóa thành công cơ sở dữ liệu ${dbName}.`;
          break;
        case "language":
          await client.db.language.deleteAll();
          resultMessage = `Đã xóa thành công cơ sở dữ liệu ${dbName}.`;
          break;
        case "lastfm":
          await client.db.LastFm.deleteAll();
          resultMessage = `Đã xóa thành công cơ sở dữ liệu ${dbName}.`;
          break;
        case "playedsongglobal":
          await client.db.PlayedSongGlobal.deleteAll();
          resultMessage = `Đã xóa thành công cơ sở dữ liệu ${dbName}.`;
          break;
        case "playedsongguild":
          await client.db.PlayedSongGuild.deleteAll();
          resultMessage = `Đã xóa thành công cơ sở dữ liệu ${dbName}.`;
          break;
        case "playedsonguser":
          await client.db.PlayedSongUser.deleteAll();
          resultMessage = `Đã xóa thành công cơ sở dữ liệu ${dbName}.`;
          break;
        case "playlist":
          await client.db.playlist.deleteAll();
          resultMessage = `Đã xóa thành công cơ sở dữ liệu ${dbName}.`;
          break;
        case "prefix":
          await client.db.prefix.deleteAll();
          resultMessage = `Đã xóa thành công cơ sở dữ liệu ${dbName}.`;
          break;
        case "setup":
          await client.db.setup.deleteAll();
          resultMessage = `Đã xóa thành công cơ sở dữ liệu ${dbName}.`;
          break;
        case "themes":
          await client.db.Themes.deleteAll();
          resultMessage = `Đã xóa thành công cơ sở dữ liệu ${dbName}.`;
          break;
        case "votes":
          await client.db.votes.deleteAll();
          resultMessage = `Đã xóa thành công cơ sở dữ liệu ${dbName}.`;
          break;
        case "votereminders":
          await client.db.VoteReminders.deleteAll();
          resultMessage = `Đã xóa thành công cơ sở dữ liệu ${dbName}.`;
          break;
        case "toptrack":
          await client.db.TopTrack.deleteAll();
          resultMessage = `Đã xóa thành công cơ sở dữ liệu ${dbName}.`;
          break;
        case "topartist":
          await client.db.TopArtist.deleteAll();
          resultMessage = `Đã xóa thành công cơ sở dữ liệu ${dbName}.`;
          break;
        default:
          resultMessage = "Loại cơ sở dữ liệu không hợp lệ.";
          break;
      }

      await handler.interaction.reply({
        content: resultMessage,
        embeds: [],
        components: [],
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      client.logger.info("ClearDatabase", `Lỗi khi xóa cơ sở dữ liệu, ${error}`);
      await handler.interaction.reply({
        content: `Đã xảy ra lỗi khi xóa cơ sở dữ liệu: ${error.message}`,
        embeds: [],
        components: [],
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}
