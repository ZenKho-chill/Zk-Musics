import express from 'express';
import expressWs from 'express-ws';
import { Manager } from '../manager.js';
import { Webhook } from '@top-gg/sdk';
import path from 'path';
import { fileURLToPath } from 'url';
import md5 from 'md5';
import axios from 'axios';
import cron from 'node-cron';
import {
  ButtonBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonStyle,
  TextChannel,
  Interaction,
  MessageFlags
} from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class WebServer {
  client: Manager;
  app: expressWs.Application;
  port: number;
  channelId: string;

  constructor(client: Manager) {
    this.client = client;
    this.app = expressWs(express()).app;
    this.port = this.client.config.features.WebServer.Port;
    this.startCronJobs();

  }

  startCronJobs() {
    cron.schedule('0 * * * *', async () => {
      await this.checkReminders();
    });
  }

  async checkReminders() {
    const language = this.client.config.bot.LANGUAGE || 'en';
    const reminders = await this.client.db.VoteReminders.all();
  }
}