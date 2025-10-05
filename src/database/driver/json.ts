import { Manager } from "../../manager.js";
import { JSONDriver } from "zk.quick.db/JSONDriver";
import { Database } from "../../@types/Config.js";
import { TableSetup } from "../setup/table.js";
import { keyChecker } from "../keyChecker.js";
import { log } from "../../utilities/LoggerHelper.js";

export class JSONConnectDriver {
  client: Manager;
  dbConfig: Database;
  constructor(client: Manager, dbConfig: Database) {
    this.client = client;
    this.dbConfig = dbConfig;
    this.connect();
  }

  connect() {
    const sampleConfig = {
      path: "./zk.database.json",
    };

    log.info("Initializing JSON database driver", `Path: ${this.dbConfig.config.path}`);
    
    new keyChecker(this.client, this.dbConfig.config, sampleConfig, "json");

    const jsonDriver = new JSONDriver(this.dbConfig.config.path);

    new TableSetup(this.client, jsonDriver, "JSON");
    
    log.info("JSON database driver connected", "JSON Driver ready");
  }
}
