import { IBotContext, ITelegramContext } from '../models/bot.model';
import { SceneContext } from 'telegraf';

export class TelegramContext implements IBotContext {
  private ctx: ITelegramContext;
  private msg: string;
  private _buttons;

  public get userId(): string {
    return this.ctx.from.id.toString();
  }

  public get scene(): SceneContext<ITelegramContext> {
    return this.ctx.scene;
  }

  constructor(ctx: ITelegramContext) {
    this.ctx = ctx;
    this.msg = '';
    this._buttons = null;
  }

  public send(): Promise<any> {
    if (this._buttons === null) {
      this._buttons = {remove_keyboard: true}
    }

    return this.ctx.reply(this.msg, {reply_markup: this._buttons})
    // this.ctx.reply(this.msg)
  }

  public sendPhoto(url, fileName: string): Promise<any> {
    return this.ctx.replyWithPhoto({source: url});
  }

  public message(msg: string): TelegramContext {
    this.msg = msg || '';
    return this;
  }

  public buttons(buttons: any): TelegramContext {
    this._buttons = buttons || null;
    return this;
  }
}
