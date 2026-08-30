import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";

export default function(eleventyConfig) {
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {widths: [200, 'auto']});
  eleventyConfig.addGlobalData("layout", "layout.liquid");
  eleventyConfig.addLiquidFilter("json_encode", (v) => JSON.stringify(v, null, 2));
};
