--
-- File generated with SQLiteStudio v3.4.21 on Вс фев 8 01:29:19 2026
--
-- Text encoding used: System
--
PRAGMA foreign_keys = off;
BEGIN TRANSACTION;

-- Table: channels
CREATE TABLE IF NOT EXISTS channels (idminiapp NUMERIC PRIMARY KEY, title TEXT NOT NULL, description TEXT, icon TEXT, url TEXT, is_verified INTEGER DEFAULT 0, rating REAL DEFAULT 0, category TEXT, screenshots_path TEXT);
INSERT INTO channels (idminiapp, title, description, icon, url, is_verified, rating, category, screenshots_path) VALUES (2, 'Notcoin', 'probably nothing', 'notcoin_logo.webp', 'https://t.me/notcoin_bot/?startapp', 1, 4.2, 'Утилиты', 'notcoin_scr_1.webp;notcoin_scr_2.webp;notcoin_scr_3.webp');

-- Table: reviews
CREATE TABLE IF NOT EXISTS reviews (reviews_id PRIMARY KEY, user_id INTEGER REFERENCES Users (user_id), idminiapp INTEGER REFERENCES channels (idminiapp));

-- Table: Users
CREATE TABLE IF NOT EXISTS Users (user_id INTEGER PRIMARY KEY, username TEXT);

COMMIT TRANSACTION;
PRAGMA foreign_keys = on;
