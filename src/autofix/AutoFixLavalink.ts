import { Manager } from "../manager.js";
import { LavalinkDataType } from "../@types/Lavalink.js";
import { CheckLavalinkServer } from "./CheckLavalinkServer.js";
import { log } from "../utilities/LoggerHelper.js";
import chalk from "chalk";


export class AutoFixLavalink {
  client: Manager;
  lavalinkName: string;
  constructor(client: Manager, lavalinkName: string) {
    this.client = client;
    this.lavalinkName = lavalinkName;
    this.execute();
  }

  async execute() {
    log.info("Autofix Lavalink", `Mục tiêu: ${this.lavalinkName}`);
    if (this.client.lavalinkList.length == 0) {
      new CheckLavalinkServer(this.client);
      return this.fixLavalink();
    } else return this.fixLavalink();
  }

  async fixLavalink() {
    const autofixError = chalk.hex("#e12885");

    this.checkLavalink();
    await this.removeCurrentLavalink();
    if (this.client.lavalinkList.filter((i) => i.online).length == 0) {
      log.error("Autofix Lavalink thất bại", "Không có server Lavalink");
      log.warn("Autofix Lavalink không thể tiếp tục hoạt động", "Vui lòng tắt bot và kiểm tra danh sách lavalink");
      log.warn("Tắt Autofix Lavalink");
      return;
    }

    await this.applyNewLavalink();

    log.info("Đổi server lavalink", "Đang đổi server lavalink mới, vui lòng chờ...");
    log.info("Autofix lavalink hoàn thành");
  }

  checkLavalink() {
    if (this.client.Zklink.nodes.size !== 0 && this.client.lavalinkUsing.length == 0) {
      this.client.Zklink.nodes.forEach((data, index) => {
        this.client.lavalinkUsing.push({
          host: data.options.host,
          port: data.options.port,
          pass: data.options.auth,
          secure: data.options.secure,
          name: index,
        });
      });
    }
  }

  async removeCurrentLavalink() {
    const lavalinkIndex = this.client.lavalinkUsing.findIndex(
      (data) => data.name == this.lavalinkName
    );

    // Kiểm tra xem lavalinkIndex có hợp lệ không
    if (lavalinkIndex === -1) {
      log.warn("Lavalink Node", `Không tìm thấy server: ${this.lavalinkName}`);
      return;
    }

    const targetLavalink = this.client.lavalinkUsing[lavalinkIndex];

    // Đảm bảo targetLavalink được định nghĩa trước khi tiếp tục
    if (!targetLavalink) {
      log.warn("Lavalink node", `Server không xác định: ${lavalinkIndex}`);
      return;
    }

    // Logic xóa lavalink khỏi nodes
    if (this.client.Zklink.nodes.size == 0 && this.client.lavalinkUsing.length != 0) {
      this.client.lavalinkUsing.splice(lavalinkIndex, 1);
    } else if (this.client.Zklink.nodes.size !== 0 && this.client.lavalinkUsing.length !== 0) {
      const isLavalinkExist = this.client.Zklink.nodes.get(targetLavalink.name);
      if (isLavalinkExist) {
        this.client.Zklink.nodes.remove(targetLavalink.name);
      }
      this.client.lavalinkUsing.splice(lavalinkIndex, 1);
    }
  }

  async applyNewLavalink() {
    const onlineList: LavalinkDataType[] = [];

    this.client.lavalinkList.filter(async (data) => {
      if (data.online == true) return onlineList.push(data);
    });

    const nodeInfo = onlineList[Math.floor(Math.random() * onlineList.length)];

    this.client.Zklink.nodes.add({
      port: nodeInfo.port,
      host: nodeInfo.host,
      auth: nodeInfo.pass,
      name: nodeInfo.name,
      secure: nodeInfo.secure,
    });

    return nodeInfo;
  }
}
