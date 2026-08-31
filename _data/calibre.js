import { CalibreLibrary } from "../calibre/src/index.js";
import slugify from '@sindresorhus/slugify';

export default async function () {
  const library = new CalibreLibrary('./Calibre Library/')
  const books = library.listBooks();

  const series = {};
  books.forEach((book) => {
    if(book.series) {
      if(series[book.series.id] == undefined) {
        series[book.series.id] = [];
      }
      series[book.series.id].push(book);
    }
  });
  for (let id in series) {
    series[id].sort((a, b) => a.series.index - b.series.index);
  }

  const authors = {};
  books.forEach((book) => {
    book.authors.forEach((author) => {
        authors[author.id] = author;
    })
  });

  const publishers = {};
  books.forEach((book) => {
    if(book.publisher) {
      publishers[book.publisher.id] = book.publisher;
    }
  });
 
  const tags = {};
  books.forEach((book) => {
    book.tags.forEach((tag) => {
      const slug = slugify(tag);
      if(tags[slug] === undefined) {
        tags[slug] = {name: tag, books: []};
      }
      tags[slug].books.push(book);
    });
  });

  return {
    books,
    series,
    authors: Array.from(Object.values(authors)).sort((a, b) => a.sort.localeCompare(b.sort)),
    publishers: Array.from(Object.values(publishers)).sort((a, b) => a.name.localeCompare(b.name)),
    tags: Array.from(Object.entries(tags)).map(([slug, body]) => ({ slug, body })).sort((a, b) => a.slug.localeCompare(b.slug)),
  }
};
