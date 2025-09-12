import { Worker } from "node:cluster";
import { ClusterManager } from "../shard/ClusterManager.js";

export interface ClusterManagerOptions {
  shardsPerClusters: number;
  totalClusters: number;
}

export interface WorkerMessage {
  cmd: string;
  args: Record<string, unknown>;
}

export interface WorkerResponse {
  response: unknown;
}

export abstract class ClusterCommand {
  public get name(): string {
    throw new Error(`Lệnh này chưa có tên`);
  }

  public async execute(
    manager: ClusterManager,
    worker: Worker,
    message: WorkerMessage
  ): Promise<WorkerResponse> {
    throw new Error(`Lệnh này chưa có hàm execute`);
  }
}
