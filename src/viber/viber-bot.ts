import { EventEmitter } from "events";
import {
  EBotEvents,
  EBotType,
  IBot,
  IBotButtons,
  IBotContext, IGetPhoneLabels,
  IRegistrationStep,
  TBotCallback
} from '../models/bot.model';
import * as Viber from 'viber-bot'
import { ViberContext } from './viber-context';
import { Application } from 'express';
import { ViberRegistrationProcess } from './viber-registration';
import { PhoneCancelError, PhoneViberError } from '../models/api.model';

export class ViberBot extends EventEmitter implements IBot {
  public bot: Viber;
  public startButtons;
  public type: EBotType;
  public botWebHooks: string[];

  constructor() {
    super();
    this.bot = new Viber.Bot({
      authToken: process.env.VIBER_TOKEN,
      name: "FOP412",
      avatar: "https://firebasestorage.googleapis.com/v0/b/forbot-8b259.appspot.com/o/Angular_full_color_logo.svg.png?alt=media&token=b5633691-2c5c-47e0-ba3e-56fec9fa3bef"
    });
    this.botWebHooks = ['/viber/webhook'];
    this.startButtons = null;
    this.type = EBotType.Viber;
    this.initCommands();

    // this.bot.on(Viber.Events.MESSAGE_RECEIVED, (message, response) => {
    //   // Echo's back the message to the client. Your bot logic should sit here.
    //   // response.send(new Viber.Message.Text('test'));
    //   console.log('///////////////////////////////////////////////')
    //   console.log(message)
    //
    //   // response.send(new Viber.Message.Url('https://google.com'))
    // });

  }

  public setStartButtons(buttons: IBotButtons[]): void {
    if (!buttons || buttons.length === 0) {
      this.startButtons = null;
      return;
    }

    this.startButtons = {
      Type: "keyboard",
      Buttons: []
    };

    buttons.forEach((button, index) => {
      this.startButtons.Buttons.push({
        Columns: 6 / ((index === 2) ? 1 : 2),
        Rows: 1,
        ActionType: !!button.url ? 'open-url' : 'reply',
        ActionBody: !!button.url ? button.url : button.label + 'ACTION',
        Text: button.label
      });

      this.bot.onTextMessage(new RegExp(`^${button.label}ACTION$`), (message, response) => {
        button.cb(new ViberContext(response));
      })
    });

  }

  public startRegistration(ctx: IBotContext, steps: IRegistrationStep[]) {
    let registration = new ViberRegistrationProcess(steps, this, this.bot);
    registration.startRegistration(ctx)
  }

  public getPhone(ctx: IBotContext, labels: IGetPhoneLabels): Promise<string> {
    return new Promise((resolve, reject) => {
      ctx.message(labels.startMessage);

      ctx.buttons({
        Type: "keyboard",
        Buttons: [
          {
            Columns: 6,
            Rows: 1,
            ActionType: "share-phone",
            ActionBody: 'PHONE_ACTION',
            Text: labels.phoneButton
          },
          {
            Columns: 6,
            Rows: 1,
            ActionType: "reply",
            ActionBody: 'CANCEL_PHONE',
            Text: labels.cancelButton
          },
        ]
      });

      ctx.send();

      let poneListener = (message, response) => {
        if (!!message.contactPhoneNumber) {
          this.bot.removeListener(Viber.Events.MESSAGE_RECEIVED, poneListener);
          resolve(message.contactPhoneNumber.slice(-10));
        } else {
          if (message.text === 'PHONE_ACTION') {
            this.bot.removeListener(Viber.Events.MESSAGE_RECEIVED, poneListener);
            reject(new PhoneViberError('CanNotGettingPhoneOnDesktopApp'));
          }
          if (message.text === 'CANCEL_PHONE') {
            this.bot.removeListener(Viber.Events.MESSAGE_RECEIVED, poneListener);
            reject(new PhoneCancelError('SharePhoneCanceled'));
          }
        }
      };

      this.bot.on(Viber.Events.MESSAGE_RECEIVED, poneListener);
    });
  }

  public registerWebHooks(botWebHooks: string[], baseUrl: string, app: Application): Promise<boolean> {
    return Promise.all(botWebHooks.map((webHook) => {
      app.use(webHook, this.bot.middleware());
      return this.bot.setWebhook(baseUrl + webHook);
    }))
      .then((res) => true, (err) => Promise.reject(err))
  }

  private initCommands() {
    this.bot.on(Viber.Events.CONVERSATION_STARTED, (response) => {
      this.emit(EBotEvents.Start, new ViberContext(response));
    });
    this.bot.on(Viber.Events.SUBSCRIBED, (response) => {
      this.emit(EBotEvents.Start, new ViberContext(response))
    });
  }
}
