declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(path: string, options?: { readOnly?: boolean });
    prepare(sql: string): {
      all(...params: Array<string | number | null>): Record<string, unknown>[];
      get(...params: Array<string | number | null>): Record<string, unknown> | undefined;
    };
    close(): void;
  }
}
