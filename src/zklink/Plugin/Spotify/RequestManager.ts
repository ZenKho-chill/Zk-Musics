import { SpotifyOptions } from "./Plugin.js";
import { SpotifyRequest } from "./SpotifyRequest.js";
import { logWarn } from "../../../utilities/Logger.js";

export class RequestManager {
  private requests: SpotifyRequest[] = [];
  private readonly mode: "single" | "multi" = "single";

  constructor(private options: SpotifyOptions) {
    if (options.clients?.length) {
      for (const client of options.clients) this.requests.push(new SpotifyRequest(client));
      this.mode = "multi";
      // eslint-disable-next-line no-console
      logWarn(
        "Tất cả yêu cầu đã bị giới hạn tốc độ",
        "Tất cả yêu cầu đã bị giới hạn tốc độ"
      );
    } else {
      this.requests.push(
        new SpotifyRequest({
          clientId: options.clientId,
          clientSecret: options.clientSecret,
        })
      );
    }
  }

  public async makeRequest<T>(
    endpoint: string,
    disableBaseUri: boolean = false,
    tries: number = 3
  ): Promise<T> {
    if (this.mode === "single") return this.requests[0].makeRequest<T>(endpoint, disableBaseUri);

    const targetRequest = this.getLeastUsedRequest();
    if (!targetRequest) throw new Error("Tất cả yêu cầu đã bị giới hạn tốc độ");
    return targetRequest
      .makeRequest<T>(endpoint, disableBaseUri)
      .catch((e) =>
        e.message === "Rate limited by spotify" && tries
          ? this.makeRequest<T>(endpoint, disableBaseUri, tries - 1)
          : Promise.reject(e)
      );
  }

  protected getLeastUsedRequest(): SpotifyRequest | undefined {
    const targetSearch = this.requests.filter((request) => !request.stats.rateLimited);
    if (!targetSearch.length) return undefined;

    return targetSearch.sort((a, b) => a.stats.requests - b.stats.requests)[0];
  }
}
