var passport = require('passport'),
    persistenceHandler = require('./persistence'),
    User = require('../app/models/user');

module.exports = function(app) {
    app.post('/login', function(req, res, next) {
        passport.authenticate('local', function(err, user, info) {
            res.redirect('/');
        })(req,res,next);
    });

    app.get('/partials/:name', function(req, res){
        var name = req.params.name;
        res.render('partials/' + name);
    });

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
        var from = parseInt(req.query.from);
        var to = parseInt(req.query.to);
        if(isNaN(from) || isNaN(to) || !channel) {
            console.log('äh');
            res.writeHead(400, {error: 'invalid from/to field(s)'});
            return res.end();
        }

        from = parseInt(from);
        to = parseInt(to);
        if(from > to) {
            console.log('säh');
            res.writeHead(400, {error: 'invalid from/to field(s)'});
            return res.end();
        }
        else if ((to - from) > 50) {
            console.log('asdfgadgf');
            res.writeHead(403, {error: 'Too many messages requested'});
            return res.end();
        }

        persistenceHandler.getMessages(channel, from, to, function(err, messages) {
            if(err) {
                console.log('message fetch fail');
                console.log(err);
            }
            else {
                res.json(messages);
            }
        });
    });

    app.all('/*', function (req, res) {
        res.render('index');
    });
};
