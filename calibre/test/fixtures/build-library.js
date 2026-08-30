import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

// Minimal subset of Calibre's real metadata.db schema (see schema.sql at the
// repo root) — just enough to exercise every relationship CalibreLibrary reads.
const SCHEMA = `
CREATE TABLE books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  sort TEXT,
  timestamp TEXT,
  pubdate TEXT,
  series_index REAL NOT NULL DEFAULT 1.0,
  author_sort TEXT,
  path TEXT NOT NULL DEFAULT '',
  uuid TEXT,
  has_cover INTEGER DEFAULT 0,
  last_modified TEXT
);
CREATE TABLE authors (id INTEGER PRIMARY KEY, name TEXT NOT NULL, sort TEXT, link TEXT DEFAULT '');
CREATE TABLE books_authors_link (id INTEGER PRIMARY KEY, book INTEGER NOT NULL, author INTEGER NOT NULL);
CREATE TABLE series (id INTEGER PRIMARY KEY, name TEXT NOT NULL, sort TEXT, link TEXT DEFAULT '');
CREATE TABLE books_series_link (id INTEGER PRIMARY KEY, book INTEGER NOT NULL, series INTEGER NOT NULL);
CREATE TABLE publishers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, sort TEXT, link TEXT DEFAULT '');
CREATE TABLE books_publishers_link (id INTEGER PRIMARY KEY, book INTEGER NOT NULL, publisher INTEGER NOT NULL);
CREATE TABLE ratings (id INTEGER PRIMARY KEY, rating INTEGER, link TEXT DEFAULT '');
CREATE TABLE books_ratings_link (id INTEGER PRIMARY KEY, book INTEGER NOT NULL, rating INTEGER NOT NULL);
CREATE TABLE tags (id INTEGER PRIMARY KEY, name TEXT NOT NULL, link TEXT DEFAULT '');
CREATE TABLE books_tags_link (id INTEGER PRIMARY KEY, book INTEGER NOT NULL, tag INTEGER NOT NULL);
CREATE TABLE languages (id INTEGER PRIMARY KEY, lang_code TEXT NOT NULL, link TEXT DEFAULT '');
CREATE TABLE books_languages_link (id INTEGER PRIMARY KEY, book INTEGER NOT NULL, lang_code INTEGER NOT NULL, item_order INTEGER DEFAULT 0);
CREATE TABLE comments (id INTEGER PRIMARY KEY, book INTEGER NOT NULL, text TEXT NOT NULL);
CREATE TABLE identifiers (id INTEGER PRIMARY KEY, book INTEGER NOT NULL, type TEXT NOT NULL, val TEXT NOT NULL);
CREATE TABLE data (id INTEGER PRIMARY KEY, book INTEGER NOT NULL, format TEXT NOT NULL, uncompressed_size INTEGER NOT NULL, name TEXT NOT NULL);
`;

/**
 * Builds a throwaway Calibre-shaped library (a temp directory containing a
 * metadata.db) with two books:
 *
 *  - book 1: exercises every relationship (two authors, series, publisher,
 *    rating, two tags, one language, comments, two identifiers, two formats,
 *    has_cover).
 *  - book 2: exercises the all-absent case (single author, no series,
 *    publisher, rating, tags, languages, comments, identifiers; one format;
 *    no cover).
 *
 * Returns the library path; caller is responsible for removing it.
 */
export function createTestLibrary() {
  const libraryPath = mkdtempSync(path.join(tmpdir(), 'calibre-reader-test-'));
  const db = new DatabaseSync(path.join(libraryPath, 'metadata.db'));
  db.exec(SCHEMA);

  const run = (sql, ...params) => db.prepare(sql).run(...params);

  run(
    `INSERT INTO books (id, title, sort, timestamp, pubdate, series_index, author_sort, path, uuid, has_cover, last_modified)
     VALUES (1, 'Test Book One', 'Test Book One', '2024-01-01T00:00:00+00:00', '2023-06-15T00:00:00+00:00', 2.0, 'Author, First & Author, Second', 'Author First/Test Book One (1)', 'uuid-1', 1, '2024-01-02T00:00:00+00:00')`
  );
  run(
    `INSERT INTO books (id, title, sort, timestamp, pubdate, series_index, author_sort, path, uuid, has_cover, last_modified)
     VALUES (2, 'Test Book Two', 'Test Book Two', '2024-02-01T00:00:00+00:00', '2023-07-01T00:00:00+00:00', 1.0, 'Author, Third', 'Author Third/Test Book Two (2)', 'uuid-2', 0, '2024-02-02T00:00:00+00:00')`
  );

  run(`INSERT INTO authors (id, name, sort) VALUES (1, 'First Author', 'Author, First')`);
  run(`INSERT INTO authors (id, name, sort) VALUES (2, 'Second Author', 'Author, Second')`);
  run(`INSERT INTO authors (id, name, sort) VALUES (3, 'Third Author', 'Author, Third')`);
  run(`INSERT INTO books_authors_link (book, author) VALUES (1, 1)`);
  run(`INSERT INTO books_authors_link (book, author) VALUES (1, 2)`);
  run(`INSERT INTO books_authors_link (book, author) VALUES (2, 3)`);

  run(`INSERT INTO series (id, name, sort) VALUES (1, 'Test Series', 'Test Series')`);
  run(`INSERT INTO books_series_link (book, series) VALUES (1, 1)`);

  run(`INSERT INTO publishers (id, name) VALUES (1, 'Test Publisher')`);
  run(`INSERT INTO books_publishers_link (book, publisher) VALUES (1, 1)`);

  run(`INSERT INTO ratings (id, rating) VALUES (1, 8)`);
  run(`INSERT INTO books_ratings_link (book, rating) VALUES (1, 1)`);

  run(`INSERT INTO tags (id, name) VALUES (1, 'Fiction')`);
  run(`INSERT INTO tags (id, name) VALUES (2, 'Adventure')`);
  run(`INSERT INTO books_tags_link (book, tag) VALUES (1, 1)`);
  run(`INSERT INTO books_tags_link (book, tag) VALUES (1, 2)`);

  run(`INSERT INTO languages (id, lang_code) VALUES (1, 'eng')`);
  run(`INSERT INTO books_languages_link (book, lang_code, item_order) VALUES (1, 1, 0)`);

  run(`INSERT INTO comments (book, text) VALUES (1, '<p>A description.</p>')`);

  run(`INSERT INTO identifiers (book, type, val) VALUES (1, 'isbn', '9780000000001')`);
  run(`INSERT INTO identifiers (book, type, val) VALUES (1, 'goodreads', '12345')`);

  run(`INSERT INTO data (book, format, name, uncompressed_size) VALUES (1, 'EPUB', 'Test Book One - First Author', 1000)`);
  run(`INSERT INTO data (book, format, name, uncompressed_size) VALUES (1, 'PDF', 'Test Book One - First Author', 2000)`);
  run(`INSERT INTO data (book, format, name, uncompressed_size) VALUES (2, 'EPUB', 'Test Book Two - Third Author', 3000)`);

  db.close();
  return libraryPath;
}
