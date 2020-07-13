//#region enums
export enum EDataEntity {
  Users = 'bot_users',
}

export enum EUsersColumns {
  Phone = 'phone',
  Telegram = 'telegram_bot_id',
  Viber = 'viber_bot_id',
}
//#endregion enums
//#region interfaces
export interface IColTable {
  name: string;
  type: string;
  keys: string[];
}

export interface IDataTable {
  name: string;
  cols: IColTable[];
}

export interface IUserTable {
  phone: string;
  telegram_bot_id: string;
  viber_bot_id: string;
}

//#endregion interfaces
