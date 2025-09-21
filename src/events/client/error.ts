import { Manager } from "../../manager.js";
import { logError } from "../../utilities/Logger.js";

export default class {
  async execute(client: Manager, error: Error) {
    logError("ClientError", error);
  }
}
