import express from "express";
import expressWs from "express-ws";
import { Manager } from "../manager.js";
import { Webhook } from "@top-gg/sdk";
import path from "path";
import { fileURLToPath } from "url";
import md5 from "md5";
import axios from "axios";
import cron from "node-cron";
import {
  ButtonBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonStyle,
  TextChannel,
  Interaction,
  MessageFlags,
} from "discord.js";
import { EmojiValidator } from "../utilities/EmojiValidator.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class WebServer {
  client: Manager;
  app: expressWs.Application;
  port: number;
  channelID: string;

  constructor(client: Manager) {
    this.client = client;
    this.app = expressWs(express()).app;
    this.port = this.client.config.features.WebServer.Port;
    this.startCronJobs();
    this.alive();
    this.setupVoteWebhook();
    if (this.client.config.features.WebServer.LAST_FM_SCROBBLED.Enable) {
      this.setupLastfmCallback();
    }

    this.expose();
    this.handleInteractions();
  }

  alive() {
    this.app.get("/", (req, res) => {
      res.send("Server còn sống nè! Bot Discord đang chạy.");
    });
  }

  setupLastfmCallback() {
    this.app.get("/lastfm", async (req, res) => {
      const token = req.query.token as string;
      const userId = req.query.user as string;

      if (!token || !userId) {
        return res.status(400).send("Yêu cầu không hợp lệ.");
      }

      try {
        const response = await axios.get("http://ws.audioscrobbler.com/2.0/", {
          params: {
            method: "auth.getSession",
            api_key: this.client.config.features.WebServer.LAST_FM_SCROBBLED.ApiKey,
            token: token,
            api_sig: this.generateApiSignature({
              api_key: this.client.config.features.WebServer.LAST_FM_SCROBBLED.ApiKey,
              method: "auth.getSession",
              token: token,
            }),
            format: "json",
          },
        });

        const sessionKey = response.data.session.key;
        const lastfmUsername = response.data.session.name;

        const new_data = {
          userId: userId,
          sessionKey: sessionKey,
          lastfmUsername: lastfmUsername,
          token: token,
        };

        await this.client.db.LastFm.set(`${userId}`, new_data);
        const redirectUrl = `${
          this.client.config.features.WebServer.LAST_FM_SCROBBLED.RedirectOnSuccess
        }?user=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`;
        res.redirect(redirectUrl);
      } catch (error) {
        this.client.logger.error(WebServer.name, error);
        const redirectUrl = `${
          this.client.config.features.WebServer.LAST_FM_SCROBBLED.RedirectOnError
        }?user=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`;
        res.redirect(redirectUrl);
      }
    });
  }

  generateApiSignature(params: { [key: string]: string }) {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}${params[key]}`)
      .join("");

    const stringToHash =
      sortedParams + this.client.config.features.WebServer.LAST_FM_SCROBBLED.Secret;
    return md5(stringToHash);
  }

  setupVoteWebhook() {
    const client = this.client;
    const webhook = new Webhook(client.config.features.WebServer.TOPGG_VOTELOGS.TopGgAuth);

    this.app.post(
      "/vote",
      webhook.listener(async (vote) => {
        const language = client.config.bot.LANGUAGE || "en";
        const voteUser = await client.users.fetch(vote.user);

        const userVotes = await client.db.votes.get(vote.user);
        const currentTime = Date.now();

        if (!userVotes) {
          await client.db.votes.set(vote.user, {
            user: vote.user,
            username: voteUser.username,
            count: "1",
            lastVoteTime: currentTime,
          });
        } else {
          const newCount = (parseInt(userVotes.count) + 1).toString();
          await client.db.votes.set(vote.user, {
            user: vote.user,
            username: voteUser.username,
            count: newCount,
            lastVoteTime: currentTime,
          });
        }

        const voteCount = (await client.db.votes.get(vote.user))?.count || "1";

        const channelId = client.config.features.WebServer.TOPGG_VOTELOGS.LogVoteChannelID;
        if (!channelId || channelId.length == 0) return;

        try {
          const channel = (await client.channels
            .fetch(channelId)
            .catch(() => undefined)) as TextChannel;
          if (!channel || !channel.isTextBased()) return;

          const embed = new EmbedBuilder()
            .setAuthor({
              name: `${voteUser.displayName || voteUser.tag}`,
              iconURL: voteUser.displayAvatarURL(),
            })
            .setColor(client.color_main)
            .setDescription(
              `${client.i18n.get(language, "events.helper", "vote_desc", {
                voteuser: `<@${vote.user}>` || voteUser.displayName,
                bot: `<@${vote.bot}>`,
                votebot: client.user!.username,
                voteurl: client.config.bot.VOTE_URL,
              })}`
            )
            .setThumbnail(voteUser.displayAvatarURL({ size: 1024 }))
            .setFooter({
              text: client.i18n.get(language, "events.helper", "vote_footer", {
                count: voteCount,
              }),
            });

          const ButtonVote = new ActionRowBuilder<ButtonBuilder>();
          ButtonVote.addComponents(
            new ButtonBuilder()
              .setCustomId("reminder_vote")
              .setStyle(ButtonStyle.Secondary)
              .setLabel(client.i18n.get(language, "events.helper", "reminder_label_name"))
              .setEmoji(
                EmojiValidator.safeEmoji(
                  client.i18n.get(language, "events.helper", "reminder_label_emoji")
                )
              )
          );

          const sentMessage = await channel.send({
            embeds: [embed],
            components: [ButtonVote],
          });

          client.logger.info(WebServer.name, `${voteUser.tag} vừa vote trên Top.gg`);
        } catch (error) {
          this.client.logger.warn(WebServer.name, error as string);
        }
      })
    );
  }

  handleInteractions() {
    this.client.on("interactionCreate", async (interaction: Interaction): Promise<void> => {
      const language = this.client.config.bot.LANGUAGE || "en";
      if (!interaction.isButton()) return;

      if (interaction.customId === "reminder_vote") {
        const reminderUserId = interaction.user.id;
        const userVotes = await this.client.db.votes.get(reminderUserId);

        if (!userVotes) {
          await interaction.reply({
            content: `${this.client.i18n.get(
              language,
              "events.helper",
              "reminder_no_vote_warning"
            )}`,
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        const existingReminder = await this.client.db.VoteReminders.get(reminderUserId);

        if (existingReminder) {
          await this.client.db.VoteReminders.delete(reminderUserId);
          await interaction.reply({
            content: `${this.client.i18n.get(
              language,
              "events.helper",
              "reminder_cancel_content"
            )}`,
            flags: MessageFlags.Ephemeral,
          });
        } else {
          const reminderTime = userVotes.lastVoteTime + 12 * 60 * 60 * 1000;

          await this.client.db.VoteReminders.set(reminderUserId, {
            messageId: interaction.message.id,
            channelId: interaction.channelId,
            reminderTime: reminderTime,
          });

          await interaction.reply({
            content: `${this.client.i18n.get(language, "events.helper", "reminder_set_content")}`,
            flags: MessageFlags.Ephemeral,
          });
        }
      }
    });
  }

  startCronJobs() {
    cron.schedule("0 * * * *", async () => {
      await this.checkReminders();
    });
  }

  async checkReminders() {
    const language = this.client.config.bot.LANGUAGE || "en";
    const reminders = await this.client.db.VoteReminders.all();
    const now = Date.now();

    for (const reminder of reminders) {
      const userId = reminder.id;
      const nextVoteTime = reminder.value.reminderTime;

      if (nextVoteTime <= now) {
        const user = await this.client.users.fetch(userId);
        const channel = (await this.client.channels
          .fetch(reminder.value.channelId)
          .catch(() => undefined)) as TextChannel;

        if (channel) {
          const reminderMessage = await channel.messages
            .fetch(reminder.value.messageId)
            .catch(() => undefined);
          if (reminderMessage) {
            const reminderEmbed = new EmbedBuilder()
              .setTitle(this.client.i18n.get(language, "events.helper", "reminder_title"))
              .setDescription(
                this.client.i18n.get(language, "events.helper", "reminder_desc", {
                  voteurl: this.client.config.bot.VOTE_URL,
                })
              )
              .setColor(this.client.color_second);

            await reminderMessage.reply({
              content: `<@${userId}>`,
              embeds: [reminderEmbed],
            });
          }
        }

        await this.client.db.VoteReminders.delete(userId);
      }
    }
  }

  expose() {
    this.app.listen(this.port);
    this.client.logger.info(WebServer.name, `WebServer đang chạy ở cổng: ${this.port}`);
  }
}
