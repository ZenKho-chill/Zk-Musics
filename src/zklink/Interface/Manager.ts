export type Constructor<T> = new (...args: any[]) => T;

export interface Structures {
  rest?: Constructor<>
}

export interface ZkslinkNodeOptions {
  name: string;
  host: string;
  port: number;
  auth: string;
  driver?: string;
}