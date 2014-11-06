var port = 4000;
var should = require('should'),
    server = require('../tsatterServer')({port: port}),
    client = require('socket.io-client');


describe('End to end messaging should work', function() {
    var fstSock, sndSock;
    var testRoom = "room test 9001";
    var testMsg = "yeah testing yay";
    beforeEach(function(done){
        var options = {
            multiplex: false
        }
        fstSock = client('http://localhost:' + port, options);
        fstSock.on('connect', function() {
            done();
        });
        sndSock = client('http://localhost:' + port, options);
    });
    afterEach(function(){
        fstSock.disconnect();
        sndSock.disconnect();
      // runs after each test in this block
    });

    it('should return a username starting with anon on hello', function(done) {
        fstSock.emit('hello', {}, function(data) {
            data.username.indexOf('anon').should.equal(0);
            done();
        });
    });



    it('shoulddawouldda', function(done) {
        fstSock.on(testRoom, function(data) {
            console.log('got message');
            data.message.should.equal(testMsg);
            done();
        });
        fstSock.on('testi', function(data) {
            console.log('testattu ja toimii');
        });
        sndSock.on('joinSuccess', function(data) {
            console.log('second join success');
            sndSock.emit('message', {message: testMsg, room: testRoom});
        });
        fstSock.on('joinSuccess', function(data) {
            sndSock.emit('join', {room: testRoom});
        });
        fstSock.emit('join', {room: testRoom});
    });
});

