const BASE_URL = "https://api.spotify.com/v1";

export class SpotifyRequest {
  private token: string = "";
  private authorization: string = "";
  private nextRenew: number = 0;
  public stats: { requests: number; rateLimited: boolean } = {
    requests: 0,
    rateLimited: false,
  };

  constructor(private client: { clientId: string; clientSecret: string }) {
    this.authorization = `&client_id=${this.client.clientId}&client_secret=${this.client.clientSecret}`;
  }

  public async makeRequest<T>(endpoint: string, disableBaseUri: boolean = false): Promise<T> {
    await this.renew();

    const request = await fetch(
      disableBaseUri
        ? endpoint
        : `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`,
      {
        headers: { Authorization: this.token },
      }
    );

    if (!request.ok) {
      throw new Error(`Spotify API lỗi: ${request.status} ${request.statusText}`);
    }

    const text = await request.text();
    if (!text.trim()) {
      throw new Error("Spotify API trả về response rỗng");
    }

    const data = JSON.parse(text) as T;

    if (request.headers.get("x-ratelimit-remaining") === "0") {
      this.handleRateLimited(Number(request.headers.get("x-ratelimit-reset")) * 1000);
      throw new Error("Spotify API rate limited");
    }
    this.stats.requests++;

    return data;
  }

  private handleRateLimited(time: number): void {
    this.stats.rateLimited = true;
    setTimeout(() => {
      this.stats.rateLimited = false;
    }, time);
  }

  private async renewToken(): Promise<void> {
    const res = await fetch(
      `https://accounts.spotify.com/api/token?grant_type=client_credentials${this.authorization}`,
      {
        method: "POST",
        headers: {
          // Authorization: this.authorization,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Spotify token lỗi: ${res.status} ${res.statusText}`);
    }

    const text = await res.text();
    if (!text.trim()) {
      throw new Error("Spotify token API trả về response rỗng");
    }

    const { access_token, expires_in } = JSON.parse(text) as {
      access_token?: string;
      expires_in: number;
    };

    if (!access_token) throw new Error("Lấy access token thất bại do spotify client không hợp lệ");

    this.token = `Bearer ${access_token}`;
    this.nextRenew = Date.now() + expires_in * 1000;
  }

  private async renew(): Promise<void> {
    if (Date.now() >= this.nextRenew) {
      await this.renewToken();
    }
  }
}
