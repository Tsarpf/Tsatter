var express = require('express'),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    passportSocketIo = require('passport.socketio'),
    session = require('express-session'),
    cookieParser = require('cookie-parser'),
    MongooseSession = require('./custom-mongoose-session-store'),
    mongooseSessionStore = new MongooseSession({interval: 60000});
    app = express();


var runServer = function(options) {
    if(!options.port) {
        //throw "Error, no port";
    }
    var port = options.port;
    console.log('port from options: ' + port);

    //mongoose
    var mongooseConn;
    var connect = function() {
        var options = {server: {socketOptions: {keepAlive: 1}}};
        //mongooseConn = mongoose.createConnection("mongodb://localhost/", options);
        mongooseConn = mongoose.connect("mongodb://db_1/", options);
    };
    connect();
    mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
    mongoose.connection.on('disconnected', connect);
    mongoose.connection.on('connected', function(){
        console.log("(re)connected to database.");
    });

    var User = require('../app/models/user');
    passport.use(User.createStrategy());


    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());


    var pub = __dirname + '/../public';
    app.use(express.static(pub));
    app.use(bodyParser.urlencoded({extended:true}));
    app.use(cookieParser());
    var key = 'express.sid';
    var secret = 'new key';
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
    app.set('views', __dirname + '/../app/views');

    //Always use pretty html.
    app.locals.pretty = true;


    var server = app.listen(port, function() {
        console.log('port: ' + server.address().port);
        console.log(server.address().address);
        console.log("server running..");
    });


    var io = require('socket.io')(server);

    var cookieParserF = cookieParser(secret);
    //TODO: move this somewhere nicer?
    io.use(function(socket, next){
        cookieParserF(socket.handshake, {}, function(err){
            if (err) {
                console.log("error in parsing cookie");
                return next(err);
            }
            var url = socket.request.url;
            var urlCookie = url.indexOf('cookie') >= 0;
            if (!socket.handshake.signedCookies && !urlCookie) {
                console.log("no secureCookies|signedCookies found");
                return next(new Error("no secureCookies found"));
            }

            var sid;
            if(urlCookie)  {
                //TODO: find out just how slow this is
                try {
                    sid = url.substring(url.indexOf('=') + 1, url.indexOf('&')); 
                    sid = sid.substring(sid.indexOf('%3A') + 3, sid.indexOf('.'));
                }
                catch(err) {
                    console.log(err);
                }
            }
            else if(socket.handshake.signedCookies){
                sid = socket.handshake.signedCookies[key];
            }

            mongooseSessionStore.get(sid, function(err, session){

                if(!session) socket.session = {};
                else socket.session = session;

                socket.session.sid = sid;

                if (!err && !session) 
                    console.log('session not found');

                if (err) {
                     console.log('failed connection to socket.io:', err);

                }
                else {
                    //console.log('successful connection to socket.io');
                }
                next(err);
            });
        });
    });

    //routes
    require('./routes')(app);


    //everything sockets related
    require('./sockets').initCons(io, passport, mongooseSessionStore);

    return {app: app, server: server, mongConn: mongooseConn};
    //return app;

}

module.exports = function(options) {
    return runServer(options);
}
