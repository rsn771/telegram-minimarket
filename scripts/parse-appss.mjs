#!/usr/bin/env node
const API_BASE = "https://appss-back-p.engagelabs.org";
const path = await import("path");
const { fileURLToPath } = await import("url");
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "database", "telegram_channels.db");

async function fetchCategory(categoryId = 504) {
  const url = `${API_BASE}/stats/app/search_by_category?category_id=${categoryId}&remove_voted_apps=false`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Origin: "https://mini.appss.store",
      Referer: "https://mini.appss.store/",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  const json = await res.json();
  if (!json.success || !json.data?.data) throw new Error("Неверный формат ответа");
  return json.data.data;
}

function mapApp(item) {
  const e = item.entity;
  const iconUrl = e.icon?.url || e.avatar || "";
  const handle = (e.handle || "").replace(/^@/, "");
  const idminiapp = handle || `appss_${e.id}`;
  return {
    idminiapp,
    title: e.title_ru || e.title || "",
    description: e.description_ru || e.description || e.long_description || "",
    icon: iconUrl.startsWith("http") ? iconUrl : "",
    url: e.url || `https://t.me/${handle}`,
    is_verified: e.checked ? 1 : 0,
    rating: typeof item.rating === "number" ? item.rating : 0,
    category: "Утилиты",
    screenshots_path: "",
    short_description: (e.description_ru || e.description || "").slice(0, 200),
  };
}

async function getRawData(args) {
  const fileIdx = args.indexOf("--file");
  if (fileIdx >= 0 && args[fileIdx + 1]) {
    const fs = await import("fs");
    const p = path.join(process.cwd(), args[fileIdx + 1]);
    const json = JSON.parse(fs.readFileSync(p, "utf8"));
    return json.data?.data ?? json.data ?? [];
  }
  const categoryIdx = args.indexOf("--category");
  const categoryId = categoryIdx >= 0 ? parseInt(args[categoryIdx + 1], 10) : 504;
  return fetchCategory(categoryId);
}

async function main() {
  const args = process.argv.slice(2);
  const categoryIdx = args.indexOf("--category");
  const categoryId = categoryIdx >= 0 ? parseInt(args[categoryIdx + 1], 10) : 504;
  const insert = args.includes("--insert");
  const dryRun = args.includes("--dry-run");

  const useFile = args.includes("--file");
  console.log(useFile ? "Чтение из файла..." : `Загрузка категории ${categoryId}...`);
  const raw = await getRawData(args);
  const apps = raw.map(mapApp).filter((a) => a.idminiapp && a.title);
  console.log(`Получено приложений: ${apps.length}`);

  if (insert) {
    const Database = (await import("better-sqlite3")).default;
    const db = new Database(DB_PATH);
    const stmt = db.prepare(
      `INSERT OR REPLACE INTO channels (idminiapp, title, description, icon, url, is_verified, rating, category, screenshots_path, short_description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    if (dryRun) {
      apps.forEach((a) => console.log(a.idminiapp, a.title));
    } else {
      const run = db.transaction(() => { for (const a of apps) stmt.run(a.idminiapp,a.title,a.description,a.icon,a.url,a.is_verified,a.rating,a.category,a.screenshots_path,a.short_description); });
      run();
      console.log(`Вставлено: ${apps.length}`);
    }
    db.close();
  } else {
    console.log(JSON.stringify(apps, null, 2));
  }
}

main().catch((err) => { console.error(err); process.exit(1); });

