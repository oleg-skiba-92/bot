import * as Viber from 'viber-bot';

import { EBotEvents, IBot, IBotButtons, IBotContext, IRegistrationStep } from '../models/bot.model';
import { ViberContext } from './viber-context';

const REGISTRATION_TIME_OUT = 1000 * 30;

export class ViberRegistrationProcess {
  private steps: IRegistrationStep[];
  private currentStepNumber: number;
  private registrationObj: object;
  private timeoutId;
  private bot: IBot;
  private viberBot;
  private listener;

  private get currStep(): IRegistrationStep {
    if (this.currentStepNumber < 0 || this.currentStepNumber >= this.steps.length) {
      return null
    }

    return this.steps[this.currentStepNumber];
  }

  constructor(steps: IRegistrationStep[], bot: IBot, viberBot) {
    this.steps = steps || [];
    this.currentStepNumber = -1;
    this.registrationObj = {};
    this.bot = bot;
    this.viberBot = viberBot;

    this.initCommands();
  }

  public startRegistration(ctx: IBotContext) {
    this.currentStepNumber = -1;
    this.registrationObj = {};
    this.nextStep(ctx);
  }

  private initCommands() {
    this.listener = (message, response) => this.registrationListener(message, response);
    this.viberBot.on(Viber.Events.MESSAGE_RECEIVED, this.listener);
  }

  private nextStep(ctx: IBotContext) {
    if (!!this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.currentStepNumber++;
    if (this.currStep === null) {
      this.viberBot.removeListener(Viber.Events.MESSAGE_RECEIVED, this.listener)
      this.bot.emit(EBotEvents.RegistrationEnd, ctx, this.registrationObj);
      return;
    }

    this.timeoutId = setTimeout(() => {
      this.viberBot.removeListener(Viber.Events.MESSAGE_RECEIVED, this.listener)
      this.bot.emit(EBotEvents.RegistrationTimeOut, ctx);
    }, REGISTRATION_TIME_OUT);

    ctx.message(this.currStep.message);
    if (this.currStep.inlineButtons) {
      ctx.buttons({
        Type: "keyboard",
        Buttons: this.buttonsMap(this.currStep.inlineButtons)
      })
    }

    ctx.send();
  }

  private registrationListener(message, response) {
    if (!message.text) {
      return;
    }

    let data = null;
    switch (message.text) {
      case 'genderFemale':
        data = 'female';
        break;
      case 'genderMale':
        data = 'male';
        break;
      case 'terms':
        data = true;
        break;
      default:
        if (this.currentStepNumber <= 4) {
          data = message.text;
        }
        break;
    }

    if (data !== null) {
      this.registrationObj[this.currStep.objectKey] = data;
      this.nextStep(new ViberContext(response));
    }
  }

  private buttonsMap(buttons: IBotButtons[]) {
    return buttons.map((button) => {
      if (!!button.url) {
        return {
          Columns: 6 / (buttons.length),
          Rows: 1,
          ActionType: "open-url",
          ActionBody: button.url,
          Text: button.label
        };
      } else {
        return {
          Columns: 6 / (buttons.length),
          Rows: 1,
          ActionType: "reply",
          ActionBody: button.action,
          Text: button.label
        };
      }
    })

  }
}
