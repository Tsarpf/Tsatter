var should = require('should'),
    mongoose = require('mongoose'),
    test_model = require('../app/models/testModel'),
    TestModel = mongoose.model('Test')
    

var testAuthor = "tester";
var testLine = "hello world";
var getTestModel = function() {
    return test = TestModel({
        author: testAuthor,
        line: testLine
    });
}
describe('mongoose', function {
    before(function() {
       do {
       }
       while(mongoose.connection.readyState < 1);

       TestModel.find({line: testLine}).remove().exec();
       done();
    });

    it('should have a working connection', function() {
        mongoose.connection.readyState.should.above(0);
    });

    it('should instantiate TestModel objects', function(done) {
       var test = getTestModel();
       test.should.be.ok
       test.should.have.property('author', testAuthor);
       test.should.have.property('line', testLine);
    });

    it('should be able to save documents', function() {
        var test = getTestModel();
        test.save(function (err, docs) {
            (err === null).should.be.true;
            done();
        });
    });

    it('... and then find those saved documents', function() {
        TestModel.find({line: testLine}).exec(function(err, docs) {
            if(err)
            {
                console.log("Error!: " + err);
            }
            docs.length.should.above(0);
            done();
        });
    });
});





