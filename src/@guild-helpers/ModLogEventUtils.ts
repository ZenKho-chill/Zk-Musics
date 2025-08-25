import { TextChannel } from "discord.js";
import { ModLogToggle } from "../database/schema/ModLogToggle.js";

export async function isEventEnabled(
  guildId: string,
  event: keyof ModLogToggle,
  database: any
): Promise<boolean> {
  if (!database || !database.ModLogToggle) {
    return false;
  }

  const toggles = (await database.ModLogToggle.get(
    guildId
  )) as ModLogToggle | null;
  if (!toggles) return false;

  return !!toggles[event];
}

export async function getModLogChannel(
  guildId: string,
  client: any
): Promise<TextChannel | null> {
  if (!client.db || !client.db.ModLogChannel) {
    return null;
  }

  const modLogData = await client.db.ModLogChannel.get(guildId);
  if (!modLogData || !modLogData.channelId) return null;

  return client.channels.cache.get(modLogData.channelId) as TextChannel;
}
