import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import humanize from 'humanize';
import sanitizeHtml from 'sanitize-html';

// By setting this to true, eleventy will copy all your eBook files
// to the built site, and add download links. Be careful with this one.
const includeBookFiles = process.env.INCLUDE_BOOK_FILES === 'true';

export default function(eleventyConfig) {
  eleventyConfig.addPlugin(
    eleventyImageTransformPlugin,
    {
      widths: [200],
      formats: [ "avif", "webp", "jpeg"],
      sharpJpegOptions: { quality: 75 }
    },
  );
  
  eleventyConfig.addGlobalData("layout", "layout.liquid");
  eleventyConfig.addGlobalData("includeBookFiles", includeBookFiles);

  eleventyConfig.addFilter("humanize_filesize", humanize.filesize);
  eleventyConfig.addFilter("sanitized_html", (input) => {
    if(typeof(input) !== 'string') return '';
    return sanitizeHtml(input, { allowedTags: ['br', 'i', 'em' ] });
  });
  eleventyConfig.addFilter("json_encode", (v) => JSON.stringify(v, null, 2));

  if(includeBookFiles) {
    eleventyConfig.addPassthroughCopy("Calibre Library/**/*.epub");
    eleventyConfig.addPassthroughCopy("Calibre Library/**/*.pdf");
    eleventyConfig.addPassthroughCopy("Calibre Library/**/*.mobi");
    eleventyConfig.addPassthroughCopy("Calibre Library/**/*.cbz");
  }
};
