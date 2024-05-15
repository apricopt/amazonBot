const mongoose = require('mongoose');
const { configuration } = require('./configuration');

const connectDB = async () => {
    mongoose.connect(configuration.mongoDBURI)
}

module.exports = {connectDB}
