angular.module('tsatter').controller('ChatController', ['$timeout', '$anchorScroll', '$location', '$scope', 'socket', '$rootScope', function($timeout, $anchorScroll, $location, $scope, socket, $rootScope) {
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
        if(channelName.indexOf('#') < 0) {
            $scope.channelName= '#' + $scope.channelName;
            channelName = $scope.channelName;
        }
        socket.joinChannel(channelName);
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

    this.privmsg = function() {
        console.log('send message');
       var obj = {channel: $scope.channelName, message: $scope.message}
        socket.emit('privmsg', obj);
        addMessage($scope.message, $rootScope.vars.nickname);
        $scope.message = '';
    };

    this.first = true;
    this.clicked=function() {
        console.log('jou');
        if(this.first) {
            $scope.message = '';
            this.first = false;
        }
    };
    /*
    var firstJoin = true;

    socket.on('names', function(obj) {
        console.log('got names');
        if(obj.channel === $scope.roomName) {
            $scope.users = Object.keys(obj.nicks);
            console.log($scope.users);
        }
    });

    //we have to do this in a timeout so that the directive is initialized 
    $timeout(function(){
        if($scope.roomName.indexOf('#') < 0) {
            $scope.roomName = '#' + $scope.roomName;
        }
        joinRoom($scope.roomName);
    });
    var joinRoom=function(roomName) {
        socket.emit('join', {channel: $scope.roomName});
        $scope.messages.push({nick: 'server', message: " Welcome to room '" + roomName + "'"});
    };

    socket.on($scope.roomName, function(data) {
        //console.log(data);
        $scope.messages.push(data);
    });


    this.sendMsg = function () {
        var msgObj = {channel: $scope.roomName, message: $scope.msg};
        //console.log(msgObj);
        socket.emit('privmsg', msgObj);
        $scope.messages.push({message: $scope.msg, nick: 'meitsi'}); //TODO: replace with real nick
        $scope.msg = "";
    };


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
