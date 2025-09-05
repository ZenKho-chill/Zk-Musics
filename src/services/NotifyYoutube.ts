import axios from "axios";
import { parseStringPromise } from "xml2js";
import { google } from "googleapis";
import { Manager } from "../manager.js";
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import cron from "node-cron";
import { Config } from "../@types/Config.js";
import { ConfigData } from "../services/ConfigData.js";
const data: Config = new ConfigData().data;

// Định nghĩa các API key
const apiKeys = [
  data.utilities.NotifyYoutube.ApiKey,
  data.utilities.NotifyYoutube.ApiKey1,
  data.utilities.NotifyYoutube.ApiKey2,
  data.utilities.NotifyYoutube.ApiKey3,
];

let currentApiKeyIndex = 0;

// Hàm lấy API key đang dùng
const getCurrentApiKey = () => apiKeys[currentApiKeyIndex];

// Chuyển sang API key tiếp theo (nếu key hiện tại bị giới hạn)
const switchApiKey = () => {
  currentApiKeyIndex = (currentApiKeyIndex + 1) % apiKeys.length;
};

// Ghi log khi API key không hợp lệ
const logInvalidApiKey = (key: string, status: number) => {
  console.warn(`API key "${key}" không hợp lệ. Mã trạng thái: ${status}`);
};

// Cấu hình client YouTube
const getYoutubeClient = () =>
  google.youtube({
    version: "v3",
    auth: getCurrentApiKey(),
  });

export default class NotifyYoutube {
  async execute(client: Manager) {
    const checkYouTubeFeed = async (channelId: string) => {
      try {
        const youtube = getYoutubeClient();
        const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
        const { data: xmlData } = await axios.get(feedUrl);
        const jsonData = await parseStringPromise(xmlData);

        const latestVideo = jsonData.feed.entry[0];
        const videoId = latestVideo["yt:videoId"][0];
        const publishDate = new Date(latestVideo.published[0]);

        const videoDetails = await youtube.videos.list({
          id: [videoId],
          part: ["contentDetails", "liveStreamingDetails"],
        });

        const video = videoDetails.data.items?.[0];
        const liveDetails = video?.liveStreamingDetails;

        const isLive = !!liveDetails && !liveDetails.actualEndTime;
        if (!isLive) {
          return null;
        }

        const videoTitle = latestVideo.title[0];
        const videoLink = latestVideo.link[0].$.href;
        const channelName = jsonData.feed.author[0].name[0];
        const channelUrl = jsonData.feed.author[0].uri[0];
        const thumbnail =
          latestVideo["media:group"][0]["media:thumbnail"][0].$.url;
        const description =
          latestVideo["media:group"][0]["media:description"][0];

        const channelDetails = await youtube.channels.list({
          id: [channelId],
          part: ["snippet"],
        });

        const channel = channelDetails.data.items?.[0];
        const avatarUrl = channel?.snippet?.thumbnails?.default?.url;
        const isUpcoming =
          liveDetails?.scheduledStartTime &&
          new Date(liveDetails.scheduledStartTime) > new Date();

        return {
          videoTitle,
          videoLink,
          videoId,
          channelName,
          channelUrl,
          thumbnail,
          description,
          isLive,
          avatarUrl,
          publishDate,
          isUpcoming,
          liveDetails,
        };
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return "404";
        } else if (
          error.response?.status === 403 ||
          error.response?.status === 400
        ) {
          logInvalidApiKey(getCurrentApiKey(), error.response?.status ?? 0);
          switchApiKey();
          return await checkYouTubeFeed(channelId);
        } else {
          client.logger.warn(
            NotifyYoutube.name,
            `Lỗi khi lấy/parse feed YouTube: ${error}`
          );
          return null;
        }
      }
    };

    cron.schedule(client.config.utilities.NotifyYoutube.Schedule, async () => {
      try {
        const setups = await client.db.NotifyYoutube.all();

        for (const setup of setups) {
          let { Notifications } = setup.value;

          for (let notification of Notifications) {
            const videoData = await checkYouTubeFeed(
              notification.YouTubeChannelId
            );

            if (videoData === "404") {
              Notifications = Notifications.filter(
                (n) => n.YouTubeChannelId !== notification.YouTubeChannelId
              );
              await client.db.NotifyYoutube.update(setup.id, { Notifications });
              client.logger.info(
                NotifyYoutube.name,
                `Đã xóa kênh không hợp lệ ${notification.YouTubeChannelId}`
              );
              continue;
            }

            if (!videoData || videoData.isUpcoming || !videoData.isLive) {
              continue;
            }

            const isNewLiveStream =
              videoData.isLive &&
              !videoData.liveDetails?.actualEndTime &&
              (!notification.LastStatusLive ||
                videoData.videoId !== notification.LastVideoId);

            const isCurrentlyLive =
              videoData.liveDetails?.actualEndTime === undefined;

            if (isNewLiveStream && isCurrentlyLive) {
              notification.LastVideoId = videoData.videoId;
              notification.LastPublishDate = videoData.publishDate;
              notification.LastStatusLive = videoData.isLive;

              await client.db.NotifyYoutube.update(setup.id, { Notifications });

              const embedDescription =
                videoData.description.length > 200
                  ? videoData.description.slice(0, 200) + "..."
                  : videoData.description;

              const createEmbed = () =>
                new EmbedBuilder()
                  .setAuthor({
                    name: videoData.channelName,
                    url: videoData.channelUrl,
                    iconURL: videoData.avatarUrl,
                  })
                  .setTitle(videoData.videoTitle)
                  .setURL(videoData.videoLink)
                  .setDescription(
                    `${videoData.channelName} vừa lên sóng trên YouTube rồi!`
                  )
                  .setThumbnail(videoData.avatarUrl)
                  .setColor(0xed4245)
                  .setImage(videoData.thumbnail)
                  .setFooter({
                    text: "YouTube - Đang live",
                    iconURL:
                      "https://cdn.discordapp.com/emojis/1286513251076673558.gif",
                  })
                  .setTimestamp();

              const createButton = () =>
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                  new ButtonBuilder()
                    .setLabel("Xem trực tiếp")
                    .setStyle(ButtonStyle.Link)
                    .setURL(videoData.videoLink)
                );

              const embed = createEmbed();
              const button = createButton();

              const sendNotification = async (channelID: string) => {
                const channel = await client.channels
                  .fetch(channelID)
                  .catch(() => undefined);
                if (!channel || (channel && !channel.isTextBased())) return;

                const isGlobalChannel =
                  channelID ===
                  client.config.utilities.NotifyYoutube.GlobalChannelID;

                channel.send({
                  content: isGlobalChannel ? null : notification.Content,
                  embeds: [embed],
                  components: [button],
                });
              };

              if (notification.ChannelID) {
                await sendNotification(notification.ChannelID);
                client.logger.info(
                  NotifyYoutube.name,
                  `Đã gửi thông báo cho ${videoData.channelName} tới kênh cá nhân!`
                );
              }

              if (client.config.utilities.NotifyYoutube.GlobalChannelID) {
                await sendNotification(
                  client.config.utilities.NotifyYoutube.GlobalChannelID
                );
                client.logger.info(
                  NotifyYoutube.name,
                  `Đã gửi thông báo cho ${videoData.channelName} tới kênh toàn cục!`
                );
              }
            }
          }
        }
      } catch (error) {
        client.logger.warn(
          NotifyYoutube.name,
          `Lỗi khi chạy NotifyYoutube: ${error}`
        );
      }
    });
  }
}
