/**
 *
 * Created by tsarpf on 5/6/15.
 */


angular.module('tsatter').factory('infiniteMessages', ['$q', '$http', '$timeout', function($q, $http, $timeout) {
    return function(obj) {
        var rev = 0;

        var first = true;
        var bufferSize = 10;
        var index0 = null;
        var adapter;

        var EOF = null;
        var bottomLoaded = false;

        var cache = [];
        adapter = obj.adapter;
        function getData(index, count, callback) {
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



            //get messages reqIndex, count
            //index0 should be set by now
            requestMessages(index, count).then(function(data) {
                callback(data);
            });
        }

        function getMessages(index, count) {
            /*
            var deferred = $q.defer();

            if(EOF === null) {
                requestMessages(obj.channel, index, count).then(function(data) {

                });
                return deferred.promise;
            }
            var arr = [];
            for(var i = index; i < index + count && i < EOF; i++) {
                if(!cache[i]) {

                }

                arr.push(cache[i]);
            }

            deferred.resolve(arr);
            return deferred.promise;
            */
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
                        if(data.length < count) {
                            EOF = data[data.length - 1].idx;
                            bottomLoaded = true;
                        }
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



        function requestMessages(index, count) {
            var deferred = $q.defer();

            var reqIndex = index0 + index;
            var reqCount = count;
            if(reqIndex + count <= 0) {
                deferred.resolve([]);
                return deferred.promise;
            }

            var remainder = 0;
            if(reqIndex < 0) {
                remainder = -reqIndex;
                reqCount = count - remainder;
                reqIndex = 0;
            }

            $http.get('/backlog/', {
                params: {
                    channel: obj.channel,
                    index: reqIndex,
                    count: reqCount
                }
            }).success(function(data) {
                if(data.length === 0) {
                    EOF = cache.length - 1;
                    bottomLoaded = true;
                }
                if(data.length < reqCount) {
                    EOF = data[data.length - 1].idx;
                    bottomLoaded = true;
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

            $http.get('/backlog/', {
                params: {
                    channel: obj.channel,
                    count: count
                }
            }).success(function(data) {
                if(data.length === 0) {
                    index0 = 0;
                    EOF = 0;
                    bottomLoaded = true;
                    return deferred.resolve(data);
                }

                index0 = data[0].idx;
                EOF = data[data.length - 1].idx;
                bottomLoaded = true;
                insertCache(data);
                deferred.resolve(data);
            }).error(function(data) {
                console.log('error');
                deferred.reject('error!');
            });

            return deferred.promise;
        }

        return {
            get: getData,
            incrementRevision: incrementRevision,
            revision: revision,
            addMessage: addMessage
        }
    };

}]);
