import { Manager } from "../manager.js";
import { LavalinkDataType } from "../@types/Lavalink.js";
import { CheckLavalinkServer } from "./CheckLavalinkServer.js";
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
    // Log đã bị xóa - Bắt đầu tự sửa lavalink
    if (this.client.lavalinkList.length == 0) {
      new CheckLavalinkServer(this.client);
      return this.fixLavalink();
    } else return this.fixLavalink();
  }

  async fixLavalink() {
    const autofixError = chalk.hex("#e12885");
    const autofixErrorMess = autofixError("Lỗi: ");

    this.checkLavalink();
    await this.removeCurrentLavalink();
    if (this.client.lavalinkList.filter((i) => i.online).length == 0) {
      // Log đã bị xóa - Error không có lavalink trực tuyến
      // Log đã bị xóa - Error vui lòng tắt bot và nhập server lavalink hợp lệ
      // Log đã bị xóa - Đã kết thúc autofix lavalink
      return;
    }

    await this.applyNewLavalink();

    // Log đã bị xóa - Đã chuyển sang lavalink mới, vui lòng chờ 3 giây
    // Log đã bị xóa - Đã kết thúc autofix lavalink
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
      // Log đã bị xóa - Cảnh báo không tìm thấy node lavalink
      return;
    }

    const targetLavalink = this.client.lavalinkUsing[lavalinkIndex];

    // Đảm bảo targetLavalink được định nghĩa trước khi tiếp tục
    if (!targetLavalink) {
      // Log đã bị xóa - Cảnh báo node lavalink mục tiêu không xác định
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
