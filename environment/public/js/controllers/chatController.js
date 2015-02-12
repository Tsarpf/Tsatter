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
        $scope.messages.push({nick: 'server', message: ' Welcome to channel ' + channelName + '\''});

        $scope.$on(channelName, handler);
    };

    function handler(event, data) {
        switch(data.command) {
            case 'PRIVMSG':
                $scope.receiveMessage(data);
                break;
            case 'JOIN':
                $scope.userJoin(data);
                break;
            case 'NAMES':
                console.log(data);
                $scope.names(data);
                break;
            default:
                console.log('no handler for: ' + data.command);
                console.log(data);
                break;
        }
    }

    $scope.names = function(data) {
        $scope.users = Object.keys(data.nicks);
    }
    $scope.userJoin = function(data) {
        $scope.users.push(data.nick);
    };

    $scope.receiveMessage = function(data) {
        $scope.messages.push(data.message);
    };

    this.sendMessage = function() {
        console.log('send message');
       var obj = {channel: $scope.channelName, message: $scope.message}
        socket.emit('privmsg', obj);
        $scope.messages.push({message: $scope.message, nick: $rootScope.vars.nickname});
        $scope.message = '';
    };

    this.first = true;
    this.clicked=function() {
        console.log('jou');
        if(this.first) {
            $scope.message = '';
            this.first = false;
        }
    }
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
