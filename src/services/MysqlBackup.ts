import { Manager } from "../manager.js";
import mysqldumpModule from "mysqldump";
import cron from "node-cron";
import { log } from "../utilities/LoggerHelper.js";


const mysqldump = mysqldumpModule.default;

export default class MysqlBackupService {
  async execute(client: Manager) {
    cron.schedule(
      client.config.features.DATABASE.MYSQLBACKUP.Schedule,
      async () => {
        if (!client.config.features.DATABASE.MYSQLBACKUP.ChannelId) return;

        const { host, user, password, database } = client.config.features.DATABASE.config;
        const formatDate = (date) => {
          const day = String(date.getDate()).padStart(2, "0");
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const year = date.getFullYear();
          return `${day}-${month}-${year}`;
        };

        const timestamp = formatDate(new Date());
        const backupFileName = `${database}-${timestamp}.sql`;

        const dump = await mysqldump({
          connection: {
            host,
            user,
            password,
            database,
          },
        });

        if (!dump || !dump.dump) {
          log.warn("Cảnh báo dump rỗng hoặc không hợp lệ", `Database: ${database}`);
          return;
        }

        const channel = await client.channels
          .fetch(client.config.features.DATABASE.MYSQLBACKUP.ChannelId)
          .catch(() => undefined);

        if (channel && channel.isTextBased()) {
          await channel.send({
            content: `Đây là bản sao lưu mới nhất cho cơ sở dữ liệu \`${database}\` vào \`${timestamp}\`:`,
            files: [
              {
                attachment: Buffer.from(dump.dump.schema + dump.dump.data),
                name: backupFileName,
              },
            ],
          });
          log.info("File sao lưu đã được gửi tới kênh Discord", `DB: ${database} | File: ${backupFileName}`);
        } else {
          log.warn("Cảnh báo ID kênh không hợp lệ", `Channel ID: ${client.config.features.DATABASE.MYSQLBACKUP.ChannelId}`);
        }
      },
      {
        timezone: client.config.features.DATABASE.MYSQLBACKUP.Timezone,
      }
    );
  }
}
