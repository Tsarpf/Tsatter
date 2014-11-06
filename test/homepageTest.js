var port = 4000;
var should = require('should'),
    mongoose = require('mongoose'),
    test_model = require('../app/models/testModel'),
    TestModel = mongoose.model('Test'),
    serverObj = require('../tsatterServer')({port: port}), //require server so mongoose etc server stuff is initialzied
    server = serverObj.server;
    app = serverObj.app;
    request = require('supertest'),
    agent = request.agent(app);
    

var testAuthor = "tester";
var testLine = "hello world";
var getTestModel = function() {
    return test = TestModel({
        author: testAuthor,
        line: testLine
    });
}
describe('File serving', function() {
    before(function(done) {
       do {
       }
       while(mongoose.connection.readyState < 1);

       //TestModel.find({line: testLine}).remove().exec();
       done();
    });

    it('should load a page containing Tsattr when requesting index', function(done) {
        agent
        .get('/')
        .expect('Content-Type', /html/)
        .expect(/Tsattr/)
        .expect(200)
        .end(done)
    });

    after(function() {
    });
});





