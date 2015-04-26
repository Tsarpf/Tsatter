module.exports = (function() {
    var fs = require('fs');
    var cluster = require('cluster');
    var persistence = {};


    console.log('cpus: ' + require('os').cpus().length);
    cluster.setupMaster({
        exec: __dirname + '/imageProcessWorker.js'
    });

    var worker = cluster.fork();

    worker.on('message', messageHandler);

    function messageHandler (msg) {
        var thumbnailUrl = '/public/images' + msg.thumbnail;
        persistence.saveProcessedImagePathToDB(msg.src, thumbnailUrl, msg.channel, msg.messageIdx, function(err) {
            if(err) {
                return console.log(err);
            }
            //get jiggy widdit
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

    return function(persistenceInject) {
        if(!persistenceInject) {
            throw new Error('no persistence module');
        }

        persistence = persistenceInject;

        return {
            processUrls: processUrls
        }
    };
}());
