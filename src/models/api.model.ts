export class ApiError extends Error {
  constructor(msg) {
    super(msg);
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export class PhoneCancelError extends Error {
  constructor(msg) {
    super(msg);
    Object.setPrototypeOf(this, PhoneCancelError.prototype);
  }
}

export class PhoneViberError extends Error {
  constructor(msg) {
    super(msg);
    Object.setPrototypeOf(this, PhoneViberError.prototype);
  }
}

export enum EApiResultCode {
  TokenError = -1,
  Success = 0,
  CardNotExist = 1,
  CardExist = 2,
}

export interface IApiResponse<T> {
  Message: string,
  Result: EApiResultCode,
  Data: T
}
