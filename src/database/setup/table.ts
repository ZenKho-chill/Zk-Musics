import { IDriver, QuickDB } from "zk.quick.db";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { Manager } from "../../manager.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { Handler } from "../handler.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
// Định nghĩa schema
import { AutoReconnect } from "../schema/AutoReconnect.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { Playlist } from "../schema/Playlist.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { Code } from "../schema/Code.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { Premium } from "../schema/Premium.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { Setup } from "../schema/Setup.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { Language } from "../schema/Language.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { Prefix } from "../schema/Prefix.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { ControlButton } from "../schema/ControlButton.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { QuickDatabasePlus } from "../../structures/QuickDatabasePlus.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { BlacklistUser } from "../schema/BlacklistUser.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { BlacklistGuild } from "../schema/BlacklistGuild.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { Maintenance } from "../schema/Maintenanc.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { Themes } from "../schema/Themes.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { Votes } from "../schema/Votes.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { CommandGlobalUsage } from "../schema/CommandGlobalUsage.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { CommandUserUsage } from "../schema/CommandUserUsage.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { PlayedSongUser } from "../schema/PlayedSongUser.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { PlayedSongGuild } from "../schema/PlayedSongGuild.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { PlayedSongGlobal } from "../schema/PlayedSongGlobal.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { LastFm } from "../schema/LastFm.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { SpotifyId } from "../schema/SpotifyId.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { VoteReminders } from "../schema/VoteReminders.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { TopTrack } from "../schema/TopTrack.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { TopArtist } from "../schema/TopArtist.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { TempVoiceChannel } from "../schema/TempVoiceChannel.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { TempVoiceChannelSetting } from "../schema/TempVoiceChannelSetting.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";
import { UserStatistics } from "../schema/UserStatistics.js";
import { logDebug, logInfo, logWarn, logError } from "../../utilities/Logger.js";

export class TableSetup {
  client: Manager;
  driver: IDriver;
  driverName: string;
  constructor(client: Manager, driver: IDriver, driverName: string) {
    this.client = client;
    this.driver = driver;
    this.driverName = driverName;
    this.register();
  }

  async register() {
    const baseDB = new QuickDatabasePlus(this.client.config.features.DATABASE.ClearCache, {
      driver: this.driver,
    });
    const start = Date.now();
    await baseDB.init();
    const end = Date.now();

    this.logInfo(
      "DatabaseService",
      `Đã kết nối tới cơ sở dữ liệu! [${this.driverName}] [${end - start}ms]`
    );

    this.client.db = {
      autoreconnect: await baseDB.table<AutoReconnect>("autoreconnect"),
      playlist: await baseDB.table<Playlist>("playlist"),
      code: await baseDB.table<Code>("code"),
      premium: await baseDB.table<Premium>("premium"),
      setup: await baseDB.table<Setup>("setup"),
      language: await baseDB.table<Language>("language"),
      prefix: await baseDB.table<Prefix>("prefix"),
      ControlButton: await baseDB.table<ControlButton>("ControlButton"),
      preGuild: await baseDB.table<Premium>("preGuild"),
      BlacklistUser: await baseDB.table<BlacklistUser>("BlacklistUser"),
      BlacklistGuild: await baseDB.table<BlacklistGuild>("BlacklistGuild"),
      maintenance: await baseDB.table<Maintenance>("maintenance"),
      Themes: await baseDB.table<Themes>("Themes"),
      votes: await baseDB.table<Votes>("votes"),
      CommandGlobalUsage: await baseDB.table<CommandGlobalUsage>("CommandGlobalUsage"),
      CommandUserUsage: await baseDB.table<CommandUserUsage>("CommandUserUsage"),
      PlayedSongUser: await baseDB.table<PlayedSongUser>("PlayedSongUser"),
      PlayedSongGuild: await baseDB.table<PlayedSongGuild>("PlayedSongGuild"),
      PlayedSongGlobal: await baseDB.table<PlayedSongGlobal>("PlayedSongGlobal"),
      LastFm: await baseDB.table<LastFm>("LastFm"),
      SpotifyId: await baseDB.table<SpotifyId>("SpotifyId"),
      VoteReminders: await baseDB.table<VoteReminders>("VoteReminders"),
      TopTrack: await baseDB.table<TopTrack>("TopTrack"),
      TopArtist: await baseDB.table<TopArtist>("TopArtist"),
      TempVoiceChannel: await baseDB.table<TempVoiceChannel>("TempVoiceChannel"),
      TempVoiceChannelSetting:
        await baseDB.table<TempVoiceChannelSetting>("TempVoiceChannelSetting"),
      UserStatistics: await baseDB.table<UserStatistics>("UserStatistics"),
    };

    this.client.isDatabaseConnected = true;
    new Handler(this.client);
  }
}
