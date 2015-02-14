angular.module('tsatter').controller('AllChatController', ['$timeout', '$rootScope', '$scope', 'socket', 'command', function($timeout, $rootScope, $scope, socket, command) {

    $timeout(function(){
         $scope.vars = $rootScope.vars;
    });

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
    $scope.joinThisChannel = "";
    $scope.userChannels = [];
    $scope.allChannels = [];
    this.clicked=function() {
        $scope.joinThisChannel = "";
    };

    this.join=function() {
        if($scope.joinThisChannel.indexOf('#') != 0) {
            $scope.joinThisChannel = '#' + $scope.joinThisChannel ;
        }
        $scope.userChannels.push(String($scope.joinThisChannel));
        $scope.joinThisChannel = "";
    };
}]);
