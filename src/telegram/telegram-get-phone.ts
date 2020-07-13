import { EBotEvents, IBot, IGetPhoneLabels, ITelegramContext } from '../models/bot.model';
import { BaseScene, Markup, Scene } from 'telegraf';
import { PhoneCancelError } from '../models/api.model';
import { EventEmitter } from "events";
import { TelegramContext } from './telegram-context';

export class TelegramGetPhoneProcess extends EventEmitter {
  public promise;
  private bot: IBot;
  private buttons;
  private labels: IGetPhoneLabels;

  public scene: Scene<ITelegramContext>;

  constructor(bot: IBot, labels: IGetPhoneLabels) {
    super();

    this.bot = bot;
    this.labels = labels;

    this.promise = new Promise((resolve, reject) => {
      this.on(EBotEvents.PhoneCancel, (err) => reject(err));
      this.on(EBotEvents.PhoneSent, (phone) => resolve(phone));
    });

    this.buttons = Markup.keyboard([
      Markup.contactRequestButton(labels.phoneButton),
      Markup.callbackButton(labels.cancelButton, labels.cancelButton)
    ]).resize(true);

    this.scene = new BaseScene('getPhone');
    this.initCommands();
  }

  private initCommands(): void {
    this.scene.enter((ctx) => this.onStart(new TelegramContext(ctx)));

    this.scene.on('contact', (ctx) => ctx.scene.leave()
      .then(() => this.emit(EBotEvents.PhoneSent, ctx.message.contact.phone_number.slice(-10)))
    );

    this.scene.hears(this.labels.cancelButton, (ctx) => ctx.scene.leave()
      .then(() => this.emit(EBotEvents.PhoneCancel, new PhoneCancelError('SharePhoneCanceled')))
    );
  }

  private onStart(ctx: TelegramContext): Promise<void> {
    return ctx.message(this.labels.startMessage)
      .buttons(this.buttons)
      .send();
  }
}
