/**
 *
 * Created by Tsarpf on 2/15/15.
 */

var mongoose = require('mongoose'),
    Channel = require('../app/models/channel');


var getUrls = function(message) {
    return [];
};

var saveMessage = function(channelName, nick, message, callback) {
    if(channelName.length === 0 || nick.length === 0 | message.length === 0) {
        return callback('erroneous channel, nick or message');
    }

    var urls = getUrls(message);
    var obj = {$push: {messages: message}}
    if(urls.length > 0) {
        obj.$push.imageUrls = { $each: urls};
    }
    Channel.findOneAndUpdate(
        {name: channelName},
        obj,
        {upsert: true}
    ).exec(function(err, doc) {
            if(err) {
                console.log(err);
            }
            return callback(null);
    });
};

module.exports = {
    saveMessage: saveMessage
};

