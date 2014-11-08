angular.module('tsatter').controller('AllChatController', ['$rootScope', '$scope', 'socket', function($rootScope, $scope, socket) {
    $rootScope.vars = {
        loggedIn: false
    };
    $scope.joinThisChannel = "New channel name....";
    $scope.userRooms = [];
    $scope.allRooms = [];
    this.clicked=function() {
        $scope.joinThisChannel = "";
    }
    this.join=function() {
        $scope.userRooms.push(String($scope.joinThisChannel));
        $scope.joinThisChannel = "";
    }
    socket.emit('hello', {}, function(data) {
        console.log(data);
        $rootScope.vars.loggedIn = data.loggedIn;
        $rootScope.vars.username = data.username;
    });
    socket.on('disconnect', function() {
        alert('Disconnected!');
    });

    socket.on('loginSuccess', function(data) {
        $scope.userRooms = data.rooms;
    });

    socket.on('roomLists', function(data) {
        console.log('all rooms');

        $scope.allRooms = data.allRooms;
        console.log($scope.allRooms);
        console.log(data.allRooms);

        $scope.userRooms = data.userRooms;
        console.log($scope.userRooms);
        console.log(data.userRooms);
    })


}]);
