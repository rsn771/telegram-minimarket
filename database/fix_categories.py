#!/usr/bin/env python3
"""
- Удаляем категорию «Боты»: рассовываем приложения из неё по другим категориям.
- Упоминания NFT / подарков в описании или названии -> категория «Подарки».
- Дополнительно: подходящие категории по ключевым словам (подарки, игры, нейросети и т.д.).
"""
import os
import sys
import sqlite3

DB_NAME = os.path.join(os.path.dirname(__file__), "telegram_channels.db")

# Бывшие «Боты» -> новая категория (по idminiapp или по смыслу)
BOTS_TO_CATEGORY = {
    "24": "Утилиты",   # Quattro VPN
    "25": "Утилиты",   # Shadownet VPN
    "26": "Игры",      # R1XON CHEATS
    "27": "Утилиты",   # Velvet VPN
    "41": "Утилиты",   # funstat / telelog
    "42": "Утилиты",   # RSN bot
    "43": "Утилиты",   # AppStops
    "44": "Утилиты",   # Himera Search
}


def main():
    if not os.path.exists(DB_NAME):
        print(f"БД не найдена: {DB_NAME}")
        sys.exit(1)

    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # Проверяем наличие short_description
    cur.execute("PRAGMA table_info(channels)")
    cols = [r[1] for r in cur.fetchall()]
    has_short = "short_description" in cols
    desc_sel = "COALESCE(description,'')" + (" || ' ' || COALESCE(short_description,'')" if has_short else "")

    updates = []

    # 1) Всё, где в названии или описании есть nft -> Подарки
    cur.execute(f"""
        SELECT idminiapp, title, category FROM channels
        WHERE LOWER(title || ' ' || {desc_sel}) LIKE '%nft%'
    """)
    for r in cur.fetchall():
        if r["category"] != "Подарки":
            updates.append((r["idminiapp"], "Подарки", f"NFT: {r['title'][:40]}"))
    for idminiapp, cat, reason in updates:
        cur.execute("UPDATE channels SET category = ? WHERE idminiapp = ?", (cat, idminiapp))
    print(f"По ключу NFT -> Подарки обновлено: {len(updates)}")
    updates.clear()

    # 2) Подарки/gift в описании или названии -> Подарки (если ещё не)
    cur.execute(f"""
        SELECT idminiapp, title, category FROM channels
        WHERE category != 'Подарки'
        AND (LOWER(title) LIKE '%подарок%' OR LOWER(title) LIKE '%gift%'
             OR LOWER({desc_sel}) LIKE '%подарок%' OR LOWER({desc_sel}) LIKE '%gift%'
             OR LOWER({desc_sel}) LIKE '%nft%')
    """)
    for r in cur.fetchall():
        updates.append((r["idminiapp"], "Подарки", r["title"][:40]))
    for idminiapp, cat, _ in updates:
        cur.execute("UPDATE channels SET category = ? WHERE idminiapp = ?", (cat, idminiapp))
    print(f"По ключу подарки/gift -> Подарки обновлено: {len(updates)}")
    updates.clear()

    # 3) Бывшие «Боты» -> назначенные категории
    for idminiapp, new_cat in BOTS_TO_CATEGORY.items():
        cur.execute("UPDATE channels SET category = ? WHERE idminiapp = ? AND category = 'Боты'", (new_cat, idminiapp))
        if cur.rowcount:
            updates.append((idminiapp, new_cat))
    print(f"Боты перераспределены: {len(updates)}")
    updates.clear()

    # 4) Оставшиеся с категорией «Боты» (на всякий случай) -> Утилиты
    cur.execute("UPDATE channels SET category = 'Утилиты' WHERE category = 'Боты'")
    if cur.rowcount:
        print(f"Оставшиеся Боты -> Утилиты: {cur.rowcount}")

    conn.commit()

    # Итог по категориям
    cur.execute("SELECT category, COUNT(*) as cnt FROM channels GROUP BY category ORDER BY category")
    print("\nКатегории после обновления:")
    for r in cur.fetchall():
        print(f"  {r['category']}: {r['cnt']}")

    conn.close()


if __name__ == "__main__":
    main()
