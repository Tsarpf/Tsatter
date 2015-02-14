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

    var channels = [];

    return {
        listenChannel: function(channel) {
            channels.push(channel);
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
});
