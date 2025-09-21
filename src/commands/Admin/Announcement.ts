import { ApplicationCommandOptionType, TextChannel, EmbedBuilder, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { ZklinkPlayer } from "../../Zklink/main.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
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
      name: "text",
      type: ApplicationCommandOptionType.String,
      description: "Nội dung thông báo cập nhật",
      required: true,
    },
    {
      name: "image-file",
      type: ApplicationCommandOptionType.Attachment,
      description: "Upload file hình ảnh (tuỳ chọn)",
      required: false,
    },
    {
      name: "image-url",
      type: ApplicationCommandOptionType.String,
      description: "URL hình ảnh (tuỳ chọn)",
      required: false,
    },
  ];

  // Method để xử lý gửi thông báo
  private async processAnnouncement(client: Manager, handler: CommandHandler, input: string, finalImageUrl: string | null) {
    let successfulGuilds = 0;

    for (const guild of client.guilds.cache.values()) {
      const player: ZklinkPlayer | undefined = client.Zklink.players.get(guild.id);

      if (player && player.textId) {
        const playing_channel = guild.channels.cache.get(player.textId) as
          | TextChannel
          | undefined;

        if (input && playing_channel) {
          const announcement = new EmbedBuilder()
            .setDescription(input)
            .setColor(client.color_main);

          if (finalImageUrl) {
            announcement.setImage(finalImageUrl);
          }

          try {
            await playing_channel.send({ embeds: [announcement] });
            successfulGuilds++;
          } catch (err) {
            logWarn(
              "Announcement",
              `Lỗi khi gửi tin nhắn trong kênh ${playing_channel.id}`
            );
          }
        } else {
          logWarn(
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
          `Đã gửi thông báo thành công tới ${successfulGuilds} máy chủ.`
        );
      await handler.editReply({ embeds: [embed], components: [] });
    } else {
      const embed = new EmbedBuilder()
        .setColor(client.color_main)
        .setDescription(
          `${client.i18n.get(handler.language, "commands.admin", "announcement_failure")}`
        );
      await handler.editReply({ embeds: [embed], components: [] });
    }
  }

  public async execute(client: Manager, handler: CommandHandler) {
    try {
      await handler.deferReply();

      const inputProvided = handler.args[0] ? handler.args[0] : null;
      const input = inputProvided ? handler.args[0] : null;
      
      // Lấy attachment và URL từ interaction với tên option mới
      let imageAttachment: any = null;
      let imageUrl: string | null = null;
      
      if (handler.interaction && handler.interaction.isChatInputCommand()) {
        imageAttachment = handler.interaction.options.getAttachment("image-file");
        imageUrl = handler.interaction.options.getString("image-url");
      }

      // Ưu tiên file attachment trước, sau đó mới đến URL
      let finalImageUrl: string | null = null;
      
      // Kiểm tra nếu có cả file và URL
      if (imageAttachment && imageUrl) {
        // Yêu cầu người dùng chọn
        const choiceEmbed = new EmbedBuilder()
          .setColor(client.color_main)
          .setTitle("Chọn nguồn hình ảnh")
          .setDescription("Bạn đã cung cấp cả file và URL hình ảnh. Vui lòng chọn nguồn nào bạn muốn sử dụng:")
          .addFields(
            { name: "📎 File", value: `${imageAttachment.name || "File đã upload"}`, inline: true },
            { name: "🔗 URL", value: `${imageUrl}`, inline: true }
          );

        const choiceButtons = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId("choose_file")
              .setLabel("Sử dụng File")
              .setEmoji("📎")
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId("choose_url")
              .setLabel("Sử dụng URL")
              .setEmoji("🔗")
              .setStyle(ButtonStyle.Secondary)
          );

        await handler.editReply({ 
          embeds: [choiceEmbed], 
          components: [choiceButtons] 
        });

        // Tạo collector để chờ người dùng chọn
        const filter = (i: any) => i.user.id === handler.user.id;
        const collector = handler.interaction?.channel?.createMessageComponentCollector({ 
          filter, 
          time: 30000, 
          max: 1 
        });

        return new Promise<void>((resolve, reject) => {
          collector?.on('collect', async (i) => {
            await i.deferUpdate();
            
            if (i.customId === 'choose_file') {
              // Sử dụng file
              const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
              if (allowedImageTypes.includes(imageAttachment.contentType) || 
                  imageAttachment.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                finalImageUrl = imageAttachment.url;
              }
            } else if (i.customId === 'choose_url') {
              // Sử dụng URL
              try {
                new URL(imageUrl);
                finalImageUrl = imageUrl;
              } catch (error) {
                // Invalid URL, ignore
              }
            }
            
            // Tiếp tục xử lý announcement
            await this.processAnnouncement(client, handler, input, finalImageUrl);
            resolve();
          });

          collector?.on('end', async (collected) => {
            if (collected.size === 0) {
              const timeoutEmbed = new EmbedBuilder()
                .setColor(client.color_main)
                .setDescription("⏰ Hết thời gian chọn. Vui lòng thử lại lệnh.");
              
              await handler.editReply({ 
                embeds: [timeoutEmbed], 
                components: [] 
              });
              resolve();
            }
          });
        });
      }
      
      // Nếu chỉ có một trong hai
      if (imageAttachment && !imageUrl) {
        // Kiểm tra xem file có phải là ảnh không
        const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedImageTypes.includes(imageAttachment.contentType) || 
            imageAttachment.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          finalImageUrl = imageAttachment.url;
        }
      } else if (imageUrl && !imageAttachment) {
        // Validate URL format
        try {
          new URL(imageUrl);
          finalImageUrl = imageUrl;
        } catch (error) {
          // Invalid URL, ignore
        }
      }

      if (!inputProvided) {
        const embed = new EmbedBuilder()
          .setColor(client.color_main)
          .setDescription(
            `${client.i18n.get(handler.language, "commands.admin", "announcement_desc")}`
          );

        await handler.editReply({ embeds: [embed] });

        const collector = (handler?.channel! as TextChannel).createMessageCollector({
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
            logWarn("Announcement", `Lỗi khi thực thi lệnh`);
          }
        });

        collector?.on("end", async (collected, reason) => {
          if (reason === "time") {
            const embed = new EmbedBuilder()
              .setColor(client.color_main)
              .setDescription(
                `${client.i18n.get(handler.language, "commands.admin", "announcement_timeout")}`
              );

            await handler.editReply({ embeds: [embed] });
          }
          // @ts-ignore
          collector.removeAllListeners();
        });

        return;
      }

      // Nếu không có cả file và URL, xử lý bình thường
      await this.processAnnouncement(client, handler, input!, finalImageUrl);
    } catch (error) {
      logWarn("Announcement", `Lỗi khi gửi thông báo`);
    }
  }
}
