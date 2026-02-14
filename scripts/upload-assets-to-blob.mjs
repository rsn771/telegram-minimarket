#!/usr/bin/env node
/**
 * Однократная загрузка иконок и скриншотов из database/logo&screens в Vercel Blob.
 * После загрузки добавь в Vercel (Settings → Environment Variables):
 *   BLOB_STORE_URL = выведенный ниже Base URL (с завершающим слэшем)
 *
 * Запуск (из корня проекта, с установленным BLOB_READ_WRITE_TOKEN):
 *   node scripts/upload-assets-to-blob.mjs
 *
 * Токен: Vercel → Storage → твой Blob store → Connect to Project,
 *        затем локально: vercel env pull
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { put } from "@vercel/blob";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.join(__dirname, "..", "database", "logo&screens");

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error("Задайте BLOB_READ_WRITE_TOKEN (Vercel → Storage → Blob store → env).");
    console.error("Локально: vercel env pull");
    process.exit(1);
  }

  if (!fs.existsSync(ASSETS_DIR)) {
    console.error("Папка не найдена:", ASSETS_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(ASSETS_DIR).filter((f) => /\.(webp|png|jpg|jpeg)$/i.test(f));
  if (files.length === 0) {
    console.log("Нет подходящих файлов (.webp, .png, .jpg).");
    process.exit(0);
  }

  console.log(`Найдено файлов: ${files.length}. Загрузка в Vercel Blob...`);
  let baseUrl = null;

  for (let i = 0; i < files.length; i++) {
    const name = files[i];
    const filePath = path.join(ASSETS_DIR, name);
    const buffer = fs.readFileSync(filePath);
    try {
      const blob = await put(name, buffer, { access: "public" });
      if (!baseUrl && blob.url) {
        baseUrl = blob.url.replace(/[^/]+$/, "");
        console.log("\n--- Добавь в Vercel (Environment Variables): ---");
        console.log("BLOB_STORE_URL =", baseUrl);
        console.log("------------------------------------------------\n");
      }
      if ((i + 1) % 100 === 0) console.log(`  ${i + 1}/${files.length}`);
    } catch (e) {
      console.error("Ошибка при загрузке", name, e.message);
    }
  }

  console.log(`Готово: ${files.length} файлов.`);
  if (baseUrl) console.log("BLOB_STORE_URL =", baseUrl);
}

main();
