declare const process: any;
declare const Buffer: any;

declare module 'node:crypto' {
  export function createHash(name: string): any;
}
declare module 'node:fs/promises' {
  export const mkdir: any;
  export const writeFile: any;
  export const readFile: any;
  export const stat: any;
  export const mkdtemp: any;
  export const rm: any;
  export const copyFile: any;
}
declare module 'node:path' {
  export const join: any;
  export const relative: any;
  export const resolve: any;
  export const basename: any;
}
declare module 'node:os' {
  export const tmpdir: any;
}
declare module 'node:sqlite' {
  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): any;
    close(): void;
  }
}
