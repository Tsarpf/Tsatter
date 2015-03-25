var app = angular.module('tsatter', [
    'ngAnimate',
    'ui.bootstrap',
    'akoenig.deckgrid',
    'ngSanitize',
    'luegg.directives',
    'duScroll',
    'flash',
    'angular-images-loaded',
    'lrInfiniteScroll',
    'infinite-scroll'
]);

app.directive('tsChat', ['$timeout', function($timeout) {
    return {
        restrict: "E",
        templateUrl: '/partials/chat',
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
        templateUrl: 'partials/discovery'
    };
});

app.directive('tsChatMessage', function() {
    return {
        restrict: "E",
        templateUrl: '/partials/chatmessage'
    };
});

app.directive('tsMediaBar', function() {
    return {
        restrict: "E",
        templateUrl: '/partials/mediabar'
    };
});

angular.module('tsatter').controller('ChatController', [
    '$timeout',
    '$document',
    '$location',
    '$scope',
    'socket',
    '$rootScope',
    'command',
    'focus',
    '$http',
    '$anchorScroll',
    '$q',
function($timeout, $document, $location, $scope, socket, $rootScope, command, focus, $http, $anchorScroll, $q) {
    $scope.messages = [];
    $scope.users = [];
    $scope.mediaList = [];
    $scope.glued = true;
    $scope.mediaGlued = true;
    $scope.nick = '';
    $scope.editingNick = false;
    $scope.infiniteBottomLocation = Number.MAX_VALUE;
    $scope.infiniteTopLocation = 0;
    $scope.infiniteStep = 20;
    $scope.infiniteReachedTop = false;
    $scope.infiniteReachedBottom = false;
    $scope.origin = location.origin;


    //we have to do this in a timeout so that the directive is initialized
    $timeout(function(){
        joinChannel($scope.channelName);
        $scope.nick = $rootScope.vars.nickname;
        $scope.getBacklog();
        focus('showChannel');
    });

    $scope.currentlyHighlighted = {};
    $scope.messageClicked = function(index) {
        $scope.messages[index].class = 'single-message-highlighted';
        if($scope.currentlyHighlighted) {
            $scope.currentlyHighlighted.class = '';
        }
        $scope.currentlyHighlighted = $scope.messages[index];
    };
    $scope.getMessagesFromServer = function(channel, from, to, success, error) {
        $http.get('/backlog/', {
            params: {
                channel: channel,
                from: from,
                to: to
            }
        }).
            success(success).
            error(error);
    };
    var errorLogger = function(data, status, headers, config) {
        console.log('error!');
    };

    $scope.getBacklog = function() {
        var hash = $location.hash();
        var from = -$scope.infiniteStep - 1;
        var to = -1;
        if(hash) {
            console.log('got hash: ' + hash);
            var targetChannel = '#' + hash.split('__')[0];
            if(targetChannel === $scope.channelName) {
                var target = parseInt(hash.split('__')[1]);

                to = parseInt(target + $scope.infiniteStep / 2);
                from = parseInt(target - $scope.infiniteStep / 2);

                //If we're closer than infiniteStep/2 to 0, get more messages after the targeted message
                if(from <= 0) {
                    to += (-from);
                    from = 0;
                    $scope.infiniteReachedTop = true;
                }

                $scope.glued = false;
                $scope.infiniteBottomLocation = to;
                $scope.infiniteTopLocation = from;
            }
        }
        else {
            $scope.infiniteReachedBottom = true;
        }

        $scope.getMessagesFromServer($scope.channelName, from, to,
        function(data, status, headers, config) {
            for (var i = 0; i < data.length; i++) {
                $scope.addBackendMessage(data[i]);
            }
            $timeout(function() {
                var hash = $location.hash();
                for(var i = 0; i < $scope.messages.length; i++) {
                    if($scope.messages[i].idx == hash.split('__')[1]) {
                        $scope.currentlyHighlighted = $scope.messages[i];
                        $scope.currentlyHighlighted.class = 'single-message-highlighted';
                        break;
                    }
                }
                $anchorScroll();
            });

            if(data.length === 0 && $location.hash().length > 1) {
                console.log('message not found. do a flash message here?');
                $scope.getBacklog();
                $scope.glued = true;
            }

            if(data.length > 0) {
                $scope.infiniteBottomLocation = data[i - 1].idx;
                $scope.infiniteTopLocation = data[0].idx;
            }

            if(data.length < $scope.infiniteStep - 1) {
                $scope.infiniteReachedTop = true;
                $scope.infiniteReachedBottom = true;
            }

        }, errorLogger);
    };

    $scope.infiniteScrollDown = function() {
        //numbers go up since the last message has the highest index
        //console.log('go down');

        //console.log('bottom at: ' + $scope.infiniteBottomLocation);

        //div(class="single-message", id="{{channelName.substring(1)}}__{{message.idx}}")

        if($scope.infiniteReachedBottom) {
            //console.log('already reached bottom');
            return;
        }

        $scope.getMessagesFromServer($scope.channelName, $scope.infiniteBottomLocation, $scope.infiniteBottomLocation + $scope.infiniteStep,
            function(data, status, headers, config) {
                if(data.length === 0) {
                    $scope.infiniteReachedBottom = true;
                    return;
                }

                if(data.length < $scope.infiniteStep - 1) {
                    $scope.infiniteReachedBottom = true;
                }

                var tm = function(idx) {
                    return function() {
                        idx -= 10;
                        if(idx < 0) {idx = 0;}
                        var id = $scope.channelName.substring(1) + '__' + idx;
                        $scope.glued = false;
                        $location.hash(id);
                        $anchorScroll();
                    }
                };
                $timeout(tm($scope.infiniteBottomLocation));

                $scope.infiniteBottomLocation += data.length;
                //console.log('other idx: ' + $scope.infiniteBottomLocation);

                for(var i = 0; i < data.length; i++) {
                    $scope.addBackendMessage(data[i]);
                }


            }, errorLogger);
    };

    $scope.infiniteScrollUp = function() {
        //numbers go down since the oldest message has the smallest index 0
        console.log('go up gfkjdsljdsfg');

        if($scope.infiniteReachedTop) {
            console.log('already reached top');
            return;
        }

        if($scope.infiniteTopLocation === 0) {
            $scope.infiniteReachedTop = true;
            return;
        }

        var top = $scope.infiniteTopLocation;
        var topAfterDecrement = top - $scope.infiniteStep;

        if(topAfterDecrement < 0) {
            topAfterDecrement = 0;
            $scope.infiniteReachedTop = true;
        }

        $scope.getMessagesFromServer($scope.channelName, topAfterDecrement, top,
            function(data, status, headers, config) {
                if(data.length === 0) {
                    $scope.infiniteReachedTop = true;
                    return;
                }

                if(data.length < $scope.infiniteStep - 1) {
                    $scope.infiniteReachedTop  = true;
                }

                var tm = function(idx) {
                    return function() {
                        //idx += 5;
                        //if(idx < 0) {idx = 0;}
                        var id = $scope.channelName.substring(1) + '__' + idx;
                        $scope.glued = false;
                        $location.hash(id);
                        $anchorScroll();
                    }
                };
                $timeout(tm($scope.infiniteTopLocation));
                console.log('other idx: ' + $scope.infiniteTopLocation);
                $scope.infiniteTopLocation -= data.length;
                if($scope.infiniteTopLocation < 0) {
                    $scope.infiniteTopLocation = 0;
                }

                for(var i = data.length - 1; i >= 0; i--) {
                    $scope.addBackendMessage(data[i], true);
                }
            }, errorLogger);

    };

    //Not sure yet if this is really a robust solution. It seems a bit dangerous
    $scope.mediaCount = 0;

    var joinChannel=function(channelName) {
        $scope.$on(channelName, function(event, data) {
            if($scope.handler.hasOwnProperty(data.command)) {
                $scope.handler[data.command](data);
            }
            else {
                console.log('no handler for:');
                console.log(event);
                console.log(data);
            }
        });

        command.send('names ' + channelName);
    };

    $scope.part = function(data) {
        var idx = $scope.users.indexOf(data.nick);
        if(idx < 0) return;
        $scope.users.splice(idx, 1);
        if($scope.infiniteReachedBottom) {
            $scope.addServerMessage(data.nick + ' left the channel');
        }
    };
    $scope.names = function(data) {
        $scope.users = Object.keys(data.nicks);
    };
    $scope.join = function(data) {
        $scope.users.push(data.nick);
        if($scope.infiniteReachedBottom) {
            $scope.addServerMessage(data.nick + ' joined the channel');
        }
    };
    $scope.privmsg = function(data) {
        if($scope.infiniteReachedBottom) {
            $scope.addMessage(data.args[1], data.nick);
        }
    };
    $scope.nick = function(data) {
        if(data.nick === $scope.nick) {
            $scope.nick = data.args[0];
        }
        var idx = $scope.users.indexOf(data.nick);
        $scope.users.splice(idx, 1, data.args[0]);
        if($scope.infiniteReachedBottom) {
            $scope.addServerMessage(data.nick + ' is now known as ' + data.args[0]);
        }
    };
    $scope.quit = function(data) {
        console.log('got quit');
        var idx = $scope.users.indexOf(data.nick);
        if(idx < 0) return;
        $scope.users.splice(idx, 1);
        if($scope.infiniteReachedBottom) {
            $scope.addServerMessage(data.nick + ' quit');
        }
    };
    $scope.errnick = function(data) {
        if($scope.infiniteReachedBottom) {
            $scope.addServerMessage(data.args[data.args.length - 1]);
        }
    };
    $scope.nicknameinuse = function(data) {
        if($scope.infiniteReachedBottom) {
            $scope.addServerMessage(data.args[data.args.length - 1]);
        }
    };
    $scope.activate = function(data) {
        $timeout(function() {
            focus('showChannel');
        });
    };

    $scope.handler = {
        PRIVMSG: $scope.privmsg,
        JOIN: $scope.join,
        NAMES: $scope.names,
        PART: $scope.part,
        QUIT: $scope.quit,
        NICK: $scope.nick,
        err_erroneusnickname: $scope.errnick, //its erroneous not erroneus :(
        err_nicknameinuse:  $scope.nicknameinuse,
        activate: $scope.activate
    };

    $scope.addServerMessage = function(message) {
        $scope.addMessage(message, 'server');
    };

    $scope.addBackendMessage = function(message, top) {
        $scope.addMessage(message.message, message.nick, message.timestamp, message.idx, top);
    };
    $scope.addMessage = function(message, nick, timestamp, idx, top) {
        var obj = {message: message, nick: nick, timestamp: getTimestamp(timestamp), idx: idx, class: ''};
        if(top) {
            $scope.messages.unshift(obj);
        }
        else {
            $scope.messages.push(obj);
        }

        var urls = getUrls(message);
        if(!urls) {
            return;
        }
        for(var j = 0; j < urls.length; j++) {
           isImage(urls[j], obj).then(function(args) {
               var wasImage = args[0];
               if(!wasImage) {
                   return;
               }

               var src = args[1];
               var obj = args[2];

               var num = $scope.mediaCount++;
               $scope.mediaList.push({url: src, idx: num});
               obj.message = obj.message.replace(src, '[' + num + ']');
           });
        }
    };

    var getTimestamp = function(timestamp) {
        var date;
        if(!timestamp) {
           date = new Date(Date.now());
        }
        else {
            date = new Date(timestamp);
        }
        return date;
    };

    var customCommandHandlers = {
        op: op,
        part: part
    };

    //Maybe make these a bit more obvious
    function part() {
        command.send(['part', $scope.channelName]);
    }

    function op(args) {
        command.send(['mode', $scope.channelName, '+o', args[1]]);
    }

    $scope.editNick = function() {
        $scope.editingNick = true;
        focus('editNick');
    };

    $scope.stopEditingNick = function() {
        $scope.editingNick = false;
    };

    $scope.ownNickAreaSubmit = function() {
        if($scope.nick !== $rootScope.vars.nickname) {
            command.send(['nick', $scope.nick]);
        }
        $scope.editingNick = false;
        $scope.nick = $rootScope.vars.nickname;
    };

    this.privmsg = function() {
        var message = $scope.message;
        if(typeof message === 'undefined') {
           return;
        }
        $scope.message = '';

        //If a command
        if(message.indexOf('/') === 0) {
            if (message.indexOf('/') === 0) {
                message = message.substring(1); //Lose the leading /
            }
            var words = message.split(' ');

            var cmd = words[0].toLowerCase();
            if(customCommandHandlers.hasOwnProperty(cmd)) {
                customCommandHandlers[cmd](words);
            }
            else {
                command.send(message);
            }
        }
        else {
            var obj = {channel: $scope.channelName, message: message};
            socket.emit('privmsg', obj);
            $scope.addMessage(message, $rootScope.vars.nickname);
        }
    };

    $scope.imgLoadedEvents = {
        always: function(instance) {
            //reset glue in hopes of autoscrolling to the end
            $scope.mediaGlued = !$scope.mediaGlued;
            $scope.mediaGlued = !$scope.mediaGlued;
        },
        fail: function(instance) {
            console.log('fail');
            // Do stuff
        }
    };

    //http://stackoverflow.com/questions/22423057/angular-js-isimage-check-if-its-image-by-url
    //Awesome.
    function isImage(src, obj) {

        var deferred = $q.defer();

        var image = new Image();
        image.onerror = function() {
            deferred.resolve([false]);
        };
        image.onload = function() {
            deferred.resolve([true, src, obj]);
        };
        image.src = src;

        return deferred.promise;
    }

    //Maybe the rest of these should be in a service?
    var urlRegex = /((((https?|ftp):\/\/)|www\.)(([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)|(([a-zA-Z0-9\-]+\.)*[a-zA-Z0-9\-]+\.(aero|asia|biz|cat|com|coop|info|int|jobs|mobi|museum|name|net|org|post|pro|tel|travel|xxx|edu|gov|mil|[a-zA-Z][a-zA-Z]))|([a-z]+[0-9]*))(:[0-9]+)?((\/|\?)[^ "]*[^ ,;\.:">)])?)|(spotify:[^ ]+:[^ ]+)/g;
    var getUrls = function(message) {
        return message.match(urlRegex);
    };
}]);

angular.module('tsatter').controller('AllChatController', ['$timeout', '$rootScope', '$scope', 'socket', 'command', '$location', function($timeout, $rootScope, $scope, socket, command, $location) {
    $scope.form = {
        channel: ''
    };
    $scope.userChannels = [];

    $scope.joinChannel = function() {
        var channel = $scope.form.channel;

        if(channel === '#' || channel.length === 0) {
            $scope.form.channel = 'Channel name should be at least 1 character long';
            return;
        }

        if(channel.indexOf(' ') >= 0) {
            $scope.form.channel = 'No spaces in channel names allowed';
            return;
        }

        if(channel.indexOf('#') !== 0) {
            channel = '#' + channel;
        }

        command.send('join ' + channel);
        $scope.form.channel = '';
    };

    $scope.clickTab = function(name) {
        $scope.$broadcast(name, {command: 'activate'});
    };

    $scope.openLink = function(hash) {
        var channelName = hash.split('__')[0];
        command.send('join #' + channelName);
    };

    $scope.$on('rpl_welcome', function(event, data) {
        //command.send('join #ses'); //Join default channel while developing

        var hash = $location.hash();
        if(hash) {
            $scope.openLink(hash);
        }

        if($location.absUrl().indexOf('#') < 0) {
            $location.hash('!');
        }

        $rootScope.vars.nickname = data.nick;
    });

    $scope.$on('err_erroneusnickname', function(event, data) { //its erroneous not erroneus :(
        $scope.sendToCurrentChannel(data);
    });

    $scope.$on('err_nicknameinuse', function(event, data) {
        $scope.sendToCurrentChannel(data);
    });

    $scope.sendToCurrentChannel = function(data) {
        for(var i = 0; i < $scope.userChannels.length; i++) {
            if($scope.userChannels[i].active === true) {
                $scope.$broadcast($scope.userChannels[i].name, data);
            }
        }
    };

    $scope.$on('NICK', function(event, data) {
        if(data.nick === $rootScope.vars.nickname) {
            $rootScope.vars.nickname = data.args[0];
        }
        var channels = socket.getChannels();
        for(var channel in channels) {
            if(channels.hasOwnProperty(channel)) {
                $scope.$broadcast(channels[channel], data);
            }
        }
    });

    $scope.$on('JOIN', function(event, data) {
        var channel = data.args[0];
        $scope.addChannel(channel);
    });
    $scope.addChannel = function(channel) {
        for(var i = 0; i < $scope.userChannels.length; i++) {
            if($scope.userChannels[i].name === channel) {
                $scope.userChannels[i].active = true;
                return;
            }
        }
        socket.listenChannel(channel);
        $scope.userChannels.push({name: channel, active: true});
    };

    $scope.leaveChannel = function(channel) {
        command.send(['part', channel]);
    };

    $scope.removeChannel = function(channel) {
        console.log('remove channel');
        console.log(channel);
        for(var i = 0; i < $scope.userChannels.length; i++) {
            if($scope.userChannels[i].name === channel) {
                $scope.userChannels.splice(i,1);
                break;
            }
        }
    };

    $scope.$on('PART', function(event, data) {
        $scope.removeChannel(data.args[0]);
    });

    $scope.$on('QUIT', function(event, data) {
        console.log('got quit');
        var channels = socket.getChannels();
        for(var channel in channels) {
            if(channels.hasOwnProperty(channel)) {
                $scope.$broadcast(channels[channel], data);
            }
        }
    });

    $rootScope.vars = {
        loggedIn: false,
        nickname: 'anon'
    };
}]);

//TODO: make login system a service

angular.module('tsatter').controller("UserHeaderController", ['$rootScope', '$scope', 'socket', function($rootScope, $scope, socket) {
    $scope.loginState = "";
    //$rootScope.vars.nickname = 'anon';
    /*
    $scope.login = function() {
        var obj = {};
        obj.username = $scope.username;
        obj.password = $scope.password;
        $scope.loginState = "Logging in... please wait";

        socket.emit('login', obj, logStateChange);
    };
    $scope.logout = function() {
        socket.emit('logout', {}, logStateChange);
    };
    var logStateChange = function(data) {
        $scope.username = data.username;
        $rootScope.vars.username = data.username;
        $rootScope.vars.loggedIn = data.loggedIn;
        if(data.loggedIn){
            $scope.loginState = "Logged in!";
        }
        else{
            $scope.loginState = "Logged out!";
        }
    };
    */

    /*
    socket.on('loginFail', function(data) {
        $scope.loginState = "Login failed: " + data.reason.toString();
        //$scope.loggedIn = false;
        $rootScope.vars.loggedIn = false;
    });

    $scope.register = function() {
       console.log('register');
       var obj = {
           username: $scope.username,
           password: $scope.password
       }
       $scope.loginState = "Registering... please wait";
       socket.emit('register', obj);
    };
    socket.on('registerSuccess', function(data) {
        $scope.loginState = "Registered!";
    });

    socket.on('registerFail', function(data) {
        var error = "";
        if(data.reason.message) error = data.reason.message;
        else error = data.reason;
        $scope.loginState = "Register failed: " + error;
    });
    */
}]);


/**
 * Created by Tsarpf on 2/14/15.
 */

angular.module('tsatter').controller("DiscoveryController", ['$scope', '$http', 'command', '$timeout',  function($scope, $http, command, $timeout) {
    $scope.results = [];
    $scope.loaded = false;
    $scope.infiniteSize = 13;
    $scope.bottomLocation = 0;
    $scope.reachedBottom = false;
    $scope.loading = false;
    $scope.getContent = function(from, to, success) {
        $http.get('/activity/', {
           params: {
               from: from,
               to: to
           }
        }).
        success(success).
        error(function(data, status, headers, config) {
            console.log('error!');
            $scope.loading = false;
        });
    };

    $scope.infiniteScrollDown = function() {
        if($scope.reachedBottom || $scope.loading) {
            return;
        }
        $scope.loading = true;
        var from = $scope.bottomLocation;
        var to = from + $scope.infiniteSize;
        $scope.getContent(from, to, function(data, status, headers, config) {
            $scope.results = $scope.results.concat(data);
            $scope.bottomLocation += data.length;
            if(data.length < to - from - 1) {
                $scope.reachedBottom = true;
            }
            $timeout(function() {
                $scope.loading = false;
            });
        });
    };

    $scope.refresh = function() {
        $scope.loading = true;
        $scope.reachedBottom = false;
        $scope.bottomLocation = 0;
        var from = 0;
        var to = $scope.infiniteSize;
        $scope.getContent(from, to, function(data, status, headers, config) {
            $scope.results = data;
            $scope.bottomLocation += data.length;
            if(data.length < to - from - 1) {
                $scope.reachedBottom = true;
            }
            $timeout(function() {
                $scope.loading = false;
            });
        });
    };

    $scope.joinChannel = function(channel) {
        command.send('join ' + channel);
        $scope.$emit('JOIN', {args: [channel]});
    };

    $scope.refresh();
}]);

angular.module('tsatter').factory('socket', ['$rootScope', function($rootScope) {
    var address = location.host;
    var socket = io(address);
    socket.on('message', function(message) {
        $rootScope.$apply(function() {
            $rootScope.$broadcast(message.command, message);
        });
    });

    socket.on('disconnect', function() {
        //alert('Disconnected!');
        location.reload();
    });
    socket.on('reconnect', function() {
        //alert('Disconnected!');
        location.reload();
    });

    var channels = [];

    return {
        listenChannel: function(channel) {
            channels.push(channel);
            socket.on(channel, function(data) {
                $rootScope.$apply(function() {
                    $rootScope.$broadcast(channel, data);
                });
            });
        },

        getChannels: function() { return channels; },

        emit: function(event, data, callback) {
            socket.emit(event, data, function() {
                var args = arguments;
                $rootScope.$apply(function() {
                    if(callback) {
                        callback.apply(socket, args);
                    }
                });
            });
        },

        send: function(object) {
            socket.send(object);
        }
    };
}]);

/**
 * Created by Tsarpf on 2/13/15.
 */
angular.module('tsatter').factory('command', ['$rootScope', 'socket', function($rootScope, socket) {
    return {
        send: function(message) {
            if(typeof message === 'string') {
               message = message.split(' ');
            }

            socket.send({command: message});
        }
    }
}]);

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