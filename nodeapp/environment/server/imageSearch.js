var fs = require('fs');
var key = fs.readFileSync('bing-api-key.txt', {encoding: 'utf8'});
var Bing = require('node-bing-api')({accKey: key});

module.exports = (function() {
    var search = function(parameter) {
        Bing.images(parameter, function(error, res, body) {
            if(error) {
                console.log(error);
            }
            else {
                console.log(body);
                res.json(body);
            }
        });
    };

    return {
        search: search
    };
})();