/**
 * Created by Tsarpf on 2/14/15.
 */

angular.module( 'tsatter' ).controller( "DiscoveryController", [ '$scope', '$http', 'command', '$timeout', function( $scope, $http, command, $timeout ) {
	$scope.results = [];
	$scope.firstLoadDone = false;
	$scope.infiniteSize = 13;
	$scope.bottomLocation = 0;
	$scope.reachedBottom = false;
	$scope.loading = false;
	$scope.getContent = function( from, to, success ) {
		$http.get( '/activity/', {
			params: {
				from: from,
				to: to
			}
		} ).
		success( success ).
		error( function( data, status, headers, config ) {
			console.log( 'error!' );
			$scope.loading = false;
		} );
	};

	$scope.infiniteScrollDown = function() {
		if ( $scope.reachedBottom ||  $scope.loading ) {
			return;
		}
		$scope.loading = true;
		var from = $scope.bottomLocation;
		var to = from + $scope.infiniteSize;
		$scope.getContent( from, to, function( data, status, headers, config ) {
			$scope.results = $scope.results.concat( data );
			$scope.bottomLocation += data.length;
			if ( data.length < to - from - 1 ) {
				$scope.reachedBottom = true;
			}
			$timeout( function()  {
				$scope.loading = false;
			} );
		} );
	};

	$scope.refresh = function()  {
		$scope.loading = true;
		$scope.reachedBottom = false;
		$scope.bottomLocation = 0;
		var from = 0;
		var to = $scope.infiniteSize;
		$scope.getContent( from, to, function( data, status, headers, config ) {
			var used = {};
			if ( data.length > 0 ) {
				for ( var i = 0; i < data.length; i++ ) {
					for ( var j = data[ i ].imageUrls.length - 1; j >= 0; j-- ) {
						var url = data[ i ].imageUrls[ j ].originalUrl;
						if ( !used[ url ] ) {
							used[ url ] = 1;
							data[ i ].imageUrls[ 0 ] = data[ i ].imageUrls[ j ];
							break;
						}
					}
				}
			}
			$scope.results = data;
			$scope.bottomLocation += data.length;
			if ( data.length < to - from - 1 ) {
				$scope.reachedBottom = true;
			}
			$timeout( function()  {
				$scope.loading = false;
				if ( !$scope.firstLoadDone ) {
					$scope.firstLoadDone = !$scope.firstLoadDone;
					$scope.$emit( 'loaded' );
				}
			} );
		} );
	};

	$scope.joinChannel = function( channel ) {
		command.send( 'join ' + channel );
		$scope.$emit( 'JOIN', {
			args: [ channel ]
		} );
	};

	$timeout( function() {
		$scope.refresh();
	} );
} ] );
