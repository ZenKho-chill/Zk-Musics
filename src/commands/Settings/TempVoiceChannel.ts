import { Manager } from "../../manager.js";
import { Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import {
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
  ChannelType,
  MessageFlags,
} from "discord.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = ConfigData.getInstance().data;

export default class implements Command {
  public name = ["tempvoice"];
  public description = "Thiết lập kênh thoại tạm trong máy chủ của bạn";
  public category = "Settings";
  public accessableby = data.COMMANDS_ACCESS.SETTINGS.TempVoiceChannel;
  public usage = "<create> hoặc <delete>";
  public aliases = ["tvn"];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "status",
      description: "Tạo hoặc xóa kênh thoại tạm",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: "Tạo", value: "create" },
        { name: "Xóa", value: "delete" },
      ],
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    if (!handler.interaction) return;
    const interaction = handler.interaction as ChatInputCommandInteraction;
    const guildId = interaction.guildId!;

    const status = interaction.options.get("status", true).value as string;
    const guildSettings = (await client.db.TempVoiceChannelSetting.get(guildId)) || {
      guildId,
      tempVoiceEnabled: false,
      createVoiceChannelId: null,
    };

    if (status === "create") {
      guildSettings.tempVoiceEnabled = true;
      const existingChannel = interaction.guild?.channels.cache.find(
        (channel) => channel.name === "Tạo kênh thoại" && channel.type === ChannelType.GuildVoice
      );

      if (!existingChannel) {
        const createVoiceChannel = await interaction.guild?.channels.create({
          name: "Tạo kênh thoại",
          type: ChannelType.GuildVoice,
          permissionOverwrites: [
            {
              id: interaction.guild.roles.everyone.id,
              allow: ["Connect"],
              deny: ["Speak"],
            },
          ],
        });

        guildSettings.createVoiceChannelId = createVoiceChannel?.id;
      }
    } else if (status === "delete") {
      guildSettings.tempVoiceEnabled = false;

      // Xóa "Tạo kênh thoại" nếu nó tồn tại
      if (guildSettings.createVoiceChannelId) {
        const channel = interaction.guild?.channels.cache.get(guildSettings.createVoiceChannelId);
        if (channel) {
          await channel.delete(
            `${client.i18n.get(handler.language, "commands.settings", "tempvoice_disabled")}`
          );
        }
      }
      await client.db.TempVoiceChannelSetting.delete(guildId);
    }
    if (status === "create") {
      await client.db.TempVoiceChannelSetting.set(guildId, guildSettings);
    }

    await interaction.reply({
      content: `${client.i18n.get(handler.language, "commands.settings", "tempvoice_setup", {
        status: status === "create" ? "kích hoạt" : "vô hiệu",
      })}`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
