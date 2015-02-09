var irc = require('irc');
var ircServerAddress = 'ircserver';

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

        client.addListener('raw', function(message) {
            //console.log(message);
        });

        client.addListener('error', function(message) {
            console.log('error:');
            console.log(message);
        });

        client.addListener('message', function(nick, channel, message) {
            console.log('got message');
            console.log(channel + ' ' + nick + ': ' + message);
            socket.emit(channel, {nick: nick, message: message});
        });

        client.addListener('join', function(channel, nick, message) {
            console.log('joined channel');
            console.log(channel + ' ' + nick + ': ' + message);
            client.say(channel, 'oh hi ' + nick);
        });

        client.connect(function() {
            console.log('connected');
            client.join('#test2', function(nick, message) {
                console.log('joined channel test2');
                client.say('#test2', 'hello world');
            });
        });


        client.on('names', function(channel, nicks) {
           socket.emit('names', {channel: channel, nicks: nicks})
        });
        socket.on('join', function(msg) {
            client.join(msg.channel, function() {
                socket.emit('join', {channel: msg.channel})
            });
        });
        socket.on('privmsg', function(msg) {
            client.say(msg.channel, msg.message);
        });
        socket.on('message', function(msg) {
            client.send.apply(msg.command, msg.args);
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
