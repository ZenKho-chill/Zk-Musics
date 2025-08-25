import { Manager } from "../../manager.js";
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PartialGuildMember,
  GuildMember,
  TextChannel,
} from "discord.js";
import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";

// Đăng ký font chữ cho canvas
GlobalFonts.registerFromPath("./scripts/Courage-Road.ttf", "Courage Road");

export class WelcomerEvents {
  client: Manager;

  constructor(client: Manager) {
    this.client = client;
    this.execute();
  }

  async execute() {
    const language = this.client.config.bot.LANGUAGE;

    // Hàm tạo ảnh chào mừng / tạm biệt
    const taoAnh = async (
      member: GuildMember,
      channelId: string,
      laChaoMung: boolean
    ) => {
      try {
        // Lấy danh sách câu chào từ config (welcome/bye)
        const loiChao =
          this.client.config.WELCOMER_EVENTS.GREETINGS[
            laChaoMung ? "welcome" : "bye"
          ];

        // Danh sách ảnh nền
        const hinhNen = [
          `${this.client.config.IMAGES_WELCOMER.IMAGES1}`,
          `${this.client.config.IMAGES_WELCOMER.IMAGES2}`,
          `${this.client.config.IMAGES_WELCOMER.IMAGES3}`,
          `${this.client.config.IMAGES_WELCOMER.IMAGES4}`,
          `${this.client.config.IMAGES_WELCOMER.IMAGES5}`,
          `${this.client.config.IMAGES_WELCOMER.IMAGES6}`,
          `${this.client.config.IMAGES_WELCOMER.IMAGES7}`,
          `${this.client.config.IMAGES_WELCOMER.IMAGES8}`,
          `${this.client.config.IMAGES_WELCOMER.IMAGES9}`,
          `${this.client.config.IMAGES_WELCOMER.IMAGES10}`,
        ];

        // Màu chữ
        const mauChu = {
          loiChao: this.client.config.WELCOMER_EVENTS.COLOR_GREETINGS,
          tenNguoiDung: this.client.config.WELCOMER_EVENTS.COLOR_USERNAME,
          phuDe: this.client.config.WELCOMER_EVENTS.COLOR_SUBTITLE,
        };

        const phuDeText = this.client.config.WELCOMER_EVENTS.SUBTITLE;
        const chaoNgauNhien =
          loiChao[Math.floor(Math.random() * loiChao.length)];
        const hinhNgauNhien =
          hinhNen[Math.floor(Math.random() * hinhNen.length)];

        const thanhVien = member as GuildMember;

        const nen = await loadImage(hinhNgauNhien);
        const avatar = await loadImage(
          thanhVien.user.displayAvatarURL({
            extension: "jpg",
            size: 1024,
          })
        );

        const loiChaoText = `${chaoNgauNhien}`;
        const tenNguoiDung =
          member.user.username.length > 15
            ? member.user.username.substring(0, 15) + "."
            : member.user.username;

        const canvas = createCanvas(700, 150);
        const ctx = canvas.getContext("2d");

        // Vẽ nền
        ctx.drawImage(nen, 0, 0, 700, 150);

        // Vẽ lời chào
        ctx.fillStyle = mauChu.loiChao;
        ctx.font = "22px Courage Road";
        ctx.fillText(loiChaoText, 160, 70);

        // Vẽ tên người dùng
        ctx.fillStyle = mauChu.tenNguoiDung;
        ctx.font = "22px Courage Road";
        ctx.fillText(
          tenNguoiDung,
          160 + ctx.measureText(loiChaoText).width + 10,
          70
        );

        // Vẽ phụ đề
        ctx.fillStyle = mauChu.phuDe;
        ctx.font = "12px Courage Road";
        ctx.fillText(phuDeText, 160, 100);

        // Vẽ avatar tròn
        ctx.save();
        ctx.beginPath();
        ctx.arc(100, 75, 47, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 53, 28, 94, 94);
        ctx.restore();

        return canvas.toBuffer("image/png");
      } catch (error) {
        this.client.logger.warn(WelcomerEvents.name, "Lỗi khi tạo ảnh");
      }
    };

    // Sự kiện khi có thành viên mới vào server
    this.client.on("guildMemberAdd", async (member: GuildMember) => {
      try {
        if (
          member.guild?.id !==
          this.client.config.WELCOMER_EVENTS.WELCOMER_GUILD_ID
        ) {
          return;
        }

        this.client.logger.info(
          WelcomerEvents.name,
          `Thành viên vào: ${member.user?.tag}`
        );
        const channelId = this.client.config.WELCOMER_EVENTS.WELCOME_CHANNEL_ID;
        if (!channelId) return;

        const hinhAnh = await taoAnh(member, channelId, true);
        const tepAnh = new AttachmentBuilder(hinhAnh, { name: "welcome.png" });

        const channel = (await this.client.channels.fetch(
          channelId
        )) as TextChannel | null;
        if (!channel) return;

        const nutLink = new ActionRowBuilder<ButtonBuilder>();
        if (
          this.client.config.WELCOMER_EVENTS.BUTTON_NAME &&
          this.client.config.WELCOMER_EVENTS.EMOJI_ID &&
          this.client.config.WELCOMER_EVENTS.BUTTON_URL
        ) {
          nutLink.addComponents(
            new ButtonBuilder()
              .setLabel(this.client.config.WELCOMER_EVENTS.BUTTON_NAME)
              .setEmoji(this.client.config.WELCOMER_EVENTS.EMOJI_ID)
              .setStyle(ButtonStyle.Link)
              .setURL(this.client.config.WELCOMER_EVENTS.BUTTON_URL)
          );
        }

        channel
          .send({
            content: `${this.client.i18n.get(
              language,
              "events.helper",
              "welcome_desc",
              {
                guildname: member.guild ? member.guild.name : "Không xác định",
                member: `<@${member.id}>`,
              }
            )}`,
            files: [tepAnh],
            components: nutLink.components.length ? [nutLink] : [],
          })
          .catch((error) => {
            this.client.logger.warn(WelcomerEvents.name, "Lỗi: " + error);
          });
      } catch (error) {
        this.client.logger.warn(WelcomerEvents.name, "Lỗi: " + error);
      }
    });

    // Sự kiện khi thành viên rời server
    this.client.on(
      "guildMemberRemove",
      async (member: GuildMember | PartialGuildMember) => {
        try {
          if (
            member.guild?.id !==
            this.client.config.WELCOMER_EVENTS.WELCOMER_GUILD_ID
          ) {
            return;
          }

          this.client.logger.info(
            WelcomerEvents.name,
            `Thành viên rời: ${member.user?.tag}`
          );
          const channelId = this.client.config.WELCOMER_EVENTS.LEAVE_CHANNEL_ID;
          if (!channelId) return;

          const hinhAnh = await taoAnh(member as GuildMember, channelId, false);
          const tepAnh = new AttachmentBuilder(hinhAnh, {
            name: "goodbye.png",
          });

          const channel = (await this.client.channels.fetch(
            channelId
          )) as TextChannel | null;
          if (!channel) return;

          channel
            .send({
              content: `${this.client.i18n.get(
                language,
                "events.helper",
                "leave_desc",
                {
                  guildname: member.guild
                    ? member.guild.name
                    : "Không xác định",
                  member: `<@${member.id}>`,
                }
              )}`,
              files: [tepAnh],
            })
            .catch((error) => {
              this.client.logger.warn(WelcomerEvents.name, "Lỗi: " + error);
            });
        } catch (error) {
          this.client.logger.warn(WelcomerEvents.name, "Lỗi: " + error);
        }
      }
    );
  }
}
