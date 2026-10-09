const { DateTime } = require("luxon");
const markdownIt = require("markdown-it");

const md = markdownIt({ html: true });

function _escHtml(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function _escAttr(s){return String(s).replace(/"/g,"&quot;").replace(/'/g,"&#39;");}

module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("assets");

  // Pin markdown-it with html:true (Eleventy 2.0 default — explicit to guard future upgrades)
  eleventyConfig.setLibrary("md", md);

  // mc-components: replace <!--mc-*--> comment blocks with styled HTML
  // Must run before any minification transform
  eleventyConfig.addTransform("mc-components", function(content, outputPath) {
    if (!outputPath || !outputPath.endsWith(".html")) return content;
    if (!content.includes("<!--mc-")) return content;
    content = content.replace(/<!--mc-callout\n({[^\n]+})\n-->/g, function(full, raw) {
      try {
        var f = JSON.parse(raw);
        var style = /^(highlight|tip|important)$/.test(f.style) ? f.style : "highlight";
        var label = f.title ? '<span class="mc-callout__label">' + _escHtml(f.title) + "</span>" : "";
        var body = md.render(f.text || "");
        return '<aside class="mc-callout mc-callout--' + style + '">' + label + body + "</aside>";
      } catch(e) { return full; }
    });
    content = content.replace(/<!--mc-quote\n({[^\n]+})\n-->/g, function(full, raw) {
      try {
        var f = JSON.parse(raw);
        var parts = [];
        if (f.attribution) parts.push(_escHtml(f.attribution));
        if (f.source) parts.push("<cite>" + _escHtml(f.source) + "</cite>");
        var caption = parts.length ? "<figcaption>\u2014 " + parts.join(", ") + "</figcaption>" : "";
        return '<figure class="mc-quote"><blockquote><p>' + _escHtml(f.text || "") + "</p></blockquote>" + caption + "</figure>";
      } catch(e) { return full; }
    });
    content = content.replace(/<!--mc-ctabox\n({[^\n]+})\n-->/g, function(full, raw) {
      try {
        var f = JSON.parse(raw);
        var target = (f.new_tab === true || f.new_tab === "true") ? ' target="_blank" rel="noopener noreferrer"' : "";
        var body = md.render(f.text || "");
        var btn = '<a href="' + _escAttr(f.button_url || "#") + '" class="mc-cta__btn"' + target + ">" + _escHtml(f.button_label || "") + "</a>";
        return '<div class="mc-cta"><h3>' + _escHtml(f.heading || "") + "</h3>" + body + btn + "</div>";
      } catch(e) { return full; }
    });
    return content;
  });

  eleventyConfig.addPassthroughCopy("CNAME");

  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("admin");

  eleventyConfig.ignores.add("blog.html");
  eleventyConfig.ignores.add("functions");
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

  eleventyConfig.addCollection("eventPages", (api) =>
    api.getFilteredByGlob("events/*.html")
      .sort((a, b) => {
        const da = new Date(a.data.event_start_date || a.data.date || 0);
        const db = new Date(b.data.event_start_date || b.data.date || 0);
        return db - da;
      })
  );

  eleventyConfig.addFilter("postDate", (dateObj) =>
    DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("LLLL d, yyyy")
  );

  eleventyConfig.addFilter("isoDate", (dateObj) => {
    if (!dateObj) return "";
    if (typeof dateObj === "string") {
      const m = dateObj.match(/^(\d{4}-\d{2}-\d{2})/);
      return m ? m[1] : "";
    }
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("yyyy-MM-dd");
  });

  eleventyConfig.addFilter("whereData", (array, key, value) =>
    (array || []).filter((item) => item.data[key] === value)
  );

  eleventyConfig.addFilter("sortByDataKey", (array, key, ascending) => {
    const copy = [...(array || [])];
    copy.sort((a, b) => {
      const va = a.data[key] || "";
      const vb = b.data[key] || "";
      if (ascending) return va < vb ? -1 : va > vb ? 1 : 0;
      return va > vb ? -1 : va < vb ? 1 : 0;
    });
    return copy;
  });

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

  eleventyConfig.addFilter("urlencode", s => encodeURIComponent(String(s)));
  eleventyConfig.addFilter("split", (str, sep) => String(str || "").split(sep));

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
