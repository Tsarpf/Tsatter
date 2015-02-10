var irc = require('irc');
var ircServerAddress = 'ircserver'; //similar to localhost, set by docker in the system's hosts file

var count = 0;
function nextAnon() {
    return 'anon' + (count++);
}
var initializeConnections = function(socketio, passportjs, mongooseSessionStore) {
    var io = socketio;

    io.on('connection', function(socket) {

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

        function toClient(eventName, messageObj) {

        }

        client.addListener('raw', function(message) {
            //console.log(message);
        });

        client.addListener('error', function(message) {
            console.log('error:');
            console.log(message);
        });

        client.on('names', function(channel, nicks) {
            socket.emit('names', {channel: channel, nicks: nicks})
            //socket.emit(channel, {nicks});
        });

        client.addListener('join', function(channel, nick, messageObj) {
            //socket.emit('join', {nick:nick, channel: channel});
            socket.emit(channel, messageObj);
        });

        client.addListener('message', function(nick, channelOrNick, messageTxt, messageObj) {
            //TODO: look into whether this is a good implementation for private messages
            socket.emit(channelOrNick, messageObj);
        });

        client.addListener('topic', function(channel, topic, nick, messageObj) {
            socket.emit(channel, messageObj);
        });

        client.addListener('part', function(channel, nick, reason, messageObj) {
            socket.emit(channel, messageObj);
        });

        client.addListener('quit', function(nick, reason, channels, messageObj) {
            //TODO: broadcast the nick to all channels
        });

        client.addListener('kick', function(channel, nick, by, reason, messageObj) {
            socket.emit(channel, messageObj);
        });

        client.addListener('nick', function(oldNick, newNick, channels, messageObj) {
            //TODO: broadcast the nick to all channels
            //socket.emit(channel, messageObj);
        });

        client.addListener('invite', function(channel, from, messageObj) {
            socket.emit(channel, messageObj);
        });

        client.addListener('+mode', function(channel, by, mode, argument, messageObj) {
            socket.emit(channel, messageObj);
        });

        client.addListener('-mode', function(channel, by, mode, argument, messageObj) {
            socket.emit(channel, messageObj);
        });


        client.connect(function() {
            console.log('connected');
        });





        socket.on('join', function(msg) {
            console.log('got join');
            console.log(msg);
            client.join(msg.channel, function() {
                socket.emit('join', {channel: msg.channel})
            });
        });

        socket.on('privmsg', function(msg) {
            client.say(msg.channel, msg.message);
        });

        socket.on('message', function(msg) {
            //client.send.apply(msg.command, msg.args);
        });

        socket.on('error', function(err) {
            console.log(err);
        });

    });
};

//send /<command>s straight to IRC-server. Except for cases where we have our own detour

module.exports = {
    initCons: initializeConnections 
};
