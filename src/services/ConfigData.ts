import { load } from "js-yaml";
import { YAMLConfigParse } from "./YAMLConfigParse.js";
import { config } from "dotenv";
import { Config } from "../@types/Config.js";
config();

export class ConfigData {
  get data() {
    const yaml_files = load(new YAMLConfigParse("./config.yml").execute()) as Config;
    const old_data = load(new YAMLConfigParse("./config.yml").execute()) as Config;

    const res = yaml_files;

    if (old_data.features && old_data.features.DATABASE && old_data.features.DATABASE.config) {
      res.features.DATABASE.config = old_data.features.DATABASE.config;
    }

    if (process.env.DOCKER_COMPOSE_MODE) {
      // Thay đổi thông tin lavalink khi chạy trong Docker Compose
      const lavalink_changedata = res.lavalink.NODES[0];
      lavalink_changedata.host = String(process.env.NODE_HOST);
      lavalink_changedata.port = Number(process.env.NODE_PORT);
      lavalink_changedata.name = "node_1";
      lavalink_changedata.auth = String(process.env.NODE_AUTH);
      lavalink_changedata.secure = false;

      if (process.env.DOCKER_COMPOSE_DATABASE) {
        // Thay đổi cấu hình database khi sử dụng Docker Compose
        const db_chnagedata = res.features.DATABASE;
        if (db_chnagedata.driver == "mongodb") {
          db_chnagedata.config.uri = String(process.env.MONGO_URI);
        }
      }
    }

    return res;
  }

  checkConfig(res?: Config) {
    if (!res)
      throw new Error(
        "File cấu hình không chứa dữ liệu, vui lòng kiểm tra file config.example.yml để tham khảo"
      );
    if (!res.bot)
      throw new Error(
        "File cấu hình không chứa trường bot, vui lòng kiểm tra file config.example.yml để tham khảo"
      );
    if (!res.lavalink)
      throw new Error(
        "File cấu hình không chứa trường lavalink, vui lòng kiểm tra file config.example.yml để tham khảo"
      );
    if (!res.bot.OWNER_ID)
      throw new Error(
        "File cấu hình không chứa OWNER_ID, vui lòng kiểm tra file config.example.yml để tham khảo"
      );
    if (!res.bot.TOKEN || res.bot.TOKEN.length == 0)
      throw new Error(
        "File cấu hình không chứa TOKEN, vui lòng kiểm tra file config.example.yml để tham khảo"
      );
    if (!Array.isArray(res.bot.TOKEN))
      throw new Error(
        "Trường TOKEN phải là một mảng, vui lòng kiểm tra file config.example.yml để tham khảo"
      );
    if (!res.lavalink.NODES || res.lavalink.NODES.length == 0)
      throw new Error(
        "File cấu hình không chứa NODES, vui lòng kiểm tra file config.example.yml để tham khảo"
      );
  }

  // Modded from:
  // https://github.com/shipgirlproject/Shoukaku/blob/2677ecdf123ffef1c254c2113c5342b250ac4396/src/Utils.ts#L9-L23
  mergeDefault<T extends { [key: string]: any }>(def: T, given: T): Required<T> {
    if (!given) return def as Required<T>;
    const defaultKeys: (keyof T)[] = Object.keys(def);
    for (const key in given) {
      if (defaultKeys.includes(key)) continue;
      if (this.isNumber(key)) continue;
      delete given[key];
    }
    for (const key of defaultKeys) {
      if (Array.isArray(given[key]) && given[key].length == 0) given[key] = def[key];
      if (def[key] === null || (typeof def[key] === "string" && def[key].length === 0)) {
        if (!given[key]) given[key] = def[key];
      }
      if (given[key] === null || given[key] === undefined) given[key] = def[key];
      if (typeof given[key] === "object" && given[key] !== null) {
        this.mergeDefault(def[key], given[key]);
      }
      if (typeof given[key] !== typeof def[key]) if (!given[key]) given[key] = def[key];
    }
    return given as Required<T>;
  }

  isNumber(data: string): boolean {
    return /^[+-]?\d+(\.\d+)?$/.test(data);
  }
}
