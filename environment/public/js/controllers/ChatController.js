angular.module('tsatter').controller('ChatController', ['$timeout', '$anchorScroll', '$location', '$scope', 'socket', '$rootScope', 'command', 'focus', '$http', function($timeout, $anchorScroll, $location, $scope, socket, $rootScope, command, focus, $http) {
    $scope.messages = [];
    $scope.users = [];
    $scope.glued = true;
    $scope.nick = '';
    $scope.editingNick = false;

    //we have to do this in a timeout so that the directive is initialized
    $timeout(function(){
        joinChannel($scope.channelName);
        $scope.nick = $rootScope.vars.nickname;
        $scope.getBacklog();
    });

    var joinChannel=function(channelName) {
        console.log('join:');
        console.log(channelName);
        $scope.addServerMessage('Welcome to the channel ' + channelName);

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
        console.log(data);
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

    $scope.handler = {
        PRIVMSG: $scope.privmsg,
        JOIN: $scope.join,
        NAMES: $scope.names,
        PART: $scope.part,
        QUIT: $scope.quit,
        NICK: $scope.nick
    };

    $scope.messagesIncrement = 30;
    $scope.messagesTo = -1;
    $scope.messagesFrom = $scope.messagesTo - $scope.messagesIncrement;
    $scope.getBacklog = function() {
        $http.get('/backlog/', {
            params: {
                channel: $scope.channelName,
                from: $scope.messagesFrom,
                to: $scope.messagesTo
            }
        }).
            success(function(data, status, headers, config) {
                console.log('oh hi, backlog');
                console.log(data);

                for(var i = 0; i < data.length; i++) {
                    $scope.addMessage(data[i].message, data[i].nick, data[i].timestamp);
                }
                //$scope.messages = data;
            }).
            error(function(data, status, headers, config) {
                console.log('error!');
            });
    };

    $scope.addServerMessage = function(message) {
        $scope.addMessage(message, 'server');
    };

    $scope.addMessage = function(message, nick, timestamp) {
        $scope.messages.push({message: message, nick: nick, timestamp: getTimestamp(timestamp)});
    };

    var getTimestamp = function(timestamp) {
        var date;
        if(!timestamp) {
           date = new Date(Date.now());
        }
        else {
            date = new Date(timestamp);
            console.log(date);
        }
        return date;
    };

    var customCommandHandlers = {
        op: op,
        part: part
    };

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
}]);
