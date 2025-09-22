import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler, ParseMentionEnum } from "../../structures/CommandHandler.js";
import { Manager } from "../../manager.js";
import { ApplicationCommandOptionType, EmbedBuilder, User } from "discord.js";
import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;
// Đăng ký font để sử dụng trong canvas
GlobalFonts.registerFromPath("./script/Courage-Road.ttf", "Courage Road");

export default class implements Command {
  public name = ["profile"];
  public description = "Lấy thông tin người dùng dưới dạng thẻ";
  public category = "Utils";
  public accessableby = data.COMMANDS_ACCESS.UTILS.Profile;
  public usage = "<mention>";
  public aliases = [];
  public lavalink = false;
  public usingInteraction = true;
  public playerCheck = false;
  public permissions = [];
  public sameVoiceCheck = false;
  public options = [
    {
      name: "user",
      description: "Nhập người dùng cần xem thông tin",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    if (!handler.interaction) return;
    await handler.deferReply();
    const data = handler.args[0];
    const getData = await handler.parseMentions(data);

    if (!getData || getData.type !== ParseMentionEnum.USER) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.utils", "user_arg_error", {
                text: "**@mention**",
              })}`
            )
            .setColor(client.color_main),
        ],
      });
    }

    const user = getData.data as User;

    if (!handler.guild) {
      return handler.editReply({
        content: client.i18n.get(handler.language, "common", "errors.guild_only"),
      });
    }

    const canvas = createCanvas(754, 215);
    const ctx = canvas.getContext("2d");

    if (user) {
      const userPfp = await loadImage(user.displayAvatarURL({ extension: "jpg", size: 1024 }));
      const img = await loadImage("./script/profile.png");

      ctx.font = "22px Courage Road";
      ctx.fillStyle = "#f4e0c7";

      ctx.drawImage(img, 0, 0, 754, 215);
      ctx.fillText(user.username, 278, 65);

      const guildMember = handler.guild.members.cache.get(user.id);
      if (guildMember && guildMember.joinedAt) {
        const joinDate = guildMember.joinedAt.toLocaleDateString();
        ctx.fillText(joinDate, 370, 113);
      } else {
        ctx.fillText("Không có", 370, 118);
      }

      const userJoinDate = user.createdAt.toLocaleDateString();
      ctx.fillText(userJoinDate, 380, 160);

      ctx.beginPath();
      ctx.arc(111, 107, 64, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(userPfp, 47, 43, 128, 128);

      const buffer = canvas.toBuffer("image/jpeg");
      await handler.editReply({
        files: [
          {
            attachment: buffer,
            name: "profile-zk.jpg",
          },
        ],
      });
    } else {
      return handler.editReply({ content: client.i18n.get("vi", "web", "api.user_not_found") });
    }
  }
}
