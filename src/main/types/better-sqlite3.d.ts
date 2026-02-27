declare module 'better-sqlite3' {
  export interface Statement {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    iterate(...params: unknown[]): IterableIterator<unknown>;
  }

  export default class Database {
    constructor(filename: string);
    pragma(source: string): unknown;
    exec(sql: string): void;
    prepare(sql: string): Statement;
    transaction<T extends (...args: unknown[]) => unknown>(fn: T): T;
    close(): void;
  }
}
