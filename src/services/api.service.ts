import { EBotType } from '../models/bot.model';
import { IRegistrationData, IUser } from '../models/user.model';
import { firebaseService } from './firebase.service';
import { barcodeService } from './barcode.service';
import { ApiError } from '../models/api.model';

export interface IApiService {
  createUser(userBotId: string, type: EBotType): Promise<IUser>;

  getUserByBotId(userBotId: string, type: EBotType): Promise<IUser>;

  getUserByPhone(phone: string): Promise<IUser>;

  saveUser(user: IUser): Promise<IUser>;

  mergeUser(existUser: IUser, oldUser: IUser): Promise<IUser>;

  getCardByPhone(phone: string): Promise<string>;

  saveRegistrationData(registrationData: IRegistrationData, type: EBotType, userId: string): Promise<string>
}

class ApiService implements IApiService {

  public createUser(userBotId: string, type: EBotType): Promise<IUser> {
    let _user = {id: this.randString()};
    let key = type === EBotType.Telegram ? 'telegramId' : 'viberId';
    _user[key] = userBotId;
    return firebaseService.setObject(`users/${_user.id}`, _user)
      .catch((err) => Promise.reject(new ApiError('CreateUserError')));
  }

  public getUserByBotId(userBotId: string, type: EBotType): Promise<IUser> {
    return firebaseService.getObjectByParam<IUser>('users', type === EBotType.Telegram ? 'telegramId' : 'viberId', userBotId)
      .catch((err) => Promise.reject(new ApiError('GetUserByIdError')));
  }

  public getUserByPhone(phone: string): Promise<IUser> {
    return firebaseService.getObjectByParam<IUser>('users', 'phone', phone)
      .catch((err) => Promise.reject(new ApiError('GetUserByPhoneError')));
  }

  public saveUser(user: IUser): Promise<IUser> {
    return firebaseService.setObject<IUser>(`users/${user.id}`, user)
      .catch((err) => Promise.reject(new ApiError('UpdateUserError')));
  }

  public mergeUser(existUser, oldUser): Promise<IUser> {
    return firebaseService.removeObject(`users/${oldUser.id}`)
      .then(() => this.saveUser({...oldUser, ...existUser}))
      .catch((err) => Promise.reject(new ApiError('MergeUserError')));
  }

  public getCardByPhone(phone: string): Promise<string> {
    return this.getUserByPhone(phone)
      .then((user) => (!!user && !!user.registrationData) ? barcodeService.getBarcodeFileUrl(user.barcode) : null);
  }

  public saveRegistrationData(registrationData: IRegistrationData, type: EBotType, userId: string): Promise<string> {
    return this.getUserByBotId(userId, type)
      .then((user) => this.saveUser({...user, registrationData, barcode: this.randString(15, 'number')}))
      .then((user) => barcodeService.getBarcodeFileUrl(user.barcode));
  }

  private randString(len = 15, randType: 'all' | 'number' | 'lower' | 'upper' = 'all'): string {
    const lowerCase = 'abcdefghijklmnopqrstuvwxyz';
    const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let charset = '';

    switch (randType) {
      case 'all':
        charset = lowerCase + upperCase + numbers;
        break;
      case 'number':
        charset = numbers;
        break;
      case 'lower':
        charset = lowerCase;
        break;
      case 'upper':
        charset = upperCase;
        break;
    }

    let randString = '';
    for (let i = 0, n = charset.length; i < len; ++i) {
      randString += charset.charAt(Math.floor(Math.random() * n));
    }
    return randString;
  }
}

export const apiService: IApiService = new ApiService();
