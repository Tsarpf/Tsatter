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

    it('shouldnt\'t find channels that do not exist', function(done) {
        Channel.find({name: testChannel}).exec(function(err, docs) {
            docs.length.should.equal(0);
            done();
        });
    });

    it('should persist messages without urls', function(done) {
        persistenceHandler.saveMessage(testChannel, testNick, testMessage, function() {
            //asdf
            Channel.find({name: testChannel}).exec(function(err, docs) {
                docs.length.should.above(0);
                done();
            });
        });
    });
});



