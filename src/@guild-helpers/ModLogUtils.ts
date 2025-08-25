import { ModLogToggle } from "../database/schema/ModLogToggle.js";
import { ModLogChannel } from "../database/schema/ModLogChannel.js";
import { DatabaseTable } from "../database/@types.js";
import { TextChannel } from "discord.js";
import { Manager } from "../manager.js";

export async function initializeModLogToggles(
  guildId: string,
  database: DatabaseTable
) {
  const defaultToggles: ModLogToggle = {
    guildId: guildId,

    // Sự kiện máy chủ
    guildBanAdd: true,
    guildBanRemove: true,
    guildUpdate: true,
    guildIntegrationsUpdate: false,
    guildAuditLogEntryCreate: false,
    guildOnboardingUpdate: false,
    guildVanityURLUpdate: true,
    guildVanityURLRemove: true,
    guildBoostLevelRemoval: true,
    guildMFALevelUpdate: false,
    guildVerificationLevelUpdate: false,
    guildExplicitContentFilterUpdate: false,
    guildNotificationSettingsUpdate: false,
    guildAFKChannelUpdate: false,
    guildRulesChannelUpdate: false,
    guildWelcomeScreenUpdate: false,
    guildDiscoveryUpdate: false,
    guildSystemChannelUpdate: false,
    guildVoiceRegionUpdate: false,

    // Trình xử lý sự kiện đã lên lịch
    guildScheduledEventCreate: false,
    guildScheduledEventDelete: false,
    guildScheduledEventUpdate: false,
    guildScheduledEventCancel: false,
    guildScheduledEventStartEnd: false,
    guildScheduledEventReschedule: false,

    // Sự kiện vai trò
    roleCreate: true,
    roleDelete: true,
    roleUpdate: true,
    rolePermissionsUpdate: true,
    roleMentionableUpdate: true,
    roleHierarchyUpdate: true,
    roleMentionableToggle: true,

    // Sự kiện kênh
    channelCreate: true,
    channelDelete: true,
    channelUpdate: true,
    channelOverwriteUpdate: true,
    channelPinsUpdate: false,
    channelNSFWToggle: false,
    channelSlowmodeUpdate: false,

    // Sự kiện chủ đề
    threadCreate: false,
    threadDelete: false,
    threadUpdate: false,
    threadMemberUpdate: false,
    threadAutoArchived: false,
    threadArchiveUnarchive: false,

    // Sự kiện tin nhắn
    messageDelete: true,
    messageUpdate: true,
    messageDeleteBulk: true,
    messagePinned: false,
    messageUnpinned: false,
    messageEmbedUpdate: false,

    // Sự kiện tương tác
    messageReactionAdd: true,
    messageReactionRemove: true,
    messageReactionRemoveAll: true,

    // Sự kiện emoji và sticker
    emojiCreate: true,
    emojiDelete: true,
    emojiUpdate: true,
    stickerCreate: true,
    stickerDelete: true,
    stickerUpdate: true,

    // Sự kiện tích hợp
    integrationCreate: false,
    integrationDelete: false,
    integrationUpdate: false,
    integrationExpiration: false,

    // Sự kiện tự động kiểm duyệt
    autoModerationRuleCreate: false,
    autoModerationRuleUpdate: false,
    autoModerationRuleDelete: false,
    autoModerationActionExecution: false,

    // Sự kiện lệnh ứng dụng
    applicationCommandPermissionsUpdate: false,
    applicationCommandCreate: false,
    applicationCommandDelete: false,
    applicationCommandUpdate: false,
    applicationCommandInvocation: false,
    applicationCommandCooldownBypass: false,
    slashCommandError: false,

    // Sự kiện trạng thái
    presenceUpdate: false,
    presenceActivityUpdate: false,
    guildMemberPresenceUpdate: false,

    // Sự kiện gõ và người dùng
    typingStart: false,
    typingStop: false,
    userUpdate: false,

    // Sự kiện thành viên
    guildMemberAdd: true,
    guildMemberRemove: true,
    guildMemberUpdate: true,
    guildMemberRoleAddRemove: true,
    guildMemberPermissionsUpdate: true,
    guildMemberAvatarUpdate: true,
    guildMemberJoinDateUpdate: true,
    guildMemberBoost: true,
    guildMemberTimeout: false,
    guildMemberOnlineStatusUpdate: true,
    guildMemberTemporaryBanUnban: false,
    guildMemberPrune: true,
    memberTimeoutUpdate: false,
    guildAFKUpdate: false,
    guildMemberNicknameChange: true,
    voiceStateUpdate: false,

    // Sự kiện kênh thoại
    voiceChannelJoin: true,
    voiceChannelLeave: true,
    voiceChannelSwitch: true,
    voiceChannelMuteToggle: false, // Thêm nếu cần cho tắt/bật mic
    voiceChannelDeafToggle: false, // Thêm nếu cần cho tắt/bật nghe

    // Sự kiện điều hành
    moderationCommandInvocation: false,

    // Sự kiện lời mời
    inviteCreate: true,
    inviteDelete: true,

    // Sự kiện webhook
    guildWebhookCreate: false,
    guildWebhookDelete: false,
    webhookUpdate: false,

    // Sự kiện stage
    stageInstanceCreate: false,
    stageInstanceDelete: false,
    stageInstanceUpdate: false,

    // Các sự kiện tùy chỉnh khác
    auditLogPrune: false,
    guildBannerRemoval: false,
  };

  await database.ModLogToggle.set(guildId, defaultToggles);
}

export async function getModLogToggles(
  guildId: string,
  database: DatabaseTable
): Promise<ModLogToggle> {
  let toggles = await database.ModLogToggle.get(guildId);
  if (!toggles) {
    await initializeModLogToggles(guildId, database);
    toggles = await database.ModLogToggle.get(guildId);
  }
  return toggles as ModLogToggle;
}

export async function toggleModLogEvent(
  guildId: string,
  event: keyof ModLogToggle,
  state: boolean,
  database: DatabaseTable
) {
  const toggles: ModLogToggle = await getModLogToggles(guildId, database);

  if (event in toggles) {
    toggles[event] = state;
    await database.ModLogToggle.set(guildId, toggles);
  }
}

export async function isEventEnabled(
  guildId: string,
  event: keyof ModLogToggle,
  database: DatabaseTable
): Promise<boolean> {
  const toggles = await getModLogToggles(guildId, database);
  return !!toggles[event];
}

export async function getModLogChannel(
  guildId: string,
  client: Manager,
  database: DatabaseTable
): Promise<TextChannel | null> {
  const modLogChannel = (await database.ModLogChannel.get(
    guildId
  )) as ModLogChannel;
  if (!modLogChannel || !modLogChannel.channelId) return null;
  const guild = await client.guilds.fetch(guildId);
  if (!guild) return null;

  const channel = await guild.channels.fetch(modLogChannel.channelId);
  return channel instanceof TextChannel ? channel : null;
}
