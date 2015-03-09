/**
 * Created by Tsarpf on 2/14/15.
 */

angular.module('tsatter').controller("DiscoveryController", ['$scope', '$http', 'command', function($scope, $http, command) {
    $scope.results = [];
    $scope.loaded = false;
    $scope.getContent = function() {
        $http.get('/activity/', {
           params: {
               from: 0,
               to: 50
           }
        }).
            success(function(data, status, headers, config) {
                $scope.results = data;
            }).
            error(function(data, status, headers, config) {
            });
    };

    $scope.joinChannel = function(channel) {
        console.log('called it!');
        command.send('join ' + channel); //Join default channel while developing
    };

    $scope.getContent();
}]);
