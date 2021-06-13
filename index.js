const puppeteer = require("puppeteer-extra");
const axios = require("axios");
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

  const contract = await page.evaluate(() => {
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

    const getContractName = () => {
      const elements = document.evaluate(
        "//dt[contains(., 'Contract Name')]",
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
      contractAddress: document.querySelector("h3.contract-address").innerText,
      contractName: getContractName(),
      compilerVersion: getCompilerVersion(),
      evmVersion: getEVMVersion(),
      optimizationEnabled: getOptimizationEnabled(),
      code: getCode(),
    };
  });

  console.log(contract);

  console.log({
    apikey: "JQG7R3JJGGCMA9CY2S6ABN9KVB1T5VTYCB",
    module: "contract",
    action: "verifysourcecode",
    contractname: contract.contractName,
    contractAddress: contract.contractAddress,
    sourceCode: contract.code,
    codeformat: "solidity-single-file",
    compilerversion: contract.compilerVersion,
    optimizationUsed: contract.optimizationEnabled ? 1 : 0,
    runs: 200,
    evmVersion: contract.evmVersion,
    licenseType: 3,
  });

  try {
    const { data } = await axios.post(
      "https://api.polygonscan.com/api",
      new URLSearchParams({
        apikey: "JQG7R3JJGGCMA9CY2S6ABN9KVB1T5VTYCB",
        module: "contract",
        action: "verifysourcecode",
        contractname: contract.contractName,
        contractAddress: contract.contractAddress,
        sourceCode: contract.code,
        codeformat: "solidity-single-file",
        compilerversion: contract.compilerVersion,
        optimizationUsed: contract.optimizationEnabled ? 1 : 0,
        runs: 200,
        evmVersion: contract.evmVersion,
        licenseType: 3,
      })
    );

    console.log(data);

    if (data.status == "1") {
      console.log(
        `https://api.polygonscan.com/api?apikey=JQG7R3JJGGCMA9CY2S6ABN9KVB1T5VTYCB&module=contract&action=checkverifystatus&guid=${data.result}`
      );
    }
  } catch (error) {
    console.log("Error: " + error.messsage);
  }

  browser.close();

  exit(0);
};

try {
  run();
} catch (error) {
  run();
}
