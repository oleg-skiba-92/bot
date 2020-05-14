import * as express from 'express';
import { Application } from 'express';

import { BotLogic } from './src/logic';
import { TelegramBot } from './src/telegram/telegram-bot';
import { firebaseService } from './src/services/firebase.service';
import { ViberBot } from './src/viber/viber-bot';
import { join } from "path";

// this.tBot.bot.telegram.sendMessage(481844551, 'test');

class App {
  app: Application;
  PORT = process.env.PORT || 8080;

  private bots: BotLogic[];

  constructor() {
    this.app = express();
    this.bots = [];
  }

  public async run() {
    const canRun = await this.initServices();
    this.initBots();

    if (!canRun) {
      console.log(`Server can't be run`);
      return;
    }

    this.app.use('/assets', express.static('./assets'));

    this.app.listen(this.PORT, () => {
      console.log(`Server listening on http://localhost:${this.PORT}`);
    });

  }

  private initBots() {
    this.bots.push(new BotLogic(new TelegramBot()));
    const _vbot = new ViberBot();
    _vbot.registerWebHooks(['/viber/webhook'], process.env.BASE_URL, this.app);
    this.bots.push(new BotLogic(_vbot));
  }

  private async initServices() {
    const initialisedServices = await Promise.all([
      firebaseService.initialise(),
    ]);

    return initialisedServices.reduce((acc, curr) => curr && acc, true);
  }
}

const app = new App();
app.run();
