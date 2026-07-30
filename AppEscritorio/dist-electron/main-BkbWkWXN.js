var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var _a, _b, _c2, _resolveCache, _d, _id, _uint8Array, _arrayBuffer, _blob, _text, _json, _e, _ws, _pingUnsupportedWarned, _f, _isSecure, _listeningPromise, _listenError, _wait, _g;
import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import require$$0 from "os";
import require$$2 from "events";
import require$$0$1 from "buffer";
import require$$1 from "dgram";
import { createRequire } from "node:module";
import nodeHTTP from "node:http";
import { Readable, PassThrough } from "node:stream";
import { pipeline } from "node:stream/promises";
import nodeHTTPS from "node:https";
import nodeHTTP2 from "node:http2";
import { randomUUID } from "node:crypto";
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var dist$1 = { exports: {} };
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
      let format = buffer.toString();
      let parts = format.split(/=(.+)/);
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
var __importDefault$4 = commonjsGlobal && commonjsGlobal.__importDefault || function(mod) {
  return mod && mod.__esModule ? mod : { "default": mod };
};
Object.defineProperty(service, "__esModule", { value: true });
service.Service = void 0;
const os_1 = __importDefault$4(require$$0);
const dns_txt_1$1 = __importDefault$4(dnsTxt);
const events_1$1 = require$$2;
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
var __importDefault$3 = commonjsGlobal && commonjsGlobal.__importDefault || function(mod) {
  return mod && mod.__esModule ? mod : { "default": mod };
};
Object.defineProperty(registry, "__esModule", { value: true });
registry.Registry = void 0;
const dns_equal_1$2 = __importDefault$3(dnsEqual$1);
const service_1$1 = __importDefault$3(service);
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
    exports2.decode = decode2;
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
    function decode2(buff, offset, length) {
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
  rsshfp.decode = function decode2(buf, offset) {
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
var dgram = require$$1;
var thunky = thunky_1;
var events = require$$2;
var os = require$$0;
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
    var net = networks[names[i]];
    for (var j = 0; j < net.length; j++) {
      var iface = net[j];
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
    var net = networks[names[i]];
    for (var j = 0; j < net.length; j++) {
      var iface = net[j];
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
var __importDefault$2 = commonjsGlobal && commonjsGlobal.__importDefault || function(mod) {
  return mod && mod.__esModule ? mod : { "default": mod };
};
Object.defineProperty(mdnsServer, "__esModule", { value: true });
mdnsServer.Server = void 0;
const multicast_dns_1 = __importDefault$2(multicastDns);
const es6_1 = __importDefault$2(es6);
const dns_equal_1$1 = __importDefault$2(dnsEqual$1);
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
    var set2 = [];
    return (obj) => {
      if (~set2.indexOf(obj))
        return false;
      set2.push(obj);
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
var __importDefault$1 = commonjsGlobal && commonjsGlobal.__importDefault || function(mod) {
  return mod && mod.__esModule ? mod : { "default": mod };
};
Object.defineProperty(browser, "__esModule", { value: true });
browser.Browser = void 0;
const dns_txt_1 = __importDefault$1(dnsTxt);
const dns_equal_1 = __importDefault$1(dnsEqual$1);
const events_1 = require$$2;
const service_types_1 = serviceTypes;
const filter_service_1 = __importDefault$1(filterService);
const filter_txt_1 = __importDefault$1(filterTxt);
const equal_txt_1 = __importDefault$1(equalTxt$1);
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
var __importDefault = commonjsGlobal && commonjsGlobal.__importDefault || function(mod) {
  return mod && mod.__esModule ? mod : { "default": mod };
};
Object.defineProperty(bonjour$1, "__esModule", { value: true });
bonjour$1.Browser = bonjour$1.Service = void 0;
const registry_1 = __importDefault(registry);
const mdns_server_1 = __importDefault(mdnsServer);
const browser_1 = __importDefault(browser);
bonjour$1.Browser = browser_1.default;
const service_1 = __importDefault(service);
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
const bonjour_1 = __importStar(bonjour$1);
class Bonjour2 extends bonjour_1.default {
}
const BonjourConstructor = Bonjour2;
(function(Bonjour_12) {
  Bonjour_12.Bonjour = BonjourConstructor;
  Bonjour_12.Service = bonjour_1.Service;
  Bonjour_12.Browser = bonjour_1.Browser;
})(Bonjour2 || (Bonjour2 = {}));
Object.defineProperty(Bonjour2, "default", {
  enumerable: true,
  value: Bonjour2
});
var Bonjour_1 = dist$1.exports.Bonjour = Bonjour2;
dist$1.exports.Service = bonjour_1.Service;
dist$1.exports.Browser = bonjour_1.Browser;
dist$1.exports.default = Bonjour2;
dist$1.exports = Bonjour2;
var createNode = (part, inert) => {
  const inertMap = (inert == null ? void 0 : inert.length) ? {} : null;
  if (inertMap)
    for (const child of inert)
      inertMap[child.part.charCodeAt(0)] = child;
  return {
    part,
    store: null,
    inert: inertMap,
    params: null,
    wildcardStore: null
  };
};
var cloneNode = (node2, part) => ({
  ...node2,
  part
});
var createParamNode = (name) => ({
  name,
  store: null,
  inert: null
});
var Memoirist = (_a = class {
  constructor(config = {}) {
    __publicField(this, "root", {});
    __publicField(this, "history", []);
    __publicField(this, "deferred", []);
    __publicField(this, "lazyFind", (method, url) => {
      if (!this.config.lazy)
        return this.find;
      this.build();
      return this.find(method, url);
    });
    this.config = config;
    if (config.lazy)
      this.find = this.lazyFind;
    if (config.onParam && !Array.isArray(config.onParam))
      this.config.onParam = [
        this.config.onParam
      ];
  }
  build() {
    if (!this.config.lazy)
      return;
    for (const [method, path2, store] of this.deferred)
      this.add(method, path2, store, { lazy: false, ignoreHistory: true });
    this.deferred = [];
    this.find = (method, url) => {
      const root = this.root[method];
      if (!root)
        return null;
      return matchRoute(
        url,
        url.length,
        root,
        0,
        this.config.onParam
      );
    };
  }
  add(method, path2, store, {
    ignoreError = false,
    ignoreHistory = false,
    lazy = this.config.lazy
  } = {}) {
    if (lazy) {
      this.find = this.lazyFind;
      this.deferred.push([method, path2, store]);
      return store;
    }
    if (typeof path2 !== "string")
      throw new TypeError("Route path must be a string");
    if (path2 === "")
      path2 = "/";
    else if (path2[0] !== "/")
      path2 = `/${path2}`;
    const isWildcard = path2[path2.length - 1] === "*";
    const optionalParams = path2.match(_a.regex.optionalParams);
    if (optionalParams) {
      const originalPath = path2.replaceAll("?", "");
      this.add(method, originalPath, store, {
        ignoreError,
        ignoreHistory,
        lazy
      });
      for (let i = 0; i < optionalParams.length; i++) {
        let newPath = path2.replace(optionalParams[i], "");
        this.add(method, newPath, store, {
          ignoreError: true,
          ignoreHistory,
          lazy
        });
      }
      return store;
    }
    if (optionalParams)
      path2 = path2.replaceAll("?", "");
    if (this.history.find(([m, p, s]) => m === method && p === path2))
      return store;
    if (isWildcard || optionalParams && path2.charCodeAt(path2.length - 1) === 63)
      path2 = path2.slice(0, -1);
    if (!ignoreHistory)
      this.history.push([method, path2, store]);
    const inertParts = path2.split(_a.regex.static);
    const paramParts = path2.match(_a.regex.params) || [];
    if (inertParts[inertParts.length - 1] === "")
      inertParts.pop();
    let node2;
    if (!this.root[method])
      node2 = this.root[method] = createNode("/");
    else
      node2 = this.root[method];
    let paramPartsIndex = 0;
    for (let i = 0; i < inertParts.length; ++i) {
      let part = inertParts[i];
      if (i > 0) {
        const param = paramParts[paramPartsIndex++].slice(1);
        if (node2.params === null)
          node2.params = createParamNode(param);
        else if (node2.params.name !== param) {
          if (ignoreError)
            return store;
          else
            throw new Error(
              `Cannot create route "${path2}" with parameter "${param}" because a route already exists with a different parameter name ("${node2.params.name}") in the same location`
            );
        }
        const params = node2.params;
        if (params.inert === null) {
          node2 = params.inert = createNode(part);
          continue;
        }
        node2 = params.inert;
      }
      for (let j = 0; ; ) {
        if (j === part.length) {
          if (j < node2.part.length) {
            const childNode = cloneNode(node2, node2.part.slice(j));
            Object.assign(node2, createNode(part, [childNode]));
          }
          break;
        }
        if (j === node2.part.length) {
          if (node2.inert === null)
            node2.inert = {};
          const inert = node2.inert[part.charCodeAt(j)];
          if (inert) {
            node2 = inert;
            part = part.slice(j);
            j = 0;
            continue;
          }
          const childNode = createNode(part.slice(j));
          node2.inert[part.charCodeAt(j)] = childNode;
          node2 = childNode;
          break;
        }
        if (part[j] !== node2.part[j]) {
          const existingChild = cloneNode(node2, node2.part.slice(j));
          const newChild = createNode(part.slice(j));
          Object.assign(
            node2,
            createNode(node2.part.slice(0, j), [
              existingChild,
              newChild
            ])
          );
          node2 = newChild;
          break;
        }
        ++j;
      }
    }
    if (paramPartsIndex < paramParts.length) {
      const param = paramParts[paramPartsIndex];
      const name = param.slice(1);
      if (node2.params === null)
        node2.params = createParamNode(name);
      else if (node2.params.name !== name) {
        if (ignoreError)
          return store;
        else
          throw new Error(
            `Cannot create route "${path2}" with parameter "${name}" because a route already exists with a different parameter name ("${node2.params.name}") in the same location`
          );
      }
      if (node2.params.store === null)
        node2.params.store = store;
      return node2.params.store;
    }
    if (isWildcard) {
      if (node2.wildcardStore === null)
        node2.wildcardStore = store;
      return node2.wildcardStore;
    }
    if (node2.store === null)
      node2.store = store;
    return node2.store;
  }
  find(method, url) {
    const root = this.root[method];
    if (!root)
      return null;
    return matchRoute(
      url,
      url.length,
      root,
      0,
      this.config.onParam
    );
  }
}, __publicField(_a, "regex", {
  static: /:.+?(?=\/|$)/,
  params: /:.+?(?=\/|$)/g,
  optionalParams: /(\/:\w+\?)/g
}), _a);
var matchRoute = (url, urlLength, node2, startIndex, onParam) => {
  const part = node2.part;
  const length = part.length;
  const endIndex2 = startIndex + length;
  if (length > 1) {
    if (endIndex2 > urlLength)
      return null;
    if (length < 15) {
      for (let i = 1, j = startIndex + 1; i < length; ++i, ++j)
        if (part.charCodeAt(i) !== url.charCodeAt(j))
          return null;
    } else if (url.slice(startIndex, endIndex2) !== part)
      return null;
  }
  if (endIndex2 === urlLength) {
    if (node2.store !== null)
      return {
        store: node2.store,
        params: {}
      };
    if (node2.wildcardStore !== null)
      return {
        store: node2.wildcardStore,
        params: { "*": "" }
      };
    return null;
  }
  if (node2.inert !== null) {
    const inert = node2.inert[url.charCodeAt(endIndex2)];
    if (inert !== void 0) {
      const route = matchRoute(url, urlLength, inert, endIndex2, onParam);
      if (route !== null)
        return route;
    }
  }
  if (node2.params !== null) {
    const { store, name, inert } = node2.params;
    const slashIndex = url.indexOf("/", endIndex2);
    if (slashIndex !== endIndex2) {
      if (slashIndex === -1 || slashIndex >= urlLength) {
        if (store !== null) {
          const params = {};
          params[name] = url.substring(endIndex2, urlLength);
          if (onParam)
            for (let i = 0; i < onParam.length; i++) {
              let temp = onParam[i](params[name], name);
              if (temp !== void 0)
                params[name] = temp;
            }
          return {
            store,
            params
          };
        }
      } else if (inert !== null) {
        const route = matchRoute(
          url,
          urlLength,
          inert,
          slashIndex,
          onParam
        );
        if (route !== null) {
          route.params[name] = url.substring(endIndex2, slashIndex);
          if (onParam)
            for (let i = 0; i < onParam.length; i++) {
              let temp = onParam[i](route.params[name], name);
              if (temp !== void 0)
                route.params[name] = temp;
            }
          return route;
        }
      }
    }
  }
  if (node2.wildcardStore !== null)
    return {
      store: node2.wildcardStore,
      params: {
        "*": url.substring(endIndex2, urlLength)
      }
    };
  return null;
};
function IsAsyncIterator$3(value) {
  return IsObject$3(value) && !IsArray$3(value) && !IsUint8Array$3(value) && Symbol.asyncIterator in value;
}
function IsArray$3(value) {
  return Array.isArray(value);
}
function IsBigInt$3(value) {
  return typeof value === "bigint";
}
function IsBoolean$3(value) {
  return typeof value === "boolean";
}
function IsDate$3(value) {
  return value instanceof globalThis.Date;
}
function IsFunction$3(value) {
  return typeof value === "function";
}
function IsIterator$3(value) {
  return IsObject$3(value) && !IsArray$3(value) && !IsUint8Array$3(value) && Symbol.iterator in value;
}
function IsNull$3(value) {
  return value === null;
}
function IsNumber$3(value) {
  return typeof value === "number";
}
function IsObject$3(value) {
  return typeof value === "object" && value !== null;
}
function IsRegExp$2(value) {
  return value instanceof globalThis.RegExp;
}
function IsString$3(value) {
  return typeof value === "string";
}
function IsSymbol$3(value) {
  return typeof value === "symbol";
}
function IsUint8Array$3(value) {
  return value instanceof globalThis.Uint8Array;
}
function IsUndefined$3(value) {
  return value === void 0;
}
function ArrayType$1(value) {
  return value.map((value2) => Visit$b(value2));
}
function DateType$1(value) {
  return new Date(value.getTime());
}
function Uint8ArrayType$1(value) {
  return new Uint8Array(value);
}
function RegExpType(value) {
  return new RegExp(value.source, value.flags);
}
function ObjectType$1(value) {
  const result = {};
  for (const key of Object.getOwnPropertyNames(value)) {
    result[key] = Visit$b(value[key]);
  }
  for (const key of Object.getOwnPropertySymbols(value)) {
    result[key] = Visit$b(value[key]);
  }
  return result;
}
function Visit$b(value) {
  return IsArray$3(value) ? ArrayType$1(value) : IsDate$3(value) ? DateType$1(value) : IsUint8Array$3(value) ? Uint8ArrayType$1(value) : IsRegExp$2(value) ? RegExpType(value) : IsObject$3(value) ? ObjectType$1(value) : value;
}
function Clone$1(value) {
  return Visit$b(value);
}
function CloneType(schema, options) {
  return options === void 0 ? Clone$1(schema) : Clone$1({ ...options, ...schema });
}
function IsAsyncIterator$2(value) {
  return IsObject$2(value) && globalThis.Symbol.asyncIterator in value;
}
function IsIterator$2(value) {
  return IsObject$2(value) && globalThis.Symbol.iterator in value;
}
function IsPromise$2(value) {
  return value instanceof globalThis.Promise;
}
function IsDate$2(value) {
  return value instanceof Date && globalThis.Number.isFinite(value.getTime());
}
function IsMap(value) {
  return value instanceof globalThis.Map;
}
function IsSet(value) {
  return value instanceof globalThis.Set;
}
function IsTypedArray(value) {
  return globalThis.ArrayBuffer.isView(value);
}
function IsUint8Array$2(value) {
  return value instanceof globalThis.Uint8Array;
}
function HasPropertyKey(value, key) {
  return key in value;
}
function IsObject$2(value) {
  return value !== null && typeof value === "object";
}
function IsArray$2(value) {
  return globalThis.Array.isArray(value) && !globalThis.ArrayBuffer.isView(value);
}
function IsUndefined$2(value) {
  return value === void 0;
}
function IsNull$2(value) {
  return value === null;
}
function IsBoolean$2(value) {
  return typeof value === "boolean";
}
function IsNumber$2(value) {
  return typeof value === "number";
}
function IsInteger$2(value) {
  return globalThis.Number.isInteger(value);
}
function IsBigInt$2(value) {
  return typeof value === "bigint";
}
function IsString$2(value) {
  return typeof value === "string";
}
function IsFunction$2(value) {
  return typeof value === "function";
}
function IsSymbol$2(value) {
  return typeof value === "symbol";
}
function IsValueType(value) {
  return IsBigInt$2(value) || IsBoolean$2(value) || IsNull$2(value) || IsNumber$2(value) || IsString$2(value) || IsSymbol$2(value) || IsUndefined$2(value);
}
var TypeSystemPolicy;
(function(TypeSystemPolicy2) {
  TypeSystemPolicy2.InstanceMode = "default";
  TypeSystemPolicy2.ExactOptionalPropertyTypes = false;
  TypeSystemPolicy2.AllowArrayObject = false;
  TypeSystemPolicy2.AllowNaN = false;
  TypeSystemPolicy2.AllowNullVoid = false;
  function IsExactOptionalProperty(value, key) {
    return TypeSystemPolicy2.ExactOptionalPropertyTypes ? key in value : value[key] !== void 0;
  }
  TypeSystemPolicy2.IsExactOptionalProperty = IsExactOptionalProperty;
  function IsObjectLike(value) {
    const isObject2 = IsObject$2(value);
    return TypeSystemPolicy2.AllowArrayObject ? isObject2 : isObject2 && !IsArray$2(value);
  }
  TypeSystemPolicy2.IsObjectLike = IsObjectLike;
  function IsRecordLike(value) {
    return IsObjectLike(value) && !(value instanceof Date) && !(value instanceof Uint8Array);
  }
  TypeSystemPolicy2.IsRecordLike = IsRecordLike;
  function IsNumberLike(value) {
    return TypeSystemPolicy2.AllowNaN ? IsNumber$2(value) : Number.isFinite(value);
  }
  TypeSystemPolicy2.IsNumberLike = IsNumberLike;
  function IsVoidLike(value) {
    const isUndefined = IsUndefined$2(value);
    return TypeSystemPolicy2.AllowNullVoid ? isUndefined || value === null : isUndefined;
  }
  TypeSystemPolicy2.IsVoidLike = IsVoidLike;
})(TypeSystemPolicy || (TypeSystemPolicy = {}));
function ImmutableArray(value) {
  return globalThis.Object.freeze(value).map((value2) => Immutable(value2));
}
function ImmutableDate(value) {
  return value;
}
function ImmutableUint8Array(value) {
  return value;
}
function ImmutableRegExp(value) {
  return value;
}
function ImmutableObject(value) {
  const result = {};
  for (const key of Object.getOwnPropertyNames(value)) {
    result[key] = Immutable(value[key]);
  }
  for (const key of Object.getOwnPropertySymbols(value)) {
    result[key] = Immutable(value[key]);
  }
  return globalThis.Object.freeze(result);
}
function Immutable(value) {
  return IsArray$3(value) ? ImmutableArray(value) : IsDate$3(value) ? ImmutableDate(value) : IsUint8Array$3(value) ? ImmutableUint8Array(value) : IsRegExp$2(value) ? ImmutableRegExp(value) : IsObject$3(value) ? ImmutableObject(value) : value;
}
function CreateType(schema, options) {
  const result = options !== void 0 ? { ...options, ...schema } : schema;
  switch (TypeSystemPolicy.InstanceMode) {
    case "freeze":
      return Immutable(result);
    case "clone":
      return Clone$1(result);
    default:
      return result;
  }
}
class TypeBoxError extends Error {
  constructor(message) {
    super(message);
  }
}
const TransformKind = Symbol.for("TypeBox.Transform");
const ReadonlyKind = Symbol.for("TypeBox.Readonly");
const OptionalKind = Symbol.for("TypeBox.Optional");
const Hint$1 = Symbol.for("TypeBox.Hint");
const Kind$1 = Symbol.for("TypeBox.Kind");
function IsReadonly(value) {
  return IsObject$3(value) && value[ReadonlyKind] === "Readonly";
}
function IsOptional$1(value) {
  return IsObject$3(value) && value[OptionalKind] === "Optional";
}
function IsAny$1(value) {
  return IsKindOf$1(value, "Any");
}
function IsArgument$1(value) {
  return IsKindOf$1(value, "Argument");
}
function IsArray$1(value) {
  return IsKindOf$1(value, "Array");
}
function IsAsyncIterator$1(value) {
  return IsKindOf$1(value, "AsyncIterator");
}
function IsBigInt$1(value) {
  return IsKindOf$1(value, "BigInt");
}
function IsBoolean$1(value) {
  return IsKindOf$1(value, "Boolean");
}
function IsComputed$1(value) {
  return IsKindOf$1(value, "Computed");
}
function IsConstructor$1(value) {
  return IsKindOf$1(value, "Constructor");
}
function IsDate$1(value) {
  return IsKindOf$1(value, "Date");
}
function IsFunction$1(value) {
  return IsKindOf$1(value, "Function");
}
function IsInteger$1(value) {
  return IsKindOf$1(value, "Integer");
}
function IsIntersect$1(value) {
  return IsKindOf$1(value, "Intersect");
}
function IsIterator$1(value) {
  return IsKindOf$1(value, "Iterator");
}
function IsKindOf$1(value, kind) {
  return IsObject$3(value) && Kind$1 in value && value[Kind$1] === kind;
}
function IsLiteralValue$1(value) {
  return IsBoolean$3(value) || IsNumber$3(value) || IsString$3(value);
}
function IsLiteral$1(value) {
  return IsKindOf$1(value, "Literal");
}
function IsMappedKey$1(value) {
  return IsKindOf$1(value, "MappedKey");
}
function IsMappedResult$1(value) {
  return IsKindOf$1(value, "MappedResult");
}
function IsNever$1(value) {
  return IsKindOf$1(value, "Never");
}
function IsNot$1(value) {
  return IsKindOf$1(value, "Not");
}
function IsNull$1(value) {
  return IsKindOf$1(value, "Null");
}
function IsNumber$1(value) {
  return IsKindOf$1(value, "Number");
}
function IsObject$1(value) {
  return IsKindOf$1(value, "Object");
}
function IsPromise$1(value) {
  return IsKindOf$1(value, "Promise");
}
function IsRecord$1(value) {
  return IsKindOf$1(value, "Record");
}
function IsRef$1(value) {
  return IsKindOf$1(value, "Ref");
}
function IsRegExp$1(value) {
  return IsKindOf$1(value, "RegExp");
}
function IsString$1(value) {
  return IsKindOf$1(value, "String");
}
function IsSymbol$1(value) {
  return IsKindOf$1(value, "Symbol");
}
function IsTemplateLiteral$1(value) {
  return IsKindOf$1(value, "TemplateLiteral");
}
function IsThis$1(value) {
  return IsKindOf$1(value, "This");
}
function IsTransform$1(value) {
  return IsObject$3(value) && TransformKind in value;
}
function IsTuple$1(value) {
  return IsKindOf$1(value, "Tuple");
}
function IsUndefined$1(value) {
  return IsKindOf$1(value, "Undefined");
}
function IsUnion$1(value) {
  return IsKindOf$1(value, "Union");
}
function IsUint8Array$1(value) {
  return IsKindOf$1(value, "Uint8Array");
}
function IsUnknown$1(value) {
  return IsKindOf$1(value, "Unknown");
}
function IsUnsafe$1(value) {
  return IsKindOf$1(value, "Unsafe");
}
function IsVoid$1(value) {
  return IsKindOf$1(value, "Void");
}
function IsKind$1(value) {
  return IsObject$3(value) && Kind$1 in value && IsString$3(value[Kind$1]);
}
function IsSchema$1(value) {
  return IsAny$1(value) || IsArgument$1(value) || IsArray$1(value) || IsBoolean$1(value) || IsBigInt$1(value) || IsAsyncIterator$1(value) || IsComputed$1(value) || IsConstructor$1(value) || IsDate$1(value) || IsFunction$1(value) || IsInteger$1(value) || IsIntersect$1(value) || IsIterator$1(value) || IsLiteral$1(value) || IsMappedKey$1(value) || IsMappedResult$1(value) || IsNever$1(value) || IsNot$1(value) || IsNull$1(value) || IsNumber$1(value) || IsObject$1(value) || IsPromise$1(value) || IsRecord$1(value) || IsRef$1(value) || IsRegExp$1(value) || IsString$1(value) || IsSymbol$1(value) || IsTemplateLiteral$1(value) || IsThis$1(value) || IsTuple$1(value) || IsUndefined$1(value) || IsUnion$1(value) || IsUint8Array$1(value) || IsUnknown$1(value) || IsUnsafe$1(value) || IsVoid$1(value) || IsKind$1(value);
}
const KnownTypes = [
  "Argument",
  "Any",
  "Array",
  "AsyncIterator",
  "BigInt",
  "Boolean",
  "Computed",
  "Constructor",
  "Date",
  "Enum",
  "Function",
  "Integer",
  "Intersect",
  "Iterator",
  "Literal",
  "MappedKey",
  "MappedResult",
  "Not",
  "Null",
  "Number",
  "Object",
  "Promise",
  "Record",
  "Ref",
  "RegExp",
  "String",
  "Symbol",
  "TemplateLiteral",
  "This",
  "Tuple",
  "Undefined",
  "Union",
  "Uint8Array",
  "Unknown",
  "Void"
];
function IsPattern(value) {
  try {
    new RegExp(value);
    return true;
  } catch {
    return false;
  }
}
function IsControlCharacterFree(value) {
  if (!IsString$3(value))
    return false;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code >= 7 && code <= 13 || code === 27 || code === 127) {
      return false;
    }
  }
  return true;
}
function IsAdditionalProperties(value) {
  return IsOptionalBoolean(value) || IsSchema(value);
}
function IsOptionalBigInt(value) {
  return IsUndefined$3(value) || IsBigInt$3(value);
}
function IsOptionalNumber(value) {
  return IsUndefined$3(value) || IsNumber$3(value);
}
function IsOptionalBoolean(value) {
  return IsUndefined$3(value) || IsBoolean$3(value);
}
function IsOptionalString(value) {
  return IsUndefined$3(value) || IsString$3(value);
}
function IsOptionalPattern(value) {
  return IsUndefined$3(value) || IsString$3(value) && IsControlCharacterFree(value) && IsPattern(value);
}
function IsOptionalFormat(value) {
  return IsUndefined$3(value) || IsString$3(value) && IsControlCharacterFree(value);
}
function IsOptionalSchema(value) {
  return IsUndefined$3(value) || IsSchema(value);
}
function IsOptional(value) {
  return IsObject$3(value) && value[OptionalKind] === "Optional";
}
function IsAny(value) {
  return IsKindOf(value, "Any") && IsOptionalString(value.$id);
}
function IsArgument(value) {
  return IsKindOf(value, "Argument") && IsNumber$3(value.index);
}
function IsArray(value) {
  return IsKindOf(value, "Array") && value.type === "array" && IsOptionalString(value.$id) && IsSchema(value.items) && IsOptionalNumber(value.minItems) && IsOptionalNumber(value.maxItems) && IsOptionalBoolean(value.uniqueItems) && IsOptionalSchema(value.contains) && IsOptionalNumber(value.minContains) && IsOptionalNumber(value.maxContains);
}
function IsAsyncIterator(value) {
  return IsKindOf(value, "AsyncIterator") && value.type === "AsyncIterator" && IsOptionalString(value.$id) && IsSchema(value.items);
}
function IsBigInt(value) {
  return IsKindOf(value, "BigInt") && value.type === "bigint" && IsOptionalString(value.$id) && IsOptionalBigInt(value.exclusiveMaximum) && IsOptionalBigInt(value.exclusiveMinimum) && IsOptionalBigInt(value.maximum) && IsOptionalBigInt(value.minimum) && IsOptionalBigInt(value.multipleOf);
}
function IsBoolean(value) {
  return IsKindOf(value, "Boolean") && value.type === "boolean" && IsOptionalString(value.$id);
}
function IsComputed(value) {
  return IsKindOf(value, "Computed") && IsString$3(value.target) && IsArray$3(value.parameters) && value.parameters.every((schema) => IsSchema(schema));
}
function IsConstructor(value) {
  return IsKindOf(value, "Constructor") && value.type === "Constructor" && IsOptionalString(value.$id) && IsArray$3(value.parameters) && value.parameters.every((schema) => IsSchema(schema)) && IsSchema(value.returns);
}
function IsDate(value) {
  return IsKindOf(value, "Date") && value.type === "Date" && IsOptionalString(value.$id) && IsOptionalNumber(value.exclusiveMaximumTimestamp) && IsOptionalNumber(value.exclusiveMinimumTimestamp) && IsOptionalNumber(value.maximumTimestamp) && IsOptionalNumber(value.minimumTimestamp) && IsOptionalNumber(value.multipleOfTimestamp);
}
function IsFunction(value) {
  return IsKindOf(value, "Function") && value.type === "Function" && IsOptionalString(value.$id) && IsArray$3(value.parameters) && value.parameters.every((schema) => IsSchema(schema)) && IsSchema(value.returns);
}
function IsInteger(value) {
  return IsKindOf(value, "Integer") && value.type === "integer" && IsOptionalString(value.$id) && IsOptionalNumber(value.exclusiveMaximum) && IsOptionalNumber(value.exclusiveMinimum) && IsOptionalNumber(value.maximum) && IsOptionalNumber(value.minimum) && IsOptionalNumber(value.multipleOf);
}
function IsProperties(value) {
  return IsObject$3(value) && Object.entries(value).every(([key, schema]) => IsControlCharacterFree(key) && IsSchema(schema));
}
function IsIntersect(value) {
  return IsKindOf(value, "Intersect") && (IsString$3(value.type) && value.type !== "object" ? false : true) && IsArray$3(value.allOf) && value.allOf.every((schema) => IsSchema(schema) && !IsTransform(schema)) && IsOptionalString(value.type) && (IsOptionalBoolean(value.unevaluatedProperties) || IsOptionalSchema(value.unevaluatedProperties)) && IsOptionalString(value.$id);
}
function IsIterator(value) {
  return IsKindOf(value, "Iterator") && value.type === "Iterator" && IsOptionalString(value.$id) && IsSchema(value.items);
}
function IsKindOf(value, kind) {
  return IsObject$3(value) && Kind$1 in value && value[Kind$1] === kind;
}
function IsLiteralString(value) {
  return IsLiteral(value) && IsString$3(value.const);
}
function IsLiteralNumber(value) {
  return IsLiteral(value) && IsNumber$3(value.const);
}
function IsLiteralBoolean(value) {
  return IsLiteral(value) && IsBoolean$3(value.const);
}
function IsLiteral(value) {
  return IsKindOf(value, "Literal") && IsOptionalString(value.$id) && IsLiteralValue(value.const);
}
function IsLiteralValue(value) {
  return IsBoolean$3(value) || IsNumber$3(value) || IsString$3(value);
}
function IsMappedKey(value) {
  return IsKindOf(value, "MappedKey") && IsArray$3(value.keys) && value.keys.every((key) => IsNumber$3(key) || IsString$3(key));
}
function IsMappedResult(value) {
  return IsKindOf(value, "MappedResult") && IsProperties(value.properties);
}
function IsNever(value) {
  return IsKindOf(value, "Never") && IsObject$3(value.not) && Object.getOwnPropertyNames(value.not).length === 0;
}
function IsNot(value) {
  return IsKindOf(value, "Not") && IsSchema(value.not);
}
function IsNull(value) {
  return IsKindOf(value, "Null") && value.type === "null" && IsOptionalString(value.$id);
}
function IsNumber(value) {
  return IsKindOf(value, "Number") && value.type === "number" && IsOptionalString(value.$id) && IsOptionalNumber(value.exclusiveMaximum) && IsOptionalNumber(value.exclusiveMinimum) && IsOptionalNumber(value.maximum) && IsOptionalNumber(value.minimum) && IsOptionalNumber(value.multipleOf);
}
function IsObject(value) {
  return IsKindOf(value, "Object") && value.type === "object" && IsOptionalString(value.$id) && IsProperties(value.properties) && IsAdditionalProperties(value.additionalProperties) && IsOptionalNumber(value.minProperties) && IsOptionalNumber(value.maxProperties);
}
function IsPromise(value) {
  return IsKindOf(value, "Promise") && value.type === "Promise" && IsOptionalString(value.$id) && IsSchema(value.item);
}
function IsRecord(value) {
  return IsKindOf(value, "Record") && value.type === "object" && IsOptionalString(value.$id) && IsAdditionalProperties(value.additionalProperties) && IsObject$3(value.patternProperties) && ((schema) => {
    const keys = Object.getOwnPropertyNames(schema.patternProperties);
    return keys.length === 1 && IsPattern(keys[0]) && IsObject$3(schema.patternProperties) && IsSchema(schema.patternProperties[keys[0]]);
  })(value);
}
function IsRef(value) {
  return IsKindOf(value, "Ref") && IsOptionalString(value.$id) && IsString$3(value.$ref);
}
function IsRegExp(value) {
  return IsKindOf(value, "RegExp") && IsOptionalString(value.$id) && IsString$3(value.source) && IsString$3(value.flags) && IsOptionalNumber(value.maxLength) && IsOptionalNumber(value.minLength);
}
function IsString(value) {
  return IsKindOf(value, "String") && value.type === "string" && IsOptionalString(value.$id) && IsOptionalNumber(value.minLength) && IsOptionalNumber(value.maxLength) && IsOptionalPattern(value.pattern) && IsOptionalFormat(value.format);
}
function IsSymbol(value) {
  return IsKindOf(value, "Symbol") && value.type === "symbol" && IsOptionalString(value.$id);
}
function IsTemplateLiteral(value) {
  return IsKindOf(value, "TemplateLiteral") && value.type === "string" && IsString$3(value.pattern) && value.pattern[0] === "^" && value.pattern[value.pattern.length - 1] === "$";
}
function IsThis(value) {
  return IsKindOf(value, "This") && IsOptionalString(value.$id) && IsString$3(value.$ref);
}
function IsTransform(value) {
  return IsObject$3(value) && TransformKind in value;
}
function IsTuple(value) {
  return IsKindOf(value, "Tuple") && value.type === "array" && IsOptionalString(value.$id) && IsNumber$3(value.minItems) && IsNumber$3(value.maxItems) && value.minItems === value.maxItems && // empty
  (IsUndefined$3(value.items) && IsUndefined$3(value.additionalItems) && value.minItems === 0 || IsArray$3(value.items) && value.items.every((schema) => IsSchema(schema)));
}
function IsUndefined(value) {
  return IsKindOf(value, "Undefined") && value.type === "undefined" && IsOptionalString(value.$id);
}
function IsUnion(value) {
  return IsKindOf(value, "Union") && IsOptionalString(value.$id) && IsObject$3(value) && IsArray$3(value.anyOf) && value.anyOf.every((schema) => IsSchema(schema));
}
function IsUint8Array(value) {
  return IsKindOf(value, "Uint8Array") && value.type === "Uint8Array" && IsOptionalString(value.$id) && IsOptionalNumber(value.minByteLength) && IsOptionalNumber(value.maxByteLength);
}
function IsUnknown(value) {
  return IsKindOf(value, "Unknown") && IsOptionalString(value.$id);
}
function IsUnsafe(value) {
  return IsKindOf(value, "Unsafe");
}
function IsVoid(value) {
  return IsKindOf(value, "Void") && value.type === "void" && IsOptionalString(value.$id);
}
function IsKind(value) {
  return IsObject$3(value) && Kind$1 in value && IsString$3(value[Kind$1]) && !KnownTypes.includes(value[Kind$1]);
}
function IsSchema(value) {
  return IsObject$3(value) && (IsAny(value) || IsArgument(value) || IsArray(value) || IsBoolean(value) || IsBigInt(value) || IsAsyncIterator(value) || IsComputed(value) || IsConstructor(value) || IsDate(value) || IsFunction(value) || IsInteger(value) || IsIntersect(value) || IsIterator(value) || IsLiteral(value) || IsMappedKey(value) || IsMappedResult(value) || IsNever(value) || IsNot(value) || IsNull(value) || IsNumber(value) || IsObject(value) || IsPromise(value) || IsRecord(value) || IsRef(value) || IsRegExp(value) || IsString(value) || IsSymbol(value) || IsTemplateLiteral(value) || IsThis(value) || IsTuple(value) || IsUndefined(value) || IsUnion(value) || IsUint8Array(value) || IsUnknown(value) || IsUnsafe(value) || IsVoid(value) || IsKind(value));
}
const PatternBoolean = "(true|false)";
const PatternNumber = "(0|[1-9][0-9]*)";
const PatternString = "(.*)";
const PatternNever = "(?!.*)";
const PatternNumberExact = `^${PatternNumber}$`;
const PatternStringExact = `^${PatternString}$`;
const PatternNeverExact = `^${PatternNever}$`;
const map$1 = /* @__PURE__ */ new Map();
function Has$1(format) {
  return map$1.has(format);
}
function Set$2(format, func) {
  map$1.set(format, func);
}
function Get$1(format) {
  return map$1.get(format);
}
const map = /* @__PURE__ */ new Map();
function Has(kind) {
  return map.has(kind);
}
function Set$1(kind, func) {
  map.set(kind, func);
}
function Get(kind) {
  return map.get(kind);
}
function SetIncludes(T, S) {
  return T.includes(S);
}
function SetDistinct(T) {
  return [...new Set(T)];
}
function SetIntersect(T, S) {
  return T.filter((L) => S.includes(L));
}
function SetIntersectManyResolve(T, Init) {
  return T.reduce((Acc, L) => {
    return SetIntersect(Acc, L);
  }, Init);
}
function SetIntersectMany(T) {
  return T.length === 1 ? T[0] : T.length > 1 ? SetIntersectManyResolve(T.slice(1), T[0]) : [];
}
function SetUnionMany(T) {
  const Acc = [];
  for (const L of T)
    Acc.push(...L);
  return Acc;
}
function Any(options) {
  return CreateType({ [Kind$1]: "Any" }, options);
}
function Array$1(items, options) {
  return CreateType({ [Kind$1]: "Array", type: "array", items }, options);
}
function Argument(index) {
  return CreateType({ [Kind$1]: "Argument", index });
}
function AsyncIterator(items, options) {
  return CreateType({ [Kind$1]: "AsyncIterator", type: "AsyncIterator", items }, options);
}
function Computed(target, parameters, options) {
  return CreateType({ [Kind$1]: "Computed", target, parameters }, options);
}
function DiscardKey(value, key) {
  const { [key]: _, ...rest } = value;
  return rest;
}
function Discard(value, keys) {
  return keys.reduce((acc, key) => DiscardKey(acc, key), value);
}
function Never(options) {
  return CreateType({ [Kind$1]: "Never", not: {} }, options);
}
function MappedResult(properties) {
  return CreateType({
    [Kind$1]: "MappedResult",
    properties
  });
}
function Constructor(parameters, returns, options) {
  return CreateType({ [Kind$1]: "Constructor", type: "Constructor", parameters, returns }, options);
}
function Function$1(parameters, returns, options) {
  return CreateType({ [Kind$1]: "Function", type: "Function", parameters, returns }, options);
}
function UnionCreate(T, options) {
  return CreateType({ [Kind$1]: "Union", anyOf: T }, options);
}
function IsUnionOptional(types2) {
  return types2.some((type) => IsOptional$1(type));
}
function RemoveOptionalFromRest$1(types2) {
  return types2.map((left) => IsOptional$1(left) ? RemoveOptionalFromType$1(left) : left);
}
function RemoveOptionalFromType$1(T) {
  return Discard(T, [OptionalKind]);
}
function ResolveUnion(types2, options) {
  const isOptional2 = IsUnionOptional(types2);
  return isOptional2 ? Optional(UnionCreate(RemoveOptionalFromRest$1(types2), options)) : UnionCreate(RemoveOptionalFromRest$1(types2), options);
}
function UnionEvaluated(T, options) {
  return T.length === 1 ? CreateType(T[0], options) : T.length === 0 ? Never(options) : ResolveUnion(T, options);
}
function Union$1(types2, options) {
  return types2.length === 0 ? Never(options) : types2.length === 1 ? CreateType(types2[0], options) : UnionCreate(types2, options);
}
class TemplateLiteralParserError extends TypeBoxError {
}
function Unescape(pattern) {
  return pattern.replace(/\\\$/g, "$").replace(/\\\*/g, "*").replace(/\\\^/g, "^").replace(/\\\|/g, "|").replace(/\\\(/g, "(").replace(/\\\)/g, ")");
}
function IsNonEscaped(pattern, index, char) {
  return pattern[index] === char && pattern.charCodeAt(index - 1) !== 92;
}
function IsOpenParen(pattern, index) {
  return IsNonEscaped(pattern, index, "(");
}
function IsCloseParen(pattern, index) {
  return IsNonEscaped(pattern, index, ")");
}
function IsSeparator(pattern, index) {
  return IsNonEscaped(pattern, index, "|");
}
function IsGroup(pattern) {
  if (!(IsOpenParen(pattern, 0) && IsCloseParen(pattern, pattern.length - 1)))
    return false;
  let count = 0;
  for (let index = 0; index < pattern.length; index++) {
    if (IsOpenParen(pattern, index))
      count += 1;
    if (IsCloseParen(pattern, index))
      count -= 1;
    if (count === 0 && index !== pattern.length - 1)
      return false;
  }
  return true;
}
function InGroup(pattern) {
  return pattern.slice(1, pattern.length - 1);
}
function IsPrecedenceOr(pattern) {
  let count = 0;
  for (let index = 0; index < pattern.length; index++) {
    if (IsOpenParen(pattern, index))
      count += 1;
    if (IsCloseParen(pattern, index))
      count -= 1;
    if (IsSeparator(pattern, index) && count === 0)
      return true;
  }
  return false;
}
function IsPrecedenceAnd(pattern) {
  for (let index = 0; index < pattern.length; index++) {
    if (IsOpenParen(pattern, index))
      return true;
  }
  return false;
}
function Or(pattern) {
  let [count, start] = [0, 0];
  const expressions = [];
  for (let index = 0; index < pattern.length; index++) {
    if (IsOpenParen(pattern, index))
      count += 1;
    if (IsCloseParen(pattern, index))
      count -= 1;
    if (IsSeparator(pattern, index) && count === 0) {
      const range2 = pattern.slice(start, index);
      if (range2.length > 0)
        expressions.push(TemplateLiteralParse(range2));
      start = index + 1;
    }
  }
  const range = pattern.slice(start);
  if (range.length > 0)
    expressions.push(TemplateLiteralParse(range));
  if (expressions.length === 0)
    return { type: "const", const: "" };
  if (expressions.length === 1)
    return expressions[0];
  return { type: "or", expr: expressions };
}
function And(pattern) {
  function Group(value, index) {
    if (!IsOpenParen(value, index))
      throw new TemplateLiteralParserError(`TemplateLiteralParser: Index must point to open parens`);
    let count = 0;
    for (let scan = index; scan < value.length; scan++) {
      if (IsOpenParen(value, scan))
        count += 1;
      if (IsCloseParen(value, scan))
        count -= 1;
      if (count === 0)
        return [index, scan];
    }
    throw new TemplateLiteralParserError(`TemplateLiteralParser: Unclosed group parens in expression`);
  }
  function Range(pattern2, index) {
    for (let scan = index; scan < pattern2.length; scan++) {
      if (IsOpenParen(pattern2, scan))
        return [index, scan];
    }
    return [index, pattern2.length];
  }
  const expressions = [];
  for (let index = 0; index < pattern.length; index++) {
    if (IsOpenParen(pattern, index)) {
      const [start, end] = Group(pattern, index);
      const range = pattern.slice(start, end + 1);
      expressions.push(TemplateLiteralParse(range));
      index = end;
    } else {
      const [start, end] = Range(pattern, index);
      const range = pattern.slice(start, end);
      if (range.length > 0)
        expressions.push(TemplateLiteralParse(range));
      index = end - 1;
    }
  }
  return expressions.length === 0 ? { type: "const", const: "" } : expressions.length === 1 ? expressions[0] : { type: "and", expr: expressions };
}
function TemplateLiteralParse(pattern) {
  return IsGroup(pattern) ? TemplateLiteralParse(InGroup(pattern)) : IsPrecedenceOr(pattern) ? Or(pattern) : IsPrecedenceAnd(pattern) ? And(pattern) : { type: "const", const: Unescape(pattern) };
}
function TemplateLiteralParseExact(pattern) {
  return TemplateLiteralParse(pattern.slice(1, pattern.length - 1));
}
class TemplateLiteralFiniteError extends TypeBoxError {
}
function IsNumberExpression(expression) {
  return expression.type === "or" && expression.expr.length === 2 && expression.expr[0].type === "const" && expression.expr[0].const === "0" && expression.expr[1].type === "const" && expression.expr[1].const === "[1-9][0-9]*";
}
function IsBooleanExpression(expression) {
  return expression.type === "or" && expression.expr.length === 2 && expression.expr[0].type === "const" && expression.expr[0].const === "true" && expression.expr[1].type === "const" && expression.expr[1].const === "false";
}
function IsStringExpression(expression) {
  return expression.type === "const" && expression.const === ".*";
}
function IsTemplateLiteralExpressionFinite(expression) {
  return IsNumberExpression(expression) || IsStringExpression(expression) ? false : IsBooleanExpression(expression) ? true : expression.type === "and" ? expression.expr.every((expr) => IsTemplateLiteralExpressionFinite(expr)) : expression.type === "or" ? expression.expr.every((expr) => IsTemplateLiteralExpressionFinite(expr)) : expression.type === "const" ? true : (() => {
    throw new TemplateLiteralFiniteError(`Unknown expression type`);
  })();
}
function IsTemplateLiteralFinite(schema) {
  const expression = TemplateLiteralParseExact(schema.pattern);
  return IsTemplateLiteralExpressionFinite(expression);
}
class TemplateLiteralGenerateError extends TypeBoxError {
}
function* GenerateReduce(buffer) {
  if (buffer.length === 1)
    return yield* buffer[0];
  for (const left of buffer[0]) {
    for (const right of GenerateReduce(buffer.slice(1))) {
      yield `${left}${right}`;
    }
  }
}
function* GenerateAnd(expression) {
  return yield* GenerateReduce(expression.expr.map((expr) => [...TemplateLiteralExpressionGenerate(expr)]));
}
function* GenerateOr(expression) {
  for (const expr of expression.expr)
    yield* TemplateLiteralExpressionGenerate(expr);
}
function* GenerateConst(expression) {
  return yield expression.const;
}
function* TemplateLiteralExpressionGenerate(expression) {
  return expression.type === "and" ? yield* GenerateAnd(expression) : expression.type === "or" ? yield* GenerateOr(expression) : expression.type === "const" ? yield* GenerateConst(expression) : (() => {
    throw new TemplateLiteralGenerateError("Unknown expression");
  })();
}
function TemplateLiteralGenerate(schema) {
  const expression = TemplateLiteralParseExact(schema.pattern);
  return IsTemplateLiteralExpressionFinite(expression) ? [...TemplateLiteralExpressionGenerate(expression)] : [];
}
function Literal(value, options) {
  return CreateType({
    [Kind$1]: "Literal",
    const: value,
    type: typeof value
  }, options);
}
function Boolean(options) {
  return CreateType({ [Kind$1]: "Boolean", type: "boolean" }, options);
}
function BigInt$1(options) {
  return CreateType({ [Kind$1]: "BigInt", type: "bigint" }, options);
}
function Number$1(options) {
  return CreateType({ [Kind$1]: "Number", type: "number" }, options);
}
function String$1(options) {
  return CreateType({ [Kind$1]: "String", type: "string" }, options);
}
function* FromUnion$h(syntax) {
  const trim = syntax.trim().replace(/"|'/g, "");
  return trim === "boolean" ? yield Boolean() : trim === "number" ? yield Number$1() : trim === "bigint" ? yield BigInt$1() : trim === "string" ? yield String$1() : yield (() => {
    const literals = trim.split("|").map((literal) => Literal(literal.trim()));
    return literals.length === 0 ? Never() : literals.length === 1 ? literals[0] : UnionEvaluated(literals);
  })();
}
function* FromTerminal(syntax) {
  if (syntax[1] !== "{") {
    const L = Literal("$");
    const R = FromSyntax(syntax.slice(1));
    return yield* [L, ...R];
  }
  for (let i = 2; i < syntax.length; i++) {
    if (syntax[i] === "}") {
      const L = FromUnion$h(syntax.slice(2, i));
      const R = FromSyntax(syntax.slice(i + 1));
      return yield* [...L, ...R];
    }
  }
  yield Literal(syntax);
}
function* FromSyntax(syntax) {
  for (let i = 0; i < syntax.length; i++) {
    if (syntax[i] === "$") {
      const L = Literal(syntax.slice(0, i));
      const R = FromTerminal(syntax.slice(i));
      return yield* [L, ...R];
    }
  }
  yield Literal(syntax);
}
function TemplateLiteralSyntax(syntax) {
  return [...FromSyntax(syntax)];
}
class TemplateLiteralPatternError extends TypeBoxError {
}
function Escape(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function Visit$a(schema, acc) {
  return IsTemplateLiteral$1(schema) ? schema.pattern.slice(1, schema.pattern.length - 1) : IsUnion$1(schema) ? `(${schema.anyOf.map((schema2) => Visit$a(schema2, acc)).join("|")})` : IsNumber$1(schema) ? `${acc}${PatternNumber}` : IsInteger$1(schema) ? `${acc}${PatternNumber}` : IsBigInt$1(schema) ? `${acc}${PatternNumber}` : IsString$1(schema) ? `${acc}${PatternString}` : IsLiteral$1(schema) ? `${acc}${Escape(schema.const.toString())}` : IsBoolean$1(schema) ? `${acc}${PatternBoolean}` : (() => {
    throw new TemplateLiteralPatternError(`Unexpected Kind '${schema[Kind$1]}'`);
  })();
}
function TemplateLiteralPattern(kinds) {
  return `^${kinds.map((schema) => Visit$a(schema, "")).join("")}$`;
}
function TemplateLiteralToUnion(schema) {
  const R = TemplateLiteralGenerate(schema);
  const L = R.map((S) => Literal(S));
  return UnionEvaluated(L);
}
function TemplateLiteral(unresolved, options) {
  const pattern = IsString$3(unresolved) ? TemplateLiteralPattern(TemplateLiteralSyntax(unresolved)) : TemplateLiteralPattern(unresolved);
  return CreateType({ [Kind$1]: "TemplateLiteral", type: "string", pattern }, options);
}
function FromTemplateLiteral$5(templateLiteral) {
  const keys = TemplateLiteralGenerate(templateLiteral);
  return keys.map((key) => key.toString());
}
function FromUnion$g(types2) {
  const result = [];
  for (const type of types2)
    result.push(...IndexPropertyKeys(type));
  return result;
}
function FromLiteral$4(literalValue) {
  return [literalValue.toString()];
}
function IndexPropertyKeys(type) {
  return [...new Set(IsTemplateLiteral$1(type) ? FromTemplateLiteral$5(type) : IsUnion$1(type) ? FromUnion$g(type.anyOf) : IsLiteral$1(type) ? FromLiteral$4(type.const) : IsNumber$1(type) ? ["[number]"] : IsInteger$1(type) ? ["[number]"] : [])];
}
function FromProperties$i(type, properties, options) {
  const result = {};
  for (const K2 of Object.getOwnPropertyNames(properties)) {
    result[K2] = Index(type, IndexPropertyKeys(properties[K2]), options);
  }
  return result;
}
function FromMappedResult$b(type, mappedResult, options) {
  return FromProperties$i(type, mappedResult.properties, options);
}
function IndexFromMappedResult(type, mappedResult, options) {
  const properties = FromMappedResult$b(type, mappedResult, options);
  return MappedResult(properties);
}
function FromRest$6(types2, key) {
  return types2.map((type) => IndexFromPropertyKey(type, key));
}
function FromIntersectRest(types2) {
  return types2.filter((type) => !IsNever$1(type));
}
function FromIntersect$f(types2, key) {
  return IntersectEvaluated(FromIntersectRest(FromRest$6(types2, key)));
}
function FromUnionRest(types2) {
  return types2.some((L) => IsNever$1(L)) ? [] : types2;
}
function FromUnion$f(types2, key) {
  return UnionEvaluated(FromUnionRest(FromRest$6(types2, key)));
}
function FromTuple$c(types2, key) {
  return key in types2 ? types2[key] : key === "[number]" ? UnionEvaluated(types2) : Never();
}
function FromArray$e(type, key) {
  return key === "[number]" ? type : Never();
}
function FromProperty$2(properties, propertyKey) {
  return propertyKey in properties ? properties[propertyKey] : Never();
}
function IndexFromPropertyKey(type, propertyKey) {
  return IsIntersect$1(type) ? FromIntersect$f(type.allOf, propertyKey) : IsUnion$1(type) ? FromUnion$f(type.anyOf, propertyKey) : IsTuple$1(type) ? FromTuple$c(type.items ?? [], propertyKey) : IsArray$1(type) ? FromArray$e(type.items, propertyKey) : IsObject$1(type) ? FromProperty$2(type.properties, propertyKey) : Never();
}
function IndexFromPropertyKeys(type, propertyKeys) {
  return propertyKeys.map((propertyKey) => IndexFromPropertyKey(type, propertyKey));
}
function FromSchema(type, propertyKeys) {
  return UnionEvaluated(IndexFromPropertyKeys(type, propertyKeys));
}
function Index(type, key, options) {
  if (IsRef$1(type) || IsRef$1(key)) {
    const error = `Index types using Ref parameters require both Type and Key to be of TSchema`;
    if (!IsSchema$1(type) || !IsSchema$1(key))
      throw new TypeBoxError(error);
    return Computed("Index", [type, key]);
  }
  if (IsMappedResult$1(key))
    return IndexFromMappedResult(type, key, options);
  if (IsMappedKey$1(key))
    return IndexFromMappedKey(type, key, options);
  return CreateType(IsSchema$1(key) ? FromSchema(type, IndexPropertyKeys(key)) : FromSchema(type, key), options);
}
function MappedIndexPropertyKey(type, key, options) {
  return { [key]: Index(type, [key], Clone$1(options)) };
}
function MappedIndexPropertyKeys(type, propertyKeys, options) {
  return propertyKeys.reduce((result, left) => {
    return { ...result, ...MappedIndexPropertyKey(type, left, options) };
  }, {});
}
function MappedIndexProperties(type, mappedKey, options) {
  return MappedIndexPropertyKeys(type, mappedKey.keys, options);
}
function IndexFromMappedKey(type, mappedKey, options) {
  const properties = MappedIndexProperties(type, mappedKey, options);
  return MappedResult(properties);
}
function Iterator(items, options) {
  return CreateType({ [Kind$1]: "Iterator", type: "Iterator", items }, options);
}
function RequiredArray(properties) {
  return globalThis.Object.keys(properties).filter((key) => !IsOptional$1(properties[key]));
}
function _Object_(properties, options) {
  const required = RequiredArray(properties);
  const schema = required.length > 0 ? { [Kind$1]: "Object", type: "object", required, properties } : { [Kind$1]: "Object", type: "object", properties };
  return CreateType(schema, options);
}
var Object$1 = _Object_;
function Promise$1(item, options) {
  return CreateType({ [Kind$1]: "Promise", type: "Promise", item }, options);
}
function RemoveReadonly(schema) {
  return CreateType(Discard(schema, [ReadonlyKind]));
}
function AddReadonly(schema) {
  return CreateType({ ...schema, [ReadonlyKind]: "Readonly" });
}
function ReadonlyWithFlag(schema, F) {
  return F === false ? RemoveReadonly(schema) : AddReadonly(schema);
}
function Readonly(schema, enable) {
  const F = enable ?? true;
  return IsMappedResult$1(schema) ? ReadonlyFromMappedResult(schema, F) : ReadonlyWithFlag(schema, F);
}
function FromProperties$h(K, F) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(K))
    Acc[K2] = Readonly(K[K2], F);
  return Acc;
}
function FromMappedResult$a(R, F) {
  return FromProperties$h(R.properties, F);
}
function ReadonlyFromMappedResult(R, F) {
  const P = FromMappedResult$a(R, F);
  return MappedResult(P);
}
function Tuple(types2, options) {
  return CreateType(types2.length > 0 ? { [Kind$1]: "Tuple", type: "array", items: types2, additionalItems: false, minItems: types2.length, maxItems: types2.length } : { [Kind$1]: "Tuple", type: "array", minItems: types2.length, maxItems: types2.length }, options);
}
function FromMappedResult$9(K, P) {
  return K in P ? FromSchemaType(K, P[K]) : MappedResult(P);
}
function MappedKeyToKnownMappedResultProperties(K) {
  return { [K]: Literal(K) };
}
function MappedKeyToUnknownMappedResultProperties(P) {
  const Acc = {};
  for (const L of P)
    Acc[L] = Literal(L);
  return Acc;
}
function MappedKeyToMappedResultProperties(K, P) {
  return SetIncludes(P, K) ? MappedKeyToKnownMappedResultProperties(K) : MappedKeyToUnknownMappedResultProperties(P);
}
function FromMappedKey$3(K, P) {
  const R = MappedKeyToMappedResultProperties(K, P);
  return FromMappedResult$9(K, R);
}
function FromRest$5(K, T) {
  return T.map((L) => FromSchemaType(K, L));
}
function FromProperties$g(K, T) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(T))
    Acc[K2] = FromSchemaType(K, T[K2]);
  return Acc;
}
function FromSchemaType(K, T) {
  const options = { ...T };
  return (
    // unevaluated modifier types
    IsOptional$1(T) ? Optional(FromSchemaType(K, Discard(T, [OptionalKind]))) : IsReadonly(T) ? Readonly(FromSchemaType(K, Discard(T, [ReadonlyKind]))) : (
      // unevaluated mapped types
      IsMappedResult$1(T) ? FromMappedResult$9(K, T.properties) : IsMappedKey$1(T) ? FromMappedKey$3(K, T.keys) : (
        // unevaluated types
        IsConstructor$1(T) ? Constructor(FromRest$5(K, T.parameters), FromSchemaType(K, T.returns), options) : IsFunction$1(T) ? Function$1(FromRest$5(K, T.parameters), FromSchemaType(K, T.returns), options) : IsAsyncIterator$1(T) ? AsyncIterator(FromSchemaType(K, T.items), options) : IsIterator$1(T) ? Iterator(FromSchemaType(K, T.items), options) : IsIntersect$1(T) ? Intersect$1(FromRest$5(K, T.allOf), options) : IsUnion$1(T) ? Union$1(FromRest$5(K, T.anyOf), options) : IsTuple$1(T) ? Tuple(FromRest$5(K, T.items ?? []), options) : IsObject$1(T) ? Object$1(FromProperties$g(K, T.properties), options) : IsArray$1(T) ? Array$1(FromSchemaType(K, T.items), options) : IsPromise$1(T) ? Promise$1(FromSchemaType(K, T.item), options) : T
      )
    )
  );
}
function MappedFunctionReturnType(K, T) {
  const Acc = {};
  for (const L of K)
    Acc[L] = FromSchemaType(L, T);
  return Acc;
}
function Mapped(key, map2, options) {
  const K = IsSchema$1(key) ? IndexPropertyKeys(key) : key;
  const RT = map2({ [Kind$1]: "MappedKey", keys: K });
  const R = MappedFunctionReturnType(K, RT);
  return Object$1(R, options);
}
function RemoveOptional(schema) {
  return CreateType(Discard(schema, [OptionalKind]));
}
function AddOptional(schema) {
  return CreateType({ ...schema, [OptionalKind]: "Optional" });
}
function OptionalWithFlag(schema, F) {
  return F === false ? RemoveOptional(schema) : AddOptional(schema);
}
function Optional(schema, enable) {
  const F = enable ?? true;
  return IsMappedResult$1(schema) ? OptionalFromMappedResult(schema, F) : OptionalWithFlag(schema, F);
}
function FromProperties$f(P, F) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(P))
    Acc[K2] = Optional(P[K2], F);
  return Acc;
}
function FromMappedResult$8(R, F) {
  return FromProperties$f(R.properties, F);
}
function OptionalFromMappedResult(R, F) {
  const P = FromMappedResult$8(R, F);
  return MappedResult(P);
}
function IntersectCreate(T, options = {}) {
  const allObjects = T.every((schema) => IsObject$1(schema));
  const clonedUnevaluatedProperties = IsSchema$1(options.unevaluatedProperties) ? { unevaluatedProperties: options.unevaluatedProperties } : {};
  return CreateType(options.unevaluatedProperties === false || IsSchema$1(options.unevaluatedProperties) || allObjects ? { ...clonedUnevaluatedProperties, [Kind$1]: "Intersect", type: "object", allOf: T } : { ...clonedUnevaluatedProperties, [Kind$1]: "Intersect", allOf: T }, options);
}
function IsIntersectOptional(types2) {
  return types2.every((left) => IsOptional$1(left));
}
function RemoveOptionalFromType(type) {
  return Discard(type, [OptionalKind]);
}
function RemoveOptionalFromRest(types2) {
  return types2.map((left) => IsOptional$1(left) ? RemoveOptionalFromType(left) : left);
}
function ResolveIntersect(types2, options) {
  return IsIntersectOptional(types2) ? Optional(IntersectCreate(RemoveOptionalFromRest(types2), options)) : IntersectCreate(RemoveOptionalFromRest(types2), options);
}
function IntersectEvaluated(types2, options = {}) {
  if (types2.length === 1)
    return CreateType(types2[0], options);
  if (types2.length === 0)
    return Never(options);
  if (types2.some((schema) => IsTransform$1(schema)))
    throw new Error("Cannot intersect transform types");
  return ResolveIntersect(types2, options);
}
function Intersect$1(types2, options) {
  if (types2.length === 1)
    return CreateType(types2[0], options);
  if (types2.length === 0)
    return Never(options);
  if (types2.some((schema) => IsTransform$1(schema)))
    throw new Error("Cannot intersect transform types");
  return IntersectCreate(types2, options);
}
function Ref(...args) {
  const [$ref, options] = typeof args[0] === "string" ? [args[0], args[1]] : [args[0].$id, args[1]];
  if (typeof $ref !== "string")
    throw new TypeBoxError("Ref: $ref must be a string");
  return CreateType({ [Kind$1]: "Ref", $ref }, options);
}
function FromComputed$4(target, parameters) {
  return Computed("Awaited", [Computed(target, parameters)]);
}
function FromRef$b($ref) {
  return Computed("Awaited", [Ref($ref)]);
}
function FromIntersect$e(types2) {
  return Intersect$1(FromRest$4(types2));
}
function FromUnion$e(types2) {
  return Union$1(FromRest$4(types2));
}
function FromPromise$6(type) {
  return Awaited(type);
}
function FromRest$4(types2) {
  return types2.map((type) => Awaited(type));
}
function Awaited(type, options) {
  return CreateType(IsComputed$1(type) ? FromComputed$4(type.target, type.parameters) : IsIntersect$1(type) ? FromIntersect$e(type.allOf) : IsUnion$1(type) ? FromUnion$e(type.anyOf) : IsPromise$1(type) ? FromPromise$6(type.item) : IsRef$1(type) ? FromRef$b(type.$ref) : type, options);
}
function FromRest$3(types2) {
  const result = [];
  for (const L of types2)
    result.push(KeyOfPropertyKeys(L));
  return result;
}
function FromIntersect$d(types2) {
  const propertyKeysArray = FromRest$3(types2);
  const propertyKeys = SetUnionMany(propertyKeysArray);
  return propertyKeys;
}
function FromUnion$d(types2) {
  const propertyKeysArray = FromRest$3(types2);
  const propertyKeys = SetIntersectMany(propertyKeysArray);
  return propertyKeys;
}
function FromTuple$b(types2) {
  return types2.map((_, indexer) => indexer.toString());
}
function FromArray$d(_) {
  return ["[number]"];
}
function FromProperties$e(T) {
  return globalThis.Object.getOwnPropertyNames(T);
}
function FromPatternProperties(patternProperties) {
  if (!includePatternProperties)
    return [];
  const patternPropertyKeys = globalThis.Object.getOwnPropertyNames(patternProperties);
  return patternPropertyKeys.map((key) => {
    return key[0] === "^" && key[key.length - 1] === "$" ? key.slice(1, key.length - 1) : key;
  });
}
function KeyOfPropertyKeys(type) {
  return IsIntersect$1(type) ? FromIntersect$d(type.allOf) : IsUnion$1(type) ? FromUnion$d(type.anyOf) : IsTuple$1(type) ? FromTuple$b(type.items ?? []) : IsArray$1(type) ? FromArray$d(type.items) : IsObject$1(type) ? FromProperties$e(type.properties) : IsRecord$1(type) ? FromPatternProperties(type.patternProperties) : [];
}
let includePatternProperties = false;
function KeyOfPattern(schema) {
  includePatternProperties = true;
  const keys = KeyOfPropertyKeys(schema);
  includePatternProperties = false;
  const pattern = keys.map((key) => `(${key})`);
  return `^(${pattern.join("|")})$`;
}
function FromComputed$3(target, parameters) {
  return Computed("KeyOf", [Computed(target, parameters)]);
}
function FromRef$a($ref) {
  return Computed("KeyOf", [Ref($ref)]);
}
function KeyOfFromType(type, options) {
  const propertyKeys = KeyOfPropertyKeys(type);
  const propertyKeyTypes = KeyOfPropertyKeysToRest(propertyKeys);
  const result = UnionEvaluated(propertyKeyTypes);
  return CreateType(result, options);
}
function KeyOfPropertyKeysToRest(propertyKeys) {
  return propertyKeys.map((L) => L === "[number]" ? Number$1() : Literal(L));
}
function KeyOf(type, options) {
  return IsComputed$1(type) ? FromComputed$3(type.target, type.parameters) : IsRef$1(type) ? FromRef$a(type.$ref) : IsMappedResult$1(type) ? KeyOfFromMappedResult(type, options) : KeyOfFromType(type, options);
}
function FromProperties$d(properties, options) {
  const result = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(properties))
    result[K2] = KeyOf(properties[K2], Clone$1(options));
  return result;
}
function FromMappedResult$7(mappedResult, options) {
  return FromProperties$d(mappedResult.properties, options);
}
function KeyOfFromMappedResult(mappedResult, options) {
  const properties = FromMappedResult$7(mappedResult, options);
  return MappedResult(properties);
}
function KeyOfPropertyEntries(schema) {
  const keys = KeyOfPropertyKeys(schema);
  const schemas = IndexFromPropertyKeys(schema, keys);
  return keys.map((_, index) => [keys[index], schemas[index]]);
}
function CompositeKeys(T) {
  const Acc = [];
  for (const L of T)
    Acc.push(...KeyOfPropertyKeys(L));
  return SetDistinct(Acc);
}
function FilterNever(T) {
  return T.filter((L) => !IsNever$1(L));
}
function CompositeProperty(T, K) {
  const Acc = [];
  for (const L of T)
    Acc.push(...IndexFromPropertyKeys(L, [K]));
  return FilterNever(Acc);
}
function CompositeProperties(T, K) {
  const Acc = {};
  for (const L of K) {
    Acc[L] = IntersectEvaluated(CompositeProperty(T, L));
  }
  return Acc;
}
function Composite(T, options) {
  const K = CompositeKeys(T);
  const P = CompositeProperties(T, K);
  const R = Object$1(P, options);
  return R;
}
function Date$1(options) {
  return CreateType({ [Kind$1]: "Date", type: "Date" }, options);
}
function Null(options) {
  return CreateType({ [Kind$1]: "Null", type: "null" }, options);
}
function Symbol$1(options) {
  return CreateType({ [Kind$1]: "Symbol", type: "symbol" }, options);
}
function Undefined(options) {
  return CreateType({ [Kind$1]: "Undefined", type: "undefined" }, options);
}
function Uint8Array$1(options) {
  return CreateType({ [Kind$1]: "Uint8Array", type: "Uint8Array" }, options);
}
function Unknown(options) {
  return CreateType({ [Kind$1]: "Unknown" }, options);
}
function FromArray$c(T) {
  return T.map((L) => FromValue$1(L, false));
}
function FromProperties$c(value) {
  const Acc = {};
  for (const K of globalThis.Object.getOwnPropertyNames(value))
    Acc[K] = Readonly(FromValue$1(value[K], false));
  return Acc;
}
function ConditionalReadonly(T, root) {
  return root === true ? T : Readonly(T);
}
function FromValue$1(value, root) {
  return IsAsyncIterator$3(value) ? ConditionalReadonly(Any(), root) : IsIterator$3(value) ? ConditionalReadonly(Any(), root) : IsArray$3(value) ? Readonly(Tuple(FromArray$c(value))) : IsUint8Array$3(value) ? Uint8Array$1() : IsDate$3(value) ? Date$1() : IsObject$3(value) ? ConditionalReadonly(Object$1(FromProperties$c(value)), root) : IsFunction$3(value) ? ConditionalReadonly(Function$1([], Unknown()), root) : IsUndefined$3(value) ? Undefined() : IsNull$3(value) ? Null() : IsSymbol$3(value) ? Symbol$1() : IsBigInt$3(value) ? BigInt$1() : IsNumber$3(value) ? Literal(value) : IsBoolean$3(value) ? Literal(value) : IsString$3(value) ? Literal(value) : Object$1({});
}
function Const(T, options) {
  return CreateType(FromValue$1(T, true), options);
}
function ConstructorParameters(schema, options) {
  return IsConstructor$1(schema) ? Tuple(schema.parameters, options) : Never(options);
}
function Enum(item, options) {
  if (IsUndefined$3(item))
    throw new Error("Enum undefined or empty");
  const values1 = globalThis.Object.getOwnPropertyNames(item).filter((key) => isNaN(key)).map((key) => item[key]);
  const values2 = [...new Set(values1)];
  const anyOf = values2.map((value) => Literal(value));
  return Union$1(anyOf, { ...options, [Hint$1]: "Enum" });
}
class ExtendsResolverError extends TypeBoxError {
}
var ExtendsResult;
(function(ExtendsResult2) {
  ExtendsResult2[ExtendsResult2["Union"] = 0] = "Union";
  ExtendsResult2[ExtendsResult2["True"] = 1] = "True";
  ExtendsResult2[ExtendsResult2["False"] = 2] = "False";
})(ExtendsResult || (ExtendsResult = {}));
function IntoBooleanResult(result) {
  return result === ExtendsResult.False ? result : ExtendsResult.True;
}
function Throw(message) {
  throw new ExtendsResolverError(message);
}
function IsStructuralRight(right) {
  return IsNever(right) || IsIntersect(right) || IsUnion(right) || IsUnknown(right) || IsAny(right);
}
function StructuralRight(left, right) {
  return IsNever(right) ? FromNeverRight() : IsIntersect(right) ? FromIntersectRight(left, right) : IsUnion(right) ? FromUnionRight(left, right) : IsUnknown(right) ? FromUnknownRight() : IsAny(right) ? FromAnyRight() : Throw("StructuralRight");
}
function FromAnyRight(left, right) {
  return ExtendsResult.True;
}
function FromAny$3(left, right) {
  return IsIntersect(right) ? FromIntersectRight(left, right) : IsUnion(right) && right.anyOf.some((schema) => IsAny(schema) || IsUnknown(schema)) ? ExtendsResult.True : IsUnion(right) ? ExtendsResult.Union : IsUnknown(right) ? ExtendsResult.True : IsAny(right) ? ExtendsResult.True : ExtendsResult.Union;
}
function FromArrayRight(left, right) {
  return IsUnknown(left) ? ExtendsResult.False : IsAny(left) ? ExtendsResult.Union : IsNever(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromArray$b(left, right) {
  return IsObject(right) && IsObjectArrayLike(right) ? ExtendsResult.True : IsStructuralRight(right) ? StructuralRight(left, right) : !IsArray(right) ? ExtendsResult.False : IntoBooleanResult(Visit$9(left.items, right.items));
}
function FromAsyncIterator$6(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : !IsAsyncIterator(right) ? ExtendsResult.False : IntoBooleanResult(Visit$9(left.items, right.items));
}
function FromBigInt$3(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject(right) ? FromObjectRight(left, right) : IsRecord(right) ? FromRecordRight(left, right) : IsBigInt(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromBooleanRight(left, right) {
  return IsLiteralBoolean(left) ? ExtendsResult.True : IsBoolean(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromBoolean$3(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject(right) ? FromObjectRight(left, right) : IsRecord(right) ? FromRecordRight(left, right) : IsBoolean(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromConstructor$6(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject(right) ? FromObjectRight(left, right) : !IsConstructor(right) ? ExtendsResult.False : left.parameters.length > right.parameters.length ? ExtendsResult.False : !left.parameters.every((schema, index) => IntoBooleanResult(Visit$9(right.parameters[index], schema)) === ExtendsResult.True) ? ExtendsResult.False : IntoBooleanResult(Visit$9(left.returns, right.returns));
}
function FromDate$5(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject(right) ? FromObjectRight(left, right) : IsRecord(right) ? FromRecordRight(left, right) : IsDate(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromFunction$6(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject(right) ? FromObjectRight(left, right) : !IsFunction(right) ? ExtendsResult.False : left.parameters.length > right.parameters.length ? ExtendsResult.False : !left.parameters.every((schema, index) => IntoBooleanResult(Visit$9(right.parameters[index], schema)) === ExtendsResult.True) ? ExtendsResult.False : IntoBooleanResult(Visit$9(left.returns, right.returns));
}
function FromIntegerRight(left, right) {
  return IsLiteral(left) && IsNumber$3(left.const) ? ExtendsResult.True : IsNumber(left) || IsInteger(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromInteger$3(left, right) {
  return IsInteger(right) || IsNumber(right) ? ExtendsResult.True : IsStructuralRight(right) ? StructuralRight(left, right) : IsObject(right) ? FromObjectRight(left, right) : IsRecord(right) ? FromRecordRight(left, right) : ExtendsResult.False;
}
function FromIntersectRight(left, right) {
  return right.allOf.every((schema) => Visit$9(left, schema) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
}
function FromIntersect$c(left, right) {
  return left.allOf.some((schema) => Visit$9(schema, right) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
}
function FromIterator$6(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : !IsIterator(right) ? ExtendsResult.False : IntoBooleanResult(Visit$9(left.items, right.items));
}
function FromLiteral$3(left, right) {
  return IsLiteral(right) && right.const === left.const ? ExtendsResult.True : IsStructuralRight(right) ? StructuralRight(left, right) : IsObject(right) ? FromObjectRight(left, right) : IsRecord(right) ? FromRecordRight(left, right) : IsString(right) ? FromStringRight(left) : IsNumber(right) ? FromNumberRight(left) : IsInteger(right) ? FromIntegerRight(left) : IsBoolean(right) ? FromBooleanRight(left) : ExtendsResult.False;
}
function FromNeverRight(left, right) {
  return ExtendsResult.False;
}
function FromNever$3(left, right) {
  return ExtendsResult.True;
}
function UnwrapTNot(schema) {
  let [current, depth] = [schema, 0];
  while (true) {
    if (!IsNot(current))
      break;
    current = current.not;
    depth += 1;
  }
  return depth % 2 === 0 ? current : Unknown();
}
function FromNot$6(left, right) {
  return IsNot(left) ? Visit$9(UnwrapTNot(left), right) : IsNot(right) ? Visit$9(left, UnwrapTNot(right)) : Throw("Invalid fallthrough for Not");
}
function FromNull$3(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject(right) ? FromObjectRight(left, right) : IsRecord(right) ? FromRecordRight(left, right) : IsNull(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromNumberRight(left, right) {
  return IsLiteralNumber(left) ? ExtendsResult.True : IsNumber(left) || IsInteger(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromNumber$3(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject(right) ? FromObjectRight(left, right) : IsRecord(right) ? FromRecordRight(left, right) : IsInteger(right) || IsNumber(right) ? ExtendsResult.True : ExtendsResult.False;
}
function IsObjectPropertyCount(schema, count) {
  return Object.getOwnPropertyNames(schema.properties).length === count;
}
function IsObjectStringLike(schema) {
  return IsObjectArrayLike(schema);
}
function IsObjectSymbolLike(schema) {
  return IsObjectPropertyCount(schema, 0) || IsObjectPropertyCount(schema, 1) && "description" in schema.properties && IsUnion(schema.properties.description) && schema.properties.description.anyOf.length === 2 && (IsString(schema.properties.description.anyOf[0]) && IsUndefined(schema.properties.description.anyOf[1]) || IsString(schema.properties.description.anyOf[1]) && IsUndefined(schema.properties.description.anyOf[0]));
}
function IsObjectNumberLike(schema) {
  return IsObjectPropertyCount(schema, 0);
}
function IsObjectBooleanLike(schema) {
  return IsObjectPropertyCount(schema, 0);
}
function IsObjectBigIntLike(schema) {
  return IsObjectPropertyCount(schema, 0);
}
function IsObjectDateLike(schema) {
  return IsObjectPropertyCount(schema, 0);
}
function IsObjectUint8ArrayLike(schema) {
  return IsObjectArrayLike(schema);
}
function IsObjectFunctionLike(schema) {
  const length = Number$1();
  return IsObjectPropertyCount(schema, 0) || IsObjectPropertyCount(schema, 1) && "length" in schema.properties && IntoBooleanResult(Visit$9(schema.properties["length"], length)) === ExtendsResult.True;
}
function IsObjectConstructorLike(schema) {
  return IsObjectPropertyCount(schema, 0);
}
function IsObjectArrayLike(schema) {
  const length = Number$1();
  return IsObjectPropertyCount(schema, 0) || IsObjectPropertyCount(schema, 1) && "length" in schema.properties && IntoBooleanResult(Visit$9(schema.properties["length"], length)) === ExtendsResult.True;
}
function IsObjectPromiseLike(schema) {
  const then = Function$1([Any()], Any());
  return IsObjectPropertyCount(schema, 0) || IsObjectPropertyCount(schema, 1) && "then" in schema.properties && IntoBooleanResult(Visit$9(schema.properties["then"], then)) === ExtendsResult.True;
}
function Property(left, right) {
  return Visit$9(left, right) === ExtendsResult.False ? ExtendsResult.False : IsOptional(left) && !IsOptional(right) ? ExtendsResult.False : ExtendsResult.True;
}
function FromObjectRight(left, right) {
  return IsUnknown(left) ? ExtendsResult.False : IsAny(left) ? ExtendsResult.Union : IsNever(left) || IsLiteralString(left) && IsObjectStringLike(right) || IsLiteralNumber(left) && IsObjectNumberLike(right) || IsLiteralBoolean(left) && IsObjectBooleanLike(right) || IsSymbol(left) && IsObjectSymbolLike(right) || IsBigInt(left) && IsObjectBigIntLike(right) || IsString(left) && IsObjectStringLike(right) || IsSymbol(left) && IsObjectSymbolLike(right) || IsNumber(left) && IsObjectNumberLike(right) || IsInteger(left) && IsObjectNumberLike(right) || IsBoolean(left) && IsObjectBooleanLike(right) || IsUint8Array(left) && IsObjectUint8ArrayLike(right) || IsDate(left) && IsObjectDateLike(right) || IsConstructor(left) && IsObjectConstructorLike(right) || IsFunction(left) && IsObjectFunctionLike(right) ? ExtendsResult.True : IsRecord(left) && IsString(RecordKey$1(left)) ? (() => {
    return right[Hint$1] === "Record" ? ExtendsResult.True : ExtendsResult.False;
  })() : IsRecord(left) && IsNumber(RecordKey$1(left)) ? (() => {
    return IsObjectPropertyCount(right, 0) ? ExtendsResult.True : ExtendsResult.False;
  })() : ExtendsResult.False;
}
function FromObject$f(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsRecord(right) ? FromRecordRight(left, right) : !IsObject(right) ? ExtendsResult.False : (() => {
    for (const key of Object.getOwnPropertyNames(right.properties)) {
      if (!(key in left.properties) && !IsOptional(right.properties[key])) {
        return ExtendsResult.False;
      }
      if (IsOptional(right.properties[key])) {
        return ExtendsResult.True;
      }
      if (Property(left.properties[key], right.properties[key]) === ExtendsResult.False) {
        return ExtendsResult.False;
      }
    }
    return ExtendsResult.True;
  })();
}
function FromPromise$5(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject(right) && IsObjectPromiseLike(right) ? ExtendsResult.True : !IsPromise(right) ? ExtendsResult.False : IntoBooleanResult(Visit$9(left.item, right.item));
}
function RecordKey$1(schema) {
  return PatternNumberExact in schema.patternProperties ? Number$1() : PatternStringExact in schema.patternProperties ? String$1() : Throw("Unknown record key pattern");
}
function RecordValue$1(schema) {
  return PatternNumberExact in schema.patternProperties ? schema.patternProperties[PatternNumberExact] : PatternStringExact in schema.patternProperties ? schema.patternProperties[PatternStringExact] : Throw("Unable to get record value schema");
}
function FromRecordRight(left, right) {
  const [Key, Value] = [RecordKey$1(right), RecordValue$1(right)];
  return IsLiteralString(left) && IsNumber(Key) && IntoBooleanResult(Visit$9(left, Value)) === ExtendsResult.True ? ExtendsResult.True : IsUint8Array(left) && IsNumber(Key) ? Visit$9(left, Value) : IsString(left) && IsNumber(Key) ? Visit$9(left, Value) : IsArray(left) && IsNumber(Key) ? Visit$9(left, Value) : IsObject(left) ? (() => {
    for (const key of Object.getOwnPropertyNames(left.properties)) {
      if (Property(Value, left.properties[key]) === ExtendsResult.False) {
        return ExtendsResult.False;
      }
    }
    return ExtendsResult.True;
  })() : ExtendsResult.False;
}
function FromRecord$a(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject(right) ? FromObjectRight(left, right) : !IsRecord(right) ? ExtendsResult.False : Visit$9(RecordValue$1(left), RecordValue$1(right));
}
function FromRegExp$3(left, right) {
  const L = IsRegExp(left) ? String$1() : left;
  const R = IsRegExp(right) ? String$1() : right;
  return Visit$9(L, R);
}
function FromStringRight(left, right) {
  return IsLiteral(left) && IsString$3(left.const) ? ExtendsResult.True : IsString(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromString$3(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject(right) ? FromObjectRight(left, right) : IsRecord(right) ? FromRecordRight(left, right) : IsString(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromSymbol$3(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject(right) ? FromObjectRight(left, right) : IsRecord(right) ? FromRecordRight(left, right) : IsSymbol(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromTemplateLiteral$4(left, right) {
  return IsTemplateLiteral(left) ? Visit$9(TemplateLiteralToUnion(left), right) : IsTemplateLiteral(right) ? Visit$9(left, TemplateLiteralToUnion(right)) : Throw("Invalid fallthrough for TemplateLiteral");
}
function IsArrayOfTuple(left, right) {
  return IsArray(right) && left.items !== void 0 && left.items.every((schema) => Visit$9(schema, right.items) === ExtendsResult.True);
}
function FromTupleRight(left, right) {
  return IsNever(left) ? ExtendsResult.True : IsUnknown(left) ? ExtendsResult.False : IsAny(left) ? ExtendsResult.Union : ExtendsResult.False;
}
function FromTuple$a(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject(right) && IsObjectArrayLike(right) ? ExtendsResult.True : IsArray(right) && IsArrayOfTuple(left, right) ? ExtendsResult.True : !IsTuple(right) ? ExtendsResult.False : IsUndefined$3(left.items) && !IsUndefined$3(right.items) || !IsUndefined$3(left.items) && IsUndefined$3(right.items) ? ExtendsResult.False : IsUndefined$3(left.items) && !IsUndefined$3(right.items) ? ExtendsResult.True : left.items.every((schema, index) => Visit$9(schema, right.items[index]) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
}
function FromUint8Array$3(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject(right) ? FromObjectRight(left, right) : IsRecord(right) ? FromRecordRight(left, right) : IsUint8Array(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromUndefined$3(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject(right) ? FromObjectRight(left, right) : IsRecord(right) ? FromRecordRight(left, right) : IsVoid(right) ? FromVoidRight(left) : IsUndefined(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromUnionRight(left, right) {
  return right.anyOf.some((schema) => Visit$9(left, schema) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
}
function FromUnion$c(left, right) {
  return left.anyOf.every((schema) => Visit$9(schema, right) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
}
function FromUnknownRight(left, right) {
  return ExtendsResult.True;
}
function FromUnknown$3(left, right) {
  return IsNever(right) ? FromNeverRight() : IsIntersect(right) ? FromIntersectRight(left, right) : IsUnion(right) ? FromUnionRight(left, right) : IsAny(right) ? FromAnyRight() : IsString(right) ? FromStringRight(left) : IsNumber(right) ? FromNumberRight(left) : IsInteger(right) ? FromIntegerRight(left) : IsBoolean(right) ? FromBooleanRight(left) : IsArray(right) ? FromArrayRight(left) : IsTuple(right) ? FromTupleRight(left) : IsObject(right) ? FromObjectRight(left, right) : IsUnknown(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromVoidRight(left, right) {
  return IsUndefined(left) ? ExtendsResult.True : IsUndefined(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromVoid$3(left, right) {
  return IsIntersect(right) ? FromIntersectRight(left, right) : IsUnion(right) ? FromUnionRight(left, right) : IsUnknown(right) ? FromUnknownRight() : IsAny(right) ? FromAnyRight() : IsObject(right) ? FromObjectRight(left, right) : IsVoid(right) ? ExtendsResult.True : ExtendsResult.False;
}
function Visit$9(left, right) {
  return (
    // resolvable
    IsTemplateLiteral(left) || IsTemplateLiteral(right) ? FromTemplateLiteral$4(left, right) : IsRegExp(left) || IsRegExp(right) ? FromRegExp$3(left, right) : IsNot(left) || IsNot(right) ? FromNot$6(left, right) : (
      // standard
      IsAny(left) ? FromAny$3(left, right) : IsArray(left) ? FromArray$b(left, right) : IsBigInt(left) ? FromBigInt$3(left, right) : IsBoolean(left) ? FromBoolean$3(left, right) : IsAsyncIterator(left) ? FromAsyncIterator$6(left, right) : IsConstructor(left) ? FromConstructor$6(left, right) : IsDate(left) ? FromDate$5(left, right) : IsFunction(left) ? FromFunction$6(left, right) : IsInteger(left) ? FromInteger$3(left, right) : IsIntersect(left) ? FromIntersect$c(left, right) : IsIterator(left) ? FromIterator$6(left, right) : IsLiteral(left) ? FromLiteral$3(left, right) : IsNever(left) ? FromNever$3() : IsNull(left) ? FromNull$3(left, right) : IsNumber(left) ? FromNumber$3(left, right) : IsObject(left) ? FromObject$f(left, right) : IsRecord(left) ? FromRecord$a(left, right) : IsString(left) ? FromString$3(left, right) : IsSymbol(left) ? FromSymbol$3(left, right) : IsTuple(left) ? FromTuple$a(left, right) : IsPromise(left) ? FromPromise$5(left, right) : IsUint8Array(left) ? FromUint8Array$3(left, right) : IsUndefined(left) ? FromUndefined$3(left, right) : IsUnion(left) ? FromUnion$c(left, right) : IsUnknown(left) ? FromUnknown$3(left, right) : IsVoid(left) ? FromVoid$3(left, right) : Throw(`Unknown left type operand '${left[Kind$1]}'`)
    )
  );
}
function ExtendsCheck(left, right) {
  return Visit$9(left, right);
}
function FromProperties$b(P, Right, True, False, options) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(P))
    Acc[K2] = Extends(P[K2], Right, True, False, Clone$1(options));
  return Acc;
}
function FromMappedResult$6(Left, Right, True, False, options) {
  return FromProperties$b(Left.properties, Right, True, False, options);
}
function ExtendsFromMappedResult(Left, Right, True, False, options) {
  const P = FromMappedResult$6(Left, Right, True, False, options);
  return MappedResult(P);
}
function ExtendsResolve(left, right, trueType, falseType) {
  const R = ExtendsCheck(left, right);
  return R === ExtendsResult.Union ? Union$1([trueType, falseType]) : R === ExtendsResult.True ? trueType : falseType;
}
function Extends(L, R, T, F, options) {
  return IsMappedResult$1(L) ? ExtendsFromMappedResult(L, R, T, F, options) : IsMappedKey$1(L) ? CreateType(ExtendsFromMappedKey(L, R, T, F, options)) : CreateType(ExtendsResolve(L, R, T, F), options);
}
function FromPropertyKey$2(K, U, L, R, options) {
  return {
    [K]: Extends(Literal(K), U, L, R, Clone$1(options))
  };
}
function FromPropertyKeys$2(K, U, L, R, options) {
  return K.reduce((Acc, LK) => {
    return { ...Acc, ...FromPropertyKey$2(LK, U, L, R, options) };
  }, {});
}
function FromMappedKey$2(K, U, L, R, options) {
  return FromPropertyKeys$2(K.keys, U, L, R, options);
}
function ExtendsFromMappedKey(T, U, L, R, options) {
  const P = FromMappedKey$2(T, U, L, R, options);
  return MappedResult(P);
}
function Intersect(schema) {
  return schema.allOf.every((schema2) => ExtendsUndefinedCheck(schema2));
}
function Union(schema) {
  return schema.anyOf.some((schema2) => ExtendsUndefinedCheck(schema2));
}
function Not$1(schema) {
  return !ExtendsUndefinedCheck(schema.not);
}
function ExtendsUndefinedCheck(schema) {
  return schema[Kind$1] === "Intersect" ? Intersect(schema) : schema[Kind$1] === "Union" ? Union(schema) : schema[Kind$1] === "Not" ? Not$1(schema) : schema[Kind$1] === "Undefined" ? true : false;
}
function ExcludeFromTemplateLiteral(L, R) {
  return Exclude(TemplateLiteralToUnion(L), R);
}
function ExcludeRest(L, R) {
  const excluded = L.filter((inner) => ExtendsCheck(inner, R) === ExtendsResult.False);
  return excluded.length === 1 ? excluded[0] : Union$1(excluded);
}
function Exclude(L, R, options = {}) {
  if (IsTemplateLiteral$1(L))
    return CreateType(ExcludeFromTemplateLiteral(L, R), options);
  if (IsMappedResult$1(L))
    return CreateType(ExcludeFromMappedResult(L, R), options);
  return CreateType(IsUnion$1(L) ? ExcludeRest(L.anyOf, R) : ExtendsCheck(L, R) !== ExtendsResult.False ? Never() : L, options);
}
function FromProperties$a(P, U) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(P))
    Acc[K2] = Exclude(P[K2], U);
  return Acc;
}
function FromMappedResult$5(R, T) {
  return FromProperties$a(R.properties, T);
}
function ExcludeFromMappedResult(R, T) {
  const P = FromMappedResult$5(R, T);
  return MappedResult(P);
}
function ExtractFromTemplateLiteral(L, R) {
  return Extract(TemplateLiteralToUnion(L), R);
}
function ExtractRest(L, R) {
  const extracted = L.filter((inner) => ExtendsCheck(inner, R) !== ExtendsResult.False);
  return extracted.length === 1 ? extracted[0] : Union$1(extracted);
}
function Extract(L, R, options) {
  if (IsTemplateLiteral$1(L))
    return CreateType(ExtractFromTemplateLiteral(L, R), options);
  if (IsMappedResult$1(L))
    return CreateType(ExtractFromMappedResult(L, R), options);
  return CreateType(IsUnion$1(L) ? ExtractRest(L.anyOf, R) : ExtendsCheck(L, R) !== ExtendsResult.False ? L : Never(), options);
}
function FromProperties$9(P, T) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(P))
    Acc[K2] = Extract(P[K2], T);
  return Acc;
}
function FromMappedResult$4(R, T) {
  return FromProperties$9(R.properties, T);
}
function ExtractFromMappedResult(R, T) {
  const P = FromMappedResult$4(R, T);
  return MappedResult(P);
}
function InstanceType(schema, options) {
  return IsConstructor$1(schema) ? CreateType(schema.returns, options) : Never(options);
}
function ReadonlyOptional(schema) {
  return Readonly(Optional(schema));
}
function RecordCreateFromPattern(pattern, T, options) {
  return CreateType({ [Kind$1]: "Record", type: "object", patternProperties: { [pattern]: T } }, options);
}
function RecordCreateFromKeys(K, T, options) {
  const result = {};
  for (const K2 of K)
    result[K2] = T;
  return Object$1(result, { ...options, [Hint$1]: "Record" });
}
function FromTemplateLiteralKey(K, T, options) {
  return IsTemplateLiteralFinite(K) ? RecordCreateFromKeys(IndexPropertyKeys(K), T, options) : RecordCreateFromPattern(K.pattern, T, options);
}
function FromUnionKey(key, type, options) {
  return RecordCreateFromKeys(IndexPropertyKeys(Union$1(key)), type, options);
}
function FromLiteralKey(key, type, options) {
  return RecordCreateFromKeys([key.toString()], type, options);
}
function FromRegExpKey(key, type, options) {
  return RecordCreateFromPattern(key.source, type, options);
}
function FromStringKey(key, type, options) {
  const pattern = IsUndefined$3(key.pattern) ? PatternStringExact : key.pattern;
  return RecordCreateFromPattern(pattern, type, options);
}
function FromAnyKey(_, type, options) {
  return RecordCreateFromPattern(PatternStringExact, type, options);
}
function FromNeverKey(_key, type, options) {
  return RecordCreateFromPattern(PatternNeverExact, type, options);
}
function FromBooleanKey(_key, type, options) {
  return Object$1({ true: type, false: type }, options);
}
function FromIntegerKey(_key, type, options) {
  return RecordCreateFromPattern(PatternNumberExact, type, options);
}
function FromNumberKey(_, type, options) {
  return RecordCreateFromPattern(PatternNumberExact, type, options);
}
function Record(key, type, options = {}) {
  return IsUnion$1(key) ? FromUnionKey(key.anyOf, type, options) : IsTemplateLiteral$1(key) ? FromTemplateLiteralKey(key, type, options) : IsLiteral$1(key) ? FromLiteralKey(key.const, type, options) : IsBoolean$1(key) ? FromBooleanKey(key, type, options) : IsInteger$1(key) ? FromIntegerKey(key, type, options) : IsNumber$1(key) ? FromNumberKey(key, type, options) : IsRegExp$1(key) ? FromRegExpKey(key, type, options) : IsString$1(key) ? FromStringKey(key, type, options) : IsAny$1(key) ? FromAnyKey(key, type, options) : IsNever$1(key) ? FromNeverKey(key, type, options) : Never(options);
}
function RecordPattern(record) {
  return globalThis.Object.getOwnPropertyNames(record.patternProperties)[0];
}
function RecordKey(type) {
  const pattern = RecordPattern(type);
  return pattern === PatternStringExact ? String$1() : pattern === PatternNumberExact ? Number$1() : String$1({ pattern });
}
function RecordValue(type) {
  return type.patternProperties[RecordPattern(type)];
}
function FromConstructor$5(args, type) {
  type.parameters = FromTypes$1(args, type.parameters);
  type.returns = FromType$1(args, type.returns);
  return type;
}
function FromFunction$5(args, type) {
  type.parameters = FromTypes$1(args, type.parameters);
  type.returns = FromType$1(args, type.returns);
  return type;
}
function FromIntersect$b(args, type) {
  type.allOf = FromTypes$1(args, type.allOf);
  return type;
}
function FromUnion$b(args, type) {
  type.anyOf = FromTypes$1(args, type.anyOf);
  return type;
}
function FromTuple$9(args, type) {
  if (IsUndefined$3(type.items))
    return type;
  type.items = FromTypes$1(args, type.items);
  return type;
}
function FromArray$a(args, type) {
  type.items = FromType$1(args, type.items);
  return type;
}
function FromAsyncIterator$5(args, type) {
  type.items = FromType$1(args, type.items);
  return type;
}
function FromIterator$5(args, type) {
  type.items = FromType$1(args, type.items);
  return type;
}
function FromPromise$4(args, type) {
  type.item = FromType$1(args, type.item);
  return type;
}
function FromObject$e(args, type) {
  const mappedProperties = FromProperties$8(args, type.properties);
  return { ...type, ...Object$1(mappedProperties) };
}
function FromRecord$9(args, type) {
  const mappedKey = FromType$1(args, RecordKey(type));
  const mappedValue = FromType$1(args, RecordValue(type));
  const result = Record(mappedKey, mappedValue);
  return { ...type, ...result };
}
function FromArgument$3(args, argument) {
  return argument.index in args ? args[argument.index] : Unknown();
}
function FromProperty$1(args, type) {
  const isReadonly = IsReadonly(type);
  const isOptional2 = IsOptional$1(type);
  const mapped = FromType$1(args, type);
  return isReadonly && isOptional2 ? ReadonlyOptional(mapped) : isReadonly && !isOptional2 ? Readonly(mapped) : !isReadonly && isOptional2 ? Optional(mapped) : mapped;
}
function FromProperties$8(args, properties) {
  return globalThis.Object.getOwnPropertyNames(properties).reduce((result, key) => {
    return { ...result, [key]: FromProperty$1(args, properties[key]) };
  }, {});
}
function FromTypes$1(args, types2) {
  return types2.map((type) => FromType$1(args, type));
}
function FromType$1(args, type) {
  return IsConstructor$1(type) ? FromConstructor$5(args, type) : IsFunction$1(type) ? FromFunction$5(args, type) : IsIntersect$1(type) ? FromIntersect$b(args, type) : IsUnion$1(type) ? FromUnion$b(args, type) : IsTuple$1(type) ? FromTuple$9(args, type) : IsArray$1(type) ? FromArray$a(args, type) : IsAsyncIterator$1(type) ? FromAsyncIterator$5(args, type) : IsIterator$1(type) ? FromIterator$5(args, type) : IsPromise$1(type) ? FromPromise$4(args, type) : IsObject$1(type) ? FromObject$e(args, type) : IsRecord$1(type) ? FromRecord$9(args, type) : IsArgument$1(type) ? FromArgument$3(args, type) : type;
}
function Instantiate(type, args) {
  return FromType$1(args, CloneType(type));
}
function Integer(options) {
  return CreateType({ [Kind$1]: "Integer", type: "integer" }, options);
}
function MappedIntrinsicPropertyKey(K, M, options) {
  return {
    [K]: Intrinsic(Literal(K), M, Clone$1(options))
  };
}
function MappedIntrinsicPropertyKeys(K, M, options) {
  const result = K.reduce((Acc, L) => {
    return { ...Acc, ...MappedIntrinsicPropertyKey(L, M, options) };
  }, {});
  return result;
}
function MappedIntrinsicProperties(T, M, options) {
  return MappedIntrinsicPropertyKeys(T["keys"], M, options);
}
function IntrinsicFromMappedKey(T, M, options) {
  const P = MappedIntrinsicProperties(T, M, options);
  return MappedResult(P);
}
function ApplyUncapitalize(value) {
  const [first, rest] = [value.slice(0, 1), value.slice(1)];
  return [first.toLowerCase(), rest].join("");
}
function ApplyCapitalize(value) {
  const [first, rest] = [value.slice(0, 1), value.slice(1)];
  return [first.toUpperCase(), rest].join("");
}
function ApplyUppercase(value) {
  return value.toUpperCase();
}
function ApplyLowercase(value) {
  return value.toLowerCase();
}
function FromTemplateLiteral$3(schema, mode, options) {
  const expression = TemplateLiteralParseExact(schema.pattern);
  const finite = IsTemplateLiteralExpressionFinite(expression);
  if (!finite)
    return { ...schema, pattern: FromLiteralValue(schema.pattern, mode) };
  const strings = [...TemplateLiteralExpressionGenerate(expression)];
  const literals = strings.map((value) => Literal(value));
  const mapped = FromRest$2(literals, mode);
  const union = Union$1(mapped);
  return TemplateLiteral([union], options);
}
function FromLiteralValue(value, mode) {
  return typeof value === "string" ? mode === "Uncapitalize" ? ApplyUncapitalize(value) : mode === "Capitalize" ? ApplyCapitalize(value) : mode === "Uppercase" ? ApplyUppercase(value) : mode === "Lowercase" ? ApplyLowercase(value) : value : value.toString();
}
function FromRest$2(T, M) {
  return T.map((L) => Intrinsic(L, M));
}
function Intrinsic(schema, mode, options = {}) {
  return (
    // Intrinsic-Mapped-Inference
    IsMappedKey$1(schema) ? IntrinsicFromMappedKey(schema, mode, options) : (
      // Standard-Inference
      IsTemplateLiteral$1(schema) ? FromTemplateLiteral$3(schema, mode, options) : IsUnion$1(schema) ? Union$1(FromRest$2(schema.anyOf, mode), options) : IsLiteral$1(schema) ? Literal(FromLiteralValue(schema.const, mode), options) : (
        // Default Type
        CreateType(schema, options)
      )
    )
  );
}
function Capitalize(T, options = {}) {
  return Intrinsic(T, "Capitalize", options);
}
function Lowercase(T, options = {}) {
  return Intrinsic(T, "Lowercase", options);
}
function Uncapitalize(T, options = {}) {
  return Intrinsic(T, "Uncapitalize", options);
}
function Uppercase(T, options = {}) {
  return Intrinsic(T, "Uppercase", options);
}
function FromProperties$7(properties, propertyKeys, options) {
  const result = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(properties))
    result[K2] = Omit(properties[K2], propertyKeys, Clone$1(options));
  return result;
}
function FromMappedResult$3(mappedResult, propertyKeys, options) {
  return FromProperties$7(mappedResult.properties, propertyKeys, options);
}
function OmitFromMappedResult(mappedResult, propertyKeys, options) {
  const properties = FromMappedResult$3(mappedResult, propertyKeys, options);
  return MappedResult(properties);
}
function FromIntersect$a(types2, propertyKeys) {
  return types2.map((type) => OmitResolve(type, propertyKeys));
}
function FromUnion$a(types2, propertyKeys) {
  return types2.map((type) => OmitResolve(type, propertyKeys));
}
function FromProperty(properties, key) {
  const { [key]: _, ...R } = properties;
  return R;
}
function FromProperties$6(properties, propertyKeys) {
  return propertyKeys.reduce((T, K2) => FromProperty(T, K2), properties);
}
function FromObject$d(type, propertyKeys, properties) {
  const options = Discard(type, [TransformKind, "$id", "required", "properties"]);
  const mappedProperties = FromProperties$6(properties, propertyKeys);
  return Object$1(mappedProperties, options);
}
function UnionFromPropertyKeys$1(propertyKeys) {
  const result = propertyKeys.reduce((result2, key) => IsLiteralValue$1(key) ? [...result2, Literal(key)] : result2, []);
  return Union$1(result);
}
function OmitResolve(type, propertyKeys) {
  return IsIntersect$1(type) ? Intersect$1(FromIntersect$a(type.allOf, propertyKeys)) : IsUnion$1(type) ? Union$1(FromUnion$a(type.anyOf, propertyKeys)) : IsObject$1(type) ? FromObject$d(type, propertyKeys, type.properties) : Object$1({});
}
function Omit(type, key, options) {
  const typeKey = IsArray$3(key) ? UnionFromPropertyKeys$1(key) : key;
  const propertyKeys = IsSchema$1(key) ? IndexPropertyKeys(key) : key;
  const isTypeRef = IsRef$1(type);
  const isKeyRef = IsRef$1(key);
  return IsMappedResult$1(type) ? OmitFromMappedResult(type, propertyKeys, options) : IsMappedKey$1(key) ? OmitFromMappedKey(type, key, options) : isTypeRef && isKeyRef ? Computed("Omit", [type, typeKey], options) : !isTypeRef && isKeyRef ? Computed("Omit", [type, typeKey], options) : isTypeRef && !isKeyRef ? Computed("Omit", [type, typeKey], options) : CreateType({ ...OmitResolve(type, propertyKeys), ...options });
}
function FromPropertyKey$1(type, key, options) {
  return { [key]: Omit(type, [key], Clone$1(options)) };
}
function FromPropertyKeys$1(type, propertyKeys, options) {
  return propertyKeys.reduce((Acc, LK) => {
    return { ...Acc, ...FromPropertyKey$1(type, LK, options) };
  }, {});
}
function FromMappedKey$1(type, mappedKey, options) {
  return FromPropertyKeys$1(type, mappedKey.keys, options);
}
function OmitFromMappedKey(type, mappedKey, options) {
  const properties = FromMappedKey$1(type, mappedKey, options);
  return MappedResult(properties);
}
function FromProperties$5(properties, propertyKeys, options) {
  const result = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(properties))
    result[K2] = Pick(properties[K2], propertyKeys, Clone$1(options));
  return result;
}
function FromMappedResult$2(mappedResult, propertyKeys, options) {
  return FromProperties$5(mappedResult.properties, propertyKeys, options);
}
function PickFromMappedResult(mappedResult, propertyKeys, options) {
  const properties = FromMappedResult$2(mappedResult, propertyKeys, options);
  return MappedResult(properties);
}
function FromIntersect$9(types2, propertyKeys) {
  return types2.map((type) => PickResolve(type, propertyKeys));
}
function FromUnion$9(types2, propertyKeys) {
  return types2.map((type) => PickResolve(type, propertyKeys));
}
function FromProperties$4(properties, propertyKeys) {
  const result = {};
  for (const K2 of propertyKeys)
    if (K2 in properties)
      result[K2] = properties[K2];
  return result;
}
function FromObject$c(Type2, keys, properties) {
  const options = Discard(Type2, [TransformKind, "$id", "required", "properties"]);
  const mappedProperties = FromProperties$4(properties, keys);
  return Object$1(mappedProperties, options);
}
function UnionFromPropertyKeys(propertyKeys) {
  const result = propertyKeys.reduce((result2, key) => IsLiteralValue$1(key) ? [...result2, Literal(key)] : result2, []);
  return Union$1(result);
}
function PickResolve(type, propertyKeys) {
  return IsIntersect$1(type) ? Intersect$1(FromIntersect$9(type.allOf, propertyKeys)) : IsUnion$1(type) ? Union$1(FromUnion$9(type.anyOf, propertyKeys)) : IsObject$1(type) ? FromObject$c(type, propertyKeys, type.properties) : Object$1({});
}
function Pick(type, key, options) {
  const typeKey = IsArray$3(key) ? UnionFromPropertyKeys(key) : key;
  const propertyKeys = IsSchema$1(key) ? IndexPropertyKeys(key) : key;
  const isTypeRef = IsRef$1(type);
  const isKeyRef = IsRef$1(key);
  return IsMappedResult$1(type) ? PickFromMappedResult(type, propertyKeys, options) : IsMappedKey$1(key) ? PickFromMappedKey(type, key, options) : isTypeRef && isKeyRef ? Computed("Pick", [type, typeKey], options) : !isTypeRef && isKeyRef ? Computed("Pick", [type, typeKey], options) : isTypeRef && !isKeyRef ? Computed("Pick", [type, typeKey], options) : CreateType({ ...PickResolve(type, propertyKeys), ...options });
}
function FromPropertyKey(type, key, options) {
  return {
    [key]: Pick(type, [key], Clone$1(options))
  };
}
function FromPropertyKeys(type, propertyKeys, options) {
  return propertyKeys.reduce((result, leftKey) => {
    return { ...result, ...FromPropertyKey(type, leftKey, options) };
  }, {});
}
function FromMappedKey(type, mappedKey, options) {
  return FromPropertyKeys(type, mappedKey.keys, options);
}
function PickFromMappedKey(type, mappedKey, options) {
  const properties = FromMappedKey(type, mappedKey, options);
  return MappedResult(properties);
}
function FromComputed$2(target, parameters) {
  return Computed("Partial", [Computed(target, parameters)]);
}
function FromRef$9($ref) {
  return Computed("Partial", [Ref($ref)]);
}
function FromProperties$3(properties) {
  const partialProperties = {};
  for (const K of globalThis.Object.getOwnPropertyNames(properties))
    partialProperties[K] = Optional(properties[K]);
  return partialProperties;
}
function FromObject$b(type, properties) {
  const options = Discard(type, [TransformKind, "$id", "required", "properties"]);
  const mappedProperties = FromProperties$3(properties);
  return Object$1(mappedProperties, options);
}
function FromRest$1(types2) {
  return types2.map((type) => PartialResolve(type));
}
function PartialResolve(type) {
  return (
    // Mappable
    IsComputed$1(type) ? FromComputed$2(type.target, type.parameters) : IsRef$1(type) ? FromRef$9(type.$ref) : IsIntersect$1(type) ? Intersect$1(FromRest$1(type.allOf)) : IsUnion$1(type) ? Union$1(FromRest$1(type.anyOf)) : IsObject$1(type) ? FromObject$b(type, type.properties) : (
      // Intrinsic
      IsBigInt$1(type) ? type : IsBoolean$1(type) ? type : IsInteger$1(type) ? type : IsLiteral$1(type) ? type : IsNull$1(type) ? type : IsNumber$1(type) ? type : IsString$1(type) ? type : IsSymbol$1(type) ? type : IsUndefined$1(type) ? type : (
        // Passthrough
        Object$1({})
      )
    )
  );
}
function Partial(type, options) {
  if (IsMappedResult$1(type)) {
    return PartialFromMappedResult(type, options);
  } else {
    return CreateType({ ...PartialResolve(type), ...options });
  }
}
function FromProperties$2(K, options) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(K))
    Acc[K2] = Partial(K[K2], Clone$1(options));
  return Acc;
}
function FromMappedResult$1(R, options) {
  return FromProperties$2(R.properties, options);
}
function PartialFromMappedResult(R, options) {
  const P = FromMappedResult$1(R, options);
  return MappedResult(P);
}
function FromComputed$1(target, parameters) {
  return Computed("Required", [Computed(target, parameters)]);
}
function FromRef$8($ref) {
  return Computed("Required", [Ref($ref)]);
}
function FromProperties$1(properties) {
  const requiredProperties = {};
  for (const K of globalThis.Object.getOwnPropertyNames(properties))
    requiredProperties[K] = Discard(properties[K], [OptionalKind]);
  return requiredProperties;
}
function FromObject$a(type, properties) {
  const options = Discard(type, [TransformKind, "$id", "required", "properties"]);
  const mappedProperties = FromProperties$1(properties);
  return Object$1(mappedProperties, options);
}
function FromRest(types2) {
  return types2.map((type) => RequiredResolve(type));
}
function RequiredResolve(type) {
  return (
    // Mappable
    IsComputed$1(type) ? FromComputed$1(type.target, type.parameters) : IsRef$1(type) ? FromRef$8(type.$ref) : IsIntersect$1(type) ? Intersect$1(FromRest(type.allOf)) : IsUnion$1(type) ? Union$1(FromRest(type.anyOf)) : IsObject$1(type) ? FromObject$a(type, type.properties) : (
      // Intrinsic
      IsBigInt$1(type) ? type : IsBoolean$1(type) ? type : IsInteger$1(type) ? type : IsLiteral$1(type) ? type : IsNull$1(type) ? type : IsNumber$1(type) ? type : IsString$1(type) ? type : IsSymbol$1(type) ? type : IsUndefined$1(type) ? type : (
        // Passthrough
        Object$1({})
      )
    )
  );
}
function Required(type, options) {
  if (IsMappedResult$1(type)) {
    return RequiredFromMappedResult(type, options);
  } else {
    return CreateType({ ...RequiredResolve(type), ...options });
  }
}
function FromProperties(P, options) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(P))
    Acc[K2] = Required(P[K2], options);
  return Acc;
}
function FromMappedResult(R, options) {
  return FromProperties(R.properties, options);
}
function RequiredFromMappedResult(R, options) {
  const P = FromMappedResult(R, options);
  return MappedResult(P);
}
function DereferenceParameters(moduleProperties, types2) {
  return types2.map((type) => {
    return IsRef$1(type) ? Dereference(moduleProperties, type.$ref) : FromType(moduleProperties, type);
  });
}
function Dereference(moduleProperties, ref) {
  return ref in moduleProperties ? IsRef$1(moduleProperties[ref]) ? Dereference(moduleProperties, moduleProperties[ref].$ref) : FromType(moduleProperties, moduleProperties[ref]) : Never();
}
function FromAwaited(parameters) {
  return Awaited(parameters[0]);
}
function FromIndex(parameters) {
  return Index(parameters[0], parameters[1]);
}
function FromKeyOf(parameters) {
  return KeyOf(parameters[0]);
}
function FromPartial(parameters) {
  return Partial(parameters[0]);
}
function FromOmit(parameters) {
  return Omit(parameters[0], parameters[1]);
}
function FromPick(parameters) {
  return Pick(parameters[0], parameters[1]);
}
function FromRequired(parameters) {
  return Required(parameters[0]);
}
function FromComputed(moduleProperties, target, parameters) {
  const dereferenced = DereferenceParameters(moduleProperties, parameters);
  return target === "Awaited" ? FromAwaited(dereferenced) : target === "Index" ? FromIndex(dereferenced) : target === "KeyOf" ? FromKeyOf(dereferenced) : target === "Partial" ? FromPartial(dereferenced) : target === "Omit" ? FromOmit(dereferenced) : target === "Pick" ? FromPick(dereferenced) : target === "Required" ? FromRequired(dereferenced) : Never();
}
function FromArray$9(moduleProperties, type) {
  return Array$1(FromType(moduleProperties, type));
}
function FromAsyncIterator$4(moduleProperties, type) {
  return AsyncIterator(FromType(moduleProperties, type));
}
function FromConstructor$4(moduleProperties, parameters, instanceType) {
  return Constructor(FromTypes(moduleProperties, parameters), FromType(moduleProperties, instanceType));
}
function FromFunction$4(moduleProperties, parameters, returnType) {
  return Function$1(FromTypes(moduleProperties, parameters), FromType(moduleProperties, returnType));
}
function FromIntersect$8(moduleProperties, types2) {
  return Intersect$1(FromTypes(moduleProperties, types2));
}
function FromIterator$4(moduleProperties, type) {
  return Iterator(FromType(moduleProperties, type));
}
function FromObject$9(moduleProperties, properties) {
  return Object$1(globalThis.Object.keys(properties).reduce((result, key) => {
    return { ...result, [key]: FromType(moduleProperties, properties[key]) };
  }, {}));
}
function FromRecord$8(moduleProperties, type) {
  const [value, pattern] = [FromType(moduleProperties, RecordValue(type)), RecordPattern(type)];
  const result = CloneType(type);
  result.patternProperties[pattern] = value;
  return result;
}
function FromTransform(moduleProperties, transform) {
  return IsRef$1(transform) ? { ...Dereference(moduleProperties, transform.$ref), [TransformKind]: transform[TransformKind] } : transform;
}
function FromTuple$8(moduleProperties, types2) {
  return Tuple(FromTypes(moduleProperties, types2));
}
function FromUnion$8(moduleProperties, types2) {
  return Union$1(FromTypes(moduleProperties, types2));
}
function FromTypes(moduleProperties, types2) {
  return types2.map((type) => FromType(moduleProperties, type));
}
function FromType(moduleProperties, type) {
  return (
    // Modifiers
    IsOptional$1(type) ? CreateType(FromType(moduleProperties, Discard(type, [OptionalKind])), type) : IsReadonly(type) ? CreateType(FromType(moduleProperties, Discard(type, [ReadonlyKind])), type) : (
      // Transform
      IsTransform$1(type) ? CreateType(FromTransform(moduleProperties, type), type) : (
        // Types
        IsArray$1(type) ? CreateType(FromArray$9(moduleProperties, type.items), type) : IsAsyncIterator$1(type) ? CreateType(FromAsyncIterator$4(moduleProperties, type.items), type) : IsComputed$1(type) ? CreateType(FromComputed(moduleProperties, type.target, type.parameters)) : IsConstructor$1(type) ? CreateType(FromConstructor$4(moduleProperties, type.parameters, type.returns), type) : IsFunction$1(type) ? CreateType(FromFunction$4(moduleProperties, type.parameters, type.returns), type) : IsIntersect$1(type) ? CreateType(FromIntersect$8(moduleProperties, type.allOf), type) : IsIterator$1(type) ? CreateType(FromIterator$4(moduleProperties, type.items), type) : IsObject$1(type) ? CreateType(FromObject$9(moduleProperties, type.properties), type) : IsRecord$1(type) ? CreateType(FromRecord$8(moduleProperties, type)) : IsTuple$1(type) ? CreateType(FromTuple$8(moduleProperties, type.items || []), type) : IsUnion$1(type) ? CreateType(FromUnion$8(moduleProperties, type.anyOf), type) : type
      )
    )
  );
}
function ComputeType(moduleProperties, key) {
  return key in moduleProperties ? FromType(moduleProperties, moduleProperties[key]) : Never();
}
function ComputeModuleProperties(moduleProperties) {
  return globalThis.Object.getOwnPropertyNames(moduleProperties).reduce((result, key) => {
    return { ...result, [key]: ComputeType(moduleProperties, key) };
  }, {});
}
class TModule {
  constructor($defs) {
    const computed = ComputeModuleProperties($defs);
    const identified = this.WithIdentifiers(computed);
    this.$defs = identified;
  }
  /** `[Json]` Imports a Type by Key. */
  Import(key, options) {
    const $defs = { ...this.$defs, [key]: CreateType(this.$defs[key], options) };
    return CreateType({ [Kind$1]: "Import", $defs, $ref: key });
  }
  // prettier-ignore
  WithIdentifiers($defs) {
    return globalThis.Object.getOwnPropertyNames($defs).reduce((result, key) => {
      return { ...result, [key]: { ...$defs[key], $id: key } };
    }, {});
  }
}
function Module(properties) {
  return new TModule(properties);
}
function Not(type, options) {
  return CreateType({ [Kind$1]: "Not", not: type }, options);
}
function Parameters(schema, options) {
  return IsFunction$1(schema) ? Tuple(schema.parameters, options) : Never();
}
let Ordinal = 0;
function Recursive(callback, options = {}) {
  if (IsUndefined$3(options.$id))
    options.$id = `T${Ordinal++}`;
  const thisType = CloneType(callback({ [Kind$1]: "This", $ref: `${options.$id}` }));
  thisType.$id = options.$id;
  return CreateType({ [Hint$1]: "Recursive", ...thisType }, options);
}
function RegExp$1(unresolved, options) {
  const expr = IsString$3(unresolved) ? new globalThis.RegExp(unresolved) : unresolved;
  return CreateType({ [Kind$1]: "RegExp", type: "RegExp", source: expr.source, flags: expr.flags }, options);
}
function RestResolve(T) {
  return IsIntersect$1(T) ? T.allOf : IsUnion$1(T) ? T.anyOf : IsTuple$1(T) ? T.items ?? [] : [];
}
function Rest(T) {
  return RestResolve(T);
}
function ReturnType(schema, options) {
  return IsFunction$1(schema) ? CreateType(schema.returns, options) : Never(options);
}
class TransformDecodeBuilder {
  constructor(schema) {
    this.schema = schema;
  }
  Decode(decode2) {
    return new TransformEncodeBuilder(this.schema, decode2);
  }
}
class TransformEncodeBuilder {
  constructor(schema, decode2) {
    this.schema = schema;
    this.decode = decode2;
  }
  EncodeTransform(encode, schema) {
    const Encode2 = (value) => schema[TransformKind].Encode(encode(value));
    const Decode2 = (value) => this.decode(schema[TransformKind].Decode(value));
    const Codec = { Encode: Encode2, Decode: Decode2 };
    return { ...schema, [TransformKind]: Codec };
  }
  EncodeSchema(encode, schema) {
    const Codec = { Decode: this.decode, Encode: encode };
    return { ...schema, [TransformKind]: Codec };
  }
  Encode(encode) {
    return IsTransform$1(this.schema) ? this.EncodeTransform(encode, this.schema) : this.EncodeSchema(encode, this.schema);
  }
}
function Transform(schema) {
  return new TransformDecodeBuilder(schema);
}
function Unsafe(options = {}) {
  return CreateType({ [Kind$1]: options[Kind$1] ?? "Unsafe" }, options);
}
function Void(options) {
  return CreateType({ [Kind$1]: "Void", type: "void" }, options);
}
const TypeBuilder = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Any,
  Argument,
  Array: Array$1,
  AsyncIterator,
  Awaited,
  BigInt: BigInt$1,
  Boolean,
  Capitalize,
  Composite,
  Const,
  Constructor,
  ConstructorParameters,
  Date: Date$1,
  Enum,
  Exclude,
  Extends,
  Extract,
  Function: Function$1,
  Index,
  InstanceType,
  Instantiate,
  Integer,
  Intersect: Intersect$1,
  Iterator,
  KeyOf,
  Literal,
  Lowercase,
  Mapped,
  Module,
  Never,
  Not,
  Null,
  Number: Number$1,
  Object: Object$1,
  Omit,
  Optional,
  Parameters,
  Partial,
  Pick,
  Promise: Promise$1,
  Readonly,
  ReadonlyOptional,
  Record,
  Recursive,
  Ref,
  RegExp: RegExp$1,
  Required,
  Rest,
  ReturnType,
  String: String$1,
  Symbol: Symbol$1,
  TemplateLiteral,
  Transform,
  Tuple,
  Uint8Array: Uint8Array$1,
  Uncapitalize,
  Undefined,
  Union: Union$1,
  Unknown,
  Unsafe,
  Uppercase,
  Void
}, Symbol.toStringTag, { value: "Module" }));
const Type = TypeBuilder;
var UTF8_ACCEPT = 12;
var UTF8_REJECT = 0;
var UTF8_DATA = [
  // The first part of the table maps bytes to character to a transition.
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
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  3,
  3,
  3,
  3,
  3,
  3,
  3,
  3,
  3,
  3,
  3,
  3,
  3,
  3,
  3,
  3,
  3,
  3,
  3,
  3,
  3,
  3,
  3,
  3,
  3,
  3,
  3,
  3,
  3,
  3,
  3,
  3,
  4,
  4,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  6,
  7,
  7,
  7,
  7,
  7,
  7,
  7,
  7,
  7,
  7,
  7,
  7,
  8,
  7,
  7,
  10,
  9,
  9,
  9,
  11,
  4,
  4,
  4,
  4,
  4,
  4,
  4,
  4,
  4,
  4,
  4,
  // The second part of the table maps a state to a new state when adding a
  // transition.
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
  12,
  0,
  0,
  0,
  0,
  24,
  36,
  48,
  60,
  72,
  84,
  96,
  0,
  12,
  12,
  12,
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
  24,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  24,
  24,
  24,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  24,
  24,
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
  48,
  48,
  48,
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
  48,
  48,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  48,
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
  // The third part maps the current transition to a mask that needs to apply
  // to the byte.
  127,
  63,
  63,
  63,
  0,
  31,
  15,
  15,
  15,
  7,
  7,
  7
];
function decodeURIComponent$1(uri2) {
  var percentPosition = uri2.indexOf("%");
  if (percentPosition === -1) return uri2;
  var length = uri2.length;
  var decoded = "";
  var last = 0;
  var codepoint = 0;
  var startOfOctets = percentPosition;
  var state = UTF8_ACCEPT;
  while (percentPosition > -1 && percentPosition < length) {
    var high = hexCodeToInt(uri2[percentPosition + 1], 4);
    var low = hexCodeToInt(uri2[percentPosition + 2], 0);
    var byte2 = high | low;
    var type = UTF8_DATA[byte2];
    state = UTF8_DATA[256 + state + type];
    codepoint = codepoint << 6 | byte2 & UTF8_DATA[364 + type];
    if (state === UTF8_ACCEPT) {
      decoded += uri2.slice(last, startOfOctets);
      decoded += codepoint <= 65535 ? String.fromCharCode(codepoint) : String.fromCharCode(
        55232 + (codepoint >> 10),
        56320 + (codepoint & 1023)
      );
      codepoint = 0;
      last = percentPosition + 3;
      percentPosition = startOfOctets = uri2.indexOf("%", last);
    } else if (state === UTF8_REJECT) {
      return null;
    } else {
      percentPosition += 3;
      if (percentPosition < length && uri2.charCodeAt(percentPosition) === 37) continue;
      return null;
    }
  }
  return decoded + uri2.slice(last);
}
var HEX = {
  "0": 0,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "a": 10,
  "A": 10,
  "b": 11,
  "B": 11,
  "c": 12,
  "C": 12,
  "d": 13,
  "D": 13,
  "e": 14,
  "E": 14,
  "f": 15,
  "F": 15
};
function hexCodeToInt(c, shift) {
  var i = HEX[c];
  return i === void 0 ? 255 : i << shift;
}
var fastDecodeUriComponent = decodeURIComponent$1;
const fastDecodeURIComponent = /* @__PURE__ */ getDefaultExportFromCjs(fastDecodeUriComponent);
function Evaluate(...args) {
  return new globalThis.Function(...args);
}
function DefaultErrorFunction(error) {
  switch (error.errorType) {
    case ValueErrorType.ArrayContains:
      return "Expected array to contain at least one matching value";
    case ValueErrorType.ArrayMaxContains:
      return `Expected array to contain no more than ${error.schema.maxContains} matching values`;
    case ValueErrorType.ArrayMinContains:
      return `Expected array to contain at least ${error.schema.minContains} matching values`;
    case ValueErrorType.ArrayMaxItems:
      return `Expected array length to be less or equal to ${error.schema.maxItems}`;
    case ValueErrorType.ArrayMinItems:
      return `Expected array length to be greater or equal to ${error.schema.minItems}`;
    case ValueErrorType.ArrayUniqueItems:
      return "Expected array elements to be unique";
    case ValueErrorType.Array:
      return "Expected array";
    case ValueErrorType.AsyncIterator:
      return "Expected AsyncIterator";
    case ValueErrorType.BigIntExclusiveMaximum:
      return `Expected bigint to be less than ${error.schema.exclusiveMaximum}`;
    case ValueErrorType.BigIntExclusiveMinimum:
      return `Expected bigint to be greater than ${error.schema.exclusiveMinimum}`;
    case ValueErrorType.BigIntMaximum:
      return `Expected bigint to be less or equal to ${error.schema.maximum}`;
    case ValueErrorType.BigIntMinimum:
      return `Expected bigint to be greater or equal to ${error.schema.minimum}`;
    case ValueErrorType.BigIntMultipleOf:
      return `Expected bigint to be a multiple of ${error.schema.multipleOf}`;
    case ValueErrorType.BigInt:
      return "Expected bigint";
    case ValueErrorType.Boolean:
      return "Expected boolean";
    case ValueErrorType.DateExclusiveMinimumTimestamp:
      return `Expected Date timestamp to be greater than ${error.schema.exclusiveMinimumTimestamp}`;
    case ValueErrorType.DateExclusiveMaximumTimestamp:
      return `Expected Date timestamp to be less than ${error.schema.exclusiveMaximumTimestamp}`;
    case ValueErrorType.DateMinimumTimestamp:
      return `Expected Date timestamp to be greater or equal to ${error.schema.minimumTimestamp}`;
    case ValueErrorType.DateMaximumTimestamp:
      return `Expected Date timestamp to be less or equal to ${error.schema.maximumTimestamp}`;
    case ValueErrorType.DateMultipleOfTimestamp:
      return `Expected Date timestamp to be a multiple of ${error.schema.multipleOfTimestamp}`;
    case ValueErrorType.Date:
      return "Expected Date";
    case ValueErrorType.Function:
      return "Expected function";
    case ValueErrorType.IntegerExclusiveMaximum:
      return `Expected integer to be less than ${error.schema.exclusiveMaximum}`;
    case ValueErrorType.IntegerExclusiveMinimum:
      return `Expected integer to be greater than ${error.schema.exclusiveMinimum}`;
    case ValueErrorType.IntegerMaximum:
      return `Expected integer to be less or equal to ${error.schema.maximum}`;
    case ValueErrorType.IntegerMinimum:
      return `Expected integer to be greater or equal to ${error.schema.minimum}`;
    case ValueErrorType.IntegerMultipleOf:
      return `Expected integer to be a multiple of ${error.schema.multipleOf}`;
    case ValueErrorType.Integer:
      return "Expected integer";
    case ValueErrorType.IntersectUnevaluatedProperties:
      return "Unexpected property";
    case ValueErrorType.Intersect:
      return "Expected all values to match";
    case ValueErrorType.Iterator:
      return "Expected Iterator";
    case ValueErrorType.Literal:
      return `Expected ${typeof error.schema.const === "string" ? `'${error.schema.const}'` : error.schema.const}`;
    case ValueErrorType.Never:
      return "Never";
    case ValueErrorType.Not:
      return "Value should not match";
    case ValueErrorType.Null:
      return "Expected null";
    case ValueErrorType.NumberExclusiveMaximum:
      return `Expected number to be less than ${error.schema.exclusiveMaximum}`;
    case ValueErrorType.NumberExclusiveMinimum:
      return `Expected number to be greater than ${error.schema.exclusiveMinimum}`;
    case ValueErrorType.NumberMaximum:
      return `Expected number to be less or equal to ${error.schema.maximum}`;
    case ValueErrorType.NumberMinimum:
      return `Expected number to be greater or equal to ${error.schema.minimum}`;
    case ValueErrorType.NumberMultipleOf:
      return `Expected number to be a multiple of ${error.schema.multipleOf}`;
    case ValueErrorType.Number:
      return "Expected number";
    case ValueErrorType.Object:
      return "Expected object";
    case ValueErrorType.ObjectAdditionalProperties:
      return "Unexpected property";
    case ValueErrorType.ObjectMaxProperties:
      return `Expected object to have no more than ${error.schema.maxProperties} properties`;
    case ValueErrorType.ObjectMinProperties:
      return `Expected object to have at least ${error.schema.minProperties} properties`;
    case ValueErrorType.ObjectRequiredProperty:
      return "Expected required property";
    case ValueErrorType.Promise:
      return "Expected Promise";
    case ValueErrorType.RegExp:
      return "Expected string to match regular expression";
    case ValueErrorType.StringFormatUnknown:
      return `Unknown format '${error.schema.format}'`;
    case ValueErrorType.StringFormat:
      return `Expected string to match '${error.schema.format}' format`;
    case ValueErrorType.StringMaxLength:
      return `Expected string length less or equal to ${error.schema.maxLength}`;
    case ValueErrorType.StringMinLength:
      return `Expected string length greater or equal to ${error.schema.minLength}`;
    case ValueErrorType.StringPattern:
      return `Expected string to match '${error.schema.pattern}'`;
    case ValueErrorType.String:
      return "Expected string";
    case ValueErrorType.Symbol:
      return "Expected symbol";
    case ValueErrorType.TupleLength:
      return `Expected tuple to have ${error.schema.maxItems || 0} elements`;
    case ValueErrorType.Tuple:
      return "Expected tuple";
    case ValueErrorType.Uint8ArrayMaxByteLength:
      return `Expected byte length less or equal to ${error.schema.maxByteLength}`;
    case ValueErrorType.Uint8ArrayMinByteLength:
      return `Expected byte length greater or equal to ${error.schema.minByteLength}`;
    case ValueErrorType.Uint8Array:
      return "Expected Uint8Array";
    case ValueErrorType.Undefined:
      return "Expected undefined";
    case ValueErrorType.Union:
      return "Expected union value";
    case ValueErrorType.Void:
      return "Expected void";
    case ValueErrorType.Kind:
      return `Expected kind '${error.schema[Kind$1]}'`;
    default:
      return "Unknown error type";
  }
}
let errorFunction = DefaultErrorFunction;
function GetErrorFunction() {
  return errorFunction;
}
class TypeDereferenceError extends TypeBoxError {
  constructor(schema) {
    super(`Unable to dereference schema with $id '${schema.$ref}'`);
    this.schema = schema;
  }
}
function Resolve(schema, references) {
  const target = references.find((target2) => target2.$id === schema.$ref);
  if (target === void 0)
    throw new TypeDereferenceError(schema);
  return Deref(target, references);
}
function Pushref(schema, references) {
  if (!IsString$2(schema.$id) || references.some((target) => target.$id === schema.$id))
    return references;
  references.push(schema);
  return references;
}
function Deref(schema, references) {
  return schema[Kind$1] === "This" || schema[Kind$1] === "Ref" ? Resolve(schema, references) : schema;
}
class ValueHashError extends TypeBoxError {
  constructor(value) {
    super(`Unable to hash value`);
    this.value = value;
  }
}
var ByteMarker;
(function(ByteMarker2) {
  ByteMarker2[ByteMarker2["Undefined"] = 0] = "Undefined";
  ByteMarker2[ByteMarker2["Null"] = 1] = "Null";
  ByteMarker2[ByteMarker2["Boolean"] = 2] = "Boolean";
  ByteMarker2[ByteMarker2["Number"] = 3] = "Number";
  ByteMarker2[ByteMarker2["String"] = 4] = "String";
  ByteMarker2[ByteMarker2["Object"] = 5] = "Object";
  ByteMarker2[ByteMarker2["Array"] = 6] = "Array";
  ByteMarker2[ByteMarker2["Date"] = 7] = "Date";
  ByteMarker2[ByteMarker2["Uint8Array"] = 8] = "Uint8Array";
  ByteMarker2[ByteMarker2["Symbol"] = 9] = "Symbol";
  ByteMarker2[ByteMarker2["BigInt"] = 10] = "BigInt";
})(ByteMarker || (ByteMarker = {}));
let Accumulator = BigInt("14695981039346656037");
const [Prime, Size] = [BigInt("1099511628211"), BigInt(
  "18446744073709551616"
  /* 2 ^ 64 */
)];
const Bytes = Array.from({ length: 256 }).map((_, i) => BigInt(i));
const F64 = new Float64Array(1);
const F64In = new DataView(F64.buffer);
const F64Out = new Uint8Array(F64.buffer);
function* NumberToBytes(value) {
  const byteCount = value === 0 ? 1 : Math.ceil(Math.floor(Math.log2(value) + 1) / 8);
  for (let i = 0; i < byteCount; i++) {
    yield value >> 8 * (byteCount - 1 - i) & 255;
  }
}
function ArrayType(value) {
  FNV1A64(ByteMarker.Array);
  for (const item of value) {
    Visit$8(item);
  }
}
function BooleanType(value) {
  FNV1A64(ByteMarker.Boolean);
  FNV1A64(value ? 1 : 0);
}
function BigIntType(value) {
  FNV1A64(ByteMarker.BigInt);
  F64In.setBigInt64(0, value);
  for (const byte2 of F64Out) {
    FNV1A64(byte2);
  }
}
function DateType(value) {
  FNV1A64(ByteMarker.Date);
  Visit$8(value.getTime());
}
function NullType(value) {
  FNV1A64(ByteMarker.Null);
}
function NumberType(value) {
  FNV1A64(ByteMarker.Number);
  F64In.setFloat64(0, value);
  for (const byte2 of F64Out) {
    FNV1A64(byte2);
  }
}
function ObjectType(value) {
  FNV1A64(ByteMarker.Object);
  for (const key of globalThis.Object.getOwnPropertyNames(value).sort()) {
    Visit$8(key);
    Visit$8(value[key]);
  }
}
function StringType(value) {
  FNV1A64(ByteMarker.String);
  for (let i = 0; i < value.length; i++) {
    for (const byte2 of NumberToBytes(value.charCodeAt(i))) {
      FNV1A64(byte2);
    }
  }
}
function SymbolType(value) {
  FNV1A64(ByteMarker.Symbol);
  Visit$8(value.description);
}
function Uint8ArrayType(value) {
  FNV1A64(ByteMarker.Uint8Array);
  for (let i = 0; i < value.length; i++) {
    FNV1A64(value[i]);
  }
}
function UndefinedType(value) {
  return FNV1A64(ByteMarker.Undefined);
}
function Visit$8(value) {
  if (IsArray$2(value))
    return ArrayType(value);
  if (IsBoolean$2(value))
    return BooleanType(value);
  if (IsBigInt$2(value))
    return BigIntType(value);
  if (IsDate$2(value))
    return DateType(value);
  if (IsNull$2(value))
    return NullType();
  if (IsNumber$2(value))
    return NumberType(value);
  if (IsObject$2(value))
    return ObjectType(value);
  if (IsString$2(value))
    return StringType(value);
  if (IsSymbol$2(value))
    return SymbolType(value);
  if (IsUint8Array$2(value))
    return Uint8ArrayType(value);
  if (IsUndefined$2(value))
    return UndefinedType();
  throw new ValueHashError(value);
}
function FNV1A64(byte2) {
  Accumulator = Accumulator ^ Bytes[byte2];
  Accumulator = Accumulator * Prime % Size;
}
function Hash(value) {
  Accumulator = BigInt("14695981039346656037");
  Visit$8(value);
  return Accumulator;
}
class ValueCheckUnknownTypeError extends TypeBoxError {
  constructor(schema) {
    super(`Unknown type`);
    this.schema = schema;
  }
}
function IsAnyOrUnknown(schema) {
  return schema[Kind$1] === "Any" || schema[Kind$1] === "Unknown";
}
function IsDefined$1(value) {
  return value !== void 0;
}
function FromAny$2(schema, references, value) {
  return true;
}
function FromArgument$2(schema, references, value) {
  return true;
}
function FromArray$8(schema, references, value) {
  if (!IsArray$2(value))
    return false;
  if (IsDefined$1(schema.minItems) && !(value.length >= schema.minItems)) {
    return false;
  }
  if (IsDefined$1(schema.maxItems) && !(value.length <= schema.maxItems)) {
    return false;
  }
  for (const element of value) {
    if (!Visit$7(schema.items, references, element))
      return false;
  }
  if (schema.uniqueItems === true && !function() {
    const set2 = /* @__PURE__ */ new Set();
    for (const element of value) {
      const hashed = Hash(element);
      if (set2.has(hashed)) {
        return false;
      } else {
        set2.add(hashed);
      }
    }
    return true;
  }()) {
    return false;
  }
  if (!(IsDefined$1(schema.contains) || IsNumber$2(schema.minContains) || IsNumber$2(schema.maxContains))) {
    return true;
  }
  const containsSchema = IsDefined$1(schema.contains) ? schema.contains : Never();
  const containsCount = value.reduce((acc, value2) => Visit$7(containsSchema, references, value2) ? acc + 1 : acc, 0);
  if (containsCount === 0) {
    return false;
  }
  if (IsNumber$2(schema.minContains) && containsCount < schema.minContains) {
    return false;
  }
  if (IsNumber$2(schema.maxContains) && containsCount > schema.maxContains) {
    return false;
  }
  return true;
}
function FromAsyncIterator$3(schema, references, value) {
  return IsAsyncIterator$2(value);
}
function FromBigInt$2(schema, references, value) {
  if (!IsBigInt$2(value))
    return false;
  if (IsDefined$1(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    return false;
  }
  if (IsDefined$1(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    return false;
  }
  if (IsDefined$1(schema.maximum) && !(value <= schema.maximum)) {
    return false;
  }
  if (IsDefined$1(schema.minimum) && !(value >= schema.minimum)) {
    return false;
  }
  if (IsDefined$1(schema.multipleOf) && !(value % schema.multipleOf === BigInt(0))) {
    return false;
  }
  return true;
}
function FromBoolean$2(schema, references, value) {
  return IsBoolean$2(value);
}
function FromConstructor$3(schema, references, value) {
  return Visit$7(schema.returns, references, value.prototype);
}
function FromDate$4(schema, references, value) {
  if (!IsDate$2(value))
    return false;
  if (IsDefined$1(schema.exclusiveMaximumTimestamp) && !(value.getTime() < schema.exclusiveMaximumTimestamp)) {
    return false;
  }
  if (IsDefined$1(schema.exclusiveMinimumTimestamp) && !(value.getTime() > schema.exclusiveMinimumTimestamp)) {
    return false;
  }
  if (IsDefined$1(schema.maximumTimestamp) && !(value.getTime() <= schema.maximumTimestamp)) {
    return false;
  }
  if (IsDefined$1(schema.minimumTimestamp) && !(value.getTime() >= schema.minimumTimestamp)) {
    return false;
  }
  if (IsDefined$1(schema.multipleOfTimestamp) && !(value.getTime() % schema.multipleOfTimestamp === 0)) {
    return false;
  }
  return true;
}
function FromFunction$3(schema, references, value) {
  return IsFunction$2(value);
}
function FromImport$7(schema, references, value) {
  const definitions = globalThis.Object.values(schema.$defs);
  const target = schema.$defs[schema.$ref];
  return Visit$7(target, [...references, ...definitions], value);
}
function FromInteger$2(schema, references, value) {
  if (!IsInteger$2(value)) {
    return false;
  }
  if (IsDefined$1(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    return false;
  }
  if (IsDefined$1(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    return false;
  }
  if (IsDefined$1(schema.maximum) && !(value <= schema.maximum)) {
    return false;
  }
  if (IsDefined$1(schema.minimum) && !(value >= schema.minimum)) {
    return false;
  }
  if (IsDefined$1(schema.multipleOf) && !(value % schema.multipleOf === 0)) {
    return false;
  }
  return true;
}
function FromIntersect$7(schema, references, value) {
  const check1 = schema.allOf.every((schema2) => Visit$7(schema2, references, value));
  if (schema.unevaluatedProperties === false) {
    const keyPattern = new RegExp(KeyOfPattern(schema));
    const check2 = Object.getOwnPropertyNames(value).every((key) => keyPattern.test(key));
    return check1 && check2;
  } else if (IsSchema$1(schema.unevaluatedProperties)) {
    const keyCheck = new RegExp(KeyOfPattern(schema));
    const check2 = Object.getOwnPropertyNames(value).every((key) => keyCheck.test(key) || Visit$7(schema.unevaluatedProperties, references, value[key]));
    return check1 && check2;
  } else {
    return check1;
  }
}
function FromIterator$3(schema, references, value) {
  return IsIterator$2(value);
}
function FromLiteral$2(schema, references, value) {
  return value === schema.const;
}
function FromNever$2(schema, references, value) {
  return false;
}
function FromNot$5(schema, references, value) {
  return !Visit$7(schema.not, references, value);
}
function FromNull$2(schema, references, value) {
  return IsNull$2(value);
}
function FromNumber$2(schema, references, value) {
  if (!TypeSystemPolicy.IsNumberLike(value))
    return false;
  if (IsDefined$1(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    return false;
  }
  if (IsDefined$1(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    return false;
  }
  if (IsDefined$1(schema.minimum) && !(value >= schema.minimum)) {
    return false;
  }
  if (IsDefined$1(schema.maximum) && !(value <= schema.maximum)) {
    return false;
  }
  if (IsDefined$1(schema.multipleOf) && !(value % schema.multipleOf === 0)) {
    return false;
  }
  return true;
}
function FromObject$8(schema, references, value) {
  if (!TypeSystemPolicy.IsObjectLike(value))
    return false;
  if (IsDefined$1(schema.minProperties) && !(Object.getOwnPropertyNames(value).length >= schema.minProperties)) {
    return false;
  }
  if (IsDefined$1(schema.maxProperties) && !(Object.getOwnPropertyNames(value).length <= schema.maxProperties)) {
    return false;
  }
  const knownKeys = Object.getOwnPropertyNames(schema.properties);
  for (const knownKey of knownKeys) {
    const property = schema.properties[knownKey];
    if (schema.required && schema.required.includes(knownKey)) {
      if (!Visit$7(property, references, value[knownKey])) {
        return false;
      }
      if ((ExtendsUndefinedCheck(property) || IsAnyOrUnknown(property)) && !(knownKey in value)) {
        return false;
      }
    } else {
      if (TypeSystemPolicy.IsExactOptionalProperty(value, knownKey) && !Visit$7(property, references, value[knownKey])) {
        return false;
      }
    }
  }
  if (schema.additionalProperties === false) {
    const valueKeys = Object.getOwnPropertyNames(value);
    if (schema.required && schema.required.length === knownKeys.length && valueKeys.length === knownKeys.length) {
      return true;
    } else {
      return valueKeys.every((valueKey) => knownKeys.includes(valueKey));
    }
  } else if (typeof schema.additionalProperties === "object") {
    const valueKeys = Object.getOwnPropertyNames(value);
    return valueKeys.every((key) => knownKeys.includes(key) || Visit$7(schema.additionalProperties, references, value[key]));
  } else {
    return true;
  }
}
function FromPromise$3(schema, references, value) {
  return IsPromise$2(value);
}
function FromRecord$7(schema, references, value) {
  if (!TypeSystemPolicy.IsRecordLike(value)) {
    return false;
  }
  if (IsDefined$1(schema.minProperties) && !(Object.getOwnPropertyNames(value).length >= schema.minProperties)) {
    return false;
  }
  if (IsDefined$1(schema.maxProperties) && !(Object.getOwnPropertyNames(value).length <= schema.maxProperties)) {
    return false;
  }
  const [patternKey, patternSchema] = Object.entries(schema.patternProperties)[0];
  const regex2 = new RegExp(patternKey);
  const check1 = Object.entries(value).every(([key, value2]) => {
    return regex2.test(key) ? Visit$7(patternSchema, references, value2) : true;
  });
  const check2 = typeof schema.additionalProperties === "object" ? Object.entries(value).every(([key, value2]) => {
    return !regex2.test(key) ? Visit$7(schema.additionalProperties, references, value2) : true;
  }) : true;
  const check3 = schema.additionalProperties === false ? Object.getOwnPropertyNames(value).every((key) => {
    return regex2.test(key);
  }) : true;
  return check1 && check2 && check3;
}
function FromRef$7(schema, references, value) {
  return Visit$7(Deref(schema, references), references, value);
}
function FromRegExp$2(schema, references, value) {
  const regex2 = new RegExp(schema.source, schema.flags);
  if (IsDefined$1(schema.minLength)) {
    if (!(value.length >= schema.minLength))
      return false;
  }
  if (IsDefined$1(schema.maxLength)) {
    if (!(value.length <= schema.maxLength))
      return false;
  }
  return regex2.test(value);
}
function FromString$2(schema, references, value) {
  if (!IsString$2(value)) {
    return false;
  }
  if (IsDefined$1(schema.minLength)) {
    if (!(value.length >= schema.minLength))
      return false;
  }
  if (IsDefined$1(schema.maxLength)) {
    if (!(value.length <= schema.maxLength))
      return false;
  }
  if (IsDefined$1(schema.pattern)) {
    const regex2 = new RegExp(schema.pattern);
    if (!regex2.test(value))
      return false;
  }
  if (IsDefined$1(schema.format)) {
    if (!Has$1(schema.format))
      return false;
    const func = Get$1(schema.format);
    return func(value);
  }
  return true;
}
function FromSymbol$2(schema, references, value) {
  return IsSymbol$2(value);
}
function FromTemplateLiteral$2(schema, references, value) {
  return IsString$2(value) && new RegExp(schema.pattern).test(value);
}
function FromThis$7(schema, references, value) {
  return Visit$7(Deref(schema, references), references, value);
}
function FromTuple$7(schema, references, value) {
  if (!IsArray$2(value)) {
    return false;
  }
  if (schema.items === void 0 && !(value.length === 0)) {
    return false;
  }
  if (!(value.length === schema.maxItems)) {
    return false;
  }
  if (!schema.items) {
    return true;
  }
  for (let i = 0; i < schema.items.length; i++) {
    if (!Visit$7(schema.items[i], references, value[i]))
      return false;
  }
  return true;
}
function FromUndefined$2(schema, references, value) {
  return IsUndefined$2(value);
}
function FromUnion$7(schema, references, value) {
  return schema.anyOf.some((inner) => Visit$7(inner, references, value));
}
function FromUint8Array$2(schema, references, value) {
  if (!IsUint8Array$2(value)) {
    return false;
  }
  if (IsDefined$1(schema.maxByteLength) && !(value.length <= schema.maxByteLength)) {
    return false;
  }
  if (IsDefined$1(schema.minByteLength) && !(value.length >= schema.minByteLength)) {
    return false;
  }
  return true;
}
function FromUnknown$2(schema, references, value) {
  return true;
}
function FromVoid$2(schema, references, value) {
  return TypeSystemPolicy.IsVoidLike(value);
}
function FromKind$2(schema, references, value) {
  if (!Has(schema[Kind$1]))
    return false;
  const func = Get(schema[Kind$1]);
  return func(schema, value);
}
function Visit$7(schema, references, value) {
  const references_ = IsDefined$1(schema.$id) ? Pushref(schema, references) : references;
  const schema_ = schema;
  switch (schema_[Kind$1]) {
    case "Any":
      return FromAny$2();
    case "Argument":
      return FromArgument$2();
    case "Array":
      return FromArray$8(schema_, references_, value);
    case "AsyncIterator":
      return FromAsyncIterator$3(schema_, references_, value);
    case "BigInt":
      return FromBigInt$2(schema_, references_, value);
    case "Boolean":
      return FromBoolean$2(schema_, references_, value);
    case "Constructor":
      return FromConstructor$3(schema_, references_, value);
    case "Date":
      return FromDate$4(schema_, references_, value);
    case "Function":
      return FromFunction$3(schema_, references_, value);
    case "Import":
      return FromImport$7(schema_, references_, value);
    case "Integer":
      return FromInteger$2(schema_, references_, value);
    case "Intersect":
      return FromIntersect$7(schema_, references_, value);
    case "Iterator":
      return FromIterator$3(schema_, references_, value);
    case "Literal":
      return FromLiteral$2(schema_, references_, value);
    case "Never":
      return FromNever$2();
    case "Not":
      return FromNot$5(schema_, references_, value);
    case "Null":
      return FromNull$2(schema_, references_, value);
    case "Number":
      return FromNumber$2(schema_, references_, value);
    case "Object":
      return FromObject$8(schema_, references_, value);
    case "Promise":
      return FromPromise$3(schema_, references_, value);
    case "Record":
      return FromRecord$7(schema_, references_, value);
    case "Ref":
      return FromRef$7(schema_, references_, value);
    case "RegExp":
      return FromRegExp$2(schema_, references_, value);
    case "String":
      return FromString$2(schema_, references_, value);
    case "Symbol":
      return FromSymbol$2(schema_, references_, value);
    case "TemplateLiteral":
      return FromTemplateLiteral$2(schema_, references_, value);
    case "This":
      return FromThis$7(schema_, references_, value);
    case "Tuple":
      return FromTuple$7(schema_, references_, value);
    case "Undefined":
      return FromUndefined$2(schema_, references_, value);
    case "Union":
      return FromUnion$7(schema_, references_, value);
    case "Uint8Array":
      return FromUint8Array$2(schema_, references_, value);
    case "Unknown":
      return FromUnknown$2();
    case "Void":
      return FromVoid$2(schema_, references_, value);
    default:
      if (!Has(schema_[Kind$1]))
        throw new ValueCheckUnknownTypeError(schema_);
      return FromKind$2(schema_, references_, value);
  }
}
function Check(...args) {
  return args.length === 3 ? Visit$7(args[0], args[1], args[2]) : Visit$7(args[0], [], args[1]);
}
var ValueErrorType;
(function(ValueErrorType2) {
  ValueErrorType2[ValueErrorType2["ArrayContains"] = 0] = "ArrayContains";
  ValueErrorType2[ValueErrorType2["ArrayMaxContains"] = 1] = "ArrayMaxContains";
  ValueErrorType2[ValueErrorType2["ArrayMaxItems"] = 2] = "ArrayMaxItems";
  ValueErrorType2[ValueErrorType2["ArrayMinContains"] = 3] = "ArrayMinContains";
  ValueErrorType2[ValueErrorType2["ArrayMinItems"] = 4] = "ArrayMinItems";
  ValueErrorType2[ValueErrorType2["ArrayUniqueItems"] = 5] = "ArrayUniqueItems";
  ValueErrorType2[ValueErrorType2["Array"] = 6] = "Array";
  ValueErrorType2[ValueErrorType2["AsyncIterator"] = 7] = "AsyncIterator";
  ValueErrorType2[ValueErrorType2["BigIntExclusiveMaximum"] = 8] = "BigIntExclusiveMaximum";
  ValueErrorType2[ValueErrorType2["BigIntExclusiveMinimum"] = 9] = "BigIntExclusiveMinimum";
  ValueErrorType2[ValueErrorType2["BigIntMaximum"] = 10] = "BigIntMaximum";
  ValueErrorType2[ValueErrorType2["BigIntMinimum"] = 11] = "BigIntMinimum";
  ValueErrorType2[ValueErrorType2["BigIntMultipleOf"] = 12] = "BigIntMultipleOf";
  ValueErrorType2[ValueErrorType2["BigInt"] = 13] = "BigInt";
  ValueErrorType2[ValueErrorType2["Boolean"] = 14] = "Boolean";
  ValueErrorType2[ValueErrorType2["DateExclusiveMaximumTimestamp"] = 15] = "DateExclusiveMaximumTimestamp";
  ValueErrorType2[ValueErrorType2["DateExclusiveMinimumTimestamp"] = 16] = "DateExclusiveMinimumTimestamp";
  ValueErrorType2[ValueErrorType2["DateMaximumTimestamp"] = 17] = "DateMaximumTimestamp";
  ValueErrorType2[ValueErrorType2["DateMinimumTimestamp"] = 18] = "DateMinimumTimestamp";
  ValueErrorType2[ValueErrorType2["DateMultipleOfTimestamp"] = 19] = "DateMultipleOfTimestamp";
  ValueErrorType2[ValueErrorType2["Date"] = 20] = "Date";
  ValueErrorType2[ValueErrorType2["Function"] = 21] = "Function";
  ValueErrorType2[ValueErrorType2["IntegerExclusiveMaximum"] = 22] = "IntegerExclusiveMaximum";
  ValueErrorType2[ValueErrorType2["IntegerExclusiveMinimum"] = 23] = "IntegerExclusiveMinimum";
  ValueErrorType2[ValueErrorType2["IntegerMaximum"] = 24] = "IntegerMaximum";
  ValueErrorType2[ValueErrorType2["IntegerMinimum"] = 25] = "IntegerMinimum";
  ValueErrorType2[ValueErrorType2["IntegerMultipleOf"] = 26] = "IntegerMultipleOf";
  ValueErrorType2[ValueErrorType2["Integer"] = 27] = "Integer";
  ValueErrorType2[ValueErrorType2["IntersectUnevaluatedProperties"] = 28] = "IntersectUnevaluatedProperties";
  ValueErrorType2[ValueErrorType2["Intersect"] = 29] = "Intersect";
  ValueErrorType2[ValueErrorType2["Iterator"] = 30] = "Iterator";
  ValueErrorType2[ValueErrorType2["Kind"] = 31] = "Kind";
  ValueErrorType2[ValueErrorType2["Literal"] = 32] = "Literal";
  ValueErrorType2[ValueErrorType2["Never"] = 33] = "Never";
  ValueErrorType2[ValueErrorType2["Not"] = 34] = "Not";
  ValueErrorType2[ValueErrorType2["Null"] = 35] = "Null";
  ValueErrorType2[ValueErrorType2["NumberExclusiveMaximum"] = 36] = "NumberExclusiveMaximum";
  ValueErrorType2[ValueErrorType2["NumberExclusiveMinimum"] = 37] = "NumberExclusiveMinimum";
  ValueErrorType2[ValueErrorType2["NumberMaximum"] = 38] = "NumberMaximum";
  ValueErrorType2[ValueErrorType2["NumberMinimum"] = 39] = "NumberMinimum";
  ValueErrorType2[ValueErrorType2["NumberMultipleOf"] = 40] = "NumberMultipleOf";
  ValueErrorType2[ValueErrorType2["Number"] = 41] = "Number";
  ValueErrorType2[ValueErrorType2["ObjectAdditionalProperties"] = 42] = "ObjectAdditionalProperties";
  ValueErrorType2[ValueErrorType2["ObjectMaxProperties"] = 43] = "ObjectMaxProperties";
  ValueErrorType2[ValueErrorType2["ObjectMinProperties"] = 44] = "ObjectMinProperties";
  ValueErrorType2[ValueErrorType2["ObjectRequiredProperty"] = 45] = "ObjectRequiredProperty";
  ValueErrorType2[ValueErrorType2["Object"] = 46] = "Object";
  ValueErrorType2[ValueErrorType2["Promise"] = 47] = "Promise";
  ValueErrorType2[ValueErrorType2["RegExp"] = 48] = "RegExp";
  ValueErrorType2[ValueErrorType2["StringFormatUnknown"] = 49] = "StringFormatUnknown";
  ValueErrorType2[ValueErrorType2["StringFormat"] = 50] = "StringFormat";
  ValueErrorType2[ValueErrorType2["StringMaxLength"] = 51] = "StringMaxLength";
  ValueErrorType2[ValueErrorType2["StringMinLength"] = 52] = "StringMinLength";
  ValueErrorType2[ValueErrorType2["StringPattern"] = 53] = "StringPattern";
  ValueErrorType2[ValueErrorType2["String"] = 54] = "String";
  ValueErrorType2[ValueErrorType2["Symbol"] = 55] = "Symbol";
  ValueErrorType2[ValueErrorType2["TupleLength"] = 56] = "TupleLength";
  ValueErrorType2[ValueErrorType2["Tuple"] = 57] = "Tuple";
  ValueErrorType2[ValueErrorType2["Uint8ArrayMaxByteLength"] = 58] = "Uint8ArrayMaxByteLength";
  ValueErrorType2[ValueErrorType2["Uint8ArrayMinByteLength"] = 59] = "Uint8ArrayMinByteLength";
  ValueErrorType2[ValueErrorType2["Uint8Array"] = 60] = "Uint8Array";
  ValueErrorType2[ValueErrorType2["Undefined"] = 61] = "Undefined";
  ValueErrorType2[ValueErrorType2["Union"] = 62] = "Union";
  ValueErrorType2[ValueErrorType2["Void"] = 63] = "Void";
})(ValueErrorType || (ValueErrorType = {}));
class ValueErrorsUnknownTypeError extends TypeBoxError {
  constructor(schema) {
    super("Unknown type");
    this.schema = schema;
  }
}
function EscapeKey(key) {
  return key.replace(/~/g, "~0").replace(/\//g, "~1");
}
function IsDefined(value) {
  return value !== void 0;
}
class ValueErrorIterator {
  constructor(iterator) {
    this.iterator = iterator;
  }
  [Symbol.iterator]() {
    return this.iterator;
  }
  /** Returns the first value error or undefined if no errors */
  First() {
    const next = this.iterator.next();
    return next.done ? void 0 : next.value;
  }
}
function Create$1(errorType, schema, path2, value, errors = []) {
  return {
    type: errorType,
    schema,
    path: path2,
    value,
    message: GetErrorFunction()({ errorType, path: path2, schema, value, errors }),
    errors
  };
}
function* FromAny$1(schema, references, path2, value) {
}
function* FromArgument$1(schema, references, path2, value) {
}
function* FromArray$7(schema, references, path2, value) {
  if (!IsArray$2(value)) {
    return yield Create$1(ValueErrorType.Array, schema, path2, value);
  }
  if (IsDefined(schema.minItems) && !(value.length >= schema.minItems)) {
    yield Create$1(ValueErrorType.ArrayMinItems, schema, path2, value);
  }
  if (IsDefined(schema.maxItems) && !(value.length <= schema.maxItems)) {
    yield Create$1(ValueErrorType.ArrayMaxItems, schema, path2, value);
  }
  for (let i = 0; i < value.length; i++) {
    yield* Visit$6(schema.items, references, `${path2}/${i}`, value[i]);
  }
  if (schema.uniqueItems === true && !function() {
    const set2 = /* @__PURE__ */ new Set();
    for (const element of value) {
      const hashed = Hash(element);
      if (set2.has(hashed)) {
        return false;
      } else {
        set2.add(hashed);
      }
    }
    return true;
  }()) {
    yield Create$1(ValueErrorType.ArrayUniqueItems, schema, path2, value);
  }
  if (!(IsDefined(schema.contains) || IsDefined(schema.minContains) || IsDefined(schema.maxContains))) {
    return;
  }
  const containsSchema = IsDefined(schema.contains) ? schema.contains : Never();
  const containsCount = value.reduce((acc, value2, index) => Visit$6(containsSchema, references, `${path2}${index}`, value2).next().done === true ? acc + 1 : acc, 0);
  if (containsCount === 0) {
    yield Create$1(ValueErrorType.ArrayContains, schema, path2, value);
  }
  if (IsNumber$2(schema.minContains) && containsCount < schema.minContains) {
    yield Create$1(ValueErrorType.ArrayMinContains, schema, path2, value);
  }
  if (IsNumber$2(schema.maxContains) && containsCount > schema.maxContains) {
    yield Create$1(ValueErrorType.ArrayMaxContains, schema, path2, value);
  }
}
function* FromAsyncIterator$2(schema, references, path2, value) {
  if (!IsAsyncIterator$2(value))
    yield Create$1(ValueErrorType.AsyncIterator, schema, path2, value);
}
function* FromBigInt$1(schema, references, path2, value) {
  if (!IsBigInt$2(value))
    return yield Create$1(ValueErrorType.BigInt, schema, path2, value);
  if (IsDefined(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    yield Create$1(ValueErrorType.BigIntExclusiveMaximum, schema, path2, value);
  }
  if (IsDefined(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    yield Create$1(ValueErrorType.BigIntExclusiveMinimum, schema, path2, value);
  }
  if (IsDefined(schema.maximum) && !(value <= schema.maximum)) {
    yield Create$1(ValueErrorType.BigIntMaximum, schema, path2, value);
  }
  if (IsDefined(schema.minimum) && !(value >= schema.minimum)) {
    yield Create$1(ValueErrorType.BigIntMinimum, schema, path2, value);
  }
  if (IsDefined(schema.multipleOf) && !(value % schema.multipleOf === BigInt(0))) {
    yield Create$1(ValueErrorType.BigIntMultipleOf, schema, path2, value);
  }
}
function* FromBoolean$1(schema, references, path2, value) {
  if (!IsBoolean$2(value))
    yield Create$1(ValueErrorType.Boolean, schema, path2, value);
}
function* FromConstructor$2(schema, references, path2, value) {
  yield* Visit$6(schema.returns, references, path2, value.prototype);
}
function* FromDate$3(schema, references, path2, value) {
  if (!IsDate$2(value))
    return yield Create$1(ValueErrorType.Date, schema, path2, value);
  if (IsDefined(schema.exclusiveMaximumTimestamp) && !(value.getTime() < schema.exclusiveMaximumTimestamp)) {
    yield Create$1(ValueErrorType.DateExclusiveMaximumTimestamp, schema, path2, value);
  }
  if (IsDefined(schema.exclusiveMinimumTimestamp) && !(value.getTime() > schema.exclusiveMinimumTimestamp)) {
    yield Create$1(ValueErrorType.DateExclusiveMinimumTimestamp, schema, path2, value);
  }
  if (IsDefined(schema.maximumTimestamp) && !(value.getTime() <= schema.maximumTimestamp)) {
    yield Create$1(ValueErrorType.DateMaximumTimestamp, schema, path2, value);
  }
  if (IsDefined(schema.minimumTimestamp) && !(value.getTime() >= schema.minimumTimestamp)) {
    yield Create$1(ValueErrorType.DateMinimumTimestamp, schema, path2, value);
  }
  if (IsDefined(schema.multipleOfTimestamp) && !(value.getTime() % schema.multipleOfTimestamp === 0)) {
    yield Create$1(ValueErrorType.DateMultipleOfTimestamp, schema, path2, value);
  }
}
function* FromFunction$2(schema, references, path2, value) {
  if (!IsFunction$2(value))
    yield Create$1(ValueErrorType.Function, schema, path2, value);
}
function* FromImport$6(schema, references, path2, value) {
  const definitions = globalThis.Object.values(schema.$defs);
  const target = schema.$defs[schema.$ref];
  yield* Visit$6(target, [...references, ...definitions], path2, value);
}
function* FromInteger$1(schema, references, path2, value) {
  if (!IsInteger$2(value))
    return yield Create$1(ValueErrorType.Integer, schema, path2, value);
  if (IsDefined(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    yield Create$1(ValueErrorType.IntegerExclusiveMaximum, schema, path2, value);
  }
  if (IsDefined(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    yield Create$1(ValueErrorType.IntegerExclusiveMinimum, schema, path2, value);
  }
  if (IsDefined(schema.maximum) && !(value <= schema.maximum)) {
    yield Create$1(ValueErrorType.IntegerMaximum, schema, path2, value);
  }
  if (IsDefined(schema.minimum) && !(value >= schema.minimum)) {
    yield Create$1(ValueErrorType.IntegerMinimum, schema, path2, value);
  }
  if (IsDefined(schema.multipleOf) && !(value % schema.multipleOf === 0)) {
    yield Create$1(ValueErrorType.IntegerMultipleOf, schema, path2, value);
  }
}
function* FromIntersect$6(schema, references, path2, value) {
  let hasError = false;
  for (const inner of schema.allOf) {
    for (const error of Visit$6(inner, references, path2, value)) {
      hasError = true;
      yield error;
    }
  }
  if (hasError) {
    return yield Create$1(ValueErrorType.Intersect, schema, path2, value);
  }
  if (schema.unevaluatedProperties === false) {
    const keyCheck = new RegExp(KeyOfPattern(schema));
    for (const valueKey of Object.getOwnPropertyNames(value)) {
      if (!keyCheck.test(valueKey)) {
        yield Create$1(ValueErrorType.IntersectUnevaluatedProperties, schema, `${path2}/${valueKey}`, value);
      }
    }
  }
  if (typeof schema.unevaluatedProperties === "object") {
    const keyCheck = new RegExp(KeyOfPattern(schema));
    for (const valueKey of Object.getOwnPropertyNames(value)) {
      if (!keyCheck.test(valueKey)) {
        const next = Visit$6(schema.unevaluatedProperties, references, `${path2}/${valueKey}`, value[valueKey]).next();
        if (!next.done)
          yield next.value;
      }
    }
  }
}
function* FromIterator$2(schema, references, path2, value) {
  if (!IsIterator$2(value))
    yield Create$1(ValueErrorType.Iterator, schema, path2, value);
}
function* FromLiteral$1(schema, references, path2, value) {
  if (!(value === schema.const))
    yield Create$1(ValueErrorType.Literal, schema, path2, value);
}
function* FromNever$1(schema, references, path2, value) {
  yield Create$1(ValueErrorType.Never, schema, path2, value);
}
function* FromNot$4(schema, references, path2, value) {
  if (Visit$6(schema.not, references, path2, value).next().done === true)
    yield Create$1(ValueErrorType.Not, schema, path2, value);
}
function* FromNull$1(schema, references, path2, value) {
  if (!IsNull$2(value))
    yield Create$1(ValueErrorType.Null, schema, path2, value);
}
function* FromNumber$1(schema, references, path2, value) {
  if (!TypeSystemPolicy.IsNumberLike(value))
    return yield Create$1(ValueErrorType.Number, schema, path2, value);
  if (IsDefined(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    yield Create$1(ValueErrorType.NumberExclusiveMaximum, schema, path2, value);
  }
  if (IsDefined(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    yield Create$1(ValueErrorType.NumberExclusiveMinimum, schema, path2, value);
  }
  if (IsDefined(schema.maximum) && !(value <= schema.maximum)) {
    yield Create$1(ValueErrorType.NumberMaximum, schema, path2, value);
  }
  if (IsDefined(schema.minimum) && !(value >= schema.minimum)) {
    yield Create$1(ValueErrorType.NumberMinimum, schema, path2, value);
  }
  if (IsDefined(schema.multipleOf) && !(value % schema.multipleOf === 0)) {
    yield Create$1(ValueErrorType.NumberMultipleOf, schema, path2, value);
  }
}
function* FromObject$7(schema, references, path2, value) {
  if (!TypeSystemPolicy.IsObjectLike(value))
    return yield Create$1(ValueErrorType.Object, schema, path2, value);
  if (IsDefined(schema.minProperties) && !(Object.getOwnPropertyNames(value).length >= schema.minProperties)) {
    yield Create$1(ValueErrorType.ObjectMinProperties, schema, path2, value);
  }
  if (IsDefined(schema.maxProperties) && !(Object.getOwnPropertyNames(value).length <= schema.maxProperties)) {
    yield Create$1(ValueErrorType.ObjectMaxProperties, schema, path2, value);
  }
  const requiredKeys = Array.isArray(schema.required) ? schema.required : [];
  const knownKeys = Object.getOwnPropertyNames(schema.properties);
  const unknownKeys = Object.getOwnPropertyNames(value);
  for (const requiredKey of requiredKeys) {
    if (unknownKeys.includes(requiredKey))
      continue;
    yield Create$1(ValueErrorType.ObjectRequiredProperty, schema.properties[requiredKey], `${path2}/${EscapeKey(requiredKey)}`, void 0);
  }
  if (schema.additionalProperties === false) {
    for (const valueKey of unknownKeys) {
      if (!knownKeys.includes(valueKey)) {
        yield Create$1(ValueErrorType.ObjectAdditionalProperties, schema, `${path2}/${EscapeKey(valueKey)}`, value[valueKey]);
      }
    }
  }
  if (typeof schema.additionalProperties === "object") {
    for (const valueKey of unknownKeys) {
      if (knownKeys.includes(valueKey))
        continue;
      yield* Visit$6(schema.additionalProperties, references, `${path2}/${EscapeKey(valueKey)}`, value[valueKey]);
    }
  }
  for (const knownKey of knownKeys) {
    const property = schema.properties[knownKey];
    if (schema.required && schema.required.includes(knownKey)) {
      yield* Visit$6(property, references, `${path2}/${EscapeKey(knownKey)}`, value[knownKey]);
      if (ExtendsUndefinedCheck(schema) && !(knownKey in value)) {
        yield Create$1(ValueErrorType.ObjectRequiredProperty, property, `${path2}/${EscapeKey(knownKey)}`, void 0);
      }
    } else {
      if (TypeSystemPolicy.IsExactOptionalProperty(value, knownKey)) {
        yield* Visit$6(property, references, `${path2}/${EscapeKey(knownKey)}`, value[knownKey]);
      }
    }
  }
}
function* FromPromise$2(schema, references, path2, value) {
  if (!IsPromise$2(value))
    yield Create$1(ValueErrorType.Promise, schema, path2, value);
}
function* FromRecord$6(schema, references, path2, value) {
  if (!TypeSystemPolicy.IsRecordLike(value))
    return yield Create$1(ValueErrorType.Object, schema, path2, value);
  if (IsDefined(schema.minProperties) && !(Object.getOwnPropertyNames(value).length >= schema.minProperties)) {
    yield Create$1(ValueErrorType.ObjectMinProperties, schema, path2, value);
  }
  if (IsDefined(schema.maxProperties) && !(Object.getOwnPropertyNames(value).length <= schema.maxProperties)) {
    yield Create$1(ValueErrorType.ObjectMaxProperties, schema, path2, value);
  }
  const [patternKey, patternSchema] = Object.entries(schema.patternProperties)[0];
  const regex2 = new RegExp(patternKey);
  for (const [propertyKey, propertyValue] of Object.entries(value)) {
    if (regex2.test(propertyKey))
      yield* Visit$6(patternSchema, references, `${path2}/${EscapeKey(propertyKey)}`, propertyValue);
  }
  if (typeof schema.additionalProperties === "object") {
    for (const [propertyKey, propertyValue] of Object.entries(value)) {
      if (!regex2.test(propertyKey))
        yield* Visit$6(schema.additionalProperties, references, `${path2}/${EscapeKey(propertyKey)}`, propertyValue);
    }
  }
  if (schema.additionalProperties === false) {
    for (const [propertyKey, propertyValue] of Object.entries(value)) {
      if (regex2.test(propertyKey))
        continue;
      return yield Create$1(ValueErrorType.ObjectAdditionalProperties, schema, `${path2}/${EscapeKey(propertyKey)}`, propertyValue);
    }
  }
}
function* FromRef$6(schema, references, path2, value) {
  yield* Visit$6(Deref(schema, references), references, path2, value);
}
function* FromRegExp$1(schema, references, path2, value) {
  if (!IsString$2(value))
    return yield Create$1(ValueErrorType.String, schema, path2, value);
  if (IsDefined(schema.minLength) && !(value.length >= schema.minLength)) {
    yield Create$1(ValueErrorType.StringMinLength, schema, path2, value);
  }
  if (IsDefined(schema.maxLength) && !(value.length <= schema.maxLength)) {
    yield Create$1(ValueErrorType.StringMaxLength, schema, path2, value);
  }
  const regex2 = new RegExp(schema.source, schema.flags);
  if (!regex2.test(value)) {
    return yield Create$1(ValueErrorType.RegExp, schema, path2, value);
  }
}
function* FromString$1(schema, references, path2, value) {
  if (!IsString$2(value))
    return yield Create$1(ValueErrorType.String, schema, path2, value);
  if (IsDefined(schema.minLength) && !(value.length >= schema.minLength)) {
    yield Create$1(ValueErrorType.StringMinLength, schema, path2, value);
  }
  if (IsDefined(schema.maxLength) && !(value.length <= schema.maxLength)) {
    yield Create$1(ValueErrorType.StringMaxLength, schema, path2, value);
  }
  if (IsString$2(schema.pattern)) {
    const regex2 = new RegExp(schema.pattern);
    if (!regex2.test(value)) {
      yield Create$1(ValueErrorType.StringPattern, schema, path2, value);
    }
  }
  if (IsString$2(schema.format)) {
    if (!Has$1(schema.format)) {
      yield Create$1(ValueErrorType.StringFormatUnknown, schema, path2, value);
    } else {
      const format = Get$1(schema.format);
      if (!format(value)) {
        yield Create$1(ValueErrorType.StringFormat, schema, path2, value);
      }
    }
  }
}
function* FromSymbol$1(schema, references, path2, value) {
  if (!IsSymbol$2(value))
    yield Create$1(ValueErrorType.Symbol, schema, path2, value);
}
function* FromTemplateLiteral$1(schema, references, path2, value) {
  if (!IsString$2(value))
    return yield Create$1(ValueErrorType.String, schema, path2, value);
  const regex2 = new RegExp(schema.pattern);
  if (!regex2.test(value)) {
    yield Create$1(ValueErrorType.StringPattern, schema, path2, value);
  }
}
function* FromThis$6(schema, references, path2, value) {
  yield* Visit$6(Deref(schema, references), references, path2, value);
}
function* FromTuple$6(schema, references, path2, value) {
  if (!IsArray$2(value))
    return yield Create$1(ValueErrorType.Tuple, schema, path2, value);
  if (schema.items === void 0 && !(value.length === 0)) {
    return yield Create$1(ValueErrorType.TupleLength, schema, path2, value);
  }
  if (!(value.length === schema.maxItems)) {
    return yield Create$1(ValueErrorType.TupleLength, schema, path2, value);
  }
  if (!schema.items) {
    return;
  }
  for (let i = 0; i < schema.items.length; i++) {
    yield* Visit$6(schema.items[i], references, `${path2}/${i}`, value[i]);
  }
}
function* FromUndefined$1(schema, references, path2, value) {
  if (!IsUndefined$2(value))
    yield Create$1(ValueErrorType.Undefined, schema, path2, value);
}
function* FromUnion$6(schema, references, path2, value) {
  if (Check(schema, references, value))
    return;
  const errors = schema.anyOf.map((variant) => new ValueErrorIterator(Visit$6(variant, references, path2, value)));
  yield Create$1(ValueErrorType.Union, schema, path2, value, errors);
}
function* FromUint8Array$1(schema, references, path2, value) {
  if (!IsUint8Array$2(value))
    return yield Create$1(ValueErrorType.Uint8Array, schema, path2, value);
  if (IsDefined(schema.maxByteLength) && !(value.length <= schema.maxByteLength)) {
    yield Create$1(ValueErrorType.Uint8ArrayMaxByteLength, schema, path2, value);
  }
  if (IsDefined(schema.minByteLength) && !(value.length >= schema.minByteLength)) {
    yield Create$1(ValueErrorType.Uint8ArrayMinByteLength, schema, path2, value);
  }
}
function* FromUnknown$1(schema, references, path2, value) {
}
function* FromVoid$1(schema, references, path2, value) {
  if (!TypeSystemPolicy.IsVoidLike(value))
    yield Create$1(ValueErrorType.Void, schema, path2, value);
}
function* FromKind$1(schema, references, path2, value) {
  const check = Get(schema[Kind$1]);
  if (!check(schema, value))
    yield Create$1(ValueErrorType.Kind, schema, path2, value);
}
function* Visit$6(schema, references, path2, value) {
  const references_ = IsDefined(schema.$id) ? [...references, schema] : references;
  const schema_ = schema;
  switch (schema_[Kind$1]) {
    case "Any":
      return yield* FromAny$1();
    case "Argument":
      return yield* FromArgument$1();
    case "Array":
      return yield* FromArray$7(schema_, references_, path2, value);
    case "AsyncIterator":
      return yield* FromAsyncIterator$2(schema_, references_, path2, value);
    case "BigInt":
      return yield* FromBigInt$1(schema_, references_, path2, value);
    case "Boolean":
      return yield* FromBoolean$1(schema_, references_, path2, value);
    case "Constructor":
      return yield* FromConstructor$2(schema_, references_, path2, value);
    case "Date":
      return yield* FromDate$3(schema_, references_, path2, value);
    case "Function":
      return yield* FromFunction$2(schema_, references_, path2, value);
    case "Import":
      return yield* FromImport$6(schema_, references_, path2, value);
    case "Integer":
      return yield* FromInteger$1(schema_, references_, path2, value);
    case "Intersect":
      return yield* FromIntersect$6(schema_, references_, path2, value);
    case "Iterator":
      return yield* FromIterator$2(schema_, references_, path2, value);
    case "Literal":
      return yield* FromLiteral$1(schema_, references_, path2, value);
    case "Never":
      return yield* FromNever$1(schema_, references_, path2, value);
    case "Not":
      return yield* FromNot$4(schema_, references_, path2, value);
    case "Null":
      return yield* FromNull$1(schema_, references_, path2, value);
    case "Number":
      return yield* FromNumber$1(schema_, references_, path2, value);
    case "Object":
      return yield* FromObject$7(schema_, references_, path2, value);
    case "Promise":
      return yield* FromPromise$2(schema_, references_, path2, value);
    case "Record":
      return yield* FromRecord$6(schema_, references_, path2, value);
    case "Ref":
      return yield* FromRef$6(schema_, references_, path2, value);
    case "RegExp":
      return yield* FromRegExp$1(schema_, references_, path2, value);
    case "String":
      return yield* FromString$1(schema_, references_, path2, value);
    case "Symbol":
      return yield* FromSymbol$1(schema_, references_, path2, value);
    case "TemplateLiteral":
      return yield* FromTemplateLiteral$1(schema_, references_, path2, value);
    case "This":
      return yield* FromThis$6(schema_, references_, path2, value);
    case "Tuple":
      return yield* FromTuple$6(schema_, references_, path2, value);
    case "Undefined":
      return yield* FromUndefined$1(schema_, references_, path2, value);
    case "Union":
      return yield* FromUnion$6(schema_, references_, path2, value);
    case "Uint8Array":
      return yield* FromUint8Array$1(schema_, references_, path2, value);
    case "Unknown":
      return yield* FromUnknown$1();
    case "Void":
      return yield* FromVoid$1(schema_, references_, path2, value);
    default:
      if (!Has(schema_[Kind$1]))
        throw new ValueErrorsUnknownTypeError(schema);
      return yield* FromKind$1(schema_, references_, path2, value);
  }
}
function Errors(...args) {
  const iterator = args.length === 3 ? Visit$6(args[0], args[1], "", args[2]) : Visit$6(args[0], [], "", args[1]);
  return new ValueErrorIterator(iterator);
}
function FromObject$6(value) {
  const Acc = {};
  for (const key of Object.getOwnPropertyNames(value)) {
    Acc[key] = Clone(value[key]);
  }
  for (const key of Object.getOwnPropertySymbols(value)) {
    Acc[key] = Clone(value[key]);
  }
  return Acc;
}
function FromArray$6(value) {
  return value.map((element) => Clone(element));
}
function FromTypedArray(value) {
  return value.slice();
}
function FromMap(value) {
  return new Map(Clone([...value.entries()]));
}
function FromSet(value) {
  return new Set(Clone([...value.entries()]));
}
function FromDate$2(value) {
  return new Date(value.toISOString());
}
function FromValue(value) {
  return value;
}
function Clone(value) {
  if (IsArray$2(value))
    return FromArray$6(value);
  if (IsDate$2(value))
    return FromDate$2(value);
  if (IsTypedArray(value))
    return FromTypedArray(value);
  if (IsMap(value))
    return FromMap(value);
  if (IsSet(value))
    return FromSet(value);
  if (IsObject$2(value))
    return FromObject$6(value);
  if (IsValueType(value))
    return FromValue(value);
  throw new Error("ValueClone: Unable to clone value");
}
class ValueCreateError extends TypeBoxError {
  constructor(schema, message) {
    super(message);
    this.schema = schema;
  }
}
function FromDefault(value) {
  return IsFunction$2(value) ? value() : Clone(value);
}
function FromAny(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return {};
  }
}
function FromArgument(schema, references) {
  return {};
}
function FromArray$5(schema, references) {
  if (schema.uniqueItems === true && !HasPropertyKey(schema, "default")) {
    throw new ValueCreateError(schema, "Array with the uniqueItems constraint requires a default value");
  } else if ("contains" in schema && !HasPropertyKey(schema, "default")) {
    throw new ValueCreateError(schema, "Array with the contains constraint requires a default value");
  } else if ("default" in schema) {
    return FromDefault(schema.default);
  } else if (schema.minItems !== void 0) {
    return Array.from({ length: schema.minItems }).map((item) => {
      return Visit$5(schema.items, references);
    });
  } else {
    return [];
  }
}
function FromAsyncIterator$1(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return async function* () {
    }();
  }
}
function FromBigInt(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return BigInt(0);
  }
}
function FromBoolean(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return false;
  }
}
function FromConstructor$1(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    const value = Visit$5(schema.returns, references);
    if (typeof value === "object" && !Array.isArray(value)) {
      return class {
        constructor() {
          for (const [key, val] of Object.entries(value)) {
            const self2 = this;
            self2[key] = val;
          }
        }
      };
    } else {
      return class {
      };
    }
  }
}
function FromDate$1(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else if (schema.minimumTimestamp !== void 0) {
    return new Date(schema.minimumTimestamp);
  } else {
    return /* @__PURE__ */ new Date();
  }
}
function FromFunction$1(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return () => Visit$5(schema.returns, references);
  }
}
function FromImport$5(schema, references) {
  const definitions = globalThis.Object.values(schema.$defs);
  const target = schema.$defs[schema.$ref];
  return Visit$5(target, [...references, ...definitions]);
}
function FromInteger(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else if (schema.minimum !== void 0) {
    return schema.minimum;
  } else {
    return 0;
  }
}
function FromIntersect$5(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    const value = schema.allOf.reduce((acc, schema2) => {
      const next = Visit$5(schema2, references);
      return typeof next === "object" ? { ...acc, ...next } : next;
    }, {});
    if (!Check(schema, references, value))
      throw new ValueCreateError(schema, "Intersect produced invalid value. Consider using a default value.");
    return value;
  }
}
function FromIterator$1(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return function* () {
    }();
  }
}
function FromLiteral(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return schema.const;
  }
}
function FromNever(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    throw new ValueCreateError(schema, "Never types cannot be created. Consider using a default value.");
  }
}
function FromNot$3(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    throw new ValueCreateError(schema, "Not types must have a default value");
  }
}
function FromNull(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return null;
  }
}
function FromNumber(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else if (schema.minimum !== void 0) {
    return schema.minimum;
  } else {
    return 0;
  }
}
function FromObject$5(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    const required = new Set(schema.required);
    const Acc = {};
    for (const [key, subschema] of Object.entries(schema.properties)) {
      if (!required.has(key))
        continue;
      Acc[key] = Visit$5(subschema, references);
    }
    return Acc;
  }
}
function FromPromise$1(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return Promise.resolve(Visit$5(schema.item, references));
  }
}
function FromRecord$5(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return {};
  }
}
function FromRef$5(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return Visit$5(Deref(schema, references), references);
  }
}
function FromRegExp(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    throw new ValueCreateError(schema, "RegExp types cannot be created. Consider using a default value.");
  }
}
function FromString(schema, references) {
  if (schema.pattern !== void 0) {
    if (!HasPropertyKey(schema, "default")) {
      throw new ValueCreateError(schema, "String types with patterns must specify a default value");
    } else {
      return FromDefault(schema.default);
    }
  } else if (schema.format !== void 0) {
    if (!HasPropertyKey(schema, "default")) {
      throw new ValueCreateError(schema, "String types with formats must specify a default value");
    } else {
      return FromDefault(schema.default);
    }
  } else {
    if (HasPropertyKey(schema, "default")) {
      return FromDefault(schema.default);
    } else if (schema.minLength !== void 0) {
      return Array.from({ length: schema.minLength }).map(() => " ").join("");
    } else {
      return "";
    }
  }
}
function FromSymbol(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else if ("value" in schema) {
    return Symbol.for(schema.value);
  } else {
    return Symbol();
  }
}
function FromTemplateLiteral(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  }
  if (!IsTemplateLiteralFinite(schema))
    throw new ValueCreateError(schema, "Can only create template literals that produce a finite variants. Consider using a default value.");
  const generated = TemplateLiteralGenerate(schema);
  return generated[0];
}
function FromThis$5(schema, references) {
  if (recursiveDepth++ > recursiveMaxDepth)
    throw new ValueCreateError(schema, "Cannot create recursive type as it appears possibly infinite. Consider using a default.");
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return Visit$5(Deref(schema, references), references);
  }
}
function FromTuple$5(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  }
  if (schema.items === void 0) {
    return [];
  } else {
    return Array.from({ length: schema.minItems }).map((_, index) => Visit$5(schema.items[index], references));
  }
}
function FromUndefined(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return void 0;
  }
}
function FromUnion$5(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else if (schema.anyOf.length === 0) {
    throw new Error("ValueCreate.Union: Cannot create Union with zero variants");
  } else {
    return Visit$5(schema.anyOf[0], references);
  }
}
function FromUint8Array(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else if (schema.minByteLength !== void 0) {
    return new Uint8Array(schema.minByteLength);
  } else {
    return new Uint8Array(0);
  }
}
function FromUnknown(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return {};
  }
}
function FromVoid(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return void 0;
  }
}
function FromKind(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    throw new Error("User defined types must specify a default value");
  }
}
function Visit$5(schema, references) {
  const references_ = Pushref(schema, references);
  const schema_ = schema;
  switch (schema_[Kind$1]) {
    case "Any":
      return FromAny(schema_);
    case "Argument":
      return FromArgument();
    case "Array":
      return FromArray$5(schema_, references_);
    case "AsyncIterator":
      return FromAsyncIterator$1(schema_);
    case "BigInt":
      return FromBigInt(schema_);
    case "Boolean":
      return FromBoolean(schema_);
    case "Constructor":
      return FromConstructor$1(schema_, references_);
    case "Date":
      return FromDate$1(schema_);
    case "Function":
      return FromFunction$1(schema_, references_);
    case "Import":
      return FromImport$5(schema_, references_);
    case "Integer":
      return FromInteger(schema_);
    case "Intersect":
      return FromIntersect$5(schema_, references_);
    case "Iterator":
      return FromIterator$1(schema_);
    case "Literal":
      return FromLiteral(schema_);
    case "Never":
      return FromNever(schema_);
    case "Not":
      return FromNot$3(schema_);
    case "Null":
      return FromNull(schema_);
    case "Number":
      return FromNumber(schema_);
    case "Object":
      return FromObject$5(schema_, references_);
    case "Promise":
      return FromPromise$1(schema_, references_);
    case "Record":
      return FromRecord$5(schema_);
    case "Ref":
      return FromRef$5(schema_, references_);
    case "RegExp":
      return FromRegExp(schema_);
    case "String":
      return FromString(schema_);
    case "Symbol":
      return FromSymbol(schema_);
    case "TemplateLiteral":
      return FromTemplateLiteral(schema_);
    case "This":
      return FromThis$5(schema_, references_);
    case "Tuple":
      return FromTuple$5(schema_, references_);
    case "Undefined":
      return FromUndefined(schema_);
    case "Union":
      return FromUnion$5(schema_, references_);
    case "Uint8Array":
      return FromUint8Array(schema_);
    case "Unknown":
      return FromUnknown(schema_);
    case "Void":
      return FromVoid(schema_);
    default:
      if (!Has(schema_[Kind$1]))
        throw new ValueCreateError(schema_, "Unknown type");
      return FromKind(schema_);
  }
}
const recursiveMaxDepth = 512;
let recursiveDepth = 0;
function Create(...args) {
  recursiveDepth = 0;
  return args.length === 2 ? Visit$5(args[0], args[1]) : Visit$5(args[0], []);
}
function IsCheckable(schema) {
  return IsKind$1(schema) && schema[Kind$1] !== "Unsafe";
}
function FromArray$4(schema, references, value) {
  if (!IsArray$2(value))
    return value;
  return value.map((value2) => Visit$4(schema.items, references, value2));
}
function FromImport$4(schema, references, value) {
  const definitions = globalThis.Object.values(schema.$defs);
  const target = schema.$defs[schema.$ref];
  return Visit$4(target, [...references, ...definitions], value);
}
function FromIntersect$4(schema, references, value) {
  const unevaluatedProperties = schema.unevaluatedProperties;
  const intersections = schema.allOf.map((schema2) => Visit$4(schema2, references, Clone(value)));
  const composite = intersections.reduce((acc, value2) => IsObject$2(value2) ? { ...acc, ...value2 } : value2, {});
  if (!IsObject$2(value) || !IsObject$2(composite) || !IsKind$1(unevaluatedProperties))
    return composite;
  const knownkeys = KeyOfPropertyKeys(schema);
  for (const key of Object.getOwnPropertyNames(value)) {
    if (knownkeys.includes(key))
      continue;
    if (Check(unevaluatedProperties, references, value[key])) {
      composite[key] = Visit$4(unevaluatedProperties, references, value[key]);
    }
  }
  return composite;
}
function FromObject$4(schema, references, value) {
  if (!IsObject$2(value) || IsArray$2(value))
    return value;
  const additionalProperties = schema.additionalProperties;
  for (const key of Object.getOwnPropertyNames(value)) {
    if (HasPropertyKey(schema.properties, key)) {
      value[key] = Visit$4(schema.properties[key], references, value[key]);
      continue;
    }
    if (IsKind$1(additionalProperties) && Check(additionalProperties, references, value[key])) {
      value[key] = Visit$4(additionalProperties, references, value[key]);
      continue;
    }
    delete value[key];
  }
  return value;
}
function FromRecord$4(schema, references, value) {
  if (!IsObject$2(value))
    return value;
  const additionalProperties = schema.additionalProperties;
  const propertyKeys = Object.getOwnPropertyNames(value);
  const [propertyKey, propertySchema] = Object.entries(schema.patternProperties)[0];
  const propertyKeyTest = new RegExp(propertyKey);
  for (const key of propertyKeys) {
    if (propertyKeyTest.test(key)) {
      value[key] = Visit$4(propertySchema, references, value[key]);
      continue;
    }
    if (IsKind$1(additionalProperties) && Check(additionalProperties, references, value[key])) {
      value[key] = Visit$4(additionalProperties, references, value[key]);
      continue;
    }
    delete value[key];
  }
  return value;
}
function FromRef$4(schema, references, value) {
  return Visit$4(Deref(schema, references), references, value);
}
function FromThis$4(schema, references, value) {
  return Visit$4(Deref(schema, references), references, value);
}
function FromTuple$4(schema, references, value) {
  if (!IsArray$2(value))
    return value;
  if (IsUndefined$2(schema.items))
    return [];
  const length = Math.min(value.length, schema.items.length);
  for (let i = 0; i < length; i++) {
    value[i] = Visit$4(schema.items[i], references, value[i]);
  }
  return value.length > length ? value.slice(0, length) : value;
}
function FromUnion$4(schema, references, value) {
  for (const inner of schema.anyOf) {
    if (IsCheckable(inner) && Check(inner, references, value)) {
      return Visit$4(inner, references, value);
    }
  }
  return value;
}
function Visit$4(schema, references, value) {
  const references_ = IsString$2(schema.$id) ? Pushref(schema, references) : references;
  const schema_ = schema;
  switch (schema_[Kind$1]) {
    case "Array":
      return FromArray$4(schema_, references_, value);
    case "Import":
      return FromImport$4(schema_, references_, value);
    case "Intersect":
      return FromIntersect$4(schema_, references_, value);
    case "Object":
      return FromObject$4(schema_, references_, value);
    case "Record":
      return FromRecord$4(schema_, references_, value);
    case "Ref":
      return FromRef$4(schema_, references_, value);
    case "This":
      return FromThis$4(schema_, references_, value);
    case "Tuple":
      return FromTuple$4(schema_, references_, value);
    case "Union":
      return FromUnion$4(schema_, references_, value);
    default:
      return value;
  }
}
function Clean(...args) {
  return args.length === 3 ? Visit$4(args[0], args[1], args[2]) : Visit$4(args[0], [], args[1]);
}
class TransformDecodeCheckError extends TypeBoxError {
  constructor(schema, value, error) {
    super(`Unable to decode value as it does not match the expected schema`);
    this.schema = schema;
    this.value = value;
    this.error = error;
  }
}
class TransformDecodeError extends TypeBoxError {
  constructor(schema, path2, value, error) {
    super(error instanceof Error ? error.message : "Unknown error");
    this.schema = schema;
    this.path = path2;
    this.value = value;
    this.error = error;
  }
}
function Default$2(schema, path2, value) {
  try {
    return IsTransform$1(schema) ? schema[TransformKind].Decode(value) : value;
  } catch (error) {
    throw new TransformDecodeError(schema, path2, value, error);
  }
}
function FromArray$3(schema, references, path2, value) {
  return IsArray$2(value) ? Default$2(schema, path2, value.map((value2, index) => Visit$3(schema.items, references, `${path2}/${index}`, value2))) : Default$2(schema, path2, value);
}
function FromIntersect$3(schema, references, path2, value) {
  if (!IsObject$2(value) || IsValueType(value))
    return Default$2(schema, path2, value);
  const knownEntries = KeyOfPropertyEntries(schema);
  const knownKeys = knownEntries.map((entry) => entry[0]);
  const knownProperties = { ...value };
  for (const [knownKey, knownSchema] of knownEntries)
    if (knownKey in knownProperties) {
      knownProperties[knownKey] = Visit$3(knownSchema, references, `${path2}/${knownKey}`, knownProperties[knownKey]);
    }
  if (!IsTransform$1(schema.unevaluatedProperties)) {
    return Default$2(schema, path2, knownProperties);
  }
  const unknownKeys = Object.getOwnPropertyNames(knownProperties);
  const unevaluatedProperties = schema.unevaluatedProperties;
  const unknownProperties = { ...knownProperties };
  for (const key of unknownKeys)
    if (!knownKeys.includes(key)) {
      unknownProperties[key] = Default$2(unevaluatedProperties, `${path2}/${key}`, unknownProperties[key]);
    }
  return Default$2(schema, path2, unknownProperties);
}
function FromImport$3(schema, references, path2, value) {
  const additional = globalThis.Object.values(schema.$defs);
  const target = schema.$defs[schema.$ref];
  const result = Visit$3(target, [...references, ...additional], path2, value);
  return Default$2(schema, path2, result);
}
function FromNot$2(schema, references, path2, value) {
  return Default$2(schema, path2, Visit$3(schema.not, references, path2, value));
}
function FromObject$3(schema, references, path2, value) {
  if (!IsObject$2(value))
    return Default$2(schema, path2, value);
  const knownKeys = KeyOfPropertyKeys(schema);
  const knownProperties = { ...value };
  for (const key of knownKeys) {
    if (!HasPropertyKey(knownProperties, key))
      continue;
    if (IsUndefined$2(knownProperties[key]) && (!IsUndefined$1(schema.properties[key]) || TypeSystemPolicy.IsExactOptionalProperty(knownProperties, key)))
      continue;
    knownProperties[key] = Visit$3(schema.properties[key], references, `${path2}/${key}`, knownProperties[key]);
  }
  if (!IsSchema$1(schema.additionalProperties)) {
    return Default$2(schema, path2, knownProperties);
  }
  const unknownKeys = Object.getOwnPropertyNames(knownProperties);
  const additionalProperties = schema.additionalProperties;
  const unknownProperties = { ...knownProperties };
  for (const key of unknownKeys)
    if (!knownKeys.includes(key)) {
      unknownProperties[key] = Default$2(additionalProperties, `${path2}/${key}`, unknownProperties[key]);
    }
  return Default$2(schema, path2, unknownProperties);
}
function FromRecord$3(schema, references, path2, value) {
  if (!IsObject$2(value))
    return Default$2(schema, path2, value);
  const pattern = Object.getOwnPropertyNames(schema.patternProperties)[0];
  const knownKeys = new RegExp(pattern);
  const knownProperties = { ...value };
  for (const key of Object.getOwnPropertyNames(value))
    if (knownKeys.test(key)) {
      knownProperties[key] = Visit$3(schema.patternProperties[pattern], references, `${path2}/${key}`, knownProperties[key]);
    }
  if (!IsSchema$1(schema.additionalProperties)) {
    return Default$2(schema, path2, knownProperties);
  }
  const unknownKeys = Object.getOwnPropertyNames(knownProperties);
  const additionalProperties = schema.additionalProperties;
  const unknownProperties = { ...knownProperties };
  for (const key of unknownKeys)
    if (!knownKeys.test(key)) {
      unknownProperties[key] = Default$2(additionalProperties, `${path2}/${key}`, unknownProperties[key]);
    }
  return Default$2(schema, path2, unknownProperties);
}
function FromRef$3(schema, references, path2, value) {
  const target = Deref(schema, references);
  return Default$2(schema, path2, Visit$3(target, references, path2, value));
}
function FromThis$3(schema, references, path2, value) {
  const target = Deref(schema, references);
  return Default$2(schema, path2, Visit$3(target, references, path2, value));
}
function FromTuple$3(schema, references, path2, value) {
  return IsArray$2(value) && IsArray$2(schema.items) ? Default$2(schema, path2, schema.items.map((schema2, index) => Visit$3(schema2, references, `${path2}/${index}`, value[index]))) : Default$2(schema, path2, value);
}
function FromUnion$3(schema, references, path2, value) {
  for (const subschema of schema.anyOf) {
    if (!Check(subschema, references, value))
      continue;
    const decoded = Visit$3(subschema, references, path2, value);
    return Default$2(schema, path2, decoded);
  }
  return Default$2(schema, path2, value);
}
function Visit$3(schema, references, path2, value) {
  const references_ = Pushref(schema, references);
  const schema_ = schema;
  switch (schema[Kind$1]) {
    case "Array":
      return FromArray$3(schema_, references_, path2, value);
    case "Import":
      return FromImport$3(schema_, references_, path2, value);
    case "Intersect":
      return FromIntersect$3(schema_, references_, path2, value);
    case "Not":
      return FromNot$2(schema_, references_, path2, value);
    case "Object":
      return FromObject$3(schema_, references_, path2, value);
    case "Record":
      return FromRecord$3(schema_, references_, path2, value);
    case "Ref":
      return FromRef$3(schema_, references_, path2, value);
    case "Symbol":
      return Default$2(schema_, path2, value);
    case "This":
      return FromThis$3(schema_, references_, path2, value);
    case "Tuple":
      return FromTuple$3(schema_, references_, path2, value);
    case "Union":
      return FromUnion$3(schema_, references_, path2, value);
    default:
      return Default$2(schema_, path2, value);
  }
}
function TransformDecode(schema, references, value) {
  return Visit$3(schema, references, "", value);
}
class TransformEncodeCheckError extends TypeBoxError {
  constructor(schema, value, error) {
    super(`The encoded value does not match the expected schema`);
    this.schema = schema;
    this.value = value;
    this.error = error;
  }
}
class TransformEncodeError extends TypeBoxError {
  constructor(schema, path2, value, error) {
    super(`${error instanceof Error ? error.message : "Unknown error"}`);
    this.schema = schema;
    this.path = path2;
    this.value = value;
    this.error = error;
  }
}
function Default$1(schema, path2, value) {
  try {
    return IsTransform$1(schema) ? schema[TransformKind].Encode(value) : value;
  } catch (error) {
    throw new TransformEncodeError(schema, path2, value, error);
  }
}
function FromArray$2(schema, references, path2, value) {
  const defaulted = Default$1(schema, path2, value);
  return IsArray$2(defaulted) ? defaulted.map((value2, index) => Visit$2(schema.items, references, `${path2}/${index}`, value2)) : defaulted;
}
function FromImport$2(schema, references, path2, value) {
  const additional = globalThis.Object.values(schema.$defs);
  const target = schema.$defs[schema.$ref];
  const result = Default$1(schema, path2, value);
  return Visit$2(target, [...references, ...additional], path2, result);
}
function FromIntersect$2(schema, references, path2, value) {
  const defaulted = Default$1(schema, path2, value);
  if (!IsObject$2(value) || IsValueType(value))
    return defaulted;
  const knownEntries = KeyOfPropertyEntries(schema);
  const knownKeys = knownEntries.map((entry) => entry[0]);
  const knownProperties = { ...defaulted };
  for (const [knownKey, knownSchema] of knownEntries)
    if (knownKey in knownProperties) {
      knownProperties[knownKey] = Visit$2(knownSchema, references, `${path2}/${knownKey}`, knownProperties[knownKey]);
    }
  if (!IsTransform$1(schema.unevaluatedProperties)) {
    return knownProperties;
  }
  const unknownKeys = Object.getOwnPropertyNames(knownProperties);
  const unevaluatedProperties = schema.unevaluatedProperties;
  const properties = { ...knownProperties };
  for (const key of unknownKeys)
    if (!knownKeys.includes(key)) {
      properties[key] = Default$1(unevaluatedProperties, `${path2}/${key}`, properties[key]);
    }
  return properties;
}
function FromNot$1(schema, references, path2, value) {
  return Default$1(schema.not, path2, Default$1(schema, path2, value));
}
function FromObject$2(schema, references, path2, value) {
  const defaulted = Default$1(schema, path2, value);
  if (!IsObject$2(defaulted))
    return defaulted;
  const knownKeys = KeyOfPropertyKeys(schema);
  const knownProperties = { ...defaulted };
  for (const key of knownKeys) {
    if (!HasPropertyKey(knownProperties, key))
      continue;
    if (IsUndefined$2(knownProperties[key]) && (!IsUndefined$1(schema.properties[key]) || TypeSystemPolicy.IsExactOptionalProperty(knownProperties, key)))
      continue;
    knownProperties[key] = Visit$2(schema.properties[key], references, `${path2}/${key}`, knownProperties[key]);
  }
  if (!IsSchema$1(schema.additionalProperties)) {
    return knownProperties;
  }
  const unknownKeys = Object.getOwnPropertyNames(knownProperties);
  const additionalProperties = schema.additionalProperties;
  const properties = { ...knownProperties };
  for (const key of unknownKeys)
    if (!knownKeys.includes(key)) {
      properties[key] = Default$1(additionalProperties, `${path2}/${key}`, properties[key]);
    }
  return properties;
}
function FromRecord$2(schema, references, path2, value) {
  const defaulted = Default$1(schema, path2, value);
  if (!IsObject$2(value))
    return defaulted;
  const pattern = Object.getOwnPropertyNames(schema.patternProperties)[0];
  const knownKeys = new RegExp(pattern);
  const knownProperties = { ...defaulted };
  for (const key of Object.getOwnPropertyNames(value))
    if (knownKeys.test(key)) {
      knownProperties[key] = Visit$2(schema.patternProperties[pattern], references, `${path2}/${key}`, knownProperties[key]);
    }
  if (!IsSchema$1(schema.additionalProperties)) {
    return knownProperties;
  }
  const unknownKeys = Object.getOwnPropertyNames(knownProperties);
  const additionalProperties = schema.additionalProperties;
  const properties = { ...knownProperties };
  for (const key of unknownKeys)
    if (!knownKeys.test(key)) {
      properties[key] = Default$1(additionalProperties, `${path2}/${key}`, properties[key]);
    }
  return properties;
}
function FromRef$2(schema, references, path2, value) {
  const target = Deref(schema, references);
  const resolved = Visit$2(target, references, path2, value);
  return Default$1(schema, path2, resolved);
}
function FromThis$2(schema, references, path2, value) {
  const target = Deref(schema, references);
  const resolved = Visit$2(target, references, path2, value);
  return Default$1(schema, path2, resolved);
}
function FromTuple$2(schema, references, path2, value) {
  const value1 = Default$1(schema, path2, value);
  return IsArray$2(schema.items) ? schema.items.map((schema2, index) => Visit$2(schema2, references, `${path2}/${index}`, value1[index])) : [];
}
function FromUnion$2(schema, references, path2, value) {
  for (const subschema of schema.anyOf) {
    if (!Check(subschema, references, value))
      continue;
    const value1 = Visit$2(subschema, references, path2, value);
    return Default$1(schema, path2, value1);
  }
  for (const subschema of schema.anyOf) {
    const value1 = Visit$2(subschema, references, path2, value);
    if (!Check(schema, references, value1))
      continue;
    return Default$1(schema, path2, value1);
  }
  return Default$1(schema, path2, value);
}
function Visit$2(schema, references, path2, value) {
  const references_ = Pushref(schema, references);
  const schema_ = schema;
  switch (schema[Kind$1]) {
    case "Array":
      return FromArray$2(schema_, references_, path2, value);
    case "Import":
      return FromImport$2(schema_, references_, path2, value);
    case "Intersect":
      return FromIntersect$2(schema_, references_, path2, value);
    case "Not":
      return FromNot$1(schema_, references_, path2, value);
    case "Object":
      return FromObject$2(schema_, references_, path2, value);
    case "Record":
      return FromRecord$2(schema_, references_, path2, value);
    case "Ref":
      return FromRef$2(schema_, references_, path2, value);
    case "This":
      return FromThis$2(schema_, references_, path2, value);
    case "Tuple":
      return FromTuple$2(schema_, references_, path2, value);
    case "Union":
      return FromUnion$2(schema_, references_, path2, value);
    default:
      return Default$1(schema_, path2, value);
  }
}
function TransformEncode(schema, references, value) {
  return Visit$2(schema, references, "", value);
}
function FromArray$1(schema, references) {
  return IsTransform$1(schema) || Visit$1(schema.items, references);
}
function FromAsyncIterator(schema, references) {
  return IsTransform$1(schema) || Visit$1(schema.items, references);
}
function FromConstructor(schema, references) {
  return IsTransform$1(schema) || Visit$1(schema.returns, references) || schema.parameters.some((schema2) => Visit$1(schema2, references));
}
function FromFunction(schema, references) {
  return IsTransform$1(schema) || Visit$1(schema.returns, references) || schema.parameters.some((schema2) => Visit$1(schema2, references));
}
function FromIntersect$1(schema, references) {
  return IsTransform$1(schema) || IsTransform$1(schema.unevaluatedProperties) || schema.allOf.some((schema2) => Visit$1(schema2, references));
}
function FromImport$1(schema, references) {
  const additional = globalThis.Object.getOwnPropertyNames(schema.$defs).reduce((result, key) => [...result, schema.$defs[key]], []);
  const target = schema.$defs[schema.$ref];
  return IsTransform$1(schema) || Visit$1(target, [...additional, ...references]);
}
function FromIterator(schema, references) {
  return IsTransform$1(schema) || Visit$1(schema.items, references);
}
function FromNot(schema, references) {
  return IsTransform$1(schema) || Visit$1(schema.not, references);
}
function FromObject$1(schema, references) {
  return IsTransform$1(schema) || Object.values(schema.properties).some((schema2) => Visit$1(schema2, references)) || IsSchema$1(schema.additionalProperties) && Visit$1(schema.additionalProperties, references);
}
function FromPromise(schema, references) {
  return IsTransform$1(schema) || Visit$1(schema.item, references);
}
function FromRecord$1(schema, references) {
  const pattern = Object.getOwnPropertyNames(schema.patternProperties)[0];
  const property = schema.patternProperties[pattern];
  return IsTransform$1(schema) || Visit$1(property, references) || IsSchema$1(schema.additionalProperties) && IsTransform$1(schema.additionalProperties);
}
function FromRef$1(schema, references) {
  if (IsTransform$1(schema))
    return true;
  return Visit$1(Deref(schema, references), references);
}
function FromThis$1(schema, references) {
  if (IsTransform$1(schema))
    return true;
  return Visit$1(Deref(schema, references), references);
}
function FromTuple$1(schema, references) {
  return IsTransform$1(schema) || !IsUndefined$2(schema.items) && schema.items.some((schema2) => Visit$1(schema2, references));
}
function FromUnion$1(schema, references) {
  return IsTransform$1(schema) || schema.anyOf.some((schema2) => Visit$1(schema2, references));
}
function Visit$1(schema, references) {
  const references_ = Pushref(schema, references);
  const schema_ = schema;
  if (schema.$id && visited.has(schema.$id))
    return false;
  if (schema.$id)
    visited.add(schema.$id);
  switch (schema[Kind$1]) {
    case "Array":
      return FromArray$1(schema_, references_);
    case "AsyncIterator":
      return FromAsyncIterator(schema_, references_);
    case "Constructor":
      return FromConstructor(schema_, references_);
    case "Function":
      return FromFunction(schema_, references_);
    case "Import":
      return FromImport$1(schema_, references_);
    case "Intersect":
      return FromIntersect$1(schema_, references_);
    case "Iterator":
      return FromIterator(schema_, references_);
    case "Not":
      return FromNot(schema_, references_);
    case "Object":
      return FromObject$1(schema_, references_);
    case "Promise":
      return FromPromise(schema_, references_);
    case "Record":
      return FromRecord$1(schema_, references_);
    case "Ref":
      return FromRef$1(schema_, references_);
    case "This":
      return FromThis$1(schema_, references_);
    case "Tuple":
      return FromTuple$1(schema_, references_);
    case "Union":
      return FromUnion$1(schema_, references_);
    default:
      return IsTransform$1(schema);
  }
}
const visited = /* @__PURE__ */ new Set();
function HasTransform(schema, references) {
  visited.clear();
  return Visit$1(schema, references);
}
function Decode(...args) {
  const [schema, references, value] = args.length === 3 ? [args[0], args[1], args[2]] : [args[0], [], args[1]];
  if (!Check(schema, references, value))
    throw new TransformDecodeCheckError(schema, value, Errors(schema, references, value).First());
  return HasTransform(schema, references) ? TransformDecode(schema, references, value) : value;
}
function ValueOrDefault(schema, value) {
  const defaultValue = HasPropertyKey(schema, "default") ? schema.default : void 0;
  const clone = IsFunction$2(defaultValue) ? defaultValue() : Clone(defaultValue);
  return IsUndefined$2(value) ? clone : IsObject$2(value) && IsObject$2(clone) ? Object.assign(clone, value) : value;
}
function HasDefaultProperty(schema) {
  return IsKind$1(schema) && "default" in schema;
}
function FromArray(schema, references, value) {
  if (IsArray$2(value)) {
    for (let i = 0; i < value.length; i++) {
      value[i] = Visit(schema.items, references, value[i]);
    }
    return value;
  }
  const defaulted = ValueOrDefault(schema, value);
  if (!IsArray$2(defaulted))
    return defaulted;
  for (let i = 0; i < defaulted.length; i++) {
    defaulted[i] = Visit(schema.items, references, defaulted[i]);
  }
  return defaulted;
}
function FromDate(schema, references, value) {
  return IsDate$2(value) ? value : ValueOrDefault(schema, value);
}
function FromImport(schema, references, value) {
  const definitions = globalThis.Object.values(schema.$defs);
  const target = schema.$defs[schema.$ref];
  return Visit(target, [...references, ...definitions], value);
}
function FromIntersect(schema, references, value) {
  const defaulted = ValueOrDefault(schema, value);
  return schema.allOf.reduce((acc, schema2) => {
    const next = Visit(schema2, references, defaulted);
    return IsObject$2(next) ? { ...acc, ...next } : next;
  }, {});
}
function FromObject(schema, references, value) {
  const defaulted = ValueOrDefault(schema, value);
  if (!IsObject$2(defaulted))
    return defaulted;
  const knownPropertyKeys = Object.getOwnPropertyNames(schema.properties);
  for (const key of knownPropertyKeys) {
    const propertyValue = Visit(schema.properties[key], references, defaulted[key]);
    if (IsUndefined$2(propertyValue))
      continue;
    defaulted[key] = Visit(schema.properties[key], references, defaulted[key]);
  }
  if (!HasDefaultProperty(schema.additionalProperties))
    return defaulted;
  for (const key of Object.getOwnPropertyNames(defaulted)) {
    if (knownPropertyKeys.includes(key))
      continue;
    defaulted[key] = Visit(schema.additionalProperties, references, defaulted[key]);
  }
  return defaulted;
}
function FromRecord(schema, references, value) {
  const defaulted = ValueOrDefault(schema, value);
  if (!IsObject$2(defaulted))
    return defaulted;
  const additionalPropertiesSchema = schema.additionalProperties;
  const [propertyKeyPattern, propertySchema] = Object.entries(schema.patternProperties)[0];
  const knownPropertyKey = new RegExp(propertyKeyPattern);
  for (const key of Object.getOwnPropertyNames(defaulted)) {
    if (!(knownPropertyKey.test(key) && HasDefaultProperty(propertySchema)))
      continue;
    defaulted[key] = Visit(propertySchema, references, defaulted[key]);
  }
  if (!HasDefaultProperty(additionalPropertiesSchema))
    return defaulted;
  for (const key of Object.getOwnPropertyNames(defaulted)) {
    if (knownPropertyKey.test(key))
      continue;
    defaulted[key] = Visit(additionalPropertiesSchema, references, defaulted[key]);
  }
  return defaulted;
}
function FromRef(schema, references, value) {
  return Visit(Deref(schema, references), references, ValueOrDefault(schema, value));
}
function FromThis(schema, references, value) {
  return Visit(Deref(schema, references), references, value);
}
function FromTuple(schema, references, value) {
  const defaulted = ValueOrDefault(schema, value);
  if (!IsArray$2(defaulted) || IsUndefined$2(schema.items))
    return defaulted;
  const [items, max] = [schema.items, Math.max(schema.items.length, defaulted.length)];
  for (let i = 0; i < max; i++) {
    if (i < items.length)
      defaulted[i] = Visit(items[i], references, defaulted[i]);
  }
  return defaulted;
}
function FromUnion(schema, references, value) {
  const defaulted = ValueOrDefault(schema, value);
  for (const inner of schema.anyOf) {
    const result = Visit(inner, references, Clone(defaulted));
    if (Check(inner, references, result)) {
      return result;
    }
  }
  return defaulted;
}
function Visit(schema, references, value) {
  const references_ = Pushref(schema, references);
  const schema_ = schema;
  switch (schema_[Kind$1]) {
    case "Array":
      return FromArray(schema_, references_, value);
    case "Date":
      return FromDate(schema_, references_, value);
    case "Import":
      return FromImport(schema_, references_, value);
    case "Intersect":
      return FromIntersect(schema_, references_, value);
    case "Object":
      return FromObject(schema_, references_, value);
    case "Record":
      return FromRecord(schema_, references_, value);
    case "Ref":
      return FromRef(schema_, references_, value);
    case "This":
      return FromThis(schema_, references_, value);
    case "Tuple":
      return FromTuple(schema_, references_, value);
    case "Union":
      return FromUnion(schema_, references_, value);
    default:
      return ValueOrDefault(schema_, value);
  }
}
function Default(...args) {
  return args.length === 3 ? Visit(args[0], args[1], args[2]) : Visit(args[0], [], args[1]);
}
function Encode(...args) {
  const [schema, references, value] = args.length === 3 ? [args[0], args[1], args[2]] : [args[0], [], args[1]];
  const encoded = HasTransform(schema, references) ? TransformEncode(schema, references, value) : value;
  if (!Check(schema, references, encoded))
    throw new TransformEncodeCheckError(schema, encoded, Errors(schema, references, encoded).First());
  return encoded;
}
class TypeCheck {
  constructor(schema, references, checkFunc, code) {
    this.schema = schema;
    this.references = references;
    this.checkFunc = checkFunc;
    this.code = code;
    this.hasTransform = HasTransform(schema, references);
  }
  /** Returns the generated assertion code used to validate this type. */
  Code() {
    return this.code;
  }
  /** Returns the schema type used to validate */
  Schema() {
    return this.schema;
  }
  /** Returns reference types used to validate */
  References() {
    return this.references;
  }
  /** Returns an iterator for each error in this value. */
  Errors(value) {
    return Errors(this.schema, this.references, value);
  }
  /** Returns true if the value matches the compiled type. */
  Check(value) {
    return this.checkFunc(value);
  }
  /** Decodes a value or throws if error */
  Decode(value) {
    if (!this.checkFunc(value))
      throw new TransformDecodeCheckError(this.schema, value, this.Errors(value).First());
    return this.hasTransform ? TransformDecode(this.schema, this.references, value) : value;
  }
  /** Encodes a value or throws if error */
  Encode(value) {
    const encoded = this.hasTransform ? TransformEncode(this.schema, this.references, value) : value;
    if (!this.checkFunc(encoded))
      throw new TransformEncodeCheckError(this.schema, value, this.Errors(value).First());
    return encoded;
  }
}
var Character;
(function(Character2) {
  function DollarSign(code) {
    return code === 36;
  }
  Character2.DollarSign = DollarSign;
  function IsUnderscore(code) {
    return code === 95;
  }
  Character2.IsUnderscore = IsUnderscore;
  function IsAlpha(code) {
    return code >= 65 && code <= 90 || code >= 97 && code <= 122;
  }
  Character2.IsAlpha = IsAlpha;
  function IsNumeric(code) {
    return code >= 48 && code <= 57;
  }
  Character2.IsNumeric = IsNumeric;
})(Character || (Character = {}));
var Identifier;
(function(Identifier2) {
  function Encode2($id) {
    const buffer = [];
    for (let i = 0; i < $id.length; i++) {
      const code = $id.charCodeAt(i);
      if (Character.IsNumeric(code) || Character.IsAlpha(code)) {
        buffer.push($id.charAt(i));
      } else {
        buffer.push(`_${code}_`);
      }
    }
    return buffer.join("").replace(/__/g, "_");
  }
  Identifier2.Encode = Encode2;
})(Identifier || (Identifier = {}));
function StringConstant(value) {
  if (!IsString$2(value))
    throw Error("ConstantString: Not a String");
  const canonical = JSON.stringify(value).slice(1, -1);
  const escaped = canonical.replace(/'/g, "\\'");
  return `'${escaped}'`;
}
function MemberExpression(value, key) {
  return `${value}[${StringConstant(key)}]`;
}
class TypeCompilerUnknownTypeError extends TypeBoxError {
  constructor(schema) {
    super("Unknown type");
    this.schema = schema;
  }
}
class TypeCompilerTypeGuardError extends TypeBoxError {
  constructor(schema) {
    super("Preflight validation check failed to guard for the given schema");
    this.schema = schema;
  }
}
var Policy;
(function(Policy2) {
  function IsExactOptionalProperty(value, key, expression) {
    return TypeSystemPolicy.ExactOptionalPropertyTypes ? `(${StringConstant(key)} in ${value} ? ${expression} : true)` : `(${MemberExpression(value, key)} !== undefined ? ${expression} : true)`;
  }
  Policy2.IsExactOptionalProperty = IsExactOptionalProperty;
  function IsObjectLike(value) {
    return !TypeSystemPolicy.AllowArrayObject ? `(typeof ${value} === 'object' && ${value} !== null && !Array.isArray(${value}))` : `(typeof ${value} === 'object' && ${value} !== null)`;
  }
  Policy2.IsObjectLike = IsObjectLike;
  function IsRecordLike(value) {
    return !TypeSystemPolicy.AllowArrayObject ? `(typeof ${value} === 'object' && ${value} !== null && !Array.isArray(${value}) && !(${value} instanceof Date) && !(${value} instanceof Uint8Array))` : `(typeof ${value} === 'object' && ${value} !== null && !(${value} instanceof Date) && !(${value} instanceof Uint8Array))`;
  }
  Policy2.IsRecordLike = IsRecordLike;
  function IsNumberLike(value) {
    return TypeSystemPolicy.AllowNaN ? `typeof ${value} === 'number'` : `Number.isFinite(${value})`;
  }
  Policy2.IsNumberLike = IsNumberLike;
  function IsVoidLike(value) {
    return TypeSystemPolicy.AllowNullVoid ? `(${value} === undefined || ${value} === null)` : `${value} === undefined`;
  }
  Policy2.IsVoidLike = IsVoidLike;
})(Policy || (Policy = {}));
var TypeCompiler;
(function(TypeCompiler2) {
  function IsAnyOrUnknown2(schema) {
    return schema[Kind$1] === "Any" || schema[Kind$1] === "Unknown";
  }
  function* FromAny2(schema, references, value) {
    yield "true";
  }
  function* FromArgument2(schema, references, value) {
    yield "true";
  }
  function* FromArray2(schema, references, value) {
    yield `Array.isArray(${value})`;
    const [parameter, accumulator] = [CreateParameter("value", "any"), CreateParameter("acc", "number")];
    if (IsNumber$2(schema.maxItems))
      yield `${value}.length <= ${schema.maxItems}`;
    if (IsNumber$2(schema.minItems))
      yield `${value}.length >= ${schema.minItems}`;
    const elementExpression = CreateExpression(schema.items, references, "value");
    yield `((array) => { for(const ${parameter} of array) if(!(${elementExpression})) { return false }; return true; })(${value})`;
    if (IsSchema(schema.contains) || IsNumber$2(schema.minContains) || IsNumber$2(schema.maxContains)) {
      const containsSchema = IsSchema(schema.contains) ? schema.contains : Never();
      const checkExpression = CreateExpression(containsSchema, references, "value");
      const checkMinContains = IsNumber$2(schema.minContains) ? [`(count >= ${schema.minContains})`] : [];
      const checkMaxContains = IsNumber$2(schema.maxContains) ? [`(count <= ${schema.maxContains})`] : [];
      const checkCount = `const count = value.reduce((${accumulator}, ${parameter}) => ${checkExpression} ? acc + 1 : acc, 0)`;
      const check = [`(count > 0)`, ...checkMinContains, ...checkMaxContains].join(" && ");
      yield `((${parameter}) => { ${checkCount}; return ${check}})(${value})`;
    }
    if (schema.uniqueItems === true) {
      const check = `const hashed = hash(element); if(set.has(hashed)) { return false } else { set.add(hashed) } } return true`;
      const block = `const set = new Set(); for(const element of value) { ${check} }`;
      yield `((${parameter}) => { ${block} )(${value})`;
    }
  }
  function* FromAsyncIterator2(schema, references, value) {
    yield `(typeof value === 'object' && Symbol.asyncIterator in ${value})`;
  }
  function* FromBigInt2(schema, references, value) {
    yield `(typeof ${value} === 'bigint')`;
    if (IsBigInt$2(schema.exclusiveMaximum))
      yield `${value} < BigInt(${schema.exclusiveMaximum})`;
    if (IsBigInt$2(schema.exclusiveMinimum))
      yield `${value} > BigInt(${schema.exclusiveMinimum})`;
    if (IsBigInt$2(schema.maximum))
      yield `${value} <= BigInt(${schema.maximum})`;
    if (IsBigInt$2(schema.minimum))
      yield `${value} >= BigInt(${schema.minimum})`;
    if (IsBigInt$2(schema.multipleOf))
      yield `(${value} % BigInt(${schema.multipleOf})) === 0`;
  }
  function* FromBoolean2(schema, references, value) {
    yield `(typeof ${value} === 'boolean')`;
  }
  function* FromConstructor2(schema, references, value) {
    yield* Visit2(schema.returns, references, `${value}.prototype`);
  }
  function* FromDate2(schema, references, value) {
    yield `(${value} instanceof Date) && Number.isFinite(${value}.getTime())`;
    if (IsNumber$2(schema.exclusiveMaximumTimestamp))
      yield `${value}.getTime() < ${schema.exclusiveMaximumTimestamp}`;
    if (IsNumber$2(schema.exclusiveMinimumTimestamp))
      yield `${value}.getTime() > ${schema.exclusiveMinimumTimestamp}`;
    if (IsNumber$2(schema.maximumTimestamp))
      yield `${value}.getTime() <= ${schema.maximumTimestamp}`;
    if (IsNumber$2(schema.minimumTimestamp))
      yield `${value}.getTime() >= ${schema.minimumTimestamp}`;
    if (IsNumber$2(schema.multipleOfTimestamp))
      yield `(${value}.getTime() % ${schema.multipleOfTimestamp}) === 0`;
  }
  function* FromFunction2(schema, references, value) {
    yield `(typeof ${value} === 'function')`;
  }
  function* FromImport2(schema, references, value) {
    const members = globalThis.Object.getOwnPropertyNames(schema.$defs).reduce((result, key) => {
      return [...result, schema.$defs[key]];
    }, []);
    yield* Visit2(Ref(schema.$ref), [...references, ...members], value);
  }
  function* FromInteger2(schema, references, value) {
    yield `Number.isInteger(${value})`;
    if (IsNumber$2(schema.exclusiveMaximum))
      yield `${value} < ${schema.exclusiveMaximum}`;
    if (IsNumber$2(schema.exclusiveMinimum))
      yield `${value} > ${schema.exclusiveMinimum}`;
    if (IsNumber$2(schema.maximum))
      yield `${value} <= ${schema.maximum}`;
    if (IsNumber$2(schema.minimum))
      yield `${value} >= ${schema.minimum}`;
    if (IsNumber$2(schema.multipleOf))
      yield `(${value} % ${schema.multipleOf}) === 0`;
  }
  function* FromIntersect2(schema, references, value) {
    const check1 = schema.allOf.map((schema2) => CreateExpression(schema2, references, value)).join(" && ");
    if (schema.unevaluatedProperties === false) {
      const keyCheck = CreateVariable(`${new RegExp(KeyOfPattern(schema))};`);
      const check2 = `Object.getOwnPropertyNames(${value}).every(key => ${keyCheck}.test(key))`;
      yield `(${check1} && ${check2})`;
    } else if (IsSchema(schema.unevaluatedProperties)) {
      const keyCheck = CreateVariable(`${new RegExp(KeyOfPattern(schema))};`);
      const check2 = `Object.getOwnPropertyNames(${value}).every(key => ${keyCheck}.test(key) || ${CreateExpression(schema.unevaluatedProperties, references, `${value}[key]`)})`;
      yield `(${check1} && ${check2})`;
    } else {
      yield `(${check1})`;
    }
  }
  function* FromIterator2(schema, references, value) {
    yield `(typeof value === 'object' && Symbol.iterator in ${value})`;
  }
  function* FromLiteral2(schema, references, value) {
    if (typeof schema.const === "number" || typeof schema.const === "boolean") {
      yield `(${value} === ${schema.const})`;
    } else if (typeof schema.const === "string") {
      yield `(${value} === ${StringConstant(schema.const)})`;
    } else {
      throw Error("Invalid Literal Value");
    }
  }
  function* FromNever2(schema, references, value) {
    yield `false`;
  }
  function* FromNot2(schema, references, value) {
    const expression = CreateExpression(schema.not, references, value);
    yield `(!${expression})`;
  }
  function* FromNull2(schema, references, value) {
    yield `(${value} === null)`;
  }
  function* FromNumber2(schema, references, value) {
    yield Policy.IsNumberLike(value);
    if (IsNumber$2(schema.exclusiveMaximum))
      yield `${value} < ${schema.exclusiveMaximum}`;
    if (IsNumber$2(schema.exclusiveMinimum))
      yield `${value} > ${schema.exclusiveMinimum}`;
    if (IsNumber$2(schema.maximum))
      yield `${value} <= ${schema.maximum}`;
    if (IsNumber$2(schema.minimum))
      yield `${value} >= ${schema.minimum}`;
    if (IsNumber$2(schema.multipleOf))
      yield `(${value} % ${schema.multipleOf}) === 0`;
  }
  function* FromObject2(schema, references, value) {
    yield Policy.IsObjectLike(value);
    if (IsNumber$2(schema.minProperties))
      yield `Object.getOwnPropertyNames(${value}).length >= ${schema.minProperties}`;
    if (IsNumber$2(schema.maxProperties))
      yield `Object.getOwnPropertyNames(${value}).length <= ${schema.maxProperties}`;
    const knownKeys = Object.getOwnPropertyNames(schema.properties);
    for (const knownKey of knownKeys) {
      const memberExpression = MemberExpression(value, knownKey);
      const property = schema.properties[knownKey];
      if (schema.required && schema.required.includes(knownKey)) {
        yield* Visit2(property, references, memberExpression);
        if (ExtendsUndefinedCheck(property) || IsAnyOrUnknown2(property))
          yield `(${StringConstant(knownKey)} in ${value})`;
      } else {
        const expression = CreateExpression(property, references, memberExpression);
        yield Policy.IsExactOptionalProperty(value, knownKey, expression);
      }
    }
    if (schema.additionalProperties === false) {
      if (schema.required && schema.required.length === knownKeys.length) {
        yield `Object.getOwnPropertyNames(${value}).length === ${knownKeys.length}`;
      } else {
        const keys = `[${knownKeys.map((key) => `${StringConstant(key)}`).join(", ")}]`;
        yield `Object.getOwnPropertyNames(${value}).every(key => ${keys}.includes(key))`;
      }
    }
    if (typeof schema.additionalProperties === "object") {
      const expression = CreateExpression(schema.additionalProperties, references, `${value}[key]`);
      const keys = `[${knownKeys.map((key) => `${StringConstant(key)}`).join(", ")}]`;
      yield `(Object.getOwnPropertyNames(${value}).every(key => ${keys}.includes(key) || ${expression}))`;
    }
  }
  function* FromPromise2(schema, references, value) {
    yield `${value} instanceof Promise`;
  }
  function* FromRecord2(schema, references, value) {
    yield Policy.IsRecordLike(value);
    if (IsNumber$2(schema.minProperties))
      yield `Object.getOwnPropertyNames(${value}).length >= ${schema.minProperties}`;
    if (IsNumber$2(schema.maxProperties))
      yield `Object.getOwnPropertyNames(${value}).length <= ${schema.maxProperties}`;
    const [patternKey, patternSchema] = Object.entries(schema.patternProperties)[0];
    const variable = CreateVariable(`${new RegExp(patternKey)}`);
    const check1 = CreateExpression(patternSchema, references, "value");
    const check2 = IsSchema(schema.additionalProperties) ? CreateExpression(schema.additionalProperties, references, value) : schema.additionalProperties === false ? "false" : "true";
    const expression = `(${variable}.test(key) ? ${check1} : ${check2})`;
    yield `(Object.entries(${value}).every(([key, value]) => ${expression}))`;
  }
  function* FromRef2(schema, references, value) {
    const target = Deref(schema, references);
    if (state.functions.has(schema.$ref))
      return yield `${CreateFunctionName(schema.$ref)}(${value})`;
    yield* Visit2(target, references, value);
  }
  function* FromRegExp2(schema, references, value) {
    const variable = CreateVariable(`${new RegExp(schema.source, schema.flags)};`);
    yield `(typeof ${value} === 'string')`;
    if (IsNumber$2(schema.maxLength))
      yield `${value}.length <= ${schema.maxLength}`;
    if (IsNumber$2(schema.minLength))
      yield `${value}.length >= ${schema.minLength}`;
    yield `${variable}.test(${value})`;
  }
  function* FromString2(schema, references, value) {
    yield `(typeof ${value} === 'string')`;
    if (IsNumber$2(schema.maxLength))
      yield `${value}.length <= ${schema.maxLength}`;
    if (IsNumber$2(schema.minLength))
      yield `${value}.length >= ${schema.minLength}`;
    if (schema.pattern !== void 0) {
      const variable = CreateVariable(`${new RegExp(schema.pattern)};`);
      yield `${variable}.test(${value})`;
    }
    if (schema.format !== void 0) {
      yield `format(${StringConstant(schema.format)}, ${value})`;
    }
  }
  function* FromSymbol2(schema, references, value) {
    yield `(typeof ${value} === 'symbol')`;
  }
  function* FromTemplateLiteral2(schema, references, value) {
    yield `(typeof ${value} === 'string')`;
    const variable = CreateVariable(`${new RegExp(schema.pattern)};`);
    yield `${variable}.test(${value})`;
  }
  function* FromThis2(schema, references, value) {
    yield `${CreateFunctionName(schema.$ref)}(${value})`;
  }
  function* FromTuple2(schema, references, value) {
    yield `Array.isArray(${value})`;
    if (schema.items === void 0)
      return yield `${value}.length === 0`;
    yield `(${value}.length === ${schema.maxItems})`;
    for (let i = 0; i < schema.items.length; i++) {
      const expression = CreateExpression(schema.items[i], references, `${value}[${i}]`);
      yield `${expression}`;
    }
  }
  function* FromUndefined2(schema, references, value) {
    yield `${value} === undefined`;
  }
  function* FromUnion2(schema, references, value) {
    const expressions = schema.anyOf.map((schema2) => CreateExpression(schema2, references, value));
    yield `(${expressions.join(" || ")})`;
  }
  function* FromUint8Array2(schema, references, value) {
    yield `${value} instanceof Uint8Array`;
    if (IsNumber$2(schema.maxByteLength))
      yield `(${value}.length <= ${schema.maxByteLength})`;
    if (IsNumber$2(schema.minByteLength))
      yield `(${value}.length >= ${schema.minByteLength})`;
  }
  function* FromUnknown2(schema, references, value) {
    yield "true";
  }
  function* FromVoid2(schema, references, value) {
    yield Policy.IsVoidLike(value);
  }
  function* FromKind2(schema, references, value) {
    const instance = state.instances.size;
    state.instances.set(instance, schema);
    yield `kind(${StringConstant(schema[Kind$1])}, ${instance}, ${value})`;
  }
  function* Visit2(schema, references, value, useHoisting = true) {
    const references_ = IsString$2(schema.$id) ? [...references, schema] : references;
    const schema_ = schema;
    if (useHoisting && IsString$2(schema.$id)) {
      const functionName = CreateFunctionName(schema.$id);
      if (state.functions.has(functionName)) {
        return yield `${functionName}(${value})`;
      } else {
        state.functions.set(functionName, "<deferred>");
        const functionCode = CreateFunction(functionName, schema, references, "value", false);
        state.functions.set(functionName, functionCode);
        return yield `${functionName}(${value})`;
      }
    }
    switch (schema_[Kind$1]) {
      case "Any":
        return yield* FromAny2();
      case "Argument":
        return yield* FromArgument2();
      case "Array":
        return yield* FromArray2(schema_, references_, value);
      case "AsyncIterator":
        return yield* FromAsyncIterator2(schema_, references_, value);
      case "BigInt":
        return yield* FromBigInt2(schema_, references_, value);
      case "Boolean":
        return yield* FromBoolean2(schema_, references_, value);
      case "Constructor":
        return yield* FromConstructor2(schema_, references_, value);
      case "Date":
        return yield* FromDate2(schema_, references_, value);
      case "Function":
        return yield* FromFunction2(schema_, references_, value);
      case "Import":
        return yield* FromImport2(schema_, references_, value);
      case "Integer":
        return yield* FromInteger2(schema_, references_, value);
      case "Intersect":
        return yield* FromIntersect2(schema_, references_, value);
      case "Iterator":
        return yield* FromIterator2(schema_, references_, value);
      case "Literal":
        return yield* FromLiteral2(schema_, references_, value);
      case "Never":
        return yield* FromNever2();
      case "Not":
        return yield* FromNot2(schema_, references_, value);
      case "Null":
        return yield* FromNull2(schema_, references_, value);
      case "Number":
        return yield* FromNumber2(schema_, references_, value);
      case "Object":
        return yield* FromObject2(schema_, references_, value);
      case "Promise":
        return yield* FromPromise2(schema_, references_, value);
      case "Record":
        return yield* FromRecord2(schema_, references_, value);
      case "Ref":
        return yield* FromRef2(schema_, references_, value);
      case "RegExp":
        return yield* FromRegExp2(schema_, references_, value);
      case "String":
        return yield* FromString2(schema_, references_, value);
      case "Symbol":
        return yield* FromSymbol2(schema_, references_, value);
      case "TemplateLiteral":
        return yield* FromTemplateLiteral2(schema_, references_, value);
      case "This":
        return yield* FromThis2(schema_, references_, value);
      case "Tuple":
        return yield* FromTuple2(schema_, references_, value);
      case "Undefined":
        return yield* FromUndefined2(schema_, references_, value);
      case "Union":
        return yield* FromUnion2(schema_, references_, value);
      case "Uint8Array":
        return yield* FromUint8Array2(schema_, references_, value);
      case "Unknown":
        return yield* FromUnknown2();
      case "Void":
        return yield* FromVoid2(schema_, references_, value);
      default:
        if (!Has(schema_[Kind$1]))
          throw new TypeCompilerUnknownTypeError(schema);
        return yield* FromKind2(schema_, references_, value);
    }
  }
  const state = {
    language: "javascript",
    // target language
    functions: /* @__PURE__ */ new Map(),
    // local functions
    variables: /* @__PURE__ */ new Map(),
    // local variables
    instances: /* @__PURE__ */ new Map()
    // exterior kind instances
  };
  function CreateExpression(schema, references, value, useHoisting = true) {
    return `(${[...Visit2(schema, references, value, useHoisting)].join(" && ")})`;
  }
  function CreateFunctionName($id) {
    return `check_${Identifier.Encode($id)}`;
  }
  function CreateVariable(expression) {
    const variableName = `local_${state.variables.size}`;
    state.variables.set(variableName, `const ${variableName} = ${expression}`);
    return variableName;
  }
  function CreateFunction(name, schema, references, value, useHoisting = true) {
    const [newline, pad] = ["\n", (length) => "".padStart(length, " ")];
    const parameter = CreateParameter("value", "any");
    const returns = CreateReturns("boolean");
    const expression = [...Visit2(schema, references, value, useHoisting)].map((expression2) => `${pad(4)}${expression2}`).join(` &&${newline}`);
    return `function ${name}(${parameter})${returns} {${newline}${pad(2)}return (${newline}${expression}${newline}${pad(2)})
}`;
  }
  function CreateParameter(name, type) {
    const annotation = state.language === "typescript" ? `: ${type}` : "";
    return `${name}${annotation}`;
  }
  function CreateReturns(type) {
    return state.language === "typescript" ? `: ${type}` : "";
  }
  function Build(schema, references, options) {
    const functionCode = CreateFunction("check", schema, references, "value");
    const parameter = CreateParameter("value", "any");
    const returns = CreateReturns("boolean");
    const functions = [...state.functions.values()];
    const variables = [...state.variables.values()];
    const checkFunction = IsString$2(schema.$id) ? `return function check(${parameter})${returns} {
  return ${CreateFunctionName(schema.$id)}(value)
}` : `return ${functionCode}`;
    return [...variables, ...functions, checkFunction].join("\n");
  }
  function Code(...args) {
    const defaults = { language: "javascript" };
    const [schema, references, options] = args.length === 2 && IsArray$2(args[1]) ? [args[0], args[1], defaults] : args.length === 2 && !IsArray$2(args[1]) ? [args[0], [], args[1]] : args.length === 3 ? [args[0], args[1], args[2]] : args.length === 1 ? [args[0], [], defaults] : [null, [], defaults];
    state.language = options.language;
    state.variables.clear();
    state.functions.clear();
    state.instances.clear();
    if (!IsSchema(schema))
      throw new TypeCompilerTypeGuardError(schema);
    for (const schema2 of references)
      if (!IsSchema(schema2))
        throw new TypeCompilerTypeGuardError(schema2);
    return Build(schema, references);
  }
  TypeCompiler2.Code = Code;
  function Compile(schema, references = []) {
    const generatedCode = Code(schema, references, { language: "javascript" });
    const compiledFunction = Evaluate("kind", "format", "hash", generatedCode);
    const instances = new Map(state.instances);
    function typeRegistryFunction(kind, instance, value) {
      if (!Has(kind) || !instances.has(instance))
        return false;
      const checkFunc = Get(kind);
      const schema2 = instances.get(instance);
      return checkFunc(schema2, value);
    }
    function formatRegistryFunction(format, value) {
      if (!Has$1(format))
        return false;
      const checkFunc = Get$1(format);
      return checkFunc(value);
    }
    function hashFunction(value) {
      return Hash(value);
    }
    const checkFunction = compiledFunction(typeRegistryFunction, formatRegistryFunction, hashFunction);
    return new TypeCheck(schema, references, checkFunction, generatedCode);
  }
  TypeCompiler2.Compile = Compile;
})(TypeCompiler || (TypeCompiler = {}));
const isBun = typeof Bun < "u";
function isCloudflareWorker() {
  try {
    if (
      // @ts-ignore
      typeof caches < "u" && // @ts-ignore
      typeof caches.default < "u" || typeof WebSocketPair < "u"
    ) return true;
  } catch {
    return false;
  }
  return false;
}
const mime = {
  aac: "audio/aac",
  abw: "application/x-abiword",
  ai: "application/postscript",
  arc: "application/octet-stream",
  avi: "video/x-msvideo",
  azw: "application/vnd.amazon.ebook",
  bin: "application/octet-stream",
  bz: "application/x-bzip",
  bz2: "application/x-bzip2",
  csh: "application/x-csh",
  css: "text/css",
  csv: "text/csv",
  doc: "application/msword",
  dll: "application/octet-stream",
  eot: "application/vnd.ms-fontobject",
  epub: "application/epub+zip",
  gif: "image/gif",
  htm: "text/html",
  html: "text/html",
  ico: "image/x-icon",
  ics: "text/calendar",
  jar: "application/java-archive",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  js: "application/javascript",
  json: "application/json",
  mid: "audio/midi",
  midi: "audio/midi",
  mp2: "audio/mpeg",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  mpa: "video/mpeg",
  mpe: "video/mpeg",
  mpeg: "video/mpeg",
  mpkg: "application/vnd.apple.installer+xml",
  odp: "application/vnd.oasis.opendocument.presentation",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  odt: "application/vnd.oasis.opendocument.text",
  oga: "audio/ogg",
  ogv: "video/ogg",
  ogx: "application/ogg",
  otf: "font/otf",
  png: "image/png",
  pdf: "application/pdf",
  ppt: "application/vnd.ms-powerpoint",
  rar: "application/x-rar-compressed",
  rtf: "application/rtf",
  sh: "application/x-sh",
  svg: "image/svg+xml",
  swf: "application/x-shockwave-flash",
  tar: "application/x-tar",
  tif: "image/tiff",
  tiff: "image/tiff",
  ts: "application/typescript",
  ttf: "font/ttf",
  txt: "text/plain",
  vsd: "application/vnd.visio",
  wav: "audio/x-wav",
  weba: "audio/webm",
  webm: "video/webm",
  webp: "image/webp",
  woff: "font/woff",
  woff2: "font/woff2",
  xhtml: "application/xhtml+xml",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.ms-excel",
  xlsx_OLD: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xml: "application/xml",
  xul: "application/vnd.mozilla.xul+xml",
  zip: "application/zip",
  "3gp": "video/3gpp",
  "3gp_DOES_NOT_CONTAIN_VIDEO": "audio/3gpp",
  "3gp2": "video/3gpp2",
  "3gp2_DOES_NOT_CONTAIN_VIDEO": "audio/3gpp2",
  "7z": "application/x-7z-compressed"
}, getFileExtension = (path2) => {
  const index = path2.lastIndexOf(".");
  return index === -1 ? "" : path2.slice(index + 1);
};
let createReadStream, stat;
class ElysiaFile {
  constructor(path2) {
    var _a3;
    this.path = path2;
    if (isBun) this.value = Bun.file(path2);
    else {
      if (!createReadStream || !stat) {
        if (typeof window < "u") {
          console.warn("Browser environment does not support file");
          return;
        }
        const warnMissing = (name) => console.warn(
          new Error(
            `[elysia] \`file\` require \`fs${""}\` ${""}which is not available in this environment`
          )
        );
        if (typeof process > "u" || typeof process.getBuiltinModule != "function") {
          warnMissing();
          return;
        }
        const fs2 = process.getBuiltinModule("fs");
        if (!fs2) {
          warnMissing();
          return;
        }
        if (typeof fs2.createReadStream != "function") {
          warnMissing();
          return;
        }
        if (typeof ((_a3 = fs2.promises) == null ? void 0 : _a3.stat) != "function") {
          warnMissing();
          return;
        }
        createReadStream = fs2.createReadStream, stat = fs2.promises.stat;
      }
      this.value = createReadStream(path2), this.stats = stat(path2);
    }
  }
  get type() {
    return (
      // @ts-ignore
      mime[getFileExtension(this.path)] || "application/octet-stream"
    );
  }
  get length() {
    var _a3;
    return isBun ? this.value.size : ((_a3 = this.stats) == null ? void 0 : _a3.then((x) => x.size)) ?? 0;
  }
}
const replaceUrlPath = (url, pathname) => {
  const pathStartIndex = url.indexOf("/", 11), queryIndex = url.indexOf("?", pathStartIndex);
  return queryIndex === -1 ? `${url.slice(0, pathStartIndex)}${pathname.charCodeAt(0) === 47 ? "" : "/"}${pathname}` : `${url.slice(0, pathStartIndex)}${pathname.charCodeAt(0) === 47 ? "" : "/"}${pathname}${url.slice(queryIndex)}`;
}, isClass = (v) => typeof v == "function" && /^\s*class\s+/.test(v.toString()) || // Handle Object.create(null)
v.toString && // Handle import * as Sentry from '@sentry/bun'
// This also handle [object Date], [object Array]
// and FFI value like [object Prisma]
v.toString().startsWith("[object ") && v.toString() !== "[object Object]" || // If object prototype is not pure, then probably a class-like object
isNotEmpty(Object.getPrototypeOf(v)), isObject = (item) => item && typeof item == "object" && !Array.isArray(item), mergeDeep = (target, source, options) => {
  const skipKeys = options == null ? void 0 : options.skipKeys, override = (options == null ? void 0 : options.override) ?? true, mergeArray = (options == null ? void 0 : options.mergeArray) ?? false, seen = (options == null ? void 0 : options.seen) ?? /* @__PURE__ */ new WeakSet();
  if (!isObject(target) || !isObject(source) || seen.has(source)) return target;
  seen.add(source);
  for (const [key, value] of Object.entries(source))
    if (!((skipKeys == null ? void 0 : skipKeys.includes(key)) || ["__proto__", "constructor", "prototype"].includes(key))) {
      if (mergeArray && Array.isArray(value)) {
        target[key] = Array.isArray(
          target[key]
        ) ? [...target[key], ...value] : target[key] = value;
        continue;
      }
      if (!isObject(value) || !(key in target) || isClass(value)) {
        if ((override || !(key in target)) && !Object.isFrozen(target))
          try {
            target[key] = value;
          } catch {
          }
        continue;
      }
      if (!Object.isFrozen(target[key]))
        try {
          target[key] = mergeDeep(
            target[key],
            value,
            { skipKeys, override, mergeArray, seen }
          );
        } catch {
        }
    }
  return seen.delete(source), target;
}, mergeCookie = (a, b) => {
  const v = mergeDeep(Object.assign({}, a), b, {
    skipKeys: ["properties"],
    mergeArray: false
  });
  return v.properties && delete v.properties, v;
}, mergeObjectArray = (a, b) => {
  if (!b) return a;
  const array = [], checksums = [];
  if (a) {
    Array.isArray(a) || (a = [a]);
    for (const item of a)
      array.push(item), item.checksum && checksums.push(item.checksum);
  }
  if (b) {
    Array.isArray(b) || (b = [b]);
    for (const item of b)
      checksums.includes(item.checksum) || array.push(item);
  }
  return array;
}, primitiveHooks = [
  "start",
  "request",
  "parse",
  "transform",
  "resolve",
  "beforeHandle",
  "afterHandle",
  "mapResponse",
  "afterResponse",
  "trace",
  "error",
  "stop",
  "body",
  "headers",
  "params",
  "query",
  "response",
  "type",
  "detail"
];
primitiveHooks.reduce(
  (acc, x) => (acc[x] = true, acc),
  {}
);
const isRecordNumber = (x) => typeof x == "object" && Object.keys(x).every((x2) => !isNaN(+x2)), mergeResponse = (a, b) => isRecordNumber(a) && isRecordNumber(b) ? Object.assign({}, a, b) : a && !isRecordNumber(a) && isRecordNumber(b) ? Object.assign({ 200: a }, b) : b ?? a, mergeSchemaValidator = (a, b) => !a && !b ? {
  body: void 0,
  headers: void 0,
  params: void 0,
  query: void 0,
  cookie: void 0,
  response: void 0
} : {
  body: (b == null ? void 0 : b.body) ?? (a == null ? void 0 : a.body),
  headers: (b == null ? void 0 : b.headers) ?? (a == null ? void 0 : a.headers),
  params: (b == null ? void 0 : b.params) ?? (a == null ? void 0 : a.params),
  query: (b == null ? void 0 : b.query) ?? (a == null ? void 0 : a.query),
  cookie: (b == null ? void 0 : b.cookie) ?? (a == null ? void 0 : a.cookie),
  // @ts-ignore ? This order is correct - SaltyAom
  response: mergeResponse(
    // @ts-ignore
    a == null ? void 0 : a.response,
    // @ts-ignore
    b == null ? void 0 : b.response
  )
}, mergeHook = (a, b) => {
  if (!b) return a ?? {};
  if (!a) return b ?? {};
  if (!Object.values(b).find((x) => x != null))
    return { ...a };
  const hook = {
    ...a,
    ...b,
    // Merge local hook first
    // @ts-ignore
    body: b.body ?? a.body,
    // @ts-ignore
    headers: b.headers ?? a.headers,
    // @ts-ignore
    params: b.params ?? a.params,
    // @ts-ignore
    query: b.query ?? a.query,
    // @ts-ignore
    cookie: b.cookie ?? a.cookie,
    // ? This order is correct - SaltyAom
    response: mergeResponse(
      // @ts-ignore
      a.response,
      // @ts-ignore
      b.response
    ),
    type: a.type || b.type,
    detail: mergeDeep(
      // @ts-ignore
      b.detail ?? {},
      // @ts-ignore
      a.detail ?? {}
    ),
    parse: mergeObjectArray(a.parse, b.parse),
    transform: mergeObjectArray(a.transform, b.transform),
    beforeHandle: mergeObjectArray(
      mergeObjectArray(
        // @ts-ignore
        fnToContainer(a.resolve, "resolve"),
        a.beforeHandle
      ),
      mergeObjectArray(
        fnToContainer(b.resolve, "resolve"),
        b.beforeHandle
      )
    ),
    afterHandle: mergeObjectArray(a.afterHandle, b.afterHandle),
    mapResponse: mergeObjectArray(a.mapResponse, b.mapResponse),
    afterResponse: mergeObjectArray(
      a.afterResponse,
      b.afterResponse
    ),
    trace: mergeObjectArray(a.trace, b.trace),
    error: mergeObjectArray(a.error, b.error),
    // @ts-ignore
    standaloneSchema: (
      // @ts-ignore
      a.standaloneSchema || b.standaloneSchema ? (
        // @ts-ignore
        a.standaloneSchema && !b.standaloneSchema ? (
          // @ts-ignore
          a.standaloneSchema
        ) : (
          // @ts-ignore
          b.standaloneSchema && !a.standaloneSchema ? b.standaloneSchema : [
            // @ts-ignore
            ...a.standaloneSchema ?? [],
            ...b.standaloneSchema ?? []
          ]
        )
      ) : void 0
    )
  };
  return hook.resolve && delete hook.resolve, hook;
}, lifeCycleToArray = (a) => {
  a.parse && !Array.isArray(a.parse) && (a.parse = [a.parse]), a.transform && !Array.isArray(a.transform) && (a.transform = [a.transform]), a.afterHandle && !Array.isArray(a.afterHandle) && (a.afterHandle = [a.afterHandle]), a.mapResponse && !Array.isArray(a.mapResponse) && (a.mapResponse = [a.mapResponse]), a.afterResponse && !Array.isArray(a.afterResponse) && (a.afterResponse = [a.afterResponse]), a.trace && !Array.isArray(a.trace) && (a.trace = [a.trace]), a.error && !Array.isArray(a.error) && (a.error = [a.error]);
  let beforeHandle = [];
  return a.resolve && (beforeHandle = fnToContainer(
    // @ts-expect-error
    Array.isArray(a.resolve) ? a.resolve : [a.resolve],
    "resolve"
  ), delete a.resolve), a.beforeHandle && (beforeHandle.length ? beforeHandle = beforeHandle.concat(
    Array.isArray(a.beforeHandle) ? a.beforeHandle : [a.beforeHandle]
  ) : beforeHandle = Array.isArray(a.beforeHandle) ? a.beforeHandle : [a.beforeHandle]), beforeHandle.length && (a.beforeHandle = beforeHandle), a;
}, hasHeaderShorthand = isBun ? "toJSON" in new Headers() : false, hasSetImmediate = typeof setImmediate == "function", checksum = (s) => {
  let h = 9;
  for (let i = 0; i < s.length; ) h = Math.imul(h ^ s.charCodeAt(i++), 9 ** 9);
  return h = h ^ h >>> 9;
}, injectChecksum = (checksum2, x) => {
  if (!x) return;
  if (!Array.isArray(x)) {
    const fn = x;
    return checksum2 && !fn.checksum && (fn.checksum = checksum2), fn.scope === "scoped" && (fn.scope = "local"), fn;
  }
  const fns = [...x];
  for (const fn of fns)
    checksum2 && !fn.checksum && (fn.checksum = checksum2), fn.scope === "scoped" && (fn.scope = "local");
  return fns;
}, mergeLifeCycle = (a, b, checksum2) => ({
  start: mergeObjectArray(
    a.start,
    injectChecksum(checksum2, b == null ? void 0 : b.start)
  ),
  request: mergeObjectArray(
    a.request,
    injectChecksum(checksum2, b == null ? void 0 : b.request)
  ),
  parse: mergeObjectArray(
    a.parse,
    injectChecksum(checksum2, b == null ? void 0 : b.parse)
  ),
  transform: mergeObjectArray(
    a.transform,
    injectChecksum(checksum2, b == null ? void 0 : b.transform)
  ),
  beforeHandle: mergeObjectArray(
    mergeObjectArray(
      // @ts-ignore
      fnToContainer(a.resolve, "resolve"),
      a.beforeHandle
    ),
    injectChecksum(
      checksum2,
      mergeObjectArray(
        fnToContainer(b == null ? void 0 : b.resolve, "resolve"),
        b == null ? void 0 : b.beforeHandle
      )
    )
  ),
  afterHandle: mergeObjectArray(
    a.afterHandle,
    injectChecksum(checksum2, b == null ? void 0 : b.afterHandle)
  ),
  mapResponse: mergeObjectArray(
    a.mapResponse,
    injectChecksum(checksum2, b == null ? void 0 : b.mapResponse)
  ),
  afterResponse: mergeObjectArray(
    a.afterResponse,
    injectChecksum(checksum2, b == null ? void 0 : b.afterResponse)
  ),
  // Already merged on Elysia._use, also logic is more complicated, can't directly merge
  trace: mergeObjectArray(
    a.trace,
    injectChecksum(checksum2, b == null ? void 0 : b.trace)
  ),
  error: mergeObjectArray(
    a.error,
    injectChecksum(checksum2, b == null ? void 0 : b.error)
  ),
  stop: mergeObjectArray(
    a.stop,
    injectChecksum(checksum2, b == null ? void 0 : b.stop)
  )
}), asHookType = (fn, inject, { skipIfHasType = false }) => {
  if (!fn) return fn;
  if (!Array.isArray(fn))
    return skipIfHasType ? fn.scope ?? (fn.scope = inject) : fn.scope = inject, fn;
  for (const x of fn)
    skipIfHasType ? x.scope ?? (x.scope = inject) : x.scope = inject;
  return fn;
}, filterGlobal = (fn) => {
  if (!fn) return fn;
  if (!Array.isArray(fn))
    switch (fn.scope) {
      case "global":
      case "scoped":
        return { ...fn };
      default:
        return { fn };
    }
  const array = [];
  for (const x of fn)
    switch (x.scope) {
      case "global":
      case "scoped":
        array.push({
          ...x
        });
        break;
    }
  return array;
}, filterGlobalHook = (hook) => ({
  // rest is validator
  ...hook,
  type: hook == null ? void 0 : hook.type,
  detail: hook == null ? void 0 : hook.detail,
  parse: filterGlobal(hook == null ? void 0 : hook.parse),
  transform: filterGlobal(hook == null ? void 0 : hook.transform),
  beforeHandle: filterGlobal(hook == null ? void 0 : hook.beforeHandle),
  afterHandle: filterGlobal(hook == null ? void 0 : hook.afterHandle),
  mapResponse: filterGlobal(hook == null ? void 0 : hook.mapResponse),
  afterResponse: filterGlobal(hook == null ? void 0 : hook.afterResponse),
  error: filterGlobal(hook == null ? void 0 : hook.error),
  trace: filterGlobal(hook == null ? void 0 : hook.trace)
}), StatusMap = {
  Continue: 100,
  "Switching Protocols": 101,
  Processing: 102,
  "Early Hints": 103,
  OK: 200,
  Created: 201,
  Accepted: 202,
  "Non-Authoritative Information": 203,
  "No Content": 204,
  "Reset Content": 205,
  "Partial Content": 206,
  "Multi-Status": 207,
  "Already Reported": 208,
  "Multiple Choices": 300,
  "Moved Permanently": 301,
  Found: 302,
  "See Other": 303,
  "Not Modified": 304,
  "Temporary Redirect": 307,
  "Permanent Redirect": 308,
  "Bad Request": 400,
  Unauthorized: 401,
  "Payment Required": 402,
  Forbidden: 403,
  "Not Found": 404,
  "Method Not Allowed": 405,
  "Not Acceptable": 406,
  "Proxy Authentication Required": 407,
  "Request Timeout": 408,
  Conflict: 409,
  Gone: 410,
  "Length Required": 411,
  "Precondition Failed": 412,
  "Payload Too Large": 413,
  "URI Too Long": 414,
  "Unsupported Media Type": 415,
  "Range Not Satisfiable": 416,
  "Expectation Failed": 417,
  "I'm a teapot": 418,
  "Enhance Your Calm": 420,
  "Misdirected Request": 421,
  "Unprocessable Content": 422,
  Locked: 423,
  "Failed Dependency": 424,
  "Too Early": 425,
  "Upgrade Required": 426,
  "Precondition Required": 428,
  "Too Many Requests": 429,
  "Request Header Fields Too Large": 431,
  "Unavailable For Legal Reasons": 451,
  "Internal Server Error": 500,
  "Not Implemented": 501,
  "Bad Gateway": 502,
  "Service Unavailable": 503,
  "Gateway Timeout": 504,
  "HTTP Version Not Supported": 505,
  "Variant Also Negotiates": 506,
  "Insufficient Storage": 507,
  "Loop Detected": 508,
  "Not Extended": 510,
  "Network Authentication Required": 511
}, InvertedStatusMap = Object.fromEntries(
  Object.entries(StatusMap).map(([k, v]) => [v, k])
);
function removeTrailingEquals(digest) {
  let trimmedDigest = digest;
  for (; trimmedDigest.endsWith("="); )
    trimmedDigest = trimmedDigest.slice(0, -1);
  return trimmedDigest;
}
const encoder = new TextEncoder(), signCookie = async (val, secret) => {
  if (typeof val == "object" ? val = JSON.stringify(val) : typeof val != "string" && (val = val + ""), secret == null)
    throw new TypeError("Secret key must be provided");
  const secretKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  ), hmacBuffer = await crypto.subtle.sign(
    "HMAC",
    secretKey,
    encoder.encode(val)
  );
  return val + "." + removeTrailingEquals(Buffer.from(hmacBuffer).toString("base64"));
}, constantTimeEqual = typeof (crypto == null ? void 0 : crypto.timingSafeEqual) == "function" ? (a, b) => {
  const ab = Buffer.from(a, "utf8"), bb = Buffer.from(b, "utf8");
  return ab.length !== bb.length ? false : crypto.timingSafeEqual(ab, bb);
} : (a, b) => a === b, unsignCookie = async (input, secret) => {
  if (typeof input != "string")
    throw new TypeError("Signed cookie string must be provided.");
  const dot = input.lastIndexOf(".");
  if (dot === -1)
    return secret === null ? input : false;
  const tentativeValue = input.slice(0, dot), expectedInput = await signCookie(tentativeValue, secret);
  return constantTimeEqual(expectedInput, input) ? tentativeValue : false;
}, insertStandaloneValidator = (hook, name, value) => {
  var _a3;
  if (!((_a3 = hook.standaloneValidator) == null ? void 0 : _a3.length) || !Array.isArray(hook.standaloneValidator)) {
    hook.standaloneValidator = [
      {
        [name]: value
      }
    ];
    return;
  }
  const last = hook.standaloneValidator[hook.standaloneValidator.length - 1];
  name in last ? hook.standaloneValidator.push({
    [name]: value
  }) : last[name] = value;
}, parseNumericString = (message) => {
  if (typeof message == "number") return message;
  if (message.length < 16) {
    if (message.trim().length === 0) return null;
    const length = Number(message);
    return Number.isNaN(length) ? null : length;
  }
  if (message.length === 16) {
    if (message.trim().length === 0) return null;
    const number = Number(message);
    return Number.isNaN(number) || number.toString() !== message ? null : number;
  }
  return null;
}, isNumericString = (message) => parseNumericString(message) !== null;
class PromiseGroup {
  constructor(onError = console.error, onFinally = () => {
  }) {
    this.onError = onError;
    this.onFinally = onFinally;
    this.root = null;
    this.promises = [];
  }
  /**
   * The number of promises still being awaited.
   */
  get size() {
    return this.promises.length;
  }
  /**
   * Add a promise to the group.
   * @returns The promise that was added.
   */
  add(promise) {
    return this.promises.push(promise), this.root || (this.root = this.drain()), this.promises.length === 1 && this.then(this.onFinally), promise;
  }
  async drain() {
    for (; this.promises.length > 0; ) {
      try {
        await this.promises[0];
      } catch (error) {
        this.onError(error);
      }
      this.promises.shift();
    }
    this.root = null;
  }
  // Allow the group to be awaited.
  then(onfulfilled, onrejected) {
    return (this.root ?? Promise.resolve()).then(onfulfilled, onrejected);
  }
}
const fnToContainer = (fn, subType) => {
  if (!fn) return fn;
  if (!Array.isArray(fn)) {
    if (typeof fn == "function" || typeof fn == "string")
      return subType ? { fn, subType } : { fn };
    if ("fn" in fn) return fn;
  }
  const fns = [];
  for (const x of fn)
    typeof x == "function" || typeof x == "string" ? fns.push(subType ? { fn: x, subType } : { fn: x }) : "fn" in x && fns.push(x);
  return fns;
}, localHookToLifeCycleStore = (a) => (a.start && (a.start = fnToContainer(a.start)), a.request && (a.request = fnToContainer(a.request)), a.parse && (a.parse = fnToContainer(a.parse)), a.transform && (a.transform = fnToContainer(a.transform)), a.beforeHandle && (a.beforeHandle = fnToContainer(a.beforeHandle)), a.afterHandle && (a.afterHandle = fnToContainer(a.afterHandle)), a.mapResponse && (a.mapResponse = fnToContainer(a.mapResponse)), a.afterResponse && (a.afterResponse = fnToContainer(a.afterResponse)), a.trace && (a.trace = fnToContainer(a.trace)), a.error && (a.error = fnToContainer(a.error)), a.stop && (a.stop = fnToContainer(a.stop)), a), lifeCycleToFn = (a) => {
  var _a3, _b2, _c3, _d2, _e2, _f2, _g2, _h, _i, _j, _k;
  const lifecycle = /* @__PURE__ */ Object.create(null);
  return ((_a3 = a.start) == null ? void 0 : _a3.map) && (lifecycle.start = a.start.map((x) => x.fn)), ((_b2 = a.request) == null ? void 0 : _b2.map) && (lifecycle.request = a.request.map((x) => x.fn)), ((_c3 = a.parse) == null ? void 0 : _c3.map) && (lifecycle.parse = a.parse.map((x) => x.fn)), ((_d2 = a.transform) == null ? void 0 : _d2.map) && (lifecycle.transform = a.transform.map((x) => x.fn)), ((_e2 = a.beforeHandle) == null ? void 0 : _e2.map) && (lifecycle.beforeHandle = a.beforeHandle.map((x) => x.fn)), ((_f2 = a.afterHandle) == null ? void 0 : _f2.map) && (lifecycle.afterHandle = a.afterHandle.map((x) => x.fn)), ((_g2 = a.mapResponse) == null ? void 0 : _g2.map) && (lifecycle.mapResponse = a.mapResponse.map((x) => x.fn)), ((_h = a.afterResponse) == null ? void 0 : _h.map) && (lifecycle.afterResponse = a.afterResponse.map((x) => x.fn)), ((_i = a.error) == null ? void 0 : _i.map) && (lifecycle.error = a.error.map((x) => x.fn)), ((_j = a.stop) == null ? void 0 : _j.map) && (lifecycle.stop = a.stop.map((x) => x.fn)), ((_k = a.trace) == null ? void 0 : _k.map) ? lifecycle.trace = a.trace.map((x) => x.fn) : lifecycle.trace = [], lifecycle;
}, cloneInference = (inference) => ({
  body: inference.body,
  cookie: inference.cookie,
  headers: inference.headers,
  query: inference.query,
  set: inference.set,
  server: inference.server,
  path: inference.path,
  route: inference.route,
  url: inference.url
}), redirect = (url, status2 = 302) => Response.redirect(url, status2), ELYSIA_FORM_DATA = Symbol("ElysiaFormData"), ELYSIA_REQUEST_ID = Symbol("ElysiaRequestId"), form = (items) => {
  var _a3, _b2;
  const formData = new FormData();
  if (formData[ELYSIA_FORM_DATA] = {}, items)
    for (const [key, value] of Object.entries(items)) {
      if (Array.isArray(value)) {
        formData[ELYSIA_FORM_DATA][key] = [];
        for (const v of value)
          value instanceof File ? formData.append(key, value, value.name) : value instanceof ElysiaFile ? formData.append(key, value.value, (_a3 = value.value) == null ? void 0 : _a3.name) : formData.append(key, value), formData[ELYSIA_FORM_DATA][key].push(value);
        continue;
      }
      value instanceof File ? formData.append(key, value, value.name) : value instanceof ElysiaFile ? formData.append(key, value.value, (_b2 = value.value) == null ? void 0 : _b2.name) : formData.append(key, value), formData[ELYSIA_FORM_DATA][key] = value;
    }
  return formData;
}, randomId = typeof crypto > "u" || isCloudflareWorker() ? () => {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 16; i++)
    result += characters.charAt(
      // 62 is characters.length
      Math.floor(Math.random() * 62)
    );
  return result;
} : () => {
  const uuid = crypto.randomUUID();
  return uuid.slice(0, 8) + uuid.slice(24, 32);
}, deduplicateChecksum = (array) => {
  if (!array.length) return [];
  const hashes = [];
  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    item.checksum && (hashes.includes(item.checksum) && (array.splice(i, 1), i--), hashes.push(item.checksum));
  }
  return array;
}, promoteEvent = (events2, as = "scoped") => {
  if (events2) {
    if (as === "scoped") {
      for (const event of events2)
        "scope" in event && event.scope === "local" && (event.scope = "scoped");
      return;
    }
    for (const event of events2) "scope" in event && (event.scope = "global");
  }
}, getLoosePath = (path2) => path2.charCodeAt(path2.length - 1) === 47 ? path2.slice(0, path2.length - 1) : path2 + "/", isNotEmpty = (obj) => {
  if (!obj) return false;
  for (const _ in obj) return true;
  return false;
}, encodePath = (path2, { dynamic = false } = {}) => {
  let encoded = encodeURIComponent(path2).replace(/%2F/g, "/");
  return dynamic && (encoded = encoded.replace(/%3A/g, ":").replace(/%3F/g, "?")), encoded;
}, supportPerMethodInlineHandler = !!(typeof Bun > "u" || ((_c2 = (_b = Bun.semver) == null ? void 0 : _b.satisfies) == null ? void 0 : _c2.call(_b, Bun.version, ">=1.2.14")));
async function getResponseLength(response) {
  if (response.bodyUsed || !response.body) return 0;
  let length = 0;
  const reader = response.body.getReader();
  for (; ; ) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
  }
  return length;
}
const emptySchema = {
  headers: true,
  cookie: true,
  query: true,
  params: true,
  body: true,
  response: true
};
const env$1 = typeof Bun < "u" ? Bun.env : typeof process < "u" ? process == null ? void 0 : process.env : void 0, ERROR_CODE = Symbol("ElysiaErrorCode"), isProduction = ((env$1 == null ? void 0 : env$1.NODE_ENV) ?? (env$1 == null ? void 0 : env$1.ENV)) === "production", emptyHttpStatus = {
  101: void 0,
  204: void 0,
  205: void 0,
  304: void 0,
  307: void 0,
  308: void 0
};
class ElysiaCustomStatusResponse {
  constructor(code, response) {
    const res = response ?? (code in InvertedStatusMap ? (
      // @ts-expect-error Always correct
      InvertedStatusMap[code]
    ) : code);
    this.code = StatusMap[code] ?? code, code in emptyHttpStatus ? this.response = void 0 : this.response = res;
  }
}
const status = (code, response) => new ElysiaCustomStatusResponse(code, response);
class NotFoundError extends Error {
  constructor(message) {
    super(message ?? "NOT_FOUND");
    this.code = "NOT_FOUND";
    this.status = 404;
  }
}
class ParseError extends Error {
  constructor(cause) {
    super("Bad Request", {
      cause
    });
    this.code = "PARSE";
    this.status = 400;
  }
}
class InvalidCookieSignature extends Error {
  constructor(key, message) {
    super(message ?? `"${key}" has invalid cookie signature`);
    this.key = key;
    this.code = "INVALID_COOKIE_SIGNATURE";
    this.status = 400;
  }
}
const mapValueError = (error) => {
  if (!error) return error;
  let { message, path: path2, value, type } = error;
  Array.isArray(path2) && (path2 = path2[0]);
  const property = typeof path2 == "string" ? path2.slice(1).replaceAll("/", ".") : "unknown", isRoot = path2 === "";
  switch (type) {
    case 42:
      return {
        ...error,
        summary: isRoot ? "Value should not be provided" : `Property '${property}' should not be provided`
      };
    case 45:
      return {
        ...error,
        summary: isRoot ? "Value is missing" : `Property '${property}' is missing`
      };
    case 50:
      const quoteIndex = message.indexOf("'"), format = message.slice(
        quoteIndex + 1,
        message.indexOf("'", quoteIndex + 1)
      );
      return {
        ...error,
        summary: isRoot ? "Value should be an email" : `Property '${property}' should be ${format}`
      };
    case 54:
      return {
        ...error,
        summary: `${message.slice(0, 9).trim()} property '${property}' to be ${message.slice(8).trim()} but found: ${value}`
      };
    case 62:
      const union = error.schema.anyOf.map((x) => `'${(x == null ? void 0 : x.format) ?? x.type}'`).join(", ");
      return {
        ...error,
        summary: isRoot ? `Value should be one of ${union}` : `Property '${property}' should be one of: ${union}`
      };
    default:
      return { summary: message, ...error };
  }
};
class InvalidFileType extends Error {
  constructor(property, expected, message = `"${property}" has invalid file type`) {
    super(message);
    this.property = property;
    this.expected = expected;
    this.message = message;
    this.code = "INVALID_FILE_TYPE";
    this.status = 422;
    Object.setPrototypeOf(this, InvalidFileType.prototype);
  }
  toResponse(headers) {
    return isProduction ? new Response(
      JSON.stringify({
        type: "validation",
        on: "body"
      }),
      {
        status: 422,
        headers: {
          ...headers,
          "content-type": "application/json"
        }
      }
    ) : new Response(
      JSON.stringify({
        type: "validation",
        on: "body",
        summary: "Invalid file type",
        message: this.message,
        property: this.property,
        expected: this.expected
      }),
      {
        status: 422,
        headers: {
          ...headers,
          "content-type": "application/json"
        }
      }
    );
  }
}
class ValidationError extends Error {
  constructor(type, validator, value, allowUnsafeValidationDetails = false, errors) {
    var _a3, _b2, _c3, _d2, _e2, _f2;
    let message = "", error, expected, customError;
    if (
      // @ts-ignore
      (validator == null ? void 0 : validator.provider) === "standard" || "~standard" in validator || // @ts-ignore
      validator.schema && "~standard" in validator.schema
    ) {
      const standard = (
        // @ts-ignore
        ("~standard" in validator ? validator : validator.schema)["~standard"]
      );
      error = (_a3 = errors ?? standard.validate(value).issues) == null ? void 0 : _a3[0], isProduction && !allowUnsafeValidationDetails ? message = JSON.stringify({
        type: "validation",
        on: type,
        found: value
      }) : message = JSON.stringify(
        {
          type: "validation",
          on: type,
          property: ((_b2 = error.path) == null ? void 0 : _b2[0]) || "root",
          message: error == null ? void 0 : error.message,
          summary: error == null ? void 0 : error.problem,
          expected,
          found: value,
          errors
        },
        null,
        2
      ), customError = error == null ? void 0 : error.message;
    } else {
      value && typeof value == "object" && value instanceof ElysiaCustomStatusResponse && (value = value.response), error = (errors == null ? void 0 : errors.First()) ?? ("Errors" in validator ? validator.Errors(value).First() : Errors(validator, value).First());
      const accessor = (error == null ? void 0 : error.path) || "root", schema = (validator == null ? void 0 : validator.schema) ?? validator;
      if (!isProduction && !allowUnsafeValidationDetails)
        try {
          expected = Create(schema);
        } catch (error2) {
          expected = {
            type: "Could not create expected value",
            // @ts-expect-error
            message: error2 == null ? void 0 : error2.message,
            error: error2
          };
        }
      customError = ((_c3 = error == null ? void 0 : error.schema) == null ? void 0 : _c3.message) || ((_d2 = error == null ? void 0 : error.schema) == null ? void 0 : _d2.error) !== void 0 ? typeof error.schema.error == "function" ? error.schema.error(
        isProduction && !allowUnsafeValidationDetails ? {
          type: "validation",
          on: type,
          found: value
        } : {
          type: "validation",
          on: type,
          value,
          property: accessor,
          message: error == null ? void 0 : error.message,
          summary: (_e2 = mapValueError(error)) == null ? void 0 : _e2.summary,
          found: value,
          expected,
          errors: "Errors" in validator ? [
            ...validator.Errors(
              value
            )
          ].map(mapValueError) : [
            ...Errors(
              validator,
              value
            )
          ].map(mapValueError)
        },
        validator
      ) : error.schema.error : void 0, customError !== void 0 ? message = typeof customError == "object" ? JSON.stringify(customError) : customError + "" : isProduction && !allowUnsafeValidationDetails ? message = JSON.stringify({
        type: "validation",
        on: type,
        found: value
      }) : message = JSON.stringify(
        {
          type: "validation",
          on: type,
          property: accessor,
          message: error == null ? void 0 : error.message,
          summary: (_f2 = mapValueError(error)) == null ? void 0 : _f2.summary,
          expected,
          found: value,
          errors: "Errors" in validator ? [...validator.Errors(value)].map(
            mapValueError
          ) : [...Errors(validator, value)].map(
            mapValueError
          )
        },
        null,
        2
      );
    }
    super(message);
    this.type = type;
    this.validator = validator;
    this.value = value;
    this.allowUnsafeValidationDetails = allowUnsafeValidationDetails;
    this.code = "VALIDATION";
    this.status = 422;
    this.valueError = error, this.expected = expected, this.customError = customError, Object.setPrototypeOf(this, ValidationError.prototype);
  }
  /**
   * Alias of `valueError`
   */
  get messageValue() {
    return this.valueError;
  }
  get all() {
    var _a3, _b2;
    return (
      // @ts-ignore
      ((_a3 = this.validator) == null ? void 0 : _a3.provider) === "standard" || "~standard" in this.validator || // @ts-ignore
      "schema" in this.validator && // @ts-ignore
      this.validator.schema && // @ts-ignore
      "~standard" in this.validator.schema ? (
        /* @ts-ignore */
        ((_b2 = ("~standard" in this.validator ? this.validator : (
          // @ts-ignore
          this.validator.schema
        ))["~standard"].validate(this.value).issues) == null ? void 0 : _b2.map((issue) => {
          var _a4;
          return {
            summary: issue.message,
            path: ((_a4 = issue.path) == null ? void 0 : _a4.join(".")) || "root",
            message: issue.message,
            value: this.value
          };
        })) || []
      ) : "Errors" in this.validator ? [...this.validator.Errors(this.value)].filter((x) => x).map((x) => mapValueError(x)) : (
        // @ts-ignore
        [...Errors(this.validator, this.value)].map(mapValueError)
      )
    );
  }
  static simplifyModel(validator) {
    const model = "schema" in validator ? validator.schema : validator;
    try {
      return Create(model);
    } catch {
      return model;
    }
  }
  get model() {
    return "~standard" in this.validator ? this.validator : ValidationError.simplifyModel(this.validator);
  }
  toResponse(headers) {
    return new Response(this.message, {
      status: 400,
      headers: {
        ...headers,
        "content-type": "application/json"
      }
    });
  }
  /**
   * Utility function to inherit add custom error and keep the original Validation error
   *
   * @since 1.3.14
   *
   * @example
   * ```ts
   * new Elysia()
   *		.onError(({ error, code }) => {
   *			if (code === 'VALIDATION') return error.detail(error.message)
   *		})
   *		.post('/', () => 'Hello World!', {
   *			body: t.Object({
   *				x: t.Number({
   *					error: 'x must be a number'
   *				})
   *			})
   *		})
   * ```
   */
  detail(message, allowUnsafeValidatorDetails = this.allowUnsafeValidationDetails) {
    var _a3, _b2;
    if (!this.customError) return this.message;
    const value = this.value, expected = this.expected, errors = this.all;
    return isProduction && !allowUnsafeValidatorDetails ? {
      type: "validation",
      on: this.type,
      found: value,
      message
    } : {
      type: "validation",
      on: this.type,
      property: ((_a3 = this.valueError) == null ? void 0 : _a3.path) || "root",
      message,
      summary: (_b2 = mapValueError(this.valueError)) == null ? void 0 : _b2.summary,
      found: value,
      expected,
      errors
    };
  }
}
const tryParse = (v, schema) => {
  try {
    return JSON.parse(v);
  } catch {
    throw new ValidationError("property", schema, v);
  }
};
function createType(kind, func) {
  return Has(kind) || Set$1(kind, func), (options = {}) => Unsafe({ ...options, [Kind$1]: kind });
}
const compile = (schema) => {
  try {
    const compiler = TypeCompiler.Compile(schema);
    return compiler.Create = () => Create(schema), compiler.Error = (v) => (
      // @ts-ignore
      new ValidationError("property", schema, v, compiler.Errors(v))
    ), compiler;
  } catch {
    return {
      Check: (v) => Check(schema, v),
      CheckThrow: (v) => {
        if (!Check(schema, v))
          throw new ValidationError(
            "property",
            schema,
            v,
            // @ts-ignore
            Errors(schema, v)
          );
      },
      Decode: (v) => Decode(schema, v),
      Create: () => Create(schema),
      Error: (v) => new ValidationError(
        "property",
        schema,
        v,
        // @ts-ignore
        Errors(schema, v)
      )
    };
  }
}, parseFileUnit = (size) => {
  if (typeof size == "string")
    switch (size.slice(-1)) {
      case "k":
        return +size.slice(0, size.length - 1) * 1024;
      case "m":
        return +size.slice(0, size.length - 1) * 1048576;
      default:
        return +size;
    }
  return size;
}, checkFileExtension = (type, extension) => type.startsWith(extension) ? true : extension.charCodeAt(extension.length - 1) === 42 && extension.charCodeAt(extension.length - 2) === 47 && type.startsWith(extension.slice(0, -1));
let _fileTypeFromBlobWarn = false;
const warnIfFileTypeIsNotInstalled = () => {
  _fileTypeFromBlobWarn || (console.warn(
    "[Elysia] Attempt to validate file type without 'file-type'. This may lead to security risks. We recommend installing 'file-type' to properly validate file extension."
  ), _fileTypeFromBlobWarn = true);
}, loadFileType = async () => import("./index-C_pqwSqz.js").then((x) => (_fileTypeFromBlob = x.fileTypeFromBlob, _fileTypeFromBlob)).catch(warnIfFileTypeIsNotInstalled);
let _fileTypeFromBlob;
const fileTypeFromBlob = (file) => _fileTypeFromBlob ? _fileTypeFromBlob(file) : loadFileType().then((mod) => {
  if (mod) return mod(file);
}), fileType = async (file, extension, name = (file == null ? void 0 : file.name) ?? "") => {
  if (Array.isArray(file))
    return await Promise.all(file.map((f) => fileType(f, extension, name))), true;
  if (!file) return false;
  const result = await fileTypeFromBlob(file);
  if (!result) throw new InvalidFileType(name, extension);
  if (typeof extension == "string" && !checkFileExtension(result.mime, extension))
    throw new InvalidFileType(name, extension);
  for (let i = 0; i < extension.length; i++)
    if (checkFileExtension(result.mime, extension[i])) return true;
  throw new InvalidFileType(name, extension);
}, validateFile = (options, value) => {
  if (value instanceof ElysiaFile) return true;
  if (!(value instanceof Blob) || options.minSize && value.size < parseFileUnit(options.minSize) || options.maxSize && value.size > parseFileUnit(options.maxSize))
    return false;
  if (options.extension) {
    if (typeof options.extension == "string")
      return checkFileExtension(value.type, options.extension);
    for (let i = 0; i < options.extension.length; i++)
      if (checkFileExtension(value.type, options.extension[i]))
        return true;
    return false;
  }
  return true;
};
const fullFormats = {
  // date: http://tools.ietf.org/html/rfc3339#section-5.6
  date,
  // date-time: http://tools.ietf.org/html/rfc3339#section-5.6
  time: getTime(true),
  "date-time": getDateTime(true),
  "iso-time": getTime(false),
  "iso-date-time": getDateTime(false),
  // duration: https://tools.ietf.org/html/rfc3339#appendix-A
  duration: /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/,
  uri,
  "uri-reference": /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i,
  // uri-template: https://tools.ietf.org/html/rfc6570
  "uri-template": /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i,
  // For the source: https://gist.github.com/dperini/729294
  // For test cases: https://mathiasbynens.be/demo/url-regex
  url: /^(?:https?|ftp):\/\/(?:[^\s:@]+(?::[^\s@]*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu,
  email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
  hostname: /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i,
  // optimized https://www.safaribooksonline.com/library/view/regular-expressions-cookbook/9780596802837/ch07s16.html
  ipv4: /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/,
  ipv6: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i,
  regex,
  // uuid: http://tools.ietf.org/html/rfc4122
  uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
  // JSON-pointer: https://tools.ietf.org/html/rfc6901
  // uri fragment: https://tools.ietf.org/html/rfc3986#appendix-A
  "json-pointer": /^(?:\/(?:[^~/]|~0|~1)*)*$/,
  "json-pointer-uri-fragment": /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i,
  // relative JSON-pointer: http://tools.ietf.org/html/draft-luff-relative-json-pointer-00
  "relative-json-pointer": /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/,
  // the following formats are used by the openapi specification: https://spec.openapis.org/oas/v3.0.0#data-types
  // byte: https://github.com/miguelmota/is-base64
  byte,
  // signed 32 bit integer
  int32: { type: "number", validate: validateInt32 },
  // signed 64 bit integer
  int64: { type: "number", validate: validateInt64 },
  // C-type float
  float: { type: "number", validate: validateNumber },
  // C-type double
  double: { type: "number", validate: validateNumber },
  // hint to the UI to hide input strings
  password: true,
  // unchecked string payload
  binary: true
};
function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
const DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/, DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function date(str) {
  const matches = DATE.exec(str);
  if (!matches) return false;
  const year = +matches[1], month = +matches[2], day = +matches[3];
  return month >= 1 && month <= 12 && day >= 1 && day <= (month === 2 && isLeapYear(year) ? 29 : DAYS[month]);
}
const TIME = /^(\d\d):(\d\d):(\d\d(?:\.\d+)?)(z|([+-])(\d\d)(?::?(\d\d))?)?$/i;
function getTime(strictTimeZone) {
  return function(str) {
    const matches = TIME.exec(str);
    if (!matches) return false;
    const hr = +matches[1], min = +matches[2], sec = +matches[3], tz = matches[4], tzSign = matches[5] === "-" ? -1 : 1, tzH = +(matches[6] || 0), tzM = +(matches[7] || 0);
    if (tzH > 23 || tzM > 59 || strictTimeZone && !tz) return false;
    if (hr <= 23 && min <= 59 && sec < 60) return true;
    const utcMin = min - tzM * tzSign, utcHr = hr - tzH * tzSign - (utcMin < 0 ? 1 : 0);
    return (utcHr === 23 || utcHr === -1) && (utcMin === 59 || utcMin === -1) && sec < 61;
  };
}
const parseDateTimeEmptySpace = (str) => str.charCodeAt(str.length - 6) === 32 ? str.slice(0, -6) + "+" + str.slice(-5) : str, DATE_TIME_SEPARATOR = /t|\s/i;
function getDateTime(strictTimeZone) {
  const time = getTime(strictTimeZone);
  return function(str) {
    const dateTime = str.split(DATE_TIME_SEPARATOR);
    return dateTime.length === 2 && date(dateTime[0]) && time(dateTime[1]);
  };
}
const NOT_URI_FRAGMENT = /\/|:/, URI = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
function uri(str) {
  return NOT_URI_FRAGMENT.test(str) && URI.test(str);
}
const BYTE = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
function byte(str) {
  return BYTE.lastIndex = 0, BYTE.test(str);
}
const MIN_INT32 = -2147483648, MAX_INT32 = 2 ** 31 - 1;
function validateInt32(value) {
  return Number.isInteger(value) && value <= MAX_INT32 && value >= MIN_INT32;
}
function validateInt64(value) {
  return Number.isInteger(value);
}
function validateNumber() {
  return true;
}
const Z_ANCHOR = /[^\\]\\Z/;
function regex(str) {
  if (Z_ANCHOR.test(str)) return false;
  try {
    return new RegExp(str), true;
  } catch {
    return false;
  }
}
/**
 * @license
 *
 * MIT License
 *
 * Copyright (c) 2020 Evgeny Poberezkin
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
const isISO8601 = /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/, isFormalDate = /(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{2}\s\d{4}\s\d{2}:\d{2}:\d{2}\sGMT(?:\+|-)\d{4}\s\([^)]+\)/, isShortenDate = /^(?:(?:(?:(?:0?[1-9]|[12][0-9]|3[01])[/\s-](?:0?[1-9]|1[0-2])[/\s-](?:19|20)\d{2})|(?:(?:19|20)\d{2}[/\s-](?:0?[1-9]|1[0-2])[/\s-](?:0?[1-9]|[12][0-9]|3[01]))))(?:\s(?:1[012]|0?[1-9]):[0-5][0-9](?::[0-5][0-9])?(?:\s[AP]M)?)?$/, _validateDate = fullFormats.date, _validateDateTime = fullFormats["date-time"];
Has$1("date") || Set$2("date", (value) => {
  const temp = parseDateTimeEmptySpace(value).replace(/"/g, "");
  if (isISO8601.test(temp) || isFormalDate.test(temp) || isShortenDate.test(temp) || _validateDate(temp)) {
    const date2 = new Date(temp);
    if (!Number.isNaN(date2.getTime())) return true;
  }
  return false;
}), Has$1("date-time") || Set$2("date-time", (value) => {
  const temp = value.replace(/"/g, "");
  if (isISO8601.test(temp) || isFormalDate.test(temp) || isShortenDate.test(temp) || _validateDateTime(temp)) {
    const date2 = new Date(temp);
    if (!Number.isNaN(date2.getTime())) return true;
  }
  return false;
}), Object.entries(fullFormats).forEach((formatEntry) => {
  const [formatName, formatValue] = formatEntry;
  Has$1(formatName) || (formatValue instanceof RegExp ? Set$2(formatName, (value) => formatValue.test(value)) : typeof formatValue == "function" && Set$2(formatName, formatValue));
}), Has$1("numeric") || Set$2("numeric", (value) => !!value && !isNaN(+value)), Has$1("integer") || Set$2(
  "integer",
  (value) => !!value && Number.isInteger(+value)
), Has$1("boolean") || Set$2(
  "boolean",
  (value) => value === "true" || value === "false"
), Has$1("ObjectString") || Set$2("ObjectString", (value) => {
  let start = value.charCodeAt(0);
  if ((start === 9 || start === 10 || start === 32) && (start = value.trimStart().charCodeAt(0)), start !== 123 && start !== 91) return false;
  try {
    return JSON.parse(value), true;
  } catch {
    return false;
  }
}), Has$1("ArrayString") || Set$2("ArrayString", (value) => {
  let start = value.charCodeAt(0);
  if ((start === 9 || start === 10 || start === 32) && (start = value.trimStart().charCodeAt(0)), start !== 123 && start !== 91) return false;
  try {
    return JSON.parse(value), true;
  } catch {
    return false;
  }
});
const t = Object.assign({}, Type);
createType(
  "UnionEnum",
  (schema, value) => (typeof value == "number" || typeof value == "string" || value === null) && schema.enum.includes(value)
), createType(
  "ArrayBuffer",
  (schema, value) => value instanceof ArrayBuffer
);
const internalFiles = createType(
  "Files",
  (options, value) => {
    if (options.minItems && options.minItems > 1 && !Array.isArray(value))
      return false;
    if (!Array.isArray(value)) return validateFile(options, value);
    if (options.minItems && value.length < options.minItems || options.maxItems && value.length > options.maxItems) return false;
    for (let i = 0; i < value.length; i++)
      if (!validateFile(options, value[i])) return false;
    return true;
  }
), internalFormData = createType(
  "ElysiaForm",
  ({ compiler, ...schema }, value) => {
    if (!(value instanceof FormData)) return false;
    if (compiler) {
      if (!(ELYSIA_FORM_DATA in value))
        throw new ValidationError("property", schema, value);
      if (!compiler.Check(value[ELYSIA_FORM_DATA]))
        throw compiler.Error(value[ELYSIA_FORM_DATA]);
    }
    return true;
  }
), ElysiaType = {
  // @ts-ignore
  String: (property) => Type.String(property),
  Numeric: (property) => {
    const schema = Type.Number(property), compiler = compile(schema);
    return t.Transform(
      t.Union(
        [
          t.String({
            format: "numeric",
            default: 0
          }),
          t.Number(property)
        ],
        property
      )
    ).Decode((value) => {
      const number = +value;
      if (isNaN(number)) return value;
      if (property && !compiler.Check(number))
        throw compiler.Error(number);
      return number;
    }).Encode((value) => value);
  },
  NumericEnum(item, property) {
    const schema = Type.Enum(item, property), compiler = compile(schema);
    return t.Transform(
      t.Union([t.String({ format: "numeric" }), t.Number()], property)
    ).Decode((value) => {
      const number = +value;
      if (isNaN(number) || !compiler.Check(number)) throw compiler.Error(number);
      return number;
    }).Encode((value) => value);
  },
  Integer: (property) => {
    const schema = Type.Integer(property), compiler = compile(schema);
    return t.Transform(
      t.Union(
        [
          t.String({
            format: "integer",
            default: 0
          }),
          Type.Integer(property)
        ],
        property
      )
    ).Decode((value) => {
      const number = +value;
      if (!compiler.Check(number)) throw compiler.Error(number);
      return number;
    }).Encode((value) => value);
  },
  Date: (property) => {
    const schema = Type.Date(property), compiler = compile(schema), _default = (property == null ? void 0 : property.default) ? new Date(property.default) : void 0;
    return t.Transform(
      t.Union(
        [
          Type.Date(property),
          t.String({
            format: "date-time",
            default: _default == null ? void 0 : _default.toISOString()
          }),
          t.String({
            format: "date",
            default: _default == null ? void 0 : _default.toISOString()
          }),
          t.Number({ default: _default == null ? void 0 : _default.getTime() })
        ],
        property
      )
    ).Decode((value) => {
      if (typeof value == "number") {
        const date22 = new Date(value);
        if (!compiler.Check(date22)) throw compiler.Error(date22);
        return date22;
      }
      if (value instanceof Date) return value;
      const date2 = new Date(parseDateTimeEmptySpace(value));
      if (!date2 || isNaN(date2.getTime()))
        throw new ValidationError("property", schema, date2);
      if (!compiler.Check(date2)) throw compiler.Error(date2);
      return date2;
    }).Encode((value) => {
      if (value instanceof Date) return value.toISOString();
      if (typeof value == "string") {
        const parsed = new Date(parseDateTimeEmptySpace(value));
        if (isNaN(parsed.getTime()))
          throw new ValidationError("property", schema, value);
        return parsed.toISOString();
      }
      if (!compiler.Check(value)) throw compiler.Error(value);
      return value;
    });
  },
  BooleanString: (property) => {
    const schema = Type.Boolean(property), compiler = compile(schema);
    return t.Transform(
      t.Union(
        [
          t.Boolean(property),
          t.String({
            format: "boolean",
            default: false
          })
        ],
        property
      )
    ).Decode((value) => {
      if (typeof value == "string") return value === "true";
      if (value !== void 0 && !compiler.Check(value))
        throw compiler.Error(value);
      return value;
    }).Encode((value) => value);
  },
  ObjectString: (properties, options) => {
    const schema = t.Object(properties, options), compiler = compile(schema);
    return t.Transform(
      t.Union(
        [
          t.String({
            format: "ObjectString",
            default: options == null ? void 0 : options.default
          }),
          schema
        ],
        {
          elysiaMeta: "ObjectString"
        }
      )
    ).Decode((value) => {
      if (typeof value == "string") {
        if (value.charCodeAt(0) !== 123)
          throw new ValidationError("property", schema, value);
        if (!compiler.Check(value = tryParse(value, schema)))
          throw compiler.Error(value);
        return compiler.Decode(value);
      }
      return value;
    }).Encode((value) => {
      let original;
      if (typeof value == "string" && (value = tryParse(original = value, schema)), !compiler.Check(value)) throw compiler.Error(value);
      return original ?? JSON.stringify(value);
    });
  },
  ArrayString: (children = t.String(), options) => {
    const schema = t.Array(children, options), compiler = compile(schema), decode2 = (value, isProperty = false) => {
      if (value.charCodeAt(0) === 91) {
        if (!compiler.Check(value = tryParse(value, schema)))
          throw compiler.Error(value);
        return compiler.Decode(value);
      }
      if (isProperty) return value;
      throw new ValidationError("property", schema, value);
    };
    return t.Transform(
      t.Union(
        [
          t.String({
            format: "ArrayString",
            default: options == null ? void 0 : options.default
          }),
          schema
        ],
        {
          elysiaMeta: "ArrayString"
        }
      )
    ).Decode((value) => {
      if (Array.isArray(value)) {
        let values = [];
        for (let i = 0; i < value.length; i++) {
          const v = value[i];
          if (typeof v == "string") {
            const t2 = decode2(v, true);
            Array.isArray(t2) ? values = values.concat(t2) : values.push(t2);
            continue;
          }
          values.push(v);
        }
        return values;
      }
      return typeof value == "string" ? decode2(value) : value;
    }).Encode((value) => {
      let original;
      if (typeof value == "string" && (value = tryParse(original = value, schema)), !compiler.Check(value))
        throw new ValidationError("property", schema, value);
      return original ?? JSON.stringify(value);
    });
  },
  ArrayQuery: (children = t.String(), options) => {
    const schema = t.Array(children, options), compiler = compile(schema), decode2 = (value) => value.indexOf(",") !== -1 ? compiler.Decode(value.split(",")) : compiler.Decode([value]);
    return t.Transform(
      t.Union(
        [
          t.String({
            default: options == null ? void 0 : options.default
          }),
          schema
        ],
        {
          elysiaMeta: "ArrayQuery"
        }
      )
    ).Decode((value) => {
      if (Array.isArray(value)) {
        let values = [];
        for (let i = 0; i < value.length; i++) {
          const v = value[i];
          if (typeof v == "string") {
            const t2 = decode2(v);
            Array.isArray(t2) ? values = values.concat(t2) : values.push(t2);
            continue;
          }
          values.push(v);
        }
        return values;
      }
      return typeof value == "string" ? decode2(value) : value;
    }).Encode((value) => {
      let original;
      if (typeof value == "string" && (value = tryParse(original = value, schema)), !compiler.Check(value))
        throw new ValidationError("property", schema, value);
      return original ?? JSON.stringify(value);
    });
  },
  File: createType(
    "File",
    validateFile
  ),
  Files: (options = {}) => t.Transform(internalFiles(options)).Decode((value) => Array.isArray(value) ? value : [value]).Encode((value) => value),
  Nullable: (schema, options) => t.Union([schema, t.Null()], {
    ...options,
    nullable: true
  }),
  /**
   * Allow Optional, Nullable and Undefined
   */
  MaybeEmpty: (schema, options) => t.Union([schema, t.Null(), t.Undefined()], options),
  Cookie: (properties, {
    domain,
    expires,
    httpOnly,
    maxAge,
    path: path2,
    priority,
    sameSite,
    secure,
    secrets,
    sign,
    ...options
  } = {}) => {
    const v = t.Object(properties, options);
    return v.config = {
      domain,
      expires,
      httpOnly,
      maxAge,
      path: path2,
      priority,
      sameSite,
      secure,
      secrets,
      sign
    }, v;
  },
  UnionEnum: (values, options = {}) => {
    const type = values.every((value) => typeof value == "string") ? { type: "string" } : values.every((value) => typeof value == "number") ? { type: "number" } : values.every((value) => value === null) ? { type: "null" } : {};
    if (values.some((x) => typeof x == "object" && x !== null))
      throw new Error("This type does not support objects or arrays");
    return {
      // default is need for generating error message
      default: values[0],
      ...options,
      [Kind$1]: "UnionEnum",
      ...type,
      enum: values
    };
  },
  NoValidate: (v, enabled = true) => (v.noValidate = enabled, v),
  Form: (v, options = {}) => {
    const schema = t.Object(v, {
      default: form({}),
      ...options
    }), compiler = compile(schema);
    return t.Union([
      schema,
      // @ts-expect-error
      internalFormData({
        compiler
      })
    ]);
  },
  ArrayBuffer(options = {}) {
    return {
      // default is need for generating error message
      default: [1, 2, 3],
      ...options,
      [Kind$1]: "ArrayBuffer"
    };
  },
  Uint8Array: (options) => {
    const schema = Type.Uint8Array(options), compiler = compile(schema);
    return t.Transform(t.Union([t.ArrayBuffer(), Type.Uint8Array(options)])).Decode((value) => {
      if (value instanceof ArrayBuffer) {
        if (!compiler.Check(value = new Uint8Array(value)))
          throw compiler.Error(value);
        return value;
      }
      return value;
    }).Encode((value) => value);
  }
};
t.BooleanString = ElysiaType.BooleanString, t.ObjectString = ElysiaType.ObjectString, t.ArrayString = ElysiaType.ArrayString, t.ArrayQuery = ElysiaType.ArrayQuery, t.Numeric = ElysiaType.Numeric, t.NumericEnum = ElysiaType.NumericEnum, t.Integer = ElysiaType.Integer, t.File = (arg) => ((arg == null ? void 0 : arg.type) && loadFileType(), ElysiaType.File({
  default: "File",
  ...arg,
  extension: arg == null ? void 0 : arg.type,
  type: "string",
  format: "binary"
})), t.Files = (arg) => ((arg == null ? void 0 : arg.type) && loadFileType(), ElysiaType.Files({
  ...arg,
  elysiaMeta: "Files",
  default: "Files",
  extension: arg == null ? void 0 : arg.type,
  type: "array",
  items: {
    ...arg,
    default: "Files",
    type: "string",
    format: "binary"
  }
})), t.Nullable = ElysiaType.Nullable, t.MaybeEmpty = ElysiaType.MaybeEmpty, t.Cookie = ElysiaType.Cookie, t.Date = ElysiaType.Date, t.UnionEnum = ElysiaType.UnionEnum, t.NoValidate = ElysiaType.NoValidate, t.Form = ElysiaType.Form, t.ArrayBuffer = ElysiaType.ArrayBuffer, t.Uint8Array = ElysiaType.Uint8Array;
const separateFunction = (code) => {
  code.startsWith("async") && (code = code.slice(5)), code = code.trimStart();
  let index = -1;
  if (code.charCodeAt(0) === 40 && (index = code.indexOf("=>", code.indexOf(")")), index !== -1)) {
    let bracketEndIndex = index;
    for (; bracketEndIndex > 0 && code.charCodeAt(--bracketEndIndex) !== 41; )
      ;
    let body = code.slice(index + 2);
    return body.charCodeAt(0) === 32 && (body = body.trimStart()), [
      code.slice(1, bracketEndIndex),
      body,
      {
        isArrowReturn: body.charCodeAt(0) !== 123
      }
    ];
  }
  if (/^(\w+)=>/g.test(code) && (index = code.indexOf("=>"), index !== -1)) {
    let body = code.slice(index + 2);
    return body.charCodeAt(0) === 32 && (body = body.trimStart()), [
      code.slice(0, index),
      body,
      {
        isArrowReturn: body.charCodeAt(0) !== 123
      }
    ];
  }
  if (code.startsWith("function")) {
    index = code.indexOf("(");
    const end = code.indexOf(")");
    return [
      code.slice(index + 1, end),
      code.slice(end + 2),
      {
        isArrowReturn: false
      }
    ];
  }
  const start = code.indexOf("(");
  if (start !== -1) {
    const sep = code.indexOf(`
`, 2), parameter = code.slice(0, sep), end = parameter.lastIndexOf(")") + 1, body = code.slice(sep + 1);
    return [
      parameter.slice(start, end),
      "{" + body,
      {
        isArrowReturn: false
      }
    ];
  }
  const x = code.split(`
`, 2);
  return [x[0], x[1], { isArrowReturn: false }];
}, bracketPairRange = (parameter) => {
  const start = parameter.indexOf("{");
  if (start === -1) return [-1, 0];
  let end = start + 1, deep = 1;
  for (; end < parameter.length; end++) {
    const char = parameter.charCodeAt(end);
    if (char === 123 ? deep++ : char === 125 && deep--, deep === 0) break;
  }
  return deep !== 0 ? [0, parameter.length] : [start, end + 1];
}, bracketPairRangeReverse = (parameter) => {
  const end = parameter.lastIndexOf("}");
  if (end === -1) return [-1, 0];
  let start = end - 1, deep = 1;
  for (; start >= 0; start--) {
    const char = parameter.charCodeAt(start);
    if (char === 125 ? deep++ : char === 123 && deep--, deep === 0) break;
  }
  return deep !== 0 ? [-1, 0] : [start, end + 1];
}, removeColonAlias = (parameter) => {
  for (; ; ) {
    const start = parameter.indexOf(":");
    if (start === -1) break;
    let end = parameter.indexOf(",", start);
    end === -1 && (end = parameter.indexOf("}", start) - 1), end === -2 && (end = parameter.length), parameter = parameter.slice(0, start) + parameter.slice(end);
  }
  return parameter;
}, retrieveRootparameters = (parameter) => {
  let hasParenthesis = false;
  parameter.charCodeAt(0) === 40 && (parameter = parameter.slice(1, -1)), parameter.charCodeAt(0) === 123 && (hasParenthesis = true, parameter = parameter.slice(1, -1)), parameter = parameter.replace(/( |\t|\n)/g, "").trim();
  let parameters = [];
  for (; ; ) {
    let [start, end] = bracketPairRange(parameter);
    if (start === -1) break;
    parameters.push(parameter.slice(0, start - 1)), parameter.charCodeAt(end) === 44 && end++, parameter = parameter.slice(end);
  }
  parameter = removeColonAlias(parameter), parameter && (parameters = parameters.concat(parameter.split(",")));
  const parameterMap = /* @__PURE__ */ Object.create(null);
  for (const p of parameters) {
    if (p.indexOf(",") === -1) {
      parameterMap[p] = true;
      continue;
    }
    for (const q of p.split(",")) parameterMap[q.trim()] = true;
  }
  return {
    hasParenthesis,
    parameters: parameterMap
  };
}, findParameterReference = (parameter, inference) => {
  const { parameters, hasParenthesis } = retrieveRootparameters(parameter);
  return parameters.query && (inference.query = true), parameters.headers && (inference.headers = true), parameters.body && (inference.body = true), parameters.cookie && (inference.cookie = true), parameters.set && (inference.set = true), parameters.server && (inference.server = true), parameters.route && (inference.route = true), parameters.url && (inference.url = true), parameters.path && (inference.path = true), hasParenthesis ? `{ ${Object.keys(parameters).join(", ")} }` : Object.keys(parameters).join(", ");
}, findEndIndex = (type, content, index) => {
  const regex2 = new RegExp(
    `${type.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\n\\t,; ]`
  );
  const match = regex2.exec(content);
  return match ? match.index : -1;
}, findAlias = (type, body, depth = 0) => {
  if (depth > 5) return [];
  const aliases = [];
  let content = body;
  for (; ; ) {
    let index = findEndIndex(" = " + type, content);
    if (index === -1 && (index = findEndIndex("=" + type, content)), index === -1) {
      let lastIndex = content.indexOf(" = " + type);
      if (lastIndex === -1 && (lastIndex = content.indexOf("=" + type)), lastIndex + 3 + type.length !== content.length) break;
      index = lastIndex;
    }
    const part = content.slice(0, index), lastPart = part.lastIndexOf(" ");
    let variable = part.slice(lastPart !== -1 ? lastPart + 1 : -1);
    if (variable === "}") {
      const [start, end] = bracketPairRangeReverse(part);
      aliases.push(removeColonAlias(content.slice(start, end))), content = content.slice(index + 3 + type.length);
      continue;
    }
    for (; variable.charCodeAt(0) === 44; ) variable = variable.slice(1);
    for (; variable.charCodeAt(0) === 9; ) variable = variable.slice(1);
    variable.includes("(") || aliases.push(variable), content = content.slice(index + 3 + type.length);
  }
  for (const alias of aliases) {
    if (alias.charCodeAt(0) === 123) continue;
    const deepAlias = findAlias(alias, body);
    deepAlias.length > 0 && aliases.push(...deepAlias);
  }
  return aliases;
}, extractMainParameter = (parameter) => {
  if (!parameter) return;
  if (parameter.charCodeAt(0) !== 123) return parameter;
  if (parameter = parameter.slice(2, -2), !parameter.includes(","))
    return parameter.indexOf("...") !== -1 ? parameter.slice(parameter.indexOf("...") + 3) : void 0;
  const spreadIndex = parameter.indexOf("...");
  if (spreadIndex !== -1)
    return parameter.slice(spreadIndex + 3).trimEnd();
}, inferBodyReference = (code, aliases, inference) => {
  const access = (type, alias) => new RegExp(
    `${alias}\\.(${type})|${alias}\\["${type}"\\]|${alias}\\['${type}'\\]`
  ).test(code);
  for (const alias of aliases)
    if (alias) {
      if (alias.charCodeAt(0) === 123) {
        const parameters = retrieveRootparameters(alias).parameters;
        parameters.query && (inference.query = true), parameters.headers && (inference.headers = true), parameters.body && (inference.body = true), parameters.cookie && (inference.cookie = true), parameters.set && (inference.set = true), parameters.server && (inference.server = true), parameters.url && (inference.url = true), parameters.route && (inference.route = true), parameters.path && (inference.path = true);
        continue;
      }
      if (!inference.query && (access("query", alias) || code.includes("return " + alias) || code.includes("return " + alias + ".query")) && (inference.query = true), !inference.headers && access("headers", alias) && (inference.headers = true), !inference.body && access("body", alias) && (inference.body = true), !inference.cookie && access("cookie", alias) && (inference.cookie = true), !inference.set && access("set", alias) && (inference.set = true), !inference.server && access("server", alias) && (inference.server = true), !inference.route && access("route", alias) && (inference.route = true), !inference.url && access("url", alias) && (inference.url = true), !inference.path && access("path", alias) && (inference.path = true), inference.query && inference.headers && inference.body && inference.cookie && inference.set && inference.server && inference.route && inference.url && inference.path)
        break;
    }
  return aliases;
}, isContextPassToFunction = (context, body, inference) => {
  try {
    const captureFunction = new RegExp(
      `\\w\\((?:.*?)?${context}(?:.*?)?\\)`,
      "gs"
    ), exactParameter = new RegExp(`${context}(,|\\))`, "gs"), length = body.length;
    let fn;
    for (fn = captureFunction.exec(body) + ""; captureFunction.lastIndex !== 0 && captureFunction.lastIndex < length + (fn ? fn.length : 0); ) {
      if (fn && exactParameter.test(fn))
        return inference.query = true, inference.headers = true, inference.body = true, inference.cookie = true, inference.set = true, inference.server = true, inference.url = true, inference.route = true, inference.path = true, true;
      fn = captureFunction.exec(body) + "";
    }
    const nextChar = body.charCodeAt(captureFunction.lastIndex);
    return nextChar === 41 || nextChar === 44 ? (inference.query = true, inference.headers = true, inference.body = true, inference.cookie = true, inference.set = true, inference.server = true, inference.url = true, inference.route = true, inference.path = true, true) : false;
  } catch {
    return console.log(
      "[Sucrose] warning: unexpected isContextPassToFunction error, you may continue development as usual but please report the following to maintainers:"
    ), console.log("--- body ---"), console.log(body), console.log("--- context ---"), console.log(context), true;
  }
};
let pendingGC, caches$1 = {};
const clearSucroseCache = (delay) => {
  var _a3;
  delay === null || isCloudflareWorker() || (delay === void 0 && (delay = 4 * 60 * 1e3 + 55 * 1e3), pendingGC && clearTimeout(pendingGC), pendingGC = setTimeout(() => {
    caches$1 = {}, pendingGC = void 0, isBun && Bun.gc(false);
  }, delay), (_a3 = pendingGC.unref) == null ? void 0 : _a3.call(pendingGC));
}, mergeInference = (a, b) => ({
  body: a.body || b.body,
  cookie: a.cookie || b.cookie,
  headers: a.headers || b.headers,
  query: a.query || b.query,
  set: a.set || b.set,
  server: a.server || b.server,
  url: a.url || b.url,
  route: a.route || b.route,
  path: a.path || b.path
}), sucrose = (lifeCycle, inference = {
  query: false,
  headers: false,
  body: false,
  cookie: false,
  set: false,
  server: false,
  url: false,
  route: false,
  path: false
}, settings = {}) => {
  var _a3, _b2, _c3, _d2, _e2, _f2, _g2, _h;
  const events2 = [];
  ((_a3 = lifeCycle.request) == null ? void 0 : _a3.length) && events2.push(...lifeCycle.request), ((_b2 = lifeCycle.beforeHandle) == null ? void 0 : _b2.length) && events2.push(...lifeCycle.beforeHandle), ((_c3 = lifeCycle.parse) == null ? void 0 : _c3.length) && events2.push(...lifeCycle.parse), ((_d2 = lifeCycle.error) == null ? void 0 : _d2.length) && events2.push(...lifeCycle.error), ((_e2 = lifeCycle.transform) == null ? void 0 : _e2.length) && events2.push(...lifeCycle.transform), ((_f2 = lifeCycle.afterHandle) == null ? void 0 : _f2.length) && events2.push(...lifeCycle.afterHandle), ((_g2 = lifeCycle.mapResponse) == null ? void 0 : _g2.length) && events2.push(...lifeCycle.mapResponse), ((_h = lifeCycle.afterResponse) == null ? void 0 : _h.length) && events2.push(...lifeCycle.afterResponse), lifeCycle.handler && typeof lifeCycle.handler == "function" && events2.push(lifeCycle.handler);
  for (let i = 0; i < events2.length; i++) {
    const e = events2[i];
    if (!e) continue;
    const event = typeof e == "object" ? e.fn : e;
    if (typeof event != "function") continue;
    const content = event.toString(), key = checksum(content), cachedInference = caches$1[key];
    if (cachedInference) {
      inference = mergeInference(inference, cachedInference);
      continue;
    }
    clearSucroseCache(settings.gcTime);
    const fnInference = {
      query: false,
      headers: false,
      body: false,
      cookie: false,
      set: false,
      server: false,
      url: false,
      route: false,
      path: false
    }, [parameter, body] = separateFunction(content), rootParameters = findParameterReference(parameter, fnInference), mainParameter = extractMainParameter(rootParameters);
    if (mainParameter) {
      const aliases = findAlias(mainParameter, body.slice(1, -1));
      aliases.splice(0, -1, mainParameter);
      let code = body;
      code.charCodeAt(0) === 123 && code.charCodeAt(body.length - 1) === 125 && (code = code.slice(1, -1).trim()), isContextPassToFunction(mainParameter, code, fnInference) || inferBodyReference(code, aliases, fnInference), !fnInference.query && code.includes("return " + mainParameter + ".query") && (fnInference.query = true);
    }
    if (caches$1[key] || (caches$1[key] = fnInference), inference = mergeInference(inference, fnInference), inference.query && inference.headers && inference.body && inference.cookie && inference.set && inference.server && inference.url && inference.route && inference.path)
      break;
  }
  return inference;
};
var dist = {};
Object.defineProperty(dist, "__esModule", { value: true });
dist.parseCookie = parseCookie$1;
var parse = dist.parse = parseCookie$1;
dist.stringifyCookie = stringifyCookie;
dist.stringifySetCookie = stringifySetCookie;
var serialize = dist.serialize = stringifySetCookie;
dist.parseSetCookie = parseSetCookie;
dist.stringifySetCookie = stringifySetCookie;
serialize = dist.serialize = stringifySetCookie;
const cookieNameRegExp = /^[\u0021-\u003A\u003C\u003E-\u007E]+$/;
const cookieValueRegExp = /^[\u0021-\u003A\u003C-\u007E]*$/;
const domainValueRegExp = /^([.]?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
const pathValueRegExp = /^[\u0020-\u003A\u003D-\u007E]*$/;
const maxAgeRegExp = /^-?\d+$/;
const __toString = Object.prototype.toString;
const NullObject = /* @__PURE__ */ (() => {
  const C = function() {
  };
  C.prototype = /* @__PURE__ */ Object.create(null);
  return C;
})();
function parseCookie$1(str, options) {
  const obj = new NullObject();
  const len = str.length;
  if (len < 2)
    return obj;
  const dec = (options == null ? void 0 : options.decode) || decode;
  let index = 0;
  do {
    const eqIdx = eqIndex(str, index, len);
    if (eqIdx === -1)
      break;
    const endIdx = endIndex(str, index, len);
    if (eqIdx > endIdx) {
      index = str.lastIndexOf(";", eqIdx - 1) + 1;
      continue;
    }
    const key = valueSlice(str, index, eqIdx);
    if (obj[key] === void 0) {
      obj[key] = dec(valueSlice(str, eqIdx + 1, endIdx));
    }
    index = endIdx + 1;
  } while (index < len);
  return obj;
}
function stringifyCookie(cookie, options) {
  const enc = (options == null ? void 0 : options.encode) || encodeURIComponent;
  const cookieStrings = [];
  for (const name of Object.keys(cookie)) {
    const val = cookie[name];
    if (val === void 0)
      continue;
    if (!cookieNameRegExp.test(name)) {
      throw new TypeError(`cookie name is invalid: ${name}`);
    }
    const value = enc(val);
    if (!cookieValueRegExp.test(value)) {
      throw new TypeError(`cookie val is invalid: ${val}`);
    }
    cookieStrings.push(`${name}=${value}`);
  }
  return cookieStrings.join("; ");
}
function stringifySetCookie(_name, _val, _opts) {
  const cookie = typeof _name === "object" ? _name : { ..._opts, name: _name, value: String(_val) };
  const options = typeof _val === "object" ? _val : _opts;
  const enc = (options == null ? void 0 : options.encode) || encodeURIComponent;
  if (!cookieNameRegExp.test(cookie.name)) {
    throw new TypeError(`argument name is invalid: ${cookie.name}`);
  }
  const value = cookie.value ? enc(cookie.value) : "";
  if (!cookieValueRegExp.test(value)) {
    throw new TypeError(`argument val is invalid: ${cookie.value}`);
  }
  let str = cookie.name + "=" + value;
  if (cookie.maxAge !== void 0) {
    if (!Number.isInteger(cookie.maxAge)) {
      throw new TypeError(`option maxAge is invalid: ${cookie.maxAge}`);
    }
    str += "; Max-Age=" + cookie.maxAge;
  }
  if (cookie.domain) {
    if (!domainValueRegExp.test(cookie.domain)) {
      throw new TypeError(`option domain is invalid: ${cookie.domain}`);
    }
    str += "; Domain=" + cookie.domain;
  }
  if (cookie.path) {
    if (!pathValueRegExp.test(cookie.path)) {
      throw new TypeError(`option path is invalid: ${cookie.path}`);
    }
    str += "; Path=" + cookie.path;
  }
  if (cookie.expires) {
    if (!isDate(cookie.expires) || !Number.isFinite(cookie.expires.valueOf())) {
      throw new TypeError(`option expires is invalid: ${cookie.expires}`);
    }
    str += "; Expires=" + cookie.expires.toUTCString();
  }
  if (cookie.httpOnly) {
    str += "; HttpOnly";
  }
  if (cookie.secure) {
    str += "; Secure";
  }
  if (cookie.partitioned) {
    str += "; Partitioned";
  }
  if (cookie.priority) {
    const priority = typeof cookie.priority === "string" ? cookie.priority.toLowerCase() : void 0;
    switch (priority) {
      case "low":
        str += "; Priority=Low";
        break;
      case "medium":
        str += "; Priority=Medium";
        break;
      case "high":
        str += "; Priority=High";
        break;
      default:
        throw new TypeError(`option priority is invalid: ${cookie.priority}`);
    }
  }
  if (cookie.sameSite) {
    const sameSite = typeof cookie.sameSite === "string" ? cookie.sameSite.toLowerCase() : cookie.sameSite;
    switch (sameSite) {
      case true:
      case "strict":
        str += "; SameSite=Strict";
        break;
      case "lax":
        str += "; SameSite=Lax";
        break;
      case "none":
        str += "; SameSite=None";
        break;
      default:
        throw new TypeError(`option sameSite is invalid: ${cookie.sameSite}`);
    }
  }
  return str;
}
function parseSetCookie(str, options) {
  const dec = (options == null ? void 0 : options.decode) || decode;
  const len = str.length;
  const endIdx = endIndex(str, 0, len);
  const eqIdx = eqIndex(str, 0, endIdx);
  const setCookie = eqIdx === -1 ? { name: "", value: dec(valueSlice(str, 0, endIdx)) } : {
    name: valueSlice(str, 0, eqIdx),
    value: dec(valueSlice(str, eqIdx + 1, endIdx))
  };
  let index = endIdx + 1;
  while (index < len) {
    const endIdx2 = endIndex(str, index, len);
    const eqIdx2 = eqIndex(str, index, endIdx2);
    const attr = eqIdx2 === -1 ? valueSlice(str, index, endIdx2) : valueSlice(str, index, eqIdx2);
    const val = eqIdx2 === -1 ? void 0 : valueSlice(str, eqIdx2 + 1, endIdx2);
    switch (attr.toLowerCase()) {
      case "httponly":
        setCookie.httpOnly = true;
        break;
      case "secure":
        setCookie.secure = true;
        break;
      case "partitioned":
        setCookie.partitioned = true;
        break;
      case "domain":
        setCookie.domain = val;
        break;
      case "path":
        setCookie.path = val;
        break;
      case "max-age":
        if (val && maxAgeRegExp.test(val))
          setCookie.maxAge = Number(val);
        break;
      case "expires":
        if (!val)
          break;
        const date2 = new Date(val);
        if (Number.isFinite(date2.valueOf()))
          setCookie.expires = date2;
        break;
      case "priority":
        if (!val)
          break;
        const priority = val.toLowerCase();
        if (priority === "low" || priority === "medium" || priority === "high") {
          setCookie.priority = priority;
        }
        break;
      case "samesite":
        if (!val)
          break;
        const sameSite = val.toLowerCase();
        if (sameSite === "lax" || sameSite === "strict" || sameSite === "none") {
          setCookie.sameSite = sameSite;
        }
        break;
    }
    index = endIdx2 + 1;
  }
  return setCookie;
}
function endIndex(str, min, len) {
  const index = str.indexOf(";", min);
  return index === -1 ? len : index;
}
function eqIndex(str, min, max) {
  const index = str.indexOf("=", min);
  return index < max ? index : -1;
}
function valueSlice(str, min, max) {
  let start = min;
  let end = max;
  do {
    const code = str.charCodeAt(start);
    if (code !== 32 && code !== 9)
      break;
  } while (++start < end);
  while (end > start) {
    const code = str.charCodeAt(end - 1);
    if (code !== 32 && code !== 9)
      break;
    end--;
  }
  return str.slice(start, end);
}
function decode(str) {
  if (str.indexOf("%") === -1)
    return str;
  try {
    return decodeURIComponent(str);
  } catch (e) {
    return str;
  }
}
function isDate(val) {
  return __toString.call(val) === "[object Date]";
}
const hashString = (str) => {
  let hash = 2166136261;
  const len = str.length;
  for (let i = 0; i < len; i++)
    hash ^= str.charCodeAt(i), hash = Math.imul(hash, 16777619);
  return hash >>> 0;
};
class Cookie {
  constructor(name, jar, initial = /* @__PURE__ */ Object.create(null)) {
    this.name = name;
    this.jar = jar;
    this.initial = initial;
  }
  get cookie() {
    return this.jar[this.name] ?? this.initial;
  }
  set cookie(jar) {
    this.name in this.jar || (this.jar[this.name] = this.initial), this.jar[this.name] = jar, this.valueHash = void 0;
  }
  get setCookie() {
    return this.name in this.jar || (this.jar[this.name] = this.initial), this.jar[this.name];
  }
  set setCookie(jar) {
    this.cookie = jar;
  }
  get value() {
    return this.cookie.value;
  }
  set value(value) {
    const current = this.cookie.value;
    if (current !== value) {
      if (typeof current == "object" && current !== null && typeof value == "object" && value !== null)
        try {
          const valueStr = JSON.stringify(value), newHash = hashString(valueStr);
          if (this.valueHash !== void 0 && this.valueHash !== newHash)
            this.valueHash = newHash;
          else {
            if (JSON.stringify(current) === valueStr) {
              this.valueHash = newHash;
              return;
            }
            this.valueHash = newHash;
          }
        } catch {
        }
      this.name in this.jar || (this.jar[this.name] = { ...this.initial }), this.jar[this.name].value = value;
    }
  }
  get expires() {
    return this.cookie.expires;
  }
  set expires(expires) {
    this.setCookie.expires = expires;
  }
  get maxAge() {
    return this.cookie.maxAge;
  }
  set maxAge(maxAge) {
    this.setCookie.maxAge = maxAge;
  }
  get domain() {
    return this.cookie.domain;
  }
  set domain(domain) {
    this.setCookie.domain = domain;
  }
  get path() {
    return this.cookie.path;
  }
  set path(path2) {
    this.setCookie.path = path2;
  }
  get secure() {
    return this.cookie.secure;
  }
  set secure(secure) {
    this.setCookie.secure = secure;
  }
  get httpOnly() {
    return this.cookie.httpOnly;
  }
  set httpOnly(httpOnly) {
    this.setCookie.httpOnly = httpOnly;
  }
  get sameSite() {
    return this.cookie.sameSite;
  }
  set sameSite(sameSite) {
    this.setCookie.sameSite = sameSite;
  }
  get priority() {
    return this.cookie.priority;
  }
  set priority(priority) {
    this.setCookie.priority = priority;
  }
  get partitioned() {
    return this.cookie.partitioned;
  }
  set partitioned(partitioned) {
    this.setCookie.partitioned = partitioned;
  }
  get secrets() {
    return this.cookie.secrets;
  }
  set secrets(secrets) {
    this.setCookie.secrets = secrets;
  }
  update(config) {
    return this.setCookie = Object.assign(
      this.cookie,
      typeof config == "function" ? config(this.cookie) : config
    ), this;
  }
  set(config) {
    return this.setCookie = Object.assign(
      {
        ...this.initial,
        value: this.value
      },
      typeof config == "function" ? config(this.cookie) : config
    ), this;
  }
  remove() {
    if (this.value !== void 0)
      return this.set({
        expires: /* @__PURE__ */ new Date(0),
        maxAge: 0,
        value: ""
      }), this;
  }
  toString() {
    var _a3;
    return typeof this.value == "object" ? JSON.stringify(this.value) : ((_a3 = this.value) == null ? void 0 : _a3.toString()) ?? "";
  }
}
const createCookieJar = (set2, store, initial) => (set2.cookie || (set2.cookie = /* @__PURE__ */ Object.create(null)), new Proxy(store, {
  get(_, key) {
    return key in store ? new Cookie(
      key,
      set2.cookie,
      Object.assign({}, initial ?? {}, store[key])
    ) : new Cookie(
      key,
      set2.cookie,
      Object.assign({}, initial)
    );
  }
})), parseCookie = async (set2, cookieString, {
  secrets,
  sign,
  ...initial
} = /* @__PURE__ */ Object.create(null)) => {
  if (!cookieString) return createCookieJar(set2, /* @__PURE__ */ Object.create(null), initial);
  const isStringKey = typeof secrets == "string";
  sign && sign !== true && !Array.isArray(sign) && (sign = [sign]);
  const jar = /* @__PURE__ */ Object.create(null), cookies = parse(cookieString);
  for (const [name, v] of Object.entries(cookies)) {
    if (v === void 0 || name === "__proto__" || name === "constructor" || name === "prototype")
      continue;
    let value = fastDecodeURIComponent(v);
    if (sign === true || (sign == null ? void 0 : sign.includes(name))) {
      if (!secrets)
        throw new Error("No secret is provided to cookie plugin");
      if (isStringKey) {
        if (typeof value != "string")
          throw new InvalidCookieSignature(name);
        const temp = await unsignCookie(value, secrets);
        if (temp === false) throw new InvalidCookieSignature(name);
        value = temp;
      } else {
        let decoded = false;
        for (let i = 0; i < secrets.length; i++) {
          if (typeof value != "string")
            throw new InvalidCookieSignature(name);
          const temp = await unsignCookie(value, secrets[i]);
          if (temp !== false) {
            decoded = true, value = temp;
            break;
          }
        }
        if (!decoded) throw new InvalidCookieSignature(name);
      }
    }
    if (value) {
      const starts = value.charCodeAt(0), ends = value.charCodeAt(value.length - 1);
      if (starts === 123 && ends === 125 || starts === 91 && ends === 93)
        try {
          value = JSON.parse(value);
        } catch {
        }
    }
    jar[name] = /* @__PURE__ */ Object.create(null), jar[name].value = value;
  }
  return createCookieJar(set2, jar, initial);
}, serializeCookie = (cookies) => {
  if (!cookies || !isNotEmpty(cookies)) return;
  const set2 = [];
  for (const [key, property] of Object.entries(cookies)) {
    if (!key || !property) continue;
    const value = property.value;
    value != null && set2.push(
      serialize(
        key,
        typeof value == "object" ? JSON.stringify(value) : value + "",
        property
      )
    );
  }
  if (set2.length !== 0)
    return set2.length === 1 ? set2[0] : set2;
};
const handleFile$1 = (response, set2, request) => {
  if (!isBun && response instanceof Promise)
    return response.then((res) => handleFile$1(res, set2, request));
  const size = response.size, rangeHeader = request == null ? void 0 : request.headers.get("range");
  if (rangeHeader) {
    const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
    if (match) {
      if (!match[1] && !match[2])
        return new Response(null, {
          status: 416,
          headers: mergeHeaders$2(
            new Headers({ "content-range": `bytes */${size}` }),
            (set2 == null ? void 0 : set2.headers) ?? {}
          )
        });
      let start, end;
      if (!match[1] && match[2]) {
        const suffix = parseInt(match[2]);
        start = Math.max(0, size - suffix), end = size - 1;
      } else
        start = match[1] ? parseInt(match[1]) : 0, end = match[2] ? Math.min(parseInt(match[2]), size - 1) : size - 1;
      if (start >= size || start > end)
        return new Response(null, {
          status: 416,
          headers: mergeHeaders$2(
            new Headers({ "content-range": `bytes */${size}` }),
            (set2 == null ? void 0 : set2.headers) ?? {}
          )
        });
      const contentLength = end - start + 1, rangeHeaders = new Headers({
        "accept-ranges": "bytes",
        "content-range": `bytes ${start}-${end}/${size}`,
        "content-length": String(contentLength)
      });
      return new Response(
        response.slice(start, end + 1, response.type),
        {
          status: 206,
          headers: mergeHeaders$2(rangeHeaders, (set2 == null ? void 0 : set2.headers) ?? {})
        }
      );
    }
  }
  const immutable = set2 && (set2.status === 206 || set2.status === 304 || set2.status === 412 || set2.status === 416), defaultHeader = immutable ? {} : {
    "accept-ranges": "bytes",
    "content-range": size ? `bytes 0-${size - 1}/${size}` : void 0
  };
  if (!set2 && !size) return new Response(response);
  if (!set2)
    return new Response(response, {
      headers: defaultHeader
    });
  if (set2.headers instanceof Headers) {
    for (const key of Object.keys(defaultHeader))
      key in set2.headers && set2.headers.append(key, defaultHeader[key]);
    return immutable && (set2.headers.delete("content-length"), set2.headers.delete("accept-ranges")), new Response(response, set2);
  }
  return isNotEmpty(set2.headers) ? new Response(response, {
    status: set2.status,
    headers: Object.assign(defaultHeader, set2.headers)
  }) : new Response(response, {
    status: set2.status,
    headers: defaultHeader
  });
}, parseSetCookies = (headers, setCookie) => {
  if (!headers) return headers;
  headers.delete("set-cookie");
  for (let i = 0; i < setCookie.length; i++) {
    const index = setCookie[i].indexOf("=");
    headers.append(
      "set-cookie",
      `${setCookie[i].slice(0, index)}=${setCookie[i].slice(index + 1) || ""}`
    );
  }
  return headers;
}, responseToSetHeaders = (response, set2) => {
  if (set2 == null ? void 0 : set2.headers) {
    if (response)
      if (hasHeaderShorthand)
        Object.assign(set2.headers, response.headers.toJSON());
      else
        for (const [key, value] of response.headers.entries())
          key in set2.headers && (set2.headers[key] = value);
    return set2.status === 200 && (set2.status = response.status), set2.headers["content-encoding"] && delete set2.headers["content-encoding"], set2;
  }
  if (!response)
    return {
      headers: {},
      status: (set2 == null ? void 0 : set2.status) ?? 200
    };
  if (hasHeaderShorthand)
    return set2 = {
      headers: response.headers.toJSON(),
      status: (set2 == null ? void 0 : set2.status) ?? 200
    }, set2.headers["content-encoding"] && delete set2.headers["content-encoding"], set2;
  set2 = {
    headers: {},
    status: (set2 == null ? void 0 : set2.status) ?? 200
  };
  for (const [key, value] of response.headers.entries())
    key !== "content-encoding" && key in set2.headers && (set2.headers[key] = value);
  return set2;
}, enqueueBinaryChunk = (controller, chunk) => chunk instanceof Blob ? chunk.arrayBuffer().then((buffer) => (controller.enqueue(new Uint8Array(buffer)), true)) : chunk instanceof Uint8Array ? (controller.enqueue(chunk), true) : chunk instanceof ArrayBuffer ? (controller.enqueue(new Uint8Array(chunk)), true) : ArrayBuffer.isView(chunk) ? (controller.enqueue(
  new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)
), true) : false, createStreamHandler = ({ mapResponse: mapResponse2, mapCompactResponse: mapCompactResponse2 }) => async (generator, set2, request, skipFormat) => {
  var _a3, _b2, _c3;
  let init = (_a3 = generator.next) == null ? void 0 : _a3.call(generator);
  if (set2 && handleSet(set2), init instanceof Promise && (init = await init), (init == null ? void 0 : init.value) instanceof ReadableStream)
    generator = init.value;
  else if (init && (typeof (init == null ? void 0 : init.done) > "u" || (init == null ? void 0 : init.done)))
    return set2 ? mapResponse2(init.value, set2, request) : mapCompactResponse2(init.value, request);
  const isSSE = !skipFormat && // @ts-ignore First SSE result is wrapped with sse()
  (((_b2 = init == null ? void 0 : init.value) == null ? void 0 : _b2.sse) ?? // @ts-ignore ReadableStream is wrapped with sse()
  (generator == null ? void 0 : generator.sse) ?? // User explicitly set content-type to SSE
  ((_c3 = set2 == null ? void 0 : set2.headers["content-type"]) == null ? void 0 : _c3.startsWith("text/event-stream"))), format = isSSE ? (data) => `data: ${data}

` : (data) => data, contentType = isSSE ? "text/event-stream" : (init == null ? void 0 : init.value) && typeof (init == null ? void 0 : init.value) == "object" ? "application/json" : "text/plain";
  (set2 == null ? void 0 : set2.headers) ? (set2.headers["transfer-encoding"] || (set2.headers["transfer-encoding"] = "chunked"), set2.headers["content-type"] || (set2.headers["content-type"] = contentType), set2.headers["cache-control"] || (set2.headers["cache-control"] = "no-cache")) : set2 = {
    status: 200,
    headers: {
      "content-type": contentType,
      "transfer-encoding": "chunked",
      "cache-control": "no-cache",
      connection: "keep-alive"
    }
  };
  const iterator = typeof generator.next == "function" ? generator : generator[Symbol.asyncIterator]();
  let end = false;
  return new Response(
    new ReadableStream({
      start(controller) {
        var _a4;
        if ((_a4 = request == null ? void 0 : request.signal) == null ? void 0 : _a4.addEventListener("abort", () => {
          var _a5;
          end = true, (_a5 = iterator.return) == null ? void 0 : _a5.call(iterator);
          try {
            controller.close();
          } catch {
          }
        }), !(!init || init.value instanceof ReadableStream || init.value === void 0 || init.value === null))
          if (init.value.toSSE)
            controller.enqueue(init.value.toSSE());
          else {
            if (enqueueBinaryChunk(controller, init.value)) return;
            if (typeof init.value == "object")
              try {
                controller.enqueue(
                  format(JSON.stringify(init.value))
                );
              } catch {
                controller.enqueue(format(init.value.toString()));
              }
            else controller.enqueue(format(init.value.toString()));
          }
      },
      async pull(controller) {
        if (end) {
          try {
            controller.close();
          } catch {
          }
          return;
        }
        try {
          const { value: chunk, done } = await iterator.next();
          if (done || end) {
            try {
              controller.close();
            } catch {
            }
            return;
          }
          if (chunk == null) return;
          if (chunk.toSSE)
            controller.enqueue(chunk.toSSE());
          else {
            if (enqueueBinaryChunk(controller, chunk)) return;
            if (typeof chunk == "object")
              try {
                controller.enqueue(
                  format(JSON.stringify(chunk))
                );
              } catch {
                controller.enqueue(format(chunk.toString()));
              }
            else controller.enqueue(format(chunk.toString()));
          }
        } catch (error) {
          console.warn(error);
          try {
            controller.close();
          } catch {
          }
        }
      },
      cancel() {
        var _a4;
        end = true, (_a4 = iterator.return) == null ? void 0 : _a4.call(iterator);
      }
    }),
    set2
  );
};
async function* streamResponse(response) {
  const body = response.body;
  if (!body) return;
  const reader = body.getReader(), decoder = new TextDecoder();
  try {
    for (; ; ) {
      const { done, value } = await reader.read();
      if (done) break;
      typeof value == "string" ? yield value : yield decoder.decode(value);
    }
  } finally {
    reader.releaseLock();
  }
}
const handleSet = (set2) => {
  if (typeof set2.status == "string" && (set2.status = StatusMap[set2.status]), set2.cookie && isNotEmpty(set2.cookie)) {
    const cookie = serializeCookie(set2.cookie);
    cookie && (set2.headers["set-cookie"] = cookie);
  }
  set2.headers["set-cookie"] && Array.isArray(set2.headers["set-cookie"]) && (set2.headers = parseSetCookies(
    new Headers(set2.headers),
    set2.headers["set-cookie"]
  ));
};
function mergeHeaders$2(responseHeaders, setHeaders) {
  const headers = new Headers(responseHeaders);
  if (setHeaders instanceof Headers)
    for (const key of setHeaders.keys())
      if (key === "set-cookie") {
        if (headers.has("set-cookie")) continue;
        for (const cookie of setHeaders.getSetCookie())
          headers.append("set-cookie", cookie);
      } else responseHeaders.has(key) || headers.set(key, (setHeaders == null ? void 0 : setHeaders.get(key)) ?? "");
  else
    for (const key in setHeaders)
      key === "set-cookie" ? headers.append(key, setHeaders[key]) : responseHeaders.has(key) || headers.set(key, setHeaders[key]);
  return headers;
}
function mergeStatus$1(responseStatus, setStatus) {
  return typeof setStatus == "string" && (setStatus = StatusMap[setStatus]), responseStatus === 200 ? setStatus : responseStatus;
}
const createResponseHandler$1 = (handler) => {
  const handleStream2 = createStreamHandler(handler);
  return (response, set2, request) => {
    const newResponse = new Response(response.body, {
      headers: mergeHeaders$2(response.headers, set2.headers),
      status: mergeStatus$1(response.status, set2.status)
    });
    return !newResponse.headers.has("content-length") && newResponse.headers.get("transfer-encoding") === "chunked" ? handleStream2(
      streamResponse(newResponse),
      responseToSetHeaders(newResponse, set2),
      request,
      true
      // don't auto-format SSE for pre-formatted Response
    ) : newResponse;
  };
};
async function tee(source, branches = 2) {
  const buffer = [];
  let done = false, waiting = [];
  (async () => {
    for await (const value of source)
      buffer.push(value), waiting.forEach((w) => w.resolve()), waiting = [];
    done = true, waiting.forEach((w) => w.resolve());
  })();
  async function* makeIterator() {
    let i = 0;
    for (; ; )
      if (i < buffer.length)
        yield buffer[i++];
      else {
        if (done)
          return;
        await new Promise((resolve) => waiting.push({ resolve }));
      }
  }
  return Array.from({ length: branches }, makeIterator);
}
const handleElysiaFile$1 = (file, set2 = {
  headers: {}
}, request) => {
  const path2 = file.path, contentType = mime[path2.slice(path2.lastIndexOf(".") + 1)];
  return contentType && (set2.headers["content-type"] = contentType), file.stats && set2.status !== 206 && set2.status !== 304 && set2.status !== 412 && set2.status !== 416 ? file.stats.then((stat2) => {
    const size = stat2.size;
    return size !== void 0 && (set2.headers["content-range"] = `bytes 0-${size - 1}/${size}`, set2.headers["content-length"] = size), handleFile$1(file.value, set2, request);
  }) : handleFile$1(file.value, set2, request);
}, mapResponse$2 = (response, set2, request) => {
  var _a3;
  if (isNotEmpty(set2.headers) || set2.status !== 200 || set2.cookie)
    switch (handleSet(set2), (_a3 = response == null ? void 0 : response.constructor) == null ? void 0 : _a3.name) {
      case "String":
        return set2.headers["content-type"] || (set2.headers["content-type"] = "text/plain"), new Response(response, set2);
      case "Array":
      case "Object":
        return set2.headers["content-type"] || (set2.headers["content-type"] = "application/json"), new Response(JSON.stringify(response), set2);
      case "ElysiaFile":
        return handleElysiaFile$1(response, set2, request);
      case "File":
        return handleFile$1(response, set2, request);
      case "Blob":
        return handleFile$1(response, set2, request);
      case "ElysiaCustomStatusResponse":
        return set2.status = response.code, mapResponse$2(
          response.response,
          set2,
          request
        );
      case void 0:
        return response ? new Response(JSON.stringify(response), set2) : new Response("", set2);
      case "Response":
        return handleResponse$2(response, set2, request);
      case "Error":
        return errorToResponse$2(response, set2);
      case "Promise":
        return response.then(
          (x) => mapResponse$2(x, set2, request)
        );
      case "Function":
        return mapResponse$2(response(), set2, request);
      case "Number":
      case "Boolean":
        return new Response(
          response.toString(),
          set2
        );
      case "Cookie":
        return response instanceof Cookie ? new Response(response.value, set2) : new Response(response == null ? void 0 : response.toString(), set2);
      case "FormData":
        return new Response(response, set2);
      default:
        if (response instanceof Response)
          return handleResponse$2(response, set2, request);
        if (response instanceof Promise)
          return response.then((x) => mapResponse$2(x, set2));
        if (response instanceof Error)
          return errorToResponse$2(response, set2);
        if (response instanceof ElysiaCustomStatusResponse)
          return set2.status = response.code, mapResponse$2(
            response.response,
            set2,
            request
          );
        if (
          // @ts-expect-error
          typeof (response == null ? void 0 : response.next) == "function" || response instanceof ReadableStream
        )
          return handleStream$2(response, set2, request);
        if (typeof (response == null ? void 0 : response.then) == "function")
          return response.then(
            (x) => mapResponse$2(x, set2)
          );
        if (Array.isArray(response))
          return new Response(JSON.stringify(response), {
            headers: {
              "Content-Type": "application/json"
            }
          });
        if (typeof (response == null ? void 0 : response.toResponse) == "function")
          return mapResponse$2(response.toResponse(), set2);
        if ("charCodeAt" in response) {
          const code = response.charCodeAt(0);
          if (code === 123 || code === 91)
            return set2.headers["Content-Type"] || (set2.headers["Content-Type"] = "application/json"), new Response(
              JSON.stringify(response),
              set2
            );
        }
        return new Response(response, set2);
    }
  return (
    // @ts-expect-error
    typeof (response == null ? void 0 : response.next) == "function" || response instanceof ReadableStream ? handleStream$2(response, set2, request) : mapCompactResponse$2(response, request)
  );
}, mapEarlyResponse$2 = (response, set2, request) => {
  var _a3, _b2;
  if (response != null)
    if (isNotEmpty(set2.headers) || set2.status !== 200 || set2.cookie)
      switch (handleSet(set2), (_a3 = response == null ? void 0 : response.constructor) == null ? void 0 : _a3.name) {
        case "String":
          return set2.headers["content-type"] || (set2.headers["content-type"] = "text/plain"), new Response(response, set2);
        case "Array":
        case "Object":
          return set2.headers["content-type"] || (set2.headers["content-type"] = "application/json"), new Response(JSON.stringify(response), set2);
        case "ElysiaFile":
          return handleElysiaFile$1(response, set2, request);
        case "File":
          return handleFile$1(response, set2, request);
        case "Blob":
          return handleFile$1(response, set2, request);
        case "ElysiaCustomStatusResponse":
          return set2.status = response.code, mapEarlyResponse$2(
            response.response,
            set2,
            request
          );
        case void 0:
          return response ? new Response(JSON.stringify(response), set2) : void 0;
        case "Response":
          return handleResponse$2(response, set2, request);
        case "Promise":
          return response.then(
            (x) => mapEarlyResponse$2(x, set2)
          );
        case "Error":
          return errorToResponse$2(response, set2);
        case "Function":
          return mapEarlyResponse$2(response(), set2);
        case "Number":
        case "Boolean":
          return new Response(
            response.toString(),
            set2
          );
        case "FormData":
          return new Response(response);
        case "Cookie":
          return response instanceof Cookie ? new Response(response.value, set2) : new Response(response == null ? void 0 : response.toString(), set2);
        default:
          if (response instanceof Response)
            return handleResponse$2(response, set2, request);
          if (response instanceof Promise)
            return response.then((x) => mapEarlyResponse$2(x, set2));
          if (response instanceof Error)
            return errorToResponse$2(response, set2);
          if (response instanceof ElysiaCustomStatusResponse)
            return set2.status = response.code, mapEarlyResponse$2(
              response.response,
              set2,
              request
            );
          if (
            // @ts-expect-error
            typeof (response == null ? void 0 : response.next) == "function" || response instanceof ReadableStream
          )
            return handleStream$2(response, set2, request);
          if (typeof (response == null ? void 0 : response.then) == "function")
            return response.then(
              (x) => mapEarlyResponse$2(x, set2)
            );
          if (typeof (response == null ? void 0 : response.toResponse) == "function")
            return mapEarlyResponse$2(response.toResponse(), set2);
          if (Array.isArray(response))
            return new Response(JSON.stringify(response), {
              headers: {
                "Content-Type": "application/json"
              }
            });
          if ("charCodeAt" in response) {
            const code = response.charCodeAt(0);
            if (code === 123 || code === 91)
              return set2.headers["Content-Type"] || (set2.headers["Content-Type"] = "application/json"), new Response(
                JSON.stringify(response),
                set2
              );
          }
          return new Response(response, set2);
      }
    else
      switch ((_b2 = response == null ? void 0 : response.constructor) == null ? void 0 : _b2.name) {
        case "String":
          return set2.headers["content-type"] || (set2.headers["content-type"] = "text/plain"), new Response(response);
        case "Array":
        case "Object":
          return set2.headers["content-type"] || (set2.headers["content-type"] = "application/json"), new Response(JSON.stringify(response), set2);
        case "ElysiaFile":
          return handleElysiaFile$1(response, set2, request);
        case "File":
          return handleFile$1(response, set2, request);
        case "Blob":
          return handleFile$1(response, set2, request);
        case "ElysiaCustomStatusResponse":
          return set2.status = response.code, mapEarlyResponse$2(
            response.response,
            set2,
            request
          );
        case void 0:
          return response ? new Response(JSON.stringify(response), {
            headers: {
              "content-type": "application/json"
            }
          }) : new Response("");
        case "Response":
          return response;
        case "Promise":
          return response.then((x) => {
            const r = mapEarlyResponse$2(x, set2);
            if (r !== void 0) return r;
          });
        case "Error":
          return errorToResponse$2(response, set2);
        case "Function":
          return mapCompactResponse$2(response(), request);
        case "Number":
        case "Boolean":
          return new Response(response.toString());
        case "Cookie":
          return response instanceof Cookie ? new Response(response.value, set2) : new Response(response == null ? void 0 : response.toString(), set2);
        case "FormData":
          return new Response(response);
        default:
          if (response instanceof Response) return response;
          if (response instanceof Promise)
            return response.then((x) => mapEarlyResponse$2(x, set2));
          if (response instanceof Error)
            return errorToResponse$2(response, set2);
          if (response instanceof ElysiaCustomStatusResponse)
            return set2.status = response.code, mapEarlyResponse$2(
              response.response,
              set2,
              request
            );
          if (
            // @ts-expect-error
            typeof (response == null ? void 0 : response.next) == "function" || response instanceof ReadableStream
          )
            return handleStream$2(response, set2, request);
          if (typeof (response == null ? void 0 : response.then) == "function")
            return response.then(
              (x) => mapEarlyResponse$2(x, set2)
            );
          if (typeof (response == null ? void 0 : response.toResponse) == "function")
            return mapEarlyResponse$2(response.toResponse(), set2);
          if (Array.isArray(response))
            return new Response(JSON.stringify(response), {
              headers: {
                "Content-Type": "application/json"
              }
            });
          if ("charCodeAt" in response) {
            const code = response.charCodeAt(0);
            if (code === 123 || code === 91)
              return set2.headers["Content-Type"] || (set2.headers["Content-Type"] = "application/json"), new Response(
                JSON.stringify(response),
                set2
              );
          }
          return new Response(response);
      }
}, mapCompactResponse$2 = (response, request) => {
  var _a3;
  switch ((_a3 = response == null ? void 0 : response.constructor) == null ? void 0 : _a3.name) {
    case "String":
      return new Response(response, {
        headers: {
          "Content-Type": "text/plain"
        }
      });
    case "Object":
    case "Array":
      return new Response(JSON.stringify(response), {
        headers: {
          "Content-Type": "application/json"
        }
      });
    case "ElysiaFile":
      return handleElysiaFile$1(response, void 0, request);
    case "File":
      return handleFile$1(response, void 0, request);
    case "Blob":
      return handleFile$1(response, void 0, request);
    case "ElysiaCustomStatusResponse":
      return mapResponse$2(
        response.response,
        {
          status: response.code,
          headers: {}
        }
      );
    case void 0:
      return response ? new Response(JSON.stringify(response), {
        headers: {
          "content-type": "application/json"
        }
      }) : new Response("");
    case "Response":
      return response;
    case "Error":
      return errorToResponse$2(response);
    case "Promise":
      return response.then(
        (x) => mapCompactResponse$2(x, request)
      );
    case "Function":
      return mapCompactResponse$2(response(), request);
    case "Number":
    case "Boolean":
      return new Response(response.toString());
    case "FormData":
      return new Response(response);
    default:
      if (response instanceof Response) return response;
      if (response instanceof Promise)
        return response.then(
          (x) => mapCompactResponse$2(x, request)
        );
      if (response instanceof Error)
        return errorToResponse$2(response);
      if (response instanceof ElysiaCustomStatusResponse)
        return mapResponse$2(
          response.response,
          {
            status: response.code,
            headers: {}
          }
        );
      if (
        // @ts-expect-error
        typeof (response == null ? void 0 : response.next) == "function" || response instanceof ReadableStream
      )
        return handleStream$2(response, void 0, request);
      if (typeof (response == null ? void 0 : response.then) == "function")
        return response.then(
          (x) => mapCompactResponse$2(x, request)
        );
      if (typeof (response == null ? void 0 : response.toResponse) == "function")
        return mapCompactResponse$2(response.toResponse());
      if (Array.isArray(response))
        return new Response(JSON.stringify(response), {
          headers: {
            "Content-Type": "application/json"
          }
        });
      if ("charCodeAt" in response) {
        const code = response.charCodeAt(0);
        if (code === 123 || code === 91)
          return new Response(JSON.stringify(response), {
            headers: {
              "Content-Type": "application/json"
            }
          });
      }
      return new Response(response);
  }
}, errorToResponse$2 = (error, set2) => {
  if (typeof (error == null ? void 0 : error.toResponse) == "function") {
    const raw = error.toResponse(), targetSet = set2 ?? { headers: {}, status: 200, redirect: "" }, apply2 = (resolved) => (resolved instanceof Response && (targetSet.status = resolved.status), mapResponse$2(resolved, targetSet));
    return typeof (raw == null ? void 0 : raw.then) == "function" ? raw.then(apply2) : apply2(raw);
  }
  return new Response(
    JSON.stringify({
      name: error == null ? void 0 : error.name,
      message: error == null ? void 0 : error.message,
      cause: error == null ? void 0 : error.cause
    }),
    {
      status: (set2 == null ? void 0 : set2.status) !== 200 ? (set2 == null ? void 0 : set2.status) ?? 500 : 500,
      headers: set2 == null ? void 0 : set2.headers
    }
  );
}, createStaticHandler$2 = (handle, hooks, setHeaders = {}) => {
  var _a3, _b2, _c3, _d2;
  if (typeof handle == "function") return;
  const response = mapResponse$2(handle, {
    headers: setHeaders
  });
  if (!((_a3 = hooks.parse) == null ? void 0 : _a3.length) && !((_b2 = hooks.transform) == null ? void 0 : _b2.length) && !((_c3 = hooks.beforeHandle) == null ? void 0 : _c3.length) && !((_d2 = hooks.afterHandle) == null ? void 0 : _d2.length))
    return () => response.clone();
}, handleResponse$2 = createResponseHandler$1({
  mapResponse: mapResponse$2,
  mapCompactResponse: mapCompactResponse$2
}), handleStream$2 = createStreamHandler({
  mapResponse: mapResponse$2,
  mapCompactResponse: mapCompactResponse$2
});
const WebStandardAdapter = {
  name: "web-standard",
  isWebStandard: true,
  handler: {
    mapResponse: mapResponse$2,
    mapEarlyResponse: mapEarlyResponse$2,
    mapCompactResponse: mapCompactResponse$2,
    createStaticHandler: createStaticHandler$2
  },
  composeHandler: {
    mapResponseContext: "c.request",
    preferWebstandardHeaders: true,
    // @ts-ignore Bun specific
    headers: `c.headers={}
for(const [k,v] of c.request.headers.entries())c.headers[k]=v
`,
    parser: {
      json(isOptional2) {
        return isOptional2 ? `try{c.body=await c.request.json()}catch{}
` : `c.body=await c.request.json()
`;
      },
      text() {
        return `c.body=await c.request.text()
`;
      },
      urlencoded() {
        return `c.body=parseQuery(await c.request.text())
`;
      },
      arrayBuffer() {
        return `c.body=await c.request.arrayBuffer()
`;
      },
      formData(isOptional2) {
        let fnLiteral = `
c.body={}
`;
        return isOptional2 ? fnLiteral += "let form;try{form=await c.request.formData()}catch{}" : fnLiteral += `const form=await c.request.formData()
`, fnLiteral + `const dangerousKeys=new Set(['__proto__','constructor','prototype'])
const isDangerousKey=(k)=>{if(dangerousKeys.has(k))return true;const m=k.match(/^(.+)\\[(\\d+)\\]$/);return m?dangerousKeys.has(m[1]):false}
const parseArrayKey=(k)=>{const m=k.match(/^(.+)\\[(\\d+)\\]$/);return m?{name:m[1],index:parseInt(m[2],10)}:null}
const grouped=new Map()
form.forEach((v,k)=>{const l=grouped.get(k);if(l)l.push(v);else grouped.set(k,[v])})
for(const [key,value] of grouped){if(c.body[key])continue
let finalValue
if(value.length===1){
const sv=value[0]
if(typeof sv==='string'&&(sv.charCodeAt(0)===123||sv.charCodeAt(0)===91)){
try{
const p=JSON.parse(sv)
if(p&&typeof p==='object')finalValue=p
}catch{}
}
if(finalValue===undefined)finalValue=sv
}else finalValue=value
if(Array.isArray(finalValue)){
const stringValue=finalValue.find((entry)=>typeof entry==='string')
const files=typeof File==='undefined'?[]:finalValue.filter((entry)=>entry instanceof File)
if(stringValue&&files.length&&stringValue.charCodeAt(0)===123){
try{
const parsed=JSON.parse(stringValue)
if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed)){
if(!('file' in parsed)&&files.length===1)parsed.file=files[0]
else if(!('files' in parsed)&&files.length>1)parsed.files=files
finalValue=parsed
}
}catch{}
}
}
if(key.includes('.')||key.includes('[')){const keys=key.split('.')
const lastKey=keys.pop()
if(isDangerousKey(lastKey)||keys.some(isDangerousKey))continue
let current=c.body
for(const k of keys){const arrayInfo=parseArrayKey(k)
if(arrayInfo){if(!Array.isArray(current[arrayInfo.name]))current[arrayInfo.name]=[]
const existing=current[arrayInfo.name][arrayInfo.index]
const isFile=typeof File!=='undefined'&&existing instanceof File
if(!existing||typeof existing!=='object'||Array.isArray(existing)||isFile){
let parsed
if(typeof existing==='string'&&existing.charCodeAt(0)===123){
try{parsed=JSON.parse(existing)
if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))parsed=undefined}catch{}
}
current[arrayInfo.name][arrayInfo.index]=parsed||{}
}
current=current[arrayInfo.name][arrayInfo.index]}else{if(!current[k]||typeof current[k]!=='object')current[k]={}
current=current[k]}}
const arrayInfo=parseArrayKey(lastKey)
if(arrayInfo){if(!Array.isArray(current[arrayInfo.name]))current[arrayInfo.name]=[]
current[arrayInfo.name][arrayInfo.index]=finalValue}else{current[lastKey]=finalValue}}else c.body[key]=finalValue}`;
      }
    }
  },
  async stop(app2, closeActiveConnections) {
    var _a3;
    if (!app2.server)
      throw new Error(
        "Elysia isn't running. Call `app.listen` to start the server."
      );
    if (app2.server && (await app2.server.stop(closeActiveConnections), app2.server = null, (_a3 = app2.event.stop) == null ? void 0 : _a3.length))
      for (let i = 0; i < app2.event.stop.length; i++)
        app2.event.stop[i].fn(app2);
  },
  composeGeneralHandler: {
    parameters: "r",
    createContext(app2) {
      var _a3, _b2;
      let decoratorsLiteral = "", fnLiteral = "";
      const defaultHeaders = app2.setHeaders;
      for (const key of Object.keys(app2.decorator))
        decoratorsLiteral += `,'${key}':decorator['${key}']`;
      const standardHostname = ((_a3 = app2.config.handler) == null ? void 0 : _a3.standardHostname) ?? true, hasTrace = !!((_b2 = app2.event.trace) == null ? void 0 : _b2.length);
      return fnLiteral += `const u=r.url,s=u.indexOf('/',${standardHostname ? 11 : 7}),qi=u.indexOf('?',s+1),p=u.substring(s,qi===-1?undefined:qi)
`, hasTrace && (fnLiteral += `const id=randomId()
`), fnLiteral += "const c={request:r,store,qi,path:p,url:u,redirect,status,set:{headers:", fnLiteral += Object.keys(defaultHeaders ?? {}).length ? "Object.assign({},app.setHeaders)" : "Object.create(null)", fnLiteral += ",status:200}", app2.inference.server && (fnLiteral += ",get server(){return app.getServer()}"), hasTrace && (fnLiteral += ",[ELYSIA_REQUEST_ID]:id"), fnLiteral += decoratorsLiteral, fnLiteral += `}
`, fnLiteral;
    },
    error404(hasEventHook, hasErrorHook, afterHandle = "") {
      let findDynamicRoute = "if(route===null){" + afterHandle + (hasErrorHook ? "" : "c.set.status=404") + `
return `;
      return hasErrorHook ? findDynamicRoute += `app.handleError(c,notFound,false,${this.parameters})` : findDynamicRoute += hasEventHook ? "c.response=c.responseValue=new Response(error404Message,{status:c.set.status===200?404:c.set.status,headers:c.set.headers})" : "c.response=c.responseValue=error404.clone()", findDynamicRoute += "}", {
        declare: hasErrorHook ? "" : `const error404Message=notFound.message.toString()
const error404=new Response(error404Message,{status:404})
`,
        code: findDynamicRoute
      };
    }
  },
  composeError: {
    mapResponseContext: "",
    validationError: "set.headers['content-type']='application/json';return mapResponse(error.message,set)",
    unknownError: "set.status=error.status??set.status??500;return mapResponse(error.message,set)"
  },
  listen() {
    return () => {
      throw new Error(
        "WebStandard does not support listen, you might want to export default Elysia.fetch instead"
      );
    };
  }
};
const mapResponse$1 = (response, set2, request) => {
  var _a3;
  if (isNotEmpty(set2.headers) || set2.status !== 200 || set2.cookie)
    switch (handleSet(set2), (_a3 = response == null ? void 0 : response.constructor) == null ? void 0 : _a3.name) {
      case "String":
        return new Response(response, set2);
      case "Array":
      case "Object":
        return Response.json(response, set2);
      case "ElysiaFile":
        return handleFile$1(response.value, set2, request);
      case "File":
        return handleFile$1(response, set2, request);
      case "Blob":
        return handleFile$1(response, set2, request);
      case "ElysiaCustomStatusResponse":
        return set2.status = response.code, mapResponse$1(
          response.response,
          set2,
          request
        );
      case void 0:
        return response ? Response.json(response, set2) : new Response("", set2);
      case "Response":
        return handleResponse$1(response, set2, request);
      case "Error":
        return errorToResponse$1(response, set2);
      case "Promise":
        return response.then(
          (x) => mapResponse$1(x, set2, request)
        );
      case "Function":
        return mapResponse$1(response(), set2, request);
      case "Number":
      case "Boolean":
        return new Response(
          response.toString(),
          set2
        );
      case "Cookie":
        return response instanceof Cookie ? new Response(response.value, set2) : new Response(response == null ? void 0 : response.toString(), set2);
      case "FormData":
        return new Response(response, set2);
      default:
        if (response instanceof Response)
          return handleResponse$1(response, set2, request);
        if (response instanceof Promise)
          return response.then((x) => mapResponse$1(x, set2));
        if (response instanceof Error)
          return errorToResponse$1(response, set2);
        if (response instanceof ElysiaCustomStatusResponse)
          return set2.status = response.code, mapResponse$1(
            response.response,
            set2,
            request
          );
        if (
          // @ts-expect-error
          typeof (response == null ? void 0 : response.next) == "function" || response instanceof ReadableStream
        )
          return handleStream$1(response, set2, request);
        if (typeof (response == null ? void 0 : response.then) == "function")
          return response.then(
            (x) => mapResponse$1(x, set2)
          );
        if (Array.isArray(response))
          return Response.json(response);
        if (typeof (response == null ? void 0 : response.toResponse) == "function")
          return mapResponse$1(response.toResponse(), set2);
        if ("charCodeAt" in response) {
          const code = response.charCodeAt(0);
          if (code === 123 || code === 91)
            return Response.json(response, set2);
        }
        return new Response(response, set2);
    }
  return (
    // @ts-expect-error
    typeof (response == null ? void 0 : response.next) == "function" || response instanceof ReadableStream ? handleStream$1(response, set2, request) : mapCompactResponse$1(response, request)
  );
}, mapEarlyResponse$1 = (response, set2, request) => {
  var _a3, _b2;
  if (response != null)
    if (isNotEmpty(set2.headers) || set2.status !== 200 || set2.cookie)
      switch (handleSet(set2), (_a3 = response == null ? void 0 : response.constructor) == null ? void 0 : _a3.name) {
        case "String":
          return new Response(response, set2);
        case "Array":
        case "Object":
          return Response.json(response, set2);
        case "ElysiaFile":
          return handleFile$1(response.value, set2, request);
        case "File":
          return handleFile$1(response, set2, request);
        case "Blob":
          return handleFile$1(response, set2, request);
        case "ElysiaCustomStatusResponse":
          return set2.status = response.code, mapEarlyResponse$1(
            response.response,
            set2,
            request
          );
        case void 0:
          return response ? Response.json(response, set2) : void 0;
        case "Response":
          return handleResponse$1(response, set2, request);
        case "Promise":
          return response.then(
            (x) => mapEarlyResponse$1(x, set2)
          );
        case "Error":
          return errorToResponse$1(response, set2);
        case "Function":
          return mapEarlyResponse$1(response(), set2);
        case "Number":
        case "Boolean":
          return new Response(
            response.toString(),
            set2
          );
        case "FormData":
          return new Response(response);
        case "Cookie":
          return response instanceof Cookie ? new Response(response.value, set2) : new Response(response == null ? void 0 : response.toString(), set2);
        default:
          if (response instanceof Response)
            return handleResponse$1(response, set2, request);
          if (response instanceof Promise)
            return response.then((x) => mapEarlyResponse$1(x, set2));
          if (response instanceof Error)
            return errorToResponse$1(response, set2);
          if (response instanceof ElysiaCustomStatusResponse)
            return set2.status = response.code, mapEarlyResponse$1(
              response.response,
              set2,
              request
            );
          if (
            // @ts-expect-error
            typeof (response == null ? void 0 : response.next) == "function" || response instanceof ReadableStream
          )
            return handleStream$1(response, set2, request);
          if (typeof (response == null ? void 0 : response.then) == "function")
            return response.then(
              (x) => mapEarlyResponse$1(x, set2)
            );
          if (typeof (response == null ? void 0 : response.toResponse) == "function")
            return mapEarlyResponse$1(response.toResponse(), set2);
          if (Array.isArray(response))
            return Response.json(response);
          if ("charCodeAt" in response) {
            const code = response.charCodeAt(0);
            if (code === 123 || code === 91)
              return Response.json(response, set2);
          }
          return new Response(response, set2);
      }
    else
      switch ((_b2 = response == null ? void 0 : response.constructor) == null ? void 0 : _b2.name) {
        case "String":
          return new Response(response);
        case "Array":
        case "Object":
          return Response.json(response, set2);
        case "ElysiaFile":
          return handleFile$1(response.value, set2, request);
        case "File":
          return handleFile$1(response, set2, request);
        case "Blob":
          return handleFile$1(response, set2, request);
        case "ElysiaCustomStatusResponse":
          return set2.status = response.code, mapEarlyResponse$1(
            response.response,
            set2,
            request
          );
        case void 0:
          return response ? Response.json(response) : new Response("");
        case "Response":
          return response;
        case "Promise":
          return response.then((x) => {
            const r = mapEarlyResponse$1(x, set2);
            if (r !== void 0) return r;
          });
        case "Error":
          return errorToResponse$1(response, set2);
        case "Function":
          return mapCompactResponse$1(response(), request);
        case "Number":
        case "Boolean":
          return new Response(response.toString());
        case "Cookie":
          return response instanceof Cookie ? new Response(response.value, set2) : new Response(response == null ? void 0 : response.toString(), set2);
        case "FormData":
          return new Response(response);
        default:
          if (response instanceof Response) return response;
          if (response instanceof Promise)
            return response.then((x) => mapEarlyResponse$1(x, set2));
          if (response instanceof Error)
            return errorToResponse$1(response, set2);
          if (response instanceof ElysiaCustomStatusResponse)
            return set2.status = response.code, mapEarlyResponse$1(
              response.response,
              set2,
              request
            );
          if (
            // @ts-expect-error
            typeof (response == null ? void 0 : response.next) == "function" || response instanceof ReadableStream
          )
            return handleStream$1(response, set2, request);
          if (typeof (response == null ? void 0 : response.then) == "function")
            return response.then(
              (x) => mapEarlyResponse$1(x, set2)
            );
          if (typeof (response == null ? void 0 : response.toResponse) == "function")
            return mapEarlyResponse$1(response.toResponse(), set2);
          if (Array.isArray(response))
            return Response.json(response);
          if ("charCodeAt" in response) {
            const code = response.charCodeAt(0);
            if (code === 123 || code === 91)
              return Response.json(response, set2);
          }
          return new Response(response);
      }
}, mapCompactResponse$1 = (response, request) => {
  var _a3;
  switch ((_a3 = response == null ? void 0 : response.constructor) == null ? void 0 : _a3.name) {
    case "String":
      return new Response(response);
    case "Object":
    case "Array":
      return Response.json(response);
    case "ElysiaFile":
      return handleFile$1(response.value, void 0, request);
    case "File":
      return handleFile$1(response, void 0, request);
    case "Blob":
      return handleFile$1(response, void 0, request);
    case "ElysiaCustomStatusResponse":
      return mapResponse$1(
        response.response,
        {
          status: response.code,
          headers: {}
        }
      );
    case void 0:
      return response ? Response.json(response) : new Response("");
    case "Response":
      return response;
    case "Error":
      return errorToResponse$1(response);
    case "Promise":
      return response.then(
        (x) => mapCompactResponse$1(x, request)
      );
    case "Function":
      return mapCompactResponse$1(response(), request);
    case "Number":
    case "Boolean":
      return new Response(response.toString());
    case "FormData":
      return new Response(response);
    default:
      if (response instanceof Response) return response;
      if (response instanceof Promise)
        return response.then(
          (x) => mapCompactResponse$1(x, request)
        );
      if (response instanceof Error)
        return errorToResponse$1(response);
      if (response instanceof ElysiaCustomStatusResponse)
        return mapResponse$1(
          response.response,
          {
            status: response.code,
            headers: {}
          }
        );
      if (
        // @ts-expect-error
        typeof (response == null ? void 0 : response.next) == "function" || response instanceof ReadableStream
      )
        return handleStream$1(response, void 0, request);
      if (typeof (response == null ? void 0 : response.then) == "function")
        return response.then(
          (x) => mapCompactResponse$1(x, request)
        );
      if (typeof (response == null ? void 0 : response.toResponse) == "function")
        return mapCompactResponse$1(response.toResponse());
      if (Array.isArray(response)) return Response.json(response);
      if ("charCodeAt" in response) {
        const code = response.charCodeAt(0);
        if (code === 123 || code === 91)
          return Response.json(response);
      }
      return new Response(response);
  }
}, errorToResponse$1 = (error, set2) => {
  if (typeof (error == null ? void 0 : error.toResponse) == "function") {
    const raw = error.toResponse(), targetSet = set2 ?? { headers: {}, status: 200, redirect: "" }, apply2 = (resolved) => (resolved instanceof Response && (targetSet.status = resolved.status), mapResponse$1(resolved, targetSet));
    return typeof (raw == null ? void 0 : raw.then) == "function" ? raw.then(apply2) : apply2(raw);
  }
  return Response.json(
    {
      name: error == null ? void 0 : error.name,
      message: error == null ? void 0 : error.message,
      cause: error == null ? void 0 : error.cause
    },
    {
      status: (set2 == null ? void 0 : set2.status) !== 200 ? (set2 == null ? void 0 : set2.status) ?? 500 : 500,
      headers: set2 == null ? void 0 : set2.headers
    }
  );
}, createStaticHandler$1 = (handle, hooks, setHeaders = {}) => {
  var _a3, _b2, _c3, _d2;
  if (typeof handle == "function") return;
  const response = mapResponse$1(handle, {
    headers: setHeaders
  });
  if (!((_a3 = hooks.parse) == null ? void 0 : _a3.length) && !((_b2 = hooks.transform) == null ? void 0 : _b2.length) && !((_c3 = hooks.beforeHandle) == null ? void 0 : _c3.length) && !((_d2 = hooks.afterHandle) == null ? void 0 : _d2.length))
    return () => response.clone();
}, handleResponse$1 = createResponseHandler$1({
  mapResponse: mapResponse$1,
  mapCompactResponse: mapCompactResponse$1
}), handleStream$1 = createStreamHandler({
  mapResponse: mapResponse$1,
  mapCompactResponse: mapCompactResponse$1
});
const KEY_HAS_PLUS = 1, KEY_NEEDS_DECODE = 2, VALUE_HAS_PLUS = 4, VALUE_NEEDS_DECODE = 8;
function parseQueryFromURL(input, startIndex = 0, array, object) {
  const result = /* @__PURE__ */ Object.create(null);
  let flags = 0;
  const inputLength = input.length;
  let startingIndex = startIndex - 1, equalityIndex = startingIndex;
  for (let i = 0; i < inputLength; i++)
    switch (input.charCodeAt(i)) {
      case 38:
        processKeyValuePair(input, i), startingIndex = i, equalityIndex = i, flags = 0;
        break;
      case 61:
        equalityIndex <= startingIndex ? equalityIndex = i : flags |= VALUE_NEEDS_DECODE;
        break;
      case 43:
        equalityIndex > startingIndex ? flags |= VALUE_HAS_PLUS : flags |= KEY_HAS_PLUS;
        break;
      case 37:
        equalityIndex > startingIndex ? flags |= VALUE_NEEDS_DECODE : flags |= KEY_NEEDS_DECODE;
        break;
    }
  return startingIndex < inputLength && processKeyValuePair(input, inputLength), result;
  function processKeyValuePair(input2, endIndex2) {
    const hasBothKeyValuePair = equalityIndex > startingIndex, effectiveEqualityIndex = hasBothKeyValuePair ? equalityIndex : endIndex2, keySlice = input2.slice(startingIndex + 1, effectiveEqualityIndex);
    if (!hasBothKeyValuePair && keySlice.length === 0) return;
    let finalKey = keySlice;
    flags & KEY_HAS_PLUS && (finalKey = finalKey.replace(/\+/g, " ")), flags & KEY_NEEDS_DECODE && (finalKey = fastDecodeURIComponent(finalKey) || finalKey);
    let finalValue = "";
    if (hasBothKeyValuePair) {
      let valueSlice2 = input2.slice(equalityIndex + 1, endIndex2);
      flags & VALUE_HAS_PLUS && (valueSlice2 = valueSlice2.replace(/\+/g, " ")), flags & VALUE_NEEDS_DECODE && (valueSlice2 = fastDecodeURIComponent(valueSlice2) || valueSlice2), finalValue = valueSlice2;
    }
    const currentValue = result[finalKey];
    array && (array == null ? void 0 : array[finalKey]) ? finalValue.charCodeAt(0) === 91 ? (object && (object == null ? void 0 : object[finalKey]) ? finalValue = JSON.parse(finalValue) : finalValue = finalValue.slice(1, -1).split(","), currentValue === void 0 ? result[finalKey] = finalValue : Array.isArray(currentValue) ? currentValue.push(...finalValue) : (result[finalKey] = finalValue, result[finalKey].unshift(currentValue))) : currentValue === void 0 ? result[finalKey] = finalValue : Array.isArray(currentValue) ? currentValue.push(finalValue) : result[finalKey] = [currentValue, finalValue] : result[finalKey] = finalValue;
  }
}
function parseQueryStandardSchema(input, startIndex = 0) {
  const result = /* @__PURE__ */ Object.create(null);
  let flags = 0;
  const inputLength = input.length;
  let startingIndex = startIndex - 1, equalityIndex = startingIndex;
  for (let i = 0; i < inputLength; i++)
    switch (input.charCodeAt(i)) {
      case 38:
        processKeyValuePair(input, i), startingIndex = i, equalityIndex = i, flags = 0;
        break;
      case 61:
        equalityIndex <= startingIndex ? equalityIndex = i : flags |= VALUE_NEEDS_DECODE;
        break;
      case 43:
        equalityIndex > startingIndex ? flags |= VALUE_HAS_PLUS : flags |= KEY_HAS_PLUS;
        break;
      case 37:
        equalityIndex > startingIndex ? flags |= VALUE_NEEDS_DECODE : flags |= KEY_NEEDS_DECODE;
        break;
    }
  return startingIndex < inputLength && processKeyValuePair(input, inputLength), result;
  function processKeyValuePair(input2, endIndex2) {
    const hasBothKeyValuePair = equalityIndex > startingIndex, effectiveEqualityIndex = hasBothKeyValuePair ? equalityIndex : endIndex2, keySlice = input2.slice(startingIndex + 1, effectiveEqualityIndex);
    if (!hasBothKeyValuePair && keySlice.length === 0) return;
    let finalKey = keySlice;
    flags & KEY_HAS_PLUS && (finalKey = finalKey.replace(/\+/g, " ")), flags & KEY_NEEDS_DECODE && (finalKey = fastDecodeURIComponent(finalKey) || finalKey);
    let finalValue = "";
    if (hasBothKeyValuePair) {
      let valueSlice2 = input2.slice(equalityIndex + 1, endIndex2);
      flags & VALUE_HAS_PLUS && (valueSlice2 = valueSlice2.replace(/\+/g, " ")), flags & VALUE_NEEDS_DECODE && (valueSlice2 = fastDecodeURIComponent(valueSlice2) || valueSlice2), finalValue = valueSlice2;
    }
    const currentValue = result[finalKey];
    if (finalValue.charCodeAt(0) === 91 && finalValue.charCodeAt(finalValue.length - 1) === 93) {
      try {
        finalValue = JSON.parse(finalValue);
      } catch {
      }
      currentValue === void 0 ? result[finalKey] = finalValue : Array.isArray(currentValue) ? currentValue.push(finalValue) : result[finalKey] = [currentValue, finalValue];
    } else if (finalValue.charCodeAt(0) === 123 && finalValue.charCodeAt(finalValue.length - 1) === 125) {
      try {
        finalValue = JSON.parse(finalValue);
      } catch {
      }
      currentValue === void 0 ? result[finalKey] = finalValue : Array.isArray(currentValue) ? currentValue.push(finalValue) : result[finalKey] = [currentValue, finalValue];
    } else
      finalValue.includes(",") && (finalValue = finalValue.split(",")), currentValue === void 0 ? result[finalKey] = finalValue : Array.isArray(currentValue) ? currentValue.push(finalValue) : result[finalKey] = [currentValue, finalValue];
  }
}
function parseQuery(input) {
  const result = /* @__PURE__ */ Object.create(null);
  let flags = 0;
  const inputLength = input.length;
  let startingIndex = -1, equalityIndex = -1;
  for (let i = 0; i < inputLength; i++)
    switch (input.charCodeAt(i)) {
      case 38:
        processKeyValuePair(input, i), startingIndex = i, equalityIndex = i, flags = 0;
        break;
      case 61:
        equalityIndex <= startingIndex ? equalityIndex = i : flags |= VALUE_NEEDS_DECODE;
        break;
      case 43:
        equalityIndex > startingIndex ? flags |= VALUE_HAS_PLUS : flags |= KEY_HAS_PLUS;
        break;
      case 37:
        equalityIndex > startingIndex ? flags |= VALUE_NEEDS_DECODE : flags |= KEY_NEEDS_DECODE;
        break;
    }
  return startingIndex < inputLength && processKeyValuePair(input, inputLength), result;
  function processKeyValuePair(input2, endIndex2) {
    const hasBothKeyValuePair = equalityIndex > startingIndex, effectiveEqualityIndex = hasBothKeyValuePair ? equalityIndex : endIndex2, keySlice = input2.slice(startingIndex + 1, effectiveEqualityIndex);
    if (!hasBothKeyValuePair && keySlice.length === 0) return;
    let finalKey = keySlice;
    flags & KEY_HAS_PLUS && (finalKey = finalKey.replace(/\+/g, " ")), flags & KEY_NEEDS_DECODE && (finalKey = fastDecodeURIComponent(finalKey) || finalKey);
    let finalValue = "";
    if (hasBothKeyValuePair) {
      let valueSlice2 = input2.slice(equalityIndex + 1, endIndex2);
      flags & VALUE_HAS_PLUS && (valueSlice2 = valueSlice2.replace(/\+/g, " ")), flags & VALUE_NEEDS_DECODE && (valueSlice2 = fastDecodeURIComponent(valueSlice2) || valueSlice2), finalValue = valueSlice2;
    }
    const currentValue = result[finalKey];
    currentValue === void 0 ? result[finalKey] = finalValue : Array.isArray(currentValue) ? currentValue.push(finalValue) : result[finalKey] = [currentValue, finalValue];
  }
}
const ELYSIA_TRACE = Symbol("ElysiaTrace"), createProcess = () => {
  const { promise, resolve } = Promise.withResolvers(), { promise: end, resolve: resolveEnd } = Promise.withResolvers(), { promise: error, resolve: resolveError } = Promise.withResolvers(), callbacks = [], callbacksEnd = [];
  return [
    (callback) => (callback && callbacks.push(callback), promise),
    (process2) => {
      const processes = [], resolvers = [];
      let groupError = null;
      for (let i = 0; i < (process2.total ?? 0); i++) {
        const { promise: promise2, resolve: resolve2 } = Promise.withResolvers(), { promise: end2, resolve: resolveEnd2 } = Promise.withResolvers(), { promise: error2, resolve: resolveError2 } = Promise.withResolvers(), callbacks2 = [], callbacksEnd2 = [];
        processes.push((callback) => (callback && callbacks2.push(callback), promise2)), resolvers.push((process22) => {
          const result2 = {
            ...process22,
            end: end2,
            error: error2,
            index: i,
            onStop(callback) {
              return callback && callbacksEnd2.push(callback), end2;
            }
          };
          resolve2(result2);
          for (let i2 = 0; i2 < callbacks2.length; i2++)
            callbacks2[i2](result2);
          return (error3 = null) => {
            const end3 = performance.now();
            error3 && (groupError = error3);
            const detail = {
              end: end3,
              error: error3,
              get elapsed() {
                return end3 - process22.begin;
              }
            };
            for (let i2 = 0; i2 < callbacksEnd2.length; i2++)
              callbacksEnd2[i2](detail);
            resolveEnd2(end3), resolveError2(error3);
          };
        });
      }
      const result = {
        ...process2,
        end,
        error,
        onEvent(callback) {
          for (let i = 0; i < processes.length; i++)
            processes[i](callback);
        },
        onStop(callback) {
          return callback && callbacksEnd.push(callback), end;
        }
      };
      resolve(result);
      for (let i = 0; i < callbacks.length; i++) callbacks[i](result);
      return {
        resolveChild: resolvers,
        resolve(error2 = null) {
          const end2 = performance.now();
          !error2 && groupError && (error2 = groupError);
          const detail = {
            end: end2,
            error: error2,
            get elapsed() {
              return end2 - process2.begin;
            }
          };
          for (let i = 0; i < callbacksEnd.length; i++)
            callbacksEnd[i](detail);
          resolveEnd(end2), resolveError(error2);
        }
      };
    }
  ];
}, createTracer = (traceListener) => (context) => {
  const [onRequest, resolveRequest] = createProcess(), [onParse, resolveParse] = createProcess(), [onTransform, resolveTransform] = createProcess(), [onBeforeHandle, resolveBeforeHandle] = createProcess(), [onHandle, resolveHandle] = createProcess(), [onAfterHandle, resolveAfterHandle] = createProcess(), [onError, resolveError] = createProcess(), [onMapResponse, resolveMapResponse] = createProcess(), [onAfterResponse, resolveAfterResponse] = createProcess();
  return traceListener({
    // @ts-ignore
    id: context[ELYSIA_REQUEST_ID],
    context,
    set: context.set,
    // @ts-ignore
    onRequest,
    // @ts-ignore
    onParse,
    // @ts-ignore
    onTransform,
    // @ts-ignore
    onBeforeHandle,
    // @ts-ignore
    onHandle,
    // @ts-ignore
    onAfterHandle,
    // @ts-ignore
    onMapResponse,
    // @ts-ignore
    onAfterResponse,
    // @ts-ignore
    onError,
    time: Date.now(),
    store: context.store
  }), {
    request: resolveRequest,
    parse: resolveParse,
    transform: resolveTransform,
    beforeHandle: resolveBeforeHandle,
    handle: resolveHandle,
    afterHandle: resolveAfterHandle,
    error: resolveError,
    mapResponse: resolveMapResponse,
    afterResponse: resolveAfterResponse
  };
};
var Kind = Symbol.for("TypeBox.Kind");
var Hint = Symbol.for("TypeBox.Hint");
var isSpecialProperty = (name) => /(\ |-|\t|\n|\.|\[|\]|\{|\})/.test(name) || !isNaN(+name[0]);
var joinProperty = (v1, v2, isOptional2 = false) => {
  if (typeof v2 === "number") return `${v1}[${v2}]`;
  if (isSpecialProperty(v2)) return `${v1}${isOptional2 ? "?." : ""}["${v2}"]`;
  return `${v1}${isOptional2 ? "?" : ""}.${v2}`;
};
var encodeProperty = (v) => isSpecialProperty(v) ? `"${v}"` : v;
var sanitize = (key, sanitize2 = 0, schema) => {
  if (schema.type !== "string" || schema.const || schema.trusted) return key;
  let hof = "";
  for (let i = sanitize2 - 1; i >= 0; i--) hof += `d.h${i}(`;
  return hof + key + ")".repeat(sanitize2);
};
var mergeObjectIntersection = (schema) => {
  if (!schema.allOf || Kind in schema && (schema[Kind] !== "Intersect" || schema.type !== "object"))
    return schema;
  const { allOf, ...newSchema } = schema;
  newSchema.properties = {};
  if (Kind in newSchema) newSchema[Kind] = "Object";
  for (const type of allOf) {
    if (type.type !== "object") continue;
    const { properties, required, type: _, [Kind]: __, ...rest } = type;
    if (required)
      newSchema.required = newSchema.required ? newSchema.required.concat(required) : required;
    Object.assign(newSchema, rest);
    for (const property in type.properties)
      newSchema.properties[property] = mergeObjectIntersection(
        type.properties[property]
      );
  }
  return newSchema;
};
var handleRecord = (schema, property, instruction) => {
  const child = schema.patternProperties["^(.*)$"] ?? schema.patternProperties[Object.keys(schema.patternProperties)[0]];
  if (!child) return property;
  const i = instruction.array;
  instruction.array++;
  let v = `(()=>{const ar${i}s=Object.keys(${property}),ar${i}v={};for(let i=0;i<ar${i}s.length;i++){const ar${i}p=${property}[ar${i}s[i]];ar${i}v[ar${i}s[i]]=${mirror(child, `ar${i}p`, instruction)}`;
  const optionals = instruction.optionalsInArray[i + 1];
  if (optionals) {
    for (let oi = 0; oi < optionals.length; oi++) {
      const target = `ar${i}v[ar${i}s[i]]${optionals[oi]}`;
      v += `;if(${target}===undefined)delete ${target}`;
    }
    instruction.optionalsInArray[i + 1] = [];
  }
  v += `}return ar${i}v})()`;
  return v;
};
var handleTuple = (schema, property, instruction) => {
  const i = instruction.array;
  instruction.array++;
  const isRoot = property === "v" && !instruction.unions.length;
  let v = "";
  if (!isRoot) v = `(()=>{`;
  v += `const ar${i}v=[`;
  for (let i2 = 0; i2 < schema.length; i2++) {
    if (i2 !== 0) v += ",";
    v += mirror(
      schema[i2],
      joinProperty(
        property,
        i2,
        instruction.parentIsOptional || instruction.fromUnion
      ),
      instruction
    );
  }
  v += `];`;
  if (!isRoot) v += `return ar${i}v})()`;
  return v;
};
function deepClone(source, weak = /* @__PURE__ */ new WeakMap()) {
  if (source === null || typeof source !== "object" || typeof source === "function")
    return source;
  if (weak.has(source)) return weak.get(source);
  if (Array.isArray(source)) {
    const copy = new Array(source.length);
    weak.set(source, copy);
    for (let i = 0; i < source.length; i++)
      copy[i] = deepClone(source[i], weak);
    return copy;
  }
  if (typeof source === "object") {
    const keys = Object.keys(source).concat(
      Object.getOwnPropertySymbols(source)
    );
    const cloned = {};
    for (const key of keys)
      cloned[key] = deepClone(source[key], weak);
    return cloned;
  }
  return source;
}
var handleUnion = (schemas, property, instruction) => {
  if (instruction.TypeCompiler === void 0) {
    if (!instruction.typeCompilerWanred) {
      console.warn(
        new Error(
          "[exact-mirror] TypeBox's TypeCompiler is required to use Union"
        )
      );
      instruction.typeCompilerWanred = true;
    }
    return property;
  }
  instruction.unionKeys[property] = 1;
  const ui = instruction.unions.length;
  const typeChecks = instruction.unions[ui] = [];
  let v = `(()=>{
`;
  const unwrapRef = (type) => {
    if (!(Kind in type) || !type.$ref) return type;
    if (type[Kind] === "This") {
      return deepClone(instruction.definitions[type.$ref]);
    } else if (type[Kind] === "Ref") {
      if (!instruction.modules)
        console.warn(
          new Error(
            "[exact-mirror] modules is required when using nested cyclic reference"
          )
        );
      else
        return instruction.modules.Import(
          type.$ref
        );
    }
    return type;
  };
  let cleanThenCheck = "";
  for (let i = 0; i < schemas.length; i++) {
    let type = unwrapRef(schemas[i]);
    if (Array.isArray(type.anyOf))
      for (let i2 = 0; i2 < type.anyOf.length; i2++)
        type.anyOf[i2] = unwrapRef(type.anyOf[i2]);
    else if (type.items) {
      if (Array.isArray(type.items))
        for (let i2 = 0; i2 < type.items.length; i2++)
          type.items[i2] = unwrapRef(type.items[i2]);
      else type.items = unwrapRef(type.items);
    }
    typeChecks.push(TypeCompiler.Compile(type));
    v += `if(d.unions[${ui}][${i}].Check(${property})){return ${mirror(
      type,
      property,
      {
        ...instruction,
        recursion: instruction.recursion + 1,
        parentIsOptional: true,
        fromUnion: true
      }
    )}}
`;
    cleanThenCheck += (i ? "" : "let ") + "tmp=" + mirror(type, property, {
      ...instruction,
      recursion: instruction.recursion + 1,
      parentIsOptional: true,
      fromUnion: true
    }) + `
if(d.unions[${ui}][${i}].Check(tmp))return tmp
`;
  }
  if (cleanThenCheck) v += cleanThenCheck;
  v += `return ${instruction.removeUnknownUnionType ? "undefined" : property}`;
  return v + `})()`;
};
var mirror = (schema, property, instruction) => {
  var _a3, _b2;
  if (!schema) return "";
  const isRoot = property === "v" && !instruction.unions.length;
  if (Kind in schema && schema[Kind] === "Import" && schema.$ref in schema.$defs)
    return mirror(schema.$defs[schema.$ref], property, {
      ...instruction,
      definitions: Object.assign(instruction.definitions, schema.$defs)
    });
  if (isRoot && schema.type !== "object" && schema.type !== "array" && !schema.anyOf)
    return `return ${sanitize("v", (_a3 = instruction.sanitize) == null ? void 0 : _a3.length, schema)}`;
  if (instruction.recursion >= instruction.recursionLimit) return property;
  let v = "";
  if (schema.$id && Hint in schema)
    instruction.definitions[schema.$id] = schema;
  switch (schema.type) {
    case "object":
      if (schema[Kind] === "Record") {
        v = handleRecord(schema, property, instruction);
        break;
      }
      schema = mergeObjectIntersection(schema);
      v += "{";
      if (schema.additionalProperties) v += `...${property},`;
      const keys = Object.keys(schema.properties);
      for (let i2 = 0; i2 < keys.length; i2++) {
        const key = keys[i2];
        let isOptional2 = (
          // all fields are optional
          !schema.required || // field is explicitly required
          schema.required && !schema.required.includes(key) || Array.isArray(schema.properties[key].anyOf)
        );
        const name = joinProperty(
          property,
          key,
          // If parent is a union, any property could be undefined
          instruction.parentIsOptional || instruction.fromUnion
        );
        if (isOptional2) {
          const index = instruction.array;
          if (property.startsWith("ar")) {
            const dotIndex = name.indexOf(".");
            let refName;
            if (dotIndex >= 0) {
              refName = name.slice(dotIndex);
            } else {
              refName = name.slice(property.length);
            }
            if (refName.startsWith("?.")) {
              if (refName.charAt(2) === "[") {
                refName = refName.slice(2);
              } else {
                refName = refName.slice(1);
              }
            }
            const array = instruction.optionalsInArray;
            if (array[index]) {
              array[index].push(refName);
            } else {
              array[index] = [refName];
            }
          } else {
            instruction.optionals.push(name);
          }
        }
        const child = schema.properties[key];
        if (i2 !== 0) v += ",";
        v += `${encodeProperty(key)}:${isOptional2 ? `${name}===undefined?undefined:` : ""}${mirror(
          child,
          name,
          {
            ...instruction,
            recursion: instruction.recursion + 1,
            parentIsOptional: isOptional2
          }
        )}`;
      }
      v += "}";
      break;
    case "array":
      if (schema.items.type !== "object" && schema.items.type !== "array") {
        if (Array.isArray(schema.items)) {
          v = handleTuple(schema.items, property, instruction);
          break;
        } else if (isRoot && !Array.isArray(schema.items.anyOf))
          return "return v";
        else if (Kind in schema.items && schema.items.$ref && (schema.items[Kind] === "Ref" || schema.items[Kind] === "This"))
          v = mirror(
            deepClone(instruction.definitions[schema.items.$ref]),
            property,
            {
              ...instruction,
              parentIsOptional: true,
              recursion: instruction.recursion + 1
            }
          );
        else if (!Array.isArray(schema.items.anyOf)) {
          v = property;
          break;
        }
      }
      const i = instruction.array;
      instruction.array++;
      let reference = property;
      if (isRoot) v = `const ar${i}v=new Array(${property}.length);`;
      else {
        reference = `ar${i}s`;
        v = `((${reference})=>{const ar${i}v=new Array(${reference}.length);`;
      }
      v += `for(let i=0;i<${reference}.length;i++){const ar${i}p=${reference}[i];ar${i}v[i]=${mirror(schema.items, `ar${i}p`, instruction)}`;
      const optionals = instruction.optionalsInArray[i + 1];
      if (optionals) {
        for (let oi = 0; oi < optionals.length; oi++) {
          const target = `ar${i}v[i]${optionals[oi]}`;
          v += `;if(${target}===undefined)delete ${target}`;
        }
        instruction.optionalsInArray[i + 1] = [];
      }
      v += `}`;
      if (!isRoot) v += `return ar${i}v})(${property})`;
      break;
    default:
      if (schema.$ref && schema.$ref in instruction.definitions)
        return mirror(
          instruction.definitions[schema.$ref],
          property,
          instruction
        );
      if (Array.isArray(schema.anyOf)) {
        v = handleUnion(schema.anyOf, property, instruction);
        break;
      }
      v = sanitize(property, (_b2 = instruction.sanitize) == null ? void 0 : _b2.length, schema);
      break;
  }
  if (!isRoot) return v;
  if (schema.type === "array") {
    v = `${v}const x=ar0v;`;
  } else {
    v = `const x=${v}
`;
  }
  for (let i = 0; i < instruction.optionals.length; i++) {
    const key = instruction.optionals[i];
    const prop = key.slice(1);
    v += `if(${key}===undefined`;
    if (instruction.unionKeys[key]) v += `||x${prop}===undefined`;
    const shouldQuestion = prop.charCodeAt(0) !== 63 && schema.type !== "array";
    v += `)delete x${shouldQuestion ? prop.charCodeAt(0) === 91 ? "?." : "?" : ""}${prop}
`;
  }
  return `${v}return x`;
};
var createMirror = (schema, {
  TypeCompiler: TypeCompiler2,
  modules,
  definitions,
  sanitize: sanitize2,
  recursionLimit = 8,
  removeUnknownUnionType = false
} = {}) => {
  const unions = [];
  if (typeof sanitize2 === "function") sanitize2 = [sanitize2];
  const f = mirror(schema, "v", {
    optionals: [],
    optionalsInArray: [],
    array: 0,
    parentIsOptional: false,
    unions,
    unionKeys: {},
    TypeCompiler: TypeCompiler2,
    modules,
    // @ts-ignore private property
    definitions: definitions ?? (modules == null ? void 0 : modules.$defs) ?? {},
    sanitize: sanitize2,
    recursion: 0,
    recursionLimit,
    removeUnknownUnionType
  });
  if (!unions.length && !(sanitize2 == null ? void 0 : sanitize2.length)) return Function("v", f);
  let hof;
  if (sanitize2 == null ? void 0 : sanitize2.length) {
    hof = {};
    for (let i = 0; i < sanitize2.length; i++) hof[`h${i}`] = sanitize2[i];
  }
  return Function(
    "d",
    `return function mirror(v){${f}}`
  )({
    unions,
    ...hof
  });
};
const replaceSchemaTypeFromManyOptions = (schema, options) => {
  if (Array.isArray(options)) {
    let result = schema;
    for (const option of options)
      result = replaceSchemaTypeFromOption(result, option);
    return result;
  }
  return replaceSchemaTypeFromOption(schema, options);
}, replaceSchemaTypeFromOption = (schema, option) => {
  if (option.rootOnly && option.excludeRoot)
    throw new Error("Can't set both rootOnly and excludeRoot");
  if (option.rootOnly && option.onlyFirst)
    throw new Error("Can't set both rootOnly and onlyFirst");
  if (option.rootOnly && option.untilObjectFound)
    throw new Error("Can't set both rootOnly and untilObjectFound");
  const walk = ({ s, isRoot, treeLvl }) => {
    if (!s) return s;
    const skipRoot = isRoot && option.excludeRoot, fromKind = option.from[Kind$1];
    if (s.elysiaMeta)
      return option.from.elysiaMeta === s.elysiaMeta && !skipRoot ? option.to(s) : s;
    const shouldTransform = fromKind && s[Kind$1] === fromKind;
    if (!skipRoot && option.onlyFirst && s.type === option.onlyFirst || isRoot && option.rootOnly)
      return shouldTransform ? option.to(s) : s;
    if (!isRoot && option.untilObjectFound && s.type === "object")
      return s;
    const newWalkInput = { isRoot: false, treeLvl: treeLvl + 1 }, withTransformedChildren = { ...s };
    if (s.oneOf && (withTransformedChildren.oneOf = s.oneOf.map(
      (x) => walk({ ...newWalkInput, s: x })
    )), s.anyOf && (withTransformedChildren.anyOf = s.anyOf.map(
      (x) => walk({ ...newWalkInput, s: x })
    )), s.allOf && (withTransformedChildren.allOf = s.allOf.map(
      (x) => walk({ ...newWalkInput, s: x })
    )), s.not && (withTransformedChildren.not = walk({ ...newWalkInput, s: s.not })), s.properties) {
      withTransformedChildren.properties = {};
      for (const [k, v] of Object.entries(s.properties))
        withTransformedChildren.properties[k] = walk({
          ...newWalkInput,
          s: v
        });
    }
    if (s.items) {
      const items = s.items;
      withTransformedChildren.items = Array.isArray(items) ? items.map((x) => walk({ ...newWalkInput, s: x })) : walk({ ...newWalkInput, s: items });
    }
    return !skipRoot && fromKind && withTransformedChildren[Kind$1] === fromKind ? option.to(withTransformedChildren) : withTransformedChildren;
  };
  return walk({ s: schema, isRoot: true, treeLvl: 0 });
};
let _stringToStructureCoercions;
const stringToStructureCoercions = () => (_stringToStructureCoercions || (_stringToStructureCoercions = [
  {
    from: t.Object({}),
    to: (schema) => t.ObjectString(schema.properties || {}, schema),
    excludeRoot: true
  },
  {
    from: t.Array(t.Any()),
    to: (schema) => t.ArrayString(schema.items || t.Any(), schema)
  }
]), _stringToStructureCoercions);
let _queryCoercions;
const queryCoercions = () => (_queryCoercions || (_queryCoercions = [
  {
    from: t.Object({}),
    to: (schema) => t.ObjectString(schema.properties ?? {}, schema),
    excludeRoot: true
  },
  {
    from: t.Array(t.Any()),
    to: (schema) => t.ArrayQuery(schema.items ?? t.Any(), schema)
  }
]), _queryCoercions);
let _coercePrimitiveRoot;
const coercePrimitiveRoot = () => (_coercePrimitiveRoot || (_coercePrimitiveRoot = [
  {
    from: t.Number(),
    to: (schema) => t.Numeric(schema),
    rootOnly: true
  },
  {
    from: t.Boolean(),
    to: (schema) => t.BooleanString(schema),
    rootOnly: true
  }
]), _coercePrimitiveRoot);
let _coerceFormData;
const coerceFormData = () => (_coerceFormData || (_coerceFormData = [
  {
    from: t.Object({}),
    to: (schema) => t.ObjectString(schema.properties ?? {}, schema),
    onlyFirst: "object",
    excludeRoot: true
  },
  {
    from: t.Array(t.Any()),
    to: (schema) => t.ArrayString(schema.items ?? t.Any(), schema),
    onlyFirst: "array",
    excludeRoot: true
  }
]), _coerceFormData);
const isOptional = (schema) => schema ? (schema == null ? void 0 : schema[Kind$1]) === "Import" && schema.References ? schema.References().some(isOptional) : (schema.schema && (schema = schema.schema), !!schema && OptionalKind in schema) : false, hasAdditionalProperties = (_schema) => {
  if (!_schema) return false;
  const schema = (_schema == null ? void 0 : _schema.schema) ?? _schema;
  if (schema[Kind$1] === "Import" && _schema.References)
    return _schema.References().some(hasAdditionalProperties);
  if (schema.anyOf) return schema.anyOf.some(hasAdditionalProperties);
  if (schema.someOf) return schema.someOf.some(hasAdditionalProperties);
  if (schema.allOf) return schema.allOf.some(hasAdditionalProperties);
  if (schema.not) return schema.not.some(hasAdditionalProperties);
  if (schema.type === "object") {
    const properties = schema.properties;
    if ("additionalProperties" in schema) return schema.additionalProperties;
    if ("patternProperties" in schema) return false;
    for (const key of Object.keys(properties)) {
      const property = properties[key];
      if (property.type === "object") {
        if (hasAdditionalProperties(property)) return true;
      } else if (property.anyOf) {
        for (let i = 0; i < property.anyOf.length; i++)
          if (hasAdditionalProperties(property.anyOf[i])) return true;
      }
      return property.additionalProperties;
    }
    return false;
  }
  return schema.type === "array" && schema.items && !Array.isArray(schema.items) ? hasAdditionalProperties(schema.items) : false;
}, resolveSchema = (schema, models, modules) => {
  if (schema)
    return typeof schema != "string" ? schema : modules && schema in modules.$defs ? modules.Import(schema) : models == null ? void 0 : models[schema];
}, hasType = (type, schema) => {
  if (!schema) return false;
  if (Kind$1 in schema && schema[Kind$1] === type) return true;
  if (Kind$1 in schema && schema[Kind$1] === "Import" && schema.$defs && schema.$ref) {
    const ref = schema.$ref.replace("#/$defs/", "");
    if (schema.$defs[ref])
      return hasType(type, schema.$defs[ref]);
  }
  if (schema.anyOf) return schema.anyOf.some((s) => hasType(type, s));
  if (schema.oneOf) return schema.oneOf.some((s) => hasType(type, s));
  if (schema.allOf) return schema.allOf.some((s) => hasType(type, s));
  if (schema.type === "array" && schema.items)
    return type === "Files" && Kind$1 in schema.items && schema.items[Kind$1] === "File" ? true : hasType(type, schema.items);
  if (schema.type === "object") {
    const properties = schema.properties;
    if (!properties) return false;
    for (const key of Object.keys(properties))
      if (hasType(type, properties[key])) return true;
  }
  return false;
}, hasElysiaMeta = (meta, _schema) => {
  if (!_schema) return false;
  const schema = (_schema == null ? void 0 : _schema.schema) ?? _schema;
  if (schema.elysiaMeta === meta) return true;
  if (schema[Kind$1] === "Import" && _schema.References)
    return _schema.References().some((schema2) => hasElysiaMeta(meta, schema2));
  if (schema.anyOf)
    return schema.anyOf.some(
      (schema2) => hasElysiaMeta(meta, schema2)
    );
  if (schema.someOf)
    return schema.someOf.some(
      (schema2) => hasElysiaMeta(meta, schema2)
    );
  if (schema.allOf)
    return schema.allOf.some(
      (schema2) => hasElysiaMeta(meta, schema2)
    );
  if (schema.not)
    return schema.not.some((schema2) => hasElysiaMeta(meta, schema2));
  if (schema.type === "object") {
    const properties = schema.properties;
    if (!properties) return false;
    for (const key of Object.keys(properties)) {
      const property = properties[key];
      if (property.type === "object") {
        if (hasElysiaMeta(meta, property)) return true;
      } else if (property.anyOf) {
        for (let i = 0; i < property.anyOf.length; i++)
          if (hasElysiaMeta(meta, property.anyOf[i])) return true;
      }
      return schema.elysiaMeta === meta;
    }
    return false;
  }
  return schema.type === "array" && schema.items && !Array.isArray(schema.items) ? hasElysiaMeta(meta, schema.items) : false;
}, hasProperty = (expectedProperty, _schema) => {
  if (!_schema) return false;
  const schema = _schema.schema ?? _schema;
  if (schema[Kind$1] === "Import" && _schema.References)
    return _schema.References().some((schema2) => hasProperty(expectedProperty, schema2));
  if (schema.anyOf)
    return schema.anyOf.some(
      (s) => hasProperty(expectedProperty, s)
    );
  if (schema.allOf)
    return schema.allOf.some(
      (s) => hasProperty(expectedProperty, s)
    );
  if (schema.oneOf)
    return schema.oneOf.some(
      (s) => hasProperty(expectedProperty, s)
    );
  if (schema.type === "object") {
    const properties = schema.properties;
    if (!properties) return false;
    for (const key of Object.keys(properties)) {
      const property = properties[key];
      if (expectedProperty in property) return true;
      if (property.type === "object") {
        if (hasProperty(expectedProperty, property)) return true;
      } else if (property.anyOf) {
        for (let i = 0; i < property.anyOf.length; i++)
          if (hasProperty(expectedProperty, property.anyOf[i]))
            return true;
      }
    }
    return false;
  }
  return expectedProperty in schema;
}, hasRef = (schema) => {
  if (!schema) return false;
  if (schema.oneOf) {
    for (let i = 0; i < schema.oneOf.length; i++)
      if (hasRef(schema.oneOf[i])) return true;
  }
  if (schema.anyOf) {
    for (let i = 0; i < schema.anyOf.length; i++)
      if (hasRef(schema.anyOf[i])) return true;
  }
  if (schema.oneOf) {
    for (let i = 0; i < schema.oneOf.length; i++)
      if (hasRef(schema.oneOf[i])) return true;
  }
  if (schema.allOf) {
    for (let i = 0; i < schema.allOf.length; i++)
      if (hasRef(schema.allOf[i])) return true;
  }
  if (schema.not && hasRef(schema.not)) return true;
  if (schema.type === "object" && schema.properties) {
    const properties = schema.properties;
    for (const key of Object.keys(properties)) {
      const property = properties[key];
      if (hasRef(property) || property.type === "array" && property.items && hasRef(property.items))
        return true;
    }
  }
  return schema.type === "array" && schema.items && hasRef(schema.items) ? true : schema[Kind$1] === "Ref" && "$ref" in schema;
}, hasTransform = (schema) => {
  if (!schema) return false;
  if (schema.$ref && schema.$defs && schema.$ref in schema.$defs && hasTransform(schema.$defs[schema.$ref]))
    return true;
  if (schema.oneOf) {
    for (let i = 0; i < schema.oneOf.length; i++)
      if (hasTransform(schema.oneOf[i])) return true;
  }
  if (schema.anyOf) {
    for (let i = 0; i < schema.anyOf.length; i++)
      if (hasTransform(schema.anyOf[i])) return true;
  }
  if (schema.allOf) {
    for (let i = 0; i < schema.allOf.length; i++)
      if (hasTransform(schema.allOf[i])) return true;
  }
  if (schema.not && hasTransform(schema.not)) return true;
  if (schema.type === "object" && schema.properties) {
    const properties = schema.properties;
    for (const key of Object.keys(properties)) {
      const property = properties[key];
      if (hasTransform(property) || property.type === "array" && property.items && hasTransform(property.items))
        return true;
    }
  }
  return schema.type === "array" && schema.items && hasTransform(schema.items) ? true : TransformKind in schema;
}, createCleaner = (schema) => (value) => {
  if (typeof value == "object")
    try {
      return Clean(schema, value);
    } catch {
    }
  return value;
}, getSchemaValidator = (s, {
  models = {},
  dynamic = false,
  modules,
  normalize = false,
  additionalProperties = false,
  forceAdditionalProperties = false,
  coerce = false,
  additionalCoerce = [],
  validators,
  sanitize: sanitize2
} = {}) => {
  var _a3, _b2;
  if (validators = validators == null ? void 0 : validators.filter((x) => x), !s) {
    if (!(validators == null ? void 0 : validators.length)) return;
    s = validators[0], validators = validators.slice(1);
  }
  let doesHaveRef;
  const replaceSchema = (schema2) => coerce ? replaceSchemaTypeFromManyOptions(schema2, [
    {
      from: t.Number(),
      to: (options) => t.Numeric(options),
      untilObjectFound: true
    },
    {
      from: t.Boolean(),
      to: (options) => t.BooleanString(options),
      untilObjectFound: true
    },
    ...Array.isArray(additionalCoerce) ? additionalCoerce : [additionalCoerce]
  ]) : replaceSchemaTypeFromManyOptions(schema2, additionalCoerce), mapSchema = (s2) => {
    if (s2 && typeof s2 != "string" && "~standard" in s2)
      return s2;
    if (!s2) return;
    let schema2;
    if (typeof s2 != "string") schema2 = s2;
    else if (schema2 = // @ts-expect-error private property
    modules && s2 in modules.$defs ? modules.Import(s2) : models[s2], !schema2) return;
    const hasAdditionalCoerce = Array.isArray(additionalCoerce) ? additionalCoerce.length > 0 : !!additionalCoerce;
    if (Kind$1 in schema2)
      if (schema2[Kind$1] === "Import")
        hasRef(schema2.$defs[schema2.$ref]) || (schema2 = schema2.$defs[schema2.$ref] ?? models[schema2.$ref], (coerce || hasAdditionalCoerce) && (schema2 = replaceSchema(schema2), "$id" in schema2 && !schema2.$defs && (schema2.$id = `${schema2.$id}_coerced_${randomId()}`)));
      else if (hasRef(schema2)) {
        const id = randomId();
        schema2 = t.Module({
          // @ts-expect-error private property
          ...modules == null ? void 0 : modules.$defs,
          [id]: schema2
        }).Import(id);
      } else (coerce || hasAdditionalCoerce) && (schema2 = replaceSchema(schema2));
    return schema2;
  };
  let schema = mapSchema(s), _validators = validators;
  if ("~standard" in schema || (validators == null ? void 0 : validators.length) && validators.some(
    (x) => x && typeof x != "string" && "~standard" in x
  )) {
    let Check2 = function(value, validated = false) {
      let v = validated ? value : mainCheck.validate(value);
      if (v instanceof Promise)
        return v.then((v2) => Check2(v2, true));
      if (v.issues) return v;
      const values = [];
      return v && typeof v == "object" && values.push(v.value), runCheckers2(value, 0, values, v);
    }, runCheckers2 = function(value, startIndex, values, lastV) {
      for (let i = startIndex; i < checkers.length; i++) {
        let v = checkers[i].validate(value);
        if (v instanceof Promise)
          return v.then((resolved) => {
            if (resolved.issues) return resolved;
            const nextValues = [...values];
            return resolved && typeof resolved == "object" && nextValues.push(resolved.value), runCheckers2(value, i + 1, nextValues, resolved);
          });
        if (v.issues) return v;
        v && typeof v == "object" && values.push(v.value), lastV = v;
      }
      return mergeValues2(values, lastV);
    }, mergeValues2 = function(values, lastV) {
      if (!values.length) return { value: lastV };
      if (values.length === 1) return { value: values[0] };
      if (values.length === 2)
        return { value: mergeDeep(values[0], values[1]) };
      let newValue = mergeDeep(values[0], values[1]);
      for (let i = 2; i < values.length; i++)
        newValue = mergeDeep(newValue, values[i]);
      return { value: newValue };
    };
    const typeboxSubValidator = (schema2) => {
      let mirror2;
      if (normalize === true || normalize === "exactMirror")
        try {
          mirror2 = createMirror(schema2, {
            TypeCompiler,
            sanitize: sanitize2 == null ? void 0 : sanitize2(),
            modules
          });
        } catch {
          console.warn(
            "Failed to create exactMirror. Please report the following code to https://github.com/elysiajs/elysia/issues"
          ), console.warn(schema2), mirror2 = createCleaner(schema2);
        }
      const vali = getSchemaValidator(schema2, {
        models,
        modules,
        dynamic,
        normalize,
        additionalProperties: true,
        forceAdditionalProperties: true,
        coerce,
        additionalCoerce
      });
      return vali.Decode = mirror2, {
        // @ts-ignore
        validate: (v) => vali.Check(v) ? {
          value: mirror2 ? mirror2(v) : v
        } : {
          issues: [...vali.Errors(v)]
        }
      };
    }, mainCheck = schema["~standard"] ? schema["~standard"] : typeboxSubValidator(schema);
    let checkers = [];
    if (validators == null ? void 0 : validators.length) {
      for (const validator2 of validators)
        if (validator2 && typeof validator2 != "string") {
          if (validator2 == null ? void 0 : validator2["~standard"]) {
            checkers.push(validator2["~standard"]);
            continue;
          }
          if (Kind$1 in validator2) {
            checkers.push(typeboxSubValidator(validator2));
            continue;
          }
        }
    }
    const validator = {
      provider: "standard",
      schema,
      references: "",
      checkFunc: () => {
      },
      code: "",
      // @ts-ignore
      Check: Check2,
      // @ts-ignore
      Errors: (value) => {
        var _a4, _b3;
        return (_b3 = (_a4 = Check2(value)) == null ? void 0 : _a4.then) == null ? void 0 : _b3.call(_a4, (x) => x == null ? void 0 : x.issues);
      },
      Code: () => "",
      // @ts-ignore
      Decode: Check2,
      // @ts-ignore
      Encode: (value) => value,
      hasAdditionalProperties: false,
      hasDefault: false,
      isOptional: false,
      hasTransform: false,
      hasRef: false
    };
    return validator.parse = (v) => {
      var _a4;
      try {
        return validator.Decode(((_a4 = validator.Clean) == null ? void 0 : _a4.call(validator, v)) ?? v);
      } catch {
        throw [...validator.Errors(v)].map(mapValueError);
      }
    }, validator.safeParse = (v) => {
      var _a4, _b3;
      try {
        return {
          success: true,
          data: validator.Decode(((_a4 = validator.Clean) == null ? void 0 : _a4.call(validator, v)) ?? v),
          error: null
        };
      } catch {
        const errors = [...compiled.Errors(v)].map(mapValueError);
        return {
          success: false,
          data: null,
          error: (_b3 = errors[0]) == null ? void 0 : _b3.summary,
          errors
        };
      }
    }, validator;
  } else if (validators == null ? void 0 : validators.length) {
    let hasAdditional = false;
    const validators2 = _validators, { schema: mergedObjectSchema, notObjects } = mergeObjectSchemas([
      schema,
      ...validators2.map(mapSchema)
    ]);
    notObjects && (schema = t.Intersect([
      ...mergedObjectSchema ? [mergedObjectSchema] : [],
      ...notObjects.map((x) => {
        const schema2 = mapSchema(x);
        return schema2.type === "object" && "additionalProperties" in schema2 && (!hasAdditional && schema2.additionalProperties === false && (hasAdditional = true), delete schema2.additionalProperties), schema2;
      })
    ]), schema.type === "object" && hasAdditional && (schema.additionalProperties = false));
  } else
    schema.type === "object" && (!("additionalProperties" in schema) || forceAdditionalProperties) ? schema.additionalProperties = additionalProperties : schema = replaceSchemaTypeFromManyOptions(schema, {
      onlyFirst: "object",
      from: t.Object({}),
      to(schema2) {
        return !schema2.properties || "additionalProperties" in schema2 ? schema2 : t.Object(schema2.properties, {
          ...schema2,
          additionalProperties: false
        });
      }
    });
  if (dynamic)
    if (Kind$1 in schema) {
      const validator = {
        provider: "typebox",
        schema,
        // @ts-ignore
        references: "",
        checkFunc: () => {
        },
        code: "",
        Check: (value) => Check(schema, value),
        Errors: (value) => Errors(schema, value),
        Code: () => "",
        Clean: createCleaner(schema),
        Decode: (value) => Decode(schema, value),
        Encode: (value) => Encode(schema, value),
        get hasAdditionalProperties() {
          return "~hasAdditionalProperties" in this ? this["~hasAdditionalProperties"] : this["~hasAdditionalProperties"] = hasAdditionalProperties(schema);
        },
        get hasDefault() {
          return "~hasDefault" in this ? this["~hasDefault"] : this["~hasDefault"] = hasProperty(
            "default",
            schema
          );
        },
        get isOptional() {
          return "~isOptional" in this ? this["~isOptional"] : this["~isOptional"] = isOptional(schema);
        },
        get hasTransform() {
          return "~hasTransform" in this ? this["~hasTransform"] : this["~hasTransform"] = hasTransform(schema);
        },
        "~hasRef": doesHaveRef,
        get hasRef() {
          return "~hasRef" in this ? this["~hasRef"] : this["~hasRef"] = hasTransform(schema);
        }
      };
      if (schema.config && (validator.config = schema.config, ((_a3 = validator == null ? void 0 : validator.schema) == null ? void 0 : _a3.config) && delete validator.schema.config), normalize && schema.additionalProperties === false)
        if (normalize === true || normalize === "exactMirror")
          try {
            validator.Clean = createMirror(schema, {
              TypeCompiler,
              sanitize: sanitize2 == null ? void 0 : sanitize2(),
              modules
            });
          } catch {
            console.warn(
              "Failed to create exactMirror. Please report the following code to https://github.com/elysiajs/elysia/issues"
            ), console.warn(schema), validator.Clean = createCleaner(schema);
          }
        else validator.Clean = createCleaner(schema);
      return validator.parse = (v) => {
        var _a4;
        try {
          return validator.Decode(((_a4 = validator.Clean) == null ? void 0 : _a4.call(validator, v)) ?? v);
        } catch {
          throw [...validator.Errors(v)].map(mapValueError);
        }
      }, validator.safeParse = (v) => {
        var _a4, _b3;
        try {
          return {
            success: true,
            data: validator.Decode(((_a4 = validator.Clean) == null ? void 0 : _a4.call(validator, v)) ?? v),
            error: null
          };
        } catch {
          const errors = [...compiled.Errors(v)].map(mapValueError);
          return {
            success: false,
            data: null,
            error: (_b3 = errors[0]) == null ? void 0 : _b3.summary,
            errors
          };
        }
      }, validator;
    } else {
      const validator = {
        provider: "standard",
        schema,
        references: "",
        checkFunc: () => {
        },
        code: "",
        // @ts-ignore
        Check: (v) => schema["~standard"].validate(v),
        // @ts-ignore
        Errors(value) {
          const response = schema["~standard"].validate(value);
          if (response instanceof Promise)
            throw Error(
              "Async validation is not supported in non-dynamic schema"
            );
          return response.issues;
        },
        Code: () => "",
        // @ts-ignore
        Decode(value) {
          const response = schema["~standard"].validate(value);
          if (response instanceof Promise)
            throw Error(
              "Async validation is not supported in non-dynamic schema"
            );
          return response;
        },
        // @ts-ignore
        Encode: (value) => value,
        hasAdditionalProperties: false,
        hasDefault: false,
        isOptional: false,
        hasTransform: false,
        hasRef: false
      };
      return validator.parse = (v) => {
        var _a4;
        try {
          return validator.Decode(((_a4 = validator.Clean) == null ? void 0 : _a4.call(validator, v)) ?? v);
        } catch {
          throw [...validator.Errors(v)].map(mapValueError);
        }
      }, validator.safeParse = (v) => {
        var _a4, _b3;
        try {
          return {
            success: true,
            data: validator.Decode(((_a4 = validator.Clean) == null ? void 0 : _a4.call(validator, v)) ?? v),
            error: null
          };
        } catch {
          const errors = [...compiled.Errors(v)].map(mapValueError);
          return {
            success: false,
            data: null,
            error: (_b3 = errors[0]) == null ? void 0 : _b3.summary,
            errors
          };
        }
      }, validator;
    }
  let compiled;
  if (Kind$1 in schema)
    if (compiled = TypeCompiler.Compile(
      schema,
      Object.values(models).filter((x) => Kind$1 in x)
    ), compiled.provider = "typebox", schema.config && (compiled.config = schema.config, ((_b2 = compiled == null ? void 0 : compiled.schema) == null ? void 0 : _b2.config) && delete compiled.schema.config), normalize === true || normalize === "exactMirror")
      try {
        compiled.Clean = createMirror(schema, {
          TypeCompiler,
          sanitize: sanitize2 == null ? void 0 : sanitize2(),
          modules
        });
      } catch {
        console.warn(
          "Failed to create exactMirror. Please report the following code to https://github.com/elysiajs/elysia/issues"
        ), console.dir(schema, {
          depth: null
        }), compiled.Clean = createCleaner(schema);
      }
    else normalize === "typebox" && (compiled.Clean = createCleaner(schema));
  else
    compiled = {
      provider: "standard",
      schema,
      references: "",
      checkFunc(value) {
        const response = schema["~standard"].validate(value);
        if (response instanceof Promise)
          throw Error(
            "Async validation is not supported in non-dynamic schema"
          );
        return response;
      },
      code: "",
      // @ts-ignore
      Check: (v) => schema["~standard"].validate(v),
      // @ts-ignore
      Errors(value) {
        const response = schema["~standard"].validate(value);
        if (response instanceof Promise)
          throw Error(
            "Async validation is not supported in non-dynamic schema"
          );
        return response.issues;
      },
      Code: () => "",
      // @ts-ignore
      Decode(value) {
        const response = schema["~standard"].validate(value);
        if (response instanceof Promise)
          throw Error(
            "Async validation is not supported in non-dynamic schema"
          );
        return response;
      },
      // @ts-ignore
      Encode: (value) => value,
      hasAdditionalProperties: false,
      hasDefault: false,
      isOptional: false,
      hasTransform: false,
      hasRef: false
    };
  return compiled.parse = (v) => {
    var _a4;
    try {
      return compiled.Decode(((_a4 = compiled.Clean) == null ? void 0 : _a4.call(compiled, v)) ?? v);
    } catch {
      throw [...compiled.Errors(v)].map(mapValueError);
    }
  }, compiled.safeParse = (v) => {
    var _a4, _b3;
    try {
      return {
        success: true,
        data: compiled.Decode(((_a4 = compiled.Clean) == null ? void 0 : _a4.call(compiled, v)) ?? v),
        error: null
      };
    } catch {
      const errors = [...compiled.Errors(v)].map(mapValueError);
      return {
        success: false,
        data: null,
        error: (_b3 = errors[0]) == null ? void 0 : _b3.summary,
        errors
      };
    }
  }, Kind$1 in schema && Object.assign(compiled, {
    get hasAdditionalProperties() {
      return "~hasAdditionalProperties" in this ? this["~hasAdditionalProperties"] : this["~hasAdditionalProperties"] = hasAdditionalProperties(compiled);
    },
    get hasDefault() {
      return "~hasDefault" in this ? this["~hasDefault"] : this["~hasDefault"] = hasProperty("default", compiled);
    },
    get isOptional() {
      return "~isOptional" in this ? this["~isOptional"] : this["~isOptional"] = isOptional(compiled);
    },
    get hasTransform() {
      return "~hasTransform" in this ? this["~hasTransform"] : this["~hasTransform"] = hasTransform(schema);
    },
    get hasRef() {
      return "~hasRef" in this ? this["~hasRef"] : this["~hasRef"] = hasRef(schema);
    },
    "~hasRef": doesHaveRef
  }), compiled;
}, isUnion = (schema) => schema[Kind$1] === "Union" || !schema.schema && !!schema.anyOf, getSchemaProperties = (schema) => {
  if (!schema) return;
  if (schema.properties) return schema.properties;
  const members = schema.allOf ?? schema.anyOf ?? schema.oneOf;
  if (members) {
    const result = {};
    for (const member of members) {
      const props = getSchemaProperties(member);
      props && Object.assign(result, props);
    }
    return Object.keys(result).length > 0 ? result : void 0;
  }
}, mergeObjectSchemas = (schemas) => {
  if (schemas.length === 0)
    return {
      schema: void 0,
      notObjects: []
    };
  if (schemas.length === 1)
    return schemas[0].type === "object" ? {
      schema: schemas[0],
      notObjects: []
    } : {
      schema: void 0,
      notObjects: schemas
    };
  let newSchema;
  const notObjects = [];
  let additionalPropertiesIsTrue = false, additionalPropertiesIsFalse = false;
  for (const schema of schemas) {
    if (schema.type !== "object") {
      notObjects.push(schema);
      continue;
    }
    if ("additionalProperties" in schema && (schema.additionalProperties === true ? additionalPropertiesIsTrue = true : schema.additionalProperties === false && (additionalPropertiesIsFalse = true)), !newSchema) {
      newSchema = schema;
      continue;
    }
    newSchema = {
      ...newSchema,
      ...schema,
      properties: {
        ...newSchema.properties,
        ...schema.properties
      },
      required: [
        ...(newSchema == null ? void 0 : newSchema.required) ?? [],
        ...schema.required ?? []
      ]
    };
  }
  return newSchema && (newSchema.required && (newSchema.required = [...new Set(newSchema.required)]), additionalPropertiesIsFalse ? newSchema.additionalProperties = false : additionalPropertiesIsTrue && (newSchema.additionalProperties = true)), {
    schema: newSchema,
    notObjects
  };
}, getResponseSchemaValidator = (s, {
  models = {},
  modules,
  dynamic = false,
  normalize = false,
  additionalProperties = false,
  validators = [],
  sanitize: sanitize2
}) => {
  if (validators = validators.filter((x) => x), !s) {
    if (!(validators == null ? void 0 : validators.length)) return;
    s = validators[0], validators = validators.slice(1);
  }
  let maybeSchemaOrRecord;
  if (typeof s != "string") maybeSchemaOrRecord = s;
  else if (maybeSchemaOrRecord = // @ts-expect-error private property
  modules && s in modules.$defs ? modules.Import(s) : models[s], !maybeSchemaOrRecord) return;
  if (!maybeSchemaOrRecord) return;
  if (Kind$1 in maybeSchemaOrRecord || "~standard" in maybeSchemaOrRecord)
    return {
      200: getSchemaValidator(
        maybeSchemaOrRecord,
        {
          modules,
          models,
          additionalProperties,
          dynamic,
          normalize,
          coerce: false,
          additionalCoerce: [],
          validators: validators.map((x) => x[200]),
          sanitize: sanitize2
        }
      )
    };
  const record = {};
  return Object.keys(maybeSchemaOrRecord).forEach((status2) => {
    if (isNaN(+status2)) return;
    const maybeNameOrSchema = maybeSchemaOrRecord[+status2];
    if (typeof maybeNameOrSchema == "string") {
      if (maybeNameOrSchema in models) {
        const schema = models[maybeNameOrSchema];
        if (!schema) return;
        record[+status2] = Kind$1 in schema || "~standard" in schema ? getSchemaValidator(schema, {
          modules,
          models,
          additionalProperties,
          dynamic,
          normalize,
          coerce: false,
          additionalCoerce: [],
          validators: validators.map((x) => x[+status2]),
          sanitize: sanitize2
        }) : schema;
      }
      return;
    }
    record[+status2] = Kind$1 in maybeNameOrSchema || "~standard" in maybeNameOrSchema ? getSchemaValidator(maybeNameOrSchema, {
      modules,
      models,
      additionalProperties,
      dynamic,
      normalize,
      coerce: false,
      additionalCoerce: [],
      validators: validators.map((x) => x[+status2]),
      sanitize: sanitize2
    }) : maybeNameOrSchema;
  }), record;
}, getCookieValidator = ({
  validator,
  modules,
  defaultConfig = {},
  config,
  dynamic,
  normalize = false,
  models,
  validators,
  sanitize: sanitize2
}) => {
  let cookieValidator = (
    // @ts-ignore
    (validator == null ? void 0 : validator.provider) ? validator : (
      // @ts-ignore
      getSchemaValidator(validator, {
        modules,
        dynamic,
        models,
        normalize,
        additionalProperties: true,
        coerce: true,
        additionalCoerce: stringToStructureCoercions(),
        validators,
        sanitize: sanitize2
      })
    )
  );
  return cookieValidator ? cookieValidator.config = mergeCookie(cookieValidator.config, config) : (cookieValidator = getSchemaValidator(t.Cookie(t.Any()), {
    modules,
    dynamic,
    models,
    additionalProperties: true,
    validators,
    sanitize: sanitize2
  }), cookieValidator.config = defaultConfig), cookieValidator;
}, unwrapImportSchema = (schema) => schema && schema[Kind$1] === "Import" && schema.$defs[schema.$ref][Kind$1] === "Object" ? schema.$defs[schema.$ref] : schema;
const allocateIf$1 = (value, condition) => condition ? value : "", defaultParsers = [
  "json",
  "text",
  "urlencoded",
  "arrayBuffer",
  "formdata",
  "application/json",
  // eslint-disable-next-line sonarjs/no-duplicate-string
  "text/plain",
  // eslint-disable-next-line sonarjs/no-duplicate-string
  "application/x-www-form-urlencoded",
  // eslint-disable-next-line sonarjs/no-duplicate-string
  "application/octet-stream",
  // eslint-disable-next-line sonarjs/no-duplicate-string
  "multipart/form-data"
], createReport = ({
  context = "c",
  trace = [],
  addFn
}) => {
  if (!trace.length)
    return () => ({
      resolveChild() {
        return () => {
        };
      },
      resolve() {
      }
    });
  for (let i = 0; i < trace.length; i++)
    addFn(
      `let report${i},reportChild${i},reportErr${i},reportErrChild${i};let trace${i}=${context}[ELYSIA_TRACE]?.[${i}]??trace[${i}](${context});
`
    );
  return (event, {
    name,
    total = 0,
    alias
  } = {}) => {
    name || (name = "anonymous");
    const reporter = event === "error" ? "reportErr" : "report";
    for (let i = 0; i < trace.length; i++)
      addFn(
        `${alias ? "const " : ""}${alias ?? reporter}${i}=trace${i}.${event}({id,event:'${event}',name:'${name}',begin:performance.now(),total:${total}})
`
      ), alias && addFn(`${reporter}${i}=${alias}${i}
`);
    return {
      resolve() {
        for (let i = 0; i < trace.length; i++)
          addFn(`${alias ?? reporter}${i}.resolve()
`);
      },
      resolveChild(name2) {
        for (let i = 0; i < trace.length; i++)
          addFn(
            `${reporter}Child${i}=${reporter}${i}.resolveChild?.shift()?.({id,event:'${event}',name:'${name2}',begin:performance.now()})
`
          );
        return (binding) => {
          for (let i = 0; i < trace.length; i++)
            addFn(
              binding ? `if(${binding} instanceof Error){${reporter}Child${i}?.(${binding}) }else{${reporter}Child${i}?.()}` : `${reporter}Child${i}?.()
`
            );
        };
      }
    };
  };
}, composeCleaner = ({
  schema,
  name,
  type,
  typeAlias = type,
  normalize,
  ignoreTryCatch = false
}) => !normalize || !schema.Clean ? "" : normalize === true || normalize === "exactMirror" ? ignoreTryCatch ? `${name}=validator.${typeAlias}.Clean(${name})
` : `try{${name}=validator.${typeAlias}.Clean(${name})
}catch{}` : normalize === "typebox" ? `${name}=validator.${typeAlias}.Clean(${name})
` : "", composeValidationFactory = ({
  injectResponse = "",
  normalize = false,
  validator,
  encodeSchema = false,
  isStaticResponse = false,
  hasSanitize = false,
  allowUnsafeValidationDetails = false
}) => ({
  validate: (type, value = `c.${type}`, error) => `c.set.status=422;throw new ValidationError('${type}',validator.${type},${value},${allowUnsafeValidationDetails}${error ? "," + error : ""})`,
  response: (name = "r") => {
    var _a3, _b2, _c3, _d2;
    if (isStaticResponse || !validator.response) return "";
    let code = injectResponse + `
`;
    code += `if(${name} instanceof ElysiaCustomStatusResponse){c.set.status=${name}.code
${name}=${name}.response}if(${name} instanceof Response === false && typeof ${name}?.next !== 'function' && !(${name} instanceof ReadableStream))switch(c.set.status){`;
    for (const [status2, value] of Object.entries(validator.response)) {
      if (code += `
case ${status2}:
`, value.provider === "standard") {
        code += `let vare${status2}=validator.response[${status2}].Check(${name})
if(vare${status2} instanceof Promise)vare${status2}=await vare${status2}
if(vare${status2}.issues)throw new ValidationError('response',validator.response[${status2}],${name},${allowUnsafeValidationDetails},vare${status2}.issues)
${name}=vare${status2}.value
c.set.status=${status2}
break
`;
        continue;
      }
      let noValidate = ((_a3 = value.schema) == null ? void 0 : _a3.noValidate) === true;
      if (!noValidate && ((_b2 = value.schema) == null ? void 0 : _b2.$ref) && ((_c3 = value.schema) == null ? void 0 : _c3.$defs)) {
        const refKey = value.schema.$ref, defKey = typeof refKey == "string" && refKey.includes("/") ? refKey.split("/").pop() : refKey;
        ((_d2 = value.schema.$defs[defKey]) == null ? void 0 : _d2.noValidate) === true && (noValidate = true);
      }
      const appliedCleaner = noValidate || hasSanitize, clean = ({ ignoreTryCatch = false } = {}) => composeCleaner({
        name,
        schema: value,
        type: "response",
        typeAlias: `response[${status2}]`,
        normalize,
        ignoreTryCatch
      });
      appliedCleaner && (code += clean());
      const applyErrorCleaner = !appliedCleaner && normalize && !noValidate;
      encodeSchema && value.hasTransform && !noValidate ? (code += `try{${name}=validator.response[${status2}].Encode(${name})
`, appliedCleaner || (code += clean({ ignoreTryCatch: true })), code += `c.set.status=${status2}}catch{` + (applyErrorCleaner ? `try{
` + clean({ ignoreTryCatch: true }) + `${name}=validator.response[${status2}].Encode(${name})
}catch{throw new ValidationError('response',validator.response[${status2}],${name},${allowUnsafeValidationDetails})}` : `throw new ValidationError('response',validator.response[${status2}],${name},${allowUnsafeValidationDetails})`) + "}") : (appliedCleaner || (code += clean()), noValidate || (code += `if(validator.response[${status2}].Check(${name})===false)throw new ValidationError('response',validator.response[${status2}],${name},${allowUnsafeValidationDetails})
c.set.status=${status2}
`)), code += `break
`;
    }
    return code + "}";
  }
}), isAsyncName = (v) => ((v == null ? void 0 : v.fn) ?? v).constructor.name === "AsyncFunction", matchResponseClone = /=>\s?response\.clone\(/, matchFnReturn = /(?:return|=>)\s?\S+\(|a(?:sync|wait)/, isAsync = (v) => {
  const isObject2 = typeof v == "object";
  if (isObject2 && v.isAsync !== void 0) return v.isAsync;
  const fn = isObject2 ? v.fn : v;
  if (fn.constructor.name === "AsyncFunction" || fn.constructor.name === "AsyncGeneratorFunction")
    return true;
  const literal = fn.toString();
  if (matchResponseClone.test(literal))
    return isObject2 && (v.isAsync = false), false;
  const result = matchFnReturn.test(literal);
  return isObject2 && (v.isAsync = result), result;
}, hasReturn = (v) => {
  const isObject2 = typeof v == "object";
  if (isObject2 && v.hasReturn !== void 0) return v.hasReturn;
  const fnLiteral = isObject2 ? v.fn.toString() : v.toString(), parenthesisEnd = fnLiteral.indexOf(")"), arrowIndex = fnLiteral.indexOf("=>", parenthesisEnd);
  if (arrowIndex !== -1) {
    let afterArrow = arrowIndex + 2, charCode;
    for (; afterArrow < fnLiteral.length && ((charCode = fnLiteral.charCodeAt(afterArrow)) === 32 || // space
    charCode === 9 || // tab
    charCode === 10 || // newline
    charCode === 13); )
      afterArrow++;
    if (afterArrow < fnLiteral.length && fnLiteral.charCodeAt(afterArrow) !== 123)
      return isObject2 && (v.hasReturn = true), true;
  }
  const result = fnLiteral.includes("return");
  return isObject2 && (v.hasReturn = result), result;
}, isGenerator = (v) => {
  const fn = (v == null ? void 0 : v.fn) ?? v;
  return fn.constructor.name === "AsyncGeneratorFunction" || fn.constructor.name === "GeneratorFunction";
}, coerceTransformDecodeError = (fnLiteral, type, allowUnsafeValidationDetails = false, value = `c.${type}`) => `try{${fnLiteral}}catch(error){if(error.constructor.name === 'TransformDecodeError'){c.set.status=422
throw error.error ?? new ValidationError('${type}',validator.${type},${value},${allowUnsafeValidationDetails})}}`, setImmediateFn = hasSetImmediate ? "setImmediate" : "Promise.resolve().then", composeHandler = ({
  app: app2,
  path: path2,
  method,
  hooks,
  validator,
  handler,
  allowMeta = false,
  inference
}) => {
  var _a3, _b2, _c3, _d2, _e2, _f2, _g2, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H, _I, _J, _K, _L, _M, _N, _O, _P, _Q, _R, _S, _T, _U, _V, _W, _X, _Y, _Z, __, _$, _aa, _ba, _ca, _da, _ea, _fa, _ga, _ha, _ia, _ja, _ka, _la, _ma, _na, _oa, _pa, _qa, _ra, _sa, _ta, _ua, _va, _wa, _xa, _ya, _za, _Aa, _Ba, _Ca, _Da, _Ea, _Fa, _Ga, _Ha, _Ia, _Ja, _Ka, _La, _Ma, _Na, _Oa, _Pa, _Qa, _Ra, _Sa, _Ta, _Ua, _Va, _Wa, _Xa, _Ya, _Za, __a, _$a, _ab, _bb, _cb, _db, _eb, _fb;
  const adapter = app2["~adapter"].composeHandler, adapterHandler = app2["~adapter"].handler, isHandleFn = typeof handler == "function";
  if (!isHandleFn) {
    handler = adapterHandler.mapResponse(handler, {
      // @ts-expect-error private property
      headers: app2.setHeaders ?? {}
    });
    const isResponse = handler instanceof Response || // @ts-ignore If it's not instanceof Response, it might be a polyfill (only on Node)
    ((_a3 = handler == null ? void 0 : handler.constructor) == null ? void 0 : _a3.name) === "Response" && typeof (handler == null ? void 0 : handler.clone) == "function";
    if (((_b2 = hooks.parse) == null ? void 0 : _b2.length) && ((_c3 = hooks.transform) == null ? void 0 : _c3.length) && ((_d2 = hooks.beforeHandle) == null ? void 0 : _d2.length) && ((_e2 = hooks.afterHandle) == null ? void 0 : _e2.length))
      return isResponse ? Function(
        "a",
        `"use strict";
return function(){return a.clone()}`
      )(handler) : Function(
        "a",
        `"use strict";
return function(){return a}`
      )(handler);
    if (isResponse) {
      const response = handler;
      handler = () => response.clone();
    }
  }
  const handle = isHandleFn ? "handler(c)" : "handler", hasTrace = !!((_f2 = hooks.trace) == null ? void 0 : _f2.length);
  let fnLiteral = "";
  if (inference = sucrose(
    Object.assign({ handler }, hooks),
    inference,
    app2.config.sucrose
  ), adapter.declare) {
    const literal = adapter.declare(inference);
    literal && (fnLiteral += literal);
  }
  inference.server && (fnLiteral += `Object.defineProperty(c,'server',{get:function(){return getServer()}})
`), (_g2 = validator.createBody) == null ? void 0 : _g2.call(validator), (_h = validator.createQuery) == null ? void 0 : _h.call(validator), (_i = validator.createHeaders) == null ? void 0 : _i.call(validator), (_j = validator.createParams) == null ? void 0 : _j.call(validator), (_k = validator.createCookie) == null ? void 0 : _k.call(validator), (_l = validator.createResponse) == null ? void 0 : _l.call(validator);
  const hasValidation = !!validator.body || !!validator.headers || !!validator.params || !!validator.query || !!validator.cookie || !!validator.response, hasQuery = inference.query || !!validator.query, requestNoBody = ((_m = hooks.parse) == null ? void 0 : _m.length) === 1 && // @ts-expect-error
  hooks.parse[0].fn === "none", hasBody = method !== "" && method !== "GET" && method !== "HEAD" && (inference.body || !!validator.body || !!((_n = hooks.parse) == null ? void 0 : _n.length)) && !requestNoBody, defaultHeaders = app2.setHeaders, hasDefaultHeaders = defaultHeaders && !!Object.keys(defaultHeaders).length, hasHeaders = inference.headers || !!validator.headers || adapter.preferWebstandardHeaders !== true && inference.body, hasCookie = inference.cookie || !!validator.cookie, cookieMeta = ((_o = validator.cookie) == null ? void 0 : _o.config) ? mergeCookie((_p = validator == null ? void 0 : validator.cookie) == null ? void 0 : _p.config, app2.config.cookie) : app2.config.cookie;
  let _encodeCookie = "";
  const encodeCookie = () => {
    if (_encodeCookie) return _encodeCookie;
    if (cookieMeta == null ? void 0 : cookieMeta.sign) {
      if (cookieMeta.secrets === "")
        throw new Error(
          `cookie secret can't be an empty string at (${method}) ${path2}`,
          {
            cause: `(${method}) ${path2}`
          }
        );
      if (!cookieMeta.secrets)
        throw new Error(
          `cookie secret must be defined (${method}) ${path2}`,
          {
            cause: `(${method}) ${path2}`
          }
        );
      const secret = cookieMeta.secrets ? typeof cookieMeta.secrets == "string" ? cookieMeta.secrets : cookieMeta.secrets[0] : void 0;
      if (_encodeCookie += `const _setCookie = c.set.cookie
if(_setCookie){`, cookieMeta.sign === true)
        _encodeCookie += `for(const [key, cookie] of Object.entries(_setCookie)){c.set.cookie[key].value=await signCookie(cookie.value,${secret ? JSON.stringify(secret) : "undefined"})}`;
      else {
        typeof cookieMeta.sign == "string" && (cookieMeta.sign = [cookieMeta.sign]);
        for (const name of cookieMeta.sign)
          _encodeCookie += `if(_setCookie[${JSON.stringify(name)}]?.value)c.set.cookie[${JSON.stringify(name)}].value=await signCookie(_setCookie[${JSON.stringify(name)}].value,${secret ? JSON.stringify(secret) : "undefined"})
`;
      }
      _encodeCookie += `}
`;
    }
    return _encodeCookie;
  }, normalize = app2.config.normalize, encodeSchema = app2.config.encodeSchema, allowUnsafeValidationDetails = app2.config.allowUnsafeValidationDetails, validation = composeValidationFactory({
    normalize,
    validator,
    encodeSchema,
    isStaticResponse: handler instanceof Response,
    hasSanitize: !!app2.config.sanitize,
    allowUnsafeValidationDetails
  });
  hasHeaders && (fnLiteral += adapter.headers), hasTrace && (fnLiteral += `const id=c[ELYSIA_REQUEST_ID]
`);
  const report = createReport({
    trace: hooks.trace,
    addFn: (word) => {
      fnLiteral += word;
    }
  });
  if (fnLiteral += "try{", hasCookie) {
    const get = (name, defaultValue) => {
      const value = (cookieMeta == null ? void 0 : cookieMeta[name]) ?? defaultValue;
      return value === void 0 ? "" : value ? typeof value == "string" ? `${name}:${JSON.stringify(value)},` : value instanceof Date ? `${name}: new Date(${value.getTime()}),` : `${name}:${value},` : typeof defaultValue == "string" ? `${name}:"${defaultValue}",` : `${name}:${defaultValue},`;
    }, options = cookieMeta ? `{secrets:${cookieMeta.secrets !== void 0 && cookieMeta.secrets !== null ? typeof cookieMeta.secrets == "string" ? JSON.stringify(cookieMeta.secrets) : "[" + cookieMeta.secrets.map((x) => JSON.stringify(x)).join(",") + "]" : "undefined"},sign:${cookieMeta.sign === true ? true : cookieMeta.sign !== void 0 ? typeof cookieMeta.sign == "string" ? JSON.stringify(cookieMeta.sign) : "[" + cookieMeta.sign.map((x) => JSON.stringify(x)).join(",") + "]" : "undefined"},` + get("domain") + get("expires") + get("httpOnly") + get("maxAge") + get("path", "/") + get("priority") + get("sameSite") + get("secure") + "}" : "undefined";
    hasHeaders ? fnLiteral += `
c.cookie=await parseCookie(c.set,c.headers.cookie,${options})
` : fnLiteral += `
c.cookie=await parseCookie(c.set,c.request.headers.get('cookie'),${options})
`;
  }
  if (hasQuery) {
    let arrayProperties = {}, objectProperties = {}, hasArrayProperty = false, hasObjectProperty = false;
    if ((_q = validator.query) == null ? void 0 : _q.schema) {
      const schema = unwrapImportSchema((_r = validator.query) == null ? void 0 : _r.schema), properties = getSchemaProperties(schema);
      if (properties)
        for (const [key, value] of Object.entries(properties))
          hasElysiaMeta("ArrayQuery", value) && (arrayProperties[key] = true, hasArrayProperty = true), hasElysiaMeta("ObjectString", value) && (objectProperties[key] = true, hasObjectProperty = true);
    }
    fnLiteral += `if(c.qi===-1){c.query=Object.create(null)}else{c.query=parseQueryFromURL(c.url,c.qi+1${//
    hasArrayProperty ? "," + JSON.stringify(arrayProperties) : hasObjectProperty ? ",undefined" : ""}${//
    hasObjectProperty ? "," + JSON.stringify(objectProperties) : ""})}`;
  }
  const isAsyncHandler = typeof handler == "function" && isAsync(handler), saveResponse = hasTrace || ((_s = hooks.afterResponse) == null ? void 0 : _s.length) ? "c.response=c.responseValue= " : "", responseKeys = Object.keys(validator.response ?? {}), hasMultipleResponses = responseKeys.length > 1, hasSingle200 = responseKeys.length === 0 || responseKeys.length === 1 && responseKeys[0] === "200", maybeAsync = hasCookie || hasBody || isAsyncHandler || !!((_t = hooks.parse) == null ? void 0 : _t.length) || !!((_u = hooks.afterHandle) == null ? void 0 : _u.some(isAsync)) || !!((_v = hooks.beforeHandle) == null ? void 0 : _v.some(isAsync)) || !!((_w = hooks.transform) == null ? void 0 : _w.some(isAsync)) || !!((_x = hooks.mapResponse) == null ? void 0 : _x.some(isAsync)) || ((_y = validator.body) == null ? void 0 : _y.provider) === "standard" || ((_z = validator.headers) == null ? void 0 : _z.provider) === "standard" || ((_A = validator.query) == null ? void 0 : _A.provider) === "standard" || ((_B = validator.params) == null ? void 0 : _B.provider) === "standard" || ((_C = validator.cookie) == null ? void 0 : _C.provider) === "standard" || Object.values(validator.response ?? {}).find(
    (x) => x.provider === "standard"
  ), maybeStream = (typeof handler == "function" ? isGenerator(handler) : false) || !!((_D = hooks.beforeHandle) == null ? void 0 : _D.some(isGenerator)) || !!((_E = hooks.afterHandle) == null ? void 0 : _E.some(isGenerator)) || !!((_F = hooks.transform) == null ? void 0 : _F.some(isGenerator)), hasSet = inference.cookie || inference.set || hasHeaders || hasTrace || hasMultipleResponses || !hasSingle200 || isHandleFn && hasDefaultHeaders || maybeStream;
  let _afterResponse;
  const afterResponse = (hasStream = true) => {
    var _a4, _b3, _c4;
    if (_afterResponse !== void 0) return _afterResponse;
    if (!((_a4 = hooks.afterResponse) == null ? void 0 : _a4.length) && !hasTrace) return "";
    let afterResponse2 = "";
    afterResponse2 += `
${setImmediateFn}(async()=>{if(c.responseValue){if(c.responseValue instanceof ElysiaCustomStatusResponse) c.set.status=c.responseValue.code
` + (hasStream ? `if(typeof afterHandlerStreamListener!=='undefined')for await(const v of afterHandlerStreamListener){}
` : "") + `}
`;
    const reporter = createReport({
      trace: hooks.trace,
      addFn: (word) => {
        afterResponse2 += word;
      }
    })("afterResponse", {
      total: (_b3 = hooks.afterResponse) == null ? void 0 : _b3.length
    });
    if (((_c4 = hooks.afterResponse) == null ? void 0 : _c4.length) && hooks.afterResponse)
      for (let i = 0; i < hooks.afterResponse.length; i++) {
        const endUnit = reporter.resolveChild(
          hooks.afterResponse[i].fn.name
        ), prefix = isAsync(hooks.afterResponse[i]) ? "await " : "";
        afterResponse2 += `
${prefix}e.afterResponse[${i}](c)
`, endUnit();
      }
    return reporter.resolve(), afterResponse2 += `})
`, _afterResponse = afterResponse2;
  }, mapResponse2 = (r = "r") => {
    const after = afterResponse(), response = `${maybeStream && maybeAsync ? "await " : ""}${hasSet ? "mapResponse" : "mapCompactResponse"}(${saveResponse}${r}${hasSet ? ",c.set" : ""}${mapResponseContext})
`;
    return after ? `const _res=${response}` + after + "return _res" : `return ${response}`;
  }, mapResponseContext = adapter.mapResponseContext ? `,${adapter.mapResponseContext}` : "";
  (hasTrace || inference.route) && (fnLiteral += `c.route=\`${path2}\`
`), (hasTrace || ((_G = hooks.afterResponse) == null ? void 0 : _G.length)) && (fnLiteral += `let afterHandlerStreamListener
`);
  const parseReporter = report("parse", {
    total: (_H = hooks.parse) == null ? void 0 : _H.length
  });
  if (hasBody) {
    const hasBodyInference = !!((_I = hooks.parse) == null ? void 0 : _I.length) || inference.body || validator.body;
    adapter.parser.declare && (fnLiteral += adapter.parser.declare), fnLiteral += `
try{`;
    let parser = typeof hooks.parse == "string" ? hooks.parse : Array.isArray(hooks.parse) && hooks.parse.length === 1 ? typeof hooks.parse[0] == "string" ? hooks.parse[0] : typeof hooks.parse[0].fn == "string" ? hooks.parse[0].fn : void 0 : void 0;
    if (!parser && validator.body && !((_J = hooks.parse) == null ? void 0 : _J.length)) {
      const schema = validator.body.schema;
      schema && schema.anyOf && schema[Kind$1] === "Union" && ((_K = schema.anyOf) == null ? void 0 : _K.length) === 2 && ((_L = schema.anyOf) == null ? void 0 : _L.find((x) => x[Kind$1] === "ElysiaForm")) && (parser = "formdata");
    }
    if (parser && defaultParsers.includes(parser)) {
      const reporter = report("parse", {
        total: (_M = hooks.parse) == null ? void 0 : _M.length
      }), isOptionalBody = !!((_N = validator.body) == null ? void 0 : _N.isOptional);
      switch (parser) {
        case "json":
        case "application/json":
          fnLiteral += adapter.parser.json(isOptionalBody);
          break;
        case "text":
        case "text/plain":
          fnLiteral += adapter.parser.text(isOptionalBody);
          break;
        case "urlencoded":
        case "application/x-www-form-urlencoded":
          fnLiteral += adapter.parser.urlencoded(isOptionalBody);
          break;
        case "arrayBuffer":
        case "application/octet-stream":
          fnLiteral += adapter.parser.arrayBuffer(isOptionalBody);
          break;
        case "formdata":
        case "multipart/form-data":
          fnLiteral += adapter.parser.formData(isOptionalBody);
          break;
        default:
          parser in app2["~parser"] && (fnLiteral += hasHeaders ? "let contentType = c.headers['content-type']" : "let contentType = c.request.headers.get('content-type')", fnLiteral += `
if(contentType){const index=contentType.indexOf(';')
if(index!==-1)contentType=contentType.substring(0,index)}
else{contentType=''}c.contentType=contentType
let result=parser['${parser}'](c, contentType)
if(result instanceof Promise)result=await result
if(result instanceof ElysiaCustomStatusResponse)throw result
if(result!==undefined)c.body=result
delete c.contentType
`);
          break;
      }
      reporter.resolve();
    } else if (hasBodyInference) {
      fnLiteral += `
`, fnLiteral += `let contentType
if(c.request.body)`, fnLiteral += hasHeaders ? `contentType=c.headers['content-type']
` : `contentType=c.request.headers.get('content-type')
`;
      let hasDefaultParser = false;
      if ((_O = hooks.parse) == null ? void 0 : _O.length)
        fnLiteral += `if(contentType){
const index=contentType.indexOf(';')

if(index!==-1)contentType=contentType.substring(0,index)}else{contentType=''}let used=false
c.contentType=contentType
`;
      else {
        hasDefaultParser = true;
        const isOptionalBody = !!((_P = validator.body) == null ? void 0 : _P.isOptional);
        fnLiteral += `if(contentType)switch(contentType.charCodeAt(12)){
case 106:` + adapter.parser.json(isOptionalBody) + `break
case 120:` + adapter.parser.urlencoded(isOptionalBody) + `break
case 111:` + adapter.parser.arrayBuffer(isOptionalBody) + `break
case 114:` + adapter.parser.formData(isOptionalBody) + `break
default:if(contentType.charCodeAt(0)===116){` + adapter.parser.text(isOptionalBody) + `}break
}`;
      }
      const reporter = report("parse", {
        total: (_Q = hooks.parse) == null ? void 0 : _Q.length
      });
      if (hooks.parse)
        for (let i = 0; i < hooks.parse.length; i++) {
          const name = `bo${i}`;
          if (i !== 0 && (fnLiteral += `
if(!used){`), typeof hooks.parse[i].fn == "string") {
            const endUnit = reporter.resolveChild(
              hooks.parse[i].fn
            ), isOptionalBody = !!((_R = validator.body) == null ? void 0 : _R.isOptional);
            switch (hooks.parse[i].fn) {
              case "json":
              case "application/json":
                hasDefaultParser = true, fnLiteral += adapter.parser.json(isOptionalBody);
                break;
              case "text":
              case "text/plain":
                hasDefaultParser = true, fnLiteral += adapter.parser.text(isOptionalBody);
                break;
              case "urlencoded":
              case "application/x-www-form-urlencoded":
                hasDefaultParser = true, fnLiteral += adapter.parser.urlencoded(isOptionalBody);
                break;
              case "arrayBuffer":
              case "application/octet-stream":
                hasDefaultParser = true, fnLiteral += adapter.parser.arrayBuffer(isOptionalBody);
                break;
              case "formdata":
              case "multipart/form-data":
                hasDefaultParser = true, fnLiteral += adapter.parser.formData(isOptionalBody);
                break;
              default:
                fnLiteral += `let ${name}=parser['${hooks.parse[i].fn}'](c,contentType)
if(${name} instanceof Promise)${name}=await ${name}
if(${name}!==undefined){c.body=${name};used=true;}
`;
            }
            endUnit();
          } else {
            const endUnit = reporter.resolveChild(
              hooks.parse[i].fn.name
            );
            fnLiteral += `let ${name}=e.parse[${i}]
${name}=${name}(c,contentType)
if(${name} instanceof Promise)${name}=await ${name}
if(${name}!==undefined){c.body=${name};used=true}`, endUnit();
          }
          if (i !== 0 && (fnLiteral += "}"), hasDefaultParser) break;
        }
      if (reporter.resolve(), !hasDefaultParser) {
        const isOptionalBody = !!((_S = validator.body) == null ? void 0 : _S.isOptional);
        ((_T = hooks.parse) == null ? void 0 : _T.length) && (fnLiteral += `
if(!used){
`), fnLiteral += `switch(contentType){case 'application/json':
` + adapter.parser.json(isOptionalBody) + `break
case 'text/plain':` + adapter.parser.text(isOptionalBody) + `break
case 'application/x-www-form-urlencoded':` + adapter.parser.urlencoded(isOptionalBody) + `break
case 'application/octet-stream':` + adapter.parser.arrayBuffer(isOptionalBody) + `break
case 'multipart/form-data':` + adapter.parser.formData(isOptionalBody) + `break
`;
        for (const key of Object.keys(app2["~parser"]))
          fnLiteral += `case '${key}':let bo${key}=parser['${key}'](c,contentType)
if(bo${key} instanceof Promise)bo${key}=await bo${key}
if(bo${key} instanceof ElysiaCustomStatusResponse){` + mapResponse2(`bo${key}`) + `}if(bo${key}!==undefined)c.body=bo${key}
break
`;
        ((_U = hooks.parse) == null ? void 0 : _U.length) && (fnLiteral += "}"), fnLiteral += "}";
      }
      ((_V = hooks.parse) == null ? void 0 : _V.length) && (fnLiteral += `
delete c.contentType`);
    }
    fnLiteral += "}catch(error){throw new ParseError(error)}";
  }
  if (parseReporter.resolve(), (hooks == null ? void 0 : hooks.transform) || hasTrace) {
    const reporter = report("transform", {
      total: (_W = hooks.transform) == null ? void 0 : _W.length
    });
    if ((_X = hooks.transform) == null ? void 0 : _X.length) {
      fnLiteral += `let transformed
`;
      for (let i = 0; i < hooks.transform.length; i++) {
        const transform = hooks.transform[i], endUnit = reporter.resolveChild(transform.fn.name);
        fnLiteral += isAsync(transform) ? `transformed=await e.transform[${i}](c)
` : `transformed=e.transform[${i}](c)
`, transform.subType === "mapDerive" ? fnLiteral += "if(transformed instanceof ElysiaCustomStatusResponse){" + mapResponse2("transformed") + `}else{transformed.request=c.request
transformed.store=c.store
transformed.qi=c.qi
transformed.path=c.path
transformed.url=c.url
transformed.redirect=c.redirect
transformed.set=c.set
transformed.error=c.error
c=transformed}` : fnLiteral += "if(transformed instanceof ElysiaCustomStatusResponse){" + mapResponse2("transformed") + `}else Object.assign(c,transformed)
`, endUnit();
      }
    }
    reporter.resolve();
  }
  const fileUnions = [];
  if (validator) {
    if (validator.headers) {
      if (validator.headers.hasDefault)
        for (const [key, value] of Object.entries(
          Default(
            // @ts-ignore
            validator.headers.schema,
            {}
          )
        )) {
          const parsed = typeof value == "object" ? JSON.stringify(value) : typeof value == "string" ? `'${value}'` : value;
          parsed !== void 0 && (fnLiteral += `c.headers['${key}']??=${parsed}
`);
        }
      fnLiteral += composeCleaner({
        name: "c.headers",
        schema: validator.headers,
        type: "headers",
        normalize
      }), validator.headers.isOptional && (fnLiteral += "if(isNotEmpty(c.headers)){"), ((_Y = validator.headers) == null ? void 0 : _Y.provider) === "standard" ? fnLiteral += `let vah=validator.headers.Check(c.headers)
if(vah instanceof Promise)vah=await vah
if(vah.issues){` + validation.validate("headers", void 0, "vah.issues") + `}else{c.headers=vah.value}
` : ((__ = (_Z = validator.headers) == null ? void 0 : _Z.schema) == null ? void 0 : __.noValidate) !== true && (fnLiteral += "if(validator.headers.Check(c.headers) === false){" + validation.validate("headers") + "}"), validator.headers.hasTransform && (fnLiteral += coerceTransformDecodeError(
        `c.headers=validator.headers.Decode(c.headers)
`,
        "headers",
        allowUnsafeValidationDetails
      )), validator.headers.isOptional && (fnLiteral += "}");
    }
    if (validator.params) {
      if (validator.params.hasDefault)
        for (const [key, value] of Object.entries(
          Default(
            // @ts-ignore
            validator.params.schema,
            {}
          )
        )) {
          const parsed = typeof value == "object" ? JSON.stringify(value) : typeof value == "string" ? `'${value}'` : value;
          parsed !== void 0 && (fnLiteral += `c.params['${key}']??=${parsed}
`);
        }
      validator.params.provider === "standard" ? fnLiteral += `let vap=validator.params.Check(c.params)
if(vap instanceof Promise)vap=await vap
if(vap.issues){` + validation.validate("params", void 0, "vap.issues") + `}else{c.params=vap.value}
` : ((_aa = (_$ = validator.params) == null ? void 0 : _$.schema) == null ? void 0 : _aa.noValidate) !== true && (fnLiteral += "if(validator.params.Check(c.params)===false){" + validation.validate("params") + "}"), validator.params.hasTransform && (fnLiteral += coerceTransformDecodeError(
        `c.params=validator.params.Decode(c.params)
`,
        "params",
        allowUnsafeValidationDetails
      ));
    }
    if (validator.query) {
      if (Kind$1 in ((_ba = validator.query) == null ? void 0 : _ba.schema) && validator.query.hasDefault)
        for (const [key, value] of Object.entries(
          Default(
            // @ts-ignore
            validator.query.schema,
            {}
          )
        )) {
          const parsed = typeof value == "object" ? JSON.stringify(value) : typeof value == "string" ? `'${value}'` : value;
          parsed !== void 0 && (fnLiteral += `if(c.query['${key}']===undefined)c.query['${key}']=${parsed}
`);
        }
      fnLiteral += composeCleaner({
        name: "c.query",
        schema: validator.query,
        type: "query",
        normalize
      }), validator.query.isOptional && (fnLiteral += "if(isNotEmpty(c.query)){"), validator.query.provider === "standard" ? fnLiteral += `let vaq=validator.query.Check(c.query)
if(vaq instanceof Promise)vaq=await vaq
if(vaq.issues){` + validation.validate("query", void 0, "vaq.issues") + `}else{c.query=vaq.value}
` : ((_da = (_ca = validator.query) == null ? void 0 : _ca.schema) == null ? void 0 : _da.noValidate) !== true && (fnLiteral += "if(validator.query.Check(c.query)===false){" + validation.validate("query") + "}"), validator.query.hasTransform && (fnLiteral += coerceTransformDecodeError(
        `c.query=validator.query.Decode(c.query)
`,
        "query",
        allowUnsafeValidationDetails
      ), fnLiteral += coerceTransformDecodeError(
        `c.query=validator.query.Decode(c.query)
`,
        "query",
        allowUnsafeValidationDetails
      )), validator.query.isOptional && (fnLiteral += "}");
    }
    if (hasBody && validator.body) {
      (validator.body.hasTransform || validator.body.isOptional) && (fnLiteral += `const isNotEmptyObject=c.body&&(typeof c.body==="object"&&(isNotEmpty(c.body)||c.body instanceof ArrayBuffer))
`);
      const hasUnion = isUnion(validator.body.schema);
      let hasNonUnionFileWithDefault = false;
      if (validator.body.hasDefault) {
        let value = Default(
          validator.body.schema,
          validator.body.schema.type === "object" || unwrapImportSchema(validator.body.schema)[Kind$1] === "Object" ? {} : void 0
        );
        const schema = unwrapImportSchema(validator.body.schema);
        if (!hasUnion && value && typeof value == "object" && (hasType("File", schema) || hasType("Files", schema))) {
          hasNonUnionFileWithDefault = true;
          for (const [k, v] of Object.entries(value))
            (v === "File" || v === "Files") && delete value[k];
          isNotEmpty(value) || (value = void 0);
        }
        const parsed = typeof value == "object" ? JSON.stringify(value) : typeof value == "string" ? `'${value}'` : value;
        value != null && (Array.isArray(value) ? fnLiteral += `if(!c.body)c.body=${parsed}
` : typeof value == "object" ? fnLiteral += `c.body=Object.assign(${parsed},c.body)
` : fnLiteral += `c.body=${parsed}
`), fnLiteral += composeCleaner({
          name: "c.body",
          schema: validator.body,
          type: "body",
          normalize
        }), validator.body.provider === "standard" ? fnLiteral += `let vab=validator.body.Check(c.body)
if(vab instanceof Promise)vab=await vab
if(vab.issues){` + validation.validate("body", void 0, "vab.issues") + `}else{c.body=vab.value}
` : ((_fa = (_ea = validator.body) == null ? void 0 : _ea.schema) == null ? void 0 : _fa.noValidate) !== true && (validator.body.isOptional ? fnLiteral += "if(isNotEmptyObject&&validator.body.Check(c.body)===false){" + validation.validate("body") + "}" : fnLiteral += "if(validator.body.Check(c.body)===false){" + validation.validate("body") + "}");
      } else
        fnLiteral += composeCleaner({
          name: "c.body",
          schema: validator.body,
          type: "body",
          normalize
        }), validator.body.provider === "standard" ? fnLiteral += `let vab=validator.body.Check(c.body)
if(vab instanceof Promise)vab=await vab
if(vab.issues){` + validation.validate("body", void 0, "vab.issues") + `}else{c.body=vab.value}
` : ((_ha = (_ga = validator.body) == null ? void 0 : _ga.schema) == null ? void 0 : _ha.noValidate) !== true && (validator.body.isOptional ? fnLiteral += "if(isNotEmptyObject&&validator.body.Check(c.body)===false){" + validation.validate("body") + "}" : fnLiteral += "if(validator.body.Check(c.body)===false){" + validation.validate("body") + "}");
      if (validator.body.hasTransform && (fnLiteral += coerceTransformDecodeError(
        `if(isNotEmptyObject)c.body=validator.body.Decode(c.body)
`,
        "body",
        allowUnsafeValidationDetails
      )), hasUnion && ((_ia = validator.body.schema.anyOf) == null ? void 0 : _ia.length)) {
        const iterator = Object.values(
          validator.body.schema.anyOf
        );
        for (let i = 0; i < iterator.length; i++) {
          const type = iterator[i];
          if (hasType("File", type) || hasType("Files", type)) {
            const candidate = getSchemaValidator(type, {
              // @ts-expect-error private property
              modules: app2.definitions.typebox,
              dynamic: !app2.config.aot,
              // @ts-expect-error private property
              models: app2.definitions.type,
              normalize: app2.config.normalize,
              additionalCoerce: coercePrimitiveRoot(),
              sanitize: () => app2.config.sanitize
            });
            if (candidate) {
              const isFirst = fileUnions.length === 0, properties = getSchemaProperties(candidate.schema) ?? getSchemaProperties(type);
              if (!properties) continue;
              const iterator2 = Object.entries(properties);
              let validator2 = isFirst ? `
` : " else ";
              validator2 += `if(fileUnions[${fileUnions.length}].Check(c.body)){`;
              let validateFile2 = "", validatorLength = 0;
              for (let i2 = 0; i2 < iterator2.length; i2++) {
                const [k, v] = iterator2[i2];
                !v.extension || v[Kind$1] !== "File" && v[Kind$1] !== "Files" || (validatorLength && (validateFile2 += ","), validateFile2 += `fileType(c.body.${k},${JSON.stringify(v.extension)},'body.${k}')`, validatorLength++);
              }
              validateFile2 && (validatorLength === 1 ? validator2 += `await ${validateFile2}
` : validatorLength > 1 && (validator2 += `await Promise.all([${validateFile2}])
`), validator2 += "}", fnLiteral += validator2, fileUnions.push(candidate));
            }
          }
        }
      } else if (hasNonUnionFileWithDefault || !hasUnion && (hasType(
        "File",
        unwrapImportSchema(validator.body.schema)
      ) || hasType(
        "Files",
        unwrapImportSchema(validator.body.schema)
      ))) {
        let validateFile2 = "";
        const bodyProperties = getSchemaProperties(
          unwrapImportSchema(validator.body.schema)
        );
        let i = 0;
        if (bodyProperties)
          for (const [k, v] of Object.entries(bodyProperties))
            !v.extension || v[Kind$1] !== "File" && v[Kind$1] !== "Files" || (i && (validateFile2 += ","), validateFile2 += `fileType(c.body.${k},${JSON.stringify(v.extension)},'body.${k}')`, i++);
        i && (fnLiteral += `
`), i === 1 ? fnLiteral += `await ${validateFile2}
` : i > 1 && (fnLiteral += `await Promise.all([${validateFile2}])
`);
      }
    }
    validator.cookie && (validator.cookie.config = mergeCookie(
      validator.cookie.config,
      app2.config.cookie ?? {}
    ), fnLiteral += `let cookieValue={}
for(const [key,value] of Object.entries(c.cookie))cookieValue[key]=value.value
`, validator.cookie.isOptional && (fnLiteral += "if(isNotEmpty(c.cookie)){"), validator.cookie.provider === "standard" ? (fnLiteral += `let vac=validator.cookie.Check(cookieValue)
if(vac instanceof Promise)vac=await vac
if(vac.issues){` + validation.validate("cookie", void 0, "vac.issues") + `}else{cookieValue=vac.value}
`, fnLiteral += `for(const k of Object.keys(cookieValue))c.cookie[k].value=cookieValue[k]
`) : ((_ka = (_ja = validator.cookie) == null ? void 0 : _ja.schema) == null ? void 0 : _ka.noValidate) !== true && (fnLiteral += "if(validator.cookie.Check(cookieValue)===false){" + validation.validate("cookie", "cookieValue") + "}", validator.cookie.hasTransform && (fnLiteral += coerceTransformDecodeError(
      "for(const [key,value] of Object.entries(validator.cookie.Decode(cookieValue))){c.cookie[key].value = value}",
      "cookie",
      allowUnsafeValidationDetails
    ))), validator.cookie.isOptional && (fnLiteral += "}"));
  }
  if ((hooks == null ? void 0 : hooks.beforeHandle) || hasTrace) {
    const reporter = report("beforeHandle", {
      total: (_la = hooks.beforeHandle) == null ? void 0 : _la.length
    });
    let hasResolve = false;
    if ((_ma = hooks.beforeHandle) == null ? void 0 : _ma.length)
      for (let i = 0; i < hooks.beforeHandle.length; i++) {
        const beforeHandle = hooks.beforeHandle[i], endUnit = reporter.resolveChild(beforeHandle.fn.name), returning = hasReturn(beforeHandle);
        if (beforeHandle.subType === "resolve" || beforeHandle.subType === "mapResolve")
          hasResolve || (hasResolve = true, fnLiteral += `
let resolved
`), fnLiteral += isAsync(beforeHandle) ? `resolved=await e.beforeHandle[${i}](c);
` : `resolved=e.beforeHandle[${i}](c);
`, beforeHandle.subType === "mapResolve" ? fnLiteral += "if(resolved instanceof ElysiaCustomStatusResponse){" + mapResponse2("resolved") + `}else{resolved.request=c.request
resolved.store=c.store
resolved.qi=c.qi
resolved.path=c.path
resolved.url=c.url
resolved.redirect=c.redirect
resolved.set=c.set
resolved.error=c.error
c=resolved}` : fnLiteral += "if(resolved instanceof ElysiaCustomStatusResponse){" + mapResponse2("resolved") + `}else Object.assign(c, resolved)
`, endUnit();
        else if (!returning)
          fnLiteral += isAsync(beforeHandle) ? `await e.beforeHandle[${i}](c)
` : `e.beforeHandle[${i}](c)
`, endUnit();
        else {
          if (fnLiteral += isAsync(beforeHandle) ? `be=await e.beforeHandle[${i}](c)
` : `be=e.beforeHandle[${i}](c)
`, endUnit("be"), fnLiteral += "if(be!==undefined){", reporter.resolve(), ((_na = hooks.afterHandle) == null ? void 0 : _na.length) || hasTrace) {
            report("handle", {
              name: isHandleFn ? handler.name : void 0
            }).resolve();
            const reporter2 = report("afterHandle", {
              total: (_oa = hooks.afterHandle) == null ? void 0 : _oa.length
            });
            if ((_pa = hooks.afterHandle) == null ? void 0 : _pa.length)
              for (let i2 = 0; i2 < hooks.afterHandle.length; i2++) {
                const hook = hooks.afterHandle[i2], returning2 = hasReturn(hook), endUnit2 = reporter2.resolveChild(
                  hook.fn.name
                );
                fnLiteral += `c.response=c.responseValue=be
`, returning2 ? (fnLiteral += isAsync(hook.fn) ? `af=await e.afterHandle[${i2}](c)
` : `af=e.afterHandle[${i2}](c)
`, fnLiteral += `if(af!==undefined) c.response=c.responseValue=be=af
`) : fnLiteral += isAsync(hook.fn) ? `await e.afterHandle[${i2}](c, be)
` : `e.afterHandle[${i2}](c, be)
`, endUnit2("af");
              }
            reporter2.resolve();
          }
          validator.response && (fnLiteral += validation.response("be"));
          const mapResponseReporter = report("mapResponse", {
            total: (_qa = hooks.mapResponse) == null ? void 0 : _qa.length
          });
          if ((_ra = hooks.mapResponse) == null ? void 0 : _ra.length) {
            fnLiteral += `c.response=c.responseValue=be
`;
            for (let i2 = 0; i2 < hooks.mapResponse.length; i2++) {
              const mapResponse22 = hooks.mapResponse[i2], endUnit2 = mapResponseReporter.resolveChild(
                mapResponse22.fn.name
              );
              fnLiteral += `if(mr===undefined){mr=${isAsyncName(mapResponse22) ? "await " : ""}e.mapResponse[${i2}](c)
if(mr!==undefined)be=c.response=c.responseValue=mr}`, endUnit2();
            }
          }
          mapResponseReporter.resolve(), fnLiteral += afterResponse(), fnLiteral += encodeCookie(), fnLiteral += `return mapEarlyResponse(${saveResponse}be,c.set${mapResponseContext})}
`;
        }
      }
    reporter.resolve();
  }
  function reportHandler(name) {
    const handleReporter = report("handle", {
      name,
      alias: "reportHandler"
    });
    return () => {
      var _a4, _b3;
      hasTrace && (fnLiteral += 'if(r&&(r[Symbol.iterator]||r[Symbol.asyncIterator])&&typeof r.next==="function"){' + (maybeAsync ? "" : "(async()=>{") + `const stream=await tee(r,3)
r=stream[0]
` + (((_a4 = hooks.afterHandle) == null ? void 0 : _a4.length) ? `c.response=c.responseValue=r
` : "") + `const listener=stream[1]
` + (hasTrace || ((_b3 = hooks.afterResponse) == null ? void 0 : _b3.length) ? `afterHandlerStreamListener=stream[2]
` : "") + `${setImmediateFn}(async ()=>{if(listener)for await(const v of listener){}
`, handleReporter.resolve(), fnLiteral += "})" + (maybeAsync ? "" : "})()") + "}else{", handleReporter.resolve(), fnLiteral += `}
`);
    };
  }
  if (((_sa = hooks.afterHandle) == null ? void 0 : _sa.length) || hasTrace) {
    const resolveHandler = reportHandler(
      isHandleFn ? handler.name : void 0
    );
    ((_ta = hooks.afterHandle) == null ? void 0 : _ta.length) ? fnLiteral += isAsyncHandler ? `let r=c.response=c.responseValue=await ${handle}
` : `let r=c.response=c.responseValue=${handle}
` : fnLiteral += isAsyncHandler ? `let r=await ${handle}
` : `let r=${handle}
`, resolveHandler();
    const reporter = report("afterHandle", {
      total: (_ua = hooks.afterHandle) == null ? void 0 : _ua.length
    });
    if ((_va = hooks.afterHandle) == null ? void 0 : _va.length)
      for (let i = 0; i < hooks.afterHandle.length; i++) {
        const hook = hooks.afterHandle[i], returning = hasReturn(hook), endUnit = reporter.resolveChild(hook.fn.name);
        returning ? (fnLiteral += isAsync(hook.fn) ? `af=await e.afterHandle[${i}](c)
` : `af=e.afterHandle[${i}](c)
`, endUnit("af"), validator.response ? (fnLiteral += "if(af!==undefined){", reporter.resolve(), fnLiteral += validation.response("af"), fnLiteral += "c.response=c.responseValue=af}") : (fnLiteral += "if(af!==undefined){", reporter.resolve(), fnLiteral += "c.response=c.responseValue=af}")) : (fnLiteral += isAsync(hook.fn) ? `await e.afterHandle[${i}](c)
` : `e.afterHandle[${i}](c)
`, endUnit());
      }
    reporter.resolve(), ((_wa = hooks.afterHandle) == null ? void 0 : _wa.length) && (fnLiteral += `r=c.response
`), validator.response && (fnLiteral += validation.response()), fnLiteral += encodeCookie();
    const mapResponseReporter = report("mapResponse", {
      total: (_xa = hooks.mapResponse) == null ? void 0 : _xa.length
    });
    if ((_ya = hooks.mapResponse) == null ? void 0 : _ya.length)
      for (let i = 0; i < hooks.mapResponse.length; i++) {
        const mapResponse22 = hooks.mapResponse[i], endUnit = mapResponseReporter.resolveChild(
          mapResponse22.fn.name
        );
        fnLiteral += `mr=${isAsyncName(mapResponse22) ? "await " : ""}e.mapResponse[${i}](c)
if(mr!==undefined)r=c.response=c.responseValue=mr
`, endUnit();
      }
    mapResponseReporter.resolve(), fnLiteral += mapResponse2();
  } else {
    const resolveHandler = reportHandler(
      isHandleFn ? handler.name : void 0
    );
    if (validator.response || ((_za = hooks.mapResponse) == null ? void 0 : _za.length) || hasTrace) {
      fnLiteral += isAsyncHandler ? `let r=await ${handle}
` : `let r=${handle}
`, resolveHandler(), validator.response && (fnLiteral += validation.response());
      const mapResponseReporter = report("mapResponse", {
        total: (_Aa = hooks.mapResponse) == null ? void 0 : _Aa.length
      });
      if ((_Ba = hooks.mapResponse) == null ? void 0 : _Ba.length) {
        fnLiteral += `
c.response=c.responseValue=r
`;
        for (let i = 0; i < hooks.mapResponse.length; i++) {
          const mapResponse22 = hooks.mapResponse[i], endUnit = mapResponseReporter.resolveChild(
            mapResponse22.fn.name
          );
          fnLiteral += `
if(mr===undefined){mr=${isAsyncName(mapResponse22) ? "await " : ""}e.mapResponse[${i}](c)
if(mr!==undefined)r=c.response=c.responseValue=mr}
`, endUnit();
        }
      }
      mapResponseReporter.resolve(), fnLiteral += encodeCookie(), handler instanceof Response ? (fnLiteral += afterResponse(), fnLiteral += inference.set ? `if(isNotEmpty(c.set.headers)||c.set.status!==200||c.set.redirect||c.set.cookie)return mapResponse(${saveResponse}${handle}.clone(),c.set${mapResponseContext})
else return ${handle}.clone()` : `return ${handle}.clone()`, fnLiteral += `
`) : fnLiteral += mapResponse2();
    } else if (hasCookie || hasTrace) {
      fnLiteral += isAsyncHandler ? `let r=await ${handle}
` : `let r=${handle}
`, resolveHandler();
      const mapResponseReporter = report("mapResponse", {
        total: (_Ca = hooks.mapResponse) == null ? void 0 : _Ca.length
      });
      if ((_Da = hooks.mapResponse) == null ? void 0 : _Da.length) {
        fnLiteral += `c.response=c.responseValue= r
`;
        for (let i = 0; i < hooks.mapResponse.length; i++) {
          const mapResponse22 = hooks.mapResponse[i], endUnit = mapResponseReporter.resolveChild(
            mapResponse22.fn.name
          );
          fnLiteral += `if(mr===undefined){mr=${isAsyncName(mapResponse22) ? "await " : ""}e.mapResponse[${i}](c)
if(mr!==undefined)r=c.response=c.responseValue=mr}`, endUnit();
        }
      }
      mapResponseReporter.resolve(), fnLiteral += encodeCookie() + mapResponse2();
    } else {
      resolveHandler();
      const handled = isAsyncHandler ? `await ${handle}` : handle;
      handler instanceof Response ? (fnLiteral += afterResponse(), fnLiteral += inference.set ? `if(isNotEmpty(c.set.headers)||c.set.status!==200||c.set.redirect||c.set.cookie)return mapResponse(${saveResponse}${handle}.clone(),c.set${mapResponseContext})
else return ${handle}.clone()
` : `return ${handle}.clone()
`) : fnLiteral += mapResponse2(handled);
    }
  }
  if (fnLiteral += `
}catch(error){`, !maybeAsync && ((_Ea = hooks.error) == null ? void 0 : _Ea.length) && (fnLiteral += "return(async()=>{"), fnLiteral += `const set=c.set
if(!set.status||set.status<300)set.status=error?.status||500
`, hasCookie && (fnLiteral += encodeCookie()), hasTrace && hooks.trace)
    for (let i = 0; i < hooks.trace.length; i++)
      fnLiteral += `report${i}?.resolve(error);reportChild${i}?.(error)
`;
  const errorReporter = report("error", {
    total: (_Fa = hooks.error) == null ? void 0 : _Fa.length
  });
  if ((_Ga = hooks.error) == null ? void 0 : _Ga.length) {
    fnLiteral += `c.error=error
`, hasValidation ? fnLiteral += `if(error instanceof TypeBoxError){c.code="VALIDATION"
c.set.status=422}else{c.code=error.code??error[ERROR_CODE]??"UNKNOWN"}` : fnLiteral += `c.code=error.code??error[ERROR_CODE]??"UNKNOWN"
`, fnLiteral += `let er
`, ((_Ha = hooks.mapResponse) == null ? void 0 : _Ha.length) && (fnLiteral += `let mep
`);
    for (let i = 0; i < hooks.error.length; i++) {
      const endUnit = errorReporter.resolveChild(hooks.error[i].fn.name);
      if (isAsync(hooks.error[i]) ? fnLiteral += `er=await e.error[${i}](c)
` : fnLiteral += `er=e.error[${i}](c)
if(er instanceof Promise)er=await er
`, endUnit(), (_Ia = hooks.mapResponse) == null ? void 0 : _Ia.length) {
        const mapResponseReporter = report("mapResponse", {
          total: (_Ja = hooks.mapResponse) == null ? void 0 : _Ja.length
        });
        for (let i2 = 0; i2 < hooks.mapResponse.length; i2++) {
          const mapResponse22 = hooks.mapResponse[i2], endUnit2 = mapResponseReporter.resolveChild(
            mapResponse22.fn.name
          );
          fnLiteral += `c.response=c.responseValue=er
mep=e.mapResponse[${i2}](c)
if(mep instanceof Promise)mep=await mep
if(mep!==undefined)er=mep
`, endUnit2();
        }
        mapResponseReporter.resolve();
      }
      if (fnLiteral += `er=mapEarlyResponse(er,set${mapResponseContext})
`, fnLiteral += "if(er){", hasTrace && hooks.trace) {
        for (let i2 = 0; i2 < hooks.trace.length; i2++)
          fnLiteral += `report${i2}.resolve()
`;
        errorReporter.resolve();
      }
      fnLiteral += afterResponse(false), fnLiteral += "return er}";
    }
  }
  errorReporter.resolve(), fnLiteral += "return handleError(c,error,true)", !maybeAsync && ((_Ka = hooks.error) == null ? void 0 : _Ka.length) && (fnLiteral += "})()"), fnLiteral += "}";
  const adapterVariables = adapter.inject ? Object.keys(adapter.inject).join(",") + "," : "";
  let init = "const {handler,handleError,hooks:e, " + allocateIf$1("validator,", hasValidation) + "mapResponse,mapCompactResponse,mapEarlyResponse,isNotEmpty,utils:{" + allocateIf$1("parseQuery,", hasBody) + allocateIf$1("parseQueryFromURL,", hasQuery) + "},error:{" + allocateIf$1("ValidationError,", hasValidation) + allocateIf$1("ParseError", hasBody) + "},fileType,schema,definitions,tee,ERROR_CODE," + allocateIf$1("parseCookie,", hasCookie) + allocateIf$1("signCookie,", hasCookie) + allocateIf$1("decodeURIComponent,", hasQuery) + "ElysiaCustomStatusResponse," + allocateIf$1("ELYSIA_TRACE,", hasTrace) + allocateIf$1("ELYSIA_REQUEST_ID,", hasTrace) + allocateIf$1("parser,", (_La = hooks.parse) == null ? void 0 : _La.length) + allocateIf$1("getServer,", inference.server) + allocateIf$1("fileUnions,", fileUnions.length) + adapterVariables + allocateIf$1("TypeBoxError", hasValidation) + `}=hooks
const trace=e.trace
return ${maybeAsync ? "async " : ""}function handle(c){`;
  ((_Ma = hooks.beforeHandle) == null ? void 0 : _Ma.length) && (init += `let be
`), ((_Na = hooks.afterHandle) == null ? void 0 : _Na.length) && (init += `let af
`), ((_Oa = hooks.mapResponse) == null ? void 0 : _Oa.length) && (init += `let mr
`), allowMeta && (init += `c.schema=schema
c.defs=definitions
`), fnLiteral = init + fnLiteral + "}", init = "";
  try {
    return Function(
      "hooks",
      `"use strict";
` + fnLiteral
    )({
      handler,
      hooks: lifeCycleToFn(hooks),
      validator: hasValidation ? validator : void 0,
      // @ts-expect-error
      handleError: app2.handleError,
      mapResponse: adapterHandler.mapResponse,
      mapCompactResponse: adapterHandler.mapCompactResponse,
      mapEarlyResponse: adapterHandler.mapEarlyResponse,
      isNotEmpty,
      utils: {
        parseQuery: hasBody ? parseQuery : void 0,
        parseQueryFromURL: hasQuery ? ((_Pa = validator.query) == null ? void 0 : _Pa.provider) === "standard" ? parseQueryStandardSchema : parseQueryFromURL : void 0
      },
      error: {
        ValidationError: hasValidation ? ValidationError : void 0,
        ParseError: hasBody ? ParseError : void 0
      },
      fileType,
      schema: app2.router.history,
      // @ts-expect-error
      definitions: app2.definitions.type,
      tee,
      ERROR_CODE,
      parseCookie: hasCookie ? parseCookie : void 0,
      signCookie: hasCookie ? signCookie : void 0,
      Cookie: hasCookie ? Cookie : void 0,
      decodeURIComponent: hasQuery ? fastDecodeURIComponent : void 0,
      ElysiaCustomStatusResponse,
      ELYSIA_TRACE: hasTrace ? ELYSIA_TRACE : void 0,
      ELYSIA_REQUEST_ID: hasTrace ? ELYSIA_REQUEST_ID : void 0,
      // @ts-expect-error private property
      getServer: inference.server ? () => app2.getServer() : void 0,
      fileUnions: fileUnions.length ? fileUnions : void 0,
      TypeBoxError: hasValidation ? TypeBoxError : void 0,
      parser: app2["~parser"],
      ...adapter.inject
    });
  } catch (error) {
    const debugHooks = lifeCycleToFn(hooks);
    return console.log("[Composer] failed to generate optimized handler"), console.log("---"), console.log({
      handler: typeof handler == "function" ? handler.toString() : handler,
      instruction: fnLiteral,
      hooks: {
        ...debugHooks,
        // @ts-ignore
        transform: (_Ra = (_Qa = debugHooks == null ? void 0 : debugHooks.transform) == null ? void 0 : _Qa.map) == null ? void 0 : _Ra.call(_Qa, (x) => x.toString()),
        // @ts-ignore
        resolve: (_Ta = (_Sa = debugHooks == null ? void 0 : debugHooks.resolve) == null ? void 0 : _Sa.map) == null ? void 0 : _Ta.call(_Sa, (x) => x.toString()),
        // @ts-ignore
        beforeHandle: (_Va = (_Ua = debugHooks == null ? void 0 : debugHooks.beforeHandle) == null ? void 0 : _Ua.map) == null ? void 0 : _Va.call(
          _Ua,
          (x) => x.toString()
        ),
        // @ts-ignore
        afterHandle: (_Xa = (_Wa = debugHooks == null ? void 0 : debugHooks.afterHandle) == null ? void 0 : _Wa.map) == null ? void 0 : _Xa.call(
          _Wa,
          (x) => x.toString()
        ),
        // @ts-ignore
        mapResponse: (_Za = (_Ya = debugHooks == null ? void 0 : debugHooks.mapResponse) == null ? void 0 : _Ya.map) == null ? void 0 : _Za.call(
          _Ya,
          (x) => x.toString()
        ),
        // @ts-ignore
        parse: (_$a = (__a = debugHooks == null ? void 0 : debugHooks.parse) == null ? void 0 : __a.map) == null ? void 0 : _$a.call(__a, (x) => x.toString()),
        // @ts-ignore
        error: (_bb = (_ab = debugHooks == null ? void 0 : debugHooks.error) == null ? void 0 : _ab.map) == null ? void 0 : _bb.call(_ab, (x) => x.toString()),
        // @ts-ignore
        afterResponse: (_db = (_cb = debugHooks == null ? void 0 : debugHooks.afterResponse) == null ? void 0 : _cb.map) == null ? void 0 : _db.call(
          _cb,
          (x) => x.toString()
        ),
        // @ts-ignore
        stop: (_fb = (_eb = debugHooks == null ? void 0 : debugHooks.stop) == null ? void 0 : _eb.map) == null ? void 0 : _fb.call(_eb, (x) => x.toString())
      },
      validator,
      // @ts-expect-error
      definitions: app2.definitions.type,
      error
    }), console.log("---"), typeof (process == null ? void 0 : process.exit) == "function" && process.exit(1), () => new Response("Internal Server Error", { status: 500 });
  }
}, createOnRequestHandler = (app2, addFn) => {
  var _a3, _b2;
  let fnLiteral = "";
  const reporter = createReport({
    trace: app2.event.trace,
    addFn: (word) => {
      fnLiteral += word;
    }
  })("request", {
    total: (_a3 = app2.event.request) == null ? void 0 : _a3.length
  });
  if ((_b2 = app2.event.request) == null ? void 0 : _b2.length) {
    fnLiteral += "try{";
    for (let i = 0; i < app2.event.request.length; i++) {
      const hook = app2.event.request[i], withReturn = hasReturn(hook), maybeAsync = isAsync(hook), endUnit = reporter.resolveChild(app2.event.request[i].fn.name);
      withReturn ? (fnLiteral += `re=mapEarlyResponse(${maybeAsync ? "await " : ""}onRequest[${i}](c),c.set)
`, endUnit("re"), fnLiteral += `if(re!==undefined)return re
`) : (fnLiteral += `${maybeAsync ? "await " : ""}onRequest[${i}](c)
`, endUnit());
    }
    fnLiteral += "}catch(error){return app.handleError(c,error,false)}";
  }
  return reporter.resolve(), fnLiteral;
}, createHoc = (app2, fnName = "map") => {
  const hoc = app2.extender.higherOrderFunctions;
  if (!hoc.length) return "return " + fnName;
  const adapter = app2["~adapter"].composeGeneralHandler;
  let handler = fnName;
  for (let i = 0; i < hoc.length; i++)
    handler = `hoc[${i}](${handler},${adapter.parameters})`;
  return `return function hocMap(${adapter.parameters}){return ${handler}(${adapter.parameters})}`;
}, composeGeneralHandler = (app2) => {
  var _a3, _b2, _c3, _d2, _e2, _f2, _g2, _h, _i, _j;
  const adapter = app2["~adapter"].composeGeneralHandler;
  app2.router.http.build();
  const isWebstandard = app2["~adapter"].isWebStandard, hasTrace = (_a3 = app2.event.trace) == null ? void 0 : _a3.length;
  let fnLiteral = "";
  const router = app2.router;
  let findDynamicRoute = router.http.root.WS ? "const route=router.find(r.method==='GET'&&r.headers.get('upgrade')==='websocket'?'WS':r.method,p)" : "const route=router.find(r.method,p)";
  findDynamicRoute += router.http.root.ALL ? `??router.find('ALL',p)
` : `
`, isWebstandard && (findDynamicRoute += 'if(r.method==="HEAD"){const route=router.find("GET",p);if(route){c.params=route.params;const _res=route.store.handler?route.store.handler(c):route.store.compile()(c);if(_res)return Promise.resolve(_res).then((_res)=>{if(!_res.headers)_res.headers=new Headers();return getResponseLength(_res).then((length)=>{_res.headers.set("content-length", length);return new Response(null,{status:_res.status,statusText:_res.statusText,headers:_res.headers});})});}}');
  let afterResponse = `c.error=notFound
`;
  if (((_b2 = app2.event.afterResponse) == null ? void 0 : _b2.length) && !app2.event.error) {
    afterResponse = `
c.error=notFound
`;
    const prefix = app2.event.afterResponse.some(isAsync) ? "async" : "";
    afterResponse += `
${setImmediateFn}(${prefix}()=>{if(c.responseValue instanceof ElysiaCustomStatusResponse) c.set.status=c.responseValue.code
`;
    for (let i = 0; i < app2.event.afterResponse.length; i++) {
      const fn2 = app2.event.afterResponse[i].fn;
      afterResponse += `
${isAsyncName(fn2) ? "await " : ""}afterResponse[${i}](c)
`;
    }
    afterResponse += `})
`;
  }
  app2.inference.query && (afterResponse += `
if(c.qi===-1){c.query={}}else{c.query=parseQueryFromURL(c.url,c.qi+1)}`);
  const error404 = adapter.error404(
    !!((_c3 = app2.event.request) == null ? void 0 : _c3.length),
    !!((_d2 = app2.event.error) == null ? void 0 : _d2.length),
    afterResponse
  );
  findDynamicRoute += error404.code, findDynamicRoute += `
c.params=route.params
if(route.store.handler)return route.store.handler(c)
return route.store.compile()(c)
`;
  let switchMap = "";
  for (const [path2, methods] of Object.entries(router.static)) {
    switchMap += `case'${path2}':`, app2.config.strictPath !== true && (switchMap += `case'${getLoosePath(path2)}':`);
    const encoded = encodePath(path2);
    path2 !== encoded && (switchMap += `case'${encoded}':`), switchMap += "switch(r.method){", ("GET" in methods || "WS" in methods) && (switchMap += "case 'GET':", "WS" in methods && (switchMap += `if(r.headers.get('upgrade')==='websocket')return ht[${methods.WS}].composed(c)
`, "GET" in methods || ("ALL" in methods ? switchMap += `return ht[${methods.ALL}].composed(c)
` : switchMap += `break map
`)), "GET" in methods && (switchMap += `return ht[${methods.GET}].composed(c)
`)), isWebstandard && ("GET" in methods || "ALL" in methods) && !("HEAD" in methods) && (switchMap += `case 'HEAD':return Promise.resolve(ht[${methods.GET ?? methods.ALL}].composed(c)).then(_ht=>getResponseLength(_ht).then((length)=>{_ht.headers.set('content-length', length)
return new Response(null,{status:_ht.status,statusText:_ht.statusText,headers:_ht.headers})
}))
`);
    for (const [method, index] of Object.entries(methods))
      method === "ALL" || method === "GET" || method === "WS" || (switchMap += `case '${method}':return ht[${index}].composed(c)
`);
    "ALL" in methods ? switchMap += `default:return ht[${methods.ALL}].composed(c)
` : switchMap += `default:break map
`, switchMap += "}";
  }
  const maybeAsync = !!((_e2 = app2.event.request) == null ? void 0 : _e2.some(isAsync)), adapterVariables = adapter.inject ? Object.keys(adapter.inject).join(",") + "," : "";
  fnLiteral += `
const {app,mapEarlyResponse,NotFoundError,randomId,handleError,status,redirect,getResponseLength,ElysiaCustomStatusResponse,` + // @ts-ignore
  allocateIf$1("parseQueryFromURL,", app2.inference.query) + allocateIf$1("ELYSIA_TRACE,", hasTrace) + allocateIf$1("ELYSIA_REQUEST_ID,", hasTrace) + adapterVariables + `}=data
const store=app.singleton.store
const decorator=app.singleton.decorator
const staticRouter=app.router.static.http
const ht=app.router.history
const router=app.router.http
const trace=app.event.trace?.map(x=>typeof x==='function'?x:x.fn)??[]
const notFound=new NotFoundError()
const hoc=app.extender.higherOrderFunctions.map(x=>x.fn)
`, ((_f2 = app2.event.request) == null ? void 0 : _f2.length) && (fnLiteral += `const onRequest=app.event.request.map(x=>x.fn)
`), ((_g2 = app2.event.afterResponse) == null ? void 0 : _g2.length) && (fnLiteral += `const afterResponse=app.event.afterResponse.map(x=>x.fn)
`), fnLiteral += error404.declare, ((_h = app2.event.trace) == null ? void 0 : _h.length) && (fnLiteral += "const " + app2.event.trace.map((_, i) => `tr${i}=app.event.trace[${i}].fn`).join(",") + `
`), fnLiteral += `${maybeAsync ? "async " : ""}function map(${adapter.parameters}){`, ((_i = app2.event.request) == null ? void 0 : _i.length) && (fnLiteral += `let re
`), fnLiteral += adapter.createContext(app2), ((_j = app2.event.trace) == null ? void 0 : _j.length) && (fnLiteral += "c[ELYSIA_TRACE]=[" + app2.event.trace.map((_, i) => `tr${i}(c)`).join(",") + `]
`), fnLiteral += createOnRequestHandler(app2), switchMap && (fnLiteral += `
map: switch(p){
` + switchMap + "}"), fnLiteral += findDynamicRoute + `}
` + createHoc(app2);
  const handleError = composeErrorHandler(app2);
  app2.handleError = handleError;
  const fn = Function(
    "data",
    `"use strict";
` + fnLiteral
  )({
    app: app2,
    mapEarlyResponse: app2["~adapter"].handler.mapEarlyResponse,
    NotFoundError,
    randomId,
    handleError,
    status,
    redirect,
    getResponseLength,
    ElysiaCustomStatusResponse,
    // @ts-ignore
    parseQueryFromURL: app2.inference.query ? parseQueryFromURL : void 0,
    ELYSIA_TRACE: hasTrace ? ELYSIA_TRACE : void 0,
    ELYSIA_REQUEST_ID: hasTrace ? ELYSIA_REQUEST_ID : void 0,
    ...adapter.inject
  });
  return isBun && Bun.gc(false), fn;
}, composeErrorHandler = (app2) => {
  var _a3, _b2, _c3, _d2, _e2, _f2, _g2, _h, _i, _j;
  const hooks = app2.event;
  let fnLiteral = "";
  const adapter = app2["~adapter"].composeError, adapterVariables = adapter.inject ? Object.keys(adapter.inject).join(",") + "," : "", hasTrace = !!((_a3 = app2.event.trace) == null ? void 0 : _a3.length);
  fnLiteral += "const {mapResponse,ERROR_CODE,ElysiaCustomStatusResponse,ValidationError,TransformDecodeError," + allocateIf$1("onError,", app2.event.error) + allocateIf$1("afterResponse,", app2.event.afterResponse) + allocateIf$1("trace,", app2.event.trace) + allocateIf$1("onMapResponse,", app2.event.mapResponse) + allocateIf$1("ELYSIA_TRACE,", hasTrace) + allocateIf$1("ELYSIA_REQUEST_ID,", hasTrace) + adapterVariables + `}=inject
`, fnLiteral += "return async function(context,error,skipGlobal){", fnLiteral += "", hasTrace && (fnLiteral += `const id=context[ELYSIA_REQUEST_ID]
`);
  const report = createReport({
    context: "context",
    trace: hooks.trace,
    addFn: (word) => {
      fnLiteral += word;
    }
  }), afterResponse = () => {
    var _a4, _b3, _c4, _d3;
    if (!((_a4 = hooks.afterResponse) == null ? void 0 : _a4.length) && !hasTrace) return "";
    let afterResponse2 = "";
    const prefix = ((_b3 = hooks.afterResponse) == null ? void 0 : _b3.some(isAsync)) ? "async" : "";
    afterResponse2 += `
${setImmediateFn}(${prefix}()=>{`;
    const reporter = createReport({
      context: "context",
      trace: hooks.trace,
      addFn: (word) => {
        afterResponse2 += word;
      }
    })("afterResponse", {
      total: (_c4 = hooks.afterResponse) == null ? void 0 : _c4.length,
      name: "context"
    });
    if (((_d3 = hooks.afterResponse) == null ? void 0 : _d3.length) && hooks.afterResponse)
      for (let i = 0; i < hooks.afterResponse.length; i++) {
        const fn = hooks.afterResponse[i].fn, endUnit = reporter.resolveChild(fn.name);
        afterResponse2 += `
${isAsyncName(fn) ? "await " : ""}afterResponse[${i}](context)
`, endUnit();
      }
    return reporter.resolve(), afterResponse2 += `})
`, afterResponse2;
  };
  fnLiteral += `const set=context.set
let _r
if(!context.code)context.code=error.code??error[ERROR_CODE]
if(!(context.error instanceof Error))context.error=error
if(error instanceof ElysiaCustomStatusResponse){set.status=error.status=error.code
error.message=error.response}`, adapter.declare && (fnLiteral += adapter.declare);
  const saveResponse = hasTrace || ((_b2 = hooks.afterResponse) == null ? void 0 : _b2.length) ? "context.response = " : "";
  if (fnLiteral += `if(typeof error?.toResponse==='function'&&!(error instanceof ValidationError)&&!(error instanceof TransformDecodeError)){try{let raw=error.toResponse()
if(typeof raw?.then==='function')raw=await raw
if(raw instanceof Response)set.status=raw.status
context.response=context.responseValue=raw
}catch(toResponseError){
}
}
`, app2.event.error)
    for (let i = 0; i < app2.event.error.length; i++) {
      const handler = app2.event.error[i], response = `${isAsync(handler) ? "await " : ""}onError[${i}](context)
`;
      if (fnLiteral += "if(skipGlobal!==true&&!context.response){", hasReturn(handler)) {
        fnLiteral += `_r=${response}
if(_r!==undefined){if(_r instanceof Response){` + afterResponse() + `return mapResponse(_r,set${adapter.mapResponseContext})}if(_r instanceof ElysiaCustomStatusResponse){error.status=error.code
error.message=error.response}if(set.status===200||!set.status)set.status=error.status
`;
        const mapResponseReporter2 = report("mapResponse", {
          total: (_c3 = hooks.mapResponse) == null ? void 0 : _c3.length,
          name: "context"
        });
        if ((_d2 = hooks.mapResponse) == null ? void 0 : _d2.length)
          for (let i2 = 0; i2 < hooks.mapResponse.length; i2++) {
            const mapResponse2 = hooks.mapResponse[i2], endUnit = mapResponseReporter2.resolveChild(
              mapResponse2.fn.name
            );
            fnLiteral += `context.response=context.responseValue=_r
_r=${isAsyncName(mapResponse2) ? "await " : ""}onMapResponse[${i2}](context)
`, endUnit();
          }
        mapResponseReporter2.resolve(), fnLiteral += afterResponse() + `return mapResponse(${saveResponse}_r,set${adapter.mapResponseContext})}`;
      } else fnLiteral += response;
      fnLiteral += "}";
    }
  fnLiteral += `if(error instanceof ValidationError||error instanceof TransformDecodeError){
if(error.error)error=error.error
set.status=error.status??422
` + afterResponse() + adapter.validationError + `
}
`, fnLiteral += "if(!context.response&&error instanceof Error){" + afterResponse() + adapter.unknownError + `
}`;
  const mapResponseReporter = report("mapResponse", {
    total: (_e2 = hooks.mapResponse) == null ? void 0 : _e2.length,
    name: "context"
  });
  if (fnLiteral += `
if(!context.response)context.response=context.responseValue=error.message??error
`, (_f2 = hooks.mapResponse) == null ? void 0 : _f2.length) {
    fnLiteral += `let mr
`;
    for (let i = 0; i < hooks.mapResponse.length; i++) {
      const mapResponse2 = hooks.mapResponse[i], endUnit = mapResponseReporter.resolveChild(
        mapResponse2.fn.name
      );
      fnLiteral += `if(mr===undefined){mr=${isAsyncName(mapResponse2) ? "await " : ""}onMapResponse[${i}](context)
if(mr!==undefined)error=context.response=context.responseValue=mr}`, endUnit();
    }
  }
  mapResponseReporter.resolve(), fnLiteral += afterResponse() + `
return mapResponse(${saveResponse}error,set${adapter.mapResponseContext})}`;
  const mapFn = (x) => typeof x == "function" ? x : x.fn;
  return Function(
    "inject",
    `"use strict";
` + fnLiteral
  )({
    mapResponse: app2["~adapter"].handler.mapResponse,
    ERROR_CODE,
    ElysiaCustomStatusResponse,
    ValidationError,
    TransformDecodeError,
    onError: (_g2 = app2.event.error) == null ? void 0 : _g2.map(mapFn),
    afterResponse: (_h = app2.event.afterResponse) == null ? void 0 : _h.map(mapFn),
    trace: (_i = app2.event.trace) == null ? void 0 : _i.map(mapFn),
    onMapResponse: (_j = app2.event.mapResponse) == null ? void 0 : _j.map(mapFn),
    ELYSIA_TRACE: hasTrace ? ELYSIA_TRACE : void 0,
    ELYSIA_REQUEST_ID: hasTrace ? ELYSIA_REQUEST_ID : void 0,
    ...adapter.inject
  });
};
const allocateIf = (value, condition) => condition ? value : "", createContext = (app2, route, inference, isInline = false) => {
  var _a3, _b2, _c3, _d2;
  let fnLiteral = "";
  const defaultHeaders = app2.setHeaders, hasTrace = !!((_a3 = app2.event.trace) == null ? void 0 : _a3.length);
  hasTrace && (fnLiteral += `const id=randomId()
`);
  const isDynamic = /[:*]/.test(route.path), getQi = `const u=request.url,s=u.indexOf('/',${((_b2 = app2.config.handler) == null ? void 0 : _b2.standardHostname) ?? true ? 11 : 7}),qi=u.indexOf('?',s+1)
`, needsQuery = inference.query || !!route.hooks.query || !!((_c3 = route.hooks.standaloneValidator) == null ? void 0 : _c3.find(
    (x) => x.query
  )) || ((_d2 = app2.event.request) == null ? void 0 : _d2.length);
  needsQuery && (fnLiteral += getQi);
  const getPath = inference.path ? isDynamic ? "get path(){" + (needsQuery ? "" : getQi) + `if(qi===-1)return u.substring(s)
return u.substring(s,qi)
},` : `path:'${route.path}',` : "";
  fnLiteral += allocateIf("const c=", !isInline) + "{request,store," + allocateIf("qi,", needsQuery) + allocateIf("params:request.params,", isDynamic) + getPath + allocateIf(
    "url:request.url,",
    hasTrace || inference.url || needsQuery
  ) + "redirect,status,set:{headers:" + (isNotEmpty(defaultHeaders) ? "Object.assign({},app.setHeaders)" : "Object.create(null)") + ",status:200}", inference.server && (fnLiteral += ",get server(){return app.getServer()}"), hasTrace && (fnLiteral += ",[ELYSIA_REQUEST_ID]:id");
  {
    let decoratorsLiteral = "";
    for (const key of Object.keys(app2.singleton.decorator))
      decoratorsLiteral += `,'${key}':decorator['${key}']`;
    fnLiteral += decoratorsLiteral;
  }
  return fnLiteral += `}
`, fnLiteral;
}, createBunRouteHandler = (app2, route) => {
  var _a3, _b2, _c3, _d2, _e2, _f2, _g2;
  const hasTrace = !!((_a3 = app2.event.trace) == null ? void 0 : _a3.length), hasHoc = !!app2.extender.higherOrderFunctions.length;
  let inference = sucrose(
    route.hooks,
    // @ts-expect-error
    app2.inference
  );
  inference = sucrose(
    {
      handler: route.handler
    },
    inference
  );
  let fnLiteral = "const handler=data.handler,app=data.app,store=data.store,decorator=data.decorator,redirect=data.redirect,route=data.route,mapEarlyResponse=data.mapEarlyResponse," + allocateIf("randomId=data.randomId,", hasTrace) + allocateIf("ELYSIA_REQUEST_ID=data.ELYSIA_REQUEST_ID,", hasTrace) + allocateIf("ELYSIA_TRACE=data.ELYSIA_TRACE,", hasTrace) + allocateIf("trace=data.trace,", hasTrace) + allocateIf("hoc=data.hoc,", hasHoc) + `status=data.status
`;
  ((_b2 = app2.event.request) == null ? void 0 : _b2.length) && (fnLiteral += `const onRequest=app.event.request.map(x=>x.fn)
`), fnLiteral += `${((_c3 = app2.event.request) == null ? void 0 : _c3.find(isAsync)) ? "async" : ""} function map(request){`;
  const needsQuery = inference.query || !!route.hooks.query || !!((_d2 = route.hooks.standaloneValidator) == null ? void 0 : _d2.find(
    (x) => x.query
  ));
  return hasTrace || needsQuery || ((_e2 = app2.event.request) == null ? void 0 : _e2.length) ? (fnLiteral += createContext(app2, route, inference), fnLiteral += createOnRequestHandler(app2), fnLiteral += "return handler(c)}") : fnLiteral += `return handler(${createContext(app2, route, inference, true)})}`, fnLiteral += createHoc(app2), Function(
    "data",
    fnLiteral
  )({
    app: app2,
    handler: ((_f2 = route.compile) == null ? void 0 : _f2.call(route)) ?? route.composed,
    redirect,
    status,
    // @ts-expect-error private property
    hoc: app2.extender.higherOrderFunctions.map((x) => x.fn),
    store: app2.store,
    decorator: app2.decorator,
    route: route.path,
    randomId: hasTrace ? randomId : void 0,
    ELYSIA_TRACE: hasTrace ? ELYSIA_TRACE : void 0,
    ELYSIA_REQUEST_ID: hasTrace ? ELYSIA_REQUEST_ID : void 0,
    trace: hasTrace ? (_g2 = app2.event.trace) == null ? void 0 : _g2.map((x) => (x == null ? void 0 : x.fn) ?? x) : void 0,
    mapEarlyResponse: mapEarlyResponse$1
  });
};
const createNativeStaticHandler = (handle, hooks, set2) => {
  var _a3, _b2, _c3, _d2;
  if (typeof handle == "function" || handle instanceof Blob) return;
  if (isHTMLBundle(handle)) return () => handle;
  const response = mapResponse$1(
    handle instanceof Response ? handle.clone() : handle instanceof Promise ? handle.then(
      (x) => x instanceof Response ? x.clone() : isHTMLBundle(x) ? () => x : x
    ) : handle,
    set2 ?? {
      headers: {}
    }
  );
  if (!((_a3 = hooks.parse) == null ? void 0 : _a3.length) && !((_b2 = hooks.transform) == null ? void 0 : _b2.length) && !((_c3 = hooks.beforeHandle) == null ? void 0 : _c3.length) && !((_d2 = hooks.afterHandle) == null ? void 0 : _d2.length))
    return response instanceof Promise ? response.then((response2) => {
      if (response2)
        return response2.clone();
    }) : () => response.clone();
};
const websocket = {
  open(ws) {
    var _a3, _b2;
    (_b2 = (_a3 = ws.data).open) == null ? void 0 : _b2.call(_a3, ws);
  },
  message(ws, message) {
    var _a3, _b2;
    (_b2 = (_a3 = ws.data).message) == null ? void 0 : _b2.call(_a3, ws, message);
  },
  drain(ws) {
    var _a3, _b2;
    (_b2 = (_a3 = ws.data).drain) == null ? void 0 : _b2.call(_a3, ws);
  },
  close(ws, code, reason) {
    var _a3, _b2;
    (_b2 = (_a3 = ws.data).close) == null ? void 0 : _b2.call(_a3, ws, code, reason);
  },
  ping(ws) {
    var _a3, _b2;
    (_b2 = (_a3 = ws.data).ping) == null ? void 0 : _b2.call(_a3, ws);
  },
  pong(ws) {
    var _a3, _b2;
    (_b2 = (_a3 = ws.data).pong) == null ? void 0 : _b2.call(_a3, ws);
  }
};
class ElysiaWS {
  constructor(raw, data, body = void 0) {
    var _a3;
    this.raw = raw;
    this.data = data;
    this.body = body;
    this.validator = (_a3 = raw.data) == null ? void 0 : _a3.validator, this.sendText = raw.sendText.bind(raw), this.sendBinary = raw.sendBinary.bind(raw), this.close = raw.close.bind(raw), this.terminate = raw.terminate.bind(raw), this.publishText = raw.publishText.bind(raw), this.publishBinary = raw.publishBinary.bind(raw), this.subscribe = raw.subscribe.bind(raw), this.unsubscribe = raw.unsubscribe.bind(raw), this.isSubscribed = raw.isSubscribed.bind(raw), this.cork = raw.cork.bind(raw), this.remoteAddress = raw.remoteAddress, this.binaryType = raw.binaryType, this.data = raw.data, this.subscriptions = raw.subscriptions, this.send = this.send.bind(this), this.ping = this.ping.bind(this), this.pong = this.pong.bind(this), this.publish = this.publish.bind(this);
  }
  /**
   * Sends a message to the client.
   *
   * @param data The data to send.
   * @param compress Should the data be compressed? If the client does not support compression, this is ignored.
   * @example
   * ws.send("Hello!");
   * ws.send("Compress this.", true);
   * ws.send(new Uint8Array([1, 2, 3, 4]));
   */
  send(data, compress) {
    var _a3;
    return Buffer.isBuffer(data) ? this.raw.send(data, compress) : ((_a3 = this.validator) == null ? void 0 : _a3.Check(data)) === false ? this.raw.send(
      new ValidationError("message", this.validator, data).message
    ) : (typeof data == "object" && (data = JSON.stringify(data)), this.raw.send(data, compress));
  }
  /**
   * Sends a ping.
   *
   * @param data The data to send
   */
  ping(data) {
    var _a3;
    return Buffer.isBuffer(data) ? this.raw.ping(data) : ((_a3 = this.validator) == null ? void 0 : _a3.Check(data)) === false ? this.raw.send(
      new ValidationError("message", this.validator, data).message
    ) : (typeof data == "object" && (data = JSON.stringify(data)), this.raw.ping(data));
  }
  /**
   * Sends a pong.
   *
   * @param data The data to send
   */
  pong(data) {
    var _a3;
    return Buffer.isBuffer(data) ? this.raw.pong(data) : ((_a3 = this.validator) == null ? void 0 : _a3.Check(data)) === false ? this.raw.send(
      new ValidationError("message", this.validator, data).message
    ) : (typeof data == "object" && (data = JSON.stringify(data)), this.raw.pong(data));
  }
  /**
   * Sends a message to subscribers of the topic.
   *
   * @param topic The topic name.
   * @param data The data to send.
   * @param compress Should the data be compressed? If the client does not support compression, this is ignored.
   * @example
   * ws.publish("chat", "Hello!");
   * ws.publish("chat", "Compress this.", true);
   * ws.publish("chat", new Uint8Array([1, 2, 3, 4]));
   */
  publish(topic, data, compress) {
    var _a3;
    return Buffer.isBuffer(data) ? this.raw.publish(
      topic,
      data,
      compress
    ) : ((_a3 = this.validator) == null ? void 0 : _a3.Check(data)) === false ? this.raw.send(
      new ValidationError("message", this.validator, data).message
    ) : (typeof data == "object" && (data = JSON.stringify(data)), this.raw.publish(topic, data, compress));
  }
  get readyState() {
    return this.raw.readyState;
  }
  get id() {
    return this.data.id;
  }
}
const createWSMessageParser = (parse2) => {
  const parsers = typeof parse2 == "function" ? [parse2] : parse2;
  return async function(ws, message) {
    if (typeof message == "string") {
      const start = message == null ? void 0 : message.charCodeAt(0);
      if (start === 34 || start === 47 || start === 91 || start === 123)
        try {
          message = JSON.parse(message);
        } catch {
        }
      else isNumericString(message) ? message = +message : message === "true" ? message = true : message === "false" ? message = false : message === "null" && (message = null);
    }
    if (parsers)
      for (let i = 0; i < parsers.length; i++) {
        let temp = parsers[i](ws, message);
        if (temp instanceof Promise && (temp = await temp), temp !== void 0) return temp;
      }
    return message;
  };
}, createHandleWSResponse = (responseValidator) => {
  const handleWSResponse = (ws, data) => {
    if (data instanceof Promise)
      return data.then((data2) => handleWSResponse(ws, data2));
    if (Buffer.isBuffer(data)) return ws.send(data.toString());
    if (data === void 0) return;
    const validateResponse = responseValidator ? (
      // @ts-ignore
      responseValidator.provider === "standard" ? (data2) => (
        // @ts-ignore
        responseValidator.schema["~standard"].validate(data2).issues
      ) : (data2) => responseValidator.Check(data2) === false
    ) : void 0, send = (datum) => {
      if (validateResponse && validateResponse(datum) === false)
        return ws.send(
          new ValidationError("message", responseValidator, datum).message
        );
      if (typeof datum == "object") return ws.send(JSON.stringify(datum));
      ws.send(datum);
    };
    if (typeof (data == null ? void 0 : data.next) != "function")
      return void send(data);
    const init = data.next();
    if (init instanceof Promise)
      return (async () => {
        const first = await init;
        if (validateResponse && validateResponse(first))
          return ws.send(
            new ValidationError(
              "message",
              responseValidator,
              first
            ).message
          );
        if (send(first.value), !first.done)
          for await (const datum of data) send(datum);
      })();
    if (send(init.value), !init.done) for (const datum of data) send(datum);
  };
  return handleWSResponse;
};
const optionalParam = /:.+?\?(?=\/|$)/, getPossibleParams = (path2) => {
  const match = optionalParam.exec(path2);
  if (!match) return [path2];
  const routes = [], head = path2.slice(0, match.index), param = match[0].slice(0, -1), tail = path2.slice(match.index + match[0].length);
  routes.push(head.slice(0, -1)), routes.push(head + param);
  for (const fragment of getPossibleParams(tail))
    fragment && (fragment.startsWith("/:") || routes.push(head.slice(0, -1) + fragment), routes.push(head + param + fragment));
  return routes;
}, isHTMLBundle = (handle) => typeof handle == "object" && handle !== null && (handle.toString() === "[object HTMLBundle]" || typeof handle.index == "string"), supportedMethods = {
  GET: true,
  HEAD: true,
  OPTIONS: true,
  DELETE: true,
  PATCH: true,
  POST: true,
  PUT: true
}, mapRoutes = (app2) => {
  var _a3, _b2;
  if (!app2.config.aot || app2.config.systemRouter === false) return;
  const routes = {}, add = (route, handler) => {
    const path2 = encodeURI(route.path);
    routes[path2] ? routes[path2][route.method] || (routes[path2][route.method] = handler) : routes[path2] = {
      [route.method]: handler
    };
  }, tree = app2.routeTree;
  for (const route of app2.router.history) {
    if (typeof route.handler != "function") continue;
    const method = route.method;
    if (method === "GET" && `WS_${route.path}` in tree || method === "WS" || route.path.charCodeAt(route.path.length - 1) === 42 || !(method in supportedMethods))
      continue;
    if (method === "ALL") {
      `WS_${route.path}` in tree || (routes[route.path] = ((_b2 = (_a3 = route.hooks) == null ? void 0 : _a3.config) == null ? void 0 : _b2.mount) ? route.hooks.trace || app2.event.trace || // @ts-expect-error private property
      app2.extender.higherOrderFunctions ? createBunRouteHandler(app2, route) : route.hooks.mount || route.handler : route.handler);
      continue;
    }
    let compiled;
    const handler = app2.config.precompile ? createBunRouteHandler(app2, route) : (request) => compiled ? compiled(request) : (compiled = createBunRouteHandler(app2, route))(
      request
    );
    for (const path2 of getPossibleParams(route.path))
      add(
        {
          method,
          path: path2
        },
        handler
      );
  }
  return routes;
}, mergeRoutes = (r1, r2) => {
  if (!r2) return r1;
  for (const key of Object.keys(r2))
    if (r1[key] !== r2[key]) {
      if (!r1[key]) {
        r1[key] = r2[key];
        continue;
      }
      if (r1[key] && r2[key]) {
        if (typeof r1[key] == "function" || r1[key] instanceof Response) {
          r1[key] = r2[key];
          continue;
        }
        r1[key] = {
          ...r1[key],
          ...r2[key]
        };
      }
    }
  return r1;
}, removeTrailingPath = (routes) => {
  for (const key of Object.keys(routes))
    key.length > 1 && key.charCodeAt(key.length - 1) === 47 && (routes[key.slice(0, -1)] = routes[key], delete routes[key]);
  return routes;
}, BunAdapter = {
  ...WebStandardAdapter,
  name: "bun",
  handler: {
    mapResponse: mapResponse$1,
    mapEarlyResponse: mapEarlyResponse$1,
    mapCompactResponse: mapCompactResponse$1,
    createStaticHandler: createStaticHandler$1,
    createNativeStaticHandler
  },
  composeHandler: {
    ...WebStandardAdapter.composeHandler,
    headers: hasHeaderShorthand ? `c.headers=c.request.headers.toJSON()
` : `c.headers={}
for(const [k,v] of c.request.headers.entries())c.headers[k]=v
`
  },
  listen(app2) {
    return (options, callback) => {
      var _a3;
      if (typeof Bun > "u")
        throw new Error(
          ".listen() is designed to run on Bun only. If you are running Elysia in other environment please use a dedicated plugin or export the handler via Elysia.fetch"
        );
      if (app2.compile(), typeof options == "string") {
        if (!isNumericString(options))
          throw new Error("Port must be a numeric value");
        options = parseInt(options);
      }
      const createStaticRoute = (iterator, { withAsync = false } = {}) => {
        const staticRoutes = {}, ops = [];
        for (let [path2, route] of Object.entries(iterator))
          if (path2 = encodeURI(path2), supportPerMethodInlineHandler) {
            if (!route) continue;
            for (const [method, value] of Object.entries(route))
              if (!(!value || !(method in supportedMethods))) {
                if (value instanceof Promise) {
                  withAsync && (staticRoutes[path2] || (staticRoutes[path2] = {}), ops.push(
                    value.then((awaited) => {
                      awaited instanceof Response && (staticRoutes[path2][method] = awaited), isHTMLBundle(awaited) && (staticRoutes[path2][method] = awaited);
                    })
                  ));
                  continue;
                }
                !(value instanceof Response) && !isHTMLBundle(value) || (staticRoutes[path2] || (staticRoutes[path2] = {}), staticRoutes[path2][method] = value);
              }
          } else {
            if (!route) continue;
            if (route instanceof Promise) {
              withAsync && (staticRoutes[path2] || (staticRoutes[path2] = {}), ops.push(
                route.then((awaited) => {
                  awaited instanceof Response && (staticRoutes[path2] = awaited);
                })
              ));
              continue;
            }
            if (!(route instanceof Response)) continue;
            staticRoutes[path2] = route;
          }
        return withAsync ? Promise.all(ops).then(() => staticRoutes) : staticRoutes;
      }, routes = removeTrailingPath(
        mergeRoutes(
          mergeRoutes(
            createStaticRoute(app2.router.response),
            mapRoutes(app2)
          ),
          // @ts-ignore
          (_a3 = app2.config.serve) == null ? void 0 : _a3.routes
        )
      ), serve2 = typeof options == "object" ? {
        development: !isProduction,
        reusePort: true,
        idleTimeout: 30,
        ...app2.config.serve || {},
        ...options || {},
        routes,
        websocket: {
          ...app2.config.websocket || {},
          ...websocket || {},
          ...options.websocket || {}
        },
        fetch: app2.fetch
      } : {
        development: !isProduction,
        reusePort: true,
        idleTimeout: 30,
        ...app2.config.serve || {},
        routes,
        websocket: {
          ...app2.config.websocket || {},
          ...websocket || {}
        },
        port: options,
        fetch: app2.fetch
      };
      if (app2.server = Bun.serve(serve2), app2.event.start)
        for (let i = 0; i < app2.event.start.length; i++)
          app2.event.start[i].fn(app2);
      callback && callback(app2.server), process.on("beforeExit", async () => {
        var _a4, _b2;
        if (app2.server && (await ((_b2 = (_a4 = app2.server).stop) == null ? void 0 : _b2.call(_a4)), app2.server = null, app2.event.stop))
          for (let i = 0; i < app2.event.stop.length; i++)
            app2.event.stop[i].fn(app2);
      }), app2.promisedModules.then(async () => {
        var _a4, _b2;
        app2.config.aot, app2.compile();
        const routes2 = removeTrailingPath(
          mergeRoutes(
            mergeRoutes(
              await createStaticRoute(app2.router.response, {
                withAsync: true
              }),
              mapRoutes(app2)
            ),
            // @ts-ignore
            (_a4 = app2.config.serve) == null ? void 0 : _a4.routes
          )
        );
        (_b2 = app2.server) == null ? void 0 : _b2.reload({
          ...serve2,
          fetch: app2.fetch,
          // @ts-ignore
          routes: routes2
        }), Bun == null ? void 0 : Bun.gc(false);
      });
    };
  },
  async stop(app2, closeActiveConnections) {
    var _a3;
    if (app2.server) {
      if (await app2.server.stop(closeActiveConnections), app2.server = null, (_a3 = app2.event.stop) == null ? void 0 : _a3.length)
        for (let i = 0; i < app2.event.stop.length; i++)
          app2.event.stop[i].fn(app2);
    } else
      console.log(
        "Elysia isn't running. Call `app.listen` to start the server.",
        new Error().stack
      );
  },
  ws(app2, path2, options) {
    const { parse: parse2, body, response, ...rest } = options, messageValidator = getSchemaValidator(body, {
      // @ts-expect-error private property
      modules: app2.definitions.typebox,
      // @ts-expect-error private property
      models: app2.definitions.type,
      normalize: app2.config.normalize
    }), validateMessage = messageValidator ? messageValidator.provider === "standard" ? (data) => messageValidator.schema["~standard"].validate(data).issues : (data) => messageValidator.Check(data) === false : void 0, responseValidator = getSchemaValidator(response, {
      // @ts-expect-error private property
      modules: app2.definitions.typebox,
      // @ts-expect-error private property
      models: app2.definitions.type,
      normalize: app2.config.normalize
    });
    app2.route(
      "WS",
      path2,
      async (context) => {
        const server = context.server ?? app2.server, { set: set2, path: path22, qi, headers, query, params } = context;
        if (context.validator = responseValidator, options.upgrade)
          if (typeof options.upgrade == "function") {
            const temp = options.upgrade(context);
            temp instanceof Promise && await temp;
          } else options.upgrade && Object.assign(
            set2.headers,
            options.upgrade
          );
        if (set2.cookie && isNotEmpty(set2.cookie)) {
          const cookie = serializeCookie(set2.cookie);
          cookie && (set2.headers["set-cookie"] = cookie);
        }
        set2.headers["set-cookie"] && Array.isArray(set2.headers["set-cookie"]) && (set2.headers = parseSetCookies(
          new Headers(set2.headers),
          set2.headers["set-cookie"]
        ));
        const handleResponse2 = createHandleWSResponse(responseValidator), parseMessage = createWSMessageParser(parse2);
        let _id2;
        if (typeof options.beforeHandle == "function") {
          const result = options.beforeHandle(context);
          result instanceof Promise && await result;
        }
        const errorHandlers = [
          ...options.error ? Array.isArray(options.error) ? options.error : [options.error] : [],
          ...(app2.event.error ?? []).map(
            (x) => typeof x == "function" ? x : x.fn
          )
        ].filter((x) => x), hasCustomErrorHandlers = errorHandlers.length > 0, handleErrors = hasCustomErrorHandlers ? async (ws, error) => {
          for (const handleError of errorHandlers) {
            let response2 = handleError(
              Object.assign(context, { error })
            );
            if (response2 instanceof Promise && (response2 = await response2), await handleResponse2(ws, response2), response2) break;
          }
        } : () => {
        };
        if (!(server == null ? void 0 : server.upgrade(context.request, {
          headers: isNotEmpty(set2.headers) ? set2.headers : void 0,
          data: {
            ...context,
            get id() {
              return _id2 || (_id2 = randomId());
            },
            validator: responseValidator,
            ping(ws, data) {
              var _a3;
              (_a3 = options.ping) == null ? void 0 : _a3.call(options, ws, data);
            },
            pong(ws, data) {
              var _a3;
              (_a3 = options.pong) == null ? void 0 : _a3.call(options, ws, data);
            },
            open: async (ws) => {
              var _a3;
              try {
                await handleResponse2(
                  ws,
                  (_a3 = options.open) == null ? void 0 : _a3.call(
                    options,
                    new ElysiaWS(ws, context)
                  )
                );
              } catch (error) {
                handleErrors(ws, error);
              }
            },
            message: async (ws, _message) => {
              var _a3;
              const message = await parseMessage(ws, _message);
              if (validateMessage && validateMessage(message)) {
                const validationError = new ValidationError(
                  "message",
                  messageValidator,
                  message
                );
                return hasCustomErrorHandlers ? handleErrors(ws, validationError) : void ws.send(
                  validationError.message
                );
              }
              try {
                await handleResponse2(
                  ws,
                  (_a3 = options.message) == null ? void 0 : _a3.call(
                    options,
                    new ElysiaWS(
                      ws,
                      context,
                      message
                    ),
                    message
                  )
                );
              } catch (error) {
                handleErrors(ws, error);
              }
            },
            drain: async (ws) => {
              var _a3;
              try {
                await handleResponse2(
                  ws,
                  (_a3 = options.drain) == null ? void 0 : _a3.call(
                    options,
                    new ElysiaWS(ws, context)
                  )
                );
              } catch (error) {
                handleErrors(ws, error);
              }
            },
            close: async (ws, code, reason) => {
              var _a3;
              try {
                await handleResponse2(
                  ws,
                  (_a3 = options.close) == null ? void 0 : _a3.call(
                    options,
                    new ElysiaWS(ws, context),
                    code,
                    reason
                  )
                );
              } catch (error) {
                handleErrors(ws, error);
              }
            }
          }
        })))
          return status(400, "Expected a websocket connection");
      },
      {
        ...rest,
        websocket: options
      }
    );
  }
};
const env = isBun ? Bun.env : typeof process < "u" && process.env ? process.env : {};
const ARRAY_INDEX_REGEX = /^(.+)\[(\d+)\]$/, DANGEROUS_KEYS = /* @__PURE__ */ new Set(["__proto__", "constructor", "prototype"]), isDangerousKey = (key) => {
  if (DANGEROUS_KEYS.has(key)) return true;
  const match = key.match(ARRAY_INDEX_REGEX);
  return match ? DANGEROUS_KEYS.has(match[1]) : false;
}, parseArrayKey = (key) => {
  const match = key.match(ARRAY_INDEX_REGEX);
  return match ? {
    name: match[1],
    index: parseInt(match[2], 10)
  } : null;
}, parseObjectString = (entry) => {
  if (!(typeof entry != "string" || entry.charCodeAt(0) !== 123))
    try {
      const parsed = JSON.parse(entry);
      if (parsed && typeof parsed == "object" && !Array.isArray(parsed))
        return parsed;
    } catch {
      return;
    }
}, setNestedValue = (obj, path2, value) => {
  const keys = path2.split("."), lastKey = keys.pop();
  if (isDangerousKey(lastKey) || keys.some(isDangerousKey)) return;
  let current = obj;
  for (const key of keys) {
    const arrayInfo2 = parseArrayKey(key);
    if (arrayInfo2) {
      Array.isArray(current[arrayInfo2.name]) || (current[arrayInfo2.name] = []);
      const existing = current[arrayInfo2.name][arrayInfo2.index], isFile = typeof File < "u" && existing instanceof File;
      (!existing || typeof existing != "object" || Array.isArray(existing) || isFile) && (current[arrayInfo2.name][arrayInfo2.index] = parseObjectString(existing) ?? {}), current = current[arrayInfo2.name][arrayInfo2.index];
    } else
      (!current[key] || typeof current[key] != "object") && (current[key] = {}), current = current[key];
  }
  const arrayInfo = parseArrayKey(lastKey);
  arrayInfo ? (Array.isArray(current[arrayInfo.name]) || (current[arrayInfo.name] = []), current[arrayInfo.name][arrayInfo.index] = value) : current[lastKey] = value;
}, normalizeFormValue = (value) => {
  if (value.length === 1) {
    const stringValue2 = value[0];
    if (typeof stringValue2 == "string" && (stringValue2.charCodeAt(0) === 123 || stringValue2.charCodeAt(0) === 91))
      try {
        const parsed2 = JSON.parse(stringValue2);
        if (parsed2 && typeof parsed2 == "object")
          return parsed2;
      } catch {
      }
    return value[0];
  }
  const stringValue = value.find(
    (entry) => typeof entry == "string"
  );
  if (!stringValue || typeof File > "u") return value;
  const files = value.filter((entry) => entry instanceof File);
  if (!files.length || stringValue.charCodeAt(0) !== 123) return value;
  let parsed;
  try {
    parsed = JSON.parse(stringValue);
  } catch {
    return value;
  }
  return typeof parsed != "object" || parsed === null ? value : (!("file" in parsed) && files.length === 1 ? parsed.file = files[0] : !("files" in parsed) && files.length > 1 && (parsed.files = files), parsed);
}, injectDefaultValues = (typeChecker, obj) => {
  var _a3;
  let schema = typeChecker.schema;
  if (!schema) return;
  ((_a3 = schema.$defs) == null ? void 0 : _a3[schema.$ref]) && (schema = schema.$defs[schema.$ref]);
  const properties = getSchemaProperties(schema);
  if (properties)
    for (const [key, keySchema] of Object.entries(properties))
      obj[key] ?? (obj[key] = keySchema.default);
}, createDynamicHandler = (app2) => {
  const { mapResponse: mapResponse2, mapEarlyResponse: mapEarlyResponse2 } = app2["~adapter"].handler, defaultHeader = app2.setHeaders;
  return async (request) => {
    var _a3, _b2, _c3, _d2, _e2, _f2, _g2, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H, _I, _J, _K, _L, _M, _N, _O, _P, _Q, _R, _S;
    const url = request.url, s = url.indexOf("/", 11), qi = url.indexOf("?", s + 1), path2 = qi === -1 ? url.substring(s) : url.substring(s, qi), set2 = {
      cookie: {},
      status: 200,
      headers: defaultHeader ? { ...defaultHeader } : {}
    }, context = Object.assign(
      {},
      // @ts-expect-error
      app2.singleton.decorator,
      {
        set: set2,
        // @ts-expect-error
        store: app2.singleton.store,
        request,
        path: path2,
        qi,
        error: status,
        status,
        redirect
      }
    );
    let hooks;
    try {
      if (app2.event.request)
        for (let i = 0; i < app2.event.request.length; i++) {
          const onRequest = app2.event.request[i].fn;
          let response2 = onRequest(context);
          if (response2 instanceof Promise && (response2 = await response2), response2 = mapEarlyResponse2(response2, set2), response2) return context.response = response2;
        }
      const methodKey = request.method === "GET" && ((_a3 = request.headers.get("upgrade")) == null ? void 0 : _a3.toLowerCase()) === "websocket" ? "WS" : request.method, handler = app2.router.dynamic.find(request.method, path2) ?? app2.router.dynamic.find(methodKey, path2) ?? app2.router.dynamic.find("ALL", path2);
      if (!handler)
        throw context.query = qi === -1 ? {} : parseQuery(url.substring(qi + 1)), new NotFoundError();
      const { handle, validator, content, route } = handler.store;
      if (hooks = handler.store.hooks, (_b2 = hooks.config) == null ? void 0 : _b2.mount)
        return await hooks.config.mount(request);
      let body;
      if (request.method !== "GET" && request.method !== "HEAD")
        if (content)
          switch (content) {
            case "application/json":
              body = await request.json();
              break;
            case "text/plain":
              body = await request.text();
              break;
            case "application/x-www-form-urlencoded":
              body = parseQuery(await request.text());
              break;
            case "application/octet-stream":
              body = await request.arrayBuffer();
              break;
            case "multipart/form-data": {
              body = {};
              const form2 = await request.formData(), grouped = /* @__PURE__ */ new Map();
              form2.forEach((v, k) => {
                const list = grouped.get(k);
                list ? list.push(v) : grouped.set(k, [v]);
              });
              for (const [key, value] of grouped) {
                if (body[key]) continue;
                const finalValue = normalizeFormValue(value);
                key.includes(".") || key.includes("[") ? setNestedValue(body, key, finalValue) : body[key] = finalValue;
              }
              break;
            }
          }
        else {
          let contentType;
          if (request.body && (contentType = request.headers.get("content-type")), contentType) {
            const index = contentType.indexOf(";");
            if (index !== -1 && (contentType = contentType.slice(0, index)), context.contentType = contentType, hooks.parse)
              for (let i = 0; i < hooks.parse.length; i++) {
                const hook = hooks.parse[i].fn;
                if (typeof hook == "string")
                  switch (hook) {
                    case "json":
                    case "application/json":
                      body = await request.json();
                      break;
                    case "text":
                    case "text/plain":
                      body = await request.text();
                      break;
                    case "urlencoded":
                    case "application/x-www-form-urlencoded":
                      body = parseQuery(
                        await request.text()
                      );
                      break;
                    case "arrayBuffer":
                    case "application/octet-stream":
                      body = await request.arrayBuffer();
                      break;
                    case "formdata":
                    case "multipart/form-data": {
                      body = {};
                      const form2 = await request.formData(), grouped = /* @__PURE__ */ new Map();
                      form2.forEach((v, k) => {
                        const list = grouped.get(k);
                        list ? list.push(v) : grouped.set(k, [v]);
                      });
                      for (const [key, value] of grouped) {
                        if (body[key]) continue;
                        const finalValue = normalizeFormValue(value);
                        key.includes(".") || key.includes("[") ? setNestedValue(body, key, finalValue) : body[key] = finalValue;
                      }
                      break;
                    }
                    default: {
                      const parser = app2["~parser"][hook];
                      if (parser) {
                        let temp = parser(
                          context,
                          contentType
                        );
                        if (temp instanceof Promise && (temp = await temp), temp) {
                          body = temp;
                          break;
                        }
                      }
                      break;
                    }
                  }
                else {
                  let temp = hook(context, contentType);
                  if (temp instanceof Promise && (temp = await temp), temp) {
                    body = temp;
                    break;
                  }
                }
              }
            if (delete context.contentType, body === void 0)
              switch (contentType) {
                case "application/json":
                  body = await request.json();
                  break;
                case "text/plain":
                  body = await request.text();
                  break;
                case "application/x-www-form-urlencoded":
                  body = parseQuery(await request.text());
                  break;
                case "application/octet-stream":
                  body = await request.arrayBuffer();
                  break;
                case "multipart/form-data": {
                  body = {};
                  const form2 = await request.formData(), grouped = /* @__PURE__ */ new Map();
                  form2.forEach((v, k) => {
                    const list = grouped.get(k);
                    list ? list.push(v) : grouped.set(k, [v]);
                  });
                  for (const [key, value] of grouped) {
                    if (body[key]) continue;
                    const finalValue = normalizeFormValue(value);
                    key.includes(".") || key.includes("[") ? setNestedValue(body, key, finalValue) : body[key] = finalValue;
                  }
                  break;
                }
              }
          }
        }
      context.route = route, context.body = body, context.params = (handler == null ? void 0 : handler.params) || void 0, context.query = qi === -1 ? {} : parseQuery(url.substring(qi + 1)), context.headers = {};
      for (const [key, value] of request.headers.entries())
        context.headers[key] = value;
      const cookieMeta = {
        domain: ((_c3 = app2.config.cookie) == null ? void 0 : _c3.domain) ?? // @ts-expect-error
        ((_d2 = validator == null ? void 0 : validator.cookie) == null ? void 0 : _d2.config.domain),
        expires: ((_e2 = app2.config.cookie) == null ? void 0 : _e2.expires) ?? // @ts-expect-error
        ((_f2 = validator == null ? void 0 : validator.cookie) == null ? void 0 : _f2.config.expires),
        httpOnly: ((_g2 = app2.config.cookie) == null ? void 0 : _g2.httpOnly) ?? // @ts-expect-error
        ((_h = validator == null ? void 0 : validator.cookie) == null ? void 0 : _h.config.httpOnly),
        maxAge: ((_i = app2.config.cookie) == null ? void 0 : _i.maxAge) ?? // @ts-expect-error
        ((_j = validator == null ? void 0 : validator.cookie) == null ? void 0 : _j.config.maxAge),
        // @ts-expect-error
        path: ((_k = app2.config.cookie) == null ? void 0 : _k.path) ?? ((_l = validator == null ? void 0 : validator.cookie) == null ? void 0 : _l.config.path),
        priority: ((_m = app2.config.cookie) == null ? void 0 : _m.priority) ?? // @ts-expect-error
        ((_n = validator == null ? void 0 : validator.cookie) == null ? void 0 : _n.config.priority),
        partitioned: ((_o = app2.config.cookie) == null ? void 0 : _o.partitioned) ?? // @ts-expect-error
        ((_p = validator == null ? void 0 : validator.cookie) == null ? void 0 : _p.config.partitioned),
        sameSite: ((_q = app2.config.cookie) == null ? void 0 : _q.sameSite) ?? // @ts-expect-error
        ((_r = validator == null ? void 0 : validator.cookie) == null ? void 0 : _r.config.sameSite),
        secure: ((_s = app2.config.cookie) == null ? void 0 : _s.secure) ?? // @ts-expect-error
        ((_t = validator == null ? void 0 : validator.cookie) == null ? void 0 : _t.config.secure),
        secrets: ((_u = app2.config.cookie) == null ? void 0 : _u.secrets) ?? // @ts-expect-error
        ((_v = validator == null ? void 0 : validator.cookie) == null ? void 0 : _v.config.secrets),
        // @ts-expect-error
        sign: ((_w = app2.config.cookie) == null ? void 0 : _w.sign) ?? ((_x = validator == null ? void 0 : validator.cookie) == null ? void 0 : _x.config.sign)
      }, cookieHeaderValue = request.headers.get("cookie");
      context.cookie = await parseCookie(
        context.set,
        cookieHeaderValue,
        cookieMeta
      );
      const headerValidator = (_y = validator == null ? void 0 : validator.createHeaders) == null ? void 0 : _y.call(validator);
      headerValidator && injectDefaultValues(headerValidator, context.headers);
      const paramsValidator = (_z = validator == null ? void 0 : validator.createParams) == null ? void 0 : _z.call(validator);
      paramsValidator && injectDefaultValues(paramsValidator, context.params);
      const queryValidator = (_A = validator == null ? void 0 : validator.createQuery) == null ? void 0 : _A.call(validator);
      if (queryValidator && injectDefaultValues(queryValidator, context.query), hooks.transform)
        for (let i = 0; i < hooks.transform.length; i++) {
          const hook = hooks.transform[i];
          let response2 = hook.fn(context);
          if (response2 instanceof Promise && (response2 = await response2), response2 instanceof ElysiaCustomStatusResponse) {
            const result = mapEarlyResponse2(response2, context.set);
            if (result)
              return context.response = result;
          }
          hook.subType === "derive" && Object.assign(context, response2);
        }
      if (validator) {
        if (headerValidator) {
          const _header = structuredClone(context.headers);
          for (const [key, value] of request.headers)
            _header[key] = value;
          if (validator.headers.Check(_header) === false)
            throw new ValidationError(
              "header",
              validator.headers,
              _header
            );
        } else ((_B = validator.headers) == null ? void 0 : _B.Decode) && (context.headers = validator.headers.Decode(context.headers));
        if ((paramsValidator == null ? void 0 : paramsValidator.Check(context.params)) === false)
          throw new ValidationError(
            "params",
            validator.params,
            context.params
          );
        if (((_C = validator.params) == null ? void 0 : _C.Decode) && (context.params = validator.params.Decode(context.params)), (_D = validator.query) == null ? void 0 : _D.schema) {
          let schema = validator.query.schema;
          ((_E = schema.$defs) == null ? void 0 : _E[schema.$ref]) && (schema = schema.$defs[schema.$ref]);
          const properties = getSchemaProperties(schema);
          if (properties)
            for (const property of Object.keys(properties)) {
              const value = properties[property];
              (value.type === "array" || ((_F = value.items) == null ? void 0 : _F.type) === "string") && typeof context.query[property] == "string" && context.query[property] && (context.query[property] = context.query[property].split(","));
            }
        }
        if ((queryValidator == null ? void 0 : queryValidator.Check(context.query)) === false)
          throw new ValidationError(
            "query",
            validator.query,
            context.query
          );
        if (((_G = validator.query) == null ? void 0 : _G.Decode) && (context.query = validator.query.Decode(context.query)), (_H = validator.createCookie) == null ? void 0 : _H.call(validator)) {
          let cookieValue = {};
          for (const [key, value] of Object.entries(context.cookie))
            cookieValue[key] = value.value;
          if (validator.cookie.Check(cookieValue) === false)
            throw new ValidationError(
              "cookie",
              validator.cookie,
              cookieValue
            );
          ((_I = validator.cookie) == null ? void 0 : _I.Decode) && (cookieValue = validator.cookie.Decode(
            cookieValue
          ));
        }
        if (((_K = (_J = validator.createBody) == null ? void 0 : _J.call(validator)) == null ? void 0 : _K.Check(body)) === false)
          throw new ValidationError("body", validator.body, body);
        if ((_L = validator.body) == null ? void 0 : _L.Decode) {
          let decoded = validator.body.Decode(body);
          decoded instanceof Promise && (decoded = await decoded), context.body = (decoded == null ? void 0 : decoded.value) ?? decoded;
        }
      }
      if (hooks.beforeHandle)
        for (let i = 0; i < hooks.beforeHandle.length; i++) {
          const hook = hooks.beforeHandle[i];
          let response2 = hook.fn(context);
          if (response2 instanceof Promise && (response2 = await response2), response2 instanceof ElysiaCustomStatusResponse) {
            const result = mapEarlyResponse2(response2, context.set);
            if (result)
              return context.response = result;
          }
          if (hook.subType === "resolve") {
            Object.assign(context, response2);
            continue;
          }
          if (response2 !== void 0) {
            if (context.response = response2, hooks.afterHandle)
              for (let i2 = 0; i2 < hooks.afterHandle.length; i2++) {
                let newResponse = hooks.afterHandle[i2].fn(
                  context
                );
                newResponse instanceof Promise && (newResponse = await newResponse), newResponse && (response2 = newResponse);
              }
            const result = mapEarlyResponse2(response2, context.set);
            if (result) return context.response = result;
          }
        }
      let response = typeof handle == "function" ? handle(context) : handle;
      if (response instanceof Promise && (response = await response), (_M = hooks.afterHandle) == null ? void 0 : _M.length) {
        context.response = response;
        for (let i = 0; i < hooks.afterHandle.length; i++) {
          let response2 = hooks.afterHandle[i].fn(
            context
          );
          response2 instanceof Promise && (response2 = await response2);
          const isCustomStatuResponse = response2 instanceof ElysiaCustomStatusResponse, status2 = isCustomStatuResponse ? response2.code : set2.status ? typeof set2.status == "string" ? StatusMap[set2.status] : set2.status : 200;
          isCustomStatuResponse && (set2.status = status2, response2 = response2.response);
          const responseValidator = (_O = (_N = validator == null ? void 0 : validator.createResponse) == null ? void 0 : _N.call(validator)) == null ? void 0 : _O[status2];
          if ((responseValidator == null ? void 0 : responseValidator.Check(response2)) === false)
            if (responseValidator == null ? void 0 : responseValidator.Clean)
              try {
                const temp = responseValidator.Clean(response2);
                if ((responseValidator == null ? void 0 : responseValidator.Check(temp)) === false)
                  throw new ValidationError(
                    "response",
                    responseValidator,
                    response2
                  );
                response2 = temp;
              } catch (error) {
                throw error instanceof ValidationError ? error : new ValidationError(
                  "response",
                  responseValidator,
                  response2
                );
              }
            else
              throw new ValidationError(
                "response",
                responseValidator,
                response2
              );
          if ((responseValidator == null ? void 0 : responseValidator.Encode) && (context.response = response2 = responseValidator.Encode(response2)), responseValidator == null ? void 0 : responseValidator.Clean)
            try {
              context.response = response2 = responseValidator.Clean(response2);
            } catch {
            }
          const result = mapEarlyResponse2(response2, context.set);
          if (result !== void 0) return context.response = result;
        }
      } else {
        const isCustomStatuResponse = response instanceof ElysiaCustomStatusResponse, status2 = isCustomStatuResponse ? response.code : set2.status ? typeof set2.status == "string" ? StatusMap[set2.status] : set2.status : 200;
        isCustomStatuResponse && (set2.status = status2, response = response.response);
        const responseValidator = (_Q = (_P = validator == null ? void 0 : validator.createResponse) == null ? void 0 : _P.call(validator)) == null ? void 0 : _Q[status2];
        if ((responseValidator == null ? void 0 : responseValidator.Check(response)) === false)
          if (responseValidator == null ? void 0 : responseValidator.Clean)
            try {
              const temp = responseValidator.Clean(response);
              if ((responseValidator == null ? void 0 : responseValidator.Check(temp)) === false)
                throw new ValidationError(
                  "response",
                  responseValidator,
                  response
                );
              response = temp;
            } catch (error) {
              throw error instanceof ValidationError ? error : new ValidationError(
                "response",
                responseValidator,
                response
              );
            }
          else
            throw new ValidationError(
              "response",
              responseValidator,
              response
            );
        if ((responseValidator == null ? void 0 : responseValidator.Encode) && (response = responseValidator.Encode(response)), responseValidator == null ? void 0 : responseValidator.Clean)
          try {
            response = responseValidator.Clean(response);
          } catch {
          }
      }
      if (context.set.cookie && (cookieMeta == null ? void 0 : cookieMeta.sign)) {
        const secret = cookieMeta.secrets ? typeof cookieMeta.secrets == "string" ? cookieMeta.secrets : cookieMeta.secrets[0] : void 0;
        if (cookieMeta.sign === true) {
          if (secret)
            for (const [key, cookie] of Object.entries(
              context.set.cookie
            ))
              context.set.cookie[key].value = await signCookie(
                cookie.value,
                secret
              );
        } else {
          const properties = getSchemaProperties((_R = validator == null ? void 0 : validator.cookie) == null ? void 0 : _R.schema);
          if (secret)
            for (const name of cookieMeta.sign)
              !properties || !(name in properties) || ((_S = context.set.cookie[name]) == null ? void 0 : _S.value) && (context.set.cookie[name].value = await signCookie(
                context.set.cookie[name].value,
                secret
              ));
        }
      }
      return mapResponse2(context.response = response, context.set);
    } catch (error) {
      const reportedError = error instanceof TransformDecodeError && error.error ? error.error : error;
      return app2.handleError(context, reportedError);
    } finally {
      const afterResponses = hooks ? hooks.afterResponse : app2.event.afterResponse;
      afterResponses && (hasSetImmediate ? setImmediate(async () => {
        for (const afterResponse of afterResponses)
          await afterResponse.fn(context);
      }) : Promise.resolve().then(async () => {
        for (const afterResponse of afterResponses)
          await afterResponse.fn(context);
      }));
    }
  };
}, createDynamicErrorHandler = (app2) => {
  const { mapResponse: mapResponse2 } = app2["~adapter"].handler;
  return async (context, error) => {
    const errorContext = Object.assign(context, { error, code: error.code });
    if (errorContext.set = context.set, // @ts-expect-error
    typeof (error == null ? void 0 : error.toResponse) == "function" && !(error instanceof ValidationError) && !(error instanceof TransformDecodeError))
      try {
        let raw = error.toResponse();
        typeof (raw == null ? void 0 : raw.then) == "function" && (raw = await raw), raw instanceof Response && (context.set.status = raw.status), context.response = raw;
      } catch {
      }
    if (!context.response && app2.event.error)
      for (let i = 0; i < app2.event.error.length; i++) {
        let response = app2.event.error[i].fn(errorContext);
        if (response instanceof Promise && (response = await response), response != null)
          return context.response = mapResponse2(
            response,
            context.set
          );
      }
    if (context.response) {
      if (app2.event.mapResponse)
        for (let i = 0; i < app2.event.mapResponse.length; i++) {
          let response = app2.event.mapResponse[i].fn(errorContext);
          response instanceof Promise && (response = await response), response != null && (context.response = response);
        }
      return mapResponse2(context.response, context.set);
    }
    return context.set.status = error.status ?? 500, mapResponse2(
      typeof error.cause == "string" ? error.cause : error.message,
      context.set
    );
  };
};
var _a2;
_a2 = Symbol.dispose;
const _Elysia = class _Elysia2 {
  constructor(config = {}) {
    this.server = null;
    this.dependencies = {};
    this["~Prefix"] = "";
    this["~Singleton"] = null;
    this["~Definitions"] = null;
    this["~Metadata"] = null;
    this["~Ephemeral"] = null;
    this["~Volatile"] = null;
    this["~Routes"] = null;
    this.singleton = {
      decorator: {},
      store: {},
      derive: {},
      resolve: {}
    };
    this.definitions = {
      typebox: t.Module({}),
      type: {},
      error: {}
    };
    this.extender = {
      macro: {},
      higherOrderFunctions: []
    };
    this.validator = {
      global: null,
      scoped: null,
      local: null,
      getCandidate() {
        return !this.global && !this.scoped && !this.local ? {
          body: void 0,
          headers: void 0,
          params: void 0,
          query: void 0,
          cookie: void 0,
          response: void 0
        } : mergeSchemaValidator(
          mergeSchemaValidator(this.global, this.scoped),
          this.local
        );
      }
    };
    this.standaloneValidator = {
      global: null,
      scoped: null,
      local: null
    };
    this.event = {};
    this.router = {
      "~http": void 0,
      get http() {
        return this["~http"] || (this["~http"] = new Memoirist({
          lazy: true,
          onParam: fastDecodeURIComponent
        })), this["~http"];
      },
      "~dynamic": void 0,
      // Use in non-AOT mode
      get dynamic() {
        return this["~dynamic"] || (this["~dynamic"] = new Memoirist({
          onParam: fastDecodeURIComponent
        })), this["~dynamic"];
      },
      // Static Router
      static: {},
      // Native Static Response
      response: {},
      history: []
    };
    this.routeTree = {};
    this.inference = {
      body: false,
      cookie: false,
      headers: false,
      query: false,
      set: false,
      server: false,
      path: false,
      route: false,
      url: false
    };
    this["~parser"] = {};
    this.handle = async (request) => this.fetch(request);
    this.handleError = async (context, error) => (this.handleError = this.config.aot ? composeErrorHandler(this) : createDynamicErrorHandler(this))(context, error);
    this.listen = (options, callback) => (this["~adapter"].listen(this)(options, callback), this);
    this.stop = async (closeActiveConnections) => {
      var _a3, _b2;
      return await ((_b2 = (_a3 = this["~adapter"]).stop) == null ? void 0 : _b2.call(_a3, this, closeActiveConnections)), this;
    };
    this[_a2] = () => {
      this.server && this.stop();
    };
    config.tags && (config.detail ? config.detail.tags = config.tags : config.detail = {
      tags: config.tags
    }), this.config = {
      aot: env.ELYSIA_AOT !== "false",
      nativeStaticResponse: true,
      encodeSchema: true,
      normalize: true,
      ...config,
      prefix: config.prefix ? config.prefix.charCodeAt(0) === 47 ? config.prefix : `/${config.prefix}` : void 0,
      cookie: {
        path: "/",
        ...config == null ? void 0 : config.cookie
      },
      experimental: (config == null ? void 0 : config.experimental) ?? {},
      seed: (config == null ? void 0 : config.seed) === void 0 ? "" : config == null ? void 0 : config.seed
    }, this["~adapter"] = config.adapter ?? (typeof Bun < "u" ? BunAdapter : WebStandardAdapter), (config == null ? void 0 : config.analytic) && ((config == null ? void 0 : config.name) || (config == null ? void 0 : config.seed) !== void 0) && (this.telemetry = {
      stack: new Error().stack
    });
  }
  get store() {
    return this.singleton.store;
  }
  get decorator() {
    return this.singleton.decorator;
  }
  get routes() {
    return this.router.history;
  }
  getGlobalRoutes() {
    return this.router.history;
  }
  getGlobalDefinitions() {
    return this.definitions;
  }
  getServer() {
    return this.server;
  }
  getParent() {
    return null;
  }
  get promisedModules() {
    return this._promisedModules || (this._promisedModules = new PromiseGroup(console.error, () => {
    })), this._promisedModules;
  }
  env(model, _env = env) {
    if (getSchemaValidator(model, {
      modules: this.definitions.typebox,
      dynamic: true,
      additionalProperties: true,
      coerce: true,
      sanitize: () => this.config.sanitize
    }).Check(_env) === false) {
      const error = new ValidationError("env", model, _env);
      throw new Error(error.all.map((x) => x.summary).join(`
`));
    }
    return this;
  }
  /**
   * @private DO_NOT_USE_OR_YOU_WILL_BE_FIRED
   * @version 1.1.0
   *
   * ! Do not use unless you know exactly what you are doing
   * ? Add Higher order function to Elysia.fetch
   */
  wrap(fn) {
    return this.extender.higherOrderFunctions.push({
      checksum: checksum(
        JSON.stringify({
          name: this.config.name,
          seed: this.config.seed,
          content: fn.toString()
        })
      ),
      fn
    }), this;
  }
  get models() {
    const models = {};
    for (const name of Object.keys(this.definitions.type))
      models[name] = getSchemaValidator(
        this.definitions.typebox.Import(name),
        {
          models: this.definitions.type
        }
      );
    return models.modules = this.definitions.typebox, models;
  }
  add(method, path2, handle, localHook, options) {
    const skipPrefix = (options == null ? void 0 : options.skipPrefix) ?? false, allowMeta = (options == null ? void 0 : options.allowMeta) ?? false;
    localHook ?? (localHook = {}), this.applyMacro(localHook);
    let standaloneValidators = [];
    if (localHook.standaloneValidator && (standaloneValidators = standaloneValidators.concat(
      localHook.standaloneValidator
    )), this.standaloneValidator.local && (standaloneValidators = standaloneValidators.concat(
      this.standaloneValidator.local
    )), this.standaloneValidator.scoped && (standaloneValidators = standaloneValidators.concat(
      this.standaloneValidator.scoped
    )), this.standaloneValidator.global && (standaloneValidators = standaloneValidators.concat(
      this.standaloneValidator.global
    )), path2 !== "" && path2.charCodeAt(0) !== 47 && (path2 = "/" + path2), this.config.prefix && !skipPrefix && (path2 = this.config.prefix + path2), localHook == null ? void 0 : localHook.type)
      switch (localHook.type) {
        case "text":
          localHook.type = "text/plain";
          break;
        case "json":
          localHook.type = "application/json";
          break;
        case "formdata":
          localHook.type = "multipart/form-data";
          break;
        case "urlencoded":
          localHook.type = "application/x-www-form-urlencoded";
          break;
        case "arrayBuffer":
          localHook.type = "application/octet-stream";
          break;
      }
    const instanceValidator = this.validator.getCandidate(), cloned = {
      body: (localHook == null ? void 0 : localHook.body) ?? (instanceValidator == null ? void 0 : instanceValidator.body),
      headers: (localHook == null ? void 0 : localHook.headers) ?? (instanceValidator == null ? void 0 : instanceValidator.headers),
      params: (localHook == null ? void 0 : localHook.params) ?? (instanceValidator == null ? void 0 : instanceValidator.params),
      query: (localHook == null ? void 0 : localHook.query) ?? (instanceValidator == null ? void 0 : instanceValidator.query),
      cookie: (localHook == null ? void 0 : localHook.cookie) ?? (instanceValidator == null ? void 0 : instanceValidator.cookie),
      response: (localHook == null ? void 0 : localHook.response) ?? (instanceValidator == null ? void 0 : instanceValidator.response)
    }, shouldPrecompile = this.config.precompile === true || typeof this.config.precompile == "object" && this.config.precompile.compose === true, createValidator = () => {
      const models = this.definitions.type, dynamic = !this.config.aot, normalize = this.config.normalize, modules = this.definitions.typebox, sanitize2 = () => this.config.sanitize, cookieValidator = () => {
        var _a3;
        if (cloned.cookie || standaloneValidators.find((x) => x.cookie))
          return getCookieValidator({
            modules,
            validator: cloned.cookie,
            defaultConfig: this.config.cookie,
            normalize,
            config: ((_a3 = cloned.cookie) == null ? void 0 : _a3.config) ?? {},
            dynamic,
            models,
            validators: standaloneValidators.map((x) => x.cookie),
            sanitize: sanitize2
          });
      };
      return shouldPrecompile ? {
        body: getSchemaValidator(cloned.body, {
          modules,
          dynamic,
          models,
          normalize,
          additionalCoerce: (() => {
            const resolved = resolveSchema(
              cloned.body,
              models,
              modules
            );
            return resolved && Kind$1 in resolved && (hasType("File", resolved) || hasType("Files", resolved)) ? coerceFormData() : coercePrimitiveRoot();
          })(),
          validators: standaloneValidators.map((x) => x.body),
          sanitize: sanitize2
        }),
        headers: getSchemaValidator(cloned.headers, {
          modules,
          dynamic,
          models,
          additionalProperties: true,
          coerce: true,
          additionalCoerce: stringToStructureCoercions(),
          validators: standaloneValidators.map(
            (x) => x.headers
          ),
          sanitize: sanitize2
        }),
        params: getSchemaValidator(cloned.params, {
          modules,
          dynamic,
          models,
          coerce: true,
          additionalCoerce: stringToStructureCoercions(),
          validators: standaloneValidators.map(
            (x) => x.params
          ),
          sanitize: sanitize2
        }),
        query: getSchemaValidator(cloned.query, {
          modules,
          dynamic,
          models,
          normalize,
          coerce: true,
          additionalCoerce: queryCoercions(),
          validators: standaloneValidators.map(
            (x) => x.query
          ),
          sanitize: sanitize2
        }),
        cookie: cookieValidator(),
        response: getResponseSchemaValidator(cloned.response, {
          modules,
          dynamic,
          models,
          normalize,
          validators: standaloneValidators.map(
            (x) => x.response
          ),
          sanitize: sanitize2
        })
      } : {
        createBody() {
          return this.body ? this.body : this.body = getSchemaValidator(
            cloned.body,
            {
              modules,
              dynamic,
              models,
              normalize,
              additionalCoerce: (() => {
                const resolved = resolveSchema(
                  cloned.body,
                  models,
                  modules
                );
                return resolved && Kind$1 in resolved && (hasType("File", resolved) || hasType("Files", resolved)) ? coerceFormData() : coercePrimitiveRoot();
              })(),
              validators: standaloneValidators.map(
                (x) => x.body
              ),
              sanitize: sanitize2
            }
          );
        },
        createHeaders() {
          return this.headers ? this.headers : this.headers = getSchemaValidator(
            cloned.headers,
            {
              modules,
              dynamic,
              models,
              normalize,
              additionalProperties: !normalize,
              coerce: true,
              additionalCoerce: stringToStructureCoercions(),
              validators: standaloneValidators.map(
                (x) => x.headers
              ),
              sanitize: sanitize2
            }
          );
        },
        createParams() {
          return this.params ? this.params : this.params = getSchemaValidator(
            cloned.params,
            {
              modules,
              dynamic,
              models,
              normalize,
              coerce: true,
              additionalCoerce: stringToStructureCoercions(),
              validators: standaloneValidators.map(
                (x) => x.params
              ),
              sanitize: sanitize2
            }
          );
        },
        createQuery() {
          return this.query ? this.query : this.query = getSchemaValidator(
            cloned.query,
            {
              modules,
              dynamic,
              models,
              normalize,
              coerce: true,
              additionalCoerce: queryCoercions(),
              validators: standaloneValidators.map(
                (x) => x.query
              ),
              sanitize: sanitize2
            }
          );
        },
        createCookie() {
          return this.cookie ? this.cookie : this.cookie = cookieValidator();
        },
        createResponse() {
          return this.response ? this.response : this.response = getResponseSchemaValidator(
            cloned.response,
            {
              modules,
              dynamic,
              models,
              normalize,
              validators: standaloneValidators.map(
                (x) => x.response
              ),
              sanitize: sanitize2
            }
          );
        }
      };
    };
    (instanceValidator.body || instanceValidator.cookie || instanceValidator.headers || instanceValidator.params || instanceValidator.query || instanceValidator.response) && (localHook = mergeHook(localHook, instanceValidator)), localHook.tags && (localHook.detail ? localHook.detail.tags = localHook.tags : localHook.detail = {
      tags: localHook.tags
    }), isNotEmpty(this.config.detail) && (localHook.detail = mergeDeep(
      Object.assign({}, this.config.detail),
      localHook.detail
    ));
    const hooks = isNotEmpty(this.event) ? mergeHook(this.event, localHookToLifeCycleStore(localHook)) : { ...lifeCycleToArray(localHookToLifeCycleStore(localHook)) };
    if (standaloneValidators.length && Object.assign(hooks, {
      standaloneValidator: standaloneValidators
    }), this.config.aot === false) {
      const validator = createValidator();
      this.router.dynamic.add(method, path2, {
        validator,
        hooks,
        content: localHook == null ? void 0 : localHook.type,
        handle,
        route: path2
      });
      const encoded = encodePath(path2, { dynamic: true });
      if (path2 !== encoded && this.router.dynamic.add(method, encoded, {
        validator,
        hooks,
        content: localHook == null ? void 0 : localHook.type,
        handle,
        route: path2
      }), !this.config.strictPath) {
        const loosePath = getLoosePath(path2);
        this.router.dynamic.add(method, loosePath, {
          validator,
          hooks,
          content: localHook == null ? void 0 : localHook.type,
          handle,
          route: path2
        });
        const encoded2 = encodePath(loosePath);
        loosePath !== encoded2 && this.router.dynamic.add(method, loosePath, {
          validator,
          hooks,
          content: localHook == null ? void 0 : localHook.type,
          handle,
          route: path2
        });
      }
      this.router.history.push({
        method,
        path: path2,
        composed: null,
        handler: handle,
        compile: void 0,
        hooks
      });
      return;
    }
    const adapter = this["~adapter"].handler, nativeStaticHandler = typeof handle != "function" ? () => {
      var _a3, _b2, _c3;
      const context = {
        redirect,
        request: this["~adapter"].isWebStandard ? new Request(`http://ely.sia${path2}`, {
          method
        }) : void 0,
        server: null,
        set: {
          headers: Object.assign({}, this.setHeaders)
        },
        status,
        store: this.store
      };
      try {
        (_a3 = this.event.request) == null ? void 0 : _a3.map((x) => {
          if (typeof x.fn == "function")
            return x.fn(context);
          if (typeof x == "function") return x(context);
        });
      } catch (error) {
        let res;
        context.error = error, (_b2 = this.event.error) == null ? void 0 : _b2.some((x) => {
          if (typeof x.fn == "function")
            return res = x.fn(context);
          if (typeof x == "function")
            return res = x(context);
        }), res !== void 0 && (handle = res);
      }
      const fn = (_c3 = adapter.createNativeStaticHandler) == null ? void 0 : _c3.call(
        adapter,
        handle,
        hooks,
        context.set
      );
      return fn instanceof Promise ? fn.then((fn2) => {
        if (fn2) return fn2;
      }) : fn == null ? void 0 : fn();
    } : void 0, useNativeStaticResponse = this.config.nativeStaticResponse === true, addResponsePath = (path22) => {
      !useNativeStaticResponse || !nativeStaticHandler || (supportPerMethodInlineHandler ? this.router.response[path22] ? this.router.response[path22][method] = nativeStaticHandler() : this.router.response[path22] = {
        [method]: nativeStaticHandler()
      } : this.router.response[path22] = nativeStaticHandler());
    };
    addResponsePath(path2);
    let _compiled;
    const compile2 = () => {
      if (_compiled) return _compiled;
      const compiled = composeHandler({
        app: this,
        path: path2,
        method,
        hooks,
        validator: createValidator(),
        handler: typeof handle != "function" && typeof adapter.createStaticHandler != "function" ? () => handle : handle,
        allowMeta,
        inference: this.inference
      });
      return this.router.history[index] && (_compiled = this.router.history[index].composed = compiled), compiled;
    };
    let oldIndex;
    if (`${method}_${path2}` in this.routeTree)
      for (let i = 0; i < this.router.history.length; i++) {
        const route2 = this.router.history[i];
        if (route2.path === path2 && route2.method === method) {
          oldIndex = i;
          break;
        }
      }
    else this.routeTree[`${method}_${path2}`] = this.router.history.length;
    const index = oldIndex ?? this.router.history.length, route = this.router.history, mainHandler = shouldPrecompile ? compile2() : (ctx) => _compiled ? _compiled(ctx) : (route[index].composed = compile2())(ctx);
    oldIndex !== void 0 ? this.router.history[oldIndex] = Object.assign(
      {
        method,
        path: path2,
        composed: mainHandler,
        compile: compile2,
        handler: handle,
        hooks
      },
      standaloneValidators.length ? {
        standaloneValidators
      } : void 0,
      localHook.webSocket ? { websocket: localHook.websocket } : void 0
    ) : this.router.history.push(
      Object.assign(
        {
          method,
          path: path2,
          composed: mainHandler,
          compile: compile2,
          handler: handle,
          hooks
        },
        localHook.webSocket ? { websocket: localHook.websocket } : void 0
      )
    );
    const handler = {
      handler: shouldPrecompile ? route[index].composed : void 0,
      compile() {
        return this.handler = compile2();
      }
    }, staticRouter = this.router.static, isStaticPath = path2.indexOf(":") === -1 && path2.indexOf("*") === -1;
    if (method === "WS") {
      if (isStaticPath) {
        path2 in staticRouter ? staticRouter[path2][method] = index : staticRouter[path2] = {
          [method]: index
        };
        return;
      }
      this.router.http.add("WS", path2, handler), this.config.strictPath || this.router.http.add("WS", getLoosePath(path2), handler);
      const encoded = encodePath(path2, { dynamic: true });
      path2 !== encoded && this.router.http.add("WS", encoded, handler);
      return;
    }
    if (isStaticPath)
      path2 in staticRouter ? staticRouter[path2][method] = index : staticRouter[path2] = {
        [method]: index
      }, this.config.strictPath || addResponsePath(getLoosePath(path2));
    else {
      if (this.router.http.add(method, path2, handler), !this.config.strictPath) {
        const loosePath = getLoosePath(path2);
        addResponsePath(loosePath), this.router.http.add(method, loosePath, handler);
      }
      const encoded = encodePath(path2, { dynamic: true });
      path2 !== encoded && (this.router.http.add(method, encoded, handler), addResponsePath(encoded));
    }
  }
  headers(header) {
    return header ? (this.setHeaders || (this.setHeaders = {}), this.setHeaders = mergeDeep(this.setHeaders, header), this) : this;
  }
  /**
   * ### start | Life cycle event
   * Called after server is ready for serving
   *
   * ---
   * @example
   * ```typescript
   * new Elysia()
   *     .onStart(({ server }) => {
   *         console.log("Running at ${server?.url}:${server?.port}")
   *     })
   *     .listen(3000)
   * ```
   */
  onStart(handler) {
    return this.on("start", handler), this;
  }
  onRequest(handler) {
    return this.on("request", handler), this;
  }
  onParse(options, handler) {
    return handler ? this.on(
      options,
      "parse",
      handler
    ) : typeof options == "string" ? this.on("parse", this["~parser"][options]) : this.on("parse", options);
  }
  /**
   * ### parse | Life cycle event
   * Callback function to handle body parsing
   *
   * If truthy value is returned, will be assigned to `context.body`
   * Otherwise will skip the callback and look for the next one.
   *
   * Equivalent to Express's body parser
   *
   * ---
   * @example
   * ```typescript
   * new Elysia()
   *     .onParse((request, contentType) => {
   *         if(contentType === "application/json")
   *             return request.json()
   *     })
   * ```
   */
  parser(name, parser) {
    return this["~parser"][name] = parser, this;
  }
  onTransform(options, handler) {
    return handler ? this.on(
      options,
      "transform",
      handler
    ) : this.on("transform", options);
  }
  resolve(optionsOrResolve, resolve) {
    resolve || (resolve = optionsOrResolve, optionsOrResolve = { as: "local" });
    const hook = {
      subType: "resolve",
      fn: resolve
    };
    return this.onBeforeHandle(optionsOrResolve, hook);
  }
  mapResolve(optionsOrResolve, mapper) {
    mapper || (mapper = optionsOrResolve, optionsOrResolve = { as: "local" });
    const hook = {
      subType: "mapResolve",
      fn: mapper
    };
    return this.onBeforeHandle(optionsOrResolve, hook);
  }
  onBeforeHandle(options, handler) {
    return handler ? this.on(
      options,
      "beforeHandle",
      handler
    ) : this.on("beforeHandle", options);
  }
  onAfterHandle(options, handler) {
    return handler ? this.on(
      options,
      "afterHandle",
      handler
    ) : this.on("afterHandle", options);
  }
  mapResponse(options, handler) {
    return handler ? this.on(
      options,
      "mapResponse",
      handler
    ) : this.on("mapResponse", options);
  }
  onAfterResponse(options, handler) {
    return handler ? this.on(
      options,
      "afterResponse",
      handler
    ) : this.on("afterResponse", options);
  }
  /**
   * ### After Handle | Life cycle event
   * Intercept request **after** main handler is called.
   *
   * If truthy value is returned, will be assigned as `Response`
   *
   * ---
   * @example
   * ```typescript
   * new Elysia()
   *     .onAfterHandle((context, response) => {
   *         if(typeof response === "object")
   *             return JSON.stringify(response)
   *     })
   * ```
   */
  trace(options, handler) {
    handler || (handler = options, options = { as: "local" }), Array.isArray(handler) || (handler = [handler]);
    for (const fn of handler)
      this.on(
        options,
        "trace",
        createTracer(fn)
      );
    return this;
  }
  error(name, error) {
    switch (typeof name) {
      case "string":
        return error.prototype[ERROR_CODE] = name, this.definitions.error[name] = error, this;
      case "function":
        return this.definitions.error = name(this.definitions.error), this;
    }
    for (const [code, error2] of Object.entries(name))
      error2.prototype[ERROR_CODE] = code, this.definitions.error[code] = error2;
    return this;
  }
  /**
   * ### Error | Life cycle event
   * Called when error is thrown during processing request
   *
   * ---
   * @example
   * ```typescript
   * new Elysia()
   *     .onError(({ code }) => {
   *         if(code === "NOT_FOUND")
   *             return "Path not found :("
   *     })
   * ```
   */
  onError(options, handler) {
    return handler ? this.on(
      options,
      "error",
      handler
    ) : this.on("error", options);
  }
  /**
   * ### stop | Life cycle event
   * Called after server stop serving request
   *
   * ---
   * @example
   * ```typescript
   * new Elysia()
   *     .onStop((app) => {
   *         cleanup()
   *     })
   * ```
   */
  onStop(handler) {
    return this.on("stop", handler), this;
  }
  on(optionsOrType, typeOrHandlers, handlers) {
    var _a3, _b2, _c3, _d2, _e2, _f2, _g2, _h, _i, _j, _k, _l, _m;
    let type;
    switch (typeof optionsOrType) {
      case "string":
        type = optionsOrType, handlers = typeOrHandlers;
        break;
      case "object":
        type = typeOrHandlers, !Array.isArray(typeOrHandlers) && typeof typeOrHandlers == "object" && (handlers = typeOrHandlers);
        break;
    }
    Array.isArray(handlers) ? handlers = fnToContainer(handlers) : typeof handlers == "function" ? handlers = [
      {
        fn: handlers
      }
    ] : handlers = [handlers];
    const handles = handlers;
    for (const handle of handles)
      handle.scope = typeof optionsOrType == "string" ? "local" : (optionsOrType == null ? void 0 : optionsOrType.as) ?? "local", (type === "resolve" || type === "derive") && (handle.subType = type);
    type !== "trace" && (this.inference = sucrose(
      {
        [type]: handles.map((x) => x.fn)
      },
      this.inference,
      this.config.sucrose
    ));
    for (const handle of handles) {
      const fn = asHookType(handle, "global", { skipIfHasType: true });
      switch ((this.config.name || this.config.seed) && (fn.checksum = checksum(
        this.config.name + JSON.stringify(this.config.seed)
      )), type) {
        case "start":
          (_a3 = this.event).start ?? (_a3.start = []), this.event.start.push(fn);
          break;
        case "request":
          (_b2 = this.event).request ?? (_b2.request = []), this.event.request.push(fn);
          break;
        case "parse":
          (_c3 = this.event).parse ?? (_c3.parse = []), this.event.parse.push(fn);
          break;
        case "transform":
          (_d2 = this.event).transform ?? (_d2.transform = []), this.event.transform.push(fn);
          break;
        case "derive":
          (_e2 = this.event).transform ?? (_e2.transform = []), this.event.transform.push(
            fnToContainer(fn, "derive")
          );
          break;
        case "beforeHandle":
          (_f2 = this.event).beforeHandle ?? (_f2.beforeHandle = []), this.event.beforeHandle.push(fn);
          break;
        case "resolve":
          (_g2 = this.event).beforeHandle ?? (_g2.beforeHandle = []), this.event.beforeHandle.push(
            fnToContainer(fn, "resolve")
          );
          break;
        case "afterHandle":
          (_h = this.event).afterHandle ?? (_h.afterHandle = []), this.event.afterHandle.push(fn);
          break;
        case "mapResponse":
          (_i = this.event).mapResponse ?? (_i.mapResponse = []), this.event.mapResponse.push(fn);
          break;
        case "afterResponse":
          (_j = this.event).afterResponse ?? (_j.afterResponse = []), this.event.afterResponse.push(fn);
          break;
        case "trace":
          (_k = this.event).trace ?? (_k.trace = []), this.event.trace.push(fn);
          break;
        case "error":
          (_l = this.event).error ?? (_l.error = []), this.event.error.push(fn);
          break;
        case "stop":
          (_m = this.event).stop ?? (_m.stop = []), this.event.stop.push(fn);
          break;
      }
    }
    return this;
  }
  as(type) {
    var _a3, _b2, _c3;
    return promoteEvent(this.event.parse, type), promoteEvent(this.event.transform, type), promoteEvent(this.event.beforeHandle, type), promoteEvent(this.event.afterHandle, type), promoteEvent(this.event.mapResponse, type), promoteEvent(this.event.afterResponse, type), promoteEvent(this.event.trace, type), promoteEvent(this.event.error, type), type === "scoped" ? (this.validator.scoped = mergeSchemaValidator(
      this.validator.scoped,
      this.validator.local
    ), this.validator.local = null, this.standaloneValidator.local !== null && ((_a3 = this.standaloneValidator).scoped || (_a3.scoped = []), this.standaloneValidator.scoped.push(
      ...this.standaloneValidator.local
    ), this.standaloneValidator.local = null)) : type === "global" && (this.validator.global = mergeSchemaValidator(
      this.validator.global,
      mergeSchemaValidator(
        this.validator.scoped,
        this.validator.local
      )
    ), this.validator.scoped = null, this.validator.local = null, this.standaloneValidator.local !== null && ((_b2 = this.standaloneValidator).scoped || (_b2.scoped = []), this.standaloneValidator.scoped.push(
      ...this.standaloneValidator.local
    ), this.standaloneValidator.local = null), this.standaloneValidator.scoped !== null && ((_c3 = this.standaloneValidator).global || (_c3.global = []), this.standaloneValidator.global.push(
      ...this.standaloneValidator.scoped
    ), this.standaloneValidator.scoped = null)), this;
  }
  /**
   * ### group
   * Encapsulate and group path with prefix
   *
   * ---
   * @example
   * ```typescript
   * new Elysia()
   *     .group('/v1', app => app
   *         .get('/', () => 'Hi')
   *         .get('/name', () => 'Elysia')
   *     })
   * ```
   */
  group(prefix, schemaOrRun, run) {
    var _a3, _b2;
    const instance = new _Elysia2({
      ...this.config,
      prefix: ""
    });
    instance.singleton = { ...this.singleton }, instance.definitions = { ...this.definitions }, instance.getServer = () => this.getServer(), instance.inference = cloneInference(this.inference), instance.extender = { ...this.extender }, instance["~parser"] = this["~parser"], instance.standaloneValidator = {
      local: [...this.standaloneValidator.local ?? []],
      scoped: [...this.standaloneValidator.scoped ?? []],
      global: [...this.standaloneValidator.global ?? []]
    };
    const isSchema = typeof schemaOrRun == "object", sandbox = (isSchema ? run : schemaOrRun)(instance);
    return this.singleton = mergeDeep(this.singleton, instance.singleton), this.definitions = mergeDeep(this.definitions, instance.definitions), ((_a3 = sandbox.event.request) == null ? void 0 : _a3.length) && (this.event.request = [
      ...this.event.request || [],
      ...sandbox.event.request || []
    ]), ((_b2 = sandbox.event.mapResponse) == null ? void 0 : _b2.length) && (this.event.mapResponse = [
      ...this.event.mapResponse || [],
      ...sandbox.event.mapResponse || []
    ]), this.model(sandbox.definitions.type), Object.values(instance.router.history).forEach(
      ({ method, path: path2, handler, hooks }) => {
        if (path2 = (isSchema ? "" : this.config.prefix ?? "") + prefix + path2, isSchema) {
          const {
            body,
            headers,
            query,
            params,
            cookie,
            response,
            ...hook
          } = schemaOrRun, localHook = hooks;
          this.applyMacro(hook);
          const hasStandaloneSchema = body || headers || query || params || cookie || response;
          this.add(
            method,
            path2,
            handler,
            mergeHook(hook, {
              ...localHook || {},
              error: localHook.error ? Array.isArray(localHook.error) ? [
                ...localHook.error ?? [],
                ...sandbox.event.error ?? []
              ] : [
                localHook.error,
                ...sandbox.event.error ?? []
              ] : sandbox.event.error,
              // Merge macro's standaloneValidator with local and group schema
              standaloneValidator: hook.standaloneValidator || localHook.standaloneValidator || hasStandaloneSchema ? [
                ...hook.standaloneValidator ?? [],
                ...localHook.standaloneValidator ?? [],
                ...hasStandaloneSchema ? [
                  {
                    body,
                    headers,
                    query,
                    params,
                    cookie,
                    response
                  }
                ] : []
              ] : void 0
            }),
            void 0
          );
        } else
          this.add(
            method,
            path2,
            handler,
            mergeHook(hooks, {
              error: sandbox.event.error
            }),
            {
              skipPrefix: true
            }
          );
      }
    ), this;
  }
  /**
   * ### guard
   * Encapsulate and pass hook into all child handler
   *
   * ---
   * @example
   * ```typescript
   * import { t } from 'elysia'
   *
   * new Elysia()
   *     .guard({
   *          body: t.Object({
   *              username: t.String(),
   *              password: t.String()
   *          })
   *     }, app => app
   *         .get("/", () => 'Hi')
   *         .get("/name", () => 'Elysia')
   *     })
   * ```
   */
  guard(hook, run) {
    var _a3, _b2, _c3, _d2, _e2, _f2, _g2, _h;
    if (!run) {
      if (typeof hook == "object") {
        this.applyMacro(hook), hook.detail && (this.config.detail ? this.config.detail = mergeDeep(
          Object.assign({}, this.config.detail),
          hook.detail
        ) : this.config.detail = hook.detail), hook.tags && (this.config.detail ? this.config.detail.tags = hook.tags : this.config.detail = {
          tags: hook.tags
        });
        const type = hook.as ?? "local";
        if (hook.schema === "standalone") {
          this.standaloneValidator[type] || (this.standaloneValidator[type] = []);
          const response = (hook == null ? void 0 : hook.response) ? typeof hook.response == "string" || Kind$1 in hook.response || "~standard" in hook.response ? {
            200: hook.response
          } : hook == null ? void 0 : hook.response : void 0;
          this.standaloneValidator[type].push({
            body: hook.body,
            headers: hook.headers,
            params: hook.params,
            query: hook.query,
            response,
            cookie: hook.cookie
          });
        } else
          this.validator[type] = {
            body: hook.body ?? ((_a3 = this.validator[type]) == null ? void 0 : _a3.body),
            headers: hook.headers ?? ((_b2 = this.validator[type]) == null ? void 0 : _b2.headers),
            params: hook.params ?? ((_c3 = this.validator[type]) == null ? void 0 : _c3.params),
            query: hook.query ?? ((_d2 = this.validator[type]) == null ? void 0 : _d2.query),
            response: hook.response ?? ((_e2 = this.validator[type]) == null ? void 0 : _e2.response),
            cookie: hook.cookie ?? ((_f2 = this.validator[type]) == null ? void 0 : _f2.cookie)
          };
        return hook.parse && this.on({ as: type }, "parse", hook.parse), hook.transform && this.on({ as: type }, "transform", hook.transform), hook.derive && this.on({ as: type }, "derive", hook.derive), hook.beforeHandle && this.on({ as: type }, "beforeHandle", hook.beforeHandle), hook.resolve && this.on({ as: type }, "resolve", hook.resolve), hook.afterHandle && this.on({ as: type }, "afterHandle", hook.afterHandle), hook.mapResponse && this.on({ as: type }, "mapResponse", hook.mapResponse), hook.afterResponse && this.on({ as: type }, "afterResponse", hook.afterResponse), hook.error && this.on({ as: type }, "error", hook.error), this;
      }
      return this.guard({}, hook);
    }
    const instance = new _Elysia2({
      ...this.config,
      prefix: ""
    });
    instance.singleton = { ...this.singleton }, instance.definitions = { ...this.definitions }, instance.inference = cloneInference(this.inference), instance.extender = { ...this.extender }, instance.getServer = () => this.getServer();
    const sandbox = run(instance);
    if (this.singleton = mergeDeep(this.singleton, instance.singleton), this.definitions = mergeDeep(this.definitions, instance.definitions), sandbox.getServer = () => this.server, ((_g2 = sandbox.event.request) == null ? void 0 : _g2.length) && (this.event.request = [
      ...this.event.request || [],
      ...sandbox.event.request || []
    ]), ((_h = sandbox.event.mapResponse) == null ? void 0 : _h.length) && (this.event.mapResponse = [
      ...this.event.mapResponse || [],
      ...sandbox.event.mapResponse || []
    ]), this.model(sandbox.definitions.type), Object.values(instance.router.history).forEach(
      ({ method, path: path2, handler, hooks: localHook }) => {
        const {
          body,
          headers,
          query,
          params,
          cookie,
          response,
          ...guardHook
        } = hook, hasStandaloneSchema = body || headers || query || params || cookie || response;
        this.add(
          method,
          path2,
          handler,
          mergeHook(guardHook, {
            ...localHook || {},
            error: localHook.error ? Array.isArray(localHook.error) ? [
              ...localHook.error ?? [],
              ...sandbox.event.error ?? []
            ] : [
              localHook.error,
              ...sandbox.event.error ?? []
            ] : sandbox.event.error,
            standaloneValidator: hasStandaloneSchema ? [
              ...localHook.standaloneValidator ?? [],
              {
                body,
                headers,
                query,
                params,
                cookie,
                response
              }
            ] : localHook.standaloneValidator
          })
        );
      }
    ), instance.promisedModules.size > 0) {
      let processedUntil = instance.router.history.length;
      for (const promise of instance.promisedModules.promises)
        this.promisedModules.add(
          promise.then(() => {
            const {
              body,
              headers,
              query,
              params,
              cookie,
              response,
              ...guardHook
            } = hook, hasStandaloneSchema = body || headers || query || params || cookie || response, startIndex = processedUntil;
            processedUntil = instance.router.history.length;
            for (let i = startIndex; i < instance.router.history.length; i++) {
              const {
                method,
                path: path2,
                handler,
                hooks: localHook
              } = instance.router.history[i];
              this.add(
                method,
                path2,
                handler,
                mergeHook(guardHook, {
                  ...localHook || {},
                  error: localHook.error ? Array.isArray(localHook.error) ? [
                    ...localHook.error ?? [],
                    ...sandbox.event.error ?? []
                  ] : [
                    localHook.error,
                    ...sandbox.event.error ?? []
                  ] : sandbox.event.error,
                  standaloneValidator: hasStandaloneSchema ? [
                    ...localHook.standaloneValidator ?? [],
                    {
                      body,
                      headers,
                      query,
                      params,
                      cookie,
                      response
                    }
                  ] : localHook.standaloneValidator
                })
              );
            }
          })
        );
    }
    return this;
  }
  /**
   * ### use
   * Merge separate logic of Elysia with current
   *
   * ---
   * @example
   * ```typescript
   * const plugin = (app: Elysia) => app
   *     .get('/plugin', () => 'hi')
   *
   * new Elysia()
   *     .use(plugin)
   * ```
   */
  use(plugin2) {
    if (!plugin2) return this;
    if (Array.isArray(plugin2)) {
      let app2 = this;
      for (const p of plugin2) app2 = app2.use(p);
      return app2;
    }
    return plugin2 instanceof Promise ? (this.promisedModules.add(
      plugin2.then((plugin22) => {
        var _a3, _b2, _c3;
        if (typeof plugin22 == "function") return plugin22(this);
        if (plugin22 instanceof _Elysia2)
          return this._use(plugin22).compile();
        if (((_a3 = plugin22.constructor) == null ? void 0 : _a3.name) === "Elysia")
          return this._use(
            plugin22
          ).compile();
        if (typeof plugin22.default == "function")
          return plugin22.default(this);
        if (plugin22.default instanceof _Elysia2)
          return this._use(plugin22.default);
        if (((_b2 = plugin22.constructor) == null ? void 0 : _b2.name) === "Elysia")
          return this._use(plugin22.default);
        if (((_c3 = plugin22.constructor) == null ? void 0 : _c3.name) === "_Elysia")
          return this._use(plugin22.default);
        try {
          return this._use(plugin22.default);
        } catch (error) {
          throw console.error(
            'Invalid plugin type. Expected Elysia instance, function, or module with "default" as Elysia instance or function that returns Elysia instance.'
          ), error;
        }
      }).then((v) => (v && typeof v.compile == "function" && v.compile(), v))
    ), this) : this._use(plugin2);
  }
  propagatePromiseModules(plugin2) {
    if (plugin2.promisedModules.size <= 0) return this;
    for (const promise of plugin2.promisedModules.promises)
      this.promisedModules.add(
        promise.then((v) => {
          if (!v) return;
          const t3 = this._use(v);
          return t3 instanceof Promise ? t3.then((v2) => {
            v2 ? v2.compile() : v.compile();
          }) : v.compile();
        })
      );
    return this;
  }
  _use(plugin2) {
    var _a3, _b2, _c3, _d2, _e2, _f2;
    if (typeof plugin2 == "function") {
      const instance = plugin2(this);
      return instance instanceof Promise ? (this.promisedModules.add(
        instance.then((plugin22) => {
          if (plugin22 instanceof _Elysia2) {
            plugin22.getServer = () => this.getServer(), plugin22.getGlobalRoutes = () => this.getGlobalRoutes(), plugin22.getGlobalDefinitions = () => this.getGlobalDefinitions(), plugin22.model(this.definitions.type), plugin22.error(this.definitions.error);
            for (const {
              method,
              path: path2,
              handler,
              hooks
            } of Object.values(plugin22.router.history))
              this.add(
                method,
                path2,
                handler,
                hooks,
                void 0
              );
            return plugin22 === this ? void 0 : (this.propagatePromiseModules(plugin22), plugin22);
          }
          return typeof plugin22 == "function" ? plugin22(
            this
          ) : typeof plugin22.default == "function" ? plugin22.default(
            this
          ) : this._use(plugin22);
        }).then((v) => (v && typeof v.compile == "function" && v.compile(), v))
      ), this) : instance;
    }
    this.propagatePromiseModules(plugin2);
    const name = plugin2.config.name, seed = plugin2.config.seed;
    if (plugin2.getParent = () => this, plugin2.getServer = () => this.getServer(), plugin2.getGlobalRoutes = () => this.getGlobalRoutes(), plugin2.getGlobalDefinitions = () => this.getGlobalDefinitions(), ((_a3 = plugin2.standaloneValidator) == null ? void 0 : _a3.scoped) && (this.standaloneValidator.local ? this.standaloneValidator.local = this.standaloneValidator.local.concat(
      plugin2.standaloneValidator.scoped
    ) : this.standaloneValidator.local = plugin2.standaloneValidator.scoped), ((_b2 = plugin2.standaloneValidator) == null ? void 0 : _b2.global) && (this.standaloneValidator.global ? this.standaloneValidator.global = this.standaloneValidator.global.concat(
      plugin2.standaloneValidator.global
    ) : this.standaloneValidator.global = plugin2.standaloneValidator.global), isNotEmpty(plugin2["~parser"]) && (this["~parser"] = {
      ...plugin2["~parser"],
      ...this["~parser"]
    }), plugin2.setHeaders && this.headers(plugin2.setHeaders), name) {
      name in this.dependencies || (this.dependencies[name] = []);
      const current = seed !== void 0 ? checksum(name + JSON.stringify(seed)) : 0;
      this.dependencies[name].some(
        ({ checksum: checksum3 }) => current === checksum3
      ) || (this.extender.macro = {
        ...this.extender.macro,
        ...plugin2.extender.macro
      }, this.extender.higherOrderFunctions = this.extender.higherOrderFunctions.concat(
        plugin2.extender.higherOrderFunctions
      ));
    } else
      isNotEmpty(plugin2.extender.macro) && (this.extender.macro = {
        ...this.extender.macro,
        ...plugin2.extender.macro
      }), plugin2.extender.higherOrderFunctions.length && (this.extender.higherOrderFunctions = this.extender.higherOrderFunctions.concat(
        plugin2.extender.higherOrderFunctions
      ));
    if (plugin2.extender.higherOrderFunctions.length) {
      deduplicateChecksum(this.extender.higherOrderFunctions);
      const hofHashes = [];
      for (let i = 0; i < this.extender.higherOrderFunctions.length; i++) {
        const hof = this.extender.higherOrderFunctions[i];
        hof.checksum && (hofHashes.includes(hof.checksum) && (this.extender.higherOrderFunctions.splice(i, 1), i--), hofHashes.push(hof.checksum));
      }
      hofHashes.length = 0;
    }
    this.inference = mergeInference(this.inference, plugin2.inference), isNotEmpty(plugin2.singleton.decorator) && this.decorate(plugin2.singleton.decorator), isNotEmpty(plugin2.singleton.store) && this.state(plugin2.singleton.store), isNotEmpty(plugin2.definitions.type) && this.model(plugin2.definitions.type), isNotEmpty(plugin2.definitions.error) && this.error(plugin2.definitions.error), isNotEmpty(plugin2.extender.macro) && (this.extender.macro = {
      ...this.extender.macro,
      ...plugin2.extender.macro
    });
    for (const { method, path: path2, handler, hooks } of Object.values(
      plugin2.router.history
    ))
      this.add(method, path2, handler, hooks);
    if (name) {
      name in this.dependencies || (this.dependencies[name] = []);
      const current = seed !== void 0 ? checksum(name + JSON.stringify(seed)) : 0;
      if (this.dependencies[name].some(
        ({ checksum: checksum3 }) => current === checksum3
      ))
        return this;
      this.dependencies[name].push(
        ((_c3 = this.config) == null ? void 0 : _c3.analytic) ? {
          name: plugin2.config.name,
          seed: plugin2.config.seed,
          checksum: current,
          dependencies: plugin2.dependencies,
          stack: (_d2 = plugin2.telemetry) == null ? void 0 : _d2.stack,
          routes: plugin2.router.history,
          decorators: plugin2.singleton,
          store: plugin2.singleton.store,
          error: plugin2.definitions.error,
          derive: (_e2 = plugin2.event.transform) == null ? void 0 : _e2.filter((x) => (x == null ? void 0 : x.subType) === "derive").map((x) => ({
            fn: x.toString(),
            stack: new Error().stack ?? ""
          })),
          resolve: (_f2 = plugin2.event.transform) == null ? void 0 : _f2.filter((x) => (x == null ? void 0 : x.subType) === "resolve").map((x) => ({
            fn: x.toString(),
            stack: new Error().stack ?? ""
          }))
        } : {
          name: plugin2.config.name,
          seed: plugin2.config.seed,
          checksum: current,
          dependencies: plugin2.dependencies
        }
      ), isNotEmpty(plugin2.event) && (this.event = mergeLifeCycle(
        this.event,
        filterGlobalHook(plugin2.event),
        current
      ));
    } else
      isNotEmpty(plugin2.event) && (this.event = mergeLifeCycle(
        this.event,
        filterGlobalHook(plugin2.event)
      ));
    return plugin2.validator.global && (this.validator.global = mergeHook(this.validator.global, {
      ...plugin2.validator.global
    })), plugin2.validator.scoped && (this.validator.local = mergeHook(this.validator.local, {
      ...plugin2.validator.scoped
    })), this;
  }
  macro(macroOrName, macro) {
    if (typeof macroOrName == "string" && !macro)
      throw new Error("Macro function is required");
    return typeof macroOrName == "string" ? this.extender.macro[macroOrName] = macro : this.extender.macro = {
      ...this.extender.macro,
      ...macroOrName
    }, this;
  }
  applyMacro(localHook, appliable = localHook, {
    iteration = 0,
    applied = {}
  } = {}) {
    if (iteration >= 16) return;
    const macro = this.extender.macro;
    for (let [key, value] of Object.entries(appliable)) {
      if (!(key in macro)) continue;
      const macroHook = typeof macro[key] == "function" ? macro[key](value) : macro[key];
      if (!macroHook || typeof macro[key] == "object" && value === false)
        return;
      const seed = checksum(key + JSON.stringify(macroHook.seed ?? value));
      if (!(seed in applied)) {
        applied[seed] = true;
        for (let [k, value2] of Object.entries(macroHook))
          if (k !== "seed") {
            if (k in emptySchema) {
              insertStandaloneValidator(
                localHook,
                k,
                value2
              ), delete localHook[key];
              continue;
            }
            if (k === "introspect") {
              value2 == null ? void 0 : value2(localHook), delete localHook[key];
              continue;
            }
            if (k === "detail") {
              localHook.detail || (localHook.detail = {}), localHook.detail = mergeDeep(localHook.detail, value2, {
                mergeArray: true
              }), delete localHook[key];
              continue;
            }
            if (k in macro) {
              this.applyMacro(
                localHook,
                { [k]: value2 },
                { applied, iteration: iteration + 1 }
              ), delete localHook[key];
              continue;
            }
            switch ((k === "derive" || k === "resolve") && typeof value2 == "function" && (value2 = {
              fn: value2,
              subType: k
            }), typeof localHook[k]) {
              case "function":
                localHook[k] = [localHook[k], value2];
                break;
              case "object":
                Array.isArray(localHook[k]) ? localHook[k].push(value2) : localHook[k] = [localHook[k], value2];
                break;
              case "undefined":
                localHook[k] = value2;
                break;
            }
            delete localHook[key];
          }
      }
    }
  }
  mount(path2, handleOrConfig, config) {
    if (path2 instanceof _Elysia2 || typeof path2 == "function" || path2.length === 0 || path2 === "/") {
      const run = typeof path2 == "function" ? path2 : path2 instanceof _Elysia2 ? path2.compile().fetch : handleOrConfig instanceof _Elysia2 ? handleOrConfig.compile().fetch : typeof handleOrConfig == "function" ? handleOrConfig : (() => {
        throw new Error("Invalid handler");
      })(), handler2 = ({ request, path: path22 }) => run(new Request(replaceUrlPath(request.url, path22), request));
      return this.route("ALL", "/*", handler2, {
        parse: "none",
        ...config,
        detail: {
          ...config == null ? void 0 : config.detail,
          hide: true
        },
        config: {
          mount: run
        }
      }), this;
    }
    const handle = handleOrConfig instanceof _Elysia2 ? handleOrConfig.compile().fetch : typeof handleOrConfig == "function" ? handleOrConfig : (() => {
      throw new Error("Invalid handler");
    })(), length = (typeof path2 == "string" && this.config.prefix ? this.config.prefix + path2 : path2).length - (path2.endsWith("*") ? 1 : 0), handler = ({ request, path: path22 }) => handle(
      new Request(
        replaceUrlPath(request.url, path22.slice(length) || "/"),
        request
      )
    );
    return this.route("ALL", path2, handler, {
      parse: "none",
      ...config,
      detail: {
        ...config == null ? void 0 : config.detail,
        hide: true
      },
      config: {
        mount: handle
      }
    }), this.route(
      "ALL",
      path2 + (path2.endsWith("/") ? "*" : "/*"),
      handler,
      {
        parse: "none",
        ...config,
        detail: {
          ...config == null ? void 0 : config.detail,
          hide: true
        },
        config: {
          mount: handle
        }
      }
    ), this;
  }
  /**
   * ### get
   * Register handler for path with method [GET]
   *
   * ---
   * @example
   * ```typescript
   * import { Elysia, t } from 'elysia'
   *
   * new Elysia()
   *     .get('/', () => 'hi')
   *     .get('/with-hook', () => 'hi', {
   *         response: t.String()
   *     })
   * ```
   */
  get(path2, handler, hook) {
    return this.add("GET", path2, handler, hook), this;
  }
  /**
   * ### post
   * Register handler for path with method [POST]
   *
   * ---
   * @example
   * ```typescript
   * import { Elysia, t } from 'elysia'
   *
   * new Elysia()
   *     .post('/', () => 'hi')
   *     .post('/with-hook', () => 'hi', {
   *         response: t.String()
   *     })
   * ```
   */
  post(path2, handler, hook) {
    return this.add("POST", path2, handler, hook), this;
  }
  /**
   * ### put
   * Register handler for path with method [PUT]
   *
   * ---
   * @example
   * ```typescript
   * import { Elysia, t } from 'elysia'
   *
   * new Elysia()
   *     .put('/', () => 'hi')
   *     .put('/with-hook', () => 'hi', {
   *         response: t.String()
   *     })
   * ```
   */
  put(path2, handler, hook) {
    return this.add("PUT", path2, handler, hook), this;
  }
  /**
   * ### patch
   * Register handler for path with method [PATCH]
   *
   * ---
   * @example
   * ```typescript
   * import { Elysia, t } from 'elysia'
   *
   * new Elysia()
   *     .patch('/', () => 'hi')
   *     .patch('/with-hook', () => 'hi', {
   *         response: t.String()
   *     })
   * ```
   */
  patch(path2, handler, hook) {
    return this.add("PATCH", path2, handler, hook), this;
  }
  /**
   * ### delete
   * Register handler for path with method [DELETE]
   *
   * ---
   * @example
   * ```typescript
   * import { Elysia, t } from 'elysia'
   *
   * new Elysia()
   *     .delete('/', () => 'hi')
   *     .delete('/with-hook', () => 'hi', {
   *         response: t.String()
   *     })
   * ```
   */
  delete(path2, handler, hook) {
    return this.add("DELETE", path2, handler, hook), this;
  }
  /**
   * ### options
   * Register handler for path with method [POST]
   *
   * ---
   * @example
   * ```typescript
   * import { Elysia, t } from 'elysia'
   *
   * new Elysia()
   *     .options('/', () => 'hi')
   *     .options('/with-hook', () => 'hi', {
   *         response: t.String()
   *     })
   * ```
   */
  options(path2, handler, hook) {
    return this.add("OPTIONS", path2, handler, hook), this;
  }
  /**
   * ### all
   * Register handler for path with method [ALL]
   *
   * ---
   * @example
   * ```typescript
   * import { Elysia, t } from 'elysia'
   *
   * new Elysia()
   *     .all('/', () => 'hi')
   *     .all('/with-hook', () => 'hi', {
   *         response: t.String()
   *     })
   * ```
   */
  all(path2, handler, hook) {
    return this.add("ALL", path2, handler, hook), this;
  }
  /**
   * ### head
   * Register handler for path with method [HEAD]
   *
   * ---
   * @example
   * ```typescript
   * import { Elysia, t } from 'elysia'
   *
   * new Elysia()
   *     .head('/', () => 'hi')
   *     .head('/with-hook', () => 'hi', {
   *         response: t.String()
   *     })
   * ```
   */
  head(path2, handler, hook) {
    return this.add("HEAD", path2, handler, hook), this;
  }
  /**
   * ### connect
   * Register handler for path with method [CONNECT]
   *
   * ---
   * @example
   * ```typescript
   * import { Elysia, t } from 'elysia'
   *
   * new Elysia()
   *     .connect('/', () => 'hi')
   *     .connect('/with-hook', () => 'hi', {
   *         response: t.String()
   *     })
   * ```
   */
  connect(path2, handler, hook) {
    return this.add("CONNECT", path2, handler, hook), this;
  }
  /**
   * ### route
   * Register handler for path with method [ROUTE]
   *
   * ---
   * @example
   * ```typescript
   * import { Elysia, t } from 'elysia'
   *
   * new Elysia()
   *     .route('/', () => 'hi')
   *     .route('/with-hook', () => 'hi', {
   *         response: t.String()
   *     })
   * ```
   */
  route(method, path2, handler, hook) {
    return this.add(method.toUpperCase(), path2, handler, hook, hook == null ? void 0 : hook.config), this;
  }
  /**
   * ### ws
   * Register handler for path with method [ws]
   *
   * ---
   * @example
   * ```typescript
   * import { Elysia, t } from 'elysia'
   *
   * new Elysia()
   *     .ws('/', {
   *         message(ws, message) {
   *             ws.send(message)
   *         }
   *     })
   * ```
   */
  ws(path2, options) {
    return this["~adapter"].ws ? this["~adapter"].ws(this, path2, options) : console.warn("Current adapter doesn't support WebSocket"), this;
  }
  /**
   * ### state
   * Assign global mutatable state accessible for all handler
   *
   * ---
   * @example
   * ```typescript
   * new Elysia()
   *     .state('counter', 0)
   *     .get('/', (({ counter }) => ++counter)
   * ```
   */
  state(options, name, value) {
    name === void 0 ? (value = options, options = { as: "append" }, name = "") : value === void 0 && (typeof options == "string" ? (value = name, name = options, options = { as: "append" }) : typeof options == "object" && (value = name, name = ""));
    const { as } = options;
    if (typeof name != "string") return this;
    switch (typeof value) {
      case "object":
        return !value || !isNotEmpty(value) ? this : name ? (name in this.singleton.store ? this.singleton.store[name] = mergeDeep(
          this.singleton.store[name],
          value,
          {
            override: as === "override"
          }
        ) : this.singleton.store[name] = value, this) : value === null ? this : (this.singleton.store = mergeDeep(this.singleton.store, value, {
          override: as === "override"
        }), this);
      case "function":
        return name ? (as === "override" || !(name in this.singleton.store)) && (this.singleton.store[name] = value) : this.singleton.store = value(this.singleton.store), this;
      default:
        return (as === "override" || !(name in this.singleton.store)) && (this.singleton.store[name] = value), this;
    }
  }
  /**
   * ### decorate
   * Define custom method to `Context` accessible for all handler
   *
   * ---
   * @example
   * ```typescript
   * new Elysia()
   *     .decorate('getDate', () => Date.now())
   *     .get('/', (({ getDate }) => getDate())
   * ```
   */
  decorate(options, name, value) {
    name === void 0 ? (value = options, options = { as: "append" }, name = "") : value === void 0 && (typeof options == "string" ? (value = name, name = options, options = { as: "append" }) : typeof options == "object" && (value = name, name = ""));
    const { as } = options;
    if (typeof name != "string") return this;
    switch (typeof value) {
      case "object":
        return name ? (name in this.singleton.decorator ? this.singleton.decorator[name] = mergeDeep(
          this.singleton.decorator[name],
          value,
          {
            override: as === "override"
          }
        ) : this.singleton.decorator[name] = value, this) : value === null ? this : (this.singleton.decorator = mergeDeep(
          this.singleton.decorator,
          value,
          {
            override: as === "override"
          }
        ), this);
      case "function":
        return name ? (as === "override" || !(name in this.singleton.decorator)) && (this.singleton.decorator[name] = value) : this.singleton.decorator = value(this.singleton.decorator), this;
      default:
        return (as === "override" || !(name in this.singleton.decorator)) && (this.singleton.decorator[name] = value), this;
    }
  }
  derive(optionsOrTransform, transform) {
    transform || (transform = optionsOrTransform, optionsOrTransform = { as: "local" });
    const hook = {
      subType: "derive",
      fn: transform
    };
    return this.onTransform(optionsOrTransform, hook);
  }
  model(name, model) {
    var _a3;
    const onlyTypebox = (a) => {
      const res = {};
      for (const key in a) "~standard" in a[key] || (res[key] = a[key]);
      return res;
    };
    switch (typeof name) {
      case "object":
        const parsedTypebox = {}, kvs = Object.entries(name);
        if (!kvs.length) return this;
        for (const [key, value] of kvs)
          key in this.definitions.type || ("~standard" in value ? this.definitions.type[key] = value : (parsedTypebox[key] = this.definitions.type[key] = value, (_a3 = parsedTypebox[key]).$id ?? (_a3.$id = `#/components/schemas/${key}`)));
        return this.definitions.typebox = t.Module({
          ...this.definitions.typebox.$defs,
          ...parsedTypebox
        }), this;
      case "function":
        const result = name(this.definitions.type);
        return this.definitions.type = result, this.definitions.typebox = t.Module(onlyTypebox(result)), this;
      case "string":
        if (!model) break;
        if (this.definitions.type[name] = model, "~standard" in model) return this;
        const newModel = {
          ...model,
          id: model.$id ?? `#/components/schemas/${name}`
        };
        return this.definitions.typebox = t.Module({
          ...this.definitions.typebox.$defs,
          ...newModel
        }), this;
    }
    return model ? (this.definitions.type[name] = model, "~standard" in model ? this : (this.definitions.typebox = t.Module({
      ...this.definitions.typebox.$defs,
      [name]: model
    }), this)) : this;
  }
  Ref(key) {
    return t.Ref(key);
  }
  mapDerive(optionsOrDerive, mapper) {
    mapper || (mapper = optionsOrDerive, optionsOrDerive = { as: "local" });
    const hook = {
      subType: "mapDerive",
      fn: mapper
    };
    return this.onTransform(optionsOrDerive, hook);
  }
  affix(base, type, word) {
    if (word === "") return this;
    const delimieter = ["_", "-", " "], capitalize = (word2) => word2[0].toUpperCase() + word2.slice(1), joinKey = base === "prefix" ? (prefix, word2) => delimieter.includes(prefix.at(-1) ?? "") ? prefix + word2 : prefix + capitalize(word2) : delimieter.includes(word.at(-1) ?? "") ? (suffix, word2) => word2 + suffix : (suffix, word2) => word2 + capitalize(suffix), remap = (type2) => {
      const store = {};
      switch (type2) {
        case "decorator":
          for (const key in this.singleton.decorator)
            store[joinKey(word, key)] = this.singleton.decorator[key];
          this.singleton.decorator = store;
          break;
        case "state":
          for (const key in this.singleton.store)
            store[joinKey(word, key)] = this.singleton.store[key];
          this.singleton.store = store;
          break;
        case "model":
          for (const key in this.definitions.type)
            store[joinKey(word, key)] = this.definitions.type[key];
          this.definitions.type = store;
          break;
        case "error":
          for (const key in this.definitions.error)
            store[joinKey(word, key)] = this.definitions.error[key];
          this.definitions.error = store;
          break;
      }
    }, types2 = Array.isArray(type) ? type : [type];
    for (const type2 of types2.some((x) => x === "all") ? ["decorator", "state", "model", "error"] : types2)
      remap(type2);
    return this;
  }
  prefix(type, word) {
    return this.affix("prefix", type, word);
  }
  suffix(type, word) {
    return this.affix("suffix", type, word);
  }
  compile() {
    var _a3, _b2, _c3, _d2;
    return (_b2 = (_a3 = this["~adapter"]).beforeCompile) == null ? void 0 : _b2.call(_a3, this), this["~adapter"].isWebStandard ? (this._handle = this.config.aot ? composeGeneralHandler(this) : createDynamicHandler(this), Object.defineProperty(this, "fetch", {
      value: this._handle,
      configurable: true,
      writable: true
    }), typeof ((_c3 = this.server) == null ? void 0 : _c3.reload) == "function" && this.server.reload({
      ...this.server || {},
      fetch: this.fetch
    }), this) : (typeof ((_d2 = this.server) == null ? void 0 : _d2.reload) == "function" && this.server.reload(this.server || {}), this._handle = composeGeneralHandler(this), this);
  }
  /**
   * Use handle can be either sync or async to save performance.
   *
   * Beside benchmark purpose, please use 'handle' instead.
   */
  get fetch() {
    const fetch = this.config.aot ? composeGeneralHandler(this) : createDynamicHandler(this);
    return Object.defineProperty(this, "fetch", {
      value: fetch,
      configurable: true,
      writable: true
    }), fetch;
  }
  /**
   * Wait until all lazy loaded modules all load is fully
   */
  get modules() {
    return this.promisedModules;
  }
};
let Elysia = _Elysia;
var __create = Object.create;
var __defProp2 = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
    key = keys[i];
    if (!__hasOwnProp.call(to, key) && key !== except) __defProp2(to, key, {
      get: ((k) => from[k]).bind(null, key),
      enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
    });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(__defProp2(target, "default", {
  value: mod,
  enumerable: true
}), mod));
var __require = /* @__PURE__ */ (() => createRequire(import.meta.url))();
var require_constants = /* @__PURE__ */ __commonJSMin((exports, module) => {
  const BINARY_TYPES = [
    "nodebuffer",
    "arraybuffer",
    "fragments"
  ];
  const hasBlob = typeof Blob !== "undefined";
  if (hasBlob) BINARY_TYPES.push("blob");
  module.exports = {
    BINARY_TYPES,
    CLOSE_TIMEOUT: 3e4,
    EMPTY_BUFFER: Buffer.alloc(0),
    GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
    hasBlob,
    kForOnEventAttribute: Symbol("kIsForOnEventAttribute"),
    kListener: Symbol("kListener"),
    kStatusCode: Symbol("status-code"),
    kWebSocket: Symbol("websocket"),
    NOOP: () => {
    }
  };
});
var require_buffer_util = /* @__PURE__ */ __commonJSMin((exports, module) => {
  const { EMPTY_BUFFER } = require_constants();
  const FastBuffer = Buffer[Symbol.species];
  function concat(list, totalLength) {
    if (list.length === 0) return EMPTY_BUFFER;
    if (list.length === 1) return list[0];
    const target = Buffer.allocUnsafe(totalLength);
    let offset = 0;
    for (let i = 0; i < list.length; i++) {
      const buf = list[i];
      target.set(buf, offset);
      offset += buf.length;
    }
    if (offset < totalLength) return new FastBuffer(target.buffer, target.byteOffset, offset);
    return target;
  }
  function _mask(source, mask, output, offset, length) {
    for (let i = 0; i < length; i++) output[offset + i] = source[i] ^ mask[i & 3];
  }
  function _unmask(buffer, mask) {
    for (let i = 0; i < buffer.length; i++) buffer[i] ^= mask[i & 3];
  }
  function toArrayBuffer(buf) {
    if (buf.length === buf.buffer.byteLength) return buf.buffer;
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
  }
  function toBuffer(data) {
    toBuffer.readOnly = true;
    if (Buffer.isBuffer(data)) return data;
    let buf;
    if (data instanceof ArrayBuffer) buf = new FastBuffer(data);
    else if (ArrayBuffer.isView(data)) buf = new FastBuffer(data.buffer, data.byteOffset, data.byteLength);
    else {
      buf = Buffer.from(data);
      toBuffer.readOnly = false;
    }
    return buf;
  }
  module.exports = {
    concat,
    mask: _mask,
    toArrayBuffer,
    toBuffer,
    unmask: _unmask
  };
  if (!process.env.WS_NO_BUFFER_UTIL) try {
    const bufferUtil = __require("bufferutil");
    module.exports.mask = function(source, mask, output, offset, length) {
      if (length < 48) _mask(source, mask, output, offset, length);
      else bufferUtil.mask(source, mask, output, offset, length);
    };
    module.exports.unmask = function(buffer, mask) {
      if (buffer.length < 32) _unmask(buffer, mask);
      else bufferUtil.unmask(buffer, mask);
    };
  } catch (e) {
  }
});
var require_limiter = /* @__PURE__ */ __commonJSMin((exports, module) => {
  const kDone = Symbol("kDone");
  const kRun = Symbol("kRun");
  var Limiter = class {
    constructor(concurrency) {
      this[kDone] = () => {
        this.pending--;
        this[kRun]();
      };
      this.concurrency = concurrency || Infinity;
      this.jobs = [];
      this.pending = 0;
    }
    add(job) {
      this.jobs.push(job);
      this[kRun]();
    }
    [kRun]() {
      if (this.pending === this.concurrency) return;
      if (this.jobs.length) {
        const job = this.jobs.shift();
        this.pending++;
        job(this[kDone]);
      }
    }
  };
  module.exports = Limiter;
});
var require_permessage_deflate = /* @__PURE__ */ __commonJSMin((exports, module) => {
  const zlib = __require("zlib");
  const bufferUtil = require_buffer_util();
  const Limiter = require_limiter();
  const { kStatusCode } = require_constants();
  const FastBuffer = Buffer[Symbol.species];
  const TRAILER = Buffer.from([
    0,
    0,
    255,
    255
  ]);
  const kPerMessageDeflate = Symbol("permessage-deflate");
  const kTotalLength = Symbol("total-length");
  const kCallback = Symbol("callback");
  const kBuffers = Symbol("buffers");
  const kError = Symbol("error");
  let zlibLimiter;
  var PerMessageDeflate = class {
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
        zlibLimiter = new Limiter(concurrency);
      }
    }
    static get extensionName() {
      return "permessage-deflate";
    }
    offer() {
      const params = {};
      if (this._options.serverNoContextTakeover) params.server_no_context_takeover = true;
      if (this._options.clientNoContextTakeover) params.client_no_context_takeover = true;
      if (this._options.serverMaxWindowBits) params.server_max_window_bits = this._options.serverMaxWindowBits;
      if (this._options.clientMaxWindowBits) params.client_max_window_bits = this._options.clientMaxWindowBits;
      else if (this._options.clientMaxWindowBits == null) params.client_max_window_bits = true;
      return params;
    }
    accept(configurations) {
      configurations = this.normalizeParams(configurations);
      this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
      return this.params;
    }
    cleanup() {
      if (this._inflate) {
        this._inflate.close();
        this._inflate = null;
      }
      if (this._deflate) {
        const callback = this._deflate[kCallback];
        this._deflate.close();
        this._deflate = null;
        if (callback) callback(/* @__PURE__ */ new Error("The deflate stream was closed while data was being processed"));
      }
    }
    acceptAsServer(offers) {
      const opts = this._options;
      const accepted = offers.find((params) => {
        if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === "number" && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === "number" && !params.client_max_window_bits) return false;
        return true;
      });
      if (!accepted) throw new Error("None of the extension offers can be accepted");
      if (opts.serverNoContextTakeover) accepted.server_no_context_takeover = true;
      if (opts.clientNoContextTakeover) accepted.client_no_context_takeover = true;
      if (typeof opts.serverMaxWindowBits === "number") accepted.server_max_window_bits = opts.serverMaxWindowBits;
      if (typeof opts.clientMaxWindowBits === "number") accepted.client_max_window_bits = opts.clientMaxWindowBits;
      else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) delete accepted.client_max_window_bits;
      return accepted;
    }
    acceptAsClient(response) {
      const params = response[0];
      if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) throw new Error('Unexpected parameter "client_no_context_takeover"');
      if (!params.client_max_window_bits) {
        if (typeof this._options.clientMaxWindowBits === "number") params.client_max_window_bits = this._options.clientMaxWindowBits;
      } else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === "number" && params.client_max_window_bits > this._options.clientMaxWindowBits) throw new Error('Unexpected or invalid parameter "client_max_window_bits"');
      return params;
    }
    normalizeParams(configurations) {
      configurations.forEach((params) => {
        Object.keys(params).forEach((key) => {
          let value = params[key];
          if (value.length > 1) throw new Error(`Parameter "${key}" must have only a single value`);
          value = value[0];
          if (key === "client_max_window_bits") {
            if (value !== true) {
              const num = +value;
              if (!Number.isInteger(num) || num < 8 || num > 15) throw new TypeError(`Invalid value for parameter "${key}": ${value}`);
              value = num;
            } else if (!this._isServer) throw new TypeError(`Invalid value for parameter "${key}": ${value}`);
          } else if (key === "server_max_window_bits") {
            const num = +value;
            if (!Number.isInteger(num) || num < 8 || num > 15) throw new TypeError(`Invalid value for parameter "${key}": ${value}`);
            value = num;
          } else if (key === "client_no_context_takeover" || key === "server_no_context_takeover") {
            if (value !== true) throw new TypeError(`Invalid value for parameter "${key}": ${value}`);
          } else throw new Error(`Unknown parameter "${key}"`);
          params[key] = value;
        });
      });
      return configurations;
    }
    decompress(data, fin, callback) {
      zlibLimiter.add((done) => {
        this._decompress(data, fin, (err, result) => {
          done();
          callback(err, result);
        });
      });
    }
    compress(data, fin, callback) {
      zlibLimiter.add((done) => {
        this._compress(data, fin, (err, result) => {
          done();
          callback(err, result);
        });
      });
    }
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
        const err = this._inflate[kError];
        if (err) {
          this._inflate.close();
          this._inflate = null;
          callback(err);
          return;
        }
        const data2 = bufferUtil.concat(this._inflate[kBuffers], this._inflate[kTotalLength]);
        if (this._inflate._readableState.endEmitted) {
          this._inflate.close();
          this._inflate = null;
        } else {
          this._inflate[kTotalLength] = 0;
          this._inflate[kBuffers] = [];
          if (fin && this.params[`${endpoint}_no_context_takeover`]) this._inflate.reset();
        }
        callback(null, data2);
      });
    }
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
        if (!this._deflate) return;
        let data2 = bufferUtil.concat(this._deflate[kBuffers], this._deflate[kTotalLength]);
        if (fin) data2 = new FastBuffer(data2.buffer, data2.byteOffset, data2.length - 4);
        this._deflate[kCallback] = null;
        this._deflate[kTotalLength] = 0;
        this._deflate[kBuffers] = [];
        if (fin && this.params[`${endpoint}_no_context_takeover`]) this._deflate.reset();
        callback(null, data2);
      });
    }
  };
  module.exports = PerMessageDeflate;
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
    this[kError] = /* @__PURE__ */ new RangeError("Max payload size exceeded");
    this[kError].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH";
    this[kError][kStatusCode] = 1009;
    this.removeListener("data", inflateOnData);
    this.reset();
  }
  function inflateOnError(err) {
    this[kPerMessageDeflate]._inflate = null;
    if (this[kError]) {
      this[kCallback](this[kError]);
      return;
    }
    err[kStatusCode] = 1007;
    this[kCallback](err);
  }
});
var require_validation = /* @__PURE__ */ __commonJSMin((exports, module) => {
  const { isUtf8 } = __require("buffer");
  const { hasBlob } = require_constants();
  const tokenChars = [
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
  ];
  function isValidStatusCode(code) {
    return code >= 1e3 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3e3 && code <= 4999;
  }
  function _isValidUTF8(buf) {
    const len = buf.length;
    let i = 0;
    while (i < len) if ((buf[i] & 128) === 0) i++;
    else if ((buf[i] & 224) === 192) {
      if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) return false;
      i += 2;
    } else if ((buf[i] & 240) === 224) {
      if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || buf[i] === 237 && (buf[i + 1] & 224) === 160) return false;
      i += 3;
    } else if ((buf[i] & 248) === 240) {
      if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) return false;
      i += 4;
    } else return false;
    return true;
  }
  function isBlob(value) {
    return hasBlob && typeof value === "object" && typeof value.arrayBuffer === "function" && typeof value.type === "string" && typeof value.stream === "function" && (value[Symbol.toStringTag] === "Blob" || value[Symbol.toStringTag] === "File");
  }
  module.exports = {
    isBlob,
    isValidStatusCode,
    isValidUTF8: _isValidUTF8,
    tokenChars
  };
  if (isUtf8) module.exports.isValidUTF8 = function(buf) {
    return buf.length < 24 ? _isValidUTF8(buf) : isUtf8(buf);
  };
  else if (!process.env.WS_NO_UTF_8_VALIDATE) try {
    const isValidUTF8 = __require("utf-8-validate");
    module.exports.isValidUTF8 = function(buf) {
      return buf.length < 32 ? _isValidUTF8(buf) : isValidUTF8(buf);
    };
  } catch (e) {
  }
});
var require_receiver = /* @__PURE__ */ __commonJSMin((exports, module) => {
  const { Writable } = __require("stream");
  const PerMessageDeflate = require_permessage_deflate();
  const { BINARY_TYPES, EMPTY_BUFFER, kStatusCode, kWebSocket } = require_constants();
  const { concat, toArrayBuffer, unmask } = require_buffer_util();
  const { isValidStatusCode, isValidUTF8 } = require_validation();
  const FastBuffer = Buffer[Symbol.species];
  const GET_INFO = 0;
  const GET_PAYLOAD_LENGTH_16 = 1;
  const GET_PAYLOAD_LENGTH_64 = 2;
  const GET_MASK = 3;
  const GET_DATA = 4;
  const INFLATING = 5;
  const DEFER_EVENT = 6;
  var Receiver = class extends Writable {
    constructor(options = {}) {
      super();
      this._allowSynchronousEvents = options.allowSynchronousEvents !== void 0 ? options.allowSynchronousEvents : true;
      this._binaryType = options.binaryType || BINARY_TYPES[0];
      this._extensions = options.extensions || {};
      this._isServer = !!options.isServer;
      this._maxBufferedChunks = options.maxBufferedChunks | 0;
      this._maxFragments = options.maxFragments | 0;
      this._maxPayload = options.maxPayload | 0;
      this._skipUTF8Validation = !!options.skipUTF8Validation;
      this[kWebSocket] = void 0;
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
      this._fragments = [];
      this._errored = false;
      this._loop = false;
      this._state = GET_INFO;
    }
    _write(chunk, encoding, cb) {
      if (this._opcode === 8 && this._state == GET_INFO) return cb();
      if (this._maxBufferedChunks > 0 && this._buffers.length >= this._maxBufferedChunks) {
        cb(this.createError(RangeError, "Too many buffered chunks", false, 1008, "WS_ERR_TOO_MANY_BUFFERED_PARTS"));
        return;
      }
      this._bufferedBytes += chunk.length;
      this._buffers.push(chunk);
      this.startLoop(cb);
    }
    consume(n) {
      this._bufferedBytes -= n;
      if (n === this._buffers[0].length) return this._buffers.shift();
      if (n < this._buffers[0].length) {
        const buf = this._buffers[0];
        this._buffers[0] = new FastBuffer(buf.buffer, buf.byteOffset + n, buf.length - n);
        return new FastBuffer(buf.buffer, buf.byteOffset, n);
      }
      const dst = Buffer.allocUnsafe(n);
      do {
        const buf = this._buffers[0];
        const offset = dst.length - n;
        if (n >= buf.length) dst.set(this._buffers.shift(), offset);
        else {
          dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
          this._buffers[0] = new FastBuffer(buf.buffer, buf.byteOffset + n, buf.length - n);
        }
        n -= buf.length;
      } while (n > 0);
      return dst;
    }
    startLoop(cb) {
      this._loop = true;
      do
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
      while (this._loop);
      if (!this._errored) cb();
    }
    getInfo(cb) {
      if (this._bufferedBytes < 2) {
        this._loop = false;
        return;
      }
      const buf = this.consume(2);
      if ((buf[0] & 48) !== 0) {
        cb(this.createError(RangeError, "RSV2 and RSV3 must be clear", true, 1002, "WS_ERR_UNEXPECTED_RSV_2_3"));
        return;
      }
      const compressed = (buf[0] & 64) === 64;
      if (compressed && !this._extensions[PerMessageDeflate.extensionName]) {
        cb(this.createError(RangeError, "RSV1 must be clear", true, 1002, "WS_ERR_UNEXPECTED_RSV_1"));
        return;
      }
      this._fin = (buf[0] & 128) === 128;
      this._opcode = buf[0] & 15;
      this._payloadLength = buf[1] & 127;
      if (this._opcode === 0) {
        if (compressed) {
          cb(this.createError(RangeError, "RSV1 must be clear", true, 1002, "WS_ERR_UNEXPECTED_RSV_1"));
          return;
        }
        if (!this._fragmented) {
          cb(this.createError(RangeError, "invalid opcode 0", true, 1002, "WS_ERR_INVALID_OPCODE"));
          return;
        }
        this._opcode = this._fragmented;
      } else if (this._opcode === 1 || this._opcode === 2) {
        if (this._fragmented) {
          cb(this.createError(RangeError, `invalid opcode ${this._opcode}`, true, 1002, "WS_ERR_INVALID_OPCODE"));
          return;
        }
        this._compressed = compressed;
      } else if (this._opcode > 7 && this._opcode < 11) {
        if (!this._fin) {
          cb(this.createError(RangeError, "FIN must be set", true, 1002, "WS_ERR_EXPECTED_FIN"));
          return;
        }
        if (compressed) {
          cb(this.createError(RangeError, "RSV1 must be clear", true, 1002, "WS_ERR_UNEXPECTED_RSV_1"));
          return;
        }
        if (this._payloadLength > 125 || this._opcode === 8 && this._payloadLength === 1) {
          cb(this.createError(RangeError, `invalid payload length ${this._payloadLength}`, true, 1002, "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"));
          return;
        }
      } else {
        cb(this.createError(RangeError, `invalid opcode ${this._opcode}`, true, 1002, "WS_ERR_INVALID_OPCODE"));
        return;
      }
      if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
      this._masked = (buf[1] & 128) === 128;
      if (this._isServer) {
        if (!this._masked) {
          cb(this.createError(RangeError, "MASK must be set", true, 1002, "WS_ERR_EXPECTED_MASK"));
          return;
        }
      } else if (this._masked) {
        cb(this.createError(RangeError, "MASK must be clear", true, 1002, "WS_ERR_UNEXPECTED_MASK"));
        return;
      }
      if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
      else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;
      else this.haveLength(cb);
    }
    getPayloadLength16(cb) {
      if (this._bufferedBytes < 2) {
        this._loop = false;
        return;
      }
      this._payloadLength = this.consume(2).readUInt16BE(0);
      this.haveLength(cb);
    }
    getPayloadLength64(cb) {
      if (this._bufferedBytes < 8) {
        this._loop = false;
        return;
      }
      const buf = this.consume(8);
      const num = buf.readUInt32BE(0);
      if (num > Math.pow(2, 21) - 1) {
        cb(this.createError(RangeError, "Unsupported WebSocket frame: payload length > 2^53 - 1", false, 1009, "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH"));
        return;
      }
      this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
      this.haveLength(cb);
    }
    haveLength(cb) {
      if (this._payloadLength && this._opcode < 8) {
        this._totalPayloadLength += this._payloadLength;
        if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
          cb(this.createError(RangeError, "Max payload size exceeded", false, 1009, "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"));
          return;
        }
      }
      if (this._masked) this._state = GET_MASK;
      else this._state = GET_DATA;
    }
    getMask() {
      if (this._bufferedBytes < 4) {
        this._loop = false;
        return;
      }
      this._mask = this.consume(4);
      this._state = GET_DATA;
    }
    getData(cb) {
      let data = EMPTY_BUFFER;
      if (this._payloadLength) {
        if (this._bufferedBytes < this._payloadLength) {
          this._loop = false;
          return;
        }
        data = this.consume(this._payloadLength);
        if (this._masked && (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0) unmask(data, this._mask);
      }
      if (this._opcode > 7) {
        this.controlMessage(data, cb);
        return;
      }
      if (this._compressed) {
        this._state = INFLATING;
        this.decompress(data, cb);
        return;
      }
      if (data.length) {
        if (this._maxFragments > 0 && this._fragments.length >= this._maxFragments) {
          cb(this.createError(RangeError, "Too many message fragments", false, 1008, "WS_ERR_TOO_MANY_BUFFERED_PARTS"));
          return;
        }
        this._messageLength = this._totalPayloadLength;
        this._fragments.push(data);
      }
      this.dataMessage(cb);
    }
    decompress(data, cb) {
      this._extensions[PerMessageDeflate.extensionName].decompress(data, this._fin, (err, buf) => {
        if (err) return cb(err);
        if (buf.length) {
          this._messageLength += buf.length;
          if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
            cb(this.createError(RangeError, "Max payload size exceeded", false, 1009, "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"));
            return;
          }
          if (this._maxFragments > 0 && this._fragments.length >= this._maxFragments) {
            cb(this.createError(RangeError, "Too many message fragments", false, 1008, "WS_ERR_TOO_MANY_BUFFERED_PARTS"));
            return;
          }
          this._fragments.push(buf);
        }
        this.dataMessage(cb);
        if (this._state === GET_INFO) this.startLoop(cb);
      });
    }
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
      this._fragments = [];
      if (this._opcode === 2) {
        let data;
        if (this._binaryType === "nodebuffer") data = concat(fragments, messageLength);
        else if (this._binaryType === "arraybuffer") data = toArrayBuffer(concat(fragments, messageLength));
        else if (this._binaryType === "blob") data = new Blob(fragments);
        else data = fragments;
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
          cb(this.createError(Error, "invalid UTF-8 sequence", true, 1007, "WS_ERR_INVALID_UTF8"));
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
    controlMessage(data, cb) {
      if (this._opcode === 8) {
        if (data.length === 0) {
          this._loop = false;
          this.emit("conclude", 1005, EMPTY_BUFFER);
          this.end();
        } else {
          const code = data.readUInt16BE(0);
          if (!isValidStatusCode(code)) {
            cb(this.createError(RangeError, `invalid status code ${code}`, true, 1002, "WS_ERR_INVALID_CLOSE_CODE"));
            return;
          }
          const buf = new FastBuffer(data.buffer, data.byteOffset + 2, data.length - 2);
          if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
            cb(this.createError(Error, "invalid UTF-8 sequence", true, 1007, "WS_ERR_INVALID_UTF8"));
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
    createError(ErrorCtor, message, prefix, statusCode, errorCode) {
      this._loop = false;
      this._errored = true;
      const err = new ErrorCtor(prefix ? `Invalid WebSocket frame: ${message}` : message);
      Error.captureStackTrace(err, this.createError);
      err.code = errorCode;
      err[kStatusCode] = statusCode;
      return err;
    }
  };
  module.exports = Receiver;
});
var require_sender = /* @__PURE__ */ __commonJSMin((exports, module) => {
  const { Duplex: Duplex$3 } = __require("stream");
  const { randomFillSync } = __require("crypto");
  const { types: { isUint8Array } } = __require("util");
  const PerMessageDeflate = require_permessage_deflate();
  const { EMPTY_BUFFER, kWebSocket, NOOP } = require_constants();
  const { isBlob, isValidStatusCode } = require_validation();
  const { mask: applyMask, toBuffer } = require_buffer_util();
  const kByteLength = Symbol("kByteLength");
  const maskBuffer = Buffer.alloc(4);
  const RANDOM_POOL_SIZE = 8 * 1024;
  let randomPool;
  let randomPoolPointer = RANDOM_POOL_SIZE;
  const DEFAULT = 0;
  const DEFLATING = 1;
  const GET_BLOB_DATA = 2;
  module.exports = class Sender {
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
      this.onerror = NOOP;
      this[kWebSocket] = void 0;
    }
    static frame(data, options) {
      let mask;
      let merge = false;
      let offset = 2;
      let skipMasking = false;
      if (options.mask) {
        mask = options.maskBuffer || maskBuffer;
        if (options.generateMask) options.generateMask(mask);
        else {
          if (randomPoolPointer === RANDOM_POOL_SIZE) {
            if (randomPool === void 0) randomPool = Buffer.alloc(RANDOM_POOL_SIZE);
            randomFillSync(randomPool, 0, RANDOM_POOL_SIZE);
            randomPoolPointer = 0;
          }
          mask[0] = randomPool[randomPoolPointer++];
          mask[1] = randomPool[randomPoolPointer++];
          mask[2] = randomPool[randomPoolPointer++];
          mask[3] = randomPool[randomPoolPointer++];
        }
        skipMasking = (mask[0] | mask[1] | mask[2] | mask[3]) === 0;
        offset = 6;
      }
      let dataLength;
      if (typeof data === "string") if ((!options.mask || skipMasking) && options[kByteLength] !== void 0) dataLength = options[kByteLength];
      else {
        data = Buffer.from(data);
        dataLength = data.length;
      }
      else {
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
      if (payloadLength === 126) target.writeUInt16BE(dataLength, 2);
      else if (payloadLength === 127) {
        target[2] = target[3] = 0;
        target.writeUIntBE(dataLength, 4, 6);
      }
      if (!options.mask) return [target, data];
      target[1] |= 128;
      target[offset - 4] = mask[0];
      target[offset - 3] = mask[1];
      target[offset - 2] = mask[2];
      target[offset - 1] = mask[3];
      if (skipMasking) return [target, data];
      if (merge) {
        applyMask(data, mask, target, offset, dataLength);
        return [target];
      }
      applyMask(data, mask, data, 0, dataLength);
      return [target, data];
    }
    close(code, data, mask, cb) {
      let buf;
      if (code === void 0) buf = EMPTY_BUFFER;
      else if (typeof code !== "number" || !isValidStatusCode(code)) throw new TypeError("First argument must be a valid error code number");
      else if (data === void 0 || !data.length) {
        buf = Buffer.allocUnsafe(2);
        buf.writeUInt16BE(code, 0);
      } else {
        const length = Buffer.byteLength(data);
        if (length > 123) throw new RangeError("The message must not be greater than 123 bytes");
        buf = Buffer.allocUnsafe(2 + length);
        buf.writeUInt16BE(code, 0);
        if (typeof data === "string") buf.write(data, 2);
        else if (isUint8Array(data)) buf.set(data, 2);
        else throw new TypeError("Second argument must be a string or a Uint8Array");
      }
      const options = {
        [kByteLength]: buf.length,
        fin: true,
        generateMask: this._generateMask,
        mask,
        maskBuffer: this._maskBuffer,
        opcode: 8,
        readOnly: false,
        rsv1: false
      };
      if (this._state !== DEFAULT) this.enqueue([
        this.dispatch,
        buf,
        false,
        options,
        cb
      ]);
      else this.sendFrame(Sender.frame(buf, options), cb);
    }
    ping(data, mask, cb) {
      let byteLength;
      let readOnly;
      if (typeof data === "string") {
        byteLength = Buffer.byteLength(data);
        readOnly = false;
      } else if (isBlob(data)) {
        byteLength = data.size;
        readOnly = false;
      } else {
        data = toBuffer(data);
        byteLength = data.length;
        readOnly = toBuffer.readOnly;
      }
      if (byteLength > 125) throw new RangeError("The data size must not be greater than 125 bytes");
      const options = {
        [kByteLength]: byteLength,
        fin: true,
        generateMask: this._generateMask,
        mask,
        maskBuffer: this._maskBuffer,
        opcode: 9,
        readOnly,
        rsv1: false
      };
      if (isBlob(data)) if (this._state !== DEFAULT) this.enqueue([
        this.getBlobData,
        data,
        false,
        options,
        cb
      ]);
      else this.getBlobData(data, false, options, cb);
      else if (this._state !== DEFAULT) this.enqueue([
        this.dispatch,
        data,
        false,
        options,
        cb
      ]);
      else this.sendFrame(Sender.frame(data, options), cb);
    }
    pong(data, mask, cb) {
      let byteLength;
      let readOnly;
      if (typeof data === "string") {
        byteLength = Buffer.byteLength(data);
        readOnly = false;
      } else if (isBlob(data)) {
        byteLength = data.size;
        readOnly = false;
      } else {
        data = toBuffer(data);
        byteLength = data.length;
        readOnly = toBuffer.readOnly;
      }
      if (byteLength > 125) throw new RangeError("The data size must not be greater than 125 bytes");
      const options = {
        [kByteLength]: byteLength,
        fin: true,
        generateMask: this._generateMask,
        mask,
        maskBuffer: this._maskBuffer,
        opcode: 10,
        readOnly,
        rsv1: false
      };
      if (isBlob(data)) if (this._state !== DEFAULT) this.enqueue([
        this.getBlobData,
        data,
        false,
        options,
        cb
      ]);
      else this.getBlobData(data, false, options, cb);
      else if (this._state !== DEFAULT) this.enqueue([
        this.dispatch,
        data,
        false,
        options,
        cb
      ]);
      else this.sendFrame(Sender.frame(data, options), cb);
    }
    send(data, options, cb) {
      const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
      let opcode = options.binary ? 2 : 1;
      let rsv1 = options.compress;
      let byteLength;
      let readOnly;
      if (typeof data === "string") {
        byteLength = Buffer.byteLength(data);
        readOnly = false;
      } else if (isBlob(data)) {
        byteLength = data.size;
        readOnly = false;
      } else {
        data = toBuffer(data);
        byteLength = data.length;
        readOnly = toBuffer.readOnly;
      }
      if (this._firstFragment) {
        this._firstFragment = false;
        if (rsv1 && perMessageDeflate && perMessageDeflate.params[perMessageDeflate._isServer ? "server_no_context_takeover" : "client_no_context_takeover"]) rsv1 = byteLength >= perMessageDeflate._threshold;
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
      if (isBlob(data)) if (this._state !== DEFAULT) this.enqueue([
        this.getBlobData,
        data,
        this._compress,
        opts,
        cb
      ]);
      else this.getBlobData(data, this._compress, opts, cb);
      else if (this._state !== DEFAULT) this.enqueue([
        this.dispatch,
        data,
        this._compress,
        opts,
        cb
      ]);
      else this.dispatch(data, this._compress, opts, cb);
    }
    getBlobData(blob, compress, options, cb) {
      this._bufferedBytes += options[kByteLength];
      this._state = GET_BLOB_DATA;
      blob.arrayBuffer().then((arrayBuffer) => {
        if (this._socket.destroyed) {
          const err = /* @__PURE__ */ new Error("The socket was closed while the blob was being read");
          process.nextTick(callCallbacks, this, err, cb);
          return;
        }
        this._bufferedBytes -= options[kByteLength];
        const data = toBuffer(arrayBuffer);
        if (!compress) {
          this._state = DEFAULT;
          this.sendFrame(Sender.frame(data, options), cb);
          this.dequeue();
        } else this.dispatch(data, compress, options, cb);
      }).catch((err) => {
        process.nextTick(onError, this, err, cb);
      });
    }
    dispatch(data, compress, options, cb) {
      if (!compress) {
        this.sendFrame(Sender.frame(data, options), cb);
        return;
      }
      const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
      this._bufferedBytes += options[kByteLength];
      this._state = DEFLATING;
      perMessageDeflate.compress(data, options.fin, (_, buf) => {
        if (this._socket.destroyed) {
          const err = /* @__PURE__ */ new Error("The socket was closed while data was being compressed");
          callCallbacks(this, err, cb);
          return;
        }
        this._bufferedBytes -= options[kByteLength];
        this._state = DEFAULT;
        options.readOnly = false;
        this.sendFrame(Sender.frame(buf, options), cb);
        this.dequeue();
      });
    }
    dequeue() {
      while (this._state === DEFAULT && this._queue.length) {
        const params = this._queue.shift();
        this._bufferedBytes -= params[3][kByteLength];
        Reflect.apply(params[0], this, params.slice(1));
      }
    }
    enqueue(params) {
      this._bufferedBytes += params[3][kByteLength];
      this._queue.push(params);
    }
    sendFrame(list, cb) {
      if (list.length === 2) {
        this._socket.cork();
        this._socket.write(list[0]);
        this._socket.write(list[1], cb);
        this._socket.uncork();
      } else this._socket.write(list[0], cb);
    }
  };
  function callCallbacks(sender, err, cb) {
    if (typeof cb === "function") cb(err);
    for (let i = 0; i < sender._queue.length; i++) {
      const params = sender._queue[i];
      const callback = params[params.length - 1];
      if (typeof callback === "function") callback(err);
    }
  }
  function onError(sender, err, cb) {
    callCallbacks(sender, err, cb);
    sender.onerror(err);
  }
});
var require_event_target = /* @__PURE__ */ __commonJSMin((exports, module) => {
  const { kForOnEventAttribute, kListener } = require_constants();
  const kCode = Symbol("kCode");
  const kData = Symbol("kData");
  const kError = Symbol("kError");
  const kMessage = Symbol("kMessage");
  const kReason = Symbol("kReason");
  const kTarget = Symbol("kTarget");
  const kType = Symbol("kType");
  const kWasClean = Symbol("kWasClean");
  var Event = class {
    constructor(type) {
      this[kTarget] = null;
      this[kType] = type;
    }
    get target() {
      return this[kTarget];
    }
    get type() {
      return this[kType];
    }
  };
  Object.defineProperty(Event.prototype, "target", { enumerable: true });
  Object.defineProperty(Event.prototype, "type", { enumerable: true });
  var CloseEvent = class extends Event {
    constructor(type, options = {}) {
      super(type);
      this[kCode] = options.code === void 0 ? 0 : options.code;
      this[kReason] = options.reason === void 0 ? "" : options.reason;
      this[kWasClean] = options.wasClean === void 0 ? false : options.wasClean;
    }
    get code() {
      return this[kCode];
    }
    get reason() {
      return this[kReason];
    }
    get wasClean() {
      return this[kWasClean];
    }
  };
  Object.defineProperty(CloseEvent.prototype, "code", { enumerable: true });
  Object.defineProperty(CloseEvent.prototype, "reason", { enumerable: true });
  Object.defineProperty(CloseEvent.prototype, "wasClean", { enumerable: true });
  var ErrorEvent = class extends Event {
    constructor(type, options = {}) {
      super(type);
      this[kError] = options.error === void 0 ? null : options.error;
      this[kMessage] = options.message === void 0 ? "" : options.message;
    }
    get error() {
      return this[kError];
    }
    get message() {
      return this[kMessage];
    }
  };
  Object.defineProperty(ErrorEvent.prototype, "error", { enumerable: true });
  Object.defineProperty(ErrorEvent.prototype, "message", { enumerable: true });
  var MessageEvent = class extends Event {
    constructor(type, options = {}) {
      super(type);
      this[kData] = options.data === void 0 ? null : options.data;
    }
    get data() {
      return this[kData];
    }
  };
  Object.defineProperty(MessageEvent.prototype, "data", { enumerable: true });
  module.exports = {
    CloseEvent,
    ErrorEvent,
    Event,
    EventTarget: {
      addEventListener(type, handler, options = {}) {
        for (const listener of this.listeners(type)) if (!options[kForOnEventAttribute] && listener[kListener] === handler && !listener[kForOnEventAttribute]) return;
        let wrapper;
        if (type === "message") wrapper = function onMessage(data, isBinary) {
          const event = new MessageEvent("message", { data: isBinary ? data : data.toString() });
          event[kTarget] = this;
          callListener(handler, this, event);
        };
        else if (type === "close") wrapper = function onClose(code, message) {
          const event = new CloseEvent("close", {
            code,
            reason: message.toString(),
            wasClean: this._closeFrameReceived && this._closeFrameSent
          });
          event[kTarget] = this;
          callListener(handler, this, event);
        };
        else if (type === "error") wrapper = function onError(error) {
          const event = new ErrorEvent("error", {
            error,
            message: error.message
          });
          event[kTarget] = this;
          callListener(handler, this, event);
        };
        else if (type === "open") wrapper = function onOpen() {
          const event = new Event("open");
          event[kTarget] = this;
          callListener(handler, this, event);
        };
        else return;
        wrapper[kForOnEventAttribute] = !!options[kForOnEventAttribute];
        wrapper[kListener] = handler;
        if (options.once) this.once(type, wrapper);
        else this.on(type, wrapper);
      },
      removeEventListener(type, handler) {
        for (const listener of this.listeners(type)) if (listener[kListener] === handler && !listener[kForOnEventAttribute]) {
          this.removeListener(type, listener);
          break;
        }
      }
    },
    MessageEvent
  };
  function callListener(listener, thisArg, event) {
    if (typeof listener === "object" && listener.handleEvent) listener.handleEvent.call(listener, event);
    else listener.call(thisArg, event);
  }
});
var require_extension = /* @__PURE__ */ __commonJSMin((exports, module) => {
  const { tokenChars } = require_validation();
  function push(dest, name, elem) {
    if (dest[name] === void 0) dest[name] = [elem];
    else dest[name].push(elem);
  }
  function parse2(header) {
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
      if (extensionName === void 0) if (end === -1 && tokenChars[code] === 1) {
        if (start === -1) start = i;
      } else if (i !== 0 && (code === 32 || code === 9)) {
        if (end === -1 && start !== -1) end = i;
      } else if (code === 59 || code === 44) {
        if (start === -1) throw new SyntaxError(`Unexpected character at index ${i}`);
        if (end === -1) end = i;
        const name = header.slice(start, end);
        if (code === 44) {
          push(offers, name, params);
          params = /* @__PURE__ */ Object.create(null);
        } else extensionName = name;
        start = end = -1;
      } else throw new SyntaxError(`Unexpected character at index ${i}`);
      else if (paramName === void 0) if (end === -1 && tokenChars[code] === 1) {
        if (start === -1) start = i;
      } else if (code === 32 || code === 9) {
        if (end === -1 && start !== -1) end = i;
      } else if (code === 59 || code === 44) {
        if (start === -1) throw new SyntaxError(`Unexpected character at index ${i}`);
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
      } else throw new SyntaxError(`Unexpected character at index ${i}`);
      else if (isEscaping) {
        if (tokenChars[code] !== 1) throw new SyntaxError(`Unexpected character at index ${i}`);
        if (start === -1) start = i;
        else if (!mustUnescape) mustUnescape = true;
        isEscaping = false;
      } else if (inQuotes) if (tokenChars[code] === 1) {
        if (start === -1) start = i;
      } else if (code === 34 && start !== -1) {
        inQuotes = false;
        end = i;
      } else if (code === 92) isEscaping = true;
      else throw new SyntaxError(`Unexpected character at index ${i}`);
      else if (code === 34 && header.charCodeAt(i - 1) === 61) inQuotes = true;
      else if (end === -1 && tokenChars[code] === 1) {
        if (start === -1) start = i;
      } else if (start !== -1 && (code === 32 || code === 9)) {
        if (end === -1) end = i;
      } else if (code === 59 || code === 44) {
        if (start === -1) throw new SyntaxError(`Unexpected character at index ${i}`);
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
      } else throw new SyntaxError(`Unexpected character at index ${i}`);
    }
    if (start === -1 || inQuotes || code === 32 || code === 9) throw new SyntaxError("Unexpected end of input");
    if (end === -1) end = i;
    const token = header.slice(start, end);
    if (extensionName === void 0) push(offers, token, params);
    else {
      if (paramName === void 0) push(params, token, true);
      else if (mustUnescape) push(params, paramName, token.replace(/\\/g, ""));
      else push(params, paramName, token);
      push(offers, extensionName, params);
    }
    return offers;
  }
  function format(extensions) {
    return Object.keys(extensions).map((extension) => {
      let configurations = extensions[extension];
      if (!Array.isArray(configurations)) configurations = [configurations];
      return configurations.map((params) => {
        return [extension].concat(Object.keys(params).map((k) => {
          let values = params[k];
          if (!Array.isArray(values)) values = [values];
          return values.map((v) => v === true ? k : `${k}=${v}`).join("; ");
        })).join("; ");
      }).join(", ");
    }).join(", ");
  }
  module.exports = {
    format,
    parse: parse2
  };
});
var require_websocket = /* @__PURE__ */ __commonJSMin((exports, module) => {
  const EventEmitter$1 = __require("events");
  const https = __require("https");
  const http$1 = __require("http");
  const net = __require("net");
  const tls = __require("tls");
  const { randomBytes, createHash: createHash$1 } = __require("crypto");
  const { Duplex: Duplex$2, Readable: Readable2 } = __require("stream");
  const { URL: URL2 } = __require("url");
  const PerMessageDeflate = require_permessage_deflate();
  const Receiver = require_receiver();
  const Sender = require_sender();
  const { isBlob } = require_validation();
  const { BINARY_TYPES, CLOSE_TIMEOUT, EMPTY_BUFFER, GUID, kForOnEventAttribute, kListener, kStatusCode, kWebSocket, NOOP } = require_constants();
  const { EventTarget: { addEventListener, removeEventListener } } = require_event_target();
  const { format, parse: parse2 } = require_extension();
  const { toBuffer } = require_buffer_util();
  const kAborted = Symbol("kAborted");
  const protocolVersions = [8, 13];
  const readyStates = [
    "CONNECTING",
    "OPEN",
    "CLOSING",
    "CLOSED"
  ];
  const subprotocolRegex = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
  var WebSocket = class WebSocket2 extends EventEmitter$1 {
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
        if (protocols === void 0) protocols = [];
        else if (!Array.isArray(protocols)) if (typeof protocols === "object" && protocols !== null) {
          options = protocols;
          protocols = [];
        } else protocols = [protocols];
        initAsClient(this, address, protocols, options);
      } else {
        this._autoPong = options.autoPong;
        this._closeTimeout = options.closeTimeout;
        this._isServer = true;
      }
    }
    get binaryType() {
      return this._binaryType;
    }
    set binaryType(type) {
      if (!BINARY_TYPES.includes(type)) return;
      this._binaryType = type;
      if (this._receiver) this._receiver._binaryType = type;
    }
    get bufferedAmount() {
      if (!this._socket) return this._bufferedAmount;
      return this._socket._writableState.length + this._sender._bufferedBytes;
    }
    get extensions() {
      return Object.keys(this._extensions).join();
    }
    get isPaused() {
      return this._paused;
    }
    get onclose() {
      return null;
    }
    get onerror() {
      return null;
    }
    get onopen() {
      return null;
    }
    get onmessage() {
      return null;
    }
    get protocol() {
      return this._protocol;
    }
    get readyState() {
      return this._readyState;
    }
    get url() {
      return this._url;
    }
    setSocket(socket, head, options) {
      const receiver = new Receiver({
        allowSynchronousEvents: options.allowSynchronousEvents,
        binaryType: this.binaryType,
        extensions: this._extensions,
        isServer: this._isServer,
        maxBufferedChunks: options.maxBufferedChunks,
        maxFragments: options.maxFragments,
        maxPayload: options.maxPayload,
        skipUTF8Validation: options.skipUTF8Validation
      });
      const sender = new Sender(socket, this._extensions, options.generateMask);
      this._receiver = receiver;
      this._sender = sender;
      this._socket = socket;
      receiver[kWebSocket] = this;
      sender[kWebSocket] = this;
      socket[kWebSocket] = this;
      receiver.on("conclude", receiverOnConclude);
      receiver.on("drain", receiverOnDrain);
      receiver.on("error", receiverOnError);
      receiver.on("message", receiverOnMessage);
      receiver.on("ping", receiverOnPing);
      receiver.on("pong", receiverOnPong);
      sender.onerror = senderOnError;
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
    emitClose() {
      if (!this._socket) {
        this._readyState = WebSocket2.CLOSED;
        this.emit("close", this._closeCode, this._closeMessage);
        return;
      }
      if (this._extensions[PerMessageDeflate.extensionName]) this._extensions[PerMessageDeflate.extensionName].cleanup();
      this._receiver.removeAllListeners();
      this._readyState = WebSocket2.CLOSED;
      this.emit("close", this._closeCode, this._closeMessage);
    }
    close(code, data) {
      if (this.readyState === WebSocket2.CLOSED) return;
      if (this.readyState === WebSocket2.CONNECTING) {
        abortHandshake(this, this._req, "WebSocket was closed before the connection was established");
        return;
      }
      if (this.readyState === WebSocket2.CLOSING) {
        if (this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted)) this._socket.end();
        return;
      }
      this._readyState = WebSocket2.CLOSING;
      this._sender.close(code, data, !this._isServer, (err) => {
        if (err) return;
        this._closeFrameSent = true;
        if (this._closeFrameReceived || this._receiver._writableState.errorEmitted) this._socket.end();
      });
      setCloseTimer(this);
    }
    pause() {
      if (this.readyState === WebSocket2.CONNECTING || this.readyState === WebSocket2.CLOSED) return;
      this._paused = true;
      this._socket.pause();
    }
    ping(data, mask, cb) {
      if (this.readyState === WebSocket2.CONNECTING) throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
      if (typeof data === "function") {
        cb = data;
        data = mask = void 0;
      } else if (typeof mask === "function") {
        cb = mask;
        mask = void 0;
      }
      if (typeof data === "number") data = data.toString();
      if (this.readyState !== WebSocket2.OPEN) {
        sendAfterClose(this, data, cb);
        return;
      }
      if (mask === void 0) mask = !this._isServer;
      this._sender.ping(data || EMPTY_BUFFER, mask, cb);
    }
    pong(data, mask, cb) {
      if (this.readyState === WebSocket2.CONNECTING) throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
      if (typeof data === "function") {
        cb = data;
        data = mask = void 0;
      } else if (typeof mask === "function") {
        cb = mask;
        mask = void 0;
      }
      if (typeof data === "number") data = data.toString();
      if (this.readyState !== WebSocket2.OPEN) {
        sendAfterClose(this, data, cb);
        return;
      }
      if (mask === void 0) mask = !this._isServer;
      this._sender.pong(data || EMPTY_BUFFER, mask, cb);
    }
    resume() {
      if (this.readyState === WebSocket2.CONNECTING || this.readyState === WebSocket2.CLOSED) return;
      this._paused = false;
      if (!this._receiver._writableState.needDrain) this._socket.resume();
    }
    send(data, options, cb) {
      if (this.readyState === WebSocket2.CONNECTING) throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
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
      if (!this._extensions[PerMessageDeflate.extensionName]) opts.compress = false;
      this._sender.send(data || EMPTY_BUFFER, opts, cb);
    }
    terminate() {
      if (this.readyState === WebSocket2.CLOSED) return;
      if (this.readyState === WebSocket2.CONNECTING) {
        abortHandshake(this, this._req, "WebSocket was closed before the connection was established");
        return;
      }
      if (this._socket) {
        this._readyState = WebSocket2.CLOSING;
        this._socket.destroy();
      }
    }
  };
  Object.defineProperty(WebSocket, "CONNECTING", {
    enumerable: true,
    value: readyStates.indexOf("CONNECTING")
  });
  Object.defineProperty(WebSocket.prototype, "CONNECTING", {
    enumerable: true,
    value: readyStates.indexOf("CONNECTING")
  });
  Object.defineProperty(WebSocket, "OPEN", {
    enumerable: true,
    value: readyStates.indexOf("OPEN")
  });
  Object.defineProperty(WebSocket.prototype, "OPEN", {
    enumerable: true,
    value: readyStates.indexOf("OPEN")
  });
  Object.defineProperty(WebSocket, "CLOSING", {
    enumerable: true,
    value: readyStates.indexOf("CLOSING")
  });
  Object.defineProperty(WebSocket.prototype, "CLOSING", {
    enumerable: true,
    value: readyStates.indexOf("CLOSING")
  });
  Object.defineProperty(WebSocket, "CLOSED", {
    enumerable: true,
    value: readyStates.indexOf("CLOSED")
  });
  Object.defineProperty(WebSocket.prototype, "CLOSED", {
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
    Object.defineProperty(WebSocket.prototype, property, { enumerable: true });
  });
  [
    "open",
    "error",
    "close",
    "message"
  ].forEach((method) => {
    Object.defineProperty(WebSocket.prototype, `on${method}`, {
      enumerable: true,
      get() {
        for (const listener of this.listeners(method)) if (listener[kForOnEventAttribute]) return listener[kListener];
        return null;
      },
      set(handler) {
        for (const listener of this.listeners(method)) if (listener[kForOnEventAttribute]) {
          this.removeListener(method, listener);
          break;
        }
        if (typeof handler !== "function") return;
        this.addEventListener(method, handler, { [kForOnEventAttribute]: true });
      }
    });
  });
  WebSocket.prototype.addEventListener = addEventListener;
  WebSocket.prototype.removeEventListener = removeEventListener;
  module.exports = WebSocket;
  function initAsClient(websocket2, address, protocols, options) {
    const opts = {
      allowSynchronousEvents: true,
      autoPong: true,
      closeTimeout: CLOSE_TIMEOUT,
      protocolVersion: protocolVersions[1],
      maxBufferedChunks: 1024 * 1024,
      maxFragments: 128 * 1024,
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
    if (!protocolVersions.includes(opts.protocolVersion)) throw new RangeError(`Unsupported protocol version: ${opts.protocolVersion} (supported versions: ${protocolVersions.join(", ")})`);
    let parsedUrl;
    if (address instanceof URL2) parsedUrl = address;
    else try {
      parsedUrl = new URL2(address);
    } catch {
      throw new SyntaxError(`Invalid URL: ${address}`);
    }
    if (parsedUrl.protocol === "http:") parsedUrl.protocol = "ws:";
    else if (parsedUrl.protocol === "https:") parsedUrl.protocol = "wss:";
    websocket2._url = parsedUrl.href;
    const isSecure = parsedUrl.protocol === "wss:";
    const isIpcUrl = parsedUrl.protocol === "ws+unix:";
    let invalidUrlMessage;
    if (parsedUrl.protocol !== "ws:" && !isSecure && !isIpcUrl) invalidUrlMessage = `The URL's protocol must be one of "ws:", "wss:", "http:", "https:", or "ws+unix:"`;
    else if (isIpcUrl && !parsedUrl.pathname) invalidUrlMessage = "The URL's pathname is empty";
    else if (parsedUrl.hash) invalidUrlMessage = "The URL contains a fragment identifier";
    if (invalidUrlMessage) {
      const err = new SyntaxError(invalidUrlMessage);
      if (websocket2._redirects === 0) throw err;
      else {
        emitErrorAndClose(websocket2, err);
        return;
      }
    }
    const defaultPort = isSecure ? 443 : 80;
    const key = randomBytes(16).toString("base64");
    const request = isSecure ? https.request : http$1.request;
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
      perMessageDeflate = new PerMessageDeflate({
        ...opts.perMessageDeflate,
        isServer: false,
        maxPayload: opts.maxPayload
      });
      opts.headers["Sec-WebSocket-Extensions"] = format({ [PerMessageDeflate.extensionName]: perMessageDeflate.offer() });
    }
    if (protocols.length) {
      for (const protocol of protocols) {
        if (typeof protocol !== "string" || !subprotocolRegex.test(protocol) || protocolSet.has(protocol)) throw new SyntaxError("An invalid or duplicated subprotocol was specified");
        protocolSet.add(protocol);
      }
      opts.headers["Sec-WebSocket-Protocol"] = protocols.join(",");
    }
    if (opts.origin) if (opts.protocolVersion < 13) opts.headers["Sec-WebSocket-Origin"] = opts.origin;
    else opts.headers.Origin = opts.origin;
    if (parsedUrl.username || parsedUrl.password) opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
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
        options = {
          ...options,
          headers: {}
        };
        if (headers) for (const [key2, value] of Object.entries(headers)) options.headers[key2.toLowerCase()] = value;
      } else if (websocket2.listenerCount("redirect") === 0) {
        const isSameHost = isIpcUrl ? websocket2._originalIpc ? opts.socketPath === websocket2._originalHostOrSocketPath : false : websocket2._originalIpc ? false : parsedUrl.host === websocket2._originalHostOrSocketPath;
        if (!isSameHost || websocket2._originalSecure && !isSecure) {
          delete opts.headers.authorization;
          delete opts.headers.cookie;
          if (!isSameHost) delete opts.headers.host;
          opts.auth = void 0;
        }
      }
      if (opts.auth && !options.headers.authorization) options.headers.authorization = "Basic " + Buffer.from(opts.auth).toString("base64");
      req = websocket2._req = request(opts);
      if (websocket2._redirects) websocket2.emit("redirect", websocket2.url, req);
    } else req = websocket2._req = request(opts);
    if (opts.timeout) req.on("timeout", () => {
      abortHandshake(websocket2, req, "Opening handshake has timed out");
    });
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
          addr = new URL2(location, address);
        } catch (e) {
          emitErrorAndClose(websocket2, /* @__PURE__ */ new SyntaxError(`Invalid URL: ${location}`));
          return;
        }
        initAsClient(websocket2, addr, protocols, options);
      } else if (!websocket2.emit("unexpected-response", req, res)) abortHandshake(websocket2, req, `Unexpected server response: ${res.statusCode}`);
    });
    req.on("upgrade", (res, socket, head) => {
      websocket2.emit("upgrade", res);
      if (websocket2.readyState !== WebSocket.CONNECTING) return;
      req = websocket2._req = null;
      const upgrade2 = res.headers.upgrade;
      if (upgrade2 === void 0 || upgrade2.toLowerCase() !== "websocket") {
        abortHandshake(websocket2, socket, "Invalid Upgrade header");
        return;
      }
      const digest = createHash$1("sha1").update(key + GUID).digest("base64");
      if (res.headers["sec-websocket-accept"] !== digest) {
        abortHandshake(websocket2, socket, "Invalid Sec-WebSocket-Accept header");
        return;
      }
      const serverProt = res.headers["sec-websocket-protocol"];
      let protError;
      if (serverProt !== void 0) {
        if (!protocolSet.size) protError = "Server sent a subprotocol but none was requested";
        else if (!protocolSet.has(serverProt)) protError = "Server sent an invalid subprotocol";
      } else if (protocolSet.size) protError = "Server sent no subprotocol";
      if (protError) {
        abortHandshake(websocket2, socket, protError);
        return;
      }
      if (serverProt) websocket2._protocol = serverProt;
      const secWebSocketExtensions = res.headers["sec-websocket-extensions"];
      if (secWebSocketExtensions !== void 0) {
        if (!perMessageDeflate) {
          abortHandshake(websocket2, socket, "Server sent a Sec-WebSocket-Extensions header but no extension was requested");
          return;
        }
        let extensions;
        try {
          extensions = parse2(secWebSocketExtensions);
        } catch (err) {
          abortHandshake(websocket2, socket, "Invalid Sec-WebSocket-Extensions header");
          return;
        }
        const extensionNames = Object.keys(extensions);
        if (extensionNames.length !== 1 || extensionNames[0] !== PerMessageDeflate.extensionName) {
          abortHandshake(websocket2, socket, "Server indicated an extension that was not requested");
          return;
        }
        try {
          perMessageDeflate.accept(extensions[PerMessageDeflate.extensionName]);
        } catch (err) {
          abortHandshake(websocket2, socket, "Invalid Sec-WebSocket-Extensions header");
          return;
        }
        websocket2._extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
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
    if (opts.finishRequest) opts.finishRequest(req, websocket2);
    else req.end();
  }
  function emitErrorAndClose(websocket2, err) {
    websocket2._readyState = WebSocket.CLOSING;
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
    if (!options.servername && options.servername !== "") options.servername = net.isIP(options.host) ? "" : options.host;
    return tls.connect(options);
  }
  function abortHandshake(websocket2, stream, message) {
    websocket2._readyState = WebSocket.CLOSING;
    const err = new Error(message);
    Error.captureStackTrace(err, abortHandshake);
    if (stream.setHeader) {
      stream[kAborted] = true;
      stream.abort();
      if (stream.socket && !stream.socket.destroyed) stream.socket.destroy();
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
      const err = /* @__PURE__ */ new Error(`WebSocket is not open: readyState ${websocket2.readyState} (${readyStates[websocket2.readyState]})`);
      process.nextTick(cb, err);
    }
  }
  function receiverOnConclude(code, reason) {
    const websocket2 = this[kWebSocket];
    websocket2._closeFrameReceived = true;
    websocket2._closeMessage = reason;
    websocket2._closeCode = code;
    if (websocket2._socket[kWebSocket] === void 0) return;
    websocket2._socket.removeListener("data", socketOnData);
    process.nextTick(resume, websocket2._socket);
    if (code === 1005) websocket2.close();
    else websocket2.close(code, reason);
  }
  function receiverOnDrain() {
    const websocket2 = this[kWebSocket];
    if (!websocket2.isPaused) websocket2._socket.resume();
  }
  function receiverOnError(err) {
    const websocket2 = this[kWebSocket];
    if (websocket2._socket[kWebSocket] !== void 0) {
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
    this[kWebSocket].emitClose();
  }
  function receiverOnMessage(data, isBinary) {
    this[kWebSocket].emit("message", data, isBinary);
  }
  function receiverOnPing(data) {
    const websocket2 = this[kWebSocket];
    if (websocket2._autoPong) websocket2.pong(data, !this._isServer, NOOP);
    websocket2.emit("ping", data);
  }
  function receiverOnPong(data) {
    this[kWebSocket].emit("pong", data);
  }
  function resume(stream) {
    stream.resume();
  }
  function senderOnError(err) {
    const websocket2 = this[kWebSocket];
    if (websocket2.readyState === WebSocket.CLOSED) return;
    if (websocket2.readyState === WebSocket.OPEN) {
      websocket2._readyState = WebSocket.CLOSING;
      setCloseTimer(websocket2);
    }
    this._socket.end();
    if (!websocket2._errorEmitted) {
      websocket2._errorEmitted = true;
      websocket2.emit("error", err);
    }
  }
  function setCloseTimer(websocket2) {
    websocket2._closeTimer = setTimeout(websocket2._socket.destroy.bind(websocket2._socket), websocket2._closeTimeout);
  }
  function socketOnClose() {
    const websocket2 = this[kWebSocket];
    this.removeListener("close", socketOnClose);
    this.removeListener("data", socketOnData);
    this.removeListener("end", socketOnEnd);
    websocket2._readyState = WebSocket.CLOSING;
    if (!this._readableState.endEmitted && !websocket2._closeFrameReceived && !websocket2._receiver._writableState.errorEmitted && this._readableState.length !== 0) {
      const chunk = this.read(this._readableState.length);
      websocket2._receiver.write(chunk);
    }
    websocket2._receiver.end();
    this[kWebSocket] = void 0;
    clearTimeout(websocket2._closeTimer);
    if (websocket2._receiver._writableState.finished || websocket2._receiver._writableState.errorEmitted) websocket2.emitClose();
    else {
      websocket2._receiver.on("error", receiverOnFinish);
      websocket2._receiver.on("finish", receiverOnFinish);
    }
  }
  function socketOnData(chunk) {
    if (!this[kWebSocket]._receiver.write(chunk)) this.pause();
  }
  function socketOnEnd() {
    const websocket2 = this[kWebSocket];
    websocket2._readyState = WebSocket.CLOSING;
    websocket2._receiver.end();
    this.end();
  }
  function socketOnError() {
    const websocket2 = this[kWebSocket];
    this.removeListener("error", socketOnError);
    this.on("error", NOOP);
    if (websocket2) {
      websocket2._readyState = WebSocket.CLOSING;
      this.destroy();
    }
  }
});
var require_stream = /* @__PURE__ */ __commonJSMin((exports, module) => {
  require_websocket();
  const { Duplex: Duplex$1 } = __require("stream");
  function emitClose(stream) {
    stream.emit("close");
  }
  function duplexOnEnd() {
    if (!this.destroyed && this._writableState.finished) this.destroy();
  }
  function duplexOnError(err) {
    this.removeListener("error", duplexOnError);
    this.destroy();
    if (this.listenerCount("error") === 0) this.emit("error", err);
  }
  function createWebSocketStream(ws, options) {
    let terminateOnDestroy = true;
    const duplex = new Duplex$1({
      ...options,
      autoDestroy: false,
      emitClose: false,
      objectMode: false,
      writableObjectMode: false
    });
    ws.on("message", function message(msg, isBinary) {
      const data = !isBinary && duplex._readableState.objectMode ? msg.toString() : msg;
      if (!duplex.push(data)) ws.pause();
    });
    ws.once("error", function error(err) {
      if (duplex.destroyed) return;
      terminateOnDestroy = false;
      duplex.destroy(err);
    });
    ws.once("close", function close() {
      if (duplex.destroyed) return;
      duplex.push(null);
    });
    duplex._destroy = function(err, callback) {
      if (ws.readyState === ws.CLOSED) {
        callback(err);
        process.nextTick(emitClose, duplex);
        return;
      }
      let called = false;
      ws.once("error", function error(err2) {
        called = true;
        callback(err2);
      });
      ws.once("close", function close() {
        if (!called) callback(err);
        process.nextTick(emitClose, duplex);
      });
      if (terminateOnDestroy) ws.terminate();
    };
    duplex._final = function(callback) {
      if (ws.readyState === ws.CONNECTING) {
        ws.once("open", function open() {
          duplex._final(callback);
        });
        return;
      }
      if (ws._socket === null) return;
      if (ws._socket._writableState.finished) {
        callback();
        if (duplex._readableState.endEmitted) duplex.destroy();
      } else {
        ws._socket.once("finish", function finish() {
          callback();
        });
        ws.close();
      }
    };
    duplex._read = function() {
      if (ws.isPaused) ws.resume();
    };
    duplex._write = function(chunk, encoding, callback) {
      if (ws.readyState === ws.CONNECTING) {
        ws.once("open", function open() {
          duplex._write(chunk, encoding, callback);
        });
        return;
      }
      ws.send(chunk, callback);
    };
    duplex.on("end", duplexOnEnd);
    duplex.on("error", duplexOnError);
    return duplex;
  }
  module.exports = createWebSocketStream;
});
var require_subprotocol = /* @__PURE__ */ __commonJSMin((exports, module) => {
  const { tokenChars } = require_validation();
  function parse2(header) {
    const protocols = /* @__PURE__ */ new Set();
    let start = -1;
    let end = -1;
    let i = 0;
    for (; i < header.length; i++) {
      const code = header.charCodeAt(i);
      if (end === -1 && tokenChars[code] === 1) {
        if (start === -1) start = i;
      } else if (i !== 0 && (code === 32 || code === 9)) {
        if (end === -1 && start !== -1) end = i;
      } else if (code === 44) {
        if (start === -1) throw new SyntaxError(`Unexpected character at index ${i}`);
        if (end === -1) end = i;
        const protocol2 = header.slice(start, end);
        if (protocols.has(protocol2)) throw new SyntaxError(`The "${protocol2}" subprotocol is duplicated`);
        protocols.add(protocol2);
        start = end = -1;
      } else throw new SyntaxError(`Unexpected character at index ${i}`);
    }
    if (start === -1 || end !== -1) throw new SyntaxError("Unexpected end of input");
    const protocol = header.slice(start, i);
    if (protocols.has(protocol)) throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
    protocols.add(protocol);
    return protocols;
  }
  module.exports = { parse: parse2 };
});
var require_websocket_server = /* @__PURE__ */ __commonJSMin((exports, module) => {
  const EventEmitter = __require("events");
  const http = __require("http");
  const { Duplex } = __require("stream");
  const { createHash } = __require("crypto");
  const extension = require_extension();
  const PerMessageDeflate = require_permessage_deflate();
  const subprotocol = require_subprotocol();
  const WebSocket = require_websocket();
  const { CLOSE_TIMEOUT, GUID, kWebSocket } = require_constants();
  const keyRegex = /^[+/0-9A-Za-z]{22}==$/;
  const RUNNING = 0;
  const CLOSING = 1;
  const CLOSED = 2;
  var WebSocketServer = class extends EventEmitter {
    constructor(options, callback) {
      super();
      options = {
        allowSynchronousEvents: true,
        autoPong: true,
        maxBufferedChunks: 1024 * 1024,
        maxFragments: 128 * 1024,
        maxPayload: 100 * 1024 * 1024,
        skipUTF8Validation: false,
        perMessageDeflate: false,
        handleProtocols: null,
        clientTracking: true,
        closeTimeout: CLOSE_TIMEOUT,
        verifyClient: null,
        noServer: false,
        backlog: null,
        server: null,
        host: null,
        path: null,
        port: null,
        WebSocket,
        ...options
      };
      if (options.port == null && !options.server && !options.noServer || options.port != null && (options.server || options.noServer) || options.server && options.noServer) throw new TypeError('One and only one of the "port", "server", or "noServer" options must be specified');
      if (options.port != null) {
        this._server = http.createServer((req, res) => {
          const body = http.STATUS_CODES[426];
          res.writeHead(426, {
            "Content-Length": body.length,
            "Content-Type": "text/plain"
          });
          res.end(body);
        });
        this._server.listen(options.port, options.host, options.backlog, callback);
      } else if (options.server) this._server = options.server;
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
    address() {
      if (this.options.noServer) throw new Error('The server is operating in "noServer" mode');
      if (!this._server) return null;
      return this._server.address();
    }
    close(cb) {
      if (this._state === CLOSED) {
        if (cb) this.once("close", () => {
          cb(/* @__PURE__ */ new Error("The server is not running"));
        });
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
        if (this.clients) if (!this.clients.size) process.nextTick(emitClose, this);
        else this._shouldEmitClose = true;
        else process.nextTick(emitClose, this);
      } else {
        const server = this._server;
        this._removeListeners();
        this._removeListeners = this._server = null;
        server.close(() => {
          emitClose(this);
        });
      }
    }
    shouldHandle(req) {
      if (this.options.path) {
        const index = req.url.indexOf("?");
        if ((index !== -1 ? req.url.slice(0, index) : req.url) !== this.options.path) return false;
      }
      return true;
    }
    handleUpgrade(req, socket, head, cb) {
      socket.on("error", socketOnError);
      const key = req.headers["sec-websocket-key"];
      const upgrade2 = req.headers.upgrade;
      const version = +req.headers["sec-websocket-version"];
      if (req.method !== "GET") {
        abortHandshakeOrEmitwsClientError(this, req, socket, 405, "Invalid HTTP method");
        return;
      }
      if (upgrade2 === void 0 || upgrade2.toLowerCase() !== "websocket") {
        abortHandshakeOrEmitwsClientError(this, req, socket, 400, "Invalid Upgrade header");
        return;
      }
      if (key === void 0 || !keyRegex.test(key)) {
        abortHandshakeOrEmitwsClientError(this, req, socket, 400, "Missing or invalid Sec-WebSocket-Key header");
        return;
      }
      if (version !== 13 && version !== 8) {
        abortHandshakeOrEmitwsClientError(this, req, socket, 400, "Missing or invalid Sec-WebSocket-Version header", { "Sec-WebSocket-Version": "13, 8" });
        return;
      }
      if (!this.shouldHandle(req)) {
        abortHandshake(socket, 400);
        return;
      }
      const secWebSocketProtocol = req.headers["sec-websocket-protocol"];
      let protocols = /* @__PURE__ */ new Set();
      if (secWebSocketProtocol !== void 0) try {
        protocols = subprotocol.parse(secWebSocketProtocol);
      } catch (err) {
        abortHandshakeOrEmitwsClientError(this, req, socket, 400, "Invalid Sec-WebSocket-Protocol header");
        return;
      }
      const secWebSocketExtensions = req.headers["sec-websocket-extensions"];
      const extensions = {};
      if (this.options.perMessageDeflate && secWebSocketExtensions !== void 0) {
        const perMessageDeflate = new PerMessageDeflate({
          ...this.options.perMessageDeflate,
          isServer: true,
          maxPayload: this.options.maxPayload
        });
        try {
          const offers = extension.parse(secWebSocketExtensions);
          if (offers[PerMessageDeflate.extensionName]) {
            perMessageDeflate.accept(offers[PerMessageDeflate.extensionName]);
            extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
          }
        } catch (err) {
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, "Invalid or unacceptable Sec-WebSocket-Extensions header");
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
            if (!verified) return abortHandshake(socket, code || 401, message, headers);
            this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
          });
          return;
        }
        if (!this.options.verifyClient(info)) return abortHandshake(socket, 401);
      }
      this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
    }
    completeUpgrade(extensions, key, protocols, req, socket, head, cb) {
      if (!socket.readable || !socket.writable) return socket.destroy();
      if (socket[kWebSocket]) throw new Error("server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration");
      if (this._state > RUNNING) return abortHandshake(socket, 503);
      const headers = [
        "HTTP/1.1 101 Switching Protocols",
        "Upgrade: websocket",
        "Connection: Upgrade",
        `Sec-WebSocket-Accept: ${createHash("sha1").update(key + GUID).digest("base64")}`
      ];
      const ws = new this.options.WebSocket(null, void 0, this.options);
      if (protocols.size) {
        const protocol = this.options.handleProtocols ? this.options.handleProtocols(protocols, req) : protocols.values().next().value;
        if (protocol) {
          headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
          ws._protocol = protocol;
        }
      }
      if (extensions[PerMessageDeflate.extensionName]) {
        const params = extensions[PerMessageDeflate.extensionName].params;
        const value = extension.format({ [PerMessageDeflate.extensionName]: [params] });
        headers.push(`Sec-WebSocket-Extensions: ${value}`);
        ws._extensions = extensions;
      }
      this.emit("headers", headers, req);
      socket.write(headers.concat("\r\n").join("\r\n"));
      socket.removeListener("error", socketOnError);
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
          if (this._shouldEmitClose && !this.clients.size) process.nextTick(emitClose, this);
        });
      }
      cb(ws, req);
    }
  };
  module.exports = WebSocketServer;
  function addListeners(server, map2) {
    for (const event of Object.keys(map2)) server.on(event, map2[event]);
    return function removeListeners() {
      for (const event of Object.keys(map2)) server.removeListener(event, map2[event]);
    };
  }
  function emitClose(server) {
    server._state = CLOSED;
    server.emit("close");
  }
  function socketOnError() {
    this.destroy();
  }
  function abortHandshake(socket, code, message, headers) {
    message = message || http.STATUS_CODES[code];
    headers = {
      Connection: "close",
      "Content-Type": "text/html",
      "Content-Length": Buffer.byteLength(message),
      ...headers
    };
    socket.once("finish", socket.destroy);
    socket.end(`HTTP/1.1 ${code} ${http.STATUS_CODES[code]}\r
` + Object.keys(headers).map((h) => `${h}: ${headers[h]}`).join("\r\n") + "\r\n\r\n" + message);
  }
  function abortHandshakeOrEmitwsClientError(server, req, socket, code, message, headers) {
    if (server.listenerCount("wsClientError")) {
      const err = new Error(message);
      Error.captureStackTrace(err, abortHandshakeOrEmitwsClientError);
      server.emit("wsClientError", err, socket, req);
    } else abortHandshake(socket, code, message, headers);
  }
});
require_stream();
require_extension();
require_permessage_deflate();
require_receiver();
require_sender();
require_subprotocol();
/* @__PURE__ */ __toESM(require_websocket());
var import_websocket_server = /* @__PURE__ */ __toESM(require_websocket_server());
var AdapterHookable = (_d = class {
  constructor(options) {
    __publicField(this, "options");
    __privateAdd(this, _resolveCache, /* @__PURE__ */ new WeakMap());
    this.options = options || {};
  }
  callHook(name, arg1, arg2, connection) {
    var _a3;
    const globalHook = (_a3 = this.options.hooks) == null ? void 0 : _a3[name];
    const globalPromise = globalHook == null ? void 0 : globalHook(arg1, arg2);
    const resolve = this.options.resolve;
    if (!resolve) return globalPromise;
    const request = arg1.request || arg1;
    const cacheKey = connection || arg1.context || request;
    let resolveHooksPromise;
    if (__privateGet(this, _resolveCache).has(cacheKey)) resolveHooksPromise = __privateGet(this, _resolveCache).get(cacheKey);
    else {
      try {
        resolveHooksPromise = resolve(request);
      } catch (error) {
        resolveHooksPromise = Promise.reject(error);
      }
      __privateGet(this, _resolveCache).set(cacheKey, resolveHooksPromise);
      if (resolveHooksPromise instanceof Promise) resolveHooksPromise.catch(() => {
        if (__privateGet(this, _resolveCache).get(cacheKey) === resolveHooksPromise) __privateGet(this, _resolveCache).delete(cacheKey);
      });
    }
    if (!resolveHooksPromise) return globalPromise;
    const resolvePromise = resolveHooksPromise instanceof Promise ? resolveHooksPromise.then((hooks) => hooks == null ? void 0 : hooks[name]) : resolveHooksPromise == null ? void 0 : resolveHooksPromise[name];
    return Promise.all([globalPromise, resolvePromise]).then(([globalRes, hook]) => {
      const hookResPromise = hook == null ? void 0 : hook(arg1, arg2);
      return hookResPromise instanceof Promise ? hookResPromise.then((hookRes) => hookRes || globalRes) : hookResPromise || globalRes;
    });
  }
  async upgrade(request) {
    var _a3, _b2;
    let namespace = ((_b2 = (_a3 = this.options).getNamespace) == null ? void 0 : _b2.call(_a3, request)) ?? new URL(request.url).pathname;
    const context = request.context || {};
    let upgradeHeaders;
    let protocolFromHook;
    try {
      const res = await this.callHook("upgrade", request, void 0, context);
      if (res) {
        if (res.namespace) namespace = res.namespace;
        if (res.context) Object.assign(context, res.context);
        if (res instanceof Response) return {
          context,
          namespace,
          endResponse: res
        };
        if (res.handled) return {
          context,
          namespace,
          handled: true
        };
        upgradeHeaders = res.headers;
        protocolFromHook = res.protocol;
      }
    } catch (error) {
      const errResponse = error.response || error;
      if (errResponse instanceof Response) return {
        context,
        namespace,
        endResponse: errResponse
      };
      throw error;
    }
    const protocol = await this._resolveProtocol(request, upgradeHeaders, protocolFromHook);
    if (protocol) {
      const merged = new Headers(upgradeHeaders);
      merged.set("sec-websocket-protocol", protocol);
      upgradeHeaders = merged;
    }
    return {
      context,
      namespace,
      upgradeHeaders
    };
  }
  async _resolveProtocol(request, upgradeHeaders, protocolFromHook) {
    if (protocolFromHook) return protocolFromHook;
    if (upgradeHeaders) {
      const fromHeader = (upgradeHeaders instanceof Headers ? upgradeHeaders : new Headers(upgradeHeaders)).get("sec-websocket-protocol");
      if (fromHeader) return fromHeader;
    }
    const handleProtocols = this.options.handleProtocols;
    if (handleProtocols) {
      const offered = _parseProtocols(request.headers.get("sec-websocket-protocol"));
      if (offered.size > 0) {
        const chosen = await handleProtocols(offered, request);
        if (chosen) return chosen;
      }
    }
  }
}, _resolveCache = new WeakMap(), _d);
function _parseProtocols(header) {
  const protocols = /* @__PURE__ */ new Set();
  if (!header) return protocols;
  for (const part of header.split(",")) {
    const token = part.trim();
    if (token) protocols.add(token);
  }
  return protocols;
}
function defineHooks(hooks) {
  return hooks;
}
const kNodeInspect = /* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom");
function toBufferLike(val) {
  if (val === void 0 || val === null) return "";
  const type = typeof val;
  if (type === "string") return val;
  if (type === "number" || type === "boolean" || type === "bigint") return val.toString();
  if (type === "function" || type === "symbol") return "{}";
  if (val instanceof Uint8Array || val instanceof ArrayBuffer) return val;
  if (isPlainObject(val)) return JSON.stringify(val);
  return val;
}
function serializeMessage(val) {
  const data = toBufferLike(val);
  if (typeof data === "string") return data;
  return data instanceof Uint8Array ? data : new Uint8Array(data);
}
function isPlainObject(value) {
  if (value === null || typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== null && prototype !== Object.prototype && Object.getPrototypeOf(prototype) !== null) return false;
  if (Symbol.iterator in value) return false;
  if (Symbol.toStringTag in value) return Object.prototype.toString.call(value) === "[object Module]";
  return true;
}
function adapterUtils(globalPeers, options, caps) {
  const localPublish = (topic, message, pubOptions) => {
    for (const peers of (pubOptions == null ? void 0 : pubOptions.namespace) ? [globalPeers.get(pubOptions.namespace) || []] : globalPeers.values()) {
      let firstPeerWithTopic;
      for (const peer of peers) if (peer.topics.has(topic)) {
        firstPeerWithTopic = peer;
        break;
      }
      if (firstPeerWithTopic) {
        firstPeerWithTopic.send(message, pubOptions);
        firstPeerWithTopic._publish(topic, message, pubOptions);
      }
    }
  };
  let sync;
  if (options == null ? void 0 : options.sync) {
    const report = (stage, error) => {
      if (options.onError) options.onError(error, { stage });
      else console.error(`[crossws] sync ${stage} failed:`, error);
    };
    const driver = options.sync({ id: crypto.randomUUID() });
    const deliver = (msg) => {
      try {
        localPublish(msg.topic, msg.data, { namespace: msg.namespace || void 0 });
      } catch (error) {
        report("delivery", error);
      }
    };
    try {
      Promise.resolve(driver.subscribe(deliver)).catch((error) => report("subscribe", error));
    } catch (error) {
      report("subscribe", error);
    }
    sync = {
      subscribe: (deliver2) => driver.subscribe(deliver2),
      publish: (msg) => {
        try {
          return Promise.resolve(driver.publish(msg)).catch((e) => report("publish", e));
        } catch (error) {
          report("publish", error);
        }
      },
      close: driver.close ? () => driver.close() : void 0
    };
  }
  return {
    peers: globalPeers,
    sync,
    publish(topic, message, options2) {
      localPublish(topic, message, options2);
      sync == null ? void 0 : sync.publish({
        namespace: (options2 == null ? void 0 : options2.namespace) || "",
        topic,
        data: serializeMessage(message)
      });
    },
    async close(code, reason) {
      var _a3;
      for (const peers of globalPeers.values()) for (const peer of peers) peer.close(code, reason);
      await ((_a3 = sync == null ? void 0 : sync.close) == null ? void 0 : _a3.call(sync));
    }
  };
}
function getPeers(globalPeers, namespace) {
  if (!namespace) throw new Error("Websocket publish namespace missing.");
  let peers = globalPeers.get(namespace);
  if (!peers) {
    peers = /* @__PURE__ */ new Set();
    globalPeers.set(namespace, peers);
  }
  return peers;
}
var Message = (_e = class {
  constructor(rawData, peer, event) {
    __publicField(this, "event");
    __publicField(this, "peer");
    __publicField(this, "rawData");
    __privateAdd(this, _id);
    __privateAdd(this, _uint8Array);
    __privateAdd(this, _arrayBuffer);
    __privateAdd(this, _blob);
    __privateAdd(this, _text);
    __privateAdd(this, _json);
    this.rawData = rawData || "";
    this.peer = peer;
    this.event = event;
  }
  get id() {
    if (!__privateGet(this, _id)) __privateSet(this, _id, crypto.randomUUID());
    return __privateGet(this, _id);
  }
  uint8Array() {
    const _uint8Array2 = __privateGet(this, _uint8Array);
    if (_uint8Array2) return _uint8Array2;
    const rawData = this.rawData;
    if (rawData instanceof Uint8Array) return __privateSet(this, _uint8Array, rawData);
    if (rawData instanceof ArrayBuffer || rawData instanceof SharedArrayBuffer) {
      __privateSet(this, _arrayBuffer, rawData);
      return __privateSet(this, _uint8Array, new Uint8Array(rawData));
    }
    if (typeof rawData === "string") {
      __privateSet(this, _text, rawData);
      return __privateSet(this, _uint8Array, new TextEncoder().encode(__privateGet(this, _text)));
    }
    if (Symbol.iterator in rawData) return __privateSet(this, _uint8Array, new Uint8Array(rawData));
    if (typeof (rawData == null ? void 0 : rawData.length) === "number") return __privateSet(this, _uint8Array, new Uint8Array(rawData));
    if (rawData instanceof DataView) return __privateSet(this, _uint8Array, new Uint8Array(rawData.buffer, rawData.byteOffset, rawData.byteLength));
    throw new TypeError(`Unsupported message type: ${Object.prototype.toString.call(rawData)}`);
  }
  arrayBuffer() {
    const _arrayBuffer2 = __privateGet(this, _arrayBuffer);
    if (_arrayBuffer2) return _arrayBuffer2;
    const rawData = this.rawData;
    if (rawData instanceof ArrayBuffer || rawData instanceof SharedArrayBuffer) return __privateSet(this, _arrayBuffer, rawData);
    return __privateSet(this, _arrayBuffer, this.uint8Array().buffer);
  }
  blob() {
    const _blob2 = __privateGet(this, _blob);
    if (_blob2) return _blob2;
    const rawData = this.rawData;
    if (rawData instanceof Blob) return __privateSet(this, _blob, rawData);
    return __privateSet(this, _blob, new Blob([this.uint8Array()]));
  }
  text() {
    const _text2 = __privateGet(this, _text);
    if (_text2) return _text2;
    const rawData = this.rawData;
    if (typeof rawData === "string") return __privateSet(this, _text, rawData);
    return __privateSet(this, _text, new TextDecoder().decode(this.uint8Array()));
  }
  json() {
    const _json2 = __privateGet(this, _json);
    if (_json2) return _json2;
    return __privateSet(this, _json, JSON.parse(this.text()));
  }
  get data() {
    var _a3, _b2;
    switch ((_b2 = (_a3 = this.peer) == null ? void 0 : _a3.websocket) == null ? void 0 : _b2.binaryType) {
      case "arraybuffer":
        return this.arrayBuffer();
      case "blob":
        return this.blob();
      case "nodebuffer":
        return globalThis.Buffer ? Buffer.from(this.uint8Array()) : this.uint8Array();
      case "uint8array":
        return this.uint8Array();
      case "text":
        return this.text();
      default:
        return this.rawData;
    }
  }
  toString() {
    return this.text();
  }
  [Symbol.toPrimitive]() {
    return this.text();
  }
  [kNodeInspect]() {
    return { message: {
      id: this.id,
      peer: this.peer,
      text: this.text()
    } };
  }
}, _id = new WeakMap(), _uint8Array = new WeakMap(), _arrayBuffer = new WeakMap(), _blob = new WeakMap(), _text = new WeakMap(), _json = new WeakMap(), _e);
var Peer = (_f = class {
  constructor(internal) {
    __publicField(this, "_internal");
    __publicField(this, "_topics");
    __publicField(this, "_id");
    __privateAdd(this, _ws);
    __privateAdd(this, _pingUnsupportedWarned, false);
    this._topics = /* @__PURE__ */ new Set();
    this._internal = internal;
  }
  get context() {
    var _a3;
    return (_a3 = this._internal).context ?? (_a3.context = {});
  }
  get namespace() {
    return this._internal.namespace;
  }
  get id() {
    if (!this._id) this._id = crypto.randomUUID();
    return this._id;
  }
  get remoteAddress() {
  }
  get request() {
    return this._internal.request;
  }
  get websocket() {
    if (!__privateGet(this, _ws)) {
      const _ws2 = this._internal.ws;
      const _request = this._internal.request;
      __privateSet(this, _ws, _request ? createWsProxy(_ws2, _request) : _ws2);
    }
    return __privateGet(this, _ws);
  }
  get peers() {
    return this._internal.peers || /* @__PURE__ */ new Set();
  }
  get topics() {
    return this._topics;
  }
  get bufferedAmount() {
    var _a3;
    return ((_a3 = this._internal.ws) == null ? void 0 : _a3.bufferedAmount) ?? 0;
  }
  waitForDrain(opts = {}) {
    const threshold = opts.threshold ?? 0;
    if (this.bufferedAmount <= threshold) return Promise.resolve();
    const signal = opts.signal;
    if (signal == null ? void 0 : signal.aborted) return Promise.reject(signal.reason);
    return new Promise((resolve, reject) => {
      var _a3;
      const check = () => {
        if (this.bufferedAmount <= threshold || (this.websocket.readyState ?? 1) > 1) {
          cleanup();
          resolve();
        }
      };
      const onAbort = () => {
        cleanup();
        reject(signal.reason);
      };
      const timer = setInterval(check, opts.pollInterval ?? 100);
      (_a3 = timer.unref) == null ? void 0 : _a3.call(timer);
      const cleanup = () => {
        clearInterval(timer);
        signal == null ? void 0 : signal.removeEventListener("abort", onAbort);
      };
      signal == null ? void 0 : signal.addEventListener("abort", onAbort, { once: true });
    });
  }
  terminate() {
    this.close();
  }
  ping(_data) {
    if (!__privateGet(this, _pingUnsupportedWarned)) {
      __privateSet(this, _pingUnsupportedWarned, true);
      console.warn("[crossws] `peer.ping()` is not supported by this adapter.");
    }
  }
  subscribe(topic) {
    this._topics.add(topic);
  }
  unsubscribe(topic) {
    this._topics.delete(topic);
  }
  publish(topic, data, options) {
    var _a3;
    this._publish(topic, data, options);
    (_a3 = this._internal.sync) == null ? void 0 : _a3.publish({
      namespace: this.namespace,
      topic,
      data: serializeMessage(data)
    });
  }
  toString() {
    return this.id;
  }
  [Symbol.toPrimitive]() {
    return this.id;
  }
  [Symbol.toStringTag]() {
    return "WebSocket";
  }
  [kNodeInspect]() {
    return { peer: {
      id: this.id,
      ip: this.remoteAddress
    } };
  }
}, _ws = new WeakMap(), _pingUnsupportedWarned = new WeakMap(), _f);
function createWsProxy(ws, request) {
  return new Proxy(ws, { get: (target, prop) => {
    var _a3, _b2, _c3;
    const value = Reflect.get(target, prop);
    if (!value) switch (prop) {
      case "protocol":
        return ((_a3 = request == null ? void 0 : request.headers) == null ? void 0 : _a3.get("sec-websocket-protocol")) || "";
      case "extensions":
        return ((_b2 = request == null ? void 0 : request.headers) == null ? void 0 : _b2.get("sec-websocket-extensions")) || "";
      case "url":
        return ((_c3 = request == null ? void 0 : request.url) == null ? void 0 : _c3.replace(/^http/, "ws")) || void 0;
    }
    return value;
  } });
}
var WSError = class extends Error {
  constructor(...args) {
    super(...args);
    this.name = "WSError";
  }
};
const StubRequest = /* @__PURE__ */ (() => {
  class StubRequest2 {
    constructor(url, init = {}) {
      __publicField(this, "url");
      __publicField(this, "_abortController");
      __publicField(this, "_headers");
      __publicField(this, "_init");
      this.url = url;
      this._init = init;
    }
    get headers() {
      var _a3;
      if (!this._headers) this._headers = new Headers((_a3 = this._init) == null ? void 0 : _a3.headers);
      return this._headers;
    }
    clone() {
      return new StubRequest2(this.url, this._init);
    }
    get method() {
      return "GET";
    }
    get signal() {
      if (!this._abortController) this._abortController = new AbortController();
      return this._abortController.signal;
    }
    get cache() {
      return "default";
    }
    get credentials() {
      return "same-origin";
    }
    get destination() {
      return "";
    }
    get integrity() {
      return "";
    }
    get keepalive() {
      return false;
    }
    get redirect() {
      return "follow";
    }
    get mode() {
      return "cors";
    }
    get referrer() {
      return "about:client";
    }
    get referrerPolicy() {
      return "";
    }
    get body() {
      return null;
    }
    get bodyUsed() {
      return false;
    }
    arrayBuffer() {
      return Promise.resolve(/* @__PURE__ */ new ArrayBuffer(0));
    }
    blob() {
      return Promise.resolve(new Blob());
    }
    bytes() {
      return Promise.resolve(/* @__PURE__ */ new Uint8Array());
    }
    formData() {
      return Promise.resolve(new FormData());
    }
    json() {
      return Promise.resolve(JSON.parse(""));
    }
    text() {
      return Promise.resolve("");
    }
  }
  Object.setPrototypeOf(StubRequest2.prototype, globalThis.Request.prototype);
  return StubRequest2;
})();
const HEARTBEAT_PING = Buffer.from("crossws-ping");
const nodeAdapter = (options = {}) => {
  var _a3;
  if ("Deno" in globalThis || "Bun" in globalThis) throw new Error("[crossws] Using Node.js adapter in an incompatible environment.");
  const hooks = new AdapterHookable(options);
  const globalPeers = /* @__PURE__ */ new Map();
  const baseUtils = adapterUtils(globalPeers, options);
  const wss = options.wss || new import_websocket_server.default({
    noServer: true,
    handleProtocols: () => false,
    ...options.serverOptions
  });
  const liveSockets = /* @__PURE__ */ new Set();
  const idleTimeoutMs = (options.idleTimeout ?? 30) * 1e3;
  const sweepMs = Math.max(1, Math.floor(idleTimeoutMs));
  wss.on("connection", (ws, nodeReq) => {
    const request = new NodeReqProxy(nodeReq);
    const peers = getPeers(globalPeers, nodeReq._namespace);
    const peer = new NodePeer({
      ws,
      request,
      peers,
      nodeReq,
      namespace: nodeReq._namespace,
      sync: baseUtils.sync,
      hooks
    });
    peers.add(peer);
    liveSockets.add(ws);
    if (idleTimeoutMs > 0) {
      ws._isAlive = true;
      const markAlive = () => {
        ws._isAlive = true;
      };
      ws.on("pong", markAlive);
      ws.on("ping", markAlive);
      ws.on("message", markAlive);
    }
    hooks.callHook("open", peer);
    ws.on("message", (data, isBinary) => {
      if (Array.isArray(data)) data = Buffer.concat(data);
      if (!isBinary && Buffer.isBuffer(data)) data = data.toString("utf8");
      hooks.callHook("message", peer, new Message(data, peer));
    });
    ws.on("ping", (data) => {
      hooks.callHook("ping", peer, data);
    });
    ws.on("pong", (data) => {
      if (data.equals(HEARTBEAT_PING)) return;
      hooks.callHook("pong", peer, data);
    });
    ws.on("error", (error) => {
      peers.delete(peer);
      hooks.callHook("error", peer, new WSError(error));
    });
    const socket = ws._socket;
    const onDrain = () => hooks.callHook("drain", peer);
    socket == null ? void 0 : socket.on("drain", onDrain);
    ws.on("close", (code, reason) => {
      peers.delete(peer);
      liveSockets.delete(ws);
      socket == null ? void 0 : socket.off("drain", onDrain);
      hooks.callHook("close", peer, {
        code,
        reason: reason == null ? void 0 : reason.toString()
      });
    });
  });
  let idleTimer;
  const stopSweep = () => {
    if (idleTimer) {
      clearInterval(idleTimer);
      idleTimer = void 0;
    }
  };
  if (idleTimeoutMs > 0) {
    idleTimer = setInterval(() => {
      for (const ws of liveSockets) {
        if (ws._isAlive === false) {
          ws.terminate();
          continue;
        }
        ws._isAlive = false;
        try {
          ws.ping(HEARTBEAT_PING);
        } catch {
        }
      }
    }, sweepMs);
    (_a3 = idleTimer.unref) == null ? void 0 : _a3.call(idleTimer);
    wss.on("close", stopSweep);
  }
  wss.on("headers", (outgoingHeaders, req) => {
    const upgradeHeaders = req._upgradeHeaders;
    if (upgradeHeaders) for (const [key, value] of new Headers(upgradeHeaders)) outgoingHeaders.push(`${key}: ${value}`);
  });
  return {
    ...baseUtils,
    close: async (code, reason) => {
      stopSweep();
      await baseUtils.close(code, reason);
    },
    handleUpgrade: async (nodeReq, socket, head, webRequest) => {
      const request = webRequest || new NodeReqProxy(nodeReq);
      let upgraded;
      try {
        upgraded = await hooks.upgrade(request);
      } catch {
        return sendResponse(socket, new Response("Internal Server Error", { status: 500 }));
      }
      const { upgradeHeaders, endResponse, handled, context, namespace } = upgraded;
      if (endResponse) return sendResponse(socket, endResponse);
      if (handled) return;
      nodeReq._request = request;
      nodeReq._upgradeHeaders = upgradeHeaders;
      nodeReq._context = context;
      nodeReq._namespace = namespace;
      wss.handleUpgrade(nodeReq, socket, head, (ws) => {
        wss.emit("connection", ws, nodeReq);
      });
    },
    closeAll: (code, data, force) => {
      for (const ws of liveSockets) if (force) ws.terminate();
      else ws.close(code, data);
    }
  };
};
var NodePeer = class extends Peer {
  get remoteAddress() {
    var _a3;
    return (_a3 = this._internal.nodeReq.socket) == null ? void 0 : _a3.remoteAddress;
  }
  get context() {
    return this._internal.nodeReq._context;
  }
  send(data, options) {
    const dataBuff = toBufferLike(data);
    const isBinary = typeof dataBuff !== "string";
    this._internal.ws.send(dataBuff, {
      compress: options == null ? void 0 : options.compress,
      binary: isBinary,
      ...options
    });
    return this._internal.ws.bufferedAmount;
  }
  _publish(topic, data, options) {
    const dataBuff = toBufferLike(data);
    const isBinary = typeof dataBuff !== "string";
    const sendOptions = {
      compress: options == null ? void 0 : options.compress,
      binary: isBinary,
      ...options
    };
    for (const peer of this._internal.peers) if (peer !== this && peer._topics.has(topic)) peer._internal.ws.send(dataBuff, sendOptions);
  }
  close(code, data) {
    this._internal.ws.close(code, data);
  }
  terminate() {
    this._internal.ws.terminate();
  }
  ping(data) {
    try {
      this._internal.ws.ping(data);
    } catch (error) {
      this._internal.hooks.callHook("error", this, new WSError(error));
    }
  }
};
var NodeReqProxy = class extends StubRequest {
  constructor(req) {
    var _a3;
    const host = req.headers["host"] || "localhost";
    const url = `${((_a3 = req.socket) == null ? void 0 : _a3.encrypted) ?? req.headers["x-forwarded-proto"] === "https" ? "https" : "http"}://${host}${req.url}`;
    super(url, { headers: req.headers });
  }
};
async function sendResponse(socket, res) {
  const head = [`HTTP/1.1 ${res.status || 200} ${res.statusText || ""}`, ...[...res.headers.entries()].map(([key, value]) => `${key}: ${value}`)];
  socket.write(head.join("\r\n") + "\r\n\r\n");
  if (res.body) for await (const chunk of res.body) socket.write(chunk);
  return new Promise((resolve) => {
    socket.end(() => {
      socket.destroy();
      resolve();
    });
  });
}
const HOOK_NAMES = [
  "upgrade",
  "message",
  "open",
  "close",
  "drain",
  "error",
  "ping",
  "pong"
];
function defaultResolve(server, wsOpts) {
  if (wsOpts.resolve) return wsOpts.resolve;
  if (HOOK_NAMES.some((name) => typeof wsOpts[name] === "function")) return;
  const fetch = server.options.fetch;
  if (typeof fetch !== "function") throw new Error("[crossws] server has no fetch handler to resolve WebSocket hooks from");
  return (req) => Promise.resolve(fetch(req)).then((res) => hooksFromFetchResult(res));
}
function hooksFromFetchResult(res) {
  var _a3, _b2;
  const crossws = res == null ? void 0 : res.crossws;
  if (res instanceof Response) {
    if (crossws) {
      (_a3 = res.body) == null ? void 0 : _a3.cancel().catch(() => {
      });
      return crossws;
    }
    if (!res.ok && res.status !== 101) return { upgrade: () => res };
    (_b2 = res.body) == null ? void 0 : _b2.cancel().catch(() => {
    });
    return;
  }
  const headers = res == null ? void 0 : res.headers;
  if (!headers) return crossws;
  const userUpgrade = crossws == null ? void 0 : crossws.upgrade;
  return {
    ...crossws,
    async upgrade(request) {
      const result = await (userUpgrade == null ? void 0 : userUpgrade(request));
      if (result instanceof Response) return result;
      return {
        ...result,
        headers: mergeHeaders$1(headers, result == null ? void 0 : result.headers)
      };
    }
  };
}
function mergeHeaders$1(base, extra) {
  if (!extra) return base;
  const merged = new Headers(base);
  for (const [key, value] of new Headers(extra)) merged.set(key, value);
  return merged;
}
function lazyInherit(target, source, sourceKey) {
  for (const key of [...Object.getOwnPropertyNames(source), ...Object.getOwnPropertySymbols(source)]) {
    if (key === "constructor") continue;
    const targetDesc = Object.getOwnPropertyDescriptor(target, key);
    const desc = Object.getOwnPropertyDescriptor(source, key);
    let modified = false;
    if (desc.get) {
      modified = true;
      desc.get = (targetDesc == null ? void 0 : targetDesc.get) || function() {
        return this[sourceKey][key];
      };
    }
    if (desc.set) {
      modified = true;
      desc.set = (targetDesc == null ? void 0 : targetDesc.set) || function(value) {
        this[sourceKey][key] = value;
      };
    }
    if (!(targetDesc == null ? void 0 : targetDesc.value) && typeof desc.value === "function") {
      modified = true;
      desc.value = function(...args) {
        return this[sourceKey][key](...args);
      };
    }
    if (modified) Object.defineProperty(target, key, desc);
  }
}
const _needsNormRE = /(?:(?:^|\/)(?:\.|\.\.|%2e|%2e\.|\.%2e|%2e%2e)(?:\/|$))|[\\^#"<>{}`\x80-\uffff]/i;
const _searchNeedsNormRE = /[#"'<>]/;
const FastURL = /* @__PURE__ */ (() => {
  var _url, _href, _protocol, _host, _pathname, _search, _searchParams, _pos, _URL_instances, getPos_fn, _a3;
  const NativeURL = globalThis.URL;
  const FastURL2 = (_a3 = class {
    constructor(url) {
      __privateAdd(this, _URL_instances);
      __privateAdd(this, _url);
      __privateAdd(this, _href);
      __privateAdd(this, _protocol);
      __privateAdd(this, _host);
      __privateAdd(this, _pathname);
      __privateAdd(this, _search);
      __privateAdd(this, _searchParams);
      __privateAdd(this, _pos);
      if (typeof url === "string") {
        const isOriginForm = url[0] === "/";
        if (isOriginForm && !_searchNeedsNormRE.test(url)) __privateSet(this, _href, url);
        else __privateSet(this, _url, new NativeURL(isOriginForm ? `http://localhost${url}` : url));
      } else if (_needsNormRE.test(url.pathname) || url.search && _searchNeedsNormRE.test(url.search)) __privateSet(this, _url, new NativeURL(`${url.protocol || "http:"}//${url.host || "localhost"}${url.pathname}${url.search || ""}`));
      else {
        __privateSet(this, _protocol, url.protocol);
        __privateSet(this, _host, url.host);
        __privateSet(this, _pathname, url.pathname);
        __privateSet(this, _search, url.search);
      }
    }
    static [Symbol.hasInstance](val) {
      return val instanceof NativeURL;
    }
    get _url() {
      if (__privateGet(this, _url)) return __privateGet(this, _url);
      __privateSet(this, _url, new NativeURL(this.href));
      __privateSet(this, _href, void 0);
      __privateSet(this, _protocol, void 0);
      __privateSet(this, _host, void 0);
      __privateSet(this, _pathname, void 0);
      __privateSet(this, _search, void 0);
      __privateSet(this, _searchParams, void 0);
      __privateSet(this, _pos, void 0);
      return __privateGet(this, _url);
    }
    get href() {
      if (__privateGet(this, _url)) return __privateGet(this, _url).href;
      if (!__privateGet(this, _href)) __privateSet(this, _href, `${__privateGet(this, _protocol) || "http:"}//${__privateGet(this, _host) || "localhost"}${__privateGet(this, _pathname) || "/"}${__privateGet(this, _search) || ""}`);
      return __privateGet(this, _href);
    }
    get pathname() {
      if (__privateGet(this, _url)) return __privateGet(this, _url).pathname;
      if (__privateGet(this, _pathname) === void 0) {
        const [, pathnameIndex, queryIndex] = __privateMethod(this, _URL_instances, getPos_fn).call(this);
        if (pathnameIndex === -1) return this._url.pathname;
        __privateSet(this, _pathname, this.href.slice(pathnameIndex, queryIndex === -1 ? void 0 : queryIndex));
      }
      return __privateGet(this, _pathname);
    }
    get search() {
      if (__privateGet(this, _url)) return __privateGet(this, _url).search;
      if (__privateGet(this, _search) === void 0) {
        const [, pathnameIndex, queryIndex] = __privateMethod(this, _URL_instances, getPos_fn).call(this);
        if (pathnameIndex === -1) return this._url.search;
        const url = this.href;
        __privateSet(this, _search, queryIndex === -1 || queryIndex === url.length - 1 ? "" : url.slice(queryIndex));
      }
      return __privateGet(this, _search);
    }
    get searchParams() {
      if (__privateGet(this, _url)) return __privateGet(this, _url).searchParams;
      if (!__privateGet(this, _searchParams)) __privateSet(this, _searchParams, new URLSearchParams(this.search));
      return __privateGet(this, _searchParams);
    }
    get protocol() {
      if (__privateGet(this, _url)) return __privateGet(this, _url).protocol;
      if (__privateGet(this, _protocol) === void 0) {
        const [protocolIndex] = __privateMethod(this, _URL_instances, getPos_fn).call(this);
        if (protocolIndex === -1) return this._url.protocol;
        const url = this.href;
        __privateSet(this, _protocol, url.slice(0, protocolIndex + 1));
      }
      return __privateGet(this, _protocol);
    }
    toString() {
      return this.href;
    }
    toJSON() {
      return this.href;
    }
  }, _url = new WeakMap(), _href = new WeakMap(), _protocol = new WeakMap(), _host = new WeakMap(), _pathname = new WeakMap(), _search = new WeakMap(), _searchParams = new WeakMap(), _pos = new WeakMap(), _URL_instances = new WeakSet(), getPos_fn = function() {
    if (!__privateGet(this, _pos)) {
      const url = this.href;
      const protoIndex = url.indexOf("://");
      const pathnameIndex = protoIndex === -1 ? -1 : url.indexOf("/", protoIndex + 4);
      const qIndex = pathnameIndex === -1 ? -1 : url.indexOf("?", pathnameIndex);
      __privateSet(this, _pos, [
        protoIndex,
        pathnameIndex,
        qIndex
      ]);
    }
    return __privateGet(this, _pos);
  }, _a3);
  lazyInherit(FastURL2.prototype, NativeURL.prototype, "_url");
  Object.setPrototypeOf(FastURL2.prototype, NativeURL.prototype);
  Object.setPrototypeOf(FastURL2, NativeURL);
  return FastURL2;
})();
function resolvePortAndHost(opts) {
  var _a3, _b2;
  const _port = opts.port ?? ((_a3 = globalThis.process) == null ? void 0 : _a3.env.PORT) ?? 3e3;
  const port = typeof _port === "number" ? _port : Number.parseInt(_port, 10);
  if (port < 0 || port > 65535) throw new RangeError(`Port must be between 0 and 65535 (got "${port}").`);
  return {
    port,
    hostname: opts.hostname ?? ((_b2 = globalThis.process) == null ? void 0 : _b2.env.HOST)
  };
}
function fmtURL(host, port, secure) {
  if (!host || !port) return;
  if (host.includes(":")) host = `[${host}]`;
  return `http${secure ? "s" : ""}://${host}:${port}/`;
}
function printListening(opts, url) {
  var _a3, _b2, _c3;
  if (!url || (opts.silent ?? ((_b2 = (_a3 = globalThis.process) == null ? void 0 : _a3.env) == null ? void 0 : _b2.TEST))) return;
  let additionalInfo = "";
  try {
    const _url = new URL(url);
    if (_url.hostname === "[::]" || _url.hostname === "0.0.0.0") {
      _url.hostname = "localhost";
      url = _url.href;
      additionalInfo = " (all interfaces)";
    }
  } catch {
  }
  let listeningOn = `➜ Listening on:`;
  if ((_c3 = globalThis.process.stdout) == null ? void 0 : _c3.isTTY) {
    listeningOn = `\x1B[32m${listeningOn}\x1B[0m`;
    url = `\x1B[36m${url}\x1B[0m`;
    additionalInfo = `\x1B[2m${additionalInfo}\x1B[0m`;
  }
  console.log(`${listeningOn} ${url}${additionalInfo}`);
}
function resolveTLSOptions(opts) {
  if (!opts.tls || opts.protocol === "http") return;
  const cert = resolveCertOrKey(opts.tls.cert);
  const key = resolveCertOrKey(opts.tls.key);
  if (!cert && !key) {
    if (opts.protocol === "https") throw new TypeError("TLS `cert` and `key` must be provided for `https` protocol.");
    return;
  }
  if (!cert || !key) throw new TypeError("TLS `cert` and `key` must be provided together.");
  return {
    cert,
    key,
    passphrase: opts.tls.passphrase
  };
}
function resolveCertOrKey(value) {
  if (!value) return;
  if (typeof value !== "string") throw new TypeError("TLS certificate and key must be strings in PEM format or file paths.");
  if (value.startsWith("-----BEGIN ")) return value;
  const { readFileSync } = process.getBuiltinModule("node:fs");
  return readFileSync(value, "utf8");
}
function createWaitUntil() {
  const promises = /* @__PURE__ */ new Set();
  return {
    waitUntil: (promise) => {
      if (typeof (promise == null ? void 0 : promise.then) !== "function") return;
      promises.add(Promise.resolve(promise).catch(console.error).finally(() => {
        promises.delete(promise);
      }));
    },
    wait: () => {
      return Promise.all(promises);
    }
  };
}
const noColor = /* @__PURE__ */ (() => {
  var _a3;
  const env2 = ((_a3 = globalThis.process) == null ? void 0 : _a3.env) ?? {};
  return env2.NO_COLOR === "1" || env2.TERM === "dumb";
})();
const _c = (c, r = 39) => (t2) => noColor ? t2 : `\x1B[${c}m${t2}\x1B[${r}m`;
const bold = /* @__PURE__ */ _c(1, 22);
const red = /* @__PURE__ */ _c(31);
const green = /* @__PURE__ */ _c(32);
const gray = /* @__PURE__ */ _c(90);
function wrapFetch(server) {
  const fetchHandler = server.options.fetch;
  const middleware = server.options.middleware || [];
  return middleware.length === 0 ? fetchHandler : (request) => callMiddleware(request, fetchHandler, middleware, 0);
}
function callMiddleware(request, fetchHandler, middleware, index) {
  if (index === middleware.length) return fetchHandler(request);
  return middleware[index](request, () => callMiddleware(request, fetchHandler, middleware, index + 1));
}
const errorPlugin = (server) => {
  const errorHandler = server.options.error;
  if (!errorHandler) return;
  server.options.middleware.unshift((_req, next) => {
    try {
      const res = next();
      return res instanceof Promise ? res.catch((error) => errorHandler(error)) : res;
    } catch (error) {
      return errorHandler(error);
    }
  });
};
const gracefulShutdownPlugin = (server) => {
  var _a3, _b2;
  const config = (_a3 = server.options) == null ? void 0 : _a3.gracefulShutdown;
  if (!((_b2 = globalThis.process) == null ? void 0 : _b2.on) || config === false || config === void 0 && (process.env.CI || process.env.TEST)) return;
  const gracefulTimeout = config === true || !(config == null ? void 0 : config.gracefulTimeout) ? Number.parseInt(process.env.SERVER_SHUTDOWN_TIMEOUT || "") || 5 : config.gracefulTimeout;
  let isClosing = false;
  let isClosed = false;
  const w = server.options.silent ? () => {
  } : process.stderr.write.bind(process.stderr);
  const forceClose = async () => {
    if (isClosed) return;
    w(red("\x1B[2K\rForcibly closing connections...\n"));
    isClosed = true;
    await server.close(true);
  };
  const shutdown = async () => {
    if (isClosing || isClosed) return;
    setTimeout(() => {
      globalThis.process.once("SIGINT", forceClose);
    }, 100);
    isClosing = true;
    const closePromise = server.close();
    for (let remaining = gracefulTimeout; remaining > 0; remaining--) {
      w(gray(`\rStopping server gracefully (${remaining}s)... Press ${bold("Ctrl+C")} again to force close.`));
      if (await Promise.race([closePromise.then(() => true), new Promise((r) => setTimeout(() => r(false), 1e3))])) {
        w("\x1B[2K\r" + green("Server closed successfully.\n"));
        isClosed = true;
        return;
      }
    }
    w("\x1B[2K\rGraceful shutdown timed out.\n");
    await forceClose();
  };
  for (const sig of ["SIGINT", "SIGTERM"]) globalThis.process.on(sig, shutdown);
};
function isTrustedProxy(trustProxy, remoteAddress) {
  if (trustProxy === void 0 || trustProxy === false) return false;
  if (trustProxy === true) return true;
  if (trustProxy === "loopback") return isLoopbackAddress(remoteAddress);
  if (remoteAddress === void 0) return false;
  if (trustProxy.includes(remoteAddress)) return true;
  const mapped = ipv4FromMapped(remoteAddress);
  return mapped !== void 0 && trustProxy.includes(mapped);
}
function ipv4FromMapped(address) {
  return address.startsWith("::ffff:") && address.includes(".") ? address.slice(7) : void 0;
}
function isLoopbackAddress(address) {
  return !!address && (address === "::1" || address.startsWith("127.") || address.startsWith("::ffff:127."));
}
const HOST_RE = /^(\[(?:[A-Fa-f0-9:.]+)\]|(?:[A-Za-z0-9_-]+\.)*[A-Za-z0-9_-]+|(?:\d{1,3}\.){3}\d{1,3})(:\d{1,5})?$/;
function firstForwardedValue(value) {
  if (!value) return;
  return (Array.isArray(value) ? value[0] : value).split(",")[0].trim() || void 0;
}
function createBodyTooLargeError(maxRequestBodySize) {
  return Object.assign(/* @__PURE__ */ new Error(`Request body exceeds the maximum allowed size of ${maxRequestBodySize} bytes.`), {
    code: "ERR_BODY_TOO_LARGE",
    statusCode: 413,
    status: 413
  });
}
function limitBodyStream(stream, maxRequestBodySize) {
  const reader = stream.getReader();
  let size = 0;
  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      size += value.byteLength;
      if (size > maxRequestBodySize) {
        const error = createBodyTooLargeError(maxRequestBodySize);
        reader.cancel(error).catch(() => {
        });
        controller.error(error);
        return;
      }
      controller.enqueue(value);
    },
    cancel(reason) {
      return reader.cancel(reason);
    }
  });
}
function sendNodeResponseDetached(nodeRes, webRes) {
  try {
    return _sendNodeResponse(nodeRes, webRes, true);
  } catch (error) {
    handleSendError(nodeRes);
  }
}
function handleSendError(nodeRes, _error) {
  if (nodeRes.headersSent) nodeRes.destroy();
  else {
    nodeRes.statusCode = 500;
    nodeRes.end();
  }
}
function _sendNodeResponse(nodeRes, webRes, detached) {
  var _a3;
  if (!webRes) {
    nodeRes.statusCode = 500;
    return endNodeResponse(nodeRes, detached);
  }
  if (webRes._toNodeResponse) {
    const res = webRes._toNodeResponse();
    if (res.body) {
      if (res.body instanceof ReadableStream) {
        writeHead(nodeRes, res.status, res.statusText, res.headers);
        return streamBody(res.body, nodeRes);
      } else if (typeof ((_a3 = res.body) == null ? void 0 : _a3.pipe) === "function") return pipeBody(res.body, nodeRes, res.status, res.statusText, res.headers);
      writeHead(nodeRes, res.status, res.statusText, res.headers);
      nodeRes.write(res.body);
    } else writeHead(nodeRes, res.status, res.statusText, res.headers);
    return endNodeResponse(nodeRes, detached);
  }
  const rawHeaders = [];
  for (const [key, value] of webRes.headers) rawHeaders.push(key, value);
  writeHead(nodeRes, webRes.status, webRes.statusText, rawHeaders);
  return webRes.body ? streamBody(webRes.body, nodeRes) : endNodeResponse(nodeRes, detached);
}
function writeHead(nodeRes, status2, statusText, rawHeaders) {
  var _a3;
  if (!nodeRes.headersSent) if (((_a3 = nodeRes.req) == null ? void 0 : _a3.httpVersion) === "2.0") nodeRes.writeHead(status2, rawHeaders);
  else nodeRes.writeHead(status2, statusText, rawHeaders);
}
function endNodeResponse(nodeRes, detached) {
  if (detached) {
    nodeRes.end();
    return;
  }
  return new Promise((resolve) => nodeRes.end(resolve));
}
function pipeBody(stream, nodeRes, status2, statusText, headers) {
  var _a3;
  if (nodeRes.destroyed) {
    (_a3 = stream.destroy) == null ? void 0 : _a3.call(stream);
    return;
  }
  if (typeof stream.on !== "function" || typeof stream.destroy !== "function") {
    writeHead(nodeRes, status2, statusText, headers);
    stream.pipe(nodeRes);
    return new Promise((resolve) => nodeRes.on("close", resolve));
  }
  if (stream.destroyed) {
    writeHead(nodeRes, 500, "Internal Server Error", []);
    return endNodeResponse(nodeRes);
  }
  return new Promise((resolve) => {
    function onEarlyError() {
      stream.off("readable", onReadable);
      stream.destroy();
      writeHead(nodeRes, 500, "Internal Server Error", []);
      endNodeResponse(nodeRes).then(resolve);
    }
    function onReadable() {
      stream.off("error", onEarlyError);
      if (nodeRes.destroyed) {
        stream.destroy();
        return resolve();
      }
      writeHead(nodeRes, status2, statusText, headers);
      pipeline(stream, nodeRes).catch(() => {
      }).then(() => resolve());
    }
    stream.once("error", onEarlyError);
    stream.once("readable", onReadable);
  });
}
function streamBody(stream, nodeRes) {
  if (nodeRes.destroyed) {
    stream.cancel();
    return;
  }
  const reader = stream.getReader();
  function streamCancel(error) {
    reader.cancel(error).catch(() => {
    });
    if (error) nodeRes.destroy(error);
  }
  function streamHandle({ done, value }) {
    try {
      if (done) nodeRes.end();
      else if (nodeRes.write(value)) reader.read().then(streamHandle, streamCancel);
      else nodeRes.once("drain", () => reader.read().then(streamHandle, streamCancel));
    } catch (error) {
      streamCancel(error instanceof Error ? error : void 0);
    }
  }
  nodeRes.on("close", streamCancel);
  nodeRes.on("error", streamCancel);
  reader.read().then(streamHandle, streamCancel);
  return reader.closed.catch(streamCancel).finally(() => {
    nodeRes.off("close", streamCancel);
    nodeRes.off("error", streamCancel);
  });
}
var NodeRequestURL = class extends FastURL {
  constructor({ req, trusted = false }) {
    var _a3, _b2;
    const path2 = req.url || "/";
    const forwardedHost = trusted ? firstForwardedValue(req.headers["x-forwarded-host"]) : void 0;
    let host = (forwardedHost && HOST_RE.test(forwardedHost) ? forwardedHost : void 0) || req.headers.host || req.headers[":authority"];
    if (host && !HOST_RE.test(host)) host = "_invalid_";
    else if (!host) if (req.socket) host = `${req.socket.localFamily === "IPv6" ? "[" + req.socket.localAddress + "]" : req.socket.localAddress}:${((_a3 = req.socket) == null ? void 0 : _a3.localPort) || "80"}`;
    else host = "localhost";
    const forwardedProto = trusted ? firstForwardedValue(req.headers["x-forwarded-proto"]) : void 0;
    const protocol = ((_b2 = req.socket) == null ? void 0 : _b2.encrypted) || forwardedProto === "https" || trusted && req.headers[":scheme"] === "https" ? "https:" : "http:";
    if (path2[0] === "/") {
      const qIndex = path2.indexOf("?");
      super({
        protocol,
        host,
        pathname: qIndex === -1 ? path2 : path2.slice(0, qIndex) || "/",
        search: qIndex === -1 ? "" : path2.slice(qIndex) || ""
      });
    } else if (path2 === "*") super({
      protocol,
      host,
      pathname: "/*",
      search: ""
    });
    else super(path2);
  }
};
const _nonJoinedHeaders = /* @__PURE__ */ new Set([
  "age",
  "authorization",
  "content-length",
  "content-type",
  "etag",
  "expires",
  "from",
  "host",
  "if-modified-since",
  "if-unmodified-since",
  "last-modified",
  "location",
  "max-forwards",
  "proxy-authorization",
  "referer",
  "retry-after",
  "server",
  "user-agent"
]);
const _validHeaderNameRE = /^[!#$%&'*+\-.^_`|~\dA-Za-z]+$/;
function _isRepeated(rawHeaders, lowerName) {
  let seen = false;
  for (let i = 0; i < rawHeaders.length; i += 2) {
    const key = rawHeaders[i];
    if (key.length === lowerName.length && key.toLowerCase() === lowerName) {
      if (seen) return true;
      seen = true;
    }
  }
  return false;
}
const NodeRequestHeaders = /* @__PURE__ */ (() => {
  var _req, _headers;
  const NativeHeaders = globalThis.Headers;
  class Headers2 {
    constructor(req) {
      __privateAdd(this, _req);
      __privateAdd(this, _headers);
      __privateSet(this, _req, req);
    }
    static [Symbol.hasInstance](val) {
      return val instanceof NativeHeaders;
    }
    get _headers() {
      if (!__privateGet(this, _headers)) {
        const headers = new NativeHeaders();
        const rawHeaders = __privateGet(this, _req).rawHeaders;
        const len = rawHeaders.length;
        for (let i = 0; i < len; i += 2) {
          const key = rawHeaders[i];
          if (key.charCodeAt(0) === 58) continue;
          const value = rawHeaders[i + 1];
          headers.append(key, value);
        }
        __privateSet(this, _headers, headers);
      }
      return __privateGet(this, _headers);
    }
    get(name) {
      if (__privateGet(this, _headers)) return __privateGet(this, _headers).get(name);
      const lower = name.toLowerCase();
      if (lower.charCodeAt(0) === 58) return this._headers.get(name);
      const value = __privateGet(this, _req).headers[lower];
      if (typeof value === "string") return _nonJoinedHeaders.has(lower) && _isRepeated(__privateGet(this, _req).rawHeaders, lower) ? this._headers.get(name) : value;
      if (Array.isArray(value)) return value.join(", ");
      return lower !== "__proto__" && _validHeaderNameRE.test(name) ? null : this._headers.get(name);
    }
    has(name) {
      if (__privateGet(this, _headers)) return __privateGet(this, _headers).has(name);
      const lower = name.toLowerCase();
      if (lower.charCodeAt(0) === 58) return this._headers.has(name);
      if (Object.hasOwn(__privateGet(this, _req).headers, lower)) return true;
      return lower !== "__proto__" && _validHeaderNameRE.test(name) ? false : this._headers.has(name);
    }
    getSetCookie() {
      if (__privateGet(this, _headers)) return __privateGet(this, _headers).getSetCookie();
      const value = __privateGet(this, _req).headers["set-cookie"];
      return Array.isArray(value) ? value.slice() : value ? [value] : [];
    }
    entries() {
      return this._headers.entries();
    }
    [Symbol.iterator]() {
      return this.entries();
    }
  }
  _req = new WeakMap();
  _headers = new WeakMap();
  lazyInherit(Headers2.prototype, NativeHeaders.prototype, "_headers");
  Object.setPrototypeOf(Headers2, NativeHeaders);
  Object.setPrototypeOf(Headers2.prototype, NativeHeaders.prototype);
  return Headers2;
})();
const kNativeRequest = /* @__PURE__ */ Symbol.for("srvx.nativeRequest");
const NodeRequest = /* @__PURE__ */ (() => {
  var _req, _url, _bodyStream, _request, _headers, _abortController, _maxRequestBodySize, _trustProxy, _ip, _ipResolved, _remoteAddress, _trusted, _Request_instances, resolveTrusted_fn, readBuffered_fn;
  const NativeRequest = getNativeRequest();
  class Request2 {
    constructor(ctx) {
      __privateAdd(this, _Request_instances);
      __publicField(this, "runtime");
      __publicField(this, "waitUntil");
      __privateAdd(this, _req);
      __privateAdd(this, _url);
      __privateAdd(this, _bodyStream);
      __privateAdd(this, _request);
      __privateAdd(this, _headers);
      __privateAdd(this, _abortController);
      __privateAdd(this, _maxRequestBodySize);
      __privateAdd(this, _trustProxy);
      __privateAdd(this, _ip);
      __privateAdd(this, _ipResolved, false);
      __privateAdd(this, _remoteAddress);
      __privateAdd(this, _trusted);
      __privateSet(this, _req, ctx.req);
      __privateSet(this, _maxRequestBodySize, ctx.maxRequestBodySize);
      __privateSet(this, _trustProxy, ctx.trustProxy);
      this.runtime = {
        name: "node",
        node: ctx
      };
    }
    static [Symbol.hasInstance](val) {
      return val instanceof NativeRequest;
    }
    get ip() {
      if (__privateGet(this, _ipResolved)) return __privateGet(this, _ip);
      __privateSet(this, _ipResolved, true);
      if (__privateMethod(this, _Request_instances, resolveTrusted_fn).call(this)) {
        const forwarded = firstForwardedValue(__privateGet(this, _req).headers["x-forwarded-for"]);
        if (forwarded) return __privateSet(this, _ip, forwarded);
      }
      return __privateSet(this, _ip, __privateGet(this, _remoteAddress));
    }
    get method() {
      if (__privateGet(this, _request)) return __privateGet(this, _request).method;
      return __privateGet(this, _req).method || "GET";
    }
    get _url() {
      return __privateGet(this, _url) || __privateSet(this, _url, new NodeRequestURL({
        req: __privateGet(this, _req),
        trusted: __privateMethod(this, _Request_instances, resolveTrusted_fn).call(this)
      }));
    }
    set _url(url) {
      __privateSet(this, _url, url);
    }
    get url() {
      if (__privateGet(this, _request)) return __privateGet(this, _request).url;
      return this._url.href;
    }
    get headers() {
      if (__privateGet(this, _request)) return __privateGet(this, _request).headers;
      return __privateGet(this, _headers) || __privateSet(this, _headers, new NodeRequestHeaders(__privateGet(this, _req)));
    }
    get _abortController() {
      if (!__privateGet(this, _abortController)) {
        __privateSet(this, _abortController, new AbortController());
        const { req, res } = this.runtime.node;
        const abortController = __privateGet(this, _abortController);
        const abort = (err) => {
          var _a3;
          return (_a3 = abortController.abort) == null ? void 0 : _a3.call(abortController, err);
        };
        if (res) res.once("close", () => {
          const reqError = req.errored;
          if (reqError) abort(reqError);
          else if (!res.writableEnded) abort();
        });
        else req.once("close", () => {
          if (!req.complete) abort();
        });
      }
      return __privateGet(this, _abortController);
    }
    get signal() {
      return __privateGet(this, _request) ? __privateGet(this, _request).signal : this._abortController.signal;
    }
    get body() {
      if (__privateGet(this, _request)) return __privateGet(this, _request).body;
      if (__privateGet(this, _bodyStream) === void 0) {
        const method = this.method;
        let stream = !(method === "GET" || method === "HEAD") ? Readable.toWeb(__privateGet(this, _req)) : null;
        if (stream && __privateGet(this, _maxRequestBodySize) !== void 0) stream = limitBodyStream(stream, __privateGet(this, _maxRequestBodySize));
        __privateSet(this, _bodyStream, stream);
      }
      return __privateGet(this, _bodyStream);
    }
    text() {
      if (__privateGet(this, _request)) return __privateGet(this, _request).text();
      if (__privateGet(this, _bodyStream) !== void 0) return __privateGet(this, _bodyStream) ? new Response(__privateGet(this, _bodyStream)).text() : Promise.resolve("");
      return __privateMethod(this, _Request_instances, readBuffered_fn).call(this).then((buf) => buf.toString());
    }
    json() {
      if (__privateGet(this, _request)) return __privateGet(this, _request).json();
      if (__privateGet(this, _bodyStream) !== void 0) return this.text().then((text) => JSON.parse(text));
      return __privateMethod(this, _Request_instances, readBuffered_fn).call(this).then((buf) => JSON.parse(buf.toString()));
    }
    get _request() {
      if (!__privateGet(this, _request)) {
        const body = this.body;
        __privateSet(this, _request, new NativeRequest(this.url, {
          method: this.method,
          headers: this.headers,
          signal: this._abortController.signal,
          body,
          duplex: body ? "half" : void 0
        }));
        __privateSet(this, _headers, void 0);
        __privateSet(this, _bodyStream, void 0);
      }
      return __privateGet(this, _request);
    }
  }
  _req = new WeakMap();
  _url = new WeakMap();
  _bodyStream = new WeakMap();
  _request = new WeakMap();
  _headers = new WeakMap();
  _abortController = new WeakMap();
  _maxRequestBodySize = new WeakMap();
  _trustProxy = new WeakMap();
  _ip = new WeakMap();
  _ipResolved = new WeakMap();
  _remoteAddress = new WeakMap();
  _trusted = new WeakMap();
  _Request_instances = new WeakSet();
  resolveTrusted_fn = function() {
    var _a3;
    if (__privateGet(this, _trusted) === void 0) {
      __privateSet(this, _remoteAddress, (_a3 = __privateGet(this, _req).socket) == null ? void 0 : _a3.remoteAddress);
      __privateSet(this, _trusted, isTrustedProxy(__privateGet(this, _trustProxy), __privateGet(this, _remoteAddress)));
    }
    return __privateGet(this, _trusted);
  };
  readBuffered_fn = function() {
    return readBody(__privateGet(this, _req), __privateGet(this, _maxRequestBodySize));
  };
  lazyInherit(Request2.prototype, NativeRequest.prototype, "_request");
  Object.setPrototypeOf(Request2.prototype, NativeRequest.prototype);
  return Request2;
})();
function readBody(req, maxRequestBodySize) {
  if ("rawBody" in req && Buffer.isBuffer(req.rawBody)) {
    if (maxRequestBodySize !== void 0 && req.rawBody.length > maxRequestBodySize) return Promise.reject(createBodyTooLargeError(maxRequestBodySize));
    return Promise.resolve(req.rawBody);
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    const cleanup = () => {
      req.off("data", onData);
      req.off("end", onEnd);
      req.off("error", onError);
    };
    const onData = (chunk) => {
      var _a3;
      if (maxRequestBodySize !== void 0) {
        size += chunk.length;
        if (size > maxRequestBodySize) {
          cleanup();
          (_a3 = req.pause) == null ? void 0 : _a3.call(req);
          reject(createBodyTooLargeError(maxRequestBodySize));
          return;
        }
      }
      chunks.push(chunk);
    };
    const onError = (err) => {
      cleanup();
      reject(err);
    };
    const onEnd = () => {
      cleanup();
      resolve(chunks.length === 1 ? chunks[0] : Buffer.concat(chunks));
    };
    req.on("data", onData).once("end", onEnd).once("error", onError);
  });
}
function getNativeRequest() {
  let R = globalThis[kNativeRequest] || globalThis.Request;
  while (R == null ? void 0 : R._srvx) R = Object.getPrototypeOf(R);
  return globalThis[kNativeRequest] ?? (globalThis[kNativeRequest] = R);
}
const NodeResponse = /* @__PURE__ */ (() => {
  var _a3, _b2, _c3, _body, _init, _headers, _response;
  const NativeResponse = globalThis.Response;
  const STATUS_CODES = ((_c3 = (_b2 = (_a3 = globalThis.process) == null ? void 0 : _a3.getBuiltinModule) == null ? void 0 : _b2.call(_a3, "node:http")) == null ? void 0 : _c3.STATUS_CODES) || {};
  class NodeResponse2 {
    constructor(body, init) {
      __privateAdd(this, _body);
      __privateAdd(this, _init);
      __privateAdd(this, _headers);
      __privateAdd(this, _response);
      __privateSet(this, _body, body);
      __privateSet(this, _init, init);
    }
    static [Symbol.hasInstance](val) {
      return val instanceof NativeResponse;
    }
    get status() {
      var _a4, _b3;
      return ((_a4 = __privateGet(this, _response)) == null ? void 0 : _a4.status) || ((_b3 = __privateGet(this, _init)) == null ? void 0 : _b3.status) || 200;
    }
    get statusText() {
      var _a4, _b3;
      return ((_a4 = __privateGet(this, _response)) == null ? void 0 : _a4.statusText) || ((_b3 = __privateGet(this, _init)) == null ? void 0 : _b3.statusText) || STATUS_CODES[this.status] || "";
    }
    get headers() {
      var _a4;
      if (__privateGet(this, _response)) return __privateGet(this, _response).headers;
      if (__privateGet(this, _headers)) return __privateGet(this, _headers);
      const initHeaders = (_a4 = __privateGet(this, _init)) == null ? void 0 : _a4.headers;
      return __privateSet(this, _headers, initHeaders instanceof Headers ? initHeaders : new Headers(initHeaders));
    }
    get ok() {
      if (__privateGet(this, _response)) return __privateGet(this, _response).ok;
      const status2 = this.status;
      return status2 >= 200 && status2 < 300;
    }
    get _response() {
      if (__privateGet(this, _response)) return __privateGet(this, _response);
      let body = __privateGet(this, _body);
      if (body && typeof body.pipe === "function" && !(body instanceof Readable)) {
        const stream = new PassThrough();
        body.pipe(stream);
        const abort = body.abort;
        if (abort) stream.once("close", () => abort());
        body = stream;
      }
      __privateSet(this, _response, new NativeResponse(body, __privateGet(this, _headers) ? {
        ...__privateGet(this, _init),
        headers: __privateGet(this, _headers)
      } : __privateGet(this, _init)));
      __privateSet(this, _init, void 0);
      __privateSet(this, _headers, void 0);
      __privateSet(this, _body, void 0);
      return __privateGet(this, _response);
    }
    _toNodeResponse() {
      var _a4, _b3;
      const status2 = this.status;
      const statusText = this.statusText;
      let body;
      let contentType;
      let contentLength;
      if (__privateGet(this, _response)) body = __privateGet(this, _response).body;
      else if (__privateGet(this, _body)) if (__privateGet(this, _body) instanceof ReadableStream) body = __privateGet(this, _body);
      else if (typeof __privateGet(this, _body) === "string") {
        body = __privateGet(this, _body);
        contentType = "text/plain; charset=UTF-8";
        contentLength = Buffer.byteLength(__privateGet(this, _body));
      } else if (__privateGet(this, _body) instanceof ArrayBuffer) {
        body = Buffer.from(__privateGet(this, _body));
        contentLength = __privateGet(this, _body).byteLength;
      } else if (__privateGet(this, _body) instanceof Uint8Array) {
        body = __privateGet(this, _body);
        contentLength = __privateGet(this, _body).byteLength;
      } else if (__privateGet(this, _body) instanceof DataView) {
        body = Buffer.from(__privateGet(this, _body).buffer);
        contentLength = __privateGet(this, _body).byteLength;
      } else if (__privateGet(this, _body) instanceof Blob) {
        body = __privateGet(this, _body).stream();
        contentType = __privateGet(this, _body).type;
        contentLength = __privateGet(this, _body).size;
      } else if (typeof __privateGet(this, _body).pipe === "function") body = __privateGet(this, _body);
      else body = this._response.body;
      const headers = [];
      const initHeaders = (_a4 = __privateGet(this, _init)) == null ? void 0 : _a4.headers;
      const headerEntries = ((_b3 = __privateGet(this, _response)) == null ? void 0 : _b3.headers) || __privateGet(this, _headers) || (initHeaders ? Array.isArray(initHeaders) ? initHeaders : (initHeaders == null ? void 0 : initHeaders.entries) ? initHeaders.entries() : Object.entries(initHeaders) : void 0);
      let hasContentTypeHeader;
      let hasContentLength;
      if (headerEntries) for (const [key, value] of headerEntries) {
        const lowerKey = typeof key === "string" ? key.toLowerCase() : String(key);
        if (Array.isArray(value)) for (const v of value) headers.push(lowerKey, v);
        else headers.push(lowerKey, value);
        if (lowerKey === "content-type") hasContentTypeHeader = true;
        else if (lowerKey === "content-length") hasContentLength = true;
      }
      if (contentType && !hasContentTypeHeader) headers.push("content-type", contentType);
      if (contentLength && !hasContentLength) headers.push("content-length", String(contentLength));
      __privateSet(this, _init, void 0);
      __privateSet(this, _headers, void 0);
      __privateSet(this, _response, void 0);
      __privateSet(this, _body, void 0);
      return {
        status: status2,
        statusText,
        headers,
        body
      };
    }
  }
  _body = new WeakMap();
  _init = new WeakMap();
  _headers = new WeakMap();
  _response = new WeakMap();
  lazyInherit(NodeResponse2.prototype, NativeResponse.prototype, "_response");
  Object.setPrototypeOf(NodeResponse2, NativeResponse);
  Object.setPrototypeOf(NodeResponse2.prototype, NativeResponse.prototype);
  return NodeResponse2;
})();
function serve$1(options) {
  return new NodeServer(options);
}
var NodeServer = (_g = class {
  constructor(options) {
    __publicField(this, "runtime", "node");
    __publicField(this, "options");
    __publicField(this, "node");
    __publicField(this, "serveOptions");
    __publicField(this, "fetch");
    __publicField(this, "waitUntil");
    __privateAdd(this, _isSecure);
    __privateAdd(this, _listeningPromise);
    __privateAdd(this, _listenError);
    __privateAdd(this, _wait);
    var _a3;
    this.options = {
      ...options,
      middleware: [...options.middleware || []]
    };
    for (const plugin2 of options.plugins || []) plugin2(this);
    errorPlugin(this);
    const fetchHandler = this.fetch = wrapFetch(this);
    const handler = (nodeReq, nodeRes) => {
      var _a4;
      const reqUrl = nodeReq.url;
      if (reqUrl && reqUrl[0] !== "/" && reqUrl !== "*" && !URL.canParse(reqUrl)) {
        nodeRes.statusCode = 400;
        nodeRes.end();
        return;
      }
      const request = new NodeRequest({
        req: nodeReq,
        res: nodeRes,
        maxRequestBodySize: this.options.maxRequestBodySize,
        trustProxy: this.options.trustProxy
      });
      request.waitUntil = (_a4 = __privateGet(this, _wait)) == null ? void 0 : _a4.waitUntil;
      const res = fetchHandler(request);
      return res instanceof Promise ? res.then((resolvedRes) => sendNodeResponseDetached(nodeRes, resolvedRes)) : sendNodeResponseDetached(nodeRes, res);
    };
    this.node = {
      handler,
      server: void 0
    };
    const loader = globalThis.__srvxLoader__;
    if (loader) {
      loader({ server: this });
      return;
    }
    gracefulShutdownPlugin(this);
    __privateSet(this, _wait, createWaitUntil());
    this.waitUntil = __privateGet(this, _wait).waitUntil;
    const tls = resolveTLSOptions(this.options);
    const { port, hostname: host } = resolvePortAndHost(this.options);
    this.serveOptions = {
      port,
      host,
      exclusive: !this.options.reusePort,
      ...tls,
      ...this.options.node
    };
    let server;
    __privateSet(this, _isSecure, !!this.serveOptions.cert && this.options.protocol !== "http");
    if (((_a3 = this.options.node) == null ? void 0 : _a3.http2) ?? __privateGet(this, _isSecure)) if (__privateGet(this, _isSecure)) server = nodeHTTP2.createSecureServer({
      allowHTTP1: true,
      ...this.serveOptions
    }, handler);
    else throw new Error("node.http2 option requires tls certificate!");
    else if (__privateGet(this, _isSecure)) server = nodeHTTPS.createServer(this.serveOptions, handler);
    else server = nodeHTTP.createServer(this.serveOptions, handler);
    this.node.server = server;
    if (!options.manual) this.serve().catch(() => {
    });
  }
  serve() {
    var _a3;
    if (__privateGet(this, _listeningPromise)) return __privateGet(this, _listeningPromise).then(() => this);
    const server = (_a3 = this.node) == null ? void 0 : _a3.server;
    if (!server) return Promise.reject(/* @__PURE__ */ new Error("Server not initialized"));
    __privateSet(this, _listenError, void 0);
    __privateSet(this, _listeningPromise, new Promise((resolve, reject) => {
      const onError = (error) => {
        server.off("listening", onListening);
        __privateSet(this, _listenError, error);
        __privateSet(this, _listeningPromise, void 0);
        reject(error);
      };
      const onListening = () => {
        server.off("error", onError);
        printListening(this.options, this.url);
        resolve();
      };
      server.once("error", onError);
      server.once("listening", onListening);
      server.listen(this.serveOptions);
    }));
    return __privateGet(this, _listeningPromise).then(() => this);
  }
  get url() {
    var _a3, _b2;
    const addr = (_b2 = (_a3 = this.node) == null ? void 0 : _a3.server) == null ? void 0 : _b2.address();
    if (!addr) return;
    return typeof addr === "string" ? addr : fmtURL(addr.address, addr.port, __privateGet(this, _isSecure));
  }
  ready() {
    if (__privateGet(this, _listenError)) return Promise.reject(__privateGet(this, _listenError));
    return Promise.resolve(__privateGet(this, _listeningPromise)).then(() => this);
  }
  async close(closeAll) {
    var _a3;
    await Promise.all([(_a3 = __privateGet(this, _wait)) == null ? void 0 : _a3.wait(), new Promise((resolve, reject) => {
      var _a4;
      const server = (_a4 = this.node) == null ? void 0 : _a4.server;
      if (server && closeAll && "closeAllConnections" in server) server.closeAllConnections();
      if (!server || !server.listening) return resolve();
      server.close((error) => error ? reject(error) : resolve());
    })]);
  }
}, _isSecure = new WeakMap(), _listeningPromise = new WeakMap(), _listenError = new WeakMap(), _wait = new WeakMap(), _g);
function plugin(wsOpts) {
  return (server) => {
    var _a3;
    const ws = nodeAdapter({
      hooks: wsOpts,
      resolve: defaultResolve(server, wsOpts),
      ...(_a3 = wsOpts.options) == null ? void 0 : _a3.node
    });
    const originalServe = server.serve;
    server.serve = () => {
      var _a4;
      (_a4 = server.node) == null ? void 0 : _a4.server.on("upgrade", (req, socket, head) => {
        ws.handleUpgrade(req, socket, head, new NodeRequest({
          req,
          upgrade: {
            socket,
            head
          }
        }));
      });
      return originalServe.call(server);
    };
  };
}
function serve(options) {
  if (options.websocket) {
    options.plugins || (options.plugins = []);
    options.plugins.push(plugin(options.websocket));
  }
  return serve$1(options);
}
function createWebSocketAdapter() {
  const store = {};
  function handler(app2, path2, options) {
    const { parse: parse2, body, response, ...rest } = options;
    const validateMessage = getSchemaValidator(body, {
      // @ts-expect-error private property
      modules: app2.definitions.typebox,
      // @ts-expect-error private property
      models: app2.definitions.type,
      normalize: app2.config.normalize
    });
    const validateResponse = getSchemaValidator(response, {
      // @ts-expect-error private property
      modules: app2.definitions.typebox,
      // @ts-expect-error private property
      models: app2.definitions.type,
      normalize: app2.config.normalize
    });
    const toServerWebSocket = (peer, context) => {
      const ws = peer;
      ws.data = context;
      ws.sendText = ws.send;
      ws.sendBinary = ws.send;
      ws.publishText = ws.publish;
      ws.publishBinary = ws.publish;
      ws.isSubscribed = (topic) => peer.topics.has(topic);
      ws.cork = () => {
        console.log("ws.cork is not supported yet");
      };
      return ws;
    };
    app2.route(
      "WS",
      path2,
      // @ts-ignore
      async (context) => {
        const { set: set2, path: path22, qi, headers, query, params } = context;
        const id = context.request.wsId;
        context.validator = validateResponse;
        if (options.upgrade) {
          if (typeof options.upgrade === "function") {
            const temp = options.upgrade(context);
            if (temp instanceof Promise) await temp;
          } else if (options.upgrade)
            Object.assign(
              set2.headers,
              options.upgrade
            );
        }
        if (set2.cookie && isNotEmpty(set2.cookie)) {
          const cookie = serializeCookie(set2.cookie);
          if (cookie) set2.headers["set-cookie"] = cookie;
        }
        if (set2.headers["set-cookie"] && Array.isArray(set2.headers["set-cookie"]))
          set2.headers = parseSetCookies(
            new Headers(set2.headers),
            set2.headers["set-cookie"]
          );
        const handleResponse2 = createHandleWSResponse(validateResponse);
        const parseMessage = parse2 ? createWSMessageParser(parse2) : void 0;
        if (typeof options.beforeHandle === "function") {
          const result = options.beforeHandle(context);
          if (result instanceof Promise) await result;
        }
        const errorHandlers = [
          ...options.error ? Array.isArray(options.error) ? options.error : [options.error] : [],
          ...(app2.event.error ?? []).map(
            (x) => typeof x === "function" ? x : x.fn
          )
        ].filter((x) => x);
        const handleErrors = errorHandlers.length ? async (ws, error) => {
          for (const handleError of errorHandlers) {
            let response2 = handleError(
              Object.assign(context, { error })
            );
            if (response2 instanceof Promise)
              response2 = await response2;
            await handleResponse2(ws, response2);
            if (response2) break;
          }
        } : void 0;
        store[id] = {
          data: context,
          validateResponse,
          ping(ws, data) {
            var _a3;
            return (_a3 = options.ping) == null ? void 0 : _a3.call(options, ws, data);
          },
          pong(ws, data) {
            var _a3;
            return (_a3 = options.pong) == null ? void 0 : _a3.call(options, ws, data);
          },
          async open(_ws2) {
            var _a3;
            const ws = toServerWebSocket(_ws2, context);
            try {
              await handleResponse2(
                ws,
                (_a3 = options.open) == null ? void 0 : _a3.call(options, new ElysiaWS(ws, context))
              );
            } catch (error) {
              handleErrors == null ? void 0 : handleErrors(ws, error);
            }
          },
          async message(ws, message) {
            var _a3;
            if (message.includes("ping")) {
              try {
                return void ws.pong(message);
              } catch (error) {
                handleErrors == null ? void 0 : handleErrors(ws, error);
              }
            }
            if (parseMessage)
              message = await parseMessage(ws, message);
            if (message) {
              if ((validateMessage == null ? void 0 : validateMessage.Check(message)) === false)
                return void ws.send(
                  new ValidationError(
                    "message",
                    validateMessage,
                    message
                  ).message
                );
            }
            try {
              await handleResponse2(
                ws,
                (_a3 = options.message) == null ? void 0 : _a3.call(
                  options,
                  new ElysiaWS(ws, context, message),
                  message
                )
              );
            } catch (error) {
              handleErrors == null ? void 0 : handleErrors(ws, error);
            }
          },
          async drain(ws) {
            var _a3;
            try {
              await handleResponse2(
                ws,
                (_a3 = options.drain) == null ? void 0 : _a3.call(
                  options,
                  new ElysiaWS(ws, context)
                )
              );
            } catch (error) {
              handleErrors == null ? void 0 : handleErrors(ws, error);
            }
          },
          async close(ws, code, reason) {
            var _a3;
            try {
              await handleResponse2(
                ws,
                (_a3 = options.close) == null ? void 0 : _a3.call(
                  options,
                  new ElysiaWS(ws, context),
                  code,
                  reason
                )
              );
            } catch (error) {
              handleErrors == null ? void 0 : handleErrors(ws, error);
            }
          },
          error(ws, error) {
            handleErrors == null ? void 0 : handleErrors(ws, error);
          }
        };
        return "";
      },
      {
        ...rest,
        websocket: options
      }
    );
  }
  function createConfig(app2) {
    return defineHooks({
      async upgrade(request) {
        const id = request.wsId = randomId();
        const response = await app2.handle(request);
        const context = store[id];
        if (!context) return response;
        return {
          context,
          headers: context.data.set.headers
        };
      },
      open(ws) {
        const context = ws.context;
        context.open(ws);
      },
      message(ws, message) {
        const context = ws.context;
        context.message(ws, message.text());
      },
      close(ws, detail) {
        const context = ws.context;
        context.close(
          // ws is parsed in context.open
          ws,
          detail.code,
          detail.reason
        );
      },
      error(ws, error) {
        var _a3;
        const context = ws.context;
        (_a3 = context.error) == null ? void 0 : _a3.call(context, ws, error);
      }
    });
  }
  return { handler, createConfig, context: store };
}
var handleFile = (response, set2) => {
  if (response instanceof Promise)
    return response.then((res) => handleFile(res, set2));
  const size = response.size;
  const immutable = set2 && (set2.status === 206 || set2.status === 304 || set2.status === 412 || set2.status === 416);
  const defaultHeader = immutable ? {
    "transfer-encoding": "chunked"
  } : {
    "accept-ranges": "bytes",
    "content-range": size ? `bytes 0-${size - 1}/${size}` : void 0,
    "transfer-encoding": "chunked"
  };
  if (!set2 && !size) return new NodeResponse(response);
  if (!set2)
    return new NodeResponse(response, {
      headers: defaultHeader
    });
  if (set2.headers instanceof Headers) {
    let setHeaders = defaultHeader;
    setHeaders = {};
    for (const [key, value] of set2.headers.entries())
      if (key in set2.headers) setHeaders[key] = value;
    if (immutable) {
      delete set2.headers["content-length"];
      delete set2.headers["accept-ranges"];
    }
    return new NodeResponse(response, {
      status: set2.status,
      headers: setHeaders
    });
  }
  if (isNotEmpty(set2.headers))
    return new NodeResponse(response, {
      status: set2.status,
      headers: Object.assign(defaultHeader, set2.headers)
    });
  return new NodeResponse(response, {
    status: set2.status,
    headers: defaultHeader
  });
};
function mergeHeaders(responseHeaders, setHeaders) {
  const headers = new Headers(Object.fromEntries(responseHeaders.entries()));
  if (setHeaders instanceof Headers)
    for (const key of setHeaders.keys()) {
      if (key === "set-cookie") {
        if (headers.has("set-cookie")) continue;
        for (const cookie of setHeaders.getSetCookie())
          headers.append("set-cookie", cookie);
      } else if (!responseHeaders.has(key))
        headers.set(key, (setHeaders == null ? void 0 : setHeaders.get(key)) ?? "");
    }
  else
    for (const key in setHeaders)
      if (key === "set-cookie")
        headers.append(key, setHeaders[key]);
      else if (!responseHeaders.has(key))
        headers.set(key, setHeaders[key]);
  return headers;
}
function mergeStatus(responseStatus, setStatus) {
  if (typeof setStatus === "string") setStatus = StatusMap[setStatus];
  if (responseStatus === 200) return setStatus;
  return responseStatus;
}
var createResponseHandler = (handler) => {
  const handleStream2 = createStreamHandler(handler);
  return (response, set2, request) => {
    const newResponse = new NodeResponse(response.body, {
      headers: mergeHeaders(response.headers, set2.headers),
      status: mergeStatus(response.status, set2.status)
    });
    if (!newResponse.headers.has("content-length") && newResponse.headers.get("transfer-encoding") === "chunked")
      return handleStream2(
        streamResponse(newResponse),
        responseToSetHeaders(newResponse, set2),
        request,
        // @ts-ignore
        true
        // don't auto-format SSE for pre-formatted Response
      );
    return newResponse;
  };
};
var handleElysiaFile = (file, set2 = {
  headers: {}
}) => {
  const path2 = file.path;
  const contentType = mime[path2.slice(path2.lastIndexOf(".") + 1)];
  if (contentType) set2.headers["content-type"] = contentType;
  if (file.stats && set2 && set2.status !== 206 && set2.status !== 304 && set2.status !== 412 && set2.status !== 416)
    return file.stats.then((stat2) => {
      const size = stat2.size;
      if (size !== void 0) {
        set2.headers["content-range"] = `bytes 0-${size - 1}/${size}`;
        set2.headers["content-length"] = size;
      }
      return handleFile(file.value, set2);
    });
  return handleFile(file.value, set2);
};
var mapResponse = (response, set2, request) => {
  var _a3, _b2, _c3;
  if (isNotEmpty(set2.headers) || set2.status !== 200 || set2.cookie) {
    handleSet(set2);
    switch ((_a3 = response == null ? void 0 : response.constructor) == null ? void 0 : _a3.name) {
      case "String":
        set2.headers["content-type"] = "text/plain";
        return new NodeResponse(response, set2);
      case "Array":
      case "Object":
        set2.headers["content-type"] = "application/json";
        return new NodeResponse(JSON.stringify(response), set2);
      case "ElysiaFile":
        return handleElysiaFile(response, set2);
      case "File":
        return handleFile(response, set2);
      case "Blob":
        return handleFile(response, set2);
      case "ElysiaCustomStatusResponse":
        set2.status = response.code;
        return mapResponse(
          response.response,
          set2,
          request
        );
      case "ReadableStream":
        if (!((_b2 = set2.headers["content-type"]) == null ? void 0 : _b2.startsWith(
          "text/event-stream"
        )))
          set2.headers["content-type"] = "text/event-stream; charset=utf-8";
        (_c3 = request == null ? void 0 : request.signal) == null ? void 0 : _c3.addEventListener(
          "abort",
          {
            handleEvent() {
              var _a4;
              if ((request == null ? void 0 : request.signal) && !((_a4 = request == null ? void 0 : request.signal) == null ? void 0 : _a4.aborted))
                response.cancel();
            }
          },
          {
            once: true
          }
        );
        return new NodeResponse(response, set2);
      case void 0:
        if (!response) return new NodeResponse(null, set2);
        return new NodeResponse(JSON.stringify(response), set2);
      case "Response":
        return handleResponse(response, set2, request);
      case "Error":
        return errorToResponse(response, set2);
      case "Promise":
        return response.then(
          (x) => mapResponse(x, set2, request)
        );
      case "Function":
        return mapResponse(response(), set2, request);
      case "Number":
      case "Boolean":
        return new NodeResponse(
          response.toString(),
          set2
        );
      case "Cookie":
        if (response instanceof Cookie)
          return new NodeResponse(response.value, set2);
        return new NodeResponse(response == null ? void 0 : response.toString(), set2);
      case "FormData":
        return new NodeResponse(response, set2);
      default:
        if (response instanceof NodeResponse)
          return handleResponse(response, set2, request);
        if (response instanceof Promise)
          return response.then((x) => mapResponse(x, set2));
        if (response instanceof Error)
          return errorToResponse(response, set2);
        if (response instanceof ElysiaCustomStatusResponse) {
          set2.status = response.code;
          return mapResponse(
            response.response,
            set2,
            request
          );
        }
        if (typeof (response == null ? void 0 : response.next) === "function")
          return handleStream(response, set2, request);
        if (typeof (response == null ? void 0 : response.then) === "function")
          return response.then((x) => mapResponse(x, set2));
        if (typeof (response == null ? void 0 : response.toResponse) === "function")
          return mapResponse(response.toResponse(), set2);
        if ("charCodeAt" in response) {
          const code = response.charCodeAt(0);
          if (code === 123 || code === 91) {
            if (!set2.headers["Content-Type"])
              set2.headers["Content-Type"] = "application/json";
            return new NodeResponse(
              JSON.stringify(response),
              set2
            );
          }
        }
        return new NodeResponse(response, set2);
    }
  }
  if (response instanceof NodeResponse && !response.headers.has("content-length") && response.headers.get("transfer-encoding") === "chunked")
    return handleStream(
      streamResponse(response),
      responseToSetHeaders(response, set2),
      request
    );
  if (
    // @ts-expect-error
    typeof (response == null ? void 0 : response.next) === "function" || response instanceof ReadableStream
  )
    return handleStream(response, set2, request);
  return mapCompactResponse(response, request);
};
var mapEarlyResponse = (response, set2, request) => {
  var _a3, _b2, _c3, _d2, _e2;
  if (response === void 0 || response === null) return;
  if (isNotEmpty(set2.headers) || set2.status !== 200 || set2.cookie) {
    handleSet(set2);
    switch ((_a3 = response == null ? void 0 : response.constructor) == null ? void 0 : _a3.name) {
      case "String":
        set2.headers["content-type"] = "text/plain";
        return new NodeResponse(response, set2);
      case "Array":
      case "Object":
        set2.headers["content-type"] = "application/json";
        return new NodeResponse(JSON.stringify(response), set2);
      case "ElysiaFile":
        return handleElysiaFile(response, set2);
      case "File":
        return handleFile(response, set2);
      case "Blob":
        return handleFile(response, set2);
      case "ElysiaCustomStatusResponse":
        set2.status = response.code;
        return mapEarlyResponse(
          response.response,
          set2,
          request
        );
      case "ReadableStream":
        if (!((_b2 = set2.headers["content-type"]) == null ? void 0 : _b2.startsWith(
          "text/event-stream"
        )))
          set2.headers["content-type"] = "text/event-stream; charset=utf-8";
        (_c3 = request == null ? void 0 : request.signal) == null ? void 0 : _c3.addEventListener(
          "abort",
          {
            handleEvent() {
              var _a4;
              if ((request == null ? void 0 : request.signal) && !((_a4 = request == null ? void 0 : request.signal) == null ? void 0 : _a4.aborted))
                response.cancel();
            }
          },
          {
            once: true
          }
        );
        return new NodeResponse(response, set2);
      case void 0:
        if (!response) return;
        return new NodeResponse(JSON.stringify(response), set2);
      case "Response":
        return handleResponse(response, set2, request);
      case "Promise":
        return response.then(
          (x) => mapEarlyResponse(x, set2)
        );
      case "Error":
        return errorToResponse(response, set2);
      case "Function":
        return mapEarlyResponse(response(), set2);
      case "Number":
      case "Boolean":
        return new NodeResponse(
          response.toString(),
          set2
        );
      case "FormData":
        return new NodeResponse(response);
      case "Cookie":
        if (response instanceof Cookie)
          return new NodeResponse(response.value, set2);
        return new NodeResponse(response == null ? void 0 : response.toString(), set2);
      default:
        if (response instanceof NodeResponse)
          return handleResponse(response, set2, request);
        if (response instanceof Promise)
          return response.then((x) => mapEarlyResponse(x, set2));
        if (response instanceof Error)
          return errorToResponse(response, set2);
        if (response instanceof ElysiaCustomStatusResponse) {
          set2.status = response.code;
          return mapEarlyResponse(
            response.response,
            set2,
            request
          );
        }
        if (typeof (response == null ? void 0 : response.next) === "function")
          return handleStream(response, set2, request);
        if (typeof (response == null ? void 0 : response.then) === "function")
          return response.then((x) => mapEarlyResponse(x, set2));
        if (typeof (response == null ? void 0 : response.toResponse) === "function")
          return mapEarlyResponse(response.toResponse(), set2);
        if ("charCodeAt" in response) {
          const code = response.charCodeAt(0);
          if (code === 123 || code === 91) {
            if (!set2.headers["Content-Type"])
              set2.headers["Content-Type"] = "application/json";
            return new NodeResponse(
              JSON.stringify(response),
              set2
            );
          }
        }
        return new NodeResponse(response, set2);
    }
  } else
    switch ((_d2 = response == null ? void 0 : response.constructor) == null ? void 0 : _d2.name) {
      case "String":
        set2.headers["content-type"] = "text/plain";
        return new NodeResponse(response);
      case "Array":
      case "Object":
        set2.headers["content-type"] = "application/json";
        return new NodeResponse(JSON.stringify(response), set2);
      case "ElysiaFile":
        return handleElysiaFile(response, set2);
      case "File":
        return handleFile(response, set2);
      case "Blob":
        return handleFile(response, set2);
      case "ElysiaCustomStatusResponse":
        set2.status = response.code;
        return mapEarlyResponse(
          response.response,
          set2,
          request
        );
      case "ReadableStream":
        (_e2 = request == null ? void 0 : request.signal) == null ? void 0 : _e2.addEventListener(
          "abort",
          {
            handleEvent() {
              var _a4;
              if ((request == null ? void 0 : request.signal) && !((_a4 = request == null ? void 0 : request.signal) == null ? void 0 : _a4.aborted))
                response.cancel();
            }
          },
          {
            once: true
          }
        );
        return new NodeResponse(response, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8"
          }
        });
      case void 0:
        if (!response) return new NodeResponse("");
        return new NodeResponse(JSON.stringify(response), {
          headers: {
            "content-type": "application/json"
          }
        });
      case "Response":
        if (!response.headers.has("content-length") && response.headers.get("transfer-encoding") === "chunked")
          return handleStream(
            streamResponse(response),
            responseToSetHeaders(response),
            request
          );
        return response;
      case "Promise":
        return response.then((x) => {
          const r = mapEarlyResponse(x, set2);
          if (r !== void 0) return r;
        });
      case "Error":
        return errorToResponse(response, set2);
      case "Function":
        return mapCompactResponse(response(), request);
      case "Number":
      case "Boolean":
        return new NodeResponse(response.toString());
      case "Cookie":
        if (response instanceof Cookie)
          return new NodeResponse(response.value, set2);
        return new NodeResponse(response == null ? void 0 : response.toString(), set2);
      case "FormData":
        return new NodeResponse(response);
      default:
        if (response instanceof NodeResponse) return response;
        if (response instanceof Promise)
          return response.then((x) => mapEarlyResponse(x, set2));
        if (response instanceof Error)
          return errorToResponse(response, set2);
        if (response instanceof ElysiaCustomStatusResponse) {
          set2.status = response.code;
          return mapEarlyResponse(
            response.response,
            set2,
            request
          );
        }
        if (typeof (response == null ? void 0 : response.next) === "function")
          return handleStream(response, set2, request);
        if (typeof (response == null ? void 0 : response.then) === "function")
          return response.then((x) => mapEarlyResponse(x, set2));
        if (typeof (response == null ? void 0 : response.toResponse) === "function")
          return mapEarlyResponse(response.toResponse(), set2);
        if ("charCodeAt" in response) {
          const code = response.charCodeAt(0);
          if (code === 123 || code === 91) {
            if (!set2.headers["Content-Type"])
              set2.headers["Content-Type"] = "application/json";
            return new NodeResponse(
              JSON.stringify(response),
              set2
            );
          }
        }
        return new NodeResponse(response);
    }
};
var mapCompactResponse = (response, request) => {
  var _a3, _b2;
  switch ((_a3 = response == null ? void 0 : response.constructor) == null ? void 0 : _a3.name) {
    case "String":
      return new NodeResponse(response, {
        headers: {
          "Content-Type": "text/plain"
        }
      });
    case "Object":
    case "Array":
      return new NodeResponse(JSON.stringify(response), {
        headers: {
          "Content-Type": "application/json"
        }
      });
    case "ElysiaFile":
      return handleElysiaFile(response);
    case "File":
      return handleFile(response);
    case "Blob":
      return handleFile(response);
    case "ElysiaCustomStatusResponse":
      return mapResponse(
        response.response,
        {
          status: response.code,
          headers: {}
        }
      );
    case "ReadableStream":
      (_b2 = request == null ? void 0 : request.signal) == null ? void 0 : _b2.addEventListener(
        "abort",
        {
          handleEvent() {
            var _a4;
            if ((request == null ? void 0 : request.signal) && !((_a4 = request == null ? void 0 : request.signal) == null ? void 0 : _a4.aborted))
              response.cancel();
          }
        },
        {
          once: true
        }
      );
      return new NodeResponse(response, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8"
        }
      });
    case void 0:
      if (!response) return new NodeResponse("");
      return new NodeResponse(JSON.stringify(response), {
        headers: {
          "content-type": "application/json"
        }
      });
    case "Response":
      if (response.headers.get("transfer-encoding") === "chunked")
        return handleStream(
          streamResponse(response),
          responseToSetHeaders(response),
          request
        );
      return response;
    case "Error":
      return errorToResponse(response);
    case "Promise":
      return response.then(
        (x) => mapCompactResponse(x, request)
      );
    case "Function":
      return mapCompactResponse(response(), request);
    case "Number":
    case "Boolean":
      return new NodeResponse(response.toString());
    case "FormData":
      return new NodeResponse(response);
    default:
      if (response instanceof NodeResponse) return response;
      if (response instanceof Promise)
        return response.then(
          (x) => mapCompactResponse(x, request)
        );
      if (response instanceof Error)
        return errorToResponse(response);
      if (response instanceof ElysiaCustomStatusResponse)
        return mapResponse(
          response.response,
          {
            status: response.code,
            headers: {}
          }
        );
      if (typeof (response == null ? void 0 : response.next) === "function")
        return handleStream(response, void 0, request);
      if (typeof (response == null ? void 0 : response.then) === "function")
        return response.then((x) => mapResponse(x, set));
      if (typeof (response == null ? void 0 : response.toResponse) === "function")
        return mapCompactResponse(response.toResponse());
      if ("charCodeAt" in response) {
        const code = response.charCodeAt(0);
        if (code === 123 || code === 91) {
          return new NodeResponse(JSON.stringify(response), {
            headers: {
              "Content-Type": "application/json"
            }
          });
        }
      }
      return new NodeResponse(response);
  }
};
var errorToResponse = (error, set2) => new NodeResponse(
  JSON.stringify({
    name: error == null ? void 0 : error.name,
    message: error == null ? void 0 : error.message,
    cause: error == null ? void 0 : error.cause
  }),
  {
    status: (set2 == null ? void 0 : set2.status) !== 200 ? (set2 == null ? void 0 : set2.status) ?? 500 : 500,
    headers: set2 == null ? void 0 : set2.headers
  }
);
var createStaticHandler = (handle, hooks, setHeaders = {}) => {
  var _a3, _b2, _c3, _d2;
  if (typeof handle === "function") return;
  const response = mapResponse(handle, {
    headers: setHeaders
  });
  if (!((_a3 = hooks.parse) == null ? void 0 : _a3.length) && !((_b2 = hooks.transform) == null ? void 0 : _b2.length) && !((_c3 = hooks.beforeHandle) == null ? void 0 : _c3.length) && !((_d2 = hooks.afterHandle) == null ? void 0 : _d2.length))
    return response.clone.bind(response);
};
var handleResponse = createResponseHandler({
  mapResponse,
  mapCompactResponse
});
var handleStream = createStreamHandler({
  mapResponse,
  mapCompactResponse
});
var node = () => {
  const ws = createWebSocketAdapter();
  return {
    ...WebStandardAdapter,
    name: "@elysiajs/node",
    handler: {
      mapCompactResponse,
      mapEarlyResponse,
      mapResponse,
      createStaticHandler
    },
    ws: ws.handler,
    listen(app2) {
      return (options, callback) => {
        var _a3, _b2, _c3;
        if (typeof options === "string") {
          if (!isNumericString(options))
            throw new Error("Port must be a numeric value");
          options = parseInt(options);
        }
        const serverOptions = typeof options === "number" ? {
          port: options,
          silent: true,
          websocket: ws.createConfig(app2),
          fetch: app2.fetch,
          reusePort: true
        } : {
          reusePort: true,
          ...options,
          silent: true,
          websocket: ws.createConfig(app2),
          fetch: app2.fetch
        };
        let server = serve(serverOptions);
        const nodeServer = (_a3 = server.node) == null ? void 0 : _a3.server;
        const hostname = server.serveOptions.host ?? "localhost";
        const port = server.options.port;
        const serverInfo = {
          ...server,
          id: randomId(),
          development: process.env.NODE_ENV !== "production",
          fetch: app2.fetch,
          hostname,
          get pendingRequests() {
            const { promise, resolve, reject } = Promise.withResolvers();
            nodeServer == null ? void 0 : nodeServer.getConnections((error, total) => {
              if (error) reject(error);
              resolve(total);
            });
            return promise;
          },
          get pendingWebSockets() {
            return 0;
          },
          port,
          publish() {
            return 0;
          },
          ref() {
            nodeServer == null ? void 0 : nodeServer.ref();
          },
          unref() {
            nodeServer == null ? void 0 : nodeServer.unref();
          },
          reload() {
            nodeServer == null ? void 0 : nodeServer.close();
            server = serve(serverOptions);
            return serverInfo;
          },
          requestIP() {
            throw new Error(
              "This adapter doesn't support Bun requestIP method"
            );
          },
          stop() {
            return server.close();
          },
          upgrade() {
            throw new Error(
              "This adapter doesn't support Web Standard Upgrade method"
            );
          },
          url: new URL(
            `http://${hostname === "::" ? "localhost" : hostname}:${port}`
          ),
          [Symbol.dispose]() {
            server.close();
          },
          // @ts-ignore
          raw: server
        };
        if (callback) callback(serverInfo);
        (_c3 = (_b2 = app2.router.http).build) == null ? void 0 : _c3.call(_b2);
        if (app2.event.start)
          for (let i = 0; i < app2.event.start.length; i++)
            app2.event.start[i].fn(this);
        process.on("beforeExit", () => {
          server.close();
          if (app2.event.stop)
            for (let i = 0; i < app2.event.stop.length; i++)
              app2.event.stop[i].fn(this);
        });
      };
    }
  };
};
const PUERTO_TRANSFERENCIA = 53317;
const TIPO_SERVICIO_BONJOUR = "localsend";
const RUTA_WEBSOCKET = "/transferencia";
function interpretarMensajeMetadatos(mensajeTexto) {
  return JSON.parse(mensajeTexto);
}
function crearMensajeRespuesta(aceptado) {
  return JSON.stringify({ tipo: "respuesta", aceptado });
}
function generarIdUnico() {
  return randomUUID();
}
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
let mainWindow = null;
const bonjour = new Bonjour_1();
const transferenciasActivas = /* @__PURE__ */ new Map();
function crearVentana() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 650,
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL ?? "http://localhost:5173");
}
function iniciarServidorTransferencia() {
  return new Elysia({ adapter: node() }).ws(RUTA_WEBSOCKET, {
    open(ws) {
      console.log("Peer conectado:", ws.id);
    },
    message(ws, mensaje) {
      if (typeof mensaje === "string") {
        const metadatos = interpretarMensajeMetadatos(mensaje);
        const rutaDestino = path.join(app.getPath("downloads"), metadatos.nombre);
        transferenciasActivas.set(ws.id, {
          streamEscritura: fs.createWriteStream(rutaDestino),
          tamañoEsperado: metadatos.tamaño,
          bytesRecibidos: 0,
          nombreArchivo: metadatos.nombre
        });
        ws.send(crearMensajeRespuesta(true));
        return;
      }
      const estado = transferenciasActivas.get(ws.id);
      if (!estado) return;
      estado.streamEscritura.write(mensaje);
      estado.bytesRecibidos += mensaje.length;
      if (estado.bytesRecibidos >= estado.tamañoEsperado) {
        estado.streamEscritura.end();
        transferenciasActivas.delete(ws.id);
      }
    },
    close(ws) {
      const estado = transferenciasActivas.get(ws.id);
      if (estado) {
        estado.streamEscritura.end();
        transferenciasActivas.delete(ws.id);
      }
    }
  }).listen(PUERTO_TRANSFERENCIA);
}
const MI_ID = generarIdUnico();
function publicarYBuscarDispositivos() {
  const servicioPublicado = bonjour.publish({
    name: "Mi PC - LocalSend",
    type: TIPO_SERVICIO_BONJOUR,
    port: PUERTO_TRANSFERENCIA,
    txt: { version: "1.0.0", id: MI_ID }
    // NUEVO: mandamos nuestro id en el anuncio
  });
  servicioPublicado.on("up", () => console.log("Anunciado en la red vía Bonjour."));
  servicioPublicado.on("error", (err) => console.warn("Aviso Bonjour:", err.message));
  ipcMain.on("buscar-servicios", () => {
    const browser2 = bonjour.find({ type: TIPO_SERVICIO_BONJOUR });
    browser2.on("up", (servicio) => {
      var _a3;
      if (((_a3 = servicio.txt) == null ? void 0 : _a3.id) === MI_ID) return;
      mainWindow == null ? void 0 : mainWindow.webContents.send("servicio-encontrado", {
        name: servicio.name,
        addresses: servicio.addresses,
        port: servicio.port
      });
    });
  });
}
app.disableHardwareAcceleration();
app.whenReady().then(() => {
  crearVentana();
  iniciarServidorTransferencia();
  publicarYBuscarDispositivos();
});
app.on("window-all-closed", () => {
  bonjour.destroy();
  if (process.platform !== "darwin") app.quit();
});
export {
  getDefaultExportFromCjs as g
};
