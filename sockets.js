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

    console.log('changing nick');
    console.log(users[newn].channels);

    for(var channel in users[newn].rooms) {
        console.log(channel);
        channels[channel].usernameChanged(old, newn);
        channels[channel].join(newn);                         
    }
}

var initializeConnections = function(socketio, passportjs) {
    io = socketio;
    passport = passportjs;

    io.on('connection', function(socket) {
        console.log('new connection');
        count++;
        var username = 'anon' + count;
        users[username] = {
            socket: socket,
            loggedIn: false,
            rooms: {}};
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
                    users[username].loggedIn = true;
                    changeUsername(username, user.username);
                    username = user.username;
                    return;
                }

                socket.emit('loginFail', {reason: 'No such username or password'});
            });
        });

        socket.on('logout', function(data) {
            users[username].loggedIn = false;
            username = 'anon' + count;
            changeUsername(username, 'anon' + count);
            socket.emit('logoutSuccess', {});
        });

    });
}

module.exports = {
    initCons: initializeConnections 
}
