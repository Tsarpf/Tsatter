var app = angular.module('tsatter', ['ngAnimate']);
app.controller('ChatController', ['$anchorScroll', '$location', '$scope', 'socket', function($anchorScroll, $location, $scope, socket) {
    $scope.messages = [];
    $scope.msg = "Enter message";
    socket.on('message', function(data) {
        console.log("why was I called");
        console.log(data);
    });
    var joinObj = {};
    socket.emit('join', joinObj, function() {
        console.log('join ' + $scope.roomName);
        socket.emit('join', {room: $scope.roomName})
        socket.on($scope.roomName, function(data) {
            console.log("une message");
            console.log(data);
            $scope.messages.push(data); 
        });
    });
    this.addOne = function() {
        this.test++;
    };
    this.sendMsg = function () {
        //socket.emit($scope.roomName, $scope.msg);
        var msgObj = {room: $scope.roomName, message: $scope.msg};
        socket.emit('message', msgObj);
        $scope.msg = "";
    };
    this.first = true;
    this.clicked=function() {
        if(this.first) {
            $scope.msg = "";
            this.first = false;
        }
    }

    var bottomScroll = true;
    $scope.$on('msgRepeatFinished', function(event) {
        if(bottomScroll) {
            var idx = $scope.messages.length - 1;
            var div = document.getElementById($scope.roomName + 'msg' + idx);
            div.scrollTop = div.scrollHeight;
        }
    });
}]);

app.controller('AllChatController', ['$scope', 'socket', function($scope, socket) {
    $scope.roomNames = [];    
    $scope.joinThisChannel = "Enter channel you want to join here";
    this.clicked=function() {
        $scope.joinThisChannel = "";
    }
    this.join=function() {
        console.log('jointhischannel: ' + $scope.joinThisChannel);
        socket.emit('join', {room: $scope.joinThisChannel});
        $scope.joinThisChannel = "";
    }
    socket.on('hello', function(obj) {
        console.log(obj);
        $scope.roomNames = [];    
        for(var room in obj.channels) {
            if(obj.channels.hasOwnProperty(room)){
                console.log(String(room));
                $scope.roomNames.push(String(room));
            }
        }
    });
}]);

app.directive('tsChat', function() {
    return {
        restrict: "E",
        templateUrl: '/partials/chat',
        link: function(scope, element, attrs) {
            console.log("le attribute:");
            console.log(attrs.roomName);
            scope.roomName = attrs.roomName;
        }
    };
});

app.directive('tsChatMessage', function($timeout) {
    return {
        restrict: "E",
        templateUrl: '/partials/chatmessage',
        link: function(scope, element, attrs) {
            if(scope.$last === true){
                $timeout(function() {
                    scope.$emit('msgRepeatFinished');
                });
            }
        }
    };
});

app.factory('socket', function($rootScope) {
    var socket = io('datisbox.net:7547');
    return {
        on: function(channel, callback) {
            socket.on(channel, function () {
                var args = arguments; 
                $rootScope.$apply(function() {
                    if(callback) {
                        callback.apply(socket, args);
                    }
                });
            });
        },
        emit: function(channel, data, callback) {
            socket.emit(channel, data, function() {
                var args = arguments; 
                $rootScope.$apply(function() {
                    if(callback) {
                        callback.apply(socket, args);
                    }
                });
            });
        }
    };
});
