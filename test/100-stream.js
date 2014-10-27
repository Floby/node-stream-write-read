var fs = require('fs');
var path = require('path');
var expect = require('chai').expect;
var assert = require('chai').assert;
var sinon = require('sinon');
var sink = require('stream-sink');
var async = require('async');


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

  describe('.createReadable()', function () {
    describe('when called after the finish event', function () {
      var readable;
      beforeEach(function (done) {
        var cache = WriteRead(file);
        cache.on('finish', function () {
          readable = cache.createReadable();
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
        readable = cache.createReadable();
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

      it('should start flowing once the stream is written', function (done) {
        var onFinish = sinon.spy();
        var onFirstData = sinon.spy();
        cache.on('finish', onFinish);
        readable.once('data', onFirstData);
        readable.resume();

        cache.end('coucou');

        readable.on('end', function () {
          assert(onFirstData.calledAfter(onFinish), 'first data called before finish');
          done();
        })
      });
    });

    describe('when called several times', function () {
      it('should give the same content to every readable', function (done) {
        var cache = WriteRead(file);
        var readable1 = cache.createReadable();
        var readable2, readable3, readable4;
        cache.write('hello');
        
        setTimeout(function () {
          readable2 = cache.createReadable();
        }, 25);
        setTimeout(function () {
          cache.write(' ');
        }, 30);
        setTimeout(function () {
          readable3 = cache.createReadable();
        });
        setTimeout(function () {
          cache.end('world');
        }, 50)
        setTimeout(function () {
          readable4 = cache.createReadable();
        }, 60);

        setTimeout(function () {
          async.parallel([
            complete(readable1),
            complete(readable2),
            complete(readable3),
            complete(readable4)
          ], function (err, results) {
            if(err) return done(err);
            results.forEach(function (content) {
              expect(content).to.equal('hello world');
            });
            done();
          })
        }, 70);

        function complete (readable) {
          return function (callback) {
            readable.on('error', callback);
            readable.pipe(sink()).on('data', callback.bind(null, null));
          }
        }
      });
    })
  })

  it('should be a readable stream itslef', function (done) {
    var cache = WriteRead(file);
    cache.pipe(sink()).on('data', assertions);

    cache.write('Hello World!');
    cache.end();

    function assertions (contents) {
      var written = fs.readFileSync(file, 'utf8');
      expect(written).to.equal('Hello World!');
      expect(contents).to.equal('Hello World!');
      done();
    }
  });
})
