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
    'imageSearch',
    'infiniteMessages',
function($timeout, $document, $location, $scope, socket, $rootScope, command, focus, $http, $anchorScroll, $q, imageSearch, infiniteMessages) {
    $scope.messages = [];
    $scope.users = {};
    $scope.mediaList = [];
    $scope.messagesGlued = true;
    $scope.mediaGlued = true;
    $scope.nick = '';
    $scope.editingNick = false;
    $scope.origin = location.origin;
    $scope.searching = false;
    $scope.searchResults = [];
    $scope.waitingForSearchResults = false;
    $scope.cursorPos = 0;
    $scope.messageBufferSize = 20;

    var channelParamObj = {
        channel: null,
        linkOffset: null,
        adapter: null,
        bufferSize: $scope.messageBufferSize
    };
    $scope.messageDatasource = infiniteMessages(channelParamObj);

    //we have to do this in a timeout so that the directive is initialized
    $timeout(function(){
        channelParamObj.channel = $scope.channelName;
        channelParamObj.adapter = $scope.messageAdapter;
        channelParamObj.linkOffset = $scope.getLinkIdx();
        //channelParamObj.linkOffset =
        console.log('channel name set!');
        joinChannel($scope.channelName);
        $scope.nick = $rootScope.vars.nickname;
        focus('chatInput');
    });

    $scope.mouseScroll = function(event) {
        if(event.deltaY < 0) {
           $scope.messagesGlued = false;
        }
    };

    $scope.messageScrollBottom = function() {
        $scope.messagesGlued = true;
    };

    $scope.getLinkIdx = function() {
        var hash = $location.hash();
        if(hash) {
            var targetChannel = '#' + hash.split('__')[0];
            if (targetChannel === $scope.channelName) {
                var target = parseInt(hash.split('__')[1]);
                $location.hash('');
                return target;
            }
        }
        return null;
    };

    var lastMessage = '';
    var searchStartingCharacter = '@';
    $scope.messageChanged = function() {
        var length = $scope.message.length;
        if(length === 1 && $scope.message[0] === searchStartingCharacter) {
            $scope.cursorPos = 0;
            $scope.startSearching();
        }
        //To optimize performance a bit, first check if length difference is only 1
        //and if the character that was changed was the last one (because it usually is)
        else if (length === lastMessage.length + 1 && $scope.message[length - 1] !== lastMessage[length - 2]) {
            //if the last character that was the only thing changed isn't searchStartingCharacter, just skip to end
           if($scope.message[length - 1] === searchStartingCharacter) {
               $scope.cursorPos = length - 1;
               $scope.startSearching();
           }
        }
        else if(length < lastMessage.length) {
            //Removed character, just skip to end
        }
        else {
            //Resort to checking the whole string
            var found = false;
            for(var i = 0; i < length && i < lastMessage.length; i++) {
                if($scope.message[i] !== lastMessage[i] && $scope.message[i] === searchStartingCharacter) {
                    $scope.cursorPos = i;
                    $scope.startSearching();
                    found = true;
                    break;
                }
            }

            //If not found yet, check rest of string
            //We have to do this because spaces do not trigger messageChanged
            for(;i < length && !found; i++) {
                if($scope.message[i] === searchStartingCharacter) {
                    $scope.cursorPos = i;
                    $scope.startSearching();
                    break;
                }
            }
        }
        lastMessage = $scope.message;
    };

    $scope.escPressedInSearch = function() {
        $scope.stopSearching();
    };

    $scope.stopSearching = function() {
        $scope.searching = false;
        focus('chatInput');
    };

    $scope.startSearching = function() {
        $scope.message = $scope.message.slice(0, $scope.cursorPos) + $scope.message.slice($scope.cursorPos + 1);
        $scope.searchTerm = '';
        $scope.searching = true;
        focus('searchInput');
    };

    $scope.searchResultClicked = function(idx) {
        $scope.message = $scope.message.slice(0, $scope.cursorPos) +
            $scope.searchResults[idx].src + ' ' +
            $scope.message.slice($scope.cursorPos);

        $scope.stopSearching();
    };

    $scope.search = function() {
        $scope.waitingForSearchResults = true;
        var term = $scope.searchTerm;
        $scope.searchTerm = '';
        $scope.searchResults = [];
        imageSearch.search(term, function(err, data) {
            $scope.waitingForSearchResults = false;

            if(err) {
                console.log(err);
                return;
            }
            $scope.searchResults = data;
        });
    };

    $scope.currentlyHighlighted = {};
    $scope.messageClicked = function(index) {

        $scope.messages[index].class = 'single-message-highlighted';
        if($scope.currentlyHighlighted) {
            $scope.currentlyHighlighted.class = '';
        }
        $scope.currentlyHighlighted = $scope.messages[index];
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
                console.log(data);
            }
        });

        command.send('names ' + channelName);
    };

    $scope.part = function(data) {
        $scope.removeNick(data.nick);
        $scope.addServerMessage(data.nick + ' left the channel');
    };
    $scope.names = function(data) {
        $scope.users = {};
        var nicks = Object.keys(data.nicks);
        for(var i = 0; i < nicks.length; i++) {
            var nick = nicks[i];
            var status = data.nicks[nick];
            if(status === '@') {
                status = 'op-user';
            }
            else if(status === 'v') {
                status = 'voice-user';
            }
            else {
                status = 'normal-user';
            }
            $scope.users[nick] = {
                nick: nick,
                status: status,
                showControl : false
            };
        }
    };
    $scope.join = function(data) {
        $scope.users[data.nick] = {
            nick: data.nick,
            status: 'normal-user',
            showControl: false
        };
        //$scope.addServerMessage(data.nick + ' joined the channel');
    };
    $scope.privmsg = function(data) {
        //$scope.addMessage(data.args[1], data.nick);
        //FIXME: the idx is not implemented correctly
        var obj = {message: data.args[1], nick: data.nick, timestamp: getTimestamp(), idx: 0, class: ''};
        $scope.messages.push(obj);
    };
    $scope.nick = function(data) {
        if(data.nick === $scope.nick) {
            $scope.nick = data.args[0];
        }
        $scope.replaceNick(data.nick, data.args[0]);
        $scope.addServerMessage(data.nick + ' is now known as ' + data.args[0]);
    };
    $scope.quit = function(data) {
        $scope.removeNick(data.nick);
        $scope.addServerMessage(data.nick + ' quit');
    };
    $scope.errnick = function(data) {
        $scope.addServerMessage(data.args[data.args.length - 1]);
    };
    $scope.nicknameinuse = function(data) {
        $scope.addServerMessage(data.args[data.args.length - 1]);
    };
    $scope.activate = function(data) {
        $timeout(function() {
            focus('chatInput');
        });
    };
    $scope.kick = function(data) {
        var msg = data.args[1] + ' was kicked by ' + data.nick;
        $scope.removeNick(data.args[1]);
        $scope.addServerMessage(msg);
    };
    $scope.mode = function(data) {
        switch(data.args[1]) {
            case '+o':
                $scope.users[data.args[2]].status = 'op-user';
                $scope.addServerMessage(data.nick + ' made ' + data.args[2] + ' a moderator');
                break;
            case '-o':
                $scope.users[data.args[2]].status = 'normal-user';
                $scope.addServerMessage(data.nick + ' removed operator rights from ' + data.args[2]);
                break;
            default:
                break;
        }
    };
    $scope.handler = {
        PRIVMSG: $scope.privmsg,
        JOIN: $scope.join,
        NAMES: $scope.names,
        PART: $scope.part,
        QUIT: $scope.quit,
        NICK: $scope.nick,
        KICK: $scope.kick,
        MODE: $scope.mode,
        err_erroneusnickname: $scope.errnick, //its erroneous not erroneus :(
        err_nicknameinuse:  $scope.nicknameinuse,
        activate: $scope.activate
    };

    $scope.replaceNick = function(nick, newNick) {
        $scope.users[newNick] = $scope.users[nick];
        $scope.users[newNick].nick = newNick;
        delete $scope.users[nick];
    };

    $scope.removeNick = function(nick) {
        delete $scope.users[nick];
    };

    /*
    $scope.addServerMessage = function(message) {
        if($scope.infiniteReachedBottom) {
            if($scope.messages[$scope.messages.length - 1].message === message) {
                return;
            }
            $scope.addMessage(message, 'server');
        }
    };
    */

    $scope.addBackendMessage = function(message, top) {
        $scope.addMessage(message.message, message.nick, message.timestamp, message.idx, top);
    };

    function spliceSlice(str, index, count, add) {
        return str.slice(0, index) + (add || "") + str.slice(index + count);
    }

    function getIdx() {
        for(var i = $scope.messages.length - 1; i >= 0; i--) {
            if(typeof $scope.messages[i].idx !== 'undefined') {
                return $scope.messages[i].idx + 1;
            }
        }
        return 0;
    }

    /*
    $scope.addMessage = function(message, nick, timestamp, idx, top) {
        if(!idx ) {
            idx = getIdx();
        }
        var obj = {message: message, nick: nick, timestamp: getTimestamp(timestamp), idx: idx, class: ''};
        if(top) {
            if($scope.messages[0]) {
                if ($scope.messages[0].idx) {
                    if ($scope.messages[0].idx === idx) {
                        return;
                    }
                }
            }
            $scope.messages.unshift(obj);
        }
        else {
            if ($scope.messages[$scope.messages.length - 1]) {
                if ($scope.messages[$scope.messages.length - 1].idx) {
                    if ($scope.messages[$scope.messages.length - 1].idx === idx) {
                        return;
                    }
                }
            }
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
               var idx = obj.message.indexOf(src);
               obj.message = spliceSlice(obj.message, idx + src.length, 0, ' [' + num + '] ');
               //obj.message = obj.message.replace(src, '[' + num + ']');
           });
        }
    };
    */

    var getTimestamp = function(timestamp) {
        var date;
        if(!timestamp) {
           date = new Date(Date.now()).getTime();
        }
        else {
            date = new Date(timestamp).getTime();
        }
        return date;
    };

    $scope.clickKick = function(nick) {
       kick(['kick', nick]);
    };
    $scope.clickMod = function(nick) {
        op(['op', nick]);
    };
    $scope.clickUnMod = function(nick) {
        deop(['deop', nick]);
    };

    var customCommandHandlers = {
        op: op,
        deop: deop,
        part: part,
        kick: kick
    };

    //Maybe make these a bit more obvious
    function part() {
        command.send(['part', $scope.channelName]);
    }

    function kick(args) {
        command.send(['kick', $scope.channelName, args[1]]);
    }

    function op(args) {
        command.send(['mode', $scope.channelName, '+o', args[1]]);
    }

    function deop(args) {
        command.send(['mode', $scope.channelName, '-o', args[1]]);
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
            socket.emit('privmsg', obj, function(success) {
                if(success) {
                    //$scope.messageDatasource.incrementRevision();
                    var obj = {message: message, nick: $rootScope.vars.nickname, timestamp: getTimestamp(), idx: 0, class: ''};
                    $scope.messages.push(obj);
                }
            });
            //$scope.addMessage(message, $rootScope.vars.nickname);
        }
    };

    $scope.imgLoadedEvents = {
        always: function(instance) {
            //reset glue in hopes of autoscrolling to the end
            $scope.mediaGlued = !$scope.mediaGlued;
            $scope.mediaGlued = !$scope.mediaGlued;
        },
        fail: function(instance) {
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
