/**
 *
 * Created by Tsarpf on 3/1/15.
 */

//see http://stackoverflow.com/questions/14833326/how-to-set-focus-on-input-field/18295416#18295416
app.factory('focus', ['$rootScope', '$timeout', function ($rootScope, $timeout) {
    return function(name) {
        $timeout(function (){
            $rootScope.$broadcast('focusOn', name);
        });
    }
}]);

app.directive('focusOn', function() {
    return function(scope, elem, attr) {
        scope.$on('focusOn', function(e, name) {
            if(name === attr.focusOn) {
                elem[0].focus();
            }
        });
    };
});