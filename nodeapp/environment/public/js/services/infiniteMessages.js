/**
 *
 * Created by tsarpf on 5/6/15.
 */


angular.module('tsatter').factory('infiniteMessages', ['$http', '$timeout', function($http, $timeout) {
    var rev = 0;
    var linkOffset = 0;
    return function(obj) {
        function getData(index, count, success) {
            var timedOutGetData = function(index, count, success) {
                return function() {
                    getData(index, count, success);
                };
            };
            if(obj.channel === null) {
                console.log('called before initialized!');
                //$timeout(getData(index, count, success), 1000);
                $timeout(timedOutGetData(index, count, success));
                return;
            }

            var params = {
                channel: obj.channel,
                //Subtract 1 because the ui.scroll library uses a weird indexing that starts from 1
                index: index - 1,
                count: count
            };

            if(obj.linkOffset) {
                //We want to center the message so add bufferSize / 2
                params.linkOffset = obj.linkOffset; //+ obj.bufferSize / 2;
                if(params.linkOffset < 0) {
                    params.linkOffset = 0;
                }
            }

            $http.get('/backlog/', {
                params: params
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

        function revision() {
            return rev;
        }

        function incrementRevision() {
            rev++;
        }

        function addMessage(msg) {

        }

        return {
            get: getData,
            incrementRevision: incrementRevision,
            revision: revision,
            addMessage: addMessage
        }
    }
}]);
