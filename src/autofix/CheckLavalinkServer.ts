import { Manager } from "../manager.js";
import { Headers, LavalinkDataType } from "../@types/Lavalink.js";
import { GetLavalinkServer } from "./GetLavalinkServer.js";
import { ZklinkWebsocket } from "../Zklink/main.js";

import { LavalinkHeaderHelper } from "../utilities/LavalinkHeaderHelper.js";

export class CheckLavalinkServer {
  client: Manager;
  constructor(client: Manager) {
    this.client = client;
    this.execute();
  }

  async execute() {
    // Log đã bị xóa - Đang kiểm tra server lavalink cho autofix

    const getLavalinkServerClass = new GetLavalinkServer();

    const lavalink_data: LavalinkDataType[] = await getLavalinkServerClass.execute();

    if (this.client.lavalinkList.length !== 0) this.client.lavalinkList.length = 0;

    lavalink_data.forEach((config) => {
      // Sử dụng LavalinkHeaderHelper để tự động tạo headers với User-Id
      const { headers, debug } = LavalinkHeaderHelper.createHeadersWithDebug(config.pass);
      
      // Log đã bị xóa - Debug thông tin về nguồn User-Id
      // Log đã bị xóa - Debug tự động lấy User-Id

      const url = `ws://${config.host}:${config.port}/v4/websocket`;

      this.checkServerStatus(url, headers)
        .then(() => {
          this.client.lavalinkList.push({
            host: config.host,
            port: config.port,
            pass: config.pass,
            secure: config.secure,
            name: `${config.host}`,
            online: true,
          });
        })
        .catch(() => {
          this.client.lavalinkList.push({
            host: config.host,
            port: config.port,
            pass: config.pass,
            secure: config.secure,
            name: `${config.host}`,
            online: false,
          });
        });
    });
  }

  checkServerStatus(url: string, headers: Headers) {
    return new Promise((resolve, reject) => {
      const ws = new ZklinkWebsocket(url, { headers });
      ws.on("open", () => {
        resolve(true);
        ws.close();
      });
      ws.on("error", (e) => reject(e));
    });
  }
}
