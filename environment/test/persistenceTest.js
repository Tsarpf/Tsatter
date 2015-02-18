/**
 *
 * Created by Tsarpf on 2/15/15.
 */

var should = require('should'),
    mongoose = require('mongoose'),
    Channel = require('../app/models/channel');
    persistenceHandler = require('../server/persistence');


var testNick = 'tester';
var testMessage = 'hello world';

var urls = ['http://google.com', 'http://github.com', 'http://imgur.com'];
var testMessageWithUrl = 'hello world and a merry ' + urls[0] + ' to you too.';
var testMessageWithUrls = 'a merry ' + urls[1] + ' to you ' + urls[2];


var testChannel = '#achannelthingy';

describe('persistence handler', function() {
    before(function(done) {
        var options = {
            server: {
                socketOptions: {keepalive: 1}
            }
        };
        var url;
        if(process.env.TRAVIS) {
            url = 'mongodb://localhost/';
        }
        else {
            url = 'mongodb://db_1/';
        }
        mongoose.connection.on('connected', function() {
            done();
        });

        //Remove old test stuff
        Channel.find({name: testChannel}).remove().exec();

        if(mongoose.connection.readyState < 1) {
            mongoose.connect(url, options);
        }
        else {
            done();
        }
    });

    after(function() {
        Channel.find({name: testChannel}).remove().exec();
    });

    it('shouldn\'t find channels that do not exist', function(done) {
        Channel.find({name: testChannel}).exec(function(err, docs) {
            docs.length.should.equal(0);
            done();
        });
    });

    it('should create a new channel when none is found and a new message is saved', function(done) {
        persistenceHandler.saveMessage(testChannel, testNick, testMessage, function() {
            Channel.find({name: testChannel}).exec(function(err, docs) {
                docs.length.should.above(0);
                done();
            });
        });
    });

    it('should persist messages without urls', function(done) {
        persistenceHandler.saveMessage(testChannel, testNick, testMessage, function() {
            Channel.findOne({name: testChannel}).exec(function(err, doc) {
                doc.messages.length.should.equal(2);
                doc.messages[0].message.should.equal(testMessage);
                done();
            });
        });
    });

    it('should find urls correctly', function(done) {
        var testUrls = persistenceHandler.getUrls(testMessageWithUrls);
        testUrls[0].should.equal(urls[1]);
        testUrls[1].should.equal(urls[2]);
        done();
    });

    it('should persist both a message and an url from a message with a url', function(done) {
        persistenceHandler.saveMessage(testChannel, testNick, testMessageWithUrl, function() {
            Channel.findOne({name: testChannel}).exec(function(err, doc) {
                doc.messages.length.should.equal(3);
                doc.messages[doc.messages.length - 1].message.should.equal(testMessageWithUrl);
                doc.imageUrls[0].should.equal(urls[0]);
                done();
            });
        });
    });

    it('should persist both a message and urls from a message with multiple urls', function(done) {
        persistenceHandler.saveMessage(testChannel, testNick, testMessageWithUrls, function() {
            Channel.findOne({name: testChannel}).exec(function(err, doc) {
                doc.messages[doc.messages.length - 1].message.should.equal(testMessageWithUrls);
                doc.imageUrls[doc.imageUrls.length - 1].should.equal(urls[2]);
                doc.imageUrls[doc.imageUrls.length - 2].should.equal(urls[1]);
                done();
            });
        });
    });

    it('should return as many messages as are available if more are requested', function(done) {
        persistenceHandler.getMessages(testChannel, 6, function(messages) {
            messages.length.should.equal(4);
            done();
        })
    });

    it('should update channel last updated field when message is added', function(done) {
        persistenceHandler.saveMessage(testChannel, testNick, testMessageWithUrl, function() {
            Channel.findOne({name: testChannel}).exec(function(err, doc) {
                var maxMillisecondsSince = 100;
                (Date.now() - doc.lastUpdated).should.be.below(maxMillisecondsSince);
                done();
            });
        });
    });

    it('shouldn\'t return more messages than what was requested', function(done) {
        persistenceHandler.saveMessage(testChannel, testNick, testMessage, function() {
            persistenceHandler.getMessages(testChannel, 1, function (messages) {
                messages.length.should.equal(1);
                persistenceHandler.saveMessage(testChannel, testNick, testMessage, function() {
                    persistenceHandler.getMessages(testChannel, 3, function (messages) {
                        messages.length.should.equal(3);
                        done();
                    });
                });
            });
        });
    });

    it('should give a list of active channels', function(done) {
        persistenceHandler.loadActiveChannels(function() {
            persistenceHandler.getActiveChannels(0,50, function(err, results) {
                console.log(results);
                results.length.should.be.above(3);
                done();
            });
        });
    });

});



