#!/usr/bin/env python3
"""
Удаляет дубликаты скриншотов в БД и оставляет не более 3 скринов на одно приложение.
Запуск: из папки database: python3 dedupe_screenshots.py
"""

from mainbd import get_connection, update_channel

MAX_SCREENSHOTS_PER_APP = 3


def normalize_screenshots_path(screenshots_path: str) -> str:
    """Убирает дубликаты, оставляет только первые MAX_SCREENSHOTS_PER_APP, порядок сохраняется."""
    if not screenshots_path or not screenshots_path.strip():
        return ""
    parts = [p.strip() for p in screenshots_path.split(";") if p.strip()]
    seen = set()
    unique = []
    for p in parts:
        if p not in seen:
            seen.add(p)
            unique.append(p)
        if len(unique) >= MAX_SCREENSHOTS_PER_APP:
            break
    return ";".join(unique)


def main():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT idminiapp, screenshots_path FROM channels WHERE screenshots_path IS NOT NULL AND screenshots_path != ''")
    rows = cur.fetchall()
    conn.close()

    updated = 0
    for idminiapp, old_path in rows:
        new_path = normalize_screenshots_path(old_path or "")
        if new_path != (old_path or "").strip():
            if update_channel(idminiapp, screenshots_path=new_path):
                updated += 1
                print(f"{idminiapp}: было {len((old_path or '').split(';'))} скринов → стало {len(new_path.split(';'))}")

    print(f"\nОбновлено записей: {updated}")


if __name__ == "__main__":
    main()
