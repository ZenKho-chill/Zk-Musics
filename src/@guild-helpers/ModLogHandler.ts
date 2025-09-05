import { Manager } from "../manager.js";
import { GuildEventHandler } from "./ModLog/guildEvents.js";
import { RoleEventsHandler } from "./ModLog/roleEvents.js";
import { ChannelEventsHandler } from "./ModLog/channelEvents.js";
import { MessageEventsHandler } from "./ModLog/messageEvents.js";
import { MemberEventsHandler } from "./ModLog/memberEvents.js";
import { EmojiEventsHandler } from "./ModLog/emojiEvents.js";
import { IntegrationEventsHandler } from "./ModLog/integrationEvents.js";
import { ThreadEventsHandler } from "./ModLog/threadEvents.js";
import { VoiceEventsHandler } from "./ModLog/voiceEvents.js";
import { InviteEventsHandler } from "./ModLog/inviteEvents.js";
import { WebhookEventsHandler } from "./ModLog/webhookEvents.js";
import { ScheduledEventHandler } from "./ModLog/scheduledEventHandlers.js";
import { AutoModEventsHandler } from "./ModLog/autoModEvents.js";
import { ReactionEventsHandler } from "./ModLog/reactionEvents.js";
import { SlashCommandEventsHandler } from "./ModLog/slashCommandEvents.js";
import { StickerEventsHandler } from "./ModLog/stickerEvents.js";
import { TypingEventsHandler } from "./ModLog/typingEvents.js";
import { VoiceChannelEventsHandler } from "./ModLog/voiceChannelEvents.js";
import { VoiceRegionEventsHandler } from "./ModLog/voiceRegionEvents.js";

export class ModLogHandler {
  private client: Manager;

  private guildEventHandler: GuildEventHandler;
  private roleEventHandler: RoleEventsHandler;
  private channelEventHandler: ChannelEventsHandler;
  private messageEventHandler: MessageEventsHandler;
  private memberEventHandler: MemberEventsHandler;
  private emojiEventHandler: EmojiEventsHandler;
  private integrationEventHandler: IntegrationEventsHandler;
  private threadEventHandler: ThreadEventsHandler;
  private voiceEventHandler: VoiceEventsHandler;
  private inviteEventHandler: InviteEventsHandler;
  private webhookEventHandler: WebhookEventsHandler;
  private scheduledEventHandler: ScheduledEventHandler;
  private autoModEventHandler: AutoModEventsHandler;
  private reactionEventHandler: ReactionEventsHandler;
  private slashCommandEventHandler: SlashCommandEventsHandler;
  private stickerEventHandler: StickerEventsHandler;
  private typingEventHandler: TypingEventsHandler;
  private voiceChannelEventHandler: VoiceChannelEventsHandler;
  private voiceRegionEventHandler: VoiceRegionEventsHandler;

  constructor(client: Manager) {
    this.client = client;
    this.guildEventHandler = new GuildEventHandler(client);
    this.roleEventHandler = new RoleEventsHandler(client);
    this.channelEventHandler = new ChannelEventsHandler(client);
    this.messageEventHandler = new MessageEventsHandler(client);
    this.memberEventHandler = new MemberEventsHandler(client);
    this.emojiEventHandler = new EmojiEventsHandler(client);
    this.integrationEventHandler = new IntegrationEventsHandler(client);
    this.threadEventHandler = new ThreadEventsHandler(client);
    this.voiceEventHandler = new VoiceEventsHandler(client);
    this.inviteEventHandler = new InviteEventsHandler(client);
    this.webhookEventHandler = new WebhookEventsHandler(client);
    this.scheduledEventHandler = new ScheduledEventHandler(client);
    this.autoModEventHandler = new AutoModEventsHandler(client);
    this.reactionEventHandler = new ReactionEventsHandler(client);
    this.slashCommandEventHandler = new SlashCommandEventsHandler(client);
    this.stickerEventHandler = new StickerEventsHandler(client);
    this.typingEventHandler = new TypingEventsHandler(client);
    this.voiceChannelEventHandler = new VoiceChannelEventsHandler(client);
    this.voiceRegionEventHandler = new VoiceRegionEventsHandler(client);
  }
}