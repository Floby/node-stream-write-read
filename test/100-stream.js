var fs = require('fs');
var path = require('path');
var expect = require('chai').expect;
var sink = require('stream-sink');

var WriteRead = require('..');

function deleteIfExists (filename) {
  if(fs.existsSync(filename)) {
    fs.unlinkSync(filename);
  }
}

describe('the WriteRead stream', function () {
  var file = path.join(__dirname, 'output.test');

  beforeEach(deleteIfExists.bind(null, file));
  after(deleteIfExists.bind(null, file));

  it('should write the contents to a file', function (done) {
    var cache = WriteRead(file);
    cache.on('finish', assertions);

    cache.write('Hello World!');
    cache.end();

    function assertions () {
      var content = fs.readFileSync(file, 'utf8');
      expect(content).to.equal('Hello World!');
      done();
    }
  });

  describe('.readable()', function () {
    describe('when called after the finish event', function () {
      var readable;
      beforeEach(function (done) {
        var cache = WriteRead(file);
        cache.on('finish', function () {
          readable = cache.readable();
          done();
        });
        cache.end('Something Something');
      });

      it('should return a readable stream with the contents', function (done) {
        readable.pipe(sink()).on('data', function(data) {
          expect(data).to.equal('Something Something');
          done();
        });
      });
    })

    describe('when called before the finish event', function () {
      var cache;
      var readable;

      beforeEach(function (done) {
        cache = WriteRead(file);
        readable = cache.readable();
        done();
      });
      afterEach(function (done) {
        if(readable._readableState.ended) return done();
        cache.end('');
        readable.on('end', done);
        readable.resume();
      })

      it('should not have content available', function (done) {
        var contents = readable.read();
        var isReadable = false;
        var isEnded = false;
        readable.on('readable', function () {
          isReadable = true;
        });
        readable.on('end', function () {
          isEnded = true;
        })
        expect(contents).to.equal(null);
        setTimeout(function () {
          if(isEnded) return done(new Error('stream has ended'));
          if(isReadable) return done(new Error('"readable" event was called'));
          done();
        }, 200);
      });
    });
  })
})
