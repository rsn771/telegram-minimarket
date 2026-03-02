import { NextRequest, NextResponse } from "next/server";

const START_MESSAGE = `Добро пожаловать в Market MiniApp — маркет лучших Telegram-приложений 🚀

Здесь собраны проверенные боты и мини-аппы:
• Нейросети и AI-инструменты
• VPN-сервисы
• Игры и развлечения
• Утилиты для ТГК
• И многое другое

Открывай каталог и находи полезное 👇`;

const WEBAPP_URL = "https://telegram-minimarket.vercel.app";

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

  if (text?.startsWith("/start") && chatId != null) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: START_MESSAGE,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🛒 Открыть маркет",
                  web_app: { url: WEBAPP_URL },
                },
              ],
            ],
          },
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

export async function GET() {
  return NextResponse.json({ ok: true, message: "Market MiniApp webhook is active" });
}
