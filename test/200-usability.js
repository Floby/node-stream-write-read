var path = require('path');
var fs = require('graceful-fs');
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

    it('should return itself for chaining', function () {
      var cache = WriteRead(file);
      var actual = cache.affect(sinon.spy());
      assert.equal(actual, cache, 'affect() did not return itself')
    });
  });

  describe('option delayOpen', function () {
    before(function () {
      sinon.spy(fs, 'createWriteStream');
    });
    after(function () {
      fs.createWriteStream.restore();
    })
    it('should wait for an explicit call to open() before opening the file', function (done) {
      var cache = WriteRead(file, {delayOpen: true});
      assert(!fs.createWriteStream.called, 'createWriteStream should not get called');
      cache.write('Hello ');
      setTimeout(function () {
        cache.open();
        cache.end('World');
        cache.on('end', function () {
          assert(fs.createWriteStream.calledOnce, 'createWriteStream should have been called');
          var contents = fs.readFileSync(file, 'utf8');
          assert.equal(contents, 'Hello World')
          done();
        }).resume();
      }, 20);
    });
  })
})
