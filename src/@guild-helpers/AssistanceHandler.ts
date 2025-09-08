import { Manager } from "../manager.js";
import { Helper } from "./Assistance/Helper.js";
import { WelcomerEvents } from "./Assistance/WelcomerEvents.js";

export class AssistanceHandler {
  constructor(client: Manager) {
    if (client.config.HELPER_SETUP.Enable ?? false) {
      new Helper(client);
    }
    if (client.config.WELCOMER_EVENTS.Enable ?? false) {
      new WelcomerEvents(client);
    }
  }
}
