import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DB_DIR = path.join(process.cwd(), "database");
const DB_PATH = path.join(DB_DIR, "telegram_channels.db");

// На Vercel папка logo&screens не деплоится (.vercelignore). Картинки — с GitHub raw (можно переопределить через ASSETS_BASE_URL).
const ASSETS_BASE =
  process.env.ASSETS_BASE_URL ??
  process.env.BLOB_STORE_URL ??
  "https://raw.githubusercontent.com/rsn771/telegram-minimarket/main/database/logo%26screens/";

function getIconUrl(icon: string | null): string {
  if (!icon) return "https://api.dicebear.com/7.x/shapes/svg?seed=default";
  if (icon.startsWith("http://") || icon.startsWith("https://")) return icon;
  if (ASSETS_BASE) return ASSETS_BASE + encodeURIComponent(icon);
  return `/api/static?file=${encodeURIComponent(icon)}`;
}

function parseScreenshots(screenshotsPath: string | null): string[] {
  if (!screenshotsPath || typeof screenshotsPath !== "string") return [];
  const base = ASSETS_BASE || "";
  return screenshotsPath
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((f) => (base ? base + encodeURIComponent(f) : `/api/static?file=${encodeURIComponent(f)}`));
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
  short_description?: string;
};

function ensureDbExists(): void {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
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
        screenshots_path TEXT,
        short_description TEXT DEFAULT ''
      );
    `);
    db.close();
  } catch (error) {
    console.error("Error ensuring channels database exists:", error);
    throw error;
  }
}

function ensureColumns(db: InstanceType<typeof Database>): void {
  const info = db.prepare("PRAGMA table_info(channels)").all() as { name: string }[];
  const names = new Set(info.map((c) => c.name));
  if (!names.has("category")) {
    db.prepare("ALTER TABLE channels ADD COLUMN category TEXT DEFAULT 'Утилиты'").run();
  }
  if (!names.has("screenshots_path")) {
    db.prepare("ALTER TABLE channels ADD COLUMN screenshots_path TEXT").run();
  }
  if (!names.has("short_description")) {
    db.prepare("ALTER TABLE channels ADD COLUMN short_description TEXT DEFAULT ''").run();
  }
}

/** Выбираем только существующие столбцы (для старых БД без short_description). */
function getSelectCols(db: InstanceType<typeof Database>): string {
  const info = db.prepare("PRAGMA table_info(channels)").all() as { name: string }[];
  const existing = new Set(info.map((c) => c.name));
  const wanted = [
    "idminiapp",
    "title",
    "description",
    "icon",
    "url",
    "is_verified",
    "rating",
    "category",
    "screenshots_path",
    "short_description",
  ];
  return wanted.filter((col) => existing.has(col)).join(", ");
}

function toChannel(row: ChannelRow): {
  id: string;
  name: string;
  category: string;
  icon: string;
  url: string;
  description: string;
  rating: number;
  isVerified: boolean;
  screenshots: string[];
  shortDescription: string;
} {
  return {
    id: String(row.idminiapp),
    name: row.title,
    category: row.category ?? "Утилиты",
    icon: getIconUrl(row.icon),
    url: row.url ?? "",
    description: row.description ?? "",
    rating: Number(row.rating) || 0,
    isVerified: Boolean(row.is_verified),
    screenshots: parseScreenshots(row.screenshots_path ?? null),
    shortDescription: row.short_description ?? "",
  };
}

export async function GET(request: Request) {
  if (!fs.existsSync(DB_PATH)) {
    return NextResponse.json([]);
  }

  let db: InstanceType<typeof Database> | undefined;
  try {
    ensureDbExists();
    db = new Database(DB_PATH, { readonly: true });
  } catch (e) {
    try {
      db = new Database(DB_PATH, { readonly: false });
    } catch {
      return NextResponse.json([]);
    }
  }

  try {
    try {
      ensureColumns(db);
    } catch {
      // readonly — колонки не добавить, продолжаем
    }

    const selectCols = getSelectCols(db);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const row = db.prepare(`SELECT ${selectCols} FROM channels WHERE idminiapp = ?`).get(id) as ChannelRow | undefined;
      if (!row) {
        db.close();
        return NextResponse.json({ error: "Канал не найден" }, { status: 404 });
      }
      const channel = toChannel(row);
      db.close();
      return NextResponse.json(channel);
    }

    const search = searchParams.get("search");
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

    const channels = rows.map((row) => toChannel(row));
    db.close();
    return NextResponse.json(channels);
  } catch (err) {
    console.error("API channels error:", err);
    if (db) {
      try {
        db.close();
      } catch {}
    }
    return NextResponse.json([]);
  }
}
