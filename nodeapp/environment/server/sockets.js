module.exports = (function() {
    var irc = require('irc');
    var ircServerAddress = 'ircserver'; //similar to localhost, set by docker in the system's hosts file

    var count = 0;
    function nextAnon() {
        return 'anon' + (count++);
    }

    var broadcaster,
        persistenceHandler,
        imageProcessor,
        server,
        io;

    var connected = 0;

    var urlRegex = /((((https?|ftp):\/\/)|www\.)(([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)|(([a-zA-Z0-9\-]+\.)*[a-zA-Z0-9\-]+\.(aero|asia|biz|cat|com|coop|info|int|jobs|mobi|museum|name|net|org|post|pro|tel|travel|xxx|edu|gov|mil|[a-zA-Z][a-zA-Z]))|([a-z]+[0-9]*))(:[0-9]+)?((\/|\?)[^ "]*[^ ,;\.:">)])?)|(spotify:[^ ]+:[^ ]+)/g;

    var getUrls = function(message) {
        return message.match(urlRegex);
    };

    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }

    var addListeners = function(socket) {
        connected++;
        console.log('new connection, currently connected: ' + connected);
        console.log("New message from " + socket.request.connection.remoteAddress);
        if(endsWith('172.17.0.119', socket.request.connection.remoteAddress)) {
            socket.server.close();
        }


        var username;
        if (socket.session && socket.session.username) {
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

        client.addListener('raw', function (message) {
            if(message.commandType === 'error') {
                //console.log('error');
                //console.log(message);
                socket.send(message);
            }
        });

        client.addListener('error', function (messageObj) {
            console.log('error:');
            console.log(messageObj);
            socket.send(messageObj);
        });

        client.on('names', function (channel, nicks) {
            socket.emit(channel, {nicks: nicks, command: 'NAMES'});
        });

        client.addListener('join', function (channel, nick, messageObj) {
            if (nick === username) {
                socket.send(messageObj);
            }
            else {
                console.log(messageObj);
                socket.emit(channel, messageObj);
            }
        });

        client.addListener('message', function (nick, channelOrNick, messageTxt, messageObj) {
            //TODO: look into whether this is a good implementation for private messages
            console.log('message');
            console.log(messageObj);
            socket.emit(channelOrNick, messageObj);
        });

        client.addListener('registered', function (messageObj) {
            //console.log(messageObj);
            messageObj.nick = username;
            socket.send(messageObj);
        });

        client.addListener('topic', function (channel, topic, nick, messageObj) {
            console.log(messageObj);
            socket.emit(channel, messageObj);
        });

        client.addListener('part', function (channel, nick, reason, messageObj) {
            if(nick === username) {
                socket.send(messageObj);
            }
            else {
                console.log(messageObj);
                socket.emit(channel, messageObj);
            }
        });

        client.addListener('quit', function (nick, reason, channels, messageObj) {
            console.log('got quit');
            console.log(messageObj);
            socket.send(messageObj);
        });

        client.addListener('kick', function (channel, nick, by, reason, messageObj) {
            console.log('kick');
            console.log(messageObj);
            if(nick === username) {
                socket.send(messageObj);
            }
            else {
                socket.emit(channel, messageObj);
            }
        });

        client.addListener('nick', function (oldNick, newNick, channels, messageObj) {
            if(oldNick === username) {
                username = newNick;
            }
            console.log('nick');
            console.log(messageObj);
            socket.send(messageObj);
        });

        client.addListener('invite', function (channel, from, messageObj) {
            console.log(messageObj);
            socket.emit(channel, messageObj);
        });

        client.addListener('+mode', function (channel, by, mode, argument, messageObj) {
            console.log(messageObj);
            socket.emit(channel, messageObj);
        });

        client.addListener('-mode', function (channel, by, mode, argument, messageObj) {
            console.log(messageObj);
            socket.emit(channel, messageObj);
        });

        client.connect(function () {
            //console.log('connected');
        });

        socket.on('join', function (msg) {
            console.log('got join');
            console.log(msg);

            broadcaster.add(msg.channel, socket);
            client.join(msg.channel);

        });

        var spamPrev = [];
        var spamPrevSize = 5;
        socket.on('privmsg', function (msg, fn) {
            console.log("New message from " + socket.request.connection.remoteAddress);
            client.say(msg.channel, msg.message);
            if(msg.message.length > 512) {
                msg.message = msg.message.substring(0, 512);
            }
            persistenceHandler.saveMessage(msg.channel, username, msg.message, function(err, idx) {
                if(err) {
                    console.log(err);
                    return fn(false);
                }

                var urls = getUrls(msg.message);
                if(urls) {
                    for(var i = 0; i < urls.length; i++) {
                        if(spamPrev.indexOf(urls[i]) >= 0) {
                            urls.splice(i, 1);
                        }
                        else {
                            spamPrev.push(urls[i]);
                        }
                    }
                    urls = urls.slice(0,3);
                    imageProcessor.processUrls(urls, msg.channel, idx);

                    while(spamPrev.length > spamPrevSize) {
                        spamPrev.shift();
                    }
                }

                if(fn) {
                    fn(true);
                }
            });
        });

        socket.on('error', function (err) {
            console.log('socket error');
            console.log(err);
            //client.disconnect('socket error');
        });

        socket.on('message', function (messageObj) {
            //console.log('got raw message from socket');
            //console.log(messageObj.command);
            if(messageObj.command.length >= 2) {
                switch(messageObj.command[0].toLowerCase()) {
                    case 'part':
                        broadcaster.remove(messageObj.command[1], socket);
                        break;
                    case 'join':
                        broadcaster.add(
                            messageObj.command[1], socket);
                        break;
                    default:
                        break;
                }
                client.send.apply(client, messageObj.command);
            }
        });

        socket.on('reconnect', function () {
            console.log('reconnect');
            client.disconnect('reconnect not allowed');
        });

        socket.on('disconnect', function (test) {
            connected--;
            console.log('disconnect ' + test);
            console.log('currently connected: ' + connected);
            broadcaster.quit(socket);
            client.disconnect('socket disconnected');
        });

        socket.on('close', function () {
            console.log('close');
            client.disconnect('socket closed');
        });
    };

    return function(broadcasterInject, persistenceInject, imageProcessorInject, serverInject) {
        if (broadcasterInject && persistenceInject && imageProcessorInject && serverInject) {
            broadcaster = broadcasterInject;
            persistenceHandler = persistenceInject;
            imageProcessor = imageProcessorInject;
            server = serverInject;
        }
        else {
            throw new Error('dependencies missing!');
        }

        io = require('socket.io')(server.getServer());

        io.on('connection', addListeners);
    };
}());
