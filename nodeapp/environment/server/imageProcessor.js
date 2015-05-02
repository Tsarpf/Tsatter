module.exports = (function() {
    var fs = require('fs');
    var cluster = require('cluster');
    var persistence,
        broadcaster;


    console.log('cpus: ' + require('os').cpus().length);
    cluster.setupMaster({
        exec: __dirname + '/imageProcessWorker.js'
    });

    var worker = cluster.fork();

    worker.on('message', messageHandler);

    function messageHandler (msg) {
        var thumbnailUrl = '/public/images' + msg.thumbnail;
        persistence.saveProcessedImagePathToDB(msg.src, thumbnailUrl, msg.channel, msg.messageIdx, msg.type, function(err) {
            if(err) {
                return console.log(err);
            }
            //get jiggy widdit
            broadcaster.broadcast(msg.channel, {
                command: 'mediaDelivery',
                image: msg
            });
        });
    }

    var processUrls = function(urls, channel, messageIdx) {
        for(var i = 0; i < urls.length; i++) {
            worker.send({
                url: urls[i],
                channel: channel,
                messageIdx: messageIdx
            });
        }
    };

    return function(persistenceInject, broadcasterInject) {
        if(!persistenceInject || !broadcasterInject) {
            throw new Error('module dependency missing!');
        }

        persistence = persistenceInject;
        broadcaster = broadcasterInject;

        return {
            processUrls: processUrls
        }
    };
}());
