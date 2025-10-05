import { Manager } from "../../manager.js";
import cron from "node-cron";
// Log đã bị xóa - import Logger functions

export class TracksArtistsCleanUp {
  client: Manager;

  constructor(client: Manager) {
    this.client = client;
    this.execute();
  }

  async execute() {
    // Lên lịch xóa dữ liệu top tracks và top artists mỗi 25 ngày
    cron.schedule("5 0 25 * *", async () => {
      // Log đã bị xóa - Đang chạy tác vụ theo lịch để xóa top tracks và top artists
      await this.TracksArtistsCleanUp();
    });
  }

  async TracksArtistsCleanUp() {
    try {
      // Xóa tất cả dữ liệu từ TopTrack
      await this.client.db.TopTrack.deleteAll();
      // Log đã bị xóa - Đã xóa tất cả dữ liệu TopTrack

      // Xóa tất cả dữ liệu từ TopArtist
      await this.client.db.TopArtist.deleteAll();
      // Log đã bị xóa - Đã xóa tất cả dữ liệu TopArtist
    } catch (error) {
      // Log đã bị xóa - Xóa dữ liệu TopTrack và TopArtist thất bại
    }
  }
}
