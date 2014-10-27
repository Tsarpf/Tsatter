var app = angular.module('tsatter', []);

//app.controller('ChatController', function() {
app.controller('ChatController', ['$scope', function($scope) {
    $scope.test = 1;
}]);

app.directive('tsChat', function() {
    return {
        restrict: "E",
        templateUrl: '/partials/chat'
    };
});
