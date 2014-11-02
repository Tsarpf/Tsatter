var app = angular.module('tsatter', ['ngAnimate']);
app.controller('ChatController', ['$anchorScroll', '$location', '$scope', 'socket', function($anchorScroll, $location, $scope, socket) {
    $scope.messages = [];
    $scope.msg = "Enter message";
    /*
    socket.on($scope.roomName, function(data) {
        this.messages.push(data);
    });
    */
    socket.on('message', function(data) {
        console.log("got message");
        console.log(data);
        $scope.messages.push(data); 
    });
    socket.on('hello', function(data) {
        var joinObj = {room: $scope.roomName};
        socket.emit('join', joinObj);
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
            $location.hash($scope.roomName + 'msg' + idx);
            $anchorScroll();
        }
    });
}]);

app.directive('tsChat', function() {
    return {
        restrict: "E",
        templateUrl: '/partials/chat',
        link: function(scope, element, attrs) {
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
