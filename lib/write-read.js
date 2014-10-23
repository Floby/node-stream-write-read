var stream = require('stream');
var fs = require('fs');

module.exports = WriteRead;

function WriteRead (file) {
  var hasFinished = false;
  var result = fs.createWriteStream(file);

  result.on('finish', function() {
    hasFinished = true;
  });

  result.readable = createReadable;
  return result;


  function createReadable () {
    if(hasFinished) {
      return fs.createReadStream(file);
    }

    var readable = stream.PassThrough();

    result.on('finish', function() {
      fs.createReadStream(file).pipe(readable);
    });

    return readable;
  }
}
