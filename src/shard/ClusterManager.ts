import cluster, { Worker } from "node:cluster";
import process from "node:process";
import { config } from "dotenv";
import { bootBot } from "./bootloader.js";
import pidusage, { Status } from "pidusage";
import { Collection } from "../structures/Collection.js";
import readdirRecursive from "recursive-readdir";
import { resolve } from "path";
import { join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { ClusterCommand, WorkerResponse } from "../@types/Cluster.js";
import { logInfo, logDebug, logWarn, logError } from "../utilities/Logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config();

export interface ClusterManagerOptions {
  shardsPerClusters: number;
  totalClusters: number;
}

export class ClusterManager {
  public readonly workerPID: Collection<Worker> = new Collection<Worker>();
  public readonly commands: Collection<ClusterCommand> = new Collection<ClusterCommand>();
  public readonly clusterShardList: Record<string, number[]> = {};
  public readonly totalShards: number = 0;
  public customData?: {
    id: number;
    shard: number[];
    shardCount: number;
  };

  constructor(public readonly options: ClusterManagerOptions) {
    this.totalShards = this.options.totalClusters * this.options.shardsPerClusters;
    const shardArrayID = this.arrayRange(0, this.totalShards - 1, 1);

    // Sửa lỗi: đảm bảo shard được phân chia đúng cho mỗi cluster
    this.arrayChunk<number>(shardArrayID, this.options.shardsPerClusters).forEach(
      (value, index) => {
        this.clusterShardList[String(index + 1)] = value;
      }
    );

    logInfo("ClusterManager", `Tổng cluster: ${this.options.totalClusters}, Tổng shard: ${this.totalShards}`);
  }

  public async start() {
    if (cluster.isPrimary) {
      this.log("INFO", `Process chính ${process.pid} đang chạy`);

      await this.commandLoader();

      cluster.on("exit", (worker) => {
        this.log(
          "WARN",
          `Worker ${worker.process.pid} / ${worker.id} đã chết, đang khởi động lại...`
        );
        const newWorker = cluster.fork();
        this.workerPID.set(String(newWorker.id), newWorker);
      });

      cluster.on("message", async (worker, message) => {
        try {
          const jsonMsg = JSON.parse(message);
          const command = this.commands.get(jsonMsg.cmd);
          if (!command) {
            return worker.send(
              JSON.stringify({
                error: { code: 404, message: "Không tìm thấy lệnh!" },
              })
            );
          }

          // Sửa lỗi: đảm bảo chỉ một worker xử lý tương tác
          if (jsonMsg.args.interaction && jsonMsg.args.interaction.guild) {
            const guildShardId = jsonMsg.args.interaction.guild.shardId;
            const assignedWorker = this.getWorkerForShard(guildShardId);

            if (assignedWorker !== worker.id) {
              return;
            }
          }

          const getRes = await command.execute(this, worker, jsonMsg.args);
          worker.send(JSON.stringify(getRes));
        } catch (err) {
          this.log("ERROR", `Xử lý message thất bại: ${err}`);
        }
      });

      for (let i = 0; i < this.options.totalClusters; i++) {
        const worker = cluster.fork();
        this.workerPID.set(String(worker.id), worker);
      }
    } else {
      bootBot(this);
      this.log("INFO", `Worker ${process.pid} / ${cluster.worker.id} đã khởi động`);
    }
  }

  public getWorkerForShard(shardId: number): number | null {
    for (const [clusterId, shards] of Object.entries(this.clusterShardList)) {
      if (shards.includes(shardId)) {
        return parseInt(clusterId, 10);
      }
    }
    return null;
  }

  public getWorkerInfo(clusterId: number) {
    return this.workerPID.get(String(clusterId));
  }

  public async getWorkerStatus(clusterId: number): Promise<Status | null> {
    const workerData = this.workerPID.get(String(clusterId));
    if (!workerData) return null;
    return new Promise((resolve, reject) =>
      pidusage(workerData.process.pid, function (err, stats) {
        if (err) reject(null);
        resolve(stats);
      })
    );
  }

  public getShard(clusterId: number) {
    return this.clusterShardList[String(clusterId)];
  }

  public async sendMaster(
    cmd: string,
    args: Record<string, unknown> = {}
  ): Promise<WorkerResponse> {
    return new Promise((resolve, reject) => {
      const fullData = { cmd, args };
      cluster.worker.on("message", (message) => {
        try {
          const jsonMsg = JSON.parse(message);
          if (jsonMsg.error) return reject(null);
          resolve(jsonMsg);
        } catch (err) {
          reject(null);
        }
      });
      cluster.worker.send(JSON.stringify(fullData));
    });
  }

  protected arrayRange(start: number, stop: number, step: number) {
    return Array.from({ length: (stop - start) / step + 1 }, (_, index) => start + index * step);
  }

  protected arrayChunk<D = unknown>(array: D[], chunkSize: number): D[][] {
    return array.reduce((chunks, item, index) => {
      const chunkIndex = Math.floor(index / chunkSize);
      if (!chunks[chunkIndex]) {
        chunks[chunkIndex] = [];
      }
      chunks[chunkIndex].push(item);
      return chunks;
    }, [] as D[][]);
  }

  public log(level: string, msg: string, pad: number = 9) {
    const date = new Date().toISOString();
    const prettyLevel = level.toUpperCase().padEnd(pad);
    const prettyClass = "ClusterManager".padEnd(28);
    // Sử dụng logger mới thay vì console.log
    switch (level.toLowerCase()) {
      case "info":
        logInfo("ClusterManager", msg);
        break;
      case "debug":
        logDebug("ClusterManager", msg);
        break;
      case "warn":
        logWarn("ClusterManager", msg);
        break;
      case "error":
        logError("ClusterManager", msg);
        break;
      default:
        logInfo("ClusterManager", msg);
    }
  }

  protected async commandLoader() {
    let eventsPath = resolve(join(__dirname, "commands"));
    let eventsFile = await readdirRecursive(eventsPath);

    for await (const path of eventsFile) {
      await this.registerCommand(path);
    }

    this.log("INFO", `Đã nạp lệnh cluster thành công`);
  }

  protected async registerCommand(path: string) {
    const command = new (await import(pathToFileURL(path).toString())).default() as ClusterCommand;

    if (!command.execute) {
      return this.log("WARN", `Lệnh cluster [${command.name}] thiếu hàm execute, bỏ qua...`);
    }

    this.commands.set(command.name, command);
  }
}
