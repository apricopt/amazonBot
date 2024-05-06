const axios = require('axios');


async function sendDiscordMessage(message) {
    try {
        const webhookURL = 'https://discord.com/api/webhooks/1235620178885087284/Nd7aDdUvVK6mHlKDYv_ZG6v5tHtZNz53It9sxxW8MrArdH6Thk69Z0cm29jClWUE5rON';
        const response = await axios.post(webhookURL, {
            content:`🔸 Product Name: ${message.title}\n🔸 Promotion String: ✨ ${message.promotionType} ✨\n🔸 Price: ${message.price}
            \n
            [Check Details](${message.detailLink})!`,
            embeds: [{
                image: {
                    url: message.imgLink
                }
            }]
        });
        console.log('Message sent successfully:', response.data);
    } catch (error) {
        console.error('Error sending message:', error.message);
    }
}

const messageObj = {
    title: `Check out this Discounted Product`,
    promotionType: "Regular 🍒 ",
    discountPercentage: "40%",
    imgLink : "https://m.media-amazon.com/images/I/71ImfTaemnL._AC._SR360,460.jpg",
    detailLink: "https://www.amazon.co.uk/Murdle-Devilishly-Devious-Mystery-Puzzles/dp/1800818025?ref_=Oct_d_obs_d_266239_11&pd_rd_w=i7U4p&content-id=amzn1.sym.54dbc3e0-0af2-4799-958e-2850f74919e9&pf_rd_p=54dbc3e0-0af2-4799-958e-2850f74919e9&pf_rd_r=WH14AVNYXYAE4501GVHX&pd_rd_wg=GhJWD&pd_rd_r=06878f34-81dd-428c-af7b-5e8f3e33badf&pd_rd_i=1800818025",
}


// Call the function to send the message
// sendDiscordMessage(messageObj)


module.exports = {sendDiscordMessage}