/**
 *
 * Created by tsarpf on 5/6/15.
 */


angular.module('tsatter').factory('infiniteMessages', ['$q', '$http', '$timeout', function($q, $http, $timeout) {
    return function(obj) {
        var rev = 0;
        var first = true;
        var initialized = false;
        var index0 = null;
        var EOF = null;
        var cache = [];

        function getData(index, count, callback) {
            var timedOutGetData = function(index, count, success) {
                return function() {
                    getData(index, count, success);
                };
            };
            if(obj.channel === null || obj.adapter === null) {
                //$timeout(getData(index, count, success), 1000);
                $timeout(timedOutGetData(index, count, callback));
                return;
            }

            //Ugly hack for checking if initial loads done
            if(!initialized) {
                if(index < 0) {
                    initialized = true;
                }
            }

            //weird 1-based indexing in the lib
            index--;

            if(first) {
                first = false;
                if(obj.linkOffset === null) {
                    //Then just request the last x messages
                    requestLastMessages(count).then(function(data) {
                        return callback(data);
                    });
                }
                else if(obj.linkOffset >= 0) {
                    //We want to show the linked message
                    getAroundLink(count).then(function(data) {
                        return callback(data);
                    }, function(err) {
                        //Linked message not found, show last x messages
                        console.log(err);
                        requestLastMessages(count).then(function(data) {
                            return callback(data);
                        })
                    })
                }
                else {
                    console.log('alert alert shouldnt happen!');
                }
                return;
            }

            var reqIndex = index0 + index;
            var reqCount = count;
            if(reqIndex + count <= 0) {
                return callback([]);
            }

            var remainder = 0;
            if(reqIndex < 0) {
                remainder = -reqIndex;
                reqCount = count - remainder;
                reqIndex = 0;
            }

            if(EOF !== null) {
                if(reqIndex > EOF) {
                    return callback([]);
                }

                var arr = [];
                var missing = false;
                for(var i = reqIndex; i < reqIndex + reqCount && i <= EOF; i++) {
                    if(cache[i]) {
                        arr.push(cache[i]);
                    }
                    else {
                        missing = true;
                        break;
                    }
                }
                if(!missing) {
                    return callback(arr);
                }
            }

            //If EOF not found or missing pieces, get them from backend
            requestMessages(reqIndex, reqCount).then(function(data) {
                callback(data);
            });
        }

        function addMessage(message) {
            if(EOF === null) {
               return; //we'll get it from backlog eventually
            }


            obj.adapter.applyUpdates(function(item, scope) {
                if(item.idx === EOF) {
                    EOF++;
                    message.idx = EOF;
                    cache[EOF] = message;
                    return [item, message];
                }
            });
        }

        function getAroundLink(count) {
            var deferred = $q.defer();

            var index = obj.linkOffset - count / 2;
            if(index < 0) {
                index = 0;
            }
            requestMessages(obj.channel, index, count).then(function(data) {
                if(data.length === 0) {
                    deferred.reject('did not find such message, showing last messages from channel');
                    return;
                }

                for(var i = 0; i < data.length; i++) {
                    if(data[i].idx === obj.linkOffset) {
                        data[i].class = 'single-message-highlighted';
                        obj.currentlyHighlighted = data[i];
                        index0 = index;
                        deferred.resolve(data);
                        return;
                    }
                }

                deferred.reject('did not find such message, showing last messages from channel');
            });

            return deferred.promise;
        }

        function requestMessages(index, count) {
            var deferred = $q.defer();

            $http.get(obj.getPath, {
                params: {
                    channel: obj.channel,
                    index: index,
                    count: count
                }
            }).success(function(data) {
                if(data.length === 0) {
                    EOF = cache.length - 1;
                }
                else if(data.length < count) {
                    EOF = data[data.length - 1].idx;
                }
                insertCache(data);
                deferred.resolve(data);
            }).error(function(data) {
                deferred.reject('error when requesting data!');
            });

            return deferred.promise;
        }

        function requestLastMessages(count) {
            var deferred = $q.defer();

            $http.get(obj.getPath, {
                params: {
                    channel: obj.channel,
                    count: count
                }
            }).success(function(data) {
                if(data.length === 0) {
                    index0 = 0;
                    EOF = 0;
                    return deferred.resolve(data);
                }

                index0 = data[0].idx;
                EOF = data[data.length - 1].idx;
                insertCache(data);
                deferred.resolve(data);
            }).error(function(data) {
                console.log('error');
                deferred.reject('error!');
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

        return {
            get: getData,
            incrementRevision: incrementRevision,
            revision: revision,
            addMessage: addMessage
        }
    };

}]);
