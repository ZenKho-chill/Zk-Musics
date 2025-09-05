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

// Đăng ký font để sử dụng trong canvas
GlobalFonts.registerFromPath("./scripts/Courage-Road.ttf", "Courage Road");
export class WelcomerEvents {
  client: Manager;

  constructor(client: Manager) {
    this.client = client;
    this.execute();
  }
  async execute() {
    const language = this.client.config.bot.LANGUAGE;

    const generateImage = async (member: GuildMember, channelId: string, isWelcome: boolean) => {
      try {
        const greetings =
          this.client.config.WELCOMER_EVENTS.GREETINGS[isWelcome ? "welcome" : "bye"];
        const images = [
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

        const textColors = {
          greeting: this.client.config.WELCOMER_EVENTS.COLOR_GREETINGS,
          username: this.client.config.WELCOMER_EVENTS.COLOR_USERNAME,
          subtitle: this.client.config.WELCOMER_EVENTS.COLOR_SUBTITLE,
        };
        const SubtitleText = this.client.config.WELCOMER_EVENTS.SUBTITLE;
        const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
        const randomImageIndex = Math.floor(Math.random() * images.length);
        const selectedImage = images[randomImageIndex];

        const guildMember = member as GuildMember;

        const img = await loadImage(selectedImage);
        const userPfp = await loadImage(
          guildMember.user.displayAvatarURL({
            extension: "jpg",
            size: 1024,
          })
        );

        const greetingText = `${randomGreeting}`;
        const namee =
          member.user.username.length > 15
            ? member.user.username.substring(0, 15) + "."
            : member.user.username;

        const greetingColor = textColors.greeting;
        const usernameColor = textColors.username;
        const SubtitleColor = textColors.subtitle;

        const canvas = createCanvas(700, 150);
        const ctx = canvas.getContext("2d");

  // Vẽ ảnh nền
  ctx.drawImage(img, 0, 0, 700, 150);

  // Vẽ chữ chào
  ctx.fillStyle = greetingColor;
        ctx.font = "22px Courage Road";
        ctx.fillText(greetingText, 160, 70);

  // Vẽ tên người dùng
  ctx.fillStyle = usernameColor;
        ctx.font = "22px Courage Road";
  ctx.fillText(namee, 160 + ctx.measureText(greetingText).width + 10, 70); // Đặt tên sau chữ chào

  // Vẽ phụ đề
  ctx.fillStyle = SubtitleColor;
        ctx.font = "12px Courage Road";
        ctx.fillText(SubtitleText, 160, 100);

  // Vẽ ảnh đại diện người dùng
        ctx.save();
        ctx.beginPath();
        ctx.arc(100, 75, 47, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(userPfp, 53, 28, 94, 94);
        ctx.restore();

        return canvas.toBuffer("image/png");
      } catch (error) {
        this.client.logger.warn(WelcomerEvents.name, `Lỗi khi tạo ảnh: ${error}`);
        // Trả về null thay vì undefined để rõ ràng hơn
        return null;
      }
    };

    this.client.on("guildMemberAdd", async (member: GuildMember) => {
      try {
        if (member.guild?.id !== this.client.config.WELCOMER_EVENTS.WELCOMER_GUILD_ID) {
          return;
        }

  this.client.logger.info(WelcomerEvents.name, `Thành viên đã tham gia: ${member.user?.tag}`);
        const channelId = this.client.config.WELCOMER_EVENTS.WELCOME_CHANNEL_ID;

        if (!channelId) {
          return;
        }

        const image = await generateImage(member, channelId, true);
        if (!image) {
          this.client.logger.warn(WelcomerEvents.name, "Không thể tạo ảnh chào mừng");
          return;
        }
        
        const attachment = new AttachmentBuilder(image, {
          name: "welcome.png",
        });

        const channel = (await this.client.channels.fetch(channelId)) as TextChannel | null;
        if (!channel) return;

        const WelcomeEmbed = new EmbedBuilder()
          .setImage("attachment://welcome.png")
          .setColor(this.client.color_main);

        const ButtonLink = new ActionRowBuilder<ButtonBuilder>();
        if (
          this.client.config.WELCOMER_EVENTS.BUTTON_NAME &&
          this.client.config.WELCOMER_EVENTS.EMOJI_ID &&
          this.client.config.WELCOMER_EVENTS.BUTTON_URL
        ) {
          ButtonLink.addComponents(
            new ButtonBuilder()
              .setLabel(this.client.config.WELCOMER_EVENTS.BUTTON_NAME)
              .setEmoji(this.client.config.WELCOMER_EVENTS.EMOJI_ID)
              .setStyle(ButtonStyle.Link)
              .setURL(this.client.config.WELCOMER_EVENTS.BUTTON_URL)
          );
        }

        channel
          .send({
            content: `${this.client.i18n.get(language, "events.helper", "welcome_desc", {
              guildname: member.guild ? member.guild.name : "Guild không xác định",
              member: `<@${member.id}>`,
            })}`,
            embeds: [],
            files: [attachment],
            components: ButtonLink.components.length ? [ButtonLink] : [],
          })
          .catch((error) => {
            this.client.logger.warn(WelcomerEvents.name, "Lỗi: " + error);
          });
        } catch (error) {
        this.client.logger.warn(WelcomerEvents.name, "Lỗi: " + error);
      }
    });

    this.client.on("guildMemberRemove", async (member: GuildMember | PartialGuildMember) => {
      try {
        if (member.guild?.id !== this.client.config.WELCOMER_EVENTS.WELCOMER_GUILD_ID) {
          return;
        }

  this.client.logger.info(WelcomerEvents.name, `Thành viên đã rời: ${member.user?.tag}`);
        const channelId = this.client.config.WELCOMER_EVENTS.LEAVE_CHANNEL_ID;

        if (!channelId) {
          return;
        }

        const image = await generateImage(member as GuildMember, channelId, false);
        if (!image) {
          this.client.logger.warn(WelcomerEvents.name, "Không thể tạo ảnh tạm biệt");
          return;
        }
        
        const attachment = new AttachmentBuilder(image, {
          name: "goodbye.png",
        });

        const channel = (await this.client.channels.fetch(channelId)) as TextChannel | null;
        if (!channel) return;

        const LeaveEmbed = new EmbedBuilder()
          .setImage("attachment://goodbye.png")
          .setColor(this.client.color_main);

        channel
          .send({
            content: `${this.client.i18n.get(language, "events.helper", "leave_desc", {
              guildname: member.guild ? member.guild.name : "Guild không xác định",
              member: `<@${member.id}>`,
            })}`,
            embeds: [],
            files: [attachment],
          })
          .catch((error) => {
            this.client.logger.warn(WelcomerEvents.name, "Lỗi: " + error);
          });
      } catch (error) {
        this.client.logger.warn(WelcomerEvents.name, "Lỗi: " + error);
      }
    });
  }
}