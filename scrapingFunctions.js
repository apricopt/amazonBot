const { sleep } = require("./utils");
const { sendDiscordMessage, sendCaptcha } = require("./sendDiscord");
const { configuration } = require("./configuration");
const Product = require("./Models/Products");
const  userAgent = require('user-agents');

const readline = require("readline-sync");

const processDetailPageViaLink = async (thisLink, browser) => {
  try {
    const detailPage = await browser.newPage();
    await detailPage.goto(thisLink, { timeout: 60000 });

    const ProductInfo = await detailPage.evaluate((configuration) => {
      let isSale = "";
      try {
        function IsPromotionStringOfGetPriceof(inputString) {
          const regex = /^.*Get \d+ for the price of \d+.*$/; // get any number for the price of
          const regex2 = /^.*Get any.*$/; // Get any for price of
          const regex3 = /^.*2 for.*$/; // buy one get one free
          const regex4 = /^.*on any.*$/;
          return (
            regex.test(inputString) ||
            regex2.test(inputString) ||
            regex3.test(inputString)
          );
        }

        function IsEnoughSalesLastMonth(inputString) {
          let finalNumber = 0 ;
          const sales = parseInt(inputString.replace(/\D/g, ""), 10);
          if(inputString.includes("K")){
            finalNumber = sales*1000
          }else {
            finalNumber = sales
          }
          console.log(finalNumber)
          return finalNumber >= configuration.minimumNumberOfProductsSold;
        }

        function formatPrice(price) {
          let numberPrice = price.match(/\d+/g).map(Number);

          let finalPrice = `${numberPrice[0]}.${numberPrice[1]}`;

          return finalPrice;
        }

        let parent = document.querySelector(".promoPriceBlockMessage");
        let numberOfSalesInPastMonthElement = document.querySelector(
          "#social-proofing-faceout-title-tk_bought"
        );

        let numberOfSales = numberOfSalesInPastMonthElement.innerText.trim();

        let element = parent.lastElementChild.lastElementChild.innerText;
        if (
          IsPromotionStringOfGetPriceof(element) &&
          IsEnoughSalesLastMonth(numberOfSales)
        ) {
          isSale = element;
          console.log(isSale);
          const productName = document.querySelector("#productTitle").innerText;
          const imgLink = document.querySelector("#landingImage").src;
          const priceElements = document.querySelector(
            '[data-a-color="price"]'
          );
          const price = priceElements.innerText;

          console.log("productName ", productName);
          console.log("imgLink ", imgLink);
          console.log("price", price);
          console.log("numberof sales ", numberOfSales);
          return {
            isSale,
            productName,
            imgLink,
            price: formatPrice(price.split("\n")[0]),
            numberOfSales: numberOfSales,
          };
        } else {
          console.log("Its not that sale");
        }

        return { isSale };
      } catch (error) {
        console.log(error);

        return { isSale };
      }
    }, configuration);

    // console.log("This is promotion String =======>  ", ProductInfo.isSale )
    if (ProductInfo.isSale) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      let exisitingProduct = await Product.findOne({
        name: ProductInfo.productName,
        dateCreated: { $gte: sevenDaysAgo },
      });

      if (exisitingProduct) {
        console.log(
          `[${ProductInfo.productName}] Was already In database so Not notifying through Discord!]`
        );
        await detailPage.close();
        return
      }

      let productToSave = new Product();
      productToSave.name = ProductInfo.productName;
      productToSave.promotionString = ProductInfo.isSale;
      productToSave.price = ProductInfo.price;
      productToSave.numberOfProductsSold = ProductInfo.numberOfSales;

      await productToSave.save();

      console.log("🛍️ ==> this is product Info ", ProductInfo);
      await sendDiscordMessage({
        title: ProductInfo.productName,
        promotionType: ProductInfo.isSale,
        price: ProductInfo.price,
        detailLink: thisLink,
        imgLink: ProductInfo.imgLink,
        numberOfSales: ProductInfo.numberOfSales,
      });
    }

    await detailPage.close();
  } catch (err) {
    console.log("Error detail page processing ", err);
    return;
  }
};

const processSearchItem = async (searchItem, page, browser) => {
  //type search
  const inputSelector = "#twotabsearchtextbox";
  await page.$eval(inputSelector, (input) => (input.value = ""));
  await page.type(inputSelector, searchItem);
  await page.click("#nav-search-submit-button");
  // getall cards

  let allPagesLinkCollector = [];
  let allPagesScraped = false;

  do {
    let linksofAllProducts = await getLinksOfAllProducts(page);
    allPagesLinkCollector.push(linksofAllProducts);
    allPagesLinkCollector = allPagesLinkCollector.flat(2);
    console.log("Total links Captured ==> ", allPagesLinkCollector.length);

    try {
      await page.evaluate(() => {
        document
          .querySelector(
            ".s-pagination-item.s-pagination-next.s-pagination-button.s-pagination-separator"
          )
          .click();
      });
    } catch (err) {
      console.log("All Pages Scraped 😅");
      allPagesScraped = true;
    }
  } while (!allPagesScraped);

  for (let i = 0; i < allPagesLinkCollector.length; i++) {
    let thisLink = allPagesLinkCollector[i];
    console.log(`Scanning products ${i}/${allPagesLinkCollector.length}`);

    await processDetailPageViaLink(thisLink, browser);
  }
};

const getLinksOfAllProducts = async (page) => {
  await page.waitForSelector('[data-component-type="s-search-result"]');

  await sleep(5000);

  let LinksToOpen = await page.evaluate((configuration) => {
    const elementNodes = document.querySelectorAll(
      '[data-component-type="s-search-result"]'
    );

    const products = Array.from(elementNodes);
    let productsToScan = [];

    if (configuration.scanWithSaveTagsOnly) {
      const filteredProducts = [];
      products.forEach((node) => {
        const childElement = node.querySelector(".s-highlighted-text-padding");
        if (childElement) {
          filteredProducts.push(node);
        }
      });
      productsToScan = filteredProducts;
    } else {
      productsToScan = products;
    }

    // console.log("This is products ", filteredProducts)

    let linkList = productsToScan.map((el) => {
      let link = el.querySelector(
        ".a-link-normal.s-underline-text.s-underline-link-text.s-link-style.a-text-normal"
      );

      return link.href;
    });

    return linkList;
  }, configuration);

  return LinksToOpen;
};

const openAmazon = async (page, browser) => {
  let isAmazonOpened = false;

  do {
    try {
      page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      );

      // await page.setUserAgent(userAgent.random().toString())
      

      if (configuration.useProxy) {
        await page.authenticate({
          username: configuration.proxySettings.username,
          password: configuration.proxySettings.password,
        });
      }


      await page.goto("https://www.amazon.co.uk");
      // deliver to setup

      try{
        await page.waitForSelector('.a-box-inner.a-padding-extra-large');
        await page.screenshot({
          "type": "png", 
          "path": "screenshot.png",  
          "fullPage": true, 
        })

        let img = await page.evaluate(() => {
          let imgTag = document.querySelector('.a-row.a-text-center img');
          return imgTag.src
        })

        await sendCaptcha(img)
        
        const searchItem = readline.question("Enter the captcha ?\n");

        await page.type('#captchacharacters', searchItem); 

        await page.click('button.a-button-text')


    
      }catch(err){
        console.log("No Captcha detected!!")
      }
     

      await sleep(10000)
      await page.click("#nav-global-location-popover-link");

      // await page.click("#sp-cc-accept");

      isAmazonOpened = true;

    } catch (err) {
      console.log(
        "[Problem launching amazon... Retrying Opening Amazon in 20 seconds. If Problem persist launch in non headless mode and see whats wrong]"
      );
      await sleep(20000);
    }
  } while (!isAmazonOpened);

  await sleep(4000);

  return page;
};

const selectRegion = async (region, page) => {
  if (region == "UK") {
    await page.type('[data-action="GLUXPostalInputAction"]', "TQ1 4LJ");
    await page.click('[data-action="GLUXPostalUpdateAction"]');

    await sleep(5000);

    await page.evaluate(() => {
      try{
        let a = document.querySelector("#GLUXConfirmClose-announce");
        a.click();
      }catch(err){
        console.log("erere", err)
      }
     
    });
  } else {
    await page.click(
      "xpath=//html/body/div[3]/div/div/div/div/div[2]/div[3]/div[4]/span/span"
    );

    await page.click('[aria-labelledby="GLUXCountryList_230"]');
  }

  // deliver to setup ends

  // pressing cookie button
  await sleep(4000);

  try{
    await page.click("#sp-cc-accept");
  }catch(err){}


  return page;

  // cookie button end.
};

module.exports = {
  processDetailPageViaLink,
  processSearchItem,
  openAmazon,
  selectRegion,
};
