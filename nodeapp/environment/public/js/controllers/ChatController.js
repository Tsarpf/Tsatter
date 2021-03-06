angular.module( 'tsatter' ).controller( 'ChatController', [
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
	function( $timeout, $document, $location, $scope, socket, $rootScope, command, focus, $http, $anchorScroll, $q, imageSearch, infiniteMessages ) {
		$scope.users = {};
		$scope.mediaList = [];
		$scope.mediaGlued = true;
		$scope.nick = '';
		$scope.editingNick = false;
		$scope.origin = location.origin;
		$scope.searching = false;
		$scope.searchResults = [];
		$scope.waitingForSearchResults = false;
		$scope.cursorPos = 0;
		$scope.messageAdapter = null;
		$scope.imageAdapter = null;
		$scope.channelState = null;
		$scope.scrolledDown = false;
		$scope.scrolls = {
			scrolledDown: false,
			messagesGlued: true
		};

		var messageProviderObj = {
			channel: null,
			linkOffset: null,
			adapter: null,
			currentlyHighlighted: $scope.currentlyHighlighted,
			getPath: '/backlog/'
		};
		$scope.messageDatasource = infiniteMessages( messageProviderObj );

		var imageProviderObj = {
			channel: null,
			linkOffset: null,
			adapter: null,
			currentlyHighlighted: null,
			getPath: '/imagebacklog/'
		};
		$scope.imageDatasource = infiniteMessages( imageProviderObj );

		//we have to do this in a timeout so that the directive is initialized
		$timeout( function() {
			messageProviderObj.channel = $scope.channelName;
			messageProviderObj.adapter = $scope.messageAdapter;
			var linkIdx = $scope.getLinkIdx();
			messageProviderObj.linkOffset = linkIdx;
			if ( linkIdx !== null ) {
				$scope.scrolls.messagesGlued = false;
				$scope.oldMessageGlue = false;
				$scope.oldMediaGlue = true;
			} else {
				$scope.oldMessageGlue = true;
				$scope.oldMediaGlue = true;
			}

			imageProviderObj.channel = $scope.channelName;
			imageProviderObj.adapter = $scope.imageAdapter;
			joinChannel( $scope.channelName );
			$scope.nick = $rootScope.vars.nickname;
			focus( 'chatInput' );

			for ( var i = 0; i < $scope.$parent.userChannels.length; i++ )  {
				if ( $scope.$parent.userChannels[ i ].name === $scope.channelName ) {
					$scope.channelState = $scope.$parent.userChannels[ i ];
				}
			}

			$scope.$watch( 'channelState.active', $scope.channelStateChange );
		} );

		/*
		$scope.$watch('scrolls.messagesGlued', function() {
		    console.log('messages glued now: ' + $scope.scrolls.messagesGlued);
		});
		*/

		$scope.cooldownTimer = null;
		$scope.$on( 'cooldown', function( event, data ) {
			console.log( 'got cooldown at chat' );
			console.log( data );
			if ( $scope.cooldownTimer !== null ) {
				clearTimeout( $scope.cooldownTimer );
			}
			$scope.cooldown( data.cooldown );
		} );

		$scope.cooldown = function( endDate ) {
			var now = Date.now();
			var timeLeft = ( endDate - now ) / 1000;
			timeLeft = Math.round( timeLeft );
			console.log( timeLeft );
			if ( timeLeft <= 0 ) {
				$scope.safeApply( function() {
					$scope.message = '';
				} );
				$scope.cooldownTimer = null;
				return;
			}

			$scope.safeApply( function()  {
				$scope.message = 'Stop spamming. Cooldown: ' + timeLeft + ' seconds.';
			} );
			$scope.cooldownTimer = setTimeout( $scope.cooldown, 1000, endDate );
		};

		$scope.safeApply = function( fn ) {
			var phase = this.$root.$$phase;
			if ( phase == '$apply' || phase == '$digest' ) {
				if ( fn && ( typeof( fn ) === 'function' ) ) {
					fn();
				}
			} else {
				this.$apply( fn );
			}
		};

		$scope.channelStateChange = function() {
			if ( $scope.channelState.active === false ) {
				$scope.oldMessageGlue = $scope.scrolls.messagesGlued;
				$scope.oldMediaGlue = $scope.mediaGlued;
				$scope.scrolls.messagesGlued = false;
				$scope.mediaGlued = false;
			} else {
				$scope.scrolls.messagesGlued = $scope.oldMessageGlue;
				$scope.mediaGlued = $scope.oldMediaGlue;
			}
		};

		$scope.messageMouseScroll = function( event )  {
			if ( event.originalEvent.deltaY < 0 ) {
				$scope.scrolls.messagesGlued = false;
			}
		};

		$scope.mediaMouseScroll = function( event )  {
			if ( event.originalEvent.deltaY < 0 ) {
				$scope.mediaGlued = false;
			}
		};

		$scope.messageScrollBottom = function() {
			$scope.scrolls.messagesGlued = true;
		};

		$scope.mediaScrollBottom = function() {
			$scope.mediaGlued = true;
		};

		$scope.getLinkIdx = function() {
			var hash = $location.hash();
			if ( hash ) {
				var targetChannel = '#' + hash.split( '__' )[ 0 ];
				if ( targetChannel === $scope.channelName ) {
					var target = parseInt( hash.split( '__' )[ 1 ] );
					$location.hash( '' );
					return target;
				}
			}
			return null;
		};

		var lastMessage = '';
		var searchStartingCharacter = '@';
		$scope.messageChanged = function() {
			var length = $scope.message.length;
			if ( length === 1 && $scope.message[ 0 ] === searchStartingCharacter ) {
				$scope.cursorPos = 0;
				$scope.startSearching();
			}
			//To optimize performance a bit, first check if length difference is only 1
			//and if the character that was changed was the last one (because it usually is)
			else if ( length === lastMessage.length + 1 && $scope.message[ length - 1 ] !== lastMessage[ length - 2 ] ) {
				//if the last character that was the only thing changed isn't searchStartingCharacter, just skip to end
				if ( $scope.message[ length - 1 ] === searchStartingCharacter ) {
					$scope.cursorPos = length - 1;
					$scope.startSearching();
				}
			} else if ( length < lastMessage.length ) {
				//Removed character, just skip to end
			} else {
				//Resort to checking the whole string
				var found = false;
				for ( var i = 0; i < length && i < lastMessage.length; i++ )  {
					if ( $scope.message[ i ] !== lastMessage[ i ] && $scope.message[ i ] === searchStartingCharacter ) {
						$scope.cursorPos = i;
						$scope.startSearching();
						found = true;
						break;
					}
				}

				//If not found yet, check rest of string
				//We have to do this because spaces do not trigger messageChanged
				for ( ; i < length && !found; i++ ) {
					if ( $scope.message[ i ] === searchStartingCharacter ) {
						$scope.cursorPos = i;
						$scope.startSearching();
						break;
					}
				}
			}
			lastMessage = $scope.message;
		};

		$scope.escPressedInSearch = function()  {
			$scope.stopSearching();
		};

		$scope.stopSearching = function() {
			$scope.searching = false;
			focus( 'chatInput' );
		};

		$scope.startSearching = function() {
			$scope.message = $scope.message.slice( 0, $scope.cursorPos ) + $scope.message.slice( $scope.cursorPos + 1 );
			$scope.searchTerm = '';
			$scope.searching = true;
			focus( 'searchInput' );
		};

		$scope.searchResultClicked = function( idx )  {
			$scope.message = $scope.message.slice( 0, $scope.cursorPos ) +
				$scope.searchResults[ idx ].src + ' ' +
				$scope.message.slice( $scope.cursorPos );

			$scope.stopSearching();
		};

		$scope.search = function()  {
			$scope.waitingForSearchResults = true;
			var term = $scope.searchTerm;
			$scope.searchTerm = '';
			$scope.searchResults = [];
			imageSearch.search( term, function( err, data ) {
				$scope.waitingForSearchResults = false;

				if ( err ) {
					console.log( err );
					return;
				}
				$scope.searchResults = data;
			} );
		};

		$scope.currentlyHighlighted = {};
		$scope.messageClicked = function( index ) {
			/*
			var msg = $scope.message;
			if ( msg == undefined ) {
				msg = "";
			}
			$scope.message = ">>" + index + " " + msg;
            */
			//TODO: add message highlighting
		};

		var joinChannel = function( channelName ) {
			$scope.$on( channelName, function( event, data ) {
				if ( $scope.handler.hasOwnProperty( data.command ) ) {
					$scope.handler[ data.command ]( data );
				} else {
					console.log( 'no handler for:' );
					console.log( data );
				}
			} );

			command.send( 'names ' + channelName );
		};

		$scope.part = function( data ) {
			$scope.removeNick( data.nick );
			//$scope.addServerMessage(data.nick + ' left the channel');
		};
		$scope.names = function( data ) {
			$scope.users = {};
			var nicks = Object.keys( data.nicks );
			for ( var i = 0; i < nicks.length; i++ ) {
				var nick = nicks[ i ];
				var status = data.nicks[ nick ];
				if ( status === '@' )  {
					status = 'op-user';
				} else if ( status === 'v' ) {
					status = 'voice-user';
				} else {
					status = 'normal-user';
				}
				$scope.users[ nick ] = {
					nick: nick,
					status: status,
					showControl: false
				};
			}
		};

		$scope.jumpMessagesTo = function( index ) {
			$scope.scrolledDown = false;
			$scope.scrolls.messagesGlued = false;
			$scope.messageDatasource.jumpTo( index );
		};

		$scope.join = function( data ) {
			$scope.users[ data.nick ] = {
				nick: data.nick,
				status: 'normal-user',
				showControl: false
			};
			//$scope.addServerMessage(data.nick + ' joined the channel');
		};
		$scope.privmsg = function( data ) {
			var obj = {
				message: data.args[ 1 ],
				nick: data.nick,
				timestamp: getTimestamp(),
				idx: null,
				class: ''
			};
			$scope.messageDatasource.addMessage( obj );
		};
		$scope.nick = function( data ) {
			if ( data.nick === $scope.nick ) {
				$scope.nick = data.args[ 0 ];
			}
			$scope.replaceNick( data.nick, data.args[ 0 ] );
			//$scope.addServerMessage(data.nick + ' is now known as ' + data.args[0]);
		};
		$scope.quit = function( data ) {
			$scope.removeNick( data.nick );
			//$scope.addServerMessage(data.nick + ' quit');
		};
		$scope.errnick = function( data ) {
			//$scope.addServerMessage(data.args[data.args.length - 1]);
		};
		$scope.nicknameinuse = function( data ) {
			//$scope.addServerMessage(data.args[data.args.length - 1]);
		};
		$scope.activate = function( data ) {
			$timeout( function() {
				focus( 'chatInput' );
			} );
		};
		$scope.kick = function( data )  {
			var msg = data.args[ 1 ] + ' was kicked by ' + data.nick;
			$scope.removeNick( data.args[ 1 ] );
			//$scope.addServerMessage(msg);
		};
		$scope.mode = function( data ) {
			switch ( data.args[ 1 ] ) {
				case '+o':
					$scope.users[ data.args[ 2 ] ].status = 'op-user';
					//$scope.addServerMessage(data.nick + ' made ' + data.args[2] + ' a moderator');
					break;
				case '-o':
					$scope.users[ data.args[ 2 ] ].status = 'normal-user';
					//$scope.addServerMessage(data.nick + ' removed operator rights from ' + data.args[2]);
					break;
				default:
					break;
			}
		};
		$scope.mediaDelivery = function( data ) {
			console.log( 'media delivery just for you!' );
			console.log( data.image );
			$scope.imageDatasource.addMessage( data.image );
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
			err_nicknameinuse: $scope.nicknameinuse,
			activate: $scope.activate,
			mediaDelivery: $scope.mediaDelivery
		};

		$scope.replaceNick = function( nick, newNick ) {
			$scope.users[ newNick ] = $scope.users[ nick ];
			$scope.users[ newNick ].nick = newNick;
			delete $scope.users[ nick ];
		};

		$scope.removeNick = function( nick ) {
			delete $scope.users[ nick ];
		};

		$scope.addBackendMessage = function( message, top ) {
			$scope.addMessage( message.message, message.nick, message.timestamp, message.idx, top );
		};

		var getTimestamp = function( timestamp ) {
			var date;
			if ( !timestamp ) {
				date = new Date( Date.now() ).getTime();
			} else {
				date = new Date( timestamp ).getTime();
			}
			return date;
		};

		$scope.clickKick = function( nick ) {
			kick( [ 'kick', nick ] );
		};
		$scope.clickMod = function( nick ) {
			op( [ 'op', nick ] );
		};
		$scope.clickUnMod = function( nick ) {
			deop( [ 'deop', nick ] );
		};

		var customCommandHandlers = {
			op: op,
			deop: deop,
			part: part,
			kick: kick
		};

		//Maybe make these a bit more obvious
		function part() {
			command.send( [ 'part', $scope.channelName ] );
		}

		function kick( args ) {
			command.send( [ 'kick', $scope.channelName, args[ 1 ] ] );
		}

		function op( args ) {
			command.send( [ 'mode', $scope.channelName, '+o', args[ 1 ] ] );
		}

		function deop( args ) {
			command.send( [ 'mode', $scope.channelName, '-o', args[ 1 ] ] );
		}

		$scope.editNick = function() {
			$scope.editingNick = true;
			focus( 'editNick' );
		};

		$scope.stopEditingNick = function() {
			$scope.editingNick = false;
		};

		$scope.ownNickAreaSubmit = function() {
			if ( $scope.nick !== $rootScope.vars.nickname ) {
				command.send( [ 'nick', $scope.nick ] );
			}
			$scope.editingNick = false;
			$scope.nick = $rootScope.vars.nickname;
		};

		function rootApply() {
			if ( !$scope.$$phase ) {
				$rootScope.$apply();
			} else {
				$timeout( function()  {
					rootApply();
				} );
			}
		}

		$scope.imgLoadedEvents = {
			always: function( instance ) {
				console.log( 'all images loaded!' );
				$timeout( rootApply );
			}
		};

		this.privmsg = function() {
			var message = $scope.message;
			if ( typeof message === 'undefined' ) {
				return;
			}
			$scope.message = '';

			//If a command
			if ( message.indexOf( '/' ) === 0 ) {
				if ( message.indexOf( '/' ) === 0 ) {
					message = message.substring( 1 ); //Lose the leading /
				}
				var words = message.split( ' ' );

				var cmd = words[ 0 ].toLowerCase();
				if ( customCommandHandlers.hasOwnProperty( cmd ) ) {
					customCommandHandlers[ cmd ]( words );
				} else {
					command.send( message );
				}
			} else {
				var obj = {
					channel: $scope.channelName,
					message: message
				};
				socket.emit( 'privmsg', obj, function( success )  {
					if ( success ) {
						obj = {
							message: message,
							nick: $rootScope.vars.nickname,
							timestamp: getTimestamp(),
							idx: null,
							class: ''
						};
						$scope.messageDatasource.addMessage( obj );
					}
				} );
			}
		};
	}
] );
