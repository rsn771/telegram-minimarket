#!/usr/bin/env node
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "database", "telegram_channels.db");
const Database = (await import("better-sqlite3")).default;
const db = new Database(DB_PATH);
const stmt = db.prepare(`UPDATE channels SET category = 'Пробив' WHERE LOWER(title) LIKE '%funstat%' OR LOWER(title) LIKE '%himera%'`);
const result = stmt.run();
db.close();
console.log("Обновлено записей:", result.changes);
