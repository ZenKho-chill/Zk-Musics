import { EmbedBuilder, ApplicationCommandOptionType, ChannelType } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
import { log } from "../../utilities/LoggerHelper.js";
const data: Config = ConfigData.getInstance().data;

export default class implements Command {
  public name = ["setup"];
  public description = "Thiết lập kênh yêu cầu bài hát";
  public category = "Settings";
  public accessableby = data.COMMANDS_ACCESS.SETTINGS.Setup;
  public usage = "<create> hoặc <delete>";
  public aliases = ["setup"];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];

  options = [
    {
      name: "type",
      description: "Loại thao tác cho kênh",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        {
          name: "Tạo",
          value: "create",
        },
        {
          name: "Xóa",
          value: "delete",
        },
      ],
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();
    let option = ["create", "delete"];

    if (!handler.args[0] || !option.includes(handler.args[0]))
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.settings", "setup_arg_error", {
                text: "**create** hoặc **delete**",
              })}`
            )
            .setColor(client.color_main),
        ],
      });

    const value = handler.args[0];

    if (value === "create") {
      const SetupChannel = await client.db.setup.get(`${handler.guild!.id}`);

      if (SetupChannel && SetupChannel!.enable == true)
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${client.i18n.get(handler.language, "commands.settings", "setup_enable")}`
              )
              .setColor(client.color_main),
          ],
        });

      const parent = await handler.guild!.channels.create({
        name: `${client.user!.username} - Nhạc`,
        type: ChannelType.GuildCategory,
      });
      const textChannel = await handler.guild!.channels.create({
        name: "yeu-cau-bai-hat",
        type: ChannelType.GuildText,
        topic: `${client.i18n.get(handler.language, "commands.settings", "setup_topic")}`,
        parent: parent.id,
      });
      const queueMsg = `${client.i18n.get(
        handler.language,
        "commands.settings",
        "setup_queuemsg"
      )}`;

      const playEmbed = new EmbedBuilder()
        .setColor(client.color_main)
        .setAuthor({
          name: `${client.i18n.get(
            handler.language,
            "commands.settings",
            "setup_playembed_author"
          )}`,
        })
        .setImage(client.config.bot.IMAGES_URL_REQUEST_MUSIC);

      const channel_msg = await textChannel.send({
        content: `${queueMsg}`,
        embeds: [playEmbed],
        components: [client.diSwitch],
      });

      const voiceChannel = await handler.guild!.channels.create({
        name: `${client.user!.username} - Thoại`,
        type: ChannelType.GuildVoice,
        parent: parent.id,
        userLimit: 99,
      });

      const new_data = {
        guild: handler.guild!.id,
        enable: true,
        channel: textChannel.id,
        playmsg: channel_msg.id,
        voice: voiceChannel.id,
        category: parent.id,
      };

      await client.db.setup.set(`${handler.guild!.id}`, new_data);

      const embed = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(handler.language, "commands.settings", "setup_msg", {
            channel: String(textChannel),
          })}`
        )
        .setColor(client.color_main);
      return handler.editReply({ embeds: [embed] });
    } else if (value === "delete") {
      const SetupChannel = await client.db.setup.get(`${handler.guild!.id}`);

      const embed_none = new EmbedBuilder()
        .setDescription(`${client.i18n.get(handler.language, "commands.settings", "setup_null")}`)
        .setColor(client.color_main);

      if (SetupChannel == null) return handler.editReply({ embeds: [embed_none] });
      if (SetupChannel.enable == false) return handler.editReply({ embeds: [embed_none] });

      const fetchedTextChannel = SetupChannel.channel
        ? await handler.guild!.channels.fetch(SetupChannel.channel).catch(() => {})
        : undefined;
      const fetchedVoiceChannel = SetupChannel.voice
        ? await handler.guild!.channels.fetch(SetupChannel.voice).catch(() => {})
        : undefined;
      const fetchedCategory = SetupChannel.category
        ? await handler.guild!.channels.fetch(SetupChannel.category).catch(() => {})
        : undefined;

      const embed = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(handler.language, "commands.settings", "setup_deleted", {
            channel: String(fetchedTextChannel),
          })}`
        )
        .setColor(client.color_main);

      if (fetchedCategory) await fetchedCategory.delete().catch(() => null);
      if (fetchedVoiceChannel) await fetchedVoiceChannel.delete().catch(() => null);
      if (fetchedTextChannel) await fetchedTextChannel.delete().catch(() => null);

      await client.db.setup.delete(`${handler.guild!.id}`);

      if (!fetchedCategory || !fetchedTextChannel || !fetchedVoiceChannel) {
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${client.i18n.get(handler.language, "commands.settings", "setup_null")}`
              )
              .setColor(client.color_main),
          ],
        });
      }

      return handler.editReply({ embeds: [embed] });
    }
  }
}
