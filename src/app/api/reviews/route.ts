import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DB_DIR = path.join(process.cwd(), "database");
const IS_VERCEL = !!process.env.VERCEL;
const DATABASE_URL = process.env.DATABASE_URL;
// На Vercel храним отзывы в Postgres (Neon), локально — в SQLite
const USE_POSTGRES = !!DATABASE_URL && IS_VERCEL;

// Локальная SQLite для разработки (видна в SQLiteStudio)
const RUNTIME_REVIEWS_DIR = IS_VERCEL ? process.env.TMPDIR || "/tmp" : DB_DIR;
const REVIEWS_DB_PATH = path.join(RUNTIME_REVIEWS_DIR, "reviews.db");
const CHANNELS_DB_PATH = path.join(DB_DIR, "telegram_channels.db");

type Review = {
  id: number;
  idminiapp: string;
  username: string;
  rating: number;
  text: string;
  createdAt: string;
};

function getPostgresClient() {
  if (!USE_POSTGRES || !DATABASE_URL) return null;
  return neon(DATABASE_URL);
}

// ---------- SQLite (локальная разработка) ----------

function ensureReviewsDbExists(): void {
  if (USE_POSTGRES) return; // В проде SQLite не используем

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
    console.error("Error ensuring local reviews database exists:", error);
    throw error;
  }
}

async function getReviewsFromSQLite(idminiapp: string): Promise<Review[]> {
  if (!fs.existsSync(REVIEWS_DB_PATH)) {
    return [];
  }

  const db = new Database(REVIEWS_DB_PATH, { readonly: true });
  const rows = db
    .prepare(
      `
    SELECT id, idminiapp, username, rating, text, created_at as createdAt
    FROM reviews
    WHERE idminiapp = ?
    ORDER BY created_at DESC
  `,
    )
    .all(idminiapp) as any[];
  db.close();

  return rows.map((row) => ({
    id: Number(row.id),
    idminiapp: String(row.idminiapp),
    username: String(row.username ?? "Пользователь"),
    rating: Number(row.rating),
    text: String(row.text ?? ""),
    createdAt: String(row.createdAt),
  }));
}

async function saveReviewToSQLite(review: {
  idminiapp: string;
  rating: number;
  text: string;
}): Promise<Review> {
  ensureReviewsDbExists();

  const db = new Database(REVIEWS_DB_PATH, { readonly: false });
  const result = db
    .prepare(
      `
    INSERT INTO reviews (idminiapp, username, rating, text, created_at)
    VALUES (?, 'Пользователь', ?, ?, datetime('now', 'localtime'))
  `,
    )
    .run(review.idminiapp, review.rating, review.text.trim());
  db.close();

  const createdAt = new Date().toISOString();

  return {
    id: Number(result.lastInsertRowid),
    idminiapp: review.idminiapp,
    username: "Пользователь",
    rating: review.rating,
    text: review.text.trim(),
    createdAt,
  };
}

// ---------- Postgres (облако, Vercel + Neon) ----------

async function ensureReviewsTableInPostgres(): Promise<void> {
  const sql = getPostgresClient();
  if (!sql) return;

  await sql`
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      idminiapp TEXT NOT NULL,
      username TEXT NOT NULL DEFAULT 'Пользователь',
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      text TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
}

async function getReviewsFromPostgres(idminiapp: string): Promise<Review[]> {
  const sql = getPostgresClient();
  if (!sql) return [];

  await ensureReviewsTableInPostgres();

  const rows = (await sql`
    SELECT
      id,
      idminiapp,
      username,
      rating,
      text,
      created_at
    FROM reviews
    WHERE idminiapp = ${idminiapp}
    ORDER BY created_at DESC
  `) as any[];

  return rows.map((row) => ({
    id: Number(row.id),
    idminiapp: String(row.idminiapp),
    username: String(row.username ?? "Пользователь"),
    rating: Number(row.rating),
    text: String(row.text ?? ""),
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  }));
}

async function saveReviewToPostgres(review: {
  idminiapp: string;
  rating: number;
  text: string;
}): Promise<Review> {
  const sql = getPostgresClient();
  if (!sql) {
    throw new Error("Postgres client is not available");
  }

  await ensureReviewsTableInPostgres();

  const rows = (await sql`
    INSERT INTO reviews (idminiapp, username, rating, text)
    VALUES (${review.idminiapp}, 'Пользователь', ${review.rating}, ${review.text.trim()})
    RETURNING id, idminiapp, username, rating, text, created_at
  `) as any[];

  const row = rows[0];

  return {
    id: Number(row.id),
    idminiapp: String(row.idminiapp),
    username: String(row.username ?? "Пользователь"),
    rating: Number(row.rating),
    text: String(row.text ?? ""),
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  };
}

// Раньше здесь пересчитывался рейтинг в telegram_channels.db — сейчас это делается «на лету» в /api/channels.
function updateAppRating(_idminiapp: string): void {
  // no-op
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idminiapp = searchParams.get("idminiapp");

    if (!idminiapp) {
      return NextResponse.json(
        { error: "Не указан idminiapp" },
        { status: 400 },
      );
    }

    let reviews: Review[];

    if (USE_POSTGRES) {
      reviews = await getReviewsFromPostgres(idminiapp);
    } else {
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
      return NextResponse.json(
        { error: "Не указан idminiapp" },
        { status: 400 },
      );
    }

    if (
      !rating ||
      typeof rating !== "number" ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json(
        { error: "Неверная оценка (должна быть от 1 до 5)" },
        { status: 400 },
      );
    }

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Текст отзыва не может быть пустым" },
        { status: 400 },
      );
    }

    // Проверяем, что мини-приложение существует в локальной БД каналов
    if (fs.existsSync(CHANNELS_DB_PATH)) {
      const channelsDb = new Database(CHANNELS_DB_PATH, { readonly: true });
      const channelExists = channelsDb
        .prepare("SELECT 1 FROM channels WHERE idminiapp = ?")
        .get(idminiapp);
      channelsDb.close();

      if (!channelExists) {
        return NextResponse.json(
          { error: "Приложение не найдено" },
          { status: 404 },
        );
      }
    }

    let newReview: Review;

    if (USE_POSTGRES) {
      newReview = await saveReviewToPostgres({ idminiapp, rating, text });
    } else {
      newReview = await saveReviewToSQLite({ idminiapp, rating, text });
    }

    updateAppRating(idminiapp);

    return NextResponse.json(newReview, { status: 201 });
  } catch (err) {
    console.error("API reviews POST error:", err);
    return NextResponse.json(
      { error: "Ошибка при добавлении отзыва" },
      { status: 500 },
    );
  }
}

