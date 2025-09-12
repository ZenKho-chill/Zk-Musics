import { ApplicationCommandOptionType } from "discord.js";
import { Manager } from "../manager.js";
import { CommandHandler } from "./CommandHandler.js";

export enum Accessableby {
  Owner = "Owner",
  Admin = "Admin",
  UserPremium = "UserPremium",
  GuildPremium = "GuildPremium",
  Premium = "Premium",
  PremiumRole = "PremiumRole",
  Manager = "Manager",
  Voter = "Voter",
  Member = "Member",
  PremiumStore = "PremiumStore",
}

export type CommandOptionChoiceInterface = {
  name: string;
  value: string;
};

export type CommandOptionInterface = {
  name: string;
  description: string;
  required?: boolean;
  type: ApplicationCommandOptionType | undefined;
  autocomplete?: boolean;
  choices?: CommandOptionChoiceInterface[];
};

export class Command {
  name: string[] = [];
  description: string = "";
  category: string = "";
  accessableby: string[] = [];
  usage: string = "";
  aliases: string[] = [];
  lavalink: boolean = false;
  playerCheck: boolean = false;
  usingInteraction: boolean = false;
  sameVoiceCheck: boolean = false;
  options: CommandOptionInterface[] = [];
  permissions: bigint[] = [];
  async execute(client: Manager, handler: CommandHandler): Promise<any> {}
}
