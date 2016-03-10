/**
 *
 * Created by root on 6/1/15.
 */
var should = require('should');
var timerLib = require('../timer');

describe('timer', function() {
    it('should return false for spam', function() {
        var window = 5000,
            limit = 6;
        var timer = timerLib(window, limit);

        for(var i = 0; i < limit - 1; i++) {
            timer.hit().should.equal(true);
        }
        timer.hit().should.equal(false);
    });

    function callAfter(fn, time, callback) {
        setTimeout(function(fn) {
            callback(fn());
        }, time, fn);
    }

    it('should allow for one message per quarter second with window 1 sec, limit 5', function(done) {
        this.timeout(2000);
        var window = 1000,
            limit = 5;
        var timer = timerLib(window, limit);

        timer.hit();

        callAfter(timer.hit, 250, function(result) {
            result.should.equal(true);
        });
        callAfter(timer.hit, 500, function(result) {
            result.should.equal(true);
        });
        callAfter(timer.hit, 750, function(result) {
            result.should.equal(true);
        });
        callAfter(timer.hit, 1100, function(result) {
            result.should.equal(true);
            timer.hit().should.equal(false);
            done();
        });
    });

    it('should be able to send 3 messages', function(done) {
        var window = 500;
        var limit = 4;
        var timer = timerLib(window, limit);
        for(var i = 0; i < limit - 1; i++) {
            timer.hit().should.equal(true);
        }
        done();
    });
});
