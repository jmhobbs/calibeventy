# calibeventy

The sacred union of your [Calibre](https://calibre-ebook.com/) library and [eleventy](https://www.11ty.dev/), come together to create a lil' static site baby of all your books.

![A calibeventy website](/.github/readme/calibeventy.png)

## How it works

The gobal data file `calibre.js` reads your Calibre Library database and mangles it into a big old object.  Eleventy templates then generate pages off that data and build you a nice website.

## Getting Started

To use calibeventy, you need to symlink (or move, if you're feeling frisky) your `Calibre Library` directory into the root of this repository.

After that, it's just eleventy, so let 'er rip with a `npm run dev` or a `npm run build`

### Download Links

> [!CAUTION]
> Don't do a copyright violation my dudes.

If you would like to include your eBook files in the output site, and allow for downloads, set the environment variable `INCLUDE_BOOK_FILES` to the string `true` during build.
