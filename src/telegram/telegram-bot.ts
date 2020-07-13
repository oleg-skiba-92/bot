import Telegraf, { BaseScene, Buttons, Markup, session, Stage } from 'telegraf';
import { EventEmitter } from 'events'

import {
  EBotEvents,
  EBotType,
  IBot,
  IBotButtons,
  IGetPhoneLabels,
  IRegistrationStep,
  ITelegramContext,
} from '../models/bot.model';
import { TelegramRegistrationProcess } from './telegram-registration';
import { TelegramContext } from './telegram-context';
import { TelegramGetPhoneProcess } from './telegram-get-phone';

export class TelegramBot extends EventEmitter implements IBot {
  public startButtons;
  public type: EBotType;

  private bot: Telegraf<ITelegramContext>;
  private stage: Stage<ITelegramContext>;

  constructor() {
    super();
    this.bot = new Telegraf(process.env.TELEGRAM_TOKEN);
    this.stage = new Stage([]);
    this.startButtons = null;
    this.type = EBotType.Telegram;

    this.bot.use(session());
    this.bot.use(this.stage.middleware());

    this.initCommands();
    this.bot.launch();
  }

  public setStartButtons(buttons: IBotButtons[]): void {
    let _buttons: Buttons[] = [];
    buttons.forEach((button) => {
      _buttons.push(Markup.callbackButton(button.label, button.label));
      this.bot.hears(new RegExp(`^${button.label}$`), (ctx) => {
        if (!!button.url) {
          return ctx.reply(button.url);
        }
        button.cb(new TelegramContext(ctx));
      })
    });

    this.startButtons = Markup.keyboard(_buttons, {columns: 2}).resize(true);
  }

  public startRegistration(ctx: TelegramContext, steps: IRegistrationStep[]) {
    this.stage.register(new TelegramRegistrationProcess(steps, this).scene);
    ctx.scene.enter('registration');
  }

  public getPhone(ctx: TelegramContext, labels: IGetPhoneLabels): Promise<string> {
    const _scene = new TelegramGetPhoneProcess(this, labels);
    this.stage.register(_scene.scene);
    ctx.scene.enter('getPhone');

    return _scene.promise;
  }

  public registerWebHooks() {
    return Promise.resolve(true);
  }

  private initCommands() {
    this.bot.start((ctx) => {
      this.emit(EBotEvents.Start, new TelegramContext(ctx));
    });
  }
}

