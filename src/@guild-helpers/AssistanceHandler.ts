import { Manager } from "../manager.js";
import { Helper } from "./Assistance/Helper.js";

export class AssistanceHandler {
  constructor(client: Manager) {
    if (client.config.HELPER_SETUP.Enable ?? false) {
      new Helper(client);
    }
  }
}
