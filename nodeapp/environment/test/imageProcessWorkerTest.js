/**
 *
 * Created by tsarpf on 4/14/15.
 */


var fs = require('fs');

describe('image download and minify', function () {
    var images = [
        'http://i.imgur.com/TtdbUJZ.jpg',
        'http://i.imgur.com/CuvkjnG.jpg',
        'http://i.imgur.com/vBbLC8M.jpg',
        'https://peach.blender.org/wp-content/uploads/bbb-splash.png',
        'http://i.imgur.com/TvOqm5D.gif'
    ];

    before(function () {
    });
    after(function () {
    });
    beforeEach(function () {
    });
    afterEach(function () {
    });

    var cluster = require('cluster');
    cluster.setupMaster({
        exec: __dirname + '../server/imageProcessWorker.js'
    });

    var testChannel = 'testchannel123';
    it('should generate a jpg file', function (done) {
        this.timeout(5000);
        var worker = cluster.fork();
        worker.on('message', function(msgObj) {
            fs.existsSync(msgObj.thumbnail).should.equal(true);
            worker.kill();
            done();
        });
        worker.send({
            url: images[0],
            channel: testChannel,
            messageIdx: 0
        });
    });

    it('should generate a png file', function (done) {
        this.timeout(5000);
        var worker = cluster.fork();
        worker.on('message', function(msgObj) {
            fs.existsSync(msgObj.thumbnail).should.equal(true);
            worker.kill();
            done();
        });
        worker.send({
            url: images[3],
            channel: testChannel,
            messageIdx: 0
        });
    });

    it('should generate a gif file', function (done) {
        this.timeout(5000);
        var worker = cluster.fork();
        worker.on('message', function(msgObj) {
            fs.existsSync(msgObj.thumbnail).should.equal(true);
            worker.kill();
            done();
        });
        worker.send({
            url: images[4],
            channel: testChannel,
            messageIdx: 0
        });
    });
});
