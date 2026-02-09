import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_DIR = path.join(process.cwd(), "database");
const DB_PATH = path.join(DB_DIR, "telegram_channels.db");
const REVIEWS_DB_PATH = path.join(DB_DIR, "reviews.db");

// Проверяем, что better-sqlite3 доступен
let sqliteAvailable = true;
try {
  require.resolve("better-sqlite3");
} catch {
  sqliteAvailable = false;
  console.warn("better-sqlite3 not available, database operations will fail");
}

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
    
    // Создаем БД для каналов
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
  } catch (error) {
    console.error("Error ensuring channels database exists:", error);
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

function ensureReviewsDbExists(): void {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    
    const reviewsDb = new Database(REVIEWS_DB_PATH);
    reviewsDb.exec(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        idminiapp TEXT NOT NULL,
        username TEXT NOT NULL DEFAULT 'Пользователь',
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        text TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      );
    `);
    reviewsDb.close();
  } catch (error) {
    console.error("Error ensuring reviews database exists:", error);
    // Не бросаем ошибку, чтобы не блокировать работу с каналами
  }
}

/**
 * Вычисляет средний рейтинг из отзывов для приложения
 * Округляет до десятых (1 знак после запятой)
 * Использует отдельную БД для отзывов
 */
function calculateRatingFromReviews(idminiapp: string): number {
  try {
    if (!fs.existsSync(REVIEWS_DB_PATH)) {
      return 0;
    }
    
    const reviewsDb = new Database(REVIEWS_DB_PATH, { readonly: true });
    const reviews = reviewsDb.prepare(`
      SELECT rating FROM reviews WHERE idminiapp = ?
    `).all(idminiapp) as { rating: number }[];
    reviewsDb.close();

    if (reviews.length === 0) {
      return 0;
    }

    // Вычисляем среднее значение
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const average = sum / reviews.length;
    
    // Округляем до десятых (1 знак после запятой)
    return Math.round(average * 10) / 10;
  } catch (error) {
    console.error("Error calculating rating from reviews:", error);
    return 0;
  }
}

function toChannel(row: ChannelRow) {
  // Вычисляем рейтинг из отдельной БД отзывов
  const calculatedRating = calculateRatingFromReviews(row.idminiapp);
  // Используем вычисленный рейтинг из отзывов, если он есть, иначе значение из БД
  const rating = calculatedRating > 0 ? calculatedRating : (row.rating ?? 0);

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
  let db: Database.Database | undefined = undefined;
  try {
    // Проверяем доступность SQLite
    if (!sqliteAvailable) {
      console.error("better-sqlite3 is not available");
      // Возвращаем пустой массив вместо ошибки
      return NextResponse.json([]);
    }
    
    // Логируем информацию о среде выполнения
    console.log("API channels GET called");
    console.log("DB_PATH:", DB_PATH);
    console.log("process.cwd():", process.cwd());
    console.log("fs.existsSync(DB_PATH):", fs.existsSync(DB_PATH));
    
    // Проверяем существование базы данных
    if (!fs.existsSync(DB_PATH)) {
      console.error(`Database file not found at: ${DB_PATH}`);
      console.error("Current working directory:", process.cwd());
      console.error("DB_DIR exists:", fs.existsSync(DB_DIR));
      
      // Пытаемся найти базу данных в других возможных местах
      const altPaths = [
        path.join(process.cwd(), "database", "telegram_channels.db"),
        path.join("/tmp", "telegram_channels.db"),
      ];
      
      for (const altPath of altPaths) {
        if (fs.existsSync(altPath)) {
          console.log(`Found database at alternative path: ${altPath}`);
        }
      }
      
      // Возвращаем пустой массив вместо ошибки
      console.warn("Database not found, returning empty array");
      return NextResponse.json([]);
    }

    try {
      ensureDbExists();
    } catch (ensureError) {
      console.error("Error in ensureDbExists:", ensureError);
      // Продолжаем выполнение, возможно БД уже существует
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const search = searchParams.get("search");

    try {
      // Пытаемся открыть в режиме только для чтения сначала (для продакшена)
      // Если это не сработает, пробуем в режиме записи
      try {
        console.log("Attempting to open database in readonly mode...");
        db = new Database(DB_PATH, { readonly: true });
        console.log("Database opened successfully in readonly mode");
      } catch (readonlyError) {
        console.warn("Readonly mode failed, trying write mode:", readonlyError);
        // Если readonly не работает, пробуем обычный режим
        try {
          db = new Database(DB_PATH, { readonly: false });
          console.log("Database opened successfully in write mode");
        } catch (writeError) {
          console.error("Write mode also failed:", writeError);
          throw writeError;
        }
      }
    } catch (dbError) {
      console.error("Failed to open database:", dbError);
      console.error("Error details:", {
        message: dbError instanceof Error ? dbError.message : String(dbError),
        stack: dbError instanceof Error ? dbError.stack : undefined,
        code: (dbError as any)?.code,
      });
      // Возвращаем пустой массив вместо ошибки
      console.warn("Returning empty array due to database open error");
      return NextResponse.json([]);
    }

    // Пытаемся обновить структуру БД только если не в readonly режиме
    try {
      ensureColumns(db);
    } catch (schemaError) {
      // Игнорируем ошибки схемы в readonly режиме - таблицы должны уже существовать
      console.warn("Could not update schema (readonly mode?):", schemaError);
    }
    
    // Убеждаемся, что БД отзывов существует (не блокируем работу, если не получится)
    try {
      ensureReviewsDbExists();
    } catch (reviewsDbError) {
      console.warn("Could not ensure reviews database exists:", reviewsDbError);
    }

    const selectCols =
      "idminiapp, title, description, icon, url, is_verified, rating, category, screenshots_path";

    if (id) {
      const row = db.prepare(`SELECT ${selectCols} FROM channels WHERE idminiapp = ?`).get(id) as
        | ChannelRow
        | undefined;

      if (!row) {
        if (db) {
          db.close();
        }
        return NextResponse.json({ error: "Канал не найден" }, { status: 404 });
      }

      const channel = toChannel(row);
      if (db) {
        db.close();
      }
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

    console.log(`Found ${rows.length} channels`);

    const channels = rows.map((row) => toChannel(row));
    if (db) {
      db.close();
    }

    console.log(`Returning ${channels.length} channels`);
    return NextResponse.json(channels);
  } catch (err) {
    console.error("API channels error:", err);
    console.error("Error stack:", err instanceof Error ? err.stack : undefined);
    if (db) {
      try {
        db.close();
      } catch (closeError) {
        console.error("Error closing database:", closeError);
      }
    }
    
    // Возвращаем пустой массив вместо ошибки, чтобы приложение не падало
    // Это позволит приложению работать даже если БД недоступна
    console.warn("Returning empty array due to database error");
    return NextResponse.json([]);
  }
}
