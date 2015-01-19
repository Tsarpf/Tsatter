angular.module('tsatter').controller('ChatController', ['$timeout', '$anchorScroll', '$location', '$scope', 'socket', function($timeout, $anchorScroll, $location, $scope, socket) {
    //$scope.msgDiv = {};
    $scope.messages = [];
    $scope.users = [];
    $scope.msg = "Enter message";
    var firstJoin = true;
    socket.on('joinSuccess', function(obj) {
        if(obj.room === $scope.roomName && firstJoin) {
            firstJoin = false;
            $scope.messages = $scope.messages.concat(obj.messages);
            $scope.users = $scope.users.concat(obj.currentUsers);
            $timeout(function(){
                if(bottomScroll) {
                    $scope.msgDiv.scrollTop = $scope.msgDiv.scrollHeight;
                    console.log('scroll pls');
                }
            }, 500); //Ugly? //TODO: Yes it is. Doesn't work when user changes between existing channels
        }
        else {
            //console.log(obj.room + ' isnt ' + $scope.roomName);
        }
    });

    socket.on('joinedRoom', function(obj) {
        $scope.users.push(obj.username);
    });
    socket.on('leftRoom', function(obj) {
        var userIdx = $scope.users.indexOf(obj.username);
        $scope.users.splice(userIdx, 1);
    });

    //we have to do this in a timeout so that the directive is initialized 
    $timeout(function(){
        joinRoom($scope.roomName);
    });
    var joinRoom=function(roomName) {
        socket.emit('join', {room: $scope.roomName});
        $scope.messages.push({user: 'server', message: "Welcome to room '" + roomName + "'"});
        console.log('joining: ' + roomName);
        //socket.emit('join', {room: roomName});
        socket.on($scope.roomName, function(data) {
            //console.log(data);
            $scope.messages.push(data);
        });
    }


    this.addOne = function() {
        this.test++;
    };
    this.sendMsg = function () {
        var msgObj = {room: $scope.roomName, message: $scope.msg};
        //console.log(msgObj);
        socket.emit('message', msgObj);
        $scope.msg = "";
    };
    this.first = true;
    this.clicked=function() {
        if(this.first) {
            $scope.msg = "";
            this.first = false;
        }
    }

    var bottomScroll = true;
    $scope.lastElementScroll=function(elementId) {
        if(bottomScroll) {
            $scope.msgDiv.scrollTop = $scope.msgDiv.scrollHeight;
        }
    };

    $scope.$on('msgRepeatFinished', function(event) {
    });
}]);
