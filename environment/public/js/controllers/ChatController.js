angular.module('tsatter').controller('ChatController', ['$timeout', '$anchorScroll', '$location', '$scope', 'socket', '$rootScope', 'command', 'focus', '$http', function($timeout, $anchorScroll, $location, $scope, socket, $rootScope, command, focus, $http) {
    $scope.messages = [];
    $scope.users = [];
    $scope.mediaList = [];
    $scope.glued = true;
    $scope.mediaGlued = true;
    $scope.nick = '';
    $scope.editingNick = false;
    $scope.infiniteBottomLocation = Number.MAX_VALUE;
    $scope.infiniteTopLocation = 0;

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
        $scope.getMessagesFromServer($scope.channelName, -31, -1, //Last 30 messages
        function(data, status, headers, config) {
            for (var i = 0; i < data.length; i++) {
                $scope.addMessage(data[i].message, data[i].nick, data[i].timestamp);
            }
        }, errorLogger);
    };
    $scope.infiniteScrollDown = function() {
        //numbers go up since the last message has the highest index
        console.log('go down');
    };
    $scope.infiniteScrollUp = function() {
        //numbers go down since the oldest message has the smallest index 0
        console.log('go up');
    };

    //Not sure yet if this is really a robust solution. It seems a bit dangerous
    $scope.mediaCount = 0;


    var joinChannel=function(channelName) {
        console.log('join:');
        console.log(channelName);
        $scope.addServerMessage('Welcome to the channel ' + channelName);

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
        $scope.addServerMessage(data.nick + ' left the channel');
    };
    $scope.names = function(data) {
        $scope.users = Object.keys(data.nicks);
    };
    $scope.join = function(data) {
        $scope.users.push(data.nick);
        $scope.addServerMessage(data.nick + ' joined the channel');
    };
    $scope.privmsg = function(data) {
        $scope.addMessage(data.args[1], data.nick);
    };
    $scope.nick = function(data) {
        console.log('got nick');
        console.log(data);
        if(data.nick === $scope.nick) {
            $scope.nick = data.args[0];
        }
        var idx = $scope.users.indexOf(data.nick);
        $scope.users.splice(idx, 1, data.args[0]);
        $scope.addServerMessage(data.nick + ' is now known as ' + data.args[0]);
    };
    $scope.quit = function(data) {
        console.log('got quit');
        var idx = $scope.users.indexOf(data.nick);
        if(idx < 0) return;
        $scope.users.splice(idx, 1);
        $scope.addServerMessage(data.nick + ' quit');
    };
    $scope.errnick = function(data) {
        $scope.addServerMessage(data.args[data.args.length - 1]);
    };
    $scope.handler = {
        PRIVMSG: $scope.privmsg,
        JOIN: $scope.join,
        NAMES: $scope.names,
        PART: $scope.part,
        QUIT: $scope.quit,
        NICK: $scope.nick,
        err_erroneusnickname: $scope.errnick //its erroneous not erroneus :(
    };

    $scope.messagesIncrement = 30;
    $scope.messagesTo = -1;
    $scope.messagesFrom = $scope.messagesTo - $scope.messagesIncrement;


    $scope.addServerMessage = function(message) {
        $scope.addMessage(message, 'server');
    };

    $scope.addMessage = function(message, nick, timestamp) {
        var imageUrls = getImageUrls(getUrls(message));

        for(var i = 0; i < imageUrls .length; i++) {
            var num = $scope.mediaCount++;
            $scope.mediaList.push({url: imageUrls[i], idx: num});
            message = message.replace(imageUrls[i], '[' + num + ']');
        }

        $scope.messages.push({message: message, nick: nick, timestamp: getTimestamp(timestamp)});
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
