import {
  EmbedBuilder,
  ApplicationCommandOptionType,
  CommandInteractionOptionResolver,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  MessageFlags,
  ChatInputCommandInteraction,
} from "discord.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

// Mã chính
export default class implements Command {
  public name = ["lastfm"];
  public description = "Quản lý tài khoản Last.fm để scrobble";
  public category = "Settings";
  public accessableby = data.COMMANDS_ACCESS.SETTINGS.LastFm;
  public usage = "<đăng_nhập|đăng_xuất>";
  public aliases = [];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "type",
      description: "Chọn đăng nhập hoặc đăng xuất",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        {
          name: "login",
          value: "login",
        },
        {
          name: "Đăng xuất",
          value: "logout",
        },
      ],
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    if (!handler.interaction) return;
    await handler.deferReply();

    // Cek apakah fitur Last.fm diaktifkan
    if (!client.config.features.WebServer.LAST_FM_SCROBBLED.Enable) {
      const embed = new EmbedBuilder()
        .setTitle(
          `${client.i18n.get(
            handler.language,
            "commands.settings",
            "lastfm_feature_disabled_title"
          )}`
        )
        .setDescription(
          `${client.i18n.get(
            handler.language,
            "commands.settings",
            "lastfm_feature_disabled_desc"
          )}`
        )
        .setColor(client.color_main);

      await handler.interaction?.reply({
        flags: MessageFlags.Ephemeral,
        embeds: [embed],
      });
      return;
    }

    const user = handler.user;
    const options = (handler.interaction as ChatInputCommandInteraction)
      .options as CommandInteractionOptionResolver;
    const type = options.getString("type") as "login" | "logout";

    if (type === "login") {
      const authUrl = `https://www.last.fm/api/auth?api_key=${
        client.config.features.WebServer.LAST_FM_SCROBBLED.ApiKey
      }&cb=${encodeURIComponent(
        `${client.config.features.WebServer.LAST_FM_SCROBBLED.Callback}?user=${user?.id || ""}`
      )}`;

      const LastFMButton = new ActionRowBuilder<ButtonBuilder>();
      LastFMButton.addComponents(
        new ButtonBuilder().setLabel("Đăng nhập").setStyle(ButtonStyle.Link).setURL(authUrl)
      );

      const embed = new EmbedBuilder()
        .setTitle(`${client.i18n.get("vi", "commands.settings", "lastfm_login_title")}`)
        .setDescription(
          `${client.i18n.get(handler.language, "commands.settings", "lastfm_login_desc", {
            url: authUrl,
          })}`
        )
        .setFooter({
          text: `${client.i18n.get(handler.language, "commands.settings", "lastfm_login_footer", {
            expired:
              String(client.config.features.WebServer.LAST_FM_SCROBBLED.ExpiredLink / 1000) +
              " giây",
          })}`,
        })
        .setColor(client.color_main);

      const msg = await handler.editReply({
        embeds: [embed],
        components: [LastFMButton],
      });
      // Đặt timeout để vô hiệu hóa nút sau thời gian hết hạn
      setTimeout(async () => {
        LastFMButton.components[0].setDisabled(true);
        if (msg) {
          await msg.edit({
            components: [LastFMButton],
          });
        }
      }, client.config.features.WebServer.LAST_FM_SCROBBLED.ExpiredLink);

      // Lưu bản ghi tạm thời vào cơ sở dữ liệu để chờ callback
      await client.db.LastFm.set(user?.id || "", { userId: user?.id || "" });
    } else if (type === "logout") {
      // Kiểm tra xem người dùng đã đăng nhập chưa
      const lastFmData = await client.db.LastFm.get(user?.id || "");

      if (!lastFmData || !lastFmData.sessionKey) {
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${client.i18n.get(handler.language, "commands.settings", "lastfm_not_login_desc", {
                  name: this.name[0],
                })}`
              )
              .setColor(client.color_main),
          ],
        });
      }
      // Xóa dữ liệu Last.fm của người dùng khỏi cơ sở dữ liệu
      await client.db.LastFm.delete(user?.id || "");

      const embed = new EmbedBuilder()
        .setTitle(
          `${client.i18n.get("vi", "commands.settings", "lastfm_logout_title")}`
        )
        .setDescription(
          `${client.i18n.get("vi", "commands.settings", "lastfm_logout_desc")}`
        )
        .setColor(client.color_main);

      await handler.editReply({ embeds: [embed] });
    }
  }
}
