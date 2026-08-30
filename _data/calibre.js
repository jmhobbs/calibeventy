import { CalibreLibrary } from "../calibre/src/index.js";

export default async function () {
  const library = new CalibreLibrary('./Calibre Library/')
  return { books: library.listBooks() }
};
