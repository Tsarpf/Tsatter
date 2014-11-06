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
var sessionStore = {};


var nextAnon = function() {
    return 'anon' + (++count);
}
var changeUsername = function(old, newn){
    console.log('changing nick');
    console.log(old + ' ' + newn);
    var user = users[old];
    delete users[old];
    users[newn] = user;
    //console.log(users);
    //console.log(users[newn]);


    console.log('user rooms');
    console.log(users[newn].rooms);
    for(var channel in users[newn].rooms) {
        //console.log(channel);
        channels[channel].usernameChanged(old, newn);
        channels[channel].join(newn);                         
    }
}

var login = function(userinfo, username) {
    console.log('logging in');
    User.findOne({username: username}).exec(function (err, doc){
        if(err || !doc){
            console.log('error in login');
            console.log(err);
            return;
        }
        userinfo.loggedIn = true;
        console.log('rooms:');
        console.log(doc);
        console.log(doc.rooms);
        for(var i = 0; i < doc.rooms.length; i++) {
            userinfo.rooms[doc.rooms[i]] = {};
        }
        userinfo.roomsArray = doc.rooms;
        userinfo.username = username;


        userinfo.socket.emit('loginSuccess', {username: userinfo.username, rooms: doc.rooms});
        if(users[username].socket) {
            users[username].socket.disconnect();
        }
        users[username] = userinfo;
    });
}


var initializeConnections = function(socketio, passportjs, mongooseSessionStore) {
    io = socketio;
    passport = passportjs;
    sessionStore = mongooseSessionStore;

    io.on('connection', function(socket) {
        count++;
        var userinfo = {
            socket: socket,
            loggedIn: false,
            rooms: {},
            username: nextAnon(),
            roomsArray: []
        };

        console.log('new connection');
        console.log(socket.session);

        if(socket.session.username) { //username from  cookie
            var username = socket.session.username;    
            login(userinfo, username);
        }
        else {
            users[userinfo.username] = userinfo;
        }

        
        socket.on('hello', function(data, fn) {
            fn({username: userinfo.username, loggedIn: userinfo.loggedIn, rooms: userinfo.roomsArray});
        });

        socket.on('join', function(data, fn) {
            if(!channels[data.room]){
                channels[data.room] = roomHandler(io, data.room, users);
            }
            channels[data.room].join(userinfo.username);
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
                channels[data.room].send({username: userinfo.username, message: data.message});
            }
            else {
                console.log("error:");
                console.log(userinfo.username);
                console.log(data);
            }
        });

        socket.on('register', function(data) {
            //TODO: move anon checking to document validator
            if(data.username.indexOf('anon') == 0 && IsNumeric(data.username.substring(4)))
            {
                socket.emit('registerFail', {reason: err});
                return;
            }
            User.register(new User({ username : data.username }), data.password, function(err, user) {
                if (err) {
                    socket.emit('registerFail', {reason: err});
                    return;
                }

                socket.emit('registerSuccess', {});
            });
        });

        socket.on('login', function(data, fn) {
            if(userinfo.loggedIn) {
                return;
            }
            auth(data.username, data.password, function(user, err) {
                if(err){
                    socket.emit('loginFail', {reason: 'No such username or password'});
                    return;
                }
                socket.session.username = user.username;
                sessionStore.set(socket.session.sid, socket.session, function(err) {if(err) console.log(err);});
                changeUsername(userinfo.username, user.username);
                login(userinfo, user.username);
                fn({username: user.username, loggedIn: true});
            });
        });

        socket.on('logout', function(data, fn) {
            if(!userinfo.loggedIn) {
                return;
            }
            userinfo.loggedIn = false;
            //users[userinfo.username].loggedIn = false;
            var name = nextAnon();
            changeUsername(userinfo.username, name);
            //Remove login from cookie
            delete socket.session.username;
            sessionStore.set(socket.session.sid, socket.session, function(err) {if(err) console.log(err);});

            userinfo.username = name; 
            fn({username: name, loggedIn: false});
        });

    });
}

module.exports = {
    initCons: initializeConnections 
}
