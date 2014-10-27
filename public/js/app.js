var app = angular.module('tsatter', []);

app.controller('ChatController', function() {
    this.test = 1;
});

app.directive('tsChat', function() {
    return {
        templateUrl: '/partials/chat'
    };
});
