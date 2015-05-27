module.exports = (function() {
    var fs = require('fs');
    var request = require('request');
    try {
        var key = fs.readFileSync(__dirname + '/bing-api-key.txt', {encoding: 'utf8'});
        key = key.replace('\n','');
    }
    catch(e) {
        console.log('no key found');
        return {
            search: function(param, cb) {
                console.log('bing key not specified, returning empty list');
                callback(null, []);
            }
        }
    }
    console.log('key is: "' + key + '"');
    var bingUrl = 'https://:' + key + '@api.datamarket.azure.com/Bing/Search/v1/Image?$format=json&Adult=\'Off\'&Query=';

    var search = function(parameter, callback) {
        var url = bingUrl + '\'' + parameter + '\'';

        request({url: url},
        function(error, response, body) {
            console.log('got response');
            if(error) {
                console.log('error in search response:');
                console.log(error);
            }
            else {
                var obj = {};
                try {
                    obj = JSON.parse(body);
                }
                catch(err) {
                    console.log('crashed in response');
                    console.log(err);
                }
                var resObj = [];

                if(!obj.d) {
                    return callback(body, resObj);
                }

                for (var i = 0; i < obj.d.results.length; i++) {
                    resObj.push({
                        src: obj.d.results[i].MediaUrl,
                        thumbnail: obj.d.results[i].Thumbnail.MediaUrl
                    });
                }
                callback(null, resObj);
            }
        });
    };

    return {
        search: search
    };
}());
