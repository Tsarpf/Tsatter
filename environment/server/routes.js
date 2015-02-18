var passport = require('passport'),
    persistenceHandler = require('./persistence'),
    User = require('../app/models/user');

module.exports = function(app) {
    app.get('/', function (req, res) {
        res.render('index');
    });


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
        var from = req.query.from;
        var to = req.query.to;
        persistenceHandler.getActiveChannels(from, to, function(err, results) {
            res.json(results);
        });
    });
};
