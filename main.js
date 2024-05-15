const {
  selectRegion,
  openAmazon,
  processSearchItem,
} = require("./scrapingFunctions");
const { sleep } = require("./utils");
const puppeteer = require("puppeteer-extra");
const fs = require("fs");
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { connectDB } = require("./connectDB");
const { configuration } = require("./configuration");
  
puppeteer.use(StealthPlugin());

const launchProcess = async (searchList) => {

  await connectDB();

  const browser = await puppeteer.launch({
    headless: configuration.headless,
    // defaultViewport: { width: 1920, height: 1080 }
  });

  let remainingList = [...searchList];

  try {
    let page = {};
    page = await openAmazon(page, browser);

    await selectRegion("UK", page);

    for (let i = 0; i < searchList.length; i++) {
      let searchItem = searchList[i];

      console.log(
        `🎊 Searching string  ===========>  [${i}/${searchList.length}] ----> ${searchItem}`
      );
      await processSearchItem(searchItem, page, browser);
      await sleep(5000);
      remainingList.shift();
    }
  } catch (err) {
    console.log("[BoSS ERROR]", err);
    await browser.close();
    launchProcess(remainingList);
  }

  // Close the browser
  await browser.close();
};



module.exports = {launchProcess}
