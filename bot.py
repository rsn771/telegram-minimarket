import logging

from telegram import Update
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    ContextTypes,
    filters,
)

# Токен бота и список получателей заявок
BOT_TOKEN = "8208417749:AAE4FPGVdAuF2rIkwNUYfisrOA6-p-vMQMk"
OWNER_IDS = [5651149188, 728379071]

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


START_TEXT = (
    "Мы открыты к вашим предложениям. Заполните следующую форму:\n\n"
    "1. ссылка на бота с миниаппом / бота\n"
    "2. название\n"
    "3. описание\n"
    "4. лого\n"
    "5. скриншоты (по возможности) размером 370x650\n"
    "6. ссылка типа: https://t.me/юз_миниаппа_без_@/app?startapp\n"
    "7. ваш юзернейм для связи"
)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обрабатывает /start."""
    if not update.message:
        return
    await update.message.reply_text(START_TEXT)


async def forward_proposal(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Любое сообщение после /start пересылается тебе в личку."""
    message = update.message
    if message is None:
        return

    user = message.from_user
    user_info = f"{user.full_name} (@{user.username}) id={user.id}"

    # Текст, который придёт тебе
    header = f"Новая заявка от {user_info}:\n\n"
    text = message.text or ""
    caption = message.caption or ""

    if text or caption:
        for owner_id in OWNER_IDS:
            await context.bot.send_message(
                chat_id=owner_id,
                text=header + (text or caption),
            )

    # Пересылаем медиа (фото/документы) как есть всем получателям
    if message.photo or message.document:
        for owner_id in OWNER_IDS:
            await message.forward(chat_id=owner_id)

    await message.reply_text(
        "Спасибо! Ваша заявка отправлена, мы свяжемся с вами при необходимости."
    )


def main() -> None:
    app = Application.builder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    # Все сообщения, кроме команд, пересылаем как заявки
    app.add_handler(MessageHandler(filters.ALL & ~filters.COMMAND, forward_proposal))

    print("Bot is running. Press Ctrl+C to stop.")
    app.run_polling()


if __name__ == "__main__":
    main()

