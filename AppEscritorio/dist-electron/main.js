import { app, ipcMain, BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import require$$0$3 from "events";
import require$$1$1 from "https";
import require$$2$1 from "http";
import require$$3 from "net";
import require$$4 from "tls";
import require$$1 from "crypto";
import require$$0$2 from "stream";
import require$$7 from "url";
import require$$0 from "zlib";
import require$$0$1 from "buffer";
import require$$2 from "util";
import require$$0$4 from "os";
import require$$1$2 from "dgram";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var bufferUtil$3 = { exports: {} };
const BINARY_TYPES$5 = ["nodebuffer", "arraybuffer", "fragments"];
const hasBlob$3 = typeof Blob !== "undefined";
if (hasBlob$3) BINARY_TYPES$5.push("blob");
var constants$1 = {
  BINARY_TYPES: BINARY_TYPES$5,
  CLOSE_TIMEOUT: 3e4,
  EMPTY_BUFFER: Buffer.alloc(0),
  GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
  hasBlob: hasBlob$3,
  kForOnEventAttribute: Symbol("kIsForOnEventAttribute"),
  kListener: Symbol("kListener"),
  kStatusCode: Symbol("status-code"),
  kWebSocket: Symbol("websocket"),
  NOOP: () => {
  }
};
var unmask$3;
var mask$1;
const { EMPTY_BUFFER: EMPTY_BUFFER$7 } = constants$1;
const FastBuffer$5 = Buffer[Symbol.species];
function concat$3(list, totalLength) {
  if (list.length === 0) return EMPTY_BUFFER$7;
  if (list.length === 1) return list[0];
  const target = Buffer.allocUnsafe(totalLength);
  let offset = 0;
  for (let i = 0; i < list.length; i++) {
    const buf = list[i];
    target.set(buf, offset);
    offset += buf.length;
  }
  if (offset < totalLength) {
    return new FastBuffer$5(target.buffer, target.byteOffset, offset);
  }
  return target;
}
function _mask$1(source, mask2, output, offset, length) {
  for (let i = 0; i < length; i++) {
    output[offset + i] = source[i] ^ mask2[i & 3];
  }
}
function _unmask$1(buffer, mask2) {
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] ^= mask2[i & 3];
  }
}
function toArrayBuffer$3(buf) {
  if (buf.length === buf.buffer.byteLength) {
    return buf.buffer;
  }
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
}
function toBuffer$5(data) {
  toBuffer$5.readOnly = true;
  if (Buffer.isBuffer(data)) return data;
  let buf;
  if (data instanceof ArrayBuffer) {
    buf = new FastBuffer$5(data);
  } else if (ArrayBuffer.isView(data)) {
    buf = new FastBuffer$5(data.buffer, data.byteOffset, data.byteLength);
  } else {
    buf = Buffer.from(data);
    toBuffer$5.readOnly = false;
  }
  return buf;
}
bufferUtil$3.exports = {
  concat: concat$3,
  mask: _mask$1,
  toArrayBuffer: toArrayBuffer$3,
  toBuffer: toBuffer$5,
  unmask: _unmask$1
};
if (!process.env.WS_NO_BUFFER_UTIL) {
  try {
    const bufferUtil2 = require("bufferutil");
    mask$1 = bufferUtil$3.exports.mask = function(source, mask2, output, offset, length) {
      if (length < 48) _mask$1(source, mask2, output, offset, length);
      else bufferUtil2.mask(source, mask2, output, offset, length);
    };
    unmask$3 = bufferUtil$3.exports.unmask = function(buffer, mask2) {
      if (buffer.length < 32) _unmask$1(buffer, mask2);
      else bufferUtil2.unmask(buffer, mask2);
    };
  } catch (e) {
  }
}
var bufferUtilExports$1 = bufferUtil$3.exports;
const kDone$1 = Symbol("kDone");
const kRun$1 = Symbol("kRun");
let Limiter$3 = class Limiter {
  /**
   * Creates a new `Limiter`.
   *
   * @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
   *     to run concurrently
   */
  constructor(concurrency) {
    this[kDone$1] = () => {
      this.pending--;
      this[kRun$1]();
    };
    this.concurrency = concurrency || Infinity;
    this.jobs = [];
    this.pending = 0;
  }
  /**
   * Adds a job to the queue.
   *
   * @param {Function} job The job to run
   * @public
   */
  add(job) {
    this.jobs.push(job);
    this[kRun$1]();
  }
  /**
   * Removes a job from the queue and runs it if possible.
   *
   * @private
   */
  [kRun$1]() {
    if (this.pending === this.concurrency) return;
    if (this.jobs.length) {
      const job = this.jobs.shift();
      this.pending++;
      job(this[kDone$1]);
    }
  }
};
var limiter$1 = Limiter$3;
const zlib$1 = require$$0;
const bufferUtil$2 = bufferUtilExports$1;
const Limiter$2 = limiter$1;
const { kStatusCode: kStatusCode$5 } = constants$1;
const FastBuffer$4 = Buffer[Symbol.species];
const TRAILER$1 = Buffer.from([0, 0, 255, 255]);
const kPerMessageDeflate$1 = Symbol("permessage-deflate");
const kTotalLength$1 = Symbol("total-length");
const kCallback$1 = Symbol("callback");
const kBuffers$1 = Symbol("buffers");
const kError$3 = Symbol("error");
let zlibLimiter$1;
let PerMessageDeflate$8 = class PerMessageDeflate {
  /**
   * Creates a PerMessageDeflate instance.
   *
   * @param {Object} [options] Configuration options
   * @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
   *     for, or request, a custom client window size
   * @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
   *     acknowledge disabling of client context takeover
   * @param {Number} [options.concurrencyLimit=10] The number of concurrent
   *     calls to zlib
   * @param {Boolean} [options.isServer=false] Create the instance in either
   *     server or client mode
   * @param {Number} [options.maxPayload=0] The maximum allowed message length
   * @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
   *     use of a custom server window size
   * @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
   *     disabling of server context takeover
   * @param {Number} [options.threshold=1024] Size (in bytes) below which
   *     messages should not be compressed if context takeover is disabled
   * @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
   *     deflate
   * @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
   *     inflate
   */
  constructor(options) {
    this._options = options || {};
    this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024;
    this._maxPayload = this._options.maxPayload | 0;
    this._isServer = !!this._options.isServer;
    this._deflate = null;
    this._inflate = null;
    this.params = null;
    if (!zlibLimiter$1) {
      const concurrency = this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10;
      zlibLimiter$1 = new Limiter$2(concurrency);
    }
  }
  /**
   * @type {String}
   */
  static get extensionName() {
    return "permessage-deflate";
  }
  /**
   * Create an extension negotiation offer.
   *
   * @return {Object} Extension parameters
   * @public
   */
  offer() {
    const params = {};
    if (this._options.serverNoContextTakeover) {
      params.server_no_context_takeover = true;
    }
    if (this._options.clientNoContextTakeover) {
      params.client_no_context_takeover = true;
    }
    if (this._options.serverMaxWindowBits) {
      params.server_max_window_bits = this._options.serverMaxWindowBits;
    }
    if (this._options.clientMaxWindowBits) {
      params.client_max_window_bits = this._options.clientMaxWindowBits;
    } else if (this._options.clientMaxWindowBits == null) {
      params.client_max_window_bits = true;
    }
    return params;
  }
  /**
   * Accept an extension negotiation offer/response.
   *
   * @param {Array} configurations The extension negotiation offers/reponse
   * @return {Object} Accepted configuration
   * @public
   */
  accept(configurations) {
    configurations = this.normalizeParams(configurations);
    this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
    return this.params;
  }
  /**
   * Releases all resources used by the extension.
   *
   * @public
   */
  cleanup() {
    if (this._inflate) {
      this._inflate.close();
      this._inflate = null;
    }
    if (this._deflate) {
      const callback = this._deflate[kCallback$1];
      this._deflate.close();
      this._deflate = null;
      if (callback) {
        callback(
          new Error(
            "The deflate stream was closed while data was being processed"
          )
        );
      }
    }
  }
  /**
   *  Accept an extension negotiation offer.
   *
   * @param {Array} offers The extension negotiation offers
   * @return {Object} Accepted configuration
   * @private
   */
  acceptAsServer(offers) {
    const opts = this._options;
    const accepted = offers.find((params) => {
      if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === "number" && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === "number" && (typeof params.client_max_window_bits === "number" ? opts.clientMaxWindowBits > params.client_max_window_bits : !params.client_max_window_bits)) {
        return false;
      }
      return true;
    });
    if (!accepted) {
      throw new Error("None of the extension offers can be accepted");
    }
    if (opts.serverNoContextTakeover) {
      accepted.server_no_context_takeover = true;
    }
    if (opts.clientNoContextTakeover) {
      accepted.client_no_context_takeover = true;
    }
    if (typeof opts.serverMaxWindowBits === "number") {
      accepted.server_max_window_bits = opts.serverMaxWindowBits;
    }
    if (typeof opts.clientMaxWindowBits === "number") {
      accepted.client_max_window_bits = opts.clientMaxWindowBits;
    } else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) {
      delete accepted.client_max_window_bits;
    }
    return accepted;
  }
  /**
   * Accept the extension negotiation response.
   *
   * @param {Array} response The extension negotiation response
   * @return {Object} Accepted configuration
   * @private
   */
  acceptAsClient(response) {
    const params = response[0];
    if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) {
      throw new Error('Unexpected parameter "client_no_context_takeover"');
    }
    if (!params.client_max_window_bits) {
      if (typeof this._options.clientMaxWindowBits === "number") {
        params.client_max_window_bits = this._options.clientMaxWindowBits;
      }
    } else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === "number" && params.client_max_window_bits > this._options.clientMaxWindowBits) {
      throw new Error(
        'Unexpected or invalid parameter "client_max_window_bits"'
      );
    }
    return params;
  }
  /**
   * Normalize parameters.
   *
   * @param {Array} configurations The extension negotiation offers/reponse
   * @return {Array} The offers/response with normalized parameters
   * @private
   */
  normalizeParams(configurations) {
    configurations.forEach((params) => {
      Object.keys(params).forEach((key) => {
        let value = params[key];
        if (value.length > 1) {
          throw new Error(`Parameter "${key}" must have only a single value`);
        }
        value = value[0];
        if (key === "client_max_window_bits") {
          if (value !== true) {
            const num = +value;
            if (!Number.isInteger(num) || num < 8 || num > 15) {
              throw new TypeError(
                `Invalid value for parameter "${key}": ${value}`
              );
            }
            value = num;
          } else if (!this._isServer) {
            throw new TypeError(
              `Invalid value for parameter "${key}": ${value}`
            );
          }
        } else if (key === "server_max_window_bits") {
          const num = +value;
          if (!Number.isInteger(num) || num < 8 || num > 15) {
            throw new TypeError(
              `Invalid value for parameter "${key}": ${value}`
            );
          }
          value = num;
        } else if (key === "client_no_context_takeover" || key === "server_no_context_takeover") {
          if (value !== true) {
            throw new TypeError(
              `Invalid value for parameter "${key}": ${value}`
            );
          }
        } else {
          throw new Error(`Unknown parameter "${key}"`);
        }
        params[key] = value;
      });
    });
    return configurations;
  }
  /**
   * Decompress data. Concurrency limited.
   *
   * @param {Buffer} data Compressed data
   * @param {Boolean} fin Specifies whether or not this is the last fragment
   * @param {Function} callback Callback
   * @public
   */
  decompress(data, fin, callback) {
    zlibLimiter$1.add((done) => {
      this._decompress(data, fin, (err, result) => {
        done();
        callback(err, result);
      });
    });
  }
  /**
   * Compress data. Concurrency limited.
   *
   * @param {(Buffer|String)} data Data to compress
   * @param {Boolean} fin Specifies whether or not this is the last fragment
   * @param {Function} callback Callback
   * @public
   */
  compress(data, fin, callback) {
    zlibLimiter$1.add((done) => {
      this._compress(data, fin, (err, result) => {
        done();
        callback(err, result);
      });
    });
  }
  /**
   * Decompress data.
   *
   * @param {Buffer} data Compressed data
   * @param {Boolean} fin Specifies whether or not this is the last fragment
   * @param {Function} callback Callback
   * @private
   */
  _decompress(data, fin, callback) {
    const endpoint = this._isServer ? "client" : "server";
    if (!this._inflate) {
      const key = `${endpoint}_max_window_bits`;
      const windowBits = typeof this.params[key] !== "number" ? zlib$1.Z_DEFAULT_WINDOWBITS : this.params[key];
      this._inflate = zlib$1.createInflateRaw({
        ...this._options.zlibInflateOptions,
        windowBits
      });
      this._inflate[kPerMessageDeflate$1] = this;
      this._inflate[kTotalLength$1] = 0;
      this._inflate[kBuffers$1] = [];
      this._inflate.on("error", inflateOnError$1);
      this._inflate.on("data", inflateOnData$1);
    }
    this._inflate[kCallback$1] = callback;
    this._inflate.write(data);
    if (fin) this._inflate.write(TRAILER$1);
    this._inflate.flush(() => {
      const err = this._inflate[kError$3];
      if (err) {
        this._inflate.close();
        this._inflate = null;
        callback(err);
        return;
      }
      const data2 = bufferUtil$2.concat(
        this._inflate[kBuffers$1],
        this._inflate[kTotalLength$1]
      );
      if (this._inflate._readableState.endEmitted) {
        this._inflate.close();
        this._inflate = null;
      } else {
        this._inflate[kTotalLength$1] = 0;
        this._inflate[kBuffers$1] = [];
        if (fin && this.params[`${endpoint}_no_context_takeover`]) {
          this._inflate.reset();
        }
      }
      callback(null, data2);
    });
  }
  /**
   * Compress data.
   *
   * @param {(Buffer|String)} data Data to compress
   * @param {Boolean} fin Specifies whether or not this is the last fragment
   * @param {Function} callback Callback
   * @private
   */
  _compress(data, fin, callback) {
    const endpoint = this._isServer ? "server" : "client";
    if (!this._deflate) {
      const key = `${endpoint}_max_window_bits`;
      const windowBits = typeof this.params[key] !== "number" ? zlib$1.Z_DEFAULT_WINDOWBITS : this.params[key];
      this._deflate = zlib$1.createDeflateRaw({
        ...this._options.zlibDeflateOptions,
        windowBits
      });
      this._deflate[kTotalLength$1] = 0;
      this._deflate[kBuffers$1] = [];
      this._deflate.on("data", deflateOnData$1);
    }
    this._deflate[kCallback$1] = callback;
    this._deflate.write(data);
    this._deflate.flush(zlib$1.Z_SYNC_FLUSH, () => {
      if (!this._deflate) {
        return;
      }
      let data2 = bufferUtil$2.concat(
        this._deflate[kBuffers$1],
        this._deflate[kTotalLength$1]
      );
      if (fin) {
        data2 = new FastBuffer$4(data2.buffer, data2.byteOffset, data2.length - 4);
      }
      this._deflate[kCallback$1] = null;
      this._deflate[kTotalLength$1] = 0;
      this._deflate[kBuffers$1] = [];
      if (fin && this.params[`${endpoint}_no_context_takeover`]) {
        this._deflate.reset();
      }
      callback(null, data2);
    });
  }
};
var permessageDeflate$1 = PerMessageDeflate$8;
function deflateOnData$1(chunk) {
  this[kBuffers$1].push(chunk);
  this[kTotalLength$1] += chunk.length;
}
function inflateOnData$1(chunk) {
  this[kTotalLength$1] += chunk.length;
  if (this[kPerMessageDeflate$1]._maxPayload < 1 || this[kTotalLength$1] <= this[kPerMessageDeflate$1]._maxPayload) {
    this[kBuffers$1].push(chunk);
    return;
  }
  this[kError$3] = new RangeError("Max payload size exceeded");
  this[kError$3].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH";
  this[kError$3][kStatusCode$5] = 1009;
  this.removeListener("data", inflateOnData$1);
  this.reset();
}
function inflateOnError$1(err) {
  this[kPerMessageDeflate$1]._inflate = null;
  if (this[kError$3]) {
    this[kCallback$1](this[kError$3]);
    return;
  }
  err[kStatusCode$5] = 1007;
  this[kCallback$1](err);
}
var validation$1 = { exports: {} };
var isValidUTF8_1$1;
const { isUtf8: isUtf8$1 } = require$$0$1;
const { hasBlob: hasBlob$2 } = constants$1;
const tokenChars$5 = [
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  // 0 - 15
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  // 16 - 31
  0,
  1,
  0,
  1,
  1,
  1,
  1,
  1,
  0,
  0,
  1,
  1,
  0,
  1,
  1,
  0,
  // 32 - 47
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  0,
  0,
  0,
  0,
  0,
  0,
  // 48 - 63
  0,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  // 64 - 79
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  0,
  0,
  0,
  1,
  1,
  // 80 - 95
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  // 96 - 111
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  0,
  1,
  0,
  1,
  0
  // 112 - 127
];
function isValidStatusCode$5(code) {
  return code >= 1e3 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3e3 && code <= 4999;
}
function _isValidUTF8$1(buf) {
  const len = buf.length;
  let i = 0;
  while (i < len) {
    if ((buf[i] & 128) === 0) {
      i++;
    } else if ((buf[i] & 224) === 192) {
      if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) {
        return false;
      }
      i += 2;
    } else if ((buf[i] & 240) === 224) {
      if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || // Overlong
      buf[i] === 237 && (buf[i + 1] & 224) === 160) {
        return false;
      }
      i += 3;
    } else if ((buf[i] & 248) === 240) {
      if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || // Overlong
      buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) {
        return false;
      }
      i += 4;
    } else {
      return false;
    }
  }
  return true;
}
function isBlob$5(value) {
  return hasBlob$2 && typeof value === "object" && typeof value.arrayBuffer === "function" && typeof value.type === "string" && typeof value.stream === "function" && (value[Symbol.toStringTag] === "Blob" || value[Symbol.toStringTag] === "File");
}
validation$1.exports = {
  isBlob: isBlob$5,
  isValidStatusCode: isValidStatusCode$5,
  isValidUTF8: _isValidUTF8$1,
  tokenChars: tokenChars$5
};
if (isUtf8$1) {
  isValidUTF8_1$1 = validation$1.exports.isValidUTF8 = function(buf) {
    return buf.length < 24 ? _isValidUTF8$1(buf) : isUtf8$1(buf);
  };
} else if (!process.env.WS_NO_UTF_8_VALIDATE) {
  try {
    const isValidUTF82 = require("utf-8-validate");
    isValidUTF8_1$1 = validation$1.exports.isValidUTF8 = function(buf) {
      return buf.length < 32 ? _isValidUTF8$1(buf) : isValidUTF82(buf);
    };
  } catch (e) {
  }
}
var validationExports$1 = validation$1.exports;
const { Writable: Writable$1 } = require$$0$2;
const PerMessageDeflate$7 = permessageDeflate$1;
const {
  BINARY_TYPES: BINARY_TYPES$4,
  EMPTY_BUFFER: EMPTY_BUFFER$6,
  kStatusCode: kStatusCode$4,
  kWebSocket: kWebSocket$7
} = constants$1;
const { concat: concat$2, toArrayBuffer: toArrayBuffer$2, unmask: unmask$2 } = bufferUtilExports$1;
const { isValidStatusCode: isValidStatusCode$4, isValidUTF8: isValidUTF8$1 } = validationExports$1;
const FastBuffer$3 = Buffer[Symbol.species];
const GET_INFO$1 = 0;
const GET_PAYLOAD_LENGTH_16$1 = 1;
const GET_PAYLOAD_LENGTH_64$1 = 2;
const GET_MASK$1 = 3;
const GET_DATA$1 = 4;
const INFLATING$1 = 5;
const DEFER_EVENT$1 = 6;
let Receiver$3 = class Receiver extends Writable$1 {
  /**
   * Creates a Receiver instance.
   *
   * @param {Object} [options] Options object
   * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
   *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
   *     multiple times in the same tick
   * @param {String} [options.binaryType=nodebuffer] The type for binary data
   * @param {Object} [options.extensions] An object containing the negotiated
   *     extensions
   * @param {Boolean} [options.isServer=false] Specifies whether to operate in
   *     client or server mode
   * @param {Number} [options.maxBufferedChunks=0] The maximum number of
   *     buffered data chunks
   * @param {Number} [options.maxFragments=0] The maximum number of message
   *     fragments
   * @param {Number} [options.maxPayload=0] The maximum allowed message length
   * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
   *     not to skip UTF-8 validation for text and close messages
   */
  constructor(options = {}) {
    super();
    this._allowSynchronousEvents = options.allowSynchronousEvents !== void 0 ? options.allowSynchronousEvents : true;
    this._binaryType = options.binaryType || BINARY_TYPES$4[0];
    this._extensions = options.extensions || {};
    this._isServer = !!options.isServer;
    this._maxBufferedChunks = options.maxBufferedChunks | 0;
    this._maxFragments = options.maxFragments | 0;
    this._maxPayload = options.maxPayload | 0;
    this._skipUTF8Validation = !!options.skipUTF8Validation;
    this[kWebSocket$7] = void 0;
    this._bufferedBytes = 0;
    this._buffers = [];
    this._compressed = false;
    this._payloadLength = 0;
    this._mask = void 0;
    this._fragmented = 0;
    this._masked = false;
    this._fin = false;
    this._opcode = 0;
    this._totalPayloadLength = 0;
    this._messageLength = 0;
    this._numFragments = 0;
    this._fragments = [];
    this._errored = false;
    this._loop = false;
    this._state = GET_INFO$1;
  }
  /**
   * Implements `Writable.prototype._write()`.
   *
   * @param {Buffer} chunk The chunk of data to write
   * @param {String} encoding The character encoding of `chunk`
   * @param {Function} cb Callback
   * @private
   */
  _write(chunk, encoding, cb) {
    if (this._opcode === 8 && this._state == GET_INFO$1) return cb();
    if (this._maxBufferedChunks > 0 && this._buffers.length >= this._maxBufferedChunks) {
      cb(
        this.createError(
          RangeError,
          "Too many buffered chunks",
          false,
          1008,
          "WS_ERR_TOO_MANY_BUFFERED_PARTS"
        )
      );
      return;
    }
    this._bufferedBytes += chunk.length;
    this._buffers.push(chunk);
    this.startLoop(cb);
  }
  /**
   * Consumes `n` bytes from the buffered data.
   *
   * @param {Number} n The number of bytes to consume
   * @return {Buffer} The consumed bytes
   * @private
   */
  consume(n) {
    this._bufferedBytes -= n;
    if (n === this._buffers[0].length) return this._buffers.shift();
    if (n < this._buffers[0].length) {
      const buf = this._buffers[0];
      this._buffers[0] = new FastBuffer$3(
        buf.buffer,
        buf.byteOffset + n,
        buf.length - n
      );
      return new FastBuffer$3(buf.buffer, buf.byteOffset, n);
    }
    const dst = Buffer.allocUnsafe(n);
    do {
      const buf = this._buffers[0];
      const offset = dst.length - n;
      if (n >= buf.length) {
        dst.set(this._buffers.shift(), offset);
      } else {
        dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
        this._buffers[0] = new FastBuffer$3(
          buf.buffer,
          buf.byteOffset + n,
          buf.length - n
        );
      }
      n -= buf.length;
    } while (n > 0);
    return dst;
  }
  /**
   * Starts the parsing loop.
   *
   * @param {Function} cb Callback
   * @private
   */
  startLoop(cb) {
    this._loop = true;
    do {
      switch (this._state) {
        case GET_INFO$1:
          this.getInfo(cb);
          break;
        case GET_PAYLOAD_LENGTH_16$1:
          this.getPayloadLength16(cb);
          break;
        case GET_PAYLOAD_LENGTH_64$1:
          this.getPayloadLength64(cb);
          break;
        case GET_MASK$1:
          this.getMask();
          break;
        case GET_DATA$1:
          this.getData(cb);
          break;
        case INFLATING$1:
        case DEFER_EVENT$1:
          this._loop = false;
          return;
      }
    } while (this._loop);
    if (!this._errored) cb();
  }
  /**
   * Reads the first two bytes of a frame.
   *
   * @param {Function} cb Callback
   * @private
   */
  getInfo(cb) {
    if (this._bufferedBytes < 2) {
      this._loop = false;
      return;
    }
    const buf = this.consume(2);
    if ((buf[0] & 48) !== 0) {
      const error = this.createError(
        RangeError,
        "RSV2 and RSV3 must be clear",
        true,
        1002,
        "WS_ERR_UNEXPECTED_RSV_2_3"
      );
      cb(error);
      return;
    }
    const compressed = (buf[0] & 64) === 64;
    if (compressed && !this._extensions[PerMessageDeflate$7.extensionName]) {
      const error = this.createError(
        RangeError,
        "RSV1 must be clear",
        true,
        1002,
        "WS_ERR_UNEXPECTED_RSV_1"
      );
      cb(error);
      return;
    }
    this._fin = (buf[0] & 128) === 128;
    this._opcode = buf[0] & 15;
    this._payloadLength = buf[1] & 127;
    if (this._opcode === 0) {
      if (compressed) {
        const error = this.createError(
          RangeError,
          "RSV1 must be clear",
          true,
          1002,
          "WS_ERR_UNEXPECTED_RSV_1"
        );
        cb(error);
        return;
      }
      if (!this._fragmented) {
        const error = this.createError(
          RangeError,
          "invalid opcode 0",
          true,
          1002,
          "WS_ERR_INVALID_OPCODE"
        );
        cb(error);
        return;
      }
      this._opcode = this._fragmented;
    } else if (this._opcode === 1 || this._opcode === 2) {
      if (this._fragmented) {
        const error = this.createError(
          RangeError,
          `invalid opcode ${this._opcode}`,
          true,
          1002,
          "WS_ERR_INVALID_OPCODE"
        );
        cb(error);
        return;
      }
      this._compressed = compressed;
    } else if (this._opcode > 7 && this._opcode < 11) {
      if (!this._fin) {
        const error = this.createError(
          RangeError,
          "FIN must be set",
          true,
          1002,
          "WS_ERR_EXPECTED_FIN"
        );
        cb(error);
        return;
      }
      if (compressed) {
        const error = this.createError(
          RangeError,
          "RSV1 must be clear",
          true,
          1002,
          "WS_ERR_UNEXPECTED_RSV_1"
        );
        cb(error);
        return;
      }
      if (this._payloadLength > 125 || this._opcode === 8 && this._payloadLength === 1) {
        const error = this.createError(
          RangeError,
          `invalid payload length ${this._payloadLength}`,
          true,
          1002,
          "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"
        );
        cb(error);
        return;
      }
    } else {
      const error = this.createError(
        RangeError,
        `invalid opcode ${this._opcode}`,
        true,
        1002,
        "WS_ERR_INVALID_OPCODE"
      );
      cb(error);
      return;
    }
    if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
    this._masked = (buf[1] & 128) === 128;
    if (this._isServer) {
      if (!this._masked) {
        const error = this.createError(
          RangeError,
          "MASK must be set",
          true,
          1002,
          "WS_ERR_EXPECTED_MASK"
        );
        cb(error);
        return;
      }
    } else if (this._masked) {
      const error = this.createError(
        RangeError,
        "MASK must be clear",
        true,
        1002,
        "WS_ERR_UNEXPECTED_MASK"
      );
      cb(error);
      return;
    }
    if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16$1;
    else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64$1;
    else this.haveLength(cb);
  }
  /**
   * Gets extended payload length (7+16).
   *
   * @param {Function} cb Callback
   * @private
   */
  getPayloadLength16(cb) {
    if (this._bufferedBytes < 2) {
      this._loop = false;
      return;
    }
    this._payloadLength = this.consume(2).readUInt16BE(0);
    this.haveLength(cb);
  }
  /**
   * Gets extended payload length (7+64).
   *
   * @param {Function} cb Callback
   * @private
   */
  getPayloadLength64(cb) {
    if (this._bufferedBytes < 8) {
      this._loop = false;
      return;
    }
    const buf = this.consume(8);
    const num = buf.readUInt32BE(0);
    if (num > Math.pow(2, 53 - 32) - 1) {
      const error = this.createError(
        RangeError,
        "Unsupported WebSocket frame: payload length > 2^53 - 1",
        false,
        1009,
        "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH"
      );
      cb(error);
      return;
    }
    this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
    this.haveLength(cb);
  }
  /**
   * Payload length has been read.
   *
   * @param {Function} cb Callback
   * @private
   */
  haveLength(cb) {
    if (this._payloadLength && this._opcode < 8) {
      this._totalPayloadLength += this._payloadLength;
      if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
        const error = this.createError(
          RangeError,
          "Max payload size exceeded",
          false,
          1009,
          "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
        );
        cb(error);
        return;
      }
    }
    if (this._masked) this._state = GET_MASK$1;
    else this._state = GET_DATA$1;
  }
  /**
   * Reads mask bytes.
   *
   * @private
   */
  getMask() {
    if (this._bufferedBytes < 4) {
      this._loop = false;
      return;
    }
    this._mask = this.consume(4);
    this._state = GET_DATA$1;
  }
  /**
   * Reads data bytes.
   *
   * @param {Function} cb Callback
   * @private
   */
  getData(cb) {
    let data = EMPTY_BUFFER$6;
    if (this._payloadLength) {
      if (this._bufferedBytes < this._payloadLength) {
        this._loop = false;
        return;
      }
      data = this.consume(this._payloadLength);
      if (this._masked && (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0) {
        unmask$2(data, this._mask);
      }
    }
    if (this._opcode > 7) {
      this.controlMessage(data, cb);
      return;
    }
    if (this._maxFragments > 0 && ++this._numFragments > this._maxFragments) {
      const error = this.createError(
        RangeError,
        "Too many message fragments",
        false,
        1008,
        "WS_ERR_TOO_MANY_BUFFERED_PARTS"
      );
      cb(error);
      return;
    }
    if (this._compressed) {
      this._state = INFLATING$1;
      this.decompress(data, cb);
      return;
    }
    if (data.length) {
      this._messageLength = this._totalPayloadLength;
      this._fragments.push(data);
    }
    this.dataMessage(cb);
  }
  /**
   * Decompresses data.
   *
   * @param {Buffer} data Compressed data
   * @param {Function} cb Callback
   * @private
   */
  decompress(data, cb) {
    const perMessageDeflate = this._extensions[PerMessageDeflate$7.extensionName];
    perMessageDeflate.decompress(data, this._fin, (err, buf) => {
      if (err) return cb(err);
      if (buf.length) {
        this._messageLength += buf.length;
        if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
          const error = this.createError(
            RangeError,
            "Max payload size exceeded",
            false,
            1009,
            "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
          );
          cb(error);
          return;
        }
        this._fragments.push(buf);
      }
      this.dataMessage(cb);
      if (this._state === GET_INFO$1) this.startLoop(cb);
    });
  }
  /**
   * Handles a data message.
   *
   * @param {Function} cb Callback
   * @private
   */
  dataMessage(cb) {
    if (!this._fin) {
      this._state = GET_INFO$1;
      return;
    }
    const messageLength = this._messageLength;
    const fragments = this._fragments;
    this._totalPayloadLength = 0;
    this._messageLength = 0;
    this._fragmented = 0;
    this._numFragments = 0;
    this._fragments = [];
    if (this._opcode === 2) {
      let data;
      if (this._binaryType === "nodebuffer") {
        data = concat$2(fragments, messageLength);
      } else if (this._binaryType === "arraybuffer") {
        data = toArrayBuffer$2(concat$2(fragments, messageLength));
      } else if (this._binaryType === "blob") {
        data = new Blob(fragments);
      } else {
        data = fragments;
      }
      if (this._allowSynchronousEvents) {
        this.emit("message", data, true);
        this._state = GET_INFO$1;
      } else {
        this._state = DEFER_EVENT$1;
        setImmediate(() => {
          this.emit("message", data, true);
          this._state = GET_INFO$1;
          this.startLoop(cb);
        });
      }
    } else {
      const buf = concat$2(fragments, messageLength);
      if (!this._skipUTF8Validation && !isValidUTF8$1(buf)) {
        const error = this.createError(
          Error,
          "invalid UTF-8 sequence",
          true,
          1007,
          "WS_ERR_INVALID_UTF8"
        );
        cb(error);
        return;
      }
      if (this._state === INFLATING$1 || this._allowSynchronousEvents) {
        this.emit("message", buf, false);
        this._state = GET_INFO$1;
      } else {
        this._state = DEFER_EVENT$1;
        setImmediate(() => {
          this.emit("message", buf, false);
          this._state = GET_INFO$1;
          this.startLoop(cb);
        });
      }
    }
  }
  /**
   * Handles a control message.
   *
   * @param {Buffer} data Data to handle
   * @return {(Error|RangeError|undefined)} A possible error
   * @private
   */
  controlMessage(data, cb) {
    if (this._opcode === 8) {
      if (data.length === 0) {
        this._loop = false;
        this.emit("conclude", 1005, EMPTY_BUFFER$6);
        this.end();
      } else {
        const code = data.readUInt16BE(0);
        if (!isValidStatusCode$4(code)) {
          const error = this.createError(
            RangeError,
            `invalid status code ${code}`,
            true,
            1002,
            "WS_ERR_INVALID_CLOSE_CODE"
          );
          cb(error);
          return;
        }
        const buf = new FastBuffer$3(
          data.buffer,
          data.byteOffset + 2,
          data.length - 2
        );
        if (!this._skipUTF8Validation && !isValidUTF8$1(buf)) {
          const error = this.createError(
            Error,
            "invalid UTF-8 sequence",
            true,
            1007,
            "WS_ERR_INVALID_UTF8"
          );
          cb(error);
          return;
        }
        this._loop = false;
        this.emit("conclude", code, buf);
        this.end();
      }
      this._state = GET_INFO$1;
      return;
    }
    if (this._allowSynchronousEvents) {
      this.emit(this._opcode === 9 ? "ping" : "pong", data);
      this._state = GET_INFO$1;
    } else {
      this._state = DEFER_EVENT$1;
      setImmediate(() => {
        this.emit(this._opcode === 9 ? "ping" : "pong", data);
        this._state = GET_INFO$1;
        this.startLoop(cb);
      });
    }
  }
  /**
   * Builds an error object.
   *
   * @param {function(new:Error|RangeError)} ErrorCtor The error constructor
   * @param {String} message The error message
   * @param {Boolean} prefix Specifies whether or not to add a default prefix to
   *     `message`
   * @param {Number} statusCode The status code
   * @param {String} errorCode The exposed error code
   * @return {(Error|RangeError)} The error
   * @private
   */
  createError(ErrorCtor, message, prefix, statusCode, errorCode) {
    this._loop = false;
    this._errored = true;
    const err = new ErrorCtor(
      prefix ? `Invalid WebSocket frame: ${message}` : message
    );
    Error.captureStackTrace(err, this.createError);
    err.code = errorCode;
    err[kStatusCode$4] = statusCode;
    return err;
  }
};
var receiver$1 = Receiver$3;
const { Duplex: Duplex$7 } = require$$0$2;
const { randomFillSync: randomFillSync$1 } = require$$1;
const {
  types: { isUint8Array: isUint8Array$1 }
} = require$$2;
const PerMessageDeflate$6 = permessageDeflate$1;
const { EMPTY_BUFFER: EMPTY_BUFFER$5, kWebSocket: kWebSocket$6, NOOP: NOOP$3 } = constants$1;
const { isBlob: isBlob$4, isValidStatusCode: isValidStatusCode$3 } = validationExports$1;
const { mask: applyMask$1, toBuffer: toBuffer$4 } = bufferUtilExports$1;
const kByteLength$1 = Symbol("kByteLength");
const maskBuffer$1 = Buffer.alloc(4);
const RANDOM_POOL_SIZE$1 = 8 * 1024;
let randomPool$1;
let randomPoolPointer$1 = RANDOM_POOL_SIZE$1;
const DEFAULT$1 = 0;
const DEFLATING$1 = 1;
const GET_BLOB_DATA$1 = 2;
let Sender$3 = class Sender {
  /**
   * Creates a Sender instance.
   *
   * @param {Duplex} socket The connection socket
   * @param {Object} [extensions] An object containing the negotiated extensions
   * @param {Function} [generateMask] The function used to generate the masking
   *     key
   */
  constructor(socket, extensions, generateMask) {
    this._extensions = extensions || {};
    if (generateMask) {
      this._generateMask = generateMask;
      this._maskBuffer = Buffer.alloc(4);
    }
    this._socket = socket;
    this._firstFragment = true;
    this._compress = false;
    this._bufferedBytes = 0;
    this._queue = [];
    this._state = DEFAULT$1;
    this.onerror = NOOP$3;
    this[kWebSocket$6] = void 0;
  }
  /**
   * Frames a piece of data according to the HyBi WebSocket protocol.
   *
   * @param {(Buffer|String)} data The data to frame
   * @param {Object} options Options object
   * @param {Boolean} [options.fin=false] Specifies whether or not to set the
   *     FIN bit
   * @param {Function} [options.generateMask] The function used to generate the
   *     masking key
   * @param {Boolean} [options.mask=false] Specifies whether or not to mask
   *     `data`
   * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
   *     key
   * @param {Number} options.opcode The opcode
   * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
   *     modified
   * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
   *     RSV1 bit
   * @return {(Buffer|String)[]} The framed data
   * @public
   */
  static frame(data, options) {
    let mask2;
    let merge = false;
    let offset = 2;
    let skipMasking = false;
    if (options.mask) {
      mask2 = options.maskBuffer || maskBuffer$1;
      if (options.generateMask) {
        options.generateMask(mask2);
      } else {
        if (randomPoolPointer$1 === RANDOM_POOL_SIZE$1) {
          if (randomPool$1 === void 0) {
            randomPool$1 = Buffer.alloc(RANDOM_POOL_SIZE$1);
          }
          randomFillSync$1(randomPool$1, 0, RANDOM_POOL_SIZE$1);
          randomPoolPointer$1 = 0;
        }
        mask2[0] = randomPool$1[randomPoolPointer$1++];
        mask2[1] = randomPool$1[randomPoolPointer$1++];
        mask2[2] = randomPool$1[randomPoolPointer$1++];
        mask2[3] = randomPool$1[randomPoolPointer$1++];
      }
      skipMasking = (mask2[0] | mask2[1] | mask2[2] | mask2[3]) === 0;
      offset = 6;
    }
    let dataLength;
    if (typeof data === "string") {
      if ((!options.mask || skipMasking) && options[kByteLength$1] !== void 0) {
        dataLength = options[kByteLength$1];
      } else {
        data = Buffer.from(data);
        dataLength = data.length;
      }
    } else {
      dataLength = data.length;
      merge = options.mask && options.readOnly && !skipMasking;
    }
    let payloadLength = dataLength;
    if (dataLength >= 65536) {
      offset += 8;
      payloadLength = 127;
    } else if (dataLength > 125) {
      offset += 2;
      payloadLength = 126;
    }
    const target = Buffer.allocUnsafe(merge ? dataLength + offset : offset);
    target[0] = options.fin ? options.opcode | 128 : options.opcode;
    if (options.rsv1) target[0] |= 64;
    target[1] = payloadLength;
    if (payloadLength === 126) {
      target.writeUInt16BE(dataLength, 2);
    } else if (payloadLength === 127) {
      target[2] = target[3] = 0;
      target.writeUIntBE(dataLength, 4, 6);
    }
    if (!options.mask) return [target, data];
    target[1] |= 128;
    target[offset - 4] = mask2[0];
    target[offset - 3] = mask2[1];
    target[offset - 2] = mask2[2];
    target[offset - 1] = mask2[3];
    if (skipMasking) return [target, data];
    if (merge) {
      applyMask$1(data, mask2, target, offset, dataLength);
      return [target];
    }
    applyMask$1(data, mask2, data, 0, dataLength);
    return [target, data];
  }
  /**
   * Sends a close message to the other peer.
   *
   * @param {Number} [code] The status code component of the body
   * @param {(String|Buffer)} [data] The message component of the body
   * @param {Boolean} [mask=false] Specifies whether or not to mask the message
   * @param {Function} [cb] Callback
   * @public
   */
  close(code, data, mask2, cb) {
    let buf;
    if (code === void 0) {
      buf = EMPTY_BUFFER$5;
    } else if (typeof code !== "number" || !isValidStatusCode$3(code)) {
      throw new TypeError("First argument must be a valid error code number");
    } else if (data === void 0 || !data.length) {
      buf = Buffer.allocUnsafe(2);
      buf.writeUInt16BE(code, 0);
    } else {
      const length = Buffer.byteLength(data);
      if (length > 123) {
        throw new RangeError("The message must not be greater than 123 bytes");
      }
      buf = Buffer.allocUnsafe(2 + length);
      buf.writeUInt16BE(code, 0);
      if (typeof data === "string") {
        buf.write(data, 2);
      } else if (isUint8Array$1(data)) {
        buf.set(data, 2);
      } else {
        throw new TypeError("Second argument must be a string or a Uint8Array");
      }
    }
    const options = {
      [kByteLength$1]: buf.length,
      fin: true,
      generateMask: this._generateMask,
      mask: mask2,
      maskBuffer: this._maskBuffer,
      opcode: 8,
      readOnly: false,
      rsv1: false
    };
    if (this._state !== DEFAULT$1) {
      this.enqueue([this.dispatch, buf, false, options, cb]);
    } else {
      this.sendFrame(Sender.frame(buf, options), cb);
    }
  }
  /**
   * Sends a ping message to the other peer.
   *
   * @param {*} data The message to send
   * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
   * @param {Function} [cb] Callback
   * @public
   */
  ping(data, mask2, cb) {
    let byteLength;
    let readOnly;
    if (typeof data === "string") {
      byteLength = Buffer.byteLength(data);
      readOnly = false;
    } else if (isBlob$4(data)) {
      byteLength = data.size;
      readOnly = false;
    } else {
      data = toBuffer$4(data);
      byteLength = data.length;
      readOnly = toBuffer$4.readOnly;
    }
    if (byteLength > 125) {
      throw new RangeError("The data size must not be greater than 125 bytes");
    }
    const options = {
      [kByteLength$1]: byteLength,
      fin: true,
      generateMask: this._generateMask,
      mask: mask2,
      maskBuffer: this._maskBuffer,
      opcode: 9,
      readOnly,
      rsv1: false
    };
    if (isBlob$4(data)) {
      if (this._state !== DEFAULT$1) {
        this.enqueue([this.getBlobData, data, false, options, cb]);
      } else {
        this.getBlobData(data, false, options, cb);
      }
    } else if (this._state !== DEFAULT$1) {
      this.enqueue([this.dispatch, data, false, options, cb]);
    } else {
      this.sendFrame(Sender.frame(data, options), cb);
    }
  }
  /**
   * Sends a pong message to the other peer.
   *
   * @param {*} data The message to send
   * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
   * @param {Function} [cb] Callback
   * @public
   */
  pong(data, mask2, cb) {
    let byteLength;
    let readOnly;
    if (typeof data === "string") {
      byteLength = Buffer.byteLength(data);
      readOnly = false;
    } else if (isBlob$4(data)) {
      byteLength = data.size;
      readOnly = false;
    } else {
      data = toBuffer$4(data);
      byteLength = data.length;
      readOnly = toBuffer$4.readOnly;
    }
    if (byteLength > 125) {
      throw new RangeError("The data size must not be greater than 125 bytes");
    }
    const options = {
      [kByteLength$1]: byteLength,
      fin: true,
      generateMask: this._generateMask,
      mask: mask2,
      maskBuffer: this._maskBuffer,
      opcode: 10,
      readOnly,
      rsv1: false
    };
    if (isBlob$4(data)) {
      if (this._state !== DEFAULT$1) {
        this.enqueue([this.getBlobData, data, false, options, cb]);
      } else {
        this.getBlobData(data, false, options, cb);
      }
    } else if (this._state !== DEFAULT$1) {
      this.enqueue([this.dispatch, data, false, options, cb]);
    } else {
      this.sendFrame(Sender.frame(data, options), cb);
    }
  }
  /**
   * Sends a data message to the other peer.
   *
   * @param {*} data The message to send
   * @param {Object} options Options object
   * @param {Boolean} [options.binary=false] Specifies whether `data` is binary
   *     or text
   * @param {Boolean} [options.compress=false] Specifies whether or not to
   *     compress `data`
   * @param {Boolean} [options.fin=false] Specifies whether the fragment is the
   *     last one
   * @param {Boolean} [options.mask=false] Specifies whether or not to mask
   *     `data`
   * @param {Function} [cb] Callback
   * @public
   */
  send(data, options, cb) {
    const perMessageDeflate = this._extensions[PerMessageDeflate$6.extensionName];
    let opcode = options.binary ? 2 : 1;
    let rsv1 = options.compress;
    let byteLength;
    let readOnly;
    if (typeof data === "string") {
      byteLength = Buffer.byteLength(data);
      readOnly = false;
    } else if (isBlob$4(data)) {
      byteLength = data.size;
      readOnly = false;
    } else {
      data = toBuffer$4(data);
      byteLength = data.length;
      readOnly = toBuffer$4.readOnly;
    }
    if (this._firstFragment) {
      this._firstFragment = false;
      if (rsv1 && perMessageDeflate && perMessageDeflate.params[perMessageDeflate._isServer ? "server_no_context_takeover" : "client_no_context_takeover"]) {
        rsv1 = byteLength >= perMessageDeflate._threshold;
      }
      this._compress = rsv1;
    } else {
      rsv1 = false;
      opcode = 0;
    }
    if (options.fin) this._firstFragment = true;
    const opts = {
      [kByteLength$1]: byteLength,
      fin: options.fin,
      generateMask: this._generateMask,
      mask: options.mask,
      maskBuffer: this._maskBuffer,
      opcode,
      readOnly,
      rsv1
    };
    if (isBlob$4(data)) {
      if (this._state !== DEFAULT$1) {
        this.enqueue([this.getBlobData, data, this._compress, opts, cb]);
      } else {
        this.getBlobData(data, this._compress, opts, cb);
      }
    } else if (this._state !== DEFAULT$1) {
      this.enqueue([this.dispatch, data, this._compress, opts, cb]);
    } else {
      this.dispatch(data, this._compress, opts, cb);
    }
  }
  /**
   * Gets the contents of a blob as binary data.
   *
   * @param {Blob} blob The blob
   * @param {Boolean} [compress=false] Specifies whether or not to compress
   *     the data
   * @param {Object} options Options object
   * @param {Boolean} [options.fin=false] Specifies whether or not to set the
   *     FIN bit
   * @param {Function} [options.generateMask] The function used to generate the
   *     masking key
   * @param {Boolean} [options.mask=false] Specifies whether or not to mask
   *     `data`
   * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
   *     key
   * @param {Number} options.opcode The opcode
   * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
   *     modified
   * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
   *     RSV1 bit
   * @param {Function} [cb] Callback
   * @private
   */
  getBlobData(blob, compress, options, cb) {
    this._bufferedBytes += options[kByteLength$1];
    this._state = GET_BLOB_DATA$1;
    blob.arrayBuffer().then((arrayBuffer) => {
      if (this._socket.destroyed) {
        const err = new Error(
          "The socket was closed while the blob was being read"
        );
        process.nextTick(callCallbacks$1, this, err, cb);
        return;
      }
      this._bufferedBytes -= options[kByteLength$1];
      const data = toBuffer$4(arrayBuffer);
      if (!compress) {
        this._state = DEFAULT$1;
        this.sendFrame(Sender.frame(data, options), cb);
        this.dequeue();
      } else {
        this.dispatch(data, compress, options, cb);
      }
    }).catch((err) => {
      process.nextTick(onError$1, this, err, cb);
    });
  }
  /**
   * Dispatches a message.
   *
   * @param {(Buffer|String)} data The message to send
   * @param {Boolean} [compress=false] Specifies whether or not to compress
   *     `data`
   * @param {Object} options Options object
   * @param {Boolean} [options.fin=false] Specifies whether or not to set the
   *     FIN bit
   * @param {Function} [options.generateMask] The function used to generate the
   *     masking key
   * @param {Boolean} [options.mask=false] Specifies whether or not to mask
   *     `data`
   * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
   *     key
   * @param {Number} options.opcode The opcode
   * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
   *     modified
   * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
   *     RSV1 bit
   * @param {Function} [cb] Callback
   * @private
   */
  dispatch(data, compress, options, cb) {
    if (!compress) {
      this.sendFrame(Sender.frame(data, options), cb);
      return;
    }
    const perMessageDeflate = this._extensions[PerMessageDeflate$6.extensionName];
    this._bufferedBytes += options[kByteLength$1];
    this._state = DEFLATING$1;
    perMessageDeflate.compress(data, options.fin, (_, buf) => {
      if (this._socket.destroyed) {
        const err = new Error(
          "The socket was closed while data was being compressed"
        );
        callCallbacks$1(this, err, cb);
        return;
      }
      this._bufferedBytes -= options[kByteLength$1];
      this._state = DEFAULT$1;
      options.readOnly = false;
      this.sendFrame(Sender.frame(buf, options), cb);
      this.dequeue();
    });
  }
  /**
   * Executes queued send operations.
   *
   * @private
   */
  dequeue() {
    while (this._state === DEFAULT$1 && this._queue.length) {
      const params = this._queue.shift();
      this._bufferedBytes -= params[3][kByteLength$1];
      Reflect.apply(params[0], this, params.slice(1));
    }
  }
  /**
   * Enqueues a send operation.
   *
   * @param {Array} params Send operation parameters.
   * @private
   */
  enqueue(params) {
    this._bufferedBytes += params[3][kByteLength$1];
    this._queue.push(params);
  }
  /**
   * Sends a frame.
   *
   * @param {(Buffer | String)[]} list The frame to send
   * @param {Function} [cb] Callback
   * @private
   */
  sendFrame(list, cb) {
    if (list.length === 2) {
      this._socket.cork();
      this._socket.write(list[0]);
      this._socket.write(list[1], cb);
      this._socket.uncork();
    } else {
      this._socket.write(list[0], cb);
    }
  }
};
var sender$1 = Sender$3;
function callCallbacks$1(sender2, err, cb) {
  if (typeof cb === "function") cb(err);
  for (let i = 0; i < sender2._queue.length; i++) {
    const params = sender2._queue[i];
    const callback = params[params.length - 1];
    if (typeof callback === "function") callback(err);
  }
}
function onError$1(sender2, err, cb) {
  callCallbacks$1(sender2, err, cb);
  sender2.onerror(err);
}
const { kForOnEventAttribute: kForOnEventAttribute$3, kListener: kListener$3 } = constants$1;
const kCode$1 = Symbol("kCode");
const kData$1 = Symbol("kData");
const kError$2 = Symbol("kError");
const kMessage$1 = Symbol("kMessage");
const kReason$1 = Symbol("kReason");
const kTarget$1 = Symbol("kTarget");
const kType$1 = Symbol("kType");
const kWasClean$1 = Symbol("kWasClean");
let Event$1 = class Event {
  /**
   * Create a new `Event`.
   *
   * @param {String} type The name of the event
   * @throws {TypeError} If the `type` argument is not specified
   */
  constructor(type) {
    this[kTarget$1] = null;
    this[kType$1] = type;
  }
  /**
   * @type {*}
   */
  get target() {
    return this[kTarget$1];
  }
  /**
   * @type {String}
   */
  get type() {
    return this[kType$1];
  }
};
Object.defineProperty(Event$1.prototype, "target", { enumerable: true });
Object.defineProperty(Event$1.prototype, "type", { enumerable: true });
let CloseEvent$1 = class CloseEvent extends Event$1 {
  /**
   * Create a new `CloseEvent`.
   *
   * @param {String} type The name of the event
   * @param {Object} [options] A dictionary object that allows for setting
   *     attributes via object members of the same name
   * @param {Number} [options.code=0] The status code explaining why the
   *     connection was closed
   * @param {String} [options.reason=''] A human-readable string explaining why
   *     the connection was closed
   * @param {Boolean} [options.wasClean=false] Indicates whether or not the
   *     connection was cleanly closed
   */
  constructor(type, options = {}) {
    super(type);
    this[kCode$1] = options.code === void 0 ? 0 : options.code;
    this[kReason$1] = options.reason === void 0 ? "" : options.reason;
    this[kWasClean$1] = options.wasClean === void 0 ? false : options.wasClean;
  }
  /**
   * @type {Number}
   */
  get code() {
    return this[kCode$1];
  }
  /**
   * @type {String}
   */
  get reason() {
    return this[kReason$1];
  }
  /**
   * @type {Boolean}
   */
  get wasClean() {
    return this[kWasClean$1];
  }
};
Object.defineProperty(CloseEvent$1.prototype, "code", { enumerable: true });
Object.defineProperty(CloseEvent$1.prototype, "reason", { enumerable: true });
Object.defineProperty(CloseEvent$1.prototype, "wasClean", { enumerable: true });
let ErrorEvent$1 = class ErrorEvent extends Event$1 {
  /**
   * Create a new `ErrorEvent`.
   *
   * @param {String} type The name of the event
   * @param {Object} [options] A dictionary object that allows for setting
   *     attributes via object members of the same name
   * @param {*} [options.error=null] The error that generated this event
   * @param {String} [options.message=''] The error message
   */
  constructor(type, options = {}) {
    super(type);
    this[kError$2] = options.error === void 0 ? null : options.error;
    this[kMessage$1] = options.message === void 0 ? "" : options.message;
  }
  /**
   * @type {*}
   */
  get error() {
    return this[kError$2];
  }
  /**
   * @type {String}
   */
  get message() {
    return this[kMessage$1];
  }
};
Object.defineProperty(ErrorEvent$1.prototype, "error", { enumerable: true });
Object.defineProperty(ErrorEvent$1.prototype, "message", { enumerable: true });
let MessageEvent$1 = class MessageEvent extends Event$1 {
  /**
   * Create a new `MessageEvent`.
   *
   * @param {String} type The name of the event
   * @param {Object} [options] A dictionary object that allows for setting
   *     attributes via object members of the same name
   * @param {*} [options.data=null] The message content
   */
  constructor(type, options = {}) {
    super(type);
    this[kData$1] = options.data === void 0 ? null : options.data;
  }
  /**
   * @type {*}
   */
  get data() {
    return this[kData$1];
  }
};
Object.defineProperty(MessageEvent$1.prototype, "data", { enumerable: true });
const EventTarget$1 = {
  /**
   * Register an event listener.
   *
   * @param {String} type A string representing the event type to listen for
   * @param {(Function|Object)} handler The listener to add
   * @param {Object} [options] An options object specifies characteristics about
   *     the event listener
   * @param {Boolean} [options.once=false] A `Boolean` indicating that the
   *     listener should be invoked at most once after being added. If `true`,
   *     the listener would be automatically removed when invoked.
   * @public
   */
  addEventListener(type, handler, options = {}) {
    for (const listener of this.listeners(type)) {
      if (!options[kForOnEventAttribute$3] && listener[kListener$3] === handler && !listener[kForOnEventAttribute$3]) {
        return;
      }
    }
    let wrapper;
    if (type === "message") {
      wrapper = function onMessage(data, isBinary) {
        const event = new MessageEvent$1("message", {
          data: isBinary ? data : data.toString()
        });
        event[kTarget$1] = this;
        callListener$1(handler, this, event);
      };
    } else if (type === "close") {
      wrapper = function onClose(code, message) {
        const event = new CloseEvent$1("close", {
          code,
          reason: message.toString(),
          wasClean: this._closeFrameReceived && this._closeFrameSent
        });
        event[kTarget$1] = this;
        callListener$1(handler, this, event);
      };
    } else if (type === "error") {
      wrapper = function onError2(error) {
        const event = new ErrorEvent$1("error", {
          error,
          message: error.message
        });
        event[kTarget$1] = this;
        callListener$1(handler, this, event);
      };
    } else if (type === "open") {
      wrapper = function onOpen() {
        const event = new Event$1("open");
        event[kTarget$1] = this;
        callListener$1(handler, this, event);
      };
    } else {
      return;
    }
    wrapper[kForOnEventAttribute$3] = !!options[kForOnEventAttribute$3];
    wrapper[kListener$3] = handler;
    if (options.once) {
      this.once(type, wrapper);
    } else {
      this.on(type, wrapper);
    }
  },
  /**
   * Remove an event listener.
   *
   * @param {String} type A string representing the event type to remove
   * @param {(Function|Object)} handler The listener to remove
   * @public
   */
  removeEventListener(type, handler) {
    for (const listener of this.listeners(type)) {
      if (listener[kListener$3] === handler && !listener[kForOnEventAttribute$3]) {
        this.removeListener(type, listener);
        break;
      }
    }
  }
};
var eventTarget$1 = {
  EventTarget: EventTarget$1
};
function callListener$1(listener, thisArg, event) {
  if (typeof listener === "object" && listener.handleEvent) {
    listener.handleEvent.call(listener, event);
  } else {
    listener.call(thisArg, event);
  }
}
const { tokenChars: tokenChars$4 } = validationExports$1;
function push$1(dest, name, elem) {
  if (dest[name] === void 0) dest[name] = [elem];
  else dest[name].push(elem);
}
function parse$4(header) {
  const offers = /* @__PURE__ */ Object.create(null);
  let params = /* @__PURE__ */ Object.create(null);
  let mustUnescape = false;
  let isEscaping = false;
  let inQuotes = false;
  let extensionName;
  let paramName;
  let start = -1;
  let code = -1;
  let end = -1;
  let i = 0;
  for (; i < header.length; i++) {
    code = header.charCodeAt(i);
    if (extensionName === void 0) {
      if (end === -1 && tokenChars$4[code] === 1) {
        if (start === -1) start = i;
      } else if (i !== 0 && (code === 32 || code === 9)) {
        if (end === -1 && start !== -1) end = i;
      } else if (code === 59 || code === 44) {
        if (start === -1) {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
        if (end === -1) end = i;
        const name = header.slice(start, end);
        if (code === 44) {
          push$1(offers, name, params);
          params = /* @__PURE__ */ Object.create(null);
        } else {
          extensionName = name;
        }
        start = end = -1;
      } else {
        throw new SyntaxError(`Unexpected character at index ${i}`);
      }
    } else if (paramName === void 0) {
      if (end === -1 && tokenChars$4[code] === 1) {
        if (start === -1) start = i;
      } else if (code === 32 || code === 9) {
        if (end === -1 && start !== -1) end = i;
      } else if (code === 59 || code === 44) {
        if (start === -1) {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
        if (end === -1) end = i;
        push$1(params, header.slice(start, end), true);
        if (code === 44) {
          push$1(offers, extensionName, params);
          params = /* @__PURE__ */ Object.create(null);
          extensionName = void 0;
        }
        start = end = -1;
      } else if (code === 61 && start !== -1 && end === -1) {
        paramName = header.slice(start, i);
        start = end = -1;
      } else {
        throw new SyntaxError(`Unexpected character at index ${i}`);
      }
    } else {
      if (isEscaping) {
        if (tokenChars$4[code] !== 1) {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
        if (start === -1) start = i;
        else if (!mustUnescape) mustUnescape = true;
        isEscaping = false;
      } else if (inQuotes) {
        if (tokenChars$4[code] === 1) {
          if (start === -1) start = i;
        } else if (code === 34 && start !== -1) {
          inQuotes = false;
          end = i;
        } else if (code === 92) {
          isEscaping = true;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      } else if (code === 34 && header.charCodeAt(i - 1) === 61) {
        inQuotes = true;
      } else if (end === -1 && tokenChars$4[code] === 1) {
        if (start === -1) start = i;
      } else if (start !== -1 && (code === 32 || code === 9)) {
        if (end === -1) end = i;
      } else if (code === 59 || code === 44) {
        if (start === -1) {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
        if (end === -1) end = i;
        let value = header.slice(start, end);
        if (mustUnescape) {
          value = value.replace(/\\/g, "");
          mustUnescape = false;
        }
        push$1(params, paramName, value);
        if (code === 44) {
          push$1(offers, extensionName, params);
          params = /* @__PURE__ */ Object.create(null);
          extensionName = void 0;
        }
        paramName = void 0;
        start = end = -1;
      } else {
        throw new SyntaxError(`Unexpected character at index ${i}`);
      }
    }
  }
  if (start === -1 || inQuotes || code === 32 || code === 9) {
    throw new SyntaxError("Unexpected end of input");
  }
  if (end === -1) end = i;
  const token = header.slice(start, end);
  if (extensionName === void 0) {
    push$1(offers, token, params);
  } else {
    if (paramName === void 0) {
      push$1(params, token, true);
    } else if (mustUnescape) {
      push$1(params, paramName, token.replace(/\\/g, ""));
    } else {
      push$1(params, paramName, token);
    }
    push$1(offers, extensionName, params);
  }
  return offers;
}
function format$3(extensions) {
  return Object.keys(extensions).map((extension2) => {
    let configurations = extensions[extension2];
    if (!Array.isArray(configurations)) configurations = [configurations];
    return configurations.map((params) => {
      return [extension2].concat(
        Object.keys(params).map((k) => {
          let values = params[k];
          if (!Array.isArray(values)) values = [values];
          return values.map((v) => v === true ? k : `${k}=${v}`).join("; ");
        })
      ).join("; ");
    }).join(", ");
  }).join(", ");
}
var extension$2 = { format: format$3, parse: parse$4 };
const EventEmitter$2 = require$$0$3;
const https$1 = require$$1$1;
const http$2 = require$$2$1;
const net$1 = require$$3;
const tls$1 = require$$4;
const { randomBytes: randomBytes$1, createHash: createHash$3 } = require$$1;
const { Duplex: Duplex$6, Readable: Readable$1 } = require$$0$2;
const { URL: URL$1 } = require$$7;
const PerMessageDeflate$5 = permessageDeflate$1;
const Receiver$2 = receiver$1;
const Sender$2 = sender$1;
const { isBlob: isBlob$3 } = validationExports$1;
const {
  BINARY_TYPES: BINARY_TYPES$3,
  CLOSE_TIMEOUT: CLOSE_TIMEOUT$3,
  EMPTY_BUFFER: EMPTY_BUFFER$4,
  GUID: GUID$3,
  kForOnEventAttribute: kForOnEventAttribute$2,
  kListener: kListener$2,
  kStatusCode: kStatusCode$3,
  kWebSocket: kWebSocket$5,
  NOOP: NOOP$2
} = constants$1;
const {
  EventTarget: { addEventListener: addEventListener$1, removeEventListener: removeEventListener$1 }
} = eventTarget$1;
const { format: format$2, parse: parse$3 } = extension$2;
const { toBuffer: toBuffer$3 } = bufferUtilExports$1;
const kAborted$1 = Symbol("kAborted");
const protocolVersions$1 = [8, 13];
const readyStates$1 = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
const subprotocolRegex$1 = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
let WebSocket$3 = class WebSocket extends EventEmitter$2 {
  /**
   * Create a new `WebSocket`.
   *
   * @param {(String|URL)} address The URL to which to connect
   * @param {(String|String[])} [protocols] The subprotocols
   * @param {Object} [options] Connection options
   */
  constructor(address, protocols, options) {
    super();
    this._binaryType = BINARY_TYPES$3[0];
    this._closeCode = 1006;
    this._closeFrameReceived = false;
    this._closeFrameSent = false;
    this._closeMessage = EMPTY_BUFFER$4;
    this._closeTimer = null;
    this._errorEmitted = false;
    this._extensions = {};
    this._paused = false;
    this._protocol = "";
    this._readyState = WebSocket.CONNECTING;
    this._receiver = null;
    this._sender = null;
    this._socket = null;
    if (address !== null) {
      this._bufferedAmount = 0;
      this._isServer = false;
      this._redirects = 0;
      if (protocols === void 0) {
        protocols = [];
      } else if (!Array.isArray(protocols)) {
        if (typeof protocols === "object" && protocols !== null) {
          options = protocols;
          protocols = [];
        } else {
          protocols = [protocols];
        }
      }
      initAsClient$1(this, address, protocols, options);
    } else {
      this._autoPong = options.autoPong;
      this._closeTimeout = options.closeTimeout;
      this._isServer = true;
    }
  }
  /**
   * For historical reasons, the custom "nodebuffer" type is used by the default
   * instead of "blob".
   *
   * @type {String}
   */
  get binaryType() {
    return this._binaryType;
  }
  set binaryType(type) {
    if (!BINARY_TYPES$3.includes(type)) return;
    this._binaryType = type;
    if (this._receiver) this._receiver._binaryType = type;
  }
  /**
   * @type {Number}
   */
  get bufferedAmount() {
    if (!this._socket) return this._bufferedAmount;
    return this._socket._writableState.length + this._sender._bufferedBytes;
  }
  /**
   * @type {String}
   */
  get extensions() {
    return Object.keys(this._extensions).join();
  }
  /**
   * @type {Boolean}
   */
  get isPaused() {
    return this._paused;
  }
  /**
   * @type {Function}
   */
  /* istanbul ignore next */
  get onclose() {
    return null;
  }
  /**
   * @type {Function}
   */
  /* istanbul ignore next */
  get onerror() {
    return null;
  }
  /**
   * @type {Function}
   */
  /* istanbul ignore next */
  get onopen() {
    return null;
  }
  /**
   * @type {Function}
   */
  /* istanbul ignore next */
  get onmessage() {
    return null;
  }
  /**
   * @type {String}
   */
  get protocol() {
    return this._protocol;
  }
  /**
   * @type {Number}
   */
  get readyState() {
    return this._readyState;
  }
  /**
   * @type {String}
   */
  get url() {
    return this._url;
  }
  /**
   * Set up the socket and the internal resources.
   *
   * @param {Duplex} socket The network socket between the server and client
   * @param {Buffer} head The first packet of the upgraded stream
   * @param {Object} options Options object
   * @param {Boolean} [options.allowSynchronousEvents=false] Specifies whether
   *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
   *     multiple times in the same tick
   * @param {Function} [options.generateMask] The function used to generate the
   *     masking key
   * @param {Number} [options.maxBufferedChunks=0] The maximum number of
   *     buffered data chunks
   * @param {Number} [options.maxFragments=0] The maximum number of message
   *     fragments
   * @param {Number} [options.maxPayload=0] The maximum allowed message size
   * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
   *     not to skip UTF-8 validation for text and close messages
   * @private
   */
  setSocket(socket, head, options) {
    const receiver2 = new Receiver$2({
      allowSynchronousEvents: options.allowSynchronousEvents,
      binaryType: this.binaryType,
      extensions: this._extensions,
      isServer: this._isServer,
      maxBufferedChunks: options.maxBufferedChunks,
      maxFragments: options.maxFragments,
      maxPayload: options.maxPayload,
      skipUTF8Validation: options.skipUTF8Validation
    });
    const sender2 = new Sender$2(socket, this._extensions, options.generateMask);
    this._receiver = receiver2;
    this._sender = sender2;
    this._socket = socket;
    receiver2[kWebSocket$5] = this;
    sender2[kWebSocket$5] = this;
    socket[kWebSocket$5] = this;
    receiver2.on("conclude", receiverOnConclude$1);
    receiver2.on("drain", receiverOnDrain$1);
    receiver2.on("error", receiverOnError$1);
    receiver2.on("message", receiverOnMessage$1);
    receiver2.on("ping", receiverOnPing$1);
    receiver2.on("pong", receiverOnPong$1);
    sender2.onerror = senderOnError$1;
    if (socket.setTimeout) socket.setTimeout(0);
    if (socket.setNoDelay) socket.setNoDelay();
    if (head.length > 0) socket.unshift(head);
    socket.on("close", socketOnClose$1);
    socket.on("data", socketOnData$1);
    socket.on("end", socketOnEnd$1);
    socket.on("error", socketOnError$2);
    this._readyState = WebSocket.OPEN;
    this.emit("open");
  }
  /**
   * Emit the `'close'` event.
   *
   * @private
   */
  emitClose() {
    if (!this._socket) {
      this._readyState = WebSocket.CLOSED;
      this.emit("close", this._closeCode, this._closeMessage);
      return;
    }
    if (this._extensions[PerMessageDeflate$5.extensionName]) {
      this._extensions[PerMessageDeflate$5.extensionName].cleanup();
    }
    this._receiver.removeAllListeners();
    this._readyState = WebSocket.CLOSED;
    this.emit("close", this._closeCode, this._closeMessage);
  }
  /**
   * Start a closing handshake.
   *
   *          +----------+   +-----------+   +----------+
   *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
   *    |     +----------+   +-----------+   +----------+     |
   *          +----------+   +-----------+         |
   * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
   *          +----------+   +-----------+   |
   *    |           |                        |   +---+        |
   *                +------------------------+-->|fin| - - - -
   *    |         +---+                      |   +---+
   *     - - - - -|fin|<---------------------+
   *              +---+
   *
   * @param {Number} [code] Status code explaining why the connection is closing
   * @param {(String|Buffer)} [data] The reason why the connection is
   *     closing
   * @public
   */
  close(code, data) {
    if (this.readyState === WebSocket.CLOSED) return;
    if (this.readyState === WebSocket.CONNECTING) {
      const msg = "WebSocket was closed before the connection was established";
      abortHandshake$2(this, this._req, msg);
      return;
    }
    if (this.readyState === WebSocket.CLOSING) {
      if (this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted)) {
        this._socket.end();
      }
      return;
    }
    this._readyState = WebSocket.CLOSING;
    this._sender.close(code, data, !this._isServer, (err) => {
      if (err) return;
      this._closeFrameSent = true;
      if (this._closeFrameReceived || this._receiver._writableState.errorEmitted) {
        this._socket.end();
      }
    });
    setCloseTimer$1(this);
  }
  /**
   * Pause the socket.
   *
   * @public
   */
  pause() {
    if (this.readyState === WebSocket.CONNECTING || this.readyState === WebSocket.CLOSED) {
      return;
    }
    this._paused = true;
    this._socket.pause();
  }
  /**
   * Send a ping.
   *
   * @param {*} [data] The data to send
   * @param {Boolean} [mask] Indicates whether or not to mask `data`
   * @param {Function} [cb] Callback which is executed when the ping is sent
   * @public
   */
  ping(data, mask2, cb) {
    if (this.readyState === WebSocket.CONNECTING) {
      throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
    }
    if (typeof data === "function") {
      cb = data;
      data = mask2 = void 0;
    } else if (typeof mask2 === "function") {
      cb = mask2;
      mask2 = void 0;
    }
    if (typeof data === "number") data = data.toString();
    if (this.readyState !== WebSocket.OPEN) {
      sendAfterClose$1(this, data, cb);
      return;
    }
    if (mask2 === void 0) mask2 = !this._isServer;
    this._sender.ping(data || EMPTY_BUFFER$4, mask2, cb);
  }
  /**
   * Send a pong.
   *
   * @param {*} [data] The data to send
   * @param {Boolean} [mask] Indicates whether or not to mask `data`
   * @param {Function} [cb] Callback which is executed when the pong is sent
   * @public
   */
  pong(data, mask2, cb) {
    if (this.readyState === WebSocket.CONNECTING) {
      throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
    }
    if (typeof data === "function") {
      cb = data;
      data = mask2 = void 0;
    } else if (typeof mask2 === "function") {
      cb = mask2;
      mask2 = void 0;
    }
    if (typeof data === "number") data = data.toString();
    if (this.readyState !== WebSocket.OPEN) {
      sendAfterClose$1(this, data, cb);
      return;
    }
    if (mask2 === void 0) mask2 = !this._isServer;
    this._sender.pong(data || EMPTY_BUFFER$4, mask2, cb);
  }
  /**
   * Resume the socket.
   *
   * @public
   */
  resume() {
    if (this.readyState === WebSocket.CONNECTING || this.readyState === WebSocket.CLOSED) {
      return;
    }
    this._paused = false;
    if (!this._receiver._writableState.needDrain) this._socket.resume();
  }
  /**
   * Send a data message.
   *
   * @param {*} data The message to send
   * @param {Object} [options] Options object
   * @param {Boolean} [options.binary] Specifies whether `data` is binary or
   *     text
   * @param {Boolean} [options.compress] Specifies whether or not to compress
   *     `data`
   * @param {Boolean} [options.fin=true] Specifies whether the fragment is the
   *     last one
   * @param {Boolean} [options.mask] Specifies whether or not to mask `data`
   * @param {Function} [cb] Callback which is executed when data is written out
   * @public
   */
  send(data, options, cb) {
    if (this.readyState === WebSocket.CONNECTING) {
      throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
    }
    if (typeof options === "function") {
      cb = options;
      options = {};
    }
    if (typeof data === "number") data = data.toString();
    if (this.readyState !== WebSocket.OPEN) {
      sendAfterClose$1(this, data, cb);
      return;
    }
    const opts = {
      binary: typeof data !== "string",
      mask: !this._isServer,
      compress: true,
      fin: true,
      ...options
    };
    if (!this._extensions[PerMessageDeflate$5.extensionName]) {
      opts.compress = false;
    }
    this._sender.send(data || EMPTY_BUFFER$4, opts, cb);
  }
  /**
   * Forcibly close the connection.
   *
   * @public
   */
  terminate() {
    if (this.readyState === WebSocket.CLOSED) return;
    if (this.readyState === WebSocket.CONNECTING) {
      const msg = "WebSocket was closed before the connection was established";
      abortHandshake$2(this, this._req, msg);
      return;
    }
    if (this._socket) {
      this._readyState = WebSocket.CLOSING;
      this._socket.destroy();
    }
  }
};
Object.defineProperty(WebSocket$3, "CONNECTING", {
  enumerable: true,
  value: readyStates$1.indexOf("CONNECTING")
});
Object.defineProperty(WebSocket$3.prototype, "CONNECTING", {
  enumerable: true,
  value: readyStates$1.indexOf("CONNECTING")
});
Object.defineProperty(WebSocket$3, "OPEN", {
  enumerable: true,
  value: readyStates$1.indexOf("OPEN")
});
Object.defineProperty(WebSocket$3.prototype, "OPEN", {
  enumerable: true,
  value: readyStates$1.indexOf("OPEN")
});
Object.defineProperty(WebSocket$3, "CLOSING", {
  enumerable: true,
  value: readyStates$1.indexOf("CLOSING")
});
Object.defineProperty(WebSocket$3.prototype, "CLOSING", {
  enumerable: true,
  value: readyStates$1.indexOf("CLOSING")
});
Object.defineProperty(WebSocket$3, "CLOSED", {
  enumerable: true,
  value: readyStates$1.indexOf("CLOSED")
});
Object.defineProperty(WebSocket$3.prototype, "CLOSED", {
  enumerable: true,
  value: readyStates$1.indexOf("CLOSED")
});
[
  "binaryType",
  "bufferedAmount",
  "extensions",
  "isPaused",
  "protocol",
  "readyState",
  "url"
].forEach((property) => {
  Object.defineProperty(WebSocket$3.prototype, property, { enumerable: true });
});
["open", "error", "close", "message"].forEach((method) => {
  Object.defineProperty(WebSocket$3.prototype, `on${method}`, {
    enumerable: true,
    get() {
      for (const listener of this.listeners(method)) {
        if (listener[kForOnEventAttribute$2]) return listener[kListener$2];
      }
      return null;
    },
    set(handler) {
      for (const listener of this.listeners(method)) {
        if (listener[kForOnEventAttribute$2]) {
          this.removeListener(method, listener);
          break;
        }
      }
      if (typeof handler !== "function") return;
      this.addEventListener(method, handler, {
        [kForOnEventAttribute$2]: true
      });
    }
  });
});
WebSocket$3.prototype.addEventListener = addEventListener$1;
WebSocket$3.prototype.removeEventListener = removeEventListener$1;
var websocket$1 = WebSocket$3;
function initAsClient$1(websocket2, address, protocols, options) {
  const opts = {
    allowSynchronousEvents: true,
    autoPong: true,
    closeTimeout: CLOSE_TIMEOUT$3,
    protocolVersion: protocolVersions$1[1],
    maxBufferedChunks: 256 * 1024,
    maxFragments: 16 * 1024,
    maxPayload: 100 * 1024 * 1024,
    skipUTF8Validation: false,
    perMessageDeflate: true,
    followRedirects: false,
    maxRedirects: 10,
    ...options,
    socketPath: void 0,
    hostname: void 0,
    protocol: void 0,
    timeout: void 0,
    method: "GET",
    host: void 0,
    path: void 0,
    port: void 0
  };
  websocket2._autoPong = opts.autoPong;
  websocket2._closeTimeout = opts.closeTimeout;
  if (!protocolVersions$1.includes(opts.protocolVersion)) {
    throw new RangeError(
      `Unsupported protocol version: ${opts.protocolVersion} (supported versions: ${protocolVersions$1.join(", ")})`
    );
  }
  let parsedUrl;
  if (address instanceof URL$1) {
    parsedUrl = address;
  } else {
    try {
      parsedUrl = new URL$1(address);
    } catch {
      throw new SyntaxError(`Invalid URL: ${address}`);
    }
  }
  if (parsedUrl.protocol === "http:") {
    parsedUrl.protocol = "ws:";
  } else if (parsedUrl.protocol === "https:") {
    parsedUrl.protocol = "wss:";
  }
  websocket2._url = parsedUrl.href;
  const isSecure = parsedUrl.protocol === "wss:";
  const isIpcUrl = parsedUrl.protocol === "ws+unix:";
  let invalidUrlMessage;
  if (parsedUrl.protocol !== "ws:" && !isSecure && !isIpcUrl) {
    invalidUrlMessage = `The URL's protocol must be one of "ws:", "wss:", "http:", "https:", or "ws+unix:"`;
  } else if (isIpcUrl && !parsedUrl.pathname) {
    invalidUrlMessage = "The URL's pathname is empty";
  } else if (parsedUrl.hash) {
    invalidUrlMessage = "The URL contains a fragment identifier";
  }
  if (invalidUrlMessage) {
    const err = new SyntaxError(invalidUrlMessage);
    if (websocket2._redirects === 0) {
      throw err;
    } else {
      emitErrorAndClose$1(websocket2, err);
      return;
    }
  }
  const defaultPort = isSecure ? 443 : 80;
  const key = randomBytes$1(16).toString("base64");
  const request = isSecure ? https$1.request : http$2.request;
  const protocolSet = /* @__PURE__ */ new Set();
  let perMessageDeflate;
  opts.createConnection = opts.createConnection || (isSecure ? tlsConnect$1 : netConnect$1);
  opts.defaultPort = opts.defaultPort || defaultPort;
  opts.port = parsedUrl.port || defaultPort;
  opts.host = parsedUrl.hostname.startsWith("[") ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
  opts.headers = {
    ...opts.headers,
    "Sec-WebSocket-Version": opts.protocolVersion,
    "Sec-WebSocket-Key": key,
    Connection: "Upgrade",
    Upgrade: "websocket"
  };
  opts.path = parsedUrl.pathname + parsedUrl.search;
  opts.timeout = opts.handshakeTimeout;
  if (opts.perMessageDeflate) {
    perMessageDeflate = new PerMessageDeflate$5({
      ...opts.perMessageDeflate,
      isServer: false,
      maxPayload: opts.maxPayload
    });
    opts.headers["Sec-WebSocket-Extensions"] = format$2({
      [PerMessageDeflate$5.extensionName]: perMessageDeflate.offer()
    });
  }
  if (protocols.length) {
    for (const protocol of protocols) {
      if (typeof protocol !== "string" || !subprotocolRegex$1.test(protocol) || protocolSet.has(protocol)) {
        throw new SyntaxError(
          "An invalid or duplicated subprotocol was specified"
        );
      }
      protocolSet.add(protocol);
    }
    opts.headers["Sec-WebSocket-Protocol"] = protocols.join(",");
  }
  if (opts.origin) {
    if (opts.protocolVersion < 13) {
      opts.headers["Sec-WebSocket-Origin"] = opts.origin;
    } else {
      opts.headers.Origin = opts.origin;
    }
  }
  if (parsedUrl.username || parsedUrl.password) {
    opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
  }
  if (isIpcUrl) {
    const parts = opts.path.split(":");
    opts.socketPath = parts[0];
    opts.path = parts[1];
  }
  let req;
  if (opts.followRedirects) {
    if (websocket2._redirects === 0) {
      websocket2._originalIpc = isIpcUrl;
      websocket2._originalSecure = isSecure;
      websocket2._originalHostOrSocketPath = isIpcUrl ? opts.socketPath : parsedUrl.host;
      const headers = options && options.headers;
      options = { ...options, headers: {} };
      if (headers) {
        for (const [key2, value] of Object.entries(headers)) {
          options.headers[key2.toLowerCase()] = value;
        }
      }
    } else if (websocket2.listenerCount("redirect") === 0) {
      const isSameHost = isIpcUrl ? websocket2._originalIpc ? opts.socketPath === websocket2._originalHostOrSocketPath : false : websocket2._originalIpc ? false : parsedUrl.host === websocket2._originalHostOrSocketPath;
      if (!isSameHost || websocket2._originalSecure && !isSecure) {
        delete opts.headers.authorization;
        delete opts.headers.cookie;
        if (!isSameHost) delete opts.headers.host;
        opts.auth = void 0;
      }
    }
    if (opts.auth && !options.headers.authorization) {
      options.headers.authorization = "Basic " + Buffer.from(opts.auth).toString("base64");
    }
    req = websocket2._req = request(opts);
    if (websocket2._redirects) {
      websocket2.emit("redirect", websocket2.url, req);
    }
  } else {
    req = websocket2._req = request(opts);
  }
  if (opts.timeout) {
    req.on("timeout", () => {
      abortHandshake$2(websocket2, req, "Opening handshake has timed out");
    });
  }
  req.on("error", (err) => {
    if (req === null || req[kAborted$1]) return;
    req = websocket2._req = null;
    emitErrorAndClose$1(websocket2, err);
  });
  req.on("response", (res) => {
    const location = res.headers.location;
    const statusCode = res.statusCode;
    if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
      if (++websocket2._redirects > opts.maxRedirects) {
        abortHandshake$2(websocket2, req, "Maximum redirects exceeded");
        return;
      }
      req.abort();
      let addr;
      try {
        addr = new URL$1(location, address);
      } catch (e) {
        const err = new SyntaxError(`Invalid URL: ${location}`);
        emitErrorAndClose$1(websocket2, err);
        return;
      }
      initAsClient$1(websocket2, addr, protocols, options);
    } else if (!websocket2.emit("unexpected-response", req, res)) {
      abortHandshake$2(
        websocket2,
        req,
        `Unexpected server response: ${res.statusCode}`
      );
    }
  });
  req.on("upgrade", (res, socket, head) => {
    websocket2.emit("upgrade", res);
    if (websocket2.readyState !== WebSocket$3.CONNECTING) return;
    req = websocket2._req = null;
    const upgrade2 = res.headers.upgrade;
    if (upgrade2 === void 0 || upgrade2.toLowerCase() !== "websocket") {
      abortHandshake$2(websocket2, socket, "Invalid Upgrade header");
      return;
    }
    const digest = createHash$3("sha1").update(key + GUID$3).digest("base64");
    if (res.headers["sec-websocket-accept"] !== digest) {
      abortHandshake$2(websocket2, socket, "Invalid Sec-WebSocket-Accept header");
      return;
    }
    const serverProt = res.headers["sec-websocket-protocol"];
    let protError;
    if (serverProt !== void 0) {
      if (!protocolSet.size) {
        protError = "Server sent a subprotocol but none was requested";
      } else if (!protocolSet.has(serverProt)) {
        protError = "Server sent an invalid subprotocol";
      }
    } else if (protocolSet.size) {
      protError = "Server sent no subprotocol";
    }
    if (protError) {
      abortHandshake$2(websocket2, socket, protError);
      return;
    }
    if (serverProt) websocket2._protocol = serverProt;
    const secWebSocketExtensions = res.headers["sec-websocket-extensions"];
    if (secWebSocketExtensions !== void 0) {
      if (!perMessageDeflate) {
        const message = "Server sent a Sec-WebSocket-Extensions header but no extension was requested";
        abortHandshake$2(websocket2, socket, message);
        return;
      }
      let extensions;
      try {
        extensions = parse$3(secWebSocketExtensions);
      } catch (err) {
        const message = "Invalid Sec-WebSocket-Extensions header";
        abortHandshake$2(websocket2, socket, message);
        return;
      }
      const extensionNames = Object.keys(extensions);
      if (extensionNames.length !== 1 || extensionNames[0] !== PerMessageDeflate$5.extensionName) {
        const message = "Server indicated an extension that was not requested";
        abortHandshake$2(websocket2, socket, message);
        return;
      }
      try {
        perMessageDeflate.accept(extensions[PerMessageDeflate$5.extensionName]);
      } catch (err) {
        const message = "Invalid Sec-WebSocket-Extensions header";
        abortHandshake$2(websocket2, socket, message);
        return;
      }
      websocket2._extensions[PerMessageDeflate$5.extensionName] = perMessageDeflate;
    }
    websocket2.setSocket(socket, head, {
      allowSynchronousEvents: opts.allowSynchronousEvents,
      generateMask: opts.generateMask,
      maxBufferedChunks: opts.maxBufferedChunks,
      maxFragments: opts.maxFragments,
      maxPayload: opts.maxPayload,
      skipUTF8Validation: opts.skipUTF8Validation
    });
  });
  if (opts.finishRequest) {
    opts.finishRequest(req, websocket2);
  } else {
    req.end();
  }
}
function emitErrorAndClose$1(websocket2, err) {
  websocket2._readyState = WebSocket$3.CLOSING;
  websocket2._errorEmitted = true;
  websocket2.emit("error", err);
  websocket2.emitClose();
}
function netConnect$1(options) {
  options.path = options.socketPath;
  return net$1.connect(options);
}
function tlsConnect$1(options) {
  options.path = void 0;
  if (!options.servername && options.servername !== "") {
    options.servername = net$1.isIP(options.host) ? "" : options.host;
  }
  return tls$1.connect(options);
}
function abortHandshake$2(websocket2, stream, message) {
  websocket2._readyState = WebSocket$3.CLOSING;
  const err = new Error(message);
  Error.captureStackTrace(err, abortHandshake$2);
  if (stream.setHeader) {
    stream[kAborted$1] = true;
    stream.abort();
    if (stream.socket && !stream.socket.destroyed) {
      stream.socket.destroy();
    }
    process.nextTick(emitErrorAndClose$1, websocket2, err);
  } else {
    stream.destroy(err);
    stream.once("error", websocket2.emit.bind(websocket2, "error"));
    stream.once("close", websocket2.emitClose.bind(websocket2));
  }
}
function sendAfterClose$1(websocket2, data, cb) {
  if (data) {
    const length = isBlob$3(data) ? data.size : toBuffer$3(data).length;
    if (websocket2._socket) websocket2._sender._bufferedBytes += length;
    else websocket2._bufferedAmount += length;
  }
  if (cb) {
    const err = new Error(
      `WebSocket is not open: readyState ${websocket2.readyState} (${readyStates$1[websocket2.readyState]})`
    );
    process.nextTick(cb, err);
  }
}
function receiverOnConclude$1(code, reason) {
  const websocket2 = this[kWebSocket$5];
  websocket2._closeFrameReceived = true;
  websocket2._closeMessage = reason;
  websocket2._closeCode = code;
  if (websocket2._socket[kWebSocket$5] === void 0) return;
  websocket2._socket.removeListener("data", socketOnData$1);
  process.nextTick(resume$1, websocket2._socket);
  if (code === 1005) websocket2.close();
  else websocket2.close(code, reason);
}
function receiverOnDrain$1() {
  const websocket2 = this[kWebSocket$5];
  if (!websocket2.isPaused) websocket2._socket.resume();
}
function receiverOnError$1(err) {
  const websocket2 = this[kWebSocket$5];
  if (websocket2._socket[kWebSocket$5] !== void 0) {
    websocket2._socket.removeListener("data", socketOnData$1);
    process.nextTick(resume$1, websocket2._socket);
    websocket2.close(err[kStatusCode$3]);
  }
  if (!websocket2._errorEmitted) {
    websocket2._errorEmitted = true;
    websocket2.emit("error", err);
  }
}
function receiverOnFinish$1() {
  this[kWebSocket$5].emitClose();
}
function receiverOnMessage$1(data, isBinary) {
  this[kWebSocket$5].emit("message", data, isBinary);
}
function receiverOnPing$1(data) {
  const websocket2 = this[kWebSocket$5];
  if (websocket2._autoPong) websocket2.pong(data, !this._isServer, NOOP$2);
  websocket2.emit("ping", data);
}
function receiverOnPong$1(data) {
  this[kWebSocket$5].emit("pong", data);
}
function resume$1(stream) {
  stream.resume();
}
function senderOnError$1(err) {
  const websocket2 = this[kWebSocket$5];
  if (websocket2.readyState === WebSocket$3.CLOSED) return;
  if (websocket2.readyState === WebSocket$3.OPEN) {
    websocket2._readyState = WebSocket$3.CLOSING;
    setCloseTimer$1(websocket2);
  }
  this._socket.end();
  if (!websocket2._errorEmitted) {
    websocket2._errorEmitted = true;
    websocket2.emit("error", err);
  }
}
function setCloseTimer$1(websocket2) {
  websocket2._closeTimer = setTimeout(
    websocket2._socket.destroy.bind(websocket2._socket),
    websocket2._closeTimeout
  );
}
function socketOnClose$1() {
  const websocket2 = this[kWebSocket$5];
  this.removeListener("close", socketOnClose$1);
  this.removeListener("data", socketOnData$1);
  this.removeListener("end", socketOnEnd$1);
  websocket2._readyState = WebSocket$3.CLOSING;
  if (!this._readableState.endEmitted && !websocket2._closeFrameReceived && !websocket2._receiver._writableState.errorEmitted && this._readableState.length !== 0) {
    const chunk = this.read(this._readableState.length);
    websocket2._receiver.write(chunk);
  }
  websocket2._receiver.end();
  this[kWebSocket$5] = void 0;
  clearTimeout(websocket2._closeTimer);
  if (websocket2._receiver._writableState.finished || websocket2._receiver._writableState.errorEmitted) {
    websocket2.emitClose();
  } else {
    websocket2._receiver.on("error", receiverOnFinish$1);
    websocket2._receiver.on("finish", receiverOnFinish$1);
  }
}
function socketOnData$1(chunk) {
  if (!this[kWebSocket$5]._receiver.write(chunk)) {
    this.pause();
  }
}
function socketOnEnd$1() {
  const websocket2 = this[kWebSocket$5];
  websocket2._readyState = WebSocket$3.CLOSING;
  websocket2._receiver.end();
  this.end();
}
function socketOnError$2() {
  const websocket2 = this[kWebSocket$5];
  this.removeListener("error", socketOnError$2);
  this.on("error", NOOP$2);
  if (websocket2) {
    websocket2._readyState = WebSocket$3.CLOSING;
    this.destroy();
  }
}
const { Duplex: Duplex$5 } = require$$0$2;
const { tokenChars: tokenChars$3 } = validationExports$1;
function parse$2(header) {
  const protocols = /* @__PURE__ */ new Set();
  let start = -1;
  let end = -1;
  let i = 0;
  for (i; i < header.length; i++) {
    const code = header.charCodeAt(i);
    if (end === -1 && tokenChars$3[code] === 1) {
      if (start === -1) start = i;
    } else if (i !== 0 && (code === 32 || code === 9)) {
      if (end === -1 && start !== -1) end = i;
    } else if (code === 44) {
      if (start === -1) {
        throw new SyntaxError(`Unexpected character at index ${i}`);
      }
      if (end === -1) end = i;
      const protocol2 = header.slice(start, end);
      if (protocols.has(protocol2)) {
        throw new SyntaxError(`The "${protocol2}" subprotocol is duplicated`);
      }
      protocols.add(protocol2);
      start = end = -1;
    } else {
      throw new SyntaxError(`Unexpected character at index ${i}`);
    }
  }
  if (start === -1 || end !== -1) {
    throw new SyntaxError("Unexpected end of input");
  }
  const protocol = header.slice(start, i);
  if (protocols.has(protocol)) {
    throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
  }
  protocols.add(protocol);
  return protocols;
}
var subprotocol$1 = { parse: parse$2 };
const EventEmitter$1 = require$$0$3;
const http$1 = require$$2$1;
const { Duplex: Duplex$4 } = require$$0$2;
const { createHash: createHash$2 } = require$$1;
const extension$1 = extension$2;
const PerMessageDeflate$4 = permessageDeflate$1;
const subprotocol = subprotocol$1;
const WebSocket$2 = websocket$1;
const { CLOSE_TIMEOUT: CLOSE_TIMEOUT$2, GUID: GUID$2, kWebSocket: kWebSocket$4 } = constants$1;
const keyRegex = /^[+/0-9A-Za-z]{22}==$/;
const RUNNING = 0;
const CLOSING = 1;
const CLOSED = 2;
class WebSocketServer extends EventEmitter$1 {
  /**
   * Create a `WebSocketServer` instance.
   *
   * @param {Object} options Configuration options
   * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
   *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
   *     multiple times in the same tick
   * @param {Boolean} [options.autoPong=true] Specifies whether or not to
   *     automatically send a pong in response to a ping
   * @param {Number} [options.backlog=511] The maximum length of the queue of
   *     pending connections
   * @param {Boolean} [options.clientTracking=true] Specifies whether or not to
   *     track clients
   * @param {Number} [options.closeTimeout=30000] Duration in milliseconds to
   *     wait for the closing handshake to finish after `websocket.close()` is
   *     called
   * @param {Function} [options.handleProtocols] A hook to handle protocols
   * @param {String} [options.host] The hostname where to bind the server
   * @param {Number} [options.maxBufferedChunks=262144] The maximum number of
   *     buffered data chunks
   * @param {Number} [options.maxFragments=16384] The maximum number of message
   *     fragments
   * @param {Number} [options.maxPayload=104857600] The maximum allowed message
   *     size
   * @param {Boolean} [options.noServer=false] Enable no server mode
   * @param {String} [options.path] Accept only connections matching this path
   * @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
   *     permessage-deflate
   * @param {Number} [options.port] The port where to bind the server
   * @param {(http.Server|https.Server)} [options.server] A pre-created HTTP/S
   *     server to use
   * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
   *     not to skip UTF-8 validation for text and close messages
   * @param {Function} [options.verifyClient] A hook to reject connections
   * @param {Function} [options.WebSocket=WebSocket] Specifies the `WebSocket`
   *     class to use. It must be the `WebSocket` class or class that extends it
   * @param {Function} [callback] A listener for the `listening` event
   */
  constructor(options, callback) {
    super();
    options = {
      allowSynchronousEvents: true,
      autoPong: true,
      maxBufferedChunks: 256 * 1024,
      maxFragments: 16 * 1024,
      maxPayload: 100 * 1024 * 1024,
      skipUTF8Validation: false,
      perMessageDeflate: false,
      handleProtocols: null,
      clientTracking: true,
      closeTimeout: CLOSE_TIMEOUT$2,
      verifyClient: null,
      noServer: false,
      backlog: null,
      // use default (511 as implemented in net.js)
      server: null,
      host: null,
      path: null,
      port: null,
      WebSocket: WebSocket$2,
      ...options
    };
    if (options.port == null && !options.server && !options.noServer || options.port != null && (options.server || options.noServer) || options.server && options.noServer) {
      throw new TypeError(
        'One and only one of the "port", "server", or "noServer" options must be specified'
      );
    }
    if (options.port != null) {
      this._server = http$1.createServer((req, res) => {
        const body = http$1.STATUS_CODES[426];
        res.writeHead(426, {
          "Content-Length": body.length,
          "Content-Type": "text/plain"
        });
        res.end(body);
      });
      this._server.listen(
        options.port,
        options.host,
        options.backlog,
        callback
      );
    } else if (options.server) {
      this._server = options.server;
    }
    if (this._server) {
      const emitConnection = this.emit.bind(this, "connection");
      this._removeListeners = addListeners(this._server, {
        listening: this.emit.bind(this, "listening"),
        error: this.emit.bind(this, "error"),
        upgrade: (req, socket, head) => {
          this.handleUpgrade(req, socket, head, emitConnection);
        }
      });
    }
    if (options.perMessageDeflate === true) options.perMessageDeflate = {};
    if (options.clientTracking) {
      this.clients = /* @__PURE__ */ new Set();
      this._shouldEmitClose = false;
    }
    this.options = options;
    this._state = RUNNING;
  }
  /**
   * Returns the bound address, the address family name, and port of the server
   * as reported by the operating system if listening on an IP socket.
   * If the server is listening on a pipe or UNIX domain socket, the name is
   * returned as a string.
   *
   * @return {(Object|String|null)} The address of the server
   * @public
   */
  address() {
    if (this.options.noServer) {
      throw new Error('The server is operating in "noServer" mode');
    }
    if (!this._server) return null;
    return this._server.address();
  }
  /**
   * Stop the server from accepting new connections and emit the `'close'` event
   * when all existing connections are closed.
   *
   * @param {Function} [cb] A one-time listener for the `'close'` event
   * @public
   */
  close(cb) {
    if (this._state === CLOSED) {
      if (cb) {
        this.once("close", () => {
          cb(new Error("The server is not running"));
        });
      }
      process.nextTick(emitClose, this);
      return;
    }
    if (cb) this.once("close", cb);
    if (this._state === CLOSING) return;
    this._state = CLOSING;
    if (this.options.noServer || this.options.server) {
      if (this._server) {
        this._removeListeners();
        this._removeListeners = this._server = null;
      }
      if (this.clients) {
        if (!this.clients.size) {
          process.nextTick(emitClose, this);
        } else {
          this._shouldEmitClose = true;
        }
      } else {
        process.nextTick(emitClose, this);
      }
    } else {
      const server = this._server;
      this._removeListeners();
      this._removeListeners = this._server = null;
      server.close(() => {
        emitClose(this);
      });
    }
  }
  /**
   * See if a given request should be handled by this server instance.
   *
   * @param {http.IncomingMessage} req Request object to inspect
   * @return {Boolean} `true` if the request is valid, else `false`
   * @public
   */
  shouldHandle(req) {
    if (this.options.path) {
      const index = req.url.indexOf("?");
      const pathname = index !== -1 ? req.url.slice(0, index) : req.url;
      if (pathname !== this.options.path) return false;
    }
    return true;
  }
  /**
   * Handle a HTTP Upgrade request.
   *
   * @param {http.IncomingMessage} req The request object
   * @param {Duplex} socket The network socket between the server and client
   * @param {Buffer} head The first packet of the upgraded stream
   * @param {Function} cb Callback
   * @public
   */
  handleUpgrade(req, socket, head, cb) {
    socket.on("error", socketOnError$1);
    const key = req.headers["sec-websocket-key"];
    const upgrade2 = req.headers.upgrade;
    const version = +req.headers["sec-websocket-version"];
    if (req.method !== "GET") {
      const message = "Invalid HTTP method";
      abortHandshakeOrEmitwsClientError(this, req, socket, 405, message);
      return;
    }
    if (upgrade2 === void 0 || upgrade2.toLowerCase() !== "websocket") {
      const message = "Invalid Upgrade header";
      abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
      return;
    }
    if (key === void 0 || !keyRegex.test(key)) {
      const message = "Missing or invalid Sec-WebSocket-Key header";
      abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
      return;
    }
    if (version !== 13 && version !== 8) {
      const message = "Missing or invalid Sec-WebSocket-Version header";
      abortHandshakeOrEmitwsClientError(this, req, socket, 400, message, {
        "Sec-WebSocket-Version": "13, 8"
      });
      return;
    }
    if (!this.shouldHandle(req)) {
      abortHandshake$1(socket, 400);
      return;
    }
    const secWebSocketProtocol = req.headers["sec-websocket-protocol"];
    let protocols = /* @__PURE__ */ new Set();
    if (secWebSocketProtocol !== void 0) {
      try {
        protocols = subprotocol.parse(secWebSocketProtocol);
      } catch (err) {
        const message = "Invalid Sec-WebSocket-Protocol header";
        abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
        return;
      }
    }
    const secWebSocketExtensions = req.headers["sec-websocket-extensions"];
    const extensions = {};
    if (this.options.perMessageDeflate && secWebSocketExtensions !== void 0) {
      const perMessageDeflate = new PerMessageDeflate$4({
        ...this.options.perMessageDeflate,
        isServer: true,
        maxPayload: this.options.maxPayload
      });
      try {
        const offers = extension$1.parse(secWebSocketExtensions);
        if (offers[PerMessageDeflate$4.extensionName]) {
          perMessageDeflate.accept(offers[PerMessageDeflate$4.extensionName]);
          extensions[PerMessageDeflate$4.extensionName] = perMessageDeflate;
        }
      } catch (err) {
        const message = "Invalid or unacceptable Sec-WebSocket-Extensions header";
        abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
        return;
      }
    }
    if (this.options.verifyClient) {
      const info = {
        origin: req.headers[`${version === 8 ? "sec-websocket-origin" : "origin"}`],
        secure: !!(req.socket.authorized || req.socket.encrypted),
        req
      };
      if (this.options.verifyClient.length === 2) {
        this.options.verifyClient(info, (verified, code, message, headers) => {
          if (!verified) {
            return abortHandshake$1(socket, code || 401, message, headers);
          }
          this.completeUpgrade(
            extensions,
            key,
            protocols,
            req,
            socket,
            head,
            cb
          );
        });
        return;
      }
      if (!this.options.verifyClient(info)) return abortHandshake$1(socket, 401);
    }
    this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
  }
  /**
   * Upgrade the connection to WebSocket.
   *
   * @param {Object} extensions The accepted extensions
   * @param {String} key The value of the `Sec-WebSocket-Key` header
   * @param {Set} protocols The subprotocols
   * @param {http.IncomingMessage} req The request object
   * @param {Duplex} socket The network socket between the server and client
   * @param {Buffer} head The first packet of the upgraded stream
   * @param {Function} cb Callback
   * @throws {Error} If called more than once with the same socket
   * @private
   */
  completeUpgrade(extensions, key, protocols, req, socket, head, cb) {
    if (!socket.readable || !socket.writable) return socket.destroy();
    if (socket[kWebSocket$4]) {
      throw new Error(
        "server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration"
      );
    }
    if (this._state > RUNNING) return abortHandshake$1(socket, 503);
    const digest = createHash$2("sha1").update(key + GUID$2).digest("base64");
    const headers = [
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${digest}`
    ];
    const ws = new this.options.WebSocket(null, void 0, this.options);
    if (protocols.size) {
      const protocol = this.options.handleProtocols ? this.options.handleProtocols(protocols, req) : protocols.values().next().value;
      if (protocol) {
        headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
        ws._protocol = protocol;
      }
    }
    if (extensions[PerMessageDeflate$4.extensionName]) {
      const params = extensions[PerMessageDeflate$4.extensionName].params;
      const value = extension$1.format({
        [PerMessageDeflate$4.extensionName]: [params]
      });
      headers.push(`Sec-WebSocket-Extensions: ${value}`);
      ws._extensions = extensions;
    }
    this.emit("headers", headers, req);
    socket.write(headers.concat("\r\n").join("\r\n"));
    socket.removeListener("error", socketOnError$1);
    ws.setSocket(socket, head, {
      allowSynchronousEvents: this.options.allowSynchronousEvents,
      maxBufferedChunks: this.options.maxBufferedChunks,
      maxFragments: this.options.maxFragments,
      maxPayload: this.options.maxPayload,
      skipUTF8Validation: this.options.skipUTF8Validation
    });
    if (this.clients) {
      this.clients.add(ws);
      ws.on("close", () => {
        this.clients.delete(ws);
        if (this._shouldEmitClose && !this.clients.size) {
          process.nextTick(emitClose, this);
        }
      });
    }
    cb(ws, req);
  }
}
var websocketServer = WebSocketServer;
function addListeners(server, map) {
  for (const event of Object.keys(map)) server.on(event, map[event]);
  return function removeListeners() {
    for (const event of Object.keys(map)) {
      server.removeListener(event, map[event]);
    }
  };
}
function emitClose(server) {
  server._state = CLOSED;
  server.emit("close");
}
function socketOnError$1() {
  this.destroy();
}
function abortHandshake$1(socket, code, message, headers) {
  message = message || http$1.STATUS_CODES[code];
  headers = {
    Connection: "close",
    "Content-Type": "text/html",
    "Content-Length": Buffer.byteLength(message),
    ...headers
  };
  socket.once("finish", socket.destroy);
  socket.end(
    `HTTP/1.1 ${code} ${http$1.STATUS_CODES[code]}\r
` + Object.keys(headers).map((h) => `${h}: ${headers[h]}`).join("\r\n") + "\r\n\r\n" + message
  );
}
function abortHandshakeOrEmitwsClientError(server, req, socket, code, message, headers) {
  if (server.listenerCount("wsClientError")) {
    const err = new Error(message);
    Error.captureStackTrace(err, abortHandshakeOrEmitwsClientError);
    server.emit("wsClientError", err, socket, req);
  } else {
    abortHandshake$1(socket, code, message, headers);
  }
}
const WebSocketServer$1 = /* @__PURE__ */ getDefaultExportFromCjs(websocketServer);
var dist = { exports: {} };
var bonjour$1 = {};
var registry = {};
var dnsEqual$1 = {};
Object.defineProperty(dnsEqual$1, "__esModule", { value: true });
dnsEqual$1.default = dnsEqual;
const capitalLetterRegex = /[A-Z]/g;
function toLowerCase(input) {
  return input.toLowerCase();
}
function dnsEqual(a, b) {
  const aFormatted = a.replace(capitalLetterRegex, toLowerCase);
  const bFormatted = b.replace(capitalLetterRegex, toLowerCase);
  return aFormatted === bFormatted;
}
var service = {};
var dnsTxt = {};
Object.defineProperty(dnsTxt, "__esModule", { value: true });
dnsTxt.DnsTxt = void 0;
class DnsTxt {
  constructor(opts = {}) {
    this.binary = opts ? opts.binary : false;
  }
  encode(data = {}) {
    return Object.entries(data).map(([key, value]) => {
      let item = `${key}=${value}`;
      return Buffer.from(item);
    });
  }
  decode(buffer) {
    var data = {};
    try {
      let format2 = buffer.toString();
      let parts = format2.split(/=(.+)/);
      let key = parts[0];
      let value = parts[1];
      data[key] = value;
    } catch (_) {
    }
    return data;
  }
  decodeAll(buffer) {
    return buffer.filter((i) => i.length > 1).map((i) => this.decode(i)).reduce((prev, curr) => {
      var obj = prev;
      let [key] = Object.keys(curr);
      let [value] = Object.values(curr);
      obj[key] = value;
      return obj;
    }, {});
  }
}
dnsTxt.DnsTxt = DnsTxt;
dnsTxt.default = DnsTxt;
var serviceTypes = {};
Object.defineProperty(serviceTypes, "__esModule", { value: true });
serviceTypes.toType = serviceTypes.toString = void 0;
const Prefix = (name) => {
  return "_" + name;
};
const AllowedProp = (key) => {
  let keys = ["name", "protocol", "subtype"];
  return keys.includes(key);
};
const toString = (data) => {
  let formatted = {
    name: data.name,
    protocol: data.protocol,
    subtype: data.subtype
  };
  let entries = Object.entries(formatted);
  return entries.filter(([key, val]) => AllowedProp(key) && val !== void 0).reduce((prev, [key, val]) => {
    switch (typeof val) {
      case "object":
        val.map((i) => prev.push(Prefix(i)));
        break;
      default:
        prev.push(Prefix(val));
        break;
    }
    return prev;
  }, []).join(".");
};
serviceTypes.toString = toString;
const toType = (string) => {
  let parts = string.split(".");
  let subtype;
  for (let i in parts) {
    if (parts[i][0] !== "_")
      continue;
    parts[i] = parts[i].slice(1);
  }
  if (parts.includes("sub")) {
    subtype = parts.shift();
    parts.shift();
  }
  return {
    name: parts.shift(),
    protocol: parts.shift() || null,
    subtype
  };
};
serviceTypes.toType = toType;
var __importDefault$5 = commonjsGlobal && commonjsGlobal.__importDefault || function(mod) {
  return mod && mod.__esModule ? mod : { "default": mod };
};
Object.defineProperty(service, "__esModule", { value: true });
service.Service = void 0;
const os_1 = __importDefault$5(require$$0$4);
const dns_txt_1$1 = __importDefault$5(dnsTxt);
const events_1$1 = require$$0$3;
const service_types_1$1 = serviceTypes;
const TLD$1 = ".local";
class Service extends events_1$1.EventEmitter {
  constructor(config, start, stop) {
    super();
    this.start = start;
    this.stop = stop;
    this.probe = true;
    this.published = false;
    this.activated = false;
    this.destroyed = false;
    this.txtService = new dns_txt_1$1.default();
    if (!config.name)
      throw new Error("ServiceConfig requires `name` property to be set");
    if (!config.type)
      throw new Error("ServiceConfig requires `type` property to be set");
    if (!config.port)
      throw new Error("ServiceConfig requires `port` property to be set");
    this.name = config.name.split(".").join("-");
    this.protocol = config.protocol || "tcp";
    this.type = (0, service_types_1$1.toString)({ name: config.type, protocol: this.protocol });
    this.port = config.port;
    this.host = config.host || os_1.default.hostname();
    this.fqdn = `${this.name}.${this.type}${TLD$1}`;
    this.txt = config.txt;
    this.subtypes = config.subtypes;
    this.disableIPv6 = !!config.disableIPv6;
  }
  records() {
    var records = [
      this.RecordPTR(this),
      this.RecordSRV(this),
      this.RecordTXT(this),
      this.RecordServicePTR(this)
    ];
    for (let subtype of this.subtypes || []) {
      records.push(this.RecordSubtypePTR(this, subtype));
    }
    let ifaces = Object.values(os_1.default.networkInterfaces());
    for (let iface of ifaces) {
      let addrs = iface;
      for (let addr of addrs) {
        if (addr.internal || addr.mac === "00:00:00:00:00:00")
          continue;
        switch (addr.family) {
          case "IPv4":
            records.push(this.RecordA(this, addr.address));
            break;
          case "IPv6":
            if (this.disableIPv6)
              break;
            records.push(this.RecordAAAA(this, addr.address));
            break;
        }
      }
    }
    return records;
  }
  RecordPTR(service2) {
    return {
      name: `${service2.type}${TLD$1}`,
      type: "PTR",
      ttl: 28800,
      data: service2.fqdn
    };
  }
  RecordServicePTR(service2) {
    return {
      name: `_services._dns-sd._udp${TLD$1}`,
      type: "PTR",
      ttl: 120,
      data: `${service2.type}${TLD$1}`
    };
  }
  RecordSubtypePTR(service2, subtype) {
    return {
      name: `_${subtype}._sub.${service2.type}${TLD$1}`,
      type: "PTR",
      ttl: 28800,
      data: `${service2.name}.${service2.type}${TLD$1}`
    };
  }
  RecordSRV(service2) {
    return {
      name: service2.fqdn,
      type: "SRV",
      ttl: 120,
      data: {
        port: service2.port,
        target: service2.host
      }
    };
  }
  RecordTXT(service2) {
    return {
      name: service2.fqdn,
      type: "TXT",
      ttl: 4500,
      data: this.txtService.encode(service2.txt)
    };
  }
  RecordA(service2, ip) {
    return {
      name: service2.host,
      type: "A",
      ttl: 120,
      data: ip
    };
  }
  RecordAAAA(service2, ip) {
    return {
      name: service2.host,
      type: "AAAA",
      ttl: 120,
      data: ip
    };
  }
}
service.Service = Service;
service.default = Service;
var __importDefault$4 = commonjsGlobal && commonjsGlobal.__importDefault || function(mod) {
  return mod && mod.__esModule ? mod : { "default": mod };
};
Object.defineProperty(registry, "__esModule", { value: true });
registry.Registry = void 0;
const dns_equal_1$2 = __importDefault$4(dnsEqual$1);
const service_1$1 = __importDefault$4(service);
const REANNOUNCE_MAX_MS = 60 * 60 * 1e3;
const REANNOUNCE_FACTOR = 3;
const noop$2 = function() {
};
class Registry {
  constructor(server) {
    this.services = [];
    this.server = server;
  }
  publish(config) {
    const configProbe = config.probe !== false;
    const service2 = new service_1$1.default(config, start.bind(null, this), stop.bind(null, this));
    function start(registry2, { probe = configProbe } = {}) {
      if (service2.activated)
        return;
      service2.activated = true;
      registry2.services.push(service2);
      if (!(service2 instanceof service_1$1.default))
        return;
      if (probe) {
        registry2.probe(registry2.server.mdns, service2, (exists) => {
          if (exists) {
            if (service2.stop !== void 0)
              service2.stop();
            console.log(new Error("Service name is already in use on the network"));
            return;
          }
          registry2.announce(registry2.server, service2);
        });
      } else {
        registry2.announce(registry2.server, service2);
      }
    }
    function stop(registry2, callback) {
      if (!callback)
        callback = noop$2;
      if (!service2.activated)
        return process.nextTick(callback);
      if (!(service2 instanceof service_1$1.default))
        return process.nextTick(callback);
      registry2.teardown(registry2.server, service2, callback);
      const index = registry2.services.indexOf(service2);
      if (index !== -1)
        registry2.services.splice(index, 1);
    }
    service2.start();
    return service2;
  }
  unpublishAll(callback) {
    this.teardown(this.server, this.services, callback);
    this.services = [];
  }
  destroy() {
    this.services.map((service2) => service2.destroyed = true);
  }
  probe(mdns, service2, callback) {
    var sent = false;
    var retries = 0;
    var timer;
    const send = () => {
      if (!service2.activated || service2.destroyed)
        return;
      mdns.query(service2.fqdn, "ANY", function() {
        sent = true;
        timer = setTimeout(++retries < 3 ? send : done, 250);
        timer.unref();
      });
    };
    const onresponse = (packet2) => {
      if (!sent)
        return;
      if (packet2.answers.some(matchRR) || packet2.additionals.some(matchRR))
        done(true);
    };
    const matchRR = (rr) => {
      return (0, dns_equal_1$2.default)(rr.name, service2.fqdn);
    };
    const done = (exists) => {
      mdns.removeListener("response", onresponse);
      clearTimeout(timer);
      callback(!!exists);
    };
    mdns.on("response", onresponse);
    setTimeout(send, Math.random() * 250);
  }
  announce(server, service2) {
    var delay = 1e3;
    var packet2 = service2.records();
    server.register(packet2);
    const broadcast = () => {
      if (!service2.activated || service2.destroyed)
        return;
      server.mdns.respond(packet2, function() {
        if (!service2.published) {
          service2.activated = true;
          service2.published = true;
          service2.emit("up");
        }
        delay = delay * REANNOUNCE_FACTOR;
        if (delay < REANNOUNCE_MAX_MS && !service2.destroyed) {
          setTimeout(broadcast, delay).unref();
        }
      });
    };
    broadcast();
  }
  teardown(server, services, callback) {
    if (!Array.isArray(services))
      services = [services];
    services = services.filter((service2) => service2.activated);
    var records = services.flatMap(function(service2) {
      service2.activated = false;
      var records2 = service2.records();
      records2.forEach((record) => {
        record.ttl = 0;
      });
      return records2;
    });
    if (records.length === 0)
      return callback && process.nextTick(callback);
    server.unregister(records);
    server.mdns.respond(records, function() {
      services.forEach(function(service2) {
        service2.published = false;
      });
      if (typeof callback === "function") {
        callback.apply(null, arguments);
      }
    });
  }
}
registry.Registry = Registry;
registry.default = Registry;
var mdnsServer = {};
var dnsPacket = {};
var types = {};
types.toString = function(type) {
  switch (type) {
    case 1:
      return "A";
    case 10:
      return "NULL";
    case 28:
      return "AAAA";
    case 18:
      return "AFSDB";
    case 42:
      return "APL";
    case 257:
      return "CAA";
    case 60:
      return "CDNSKEY";
    case 59:
      return "CDS";
    case 37:
      return "CERT";
    case 5:
      return "CNAME";
    case 49:
      return "DHCID";
    case 32769:
      return "DLV";
    case 39:
      return "DNAME";
    case 48:
      return "DNSKEY";
    case 43:
      return "DS";
    case 55:
      return "HIP";
    case 13:
      return "HINFO";
    case 45:
      return "IPSECKEY";
    case 25:
      return "KEY";
    case 36:
      return "KX";
    case 29:
      return "LOC";
    case 15:
      return "MX";
    case 35:
      return "NAPTR";
    case 2:
      return "NS";
    case 47:
      return "NSEC";
    case 50:
      return "NSEC3";
    case 51:
      return "NSEC3PARAM";
    case 12:
      return "PTR";
    case 46:
      return "RRSIG";
    case 17:
      return "RP";
    case 24:
      return "SIG";
    case 6:
      return "SOA";
    case 99:
      return "SPF";
    case 33:
      return "SRV";
    case 44:
      return "SSHFP";
    case 32768:
      return "TA";
    case 249:
      return "TKEY";
    case 52:
      return "TLSA";
    case 250:
      return "TSIG";
    case 16:
      return "TXT";
    case 252:
      return "AXFR";
    case 251:
      return "IXFR";
    case 41:
      return "OPT";
    case 255:
      return "ANY";
  }
  return "UNKNOWN_" + type;
};
types.toType = function(name) {
  switch (name.toUpperCase()) {
    case "A":
      return 1;
    case "NULL":
      return 10;
    case "AAAA":
      return 28;
    case "AFSDB":
      return 18;
    case "APL":
      return 42;
    case "CAA":
      return 257;
    case "CDNSKEY":
      return 60;
    case "CDS":
      return 59;
    case "CERT":
      return 37;
    case "CNAME":
      return 5;
    case "DHCID":
      return 49;
    case "DLV":
      return 32769;
    case "DNAME":
      return 39;
    case "DNSKEY":
      return 48;
    case "DS":
      return 43;
    case "HIP":
      return 55;
    case "HINFO":
      return 13;
    case "IPSECKEY":
      return 45;
    case "KEY":
      return 25;
    case "KX":
      return 36;
    case "LOC":
      return 29;
    case "MX":
      return 15;
    case "NAPTR":
      return 35;
    case "NS":
      return 2;
    case "NSEC":
      return 47;
    case "NSEC3":
      return 50;
    case "NSEC3PARAM":
      return 51;
    case "PTR":
      return 12;
    case "RRSIG":
      return 46;
    case "RP":
      return 17;
    case "SIG":
      return 24;
    case "SOA":
      return 6;
    case "SPF":
      return 99;
    case "SRV":
      return 33;
    case "SSHFP":
      return 44;
    case "TA":
      return 32768;
    case "TKEY":
      return 249;
    case "TLSA":
      return 52;
    case "TSIG":
      return 250;
    case "TXT":
      return 16;
    case "AXFR":
      return 252;
    case "IXFR":
      return 251;
    case "OPT":
      return 41;
    case "ANY":
      return 255;
    case "*":
      return 255;
  }
  if (name.toUpperCase().startsWith("UNKNOWN_")) return parseInt(name.slice(8));
  return 0;
};
var rcodes = {};
rcodes.toString = function(rcode) {
  switch (rcode) {
    case 0:
      return "NOERROR";
    case 1:
      return "FORMERR";
    case 2:
      return "SERVFAIL";
    case 3:
      return "NXDOMAIN";
    case 4:
      return "NOTIMP";
    case 5:
      return "REFUSED";
    case 6:
      return "YXDOMAIN";
    case 7:
      return "YXRRSET";
    case 8:
      return "NXRRSET";
    case 9:
      return "NOTAUTH";
    case 10:
      return "NOTZONE";
    case 11:
      return "RCODE_11";
    case 12:
      return "RCODE_12";
    case 13:
      return "RCODE_13";
    case 14:
      return "RCODE_14";
    case 15:
      return "RCODE_15";
  }
  return "RCODE_" + rcode;
};
rcodes.toRcode = function(code) {
  switch (code.toUpperCase()) {
    case "NOERROR":
      return 0;
    case "FORMERR":
      return 1;
    case "SERVFAIL":
      return 2;
    case "NXDOMAIN":
      return 3;
    case "NOTIMP":
      return 4;
    case "REFUSED":
      return 5;
    case "YXDOMAIN":
      return 6;
    case "YXRRSET":
      return 7;
    case "NXRRSET":
      return 8;
    case "NOTAUTH":
      return 9;
    case "NOTZONE":
      return 10;
    case "RCODE_11":
      return 11;
    case "RCODE_12":
      return 12;
    case "RCODE_13":
      return 13;
    case "RCODE_14":
      return 14;
    case "RCODE_15":
      return 15;
  }
  return 0;
};
var opcodes = {};
opcodes.toString = function(opcode) {
  switch (opcode) {
    case 0:
      return "QUERY";
    case 1:
      return "IQUERY";
    case 2:
      return "STATUS";
    case 3:
      return "OPCODE_3";
    case 4:
      return "NOTIFY";
    case 5:
      return "UPDATE";
    case 6:
      return "OPCODE_6";
    case 7:
      return "OPCODE_7";
    case 8:
      return "OPCODE_8";
    case 9:
      return "OPCODE_9";
    case 10:
      return "OPCODE_10";
    case 11:
      return "OPCODE_11";
    case 12:
      return "OPCODE_12";
    case 13:
      return "OPCODE_13";
    case 14:
      return "OPCODE_14";
    case 15:
      return "OPCODE_15";
  }
  return "OPCODE_" + opcode;
};
opcodes.toOpcode = function(code) {
  switch (code.toUpperCase()) {
    case "QUERY":
      return 0;
    case "IQUERY":
      return 1;
    case "STATUS":
      return 2;
    case "OPCODE_3":
      return 3;
    case "NOTIFY":
      return 4;
    case "UPDATE":
      return 5;
    case "OPCODE_6":
      return 6;
    case "OPCODE_7":
      return 7;
    case "OPCODE_8":
      return 8;
    case "OPCODE_9":
      return 9;
    case "OPCODE_10":
      return 10;
    case "OPCODE_11":
      return 11;
    case "OPCODE_12":
      return 12;
    case "OPCODE_13":
      return 13;
    case "OPCODE_14":
      return 14;
    case "OPCODE_15":
      return 15;
  }
  return 0;
};
var classes = {};
classes.toString = function(klass) {
  switch (klass) {
    case 1:
      return "IN";
    case 2:
      return "CS";
    case 3:
      return "CH";
    case 4:
      return "HS";
    case 255:
      return "ANY";
  }
  return "UNKNOWN_" + klass;
};
classes.toClass = function(name) {
  switch (name.toUpperCase()) {
    case "IN":
      return 1;
    case "CS":
      return 2;
    case "CH":
      return 3;
    case "HS":
      return 4;
    case "ANY":
      return 255;
  }
  return 0;
};
var optioncodes = {};
optioncodes.toString = function(type) {
  switch (type) {
    case 1:
      return "LLQ";
    case 2:
      return "UL";
    case 3:
      return "NSID";
    case 5:
      return "DAU";
    case 6:
      return "DHU";
    case 7:
      return "N3U";
    case 8:
      return "CLIENT_SUBNET";
    case 9:
      return "EXPIRE";
    case 10:
      return "COOKIE";
    case 11:
      return "TCP_KEEPALIVE";
    case 12:
      return "PADDING";
    case 13:
      return "CHAIN";
    case 14:
      return "KEY_TAG";
    case 26946:
      return "DEVICEID";
  }
  if (type < 0) {
    return null;
  }
  return `OPTION_${type}`;
};
optioncodes.toCode = function(name) {
  if (typeof name === "number") {
    return name;
  }
  if (!name) {
    return -1;
  }
  switch (name.toUpperCase()) {
    case "OPTION_0":
      return 0;
    case "LLQ":
      return 1;
    case "UL":
      return 2;
    case "NSID":
      return 3;
    case "OPTION_4":
      return 4;
    case "DAU":
      return 5;
    case "DHU":
      return 6;
    case "N3U":
      return 7;
    case "CLIENT_SUBNET":
      return 8;
    case "EXPIRE":
      return 9;
    case "COOKIE":
      return 10;
    case "TCP_KEEPALIVE":
      return 11;
    case "PADDING":
      return 12;
    case "CHAIN":
      return 13;
    case "KEY_TAG":
      return 14;
    case "DEVICEID":
      return 26946;
    case "OPTION_65535":
      return 65535;
  }
  const m = name.match(/_(\d+)$/);
  if (m) {
    return parseInt(m[1], 10);
  }
  return -1;
};
var ipCodec = { exports: {} };
(function(module, exports) {
  var ipCodec2 = function(exports2) {
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.decode = decode;
    exports2.encode = encode;
    exports2.familyOf = familyOf;
    exports2.name = void 0;
    exports2.sizeOf = sizeOf;
    exports2.v6 = exports2.v4 = void 0;
    const v4Regex = /^(\d{1,3}\.){3,3}\d{1,3}$/;
    const v4Size = 4;
    const v6Regex = /^(::)?(((\d{1,3}\.){3}(\d{1,3}){1})?([0-9a-f]){0,4}:{0,2}){1,8}(::)?$/i;
    const v6Size = 16;
    const v4 = {
      name: "v4",
      size: v4Size,
      isFormat: (ip) => v4Regex.test(ip),
      encode(ip, buff, offset) {
        offset = ~~offset;
        buff = buff || new Uint8Array(offset + v4Size);
        const max = ip.length;
        let n = 0;
        for (let i = 0; i < max; ) {
          const c = ip.charCodeAt(i++);
          if (c === 46) {
            buff[offset++] = n;
            n = 0;
          } else {
            n = n * 10 + (c - 48);
          }
        }
        buff[offset] = n;
        return buff;
      },
      decode(buff, offset) {
        offset = ~~offset;
        return `${buff[offset++]}.${buff[offset++]}.${buff[offset++]}.${buff[offset]}`;
      }
    };
    exports2.v4 = v4;
    const v6 = {
      name: "v6",
      size: v6Size,
      isFormat: (ip) => ip.length > 0 && v6Regex.test(ip),
      encode(ip, buff, offset) {
        offset = ~~offset;
        let end = offset + v6Size;
        let fill = -1;
        let hexN = 0;
        let decN = 0;
        let prevColon = true;
        let useDec = false;
        buff = buff || new Uint8Array(offset + v6Size);
        for (let i = 0; i < ip.length; i++) {
          let c = ip.charCodeAt(i);
          if (c === 58) {
            if (prevColon) {
              if (fill !== -1) {
                if (offset < end) buff[offset] = 0;
                if (offset < end - 1) buff[offset + 1] = 0;
                offset += 2;
              } else if (offset < end) {
                fill = offset;
              }
            } else {
              if (useDec === true) {
                if (offset < end) buff[offset] = decN;
                offset++;
              } else {
                if (offset < end) buff[offset] = hexN >> 8;
                if (offset < end - 1) buff[offset + 1] = hexN & 255;
                offset += 2;
              }
              hexN = 0;
              decN = 0;
            }
            prevColon = true;
            useDec = false;
          } else if (c === 46) {
            if (offset < end) buff[offset] = decN;
            offset++;
            decN = 0;
            hexN = 0;
            prevColon = false;
            useDec = true;
          } else {
            prevColon = false;
            if (c >= 97) {
              c -= 87;
            } else if (c >= 65) {
              c -= 55;
            } else {
              c -= 48;
              decN = decN * 10 + c;
            }
            hexN = (hexN << 4) + c;
          }
        }
        if (prevColon === false) {
          if (useDec === true) {
            if (offset < end) buff[offset] = decN;
            offset++;
          } else {
            if (offset < end) buff[offset] = hexN >> 8;
            if (offset < end - 1) buff[offset + 1] = hexN & 255;
            offset += 2;
          }
        } else if (fill === 0) {
          if (offset < end) buff[offset] = 0;
          if (offset < end - 1) buff[offset + 1] = 0;
          offset += 2;
        } else if (fill !== -1) {
          offset += 2;
          for (let i = Math.min(offset - 1, end - 1); i >= fill + 2; i--) {
            buff[i] = buff[i - 2];
          }
          buff[fill] = 0;
          buff[fill + 1] = 0;
          fill = offset;
        }
        if (fill !== offset && fill !== -1) {
          if (offset > end - 2) {
            offset = end - 2;
          }
          while (end > fill) {
            buff[--end] = offset < end && offset > fill ? buff[--offset] : 0;
          }
        } else {
          while (offset < end) {
            buff[offset++] = 0;
          }
        }
        return buff;
      },
      decode(buff, offset) {
        offset = ~~offset;
        let result = "";
        for (let i = 0; i < v6Size; i += 2) {
          if (i !== 0) {
            result += ":";
          }
          result += (buff[offset + i] << 8 | buff[offset + i + 1]).toString(16);
        }
        return result.replace(/(^|:)0(:0)*:0(:|$)/, "$1::$3").replace(/:{3,4}/, "::");
      }
    };
    exports2.v6 = v6;
    const name = "ip";
    exports2.name = name;
    function sizeOf(ip) {
      if (v4.isFormat(ip)) return v4.size;
      if (v6.isFormat(ip)) return v6.size;
      throw Error(`Invalid ip address: ${ip}`);
    }
    function familyOf(string) {
      return sizeOf(string) === v4.size ? 1 : 2;
    }
    function encode(ip, buff, offset) {
      offset = ~~offset;
      const size = sizeOf(ip);
      if (typeof buff === "function") {
        buff = buff(offset + size);
      }
      if (size === v4.size) {
        return v4.encode(ip, buff, offset);
      }
      return v6.encode(ip, buff, offset);
    }
    function decode(buff, offset, length) {
      offset = ~~offset;
      length = length || buff.length - offset;
      if (length === v4.size) {
        return v4.decode(buff, offset, length);
      }
      if (length === v6.size) {
        return v6.decode(buff, offset, length);
      }
      throw Error(`Invalid buffer size needs to be ${v4.size} for v4 or ${v6.size} for v6.`);
    }
    return "default" in exports2 ? exports2.default : exports2;
  }({});
  module.exports = ipCodec2;
})(ipCodec);
var ipCodecExports = ipCodec.exports;
(function(exports) {
  const Buffer2 = require$$0$1.Buffer;
  const types$1 = types;
  const rcodes$1 = rcodes;
  const opcodes$1 = opcodes;
  const classes$1 = classes;
  const optioncodes$1 = optioncodes;
  const ip = ipCodecExports;
  const QUERY_FLAG = 0;
  const RESPONSE_FLAG = 1 << 15;
  const FLUSH_MASK = 1 << 15;
  const NOT_FLUSH_MASK = ~FLUSH_MASK;
  const QU_MASK = 1 << 15;
  const NOT_QU_MASK = ~QU_MASK;
  const name = exports.name = {};
  name.encode = function(str, buf, offset, { mail = false } = {}) {
    if (!buf) buf = Buffer2.alloc(name.encodingLength(str));
    if (!offset) offset = 0;
    const oldOffset = offset;
    const n = str.replace(/^\.|\.$/gm, "");
    if (n.length) {
      let list = [];
      if (mail) {
        let localPart = "";
        n.split(".").forEach((label) => {
          if (label.endsWith("\\")) {
            localPart += (localPart.length ? "." : "") + label.slice(0, -1);
          } else {
            if (list.length === 0 && localPart.length) {
              list.push(localPart + "." + label);
            } else {
              list.push(label);
            }
          }
        });
      } else {
        list = n.split(".");
      }
      for (let i = 0; i < list.length; i++) {
        const len = buf.write(list[i], offset + 1);
        buf[offset] = len;
        offset += len + 1;
      }
    }
    buf[offset++] = 0;
    name.encode.bytes = offset - oldOffset;
    return buf;
  };
  name.encode.bytes = 0;
  name.decode = function(buf, offset, { mail = false } = {}) {
    if (!offset) offset = 0;
    const list = [];
    let oldOffset = offset;
    let totalLength = 0;
    let consumedBytes = 0;
    let jumped = false;
    while (true) {
      if (offset >= buf.length) {
        throw new Error("Cannot decode name (buffer overflow)");
      }
      const len = buf[offset++];
      consumedBytes += jumped ? 0 : 1;
      if (len === 0) {
        break;
      } else if ((len & 192) === 0) {
        if (offset + len > buf.length) {
          throw new Error("Cannot decode name (buffer overflow)");
        }
        totalLength += len + 1;
        if (totalLength > 254) {
          throw new Error("Cannot decode name (name too long)");
        }
        let label = buf.toString("utf-8", offset, offset + len);
        if (mail) {
          label = label.replace(/\./g, "\\.");
        }
        list.push(label);
        offset += len;
        consumedBytes += jumped ? 0 : len;
      } else if ((len & 192) === 192) {
        if (offset + 1 > buf.length) {
          throw new Error("Cannot decode name (buffer overflow)");
        }
        const jumpOffset = buf.readUInt16BE(offset - 1) - 49152;
        if (jumpOffset >= oldOffset) {
          throw new Error("Cannot decode name (bad pointer)");
        }
        offset = jumpOffset;
        oldOffset = jumpOffset;
        consumedBytes += jumped ? 0 : 1;
        jumped = true;
      } else {
        throw new Error("Cannot decode name (bad label)");
      }
    }
    name.decode.bytes = consumedBytes;
    return list.length === 0 ? "." : list.join(".");
  };
  name.decode.bytes = 0;
  name.encodingLength = function(n) {
    if (n === "." || n === "..") return 1;
    return Buffer2.byteLength(n.replace(/^\.|\.$/gm, "")) + 2;
  };
  const string = {};
  string.encode = function(s, buf, offset) {
    if (!buf) buf = Buffer2.alloc(string.encodingLength(s));
    if (!offset) offset = 0;
    const len = buf.write(s, offset + 1);
    buf[offset] = len;
    string.encode.bytes = len + 1;
    return buf;
  };
  string.encode.bytes = 0;
  string.decode = function(buf, offset) {
    if (!offset) offset = 0;
    const len = buf[offset];
    const s = buf.toString("utf-8", offset + 1, offset + 1 + len);
    string.decode.bytes = len + 1;
    return s;
  };
  string.decode.bytes = 0;
  string.encodingLength = function(s) {
    return Buffer2.byteLength(s) + 1;
  };
  const header = {};
  header.encode = function(h, buf, offset) {
    if (!buf) buf = header.encodingLength(h);
    if (!offset) offset = 0;
    const flags = (h.flags || 0) & 32767;
    const type = h.type === "response" ? RESPONSE_FLAG : QUERY_FLAG;
    buf.writeUInt16BE(h.id || 0, offset);
    buf.writeUInt16BE(flags | type, offset + 2);
    buf.writeUInt16BE(h.questions.length, offset + 4);
    buf.writeUInt16BE(h.answers.length, offset + 6);
    buf.writeUInt16BE(h.authorities.length, offset + 8);
    buf.writeUInt16BE(h.additionals.length, offset + 10);
    return buf;
  };
  header.encode.bytes = 12;
  header.decode = function(buf, offset) {
    if (!offset) offset = 0;
    if (buf.length < 12) throw new Error("Header must be 12 bytes");
    const flags = buf.readUInt16BE(offset + 2);
    return {
      id: buf.readUInt16BE(offset),
      type: flags & RESPONSE_FLAG ? "response" : "query",
      flags: flags & 32767,
      flag_qr: (flags >> 15 & 1) === 1,
      opcode: opcodes$1.toString(flags >> 11 & 15),
      flag_aa: (flags >> 10 & 1) === 1,
      flag_tc: (flags >> 9 & 1) === 1,
      flag_rd: (flags >> 8 & 1) === 1,
      flag_ra: (flags >> 7 & 1) === 1,
      flag_z: (flags >> 6 & 1) === 1,
      flag_ad: (flags >> 5 & 1) === 1,
      flag_cd: (flags >> 4 & 1) === 1,
      rcode: rcodes$1.toString(flags & 15),
      questions: new Array(buf.readUInt16BE(offset + 4)),
      answers: new Array(buf.readUInt16BE(offset + 6)),
      authorities: new Array(buf.readUInt16BE(offset + 8)),
      additionals: new Array(buf.readUInt16BE(offset + 10))
    };
  };
  header.decode.bytes = 12;
  header.encodingLength = function() {
    return 12;
  };
  const runknown = exports.unknown = {};
  runknown.encode = function(data, buf, offset) {
    if (!buf) buf = Buffer2.alloc(runknown.encodingLength(data));
    if (!offset) offset = 0;
    buf.writeUInt16BE(data.length, offset);
    data.copy(buf, offset + 2);
    runknown.encode.bytes = data.length + 2;
    return buf;
  };
  runknown.encode.bytes = 0;
  runknown.decode = function(buf, offset) {
    if (!offset) offset = 0;
    const len = buf.readUInt16BE(offset);
    const data = buf.slice(offset + 2, offset + 2 + len);
    runknown.decode.bytes = len + 2;
    return data;
  };
  runknown.decode.bytes = 0;
  runknown.encodingLength = function(data) {
    return data.length + 2;
  };
  const rns = exports.ns = {};
  rns.encode = function(data, buf, offset) {
    if (!buf) buf = Buffer2.alloc(rns.encodingLength(data));
    if (!offset) offset = 0;
    name.encode(data, buf, offset + 2);
    buf.writeUInt16BE(name.encode.bytes, offset);
    rns.encode.bytes = name.encode.bytes + 2;
    return buf;
  };
  rns.encode.bytes = 0;
  rns.decode = function(buf, offset) {
    if (!offset) offset = 0;
    const len = buf.readUInt16BE(offset);
    const dd = name.decode(buf, offset + 2);
    rns.decode.bytes = len + 2;
    return dd;
  };
  rns.decode.bytes = 0;
  rns.encodingLength = function(data) {
    return name.encodingLength(data) + 2;
  };
  const rsoa = exports.soa = {};
  rsoa.encode = function(data, buf, offset) {
    if (!buf) buf = Buffer2.alloc(rsoa.encodingLength(data));
    if (!offset) offset = 0;
    const oldOffset = offset;
    offset += 2;
    name.encode(data.mname, buf, offset);
    offset += name.encode.bytes;
    name.encode(data.rname, buf, offset, { mail: true });
    offset += name.encode.bytes;
    buf.writeUInt32BE(data.serial || 0, offset);
    offset += 4;
    buf.writeUInt32BE(data.refresh || 0, offset);
    offset += 4;
    buf.writeUInt32BE(data.retry || 0, offset);
    offset += 4;
    buf.writeUInt32BE(data.expire || 0, offset);
    offset += 4;
    buf.writeUInt32BE(data.minimum || 0, offset);
    offset += 4;
    buf.writeUInt16BE(offset - oldOffset - 2, oldOffset);
    rsoa.encode.bytes = offset - oldOffset;
    return buf;
  };
  rsoa.encode.bytes = 0;
  rsoa.decode = function(buf, offset) {
    if (!offset) offset = 0;
    const oldOffset = offset;
    const data = {};
    offset += 2;
    data.mname = name.decode(buf, offset);
    offset += name.decode.bytes;
    data.rname = name.decode(buf, offset, { mail: true });
    offset += name.decode.bytes;
    data.serial = buf.readUInt32BE(offset);
    offset += 4;
    data.refresh = buf.readUInt32BE(offset);
    offset += 4;
    data.retry = buf.readUInt32BE(offset);
    offset += 4;
    data.expire = buf.readUInt32BE(offset);
    offset += 4;
    data.minimum = buf.readUInt32BE(offset);
    offset += 4;
    rsoa.decode.bytes = offset - oldOffset;
    return data;
  };
  rsoa.decode.bytes = 0;
  rsoa.encodingLength = function(data) {
    return 22 + name.encodingLength(data.mname) + name.encodingLength(data.rname);
  };
  const rtxt = exports.txt = {};
  rtxt.encode = function(data, buf, offset) {
    if (!Array.isArray(data)) data = [data];
    for (let i = 0; i < data.length; i++) {
      if (typeof data[i] === "string") {
        data[i] = Buffer2.from(data[i]);
      }
      if (!Buffer2.isBuffer(data[i])) {
        throw new Error("Must be a Buffer");
      }
    }
    if (!buf) buf = Buffer2.alloc(rtxt.encodingLength(data));
    if (!offset) offset = 0;
    const oldOffset = offset;
    offset += 2;
    data.forEach(function(d) {
      buf[offset++] = d.length;
      d.copy(buf, offset, 0, d.length);
      offset += d.length;
    });
    buf.writeUInt16BE(offset - oldOffset - 2, oldOffset);
    rtxt.encode.bytes = offset - oldOffset;
    return buf;
  };
  rtxt.encode.bytes = 0;
  rtxt.decode = function(buf, offset) {
    if (!offset) offset = 0;
    const oldOffset = offset;
    let remaining = buf.readUInt16BE(offset);
    offset += 2;
    let data = [];
    while (remaining > 0) {
      const len = buf[offset++];
      --remaining;
      if (remaining < len) {
        throw new Error("Buffer overflow");
      }
      data.push(buf.slice(offset, offset + len));
      offset += len;
      remaining -= len;
    }
    rtxt.decode.bytes = offset - oldOffset;
    return data;
  };
  rtxt.decode.bytes = 0;
  rtxt.encodingLength = function(data) {
    if (!Array.isArray(data)) data = [data];
    let length = 2;
    data.forEach(function(buf) {
      if (typeof buf === "string") {
        length += Buffer2.byteLength(buf) + 1;
      } else {
        length += buf.length + 1;
      }
    });
    return length;
  };
  const rnull = exports.null = {};
  rnull.encode = function(data, buf, offset) {
    if (!buf) buf = Buffer2.alloc(rnull.encodingLength(data));
    if (!offset) offset = 0;
    if (typeof data === "string") data = Buffer2.from(data);
    if (!data) data = Buffer2.alloc(0);
    const oldOffset = offset;
    offset += 2;
    const len = data.length;
    data.copy(buf, offset, 0, len);
    offset += len;
    buf.writeUInt16BE(offset - oldOffset - 2, oldOffset);
    rnull.encode.bytes = offset - oldOffset;
    return buf;
  };
  rnull.encode.bytes = 0;
  rnull.decode = function(buf, offset) {
    if (!offset) offset = 0;
    const oldOffset = offset;
    const len = buf.readUInt16BE(offset);
    offset += 2;
    const data = buf.slice(offset, offset + len);
    offset += len;
    rnull.decode.bytes = offset - oldOffset;
    return data;
  };
  rnull.decode.bytes = 0;
  rnull.encodingLength = function(data) {
    if (!data) return 2;
    return (Buffer2.isBuffer(data) ? data.length : Buffer2.byteLength(data)) + 2;
  };
  const rhinfo = exports.hinfo = {};
  rhinfo.encode = function(data, buf, offset) {
    if (!buf) buf = Buffer2.alloc(rhinfo.encodingLength(data));
    if (!offset) offset = 0;
    const oldOffset = offset;
    offset += 2;
    string.encode(data.cpu, buf, offset);
    offset += string.encode.bytes;
    string.encode(data.os, buf, offset);
    offset += string.encode.bytes;
    buf.writeUInt16BE(offset - oldOffset - 2, oldOffset);
    rhinfo.encode.bytes = offset - oldOffset;
    return buf;
  };
  rhinfo.encode.bytes = 0;
  rhinfo.decode = function(buf, offset) {
    if (!offset) offset = 0;
    const oldOffset = offset;
    const data = {};
    offset += 2;
    data.cpu = string.decode(buf, offset);
    offset += string.decode.bytes;
    data.os = string.decode(buf, offset);
    offset += string.decode.bytes;
    rhinfo.decode.bytes = offset - oldOffset;
    return data;
  };
  rhinfo.decode.bytes = 0;
  rhinfo.encodingLength = function(data) {
    return string.encodingLength(data.cpu) + string.encodingLength(data.os) + 2;
  };
  const rptr = exports.ptr = {};
  const rcname = exports.cname = rptr;
  const rdname = exports.dname = rptr;
  rptr.encode = function(data, buf, offset) {
    if (!buf) buf = Buffer2.alloc(rptr.encodingLength(data));
    if (!offset) offset = 0;
    name.encode(data, buf, offset + 2);
    buf.writeUInt16BE(name.encode.bytes, offset);
    rptr.encode.bytes = name.encode.bytes + 2;
    return buf;
  };
  rptr.encode.bytes = 0;
  rptr.decode = function(buf, offset) {
    if (!offset) offset = 0;
    const data = name.decode(buf, offset + 2);
    rptr.decode.bytes = name.decode.bytes + 2;
    return data;
  };
  rptr.decode.bytes = 0;
  rptr.encodingLength = function(data) {
    return name.encodingLength(data) + 2;
  };
  const rsrv = exports.srv = {};
  rsrv.encode = function(data, buf, offset) {
    if (!buf) buf = Buffer2.alloc(rsrv.encodingLength(data));
    if (!offset) offset = 0;
    buf.writeUInt16BE(data.priority || 0, offset + 2);
    buf.writeUInt16BE(data.weight || 0, offset + 4);
    buf.writeUInt16BE(data.port || 0, offset + 6);
    name.encode(data.target, buf, offset + 8);
    const len = name.encode.bytes + 6;
    buf.writeUInt16BE(len, offset);
    rsrv.encode.bytes = len + 2;
    return buf;
  };
  rsrv.encode.bytes = 0;
  rsrv.decode = function(buf, offset) {
    if (!offset) offset = 0;
    const len = buf.readUInt16BE(offset);
    const data = {};
    data.priority = buf.readUInt16BE(offset + 2);
    data.weight = buf.readUInt16BE(offset + 4);
    data.port = buf.readUInt16BE(offset + 6);
    data.target = name.decode(buf, offset + 8);
    rsrv.decode.bytes = len + 2;
    return data;
  };
  rsrv.decode.bytes = 0;
  rsrv.encodingLength = function(data) {
    return 8 + name.encodingLength(data.target);
  };
  const rcaa = exports.caa = {};
  rcaa.ISSUER_CRITICAL = 1 << 7;
  rcaa.encode = function(data, buf, offset) {
    const len = rcaa.encodingLength(data);
    if (!buf) buf = Buffer2.alloc(rcaa.encodingLength(data));
    if (!offset) offset = 0;
    if (data.issuerCritical) {
      data.flags = rcaa.ISSUER_CRITICAL;
    }
    buf.writeUInt16BE(len - 2, offset);
    offset += 2;
    buf.writeUInt8(data.flags || 0, offset);
    offset += 1;
    string.encode(data.tag, buf, offset);
    offset += string.encode.bytes;
    buf.write(data.value, offset);
    offset += Buffer2.byteLength(data.value);
    rcaa.encode.bytes = len;
    return buf;
  };
  rcaa.encode.bytes = 0;
  rcaa.decode = function(buf, offset) {
    if (!offset) offset = 0;
    const len = buf.readUInt16BE(offset);
    offset += 2;
    const oldOffset = offset;
    const data = {};
    data.flags = buf.readUInt8(offset);
    offset += 1;
    data.tag = string.decode(buf, offset);
    offset += string.decode.bytes;
    data.value = buf.toString("utf-8", offset, oldOffset + len);
    data.issuerCritical = !!(data.flags & rcaa.ISSUER_CRITICAL);
    rcaa.decode.bytes = len + 2;
    return data;
  };
  rcaa.decode.bytes = 0;
  rcaa.encodingLength = function(data) {
    return string.encodingLength(data.tag) + string.encodingLength(data.value) + 2;
  };
  const rmx = exports.mx = {};
  rmx.encode = function(data, buf, offset) {
    if (!buf) buf = Buffer2.alloc(rmx.encodingLength(data));
    if (!offset) offset = 0;
    const oldOffset = offset;
    offset += 2;
    buf.writeUInt16BE(data.preference || 0, offset);
    offset += 2;
    name.encode(data.exchange, buf, offset);
    offset += name.encode.bytes;
    buf.writeUInt16BE(offset - oldOffset - 2, oldOffset);
    rmx.encode.bytes = offset - oldOffset;
    return buf;
  };
  rmx.encode.bytes = 0;
  rmx.decode = function(buf, offset) {
    if (!offset) offset = 0;
    const oldOffset = offset;
    const data = {};
    offset += 2;
    data.preference = buf.readUInt16BE(offset);
    offset += 2;
    data.exchange = name.decode(buf, offset);
    offset += name.decode.bytes;
    rmx.decode.bytes = offset - oldOffset;
    return data;
  };
  rmx.encodingLength = function(data) {
    return 4 + name.encodingLength(data.exchange);
  };
  const ra = exports.a = {};
  ra.encode = function(host, buf, offset) {
    if (!buf) buf = Buffer2.alloc(ra.encodingLength(host));
    if (!offset) offset = 0;
    buf.writeUInt16BE(4, offset);
    offset += 2;
    ip.v4.encode(host, buf, offset);
    ra.encode.bytes = 6;
    return buf;
  };
  ra.encode.bytes = 0;
  ra.decode = function(buf, offset) {
    if (!offset) offset = 0;
    offset += 2;
    const host = ip.v4.decode(buf, offset);
    ra.decode.bytes = 6;
    return host;
  };
  ra.decode.bytes = 0;
  ra.encodingLength = function() {
    return 6;
  };
  const raaaa = exports.aaaa = {};
  raaaa.encode = function(host, buf, offset) {
    if (!buf) buf = Buffer2.alloc(raaaa.encodingLength(host));
    if (!offset) offset = 0;
    buf.writeUInt16BE(16, offset);
    offset += 2;
    ip.v6.encode(host, buf, offset);
    raaaa.encode.bytes = 18;
    return buf;
  };
  raaaa.encode.bytes = 0;
  raaaa.decode = function(buf, offset) {
    if (!offset) offset = 0;
    offset += 2;
    const host = ip.v6.decode(buf, offset);
    raaaa.decode.bytes = 18;
    return host;
  };
  raaaa.decode.bytes = 0;
  raaaa.encodingLength = function() {
    return 18;
  };
  const roption = exports.option = {};
  roption.encode = function(option, buf, offset) {
    if (!buf) buf = Buffer2.alloc(roption.encodingLength(option));
    if (!offset) offset = 0;
    const oldOffset = offset;
    const code = optioncodes$1.toCode(option.code);
    buf.writeUInt16BE(code, offset);
    offset += 2;
    if (option.data) {
      buf.writeUInt16BE(option.data.length, offset);
      offset += 2;
      option.data.copy(buf, offset);
      offset += option.data.length;
    } else {
      switch (code) {
        case 8:
          const spl = option.sourcePrefixLength || 0;
          const fam = option.family || ip.familyOf(option.ip);
          const ipBuf = ip.encode(option.ip, Buffer2.alloc);
          const ipLen = Math.ceil(spl / 8);
          buf.writeUInt16BE(ipLen + 4, offset);
          offset += 2;
          buf.writeUInt16BE(fam, offset);
          offset += 2;
          buf.writeUInt8(spl, offset++);
          buf.writeUInt8(option.scopePrefixLength || 0, offset++);
          ipBuf.copy(buf, offset, 0, ipLen);
          offset += ipLen;
          break;
        case 11:
          if (option.timeout) {
            buf.writeUInt16BE(2, offset);
            offset += 2;
            buf.writeUInt16BE(option.timeout, offset);
            offset += 2;
          } else {
            buf.writeUInt16BE(0, offset);
            offset += 2;
          }
          break;
        case 12:
          const len = option.length || 0;
          buf.writeUInt16BE(len, offset);
          offset += 2;
          buf.fill(0, offset, offset + len);
          offset += len;
          break;
        case 14:
          const tagsLen = option.tags.length * 2;
          buf.writeUInt16BE(tagsLen, offset);
          offset += 2;
          for (const tag of option.tags) {
            buf.writeUInt16BE(tag, offset);
            offset += 2;
          }
          break;
        default:
          throw new Error(`Unknown roption code: ${option.code}`);
      }
    }
    roption.encode.bytes = offset - oldOffset;
    return buf;
  };
  roption.encode.bytes = 0;
  roption.decode = function(buf, offset) {
    if (!offset) offset = 0;
    const option = {};
    option.code = buf.readUInt16BE(offset);
    option.type = optioncodes$1.toString(option.code);
    offset += 2;
    const len = buf.readUInt16BE(offset);
    offset += 2;
    option.data = buf.slice(offset, offset + len);
    switch (option.code) {
      case 8:
        option.family = buf.readUInt16BE(offset);
        offset += 2;
        option.sourcePrefixLength = buf.readUInt8(offset++);
        option.scopePrefixLength = buf.readUInt8(offset++);
        const padded = Buffer2.alloc(option.family === 1 ? 4 : 16);
        buf.copy(padded, 0, offset, offset + len - 4);
        option.ip = ip.decode(padded);
        break;
      case 11:
        if (len > 0) {
          option.timeout = buf.readUInt16BE(offset);
          offset += 2;
        }
        break;
      case 14:
        option.tags = [];
        for (let i = 0; i < len; i += 2) {
          option.tags.push(buf.readUInt16BE(offset));
          offset += 2;
        }
    }
    roption.decode.bytes = len + 4;
    return option;
  };
  roption.decode.bytes = 0;
  roption.encodingLength = function(option) {
    if (option.data) {
      return option.data.length + 4;
    }
    const code = optioncodes$1.toCode(option.code);
    switch (code) {
      case 8:
        const spl = option.sourcePrefixLength || 0;
        return Math.ceil(spl / 8) + 8;
      case 11:
        return typeof option.timeout === "number" ? 6 : 4;
      case 12:
        return option.length + 4;
      case 14:
        return 4 + option.tags.length * 2;
    }
    throw new Error(`Unknown roption code: ${option.code}`);
  };
  const ropt = exports.opt = {};
  ropt.encode = function(options, buf, offset) {
    if (!buf) buf = Buffer2.alloc(ropt.encodingLength(options));
    if (!offset) offset = 0;
    const oldOffset = offset;
    const rdlen = encodingLengthList(options, roption);
    buf.writeUInt16BE(rdlen, offset);
    offset = encodeList(options, roption, buf, offset + 2);
    ropt.encode.bytes = offset - oldOffset;
    return buf;
  };
  ropt.encode.bytes = 0;
  ropt.decode = function(buf, offset) {
    if (!offset) offset = 0;
    const oldOffset = offset;
    const options = [];
    let rdlen = buf.readUInt16BE(offset);
    offset += 2;
    let o = 0;
    while (rdlen > 0) {
      options[o++] = roption.decode(buf, offset);
      offset += roption.decode.bytes;
      rdlen -= roption.decode.bytes;
    }
    ropt.decode.bytes = offset - oldOffset;
    return options;
  };
  ropt.decode.bytes = 0;
  ropt.encodingLength = function(options) {
    return 2 + encodingLengthList(options || [], roption);
  };
  const rdnskey = exports.dnskey = {};
  rdnskey.PROTOCOL_DNSSEC = 3;
  rdnskey.ZONE_KEY = 128;
  rdnskey.SECURE_ENTRYPOINT = 32768;
  rdnskey.encode = function(key, buf, offset) {
    if (!buf) buf = Buffer2.alloc(rdnskey.encodingLength(key));
    if (!offset) offset = 0;
    const oldOffset = offset;
    const keydata = key.key;
    if (!Buffer2.isBuffer(keydata)) {
      throw new Error("Key must be a Buffer");
    }
    offset += 2;
    buf.writeUInt16BE(key.flags, offset);
    offset += 2;
    buf.writeUInt8(rdnskey.PROTOCOL_DNSSEC, offset);
    offset += 1;
    buf.writeUInt8(key.algorithm, offset);
    offset += 1;
    keydata.copy(buf, offset, 0, keydata.length);
    offset += keydata.length;
    rdnskey.encode.bytes = offset - oldOffset;
    buf.writeUInt16BE(rdnskey.encode.bytes - 2, oldOffset);
    return buf;
  };
  rdnskey.encode.bytes = 0;
  rdnskey.decode = function(buf, offset) {
    if (!offset) offset = 0;
    const oldOffset = offset;
    var key = {};
    var length = buf.readUInt16BE(offset);
    offset += 2;
    key.flags = buf.readUInt16BE(offset);
    offset += 2;
    if (buf.readUInt8(offset) !== rdnskey.PROTOCOL_DNSSEC) {
      throw new Error("Protocol must be 3");
    }
    offset += 1;
    key.algorithm = buf.readUInt8(offset);
    offset += 1;
    key.key = buf.slice(offset, oldOffset + length + 2);
    offset += key.key.length;
    rdnskey.decode.bytes = offset - oldOffset;
    return key;
  };
  rdnskey.decode.bytes = 0;
  rdnskey.encodingLength = function(key) {
    return 6 + Buffer2.byteLength(key.key);
  };
  const rrrsig = exports.rrsig = {};
  rrrsig.encode = function(sig, buf, offset) {
    if (!buf) buf = Buffer2.alloc(rrrsig.encodingLength(sig));
    if (!offset) offset = 0;
    const oldOffset = offset;
    const signature = sig.signature;
    if (!Buffer2.isBuffer(signature)) {
      throw new Error("Signature must be a Buffer");
    }
    offset += 2;
    buf.writeUInt16BE(types$1.toType(sig.typeCovered), offset);
    offset += 2;
    buf.writeUInt8(sig.algorithm, offset);
    offset += 1;
    buf.writeUInt8(sig.labels, offset);
    offset += 1;
    buf.writeUInt32BE(sig.originalTTL, offset);
    offset += 4;
    buf.writeUInt32BE(sig.expiration, offset);
    offset += 4;
    buf.writeUInt32BE(sig.inception, offset);
    offset += 4;
    buf.writeUInt16BE(sig.keyTag, offset);
    offset += 2;
    name.encode(sig.signersName, buf, offset);
    offset += name.encode.bytes;
    signature.copy(buf, offset, 0, signature.length);
    offset += signature.length;
    rrrsig.encode.bytes = offset - oldOffset;
    buf.writeUInt16BE(rrrsig.encode.bytes - 2, oldOffset);
    return buf;
  };
  rrrsig.encode.bytes = 0;
  rrrsig.decode = function(buf, offset) {
    if (!offset) offset = 0;
    const oldOffset = offset;
    var sig = {};
    var length = buf.readUInt16BE(offset);
    offset += 2;
    sig.typeCovered = types$1.toString(buf.readUInt16BE(offset));
    offset += 2;
    sig.algorithm = buf.readUInt8(offset);
    offset += 1;
    sig.labels = buf.readUInt8(offset);
    offset += 1;
    sig.originalTTL = buf.readUInt32BE(offset);
    offset += 4;
    sig.expiration = buf.readUInt32BE(offset);
    offset += 4;
    sig.inception = buf.readUInt32BE(offset);
    offset += 4;
    sig.keyTag = buf.readUInt16BE(offset);
    offset += 2;
    sig.signersName = name.decode(buf, offset);
    offset += name.decode.bytes;
    sig.signature = buf.slice(offset, oldOffset + length + 2);
    offset += sig.signature.length;
    rrrsig.decode.bytes = offset - oldOffset;
    return sig;
  };
  rrrsig.decode.bytes = 0;
  rrrsig.encodingLength = function(sig) {
    return 20 + name.encodingLength(sig.signersName) + Buffer2.byteLength(sig.signature);
  };
  const rrp = exports.rp = {};
  rrp.encode = function(data, buf, offset) {
    if (!buf) buf = Buffer2.alloc(rrp.encodingLength(data));
    if (!offset) offset = 0;
    const oldOffset = offset;
    offset += 2;
    name.encode(data.mbox || ".", buf, offset, { mail: true });
    offset += name.encode.bytes;
    name.encode(data.txt || ".", buf, offset);
    offset += name.encode.bytes;
    rrp.encode.bytes = offset - oldOffset;
    buf.writeUInt16BE(rrp.encode.bytes - 2, oldOffset);
    return buf;
  };
  rrp.encode.bytes = 0;
  rrp.decode = function(buf, offset) {
    if (!offset) offset = 0;
    const oldOffset = offset;
    const data = {};
    offset += 2;
    data.mbox = name.decode(buf, offset, { mail: true }) || ".";
    offset += name.decode.bytes;
    data.txt = name.decode(buf, offset) || ".";
    offset += name.decode.bytes;
    rrp.decode.bytes = offset - oldOffset;
    return data;
  };
  rrp.decode.bytes = 0;
  rrp.encodingLength = function(data) {
    return 2 + name.encodingLength(data.mbox || ".") + name.encodingLength(data.txt || ".");
  };
  const typebitmap = {};
  typebitmap.encode = function(typelist, buf, offset) {
    if (!buf) buf = Buffer2.alloc(typebitmap.encodingLength(typelist));
    if (!offset) offset = 0;
    const oldOffset = offset;
    var typesByWindow = [];
    for (var i = 0; i < typelist.length; i++) {
      var typeid = types$1.toType(typelist[i]);
      if (typesByWindow[typeid >> 8] === void 0) {
        typesByWindow[typeid >> 8] = [];
      }
      typesByWindow[typeid >> 8][typeid >> 3 & 31] |= 1 << 7 - (typeid & 7);
    }
    for (i = 0; i < typesByWindow.length; i++) {
      if (typesByWindow[i] !== void 0) {
        var windowBuf = Buffer2.from(typesByWindow[i]);
        buf.writeUInt8(i, offset);
        offset += 1;
        buf.writeUInt8(windowBuf.length, offset);
        offset += 1;
        windowBuf.copy(buf, offset);
        offset += windowBuf.length;
      }
    }
    typebitmap.encode.bytes = offset - oldOffset;
    return buf;
  };
  typebitmap.encode.bytes = 0;
  typebitmap.decode = function(buf, offset, length) {
    if (!offset) offset = 0;
    const oldOffset = offset;
    var typelist = [];
    while (offset - oldOffset < length) {
      var window2 = buf.readUInt8(offset);
      offset += 1;
      var windowLength = buf.readUInt8(offset);
      offset += 1;
      for (var i = 0; i < windowLength; i++) {
        var b = buf.readUInt8(offset + i);
        for (var j = 0; j < 8; j++) {
          if (b & 1 << 7 - j) {
            var typeid = types$1.toString(window2 << 8 | i << 3 | j);
            typelist.push(typeid);
          }
        }
      }
      offset += windowLength;
    }
    typebitmap.decode.bytes = offset - oldOffset;
    return typelist;
  };
  typebitmap.decode.bytes = 0;
  typebitmap.encodingLength = function(typelist) {
    var extents = [];
    for (var i = 0; i < typelist.length; i++) {
      var typeid = types$1.toType(typelist[i]);
      extents[typeid >> 8] = Math.max(extents[typeid >> 8] || 0, typeid & 255);
    }
    var len = 0;
    for (i = 0; i < extents.length; i++) {
      if (extents[i] !== void 0) {
        len += 2 + Math.ceil((extents[i] + 1) / 8);
      }
    }
    return len;
  };
  const rnsec = exports.nsec = {};
  rnsec.encode = function(record, buf, offset) {
    if (!buf) buf = Buffer2.alloc(rnsec.encodingLength(record));
    if (!offset) offset = 0;
    const oldOffset = offset;
    offset += 2;
    name.encode(record.nextDomain, buf, offset);
    offset += name.encode.bytes;
    typebitmap.encode(record.rrtypes, buf, offset);
    offset += typebitmap.encode.bytes;
    rnsec.encode.bytes = offset - oldOffset;
    buf.writeUInt16BE(rnsec.encode.bytes - 2, oldOffset);
    return buf;
  };
  rnsec.encode.bytes = 0;
  rnsec.decode = function(buf, offset) {
    if (!offset) offset = 0;
    const oldOffset = offset;
    var record = {};
    var length = buf.readUInt16BE(offset);
    offset += 2;
    record.nextDomain = name.decode(buf, offset);
    offset += name.decode.bytes;
    record.rrtypes = typebitmap.decode(buf, offset, length - (offset - oldOffset));
    offset += typebitmap.decode.bytes;
    rnsec.decode.bytes = offset - oldOffset;
    return record;
  };
  rnsec.decode.bytes = 0;
  rnsec.encodingLength = function(record) {
    return 2 + name.encodingLength(record.nextDomain) + typebitmap.encodingLength(record.rrtypes);
  };
  const rnsec3 = exports.nsec3 = {};
  rnsec3.encode = function(record, buf, offset) {
    if (!buf) buf = Buffer2.alloc(rnsec3.encodingLength(record));
    if (!offset) offset = 0;
    const oldOffset = offset;
    const salt = record.salt;
    if (!Buffer2.isBuffer(salt)) {
      throw new Error("salt must be a Buffer");
    }
    const nextDomain = record.nextDomain;
    if (!Buffer2.isBuffer(nextDomain)) {
      throw new Error("nextDomain must be a Buffer");
    }
    offset += 2;
    buf.writeUInt8(record.algorithm, offset);
    offset += 1;
    buf.writeUInt8(record.flags, offset);
    offset += 1;
    buf.writeUInt16BE(record.iterations, offset);
    offset += 2;
    buf.writeUInt8(salt.length, offset);
    offset += 1;
    salt.copy(buf, offset, 0, salt.length);
    offset += salt.length;
    buf.writeUInt8(nextDomain.length, offset);
    offset += 1;
    nextDomain.copy(buf, offset, 0, nextDomain.length);
    offset += nextDomain.length;
    typebitmap.encode(record.rrtypes, buf, offset);
    offset += typebitmap.encode.bytes;
    rnsec3.encode.bytes = offset - oldOffset;
    buf.writeUInt16BE(rnsec3.encode.bytes - 2, oldOffset);
    return buf;
  };
  rnsec3.encode.bytes = 0;
  rnsec3.decode = function(buf, offset) {
    if (!offset) offset = 0;
    const oldOffset = offset;
    var record = {};
    var length = buf.readUInt16BE(offset);
    offset += 2;
    record.algorithm = buf.readUInt8(offset);
    offset += 1;
    record.flags = buf.readUInt8(offset);
    offset += 1;
    record.iterations = buf.readUInt16BE(offset);
    offset += 2;
    const saltLength = buf.readUInt8(offset);
    offset += 1;
    record.salt = buf.slice(offset, offset + saltLength);
    offset += saltLength;
    const hashLength = buf.readUInt8(offset);
    offset += 1;
    record.nextDomain = buf.slice(offset, offset + hashLength);
    offset += hashLength;
    record.rrtypes = typebitmap.decode(buf, offset, length - (offset - oldOffset));
    offset += typebitmap.decode.bytes;
    rnsec3.decode.bytes = offset - oldOffset;
    return record;
  };
  rnsec3.decode.bytes = 0;
  rnsec3.encodingLength = function(record) {
    return 8 + record.salt.length + record.nextDomain.length + typebitmap.encodingLength(record.rrtypes);
  };
  const rds = exports.ds = {};
  rds.encode = function(digest, buf, offset) {
    if (!buf) buf = Buffer2.alloc(rds.encodingLength(digest));
    if (!offset) offset = 0;
    const oldOffset = offset;
    const digestdata = digest.digest;
    if (!Buffer2.isBuffer(digestdata)) {
      throw new Error("Digest must be a Buffer");
    }
    offset += 2;
    buf.writeUInt16BE(digest.keyTag, offset);
    offset += 2;
    buf.writeUInt8(digest.algorithm, offset);
    offset += 1;
    buf.writeUInt8(digest.digestType, offset);
    offset += 1;
    digestdata.copy(buf, offset, 0, digestdata.length);
    offset += digestdata.length;
    rds.encode.bytes = offset - oldOffset;
    buf.writeUInt16BE(rds.encode.bytes - 2, oldOffset);
    return buf;
  };
  rds.encode.bytes = 0;
  rds.decode = function(buf, offset) {
    if (!offset) offset = 0;
    const oldOffset = offset;
    var digest = {};
    var length = buf.readUInt16BE(offset);
    offset += 2;
    digest.keyTag = buf.readUInt16BE(offset);
    offset += 2;
    digest.algorithm = buf.readUInt8(offset);
    offset += 1;
    digest.digestType = buf.readUInt8(offset);
    offset += 1;
    digest.digest = buf.slice(offset, oldOffset + length + 2);
    offset += digest.digest.length;
    rds.decode.bytes = offset - oldOffset;
    return digest;
  };
  rds.decode.bytes = 0;
  rds.encodingLength = function(digest) {
    return 6 + Buffer2.byteLength(digest.digest);
  };
  const rsshfp = exports.sshfp = {};
  rsshfp.getFingerprintLengthForHashType = function getFingerprintLengthForHashType(hashType) {
    switch (hashType) {
      case 1:
        return 20;
      case 2:
        return 32;
    }
  };
  rsshfp.encode = function encode(record, buf, offset) {
    if (!buf) buf = Buffer2.alloc(rsshfp.encodingLength(record));
    if (!offset) offset = 0;
    const oldOffset = offset;
    offset += 2;
    buf[offset] = record.algorithm;
    offset += 1;
    buf[offset] = record.hash;
    offset += 1;
    const fingerprintBuf = Buffer2.from(record.fingerprint.toUpperCase(), "hex");
    if (fingerprintBuf.length !== rsshfp.getFingerprintLengthForHashType(record.hash)) {
      throw new Error("Invalid fingerprint length");
    }
    fingerprintBuf.copy(buf, offset);
    offset += fingerprintBuf.byteLength;
    rsshfp.encode.bytes = offset - oldOffset;
    buf.writeUInt16BE(rsshfp.encode.bytes - 2, oldOffset);
    return buf;
  };
  rsshfp.encode.bytes = 0;
  rsshfp.decode = function decode(buf, offset) {
    if (!offset) offset = 0;
    const oldOffset = offset;
    const record = {};
    offset += 2;
    record.algorithm = buf[offset];
    offset += 1;
    record.hash = buf[offset];
    offset += 1;
    const fingerprintLength = rsshfp.getFingerprintLengthForHashType(record.hash);
    record.fingerprint = buf.slice(offset, offset + fingerprintLength).toString("hex").toUpperCase();
    offset += fingerprintLength;
    rsshfp.decode.bytes = offset - oldOffset;
    return record;
  };
  rsshfp.decode.bytes = 0;
  rsshfp.encodingLength = function(record) {
    return 4 + Buffer2.from(record.fingerprint, "hex").byteLength;
  };
  const rnaptr = exports.naptr = {};
  rnaptr.encode = function(data, buf, offset) {
    if (!buf) buf = Buffer2.alloc(rnaptr.encodingLength(data));
    if (!offset) offset = 0;
    const oldOffset = offset;
    offset += 2;
    buf.writeUInt16BE(data.order || 0, offset);
    offset += 2;
    buf.writeUInt16BE(data.preference || 0, offset);
    offset += 2;
    string.encode(data.flags, buf, offset);
    offset += string.encode.bytes;
    string.encode(data.services, buf, offset);
    offset += string.encode.bytes;
    string.encode(data.regexp, buf, offset);
    offset += string.encode.bytes;
    name.encode(data.replacement, buf, offset);
    offset += name.encode.bytes;
    rnaptr.encode.bytes = offset - oldOffset;
    buf.writeUInt16BE(rnaptr.encode.bytes - 2, oldOffset);
    return buf;
  };
  rnaptr.encode.bytes = 0;
  rnaptr.decode = function(buf, offset) {
    if (!offset) offset = 0;
    const oldOffset = offset;
    const data = {};
    offset += 2;
    data.order = buf.readUInt16BE(offset);
    offset += 2;
    data.preference = buf.readUInt16BE(offset);
    offset += 2;
    data.flags = string.decode(buf, offset);
    offset += string.decode.bytes;
    data.services = string.decode(buf, offset);
    offset += string.decode.bytes;
    data.regexp = string.decode(buf, offset);
    offset += string.decode.bytes;
    data.replacement = name.decode(buf, offset);
    offset += name.decode.bytes;
    rnaptr.decode.bytes = offset - oldOffset;
    return data;
  };
  rnaptr.decode.bytes = 0;
  rnaptr.encodingLength = function(data) {
    return string.encodingLength(data.flags) + string.encodingLength(data.services) + string.encodingLength(data.regexp) + name.encodingLength(data.replacement) + 6;
  };
  const rtlsa = exports.tlsa = {};
  rtlsa.encode = function(cert, buf, offset) {
    if (!buf) buf = Buffer2.alloc(rtlsa.encodingLength(cert));
    if (!offset) offset = 0;
    const oldOffset = offset;
    const certdata = cert.certificate;
    if (!Buffer2.isBuffer(certdata)) {
      throw new Error("Certificate must be a Buffer");
    }
    offset += 2;
    buf.writeUInt8(cert.usage, offset);
    offset += 1;
    buf.writeUInt8(cert.selector, offset);
    offset += 1;
    buf.writeUInt8(cert.matchingType, offset);
    offset += 1;
    certdata.copy(buf, offset, 0, certdata.length);
    offset += certdata.length;
    rtlsa.encode.bytes = offset - oldOffset;
    buf.writeUInt16BE(rtlsa.encode.bytes - 2, oldOffset);
    return buf;
  };
  rtlsa.encode.bytes = 0;
  rtlsa.decode = function(buf, offset) {
    if (!offset) offset = 0;
    const oldOffset = offset;
    const cert = {};
    const length = buf.readUInt16BE(offset);
    offset += 2;
    cert.usage = buf.readUInt8(offset);
    offset += 1;
    cert.selector = buf.readUInt8(offset);
    offset += 1;
    cert.matchingType = buf.readUInt8(offset);
    offset += 1;
    cert.certificate = buf.slice(offset, oldOffset + length + 2);
    offset += cert.certificate.length;
    rtlsa.decode.bytes = offset - oldOffset;
    return cert;
  };
  rtlsa.decode.bytes = 0;
  rtlsa.encodingLength = function(cert) {
    return 5 + Buffer2.byteLength(cert.certificate);
  };
  const renc = exports.record = function(type) {
    switch (type.toUpperCase()) {
      case "A":
        return ra;
      case "PTR":
        return rptr;
      case "CNAME":
        return rcname;
      case "DNAME":
        return rdname;
      case "TXT":
        return rtxt;
      case "NULL":
        return rnull;
      case "AAAA":
        return raaaa;
      case "SRV":
        return rsrv;
      case "HINFO":
        return rhinfo;
      case "CAA":
        return rcaa;
      case "NS":
        return rns;
      case "SOA":
        return rsoa;
      case "MX":
        return rmx;
      case "OPT":
        return ropt;
      case "DNSKEY":
        return rdnskey;
      case "RRSIG":
        return rrrsig;
      case "RP":
        return rrp;
      case "NSEC":
        return rnsec;
      case "NSEC3":
        return rnsec3;
      case "SSHFP":
        return rsshfp;
      case "DS":
        return rds;
      case "NAPTR":
        return rnaptr;
      case "TLSA":
        return rtlsa;
    }
    return runknown;
  };
  const answer = exports.answer = {};
  answer.encode = function(a, buf, offset) {
    if (!buf) buf = Buffer2.alloc(answer.encodingLength(a));
    if (!offset) offset = 0;
    const oldOffset = offset;
    name.encode(a.name, buf, offset);
    offset += name.encode.bytes;
    buf.writeUInt16BE(types$1.toType(a.type), offset);
    if (a.type.toUpperCase() === "OPT") {
      if (a.name !== ".") {
        throw new Error("OPT name must be root.");
      }
      buf.writeUInt16BE(a.udpPayloadSize || 4096, offset + 2);
      buf.writeUInt8(a.extendedRcode || 0, offset + 4);
      buf.writeUInt8(a.ednsVersion || 0, offset + 5);
      buf.writeUInt16BE(a.flags || 0, offset + 6);
      offset += 8;
      ropt.encode(a.options || [], buf, offset);
      offset += ropt.encode.bytes;
    } else {
      let klass = classes$1.toClass(a.class === void 0 ? "IN" : a.class);
      if (a.flush) klass |= FLUSH_MASK;
      buf.writeUInt16BE(klass, offset + 2);
      buf.writeUInt32BE(a.ttl || 0, offset + 4);
      offset += 8;
      const enc = renc(a.type);
      enc.encode(a.data, buf, offset);
      offset += enc.encode.bytes;
    }
    answer.encode.bytes = offset - oldOffset;
    return buf;
  };
  answer.encode.bytes = 0;
  answer.decode = function(buf, offset) {
    if (!offset) offset = 0;
    const a = {};
    const oldOffset = offset;
    a.name = name.decode(buf, offset);
    offset += name.decode.bytes;
    a.type = types$1.toString(buf.readUInt16BE(offset));
    if (a.type === "OPT") {
      a.udpPayloadSize = buf.readUInt16BE(offset + 2);
      a.extendedRcode = buf.readUInt8(offset + 4);
      a.ednsVersion = buf.readUInt8(offset + 5);
      a.flags = buf.readUInt16BE(offset + 6);
      a.flag_do = (a.flags >> 15 & 1) === 1;
      a.options = ropt.decode(buf, offset + 8);
      offset += 8 + ropt.decode.bytes;
    } else {
      const klass = buf.readUInt16BE(offset + 2);
      a.ttl = buf.readUInt32BE(offset + 4);
      a.class = classes$1.toString(klass & NOT_FLUSH_MASK);
      a.flush = !!(klass & FLUSH_MASK);
      const enc = renc(a.type);
      a.data = enc.decode(buf, offset + 8);
      offset += 8 + enc.decode.bytes;
    }
    answer.decode.bytes = offset - oldOffset;
    return a;
  };
  answer.decode.bytes = 0;
  answer.encodingLength = function(a) {
    const data = a.data !== null && a.data !== void 0 ? a.data : a.options;
    return name.encodingLength(a.name) + 8 + renc(a.type).encodingLength(data);
  };
  const question = exports.question = {};
  question.encode = function(q, buf, offset) {
    if (!buf) buf = Buffer2.alloc(question.encodingLength(q));
    if (!offset) offset = 0;
    const oldOffset = offset;
    name.encode(q.name, buf, offset);
    offset += name.encode.bytes;
    buf.writeUInt16BE(types$1.toType(q.type), offset);
    offset += 2;
    buf.writeUInt16BE(classes$1.toClass(q.class === void 0 ? "IN" : q.class), offset);
    offset += 2;
    question.encode.bytes = offset - oldOffset;
    return q;
  };
  question.encode.bytes = 0;
  question.decode = function(buf, offset) {
    if (!offset) offset = 0;
    const oldOffset = offset;
    const q = {};
    q.name = name.decode(buf, offset);
    offset += name.decode.bytes;
    q.type = types$1.toString(buf.readUInt16BE(offset));
    offset += 2;
    q.class = classes$1.toString(buf.readUInt16BE(offset));
    offset += 2;
    const qu = !!(q.class & QU_MASK);
    if (qu) q.class &= NOT_QU_MASK;
    question.decode.bytes = offset - oldOffset;
    return q;
  };
  question.decode.bytes = 0;
  question.encodingLength = function(q) {
    return name.encodingLength(q.name) + 4;
  };
  exports.AUTHORITATIVE_ANSWER = 1 << 10;
  exports.TRUNCATED_RESPONSE = 1 << 9;
  exports.RECURSION_DESIRED = 1 << 8;
  exports.RECURSION_AVAILABLE = 1 << 7;
  exports.AUTHENTIC_DATA = 1 << 5;
  exports.CHECKING_DISABLED = 1 << 4;
  exports.DNSSEC_OK = 1 << 15;
  exports.encode = function(result, buf, offset) {
    const allocing = !buf;
    if (allocing) buf = Buffer2.alloc(exports.encodingLength(result));
    if (!offset) offset = 0;
    const oldOffset = offset;
    if (!result.questions) result.questions = [];
    if (!result.answers) result.answers = [];
    if (!result.authorities) result.authorities = [];
    if (!result.additionals) result.additionals = [];
    header.encode(result, buf, offset);
    offset += header.encode.bytes;
    offset = encodeList(result.questions, question, buf, offset);
    offset = encodeList(result.answers, answer, buf, offset);
    offset = encodeList(result.authorities, answer, buf, offset);
    offset = encodeList(result.additionals, answer, buf, offset);
    exports.encode.bytes = offset - oldOffset;
    if (allocing && exports.encode.bytes !== buf.length) {
      return buf.slice(0, exports.encode.bytes);
    }
    return buf;
  };
  exports.encode.bytes = 0;
  exports.decode = function(buf, offset) {
    if (!offset) offset = 0;
    const oldOffset = offset;
    const result = header.decode(buf, offset);
    offset += header.decode.bytes;
    offset = decodeList(result.questions, question, buf, offset);
    offset = decodeList(result.answers, answer, buf, offset);
    offset = decodeList(result.authorities, answer, buf, offset);
    offset = decodeList(result.additionals, answer, buf, offset);
    exports.decode.bytes = offset - oldOffset;
    return result;
  };
  exports.decode.bytes = 0;
  exports.encodingLength = function(result) {
    return header.encodingLength(result) + encodingLengthList(result.questions || [], question) + encodingLengthList(result.answers || [], answer) + encodingLengthList(result.authorities || [], answer) + encodingLengthList(result.additionals || [], answer);
  };
  exports.streamEncode = function(result) {
    const buf = exports.encode(result);
    const sbuf = Buffer2.alloc(2);
    sbuf.writeUInt16BE(buf.byteLength);
    const combine = Buffer2.concat([sbuf, buf]);
    exports.streamEncode.bytes = combine.byteLength;
    return combine;
  };
  exports.streamEncode.bytes = 0;
  exports.streamDecode = function(sbuf) {
    const len = sbuf.readUInt16BE(0);
    if (sbuf.byteLength < len + 2) {
      return null;
    }
    const result = exports.decode(sbuf.slice(2));
    exports.streamDecode.bytes = exports.decode.bytes;
    return result;
  };
  exports.streamDecode.bytes = 0;
  function encodingLengthList(list, enc) {
    let len = 0;
    for (let i = 0; i < list.length; i++) len += enc.encodingLength(list[i]);
    return len;
  }
  function encodeList(list, enc, buf, offset) {
    for (let i = 0; i < list.length; i++) {
      enc.encode(list[i], buf, offset);
      offset += enc.encode.bytes;
    }
    return offset;
  }
  function decodeList(list, enc, buf, offset) {
    for (let i = 0; i < list.length; i++) {
      list[i] = enc.decode(buf, offset);
      offset += enc.decode.bytes;
    }
    return offset;
  }
})(dnsPacket);
var nextTick = nextTickArgs;
process.nextTick(upgrade, 42);
var thunky_1 = thunky$1;
function thunky$1(fn) {
  var state = run;
  return thunk;
  function thunk(callback) {
    state(callback || noop$1);
  }
  function run(callback) {
    var stack = [callback];
    state = wait;
    fn(done);
    function wait(callback2) {
      stack.push(callback2);
    }
    function done(err) {
      var args = arguments;
      state = isError(err) ? run : finished;
      while (stack.length) finished(stack.shift());
      function finished(callback2) {
        nextTick(apply, callback2, args);
      }
    }
  }
}
function isError(err) {
  return Object.prototype.toString.call(err) === "[object Error]";
}
function noop$1() {
}
function apply(callback, args) {
  callback.apply(null, args);
}
function upgrade(val) {
  if (val === 42) nextTick = process.nextTick;
}
function nextTickArgs(fn, a, b) {
  process.nextTick(function() {
    fn(a, b);
  });
}
var packet = dnsPacket;
var dgram = require$$1$2;
var thunky = thunky_1;
var events = require$$0$3;
var os = require$$0$4;
var noop = function() {
};
var multicastDns = function(opts) {
  if (!opts) opts = {};
  var that = new events.EventEmitter();
  var port = typeof opts.port === "number" ? opts.port : 5353;
  var type = opts.type || "udp4";
  var ip = opts.ip || opts.host || (type === "udp4" ? "224.0.0.251" : null);
  var me = { address: ip, port };
  var memberships = {};
  var destroyed = false;
  var interval = null;
  if (type === "udp6" && (!ip || !opts.interface)) {
    throw new Error("For IPv6 multicast you must specify `ip` and `interface`");
  }
  var socket = opts.socket || dgram.createSocket({
    type,
    reuseAddr: opts.reuseAddr !== false,
    toString: function() {
      return type;
    }
  });
  socket.on("error", function(err) {
    if (err.code === "EACCES" || err.code === "EADDRINUSE") that.emit("error", err);
    else that.emit("warning", err);
  });
  socket.on("message", function(message, rinfo) {
    try {
      message = packet.decode(message);
    } catch (err) {
      that.emit("warning", err);
      return;
    }
    that.emit("packet", message, rinfo);
    if (message.type === "query") that.emit("query", message, rinfo);
    if (message.type === "response") that.emit("response", message, rinfo);
  });
  socket.on("listening", function() {
    if (!port) port = me.port = socket.address().port;
    if (opts.multicast !== false) {
      that.update();
      interval = setInterval(that.update, 5e3);
      socket.setMulticastTTL(opts.ttl || 255);
      socket.setMulticastLoopback(opts.loopback !== false);
    }
  });
  var bind = thunky(function(cb) {
    if (!port || opts.bind === false) return cb(null);
    socket.once("error", cb);
    socket.bind(port, opts.bind || opts.interface, function() {
      socket.removeListener("error", cb);
      cb(null);
    });
  });
  bind(function(err) {
    if (err) return that.emit("error", err);
    that.emit("ready");
  });
  that.send = function(value, rinfo, cb) {
    if (typeof rinfo === "function") return that.send(value, null, rinfo);
    if (!cb) cb = noop;
    if (!rinfo) rinfo = me;
    else if (!rinfo.host && !rinfo.address) rinfo.address = me.address;
    bind(onbind);
    function onbind(err) {
      if (destroyed) return cb();
      if (err) return cb(err);
      var message = packet.encode(value);
      socket.send(message, 0, message.length, rinfo.port, rinfo.address || rinfo.host, cb);
    }
  };
  that.response = that.respond = function(res, rinfo, cb) {
    if (Array.isArray(res)) res = { answers: res };
    res.type = "response";
    res.flags = (res.flags || 0) | packet.AUTHORITATIVE_ANSWER;
    that.send(res, rinfo, cb);
  };
  that.query = function(q, type2, rinfo, cb) {
    if (typeof type2 === "function") return that.query(q, null, null, type2);
    if (typeof type2 === "object" && type2 && type2.port) return that.query(q, null, type2, rinfo);
    if (typeof rinfo === "function") return that.query(q, type2, null, rinfo);
    if (!cb) cb = noop;
    if (typeof q === "string") q = [{ name: q, type: type2 || "ANY" }];
    if (Array.isArray(q)) q = { type: "query", questions: q };
    q.type = "query";
    that.send(q, rinfo, cb);
  };
  that.destroy = function(cb) {
    if (!cb) cb = noop;
    if (destroyed) return process.nextTick(cb);
    destroyed = true;
    clearInterval(interval);
    for (var iface in memberships) {
      try {
        socket.dropMembership(ip, iface);
      } catch (e) {
      }
    }
    memberships = {};
    socket.close(cb);
  };
  that.update = function() {
    var ifaces = opts.interface ? [].concat(opts.interface) : allInterfaces();
    var updated = false;
    for (var i = 0; i < ifaces.length; i++) {
      var addr = ifaces[i];
      if (memberships[addr]) continue;
      try {
        socket.addMembership(ip, addr);
        memberships[addr] = true;
        updated = true;
      } catch (err) {
        that.emit("warning", err);
      }
    }
    if (updated) {
      if (socket.setMulticastInterface) {
        try {
          socket.setMulticastInterface(opts.interface || defaultInterface());
        } catch (err) {
          that.emit("warning", err);
        }
      }
      that.emit("networkInterface");
    }
  };
  return that;
};
function defaultInterface() {
  var networks = os.networkInterfaces();
  var names = Object.keys(networks);
  for (var i = 0; i < names.length; i++) {
    var net2 = networks[names[i]];
    for (var j = 0; j < net2.length; j++) {
      var iface = net2[j];
      if (isIPv4(iface.family) && !iface.internal) {
        if (os.platform() === "darwin" && names[i] === "en0") return iface.address;
        return "0.0.0.0";
      }
    }
  }
  return "127.0.0.1";
}
function allInterfaces() {
  var networks = os.networkInterfaces();
  var names = Object.keys(networks);
  var res = [];
  for (var i = 0; i < names.length; i++) {
    var net2 = networks[names[i]];
    for (var j = 0; j < net2.length; j++) {
      var iface = net2[j];
      if (isIPv4(iface.family)) {
        res.push(iface.address);
        break;
      }
    }
  }
  return res;
}
function isIPv4(family) {
  return family === 4 || family === "IPv4";
}
var es6 = function equal(a, b) {
  if (a === b) return true;
  if (a && b && typeof a == "object" && typeof b == "object") {
    if (a.constructor !== b.constructor) return false;
    var length, i, keys;
    if (Array.isArray(a)) {
      length = a.length;
      if (length != b.length) return false;
      for (i = length; i-- !== 0; )
        if (!equal(a[i], b[i])) return false;
      return true;
    }
    if (a instanceof Map && b instanceof Map) {
      if (a.size !== b.size) return false;
      for (i of a.entries())
        if (!b.has(i[0])) return false;
      for (i of a.entries())
        if (!equal(i[1], b.get(i[0]))) return false;
      return true;
    }
    if (a instanceof Set && b instanceof Set) {
      if (a.size !== b.size) return false;
      for (i of a.entries())
        if (!b.has(i[0])) return false;
      return true;
    }
    if (ArrayBuffer.isView(a) && ArrayBuffer.isView(b)) {
      length = a.length;
      if (length != b.length) return false;
      for (i = length; i-- !== 0; )
        if (a[i] !== b[i]) return false;
      return true;
    }
    if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
    if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
    if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();
    keys = Object.keys(a);
    length = keys.length;
    if (length !== Object.keys(b).length) return false;
    for (i = length; i-- !== 0; )
      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;
    for (i = length; i-- !== 0; ) {
      var key = keys[i];
      if (!equal(a[key], b[key])) return false;
    }
    return true;
  }
  return a !== a && b !== b;
};
var __importDefault$3 = commonjsGlobal && commonjsGlobal.__importDefault || function(mod) {
  return mod && mod.__esModule ? mod : { "default": mod };
};
Object.defineProperty(mdnsServer, "__esModule", { value: true });
mdnsServer.Server = void 0;
const multicast_dns_1 = __importDefault$3(multicastDns);
const es6_1 = __importDefault$3(es6);
const dns_equal_1$1 = __importDefault$3(dnsEqual$1);
class Server {
  constructor(opts, errorCallback) {
    this.registry = {};
    this.mdns = (0, multicast_dns_1.default)(opts);
    this.mdns.setMaxListeners(0);
    this.mdns.on("query", this.respondToQuery.bind(this));
    this.errorCallback = errorCallback !== null && errorCallback !== void 0 ? errorCallback : function(err) {
      throw err;
    };
  }
  register(records) {
    const shouldRegister = (record) => {
      var subRegistry = this.registry[record.type];
      if (!subRegistry) {
        subRegistry = this.registry[record.type] = [];
      } else if (subRegistry.some(this.isDuplicateRecord(record))) {
        return;
      }
      subRegistry.push(record);
    };
    if (Array.isArray(records)) {
      records.forEach(shouldRegister);
    } else {
      shouldRegister(records);
    }
  }
  unregister(records) {
    const shouldUnregister = (record) => {
      let type = record.type;
      if (!(type in this.registry)) {
        return;
      }
      this.registry[type] = this.registry[type].filter((i) => i.name !== record.name);
    };
    if (Array.isArray(records)) {
      records.forEach(shouldUnregister);
    } else {
      shouldUnregister(records);
    }
  }
  respondToQuery(query) {
    let self2 = this;
    query.questions.forEach((question) => {
      var type = question.type;
      var name = question.name;
      var answers = type === "ANY" ? Object.keys(self2.registry).map(self2.recordsFor.bind(self2, name)).flat(1) : self2.recordsFor(name, type);
      if (answers.length === 0)
        return;
      var additionals = [];
      if (type !== "ANY") {
        answers.forEach((answer) => {
          if (answer.type !== "PTR")
            return;
          additionals = additionals.concat(self2.recordsFor(answer.data, "SRV")).concat(self2.recordsFor(answer.data, "TXT"));
        });
        additionals.filter(function(record) {
          return record.type === "SRV";
        }).map(function(record) {
          return record.data.target;
        }).filter(this.unique()).forEach(function(target) {
          additionals = additionals.concat(self2.recordsFor(target, "A")).concat(self2.recordsFor(target, "AAAA"));
        });
      }
      self2.mdns.respond({ answers, additionals }, (err) => {
        if (err) {
          this.errorCallback(err);
        }
      });
    });
  }
  recordsFor(name, type) {
    if (!(type in this.registry)) {
      return [];
    }
    return this.registry[type].filter((record) => {
      var _name = ~name.indexOf(".") ? record.name : record.name.split(".")[0];
      return (0, dns_equal_1$1.default)(_name, name);
    });
  }
  isDuplicateRecord(a) {
    return (b) => {
      return a.type === b.type && a.name === b.name && (0, es6_1.default)(a.data, b.data);
    };
  }
  unique() {
    var set = [];
    return (obj) => {
      if (~set.indexOf(obj))
        return false;
      set.push(obj);
      return true;
    };
  }
}
mdnsServer.Server = Server;
mdnsServer.default = Server;
var browser = {};
var filterService = {};
Object.defineProperty(filterService, "__esModule", { value: true });
filterService.default = (service2, txtQuery) => {
  if (txtQuery === void 0)
    return true;
  let serviceTxt = service2.txt;
  let query = Object.entries(txtQuery).map(([key, value]) => {
    let queryValue = serviceTxt[key];
    if (queryValue === void 0)
      return false;
    if (value != queryValue)
      return false;
    return true;
  });
  if (query.length == 0)
    return true;
  if (query.includes(false))
    return false;
  return true;
};
var filterTxt = {};
Object.defineProperty(filterTxt, "__esModule", { value: true });
filterTxt.default = (data) => Object.keys(data).filter((key) => !key.includes("binary")).reduce((cur, key) => {
  return Object.assign(cur, { [key]: data[key] });
}, {});
var equalTxt$1 = {};
Object.defineProperty(equalTxt$1, "__esModule", { value: true });
equalTxt$1.default = equalTxt;
function equalTxt(a, b) {
  if (a === void 0 || b === void 0)
    return false;
  let aKeys = Object.keys(a);
  let bKeys = Object.keys(b);
  if (aKeys.length != bKeys.length)
    return false;
  for (let key of aKeys) {
    if (a[key] != b[key])
      return false;
  }
  return true;
}
var __importDefault$2 = commonjsGlobal && commonjsGlobal.__importDefault || function(mod) {
  return mod && mod.__esModule ? mod : { "default": mod };
};
Object.defineProperty(browser, "__esModule", { value: true });
browser.Browser = void 0;
const dns_txt_1 = __importDefault$2(dnsTxt);
const dns_equal_1 = __importDefault$2(dnsEqual$1);
const events_1 = require$$0$3;
const service_types_1 = serviceTypes;
const filter_service_1 = __importDefault$2(filterService);
const filter_txt_1 = __importDefault$2(filterTxt);
const equal_txt_1 = __importDefault$2(equalTxt$1);
const TLD = ".local";
const WILDCARD = "_services._dns-sd._udp" + TLD;
class Browser extends events_1.EventEmitter {
  constructor(mdns, opts, onup) {
    super();
    this.onresponse = void 0;
    this.serviceMap = {};
    this.wildcard = false;
    this._services = [];
    if (typeof opts === "function")
      return new Browser(mdns, null, opts);
    this.mdns = mdns;
    this.txt = new dns_txt_1.default(opts !== null && opts.txt != null ? opts.txt : void 0);
    if (opts === null || opts.type === void 0) {
      this.name = WILDCARD;
      this.wildcard = true;
    } else {
      this.name = (0, service_types_1.toString)({ name: opts.type, protocol: opts.protocol || "tcp" }) + TLD;
      if (opts.name)
        this.name = opts.name + "." + this.name;
      this.wildcard = false;
    }
    if (opts != null && opts.txt !== void 0)
      this.txtQuery = (0, filter_txt_1.default)(opts.txt);
    if (onup)
      this.on("up", onup);
    this.start();
  }
  start() {
    if (this.onresponse || this.name === void 0)
      return;
    var self2 = this;
    var nameMap = {};
    if (!this.wildcard)
      nameMap[this.name] = true;
    this.onresponse = (packet2, rinfo) => {
      if (self2.wildcard) {
        packet2.answers.forEach((answer) => {
          if (answer.type !== "PTR" || answer.name !== self2.name || answer.name in nameMap)
            return;
          nameMap[answer.data] = true;
          self2.mdns.query(answer.data, "PTR");
        });
      }
      const receiveTime = Date.now();
      Object.keys(nameMap).forEach(function(name) {
        self2.goodbyes(name, packet2).forEach(self2.removeService.bind(self2));
        var matches = self2.buildServicesFor(name, packet2, self2.txt, rinfo, receiveTime);
        if (matches.length === 0)
          return;
        matches.forEach((service2) => {
          const existingService = self2._services.find((s) => (0, dns_equal_1.default)(s.fqdn, service2.fqdn));
          if (existingService) {
            self2.updateServiceSrv(existingService, service2);
            self2.updateServiceTxt(existingService, service2);
            return;
          }
          self2.addService(service2);
        });
      });
    };
    this.mdns.on("response", this.onresponse);
    this.update();
  }
  stop() {
    if (!this.onresponse)
      return;
    this.mdns.removeListener("response", this.onresponse);
    this.onresponse = void 0;
  }
  update() {
    this.mdns.query(this.name, "PTR");
  }
  expire() {
    const currentTime = Date.now();
    this._services = this._services.filter((service2) => {
      if (!service2.ttl || service2.lastSeen === void 0)
        return true;
      const expireTime = service2.lastSeen + service2.ttl * 1e3;
      if (expireTime < currentTime) {
        this.emit("down", service2);
        return false;
      }
      return true;
    });
  }
  get services() {
    return this._services;
  }
  addService(service2) {
    if ((0, filter_service_1.default)(service2, this.txtQuery) === false)
      return;
    this._services.push(service2);
    this.serviceMap[service2.fqdn] = true;
    this.emit("up", service2);
  }
  updateServiceSrv(existingService, newService) {
    if (existingService.name !== newService.name || existingService.host !== newService.host || existingService.port !== newService.port || existingService.type !== newService.type || existingService.protocol !== newService.protocol) {
      this.replaceService(newService);
      this.emit("srv-update", newService, existingService);
    }
  }
  updateServiceTxt(existingService, service2) {
    if ((0, equal_txt_1.default)(service2.txt, (existingService === null || existingService === void 0 ? void 0 : existingService.txt) || {}))
      return;
    if (!(0, filter_service_1.default)(service2, this.txtQuery)) {
      this.removeService(service2.fqdn);
      return;
    }
    this.replaceService(service2);
    this.emit("txt-update", service2, existingService);
  }
  replaceService(service2) {
    this._services = this._services.map((s) => {
      if (!(0, dns_equal_1.default)(s.fqdn, service2.fqdn))
        return s;
      return service2;
    });
  }
  removeService(fqdn) {
    var service2, index;
    this._services.some(function(s, i) {
      if ((0, dns_equal_1.default)(s.fqdn, fqdn)) {
        service2 = s;
        index = i;
        return true;
      }
    });
    if (!service2 || index === void 0)
      return;
    this._services.splice(index, 1);
    delete this.serviceMap[fqdn];
    this.emit("down", service2);
  }
  goodbyes(name, packet2) {
    return packet2.answers.concat(packet2.additionals).filter((rr) => rr.type === "PTR" && rr.ttl === 0 && (0, dns_equal_1.default)(rr.name, name)).map((rr) => rr.data);
  }
  buildServicesFor(name, packet2, txt, referer, receiveTime) {
    var records = packet2.answers.concat(packet2.additionals).filter((rr) => rr.ttl > 0);
    return records.filter((rr) => rr.type === "PTR" && (0, dns_equal_1.default)(rr.name, name)).map((ptr) => {
      const service2 = {
        addresses: [],
        subtypes: [],
        ttl: ptr.ttl,
        lastSeen: receiveTime
      };
      records.filter((rr) => {
        return rr.type === "PTR" && (0, dns_equal_1.default)(rr.data, ptr.data) && rr.name.includes("._sub");
      }).forEach((rr) => {
        const types2 = (0, service_types_1.toType)(rr.name);
        service2.subtypes.push(types2.subtype);
      });
      records.filter((rr) => {
        return (rr.type === "SRV" || rr.type === "TXT") && (0, dns_equal_1.default)(rr.name, ptr.data);
      }).forEach((rr) => {
        if (rr.type === "SRV") {
          var parts = rr.name.split(".");
          var name2 = parts[0];
          var types2 = (0, service_types_1.toType)(parts.slice(1, -1).join("."));
          service2.name = name2;
          service2.fqdn = rr.name;
          service2.host = rr.data.target;
          service2.referer = referer;
          service2.port = rr.data.port;
          service2.type = types2.name;
          service2.protocol = types2.protocol;
        } else if (rr.type === "TXT") {
          service2.rawTxt = rr.data;
          service2.txt = this.txt.decodeAll(rr.data);
        }
      });
      if (!service2.name)
        return;
      records.filter((rr) => (rr.type === "A" || rr.type === "AAAA") && (0, dns_equal_1.default)(rr.name, service2.host)).forEach((rr) => service2.addresses.push(rr.data));
      return service2;
    }).filter((rr) => !!rr);
  }
}
browser.Browser = Browser;
browser.default = Browser;
var __importDefault$1 = commonjsGlobal && commonjsGlobal.__importDefault || function(mod) {
  return mod && mod.__esModule ? mod : { "default": mod };
};
Object.defineProperty(bonjour$1, "__esModule", { value: true });
bonjour$1.Browser = bonjour$1.Service = void 0;
const registry_1 = __importDefault$1(registry);
const mdns_server_1 = __importDefault$1(mdnsServer);
const browser_1 = __importDefault$1(browser);
bonjour$1.Browser = browser_1.default;
const service_1 = __importDefault$1(service);
bonjour$1.Service = service_1.default;
let Bonjour$1 = class Bonjour {
  constructor(opts = {}, errorCallback) {
    this.server = new mdns_server_1.default(opts, errorCallback);
    this.registry = new registry_1.default(this.server);
  }
  publish(opts) {
    return this.registry.publish(opts);
  }
  unpublishAll(callback) {
    return this.registry.unpublishAll(callback);
  }
  find(opts = null, onup) {
    return new browser_1.default(this.server.mdns, opts, onup);
  }
  findOne(opts = null, timeout = 1e4, callback) {
    const browser2 = new browser_1.default(this.server.mdns, opts);
    var timer;
    browser2.once("up", (service2) => {
      if (timer !== void 0)
        clearTimeout(timer);
      browser2.stop();
      if (callback)
        callback(service2);
    });
    timer = setTimeout(() => {
      browser2.stop();
      if (callback)
        callback(null);
    }, timeout);
    return browser2;
  }
  destroy(callback) {
    this.registry.destroy();
    this.server.mdns.destroy(callback);
  }
};
bonjour$1.default = Bonjour$1;
var __createBinding = commonjsGlobal && commonjsGlobal.__createBinding || (Object.create ? function(o, m, k, k2) {
  if (k2 === void 0) k2 = k;
  var desc = Object.getOwnPropertyDescriptor(m, k);
  if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
    desc = { enumerable: true, get: function() {
      return m[k];
    } };
  }
  Object.defineProperty(o, k2, desc);
} : function(o, m, k, k2) {
  if (k2 === void 0) k2 = k;
  o[k2] = m[k];
});
var __setModuleDefault = commonjsGlobal && commonjsGlobal.__setModuleDefault || (Object.create ? function(o, v) {
  Object.defineProperty(o, "default", { enumerable: true, value: v });
} : function(o, v) {
  o["default"] = v;
});
var __importStar = commonjsGlobal && commonjsGlobal.__importStar || /* @__PURE__ */ function() {
  var ownKeys = function(o) {
    ownKeys = Object.getOwnPropertyNames || function(o2) {
      var ar = [];
      for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
      return ar;
    };
    return ownKeys(o);
  };
  return function(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) {
      for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
    }
    __setModuleDefault(result, mod);
    return result;
  };
}();
var __importDefault = commonjsGlobal && commonjsGlobal.__importDefault || function(mod) {
  return mod && mod.__esModule ? mod : { "default": mod };
};
const bonjour_1 = __importDefault(bonjour$1);
const imported = __importStar(bonjour$1);
class Bonjour2 extends bonjour_1.default {
}
var BonjourClass = Bonjour2;
(function(Bonjour3) {
  Bonjour3.Bonjour = BonjourClass;
  Bonjour3.Service = imported.Service;
  Bonjour3.Browser = imported.Browser;
})(Bonjour2 || (Bonjour2 = {}));
Object.defineProperty(Bonjour2, "default", {
  enumerable: true,
  value: Bonjour2
});
var Bonjour_1 = dist.exports.Bonjour = Bonjour2;
dist.exports.Service = imported.Service;
dist.exports.Browser = imported.Browser;
dist.exports.default = Bonjour2;
dist.exports = Bonjour2;
const PUERTO_TRANSFERENCIA = 53317;
const TIPO_SERVICIO_BONJOUR = "localsend";
const RUTA_WEBSOCKET = "/transferencia";
function crearMensajeMetadatos(metadatos) {
  return JSON.stringify(metadatos);
}
function interpretarMensajeMetadatos(mensajeTexto) {
  return JSON.parse(mensajeTexto);
}
function crearMensajeRespuesta(aceptado) {
  return JSON.stringify({ tipo: "respuesta", aceptado });
}
var bufferUtil$1 = { exports: {} };
const BINARY_TYPES$2 = ["nodebuffer", "arraybuffer", "fragments"];
const hasBlob$1 = typeof Blob !== "undefined";
if (hasBlob$1) BINARY_TYPES$2.push("blob");
var constants = {
  BINARY_TYPES: BINARY_TYPES$2,
  CLOSE_TIMEOUT: 3e4,
  EMPTY_BUFFER: Buffer.alloc(0),
  GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
  hasBlob: hasBlob$1,
  kForOnEventAttribute: Symbol("kIsForOnEventAttribute"),
  kListener: Symbol("kListener"),
  kStatusCode: Symbol("status-code"),
  kWebSocket: Symbol("websocket"),
  NOOP: () => {
  }
};
var unmask$1;
var mask;
const { EMPTY_BUFFER: EMPTY_BUFFER$3 } = constants;
const FastBuffer$2 = Buffer[Symbol.species];
function concat$1(list, totalLength) {
  if (list.length === 0) return EMPTY_BUFFER$3;
  if (list.length === 1) return list[0];
  const target = Buffer.allocUnsafe(totalLength);
  let offset = 0;
  for (let i = 0; i < list.length; i++) {
    const buf = list[i];
    target.set(buf, offset);
    offset += buf.length;
  }
  if (offset < totalLength) {
    return new FastBuffer$2(target.buffer, target.byteOffset, offset);
  }
  return target;
}
function _mask(source, mask2, output, offset, length) {
  for (let i = 0; i < length; i++) {
    output[offset + i] = source[i] ^ mask2[i & 3];
  }
}
function _unmask(buffer, mask2) {
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] ^= mask2[i & 3];
  }
}
function toArrayBuffer$1(buf) {
  if (buf.length === buf.buffer.byteLength) {
    return buf.buffer;
  }
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
}
function toBuffer$2(data) {
  toBuffer$2.readOnly = true;
  if (Buffer.isBuffer(data)) return data;
  let buf;
  if (data instanceof ArrayBuffer) {
    buf = new FastBuffer$2(data);
  } else if (ArrayBuffer.isView(data)) {
    buf = new FastBuffer$2(data.buffer, data.byteOffset, data.byteLength);
  } else {
    buf = Buffer.from(data);
    toBuffer$2.readOnly = false;
  }
  return buf;
}
bufferUtil$1.exports = {
  concat: concat$1,
  mask: _mask,
  toArrayBuffer: toArrayBuffer$1,
  toBuffer: toBuffer$2,
  unmask: _unmask
};
if (!process.env.WS_NO_BUFFER_UTIL) {
  try {
    const bufferUtil2 = require("bufferutil");
    mask = bufferUtil$1.exports.mask = function(source, mask2, output, offset, length) {
      if (length < 48) _mask(source, mask2, output, offset, length);
      else bufferUtil2.mask(source, mask2, output, offset, length);
    };
    unmask$1 = bufferUtil$1.exports.unmask = function(buffer, mask2) {
      if (buffer.length < 32) _unmask(buffer, mask2);
      else bufferUtil2.unmask(buffer, mask2);
    };
  } catch (e) {
  }
}
var bufferUtilExports = bufferUtil$1.exports;
const kDone = Symbol("kDone");
const kRun = Symbol("kRun");
let Limiter$1 = class Limiter2 {
  /**
   * Creates a new `Limiter`.
   *
   * @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
   *     to run concurrently
   */
  constructor(concurrency) {
    this[kDone] = () => {
      this.pending--;
      this[kRun]();
    };
    this.concurrency = concurrency || Infinity;
    this.jobs = [];
    this.pending = 0;
  }
  /**
   * Adds a job to the queue.
   *
   * @param {Function} job The job to run
   * @public
   */
  add(job) {
    this.jobs.push(job);
    this[kRun]();
  }
  /**
   * Removes a job from the queue and runs it if possible.
   *
   * @private
   */
  [kRun]() {
    if (this.pending === this.concurrency) return;
    if (this.jobs.length) {
      const job = this.jobs.shift();
      this.pending++;
      job(this[kDone]);
    }
  }
};
var limiter = Limiter$1;
const zlib = require$$0;
const bufferUtil = bufferUtilExports;
const Limiter3 = limiter;
const { kStatusCode: kStatusCode$2 } = constants;
const FastBuffer$1 = Buffer[Symbol.species];
const TRAILER = Buffer.from([0, 0, 255, 255]);
const kPerMessageDeflate = Symbol("permessage-deflate");
const kTotalLength = Symbol("total-length");
const kCallback = Symbol("callback");
const kBuffers = Symbol("buffers");
const kError$1 = Symbol("error");
let zlibLimiter;
let PerMessageDeflate$3 = class PerMessageDeflate2 {
  /**
   * Creates a PerMessageDeflate instance.
   *
   * @param {Object} [options] Configuration options
   * @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
   *     for, or request, a custom client window size
   * @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
   *     acknowledge disabling of client context takeover
   * @param {Number} [options.concurrencyLimit=10] The number of concurrent
   *     calls to zlib
   * @param {Boolean} [options.isServer=false] Create the instance in either
   *     server or client mode
   * @param {Number} [options.maxPayload=0] The maximum allowed message length
   * @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
   *     use of a custom server window size
   * @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
   *     disabling of server context takeover
   * @param {Number} [options.threshold=1024] Size (in bytes) below which
   *     messages should not be compressed if context takeover is disabled
   * @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
   *     deflate
   * @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
   *     inflate
   */
  constructor(options) {
    this._options = options || {};
    this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024;
    this._maxPayload = this._options.maxPayload | 0;
    this._isServer = !!this._options.isServer;
    this._deflate = null;
    this._inflate = null;
    this.params = null;
    if (!zlibLimiter) {
      const concurrency = this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10;
      zlibLimiter = new Limiter3(concurrency);
    }
  }
  /**
   * @type {String}
   */
  static get extensionName() {
    return "permessage-deflate";
  }
  /**
   * Create an extension negotiation offer.
   *
   * @return {Object} Extension parameters
   * @public
   */
  offer() {
    const params = {};
    if (this._options.serverNoContextTakeover) {
      params.server_no_context_takeover = true;
    }
    if (this._options.clientNoContextTakeover) {
      params.client_no_context_takeover = true;
    }
    if (this._options.serverMaxWindowBits) {
      params.server_max_window_bits = this._options.serverMaxWindowBits;
    }
    if (this._options.clientMaxWindowBits) {
      params.client_max_window_bits = this._options.clientMaxWindowBits;
    } else if (this._options.clientMaxWindowBits == null) {
      params.client_max_window_bits = true;
    }
    return params;
  }
  /**
   * Accept an extension negotiation offer/response.
   *
   * @param {Array} configurations The extension negotiation offers/reponse
   * @return {Object} Accepted configuration
   * @public
   */
  accept(configurations) {
    configurations = this.normalizeParams(configurations);
    this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
    return this.params;
  }
  /**
   * Releases all resources used by the extension.
   *
   * @public
   */
  cleanup() {
    if (this._inflate) {
      this._inflate.close();
      this._inflate = null;
    }
    if (this._deflate) {
      const callback = this._deflate[kCallback];
      this._deflate.close();
      this._deflate = null;
      if (callback) {
        callback(
          new Error(
            "The deflate stream was closed while data was being processed"
          )
        );
      }
    }
  }
  /**
   *  Accept an extension negotiation offer.
   *
   * @param {Array} offers The extension negotiation offers
   * @return {Object} Accepted configuration
   * @private
   */
  acceptAsServer(offers) {
    const opts = this._options;
    const accepted = offers.find((params) => {
      if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === "number" && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === "number" && (typeof params.client_max_window_bits === "number" ? opts.clientMaxWindowBits > params.client_max_window_bits : !params.client_max_window_bits)) {
        return false;
      }
      return true;
    });
    if (!accepted) {
      throw new Error("None of the extension offers can be accepted");
    }
    if (opts.serverNoContextTakeover) {
      accepted.server_no_context_takeover = true;
    }
    if (opts.clientNoContextTakeover) {
      accepted.client_no_context_takeover = true;
    }
    if (typeof opts.serverMaxWindowBits === "number") {
      accepted.server_max_window_bits = opts.serverMaxWindowBits;
    }
    if (typeof opts.clientMaxWindowBits === "number") {
      accepted.client_max_window_bits = opts.clientMaxWindowBits;
    } else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) {
      delete accepted.client_max_window_bits;
    }
    return accepted;
  }
  /**
   * Accept the extension negotiation response.
   *
   * @param {Array} response The extension negotiation response
   * @return {Object} Accepted configuration
   * @private
   */
  acceptAsClient(response) {
    const params = response[0];
    if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) {
      throw new Error('Unexpected parameter "client_no_context_takeover"');
    }
    if (!params.client_max_window_bits) {
      if (typeof this._options.clientMaxWindowBits === "number") {
        params.client_max_window_bits = this._options.clientMaxWindowBits;
      }
    } else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === "number" && params.client_max_window_bits > this._options.clientMaxWindowBits) {
      throw new Error(
        'Unexpected or invalid parameter "client_max_window_bits"'
      );
    }
    return params;
  }
  /**
   * Normalize parameters.
   *
   * @param {Array} configurations The extension negotiation offers/reponse
   * @return {Array} The offers/response with normalized parameters
   * @private
   */
  normalizeParams(configurations) {
    configurations.forEach((params) => {
      Object.keys(params).forEach((key) => {
        let value = params[key];
        if (value.length > 1) {
          throw new Error(`Parameter "${key}" must have only a single value`);
        }
        value = value[0];
        if (key === "client_max_window_bits") {
          if (value !== true) {
            const num = +value;
            if (!Number.isInteger(num) || num < 8 || num > 15) {
              throw new TypeError(
                `Invalid value for parameter "${key}": ${value}`
              );
            }
            value = num;
          } else if (!this._isServer) {
            throw new TypeError(
              `Invalid value for parameter "${key}": ${value}`
            );
          }
        } else if (key === "server_max_window_bits") {
          const num = +value;
          if (!Number.isInteger(num) || num < 8 || num > 15) {
            throw new TypeError(
              `Invalid value for parameter "${key}": ${value}`
            );
          }
          value = num;
        } else if (key === "client_no_context_takeover" || key === "server_no_context_takeover") {
          if (value !== true) {
            throw new TypeError(
              `Invalid value for parameter "${key}": ${value}`
            );
          }
        } else {
          throw new Error(`Unknown parameter "${key}"`);
        }
        params[key] = value;
      });
    });
    return configurations;
  }
  /**
   * Decompress data. Concurrency limited.
   *
   * @param {Buffer} data Compressed data
   * @param {Boolean} fin Specifies whether or not this is the last fragment
   * @param {Function} callback Callback
   * @public
   */
  decompress(data, fin, callback) {
    zlibLimiter.add((done) => {
      this._decompress(data, fin, (err, result) => {
        done();
        callback(err, result);
      });
    });
  }
  /**
   * Compress data. Concurrency limited.
   *
   * @param {(Buffer|String)} data Data to compress
   * @param {Boolean} fin Specifies whether or not this is the last fragment
   * @param {Function} callback Callback
   * @public
   */
  compress(data, fin, callback) {
    zlibLimiter.add((done) => {
      this._compress(data, fin, (err, result) => {
        done();
        callback(err, result);
      });
    });
  }
  /**
   * Decompress data.
   *
   * @param {Buffer} data Compressed data
   * @param {Boolean} fin Specifies whether or not this is the last fragment
   * @param {Function} callback Callback
   * @private
   */
  _decompress(data, fin, callback) {
    const endpoint = this._isServer ? "client" : "server";
    if (!this._inflate) {
      const key = `${endpoint}_max_window_bits`;
      const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
      this._inflate = zlib.createInflateRaw({
        ...this._options.zlibInflateOptions,
        windowBits
      });
      this._inflate[kPerMessageDeflate] = this;
      this._inflate[kTotalLength] = 0;
      this._inflate[kBuffers] = [];
      this._inflate.on("error", inflateOnError);
      this._inflate.on("data", inflateOnData);
    }
    this._inflate[kCallback] = callback;
    this._inflate.write(data);
    if (fin) this._inflate.write(TRAILER);
    this._inflate.flush(() => {
      const err = this._inflate[kError$1];
      if (err) {
        this._inflate.close();
        this._inflate = null;
        callback(err);
        return;
      }
      const data2 = bufferUtil.concat(
        this._inflate[kBuffers],
        this._inflate[kTotalLength]
      );
      if (this._inflate._readableState.endEmitted) {
        this._inflate.close();
        this._inflate = null;
      } else {
        this._inflate[kTotalLength] = 0;
        this._inflate[kBuffers] = [];
        if (fin && this.params[`${endpoint}_no_context_takeover`]) {
          this._inflate.reset();
        }
      }
      callback(null, data2);
    });
  }
  /**
   * Compress data.
   *
   * @param {(Buffer|String)} data Data to compress
   * @param {Boolean} fin Specifies whether or not this is the last fragment
   * @param {Function} callback Callback
   * @private
   */
  _compress(data, fin, callback) {
    const endpoint = this._isServer ? "server" : "client";
    if (!this._deflate) {
      const key = `${endpoint}_max_window_bits`;
      const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
      this._deflate = zlib.createDeflateRaw({
        ...this._options.zlibDeflateOptions,
        windowBits
      });
      this._deflate[kTotalLength] = 0;
      this._deflate[kBuffers] = [];
      this._deflate.on("data", deflateOnData);
    }
    this._deflate[kCallback] = callback;
    this._deflate.write(data);
    this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
      if (!this._deflate) {
        return;
      }
      let data2 = bufferUtil.concat(
        this._deflate[kBuffers],
        this._deflate[kTotalLength]
      );
      if (fin) {
        data2 = new FastBuffer$1(data2.buffer, data2.byteOffset, data2.length - 4);
      }
      this._deflate[kCallback] = null;
      this._deflate[kTotalLength] = 0;
      this._deflate[kBuffers] = [];
      if (fin && this.params[`${endpoint}_no_context_takeover`]) {
        this._deflate.reset();
      }
      callback(null, data2);
    });
  }
};
var permessageDeflate = PerMessageDeflate$3;
function deflateOnData(chunk) {
  this[kBuffers].push(chunk);
  this[kTotalLength] += chunk.length;
}
function inflateOnData(chunk) {
  this[kTotalLength] += chunk.length;
  if (this[kPerMessageDeflate]._maxPayload < 1 || this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload) {
    this[kBuffers].push(chunk);
    return;
  }
  this[kError$1] = new RangeError("Max payload size exceeded");
  this[kError$1].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH";
  this[kError$1][kStatusCode$2] = 1009;
  this.removeListener("data", inflateOnData);
  this.reset();
}
function inflateOnError(err) {
  this[kPerMessageDeflate]._inflate = null;
  if (this[kError$1]) {
    this[kCallback](this[kError$1]);
    return;
  }
  err[kStatusCode$2] = 1007;
  this[kCallback](err);
}
var validation = { exports: {} };
var isValidUTF8_1;
const { isUtf8 } = require$$0$1;
const { hasBlob } = constants;
const tokenChars$2 = [
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  // 0 - 15
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  // 16 - 31
  0,
  1,
  0,
  1,
  1,
  1,
  1,
  1,
  0,
  0,
  1,
  1,
  0,
  1,
  1,
  0,
  // 32 - 47
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  0,
  0,
  0,
  0,
  0,
  0,
  // 48 - 63
  0,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  // 64 - 79
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  0,
  0,
  0,
  1,
  1,
  // 80 - 95
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  // 96 - 111
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  0,
  1,
  0,
  1,
  0
  // 112 - 127
];
function isValidStatusCode$2(code) {
  return code >= 1e3 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3e3 && code <= 4999;
}
function _isValidUTF8(buf) {
  const len = buf.length;
  let i = 0;
  while (i < len) {
    if ((buf[i] & 128) === 0) {
      i++;
    } else if ((buf[i] & 224) === 192) {
      if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) {
        return false;
      }
      i += 2;
    } else if ((buf[i] & 240) === 224) {
      if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || // Overlong
      buf[i] === 237 && (buf[i + 1] & 224) === 160) {
        return false;
      }
      i += 3;
    } else if ((buf[i] & 248) === 240) {
      if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || // Overlong
      buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) {
        return false;
      }
      i += 4;
    } else {
      return false;
    }
  }
  return true;
}
function isBlob$2(value) {
  return hasBlob && typeof value === "object" && typeof value.arrayBuffer === "function" && typeof value.type === "string" && typeof value.stream === "function" && (value[Symbol.toStringTag] === "Blob" || value[Symbol.toStringTag] === "File");
}
validation.exports = {
  isBlob: isBlob$2,
  isValidStatusCode: isValidStatusCode$2,
  isValidUTF8: _isValidUTF8,
  tokenChars: tokenChars$2
};
if (isUtf8) {
  isValidUTF8_1 = validation.exports.isValidUTF8 = function(buf) {
    return buf.length < 24 ? _isValidUTF8(buf) : isUtf8(buf);
  };
} else if (!process.env.WS_NO_UTF_8_VALIDATE) {
  try {
    const isValidUTF82 = require("utf-8-validate");
    isValidUTF8_1 = validation.exports.isValidUTF8 = function(buf) {
      return buf.length < 32 ? _isValidUTF8(buf) : isValidUTF82(buf);
    };
  } catch (e) {
  }
}
var validationExports = validation.exports;
const { Writable } = require$$0$2;
const PerMessageDeflate$2 = permessageDeflate;
const {
  BINARY_TYPES: BINARY_TYPES$1,
  EMPTY_BUFFER: EMPTY_BUFFER$2,
  kStatusCode: kStatusCode$1,
  kWebSocket: kWebSocket$3
} = constants;
const { concat, toArrayBuffer, unmask } = bufferUtilExports;
const { isValidStatusCode: isValidStatusCode$1, isValidUTF8 } = validationExports;
const FastBuffer = Buffer[Symbol.species];
const GET_INFO = 0;
const GET_PAYLOAD_LENGTH_16 = 1;
const GET_PAYLOAD_LENGTH_64 = 2;
const GET_MASK = 3;
const GET_DATA = 4;
const INFLATING = 5;
const DEFER_EVENT = 6;
let Receiver$1 = class Receiver2 extends Writable {
  /**
   * Creates a Receiver instance.
   *
   * @param {Object} [options] Options object
   * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
   *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
   *     multiple times in the same tick
   * @param {String} [options.binaryType=nodebuffer] The type for binary data
   * @param {Object} [options.extensions] An object containing the negotiated
   *     extensions
   * @param {Boolean} [options.isServer=false] Specifies whether to operate in
   *     client or server mode
   * @param {Number} [options.maxBufferedChunks=0] The maximum number of
   *     buffered data chunks
   * @param {Number} [options.maxFragments=0] The maximum number of message
   *     fragments
   * @param {Number} [options.maxPayload=0] The maximum allowed message length
   * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
   *     not to skip UTF-8 validation for text and close messages
   */
  constructor(options = {}) {
    super();
    this._allowSynchronousEvents = options.allowSynchronousEvents !== void 0 ? options.allowSynchronousEvents : true;
    this._binaryType = options.binaryType || BINARY_TYPES$1[0];
    this._extensions = options.extensions || {};
    this._isServer = !!options.isServer;
    this._maxBufferedChunks = options.maxBufferedChunks | 0;
    this._maxFragments = options.maxFragments | 0;
    this._maxPayload = options.maxPayload | 0;
    this._skipUTF8Validation = !!options.skipUTF8Validation;
    this[kWebSocket$3] = void 0;
    this._bufferedBytes = 0;
    this._buffers = [];
    this._compressed = false;
    this._payloadLength = 0;
    this._mask = void 0;
    this._fragmented = 0;
    this._masked = false;
    this._fin = false;
    this._opcode = 0;
    this._totalPayloadLength = 0;
    this._messageLength = 0;
    this._numFragments = 0;
    this._fragments = [];
    this._errored = false;
    this._loop = false;
    this._state = GET_INFO;
  }
  /**
   * Implements `Writable.prototype._write()`.
   *
   * @param {Buffer} chunk The chunk of data to write
   * @param {String} encoding The character encoding of `chunk`
   * @param {Function} cb Callback
   * @private
   */
  _write(chunk, encoding, cb) {
    if (this._opcode === 8 && this._state == GET_INFO) return cb();
    if (this._maxBufferedChunks > 0 && this._buffers.length >= this._maxBufferedChunks) {
      cb(
        this.createError(
          RangeError,
          "Too many buffered chunks",
          false,
          1008,
          "WS_ERR_TOO_MANY_BUFFERED_PARTS"
        )
      );
      return;
    }
    this._bufferedBytes += chunk.length;
    this._buffers.push(chunk);
    this.startLoop(cb);
  }
  /**
   * Consumes `n` bytes from the buffered data.
   *
   * @param {Number} n The number of bytes to consume
   * @return {Buffer} The consumed bytes
   * @private
   */
  consume(n) {
    this._bufferedBytes -= n;
    if (n === this._buffers[0].length) return this._buffers.shift();
    if (n < this._buffers[0].length) {
      const buf = this._buffers[0];
      this._buffers[0] = new FastBuffer(
        buf.buffer,
        buf.byteOffset + n,
        buf.length - n
      );
      return new FastBuffer(buf.buffer, buf.byteOffset, n);
    }
    const dst = Buffer.allocUnsafe(n);
    do {
      const buf = this._buffers[0];
      const offset = dst.length - n;
      if (n >= buf.length) {
        dst.set(this._buffers.shift(), offset);
      } else {
        dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
        this._buffers[0] = new FastBuffer(
          buf.buffer,
          buf.byteOffset + n,
          buf.length - n
        );
      }
      n -= buf.length;
    } while (n > 0);
    return dst;
  }
  /**
   * Starts the parsing loop.
   *
   * @param {Function} cb Callback
   * @private
   */
  startLoop(cb) {
    this._loop = true;
    do {
      switch (this._state) {
        case GET_INFO:
          this.getInfo(cb);
          break;
        case GET_PAYLOAD_LENGTH_16:
          this.getPayloadLength16(cb);
          break;
        case GET_PAYLOAD_LENGTH_64:
          this.getPayloadLength64(cb);
          break;
        case GET_MASK:
          this.getMask();
          break;
        case GET_DATA:
          this.getData(cb);
          break;
        case INFLATING:
        case DEFER_EVENT:
          this._loop = false;
          return;
      }
    } while (this._loop);
    if (!this._errored) cb();
  }
  /**
   * Reads the first two bytes of a frame.
   *
   * @param {Function} cb Callback
   * @private
   */
  getInfo(cb) {
    if (this._bufferedBytes < 2) {
      this._loop = false;
      return;
    }
    const buf = this.consume(2);
    if ((buf[0] & 48) !== 0) {
      const error = this.createError(
        RangeError,
        "RSV2 and RSV3 must be clear",
        true,
        1002,
        "WS_ERR_UNEXPECTED_RSV_2_3"
      );
      cb(error);
      return;
    }
    const compressed = (buf[0] & 64) === 64;
    if (compressed && !this._extensions[PerMessageDeflate$2.extensionName]) {
      const error = this.createError(
        RangeError,
        "RSV1 must be clear",
        true,
        1002,
        "WS_ERR_UNEXPECTED_RSV_1"
      );
      cb(error);
      return;
    }
    this._fin = (buf[0] & 128) === 128;
    this._opcode = buf[0] & 15;
    this._payloadLength = buf[1] & 127;
    if (this._opcode === 0) {
      if (compressed) {
        const error = this.createError(
          RangeError,
          "RSV1 must be clear",
          true,
          1002,
          "WS_ERR_UNEXPECTED_RSV_1"
        );
        cb(error);
        return;
      }
      if (!this._fragmented) {
        const error = this.createError(
          RangeError,
          "invalid opcode 0",
          true,
          1002,
          "WS_ERR_INVALID_OPCODE"
        );
        cb(error);
        return;
      }
      this._opcode = this._fragmented;
    } else if (this._opcode === 1 || this._opcode === 2) {
      if (this._fragmented) {
        const error = this.createError(
          RangeError,
          `invalid opcode ${this._opcode}`,
          true,
          1002,
          "WS_ERR_INVALID_OPCODE"
        );
        cb(error);
        return;
      }
      this._compressed = compressed;
    } else if (this._opcode > 7 && this._opcode < 11) {
      if (!this._fin) {
        const error = this.createError(
          RangeError,
          "FIN must be set",
          true,
          1002,
          "WS_ERR_EXPECTED_FIN"
        );
        cb(error);
        return;
      }
      if (compressed) {
        const error = this.createError(
          RangeError,
          "RSV1 must be clear",
          true,
          1002,
          "WS_ERR_UNEXPECTED_RSV_1"
        );
        cb(error);
        return;
      }
      if (this._payloadLength > 125 || this._opcode === 8 && this._payloadLength === 1) {
        const error = this.createError(
          RangeError,
          `invalid payload length ${this._payloadLength}`,
          true,
          1002,
          "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"
        );
        cb(error);
        return;
      }
    } else {
      const error = this.createError(
        RangeError,
        `invalid opcode ${this._opcode}`,
        true,
        1002,
        "WS_ERR_INVALID_OPCODE"
      );
      cb(error);
      return;
    }
    if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
    this._masked = (buf[1] & 128) === 128;
    if (this._isServer) {
      if (!this._masked) {
        const error = this.createError(
          RangeError,
          "MASK must be set",
          true,
          1002,
          "WS_ERR_EXPECTED_MASK"
        );
        cb(error);
        return;
      }
    } else if (this._masked) {
      const error = this.createError(
        RangeError,
        "MASK must be clear",
        true,
        1002,
        "WS_ERR_UNEXPECTED_MASK"
      );
      cb(error);
      return;
    }
    if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
    else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;
    else this.haveLength(cb);
  }
  /**
   * Gets extended payload length (7+16).
   *
   * @param {Function} cb Callback
   * @private
   */
  getPayloadLength16(cb) {
    if (this._bufferedBytes < 2) {
      this._loop = false;
      return;
    }
    this._payloadLength = this.consume(2).readUInt16BE(0);
    this.haveLength(cb);
  }
  /**
   * Gets extended payload length (7+64).
   *
   * @param {Function} cb Callback
   * @private
   */
  getPayloadLength64(cb) {
    if (this._bufferedBytes < 8) {
      this._loop = false;
      return;
    }
    const buf = this.consume(8);
    const num = buf.readUInt32BE(0);
    if (num > Math.pow(2, 53 - 32) - 1) {
      const error = this.createError(
        RangeError,
        "Unsupported WebSocket frame: payload length > 2^53 - 1",
        false,
        1009,
        "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH"
      );
      cb(error);
      return;
    }
    this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
    this.haveLength(cb);
  }
  /**
   * Payload length has been read.
   *
   * @param {Function} cb Callback
   * @private
   */
  haveLength(cb) {
    if (this._payloadLength && this._opcode < 8) {
      this._totalPayloadLength += this._payloadLength;
      if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
        const error = this.createError(
          RangeError,
          "Max payload size exceeded",
          false,
          1009,
          "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
        );
        cb(error);
        return;
      }
    }
    if (this._masked) this._state = GET_MASK;
    else this._state = GET_DATA;
  }
  /**
   * Reads mask bytes.
   *
   * @private
   */
  getMask() {
    if (this._bufferedBytes < 4) {
      this._loop = false;
      return;
    }
    this._mask = this.consume(4);
    this._state = GET_DATA;
  }
  /**
   * Reads data bytes.
   *
   * @param {Function} cb Callback
   * @private
   */
  getData(cb) {
    let data = EMPTY_BUFFER$2;
    if (this._payloadLength) {
      if (this._bufferedBytes < this._payloadLength) {
        this._loop = false;
        return;
      }
      data = this.consume(this._payloadLength);
      if (this._masked && (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0) {
        unmask(data, this._mask);
      }
    }
    if (this._opcode > 7) {
      this.controlMessage(data, cb);
      return;
    }
    if (this._maxFragments > 0 && ++this._numFragments > this._maxFragments) {
      const error = this.createError(
        RangeError,
        "Too many message fragments",
        false,
        1008,
        "WS_ERR_TOO_MANY_BUFFERED_PARTS"
      );
      cb(error);
      return;
    }
    if (this._compressed) {
      this._state = INFLATING;
      this.decompress(data, cb);
      return;
    }
    if (data.length) {
      this._messageLength = this._totalPayloadLength;
      this._fragments.push(data);
    }
    this.dataMessage(cb);
  }
  /**
   * Decompresses data.
   *
   * @param {Buffer} data Compressed data
   * @param {Function} cb Callback
   * @private
   */
  decompress(data, cb) {
    const perMessageDeflate = this._extensions[PerMessageDeflate$2.extensionName];
    perMessageDeflate.decompress(data, this._fin, (err, buf) => {
      if (err) return cb(err);
      if (buf.length) {
        this._messageLength += buf.length;
        if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
          const error = this.createError(
            RangeError,
            "Max payload size exceeded",
            false,
            1009,
            "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
          );
          cb(error);
          return;
        }
        this._fragments.push(buf);
      }
      this.dataMessage(cb);
      if (this._state === GET_INFO) this.startLoop(cb);
    });
  }
  /**
   * Handles a data message.
   *
   * @param {Function} cb Callback
   * @private
   */
  dataMessage(cb) {
    if (!this._fin) {
      this._state = GET_INFO;
      return;
    }
    const messageLength = this._messageLength;
    const fragments = this._fragments;
    this._totalPayloadLength = 0;
    this._messageLength = 0;
    this._fragmented = 0;
    this._numFragments = 0;
    this._fragments = [];
    if (this._opcode === 2) {
      let data;
      if (this._binaryType === "nodebuffer") {
        data = concat(fragments, messageLength);
      } else if (this._binaryType === "arraybuffer") {
        data = toArrayBuffer(concat(fragments, messageLength));
      } else if (this._binaryType === "blob") {
        data = new Blob(fragments);
      } else {
        data = fragments;
      }
      if (this._allowSynchronousEvents) {
        this.emit("message", data, true);
        this._state = GET_INFO;
      } else {
        this._state = DEFER_EVENT;
        setImmediate(() => {
          this.emit("message", data, true);
          this._state = GET_INFO;
          this.startLoop(cb);
        });
      }
    } else {
      const buf = concat(fragments, messageLength);
      if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
        const error = this.createError(
          Error,
          "invalid UTF-8 sequence",
          true,
          1007,
          "WS_ERR_INVALID_UTF8"
        );
        cb(error);
        return;
      }
      if (this._state === INFLATING || this._allowSynchronousEvents) {
        this.emit("message", buf, false);
        this._state = GET_INFO;
      } else {
        this._state = DEFER_EVENT;
        setImmediate(() => {
          this.emit("message", buf, false);
          this._state = GET_INFO;
          this.startLoop(cb);
        });
      }
    }
  }
  /**
   * Handles a control message.
   *
   * @param {Buffer} data Data to handle
   * @return {(Error|RangeError|undefined)} A possible error
   * @private
   */
  controlMessage(data, cb) {
    if (this._opcode === 8) {
      if (data.length === 0) {
        this._loop = false;
        this.emit("conclude", 1005, EMPTY_BUFFER$2);
        this.end();
      } else {
        const code = data.readUInt16BE(0);
        if (!isValidStatusCode$1(code)) {
          const error = this.createError(
            RangeError,
            `invalid status code ${code}`,
            true,
            1002,
            "WS_ERR_INVALID_CLOSE_CODE"
          );
          cb(error);
          return;
        }
        const buf = new FastBuffer(
          data.buffer,
          data.byteOffset + 2,
          data.length - 2
        );
        if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
          const error = this.createError(
            Error,
            "invalid UTF-8 sequence",
            true,
            1007,
            "WS_ERR_INVALID_UTF8"
          );
          cb(error);
          return;
        }
        this._loop = false;
        this.emit("conclude", code, buf);
        this.end();
      }
      this._state = GET_INFO;
      return;
    }
    if (this._allowSynchronousEvents) {
      this.emit(this._opcode === 9 ? "ping" : "pong", data);
      this._state = GET_INFO;
    } else {
      this._state = DEFER_EVENT;
      setImmediate(() => {
        this.emit(this._opcode === 9 ? "ping" : "pong", data);
        this._state = GET_INFO;
        this.startLoop(cb);
      });
    }
  }
  /**
   * Builds an error object.
   *
   * @param {function(new:Error|RangeError)} ErrorCtor The error constructor
   * @param {String} message The error message
   * @param {Boolean} prefix Specifies whether or not to add a default prefix to
   *     `message`
   * @param {Number} statusCode The status code
   * @param {String} errorCode The exposed error code
   * @return {(Error|RangeError)} The error
   * @private
   */
  createError(ErrorCtor, message, prefix, statusCode, errorCode) {
    this._loop = false;
    this._errored = true;
    const err = new ErrorCtor(
      prefix ? `Invalid WebSocket frame: ${message}` : message
    );
    Error.captureStackTrace(err, this.createError);
    err.code = errorCode;
    err[kStatusCode$1] = statusCode;
    return err;
  }
};
var receiver = Receiver$1;
const { Duplex: Duplex$3 } = require$$0$2;
const { randomFillSync } = require$$1;
const {
  types: { isUint8Array }
} = require$$2;
const PerMessageDeflate$1 = permessageDeflate;
const { EMPTY_BUFFER: EMPTY_BUFFER$1, kWebSocket: kWebSocket$2, NOOP: NOOP$1 } = constants;
const { isBlob: isBlob$1, isValidStatusCode } = validationExports;
const { mask: applyMask, toBuffer: toBuffer$1 } = bufferUtilExports;
const kByteLength = Symbol("kByteLength");
const maskBuffer = Buffer.alloc(4);
const RANDOM_POOL_SIZE = 8 * 1024;
let randomPool;
let randomPoolPointer = RANDOM_POOL_SIZE;
const DEFAULT = 0;
const DEFLATING = 1;
const GET_BLOB_DATA = 2;
let Sender$1 = class Sender2 {
  /**
   * Creates a Sender instance.
   *
   * @param {Duplex} socket The connection socket
   * @param {Object} [extensions] An object containing the negotiated extensions
   * @param {Function} [generateMask] The function used to generate the masking
   *     key
   */
  constructor(socket, extensions, generateMask) {
    this._extensions = extensions || {};
    if (generateMask) {
      this._generateMask = generateMask;
      this._maskBuffer = Buffer.alloc(4);
    }
    this._socket = socket;
    this._firstFragment = true;
    this._compress = false;
    this._bufferedBytes = 0;
    this._queue = [];
    this._state = DEFAULT;
    this.onerror = NOOP$1;
    this[kWebSocket$2] = void 0;
  }
  /**
   * Frames a piece of data according to the HyBi WebSocket protocol.
   *
   * @param {(Buffer|String)} data The data to frame
   * @param {Object} options Options object
   * @param {Boolean} [options.fin=false] Specifies whether or not to set the
   *     FIN bit
   * @param {Function} [options.generateMask] The function used to generate the
   *     masking key
   * @param {Boolean} [options.mask=false] Specifies whether or not to mask
   *     `data`
   * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
   *     key
   * @param {Number} options.opcode The opcode
   * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
   *     modified
   * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
   *     RSV1 bit
   * @return {(Buffer|String)[]} The framed data
   * @public
   */
  static frame(data, options) {
    let mask2;
    let merge = false;
    let offset = 2;
    let skipMasking = false;
    if (options.mask) {
      mask2 = options.maskBuffer || maskBuffer;
      if (options.generateMask) {
        options.generateMask(mask2);
      } else {
        if (randomPoolPointer === RANDOM_POOL_SIZE) {
          if (randomPool === void 0) {
            randomPool = Buffer.alloc(RANDOM_POOL_SIZE);
          }
          randomFillSync(randomPool, 0, RANDOM_POOL_SIZE);
          randomPoolPointer = 0;
        }
        mask2[0] = randomPool[randomPoolPointer++];
        mask2[1] = randomPool[randomPoolPointer++];
        mask2[2] = randomPool[randomPoolPointer++];
        mask2[3] = randomPool[randomPoolPointer++];
      }
      skipMasking = (mask2[0] | mask2[1] | mask2[2] | mask2[3]) === 0;
      offset = 6;
    }
    let dataLength;
    if (typeof data === "string") {
      if ((!options.mask || skipMasking) && options[kByteLength] !== void 0) {
        dataLength = options[kByteLength];
      } else {
        data = Buffer.from(data);
        dataLength = data.length;
      }
    } else {
      dataLength = data.length;
      merge = options.mask && options.readOnly && !skipMasking;
    }
    let payloadLength = dataLength;
    if (dataLength >= 65536) {
      offset += 8;
      payloadLength = 127;
    } else if (dataLength > 125) {
      offset += 2;
      payloadLength = 126;
    }
    const target = Buffer.allocUnsafe(merge ? dataLength + offset : offset);
    target[0] = options.fin ? options.opcode | 128 : options.opcode;
    if (options.rsv1) target[0] |= 64;
    target[1] = payloadLength;
    if (payloadLength === 126) {
      target.writeUInt16BE(dataLength, 2);
    } else if (payloadLength === 127) {
      target[2] = target[3] = 0;
      target.writeUIntBE(dataLength, 4, 6);
    }
    if (!options.mask) return [target, data];
    target[1] |= 128;
    target[offset - 4] = mask2[0];
    target[offset - 3] = mask2[1];
    target[offset - 2] = mask2[2];
    target[offset - 1] = mask2[3];
    if (skipMasking) return [target, data];
    if (merge) {
      applyMask(data, mask2, target, offset, dataLength);
      return [target];
    }
    applyMask(data, mask2, data, 0, dataLength);
    return [target, data];
  }
  /**
   * Sends a close message to the other peer.
   *
   * @param {Number} [code] The status code component of the body
   * @param {(String|Buffer)} [data] The message component of the body
   * @param {Boolean} [mask=false] Specifies whether or not to mask the message
   * @param {Function} [cb] Callback
   * @public
   */
  close(code, data, mask2, cb) {
    let buf;
    if (code === void 0) {
      buf = EMPTY_BUFFER$1;
    } else if (typeof code !== "number" || !isValidStatusCode(code)) {
      throw new TypeError("First argument must be a valid error code number");
    } else if (data === void 0 || !data.length) {
      buf = Buffer.allocUnsafe(2);
      buf.writeUInt16BE(code, 0);
    } else {
      const length = Buffer.byteLength(data);
      if (length > 123) {
        throw new RangeError("The message must not be greater than 123 bytes");
      }
      buf = Buffer.allocUnsafe(2 + length);
      buf.writeUInt16BE(code, 0);
      if (typeof data === "string") {
        buf.write(data, 2);
      } else if (isUint8Array(data)) {
        buf.set(data, 2);
      } else {
        throw new TypeError("Second argument must be a string or a Uint8Array");
      }
    }
    const options = {
      [kByteLength]: buf.length,
      fin: true,
      generateMask: this._generateMask,
      mask: mask2,
      maskBuffer: this._maskBuffer,
      opcode: 8,
      readOnly: false,
      rsv1: false
    };
    if (this._state !== DEFAULT) {
      this.enqueue([this.dispatch, buf, false, options, cb]);
    } else {
      this.sendFrame(Sender2.frame(buf, options), cb);
    }
  }
  /**
   * Sends a ping message to the other peer.
   *
   * @param {*} data The message to send
   * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
   * @param {Function} [cb] Callback
   * @public
   */
  ping(data, mask2, cb) {
    let byteLength;
    let readOnly;
    if (typeof data === "string") {
      byteLength = Buffer.byteLength(data);
      readOnly = false;
    } else if (isBlob$1(data)) {
      byteLength = data.size;
      readOnly = false;
    } else {
      data = toBuffer$1(data);
      byteLength = data.length;
      readOnly = toBuffer$1.readOnly;
    }
    if (byteLength > 125) {
      throw new RangeError("The data size must not be greater than 125 bytes");
    }
    const options = {
      [kByteLength]: byteLength,
      fin: true,
      generateMask: this._generateMask,
      mask: mask2,
      maskBuffer: this._maskBuffer,
      opcode: 9,
      readOnly,
      rsv1: false
    };
    if (isBlob$1(data)) {
      if (this._state !== DEFAULT) {
        this.enqueue([this.getBlobData, data, false, options, cb]);
      } else {
        this.getBlobData(data, false, options, cb);
      }
    } else if (this._state !== DEFAULT) {
      this.enqueue([this.dispatch, data, false, options, cb]);
    } else {
      this.sendFrame(Sender2.frame(data, options), cb);
    }
  }
  /**
   * Sends a pong message to the other peer.
   *
   * @param {*} data The message to send
   * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
   * @param {Function} [cb] Callback
   * @public
   */
  pong(data, mask2, cb) {
    let byteLength;
    let readOnly;
    if (typeof data === "string") {
      byteLength = Buffer.byteLength(data);
      readOnly = false;
    } else if (isBlob$1(data)) {
      byteLength = data.size;
      readOnly = false;
    } else {
      data = toBuffer$1(data);
      byteLength = data.length;
      readOnly = toBuffer$1.readOnly;
    }
    if (byteLength > 125) {
      throw new RangeError("The data size must not be greater than 125 bytes");
    }
    const options = {
      [kByteLength]: byteLength,
      fin: true,
      generateMask: this._generateMask,
      mask: mask2,
      maskBuffer: this._maskBuffer,
      opcode: 10,
      readOnly,
      rsv1: false
    };
    if (isBlob$1(data)) {
      if (this._state !== DEFAULT) {
        this.enqueue([this.getBlobData, data, false, options, cb]);
      } else {
        this.getBlobData(data, false, options, cb);
      }
    } else if (this._state !== DEFAULT) {
      this.enqueue([this.dispatch, data, false, options, cb]);
    } else {
      this.sendFrame(Sender2.frame(data, options), cb);
    }
  }
  /**
   * Sends a data message to the other peer.
   *
   * @param {*} data The message to send
   * @param {Object} options Options object
   * @param {Boolean} [options.binary=false] Specifies whether `data` is binary
   *     or text
   * @param {Boolean} [options.compress=false] Specifies whether or not to
   *     compress `data`
   * @param {Boolean} [options.fin=false] Specifies whether the fragment is the
   *     last one
   * @param {Boolean} [options.mask=false] Specifies whether or not to mask
   *     `data`
   * @param {Function} [cb] Callback
   * @public
   */
  send(data, options, cb) {
    const perMessageDeflate = this._extensions[PerMessageDeflate$1.extensionName];
    let opcode = options.binary ? 2 : 1;
    let rsv1 = options.compress;
    let byteLength;
    let readOnly;
    if (typeof data === "string") {
      byteLength = Buffer.byteLength(data);
      readOnly = false;
    } else if (isBlob$1(data)) {
      byteLength = data.size;
      readOnly = false;
    } else {
      data = toBuffer$1(data);
      byteLength = data.length;
      readOnly = toBuffer$1.readOnly;
    }
    if (this._firstFragment) {
      this._firstFragment = false;
      if (rsv1 && perMessageDeflate && perMessageDeflate.params[perMessageDeflate._isServer ? "server_no_context_takeover" : "client_no_context_takeover"]) {
        rsv1 = byteLength >= perMessageDeflate._threshold;
      }
      this._compress = rsv1;
    } else {
      rsv1 = false;
      opcode = 0;
    }
    if (options.fin) this._firstFragment = true;
    const opts = {
      [kByteLength]: byteLength,
      fin: options.fin,
      generateMask: this._generateMask,
      mask: options.mask,
      maskBuffer: this._maskBuffer,
      opcode,
      readOnly,
      rsv1
    };
    if (isBlob$1(data)) {
      if (this._state !== DEFAULT) {
        this.enqueue([this.getBlobData, data, this._compress, opts, cb]);
      } else {
        this.getBlobData(data, this._compress, opts, cb);
      }
    } else if (this._state !== DEFAULT) {
      this.enqueue([this.dispatch, data, this._compress, opts, cb]);
    } else {
      this.dispatch(data, this._compress, opts, cb);
    }
  }
  /**
   * Gets the contents of a blob as binary data.
   *
   * @param {Blob} blob The blob
   * @param {Boolean} [compress=false] Specifies whether or not to compress
   *     the data
   * @param {Object} options Options object
   * @param {Boolean} [options.fin=false] Specifies whether or not to set the
   *     FIN bit
   * @param {Function} [options.generateMask] The function used to generate the
   *     masking key
   * @param {Boolean} [options.mask=false] Specifies whether or not to mask
   *     `data`
   * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
   *     key
   * @param {Number} options.opcode The opcode
   * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
   *     modified
   * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
   *     RSV1 bit
   * @param {Function} [cb] Callback
   * @private
   */
  getBlobData(blob, compress, options, cb) {
    this._bufferedBytes += options[kByteLength];
    this._state = GET_BLOB_DATA;
    blob.arrayBuffer().then((arrayBuffer) => {
      if (this._socket.destroyed) {
        const err = new Error(
          "The socket was closed while the blob was being read"
        );
        process.nextTick(callCallbacks, this, err, cb);
        return;
      }
      this._bufferedBytes -= options[kByteLength];
      const data = toBuffer$1(arrayBuffer);
      if (!compress) {
        this._state = DEFAULT;
        this.sendFrame(Sender2.frame(data, options), cb);
        this.dequeue();
      } else {
        this.dispatch(data, compress, options, cb);
      }
    }).catch((err) => {
      process.nextTick(onError, this, err, cb);
    });
  }
  /**
   * Dispatches a message.
   *
   * @param {(Buffer|String)} data The message to send
   * @param {Boolean} [compress=false] Specifies whether or not to compress
   *     `data`
   * @param {Object} options Options object
   * @param {Boolean} [options.fin=false] Specifies whether or not to set the
   *     FIN bit
   * @param {Function} [options.generateMask] The function used to generate the
   *     masking key
   * @param {Boolean} [options.mask=false] Specifies whether or not to mask
   *     `data`
   * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
   *     key
   * @param {Number} options.opcode The opcode
   * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
   *     modified
   * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
   *     RSV1 bit
   * @param {Function} [cb] Callback
   * @private
   */
  dispatch(data, compress, options, cb) {
    if (!compress) {
      this.sendFrame(Sender2.frame(data, options), cb);
      return;
    }
    const perMessageDeflate = this._extensions[PerMessageDeflate$1.extensionName];
    this._bufferedBytes += options[kByteLength];
    this._state = DEFLATING;
    perMessageDeflate.compress(data, options.fin, (_, buf) => {
      if (this._socket.destroyed) {
        const err = new Error(
          "The socket was closed while data was being compressed"
        );
        callCallbacks(this, err, cb);
        return;
      }
      this._bufferedBytes -= options[kByteLength];
      this._state = DEFAULT;
      options.readOnly = false;
      this.sendFrame(Sender2.frame(buf, options), cb);
      this.dequeue();
    });
  }
  /**
   * Executes queued send operations.
   *
   * @private
   */
  dequeue() {
    while (this._state === DEFAULT && this._queue.length) {
      const params = this._queue.shift();
      this._bufferedBytes -= params[3][kByteLength];
      Reflect.apply(params[0], this, params.slice(1));
    }
  }
  /**
   * Enqueues a send operation.
   *
   * @param {Array} params Send operation parameters.
   * @private
   */
  enqueue(params) {
    this._bufferedBytes += params[3][kByteLength];
    this._queue.push(params);
  }
  /**
   * Sends a frame.
   *
   * @param {(Buffer | String)[]} list The frame to send
   * @param {Function} [cb] Callback
   * @private
   */
  sendFrame(list, cb) {
    if (list.length === 2) {
      this._socket.cork();
      this._socket.write(list[0]);
      this._socket.write(list[1], cb);
      this._socket.uncork();
    } else {
      this._socket.write(list[0], cb);
    }
  }
};
var sender = Sender$1;
function callCallbacks(sender2, err, cb) {
  if (typeof cb === "function") cb(err);
  for (let i = 0; i < sender2._queue.length; i++) {
    const params = sender2._queue[i];
    const callback = params[params.length - 1];
    if (typeof callback === "function") callback(err);
  }
}
function onError(sender2, err, cb) {
  callCallbacks(sender2, err, cb);
  sender2.onerror(err);
}
const { kForOnEventAttribute: kForOnEventAttribute$1, kListener: kListener$1 } = constants;
const kCode = Symbol("kCode");
const kData = Symbol("kData");
const kError = Symbol("kError");
const kMessage = Symbol("kMessage");
const kReason = Symbol("kReason");
const kTarget = Symbol("kTarget");
const kType = Symbol("kType");
const kWasClean = Symbol("kWasClean");
class Event2 {
  /**
   * Create a new `Event`.
   *
   * @param {String} type The name of the event
   * @throws {TypeError} If the `type` argument is not specified
   */
  constructor(type) {
    this[kTarget] = null;
    this[kType] = type;
  }
  /**
   * @type {*}
   */
  get target() {
    return this[kTarget];
  }
  /**
   * @type {String}
   */
  get type() {
    return this[kType];
  }
}
Object.defineProperty(Event2.prototype, "target", { enumerable: true });
Object.defineProperty(Event2.prototype, "type", { enumerable: true });
class CloseEvent2 extends Event2 {
  /**
   * Create a new `CloseEvent`.
   *
   * @param {String} type The name of the event
   * @param {Object} [options] A dictionary object that allows for setting
   *     attributes via object members of the same name
   * @param {Number} [options.code=0] The status code explaining why the
   *     connection was closed
   * @param {String} [options.reason=''] A human-readable string explaining why
   *     the connection was closed
   * @param {Boolean} [options.wasClean=false] Indicates whether or not the
   *     connection was cleanly closed
   */
  constructor(type, options = {}) {
    super(type);
    this[kCode] = options.code === void 0 ? 0 : options.code;
    this[kReason] = options.reason === void 0 ? "" : options.reason;
    this[kWasClean] = options.wasClean === void 0 ? false : options.wasClean;
  }
  /**
   * @type {Number}
   */
  get code() {
    return this[kCode];
  }
  /**
   * @type {String}
   */
  get reason() {
    return this[kReason];
  }
  /**
   * @type {Boolean}
   */
  get wasClean() {
    return this[kWasClean];
  }
}
Object.defineProperty(CloseEvent2.prototype, "code", { enumerable: true });
Object.defineProperty(CloseEvent2.prototype, "reason", { enumerable: true });
Object.defineProperty(CloseEvent2.prototype, "wasClean", { enumerable: true });
class ErrorEvent2 extends Event2 {
  /**
   * Create a new `ErrorEvent`.
   *
   * @param {String} type The name of the event
   * @param {Object} [options] A dictionary object that allows for setting
   *     attributes via object members of the same name
   * @param {*} [options.error=null] The error that generated this event
   * @param {String} [options.message=''] The error message
   */
  constructor(type, options = {}) {
    super(type);
    this[kError] = options.error === void 0 ? null : options.error;
    this[kMessage] = options.message === void 0 ? "" : options.message;
  }
  /**
   * @type {*}
   */
  get error() {
    return this[kError];
  }
  /**
   * @type {String}
   */
  get message() {
    return this[kMessage];
  }
}
Object.defineProperty(ErrorEvent2.prototype, "error", { enumerable: true });
Object.defineProperty(ErrorEvent2.prototype, "message", { enumerable: true });
class MessageEvent2 extends Event2 {
  /**
   * Create a new `MessageEvent`.
   *
   * @param {String} type The name of the event
   * @param {Object} [options] A dictionary object that allows for setting
   *     attributes via object members of the same name
   * @param {*} [options.data=null] The message content
   */
  constructor(type, options = {}) {
    super(type);
    this[kData] = options.data === void 0 ? null : options.data;
  }
  /**
   * @type {*}
   */
  get data() {
    return this[kData];
  }
}
Object.defineProperty(MessageEvent2.prototype, "data", { enumerable: true });
const EventTarget = {
  /**
   * Register an event listener.
   *
   * @param {String} type A string representing the event type to listen for
   * @param {(Function|Object)} handler The listener to add
   * @param {Object} [options] An options object specifies characteristics about
   *     the event listener
   * @param {Boolean} [options.once=false] A `Boolean` indicating that the
   *     listener should be invoked at most once after being added. If `true`,
   *     the listener would be automatically removed when invoked.
   * @public
   */
  addEventListener(type, handler, options = {}) {
    for (const listener of this.listeners(type)) {
      if (!options[kForOnEventAttribute$1] && listener[kListener$1] === handler && !listener[kForOnEventAttribute$1]) {
        return;
      }
    }
    let wrapper;
    if (type === "message") {
      wrapper = function onMessage(data, isBinary) {
        const event = new MessageEvent2("message", {
          data: isBinary ? data : data.toString()
        });
        event[kTarget] = this;
        callListener(handler, this, event);
      };
    } else if (type === "close") {
      wrapper = function onClose(code, message) {
        const event = new CloseEvent2("close", {
          code,
          reason: message.toString(),
          wasClean: this._closeFrameReceived && this._closeFrameSent
        });
        event[kTarget] = this;
        callListener(handler, this, event);
      };
    } else if (type === "error") {
      wrapper = function onError2(error) {
        const event = new ErrorEvent2("error", {
          error,
          message: error.message
        });
        event[kTarget] = this;
        callListener(handler, this, event);
      };
    } else if (type === "open") {
      wrapper = function onOpen() {
        const event = new Event2("open");
        event[kTarget] = this;
        callListener(handler, this, event);
      };
    } else {
      return;
    }
    wrapper[kForOnEventAttribute$1] = !!options[kForOnEventAttribute$1];
    wrapper[kListener$1] = handler;
    if (options.once) {
      this.once(type, wrapper);
    } else {
      this.on(type, wrapper);
    }
  },
  /**
   * Remove an event listener.
   *
   * @param {String} type A string representing the event type to remove
   * @param {(Function|Object)} handler The listener to remove
   * @public
   */
  removeEventListener(type, handler) {
    for (const listener of this.listeners(type)) {
      if (listener[kListener$1] === handler && !listener[kForOnEventAttribute$1]) {
        this.removeListener(type, listener);
        break;
      }
    }
  }
};
var eventTarget = {
  EventTarget
};
function callListener(listener, thisArg, event) {
  if (typeof listener === "object" && listener.handleEvent) {
    listener.handleEvent.call(listener, event);
  } else {
    listener.call(thisArg, event);
  }
}
const { tokenChars: tokenChars$1 } = validationExports;
function push(dest, name, elem) {
  if (dest[name] === void 0) dest[name] = [elem];
  else dest[name].push(elem);
}
function parse$1(header) {
  const offers = /* @__PURE__ */ Object.create(null);
  let params = /* @__PURE__ */ Object.create(null);
  let mustUnescape = false;
  let isEscaping = false;
  let inQuotes = false;
  let extensionName;
  let paramName;
  let start = -1;
  let code = -1;
  let end = -1;
  let i = 0;
  for (; i < header.length; i++) {
    code = header.charCodeAt(i);
    if (extensionName === void 0) {
      if (end === -1 && tokenChars$1[code] === 1) {
        if (start === -1) start = i;
      } else if (i !== 0 && (code === 32 || code === 9)) {
        if (end === -1 && start !== -1) end = i;
      } else if (code === 59 || code === 44) {
        if (start === -1) {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
        if (end === -1) end = i;
        const name = header.slice(start, end);
        if (code === 44) {
          push(offers, name, params);
          params = /* @__PURE__ */ Object.create(null);
        } else {
          extensionName = name;
        }
        start = end = -1;
      } else {
        throw new SyntaxError(`Unexpected character at index ${i}`);
      }
    } else if (paramName === void 0) {
      if (end === -1 && tokenChars$1[code] === 1) {
        if (start === -1) start = i;
      } else if (code === 32 || code === 9) {
        if (end === -1 && start !== -1) end = i;
      } else if (code === 59 || code === 44) {
        if (start === -1) {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
        if (end === -1) end = i;
        push(params, header.slice(start, end), true);
        if (code === 44) {
          push(offers, extensionName, params);
          params = /* @__PURE__ */ Object.create(null);
          extensionName = void 0;
        }
        start = end = -1;
      } else if (code === 61 && start !== -1 && end === -1) {
        paramName = header.slice(start, i);
        start = end = -1;
      } else {
        throw new SyntaxError(`Unexpected character at index ${i}`);
      }
    } else {
      if (isEscaping) {
        if (tokenChars$1[code] !== 1) {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
        if (start === -1) start = i;
        else if (!mustUnescape) mustUnescape = true;
        isEscaping = false;
      } else if (inQuotes) {
        if (tokenChars$1[code] === 1) {
          if (start === -1) start = i;
        } else if (code === 34 && start !== -1) {
          inQuotes = false;
          end = i;
        } else if (code === 92) {
          isEscaping = true;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      } else if (code === 34 && header.charCodeAt(i - 1) === 61) {
        inQuotes = true;
      } else if (end === -1 && tokenChars$1[code] === 1) {
        if (start === -1) start = i;
      } else if (start !== -1 && (code === 32 || code === 9)) {
        if (end === -1) end = i;
      } else if (code === 59 || code === 44) {
        if (start === -1) {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
        if (end === -1) end = i;
        let value = header.slice(start, end);
        if (mustUnescape) {
          value = value.replace(/\\/g, "");
          mustUnescape = false;
        }
        push(params, paramName, value);
        if (code === 44) {
          push(offers, extensionName, params);
          params = /* @__PURE__ */ Object.create(null);
          extensionName = void 0;
        }
        paramName = void 0;
        start = end = -1;
      } else {
        throw new SyntaxError(`Unexpected character at index ${i}`);
      }
    }
  }
  if (start === -1 || inQuotes || code === 32 || code === 9) {
    throw new SyntaxError("Unexpected end of input");
  }
  if (end === -1) end = i;
  const token = header.slice(start, end);
  if (extensionName === void 0) {
    push(offers, token, params);
  } else {
    if (paramName === void 0) {
      push(params, token, true);
    } else if (mustUnescape) {
      push(params, paramName, token.replace(/\\/g, ""));
    } else {
      push(params, paramName, token);
    }
    push(offers, extensionName, params);
  }
  return offers;
}
function format$1(extensions) {
  return Object.keys(extensions).map((extension2) => {
    let configurations = extensions[extension2];
    if (!Array.isArray(configurations)) configurations = [configurations];
    return configurations.map((params) => {
      return [extension2].concat(
        Object.keys(params).map((k) => {
          let values = params[k];
          if (!Array.isArray(values)) values = [values];
          return values.map((v) => v === true ? k : `${k}=${v}`).join("; ");
        })
      ).join("; ");
    }).join(", ");
  }).join(", ");
}
var extension = { format: format$1, parse: parse$1 };
const EventEmitter = require$$0$3;
const https = require$$1$1;
const http = require$$2$1;
const net = require$$3;
const tls = require$$4;
const { randomBytes, createHash: createHash$1 } = require$$1;
const { Duplex: Duplex$2, Readable } = require$$0$2;
const { URL } = require$$7;
const PerMessageDeflate3 = permessageDeflate;
const Receiver3 = receiver;
const Sender3 = sender;
const { isBlob } = validationExports;
const {
  BINARY_TYPES,
  CLOSE_TIMEOUT: CLOSE_TIMEOUT$1,
  EMPTY_BUFFER,
  GUID: GUID$1,
  kForOnEventAttribute,
  kListener,
  kStatusCode,
  kWebSocket: kWebSocket$1,
  NOOP
} = constants;
const {
  EventTarget: { addEventListener, removeEventListener }
} = eventTarget;
const { format, parse } = extension;
const { toBuffer } = bufferUtilExports;
const kAborted = Symbol("kAborted");
const protocolVersions = [8, 13];
const readyStates = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
const subprotocolRegex = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
class WebSocket2 extends EventEmitter {
  /**
   * Create a new `WebSocket`.
   *
   * @param {(String|URL)} address The URL to which to connect
   * @param {(String|String[])} [protocols] The subprotocols
   * @param {Object} [options] Connection options
   */
  constructor(address, protocols, options) {
    super();
    this._binaryType = BINARY_TYPES[0];
    this._closeCode = 1006;
    this._closeFrameReceived = false;
    this._closeFrameSent = false;
    this._closeMessage = EMPTY_BUFFER;
    this._closeTimer = null;
    this._errorEmitted = false;
    this._extensions = {};
    this._paused = false;
    this._protocol = "";
    this._readyState = WebSocket2.CONNECTING;
    this._receiver = null;
    this._sender = null;
    this._socket = null;
    if (address !== null) {
      this._bufferedAmount = 0;
      this._isServer = false;
      this._redirects = 0;
      if (protocols === void 0) {
        protocols = [];
      } else if (!Array.isArray(protocols)) {
        if (typeof protocols === "object" && protocols !== null) {
          options = protocols;
          protocols = [];
        } else {
          protocols = [protocols];
        }
      }
      initAsClient(this, address, protocols, options);
    } else {
      this._autoPong = options.autoPong;
      this._closeTimeout = options.closeTimeout;
      this._isServer = true;
    }
  }
  /**
   * For historical reasons, the custom "nodebuffer" type is used by the default
   * instead of "blob".
   *
   * @type {String}
   */
  get binaryType() {
    return this._binaryType;
  }
  set binaryType(type) {
    if (!BINARY_TYPES.includes(type)) return;
    this._binaryType = type;
    if (this._receiver) this._receiver._binaryType = type;
  }
  /**
   * @type {Number}
   */
  get bufferedAmount() {
    if (!this._socket) return this._bufferedAmount;
    return this._socket._writableState.length + this._sender._bufferedBytes;
  }
  /**
   * @type {String}
   */
  get extensions() {
    return Object.keys(this._extensions).join();
  }
  /**
   * @type {Boolean}
   */
  get isPaused() {
    return this._paused;
  }
  /**
   * @type {Function}
   */
  /* istanbul ignore next */
  get onclose() {
    return null;
  }
  /**
   * @type {Function}
   */
  /* istanbul ignore next */
  get onerror() {
    return null;
  }
  /**
   * @type {Function}
   */
  /* istanbul ignore next */
  get onopen() {
    return null;
  }
  /**
   * @type {Function}
   */
  /* istanbul ignore next */
  get onmessage() {
    return null;
  }
  /**
   * @type {String}
   */
  get protocol() {
    return this._protocol;
  }
  /**
   * @type {Number}
   */
  get readyState() {
    return this._readyState;
  }
  /**
   * @type {String}
   */
  get url() {
    return this._url;
  }
  /**
   * Set up the socket and the internal resources.
   *
   * @param {Duplex} socket The network socket between the server and client
   * @param {Buffer} head The first packet of the upgraded stream
   * @param {Object} options Options object
   * @param {Boolean} [options.allowSynchronousEvents=false] Specifies whether
   *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
   *     multiple times in the same tick
   * @param {Function} [options.generateMask] The function used to generate the
   *     masking key
   * @param {Number} [options.maxBufferedChunks=0] The maximum number of
   *     buffered data chunks
   * @param {Number} [options.maxFragments=0] The maximum number of message
   *     fragments
   * @param {Number} [options.maxPayload=0] The maximum allowed message size
   * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
   *     not to skip UTF-8 validation for text and close messages
   * @private
   */
  setSocket(socket, head, options) {
    const receiver2 = new Receiver3({
      allowSynchronousEvents: options.allowSynchronousEvents,
      binaryType: this.binaryType,
      extensions: this._extensions,
      isServer: this._isServer,
      maxBufferedChunks: options.maxBufferedChunks,
      maxFragments: options.maxFragments,
      maxPayload: options.maxPayload,
      skipUTF8Validation: options.skipUTF8Validation
    });
    const sender2 = new Sender3(socket, this._extensions, options.generateMask);
    this._receiver = receiver2;
    this._sender = sender2;
    this._socket = socket;
    receiver2[kWebSocket$1] = this;
    sender2[kWebSocket$1] = this;
    socket[kWebSocket$1] = this;
    receiver2.on("conclude", receiverOnConclude);
    receiver2.on("drain", receiverOnDrain);
    receiver2.on("error", receiverOnError);
    receiver2.on("message", receiverOnMessage);
    receiver2.on("ping", receiverOnPing);
    receiver2.on("pong", receiverOnPong);
    sender2.onerror = senderOnError;
    if (socket.setTimeout) socket.setTimeout(0);
    if (socket.setNoDelay) socket.setNoDelay();
    if (head.length > 0) socket.unshift(head);
    socket.on("close", socketOnClose);
    socket.on("data", socketOnData);
    socket.on("end", socketOnEnd);
    socket.on("error", socketOnError);
    this._readyState = WebSocket2.OPEN;
    this.emit("open");
  }
  /**
   * Emit the `'close'` event.
   *
   * @private
   */
  emitClose() {
    if (!this._socket) {
      this._readyState = WebSocket2.CLOSED;
      this.emit("close", this._closeCode, this._closeMessage);
      return;
    }
    if (this._extensions[PerMessageDeflate3.extensionName]) {
      this._extensions[PerMessageDeflate3.extensionName].cleanup();
    }
    this._receiver.removeAllListeners();
    this._readyState = WebSocket2.CLOSED;
    this.emit("close", this._closeCode, this._closeMessage);
  }
  /**
   * Start a closing handshake.
   *
   *          +----------+   +-----------+   +----------+
   *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
   *    |     +----------+   +-----------+   +----------+     |
   *          +----------+   +-----------+         |
   * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
   *          +----------+   +-----------+   |
   *    |           |                        |   +---+        |
   *                +------------------------+-->|fin| - - - -
   *    |         +---+                      |   +---+
   *     - - - - -|fin|<---------------------+
   *              +---+
   *
   * @param {Number} [code] Status code explaining why the connection is closing
   * @param {(String|Buffer)} [data] The reason why the connection is
   *     closing
   * @public
   */
  close(code, data) {
    if (this.readyState === WebSocket2.CLOSED) return;
    if (this.readyState === WebSocket2.CONNECTING) {
      const msg = "WebSocket was closed before the connection was established";
      abortHandshake(this, this._req, msg);
      return;
    }
    if (this.readyState === WebSocket2.CLOSING) {
      if (this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted)) {
        this._socket.end();
      }
      return;
    }
    this._readyState = WebSocket2.CLOSING;
    this._sender.close(code, data, !this._isServer, (err) => {
      if (err) return;
      this._closeFrameSent = true;
      if (this._closeFrameReceived || this._receiver._writableState.errorEmitted) {
        this._socket.end();
      }
    });
    setCloseTimer(this);
  }
  /**
   * Pause the socket.
   *
   * @public
   */
  pause() {
    if (this.readyState === WebSocket2.CONNECTING || this.readyState === WebSocket2.CLOSED) {
      return;
    }
    this._paused = true;
    this._socket.pause();
  }
  /**
   * Send a ping.
   *
   * @param {*} [data] The data to send
   * @param {Boolean} [mask] Indicates whether or not to mask `data`
   * @param {Function} [cb] Callback which is executed when the ping is sent
   * @public
   */
  ping(data, mask2, cb) {
    if (this.readyState === WebSocket2.CONNECTING) {
      throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
    }
    if (typeof data === "function") {
      cb = data;
      data = mask2 = void 0;
    } else if (typeof mask2 === "function") {
      cb = mask2;
      mask2 = void 0;
    }
    if (typeof data === "number") data = data.toString();
    if (this.readyState !== WebSocket2.OPEN) {
      sendAfterClose(this, data, cb);
      return;
    }
    if (mask2 === void 0) mask2 = !this._isServer;
    this._sender.ping(data || EMPTY_BUFFER, mask2, cb);
  }
  /**
   * Send a pong.
   *
   * @param {*} [data] The data to send
   * @param {Boolean} [mask] Indicates whether or not to mask `data`
   * @param {Function} [cb] Callback which is executed when the pong is sent
   * @public
   */
  pong(data, mask2, cb) {
    if (this.readyState === WebSocket2.CONNECTING) {
      throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
    }
    if (typeof data === "function") {
      cb = data;
      data = mask2 = void 0;
    } else if (typeof mask2 === "function") {
      cb = mask2;
      mask2 = void 0;
    }
    if (typeof data === "number") data = data.toString();
    if (this.readyState !== WebSocket2.OPEN) {
      sendAfterClose(this, data, cb);
      return;
    }
    if (mask2 === void 0) mask2 = !this._isServer;
    this._sender.pong(data || EMPTY_BUFFER, mask2, cb);
  }
  /**
   * Resume the socket.
   *
   * @public
   */
  resume() {
    if (this.readyState === WebSocket2.CONNECTING || this.readyState === WebSocket2.CLOSED) {
      return;
    }
    this._paused = false;
    if (!this._receiver._writableState.needDrain) this._socket.resume();
  }
  /**
   * Send a data message.
   *
   * @param {*} data The message to send
   * @param {Object} [options] Options object
   * @param {Boolean} [options.binary] Specifies whether `data` is binary or
   *     text
   * @param {Boolean} [options.compress] Specifies whether or not to compress
   *     `data`
   * @param {Boolean} [options.fin=true] Specifies whether the fragment is the
   *     last one
   * @param {Boolean} [options.mask] Specifies whether or not to mask `data`
   * @param {Function} [cb] Callback which is executed when data is written out
   * @public
   */
  send(data, options, cb) {
    if (this.readyState === WebSocket2.CONNECTING) {
      throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
    }
    if (typeof options === "function") {
      cb = options;
      options = {};
    }
    if (typeof data === "number") data = data.toString();
    if (this.readyState !== WebSocket2.OPEN) {
      sendAfterClose(this, data, cb);
      return;
    }
    const opts = {
      binary: typeof data !== "string",
      mask: !this._isServer,
      compress: true,
      fin: true,
      ...options
    };
    if (!this._extensions[PerMessageDeflate3.extensionName]) {
      opts.compress = false;
    }
    this._sender.send(data || EMPTY_BUFFER, opts, cb);
  }
  /**
   * Forcibly close the connection.
   *
   * @public
   */
  terminate() {
    if (this.readyState === WebSocket2.CLOSED) return;
    if (this.readyState === WebSocket2.CONNECTING) {
      const msg = "WebSocket was closed before the connection was established";
      abortHandshake(this, this._req, msg);
      return;
    }
    if (this._socket) {
      this._readyState = WebSocket2.CLOSING;
      this._socket.destroy();
    }
  }
}
Object.defineProperty(WebSocket2, "CONNECTING", {
  enumerable: true,
  value: readyStates.indexOf("CONNECTING")
});
Object.defineProperty(WebSocket2.prototype, "CONNECTING", {
  enumerable: true,
  value: readyStates.indexOf("CONNECTING")
});
Object.defineProperty(WebSocket2, "OPEN", {
  enumerable: true,
  value: readyStates.indexOf("OPEN")
});
Object.defineProperty(WebSocket2.prototype, "OPEN", {
  enumerable: true,
  value: readyStates.indexOf("OPEN")
});
Object.defineProperty(WebSocket2, "CLOSING", {
  enumerable: true,
  value: readyStates.indexOf("CLOSING")
});
Object.defineProperty(WebSocket2.prototype, "CLOSING", {
  enumerable: true,
  value: readyStates.indexOf("CLOSING")
});
Object.defineProperty(WebSocket2, "CLOSED", {
  enumerable: true,
  value: readyStates.indexOf("CLOSED")
});
Object.defineProperty(WebSocket2.prototype, "CLOSED", {
  enumerable: true,
  value: readyStates.indexOf("CLOSED")
});
[
  "binaryType",
  "bufferedAmount",
  "extensions",
  "isPaused",
  "protocol",
  "readyState",
  "url"
].forEach((property) => {
  Object.defineProperty(WebSocket2.prototype, property, { enumerable: true });
});
["open", "error", "close", "message"].forEach((method) => {
  Object.defineProperty(WebSocket2.prototype, `on${method}`, {
    enumerable: true,
    get() {
      for (const listener of this.listeners(method)) {
        if (listener[kForOnEventAttribute]) return listener[kListener];
      }
      return null;
    },
    set(handler) {
      for (const listener of this.listeners(method)) {
        if (listener[kForOnEventAttribute]) {
          this.removeListener(method, listener);
          break;
        }
      }
      if (typeof handler !== "function") return;
      this.addEventListener(method, handler, {
        [kForOnEventAttribute]: true
      });
    }
  });
});
WebSocket2.prototype.addEventListener = addEventListener;
WebSocket2.prototype.removeEventListener = removeEventListener;
var websocket = WebSocket2;
function initAsClient(websocket2, address, protocols, options) {
  const opts = {
    allowSynchronousEvents: true,
    autoPong: true,
    closeTimeout: CLOSE_TIMEOUT$1,
    protocolVersion: protocolVersions[1],
    maxBufferedChunks: 256 * 1024,
    maxFragments: 16 * 1024,
    maxPayload: 100 * 1024 * 1024,
    skipUTF8Validation: false,
    perMessageDeflate: true,
    followRedirects: false,
    maxRedirects: 10,
    ...options,
    socketPath: void 0,
    hostname: void 0,
    protocol: void 0,
    timeout: void 0,
    method: "GET",
    host: void 0,
    path: void 0,
    port: void 0
  };
  websocket2._autoPong = opts.autoPong;
  websocket2._closeTimeout = opts.closeTimeout;
  if (!protocolVersions.includes(opts.protocolVersion)) {
    throw new RangeError(
      `Unsupported protocol version: ${opts.protocolVersion} (supported versions: ${protocolVersions.join(", ")})`
    );
  }
  let parsedUrl;
  if (address instanceof URL) {
    parsedUrl = address;
  } else {
    try {
      parsedUrl = new URL(address);
    } catch {
      throw new SyntaxError(`Invalid URL: ${address}`);
    }
  }
  if (parsedUrl.protocol === "http:") {
    parsedUrl.protocol = "ws:";
  } else if (parsedUrl.protocol === "https:") {
    parsedUrl.protocol = "wss:";
  }
  websocket2._url = parsedUrl.href;
  const isSecure = parsedUrl.protocol === "wss:";
  const isIpcUrl = parsedUrl.protocol === "ws+unix:";
  let invalidUrlMessage;
  if (parsedUrl.protocol !== "ws:" && !isSecure && !isIpcUrl) {
    invalidUrlMessage = `The URL's protocol must be one of "ws:", "wss:", "http:", "https:", or "ws+unix:"`;
  } else if (isIpcUrl && !parsedUrl.pathname) {
    invalidUrlMessage = "The URL's pathname is empty";
  } else if (parsedUrl.hash) {
    invalidUrlMessage = "The URL contains a fragment identifier";
  }
  if (invalidUrlMessage) {
    const err = new SyntaxError(invalidUrlMessage);
    if (websocket2._redirects === 0) {
      throw err;
    } else {
      emitErrorAndClose(websocket2, err);
      return;
    }
  }
  const defaultPort = isSecure ? 443 : 80;
  const key = randomBytes(16).toString("base64");
  const request = isSecure ? https.request : http.request;
  const protocolSet = /* @__PURE__ */ new Set();
  let perMessageDeflate;
  opts.createConnection = opts.createConnection || (isSecure ? tlsConnect : netConnect);
  opts.defaultPort = opts.defaultPort || defaultPort;
  opts.port = parsedUrl.port || defaultPort;
  opts.host = parsedUrl.hostname.startsWith("[") ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
  opts.headers = {
    ...opts.headers,
    "Sec-WebSocket-Version": opts.protocolVersion,
    "Sec-WebSocket-Key": key,
    Connection: "Upgrade",
    Upgrade: "websocket"
  };
  opts.path = parsedUrl.pathname + parsedUrl.search;
  opts.timeout = opts.handshakeTimeout;
  if (opts.perMessageDeflate) {
    perMessageDeflate = new PerMessageDeflate3({
      ...opts.perMessageDeflate,
      isServer: false,
      maxPayload: opts.maxPayload
    });
    opts.headers["Sec-WebSocket-Extensions"] = format({
      [PerMessageDeflate3.extensionName]: perMessageDeflate.offer()
    });
  }
  if (protocols.length) {
    for (const protocol of protocols) {
      if (typeof protocol !== "string" || !subprotocolRegex.test(protocol) || protocolSet.has(protocol)) {
        throw new SyntaxError(
          "An invalid or duplicated subprotocol was specified"
        );
      }
      protocolSet.add(protocol);
    }
    opts.headers["Sec-WebSocket-Protocol"] = protocols.join(",");
  }
  if (opts.origin) {
    if (opts.protocolVersion < 13) {
      opts.headers["Sec-WebSocket-Origin"] = opts.origin;
    } else {
      opts.headers.Origin = opts.origin;
    }
  }
  if (parsedUrl.username || parsedUrl.password) {
    opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
  }
  if (isIpcUrl) {
    const parts = opts.path.split(":");
    opts.socketPath = parts[0];
    opts.path = parts[1];
  }
  let req;
  if (opts.followRedirects) {
    if (websocket2._redirects === 0) {
      websocket2._originalIpc = isIpcUrl;
      websocket2._originalSecure = isSecure;
      websocket2._originalHostOrSocketPath = isIpcUrl ? opts.socketPath : parsedUrl.host;
      const headers = options && options.headers;
      options = { ...options, headers: {} };
      if (headers) {
        for (const [key2, value] of Object.entries(headers)) {
          options.headers[key2.toLowerCase()] = value;
        }
      }
    } else if (websocket2.listenerCount("redirect") === 0) {
      const isSameHost = isIpcUrl ? websocket2._originalIpc ? opts.socketPath === websocket2._originalHostOrSocketPath : false : websocket2._originalIpc ? false : parsedUrl.host === websocket2._originalHostOrSocketPath;
      if (!isSameHost || websocket2._originalSecure && !isSecure) {
        delete opts.headers.authorization;
        delete opts.headers.cookie;
        if (!isSameHost) delete opts.headers.host;
        opts.auth = void 0;
      }
    }
    if (opts.auth && !options.headers.authorization) {
      options.headers.authorization = "Basic " + Buffer.from(opts.auth).toString("base64");
    }
    req = websocket2._req = request(opts);
    if (websocket2._redirects) {
      websocket2.emit("redirect", websocket2.url, req);
    }
  } else {
    req = websocket2._req = request(opts);
  }
  if (opts.timeout) {
    req.on("timeout", () => {
      abortHandshake(websocket2, req, "Opening handshake has timed out");
    });
  }
  req.on("error", (err) => {
    if (req === null || req[kAborted]) return;
    req = websocket2._req = null;
    emitErrorAndClose(websocket2, err);
  });
  req.on("response", (res) => {
    const location = res.headers.location;
    const statusCode = res.statusCode;
    if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
      if (++websocket2._redirects > opts.maxRedirects) {
        abortHandshake(websocket2, req, "Maximum redirects exceeded");
        return;
      }
      req.abort();
      let addr;
      try {
        addr = new URL(location, address);
      } catch (e) {
        const err = new SyntaxError(`Invalid URL: ${location}`);
        emitErrorAndClose(websocket2, err);
        return;
      }
      initAsClient(websocket2, addr, protocols, options);
    } else if (!websocket2.emit("unexpected-response", req, res)) {
      abortHandshake(
        websocket2,
        req,
        `Unexpected server response: ${res.statusCode}`
      );
    }
  });
  req.on("upgrade", (res, socket, head) => {
    websocket2.emit("upgrade", res);
    if (websocket2.readyState !== WebSocket2.CONNECTING) return;
    req = websocket2._req = null;
    const upgrade2 = res.headers.upgrade;
    if (upgrade2 === void 0 || upgrade2.toLowerCase() !== "websocket") {
      abortHandshake(websocket2, socket, "Invalid Upgrade header");
      return;
    }
    const digest = createHash$1("sha1").update(key + GUID$1).digest("base64");
    if (res.headers["sec-websocket-accept"] !== digest) {
      abortHandshake(websocket2, socket, "Invalid Sec-WebSocket-Accept header");
      return;
    }
    const serverProt = res.headers["sec-websocket-protocol"];
    let protError;
    if (serverProt !== void 0) {
      if (!protocolSet.size) {
        protError = "Server sent a subprotocol but none was requested";
      } else if (!protocolSet.has(serverProt)) {
        protError = "Server sent an invalid subprotocol";
      }
    } else if (protocolSet.size) {
      protError = "Server sent no subprotocol";
    }
    if (protError) {
      abortHandshake(websocket2, socket, protError);
      return;
    }
    if (serverProt) websocket2._protocol = serverProt;
    const secWebSocketExtensions = res.headers["sec-websocket-extensions"];
    if (secWebSocketExtensions !== void 0) {
      if (!perMessageDeflate) {
        const message = "Server sent a Sec-WebSocket-Extensions header but no extension was requested";
        abortHandshake(websocket2, socket, message);
        return;
      }
      let extensions;
      try {
        extensions = parse(secWebSocketExtensions);
      } catch (err) {
        const message = "Invalid Sec-WebSocket-Extensions header";
        abortHandshake(websocket2, socket, message);
        return;
      }
      const extensionNames = Object.keys(extensions);
      if (extensionNames.length !== 1 || extensionNames[0] !== PerMessageDeflate3.extensionName) {
        const message = "Server indicated an extension that was not requested";
        abortHandshake(websocket2, socket, message);
        return;
      }
      try {
        perMessageDeflate.accept(extensions[PerMessageDeflate3.extensionName]);
      } catch (err) {
        const message = "Invalid Sec-WebSocket-Extensions header";
        abortHandshake(websocket2, socket, message);
        return;
      }
      websocket2._extensions[PerMessageDeflate3.extensionName] = perMessageDeflate;
    }
    websocket2.setSocket(socket, head, {
      allowSynchronousEvents: opts.allowSynchronousEvents,
      generateMask: opts.generateMask,
      maxBufferedChunks: opts.maxBufferedChunks,
      maxFragments: opts.maxFragments,
      maxPayload: opts.maxPayload,
      skipUTF8Validation: opts.skipUTF8Validation
    });
  });
  if (opts.finishRequest) {
    opts.finishRequest(req, websocket2);
  } else {
    req.end();
  }
}
function emitErrorAndClose(websocket2, err) {
  websocket2._readyState = WebSocket2.CLOSING;
  websocket2._errorEmitted = true;
  websocket2.emit("error", err);
  websocket2.emitClose();
}
function netConnect(options) {
  options.path = options.socketPath;
  return net.connect(options);
}
function tlsConnect(options) {
  options.path = void 0;
  if (!options.servername && options.servername !== "") {
    options.servername = net.isIP(options.host) ? "" : options.host;
  }
  return tls.connect(options);
}
function abortHandshake(websocket2, stream, message) {
  websocket2._readyState = WebSocket2.CLOSING;
  const err = new Error(message);
  Error.captureStackTrace(err, abortHandshake);
  if (stream.setHeader) {
    stream[kAborted] = true;
    stream.abort();
    if (stream.socket && !stream.socket.destroyed) {
      stream.socket.destroy();
    }
    process.nextTick(emitErrorAndClose, websocket2, err);
  } else {
    stream.destroy(err);
    stream.once("error", websocket2.emit.bind(websocket2, "error"));
    stream.once("close", websocket2.emitClose.bind(websocket2));
  }
}
function sendAfterClose(websocket2, data, cb) {
  if (data) {
    const length = isBlob(data) ? data.size : toBuffer(data).length;
    if (websocket2._socket) websocket2._sender._bufferedBytes += length;
    else websocket2._bufferedAmount += length;
  }
  if (cb) {
    const err = new Error(
      `WebSocket is not open: readyState ${websocket2.readyState} (${readyStates[websocket2.readyState]})`
    );
    process.nextTick(cb, err);
  }
}
function receiverOnConclude(code, reason) {
  const websocket2 = this[kWebSocket$1];
  websocket2._closeFrameReceived = true;
  websocket2._closeMessage = reason;
  websocket2._closeCode = code;
  if (websocket2._socket[kWebSocket$1] === void 0) return;
  websocket2._socket.removeListener("data", socketOnData);
  process.nextTick(resume, websocket2._socket);
  if (code === 1005) websocket2.close();
  else websocket2.close(code, reason);
}
function receiverOnDrain() {
  const websocket2 = this[kWebSocket$1];
  if (!websocket2.isPaused) websocket2._socket.resume();
}
function receiverOnError(err) {
  const websocket2 = this[kWebSocket$1];
  if (websocket2._socket[kWebSocket$1] !== void 0) {
    websocket2._socket.removeListener("data", socketOnData);
    process.nextTick(resume, websocket2._socket);
    websocket2.close(err[kStatusCode]);
  }
  if (!websocket2._errorEmitted) {
    websocket2._errorEmitted = true;
    websocket2.emit("error", err);
  }
}
function receiverOnFinish() {
  this[kWebSocket$1].emitClose();
}
function receiverOnMessage(data, isBinary) {
  this[kWebSocket$1].emit("message", data, isBinary);
}
function receiverOnPing(data) {
  const websocket2 = this[kWebSocket$1];
  if (websocket2._autoPong) websocket2.pong(data, !this._isServer, NOOP);
  websocket2.emit("ping", data);
}
function receiverOnPong(data) {
  this[kWebSocket$1].emit("pong", data);
}
function resume(stream) {
  stream.resume();
}
function senderOnError(err) {
  const websocket2 = this[kWebSocket$1];
  if (websocket2.readyState === WebSocket2.CLOSED) return;
  if (websocket2.readyState === WebSocket2.OPEN) {
    websocket2._readyState = WebSocket2.CLOSING;
    setCloseTimer(websocket2);
  }
  this._socket.end();
  if (!websocket2._errorEmitted) {
    websocket2._errorEmitted = true;
    websocket2.emit("error", err);
  }
}
function setCloseTimer(websocket2) {
  websocket2._closeTimer = setTimeout(
    websocket2._socket.destroy.bind(websocket2._socket),
    websocket2._closeTimeout
  );
}
function socketOnClose() {
  const websocket2 = this[kWebSocket$1];
  this.removeListener("close", socketOnClose);
  this.removeListener("data", socketOnData);
  this.removeListener("end", socketOnEnd);
  websocket2._readyState = WebSocket2.CLOSING;
  if (!this._readableState.endEmitted && !websocket2._closeFrameReceived && !websocket2._receiver._writableState.errorEmitted && this._readableState.length !== 0) {
    const chunk = this.read(this._readableState.length);
    websocket2._receiver.write(chunk);
  }
  websocket2._receiver.end();
  this[kWebSocket$1] = void 0;
  clearTimeout(websocket2._closeTimer);
  if (websocket2._receiver._writableState.finished || websocket2._receiver._writableState.errorEmitted) {
    websocket2.emitClose();
  } else {
    websocket2._receiver.on("error", receiverOnFinish);
    websocket2._receiver.on("finish", receiverOnFinish);
  }
}
function socketOnData(chunk) {
  if (!this[kWebSocket$1]._receiver.write(chunk)) {
    this.pause();
  }
}
function socketOnEnd() {
  const websocket2 = this[kWebSocket$1];
  websocket2._readyState = WebSocket2.CLOSING;
  websocket2._receiver.end();
  this.end();
}
function socketOnError() {
  const websocket2 = this[kWebSocket$1];
  this.removeListener("error", socketOnError);
  this.on("error", NOOP);
  if (websocket2) {
    websocket2._readyState = WebSocket2.CLOSING;
    this.destroy();
  }
}
const WebSocket$1 = /* @__PURE__ */ getDefaultExportFromCjs(websocket);
const { Duplex: Duplex$1 } = require$$0$2;
const { tokenChars } = validationExports;
const { Duplex } = require$$0$2;
const { createHash } = require$$1;
const { CLOSE_TIMEOUT, GUID, kWebSocket } = constants;
const TAMAÑO_CHUNK = 64 * 1024;
async function* dividirEnChunks(rutaArchivo) {
  const stream = fs.createReadStream(rutaArchivo, { highWaterMark: TAMAÑO_CHUNK });
  for await (const pedazo of stream) {
    yield pedazo;
  }
}
function enviarArchivoAPeer(rutaArchivo, ipDestino, puertoDestino) {
  const nombreArchivo = path.basename(rutaArchivo);
  const tamañoArchivo = fs.statSync(rutaArchivo).size;
  const descripcion = {
    nombre: nombreArchivo,
    tamaño: tamañoArchivo,
    tipo: path.extname(rutaArchivo)
  };
  const socket = new WebSocket$1(`ws://${ipDestino}:${puertoDestino}${RUTA_WEBSOCKET}`);
  socket.on("open", () => {
    socket.send(crearMensajeMetadatos(descripcion));
  });
  socket.on("message", async (mensajeRespuesta) => {
    const respuesta = JSON.parse(mensajeRespuesta.toString());
    if (respuesta.tipo === "respuesta" && respuesta.aceptado) {
      for await (const chunk of dividirEnChunks(rutaArchivo)) {
        socket.send(chunk);
      }
      socket.close();
    } else {
      console.warn("El destino rechazó la transferencia.");
      socket.close();
    }
  });
  socket.on("error", (error) => {
    console.error("Error en el envío:", error.message);
  });
}
const transferenciasActivas = /* @__PURE__ */ new Map();
function iniciarRecepcion(conexion, descripcion) {
  const rutaDestino = path.join(app.getPath("downloads"), descripcion.nombre);
  transferenciasActivas.set(conexion, {
    streamEscritura: fs.createWriteStream(rutaDestino),
    tamañoEsperado: descripcion.tamaño,
    bytesRecibidos: 0,
    nombreArchivo: descripcion.nombre
  });
}
function recibirChunk(conexion, chunk) {
  const estado = transferenciasActivas.get(conexion);
  if (!estado) return false;
  estado.streamEscritura.write(chunk);
  estado.bytesRecibidos += chunk.length;
  const transferenciaCompleta = estado.bytesRecibidos >= estado.tamañoEsperado;
  if (transferenciaCompleta) {
    estado.streamEscritura.end();
    console.log(`Archivo "${estado.nombreArchivo}" completado.`);
    transferenciasActivas.delete(conexion);
  }
  return transferenciaCompleta;
}
function cancelarRecepcion(conexion) {
  const estado = transferenciasActivas.get(conexion);
  if (estado) {
    estado.streamEscritura.end();
    transferenciasActivas.delete(conexion);
  }
}
function generarIdUnico() {
  return randomUUID();
}
const ADJETIVOS = ["Veloz", "Silencioso", "Brillante", "Curioso", "Elegante", "Ágil"];
const SUSTANTIVOS = ["Manzana", "Zorro", "Cometa", "Bosque", "Ola", "Faro"];
function generarNombreDispositivo() {
  const adjetivo = ADJETIVOS[Math.floor(Math.random() * ADJETIVOS.length)];
  const sustantivo = SUSTANTIVOS[Math.floor(Math.random() * SUSTANTIVOS.length)];
  return `${sustantivo} ${adjetivo}`;
}
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
const idPropio = generarIdUnico();
const nombreDispositivo = generarNombreDispositivo();
let ventanaPrincipal = null;
let servicioPublicado = null;
const bonjour = new Bonjour_1();
const dispositivosConocidos = /* @__PURE__ */ new Map();
function crearVentana() {
  ventanaPrincipal = new BrowserWindow({
    width: 900,
    height: 650,
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  ventanaPrincipal.loadURL(process.env.VITE_DEV_SERVER_URL ?? "http://localhost:5173");
}
function iniciarServidorTransferencia() {
  const servidorHttp = createServer();
  const servidorWs = new WebSocketServer$1({ server: servidorHttp, path: RUTA_WEBSOCKET });
  servidorWs.on("connection", (conexion) => {
    console.log("Peer conectado.");
    conexion.on("message", (datos, esBinario) => {
      if (!esBinario) {
        const descripcion = interpretarMensajeMetadatos(datos.toString());
        iniciarRecepcion(conexion, descripcion);
        conexion.send(crearMensajeRespuesta(true));
        return;
      }
      recibirChunk(conexion, datos);
    });
    conexion.on("close", () => {
      cancelarRecepcion(conexion);
    });
  });
  servidorHttp.listen(PUERTO_TRANSFERENCIA);
  console.log(`Servidor de transferencia escuchando en el puerto ${PUERTO_TRANSFERENCIA}`);
}
function activarVisibilidad() {
  servicioPublicado = bonjour.publish({
    name: nombreDispositivo,
    type: TIPO_SERVICIO_BONJOUR,
    port: PUERTO_TRANSFERENCIA,
    txt: { version: "1.0.0", id: idPropio }
  });
  servicioPublicado.on("up", () => {
    console.log(`Anunciado como "${nombreDispositivo}" en la red.`);
  });
  servicioPublicado.on("error", (error) => {
    console.warn("Aviso Bonjour:", error.message);
  });
}
function desactivarVisibilidad() {
  servicioPublicado == null ? void 0 : servicioPublicado.stop(() => console.log("Dejamos de anunciarnos en la red."));
  servicioPublicado = null;
}
function publicarYBuscarDispositivos() {
  activarVisibilidad();
  const buscador = bonjour.find({ type: TIPO_SERVICIO_BONJOUR });
  buscador.on("up", (servicioEncontrado) => {
    var _a;
    if (((_a = servicioEncontrado.txt) == null ? void 0 : _a.id) === idPropio) return;
    const dispositivo = {
      name: servicioEncontrado.name,
      addresses: servicioEncontrado.addresses ?? [],
      port: servicioEncontrado.port
    };
    dispositivosConocidos.set(dispositivo.name, dispositivo);
    ventanaPrincipal == null ? void 0 : ventanaPrincipal.webContents.send("servicio-encontrado", dispositivo);
  });
  buscador.on("down", (servicioPerdido) => {
    dispositivosConocidos.delete(servicioPerdido.name);
    ventanaPrincipal == null ? void 0 : ventanaPrincipal.webContents.send("servicio-perdido", { name: servicioPerdido.name });
  });
  ipcMain.on("buscar-servicios", () => {
    dispositivosConocidos.forEach((dispositivo) => {
      ventanaPrincipal == null ? void 0 : ventanaPrincipal.webContents.send("servicio-encontrado", dispositivo);
    });
  });
  ipcMain.on("cambiar-visibilidad", (_evento, visible) => {
    if (visible) activarVisibilidad();
    else desactivarVisibilidad();
  });
}
ipcMain.on("enviar-archivo", (_evento, datos) => {
  enviarArchivoAPeer(datos.rutaArchivo, datos.ipDestino, datos.puertoDestino);
});
if (process.platform === "linux") {
  app.disableHardwareAcceleration();
}
app.whenReady().then(() => {
  crearVentana();
  iniciarServidorTransferencia();
  publicarYBuscarDispositivos();
});
app.on("window-all-closed", () => {
  bonjour.destroy();
  if (process.platform !== "darwin") app.quit();
});
