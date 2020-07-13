import { EBotType } from '../models/bot.model';
import { IRegistrationData, IUser } from '../models/user.model';
import { barcodeService } from './barcode.service';
import { ApiError, EApiResultCode, IApiResponse } from '../models/api.model';
import { default as axios } from 'axios';
import { EDataEntity, EUsersColumns, IUserTable } from '../models/data.model';
import { dataService } from './data.service';
import * as moment from 'moment';
import { ILogger, Logger } from './logger';

export interface IApiService {
  createUser(user: IUser): Promise<IUser>;

  updateUser(user: IUser): Promise<IUser>;

  getUserByBotId(userBotId: string, type: EBotType): Promise<IUser>;

  getUserByPhone(phone: string): Promise<IUser>;

  getCardByPhone(phone: string): Promise<string>;

  saveRegistrationData(registrationData: IRegistrationData, phone: string): Promise<string>
}

class ApiService implements IApiService {
  private log: ILogger = new Logger('ApiService');

  private get baseApiUrl(): string {
    return `${process.env.API_URL}/chatbot/${process.env.API_TOKEN}`
  }

  public createUser(user: IUser): Promise<IUser> {
    this.log.info(`createUser called`, user);
    return dataService.createObject<IUserTable>(EDataEntity.Users, this.userToTableUser(user))
      .then((res) => this.tableUserToUser(res))
      .catch((err) => {
        this.log.error(`CreateUserError`, err);
        return Promise.reject(new ApiError('CreateUserError'));
      });
  }

  public updateUser(user: IUser): Promise<IUser> {
    this.log.info(`updateUser called`, user);
    return dataService.updateObject<IUserTable>(EDataEntity.Users, EUsersColumns.Phone, user.phone, this.userToTableUser(user))
      .then((res) => this.tableUserToUser(res))
      .catch((err) => {
        this.log.error(`UpdateUserError`, err);
        return Promise.reject(new ApiError('UpdateUserError'));
      });
  }

  public getUserByBotId(userBotId: string, type: EBotType): Promise<IUser> {
    this.log.info(`getUserByBotId called`, userBotId);
    const key = type === EBotType.Telegram ? EUsersColumns.Telegram : EUsersColumns.Viber;
    return dataService.getObject<IUserTable>(EDataEntity.Users, key, userBotId)
      .then((res) => this.tableUserToUser(res))
      .catch((err) => {
        this.log.error(`GetUserByIdError`, err);
        return Promise.reject(new ApiError('GetUserByIdError'));
      });
  }

  public getUserByPhone(phone: string): Promise<IUser> {
    this.log.info(`getUserByPhone called`, phone);
    return dataService.getObject<IUserTable>(EDataEntity.Users, EUsersColumns.Phone, phone)
      .then((res) => this.tableUserToUser(res))
      .catch((err) => {
        this.log.error(`GetUserByPhoneError`, err);
        return Promise.reject(new ApiError('GetUserByPhoneError'));
      });
  }

  public getCardByPhone(phone: string): Promise<string> {
    this.log.info(`getCardByPhone called`, phone);
    return axios.get<IApiResponse<string>>(`${this.baseApiUrl}/get`, {params: {phone}})
      .then((res) => {
        if (res.status !== 200 || res.data.Result === EApiResultCode.TokenError) {
          this.log.error(`Api token error`);
          return Promise.reject(new ApiError('GetCardByPhoneError'));
        }

        if (res.data.Result === EApiResultCode.Success) {
          return barcodeService.getBarcodeFileUrl(res.data.Data)
        }

        return null;
      })
      .catch((err) => {
        this.log.error(`GetCardByPhoneError`, err);
        return Promise.reject(new ApiError('GetCardByPhoneError'));
      });
  }

  public saveRegistrationData(registrationData: IRegistrationData, phone: string): Promise<string> {
    this.log.info(`saveRegistrationData called`, registrationData);
    const _data = {
      phone: phone,
      name: registrationData.firstName,
      surname: registrationData.lastName,
      birthday: this.prepareBirthdayDate(registrationData.birthDay),
      sex: registrationData.gender,
      city: registrationData.address,
      date: moment().format('YYYY-MM-DD'),
    };
    return axios.get<IApiResponse<string>>(`${this.baseApiUrl}/reg`, {params: _data})
      .then((res) => {
        if (res.status !== 200 || res.data.Result === EApiResultCode.TokenError) {
          this.log.error(`Api token error`);
          return Promise.reject(new ApiError('SaveRegistrationDataError'));
        }

        if (res.data.Result === EApiResultCode.Success) {
          return barcodeService.getBarcodeFileUrl(res.data.Data)
        }

        if (res.data.Result === EApiResultCode.CardExist) {
          return this.getCardByPhone('phone');
        }

        return null;
      })
      .catch((err) => {
        this.log.error(`SaveRegistrationDataError`, err);
        return Promise.reject(new ApiError('SaveRegistrationDataError'));
      });
  }

  private tableUserToUser(user: IUserTable): IUser {
    if (!user || typeof user !== 'object') {
      return null;
    }
    return {phone: user.phone, telegramId: user.telegram_bot_id, viberId: user.viber_bot_id}
  }

  private userToTableUser(user: IUser): IUserTable {
    if (!user || typeof user !== 'object') {
      return null;
    }
    return {phone: user.phone, telegram_bot_id: user.telegramId, viber_bot_id: user.viberId}
  }

  private prepareBirthdayDate(date: string): string {
    if (!date) {
      return '';
    }

    let _possibleFormats = [
      'DD.MM.YYYY',
      'D.M.YY',
      'D.MM.YYYY',
      'DD.M.YYYY',
      'DD.MM.YY',
      'D.M.YYYY',
      'D.MM.YY',
      'DD.M.YY'
    ];
    const _date = moment(date, _possibleFormats);

    return _date.isValid() ? _date.format('YYYY-MM-DD') : '';
  }
}

export const apiService: IApiService = new ApiService();
