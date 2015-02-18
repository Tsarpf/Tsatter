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
        persistenceHandler.getActiveChannels(from, to, function(err, channels) {

        });

        var obj = [
            {
                messages: ['hello iamaboy anda message', 'tseke vaara', 'joujou'],
                topic: 'sup',
                imageUrl: 'http://i.imgur.com/dH4Ilnh.gif'
            },
            {
                messages: ['mesitsuun'],
                topic: 'topikkidesu',
                imageUrl: 'http://i.imgur.com/voyE0oi.jpg?1'
            },
            {
                messages: ['mesitsuun', 'jouko hainen', 'meikä läinen'],
                topic: 'topikkidesu',
                imageUrl: 'http://i.imgur.com/OCJ1HnW.jpg'
            },
            {
                messages: ['mesitsuun', 'naalfdkgalökdjf'],
                topic: 'topikkidesu',
                imageUrl: 'http://i.imgur.com/JB0Fd3R.gif'
            },
            {
                messages: ['aa long mssagea long mssagea long mssagea long mssagea long mssagea long mssagea long mssagea long mssagea long mssage long mssage', 'ses'],
                topic: 'immatopic',
                imageUrl: 'http://i.imgur.com/VEnIb5i.jpg'
            },
            {
                messages: ['hello iamaboy anda message', 'tseke vaara', 'joujou'],
                topic: 'sup',
                imageUrl: 'http://i.imgur.com/dH4Ilnh.gif'
            },
            {
                messages: ['mesitsuun'],
                topic: 'topikkidesu',
                imageUrl: 'http://i.imgur.com/voyE0oi.jpg?1'
            },
            {
                messages: ['mesitsuun', 'jouko hainen', 'meikä läinen'],
                topic: 'topikkidesu',
                imageUrl: 'http://i.imgur.com/OCJ1HnW.jpg'
            },
            {
                messages: ['mesitsuun', 'naalfdkgalökdjf'],
                topic: 'topikkidesu',
                imageUrl: 'http://i.imgur.com/JB0Fd3R.gif'
            },
            {
                messages: ['aa long mssagea long mssagea long mssagea long mssagea long mssagea long mssagea long mssagea long mssagea long mssage long mssage', 'ses'],
                topic: 'immatopic',
                imageUrl: 'http://i.imgur.com/VEnIb5i.jpg'
            },
        ];
        res.json(obj);
    });
};
