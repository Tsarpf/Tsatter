var mongoose = require('mongoose');
var User = require('./app/models/user');
var roomHandler = require('./roomHandler.js');


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
var channels = {}
var users = {};
var passport;

var changeUsername = function(old, newn){
    var user = users[old];
    delete users[old];
    users[newn] = user;
}

var initializeConnections = function(socketio, passportjs) {
    console.log('initd');
    io = socketio;
    passport = passportjs;

    io.on('connection', function(socket) {
        console.log('new connection');
        count++;
        var username = 'anon' + count;
        users[username] = {socket: socket, loggedIn: false};
        //socket.emit('hello', {channels: channels});
        socket.on('join', function(data, fn) {
            if(!channels[data.room]){
                channels[data.room] = roomHandler(io, data.room, users);
            }
            channels[data.room].join(username);
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
            console.log('got message');
            console.log(data);
            if(channels[data.room]){
                channels[data.room].send({username: username, message: data.message});
            }
            else {
                console.log("error:");
                console.log(username);
                console.log(data);
            }
        });

        socket.on('register', function(data) {
            //TODO: don't allow registering as anon<number>
            User.register(new User({ username : data.username }), data.password, function(err, user) {
                if (err) {
                    socket.emit('registerFail', {reason: err});
                    return;
                }

                socket.emit('registerSuccess', {});
            });
        });

        socket.on('login', function(data) {
            auth(data.username, data.password, function(user, err) {
                if(!err){
                    socket.emit('loginSuccess', {});
                    console.log(user);
                    changeUsername(username, user.username);
                    username = user.username;
                    users[username].loggedIn = true;
                    return;
                }

                socket.emit('loginFail', {reason: 'No such username or password'});
            });
        });

        socket.on('logout', function(data) {
            userinfo.username = 'anon' + count;
            userinfo.loggedIn = false;
            socket.emit('logoutSuccess', {});
            //TODO: leave register only channels
        });

    });
}

module.exports = {
    initCons: initializeConnections 
}
