var mongoose = require('mongoose'),
    Room = require('../app/models/room'),
    User = require('../app/models/user');

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

var roomHandler = function(io, roomName, users) {
    var pub = {};

    var mRoomName = roomName;
    var mio = io;
    var mAllUsers = users; //A reference to the list of all users currently online from sockets.js. Really confusing. Please fix.
    var mRoomUsers = {}; //Users allowed in the room
    var mRoomCurrentUsers = {};
    var mInviteOnly = false;
    var mRequiresLogin = false;

    //This whole function is fugly. Clean up please.
    pub.join = function(username) {
        if(!mRoomUsers.hasOwnProperty(username) && mInviteOnly){ //If the room doesn't already have the user in it's user list
            mAllUsers[username].socket.emit('joinFail', {reason: 'Invite only channel'});
            return false;
        }

        //Send to others that a new user joined
        mio.to(mRoomName).emit(mRoomName, {message: username + " joined room"});
        mio.to(mRoomName).emit('joinedRoom', {room: mRoomName, username: username});

        //Pull new user from all users list and add to this channels allowed list etc.
        //Overwrite if exists
        mRoomUsers[username] = mAllUsers[username];
        //join the socket.io room
        mRoomUsers[username].socket.join(mRoomName);


        //If not already there and not anon
        if(!(mRoomName in mRoomUsers[username].currentRooms) && !isAnon(username)) {
            //Persist the knowledge that the user belongs to this room within his persistent data.
            User.findOneAndUpdate({username: username}, {$push: {rooms: mRoomName}}, {upsert: true}).exec(function(err, doc) {
                console.log(doc);
                if(err)
                    console.log(err);
            });
        }

        //TODO: remove O(n) indexOf
        if(mRoomUsers[username].roomsArray.indexOf(mRoomName) < 0) {
            mRoomUsers[username].roomsArray.push(mRoomName);
        }
        mRoomUsers[username].currentRooms[mRoomName] = pub;

        //If the room is invite only, don't allow anons -> add handler to make sure the user is thrown out if he logs out.
        //A bit weird... Maybe fix this?
        mRoomUsers[username].socket.on('logout', mOnLogout(username)); 


        User.findOne({name: username}).exec(function(err, doc) {
            if(doc===null){
                return;
            }
           //Add user to the room's user list
           Room.findOneAndUpdate(
           {name: mRoomName},
           {$push: {users: {_id: doc._id}}}
           ).exec(function(err, doc) {
               if(err){
                   console.log(err);
               }
               //console.log('saved user to channel');
               //console.log(doc);
           });
        });

        //Add to current users, needed for channel users list and stuff I guess
        mRoomCurrentUsers[username] = "";

        //Get an initial backlog of messages from the room. At the time of writing it's -50
        Room.findOne({name: mRoomName}, {messages: {$slice: -50}}).exec(function(err, doc) {
            var messages = [];
            if(!err && doc && doc.messages){
                messages = doc.messages;
            }
            //TODO: check if Object.keys is O(n) or something, if so, no idea for the mRoomCurrentUsers to be an object instead of an array
            mRoomUsers[username].socket.emit('joinSuccess', {messages: messages, room: mRoomName, currentUsers: Object.keys(mRoomCurrentUsers)});
        });


        return true;        
    };

    pub.usernameChanged = function(old, newname) {
        delete mRoomUsers[old]
        mRoomUsers[newname] = mAllUsers[newname];
        var msg = {
            username: 'server',
            message: old + ' is now known as ' + newname
        };
        mio.to(mRoomName).emit(mRoomName, msg);
    };

    pub.send = function(message) {
        var user = mRoomUsers[message.username];

        //console.log('send');
        //console.log(mRoomUsers);
        if(!user)
        {
            console.log('!user');
            return false;
        }

        //Is this only for debug mode? then remove from 'release' version
        if(mRequiresLogin && !user.loggedIn)
        {
            console.log('required login fail');
            return false;
        }

        //TODO: find out if more checking is needed?

        mio.to(mRoomName).emit(mRoomName, message);
         
        Room.findOneAndUpdate(
            {name: mRoomName},
            {$push: {messages: message}}
        ).exec(function(err, doc) {
            //console.log('saved message?');      
            //console.log(doc);      
            if(err)
                console.log(err);      
        });

        return true;
    };

    pub.leave = function(username) {
        delete mRoomCurrentUsers[username];
        mRoomUsers[username].socket.leave(mRoomName); //TODO: check if this crashes if user is already disconnected etc.
        mio.to(mRoomName).emit(mRoomName, {message: username + " left room"});
        mio.to(mRoomName).emit('leftRoom', {room: mRoomName, username: username});
    };

    //Not sure if this will be necessary, maybe we can just use pub.leave in all cases?
    pub.disconnect = function(username) {
    }

    var mOnLogout = function(username) {
        return function(){
            if(mInviteOnly) {
                //Hopefully no race conditions here?
                pub.leave(username);

                //mRoomUsers[username].socket.leave(mRoomName);
                //mRoomUsers[username] = {};
            }
        }
    };

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
                    //console.log('users in existing room:');
                    //console.log(users);
                    if(err)
                        console.log(err);
                    else {
                        for(var i = 0; i < users.length; i++){
                            mRoomUsers[users[i].username] = {};
                        }
                    }
                });
            }
        });
    };

    var mConstruct = function(){
        mLoadRoom();

    };
    mConstruct();

    return pub;
};

module.exports = roomHandler;
