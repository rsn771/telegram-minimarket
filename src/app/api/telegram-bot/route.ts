import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_URL = TELEGRAM_TOKEN
  ? `https://api.telegram.org/bot${TELEGRAM_TOKEN}`
  : null;

// Получатели заявок
const OWNER_IDS = [5651149188, 728379071];

const START_TEXT =
  "Мы открыты к вашим предложениям. Заполните следующую форму:\n\n" +
  "1. ссылка на бота с миниаппом / бота\n" +
  "2. название\n" +
  "3. описание\n" +
  "4. лого\n" +
  "5. скриншоты (по возможности) размером 370x650\n" +
  "6. ссылка типа: https://t.me/юз_миниаппа_без_@/app?startapp\n" +
  "7. ваш юзернейм для связи";

type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

type TelegramChat = {
  id: number;
};

type TelegramMessage = {
  message_id: number;
  chat: TelegramChat;
  from?: TelegramUser;
  text?: string;
  caption?: string;
  photo?: unknown[];
  document?: unknown;
};

type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
};

async function callTelegram(method: string, payload: Record<string, any>) {
  if (!API_URL) {
    console.error("TELEGRAM_BOT_TOKEN is not set");
    return;
  }
  try {
    const res = await fetch(`${API_URL}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`Telegram API error for ${method}:`, await res.text());
    }
  } catch (err) {
    console.error(`Telegram API request failed for ${method}:`, err);
  }
}

async function sendMessage(chatId: number, text: string) {
  await callTelegram("sendMessage", {
    chat_id: chatId,
    text,
  });
}

async function forwardMessage(toChatId: number, fromChatId: number, messageId: number) {
  await callTelegram("forwardMessage", {
    chat_id: toChatId,
    from_chat_id: fromChatId,
    message_id: messageId,
  });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as TelegramUpdate | null;

  if (!body || !body.message) {
    return NextResponse.json({ ok: true });
  }

  const msg = body.message;
  const chatId = msg.chat.id;
  const from = msg.from;
  const text = msg.text ?? "";
  const caption = msg.caption ?? "";

  // /start → отправляем форму
  if (text === "/start") {
    await sendMessage(chatId, START_TEXT);
    return NextResponse.json({ ok: true });
  }

  // Любое другое сообщение считаем заявкой
  const userInfo = from
    ? `${from.first_name ?? ""} ${from.last_name ?? ""} (@${from.username ?? "нет username"}) id=${from.id}`.trim()
    : "неизвестный пользователь";

  const header = `Новая заявка от ${userInfo}:\n\n`;
  const bodyText = text || caption;

  // Отправляем текст заявки всем получателям
  if (bodyText) {
    await Promise.all(
      OWNER_IDS.map((ownerId) =>
        sendMessage(ownerId, header + bodyText)
      )
    );
  }

  // Пересылаем медиа (фото/документы) как есть
  if (msg.photo || msg.document) {
    await Promise.all(
      OWNER_IDS.map((ownerId) =>
        forwardMessage(ownerId, chatId, msg.message_id)
      )
    );
  }

  // Ответ пользователю
  await sendMessage(
    chatId,
    "Спасибо! Ваша заявка отправлена, мы свяжемся с вами при необходимости."
  );

  return NextResponse.json({ ok: true });
}

// Простой health‑check, чтобы можно было открыть роут в браузере
export async function GET() {
  return NextResponse.json({ ok: true });
}

