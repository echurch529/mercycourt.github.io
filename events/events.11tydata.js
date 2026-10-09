module.exports = {
  eleventyComputed: {
    permalink: data => `/events/${data.slug}/`
  }
};
