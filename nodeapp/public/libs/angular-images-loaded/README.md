# angular-images-loaded

Super simple Angular directive to wrap [imagesLoaded](https://github.com/desandro/imagesloaded) plugin.

[Demo](http://homerjam.github.io/angular-images-loaded/)

## Installation

`$ bower install angular-images-loaded`


## Usage

Remember to include `imagesloaded.pkgd.js` somewhere


## Add module to your app dependencies

	angular.module('yourModule', [..., 'angular-images-loaded']);


## Register events in controller

	app.controller('MyCtrl', function($scope) {
	
		$scope.imgLoadedEvents = {
	
			always: function(instance) {
				// Do stuff
			},
	
			done: function(instance) {
				angular.element(instance.elements[0]).addClass('loaded');
			},
	
			fail: function(instance) {
				// Do stuff
			}
	
		};
	
	});


## Add directive to element

Note: If using class method then class will be removed on load - useful for css transitions etc.

	<div class="images-loaded">
	
		<img src="kitten.jpg">
	
	</div>
	
	<div class="images-loaded: imgLoadedEvents;">
	
		<img src="doge.jpg">
	
	</div>
	
	<div images-loaded="imgLoadedEvents">
	
		<img src="kittens.jpg">
	
	</div>
