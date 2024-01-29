globalThis._importMeta_=globalThis._importMeta_||{url:"file:///_entry.js",env:process.env};import http, { Server as Server$1 } from 'node:http';
import https, { Server } from 'node:https';
import { promises, existsSync } from 'fs';
import { dirname as dirname$1, resolve as resolve$1, join } from 'path';
import { promises as promises$1 } from 'node:fs';
import { fileURLToPath } from 'node:url';

const suspectProtoRx = /"(?:_|\\u0{2}5[Ff]){2}(?:p|\\u0{2}70)(?:r|\\u0{2}72)(?:o|\\u0{2}6[Ff])(?:t|\\u0{2}74)(?:o|\\u0{2}6[Ff])(?:_|\\u0{2}5[Ff]){2}"\s*:/;
const suspectConstructorRx = /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;
const JsonSigRx = /^\s*["[{]|^\s*-?\d{1,16}(\.\d{1,17})?([Ee][+-]?\d+)?\s*$/;
function jsonParseTransform(key, value) {
  if (key === "__proto__" || key === "constructor" && value && typeof value === "object" && "prototype" in value) {
    warnKeyDropped(key);
    return;
  }
  return value;
}
function warnKeyDropped(key) {
  console.warn(`[destr] Dropping "${key}" key to prevent prototype pollution.`);
}
function destr(value, options = {}) {
  if (typeof value !== "string") {
    return value;
  }
  const _value = value.trim();
  if (
    // eslint-disable-next-line unicorn/prefer-at
    value[0] === '"' && value.at(-1) === '"' && !value.includes("\\")
  ) {
    return _value.slice(1, -1);
  }
  if (_value.length <= 9) {
    const _lval = _value.toLowerCase();
    if (_lval === "true") {
      return true;
    }
    if (_lval === "false") {
      return false;
    }
    if (_lval === "undefined") {
      return void 0;
    }
    if (_lval === "null") {
      return null;
    }
    if (_lval === "nan") {
      return Number.NaN;
    }
    if (_lval === "infinity") {
      return Number.POSITIVE_INFINITY;
    }
    if (_lval === "-infinity") {
      return Number.NEGATIVE_INFINITY;
    }
  }
  if (!JsonSigRx.test(value)) {
    if (options.strict) {
      throw new SyntaxError("[destr] Invalid JSON");
    }
    return value;
  }
  try {
    if (suspectProtoRx.test(value) || suspectConstructorRx.test(value)) {
      if (options.strict) {
        throw new Error("[destr] Possible prototype pollution");
      }
      return JSON.parse(value, jsonParseTransform);
    }
    return JSON.parse(value);
  } catch (error) {
    if (options.strict) {
      throw error;
    }
    return value;
  }
}

const HASH_RE = /#/g;
const AMPERSAND_RE = /&/g;
const EQUAL_RE = /=/g;
const PLUS_RE = /\+/g;
const ENC_CARET_RE = /%5e/gi;
const ENC_BACKTICK_RE = /%60/gi;
const ENC_PIPE_RE = /%7c/gi;
const ENC_SPACE_RE = /%20/gi;
const ENC_SLASH_RE = /%2f/gi;
function encode(text) {
  return encodeURI("" + text).replace(ENC_PIPE_RE, "|");
}
function encodeQueryValue(input) {
  return encode(typeof input === "string" ? input : JSON.stringify(input)).replace(PLUS_RE, "%2B").replace(ENC_SPACE_RE, "+").replace(HASH_RE, "%23").replace(AMPERSAND_RE, "%26").replace(ENC_BACKTICK_RE, "`").replace(ENC_CARET_RE, "^");
}
function encodeQueryKey(text) {
  return encodeQueryValue(text).replace(EQUAL_RE, "%3D");
}
function decode(text = "") {
  try {
    return decodeURIComponent("" + text);
  } catch {
    return "" + text;
  }
}
function decodePath(text) {
  return decode(text.replace(ENC_SLASH_RE, "%252F"));
}
function decodeQueryKey(text) {
  return decode(text.replace(PLUS_RE, " "));
}
function decodeQueryValue(text) {
  return decode(text.replace(PLUS_RE, " "));
}

function parseQuery(parametersString = "") {
  const object = {};
  if (parametersString[0] === "?") {
    parametersString = parametersString.slice(1);
  }
  for (const parameter of parametersString.split("&")) {
    const s = parameter.match(/([^=]+)=?(.*)/) || [];
    if (s.length < 2) {
      continue;
    }
    const key = decodeQueryKey(s[1]);
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const value = decodeQueryValue(s[2] || "");
    if (object[key] === void 0) {
      object[key] = value;
    } else if (Array.isArray(object[key])) {
      object[key].push(value);
    } else {
      object[key] = [object[key], value];
    }
  }
  return object;
}
function encodeQueryItem(key, value) {
  if (typeof value === "number" || typeof value === "boolean") {
    value = String(value);
  }
  if (!value) {
    return encodeQueryKey(key);
  }
  if (Array.isArray(value)) {
    return value.map((_value) => `${encodeQueryKey(key)}=${encodeQueryValue(_value)}`).join("&");
  }
  return `${encodeQueryKey(key)}=${encodeQueryValue(value)}`;
}
function stringifyQuery(query) {
  return Object.keys(query).filter((k) => query[k] !== void 0).map((k) => encodeQueryItem(k, query[k])).filter(Boolean).join("&");
}
const PROTOCOL_STRICT_REGEX = /^[\s\w\0+.-]{2,}:([/\\]{1,2})/;
const PROTOCOL_REGEX = /^[\s\w\0+.-]{2,}:([/\\]{2})?/;
const PROTOCOL_RELATIVE_REGEX = /^([/\\]\s*){2,}[^/\\]/;
function hasProtocol(inputString, opts = {}) {
  if (typeof opts === "boolean") {
    opts = { acceptRelative: opts };
  }
  if (opts.strict) {
    return PROTOCOL_STRICT_REGEX.test(inputString);
  }
  return PROTOCOL_REGEX.test(inputString) || (opts.acceptRelative ? PROTOCOL_RELATIVE_REGEX.test(inputString) : false);
}
const TRAILING_SLASH_RE = /\/$|\/\?|\/#/;
function hasTrailingSlash(input = "", respectQueryAndFragment) {
  if (!respectQueryAndFragment) {
    return input.endsWith("/");
  }
  return TRAILING_SLASH_RE.test(input);
}
function withoutTrailingSlash(input = "", respectQueryAndFragment) {
  if (!respectQueryAndFragment) {
    return (hasTrailingSlash(input) ? input.slice(0, -1) : input) || "/";
  }
  if (!hasTrailingSlash(input, true)) {
    return input || "/";
  }
  let path = input;
  let fragment = "";
  const fragmentIndex = input.indexOf("#");
  if (fragmentIndex >= 0) {
    path = input.slice(0, fragmentIndex);
    fragment = input.slice(fragmentIndex);
  }
  const [s0, ...s] = path.split("?");
  return (s0.slice(0, -1) || "/") + (s.length > 0 ? `?${s.join("?")}` : "") + fragment;
}
function withTrailingSlash(input = "", respectQueryAndFragment) {
  if (!respectQueryAndFragment) {
    return input.endsWith("/") ? input : input + "/";
  }
  if (hasTrailingSlash(input, true)) {
    return input || "/";
  }
  let path = input;
  let fragment = "";
  const fragmentIndex = input.indexOf("#");
  if (fragmentIndex >= 0) {
    path = input.slice(0, fragmentIndex);
    fragment = input.slice(fragmentIndex);
    if (!path) {
      return fragment;
    }
  }
  const [s0, ...s] = path.split("?");
  return s0 + "/" + (s.length > 0 ? `?${s.join("?")}` : "") + fragment;
}
function hasLeadingSlash(input = "") {
  return input.startsWith("/");
}
function withLeadingSlash(input = "") {
  return hasLeadingSlash(input) ? input : "/" + input;
}
function withBase(input, base) {
  if (isEmptyURL(base) || hasProtocol(input)) {
    return input;
  }
  const _base = withoutTrailingSlash(base);
  if (input.startsWith(_base)) {
    return input;
  }
  return joinURL(_base, input);
}
function withoutBase(input, base) {
  if (isEmptyURL(base)) {
    return input;
  }
  const _base = withoutTrailingSlash(base);
  if (!input.startsWith(_base)) {
    return input;
  }
  const trimmed = input.slice(_base.length);
  return trimmed[0] === "/" ? trimmed : "/" + trimmed;
}
function withQuery(input, query) {
  const parsed = parseURL(input);
  const mergedQuery = { ...parseQuery(parsed.search), ...query };
  parsed.search = stringifyQuery(mergedQuery);
  return stringifyParsedURL(parsed);
}
function getQuery$1(input) {
  return parseQuery(parseURL(input).search);
}
function isEmptyURL(url) {
  return !url || url === "/";
}
function isNonEmptyURL(url) {
  return url && url !== "/";
}
const JOIN_LEADING_SLASH_RE = /^\.?\//;
function joinURL(base, ...input) {
  let url = base || "";
  for (const segment of input.filter((url2) => isNonEmptyURL(url2))) {
    if (url) {
      const _segment = segment.replace(JOIN_LEADING_SLASH_RE, "");
      url = withTrailingSlash(url) + _segment;
    } else {
      url = segment;
    }
  }
  return url;
}

function parseURL(input = "", defaultProto) {
  const _specialProtoMatch = input.match(
    /^[\s\0]*(blob:|data:|javascript:|vbscript:)(.*)/i
  );
  if (_specialProtoMatch) {
    const [, _proto, _pathname = ""] = _specialProtoMatch;
    return {
      protocol: _proto.toLowerCase(),
      pathname: _pathname,
      href: _proto + _pathname,
      auth: "",
      host: "",
      search: "",
      hash: ""
    };
  }
  if (!hasProtocol(input, { acceptRelative: true })) {
    return defaultProto ? parseURL(defaultProto + input) : parsePath(input);
  }
  const [, protocol = "", auth, hostAndPath = ""] = input.replace(/\\/g, "/").match(/^[\s\0]*([\w+.-]{2,}:)?\/\/([^/@]+@)?(.*)/) || [];
  const [, host = "", path = ""] = hostAndPath.match(/([^#/?]*)(.*)?/) || [];
  const { pathname, search, hash } = parsePath(
    path.replace(/\/(?=[A-Za-z]:)/, "")
  );
  return {
    protocol: protocol.toLowerCase(),
    auth: auth ? auth.slice(0, Math.max(0, auth.length - 1)) : "",
    host,
    pathname,
    search,
    hash
  };
}
function parsePath(input = "") {
  const [pathname = "", search = "", hash = ""] = (input.match(/([^#?]*)(\?[^#]*)?(#.*)?/) || []).splice(1);
  return {
    pathname,
    search,
    hash
  };
}
function stringifyParsedURL(parsed) {
  const pathname = parsed.pathname || "";
  const search = parsed.search ? (parsed.search.startsWith("?") ? "" : "?") + parsed.search : "";
  const hash = parsed.hash || "";
  const auth = parsed.auth ? parsed.auth + "@" : "";
  const host = parsed.host || "";
  const proto = parsed.protocol ? parsed.protocol + "//" : "";
  return proto + auth + host + pathname + search + hash;
}

const defaults = Object.freeze({
  ignoreUnknown: false,
  respectType: false,
  respectFunctionNames: false,
  respectFunctionProperties: false,
  unorderedObjects: true,
  unorderedArrays: false,
  unorderedSets: false,
  excludeKeys: void 0,
  excludeValues: void 0,
  replacer: void 0
});
function objectHash(object, options) {
  if (options) {
    options = { ...defaults, ...options };
  } else {
    options = defaults;
  }
  const hasher = createHasher(options);
  hasher.dispatch(object);
  return hasher.toString();
}
const defaultPrototypesKeys = Object.freeze([
  "prototype",
  "__proto__",
  "constructor"
]);
function createHasher(options) {
  let buff = "";
  let context = /* @__PURE__ */ new Map();
  const write = (str) => {
    buff += str;
  };
  return {
    toString() {
      return buff;
    },
    getContext() {
      return context;
    },
    dispatch(value) {
      if (options.replacer) {
        value = options.replacer(value);
      }
      const type = value === null ? "null" : typeof value;
      return this[type](value);
    },
    object(object) {
      if (object && typeof object.toJSON === "function") {
        return this.object(object.toJSON());
      }
      const objString = Object.prototype.toString.call(object);
      let objType = "";
      const objectLength = objString.length;
      if (objectLength < 10) {
        objType = "unknown:[" + objString + "]";
      } else {
        objType = objString.slice(8, objectLength - 1);
      }
      objType = objType.toLowerCase();
      let objectNumber = null;
      if ((objectNumber = context.get(object)) === void 0) {
        context.set(object, context.size);
      } else {
        return this.dispatch("[CIRCULAR:" + objectNumber + "]");
      }
      if (typeof Buffer !== "undefined" && Buffer.isBuffer && Buffer.isBuffer(object)) {
        write("buffer:");
        return write(object.toString("utf8"));
      }
      if (objType !== "object" && objType !== "function" && objType !== "asyncfunction") {
        if (this[objType]) {
          this[objType](object);
        } else if (!options.ignoreUnknown) {
          this.unkown(object, objType);
        }
      } else {
        let keys = Object.keys(object);
        if (options.unorderedObjects) {
          keys = keys.sort();
        }
        let extraKeys = [];
        if (options.respectType !== false && !isNativeFunction(object)) {
          extraKeys = defaultPrototypesKeys;
        }
        if (options.excludeKeys) {
          keys = keys.filter((key) => {
            return !options.excludeKeys(key);
          });
          extraKeys = extraKeys.filter((key) => {
            return !options.excludeKeys(key);
          });
        }
        write("object:" + (keys.length + extraKeys.length) + ":");
        const dispatchForKey = (key) => {
          this.dispatch(key);
          write(":");
          if (!options.excludeValues) {
            this.dispatch(object[key]);
          }
          write(",");
        };
        for (const key of keys) {
          dispatchForKey(key);
        }
        for (const key of extraKeys) {
          dispatchForKey(key);
        }
      }
    },
    array(arr, unordered) {
      unordered = unordered === void 0 ? options.unorderedArrays !== false : unordered;
      write("array:" + arr.length + ":");
      if (!unordered || arr.length <= 1) {
        for (const entry of arr) {
          this.dispatch(entry);
        }
        return;
      }
      const contextAdditions = /* @__PURE__ */ new Map();
      const entries = arr.map((entry) => {
        const hasher = createHasher(options);
        hasher.dispatch(entry);
        for (const [key, value] of hasher.getContext()) {
          contextAdditions.set(key, value);
        }
        return hasher.toString();
      });
      context = contextAdditions;
      entries.sort();
      return this.array(entries, false);
    },
    date(date) {
      return write("date:" + date.toJSON());
    },
    symbol(sym) {
      return write("symbol:" + sym.toString());
    },
    unkown(value, type) {
      write(type);
      if (!value) {
        return;
      }
      write(":");
      if (value && typeof value.entries === "function") {
        return this.array(
          Array.from(value.entries()),
          true
          /* ordered */
        );
      }
    },
    error(err) {
      return write("error:" + err.toString());
    },
    boolean(bool) {
      return write("bool:" + bool);
    },
    string(string) {
      write("string:" + string.length + ":");
      write(string);
    },
    function(fn) {
      write("fn:");
      if (isNativeFunction(fn)) {
        this.dispatch("[native]");
      } else {
        this.dispatch(fn.toString());
      }
      if (options.respectFunctionNames !== false) {
        this.dispatch("function-name:" + String(fn.name));
      }
      if (options.respectFunctionProperties) {
        this.object(fn);
      }
    },
    number(number) {
      return write("number:" + number);
    },
    xml(xml) {
      return write("xml:" + xml.toString());
    },
    null() {
      return write("Null");
    },
    undefined() {
      return write("Undefined");
    },
    regexp(regex) {
      return write("regex:" + regex.toString());
    },
    uint8array(arr) {
      write("uint8array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    uint8clampedarray(arr) {
      write("uint8clampedarray:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    int8array(arr) {
      write("int8array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    uint16array(arr) {
      write("uint16array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    int16array(arr) {
      write("int16array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    uint32array(arr) {
      write("uint32array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    int32array(arr) {
      write("int32array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    float32array(arr) {
      write("float32array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    float64array(arr) {
      write("float64array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    arraybuffer(arr) {
      write("arraybuffer:");
      return this.dispatch(new Uint8Array(arr));
    },
    url(url) {
      return write("url:" + url.toString());
    },
    map(map) {
      write("map:");
      const arr = [...map];
      return this.array(arr, options.unorderedSets !== false);
    },
    set(set) {
      write("set:");
      const arr = [...set];
      return this.array(arr, options.unorderedSets !== false);
    },
    file(file) {
      write("file:");
      return this.dispatch([file.name, file.size, file.type, file.lastModfied]);
    },
    blob() {
      if (options.ignoreUnknown) {
        return write("[blob]");
      }
      throw new Error(
        'Hashing Blob objects is currently not supported\nUse "options.replacer" or "options.ignoreUnknown"\n'
      );
    },
    domwindow() {
      return write("domwindow");
    },
    bigint(number) {
      return write("bigint:" + number.toString());
    },
    /* Node.js standard native objects */
    process() {
      return write("process");
    },
    timer() {
      return write("timer");
    },
    pipe() {
      return write("pipe");
    },
    tcp() {
      return write("tcp");
    },
    udp() {
      return write("udp");
    },
    tty() {
      return write("tty");
    },
    statwatcher() {
      return write("statwatcher");
    },
    securecontext() {
      return write("securecontext");
    },
    connection() {
      return write("connection");
    },
    zlib() {
      return write("zlib");
    },
    context() {
      return write("context");
    },
    nodescript() {
      return write("nodescript");
    },
    httpparser() {
      return write("httpparser");
    },
    dataview() {
      return write("dataview");
    },
    signal() {
      return write("signal");
    },
    fsevent() {
      return write("fsevent");
    },
    tlswrap() {
      return write("tlswrap");
    }
  };
}
const nativeFunc = "[native code] }";
const nativeFuncLength = nativeFunc.length;
function isNativeFunction(f) {
  if (typeof f !== "function") {
    return false;
  }
  return Function.prototype.toString.call(f).slice(-nativeFuncLength) === nativeFunc;
}

class WordArray {
  constructor(words, sigBytes) {
    words = this.words = words || [];
    this.sigBytes = sigBytes === void 0 ? words.length * 4 : sigBytes;
  }
  toString(encoder) {
    return (encoder || Hex).stringify(this);
  }
  concat(wordArray) {
    this.clamp();
    if (this.sigBytes % 4) {
      for (let i = 0; i < wordArray.sigBytes; i++) {
        const thatByte = wordArray.words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
        this.words[this.sigBytes + i >>> 2] |= thatByte << 24 - (this.sigBytes + i) % 4 * 8;
      }
    } else {
      for (let j = 0; j < wordArray.sigBytes; j += 4) {
        this.words[this.sigBytes + j >>> 2] = wordArray.words[j >>> 2];
      }
    }
    this.sigBytes += wordArray.sigBytes;
    return this;
  }
  clamp() {
    this.words[this.sigBytes >>> 2] &= 4294967295 << 32 - this.sigBytes % 4 * 8;
    this.words.length = Math.ceil(this.sigBytes / 4);
  }
  clone() {
    return new WordArray([...this.words]);
  }
}
const Hex = {
  stringify(wordArray) {
    const hexChars = [];
    for (let i = 0; i < wordArray.sigBytes; i++) {
      const bite = wordArray.words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
      hexChars.push((bite >>> 4).toString(16), (bite & 15).toString(16));
    }
    return hexChars.join("");
  }
};
const Base64 = {
  stringify(wordArray) {
    const keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const base64Chars = [];
    for (let i = 0; i < wordArray.sigBytes; i += 3) {
      const byte1 = wordArray.words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
      const byte2 = wordArray.words[i + 1 >>> 2] >>> 24 - (i + 1) % 4 * 8 & 255;
      const byte3 = wordArray.words[i + 2 >>> 2] >>> 24 - (i + 2) % 4 * 8 & 255;
      const triplet = byte1 << 16 | byte2 << 8 | byte3;
      for (let j = 0; j < 4 && i * 8 + j * 6 < wordArray.sigBytes * 8; j++) {
        base64Chars.push(keyStr.charAt(triplet >>> 6 * (3 - j) & 63));
      }
    }
    return base64Chars.join("");
  }
};
const Latin1 = {
  parse(latin1Str) {
    const latin1StrLength = latin1Str.length;
    const words = [];
    for (let i = 0; i < latin1StrLength; i++) {
      words[i >>> 2] |= (latin1Str.charCodeAt(i) & 255) << 24 - i % 4 * 8;
    }
    return new WordArray(words, latin1StrLength);
  }
};
const Utf8 = {
  parse(utf8Str) {
    return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
  }
};
class BufferedBlockAlgorithm {
  constructor() {
    this._data = new WordArray();
    this._nDataBytes = 0;
    this._minBufferSize = 0;
    this.blockSize = 512 / 32;
  }
  reset() {
    this._data = new WordArray();
    this._nDataBytes = 0;
  }
  _append(data) {
    if (typeof data === "string") {
      data = Utf8.parse(data);
    }
    this._data.concat(data);
    this._nDataBytes += data.sigBytes;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _doProcessBlock(_dataWords, _offset) {
  }
  _process(doFlush) {
    let processedWords;
    let nBlocksReady = this._data.sigBytes / (this.blockSize * 4);
    if (doFlush) {
      nBlocksReady = Math.ceil(nBlocksReady);
    } else {
      nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
    }
    const nWordsReady = nBlocksReady * this.blockSize;
    const nBytesReady = Math.min(nWordsReady * 4, this._data.sigBytes);
    if (nWordsReady) {
      for (let offset = 0; offset < nWordsReady; offset += this.blockSize) {
        this._doProcessBlock(this._data.words, offset);
      }
      processedWords = this._data.words.splice(0, nWordsReady);
      this._data.sigBytes -= nBytesReady;
    }
    return new WordArray(processedWords, nBytesReady);
  }
}
class Hasher extends BufferedBlockAlgorithm {
  update(messageUpdate) {
    this._append(messageUpdate);
    this._process();
    return this;
  }
  finalize(messageUpdate) {
    if (messageUpdate) {
      this._append(messageUpdate);
    }
  }
}

const H = [
  1779033703,
  -1150833019,
  1013904242,
  -1521486534,
  1359893119,
  -1694144372,
  528734635,
  1541459225
];
const K = [
  1116352408,
  1899447441,
  -1245643825,
  -373957723,
  961987163,
  1508970993,
  -1841331548,
  -1424204075,
  -670586216,
  310598401,
  607225278,
  1426881987,
  1925078388,
  -2132889090,
  -1680079193,
  -1046744716,
  -459576895,
  -272742522,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  -1740746414,
  -1473132947,
  -1341970488,
  -1084653625,
  -958395405,
  -710438585,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  -2117940946,
  -1838011259,
  -1564481375,
  -1474664885,
  -1035236496,
  -949202525,
  -778901479,
  -694614492,
  -200395387,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  -2067236844,
  -1933114872,
  -1866530822,
  -1538233109,
  -1090935817,
  -965641998
];
const W = [];
class SHA256 extends Hasher {
  constructor() {
    super(...arguments);
    this._hash = new WordArray([...H]);
  }
  reset() {
    super.reset();
    this._hash = new WordArray([...H]);
  }
  _doProcessBlock(M, offset) {
    const H2 = this._hash.words;
    let a = H2[0];
    let b = H2[1];
    let c = H2[2];
    let d = H2[3];
    let e = H2[4];
    let f = H2[5];
    let g = H2[6];
    let h = H2[7];
    for (let i = 0; i < 64; i++) {
      if (i < 16) {
        W[i] = M[offset + i] | 0;
      } else {
        const gamma0x = W[i - 15];
        const gamma0 = (gamma0x << 25 | gamma0x >>> 7) ^ (gamma0x << 14 | gamma0x >>> 18) ^ gamma0x >>> 3;
        const gamma1x = W[i - 2];
        const gamma1 = (gamma1x << 15 | gamma1x >>> 17) ^ (gamma1x << 13 | gamma1x >>> 19) ^ gamma1x >>> 10;
        W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16];
      }
      const ch = e & f ^ ~e & g;
      const maj = a & b ^ a & c ^ b & c;
      const sigma0 = (a << 30 | a >>> 2) ^ (a << 19 | a >>> 13) ^ (a << 10 | a >>> 22);
      const sigma1 = (e << 26 | e >>> 6) ^ (e << 21 | e >>> 11) ^ (e << 7 | e >>> 25);
      const t1 = h + sigma1 + ch + K[i] + W[i];
      const t2 = sigma0 + maj;
      h = g;
      g = f;
      f = e;
      e = d + t1 | 0;
      d = c;
      c = b;
      b = a;
      a = t1 + t2 | 0;
    }
    H2[0] = H2[0] + a | 0;
    H2[1] = H2[1] + b | 0;
    H2[2] = H2[2] + c | 0;
    H2[3] = H2[3] + d | 0;
    H2[4] = H2[4] + e | 0;
    H2[5] = H2[5] + f | 0;
    H2[6] = H2[6] + g | 0;
    H2[7] = H2[7] + h | 0;
  }
  finalize(messageUpdate) {
    super.finalize(messageUpdate);
    const nBitsTotal = this._nDataBytes * 8;
    const nBitsLeft = this._data.sigBytes * 8;
    this._data.words[nBitsLeft >>> 5] |= 128 << 24 - nBitsLeft % 32;
    this._data.words[(nBitsLeft + 64 >>> 9 << 4) + 14] = Math.floor(
      nBitsTotal / 4294967296
    );
    this._data.words[(nBitsLeft + 64 >>> 9 << 4) + 15] = nBitsTotal;
    this._data.sigBytes = this._data.words.length * 4;
    this._process();
    return this._hash;
  }
}
function sha256base64(message) {
  return new SHA256().finalize(message).toString(Base64);
}

function hash(object, options = {}) {
  const hashed = typeof object === "string" ? object : objectHash(object, options);
  return sha256base64(hashed).slice(0, 10);
}

const NODE_TYPES = {
  NORMAL: 0,
  WILDCARD: 1,
  PLACEHOLDER: 2
};

function createRouter$1(options = {}) {
  const ctx = {
    options,
    rootNode: createRadixNode(),
    staticRoutesMap: {}
  };
  const normalizeTrailingSlash = (p) => options.strictTrailingSlash ? p : p.replace(/\/$/, "") || "/";
  if (options.routes) {
    for (const path in options.routes) {
      insert(ctx, normalizeTrailingSlash(path), options.routes[path]);
    }
  }
  return {
    ctx,
    // @ts-ignore
    lookup: (path) => lookup(ctx, normalizeTrailingSlash(path)),
    insert: (path, data) => insert(ctx, normalizeTrailingSlash(path), data),
    remove: (path) => remove(ctx, normalizeTrailingSlash(path))
  };
}
function lookup(ctx, path) {
  const staticPathNode = ctx.staticRoutesMap[path];
  if (staticPathNode) {
    return staticPathNode.data;
  }
  const sections = path.split("/");
  const params = {};
  let paramsFound = false;
  let wildcardNode = null;
  let node = ctx.rootNode;
  let wildCardParam = null;
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    if (node.wildcardChildNode !== null) {
      wildcardNode = node.wildcardChildNode;
      wildCardParam = sections.slice(i).join("/");
    }
    const nextNode = node.children.get(section);
    if (nextNode !== void 0) {
      node = nextNode;
    } else {
      node = node.placeholderChildNode;
      if (node !== null) {
        params[node.paramName] = section;
        paramsFound = true;
      } else {
        break;
      }
    }
  }
  if ((node === null || node.data === null) && wildcardNode !== null) {
    node = wildcardNode;
    params[node.paramName || "_"] = wildCardParam;
    paramsFound = true;
  }
  if (!node) {
    return null;
  }
  if (paramsFound) {
    return {
      ...node.data,
      params: paramsFound ? params : void 0
    };
  }
  return node.data;
}
function insert(ctx, path, data) {
  let isStaticRoute = true;
  const sections = path.split("/");
  let node = ctx.rootNode;
  let _unnamedPlaceholderCtr = 0;
  for (const section of sections) {
    let childNode;
    if (childNode = node.children.get(section)) {
      node = childNode;
    } else {
      const type = getNodeType(section);
      childNode = createRadixNode({ type, parent: node });
      node.children.set(section, childNode);
      if (type === NODE_TYPES.PLACEHOLDER) {
        childNode.paramName = section === "*" ? `_${_unnamedPlaceholderCtr++}` : section.slice(1);
        node.placeholderChildNode = childNode;
        isStaticRoute = false;
      } else if (type === NODE_TYPES.WILDCARD) {
        node.wildcardChildNode = childNode;
        childNode.paramName = section.slice(
          3
          /* "**:" */
        ) || "_";
        isStaticRoute = false;
      }
      node = childNode;
    }
  }
  node.data = data;
  if (isStaticRoute === true) {
    ctx.staticRoutesMap[path] = node;
  }
  return node;
}
function remove(ctx, path) {
  let success = false;
  const sections = path.split("/");
  let node = ctx.rootNode;
  for (const section of sections) {
    node = node.children.get(section);
    if (!node) {
      return success;
    }
  }
  if (node.data) {
    const lastSection = sections[sections.length - 1];
    node.data = null;
    if (Object.keys(node.children).length === 0) {
      const parentNode = node.parent;
      parentNode.children.delete(lastSection);
      parentNode.wildcardChildNode = null;
      parentNode.placeholderChildNode = null;
    }
    success = true;
  }
  return success;
}
function createRadixNode(options = {}) {
  return {
    type: options.type || NODE_TYPES.NORMAL,
    parent: options.parent || null,
    children: /* @__PURE__ */ new Map(),
    data: options.data || null,
    paramName: options.paramName || null,
    wildcardChildNode: null,
    placeholderChildNode: null
  };
}
function getNodeType(str) {
  if (str.startsWith("**")) {
    return NODE_TYPES.WILDCARD;
  }
  if (str[0] === ":" || str === "*") {
    return NODE_TYPES.PLACEHOLDER;
  }
  return NODE_TYPES.NORMAL;
}

function toRouteMatcher(router) {
  const table = _routerNodeToTable("", router.ctx.rootNode);
  return _createMatcher(table);
}
function _createMatcher(table) {
  return {
    ctx: { table },
    matchAll: (path) => _matchRoutes(path, table)
  };
}
function _createRouteTable() {
  return {
    static: /* @__PURE__ */ new Map(),
    wildcard: /* @__PURE__ */ new Map(),
    dynamic: /* @__PURE__ */ new Map()
  };
}
function _matchRoutes(path, table) {
  const matches = [];
  for (const [key, value] of _sortRoutesMap(table.wildcard)) {
    if (path.startsWith(key)) {
      matches.push(value);
    }
  }
  for (const [key, value] of _sortRoutesMap(table.dynamic)) {
    if (path.startsWith(key + "/")) {
      const subPath = "/" + path.slice(key.length).split("/").splice(2).join("/");
      matches.push(..._matchRoutes(subPath, value));
    }
  }
  const staticMatch = table.static.get(path);
  if (staticMatch) {
    matches.push(staticMatch);
  }
  return matches.filter(Boolean);
}
function _sortRoutesMap(m) {
  return [...m.entries()].sort((a, b) => a[0].length - b[0].length);
}
function _routerNodeToTable(initialPath, initialNode) {
  const table = _createRouteTable();
  function _addNode(path, node) {
    if (path) {
      if (node.type === NODE_TYPES.NORMAL && !(path.includes("*") || path.includes(":"))) {
        table.static.set(path, node.data);
      } else if (node.type === NODE_TYPES.WILDCARD) {
        table.wildcard.set(path.replace("/**", ""), node.data);
      } else if (node.type === NODE_TYPES.PLACEHOLDER) {
        const subTable = _routerNodeToTable("", node);
        if (node.data) {
          subTable.static.set("/", node.data);
        }
        table.dynamic.set(path.replace(/\/\*|\/:\w+/, ""), subTable);
        return;
      }
    }
    for (const [childPath, child] of node.children.entries()) {
      _addNode(`${path}/${childPath}`.replace("//", "/"), child);
    }
  }
  _addNode(initialPath, initialNode);
  return table;
}

function isPlainObject(value) {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== null && prototype !== Object.prototype && Object.getPrototypeOf(prototype) !== null) {
    return false;
  }
  if (Symbol.iterator in value) {
    return false;
  }
  if (Symbol.toStringTag in value) {
    return Object.prototype.toString.call(value) === "[object Module]";
  }
  return true;
}

function _defu(baseObject, defaults, namespace = ".", merger) {
  if (!isPlainObject(defaults)) {
    return _defu(baseObject, {}, namespace, merger);
  }
  const object = Object.assign({}, defaults);
  for (const key in baseObject) {
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const value = baseObject[key];
    if (value === null || value === void 0) {
      continue;
    }
    if (merger && merger(object, key, value, namespace)) {
      continue;
    }
    if (Array.isArray(value) && Array.isArray(object[key])) {
      object[key] = [...value, ...object[key]];
    } else if (isPlainObject(value) && isPlainObject(object[key])) {
      object[key] = _defu(
        value,
        object[key],
        (namespace ? `${namespace}.` : "") + key.toString(),
        merger
      );
    } else {
      object[key] = value;
    }
  }
  return object;
}
function createDefu(merger) {
  return (...arguments_) => (
    // eslint-disable-next-line unicorn/no-array-reduce
    arguments_.reduce((p, c) => _defu(p, c, "", merger), {})
  );
}
const defu = createDefu();
const defuFn = createDefu((object, key, currentValue) => {
  if (object[key] !== void 0 && typeof currentValue === "function") {
    object[key] = currentValue(object[key]);
    return true;
  }
});

function rawHeaders(headers) {
  const rawHeaders2 = [];
  for (const key in headers) {
    if (Array.isArray(headers[key])) {
      for (const h of headers[key]) {
        rawHeaders2.push(key, h);
      }
    } else {
      rawHeaders2.push(key, headers[key]);
    }
  }
  return rawHeaders2;
}
function mergeFns(...functions) {
  return function(...args) {
    for (const fn of functions) {
      fn(...args);
    }
  };
}
function createNotImplementedError(name) {
  throw new Error(`[unenv] ${name} is not implemented yet!`);
}

let defaultMaxListeners = 10;
let EventEmitter$1 = class EventEmitter {
  __unenv__ = true;
  _events = /* @__PURE__ */ Object.create(null);
  _maxListeners;
  static get defaultMaxListeners() {
    return defaultMaxListeners;
  }
  static set defaultMaxListeners(arg) {
    if (typeof arg !== "number" || arg < 0 || Number.isNaN(arg)) {
      throw new RangeError(
        'The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + "."
      );
    }
    defaultMaxListeners = arg;
  }
  setMaxListeners(n) {
    if (typeof n !== "number" || n < 0 || Number.isNaN(n)) {
      throw new RangeError(
        'The value of "n" is out of range. It must be a non-negative number. Received ' + n + "."
      );
    }
    this._maxListeners = n;
    return this;
  }
  getMaxListeners() {
    return _getMaxListeners(this);
  }
  emit(type, ...args) {
    if (!this._events[type] || this._events[type].length === 0) {
      return false;
    }
    if (type === "error") {
      let er;
      if (args.length > 0) {
        er = args[0];
      }
      if (er instanceof Error) {
        throw er;
      }
      const err = new Error(
        "Unhandled error." + (er ? " (" + er.message + ")" : "")
      );
      err.context = er;
      throw err;
    }
    for (const _listener of this._events[type]) {
      (_listener.listener || _listener).apply(this, args);
    }
    return true;
  }
  addListener(type, listener) {
    return _addListener(this, type, listener, false);
  }
  on(type, listener) {
    return _addListener(this, type, listener, false);
  }
  prependListener(type, listener) {
    return _addListener(this, type, listener, true);
  }
  once(type, listener) {
    return this.on(type, _wrapOnce(this, type, listener));
  }
  prependOnceListener(type, listener) {
    return this.prependListener(type, _wrapOnce(this, type, listener));
  }
  removeListener(type, listener) {
    return _removeListener(this, type, listener);
  }
  off(type, listener) {
    return this.removeListener(type, listener);
  }
  removeAllListeners(type) {
    return _removeAllListeners(this, type);
  }
  listeners(type) {
    return _listeners(this, type, true);
  }
  rawListeners(type) {
    return _listeners(this, type, false);
  }
  listenerCount(type) {
    return this.rawListeners(type).length;
  }
  eventNames() {
    return Object.keys(this._events);
  }
};
function _addListener(target, type, listener, prepend) {
  _checkListener(listener);
  if (target._events.newListener !== void 0) {
    target.emit("newListener", type, listener.listener || listener);
  }
  if (!target._events[type]) {
    target._events[type] = [];
  }
  if (prepend) {
    target._events[type].unshift(listener);
  } else {
    target._events[type].push(listener);
  }
  const maxListeners = _getMaxListeners(target);
  if (maxListeners > 0 && target._events[type].length > maxListeners && !target._events[type].warned) {
    target._events[type].warned = true;
    const warning = new Error(
      `[unenv] Possible EventEmitter memory leak detected. ${target._events[type].length} ${type} listeners added. Use emitter.setMaxListeners() to increase limit`
    );
    warning.name = "MaxListenersExceededWarning";
    warning.emitter = target;
    warning.type = type;
    warning.count = target._events[type]?.length;
    console.warn(warning);
  }
  return target;
}
function _removeListener(target, type, listener) {
  _checkListener(listener);
  if (!target._events[type] || target._events[type].length === 0) {
    return target;
  }
  const lenBeforeFilter = target._events[type].length;
  target._events[type] = target._events[type].filter((fn) => fn !== listener);
  if (lenBeforeFilter === target._events[type].length) {
    return target;
  }
  if (target._events.removeListener) {
    target.emit("removeListener", type, listener.listener || listener);
  }
  if (target._events[type].length === 0) {
    delete target._events[type];
  }
  return target;
}
function _removeAllListeners(target, type) {
  if (!target._events[type] || target._events[type].length === 0) {
    return target;
  }
  if (target._events.removeListener) {
    for (const _listener of target._events[type]) {
      target.emit("removeListener", type, _listener.listener || _listener);
    }
  }
  delete target._events[type];
  return target;
}
function _wrapOnce(target, type, listener) {
  let fired = false;
  const wrapper = (...args) => {
    if (fired) {
      return;
    }
    target.removeListener(type, wrapper);
    fired = true;
    return args.length === 0 ? listener.call(target) : listener.apply(target, args);
  };
  wrapper.listener = listener;
  return wrapper;
}
function _getMaxListeners(target) {
  return target._maxListeners ?? EventEmitter$1.defaultMaxListeners;
}
function _listeners(target, type, unwrap) {
  let listeners = target._events[type];
  if (typeof listeners === "function") {
    listeners = [listeners];
  }
  return unwrap ? listeners.map((l) => l.listener || l) : listeners;
}
function _checkListener(listener) {
  if (typeof listener !== "function") {
    throw new TypeError(
      'The "listener" argument must be of type Function. Received type ' + typeof listener
    );
  }
}

const EventEmitter = globalThis.EventEmitter || EventEmitter$1;

class _Readable extends EventEmitter {
  __unenv__ = true;
  readableEncoding = null;
  readableEnded = true;
  readableFlowing = false;
  readableHighWaterMark = 0;
  readableLength = 0;
  readableObjectMode = false;
  readableAborted = false;
  readableDidRead = false;
  closed = false;
  errored = null;
  readable = false;
  destroyed = false;
  static from(_iterable, options) {
    return new _Readable(options);
  }
  constructor(_opts) {
    super();
  }
  _read(_size) {
  }
  read(_size) {
  }
  setEncoding(_encoding) {
    return this;
  }
  pause() {
    return this;
  }
  resume() {
    return this;
  }
  isPaused() {
    return true;
  }
  unpipe(_destination) {
    return this;
  }
  unshift(_chunk, _encoding) {
  }
  wrap(_oldStream) {
    return this;
  }
  push(_chunk, _encoding) {
    return false;
  }
  _destroy(_error, _callback) {
    this.removeAllListeners();
  }
  destroy(error) {
    this.destroyed = true;
    this._destroy(error);
    return this;
  }
  pipe(_destenition, _options) {
    return {};
  }
  compose(stream, options) {
    throw new Error("[unenv] Method not implemented.");
  }
  [Symbol.asyncDispose]() {
    this.destroy();
    return Promise.resolve();
  }
  async *[Symbol.asyncIterator]() {
    throw createNotImplementedError("Readable.asyncIterator");
  }
  iterator(options) {
    throw createNotImplementedError("Readable.iterator");
  }
  map(fn, options) {
    throw createNotImplementedError("Readable.map");
  }
  filter(fn, options) {
    throw createNotImplementedError("Readable.filter");
  }
  forEach(fn, options) {
    throw createNotImplementedError("Readable.forEach");
  }
  reduce(fn, initialValue, options) {
    throw createNotImplementedError("Readable.reduce");
  }
  find(fn, options) {
    throw createNotImplementedError("Readable.find");
  }
  findIndex(fn, options) {
    throw createNotImplementedError("Readable.findIndex");
  }
  some(fn, options) {
    throw createNotImplementedError("Readable.some");
  }
  toArray(options) {
    throw createNotImplementedError("Readable.toArray");
  }
  every(fn, options) {
    throw createNotImplementedError("Readable.every");
  }
  flatMap(fn, options) {
    throw createNotImplementedError("Readable.flatMap");
  }
  drop(limit, options) {
    throw createNotImplementedError("Readable.drop");
  }
  take(limit, options) {
    throw createNotImplementedError("Readable.take");
  }
  asIndexedPairs(options) {
    throw createNotImplementedError("Readable.asIndexedPairs");
  }
}
const Readable = globalThis.Readable || _Readable;

class _Writable extends EventEmitter {
  __unenv__ = true;
  writable = true;
  writableEnded = false;
  writableFinished = false;
  writableHighWaterMark = 0;
  writableLength = 0;
  writableObjectMode = false;
  writableCorked = 0;
  closed = false;
  errored = null;
  writableNeedDrain = false;
  destroyed = false;
  _data;
  _encoding = "utf-8";
  constructor(_opts) {
    super();
  }
  pipe(_destenition, _options) {
    return {};
  }
  _write(chunk, encoding, callback) {
    if (this.writableEnded) {
      if (callback) {
        callback();
      }
      return;
    }
    if (this._data === void 0) {
      this._data = chunk;
    } else {
      const a = typeof this._data === "string" ? Buffer.from(this._data, this._encoding || encoding || "utf8") : this._data;
      const b = typeof chunk === "string" ? Buffer.from(chunk, encoding || this._encoding || "utf8") : chunk;
      this._data = Buffer.concat([a, b]);
    }
    this._encoding = encoding;
    if (callback) {
      callback();
    }
  }
  _writev(_chunks, _callback) {
  }
  _destroy(_error, _callback) {
  }
  _final(_callback) {
  }
  write(chunk, arg2, arg3) {
    const encoding = typeof arg2 === "string" ? this._encoding : "utf-8";
    const cb = typeof arg2 === "function" ? arg2 : typeof arg3 === "function" ? arg3 : void 0;
    this._write(chunk, encoding, cb);
    return true;
  }
  setDefaultEncoding(_encoding) {
    return this;
  }
  end(arg1, arg2, arg3) {
    const callback = typeof arg1 === "function" ? arg1 : typeof arg2 === "function" ? arg2 : typeof arg3 === "function" ? arg3 : void 0;
    if (this.writableEnded) {
      if (callback) {
        callback();
      }
      return this;
    }
    const data = arg1 === callback ? void 0 : arg1;
    if (data) {
      const encoding = arg2 === callback ? void 0 : arg2;
      this.write(data, encoding, callback);
    }
    this.writableEnded = true;
    this.writableFinished = true;
    this.emit("close");
    this.emit("finish");
    return this;
  }
  cork() {
  }
  uncork() {
  }
  destroy(_error) {
    this.destroyed = true;
    delete this._data;
    this.removeAllListeners();
    return this;
  }
  compose(stream, options) {
    throw new Error("[h3] Method not implemented.");
  }
}
const Writable = globalThis.Writable || _Writable;

const __Duplex = class {
  allowHalfOpen = true;
  _destroy;
  constructor(readable = new Readable(), writable = new Writable()) {
    Object.assign(this, readable);
    Object.assign(this, writable);
    this._destroy = mergeFns(readable._destroy, writable._destroy);
  }
};
function getDuplex() {
  Object.assign(__Duplex.prototype, Readable.prototype);
  Object.assign(__Duplex.prototype, Writable.prototype);
  return __Duplex;
}
const _Duplex = /* @__PURE__ */ getDuplex();
const Duplex = globalThis.Duplex || _Duplex;

class Socket extends Duplex {
  __unenv__ = true;
  bufferSize = 0;
  bytesRead = 0;
  bytesWritten = 0;
  connecting = false;
  destroyed = false;
  pending = false;
  localAddress = "";
  localPort = 0;
  remoteAddress = "";
  remoteFamily = "";
  remotePort = 0;
  autoSelectFamilyAttemptedAddresses = [];
  readyState = "readOnly";
  constructor(_options) {
    super();
  }
  write(_buffer, _arg1, _arg2) {
    return false;
  }
  connect(_arg1, _arg2, _arg3) {
    return this;
  }
  end(_arg1, _arg2, _arg3) {
    return this;
  }
  setEncoding(_encoding) {
    return this;
  }
  pause() {
    return this;
  }
  resume() {
    return this;
  }
  setTimeout(_timeout, _callback) {
    return this;
  }
  setNoDelay(_noDelay) {
    return this;
  }
  setKeepAlive(_enable, _initialDelay) {
    return this;
  }
  address() {
    return {};
  }
  unref() {
    return this;
  }
  ref() {
    return this;
  }
  destroySoon() {
    this.destroy();
  }
  resetAndDestroy() {
    const err = new Error("ERR_SOCKET_CLOSED");
    err.code = "ERR_SOCKET_CLOSED";
    this.destroy(err);
    return this;
  }
}

class IncomingMessage extends Readable {
  __unenv__ = {};
  aborted = false;
  httpVersion = "1.1";
  httpVersionMajor = 1;
  httpVersionMinor = 1;
  complete = true;
  connection;
  socket;
  headers = {};
  trailers = {};
  method = "GET";
  url = "/";
  statusCode = 200;
  statusMessage = "";
  closed = false;
  errored = null;
  readable = false;
  constructor(socket) {
    super();
    this.socket = this.connection = socket || new Socket();
  }
  get rawHeaders() {
    return rawHeaders(this.headers);
  }
  get rawTrailers() {
    return [];
  }
  setTimeout(_msecs, _callback) {
    return this;
  }
  get headersDistinct() {
    return _distinct(this.headers);
  }
  get trailersDistinct() {
    return _distinct(this.trailers);
  }
}
function _distinct(obj) {
  const d = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key) {
      d[key] = (Array.isArray(value) ? value : [value]).filter(
        Boolean
      );
    }
  }
  return d;
}

class ServerResponse extends Writable {
  __unenv__ = true;
  statusCode = 200;
  statusMessage = "";
  upgrading = false;
  chunkedEncoding = false;
  shouldKeepAlive = false;
  useChunkedEncodingByDefault = false;
  sendDate = false;
  finished = false;
  headersSent = false;
  strictContentLength = false;
  connection = null;
  socket = null;
  req;
  _headers = {};
  constructor(req) {
    super();
    this.req = req;
  }
  assignSocket(socket) {
    socket._httpMessage = this;
    this.socket = socket;
    this.connection = socket;
    this.emit("socket", socket);
    this._flush();
  }
  _flush() {
    this.flushHeaders();
  }
  detachSocket(_socket) {
  }
  writeContinue(_callback) {
  }
  writeHead(statusCode, arg1, arg2) {
    if (statusCode) {
      this.statusCode = statusCode;
    }
    if (typeof arg1 === "string") {
      this.statusMessage = arg1;
      arg1 = void 0;
    }
    const headers = arg2 || arg1;
    if (headers) {
      if (Array.isArray(headers)) ; else {
        for (const key in headers) {
          this.setHeader(key, headers[key]);
        }
      }
    }
    this.headersSent = true;
    return this;
  }
  writeProcessing() {
  }
  setTimeout(_msecs, _callback) {
    return this;
  }
  appendHeader(name, value) {
    name = name.toLowerCase();
    const current = this._headers[name];
    const all = [
      ...Array.isArray(current) ? current : [current],
      ...Array.isArray(value) ? value : [value]
    ].filter(Boolean);
    this._headers[name] = all.length > 1 ? all : all[0];
    return this;
  }
  setHeader(name, value) {
    this._headers[name.toLowerCase()] = value;
    return this;
  }
  getHeader(name) {
    return this._headers[name.toLowerCase()];
  }
  getHeaders() {
    return this._headers;
  }
  getHeaderNames() {
    return Object.keys(this._headers);
  }
  hasHeader(name) {
    return name.toLowerCase() in this._headers;
  }
  removeHeader(name) {
    delete this._headers[name.toLowerCase()];
  }
  addTrailers(_headers) {
  }
  flushHeaders() {
  }
  writeEarlyHints(_headers, cb) {
    if (typeof cb === "function") {
      cb();
    }
  }
}

function hasProp(obj, prop) {
  try {
    return prop in obj;
  } catch {
    return false;
  }
}

var __defProp$1 = Object.defineProperty;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$1 = (obj, key, value) => {
  __defNormalProp$1(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class H3Error extends Error {
  constructor(message, opts = {}) {
    super(message, opts);
    __publicField$1(this, "statusCode", 500);
    __publicField$1(this, "fatal", false);
    __publicField$1(this, "unhandled", false);
    __publicField$1(this, "statusMessage");
    __publicField$1(this, "data");
    __publicField$1(this, "cause");
    if (opts.cause && !this.cause) {
      this.cause = opts.cause;
    }
  }
  toJSON() {
    const obj = {
      message: this.message,
      statusCode: sanitizeStatusCode(this.statusCode, 500)
    };
    if (this.statusMessage) {
      obj.statusMessage = sanitizeStatusMessage(this.statusMessage);
    }
    if (this.data !== void 0) {
      obj.data = this.data;
    }
    return obj;
  }
}
__publicField$1(H3Error, "__h3_error__", true);
function createError$1(input) {
  if (typeof input === "string") {
    return new H3Error(input);
  }
  if (isError(input)) {
    return input;
  }
  const err = new H3Error(input.message ?? input.statusMessage ?? "", {
    cause: input.cause || input
  });
  if (hasProp(input, "stack")) {
    try {
      Object.defineProperty(err, "stack", {
        get() {
          return input.stack;
        }
      });
    } catch {
      try {
        err.stack = input.stack;
      } catch {
      }
    }
  }
  if (input.data) {
    err.data = input.data;
  }
  if (input.statusCode) {
    err.statusCode = sanitizeStatusCode(input.statusCode, err.statusCode);
  } else if (input.status) {
    err.statusCode = sanitizeStatusCode(input.status, err.statusCode);
  }
  if (input.statusMessage) {
    err.statusMessage = input.statusMessage;
  } else if (input.statusText) {
    err.statusMessage = input.statusText;
  }
  if (err.statusMessage) {
    const originalMessage = err.statusMessage;
    const sanitizedMessage = sanitizeStatusMessage(err.statusMessage);
    if (sanitizedMessage !== originalMessage) {
      console.warn(
        "[h3] Please prefer using `message` for longer error messages instead of `statusMessage`. In the future, `statusMessage` will be sanitized by default."
      );
    }
  }
  if (input.fatal !== void 0) {
    err.fatal = input.fatal;
  }
  if (input.unhandled !== void 0) {
    err.unhandled = input.unhandled;
  }
  return err;
}
function sendError(event, error, debug) {
  if (event.handled) {
    return;
  }
  const h3Error = isError(error) ? error : createError$1(error);
  const responseBody = {
    statusCode: h3Error.statusCode,
    statusMessage: h3Error.statusMessage,
    stack: [],
    data: h3Error.data
  };
  if (debug) {
    responseBody.stack = (h3Error.stack || "").split("\n").map((l) => l.trim());
  }
  if (event.handled) {
    return;
  }
  const _code = Number.parseInt(h3Error.statusCode);
  setResponseStatus(event, _code, h3Error.statusMessage);
  event.node.res.setHeader("content-type", MIMES.json);
  event.node.res.end(JSON.stringify(responseBody, void 0, 2));
}
function isError(input) {
  return input?.constructor?.__h3_error__ === true;
}

function getQuery(event) {
  return getQuery$1(event.path || "");
}
function isMethod(event, expected, allowHead) {
  if (allowHead && event.method === "HEAD") {
    return true;
  }
  if (typeof expected === "string") {
    if (event.method === expected) {
      return true;
    }
  } else if (expected.includes(event.method)) {
    return true;
  }
  return false;
}
function assertMethod(event, expected, allowHead) {
  if (!isMethod(event, expected, allowHead)) {
    throw createError$1({
      statusCode: 405,
      statusMessage: "HTTP method is not allowed."
    });
  }
}
function getRequestHeaders(event) {
  const _headers = {};
  for (const key in event.node.req.headers) {
    const val = event.node.req.headers[key];
    _headers[key] = Array.isArray(val) ? val.filter(Boolean).join(", ") : val;
  }
  return _headers;
}
function getRequestHeader(event, name) {
  const headers = getRequestHeaders(event);
  const value = headers[name.toLowerCase()];
  return value;
}

const RawBodySymbol = Symbol.for("h3RawBody");
const PayloadMethods$1 = ["PATCH", "POST", "PUT", "DELETE"];
function readRawBody(event, encoding = "utf8") {
  assertMethod(event, PayloadMethods$1);
  const _rawBody = event._requestBody || event.web?.request?.body || event.node.req[RawBodySymbol] || event.node.req.rawBody || event.node.req.body;
  if (_rawBody) {
    const promise2 = Promise.resolve(_rawBody).then((_resolved) => {
      if (Buffer.isBuffer(_resolved)) {
        return _resolved;
      }
      if (typeof _resolved.pipeTo === "function") {
        return new Promise((resolve, reject) => {
          const chunks = [];
          _resolved.pipeTo(
            new WritableStream({
              write(chunk) {
                chunks.push(chunk);
              },
              close() {
                resolve(Buffer.concat(chunks));
              },
              abort(reason) {
                reject(reason);
              }
            })
          ).catch(reject);
        });
      } else if (typeof _resolved.pipe === "function") {
        return new Promise((resolve, reject) => {
          const chunks = [];
          _resolved.on("data", (chunk) => {
            chunks.push(chunk);
          }).on("end", () => {
            resolve(Buffer.concat(chunks));
          }).on("error", reject);
        });
      }
      if (_resolved.constructor === Object) {
        return Buffer.from(JSON.stringify(_resolved));
      }
      return Buffer.from(_resolved);
    });
    return encoding ? promise2.then((buff) => buff.toString(encoding)) : promise2;
  }
  if (!Number.parseInt(event.node.req.headers["content-length"] || "")) {
    return Promise.resolve(void 0);
  }
  const promise = event.node.req[RawBodySymbol] = new Promise(
    (resolve, reject) => {
      const bodyData = [];
      event.node.req.on("error", (err) => {
        reject(err);
      }).on("data", (chunk) => {
        bodyData.push(chunk);
      }).on("end", () => {
        resolve(Buffer.concat(bodyData));
      });
    }
  );
  const result = encoding ? promise.then((buff) => buff.toString(encoding)) : promise;
  return result;
}
function getRequestWebStream(event) {
  if (!PayloadMethods$1.includes(event.method)) {
    return;
  }
  const bodyStream = event.web?.request?.body || event._requestBody;
  if (bodyStream) {
    return bodyStream;
  }
  const _hasRawBody = RawBodySymbol in event.node.req || "rawBody" in event.node.req || "body" in event.node.req || "__unenv__" in event.node.req;
  if (_hasRawBody) {
    return new ReadableStream({
      async start(controller) {
        const _rawBody = await readRawBody(event, false);
        if (_rawBody) {
          controller.enqueue(_rawBody);
        }
        controller.close();
      }
    });
  }
  return new ReadableStream({
    start: (controller) => {
      event.node.req.on("data", (chunk) => {
        controller.enqueue(chunk);
      });
      event.node.req.on("end", () => {
        controller.close();
      });
      event.node.req.on("error", (err) => {
        controller.error(err);
      });
    }
  });
}

function handleCacheHeaders(event, opts) {
  const cacheControls = ["public", ...opts.cacheControls || []];
  let cacheMatched = false;
  if (opts.maxAge !== void 0) {
    cacheControls.push(`max-age=${+opts.maxAge}`, `s-maxage=${+opts.maxAge}`);
  }
  if (opts.modifiedTime) {
    const modifiedTime = new Date(opts.modifiedTime);
    const ifModifiedSince = event.node.req.headers["if-modified-since"];
    event.node.res.setHeader("last-modified", modifiedTime.toUTCString());
    if (ifModifiedSince && new Date(ifModifiedSince) >= opts.modifiedTime) {
      cacheMatched = true;
    }
  }
  if (opts.etag) {
    event.node.res.setHeader("etag", opts.etag);
    const ifNonMatch = event.node.req.headers["if-none-match"];
    if (ifNonMatch === opts.etag) {
      cacheMatched = true;
    }
  }
  event.node.res.setHeader("cache-control", cacheControls.join(", "));
  if (cacheMatched) {
    event.node.res.statusCode = 304;
    if (!event.handled) {
      event.node.res.end();
    }
    return true;
  }
  return false;
}

const MIMES = {
  html: "text/html",
  json: "application/json"
};

const DISALLOWED_STATUS_CHARS = /[^\u0009\u0020-\u007E]/g;
function sanitizeStatusMessage(statusMessage = "") {
  return statusMessage.replace(DISALLOWED_STATUS_CHARS, "");
}
function sanitizeStatusCode(statusCode, defaultStatusCode = 200) {
  if (!statusCode) {
    return defaultStatusCode;
  }
  if (typeof statusCode === "string") {
    statusCode = Number.parseInt(statusCode, 10);
  }
  if (statusCode < 100 || statusCode > 999) {
    return defaultStatusCode;
  }
  return statusCode;
}
function splitCookiesString(cookiesString) {
  if (Array.isArray(cookiesString)) {
    return cookiesString.flatMap((c) => splitCookiesString(c));
  }
  if (typeof cookiesString !== "string") {
    return [];
  }
  const cookiesStrings = [];
  let pos = 0;
  let start;
  let ch;
  let lastComma;
  let nextStart;
  let cookiesSeparatorFound;
  const skipWhitespace = () => {
    while (pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))) {
      pos += 1;
    }
    return pos < cookiesString.length;
  };
  const notSpecialChar = () => {
    ch = cookiesString.charAt(pos);
    return ch !== "=" && ch !== ";" && ch !== ",";
  };
  while (pos < cookiesString.length) {
    start = pos;
    cookiesSeparatorFound = false;
    while (skipWhitespace()) {
      ch = cookiesString.charAt(pos);
      if (ch === ",") {
        lastComma = pos;
        pos += 1;
        skipWhitespace();
        nextStart = pos;
        while (pos < cookiesString.length && notSpecialChar()) {
          pos += 1;
        }
        if (pos < cookiesString.length && cookiesString.charAt(pos) === "=") {
          cookiesSeparatorFound = true;
          pos = nextStart;
          cookiesStrings.push(cookiesString.slice(start, lastComma));
          start = pos;
        } else {
          pos = lastComma + 1;
        }
      } else {
        pos += 1;
      }
    }
    if (!cookiesSeparatorFound || pos >= cookiesString.length) {
      cookiesStrings.push(cookiesString.slice(start, cookiesString.length));
    }
  }
  return cookiesStrings;
}

const defer = typeof setImmediate === "undefined" ? (fn) => fn() : setImmediate;
function send(event, data, type) {
  if (type) {
    defaultContentType(event, type);
  }
  return new Promise((resolve) => {
    defer(() => {
      if (!event.handled) {
        event.node.res.end(data);
      }
      resolve();
    });
  });
}
function sendNoContent(event, code) {
  if (event.handled) {
    return;
  }
  if (!code && event.node.res.statusCode !== 200) {
    code = event.node.res.statusCode;
  }
  const _code = sanitizeStatusCode(code, 204);
  if (_code === 204) {
    event.node.res.removeHeader("content-length");
  }
  event.node.res.writeHead(_code);
  event.node.res.end();
}
function setResponseStatus(event, code, text) {
  if (code) {
    event.node.res.statusCode = sanitizeStatusCode(
      code,
      event.node.res.statusCode
    );
  }
  if (text) {
    event.node.res.statusMessage = sanitizeStatusMessage(text);
  }
}
function getResponseStatus(event) {
  return event.node.res.statusCode;
}
function defaultContentType(event, type) {
  if (type && event.node.res.statusCode !== 304 && !event.node.res.getHeader("content-type")) {
    event.node.res.setHeader("content-type", type);
  }
}
function sendRedirect(event, location, code = 302) {
  event.node.res.statusCode = sanitizeStatusCode(
    code,
    event.node.res.statusCode
  );
  event.node.res.setHeader("location", location);
  const encodedLoc = location.replace(/"/g, "%22");
  const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`;
  return send(event, html, MIMES.html);
}
function getResponseHeader(event, name) {
  return event.node.res.getHeader(name);
}
function setResponseHeaders(event, headers) {
  for (const [name, value] of Object.entries(headers)) {
    event.node.res.setHeader(name, value);
  }
}
const setHeaders = setResponseHeaders;
function setResponseHeader(event, name, value) {
  event.node.res.setHeader(name, value);
}
function removeResponseHeader(event, name) {
  return event.node.res.removeHeader(name);
}
function isStream(data) {
  if (!data || typeof data !== "object") {
    return false;
  }
  if (typeof data.pipe === "function") {
    if (typeof data._read === "function") {
      return true;
    }
    if (typeof data.abort === "function") {
      return true;
    }
  }
  if (typeof data.pipeTo === "function") {
    return true;
  }
  return false;
}
function isWebResponse(data) {
  return typeof Response !== "undefined" && data instanceof Response;
}
function sendStream(event, stream) {
  if (!stream || typeof stream !== "object") {
    throw new Error("[h3] Invalid stream provided.");
  }
  event.node.res._data = stream;
  if (!event.node.res.socket) {
    event._handled = true;
    return Promise.resolve();
  }
  if (hasProp(stream, "pipeTo") && typeof stream.pipeTo === "function") {
    return stream.pipeTo(
      new WritableStream({
        write(chunk) {
          event.node.res.write(chunk);
        }
      })
    ).then(() => {
      event.node.res.end();
    });
  }
  if (hasProp(stream, "pipe") && typeof stream.pipe === "function") {
    return new Promise((resolve, reject) => {
      stream.pipe(event.node.res);
      if (stream.on) {
        stream.on("end", () => {
          event.node.res.end();
          resolve();
        });
        stream.on("error", (error) => {
          reject(error);
        });
      }
      event.node.res.on("close", () => {
        if (stream.abort) {
          stream.abort();
        }
      });
    });
  }
  throw new Error("[h3] Invalid or incompatible stream provided.");
}
function sendWebResponse(event, response) {
  for (const [key, value] of response.headers) {
    if (key === "set-cookie") {
      event.node.res.appendHeader(key, splitCookiesString(value));
    } else {
      event.node.res.setHeader(key, value);
    }
  }
  if (response.status) {
    event.node.res.statusCode = sanitizeStatusCode(
      response.status,
      event.node.res.statusCode
    );
  }
  if (response.statusText) {
    event.node.res.statusMessage = sanitizeStatusMessage(response.statusText);
  }
  if (response.redirected) {
    event.node.res.setHeader("location", response.url);
  }
  if (!response.body) {
    event.node.res.end();
    return;
  }
  return sendStream(event, response.body);
}

const PayloadMethods = /* @__PURE__ */ new Set(["PATCH", "POST", "PUT", "DELETE"]);
const ignoredHeaders = /* @__PURE__ */ new Set([
  "transfer-encoding",
  "connection",
  "keep-alive",
  "upgrade",
  "expect",
  "host"
]);
async function proxyRequest(event, target, opts = {}) {
  let body;
  let duplex;
  if (PayloadMethods.has(event.method)) {
    if (opts.streamRequest) {
      body = getRequestWebStream(event);
      duplex = "half";
    } else {
      body = await readRawBody(event, false).catch(() => void 0);
    }
  }
  const method = opts.fetchOptions?.method || event.method;
  const fetchHeaders = mergeHeaders(
    getProxyRequestHeaders(event),
    opts.fetchOptions?.headers,
    opts.headers
  );
  return sendProxy(event, target, {
    ...opts,
    fetchOptions: {
      method,
      body,
      duplex,
      ...opts.fetchOptions,
      headers: fetchHeaders
    }
  });
}
async function sendProxy(event, target, opts = {}) {
  const response = await _getFetch(opts.fetch)(target, {
    headers: opts.headers,
    ignoreResponseError: true,
    // make $ofetch.raw transparent
    ...opts.fetchOptions
  });
  event.node.res.statusCode = sanitizeStatusCode(
    response.status,
    event.node.res.statusCode
  );
  event.node.res.statusMessage = sanitizeStatusMessage(response.statusText);
  const cookies = [];
  for (const [key, value] of response.headers.entries()) {
    if (key === "content-encoding") {
      continue;
    }
    if (key === "content-length") {
      continue;
    }
    if (key === "set-cookie") {
      cookies.push(...splitCookiesString(value));
      continue;
    }
    event.node.res.setHeader(key, value);
  }
  if (cookies.length > 0) {
    event.node.res.setHeader(
      "set-cookie",
      cookies.map((cookie) => {
        if (opts.cookieDomainRewrite) {
          cookie = rewriteCookieProperty(
            cookie,
            opts.cookieDomainRewrite,
            "domain"
          );
        }
        if (opts.cookiePathRewrite) {
          cookie = rewriteCookieProperty(
            cookie,
            opts.cookiePathRewrite,
            "path"
          );
        }
        return cookie;
      })
    );
  }
  if (opts.onResponse) {
    await opts.onResponse(event, response);
  }
  if (response._data !== void 0) {
    return response._data;
  }
  if (event.handled) {
    return;
  }
  if (opts.sendStream === false) {
    const data = new Uint8Array(await response.arrayBuffer());
    return event.node.res.end(data);
  }
  if (response.body) {
    for await (const chunk of response.body) {
      event.node.res.write(chunk);
    }
  }
  return event.node.res.end();
}
function getProxyRequestHeaders(event) {
  const headers = /* @__PURE__ */ Object.create(null);
  const reqHeaders = getRequestHeaders(event);
  for (const name in reqHeaders) {
    if (!ignoredHeaders.has(name)) {
      headers[name] = reqHeaders[name];
    }
  }
  return headers;
}
function fetchWithEvent(event, req, init, options) {
  return _getFetch(options?.fetch)(req, {
    ...init,
    context: init?.context || event.context,
    headers: {
      ...getProxyRequestHeaders(event),
      ...init?.headers
    }
  });
}
function _getFetch(_fetch) {
  if (_fetch) {
    return _fetch;
  }
  if (globalThis.fetch) {
    return globalThis.fetch;
  }
  throw new Error(
    "fetch is not available. Try importing `node-fetch-native/polyfill` for Node.js."
  );
}
function rewriteCookieProperty(header, map, property) {
  const _map = typeof map === "string" ? { "*": map } : map;
  return header.replace(
    new RegExp(`(;\\s*${property}=)([^;]+)`, "gi"),
    (match, prefix, previousValue) => {
      let newValue;
      if (previousValue in _map) {
        newValue = _map[previousValue];
      } else if ("*" in _map) {
        newValue = _map["*"];
      } else {
        return match;
      }
      return newValue ? prefix + newValue : "";
    }
  );
}
function mergeHeaders(defaults, ...inputs) {
  const _inputs = inputs.filter(Boolean);
  if (_inputs.length === 0) {
    return defaults;
  }
  const merged = new Headers(defaults);
  for (const input of _inputs) {
    for (const [key, value] of Object.entries(input)) {
      if (value !== void 0) {
        merged.set(key, value);
      }
    }
  }
  return merged;
}

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class H3Event {
  constructor(req, res) {
    __publicField(this, "__is_event__", true);
    // Context
    __publicField(this, "node");
    // Node
    __publicField(this, "web");
    // Web
    __publicField(this, "context", {});
    // Shared
    // Request
    __publicField(this, "_method");
    __publicField(this, "_path");
    __publicField(this, "_headers");
    __publicField(this, "_requestBody");
    // Response
    __publicField(this, "_handled", false);
    this.node = { req, res };
  }
  // --- Request ---
  get method() {
    if (!this._method) {
      this._method = (this.node.req.method || "GET").toUpperCase();
    }
    return this._method;
  }
  get path() {
    return this._path || this.node.req.url || "/";
  }
  get headers() {
    if (!this._headers) {
      this._headers = _normalizeNodeHeaders(this.node.req.headers);
    }
    return this._headers;
  }
  // --- Respoonse ---
  get handled() {
    return this._handled || this.node.res.writableEnded || this.node.res.headersSent;
  }
  respondWith(response) {
    return Promise.resolve(response).then(
      (_response) => sendWebResponse(this, _response)
    );
  }
  // --- Utils ---
  toString() {
    return `[${this.method}] ${this.path}`;
  }
  toJSON() {
    return this.toString();
  }
  // --- Deprecated ---
  /** @deprecated Please use `event.node.req` instead. **/
  get req() {
    return this.node.req;
  }
  /** @deprecated Please use `event.node.res` instead. **/
  get res() {
    return this.node.res;
  }
}
function isEvent(input) {
  return hasProp(input, "__is_event__");
}
function createEvent(req, res) {
  return new H3Event(req, res);
}
function _normalizeNodeHeaders(nodeHeaders) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(nodeHeaders)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(name, item);
      }
    } else if (value) {
      headers.set(name, value);
    }
  }
  return headers;
}

function defineEventHandler(handler) {
  if (typeof handler === "function") {
    return Object.assign(handler, { __is_handler__: true });
  }
  const _hooks = {
    onRequest: _normalizeArray(handler.onRequest),
    onBeforeResponse: _normalizeArray(handler.onBeforeResponse)
  };
  const _handler = (event) => {
    return _callHandler(event, handler.handler, _hooks);
  };
  return Object.assign(_handler, { __is_handler__: true });
}
function _normalizeArray(input) {
  return input ? Array.isArray(input) ? input : [input] : void 0;
}
async function _callHandler(event, handler, hooks) {
  if (hooks.onRequest) {
    for (const hook of hooks.onRequest) {
      await hook(event);
      if (event.handled) {
        return;
      }
    }
  }
  const body = await handler(event);
  const response = { body };
  if (hooks.onBeforeResponse) {
    for (const hook of hooks.onBeforeResponse) {
      await hook(event, response);
    }
  }
  return response.body;
}
const eventHandler = defineEventHandler;
function isEventHandler(input) {
  return hasProp(input, "__is_handler__");
}
function toEventHandler(input, _, _route) {
  if (!isEventHandler(input)) {
    console.warn(
      "[h3] Implicit event handler conversion is deprecated. Use `eventHandler()` or `fromNodeMiddleware()` to define event handlers.",
      _route && _route !== "/" ? `
     Route: ${_route}` : "",
      `
     Handler: ${input}`
    );
  }
  return input;
}
function defineLazyEventHandler(factory) {
  let _promise;
  let _resolved;
  const resolveHandler = () => {
    if (_resolved) {
      return Promise.resolve(_resolved);
    }
    if (!_promise) {
      _promise = Promise.resolve(factory()).then((r) => {
        const handler = r.default || r;
        if (typeof handler !== "function") {
          throw new TypeError(
            "Invalid lazy handler result. It should be a function:",
            handler
          );
        }
        _resolved = toEventHandler(r.default || r);
        return _resolved;
      });
    }
    return _promise;
  };
  return eventHandler((event) => {
    if (_resolved) {
      return _resolved(event);
    }
    return resolveHandler().then((handler) => handler(event));
  });
}
const lazyEventHandler = defineLazyEventHandler;

function createApp(options = {}) {
  const stack = [];
  const handler = createAppEventHandler(stack, options);
  const app = {
    // @ts-ignore
    use: (arg1, arg2, arg3) => use(app, arg1, arg2, arg3),
    handler,
    stack,
    options
  };
  return app;
}
function use(app, arg1, arg2, arg3) {
  if (Array.isArray(arg1)) {
    for (const i of arg1) {
      use(app, i, arg2, arg3);
    }
  } else if (Array.isArray(arg2)) {
    for (const i of arg2) {
      use(app, arg1, i, arg3);
    }
  } else if (typeof arg1 === "string") {
    app.stack.push(
      normalizeLayer({ ...arg3, route: arg1, handler: arg2 })
    );
  } else if (typeof arg1 === "function") {
    app.stack.push(
      normalizeLayer({ ...arg2, route: "/", handler: arg1 })
    );
  } else {
    app.stack.push(normalizeLayer({ ...arg1 }));
  }
  return app;
}
function createAppEventHandler(stack, options) {
  const spacing = options.debug ? 2 : void 0;
  return eventHandler(async (event) => {
    event.node.req.originalUrl = event.node.req.originalUrl || event.node.req.url || "/";
    const _reqPath = event._path || event.node.req.url || "/";
    let _layerPath;
    if (options.onRequest) {
      await options.onRequest(event);
    }
    for (const layer of stack) {
      if (layer.route.length > 1) {
        if (!_reqPath.startsWith(layer.route)) {
          continue;
        }
        _layerPath = _reqPath.slice(layer.route.length) || "/";
      } else {
        _layerPath = _reqPath;
      }
      if (layer.match && !layer.match(_layerPath, event)) {
        continue;
      }
      event._path = _layerPath;
      event.node.req.url = _layerPath;
      const val = await layer.handler(event);
      const _body = val === void 0 ? void 0 : await val;
      if (_body !== void 0) {
        const _response = { body: _body };
        if (options.onBeforeResponse) {
          await options.onBeforeResponse(event, _response);
        }
        await handleHandlerResponse(event, _response.body, spacing);
        if (options.onAfterResponse) {
          await options.onAfterResponse(event, _response);
        }
        return;
      }
      if (event.handled) {
        if (options.onAfterResponse) {
          await options.onAfterResponse(event, void 0);
        }
        return;
      }
    }
    if (!event.handled) {
      throw createError$1({
        statusCode: 404,
        statusMessage: `Cannot find any path matching ${event.path || "/"}.`
      });
    }
    if (options.onAfterResponse) {
      await options.onAfterResponse(event, void 0);
    }
  });
}
function normalizeLayer(input) {
  let handler = input.handler;
  if (handler.handler) {
    handler = handler.handler;
  }
  if (input.lazy) {
    handler = lazyEventHandler(handler);
  } else if (!isEventHandler(handler)) {
    handler = toEventHandler(handler, void 0, input.route);
  }
  return {
    route: withoutTrailingSlash(input.route),
    match: input.match,
    handler
  };
}
function handleHandlerResponse(event, val, jsonSpace) {
  if (val === null) {
    return sendNoContent(event);
  }
  if (val) {
    if (isWebResponse(val)) {
      return sendWebResponse(event, val);
    }
    if (isStream(val)) {
      return sendStream(event, val);
    }
    if (val.buffer) {
      return send(event, val);
    }
    if (val.arrayBuffer && typeof val.arrayBuffer === "function") {
      return val.arrayBuffer().then((arrayBuffer) => {
        return send(event, Buffer.from(arrayBuffer), val.type);
      });
    }
    if (val instanceof Error) {
      throw createError$1(val);
    }
    if (typeof val.end === "function") {
      return true;
    }
  }
  const valType = typeof val;
  if (valType === "string") {
    return send(event, val, MIMES.html);
  }
  if (valType === "object" || valType === "boolean" || valType === "number") {
    return send(event, JSON.stringify(val, void 0, jsonSpace), MIMES.json);
  }
  if (valType === "bigint") {
    return send(event, val.toString(), MIMES.json);
  }
  throw createError$1({
    statusCode: 500,
    statusMessage: `[h3] Cannot send ${valType} as response.`
  });
}

const RouterMethods = [
  "connect",
  "delete",
  "get",
  "head",
  "options",
  "post",
  "put",
  "trace",
  "patch"
];
function createRouter(opts = {}) {
  const _router = createRouter$1({});
  const routes = {};
  let _matcher;
  const router = {};
  const addRoute = (path, handler, method) => {
    let route = routes[path];
    if (!route) {
      routes[path] = route = { path, handlers: {} };
      _router.insert(path, route);
    }
    if (Array.isArray(method)) {
      for (const m of method) {
        addRoute(path, handler, m);
      }
    } else {
      route.handlers[method] = toEventHandler(handler, void 0, path);
    }
    return router;
  };
  router.use = router.add = (path, handler, method) => addRoute(path, handler, method || "all");
  for (const method of RouterMethods) {
    router[method] = (path, handle) => router.add(path, handle, method);
  }
  router.handler = eventHandler((event) => {
    let path = event.path || "/";
    const qIndex = path.indexOf("?");
    if (qIndex !== -1) {
      path = path.slice(0, Math.max(0, qIndex));
    }
    const matched = _router.lookup(path);
    if (!matched || !matched.handlers) {
      if (opts.preemptive || opts.preemtive) {
        throw createError$1({
          statusCode: 404,
          name: "Not Found",
          statusMessage: `Cannot find any route matching ${event.path || "/"}.`
        });
      } else {
        return;
      }
    }
    const method = (event.node.req.method || "get").toLowerCase();
    let handler = matched.handlers[method] || matched.handlers.all;
    if (!handler) {
      if (!_matcher) {
        _matcher = toRouteMatcher(_router);
      }
      const _matches = _matcher.matchAll(path).reverse();
      for (const _match of _matches) {
        if (_match.handlers[method]) {
          handler = _match.handlers[method];
          matched.handlers[method] = matched.handlers[method] || handler;
          break;
        }
        if (_match.handlers.all) {
          handler = _match.handlers.all;
          matched.handlers.all = matched.handlers.all || handler;
          break;
        }
      }
    }
    if (!handler) {
      if (opts.preemptive || opts.preemtive) {
        throw createError$1({
          statusCode: 405,
          name: "Method Not Allowed",
          statusMessage: `Method ${method} is not allowed on this route.`
        });
      } else {
        return;
      }
    }
    event.context.matchedRoute = matched;
    const params = matched.params || {};
    event.context.params = params;
    return Promise.resolve(handler(event)).then((res) => {
      if (res === void 0 && (opts.preemptive || opts.preemtive)) {
        return null;
      }
      return res;
    });
  });
  return router;
}
function toNodeListener(app) {
  const toNodeHandle = async function(req, res) {
    const event = createEvent(req, res);
    try {
      await app.handler(event);
    } catch (_error) {
      const error = createError$1(_error);
      if (!isError(_error)) {
        error.unhandled = true;
      }
      if (app.options.onError) {
        await app.options.onError(error, event);
      }
      if (event.handled) {
        return;
      }
      if (error.unhandled || error.fatal) {
        console.error("[h3]", error.fatal ? "[fatal]" : "[unhandled]", error);
      }
      await sendError(event, error, !!app.options.debug);
    }
  };
  return toNodeHandle;
}

const s=globalThis.Headers,i=globalThis.AbortController,l=globalThis.fetch||(()=>{throw new Error("[node-fetch-native] Failed to fetch: `globalThis.fetch` is not available!")});

class FetchError extends Error {
  constructor(message, opts) {
    super(message, opts);
    this.name = "FetchError";
    if (opts?.cause && !this.cause) {
      this.cause = opts.cause;
    }
  }
}
function createFetchError(ctx) {
  const errorMessage = ctx.error?.message || ctx.error?.toString() || "";
  const method = ctx.request?.method || ctx.options?.method || "GET";
  const url = ctx.request?.url || String(ctx.request) || "/";
  const requestStr = `[${method}] ${JSON.stringify(url)}`;
  const statusStr = ctx.response ? `${ctx.response.status} ${ctx.response.statusText}` : "<no response>";
  const message = `${requestStr}: ${statusStr}${errorMessage ? ` ${errorMessage}` : ""}`;
  const fetchError = new FetchError(
    message,
    ctx.error ? { cause: ctx.error } : void 0
  );
  for (const key of ["request", "options", "response"]) {
    Object.defineProperty(fetchError, key, {
      get() {
        return ctx[key];
      }
    });
  }
  for (const [key, refKey] of [
    ["data", "_data"],
    ["status", "status"],
    ["statusCode", "status"],
    ["statusText", "statusText"],
    ["statusMessage", "statusText"]
  ]) {
    Object.defineProperty(fetchError, key, {
      get() {
        return ctx.response && ctx.response[refKey];
      }
    });
  }
  return fetchError;
}

const payloadMethods = new Set(
  Object.freeze(["PATCH", "POST", "PUT", "DELETE"])
);
function isPayloadMethod(method = "GET") {
  return payloadMethods.has(method.toUpperCase());
}
function isJSONSerializable(value) {
  if (value === void 0) {
    return false;
  }
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean" || t === null) {
    return true;
  }
  if (t !== "object") {
    return false;
  }
  if (Array.isArray(value)) {
    return true;
  }
  if (value.buffer) {
    return false;
  }
  return value.constructor && value.constructor.name === "Object" || typeof value.toJSON === "function";
}
const textTypes = /* @__PURE__ */ new Set([
  "image/svg",
  "application/xml",
  "application/xhtml",
  "application/html"
]);
const JSON_RE = /^application\/(?:[\w!#$%&*.^`~-]*\+)?json(;.+)?$/i;
function detectResponseType(_contentType = "") {
  if (!_contentType) {
    return "json";
  }
  const contentType = _contentType.split(";").shift() || "";
  if (JSON_RE.test(contentType)) {
    return "json";
  }
  if (textTypes.has(contentType) || contentType.startsWith("text/")) {
    return "text";
  }
  return "blob";
}
function mergeFetchOptions(input, defaults, Headers = globalThis.Headers) {
  const merged = {
    ...defaults,
    ...input
  };
  if (defaults?.params && input?.params) {
    merged.params = {
      ...defaults?.params,
      ...input?.params
    };
  }
  if (defaults?.query && input?.query) {
    merged.query = {
      ...defaults?.query,
      ...input?.query
    };
  }
  if (defaults?.headers && input?.headers) {
    merged.headers = new Headers(defaults?.headers || {});
    for (const [key, value] of new Headers(input?.headers || {})) {
      merged.headers.set(key, value);
    }
  }
  return merged;
}

const retryStatusCodes = /* @__PURE__ */ new Set([
  408,
  // Request Timeout
  409,
  // Conflict
  425,
  // Too Early
  429,
  // Too Many Requests
  500,
  // Internal Server Error
  502,
  // Bad Gateway
  503,
  // Service Unavailable
  504
  //  Gateway Timeout
]);
const nullBodyResponses$1 = /* @__PURE__ */ new Set([101, 204, 205, 304]);
function createFetch$1(globalOptions = {}) {
  const {
    fetch = globalThis.fetch,
    Headers = globalThis.Headers,
    AbortController = globalThis.AbortController
  } = globalOptions;
  async function onError(context) {
    const isAbort = context.error && context.error.name === "AbortError" && !context.options.timeout || false;
    if (context.options.retry !== false && !isAbort) {
      let retries;
      if (typeof context.options.retry === "number") {
        retries = context.options.retry;
      } else {
        retries = isPayloadMethod(context.options.method) ? 0 : 1;
      }
      const responseCode = context.response && context.response.status || 500;
      if (retries > 0 && (Array.isArray(context.options.retryStatusCodes) ? context.options.retryStatusCodes.includes(responseCode) : retryStatusCodes.has(responseCode))) {
        const retryDelay = context.options.retryDelay || 0;
        if (retryDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
        return $fetchRaw(context.request, {
          ...context.options,
          retry: retries - 1,
          timeout: context.options.timeout
        });
      }
    }
    const error = createFetchError(context);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(error, $fetchRaw);
    }
    throw error;
  }
  const $fetchRaw = async function $fetchRaw2(_request, _options = {}) {
    const context = {
      request: _request,
      options: mergeFetchOptions(_options, globalOptions.defaults, Headers),
      response: void 0,
      error: void 0
    };
    context.options.method = context.options.method?.toUpperCase();
    if (context.options.onRequest) {
      await context.options.onRequest(context);
    }
    if (typeof context.request === "string") {
      if (context.options.baseURL) {
        context.request = withBase(context.request, context.options.baseURL);
      }
      if (context.options.query || context.options.params) {
        context.request = withQuery(context.request, {
          ...context.options.params,
          ...context.options.query
        });
      }
    }
    if (context.options.body && isPayloadMethod(context.options.method)) {
      if (isJSONSerializable(context.options.body)) {
        context.options.body = typeof context.options.body === "string" ? context.options.body : JSON.stringify(context.options.body);
        context.options.headers = new Headers(context.options.headers || {});
        if (!context.options.headers.has("content-type")) {
          context.options.headers.set("content-type", "application/json");
        }
        if (!context.options.headers.has("accept")) {
          context.options.headers.set("accept", "application/json");
        }
      } else if (
        // ReadableStream Body
        "pipeTo" in context.options.body && typeof context.options.body.pipeTo === "function" || // Node.js Stream Body
        typeof context.options.body.pipe === "function"
      ) {
        if (!("duplex" in context.options)) {
          context.options.duplex = "half";
        }
      }
    }
    if (!context.options.signal && context.options.timeout) {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), context.options.timeout);
      context.options.signal = controller.signal;
    }
    try {
      context.response = await fetch(
        context.request,
        context.options
      );
    } catch (error) {
      context.error = error;
      if (context.options.onRequestError) {
        await context.options.onRequestError(context);
      }
      return await onError(context);
    }
    const hasBody = context.response.body && !nullBodyResponses$1.has(context.response.status) && context.options.method !== "HEAD";
    if (hasBody) {
      const responseType = (context.options.parseResponse ? "json" : context.options.responseType) || detectResponseType(context.response.headers.get("content-type") || "");
      switch (responseType) {
        case "json": {
          const data = await context.response.text();
          const parseFunction = context.options.parseResponse || destr;
          context.response._data = parseFunction(data);
          break;
        }
        case "stream": {
          context.response._data = context.response.body;
          break;
        }
        default: {
          context.response._data = await context.response[responseType]();
        }
      }
    }
    if (context.options.onResponse) {
      await context.options.onResponse(context);
    }
    if (!context.options.ignoreResponseError && context.response.status >= 400 && context.response.status < 600) {
      if (context.options.onResponseError) {
        await context.options.onResponseError(context);
      }
      return await onError(context);
    }
    return context.response;
  };
  const $fetch = async function $fetch2(request, options) {
    const r = await $fetchRaw(request, options);
    return r._data;
  };
  $fetch.raw = $fetchRaw;
  $fetch.native = (...args) => fetch(...args);
  $fetch.create = (defaultOptions = {}) => createFetch$1({
    ...globalOptions,
    defaults: {
      ...globalOptions.defaults,
      ...defaultOptions
    }
  });
  return $fetch;
}

function createNodeFetch() {
  const useKeepAlive = JSON.parse(process.env.FETCH_KEEP_ALIVE || "false");
  if (!useKeepAlive) {
    return l;
  }
  const agentOptions = { keepAlive: true };
  const httpAgent = new http.Agent(agentOptions);
  const httpsAgent = new https.Agent(agentOptions);
  const nodeFetchOptions = {
    agent(parsedURL) {
      return parsedURL.protocol === "http:" ? httpAgent : httpsAgent;
    }
  };
  return function nodeFetchWithKeepAlive(input, init) {
    return l(input, { ...nodeFetchOptions, ...init });
  };
}
const fetch = globalThis.fetch || createNodeFetch();
const Headers$1 = globalThis.Headers || s;
const AbortController = globalThis.AbortController || i;
createFetch$1({ fetch, Headers: Headers$1, AbortController });

const nullBodyResponses = /* @__PURE__ */ new Set([101, 204, 205, 304]);
function createCall(handle) {
  return function callHandle(context) {
    const req = new IncomingMessage();
    const res = new ServerResponse(req);
    req.url = context.url || "/";
    req.method = context.method || "GET";
    req.headers = {};
    if (context.headers) {
      const headerEntries = typeof context.headers.entries === "function" ? context.headers.entries() : Object.entries(context.headers);
      for (const [name, value] of headerEntries) {
        if (!value) {
          continue;
        }
        req.headers[name.toLowerCase()] = value;
      }
    }
    req.headers.host = req.headers.host || context.host || "localhost";
    req.connection.encrypted = // @ts-ignore
    req.connection.encrypted || context.protocol === "https";
    req.body = context.body || null;
    req.__unenv__ = context.context;
    return handle(req, res).then(() => {
      let body = res._data;
      if (nullBodyResponses.has(res.statusCode) || req.method.toUpperCase() === "HEAD") {
        body = null;
        delete res._headers["content-length"];
      }
      const r = {
        body,
        headers: res._headers,
        status: res.statusCode,
        statusText: res.statusMessage
      };
      req.destroy();
      res.destroy();
      return r;
    });
  };
}

function createFetch(call, _fetch = global.fetch) {
  return async function ufetch(input, init) {
    const url = input.toString();
    if (!url.startsWith("/")) {
      return _fetch(url, init);
    }
    try {
      const r = await call({ url, ...init });
      return new Response(r.body, {
        status: r.status,
        statusText: r.statusText,
        headers: Object.fromEntries(
          Object.entries(r.headers).map(([name, value]) => [
            name,
            Array.isArray(value) ? value.join(",") : String(value) || ""
          ])
        )
      });
    } catch (error) {
      return new Response(error.toString(), {
        status: Number.parseInt(error.statusCode || error.code) || 500,
        statusText: error.statusText
      });
    }
  };
}

function flatHooks(configHooks, hooks = {}, parentName) {
  for (const key in configHooks) {
    const subHook = configHooks[key];
    const name = parentName ? `${parentName}:${key}` : key;
    if (typeof subHook === "object" && subHook !== null) {
      flatHooks(subHook, hooks, name);
    } else if (typeof subHook === "function") {
      hooks[name] = subHook;
    }
  }
  return hooks;
}
const defaultTask = { run: (function_) => function_() };
const _createTask = () => defaultTask;
const createTask = typeof console.createTask !== "undefined" ? console.createTask : _createTask;
function serialTaskCaller(hooks, args) {
  const name = args.shift();
  const task = createTask(name);
  return hooks.reduce(
    (promise, hookFunction) => promise.then(() => task.run(() => hookFunction(...args))),
    Promise.resolve()
  );
}
function parallelTaskCaller(hooks, args) {
  const name = args.shift();
  const task = createTask(name);
  return Promise.all(hooks.map((hook) => task.run(() => hook(...args))));
}
function callEachWith(callbacks, arg0) {
  for (const callback of [...callbacks]) {
    callback(arg0);
  }
}

class Hookable {
  constructor() {
    this._hooks = {};
    this._before = void 0;
    this._after = void 0;
    this._deprecatedMessages = void 0;
    this._deprecatedHooks = {};
    this.hook = this.hook.bind(this);
    this.callHook = this.callHook.bind(this);
    this.callHookWith = this.callHookWith.bind(this);
  }
  hook(name, function_, options = {}) {
    if (!name || typeof function_ !== "function") {
      return () => {
      };
    }
    const originalName = name;
    let dep;
    while (this._deprecatedHooks[name]) {
      dep = this._deprecatedHooks[name];
      name = dep.to;
    }
    if (dep && !options.allowDeprecated) {
      let message = dep.message;
      if (!message) {
        message = `${originalName} hook has been deprecated` + (dep.to ? `, please use ${dep.to}` : "");
      }
      if (!this._deprecatedMessages) {
        this._deprecatedMessages = /* @__PURE__ */ new Set();
      }
      if (!this._deprecatedMessages.has(message)) {
        console.warn(message);
        this._deprecatedMessages.add(message);
      }
    }
    if (!function_.name) {
      try {
        Object.defineProperty(function_, "name", {
          get: () => "_" + name.replace(/\W+/g, "_") + "_hook_cb",
          configurable: true
        });
      } catch {
      }
    }
    this._hooks[name] = this._hooks[name] || [];
    this._hooks[name].push(function_);
    return () => {
      if (function_) {
        this.removeHook(name, function_);
        function_ = void 0;
      }
    };
  }
  hookOnce(name, function_) {
    let _unreg;
    let _function = (...arguments_) => {
      if (typeof _unreg === "function") {
        _unreg();
      }
      _unreg = void 0;
      _function = void 0;
      return function_(...arguments_);
    };
    _unreg = this.hook(name, _function);
    return _unreg;
  }
  removeHook(name, function_) {
    if (this._hooks[name]) {
      const index = this._hooks[name].indexOf(function_);
      if (index !== -1) {
        this._hooks[name].splice(index, 1);
      }
      if (this._hooks[name].length === 0) {
        delete this._hooks[name];
      }
    }
  }
  deprecateHook(name, deprecated) {
    this._deprecatedHooks[name] = typeof deprecated === "string" ? { to: deprecated } : deprecated;
    const _hooks = this._hooks[name] || [];
    delete this._hooks[name];
    for (const hook of _hooks) {
      this.hook(name, hook);
    }
  }
  deprecateHooks(deprecatedHooks) {
    Object.assign(this._deprecatedHooks, deprecatedHooks);
    for (const name in deprecatedHooks) {
      this.deprecateHook(name, deprecatedHooks[name]);
    }
  }
  addHooks(configHooks) {
    const hooks = flatHooks(configHooks);
    const removeFns = Object.keys(hooks).map(
      (key) => this.hook(key, hooks[key])
    );
    return () => {
      for (const unreg of removeFns.splice(0, removeFns.length)) {
        unreg();
      }
    };
  }
  removeHooks(configHooks) {
    const hooks = flatHooks(configHooks);
    for (const key in hooks) {
      this.removeHook(key, hooks[key]);
    }
  }
  removeAllHooks() {
    for (const key in this._hooks) {
      delete this._hooks[key];
    }
  }
  callHook(name, ...arguments_) {
    arguments_.unshift(name);
    return this.callHookWith(serialTaskCaller, name, ...arguments_);
  }
  callHookParallel(name, ...arguments_) {
    arguments_.unshift(name);
    return this.callHookWith(parallelTaskCaller, name, ...arguments_);
  }
  callHookWith(caller, name, ...arguments_) {
    const event = this._before || this._after ? { name, args: arguments_, context: {} } : void 0;
    if (this._before) {
      callEachWith(this._before, event);
    }
    const result = caller(
      name in this._hooks ? [...this._hooks[name]] : [],
      arguments_
    );
    if (result instanceof Promise) {
      return result.finally(() => {
        if (this._after && event) {
          callEachWith(this._after, event);
        }
      });
    }
    if (this._after && event) {
      callEachWith(this._after, event);
    }
    return result;
  }
  beforeEach(function_) {
    this._before = this._before || [];
    this._before.push(function_);
    return () => {
      if (this._before !== void 0) {
        const index = this._before.indexOf(function_);
        if (index !== -1) {
          this._before.splice(index, 1);
        }
      }
    };
  }
  afterEach(function_) {
    this._after = this._after || [];
    this._after.push(function_);
    return () => {
      if (this._after !== void 0) {
        const index = this._after.indexOf(function_);
        if (index !== -1) {
          this._after.splice(index, 1);
        }
      }
    };
  }
}
function createHooks() {
  return new Hookable();
}

const NUMBER_CHAR_RE = /\d/;
const STR_SPLITTERS = ["-", "_", "/", "."];
function isUppercase(char = "") {
  if (NUMBER_CHAR_RE.test(char)) {
    return void 0;
  }
  return char !== char.toLowerCase();
}
function splitByCase(str, separators) {
  const splitters = separators ?? STR_SPLITTERS;
  const parts = [];
  if (!str || typeof str !== "string") {
    return parts;
  }
  let buff = "";
  let previousUpper;
  let previousSplitter;
  for (const char of str) {
    const isSplitter = splitters.includes(char);
    if (isSplitter === true) {
      parts.push(buff);
      buff = "";
      previousUpper = void 0;
      continue;
    }
    const isUpper = isUppercase(char);
    if (previousSplitter === false) {
      if (previousUpper === false && isUpper === true) {
        parts.push(buff);
        buff = char;
        previousUpper = isUpper;
        continue;
      }
      if (previousUpper === true && isUpper === false && buff.length > 1) {
        const lastChar = buff.at(-1);
        parts.push(buff.slice(0, Math.max(0, buff.length - 1)));
        buff = lastChar + char;
        previousUpper = isUpper;
        continue;
      }
    }
    buff += char;
    previousUpper = isUpper;
    previousSplitter = isSplitter;
  }
  parts.push(buff);
  return parts;
}
function kebabCase(str, joiner) {
  return str ? (Array.isArray(str) ? str : splitByCase(str)).map((p) => p.toLowerCase()).join(joiner ?? "-") : "";
}
function snakeCase(str) {
  return kebabCase(str || "", "_");
}

function klona(x) {
	if (typeof x !== 'object') return x;

	var k, tmp, str=Object.prototype.toString.call(x);

	if (str === '[object Object]') {
		if (x.constructor !== Object && typeof x.constructor === 'function') {
			tmp = new x.constructor();
			for (k in x) {
				if (x.hasOwnProperty(k) && tmp[k] !== x[k]) {
					tmp[k] = klona(x[k]);
				}
			}
		} else {
			tmp = {}; // null
			for (k in x) {
				if (k === '__proto__') {
					Object.defineProperty(tmp, k, {
						value: klona(x[k]),
						configurable: true,
						enumerable: true,
						writable: true,
					});
				} else {
					tmp[k] = klona(x[k]);
				}
			}
		}
		return tmp;
	}

	if (str === '[object Array]') {
		k = x.length;
		for (tmp=Array(k); k--;) {
			tmp[k] = klona(x[k]);
		}
		return tmp;
	}

	if (str === '[object Set]') {
		tmp = new Set;
		x.forEach(function (val) {
			tmp.add(klona(val));
		});
		return tmp;
	}

	if (str === '[object Map]') {
		tmp = new Map;
		x.forEach(function (val, key) {
			tmp.set(klona(key), klona(val));
		});
		return tmp;
	}

	if (str === '[object Date]') {
		return new Date(+x);
	}

	if (str === '[object RegExp]') {
		tmp = new RegExp(x.source, x.flags);
		tmp.lastIndex = x.lastIndex;
		return tmp;
	}

	if (str === '[object DataView]') {
		return new x.constructor( klona(x.buffer) );
	}

	if (str === '[object ArrayBuffer]') {
		return x.slice(0);
	}

	// ArrayBuffer.isView(x)
	// ~> `new` bcuz `Buffer.slice` => ref
	if (str.slice(-6) === 'Array]') {
		return new x.constructor(x);
	}

	return x;
}

const inlineAppConfig = {};



const appConfig = defuFn(inlineAppConfig);

const _inlineRuntimeConfig = {
  "app": {
    "baseURL": "/",
    "basePath": "/",
    "assetsPath": "/_nuxt/",
    "cdnURL": "",
    "buildAssetsDir": "/_nuxt/"
  },
  "nitro": {
    "envPrefix": "NUXT_",
    "routeRules": {}
  },
  "public": {}
};
const ENV_PREFIX = "NITRO_";
const ENV_PREFIX_ALT = _inlineRuntimeConfig.nitro.envPrefix ?? process.env.NITRO_ENV_PREFIX ?? "_";
const _sharedRuntimeConfig = _deepFreeze(
  _applyEnv(klona(_inlineRuntimeConfig))
);
function useRuntimeConfig(event) {
  if (!event) {
    return _sharedRuntimeConfig;
  }
  if (event.context.nitro.runtimeConfig) {
    return event.context.nitro.runtimeConfig;
  }
  const runtimeConfig = klona(_inlineRuntimeConfig);
  _applyEnv(runtimeConfig);
  event.context.nitro.runtimeConfig = runtimeConfig;
  return runtimeConfig;
}
_deepFreeze(klona(appConfig));
function _getEnv(key) {
  const envKey = snakeCase(key).toUpperCase();
  return destr(
    process.env[ENV_PREFIX + envKey] ?? process.env[ENV_PREFIX_ALT + envKey]
  );
}
function _isObject(input) {
  return typeof input === "object" && !Array.isArray(input);
}
function _applyEnv(obj, parentKey = "") {
  for (const key in obj) {
    const subKey = parentKey ? `${parentKey}_${key}` : key;
    const envValue = _getEnv(subKey);
    if (_isObject(obj[key])) {
      if (_isObject(envValue)) {
        obj[key] = { ...obj[key], ...envValue };
      }
      _applyEnv(obj[key], subKey);
    } else {
      obj[key] = envValue ?? obj[key];
    }
  }
  return obj;
}
function _deepFreeze(object) {
  const propNames = Object.getOwnPropertyNames(object);
  for (const name of propNames) {
    const value = object[name];
    if (value && typeof value === "object") {
      _deepFreeze(value);
    }
  }
  return Object.freeze(object);
}
new Proxy(/* @__PURE__ */ Object.create(null), {
  get: (_, prop) => {
    console.warn(
      "Please use `useRuntimeConfig()` instead of accessing config directly."
    );
    const runtimeConfig = useRuntimeConfig();
    if (prop in runtimeConfig) {
      return runtimeConfig[prop];
    }
    return void 0;
  }
});

function wrapToPromise(value) {
  if (!value || typeof value.then !== "function") {
    return Promise.resolve(value);
  }
  return value;
}
function asyncCall(function_, ...arguments_) {
  try {
    return wrapToPromise(function_(...arguments_));
  } catch (error) {
    return Promise.reject(error);
  }
}
function isPrimitive(value) {
  const type = typeof value;
  return value === null || type !== "object" && type !== "function";
}
function isPureObject(value) {
  const proto = Object.getPrototypeOf(value);
  return !proto || proto.isPrototypeOf(Object);
}
function stringify(value) {
  if (isPrimitive(value)) {
    return String(value);
  }
  if (isPureObject(value) || Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (typeof value.toJSON === "function") {
    return stringify(value.toJSON());
  }
  throw new Error("[unstorage] Cannot stringify value!");
}
function checkBufferSupport() {
  if (typeof Buffer === void 0) {
    throw new TypeError("[unstorage] Buffer is not supported!");
  }
}
const BASE64_PREFIX = "base64:";
function serializeRaw(value) {
  if (typeof value === "string") {
    return value;
  }
  checkBufferSupport();
  const base64 = Buffer.from(value).toString("base64");
  return BASE64_PREFIX + base64;
}
function deserializeRaw(value) {
  if (typeof value !== "string") {
    return value;
  }
  if (!value.startsWith(BASE64_PREFIX)) {
    return value;
  }
  checkBufferSupport();
  return Buffer.from(value.slice(BASE64_PREFIX.length), "base64");
}

const storageKeyProperties = [
  "hasItem",
  "getItem",
  "getItemRaw",
  "setItem",
  "setItemRaw",
  "removeItem",
  "getMeta",
  "setMeta",
  "removeMeta",
  "getKeys",
  "clear",
  "mount",
  "unmount"
];
function prefixStorage(storage, base) {
  base = normalizeBaseKey(base);
  if (!base) {
    return storage;
  }
  const nsStorage = { ...storage };
  for (const property of storageKeyProperties) {
    nsStorage[property] = (key = "", ...args) => (
      // @ts-ignore
      storage[property](base + key, ...args)
    );
  }
  nsStorage.getKeys = (key = "", ...arguments_) => storage.getKeys(base + key, ...arguments_).then((keys) => keys.map((key2) => key2.slice(base.length)));
  return nsStorage;
}
function normalizeKey$1(key) {
  if (!key) {
    return "";
  }
  return key.split("?")[0].replace(/[/\\]/g, ":").replace(/:+/g, ":").replace(/^:|:$/g, "");
}
function joinKeys(...keys) {
  return normalizeKey$1(keys.join(":"));
}
function normalizeBaseKey(base) {
  base = normalizeKey$1(base);
  return base ? base + ":" : "";
}

function defineDriver$1(factory) {
  return factory;
}

const DRIVER_NAME$1 = "memory";
const memory = defineDriver$1(() => {
  const data = /* @__PURE__ */ new Map();
  return {
    name: DRIVER_NAME$1,
    options: {},
    hasItem(key) {
      return data.has(key);
    },
    getItem(key) {
      return data.get(key) ?? null;
    },
    getItemRaw(key) {
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
    setItemRaw(key, value) {
      data.set(key, value);
    },
    removeItem(key) {
      data.delete(key);
    },
    getKeys() {
      return Array.from(data.keys());
    },
    clear() {
      data.clear();
    },
    dispose() {
      data.clear();
    }
  };
});

function createStorage(options = {}) {
  const context = {
    mounts: { "": options.driver || memory() },
    mountpoints: [""],
    watching: false,
    watchListeners: [],
    unwatch: {}
  };
  const getMount = (key) => {
    for (const base of context.mountpoints) {
      if (key.startsWith(base)) {
        return {
          base,
          relativeKey: key.slice(base.length),
          driver: context.mounts[base]
        };
      }
    }
    return {
      base: "",
      relativeKey: key,
      driver: context.mounts[""]
    };
  };
  const getMounts = (base, includeParent) => {
    return context.mountpoints.filter(
      (mountpoint) => mountpoint.startsWith(base) || includeParent && base.startsWith(mountpoint)
    ).map((mountpoint) => ({
      relativeBase: base.length > mountpoint.length ? base.slice(mountpoint.length) : void 0,
      mountpoint,
      driver: context.mounts[mountpoint]
    }));
  };
  const onChange = (event, key) => {
    if (!context.watching) {
      return;
    }
    key = normalizeKey$1(key);
    for (const listener of context.watchListeners) {
      listener(event, key);
    }
  };
  const startWatch = async () => {
    if (context.watching) {
      return;
    }
    context.watching = true;
    for (const mountpoint in context.mounts) {
      context.unwatch[mountpoint] = await watch(
        context.mounts[mountpoint],
        onChange,
        mountpoint
      );
    }
  };
  const stopWatch = async () => {
    if (!context.watching) {
      return;
    }
    for (const mountpoint in context.unwatch) {
      await context.unwatch[mountpoint]();
    }
    context.unwatch = {};
    context.watching = false;
  };
  const runBatch = (items, commonOptions, cb) => {
    const batches = /* @__PURE__ */ new Map();
    const getBatch = (mount) => {
      let batch = batches.get(mount.base);
      if (!batch) {
        batch = {
          driver: mount.driver,
          base: mount.base,
          items: []
        };
        batches.set(mount.base, batch);
      }
      return batch;
    };
    for (const item of items) {
      const isStringItem = typeof item === "string";
      const key = normalizeKey$1(isStringItem ? item : item.key);
      const value = isStringItem ? void 0 : item.value;
      const options2 = isStringItem || !item.options ? commonOptions : { ...commonOptions, ...item.options };
      const mount = getMount(key);
      getBatch(mount).items.push({
        key,
        value,
        relativeKey: mount.relativeKey,
        options: options2
      });
    }
    return Promise.all([...batches.values()].map((batch) => cb(batch))).then(
      (r) => r.flat()
    );
  };
  const storage = {
    // Item
    hasItem(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      return asyncCall(driver.hasItem, relativeKey, opts);
    },
    getItem(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      return asyncCall(driver.getItem, relativeKey, opts).then(
        (value) => destr(value)
      );
    },
    getItems(items, commonOptions) {
      return runBatch(items, commonOptions, (batch) => {
        if (batch.driver.getItems) {
          return asyncCall(
            batch.driver.getItems,
            batch.items.map((item) => ({
              key: item.relativeKey,
              options: item.options
            })),
            commonOptions
          ).then(
            (r) => r.map((item) => ({
              key: joinKeys(batch.base, item.key),
              value: destr(item.value)
            }))
          );
        }
        return Promise.all(
          batch.items.map((item) => {
            return asyncCall(
              batch.driver.getItem,
              item.relativeKey,
              item.options
            ).then((value) => ({
              key: item.key,
              value: destr(value)
            }));
          })
        );
      });
    },
    getItemRaw(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (driver.getItemRaw) {
        return asyncCall(driver.getItemRaw, relativeKey, opts);
      }
      return asyncCall(driver.getItem, relativeKey, opts).then(
        (value) => deserializeRaw(value)
      );
    },
    async setItem(key, value, opts = {}) {
      if (value === void 0) {
        return storage.removeItem(key);
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (!driver.setItem) {
        return;
      }
      await asyncCall(driver.setItem, relativeKey, stringify(value), opts);
      if (!driver.watch) {
        onChange("update", key);
      }
    },
    async setItems(items, commonOptions) {
      await runBatch(items, commonOptions, async (batch) => {
        if (batch.driver.setItems) {
          await asyncCall(
            batch.driver.setItems,
            batch.items.map((item) => ({
              key: item.relativeKey,
              value: stringify(item.value),
              options: item.options
            })),
            commonOptions
          );
        }
        if (!batch.driver.setItem) {
          return;
        }
        await Promise.all(
          batch.items.map((item) => {
            return asyncCall(
              batch.driver.setItem,
              item.relativeKey,
              stringify(item.value),
              item.options
            );
          })
        );
      });
    },
    async setItemRaw(key, value, opts = {}) {
      if (value === void 0) {
        return storage.removeItem(key, opts);
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (driver.setItemRaw) {
        await asyncCall(driver.setItemRaw, relativeKey, value, opts);
      } else if (driver.setItem) {
        await asyncCall(driver.setItem, relativeKey, serializeRaw(value), opts);
      } else {
        return;
      }
      if (!driver.watch) {
        onChange("update", key);
      }
    },
    async removeItem(key, opts = {}) {
      if (typeof opts === "boolean") {
        opts = { removeMeta: opts };
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (!driver.removeItem) {
        return;
      }
      await asyncCall(driver.removeItem, relativeKey, opts);
      if (opts.removeMeta || opts.removeMata) {
        await asyncCall(driver.removeItem, relativeKey + "$", opts);
      }
      if (!driver.watch) {
        onChange("remove", key);
      }
    },
    // Meta
    async getMeta(key, opts = {}) {
      if (typeof opts === "boolean") {
        opts = { nativeOnly: opts };
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      const meta = /* @__PURE__ */ Object.create(null);
      if (driver.getMeta) {
        Object.assign(meta, await asyncCall(driver.getMeta, relativeKey, opts));
      }
      if (!opts.nativeOnly) {
        const value = await asyncCall(
          driver.getItem,
          relativeKey + "$",
          opts
        ).then((value_) => destr(value_));
        if (value && typeof value === "object") {
          if (typeof value.atime === "string") {
            value.atime = new Date(value.atime);
          }
          if (typeof value.mtime === "string") {
            value.mtime = new Date(value.mtime);
          }
          Object.assign(meta, value);
        }
      }
      return meta;
    },
    setMeta(key, value, opts = {}) {
      return this.setItem(key + "$", value, opts);
    },
    removeMeta(key, opts = {}) {
      return this.removeItem(key + "$", opts);
    },
    // Keys
    async getKeys(base, opts = {}) {
      base = normalizeBaseKey(base);
      const mounts = getMounts(base, true);
      let maskedMounts = [];
      const allKeys = [];
      for (const mount of mounts) {
        const rawKeys = await asyncCall(
          mount.driver.getKeys,
          mount.relativeBase,
          opts
        );
        const keys = rawKeys.map((key) => mount.mountpoint + normalizeKey$1(key)).filter((key) => !maskedMounts.some((p) => key.startsWith(p)));
        allKeys.push(...keys);
        maskedMounts = [
          mount.mountpoint,
          ...maskedMounts.filter((p) => !p.startsWith(mount.mountpoint))
        ];
      }
      return base ? allKeys.filter((key) => key.startsWith(base) && !key.endsWith("$")) : allKeys.filter((key) => !key.endsWith("$"));
    },
    // Utils
    async clear(base, opts = {}) {
      base = normalizeBaseKey(base);
      await Promise.all(
        getMounts(base, false).map(async (m) => {
          if (m.driver.clear) {
            return asyncCall(m.driver.clear, m.relativeBase, opts);
          }
          if (m.driver.removeItem) {
            const keys = await m.driver.getKeys(m.relativeBase || "", opts);
            return Promise.all(
              keys.map((key) => m.driver.removeItem(key, opts))
            );
          }
        })
      );
    },
    async dispose() {
      await Promise.all(
        Object.values(context.mounts).map((driver) => dispose(driver))
      );
    },
    async watch(callback) {
      await startWatch();
      context.watchListeners.push(callback);
      return async () => {
        context.watchListeners = context.watchListeners.filter(
          (listener) => listener !== callback
        );
        if (context.watchListeners.length === 0) {
          await stopWatch();
        }
      };
    },
    async unwatch() {
      context.watchListeners = [];
      await stopWatch();
    },
    // Mount
    mount(base, driver) {
      base = normalizeBaseKey(base);
      if (base && context.mounts[base]) {
        throw new Error(`already mounted at ${base}`);
      }
      if (base) {
        context.mountpoints.push(base);
        context.mountpoints.sort((a, b) => b.length - a.length);
      }
      context.mounts[base] = driver;
      if (context.watching) {
        Promise.resolve(watch(driver, onChange, base)).then((unwatcher) => {
          context.unwatch[base] = unwatcher;
        }).catch(console.error);
      }
      return storage;
    },
    async unmount(base, _dispose = true) {
      base = normalizeBaseKey(base);
      if (!base || !context.mounts[base]) {
        return;
      }
      if (context.watching && base in context.unwatch) {
        context.unwatch[base]();
        delete context.unwatch[base];
      }
      if (_dispose) {
        await dispose(context.mounts[base]);
      }
      context.mountpoints = context.mountpoints.filter((key) => key !== base);
      delete context.mounts[base];
    },
    getMount(key = "") {
      key = normalizeKey$1(key) + ":";
      const m = getMount(key);
      return {
        driver: m.driver,
        base: m.base
      };
    },
    getMounts(base = "", opts = {}) {
      base = normalizeKey$1(base);
      const mounts = getMounts(base, opts.parents);
      return mounts.map((m) => ({
        driver: m.driver,
        base: m.mountpoint
      }));
    }
  };
  return storage;
}
function watch(driver, onChange, base) {
  return driver.watch ? driver.watch((event, key) => onChange(event, base + key)) : () => {
  };
}
async function dispose(driver) {
  if (typeof driver.dispose === "function") {
    await asyncCall(driver.dispose);
  }
}

const _assets = {

};

const normalizeKey = function normalizeKey(key) {
  if (!key) {
    return "";
  }
  return key.split("?")[0].replace(/[/\\]/g, ":").replace(/:+/g, ":").replace(/^:|:$/g, "");
};

const assets$1 = {
  getKeys() {
    return Promise.resolve(Object.keys(_assets))
  },
  hasItem (id) {
    id = normalizeKey(id);
    return Promise.resolve(id in _assets)
  },
  getItem (id) {
    id = normalizeKey(id);
    return Promise.resolve(_assets[id] ? _assets[id].import() : null)
  },
  getMeta (id) {
    id = normalizeKey(id);
    return Promise.resolve(_assets[id] ? _assets[id].meta : {})
  }
};

function defineDriver(factory) {
  return factory;
}
function createError(driver, message, opts) {
  const err = new Error(`[unstorage] [${driver}] ${message}`, opts);
  return err;
}
function createRequiredError(driver, name) {
  if (Array.isArray(name)) {
    return createError(
      driver,
      `Missing some of the required options ${name.map((n) => "`" + n + "`").join(", ")}`
    );
  }
  return createError(driver, `Missing required option \`${name}\`.`);
}

function ignoreNotfound(err) {
  return err.code === "ENOENT" || err.code === "EISDIR" ? null : err;
}
function ignoreExists(err) {
  return err.code === "EEXIST" ? null : err;
}
async function writeFile(path, data, encoding) {
  await ensuredir(dirname$1(path));
  return promises.writeFile(path, data, encoding);
}
function readFile(path, encoding) {
  return promises.readFile(path, encoding).catch(ignoreNotfound);
}
function unlink(path) {
  return promises.unlink(path).catch(ignoreNotfound);
}
function readdir(dir) {
  return promises.readdir(dir, { withFileTypes: true }).catch(ignoreNotfound).then((r) => r || []);
}
async function ensuredir(dir) {
  if (existsSync(dir)) {
    return;
  }
  await ensuredir(dirname$1(dir)).catch(ignoreExists);
  await promises.mkdir(dir).catch(ignoreExists);
}
async function readdirRecursive(dir, ignore) {
  if (ignore && ignore(dir)) {
    return [];
  }
  const entries = await readdir(dir);
  const files = [];
  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = resolve$1(dir, entry.name);
      if (entry.isDirectory()) {
        const dirFiles = await readdirRecursive(entryPath, ignore);
        files.push(...dirFiles.map((f) => entry.name + "/" + f));
      } else {
        if (!(ignore && ignore(entry.name))) {
          files.push(entry.name);
        }
      }
    })
  );
  return files;
}
async function rmRecursive(dir) {
  const entries = await readdir(dir);
  await Promise.all(
    entries.map((entry) => {
      const entryPath = resolve$1(dir, entry.name);
      if (entry.isDirectory()) {
        return rmRecursive(entryPath).then(() => promises.rmdir(entryPath));
      } else {
        return promises.unlink(entryPath);
      }
    })
  );
}

const PATH_TRAVERSE_RE = /\.\.\:|\.\.$/;
const DRIVER_NAME = "fs-lite";
const unstorage_47drivers_47fs_45lite = defineDriver((opts = {}) => {
  if (!opts.base) {
    throw createRequiredError(DRIVER_NAME, "base");
  }
  opts.base = resolve$1(opts.base);
  const r = (key) => {
    if (PATH_TRAVERSE_RE.test(key)) {
      throw createError(
        DRIVER_NAME,
        `Invalid key: ${JSON.stringify(key)}. It should not contain .. segments`
      );
    }
    const resolved = join(opts.base, key.replace(/:/g, "/"));
    return resolved;
  };
  return {
    name: DRIVER_NAME,
    options: opts,
    hasItem(key) {
      return existsSync(r(key));
    },
    getItem(key) {
      return readFile(r(key), "utf8");
    },
    getItemRaw(key) {
      return readFile(r(key));
    },
    async getMeta(key) {
      const { atime, mtime, size, birthtime, ctime } = await promises.stat(r(key)).catch(() => ({}));
      return { atime, mtime, size, birthtime, ctime };
    },
    setItem(key, value) {
      if (opts.readOnly) {
        return;
      }
      return writeFile(r(key), value, "utf8");
    },
    setItemRaw(key, value) {
      if (opts.readOnly) {
        return;
      }
      return writeFile(r(key), value);
    },
    removeItem(key) {
      if (opts.readOnly) {
        return;
      }
      return unlink(r(key));
    },
    getKeys() {
      return readdirRecursive(r("."), opts.ignore);
    },
    async clear() {
      if (opts.readOnly || opts.noClear) {
        return;
      }
      await rmRecursive(r("."));
    }
  };
});

const storage = createStorage({});

storage.mount('/assets', assets$1);

storage.mount('data', unstorage_47drivers_47fs_45lite({"driver":"fsLite","base":"/Users/lourdesmarco/disenadoras/.data/kv"}));

function useStorage(base = "") {
  return base ? prefixStorage(storage, base) : storage;
}

const defaultCacheOptions = {
  name: "_",
  base: "/cache",
  swr: true,
  maxAge: 1
};
function defineCachedFunction(fn, opts = {}) {
  opts = { ...defaultCacheOptions, ...opts };
  const pending = {};
  const group = opts.group || "nitro/functions";
  const name = opts.name || fn.name || "_";
  const integrity = opts.integrity || hash([fn, opts]);
  const validate = opts.validate || ((entry) => entry.value !== void 0);
  async function get(key, resolver, shouldInvalidateCache, event) {
    const cacheKey = [opts.base, group, name, key + ".json"].filter(Boolean).join(":").replace(/:\/$/, ":index");
    const entry = await useStorage().getItem(cacheKey) || {};
    const ttl = (opts.maxAge ?? opts.maxAge ?? 0) * 1e3;
    if (ttl) {
      entry.expires = Date.now() + ttl;
    }
    const expired = shouldInvalidateCache || entry.integrity !== integrity || ttl && Date.now() - (entry.mtime || 0) > ttl || validate(entry) === false;
    const _resolve = async () => {
      const isPending = pending[key];
      if (!isPending) {
        if (entry.value !== void 0 && (opts.staleMaxAge || 0) >= 0 && opts.swr === false) {
          entry.value = void 0;
          entry.integrity = void 0;
          entry.mtime = void 0;
          entry.expires = void 0;
        }
        pending[key] = Promise.resolve(resolver());
      }
      try {
        entry.value = await pending[key];
      } catch (error) {
        if (!isPending) {
          delete pending[key];
        }
        throw error;
      }
      if (!isPending) {
        entry.mtime = Date.now();
        entry.integrity = integrity;
        delete pending[key];
        if (validate(entry) !== false) {
          const promise = useStorage().setItem(cacheKey, entry).catch((error) => {
            console.error(`[nitro] [cache] Cache write error.`, error);
            useNitroApp().captureError(error, { event, tags: ["cache"] });
          });
          if (event && event.waitUntil) {
            event.waitUntil(promise);
          }
        }
      }
    };
    const _resolvePromise = expired ? _resolve() : Promise.resolve();
    if (entry.value === void 0) {
      await _resolvePromise;
    } else if (expired && event && event.waitUntil) {
      event.waitUntil(_resolvePromise);
    }
    if (opts.swr && validate(entry) !== false) {
      _resolvePromise.catch((error) => {
        console.error(`[nitro] [cache] SWR handler error.`, error);
        useNitroApp().captureError(error, { event, tags: ["cache"] });
      });
      return entry;
    }
    return _resolvePromise.then(() => entry);
  }
  return async (...args) => {
    const shouldBypassCache = opts.shouldBypassCache?.(...args);
    if (shouldBypassCache) {
      return fn(...args);
    }
    const key = await (opts.getKey || getKey)(...args);
    const shouldInvalidateCache = opts.shouldInvalidateCache?.(...args);
    const entry = await get(
      key,
      () => fn(...args),
      shouldInvalidateCache,
      args[0] && isEvent(args[0]) ? args[0] : void 0
    );
    let value = entry.value;
    if (opts.transform) {
      value = await opts.transform(entry, ...args) || value;
    }
    return value;
  };
}
const cachedFunction = defineCachedFunction;
function getKey(...args) {
  return args.length > 0 ? hash(args, {}) : "";
}
function escapeKey(key) {
  return String(key).replace(/\W/g, "");
}
function defineCachedEventHandler(handler, opts = defaultCacheOptions) {
  const variableHeaderNames = (opts.varies || []).filter(Boolean).map((h) => h.toLowerCase()).sort();
  const _opts = {
    ...opts,
    getKey: async (event) => {
      const customKey = await opts.getKey?.(event);
      if (customKey) {
        return escapeKey(customKey);
      }
      const _path = event.node.req.originalUrl || event.node.req.url || event.path;
      const _pathname = escapeKey(decodeURI(parseURL(_path).pathname)).slice(0, 16) || "index";
      const _hashedPath = `${_pathname}.${hash(_path)}`;
      const _headers = variableHeaderNames.map((header) => [header, event.node.req.headers[header]]).map(([name, value]) => `${escapeKey(name)}.${hash(value)}`);
      return [_hashedPath, ..._headers].join(":");
    },
    validate: (entry) => {
      if (!entry.value) {
        return false;
      }
      if (entry.value.code >= 400) {
        return false;
      }
      if (entry.value.body === void 0) {
        return false;
      }
      if (entry.value.headers.etag === "undefined" || entry.value.headers["last-modified"] === "undefined") {
        return false;
      }
      return true;
    },
    group: opts.group || "nitro/handlers",
    integrity: opts.integrity || hash([handler, opts])
  };
  const _cachedHandler = cachedFunction(
    async (incomingEvent) => {
      const variableHeaders = {};
      for (const header of variableHeaderNames) {
        variableHeaders[header] = incomingEvent.node.req.headers[header];
      }
      const reqProxy = cloneWithProxy(incomingEvent.node.req, {
        headers: variableHeaders
      });
      const resHeaders = {};
      let _resSendBody;
      const resProxy = cloneWithProxy(incomingEvent.node.res, {
        statusCode: 200,
        writableEnded: false,
        writableFinished: false,
        headersSent: false,
        closed: false,
        getHeader(name) {
          return resHeaders[name];
        },
        setHeader(name, value) {
          resHeaders[name] = value;
          return this;
        },
        getHeaderNames() {
          return Object.keys(resHeaders);
        },
        hasHeader(name) {
          return name in resHeaders;
        },
        removeHeader(name) {
          delete resHeaders[name];
        },
        getHeaders() {
          return resHeaders;
        },
        end(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2();
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return this;
        },
        write(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2();
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return this;
        },
        writeHead(statusCode, headers2) {
          this.statusCode = statusCode;
          if (headers2) {
            for (const header in headers2) {
              this.setHeader(header, headers2[header]);
            }
          }
          return this;
        }
      });
      const event = createEvent(reqProxy, resProxy);
      event.context = incomingEvent.context;
      const body = await handler(event) || _resSendBody;
      const headers = event.node.res.getHeaders();
      headers.etag = String(
        headers.Etag || headers.etag || `W/"${hash(body)}"`
      );
      headers["last-modified"] = String(
        headers["Last-Modified"] || headers["last-modified"] || (/* @__PURE__ */ new Date()).toUTCString()
      );
      const cacheControl = [];
      if (opts.swr) {
        if (opts.maxAge) {
          cacheControl.push(`s-maxage=${opts.maxAge}`);
        }
        if (opts.staleMaxAge) {
          cacheControl.push(`stale-while-revalidate=${opts.staleMaxAge}`);
        } else {
          cacheControl.push("stale-while-revalidate");
        }
      } else if (opts.maxAge) {
        cacheControl.push(`max-age=${opts.maxAge}`);
      }
      if (cacheControl.length > 0) {
        headers["cache-control"] = cacheControl.join(", ");
      }
      const cacheEntry = {
        code: event.node.res.statusCode,
        headers,
        body
      };
      return cacheEntry;
    },
    _opts
  );
  return defineEventHandler(async (event) => {
    if (opts.headersOnly) {
      if (handleCacheHeaders(event, { maxAge: opts.maxAge })) {
        return;
      }
      return handler(event);
    }
    const response = await _cachedHandler(event);
    if (event.node.res.headersSent || event.node.res.writableEnded) {
      return response.body;
    }
    if (handleCacheHeaders(event, {
      modifiedTime: new Date(response.headers["last-modified"]),
      etag: response.headers.etag,
      maxAge: opts.maxAge
    })) {
      return;
    }
    event.node.res.statusCode = response.code;
    for (const name in response.headers) {
      const value = response.headers[name];
      if (name === "set-cookie") {
        event.node.res.appendHeader(
          name,
          splitCookiesString(value)
        );
      } else {
        event.node.res.setHeader(name, value);
      }
    }
    return response.body;
  });
}
function cloneWithProxy(obj, overrides) {
  return new Proxy(obj, {
    get(target, property, receiver) {
      if (property in overrides) {
        return overrides[property];
      }
      return Reflect.get(target, property, receiver);
    },
    set(target, property, value, receiver) {
      if (property in overrides) {
        overrides[property] = value;
        return true;
      }
      return Reflect.set(target, property, value, receiver);
    }
  });
}
const cachedEventHandler = defineCachedEventHandler;

function hasReqHeader(event, name, includes) {
  const value = getRequestHeader(event, name);
  return value && typeof value === "string" && value.toLowerCase().includes(includes);
}
function isJsonRequest(event) {
  if (hasReqHeader(event, "accept", "text/html")) {
    return false;
  }
  return hasReqHeader(event, "accept", "application/json") || hasReqHeader(event, "user-agent", "curl/") || hasReqHeader(event, "user-agent", "httpie/") || hasReqHeader(event, "sec-fetch-mode", "cors") || event.path.startsWith("/api/") || event.path.endsWith(".json");
}
function normalizeError(error) {
  const cwd = typeof process.cwd === "function" ? process.cwd() : "/";
  const stack = (error.stack || "").split("\n").splice(1).filter((line) => line.includes("at ")).map((line) => {
    const text = line.replace(cwd + "/", "./").replace("webpack:/", "").replace("file://", "").trim();
    return {
      text,
      internal: line.includes("node_modules") && !line.includes(".cache") || line.includes("internal") || line.includes("new Promise")
    };
  });
  const statusCode = error.statusCode || 500;
  const statusMessage = error.statusMessage ?? (statusCode === 404 ? "Not Found" : "");
  const message = error.message || error.toString();
  return {
    stack,
    statusCode,
    statusMessage,
    message
  };
}
function _captureError(error, type) {
  console.error(`[nitro] [${type}]`, error);
  useNitroApp().captureError(error, { tags: [type] });
}
function trapUnhandledNodeErrors() {
  process.on(
    "unhandledRejection",
    (error) => _captureError(error, "unhandledRejection")
  );
  process.on(
    "uncaughtException",
    (error) => _captureError(error, "uncaughtException")
  );
}
function joinHeaders(value) {
  return Array.isArray(value) ? value.join(", ") : String(value);
}
function normalizeFetchResponse(response) {
  if (!response.headers.has("set-cookie")) {
    return response;
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: normalizeCookieHeaders(response.headers)
  });
}
function normalizeCookieHeader(header = "") {
  return splitCookiesString(joinHeaders(header));
}
function normalizeCookieHeaders(headers) {
  const outgoingHeaders = new Headers();
  for (const [name, header] of headers) {
    if (name === "set-cookie") {
      for (const cookie of normalizeCookieHeader(header)) {
        outgoingHeaders.append("set-cookie", cookie);
      }
    } else {
      outgoingHeaders.set(name, joinHeaders(header));
    }
  }
  return outgoingHeaders;
}

const config = useRuntimeConfig();
const _routeRulesMatcher = toRouteMatcher(
  createRouter$1({ routes: config.nitro.routeRules })
);
function createRouteRulesHandler(ctx) {
  return eventHandler((event) => {
    const routeRules = getRouteRules(event);
    if (routeRules.headers) {
      setHeaders(event, routeRules.headers);
    }
    if (routeRules.redirect) {
      return sendRedirect(
        event,
        routeRules.redirect.to,
        routeRules.redirect.statusCode
      );
    }
    if (routeRules.proxy) {
      let target = routeRules.proxy.to;
      if (target.endsWith("/**")) {
        let targetPath = event.path;
        const strpBase = routeRules.proxy._proxyStripBase;
        if (strpBase) {
          targetPath = withoutBase(targetPath, strpBase);
        }
        target = joinURL(target.slice(0, -3), targetPath);
      } else if (event.path.includes("?")) {
        const query = getQuery$1(event.path);
        target = withQuery(target, query);
      }
      return proxyRequest(event, target, {
        fetch: ctx.localFetch,
        ...routeRules.proxy
      });
    }
  });
}
function getRouteRules(event) {
  event.context._nitro = event.context._nitro || {};
  if (!event.context._nitro.routeRules) {
    event.context._nitro.routeRules = getRouteRulesForPath(
      withoutBase(event.path.split("?")[0], useRuntimeConfig().app.baseURL)
    );
  }
  return event.context._nitro.routeRules;
}
function getRouteRulesForPath(path) {
  return defu({}, ..._routeRulesMatcher.matchAll(path).reverse());
}

const plugins = [
  
];

const errorHandler = (async function errorhandler(_error, event) {
  const { stack, statusCode, statusMessage, message } = normalizeError(_error);
  const errorObject = {
    url: event.node.req.url,
    statusCode,
    statusMessage,
    message,
    stack: "",
    data: _error.data
  };
  setResponseStatus(event, errorObject.statusCode !== 200 && errorObject.statusCode || 500, errorObject.statusMessage);
  if (_error.unhandled || _error.fatal) {
    const tags = [
      "[nuxt]",
      "[request error]",
      _error.unhandled && "[unhandled]",
      _error.fatal && "[fatal]",
      Number(errorObject.statusCode) !== 200 && `[${errorObject.statusCode}]`
    ].filter(Boolean).join(" ");
    console.error(tags, errorObject.message + "\n" + stack.map((l) => "  " + l.text).join("  \n"));
  }
  if (isJsonRequest(event)) {
    event.node.res.setHeader("Content-Type", "application/json");
    event.node.res.end(JSON.stringify(errorObject));
    return;
  }
  const isErrorPage = event.node.req.url?.startsWith("/__nuxt_error");
  const res = !isErrorPage ? await useNitroApp().localFetch(withQuery(joinURL(useRuntimeConfig().app.baseURL, "/__nuxt_error"), errorObject), {
    headers: getRequestHeaders(event),
    redirect: "manual"
  }).catch(() => null) : null;
  if (!res) {
    const { template } = await import('../error-500.mjs');
    setResponseHeader(event, "Content-Type", "text/html;charset=UTF-8");
    event.node.res.end(template(errorObject));
    return;
  }
  for (const [header, value] of res.headers.entries()) {
    setResponseHeader(event, header, value);
  }
  setResponseStatus(event, res.status && res.status !== 200 ? res.status : void 0, res.statusText);
  event.node.res.end(await res.text());
});

const assets = {
  "/.nojekyll": {
    "type": "text/plain; charset=utf-8",
    "etag": "\"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk\"",
    "mtime": "2024-01-29T18:38:58.600Z",
    "size": 0,
    "path": "../public/.nojekyll"
  },
  "/200.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"4ee-oH8YN9VaE54xGFRwKtbT+Nvg9Lw\"",
    "mtime": "2024-01-29T18:39:02.558Z",
    "size": 1262,
    "path": "../public/200.html"
  },
  "/favicon.ico": {
    "type": "image/vnd.microsoft.icon",
    "etag": "\"21bc-XwkmumvsWAWQvKTShmzlcL3xoys\"",
    "mtime": "2024-01-29T18:38:58.483Z",
    "size": 8636,
    "path": "../public/favicon.ico"
  },
  "/index.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"4ee-oH8YN9VaE54xGFRwKtbT+Nvg9Lw\"",
    "mtime": "2024-01-29T18:39:02.546Z",
    "size": 1262,
    "path": "../public/index.html"
  },
  "/0listIcons/.DS_Store": {
    "type": "text/plain; charset=utf-8",
    "etag": "\"1804-bs5bhrJI4x84e/XrfCzSvl5rDro\"",
    "mtime": "2024-01-29T18:38:58.586Z",
    "size": 6148,
    "path": "../public/0listIcons/.DS_Store"
  },
  "/0listIcons/grafico.svg": {
    "type": "image/svg+xml",
    "etag": "\"134-bdhQcVJCuCu8NZsfWdqD4frNKjQ\"",
    "mtime": "2024-01-29T18:38:58.585Z",
    "size": 308,
    "path": "../public/0listIcons/grafico.svg"
  },
  "/0listIcons/interiores.svg": {
    "type": "image/svg+xml",
    "etag": "\"2ef-2xE2s2GJKgYeUsqy58t1ZQc79uI\"",
    "mtime": "2024-01-29T18:38:58.584Z",
    "size": 751,
    "path": "../public/0listIcons/interiores.svg"
  },
  "/0listIcons/moda.svg": {
    "type": "image/svg+xml",
    "etag": "\"190-UTKEyt5gKWPdMV0ikiAVsqTJ8Pk\"",
    "mtime": "2024-01-29T18:38:58.583Z",
    "size": 400,
    "path": "../public/0listIcons/moda.svg"
  },
  "/0listIcons/producto.svg": {
    "type": "image/svg+xml",
    "etag": "\"16e-vZu0TCWDRoOzuwf2m4aVmBRQUDk\"",
    "mtime": "2024-01-29T18:38:58.582Z",
    "size": 366,
    "path": "../public/0listIcons/producto.svg"
  },
  "/_nuxt/0db1ab4.js": {
    "type": "application/javascript",
    "etag": "\"20e2-lcwMUqytjZMSj+Gk2kujaiv4skY\"",
    "mtime": "2024-01-29T18:38:58.599Z",
    "size": 8418,
    "path": "../public/_nuxt/0db1ab4.js"
  },
  "/_nuxt/4e9248b.js": {
    "type": "application/javascript",
    "etag": "\"ac3-MGS0scZWTU4AjfoWHj4svHk058Y\"",
    "mtime": "2024-01-29T18:38:58.598Z",
    "size": 2755,
    "path": "../public/_nuxt/4e9248b.js"
  },
  "/_nuxt/647873f.js": {
    "type": "application/javascript",
    "etag": "\"968-WSjVuiHWAx22nluGzgNq8zs1Kas\"",
    "mtime": "2024-01-29T18:38:58.597Z",
    "size": 2408,
    "path": "../public/_nuxt/647873f.js"
  },
  "/_nuxt/8f951cc.js": {
    "type": "application/javascript",
    "etag": "\"2ffbf-YsBwwBfMwtmtfJOykATaaJz13mk\"",
    "mtime": "2024-01-29T18:38:58.596Z",
    "size": 196543,
    "path": "../public/_nuxt/8f951cc.js"
  },
  "/_nuxt/LICENSES": {
    "type": "text/plain; charset=utf-8",
    "etag": "\"216-F7qr66gEB4aBiUMirCzRrfXbg4w\"",
    "mtime": "2024-01-29T18:38:58.595Z",
    "size": 534,
    "path": "../public/_nuxt/LICENSES"
  },
  "/_nuxt/b22d45a.js": {
    "type": "application/javascript",
    "etag": "\"88b-ypcuGMeySRM3klMMMY39scLZU0A\"",
    "mtime": "2024-01-29T18:38:58.594Z",
    "size": 2187,
    "path": "../public/_nuxt/b22d45a.js"
  },
  "/_nuxt/b817ddc.js": {
    "type": "application/javascript",
    "etag": "\"48038-uqU5OfmnY6zsyShZ9b+UK3Lq1Ik\"",
    "mtime": "2024-01-29T18:38:58.593Z",
    "size": 294968,
    "path": "../public/_nuxt/b817ddc.js"
  },
  "/_nuxt/b9774b4.js": {
    "type": "application/javascript",
    "etag": "\"12cd-Xgbcboc8nOPPFCGWfSAO0791Frc\"",
    "mtime": "2024-01-29T18:38:58.591Z",
    "size": 4813,
    "path": "../public/_nuxt/b9774b4.js"
  },
  "/_nuxt/c6dd492.js": {
    "type": "application/javascript",
    "etag": "\"1060-/qELB4K/rK6x2qODw2n32zGY+oQ\"",
    "mtime": "2024-01-29T18:38:58.590Z",
    "size": 4192,
    "path": "../public/_nuxt/c6dd492.js"
  },
  "/_nuxt/f10da40.js": {
    "type": "application/javascript",
    "etag": "\"1a5b-vfUlQ03z+Nu3MoIRK6jm67YOpcg\"",
    "mtime": "2024-01-29T18:38:58.589Z",
    "size": 6747,
    "path": "../public/_nuxt/f10da40.js"
  },
  "/_nuxt/ff54791.js": {
    "type": "application/javascript",
    "etag": "\"776-C3HjbWgBZ8GzQJ0q9XM+osiOUS0\"",
    "mtime": "2024-01-29T18:38:58.588Z",
    "size": 1910,
    "path": "../public/_nuxt/ff54791.js"
  },
  "/annesophie_oberkrome_mario/index.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"5c0-iteV2pz3BT9c49j/JojPD70sDzo\"",
    "mtime": "2024-01-29T18:38:58.538Z",
    "size": 1472,
    "path": "../public/annesophie_oberkrome_mario/index.html"
  },
  "/emilia_wickstead_laura/index.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"1fc4-09f358oJofJoZHESMbGdRi4j1z0\"",
    "mtime": "2024-01-29T18:38:58.486Z",
    "size": 8132,
    "path": "../public/emilia_wickstead_laura/index.html"
  },
  "/gae_aulenti_marina/index.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"2622-UcJes8YT+U1XVZroSu5AL1dJFmg\"",
    "mtime": "2024-01-29T18:38:58.379Z",
    "size": 9762,
    "path": "../public/gae_aulenti_marina/index.html"
  },
  "/ilse_crawford_diego/index.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"61e-2RhyB7Q2JdAANpElsJFUG5/nHIU\"",
    "mtime": "2024-01-29T18:38:58.362Z",
    "size": 1566,
    "path": "../public/ilse_crawford_diego/index.html"
  },
  "/india_maldhavi_luna/index.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"1777-KQlO6JyDJDpC9wXpoGjlF5CJRoA\"",
    "mtime": "2024-01-29T18:38:58.310Z",
    "size": 6007,
    "path": "../public/india_maldhavi_luna/index.html"
  },
  "/iris_apfel_marta/index.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"113c-ObWEGp42Gfqv8Gm3NdueRiImtaE\"",
    "mtime": "2024-01-29T18:38:58.254Z",
    "size": 4412,
    "path": "../public/iris_apfel_marta/index.html"
  },
  "/kelly_wearstler_virginia/index.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"3bd-P9phmCMOkREf9VCglE5gqPrF27Q\"",
    "mtime": "2024-01-29T18:38:58.220Z",
    "size": 957,
    "path": "../public/kelly_wearstler_virginia/index.html"
  },
  "/lina_bobardi_irene/index.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"28df-y9obQR2OvW9wvl9TixiNWKUfdjs\"",
    "mtime": "2024-01-29T18:38:58.155Z",
    "size": 10463,
    "path": "../public/lina_bobardi_irene/index.html"
  },
  "/lotta_agaton_clara/index.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"95e-9WXymVKUpa0tS8z6+6+4ln5rQCc\"",
    "mtime": "2024-01-29T18:38:58.095Z",
    "size": 2398,
    "path": "../public/lotta_agaton_clara/index.html"
  },
  "/matali_crasset_carolina/index.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"394b-QCJFMe/IwewfXK9hO4fUufO+JIs\"",
    "mtime": "2024-01-29T18:38:58.045Z",
    "size": 14667,
    "path": "../public/matali_crasset_carolina/index.html"
  },
  "/nani_marquina_david/index.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"ad3-w1oEwyWO1PA2IypYxx7NPE9zSw4\"",
    "mtime": "2024-01-29T18:38:58.031Z",
    "size": 2771,
    "path": "../public/nani_marquina_david/index.html"
  },
  "/nanna_ditzel_carla/index.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"297c-ZCd6dDEGCXdvo0q6hbUwF5dpjV0\"",
    "mtime": "2024-01-29T18:38:57.990Z",
    "size": 10620,
    "path": "../public/nanna_ditzel_carla/index.html"
  },
  "/patricia_urquiola_angel/index.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"27e5-tSiT5VQUs2+NI6EbPQgFRRf7ozU\"",
    "mtime": "2024-01-29T18:38:57.968Z",
    "size": 10213,
    "path": "../public/patricia_urquiola_angel/index.html"
  },
  "/reiko_tanabe_saul/index.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"ed8-qvNQGRzg7jeCKJrc4h9nok3QJtU\"",
    "mtime": "2024-01-29T18:38:57.949Z",
    "size": 3800,
    "path": "../public/reiko_tanabe_saul/index.html"
  },
  "/vivienne_westwood_sandra/index.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"ca7-w1zR+lJB2CLFax71qYhA3BnvVAE\"",
    "mtime": "2024-01-29T18:38:57.872Z",
    "size": 3239,
    "path": "../public/vivienne_westwood_sandra/index.html"
  },
  "/annesophie_oberkrome_mario/Pages/cafefranklin.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"a52-0ztBRIzvSNOFhpY8vDc1THyypQo\"",
    "mtime": "2024-01-29T18:38:58.550Z",
    "size": 2642,
    "path": "../public/annesophie_oberkrome_mario/Pages/cafefranklin.html"
  },
  "/annesophie_oberkrome_mario/Pages/formulario.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"595-DI+AQdyPvmez2Rk6MnoKVFpuNmM\"",
    "mtime": "2024-01-29T18:38:58.549Z",
    "size": 1429,
    "path": "../public/annesophie_oberkrome_mario/Pages/formulario.html"
  },
  "/annesophie_oberkrome_mario/Pages/info.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"fa6-OGI/wlxdC6E9NbrGnqs0gRxaADY\"",
    "mtime": "2024-01-29T18:38:58.548Z",
    "size": 4006,
    "path": "../public/annesophie_oberkrome_mario/Pages/info.html"
  },
  "/annesophie_oberkrome_mario/Pages/lamparanorman.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"b5d-eUkbiX81DPsl1jtl3A0xIpKUt90\"",
    "mtime": "2024-01-29T18:38:58.547Z",
    "size": 2909,
    "path": "../public/annesophie_oberkrome_mario/Pages/lamparanorman.html"
  },
  "/annesophie_oberkrome_mario/Pages/obras.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"991-lO6KxOuRJ/o7rPRnobkJuXQO9Io\"",
    "mtime": "2024-01-29T18:38:58.545Z",
    "size": 2449,
    "path": "../public/annesophie_oberkrome_mario/Pages/obras.html"
  },
  "/annesophie_oberkrome_mario/Pages/sillaneil.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"bb8-FbLPzoueeXugNGykpNxMDFUZQg8\"",
    "mtime": "2024-01-29T18:38:58.545Z",
    "size": 3000,
    "path": "../public/annesophie_oberkrome_mario/Pages/sillaneil.html"
  },
  "/annesophie_oberkrome_mario/Pages/sillawillow.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"a94-tTD8b0+84jJip/hdBGYCQtRGSak\"",
    "mtime": "2024-01-29T18:38:58.543Z",
    "size": 2708,
    "path": "../public/annesophie_oberkrome_mario/Pages/sillawillow.html"
  },
  "/annesophie_oberkrome_mario/Pages/social.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"912-phiOxBmJnp1eecZdp6f/TxDcTI4\"",
    "mtime": "2024-01-29T18:38:58.541Z",
    "size": 2322,
    "path": "../public/annesophie_oberkrome_mario/Pages/social.html"
  },
  "/gae_aulenti_marina/pages/page1.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"1c85-TJ+PalCwXUzQfUroMCdoQVDDYJA\"",
    "mtime": "2024-01-29T18:38:58.378Z",
    "size": 7301,
    "path": "../public/gae_aulenti_marina/pages/page1.html"
  },
  "/ilse_crawford_diego/investigacion/InvestigaciขnIlseCrawford_DiegodePaz.pdf": {
    "type": "application/pdf",
    "etag": "\"e504-acgpPORM/y2NlNhj9bsGB0Fa5O4\"",
    "mtime": "2024-01-29T18:38:58.360Z",
    "size": 58628,
    "path": "../public/ilse_crawford_diego/investigacion/InvestigaciขnIlseCrawford_DiegodePaz.pdf"
  },
  "/ilse_crawford_diego/pages/about.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"10ae-a4brp4HQsPXu+BEpAKM9tPFOrHQ\"",
    "mtime": "2024-01-29T18:38:58.356Z",
    "size": 4270,
    "path": "../public/ilse_crawford_diego/pages/about.html"
  },
  "/ilse_crawford_diego/pages/cathay_pacific.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"ddb-mu3H7ZYNYnBs+SAm8XZoBk9qsHg\"",
    "mtime": "2024-01-29T18:38:58.356Z",
    "size": 3547,
    "path": "../public/ilse_crawford_diego/pages/cathay_pacific.html"
  },
  "/ilse_crawford_diego/pages/contacto.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"ada-xdgHNDxvVubhJBimaFdpSgUXU34\"",
    "mtime": "2024-01-29T18:38:58.355Z",
    "size": 2778,
    "path": "../public/ilse_crawford_diego/pages/contacto.html"
  },
  "/ilse_crawford_diego/pages/duddells_art_club.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"e04-+oljwF10Xoc5uZqxlLqBMzsdcX4\"",
    "mtime": "2024-01-29T18:38:58.354Z",
    "size": 3588,
    "path": "../public/ilse_crawford_diego/pages/duddells_art_club.html"
  },
  "/ilse_crawford_diego/pages/embassy_house.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"d49-gXAsLtdlpLGxxXa4KPFjtM5Eda8\"",
    "mtime": "2024-01-29T18:38:58.353Z",
    "size": 3401,
    "path": "../public/ilse_crawford_diego/pages/embassy_house.html"
  },
  "/ilse_crawford_diego/pages/lamparas.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"d88-0oEla3r+B/4/gOsyU4vTzJj6MEA\"",
    "mtime": "2024-01-29T18:38:58.352Z",
    "size": 3464,
    "path": "../public/ilse_crawford_diego/pages/lamparas.html"
  },
  "/ilse_crawford_diego/pages/proyectos.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"cb3-1Tl0n/8lfz/qgGZgRls5rUqihkg\"",
    "mtime": "2024-01-29T18:38:58.351Z",
    "size": 3251,
    "path": "../public/ilse_crawford_diego/pages/proyectos.html"
  },
  "/ilse_crawford_diego/pages/soho_house.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"ee8-hI8NjWvLwaaP7sWgo8trukVih8c\"",
    "mtime": "2024-01-29T18:38:58.350Z",
    "size": 3816,
    "path": "../public/ilse_crawford_diego/pages/soho_house.html"
  },
  "/india_maldhavi_luna/pages/pagina2.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"d95-CAvHcS0W4IL3iXnBxJVLFh5K8EA\"",
    "mtime": "2024-01-29T18:38:58.309Z",
    "size": 3477,
    "path": "../public/india_maldhavi_luna/pages/pagina2.html"
  },
  "/india_maldhavi_luna/pages/pagina3.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"9c5-orqBROiuTs8tleOnjIeRxRXkvA8\"",
    "mtime": "2024-01-29T18:38:58.306Z",
    "size": 2501,
    "path": "../public/india_maldhavi_luna/pages/pagina3.html"
  },
  "/iris_apfel_marta/pages/bio.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"180e-SK4zb1MXYVFquKx0K83vBPQxxis\"",
    "mtime": "2024-01-29T18:38:58.253Z",
    "size": 6158,
    "path": "../public/iris_apfel_marta/pages/bio.html"
  },
  "/iris_apfel_marta/pages/reflexión.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"1252-x7xN3E8+Bqrl001sLl5eZqS4Evc\"",
    "mtime": "2024-01-29T18:38:58.253Z",
    "size": 4690,
    "path": "../public/iris_apfel_marta/pages/reflexión.html"
  },
  "/iris_apfel_marta/pages/trayectoria.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"2351-dNHUm2TZpubhABIIcYgM9+0HlkQ\"",
    "mtime": "2024-01-29T18:38:58.252Z",
    "size": 9041,
    "path": "../public/iris_apfel_marta/pages/trayectoria.html"
  },
  "/kelly_wearstler_virginia/pages/asociaciones.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"2e9-CgolrHldnfXfyhuRJ9lFkvUWnhE\"",
    "mtime": "2024-01-29T18:38:58.219Z",
    "size": 745,
    "path": "../public/kelly_wearstler_virginia/pages/asociaciones.html"
  },
  "/kelly_wearstler_virginia/pages/biografia.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"8a0-0i7/7si6F2IDawvqjzQlLL+HMTE\"",
    "mtime": "2024-01-29T18:38:58.218Z",
    "size": 2208,
    "path": "../public/kelly_wearstler_virginia/pages/biografia.html"
  },
  "/kelly_wearstler_virginia/pages/obras.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"10d1-VBI9keDu/6lB+hDKubV/ovpiBWU\"",
    "mtime": "2024-01-29T18:38:58.217Z",
    "size": 4305,
    "path": "../public/kelly_wearstler_virginia/pages/obras.html"
  },
  "/kelly_wearstler_virginia/pages/premios.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"4b49-K1XJs9Z8xAyWkbVq+dw/qsj86wk\"",
    "mtime": "2024-01-29T18:38:58.216Z",
    "size": 19273,
    "path": "../public/kelly_wearstler_virginia/pages/premios.html"
  },
  "/lina_bobardi_irene/pages/casa-de-vidrio.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"15c1-oK0izOsYk1hppU0fVBFN+FIz2Ss\"",
    "mtime": "2024-01-29T18:38:58.154Z",
    "size": 5569,
    "path": "../public/lina_bobardi_irene/pages/casa-de-vidrio.html"
  },
  "/lina_bobardi_irene/pages/escalera-interior.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"1274-2YWIlt64SS1J4oQQnbP+fi1OFJE\"",
    "mtime": "2024-01-29T18:38:58.153Z",
    "size": 4724,
    "path": "../public/lina_bobardi_irene/pages/escalera-interior.html"
  },
  "/lina_bobardi_irene/pages/exposiciones.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"12c1-4qPZFTbRtxdaGiRi12kbMmxmrqo\"",
    "mtime": "2024-01-29T18:38:58.153Z",
    "size": 4801,
    "path": "../public/lina_bobardi_irene/pages/exposiciones.html"
  },
  "/lina_bobardi_irene/pages/la-gran-vaca-mecanica.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"130a-YlAV3HYiHoQ954AaaKbSDYbc2H8\"",
    "mtime": "2024-01-29T18:38:58.152Z",
    "size": 4874,
    "path": "../public/lina_bobardi_irene/pages/la-gran-vaca-mecanica.html"
  },
  "/lina_bobardi_irene/pages/masp.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"16ea-D8bWmmmLIBel7jOm8cit4dq+nnw\"",
    "mtime": "2024-01-29T18:38:58.151Z",
    "size": 5866,
    "path": "../public/lina_bobardi_irene/pages/masp.html"
  },
  "/lina_bobardi_irene/pages/sesc-pompeia.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"169d-s1w05JJ5AD+myZJPGufR1iCoX1s\"",
    "mtime": "2024-01-29T18:38:58.150Z",
    "size": 5789,
    "path": "../public/lina_bobardi_irene/pages/sesc-pompeia.html"
  },
  "/lina_bobardi_irene/pages/silla-bowl.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"12ec-Xuz0+78e+KYpXHae2pSp9w4CLbY\"",
    "mtime": "2024-01-29T18:38:58.149Z",
    "size": 4844,
    "path": "../public/lina_bobardi_irene/pages/silla-bowl.html"
  },
  "/lina_bobardi_irene/pages/solar-do-unhao.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"14c2-67o+AHYfzBHqYUhUT9sdySTDO08\"",
    "mtime": "2024-01-29T18:38:58.149Z",
    "size": 5314,
    "path": "../public/lina_bobardi_irene/pages/solar-do-unhao.html"
  },
  "/lina_bobardi_irene/pages/teatro-oficina.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"161f-sgS/+7CMU9ih4M7/HBvOLZfcCHQ\"",
    "mtime": "2024-01-29T18:38:58.148Z",
    "size": 5663,
    "path": "../public/lina_bobardi_irene/pages/teatro-oficina.html"
  },
  "/lotta_agaton_clara/pages/biografia.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"168e-qJUWwLzkIwU3b30OzAqr4bhv0PE\"",
    "mtime": "2024-01-29T18:38:58.094Z",
    "size": 5774,
    "path": "../public/lotta_agaton_clara/pages/biografia.html"
  },
  "/lotta_agaton_clara/pages/concepto.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"1075-Q15gV1OGsCWfVjJTxPuMyNqWyYc\"",
    "mtime": "2024-01-29T18:38:58.093Z",
    "size": 4213,
    "path": "../public/lotta_agaton_clara/pages/concepto.html"
  },
  "/lotta_agaton_clara/pages/direccioncreativa.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"10c2-1vwamVzRJPEk0aczap4pKZptCwY\"",
    "mtime": "2024-01-29T18:38:58.093Z",
    "size": 4290,
    "path": "../public/lotta_agaton_clara/pages/direccioncreativa.html"
  },
  "/lotta_agaton_clara/pages/estilo.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"1157-Q7AP7Q0gL3bgfRCP17gA/GmEKeQ\"",
    "mtime": "2024-01-29T18:38:58.092Z",
    "size": 4439,
    "path": "../public/lotta_agaton_clara/pages/estilo.html"
  },
  "/lotta_agaton_clara/pages/estudio.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"17e0-vWl9KpYpsV6JMf0hZYJ0sdnMsAQ\"",
    "mtime": "2024-01-29T18:38:58.091Z",
    "size": 6112,
    "path": "../public/lotta_agaton_clara/pages/estudio.html"
  },
  "/matali_crasset_carolina/pages/page2.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"4202-YgH1nlxTCIszRS2HouROcdx5r10\"",
    "mtime": "2024-01-29T18:38:58.044Z",
    "size": 16898,
    "path": "../public/matali_crasset_carolina/pages/page2.html"
  },
  "/nanna_ditzel_carla/subpages/1silla_ikon.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"502-24onRCv4TAL2YP7QohaEeH840Bs\"",
    "mtime": "2024-01-29T18:38:57.989Z",
    "size": 1282,
    "path": "../public/nanna_ditzel_carla/subpages/1silla_ikon.html"
  },
  "/nanna_ditzel_carla/subpages/2silla_egg.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"629-XFGBL+sW9C3MdKHV32PGrAV/Jp8\"",
    "mtime": "2024-01-29T18:38:57.988Z",
    "size": 1577,
    "path": "../public/nanna_ditzel_carla/subpages/2silla_egg.html"
  },
  "/nanna_ditzel_carla/subpages/3textil_hallingdal.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"612-rZJ/HV046hrakJilPaiMjZHctF8\"",
    "mtime": "2024-01-29T18:38:57.987Z",
    "size": 1554,
    "path": "../public/nanna_ditzel_carla/subpages/3textil_hallingdal.html"
  },
  "/nanna_ditzel_carla/subpages/4silla_trinidad.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"52e-N3WgERTS+pEDTZ875494BqCYejk\"",
    "mtime": "2024-01-29T18:38:57.986Z",
    "size": 1326,
    "path": "../public/nanna_ditzel_carla/subpages/4silla_trinidad.html"
  },
  "/patricia_urquiola_angel/pages/cocina.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"bf9-cr1KDFjK8vgRo7u/raEFwp8C8Ow\"",
    "mtime": "2024-01-29T18:38:57.966Z",
    "size": 3065,
    "path": "../public/patricia_urquiola_angel/pages/cocina.html"
  },
  "/patricia_urquiola_angel/pages/kalida.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"c3f-CPwlb+r7PjavLuUIIhBNNWDTTVE\"",
    "mtime": "2024-01-29T18:38:57.965Z",
    "size": 3135,
    "path": "../public/patricia_urquiola_angel/pages/kalida.html"
  },
  "/patricia_urquiola_angel/pages/sanlorenzo.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"b42-bcSzu/iSPjToe4moy35Lsx7bN6M\"",
    "mtime": "2024-01-29T18:38:57.964Z",
    "size": 2882,
    "path": "../public/patricia_urquiola_angel/pages/sanlorenzo.html"
  },
  "/reiko_tanabe_saul/assets/reikotanabe.png": {
    "type": "image/png",
    "etag": "\"34346-daXW1YSDXv1c34/VhkRMEfAw0A4\"",
    "mtime": "2024-01-29T18:38:57.960Z",
    "size": 213830,
    "path": "../public/reiko_tanabe_saul/assets/reikotanabe.png"
  },
  "/reiko_tanabe_saul/assets/stool1.jpg": {
    "type": "image/jpeg",
    "etag": "\"77ba0-LhBAPiVBWFP3e6JK9ZCv6GzglR8\"",
    "mtime": "2024-01-29T18:38:57.959Z",
    "size": 490400,
    "path": "../public/reiko_tanabe_saul/assets/stool1.jpg"
  },
  "/reiko_tanabe_saul/assets/stool2.jpg": {
    "type": "image/jpeg",
    "etag": "\"bafe-tB83dsqDMdyUV52w4tR9TMWiKq8\"",
    "mtime": "2024-01-29T18:38:57.956Z",
    "size": 47870,
    "path": "../public/reiko_tanabe_saul/assets/stool2.jpg"
  },
  "/reiko_tanabe_saul/assets/stool3.jpg": {
    "type": "image/jpeg",
    "etag": "\"49605-jWf1EJYjTnZdl4LHMrgc75xjGMo\"",
    "mtime": "2024-01-29T18:38:57.955Z",
    "size": 300549,
    "path": "../public/reiko_tanabe_saul/assets/stool3.jpg"
  },
  "/reiko_tanabe_saul/estilos/estilos.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"649-2fjrgW55aJIoikipLecEaMHMxBg\"",
    "mtime": "2024-01-29T18:38:57.951Z",
    "size": 1609,
    "path": "../public/reiko_tanabe_saul/estilos/estilos.css"
  },
  "/reiko_tanabe_saul/paginas/Obra.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"911-n6s8AN3eipNICdX9vStlAhl3OGA\"",
    "mtime": "2024-01-29T18:38:57.948Z",
    "size": 2321,
    "path": "../public/reiko_tanabe_saul/paginas/Obra.html"
  },
  "/reiko_tanabe_saul/paginas/Reconocimiento.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"a97-9rvGD2IOmz3k8U+g+/UaC8FsklY\"",
    "mtime": "2024-01-29T18:38:57.947Z",
    "size": 2711,
    "path": "../public/reiko_tanabe_saul/paginas/Reconocimiento.html"
  },
  "/reiko_tanabe_saul/paginas/Relacion.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"9af-YHJOjlvLOtm25gBmp5nfnxf77GI\"",
    "mtime": "2024-01-29T18:38:57.946Z",
    "size": 2479,
    "path": "../public/reiko_tanabe_saul/paginas/Relacion.html"
  },
  "/vivienne_westwood_sandra/documents/Enlace Figma VIVIENNE WESTWOOD_Sandra Cebri n.txt": {
    "type": "text/plain; charset=utf-8",
    "etag": "\"48-X7ixeDR2Fu1Dv8hDycfxBlbQHGs\"",
    "mtime": "2024-01-29T18:38:57.882Z",
    "size": 72,
    "path": "../public/vivienne_westwood_sandra/documents/Enlace Figma VIVIENNE WESTWOOD_Sandra Cebri n.txt"
  },
  "/vivienne_westwood_sandra/documents/bocetos VIVIENNE WESTWOOD_Sandra Cebri n.jfif": {
    "type": "text/plain; charset=utf-8",
    "etag": "\"238fd-L12y5HQg6YFV9RXxHceTj0gmh9M\"",
    "mtime": "2024-01-29T18:38:57.880Z",
    "size": 145661,
    "path": "../public/vivienne_westwood_sandra/documents/bocetos VIVIENNE WESTWOOD_Sandra Cebri n.jfif"
  },
  "/vivienne_westwood_sandra/documents/informaci¢n p gina web VIVIENNE WESTWOOD_Sandra Cebri n.pdf": {
    "type": "application/pdf",
    "etag": "\"2c256-kt1xI73CPZ1oZrXk2239hnCIx+M\"",
    "mtime": "2024-01-29T18:38:57.877Z",
    "size": 180822,
    "path": "../public/vivienne_westwood_sandra/documents/informaci¢n p gina web VIVIENNE WESTWOOD_Sandra Cebri n.pdf"
  },
  "/vivienne_westwood_sandra/pages/logo.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"14fc-pgYW4LamZJYeL/nX5LOjTtBPn7U\"",
    "mtime": "2024-01-29T18:38:57.871Z",
    "size": 5372,
    "path": "../public/vivienne_westwood_sandra/pages/logo.html"
  },
  "/vivienne_westwood_sandra/pages/principal.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"4b3c-2v6+gsgyaUt0XrnQI54GLdPR8mE\"",
    "mtime": "2024-01-29T18:38:57.869Z",
    "size": 19260,
    "path": "../public/vivienne_westwood_sandra/pages/principal.html"
  },
  "/annesophie_oberkrome_mario/Assets/CSS/styles.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"1210-rwEYwmeK5HCvmvrMkXNNtqYT2l4\"",
    "mtime": "2024-01-29T18:38:58.581Z",
    "size": 4624,
    "path": "../public/annesophie_oberkrome_mario/Assets/CSS/styles.css"
  },
  "/annesophie_oberkrome_mario/Assets/Fotos/1.jpg": {
    "type": "image/jpeg",
    "etag": "\"5f90-KB0IbJfT0KnSLAn6xrmn0hOozu0\"",
    "mtime": "2024-01-29T18:38:58.579Z",
    "size": 24464,
    "path": "../public/annesophie_oberkrome_mario/Assets/Fotos/1.jpg"
  },
  "/annesophie_oberkrome_mario/Assets/Fotos/10.jpg": {
    "type": "image/jpeg",
    "etag": "\"160b3-kHi2PDW/wPl9iGB2sGNVAhKUgCI\"",
    "mtime": "2024-01-29T18:38:58.578Z",
    "size": 90291,
    "path": "../public/annesophie_oberkrome_mario/Assets/Fotos/10.jpg"
  },
  "/annesophie_oberkrome_mario/Assets/Fotos/18.png": {
    "type": "image/png",
    "etag": "\"39f4c-276S42mJRF2wXb6SQKBSRmf0N8g\"",
    "mtime": "2024-01-29T18:38:58.576Z",
    "size": 237388,
    "path": "../public/annesophie_oberkrome_mario/Assets/Fotos/18.png"
  },
  "/annesophie_oberkrome_mario/Assets/Fotos/2.jpg": {
    "type": "image/jpeg",
    "etag": "\"21615-sTEOM6jrD9sVSe1k9hUBMK5dB0M\"",
    "mtime": "2024-01-29T18:38:58.574Z",
    "size": 136725,
    "path": "../public/annesophie_oberkrome_mario/Assets/Fotos/2.jpg"
  },
  "/annesophie_oberkrome_mario/Assets/Fotos/3.jpg": {
    "type": "image/jpeg",
    "etag": "\"4cd2f-2tVJRAdi4j1dPYrJswQfzTb8tpw\"",
    "mtime": "2024-01-29T18:38:58.572Z",
    "size": 314671,
    "path": "../public/annesophie_oberkrome_mario/Assets/Fotos/3.jpg"
  },
  "/annesophie_oberkrome_mario/Assets/Fotos/Mesas de trabajo_Mesa de trabajo 1.png": {
    "type": "image/png",
    "etag": "\"22a5a3-2NneaOCsMUTol+jm0tnmjQ+lJDU\"",
    "mtime": "2024-01-29T18:38:58.570Z",
    "size": 2270627,
    "path": "../public/annesophie_oberkrome_mario/Assets/Fotos/Mesas de trabajo_Mesa de trabajo 1.png"
  },
  "/annesophie_oberkrome_mario/Assets/Fotos/fotomenu_Mesa de trabajo 1 copia 2.png": {
    "type": "image/png",
    "etag": "\"7ef8c-DsL45oy77+SRlksnKSN7EOS+2n8\"",
    "mtime": "2024-01-29T18:38:58.561Z",
    "size": 520076,
    "path": "../public/annesophie_oberkrome_mario/Assets/Fotos/fotomenu_Mesa de trabajo 1 copia 2.png"
  },
  "/annesophie_oberkrome_mario/Assets/Fotos/fotomenu_Mesa de trabajo 1 copia 3.png": {
    "type": "image/png",
    "etag": "\"7b359-8bjnMiBnDNM1TVaHk76KY6gWUSU\"",
    "mtime": "2024-01-29T18:38:58.558Z",
    "size": 504665,
    "path": "../public/annesophie_oberkrome_mario/Assets/Fotos/fotomenu_Mesa de trabajo 1 copia 3.png"
  },
  "/annesophie_oberkrome_mario/Assets/Fotos/fotomenu_Mesa de trabajo 1 copia.png": {
    "type": "image/png",
    "etag": "\"39f22-oqOrY27aOmCH0i53r5iM+vHos+U\"",
    "mtime": "2024-01-29T18:38:58.556Z",
    "size": 237346,
    "path": "../public/annesophie_oberkrome_mario/Assets/Fotos/fotomenu_Mesa de trabajo 1 copia.png"
  },
  "/annesophie_oberkrome_mario/Assets/Fotos/fotomenu_Mesa de trabajo 1.png": {
    "type": "image/png",
    "etag": "\"729b3-370diCQn6RBW0Ll/WKxduqqX8K4\"",
    "mtime": "2024-01-29T18:38:58.553Z",
    "size": 469427,
    "path": "../public/annesophie_oberkrome_mario/Assets/Fotos/fotomenu_Mesa de trabajo 1.png"
  },
  "/emilia_wickstead_laura/assets/css/style.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"1abb-PqjjXgfzh3vIdVBRXk0YQCfs/O0\"",
    "mtime": "2024-01-29T18:38:58.536Z",
    "size": 6843,
    "path": "../public/emilia_wickstead_laura/assets/css/style.css"
  },
  "/gae_aulenti_marina/Assets/css/stylesheet.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"1994-18BmcWBbPMlAC5MUDLYECTHCO9M\"",
    "mtime": "2024-01-29T18:38:58.482Z",
    "size": 6548,
    "path": "../public/gae_aulenti_marina/Assets/css/stylesheet.css"
  },
  "/gae_aulenti_marina/Assets/css/stylesheet2.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"140a-YI6srJjXynCTzPElPuoAw+0lpjc\"",
    "mtime": "2024-01-29T18:38:58.481Z",
    "size": 5130,
    "path": "../public/gae_aulenti_marina/Assets/css/stylesheet2.css"
  },
  "/emilia_wickstead_laura/assets/imagenes/emilia1.png": {
    "type": "image/png",
    "etag": "\"2edeb-Vm4juLPseS0norSP3QhjQmKM4Zk\"",
    "mtime": "2024-01-29T18:38:58.534Z",
    "size": 191979,
    "path": "../public/emilia_wickstead_laura/assets/imagenes/emilia1.png"
  },
  "/emilia_wickstead_laura/assets/imagenes/emilia2.png": {
    "type": "image/png",
    "etag": "\"2ef3c-R+qCpMQ/Re7cHQNAK71r8TRBoA0\"",
    "mtime": "2024-01-29T18:38:58.533Z",
    "size": 192316,
    "path": "../public/emilia_wickstead_laura/assets/imagenes/emilia2.png"
  },
  "/emilia_wickstead_laura/assets/imagenes/gif.gif": {
    "type": "image/gif",
    "etag": "\"58220b-CXlX3nyBAynp+YEXBZrot+Ua3jQ\"",
    "mtime": "2024-01-29T18:38:58.530Z",
    "size": 5775883,
    "path": "../public/emilia_wickstead_laura/assets/imagenes/gif.gif"
  },
  "/emilia_wickstead_laura/assets/imagenes/logo.png": {
    "type": "image/png",
    "etag": "\"e77-028BJAXE0hpgH05kuztR7ZAX7zw\"",
    "mtime": "2024-01-29T18:38:58.509Z",
    "size": 3703,
    "path": "../public/emilia_wickstead_laura/assets/imagenes/logo.png"
  },
  "/emilia_wickstead_laura/assets/imagenes/logo2.png": {
    "type": "image/png",
    "etag": "\"c9f-P8LR3pvdgIUqKVbnis06H+Oanxo\"",
    "mtime": "2024-01-29T18:38:58.509Z",
    "size": 3231,
    "path": "../public/emilia_wickstead_laura/assets/imagenes/logo2.png"
  },
  "/emilia_wickstead_laura/assets/imagenes/otoคo-invierno2020_1.png": {
    "type": "image/png",
    "etag": "\"348e7-mZRgynkSJklR/v31AvBGnT7NZxU\"",
    "mtime": "2024-01-29T18:38:58.508Z",
    "size": 215271,
    "path": "../public/emilia_wickstead_laura/assets/imagenes/otoคo-invierno2020_1.png"
  },
  "/emilia_wickstead_laura/assets/imagenes/otoคo-invierno2020_2.png": {
    "type": "image/png",
    "etag": "\"3e916-ae5miYV9cjyPzAuSKh7xdZBQR1s\"",
    "mtime": "2024-01-29T18:38:58.506Z",
    "size": 256278,
    "path": "../public/emilia_wickstead_laura/assets/imagenes/otoคo-invierno2020_2.png"
  },
  "/emilia_wickstead_laura/assets/imagenes/otoคo-invierno2020_3.png": {
    "type": "image/png",
    "etag": "\"3ebc2-BHBECHmvi/6lsqyu1INO4HODKtI\"",
    "mtime": "2024-01-29T18:38:58.504Z",
    "size": 256962,
    "path": "../public/emilia_wickstead_laura/assets/imagenes/otoคo-invierno2020_3.png"
  },
  "/emilia_wickstead_laura/assets/imagenes/otoคo-invierno2020_4.png": {
    "type": "image/png",
    "etag": "\"4b1d4-j9zuSAeMG3gsQX030QaDHZ06Q2E\"",
    "mtime": "2024-01-29T18:38:58.502Z",
    "size": 307668,
    "path": "../public/emilia_wickstead_laura/assets/imagenes/otoคo-invierno2020_4.png"
  },
  "/emilia_wickstead_laura/assets/imagenes/otoคo-invierno2021_1.png": {
    "type": "image/png",
    "etag": "\"2e60b-W0obxLfQozQ/Z6QH9mN3iEtmjx0\"",
    "mtime": "2024-01-29T18:38:58.500Z",
    "size": 189963,
    "path": "../public/emilia_wickstead_laura/assets/imagenes/otoคo-invierno2021_1.png"
  },
  "/emilia_wickstead_laura/assets/imagenes/otoคo-invierno2021_2.png": {
    "type": "image/png",
    "etag": "\"29cdc-kBYWJCsHaAXUMhX5VXrK6b3sGCc\"",
    "mtime": "2024-01-29T18:38:58.498Z",
    "size": 171228,
    "path": "../public/emilia_wickstead_laura/assets/imagenes/otoคo-invierno2021_2.png"
  },
  "/emilia_wickstead_laura/assets/imagenes/otoคo-invierno2021_3.png": {
    "type": "image/png",
    "etag": "\"2aa8e-rkU3qnYn4P1XLM3He9KV/88Nxqk\"",
    "mtime": "2024-01-29T18:38:58.497Z",
    "size": 174734,
    "path": "../public/emilia_wickstead_laura/assets/imagenes/otoคo-invierno2021_3.png"
  },
  "/emilia_wickstead_laura/assets/imagenes/otoคo-invierno2021_4.png": {
    "type": "image/png",
    "etag": "\"276ef-7QHG/5oiY1gFUKFiizsUBpXeYqM\"",
    "mtime": "2024-01-29T18:38:58.495Z",
    "size": 161519,
    "path": "../public/emilia_wickstead_laura/assets/imagenes/otoคo-invierno2021_4.png"
  },
  "/emilia_wickstead_laura/assets/imagenes/primavera-verano2021_1.png": {
    "type": "image/png",
    "etag": "\"14ebd-Lk8blA11vl+nOlDWkGhkAlCHbds\"",
    "mtime": "2024-01-29T18:38:58.493Z",
    "size": 85693,
    "path": "../public/emilia_wickstead_laura/assets/imagenes/primavera-verano2021_1.png"
  },
  "/emilia_wickstead_laura/assets/imagenes/primavera-verano2021_2.png": {
    "type": "image/png",
    "etag": "\"1c745-dSdW3ggRIL6bWkkBWMDlE8UPWV4\"",
    "mtime": "2024-01-29T18:38:58.492Z",
    "size": 116549,
    "path": "../public/emilia_wickstead_laura/assets/imagenes/primavera-verano2021_2.png"
  },
  "/emilia_wickstead_laura/assets/imagenes/primavera-verano2021_3.png": {
    "type": "image/png",
    "etag": "\"1f857-U4ZoC4/hOjdT7FkVp+PNrnxPMjI\"",
    "mtime": "2024-01-29T18:38:58.491Z",
    "size": 129111,
    "path": "../public/emilia_wickstead_laura/assets/imagenes/primavera-verano2021_3.png"
  },
  "/emilia_wickstead_laura/assets/imagenes/primavera-verano2021_4.png": {
    "type": "image/png",
    "etag": "\"14343-ntGh5fHYf42eez0ML7YeGSy8MwA\"",
    "mtime": "2024-01-29T18:38:58.489Z",
    "size": 82755,
    "path": "../public/emilia_wickstead_laura/assets/imagenes/primavera-verano2021_4.png"
  },
  "/ilse_crawford_diego/assets/css/styles.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"416-LpBqVHP68UOaV6MVFrsyOeDmPzw\"",
    "mtime": "2024-01-29T18:38:58.374Z",
    "size": 1046,
    "path": "../public/ilse_crawford_diego/assets/css/styles.css"
  },
  "/ilse_crawford_diego/assets/css/styles_about.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"bc2-WLMuXHaPd5WhmwXm7CEi8f5FnBI\"",
    "mtime": "2024-01-29T18:38:58.373Z",
    "size": 3010,
    "path": "../public/ilse_crawford_diego/assets/css/styles_about.css"
  },
  "/ilse_crawford_diego/assets/css/styles_contacto.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"9c5-HFXxcN2Z/4XLNkbxPTXKDen+pII\"",
    "mtime": "2024-01-29T18:38:58.373Z",
    "size": 2501,
    "path": "../public/ilse_crawford_diego/assets/css/styles_contacto.css"
  },
  "/ilse_crawford_diego/assets/css/styles_obras.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"12c0-oCSlLOw8VRWt7zO6EivW2XZb9sw\"",
    "mtime": "2024-01-29T18:38:58.372Z",
    "size": 4800,
    "path": "../public/ilse_crawford_diego/assets/css/styles_obras.css"
  },
  "/ilse_crawford_diego/assets/css/styles_proyetos.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"e00-ma1sPY+tBhfQqvnvp79LcE2Htfo\"",
    "mtime": "2024-01-29T18:38:58.371Z",
    "size": 3584,
    "path": "../public/ilse_crawford_diego/assets/css/styles_proyetos.css"
  },
  "/gae_aulenti_marina/Assets/images/2006_185_5_o2_Gae-Aulenti-lamp.jpg": {
    "type": "image/jpeg",
    "etag": "\"d4b2c-fO595ylb8ghVnSHxcsLtl5znwJI\"",
    "mtime": "2024-01-29T18:38:58.478Z",
    "size": 871212,
    "path": "../public/gae_aulenti_marina/Assets/images/2006_185_5_o2_Gae-Aulenti-lamp.jpg"
  },
  "/gae_aulenti_marina/Assets/images/5754366156_2bdfba4dff_b1.jpg": {
    "type": "image/jpeg",
    "etag": "\"5cced-/5zGVJqBQCFLShfvS9xPBvMTiwM\"",
    "mtime": "2024-01-29T18:38:58.474Z",
    "size": 380141,
    "path": "../public/gae_aulenti_marina/Assets/images/5754366156_2bdfba4dff_b1.jpg"
  },
  "/gae_aulenti_marina/Assets/images/COLOR.jpg": {
    "type": "image/jpeg",
    "etag": "\"9411-kSSW6DXxfMbtcxUH5Mc9KzIE+n0\"",
    "mtime": "2024-01-29T18:38:58.472Z",
    "size": 37905,
    "path": "../public/gae_aulenti_marina/Assets/images/COLOR.jpg"
  },
  "/gae_aulenti_marina/Assets/images/ELEKTRA.jpg": {
    "type": "image/jpeg",
    "etag": "\"32335-O+2KdPM7MuPEA8Z+wdnn2ic0BDo\"",
    "mtime": "2024-01-29T18:38:58.471Z",
    "size": 205621,
    "path": "../public/gae_aulenti_marina/Assets/images/ELEKTRA.jpg"
  },
  "/gae_aulenti_marina/Assets/images/FIGURAS 2.jpg": {
    "type": "image/jpeg",
    "etag": "\"860b-C29ATXlqzWQsCfL/BcvqLC87xro\"",
    "mtime": "2024-01-29T18:38:58.469Z",
    "size": 34315,
    "path": "../public/gae_aulenti_marina/Assets/images/FIGURAS 2.jpg"
  },
  "/gae_aulenti_marina/Assets/images/FIGURAS.jpg": {
    "type": "image/jpeg",
    "etag": "\"a08f-DsFZPASxFl++3BP8MHwIh/elbFk\"",
    "mtime": "2024-01-29T18:38:58.468Z",
    "size": 41103,
    "path": "../public/gae_aulenti_marina/Assets/images/FIGURAS.jpg"
  },
  "/gae_aulenti_marina/Assets/images/Gae-Aulenti.jpg": {
    "type": "image/jpeg",
    "etag": "\"882a-F4O3iXbvt7ck8ArmkSJmSD5BOWo\"",
    "mtime": "2024-01-29T18:38:58.467Z",
    "size": 34858,
    "path": "../public/gae_aulenti_marina/Assets/images/Gae-Aulenti.jpg"
  },
  "/gae_aulenti_marina/Assets/images/LAMPARA 3.jpg": {
    "type": "image/jpeg",
    "etag": "\"18bc4-6K/29geyCB0woppZbKSIM4GPygQ\"",
    "mtime": "2024-01-29T18:38:58.466Z",
    "size": 101316,
    "path": "../public/gae_aulenti_marina/Assets/images/LAMPARA 3.jpg"
  },
  "/gae_aulenti_marina/Assets/images/Neoliberty.jpg": {
    "type": "image/jpeg",
    "etag": "\"1ad2e-p358LThWlxLoDldfnOAX6Vx3b2s\"",
    "mtime": "2024-01-29T18:38:58.465Z",
    "size": 109870,
    "path": "../public/gae_aulenti_marina/Assets/images/Neoliberty.jpg"
  },
  "/gae_aulenti_marina/Assets/images/PAVELLON.jpg": {
    "type": "image/jpeg",
    "etag": "\"36ba4-32qhlvL8Tlt1G2JxikVECjoQXAI\"",
    "mtime": "2024-01-29T18:38:58.463Z",
    "size": 224164,
    "path": "../public/gae_aulenti_marina/Assets/images/PAVELLON.jpg"
  },
  "/gae_aulenti_marina/Assets/images/Photo_Locus_Solus.jpg": {
    "type": "image/jpeg",
    "etag": "\"10040-cwDraPB7759H2Fx3FPTyiIc05Rw\"",
    "mtime": "2024-01-29T18:38:58.461Z",
    "size": 65600,
    "path": "../public/gae_aulenti_marina/Assets/images/Photo_Locus_Solus.jpg"
  },
  "/gae_aulenti_marina/Assets/images/Riviste_Casabella.jfif": {
    "type": "text/plain; charset=utf-8",
    "etag": "\"898ea-5p48Joe9u6uKtZco5DZSVIKQn8U\"",
    "mtime": "2024-01-29T18:38:58.460Z",
    "size": 563434,
    "path": "../public/gae_aulenti_marina/Assets/images/Riviste_Casabella.jfif"
  },
  "/gae_aulenti_marina/Assets/images/amarilla.jpg": {
    "type": "image/jpeg",
    "etag": "\"43b8-nKc14Q1OBAGvRH4bnHmse5gYhwM\"",
    "mtime": "2024-01-29T18:38:58.457Z",
    "size": 17336,
    "path": "../public/gae_aulenti_marina/Assets/images/amarilla.jpg"
  },
  "/gae_aulenti_marina/Assets/images/amarilla2.jpg": {
    "type": "image/jpeg",
    "etag": "\"3c19-XiZalXniibcEoXuczC5tjWlBxWc\"",
    "mtime": "2024-01-29T18:38:58.456Z",
    "size": 15385,
    "path": "../public/gae_aulenti_marina/Assets/images/amarilla2.jpg"
  },
  "/gae_aulenti_marina/Assets/images/color2.jpg": {
    "type": "image/jpeg",
    "etag": "\"759e-/ffVwvwGmIgrOygIE7PmrfV8OAE\"",
    "mtime": "2024-01-29T18:38:58.455Z",
    "size": 30110,
    "path": "../public/gae_aulenti_marina/Assets/images/color2.jpg"
  },
  "/gae_aulenti_marina/Assets/images/dise¤adoras-pioneras-gae-aulenti-13.jpg": {
    "type": "image/jpeg",
    "etag": "\"845e-vQ/Y1r2oiZq8ddVxzhKa0h+wZ9Q\"",
    "mtime": "2024-01-29T18:38:58.452Z",
    "size": 33886,
    "path": "../public/gae_aulenti_marina/Assets/images/dise¤adoras-pioneras-gae-aulenti-13.jpg"
  },
  "/gae_aulenti_marina/Assets/images/figuras2.jpg": {
    "type": "image/jpeg",
    "etag": "\"8b40-DXG5wmp0vme8QtVt67++jYClkfw\"",
    "mtime": "2024-01-29T18:38:58.451Z",
    "size": 35648,
    "path": "../public/gae_aulenti_marina/Assets/images/figuras2.jpg"
  },
  "/gae_aulenti_marina/Assets/images/gae.jpg": {
    "type": "image/jpeg",
    "etag": "\"62cd-pzfR4hLT81EPjDynbGc3zks17Fs\"",
    "mtime": "2024-01-29T18:38:58.450Z",
    "size": 25293,
    "path": "../public/gae_aulenti_marina/Assets/images/gae.jpg"
  },
  "/gae_aulenti_marina/Assets/images/gae2.jpg": {
    "type": "image/jpeg",
    "etag": "\"6b8c-2MCzMBFU4mU8fv/avlgeLOcevoo\"",
    "mtime": "2024-01-29T18:38:58.448Z",
    "size": 27532,
    "path": "../public/gae_aulenti_marina/Assets/images/gae2.jpg"
  },
  "/gae_aulenti_marina/Assets/images/imagen1.jpeg": {
    "type": "image/jpeg",
    "etag": "\"3ef50-QvvtIBEmiwyDnOv4gYW/L7bXq+o\"",
    "mtime": "2024-01-29T18:38:58.447Z",
    "size": 257872,
    "path": "../public/gae_aulenti_marina/Assets/images/imagen1.jpeg"
  },
  "/gae_aulenti_marina/Assets/images/imagen1.jpg": {
    "type": "image/jpeg",
    "etag": "\"31780-lXRpLt0NQDxT6uaZaFGlATBBMsc\"",
    "mtime": "2024-01-29T18:38:58.446Z",
    "size": 202624,
    "path": "../public/gae_aulenti_marina/Assets/images/imagen1.jpg"
  },
  "/gae_aulenti_marina/Assets/images/imagen2.jpg": {
    "type": "image/jpeg",
    "etag": "\"5a10-qGfe+0p6pt5hYYZJ5PViRpEMBs4\"",
    "mtime": "2024-01-29T18:38:58.444Z",
    "size": 23056,
    "path": "../public/gae_aulenti_marina/Assets/images/imagen2.jpg"
  },
  "/gae_aulenti_marina/Assets/images/imagen3.jpg": {
    "type": "image/jpeg",
    "etag": "\"3e46-hrpB8IISFN65yPOVl4Q0Cd/Ouao\"",
    "mtime": "2024-01-29T18:38:58.443Z",
    "size": 15942,
    "path": "../public/gae_aulenti_marina/Assets/images/imagen3.jpg"
  },
  "/gae_aulenti_marina/Assets/images/imagen4.jpg": {
    "type": "image/jpeg",
    "etag": "\"49a7-tEOqGkog4UQSM+BcA76OzXJopN4\"",
    "mtime": "2024-01-29T18:38:58.442Z",
    "size": 18855,
    "path": "../public/gae_aulenti_marina/Assets/images/imagen4.jpg"
  },
  "/gae_aulenti_marina/Assets/images/imagen5.jpg": {
    "type": "image/jpeg",
    "etag": "\"487c-BCwNjVDXtAujh2W0ehyZEsbFU9k\"",
    "mtime": "2024-01-29T18:38:58.441Z",
    "size": 18556,
    "path": "../public/gae_aulenti_marina/Assets/images/imagen5.jpg"
  },
  "/gae_aulenti_marina/Assets/images/images.jfif": {
    "type": "text/plain; charset=utf-8",
    "etag": "\"1a0d-rgJMqBD4ceTeRcA3MU3YPoA0E+A\"",
    "mtime": "2024-01-29T18:38:58.440Z",
    "size": 6669,
    "path": "../public/gae_aulenti_marina/Assets/images/images.jfif"
  },
  "/gae_aulenti_marina/Assets/images/italia.jpg": {
    "type": "image/jpeg",
    "etag": "\"13ec4-UfXHtrdz7Pdky8ixmwpiUGAlFO8\"",
    "mtime": "2024-01-29T18:38:58.439Z",
    "size": 81604,
    "path": "../public/gae_aulenti_marina/Assets/images/italia.jpg"
  },
  "/gae_aulenti_marina/Assets/images/italia2.jpg": {
    "type": "image/jpeg",
    "etag": "\"6500-ocneRWcXWM5TxLJG6x3oOrfSvbo\"",
    "mtime": "2024-01-29T18:38:58.438Z",
    "size": 25856,
    "path": "../public/gae_aulenti_marina/Assets/images/italia2.jpg"
  },
  "/gae_aulenti_marina/Assets/images/lampara 2.jpg": {
    "type": "image/jpeg",
    "etag": "\"50ee-XRN9rHpf4Tewc567HGsW36tSwjE\"",
    "mtime": "2024-01-29T18:38:58.437Z",
    "size": 20718,
    "path": "../public/gae_aulenti_marina/Assets/images/lampara 2.jpg"
  },
  "/gae_aulenti_marina/Assets/images/lampara.jpg": {
    "type": "image/jpeg",
    "etag": "\"15d9-t7t3q7t2kZM4JSQ1y45vB7w5rVY\"",
    "mtime": "2024-01-29T18:38:58.436Z",
    "size": 5593,
    "path": "../public/gae_aulenti_marina/Assets/images/lampara.jpg"
  },
  "/gae_aulenti_marina/Assets/images/lampara4.jpg": {
    "type": "image/jpeg",
    "etag": "\"132d9-TKT7wsEDOjdK9qUK8BoI2LD+PDU\"",
    "mtime": "2024-01-29T18:38:58.435Z",
    "size": 78553,
    "path": "../public/gae_aulenti_marina/Assets/images/lampara4.jpg"
  },
  "/gae_aulenti_marina/Assets/images/locus solus serie.jpg": {
    "type": "image/jpeg",
    "etag": "\"2eb3-TDHTvL0fGyKs43ja0sBJbwIzOoQ\"",
    "mtime": "2024-01-29T18:38:58.434Z",
    "size": 11955,
    "path": "../public/gae_aulenti_marina/Assets/images/locus solus serie.jpg"
  },
  "/gae_aulenti_marina/Assets/images/locus solus.jpg": {
    "type": "image/jpeg",
    "etag": "\"2817d-Hxt0fBeT4Iq7aMKss0hLE7Kdy3Q\"",
    "mtime": "2024-01-29T18:38:58.433Z",
    "size": 164221,
    "path": "../public/gae_aulenti_marina/Assets/images/locus solus.jpg"
  },
  "/gae_aulenti_marina/Assets/images/mecedora.jpg": {
    "type": "image/jpeg",
    "etag": "\"4270d-uj0UClVGncxm1lClsQiTLtm/UoE\"",
    "mtime": "2024-01-29T18:38:58.431Z",
    "size": 272141,
    "path": "../public/gae_aulenti_marina/Assets/images/mecedora.jpg"
  },
  "/gae_aulenti_marina/Assets/images/musee de orsay.jpg": {
    "type": "image/jpeg",
    "etag": "\"46b5c-JQu6YEOL7TjEzOQjurpGoRSdwGo\"",
    "mtime": "2024-01-29T18:38:58.429Z",
    "size": 289628,
    "path": "../public/gae_aulenti_marina/Assets/images/musee de orsay.jpg"
  },
  "/gae_aulenti_marina/Assets/images/museo.jpg": {
    "type": "image/jpeg",
    "etag": "\"57683-iRUkAz6be7RTeH3FAmcVJEQLkVA\"",
    "mtime": "2024-01-29T18:38:58.427Z",
    "size": 358019,
    "path": "../public/gae_aulenti_marina/Assets/images/museo.jpg"
  },
  "/gae_aulenti_marina/Assets/images/museo2.jpg": {
    "type": "image/jpeg",
    "etag": "\"8892-B6Q6x8FG3vSRApMzkhKWAexAm1c\"",
    "mtime": "2024-01-29T18:38:58.424Z",
    "size": 34962,
    "path": "../public/gae_aulenti_marina/Assets/images/museo2.jpg"
  },
  "/gae_aulenti_marina/Assets/images/palacio grassi.jpg": {
    "type": "image/jpeg",
    "etag": "\"a35b8-Yr+EjsjsaX9VdtzigqMY5tU+OoA\"",
    "mtime": "2024-01-29T18:38:58.421Z",
    "size": 669112,
    "path": "../public/gae_aulenti_marina/Assets/images/palacio grassi.jpg"
  },
  "/gae_aulenti_marina/Assets/images/roja.jpg": {
    "type": "image/jpeg",
    "etag": "\"50ae-ndIqxPgdeyDhbz5V9WyafrlN8J4\"",
    "mtime": "2024-01-29T18:38:58.418Z",
    "size": 20654,
    "path": "../public/gae_aulenti_marina/Assets/images/roja.jpg"
  },
  "/gae_aulenti_marina/Assets/images/roja2.jpg": {
    "type": "image/jpeg",
    "etag": "\"4343-L/f92MAi8RbQXwjT64hURdTcTTE\"",
    "mtime": "2024-01-29T18:38:58.408Z",
    "size": 17219,
    "path": "../public/gae_aulenti_marina/Assets/images/roja2.jpg"
  },
  "/gae_aulenti_marina/Assets/images/silla plegable.jpg": {
    "type": "image/jpeg",
    "etag": "\"36346-wYhf3AiTO4bEQ/LvLdPeIjPy/MI\"",
    "mtime": "2024-01-29T18:38:58.407Z",
    "size": 222022,
    "path": "../public/gae_aulenti_marina/Assets/images/silla plegable.jpg"
  },
  "/gae_aulenti_marina/Assets/images/silla.jpg": {
    "type": "image/jpeg",
    "etag": "\"476b-tMvPIy6NYk8HGo9szgGqg1s8tKE\"",
    "mtime": "2024-01-29T18:38:58.405Z",
    "size": 18283,
    "path": "../public/gae_aulenti_marina/Assets/images/silla.jpg"
  },
  "/gae_aulenti_marina/Assets/images/verde.jpg": {
    "type": "image/jpeg",
    "etag": "\"4347-9sCvRbntiCIooiWD4x/puQBx79w\"",
    "mtime": "2024-01-29T18:38:58.384Z",
    "size": 17223,
    "path": "../public/gae_aulenti_marina/Assets/images/verde.jpg"
  },
  "/gae_aulenti_marina/Assets/images/verde2.jpg": {
    "type": "image/jpeg",
    "etag": "\"3d14-G3S+lS6WDPOSWrQtrDnuHNlxkyg\"",
    "mtime": "2024-01-29T18:38:58.382Z",
    "size": 15636,
    "path": "../public/gae_aulenti_marina/Assets/images/verde2.jpg"
  },
  "/gae_aulenti_marina/Assets/images/vitra-design-museum-gae-aulenti-lampara-king-sun_bd29964b_803x1000.jpg": {
    "type": "image/jpeg",
    "etag": "\"f70f-n1ysQQIihOp8SbtxIDkOj3neyxw\"",
    "mtime": "2024-01-29T18:38:58.381Z",
    "size": 63247,
    "path": "../public/gae_aulenti_marina/Assets/images/vitra-design-museum-gae-aulenti-lampara-king-sun_bd29964b_803x1000.jpg"
  },
  "/ilse_crawford_diego/assets/images/1.png": {
    "type": "image/png",
    "etag": "\"32b4-WefxoKMg9URwnpxZDIEV5XHeR3M\"",
    "mtime": "2024-01-29T18:38:58.369Z",
    "size": 12980,
    "path": "../public/ilse_crawford_diego/assets/images/1.png"
  },
  "/ilse_crawford_diego/assets/images/2.png": {
    "type": "image/png",
    "etag": "\"a14-V7EEg1mV91gUyg/AOFv234EeCyo\"",
    "mtime": "2024-01-29T18:38:58.368Z",
    "size": 2580,
    "path": "../public/ilse_crawford_diego/assets/images/2.png"
  },
  "/ilse_crawford_diego/assets/images/3.png": {
    "type": "image/png",
    "etag": "\"b36-i8oMphJwRwEZu2RAOOhBrP4iXgI\"",
    "mtime": "2024-01-29T18:38:58.367Z",
    "size": 2870,
    "path": "../public/ilse_crawford_diego/assets/images/3.png"
  },
  "/ilse_crawford_diego/assets/images/4.png": {
    "type": "image/png",
    "etag": "\"a6f-sxJShWJxi/cQ1K5WgjvPxIO3g0c\"",
    "mtime": "2024-01-29T18:38:58.366Z",
    "size": 2671,
    "path": "../public/ilse_crawford_diego/assets/images/4.png"
  },
  "/ilse_crawford_diego/assets/images/5.png": {
    "type": "image/png",
    "etag": "\"801-aEIQEHnI2I1lf8Z3kfHWunbsNno\"",
    "mtime": "2024-01-29T18:38:58.365Z",
    "size": 2049,
    "path": "../public/ilse_crawford_diego/assets/images/5.png"
  },
  "/ilse_crawford_diego/assets/images/expand_less_black_24dp.svg": {
    "type": "image/svg+xml",
    "etag": "\"cb-kxH/zm9M64HztBuQPxC42n5YNnU\"",
    "mtime": "2024-01-29T18:38:58.365Z",
    "size": 203,
    "path": "../public/ilse_crawford_diego/assets/images/expand_less_black_24dp.svg"
  },
  "/ilse_crawford_diego/assets/images/images.zip": {
    "type": "application/zip",
    "etag": "\"5395-FOC3dO3xHoUfFJeKKFxIGHq+iok\"",
    "mtime": "2024-01-29T18:38:58.364Z",
    "size": 21397,
    "path": "../public/ilse_crawford_diego/assets/images/images.zip"
  },
  "/ilse_crawford_diego/investigacion/figma/link_figma.txt": {
    "type": "text/plain; charset=utf-8",
    "etag": "\"3c-KSGRXq0UM8O+dDAcFFg64uCBICQ\"",
    "mtime": "2024-01-29T18:38:58.359Z",
    "size": 60,
    "path": "../public/ilse_crawford_diego/investigacion/figma/link_figma.txt"
  },
  "/india_maldhavi_luna/assets/css/estilos1.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"10cc-/mt5kzFD3jUTHefb2Npcjvr1gL8\"",
    "mtime": "2024-01-29T18:38:58.348Z",
    "size": 4300,
    "path": "../public/india_maldhavi_luna/assets/css/estilos1.css"
  },
  "/india_maldhavi_luna/assets/css/estilos2.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"520-+qPDrL6CskGbtudgMjnwmr4LZjI\"",
    "mtime": "2024-01-29T18:38:58.347Z",
    "size": 1312,
    "path": "../public/india_maldhavi_luna/assets/css/estilos2.css"
  },
  "/india_maldhavi_luna/assets/css/estilos3.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"621-jNFM+9FE7iTepSLfGv8vMjfkaXU\"",
    "mtime": "2024-01-29T18:38:58.346Z",
    "size": 1569,
    "path": "../public/india_maldhavi_luna/assets/css/estilos3.css"
  },
  "/india_maldhavi_luna/assets/images/05_germain.jpg": {
    "type": "image/jpeg",
    "etag": "\"6716e-1qCAWGEGtn+COw2kww8DNVyR/lQ\"",
    "mtime": "2024-01-29T18:38:58.344Z",
    "size": 422254,
    "path": "../public/india_maldhavi_luna/assets/images/05_germain.jpg"
  },
  "/india_maldhavi_luna/assets/images/10-red-valentino4.jpg": {
    "type": "image/jpeg",
    "etag": "\"43eee-GLqcmOlLuGFN0OXjQP8buAqTpHU\"",
    "mtime": "2024-01-29T18:38:58.342Z",
    "size": 278254,
    "path": "../public/india_maldhavi_luna/assets/images/10-red-valentino4.jpg"
  },
  "/india_maldhavi_luna/assets/images/Caf‚-Francais.jpg": {
    "type": "image/jpeg",
    "etag": "\"41db6-eGR0/AwXCaZi5KQThtA1hBNyrGc\"",
    "mtime": "2024-01-29T18:38:58.339Z",
    "size": 269750,
    "path": "../public/india_maldhavi_luna/assets/images/Caf‚-Francais.jpg"
  },
  "/india_maldhavi_luna/assets/images/Foto principal India.jpg": {
    "type": "image/jpeg",
    "etag": "\"11df6d-mmCNMki+vXKbAPmCWMPxKpKNrbs\"",
    "mtime": "2024-01-29T18:38:58.337Z",
    "size": 1171309,
    "path": "../public/india_maldhavi_luna/assets/images/Foto principal India.jpg"
  },
  "/india_maldhavi_luna/assets/images/India mahdavi 1.jpg": {
    "type": "image/jpeg",
    "etag": "\"19f01-F00YTIGbHXipX0eGJqKt0vt5sQc\"",
    "mtime": "2024-01-29T18:38:58.332Z",
    "size": 106241,
    "path": "../public/india_maldhavi_luna/assets/images/India mahdavi 1.jpg"
  },
  "/india_maldhavi_luna/assets/images/India mahdavi 2.jpg": {
    "type": "image/jpeg",
    "etag": "\"9685f-FkGHhMnhEZ5Pq3xvCx+i8rcePpc\"",
    "mtime": "2024-01-29T18:38:58.330Z",
    "size": 616543,
    "path": "../public/india_maldhavi_luna/assets/images/India mahdavi 2.jpg"
  },
  "/india_maldhavi_luna/assets/images/Jean-francois-piege.jpg": {
    "type": "image/jpeg",
    "etag": "\"32cb9-EANwJoua8TpnTlylrjBz603d+aE\"",
    "mtime": "2024-01-29T18:38:58.327Z",
    "size": 208057,
    "path": "../public/india_maldhavi_luna/assets/images/Jean-francois-piege.jpg"
  },
  "/india_maldhavi_luna/assets/images/germain.jpg": {
    "type": "image/jpeg",
    "etag": "\"557d5-714VrKpaBb7F2qqvMHHGFxTgmYo\"",
    "mtime": "2024-01-29T18:38:58.325Z",
    "size": 350165,
    "path": "../public/india_maldhavi_luna/assets/images/germain.jpg"
  },
  "/india_maldhavi_luna/assets/images/india bio.jpg": {
    "type": "image/jpeg",
    "etag": "\"11595-TcWQDZJ2JXqAcFoOMelhKP2xSsk\"",
    "mtime": "2024-01-29T18:38:58.323Z",
    "size": 71061,
    "path": "../public/india_maldhavi_luna/assets/images/india bio.jpg"
  },
  "/india_maldhavi_luna/assets/images/india firma.png": {
    "type": "image/png",
    "etag": "\"fab5-VqLcydHCB0NSYvO1iwlWovU/dIw\"",
    "mtime": "2024-01-29T18:38:58.322Z",
    "size": 64181,
    "path": "../public/india_maldhavi_luna/assets/images/india firma.png"
  },
  "/india_maldhavi_luna/assets/images/india formulario.jpg": {
    "type": "image/jpeg",
    "etag": "\"1461d-/Hk5PJEvGKpd+KjrCSNCgkx0eX8\"",
    "mtime": "2024-01-29T18:38:58.320Z",
    "size": 83485,
    "path": "../public/india_maldhavi_luna/assets/images/india formulario.jpg"
  },
  "/india_maldhavi_luna/assets/images/india libro 1.jpg": {
    "type": "image/jpeg",
    "etag": "\"4818e-tB/Rr/G88LMTKpx2690Ywgt9QCQ\"",
    "mtime": "2024-01-29T18:38:58.319Z",
    "size": 295310,
    "path": "../public/india_maldhavi_luna/assets/images/india libro 1.jpg"
  },
  "/india_maldhavi_luna/assets/images/india mahdavi 3.jpg": {
    "type": "image/jpeg",
    "etag": "\"3af93-ORYa6pPe3WuCNrWozx6uoh4iRdM\"",
    "mtime": "2024-01-29T18:38:58.317Z",
    "size": 241555,
    "path": "../public/india_maldhavi_luna/assets/images/india mahdavi 3.jpg"
  },
  "/india_maldhavi_luna/assets/images/instagram.png": {
    "type": "image/png",
    "etag": "\"3e6f-39BfQFxAuPtktv1Nug2EIYVtcSc\"",
    "mtime": "2024-01-29T18:38:58.316Z",
    "size": 15983,
    "path": "../public/india_maldhavi_luna/assets/images/instagram.png"
  },
  "/india_maldhavi_luna/assets/images/logotipo-de-pinterest.png": {
    "type": "image/png",
    "etag": "\"2a34-sdCJAK/rnCXSZkxsWdMJGaQmiMM\"",
    "mtime": "2024-01-29T18:38:58.315Z",
    "size": 10804,
    "path": "../public/india_maldhavi_luna/assets/images/logotipo-de-pinterest.png"
  },
  "/india_maldhavi_luna/assets/images/montecarlo-beach.jpg": {
    "type": "image/jpeg",
    "etag": "\"1ff41-PdHg+33eHhHAPQkbi1Wl0UZow3I\"",
    "mtime": "2024-01-29T18:38:58.314Z",
    "size": 130881,
    "path": "../public/india_maldhavi_luna/assets/images/montecarlo-beach.jpg"
  },
  "/india_maldhavi_luna/assets/images/redvalentino.jpg": {
    "type": "image/jpeg",
    "etag": "\"bae0-HFheYhQfD39dyXVZbq9RwzAOhYU\"",
    "mtime": "2024-01-29T18:38:58.313Z",
    "size": 47840,
    "path": "../public/india_maldhavi_luna/assets/images/redvalentino.jpg"
  },
  "/iris_apfel_marta/assets/css/style.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"1501-eOEyszuBqk7UJyVUcxqhYf9j148\"",
    "mtime": "2024-01-29T18:38:58.304Z",
    "size": 5377,
    "path": "../public/iris_apfel_marta/assets/css/style.css"
  },
  "/iris_apfel_marta/assets/images/1.1.jpg": {
    "type": "image/jpeg",
    "etag": "\"11059-klStEBCJr2rZa7dlFXNvnWysmPk\"",
    "mtime": "2024-01-29T18:38:58.302Z",
    "size": 69721,
    "path": "../public/iris_apfel_marta/assets/images/1.1.jpg"
  },
  "/iris_apfel_marta/assets/images/10.png": {
    "type": "image/png",
    "etag": "\"3670d-Brszqartiv43t5snBBU97MucmIM\"",
    "mtime": "2024-01-29T18:38:58.300Z",
    "size": 222989,
    "path": "../public/iris_apfel_marta/assets/images/10.png"
  },
  "/iris_apfel_marta/assets/images/11.2.jpg": {
    "type": "image/jpeg",
    "etag": "\"29f90-ioahU8NctoPIAzZCWiOSMV7ZyKE\"",
    "mtime": "2024-01-29T18:38:58.299Z",
    "size": 171920,
    "path": "../public/iris_apfel_marta/assets/images/11.2.jpg"
  },
  "/iris_apfel_marta/assets/images/11.jpg": {
    "type": "image/jpeg",
    "etag": "\"2fa8f-Tmhcw4S1PXuuOQBtSxPH+Nd5WDE\"",
    "mtime": "2024-01-29T18:38:58.297Z",
    "size": 195215,
    "path": "../public/iris_apfel_marta/assets/images/11.jpg"
  },
  "/iris_apfel_marta/assets/images/12.jpg": {
    "type": "image/jpeg",
    "etag": "\"2c953-brEZDBacW52ki+uGIMMj02YTAGc\"",
    "mtime": "2024-01-29T18:38:58.295Z",
    "size": 182611,
    "path": "../public/iris_apfel_marta/assets/images/12.jpg"
  },
  "/iris_apfel_marta/assets/images/13.jpg": {
    "type": "image/jpeg",
    "etag": "\"1c380-cR1MyL0p8Y3PTqsyBi8ymJ+DeoA\"",
    "mtime": "2024-01-29T18:38:58.294Z",
    "size": 115584,
    "path": "../public/iris_apfel_marta/assets/images/13.jpg"
  },
  "/iris_apfel_marta/assets/images/14.jpg": {
    "type": "image/jpeg",
    "etag": "\"17066-6baWcMtqawGjPZIVSFEQ20TZ0Ws\"",
    "mtime": "2024-01-29T18:38:58.293Z",
    "size": 94310,
    "path": "../public/iris_apfel_marta/assets/images/14.jpg"
  },
  "/iris_apfel_marta/assets/images/15.jpg": {
    "type": "image/jpeg",
    "etag": "\"5f5a9-4w84BbRacS/vs9bvO2yPuLyM/e4\"",
    "mtime": "2024-01-29T18:38:58.291Z",
    "size": 390569,
    "path": "../public/iris_apfel_marta/assets/images/15.jpg"
  },
  "/iris_apfel_marta/assets/images/2.jpg": {
    "type": "image/jpeg",
    "etag": "\"bea9-/wNqOKJldMt1w7RZfvOQx61U1dc\"",
    "mtime": "2024-01-29T18:38:58.289Z",
    "size": 48809,
    "path": "../public/iris_apfel_marta/assets/images/2.jpg"
  },
  "/iris_apfel_marta/assets/images/4.1.jpg": {
    "type": "image/jpeg",
    "etag": "\"13456-i+dQ+N54zu1w/6b1c/0WkQTgzMk\"",
    "mtime": "2024-01-29T18:38:58.288Z",
    "size": 78934,
    "path": "../public/iris_apfel_marta/assets/images/4.1.jpg"
  },
  "/iris_apfel_marta/assets/images/4.jpg": {
    "type": "image/jpeg",
    "etag": "\"2862b-0ZugqC93YabwKre1kvya/N4Lh+4\"",
    "mtime": "2024-01-29T18:38:58.287Z",
    "size": 165419,
    "path": "../public/iris_apfel_marta/assets/images/4.jpg"
  },
  "/iris_apfel_marta/assets/images/5.jpg": {
    "type": "image/jpeg",
    "etag": "\"3f3af-w1ax6ZyxdnLZtQgNvcbZJqEijqM\"",
    "mtime": "2024-01-29T18:38:58.285Z",
    "size": 258991,
    "path": "../public/iris_apfel_marta/assets/images/5.jpg"
  },
  "/iris_apfel_marta/assets/images/6.1.jpg": {
    "type": "image/jpeg",
    "etag": "\"16efb-eJKMQhK1RmjZ8sNC3Eo5Fl64Ak8\"",
    "mtime": "2024-01-29T18:38:58.283Z",
    "size": 93947,
    "path": "../public/iris_apfel_marta/assets/images/6.1.jpg"
  },
  "/iris_apfel_marta/assets/images/7.1.jpg": {
    "type": "image/jpeg",
    "etag": "\"128fd-pzAA/IcldPMeBdSMvTK904wn4V8\"",
    "mtime": "2024-01-29T18:38:58.280Z",
    "size": 76029,
    "path": "../public/iris_apfel_marta/assets/images/7.1.jpg"
  },
  "/iris_apfel_marta/assets/images/8.1.jpg": {
    "type": "image/jpeg",
    "etag": "\"163f7-haNHP9sMzJ0RWt3dX5VWT/hQibk\"",
    "mtime": "2024-01-29T18:38:58.279Z",
    "size": 91127,
    "path": "../public/iris_apfel_marta/assets/images/8.1.jpg"
  },
  "/iris_apfel_marta/assets/images/9.1.jpg": {
    "type": "image/jpeg",
    "etag": "\"2dc59-sEvzc+s+Oe4GFgZ9K4z6OcBZ6Bw\"",
    "mtime": "2024-01-29T18:38:58.277Z",
    "size": 187481,
    "path": "../public/iris_apfel_marta/assets/images/9.1.jpg"
  },
  "/iris_apfel_marta/assets/images/9.jpg": {
    "type": "image/jpeg",
    "etag": "\"1f128-+BtlnOBe9LQuiT3t/xw2HwFwwRk\"",
    "mtime": "2024-01-29T18:38:58.275Z",
    "size": 127272,
    "path": "../public/iris_apfel_marta/assets/images/9.jpg"
  },
  "/iris_apfel_marta/assets/images/Fondo1.png": {
    "type": "image/png",
    "etag": "\"bbd59-UmDqqYR6g/1omDt1beh/syrI8XA\"",
    "mtime": "2024-01-29T18:38:58.273Z",
    "size": 769369,
    "path": "../public/iris_apfel_marta/assets/images/Fondo1.png"
  },
  "/iris_apfel_marta/assets/images/Fondo2.png": {
    "type": "image/png",
    "etag": "\"13e183-M5sUROqhyh7LboXVR18FPJhSVoQ\"",
    "mtime": "2024-01-29T18:38:58.270Z",
    "size": 1302915,
    "path": "../public/iris_apfel_marta/assets/images/Fondo2.png"
  },
  "/iris_apfel_marta/assets/images/Fondo3.png": {
    "type": "image/png",
    "etag": "\"14d144-uJS8ac7lYCRHkyYLAOB4sxfNi4k\"",
    "mtime": "2024-01-29T18:38:58.264Z",
    "size": 1364292,
    "path": "../public/iris_apfel_marta/assets/images/Fondo3.png"
  },
  "/iris_apfel_marta/assets/images/Iris-logo.png": {
    "type": "image/png",
    "etag": "\"5ad1-FIOZXYKHYRO0K1YUDfYCOsHoQW0\"",
    "mtime": "2024-01-29T18:38:58.258Z",
    "size": 23249,
    "path": "../public/iris_apfel_marta/assets/images/Iris-logo.png"
  },
  "/kelly_wearstler_virginia/assets/css/style.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"48c-GoWKoZ1no4IqX42KQJ6fx5Zht9c\"",
    "mtime": "2024-01-29T18:38:58.249Z",
    "size": 1164,
    "path": "../public/kelly_wearstler_virginia/assets/css/style.css"
  },
  "/kelly_wearstler_virginia/assets/img/asociaciones.jpeg": {
    "type": "image/jpeg",
    "etag": "\"4900c-6BMLL+uUWIZ9aMkxjqDhSYBvKIQ\"",
    "mtime": "2024-01-29T18:38:58.247Z",
    "size": 299020,
    "path": "../public/kelly_wearstler_virginia/assets/img/asociaciones.jpeg"
  },
  "/kelly_wearstler_virginia/assets/img/biografia-img1.jpeg": {
    "type": "image/jpeg",
    "etag": "\"a5c94-reiOxXQxnEBJGQ7In0KOseIfIw0\"",
    "mtime": "2024-01-29T18:38:58.244Z",
    "size": 679060,
    "path": "../public/kelly_wearstler_virginia/assets/img/biografia-img1.jpeg"
  },
  "/kelly_wearstler_virginia/assets/img/biografia-img2.jpeg": {
    "type": "image/jpeg",
    "etag": "\"105e1-BhNu7Cg8ZrUgQK4CzQ7ffTP5m4g\"",
    "mtime": "2024-01-29T18:38:58.241Z",
    "size": 67041,
    "path": "../public/kelly_wearstler_virginia/assets/img/biografia-img2.jpeg"
  },
  "/kelly_wearstler_virginia/assets/img/img-1.jpg": {
    "type": "image/jpeg",
    "etag": "\"49e68-FXFIXcVhXZqIPHN2CnGn+ps0Sec\"",
    "mtime": "2024-01-29T18:38:58.240Z",
    "size": 302696,
    "path": "../public/kelly_wearstler_virginia/assets/img/img-1.jpg"
  },
  "/kelly_wearstler_virginia/assets/img/logo.jpeg": {
    "type": "image/jpeg",
    "etag": "\"8b15-RXAU50SULwMWd8xJ3wGaC9IehK4\"",
    "mtime": "2024-01-29T18:38:58.237Z",
    "size": 35605,
    "path": "../public/kelly_wearstler_virginia/assets/img/logo.jpeg"
  },
  "/kelly_wearstler_virginia/assets/img/obras-1.jpeg": {
    "type": "image/jpeg",
    "etag": "\"9d9d3-8WkbV5ZFAbcGuQYlsweG1qx+C8k\"",
    "mtime": "2024-01-29T18:38:58.236Z",
    "size": 645587,
    "path": "../public/kelly_wearstler_virginia/assets/img/obras-1.jpeg"
  },
  "/kelly_wearstler_virginia/assets/img/obras-2.jpeg": {
    "type": "image/jpeg",
    "etag": "\"44798-6nXQMb1Urjxd+9oPE/Ob7QuyjIk\"",
    "mtime": "2024-01-29T18:38:58.232Z",
    "size": 280472,
    "path": "../public/kelly_wearstler_virginia/assets/img/obras-2.jpeg"
  },
  "/kelly_wearstler_virginia/assets/img/obras-3.jpeg": {
    "type": "image/jpeg",
    "etag": "\"39dac-RB+jL6PjUtZNK18gft5VJ/+Q3ZQ\"",
    "mtime": "2024-01-29T18:38:58.230Z",
    "size": 236972,
    "path": "../public/kelly_wearstler_virginia/assets/img/obras-3.jpeg"
  },
  "/kelly_wearstler_virginia/assets/img/obras-4.jpeg": {
    "type": "image/jpeg",
    "etag": "\"8a325-J6j0hWK1FaZKNlHmHQIOSBl9WJ8\"",
    "mtime": "2024-01-29T18:38:58.228Z",
    "size": 566053,
    "path": "../public/kelly_wearstler_virginia/assets/img/obras-4.jpeg"
  },
  "/kelly_wearstler_virginia/assets/img/obras-5.jpeg": {
    "type": "image/jpeg",
    "etag": "\"1f726-KZlA8k/dUWI4KRhO7DJNRGcfs20\"",
    "mtime": "2024-01-29T18:38:58.226Z",
    "size": 128806,
    "path": "../public/kelly_wearstler_virginia/assets/img/obras-5.jpeg"
  },
  "/kelly_wearstler_virginia/assets/img/obras-6.jpeg": {
    "type": "image/jpeg",
    "etag": "\"609f2-V4MUrqbjfNAQtQ3oqRUP9jL5fhg\"",
    "mtime": "2024-01-29T18:38:58.224Z",
    "size": 395762,
    "path": "../public/kelly_wearstler_virginia/assets/img/obras-6.jpeg"
  },
  "/lina_bobardi_irene/assets/css/normalize.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"17fa-f/3jQ73xCt0fBS88QwihUYDrRAQ\"",
    "mtime": "2024-01-29T18:38:58.213Z",
    "size": 6138,
    "path": "../public/lina_bobardi_irene/assets/css/normalize.css"
  },
  "/lina_bobardi_irene/assets/css/styles.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"13f0-Ffyq2XAXWTELWkztJZvT0OM/iKg\"",
    "mtime": "2024-01-29T18:38:58.213Z",
    "size": 5104,
    "path": "../public/lina_bobardi_irene/assets/css/styles.css"
  },
  "/lina_bobardi_irene/assets/images/1.jpg": {
    "type": "image/jpeg",
    "etag": "\"da35-7LguJhAo9qi4JD9hssGZrSv3rNQ\"",
    "mtime": "2024-01-29T18:38:58.211Z",
    "size": 55861,
    "path": "../public/lina_bobardi_irene/assets/images/1.jpg"
  },
  "/lina_bobardi_irene/assets/images/1.png": {
    "type": "image/png",
    "etag": "\"101f6-pmI8lLUAju/4pjoKFWMp2+90WgU\"",
    "mtime": "2024-01-29T18:38:58.210Z",
    "size": 66038,
    "path": "../public/lina_bobardi_irene/assets/images/1.png"
  },
  "/lina_bobardi_irene/assets/images/11.jpg": {
    "type": "image/jpeg",
    "etag": "\"5dd5-wMdh18I4HCH5y0ceh/bpYi1ejLc\"",
    "mtime": "2024-01-29T18:38:58.209Z",
    "size": 24021,
    "path": "../public/lina_bobardi_irene/assets/images/11.jpg"
  },
  "/lina_bobardi_irene/assets/images/12.jpg": {
    "type": "image/jpeg",
    "etag": "\"2a0b-APRlPqIBCUbBcByKDuPd54t0fis\"",
    "mtime": "2024-01-29T18:38:58.208Z",
    "size": 10763,
    "path": "../public/lina_bobardi_irene/assets/images/12.jpg"
  },
  "/lina_bobardi_irene/assets/images/14.jpg": {
    "type": "image/jpeg",
    "etag": "\"9813-VkK3kyMz10ppxp4guZUUJEZpcO8\"",
    "mtime": "2024-01-29T18:38:58.207Z",
    "size": 38931,
    "path": "../public/lina_bobardi_irene/assets/images/14.jpg"
  },
  "/lina_bobardi_irene/assets/images/15.jpg": {
    "type": "image/jpeg",
    "etag": "\"2fd23-kE1obcRH3F11go9A9/rqAez/YYk\"",
    "mtime": "2024-01-29T18:38:58.204Z",
    "size": 195875,
    "path": "../public/lina_bobardi_irene/assets/images/15.jpg"
  },
  "/lina_bobardi_irene/assets/images/16.jpeg": {
    "type": "image/jpeg",
    "etag": "\"40f68-atHEXVfrkPQrvSZ6SUyWwB/1EJ0\"",
    "mtime": "2024-01-29T18:38:58.203Z",
    "size": 266088,
    "path": "../public/lina_bobardi_irene/assets/images/16.jpeg"
  },
  "/lina_bobardi_irene/assets/images/17.jpg": {
    "type": "image/jpeg",
    "etag": "\"bfd6-SoItp2Go6CcvPbLLoI7h0rluGzE\"",
    "mtime": "2024-01-29T18:38:58.201Z",
    "size": 49110,
    "path": "../public/lina_bobardi_irene/assets/images/17.jpg"
  },
  "/lina_bobardi_irene/assets/images/18.jpeg": {
    "type": "image/jpeg",
    "etag": "\"3f0bd-tLUiAd49xuk6brpwIt10F+GaPDE\"",
    "mtime": "2024-01-29T18:38:58.200Z",
    "size": 258237,
    "path": "../public/lina_bobardi_irene/assets/images/18.jpeg"
  },
  "/lina_bobardi_irene/assets/images/19.jpeg": {
    "type": "image/jpeg",
    "etag": "\"744e-TTZF/diGmChejKUdRU7D6JPgzro\"",
    "mtime": "2024-01-29T18:38:58.198Z",
    "size": 29774,
    "path": "../public/lina_bobardi_irene/assets/images/19.jpeg"
  },
  "/lina_bobardi_irene/assets/images/2.jpg": {
    "type": "image/jpeg",
    "etag": "\"c6aa-npBN8lINmEXm7xsHGIsC+gmFGDI\"",
    "mtime": "2024-01-29T18:38:58.195Z",
    "size": 50858,
    "path": "../public/lina_bobardi_irene/assets/images/2.jpg"
  },
  "/lina_bobardi_irene/assets/images/2.png": {
    "type": "image/png",
    "etag": "\"1b390-Q7ZMj0mBsIc7Q3fdkIp1qabteew\"",
    "mtime": "2024-01-29T18:38:58.194Z",
    "size": 111504,
    "path": "../public/lina_bobardi_irene/assets/images/2.png"
  },
  "/lina_bobardi_irene/assets/images/20.jpg": {
    "type": "image/jpeg",
    "etag": "\"13f9e-Qf16xMMjjCJqF7tm7weT/KKotrM\"",
    "mtime": "2024-01-29T18:38:58.192Z",
    "size": 81822,
    "path": "../public/lina_bobardi_irene/assets/images/20.jpg"
  },
  "/lina_bobardi_irene/assets/images/21.jpg": {
    "type": "image/jpeg",
    "etag": "\"13b37-NSd8fcSsiSKs/A5yIIfKi4J7FHA\"",
    "mtime": "2024-01-29T18:38:58.191Z",
    "size": 80695,
    "path": "../public/lina_bobardi_irene/assets/images/21.jpg"
  },
  "/lina_bobardi_irene/assets/images/22.jpg": {
    "type": "image/jpeg",
    "etag": "\"24d7f-hveGbF7fHNpzYRwRyFxCbLGnhqQ\"",
    "mtime": "2024-01-29T18:38:58.190Z",
    "size": 150911,
    "path": "../public/lina_bobardi_irene/assets/images/22.jpg"
  },
  "/lina_bobardi_irene/assets/images/24.jpeg": {
    "type": "image/jpeg",
    "etag": "\"1fdbc-zyMjWGDG1PC5dFtxqIqRFrmTaD0\"",
    "mtime": "2024-01-29T18:38:58.189Z",
    "size": 130492,
    "path": "../public/lina_bobardi_irene/assets/images/24.jpeg"
  },
  "/lina_bobardi_irene/assets/images/25.jpg": {
    "type": "image/jpeg",
    "etag": "\"215da-gbs9WZxpxsJ9OAeahksu3s/Qi6Q\"",
    "mtime": "2024-01-29T18:38:58.187Z",
    "size": 136666,
    "path": "../public/lina_bobardi_irene/assets/images/25.jpg"
  },
  "/lina_bobardi_irene/assets/images/28.jpg": {
    "type": "image/jpeg",
    "etag": "\"1ebc7-ZIK251lhbIKnBk+b46t0NxqPacs\"",
    "mtime": "2024-01-29T18:38:58.186Z",
    "size": 125895,
    "path": "../public/lina_bobardi_irene/assets/images/28.jpg"
  },
  "/lina_bobardi_irene/assets/images/29.jpg": {
    "type": "image/jpeg",
    "etag": "\"15dfd-/G1rhMcZwNoKvF/qHKaFfJ8qiGA\"",
    "mtime": "2024-01-29T18:38:58.185Z",
    "size": 89597,
    "path": "../public/lina_bobardi_irene/assets/images/29.jpg"
  },
  "/lina_bobardi_irene/assets/images/3.jpg": {
    "type": "image/jpeg",
    "etag": "\"16445-D+b3zn2oPpVXOrGdfHuJQeNUUYA\"",
    "mtime": "2024-01-29T18:38:58.184Z",
    "size": 91205,
    "path": "../public/lina_bobardi_irene/assets/images/3.jpg"
  },
  "/lina_bobardi_irene/assets/images/3.png": {
    "type": "image/png",
    "etag": "\"da49-172OAeYRHJw0+jVuluVHzmkE43o\"",
    "mtime": "2024-01-29T18:38:58.182Z",
    "size": 55881,
    "path": "../public/lina_bobardi_irene/assets/images/3.png"
  },
  "/lina_bobardi_irene/assets/images/30.jpg": {
    "type": "image/jpeg",
    "etag": "\"1b025-ntaphCfQsQypn2Hh9czl9Bp1n0w\"",
    "mtime": "2024-01-29T18:38:58.181Z",
    "size": 110629,
    "path": "../public/lina_bobardi_irene/assets/images/30.jpg"
  },
  "/lina_bobardi_irene/assets/images/31.jpg": {
    "type": "image/jpeg",
    "etag": "\"19024-bEbGOY0Qzns7y6edTOlAm71zQUI\"",
    "mtime": "2024-01-29T18:38:58.180Z",
    "size": 102436,
    "path": "../public/lina_bobardi_irene/assets/images/31.jpg"
  },
  "/lina_bobardi_irene/assets/images/33.jpg": {
    "type": "image/jpeg",
    "etag": "\"b045-uakgkoMH4UtcMnY+glYQTn6fAtQ\"",
    "mtime": "2024-01-29T18:38:58.178Z",
    "size": 45125,
    "path": "../public/lina_bobardi_irene/assets/images/33.jpg"
  },
  "/lina_bobardi_irene/assets/images/34.jpg": {
    "type": "image/jpeg",
    "etag": "\"c0e2-maMZwKo1c32Wn7LehI0xBwAtDZo\"",
    "mtime": "2024-01-29T18:38:58.177Z",
    "size": 49378,
    "path": "../public/lina_bobardi_irene/assets/images/34.jpg"
  },
  "/lina_bobardi_irene/assets/images/35.jpg": {
    "type": "image/jpeg",
    "etag": "\"cdae-TtzAIcnMvesE4jg2MHkBZNrg954\"",
    "mtime": "2024-01-29T18:38:58.176Z",
    "size": 52654,
    "path": "../public/lina_bobardi_irene/assets/images/35.jpg"
  },
  "/lina_bobardi_irene/assets/images/36.jpg": {
    "type": "image/jpeg",
    "etag": "\"2c68a-/7nt4kmzKwOpKWwozfC7saWEqVc\"",
    "mtime": "2024-01-29T18:38:58.175Z",
    "size": 181898,
    "path": "../public/lina_bobardi_irene/assets/images/36.jpg"
  },
  "/lina_bobardi_irene/assets/images/38.jpg": {
    "type": "image/jpeg",
    "etag": "\"2c0f9-43fqK8nzEk8iH0ovtpvdo+2jaxU\"",
    "mtime": "2024-01-29T18:38:58.173Z",
    "size": 180473,
    "path": "../public/lina_bobardi_irene/assets/images/38.jpg"
  },
  "/lina_bobardi_irene/assets/images/4.png": {
    "type": "image/png",
    "etag": "\"ded4-lap9UrTD13uL+k1N2yWEDnBoeDc\"",
    "mtime": "2024-01-29T18:38:58.172Z",
    "size": 57044,
    "path": "../public/lina_bobardi_irene/assets/images/4.png"
  },
  "/lina_bobardi_irene/assets/images/40.jpg": {
    "type": "image/jpeg",
    "etag": "\"358c6-pZkKGcFBXMSgVZFnoYIarsOqueQ\"",
    "mtime": "2024-01-29T18:38:58.171Z",
    "size": 219334,
    "path": "../public/lina_bobardi_irene/assets/images/40.jpg"
  },
  "/lina_bobardi_irene/assets/images/41.jpg": {
    "type": "image/jpeg",
    "etag": "\"45ef6-eWiv1bkQoZ8T7SMHDqOaNXESm1E\"",
    "mtime": "2024-01-29T18:38:58.168Z",
    "size": 286454,
    "path": "../public/lina_bobardi_irene/assets/images/41.jpg"
  },
  "/lina_bobardi_irene/assets/images/42.jpg": {
    "type": "image/jpeg",
    "etag": "\"26c04-kDJUwdwjn2NXmmnFK7r9WXob0z4\"",
    "mtime": "2024-01-29T18:38:58.166Z",
    "size": 158724,
    "path": "../public/lina_bobardi_irene/assets/images/42.jpg"
  },
  "/lina_bobardi_irene/assets/images/43.jpg": {
    "type": "image/jpeg",
    "etag": "\"205e5-sPeOH2rl8cDuEmKdURFs43AhJSc\"",
    "mtime": "2024-01-29T18:38:58.164Z",
    "size": 132581,
    "path": "../public/lina_bobardi_irene/assets/images/43.jpg"
  },
  "/lina_bobardi_irene/assets/images/44.jpg": {
    "type": "image/jpeg",
    "etag": "\"7cbb-Z0Wh3g+lIhpAry5Um7/7q26SL58\"",
    "mtime": "2024-01-29T18:38:58.163Z",
    "size": 31931,
    "path": "../public/lina_bobardi_irene/assets/images/44.jpg"
  },
  "/lina_bobardi_irene/assets/images/45.jpg": {
    "type": "image/jpeg",
    "etag": "\"10df4-Q/jXNLC2u0otl+Yjd9353nYchME\"",
    "mtime": "2024-01-29T18:38:58.162Z",
    "size": 69108,
    "path": "../public/lina_bobardi_irene/assets/images/45.jpg"
  },
  "/lina_bobardi_irene/assets/images/46.jpg": {
    "type": "image/jpeg",
    "etag": "\"5f25-qDb/loFwY1eR7eM8MlVkRpyaIE4\"",
    "mtime": "2024-01-29T18:38:58.161Z",
    "size": 24357,
    "path": "../public/lina_bobardi_irene/assets/images/46.jpg"
  },
  "/lina_bobardi_irene/assets/images/5.png": {
    "type": "image/png",
    "etag": "\"7388-250SzuadAUDdjDj+SUbRnO4B38g\"",
    "mtime": "2024-01-29T18:38:58.160Z",
    "size": 29576,
    "path": "../public/lina_bobardi_irene/assets/images/5.png"
  },
  "/lina_bobardi_irene/assets/images/6.png": {
    "type": "image/png",
    "etag": "\"ae33-7zO1ki4r6nf4BSiF/dA10KcPbWQ\"",
    "mtime": "2024-01-29T18:38:58.159Z",
    "size": 44595,
    "path": "../public/lina_bobardi_irene/assets/images/6.png"
  },
  "/lina_bobardi_irene/assets/images/formaabstracta.png": {
    "type": "image/png",
    "etag": "\"b3e-gg39fc22fvIV8Kn+qi6waS/JlRU\"",
    "mtime": "2024-01-29T18:38:58.158Z",
    "size": 2878,
    "path": "../public/lina_bobardi_irene/assets/images/formaabstracta.png"
  },
  "/lotta_agaton_clara/assets/css/normalize.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"17de-UfGtngwWcgiw1DWfJmI0d/vGoBY\"",
    "mtime": "2024-01-29T18:38:58.144Z",
    "size": 6110,
    "path": "../public/lotta_agaton_clara/assets/css/normalize.css"
  },
  "/lotta_agaton_clara/assets/css/styles.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"1c53-NWmnb49GyZHEEZCE0vuuTY4sy6E\"",
    "mtime": "2024-01-29T18:38:58.144Z",
    "size": 7251,
    "path": "../public/lotta_agaton_clara/assets/css/styles.css"
  },
  "/lotta_agaton_clara/assets/images/bio.png": {
    "type": "image/png",
    "etag": "\"3ffec-X+Cywnb3+fDQ6dLBH/PGgvyM9Ns\"",
    "mtime": "2024-01-29T18:38:58.142Z",
    "size": 262124,
    "path": "../public/lotta_agaton_clara/assets/images/bio.png"
  },
  "/lotta_agaton_clara/assets/images/bio1.png": {
    "type": "image/png",
    "etag": "\"22721-/VSoXDwkP3dV33QY49tkwhZdqSA\"",
    "mtime": "2024-01-29T18:38:58.141Z",
    "size": 141089,
    "path": "../public/lotta_agaton_clara/assets/images/bio1.png"
  },
  "/lotta_agaton_clara/assets/images/bio2.png": {
    "type": "image/png",
    "etag": "\"59f88-vdwUrq8uQreaq4k5/Jc7qEug3xc\"",
    "mtime": "2024-01-29T18:38:58.139Z",
    "size": 368520,
    "path": "../public/lotta_agaton_clara/assets/images/bio2.png"
  },
  "/lotta_agaton_clara/assets/images/bio3.png": {
    "type": "image/png",
    "etag": "\"5a4fa-PYQs+Xxm9hxVGbIDFYc1IozGN8c\"",
    "mtime": "2024-01-29T18:38:58.137Z",
    "size": 369914,
    "path": "../public/lotta_agaton_clara/assets/images/bio3.png"
  },
  "/lotta_agaton_clara/assets/images/concepto.png": {
    "type": "image/png",
    "etag": "\"15d4be-nj+8fPNnSnsgxvLQvyYFiKkT+1M\"",
    "mtime": "2024-01-29T18:38:58.134Z",
    "size": 1430718,
    "path": "../public/lotta_agaton_clara/assets/images/concepto.png"
  },
  "/lotta_agaton_clara/assets/images/concepto2.png": {
    "type": "image/png",
    "etag": "\"304d2-LP6/YUB/Aa1Rk2+5NN4ujkTfNio\"",
    "mtime": "2024-01-29T18:38:58.128Z",
    "size": 197842,
    "path": "../public/lotta_agaton_clara/assets/images/concepto2.png"
  },
  "/lotta_agaton_clara/assets/images/concepto3.png": {
    "type": "image/png",
    "etag": "\"7792c-kKP1Wa843hpHdz6GVgYTGdtw2B8\"",
    "mtime": "2024-01-29T18:38:58.126Z",
    "size": 489772,
    "path": "../public/lotta_agaton_clara/assets/images/concepto3.png"
  },
  "/lotta_agaton_clara/assets/images/direccioncreativa.png": {
    "type": "image/png",
    "etag": "\"1838b-5XzivBjzsBsH0m4soUGoTBdLqfw\"",
    "mtime": "2024-01-29T18:38:58.124Z",
    "size": 99211,
    "path": "../public/lotta_agaton_clara/assets/images/direccioncreativa.png"
  },
  "/lotta_agaton_clara/assets/images/direccioncreativa1.png": {
    "type": "image/png",
    "etag": "\"506a4-iVoYsfIV3wllJy5MQBO8TFueLKE\"",
    "mtime": "2024-01-29T18:38:58.123Z",
    "size": 329380,
    "path": "../public/lotta_agaton_clara/assets/images/direccioncreativa1.png"
  },
  "/lotta_agaton_clara/assets/images/direccioncreativa2.png": {
    "type": "image/png",
    "etag": "\"60f1d-fgNwOWheey4ymtX2K2qRA10ppSI\"",
    "mtime": "2024-01-29T18:38:58.121Z",
    "size": 397085,
    "path": "../public/lotta_agaton_clara/assets/images/direccioncreativa2.png"
  },
  "/lotta_agaton_clara/assets/images/estilo.png": {
    "type": "image/png",
    "etag": "\"e004-UW+IrREXtSHZIqN9bkjk3gZ8V+8\"",
    "mtime": "2024-01-29T18:38:58.118Z",
    "size": 57348,
    "path": "../public/lotta_agaton_clara/assets/images/estilo.png"
  },
  "/lotta_agaton_clara/assets/images/estilo1.png": {
    "type": "image/png",
    "etag": "\"51c41-5nciQZpjeLAE5qM7oKxin84F34o\"",
    "mtime": "2024-01-29T18:38:58.117Z",
    "size": 334913,
    "path": "../public/lotta_agaton_clara/assets/images/estilo1.png"
  },
  "/lotta_agaton_clara/assets/images/estilo2.png": {
    "type": "image/png",
    "etag": "\"4f8ed-D3qYk+Y4nnXrNDG54+6/Q4tPh/E\"",
    "mtime": "2024-01-29T18:38:58.115Z",
    "size": 325869,
    "path": "../public/lotta_agaton_clara/assets/images/estilo2.png"
  },
  "/lotta_agaton_clara/assets/images/estudio.png": {
    "type": "image/png",
    "etag": "\"16674-DV+vTMZw7XbAIRE8tsm5ElcWFYI\"",
    "mtime": "2024-01-29T18:38:58.113Z",
    "size": 91764,
    "path": "../public/lotta_agaton_clara/assets/images/estudio.png"
  },
  "/lotta_agaton_clara/assets/images/estudio1.png": {
    "type": "image/png",
    "etag": "\"49d76-mkA0TCylcUeUjW//danx9cL4eBM\"",
    "mtime": "2024-01-29T18:38:58.111Z",
    "size": 302454,
    "path": "../public/lotta_agaton_clara/assets/images/estudio1.png"
  },
  "/lotta_agaton_clara/assets/images/estudio2.png": {
    "type": "image/png",
    "etag": "\"35eb8-gNzASXyNuJucl3MdB0566bPnWAw\"",
    "mtime": "2024-01-29T18:38:58.109Z",
    "size": 220856,
    "path": "../public/lotta_agaton_clara/assets/images/estudio2.png"
  },
  "/lotta_agaton_clara/assets/images/estudio3.png": {
    "type": "image/png",
    "etag": "\"29e5c-NXyD2oonBV+QkPC/3/ZhV8JdujI\"",
    "mtime": "2024-01-29T18:38:58.107Z",
    "size": 171612,
    "path": "../public/lotta_agaton_clara/assets/images/estudio3.png"
  },
  "/lotta_agaton_clara/assets/images/estudio4.png": {
    "type": "image/png",
    "etag": "\"1ab7e-PQwtWSCKzZ+oygKruf3mbtEGPBY\"",
    "mtime": "2024-01-29T18:38:58.106Z",
    "size": 109438,
    "path": "../public/lotta_agaton_clara/assets/images/estudio4.png"
  },
  "/lotta_agaton_clara/assets/images/logo.png": {
    "type": "image/png",
    "etag": "\"2770-rZWZFC4h23Mc7t4jESbRHkLAuFg\"",
    "mtime": "2024-01-29T18:38:58.104Z",
    "size": 10096,
    "path": "../public/lotta_agaton_clara/assets/images/logo.png"
  },
  "/lotta_agaton_clara/assets/images/lotta.png": {
    "type": "image/png",
    "etag": "\"5d1b6-7wPiLk1eqSQESfekPp3O+Zoyzpk\"",
    "mtime": "2024-01-29T18:38:58.103Z",
    "size": 381366,
    "path": "../public/lotta_agaton_clara/assets/images/lotta.png"
  },
  "/matali_crasset_carolina/assets/css/styles.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"3e33-R8+JVueK6vAvq7spG0SRUXCDUYA\"",
    "mtime": "2024-01-29T18:38:58.088Z",
    "size": 15923,
    "path": "../public/matali_crasset_carolina/assets/css/styles.css"
  },
  "/matali_crasset_carolina/assets/img/bosque.jpg": {
    "type": "image/jpeg",
    "etag": "\"9fb0d-gMWyFZvD6kNkqwhoYN2PzFqAaYY\"",
    "mtime": "2024-01-29T18:38:58.086Z",
    "size": 654093,
    "path": "../public/matali_crasset_carolina/assets/img/bosque.jpg"
  },
  "/matali_crasset_carolina/assets/img/comedor.png": {
    "type": "image/png",
    "etag": "\"72d48-SROU8ULgKSiGmMioOkKlkR5pXzU\"",
    "mtime": "2024-01-29T18:38:58.083Z",
    "size": 470344,
    "path": "../public/matali_crasset_carolina/assets/img/comedor.png"
  },
  "/matali_crasset_carolina/assets/img/envoltoriogalletas.jpg": {
    "type": "image/jpeg",
    "etag": "\"2b0e4-pQfwAqWRAi9uGsVGtuj8nA8rW9k\"",
    "mtime": "2024-01-29T18:38:58.081Z",
    "size": 176356,
    "path": "../public/matali_crasset_carolina/assets/img/envoltoriogalletas.jpg"
  },
  "/matali_crasset_carolina/assets/img/icon_return.png": {
    "type": "image/png",
    "etag": "\"80-JSKFwKTEQKDfh/3Iv18MNpxlHyY\"",
    "mtime": "2024-01-29T18:38:58.080Z",
    "size": 128,
    "path": "../public/matali_crasset_carolina/assets/img/icon_return.png"
  },
  "/matali_crasset_carolina/assets/img/proy1.jpg": {
    "type": "image/jpeg",
    "etag": "\"16e98-qBOTTHUpfQ+6mGOskQe8EMJEYu0\"",
    "mtime": "2024-01-29T18:38:58.079Z",
    "size": 93848,
    "path": "../public/matali_crasset_carolina/assets/img/proy1.jpg"
  },
  "/matali_crasset_carolina/assets/img/proy1_2.jpg": {
    "type": "image/jpeg",
    "etag": "\"1aa74-b4WfwHlqsKc0mXSwddY9ymv53sw\"",
    "mtime": "2024-01-29T18:38:58.077Z",
    "size": 109172,
    "path": "../public/matali_crasset_carolina/assets/img/proy1_2.jpg"
  },
  "/matali_crasset_carolina/assets/img/proy1_3.png": {
    "type": "image/png",
    "etag": "\"20c0e-Et1UHx7uJKEbNAITT/V1FHKnrEU\"",
    "mtime": "2024-01-29T18:38:58.075Z",
    "size": 134158,
    "path": "../public/matali_crasset_carolina/assets/img/proy1_3.png"
  },
  "/matali_crasset_carolina/assets/img/proy2.jpg": {
    "type": "image/jpeg",
    "etag": "\"58ad-t9ohkaRmtCeBS59q2BadczWzKec\"",
    "mtime": "2024-01-29T18:38:58.074Z",
    "size": 22701,
    "path": "../public/matali_crasset_carolina/assets/img/proy2.jpg"
  },
  "/matali_crasset_carolina/assets/img/proy2_2.jpg": {
    "type": "image/jpeg",
    "etag": "\"15b7a-lrdMehV9SJ9Ls9VBGlCltryhBEw\"",
    "mtime": "2024-01-29T18:38:58.073Z",
    "size": 88954,
    "path": "../public/matali_crasset_carolina/assets/img/proy2_2.jpg"
  },
  "/matali_crasset_carolina/assets/img/proy2_3.jpg": {
    "type": "image/jpeg",
    "etag": "\"a849-9gknJF4zWfh7b+CiVdobV7jO29w\"",
    "mtime": "2024-01-29T18:38:58.072Z",
    "size": 43081,
    "path": "../public/matali_crasset_carolina/assets/img/proy2_3.jpg"
  },
  "/matali_crasset_carolina/assets/img/proy2_4.jpg": {
    "type": "image/jpeg",
    "etag": "\"f803-i3Z5+LrauJBSPmlnX42X3meQr4Y\"",
    "mtime": "2024-01-29T18:38:58.070Z",
    "size": 63491,
    "path": "../public/matali_crasset_carolina/assets/img/proy2_4.jpg"
  },
  "/matali_crasset_carolina/assets/img/proy2_5.jpg": {
    "type": "image/jpeg",
    "etag": "\"394f-qclATSLKnOQTtQAjXiLFSqmhyo8\"",
    "mtime": "2024-01-29T18:38:58.070Z",
    "size": 14671,
    "path": "../public/matali_crasset_carolina/assets/img/proy2_5.jpg"
  },
  "/matali_crasset_carolina/assets/img/proy3.jpg": {
    "type": "image/jpeg",
    "etag": "\"4b5d1-wy7MOktgtJuv8DX+zqxzfeECdY4\"",
    "mtime": "2024-01-29T18:38:58.069Z",
    "size": 308689,
    "path": "../public/matali_crasset_carolina/assets/img/proy3.jpg"
  },
  "/matali_crasset_carolina/assets/img/proy3_2.jpg": {
    "type": "image/jpeg",
    "etag": "\"24d2f-2HgH2SZSYWK5bv1pD4x+v1BuLvo\"",
    "mtime": "2024-01-29T18:38:58.066Z",
    "size": 150831,
    "path": "../public/matali_crasset_carolina/assets/img/proy3_2.jpg"
  },
  "/matali_crasset_carolina/assets/img/proy3_3.jpg": {
    "type": "image/jpeg",
    "etag": "\"3bd3b-eoQZzPSegHsKGa/DhU7/hzgvJlk\"",
    "mtime": "2024-01-29T18:38:58.064Z",
    "size": 245051,
    "path": "../public/matali_crasset_carolina/assets/img/proy3_3.jpg"
  },
  "/matali_crasset_carolina/assets/img/proy4.jpg": {
    "type": "image/jpeg",
    "etag": "\"5b356-kduKcDedOAPmU8XG4EnDwGxCgXs\"",
    "mtime": "2024-01-29T18:38:58.063Z",
    "size": 373590,
    "path": "../public/matali_crasset_carolina/assets/img/proy4.jpg"
  },
  "/matali_crasset_carolina/assets/img/proy4_2.jpg": {
    "type": "image/jpeg",
    "etag": "\"1e8de-nq0InEdpIdAGGS3gVwQOsVdUYlY\"",
    "mtime": "2024-01-29T18:38:58.061Z",
    "size": 125150,
    "path": "../public/matali_crasset_carolina/assets/img/proy4_2.jpg"
  },
  "/matali_crasset_carolina/assets/img/proy4_3.jpg": {
    "type": "image/jpeg",
    "etag": "\"454f5-9s1G6jJMiWLaUB/sVXYgCnPZhpM\"",
    "mtime": "2024-01-29T18:38:58.059Z",
    "size": 283893,
    "path": "../public/matali_crasset_carolina/assets/img/proy4_3.jpg"
  },
  "/matali_crasset_carolina/assets/img/proy5.jpg": {
    "type": "image/jpeg",
    "etag": "\"250d3-hbaWM/MxnqWDc6FM9HmHRx5uEQk\"",
    "mtime": "2024-01-29T18:38:58.057Z",
    "size": 151763,
    "path": "../public/matali_crasset_carolina/assets/img/proy5.jpg"
  },
  "/matali_crasset_carolina/assets/img/proy5_2.jpg": {
    "type": "image/jpeg",
    "etag": "\"43262-i8ysI8EdFcIBxAyfuu/0FHWJh+8\"",
    "mtime": "2024-01-29T18:38:58.056Z",
    "size": 275042,
    "path": "../public/matali_crasset_carolina/assets/img/proy5_2.jpg"
  },
  "/matali_crasset_carolina/assets/img/proy5_3.jpg": {
    "type": "image/jpeg",
    "etag": "\"b6a3-QXvGEM8V14b0G7al4WoFDozmfu8\"",
    "mtime": "2024-01-29T18:38:58.054Z",
    "size": 46755,
    "path": "../public/matali_crasset_carolina/assets/img/proy5_3.jpg"
  },
  "/matali_crasset_carolina/assets/img/proyecto1.jpg": {
    "type": "image/jpeg",
    "etag": "\"fb04-nYSD+A8xrYGhbJblnck6pcql2+c\"",
    "mtime": "2024-01-29T18:38:58.053Z",
    "size": 64260,
    "path": "../public/matali_crasset_carolina/assets/img/proyecto1.jpg"
  },
  "/matali_crasset_carolina/assets/img/proyecto2.jpg": {
    "type": "image/jpeg",
    "etag": "\"19081-l+KLB2ry6O/T1zGEhlK927UOBcE\"",
    "mtime": "2024-01-29T18:38:58.051Z",
    "size": 102529,
    "path": "../public/matali_crasset_carolina/assets/img/proyecto2.jpg"
  },
  "/matali_crasset_carolina/assets/img/proyecto4.jpg": {
    "type": "image/jpeg",
    "etag": "\"4afcf-YS6YWtkjcr4QrF+L0raxyomyP/E\"",
    "mtime": "2024-01-29T18:38:58.050Z",
    "size": 307151,
    "path": "../public/matali_crasset_carolina/assets/img/proyecto4.jpg"
  },
  "/matali_crasset_carolina/assets/img/proyecto5.jpg": {
    "type": "image/jpeg",
    "etag": "\"2ee22-rgHz54xEh9zaXCdjwE7OWkLmF3I\"",
    "mtime": "2024-01-29T18:38:58.048Z",
    "size": 192034,
    "path": "../public/matali_crasset_carolina/assets/img/proyecto5.jpg"
  },
  "/nani_marquina_david/assets/css/normalize.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"17fa-f/3jQ73xCt0fBS88QwihUYDrRAQ\"",
    "mtime": "2024-01-29T18:38:58.040Z",
    "size": 6138,
    "path": "../public/nani_marquina_david/assets/css/normalize.css"
  },
  "/nani_marquina_david/assets/css/styles.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"54c-b2uI2f2/CnFuxF130GmA6nnc/7A\"",
    "mtime": "2024-01-29T18:38:58.039Z",
    "size": 1356,
    "path": "../public/nani_marquina_david/assets/css/styles.css"
  },
  "/nani_marquina_david/assets/img/nani1.jpg": {
    "type": "image/jpeg",
    "etag": "\"4c4b1-9GT7refFZUn7YzTwzpHOLCoBXyU\"",
    "mtime": "2024-01-29T18:38:58.036Z",
    "size": 312497,
    "path": "../public/nani_marquina_david/assets/img/nani1.jpg"
  },
  "/nani_marquina_david/assets/img/nani2.jpg": {
    "type": "image/jpeg",
    "etag": "\"48dfa-T9TTunBcxnN+zm/KXrg/QJzBoHo\"",
    "mtime": "2024-01-29T18:38:58.034Z",
    "size": 298490,
    "path": "../public/nani_marquina_david/assets/img/nani2.jpg"
  },
  "/nani_marquina_david/pages/Colecciones/index.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"1580-xhrwviNIJy5pUcTfvww0OUC/jvo\"",
    "mtime": "2024-01-29T18:38:58.027Z",
    "size": 5504,
    "path": "../public/nani_marquina_david/pages/Colecciones/index.html"
  },
  "/nani_marquina_david/pages/Premios/index.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"9d5-0yUQFSIVv0YAt2YDd67avQdOY0A\"",
    "mtime": "2024-01-29T18:38:58.021Z",
    "size": 2517,
    "path": "../public/nani_marquina_david/pages/Premios/index.html"
  },
  "/nanna_ditzel_carla/assets/css/styles.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"1587-fCkP7PjDYx+o/pIqeboTbWqTDOA\"",
    "mtime": "2024-01-29T18:38:58.018Z",
    "size": 5511,
    "path": "../public/nanna_ditzel_carla/assets/css/styles.css"
  },
  "/nanna_ditzel_carla/assets/css/substyles.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"aac-EDKfMD2k7NWn2P06w4RG2l1+EfA\"",
    "mtime": "2024-01-29T18:38:58.017Z",
    "size": 2732,
    "path": "../public/nanna_ditzel_carla/assets/css/substyles.css"
  },
  "/nanna_ditzel_carla/assets/fonts/SportingGrotesque-Regular.otf": {
    "type": "font/otf",
    "etag": "\"705c-36BfT2/2YxUY53HFX8Ki6r6kwSQ\"",
    "mtime": "2024-01-29T18:38:58.015Z",
    "size": 28764,
    "path": "../public/nanna_ditzel_carla/assets/fonts/SportingGrotesque-Regular.otf"
  },
  "/nanna_ditzel_carla/assets/fonts/SportingGrotesque-Regular.woff": {
    "type": "font/woff",
    "etag": "\"5f58-IoM4ig3Iz60zSBiUCGw01TmiWms\"",
    "mtime": "2024-01-29T18:38:58.014Z",
    "size": 24408,
    "path": "../public/nanna_ditzel_carla/assets/fonts/SportingGrotesque-Regular.woff"
  },
  "/nanna_ditzel_carla/assets/fonts/SportingGrotesque-Regular.woff2": {
    "type": "font/woff2",
    "etag": "\"49d4-fSSRxJqKu8P9wE5bZRapQ9recSA\"",
    "mtime": "2024-01-29T18:38:58.013Z",
    "size": 18900,
    "path": "../public/nanna_ditzel_carla/assets/fonts/SportingGrotesque-Regular.woff2"
  },
  "/nanna_ditzel_carla/assets/images/0.1nannajorgen.jpg": {
    "type": "image/jpeg",
    "etag": "\"2087a-EvtEHJ4Kzk0gOWTJE7bjLfg/rio\"",
    "mtime": "2024-01-29T18:38:58.011Z",
    "size": 133242,
    "path": "../public/nanna_ditzel_carla/assets/images/0.1nannajorgen.jpg"
  },
  "/nanna_ditzel_carla/assets/images/0nannaditzel.jpg": {
    "type": "image/jpeg",
    "etag": "\"20092-TWfyOIl3akDh73pHArADmJvsCa8\"",
    "mtime": "2024-01-29T18:38:58.010Z",
    "size": 131218,
    "path": "../public/nanna_ditzel_carla/assets/images/0nannaditzel.jpg"
  },
  "/nanna_ditzel_carla/assets/images/178_0_20131209145857998-copia.jpg": {
    "type": "image/jpeg",
    "etag": "\"2c3f2-GTMhGcGaTK9Ei9cbYXIm8TgA8pk\"",
    "mtime": "2024-01-29T18:38:58.008Z",
    "size": 181234,
    "path": "../public/nanna_ditzel_carla/assets/images/178_0_20131209145857998-copia.jpg"
  },
  "/nanna_ditzel_carla/assets/images/1sillaikon.jpg": {
    "type": "image/jpeg",
    "etag": "\"1c8d3-PS8eFnhB9PS91rKHxbMDflRhbkU\"",
    "mtime": "2024-01-29T18:38:58.007Z",
    "size": 116947,
    "path": "../public/nanna_ditzel_carla/assets/images/1sillaikon.jpg"
  },
  "/nanna_ditzel_carla/assets/images/2sillatrinidad.jpg": {
    "type": "image/jpeg",
    "etag": "\"25d7f-5wxweYmi1FWJKMlySqLjSSBEwT8\"",
    "mtime": "2024-01-29T18:38:58.006Z",
    "size": 155007,
    "path": "../public/nanna_ditzel_carla/assets/images/2sillatrinidad.jpg"
  },
  "/nanna_ditzel_carla/assets/images/3sillaegg.jpg": {
    "type": "image/jpeg",
    "etag": "\"1d8c3-qeTfC8sE8tU8KUBO4dxRIDgv7gw\"",
    "mtime": "2024-01-29T18:38:58.004Z",
    "size": 121027,
    "path": "../public/nanna_ditzel_carla/assets/images/3sillaegg.jpg"
  },
  "/nanna_ditzel_carla/assets/images/4textilhallingdal.jpg": {
    "type": "image/jpeg",
    "etag": "\"38dfb-C7QNuUZnPTAIWAv06p0syc9BQtQ\"",
    "mtime": "2024-01-29T18:38:58.002Z",
    "size": 232955,
    "path": "../public/nanna_ditzel_carla/assets/images/4textilhallingdal.jpg"
  },
  "/nanna_ditzel_carla/assets/images/8bb47ae5412bf6560705e02c1c5e9c78-e1544022388764.jpg": {
    "type": "image/jpeg",
    "etag": "\"c918-1FZlygqaqBEuNVCEM3FxOHmdqjg\"",
    "mtime": "2024-01-29T18:38:58.001Z",
    "size": 51480,
    "path": "../public/nanna_ditzel_carla/assets/images/8bb47ae5412bf6560705e02c1c5e9c78-e1544022388764.jpg"
  },
  "/nanna_ditzel_carla/assets/images/P2938216.jpeg": {
    "type": "image/jpeg",
    "etag": "\"240ea-3UD5Bwde9kGH2vW8KFVJSSQgDCs\"",
    "mtime": "2024-01-29T18:38:58.000Z",
    "size": 147690,
    "path": "../public/nanna_ditzel_carla/assets/images/P2938216.jpeg"
  },
  "/nanna_ditzel_carla/assets/images/n-j300dpirobbw-background.png": {
    "type": "image/png",
    "etag": "\"d5a1c-im+odj0BtiDsjSp0gcIh8Ucxsvk\"",
    "mtime": "2024-01-29T18:38:57.998Z",
    "size": 875036,
    "path": "../public/nanna_ditzel_carla/assets/images/n-j300dpirobbw-background.png"
  },
  "/nanna_ditzel_carla/assets/images/nanna-ditzel-3-jpg-1592582444.jpg": {
    "type": "image/jpeg",
    "etag": "\"71d1-89M3Kqdzuhk8cPkGj9KXLuTltGQ\"",
    "mtime": "2024-01-29T18:38:57.994Z",
    "size": 29137,
    "path": "../public/nanna_ditzel_carla/assets/images/nanna-ditzel-3-jpg-1592582444.jpg"
  },
  "/nanna_ditzel_carla/assets/images/nannabartrisserob1.png": {
    "type": "image/png",
    "etag": "\"31a3c-FTSbEy5YKX62LqSsM98tUwfJmBs\"",
    "mtime": "2024-01-29T18:38:57.993Z",
    "size": 203324,
    "path": "../public/nanna_ditzel_carla/assets/images/nannabartrisserob1.png"
  },
  "/patricia_urquiola_angel/assets/css/normalize.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"17fa-f/3jQ73xCt0fBS88QwihUYDrRAQ\"",
    "mtime": "2024-01-29T18:38:57.983Z",
    "size": 6138,
    "path": "../public/patricia_urquiola_angel/assets/css/normalize.css"
  },
  "/patricia_urquiola_angel/assets/css/styles.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"1ac4-X8pOj9TwKAPI6/Gy3BaZw2jncRU\"",
    "mtime": "2024-01-29T18:38:57.983Z",
    "size": 6852,
    "path": "../public/patricia_urquiola_angel/assets/css/styles.css"
  },
  "/patricia_urquiola_angel/assets/images/Bio.png": {
    "type": "image/png",
    "etag": "\"13d4e9-7IHDaYFxgSdoHHtWVBpOO6tRi2Y\"",
    "mtime": "2024-01-29T18:38:57.980Z",
    "size": 1299689,
    "path": "../public/patricia_urquiola_angel/assets/images/Bio.png"
  },
  "/patricia_urquiola_angel/assets/images/Premios.png": {
    "type": "image/png",
    "etag": "\"12476f-FmDwxRbl1OplwxvZ+ugg16zCdVk\"",
    "mtime": "2024-01-29T18:38:57.974Z",
    "size": 1197935,
    "path": "../public/patricia_urquiola_angel/assets/images/Premios.png"
  },
  "/vivienne_westwood_sandra/assets/css/styles.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"9c7-/1Xe+t+mywdRyiLBiFMI7UYZ7H4\"",
    "mtime": "2024-01-29T18:38:57.944Z",
    "size": 2503,
    "path": "../public/vivienne_westwood_sandra/assets/css/styles.css"
  },
  "/vivienne_westwood_sandra/assets/css/styles1.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"1025-jdpDQEuzr/XJQJzdNyUSxjCDk6M\"",
    "mtime": "2024-01-29T18:38:57.943Z",
    "size": 4133,
    "path": "../public/vivienne_westwood_sandra/assets/css/styles1.css"
  },
  "/vivienne_westwood_sandra/assets/css/styles2.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"61d-kfa2VVRHf6XHcQpkp61mJVeN0ZM\"",
    "mtime": "2024-01-29T18:38:57.941Z",
    "size": 1565,
    "path": "../public/vivienne_westwood_sandra/assets/css/styles2.css"
  },
  "/vivienne_westwood_sandra/assets/images/anglomania.jpg": {
    "type": "image/jpeg",
    "etag": "\"c331-CNLRPyQAYD1KVKCfmASFgLlkJNg\"",
    "mtime": "2024-01-29T18:38:57.939Z",
    "size": 49969,
    "path": "../public/vivienne_westwood_sandra/assets/images/anglomania.jpg"
  },
  "/vivienne_westwood_sandra/assets/images/anglomania1.jpg": {
    "type": "image/jpeg",
    "etag": "\"cb71-Ld3x0eDYtoecIHaUuL9ya1VyHD8\"",
    "mtime": "2024-01-29T18:38:57.938Z",
    "size": 52081,
    "path": "../public/vivienne_westwood_sandra/assets/images/anglomania1.jpg"
  },
  "/vivienne_westwood_sandra/assets/images/anglomania2.jpg": {
    "type": "image/jpeg",
    "etag": "\"bd40-l627gEehtkVTTgm/TT56lyQyJbs\"",
    "mtime": "2024-01-29T18:38:57.937Z",
    "size": 48448,
    "path": "../public/vivienne_westwood_sandra/assets/images/anglomania2.jpg"
  },
  "/vivienne_westwood_sandra/assets/images/biografia.jpg": {
    "type": "image/jpeg",
    "etag": "\"797c1-Az6jcIEn4Rlx7EaBTraxAghXuoY\"",
    "mtime": "2024-01-29T18:38:57.935Z",
    "size": 497601,
    "path": "../public/vivienne_westwood_sandra/assets/images/biografia.jpg"
  },
  "/vivienne_westwood_sandra/assets/images/earlyyears.jpg": {
    "type": "image/jpeg",
    "etag": "\"acca-VmPKtB024HO2i/+ftNOV4ky2+4o\"",
    "mtime": "2024-01-29T18:38:57.931Z",
    "size": 44234,
    "path": "../public/vivienne_westwood_sandra/assets/images/earlyyears.jpg"
  },
  "/vivienne_westwood_sandra/assets/images/earlyyears1.jpg": {
    "type": "image/jpeg",
    "etag": "\"ad87-wLWyX3gRC4pbIJLQaXY7RMYlJT8\"",
    "mtime": "2024-01-29T18:38:57.930Z",
    "size": 44423,
    "path": "../public/vivienne_westwood_sandra/assets/images/earlyyears1.jpg"
  },
  "/vivienne_westwood_sandra/assets/images/earlyyears2.jpg": {
    "type": "image/jpeg",
    "etag": "\"9e3e-4l/rsxfiffM7AI4Tj+lQ0Ur9M4k\"",
    "mtime": "2024-01-29T18:38:57.929Z",
    "size": 40510,
    "path": "../public/vivienne_westwood_sandra/assets/images/earlyyears2.jpg"
  },
  "/vivienne_westwood_sandra/assets/images/kingsroad.jpg": {
    "type": "image/jpeg",
    "etag": "\"c989-xJmSM+uiKowGAjMNGWsptrB+5gw\"",
    "mtime": "2024-01-29T18:38:57.928Z",
    "size": 51593,
    "path": "../public/vivienne_westwood_sandra/assets/images/kingsroad.jpg"
  },
  "/vivienne_westwood_sandra/assets/images/kingsroad1.jpg": {
    "type": "image/jpeg",
    "etag": "\"ce21-YiO758A08KV5+ssGj3/Cz2EGBlc\"",
    "mtime": "2024-01-29T18:38:57.926Z",
    "size": 52769,
    "path": "../public/vivienne_westwood_sandra/assets/images/kingsroad1.jpg"
  },
  "/vivienne_westwood_sandra/assets/images/kingsroad2.jpg": {
    "type": "image/jpeg",
    "etag": "\"11426-Zp2vyyDfZ15wWK0O/j0CvFTpVzc\"",
    "mtime": "2024-01-29T18:38:57.925Z",
    "size": 70694,
    "path": "../public/vivienne_westwood_sandra/assets/images/kingsroad2.jpg"
  },
  "/vivienne_westwood_sandra/assets/images/logo1.jpg": {
    "type": "image/jpeg",
    "etag": "\"11785-9HmyzmqdNtOZ07m2/jDYT2bCSqU\"",
    "mtime": "2024-01-29T18:38:57.924Z",
    "size": 71557,
    "path": "../public/vivienne_westwood_sandra/assets/images/logo1.jpg"
  },
  "/vivienne_westwood_sandra/assets/images/logo2.jpg": {
    "type": "image/jpeg",
    "etag": "\"3049f-tRDIr1CtH4zEoP3+gyXqOXUvFqE\"",
    "mtime": "2024-01-29T18:38:57.923Z",
    "size": 197791,
    "path": "../public/vivienne_westwood_sandra/assets/images/logo2.jpg"
  },
  "/vivienne_westwood_sandra/assets/images/paganyears.jpg": {
    "type": "image/jpeg",
    "etag": "\"affa-MJqLkhJUoodjIz24ereOnvZTorU\"",
    "mtime": "2024-01-29T18:38:57.921Z",
    "size": 45050,
    "path": "../public/vivienne_westwood_sandra/assets/images/paganyears.jpg"
  },
  "/vivienne_westwood_sandra/assets/images/paganyears1.jpg": {
    "type": "image/jpeg",
    "etag": "\"aae0-+Xylvd5/9JwN6kXlamkkXlxRl1c\"",
    "mtime": "2024-01-29T18:38:57.920Z",
    "size": 43744,
    "path": "../public/vivienne_westwood_sandra/assets/images/paganyears1.jpg"
  },
  "/vivienne_westwood_sandra/assets/images/paganyears2.jpg": {
    "type": "image/jpeg",
    "etag": "\"79b1-uq9IPYkETOKL0AoHgsPomYhAtRs\"",
    "mtime": "2024-01-29T18:38:57.918Z",
    "size": 31153,
    "path": "../public/vivienne_westwood_sandra/assets/images/paganyears2.jpg"
  },
  "/vivienne_westwood_sandra/assets/images/portada.jpg": {
    "type": "image/jpeg",
    "etag": "\"706ff-+aFISihOeFP3xfq70sLQ5rlCydQ\"",
    "mtime": "2024-01-29T18:38:57.916Z",
    "size": 460543,
    "path": "../public/vivienne_westwood_sandra/assets/images/portada.jpg"
  },
  "/vivienne_westwood_sandra/assets/images/premios.jpg": {
    "type": "image/jpeg",
    "etag": "\"2becc-w5m3METEzYHOm04DT0vCSR9nFvk\"",
    "mtime": "2024-01-29T18:38:57.913Z",
    "size": 179916,
    "path": "../public/vivienne_westwood_sandra/assets/images/premios.jpg"
  },
  "/vivienne_westwood_sandra/assets/images/presente.jpg": {
    "type": "image/jpeg",
    "etag": "\"10aaa-5ffIhqoJJm2GXZFmU+1PIO+bb4Y\"",
    "mtime": "2024-01-29T18:38:57.908Z",
    "size": 68266,
    "path": "../public/vivienne_westwood_sandra/assets/images/presente.jpg"
  },
  "/vivienne_westwood_sandra/assets/images/presente1.jpg": {
    "type": "image/jpeg",
    "etag": "\"d8b0-fWSlfcBfc7Lod1O8lr0XbmBgS9o\"",
    "mtime": "2024-01-29T18:38:57.896Z",
    "size": 55472,
    "path": "../public/vivienne_westwood_sandra/assets/images/presente1.jpg"
  },
  "/vivienne_westwood_sandra/assets/images/presente2.jpg": {
    "type": "image/jpeg",
    "etag": "\"cb5e-rZoxfK2zriU8EO4uP/blSnH09Qo\"",
    "mtime": "2024-01-29T18:38:57.887Z",
    "size": 52062,
    "path": "../public/vivienne_westwood_sandra/assets/images/presente2.jpg"
  },
  "/nani_marquina_david/pages/Colecciones/assets/css/normalize.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"17fa-f/3jQ73xCt0fBS88QwihUYDrRAQ\"",
    "mtime": "2024-01-29T18:38:58.030Z",
    "size": 6138,
    "path": "../public/nani_marquina_david/pages/Colecciones/assets/css/normalize.css"
  },
  "/nani_marquina_david/pages/Colecciones/assets/css/styles.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"7c4-3xvc6plD+zUW96MM6C2J3jEObrs\"",
    "mtime": "2024-01-29T18:38:58.029Z",
    "size": 1988,
    "path": "../public/nani_marquina_david/pages/Colecciones/assets/css/styles.css"
  },
  "/nani_marquina_david/pages/Premios/assets/css/normalize.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"17fa-f/3jQ73xCt0fBS88QwihUYDrRAQ\"",
    "mtime": "2024-01-29T18:38:58.025Z",
    "size": 6138,
    "path": "../public/nani_marquina_david/pages/Premios/assets/css/normalize.css"
  },
  "/nani_marquina_david/pages/Premios/assets/css/styles.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"535-j276BY9cG0mWJ0353c15eVEpS4Y\"",
    "mtime": "2024-01-29T18:38:58.024Z",
    "size": 1333,
    "path": "../public/nani_marquina_david/pages/Premios/assets/css/styles.css"
  }
};

const _DRIVE_LETTER_START_RE = /^[A-Za-z]:\//;
function normalizeWindowsPath(input = "") {
  if (!input) {
    return input;
  }
  return input.replace(/\\/g, "/").replace(_DRIVE_LETTER_START_RE, (r) => r.toUpperCase());
}
const _IS_ABSOLUTE_RE = /^[/\\](?![/\\])|^[/\\]{2}(?!\.)|^[A-Za-z]:[/\\]/;
const _DRIVE_LETTER_RE = /^[A-Za-z]:$/;
function cwd() {
  if (typeof process !== "undefined" && typeof process.cwd === "function") {
    return process.cwd().replace(/\\/g, "/");
  }
  return "/";
}
const resolve = function(...arguments_) {
  arguments_ = arguments_.map((argument) => normalizeWindowsPath(argument));
  let resolvedPath = "";
  let resolvedAbsolute = false;
  for (let index = arguments_.length - 1; index >= -1 && !resolvedAbsolute; index--) {
    const path = index >= 0 ? arguments_[index] : cwd();
    if (!path || path.length === 0) {
      continue;
    }
    resolvedPath = `${path}/${resolvedPath}`;
    resolvedAbsolute = isAbsolute(path);
  }
  resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute);
  if (resolvedAbsolute && !isAbsolute(resolvedPath)) {
    return `/${resolvedPath}`;
  }
  return resolvedPath.length > 0 ? resolvedPath : ".";
};
function normalizeString(path, allowAboveRoot) {
  let res = "";
  let lastSegmentLength = 0;
  let lastSlash = -1;
  let dots = 0;
  let char = null;
  for (let index = 0; index <= path.length; ++index) {
    if (index < path.length) {
      char = path[index];
    } else if (char === "/") {
      break;
    } else {
      char = "/";
    }
    if (char === "/") {
      if (lastSlash === index - 1 || dots === 1) ; else if (dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res[res.length - 1] !== "." || res[res.length - 2] !== ".") {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf("/");
            if (lastSlashIndex === -1) {
              res = "";
              lastSegmentLength = 0;
            } else {
              res = res.slice(0, lastSlashIndex);
              lastSegmentLength = res.length - 1 - res.lastIndexOf("/");
            }
            lastSlash = index;
            dots = 0;
            continue;
          } else if (res.length > 0) {
            res = "";
            lastSegmentLength = 0;
            lastSlash = index;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          res += res.length > 0 ? "/.." : "..";
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0) {
          res += `/${path.slice(lastSlash + 1, index)}`;
        } else {
          res = path.slice(lastSlash + 1, index);
        }
        lastSegmentLength = index - lastSlash - 1;
      }
      lastSlash = index;
      dots = 0;
    } else if (char === "." && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}
const isAbsolute = function(p) {
  return _IS_ABSOLUTE_RE.test(p);
};
const dirname = function(p) {
  const segments = normalizeWindowsPath(p).replace(/\/$/, "").split("/").slice(0, -1);
  if (segments.length === 1 && _DRIVE_LETTER_RE.test(segments[0])) {
    segments[0] += "/";
  }
  return segments.join("/") || (isAbsolute(p) ? "/" : ".");
};

function readAsset (id) {
  const serverDir = dirname(fileURLToPath(globalThis._importMeta_.url));
  return promises$1.readFile(resolve(serverDir, assets[id].path))
}

const publicAssetBases = {"/_nuxt":{"maxAge":0}};

function isPublicAssetURL(id = '') {
  if (assets[id]) {
    return true
  }
  for (const base in publicAssetBases) {
    if (id.startsWith(base)) { return true }
  }
  return false
}

function getAsset (id) {
  return assets[id]
}

const METHODS = /* @__PURE__ */ new Set(["HEAD", "GET"]);
const EncodingMap = { gzip: ".gz", br: ".br" };
const _f4b49z = eventHandler((event) => {
  if (event.method && !METHODS.has(event.method)) {
    return;
  }
  let id = decodePath(
    withLeadingSlash(withoutTrailingSlash(parseURL(event.path).pathname))
  );
  let asset;
  const encodingHeader = String(
    getRequestHeader(event, "accept-encoding") || ""
  );
  const encodings = [
    ...encodingHeader.split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(),
    ""
  ];
  if (encodings.length > 1) {
    setResponseHeader(event, "Vary", "Accept-Encoding");
  }
  for (const encoding of encodings) {
    for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
      const _asset = getAsset(_id);
      if (_asset) {
        asset = _asset;
        id = _id;
        break;
      }
    }
  }
  if (!asset) {
    if (isPublicAssetURL(id)) {
      removeResponseHeader(event, "Cache-Control");
      throw createError$1({
        statusMessage: "Cannot find static asset " + id,
        statusCode: 404
      });
    }
    return;
  }
  const ifNotMatch = getRequestHeader(event, "if-none-match") === asset.etag;
  if (ifNotMatch) {
    setResponseStatus(event, 304, "Not Modified");
    return "";
  }
  const ifModifiedSinceH = getRequestHeader(event, "if-modified-since");
  const mtimeDate = new Date(asset.mtime);
  if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
    setResponseStatus(event, 304, "Not Modified");
    return "";
  }
  if (asset.type && !getResponseHeader(event, "Content-Type")) {
    setResponseHeader(event, "Content-Type", asset.type);
  }
  if (asset.etag && !getResponseHeader(event, "ETag")) {
    setResponseHeader(event, "ETag", asset.etag);
  }
  if (asset.mtime && !getResponseHeader(event, "Last-Modified")) {
    setResponseHeader(event, "Last-Modified", mtimeDate.toUTCString());
  }
  if (asset.encoding && !getResponseHeader(event, "Content-Encoding")) {
    setResponseHeader(event, "Content-Encoding", asset.encoding);
  }
  if (asset.size > 0 && !getResponseHeader(event, "Content-Length")) {
    setResponseHeader(event, "Content-Length", asset.size);
  }
  return readAsset(id);
});

const _lazy_JPfmpf = () => import('../handlers/renderer.mjs');

const handlers = [
  { route: '', handler: _f4b49z, lazy: false, middleware: true, method: undefined },
  { route: '/__nuxt_error', handler: _lazy_JPfmpf, lazy: true, middleware: false, method: undefined },
  { route: '/**', handler: _lazy_JPfmpf, lazy: true, middleware: false, method: undefined }
];

function createNitroApp() {
  const config = useRuntimeConfig();
  const hooks = createHooks();
  const captureError = (error, context = {}) => {
    const promise = hooks.callHookParallel("error", error, context).catch((_err) => {
      console.error("Error while capturing another error", _err);
    });
    if (context.event && isEvent(context.event)) {
      const errors = context.event.context.nitro?.errors;
      if (errors) {
        errors.push({ error, context });
      }
      if (context.event.waitUntil) {
        context.event.waitUntil(promise);
      }
    }
  };
  const h3App = createApp({
    debug: destr(false),
    onError: (error, event) => {
      captureError(error, { event, tags: ["request"] });
      return errorHandler(error, event);
    },
    onRequest: async (event) => {
      await nitroApp.hooks.callHook("request", event).catch((error) => {
        captureError(error, { event, tags: ["request"] });
      });
    },
    onBeforeResponse: async (event, response) => {
      await nitroApp.hooks.callHook("beforeResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    },
    onAfterResponse: async (event, response) => {
      await nitroApp.hooks.callHook("afterResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    }
  });
  const router = createRouter({
    preemptive: true
  });
  const localCall = createCall(toNodeListener(h3App));
  const _localFetch = createFetch(localCall, globalThis.fetch);
  const localFetch = (input, init) => _localFetch(input, init).then(
    (response) => normalizeFetchResponse(response)
  );
  const $fetch = createFetch$1({
    fetch: localFetch,
    Headers: Headers$1,
    defaults: { baseURL: config.app.baseURL }
  });
  globalThis.$fetch = $fetch;
  h3App.use(createRouteRulesHandler({ localFetch }));
  h3App.use(
    eventHandler((event) => {
      event.context.nitro = event.context.nitro || { errors: [] };
      const envContext = event.node.req?.__unenv__;
      if (envContext) {
        Object.assign(event.context, envContext);
      }
      event.fetch = (req, init) => fetchWithEvent(event, req, init, { fetch: localFetch });
      event.$fetch = (req, init) => fetchWithEvent(event, req, init, {
        fetch: $fetch
      });
      event.waitUntil = (promise) => {
        if (!event.context.nitro._waitUntilPromises) {
          event.context.nitro._waitUntilPromises = [];
        }
        event.context.nitro._waitUntilPromises.push(promise);
        if (envContext?.waitUntil) {
          envContext.waitUntil(promise);
        }
      };
      event.captureError = (error, context) => {
        captureError(error, { event, ...context });
      };
    })
  );
  for (const h of handlers) {
    let handler = h.lazy ? lazyEventHandler(h.handler) : h.handler;
    if (h.middleware || !h.route) {
      const middlewareBase = (config.app.baseURL + (h.route || "/")).replace(
        /\/+/g,
        "/"
      );
      h3App.use(middlewareBase, handler);
    } else {
      const routeRules = getRouteRulesForPath(
        h.route.replace(/:\w+|\*\*/g, "_")
      );
      if (routeRules.cache) {
        handler = cachedEventHandler(handler, {
          group: "nitro/routes",
          ...routeRules.cache
        });
      }
      router.use(h.route, handler, h.method);
    }
  }
  h3App.use(config.app.baseURL, router.handler);
  const app = {
    hooks,
    h3App,
    router,
    localCall,
    localFetch,
    captureError
  };
  for (const plugin of plugins) {
    try {
      plugin(app);
    } catch (err) {
      captureError(err, { tags: ["plugin"] });
      throw err;
    }
  }
  return app;
}
const nitroApp = createNitroApp();
const useNitroApp = () => nitroApp;

const debug = (...args) => {
};
function GracefulShutdown(server, opts) {
  opts = opts || {};
  const options = Object.assign(
    {
      signals: "SIGINT SIGTERM",
      timeout: 3e4,
      development: false,
      forceExit: true,
      onShutdown: (signal) => Promise.resolve(signal),
      preShutdown: (signal) => Promise.resolve(signal)
    },
    opts
  );
  let isShuttingDown = false;
  const connections = {};
  let connectionCounter = 0;
  const secureConnections = {};
  let secureConnectionCounter = 0;
  let failed = false;
  let finalRun = false;
  function onceFactory() {
    let called = false;
    return (emitter, events, callback) => {
      function call() {
        if (!called) {
          called = true;
          return Reflect.apply(callback, this, arguments);
        }
      }
      for (const e of events) {
        emitter.on(e, call);
      }
    };
  }
  const signals = options.signals.split(" ").map((s) => s.trim()).filter((s) => s.length > 0);
  const once = onceFactory();
  once(process, signals, (signal) => {
    shutdown(signal).then(() => {
      if (options.forceExit) {
        process.exit(failed ? 1 : 0);
      }
    }).catch((err) => {
      process.exit(1);
    });
  });
  function isFunction(functionToCheck) {
    const getType = Object.prototype.toString.call(functionToCheck);
    return /^\[object\s([A-Za-z]+)?Function]$/.test(getType);
  }
  function destroy(socket, force = false) {
    if (socket._isIdle && isShuttingDown || force) {
      socket.destroy();
      if (socket.server instanceof http.Server) {
        delete connections[socket._connectionId];
      } else {
        delete secureConnections[socket._connectionId];
      }
    }
  }
  function destroyAllConnections(force = false) {
    for (const key of Object.keys(connections)) {
      const socket = connections[key];
      const serverResponse = socket._httpMessage;
      if (serverResponse && !force) {
        if (!serverResponse.headersSent) {
          serverResponse.setHeader("connection", "close");
        }
      } else {
        destroy(socket);
      }
    }
    for (const key of Object.keys(secureConnections)) {
      const socket = secureConnections[key];
      const serverResponse = socket._httpMessage;
      if (serverResponse && !force) {
        if (!serverResponse.headersSent) {
          serverResponse.setHeader("connection", "close");
        }
      } else {
        destroy(socket);
      }
    }
  }
  server.on("request", function(req, res) {
    req.socket._isIdle = false;
    if (isShuttingDown && !res.headersSent) {
      res.setHeader("connection", "close");
    }
    res.on("finish", function() {
      req.socket._isIdle = true;
      destroy(req.socket);
    });
  });
  server.on("connection", function(socket) {
    if (isShuttingDown) {
      socket.destroy();
    } else {
      const id = connectionCounter++;
      socket._isIdle = true;
      socket._connectionId = id;
      connections[id] = socket;
      socket.once("close", () => {
        delete connections[socket._connectionId];
      });
    }
  });
  server.on("secureConnection", (socket) => {
    if (isShuttingDown) {
      socket.destroy();
    } else {
      const id = secureConnectionCounter++;
      socket._isIdle = true;
      socket._connectionId = id;
      secureConnections[id] = socket;
      socket.once("close", () => {
        delete secureConnections[socket._connectionId];
      });
    }
  });
  process.on("close", function() {
  });
  function shutdown(sig) {
    function cleanupHttp() {
      destroyAllConnections();
      return new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) {
            return reject(err);
          }
          return resolve(true);
        });
      });
    }
    if (options.development) {
      return process.exit(0);
    }
    function finalHandler() {
      if (!finalRun) {
        finalRun = true;
        if (options.finally && isFunction(options.finally)) {
          options.finally();
        }
      }
      return Promise.resolve();
    }
    function waitForReadyToShutDown(totalNumInterval) {
      if (totalNumInterval === 0) {
        debug(
          `Could not close connections in time (${options.timeout}ms), will forcefully shut down`
        );
        return Promise.resolve(true);
      }
      const allConnectionsClosed = Object.keys(connections).length === 0 && Object.keys(secureConnections).length === 0;
      if (allConnectionsClosed) {
        return Promise.resolve(false);
      }
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(waitForReadyToShutDown(totalNumInterval - 1));
        }, 250);
      });
    }
    if (isShuttingDown) {
      return Promise.resolve();
    }
    return options.preShutdown(sig).then(() => {
      isShuttingDown = true;
      cleanupHttp();
    }).then(() => {
      const pollIterations = options.timeout ? Math.round(options.timeout / 250) : 0;
      return waitForReadyToShutDown(pollIterations);
    }).then((force) => {
      if (force) {
        destroyAllConnections(force);
      }
      return options.onShutdown(sig);
    }).then(finalHandler).catch((err) => {
      const errString = typeof err === "string" ? err : JSON.stringify(err);
      failed = true;
      throw errString;
    });
  }
  function shutdownManual() {
    return shutdown("manual");
  }
  return shutdownManual;
}

function getGracefulShutdownConfig() {
  return {
    disabled: !!process.env.NITRO_SHUTDOWN_DISABLED,
    signals: (process.env.NITRO_SHUTDOWN_SIGNALS || "SIGTERM SIGINT").split(" ").map((s) => s.trim()),
    timeout: Number.parseInt(process.env.NITRO_SHUTDOWN_TIMEOUT, 10) || 3e4,
    forceExit: !process.env.NITRO_SHUTDOWN_NO_FORCE_EXIT
  };
}
function setupGracefulShutdown(listener, nitroApp) {
  const shutdownConfig = getGracefulShutdownConfig();
  if (shutdownConfig.disabled) {
    return;
  }
  GracefulShutdown(listener, {
    signals: shutdownConfig.signals.join(" "),
    timeout: shutdownConfig.timeout,
    forceExit: shutdownConfig.forceExit,
    onShutdown: async () => {
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn("Graceful shutdown timeout, force exiting...");
          resolve();
        }, shutdownConfig.timeout);
        nitroApp.hooks.callHook("close").catch((err) => {
          console.error(err);
        }).finally(() => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }
  });
}

const cert = process.env.NITRO_SSL_CERT;
const key = process.env.NITRO_SSL_KEY;
const server = cert && key ? new Server({ key, cert }, toNodeListener(nitroApp.h3App)) : new Server$1(toNodeListener(nitroApp.h3App));
const port = destr(process.env.NITRO_PORT || process.env.PORT) || 3e3;
const host = process.env.NITRO_HOST || process.env.HOST;
const path = process.env.NITRO_UNIX_SOCKET;
const listener = server.listen(path ? { path } : { port, host }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  const protocol = cert && key ? "https" : "http";
  const addressInfo = listener.address();
  if (typeof addressInfo === "string") {
    console.log(`Listening on unix socket ${addressInfo}`);
    return;
  }
  const baseURL = (useRuntimeConfig().app.baseURL || "").replace(/\/$/, "");
  const url = `${protocol}://${addressInfo.family === "IPv6" ? `[${addressInfo.address}]` : addressInfo.address}:${addressInfo.port}${baseURL}`;
  console.log(`Listening on ${url}`);
});
trapUnhandledNodeErrors();
setupGracefulShutdown(listener, nitroApp);
const nodeServer = {};

export { send as a, setResponseStatus as b, setResponseHeaders as c, useRuntimeConfig as d, eventHandler as e, getQuery as f, getResponseStatus as g, getRouteRules as h, joinURL as j, nodeServer as n, setResponseHeader as s, useNitroApp as u, withLeadingSlash as w };
//# sourceMappingURL=node-server.mjs.map
