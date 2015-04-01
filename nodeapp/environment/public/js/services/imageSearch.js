angular.module('tsatter').factory('imageSearch', ['$http', function($http) {
    return {
        search: function (parameter, callback) {
            $http.get('/search/', {
                params: {
                    searchTerm: parameter
                }
            }).
                success(function (data, status, headers, config) {
                    callback(null, data);
                }).
                error(function(data, status, headers,config) {
                    callback('adkfjlafg');
                });
        }
    }
}]);
