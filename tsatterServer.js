var express = require('express'),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    passportSocketIo = require('passport.socketio'),
    session = require('express-session'),
    cookieParser = require('cookie-parser'),
    MongooseSession = require('mongoose-session-store'),
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

var io = require('socket.io')(server);

var key = 'express.sid';
var secret = 'use only for testing you know';
app.use(session({
    cookieParser: cookieParser,
    key: key,
    secret: secret,
    store: mongooseSessionStore
}));
io.use(passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: key,
    secret: secret,
    store: mongooseSessionStore
}));


//Use jade
app.set('view engine', 'jade');
app.set('views', __dirname + '/app/views');

//Always use pretty html.
app.locals.pretty = true;

var server = app.listen(7547, function() {
    console.log("server running..");
});



//routes
require('./routes')(app);

var initCons = require('./sockets').initCons(io, passport);

io.on('connection', initCons);



module.exports = app;
