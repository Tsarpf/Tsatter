/**
 *
 * Created by Tsarpf on 2/15/15.
 */

var should = require('should'),
    mongoose = require('mongoose'),
    Channel = require('../app/models/channel');
    persistenceHandler = require('../server/persistenceHandler');


var testNick = "tester";
var testMessage = "hello world";
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

    it('should return as many messages as are available if more is requested', function(done) {
        persistenceHandler.getMessages(testChannel, 5, function(messages) {
            messages.length.should.equal(2);
            done();
        })
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
    //it (the persister) should be able to return a bunch of messages upon request

    //make an another file for channel activity order tracker that uses redis etc for maximum O(1) awesomeness

});



