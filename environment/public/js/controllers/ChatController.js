angular.module('tsatter').controller('ChatController', ['$timeout', '$anchorScroll', '$location', '$scope', 'socket', '$rootScope', 'command', function($timeout, $anchorScroll, $location, $scope, socket, $rootScope, command) {
    //$scope.msgDiv = {};
    $scope.messages = [];
    $scope.users = [];
    $scope.msg = "Enter message";

    //we have to do this in a timeout so that the directive is initialized
    $timeout(function(){
        joinChannel($scope.channelName);
    });

    var joinChannel=function(channelName) {
        console.log('join:');
        console.log(channelName);
        addServerMessage('Welcome to the channel ' + channelName);

        $scope.$on(channelName, function(event, data) {
            if($scope.handler.hasOwnProperty(data.command)) {
                console.log('command called:');
                console.log(data.command);
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
        addServerMessage(data.nick + ' left the channel');
    };
    $scope.names = function(data) {
        $scope.users = Object.keys(data.nicks);
    };
    $scope.join = function(data) {
        $scope.users.push(data.nick);
        addServerMessage(data.nick + ' joined the channel');
    };

    $scope.privmsg = function(data) {
        console.log(data);
        addMessage(data.args[1], data.nick);
    };

    $scope.handler = {
        PRIVMSG: $scope.privmsg,
        JOIN: $scope.join,
        NAMES: $scope.names,
        PART: $scope.part,
    };

    var addServerMessage = function(message) {
        addMessage(message, 'server');
    };

    var addMessage = function(message, nick) {
        $scope.messages.push({message: message, nick: nick, timestamp: getTimestamp()});
    };

    var getTimestamp = function() {
        var date = new Date(Date.now());
        return {
            h: date.getHours(),
            m: date.getMinutes(),
            s: date.getSeconds(),
            ms: date.getMilliseconds()
        };
    };

    var customCommandHandlers = {
        op: op,
        nick: nick
    };

    function nick(args) {
        command.send(['nick', args[1]]);
    }

    function op(args) {
        command.send(['mode', $scope.channelName, '+o', args[1]]);
    }


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
            var obj = {channel: $scope.channelName, message: message}
            socket.emit('privmsg', obj);
            addMessage(message, $rootScope.vars.nickname);
        }
    };

    this.first = true;
    this.clicked=function() {
        if(this.first) {
            $scope.message = '';
            this.first = false;
        }
    };

    /*
    var bottomScroll = true;
    $scope.lastElementScroll=function(elementId) {
        if(bottomScroll) {
            $scope.msgDiv.scrollTop = $scope.msgDiv.scrollHeight;
        }
    };

    $scope.$on('msgRepeatFinished', function(event) {
    });
    */
}]);
