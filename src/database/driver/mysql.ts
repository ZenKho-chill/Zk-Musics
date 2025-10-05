import { Manager } from "../../manager.js";
import { Database } from "../../@types/Config.js";
import { MySQLDriver } from "zk.quick.db/MySQLDriver";
import { TableSetup } from "../setup/table.js";
import { keyChecker } from "../keyChecker.js";
import { log } from "../../utilities/LoggerHelper.js";

export class MySQLConnectDriver {
  client: Manager;
  dbConfig: Database;
  constructor(client: Manager, dbConfig: Database) {
    this.client = client;
    this.dbConfig = dbConfig;
    this.connect();
  }

  connect() {
    const sampleConfig = {
      host: "localhost",
      user: "root",
      password: "secret",
      database: "zk_music",
    };

    new keyChecker(this.client, this.dbConfig.config, sampleConfig, "mysql");

    log.info("Initializing MySQL database driver", `Host: ${this.dbConfig.config.host}:${this.dbConfig.config.port}`);
    
    const mysqlDriver = new MySQLDriver(this.dbConfig.config);

    new TableSetup(this.client, mysqlDriver, "MySQL");
    
    log.info("MySQL database driver connected", "MySQL Driver ready");
  }
}
