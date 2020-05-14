import { EBotEvents, IBot, IBotContext } from './models/bot.model';
import { apiService } from './services/api.service';
import {
  AGREE_LABEL,
  API_ERROR_MESSAGE,
  CARD_FAILED_MESSAGE,
  CARD_SUCCESS_MESSAGE,
  FEMALE_LABEL,
  HELLO_MESSAGE,
  MALE_LABEL,
  MY_CARD_LABEL, PHONE_CANCELED,
  REGISTRATION_LABEL,
  REGISTRATION_STEP_1_MESSAGE,
  REGISTRATION_STEP_2_MESSAGE,
  REGISTRATION_STEP_3_MESSAGE,
  REGISTRATION_STEP_4_MESSAGE,
  REGISTRATION_STEP_5_MESSAGE,
  REGISTRATION_STEP_6_MESSAGE,
  REGISTRATION_STEP_7_MESSAGE, SUPPORT_LABEL,
  TIMEOUT_MESSAGE,
  URL_TERMS_LABEL, VIBER_PHONE_DESKTOP_ERROR
} from './messages.const';
import { IRegistrationData, IUser } from './models/user.model';
import { ApiError, PhoneCancelError, PhoneViberError } from './models/api.model';

export class BotLogic {
  private bot: IBot;

  constructor(bot: IBot) {
    this.bot = bot;
    this.init()
  }

  private init() {
    this.bot.setStartButtons([
      {label: REGISTRATION_LABEL, cb: (ctx) => this.onRegistrationClicked(ctx)},
      {label: MY_CARD_LABEL, cb: (ctx) => this.onMyCardClicked(ctx)},
      {label: SUPPORT_LABEL, url: 'https://chats.viber.com/avrora.ua/%2B/ru'}
    ]);

    this.bot.on(EBotEvents.Start, (ctx) => this.onStart(ctx));
    this.bot.on(EBotEvents.RegistrationEnd, (ctx, data) => this.onRegistrationEnd(ctx, data));
    this.bot.on(EBotEvents.RegistrationTimeOut, (ctx) => this.onRegistrationTimeOut(ctx));
  }

  private getPhone(ctx: IBotContext): Promise<string> {
    return this.getUserByBotId(ctx.userId)
      .then(user => {
        if (!user.phone) {
          return this.bot.getPhone(ctx)
            .then((phone) => this.savePhone(phone, user))
        }
        return user.phone;
      })
  }

  private getUserByBotId(userId: string): Promise<IUser> {
    return apiService.getUserByBotId(userId, this.bot.type)
      .then(res => {
        if (res === null) {
          return apiService.createUser(userId, this.bot.type)
        }

        return res;
      })
  }

  private savePhone(phone: string, user: IUser): Promise<string> {
    return apiService.getUserByPhone(phone)
      .then((existUser) => {
        if (existUser === null) {
          return apiService.saveUser({...user, phone});
        } else {
          return apiService.mergeUser(existUser, user)
        }
      })
      .then((user) => user.phone)
  }

  private getCard(ctx): Promise<string> {
    return this.getPhone(ctx)
      .then((phone) => apiService.getCardByPhone(phone))
  }

  private showError(ctx: IBotContext, err): void {
    if (err instanceof PhoneCancelError) {
      ctx.message(PHONE_CANCELED).buttons(this.bot.startButtons).send();
      return;
    }

    if (err instanceof ApiError) {
      ctx.message(API_ERROR_MESSAGE).buttons(this.bot.startButtons).send();
      return;
    }

    if (err instanceof PhoneViberError) {
      ctx.message(VIBER_PHONE_DESKTOP_ERROR).buttons(this.bot.startButtons).send();
      return;
    }
  }

  private onStart(ctx: IBotContext) {
    this.getUserByBotId(ctx.userId)
      .then(res => {
        if (res === null) {
          return apiService.createUser(ctx.userId, this.bot.type)
        }

        return res;
      })
      .then(() => ctx.message(HELLO_MESSAGE).buttons(this.bot.startButtons).send())
      .catch((err) => this.showError(ctx, err))
  }

  private startRegistration(ctx: IBotContext) {
    this.bot.startRegistration(ctx, [
      {message: REGISTRATION_STEP_1_MESSAGE, objectKey: 'firstName'},
      {message: REGISTRATION_STEP_2_MESSAGE, objectKey: 'lastName'},
      {message: REGISTRATION_STEP_3_MESSAGE, objectKey: 'secondName'},
      {message: REGISTRATION_STEP_4_MESSAGE, objectKey: 'birthDay'},
      {message: REGISTRATION_STEP_5_MESSAGE, objectKey: 'address'},
      {
        message: REGISTRATION_STEP_6_MESSAGE, objectKey: 'gender', inlineButtons: [
          {label: FEMALE_LABEL, action: 'genderFemale'},
          {label: MALE_LABEL, action: 'genderMale'}
        ]
      },
      {
        message: REGISTRATION_STEP_7_MESSAGE, objectKey: 'terms', inlineButtons: [
          {label: URL_TERMS_LABEL, url: 'https://google.com'},
          {label: AGREE_LABEL, action: 'terms'}
        ]
      },
    ]);
  }

  private onRegistrationClicked(ctx: IBotContext): void {
    this.getCard(ctx).then((res) => {
      if (res === null) {
        this.startRegistration(ctx);
      } else {
        ctx.sendPhoto(res, 'barcode.png').then(() => {
          ctx.message(CARD_SUCCESS_MESSAGE).buttons(this.bot.startButtons).send();
        });
      }
    }).catch((err) => this.showError(ctx, err))
  }

  private onMyCardClicked(ctx: IBotContext): void {
    this.getCard(ctx).then((res) => {
      if (res === null) {
        ctx.message(CARD_FAILED_MESSAGE).send()
          .then(() => this.startRegistration(ctx));
      } else {
        ctx.sendPhoto(res, 'barcode.jpg').then(() => {
          ctx.message(CARD_SUCCESS_MESSAGE).buttons(this.bot.startButtons).send();
        });
      }
    }).catch((err) => this.showError(ctx, err))
  }

  private onRegistrationTimeOut(ctx: IBotContext): void {
    ctx.message(TIMEOUT_MESSAGE).buttons(this.bot.startButtons).send();
  }

  private onRegistrationEnd(ctx: IBotContext, data: IRegistrationData): void {
    apiService.saveRegistrationData(data, this.bot.type, ctx.userId)
      .then((res) => {
        ctx.sendPhoto(res, 'barcode.jpg').then(() => {
          ctx.message(CARD_SUCCESS_MESSAGE).buttons(this.bot.startButtons).send();
        });
      })
      .catch((err) => this.showError(ctx, err));
  }
}
