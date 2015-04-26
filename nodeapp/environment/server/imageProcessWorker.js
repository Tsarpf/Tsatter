/**
 * Created by tsarpf on 4/6/15.
 */

var mkdirp = require('mkdirp');
var imageTooBig = 'http://i.imgur.com/0BFkWlU.png';
var imagesPath = __dirname + '/../dist/public/images/';
var gm = require('gm');
var fs = require('fs');
var request = require('request');

mkdirp(imagesPath);

var cache = {};

var fileTypes = {
    '.png': '89504e47',
    '.jpg': 'ffd8ffe0',
    '.gif': '47494638'
};
var maxSize = 45000000; //45 megabytes

var thumbnailDimensions = {
    width: 500,
    height: 500
};

//message object fields: url, channel
process.on('message', function(msg) {
    download(msg.url, function(err, obj) {
        if(err) {
            return;
        }

        var resObj = {
            channel: msg.channel,
            messageIdx: msg.messageIdx,
            src: msg.url
        };
        if(obj.shouldProcess === true) {
            minifyImage(obj, function(filepath) {
                resObj.thumbnail = filepath;
                process.send(resObj);
                cache[msg.url] = resObj;
            })
        }
        else {
            resObj.thumbnail = obj.path;
            process.send(resObj);
            cache[msg.url] = resObj;
        }
    });
});


//obj fields: path, shouldProcess, extension
var minifyImage = function(obj, callback) {
    var origPath = obj.path;
    var path = origPath + obj.extension;
    switch(obj.extension) {
        case '.jpg':
            gm(origPath)
                .interlace('Plane')
                .quality(85)
                .resize(thumbnailDimensions.width, thumbnailDimensions.height + '>')
                .noProfile()
                .write(path, function(err) {
                    if(err) {
                        console.log('err');
                        console.log(err);
                    }
                    else {
                        callback(path);
                    }
                });
            break;
        case '.png':
            gm(origPath)
                .colors(256)
                .quality(90)
                .bitdepth(8)
                .resize(thumbnailDimensions.width, thumbnailDimensions.height + '>')
                .noProfile()
                .write(path, function(err) {
                    if(err) {
                        console.log('err');
                        console.log(err);
                    }
                    else {
                        callback(path);
                    }
                });
            break;
        case '.gif':
            gm(origPath + '[0]')
                .resize(thumbnailDimensions.width, thumbnailDimensions.height + '>')
                .noProfile()
                .write(path, function(err) {
                    if(err) {
                        console.log('err');
                        console.log(err);
                    }
                    else {
                        callback(path);
                    }
                });
            break;
    }
};

var download = function(url, callback) {
    var type = '';
    var filepath = imagesPath + getName();
    var stream = request({
        url: url,
        method: "HEAD"
    }, function(err, headRes) {
        if(err) {
            console.log(err);
            return callback('error!');
        }
        var size = headRes.headers['content-length'];
        if (size > maxSize) {
            console.log('Resource size exceeds limit (' + size + ')');
            callback('image too big');
        } else {
            size = 0;
            var file = fs.createWriteStream(filepath);

            var res = request({ url: url});
            var checkType = true;
            res.on('data', function(data) {
                size += data.length;

                if(checkType && size >= 4) {
                    var hex = data.toString('hex', 0, 4);
                    for(var key in fileTypes) {
                        if(fileTypes.hasOwnProperty(key)) {
                            if(hex.indexOf(fileTypes[key]) === 0) {
                                type = key;
                                checkType = false;
                                break;
                            }
                        }
                    }
                    if(!type) {
                        res.abort();
                        fs.unlink(filepath);
                        return callback('not an image');
                    }
                }

                if (size > maxSize) {
                    console.log('Resource stream exceeded limit (' + size + ')');

                    res.abort(); // Abort the response (close and cleanup the stream)
                    fs.unlink(filepath); // Delete the file we were downloading the data to
                    return callback(null, {path: imageTooBig, shouldProcess: false});
                }
            }).pipe(file);
            res.on('end', function() {
                callback(null, {path: filepath, shouldProcess: true, extension: type});
            })
        }
    });
};

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
