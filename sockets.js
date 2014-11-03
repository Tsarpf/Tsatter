

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
var initializeConnections = function(socketio) {
    io = socketio;

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
    }
    
}

module.exports = {
    initCons: initializeConnections
}
