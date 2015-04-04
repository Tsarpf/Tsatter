var request = require('request');
var fs = require('fs');

var testHttp = 'http://tajafruits.in/wp-content/uploads/2015/01/apple.jpg';
var testHttps = 'https://yt3.ggpht.com/-CUCWzbOuyjg/AAAAAAAAAAI/AAAAAAAAAAA/cddBelIcN4g/s900-c-k-no/photo.jpg';
var testUrl = testHttp;

var fileTypes = {
    '.png': '89504e47',
    '.jpg': 'ffd8ffe0',
    '.gif': '47494638'
}

var maxSize = 10485760;

var idx = 0;
var filename = '' + idx;

request({
    url: testUrl,
    method: "HEAD"
}, function(err, headRes) {
    var size = headRes.headers['content-length'];
    if (size > maxSize) {
        console.log('Resource size exceeds limit (' + size + ')');
    } else {
        var file = fs.createWriteStream(filename),
            size = 0;

        var res = request({ url: testUrl});
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
                    return;
                }
            }

            if (size > maxSize) {
                console.log('Resource stream exceeded limit (' + size + ')');

                res.abort(); // Abort the response (close and cleanup the stream)
                fs.unlink(filename); // Delete the file we were downloading the data to
            }
        }).pipe(file);
    }
});


/*
var isHttps = url.parse(testUrl).protocol === 'https:';
var maxSize = 10000000; //10 megabytes
console.log(url.parse(testUrl).protocol);
console.log('is https: ' + isHttps);

var tool;
if(isHttps) {
	tool = https;
}
else {
	tool = http;
}

var request = tool.request(testUrl, function(res) {
	var checkType = true;
    var buffer = "";
	res.on('data', function(data) {
		if(checkType) {
            if(buffer.length >= 4) {

            }
		}
		console.log('ses');
		console.log(data.length);
		console.log(data);	
		console.log('/ses');
		
		var hex = data.toString('hex', 0, 4);
		console.log('hex');
		console.log(hex);
		
	});
});

request.end();
*/
