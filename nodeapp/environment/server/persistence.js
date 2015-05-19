/**
 *
 * Created by Tsarpf on 2/15/15.
 */

module.exports = (function() {
    var Channel = require('../app/models/channel');

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

                if(callback)
                    return callback(null, doc.messages.length - 1);
            });
    };

    var saveProcessedImagePathToDB = function(originalUrl, thumbnailUrl, channel, messageIdx, type, callback) {
        var obj = {
            $push: {
                imageUrls: {
                    originalUrl: originalUrl,
                    thumbnail: thumbnailUrl,
                    messageIdx: messageIdx,
                    type: type
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

    var getActiveChannels = function (from, to, callback) {
        if (!from && !to) {
            from = 0;
            to = 50;
        }
        if (from > to) {
            console.log('error');
            return callback('from bigger than to');
        }

        Channel.find({}, null, {sort: {lastUpdated: 'desc'}}, function (err, docs) {
            if (err) {
                console.log(err);
                callback(err);
            }
            var results = [];

            for (var i = from; i < to && i < docs.length; i++) {
                var imageUrls = docs[i].imageUrls.slice(-channelPreviewImageUrlCount);
                if (imageUrls.length === 0) {
                    imageUrls = [{thumbnail: placeholderImageUrl}];
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

    var getAllMessages = function (channelName, callback) {
        Channel.findOne({name: channelName}).exec(function (err, doc) {
            if (err || !doc) {
                console.log(err);
                console.log('no messages found');
                return callback(err, []);
            }
            if (doc.messages.length > 0) {
                callback(null, doc.messages);
            }
            else {
                callback(null, []);
            }
        });
    };

    var getMessages = function (channelName, index, count, callback) {
        getAllMessages(channelName, function (err, messages) {
            if (err || index < 0 || count < 0) {
                return callback('error! ' + err);
            }

            var arr = [];
            for (var i = index; i < messages.length && i < index + count; i++) {
                arr.push({
                    nick: messages[i].nick,
                    message: messages[i].message,
                    timestamp: messages[i].timestamp,
                    idx: i
                });
            }
            callback(null, arr);
        });
    };

    var getMessagesFlipped = function (channelName, index, count, callback) {
        getAllMessages(channelName, function (err, messages) {
            if (err) {
                return callback(err);
            }

            var from = messages.length - count + index;
            var to = messages.length + index;


            if (from < 0) {
                from = 0;
            }

            var messageArray = [];
            for (var i = from; i < to && i < messages.length; i++) {
                messageArray.push({
                    nick: messages[i].nick,
                    message: messages[i].message,
                    timestamp: messages[i].timestamp,
                    idx: i
                });
            }

            callback(null, messageArray);
        })
    };

    var getAllImages = function (channelName, callback) {
        Channel.findOne({name: channelName}).exec(function (err, doc) {
            if (err || !doc) {
                console.log(err);
                console.log('no messages found');
                return callback(err, []);
            }
            if (doc.imageUrls.length > 0) {
                callback(null, doc.imageUrls);
            }
            else {
                callback(null, []);
            }
        });
    };

    var getImages = function (channelName, index, count, callback) {
        getAllImages(channelName, function (err, images) {
            if (err || index < 0 || count < 0) {
                return callback('error! ' + err);
            }

            var arr = [];
            for (var i = index; i < images.length && i < index + count; i++) {
                arr.push({
                    messageIdx: images[i].messageIdx,
                    thumbnail: images[i].thumbnail,
                    originalUrl: images[i].originalUrl,
                    idx: i
                });
            }
            callback(null, arr);
        });
    };

    var getImagesFlipped = function (channelName, index, count, callback) {
        getAllImages(channelName, function (err, images) {
            if (err) {
                return callback(err);
            }

            var from = images.length - count + index;
            var to = images.length + index;


            if (from < 0) {
                from = 0;
            }

            var arr = [];
            for (var i = from; i < to && i < images.length; i++) {
                arr.push({
                    messageIdx: images[i].messageIdx,
                    thumbnail: images[i].thumbnail,
                    originalUrl: images[i].originalUrl,
                    idx: i
                });
            }
            callback(null, arr);
        })
    };

    return function() {
        return {
            saveMessage: saveMessage,
            getImages: getImages,
            getImagesFlipped: getImagesFlipped,
            getMessages: getMessages,
            getMessagesFlipped: getMessagesFlipped,
            getActiveChannels: getActiveChannels,
            saveProcessedImagePathToDB: saveProcessedImagePathToDB
        };
    }
}());

