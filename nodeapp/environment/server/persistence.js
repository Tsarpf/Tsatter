/**
 *
 * Created by Tsarpf on 2/15/15.
 */

var mongoose = require('mongoose'),
    Channel = require('../app/models/channel');

var channelPreviewMessageCount = 3;
var channelPreviewImageUrlCount = 1;

var placeholderImageUrl = "http://i.imgur.com/a7i3u6V.png";

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

var imageTypes = [
    '.jpg',
    '.jpeg',
    '.gif',
    '.png'
];

var urlRegex = /((((https?|ftp):\/\/)|www\.)(([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)|(([a-zA-Z0-9\-]+\.)*[a-zA-Z0-9\-]+\.(aero|asia|biz|cat|com|coop|info|int|jobs|mobi|museum|name|net|org|post|pro|tel|travel|xxx|edu|gov|mil|[a-zA-Z][a-zA-Z]))|([a-z]+[0-9]*))(:[0-9]+)?((\/|\?)[^ "]*[^ ,;\.:">)])?)|(spotify:[^ ]+:[^ ]+)/g;

var getUrls = function(message) {
    return message.match(urlRegex);
};

var getImageUrls = function(urls) {
    var resultUrls = [];
    for(var idx in urls) {
       var url = urls[idx];

        if(endsWith(url.toLowerCase(), '.gifv') || endsWith(url.toLowerCase(), '.webm')) {
            url = url.substring(0, url.length - '.gifv'.length);
            url += ('.gif');
            resultUrls.push(url);
            continue;
        }

        for(var type in imageTypes) {
            if(endsWith(url.toLowerCase(), imageTypes[type])) {
                resultUrls.push(url);
                break;
            }
        }
    }

    return resultUrls;
};

var saveMessage = function(channelName, nick, message, callback) {
    if(channelName.length === 0 || nick.length === 0 || message.length === 0) {
        console.log('erroneous channel, nick or message');
        if(callback)
            return callback('erroneous channel, nick or message');
        else
            return;
    }

    var messageObj = {
        message: message,
        nick: nick
    };
    var obj = {
        $push: {messages: messageObj},
        $set: {lastUpdated: Date.now()}
    };
    var urls = getImageUrls(getUrls(message));
    if(urls) {
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

var getAllMessages = function(channelName, callback) {
    Channel.findOne({name: channelName}).exec(function(err, doc) {
        if(err || !doc) {
            console.log(err);
            console.log('no messages found');
            return callback(err, []);
        }
        if(doc.messages.length > 0) {
            callback(null, doc.messages);
        }
        else {
            callback(null, []);
        }
    });
};

var getMessagesFlipped = function(channelName, index, count, linkOffset, callback) {
    getAllMessages(channelName, function(err, messages) {
        if(err) {
            return callback(err);
        }

        var from, to;
        if(linkOffset) {
            from = linkOffset - count + index;
            to = linkOffset + index;
        }
        else {
            from = messages.length - count + index;
            to = messages.length + index;
        }


        if(from < 0) {
            from = 0;
        }

        var messageArray = [];
        for(var i = from; i < to && i < messages.length; i++) {
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

module.exports = {
    saveMessage: saveMessage,
    getMessagesFlipped: getMessagesFlipped,
    getActiveChannels: getActiveChannels,
    getUrls: getUrls
};

