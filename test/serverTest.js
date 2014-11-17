var port = 4000;
var should = require('should'),
    server = require('../tsatterServer')({port: port}),
    client = require('socket.io-client'),
    request = require('request'),
    requestSuper = require('supertest'),
    setCookie = require('../setSocketHandshakeCookies'),
    agent = requestSuper.agent(app);

describe('Server', function() {
    var fstSock, sndSock;
    var testRoom = "TESTROOM";
    var testMsg = "yeah testing yay";
    var username = "testuser9001";
    var password = "testpassword";
    var cookies;
    var url = 'http://127.0.0.1:' + port;


    beforeEach(function(done){
        var options = {
            forceNew: true,
        }
        fstSock = client(url, options);
        sndSock = client(url, options);
        fstSock.on('connect', function() {
            done();
        });
        fstSock.on('error', function(obj) {
            console.log('error');
            console.log(obj);
        });
        fstSock.on('disconnect', function(obj) {
        });
    });
    afterEach(function(){
        fstSock.disconnect();
        sndSock.disconnect();
    });

    it("shouldn't transmit messages between users in different rooms", function(done) {
        var testRoomOther = testRoom + 'other';
        fstSock.on(testRoom, function(data) {
            data.message.should.endWith('joined room');
        });
        fstSock.on(testRoomOther, function(data) {
            assert(false);
            data.message.should.endWith('joined room');
        });
        sndSock.on('joinSuccess', function(data) {
            sndSock.emit('message', {message: testMsg, room: testRoomOther});
            sndSock.emit('message', {message: testMsg, room: testRoom});
            setTimeout(function(){
                done();
            }, 1000);
        });
        fstSock.on('joinSuccess', function(data) {
            sndSock.emit('join', {room: testRoomOther});
        });
        fstSock.emit('join', {room: testRoom}, function(data) {
        });
    });

    it('should transmit messages between users in the same room', function(done) {
        this.timeout(6000);
        var msgs = [];
        fstSock.on(testRoom, function(data) {
            msgs.push(data.message);
            if(msgs.length === 2) {
                msgs[0].should.endWith('joined room');
                msgs[1].should.be.exactly(testMsg);
                done();
            }
        });
        sndSock.on('joinSuccess', function(data) {
            sndSock.emit('message', {message: testMsg, room: testRoom});
        });
        fstSock.on('joinSuccess', function(data) {
            sndSock.emit('join', {room: testRoom});
        });
        fstSock.emit('join', {room: testRoom}, function(data) {
        });

    });

    it('should return a username starting with anon on hello', function(done) {
        fstSock.emit('hello', {}, function(data) {
            data.username.indexOf('anon').should.equal(0);
            done();
        });
    });

    it('should return registerFail when trying to register without password', function(done) {
        fstSock.on('registerFail', function(data) {
            done();
        });
        fstSock.emit('register', {username: 'test', password: ''});
    });

    it('should return registerFail when trying to register without username', function(done) {
        fstSock.on('registerFail', function(data) {
            done();
        });
        fstSock.emit('register', {username: '', password: 'derp'});
    });

    it('should return registerFail when completely missing username field', function(done) {
        fstSock.on('registerFail', function(data) {
            done();
        });
        fstSock.emit('register', {password: 'derp'});
    });
    it('should return registerFail when completely missing password field', function(done) {
        fstSock.on('registerFail', function(data) {
            done();
        });
        fstSock.emit('register', {username: 'test'});
    });
    it('should return joinFail when trying to join a channel without a name', function(done) {
        fstSock.on('joinFail', function(data) {
            done();
        });
        fstSock.emit('join', {room: ''});
    });
    it('should return joinFail when client sends a join event but doesn\'t supply a room name', function(done) {
        fstSock.on('joinFail', function(data) {
            done();
        });
        fstSock.emit('join', {});
    });


});

describe('File serving', function() {
    it('should load a page containing Tsattr when requesting index', function(done) {
        agent
        .get('/')
        .expect('Content-Type', /html/)
        .expect(/Tsattr/)
        .expect(200)
        .end(done)
    });
});
