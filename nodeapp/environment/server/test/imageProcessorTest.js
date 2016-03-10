/**
 *
 * Created by tsarpf on 4/5/15.
 */


var should = require('should');
var mongoose = require('mongoose');


var urls = ['http://i.imgur.com/Bz9fanO.gif', 'http://i.imgur.com/UBs2heD.gif'];
var tooBigUrl = 'http://i.imgur.com/L76A4TV.gif'; //47-49 mb or something
urls.push(tooBigUrl);

var testChannel = '#achannelthingy';
var broadcaster = require('../broadcaster');

describe('image saving to database', function () {
    this.timeout(5000);
    /*
    before(function (done) {
        var options = {server: {socketOptions: {keepAlive: 1}}};
        var connection = mongoose.createConnection('mongodb://db_1/', options)
        connection.once('open', function(cb) {
            done();
        });
    });
    after(function () {
    });
    beforeEach(function () {
    });
    afterEach(function () {
    });
     */

    it('should call save persistence\'s save to db twice after images processed', function (done) {
        this.timeout(20000);
        var mockupPersistence = {};
        var count = 0;
        mockupPersistence.saveProcessedImagePathToDB = function(originalUrl, thumbnailUrl, channel, messageIdx) {
            count++;
            if(count === 3) {
                should.fail('we downloaded and processed an image that is too big!');
            }
            if(count === 2) {
                done();
            }
        };
        var imageProcessor = require('../imageProcessor')(mockupPersistence, broadcaster);
        var messageIdx = 0;
        imageProcessor.processUrls(urls, testChannel, messageIdx);
    });
});
