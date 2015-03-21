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
        //command.send('join #ses'); //Join default channel while developing
        $rootScope.vars.nickname = data.nick;
    });

    $scope.$on('err_erroneusnickname', function(event, data) { //its erroneous not erroneus :(
        console.log('sinep');
        console.log(data);
        for(var i = 0; i < $scope.userChannels.length; i++) {
            if($scope.userChannels[i].active === true) {
                $scope.$broadcast($scope.userChannels[i].name, data);
            }
        }
    });

    $scope.$on('NICK', function(event, data) {
        console.log('got nick change');
        console.log(data.nick + ' ' + $rootScope.vars.nickname);
        if(data.nick === $rootScope.vars.nickname) {
            $rootScope.vars.nickname = data.args[0];
        }
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
        $scope.addChannel(channel);
    });
    $scope.addChannel = function(channel) {
        for(var i = 0; i < $scope.userChannels.length; i++) {
            if($scope.userChannels[i].name === channel) {
                $scope.userChannels[i].active = true;
                return;
            }
        }
        socket.listenChannel(channel);
        $scope.userChannels.push({name: channel, active: true});
    };

    $scope.leaveChannel = function(channel) {
        command.send(['part', channel]);
    };

    $scope.removeChannel = function(channel) {
        console.log('remove channel');
        console.log(channel);
        for(var i = 0; i < $scope.userChannels.length; i++) {
            if($scope.userChannels[i].name === channel) {
                $scope.userChannels.splice(i,1);
                break;
            }
        }
    };

    $scope.$on('PART', function(event, data) {
        $scope.removeChannel(data.args[0]);
    });

    $scope.$on('QUIT', function(event, data) {
        console.log('got quit');
        var channels = socket.getChannels();
        for(var channel in channels) {
            if(channels.hasOwnProperty(channel)) {
                $scope.$broadcast(channels[channel], data);
            }
        }
    });

    $rootScope.vars = {
        loggedIn: false,
        nickname: 'anon'
    };
}]);
