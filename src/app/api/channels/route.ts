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
  try {
    // Создаем директорию, если её нет
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    
    // Проверяем существование файла БД
    const dbExists = fs.existsSync(DB_PATH);
    
    const db = new Database(DB_PATH);
    
    // Создаем таблицы только если БД не существовала или если таблиц нет
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
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        idminiapp TEXT NOT NULL,
        username TEXT NOT NULL DEFAULT 'Пользователь',
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        text TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (idminiapp) REFERENCES channels(idminiapp)
      );
    `);
    db.close();
  } catch (error) {
    console.error("Error ensuring database exists:", error);
    throw error;
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

function ensureReviewsTable(db: Database.Database) {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='reviews'").get() as { name: string } | undefined;
  if (!tables) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        idminiapp TEXT NOT NULL,
        username TEXT NOT NULL DEFAULT 'Пользователь',
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        text TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (idminiapp) REFERENCES channels(idminiapp)
      );
    `);
  }
}

/**
 * Вычисляет средний рейтинг из отзывов для приложения
 * Округляет до десятых (1 знак после запятой)
 */
function calculateRatingFromReviews(db: Database.Database, idminiapp: string): number {
  const reviews = db.prepare(`
    SELECT rating FROM reviews WHERE idminiapp = ?
  `).all(idminiapp) as { rating: number }[];

  if (reviews.length === 0) {
    return 0;
  }

  // Вычисляем среднее значение
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  const average = sum / reviews.length;
  
  // Округляем до десятых (1 знак после запятой)
  return Math.round(average * 10) / 10;
}

function toChannel(row: ChannelRow, db?: Database.Database) {
  // Если передан db, вычисляем рейтинг из отзывов для актуальности
  // Иначе используем значение из БД (которое должно быть обновлено при добавлении отзывов)
  let rating = row.rating ?? 0;
  if (db) {
    const calculatedRating = calculateRatingFromReviews(db, row.idminiapp);
    // Всегда используем вычисленный рейтинг из отзывов для актуальности
    rating = calculatedRating;
  }

  return {
    id: String(row.idminiapp),
    name: row.title,
    category: row.category || "Утилиты",
    icon: getIconUrl(row.icon),
    url: row.url || "",
    description: row.description || "",
    rating: Math.round(rating * 10) / 10, // Округляем до десятых для отображения
    isVerified: Boolean(row.is_verified),
    screenshots: parseScreenshots(row.screenshots_path ?? null),
  };
}

export async function GET(request: Request) {
  let db: Database.Database | null = null;
  try {
    // Проверяем существование базы данных
    if (!fs.existsSync(DB_PATH)) {
      console.error(`Database file not found at: ${DB_PATH}`);
      return NextResponse.json(
        {
          error: "База данных не найдена",
          details: `Путь: ${DB_PATH}`,
        },
        { status: 500 }
      );
    }

    ensureDbExists();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const search = searchParams.get("search");

    try {
      // Пытаемся открыть в режиме только для чтения сначала (для продакшена)
      // Если это не сработает, пробуем в режиме записи
      try {
        db = new Database(DB_PATH, { readonly: true });
      } catch (readonlyError) {
        // Если readonly не работает, пробуем обычный режим
        db = new Database(DB_PATH, { readonly: false });
      }
    } catch (dbError) {
      console.error("Failed to open database:", dbError);
      return NextResponse.json(
        {
          error: "Не удалось открыть базу данных",
          details: dbError instanceof Error ? dbError.message : String(dbError),
        },
        { status: 500 }
      );
    }

    // Пытаемся обновить структуру БД только если не в readonly режиме
    try {
      ensureColumns(db);
      ensureReviewsTable(db); // Убеждаемся, что таблица reviews существует
    } catch (schemaError) {
      // Игнорируем ошибки схемы в readonly режиме - таблицы должны уже существовать
      console.warn("Could not update schema (readonly mode?):", schemaError);
    }

    const selectCols =
      "idminiapp, title, description, icon, url, is_verified, rating, category, screenshots_path";

    if (id) {
      const row = db.prepare(`SELECT ${selectCols} FROM channels WHERE idminiapp = ?`).get(id) as
        | ChannelRow
        | undefined;

      if (!row) {
        db.close();
        return NextResponse.json({ error: "Канал не найден" }, { status: 404 });
      }

      const channel = toChannel(row, db);
      db.close();
      return NextResponse.json(channel);
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

    const channels = rows.map((row) => toChannel(row, db));
    db.close();

    return NextResponse.json(channels);
  } catch (err) {
    console.error("API channels error:", err);
    if (db) {
      try {
        db.close();
      } catch (closeError) {
        console.error("Error closing database:", closeError);
      }
    }
    return NextResponse.json(
      {
        error: "Ошибка при загрузке данных",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
