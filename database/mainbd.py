import sqlite3
import os
from typing import Optional


DB_NAME = os.path.join(os.path.dirname(__file__), "telegram_channels.db")

# Папка с иконками и скриншотами (формат WebP). Лого и скрины в одной папке.
ICONS_FOLDER = os.path.join(os.path.dirname(__file__), "logo&screens")


def get_connection():
    """Возвращает подключение к базе данных."""
    return sqlite3.connect(DB_NAME)


def get_icon_path(icon_filename: str) -> str:
    """
    Возвращает полный путь к файлу иконки.
    icon_filename — имя файла (например: channel_001.webp).
    Иконки должны находиться в папке ICONS_FOLDER в формате WebP.
    """
    return os.path.join(ICONS_FOLDER, icon_filename)


def add_channel(idminiapp: str, title: str, description: str = "", 
                icon: str = "", url: str = "", is_verified: bool = False, rating: float = 0,
                category: str = "Утилиты", screenshots_path: str = ""):
    """
    Добавляет новый канал в базу данных.
    icon — имя файла иконки из папки logo&screens (формат WebP, например: notcoin_logo.webp).
    screenshots_path — имена файлов скриншотов через ";", например: notcoin_scr_1.webp;notcoin_scr_2.webp;notcoin_scr_3.webp
    category — категория приложения (например: Утилиты, Игры, Финансы).
    """
    conn = get_connection()
    cursor = conn.cursor()
    _ensure_columns(cursor)
    try:
        cursor.execute("""
            INSERT INTO channels (idminiapp, title, description, icon, url, is_verified, rating, category, screenshots_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (idminiapp, title, description, icon, url, 1 if is_verified else 0, rating, category, screenshots_path))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        print(f"Канал с idminiapp '{idminiapp}' уже существует.")
        return False
    finally:
        conn.close()


def _ensure_columns(cursor):
    """Добавляет столбцы category и screenshots_path, если их нет."""
    cursor.execute("PRAGMA table_info(channels)")
    names = {row[1] for row in cursor.fetchall()}
    if "category" not in names:
        cursor.execute("ALTER TABLE channels ADD COLUMN category TEXT DEFAULT 'Утилиты'")
    if "screenshots_path" not in names:
        cursor.execute("ALTER TABLE channels ADD COLUMN screenshots_path TEXT")


def get_channel(idminiapp: str) -> Optional[tuple]:
    """Получает канал по idminiapp."""
    conn = get_connection()
    cursor = conn.cursor()
    _ensure_columns(cursor)
    conn.commit()
    cursor.execute(
        "SELECT idminiapp, title, description, icon, url, is_verified, rating, category, screenshots_path FROM channels WHERE idminiapp = ?",
        (idminiapp,)
    )
    result = cursor.fetchone()
    conn.close()
    return result


def get_all_channels() -> list:
    """Возвращает список всех каналов."""
    conn = get_connection()
    cursor = conn.cursor()
    _ensure_columns(cursor)
    conn.commit()
    cursor.execute("SELECT idminiapp, title, description, icon, url, is_verified, rating, category, screenshots_path FROM channels")
    results = cursor.fetchall()
    conn.close()
    return results


def update_channel(idminiapp: str, title: str = None, description: str = None,
                   icon: str = None, url: str = None, is_verified: bool = None, rating: float = None,
                   category: str = None, screenshots_path: str = None):
    """Обновляет данные канала."""
    conn = get_connection()
    cursor = conn.cursor()
    
    updates = []
    params = []
    
    if title is not None:
        updates.append("title = ?")
        params.append(title)
    if description is not None:
        updates.append("description = ?")
        params.append(description)
    if icon is not None:
        updates.append("icon = ?")
        params.append(icon)
    if url is not None:
        updates.append("url = ?")
        params.append(url)
    if is_verified is not None:
        updates.append("is_verified = ?")
        params.append(1 if is_verified else 0)
    if rating is not None:
        updates.append("rating = ?")
        params.append(rating)
    if category is not None:
        updates.append("category = ?")
        params.append(category)
    if screenshots_path is not None:
        updates.append("screenshots_path = ?")
        params.append(screenshots_path)
    
    if not updates:
        conn.close()
        return False
    
    params.append(idminiapp)
    cursor.execute(
        f"UPDATE channels SET {', '.join(updates)} WHERE idminiapp = ?",
        params
    )
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected > 0


def delete_channel(idminiapp: str) -> bool:
    """Удаляет канал по idminiapp."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM channels WHERE idminiapp = ?", (idminiapp,))
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected > 0


def search_channels(query: str) -> list:
    """Поиск каналов по названию или описанию."""
    conn = get_connection()
    cursor = conn.cursor()
    _ensure_columns(cursor)
    conn.commit()
    search_pattern = f"%{query}%"
    cursor.execute("""
        SELECT idminiapp, title, description, icon, url, is_verified, rating, category, screenshots_path 
        FROM channels 
        WHERE title LIKE ? OR description LIKE ?
    """, (search_pattern, search_pattern))
    results = cursor.fetchall()
    conn.close()
    return results
