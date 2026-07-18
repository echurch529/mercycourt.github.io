module.exports = {
  permalink: function(data) {
    // Keep .html files at their original paths (e.g. about-us.html → /about-us.html)
    if (data.page.inputPath.endsWith('.html') && !data.permalink) {
      return data.page.filePathStem + '.html';
    }
    return data.permalink;
  }
};
