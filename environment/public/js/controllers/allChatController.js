angular.module('tsatter').controller('AllChatController', ['$timeout', '$rootScope', '$scope', 'socket', function($timeout, $rootScope, $scope, socket) {

    $timeout(function(){
         $scope.vars = $rootScope.vars;
    });

    $scope.$on('rpl_welcome', function(event, data) {
        console.log('connected');
        //console.log(data);
        $scope.userChannels.push('#ses');
        $rootScope.vars.nickname = data.nick;
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
            channelName = $scope.joinThisChannel;
        }
        $scope.userChannels.push(String($scope.joinThisChannel));
        $scope.joinThisChannel = "";
    };

    //Handle adding stuff to allRooms?
}]);
