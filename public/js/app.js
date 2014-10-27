var app = angular.module('tsatter', []);

//app.controller('ChatController', function() {
app.controller('ChatController', ['$scope', function($scope) {
    this.test = 1;
    this.addOne = function() {
        this.test++;
    }
}]);

app.directive('tsChat', function() {
    return {
        restrict: "E",
        templateUrl: '/partials/chat',
        link: function(scope, element, attrs) {
            console.log(attrs);
            scope.roomName=attrs.roomName;
            scope.test = parseInt(attrs.roomName);
            console.log(scope.roomName);
        }
    };
});
