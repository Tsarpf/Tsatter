var should = require('should');

describe('hooks', function() {
  before(function() {
    // runs before all tests in this block
  })
  after(function(){
    // runs after all tests in this block
  })
  beforeEach(function(){
    // runs before each test in this block
  })
  afterEach(function(){
    // runs after each test in this block
  })
  // test cases

    it('should pass', function() {
        [1,2,3][0].should.equal(1);
    });
})
