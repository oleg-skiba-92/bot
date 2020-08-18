import * as express from 'express';
import { Application } from 'express';
import { config } from 'dotenv'

import { BotLogic } from './src/logic';
import { TelegramBot } from './src/telegram/telegram-bot';
import { ViberBot } from './src/viber/viber-bot';
import { dataService } from './src/services/data.service';
import { ILogger, Logger } from './src/services/logger';
import { join } from "path";

// this.tBot.bot.telegram.sendMessage(481844551, 'test');

class App {
  app: Application;
  PORT = process.env.PORT || 3000;
  log: ILogger = new Logger('APP');

  private bots: BotLogic[];

  constructor() {
    this.app = express();
    this.bots = [];

    try {
      this.log.info(`Starting`, config().parsed);
    } catch (e) {
      this.log.error(`Some problems with configs`);
    }
  }

  public async run() {
    const canRun = await this.initServices();
    this.initBots();

    this.app.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
      res.setHeader('Access-Control-Allow-Credentials', true);
      next();
    });

    if (!canRun) {
      this.log.error(`Server can't be run`);
      return;
    }

    this.app.use('/assets', express.static(join(process.cwd(), 'assets')));

    this.app.listen(this.PORT, () => {
      this.log.success(`Server listening on http://localhost:${this.PORT}`);
    });

  }

  private initBots() {
    this.bots.push(new BotLogic(new TelegramBot()));
    const _vbot = new ViberBot();
    _vbot.registerWebHooks(['/viber/webhook'], process.env.BASE_URL, this.app)
      .then(() => this.bots.push(new BotLogic(_vbot)))
      .catch((e) => this.log.error(`Viber can't initialize`, e));
  }

  private async initServices() {
    const initialisedServices = await Promise.all([
      dataService.initialise(),
    ]);

    return initialisedServices.reduce((acc, curr) => curr && acc, true);
  }
}

const app = new App();
app.run();
process.on('uncaughtException', (err) => {
  app.log.error(`uncaughtException: ${err.message}`, err.stack);
});
process.on('unhandledRejection', (err) => {
  app.log.error(`unhandledRejection`, err);
});
