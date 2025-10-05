import { Manager } from "../manager.js";
import { PlayerContentLoader } from "./Player/loadContent.js";
import { PlayerEventLoader } from "./Player/loadEvent.js";
import { PlayerSetupLoader } from "./Player/loadSetup.js";
import { PlayerUpdateLoader } from "./Player/loadUpdate.js";
// Log đã bị xóa

export class PlayerLoader {
  constructor(client: Manager) {
    new PlayerEventLoader(client);
    new PlayerContentLoader(client);
    new PlayerUpdateLoader(client);
    new PlayerSetupLoader(client);
    // Log đã bị xóa - Zklink loaded
  }
}
