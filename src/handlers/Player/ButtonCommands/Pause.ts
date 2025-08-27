import {
  ButtonInteraction,
  TextChannel,
  VoiceBasedChannel,
  EmbedBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ButtonBuilder,
  MessageFlags,
} from "discord.js";
import { Manager } from "../../../manager.js";
import { ZklinkPlayer } from "../../../zklink/main.js";
import { TopggServiceEnum } from "../../../services/TopggService.js";
import axios from "axios";
export class ButtonPause {
  client: Manager;
  interaction: ButtonInteraction;
  channel: VoiceBasedChannel | null;
  language: string;
  player: ZklinkPlayer;
  accessableby: string;
  constructor(
    client: Manager,
    interaction: ButtonInteraction,
    channel: VoiceBasedChannel | null,
    language: string,
    player: ZklinkPlayer
  ) {
    this.channel = channel;
    this.client = client;
    this.language = language;
    this.player = player;
    this.interaction = interaction;
    this.accessableby = client.config.SETUP_BUTTON.pause;
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

    let data = await this.client.db.setup.get(`${this.player.guildId}`);
    if (!data) return;
    if (data.enable === false) return;

    if (!this.channel) {
      this.interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${this.client.i18n.get(
                this.language,
                "button.setup.music",
                "no_in_voice"
              )}`
            )
            .setColor(this.client.color_main),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    } else if (
      this.interaction.guild!.members.me!.voice.channel &&
      !this.interaction.guild!.members.me!.voice.channel.equals(this.channel)
    ) {
      this.interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${this.client.i18n.get(
                this.language,
                "button.setup.music",
                "no_same_voice"
              )}`
            )
            .setColor(this.client.color_main),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    } else if (!this.player) {
      this.interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${this.client.i18n.get(
                this.language,
                "button.setup.music",
                "no_player"
              )}`
            )
            .setColor(this.client.color_main),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    } else {
      const getChannel = await this.client.channels
        .fetch(data.channel)
        .catch(() => undefined);
      if (!getChannel) return;
      let playMsg = await (getChannel as TextChannel)!.messages
        .fetch(data.playmsg)
        .catch(() => undefined);
      if (!playMsg) return;

      const newPlayer = await this.player.setPause(!this.player.paused);

      newPlayer.paused
        ? playMsg.edit({
            // content: playMsg.content,
            // embeds: new EmbedBuilder(playMsg.embeds),
            components: [this.client.enSwitch],
          })
        : playMsg.edit({
            // content: playMsg.content,
            // embeds: playMsg.embeds,
            components: [this.client.enSwitchMod],
          });

      const embed = new EmbedBuilder()
        .setDescription(
          `${this.client.i18n.get(
            this.language,
            "button.setup.music",
            newPlayer.paused ? "pause_msg" : "resume_msg"
          )}`
        )
        .setColor(this.client.color_main);

      this.interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
}
