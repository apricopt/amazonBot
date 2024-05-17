const axios = require('axios');


async function sendDiscordMessage(message) {
    try {
        const webhookURL = 'https://discord.com/api/webhooks/1235620178885087284/Nd7aDdUvVK6mHlKDYv_ZG6v5tHtZNz53It9sxxW8MrArdH6Thk69Z0cm29jClWUE5rON';
        const response = await axios.post(webhookURL, {
            content:`🔸 Product Name: ${message.title}\n🔸 Promotion String: ✨ ${message.promotionType} ✨\n🔸 Price: ${message.price}\n🔸 numberOfSales: ${message.numberOfSales}
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


async function sendCaptcha(image) {
    try {
        const webhookURL = 'https://discord.com/api/webhooks/1235620178885087284/Nd7aDdUvVK6mHlKDYv_ZG6v5tHtZNz53It9sxxW8MrArdH6Thk69Z0cm29jClWUE5rON';
        const response = await axios.post(webhookURL, {
            content:`Ben please solve this captcha 🤒`,
            embeds: [{
                image: {
                    url: image
                }
            }]
        });
        console.log('Captcha sent successfully:', response.data);
    } catch (error) {
        console.error('Error sending message:', error.message);
    }
}


module.exports = {sendDiscordMessage, sendCaptcha}