/**
 * Created by Tsarpf on 2/13/15.
 */
angular.module('tsatter').factory('command', function($rootScope, socket) {
    return {
        commandHandler: function(message) {
            console.log('got command');
            console.log(message);
            var message = message.substring(1); //Lose the leading /
            var words = message.split(' ');

            socket.send({commandAndArgs: words});
        }
    }
});
