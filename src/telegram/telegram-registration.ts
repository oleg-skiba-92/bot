import { BaseScene, Markup, Scene } from 'telegraf';

import {
  EBotEvents,
  IBot,
  IBotButtons,
  IRegistrationStep,
  ITelegramContext
} from '../models/bot.model';
import { TelegramContext } from './telegram-context';

const REGISTRATION_TIME_OUT = 1000 * 30;

export class TelegramRegistrationProcess {
  private steps: IRegistrationStep[];
  private currentStepNumber: number;
  private registrationObj: object;
  private timeoutId;
  private bot: IBot;

  public scene: Scene<ITelegramContext>;

  private get currStep(): IRegistrationStep {
    if (this.currentStepNumber < 0 || this.currentStepNumber >= this.steps.length) {
      return null
    }

    return this.steps[this.currentStepNumber];
  }

  constructor(steps: IRegistrationStep[], bot: IBot) {
    this.steps = steps || [];
    this.currentStepNumber = -1;
    this.bot = bot;

    this.scene = new BaseScene('registration');
    this.initCommands();
  }

  private initCommands() {
    this.scene.enter((ctx) => {
      this.currentStepNumber = -1;
      this.registrationObj = {};
      this.nextStep(new TelegramContext(ctx));
    });

    this.scene.leave((ctx) => {
      this.steps = [];
      this.currentStepNumber = -1;
      this.registrationObj = {};
    });

    this.scene.on('text', (ctx, next) => {
      if (!ctx.message.text || this.currentStepNumber > 4) {
        next();
        return;
      }

      this.registrationObj[this.currStep.objectKey] = ctx.message.text;
      this.nextStep(new TelegramContext(ctx));

    });

    this.scene.action('genderFemale', (ctx) => {
      this.registrationObj[this.currStep.objectKey] = 'female';
      this.nextStep(new TelegramContext(ctx));
    });
    this.scene.action('genderMale', (ctx) => {
      this.registrationObj[this.currStep.objectKey] = 'male';
      this.nextStep(new TelegramContext(ctx));
    });
    this.scene.action('terms', (ctx) => {
      this.registrationObj[this.currStep.objectKey] = true;
      this.nextStep(new TelegramContext(ctx));
    });
  }

  private nextStep(ctx: TelegramContext) {
    if(!!this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.currentStepNumber++;
    if (this.currStep === null) {
      this.bot.emit(EBotEvents.RegistrationEnd, ctx, this.registrationObj);
      ctx.scene.leave();
      return;
    }

    this.timeoutId = setTimeout(() => {
      ctx.scene.leave();
      this.bot.emit(EBotEvents.RegistrationTimeOut, ctx);
    }, REGISTRATION_TIME_OUT);

    ctx.message(this.currStep.message);
    if (this.currStep.inlineButtons) {
      ctx.buttons(Markup.inlineKeyboard(this.buttonsToMarkup(this.currStep.inlineButtons)))
    }
    ctx.send();
  }

  private buttonsToMarkup(buttons: IBotButtons[] = []): any[] {
    return buttons.map((button) => {
      if (!!button.url) {
        return Markup.urlButton(button.label, button.url);
      } else {
        return Markup.callbackButton(button.label, button.action);
      }
    })
  }
}
