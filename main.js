const { sendDiscordMessage } = require("./sendDiscord");
const {searchList} = require("./searchList")

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};




const processDetailPageViaLink = async (thisLink, browser) => {
  try{

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

      let parent = document.querySelector('.promoPriceBlockMessage');

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
   await sendDiscordMessage({
      title: ProductInfo.productName,
      promotionType : ProductInfo.isSale,
      price: ProductInfo.price,
      detailLink: thisLink,
      imgLink: ProductInfo.imgLink

    })
  }

  await detailPage.close();
  }catch(err) {
    console.log("Error detail page processing ")
    return 
  }
   
};


const processSearchItem = async(searchItem ,page, browser) => {

  //type search
  const inputSelector = "#twotabsearchtextbox"; 
  await page.$eval(inputSelector, input => input.value = '');
  await page.type(inputSelector, searchItem);
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



  for(let i = 0; i<  LinksToOpen.length; i++) {

    let thisLink = LinksToOpen[i]
    console.log(`Scanning products ${i}/${LinksToOpen.length}`)


    await processDetailPageViaLink(thisLink, browser)
  }

}


const launchProcess = async (searchList) => {

  const puppeteer = require("puppeteer");
  const fs = require("fs");

  const browser = await puppeteer.launch({
    headless: true,
  });


  let remainingList = [...searchList]

  try{

    let page = {}
    let isAmazonOpened = false
  

    do {
      try {
        page = await browser.newPage();
       await page.goto("https://www.amazon.co.uk");
       // deliver to setup
       await page.click("#nav-global-location-popover-link");
 
       isAmazonOpened = true
     }catch(err) {
      console.log("[Problem launching amazon... Retrying Opening Amazon in 20 seconds]")
      await sleep(20000)
      
     }
     
    }while (!isAmazonOpened)
   
  
  
    await sleep(4000);
  
    // await page.click(
    //   "xpath=//html/body/div[3]/div/div/div/div/div[2]/div[3]/div[4]/span/span"
    // );
  
    await sleep(2000);
    // await page.click('[aria-labelledby="GLUXCountryList_230"]');
    await page.type('[data-action="GLUXPostalInputAction"]', "TQ1 4LJ");
    await page.click('[data-action="GLUXPostalUpdateAction"]')

    await sleep(5000);

    // await page.click('#GLUXConfirmClose-announce')

    await page.evaluate(() => {
      let a = document.querySelector('#GLUXConfirmClose-announce');
      a.click();
    })
  
    // deliver to setup ends
  
    // pressing cookie button
    await sleep(4000);
  
    await page.click("#sp-cc-accept");
  
    // cookie button end.
  
  
    for(let i = 0; i< searchList.length; i++) {
      let searchItem = searchList[i]

      console.log(`🎊 Searching string  ===========>  [${i}/${searchList.length}]`);
      await processSearchItem(searchItem ,page, browser)
      await sleep(5000);
      remainingList.shift();

    }
    
   
  
  }catch(err) {

    console.log("[BoSS ERROR]" , err)
    await browser.close();
    launchProcess(remainingList)

  }
  


  // Close the browser
    await browser.close();
}



launchProcess(searchList)

