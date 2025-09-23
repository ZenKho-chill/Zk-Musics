import { ApplicationCommandOptionType, EmbedBuilder, WebhookClient } from "discord.js";
import { Manager } from "../../manager.js";
import { Accessableby, Command } from "../../structures/Command.js";
import { CommandHandler } from "../../structures/CommandHandler.js";
import { Config } from "../../@types/Config.js";
import { ConfigData } from "../../services/ConfigData.js";
const data: Config = new ConfigData().data;

export default class implements Command {
  public name = ["premium", "remove"];
  public description = "Gỡ Premium khỏi máy chủ hoặc người dùng";
  public category = "Admin";
  public accessableby = data.COMMANDS_ACCESS.ADMIN.PremiumRemove;
  public usage = "<user/guild> <id>";
  public aliases = ["pr"];
  public lavalink = false;
  public playerCheck = false;
  public usingInteraction = true;
  public sameVoiceCheck = false;
  public permissions = [];
  public options = [
    {
      name: "type",
      description: "Loại (guild hoặc user) bạn muốn gỡ Premium",
      required: true,
      type: ApplicationCommandOptionType.String,
      choices: [
        { name: "Người dùng", value: "user" },
        { name: "Máy chủ", value: "guild" },
      ],
    },
    {
      name: "id",
      description: "ID của máy chủ hoặc người dùng bạn muốn gỡ Premium",
      required: true,
      type: ApplicationCommandOptionType.String,
    },
  ];

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply();

    const type = handler.args[0];
    const id = handler.args[1];

    if (!type || !id)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(
                handler.language,
                "client.commands",
                "admin.premium_remove_invalid_params",
                {
                  example: `\`${client.prefix}pr user/guild <user_id/guild_id>\``,
                }
              )}`
            )
            .setColor(client.color_main),
        ],
      });

    let db;
    if (type === "guild") {
      db = await client.db.preGuild.get(`${id}`);
    } else if (type === "user") {
      db = await client.db.premium.get(`${id}`);
    } else {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(
                handler.language,
                "client.commands",
                "admin.premium_remove_invalid_type",
                {
                  type: "**Guild** or **user**",
                }
              )}`
            )
            .setColor(client.color_main),
        ],
      });
    }

    if (!db)
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${client.i18n.get(handler.language, "client.commands", "admin.premium_remove_404", {
                id: id as string,
                type: `${(type as string).toUpperCase()}`,
              })}`
            )
            .setColor(client.color_main),
        ],
      });

    if (db.isPremium) {
      if (type === "guild") {
        await client.db.preGuild.delete(`${id}`);
      } else if (type === "user") {
        await client.db.premium.delete(`${id}`);
      }

      let userDescription;
      if ("username" in db.redeemedBy) {
        userDescription = db.redeemedBy.username;
      } else {
        userDescription = db.redeemedBy.name;
      }

      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${client.user!.username} Gỡ Premium`,
          iconURL: client.user!.displayAvatarURL(),
          url: `https://discord.com/oauth2/authorize?client_id=${
            client.user!.id
          }&permissions=8&scope=bot`,
        })
        .addFields([
          {
            name: `${type === "guild" ? "Máy chủ" : "Người dùng"}`,
            value: `\`${userDescription}\``,
            inline: false,
          },
          {
            name: `${client.i18n.get(handler.language, "client.commands", "admin.premium_remove_id")}`,
            value: `\`${db.redeemedBy.id}\``,
            inline: false,
          },
          {
            name: `${client.i18n.get(handler.language, "client.commands", "admin.premium_remove_by")}`,
            value: `\`${handler.user?.displayName}\``,
            inline: false,
          },
        ])
        .setFooter({
          text: `${client.i18n.get(handler.language, "client.commands", "admin.premium_remove_footer", {
            user: userDescription,
          })}`,
        })
        .setColor(client.color_main);
      handler.editReply({ embeds: [embed] });
      await this.sendRemoveLog(client, handler, type, userDescription, db.redeemedBy.id);
    } else {
      let userDescription;
      if ("username" in db.redeemedBy) {
        userDescription = db.redeemedBy.username;
      } else {
        userDescription = db.redeemedBy.name;
      }

      const embed = new EmbedBuilder()
        .setDescription(
          `${client.i18n.get(handler.language, "client.commands", "admin.premium_remove_already", {
            user: userDescription,
          })}`
        )
        .setColor(client.color_main);

      handler.editReply({ embeds: [embed] });
    }
  }

  protected async sendRemoveLog(
    client: Manager,
    handler: CommandHandler,
    type: string,
    userDescription: string,
    id: string
  ): Promise<void> {
    if (!client.config.logchannel.RemoveChannelID) return;
    const language = client.config.bot.LANGUAGE;

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${client.user!.username} Nhật ký gỡ Premium!`,
        iconURL: client.user!.displayAvatarURL(),
        url: `https://discord.com/oauth2/authorize?client_id=${
          client.user!.id
        }&permissions=8&scope=bot`,
      })
      .addFields([
        {
          name: `${type === "guild" ? "Máy chủ" : "Người dùng"}`,
          value: `\`${userDescription}\``,
          inline: false,
        },
        {
          name: `${client.i18n.get(language, "client.commands", "admin.premium_remove_id")}`,
          value: `\`${id}\``,
          inline: false,
        },
        {
          name: `${client.i18n.get(language, "client.commands", "admin.premium_remove_by")}`,
          value: `\`${handler.user?.displayName}\``,
          inline: false,
        },
      ])
      .setColor(client.color_main)
      .setTimestamp();

    try {
      const channel = await client.channels
        .fetch(client.config.logchannel.RemoveChannelID)
        .catch(() => undefined);
      if (!channel || !channel.isTextBased()) return;
      await (channel as any).send({ embeds: [embed] });
    } catch {}
    return;
  }
}
