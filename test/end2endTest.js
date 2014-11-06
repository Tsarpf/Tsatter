var should = require('should'),
    server = require('../tsatterServer'),
    client = require('socket.io-client');

describe('End to end messaging should work', function() {
    var port = server.address().port;
    var fstSock, sndSock;
    beforeEach(function(){
        fstSock = client('http://localhost:' + port);
        sndSock = client('http://localhost:' + port);

    })
    afterEach(function(){
        fstSock.disconnect();
        sndSock.disconnect();
      // runs after each test in this block
    })

    it('should do something', function(done) {
        fstSock.emit('moi');
    });
});

