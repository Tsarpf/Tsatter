var port = 4000;
var should = require('should'),
    server = require('../tsatterServer')({port: port}),
    client = require('socket.io-client'),
    request = require('request'),
    requestSuper = require('supertest'),
    setCookie = require('../setSocketHandshakeCookies'),
    agent = requestSuper.agent(app);


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

describe('Server', function() {
    var fstSock, sndSock;
    var testRoom = "TESTROOM";
    var testMsg = "yeah testing yay";
    var username = "testuser9001";
    var password = "testpassword";
    var cookies;
    var url = 'http://127.0.0.1:' + port;
    beforeEach(function(done){

        //Get a different session for each test
        cookies = request.jar();
        setCookie(cookies);
        request.post({
            jar: cookies,
            url: url + '/login',
            form: {username: username, password: password}
        }, function(){
            var cookieVal = cookies.cookies[0].value;
            var options = {
                forceNew: true,
                query: "cookie=" + cookieVal
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
    });
    afterEach(function(){
        fstSock.disconnect();
        sndSock.disconnect();
      // runs after each test in this block
    });

    it('shoulddawouldda', function(done) {
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

        //If the registration fails it's because the user already exists. That's ok
        fstSock.on('registerSuccess', function() {
            fstSock.emit('join', {room: testRoom}, function(data) {
            });
        });
        fstSock.on('registerFail', function(regData) {
            console.log(regData);
            fstSock.emit('join', {room: testRoom}, function(data) {
            });
        });
        fstSock.emit('register', {username: username, password: password});
    });

    it('should have it\'s tests beforeEach fixed if /login starts returning more than 1 cookie', function() {
        cookies.cookies.length.should.equal(1);
    });

    it('should return a username starting with anon on hello', function(done) {
        fstSock.emit('hello', {}, function(data) {
            data.username.indexOf('anon').should.equal(0);
            done();
        });
    });



});

