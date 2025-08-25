import {
  Client,
  GatewayIntentBits
} from 'discord.js';
import { config } from 'dotenv';
import { Config } from './@types/Config';
config();

export class Manager extends Client {
  public owner: string;
  constructor(
    public config: Config,
    isMsgEnable: boolean
  ) {
    super({
      allowedMentions: {
        parse: ['roles', 'users', 'everyone'],
        repliedUser: false,
      },
      intents: isMsgEnable
        ? [
          GatewayIntentBits.Guilds
        ] : [
          
        ]
    })
  }
}