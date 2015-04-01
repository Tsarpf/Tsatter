module.exports = (function() {
    var fs = require('fs');
    var request = require('request');
    var key = fs.readFileSync(__dirname + '/bing-api-key.txt', {encoding: 'utf8'});
    key = key.replace('\n','');
    console.log('key is: "' + key + '"');
    var bingUrl = 'https://:' + key + '@api.datamarket.azure.com/Bing/Search/v1/Image?$format=json&Query=';
    var cache = {};
    var search = function(parameter, callback) {
        if(cache[parameter]) {
            return callback(null, cache[parameter]);
        }
        var url = bingUrl + '\'' + parameter + '\'';
        console.log(url);
        console.log('moi');

        request({url: url},
        function(error, response, body) {
            console.log('got response');
            if(error) {
                console.log(error);
            }
            else {
                cache[parameter] = body;
                callback(null, body);
            }
        });
    };

    return {
        search: search
    };
})();
