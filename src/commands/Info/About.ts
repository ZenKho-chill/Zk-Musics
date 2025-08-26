import { Manager } from "../../manager.js";
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { stripIndents } from "common-tags";
import { Command, Accessableby } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

export default class implements Command {
  public name = ["about"];
  public description = "Hiển thị thông tin của bot";
  public category = "Info";
  public accessableby = data.COMMANDS_ACCESS.INFO.About;
  public usage = "";
  public aliases = [];
  public lavalink = false;
  public options = [];
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.SilentDeferReply();

    const AboutEmbed = new EmbedBuilder()
      .setAuthor({
        name: `${handler.guild!.members.me!.displayName} — Giới thiệu!`,
        url: `https://discord.com/oauth2/authorize?client_id=${
          client.user!.id
        }&permissions=8&scope=bot`,
        iconURL: client.user!.displayAvatarURL() as string,
      })
      .setColor(client.color_main)
      .setDescription(
        stripIndents`
      ${client.i18n.get(handler.language, "commands.info", "about_desc1", {
        bot: `<@${client.user!.id}>`,
      })}
      ${client.i18n.get(handler.language, "commands.info", "about_desc2", {
        prefix: client.prefix,
        website: client.config.bot.COMMANDS_URL,
      })}
      ${client.i18n.get(handler.language, "commands.info", "about_desc3", {
        prefix: client.prefix,
        serversupport: client.config.bot.SERVER_SUPPORT_URL,
        website: client.config.bot.COMMANDS_URL,
        bot: client.user!.username,
      })}`
      )
      .setImage(client.config.bot.IMAGES_URL_ABOUT);
    if (client.config.bot.TEAM_NAME && client.config.bot.TEAM_URL) {
      AboutEmbed.addFields({
        name: "Đội ngũ",
        value: `**[${client.config.bot.TEAM_NAME}](${client.config.bot.TEAM_URL})**`,
        inline: true,
      });
    }

    AboutEmbed.addFields({
      name: "Loại",
      value: "**Bot nhạc**",
      inline: true,
    });

    if (client.config.bot.PREMIUM_URL) {
      AboutEmbed.addFields({
        name: "Ủng hộ",
        value: `**[Nhận Premium](${client.config.bot.PREMIUM_URL})**`,
        inline: true,
      });
    }

    const AboutButton = new ActionRowBuilder<ButtonBuilder>();
    if (client.config.MENU_HELP_EMOJI.E_INVITE) {
      AboutButton.addComponents(
        new ButtonBuilder()
          .setLabel("Mời bot")
          .setEmoji(client.config.MENU_HELP_EMOJI.E_INVITE)
          .setStyle(ButtonStyle.Link)
          .setURL(
            `https://discord.com/oauth2/authorize?client_id=${
              client.user!.id
            }&permissions=8&scope=bot`
          )
      );
    }

    if (
      client.config.bot.SERVER_SUPPORT_URL &&
      client.config.MENU_HELP_EMOJI.E_SUPPORT
    ) {
      AboutButton.addComponents(
        new ButtonBuilder()
          .setLabel("Hỗ trợ máy chủ")
          .setEmoji(client.config.MENU_HELP_EMOJI.E_SUPPORT)
          .setStyle(ButtonStyle.Link)
          .setURL(client.config.bot.SERVER_SUPPORT_URL)
      );
    }
    if (client.config.bot.VOTE_URL && client.config.MENU_HELP_EMOJI.E_VOTE) {
      AboutButton.addComponents(
        new ButtonBuilder()
          .setLabel("Bình chọn")
          .setEmoji(client.config.MENU_HELP_EMOJI.E_VOTE)
          .setStyle(ButtonStyle.Link)
          .setURL(client.config.bot.VOTE_URL)
      );
    }

    await handler.editReply({
      embeds: [AboutEmbed],
      components: AboutButton.components.length ? [AboutButton] : [],
    });
  }
}
