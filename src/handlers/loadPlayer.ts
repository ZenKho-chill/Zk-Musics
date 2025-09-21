import { Manager } from "../manager.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { PlayerContentLoader } from "./Player/loadContent.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { PlayerEventLoader } from "./Player/loadEvent.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { PlayerSetupLoader } from "./Player/loadSetup.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { PlayerUpdateLoader } from "./Player/loadUpdate.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";

export class PlayerLoader {
  constructor(client: Manager) {
    new PlayerEventLoader(client);
    new PlayerContentLoader(client);
    new PlayerUpdateLoader(client);
    new PlayerSetupLoader(client);
    logInfo(PlayerLoader.name, "Sự kiện Zklink đã được tải!");
  }
}
