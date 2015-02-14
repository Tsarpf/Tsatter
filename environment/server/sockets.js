var irc = require('irc');
var ircServerAddress = 'ircserver'; //similar to localhost, set by docker in the system's hosts file

var count = 0;
function nextAnon() {
    return 'anon' + (count++);
}
var initializeConnections = function(socketio, passportjs, mongooseSessionStore) {
    var io = socketio;

    io.on('connection', function(socket) {
        console.log('got connection');

        var username;
        if(socket.session && socket.session.username) {
            username = socket.session.username;
        }
        else {
            username = nextAnon();
        }

        var connObj = {
            port: 6667,
            userName: username,
            autoConnect: false
        };
        var client = new irc.Client(ircServerAddress, username, connObj);

        client.addListener('raw', function(message) {
            console.log(message);
        });

        client.addListener('error', function(message) {
            console.log('error:');
            console.log(message);
        });

        client.on('names', function(channel, nicks) {
            socket.emit(channel, {nicks: nicks, command: 'NAMES'});
        });

        client.addListener('join', function(channel, nick, messageObj) {
            if(nick === username) {
                socket.send(messageObj);
            }
            else {
                console.log(messageObj);
                socket.emit(channel, messageObj);
            }
        });

        client.addListener('message', function(nick, channelOrNick, messageTxt, messageObj) {
            //TODO: look into whether this is a good implementation for private messages
            console.log('message');
            console.log(messageObj);
            socket.emit(channelOrNick, messageObj);
        });

        client.addListener('registered', function(messageObj) {
            console.log(messageObj);
            messageObj.nick = username;
            socket.send(messageObj);
        });

        client.addListener('topic', function(channel, topic, nick, messageObj) {
            console.log(messageObj);
            socket.emit(channel, messageObj);
        });

        client.addListener('part', function(channel, nick, reason, messageObj) {
            console.log(messageObj);
            socket.emit(channel, messageObj);
        });

        client.addListener('quit', function(nick, reason, channels, messageObj) {
            console.log('got quit');
            console.log(messageObj);
            //TODO: broadcast the nick to all channels
        });

        client.addListener('kick', function(channel, nick, by, reason, messageObj) {
            console.log('kick');
            console.log(messageObj);
            socket.emit(channel, messageObj);
        });

        client.addListener('nick', function(oldNick, newNick, channels, messageObj) {
            console.log('kick');
            socket.send(messageObj);
        });

        client.addListener('invite', function(channel, from, messageObj) {
            console.log(messageObj);
            socket.emit(channel, messageObj);
        });

        client.addListener('+mode', function(channel, by, mode, argument, messageObj) {
            console.log(messageObj);
            socket.emit(channel, messageObj);
        });

        client.addListener('-mode', function(channel, by, mode, argument, messageObj) {
            console.log(messageObj);
            socket.emit(channel, messageObj);
        });


        client.connect(function() {
            console.log('connected');
        });

        socket.on('join', function(msg) {
            console.log('got join');
            console.log(msg);
            client.join(msg.channel);
        });

        socket.on('privmsg', function(msg) {
            client.say(msg.channel, msg.message);
        });

        socket.on('error', function(err) {
            console.log('socket error');
            console.log(err);
            //client.disconnect('socket error');
        });

        socket.on('message', function(messageObj) {
            console.log('got raw message from socket');
            console.log(messageObj.command);
            try {
                client.send.apply(client, messageObj.command);
            }
            catch(err) {
                console.log('send fail');
                console.log(err);
            }
        });

        socket.on('reconnect', function() {
            console.log('reconnect');
            client.disconnect('reconnect not allowed');
        });

        socket.on('disconnect', function(test) {
            console.log('disconnect ' + test);
            client.disconnect('socket disconnected');
        });

        socket.on('close', function() {
            console.log('close');
            client.disconnect('socket closed');
        });

    });
};

module.exports = {
    initCons: initializeConnections 
};
