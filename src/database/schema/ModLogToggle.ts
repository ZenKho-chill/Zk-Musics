export interface ModLogToggle {
  guildId: string;
  // Sự kiện Guild (guildEvents.ts)
  guildBanAdd: boolean;
  guildBanRemove: boolean;
  guildUpdate: boolean;
  guildIntegrationsUpdate: boolean;
  guildAuditLogEntryCreate: boolean;
  guildOnboardingUpdate: boolean;
  guildVanityURLUpdate: boolean;
  guildVanityURLRemove: boolean;
  guildBoostLevelRemoval: boolean;
  guildMFALevelUpdate: boolean;
  guildVerificationLevelUpdate: boolean;
  guildExplicitContentFilterUpdate: boolean;
  guildNotificationSettingsUpdate: boolean;
  guildAFKChannelUpdate: boolean;
  guildRulesChannelUpdate: boolean;
  guildWelcomeScreenUpdate: boolean;
  guildDiscoveryUpdate: boolean;
  guildSystemChannelUpdate: boolean;
  guildVoiceRegionUpdate: boolean;

  // Trình xử lý Sự kiện Đã Lên lịch (scheduledEventHandlers.ts)
  guildScheduledEventCreate: boolean;
  guildScheduledEventDelete: boolean;
  guildScheduledEventUpdate: boolean;
  guildScheduledEventCancel: boolean;
  guildScheduledEventStartEnd: boolean;
  guildScheduledEventReschedule: boolean;

  // Sự kiện Vai trò (roleEvents.ts)
  roleCreate: boolean;
  roleDelete: boolean;
  roleUpdate: boolean;
  rolePermissionsUpdate: boolean;
  roleMentionableUpdate: boolean;
  roleHierarchyUpdate: boolean;
  roleMentionableToggle: boolean;

  // Sự kiện Kênh (channelEvents.ts)
  channelCreate: boolean;
  channelDelete: boolean;
  channelUpdate: boolean;
  channelOverwriteUpdate: boolean;
  channelPinsUpdate: boolean;
  channelNSFWToggle: boolean;
  channelSlowmodeUpdate: boolean;

  // Sự kiện Chủ đề (threadEvents.ts)
  threadCreate: boolean;
  threadDelete: boolean;
  threadUpdate: boolean;
  threadMemberUpdate: boolean;
  threadAutoArchived: boolean;
  threadArchiveUnarchive: boolean;

  // Sự kiện Tin nhắn (messageEvents.ts)
  messageDelete: boolean;
  messageUpdate: boolean;
  messageDeleteBulk: boolean;
  messagePinned: boolean;
  messageUnpinned: boolean;
  messageEmbedUpdate: boolean;

  // Sự kiện Biểu tượng cảm xúc và Sticker (emojiEvents.ts)
  emojiCreate: boolean;
  emojiDelete: boolean;
  emojiUpdate: boolean;
  stickerCreate: boolean;
  stickerDelete: boolean;
  stickerUpdate: boolean;

  // Sự kiện Tích hợp (integrationEvents.ts)
  integrationCreate: boolean;
  integrationDelete: boolean;
  integrationUpdate: boolean;
  integrationExpiration: boolean;

  // Sự kiện Tự động Kiểm duyệt (autoModEvents.ts)
  autoModerationRuleCreate: boolean;
  autoModerationRuleUpdate: boolean;
  autoModerationRuleDelete: boolean;
  autoModerationActionExecution: boolean;

  // Sự kiện Lệnh Ứng dụng (slashCommandEvents.ts)
  applicationCommandPermissionsUpdate: boolean;
  applicationCommandCreate: boolean;
  applicationCommandDelete: boolean;
  applicationCommandUpdate: boolean;
  applicationCommandInvocation: boolean;
  applicationCommandCooldownBypass: boolean;
  slashCommandError: boolean;

  // Sự kiện Hiện diện (presenceEvents.ts)
  presenceUpdate: boolean;
  presenceActivityUpdate: boolean;
  guildMemberPresenceUpdate: boolean;

  // Sự kiện Gõ và Người dùng (typingEvents.ts)
  typingStart: boolean;
  typingStop: boolean;
  userUpdate: boolean;

  // Sự kiện Thành viên (memberEvents.ts)
  guildMemberAdd: boolean;
  guildMemberRemove: boolean;
  guildMemberUpdate: boolean;
  guildMemberRoleAddRemove: boolean;
  guildMemberPermissionsUpdate: boolean; // New
  guildMemberAvatarUpdate: boolean; // Mới
  guildMemberJoinDateUpdate: boolean; // Mới
  guildMemberBoost: boolean; // Mới
  guildMemberTimeout: boolean; // Mới
  guildMemberOnlineStatusUpdate: boolean; // Mới
  guildMemberTemporaryBanUnban: boolean; // Mới
  guildMemberPrune: boolean; // Mới
  memberTimeoutUpdate: boolean;
  guildAFKUpdate: boolean;
  guildMemberNicknameChange: boolean;
  voiceStateUpdate: boolean;

  // Sự kiện Kiểm duyệt (moderationEvents.ts)
  moderationCommandInvocation: boolean;

  // Sự kiện Phản ứng (reactionEvents.ts)
  messageReactionAdd: boolean;
  messageReactionRemove: boolean;

  // Sự kiện Lời mời (inviteEvents.ts)
  inviteCreate: boolean;
  inviteDelete: boolean;

  // Sự kiện Webhook (webhookEvents.ts)
  guildWebhookCreate: boolean;
  guildWebhookDelete: boolean;
  webhookUpdate: boolean;

  // Sự kiện Voice (voiceEvents.ts)
  voiceChannelJoin: boolean;
  voiceChannelLeave: boolean;
  voiceChannelSwitch: boolean;

  // Sự kiện Stage (stageEvents.ts)
  stageInstanceCreate: boolean;
  stageInstanceDelete: boolean;
  stageInstanceUpdate: boolean;

  // Các Sự kiện Tùy chỉnh Khác (otherEvents.ts)
  auditLogPrune: boolean;
  guildBannerRemoval: boolean;

  // Các sự kiện bổ sung còn thiếu (nếu có)
  [key: string]: boolean | string;
}
