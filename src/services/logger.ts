import * as moment from 'moment';
import * as colors from 'colors/safe';

export type TLogLevel =
  | 'OFF'
  | 'INFO'
  | 'DEBUG'
  ;

export interface ILogger {
  info(message: string, data?: any): void;

  warn(message: string, data?: any): void;

  error(message: string, data?: any): void;

  success(message: string, data?: any): void;
}

export class Logger implements ILogger {
  private module: string;

  constructor(module: string = 'default') {
    this.module = module;
  }

  public info(message: string, data: any = null) {
    this.log(colors.white(message), data);
  }

  public warn(message: string, data: any = null) {
    this.log(colors.yellow(message), data);
  }

  public error(message: string, data: any = null) {
    this.log(colors.red(message), data);
  }

  public success(message: string, data: any = null) {
    this.log(colors.green(message), data);
  }

  private date() {
    return colors.gray(`[${moment().format('HH:mm:ss:SSS DD/MM/YY')}]`);
  }

  private log(message: string, data: any): void {
    let logLevel: TLogLevel = <TLogLevel>process.env.LOG_LEVEL;

    if (logLevel === 'OFF') {
      return;
    }

    let _arr = [
      this.date(),
      colors.cyan(`(${this.module})`),
      message,
    ];

    if (data && logLevel === 'DEBUG') {
      _arr.push(colors.blue(JSON.stringify(data)));
    }
    console.log(_arr.join(' | '));
  }
}
