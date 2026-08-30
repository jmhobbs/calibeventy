import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import humanize from 'humanize';
import sanitizeHtml from 'sanitize-html';


export default function(eleventyConfig) {
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {widths: [200, 'auto']});
  
  eleventyConfig.addGlobalData("layout", "layout.liquid");

  eleventyConfig.addFilter("humanize_filesize", humanize.filesize);
  eleventyConfig.addFilter("sanitized_html", (input) => {
    if(typeof(input) !== 'string') return '';
    return sanitizeHtml(input, { allowedTags: ['br', 'i', 'em' ] });
  });
  eleventyConfig.addFilter("json_encode", (v) => JSON.stringify(v, null, 2));
};
