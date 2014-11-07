angular.module('tsatter').controller('AllChatController', ['$rootScope', '$scope', 'socket', function($rootScope, $scope, socket) {
    $rootScope.vars = {
        loggedIn: false
    };
    $scope.roomNames = ['test'];    
    $scope.joinThisChannel = "Create a new channel";
    $scope.userRooms = [];
    this.clicked=function() {
        $scope.joinThisChannel = "";
    }
    this.join=function() {
        //console.log('jointhischannel: ' + $scope.joinThisChannel);
        //socket.emit('join', {room: $scope.joinThisChannel});
        $scope.roomNames.push(String($scope.joinThisChannel));
        $scope.joinThisChannel = "";
    }
    socket.emit('hello', {}, function(data) {
        console.log(data);
        $scope.userRooms = data.rooms;
        $rootScope.vars.loggedIn = data.loggedIn;
        $rootScope.vars.username = data.username;
    });
    socket.on('disconnect', function() {
        alert('Disconnected!');
    });

    socket.on('loginSuccess', function(data) {
        $scope.userRooms = data.rooms;
    });


}]);
