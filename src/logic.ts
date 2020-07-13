import { EBotEvents, EBotType, IBot, IBotContext } from './models/bot.model';
import { apiService } from './services/api.service';
import {
  AGREE_LABEL,
  API_ERROR_MESSAGE,
  CARD_FAILED_MESSAGE,
  CARD_SUCCESS_MESSAGE,
  FEMALE_LABEL,
  HELLO_MESSAGE,
  MALE_LABEL,
  MY_CARD_LABEL,
  PHONE_CANCELED,
  PHONE_LABEL_CANCEL,
  PHONE_LABEL_SEND,
  PHONE_START_MESSAGE,
  REGISTRATION_INVALID_DATE,
  REGISTRATION_LABEL,
  REGISTRATION_STEP_1_MESSAGE,
  REGISTRATION_STEP_2_MESSAGE,
  REGISTRATION_STEP_3_MESSAGE,
  REGISTRATION_STEP_4_MESSAGE,
  REGISTRATION_STEP_5_MESSAGE,
  REGISTRATION_STEP_6_MESSAGE,
  REGISTRATION_STEP_7_MESSAGE,
  SUPPORT_LABEL,
  TIMEOUT_MESSAGE,
  URL_TERMS_LABEL,
  VIBER_PHONE_DESKTOP_ERROR
} from './messages.const';
import { IRegistrationData, IUser } from './models/user.model';
import { ApiError, PhoneCancelError, PhoneViberError } from './models/api.model';
import { ILogger, Logger } from './services/logger';

export class BotLogic {
  private bot: IBot;
  private log: ILogger = new Logger('Logic');

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
    this.log.success(`Init logic for ${EBotType[this.bot.type]}`);
  }

  private getPhone(ctx: IBotContext): Promise<string> {
    return apiService.getUserByBotId(ctx.userId, this.bot.type)
      .then(user => {
        if (!user) {
          return this.bot.getPhone(ctx, {
            phoneButton: PHONE_LABEL_SEND,
            startMessage: PHONE_START_MESSAGE,
            cancelButton: PHONE_LABEL_CANCEL,
          })
            .then((phone) => this.savePhone(phone, ctx.userId, this.bot.type))
        }
        return user.phone;
      })
  }

  private savePhone(phone: string, userId: string, type: EBotType): Promise<string> {
    const _user: IUser = {
      phone,
      telegramId: type === EBotType.Telegram ? userId : null,
      viberId: type === EBotType.Viber ? userId : null
    };
    return apiService.getUserByPhone(phone)
      .then((existUser) => {
        if (existUser === null) {
          return apiService.createUser(_user);
        } else {
          return apiService.updateUser({
            phone,
            telegramId: existUser.telegramId || _user.telegramId,
            viberId: existUser.viberId || _user.viberId,
          })
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
    this.log.info(`Start conversation in ${EBotType[this.bot.type]}`);
    ctx.message(HELLO_MESSAGE).buttons(this.bot.startButtons).send();
  }

  private startRegistration(ctx: IBotContext) {
    this.bot.startRegistration(ctx, [
      {message: REGISTRATION_STEP_1_MESSAGE, objectKey: 'firstName'},
      {message: REGISTRATION_STEP_2_MESSAGE, objectKey: 'lastName'},
      {message: REGISTRATION_STEP_3_MESSAGE, objectKey: 'secondName'},
      {
        message: REGISTRATION_STEP_4_MESSAGE,
        objectKey: 'birthDay',
        validator: '\\d{1,2}\\.\\d{1,2}\\.\\d{2,4}',
        validatorMessage: REGISTRATION_INVALID_DATE
      },
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
    this.log.info(`Registration clicked in ${EBotType[this.bot.type]}`);
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
    this.log.info(`MyCard clicked in ${EBotType[this.bot.type]}`);
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
    this.log.info(`Registration timeout in ${EBotType[this.bot.type]}`);
    ctx.message(TIMEOUT_MESSAGE).buttons(this.bot.startButtons).send();
  }

  private onRegistrationEnd(ctx: IBotContext, data: IRegistrationData): void {
    this.log.info(`Registration end in ${EBotType[this.bot.type]}`);
    apiService.getUserByBotId(ctx.userId, this.bot.type)
      .then((user) => user.phone)
      .then((phone) => apiService.saveRegistrationData(data, phone)
        .then((res) => {
          if (res === null) {
            this.showError(ctx, new ApiError('HowItIsHappens?APIBug?'))
          }

          ctx.sendPhoto(res, 'barcode.jpg').then(() => {
            ctx.message(CARD_SUCCESS_MESSAGE).buttons(this.bot.startButtons).send();
          });
        }))

      .catch((err) => this.showError(ctx, err));
  }
}
