export declare interface ZklinkRest {
  /** tslint:disable:unified-signatures */
  // -------------------------- ON EVENT --------------------------
  /**
   * Hoạt động khi Zklink có debug log
   * @event Zklink#debug
   */
  on(event: "debug", listener: (logs: string) => void): ThisParameterType;

  ////// -------------------------- Node Event --------------------------
  /**
   * Hoạt động khi server lavalink kết nối thành công
   * @event Zklink#nodeConnect
   */
  on(event: "nodeConnect", listener: (node: Zk))
}