/**
 * Created by tsarpf on 4/6/15.
 */

var mkdirp = require('mkdirp');
var imageTooBig = 'image-too-big.png';

//TODO: read from environment variable
var imagesPath = __dirname + '/../dist/images/';

var gm = require('gm');
var fs = require('fs');
var request = require('request');

mkdirp(imagesPath);


var fileTypes = {
    'png': '89504e47',
    'jpg': 'ffd8',
    'gif': '47494638'
};
var maxSize = 45000000; //45 megabytes

var thumbnailDimensions = {
    width: 500,
    height: 500
};

process.on('message', function(msg) {
    download(msg.url, function(err, obj) {
        if(err || !obj) {
            return;
        }

        var resObj = {
            channel: msg.channel,
            messageIdx: msg.messageIdx,
            src: msg.url,
            type: obj.type
        };
        if(obj.shouldProcess === true) {
            minifyImage(obj, function(filepath) {
                resObj.thumbnail = filepath;
                process.send(resObj);
            })
        }
        else {
            resObj.thumbnail = obj.thumbnail;
            process.send(resObj);
        }
    });
});


var minifyImage = function(obj, callback) {
    try {
        var origPath = imagesPath + obj.filename;
        var path = origPath + '.' + obj.type;
        var filename = obj.filename + '.' + obj.type;
        switch(obj.type) {
            case 'jpg':
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
                            callback(filename);
                        }
                    });
                break;
            case 'png':
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
                            callback(filename);
                        }
                    });
                break;
            case 'gif':
                gm(origPath + '[0]')
                    .resize(thumbnailDimensions.width, thumbnailDimensions.height + '>')
                    .noProfile()
                    .write(path, function(err) {
                        if(err) {
                            console.log('err');
                            console.log(err);
                        }
                        else {
                            callback(filename);
                        }
                    });
                break;
        }
    }
    catch(e) {
        console.log('minifying crashed');
        console.log(e);
    }
};

var download = function(url, callback) {
    try {
        var type = '';
        var filename = getName();
        var filepath = imagesPath + filename;
        var size;
        var stream = request({
            url: url,
            method: "HEAD"
        }, function(err, headRes) {
            if(err) {
                console.log(err);
                console.log('request fail');
                return callback(err);
            }
            size = headRes.headers['content-length'];
            if (size > maxSize) {
                console.log('skipped due to header content-length');
                console.log('Resource size exceeds limit (' + size + ')');
                return callback(null, {thumbnail: imageTooBig, shouldProcess: false});
            }
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
                        console.log('not an image');
                        return callback('not an image');
                    }
                }

                if (size > maxSize) {
                    console.log('aborted due to actual size too big');
                    console.log('Resource stream exceeded limit (' + size + ')');

                    res.abort(); // Abort the response (close and cleanup the stream)
                    fs.unlink(filepath); // Delete the file we were downloading the data to
                    return callback(null, {thumbnail: imageTooBig, shouldProcess: false});
                }
            }).pipe(file);
            res.on('end', function() {
                if(type && size < maxSize) {
                    callback(null, {filename: filename, shouldProcess: true, type: type});
                }
            })
        });
    }
    catch(e) {
        console.log('downloading crashed');
        console.log(e);
    }
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
