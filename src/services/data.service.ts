import { Client } from 'pg';
import { EDataEntity, EUsersColumns, IDataTable } from '../models/data.model';
import { ILogger, Logger } from './logger';

const TABLES: IDataTable[] = [
  {
    name: EDataEntity.Users,
    cols: [
      {name: EUsersColumns.Phone, type: 'VARCHAR(10)', keys: ['UNIQUE', 'PRIMARY KEY']},
      {name: EUsersColumns.Telegram, type: 'VARCHAR(50)', keys: []},
      {name: EUsersColumns.Viber, type: 'VARCHAR(50)', keys: []},
    ]
  }
];

export interface IDataService {
  initialise(): Promise<boolean>;

  getObject<T>(entity: string, key: string, value: string | number): Promise<T>;

  createObject<T>(entity: string, data: T): Promise<T>;

  updateObject<T>(entity: string, key: string, value: string, data: T): Promise<T>;
}

class DataService implements IDataService {
  private client: Client;
  private log: ILogger = new Logger('DataService');

  public async initialise(): Promise<boolean> {
    try {
      this.client = new Client({
        host: process.env.DB_HOST,
        port: +process.env.DB_PORT,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
      });
      await this.client.connect();
    } catch (e) {
      this.log.error(`Database initialise error: ${e.message}`, e.stack);
      return false;
    }


    try {
      await this.initialiseTables(TABLES);
    } catch (e) {
      this.log.error(`Data tables initialise error: ${e.message}`, e.stack);
      return false;
    }

    return true;
  }

  public getObject<T>(entity: string, key: string, value: string | number): Promise<T> {
    const query = `SELECT * FROM ${entity} WHERE ${key} = $1`;

    return this.client.query<T>(query, [value])
      .then((res) => res.rows.length === 0 ? null : res.rows[0]);
  }

  public createObject<T>(entity: string, data: T): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);

    const query = `INSERT INTO ${entity}(${keys.join(', ')}) 
      VALUES(${values.map((v, i) => `$${i + 1}`)})
      ON CONFLICT DO NOTHING
      RETURNING *`;

    return this.client.query<T>(query, values)
      .then((res) => res.rows.length === 0 ? null : res.rows[0]);
  }

  public updateObject<T>(entity: string, key: string, value: string, data: T): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);

    const query = `UPDATE ${entity} 
      SET ${keys.map((k, i) => `${k} = $${i + 1}`).join(', ')}
      WHERE ${key} = '${value}'
      RETURNING *`;

    return this.client.query<T>(query, values)
      .then((res) => res.rows.length === 0 ? null : res.rows[0]);
  }

  private initialiseTables(tables: IDataTable[]): Promise<any[]> {
    return Promise.all(tables.map((table) => {
      const cols = table.cols.map((col) => [col.name, col.type, ...col.keys].join(' '));
      const query = `CREATE TABLE IF NOT EXISTS ${table.name} (${cols.join(', ')});`;
      return this.client.query(query)
    }))
  }
}

export const dataService: IDataService = new DataService();
