/**
 *
 * Created by tsarpf on 4/14/15.
 */



describe('image size minifying', function () {
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
    it('should increment stuff', function (done) {
        var worker = cluster.fork();
        worker.on('message', function(msgObj) {
            console.log('message from worker');
            console.log(msgObj);
            worker.kill();
            done();
        });
        function messageHandler (msg) {
            console.log('got message from worker');
            console.log(msg);
        }
        worker.send({
            url: images[0],
            channel: testChannel
        });
    });
});
