/**
 *
 * Created by tsarpf on 4/5/15.
 */


global.TS_TESTING = 'testing';
var should = require('should');
var mongoose = require('mongoose');
//var Images = require('../app/models/images');
var imageProcessor = require('../server/imageProcessor');

describe('image saving to database', function () {
    before(function (done) {
        var options = {server: {socketOptions: {keepAlive: 1}}};
        var connection = mongoose.createConnection('mongodb://db_1/', options)
        connection.once('open', function(cb) {
            done();
        });
    });
    after(function () {
        // runs after all tests in this block
    });
    beforeEach(function () {
        // runs before each test in this block
    });
    afterEach(function () {
        // runs after each test in this block
    });
    // test cases

    it('should increment stuff', function () {
        [1, 2, 3][0].should.equal(1);
    });
});
