import { REST } from 'discord.js';
import { Routes } from 'discord-api-types/v10';
import fs from 'fs';
import _ from 'lodash';
import  { config } from 'dotenv';
import { load } from 'js-yaml';
config();

class removeSlash {
  constructor() {
    this.execute();
  }

  async execute() {
    const configData = this.ConfigData;
    const rest = new REST({ version: '10' }).setToken(configData.bot.TOKEN);
    const client = await rest.get(Routes.user());

    rest
      .put(Routes.applicationCommands(client.id), { body: [] })
      .then(() => console.log('Xóa thành công tất cả lệnh slash!'))
      .catch(console.error);
  }

  get ConfigData() {
    const yaml_files = this.YAMLPraseServices('./config.yml');

    let doc;

    const res = load(yaml_files);
    doc = res;
    if (process.env.DOCKER_COMPOSE_MODE) {
      const lavalink_changedata = doc.lavalink.NODES[0];
      lavalink_changedata.url = String(process.env.NODE_URL);
      lavalink_changedata.name = String(process.env.NODE_URL);
      lavalink_changedata.auth = String(process.env.NODE_AUTH);
      lavalink_changedata.secure = false;

      const bot_changedata = doc.bot;
      bot_changedata.TOKEN = String(process.env.TOKEN);

      const db_changedata = doc.features.DATABASE;
      if (db_changedata.driver === 'mongodb') {
        db_changedata.config.uri = String(process.env.MONGO_URI);
      }
    }

    return doc;
  }

  YAMLPraseServices(path) {
    const boolean = ['true', 'false', 'null', 'undefined'];

    const line = this.readline(path);
    const res_array = [];

    for (let i = 0; i < line.length; i++) {
      var element = line[i];
      var re = /\${(.*?)\}/;

      if (re.exec(element) !== null || re.exec(element)) {
        const extract = re.exec(element);
        if (
          process.env[extract[1]] &&
          boolean.includes(process.env[extract[1]].trim().toLowerCase())
        ) {
          const boolean_parse_res = this.parseBoolean(process.env[extract[1]]);
          res_array.push(
            _.replace(element, extract[0], String(boolean_parse_res))
          );
        } else {
          res_array.push(
            _.replace(element, extract[0], process.env[extract[1]])
          );
        }
      } else {
        res_array.push(element);
      }
    }
    return res_array.join('\r\n');
  }

  parseBoolean(value) {
    if (typeof value === 'string') {
      value = value.trim().toLowerCase();
    }
    switch (value) {
      case 'true':
        return true;
      case 'null':
        return 'null';
      case 'undefined':
        return 'undefined';
      default:
        return false;
    }
  }

  readline(path) {
    const res_array = [];
    const res = fs.readFileSync(path, 'utf-8');

    res.split(/\r?\n/).forEach(function (line) {
      res_array.push(line);
    });

    return res_array;
  }
}

new removeSlash();