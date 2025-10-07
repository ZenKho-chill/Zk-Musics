import { MongoConnectDriver } from "./driver/mongodb.js";
import { JSONConnectDriver } from "./driver/json.js";
import { MySQLConnectDriver } from "./driver/mysql.js";
import { Manager } from "../manager.js";
import { PostgresConnectDriver } from "./driver/postgres.js";
import { log } from "../utilities/LoggerHelper.js";

export class DatabaseService {
  client: Manager;
  constructor(client: Manager) {
    this.client = client;
    this.execute();
  }

  async execute() {
    try {
      const databaseConfig = this.client.config.features.DATABASE;
      
      log.info("Database", `Driver: ${databaseConfig.driver}`);

      switch (databaseConfig.driver) {
        case "json":
          new JSONConnectDriver(this.client, databaseConfig);
          break;
        case "mongodb":
          new MongoConnectDriver(this.client, databaseConfig);
          break;
        case "mysql":
          new MySQLConnectDriver(this.client, databaseConfig);
          break;
        case "postgres":
          new PostgresConnectDriver(this.client, databaseConfig);
          break;
        default:
          log.warn("Database", `Không xác định, sử dụng json`);
          new JSONConnectDriver(this.client, databaseConfig);
          break;
      }
      
      log.info("Database", `Sử dụng ${databaseConfig.driver}`);
    } catch (error) {
      log.error("Database", `Khởi tạo hệ thống database thất bại | ${error as Error}`);
      return;
    }
  }
}
