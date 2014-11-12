var app = angular.module('tsatter', ['ngAnimate', 'ui.bootstrap']);

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

