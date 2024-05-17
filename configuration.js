const configuration = {
    headless: false,
    scanWithSaveTagsOnly: true,
    minimumNumberOfProductsSold: 100,
    mongoDBURI: "mongodb://127.0.0.1:27017/amazonBot",
    useProxy: true,
    proxySettings: {
        address: 'us5.4g.iproyal.com',
        port: "7523",
        username: 'lKYoma8',
        password: '5TVBw5Q9y6txkmG',
    },

}


module.exports = {configuration}

