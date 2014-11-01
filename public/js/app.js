var app = angular.module('tsatter', []);
app.controller('ChatController', ['$scope', 'socket', function($scope, socket) {
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
}]);

app.directive('tsChat', function() {
    return {
        restrict: "E",
        templateUrl: '/partials/chat',
        link: function(scope, element, attrs) {
            scope.roomName='room' + attrs.roomName;
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
