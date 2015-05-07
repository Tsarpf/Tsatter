/**
 *
 * Created by tsarpf on 5/6/15.
 */


angular.module('tsatter').factory('infiniteMessages', ['$http', '$timeout', function($http, $timeout) {
    return function(obj) {
        console.log('ahoy from infinitemessages thing');
        console.log(obj);

        var throttleTime = 1000;
        var lastRun = 0;
        function getData(index, count, success) {
            var now = Date.now();
            if(now - lastRun < throttleTime) {
                return;
            }
            lastRun = now;
            console.log('ran funkshun');

            if(obj.channel === null) {
                console.log('called before initialized!');
                var timedOutGetData = function() {
                    getData(index, count, success);
                };
                //$timeout(getData(index, count, success), 1000);
                $timeout(timedOutGetData, 1000);
                return success([]);
            }
            $http.get('/backlog/', {
                params: {
                    channel: obj.channel,
                    from: index,
                    to: index + count
                }
            }).
                success(function(data, status, headers, config) {
                    success(data);
                }).
                error(function(data, status, headers, config) {
                    console.log('error in infinite-messages provider!');
                })
        }

        return {
            get: getData
        }
    }
}]);
