const {
  selectRegion,
  openAmazon,
  processSearchItem,
} = require("./scrapingFunctions");
const { searchList } = require("./searchList");
const { sleep } = require("./utils");
const puppeteer = require("puppeteer-extra");
const fs = require("fs");
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
  
puppeteer.use(StealthPlugin());

const launchProcess = async (searchList) => {

  const browser = await puppeteer.launch({
    headless: false,
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
        `🎊 Searching string  ===========>  [${i}/${searchList.length}]`
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

launchProcess(searchList);
