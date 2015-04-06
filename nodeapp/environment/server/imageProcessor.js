/**
 * Created by tsarpf on 4/6/15.
 */

/**
 * Created by tsarpf on 4/5/15.
 */

module.exports = (function() {
    //var dbname = global.TS_TESTING || 'production';

    var request = require('request');
    var async = require('async');
    var fs = require('fs');
    var cluster = require('cluster');

    var fileTypes = {
        '.png': '89504e47',
        '.jpg': 'ffd8ffe0',
        '.gif': '47494638'
    };
    var maxSize = 10000000; //10 megabytes


    console.log('cpus: ' + require('os').cpus().length);
    cluster.setupMaster({
        exec: __dirname + '/imageProcessWorker.js'
    });

    var worker = cluster.fork();

    worker.on('message', messageHandler);

    function messageHandler (msg) {
        console.log('got message from worker');
        console.log(msg);
    }

    var processUrls = function(urls, channel) {
        for(var i = 0; i < urls.length; i++) {
            worker.send({
                url: urls[i],
                channel: channel
            });
        }
    };

    return {
        processUrls: processUrls
    };
})();
