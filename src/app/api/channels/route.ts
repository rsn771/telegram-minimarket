import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_DIR = path.join(process.cwd(), "database");
const DB_PATH = path.join(DB_DIR, "telegram_channels.db");

function getIconUrl(icon: string | null): string {
  if (!icon) return "https://api.dicebear.com/7.x/shapes/svg?seed=default";
  if (icon.startsWith("http://") || icon.startsWith("https://")) return icon;
  return `/api/static?file=${encodeURIComponent(icon)}`;
}

function parseScreenshots(screenshotsPath: string | null): string[] {
  if (!screenshotsPath || typeof screenshotsPath !== "string") return [];
  return screenshotsPath
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((f) => `/api/static?file=${encodeURIComponent(f)}`);
}

type ChannelRow = {
  idminiapp: string;
  title: string;
  description: string;
  icon: string;
  url: string;
  is_verified: number;
  rating: number;
  category?: string;
  screenshots_path?: string;
};

function ensureDbExists(): void {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
    const db = new Database(DB_PATH);
    db.exec(`
      CREATE TABLE IF NOT EXISTS channels (
        idminiapp TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        url TEXT,
        is_verified INTEGER DEFAULT 0,
        rating REAL DEFAULT 0,
        category TEXT DEFAULT 'Утилиты',
        screenshots_path TEXT
      );
    `);
    db.close();
  }
}

function ensureColumns(db: Database.Database) {
  const info = db.prepare("PRAGMA table_info(channels)").all() as { name: string }[];
  const names = new Set(info.map((c) => c.name));
  if (!names.has("category")) {
    db.prepare("ALTER TABLE channels ADD COLUMN category TEXT DEFAULT 'Утилиты'").run();
  }
  if (!names.has("screenshots_path")) {
    db.prepare("ALTER TABLE channels ADD COLUMN screenshots_path TEXT").run();
  }
}

function toChannel(row: ChannelRow) {
  return {
    id: String(row.idminiapp),
    name: row.title,
    category: row.category || "Утилиты",
    icon: getIconUrl(row.icon),
    url: row.url || "",
    description: row.description || "",
    rating: row.rating ?? 0,
    isVerified: Boolean(row.is_verified),
    screenshots: parseScreenshots(row.screenshots_path ?? null),
  };
}

export async function GET(request: Request) {
  try {
    ensureDbExists();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const search = searchParams.get("search");

    const db = new Database(DB_PATH, { readonly: false });
    ensureColumns(db);

    const selectCols =
      "idminiapp, title, description, icon, url, is_verified, rating, category, screenshots_path";

    if (id) {
      const row = db.prepare(`SELECT ${selectCols} FROM channels WHERE idminiapp = ?`).get(id) as
        | ChannelRow
        | undefined;

      db.close();

      if (!row) {
        return NextResponse.json({ error: "Канал не найден" }, { status: 404 });
      }

      return NextResponse.json(toChannel(row));
    }

    let rows: ChannelRow[];

    if (search) {
      const stmt = db.prepare(`
        SELECT ${selectCols} FROM channels WHERE title LIKE ? OR description LIKE ?
      `);
      const pattern = `%${search}%`;
      rows = stmt.all(pattern, pattern) as ChannelRow[];
    } else {
      rows = db.prepare(`SELECT ${selectCols} FROM channels`).all() as ChannelRow[];
    }

    db.close();

    const channels = rows.map(toChannel);

    return NextResponse.json(channels);
  } catch (err) {
    console.error("API channels error:", err);
    return NextResponse.json(
      {
        error:
          "Ошибка при загрузке данных. Проверьте, что папка database доступна и при необходимости скопируйте telegram_channels.db.",
      },
      { status: 500 }
    );
  }
}
