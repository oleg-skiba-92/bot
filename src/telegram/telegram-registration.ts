import { BaseScene, Markup, Scene } from 'telegraf';

import {
  EBotEvents,
  IBot,
  IBotButtons,
  IRegistrationStep,
  ITelegramContext
} from '../models/bot.model';
import { TelegramContext } from './telegram-context';
import * as moment from 'moment';

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

      if(!!this.currStep.validator){
        const reg = new RegExp(this.currStep.validator);
        if (!reg.test(ctx.message.text)) {
          if(!!this.timeoutId) {
            clearTimeout(this.timeoutId);
          }
          return ctx.reply(this.currStep.validatorMessage);
        }
      }

      this.registrationObj[this.currStep.objectKey] = ctx.message.text;
      return this.nextStep(new TelegramContext(ctx));
    });

    this.scene.action('genderFemale', async (ctx) => {
      await ctx.answerCbQuery();
      if(!this.registrationObj){
        await ctx.scene.leave();
      }
      this.registrationObj[this.currStep.objectKey] = '2';
      await this.nextStep(new TelegramContext(ctx));
    });
    this.scene.action('genderMale', async (ctx) => {
      await ctx.answerCbQuery();
      if(!this.registrationObj){
        await ctx.scene.leave();
      }
      this.registrationObj[this.currStep.objectKey] = '1';
      await this.nextStep(new TelegramContext(ctx));
    });
    this.scene.action('terms', async (ctx) => {
      await ctx.answerCbQuery();
      if(!this.registrationObj){
        await ctx.scene.leave();
      }
      this.registrationObj[this.currStep.objectKey] = true;
      await this.nextStep(new TelegramContext(ctx));
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
      return Promise.resolve();
    }

    this.timeoutId = setTimeout(() => {
      ctx.scene.leave();
      this.bot.emit(EBotEvents.RegistrationTimeOut, ctx);
    }, REGISTRATION_TIME_OUT);

    ctx.message(this.currStep.message);
    if (this.currStep.inlineButtons) {
      ctx.buttons(Markup.inlineKeyboard(this.buttonsToMarkup(this.currStep.inlineButtons)))
    }
    return ctx.send();
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
