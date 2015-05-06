var app = angular.module('tsatter', [
    'ngAnimate',
    'ui.bootstrap',
    'akoenig.deckgrid',
    'ngSanitize',
    'luegg.directives',
    'duScroll',
    'ui.scroll',
    'flash',
    'angular-images-loaded',
    'lrInfiniteScroll',
    'infinite-scroll'
]);

app.directive('tsChat', ['$timeout', function($timeout) {
    return {
        restrict: "E",
        templateUrl: '/partials/chat.html',
        link: function(scope, element, attrs) {
            scope.channelName = attrs.channelName;
            $timeout(function() {
                scope.msgDiv = document.getElementById(attrs.channelName);
            });
        }
    };
}]);

app.directive('tsCardMessages', function() {
    var getTemplate = function(messagesString) {
        var template = '';
        if(messagesString) {
            var messagesObj = JSON.parse(messagesString);
            for (var idx in messagesObj) {
                var messageObj = messagesObj[idx];
                template += '<p class="discovery-message"><strong>' + messageObj.nick + ':</strong> ' +  cleanHTML(messageObj.message) + '</p>';
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

app.directive('tsHelp', function() {
    return {
        restrict: 'E',
        templateUrl: '/partials/help.html'
    };
});

var cleanHTML = function(htmldes) {
    return htmldes.replace(/[<>&\n]/g, function(x) {
        return {
            '<': '&lt;',
            '>': '&gt;',
            '&': '&amp;',
            '\n': '<br />'
        }[x];
    });
};

app.directive('tsDiscovery', function() {
    return {
        restrict: "E",
        templateUrl: 'partials/discovery.html'
    };
});

app.directive('tsChatMessage', function() {
    return {
        restrict: "E",
        templateUrl: '/partials/chatmessage.html'
    };
});

app.directive('tsUserBar', function() {
    return {
        restrict: "E",
        templateUrl: 'partials/userbar.html'
    };
});

app.directive('tsMediaBar', function() {
    return {
        restrict: "E",
        templateUrl: '/partials/mediabar.html'
    };
});
