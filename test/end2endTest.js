var port = 4000;
var should = require('should'),
    server = require('../tsatterServer')({port: port}),
    client = require('socket.io-client');


describe('End to end messaging should work', function() {
    var fstSock, sndSock;
    var testRoom = "TESTROOM";
    beforeEach(function(){
        fstSock = client('http://localhost:' + port);
        sndSock = client('http://localhost:' + port);
    })
    afterEach(function(){
        fstSock.disconnect();
        sndSock.disconnect();
      // runs after each test in this block
    })

    it('', function(done) {
        fstSock.emit 
        done();
    });
});

