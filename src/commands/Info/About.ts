import { Manager } from "../../manager.js";
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { stripIndents } from "common-tags";
import { Command, Accessableby } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
import { EmojiValidator } from "../../utilities/EmojiValidator.js";
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
      ${client.i18n.get(handler.language, "client.commands", "info.about_desc1", {
        bot: `<@${client.user!.id}>`,
      })}
      ${client.i18n.get(handler.language, "client.commands", "info.about_desc2", {
        prefix: client.prefix,
        website: client.config.bot.COMMANDS_URL,
      })}
      ${client.i18n.get(handler.language, "client.commands", "info.about_desc3", {
        prefix: client.prefix,
        serversupport: client.config.bot.SERVER_SUPPORT_URL,
        website: client.config.bot.COMMANDS_URL,
        bot: client.user!.username,
      })}`
      )
      .setImage(client.config.bot.IMAGES_URL_ABOUT);
    if (client.config.bot.TEAM_NAME && client.config.bot.TEAM_URL) {
      AboutEmbed.addFields({
        name: client.i18n.get(handler.language, "client.commands", "info.about.team"),
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
        name: client.i18n.get(handler.language, "client.commands", "info.about.support"),
        value: `**[Nhận Premium](${client.config.bot.PREMIUM_URL})**`,
        inline: true,
      });
    }

    const AboutButton = new ActionRowBuilder<ButtonBuilder>();
    
    // Kiểm tra và thêm button Invite với emoji safe
    if (client.config.MENU_HELP_EMOJI.E_INVITE) {
      const inviteEmoji = await EmojiValidator.safeEmojiForButton(
        client, 
        client.config.MENU_HELP_EMOJI.E_INVITE, 
        "➕", 
        true // xóa emoji nếu không có quyền truy cập
      );
      
      const inviteButton = new ButtonBuilder()
        .setLabel("Mời bot")
        .setStyle(ButtonStyle.Link)
        .setURL(
          `https://discord.com/oauth2/authorize?client_id=${
            client.user!.id
          }&permissions=8&scope=bot`
        );
      
      if (inviteEmoji) {
        inviteButton.setEmoji(inviteEmoji);
      }
      
      AboutButton.addComponents(inviteButton);
    }

    // Kiểm tra và thêm button Support với emoji safe
    if (client.config.bot.SERVER_SUPPORT_URL && client.config.MENU_HELP_EMOJI.E_SUPPORT) {
      const supportEmoji = await EmojiValidator.safeEmojiForButton(
        client, 
        client.config.MENU_HELP_EMOJI.E_SUPPORT, 
        "🆘", 
        true // xóa emoji nếu không có quyền truy cập
      );
      
      const supportButton = new ButtonBuilder()
        .setLabel("Hỗ trợ máy chủ")
        .setStyle(ButtonStyle.Link)
        .setURL(client.config.bot.SERVER_SUPPORT_URL);
      
      if (supportEmoji) {
        supportButton.setEmoji(supportEmoji);
      }
      
      AboutButton.addComponents(supportButton);
    }
    
    // Kiểm tra và thêm button Vote với emoji safe
    if (client.config.bot.VOTE_URL && client.config.MENU_HELP_EMOJI.E_VOTE) {
      const voteEmoji = await EmojiValidator.safeEmojiForButton(
        client, 
        client.config.MENU_HELP_EMOJI.E_VOTE, 
        "🗳️", 
        true // xóa emoji nếu không có quyền truy cập
      );
      
      const voteButton = new ButtonBuilder()
        .setLabel("Bình chọn")
        .setStyle(ButtonStyle.Link)
        .setURL(client.config.bot.VOTE_URL);
      
      if (voteEmoji) {
        voteButton.setEmoji(voteEmoji);
      }
      
      AboutButton.addComponents(voteButton);
    }

    await handler.editReply({
      embeds: [AboutEmbed],
      components: AboutButton.components.length ? [AboutButton] : [],
    });
  }
}
