/**
 * Created by root on 5/8/15.
 */

module.exports = function(config) {
    config.set({
        frameworks: ['mocha'],

        files: [
            'public/libs/angular/angular.js',
            'public/js/**/*.js'
        ],

        browsers: ['Firefox']
    });
};