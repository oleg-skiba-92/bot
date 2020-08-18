import * as JsBarcode from 'jsbarcode';
import { Canvas } from 'canvas';
import * as fs from 'fs';
import { ILogger, Logger } from './logger';

export interface IBarcodeService {
  generateBarcode(code: string): Buffer;

  getBarcodeFileUrl(code: string): string;
}

class BarcodeService implements IBarcodeService {
  private log: ILogger = new Logger('BarcodeService');

  generateBarcode(code: string): any {
    let canvas = new (<any>Canvas)(1000, 1000, 'png');
    JsBarcode(canvas, code, {
      format: 'CODE128',
      fontSize: 20,
      background: '#fff',
      lineColor: '#000',
      margin: 20,
      width: 4,
      height: 300,
      text: code
    });

    return canvas.toBuffer('image/jpeg')
  }

  public getBarcodeFileUrl(code: string): string {
    if (!fs.existsSync('assets')) {
      fs.mkdirSync('assets');
      this.log.info('created folder assets');
    }
    if (!fs.existsSync('assets/barcodes')) {
      fs.mkdirSync('assets/barcodes');
      this.log.info('created folder assets/barcodes');
    }

    if (!fs.existsSync(`assets/barcodes/${code}.jpg`)) {
      fs.writeFileSync(`assets/barcodes/${code}.jpg`, this.generateBarcode(code));
      this.log.info(`created img ${code}.jpg`);
    }

    return `assets/barcodes/${code}.jpg`
  }
}


export const barcodeService: IBarcodeService = new BarcodeService();
