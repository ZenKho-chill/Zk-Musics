export type LavalinkDataType = {
  host: string;
  port: number;
  pass: string;
  secure: boolean;
  name: string;
  online: boolean;
};

export type LavalinkUsingDataType = {
  host: string;
  port: number;
  pass: string;
  secure: boolean;
  name: string;
};

export type Headers = {
  "Client-Name": string;
  "User-Agent": string;
  Authorization: string;
  "User-Id": string;
  "Resume-Key": string;
};

// Helper function để tự động tạo headers với User-Id
export function createLavalinkHeaders(
  authorization: string, 
  userId?: string,
  clientName: string = "zkmusics/1.0.0 (https://github.com/ZenKho-chill/Zk-Musics)",
  userAgent: string = "zkmusic/1.0.0 (https://github.com/ZenKho-chill/Zk-Musics)",
  resumeKey: string = "zkmusic@1.0.0(https://github.com/ZenKho-chill/Zk-Musics)"
): Headers {
  return {
    "Client-Name": clientName,
    "User-Agent": userAgent,
    Authorization: authorization,
    "User-Id": userId || "unknown",
    "Resume-Key": resumeKey,
  };
}
