import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { rmSync } from 'node:fs';
import path from 'node:path';
import { CalibreLibrary } from '../src/index.js';
import { createTestLibrary } from './fixtures/build-library.js';

describe('CalibreLibrary', () => {
  const libraryPath = createTestLibrary();
  const library = new CalibreLibrary(libraryPath);

  after(() => {
    library.close();
    rmSync(libraryPath, { recursive: true, force: true });
  });

  test('listBooks returns every book, ordered by id', () => {
    const books = library.listBooks();
    assert.equal(books.length, 2);
    assert.deepEqual(books.map((book) => book.id), [1, 2]);
  });

  test('listBooks fully populates a book with every relationship set', () => {
    const [book] = library.listBooks();

    assert.equal(book.title, 'Test Book One');
    assert.equal(book.uuid, 'uuid-1');
    assert.equal(book.hasCover, true);
    assert.equal(book.libraryPath, 'Author First/Test Book One (1)');

    assert.deepEqual(
      book.authors.map((author) => author.name),
      ['First Author', 'Second Author']
    );
    assert.deepEqual(book.series, { id: 1, name: 'Test Series', sort: 'Test Series', index: 2.0 });
    assert.deepEqual(book.publisher, { id: 1, name: 'Test Publisher' });
    assert.equal(book.rating, 8);
    assert.deepEqual(book.tags, ['Adventure', 'Fiction']);
    assert.deepEqual(book.languages, ['eng']);
    assert.equal(book.comments, '<p>A description.</p>');
    assert.deepEqual(book.identifiers, { isbn: '9780000000001', goodreads: '12345' });
  });

  test('listBooks leaves absent relationships as null/empty rather than throwing', () => {
    const books = library.listBooks();
    const book = books.find((b) => b.id === 2);

    assert.equal(book.series, null);
    assert.equal(book.publisher, null);
    assert.equal(book.rating, null);
    assert.deepEqual(book.tags, []);
    assert.deepEqual(book.languages, []);
    assert.equal(book.comments, null);
    assert.deepEqual(book.identifiers, {});
    assert.equal(book.hasCover, false);
    assert.equal(book.coverPath, null);
  });

  test('getBook returns a single book by id', () => {
    const book = library.getBook(2);
    assert.equal(book.title, 'Test Book Two');
    assert.deepEqual(
      book.authors.map((author) => author.name),
      ['Third Author']
    );
  });

  test('getBook returns null for an id that does not exist', () => {
    assert.equal(library.getBook(999), null);
  });

  test('resolves absolute file paths for every format a book has', () => {
    const book = library.getBook(1);
    assert.deepEqual(
      book.formats.map((format) => format.format),
      ['EPUB', 'PDF']
    );
    assert.equal(
      book.formats[0].path,
      path.join(libraryPath, 'Author First/Test Book One (1)', 'Test Book One - First Author.epub')
    );
    assert.equal(book.formats[0].sizeBytes, 1000);
  });

  test('resolves the cover path only when has_cover is set', () => {
    const withCover = library.getBook(1);
    assert.equal(
      withCover.coverPath,
      path.join(libraryPath, 'Author First/Test Book One (1)', 'cover.jpg')
    );

    const withoutCover = library.getBook(2);
    assert.equal(withoutCover.coverPath, null);
  });
});

describe('CalibreLibrary read-only guarantee', () => {
  test('opens metadata.db with readOnly and fileMustExist set', () => {
    let capturedPath;
    let capturedOptions;
    class FakeDatabaseSync {
      constructor(dbPath, options) {
        capturedPath = dbPath;
        capturedOptions = options;
      }
      prepare() {
        throw new Error('not used by this test');
      }
      close() {}
    }

    new CalibreLibrary('/some/library', { DatabaseSyncImpl: FakeDatabaseSync });

    assert.match(capturedPath, /metadata\.db$/);
    assert.equal(capturedOptions.readOnly, true);
    assert.equal(capturedOptions.fileMustExist, true);
  });

  test('a readOnly connection to a real metadata.db rejects writes', () => {
    const libraryPath = createTestLibrary();
    const dbPath = path.join(libraryPath, 'metadata.db');
    const readOnlyDb = new DatabaseSync(dbPath, { readOnly: true });

    assert.throws(() => readOnlyDb.exec("INSERT INTO tags (name) VALUES ('nope')"));

    readOnlyDb.close();
    rmSync(libraryPath, { recursive: true, force: true });
  });
});
