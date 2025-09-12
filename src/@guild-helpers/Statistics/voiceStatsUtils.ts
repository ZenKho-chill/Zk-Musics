import { Manager } from "../../manager.js";
import { VoiceState } from "discord.js";
import { updateVoiceTime } from "./StatisticsUtils.js";

export class handleVoiceStats {
  private client: Manager;

  constructor(client: Manager) {
    this.client = client;
    this.Init();
  }
  private Init() {
    this.client.on("voiceStateUpdate", async (oldState: VoiceState, newState: VoiceState) => {
      if (!newState.guild) return;

      // Cập nhật thời gian thoại trong cơ sở dữ liệu
      await updateVoiceTime(oldState, newState, this.client);
    });
  }
}
