!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.tests=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// when used in node, this will actually load the util module we depend on
// versus loading the builtin util module as happens otherwise
// this is a bug in node module loading as far as I am concerned
var util = _dereq_('util/');

var pSlice = Array.prototype.slice;
var hasOwn = Object.prototype.hasOwnProperty;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
  else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = stackStartFunction.name;
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (util.isUndefined(value)) {
    return '' + value;
  }
  if (util.isNumber(value) && (isNaN(value) || !isFinite(value))) {
    return value.toString();
  }
  if (util.isFunction(value) || util.isRegExp(value)) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (util.isString(s)) {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

function getMessage(self) {
  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
         self.operator + ' ' +
         truncate(JSON.stringify(self.expected, replacer), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!util.isObject(actual) && !util.isObject(expected)) {
    return actual == expected;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  try {
    var ka = objectKeys(a),
        kb = objectKeys(b),
        key, i;
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (util.isString(expected)) {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

},{"util/":3}],2:[function(_dereq_,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],3:[function(_dereq_,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = _dereq_('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = _dereq_('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":2,"1YiZ5S":5,"inherits":4}],4:[function(_dereq_,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],5:[function(_dereq_,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],6:[function(_dereq_,module,exports){
var Vector = _dereq_('./vector.js');

/** 
 * 4x4 matrix.
 * @constructor
 */
function Matrix(){
    for (var i=0; i<16; i++){
        this[i] = 0;
    }
    this.length = 16;
}
/**
 * Compare matrices for equality.
 * @method
 * @param {Matrix} matrix
 * @return {boolean}
 */
Matrix.prototype.equal = function(matrix){
    for (var i = 0, len = this.length; i < len; i++){
        if (this[i] !== matrix[i]){
            return false;
        }
    }
    return true;
};
/**
 * Add matrices. Returns a new Matrix.
 * @method
 * @param {Matrix} matrix
 * @return {Matrix}
 */
Matrix.prototype.add = function(matrix){
    var new_matrix = new Matrix();
    for (var i = 0, len = this.length; i < len; i++){
        new_matrix[i] = this[i] + matrix[i];
    }
    return new_matrix;
};
/**
 * Add matrices. Result is assigned to result parameter.
 * @method
 * @param {Matrix} matrix
 * @param {Matrix} result
 */
Matrix.prototype.addLG = function(matrix, result){
    for (var i = 0, len = this.length; i < len; i++){
        result[i] = this[i] + matrix[i];
    }
};
/**
 * Subtract matrices. Returns a new Matrix.
 * @method
 * @param {Matrix} matrix
 * @return {Matrix}
 */
Matrix.prototype.subtract = function(matrix){
    var new_matrix = new Matrix();
    for (var i = 0, len = this.length; i < len; i++){
        new_matrix[i] = this[i] - matrix[i];
    }
    return new_matrix;
};
/**
 * Subtract matrices. Result is assigned to result parameter.
 * @method
 * @param {Matrix} matrix
 * @param {Matrix} result
 */
Matrix.prototype.subtractLG = function(matrix, result){
    for (var i = 0, len = this.length; i < len; i++){
        result[i] = this[i] - matrix[i];
    }
};
/**
 * Multiply matrix by scalar. Returns a new Matrix.
 * @method
 * @param {number} scalar
 * @return {Matrix}
 */
Matrix.prototype.multiplyScalar = function(scalar){
    var new_matrix = new Matrix();
    for (var i = 0, len = this.length; i < len; i++){
        new_matrix[i] = this[i] * scalar;
    }
    return new_matrix;
};
/**
 * Multiply matrix by scalar. Result is assigned to result parameter.
 * @method
 * @param {number} scalar
 * @param {Matrix} result
 */
Matrix.prototype.multiplyScalarLG = function(scalar, result){
    for (var i = 0, len = this.length; i < len; i++){
        result[i] = this[i] * scalar;
    }
};
/**
 * Multiply matrices. Returns a new Matrix.
 * @method
 * @param {Matrix} matrix
 * @return {Matrix}
 */
Matrix.prototype.multiply = function(matrix){
    var new_matrix = new Matrix();
    new_matrix[0] = (this[0] * matrix[0]) + (this[1] * matrix[4]) + (this[2] * matrix[8]) + (this[3] * matrix[12]);
    new_matrix[1] = (this[0] * matrix[1]) + (this[1] * matrix[5]) + (this[2] * matrix[9]) + (this[3] * matrix[13]);
    new_matrix[2] = (this[0] * matrix[2]) + (this[1] * matrix[6]) + (this[2] * matrix[10]) + (this[3] * matrix[14]);
    new_matrix[3] = (this[0] * matrix[3]) + (this[1] * matrix[7]) + (this[2] * matrix[11]) + (this[3] * matrix[15]);
    new_matrix[4] = (this[4] * matrix[0]) + (this[5] * matrix[4]) + (this[6] * matrix[8]) + (this[7] * matrix[12]);
    new_matrix[5] = (this[4] * matrix[1]) + (this[5] * matrix[5]) + (this[6] * matrix[9]) + (this[7] * matrix[13]);
    new_matrix[6] = (this[4] * matrix[2]) + (this[5] * matrix[6]) + (this[6] * matrix[10]) + (this[7] * matrix[14]);
    new_matrix[7] = (this[4] * matrix[3]) + (this[5] * matrix[7]) + (this[6] * matrix[11]) + (this[7] * matrix[15]);
    new_matrix[8] = (this[8] * matrix[0]) + (this[9] * matrix[4]) + (this[10] * matrix[8]) + (this[11] * matrix[12]);
    new_matrix[9] = (this[8] * matrix[1]) + (this[9] * matrix[5]) + (this[10] * matrix[9]) + (this[11] * matrix[13]);
    new_matrix[10] = (this[8] * matrix[2]) + (this[9] * matrix[6]) + (this[10] * matrix[10]) + (this[11] * matrix[14]);
    new_matrix[11] = (this[8] * matrix[3]) + (this[9] * matrix[7]) + (this[10] * matrix[11]) + (this[11] * matrix[15]);
    new_matrix[12] = (this[12] * matrix[0]) + (this[13] * matrix[4]) + (this[14] * matrix[8]) + (this[15] * matrix[12]);
    new_matrix[13] = (this[12] * matrix[1]) + (this[13] * matrix[5]) + (this[14] * matrix[9]) + (this[15] * matrix[13]);
    new_matrix[14] = (this[12] * matrix[2]) + (this[13] * matrix[6]) + (this[14] * matrix[10]) + (this[15] * matrix[14]);
    new_matrix[15] = (this[12] * matrix[3]) + (this[13] * matrix[7]) + (this[14] * matrix[11]) + (this[15] * matrix[15]);
    return new_matrix;
};
/**
 * Multiply matrices. Result is assigned to result parameter.
 * @method
 * @param {Matrix} matrix
 * @param {Matrix} result
 */
Matrix.prototype.multiplyLG = function(matrix, result){
    result[0] = (this[0] * matrix[0]) + (this[1] * matrix[4]) + (this[2] * matrix[8]) + (this[3] * matrix[12]);
    result[1] = (this[0] * matrix[1]) + (this[1] * matrix[5]) + (this[2] * matrix[9]) + (this[3] * matrix[13]);
    result[2] = (this[0] * matrix[2]) + (this[1] * matrix[6]) + (this[2] * matrix[10]) + (this[3] * matrix[14]);
    result[3] = (this[0] * matrix[3]) + (this[1] * matrix[7]) + (this[2] * matrix[11]) + (this[3] * matrix[15]);
    result[4] = (this[4] * matrix[0]) + (this[5] * matrix[4]) + (this[6] * matrix[8]) + (this[7] * matrix[12]);
    result[5] = (this[4] * matrix[1]) + (this[5] * matrix[5]) + (this[6] * matrix[9]) + (this[7] * matrix[13]);
    result[6] = (this[4] * matrix[2]) + (this[5] * matrix[6]) + (this[6] * matrix[10]) + (this[7] * matrix[14]);
    result[7] = (this[4] * matrix[3]) + (this[5] * matrix[7]) + (this[6] * matrix[11]) + (this[7] * matrix[15]);
    result[8] = (this[8] * matrix[0]) + (this[9] * matrix[4]) + (this[10] * matrix[8]) + (this[11] * matrix[12]);
    result[9] = (this[8] * matrix[1]) + (this[9] * matrix[5]) + (this[10] * matrix[9]) + (this[11] * matrix[13]);
    result[10] = (this[8] * matrix[2]) + (this[9] * matrix[6]) + (this[10] * matrix[10]) + (this[11] * matrix[14]);
    result[11] = (this[8] * matrix[3]) + (this[9] * matrix[7]) + (this[10] * matrix[11]) + (this[11] * matrix[15]);
    result[12] = (this[12] * matrix[0]) + (this[13] * matrix[4]) + (this[14] * matrix[8]) + (this[15] * matrix[12]);
    result[13] = (this[12] * matrix[1]) + (this[13] * matrix[5]) + (this[14] * matrix[9]) + (this[15] * matrix[13]);
    result[14] = (this[12] * matrix[2]) + (this[13] * matrix[6]) + (this[14] * matrix[10]) + (this[15] * matrix[14]);
    result[15] = (this[12] * matrix[3]) + (this[13] * matrix[7]) + (this[14] * matrix[11]) + (this[15] * matrix[15]);
};
/**
 * Negate matrix. Returns a new Matrix.
 * @method
 * @param {number} scalar
 * @return {Matrix}
 */
Matrix.prototype.negate = function(){
    var new_matrix = new Matrix();
    for (var i = 0, len = this.length; i < len; i++){
        new_matrix[i] = -this[i];
    }
    return new_matrix;
};
/**
 * Negate matrix. Result is assigned to result parameter.
 * @method
 * @param {number} scalar
 * @param {Matrix} result
 */
Matrix.prototype.negateLG = function(result){
    for (var i = 0, len = this.length; i < len; i++){
        result[i] = -this[i];
    }
};
/**
 * Transpose matrix. Returns a new Matrix.
 * @method
 * @return {Matrix}
 */
Matrix.prototype.transpose = function(){
    var new_matrix = new Matrix();
    new_matrix[0] = this[0];
    new_matrix[1] = this[4];
    new_matrix[2] = this[8];
    new_matrix[3] = this[12];
    new_matrix[4] = this[1];
    new_matrix[5] = this[5];
    new_matrix[6] = this[9];
    new_matrix[7] = this[13];
    new_matrix[8] = this[2];
    new_matrix[9] = this[6];
    new_matrix[10] = this[10];
    new_matrix[11] = this[14];
    new_matrix[12] = this[3];
    new_matrix[13] = this[7];
    new_matrix[14] = this[11];
    new_matrix[15] = this[15];
    return new_matrix;
};
/**
 * Transpose matrix. Result is assigned to result parameter.
 * @method
 * @return {Matrix}
 */
Matrix.prototype.transposeLG = function(result){
    result[0] = this[0];
    result[1] = this[4];
    result[2] = this[8];
    result[3] = this[12];
    result[4] = this[1];
    result[5] = this[5];
    result[6] = this[9];
    result[7] = this[13];
    result[8] = this[2];
    result[9] = this[6];
    result[10] = this[10];
    result[11] = this[14];
    result[12] = this[3];
    result[13] = this[7];
    result[14] = this[11];
    result[15] = this[15];
};
/**
 * Write zeros to all elements of the matrix.
 * @method
 */
Matrix.prototype.empty = function(){
    for (var i = 0, len = this.length; i < len; i++){
        this[i] = 0;
    }
};
/**
 * Copy matrix values to another matrix.
 * @method
 * @param result
 *
 */
Matrix.prototype.copy = function(result) {
    for (var i = 0; i < 16; i++) {
        result[i] = this[i];
    }
};


/**
 * Constructs a rotation matrix, rotating by theta around the x-axis. Returns a new Matrix.
 * @method
 * @static
 * @param {number} theta
 * @return {Matrix}
 */
Matrix.rotationX = function(theta){
    var rotation_matrix = new Matrix();
    var cos = Math.cos(theta);
    var sin = Math.sin(theta);
    rotation_matrix[0] = 1;
    rotation_matrix[5] = cos;
    rotation_matrix[6] = -sin;
    rotation_matrix[9] = sin;
    rotation_matrix[10] = cos;
    rotation_matrix[15] = 1;
    return rotation_matrix;
};
/**
 * Constructs a rotation matrix, rotating by theta around the x-axis. Result is assigned to result parameter.
 * @method
 * @static
 * @param {number} theta
 * @param {Matrix} result
 */
Matrix.rotationXLG = function(theta, result){
    var cos = Math.cos(theta);
    var sin = Math.sin(theta);
    result.empty();
    result[0] = 1;
    result[5] = cos;
    result[6] = -sin;
    result[9] = sin;
    result[10] = cos;
    result[15] = 1;
};
/**
 * Constructs a rotation matrix, rotating by theta around the y-axis. Returns a new Matrix.
 * @method
 * @static
 * @param {number} theta
 * @return {Matrix}
 */
Matrix.rotationY = function(theta){
    var rotation_matrix = new Matrix();
    var cos = Math.cos(theta);
    var sin = Math.sin(theta);
    rotation_matrix[0] = cos;
    rotation_matrix[2] = sin;
    rotation_matrix[5] = 1;
    rotation_matrix[8] = -sin;
    rotation_matrix[10] = cos;
    rotation_matrix[15] = 1;
    return rotation_matrix;
};
/**
 * Constructs a rotation matrix, rotating by theta around the y-axis. Result is assigned to result parameter.
 * @method
 * @static
 * @param {number} theta
 * @param {Matrix} result
 */
Matrix.rotationYLG = function(theta, result){
    var cos = Math.cos(theta);
    var sin = Math.sin(theta);
    result.empty();
    result[0] = cos;
    result[2] = sin;
    result[5] = 1;
    result[8] = -sin;
    result[10] = cos;
    result[15] = 1;
};
/**
 * Constructs a rotation matrix, rotating by theta around the z-axis. Returns a new Matrix.
 * @method
 * @static
 * @param {number} theta
 * @return {Matrix}
 */
Matrix.rotationZ = function(theta){
    var rotation_matrix = new Matrix();
    var cos = Math.cos(theta);
    var sin = Math.sin(theta);
    rotation_matrix[0] = cos;
    rotation_matrix[1] = -sin;
    rotation_matrix[4] = sin;
    rotation_matrix[5] = cos;
    rotation_matrix[10] = 1;
    rotation_matrix[15] = 1;
    return rotation_matrix;
};
/**
 * Constructs a rotation matrix, rotating by theta around the z-axis. Result is assigned to result parameter.
 * @method
 * @static
 * @param {number} theta
 * @param {Matrix} result
 */
Matrix.rotationZLG = function(theta, result){
    var cos = Math.cos(theta);
    var sin = Math.sin(theta);
    result.empty();
    result[0] = cos;
    result[1] = -sin;
    result[4] = sin;
    result[5] = cos;
    result[10] = 1;
    result[15] = 1;
};
/**
 * Constructs a rotation matrix, rotating by theta around the axis. Returns a new Matrix.
 * @method
 * @static
 * @param {Vector} axis
 * @param {number} theta
 * @return {Matrix}
 */
Matrix.rotationAxis = function(axis, theta){
    var rotation_matrix = new Matrix();
    var u = axis.normalize();
    var sin = Math.sin(theta);
    var cos = Math.cos(theta);
    var cos1 = 1-cos;
    var ux = u.x;
    var uy = u.y;
    var uz = u.z;
    var xy = ux * uy;
    var xz = ux * uz;
    var yz = uy * uz;
    rotation_matrix[0] = cos + ((ux*ux)*cos1);
    rotation_matrix[1] = (xy*cos1) - (uz*sin);
    rotation_matrix[2] = (xz*cos1)+(uy*sin);
    rotation_matrix[4] = (xy*cos1)+(uz*sin);
    rotation_matrix[5] = cos+((uy*uy)*cos1);
    rotation_matrix[6] = (yz*cos1)-(ux*sin);
    rotation_matrix[8] = (xz*cos1)-(uy*sin);
    rotation_matrix[9] = (yz*cos1)+(ux*sin);
    rotation_matrix[10] = cos + ((uz*uz)*cos1);
    rotation_matrix[15] = 1;
    return rotation_matrix;
};
/**
 * Constructs a rotation matrix, rotating by theta around the axis. Result is assigned to result parameter.
 * @method
 * @static
 * @param {Vector} axis
 * @param {number} theta
 * @param {Matrix} result
 */
Matrix.rotationAxisLG = function(axis, theta, result){
    axis.normalizeLG(temp_vector);
    var sin = Math.sin(theta);
    var cos = Math.cos(theta);
    var cos1 = 1-cos;
    var ux = temp_vector.x;
    var uy = temp_vector.y;
    var uz = temp_vector.z;
    var xy = ux * uy;
    var xz = ux * uz;
    var yz = uy * uz;
    result.empty();
    result[0] = cos + ((ux*ux)*cos1);
    result[1] = (xy*cos1) - (uz*sin);
    result[2] = (xz*cos1)+(uy*sin);
    result[4] = (xy*cos1)+(uz*sin);
    result[5] = cos+((uy*uy)*cos1);
    result[6] = (yz*cos1)-(ux*sin);
    result[8] = (xz*cos1)-(uy*sin);
    result[9] = (yz*cos1)+(ux*sin);
    result[10] = cos + ((uz*uz)*cos1);
    result[15] = 1;
};
/**
 * Constructs a rotation matrix from pitch, yaw, and roll. Returns a new Matrix.
 * @method
 * @static
 * @param {number} pitch
 * @param {number} yaw
 * @param {number} roll
 * @return {Matrix}
 */
Matrix.rotation = function(pitch, yaw, roll){
    return Matrix.rotationX(roll).multiply(Matrix.rotationZ(yaw)).multiply(Matrix.rotationY(pitch));
};
/**
 * Constructs a rotation matrix from pitch, yaw, and roll. Result is assigned to result parameter.
 * @method
 * @static
 * @param {number} pitch
 * @param {number} yaw
 * @param {number} roll
 * @param {Matrix} result
 */
Matrix.rotationLG = function(pitch, yaw, roll, result){
    // TODO: Can I get away with using fewer temporary matrices?
    temp_matrix1.empty();
    temp_matrix2.empty();
    temp_matrix3.empty();
    temp_matrix4.empty();
    result.empty();    
    Matrix.rotationXLG(roll, temp_matrix1);
    Matrix.rotationZLG(yaw, temp_matrix2);
    Matrix.rotationYLG(pitch, temp_matrix3);
    temp_matrix1.multiplyLG(temp_matrix2, temp_matrix4);
    temp_matrix4.multiplyLG(temp_matrix3, result);
};
/**
 * Constructs a translation matrix from x, y, and z distances. Returns a new Matrix.
 * @method
 * @static
 * @param {number} xtrans
 * @param {number} ytrans
 * @param {number} ztrans
 * @return {Matrix}
 */
Matrix.translation = function(xtrans, ytrans, ztrans){
    var translation_matrix = Matrix.identity();
    translation_matrix[12] = xtrans;
    translation_matrix[13] = ytrans;
    translation_matrix[14] = ztrans;
    return translation_matrix;
};
/**
 * Constructs a translation matrix from x, y, and z distances. Result is assigned to result parameter.
 * @method
 * @static
 * @param {number} xtrans
 * @param {number} ytrans
 * @param {number} ztrans
 * @return {Matrix}
 */
Matrix.translationLG = function(xtrans, ytrans, ztrans, result){
    Matrix.identityLG(result);
    result[12] = xtrans;
    result[13] = ytrans;
    result[14] = ztrans;
};
/**
 * Constructs a scaling matrix from x, y, and z scale. Returns a new Matrix.
 * @method
 * @static
 * @param {number} xtrans
 * @param {number} ytrans
 * @param {number} ztrans
 * @return {Matrix}
 */
Matrix.scale = function(xscale, yscale, zscale){
    var scaling_matrix = new Matrix();
    scaling_matrix[0] = xscale;
    scaling_matrix[5] = yscale;
    scaling_matrix[10] = zscale;
    scaling_matrix[15] = 1;
    return scaling_matrix;
};
/**
 * Constructs a scaling matrix from x, y, and z scale. Result is assigned to result parameter.
 * @method
 * @static
 * @param {number} xtrans
 * @param {number} ytrans
 * @param {number} ztrans
 * @param {Matrix} result
 */
Matrix.scaleLG = function(xscale, yscale, zscale, result){
    Matrix.zeroLG(result);
    result[0] = xscale;
    result[5] = yscale;
    result[10] = zscale;
    result[15] = 1;
};
/**
 * Constructs an identity matrix. Returns a new Matrix.
 * @method
 * @static
 * @return {Matrix}
 */
Matrix.identity = function(){
    var identity = new Matrix();
    identity[0] = 1;
    identity[5] = 1;
    identity[10] = 1;
    identity[15] = 1;
    return identity;
};
/**
 * Constructs an identity matrix. Result is assigned to result parameter.
 * @method
 * @static
 * @param {Matrix} result
 */
Matrix.identityLG = function(result){
    for (var i = 0; i < 16; i++){
       result[i] = 0; 
    }
    result[0] = 1;
    result[5] = 1;
    result[10] = 1;
    result[15] = 1;
};
/**
 * Constructs a zero matrix. Returns a new Matrix.
 * @method
 * @static
 * @return {Matrix}
 */
Matrix.zero = function(){
    return new Matrix();
};
/**
 * Constructs a zero matrix. Result is assigned to result parameter.
 * @method
 * @static
 * @return {Matrix}
 */
Matrix.zeroLG = function(result){
    for (var i = 0; i < 16; i++){
       result[i] = 0; 
    }
};
/**
 * Constructs a new matrix from an array. Returns a new Matrix.
 * @method
 * @static
 * @return {Matrix}
 */
Matrix.fromArray = function(arr){
    var new_matrix = new Matrix();
    for (var i = 0; i < 16; i++){
        new_matrix[i] = arr[i];
    }
    return new_matrix;
};
/**
 * Constructs a new matrix from an array. Result is assigned to result parameter.
 * @method
 * @static
 * @param {Matrix} result
 */
Matrix.fromArrayLG = function(arr, result){
    for (var i = 0; i < 16; i++){
        result[i] = arr[i];
    }
};
/**
 * Copy values from one matrix to another.
 * @param matrix1
 * @param matrix2
 */
Matrix.copy = function(matrix1, matrix2){
    for (var i = 0; i < 16; i++) {
        matrix2[i] = matrix1[i];
    }
};

var temp_matrix1 = new Matrix();
var temp_matrix2 = new Matrix();
var temp_matrix3 = new Matrix();
var temp_matrix4 = new Matrix();
var temp_vector = new Vector(0,0,0);

module.exports = Matrix;

},{"./vector.js":7}],7:[function(_dereq_,module,exports){
/**
 * 3D vector.
 * @constructor
 * @param {number} x x coordinate
 * @param {number} y y coordinate
 * @param {number} z z coordinate
 */
function Vector(x, y, z){
    if (typeof x === 'undefined' ||
        typeof y === 'undefined' ||
        typeof z === 'undefined'){
        throw new Error('Insufficient arguments.');
    } else {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}
/**
 * Add vectors. Returns a new Vector.
 * @method
 * @param {Vector} vector
 * @return {Vector}
 */
Vector.prototype.add = function(vector){
    return new Vector(this.x + vector.x, this.y + vector.y, this.z + vector.z);
};
/**
 * Add vectors. Result is assigned to result parameter.
 * @method
 * @param {Vector} vector
 * @param {Vector} result
 */
Vector.prototype.addLG = function(vector, result){
    result.x = this.x + vector.x;
    result.y = this.y + vector.y;
    result.z = this.z + vector.z;
};
/**
 * Subtract vectors. Returns a new Vector.
 * @method
 * @param {Vector} vector
 * @return {Vector}
 */
Vector.prototype.subtract = function(vector){
    return new Vector(this.x - vector.x, this.y - vector.y, this.z - vector.z);
};
/**
 * Subtract vectors. Result is assigned to result parameter.
 * @method
 * @param {Vector} vector
 * @param {Vector} result
 */
Vector.prototype.subtractLG = function(vector, result){
    result.x = this.x - vector.x;
    result.y = this.y - vector.y;
    result.z = this.z - vector.z;
};
/**
 * Compare vectors for equality
 * @method
 * @param {Vector} vector
 * @return {boolean}
 */
Vector.prototype.equal = function(vector){
    return this.x === vector.x && this.y === vector.y && this.z === vector.z;
};
/**
 * Calculate angle between two vectors.
 * @method
 * @param {Vector} vector
 * @return {number}
 */
Vector.prototype.angle = function(vector){
    var a = this.normalize();
    var b = vector.normalize();
    var amag = a.magnitude();
    var bmag = b.magnitude();
    if (amag === 0 || bmag === 0){
        return 0;
    }
    var theta = a.dot(b) / (amag * bmag );
    if (theta < -1) {theta = -1;}
    if (theta > 1) {theta = 1;}
    return Math.acos(theta);
};
/**
 * Calculate angle between two vectors. Low garbage (doesn't create any intermediate Vectors).
 * @method
 * @param {Vector} vector
 * @return {number}
 */
Vector.prototype.angleLG = function(vector){
    this.normalizeLG(temp_vector1);
    vector.normalizeLG(temp_vector2);
    var amag = temp_vector1.magnitude();
    var bmag = temp_vector2.magnitude();
    if (amag === 0 || bmag === 0){
        return 0;
    }
    var theta = temp_vector1.dot(temp_vector2) / (amag * bmag );
    if (theta < -1) {theta = -1;}
    if (theta > 1) {theta = 1;}
    return Math.acos(theta);
};
/**
 * Calculate the cosine of the angle between two vectors.
 * @method
 * @param {Vector} vector
 * @return {number}
 */
Vector.prototype.cosAngle = function(vector){
    var a = this.normalize();
    var b = vector.normalize();
    var amag = a.magnitude();
    var bmag = b.magnitude();
    if (amag === 0 || bmag === 0){
        return 0;
    }
    var theta = a.dot(b) / (amag * bmag );
    if (theta < -1) {theta = -1;}
    if (theta > 1) {theta = 1;}
    return theta;
};
/**
 * Calculate the cosine of the angle between two vectors. Low garbage (doesn't create any intermediate Vectors).
 * @method
 * @param {Vector} vector
 * @return {number}
 */
Vector.prototype.cosAngleLG = function(vector){
    this.normalizeLG(temp_vector1);
    vector.normalizeLG(temp_vector2);
    var amag = temp_vector1.magnitude();
    var bmag = temp_vector2.magnitude();
    if (amag === 0 || bmag === 0){
        return 0;
    }
    var theta = temp_vector1.dot(temp_vector2) / (amag * bmag );
    if (theta < -1) {theta = -1;}
    if (theta > 1) {theta = 1;}
    return theta;
};
/**
 * Calculate magnitude of a vector.
 * @method
 * @return {number}
 */
Vector.prototype.magnitude = function(){
    return Math.sqrt((this.x * this.x) + (this.y * this.y) + (this.z * this.z));
};
/**
 * Calculate magnitude squared of a vector.
 * @method
 * @return {number}
 */
Vector.prototype.magnitudeSquared = function(){
    return (this.x * this.x) + (this.y * this.y) + (this.z * this.z);
};
/**
 * Calculate dot product of two vectors.
 * @method
 * @param {Vector} vector
 * @return {number}
 */
Vector.prototype.dot = function(vector){
    return (this.x * vector.x) + (this.y * vector.y) + (this.z * vector.z);
};
/**
 * Calculate cross product of two vectors. Returns a new Vector.
 * @method
 * @param {Vector} vector
 * @return {Vector}
 */
Vector.prototype.cross = function(vector){
    return new Vector(
        (this.y * vector.z) - (this.z * vector.y),
        (this.z * vector.x) - (this.x * vector.z),
        (this.x * vector.y) - (this.y * vector.x)
    );
};
/**
 * Calculate cross product of two vectors. Result is assigned to result parameter.
 * @method
 * @param {Vector} vector
 * @param {Vector} result
 */
Vector.prototype.crossLG = function(vector, result){
    result.x = (this.y * vector.z) - (this.z * vector.y);
    result.y = (this.z * vector.x) - (this.x * vector.z);
    result.z = (this.x * vector.y) - (this.y * vector.x);
};
/**
 * Normalize vector. Returns a new Vector.
 * @method
 * @return {Vector}
 */
Vector.prototype.normalize = function(){
    var magnitude = this.magnitude();
    if (magnitude === 0) {
        return new Vector(this.x, this.y, this.z);
    }
    return new Vector(this.x / magnitude, this.y / magnitude, this.z / magnitude);
};
/**
 * Normalize vector. Result is assigned to result parameter.
 * @method
 * @param {Vector} result
 */
Vector.prototype.normalizeLG = function(result){
    var magnitude = this.magnitude();
    if (magnitude === 0) {
        result.x = this.x;
        result.y = this.y;
        result.z = this.z;
    }
    result.x = this.x / magnitude;
    result.y = this.y / magnitude;
    result.z = this.z / magnitude;
};
/**
 * Scale vector by scaling factor. Returns a new Vector.
 * @method
 * @param {number} scale
 * @return {Vector}
 */
Vector.prototype.scale = function(scale){
    return new Vector(this.x * scale, this.y * scale, this.z * scale);
};
/**
 * Scale vector by scaling factor. Result is assigned to result parameter.
 * @method
 * @param {number} scale
 * @param {Vector} result
 */
Vector.prototype.scaleLG = function(scale, result){
    result.x = this.x * scale;
    result.y = this.y * scale;
    result.z = this.z * scale;
};
/**
 * Negate vector. Returns a new Vector.
 * @method
 * @return {Vector}
 */
Vector.prototype.negate = function(){
    return new Vector(-this.x, -this.y, -this.z);
};
/**
 * Negate vector. Result is assigned to result parameter.
 * @method
 * @param {Vector} result
 */
Vector.prototype.negateLG = function(result){
    result.x = -this.x;
    result.y = -this.y;
    result.z = -this.z;
};
/**
 * Calculate vector projection of two vectors.
 * @method
 * @param {Vector} vector
 * @return {number}
 */
Vector.prototype.vectorProjection = function(vector){
    var mag = vector.magnitude();
    return vector.scale(this.dot(vector) / (mag * mag));
};
/**
 * Calculate vector projection of two vectors. Does not construct any new Vectors in the course of its operation.
 * @method
 * @param {Vector} vector
 * @param {Vector} temp A temporary vector used in one of the intermediary steps of the calculation.
 * @return {number}
 */
Vector.prototype.vectorProjectionLG = function(vector, result){
    var mag = vector.magnitude();
    vector.scaleLG(this.dot(vector) / (mag * mag), result);
};
/**
 * Calculate scalar projection of two vectors.
 * @method
 * @param {Vector} vector
 * @return {number}
 */
Vector.prototype.scalarProjection = function(vector){
    return this.dot(vector) / vector.magnitude();
};
/**
 * Perform linear tranformation on a vector. Returns a new Vector.
 * @method
 * @param {Matrix} transform_matrix
 * @return {Vector}
 */
Vector.prototype.transform = function(transform_matrix){
    var x = (this.x * transform_matrix[0]) + (this.y * transform_matrix[4]) + (this.z * transform_matrix[8]) + transform_matrix[12];
    var y = (this.x * transform_matrix[1]) + (this.y * transform_matrix[5]) + (this.z * transform_matrix[9]) + transform_matrix[13];
    var z = (this.x * transform_matrix[2]) + (this.y * transform_matrix[6]) + (this.z * transform_matrix[10]) + transform_matrix[14];
    var w = (this.x * transform_matrix[3]) + (this.y * transform_matrix[7]) + (this.z * transform_matrix[11]) + transform_matrix[15];
    return new Vector(x / w, y / w, z / w);
};
/**
 * Perform linear tranformation on a vector.  Result is assigned to result parameter.
 * @method
 * @param {Matrix} transform_matrix
 * @param {Vector} result
 */
Vector.prototype.transformLG = function(transform_matrix, result){
    var x = (this.x * transform_matrix[0]) + (this.y * transform_matrix[4]) + (this.z * transform_matrix[8]) + transform_matrix[12];
    var y = (this.x * transform_matrix[1]) + (this.y * transform_matrix[5]) + (this.z * transform_matrix[9]) + transform_matrix[13];
    var z = (this.x * transform_matrix[2]) + (this.y * transform_matrix[6]) + (this.z * transform_matrix[10]) + transform_matrix[14];
    var w = (this.x * transform_matrix[3]) + (this.y * transform_matrix[7]) + (this.z * transform_matrix[11]) + transform_matrix[15];
    result.x = x / w;
    result.y = y / w;
    result.z = z / w;
};
/**
 * Rotate vector by theta around axis. Returns a new Vector.
 * @method
 * @param {Vector} axis
 * @param {number} theta
 * @return {Vector}
 */
Vector.prototype.rotate = function(axis, theta){
    var u = axis.normalize();
    var sin = Math.sin(theta);
    var cos = Math.cos(theta);
    var cos1 = 1-cos;
    var ux = u.x;
    var uy = u.y;
    var uz = u.z;
    var xy = u.x * u.y;
    var xz = u.x * u.z;
    var yz = u.y * u.z;
    var x = ((cos + ((ux*ux)*cos1)) * this.x) + (((xy*cos1) - (uz*sin)) * this.y) + (((xz*cos1)+(uy*sin)) * this.z);
    var y = (((xy*cos1)+(uz*sin)) * this.x) + ((cos+((uy*uy)*cos1)) * this.y) + (((yz*cos1)-(ux*sin)) * this.z);
    var z = (((xz*cos1)-(uy*sin)) * this.x) + (((yz*cos1)+(ux*sin)) * this.y) + ((cos + ((ux*ux)*cos1)) * this.z);
    return new Vector(x, y, z);
};
/**
 * Rotate vector by theta around axis. Result is assigned to result parameter.
 * @method
 * @param {Vector} axis
 * @param {number} theta
 * @param {Vector} result
 */
Vector.prototype.rotateLG = function(axis, theta, result){
    axis.normalizeLG(result);
    var sin = Math.sin(theta);
    var cos = Math.cos(theta);
    var cos1 = 1-cos;
    var ux = result.x;
    var uy = result.y;
    var uz = result.z;
    var xy = result.x * result.y;
    var xz = result.x * result.z;
    var yz = result.y * result.z;
    var x = ((cos + ((ux*ux)*cos1)) * this.x) + (((xy*cos1) - (uz*sin)) * this.y) + (((xz*cos1)+(uy*sin)) * this.z);
    var y = (((xy*cos1)+(uz*sin)) * this.x) + ((cos+((uy*uy)*cos1)) * this.y) + (((yz*cos1)-(ux*sin)) * this.z);
    var z = (((xz*cos1)-(uy*sin)) * this.x) + (((yz*cos1)+(ux*sin)) * this.y) + ((cos + ((ux*ux)*cos1)) * this.z);
    result.x = x;
    result.y = y;
    result.z = z;
};
/**
 * Rotate vector by theta around x-axis. Returns a new Vector.
 * @method
 * @param {number} theta
 * @return {Vector}
 */
Vector.prototype.rotateX = function(theta){
    var sin = Math.sin(theta);
    var cos = Math.cos(theta);
    var x = this.x;
    var y = (cos * this.y) - (sin * this.z);
    var z = (sin * this.y) + (cos * this.z);
    return new Vector(x, y, z);
};
/**
 * Rotate vector by theta around x-axis. Result is assigned to result parameter.
 * @method
 * @param {number} theta
 * @param {Vector} result
 */
Vector.prototype.rotateXLG = function(theta, result){
    var sin = Math.sin(theta);
    var cos = Math.cos(theta);
    var x = this.x;
    var y = (cos * this.y) - (sin * this.z);
    var z = (sin * this.y) + (cos * this.z);
    result.x = x;
    result.y = y;
    result.z = z;
};
/**
 * Rotate vector by theta around y-axis. Returns a new Vector.
 * @method
 * @param {number} theta
 * @return {Vector}
 */
Vector.prototype.rotateY = function(theta){
    var sin = Math.sin(theta);
    var cos = Math.cos(theta);
    var x = (cos *this.x) + (sin * this.z);
    var y = this.y;
    var z = -(sin * this.x) + (cos * this.z);
    return new Vector(x, y, z);
};
/**
 * Rotate vector by theta around y-axis. Result is assigned to result parameter.
 * @method
 * @param {number} theta
 * @param {Vector} result
 */
Vector.prototype.rotateYLG = function(theta, result){
    var sin = Math.sin(theta);
    var cos = Math.cos(theta);
    var x = (cos *this.x) + (sin * this.z);
    var y = this.y;
    var z = -(sin * this.x) + (cos * this.z);
    result.x = x;
    result.y = y;
    result.z = z;
};
/**
 * Rotate vector by theta around z-axis. Returns a new Vector.
 * @method
 * @param {number} theta
 * @return {Vector}
 */
Vector.prototype.rotateZ = function(theta){
    var sin = Math.sin(theta);
    var cos = Math.cos(theta);
    var x = (cos * this.x) - (sin * this.y);
    var y = (sin * this.x) + (cos * this.y);
    var z = this.z;
    return new Vector(x, y, z);
};
/**
 * Rotate vector by theta around z-axis. Result is assigned to result parameter.
 * @method
 * @param {number} theta
 * @param {Vector} result
 */
Vector.prototype.rotateZLG = function(theta, result){
    var sin = Math.sin(theta);
    var cos = Math.cos(theta);
    var x = (cos * this.x) - (sin * this.y);
    var y = (sin * this.x) + (cos * this.y);
    var z = this.z;
    result.x = x;
    result.y = y;
    result.z = z;
};
/**
 * Rotate vector by pitch, yaw, and roll. Returns a new Vector.
 * @method
 * @param {number} pitch
 * @param {number} yaw
 * @param {number} roll
 * @return {Vector}
 */
Vector.prototype.rotatePitchYawRoll = function(pitch_amnt, yaw_amnt, roll_amnt) {
    return this.rotateX(roll_amnt).rotateY(pitch_amnt).rotateZ(yaw_amnt);
};
/** 
 * Rotate vector by pitch, yaw, and roll. Result is assigned to result parameter.
 * @method
 * @param {number} pitch
 * @param {number} yaw
 * @param {number} roll
 * @param {Vector} temp
 * @param {Vector} result
 */
Vector.prototype.rotatePitchYawRollLG = function(pitch_amnt, yaw_amnt, roll_amnt, result) {
    this.rotateXLG(roll_amnt, result);
    result.rotateYLG(pitch_amnt, result);
    result.rotateZLG(yaw_amnt, result);
};

var temp_vector1 = new Vector(0,0,0);
var temp_vector2 = new Vector(0,0,0);

module.exports = Vector;

},{}],8:[function(_dereq_,module,exports){
_dereq_('./../tests/helpers.js');
_dereq_('./../tests/math/matrix.js');
_dereq_('./../tests/math/vector.js');

},{"./../tests/helpers.js":9,"./../tests/math/matrix.js":10,"./../tests/math/vector.js":11}],9:[function(_dereq_,module,exports){
function nearlyEqual(a, b, eps){
    if (typeof eps === "undefined") {eps = 0.01;}
    var diff = Math.abs(a - b);
    return (diff < eps);
}

var helpers = new Object(null);

helpers.nearlyEqual = nearlyEqual;

module.exports = helpers;
},{}],10:[function(_dereq_,module,exports){
var Matrix = _dereq_('../../src/matrix.js');
var Vector = _dereq_('../../src/vector.js');
var assert = _dereq_("assert");

suite('Matrix', function(){
    var zero, zero2, zero3, identity, identity2, identity3, ones, m0, m1, m2, m3, m4, m5, m6, m7, angles;
    var result, temp_mat, temp_vector;
    setup(function(){
        result = new Matrix();
        temp_mat = new Matrix();
        temp_vector = new Vector(0,0,0);
        angles = [0, Math.PI / 2, Math.PI, 3*Math.PI / 2, Math.PI / 2];
        zero = Matrix.zero();
        zero2 = new Matrix();
        zero3 = Matrix.fromArray([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
        identity = Matrix.identity();
        identity2 = new Matrix();
        identity3 = Matrix.fromArray([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
        identity2[0] = 1;
        identity2[5] = 1;
        identity2[10] = 1;
        identity2[15] = 1;
        ones = new Matrix();
        m0 = new Matrix();
        m1 = new Matrix();
        m2 = new Matrix();
        m3 = new Matrix();
        m4 = new Matrix();
        m4[0] = 0;
        m4[1] = 1;
        m4[2] = 1;
        m4[3] = 2;
        m4[4] = 3;
        m4[5] = 5;
        m4[6] = 8;
        m4[7] = 13;
        m4[8] = 21;
        m4[9] = 34;
        m4[10] = 55;
        m4[11] = 89;
        m4[12] = 144;
        m4[13] = 233;
        m4[14] = 377;
        m4[15] = 610;
        m5 = Matrix.fromArray([0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610]);
        m6 = Matrix.fromArray([1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4, 5, 6, 7, 8]);
        m7 = Matrix.fromArray([34, 44, 54, 64, 82, 108, 134, 160, 34, 44, 54, 64, 82, 108, 134, 160]);
        for (var i = 0; i < 16; i++){
            ones[i] = 1;
            m0[i] = i;
            m1[i] = i+1;
            m2[i] = i+2;
            m3[i] = i*2;
        }
    });
    suite('properties', function(){
        test('length', function(){
            assert.equal(zero.length, 16);
            assert.equal(zero2.length, 16);
            assert.equal(zero3.length, 16);
            assert.equal(identity.length, 16);
            assert.equal(identity2.length, 16);
            assert.equal(m1.length, 16);
            assert.equal(m2.length, 16);
            assert.equal(m3.length, 16);
            assert.equal(m4.length, 16);
            assert.equal(m5.length, 16);
        });
    });
    suite('methods', function(){
        test('equal', function(){
            assert.ok(identity.equal(identity2));
            assert.ok(zero.equal(zero2));
            assert.ok(zero.equal(zero3));
            assert.ok(zero2.equal(zero3));
            assert.ok(!identity.equal(zero));
            assert.ok(m4.equal(m5));
            assert.ok(!m0.equal(m1));
            assert.ok(!m0.equal(m2));
            assert.ok(!m0.equal(m3));
        });
        test('add', function(){
            var t1 = zero.add(m1);
            var t2 = m0.add(ones);
            var t3 = m0.add(ones).add(ones);
            assert.ok(t1.equal(m1));
            assert.ok(t2.equal(m1));
            assert.ok(t3.equal(m2));
        });
        test('addLG', function(){
            zero.addLG(m1, result);
            assert.ok(result.equal(m1));
            m0.addLG(ones, result);
            assert.ok(result.equal(m1));
            
            m0.addLG(ones, result)
            result.addLG(ones, result);
            assert.ok(result.equal(m2));
        });
        test('subtract', function(){
            var t1 = m4.subtract(m5);
            var t2 = m1.subtract(ones);
            var t3 = m2.subtract(m1);
            assert.ok(t1.equal(zero));
            assert.ok(t2.equal(m0));
            assert.ok(t3.equal(ones));
        });
        test('subtractLG', function(){
            m4.subtractLG(m5, result);
            assert.ok(result.equal(zero));
            m1.subtractLG(ones, result);
            assert.ok(result.equal(m0));
            m2.subtractLG(m1, result);
            assert.ok(result.equal(ones));
        });
        test('multiplyScalar', function(){
            var t1 = m0.multiplyScalar(2);
            var t2 = zero.multiplyScalar(20);
            var t3 = m0.multiplyScalar(1);
            assert.ok(t1.equal(m3));
            assert.ok(t2.equal(zero));
            assert.ok(t3.equal(m0));
        });
        test('multiplyScalarLG', function(){
            m0.multiplyScalarLG(2, result);
            assert.ok(result.equal(m3));
            zero.multiplyScalarLG(20, result);
            assert.ok(result.equal(zero));
            m0.multiplyScalarLG(1, result);
            assert.ok(result.equal(m0));
        });
        test('multiply', function(){
            var t1 = m6.multiply(m6);
            var t2 = identity.multiply(identity);
            var t3 = identity.multiply(zero);
            var t4 = identity.multiply(m0);
            var t5 = zero.multiply(m0);
            assert.ok(t1.equal(m7));
            assert.ok(t2.equal(identity));
            assert.ok(t3.equal(zero));
            assert.ok(t4.equal(m0));
            assert.ok(t5.equal(zero));
        });
        test('multiplyLG', function(){
            m6.multiplyLG(m6, result);
            assert.ok(result.equal(m7));
            identity.multiplyLG(identity, result);
            assert.ok(result.equal(identity));
            identity.multiplyLG(zero, result);
            assert.ok(result.equal(zero));
            identity.multiplyLG(m0, result);
            assert.ok(result.equal(m0));
            zero.multiplyLG(m0, result);
            assert.ok(result.equal(zero));
        });
        test('negate', function(){
            var t1 = m0.negate();
            var t2 = m1.negate();
            var t3 = m2.negate();
            var t4 = m3.negate();
            var t5 = zero.negate();
            var t6 = ones.negate();

            assert.ok(zero.equal(t5));
            for (var i = 0; i < 16; i++){
                assert.equal(t1[i], -m0[i]);
                assert.equal(t2[i], -m1[i]);
                assert.equal(t3[i], -m2[i]);
                assert.equal(t4[i], -m3[i]);
            }
            for (var j = 0; j < 16; j++){
                assert.equal(t1[j], -j);
                assert.equal(t6[j], -1);
            }
        });
        test('negateLG', function(){
            zero.negateLG(result);
            assert.ok(result.equal(zero));
            for (var i = 0; i < 16; i++){
                m0.negateLG(result);
                assert.equal(result[i], -m0[i]);
                m1.negateLG(result);
                assert.equal(result[i], -m1[i]);
                m2.negateLG(result);
                assert.equal(result[i], -m2[i]);
                m3.negateLG(result);
                assert.equal(result[i], -m3[i]);
            }
            for (var j = 0; j < 16; j++){
                m0.negateLG(result);
                assert.equal(result[j], -j);
                ones.negateLG(result);
                assert.equal(result[j], -1);
            }
        });
        test('transpose', function(){
            var transpose_map = {
                0:0, 1:4, 2:8, 3:12, 4:1, 5:5, 6:9, 7:13,
                8:2, 9:6, 10:10, 11:14, 12:3, 13:7, 14:11, 15:15
            }
            var t1 = identity.transpose();
            var t2 = ones.transpose();
            var t3 = zero.transpose();
            var t4 = m0.transpose();
            var t5 = m1.transpose();
            var t6 = m2.transpose();
            var t7 = m3.transpose();

            assert.ok(t1.equal(identity));
            assert.ok(t2.equal(ones));
            assert.ok(t3.equal(zero));
            var t4 = m0.transpose();
            for (var i = 0; i < 16; i++){
                assert.equal(t4[i], m0[transpose_map[i]]);
                assert.equal(t5[i], m1[transpose_map[i]]);
                assert.equal(t6[i], m2[transpose_map[i]]);
                assert.equal(t7[i], m3[transpose_map[i]]);
            }
        });
        test('transposeLG', function(){
            var transpose_map = {
                0:0, 1:4, 2:8, 3:12, 4:1, 5:5, 6:9, 7:13,
                8:2, 9:6, 10:10, 11:14, 12:3, 13:7, 14:11, 15:15
            }

            identity.transposeLG(result);
            assert.ok(result.equal(identity));
            ones.transposeLG(result);
            assert.ok(result.equal(ones));
            zero.transposeLG(result);
            assert.ok(result.equal(zero));
            var t4 = m0.transpose();
            for (var i = 0; i < 16; i++){
                m0.transposeLG(result);
                assert.equal(result[i], m0[transpose_map[i]]);
                m1.transposeLG(result);
                assert.equal(result[i], m1[transpose_map[i]]);
                m2.transposeLG(result);
                assert.equal(result[i], m2[transpose_map[i]]);
                m3.transposeLG(result);
                assert.equal(result[i], m3[transpose_map[i]]);
            }
        });
        test('empty', function(){
                m0.transposeLG(result);
                result.empty();
                assert.ok(result.equal(zero));
                m1.transposeLG(result);
                result.empty();
                assert.ok(result.equal(zero));
                m2.transposeLG(result);
                result.empty();
                assert.ok(result.equal(zero));
                m3.transposeLG(result);
                result.empty();
                assert.ok(result.equal(zero));
        });
        test('copy', function(){
            m0.copy(result);
            assert.ok(result.equal(m0));
            m1.copy(result);
            assert.ok(result.equal(m1));
            m2.copy(result);
            assert.ok(result.equal(m2));
            m3.copy(result);
            assert.ok(result.equal(m3));
        });
        test('rotationX', function(){
            // TODO: Add more tests
            for (var i = 0; i < angles.length; i++){
                var theta = angles[i];
                var t1 = Matrix.rotationX(theta);
                var t2 = Matrix.identity();
                t2[5] = Math.cos(theta)
                t2[6] = -Math.sin(theta)
                t2[9] = Math.sin(theta)
                t2[10] = Math.cos(theta)
                assert.ok(t1.equal(t2));
            }
        });
        test('rotationXLG', function(){
            // TODO: Add more tests
            for (var i = 0; i < angles.length; i++){
                var theta = angles[i];
                Matrix.rotationXLG(theta, result);
                var t2 = Matrix.identity();
                t2[5] = Math.cos(theta)
                t2[6] = -Math.sin(theta)
                t2[9] = Math.sin(theta)
                t2[10] = Math.cos(theta)
                assert.ok(result.equal(t2));
            }
        });
        test('rotationY', function(){
            // TODO: Add more tests
            for (var i = 0; i < angles.length; i++){
                var theta = angles[i];
                var t1 = Matrix.rotationY(theta);
                var t2 = Matrix.identity();
                t2[0] = Math.cos(theta)
                t2[2] = Math.sin(theta)
                t2[8] = -Math.sin(theta)
                t2[10] = Math.cos(theta)
                assert.ok(t1.equal(t2));
            }
        });
        test('rotationYLG', function(){
            // TODO: Add more tests
            for (var i = 0; i < angles.length; i++){
                var theta = angles[i];
                Matrix.rotationYLG(theta, result);
                var t2 = Matrix.identity();
                t2[0] = Math.cos(theta)
                t2[2] = Math.sin(theta)
                t2[8] = -Math.sin(theta)
                t2[10] = Math.cos(theta)
                assert.ok(result.equal(t2));
            }
        });
        test('rotationZ', function(){
            // TODO: Add more tests
            for (var i = 0; i < angles.length; i++){
                var theta = angles[i];
                var t1 = Matrix.rotationZ(theta);
                var t2 = Matrix.identity();
                t2[0] = Math.cos(theta)
                t2[1] = -Math.sin(theta)
                t2[4] = Math.sin(theta)
                t2[5] = Math.cos(theta)
                assert.ok(t1.equal(t2));
            }
        });
        test('rotationZLG', function(){
            // TODO: Add more tests
            for (var i = 0; i < angles.length; i++){
                var theta = angles[i];
                Matrix.rotationZLG(theta, result);
                var t2 = Matrix.identity();
                t2[0] = Math.cos(theta)
                t2[1] = -Math.sin(theta)
                t2[4] = Math.sin(theta)
                t2[5] = Math.cos(theta)
                assert.ok(result.equal(t2));
            }
        });
        test('rotationAxis', function(){
            // TODO: Add multi-axis tests?
            var xaxis = new Vector(1, 0, 0);
            var yaxis = new Vector(0, 1, 0);
            var zaxis = new Vector(0, 0, 1);
            for (var i = 0; i < angles.length; i++){
                var theta = angles[i];
                var t1 = Matrix.rotationAxis(xaxis, theta);
                var t2 = Matrix.rotationAxis(yaxis, theta);
                var t3 = Matrix.rotationAxis(zaxis, theta);
                var t4 = Matrix.rotationAxis(xaxis, theta);
                var t5 = Matrix.rotationAxis(yaxis, theta);
                var t6 = Matrix.rotationAxis(zaxis, theta);
                assert.ok(t1.equal(Matrix.rotationX(theta)));
                assert.ok(t2.equal(Matrix.rotationY(theta)));
                assert.ok(t3.equal(Matrix.rotationZ(theta)));
                assert.ok(t4.equal(Matrix.rotationX(theta)));
                assert.ok(t5.equal(Matrix.rotationY(theta)));
                assert.ok(t6.equal(Matrix.rotationZ(theta)));
            }
        });
        test('rotationAxisLG', function(){
            // TODO: Add multi-axis tests?
            var xaxis = new Vector(1, 0, 0);
            var yaxis = new Vector(0, 1, 0);
            var zaxis = new Vector(0, 0, 1);
            for (var i = 0; i < angles.length; i++){
                var theta = angles[i];
                Matrix.rotationAxisLG(xaxis, theta, result);
                assert.ok(result.equal(Matrix.rotationX(theta)));
                Matrix.rotationAxisLG(yaxis, theta, result);
                assert.ok(result.equal(Matrix.rotationY(theta)));
                Matrix.rotationAxisLG(zaxis, theta, result);
                assert.ok(result.equal(Matrix.rotationZ(theta)));
                Matrix.rotationAxisLG(xaxis, theta, result);
                assert.ok(result.equal(Matrix.rotationX(theta)));
                Matrix.rotationAxisLG(yaxis, theta, result);
                assert.ok(result.equal(Matrix.rotationY(theta)));
                Matrix.rotationAxisLG(zaxis, theta, result);
                assert.ok(result.equal(Matrix.rotationZ(theta)));
            }
        });
        test('rotation', function(){
            // TODO: Add better tests, this is basically just recreating the method
            for (var i = 0; i < angles.length; i++){
                var pitch = angles[i];
                for (var j = 0; j < angles.length; j++){
                    var yaw = angles[j];
                    for (var k = 0; k < angles.length; k++){
                        var roll = angles[k];
                        var t1 = Matrix.rotation(pitch, yaw, roll);
                        var t2 = Matrix.rotationX(roll).
                            multiply(Matrix.rotationZ(yaw)).
                            multiply(Matrix.rotationY(pitch));
                        assert.ok(t1.equal(t2));
                    }
                }
            }
        });
        test('rotationLG', function(){
            // TODO: Add better tests, this is basically just recreating the method
            for (var i = 0; i < angles.length; i++){
                var pitch = angles[i];
                for (var j = 0; j < angles.length; j++){
                    var yaw = angles[j];
                    for (var k = 0; k < angles.length; k++){
                        var roll = angles[k];
                        Matrix.rotationLG(pitch, yaw, roll, result);
                        var t1 = Matrix.rotationX(roll).
                            multiply(Matrix.rotationZ(yaw)).
                            multiply(Matrix.rotationY(pitch));
                        assert.ok(result.equal(t1));
                    }
                }
            }
        });
        test('translation', function(){
            var trans = [1, 2, 3, 5, 10, 20, 30, 40];
            for (var i = 0; i < trans.length; i++){
                var xtrans = trans[i];
                for (var j = 0; j < trans.length; j++){
                    var ytrans = trans[j];
                    for (var k = 0; k < trans.length; k++){
                        var ztrans = trans[k];
                        var t1 = Matrix.translation(xtrans, ytrans, ztrans);
                        for (var m = 0; m < 16; m++){
                            var result;
                            if (m === 12){
                                result = xtrans;
                            } else if (m === 13){
                                result = ytrans;
                            } else if (m === 14){
                                result = ztrans;
                            } else if (m === 0 || m === 5 || m === 10 || m === 15) {
                                result = 1;
                            } else {
                                result = 0;
                            }
                            assert.equal(t1[m], result);
                        }
                    }
                }
            }
        });
        test('translationLG', function(){
            var trans = [1, 2, 3, 5, 10, 20, 30, 40];
            for (var i = 0; i < trans.length; i++){
                var xtrans = trans[i];
                for (var j = 0; j < trans.length; j++){
                    var ytrans = trans[j];
                    for (var k = 0; k < trans.length; k++){
                        var ztrans = trans[k];
                        var t1 = Matrix.translationLG(xtrans, ytrans, ztrans, result);
                        for (var m = 0; m < 16; m++){
                            var res;
                            if (m === 12){
                                res = xtrans;
                            } else if (m === 13){
                                res = ytrans;
                            } else if (m === 14){
                                res = ztrans;
                            } else if (m === 0 || m === 5 || m === 10 || m === 15) {
                                res = 1;
                            } else {
                                res = 0;
                            }
                            assert.equal(res, result[m]);
                        }
                    }
                }
            }
        });
        test('scale', function(){
            var scale = [1, 2, 3, 5, 10, 20, 30, 40];
            for (var i = 0; i < scale.length; i++){
                var xscale = scale[i];
                for (var j = 0; j < scale.length; j++){
                    var yscale = scale[j];
                    for (var k = 0; k < scale.length; k++){
                        var zscale = scale[k];
                        var t1 = Matrix.scale(xscale, yscale, zscale);
                        for (var m = 0; m < 16; m++){
                            var result;
                            if (m === 0){
                                result = xscale;
                            } else if (m === 5){
                                result = yscale;
                            } else if (m === 10){
                                result = zscale;
                            } else if (m === 15) {
                                result = 1;
                            } else {
                                result = 0;
                            }
                            assert.equal(t1[m], result);
                        }
                    }
                }
            }
        });
        test('scaleLG', function(){
            var scale = [1, 2, 3, 5, 10, 20, 30, 40];
            for (var i = 0; i < scale.length; i++){
                var xscale = scale[i];
                for (var j = 0; j < scale.length; j++){
                    var yscale = scale[j];
                    for (var k = 0; k < scale.length; k++){
                        var zscale = scale[k];
                        var t1 = Matrix.scaleLG(xscale, yscale, zscale, result);
                        for (var m = 0; m < 16; m++){
                            var res;
                            if (m === 0){
                                res = xscale;
                            } else if (m === 5){
                                res = yscale;
                            } else if (m === 10){
                                res = zscale;
                            } else if (m === 15) {
                                res = 1;
                            } else {
                                res = 0;
                            }
                            assert.equal(result[m], res);
                        }
                    }
                }
            }
        });
        test('identity', function(){
            assert.ok(identity.equal(identity2));
            assert.ok(identity.equal(identity3));
            for (var i = 0; i < 16; i++){
                if (i % 5 === 0){
                    assert.equal(identity[i], 1);
                } else {
                    assert.equal(identity[i], 0);
                }
            }
        });
        test('identityLG', function(){
            Matrix.identityLG(result);
            assert.ok(result.equal(identity2));
            assert.ok(result.equal(identity3));
            for (var i = 0; i < 16; i++){
                if (i % 5 === 0){
                    assert.equal(result[i], 1);
                } else {
                    assert.equal(result[i], 0);
                }
            }
        });
        test('zero', function(){
            assert.ok(zero.equal(zero2));
            assert.ok(zero.equal(zero3));
            for (var i = 0; i < 16; i++){
                assert.equal(zero[i], 0);
            }
        });
        test('zero', function(){
            Matrix.zeroLG(result);
            assert.ok(result.equal(zero2));
            assert.ok(result.equal(zero3));
            for (var i = 0; i < 16; i++){
                assert.equal(result[i], 0);
            }
        });
        test('fromArray', function(){
            assert.ok(m5.equal(m4));
            assert.ok(zero.equal(zero3));
            assert.ok(zero2.equal(zero3));
            assert.ok(identity.equal(identity3));
            assert.ok(identity2.equal(identity3));
        });
        test('fromArrayLG', function(){
            Matrix.fromArrayLG([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], result);
            assert.ok(result.equal(zero3));
            assert.ok(result.equal(zero2));
            Matrix.fromArrayLG([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1], result);
            assert.ok(result.equal(identity2));
            Matrix.fromArrayLG([0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610], result);
            assert.ok(result.equal(m4));
        });
        test('Matrix.copy', function(){
            Matrix.copy(m0, result);
            assert.ok(result.equal(m0));
            Matrix.copy(m1, result);
            assert.ok(result.equal(m1));
            Matrix.copy(m2, result);
            assert.ok(result.equal(m2));
            Matrix.copy(m3, result);
            assert.ok(result.equal(m3));
        });
    });
});

},{"../../src/matrix.js":6,"../../src/vector.js":7,"assert":1}],11:[function(_dereq_,module,exports){
var Vector = _dereq_('../../src/vector.js');
var assert = _dereq_('assert');
var nearlyEqual = _dereq_('../helpers.js')['nearlyEqual'];

suite('Vector', function(){
    var origin, vector1, vector2, vector3, vector4, vector5, vectorx, vectory, vectorz;
    var vector100x, vector200y, vector300z, vector123, vector112;
    var result, temp1, temp2;
    setup(function(){
        result = new Vector(0, 0, 0);
        temp1 = new Vector(0, 0, 0);
        temp2 = new Vector(0, 0, 0);
        origin = new Vector(0, 0, 0);
        vector1 = new Vector(1, 1, 1);
        vector2 = new Vector(1, 1, 1);
        vector3 = new Vector(10, 10, 10);
        vector4 = new Vector(11, 11, 11);
        vector5 = new Vector(-1, -1, -1);
        vectorx = new Vector(1, 0, 0);
        vectory = new Vector(0, 1, 0);
        vectorz = new Vector(0, 0, 1);
        vector100x = new Vector(100, 0, 0);
        vector200y = new Vector(0, 200, 0);
        vector300z = new Vector(0, 0, 300);
        vector123 = new Vector(1, 2, 3);
        vector112 = new Vector(-1, 1, 2);
    });
    suite('properties', function(){
        test('axes', function(){
            assert.throws(function(){new Vector();}, Error);
            assert.ok(vector1.x);
            assert.ok(vector1.y);
            assert.ok(vector1.z);
        });
    });
    suite('methods', function(){
        test('add', function(){
            var t1 = vector1.add(vector3);
            var t2 = vector1.add(vector5);
            assert.ok(t1.equal(vector4));
            assert.ok(t2.equal(origin));
            assert.equal(t1.x, 11);
            assert.equal(t1.y, 11);
            assert.equal(t1.z, 11);
            assert.equal(t2.x, 0);
            assert.equal(t2.y, 0);
            assert.equal(t2.z, 0);
        });
        test('addLG', function(){
            vector1.addLG(vector3, result);
            assert.equal(result.x, 11);
            assert.equal(result.y, 11);
            assert.equal(result.z, 11);
            assert.ok(result.equal(vector4));
            vector1.addLG(vector5, result);
            assert.ok(result.equal(origin));
            assert.equal(result.x, 0);
            assert.equal(result.y, 0);
            assert.equal(result.z, 0);
        });
        test('subtract', function(){
            var t1 = vector4.subtract(vector1);
            var t2 = vector1.subtract(vector2);
            assert.ok(t1.equal(vector3));
            assert.ok(t2.equal(origin));
            assert.equal(t1.x, 10);
            assert.equal(t1.y, 10);
            assert.equal(t1.z, 10);
            assert.equal(t2.x, 0);
            assert.equal(t2.y, 0);
            assert.equal(t2.z, 0);
        });
        test('subtractLG', function(){
            vector4.subtractLG(vector1, result);
            assert.ok(result.equal(vector3));
            assert.equal(result.x, 10);
            assert.equal(result.y, 10);
            assert.equal(result.z, 10);
            vector1.subtractLG(vector2, result);
            assert.ok(result.equal(origin));
            assert.equal(result.x, 0);
            assert.equal(result.y, 0);
            assert.equal(result.z, 0);
        });
        test('equal', function(){
            assert.equal(vector1.equal(vector2), true);
            assert.equal(vector1.equal(vector3), false);
        });
        test('angle', function(){
            assert.ok(nearlyEqual(vectorx.angle(vectory), Math.PI / 2));
            assert.ok(nearlyEqual(vectory.angle(vectorz), Math.PI / 2));
            assert.ok(nearlyEqual(vectorx.angle(vectorz), Math.PI / 2));
            assert.ok(nearlyEqual(vector1.angle(vector2), 0));
            assert.ok(nearlyEqual(vector1.angle(vector5), Math.PI));
        });
        test('angleLG', function(){
            assert.ok(nearlyEqual(vectorx.angleLG(vectory), Math.PI / 2));
            assert.ok(nearlyEqual(vectory.angleLG(vectorz), Math.PI / 2));
            assert.ok(nearlyEqual(vectorx.angleLG(vectorz), Math.PI / 2));
            assert.ok(nearlyEqual(vector1.angleLG(vector2), 0));
            assert.ok(nearlyEqual(vector1.angleLG(vector5), Math.PI));
        });
        test('cosAngle', function(){
            assert.ok(nearlyEqual(Math.acos(vectorx.cosAngle(vectory)), (Math.PI / 2)));
            assert.ok(nearlyEqual(Math.acos(vectory.cosAngle(vectorz)), (Math.PI / 2)));
            assert.ok(nearlyEqual(Math.acos(vectorx.cosAngle(vectorz)), (Math.PI / 2)));
            assert.ok(nearlyEqual(Math.acos(vector1.cosAngle(vector2)), 0));
            assert.ok(nearlyEqual(Math.acos(vector1.cosAngle(vector5)), Math.PI));
        });
        test('cosAngleLG', function(){
            assert.ok(nearlyEqual(Math.acos(vectorx.cosAngleLG(vectory)), (Math.PI / 2)));
            assert.ok(nearlyEqual(Math.acos(vectory.cosAngleLG(vectorz)), (Math.PI / 2)));
            assert.ok(nearlyEqual(Math.acos(vectorx.cosAngleLG(vectorz)), (Math.PI / 2)));
            assert.ok(nearlyEqual(Math.acos(vector1.cosAngleLG(vector2)), 0));
            assert.ok(nearlyEqual(Math.acos(vector1.cosAngleLG(vector5)), Math.PI));
        });
        test('magnitude', function(){
            assert.equal(vectorx.magnitude(), 1);
            assert.equal(vectory.magnitude(), 1);
            assert.equal(vectorz.magnitude(), 1);
            assert.ok(nearlyEqual(vector1.magnitude(), Math.sqrt(3)));
            assert.ok(nearlyEqual(vector5.magnitude(), Math.sqrt(3)));
            assert.ok(nearlyEqual(vector3.magnitude(), Math.sqrt(300)));
        });
        test('magnitudeSquared', function(){
            assert.equal(vectorx.magnitudeSquared(), 1);
            assert.equal(vectory.magnitudeSquared(), 1);
            assert.equal(vectorz.magnitudeSquared(), 1);
            assert.equal(vector1.magnitudeSquared(), 3);
            assert.equal(vector5.magnitudeSquared(), 3);
            assert.equal(vector3.magnitudeSquared(), 300);
        });
        test('dot', function(){
            assert.equal(vector1.dot(vector2), 3);
            assert.equal(vector2.dot(vector3), 30);
            assert.equal(vector3.dot(vector5), -30);
            assert.equal(vectorx.dot(vectory), 0);
            assert.equal(vectorx.dot(vectorz), 0);
            assert.equal(vectory.dot(vectorz), 0);
        });
        test('cross', function(){
            var t1 = vector123.cross(vector112);
            assert.ok(vectorx.cross(vectory).equal(vectorz));
            assert.ok(vectory.cross(vectorz).equal(vectorx));
            assert.ok(vectorz.cross(vectorx).equal(vectory));
            assert.ok(!vectory.cross(vectorx).equal(vectorz));
            assert.ok(!vectorz.cross(vectory).equal(vectorx));
            assert.ok(!vectorx.cross(vectorz).equal(vectory));
            assert.equal(vectorx.cross(vectory).z, 1);
            assert.equal(vectory.cross(vectorz).x, 1);
            assert.equal(vectorz.cross(vectorx).y, 1);
            assert.equal(t1.x, 1);
            assert.equal(t1.y, -5);
            assert.equal(t1.z, 3);
        });
        test('crossLG', function(){
            vector123.crossLG(vector112, result);
            assert.equal(result.x, 1);
            assert.equal(result.y, -5);
            assert.equal(result.z, 3);
            vectorx.crossLG(vectory, result);
            assert.equal(result.z, 1);
            assert.ok(result.equal(vectorz));
            vectory.crossLG(vectorz, result);
            assert.equal(result.x, 1);
            assert.ok(result.equal(vectorx));
            vectorz.crossLG(vectorx, result);
            assert.equal(result.y, 1);
            assert.ok(result.equal(vectory));
            vectory.crossLG(vectorx, result)
            assert.ok(!result.equal(vectorz));
            vectorz.crossLG(vectory, result)
            assert.ok(!result.equal(vectorx));
            vectorx.crossLG(vectorz, result)
            assert.ok(!result.equal(vectory));
        });
        test('normalize', function(){
            assert.equal(vector100x.normalize().x, 1);
            assert.equal(vector200y.normalize().y, 1);
            assert.equal(vector300z.normalize().z, 1);
        });
        test('normalizeLG', function(){
            vector100x.normalizeLG(result)
            assert.equal(result.x, 1);
            vector200y.normalizeLG(result)
            assert.equal(result.y, 1);
            vector300z.normalizeLG(result)
            assert.equal(result.z, 1);
        });
        test('scale', function(){
            assert.ok(vectorx.scale(100).equal(vector100x));
            assert.ok(vectory.scale(200).equal(vector200y));
            assert.ok(vectorz.scale(300).equal(vector300z));
            assert.ok(vector1.scale(10).equal(vector3));
            assert.ok(vector1.scale(11).equal(vector4));
        });
        test('scaleLG', function(){
            vectorx.scaleLG(100, result);
            assert.ok(result.equal(vector100x));
            vectory.scaleLG(200, result);
            assert.ok(result.equal(vector200y));
            vectorz.scaleLG(300, result);
            assert.ok(result.equal(vector300z));
            vector1.scaleLG(10, result);
            assert.ok(result.equal(vector3));
            vector1.scaleLG(11, result);
            assert.ok(result.equal(vector4));
        });
        test('negate', function(){
            assert.ok(vector1.negate().equal(vector5));
            assert.ok(vector1.negate().negate().equal(vector1));
        });
        test('negateLG', function(){
            vector1.negateLG(result);
            assert.ok(result.equal(vector5));
            vector1.negateLG(temp1);
            temp1.negateLG(result);
            assert.ok(result.equal(vector1));
        });
        test('vectorProjection', function(){
            var t1 = vectorx.vectorProjection(vectory);
            var t2 = vector1.vectorProjection(vector3);
            var t3 = vector123.vectorProjection(vector112);
            assert.ok(nearlyEqual(t1.x, 0));
            assert.ok(nearlyEqual(t1.y, 0));
            assert.ok(nearlyEqual(t1.z, 0));
            assert.ok(nearlyEqual(t2.x, 1));
            assert.ok(nearlyEqual(t2.y, 1));
            assert.ok(nearlyEqual(t2.z, 1));
            assert.ok(nearlyEqual(t3.x, -1.167));
            assert.ok(nearlyEqual(t3.y, 1.16));
            assert.ok(nearlyEqual(t3.z, 2.33));
        });
        test('vectorProjectionLG', function(){
            vectorx.vectorProjectionLG(vectory, result);
            assert.ok(nearlyEqual(result.x, 0));
            assert.ok(nearlyEqual(result.y, 0));
            assert.ok(nearlyEqual(result.z, 0));
            vector1.vectorProjectionLG(vector3, result);
            assert.ok(nearlyEqual(result.x, 1));
            assert.ok(nearlyEqual(result.y, 1));
            assert.ok(nearlyEqual(result.z, 1));
            vector123.vectorProjectionLG(vector112, result);
            assert.ok(nearlyEqual(result.x, -1.167));
            assert.ok(nearlyEqual(result.y, 1.16));
            assert.ok(nearlyEqual(result.z, 2.33));
        });
        test('scalarProjection', function(){
            assert.ok(nearlyEqual(vectorx.scalarProjection(vectory), 0));
            assert.ok(nearlyEqual(vectory.scalarProjection(vectorz), 0));
            assert.ok(nearlyEqual(vectory.scalarProjection(vectorz), 0));
            assert.ok(nearlyEqual(vector1.scalarProjection(vector3), 1.73));
            assert.ok(nearlyEqual(vector123.scalarProjection(vector112), 2.85));
        });
        // test('transform', function(){
        //     // TODO: Think of test cases
        //     assert.equal(1, 2);
        // });
        // test('transformLG', function(){
        //     // TODO: Think of test cases
        //     assert.equal(1, 2);
        // });
        test('rotate', function(){
            var rot1 = vectorx.rotate(vectory, Math.PI / 2);
            var rot2 = vectorx.rotate(vectory, Math.PI);
            var rot3 = vectorx.rotate(vectory, ((3*Math.PI) / 2));
            var rot4 = vectorx.rotate(vectory, 2*Math.PI);
            assert.ok(nearlyEqual(rot1.x, 0));
            assert.ok(nearlyEqual(rot1.y, 0));
            assert.ok(nearlyEqual(rot1.z, -1));
            assert.ok(nearlyEqual(rot2.x, -1));
            assert.ok(nearlyEqual(rot2.y, 0));
            assert.ok(nearlyEqual(rot2.z, 0));
            assert.ok(nearlyEqual(rot3.x, 0));
            assert.ok(nearlyEqual(rot3.y, 0));
            assert.ok(nearlyEqual(rot3.z, 1));
            assert.ok(nearlyEqual(rot4.x, 1));
            assert.ok(nearlyEqual(rot4.y, 0));
            assert.ok(nearlyEqual(rot4.z, 0));
        });
        test('rotate', function(){
            vectorx.rotateLG(vectory, Math.PI / 2, result);
            assert.ok(nearlyEqual(result.x, 0));
            assert.ok(nearlyEqual(result.y, 0));
            assert.ok(nearlyEqual(result.z, -1));
            vectorx.rotateLG(vectory, Math.PI, result);
            assert.ok(nearlyEqual(result.x, -1));
            assert.ok(nearlyEqual(result.y, 0));
            assert.ok(nearlyEqual(result.z, 0));
            vectorx.rotateLG(vectory, ((3*Math.PI) / 2), result);
            assert.ok(nearlyEqual(result.x, 0));
            assert.ok(nearlyEqual(result.y, 0));
            assert.ok(nearlyEqual(result.z, 1));
            vectorx.rotateLG(vectory, 2*Math.PI, result);
            assert.ok(nearlyEqual(result.x, 1));
            assert.ok(nearlyEqual(result.y, 0));
            assert.ok(nearlyEqual(result.z, 0));
        });
        test('rotateX', function(){
            var rot1 = vectorz.rotateX(Math.PI / 2);
            var rot2 = vectorz.rotateX(Math.PI);
            var rot3 = vectorz.rotateX(((3*Math.PI) / 2));
            var rot4 = vectorz.rotateX(2*Math.PI);
            assert.ok(nearlyEqual(rot1.x, 0));
            assert.ok(nearlyEqual(rot1.y, -1));
            assert.ok(nearlyEqual(rot1.z, 0));
            assert.ok(nearlyEqual(rot2.x, 0));
            assert.ok(nearlyEqual(rot2.y, 0));
            assert.ok(nearlyEqual(rot2.z, -1));
            assert.ok(nearlyEqual(rot3.x, 0));
            assert.ok(nearlyEqual(rot3.y, 1));
            assert.ok(nearlyEqual(rot3.z, 0));
            assert.ok(nearlyEqual(rot4.x, 0));
            assert.ok(nearlyEqual(rot4.y, 0));
            assert.ok(nearlyEqual(rot4.z, 1));
        });
        test('rotateXLG', function(){
            vectorz.rotateXLG(Math.PI / 2, result);
            assert.ok(nearlyEqual(result.x, 0));
            assert.ok(nearlyEqual(result.y, -1));
            assert.ok(nearlyEqual(result.z, 0));
            vectorz.rotateXLG(Math.PI, result);
            assert.ok(nearlyEqual(result.x, 0));
            assert.ok(nearlyEqual(result.y, 0));
            assert.ok(nearlyEqual(result.z, -1));
            vectorz.rotateXLG(((3*Math.PI) / 2), result);
            assert.ok(nearlyEqual(result.x, 0));
            assert.ok(nearlyEqual(result.y, 1));
            assert.ok(nearlyEqual(result.z, 0));
            vectorz.rotateXLG(2*Math.PI, result);
            assert.ok(nearlyEqual(result.x, 0));
            assert.ok(nearlyEqual(result.y, 0));
            assert.ok(nearlyEqual(result.z, 1));
        });
        test('rotateY', function(){
            var rot1 = vectorx.rotateY(Math.PI / 2);
            var rot2 = vectorx.rotateY(Math.PI);
            var rot3 = vectorx.rotateY(((3*Math.PI) / 2));
            var rot4 = vectorx.rotateY(2*Math.PI);
            assert.ok(nearlyEqual(rot1.x, 0));
            assert.ok(nearlyEqual(rot1.y, 0));
            assert.ok(nearlyEqual(rot1.z, -1));
            assert.ok(nearlyEqual(rot2.x, -1));
            assert.ok(nearlyEqual(rot2.y, 0));
            assert.ok(nearlyEqual(rot2.z, 0));
            assert.ok(nearlyEqual(rot3.x, 0));
            assert.ok(nearlyEqual(rot3.y, 0));
            assert.ok(nearlyEqual(rot3.z, 1));
            assert.ok(nearlyEqual(rot4.x, 1));
            assert.ok(nearlyEqual(rot4.y, 0));
            assert.ok(nearlyEqual(rot4.z, 0));
        });
        test('rotateYLG', function(){
            vectorx.rotateYLG(Math.PI / 2, result);
            assert.ok(nearlyEqual(result.x, 0));
            assert.ok(nearlyEqual(result.y, 0));
            assert.ok(nearlyEqual(result.z, -1));
            vectorx.rotateYLG(Math.PI, result);
            assert.ok(nearlyEqual(result.x, -1));
            assert.ok(nearlyEqual(result.y, 0));
            assert.ok(nearlyEqual(result.z, 0));
            vectorx.rotateYLG(((3*Math.PI) / 2), result);
            assert.ok(nearlyEqual(result.x, 0));
            assert.ok(nearlyEqual(result.y, 0));
            assert.ok(nearlyEqual(result.z, 1));
            vectorx.rotateYLG(2*Math.PI, result);
            assert.ok(nearlyEqual(result.x, 1));
            assert.ok(nearlyEqual(result.y, 0));
            assert.ok(nearlyEqual(result.z, 0));
        });
        test('rotateZ', function(){
            var rot1 = vectory.rotateZ(Math.PI / 2);
            var rot2 = vectory.rotateZ(Math.PI);
            var rot3 = vectory.rotateZ(((3*Math.PI) / 2));
            var rot4 = vectory.rotateZ(2*Math.PI);
            assert.ok(nearlyEqual(rot1.x, -1));
            assert.ok(nearlyEqual(rot1.y, 0));
            assert.ok(nearlyEqual(rot1.z, 0));
            assert.ok(nearlyEqual(rot2.x, 0));
            assert.ok(nearlyEqual(rot2.y, -1));
            assert.ok(nearlyEqual(rot2.z, 0));
            assert.ok(nearlyEqual(rot3.x, 1));
            assert.ok(nearlyEqual(rot3.y, 0));
            assert.ok(nearlyEqual(rot3.z, 0));
            assert.ok(nearlyEqual(rot4.x, 0));
            assert.ok(nearlyEqual(rot4.y, 1));
            assert.ok(nearlyEqual(rot4.z, 0));
        });
        test('rotateZLG', function(){
            vectory.rotateZLG(Math.PI / 2, result);
            assert.ok(nearlyEqual(result.x, -1));
            assert.ok(nearlyEqual(result.y, 0));
            assert.ok(nearlyEqual(result.z, 0));
            vectory.rotateZLG(Math.PI, result);
            assert.ok(nearlyEqual(result.x, 0));
            assert.ok(nearlyEqual(result.y, -1));
            assert.ok(nearlyEqual(result.z, 0));
            vectory.rotateZLG(((3*Math.PI) / 2), result);
            assert.ok(nearlyEqual(result.x, 1));
            assert.ok(nearlyEqual(result.y, 0));
            assert.ok(nearlyEqual(result.z, 0));
            vectory.rotateZLG(2*Math.PI, result);
            assert.ok(nearlyEqual(result.x, 0));
            assert.ok(nearlyEqual(result.y, 1));
            assert.ok(nearlyEqual(result.z, 0));
        });
        test('rotatePitchYawRoll', function(){
            var rot1 = vectorx.rotatePitchYawRoll(Math.PI / 2, Math.PI / 2, Math.PI / 2);
            assert.ok(nearlyEqual(rot1.x, 0));
            assert.ok(nearlyEqual(rot1.y, 0));
            assert.ok(nearlyEqual(rot1.z, -1));
        });
        test('rotatePitchYawRollLG', function(){
            vectorx.rotatePitchYawRollLG(Math.PI / 2, Math.PI / 2, Math.PI / 2, result);
            assert.ok(nearlyEqual(result.x, 0));
            assert.ok(nearlyEqual(result.y, 0));
            assert.ok(nearlyEqual(result.z, -1));
        });
    });
});
},{"../../src/vector.js":7,"../helpers.js":9,"assert":1}]},{},[8])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2ViZW5wYWNrL0RvY3VtZW50cy93b3JrL2xpbmVhcmFsZ2VhLmpzL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2ViZW5wYWNrL0RvY3VtZW50cy93b3JrL2xpbmVhcmFsZ2VhLmpzL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Fzc2VydC9hc3NlcnQuanMiLCIvaG9tZS9lYmVucGFjay9Eb2N1bWVudHMvd29yay9saW5lYXJhbGdlYS5qcy9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9hc3NlcnQvbm9kZV9tb2R1bGVzL3V0aWwvc3VwcG9ydC9pc0J1ZmZlckJyb3dzZXIuanMiLCIvaG9tZS9lYmVucGFjay9Eb2N1bWVudHMvd29yay9saW5lYXJhbGdlYS5qcy9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9hc3NlcnQvbm9kZV9tb2R1bGVzL3V0aWwvdXRpbC5qcyIsIi9ob21lL2ViZW5wYWNrL0RvY3VtZW50cy93b3JrL2xpbmVhcmFsZ2VhLmpzL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzX2Jyb3dzZXIuanMiLCIvaG9tZS9lYmVucGFjay9Eb2N1bWVudHMvd29yay9saW5lYXJhbGdlYS5qcy9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCIvaG9tZS9lYmVucGFjay9Eb2N1bWVudHMvd29yay9saW5lYXJhbGdlYS5qcy9zcmMvbWF0cml4LmpzIiwiL2hvbWUvZWJlbnBhY2svRG9jdW1lbnRzL3dvcmsvbGluZWFyYWxnZWEuanMvc3JjL3ZlY3Rvci5qcyIsIi9ob21lL2ViZW5wYWNrL0RvY3VtZW50cy93b3JrL2xpbmVhcmFsZ2VhLmpzL3Rlc3QvZmFrZV9jZGQ3ODc5Ny5qcyIsIi9ob21lL2ViZW5wYWNrL0RvY3VtZW50cy93b3JrL2xpbmVhcmFsZ2VhLmpzL3Rlc3RzL2hlbHBlcnMuanMiLCIvaG9tZS9lYmVucGFjay9Eb2N1bWVudHMvd29yay9saW5lYXJhbGdlYS5qcy90ZXN0cy9tYXRoL21hdHJpeC5qcyIsIi9ob21lL2ViZW5wYWNrL0RvY3VtZW50cy93b3JrL2xpbmVhcmFsZ2VhLmpzL3Rlc3RzL21hdGgvdmVjdG9yLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeFdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1a0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3bEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcGVBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIGh0dHA6Ly93aWtpLmNvbW1vbmpzLm9yZy93aWtpL1VuaXRfVGVzdGluZy8xLjBcbi8vXG4vLyBUSElTIElTIE5PVCBURVNURUQgTk9SIExJS0VMWSBUTyBXT1JLIE9VVFNJREUgVjghXG4vL1xuLy8gT3JpZ2luYWxseSBmcm9tIG5hcndoYWwuanMgKGh0dHA6Ly9uYXJ3aGFsanMub3JnKVxuLy8gQ29weXJpZ2h0IChjKSAyMDA5IFRob21hcyBSb2JpbnNvbiA8Mjgwbm9ydGguY29tPlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlICdTb2Z0d2FyZScpLCB0b1xuLy8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGVcbi8vIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vclxuLy8gc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCAnQVMgSVMnLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU5cbi8vIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT05cbi8vIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4vLyB3aGVuIHVzZWQgaW4gbm9kZSwgdGhpcyB3aWxsIGFjdHVhbGx5IGxvYWQgdGhlIHV0aWwgbW9kdWxlIHdlIGRlcGVuZCBvblxuLy8gdmVyc3VzIGxvYWRpbmcgdGhlIGJ1aWx0aW4gdXRpbCBtb2R1bGUgYXMgaGFwcGVucyBvdGhlcndpc2Vcbi8vIHRoaXMgaXMgYSBidWcgaW4gbm9kZSBtb2R1bGUgbG9hZGluZyBhcyBmYXIgYXMgSSBhbSBjb25jZXJuZWRcbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbC8nKTtcblxudmFyIHBTbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vLyAxLiBUaGUgYXNzZXJ0IG1vZHVsZSBwcm92aWRlcyBmdW5jdGlvbnMgdGhhdCB0aHJvd1xuLy8gQXNzZXJ0aW9uRXJyb3IncyB3aGVuIHBhcnRpY3VsYXIgY29uZGl0aW9ucyBhcmUgbm90IG1ldC4gVGhlXG4vLyBhc3NlcnQgbW9kdWxlIG11c3QgY29uZm9ybSB0byB0aGUgZm9sbG93aW5nIGludGVyZmFjZS5cblxudmFyIGFzc2VydCA9IG1vZHVsZS5leHBvcnRzID0gb2s7XG5cbi8vIDIuIFRoZSBBc3NlcnRpb25FcnJvciBpcyBkZWZpbmVkIGluIGFzc2VydC5cbi8vIG5ldyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3IoeyBtZXNzYWdlOiBtZXNzYWdlLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbDogYWN0dWFsLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBleHBlY3RlZCB9KVxuXG5hc3NlcnQuQXNzZXJ0aW9uRXJyb3IgPSBmdW5jdGlvbiBBc3NlcnRpb25FcnJvcihvcHRpb25zKSB7XG4gIHRoaXMubmFtZSA9ICdBc3NlcnRpb25FcnJvcic7XG4gIHRoaXMuYWN0dWFsID0gb3B0aW9ucy5hY3R1YWw7XG4gIHRoaXMuZXhwZWN0ZWQgPSBvcHRpb25zLmV4cGVjdGVkO1xuICB0aGlzLm9wZXJhdG9yID0gb3B0aW9ucy5vcGVyYXRvcjtcbiAgaWYgKG9wdGlvbnMubWVzc2FnZSkge1xuICAgIHRoaXMubWVzc2FnZSA9IG9wdGlvbnMubWVzc2FnZTtcbiAgICB0aGlzLmdlbmVyYXRlZE1lc3NhZ2UgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBnZXRNZXNzYWdlKHRoaXMpO1xuICAgIHRoaXMuZ2VuZXJhdGVkTWVzc2FnZSA9IHRydWU7XG4gIH1cbiAgdmFyIHN0YWNrU3RhcnRGdW5jdGlvbiA9IG9wdGlvbnMuc3RhY2tTdGFydEZ1bmN0aW9uIHx8IGZhaWw7XG5cbiAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgc3RhY2tTdGFydEZ1bmN0aW9uKTtcbiAgfVxuICBlbHNlIHtcbiAgICAvLyBub24gdjggYnJvd3NlcnMgc28gd2UgY2FuIGhhdmUgYSBzdGFja3RyYWNlXG4gICAgdmFyIGVyciA9IG5ldyBFcnJvcigpO1xuICAgIGlmIChlcnIuc3RhY2spIHtcbiAgICAgIHZhciBvdXQgPSBlcnIuc3RhY2s7XG5cbiAgICAgIC8vIHRyeSB0byBzdHJpcCB1c2VsZXNzIGZyYW1lc1xuICAgICAgdmFyIGZuX25hbWUgPSBzdGFja1N0YXJ0RnVuY3Rpb24ubmFtZTtcbiAgICAgIHZhciBpZHggPSBvdXQuaW5kZXhPZignXFxuJyArIGZuX25hbWUpO1xuICAgICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICAgIC8vIG9uY2Ugd2UgaGF2ZSBsb2NhdGVkIHRoZSBmdW5jdGlvbiBmcmFtZVxuICAgICAgICAvLyB3ZSBuZWVkIHRvIHN0cmlwIG91dCBldmVyeXRoaW5nIGJlZm9yZSBpdCAoYW5kIGl0cyBsaW5lKVxuICAgICAgICB2YXIgbmV4dF9saW5lID0gb3V0LmluZGV4T2YoJ1xcbicsIGlkeCArIDEpO1xuICAgICAgICBvdXQgPSBvdXQuc3Vic3RyaW5nKG5leHRfbGluZSArIDEpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnN0YWNrID0gb3V0O1xuICAgIH1cbiAgfVxufTtcblxuLy8gYXNzZXJ0LkFzc2VydGlvbkVycm9yIGluc3RhbmNlb2YgRXJyb3JcbnV0aWwuaW5oZXJpdHMoYXNzZXJ0LkFzc2VydGlvbkVycm9yLCBFcnJvcik7XG5cbmZ1bmN0aW9uIHJlcGxhY2VyKGtleSwgdmFsdWUpIHtcbiAgaWYgKHV0aWwuaXNVbmRlZmluZWQodmFsdWUpKSB7XG4gICAgcmV0dXJuICcnICsgdmFsdWU7XG4gIH1cbiAgaWYgKHV0aWwuaXNOdW1iZXIodmFsdWUpICYmIChpc05hTih2YWx1ZSkgfHwgIWlzRmluaXRlKHZhbHVlKSkpIHtcbiAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcbiAgfVxuICBpZiAodXRpbC5pc0Z1bmN0aW9uKHZhbHVlKSB8fCB1dGlsLmlzUmVnRXhwKHZhbHVlKSkge1xuICAgIHJldHVybiB2YWx1ZS50b1N0cmluZygpO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gdHJ1bmNhdGUocywgbikge1xuICBpZiAodXRpbC5pc1N0cmluZyhzKSkge1xuICAgIHJldHVybiBzLmxlbmd0aCA8IG4gPyBzIDogcy5zbGljZSgwLCBuKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gcztcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRNZXNzYWdlKHNlbGYpIHtcbiAgcmV0dXJuIHRydW5jYXRlKEpTT04uc3RyaW5naWZ5KHNlbGYuYWN0dWFsLCByZXBsYWNlciksIDEyOCkgKyAnICcgK1xuICAgICAgICAgc2VsZi5vcGVyYXRvciArICcgJyArXG4gICAgICAgICB0cnVuY2F0ZShKU09OLnN0cmluZ2lmeShzZWxmLmV4cGVjdGVkLCByZXBsYWNlciksIDEyOCk7XG59XG5cbi8vIEF0IHByZXNlbnQgb25seSB0aGUgdGhyZWUga2V5cyBtZW50aW9uZWQgYWJvdmUgYXJlIHVzZWQgYW5kXG4vLyB1bmRlcnN0b29kIGJ5IHRoZSBzcGVjLiBJbXBsZW1lbnRhdGlvbnMgb3Igc3ViIG1vZHVsZXMgY2FuIHBhc3Ncbi8vIG90aGVyIGtleXMgdG8gdGhlIEFzc2VydGlvbkVycm9yJ3MgY29uc3RydWN0b3IgLSB0aGV5IHdpbGwgYmVcbi8vIGlnbm9yZWQuXG5cbi8vIDMuIEFsbCBvZiB0aGUgZm9sbG93aW5nIGZ1bmN0aW9ucyBtdXN0IHRocm93IGFuIEFzc2VydGlvbkVycm9yXG4vLyB3aGVuIGEgY29ycmVzcG9uZGluZyBjb25kaXRpb24gaXMgbm90IG1ldCwgd2l0aCBhIG1lc3NhZ2UgdGhhdFxuLy8gbWF5IGJlIHVuZGVmaW5lZCBpZiBub3QgcHJvdmlkZWQuICBBbGwgYXNzZXJ0aW9uIG1ldGhvZHMgcHJvdmlkZVxuLy8gYm90aCB0aGUgYWN0dWFsIGFuZCBleHBlY3RlZCB2YWx1ZXMgdG8gdGhlIGFzc2VydGlvbiBlcnJvciBmb3Jcbi8vIGRpc3BsYXkgcHVycG9zZXMuXG5cbmZ1bmN0aW9uIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgb3BlcmF0b3IsIHN0YWNrU3RhcnRGdW5jdGlvbikge1xuICB0aHJvdyBuZXcgYXNzZXJ0LkFzc2VydGlvbkVycm9yKHtcbiAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgIGFjdHVhbDogYWN0dWFsLFxuICAgIGV4cGVjdGVkOiBleHBlY3RlZCxcbiAgICBvcGVyYXRvcjogb3BlcmF0b3IsXG4gICAgc3RhY2tTdGFydEZ1bmN0aW9uOiBzdGFja1N0YXJ0RnVuY3Rpb25cbiAgfSk7XG59XG5cbi8vIEVYVEVOU0lPTiEgYWxsb3dzIGZvciB3ZWxsIGJlaGF2ZWQgZXJyb3JzIGRlZmluZWQgZWxzZXdoZXJlLlxuYXNzZXJ0LmZhaWwgPSBmYWlsO1xuXG4vLyA0LiBQdXJlIGFzc2VydGlvbiB0ZXN0cyB3aGV0aGVyIGEgdmFsdWUgaXMgdHJ1dGh5LCBhcyBkZXRlcm1pbmVkXG4vLyBieSAhIWd1YXJkLlxuLy8gYXNzZXJ0Lm9rKGd1YXJkLCBtZXNzYWdlX29wdCk7XG4vLyBUaGlzIHN0YXRlbWVudCBpcyBlcXVpdmFsZW50IHRvIGFzc2VydC5lcXVhbCh0cnVlLCAhIWd1YXJkLFxuLy8gbWVzc2FnZV9vcHQpOy4gVG8gdGVzdCBzdHJpY3RseSBmb3IgdGhlIHZhbHVlIHRydWUsIHVzZVxuLy8gYXNzZXJ0LnN0cmljdEVxdWFsKHRydWUsIGd1YXJkLCBtZXNzYWdlX29wdCk7LlxuXG5mdW5jdGlvbiBvayh2YWx1ZSwgbWVzc2FnZSkge1xuICBpZiAoIXZhbHVlKSBmYWlsKHZhbHVlLCB0cnVlLCBtZXNzYWdlLCAnPT0nLCBhc3NlcnQub2spO1xufVxuYXNzZXJ0Lm9rID0gb2s7XG5cbi8vIDUuIFRoZSBlcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgc2hhbGxvdywgY29lcmNpdmUgZXF1YWxpdHkgd2l0aFxuLy8gPT0uXG4vLyBhc3NlcnQuZXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuZXF1YWwgPSBmdW5jdGlvbiBlcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgIT0gZXhwZWN0ZWQpIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJz09JywgYXNzZXJ0LmVxdWFsKTtcbn07XG5cbi8vIDYuIFRoZSBub24tZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIGZvciB3aGV0aGVyIHR3byBvYmplY3RzIGFyZSBub3QgZXF1YWxcbi8vIHdpdGggIT0gYXNzZXJ0Lm5vdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdEVxdWFsID0gZnVuY3Rpb24gbm90RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsID09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnIT0nLCBhc3NlcnQubm90RXF1YWwpO1xuICB9XG59O1xuXG4vLyA3LiBUaGUgZXF1aXZhbGVuY2UgYXNzZXJ0aW9uIHRlc3RzIGEgZGVlcCBlcXVhbGl0eSByZWxhdGlvbi5cbi8vIGFzc2VydC5kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuZGVlcEVxdWFsID0gZnVuY3Rpb24gZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKCFfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnZGVlcEVxdWFsJywgYXNzZXJ0LmRlZXBFcXVhbCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCkge1xuICAvLyA3LjEuIEFsbCBpZGVudGljYWwgdmFsdWVzIGFyZSBlcXVpdmFsZW50LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2UgaWYgKHV0aWwuaXNCdWZmZXIoYWN0dWFsKSAmJiB1dGlsLmlzQnVmZmVyKGV4cGVjdGVkKSkge1xuICAgIGlmIChhY3R1YWwubGVuZ3RoICE9IGV4cGVjdGVkLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhY3R1YWwubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhY3R1YWxbaV0gIT09IGV4cGVjdGVkW2ldKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgLy8gNy4yLiBJZiB0aGUgZXhwZWN0ZWQgdmFsdWUgaXMgYSBEYXRlIG9iamVjdCwgdGhlIGFjdHVhbCB2YWx1ZSBpc1xuICAvLyBlcXVpdmFsZW50IGlmIGl0IGlzIGFsc28gYSBEYXRlIG9iamVjdCB0aGF0IHJlZmVycyB0byB0aGUgc2FtZSB0aW1lLlxuICB9IGVsc2UgaWYgKHV0aWwuaXNEYXRlKGFjdHVhbCkgJiYgdXRpbC5pc0RhdGUoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5nZXRUaW1lKCkgPT09IGV4cGVjdGVkLmdldFRpbWUoKTtcblxuICAvLyA3LjMgSWYgdGhlIGV4cGVjdGVkIHZhbHVlIGlzIGEgUmVnRXhwIG9iamVjdCwgdGhlIGFjdHVhbCB2YWx1ZSBpc1xuICAvLyBlcXVpdmFsZW50IGlmIGl0IGlzIGFsc28gYSBSZWdFeHAgb2JqZWN0IHdpdGggdGhlIHNhbWUgc291cmNlIGFuZFxuICAvLyBwcm9wZXJ0aWVzIChgZ2xvYmFsYCwgYG11bHRpbGluZWAsIGBsYXN0SW5kZXhgLCBgaWdub3JlQ2FzZWApLlxuICB9IGVsc2UgaWYgKHV0aWwuaXNSZWdFeHAoYWN0dWFsKSAmJiB1dGlsLmlzUmVnRXhwKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwuc291cmNlID09PSBleHBlY3RlZC5zb3VyY2UgJiZcbiAgICAgICAgICAgYWN0dWFsLmdsb2JhbCA9PT0gZXhwZWN0ZWQuZ2xvYmFsICYmXG4gICAgICAgICAgIGFjdHVhbC5tdWx0aWxpbmUgPT09IGV4cGVjdGVkLm11bHRpbGluZSAmJlxuICAgICAgICAgICBhY3R1YWwubGFzdEluZGV4ID09PSBleHBlY3RlZC5sYXN0SW5kZXggJiZcbiAgICAgICAgICAgYWN0dWFsLmlnbm9yZUNhc2UgPT09IGV4cGVjdGVkLmlnbm9yZUNhc2U7XG5cbiAgLy8gNy40LiBPdGhlciBwYWlycyB0aGF0IGRvIG5vdCBib3RoIHBhc3MgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnLFxuICAvLyBlcXVpdmFsZW5jZSBpcyBkZXRlcm1pbmVkIGJ5ID09LlxuICB9IGVsc2UgaWYgKCF1dGlsLmlzT2JqZWN0KGFjdHVhbCkgJiYgIXV0aWwuaXNPYmplY3QoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbCA9PSBleHBlY3RlZDtcblxuICAvLyA3LjUgRm9yIGFsbCBvdGhlciBPYmplY3QgcGFpcnMsIGluY2x1ZGluZyBBcnJheSBvYmplY3RzLCBlcXVpdmFsZW5jZSBpc1xuICAvLyBkZXRlcm1pbmVkIGJ5IGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoYXMgdmVyaWZpZWRcbiAgLy8gd2l0aCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwpLCB0aGUgc2FtZSBzZXQgb2Yga2V5c1xuICAvLyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSwgZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5XG4gIC8vIGNvcnJlc3BvbmRpbmcga2V5LCBhbmQgYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LiBOb3RlOiB0aGlzXG4gIC8vIGFjY291bnRzIGZvciBib3RoIG5hbWVkIGFuZCBpbmRleGVkIHByb3BlcnRpZXMgb24gQXJyYXlzLlxuICB9IGVsc2Uge1xuICAgIHJldHVybiBvYmpFcXVpdihhY3R1YWwsIGV4cGVjdGVkKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc0FyZ3VtZW50cyhvYmplY3QpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmplY3QpID09ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xufVxuXG5mdW5jdGlvbiBvYmpFcXVpdihhLCBiKSB7XG4gIGlmICh1dGlsLmlzTnVsbE9yVW5kZWZpbmVkKGEpIHx8IHV0aWwuaXNOdWxsT3JVbmRlZmluZWQoYikpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvLyBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuXG4gIGlmIChhLnByb3RvdHlwZSAhPT0gYi5wcm90b3R5cGUpIHJldHVybiBmYWxzZTtcbiAgLy9+fn5JJ3ZlIG1hbmFnZWQgdG8gYnJlYWsgT2JqZWN0LmtleXMgdGhyb3VnaCBzY3Jld3kgYXJndW1lbnRzIHBhc3NpbmcuXG4gIC8vICAgQ29udmVydGluZyB0byBhcnJheSBzb2x2ZXMgdGhlIHByb2JsZW0uXG4gIGlmIChpc0FyZ3VtZW50cyhhKSkge1xuICAgIGlmICghaXNBcmd1bWVudHMoYikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgYSA9IHBTbGljZS5jYWxsKGEpO1xuICAgIGIgPSBwU2xpY2UuY2FsbChiKTtcbiAgICByZXR1cm4gX2RlZXBFcXVhbChhLCBiKTtcbiAgfVxuICB0cnkge1xuICAgIHZhciBrYSA9IG9iamVjdEtleXMoYSksXG4gICAgICAgIGtiID0gb2JqZWN0S2V5cyhiKSxcbiAgICAgICAga2V5LCBpO1xuICB9IGNhdGNoIChlKSB7Ly9oYXBwZW5zIHdoZW4gb25lIGlzIGEgc3RyaW5nIGxpdGVyYWwgYW5kIHRoZSBvdGhlciBpc24ndFxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvLyBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGtleXMgaW5jb3Jwb3JhdGVzXG4gIC8vIGhhc093blByb3BlcnR5KVxuICBpZiAoa2EubGVuZ3RoICE9IGtiLmxlbmd0aClcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vdGhlIHNhbWUgc2V0IG9mIGtleXMgKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksXG4gIGthLnNvcnQoKTtcbiAga2Iuc29ydCgpO1xuICAvL35+fmNoZWFwIGtleSB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgaWYgKGthW2ldICE9IGtiW2ldKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5IGNvcnJlc3BvbmRpbmcga2V5LCBhbmRcbiAgLy9+fn5wb3NzaWJseSBleHBlbnNpdmUgZGVlcCB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAga2V5ID0ga2FbaV07XG4gICAgaWYgKCFfZGVlcEVxdWFsKGFba2V5XSwgYltrZXldKSkgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vLyA4LiBUaGUgbm9uLWVxdWl2YWxlbmNlIGFzc2VydGlvbiB0ZXN0cyBmb3IgYW55IGRlZXAgaW5lcXVhbGl0eS5cbi8vIGFzc2VydC5ub3REZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90RGVlcEVxdWFsID0gZnVuY3Rpb24gbm90RGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdub3REZWVwRXF1YWwnLCBhc3NlcnQubm90RGVlcEVxdWFsKTtcbiAgfVxufTtcblxuLy8gOS4gVGhlIHN0cmljdCBlcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgc3RyaWN0IGVxdWFsaXR5LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbi8vIGFzc2VydC5zdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5zdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIHN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCAhPT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICc9PT0nLCBhc3NlcnQuc3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG4vLyAxMC4gVGhlIHN0cmljdCBub24tZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIGZvciBzdHJpY3QgaW5lcXVhbGl0eSwgYXNcbi8vIGRldGVybWluZWQgYnkgIT09LiAgYXNzZXJ0Lm5vdFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdFN0cmljdEVxdWFsID0gZnVuY3Rpb24gbm90U3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJyE9PScsIGFzc2VydC5ub3RTdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgaWYgKCFhY3R1YWwgfHwgIWV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChleHBlY3RlZCkgPT0gJ1tvYmplY3QgUmVnRXhwXScpIHtcbiAgICByZXR1cm4gZXhwZWN0ZWQudGVzdChhY3R1YWwpO1xuICB9IGVsc2UgaWYgKGFjdHVhbCBpbnN0YW5jZW9mIGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSBpZiAoZXhwZWN0ZWQuY2FsbCh7fSwgYWN0dWFsKSA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBfdGhyb3dzKHNob3VsZFRocm93LCBibG9jaywgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgdmFyIGFjdHVhbDtcblxuICBpZiAodXRpbC5pc1N0cmluZyhleHBlY3RlZCkpIHtcbiAgICBtZXNzYWdlID0gZXhwZWN0ZWQ7XG4gICAgZXhwZWN0ZWQgPSBudWxsO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBibG9jaygpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgYWN0dWFsID0gZTtcbiAgfVxuXG4gIG1lc3NhZ2UgPSAoZXhwZWN0ZWQgJiYgZXhwZWN0ZWQubmFtZSA/ICcgKCcgKyBleHBlY3RlZC5uYW1lICsgJykuJyA6ICcuJykgK1xuICAgICAgICAgICAgKG1lc3NhZ2UgPyAnICcgKyBtZXNzYWdlIDogJy4nKTtcblxuICBpZiAoc2hvdWxkVGhyb3cgJiYgIWFjdHVhbCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgJ01pc3NpbmcgZXhwZWN0ZWQgZXhjZXB0aW9uJyArIG1lc3NhZ2UpO1xuICB9XG5cbiAgaWYgKCFzaG91bGRUaHJvdyAmJiBleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgJ0dvdCB1bndhbnRlZCBleGNlcHRpb24nICsgbWVzc2FnZSk7XG4gIH1cblxuICBpZiAoKHNob3VsZFRocm93ICYmIGFjdHVhbCAmJiBleHBlY3RlZCAmJlxuICAgICAgIWV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpKSB8fCAoIXNob3VsZFRocm93ICYmIGFjdHVhbCkpIHtcbiAgICB0aHJvdyBhY3R1YWw7XG4gIH1cbn1cblxuLy8gMTEuIEV4cGVjdGVkIHRvIHRocm93IGFuIGVycm9yOlxuLy8gYXNzZXJ0LnRocm93cyhibG9jaywgRXJyb3Jfb3B0LCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC50aHJvd3MgPSBmdW5jdGlvbihibG9jaywgLypvcHRpb25hbCovZXJyb3IsIC8qb3B0aW9uYWwqL21lc3NhZ2UpIHtcbiAgX3Rocm93cy5hcHBseSh0aGlzLCBbdHJ1ZV0uY29uY2F0KHBTbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbn07XG5cbi8vIEVYVEVOU0lPTiEgVGhpcyBpcyBhbm5veWluZyB0byB3cml0ZSBvdXRzaWRlIHRoaXMgbW9kdWxlLlxuYXNzZXJ0LmRvZXNOb3RUaHJvdyA9IGZ1bmN0aW9uKGJsb2NrLCAvKm9wdGlvbmFsKi9tZXNzYWdlKSB7XG4gIF90aHJvd3MuYXBwbHkodGhpcywgW2ZhbHNlXS5jb25jYXQocFNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xufTtcblxuYXNzZXJ0LmlmRXJyb3IgPSBmdW5jdGlvbihlcnIpIHsgaWYgKGVycikge3Rocm93IGVycjt9fTtcblxudmFyIG9iamVjdEtleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gIHZhciBrZXlzID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICBpZiAoaGFzT3duLmNhbGwob2JqLCBrZXkpKSBrZXlzLnB1c2goa2V5KTtcbiAgfVxuICByZXR1cm4ga2V5cztcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQnVmZmVyKGFyZykge1xuICByZXR1cm4gYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnXG4gICAgJiYgdHlwZW9mIGFyZy5jb3B5ID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5maWxsID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5yZWFkVUludDggPT09ICdmdW5jdGlvbic7XG59IiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCl7XG4vLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiMVlpWjVTXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gIH1cbn1cbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbnByb2Nlc3MubmV4dFRpY2sgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBjYW5TZXRJbW1lZGlhdGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5zZXRJbW1lZGlhdGU7XG4gICAgdmFyIGNhblBvc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5wb3N0TWVzc2FnZSAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lclxuICAgIDtcblxuICAgIGlmIChjYW5TZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiB3aW5kb3cuc2V0SW1tZWRpYXRlKGYpIH07XG4gICAgfVxuXG4gICAgaWYgKGNhblBvc3QpIHtcbiAgICAgICAgdmFyIHF1ZXVlID0gW107XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gZXYuc291cmNlO1xuICAgICAgICAgICAgaWYgKChzb3VyY2UgPT09IHdpbmRvdyB8fCBzb3VyY2UgPT09IG51bGwpICYmIGV2LmRhdGEgPT09ICdwcm9jZXNzLXRpY2snKSB7XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoJ3Byb2Nlc3MtdGljaycsICcqJyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG59KSgpO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn1cblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuIiwidmFyIFZlY3RvciA9IHJlcXVpcmUoJy4vdmVjdG9yLmpzJyk7XG5cbi8qKiBcbiAqIDR4NCBtYXRyaXguXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gTWF0cml4KCl7XG4gICAgZm9yICh2YXIgaT0wOyBpPDE2OyBpKyspe1xuICAgICAgICB0aGlzW2ldID0gMDtcbiAgICB9XG4gICAgdGhpcy5sZW5ndGggPSAxNjtcbn1cbi8qKlxuICogQ29tcGFyZSBtYXRyaWNlcyBmb3IgZXF1YWxpdHkuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge01hdHJpeH0gbWF0cml4XG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5NYXRyaXgucHJvdG90eXBlLmVxdWFsID0gZnVuY3Rpb24obWF0cml4KXtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5sZW5ndGg7IGkgPCBsZW47IGkrKyl7XG4gICAgICAgIGlmICh0aGlzW2ldICE9PSBtYXRyaXhbaV0pe1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufTtcbi8qKlxuICogQWRkIG1hdHJpY2VzLiBSZXR1cm5zIGEgbmV3IE1hdHJpeC5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7TWF0cml4fSBtYXRyaXhcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbihtYXRyaXgpe1xuICAgIHZhciBuZXdfbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgbmV3X21hdHJpeFtpXSA9IHRoaXNbaV0gKyBtYXRyaXhbaV07XG4gICAgfVxuICAgIHJldHVybiBuZXdfbWF0cml4O1xufTtcbi8qKlxuICogQWRkIG1hdHJpY2VzLiBSZXN1bHQgaXMgYXNzaWduZWQgdG8gcmVzdWx0IHBhcmFtZXRlci5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7TWF0cml4fSBtYXRyaXhcbiAqIEBwYXJhbSB7TWF0cml4fSByZXN1bHRcbiAqL1xuTWF0cml4LnByb3RvdHlwZS5hZGRMRyA9IGZ1bmN0aW9uKG1hdHJpeCwgcmVzdWx0KXtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5sZW5ndGg7IGkgPCBsZW47IGkrKyl7XG4gICAgICAgIHJlc3VsdFtpXSA9IHRoaXNbaV0gKyBtYXRyaXhbaV07XG4gICAgfVxufTtcbi8qKlxuICogU3VidHJhY3QgbWF0cmljZXMuIFJldHVybnMgYSBuZXcgTWF0cml4LlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtNYXRyaXh9IG1hdHJpeFxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgucHJvdG90eXBlLnN1YnRyYWN0ID0gZnVuY3Rpb24obWF0cml4KXtcbiAgICB2YXIgbmV3X21hdHJpeCA9IG5ldyBNYXRyaXgoKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5sZW5ndGg7IGkgPCBsZW47IGkrKyl7XG4gICAgICAgIG5ld19tYXRyaXhbaV0gPSB0aGlzW2ldIC0gbWF0cml4W2ldO1xuICAgIH1cbiAgICByZXR1cm4gbmV3X21hdHJpeDtcbn07XG4vKipcbiAqIFN1YnRyYWN0IG1hdHJpY2VzLiBSZXN1bHQgaXMgYXNzaWduZWQgdG8gcmVzdWx0IHBhcmFtZXRlci5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7TWF0cml4fSBtYXRyaXhcbiAqIEBwYXJhbSB7TWF0cml4fSByZXN1bHRcbiAqL1xuTWF0cml4LnByb3RvdHlwZS5zdWJ0cmFjdExHID0gZnVuY3Rpb24obWF0cml4LCByZXN1bHQpe1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgcmVzdWx0W2ldID0gdGhpc1tpXSAtIG1hdHJpeFtpXTtcbiAgICB9XG59O1xuLyoqXG4gKiBNdWx0aXBseSBtYXRyaXggYnkgc2NhbGFyLiBSZXR1cm5zIGEgbmV3IE1hdHJpeC5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7bnVtYmVyfSBzY2FsYXJcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnByb3RvdHlwZS5tdWx0aXBseVNjYWxhciA9IGZ1bmN0aW9uKHNjYWxhcil7XG4gICAgdmFyIG5ld19tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xuICAgICAgICBuZXdfbWF0cml4W2ldID0gdGhpc1tpXSAqIHNjYWxhcjtcbiAgICB9XG4gICAgcmV0dXJuIG5ld19tYXRyaXg7XG59O1xuLyoqXG4gKiBNdWx0aXBseSBtYXRyaXggYnkgc2NhbGFyLiBSZXN1bHQgaXMgYXNzaWduZWQgdG8gcmVzdWx0IHBhcmFtZXRlci5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7bnVtYmVyfSBzY2FsYXJcbiAqIEBwYXJhbSB7TWF0cml4fSByZXN1bHRcbiAqL1xuTWF0cml4LnByb3RvdHlwZS5tdWx0aXBseVNjYWxhckxHID0gZnVuY3Rpb24oc2NhbGFyLCByZXN1bHQpe1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgcmVzdWx0W2ldID0gdGhpc1tpXSAqIHNjYWxhcjtcbiAgICB9XG59O1xuLyoqXG4gKiBNdWx0aXBseSBtYXRyaWNlcy4gUmV0dXJucyBhIG5ldyBNYXRyaXguXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge01hdHJpeH0gbWF0cml4XG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5wcm90b3R5cGUubXVsdGlwbHkgPSBmdW5jdGlvbihtYXRyaXgpe1xuICAgIHZhciBuZXdfbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIG5ld19tYXRyaXhbMF0gPSAodGhpc1swXSAqIG1hdHJpeFswXSkgKyAodGhpc1sxXSAqIG1hdHJpeFs0XSkgKyAodGhpc1syXSAqIG1hdHJpeFs4XSkgKyAodGhpc1szXSAqIG1hdHJpeFsxMl0pO1xuICAgIG5ld19tYXRyaXhbMV0gPSAodGhpc1swXSAqIG1hdHJpeFsxXSkgKyAodGhpc1sxXSAqIG1hdHJpeFs1XSkgKyAodGhpc1syXSAqIG1hdHJpeFs5XSkgKyAodGhpc1szXSAqIG1hdHJpeFsxM10pO1xuICAgIG5ld19tYXRyaXhbMl0gPSAodGhpc1swXSAqIG1hdHJpeFsyXSkgKyAodGhpc1sxXSAqIG1hdHJpeFs2XSkgKyAodGhpc1syXSAqIG1hdHJpeFsxMF0pICsgKHRoaXNbM10gKiBtYXRyaXhbMTRdKTtcbiAgICBuZXdfbWF0cml4WzNdID0gKHRoaXNbMF0gKiBtYXRyaXhbM10pICsgKHRoaXNbMV0gKiBtYXRyaXhbN10pICsgKHRoaXNbMl0gKiBtYXRyaXhbMTFdKSArICh0aGlzWzNdICogbWF0cml4WzE1XSk7XG4gICAgbmV3X21hdHJpeFs0XSA9ICh0aGlzWzRdICogbWF0cml4WzBdKSArICh0aGlzWzVdICogbWF0cml4WzRdKSArICh0aGlzWzZdICogbWF0cml4WzhdKSArICh0aGlzWzddICogbWF0cml4WzEyXSk7XG4gICAgbmV3X21hdHJpeFs1XSA9ICh0aGlzWzRdICogbWF0cml4WzFdKSArICh0aGlzWzVdICogbWF0cml4WzVdKSArICh0aGlzWzZdICogbWF0cml4WzldKSArICh0aGlzWzddICogbWF0cml4WzEzXSk7XG4gICAgbmV3X21hdHJpeFs2XSA9ICh0aGlzWzRdICogbWF0cml4WzJdKSArICh0aGlzWzVdICogbWF0cml4WzZdKSArICh0aGlzWzZdICogbWF0cml4WzEwXSkgKyAodGhpc1s3XSAqIG1hdHJpeFsxNF0pO1xuICAgIG5ld19tYXRyaXhbN10gPSAodGhpc1s0XSAqIG1hdHJpeFszXSkgKyAodGhpc1s1XSAqIG1hdHJpeFs3XSkgKyAodGhpc1s2XSAqIG1hdHJpeFsxMV0pICsgKHRoaXNbN10gKiBtYXRyaXhbMTVdKTtcbiAgICBuZXdfbWF0cml4WzhdID0gKHRoaXNbOF0gKiBtYXRyaXhbMF0pICsgKHRoaXNbOV0gKiBtYXRyaXhbNF0pICsgKHRoaXNbMTBdICogbWF0cml4WzhdKSArICh0aGlzWzExXSAqIG1hdHJpeFsxMl0pO1xuICAgIG5ld19tYXRyaXhbOV0gPSAodGhpc1s4XSAqIG1hdHJpeFsxXSkgKyAodGhpc1s5XSAqIG1hdHJpeFs1XSkgKyAodGhpc1sxMF0gKiBtYXRyaXhbOV0pICsgKHRoaXNbMTFdICogbWF0cml4WzEzXSk7XG4gICAgbmV3X21hdHJpeFsxMF0gPSAodGhpc1s4XSAqIG1hdHJpeFsyXSkgKyAodGhpc1s5XSAqIG1hdHJpeFs2XSkgKyAodGhpc1sxMF0gKiBtYXRyaXhbMTBdKSArICh0aGlzWzExXSAqIG1hdHJpeFsxNF0pO1xuICAgIG5ld19tYXRyaXhbMTFdID0gKHRoaXNbOF0gKiBtYXRyaXhbM10pICsgKHRoaXNbOV0gKiBtYXRyaXhbN10pICsgKHRoaXNbMTBdICogbWF0cml4WzExXSkgKyAodGhpc1sxMV0gKiBtYXRyaXhbMTVdKTtcbiAgICBuZXdfbWF0cml4WzEyXSA9ICh0aGlzWzEyXSAqIG1hdHJpeFswXSkgKyAodGhpc1sxM10gKiBtYXRyaXhbNF0pICsgKHRoaXNbMTRdICogbWF0cml4WzhdKSArICh0aGlzWzE1XSAqIG1hdHJpeFsxMl0pO1xuICAgIG5ld19tYXRyaXhbMTNdID0gKHRoaXNbMTJdICogbWF0cml4WzFdKSArICh0aGlzWzEzXSAqIG1hdHJpeFs1XSkgKyAodGhpc1sxNF0gKiBtYXRyaXhbOV0pICsgKHRoaXNbMTVdICogbWF0cml4WzEzXSk7XG4gICAgbmV3X21hdHJpeFsxNF0gPSAodGhpc1sxMl0gKiBtYXRyaXhbMl0pICsgKHRoaXNbMTNdICogbWF0cml4WzZdKSArICh0aGlzWzE0XSAqIG1hdHJpeFsxMF0pICsgKHRoaXNbMTVdICogbWF0cml4WzE0XSk7XG4gICAgbmV3X21hdHJpeFsxNV0gPSAodGhpc1sxMl0gKiBtYXRyaXhbM10pICsgKHRoaXNbMTNdICogbWF0cml4WzddKSArICh0aGlzWzE0XSAqIG1hdHJpeFsxMV0pICsgKHRoaXNbMTVdICogbWF0cml4WzE1XSk7XG4gICAgcmV0dXJuIG5ld19tYXRyaXg7XG59O1xuLyoqXG4gKiBNdWx0aXBseSBtYXRyaWNlcy4gUmVzdWx0IGlzIGFzc2lnbmVkIHRvIHJlc3VsdCBwYXJhbWV0ZXIuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge01hdHJpeH0gbWF0cml4XG4gKiBAcGFyYW0ge01hdHJpeH0gcmVzdWx0XG4gKi9cbk1hdHJpeC5wcm90b3R5cGUubXVsdGlwbHlMRyA9IGZ1bmN0aW9uKG1hdHJpeCwgcmVzdWx0KXtcbiAgICByZXN1bHRbMF0gPSAodGhpc1swXSAqIG1hdHJpeFswXSkgKyAodGhpc1sxXSAqIG1hdHJpeFs0XSkgKyAodGhpc1syXSAqIG1hdHJpeFs4XSkgKyAodGhpc1szXSAqIG1hdHJpeFsxMl0pO1xuICAgIHJlc3VsdFsxXSA9ICh0aGlzWzBdICogbWF0cml4WzFdKSArICh0aGlzWzFdICogbWF0cml4WzVdKSArICh0aGlzWzJdICogbWF0cml4WzldKSArICh0aGlzWzNdICogbWF0cml4WzEzXSk7XG4gICAgcmVzdWx0WzJdID0gKHRoaXNbMF0gKiBtYXRyaXhbMl0pICsgKHRoaXNbMV0gKiBtYXRyaXhbNl0pICsgKHRoaXNbMl0gKiBtYXRyaXhbMTBdKSArICh0aGlzWzNdICogbWF0cml4WzE0XSk7XG4gICAgcmVzdWx0WzNdID0gKHRoaXNbMF0gKiBtYXRyaXhbM10pICsgKHRoaXNbMV0gKiBtYXRyaXhbN10pICsgKHRoaXNbMl0gKiBtYXRyaXhbMTFdKSArICh0aGlzWzNdICogbWF0cml4WzE1XSk7XG4gICAgcmVzdWx0WzRdID0gKHRoaXNbNF0gKiBtYXRyaXhbMF0pICsgKHRoaXNbNV0gKiBtYXRyaXhbNF0pICsgKHRoaXNbNl0gKiBtYXRyaXhbOF0pICsgKHRoaXNbN10gKiBtYXRyaXhbMTJdKTtcbiAgICByZXN1bHRbNV0gPSAodGhpc1s0XSAqIG1hdHJpeFsxXSkgKyAodGhpc1s1XSAqIG1hdHJpeFs1XSkgKyAodGhpc1s2XSAqIG1hdHJpeFs5XSkgKyAodGhpc1s3XSAqIG1hdHJpeFsxM10pO1xuICAgIHJlc3VsdFs2XSA9ICh0aGlzWzRdICogbWF0cml4WzJdKSArICh0aGlzWzVdICogbWF0cml4WzZdKSArICh0aGlzWzZdICogbWF0cml4WzEwXSkgKyAodGhpc1s3XSAqIG1hdHJpeFsxNF0pO1xuICAgIHJlc3VsdFs3XSA9ICh0aGlzWzRdICogbWF0cml4WzNdKSArICh0aGlzWzVdICogbWF0cml4WzddKSArICh0aGlzWzZdICogbWF0cml4WzExXSkgKyAodGhpc1s3XSAqIG1hdHJpeFsxNV0pO1xuICAgIHJlc3VsdFs4XSA9ICh0aGlzWzhdICogbWF0cml4WzBdKSArICh0aGlzWzldICogbWF0cml4WzRdKSArICh0aGlzWzEwXSAqIG1hdHJpeFs4XSkgKyAodGhpc1sxMV0gKiBtYXRyaXhbMTJdKTtcbiAgICByZXN1bHRbOV0gPSAodGhpc1s4XSAqIG1hdHJpeFsxXSkgKyAodGhpc1s5XSAqIG1hdHJpeFs1XSkgKyAodGhpc1sxMF0gKiBtYXRyaXhbOV0pICsgKHRoaXNbMTFdICogbWF0cml4WzEzXSk7XG4gICAgcmVzdWx0WzEwXSA9ICh0aGlzWzhdICogbWF0cml4WzJdKSArICh0aGlzWzldICogbWF0cml4WzZdKSArICh0aGlzWzEwXSAqIG1hdHJpeFsxMF0pICsgKHRoaXNbMTFdICogbWF0cml4WzE0XSk7XG4gICAgcmVzdWx0WzExXSA9ICh0aGlzWzhdICogbWF0cml4WzNdKSArICh0aGlzWzldICogbWF0cml4WzddKSArICh0aGlzWzEwXSAqIG1hdHJpeFsxMV0pICsgKHRoaXNbMTFdICogbWF0cml4WzE1XSk7XG4gICAgcmVzdWx0WzEyXSA9ICh0aGlzWzEyXSAqIG1hdHJpeFswXSkgKyAodGhpc1sxM10gKiBtYXRyaXhbNF0pICsgKHRoaXNbMTRdICogbWF0cml4WzhdKSArICh0aGlzWzE1XSAqIG1hdHJpeFsxMl0pO1xuICAgIHJlc3VsdFsxM10gPSAodGhpc1sxMl0gKiBtYXRyaXhbMV0pICsgKHRoaXNbMTNdICogbWF0cml4WzVdKSArICh0aGlzWzE0XSAqIG1hdHJpeFs5XSkgKyAodGhpc1sxNV0gKiBtYXRyaXhbMTNdKTtcbiAgICByZXN1bHRbMTRdID0gKHRoaXNbMTJdICogbWF0cml4WzJdKSArICh0aGlzWzEzXSAqIG1hdHJpeFs2XSkgKyAodGhpc1sxNF0gKiBtYXRyaXhbMTBdKSArICh0aGlzWzE1XSAqIG1hdHJpeFsxNF0pO1xuICAgIHJlc3VsdFsxNV0gPSAodGhpc1sxMl0gKiBtYXRyaXhbM10pICsgKHRoaXNbMTNdICogbWF0cml4WzddKSArICh0aGlzWzE0XSAqIG1hdHJpeFsxMV0pICsgKHRoaXNbMTVdICogbWF0cml4WzE1XSk7XG59O1xuLyoqXG4gKiBOZWdhdGUgbWF0cml4LiBSZXR1cm5zIGEgbmV3IE1hdHJpeC5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7bnVtYmVyfSBzY2FsYXJcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnByb3RvdHlwZS5uZWdhdGUgPSBmdW5jdGlvbigpe1xuICAgIHZhciBuZXdfbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgbmV3X21hdHJpeFtpXSA9IC10aGlzW2ldO1xuICAgIH1cbiAgICByZXR1cm4gbmV3X21hdHJpeDtcbn07XG4vKipcbiAqIE5lZ2F0ZSBtYXRyaXguIFJlc3VsdCBpcyBhc3NpZ25lZCB0byByZXN1bHQgcGFyYW1ldGVyLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtudW1iZXJ9IHNjYWxhclxuICogQHBhcmFtIHtNYXRyaXh9IHJlc3VsdFxuICovXG5NYXRyaXgucHJvdG90eXBlLm5lZ2F0ZUxHID0gZnVuY3Rpb24ocmVzdWx0KXtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5sZW5ndGg7IGkgPCBsZW47IGkrKyl7XG4gICAgICAgIHJlc3VsdFtpXSA9IC10aGlzW2ldO1xuICAgIH1cbn07XG4vKipcbiAqIFRyYW5zcG9zZSBtYXRyaXguIFJldHVybnMgYSBuZXcgTWF0cml4LlxuICogQG1ldGhvZFxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgucHJvdG90eXBlLnRyYW5zcG9zZSA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIG5ld19tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgbmV3X21hdHJpeFswXSA9IHRoaXNbMF07XG4gICAgbmV3X21hdHJpeFsxXSA9IHRoaXNbNF07XG4gICAgbmV3X21hdHJpeFsyXSA9IHRoaXNbOF07XG4gICAgbmV3X21hdHJpeFszXSA9IHRoaXNbMTJdO1xuICAgIG5ld19tYXRyaXhbNF0gPSB0aGlzWzFdO1xuICAgIG5ld19tYXRyaXhbNV0gPSB0aGlzWzVdO1xuICAgIG5ld19tYXRyaXhbNl0gPSB0aGlzWzldO1xuICAgIG5ld19tYXRyaXhbN10gPSB0aGlzWzEzXTtcbiAgICBuZXdfbWF0cml4WzhdID0gdGhpc1syXTtcbiAgICBuZXdfbWF0cml4WzldID0gdGhpc1s2XTtcbiAgICBuZXdfbWF0cml4WzEwXSA9IHRoaXNbMTBdO1xuICAgIG5ld19tYXRyaXhbMTFdID0gdGhpc1sxNF07XG4gICAgbmV3X21hdHJpeFsxMl0gPSB0aGlzWzNdO1xuICAgIG5ld19tYXRyaXhbMTNdID0gdGhpc1s3XTtcbiAgICBuZXdfbWF0cml4WzE0XSA9IHRoaXNbMTFdO1xuICAgIG5ld19tYXRyaXhbMTVdID0gdGhpc1sxNV07XG4gICAgcmV0dXJuIG5ld19tYXRyaXg7XG59O1xuLyoqXG4gKiBUcmFuc3Bvc2UgbWF0cml4LiBSZXN1bHQgaXMgYXNzaWduZWQgdG8gcmVzdWx0IHBhcmFtZXRlci5cbiAqIEBtZXRob2RcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnByb3RvdHlwZS50cmFuc3Bvc2VMRyA9IGZ1bmN0aW9uKHJlc3VsdCl7XG4gICAgcmVzdWx0WzBdID0gdGhpc1swXTtcbiAgICByZXN1bHRbMV0gPSB0aGlzWzRdO1xuICAgIHJlc3VsdFsyXSA9IHRoaXNbOF07XG4gICAgcmVzdWx0WzNdID0gdGhpc1sxMl07XG4gICAgcmVzdWx0WzRdID0gdGhpc1sxXTtcbiAgICByZXN1bHRbNV0gPSB0aGlzWzVdO1xuICAgIHJlc3VsdFs2XSA9IHRoaXNbOV07XG4gICAgcmVzdWx0WzddID0gdGhpc1sxM107XG4gICAgcmVzdWx0WzhdID0gdGhpc1syXTtcbiAgICByZXN1bHRbOV0gPSB0aGlzWzZdO1xuICAgIHJlc3VsdFsxMF0gPSB0aGlzWzEwXTtcbiAgICByZXN1bHRbMTFdID0gdGhpc1sxNF07XG4gICAgcmVzdWx0WzEyXSA9IHRoaXNbM107XG4gICAgcmVzdWx0WzEzXSA9IHRoaXNbN107XG4gICAgcmVzdWx0WzE0XSA9IHRoaXNbMTFdO1xuICAgIHJlc3VsdFsxNV0gPSB0aGlzWzE1XTtcbn07XG4vKipcbiAqIFdyaXRlIHplcm9zIHRvIGFsbCBlbGVtZW50cyBvZiB0aGUgbWF0cml4LlxuICogQG1ldGhvZFxuICovXG5NYXRyaXgucHJvdG90eXBlLmVtcHR5ID0gZnVuY3Rpb24oKXtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5sZW5ndGg7IGkgPCBsZW47IGkrKyl7XG4gICAgICAgIHRoaXNbaV0gPSAwO1xuICAgIH1cbn07XG4vKipcbiAqIENvcHkgbWF0cml4IHZhbHVlcyB0byBhbm90aGVyIG1hdHJpeC5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSByZXN1bHRcbiAqXG4gKi9cbk1hdHJpeC5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTY7IGkrKykge1xuICAgICAgICByZXN1bHRbaV0gPSB0aGlzW2ldO1xuICAgIH1cbn07XG5cblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgcm90YXRpb24gbWF0cml4LCByb3RhdGluZyBieSB0aGV0YSBhcm91bmQgdGhlIHgtYXhpcy4gUmV0dXJucyBhIG5ldyBNYXRyaXguXG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge251bWJlcn0gdGhldGFcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnJvdGF0aW9uWCA9IGZ1bmN0aW9uKHRoZXRhKXtcbiAgICB2YXIgcm90YXRpb25fbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIHZhciBjb3MgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIHNpbiA9IE1hdGguc2luKHRoZXRhKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbMF0gPSAxO1xuICAgIHJvdGF0aW9uX21hdHJpeFs1XSA9IGNvcztcbiAgICByb3RhdGlvbl9tYXRyaXhbNl0gPSAtc2luO1xuICAgIHJvdGF0aW9uX21hdHJpeFs5XSA9IHNpbjtcbiAgICByb3RhdGlvbl9tYXRyaXhbMTBdID0gY29zO1xuICAgIHJvdGF0aW9uX21hdHJpeFsxNV0gPSAxO1xuICAgIHJldHVybiByb3RhdGlvbl9tYXRyaXg7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgcm90YXRpb24gbWF0cml4LCByb3RhdGluZyBieSB0aGV0YSBhcm91bmQgdGhlIHgtYXhpcy4gUmVzdWx0IGlzIGFzc2lnbmVkIHRvIHJlc3VsdCBwYXJhbWV0ZXIuXG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge251bWJlcn0gdGhldGFcbiAqIEBwYXJhbSB7TWF0cml4fSByZXN1bHRcbiAqL1xuTWF0cml4LnJvdGF0aW9uWExHID0gZnVuY3Rpb24odGhldGEsIHJlc3VsdCl7XG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgc2luID0gTWF0aC5zaW4odGhldGEpO1xuICAgIHJlc3VsdC5lbXB0eSgpO1xuICAgIHJlc3VsdFswXSA9IDE7XG4gICAgcmVzdWx0WzVdID0gY29zO1xuICAgIHJlc3VsdFs2XSA9IC1zaW47XG4gICAgcmVzdWx0WzldID0gc2luO1xuICAgIHJlc3VsdFsxMF0gPSBjb3M7XG4gICAgcmVzdWx0WzE1XSA9IDE7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgcm90YXRpb24gbWF0cml4LCByb3RhdGluZyBieSB0aGV0YSBhcm91bmQgdGhlIHktYXhpcy4gUmV0dXJucyBhIG5ldyBNYXRyaXguXG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge251bWJlcn0gdGhldGFcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnJvdGF0aW9uWSA9IGZ1bmN0aW9uKHRoZXRhKXtcbiAgICB2YXIgcm90YXRpb25fbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIHZhciBjb3MgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIHNpbiA9IE1hdGguc2luKHRoZXRhKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbMF0gPSBjb3M7XG4gICAgcm90YXRpb25fbWF0cml4WzJdID0gc2luO1xuICAgIHJvdGF0aW9uX21hdHJpeFs1XSA9IDE7XG4gICAgcm90YXRpb25fbWF0cml4WzhdID0gLXNpbjtcbiAgICByb3RhdGlvbl9tYXRyaXhbMTBdID0gY29zO1xuICAgIHJvdGF0aW9uX21hdHJpeFsxNV0gPSAxO1xuICAgIHJldHVybiByb3RhdGlvbl9tYXRyaXg7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgcm90YXRpb24gbWF0cml4LCByb3RhdGluZyBieSB0aGV0YSBhcm91bmQgdGhlIHktYXhpcy4gUmVzdWx0IGlzIGFzc2lnbmVkIHRvIHJlc3VsdCBwYXJhbWV0ZXIuXG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge251bWJlcn0gdGhldGFcbiAqIEBwYXJhbSB7TWF0cml4fSByZXN1bHRcbiAqL1xuTWF0cml4LnJvdGF0aW9uWUxHID0gZnVuY3Rpb24odGhldGEsIHJlc3VsdCl7XG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgc2luID0gTWF0aC5zaW4odGhldGEpO1xuICAgIHJlc3VsdC5lbXB0eSgpO1xuICAgIHJlc3VsdFswXSA9IGNvcztcbiAgICByZXN1bHRbMl0gPSBzaW47XG4gICAgcmVzdWx0WzVdID0gMTtcbiAgICByZXN1bHRbOF0gPSAtc2luO1xuICAgIHJlc3VsdFsxMF0gPSBjb3M7XG4gICAgcmVzdWx0WzE1XSA9IDE7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgcm90YXRpb24gbWF0cml4LCByb3RhdGluZyBieSB0aGV0YSBhcm91bmQgdGhlIHotYXhpcy4gUmV0dXJucyBhIG5ldyBNYXRyaXguXG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge251bWJlcn0gdGhldGFcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnJvdGF0aW9uWiA9IGZ1bmN0aW9uKHRoZXRhKXtcbiAgICB2YXIgcm90YXRpb25fbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIHZhciBjb3MgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIHNpbiA9IE1hdGguc2luKHRoZXRhKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbMF0gPSBjb3M7XG4gICAgcm90YXRpb25fbWF0cml4WzFdID0gLXNpbjtcbiAgICByb3RhdGlvbl9tYXRyaXhbNF0gPSBzaW47XG4gICAgcm90YXRpb25fbWF0cml4WzVdID0gY29zO1xuICAgIHJvdGF0aW9uX21hdHJpeFsxMF0gPSAxO1xuICAgIHJvdGF0aW9uX21hdHJpeFsxNV0gPSAxO1xuICAgIHJldHVybiByb3RhdGlvbl9tYXRyaXg7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgcm90YXRpb24gbWF0cml4LCByb3RhdGluZyBieSB0aGV0YSBhcm91bmQgdGhlIHotYXhpcy4gUmVzdWx0IGlzIGFzc2lnbmVkIHRvIHJlc3VsdCBwYXJhbWV0ZXIuXG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge251bWJlcn0gdGhldGFcbiAqIEBwYXJhbSB7TWF0cml4fSByZXN1bHRcbiAqL1xuTWF0cml4LnJvdGF0aW9uWkxHID0gZnVuY3Rpb24odGhldGEsIHJlc3VsdCl7XG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgc2luID0gTWF0aC5zaW4odGhldGEpO1xuICAgIHJlc3VsdC5lbXB0eSgpO1xuICAgIHJlc3VsdFswXSA9IGNvcztcbiAgICByZXN1bHRbMV0gPSAtc2luO1xuICAgIHJlc3VsdFs0XSA9IHNpbjtcbiAgICByZXN1bHRbNV0gPSBjb3M7XG4gICAgcmVzdWx0WzEwXSA9IDE7XG4gICAgcmVzdWx0WzE1XSA9IDE7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgcm90YXRpb24gbWF0cml4LCByb3RhdGluZyBieSB0aGV0YSBhcm91bmQgdGhlIGF4aXMuIFJldHVybnMgYSBuZXcgTWF0cml4LlxuICogQG1ldGhvZFxuICogQHN0YXRpY1xuICogQHBhcmFtIHtWZWN0b3J9IGF4aXNcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YVxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgucm90YXRpb25BeGlzID0gZnVuY3Rpb24oYXhpcywgdGhldGEpe1xuICAgIHZhciByb3RhdGlvbl9tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgdmFyIHUgPSBheGlzLm5vcm1hbGl6ZSgpO1xuICAgIHZhciBzaW4gPSBNYXRoLnNpbih0aGV0YSk7XG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgY29zMSA9IDEtY29zO1xuICAgIHZhciB1eCA9IHUueDtcbiAgICB2YXIgdXkgPSB1Lnk7XG4gICAgdmFyIHV6ID0gdS56O1xuICAgIHZhciB4eSA9IHV4ICogdXk7XG4gICAgdmFyIHh6ID0gdXggKiB1ejtcbiAgICB2YXIgeXogPSB1eSAqIHV6O1xuICAgIHJvdGF0aW9uX21hdHJpeFswXSA9IGNvcyArICgodXgqdXgpKmNvczEpO1xuICAgIHJvdGF0aW9uX21hdHJpeFsxXSA9ICh4eSpjb3MxKSAtICh1eipzaW4pO1xuICAgIHJvdGF0aW9uX21hdHJpeFsyXSA9ICh4eipjb3MxKSsodXkqc2luKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbNF0gPSAoeHkqY29zMSkrKHV6KnNpbik7XG4gICAgcm90YXRpb25fbWF0cml4WzVdID0gY29zKygodXkqdXkpKmNvczEpO1xuICAgIHJvdGF0aW9uX21hdHJpeFs2XSA9ICh5eipjb3MxKS0odXgqc2luKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbOF0gPSAoeHoqY29zMSktKHV5KnNpbik7XG4gICAgcm90YXRpb25fbWF0cml4WzldID0gKHl6KmNvczEpKyh1eCpzaW4pO1xuICAgIHJvdGF0aW9uX21hdHJpeFsxMF0gPSBjb3MgKyAoKHV6KnV6KSpjb3MxKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbMTVdID0gMTtcbiAgICByZXR1cm4gcm90YXRpb25fbWF0cml4O1xufTtcbi8qKlxuICogQ29uc3RydWN0cyBhIHJvdGF0aW9uIG1hdHJpeCwgcm90YXRpbmcgYnkgdGhldGEgYXJvdW5kIHRoZSBheGlzLiBSZXN1bHQgaXMgYXNzaWduZWQgdG8gcmVzdWx0IHBhcmFtZXRlci5cbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7VmVjdG9yfSBheGlzXG4gKiBAcGFyYW0ge251bWJlcn0gdGhldGFcbiAqIEBwYXJhbSB7TWF0cml4fSByZXN1bHRcbiAqL1xuTWF0cml4LnJvdGF0aW9uQXhpc0xHID0gZnVuY3Rpb24oYXhpcywgdGhldGEsIHJlc3VsdCl7XG4gICAgYXhpcy5ub3JtYWxpemVMRyh0ZW1wX3ZlY3Rvcik7XG4gICAgdmFyIHNpbiA9IE1hdGguc2luKHRoZXRhKTtcbiAgICB2YXIgY29zID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciBjb3MxID0gMS1jb3M7XG4gICAgdmFyIHV4ID0gdGVtcF92ZWN0b3IueDtcbiAgICB2YXIgdXkgPSB0ZW1wX3ZlY3Rvci55O1xuICAgIHZhciB1eiA9IHRlbXBfdmVjdG9yLno7XG4gICAgdmFyIHh5ID0gdXggKiB1eTtcbiAgICB2YXIgeHogPSB1eCAqIHV6O1xuICAgIHZhciB5eiA9IHV5ICogdXo7XG4gICAgcmVzdWx0LmVtcHR5KCk7XG4gICAgcmVzdWx0WzBdID0gY29zICsgKCh1eCp1eCkqY29zMSk7XG4gICAgcmVzdWx0WzFdID0gKHh5KmNvczEpIC0gKHV6KnNpbik7XG4gICAgcmVzdWx0WzJdID0gKHh6KmNvczEpKyh1eSpzaW4pO1xuICAgIHJlc3VsdFs0XSA9ICh4eSpjb3MxKSsodXoqc2luKTtcbiAgICByZXN1bHRbNV0gPSBjb3MrKCh1eSp1eSkqY29zMSk7XG4gICAgcmVzdWx0WzZdID0gKHl6KmNvczEpLSh1eCpzaW4pO1xuICAgIHJlc3VsdFs4XSA9ICh4eipjb3MxKS0odXkqc2luKTtcbiAgICByZXN1bHRbOV0gPSAoeXoqY29zMSkrKHV4KnNpbik7XG4gICAgcmVzdWx0WzEwXSA9IGNvcyArICgodXoqdXopKmNvczEpO1xuICAgIHJlc3VsdFsxNV0gPSAxO1xufTtcbi8qKlxuICogQ29uc3RydWN0cyBhIHJvdGF0aW9uIG1hdHJpeCBmcm9tIHBpdGNoLCB5YXcsIGFuZCByb2xsLiBSZXR1cm5zIGEgbmV3IE1hdHJpeC5cbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7bnVtYmVyfSBwaXRjaFxuICogQHBhcmFtIHtudW1iZXJ9IHlhd1xuICogQHBhcmFtIHtudW1iZXJ9IHJvbGxcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnJvdGF0aW9uID0gZnVuY3Rpb24ocGl0Y2gsIHlhdywgcm9sbCl7XG4gICAgcmV0dXJuIE1hdHJpeC5yb3RhdGlvblgocm9sbCkubXVsdGlwbHkoTWF0cml4LnJvdGF0aW9uWih5YXcpKS5tdWx0aXBseShNYXRyaXgucm90YXRpb25ZKHBpdGNoKSk7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgcm90YXRpb24gbWF0cml4IGZyb20gcGl0Y2gsIHlhdywgYW5kIHJvbGwuIFJlc3VsdCBpcyBhc3NpZ25lZCB0byByZXN1bHQgcGFyYW1ldGVyLlxuICogQG1ldGhvZFxuICogQHN0YXRpY1xuICogQHBhcmFtIHtudW1iZXJ9IHBpdGNoXG4gKiBAcGFyYW0ge251bWJlcn0geWF3XG4gKiBAcGFyYW0ge251bWJlcn0gcm9sbFxuICogQHBhcmFtIHtNYXRyaXh9IHJlc3VsdFxuICovXG5NYXRyaXgucm90YXRpb25MRyA9IGZ1bmN0aW9uKHBpdGNoLCB5YXcsIHJvbGwsIHJlc3VsdCl7XG4gICAgLy8gVE9ETzogQ2FuIEkgZ2V0IGF3YXkgd2l0aCB1c2luZyBmZXdlciB0ZW1wb3JhcnkgbWF0cmljZXM/XG4gICAgdGVtcF9tYXRyaXgxLmVtcHR5KCk7XG4gICAgdGVtcF9tYXRyaXgyLmVtcHR5KCk7XG4gICAgdGVtcF9tYXRyaXgzLmVtcHR5KCk7XG4gICAgdGVtcF9tYXRyaXg0LmVtcHR5KCk7XG4gICAgcmVzdWx0LmVtcHR5KCk7ICAgIFxuICAgIE1hdHJpeC5yb3RhdGlvblhMRyhyb2xsLCB0ZW1wX21hdHJpeDEpO1xuICAgIE1hdHJpeC5yb3RhdGlvblpMRyh5YXcsIHRlbXBfbWF0cml4Mik7XG4gICAgTWF0cml4LnJvdGF0aW9uWUxHKHBpdGNoLCB0ZW1wX21hdHJpeDMpO1xuICAgIHRlbXBfbWF0cml4MS5tdWx0aXBseUxHKHRlbXBfbWF0cml4MiwgdGVtcF9tYXRyaXg0KTtcbiAgICB0ZW1wX21hdHJpeDQubXVsdGlwbHlMRyh0ZW1wX21hdHJpeDMsIHJlc3VsdCk7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgdHJhbnNsYXRpb24gbWF0cml4IGZyb20geCwgeSwgYW5kIHogZGlzdGFuY2VzLiBSZXR1cm5zIGEgbmV3IE1hdHJpeC5cbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7bnVtYmVyfSB4dHJhbnNcbiAqIEBwYXJhbSB7bnVtYmVyfSB5dHJhbnNcbiAqIEBwYXJhbSB7bnVtYmVyfSB6dHJhbnNcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnRyYW5zbGF0aW9uID0gZnVuY3Rpb24oeHRyYW5zLCB5dHJhbnMsIHp0cmFucyl7XG4gICAgdmFyIHRyYW5zbGF0aW9uX21hdHJpeCA9IE1hdHJpeC5pZGVudGl0eSgpO1xuICAgIHRyYW5zbGF0aW9uX21hdHJpeFsxMl0gPSB4dHJhbnM7XG4gICAgdHJhbnNsYXRpb25fbWF0cml4WzEzXSA9IHl0cmFucztcbiAgICB0cmFuc2xhdGlvbl9tYXRyaXhbMTRdID0genRyYW5zO1xuICAgIHJldHVybiB0cmFuc2xhdGlvbl9tYXRyaXg7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgdHJhbnNsYXRpb24gbWF0cml4IGZyb20geCwgeSwgYW5kIHogZGlzdGFuY2VzLiBSZXN1bHQgaXMgYXNzaWduZWQgdG8gcmVzdWx0IHBhcmFtZXRlci5cbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7bnVtYmVyfSB4dHJhbnNcbiAqIEBwYXJhbSB7bnVtYmVyfSB5dHJhbnNcbiAqIEBwYXJhbSB7bnVtYmVyfSB6dHJhbnNcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnRyYW5zbGF0aW9uTEcgPSBmdW5jdGlvbih4dHJhbnMsIHl0cmFucywgenRyYW5zLCByZXN1bHQpe1xuICAgIE1hdHJpeC5pZGVudGl0eUxHKHJlc3VsdCk7XG4gICAgcmVzdWx0WzEyXSA9IHh0cmFucztcbiAgICByZXN1bHRbMTNdID0geXRyYW5zO1xuICAgIHJlc3VsdFsxNF0gPSB6dHJhbnM7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgc2NhbGluZyBtYXRyaXggZnJvbSB4LCB5LCBhbmQgeiBzY2FsZS4gUmV0dXJucyBhIG5ldyBNYXRyaXguXG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge251bWJlcn0geHRyYW5zXG4gKiBAcGFyYW0ge251bWJlcn0geXRyYW5zXG4gKiBAcGFyYW0ge251bWJlcn0genRyYW5zXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5zY2FsZSA9IGZ1bmN0aW9uKHhzY2FsZSwgeXNjYWxlLCB6c2NhbGUpe1xuICAgIHZhciBzY2FsaW5nX21hdHJpeCA9IG5ldyBNYXRyaXgoKTtcbiAgICBzY2FsaW5nX21hdHJpeFswXSA9IHhzY2FsZTtcbiAgICBzY2FsaW5nX21hdHJpeFs1XSA9IHlzY2FsZTtcbiAgICBzY2FsaW5nX21hdHJpeFsxMF0gPSB6c2NhbGU7XG4gICAgc2NhbGluZ19tYXRyaXhbMTVdID0gMTtcbiAgICByZXR1cm4gc2NhbGluZ19tYXRyaXg7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgc2NhbGluZyBtYXRyaXggZnJvbSB4LCB5LCBhbmQgeiBzY2FsZS4gUmVzdWx0IGlzIGFzc2lnbmVkIHRvIHJlc3VsdCBwYXJhbWV0ZXIuXG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge251bWJlcn0geHRyYW5zXG4gKiBAcGFyYW0ge251bWJlcn0geXRyYW5zXG4gKiBAcGFyYW0ge251bWJlcn0genRyYW5zXG4gKiBAcGFyYW0ge01hdHJpeH0gcmVzdWx0XG4gKi9cbk1hdHJpeC5zY2FsZUxHID0gZnVuY3Rpb24oeHNjYWxlLCB5c2NhbGUsIHpzY2FsZSwgcmVzdWx0KXtcbiAgICBNYXRyaXguemVyb0xHKHJlc3VsdCk7XG4gICAgcmVzdWx0WzBdID0geHNjYWxlO1xuICAgIHJlc3VsdFs1XSA9IHlzY2FsZTtcbiAgICByZXN1bHRbMTBdID0genNjYWxlO1xuICAgIHJlc3VsdFsxNV0gPSAxO1xufTtcbi8qKlxuICogQ29uc3RydWN0cyBhbiBpZGVudGl0eSBtYXRyaXguIFJldHVybnMgYSBuZXcgTWF0cml4LlxuICogQG1ldGhvZFxuICogQHN0YXRpY1xuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXguaWRlbnRpdHkgPSBmdW5jdGlvbigpe1xuICAgIHZhciBpZGVudGl0eSA9IG5ldyBNYXRyaXgoKTtcbiAgICBpZGVudGl0eVswXSA9IDE7XG4gICAgaWRlbnRpdHlbNV0gPSAxO1xuICAgIGlkZW50aXR5WzEwXSA9IDE7XG4gICAgaWRlbnRpdHlbMTVdID0gMTtcbiAgICByZXR1cm4gaWRlbnRpdHk7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGFuIGlkZW50aXR5IG1hdHJpeC4gUmVzdWx0IGlzIGFzc2lnbmVkIHRvIHJlc3VsdCBwYXJhbWV0ZXIuXG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge01hdHJpeH0gcmVzdWx0XG4gKi9cbk1hdHJpeC5pZGVudGl0eUxHID0gZnVuY3Rpb24ocmVzdWx0KXtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IDE2OyBpKyspe1xuICAgICAgIHJlc3VsdFtpXSA9IDA7IFxuICAgIH1cbiAgICByZXN1bHRbMF0gPSAxO1xuICAgIHJlc3VsdFs1XSA9IDE7XG4gICAgcmVzdWx0WzEwXSA9IDE7XG4gICAgcmVzdWx0WzE1XSA9IDE7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgemVybyBtYXRyaXguIFJldHVybnMgYSBuZXcgTWF0cml4LlxuICogQG1ldGhvZFxuICogQHN0YXRpY1xuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXguemVybyA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIG5ldyBNYXRyaXgoKTtcbn07XG4vKipcbiAqIENvbnN0cnVjdHMgYSB6ZXJvIG1hdHJpeC4gUmVzdWx0IGlzIGFzc2lnbmVkIHRvIHJlc3VsdCBwYXJhbWV0ZXIuXG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC56ZXJvTEcgPSBmdW5jdGlvbihyZXN1bHQpe1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTY7IGkrKyl7XG4gICAgICAgcmVzdWx0W2ldID0gMDsgXG4gICAgfVxufTtcbi8qKlxuICogQ29uc3RydWN0cyBhIG5ldyBtYXRyaXggZnJvbSBhbiBhcnJheS4gUmV0dXJucyBhIG5ldyBNYXRyaXguXG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5mcm9tQXJyYXkgPSBmdW5jdGlvbihhcnIpe1xuICAgIHZhciBuZXdfbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTY7IGkrKyl7XG4gICAgICAgIG5ld19tYXRyaXhbaV0gPSBhcnJbaV07XG4gICAgfVxuICAgIHJldHVybiBuZXdfbWF0cml4O1xufTtcbi8qKlxuICogQ29uc3RydWN0cyBhIG5ldyBtYXRyaXggZnJvbSBhbiBhcnJheS4gUmVzdWx0IGlzIGFzc2lnbmVkIHRvIHJlc3VsdCBwYXJhbWV0ZXIuXG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge01hdHJpeH0gcmVzdWx0XG4gKi9cbk1hdHJpeC5mcm9tQXJyYXlMRyA9IGZ1bmN0aW9uKGFyciwgcmVzdWx0KXtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IDE2OyBpKyspe1xuICAgICAgICByZXN1bHRbaV0gPSBhcnJbaV07XG4gICAgfVxufTtcbi8qKlxuICogQ29weSB2YWx1ZXMgZnJvbSBvbmUgbWF0cml4IHRvIGFub3RoZXIuXG4gKiBAcGFyYW0gbWF0cml4MVxuICogQHBhcmFtIG1hdHJpeDJcbiAqL1xuTWF0cml4LmNvcHkgPSBmdW5jdGlvbihtYXRyaXgxLCBtYXRyaXgyKXtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IDE2OyBpKyspIHtcbiAgICAgICAgbWF0cml4MltpXSA9IG1hdHJpeDFbaV07XG4gICAgfVxufTtcblxudmFyIHRlbXBfbWF0cml4MSA9IG5ldyBNYXRyaXgoKTtcbnZhciB0ZW1wX21hdHJpeDIgPSBuZXcgTWF0cml4KCk7XG52YXIgdGVtcF9tYXRyaXgzID0gbmV3IE1hdHJpeCgpO1xudmFyIHRlbXBfbWF0cml4NCA9IG5ldyBNYXRyaXgoKTtcbnZhciB0ZW1wX3ZlY3RvciA9IG5ldyBWZWN0b3IoMCwwLDApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1hdHJpeDtcbiIsIi8qKlxuICogM0QgdmVjdG9yLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge251bWJlcn0geCB4IGNvb3JkaW5hdGVcbiAqIEBwYXJhbSB7bnVtYmVyfSB5IHkgY29vcmRpbmF0ZVxuICogQHBhcmFtIHtudW1iZXJ9IHogeiBjb29yZGluYXRlXG4gKi9cbmZ1bmN0aW9uIFZlY3Rvcih4LCB5LCB6KXtcbiAgICBpZiAodHlwZW9mIHggPT09ICd1bmRlZmluZWQnIHx8XG4gICAgICAgIHR5cGVvZiB5ID09PSAndW5kZWZpbmVkJyB8fFxuICAgICAgICB0eXBlb2YgeiA9PT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luc3VmZmljaWVudCBhcmd1bWVudHMuJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy54ID0geDtcbiAgICAgICAgdGhpcy55ID0geTtcbiAgICAgICAgdGhpcy56ID0gejtcbiAgICB9XG59XG4vKipcbiAqIEFkZCB2ZWN0b3JzLiBSZXR1cm5zIGEgbmV3IFZlY3Rvci5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3JcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbih2ZWN0b3Ipe1xuICAgIHJldHVybiBuZXcgVmVjdG9yKHRoaXMueCArIHZlY3Rvci54LCB0aGlzLnkgKyB2ZWN0b3IueSwgdGhpcy56ICsgdmVjdG9yLnopO1xufTtcbi8qKlxuICogQWRkIHZlY3RvcnMuIFJlc3VsdCBpcyBhc3NpZ25lZCB0byByZXN1bHQgcGFyYW1ldGVyLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvclxuICogQHBhcmFtIHtWZWN0b3J9IHJlc3VsdFxuICovXG5WZWN0b3IucHJvdG90eXBlLmFkZExHID0gZnVuY3Rpb24odmVjdG9yLCByZXN1bHQpe1xuICAgIHJlc3VsdC54ID0gdGhpcy54ICsgdmVjdG9yLng7XG4gICAgcmVzdWx0LnkgPSB0aGlzLnkgKyB2ZWN0b3IueTtcbiAgICByZXN1bHQueiA9IHRoaXMueiArIHZlY3Rvci56O1xufTtcbi8qKlxuICogU3VidHJhY3QgdmVjdG9ycy4gUmV0dXJucyBhIG5ldyBWZWN0b3IuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtWZWN0b3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUuc3VidHJhY3QgPSBmdW5jdGlvbih2ZWN0b3Ipe1xuICAgIHJldHVybiBuZXcgVmVjdG9yKHRoaXMueCAtIHZlY3Rvci54LCB0aGlzLnkgLSB2ZWN0b3IueSwgdGhpcy56IC0gdmVjdG9yLnopO1xufTtcbi8qKlxuICogU3VidHJhY3QgdmVjdG9ycy4gUmVzdWx0IGlzIGFzc2lnbmVkIHRvIHJlc3VsdCBwYXJhbWV0ZXIuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gcmVzdWx0XG4gKi9cblZlY3Rvci5wcm90b3R5cGUuc3VidHJhY3RMRyA9IGZ1bmN0aW9uKHZlY3RvciwgcmVzdWx0KXtcbiAgICByZXN1bHQueCA9IHRoaXMueCAtIHZlY3Rvci54O1xuICAgIHJlc3VsdC55ID0gdGhpcy55IC0gdmVjdG9yLnk7XG4gICAgcmVzdWx0LnogPSB0aGlzLnogLSB2ZWN0b3Iuejtcbn07XG4vKipcbiAqIENvbXBhcmUgdmVjdG9ycyBmb3IgZXF1YWxpdHlcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3JcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cblZlY3Rvci5wcm90b3R5cGUuZXF1YWwgPSBmdW5jdGlvbih2ZWN0b3Ipe1xuICAgIHJldHVybiB0aGlzLnggPT09IHZlY3Rvci54ICYmIHRoaXMueSA9PT0gdmVjdG9yLnkgJiYgdGhpcy56ID09PSB2ZWN0b3Iuejtcbn07XG4vKipcbiAqIENhbGN1bGF0ZSBhbmdsZSBiZXR3ZWVuIHR3byB2ZWN0b3JzLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvclxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5WZWN0b3IucHJvdG90eXBlLmFuZ2xlID0gZnVuY3Rpb24odmVjdG9yKXtcbiAgICB2YXIgYSA9IHRoaXMubm9ybWFsaXplKCk7XG4gICAgdmFyIGIgPSB2ZWN0b3Iubm9ybWFsaXplKCk7XG4gICAgdmFyIGFtYWcgPSBhLm1hZ25pdHVkZSgpO1xuICAgIHZhciBibWFnID0gYi5tYWduaXR1ZGUoKTtcbiAgICBpZiAoYW1hZyA9PT0gMCB8fCBibWFnID09PSAwKXtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIHZhciB0aGV0YSA9IGEuZG90KGIpIC8gKGFtYWcgKiBibWFnICk7XG4gICAgaWYgKHRoZXRhIDwgLTEpIHt0aGV0YSA9IC0xO31cbiAgICBpZiAodGhldGEgPiAxKSB7dGhldGEgPSAxO31cbiAgICByZXR1cm4gTWF0aC5hY29zKHRoZXRhKTtcbn07XG4vKipcbiAqIENhbGN1bGF0ZSBhbmdsZSBiZXR3ZWVuIHR3byB2ZWN0b3JzLiBMb3cgZ2FyYmFnZSAoZG9lc24ndCBjcmVhdGUgYW55IGludGVybWVkaWF0ZSBWZWN0b3JzKS5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3JcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5hbmdsZUxHID0gZnVuY3Rpb24odmVjdG9yKXtcbiAgICB0aGlzLm5vcm1hbGl6ZUxHKHRlbXBfdmVjdG9yMSk7XG4gICAgdmVjdG9yLm5vcm1hbGl6ZUxHKHRlbXBfdmVjdG9yMik7XG4gICAgdmFyIGFtYWcgPSB0ZW1wX3ZlY3RvcjEubWFnbml0dWRlKCk7XG4gICAgdmFyIGJtYWcgPSB0ZW1wX3ZlY3RvcjIubWFnbml0dWRlKCk7XG4gICAgaWYgKGFtYWcgPT09IDAgfHwgYm1hZyA9PT0gMCl7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICB2YXIgdGhldGEgPSB0ZW1wX3ZlY3RvcjEuZG90KHRlbXBfdmVjdG9yMikgLyAoYW1hZyAqIGJtYWcgKTtcbiAgICBpZiAodGhldGEgPCAtMSkge3RoZXRhID0gLTE7fVxuICAgIGlmICh0aGV0YSA+IDEpIHt0aGV0YSA9IDE7fVxuICAgIHJldHVybiBNYXRoLmFjb3ModGhldGEpO1xufTtcbi8qKlxuICogQ2FsY3VsYXRlIHRoZSBjb3NpbmUgb2YgdGhlIGFuZ2xlIGJldHdlZW4gdHdvIHZlY3RvcnMuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUuY29zQW5nbGUgPSBmdW5jdGlvbih2ZWN0b3Ipe1xuICAgIHZhciBhID0gdGhpcy5ub3JtYWxpemUoKTtcbiAgICB2YXIgYiA9IHZlY3Rvci5ub3JtYWxpemUoKTtcbiAgICB2YXIgYW1hZyA9IGEubWFnbml0dWRlKCk7XG4gICAgdmFyIGJtYWcgPSBiLm1hZ25pdHVkZSgpO1xuICAgIGlmIChhbWFnID09PSAwIHx8IGJtYWcgPT09IDApe1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgdmFyIHRoZXRhID0gYS5kb3QoYikgLyAoYW1hZyAqIGJtYWcgKTtcbiAgICBpZiAodGhldGEgPCAtMSkge3RoZXRhID0gLTE7fVxuICAgIGlmICh0aGV0YSA+IDEpIHt0aGV0YSA9IDE7fVxuICAgIHJldHVybiB0aGV0YTtcbn07XG4vKipcbiAqIENhbGN1bGF0ZSB0aGUgY29zaW5lIG9mIHRoZSBhbmdsZSBiZXR3ZWVuIHR3byB2ZWN0b3JzLiBMb3cgZ2FyYmFnZSAoZG9lc24ndCBjcmVhdGUgYW55IGludGVybWVkaWF0ZSBWZWN0b3JzKS5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3JcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5jb3NBbmdsZUxHID0gZnVuY3Rpb24odmVjdG9yKXtcbiAgICB0aGlzLm5vcm1hbGl6ZUxHKHRlbXBfdmVjdG9yMSk7XG4gICAgdmVjdG9yLm5vcm1hbGl6ZUxHKHRlbXBfdmVjdG9yMik7XG4gICAgdmFyIGFtYWcgPSB0ZW1wX3ZlY3RvcjEubWFnbml0dWRlKCk7XG4gICAgdmFyIGJtYWcgPSB0ZW1wX3ZlY3RvcjIubWFnbml0dWRlKCk7XG4gICAgaWYgKGFtYWcgPT09IDAgfHwgYm1hZyA9PT0gMCl7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICB2YXIgdGhldGEgPSB0ZW1wX3ZlY3RvcjEuZG90KHRlbXBfdmVjdG9yMikgLyAoYW1hZyAqIGJtYWcgKTtcbiAgICBpZiAodGhldGEgPCAtMSkge3RoZXRhID0gLTE7fVxuICAgIGlmICh0aGV0YSA+IDEpIHt0aGV0YSA9IDE7fVxuICAgIHJldHVybiB0aGV0YTtcbn07XG4vKipcbiAqIENhbGN1bGF0ZSBtYWduaXR1ZGUgb2YgYSB2ZWN0b3IuXG4gKiBAbWV0aG9kXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUubWFnbml0dWRlID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KCh0aGlzLnggKiB0aGlzLngpICsgKHRoaXMueSAqIHRoaXMueSkgKyAodGhpcy56ICogdGhpcy56KSk7XG59O1xuLyoqXG4gKiBDYWxjdWxhdGUgbWFnbml0dWRlIHNxdWFyZWQgb2YgYSB2ZWN0b3IuXG4gKiBAbWV0aG9kXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUubWFnbml0dWRlU3F1YXJlZCA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuICh0aGlzLnggKiB0aGlzLngpICsgKHRoaXMueSAqIHRoaXMueSkgKyAodGhpcy56ICogdGhpcy56KTtcbn07XG4vKipcbiAqIENhbGN1bGF0ZSBkb3QgcHJvZHVjdCBvZiB0d28gdmVjdG9ycy5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3JcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5kb3QgPSBmdW5jdGlvbih2ZWN0b3Ipe1xuICAgIHJldHVybiAodGhpcy54ICogdmVjdG9yLngpICsgKHRoaXMueSAqIHZlY3Rvci55KSArICh0aGlzLnogKiB2ZWN0b3Iueik7XG59O1xuLyoqXG4gKiBDYWxjdWxhdGUgY3Jvc3MgcHJvZHVjdCBvZiB0d28gdmVjdG9ycy4gUmV0dXJucyBhIG5ldyBWZWN0b3IuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtWZWN0b3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUuY3Jvc3MgPSBmdW5jdGlvbih2ZWN0b3Ipe1xuICAgIHJldHVybiBuZXcgVmVjdG9yKFxuICAgICAgICAodGhpcy55ICogdmVjdG9yLnopIC0gKHRoaXMueiAqIHZlY3Rvci55KSxcbiAgICAgICAgKHRoaXMueiAqIHZlY3Rvci54KSAtICh0aGlzLnggKiB2ZWN0b3IueiksXG4gICAgICAgICh0aGlzLnggKiB2ZWN0b3IueSkgLSAodGhpcy55ICogdmVjdG9yLngpXG4gICAgKTtcbn07XG4vKipcbiAqIENhbGN1bGF0ZSBjcm9zcyBwcm9kdWN0IG9mIHR3byB2ZWN0b3JzLiBSZXN1bHQgaXMgYXNzaWduZWQgdG8gcmVzdWx0IHBhcmFtZXRlci5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3JcbiAqIEBwYXJhbSB7VmVjdG9yfSByZXN1bHRcbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5jcm9zc0xHID0gZnVuY3Rpb24odmVjdG9yLCByZXN1bHQpe1xuICAgIHJlc3VsdC54ID0gKHRoaXMueSAqIHZlY3Rvci56KSAtICh0aGlzLnogKiB2ZWN0b3IueSk7XG4gICAgcmVzdWx0LnkgPSAodGhpcy56ICogdmVjdG9yLngpIC0gKHRoaXMueCAqIHZlY3Rvci56KTtcbiAgICByZXN1bHQueiA9ICh0aGlzLnggKiB2ZWN0b3IueSkgLSAodGhpcy55ICogdmVjdG9yLngpO1xufTtcbi8qKlxuICogTm9ybWFsaXplIHZlY3Rvci4gUmV0dXJucyBhIG5ldyBWZWN0b3IuXG4gKiBAbWV0aG9kXG4gKiBAcmV0dXJuIHtWZWN0b3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUubm9ybWFsaXplID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgbWFnbml0dWRlID0gdGhpcy5tYWduaXR1ZGUoKTtcbiAgICBpZiAobWFnbml0dWRlID09PSAwKSB7XG4gICAgICAgIHJldHVybiBuZXcgVmVjdG9yKHRoaXMueCwgdGhpcy55LCB0aGlzLnopO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFZlY3Rvcih0aGlzLnggLyBtYWduaXR1ZGUsIHRoaXMueSAvIG1hZ25pdHVkZSwgdGhpcy56IC8gbWFnbml0dWRlKTtcbn07XG4vKipcbiAqIE5vcm1hbGl6ZSB2ZWN0b3IuIFJlc3VsdCBpcyBhc3NpZ25lZCB0byByZXN1bHQgcGFyYW1ldGVyLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtWZWN0b3J9IHJlc3VsdFxuICovXG5WZWN0b3IucHJvdG90eXBlLm5vcm1hbGl6ZUxHID0gZnVuY3Rpb24ocmVzdWx0KXtcbiAgICB2YXIgbWFnbml0dWRlID0gdGhpcy5tYWduaXR1ZGUoKTtcbiAgICBpZiAobWFnbml0dWRlID09PSAwKSB7XG4gICAgICAgIHJlc3VsdC54ID0gdGhpcy54O1xuICAgICAgICByZXN1bHQueSA9IHRoaXMueTtcbiAgICAgICAgcmVzdWx0LnogPSB0aGlzLno7XG4gICAgfVxuICAgIHJlc3VsdC54ID0gdGhpcy54IC8gbWFnbml0dWRlO1xuICAgIHJlc3VsdC55ID0gdGhpcy55IC8gbWFnbml0dWRlO1xuICAgIHJlc3VsdC56ID0gdGhpcy56IC8gbWFnbml0dWRlO1xufTtcbi8qKlxuICogU2NhbGUgdmVjdG9yIGJ5IHNjYWxpbmcgZmFjdG9yLiBSZXR1cm5zIGEgbmV3IFZlY3Rvci5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7bnVtYmVyfSBzY2FsZVxuICogQHJldHVybiB7VmVjdG9yfVxuICovXG5WZWN0b3IucHJvdG90eXBlLnNjYWxlID0gZnVuY3Rpb24oc2NhbGUpe1xuICAgIHJldHVybiBuZXcgVmVjdG9yKHRoaXMueCAqIHNjYWxlLCB0aGlzLnkgKiBzY2FsZSwgdGhpcy56ICogc2NhbGUpO1xufTtcbi8qKlxuICogU2NhbGUgdmVjdG9yIGJ5IHNjYWxpbmcgZmFjdG9yLiBSZXN1bHQgaXMgYXNzaWduZWQgdG8gcmVzdWx0IHBhcmFtZXRlci5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7bnVtYmVyfSBzY2FsZVxuICogQHBhcmFtIHtWZWN0b3J9IHJlc3VsdFxuICovXG5WZWN0b3IucHJvdG90eXBlLnNjYWxlTEcgPSBmdW5jdGlvbihzY2FsZSwgcmVzdWx0KXtcbiAgICByZXN1bHQueCA9IHRoaXMueCAqIHNjYWxlO1xuICAgIHJlc3VsdC55ID0gdGhpcy55ICogc2NhbGU7XG4gICAgcmVzdWx0LnogPSB0aGlzLnogKiBzY2FsZTtcbn07XG4vKipcbiAqIE5lZ2F0ZSB2ZWN0b3IuIFJldHVybnMgYSBuZXcgVmVjdG9yLlxuICogQG1ldGhvZFxuICogQHJldHVybiB7VmVjdG9yfVxuICovXG5WZWN0b3IucHJvdG90eXBlLm5lZ2F0ZSA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoLXRoaXMueCwgLXRoaXMueSwgLXRoaXMueik7XG59O1xuLyoqXG4gKiBOZWdhdGUgdmVjdG9yLiBSZXN1bHQgaXMgYXNzaWduZWQgdG8gcmVzdWx0IHBhcmFtZXRlci5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSByZXN1bHRcbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5uZWdhdGVMRyA9IGZ1bmN0aW9uKHJlc3VsdCl7XG4gICAgcmVzdWx0LnggPSAtdGhpcy54O1xuICAgIHJlc3VsdC55ID0gLXRoaXMueTtcbiAgICByZXN1bHQueiA9IC10aGlzLno7XG59O1xuLyoqXG4gKiBDYWxjdWxhdGUgdmVjdG9yIHByb2plY3Rpb24gb2YgdHdvIHZlY3RvcnMuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUudmVjdG9yUHJvamVjdGlvbiA9IGZ1bmN0aW9uKHZlY3Rvcil7XG4gICAgdmFyIG1hZyA9IHZlY3Rvci5tYWduaXR1ZGUoKTtcbiAgICByZXR1cm4gdmVjdG9yLnNjYWxlKHRoaXMuZG90KHZlY3RvcikgLyAobWFnICogbWFnKSk7XG59O1xuLyoqXG4gKiBDYWxjdWxhdGUgdmVjdG9yIHByb2plY3Rpb24gb2YgdHdvIHZlY3RvcnMuIERvZXMgbm90IGNvbnN0cnVjdCBhbnkgbmV3IFZlY3RvcnMgaW4gdGhlIGNvdXJzZSBvZiBpdHMgb3BlcmF0aW9uLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvclxuICogQHBhcmFtIHtWZWN0b3J9IHRlbXAgQSB0ZW1wb3JhcnkgdmVjdG9yIHVzZWQgaW4gb25lIG9mIHRoZSBpbnRlcm1lZGlhcnkgc3RlcHMgb2YgdGhlIGNhbGN1bGF0aW9uLlxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5WZWN0b3IucHJvdG90eXBlLnZlY3RvclByb2plY3Rpb25MRyA9IGZ1bmN0aW9uKHZlY3RvciwgcmVzdWx0KXtcbiAgICB2YXIgbWFnID0gdmVjdG9yLm1hZ25pdHVkZSgpO1xuICAgIHZlY3Rvci5zY2FsZUxHKHRoaXMuZG90KHZlY3RvcikgLyAobWFnICogbWFnKSwgcmVzdWx0KTtcbn07XG4vKipcbiAqIENhbGN1bGF0ZSBzY2FsYXIgcHJvamVjdGlvbiBvZiB0d28gdmVjdG9ycy5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3JcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5zY2FsYXJQcm9qZWN0aW9uID0gZnVuY3Rpb24odmVjdG9yKXtcbiAgICByZXR1cm4gdGhpcy5kb3QodmVjdG9yKSAvIHZlY3Rvci5tYWduaXR1ZGUoKTtcbn07XG4vKipcbiAqIFBlcmZvcm0gbGluZWFyIHRyYW5mb3JtYXRpb24gb24gYSB2ZWN0b3IuIFJldHVybnMgYSBuZXcgVmVjdG9yLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtNYXRyaXh9IHRyYW5zZm9ybV9tYXRyaXhcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS50cmFuc2Zvcm0gPSBmdW5jdGlvbih0cmFuc2Zvcm1fbWF0cml4KXtcbiAgICB2YXIgeCA9ICh0aGlzLnggKiB0cmFuc2Zvcm1fbWF0cml4WzBdKSArICh0aGlzLnkgKiB0cmFuc2Zvcm1fbWF0cml4WzRdKSArICh0aGlzLnogKiB0cmFuc2Zvcm1fbWF0cml4WzhdKSArIHRyYW5zZm9ybV9tYXRyaXhbMTJdO1xuICAgIHZhciB5ID0gKHRoaXMueCAqIHRyYW5zZm9ybV9tYXRyaXhbMV0pICsgKHRoaXMueSAqIHRyYW5zZm9ybV9tYXRyaXhbNV0pICsgKHRoaXMueiAqIHRyYW5zZm9ybV9tYXRyaXhbOV0pICsgdHJhbnNmb3JtX21hdHJpeFsxM107XG4gICAgdmFyIHogPSAodGhpcy54ICogdHJhbnNmb3JtX21hdHJpeFsyXSkgKyAodGhpcy55ICogdHJhbnNmb3JtX21hdHJpeFs2XSkgKyAodGhpcy56ICogdHJhbnNmb3JtX21hdHJpeFsxMF0pICsgdHJhbnNmb3JtX21hdHJpeFsxNF07XG4gICAgdmFyIHcgPSAodGhpcy54ICogdHJhbnNmb3JtX21hdHJpeFszXSkgKyAodGhpcy55ICogdHJhbnNmb3JtX21hdHJpeFs3XSkgKyAodGhpcy56ICogdHJhbnNmb3JtX21hdHJpeFsxMV0pICsgdHJhbnNmb3JtX21hdHJpeFsxNV07XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoeCAvIHcsIHkgLyB3LCB6IC8gdyk7XG59O1xuLyoqXG4gKiBQZXJmb3JtIGxpbmVhciB0cmFuZm9ybWF0aW9uIG9uIGEgdmVjdG9yLiAgUmVzdWx0IGlzIGFzc2lnbmVkIHRvIHJlc3VsdCBwYXJhbWV0ZXIuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge01hdHJpeH0gdHJhbnNmb3JtX21hdHJpeFxuICogQHBhcmFtIHtWZWN0b3J9IHJlc3VsdFxuICovXG5WZWN0b3IucHJvdG90eXBlLnRyYW5zZm9ybUxHID0gZnVuY3Rpb24odHJhbnNmb3JtX21hdHJpeCwgcmVzdWx0KXtcbiAgICB2YXIgeCA9ICh0aGlzLnggKiB0cmFuc2Zvcm1fbWF0cml4WzBdKSArICh0aGlzLnkgKiB0cmFuc2Zvcm1fbWF0cml4WzRdKSArICh0aGlzLnogKiB0cmFuc2Zvcm1fbWF0cml4WzhdKSArIHRyYW5zZm9ybV9tYXRyaXhbMTJdO1xuICAgIHZhciB5ID0gKHRoaXMueCAqIHRyYW5zZm9ybV9tYXRyaXhbMV0pICsgKHRoaXMueSAqIHRyYW5zZm9ybV9tYXRyaXhbNV0pICsgKHRoaXMueiAqIHRyYW5zZm9ybV9tYXRyaXhbOV0pICsgdHJhbnNmb3JtX21hdHJpeFsxM107XG4gICAgdmFyIHogPSAodGhpcy54ICogdHJhbnNmb3JtX21hdHJpeFsyXSkgKyAodGhpcy55ICogdHJhbnNmb3JtX21hdHJpeFs2XSkgKyAodGhpcy56ICogdHJhbnNmb3JtX21hdHJpeFsxMF0pICsgdHJhbnNmb3JtX21hdHJpeFsxNF07XG4gICAgdmFyIHcgPSAodGhpcy54ICogdHJhbnNmb3JtX21hdHJpeFszXSkgKyAodGhpcy55ICogdHJhbnNmb3JtX21hdHJpeFs3XSkgKyAodGhpcy56ICogdHJhbnNmb3JtX21hdHJpeFsxMV0pICsgdHJhbnNmb3JtX21hdHJpeFsxNV07XG4gICAgcmVzdWx0LnggPSB4IC8gdztcbiAgICByZXN1bHQueSA9IHkgLyB3O1xuICAgIHJlc3VsdC56ID0geiAvIHc7XG59O1xuLyoqXG4gKiBSb3RhdGUgdmVjdG9yIGJ5IHRoZXRhIGFyb3VuZCBheGlzLiBSZXR1cm5zIGEgbmV3IFZlY3Rvci5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSBheGlzXG4gKiBAcGFyYW0ge251bWJlcn0gdGhldGFcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5yb3RhdGUgPSBmdW5jdGlvbihheGlzLCB0aGV0YSl7XG4gICAgdmFyIHUgPSBheGlzLm5vcm1hbGl6ZSgpO1xuICAgIHZhciBzaW4gPSBNYXRoLnNpbih0aGV0YSk7XG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgY29zMSA9IDEtY29zO1xuICAgIHZhciB1eCA9IHUueDtcbiAgICB2YXIgdXkgPSB1Lnk7XG4gICAgdmFyIHV6ID0gdS56O1xuICAgIHZhciB4eSA9IHUueCAqIHUueTtcbiAgICB2YXIgeHogPSB1LnggKiB1Lno7XG4gICAgdmFyIHl6ID0gdS55ICogdS56O1xuICAgIHZhciB4ID0gKChjb3MgKyAoKHV4KnV4KSpjb3MxKSkgKiB0aGlzLngpICsgKCgoeHkqY29zMSkgLSAodXoqc2luKSkgKiB0aGlzLnkpICsgKCgoeHoqY29zMSkrKHV5KnNpbikpICogdGhpcy56KTtcbiAgICB2YXIgeSA9ICgoKHh5KmNvczEpKyh1eipzaW4pKSAqIHRoaXMueCkgKyAoKGNvcysoKHV5KnV5KSpjb3MxKSkgKiB0aGlzLnkpICsgKCgoeXoqY29zMSktKHV4KnNpbikpICogdGhpcy56KTtcbiAgICB2YXIgeiA9ICgoKHh6KmNvczEpLSh1eSpzaW4pKSAqIHRoaXMueCkgKyAoKCh5eipjb3MxKSsodXgqc2luKSkgKiB0aGlzLnkpICsgKChjb3MgKyAoKHV4KnV4KSpjb3MxKSkgKiB0aGlzLnopO1xuICAgIHJldHVybiBuZXcgVmVjdG9yKHgsIHksIHopO1xufTtcbi8qKlxuICogUm90YXRlIHZlY3RvciBieSB0aGV0YSBhcm91bmQgYXhpcy4gUmVzdWx0IGlzIGFzc2lnbmVkIHRvIHJlc3VsdCBwYXJhbWV0ZXIuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gYXhpc1xuICogQHBhcmFtIHtudW1iZXJ9IHRoZXRhXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gcmVzdWx0XG4gKi9cblZlY3Rvci5wcm90b3R5cGUucm90YXRlTEcgPSBmdW5jdGlvbihheGlzLCB0aGV0YSwgcmVzdWx0KXtcbiAgICBheGlzLm5vcm1hbGl6ZUxHKHJlc3VsdCk7XG4gICAgdmFyIHNpbiA9IE1hdGguc2luKHRoZXRhKTtcbiAgICB2YXIgY29zID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciBjb3MxID0gMS1jb3M7XG4gICAgdmFyIHV4ID0gcmVzdWx0Lng7XG4gICAgdmFyIHV5ID0gcmVzdWx0Lnk7XG4gICAgdmFyIHV6ID0gcmVzdWx0Lno7XG4gICAgdmFyIHh5ID0gcmVzdWx0LnggKiByZXN1bHQueTtcbiAgICB2YXIgeHogPSByZXN1bHQueCAqIHJlc3VsdC56O1xuICAgIHZhciB5eiA9IHJlc3VsdC55ICogcmVzdWx0Lno7XG4gICAgdmFyIHggPSAoKGNvcyArICgodXgqdXgpKmNvczEpKSAqIHRoaXMueCkgKyAoKCh4eSpjb3MxKSAtICh1eipzaW4pKSAqIHRoaXMueSkgKyAoKCh4eipjb3MxKSsodXkqc2luKSkgKiB0aGlzLnopO1xuICAgIHZhciB5ID0gKCgoeHkqY29zMSkrKHV6KnNpbikpICogdGhpcy54KSArICgoY29zKygodXkqdXkpKmNvczEpKSAqIHRoaXMueSkgKyAoKCh5eipjb3MxKS0odXgqc2luKSkgKiB0aGlzLnopO1xuICAgIHZhciB6ID0gKCgoeHoqY29zMSktKHV5KnNpbikpICogdGhpcy54KSArICgoKHl6KmNvczEpKyh1eCpzaW4pKSAqIHRoaXMueSkgKyAoKGNvcyArICgodXgqdXgpKmNvczEpKSAqIHRoaXMueik7XG4gICAgcmVzdWx0LnggPSB4O1xuICAgIHJlc3VsdC55ID0geTtcbiAgICByZXN1bHQueiA9IHo7XG59O1xuLyoqXG4gKiBSb3RhdGUgdmVjdG9yIGJ5IHRoZXRhIGFyb3VuZCB4LWF4aXMuIFJldHVybnMgYSBuZXcgVmVjdG9yLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtudW1iZXJ9IHRoZXRhXG4gKiBAcmV0dXJuIHtWZWN0b3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUucm90YXRlWCA9IGZ1bmN0aW9uKHRoZXRhKXtcbiAgICB2YXIgc2luID0gTWF0aC5zaW4odGhldGEpO1xuICAgIHZhciBjb3MgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIHggPSB0aGlzLng7XG4gICAgdmFyIHkgPSAoY29zICogdGhpcy55KSAtIChzaW4gKiB0aGlzLnopO1xuICAgIHZhciB6ID0gKHNpbiAqIHRoaXMueSkgKyAoY29zICogdGhpcy56KTtcbiAgICByZXR1cm4gbmV3IFZlY3Rvcih4LCB5LCB6KTtcbn07XG4vKipcbiAqIFJvdGF0ZSB2ZWN0b3IgYnkgdGhldGEgYXJvdW5kIHgtYXhpcy4gUmVzdWx0IGlzIGFzc2lnbmVkIHRvIHJlc3VsdCBwYXJhbWV0ZXIuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge251bWJlcn0gdGhldGFcbiAqIEBwYXJhbSB7VmVjdG9yfSByZXN1bHRcbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5yb3RhdGVYTEcgPSBmdW5jdGlvbih0aGV0YSwgcmVzdWx0KXtcbiAgICB2YXIgc2luID0gTWF0aC5zaW4odGhldGEpO1xuICAgIHZhciBjb3MgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIHggPSB0aGlzLng7XG4gICAgdmFyIHkgPSAoY29zICogdGhpcy55KSAtIChzaW4gKiB0aGlzLnopO1xuICAgIHZhciB6ID0gKHNpbiAqIHRoaXMueSkgKyAoY29zICogdGhpcy56KTtcbiAgICByZXN1bHQueCA9IHg7XG4gICAgcmVzdWx0LnkgPSB5O1xuICAgIHJlc3VsdC56ID0gejtcbn07XG4vKipcbiAqIFJvdGF0ZSB2ZWN0b3IgYnkgdGhldGEgYXJvdW5kIHktYXhpcy4gUmV0dXJucyBhIG5ldyBWZWN0b3IuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge251bWJlcn0gdGhldGFcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5yb3RhdGVZID0gZnVuY3Rpb24odGhldGEpe1xuICAgIHZhciBzaW4gPSBNYXRoLnNpbih0aGV0YSk7XG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgeCA9IChjb3MgKnRoaXMueCkgKyAoc2luICogdGhpcy56KTtcbiAgICB2YXIgeSA9IHRoaXMueTtcbiAgICB2YXIgeiA9IC0oc2luICogdGhpcy54KSArIChjb3MgKiB0aGlzLnopO1xuICAgIHJldHVybiBuZXcgVmVjdG9yKHgsIHksIHopO1xufTtcbi8qKlxuICogUm90YXRlIHZlY3RvciBieSB0aGV0YSBhcm91bmQgeS1heGlzLiBSZXN1bHQgaXMgYXNzaWduZWQgdG8gcmVzdWx0IHBhcmFtZXRlci5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YVxuICogQHBhcmFtIHtWZWN0b3J9IHJlc3VsdFxuICovXG5WZWN0b3IucHJvdG90eXBlLnJvdGF0ZVlMRyA9IGZ1bmN0aW9uKHRoZXRhLCByZXN1bHQpe1xuICAgIHZhciBzaW4gPSBNYXRoLnNpbih0aGV0YSk7XG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgeCA9IChjb3MgKnRoaXMueCkgKyAoc2luICogdGhpcy56KTtcbiAgICB2YXIgeSA9IHRoaXMueTtcbiAgICB2YXIgeiA9IC0oc2luICogdGhpcy54KSArIChjb3MgKiB0aGlzLnopO1xuICAgIHJlc3VsdC54ID0geDtcbiAgICByZXN1bHQueSA9IHk7XG4gICAgcmVzdWx0LnogPSB6O1xufTtcbi8qKlxuICogUm90YXRlIHZlY3RvciBieSB0aGV0YSBhcm91bmQgei1heGlzLiBSZXR1cm5zIGEgbmV3IFZlY3Rvci5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YVxuICogQHJldHVybiB7VmVjdG9yfVxuICovXG5WZWN0b3IucHJvdG90eXBlLnJvdGF0ZVogPSBmdW5jdGlvbih0aGV0YSl7XG4gICAgdmFyIHNpbiA9IE1hdGguc2luKHRoZXRhKTtcbiAgICB2YXIgY29zID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciB4ID0gKGNvcyAqIHRoaXMueCkgLSAoc2luICogdGhpcy55KTtcbiAgICB2YXIgeSA9IChzaW4gKiB0aGlzLngpICsgKGNvcyAqIHRoaXMueSk7XG4gICAgdmFyIHogPSB0aGlzLno7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoeCwgeSwgeik7XG59O1xuLyoqXG4gKiBSb3RhdGUgdmVjdG9yIGJ5IHRoZXRhIGFyb3VuZCB6LWF4aXMuIFJlc3VsdCBpcyBhc3NpZ25lZCB0byByZXN1bHQgcGFyYW1ldGVyLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtudW1iZXJ9IHRoZXRhXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gcmVzdWx0XG4gKi9cblZlY3Rvci5wcm90b3R5cGUucm90YXRlWkxHID0gZnVuY3Rpb24odGhldGEsIHJlc3VsdCl7XG4gICAgdmFyIHNpbiA9IE1hdGguc2luKHRoZXRhKTtcbiAgICB2YXIgY29zID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciB4ID0gKGNvcyAqIHRoaXMueCkgLSAoc2luICogdGhpcy55KTtcbiAgICB2YXIgeSA9IChzaW4gKiB0aGlzLngpICsgKGNvcyAqIHRoaXMueSk7XG4gICAgdmFyIHogPSB0aGlzLno7XG4gICAgcmVzdWx0LnggPSB4O1xuICAgIHJlc3VsdC55ID0geTtcbiAgICByZXN1bHQueiA9IHo7XG59O1xuLyoqXG4gKiBSb3RhdGUgdmVjdG9yIGJ5IHBpdGNoLCB5YXcsIGFuZCByb2xsLiBSZXR1cm5zIGEgbmV3IFZlY3Rvci5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7bnVtYmVyfSBwaXRjaFxuICogQHBhcmFtIHtudW1iZXJ9IHlhd1xuICogQHBhcmFtIHtudW1iZXJ9IHJvbGxcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5yb3RhdGVQaXRjaFlhd1JvbGwgPSBmdW5jdGlvbihwaXRjaF9hbW50LCB5YXdfYW1udCwgcm9sbF9hbW50KSB7XG4gICAgcmV0dXJuIHRoaXMucm90YXRlWChyb2xsX2FtbnQpLnJvdGF0ZVkocGl0Y2hfYW1udCkucm90YXRlWih5YXdfYW1udCk7XG59O1xuLyoqIFxuICogUm90YXRlIHZlY3RvciBieSBwaXRjaCwgeWF3LCBhbmQgcm9sbC4gUmVzdWx0IGlzIGFzc2lnbmVkIHRvIHJlc3VsdCBwYXJhbWV0ZXIuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge251bWJlcn0gcGl0Y2hcbiAqIEBwYXJhbSB7bnVtYmVyfSB5YXdcbiAqIEBwYXJhbSB7bnVtYmVyfSByb2xsXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdGVtcFxuICogQHBhcmFtIHtWZWN0b3J9IHJlc3VsdFxuICovXG5WZWN0b3IucHJvdG90eXBlLnJvdGF0ZVBpdGNoWWF3Um9sbExHID0gZnVuY3Rpb24ocGl0Y2hfYW1udCwgeWF3X2FtbnQsIHJvbGxfYW1udCwgcmVzdWx0KSB7XG4gICAgdGhpcy5yb3RhdGVYTEcocm9sbF9hbW50LCByZXN1bHQpO1xuICAgIHJlc3VsdC5yb3RhdGVZTEcocGl0Y2hfYW1udCwgcmVzdWx0KTtcbiAgICByZXN1bHQucm90YXRlWkxHKHlhd19hbW50LCByZXN1bHQpO1xufTtcblxudmFyIHRlbXBfdmVjdG9yMSA9IG5ldyBWZWN0b3IoMCwwLDApO1xudmFyIHRlbXBfdmVjdG9yMiA9IG5ldyBWZWN0b3IoMCwwLDApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZlY3RvcjtcbiIsInJlcXVpcmUoJy4vLi4vdGVzdHMvaGVscGVycy5qcycpO1xucmVxdWlyZSgnLi8uLi90ZXN0cy9tYXRoL21hdHJpeC5qcycpO1xucmVxdWlyZSgnLi8uLi90ZXN0cy9tYXRoL3ZlY3Rvci5qcycpO1xuIiwiZnVuY3Rpb24gbmVhcmx5RXF1YWwoYSwgYiwgZXBzKXtcbiAgICBpZiAodHlwZW9mIGVwcyA9PT0gXCJ1bmRlZmluZWRcIikge2VwcyA9IDAuMDE7fVxuICAgIHZhciBkaWZmID0gTWF0aC5hYnMoYSAtIGIpO1xuICAgIHJldHVybiAoZGlmZiA8IGVwcyk7XG59XG5cbnZhciBoZWxwZXJzID0gbmV3IE9iamVjdChudWxsKTtcblxuaGVscGVycy5uZWFybHlFcXVhbCA9IG5lYXJseUVxdWFsO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGhlbHBlcnM7IiwidmFyIE1hdHJpeCA9IHJlcXVpcmUoJy4uLy4uL3NyYy9tYXRyaXguanMnKTtcbnZhciBWZWN0b3IgPSByZXF1aXJlKCcuLi8uLi9zcmMvdmVjdG9yLmpzJyk7XG52YXIgYXNzZXJ0ID0gcmVxdWlyZShcImFzc2VydFwiKTtcblxuc3VpdGUoJ01hdHJpeCcsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIHplcm8sIHplcm8yLCB6ZXJvMywgaWRlbnRpdHksIGlkZW50aXR5MiwgaWRlbnRpdHkzLCBvbmVzLCBtMCwgbTEsIG0yLCBtMywgbTQsIG01LCBtNiwgbTcsIGFuZ2xlcztcbiAgICB2YXIgcmVzdWx0LCB0ZW1wX21hdCwgdGVtcF92ZWN0b3I7XG4gICAgc2V0dXAoZnVuY3Rpb24oKXtcbiAgICAgICAgcmVzdWx0ID0gbmV3IE1hdHJpeCgpO1xuICAgICAgICB0ZW1wX21hdCA9IG5ldyBNYXRyaXgoKTtcbiAgICAgICAgdGVtcF92ZWN0b3IgPSBuZXcgVmVjdG9yKDAsMCwwKTtcbiAgICAgICAgYW5nbGVzID0gWzAsIE1hdGguUEkgLyAyLCBNYXRoLlBJLCAzKk1hdGguUEkgLyAyLCBNYXRoLlBJIC8gMl07XG4gICAgICAgIHplcm8gPSBNYXRyaXguemVybygpO1xuICAgICAgICB6ZXJvMiA9IG5ldyBNYXRyaXgoKTtcbiAgICAgICAgemVybzMgPSBNYXRyaXguZnJvbUFycmF5KFswLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwXSk7XG4gICAgICAgIGlkZW50aXR5ID0gTWF0cml4LmlkZW50aXR5KCk7XG4gICAgICAgIGlkZW50aXR5MiA9IG5ldyBNYXRyaXgoKTtcbiAgICAgICAgaWRlbnRpdHkzID0gTWF0cml4LmZyb21BcnJheShbMSwwLDAsMCwwLDEsMCwwLDAsMCwxLDAsMCwwLDAsMV0pO1xuICAgICAgICBpZGVudGl0eTJbMF0gPSAxO1xuICAgICAgICBpZGVudGl0eTJbNV0gPSAxO1xuICAgICAgICBpZGVudGl0eTJbMTBdID0gMTtcbiAgICAgICAgaWRlbnRpdHkyWzE1XSA9IDE7XG4gICAgICAgIG9uZXMgPSBuZXcgTWF0cml4KCk7XG4gICAgICAgIG0wID0gbmV3IE1hdHJpeCgpO1xuICAgICAgICBtMSA9IG5ldyBNYXRyaXgoKTtcbiAgICAgICAgbTIgPSBuZXcgTWF0cml4KCk7XG4gICAgICAgIG0zID0gbmV3IE1hdHJpeCgpO1xuICAgICAgICBtNCA9IG5ldyBNYXRyaXgoKTtcbiAgICAgICAgbTRbMF0gPSAwO1xuICAgICAgICBtNFsxXSA9IDE7XG4gICAgICAgIG00WzJdID0gMTtcbiAgICAgICAgbTRbM10gPSAyO1xuICAgICAgICBtNFs0XSA9IDM7XG4gICAgICAgIG00WzVdID0gNTtcbiAgICAgICAgbTRbNl0gPSA4O1xuICAgICAgICBtNFs3XSA9IDEzO1xuICAgICAgICBtNFs4XSA9IDIxO1xuICAgICAgICBtNFs5XSA9IDM0O1xuICAgICAgICBtNFsxMF0gPSA1NTtcbiAgICAgICAgbTRbMTFdID0gODk7XG4gICAgICAgIG00WzEyXSA9IDE0NDtcbiAgICAgICAgbTRbMTNdID0gMjMzO1xuICAgICAgICBtNFsxNF0gPSAzNzc7XG4gICAgICAgIG00WzE1XSA9IDYxMDtcbiAgICAgICAgbTUgPSBNYXRyaXguZnJvbUFycmF5KFswLCAxLCAxLCAyLCAzLCA1LCA4LCAxMywgMjEsIDM0LCA1NSwgODksIDE0NCwgMjMzLCAzNzcsIDYxMF0pO1xuICAgICAgICBtNiA9IE1hdHJpeC5mcm9tQXJyYXkoWzEsIDIsIDMsIDQsIDUsIDYsIDcsIDgsIDEsIDIsIDMsIDQsIDUsIDYsIDcsIDhdKTtcbiAgICAgICAgbTcgPSBNYXRyaXguZnJvbUFycmF5KFszNCwgNDQsIDU0LCA2NCwgODIsIDEwOCwgMTM0LCAxNjAsIDM0LCA0NCwgNTQsIDY0LCA4MiwgMTA4LCAxMzQsIDE2MF0pO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDE2OyBpKyspe1xuICAgICAgICAgICAgb25lc1tpXSA9IDE7XG4gICAgICAgICAgICBtMFtpXSA9IGk7XG4gICAgICAgICAgICBtMVtpXSA9IGkrMTtcbiAgICAgICAgICAgIG0yW2ldID0gaSsyO1xuICAgICAgICAgICAgbTNbaV0gPSBpKjI7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBzdWl0ZSgncHJvcGVydGllcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgIHRlc3QoJ2xlbmd0aCcsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoemVyby5sZW5ndGgsIDE2KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh6ZXJvMi5sZW5ndGgsIDE2KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh6ZXJvMy5sZW5ndGgsIDE2KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChpZGVudGl0eS5sZW5ndGgsIDE2KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChpZGVudGl0eTIubGVuZ3RoLCAxNik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobTEubGVuZ3RoLCAxNik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobTIubGVuZ3RoLCAxNik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobTMubGVuZ3RoLCAxNik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobTQubGVuZ3RoLCAxNik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobTUubGVuZ3RoLCAxNik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIHN1aXRlKCdtZXRob2RzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgdGVzdCgnZXF1YWwnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKGlkZW50aXR5LmVxdWFsKGlkZW50aXR5MikpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHplcm8uZXF1YWwoemVybzIpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh6ZXJvLmVxdWFsKHplcm8zKSk7XG4gICAgICAgICAgICBhc3NlcnQub2soemVybzIuZXF1YWwoemVybzMpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayghaWRlbnRpdHkuZXF1YWwoemVybykpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG00LmVxdWFsKG01KSk7XG4gICAgICAgICAgICBhc3NlcnQub2soIW0wLmVxdWFsKG0xKSk7XG4gICAgICAgICAgICBhc3NlcnQub2soIW0wLmVxdWFsKG0yKSk7XG4gICAgICAgICAgICBhc3NlcnQub2soIW0wLmVxdWFsKG0zKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdhZGQnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHQxID0gemVyby5hZGQobTEpO1xuICAgICAgICAgICAgdmFyIHQyID0gbTAuYWRkKG9uZXMpO1xuICAgICAgICAgICAgdmFyIHQzID0gbTAuYWRkKG9uZXMpLmFkZChvbmVzKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh0MS5lcXVhbChtMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHQyLmVxdWFsKG0xKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodDMuZXF1YWwobTIpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2FkZExHJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHplcm8uYWRkTEcobTEsIHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKG0xKSk7XG4gICAgICAgICAgICBtMC5hZGRMRyhvbmVzLCByZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHJlc3VsdC5lcXVhbChtMSkpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBtMC5hZGRMRyhvbmVzLCByZXN1bHQpXG4gICAgICAgICAgICByZXN1bHQuYWRkTEcob25lcywgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwobTIpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3N1YnRyYWN0JywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0MSA9IG00LnN1YnRyYWN0KG01KTtcbiAgICAgICAgICAgIHZhciB0MiA9IG0xLnN1YnRyYWN0KG9uZXMpO1xuICAgICAgICAgICAgdmFyIHQzID0gbTIuc3VidHJhY3QobTEpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHQxLmVxdWFsKHplcm8pKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh0Mi5lcXVhbChtMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHQzLmVxdWFsKG9uZXMpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3N1YnRyYWN0TEcnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgbTQuc3VidHJhY3RMRyhtNSwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwoemVybykpO1xuICAgICAgICAgICAgbTEuc3VidHJhY3RMRyhvbmVzLCByZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHJlc3VsdC5lcXVhbChtMCkpO1xuICAgICAgICAgICAgbTIuc3VidHJhY3RMRyhtMSwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwob25lcykpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnbXVsdGlwbHlTY2FsYXInLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHQxID0gbTAubXVsdGlwbHlTY2FsYXIoMik7XG4gICAgICAgICAgICB2YXIgdDIgPSB6ZXJvLm11bHRpcGx5U2NhbGFyKDIwKTtcbiAgICAgICAgICAgIHZhciB0MyA9IG0wLm11bHRpcGx5U2NhbGFyKDEpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHQxLmVxdWFsKG0zKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodDIuZXF1YWwoemVybykpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHQzLmVxdWFsKG0wKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdtdWx0aXBseVNjYWxhckxHJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIG0wLm11bHRpcGx5U2NhbGFyTEcoMiwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwobTMpKTtcbiAgICAgICAgICAgIHplcm8ubXVsdGlwbHlTY2FsYXJMRygyMCwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwoemVybykpO1xuICAgICAgICAgICAgbTAubXVsdGlwbHlTY2FsYXJMRygxLCByZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHJlc3VsdC5lcXVhbChtMCkpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnbXVsdGlwbHknLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHQxID0gbTYubXVsdGlwbHkobTYpO1xuICAgICAgICAgICAgdmFyIHQyID0gaWRlbnRpdHkubXVsdGlwbHkoaWRlbnRpdHkpO1xuICAgICAgICAgICAgdmFyIHQzID0gaWRlbnRpdHkubXVsdGlwbHkoemVybyk7XG4gICAgICAgICAgICB2YXIgdDQgPSBpZGVudGl0eS5tdWx0aXBseShtMCk7XG4gICAgICAgICAgICB2YXIgdDUgPSB6ZXJvLm11bHRpcGx5KG0wKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh0MS5lcXVhbChtNykpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHQyLmVxdWFsKGlkZW50aXR5KSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodDMuZXF1YWwoemVybykpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHQ0LmVxdWFsKG0wKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodDUuZXF1YWwoemVybykpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnbXVsdGlwbHlMRycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBtNi5tdWx0aXBseUxHKG02LCByZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHJlc3VsdC5lcXVhbChtNykpO1xuICAgICAgICAgICAgaWRlbnRpdHkubXVsdGlwbHlMRyhpZGVudGl0eSwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwoaWRlbnRpdHkpKTtcbiAgICAgICAgICAgIGlkZW50aXR5Lm11bHRpcGx5TEcoemVybywgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwoemVybykpO1xuICAgICAgICAgICAgaWRlbnRpdHkubXVsdGlwbHlMRyhtMCwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwobTApKTtcbiAgICAgICAgICAgIHplcm8ubXVsdGlwbHlMRyhtMCwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwoemVybykpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnbmVnYXRlJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0MSA9IG0wLm5lZ2F0ZSgpO1xuICAgICAgICAgICAgdmFyIHQyID0gbTEubmVnYXRlKCk7XG4gICAgICAgICAgICB2YXIgdDMgPSBtMi5uZWdhdGUoKTtcbiAgICAgICAgICAgIHZhciB0NCA9IG0zLm5lZ2F0ZSgpO1xuICAgICAgICAgICAgdmFyIHQ1ID0gemVyby5uZWdhdGUoKTtcbiAgICAgICAgICAgIHZhciB0NiA9IG9uZXMubmVnYXRlKCk7XG5cbiAgICAgICAgICAgIGFzc2VydC5vayh6ZXJvLmVxdWFsKHQ1KSk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDE2OyBpKyspe1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0MVtpXSwgLW0wW2ldKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwodDJbaV0sIC1tMVtpXSk7XG4gICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQzW2ldLCAtbTJbaV0pO1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0NFtpXSwgLW0zW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgMTY7IGorKyl7XG4gICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQxW2pdLCAtaik7XG4gICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQ2W2pdLCAtMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCduZWdhdGVMRycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB6ZXJvLm5lZ2F0ZUxHKHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKHplcm8pKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTY7IGkrKyl7XG4gICAgICAgICAgICAgICAgbTAubmVnYXRlTEcocmVzdWx0KTtcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzdWx0W2ldLCAtbTBbaV0pO1xuICAgICAgICAgICAgICAgIG0xLm5lZ2F0ZUxHKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlc3VsdFtpXSwgLW0xW2ldKTtcbiAgICAgICAgICAgICAgICBtMi5uZWdhdGVMRyhyZXN1bHQpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXN1bHRbaV0sIC1tMltpXSk7XG4gICAgICAgICAgICAgICAgbTMubmVnYXRlTEcocmVzdWx0KTtcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzdWx0W2ldLCAtbTNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCAxNjsgaisrKXtcbiAgICAgICAgICAgICAgICBtMC5uZWdhdGVMRyhyZXN1bHQpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXN1bHRbal0sIC1qKTtcbiAgICAgICAgICAgICAgICBvbmVzLm5lZ2F0ZUxHKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlc3VsdFtqXSwgLTEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgndHJhbnNwb3NlJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0cmFuc3Bvc2VfbWFwID0ge1xuICAgICAgICAgICAgICAgIDA6MCwgMTo0LCAyOjgsIDM6MTIsIDQ6MSwgNTo1LCA2OjksIDc6MTMsXG4gICAgICAgICAgICAgICAgODoyLCA5OjYsIDEwOjEwLCAxMToxNCwgMTI6MywgMTM6NywgMTQ6MTEsIDE1OjE1XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgdDEgPSBpZGVudGl0eS50cmFuc3Bvc2UoKTtcbiAgICAgICAgICAgIHZhciB0MiA9IG9uZXMudHJhbnNwb3NlKCk7XG4gICAgICAgICAgICB2YXIgdDMgPSB6ZXJvLnRyYW5zcG9zZSgpO1xuICAgICAgICAgICAgdmFyIHQ0ID0gbTAudHJhbnNwb3NlKCk7XG4gICAgICAgICAgICB2YXIgdDUgPSBtMS50cmFuc3Bvc2UoKTtcbiAgICAgICAgICAgIHZhciB0NiA9IG0yLnRyYW5zcG9zZSgpO1xuICAgICAgICAgICAgdmFyIHQ3ID0gbTMudHJhbnNwb3NlKCk7XG5cbiAgICAgICAgICAgIGFzc2VydC5vayh0MS5lcXVhbChpZGVudGl0eSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHQyLmVxdWFsKG9uZXMpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh0My5lcXVhbCh6ZXJvKSk7XG4gICAgICAgICAgICB2YXIgdDQgPSBtMC50cmFuc3Bvc2UoKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTY7IGkrKyl7XG4gICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQ0W2ldLCBtMFt0cmFuc3Bvc2VfbWFwW2ldXSk7XG4gICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQ1W2ldLCBtMVt0cmFuc3Bvc2VfbWFwW2ldXSk7XG4gICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQ2W2ldLCBtMlt0cmFuc3Bvc2VfbWFwW2ldXSk7XG4gICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQ3W2ldLCBtM1t0cmFuc3Bvc2VfbWFwW2ldXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCd0cmFuc3Bvc2VMRycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdHJhbnNwb3NlX21hcCA9IHtcbiAgICAgICAgICAgICAgICAwOjAsIDE6NCwgMjo4LCAzOjEyLCA0OjEsIDU6NSwgNjo5LCA3OjEzLFxuICAgICAgICAgICAgICAgIDg6MiwgOTo2LCAxMDoxMCwgMTE6MTQsIDEyOjMsIDEzOjcsIDE0OjExLCAxNToxNVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZGVudGl0eS50cmFuc3Bvc2VMRyhyZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHJlc3VsdC5lcXVhbChpZGVudGl0eSkpO1xuICAgICAgICAgICAgb25lcy50cmFuc3Bvc2VMRyhyZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHJlc3VsdC5lcXVhbChvbmVzKSk7XG4gICAgICAgICAgICB6ZXJvLnRyYW5zcG9zZUxHKHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKHplcm8pKTtcbiAgICAgICAgICAgIHZhciB0NCA9IG0wLnRyYW5zcG9zZSgpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxNjsgaSsrKXtcbiAgICAgICAgICAgICAgICBtMC50cmFuc3Bvc2VMRyhyZXN1bHQpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXN1bHRbaV0sIG0wW3RyYW5zcG9zZV9tYXBbaV1dKTtcbiAgICAgICAgICAgICAgICBtMS50cmFuc3Bvc2VMRyhyZXN1bHQpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXN1bHRbaV0sIG0xW3RyYW5zcG9zZV9tYXBbaV1dKTtcbiAgICAgICAgICAgICAgICBtMi50cmFuc3Bvc2VMRyhyZXN1bHQpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXN1bHRbaV0sIG0yW3RyYW5zcG9zZV9tYXBbaV1dKTtcbiAgICAgICAgICAgICAgICBtMy50cmFuc3Bvc2VMRyhyZXN1bHQpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXN1bHRbaV0sIG0zW3RyYW5zcG9zZV9tYXBbaV1dKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2VtcHR5JywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICBtMC50cmFuc3Bvc2VMRyhyZXN1bHQpO1xuICAgICAgICAgICAgICAgIHJlc3VsdC5lbXB0eSgpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwoemVybykpO1xuICAgICAgICAgICAgICAgIG0xLnRyYW5zcG9zZUxHKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgcmVzdWx0LmVtcHR5KCk7XG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHJlc3VsdC5lcXVhbCh6ZXJvKSk7XG4gICAgICAgICAgICAgICAgbTIudHJhbnNwb3NlTEcocmVzdWx0KTtcbiAgICAgICAgICAgICAgICByZXN1bHQuZW1wdHkoKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKHplcm8pKTtcbiAgICAgICAgICAgICAgICBtMy50cmFuc3Bvc2VMRyhyZXN1bHQpO1xuICAgICAgICAgICAgICAgIHJlc3VsdC5lbXB0eSgpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwoemVybykpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnY29weScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBtMC5jb3B5KHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKG0wKSk7XG4gICAgICAgICAgICBtMS5jb3B5KHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKG0xKSk7XG4gICAgICAgICAgICBtMi5jb3B5KHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKG0yKSk7XG4gICAgICAgICAgICBtMy5jb3B5KHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKG0zKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdyb3RhdGlvblgnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgLy8gVE9ETzogQWRkIG1vcmUgdGVzdHNcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYW5nbGVzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgdGhldGEgPSBhbmdsZXNbaV07XG4gICAgICAgICAgICAgICAgdmFyIHQxID0gTWF0cml4LnJvdGF0aW9uWCh0aGV0YSk7XG4gICAgICAgICAgICAgICAgdmFyIHQyID0gTWF0cml4LmlkZW50aXR5KCk7XG4gICAgICAgICAgICAgICAgdDJbNV0gPSBNYXRoLmNvcyh0aGV0YSlcbiAgICAgICAgICAgICAgICB0Mls2XSA9IC1NYXRoLnNpbih0aGV0YSlcbiAgICAgICAgICAgICAgICB0Mls5XSA9IE1hdGguc2luKHRoZXRhKVxuICAgICAgICAgICAgICAgIHQyWzEwXSA9IE1hdGguY29zKHRoZXRhKVxuICAgICAgICAgICAgICAgIGFzc2VydC5vayh0MS5lcXVhbCh0MikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgncm90YXRpb25YTEcnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgLy8gVE9ETzogQWRkIG1vcmUgdGVzdHNcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYW5nbGVzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgdGhldGEgPSBhbmdsZXNbaV07XG4gICAgICAgICAgICAgICAgTWF0cml4LnJvdGF0aW9uWExHKHRoZXRhLCByZXN1bHQpO1xuICAgICAgICAgICAgICAgIHZhciB0MiA9IE1hdHJpeC5pZGVudGl0eSgpO1xuICAgICAgICAgICAgICAgIHQyWzVdID0gTWF0aC5jb3ModGhldGEpXG4gICAgICAgICAgICAgICAgdDJbNl0gPSAtTWF0aC5zaW4odGhldGEpXG4gICAgICAgICAgICAgICAgdDJbOV0gPSBNYXRoLnNpbih0aGV0YSlcbiAgICAgICAgICAgICAgICB0MlsxMF0gPSBNYXRoLmNvcyh0aGV0YSlcbiAgICAgICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKHQyKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdyb3RhdGlvblknLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgLy8gVE9ETzogQWRkIG1vcmUgdGVzdHNcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYW5nbGVzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgdGhldGEgPSBhbmdsZXNbaV07XG4gICAgICAgICAgICAgICAgdmFyIHQxID0gTWF0cml4LnJvdGF0aW9uWSh0aGV0YSk7XG4gICAgICAgICAgICAgICAgdmFyIHQyID0gTWF0cml4LmlkZW50aXR5KCk7XG4gICAgICAgICAgICAgICAgdDJbMF0gPSBNYXRoLmNvcyh0aGV0YSlcbiAgICAgICAgICAgICAgICB0MlsyXSA9IE1hdGguc2luKHRoZXRhKVxuICAgICAgICAgICAgICAgIHQyWzhdID0gLU1hdGguc2luKHRoZXRhKVxuICAgICAgICAgICAgICAgIHQyWzEwXSA9IE1hdGguY29zKHRoZXRhKVxuICAgICAgICAgICAgICAgIGFzc2VydC5vayh0MS5lcXVhbCh0MikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgncm90YXRpb25ZTEcnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgLy8gVE9ETzogQWRkIG1vcmUgdGVzdHNcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYW5nbGVzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgdGhldGEgPSBhbmdsZXNbaV07XG4gICAgICAgICAgICAgICAgTWF0cml4LnJvdGF0aW9uWUxHKHRoZXRhLCByZXN1bHQpO1xuICAgICAgICAgICAgICAgIHZhciB0MiA9IE1hdHJpeC5pZGVudGl0eSgpO1xuICAgICAgICAgICAgICAgIHQyWzBdID0gTWF0aC5jb3ModGhldGEpXG4gICAgICAgICAgICAgICAgdDJbMl0gPSBNYXRoLnNpbih0aGV0YSlcbiAgICAgICAgICAgICAgICB0Mls4XSA9IC1NYXRoLnNpbih0aGV0YSlcbiAgICAgICAgICAgICAgICB0MlsxMF0gPSBNYXRoLmNvcyh0aGV0YSlcbiAgICAgICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKHQyKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdyb3RhdGlvblonLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgLy8gVE9ETzogQWRkIG1vcmUgdGVzdHNcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYW5nbGVzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgdGhldGEgPSBhbmdsZXNbaV07XG4gICAgICAgICAgICAgICAgdmFyIHQxID0gTWF0cml4LnJvdGF0aW9uWih0aGV0YSk7XG4gICAgICAgICAgICAgICAgdmFyIHQyID0gTWF0cml4LmlkZW50aXR5KCk7XG4gICAgICAgICAgICAgICAgdDJbMF0gPSBNYXRoLmNvcyh0aGV0YSlcbiAgICAgICAgICAgICAgICB0MlsxXSA9IC1NYXRoLnNpbih0aGV0YSlcbiAgICAgICAgICAgICAgICB0Mls0XSA9IE1hdGguc2luKHRoZXRhKVxuICAgICAgICAgICAgICAgIHQyWzVdID0gTWF0aC5jb3ModGhldGEpXG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHQxLmVxdWFsKHQyKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdyb3RhdGlvblpMRycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAvLyBUT0RPOiBBZGQgbW9yZSB0ZXN0c1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbmdsZXMubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIHZhciB0aGV0YSA9IGFuZ2xlc1tpXTtcbiAgICAgICAgICAgICAgICBNYXRyaXgucm90YXRpb25aTEcodGhldGEsIHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgdmFyIHQyID0gTWF0cml4LmlkZW50aXR5KCk7XG4gICAgICAgICAgICAgICAgdDJbMF0gPSBNYXRoLmNvcyh0aGV0YSlcbiAgICAgICAgICAgICAgICB0MlsxXSA9IC1NYXRoLnNpbih0aGV0YSlcbiAgICAgICAgICAgICAgICB0Mls0XSA9IE1hdGguc2luKHRoZXRhKVxuICAgICAgICAgICAgICAgIHQyWzVdID0gTWF0aC5jb3ModGhldGEpXG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHJlc3VsdC5lcXVhbCh0MikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgncm90YXRpb25BeGlzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIC8vIFRPRE86IEFkZCBtdWx0aS1heGlzIHRlc3RzP1xuICAgICAgICAgICAgdmFyIHhheGlzID0gbmV3IFZlY3RvcigxLCAwLCAwKTtcbiAgICAgICAgICAgIHZhciB5YXhpcyA9IG5ldyBWZWN0b3IoMCwgMSwgMCk7XG4gICAgICAgICAgICB2YXIgemF4aXMgPSBuZXcgVmVjdG9yKDAsIDAsIDEpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbmdsZXMubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIHZhciB0aGV0YSA9IGFuZ2xlc1tpXTtcbiAgICAgICAgICAgICAgICB2YXIgdDEgPSBNYXRyaXgucm90YXRpb25BeGlzKHhheGlzLCB0aGV0YSk7XG4gICAgICAgICAgICAgICAgdmFyIHQyID0gTWF0cml4LnJvdGF0aW9uQXhpcyh5YXhpcywgdGhldGEpO1xuICAgICAgICAgICAgICAgIHZhciB0MyA9IE1hdHJpeC5yb3RhdGlvbkF4aXMoemF4aXMsIHRoZXRhKTtcbiAgICAgICAgICAgICAgICB2YXIgdDQgPSBNYXRyaXgucm90YXRpb25BeGlzKHhheGlzLCB0aGV0YSk7XG4gICAgICAgICAgICAgICAgdmFyIHQ1ID0gTWF0cml4LnJvdGF0aW9uQXhpcyh5YXhpcywgdGhldGEpO1xuICAgICAgICAgICAgICAgIHZhciB0NiA9IE1hdHJpeC5yb3RhdGlvbkF4aXMoemF4aXMsIHRoZXRhKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2sodDEuZXF1YWwoTWF0cml4LnJvdGF0aW9uWCh0aGV0YSkpKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2sodDIuZXF1YWwoTWF0cml4LnJvdGF0aW9uWSh0aGV0YSkpKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2sodDMuZXF1YWwoTWF0cml4LnJvdGF0aW9uWih0aGV0YSkpKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2sodDQuZXF1YWwoTWF0cml4LnJvdGF0aW9uWCh0aGV0YSkpKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2sodDUuZXF1YWwoTWF0cml4LnJvdGF0aW9uWSh0aGV0YSkpKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2sodDYuZXF1YWwoTWF0cml4LnJvdGF0aW9uWih0aGV0YSkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3JvdGF0aW9uQXhpc0xHJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIC8vIFRPRE86IEFkZCBtdWx0aS1heGlzIHRlc3RzP1xuICAgICAgICAgICAgdmFyIHhheGlzID0gbmV3IFZlY3RvcigxLCAwLCAwKTtcbiAgICAgICAgICAgIHZhciB5YXhpcyA9IG5ldyBWZWN0b3IoMCwgMSwgMCk7XG4gICAgICAgICAgICB2YXIgemF4aXMgPSBuZXcgVmVjdG9yKDAsIDAsIDEpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbmdsZXMubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIHZhciB0aGV0YSA9IGFuZ2xlc1tpXTtcbiAgICAgICAgICAgICAgICBNYXRyaXgucm90YXRpb25BeGlzTEcoeGF4aXMsIHRoZXRhLCByZXN1bHQpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwoTWF0cml4LnJvdGF0aW9uWCh0aGV0YSkpKTtcbiAgICAgICAgICAgICAgICBNYXRyaXgucm90YXRpb25BeGlzTEcoeWF4aXMsIHRoZXRhLCByZXN1bHQpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwoTWF0cml4LnJvdGF0aW9uWSh0aGV0YSkpKTtcbiAgICAgICAgICAgICAgICBNYXRyaXgucm90YXRpb25BeGlzTEcoemF4aXMsIHRoZXRhLCByZXN1bHQpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwoTWF0cml4LnJvdGF0aW9uWih0aGV0YSkpKTtcbiAgICAgICAgICAgICAgICBNYXRyaXgucm90YXRpb25BeGlzTEcoeGF4aXMsIHRoZXRhLCByZXN1bHQpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwoTWF0cml4LnJvdGF0aW9uWCh0aGV0YSkpKTtcbiAgICAgICAgICAgICAgICBNYXRyaXgucm90YXRpb25BeGlzTEcoeWF4aXMsIHRoZXRhLCByZXN1bHQpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwoTWF0cml4LnJvdGF0aW9uWSh0aGV0YSkpKTtcbiAgICAgICAgICAgICAgICBNYXRyaXgucm90YXRpb25BeGlzTEcoemF4aXMsIHRoZXRhLCByZXN1bHQpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwoTWF0cml4LnJvdGF0aW9uWih0aGV0YSkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3JvdGF0aW9uJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIC8vIFRPRE86IEFkZCBiZXR0ZXIgdGVzdHMsIHRoaXMgaXMgYmFzaWNhbGx5IGp1c3QgcmVjcmVhdGluZyB0aGUgbWV0aG9kXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFuZ2xlcy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIHBpdGNoID0gYW5nbGVzW2ldO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgYW5nbGVzLmxlbmd0aDsgaisrKXtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHlhdyA9IGFuZ2xlc1tqXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCBhbmdsZXMubGVuZ3RoOyBrKyspe1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJvbGwgPSBhbmdsZXNba107XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdDEgPSBNYXRyaXgucm90YXRpb24ocGl0Y2gsIHlhdywgcm9sbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdDIgPSBNYXRyaXgucm90YXRpb25YKHJvbGwpLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG11bHRpcGx5KE1hdHJpeC5yb3RhdGlvblooeWF3KSkuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbXVsdGlwbHkoTWF0cml4LnJvdGF0aW9uWShwaXRjaCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHQxLmVxdWFsKHQyKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdyb3RhdGlvbkxHJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIC8vIFRPRE86IEFkZCBiZXR0ZXIgdGVzdHMsIHRoaXMgaXMgYmFzaWNhbGx5IGp1c3QgcmVjcmVhdGluZyB0aGUgbWV0aG9kXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFuZ2xlcy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIHBpdGNoID0gYW5nbGVzW2ldO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgYW5nbGVzLmxlbmd0aDsgaisrKXtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHlhdyA9IGFuZ2xlc1tqXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCBhbmdsZXMubGVuZ3RoOyBrKyspe1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJvbGwgPSBhbmdsZXNba107XG4gICAgICAgICAgICAgICAgICAgICAgICBNYXRyaXgucm90YXRpb25MRyhwaXRjaCwgeWF3LCByb2xsLCByZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHQxID0gTWF0cml4LnJvdGF0aW9uWChyb2xsKS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtdWx0aXBseShNYXRyaXgucm90YXRpb25aKHlhdykpLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG11bHRpcGx5KE1hdHJpeC5yb3RhdGlvblkocGl0Y2gpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwodDEpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3RyYW5zbGF0aW9uJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0cmFucyA9IFsxLCAyLCAzLCA1LCAxMCwgMjAsIDMwLCA0MF07XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRyYW5zLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgeHRyYW5zID0gdHJhbnNbaV07XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0cmFucy5sZW5ndGg7IGorKyl7XG4gICAgICAgICAgICAgICAgICAgIHZhciB5dHJhbnMgPSB0cmFuc1tqXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCB0cmFucy5sZW5ndGg7IGsrKyl7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgenRyYW5zID0gdHJhbnNba107XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdDEgPSBNYXRyaXgudHJhbnNsYXRpb24oeHRyYW5zLCB5dHJhbnMsIHp0cmFucyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBtID0gMDsgbSA8IDE2OyBtKyspe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG0gPT09IDEyKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0geHRyYW5zO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobSA9PT0gMTMpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSB5dHJhbnM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtID09PSAxNCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHp0cmFucztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG0gPT09IDAgfHwgbSA9PT0gNSB8fCBtID09PSAxMCB8fCBtID09PSAxNSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0MVttXSwgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3RyYW5zbGF0aW9uTEcnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHRyYW5zID0gWzEsIDIsIDMsIDUsIDEwLCAyMCwgMzAsIDQwXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdHJhbnMubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIHZhciB4dHJhbnMgPSB0cmFuc1tpXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRyYW5zLmxlbmd0aDsgaisrKXtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHl0cmFucyA9IHRyYW5zW2pdO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IHRyYW5zLmxlbmd0aDsgaysrKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB6dHJhbnMgPSB0cmFuc1trXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0MSA9IE1hdHJpeC50cmFuc2xhdGlvbkxHKHh0cmFucywgeXRyYW5zLCB6dHJhbnMsIHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBtID0gMDsgbSA8IDE2OyBtKyspe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG0gPT09IDEyKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzID0geHRyYW5zO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobSA9PT0gMTMpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMgPSB5dHJhbnM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtID09PSAxNCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcyA9IHp0cmFucztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG0gPT09IDAgfHwgbSA9PT0gNSB8fCBtID09PSAxMCB8fCBtID09PSAxNSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMgPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcyA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXMsIHJlc3VsdFttXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdzY2FsZScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgc2NhbGUgPSBbMSwgMiwgMywgNSwgMTAsIDIwLCAzMCwgNDBdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzY2FsZS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIHhzY2FsZSA9IHNjYWxlW2ldO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgc2NhbGUubGVuZ3RoOyBqKyspe1xuICAgICAgICAgICAgICAgICAgICB2YXIgeXNjYWxlID0gc2NhbGVbal07XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgc2NhbGUubGVuZ3RoOyBrKyspe1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHpzY2FsZSA9IHNjYWxlW2tdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHQxID0gTWF0cml4LnNjYWxlKHhzY2FsZSwgeXNjYWxlLCB6c2NhbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgbSA9IDA7IG0gPCAxNjsgbSsrKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtID09PSAwKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0geHNjYWxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobSA9PT0gNSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHlzY2FsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG0gPT09IDEwKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0genNjYWxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobSA9PT0gMTUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwodDFbbV0sIHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdzY2FsZUxHJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciBzY2FsZSA9IFsxLCAyLCAzLCA1LCAxMCwgMjAsIDMwLCA0MF07XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNjYWxlLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgeHNjYWxlID0gc2NhbGVbaV07XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBzY2FsZS5sZW5ndGg7IGorKyl7XG4gICAgICAgICAgICAgICAgICAgIHZhciB5c2NhbGUgPSBzY2FsZVtqXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCBzY2FsZS5sZW5ndGg7IGsrKyl7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgenNjYWxlID0gc2NhbGVba107XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdDEgPSBNYXRyaXguc2NhbGVMRyh4c2NhbGUsIHlzY2FsZSwgenNjYWxlLCByZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgbSA9IDA7IG0gPCAxNjsgbSsrKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtID09PSAwKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzID0geHNjYWxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobSA9PT0gNSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcyA9IHlzY2FsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG0gPT09IDEwKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzID0genNjYWxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobSA9PT0gMTUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzID0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzdWx0W21dLCByZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnaWRlbnRpdHknLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKGlkZW50aXR5LmVxdWFsKGlkZW50aXR5MikpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKGlkZW50aXR5LmVxdWFsKGlkZW50aXR5MykpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxNjsgaSsrKXtcbiAgICAgICAgICAgICAgICBpZiAoaSAlIDUgPT09IDApe1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwoaWRlbnRpdHlbaV0sIDEpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChpZGVudGl0eVtpXSwgMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnaWRlbnRpdHlMRycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBNYXRyaXguaWRlbnRpdHlMRyhyZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHJlc3VsdC5lcXVhbChpZGVudGl0eTIpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwoaWRlbnRpdHkzKSk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDE2OyBpKyspe1xuICAgICAgICAgICAgICAgIGlmIChpICUgNSA9PT0gMCl7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXN1bHRbaV0sIDEpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXN1bHRbaV0sIDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3plcm8nLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHplcm8uZXF1YWwoemVybzIpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh6ZXJvLmVxdWFsKHplcm8zKSk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDE2OyBpKyspe1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbCh6ZXJvW2ldLCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3plcm8nLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgTWF0cml4Lnplcm9MRyhyZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHJlc3VsdC5lcXVhbCh6ZXJvMikpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHJlc3VsdC5lcXVhbCh6ZXJvMykpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxNjsgaSsrKXtcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzdWx0W2ldLCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2Zyb21BcnJheScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQub2sobTUuZXF1YWwobTQpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh6ZXJvLmVxdWFsKHplcm8zKSk7XG4gICAgICAgICAgICBhc3NlcnQub2soemVybzIuZXF1YWwoemVybzMpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhpZGVudGl0eS5lcXVhbChpZGVudGl0eTMpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhpZGVudGl0eTIuZXF1YWwoaWRlbnRpdHkzKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdmcm9tQXJyYXlMRycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBNYXRyaXguZnJvbUFycmF5TEcoWzAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDBdLCByZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHJlc3VsdC5lcXVhbCh6ZXJvMykpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHJlc3VsdC5lcXVhbCh6ZXJvMikpO1xuICAgICAgICAgICAgTWF0cml4LmZyb21BcnJheUxHKFsxLDAsMCwwLDAsMSwwLDAsMCwwLDEsMCwwLDAsMCwxXSwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwoaWRlbnRpdHkyKSk7XG4gICAgICAgICAgICBNYXRyaXguZnJvbUFycmF5TEcoWzAsIDEsIDEsIDIsIDMsIDUsIDgsIDEzLCAyMSwgMzQsIDU1LCA4OSwgMTQ0LCAyMzMsIDM3NywgNjEwXSwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwobTQpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ01hdHJpeC5jb3B5JywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIE1hdHJpeC5jb3B5KG0wLCByZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHJlc3VsdC5lcXVhbChtMCkpO1xuICAgICAgICAgICAgTWF0cml4LmNvcHkobTEsIHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKG0xKSk7XG4gICAgICAgICAgICBNYXRyaXguY29weShtMiwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwobTIpKTtcbiAgICAgICAgICAgIE1hdHJpeC5jb3B5KG0zLCByZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHJlc3VsdC5lcXVhbChtMykpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn0pO1xuIiwidmFyIFZlY3RvciA9IHJlcXVpcmUoJy4uLy4uL3NyYy92ZWN0b3IuanMnKTtcbnZhciBhc3NlcnQgPSByZXF1aXJlKCdhc3NlcnQnKTtcbnZhciBuZWFybHlFcXVhbCA9IHJlcXVpcmUoJy4uL2hlbHBlcnMuanMnKVsnbmVhcmx5RXF1YWwnXTtcblxuc3VpdGUoJ1ZlY3RvcicsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIG9yaWdpbiwgdmVjdG9yMSwgdmVjdG9yMiwgdmVjdG9yMywgdmVjdG9yNCwgdmVjdG9yNSwgdmVjdG9yeCwgdmVjdG9yeSwgdmVjdG9yejtcbiAgICB2YXIgdmVjdG9yMTAweCwgdmVjdG9yMjAweSwgdmVjdG9yMzAweiwgdmVjdG9yMTIzLCB2ZWN0b3IxMTI7XG4gICAgdmFyIHJlc3VsdCwgdGVtcDEsIHRlbXAyO1xuICAgIHNldHVwKGZ1bmN0aW9uKCl7XG4gICAgICAgIHJlc3VsdCA9IG5ldyBWZWN0b3IoMCwgMCwgMCk7XG4gICAgICAgIHRlbXAxID0gbmV3IFZlY3RvcigwLCAwLCAwKTtcbiAgICAgICAgdGVtcDIgPSBuZXcgVmVjdG9yKDAsIDAsIDApO1xuICAgICAgICBvcmlnaW4gPSBuZXcgVmVjdG9yKDAsIDAsIDApO1xuICAgICAgICB2ZWN0b3IxID0gbmV3IFZlY3RvcigxLCAxLCAxKTtcbiAgICAgICAgdmVjdG9yMiA9IG5ldyBWZWN0b3IoMSwgMSwgMSk7XG4gICAgICAgIHZlY3RvcjMgPSBuZXcgVmVjdG9yKDEwLCAxMCwgMTApO1xuICAgICAgICB2ZWN0b3I0ID0gbmV3IFZlY3RvcigxMSwgMTEsIDExKTtcbiAgICAgICAgdmVjdG9yNSA9IG5ldyBWZWN0b3IoLTEsIC0xLCAtMSk7XG4gICAgICAgIHZlY3RvcnggPSBuZXcgVmVjdG9yKDEsIDAsIDApO1xuICAgICAgICB2ZWN0b3J5ID0gbmV3IFZlY3RvcigwLCAxLCAwKTtcbiAgICAgICAgdmVjdG9yeiA9IG5ldyBWZWN0b3IoMCwgMCwgMSk7XG4gICAgICAgIHZlY3RvcjEwMHggPSBuZXcgVmVjdG9yKDEwMCwgMCwgMCk7XG4gICAgICAgIHZlY3RvcjIwMHkgPSBuZXcgVmVjdG9yKDAsIDIwMCwgMCk7XG4gICAgICAgIHZlY3RvcjMwMHogPSBuZXcgVmVjdG9yKDAsIDAsIDMwMCk7XG4gICAgICAgIHZlY3RvcjEyMyA9IG5ldyBWZWN0b3IoMSwgMiwgMyk7XG4gICAgICAgIHZlY3RvcjExMiA9IG5ldyBWZWN0b3IoLTEsIDEsIDIpO1xuICAgIH0pO1xuICAgIHN1aXRlKCdwcm9wZXJ0aWVzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgdGVzdCgnYXhlcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQudGhyb3dzKGZ1bmN0aW9uKCl7bmV3IFZlY3RvcigpO30sIEVycm9yKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh2ZWN0b3IxLngpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3RvcjEueSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yMS56KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgc3VpdGUoJ21ldGhvZHMnLCBmdW5jdGlvbigpe1xuICAgICAgICB0ZXN0KCdhZGQnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHQxID0gdmVjdG9yMS5hZGQodmVjdG9yMyk7XG4gICAgICAgICAgICB2YXIgdDIgPSB2ZWN0b3IxLmFkZCh2ZWN0b3I1KTtcbiAgICAgICAgICAgIGFzc2VydC5vayh0MS5lcXVhbCh2ZWN0b3I0KSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodDIuZXF1YWwob3JpZ2luKSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodDEueCwgMTEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQxLnksIDExKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0MS56LCAxMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodDIueCwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodDIueSwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodDIueiwgMCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdhZGRMRycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2ZWN0b3IxLmFkZExHKHZlY3RvcjMsIHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzdWx0LngsIDExKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXN1bHQueSwgMTEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlc3VsdC56LCAxMSk7XG4gICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKHZlY3RvcjQpKTtcbiAgICAgICAgICAgIHZlY3RvcjEuYWRkTEcodmVjdG9yNSwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwob3JpZ2luKSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzdWx0LngsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlc3VsdC55LCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXN1bHQueiwgMCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdzdWJ0cmFjdCcsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdDEgPSB2ZWN0b3I0LnN1YnRyYWN0KHZlY3RvcjEpO1xuICAgICAgICAgICAgdmFyIHQyID0gdmVjdG9yMS5zdWJ0cmFjdCh2ZWN0b3IyKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh0MS5lcXVhbCh2ZWN0b3IzKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodDIuZXF1YWwob3JpZ2luKSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodDEueCwgMTApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQxLnksIDEwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0MS56LCAxMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodDIueCwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodDIueSwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodDIueiwgMCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdzdWJ0cmFjdExHJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZlY3RvcjQuc3VidHJhY3RMRyh2ZWN0b3IxLCByZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHJlc3VsdC5lcXVhbCh2ZWN0b3IzKSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzdWx0LngsIDEwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXN1bHQueSwgMTApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlc3VsdC56LCAxMCk7XG4gICAgICAgICAgICB2ZWN0b3IxLnN1YnRyYWN0TEcodmVjdG9yMiwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwob3JpZ2luKSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzdWx0LngsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlc3VsdC55LCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXN1bHQueiwgMCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdlcXVhbCcsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yMS5lcXVhbCh2ZWN0b3IyKSwgdHJ1ZSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yMS5lcXVhbCh2ZWN0b3IzKSwgZmFsc2UpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnYW5nbGUnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHZlY3RvcnguYW5nbGUodmVjdG9yeSksIE1hdGguUEkgLyAyKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodmVjdG9yeS5hbmdsZSh2ZWN0b3J6KSwgTWF0aC5QSSAvIDIpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3J4LmFuZ2xlKHZlY3RvcnopLCBNYXRoLlBJIC8gMikpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHZlY3RvcjEuYW5nbGUodmVjdG9yMiksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3IxLmFuZ2xlKHZlY3RvcjUpLCBNYXRoLlBJKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdhbmdsZUxHJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3J4LmFuZ2xlTEcodmVjdG9yeSksIE1hdGguUEkgLyAyKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodmVjdG9yeS5hbmdsZUxHKHZlY3RvcnopLCBNYXRoLlBJIC8gMikpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHZlY3RvcnguYW5nbGVMRyh2ZWN0b3J6KSwgTWF0aC5QSSAvIDIpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3IxLmFuZ2xlTEcodmVjdG9yMiksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3IxLmFuZ2xlTEcodmVjdG9yNSksIE1hdGguUEkpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2Nvc0FuZ2xlJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChNYXRoLmFjb3ModmVjdG9yeC5jb3NBbmdsZSh2ZWN0b3J5KSksIChNYXRoLlBJIC8gMikpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChNYXRoLmFjb3ModmVjdG9yeS5jb3NBbmdsZSh2ZWN0b3J6KSksIChNYXRoLlBJIC8gMikpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChNYXRoLmFjb3ModmVjdG9yeC5jb3NBbmdsZSh2ZWN0b3J6KSksIChNYXRoLlBJIC8gMikpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChNYXRoLmFjb3ModmVjdG9yMS5jb3NBbmdsZSh2ZWN0b3IyKSksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChNYXRoLmFjb3ModmVjdG9yMS5jb3NBbmdsZSh2ZWN0b3I1KSksIE1hdGguUEkpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2Nvc0FuZ2xlTEcnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKE1hdGguYWNvcyh2ZWN0b3J4LmNvc0FuZ2xlTEcodmVjdG9yeSkpLCAoTWF0aC5QSSAvIDIpKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwoTWF0aC5hY29zKHZlY3RvcnkuY29zQW5nbGVMRyh2ZWN0b3J6KSksIChNYXRoLlBJIC8gMikpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChNYXRoLmFjb3ModmVjdG9yeC5jb3NBbmdsZUxHKHZlY3RvcnopKSwgKE1hdGguUEkgLyAyKSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKE1hdGguYWNvcyh2ZWN0b3IxLmNvc0FuZ2xlTEcodmVjdG9yMikpLCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwoTWF0aC5hY29zKHZlY3RvcjEuY29zQW5nbGVMRyh2ZWN0b3I1KSksIE1hdGguUEkpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ21hZ25pdHVkZScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yeC5tYWduaXR1ZGUoKSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yeS5tYWduaXR1ZGUoKSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yei5tYWduaXR1ZGUoKSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodmVjdG9yMS5tYWduaXR1ZGUoKSwgTWF0aC5zcXJ0KDMpKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodmVjdG9yNS5tYWduaXR1ZGUoKSwgTWF0aC5zcXJ0KDMpKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodmVjdG9yMy5tYWduaXR1ZGUoKSwgTWF0aC5zcXJ0KDMwMCkpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ21hZ25pdHVkZVNxdWFyZWQnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcngubWFnbml0dWRlU3F1YXJlZCgpLCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3J5Lm1hZ25pdHVkZVNxdWFyZWQoKSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yei5tYWduaXR1ZGVTcXVhcmVkKCksIDEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcjEubWFnbml0dWRlU3F1YXJlZCgpLCAzKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3I1Lm1hZ25pdHVkZVNxdWFyZWQoKSwgMyk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yMy5tYWduaXR1ZGVTcXVhcmVkKCksIDMwMCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdkb3QnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcjEuZG90KHZlY3RvcjIpLCAzKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3IyLmRvdCh2ZWN0b3IzKSwgMzApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcjMuZG90KHZlY3RvcjUpLCAtMzApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcnguZG90KHZlY3RvcnkpLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3J4LmRvdCh2ZWN0b3J6KSwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yeS5kb3QodmVjdG9yeiksIDApO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnY3Jvc3MnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHQxID0gdmVjdG9yMTIzLmNyb3NzKHZlY3RvcjExMik7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yeC5jcm9zcyh2ZWN0b3J5KS5lcXVhbCh2ZWN0b3J6KSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yeS5jcm9zcyh2ZWN0b3J6KS5lcXVhbCh2ZWN0b3J4KSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yei5jcm9zcyh2ZWN0b3J4KS5lcXVhbCh2ZWN0b3J5KSk7XG4gICAgICAgICAgICBhc3NlcnQub2soIXZlY3RvcnkuY3Jvc3ModmVjdG9yeCkuZXF1YWwodmVjdG9yeikpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKCF2ZWN0b3J6LmNyb3NzKHZlY3RvcnkpLmVxdWFsKHZlY3RvcngpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayghdmVjdG9yeC5jcm9zcyh2ZWN0b3J6KS5lcXVhbCh2ZWN0b3J5KSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yeC5jcm9zcyh2ZWN0b3J5KS56LCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3J5LmNyb3NzKHZlY3RvcnopLngsIDEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcnouY3Jvc3ModmVjdG9yeCkueSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodDEueCwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodDEueSwgLTUpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQxLnosIDMpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnY3Jvc3NMRycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2ZWN0b3IxMjMuY3Jvc3NMRyh2ZWN0b3IxMTIsIHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzdWx0LngsIDEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlc3VsdC55LCAtNSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzdWx0LnosIDMpO1xuICAgICAgICAgICAgdmVjdG9yeC5jcm9zc0xHKHZlY3RvcnksIHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzdWx0LnosIDEpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHJlc3VsdC5lcXVhbCh2ZWN0b3J6KSk7XG4gICAgICAgICAgICB2ZWN0b3J5LmNyb3NzTEcodmVjdG9yeiwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXN1bHQueCwgMSk7XG4gICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKHZlY3RvcngpKTtcbiAgICAgICAgICAgIHZlY3RvcnouY3Jvc3NMRyh2ZWN0b3J4LCByZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlc3VsdC55LCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwodmVjdG9yeSkpO1xuICAgICAgICAgICAgdmVjdG9yeS5jcm9zc0xHKHZlY3RvcngsIHJlc3VsdClcbiAgICAgICAgICAgIGFzc2VydC5vayghcmVzdWx0LmVxdWFsKHZlY3RvcnopKTtcbiAgICAgICAgICAgIHZlY3RvcnouY3Jvc3NMRyh2ZWN0b3J5LCByZXN1bHQpXG4gICAgICAgICAgICBhc3NlcnQub2soIXJlc3VsdC5lcXVhbCh2ZWN0b3J4KSk7XG4gICAgICAgICAgICB2ZWN0b3J4LmNyb3NzTEcodmVjdG9yeiwgcmVzdWx0KVxuICAgICAgICAgICAgYXNzZXJ0Lm9rKCFyZXN1bHQuZXF1YWwodmVjdG9yeSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnbm9ybWFsaXplJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3IxMDB4Lm5vcm1hbGl6ZSgpLngsIDEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcjIwMHkubm9ybWFsaXplKCkueSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yMzAwei5ub3JtYWxpemUoKS56LCAxKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ25vcm1hbGl6ZUxHJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZlY3RvcjEwMHgubm9ybWFsaXplTEcocmVzdWx0KVxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlc3VsdC54LCAxKTtcbiAgICAgICAgICAgIHZlY3RvcjIwMHkubm9ybWFsaXplTEcocmVzdWx0KVxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlc3VsdC55LCAxKTtcbiAgICAgICAgICAgIHZlY3RvcjMwMHoubm9ybWFsaXplTEcocmVzdWx0KVxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlc3VsdC56LCAxKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3NjYWxlJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5vayh2ZWN0b3J4LnNjYWxlKDEwMCkuZXF1YWwodmVjdG9yMTAweCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3Rvcnkuc2NhbGUoMjAwKS5lcXVhbCh2ZWN0b3IyMDB5KSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yei5zY2FsZSgzMDApLmVxdWFsKHZlY3RvcjMwMHopKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh2ZWN0b3IxLnNjYWxlKDEwKS5lcXVhbCh2ZWN0b3IzKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yMS5zY2FsZSgxMSkuZXF1YWwodmVjdG9yNCkpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnc2NhbGVMRycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2ZWN0b3J4LnNjYWxlTEcoMTAwLCByZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHJlc3VsdC5lcXVhbCh2ZWN0b3IxMDB4KSk7XG4gICAgICAgICAgICB2ZWN0b3J5LnNjYWxlTEcoMjAwLCByZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHJlc3VsdC5lcXVhbCh2ZWN0b3IyMDB5KSk7XG4gICAgICAgICAgICB2ZWN0b3J6LnNjYWxlTEcoMzAwLCByZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHJlc3VsdC5lcXVhbCh2ZWN0b3IzMDB6KSk7XG4gICAgICAgICAgICB2ZWN0b3IxLnNjYWxlTEcoMTAsIHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKHZlY3RvcjMpKTtcbiAgICAgICAgICAgIHZlY3RvcjEuc2NhbGVMRygxMSwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwodmVjdG9yNCkpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnbmVnYXRlJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5vayh2ZWN0b3IxLm5lZ2F0ZSgpLmVxdWFsKHZlY3RvcjUpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh2ZWN0b3IxLm5lZ2F0ZSgpLm5lZ2F0ZSgpLmVxdWFsKHZlY3RvcjEpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ25lZ2F0ZUxHJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZlY3RvcjEubmVnYXRlTEcocmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwodmVjdG9yNSkpO1xuICAgICAgICAgICAgdmVjdG9yMS5uZWdhdGVMRyh0ZW1wMSk7XG4gICAgICAgICAgICB0ZW1wMS5uZWdhdGVMRyhyZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHJlc3VsdC5lcXVhbCh2ZWN0b3IxKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCd2ZWN0b3JQcm9qZWN0aW9uJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0MSA9IHZlY3RvcngudmVjdG9yUHJvamVjdGlvbih2ZWN0b3J5KTtcbiAgICAgICAgICAgIHZhciB0MiA9IHZlY3RvcjEudmVjdG9yUHJvamVjdGlvbih2ZWN0b3IzKTtcbiAgICAgICAgICAgIHZhciB0MyA9IHZlY3RvcjEyMy52ZWN0b3JQcm9qZWN0aW9uKHZlY3RvcjExMik7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodDEueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHQxLnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh0MS56LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodDIueCwgMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHQyLnksIDEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh0Mi56LCAxKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodDMueCwgLTEuMTY3KSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodDMueSwgMS4xNikpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHQzLnosIDIuMzMpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3ZlY3RvclByb2plY3Rpb25MRycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2ZWN0b3J4LnZlY3RvclByb2plY3Rpb25MRyh2ZWN0b3J5LCByZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC54LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueiwgMCkpO1xuICAgICAgICAgICAgdmVjdG9yMS52ZWN0b3JQcm9qZWN0aW9uTEcodmVjdG9yMywgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueCwgMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC55LCAxKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LnosIDEpKTtcbiAgICAgICAgICAgIHZlY3RvcjEyMy52ZWN0b3JQcm9qZWN0aW9uTEcodmVjdG9yMTEyLCByZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC54LCAtMS4xNjcpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueSwgMS4xNikpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC56LCAyLjMzKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdzY2FsYXJQcm9qZWN0aW9uJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3J4LnNjYWxhclByb2plY3Rpb24odmVjdG9yeSksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3J5LnNjYWxhclByb2plY3Rpb24odmVjdG9yeiksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3J5LnNjYWxhclByb2plY3Rpb24odmVjdG9yeiksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3IxLnNjYWxhclByb2plY3Rpb24odmVjdG9yMyksIDEuNzMpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3IxMjMuc2NhbGFyUHJvamVjdGlvbih2ZWN0b3IxMTIpLCAyLjg1KSk7XG4gICAgICAgIH0pO1xuICAgICAgICAvLyB0ZXN0KCd0cmFuc2Zvcm0nLCBmdW5jdGlvbigpe1xuICAgICAgICAvLyAgICAgLy8gVE9ETzogVGhpbmsgb2YgdGVzdCBjYXNlc1xuICAgICAgICAvLyAgICAgYXNzZXJ0LmVxdWFsKDEsIDIpO1xuICAgICAgICAvLyB9KTtcbiAgICAgICAgLy8gdGVzdCgndHJhbnNmb3JtTEcnLCBmdW5jdGlvbigpe1xuICAgICAgICAvLyAgICAgLy8gVE9ETzogVGhpbmsgb2YgdGVzdCBjYXNlc1xuICAgICAgICAvLyAgICAgYXNzZXJ0LmVxdWFsKDEsIDIpO1xuICAgICAgICAvLyB9KTtcbiAgICAgICAgdGVzdCgncm90YXRlJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciByb3QxID0gdmVjdG9yeC5yb3RhdGUodmVjdG9yeSwgTWF0aC5QSSAvIDIpO1xuICAgICAgICAgICAgdmFyIHJvdDIgPSB2ZWN0b3J4LnJvdGF0ZSh2ZWN0b3J5LCBNYXRoLlBJKTtcbiAgICAgICAgICAgIHZhciByb3QzID0gdmVjdG9yeC5yb3RhdGUodmVjdG9yeSwgKCgzKk1hdGguUEkpIC8gMikpO1xuICAgICAgICAgICAgdmFyIHJvdDQgPSB2ZWN0b3J4LnJvdGF0ZSh2ZWN0b3J5LCAyKk1hdGguUEkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueiwgLTEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QyLngsIC0xKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90Mi55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90Mi56LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90My54LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90My55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90My56LCAxKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90NC54LCAxKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90NC55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90NC56LCAwKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdyb3RhdGUnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmVjdG9yeC5yb3RhdGVMRyh2ZWN0b3J5LCBNYXRoLlBJIC8gMiwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LnosIC0xKSk7XG4gICAgICAgICAgICB2ZWN0b3J4LnJvdGF0ZUxHKHZlY3RvcnksIE1hdGguUEksIHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LngsIC0xKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueiwgMCkpO1xuICAgICAgICAgICAgdmVjdG9yeC5yb3RhdGVMRyh2ZWN0b3J5LCAoKDMqTWF0aC5QSSkgLyAyKSwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LnosIDEpKTtcbiAgICAgICAgICAgIHZlY3Rvcngucm90YXRlTEcodmVjdG9yeSwgMipNYXRoLlBJLCByZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC54LCAxKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueiwgMCkpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgncm90YXRlWCcsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgcm90MSA9IHZlY3Rvcnoucm90YXRlWChNYXRoLlBJIC8gMik7XG4gICAgICAgICAgICB2YXIgcm90MiA9IHZlY3Rvcnoucm90YXRlWChNYXRoLlBJKTtcbiAgICAgICAgICAgIHZhciByb3QzID0gdmVjdG9yei5yb3RhdGVYKCgoMypNYXRoLlBJKSAvIDIpKTtcbiAgICAgICAgICAgIHZhciByb3Q0ID0gdmVjdG9yei5yb3RhdGVYKDIqTWF0aC5QSSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90MS54LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90MS55LCAtMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueiwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDIueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDIueSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDIueiwgLTEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QzLngsIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QzLnksIDEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QzLnosIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3Q0LngsIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3Q0LnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3Q0LnosIDEpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3JvdGF0ZVhMRycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2ZWN0b3J6LnJvdGF0ZVhMRyhNYXRoLlBJIC8gMiwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC55LCAtMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC56LCAwKSk7XG4gICAgICAgICAgICB2ZWN0b3J6LnJvdGF0ZVhMRyhNYXRoLlBJLCByZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC54LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueiwgLTEpKTtcbiAgICAgICAgICAgIHZlY3Rvcnoucm90YXRlWExHKCgoMypNYXRoLlBJKSAvIDIpLCByZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC54LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LnksIDEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueiwgMCkpO1xuICAgICAgICAgICAgdmVjdG9yei5yb3RhdGVYTEcoMipNYXRoLlBJLCByZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC54LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueiwgMSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgncm90YXRlWScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgcm90MSA9IHZlY3Rvcngucm90YXRlWShNYXRoLlBJIC8gMik7XG4gICAgICAgICAgICB2YXIgcm90MiA9IHZlY3Rvcngucm90YXRlWShNYXRoLlBJKTtcbiAgICAgICAgICAgIHZhciByb3QzID0gdmVjdG9yeC5yb3RhdGVZKCgoMypNYXRoLlBJKSAvIDIpKTtcbiAgICAgICAgICAgIHZhciByb3Q0ID0gdmVjdG9yeC5yb3RhdGVZKDIqTWF0aC5QSSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90MS54LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90MS55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90MS56LCAtMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDIueCwgLTEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QyLnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QyLnosIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QzLngsIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QzLnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QzLnosIDEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3Q0LngsIDEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3Q0LnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3Q0LnosIDApKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3JvdGF0ZVlMRycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2ZWN0b3J4LnJvdGF0ZVlMRyhNYXRoLlBJIC8gMiwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LnosIC0xKSk7XG4gICAgICAgICAgICB2ZWN0b3J4LnJvdGF0ZVlMRyhNYXRoLlBJLCByZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC54LCAtMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LnosIDApKTtcbiAgICAgICAgICAgIHZlY3Rvcngucm90YXRlWUxHKCgoMypNYXRoLlBJKSAvIDIpLCByZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC54LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueiwgMSkpO1xuICAgICAgICAgICAgdmVjdG9yeC5yb3RhdGVZTEcoMipNYXRoLlBJLCByZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC54LCAxKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueiwgMCkpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgncm90YXRlWicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgcm90MSA9IHZlY3Rvcnkucm90YXRlWihNYXRoLlBJIC8gMik7XG4gICAgICAgICAgICB2YXIgcm90MiA9IHZlY3Rvcnkucm90YXRlWihNYXRoLlBJKTtcbiAgICAgICAgICAgIHZhciByb3QzID0gdmVjdG9yeS5yb3RhdGVaKCgoMypNYXRoLlBJKSAvIDIpKTtcbiAgICAgICAgICAgIHZhciByb3Q0ID0gdmVjdG9yeS5yb3RhdGVaKDIqTWF0aC5QSSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90MS54LCAtMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueiwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDIueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDIueSwgLTEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QyLnosIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QzLngsIDEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QzLnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QzLnosIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3Q0LngsIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3Q0LnksIDEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3Q0LnosIDApKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3JvdGF0ZVpMRycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2ZWN0b3J5LnJvdGF0ZVpMRyhNYXRoLlBJIC8gMiwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueCwgLTEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC56LCAwKSk7XG4gICAgICAgICAgICB2ZWN0b3J5LnJvdGF0ZVpMRyhNYXRoLlBJLCByZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC54LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LnksIC0xKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LnosIDApKTtcbiAgICAgICAgICAgIHZlY3Rvcnkucm90YXRlWkxHKCgoMypNYXRoLlBJKSAvIDIpLCByZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC54LCAxKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueiwgMCkpO1xuICAgICAgICAgICAgdmVjdG9yeS5yb3RhdGVaTEcoMipNYXRoLlBJLCByZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC54LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LnksIDEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueiwgMCkpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgncm90YXRlUGl0Y2hZYXdSb2xsJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciByb3QxID0gdmVjdG9yeC5yb3RhdGVQaXRjaFlhd1JvbGwoTWF0aC5QSSAvIDIsIE1hdGguUEkgLyAyLCBNYXRoLlBJIC8gMik7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90MS54LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90MS55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90MS56LCAtMSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgncm90YXRlUGl0Y2hZYXdSb2xsTEcnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmVjdG9yeC5yb3RhdGVQaXRjaFlhd1JvbGxMRyhNYXRoLlBJIC8gMiwgTWF0aC5QSSAvIDIsIE1hdGguUEkgLyAyLCByZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC54LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueiwgLTEpKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59KTsiXX0=
(8)
});
