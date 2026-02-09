import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_DIR = path.join(process.cwd(), "database");
const DB_PATH = path.join(DB_DIR, "telegram_channels.db");

function ensureDbExists(): void {
  if (!fs.existsSync(DB_PATH)) {
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
 * Вычисляет средний рейтинг из отзывов для приложения и обновляет его в таблице channels
 * Округляет до десятых (1 знак после запятой)
 */
function updateAppRating(db: Database.Database, idminiapp: string): void {
  const reviews = db.prepare(`
    SELECT rating FROM reviews WHERE idminiapp = ?
  `).all(idminiapp) as { rating: number }[];

  if (reviews.length === 0) {
    // Если нет отзывов, устанавливаем рейтинг в 0
    db.prepare("UPDATE channels SET rating = 0 WHERE idminiapp = ?").run(idminiapp);
    return;
  }

  // Вычисляем среднее значение
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  const average = sum / reviews.length;
  
  // Округляем до десятых (1 знак после запятой)
  const roundedRating = Math.round(average * 10) / 10;

  // Обновляем рейтинг в таблице channels
  db.prepare("UPDATE channels SET rating = ? WHERE idminiapp = ?").run(roundedRating, idminiapp);
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
    ensureDbExists();

    const { searchParams } = new URL(request.url);
    const idminiapp = searchParams.get("idminiapp");

    if (!idminiapp) {
      return NextResponse.json({ error: "Не указан idminiapp" }, { status: 400 });
    }

    const db = new Database(DB_PATH, { readonly: true });
    ensureReviewsTable(db);

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
    return NextResponse.json({ error: "Ошибка при загрузке отзывов" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    ensureDbExists();

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

    const db = new Database(DB_PATH, { readonly: false });
    ensureReviewsTable(db);

    // Проверяем, существует ли приложение
    const channelExists = db.prepare("SELECT 1 FROM channels WHERE idminiapp = ?").get(idminiapp);
    if (!channelExists) {
      db.close();
      return NextResponse.json({ error: "Приложение не найдено" }, { status: 404 });
    }

    // Добавляем отзыв
    const result = db.prepare(`
      INSERT INTO reviews (idminiapp, username, rating, text, created_at)
      VALUES (?, 'Пользователь', ?, ?, datetime('now', 'localtime'))
    `).run(idminiapp, rating, text.trim());

    // Обновляем рейтинг приложения на основе всех отзывов
    updateAppRating(db, idminiapp);

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
