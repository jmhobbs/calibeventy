import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

const METADATA_FILENAME = 'metadata.db';
const COVER_FILENAME = 'cover.jpg';

/**
 * Read-only access to a Calibre library's metadata.db. Opens the database
 * connection with SQLITE_OPEN_READONLY, so writes are rejected by SQLite
 * itself, not merely by the absence of write methods here.
 */
export class CalibreLibrary {
  #db;
  #libraryPath;

  constructor(libraryPath, { DatabaseSyncImpl = DatabaseSync } = {}) {
    this.#libraryPath = libraryPath;
    const dbPath = path.join(libraryPath, METADATA_FILENAME);
    this.#db = new DatabaseSyncImpl(dbPath, { readOnly: true, fileMustExist: true });
  }

  /** Every book in the library, ordered by id. */
  listBooks() {
    return this.#buildBooks();
  }

  /** A single book by id, or null if it doesn't exist. */
  getBook(id) {
    return this.#buildBooks([id])[0] ?? null;
  }

  close() {
    this.#db.close();
  }

  #buildBooks(bookIds) {
    const bookRows = bookIds
      ? this.#all(`SELECT * FROM books WHERE id IN (${placeholders(bookIds)}) ORDER BY id`, bookIds)
      : this.#all('SELECT * FROM books ORDER BY id');

    if (bookRows.length === 0) return [];

    const ids = bookRows.map((row) => row.id);
    const ph = placeholders(ids);

    const authorsByBook = groupBy(
      this.#all(
        `SELECT bal.book AS book, a.id, a.name, a.sort
         FROM books_authors_link bal JOIN authors a ON a.id = bal.author
         WHERE bal.book IN (${ph}) ORDER BY bal.id`,
        ids
      ),
      (row) => row.book,
      (row) => ({ id: row.id, name: row.name, sort: row.sort })
    );

    const seriesByBook = new Map(
      this.#all(
        `SELECT bsl.book AS book, s.id, s.name, s.sort
         FROM books_series_link bsl JOIN series s ON s.id = bsl.series
         WHERE bsl.book IN (${ph})`,
        ids
      ).map((row) => [row.book, { id: row.id, name: row.name, sort: row.sort }])
    );

    const publisherByBook = new Map(
      this.#all(
        `SELECT bpl.book AS book, p.id, p.name
         FROM books_publishers_link bpl JOIN publishers p ON p.id = bpl.publisher
         WHERE bpl.book IN (${ph})`,
        ids
      ).map((row) => [row.book, { id: row.id, name: row.name }])
    );

    const ratingByBook = new Map(
      this.#all(
        `SELECT brl.book AS book, r.rating
         FROM books_ratings_link brl JOIN ratings r ON r.id = brl.rating
         WHERE brl.book IN (${ph})`,
        ids
      ).map((row) => [row.book, row.rating])
    );

    const tagsByBook = groupBy(
      this.#all(
        `SELECT btl.book AS book, t.name
         FROM books_tags_link btl JOIN tags t ON t.id = btl.tag
         WHERE btl.book IN (${ph}) ORDER BY t.name`,
        ids
      ),
      (row) => row.book,
      (row) => row.name
    );

    const languagesByBook = groupBy(
      this.#all(
        `SELECT bll.book AS book, l.lang_code
         FROM books_languages_link bll JOIN languages l ON l.id = bll.lang_code
         WHERE bll.book IN (${ph}) ORDER BY bll.item_order`,
        ids
      ),
      (row) => row.book,
      (row) => row.lang_code
    );

    const commentByBook = new Map(
      this.#all(`SELECT book, text FROM comments WHERE book IN (${ph})`, ids).map((row) => [
        row.book,
        row.text,
      ])
    );

    const identifiersByBook = new Map();
    for (const row of this.#all(
      `SELECT book, type, val FROM identifiers WHERE book IN (${ph})`,
      ids
    )) {
      const identifiers = identifiersByBook.get(row.book) ?? {};
      identifiers[row.type] = row.val;
      identifiersByBook.set(row.book, identifiers);
    }

    const formatsByBook = groupBy(
      this.#all(
        `SELECT d.book AS book, d.format, d.name, d.uncompressed_size, b.path AS book_path
         FROM data d JOIN books b ON b.id = d.book
         WHERE d.book IN (${ph}) ORDER BY d.format`,
        ids
      ),
      (row) => row.book,
      (row) => ({
        format: row.format,
        path: path.join(this.#libraryPath, row.book_path, `${row.name}.${row.format.toLowerCase()}`),
        sizeBytes: row.uncompressed_size,
      })
    );

    return bookRows.map((row) => ({
      id: row.id,
      title: row.title,
      sort: row.sort,
      timestamp: row.timestamp,
      pubdate: row.pubdate,
      authorSort: row.author_sort,
      uuid: row.uuid,
      hasCover: Boolean(row.has_cover),
      coverPath: row.has_cover ? path.join(this.#libraryPath, row.path, COVER_FILENAME) : null,
      lastModified: row.last_modified,
      libraryPath: row.path,
      authors: authorsByBook.get(row.id) ?? [],
      series: seriesByBook.has(row.id)
        ? { ...seriesByBook.get(row.id), index: row.series_index }
        : null,
      publisher: publisherByBook.get(row.id) ?? null,
      rating: ratingByBook.get(row.id) ?? null,
      tags: tagsByBook.get(row.id) ?? [],
      languages: languagesByBook.get(row.id) ?? [],
      comments: commentByBook.get(row.id) ?? null,
      identifiers: identifiersByBook.get(row.id) ?? {},
      formats: formatsByBook.get(row.id) ?? [],
    }));
  }

  #all(sql, params = []) {
    return this.#db.prepare(sql).all(...params);
  }
}

function placeholders(values) {
  return values.map(() => '?').join(',');
}

function groupBy(rows, keyFn, valueFn) {
  const map = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(valueFn(row));
  }
  return map;
}
