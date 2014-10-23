var expect = require('chai').expect;

describe('The module', function () {
  it('should be requirable', function () {
    require('..');
  })

  it('should be a function', function () {
    var WriteRead = require('..');
    expect(WriteRead).to.be.a('function');
  });
})
