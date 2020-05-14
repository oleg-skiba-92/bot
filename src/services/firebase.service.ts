import * as admin from 'firebase-admin';

export interface IFirebaseService {
  initialise(): Promise<boolean>;

  getList<T>(path: string): Promise<T[]>;

  getObject<T>(path: string): Promise<T>;

  setObject<T>(path: string, data: T): Promise<T>;

  pushToList<T>(path: string, data: T): Promise<T>;

  getObjectByParam<T>(path: string, key: string, value: number | string): Promise<T>;

  removeObject(path: string): Promise<void>;
}

class FirebaseService implements IFirebaseService {
  private app: admin.app.App;
  private db: admin.database.Database;

  public async initialise(): Promise<boolean> {
    this.app = admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FB_CERT)),
      databaseURL: process.env.FB_DB_URL
    });
    if (this.app) {
      this.db = this.app.database();
      return true;

    } else {
      return false;
    }
  }

  public getList<T>(path: string): Promise<T[]> {
    return this.db.ref(path).once('value')
      .then((snapshot) => {
        let _arr = [];
        snapshot.forEach((snapshotChild) => {
          _arr.push(snapshotChild.val());
        });

        return _arr;
      });
  }

  public getObject<T>(path: string): Promise<T> {
    return this.db.ref(path).once('value')
      .then((snapshot) => snapshot.val());
  }

  public setObject<T>(path: string, data: T): Promise<T> {
    return this.db.ref(path).set(data)
      .then(() => data);
  }

  public removeObject(path: string): Promise<void> {
    return this.db.ref(path).remove();
  }

  public getObjectByParam<T>(path: string, key: string, value: number | string): Promise<T> {
    return this.db.ref(path)
      .orderByChild(key)
      .equalTo(value)
      .once('value')
      .then((snapshot) => {
        let item = null;
        snapshot.forEach((snapshotChild) => {
          item = snapshotChild.val();
        });

        return item;
      });
  }

  public pushToList<T>(path: string, data: T): Promise<T> {
    return this.db.ref(path).push(data)
      .then(() => data);

  }
}

export const firebaseService: IFirebaseService = new FirebaseService();
