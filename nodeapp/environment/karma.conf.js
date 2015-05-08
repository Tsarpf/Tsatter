/**
 * Created by root on 5/8/15.
 */

module.exports = function(config) {
    config.set({
        frameworks: ['mocha'],

        files: [
            'public/js/**/*.js'
        ],

        browsers: ['Chrome'],
    });
};