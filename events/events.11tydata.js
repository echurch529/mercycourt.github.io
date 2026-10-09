module.exports = {
  eleventyComputed: {
    permalink: data => data.slug ? `/events/${data.slug}/` : undefined
  }
};
