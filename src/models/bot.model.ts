import { SceneContextMessageUpdate } from 'telegraf';
import { EventEmitter } from 'events';
import { Application } from 'express';
//#region types
export type TBotCallback = (ctx: IBotContext) => void;
//#endregion types
//#region enums
export enum EBotType {
  Telegram,
  Viber,
}

export enum EBotEvents {
  RegistrationTimeOut = 'RegistrationTimeOut',
  RegistrationEnd = 'RegistrationEnd',
  Start = "BotStart",
  PhoneCancel = "PhoneCancel",
  PhoneSent = "PhoneSent",
}

//#endregion enums
//#region interfaces
export interface ITelegramContext extends SceneContextMessageUpdate {
}

export interface IRegistrationStep {
  message: string;
  objectKey: string;
  validator?: string;
  validatorMessage?: string;
  inlineButtons?: IBotButtons[]
}

export interface IGetPhoneLabels {
  startMessage: string;
  phoneButton: string;
  cancelButton: string;
}

export interface IBotContext {
  userId: string;

  message(text: string): IBotContext;

  buttons(buttons: any): IBotContext;

  send(): Promise<any>;

  sendPhoto(url: string, fileName: string): Promise<any>;
}

export interface IBotButtons {
  label: string;
  action?: string;
  url?: string;
  cb?: TBotCallback;
}

export interface IBot extends EventEmitter {
  startButtons;
  type: EBotType;

  setStartButtons(buttons: IBotButtons[]): void;

  startRegistration(ctx: IBotContext, steps: IRegistrationStep[]): void;

  getPhone(ctx: IBotContext, labels: IGetPhoneLabels): Promise<string>;

  registerWebHooks(botWebHooks: string[], baseUrl: string, app: Application): Promise<boolean>;
}

//#endregion interfaces
