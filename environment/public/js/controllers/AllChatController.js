angular.module('tsatter').controller('AllChatController', ['$timeout', '$rootScope', '$scope', 'socket', 'command', function($timeout, $rootScope, $scope, socket, command) {
    $scope.form = {
        channel: ''
    };
    $scope.userChannels = [];

    $scope.joinChannel = function() {
        var channel = $scope.form.channel;

        if(channel === '#' || channel.length === 0) {
            $scope.form.channel = 'Channel name should be at least 1 character long';
            return;
        }

        if(channel.indexOf(' ') >= 0) {
            $scope.form.channel = 'No spaces in channel names allowed';
            return;
        }

        if(channel.indexOf('#') !== 0) {
            channel = '#' + channel;
        }

        command.send('join ' + channel);
        $scope.form.channel = '';
    };
    $scope.$on('rpl_welcome', function(event, data) {
        console.log('connected');
        command.send('join #ses'); //Join default channel while developing
        $rootScope.vars.nickname = data.nick;
    });

    $scope.$on('NICK', function(event, data) {
        console.log('got nick change');
        var channels = socket.getChannels();
        for(var channel in channels) {
            if(channels.hasOwnProperty(channel)) {
                $scope.$broadcast(channels[channel], data);
            }
        }
    });

    $scope.$on('JOIN', function(event, data) {
        console.log('got join');
        console.log(data);
        var channel = data.args[0];
        if($scope.userChannels.indexOf(channel) < 0) {
            socket.listenChannel(channel);
            $scope.userChannels.push(channel);
        }
        else {
            console.log('got join for an existing channel?');
        }
    });

    $rootScope.vars = {
        loggedIn: false,
        nickname: 'anon'
    };
}]);
