import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ComponentType,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  MessageFlags,
} from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { RadioStationNewInterface, RadioStationArray } from "../../utilities/RadioStations.js";
import { ConvertTime } from "../../utilities/ConvertTime.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

// Mã chính
export default class implements Command {
  public name = ["radio"];
  public description = "Phát đài radio từ danh sách có sẵn";
  public category = "Âm nhạc";
  public accessableby = data.COMMANDS_ACCESS.MUSIC.Radio;
  public usage = "<số_radio>";
  public aliases = [];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "number",
      description: "Số của radio để chọn đài phát",
      type: ApplicationCommandOptionType.Number,
      required: false,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    let player = client.Zklink.players.get(handler.guild!.id);
    const radioList = RadioStationNewInterface();
    const radioArrayList = RadioStationArray();
    const radioListKeys = Object.keys(radioList);

    await handler.deferReply();

    const getNum = handler.args[0] ? Number(handler.args[0]) : undefined;
    if (!getNum) return this.sendHelp(client, handler, radioList, radioListKeys);

    const radioData = radioArrayList[getNum - 1];
    if (!radioData) return this.sendHelp(client, handler, radioList, radioListKeys);

    const { channel } = handler.member!.voice;
    if (!channel)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "client.commands.music", "radio_no_voice")}`
            )
            .setColor(client.color_main),
        ],
      });

    if (!player)
      player = await client.Zklink.create({
        guildId: handler.guild!.id,
        voiceId: handler.member!.voice.channel!.id,
        textId: handler.channel!.id,
        shardId: handler.guild?.shardId ?? 0,
        deaf: true,
        mute: false,
        region: handler.member!.voice.channel!.rtcRegion ?? undefined,
        volume: client.config.bot.DEFAULT_VOLUME,
      });
    else if (player && !this.checkSameVoice(client, handler, handler.language)) {
      return;
    }

    player.textId = handler.channel!.id;

    const result = await player.search(radioData.link, {
      requester: handler.user,
    });

    if (!result.tracks.length)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "client.commands.music", "radio_match", {
                serversupport: String(client.config.bot.SERVER_SUPPORT_URL),
              })}`
            )
            .setColor(client.color_main),
        ],
      });
    if (result.type === "PLAYLIST") for (let track of result.tracks) player.queue.add(track);
    else if (player.playing && result.type === "SEARCH") player.queue.add(result.tracks[0]);
    else if (player.playing && result.type !== "SEARCH")
      for (let track of result.tracks) player.queue.add(track);
    else player.queue.add(result.tracks[0]);

    if (handler.message) await handler.message.delete().catch(() => null);

    if (!player.playing) player.play();
    const embed = new EmbedBuilder().setColor(client.color_main).setDescription(
      `${client.i18n.get(handler.language, "client.commands.music", "radio_play_track", {
        title: radioData.name || handler.guild!.name,
        duration: new ConvertTime().parse(result.tracks[0].duration as number),
        request: String(result.tracks[0].requester),
        user: String(handler.user!.displayName || handler.user!.tag),
        url: String(result.tracks[0].uri),
        serversupport: String(client.config.bot.SERVER_SUPPORT_URL),
      })}`
    );

    handler.editReply({ content: " ", embeds: [embed] });
  }

  protected async sendHelp(
    client: Manager,
    handler: CommandHandler,
    radioList: Record<string, { no: number; name: string; link: string }[]>,
    radioListKeys: string[]
  ) {
    const pages: EmbedBuilder[] = [];
    for (let i = 0; i < radioListKeys.length; i++) {
      const radioListKey = radioListKeys[i];
      const stringArray = radioList[radioListKey];
      const converted = this.stringConverter(stringArray);

      const embed = new EmbedBuilder()
        .setAuthor({
          name: `Các đài phát từ ${radioListKey}`,
          iconURL: handler.user?.displayAvatarURL(),
        })
        .setColor(client.color_main)
        .addFields(converted);

      pages.push(embed);
    }

    const providerSelector = (disable: boolean) =>
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("provider")
          .setPlaceholder(client.i18n.get(handler.language, "client.commands.music", "radio_placeholder"))
          .addOptions(this.getOptionBuilder(radioListKeys))
          .setDisabled(disable)
      );

    const msg = await handler.editReply({
      embeds: [pages[0]],
      components: [providerSelector(false)],
    });

    if (!msg) return;

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 60000,
    });

    collector.on("collect", async (message): Promise<void> => {
      const providerId = Number(message.values[0]);
      const providerName = radioListKeys[providerId];
      const getEmbed = pages[providerId];
      await msg.edit({ embeds: [getEmbed] });

      const msgReply = await message
        .reply({
          content: `${client.i18n.get(
            handler.language,
            "client.commands.music",
            "content_switched_radio",
            {
              providerRadio: providerName,
            }
          )}`,
          embeds: [],
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => {});
      if (msgReply)
        setTimeout(
          () => msgReply.delete().catch(() => {}),
          client.config.features.DELETE_MSG_TIMEOUT
        );
    });

    collector.on("end", async () => {
      // @ts-ignore
      collector.removeAllListeners();
      await msg.edit({
        components: [providerSelector(true)],
      });
    });
  }

  protected getOptionBuilder(radioListKeys: string[]) {
    const data: Config = new ConfigData().data;
    const result: StringSelectMenuOptionBuilder[] = [];
    for (let i = 0; i < radioListKeys.length; i++) {
      const key = radioListKeys[i];
      result.push(new StringSelectMenuOptionBuilder().setLabel(key).setValue(String(i)));
    }
    return result;
  }

  protected stringConverter(array: { no: number; name: string; link: string }[]) {
    const radioStrings: { name: string; value: string; inline: boolean }[] = [];
    for (let i = 0; i < array.length; i++) {
      const radio = array[i];
      radioStrings.push({
        name: `\`${String(radio.no)}.\` ${radio.name}`,
        value: " ",
        inline: true,
      });
    }
    return radioStrings;
  }

  checkSameVoice(client: Manager, handler: CommandHandler, language: string) {
    if (handler.member!.voice.channel !== handler.guild!.members.me!.voice.channel) {
      handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "client.commands.music", "radio_no_same_voice")}`
            )
            .setColor(client.color_main),
        ],
      });
      return false;
    }

    return true;
  }
}
