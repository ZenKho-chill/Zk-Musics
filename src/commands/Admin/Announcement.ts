import {
  ApplicationCommandOptionType,
  TextChannel,
  EmbedBuilder,
} from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { ZklinkPlayer } from "../../zklink/main.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

export default class implements Command {
  public name = ["announcement"];
  public description = "Gửi thông báo tới tất cả máy chủ";
  public category = "Admin";
  public accessableby = data.COMMANDS_ACCESS.ADMIN.Announcement;
  public usage = "[mô tả]";
  public aliases = ["ann"];
  public lavalink = true;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "input",
      type: ApplicationCommandOptionType.String,
      description: "Nội dung thông báo cập nhật",
      required: true,
    },
    {
      name: "imageurl",
      type: ApplicationCommandOptionType.String,
      description: "URL hình ảnh để chèn vào thông báo (tuỳ chọn)",
      required: false,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    try {
      await handler.deferReply();

      const inputProvided = handler.args[0] ? handler.args[0] : null;
      const input = inputProvided ? handler.args[0] : null;
      const imageUrl = handler.args[1] as string | null;

      if (!inputProvided) {
        const embed = new EmbedBuilder()
          .setColor(client.color_main)
          .setDescription(
            `${client.i18n.get(
              handler.language,
              "commands.admin",
              "announcement_desc"
            )}`
          );

        await handler.editReply({ embeds: [embed] });

        const collector = (
          handler?.channel! as TextChannel
        ).createMessageCollector({
          max: 1,
          time: 60000, // Time in milliseconds (e.g., 60000 = 1 minute)
        });

        collector?.on("collect", async (msg) => {
          const collectedInput = msg.content;
          collector.stop("collected");
          try {
            // Execute the command again with the collected input
            handler.args[0] = collectedInput;
            await this.execute(client, handler);
          } catch (error) {
            client.logger.warn("Announcement", `Lỗi khi thực thi lệnh`);
          }
        });

        collector?.on("end", async (collected, reason) => {
          if (reason === "time") {
            const embed = new EmbedBuilder()
              .setColor(client.color_main)
              .setDescription(
                `${client.i18n.get(
                  handler.language,
                  "commands.admin",
                  "announcement_timeout"
                )}`
              );

            await handler.editReply({ embeds: [embed] });
          }
          // @ts-ignore
          collector.removeAllListeners();
        });

        return;
      }

      let successfulGuilds = 0;

      for (const guild of client.guilds.cache.values()) {
        const player: ZklinkPlayer | undefined = client.zklink.players.get(
          guild.id
        );

        if (player && player.textId) {
          const playing_channel = guild.channels.cache.get(player.textId) as
            | TextChannel
            | undefined;

          if (input && playing_channel) {
            const announcement = new EmbedBuilder()
              .setDescription(input)
              .setColor(client.color_main);

            if (imageUrl) {
              announcement.setImage(imageUrl);
            }

            try {
              await playing_channel.send({ embeds: [announcement] });
              successfulGuilds++;
            } catch (err) {
              client.logger.warn(
                "Announcement",
                `Lỗi khi gửi tin nhắn trong kênh ${playing_channel.id}`
              );
            }
          } else {
            client.logger.warn(
              "Announcement",
              `Không tìm thấy kênh có ID ${player.textId} trong ${guild.name}.`
            );
          }
        }
      }

      if (successfulGuilds > 0) {
        const embed = new EmbedBuilder()
          .setColor(client.color_main)
          .setDescription(
            `Thành công ở ${successfulGuilds} máy chủ${
              successfulGuilds !== 1 ? "s" : ""
            }.`
          );
        await handler.editReply({ embeds: [embed] });
      } else {
        const embed = new EmbedBuilder()
          .setColor(client.color_main)
          .setDescription(
            `${client.i18n.get(
              handler.language,
              "commands.admin",
              "announcement_failure"
            )}`
          );
        await handler.editReply({ embeds: [embed] });
      }
    } catch (error) {
      client.logger.warn("Announcement", `Lỗi khi gửi thông báo`);
    }
  }
}
