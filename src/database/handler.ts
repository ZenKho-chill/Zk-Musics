import { Manager } from "../manager.js";
import { AutoReconnectLavalinkService } from "./setup/lavalink.js";
import { PremiumScheduleSetup } from "./setup/premium.js";
import { SongRequesterCleanSetup } from "./setup/setup.js";
import { TracksArtistsCleanUp } from "./setup/TracksArtistsCleanUp.js";

export class Handler {
  constructor(client: Manager) {
    new SongRequesterCleanSetup(client);
    new AutoReconnectLavalinkService(client);
    new PremiumScheduleSetup(client);
    new TracksArtistsCleanUp(client);
  }
}
