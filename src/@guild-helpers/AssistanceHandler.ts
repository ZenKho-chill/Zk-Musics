import { Manager } from "../manager.js";
import { GeminiChatAi } from "./Assistance/GeminiChatAi.js";
import { Helper } from "./Assistance/Helper.js";
import { WelcomerEvents } from "./Assistance/WelcomerEvents.js";

export class AssistanceHandler {
  constructor(client: Manager) {
    if (client.config.utilities.GeminiChat.Enable ?? false) {
      new GeminiChatAi(client);
    }
    if (client.config.HELPER_SETUP.Enable ?? false) {
      new Helper(client);
    }
    if (client.config.WELCOMER_EVENTS.Enable ?? false) {
      new WelcomerEvents(client);
    }
  }
}
