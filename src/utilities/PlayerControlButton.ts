import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} from "discord.js";
import { Manager } from "../manager.js";
import { EmojiValidator } from "./EmojiValidator.js";

// Hàm tạo nút với điều kiện khi setLabel
const createButton = (client: Manager, id, emoji, label, style) => {
  const button = new ButtonBuilder()
    .setCustomId(id)
    .setEmoji(EmojiValidator.getEmojiForComponent(emoji))
    .setStyle(style);

  if (client.config.features.ButtonLabel ?? true) {
    button.setLabel(label);
  }

  return button;
};

const playerRowOne = (client: Manager) =>
  new ActionRowBuilder<ButtonBuilder>().addComponents([
    createButton(
      client,
      "shuffle",
      client.config.emojis.PLAYER.SHUFFLE,
      "Ngẫu nhiên",
      ButtonStyle.Secondary
    ),
    createButton(
      client,
      "replay",
      client.config.emojis.PLAYER.PREVIOUS,
      "Trước",
      ButtonStyle.Secondary
    ),
    createButton(
      client,
      "pause",
      client.config.emojis.PLAYER.PAUSE,
      "Tạm dừng",
      ButtonStyle.Secondary
    ),
    createButton(
      client,
      "skip",
      client.config.emojis.PLAYER.SKIP,
      "Bỏ qua",
      ButtonStyle.Secondary
    ),
    createButton(
      client,
      "loop",
      client.config.emojis.PLAYER.LOOP,
      "Lặp",
      ButtonStyle.Secondary
    ),
  ]);

const playerRowTwo = (client: Manager) =>
  new ActionRowBuilder<ButtonBuilder>().addComponents([
    createButton(
      client,
      "autoplay",
      client.config.emojis.PLAYER.AUTOPLAY,
      "Phát tự động",
      ButtonStyle.Secondary
    ),
    createButton(
      client,
      "voldown",
      client.config.emojis.PLAYER.VOLDOWN,
      "Giảm âm",
      ButtonStyle.Secondary
    ),
    createButton(
      client,
      "stop",
      client.config.emojis.PLAYER.STOP,
      "Dừng",
      ButtonStyle.Secondary
    ),
    createButton(
      client,
      "volup",
      client.config.emojis.PLAYER.VOLUP,
      "Tăng âm",
      ButtonStyle.Secondary
    ),
    createButton(
      client,
      "queue",
      client.config.emojis.PLAYER.QUEUE,
      "Hàng đợi",
      ButtonStyle.Secondary
    ),
  ]);

const playerRowOneEdited = (client: Manager) =>
  new ActionRowBuilder<ButtonBuilder>().addComponents([
    createButton(
      client,
      "shuffle",
      client.config.emojis.PLAYER.SHUFFLE,
      "Ngẫu nhiên",
      ButtonStyle.Secondary
    ),
    createButton(
      client,
      "replay",
      client.config.emojis.PLAYER.PREVIOUS,
      "Trước",
      ButtonStyle.Secondary
    ),
    createButton(
      client,
      "pause",
      client.config.emojis.PLAYER.PLAY,
      "Phát",
      ButtonStyle.Secondary
    ),
    createButton(
      client,
      "skip",
      client.config.emojis.PLAYER.SKIP,
      "Bỏ qua",
      ButtonStyle.Secondary
    ),
    createButton(
      client,
      "loop",
      client.config.emojis.PLAYER.LOOP,
      "Lặp",
      ButtonStyle.Secondary
    ),
  ]);

const filterSelect = (client: Manager) =>
  new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("filter")
      .setPlaceholder(client.config.SELECT_MENU_FILTER.placeholder)
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(
        {
          label: "Đặt lại",
          value: "reset",
          description: "Đặt lại hiệu ứng lọc về âm thanh mặc định",
          emoji: EmojiValidator.getEmojiForComponent(client.config.SELECT_MENU_FILTER.emoji_reset),
        },
        {
          label: "3D",
          value: "threed",
          description: "Hiệu ứng âm thanh không gian 3D",
          emoji: EmojiValidator.getEmojiForComponent(client.config.SELECT_MENU_FILTER.emoji_filter),
        },
        {
          label: "Bass",
          value: "bass",
          description: "Tăng cường dải tần thấp",
          emoji: EmojiValidator.getEmojiForComponent(client.config.SELECT_MENU_FILTER.emoji_filter),
        },
        {
          label: "Tăng Bass",
          value: "bassboost",
          description: "Đẩy mạnh âm bass",
          emoji: EmojiValidator.getEmojiForComponent(client.config.SELECT_MENU_FILTER.emoji_filter),
        },
        {
          label: "Giọng cao",
          value: "chipmunk",
          description: "Hiệu ứng làm giọng cao",
          emoji: EmojiValidator.getEmojiForComponent(client.config.SELECT_MENU_FILTER.emoji_filter),
        },
        {
          label: "Darth Vader",
          value: "darthvader",
          description: "Hiệu ứng giọng giống Darth Vader",
          emoji: EmojiValidator.getEmojiForComponent(client.config.SELECT_MENU_FILTER.emoji_filter),
        },
        {
          label: "Daycore",
          value: "daycore",
          description: "Hiệu ứng Daycore",
          emoji: EmojiValidator.getEmojiForComponent(client.config.SELECT_MENU_FILTER.emoji_filter),
        },
        {
          label: "Tăng tốc",
          value: "doubletime",
          description: "Tăng gấp đôi tốc độ phát",
          emoji: EmojiValidator.getEmojiForComponent(client.config.SELECT_MENU_FILTER.emoji_filter),
        },
        {
          label: "Rất to (cẩn thận)",
          value: "earrape",
          description: "Hiệu ứng cực kỳ to, hãy cẩn thận",
          emoji: EmojiValidator.getEmojiForComponent(client.config.SELECT_MENU_FILTER.emoji_filter),
        },
        {
          label: "Karaoke",
          value: "karaoke",
          description: "Chế độ Karaoke",
          emoji: EmojiValidator.getEmojiForComponent(client.config.SELECT_MENU_FILTER.emoji_filter),
        },
        {
          label: "Nightcore",
          value: "nightcore",
          description: "Hiệu ứng Nightcore",
          emoji: EmojiValidator.getEmojiForComponent(client.config.SELECT_MENU_FILTER.emoji_filter),
        },
        {
          label: "Cao độ",
          value: "pitch",
          description: "Điều chỉnh cao độ âm thanh",
          emoji: EmojiValidator.getEmojiForComponent(client.config.SELECT_MENU_FILTER.emoji_filter),
        },
        {
          label: "Pop",
          value: "pop",
          description: "Hiệu ứng theo phong cách Pop",
          emoji: EmojiValidator.getEmojiForComponent(client.config.SELECT_MENU_FILTER.emoji_filter),
        },
        {
          label: "Tốc độ phát",
          value: "rate",
          description: "Thay đổi tỉ lệ phát âm thanh",
          emoji: EmojiValidator.getEmojiForComponent(client.config.SELECT_MENU_FILTER.emoji_filter),
        },
        {
          label: "Chậm lại",
          value: "slowmotion",
          description: "Làm chậm tốc độ phát",
          emoji: EmojiValidator.getEmojiForComponent(client.config.SELECT_MENU_FILTER.emoji_filter),
        },
        {
          label: "Âm mềm",
          value: "soft",
          description: "Làm âm thanh mềm hơn",
          emoji: EmojiValidator.getEmojiForComponent(client.config.SELECT_MENU_FILTER.emoji_filter),
        },
        {
          label: "Tốc độ",
          value: "speed",
          description: "Điều chỉnh tốc độ phát",
          emoji: EmojiValidator.getEmojiForComponent(client.config.SELECT_MENU_FILTER.emoji_filter),
        },
        {
          label: "Bass mạnh",
          value: "superbass",
          description: "Hiệu ứng bass mạnh mẽ",
          emoji: EmojiValidator.getEmojiForComponent(client.config.SELECT_MENU_FILTER.emoji_filter),
        },
        {
          label: "China",
          value: "china",
          description: "Hiệu ứng âm thanh phong cách Trung Quốc",
          emoji: EmojiValidator.getEmojiForComponent(client.config.SELECT_MENU_FILTER.emoji_filter),
        },
        {
          label: "TV",
          value: "television",
          description: "Hiệu ứng âm thanh kiểu truyền hình",
          emoji: EmojiValidator.getEmojiForComponent(client.config.SELECT_MENU_FILTER.emoji_filter),
        },
        {
          label: "Treble & Bass",
          value: "treblebass",
          description: "Điều chỉnh treble và bass",
          emoji: EmojiValidator.getEmojiForComponent(client.config.SELECT_MENU_FILTER.emoji_filter),
        },
        {
          label: "Tremolo",
          value: "tremolo",
          description: "Hiệu ứng Tremolo",
          emoji: EmojiValidator.getEmojiForComponent(client.config.SELECT_MENU_FILTER.emoji_filter),
        },
        {
          label: "Vaporwave",
          value: "vaporwave",
          description: "Hiệu ứng Vaporwave",
          emoji: EmojiValidator.getEmojiForComponent(client.config.SELECT_MENU_FILTER.emoji_filter),
        },
        {
          label: "Rung",
          value: "vibrate",
          description: "Hiệu ứng rung âm thanh",
          emoji: EmojiValidator.getEmojiForComponent(client.config.SELECT_MENU_FILTER.emoji_filter),
        },
        {
          label: "Vibrato",
          value: "vibrato",
          description: "Hiệu ứng Vibrato",
          emoji: EmojiValidator.getEmojiForComponent(client.config.SELECT_MENU_FILTER.emoji_filter),
        }
      )
  );

export { playerRowOne, playerRowOneEdited, playerRowTwo, filterSelect };
