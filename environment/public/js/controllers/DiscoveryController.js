/**
 * Created by Tsarpf on 2/14/15.
 */

angular.module('tsatter').controller("DiscoveryController", ['$scope', '$http', function($scope, $http) {
    $scope.results = [];
    function getContent() {
        $http.get('/activity/').
            success(function(data, status, headers, config) {
                $scope.results = data;
                console.log(data);
                console.log(status);
                console.log(headers);
                console.log(config);
            }).
            error(function(data, status, headers, config) {
                console.log(data);
                console.log(status);
                console.log(headers);
                console.log(config);
            });
    }

    getContent();
}]);
