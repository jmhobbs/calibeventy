# calibre-reader

Read-only access to a Calibre library. Lists books, reads their metadata, and
resolves absolute paths to their cover and ebook files.

Uses Node's built-in `node:sqlite` module and opens `metadata.db` with
`SQLITE_OPEN_READONLY` — the connection itself rejects writes, this isn't just
an app-level convention. There are no write methods in the public API.

Requires Node >= 22.5 (Node 22 needs `--experimental-sqlite`; Node 23+ needs no flag,
just prints a one-line experimental warning).

## Usage

```js
import { CalibreLibrary } from './calibre/src/index.js';

const library = new CalibreLibrary('/path/to/Calibre Library');

const books = library.listBooks();       // every book
const book = library.getBook(1);         // a single book, or null

library.close();
```

## Book shape

```js
{
  id: 1,
  title: 'My Friends: A Novel',
  sort: 'My Friends: A Novel',
  timestamp: '2026-08-29 23:46:00.472440+00:00',
  pubdate: '2025-05-06 00:00:00+00:00',
  authorSort: 'Backman, Fredrik',
  uuid: '6f3eb18e-...',
  hasCover: true,
  coverPath: '/path/to/Calibre Library/Fredrik Backman/My Friends_ A Novel (1)/cover.jpg',
  lastModified: '2026-08-29 23:46:00.499312+00:00',
  libraryPath: 'Fredrik Backman/My Friends_ A Novel (1)', // relative to the library root
  authors: [{ id: 1, name: 'Fredrik Backman', sort: 'Backman, Fredrik' }],
  series: { id: 2, name: 'Some Series', sort: 'Some Series', index: 1.0 } | null,
  publisher: { id: 1, name: 'Atria Books' } | null,
  rating: 8 | null,        // 0-10 half-star scale, or null if unrated
  tags: ['Fiction'],
  languages: ['eng'],
  comments: '<p>HTML description</p>' | null,
  identifiers: { isbn: '9780000000000', goodreads: '12345' },
  formats: [
    { format: 'EPUB', path: '/path/to/.../My Friends....epub', sizeBytes: 3416552 },
  ],
}
```

`coverPath` and every path inside `formats` are absolute filesystem paths,
already joined with the library root you passed to the constructor.

## Testing

```
node --test
```

Tests build a throwaway Calibre-shaped SQLite database under the OS temp
directory (see `test/fixtures/build-library.js`) — nothing here touches a real
library.
