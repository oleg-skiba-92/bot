import { IBotContext, ITelegramContext } from '../models/bot.model';
import * as Viber from 'viber-bot'

export class ViberContext implements IBotContext {
  private ctx;
  private msg: string;
  private _buttons;

  public get userId(): string {
    return this.ctx.userProfile.id;
  }

  constructor(ctx: ITelegramContext) {
    this.ctx = ctx;
    this.msg = '';
    this._buttons = null;
  }

  public send(): Promise<any> {
    // NOTE 3 it is minApiVersion (for contact button)
    return this.ctx.send(new Viber.Message.Text(this.msg, this._buttons, null, null, null, 3))
  }

  public sendPhoto(url, filename: string): Promise<any> {
    return this.ctx.send(new Viber.Message.Picture(`${process.env.BASE_URL}/${url}`));
  }

  public message(msg: string): ViberContext {
    this.msg = msg || '';
    return this;
  }

  public buttons(buttons: any): ViberContext {
    this._buttons = buttons || null;
    return this;
  }
}
