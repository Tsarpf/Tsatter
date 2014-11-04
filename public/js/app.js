var app = angular.module('tsatter', ['ngAnimate']);
app.controller('ChatController', ['$timeout', '$anchorScroll', '$location', '$scope', 'socket', function($timeout, $anchorScroll, $location, $scope, socket) {
    //$scope.msgDiv = {};
    $scope.messages = [];
    $scope.msg = "Enter message";
    socket.on('message', function(data) {
        console.log("why was I called");
        console.log(data);
    });

    socket.on('joinSuccess', function(obj) {
        //console.log('join success');
        //console.log(obj);
        if(obj.room === $scope.roomName) {
            //console.log('moi');
            $scope.messages = $scope.messages.concat(obj.messages);
            //console.log($scope.messages);
        }
        else {
            //console.log(obj.room + ' isnt ' + $scope.roomName);
        }
    });

    //we have to do this in a timeout so that the directive is initialized 
    $timeout(function(){
        joinRoom($scope.roomName);
    });
    var joinRoom=function(roomName) {
        $scope.messages.push({user: 'server', message: "Welcome to room '" + roomName + "'"});
        console.log('joining: ' + roomName);
        socket.emit('join', {room: roomName});
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

app.controller('AllChatController', ['$scope', 'socket', function($scope, socket) {
    $scope.roomNames = ['test'];    
    $scope.joinThisChannel = "Create a new channel";
    this.clicked=function() {
        $scope.joinThisChannel = "";
    }
    this.join=function() {
        //console.log('jointhischannel: ' + $scope.joinThisChannel);
        //socket.emit('join', {room: $scope.joinThisChannel});
        $scope.roomNames.push(String($scope.joinThisChannel));
        $scope.joinThisChannel = "";
    }


}]);

app.controller("UserHeaderController", ['$scope', 'socket', function($scope, socket) {
    $scope.loggedIn = false;
    $scope.loginState = "";
    $scope.login = function() {
       //console.log('login');
        var obj = {};
        obj.username = $scope.username;
        obj.password = $scope.password;
        $scope.loginState = "Logging in... please wait";

        socket.emit('login', obj);
    };
    $scope.register = function() {
       console.log('register');
       var obj = {
           username: $scope.username,
           password: $scope.password
       }
       $scope.loginState = "Registering... please wait";
       socket.emit('register', obj);
    };
    $scope.logout = function() {
        $scope.loginState = "";
        $scope.loggedIn = false;
        socket.emit('logout', {});
    };
    socket.on('loginSuccess', function(data) {
        $scope.loginState = "Logged in!";
        $scope.loggedIn = true;
    });

    socket.on('loginFail', function(data) {
        $scope.loginState = "Login failed: " + data.reason.toString();
        $scope.loggedIn = false;
    });

    socket.on('registerSuccess', function(data) {
        $scope.loginState = "Registered!";
    });

    socket.on('registerFail', function(data) {
        $scope.loginState = "Register failed: " + data.reason.toString();
    });
}]);

app.directive('tsUserHeader', function() {
    return {
        restrict: "E",
        templateUrl: '/partials/userheader',
        link: function(scope, element, attrs) {

        }
    };
});

app.directive('tsChat', function($timeout) {
    return {
        restrict: "E",
        templateUrl: '/partials/chat',
        link: function(scope, element, attrs) {
            console.log("le attribute:");
            console.log(attrs.roomName);
            scope.roomName = attrs.roomName;
            $timeout(function() {
                scope.msgDiv = document.getElementById(attrs.roomName);
            });
        }
    };
});

app.directive('tsChatMessage', function($timeout) {
    return {
        restrict: "E",
        templateUrl: '/partials/chatmessage',
        link: function(scope, element, attrs) {
            if(scope.$last === true){
                $timeout(function() {
                    scope.$emit('msgRepeatFinished');
                    scope.lastElementScroll(attrs.id);
                });
            }
        }
    };
});

app.factory('socket', function($rootScope) {
    var socket = io('datisbox.net:7547');
    return {
        on: function(channel, callback) {
            socket.on(channel, function () {
                var args = arguments; 
                $rootScope.$apply(function() {
                    if(callback) {
                        callback.apply(socket, args);
                    }
                });
            });
        },
        emit: function(channel, data, callback) {
            socket.emit(channel, data, function() {
                var args = arguments; 
                $rootScope.$apply(function() {
                    if(callback) {
                        callback.apply(socket, args);
                    }
                });
            });
        }
    };
});
