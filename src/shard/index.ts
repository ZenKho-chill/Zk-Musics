import { ConfigData } from "../services/ConfigData.js";
import { ClusterManager } from "./ClusterManager.js";

const configData = ConfigData.getInstance().data;

configData.bot.SHARDING_SYSTEM;

const manager = new ClusterManager(configData.bot.SHARDING_SYSTEM);

manager.start();
