const puppeteer = require("puppeteer-extra");
const { exit, argv } = require("yargs");

const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const run = async () => {
  const browser = await puppeteer.launch({
    headless: true,
  });

  const page = await browser.newPage();

  page.setDefaultNavigationTimeout(0);

  let url = "";

  if (argv.url) {
    url = argv.url;
  } else if (argv.address) {
    url = `https://explorer-mainnet.maticvigil.com/address/${argv.address}/contracts`;
  } else {
    console.log("Usage: --url=");
    exit(0);
    return;
  }

  await page.goto(url, {
    waitUntil: "load",
    timeout: 60000,
  });

  await page.waitForTimeout(6000); // wait for cloudflare

  await page.waitForSelector(".address-overview");

  const sourceCode = await page.evaluate(() => {
    const sourceCodes = document.evaluate(
      "//h3[contains(., 'Contract source code')]",
      document,
      null,
      XPathResult.ANY_TYPE,
      null
    );
    const sourceCode = sourceCodes.iterateNext();

    return sourceCode
      ? sourceCode.nextElementSibling.getAttribute("data-clipboard-text")
      : null;
  });

  console.log(sourceCode);

  browser.close();

  exit(0);
};

run();
