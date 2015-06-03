var app = angular.module('tsatter', [
    'ui.bootstrap',
    'akoenig.deckgrid',
    'ngSanitize',
    'luegg.directives',
    'duScroll',
    'ui.scroll',
    'flash',
    'angular-images-loaded',
    'lrInfiniteScroll',
    'infinite-scroll',
    'monospaced.mousewheel',
    'angular-images-loaded'
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

app.directive('scrolly', function() {
    return {
        restrict: 'A',
        scope: {
            scrolledDown: '=',
            messagesGlued: '='
        },
        link: function(scope, element, attrs) {
            var raw = element[0];
            element.bind('scroll', function(event) {
                //console.log('scroll');
                //console.log(scope.scrolledDown);
                //console.log('scrolledDown: %s, scrollTop: %d, offsetHeight: %d, scrollHeight: %d', scope.scrolledDown, raw.scrollTop, raw.offsetHeight, raw.scrollHeight);
                if(scope.scrolledDown === true && raw.scrollTop + raw.offsetHeight >= raw.scrollHeight) {
                    //console.log('derrrrrr');
                    scope.$apply(function() {
                        scope.messagesGlued = true;
                        scope.scrolledDown = false;
                    });
                }
            });
            element.bind('scroll mousedown wheel DOMMouseScroll mousewheel keyup', function(evt) {
                //console.log('scrollink');
                //console.log(scope);
                //console.log(evt);
                if (evt.type === 'DOMMouseScroll' || evt.type === 'keyup' || evt.type === 'mousewheel' || evt.type === 'wheel') {
                    //console.log('evt had type');
                    if (evt.originalEvent.detail < 0 || (evt.originalEvent.wheelDelta && evt.originalEvent.wheelDelta > 0)) { 
                        //console.log('up'); 
                        scope.$apply(function() {
                            scope.scrolledDown = false;
                        });
                        // up
                    }
                    else if (evt.originalEvent.detail > 0 || (typeof evt.originalEvent.wheelDelta !== 'undefined' && evt.originalEvent.wheelDelta < 0)) { 
                        scope.$apply(function() {
                            scope.scrolledDown = true;
                        });
                        //console.log('down'); 
                        //console.log('scrollTop: %d, offsetHeight: %d, scrollHeight: %d', raw.scrollTop, raw.offsetHeight, raw.scrollHeight);
                        /*
                        if(raw.scrollTop + raw.offsetHeight >= raw.scrollHeight) {
                            console.log('at bottom');
                            scope.$apply(attrs.scrolly);
                        }
                        */
                    } 
                }
            });
        }
    }
});

app.directive('colResizeable', function() {
    return {
        restrict: 'A',
        link: function(scope, elem) {
            setTimeout(function() {
                elem.colResizable({
                    liveDrag: true,
                    gripInnerHtml: "<div class='grip'></div>",
                    draggingClass: "dragging",
                    onDrag: function() {
                        //trigger a resize event, so paren-witdh directive will be updated
                        $(window).trigger('resize');
                    }
                });
            });
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

