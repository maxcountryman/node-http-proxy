'use strict'

var stream = require('stream'),
    zlib   = require('zlib');

module.exports.createInflate = function (options) {
  return stream.Transform({
    transform: function (chunk, encoding, callback) {
      var self = this;

      if (!self._inflate) {
        if ((new Buffer(chunk, encoding)[0] & 0x0F) === 0x08) {
          self._inflate = zlib.createInflate(options);
        } else {
          self._inflate = zlib.createInflateRaw(options);
        }

        self._inflate.on('error', function (error) {
          self.emit('error', error);
        });

        self.once('finish', function () {
          self._inflate.end();
        });

        self._inflate.on('data', function (chunk) {
          self.push(chunk);
        });

        self._inflate.once('end', function () {
          self._ended = true;
          self.push(null);
        });
      }

      self._inflate.write(chunk, encoding, callback);
    },

    flush: function (callback) {
      if (this._inflate && !this._ended) {
        this._inflate.once('end', callback);
      } else {
        callback();
      }
    },
  });
};
