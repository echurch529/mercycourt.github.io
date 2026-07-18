const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("CNAME");
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("admin");

  eleventyConfig.ignores.add("blog.html");
  eleventyConfig.ignores.add("sitemap.xml");
  eleventyConfig.ignores.add("blog-posts");
  eleventyConfig.ignores.add("node_modules");
  eleventyConfig.ignores.add("pages");
  eleventyConfig.ignores.add("marketingskills");
  eleventyConfig.ignores.add("screenshots");
  eleventyConfig.ignores.add("Reference");
  eleventyConfig.ignores.add("README.md");
  eleventyConfig.ignores.add("CMS_STATE.md");

  eleventyConfig.addCollection("posts", (api) =>
    api.getFilteredByGlob("src/blog-posts/*.md").sort((a, b) => b.date - a.date)
  );

  eleventyConfig.addFilter("postDate", (dateObj) =>
    DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("LLLL d, yyyy")
  );

  eleventyConfig.addFilter("isoDate", (dateObj) =>
    DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("yyyy-MM-dd")
  );

  eleventyConfig.addFilter("where", (array, key, value) => {
    return (array || []).filter((item) => {
      const keys = key.split(".");
      let val = item;
      for (const k of keys) val = val ? val[k] : undefined;
      return val === value;
    });
  });

  eleventyConfig.addFilter("except", (array, url) =>
    (array || []).filter((item) => item.url !== url)
  );

  eleventyConfig.addFilter("limit", (array, n) => (array || []).slice(0, n));

  return {
    dir: { input: ".", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["html", "njk", "md"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: false,
  };
};
