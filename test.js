const { sendDiscordMessage } = require("./sendDiscord");


const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

(async () => {
  const puppeteer = require("puppeteer");
  const fs = require("fs");

  const browser = await puppeteer.launch({
    headless: true,
  });

  const page = await browser.newPage();

  await page.goto(
    "https://www.amazon.co.uk/books-used-books-textbooks/b/?ie=UTF8&node=266239&ref_=nav_cs_books"
  );

  await page.click("#sp-cc-accept");
  // getall cards
 let finalDiscounted = await page.evaluate(() => {
    let cardsNodes = document.querySelectorAll(
      ".octopus-pc-item.octopus-pc-item-v3"
    );

    let cardsList = Array.from(cardsNodes);

    let finalProductsDiscounted = [];

    cardsList.forEach((el) => {
      try {
        let isDiscount = el.querySelector(
          ".a-size-mini.a-color-tertiary.a-text-strike"
        );

        if (isDiscount) {
          console.log("discount here ", el);

          const linkElement = el.querySelector(
            ".a-link-normal.octopus-pc-item-link"
          );
          const priceElement = el.querySelector(".a-price");
          //  a-link-normal octopus-pc-item-link
          const imgElement = el.querySelector(
            ".octopus-pc-item-image.octopus-pc-item-image-v3"
          );
          const realPriceElement = el.querySelector(
            ".a-size-mini.a-color-tertiary.a-text-strike"
          );

          //  const productName = el.querySelector('.a-truncate-full.a-offscreen');

          const link = linkElement.href;
          const productName = linkElement.title;
          const productCurrentPrice = priceElement.firstChild.textContent;
          const imgLink = imgElement.src;
          const realPrice = realPriceElement.textContent;

          let dataObj = {
            title: productName,
            promotionType: "Regular  🍒 ",
            oldPrice: realPrice.replace(/\n/g,"").trim(),
            currentPrice: productCurrentPrice,
            imgLink,
            detailLink: link,
          };
          finalProductsDiscounted.push(dataObj);

          console.log("this is the el  ", el);
        } else {
          console.log("No discount here");
        }
      } catch (err) {
        console.log("errr");
      }
    });

    return finalProductsDiscounted;
  });



 for(let i = 0; i< finalDiscounted.length; i++){

  let el = finalDiscounted[i]

  console.log("this is being sent " , el)

  await sleep(3000)

   await sendDiscordMessage(el)
  }

  // Close the browser
  //   await browser.close();
})();
