const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("CNAME");
  eleventyConfig.addPassthroughCopy("_redirects");
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

  eleventyConfig.addFilter("cleanUrl", (url) =>
    (url || "").replace(/\.html$/, "") || "/"
  );

  // Build-time linter: warns on common blog post authoring mistakes.
  // Warnings only — never fails the build or modifies output.
  eleventyConfig.addTransform("blog-post-lint", function(content, outputPath) {
    if (!outputPath || !outputPath.includes("/blog-posts/") || !outputPath.endsWith(".html")) {
      return content;
    }
    const warnings = [];

    if (content.includes("(link to ")) {
      warnings.push('placeholder link text "(link to ...)" found — replace with [text](url) syntax');
    }

    const imgNoAlt = content.match(/<img(?![^>]*\balt\s*=)[^>]*/gi) || [];
    if (imgNoAlt.length > 0) {
      warnings.push(`${imgNoAlt.length} <img> tag(s) missing alt attribute`);
    }

    const titleMatch = content.match(/<title>([^<]+)<\/title>/);
    if (titleMatch && !titleMatch[1].includes("| Mercy Court")) {
      warnings.push(`<title> missing "| Mercy Court": "${titleMatch[1]}"`);
    }

    if (warnings.length > 0) {
      const short = outputPath.replace(/^.*\/_site\//, "");
      console.warn(`\n⚠️  Blog post lint — ${short}:`);
      warnings.forEach((w) => console.warn(`   · ${w}`));
      console.warn("");
    }
    return content;
  });

  return {
    dir: { input: ".", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["html", "njk", "md"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: false,
  };
};
