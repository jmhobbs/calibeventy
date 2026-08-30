export default function(eleventyConfig) {
  eleventyConfig.addGlobalData("layout", "layout.liquid");
  eleventyConfig.addLiquidFilter("json_encode", (v) => JSON.stringify(v, null, 2));
  eleventyConfig.addPassthroughCopy("Calibre Library/**/*.jpg");
};
