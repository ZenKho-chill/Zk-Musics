import {
  ApplicationCommandOptionType,
  CommandInteractionOptionResolver,
  ChannelType,
  EmbedBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { Manager } from "../../manager.js";
import { Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { NotifyTwitch } from "../../database/schema/NotifyTwitch.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";

const data: Config = new ConfigData().data;

export default class implements Command {
  public name = ["notify", "twitch"];
  public description = "Quản lý thông báo stream Twitch";
  public category = "Settings";
  public accessableby = data.COMMANDS_ACCESS.SETTINGS.NotifyTwitch;
  public usage = "";
  public aliases = [];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "action",
      description: "Chọn thêm hoặc xóa thông báo",
      required: true,
      type: ApplicationCommandOptionType.String,
      choices: [
        { name: "Thêm", value: "add" },
        { name: "Xóa", value: "remove" },
      ],
    },
    {
      name: "username",
      description: "Tên đăng nhập của streamer Twitch",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
    {
      name: "channel",
      description: "Kênh bạn muốn gửi thông báo (chỉ khi thêm)",
      required: false,
      type: ApplicationCommandOptionType.Channel,
    },
    {
      name: "content",
      description: "Nội dung hiển thị trong thông báo. Mention role để ping (chỉ khi thêm)",
      required: false,
      type: ApplicationCommandOptionType.String,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    if (!handler.interaction) return;
    await handler.deferReply();
    const options = (handler.interaction as ChatInputCommandInteraction)
      .options as CommandInteractionOptionResolver;
    const action = options.getString("action");
    const TwitchUsername = options.getString("username");
    const channel = options.getChannel("channel");
    const content = options.getString("content") || " ";

    // Validate required parameters
    if (!TwitchUsername) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription("❌ Twitch username is required.")
            .setColor(client.color_main),
        ],
      });
    }

    if (!client.config.utilities.NotifyTwitch.Enable) {
      await handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.settings", "notify_twitch_disabled", {
                twitchusername: TwitchUsername,
                channelid: channel ? `<#${channel.id}>` : "N/A",
                user: String(handler.user?.displayName || handler.user?.tag),
                botname: client.user!.username || client.user!.displayName,
              })}`
            )
            .setColor(client.color_main),
        ],
      });
      return;
    }

    // Lấy các thông báo hiện có cho guild
    let twitchData: NotifyTwitch | null = await client.db.NotifyTwitch.get(`${handler.guild!.id}`);

    if (!twitchData) {
      // Nếu chưa có dữ liệu, tạo cấu trúc mới
      twitchData = {
        GuildId: handler.guild!.id,
        GuildName: handler.guild!.name,
        TokenAccess: null,
        ExpiresIn: null,
        Notifications: [],
      };
    }

    // Xử lý hành động Thêm
    if (action === "add") {
      // Kiểm tra xem tên Twitch đã được đăng ký chưa
      const existingNotification = twitchData.Notifications.find(
        (notification) => notification.TwitchUsername === TwitchUsername
      );

      if (existingNotification) {
        await handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${client.i18n.get(handler.language, "commands.settings", "notify_twitch_already", {
                  twitchusername: TwitchUsername,
                  channelid: channel ? `<#${channel.id}>` : "N/A",
                  user: String(handler.user?.displayName || handler.user?.tag),
                  botname: client.user!.username || client.user!.displayName,
                })}`
              )
              .setColor(client.color_main),
          ],
        });
        return;
      }

      // Kiểm tra xem guild có premium không và áp giới hạn phù hợp
      const guildData = await client.db.preGuild.get(String(handler.guild?.id));
      const notificationLimit = Number(
        guildData?.isPremium
          ? client.config.utilities.NotifyTwitch.LimitPremium
          : client.config.utilities.NotifyTwitch.LimitNonPremium
      );

      if (twitchData.Notifications.length >= notificationLimit) {
        let description;

        if (guildData?.isPremium) {
          description = `${client.i18n.get(
            handler.language,
            "commands.settings",
            "notify_twitch_limit_reached_premium",
            {
              user: String(handler.user?.displayName || handler.user?.tag),
              botname: client.user!.username || client.user!.displayName,
              limit: String(notificationLimit),
              premium: client.config.bot.PREMIUM_URL,
            }
          )}`;
        } else {
          description = `${client.i18n.get(
            handler.language,
            "commands.settings",
            "notify_twitch_limit_reached_non_premium",
            {
              user: String(handler.user?.displayName || handler.user?.tag),
              botname: client.user!.username || client.user!.displayName,
              limit: String(notificationLimit),
              premium: client.config.bot.PREMIUM_URL,
            }
          )}`;
        }

        await handler.editReply({
          embeds: [new EmbedBuilder().setDescription(description).setColor(client.color_main)],
        });
        return;
      }

      if (!channel || channel.type !== ChannelType.GuildText) {
        await handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${client.i18n.get(
                  handler.language,
                  "commands.settings",
                  "notify_twitch_invalid_channel",
                  {
                    twitchusername: TwitchUsername,
                    channelid: channel ? `<#${channel.id}>` : "Không có",
                    user: String(handler.user?.displayName || handler.user?.tag),
                    botname: client.user!.username || client.user!.displayName,
                  }
                )}`
              )
              .setColor(client.color_main),
          ],
        });
        return;
      }

      // Thêm thông báo mới
      twitchData.Notifications.push({
        TwitchUsername,
        ChannelID: channel.id,
        Content: content,
        LastStatus: "offline",
      });

      // Lưu thông báo đã cập nhật vào cơ sở dữ liệu
      await client.db.NotifyTwitch.set(`${handler.guild!.id}`, twitchData);

      await handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.settings", "notify_twitch_set", {
                twitchusername: TwitchUsername,
                channelid: channel ? `<#${channel.id}>` : "N/A",
                user: String(handler.user?.displayName || handler.user?.tag),
                botname: client.user!.username || client.user!.displayName,
              })}`
            )
            .setColor(client.color_main),
        ],
      });
      return;

      // Xử lý hành động Xóa
    } else if (action === "remove") {
      const notificationIndex = twitchData.Notifications.findIndex(
        (notification) => notification.TwitchUsername === TwitchUsername
      );

      if (notificationIndex === -1) {
        await handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${client.i18n.get(
                  handler.language,
                  "commands.settings",
                  "notify_twitch_not_found",
                  {
                    twitchusername: TwitchUsername,
                    user: String(handler.user?.displayName || handler.user?.tag),
                    botname: client.user!.username || client.user!.displayName,
                  }
                )}`
              )
              .setColor(client.color_main),
          ],
        });
        return;
      }

      // Xóa thông báo
      twitchData.Notifications.splice(notificationIndex, 1);

      // Lưu thông báo đã cập nhật vào cơ sở dữ liệu
      await client.db.NotifyTwitch.set(`${handler.guild!.id}`, twitchData);

      await handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.settings", "notify_twitch_removed", {
                twitchusername: TwitchUsername,
                user: String(handler.user?.displayName || handler.user?.tag),
                botname: client.user!.username || client.user!.displayName,
              })}`
            )
            .setColor(client.color_main),
        ],
      });
      return;
    }

    // Xử lý các trường hợp không mong đợi
    await handler.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${client.i18n.get(handler.language, "commands.settings", "notify_twitch_error", {
              twitchusername: TwitchUsername,
              channelid: channel ? `<#${channel.id}>` : "Không có",
              user: String(handler.user?.displayName || handler.user?.tag),
              botname: client.user!.username || client.user!.displayName,
            })}`
          )
          .setColor(client.color_main),
      ],
    });
  }
}
