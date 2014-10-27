var stream = require('stream');
var fs = require('fs');
var DuplexMaker = require('duplex-maker');

module.exports = WriteRead;

function WriteRead (file, options) {
  options = options || {};
  var openMethod;
  var hasFinished = false;
  if(options.delayOpen) {
    var writable = stream.PassThrough();
    openMethod = function () {
      writable.pipe(fs.createWriteStream(file));
    }
  }
  else {
    var writable = fs.createWriteStream(file);
  }

  writable.on('finish', function() {
    hasFinished = true;
  });

  var duplex = DuplexMaker(writable, createReadable());
  duplex.createReadable = createReadable;
  duplex.affect = function (cb) { cb.call(duplex); return this }
  duplex.open = openMethod;

  return duplex;


  function createReadable () {
    if(hasFinished) return directStream();
    else return deferredStream();
  }

  function directStream () {
    return fs.createReadStream(file);
  }

  function deferredStream () {
    var readable = stream.PassThrough();

    writable.on('finish', function() {
      fs.createReadStream(file).pipe(readable);
    });

    return readable;
  }

}
