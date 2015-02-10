//TODO: make login system a service

angular.module('tsatter').controller("UserHeaderController", ['$rootScope', '$scope', 'socket', function($rootScope, $scope, socket) {
    $scope.loginState = "";
    $scope.login = function() {
        var obj = {};
        obj.username = $scope.username;
        obj.password = $scope.password;
        $scope.loginState = "Logging in... please wait";

        socket.emit('login', obj, logStateChange);
    };
    $scope.logout = function() {
        socket.emit('logout', {}, logStateChange);
    };
    var logStateChange = function(data) {
        $scope.username = data.username;
        $rootScope.vars.username = data.username;
        $rootScope.vars.loggedIn = data.loggedIn;
        if(data.loggedIn){
            $scope.loginState = "Logged in!";
        }
        else{
            $scope.loginState = "Logged out!";
        }
    };

    /*
    socket.on('loginFail', function(data) {
        $scope.loginState = "Login failed: " + data.reason.toString();
        //$scope.loggedIn = false;
        $rootScope.vars.loggedIn = false;
    });

    $scope.register = function() {
       console.log('register');
       var obj = {
           username: $scope.username,
           password: $scope.password
       }
       $scope.loginState = "Registering... please wait";
       socket.emit('register', obj);
    };
    socket.on('registerSuccess', function(data) {
        $scope.loginState = "Registered!";
    });

    socket.on('registerFail', function(data) {
        var error = "";
        if(data.reason.message) error = data.reason.message;
        else error = data.reason;
        $scope.loginState = "Register failed: " + error;
    });
    */
}]);

