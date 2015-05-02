/**
 *
 * Created by tsarpf on 4/26/15.
 */
module.exports = (function() {

    var channels = {};
    var users = {};

    function add(channel, socket) {
        console.log('added ' + socket.id);
        if(!channels[channel]) {
            channels[channel] = {};
        }
        channels[channel][socket.id] = socket;

        if(!users[socket.id]) {
            users[socket.id] = {};
        }
        users[socket.id][channel] = channels[channel];
    }

    function remove(channel, socket) {
        console.log('removed ' + socket.id);
        console.log(channel);
        console.log(channels);

        if(channels[channel][socket.id]) {
            delete channels[channel][socket.id];
        }
    }

    function quit(socket) {
        var socketid = socket.id;
        console.log(socketid + ' quit');
        if(!users[socketid]) {
            return;
        }

        for(var key in users[socketid]) {
            if(users[socketid].hasOwnProperty(key)) {
                var channel = users[socketid][key];
                delete channel[socketid];
            }
        }
    }

    function broadcast(channel, message) {
        for(var key in channels[channel]) {
            if(channels[channel].hasOwnProperty(key)) {
               var socket = channels[channel][key];
                socket.emit(channel, message);
            }
        }
    }

    return {
        add: add,
        remove: remove,
        broadcast: broadcast,
        quit: quit
    }
}());
