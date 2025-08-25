import { Manager } from "../manager.js";
import { GeminiChatAi } from "./Assistance/GeminiChatAi.js";
import { CatAndQuotes } from "./Assistance/CatAndQuotes.js";
import { Helpdesk } from "./Assistance/Helpdesk.js";
import { Helper } from "./Assistance/Helper.js";
import { WelcomerEvents } from "./Assistance/WelcomerEvents.js";
import { TicketHandler } from "./Assistance/TicketHandler.js";

export class AssistanceHandler {
  constructor(client: Manager) {
    if (client.config.utilities.GeminiChat.Enable ?? false) {
      new GeminiChatAi(client);
    }
    if (client.config.utilities.CatAndQuotes.Enable ?? false) {
      new CatAndQuotes(client);
    }
    if (client.config.HELPDESK.Enable ?? false) {
      new Helpdesk(client);
    }
    if (client.config.HELPER_SETUP.Enable ?? false) {
      new Helper(client);
    }
    if (client.config.WELCOMER_EVENTS.Enable ?? false) {
      new WelcomerEvents(client);
    }
    if (client.config.utilities.TicketSystem.Enable ?? false) {
      new TicketHandler(client);
    }
  }
}
