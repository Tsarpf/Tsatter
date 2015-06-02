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
        io,
        spamProtect;

    var connected = 0;

    var urlRegex = /((((https?|ftp):\/\/)|www\.)(([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)|(([a-zA-Z0-9\-]+\.)*[a-zA-Z0-9\-]+\.(aero|asia|biz|cat|com|coop|info|int|jobs|mobi|museum|name|net|org|post|pro|tel|travel|xxx|edu|gov|mil|[a-zA-Z][a-zA-Z]))|([a-z]+[0-9]*))(:[0-9]+)?((\/|\?)[^ "]*[^ ,;\.:">)])?)|(spotify:[^ ]+:[^ ]+)/g;

    var getUrls = function(message) {
        return message.match(urlRegex);
    };

    var addListeners = function(socket) {
        connected++;
        console.log('new connection, currently connected: ' + connected);
        var ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address.address;
        console.log('connected ip: ' + ip);
        //Todo: real ip blocking system
        if(ip === '83.203.75.235') {
            console.log('closed ip ' + ip);
            socket.disconnect();
            return;
        }
        console.log('not closed: ' + ip);

        function denied(message, msgObj) {
            console.log('denied message');
            console.log(msgObj);
            console.log('cooldown etc:');
            console.log((message.cooldown - Date.now()) / 1000);
            socket.send({command: 'cooldown', cooldown: message.cooldown});
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
            var spamState = spamProtect.isSpamming(socket);
            if(spamState) {
                return denied(spamState, msg);
            }

            broadcaster.add(msg.channel, socket);
            client.join(msg.channel);
        });

        socket.on('privmsg', function (msg, fn) {
            var spamState = spamProtect.isSpamming(socket);
            if(spamState !== null) {
                fn(false);
                return denied(spamState, msg);
            }
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
                    urls = urls.slice(0,3);
                    imageProcessor.processUrls(urls, msg.channel, idx);
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
            var checkSpam = true;
            if(messageObj.command && messageObj.command.length >= 2) {
                switch(messageObj.command[0].toLowerCase()) {
                    case 'part':
                        broadcaster.remove(messageObj.command[1], socket);
                        checkSpam = false;
                        break;
                    case 'join':
                        broadcaster.add(messageObj.command[1], socket);
                        break;
                    default:
                        break;
                }
                if(checkSpam) {
                    var spamState = spamProtect.isSpamming(socket);
                    if(spamState) {
                        return denied(spamState, messageObj);
                    }
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

    return function(broadcasterInject, persistenceInject, imageProcessorInject, serverInject, spamProtectInject) {
        if (broadcasterInject && persistenceInject && imageProcessorInject && serverInject && spamProtectInject) {
            broadcaster = broadcasterInject;
            persistenceHandler = persistenceInject;
            imageProcessor = imageProcessorInject;
            server = serverInject;
            spamProtect = spamProtectInject;
        }
        else {
            throw new Error('dependencies missing!');
        }

        io = require('socket.io')(server.getServer());

        io.on('connection', addListeners);
    };
}());
