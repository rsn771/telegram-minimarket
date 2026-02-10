declare module "better-sqlite3" {
  const Database: any;
  export default Database;
}

declare module "@neondatabase/serverless" {
  export function neon(
    connectionString: string
  ): <T = any>(
    strings: TemplateStringsArray,
    ...values: any[]
  ) => Promise<T[]>;
}

