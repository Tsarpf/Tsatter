/**
 * Created by tsarpf on 4/6/15.
 */

var mkdirp = require('mkdirp');
var imageTooBig = 'http://i.imgur.com/0BFkWlU.png';
var imagesPath = '/images/';

mkdirp(__dirname + '/../public' + imagesPath);

var cache = {};

//message object fields: url, channel
process.on('message', function(msg) {
    console.log('msg received at worker');
    console.log(msg);
    process.send(msg);


    download(msg.url, function(err, obj) {
        if(err) {
            return;
        }
        if(obj.process === true) {
            minifyImage(obj.path, function(filepath) {
                //minified
                var resObj = {
                    channel: msg.channel,
                    src: msg.url,
                    thumbnail: filepath
                };
                //process.send(resObj);
                //cache[msg.url] = resObj;
            })
        }
        else {
            var resObj = {
                channel: msg.channel,
                src: msg.url,
                thumbnail: obj.path
            };
            process.send(resObj);
            cache[msg.url] = resObj;
        }


    });
});


var minifyImage = function(filepath, callback) {
   //run gw
    //http://aheckmann.github.io/gm/
    //https://github.com/Tsarpf/Tsatter/issues/80
};


var download = function(url, callback) {
    var filepath = '/images/' + getName();
    var stream = request({
        url: url,
        method: "HEAD"
    }, function(err, headRes) {
        var size = headRes.headers['content-length'];
        if (size > maxSize) {
            console.log('Resource size exceeds limit (' + size + ')');
        } else {
            size = 0;
            var file = fs.createWriteStream(filepath);

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
                        fs.unlink(filepath);
                        return callback('not an image');
                    }
                }

                if (size > maxSize) {
                    console.log('Resource stream exceeded limit (' + size + ')');

                    res.abort(); // Abort the response (close and cleanup the stream)
                    fs.unlink(filepath); // Delete the file we were downloading the data to
                    return callback(null, {path: imageTooBig, process: false});
                }
            }).pipe(file);
            res.on('end', function() {
                console.log('end');
                callback(null, {path: filepath, process: true});
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
