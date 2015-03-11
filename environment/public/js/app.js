var app = angular.module('tsatter', ['ngAnimate', 'ui.bootstrap', 'akoenig.deckgrid', 'ngSanitize', 'luegg.directives']);

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

app.directive('tsCardMessages', function() {
    var getTemplate = function(messagesString) {
        var template = '';
        if(messagesString) {
            var messagesObj = JSON.parse(messagesString);
            for (var idx in messagesObj) {
                var messageObj = messagesObj[idx];
                template += '<p class="discovery-message"><strong>' + messageObj.nick + ':</strong> ' +  messageObj.message + '</p>';
            }
        }
        return template;
    };
    return {
        restrict: 'E',

        link: function(scope, element, attrs) {
            if(attrs.messages) {
                var template = getTemplate(attrs.messages);
                var temp = element.html(template);
                temp.show();
            }
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

app.directive('tsChatMessage', function() {
    return {
        restrict: "E",
        templateUrl: '/partials/chatmessage',
        link: function(scope, element, attrs) {
        }
    };
});

app.directive('tsMediaBar', function() {
    return {
        restrict: "E",
        templateUrl: '/partials/mediabar',
        link: function(scope, element, attrs) {
        }
    };
});
