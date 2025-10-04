import {
  playerRowOneEdited,
  playerRowTwo,
  filterSelect,
  radioRowOneEdited,
  radioRowTwo,
} from "../../utilities/PlayerControlButton.js";
import { Manager } from "../../manager.js";
import { TextChannel } from "discord.js";
import { ZklinkPlayer } from "../../Zklink/main.js";

export default class {
  async execute(client: Manager, player: ZklinkPlayer) {
    if (player.voiceId == null) return;

    const nowPlaying = client.nplayingMsg.get(`${player.guildId}`);
    if (nowPlaying) {
      // Chọn button layout dựa trên radio mode
      const isRadioMode = player.data.get("radio_mode") === true;
      const rowOneEdited = isRadioMode ? radioRowOneEdited(client) : playerRowOneEdited(client);
      const rowTwo = isRadioMode ? radioRowTwo(client) : playerRowTwo(client);
      
      nowPlaying.msg
        .edit({
          components: [
            ...(((client.config.features.FilterMenu ?? false) && !isRadioMode) ? [filterSelect(client)] : []),
            rowOneEdited,
            rowTwo,
          ],
        })
        .catch(() => null);
    }

    const setup = await client.db.setup.get(`${player.guildId}`);

    client.emit("playerPause", player);

    if (setup && setup.playmsg) {
      const channel = await client.channels.fetch(setup.channel).catch(() => undefined);
      if (!channel) return;
      if (!channel.isTextBased) return;
      const msg = await (channel as TextChannel).messages
        .fetch(setup.playmsg)
        .catch(() => undefined);
      if (!msg) return;
      msg.edit({ components: [client.enSwitch] }).catch(() => null);
    }
  }
}
