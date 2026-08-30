import { CalibreLibrary } from "../calibre/src/index.js";

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

  const authors= {};
  books.forEach((book) => {
    book.authors.forEach((author) => {
        authors[author.id] = author;
    })
  });

  return {
    books,
    series,
    authors: Array.from(Object.values(authors)).sort((a, b) => a.sort.localeCompare(b.sort)),
  }
};
