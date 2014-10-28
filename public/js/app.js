var app = angular.module('tsatter', []);
app.controller('ChatController', ['$scope', 'socket', function($scope, socket) {
    this.messages = [];
    socket.on($scope.roomName, function(data) {
        this.messages.push(data);
    });
    this.addOne = function() {
        this.test++;
    };
    this.sendMsg = function (msg) {
        socket.emit($scope.roomName, msg);
    };
}]);

app.directive('tsChat', function() {
    return {
        restrict: "E",
        templateUrl: '/partials/chat',
        link: function(scope, element, attrs) {
            scope.roomName=attrs.roomName;
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
            socket.emit(channel, dta, function() {
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
