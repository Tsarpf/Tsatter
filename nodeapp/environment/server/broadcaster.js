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
            channels[channel] = [socket];
        }
        else {
            channels[channel].push(socket);
        }


        if(!users[socket.id]) {
            users[socket.id] = [channel];
        }
        else {
            users[socket.id].push(channel);
        }
    }

    function remove(channel, socket) {
        console.log('removed ' + socket.id);

        for(var i = 0; i < channels[channel].length; i++) {
            var sock = channels[channel][i];

            if(sock.id === socket.id) {
                channels[channel].splice(i, 1);
            }
        }
    }

    function quit(socket) {
        var socketid = socket.id;
        console.log(socketid + ' quit');
        if(!users[socketid]) {
            return;
        }
        for(var i = 0; i < users[socketid].length; i++) {
            var channel = users[socketid][i];
            for(var j = 0; j < channels[channel].length; j++) {
                var sock = channels[channel][j];
                if(sock.id === socketid) {
                    channels[channel].splice(j,1);
                }
            }
        }
    }

    function broadcast(channel, message) {
        for(var i = 0; i < channels[channel].length; i++) {
            var sock = channels[channel][i];
            sock.emit(message);
        }
    }

    return {
        add: add,
        remove: remove,
        broadcast: broadcast,
        quit: quit
    }
}());
