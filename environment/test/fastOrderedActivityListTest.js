/**
 * Created by Tsarpf on 2/17/15.
 */

var should = require('should');
var activityList = require('../server/fastOrderedActivityList');

describe('fast ordered activity list', function() {
    it('should return correct top when adding 5 new channels', function() {
        activityList.updateList('test0');
        activityList.updateList('test1');
        activityList.updateList('test2');
        activityList.updateList('test3');
        activityList.updateList('test4');

        var arr = activityList.getTop(5);

        arr[0].should.equal('test4');
        arr[1].should.equal('test3');
        arr[2].should.equal('test2');
        arr[3].should.equal('test1');
        arr[4].should.equal('test0');
    });

    it('should return correct top when updating existing channels', function() {
        activityList.updateList('test4');
        activityList.updateList('test4');
        activityList.updateList('test4');

        var arr = activityList.getTop(5);

        arr[0].should.equal('test4');
        arr[1].should.equal('test3');
        arr[2].should.equal('test2');
        arr[3].should.equal('test1');
        arr[4].should.equal('test0');


        activityList.updateList('test0');
        activityList.updateList('test0');
        activityList.updateList('test0');

        arr = activityList.getTop(5);

        arr[0].should.equal('test0');
        arr[1].should.equal('test4');
        arr[2].should.equal('test3');
        arr[3].should.equal('test2');
        arr[4].should.equal('test1');
    });

    it('should have correct top2 when updating list with a non pre-existing channel', function() {
        activityList.updateList('test5');
        var arr = activityList.getTop(2);
        arr[0].should.equal('test5');
        arr[1].should.equal('test0');
    });

    it('should have correct top3 when updating list with a pre-existing channel', function() {
        activityList.updateList('test3');
        var arr = activityList.getTop(3);
        arr[0].should.equal('test3');
        arr[1].should.equal('test5');
        arr[2].should.equal('test0');
    });

    it('should not have duplicates', function() {
        var arr = activityList.getTop(100);
        var map = {};
        for(var i = 0; i < arr.length; i++) {
            map.should.not.have.property(arr[i]);
            map[arr[i]] = 1;
        }
    });

    it('should return all available channels when asking for more than what is available', function() {
        var arr = activityList.getTop(100);
        arr.length.should.equal(6);
    });
});
