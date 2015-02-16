var port = 3000;
var should = require('should'),
    server = require('../server/tsatterServer')({port: port}),
    client = require('socket.io-client'),
    request = require('request'),
    requestSuper = require('supertest'),
    setCookie = require('./setSocketHandshakeCookies'),
    agent = requestSuper.agent(server.app);

if(!process.env.TRAVIS) {
    describe('Server', function () {
        var fstSock, sndSock;
        var testChannel = "#TESTROOM";
        var testMsg = "yeah testing yay";
        var username = "testuser9001";
        var password = "testpassword";
        var cookies;
        var url = 'http://127.0.0.1:' + port;

        this.timeout(5000);

        beforeEach(function (done) {
            var options = {
                forceNew: true,
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


        it('should register', function (done) {
            fstSock.on('message', function (data) {
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
                data.command.should.equal('JOIN');
                data.args[0].should.equal(testChannel);
                done();
            });
        });

        it('should transmit messages', function (done) {
            fstSock.on('message', function (data) {
                if (data.command === 'rpl_welcome') {
                    fstSock.send({command: ['join', testChannel]});
                    return;
                }
            });
            sndSock.on('message', function (data) {
                if (data.command === 'rpl_welcome') {
                    sndSock.send({command: ['join', testChannel]});
                    return;
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
}

describe('File serving', function() {
    it('should load a page containing Tsatter when requesting index', function(done) {
        agent
        .get('/')
        .expect('Content-Type', /html/)
        .expect(/Tsatter/)
        .expect(200)
        .end(done)
    });
});
