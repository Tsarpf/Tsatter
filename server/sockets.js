var mongoose = require('mongoose');
var User = require('../app/models/user');
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
var recentlyActiveRooms = [];
//TODO: rename channels to rooms...
var channels = {}
var users = {};
var passport;
var sessionStore = {};


var isAnon = function(username) {
    if(username.indexOf('anon') !== 0) {
        return false;
    }

    //console.log('typeof stuff' + typeof username.substring(4));
    if(typeof username.substring(4) === "number") {
        return false;
    }

    return true;
}
var nextAnon = function() {
    return 'anon' + (++count);
}
var changeUsername = function(old, newn){
    console.log('changing nick');
    console.log(old + ' ' + newn);
    var user = users[old];
    delete users[old];

    //TODO: find out what's up with this
    //if(users[newn] && users[newn].socket) {
        //users[newn].socket.disconnect();
    //}

    users[newn] = user;
    //console.log(users);
    //console.log(users[newn]);


    console.log('user rooms');
    console.log(users[newn].currentRooms);
    for(var channel in users[newn].currentRooms) {
        //console.log(channel);
        if(channels.hasOwnProperty(channel)) {
            channels[channel].usernameChanged(old, newn);
            channels[channel].join(newn);                         
        }
    }
}

var sendRoomLists = function(userinfo) {
    var obj = {
        userRooms: userinfo.roomsArray,
        allRooms: recentlyActiveRooms 
    }
    userinfo.socket.emit('roomLists', obj);
}

var maxRecentRooms = 50;
var currentPos = 0;
var updateRecentRooms = function(newRoom) {
    //TODO: remove indexOf usage and use hashmap for checking instead so the function is O(1)
    if(recentlyActiveRooms.indexOf(newRoom) >= 0)
        return false;
    if(recentlyActiveRooms.length < maxRecentRooms) {
        recentlyActiveRooms.push(newRoom);
        return true;
    }

    recentlyActiveRooms[currentPos] = newRoom;
    currentPos++;
    if(currentPos >= maxRecentRooms) currentPos = 0;
    return true;
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
        console.log(doc.rooms);
        for(var i = 0; i < doc.rooms.length; i++) {
            userinfo.currentRooms[doc.rooms[i]] = {};
        }
        userinfo.roomsArray = doc.rooms;
        userinfo.username = username;


        userinfo.socket.emit('loginSuccess', {username: userinfo.username, rooms: doc.rooms});
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
            currentRooms: {}, //This list might be pretty easy to remove and just use roomsArray? Only has references to it in this file and three in roomHandler
            username: nextAnon(),
            roomsArray: ['test']
        };


        //console.log('new connection');

        if(socket.session && socket.session.username) { //username from  cookie
            var username = socket.session.username;    
            login(userinfo, username);
        }
        else {
            users[userinfo.username] = userinfo;
        }

        
        socket.on('hello', function(data, fn) {
            sendRoomLists(userinfo);

            fn({username: userinfo.username, loggedIn: userinfo.loggedIn, rooms: userinfo.roomsArray});
        });
        socket.on('join', function(data, fn) {
            if(data.room === undefined || data.room === '') {
                socket.emit('joinFail', {reason: 'No room name supplied or it was empty string'});
                return;
            }
            if(!channels[data.room]){
                channels[data.room] = roomHandler(io, data.room, users);
            }

            channels[data.room].join(userinfo.username);
            sendRoomLists(userinfo);
        });
        socket.on('leave', function(data) {
            if(data.room) {
                try {
                    if(channels[data.room]) {
                        channels[data.room].leave(userinfo.username);
                    }
                }
                catch(err){
                    console.log(err);
                }
            }
        });
        socket.on('message', function(data) {
            if(channels[data.room]){
                var wasAllowed = channels[data.room].send({username: userinfo.username, message: data.message});

                if(wasAllowed) {
                    var updated = updateRecentRooms(data.room);
                    if(!updated) return;

                    Object.keys(users).map(function(value, index){
                        sendRoomLists(users[value]);
                    });
                }
            }
            else {
                console.log("error:");
                console.log(userinfo.username);
                console.log(data);
            }
        });

        socket.on('register', function(data) {
            //TODO: move anon checking to document validator
            //if(data.username.indexOf('anon') == 0 && IsNumeric(data.username.substring(4)))

            if(data.username === undefined || isAnon(data.username))
            {
                socket.emit('registerFail', {reason: 'Cannot register as anon or without an username'});
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

        socket.on('disconnect', function(data, fn) {
            for(var room in userinfo.currentRooms){
                if(channels[room]) {
                    channels[room].leave(userinfo.username);
                }
            }
        });

    });
}

module.exports = {
    initCons: initializeConnections 
}
