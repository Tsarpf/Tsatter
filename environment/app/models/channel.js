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
        message: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date, default: Date.now
        },
        nick: {
            type: String,
            required: true
        }
    }]
});

module.exports = mongoose.model('Channel', Channel);
