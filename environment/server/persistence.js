/**
 *
 * Created by Tsarpf on 2/15/15.
 */

var mongoose = require('mongoose'),
    activityList = require('./fastOrderedActivityList'),
    Channel = require('../app/models/channel');



var getUrls = function(message) {
    return [];
};

var saveMessage = function(channelName, nick, message, callback) {
    if(channelName.length === 0 || nick.length === 0 || message.length === 0) {
        console.log('erroneous channel, nick or message');
        if(callback)
            return callback('erroneous channel, nick or message');
        else
            return;
    }

    var urls = getUrls(message);
    var messageObj = {
        message: message,
        nick: nick
    };
    var obj = {$push: {messages: messageObj}};
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
            if(callback)
                return callback(null);
    });
};

var loadChannelActivityList = function(callback) {
    Channel.find(function(err, channels) {
        if(err) {
            console.log(err);
            return callback(err);
        }

        for(var channel in channels) {
            var obj = channels[channel];
            activityList.updateList(obj.name);
        }
    });
};

var getMessages = function(channelName, messageCount, callback) {
    Channel.findOne({name: channelName}).exec(function(err, doc) {
          callback(doc.messages.slice(-messageCount));
    });
};


module.exports = {
    saveMessage: saveMessage,
    loadChannelActivityList: loadChannelActivityList,
    getMessages: getMessages
};

