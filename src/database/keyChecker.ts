import { Manager } from "../manager.js";
import { log } from "../utilities/LoggerHelper.js";
import { KeyCheckerEnum } from "../@types/KeyChecker.js";
import utils from "node:util";

export class keyChecker {
  obj: Record<string, any>;
  sampleConfig: Record<string, any>;
  dbName: string;
  constructor(
    private client: Manager,
    obj: Record<string, any>,
    sampleConfig: Record<string, any>,
    dbName: string
  ) {
    this.dbName = dbName;
    this.obj = obj;
    this.sampleConfig = sampleConfig;
    this.execute();
  }

  execute() {
    const objReqKey = Object.keys(this.sampleConfig);
    const res = this.checkEngine();

    if (res == KeyCheckerEnum.Pass) return true;

    log.error("Database config không hợp lệ", `DB: ${this.dbName} - Config validation failed`);
    process.exit();
  }

  checkEngine() {
    const objKey = Object.keys(this.obj);
    const objReqKey = Object.keys(this.sampleConfig);
    const checkedKey: string[] = [];

    if (objReqKey.length > objKey.length) return KeyCheckerEnum.MissingKey;
    if (objReqKey.length < objKey.length) return KeyCheckerEnum.TooMuchKey;

    try {
      for (let i = 0; i < objKey.length; i++) {
        if (checkedKey.includes(objKey[i])) return KeyCheckerEnum.DuplicateKey;
        if (!(objKey[i] in this.sampleConfig)) return KeyCheckerEnum.InvalidKey;
        checkedKey.push(objKey[i]);
      }
    } finally {
      checkedKey.length = 0;
      return KeyCheckerEnum.Pass;
    }
  }
}
