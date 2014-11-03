var mongoose = require('mongoose');
var Channel = require('./app/models/channel');
var User = require('./app/models/user');

var channels = {}

var isOnChannel = function(user, channel) {

}
var joinChannel = function(user, channel, socket) {
    if(!channels[channel]){
        channels[channel] = {};
        io.sockets.emit('hello', {channels: channels});
    }
    channels[channel][user] = "ses";
    socket.join(channel);
}
var leaveChannel = function(user, channel) {
}

var auth = function(username, password, callback) {
    var req = {body: {username: username, password: password}};
    passport.authenticate('local', function(err, user, info) {
        if(!user) {
            var err = "Login failed: " + err;
            callback(null, err);
            return;
        }

        callback(user, null, info);

    })(req, null, null);
}

var count = 0;

var io;
var users = [];
var passport = {};

var initializeConnections = function(socketio, passportjs) {
    console.log('initd');
    io = socketio;
    passport = passportjs;

    io.on('connection', function(socket) {
        console.log('new connection');
        count++;
        var username = 'anon' + count;
        socket.emit('hello', {channels: channels});
        socket.on('join', function(data, fn) {
            if(data.room) {
                try {
                    joinChannel(username, data.room, socket);
                }
                catch(err){
                    console.log(err);
                }
            }
            fn('joined');
        });
        socket.on('leave', function(data) {
            if(data.room) {
                try {
                    socket.leave(data.room);
                }
                catch(err){
                    console.log(err);
                }
            }
        });
        socket.on('message', function(data) {
            if(channels[data.room] && channels[data.room][username]){
                io.to(data.room).emit(data.room, {user: username, message: data.message});
            }
            else {
                console.log("error:");
                console.log(data);
            }
        });

        socket.on('register', function(data) {
            User.register(new User({ username : data.username }), data.password, function(err, user) {
                if (err) {
                    socket.emit('registerFail', {reason: err});
                    return;
                }

                socket.emit('registerSuccess', err);
            });
        });

        socket.on('login', function(data) {
            auth(data.username, data.password, function(user, err) {
                if(!err){
                    socket.emit('loginSuccess', {});
                    console.log(user);
                    username = user.username;
                    return;
                }

                socket.emit('loginFail', {reason: 'No such username or password'});
            });
        });
    });
}

module.exports = {
    initCons: initializeConnections 
}
