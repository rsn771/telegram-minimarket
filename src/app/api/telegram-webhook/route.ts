import { NextRequest, NextResponse } from "next/server";

const START_MESSAGE =
  "Market miniapp - некоммерческий сервис для удобства пользователя в выборе и использовании встроенных миниприложений в телеграм. Сервис предоставляет быстрый и легкий доступ к миниприложениям под ваши нужды.";

export async function POST(request: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("TELEGRAM_BOT_TOKEN is not set");
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  let body: { message?: { chat?: { id: number }; text?: string } };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const chatId = body.message?.chat?.id;
  const text = body.message?.text?.trim();

  if (text === "/start" && chatId != null) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: START_MESSAGE,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        console.error("Telegram sendMessage error:", data);
      }
    } catch (err) {
      console.error("Failed to send /start reply:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
