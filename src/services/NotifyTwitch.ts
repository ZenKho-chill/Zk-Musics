import { Manager } from "../manager.js";
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} from "discord.js";
import axios from "axios";
import cron from "node-cron";

type LiveData = {
  url: string;
  image: string;
  description: string;
  theme: string;
  displayName: string;
  profileImage: string;
};

type ErrorResponse =
  | "Error getting access token"
  | "Error checking stream status"
  | "User not found"
  | "User is offline"
  | "Invalid Webhook";

export default class NotifyTwitch {
  async execute(client: Manager) {
    cron.schedule(client.config.utilities.NotifyTwitch.Schedule, async () => {
      try {
        const setups = await client.db.NotifyTwitch.all();

        for (const setup of setups) {
          const { GuildId, GuildName, TokenAccess, ExpiresIn, Notifications } =
            setup.value;

          for (const notification of Notifications) {
            const { TwitchUsername, ChannelID, Content, LastStatus } =
              notification;
            const liveData = await this.isUserLive(
              TwitchUsername,
              client,
              TokenAccess,
              ExpiresIn
            );

            if (typeof liveData === "string") {
              await this.handleStringError(
                liveData,
                client,
                setup,
                TwitchUsername
              );
              continue;
            }

            if (LastStatus !== "online") {
              await this.sendNotification(
                client,
                ChannelID,
                Content,
                liveData,
                TwitchUsername,
                setup.id
              );
              // Cập nhật LastStatus trong mảng Notifications
              notification.LastStatus = "online";
              await client.db.NotifyTwitch.update(setup.id, {
                Notifications: Notifications,
              });
            }
          }
        }
      } catch (error) {
        client.logger.warn(
          NotifyTwitch.name,
          `Ôi không, chạy dịch vụ Twitch gặp lỗi: ${error}`
        );
      }
    });
  }

  private async getAccessToken(
    client: Manager,
    tokenAccess: string,
    expiresIn: number
  ): Promise<string | null> {
    const currentTime = Date.now();
    const tokenExpiryTime = Number(expiresIn) * 1000;

    if (currentTime < tokenExpiryTime) {
      return tokenAccess;
    }

    try {
      const response = await axios.post(
        "https://id.twitch.tv/oauth2/token",
        null,
        {
          params: {
            client_id: client.config.utilities.NotifyTwitch.ClientId,
            client_secret: client.config.utilities.NotifyTwitch.ClientSecret,
            grant_type: "client_credentials",
          },
        }
      );
      const newAccessToken = response.data.access_token;
      const newExpiresIn = response.data.expires_in;
      await this.updateTokenInDB(client, newAccessToken, newExpiresIn);
      return newAccessToken;
    } catch (error) {
      client.logger.warn(
        NotifyTwitch.name,
        `Không lấy được access token: ${error}`
      );
      return null;
    }
  }

  private async updateTokenInDB(
    client: Manager,
    newAccessToken: string,
    expiresIn: number
  ) {
    const setups = await client.db.NotifyTwitch.all();
    const currentTimeInSeconds = Math.floor(Date.now() / 1000);

    for (const setup of setups) {
      await client.db.NotifyTwitch.update(setup.id, {
        TokenAccess: newAccessToken,
        ExpiresIn: (currentTimeInSeconds + expiresIn).toString(),
      });
    }
  }

  private async isUserLive(
    username: string,
    client: Manager,
    tokenAccess: string,
    expiresIn: string
  ): Promise<LiveData | ErrorResponse> {
    const accessToken = await this.getAccessToken(
      client,
      tokenAccess,
      Number(expiresIn)
    );
    if (!accessToken) return "Error getting access token";

    try {
      const twitchAPI = axios.create({
        baseURL: "https://api.twitch.tv/helix/",
        headers: {
          "Client-ID": client.config.utilities.NotifyTwitch.ClientId,
        },
      });
      twitchAPI.defaults.headers["Authorization"] = `Bearer ${accessToken}`;
      const userResponse = await twitchAPI.get(`users?login=${username}`);

      if (userResponse.data.data.length === 0) return "User not found";

      const user = userResponse.data.data[0];
      const userId = user.id;
      const streamResponse = await twitchAPI.get(`streams?user_id=${userId}`);

      if (streamResponse.data.data.length > 0) {
        const stream = streamResponse.data.data[0];
        const sizes = [
          "1280x720",
          "1920x1080",
          "440x248",
          "640x360",
          "854x480",
        ];
        const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
        return {
          url: `https://www.twitch.tv/${username}`,
          image: stream.thumbnail_url
            .replace("{width}", randomSize.split("x")[0])
            .replace("{height}", randomSize.split("x")[1]),
          description: stream.title,
          theme: stream.game_name,
          displayName: user.display_name,
          profileImage: user.profile_image_url,
        };
      } else {
        return "User is offline";
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        client.logger.warn(
          NotifyTwitch.name,
          `Không được ủy quyền (401): ${error}`
        );
        // Ép làm mới token nếu không được ủy quyền
        await this.updateTokenInDB(client, "", 0);
        return "Error getting access token";
      }
      client.logger.warn(
        NotifyTwitch.name,
        `Lỗi khi kiểm tra stream: ${error}`
      );
      return "Error checking stream status";
    }
  }

  private async handleStringError(
    error: ErrorResponse,
    client: Manager,
    setup: any,
    TwitchUsername: string
  ) {
    if (error === "User not found") {
      await client.db.NotifyTwitch.delete(setup.id);
    } else if (error === "User is offline") {
      const notifications = setup.value.Notifications;
      for (const notification of notifications) {
        if (notification.TwitchUsername === TwitchUsername) {
          notification.LastStatus = "offline";
          break;
        }
      }
      await client.db.NotifyTwitch.update(setup.id, {
        Notifications: notifications,
      });
    } else {
      client.logger.warn(
        NotifyTwitch.name,
        `Lỗi không xác định ở NotifyTwitch: ${error}`
      );
    }
  }

  private async sendNotification(
    client: Manager,
    ChannelID: string,
    Content: string,
    liveData: LiveData,
    TwitchUsername: string,
    setupId: string
  ) {
    if (!ChannelID && !client.config.utilities.NotifyTwitch.GlobalChannelID)
      return;

    try {
      const TwitchThumbnail = liveData.image;
      const attachment = new AttachmentBuilder(TwitchThumbnail, {
        name: `zk-twitch.png`,
      });
      const embed = new EmbedBuilder()
        .setAuthor({
          name: liveData.displayName,
          iconURL: liveData.profileImage,
          url: liveData.url,
        })
        .setTitle(liveData.description || liveData.theme)
        .setURL(liveData.url)
        .setDescription(`Đang phát: ${liveData.theme}`)
        .setThumbnail(liveData.profileImage)
        .setImage(`attachment://${attachment.name}`)
        .setColor(0x6441a5)
        .setFooter({
          text: "Twitch - Đang live",
          iconURL: "https://cdn.discordapp.com/emojis/1286511374100467764.gif",
        })
        .setTimestamp();

      const ButtonLive = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel("Xem trực tiếp")
          .setStyle(ButtonStyle.Link)
          .setURL(liveData.url)
      );

      // Gửi thông báo tới kênh cá nhân
      if (ChannelID) {
        const channel = await client.channels
          .fetch(ChannelID)
          .catch(() => undefined);
        if (channel && channel.isTextBased()) {
          await channel.messages.channel.send({
            content: Content,
            embeds: [embed],
            components: [ButtonLive],
            files: [attachment],
          });
          client.logger.info(
            NotifyTwitch.name,
            `Đã gửi thông báo live của ${TwitchUsername} vào kênh cá nhân!`
          );
        }
      }

      // Gửi thông báo tới kênh toàn cục nếu được cấu hình
      if (client.config.utilities.NotifyTwitch.GlobalChannelID) {
        const globalChannel = await client.channels
          .fetch(client.config.utilities.NotifyTwitch.GlobalChannelID)
          .catch(() => undefined);
        if (globalChannel && globalChannel.isTextBased()) {
          await globalChannel.messages.channel.send({
            content: " ",
            embeds: [embed],
            components: [ButtonLive],
            files: [attachment],
          });
          client.logger.info(
            NotifyTwitch.name,
            `Đã gửi thông báo live của ${TwitchUsername} vào kênh toàn cục!`
          );
        }
      }
    } catch (error) {
      client.logger.warn(NotifyTwitch.name, `Gửi thông báo thất bại: ${error}`);
      await client.db.NotifyTwitch.delete(setupId);
      client.logger.info(
        NotifyTwitch.name,
        `Đã xoá thông báo cho ${TwitchUsername} vì gửi thất bại.`
      );
    }
  }
}
