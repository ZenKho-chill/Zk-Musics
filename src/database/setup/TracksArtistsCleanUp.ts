import { Manager } from "../../manager.js";
import cron from "node-cron";

export class TracksArtistsCleanUp {
  client: Manager;

  constructor(client: Manager) {
    this.client = client;
    this.execute();
  }

  async execute() {
    // Lên lịch xóa dữ liệu top tracks và top artists mỗi 25 ngày
    cron.schedule("5 0 25 * *", async () => {
      this.client.logger.info(
        TracksArtistsCleanUp.name,
        "Đang chạy tác vụ theo lịch để xóa top tracks và top artists"
      );
      await this.TracksArtistsCleanUp();
    });
  }

  async TracksArtistsCleanUp() {
    try {
      // Xóa tất cả dữ liệu từ TopTrack
      await this.client.db.TopTrack.deleteAll();
      this.client.logger.info(
        TracksArtistsCleanUp.name,
        "Đã xóa tất cả dữ liệu TopTrack."
      );

      // Xóa tất cả dữ liệu từ TopArtist
      await this.client.db.TopArtist.deleteAll();
      this.client.logger.info(
        TracksArtistsCleanUp.name,
        "Đã xóa tất cả dữ liệu TopArtist."
      );
    } catch (error) {
      this.client.logger.error(
        TracksArtistsCleanUp.name,
        "Xóa dữ liệu TopTrack và TopArtist thất bại: " + error
      );
    }
  }
}
