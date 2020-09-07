const CONFIG = {
  isServer: true,
  showDate: true,
  showTime: true,
  showModule: false,
  color: false,
  delimiter: ' | ',
};

//#region types
declare var process;

type TLogLevel =
  | 'OFF'
  | 'INFO'
  | 'ERRORS'
  | 'DEBUG'
  ;

type TLogColor =
  | 'white'
  | 'yellow'
  | 'red'
  | 'green'
  | 'gray'
  | 'blue'
  | 'cyan'
  ;

enum ELogType {
  info = 'INFO',
  warn = 'WARN',
  success = '  OK',
  error = ' ERR',
}

interface ICustomLog {
  message: string;
  data?: object | number | string;
  color: TLogColor;
}

export interface ILogger {
  info(message: string, data?: any): void;

  warn(message: string, data?: any): void;

  error(message: string, data?: any): void;

  success(message: string, data?: any): void;

  custom(message: ICustomLog[]): void;
}

//#endregion types

export class Logger implements ILogger {
  private module: string;

  //#region private getters
  private get logLevel(): TLogLevel {
    if (CONFIG.isServer) {
      return <TLogLevel>process.env.LOG_LEVEL;
    }

    return 'DEBUG';
  }

  private get date(): string {
    // tslint:disable:no-magic-numbers
    let _now = new Date();
    let _timeStr = [
      _now.getHours().toString().padStart(2, '0'),
      _now.getMinutes().toString().padStart(2, '0'),
      _now.getSeconds().toString().padStart(2, '0'),
      _now.getMilliseconds().toString().padStart(3, '0'),
    ].join(':');
    let _dateStr = [
      _now.getDate().toString().padStart(2, '0'),
      (_now.getMonth() + 1).toString().padStart(2, '0'),
      _now.getFullYear().toString().padStart(4, '0'),
    ].join('/');
    // tslint:enable:no-magic-numbers

    return `${CONFIG.showTime ? _timeStr : ''} ${CONFIG.showDate ? _dateStr : ''}`.trim();
  }

  //#endregion private getters

  constructor(module: string = 'default') {
    this.module = module;
  }

  //#region public methods
  public info(message: string, data: any = null) {
    this.log(this.color(message, 'white'), ELogType.info, data);
  }

  public warn(message: string, data: any = null) {
    this.log(this.color(message, 'yellow'), ELogType.warn, data);
  }

  public error(message: string, data: any = null) {
    this.log(this.color(message, 'red'), ELogType.error, data);
  }

  public success(message: string, data: any = null) {
    this.log(this.color(message, 'green'), ELogType.success, data);
  }

  public custom(message: ICustomLog[]): void {
    let _arr = message.reduce((acc, curr) => {
      acc.push(this.color(curr.message + (!!curr.data ? (' ' + JSON.stringify(curr.data)) : ''), curr.color));

      return acc;
    }, []);

    console.log(_arr.join(CONFIG.delimiter));
  }

  //#endregion public methods

  //#region private methods
  private log(message: string, type: ELogType, data: any): void {
    if (this.logLevel === 'OFF') {
      return;
    }

    let _arr = [];

    if (CONFIG.showDate || CONFIG.showTime) {
      _arr.push(this.color(`[${this.date}]`, 'gray'));
    }

    if (!CONFIG.color) {
      _arr.push(type)
    }

    if (CONFIG.showModule) {
      _arr.push(this.color(`(${this.module})`, 'cyan'));
    }

    _arr.push(message);

    if (data && this.logLevel === 'DEBUG') {
      _arr.push(this.color(JSON.stringify(data), 'blue'));
    }

    // tslint:disable-next-line:no-console
    console.log(_arr.join(CONFIG.delimiter));
  }

  private color(message: string, color: TLogColor): string {
    if (!CONFIG.color) {
      return message;
    }

    switch (color) {
      case 'white':
        return `\x1b[37m${message}\x1b[39m`;
      case 'yellow':
        return `\x1b[33m${message}\x1b[39m`;
      case 'red':
        return `\x1b[31m${message}\x1b[39m`;
      case 'green':
        return `\x1b[32m${message}\x1b[39m`;
      case 'gray':
        return `\x1b[90m${message}\x1b[39m`;
      case 'blue':
        return `\x1b[34m${message}\x1b[39m`;
      case 'cyan':
        return `\x1b[36m${message}\x1b[39m`;
    }
  }

  //#endregion private methods
}
