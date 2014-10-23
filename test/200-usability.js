var path = require('path');
var fs = require('fs');
var sinon = require('sinon');
var assert = require('chai').assert;
var WriteRead = require('..');

function deleteIfExists (filename) {
  if(fs.existsSync(filename)) {
    fs.unlinkSync(filename);
  }
}

describe('a WriteRead stream', function () {
  var file = path.join(__dirname, 'output.test');

  beforeEach(deleteIfExists.bind(null, file));
  after(deleteIfExists.bind(null, file));

  describe('.affect()', function () {
    it('should call the callback with this set to the current object', function () {
      var cache = WriteRead(file);
      var callback = sinon.spy();

      cache.affect(callback);

      assert.equal(callback.callCount, 1, 'should be called only once');
      var call = callback.getCall(0);
      assert.equal(call.thisValue, cache, 'should be called on the WriteRead stream');
    });
  });
})
