var stream = require('stream');
var fs = require('fs');

module.exports = WriteRead;

function WriteRead (file) {
  var hasFinished = false;
  var writable = fs.createWriteStream(file);

  writable.on('finish', function() {
    hasFinished = true;
  });

  writable.readable = createReadable;
  writable.affect = function (cb) { cb.call(writable) }
  return writable;


  function createReadable () {
    if(hasFinished) return directStream();
    else return deferredStream();
  }

  function deferredStream () {
    var readable = stream.PassThrough();

    writable.on('finish', function() {
      fs.createReadStream(file).pipe(readable);
    });

    return readable;
  }

  function directStream () {
    return fs.createReadStream(file);
  }
}
