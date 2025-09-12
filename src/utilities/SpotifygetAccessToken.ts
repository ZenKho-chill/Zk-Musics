import { Manager } from "../manager.js";
import axios from "axios";

export async function SpotifygetAccessToken(client: Manager): Promise<string | null> {
  const CLIENT_ID = client.config.lavalink.SPOTIFY.id;
  const CLIENT_SECRET = client.config.lavalink.SPOTIFY.secret;

  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "client_credentials",
      }),
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data.access_token;
  } catch (error) {
    client.logger.warn(SpotifygetAccessToken.name, `Lỗi khi lấy access token từ Spotify: ${error}`);
    return null;
  }
}
