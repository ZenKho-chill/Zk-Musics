import {
  ButtonInteraction,
  EmbedBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ButtonBuilder,
  MessageFlags,
} from "discord.js";
import { Manager } from "../../../manager.js";
import { Mode247Builder } from "../../../services/Mode247Builder.js";
import { ZklinkLoopMode, ZklinkPlayer } from "../../../Zklink/main.js";
import { TopggServiceEnum } from "../../../services/TopggService.js";
import axios from "axios";
export class ButtonLoop {
  client: Manager;
  interaction: ButtonInteraction;
  language: string;
  player: ZklinkPlayer;
  accessableby: string;
  constructor(
    client: Manager,
    interaction: ButtonInteraction,
    language: string,
    player: ZklinkPlayer
  ) {
    this.client = client;
    this.language = language;
    this.player = player;
    this.interaction = interaction;
    this.accessableby = this.client.config.SETUP_BUTTON.loop;
    this.execute();
  }

  async execute() {
    const response = await axios.get(
      `https://discord.com/api/v10/applications/${this.client.user.id}/entitlements`,
      {
        headers: {
          Authorization: `Bot ${this.client.config.bot.TOKEN}`,
        },
      }
    );
    let PremiumStore = false;
    response.data.forEach((data) => {
      if (data.guild_id === this.interaction.guild.id) {
        PremiumStore = true;
      }
    });
    /////////////////////////////// Kiểm tra vai trò Premium (bắt đầu) ////////////////////////////////
    const PremiumGuildID = this.client.config.PremiumRole.GuildID;
    const PremiumRoleID = this.client.config.PremiumRole.RoleID;
    const supportGuild = await this.client.guilds
      .fetch(PremiumGuildID)
      .catch(() => null);
    const supportMember = supportGuild
      ? await supportGuild.members
          .fetch(String(this.interaction.user?.id))
          .catch(() => null)
      : null;
    const isPremiumRole = supportMember
      ? supportMember.roles.cache.has(PremiumRoleID)
      : false;
    /////////////////////////////// Kiểm tra vai trò Premium (kết thúc) ////////////////////////////////
    const User = await this.client.db.premium.get(this.interaction.user.id);
    const Guild = await this.client.db.preGuild.get(
      String(this.interaction.guild?.id)
    );
    const isPremiumUser = User && User.isPremium;
    const isPremiumGuild = Guild && Guild.isPremium;
    const isOwner = this.interaction.user.id == this.client.owner;
    const isAdmin = this.client.config.bot.ADMIN.includes(
      this.interaction.user.id
    );
    const userPerm = {
      owner: isOwner,
      admin: isOwner || isAdmin,
      PremiumStore: PremiumStore,
      PremiumRole: isOwner || isAdmin || isPremiumRole,
      UserPremium: isOwner || isAdmin || isPremiumUser,
      GuildPremium: isOwner || isAdmin || isPremiumGuild,
      Premium:
        isOwner ||
        isAdmin ||
        isPremiumUser ||
        isPremiumGuild ||
        isPremiumRole ||
        PremiumStore,
    };

    if (
      this.accessableby === "Voter" &&
      this.client.topgg &&
      !userPerm.owner &&
      !userPerm.admin &&
      !userPerm.UserPremium &&
      !userPerm.GuildPremium &&
      !userPerm.PremiumRole &&
      !userPerm.Premium &&
      !userPerm.PremiumStore
    ) {
      const voteChecker = await this.client.topgg.checkVote(
        this.interaction.user!.id
      );
      if (voteChecker == TopggServiceEnum.ERROR) {
        const embed = new EmbedBuilder()
          .setAuthor({
            name: this.client.i18n.get(
              this.language,
              "interaction",
              "topgg_error_author"
            ),
          })
          .setDescription(
            this.client.i18n.get(
              this.language,
              "interaction",
              "topgg_error_desc",
              {
                serversupport: this.client.config.bot.SERVER_SUPPORT_URL,
                premium: this.client.config.bot.PREMIUM_URL,
              }
            )
          )
          .setColor(this.client.color_main);
        return await this.interaction.reply({
          content: " ",
          embeds: [embed],
          flags: MessageFlags.Ephemeral,
        });
      }

      if (voteChecker == TopggServiceEnum.UNVOTED) {
        const embed = new EmbedBuilder()
          .setAuthor({
            name: this.client.i18n.get(
              this.language,
              "interaction",
              "topgg_unvote_author"
            ),
          })
          .setDescription(
            this.client.i18n.get(
              this.language,
              "interaction",
              "topgg_unvote_desc",
              {
                user: `<@${this.interaction.user!.id}>`,
                serversupport: this.client.config.bot.SERVER_SUPPORT_URL,
                premium: this.client.config.bot.PREMIUM_URL,
              }
            )
          )
          .setColor(this.client.color_main);
        const VoteButton = new ActionRowBuilder<ButtonBuilder>();
        if (this.client.config.MENU_HELP_EMOJI.E_VOTE) {
          VoteButton.addComponents(
            new ButtonBuilder()
              .setLabel(
                this.client.i18n.get(
                  this.language,
                  "interaction",
                  "topgg_unvote_button"
                )
              )
              .setStyle(ButtonStyle.Link)
              .setEmoji(this.client.config.MENU_HELP_EMOJI.E_VOTE)
              .setURL(`https://top.gg/bot/${this.client.user?.id}/vote`)
          );
        }
        if (
          this.client.config.MENU_HELP_EMOJI.E_PREMIUM &&
          this.client.config.bot.PREMIUM_URL
        ) {
          VoteButton.addComponents(
            new ButtonBuilder()
              .setLabel(
                this.client.i18n.get(
                  this.language,
                  "interaction",
                  "premium_button"
                )
              )
              .setStyle(ButtonStyle.Link)
              .setEmoji(this.client.config.MENU_HELP_EMOJI.E_PREMIUM)
              .setURL(this.client.config.bot.PREMIUM_URL)
          );
        }
        return await this.interaction.reply({
          content: " ",
          embeds: [embed],
          components: VoteButton.components.length ? [VoteButton] : [],
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    if (this.accessableby === "PremiumRole" && !userPerm.PremiumRole) {
      const embed = new EmbedBuilder()
        .setAuthor({
          name: this.client.i18n.get(
            this.language,
            "interaction",
            "no_premium_role_author"
          ),
        })
        .setDescription(
          `${this.client.i18n.get(
            this.language,
            "interaction",
            "no_premium_role_desc",
            {
              user: `<@${this.interaction.user!.id}>`,
              serversupport: this.client.config.bot.SERVER_SUPPORT_URL,
              premium: this.client.config.bot.PREMIUM_URL,
            }
          )}`
        )
        .setColor(this.client.color_main);
      const PremiumCheckButton = new ActionRowBuilder<ButtonBuilder>();
      if (
        this.client.config.MENU_HELP_EMOJI.E_PREMIUM &&
        this.client.config.bot.PREMIUM_URL
      ) {
        PremiumCheckButton.addComponents(
          new ButtonBuilder()
            .setLabel(
              this.client.i18n.get(
                this.language,
                "interaction",
                "no_premium_role_button"
              )
            )
            .setStyle(ButtonStyle.Link)
            .setEmoji(this.client.config.MENU_HELP_EMOJI.E_PREMIUM)
            .setURL(this.client.config.bot.PREMIUM_URL)
        );
      }
      return await this.interaction.reply({
        content: " ",
        embeds: [embed],
        components: PremiumCheckButton.components.length
          ? [PremiumCheckButton]
          : [],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (this.accessableby === "Premium" && !userPerm.Premium) {
      const embed = new EmbedBuilder()
        .setAuthor({
          name: this.client.i18n.get(
            this.language,
            "interaction",
            "no_premium_author"
          ),
        })
        .setDescription(
          `${this.client.i18n.get(
            this.language,
            "interaction",
            "no_premium_desc",
            {
              user: `<@${this.interaction.user!.id}>`,
              serversupport: this.client.config.bot.SERVER_SUPPORT_URL,
              premium: this.client.config.bot.PREMIUM_URL,
            }
          )}`
        )
        .setColor(this.client.color_main);
      const PremiumCheckButton = new ActionRowBuilder<ButtonBuilder>();
      if (
        this.client.config.MENU_HELP_EMOJI.E_PREMIUM &&
        this.client.config.bot.PREMIUM_URL
      ) {
        PremiumCheckButton.addComponents(
          new ButtonBuilder()
            .setLabel(
              this.client.i18n.get(
                this.language,
                "interaction",
                "no_premium_button"
              )
            )
            .setStyle(ButtonStyle.Link)
            .setEmoji(this.client.config.MENU_HELP_EMOJI.E_PREMIUM)
            .setURL(this.client.config.bot.PREMIUM_URL)
        );
      }

      return await this.interaction.reply({
        content: " ",
        embeds: [embed],
        components: PremiumCheckButton.components.length
          ? [PremiumCheckButton]
          : [],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (this.accessableby === "UserPremium" && !userPerm.UserPremium) {
      const embed = new EmbedBuilder()
        .setAuthor({
          name: this.client.i18n.get(
            this.language,
            "interaction",
            "no_user_premium_plan_author"
          ),
        })
        .setDescription(
          `${this.client.i18n.get(
            this.language,
            "interaction",
            "no_user_premium_plan_desc",
            {
              user: `<@${this.interaction.user!.id}>`,
              serversupport: this.client.config.bot.SERVER_SUPPORT_URL,
              premium: this.client.config.bot.PREMIUM_URL,
            }
          )}`
        )
        .setColor(this.client.color_main);
      const PremiumCheckButton = new ActionRowBuilder<ButtonBuilder>();
      if (
        this.client.config.MENU_HELP_EMOJI.E_PREMIUM &&
        this.client.config.bot.PREMIUM_URL
      ) {
        PremiumCheckButton.addComponents(
          new ButtonBuilder()
            .setLabel(
              this.client.i18n.get(
                this.language,
                "interaction",
                "no_user_premium_button"
              )
            )
            .setStyle(ButtonStyle.Link)
            .setEmoji(this.client.config.MENU_HELP_EMOJI.E_PREMIUM)
            .setURL(this.client.config.bot.PREMIUM_URL)
        );
      }

      return await this.interaction.reply({
        content: " ",
        embeds: [embed],
        components: PremiumCheckButton.components.length
          ? [PremiumCheckButton]
          : [],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (this.accessableby === "GuildPremium" && !userPerm.GuildPremium) {
      const embed = new EmbedBuilder()
        .setAuthor({
          name: this.client.i18n.get(
            this.language,
            "interaction",
            "no_guild_premium_plan_author"
          ),
        })
        .setDescription(
          `${this.client.i18n.get(
            this.language,
            "interaction",
            "no_guild_premium_plan_desc",
            {
              user: `<@${this.interaction.user!.id}>`,
              serversupport: this.client.config.bot.SERVER_SUPPORT_URL,
              premium: this.client.config.bot.PREMIUM_URL,
            }
          )}`
        )
        .setColor(this.client.color_main);
      const PremiumCheckButton = new ActionRowBuilder<ButtonBuilder>();
      if (
        this.client.config.MENU_HELP_EMOJI.E_PREMIUM &&
        this.client.config.bot.PREMIUM_URL
      ) {
        PremiumCheckButton.addComponents(
          new ButtonBuilder()
            .setLabel(
              this.client.i18n.get(
                this.language,
                "interaction",
                "no_guild_premium_button"
              )
            )
            .setStyle(ButtonStyle.Link)
            .setEmoji(this.client.config.MENU_HELP_EMOJI.E_PREMIUM)
            .setURL(this.client.config.bot.PREMIUM_URL)
        );
      }

      return await this.interaction.reply({
        content: " ",
        embeds: [embed],
        components: PremiumCheckButton.components.length
          ? [PremiumCheckButton]
          : [],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (this.accessableby === "PremiumStore" && !userPerm.PremiumStore) {
      const embed = new EmbedBuilder()
        .setAuthor({
          name: this.client.i18n.get(
            this.language,
            "interaction",
            "no_premium_author"
          ),
        })
        .setDescription(
          `${this.client.i18n.get(
            this.language,
            "interaction",
            "no_premium_desc",
            {
              user: `<@${this.interaction.user!.id}>`,
              serversupport: this.client.config.bot.SERVER_SUPPORT_URL,
              premium: this.client.config.bot.PREMIUM_URL,
            }
          )}`
        )
        .setColor(this.client.color_main);
      const PremiumCheckButton = new ActionRowBuilder<ButtonBuilder>();
      if (
        this.client.config.MENU_HELP_EMOJI.E_PREMIUM &&
        this.client.config.bot.PREMIUM_URL
      ) {
        PremiumCheckButton.addComponents(
          new ButtonBuilder()
            .setLabel(
              this.client.i18n.get(
                this.language,
                "interaction",
                "no_premium_button"
              )
            )
            .setStyle(ButtonStyle.Link)
            .setEmoji(this.client.config.MENU_HELP_EMOJI.E_PREMIUM)
            .setURL(this.client.config.bot.PREMIUM_URL)
        );
      }

      return await this.interaction.reply({
        content: " ",
        embeds: [embed],
        components: PremiumCheckButton.components.length
          ? [PremiumCheckButton]
          : [],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!this.player) {
      return;
    }

    switch (this.player.loop) {
      case "none":
        await this.player.setLoop(ZklinkLoopMode.SONG);

        if (this.client.config.features.AUTO_RESUME)
          this.setLoop247(String(ZklinkLoopMode.SONG));

        const looptrack = new EmbedBuilder()
          .setDescription(
            `${this.client.i18n.get(
              this.language,
              "button.setup.music",
              "loop_current"
            )}`
          )
          .setColor(this.client.color_main);
        await this.interaction.reply({
          content: " ",
          embeds: [looptrack],
          flags: MessageFlags.Ephemeral,
        });

        this.client.wsl.get(this.interaction.guild!.id)?.send({
          op: "playerLoop",
          guild: this.interaction.guild!.id,
          mode: "song",
        });
        break;

      case "song":
        await this.player.setLoop(ZklinkLoopMode.QUEUE);

        if (this.client.config.features.AUTO_RESUME)
          this.setLoop247(String(ZklinkLoopMode.QUEUE));

        const loopall = new EmbedBuilder()
          .setDescription(
            `${this.client.i18n.get(
              this.language,
              "button.setup.music",
              "loop_all"
            )}`
          )
          .setColor(this.client.color_main);
        await this.interaction.reply({
          content: " ",
          embeds: [loopall],
          flags: MessageFlags.Ephemeral,
        });

        this.client.wsl.get(this.interaction.guild!.id)?.send({
          op: "playerLoop",
          guild: this.interaction.guild!.id,
          mode: "queue",
        });
        break;

      case "queue":
        await this.player.setLoop(ZklinkLoopMode.NONE);

        if (this.client.config.features.AUTO_RESUME)
          this.setLoop247(String(ZklinkLoopMode.NONE));

        const unloopall = new EmbedBuilder()
          .setDescription(
            `${this.client.i18n.get(
              this.language,
              "button.setup.music",
              "unloop_all"
            )}`
          )
          .setColor(this.client.color_main);
        await this.interaction.reply({
          content: " ",
          embeds: [unloopall],
          flags: MessageFlags.Ephemeral,
        });

        this.client.wsl.get(this.interaction.guild!.id)?.send({
          op: "playerLoop",
          guild: this.interaction.guild!.id,
          mode: "none",
        });
        break;
    }
  }

  async setLoop247(loop: string) {
    const check = await new Mode247Builder(this.client, this.player).execute(
      this.player.guildId
    );
    if (check) {
      await this.client.db.autoreconnect.set(
        `${this.player.guildId}.config.loop`,
        loop
      );
    }
  }
}
