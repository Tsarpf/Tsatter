var persistenceHandler = require('./persistence'),
    imageSearch = require('./imageSearch'),
    User = require('../app/models/user');

module.exports = function(app) {
    app.get('/activity/', function(req, res, next) {
        var from = parseInt(req.query.from);
        var to = parseInt(req.query.to);
        if(isNaN(from) || isNaN(to)) {
            res.writeHead(400, {error: 'invalid from/to field(s)'});
            return res.end();
        }

        from = parseInt(from);
        to = parseInt(to);
        if(from > to) {
            res.writeHead(400, {error: 'invalid from/to field(s)'});
            return res.end();
        }

        persistenceHandler.getActiveChannels(from, to, function(err, results) {
            res.json(results);
        });
    });

    app.get('/backlog/', function(req, res, next) {

        var channel = req.query.channel;
        var index = parseInt(req.query.index);
        var count = parseInt(req.query.count);

        if(isNaN(count) || !channel) {
            console.log('äh');
            res.writeHead(400, {error: 'invalid field(s)'});
            return res.end();
        }

        if(isNaN(index)) {
            //get last <count> messages
            persistenceHandler.getMessagesFlipped(channel, 0, count, function(err, messages) {
                if(err) {
                    console.log('message fetch fail');
                    console.log(err);
                    res.writeHead(403, {error: err});
                    res.end();
                }
                else {
                    res.json(messages);
                }
            });
            return;
        }

        persistenceHandler.getMessages(channel, index, count, function(err, messages) {
            if(err) {
                console.log('message fetch fail');
                console.log(err);
                res.writeHead(403, {error: err});
                res.end();
            }
            else {
                res.json(messages);
            }
        });
    });

    app.get('/search/', function(req, res, next) {
        var searchTerm = req.query.searchTerm;
        console.log('searched: ' + searchTerm);
        imageSearch.search(searchTerm, function(err, results) {
            if(err) {
                console.log(err);
                return res.json(err);
            }
            var obj = JSON.parse(results);
            var resObj = [];
            for(var i = 0; i < obj.d.results.length; i++) {
               resObj.push({
                   src: obj.d.results[i].MediaUrl,
                   thumbnail: obj.d.results[i].Thumbnail.MediaUrl
               });
            }
            res.json(resObj);
        });
    });

    app.get('/partials/:name', function(req, res){
        var name = req.params.name;
        res.render('partials/' + name);
    });

    app.all('/', function (req, res) {
        res.render('index.html');
    });
};
