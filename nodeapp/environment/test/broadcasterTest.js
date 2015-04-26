/**
 * Created by tsarpf on 4/26/15.
 */


var should = require('should');
var broadcaster = require('../server/broadcaster');

describe('broadcaster', function() {

    var count = 0;
    var testObj = 'testmessage';
    var getMockSock = function(emit) {
        var obj = {
            id: ++count
        };
        if(emit) {
            obj.emit = emit
        }
        else {
            obj.emit = function (message) {
                message.should.equal(testObj);
                console.log(obj.id + ' got message');
            }
        }

        return obj;
    };

    var testChannel = 'testtest';
    it('should broadcast to added users', function() {
        broadcaster.add(testChannel, getMockSock());
        broadcaster.add(testChannel, getMockSock());
        broadcaster.add(testChannel, getMockSock());
        broadcaster.broadcast(testChannel, testObj);
    });

    it('shouldn\'t broadcast to a removed user', function() {
        var sock = getMockSock(function(msg) {
            should.fail('not to be called');
        });
        broadcaster.add(testChannel, sock);
        broadcaster.remove(testChannel, sock);
        broadcaster.broadcast(testChannel, testObj);
    });

    it('shouldn\'t broadcast to user that has quit', function() {
        var sock = getMockSock(function(msg) {
            should.fail();
        });

        broadcaster.add(testChannel, sock);
        broadcaster.quit(sock);
        broadcaster.broadcast(testChannel, testObj);
    });
});
