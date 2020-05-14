import * as JsBarcode from 'jsbarcode';
import { Canvas } from 'canvas';
import * as fs from 'fs';

export interface IBarcodeService {
  generateBarcode(code: string): Buffer;

  getBarcodeFileUrl(code: string): string;
}

class BarcodeService implements IBarcodeService {
  generateBarcode(code: string): any {
    let canvas = new (<any>Canvas)(500, 300, 'png');
    JsBarcode(canvas, code, {
      format: 'CODE128',
      fontSize: 20,
      background: '#fff',
      lineColor: '#000',
      margin: 20,
      text: code
    });

    return canvas.toBuffer('image/jpeg')
  }

  public getBarcodeFileUrl(code: string): string {
    if (!fs.existsSync('assets')) {
      fs.mkdirSync('assets');
    }
    if (!fs.existsSync('assets/barcodes')) {
      fs.mkdirSync('assets/barcodes');
    }

    if (!fs.existsSync(`assets/barcodes/${code}.jpg`)) {
      fs.writeFileSync(`assets/barcodes/${code}.jpg`, this.generateBarcode(code));
    }

    return `${process.env.BASE_URL}/assets/barcodes/${code}.jpg`
  }
}


export const barcodeService: IBarcodeService = new BarcodeService();
