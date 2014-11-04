//create new channel object for every channel?
//keep a list of channel names in sockets.js which reference the channel objects?
//get handler object by channels[data.room].join/send/leave/etc
//if list of channels doesn't have channel, instantiate a new one... in it's constructor it can handle creating it to the db if it doesn't exist
var mongoose = require('mongoose'),
    Room = require('./app/models/room'),
    User = require('./app/models/user');



var roomHandler = function(io, roomName, users) {
    var pub = {};

    var mRoomName = roomName;
    var mio = io;
    var mAllUsers = users;
    var mRoomUsers = {};
    var mInviteOnly = false;
    var mRequiresLogin = false;

    pub.join = function(username) {
        if(!mRoomUsers.hasOwnProperty(username) && mInviteOnly){ //If the room doesn't already have the user in it's user list
            console.log('join fail'); 
            mAllUsers[username].socket.emit('joinFail', {reason: 'Invite only channel'});
            return;
        }
        
        mRoomUsers[username] = mAllUsers[username];
        console.log('room name: ' + mRoomName);
        mRoomUsers[username].socket.join(mRoomName);

        //TODO: add user to room db 

        mRoomUsers[username].socket.on('logout', mOnLogout(username)); 

        Room.findOne({name: mRoomName}, {messages: {$slice: -50}}).exec(function(err, doc) {
            if(err || !doc){
                return
            }
            console.log('messages');
            console.log(doc);
            mRoomUsers[username].socket.emit('joinSuccess', {messages: doc.messages, room: mRoomName}); 
        });

        
    }


    pub.send = function(message) {
        var user = mRoomUsers[message.username];

        console.log('send');
        console.log(mRoomUsers);
        if(!user)
        {
            console.log('!user');
            return;
        }

        if(mRequiresLogin && !user.loggedIn)
        {
            console.log('required login fail');
            return;
        }

        //TODO: find out if more checking is needed?

        console.log('room name: ' + mRoomName);
        console.log('message: ');
        console.log(message);
        mio.to(mRoomName).emit(mRoomName, message);
         
        Room.findOneAndUpdate(
            {name: mRoomName},
            {$push: {messages: message}}
        ).exec(function(err, doc) {
            console.log('saved message?');      
            console.log(doc);      
            console.log(err);      
        });
    }

    pub.leave = function(username) {

    }

    var mOnLogout = function(username) {
        return function(){
            if(mInviteOnly) { 
                mRoomUsers[username].socket.leave(mRoomName);
                mRoomUsers[username] = {};
            }
        }
    }

    var mLoadRoom = function() {
        Room.findOne({
            name: mRoomName
        },
        function(err,doc) {
            //Didn't find an existing room
            if(doc===null) {
                var room = new Room({name: roomName});
                room.save(function(err,docs) {
                    if(err){
                        console.log(err);
                    }
                });
            }
            //Found an existing room.
            else {
                mInviteOnly = doc.inviteOnly;
                mRequiresLogin = doc.requiresLogin;
                doc.populate('users', function(err, users) {
                    console.log('users in existing room:');
                    console.log(users);
                    for(var i = 0; i < users.length; i++){
                        mRoomUsers[users[i].username] = {};
                    }
                });
            }
        });
    };

    var mConstruct = function(){
        mLoadRoom();

    }
    mConstruct();

    return pub;
}

module.exports = roomHandler;
