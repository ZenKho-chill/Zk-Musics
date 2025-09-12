import { Manager } from "../../manager.js";
import { Database } from "../../@types/Config.js";
import { PostgresDriver } from "zk.quick.db/PostgresDriver";
import { TableSetup } from "../setup/table.js";
import { keyChecker } from "../keyChecker.js";

export class PostgresConnectDriver {
  client: Manager;
  dbConfig: Database;
  constructor(client: Manager, dbConfig: Database) {
    this.client = client;
    this.dbConfig = dbConfig;
    this.connect();
  }

  async connect() {
    const sampleConfig = {
      host: "localhost",
      user: "root",
      password: "secret",
      database: "zk_music",
    };

    new keyChecker(this.client, this.dbConfig.config, sampleConfig, "postgres");

    const mysqlDriver = new PostgresDriver(this.dbConfig.config);

    new TableSetup(this.client, mysqlDriver, "Postgres");
  }
}
