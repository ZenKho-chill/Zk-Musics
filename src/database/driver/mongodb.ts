import { Manager } from "../../manager.js";
import { Database } from "../../@types/Config.js";
import { MongoDriver } from "zk.quick.db/MongoDriver";
import { TableSetup } from "../setup/table.js";
import { keyChecker } from "../keyChecker.js";
import { log } from "../../utilities/LoggerHelper.js";

export class MongoConnectDriver {
  client: Manager;
  dbConfig: Database;
  constructor(client: Manager, dbConfig: Database) {
    this.client = client;
    this.dbConfig = dbConfig;
    this.connect();
  }

  connect() {
    const sampleConfig = {
      uri: "mongodb://127.0.0.1:27017/zk-music",
    };

    new keyChecker(this.client, this.dbConfig.config, sampleConfig, "mongodb");

    log.info("Initializing MongoDB database driver", `URI: ${this.dbConfig.config.uri.split('@')[0]}@***`);
    
    const mongoDriver = new MongoDriver(this.dbConfig.config.uri);

    new TableSetup(this.client, mongoDriver, "MongoDB");
    
    log.info("MongoDB database driver connected", "MongoDB Driver ready");
  }
}
