import {
  ApplicationCommandOptionType,
  CommandInteractionOptionResolver,
  EmbedBuilder,
  MessageFlags,
  ChatInputCommandInteraction,
} from "discord.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import { SpotifygetAccessToken } from "../../utilities/SpotifygetAccessToken.js";
import axios from "axios";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
const data: Config = new ConfigData().data;

export default class implements Command {
  public name = ["spotify_name", "manage"];
  public description = "Quản lý kết nối Spotify của bạn";
  public category = "Settings";
  public accessableby = data.COMMANDS_ACCESS.SETTINGS.Spotify;
  public usage = "<connect|disconnect>";
  public aliases = [];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "action",
      description: "Chọn hành động: connect hoặc disconnect",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: "Kết nối", value: "connect" },
        { name: "Ngắt kết nối", value: "disconnect" },
      ],
    },
    {
      name: "id",
      description: "ID Spotify của bạn (bắt buộc khi kết nối)",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    if (!handler.interaction) return;

    const options = (handler.interaction as ChatInputCommandInteraction)
      .options as CommandInteractionOptionResolver;
    const action = options.getString("action");
    const spotifyID = options.getString("id");

    if (!client.config.lavalink.SPOTIFY.enable) {
      const embed = new EmbedBuilder()
        .setTitle(
          `${client.i18n.get(
            handler.language,
            "client.commands.settings",
            "spotify.feature_disabled_title"
          )}`
        )
        .setDescription(
          `${client.i18n.get(
            handler.language,
            "client.commands.settings",
            "spotify.feature_disabled_desc",
            {
              user: String(handler.user?.displayName || handler.user?.tag),
              botname: client.user!.username || client.user!.displayName,
            }
          )}`
        )
        .setColor(client.color_main);

      await handler.interaction.reply({
        flags: MessageFlags.Ephemeral,
        embeds: [embed],
      });
      return;
    }

    if (action === "connect") {
      if (!spotifyID) {
        await handler.interaction.reply({
          content: `${client.i18n.get(
            handler.language,
            "client.commands.settings",
            "spotify.connect_provide_id"
          )}`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      try {
        const accessToken = await SpotifygetAccessToken(client);
        const response = await axios.get(`https://api.spotify.com/v1/users/${spotifyID}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const userProfile = response.data;

        await client.db.SpotifyId.set(handler.user!.id, spotifyID);

        await handler.interaction.reply({
          content: `${client.i18n.get(
            handler.language,
            "client.commands.settings",
            "spotify.connect_success",
            {
              name: userProfile.display_name,
              id: spotifyID,
            }
          )}`,
          flags: MessageFlags.Ephemeral,
        });
      } catch (error) {
        logWarn(
          "Spotify",
          `Lưu ID Spotify hoặc lấy profile người dùng thất bại: ${error}`
        );
        await handler.interaction.reply({
          content: `${client.i18n.get(
            handler.language,
            "client.commands.settings",
            "spotify.connect_error"
          )}`,
          flags: MessageFlags.Ephemeral,
        });
      }
    } else if (action === "disconnect") {
      const existingSpotifyID = await client.db.SpotifyId.get(handler.user!.id);

      if (!existingSpotifyID) {
        await handler.interaction.reply({
          content: `${client.i18n.get(
            handler.language,
            "client.commands.settings",
            "spotify.disconnect_not_connected"
          )}`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      try {
        await client.db.SpotifyId.delete(handler.user!.id);
        await handler.interaction.reply({
          content: `${client.i18n.get(
            handler.language,
            "client.commands.settings",
            "spotify.disconnect_success"
          )}`,
          flags: MessageFlags.Ephemeral,
        });
      } catch (error) {
        logWarn("Spotify", `Ngắt kết nối ID Spotify thất bại: ${error}`);
        await handler.interaction.reply({
          content: `${client.i18n.get(
            handler.language,
            "client.commands.settings",
            "spotify.disconnect_error"
          )}`,
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  }
}
