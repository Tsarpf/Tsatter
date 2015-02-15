var mongoose = require('mongoose'),
    User = require('./user'),
    Schema = mongoose.Schema;

var Channel = new Schema({
    name: {
        type: String,
        required: true
    },
    imageUrls: [String],
    messages: [{
        message: String,
        timestamp: {type: Date, default: Date.now},
        nick: String
    }]
});

module.exports = mongoose.model('Channel', Channel);
