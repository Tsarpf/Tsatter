var express = require('express'),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    session = require('express-session'),
    cookieParser = require('cookie-parser'),
    MongooseSession = require('./custom-mongoose-session-store'),
    mongooseSessionStore = new MongooseSession({interval: 60000});
    app = express();


var runServer = function(options) {
    if(!options.port) {
        throw "Error, no port";
    }
    var port = options.port;
    console.log('port from options: ' + port);

    //mongoose
    var connect = function() {
        var options = {server: {socketOptions: {keepAlive: 1}}};
        mongoose.connect("mongodb://localhost/", options);
    };
    connect();
    mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
    mongoose.connection.on('disconnected', connect);
    mongoose.connection.on('connected', function(){
        console.log("(re)connected to database.");
    });

    var User = require('./app/models/user');
    passport.use(User.createStrategy());


    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());


    var pub = __dirname + '/public';
    app.use(express.static(pub));
    app.use(bodyParser.urlencoded({extended:true}));
    app.use(cookieParser());
    var key = 'express.sid';
    var secret = 'use only for testing you know';
    var maxAge = new Date(Date.now() + 3600000);
    app.use(session({
        cookieParser: cookieParser,
        key: key,
        secret: secret,
        maxAge: maxAge,
        cookie: {
            path: '/',
            maxAge: maxAge
        },
        store: mongooseSessionStore,
        resave: true,
        saveUninitialized: true
    }));
    app.use(passport.initialize());
    app.use(passport.session());


    //Use jade
    app.set('view engine', 'jade');
    app.set('views', __dirname + '/app/views');

    //Always use pretty html.
    app.locals.pretty = true;


    var server = app.listen(port, function() {
        console.log("server running..");
    });

    var io = require('socket.io')(server);

    var cookieParserF = cookieParser(secret);
    //cookieParser = cookieParser(secret);
    io.use(function(socket, next){
        cookieParserF(socket.handshake, {}, function(err){
            if (err) {
                console.log("error in parsing cookie");
                return next(err);
            }
            if (!socket.handshake.signedCookies) {
                console.log("no secureCookies|signedCookies found");
                return next(new Error("no secureCookies found"));
            }
            mongooseSessionStore.get(socket.handshake.signedCookies[key], function(err, session){
                if(session) {
                    socket.session = session;
                    socket.session.sid = socket.handshake.signedCookies[key];
                }
                if (!err && !session) err = new Error('session not found');
                if (err) {
                     console.log('failed connection to socket.io:', err);
                } else {
                    console.log(session);
                     console.log('successful connection to socket.io');
                }
                next(err);
            });
        });
    });


    //routes
    require('./routes')(app);


    //everything sockets related
    require('./sockets').initCons(io, passport, mongooseSessionStore);

    return {app: app, server: server};

}

module.exports = function(options) {
    return runServer(options);
}
