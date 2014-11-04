var mongoose = require('mongoose'),
    Room = require('./app/models/room'),
    User = require('./app/models/user');

var isAnon = function(username) {
    if(username.indexOf('anon') !== 0) {
        return false;
    }

    if(!IsNumeric(username.substring(4))) {
        return false;
    }

    return true;
}

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
            mAllUsers[username].socket.emit('joinFail', {reason: 'Invite only channel'});
            return false;
        }

        //Overwrite if exists
        mRoomUsers[username] = mAllUsers[username];
        console.log('room name: ' + mRoomName);
        mRoomUsers[username].socket.join(mRoomName);

        mRoomUsers[username].rooms[mRoomName] = pub;

        User.findOne({name: username}).exec(function(err, doc) {
            if(doc===null){
                return;
            }
           Room.findOneAndUpdate(
           {name: mRoomName},
           {$push: {users: {_id: doc._id}}}
           ).exec(function(err, doc) {
               if(err){
                   console.log(err);
               }
               console.log('saved user to channel');
               console.log(doc);
           });
        });

        mRoomUsers[username].socket.on('logout', mOnLogout(username)); 

        Room.findOne({name: mRoomName}, {messages: {$slice: -50}}).exec(function(err, doc) {
            if(err || !doc){
                return
            }
            console.log('messages');
            console.log(doc);
            mRoomUsers[username].socket.emit('joinSuccess', {messages: doc.messages, room: mRoomName}); 
        });

        return true;        
    }

    pub.usernameChanged = function(old, newname) {
        delete mRoomUsers[old]
        mRoomUsers[newname] = mAllUsers[newname];
        var msg = {
            username: 'server',
            message: old + ' is now known as ' + newname
        };
        mio.to(mRoomName).emit(mRoomName, msg);
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
