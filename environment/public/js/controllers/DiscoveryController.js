/**
 * Created by Tsarpf on 2/14/15.
 */

angular.module('tsatter').controller("DiscoveryController", ['$scope', '$http', function($scope, $http) {
    $scope.results = [];
    $scope.loaded = false;
    function getContent() {
        $http.get('/activity/').
            success(function(data, status, headers, config) {
                if(data.length > 0 && !$scope.loaded) {
                    console.log('loaded!');
                    $scope.loaded = true;
                }
                console.log('ses');
                console.log(data);
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
