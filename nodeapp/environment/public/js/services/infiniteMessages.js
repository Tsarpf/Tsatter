/**
 *
 * Created by tsarpf on 5/6/15.
 */


angular.module('tsatter').factory('infiniteMessages', ['$q', '$http', '$timeout', function($q, $http, $timeout) {
    var rev = 0;

    var first = true;
    var bufferSize = 10;
    var index0 = null;
    var adapter;

    var EOF = null;
    var bottomLoaded = false;

    var cache = [];
    return function(obj) {
        adapter = obj.adapter;
        function getData(index, count, callback) {
            /*
            if(index + count > highestRequested) {
                highestRequested = index + count;
            }
            */
            var timedOutGetData = function(index, count, success) {
                return function() {
                    getData(index, count, success);
                };
            };
            if(obj.channel === null || obj.adapter === null) {
                console.log('called before initialized!');
                //$timeout(getData(index, count, success), 1000);
                $timeout(timedOutGetData(index, count, success));
                return;
            }

            if(first && obj.linkOffset === null) {
                //Then request the last x messages
                noLinkGetLast().then(function(data) {
                    callback(data);
                });
            }
            else if(first && obj.linkOffset >= 0) {
                first = false;
                //Get messages around linked message
                

                getMessages(obj.channel, obj.linkOffset - bufferSize / 2, bufferSize).then(function(data) {
                    insertCache(data);
                    for(var i = 0; i < data.length; i++) {
                        if(data[i].idx === obj.linkOffset) {
                            data[i].class = 'single-message-highlighted';
                            obj.currentlyHighlighted = data[i];
                        }
                    }
                });
            }

            /*
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
                    console.log('count: %d, data.length: %d', count, data.length);
                    console.log(data);
                    success(data);
                }).
                error(function(data, status, headers, config) {
                    console.log('error in infinite-messages provider!');
                })
            */
        }

        function getAroundLink(link) {
           var deferred = $q.defer();

            return deferred.promise;
        }

        function noLinkGetLast() {
            var deferred = $q.defer();

            first = false;
            getLastMessages(obj.channel).then(function(data) {
                EOF = data[data.length - 1].idx;
                bottomLoaded = true;
                insertCache(data);
                deferred.resolve(data);
            });

            return deferred.promise;
        }

        function insertCache(array) {
            for(var i = 0; i < array.length; i++) {
                cache[array[i].idx] = array[i];
            }
        }

        function revision() {
            return rev;
        }

        function incrementRevision() {
            rev++;
        }

        function addMessage(msg) {
            cache[msg.idx] = msg;
            if(bottomLoaded && EOF) {
                //Then we should immediately show the message at the bottom
                adapter.applyUpdates(bufferSize, [EOF, msg]);
            }
        }

        return {
            get: getData,
            incrementRevision: incrementRevision,
            revision: revision,
            addMessage: addMessage
        }
    };

    function getLastMessages(channel, count) {
        return $http.get('/backlog/', {
            params: {
                channel: channel,
                count: count
            }
        });
    }

    function getMessages(channel, index, count) {
        return $http.get('/backlog/', {
            params: {
                channel: channel,
                index: index,
                count: count
            }
        }) ;
    }
}]);
