import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_DIR = path.join(process.cwd(), "database");
const IS_VERCEL = !!process.env.VERCEL;
// Локально работаем с файлом в репозитории, на Vercel пишем во временную директорию (/tmp),
// т.к. файловая система билда только для чтения.
const RUNTIME_REVIEWS_DIR = IS_VERCEL ? process.env.TMPDIR || "/tmp" : DB_DIR;
const REVIEWS_DB_PATH = path.join(RUNTIME_REVIEWS_DIR, "reviews.db");
const CHANNELS_DB_PATH = path.join(DB_DIR, "telegram_channels.db");

function ensureReviewsDbExists(): void {
  try {
    if (!fs.existsSync(RUNTIME_REVIEWS_DIR)) {
      fs.mkdirSync(RUNTIME_REVIEWS_DIR, { recursive: true });
    }
    const db = new Database(REVIEWS_DB_PATH);
    db.exec(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        idminiapp TEXT NOT NULL,
        username TEXT NOT NULL DEFAULT 'Пользователь',
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        text TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      );
    `);
    db.close();
  } catch (error) {
    console.error("Error ensuring reviews database exists:", error);
    throw error;
  }
}

// Функция удалена, теперь используем ensureReviewsDbExists()

/**
 * Раньше эта функция пересчитывала рейтинг и писала его в telegram_channels.db.
 * На Vercel файлы БД только для чтения, поэтому любые UPDATE вызывают SQLITE_READONLY.
 *
 * Сейчас пересчёт рейтинга выполняется «на лету» в /api/channels,
 * поэтому здесь ничего писать в БД НЕ НУЖНО.
 */
function updateAppRating(_idminiapp: string): void {
  // no-op: рейтинг считается при выборке каналов из отдельной БД отзывов
}

type ReviewRow = {
  id: number;
  idminiapp: string;
  username: string;
  rating: number;
  text: string;
  created_at: string;
};

function toReview(row: ReviewRow) {
  return {
    id: row.id,
    idminiapp: row.idminiapp,
    username: row.username,
    rating: row.rating,
    text: row.text,
    createdAt: row.created_at,
  };
}

export async function GET(request: Request) {
  try {
    ensureReviewsDbExists();

    const { searchParams } = new URL(request.url);
    const idminiapp = searchParams.get("idminiapp");

    if (!idminiapp) {
      return NextResponse.json({ error: "Не указан idminiapp" }, { status: 400 });
    }

    if (!fs.existsSync(REVIEWS_DB_PATH)) {
      return NextResponse.json([]);
    }

    const db = new Database(REVIEWS_DB_PATH, { readonly: true });

    const rows = db.prepare(`
      SELECT id, idminiapp, username, rating, text, created_at
      FROM reviews
      WHERE idminiapp = ?
      ORDER BY created_at DESC
    `).all(idminiapp) as ReviewRow[];

    db.close();

    const reviews = rows.map(toReview);

    return NextResponse.json(reviews);
  } catch (err) {
    console.error("API reviews GET error:", err);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    ensureReviewsDbExists();

    const body = await request.json();
    const { idminiapp, rating, text } = body;

    if (!idminiapp || typeof idminiapp !== "string") {
      return NextResponse.json({ error: "Не указан idminiapp" }, { status: 400 });
    }

    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Неверная оценка (должна быть от 1 до 5)" }, { status: 400 });
    }

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "Текст отзыва не может быть пустым" }, { status: 400 });
    }

    // Проверяем, существует ли приложение в БД каналов
    if (fs.existsSync(CHANNELS_DB_PATH)) {
      const channelsDb = new Database(CHANNELS_DB_PATH, { readonly: true });
      const channelExists = channelsDb.prepare("SELECT 1 FROM channels WHERE idminiapp = ?").get(idminiapp);
      channelsDb.close();
      
      if (!channelExists) {
        return NextResponse.json({ error: "Приложение не найдено" }, { status: 404 });
      }
    }

    if (!fs.existsSync(REVIEWS_DB_PATH)) {
      return NextResponse.json({ error: "База данных отзывов недоступна" }, { status: 500 });
    }

    // Добавляем отзыв в БД отзывов
    const db = new Database(REVIEWS_DB_PATH, { readonly: false });
    const result = db.prepare(`
      INSERT INTO reviews (idminiapp, username, rating, text, created_at)
      VALUES (?, 'Пользователь', ?, ?, datetime('now', 'localtime'))
    `).run(idminiapp, rating, text.trim());

    // Обновляем рейтинг приложения на основе всех отзывов
    updateAppRating(idminiapp);

    db.close();

    return NextResponse.json({
      id: result.lastInsertRowid,
      idminiapp,
      username: "Пользователь",
      rating,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    }, { status: 201 });
  } catch (err) {
    console.error("API reviews POST error:", err);
    return NextResponse.json({ error: "Ошибка при добавлении отзыва" }, { status: 500 });
  }
}
