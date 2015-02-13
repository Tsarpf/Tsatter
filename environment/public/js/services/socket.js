angular.module('tsatter').factory('socket', function($rootScope) {
    var address = location.host;
    var socket = io(address);
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


angular.module('tsatter').factory('socket', function($rootScope) {
    var address = location.host;
    var socket = io(address);

    /*
    socket.on('message', function() {

    });
    */

    var listeners = {};
    return {

        joinChannel: function(channel) {
            //listeners[channelName] = listenersObj;
            socket.on(channel, function(data) {
                $rootScope.$apply(function() {
                    $rootScope.$broadcast(channel, data);
                });
            });
            socket.emit('join', {channel: channel});
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
