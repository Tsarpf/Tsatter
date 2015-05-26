var persistenceHandler,
    imageSearch,
    User = require('../app/models/user');

var app;
module.exports = (function() {

    return function(persistence, imageSearchInject, appInject) {
        if(persistence && imageSearchInject && appInject) {
            app = appInject;
            persistenceHandler = persistence;
            imageSearch = imageSearchInject;
        }
        else {
            throw new Error('missing module injections!');
        }

        app.get('/activity/', function(req, res, next) {
            var from = parseInt(req.query.from);
            var to = parseInt(req.query.to);
            if (isNaN(from) || isNaN(to)) {
                res.writeHead(400, {error: 'invalid from/to field(s)'});
                return res.end();
            }

            persistenceHandler.getActiveChannels(from, to, function (err, results) {
                res.json(results);
            });
        });


        app.get('/backlog/', function(req, res, next) {
            var channel = req.query.channel;
            var index = parseInt(req.query.index);
            var count = parseInt(req.query.count);

            if(isNaN(count) || !channel) {
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

        app.get('/imagebacklog/', function(req, res, next) {
            var channel = req.query.channel;
            var index = parseInt(req.query.index);
            var count = parseInt(req.query.count);

            if(isNaN(count) || !channel) {
                res.writeHead(400, {error: 'invalid field(s)'});
                return res.end();
            }

            if(isNaN(index)) {
                //get last <count> images
                persistenceHandler.getImagesFlipped(channel, 0, count, function(err, images) {
                    if(err) {
                        console.log('message fetch fail');
                        console.log(err);
                        res.writeHead(403, {error: err});
                        res.end();
                    }
                    else {
                        res.json(images);
                    }
                });
                return;
            }

            persistenceHandler.getImages(channel, index, count, function(err, images) {
                if(err) {
                    console.log('message fetch fail');
                    console.log(err);
                    res.writeHead(403, {error: err});
                    res.end();
                }
                else {
                    res.json(images);
                }
            });
        });

        app.get('/search/', function(req, res, next) {
            try {
                var searchTerm = req.query.searchTerm;
                if(typeof searchTerm === 'undefined') {
                    return res.json('undefined search term');
                }
                console.log('searched: ' + searchTerm);
                imageSearch.search(searchTerm, function(err, results) {
                    if(err) {
                        console.log(err);
                        return res.json(err);
                    }
                    res.json(results);
                });
            }
            catch(err) {
                console.log('searching crashed');
                console.log(err);
            }
        });

        app.get('/partials/:name', function(req, res){
            var name = req.params.name;
            res.render('partials/' + name);
        });

        app.get('/images/:remainder', function(req,res) {
            res.redirect('http://localhost/images/' + req.params.remainder);
        });

        app.all('/', function (req, res) {
            res.render('index.html');
        });
    }

}());
