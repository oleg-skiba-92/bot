//#region interfaces

export interface IUser {
  viberId: string;
  telegramId: string;
  phone: string;
}

export interface IRegistrationData {
  firstName: string;
  lastName: string;
  secondName: string;
  birthDay: string;
  address: string;
  gender: string;
  terms: boolean;
}

//#endregion interfaces
