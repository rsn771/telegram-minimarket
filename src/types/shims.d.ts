// Type shims for environments where node_modules typings
// are not present during analysis. Vercel/CI will normally
// install proper packages, so these act as a safe fallback.

declare module "better-sqlite3" {
  const Database: any;
  export default Database;
}

declare module "@vercel/kv" {
  export const kv: any;
}

