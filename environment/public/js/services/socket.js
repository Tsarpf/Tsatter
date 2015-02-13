angular.module('tsatter').factory('socket', function($rootScope) {
    var address = location.host;
    var socket = io(address);
    socket.on('message', function(message) {
        console.log(message);
        $rootScope.$apply(function() {
            $rootScope.$broadcast(message.command, message);
        });
    });

    socket.on('disconnect', function() {
        alert('Disconnected!');
        location.reload();
    });
    socket.on('reconnect', function() {
        alert('Disconnected!');
        location.reload();
    });

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
