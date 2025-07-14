import sqlite3 from 'sqlite3';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export class Database {
  private db: sqlite3.Database;

  constructor(databasePath: string) {
    this.db = new sqlite3.Database(databasePath);
  }

  async initialize(): Promise<void> {
    const schemaPath = join(import.meta.dir, 'schema.sql');
    const schema = await readFile(schemaPath, 'utf-8');
    
    return new Promise((resolve, reject) => {
      this.db.exec(schema, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async run(sql: string, params: any[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row as T);
      });
    });
  }

  async all<T>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as T[]);
      });
    });
  }

  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.db.run('BEGIN TRANSACTION', async (err) => {
        if (err) return reject(err);
        
        try {
          const result = await fn();
          this.db.run('COMMIT', (err) => {
            if (err) reject(err);
            else resolve(result);
          });
        } catch (error) {
          this.db.run('ROLLBACK', () => {
            reject(error);
          });
        }
      });
    });
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}