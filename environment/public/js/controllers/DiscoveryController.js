/**
 * Created by Tsarpf on 2/14/15.
 */

angular.module('tsatter').controller("DiscoveryController", ['$scope', '$http', 'command', function($scope, $http, command) {
    $scope.results = [];
    $scope.loaded = false;
    $scope.infiniteSize = 12;
    $scope.bottomLocation = 0;
    $scope.reachedBottom = false;
    $scope.getContent = function(from, to, success) {
        $http.get('/activity/', {
           params: {
               from: from,
               to: to
           }
        }).
        success(success).
        error(function(data, status, headers, config) {
            console.log('error!');
        });
    };

    $scope.infiniteScrollDown = function() {
        console.log('moi');
        if($scope.reachedBottom) {
            return;
        }
        var from = $scope.bottomLocation;
        var to = from + $scope.infiniteSize;
        $scope.getContent(from, to, function(data, status, headers, config) {
            $scope.results = $scope.results.concat(data);
            $scope.bottomLocation += data.length;
            if(data.length < to - from - 1) {
                $scope.reachedBottom = true;
            }
        });
    };

    $scope.refresh = function() {
        console.log('refresh');
        $scope.reachedBottom = false;
        $scope.bottomLocation = 0;
        $scope.getContent(0, $scope.infiniteSize, function(data, status, headers, config) {
            $scope.results = data;
            $scope.bottomLocation += data.length;
            if(data.length < to - from - 1) {
                $scope.reachedBottom = true;
            }
        });
    };

    $scope.joinChannel = function(channel) {
        command.send('join ' + channel);
        $scope.$emit('JOIN', {args: [channel]});
    };

    $scope.refresh();
}]);
