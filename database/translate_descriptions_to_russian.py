#!/usr/bin/env python3
"""
Переводит описания приложений в БД на русский. Названия сервисов (Telegram, WhatsApp и т.д.) остаются в оригинале.
Запуск: из папки database: python3 translate_descriptions_to_russian.py
Требуется: pip install deep-translator
"""

try:
    from deep_translator import GoogleTranslator
except ImportError:
    print("Установите: python3 -m pip install deep-translator")
    raise SystemExit(1)

from mainbd import get_connection, update_channel

# Восстанавливаем оригинальные названия после перевода
PRESERVE_RU_TO_EN = (
    ("телеграм", "Telegram"),
    ("вотсап", "WhatsApp"),
    ("вацап", "WhatsApp"),
    ("андроид", "Android"),
    ("айос", "iOS"),
    ("айфон", "iPhone"),
    (" тон ", " TON "),
    (" нфт ", " NFT "),
)


def translate_to_russian(text: str) -> str:
    if not text or not text.strip():
        return text
    text = text.strip()[:800]
    cyrillic = sum(1 for c in text if "\u0400" <= c <= "\u04FF")
    if cyrillic / max(len(text), 1) > 0.5:
        return text
    try:
        translated = GoogleTranslator(source="auto", target="ru").translate(text)
        if not translated:
            return text
        result = translated
        for ru, en in PRESERVE_RU_TO_EN:
            result = result.replace(ru, en)
        return result[:800]
    except Exception as e:
        print(f"   ⚠️  Перевод: {e}")
        return text


def main():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT idminiapp, description FROM channels WHERE description IS NOT NULL AND description != ''")
    rows = cur.fetchall()
    conn.close()

    updated = 0
    for i, (idminiapp, description) in enumerate(rows, 1):
        translated = translate_to_russian(description or "")
        if translated == (description or "").strip():
            continue
        if update_channel(idminiapp, description=translated):
            updated += 1
            print(f"[{i}] {idminiapp} — переведено")

    print(f"\nОбновлено описаний: {updated}")


if __name__ == "__main__":
    main()
