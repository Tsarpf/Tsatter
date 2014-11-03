var mongoose = require('mongoose');
var Channel = require('./app/models/channel');


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

var count = 0;

var io = {};
var users = [];
var passport = {};

var initializeConnections = function(socketio, passportjs) {
    io = socketio;
    passport = passportjs;

    return function(socket) {
        count++;
        var user = 'anon' + count;
        socket.emit('hello', {channels: channels});
        socket.on('join', function(data, fn) {
            if(data.room) {
                try {
                    joinChannel(user, data.room, socket);
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
            if(channels[data.room] && channels[data.room][user]){
                io.to(data.room).emit(data.room, {user: user, message: data.message});
            }
            else {
                console.log("error:");
                console.log(data);
            }
        });

        socket.on('register', function(data) {
            //NYI
        });

        socket.on('login', function(data) {
            auth(data.username, data.password, function(user, err, info) {
                console.log("tried logging in:");
                console.log(user);
                console.log(err);
                console.log(info);
        });
    }
    
}

module.exports = {
    initCons: initializeConnections 
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
