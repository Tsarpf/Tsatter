angular.module('tsatter').factory('socket', ['$rootScope', '$timeout', function($rootScope, $timeout) {
    var address = location.host;
    var socket;

    var start =  function() {
        socket = io(address);
        socket.on('message', function (message) {
            $rootScope.$apply(function () {
                $rootScope.$broadcast(message.command, message);
            });
        });

        socket.on('disconnect', function () {
            //alert('Disconnected!');
            location.reload();
        });
        socket.on('reconnect', function () {
            //alert('Disconnected!');
            location.reload();
        });
    };

    var channels = [];

    $timeout(start);

    return {
        listenChannel: function(channel) {
            if(channels.indexOf(channel) < 0) {
                channels.push(channel);
            }
            else {
                socket.removeAllListeners(channel);
            }
            socket.on(channel, function(data) {
                $rootScope.$apply(function() {
                    $rootScope.$broadcast(channel, data);
                });
            });
        },

        getChannels: function() { return channels; },

        emit: function(event, data, callback) {
            socket.emit(event, data, function() {
                var args = arguments;
                $rootScope.$apply(function() {
                    if(callback) {
                        callback.apply(socket, args);
                    }
                });
            });
        },

        send: function(object) {
            socket.send(object);
        }
    };
}]);
