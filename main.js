const { sendDiscordMessage } = require("./sendDiscord");

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

let searchList = ["L'Oréal Paris Powder Foundation"];



(async () => {

  try{
    const puppeteer = require("puppeteer");
    const fs = require("fs");
  
    const browser = await puppeteer.launch({
      headless: false,
    });
  
    
    const page = await browser.newPage();
  
    await page.goto("https://www.amazon.co.uk");
  
    // deliver to setup
    await page.click("#nav-global-location-popover-link");
  
    await sleep(4000);
  
    await page.click(
      "xpath=//html/body/div[3]/div/div/div/div/div[2]/div[3]/div[4]/span/span"
    );
  
    await sleep(2000);
    await page.click('[aria-labelledby="GLUXCountryList_230"]');
  
    // deliver to setup ends
  
    // pressing cookie button
    await sleep(4000);
  
    await page.click("#sp-cc-accept");
  
    // cookie button end.
  
    //type search
    await page.type("#twotabsearchtextbox", searchList[0]);
    await page.click("#nav-search-submit-button");
  
    // getall cards
  
    await page.waitForSelector('[data-component-type="s-search-result"]');
  
    await sleep(5000)
  
    let LinksToOpen = await page.evaluate(() => {
      const elementNodes = document.querySelectorAll(
        '[data-component-type="s-search-result"]'
      );
  
      const products = Array.from(elementNodes);
  
      let linkList = products.map((el) => {
        let link = el.querySelector(
          ".a-link-normal.s-underline-text.s-underline-link-text.s-link-style.a-text-normal"
        );
  
        // console.log("this is the link ", link)
  
        return link.href;
      });
  
      return linkList;
      // return []
    });
  
  
    let thisLink = LinksToOpen[7]
  
    const detailPage = await browser.newPage();
    await detailPage.goto(thisLink, {timeout: 60000});
  
    await sleep(3000)
  
  
  
    const ProductInfo = await detailPage.evaluate(() => {
  let isSale = ''
      try{
  
        function IsPromotionStringOfGetPriceof(inputString) {
          const regex = /^.*Get \d+ for the price of \d+.*$/;
          return regex.test(inputString);
        }
  
        let parent = document.querySelector('.promoPriceBlockMessage')
  
        let element =  parent.lastElementChild.lastElementChild.innerText
        if(IsPromotionStringOfGetPriceof(element)){
          isSale = element
          console.log(isSale)
          const productName = document.querySelector('#productTitle').innerText;
          const imgLink = document.querySelector('#landingImage').src
          const priceElements =  document.querySelector('[data-a-color="price"]')
          const price = priceElements.innerText
  
          console.log("productName ", productName);
          console.log("imgLink ",imgLink);
          console.log("price", price)
          return {
            isSale,  productName, imgLink,price: price.split('\n')[0]
            }
      
      
        }else {
  console.log("Its not that sale")
        }
     
  
  
       
  return {isSale}
      
      }catch(error){
  
        console.log(error)
  
        return {isSale}
      }
    })
  
  
    if(ProductInfo.isSale) {
      console.log("This is product info we got " , ProductInfo)
      sendDiscordMessage({
        title: ProductInfo.productName,
        promotionType : ProductInfo.isSale,
        price: ProductInfo.price,
        detailLink: thisLink,
        imgLink: ProductInfo.imgLink

      })
    }
  
  }catch(err) {

    console.log("[BoSS ERROR]" , err)
  }
  

  


  //  for(let i = 0; i< finalDiscounted.length; i++){

  //   let el = finalDiscounted[i]

  //   console.log("this is being sent " , el)

  //   await sleep(3000)

  //    await sendDiscordMessage(el)
  //   }

  // Close the browser
  //   await browser.close();
})();
