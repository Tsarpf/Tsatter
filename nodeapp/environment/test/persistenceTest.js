/**
 *
 * Created by Tsarpf on 2/15/15.
 */

var should = require('should'),
    mongoose = require('mongoose'),
    Channel = require('../app/models/channel');


var testNick = 'tester';
var testMessage = 'hello world';

var urls = ['http://i.imgur.com/Bz9fanO.gif', 'http://i.imgur.com/UBs2heD.gif', 'http://i.imgur.com/L76A4TV.gif'];
var testMessageWithUrl = 'hello world and a merry ' + urls[0] + ' to you too.';
var testMessageWithUrls = 'a merry ' + urls[1] + ' to you ' + urls[2];


var testChannel = '#achannelthingy';

var persistenceHandler = require('../server/persistence')();

var testChannels = [
    '#achannelthingy',
    '#achannelthingy1',
    '#achannelthingy2',
    '#achannelthingy3',
    '#achannelthingy4',
    '#achannelthingy5',
    '#achannelthingy6',
    '#achannelthingy7',
    '#achannelthingy8'
];

var getPersistenceWithMockupProcessUrl = function(urls, channelName, idx) {
    return require('../server/persistence')({
            processUrls: function(resultUrls, channel, messageIdx) {
                console.log('called!');
                urls.should.deepEqual(resultUrls);
                channel.should.equal(channelName);
                messageIdx.should.equal(idx);
            }
        }
    );
};

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
        for(var channel in testChannels) {
            Channel.find({name: testChannels[channel]}).remove().exec();
        }

        if(mongoose.connection.readyState < 1) {
            mongoose.connect(url, options);
        }
        else {
            done();
        }
    });

    after(function() {
        for(var channel in testChannels) {
            Channel.find({name: testChannels[channel]}).remove().exec();
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

    it('should find urls correctly', function(done) {
        var testUrls = persistenceHandler.getUrls(testMessageWithUrls);
        testUrls[0].should.equal(urls[1]);
        testUrls[1].should.equal(urls[2]);
        done();
    });

    it('should call processUrls in imageProcessor when called with a message with a url', function(done) {
        persistenceHandler = require('../server/persistence')({
            processUrls: function(resultUrls, channel, messageIdx) {
                resultUrls[0].should.equal(urls[0]);
                channel.should.equal(testChannel);
                messageIdx.should.equal(2);
                persistenceHandler = require('../server/persistence')();
                done();
            }
        });

        persistenceHandler.saveMessage(testChannel, testNick, testMessageWithUrl);
    });

    it('should call processUrls with multiple urls when saving a singel message with multiple urls', function(done) {
        persistenceHandler = require('../server/persistence')({
            processUrls: function(resultUrls, channel, messageIdx) {
                resultUrls.length.should.equal(2);
                resultUrls[0].should.equal(urls[1]);
                resultUrls[1].should.equal(urls[2]);
                channel.should.equal(testChannel);
                messageIdx.should.equal(3);

                persistenceHandler = require('../server/persistence')();
                done();
            }
        });

        persistenceHandler.saveMessage(testChannel, testNick, testMessageWithUrls);
    });

    it('should return as many messages as are available if more are requested', function(done) {
        persistenceHandler.getMessages(testChannel, 0, 6, function(err, messages) {
            messages.length.should.equal(4);
            done();
        })
    });

    it('shouldn\'t return more messages than what was requested', function(done) {
        persistenceHandler.saveMessage(testChannel, testNick, testMessage, function() {
            persistenceHandler.getMessages(testChannel, 0, 1, function (err, messages) {
                messages.length.should.equal(1);
                persistenceHandler.saveMessage(testChannel, testNick, testMessage, function() {
                    persistenceHandler.getMessages(testChannel, 0, 3, function (err, messages) {
                        messages.length.should.equal(3);
                        done();
                    });
                });
            });
        });
    });

    it('should return the correct number of messages when asking for a range', function(done) {
        persistenceHandler.getMessages(testChannel, 3, 5, function(err, messages) {
            messages.length.should.equal(2);
            done();
        })
    });

    it('should return the correct messages when asking for the last ones', function(done) {
        persistenceHandler.getMessages(testChannel, 3, 5, function(err, messages) {
            messages.length.should.equal(2);
            done();
        })
    });

    it('should update channel last updated field when message is added', function(done) {
        persistenceHandler.saveMessage(testChannel, testNick, testMessage, function() {
            Channel.findOne({name: testChannel}).exec(function(err, doc) {
                var maxMillisecondsSince = 100;
                (Date.now() - doc.lastUpdated).should.be.below(maxMillisecondsSince);
                done();
            });
        });
    });

    it('should give a list of active channels in correct order', function(done) {
        persistenceHandler.saveMessage(testChannels[1], testNick, testMessage, function() {
            persistenceHandler.saveMessage(testChannels[2], testNick, testMessage, function() {
                persistenceHandler.saveMessage(testChannels[3], testNick, testMessage, function() {
                    persistenceHandler.getActiveChannels(0,50, function(err, results) {
                        results.length.should.be.above(3);
                        results[0].name.should.equal(testChannels[3]);
                        results[1].name.should.equal(testChannels[2]);
                        results[2].name.should.equal(testChannels[1]);

                        done();
                    });
                });
            });
        });
    });

    it('shouldn\'t give more messages or image urls when getting active channels than the channel has', function(done) {
        persistenceHandler.saveMessage(testChannels[6], testNick, testMessage, function() {
            persistenceHandler.getActiveChannels(0,1, function(err, results) {
                results[0].name.should.equal(testChannels[6]);
                results[0].messages.length.should.equal(1);
                results[0].imageUrls.length.should.equal(1);
                done();
            });
        });
    });

    it('should return an empty array when asking for messages from an empty channel', function(done) {
        persistenceHandler.getMessages('nonexistantchannel', 0, 1, function(err, results) {
            results.length.should.equal(0);
            done();
        });
    });

    it('should give correct idx\'s for channel messages', function(done) {
        persistenceHandler.getMessages(testChannel, 1, 6, function(err, messages) {
            messages.length.should.equal(5);
            messages[0].idx.should.equal(1);
            messages[4].idx.should.equal(5);
            done();
        })
    });

   it('should save image path etc to db', function(done) {
       persistenceHandler.saveProcessedImagePathToDB(urls[0], 'dumbnail', testChannel, 0);
       Channel.findOne({name: testChannel}).exec(function(err, doc) {
           doc.imageUrls[0].thumbnail.should.equal('dumbnail');
           doc.imageUrls[0].originalUrl.should.equal(urls[0]);
           doc.imageUrls[0].messageIdx.should.equal(0);
           done();
       });
   });
});



