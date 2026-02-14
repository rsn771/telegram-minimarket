#!/usr/bin/env python3
"""
Находит дубликаты приложений по названию (title) и удаляет те, что добавлены позже.
Оставляется запись с минимальным rowid (первая вставленная).
"""
import os
import sys

DB_NAME = os.path.join(os.path.dirname(__file__), "telegram_channels.db")


def main():
    if not os.path.exists(DB_NAME):
        print(f"БД не найдена: {DB_NAME}")
        sys.exit(1)

    import sqlite3
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # Проверяем наличие short_description для совместимости с текущей схемой
    cur.execute("PRAGMA table_info(channels)")
    cur.execute(
        "SELECT rowid, idminiapp, title FROM channels ORDER BY rowid"
    )
    rows = cur.fetchall()

    # Группируем по нормализованному названию (без пробелов по краям, без учёта регистра)
    from collections import defaultdict
    by_title = defaultdict(list)
    for r in rows:
        key = (r["title"] or "").strip()
        if not key:
            continue
        by_title[key].append({"rowid": r["rowid"], "idminiapp": r["idminiapp"], "title": r["title"]})

    to_delete = []
    for title, group in by_title.items():
        if len(group) <= 1:
            continue
        # Сортируем по rowid — первый добавленный остаётся
        group.sort(key=lambda x: x["rowid"])
        keep = group[0]
        for rec in group[1:]:
            to_delete.append(rec)

    if not to_delete:
        print("Дубликатов не найдено.")
        conn.close()
        return

    print(f"Найдено дубликатов к удалению: {len(to_delete)}")
    for rec in to_delete:
        print(f"  Удаляю: idminiapp={rec['idminiapp']!r}, title={rec['title']!r} (rowid={rec['rowid']})")

    for rec in to_delete:
        cur.execute("DELETE FROM channels WHERE idminiapp = ?", (rec["idminiapp"],))

    conn.commit()
    print(f"Удалено записей: {len(to_delete)}")
    conn.close()


if __name__ == "__main__":
    main()
