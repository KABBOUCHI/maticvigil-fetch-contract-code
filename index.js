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

  const data = await page.evaluate(() => {
    const getCode = () => {
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
    };

    const getCompilerVersion = () => {
      const elements = document.evaluate(
        "//dt[contains(., 'Compiler version')]",
        document,
        null,
        XPathResult.ANY_TYPE,
        null
      );

      const element = elements.iterateNext();

      return element ? element.nextElementSibling.innerText : null;
    };

    const getEVMVersion = () => {
      const elements = document.evaluate(
        "//dt[contains(., 'EVM Version')]",
        document,
        null,
        XPathResult.ANY_TYPE,
        null
      );

      const element = elements.iterateNext();

      return element ? element.nextElementSibling.innerText : null;
    };

    const getOptimizationEnabled = () => {
      const elements = document.evaluate(
        "//dt[contains(., 'Optimization enabled')]",
        document,
        null,
        XPathResult.ANY_TYPE,
        null
      );

      const element = elements.iterateNext();

      return element
        ? element.nextElementSibling.innerText === "true"
          ? true
          : false
        : null;
    };

    return {
      compilerVersion: getCompilerVersion(),
      evmVersion: getEVMVersion(),
      optimizationEnabled: getOptimizationEnabled(),
      code: getCode(),
    };
  });

  console.log(data);

  browser.close();

  exit(0);
};

try {
  run();
} catch (error) {
  run();
}
