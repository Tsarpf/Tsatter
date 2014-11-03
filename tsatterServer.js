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
app.use(session({
    cookieParser: cookieParser,
    key: key,
    secret: secret,
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






var server = app.listen(7547, function() {
    console.log("server running..");
});
var io = require('socket.io')(server);

cookieParser = cookieParser(secret);
io.use(function(socket, next){
    cookieParser(socket.handshake, {}, function(err){
        if (err) {
            console.log("error in parsing cookie");
            return next(err);
        }
        if (!socket.handshake.signedCookies) {
            console.log("no secureCookies|signedCookies found");
            return next(new Error("no secureCookies found"));
        }
        mongooseSessionStore.get(socket.handshake.signedCookies[key], function(err, session){
            socket.session = session;
            if (!err && !session) err = new Error('session not found');
            if (err) {
                 console.log('failed connection to socket.io:', err);
            } else {
                 console.log('successful connection to socket.io');
            }
            next(err);
        });
    });
});

function onAuthorizeSuccess(data, accept){
  console.log('successful connection to socket.io');
  accept(null, true);
}

function onAuthorizeFail(data, message, error, accept){
  if(error)
    throw new Error(message);
  console.log('failed connection to socket.io:', message);
  accept(null, false);
}


//routes
require('./routes')(app);


//everything sockets related
require('./sockets').initCons(io, passport);


module.exports = app;
