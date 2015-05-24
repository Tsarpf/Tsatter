/**
 * Created by tsarpf on 4/26/15.
 */


var should = require('should');
var broadcaster = require('../server/broadcaster');

describe('broadcaster', function() {

    var count = 0;
    var testObj = 'testmessage';
    var testChannel = 'testtest';
    var getMockSock = function(emit) {
        var obj = {
            id: ++count
        };
        if(emit) {
            obj.emit = emit
        }
        else {
            obj.emit = function (channel, message) {
                message.should.equal(testObj);
                channel.should.equal(testChannel);
                console.log(obj.id + ' got message');
            }
        }
        return obj;
    };

    it('should broadcast to added users', function() {
        broadcaster.add(testChannel, getMockSock());
        broadcaster.add(testChannel, getMockSock());
        broadcaster.add(testChannel, getMockSock());
        broadcaster.broadcast(testChannel, testObj);
    });

    it('shouldn\'t broadcast to a removed user', function() {
        var sock = getMockSock(function() {
            should.fail('not to be called');
        });
        broadcaster.add(testChannel, sock);
        broadcaster.remove(testChannel, sock);
        broadcaster.broadcast(testChannel, testObj);
    });

    it('shouldn\'t broadcast to user that has quit', function() {
        var sock = getMockSock(function() {
            should.fail();
        });

        broadcaster.add(testChannel, sock);
        broadcaster.quit(sock);
        broadcaster.broadcast(testChannel, testObj);
    });

    it('shouldn\'t broadcast to same user multiple times if added multiple times to a channel', function() {
        var count = 0;
        var sock = getMockSock(function() {
            count++;
            if(count >= 2) {
                should.fail();
            }
        });

        broadcaster.add(testChannel, sock);
        broadcaster.add(testChannel, sock);

        broadcaster.broadcast(testChannel, testObj);
    });
});
