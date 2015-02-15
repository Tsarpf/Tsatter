var app = angular.module('tsatter', ['ngAnimate', 'ui.bootstrap', 'akoenig.deckgrid']);

app.directive('tsUserHeader', function() {
    return {
        restrict: "E",
        templateUrl: '/partials/userheader',
        link: function(scope, element, attrs) {

        }
    };
});

app.directive('tsChat', function($timeout) {
    return {
        restrict: "E",
        templateUrl: '/partials/chat',
        link: function(scope, element, attrs) {
            console.log("le attribute:");
            console.log(attrs.channelName);
            scope.channelName = attrs.channelName;
            $timeout(function() {
                scope.msgDiv = document.getElementById(attrs.channelName);
            });
        }
    };
});

app.directive('tsCardMessages', function($compile) {
    var getTemplate = function(messagesString) {
        var template = '';
        var messages = JSON.parse(messagesString);
        for(var message in messages) {
            template += '<p>' + messages[message] + '</p>';
        }
        return template;
    };
    return {
        restrict: 'E',

        link: function(scope, element, attrs) {
            element.html(getTemplate(attrs.messages)).show();
        }
    };
});

app.directive('tsDiscovery', function() {
    return {
        restrict: "E",
        templateUrl: 'partials/discovery',
        link: function(scope, element, attrs) {

        }
    };
});

app.directive('tsChatMessage', function($timeout) {
    return {
        restrict: "E",
        templateUrl: '/partials/chatmessage',
        link: function(scope, element, attrs) {
            /*
            if(scope.$last === true){
                $timeout(function() {
                    scope.$emit('msgRepeatFinished');
                    scope.lastElementScroll(attrs.id);
                });
            }
            */
        }
    };
});

