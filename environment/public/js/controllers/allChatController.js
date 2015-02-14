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
        $scope.userChannels.push(String($scope.joinThisChannel));
        $scope.joinThisChannel = "";
    };
    /*
    socket.emit('hello', {}, function(data) {
        console.log(data);
        $rootScope.vars.loggedIn = data.loggedIn;
        $rootScope.vars.username = data.username;
    });
    socket.on('disconnect', function() {
        alert('Disconnected!');
        location.reload();
    });

    socket.on('loginSuccess', function(data) {
        $scope.userRooms = data.rooms;
    });

    socket.on('roomLists', function(data) {

        console.log('all rooms');
        $scope.allRooms = data.allRooms;
        console.log($scope.allRooms);
        console.log(data.allRooms);

        console.log('userRooms');
        $scope.userRooms = data.userRooms;
        console.log($scope.userRooms);
        console.log(data.userRooms);
    })
     */


}]);
