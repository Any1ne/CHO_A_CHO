/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://www.choacho.com.ua",
  generateRobotsTxt: true,
  outDir: "./public",
  changefreq: "daily",
  priority: 0.7,
  sitemapSize: 5000,

  transform: async (config, path) => {
  if (path.startsWith("/store/")) {
    return {
      loc: path,
      changefreq: "daily",
      priority: 0.9,
      lastmod: new Date().toISOString(),
    };
  }

  // Для всіх інших стандартних сторінок
  return {
    loc: path,
    changefreq: "daily",
    priority: 0.7,
    lastmod: new Date().toISOString(),
  };
},


  // 🧩 Додаємо всі продукти вручну (через async)
  additionalPaths: async (config) => {
    const res = await fetch("https://www.choacho.com.ua/api/google-feed");
    const xml = await res.text();
    const matchIds = Array.from(xml.matchAll(/<g:id>(.*?)<\/g:id>/g)).map((m) => m[1]);

    const items = matchIds.map((id) => ({
      loc: `/store/${encodeURIComponent(id)}`,
      changefreq: "daily",
      priority: 0.9,
      lastmod: new Date().toISOString(),
    }));

    console.log(`🧭 Added ${items.length} product URLs to sitemap.`);
    return items;
  },
};
