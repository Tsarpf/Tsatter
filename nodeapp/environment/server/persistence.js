/**
 *
 * Created by Tsarpf on 2/15/15.
 */

module.exports = (function() {
    //var mongoose = require('mongoose'),
    var Channel = require('../app/models/channel');

    var imageProcessor = {};

    var channelPreviewMessageCount = 3;
    var channelPreviewImageUrlCount = 1;

    var placeholderImageUrl = "http://i.imgur.com/a7i3u6V.png";

    var saveMessage = function(channelName, nick, message, callback) {
        if(channelName.length === 0 || nick.length === 0 || message.length === 0) {
            console.log('erroneous channel, nick or message');
            if(callback)
                return callback('erroneous channel, nick or message');
            else
                return;
        }

        if(message.length > 512) {
            message = message.substring(0, 512);
        }

        var messageObj = {
            message: message,
            nick: nick
        };
        var obj = {
            $push: {messages: messageObj},
            $set: {lastUpdated: Date.now()}
        };
        Channel.findOneAndUpdate(
            {name: channelName},
            obj,
            {upsert: true}
        ).exec(function(err, doc) {
                if(err) {
                    console.log(err);
                    return;
                }

                //processUrls(message, channelName, doc.messages.length - 1);

                if(callback)
                    return callback(null, doc.messages.length - 1);
        });
    };


    var saveProcessedImagePathToDB = function(originalUrl, thumbnailUrl, channel, messageIdx, callback) {
        var obj = {
            $push: {
                imageUrls: {
                    originalUrl: originalUrl,
                    thumbnail: thumbnailUrl,
                    messageIdx: messageIdx
                }
            }
        };
        Channel.findOneAndUpdate({name: channel}, obj, {upsert: true}
        ).exec(function(err, doc) {
                if(err) {
                    console.log(err);
                    if(callback) {
                        callback(err);
                    }
                }
                if(callback) {
                    callback(null);
                }
            });
    };

    var getActiveChannels = function(from, to, callback) {
        if(!from && !to) {
            from = 0;
            to = 50;
        }
        if(from > to) {
            console.log('error');
            return callback('from bigger than to');
        }

        Channel.find({}, null, {sort: {lastUpdated: 'desc'}}, function(err, docs) {
            if(err) {
                console.log(err);
                callback(err);
            }
            var results = [];

            for(var i = from; i < to && i < docs.length; i++) {
                var imageUrls = docs[i].imageUrls.slice(-channelPreviewImageUrlCount);
                if(imageUrls.length === 0) {
                    imageUrls = [placeholderImageUrl];
                }
                var obj = {
                    name: docs[i].name,
                    messages: docs[i].messages.slice(-channelPreviewMessageCount),
                    imageUrls: imageUrls
                };
                results.push(obj);
            }
            callback(null, results);
        });
    };

    var getMessages = function(channelName, from, to, callback) {
        Channel.findOne({name: channelName}).exec(function(err, doc) {
            if(err || !doc) {
                if(err) {
                    console.log(err);
                    return callback(err, []);
                }

                console.log('no messages found');
                return callback(err, []);
            }
            if(doc.messages.length > 0) {
                var arr = getSendableMessageArray(doc.messages, from, to);
                callback(null, arr);
            }
            else {
                callback(null, []);
            }
        });
    };


    var getSendableMessageArray = function(messages, from, to) {
        var messageArray = [];
        if(from < 0) {
            from = messages.length + from;
        }
        if(to < 0) {
            to = messages.length + to + 1;
        }

        if(to < 0) {
            return [];
        }
        if(from < 0) {
           from = 0;
        }
        for (var i = from; i < to && i < messages.length; i++) {
            messageArray.push({
                nick: messages[i].nick,
                message: messages[i].message,
                timestamp: messages[i].timestamp,
                idx: i
            });
        }
        return messageArray;
    };

    return function(imageProcessorInject) {
        if(imageProcessorInject) {
            imageProcessor = imageProcessorInject;
        }
        else {
            throw new Error('no image processor module');
            //imageProcessor = require('imageProcessor');
            /*
            imageProcessor = {
                processUrls: function() {
                    console.log('image processor not set! Called with arguments:');
                    console.log(arguments);
                }
            };
            */
        }

        return {
            saveMessage: saveMessage,
            getMessages: getMessages,
            getActiveChannels: getActiveChannels,
            getUrls: getUrls,
            saveProcessedImagePathToDB: saveProcessedImagePathToDB
        }
    };
}());
