import { Manager } from "../manager.js";
import {
  Library,
  Plugin,
  Zklink,
  ZklinkAdditionalOptions,
  ZklinkPlugin,
} from "../Zklink/main.js";

export class ZklinkInit {
  client: Manager;
  constructor(client: Manager) {
    this.client = client;
  }

  get init(): Zklink {
    return new Zklink({
      library: new Library.DiscordJS(this.client),
      nodes: this.client.config.lavalink.NODES,
      plugins: this.plugins,
      options: this.client.config.features.AUTOFIX_LAVALINK.enable
        ? this.autofixConfig
        : this.defaultConfig,
    });
  }

  get defaultConfig(): ZklinkAdditionalOptions {
    return {
      resume: true,
      resumeTimeout: 600,
      retryCount: Infinity,
      defaultSearchEngine: "apple",
      retryTimeout: 3000,
      searchFallback: {
        enable: true,
        engine: "spotify",
      },
    };
  }

  get autofixConfig(): ZklinkAdditionalOptions {
    return {
      retryCount: this.client.config.features.AUTOFIX_LAVALINK.retryCount,
      retryTimeout: this.client.config.features.AUTOFIX_LAVALINK.retryTimeout,
      defaultSearchEngine: this.client.config.features.AUTOFIX_LAVALINK.defaultSearchEngine,
    };
  }

  get plugins(): ZklinkPlugin[] {
    const defaultPlugins: ZklinkPlugin[] = [
      new Plugin.Deezer(),
      new Plugin.Nico({ searchLimit: 10 }),
      new Plugin.Apple({ countryCode: "us" }),
    ];

    if (this.client.config.features.CONVERT_LINK.Enable)
      defaultPlugins.push(
        new Plugin.YoutubeConverter({
          sources: [this.client.config.features.CONVERT_LINK.Engine || "scsearch"],
        })
      );

    if (this.client.config.lavalink.SPOTIFY.enable)
      defaultPlugins.push(
        new Plugin.Spotify({
          clientId: this.client.config.lavalink.SPOTIFY.id,
          clientSecret: this.client.config.lavalink.SPOTIFY.secret,
          playlistPageLimit: 1,
          albumPageLimit: 1,
          searchLimit: 10,
        })
      );

    return defaultPlugins;
  }
}