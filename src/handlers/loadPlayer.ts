import { Manager } from "../manager.js";
import { PlayerContentLoader } from "./Player/loadContent.js";
import { PlayerEventLoader } from "./Player/loadEvent.js";
import { PlayerSetupLoader } from "./Player/loadSetup.js";
import { PlayerUpdateLoader } from "./Player/loadUpdate.js";
import { log } from "../utilities/LoggerHelper.js";
import { ManifestLoader } from "../services/ManifestLoader.js";
export class PlayerLoader {
  constructor(client: Manager) {
    new PlayerEventLoader(client);
    new PlayerContentLoader(client);
    new PlayerUpdateLoader(client);
    new PlayerSetupLoader(client);
    
    const manifestLoader = new ManifestLoader();
    const manifest = manifestLoader.data;
    log.info(manifest.metadata.bot.codename, `Các logic của Player đã được tải thành công!`);
  }
}
