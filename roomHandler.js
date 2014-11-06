var mongoose = require('mongoose'),
    Room = require('./app/models/room'),
    User = require('./app/models/user');

var isAnon = function(username) {
    if(username.indexOf('anon') !== 0) {
        return false;
    }

    console.log('typeof stuff' + typeof username.substring(4));
    if(typeof username.substring(4) === "number") {
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
        console.log('username: ' + username);
        console.log('username: ' + mAllUsers[username]);
        mRoomUsers[username].socket.join(mRoomName);


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
               //console.log('saved user to channel');
               //console.log(doc);
           });
        });

        console.log('derp');
        console.log(mRoomUsers[username].rooms);
        if(!(mRoomName in mRoomUsers[username].rooms) && !isAnon(username)) {
            console.log('pushing new channel');
            User.findOneAndUpdate({username: username}, {$push: {rooms: mRoomName}}, {upsert: true}).exec(function(err, doc) {
                console.log(doc);
                if(err)
                    console.log(err);
            });
        }
        mRoomUsers[username].rooms[mRoomName] = pub;

        mRoomUsers[username].socket.on('logout', mOnLogout(username)); 

        Room.findOne({name: mRoomName}, {messages: {$slice: -50}}).exec(function(err, doc) {
            if(err || !doc){
                return
            }
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

        //console.log('send');
        //console.log(mRoomUsers);
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

        //console.log('room name: ' + mRoomName);
        //console.log('message: ');
        //console.log(message);
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
    }

    pub.leave = function(username) {

    }

    var mOnLogout = function(username) {
        return function(){
            if(mInviteOnly) { 
                mRoomUsers[username].socket.leave(mRoomName);
                //mRoomUsers[username] = {};
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

    }
    mConstruct();

    return pub;
}

module.exports = roomHandler;
