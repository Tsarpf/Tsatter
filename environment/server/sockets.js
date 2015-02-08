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
            channels: ['#test'],
            port: 6667,
            userName: username,
            autoConnect: false
        };
        var client = new irc.Client(ircServerAddress, username, connObj);

        client.addListener('raw', function(message) {
            //console.log(message);
        });

        client.addListener('error', function(message) {
            console.log('error: ' + message);
        });

        client.addListener('message', function(nick, channel, message) {
            console.log('got message');
            console.log(channel + ' ' + nick + ': ' + message);
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

    });
}

module.exports = {
    initCons: initializeConnections 
}
