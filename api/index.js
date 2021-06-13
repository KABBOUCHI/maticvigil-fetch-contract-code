const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

module.exports = async (req, res) => {
  const browser = await puppeteer.launch({
    headless: true,
  });

  const page = await browser.newPage();

  page.setDefaultNavigationTimeout(0);

  await page.goto(url, {
    waitUntil: "load",
    timeout: 60000,
  });

  await browser.close();

  res.json({
    body: req.body,
    query: req.query,
    cookies: req.cookies,
  });
};
