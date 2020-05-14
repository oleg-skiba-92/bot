//#region types
//#endregion types
//#region interfaces

export interface IUser {
  id: string;
  viberId?: string;
  telegramId?: string;
  phone?: string;
  barcode?: string;
  registrationData?: IRegistrationData
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
