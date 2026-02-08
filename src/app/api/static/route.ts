import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

const LOGO_SCREENS_FOLDER = path.join(process.cwd(), "database", "logo&screens");

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get("file");
    if (!file || !/^[\w.-]+\.webp$/i.test(file)) {
      return NextResponse.json({ error: "Неверное имя файла" }, { status: 400 });
    }
    const filePath = path.join(LOGO_SCREENS_FOLDER, file);
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(LOGO_SCREENS_FOLDER))) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
    }
    if (!fs.existsSync(resolved)) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
    }
    const buffer = fs.readFileSync(resolved);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (err) {
    console.error("Static file error:", err);
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}
