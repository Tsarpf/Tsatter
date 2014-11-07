var port = 4000;
var should = require('should'),
    server = require('../tsatterServer')({port: port}),
    client = require('socket.io-client'),
    request = require('request'),
    setCookie = require('../setSocketHandshakeCookies');


describe('Server', function() {
    var fstSock, sndSock;
    var testRoom = "TESTROOM";
    var testMsg = "yeah testing yay";
    var cookies;
    var url = 'http://127.0.0.1:' + port;
    beforeEach(function(done){
        var options = {
            forceNew: true
        }

        //Get a different session for each test
        cookies = request.jar();
        setCookie(cookies);
        request.post({
            jar: cookies,
            url: url + '/login',
            form: {username: 'teitsi', password: 'meitsi'}
        }, function(){
            var cookieVal = cookies.cookies[0].value;
            fstSock = client(url + '/?cookie=' + cookieVal, options);
            sndSock = client(url + '/?cookie=' + cookieVal, options);
            fstSock.on('connect', function() {
                done();
            });
            fstSock.on('error', function(obj) {
                console.log('error');
                console.log(obj);
            });
            fstSock.on('disconnect', function(obj) {
                console.log('disconnect');
                console.log(obj);
            });
        });
    });
    afterEach(function(){
        fstSock.disconnect();
        sndSock.disconnect();
      // runs after each test in this block
    });

    it('shoulddawouldda', function(done) {
        this.timeout(3000);
        fstSock.on(testRoom, function(data) {
            console.log('got message');
            console.log(data);
            data.message.should.equal(testMsg);
            done();
        });
        fstSock.on('testi', function(data) {
            console.log('testattu ja toimii');
            console.log(data);
            done();
        });
        sndSock.on('joinSuccess', function(data) {
            console.log('second join success');
            sndSock.emit('message', {message: testMsg, room: testRoom});
        });
        fstSock.on('joinSuccess', function(data) {
            sndSock.emit('join', {room: testRoom});
        });
        fstSock.emit('join', {room: testRoom}, function(data) {
            console.log('client join data');
            console.log(data);
        });
        /*
        fstSock.emit('login', {username: 'teitsi', password: 'meitsi'}, function() {
        });
        */
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

