import Telegraf, { BaseScene, Buttons, Markup, session, Stage } from 'telegraf';
import { EventEmitter } from 'events'

import {
  EBotEvents,
  EBotType,
  IBot,
  IBotButtons,
  IRegistrationStep,
  ITelegramContext,
} from '../models/bot.model';
import { TelegramRegistrationProcess } from './telegram-registration';
import { TelegramContext } from './telegram-context';
import { PhoneCancelError } from '../models/api.model';

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

  // TODO rework it
  public getPhone(ctx: TelegramContext): Promise<string> {
    return new Promise((resolve, reject) => {
      let _scene = new BaseScene('getPhone');

      _scene.on('contact', (ctx) => {
        resolve(ctx.message.contact.phone_number.slice(-10))
      });
      _scene.hears('Відмінити', (ctx) => {
        return ctx.scene.leave().then(() => {
          reject(new PhoneCancelError('SharePhoneCanceled'));
        });
      });

      _scene.enter(() => {
        ctx.message('Для продовження нам потрібен ваш номер телефону')
        ctx.buttons(Markup.keyboard([
          Markup.contactRequestButton('Відправити телефон'),
          Markup.callbackButton('Відмінити', 'Відмінити')
        ]).resize(true));
        ctx.send()
      });

      this.stage.register(_scene);
      ctx.scene.enter('getPhone');
    });
  }

  public registerWebHooks() {
    return
  }

  private initCommands() {
    this.bot.start((ctx) => {
      this.emit(EBotEvents.Start, new TelegramContext(ctx));
    });
  }
}

