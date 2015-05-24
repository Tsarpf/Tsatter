var mongoose = require('mongoose'),
    User = require('./user'),
    Schema = mongoose.Schema;

var Channel = new Schema({
    name: {
        type: String,
        required: true
    },
    imageUrls: [{
        originalUrl: String,
        thumbnail: String,
        messageIdx: Number
    }],
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
    }],
    lastUpdated: {
        type: Date,
        required: true
    }
});

module.exports = mongoose.model('Channel', Channel);
