import { Manager } from "../../manager.js";
import { Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import {
  EmbedBuilder,
  ApplicationCommandOptionType,
  CommandInteraction,
  TextChannel,
  ChannelType,
} from "discord.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

export default class implements Command {
  public name = ["modlogs", "setup"];
  public description = "Thiết lập kênh ghi nhật ký mod (mod logs)";
  public category = "Admin";
  public accessableby = data.COMMANDS_ACCESS.ADMIN.ModLogSetup;
  public usage = "<kênh văn bản>";
  public aliases = ["sml"];
  public lavalink = false;
  public usingInteraction = true;
  public playerCheck = false;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "channel",
      description: "Kênh sẽ nhận các bản ghi mod logs",
      type: ApplicationCommandOptionType.Channel,
      required: true,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    if (!handler.interaction) return;
    const interaction = handler.interaction as any;

    const channelOption = interaction.options.get("channel");
    const channel = channelOption?.channel as TextChannel;

    if (!channel || channel.type !== ChannelType.GuildText) {
      return handler.interaction?.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "commands.admin", "modlogs_invalid_channel", {
                user: handler.user!.displayName || handler.user!.tag,
                botname: client.user!.username || client.user!.displayName,
              })}`
            )
            .setColor(client.color_main),
        ],
      });
    }

    const new_data = {
      guildId: handler.guild!.id,
      guildName: handler.guild!.name,
      channelId: channel.id,
    };
    await client.db.ModLogChannel.set(`${handler.guild!.id}`, new_data);

    return handler.interaction?.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${client.i18n.get(handler.language, "commands.admin", "modlogs_setup_channel", {
              user: handler.user!.displayName || handler.user!.tag,
              botname: client.user!.username || client.user!.displayName,
              channel: `<#${channel.id}>`,
            })}`
          )
          .setColor(client.color_main),
      ],
    });
  }
}
