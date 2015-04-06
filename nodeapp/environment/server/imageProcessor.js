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

    var getName = function() {
        var chars, x;
        var length = 10;
        chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var name = [];
        for (x = 0; x < length; x++) {
            name.push(chars[Math.floor(Math.random() * chars.length)]);
        }
        return name.join('');
    };

    var processUrls = function(urls, channel) {
        for(var i = 0; i < urls.length; i++) {
            worker.send({
                url: urls[i],
                channel: channel
            });
        }
    };

    var download = function(url, filename, callback) {
        var stream = request({
            url: url,
            method: "HEAD"
        }, function(err, headRes) {
            var size = headRes.headers['content-length'];
            if (size > maxSize) {
                console.log('Resource size exceeds limit (' + size + ')');
            } else {
                size = 0;
                var file = fs.createWriteStream(filename);

                var res = request({ url: url});
                var checkType = true;
                var type = '';
                res.on('data', function(data) {
                    size += data.length;

                    if(checkType && size >= 4) {
                        var hex = data.toString('hex', 0, 4);
                        for(var key in fileTypes) {
                            if(hex.indexOf(fileTypes[key]) === 0) {
                                type = key;
                                console.log('heyoo was type of: ' + type);
                                checkType = false;
                                break;
                            }
                        }
                        if(!type) {
                            res.abort();
                            fs.unlink(filename);
                            return callback(false);
                        }
                    }

                    if (size > maxSize) {
                        console.log('Resource stream exceeded limit (' + size + ')');

                        res.abort(); // Abort the response (close and cleanup the stream)
                        fs.unlink(filename); // Delete the file we were downloading the data to
                        return callback(false);
                    }
                }).pipe(file);
                res.on('end', function() {
                    console.log('end');
                    callback(true);
                })
            }
        });
    };

    return {
        processUrls: processUrls
    };
})();
