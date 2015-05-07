/**
 *
 * Created by tsarpf on 5/6/15.
 */


angular.module('tsatter').factory('infiniteMessages', ['$http', '$timeout', function($http, $timeout) {
    var runTimes = 0;
    return function(obj) {
        console.log('ahoy from infinitemessages thing');
        console.log(obj);

        var throttleTime = 1000;
        var lastRun = 0;
        function getData(index, count, success) {
            var from = index - 1;
            var to = index + count - 1;
            console.log('index: %d, count: %d', index, count);
            console.log('from: %d, to: %d', from, to);
            if(index < 0 && to <= 0) {
                return success([]);
            }
            if(index < 0 && to > 0) {
                from = 0;
            }
            var timedOutGetData = function(index, count, success) {
                return function() {
                    getData(index, count, success);
                };
            };
            if(obj.channel === null) {
                console.log('called before initialized!');
                //$timeout(getData(index, count, success), 1000);
                $timeout(timedOutGetData(index, count, success), 1000);
                return;
                //return success([]);
            }
            $http.get('/backlog/', {
                params: {
                    channel: obj.channel,
                    from: from,
                    to: to
                }
            }).
                success(function(data, status, headers, config) {
                    console.log('got backlog data');
                    console.log(data.length);
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
