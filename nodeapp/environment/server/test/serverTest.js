var port = 3000;
var should = require('should'),
    persistence = require('../persistence')(),
    server = require('../tsatterServer')({port: port}, persistence),
    broadcaster = require('../broadcaster'),
    spamProtect = {
        isSpamming: function() {}
    },
    imageProcessor = {
        processUrls: function() {}
    },
    sockets = require('../sockets')(broadcaster, persistence, imageProcessor, server, spamProtect),
    client = require('socket.io-client'),
    Channel = require('../../app/models/channel');

describe('Server full system', function () {
    var fstSock, sndSock;
    var testChannel = "#TESTROOM";
    var testMsg = "yeah testing yay";
    var username = "testuser9001";
    var password = "testpassword";
    var cookies;
    var url = 'http://127.0.0.1:' + port;

    this.timeout(10000);

    beforeEach(function (done) {
        var options = {
            forceNew: true
        };
        fstSock = client(url, options);
        sndSock = client(url, options);
        fstSock.on('connect', function () {
            done();
        });
        fstSock.on('error', function (obj) {
            console.log('error');
            console.log(obj);
        });
        fstSock.on('disconnect', function (obj) {
        });
    });
    afterEach(function () {
        fstSock.disconnect();
        sndSock.disconnect();
    });

    after(function() {
        Channel.find({name: testChannel}).remove().exec();
    });


    it('should register', function (done) {
        fstSock.on('message', function (data) {
            if(data.command === 'err_nomotd' || data.command === 'USERCOUNT') {
                return;
            }
            data.command.should.equal('rpl_welcome');
            done();
        });
    });

    it('should join channel', function (done) {
        fstSock.on('message', function (data) {
            if (data.command === 'rpl_welcome') {
                fstSock.send({command: ['join', testChannel]});
                return;
            }
            else if(data.command === 'err_nomotd' || data.command === 'USERCOUNT') {
                return;
            }
            data.command.should.equal('JOIN');
            data.args[0].should.equal(testChannel);
            done();
        });
    });

    it('should transmit messages', function (done) {
        fstSock.on('message', function (data) {
            if (data.command === 'rpl_welcome') {
                fstSock.send({command: ['join', testChannel]});
            }
        });
        sndSock.on('message', function (data) {
            if (data.command === 'rpl_welcome') {
                sndSock.send({command: ['join', testChannel]});
            }
        });

        var ready = false;
        var emitter = function (cb) {
            if (ready) {
                cb();
            }
            else {
                setTimeout(emitter(cb), 50);
            }
        };

        fstSock.on(testChannel, function (data) {
            ready = true;
            if (data.command === 'PRIVMSG') {
                data.args[1].should.equal(testMsg);
                done();
            }
        });

        sndSock.on(testChannel, function (data) {
            setTimeout(emitter(function () {
                var obj = {channel: testChannel, message: testMsg};
                sndSock.emit('privmsg', obj);
            }), 0);
        });


    });

});
