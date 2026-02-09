import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DB_DIR = path.join(process.cwd(), "database");
const IS_VERCEL = !!process.env.VERCEL;
const USE_KV =
  IS_VERCEL && !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
// Локально работаем с SQLite файлом в репозитории, на Vercel используем KV для постоянного хранения
const RUNTIME_REVIEWS_DIR = IS_VERCEL ? process.env.TMPDIR || "/tmp" : DB_DIR;
const REVIEWS_DB_PATH = path.join(RUNTIME_REVIEWS_DIR, "reviews.db");
const CHANNELS_DB_PATH = path.join(DB_DIR, "telegram_channels.db");

// KV ключ для хранения всех отзывов
const KV_REVIEWS_KEY = "reviews:all";

type Review = {
  id: number;
  idminiapp: string;
  username: string;
  rating: number;
  text: string;
  createdAt: string;
};

async function getKvClient(): Promise<null | { get: (key: string) => Promise<any>; set: (key: string, value: any) => Promise<any> }> {
  if (!USE_KV) return null;
  try {
    const mod = await import("@vercel/kv");
    return mod.kv as any;
  } catch {
    return null;
  }
}

// Работа с SQLite (локально)
function ensureReviewsDbExists(): void {
  if (USE_KV) return; // На проде используем KV
  
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

// Получение отзывов из SQLite
async function getReviewsFromSQLite(idminiapp: string): Promise<Review[]> {
  if (!fs.existsSync(REVIEWS_DB_PATH)) {
    return [];
  }

  const db = new Database(REVIEWS_DB_PATH, { readonly: true });
  const rows = db.prepare(`
    SELECT id, idminiapp, username, rating, text, created_at as createdAt
    FROM reviews
    WHERE idminiapp = ?
    ORDER BY created_at DESC
  `).all(idminiapp) as Review[];

  db.close();
  return rows;
}

// Сохранение отзыва в SQLite
async function saveReviewToSQLite(review: { idminiapp: string; rating: number; text: string }): Promise<Review> {
  ensureReviewsDbExists();

  const db = new Database(REVIEWS_DB_PATH, { readonly: false });
  const result = db.prepare(`
    INSERT INTO reviews (idminiapp, username, rating, text, created_at)
    VALUES (?, 'Пользователь', ?, ?, datetime('now', 'localtime'))
  `).run(review.idminiapp, review.rating, review.text.trim());

  const createdAt = new Date().toISOString();
  db.close();

  return {
    id: Number(result.lastInsertRowid),
    ...review,
    username: "Пользователь",
    createdAt,
  };
}

// Получение всех отзывов из KV
async function getAllReviewsFromKV(): Promise<Review[]> {
  const kv = await getKvClient();
  if (!kv) return [];
  try {
    const reviews = (await kv.get(KV_REVIEWS_KEY)) as Review[] | null;
    return reviews || [];
  } catch (error) {
    console.error("Error getting reviews from KV:", error);
    return [];
  }
}

// Получение отзывов для конкретного приложения из KV
async function getReviewsFromKV(idminiapp: string): Promise<Review[]> {
  const allReviews = await getAllReviewsFromKV();
  return allReviews
    .filter((r) => r.idminiapp === idminiapp)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// Сохранение отзыва в KV
async function saveReviewToKV(review: { idminiapp: string; rating: number; text: string }): Promise<Review> {
  const kv = await getKvClient();
  if (!kv) throw new Error("KV is not available");
  
  const allReviews = await getAllReviewsFromKV();
  
  // Генерируем новый ID
  const maxId = allReviews.length > 0 
    ? Math.max(...allReviews.map((r) => r.id))
    : 0;
  const newId = maxId + 1;
  
  const newReview: Review = {
    id: newId,
    ...review,
    username: "Пользователь",
    createdAt: new Date().toISOString(),
  };

  // Добавляем новый отзыв и сохраняем обратно в KV
  allReviews.push(newReview);
  await kv.set(KV_REVIEWS_KEY, allReviews);

  return newReview;
}

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idminiapp = searchParams.get("idminiapp");

    if (!idminiapp) {
      return NextResponse.json({ error: "Не указан idminiapp" }, { status: 400 });
    }

    let reviews: Review[];

    if (USE_KV) {
      reviews = await getReviewsFromKV(idminiapp);
    } else {
      ensureReviewsDbExists();
      reviews = await getReviewsFromSQLite(idminiapp);
    }

    return NextResponse.json(reviews);
  } catch (err) {
    console.error("API reviews GET error:", err);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
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

    let newReview: Review;

    if (USE_KV) {
      newReview = await saveReviewToKV({ idminiapp, rating, text });
    } else {
      ensureReviewsDbExists();
      newReview = await saveReviewToSQLite({ idminiapp, rating, text });
    }

    // Обновляем рейтинг приложения на основе всех отзывов
    updateAppRating(idminiapp);

    return NextResponse.json(newReview, { status: 201 });
  } catch (err) {
    console.error("API reviews POST error:", err);
    return NextResponse.json({ error: "Ошибка при добавлении отзыва" }, { status: 500 });
  }
}
