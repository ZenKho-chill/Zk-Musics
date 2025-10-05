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
      
      log.info("Khởi tạo database service", `Driver: ${databaseConfig.driver}`);

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
          log.warn("Database driver không xác định, sử dụng JSON", `Driver: ${databaseConfig.driver}`);
          new JSONConnectDriver(this.client, databaseConfig);
          break;
      }
      
      log.info("DatabaseService khởi tạo thành công", `Using ${databaseConfig.driver} driver`);
    } catch (error) {
      log.error("Lỗi khởi tạo DatabaseService", "Database initialization failed", error as Error);
      return;
    }
  }
}
