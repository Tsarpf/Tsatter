/**
 * Created by Tsarpf on 2/13/15.
 */
angular.module('tsatter').factory('command', function($rootScope, socket) {
    return {
        send: function(message) {
            if(typeof message === 'string') {
               message = message.split(' ');
            }

            socket.send({command: message});
        }
    }
});
