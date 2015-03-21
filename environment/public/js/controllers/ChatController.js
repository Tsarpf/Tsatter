angular.module('tsatter').controller('ChatController', [
    '$timeout',
    '$anchorScroll',
    '$location',
    '$scope',
    'socket',
    '$rootScope',
    'command',
    'focus',
    '$http',
    function($timeout, $anchorScroll, $location, $scope, socket, $rootScope, command, focus, $http) {
    $scope.messages = [];
    $scope.users = [];
    $scope.mediaList = [];
    $scope.glued = true;
    $scope.mediaGlued = true;
    $scope.nick = '';
    $scope.editingNick = false;
    $scope.infiniteBottomLocation = Number.MAX_VALUE;
    $scope.infiniteTopLocation = 0;
    $scope.infiniteStep = 30;
    $scope.infiniteReachedTop = false;
    $scope.infiniteReachedBottom = false;

    //we have to do this in a timeout so that the directive is initialized
    $timeout(function(){
        joinChannel($scope.channelName);
        $scope.nick = $rootScope.vars.nickname;
        $scope.getBacklog();
    });

    $scope.getMessagesFromServer = function(channel, from, to, success, error) {
        $http.get('/backlog/', {
            params: {
                channel: channel,
                from: from,
                to: to
            }
        }).
            success(success).
            error(error);
    };
    var errorLogger = function(data, status, headers, config) {
        console.log('error!');
    };

    $scope.getBacklog = function() {
        var hash = $location.hash();
        var from = -$scope.infiniteStep - 1;
        var to = -1;
        if(hash) {
            console.log('got hash: ' + hash);
            var targetChannel = '#' + hash.split('__')[0];
            if(targetChannel === $scope.channelName) {
                var target = parseInt(hash.split('__')[1]);

                to = parseInt(target + $scope.infiniteStep / 2);
                from = parseInt(target - $scope.infiniteStep / 2);

                //If we're closer than infiniteStep/2 to 0, get more messages after the targeted message
                if(from <= 0) {
                    to += (-from);
                    from = 0;
                    $scope.infiniteReachedTop = true;
                }

                $scope.glued = false;
                $scope.infiniteBottomLocation = to;
                $scope.infiniteTopLocation = from;
            }
        }
        $scope.getMessagesFromServer($scope.channelName, from, to,
        function(data, status, headers, config) {
            for (var i = 0; i < data.length; i++) {
                $scope.addBackendMessage(data[i]);
            }
            $timeout(function() {
                $anchorScroll();
                var str = '#' + hash;
                //TODO: use ngClass and don't do dom manipulation from here
                $(str).addClass('single-message-highlighted');
            });
            if(data.length === 0 && $location.hash().length > 1) {
                console.log('message not found. do a flash message here?');
                $location.hash('');
                $scope.getBacklog();
                $scope.glued = true;
            }

            if(data.length > 0) {
                $scope.infiniteBottomLocation = data[i - 1].idx;
                $scope.infiniteTopLocation = data[0].idx;
            }

            if(data.length < $scope.infiniteStep - 1) {
                $scope.infiniteReachedTop = true;
                $scope.infiniteReachedBottom = true;
            }

        }, errorLogger);
    };
    $scope.infiniteScrollDown = function() {
        //numbers go up since the last message has the highest index
        console.log('go down');

        console.log('bottom at: ' + $scope.infiniteBottomLocation);


        if($scope.infiniteReachedBottom) {
            console.log('already reached bottom');
            return;
        }

        $scope.getMessagesFromServer($scope.channelName, $scope.infiniteBottomLocation, $scope.infiniteBottomLocation + $scope.infiniteStep,
            function(data, status, headers, config) {
                if(data.length === 0) {
                    $scope.infiniteReachedBottom = true;
                    return;
                }

                if(data.length < $scope.infiniteStep - 1) {
                    $scope.infiniteReachedBottom = true;
                }

                $scope.infiniteBottomLocation += data.length;

                for(var i = 0; i < data.length; i++) {
                    $scope.addBackendMessage(data[i]);
                }
            }, errorLogger);
    };
    $scope.infiniteScrollUp = function() {
        //numbers go down since the oldest message has the smallest index 0
        console.log('go up');

        if($scope.infiniteReachedTop) {
            console.log('already reached top');
            return;
        }

        if($scope.infiniteTopLocation === 0) {
            $scope.infiniteReachedTop = true;
            return;
        }

        var top = $scope.infiniteTopLocation;
        var topAfterDecrement = top - $scope.infiniteStep;

        if(topAfterDecrement < 0) {
            topAfterDecrement = 0;
            $scope.infiniteReachedTop = true;
        }

        console.log('goin up yayfdasf');
        console.log(top);
        console.log(topAfterDecrement);

        $scope.getMessagesFromServer($scope.channelName, topAfterDecrement, top,
            function(data, status, headers, config) {
                if(data.length === 0) {
                    $scope.infiniteReachedTop = true;
                    return;
                }

                if(data.length < $scope.infiniteStep - 1) {
                    $scope.infiniteReachedTop  = true;
                }

                $scope.infiniteTopLocation -= data.length;
                if($scope.infiniteTopLocation < 0) {
                    $scope.infiniteTopLocation = 0;
                }

                for(var i = data.length - 1; i >= 0; i--) {
                    $scope.addBackendMessage(data[i], true);
                }
            }, errorLogger);

    };

    //Not sure yet if this is really a robust solution. It seems a bit dangerous
    $scope.mediaCount = 0;

    var joinChannel=function(channelName) {
        console.log('join:');
        console.log(channelName);
        //$scope.addServerMessage('Welcome to the channel ' + channelName);

        $scope.$on(channelName, function(event, data) {
            if($scope.handler.hasOwnProperty(data.command)) {
                $scope.handler[data.command](data);
            }
            else {
                console.log('no handler for:');
                console.log(event);
                console.log(data);
            }
        });

        command.send('names ' + channelName);

    };

    $scope.part = function(data) {
        var idx = $scope.users.indexOf(data.nick);
        if(idx < 0) return;
        $scope.users.splice(idx, 1);
        if($scope.infiniteReachedBottom) {
            $scope.addServerMessage(data.nick + ' left the channel');
        }
    };
    $scope.names = function(data) {
        $scope.users = Object.keys(data.nicks);
    };
    $scope.join = function(data) {
        $scope.users.push(data.nick);
        if($scope.infiniteReachedBottom) {
            $scope.addServerMessage(data.nick + ' joined the channel');
        }
    };
    $scope.privmsg = function(data) {
        if($scope.infiniteReachedBottom) {
            $scope.addMessage(data.args[1], data.nick);
        }
    };
    $scope.nick = function(data) {
        console.log('got nick');
        console.log(data);
        if(data.nick === $scope.nick) {
            $scope.nick = data.args[0];
        }
        var idx = $scope.users.indexOf(data.nick);
        $scope.users.splice(idx, 1, data.args[0]);
        if($scope.infiniteReachedBottom) {
            $scope.addServerMessage(data.nick + ' is now known as ' + data.args[0]);
        }
    };
    $scope.quit = function(data) {
        console.log('got quit');
        var idx = $scope.users.indexOf(data.nick);
        if(idx < 0) return;
        $scope.users.splice(idx, 1);
        if($scope.infiniteReachedBottom) {
            $scope.addServerMessage(data.nick + ' quit');
        }
    };
    $scope.errnick = function(data) {
        if($scope.infiniteReachedBottom) {
            $scope.addServerMessage(data.args[data.args.length - 1]);
        }
    };
    $scope.nicknameinuse = function(data) {
        if($scope.infiniteReachedBottom) {
            $scope.addServerMessage(data.args[data.args.length - 1]);
        }
    };
    $scope.handler = {
        PRIVMSG: $scope.privmsg,
        JOIN: $scope.join,
        NAMES: $scope.names,
        PART: $scope.part,
        QUIT: $scope.quit,
        NICK: $scope.nick,
        err_erroneusnickname: $scope.errnick, //its erroneous not erroneus :(
        err_nicknameinuse:  $scope.nicknameinuse
    };

    $scope.messagesIncrement = 30;
    $scope.messagesTo = -1;
    $scope.messagesFrom = $scope.messagesTo - $scope.messagesIncrement;


    $scope.addServerMessage = function(message) {
        $scope.addMessage(message, 'server');
    };

    $scope.addBackendMessage = function(message, top) {
        $scope.addMessage(message.message, message.nick, message.timestamp, message.idx, top);
    };
    $scope.addMessage = function(message, nick, timestamp, idx, top) {
        var imageUrls = getImageUrls(getUrls(message));

        for(var i = 0; i < imageUrls .length; i++) {
            var num = $scope.mediaCount++;
            $scope.mediaList.push({url: imageUrls[i], idx: num});
            message = message.replace(imageUrls[i], '[' + num + ']');
        }

        var obj = {message: message, nick: nick, timestamp: getTimestamp(timestamp), idx: idx};
        if(top) {
           $scope.messages.unshift(obj);
        }
        else {
            $scope.messages.push(obj);
        }
    };

    var getTimestamp = function(timestamp) {
        var date;
        if(!timestamp) {
           date = new Date(Date.now());
        }
        else {
            date = new Date(timestamp);
        }
        return date;
    };

    var customCommandHandlers = {
        op: op,
        part: part
    };

    //Maybe make these a bit more obvious
    function part() {
        command.send(['part', $scope.channelName]);
    }

    function op(args) {
        command.send(['mode', $scope.channelName, '+o', args[1]]);
    }

    $scope.editNick = function() {
        $scope.editingNick = true;
        focus('editNick');
    };

    $scope.stopEditingNick = function() {
        $scope.editingNick = false;
    };

    $scope.ownNickAreaSubmit = function() {
        console.log('called it');
        console.log($scope.nick);
        console.log($rootScope.vars.nickname);
        if($scope.nick !== $rootScope.vars.nickname) {
            command.send(['nick', $scope.nick]);
        }
        $scope.editingNick = false;
        $scope.nick = $rootScope.vars.nickname;
    };

    this.privmsg = function() {
        var message = $scope.message;
        $scope.message = '';

        //If a command
        if(message.indexOf('/') === 0) {
            if (message.indexOf('/') === 0) {
                message = message.substring(1); //Lose the leading /
            }
            var words = message.split(' ');

            var cmd = words[0].toLowerCase();
            if(customCommandHandlers.hasOwnProperty(cmd)) {
                customCommandHandlers[cmd](words);
            }
            else {
                command.send(message);
            }
        }
        else {
            console.log('send message');
            var obj = {channel: $scope.channelName, message: message};
            socket.emit('privmsg', obj);
            $scope.addMessage(message, $rootScope.vars.nickname);
        }
    };


    //Maybe the rest of these should be in a service?
    var urlRegex = /((((https?|ftp):\/\/)|www\.)(([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)|(([a-zA-Z0-9\-]+\.)*[a-zA-Z0-9\-]+\.(aero|asia|biz|cat|com|coop|info|int|jobs|mobi|museum|name|net|org|post|pro|tel|travel|xxx|edu|gov|mil|[a-zA-Z][a-zA-Z]))|([a-z]+[0-9]*))(:[0-9]+)?((\/|\?)[^ "]*[^ ,;\.:">)])?)|(spotify:[^ ]+:[^ ]+)/g;
    var getUrls = function(message) {
        return message.match(urlRegex);
    };
    var getImageUrls = function(urls) {
        var resultUrls = [];
        for(var idx in urls) {
           var url = urls[idx];

            if(endsWith(url.toLowerCase(), '.gifv') || endsWith(url.toLowerCase(), '.webm')) {
                url = url.substring(0, url.length - '.gifv'.length);
                url += ('.gif');
                resultUrls.push(url);
                continue;
            }

            for(var type in imageTypes) {
                if(endsWith(url.toLowerCase(), imageTypes[type])) {
                    resultUrls.push(url);
                    break;
                }
            }
        }

        return resultUrls;
    };
    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }
    var imageTypes = [
        '.jpg',
        '.jpeg',
        '.gif',
        '.png'
    ];
}]);
