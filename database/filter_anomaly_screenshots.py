#!/usr/bin/env python3
"""
Удаляет из БД скриншоты-аномалии: иконки, пустые экраны, плейсхолдеры.
После скрипта в Предпросмотре остаются только нормальные скрины; если все — аномалии, блок не показывается.
Запуск: cd database && python3 filter_anomaly_screenshots.py
Требуется: pip install Pillow
"""

from pathlib import Path
from collections import Counter

try:
    from PIL import Image
except ImportError:
    print("Установите Pillow: python3 -m pip install Pillow")
    raise

from mainbd import get_connection, update_channel, ICONS_FOLDER

ICONS_PATH = Path(ICONS_FOLDER)
MAX_SCREENSHOTS_PER_APP = 3


def is_icon_like(image_path: Path, ratio_min: float = 0.8, ratio_max: float = 1.2) -> bool:
    """Квадратное изображение — иконка, не скрин."""
    try:
        with Image.open(image_path) as img:
            w, h = img.size
            if h == 0:
                return True
            r = w / h
            return ratio_min <= r <= ratio_max
    except Exception:
        return True


def is_placeholder_or_fake(image_path: Path) -> bool:
    """Пустой экран, рамка телефона, иконка-символ (плейсхолдер)."""
    try:
        with Image.open(image_path) as img:
            if img.mode not in ("RGB", "RGBA", "L", "P"):
                img = img.convert("RGB")
            w, h = img.size
            if max(w, h) < 200:
                return True
            small = img.copy()
            if small.mode == "RGBA":
                back = Image.new("RGB", small.size, (255, 255, 255))
                back.paste(small, mask=small.split()[-1])
                small = back
            elif small.mode in ("L", "P"):
                small = small.convert("RGB")
            small = small.resize((80, 80), Image.Resampling.LANCZOS)
            pixels = list(small.getdata())
            n = len(pixels)
            if n == 0:
                return True
            near_white = sum(1 for p in pixels if p[0] >= 240 and p[1] >= 240 and p[2] >= 240)
            if near_white / n >= 0.82:
                return True
            unique = len(set(pixels))
            if unique <= 15:
                return True
            cnt = Counter(pixels)
            most = cnt.most_common(1)[0][1] if cnt else 0
            if most / n >= 0.80:
                return True
            return False
    except Exception:
        return True


def is_anomaly(file_path: Path) -> bool:
    return is_icon_like(file_path) or is_placeholder_or_fake(file_path)


def main():
    if not ICONS_PATH.exists():
        print("Папка с иконками/скринами не найдена:", ICONS_PATH)
        return

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT idminiapp, screenshots_path FROM channels WHERE screenshots_path IS NOT NULL AND screenshots_path != ''"
    )
    rows = cur.fetchall()
    conn.close()

    updated = 0
    removed_total = 0
    for idminiapp, old_path in rows:
        parts = [p.strip() for p in (old_path or "").split(";") if p.strip()]
        if not parts:
            continue
        kept = []
        for name in parts:
            path = ICONS_PATH / name
            if not path.exists():
                continue
            if is_anomaly(path):
                removed_total += 1
                continue
            kept.append(name)
            if len(kept) >= MAX_SCREENSHOTS_PER_APP:
                break
        new_path = ";".join(kept)
        if new_path != (old_path or "").strip():
            if update_channel(idminiapp, screenshots_path=new_path):
                updated += 1
                before = len(parts)
                after = len(kept)
                print(f"{idminiapp}: было {before} скринов → осталось {after}")

    print(f"\nОбновлено записей: {updated}, удалено аномалий: {removed_total}")


if __name__ == "__main__":
    main()
